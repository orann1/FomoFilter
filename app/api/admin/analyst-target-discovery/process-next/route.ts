import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/db/prisma";
import { fetchFmpPriceTargetSummary } from "@/src/lib/market-data/providers/fmp";
import {
  getEligibleTargetDiscoverySymbols,
  CHUNK_SIZE,
  MAX_ATTEMPTS_PER_RUN,
  MAX_TARGETS_FOUND_PER_RUN,
  TARGET_COOLDOWN_HAS_TARGET_DAYS,
  TARGET_COOLDOWN_NO_TARGET_DAYS,
  TARGET_COOLDOWN_PROVIDER_ERROR_DAYS,
  TARGET_COOLDOWN_PLAN_LIMITED_DAYS,
} from "@/src/lib/data/admin-analyst-target";
import { isValidNumber } from "@/src/lib/market-data/safe-update";

const TARGET_DISCOVERY_SYNC_TYPE = "analyst-target-discovery-sync";

function daysFromNow(days: number): Date {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

function serializeRun(run: {
  id: string;
  type: string;
  provider: string;
  status: string;
  requestedCount: number;
  processedCount: number;
  currentSymbol: string | null;
  successCount: number;
  skippedCount: number;
  failedCount: number;
  startedAt: Date;
  finishedAt: Date | null;
  durationMs: number | null;
  message: string | null;
}) {
  return {
    id: run.id,
    type: run.type,
    provider: run.provider,
    status: run.status,
    requestedCount: run.requestedCount,
    processedCount: run.processedCount,
    currentSymbol: run.currentSymbol,
    successCount: run.successCount,
    skippedCount: run.skippedCount,
    failedCount: run.failedCount,
    startedAt: run.startedAt.toISOString(),
    finishedAt: run.finishedAt?.toISOString() ?? null,
    durationMs: run.durationMs,
    message: run.message,
  };
}

export async function POST() {
  const run = await prisma.syncRun.findFirst({
    where: {
      type: TARGET_DISCOVERY_SYNC_TYPE,
      status: { in: ["running", "partial_success"] },
    },
    orderBy: { startedAt: "desc" },
    select: {
      id: true, type: true, provider: true, status: true,
      requestedCount: true, processedCount: true, currentSymbol: true,
      successCount: true, skippedCount: true, failedCount: true,
      startedAt: true, finishedAt: true, durationMs: true, message: true,
    },
  });

  if (!run) {
    return NextResponse.json({ error: "No active target discovery run found." }, { status: 404 });
  }

  if (run.status === "partial_success") {
    await prisma.syncRun.update({
      where: { id: run.id },
      data: { status: "running", finishedAt: null, message: null },
    });
  }

  // Check run-level limits against what has already been attempted in this run
  if (run.processedCount >= MAX_ATTEMPTS_PER_RUN) {
    const finishedAt = new Date();
    const updated = await prisma.syncRun.update({
      where: { id: run.id },
      data: {
        status: "partial_success",
        finishedAt,
        durationMs: finishedAt.getTime() - run.startedAt.getTime(),
        currentSymbol: null,
        message: `Target discovery paused after ${MAX_ATTEMPTS_PER_RUN} attempts to protect provider quota. Continue later.`,
      },
      select: {
        id: true, type: true, provider: true, status: true,
        requestedCount: true, processedCount: true, currentSymbol: true,
        successCount: true, skippedCount: true, failedCount: true,
        startedAt: true, finishedAt: true, durationMs: true, message: true,
      },
    });
    return NextResponse.json({ progress: serializeRun(updated), done: true });
  }

  if (run.successCount >= MAX_TARGETS_FOUND_PER_RUN) {
    const finishedAt = new Date();
    const updated = await prisma.syncRun.update({
      where: { id: run.id },
      data: {
        status: "partial_success",
        finishedAt,
        durationMs: finishedAt.getTime() - run.startedAt.getTime(),
        currentSymbol: null,
        message: `Target discovery paused after finding ${MAX_TARGETS_FOUND_PER_RUN} targets. Continue later to scan more symbols.`,
      },
      select: {
        id: true, type: true, provider: true, status: true,
        requestedCount: true, processedCount: true, currentSymbol: true,
        successCount: true, skippedCount: true, failedCount: true,
        startedAt: true, finishedAt: true, durationMs: true, message: true,
      },
    });
    return NextResponse.json({ progress: serializeRun(updated), done: true });
  }

  // Determine symbols processed in this run
  const processedItems = await prisma.syncRunItem.findMany({
    where: { syncRunId: run.id },
    select: { symbol: true },
  });
  const processedInRunSet = new Set(processedItems.map((i) => i.symbol));

  // Get all currently eligible symbols and remove ones already attempted in this run
  const eligible = await getEligibleTargetDiscoverySymbols();
  const remaining = eligible.filter((s) => !processedInRunSet.has(s));

  if (remaining.length === 0) {
    const finishedAt = new Date();
    const finalStatus =
      run.failedCount > 0 && run.successCount === 0
        ? "failed"
        : run.failedCount > 0
        ? "partial_success"
        : "success";
    const updated = await prisma.syncRun.update({
      where: { id: run.id },
      data: {
        status: finalStatus,
        finishedAt,
        durationMs: finishedAt.getTime() - run.startedAt.getTime(),
        currentSymbol: null,
        message: "No eligible symbols to scan. Targets are fresh or waiting for retry cooldown.",
      },
      select: {
        id: true, type: true, provider: true, status: true,
        requestedCount: true, processedCount: true, currentSymbol: true,
        successCount: true, skippedCount: true, failedCount: true,
        startedAt: true, finishedAt: true, durationMs: true, message: true,
      },
    });
    return NextResponse.json({ progress: serializeRun(updated), done: true });
  }

  // Determine how many we can still attempt in this run
  const attemptsRemaining = MAX_ATTEMPTS_PER_RUN - run.processedCount;
  const targetsRemaining = MAX_TARGETS_FOUND_PER_RUN - run.successCount;
  const maxThisChunk = Math.min(CHUNK_SIZE, attemptsRemaining, remaining.length);
  const chunk = remaining.slice(0, maxThisChunk);

  let quotaHit = false;
  let localSuccess = 0;
  let localSkipped = 0;
  let localFailed = 0;
  let localTargetsFound = run.successCount;

  const newItems: Array<{
    syncRunId: string;
    symbol: string;
    status: string;
    reason: string | null;
    dbAction: string;
  }> = [];

  for (const symbol of chunk) {
    if (quotaHit) break;
    if (localTargetsFound >= MAX_TARGETS_FOUND_PER_RUN) break;

    await prisma.syncRun.update({
      where: { id: run.id },
      data: { currentSymbol: symbol },
    });

    const stock = await prisma.stock.findUnique({
      where: { symbol },
      include: { quote: true, analystData: true },
    });

    if (!stock) {
      newItems.push({ syncRunId: run.id, symbol, status: "skipped", reason: "Symbol not in DB", dbAction: "not_found" });
      localSkipped++;
      continue;
    }

    const now = new Date();
    const result = await fetchFmpPriceTargetSummary(symbol);

    if (!result.ok) {
      if (result.quotaExceeded) {
        quotaHit = true;
        // Mark this symbol as quota_blocked
        await prisma.stockAnalystData.upsert({
          where: { stockId: stock.id },
          create: {
            stockId: stock.id,
            targetStatus: "quota_blocked",
            targetLastAttemptedAt: now,
            targetNextRetryAt: daysFromNow(1),
            targetAttemptCount: 1,
            targetLastMessage: "FMP quota reached",
          },
          update: {
            targetStatus: "quota_blocked",
            targetLastAttemptedAt: now,
            targetNextRetryAt: daysFromNow(1),
            targetAttemptCount: { increment: 1 },
            targetLastMessage: "FMP quota reached",
          },
        });
        newItems.push({ syncRunId: run.id, symbol, status: "skipped", reason: "FMP quota reached", dbAction: "kept_existing" });
        localSkipped++;
        break;
      }

      if (result.planLimited) {
        // HTTP 402 — FMP plan does not include price target for this symbol.
        // Preserve any existing target data. Retry only after 90 days.
        await prisma.stockAnalystData.upsert({
          where: { stockId: stock.id },
          create: {
            stockId: stock.id,
            targetStatus: "plan_limited",
            targetLastAttemptedAt: now,
            targetNextRetryAt: daysFromNow(TARGET_COOLDOWN_PLAN_LIMITED_DAYS),
            targetAttemptCount: 1,
            targetLastMessage: "FMP price target data is not available for this symbol on the current plan.",
          },
          update: {
            targetStatus: "plan_limited",
            targetLastAttemptedAt: now,
            targetNextRetryAt: daysFromNow(TARGET_COOLDOWN_PLAN_LIMITED_DAYS),
            targetAttemptCount: { increment: 1 },
            targetLastMessage: "FMP price target data is not available for this symbol on the current plan.",
            // Existing target price fields are not touched — preserved as-is
          },
        });
        newItems.push({ syncRunId: run.id, symbol, status: "skipped", reason: "FMP plan does not include price target", dbAction: "plan_limited" });
        localSkipped++;
        continue;
      }

      if (result.error === "empty") {
        // Provider returned empty array — no target data available
        const existing = stock.analystData;
        await prisma.stockAnalystData.upsert({
          where: { stockId: stock.id },
          create: {
            stockId: stock.id,
            targetStatus: "no_target_available",
            targetLastAttemptedAt: now,
            targetNextRetryAt: daysFromNow(TARGET_COOLDOWN_NO_TARGET_DAYS),
            targetAttemptCount: 1,
            targetLastMessage: "FMP returned empty array",
          },
          update: {
            // Preserve existing target price if present — do NOT overwrite with null
            targetStatus: "no_target_available",
            targetLastAttemptedAt: now,
            targetNextRetryAt: daysFromNow(TARGET_COOLDOWN_NO_TARGET_DAYS),
            targetAttemptCount: { increment: 1 },
            targetLastMessage: "FMP returned empty array",
            // Only set target fields if they were not previously populated
            ...(existing?.targetPrice == null
              ? { targetPrice: null, targetMean: null, targetHigh: null, targetLow: null, targetMedian: null }
              : {}),
          },
        });
        newItems.push({ syncRunId: run.id, symbol, status: "skipped", reason: "No target data from FMP", dbAction: "no_data" });
        localSkipped++;
        continue;
      }

      // Provider error (non-quota)
      await prisma.stockAnalystData.upsert({
        where: { stockId: stock.id },
        create: {
          stockId: stock.id,
          targetStatus: "provider_error",
          targetLastAttemptedAt: now,
          targetNextRetryAt: daysFromNow(TARGET_COOLDOWN_PROVIDER_ERROR_DAYS),
          targetAttemptCount: 1,
          targetLastMessage: result.error.slice(0, 300),
        },
        update: {
          targetStatus: "provider_error",
          targetLastAttemptedAt: now,
          targetNextRetryAt: daysFromNow(TARGET_COOLDOWN_PROVIDER_ERROR_DAYS),
          targetAttemptCount: { increment: 1 },
          targetLastMessage: result.error.slice(0, 300),
        },
      });
      newItems.push({ syncRunId: run.id, symbol, status: "failed", reason: result.error.slice(0, 200), dbAction: "kept_existing" });
      localFailed++;
      continue;
    }

    // Target data found
    const d = result.data;
    const targetMean = isValidNumber(d.targetMean) ? d.targetMean : null;
    const currentPrice = stock.quote ? Number(stock.quote.price) : null;
    let analystUpsidePercent: number | null = null;
    if (targetMean !== null && currentPrice !== null && currentPrice > 0) {
      analystUpsidePercent = ((targetMean - currentPrice) / currentPrice) * 100;
    }

    await prisma.stockAnalystData.upsert({
      where: { stockId: stock.id },
      create: {
        stockId: stock.id,
        targetPrice: targetMean,
        analystUpsidePercent: analystUpsidePercent !== null && Number.isFinite(analystUpsidePercent) ? analystUpsidePercent : null,
        targetHigh: isValidNumber(d.targetHigh) ? d.targetHigh : null,
        targetLow: isValidNumber(d.targetLow) ? d.targetLow : null,
        targetMedian: isValidNumber(d.targetMedian) ? d.targetMedian : null,
        targetMean: targetMean,
        source: "fmp",
        lastSyncedAt: now,
        targetStatus: "has_target",
        targetLastAttemptedAt: now,
        targetLastFoundAt: now,
        targetNextRetryAt: daysFromNow(TARGET_COOLDOWN_HAS_TARGET_DAYS),
        targetAttemptCount: 1,
        targetLastMessage: null,
      },
      update: {
        targetPrice: targetMean,
        analystUpsidePercent: analystUpsidePercent !== null && Number.isFinite(analystUpsidePercent) ? analystUpsidePercent : null,
        targetHigh: isValidNumber(d.targetHigh) ? d.targetHigh : null,
        targetLow: isValidNumber(d.targetLow) ? d.targetLow : null,
        targetMedian: isValidNumber(d.targetMedian) ? d.targetMedian : null,
        targetMean: targetMean,
        source: "fmp",
        lastSyncedAt: now,
        targetStatus: "has_target",
        targetLastAttemptedAt: now,
        targetLastFoundAt: now,
        targetNextRetryAt: daysFromNow(TARGET_COOLDOWN_HAS_TARGET_DAYS),
        targetAttemptCount: { increment: 1 },
        targetLastMessage: null,
      },
    });

    newItems.push({ syncRunId: run.id, symbol, status: "success", reason: "Target price found", dbAction: stock.analystData ? "updated" : "created" });
    localSuccess++;
    localTargetsFound++;
  }

  if (newItems.length > 0) {
    await prisma.syncRunItem.createMany({ data: newItems });
  }

  const newProcessed = run.processedCount + newItems.filter((i) => i.status !== "skipped" || i.reason !== "Skipped after rate limit").length;
  const newSuccess = run.successCount + localSuccess;
  const newSkipped = run.skippedCount + localSkipped;
  const newFailed = run.failedCount + localFailed;

  // Determine if we should stop
  const totalAttempted = run.processedCount + chunk.length;
  const hitsAttemptLimit = totalAttempted >= MAX_ATTEMPTS_PER_RUN;
  const hitsTargetLimit = newSuccess >= MAX_TARGETS_FOUND_PER_RUN;
  const noMoreEligible = remaining.length <= chunk.length;
  const shouldFinish = quotaHit || hitsAttemptLimit || hitsTargetLimit || noMoreEligible;

  let finalMessage: string | undefined;
  let finalStatus: string | undefined;

  if (shouldFinish) {
    if (quotaHit) {
      finalMessage = "FMP quota reached. Continue target discovery tomorrow.";
      finalStatus = "partial_success";
    } else if (hitsTargetLimit) {
      finalMessage = `Target discovery paused after finding ${MAX_TARGETS_FOUND_PER_RUN} targets. Continue later to scan more symbols.`;
      finalStatus = "partial_success";
    } else if (hitsAttemptLimit) {
      finalMessage = `Target discovery paused after ${MAX_ATTEMPTS_PER_RUN} attempts to protect provider quota. Continue later.`;
      finalStatus = "partial_success";
    } else {
      // noMoreEligible
      finalMessage = "Target discovery completed for all currently eligible symbols.";
      finalStatus = newSuccess === 0 && newFailed > 0 ? "failed" : newFailed > 0 || newSkipped > 0 ? "partial_success" : "success";
    }
  }

  const finishedAt = shouldFinish ? new Date() : undefined;
  const updated = await prisma.syncRun.update({
    where: { id: run.id },
    data: {
      processedCount: newProcessed,
      successCount: newSuccess,
      skippedCount: newSkipped,
      failedCount: newFailed,
      currentSymbol: shouldFinish ? null : undefined,
      ...(shouldFinish
        ? {
            status: finalStatus,
            finishedAt,
            durationMs: finishedAt ? finishedAt.getTime() - run.startedAt.getTime() : null,
            message: finalMessage,
          }
        : {}),
    },
    select: {
      id: true, type: true, provider: true, status: true,
      requestedCount: true, processedCount: true, currentSymbol: true,
      successCount: true, skippedCount: true, failedCount: true,
      startedAt: true, finishedAt: true, durationMs: true, message: true,
    },
  });

  return NextResponse.json({ progress: serializeRun(updated), done: shouldFinish });
}
