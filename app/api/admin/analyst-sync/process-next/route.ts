import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/db/prisma";
import { getAllActiveNasdaq100Symbols } from "@/src/lib/data/admin-universes";
import { fetchFmpPriceTargetConsensus } from "@/src/lib/market-data/providers/fmp";
import { fetchFinnhubAnalystData } from "@/src/lib/market-data/providers/finnhub";
import { isValidNumber } from "@/src/lib/market-data/safe-update";

const ANALYST_SYNC_TYPE = "analyst-data-nasdaq100-sync";
const CHUNK_SIZE = 10;
// One FMP call + one Finnhub call per symbol, run in parallel.
// Pacing respects Finnhub free plan (~60 calls/min): ≥1200ms between symbol starts.
const SYMBOL_DELAY_MS = 1200;

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
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
      type: ANALYST_SYNC_TYPE,
      status: { in: ["running", "partial_success"] },
    },
    orderBy: { startedAt: "desc" },
    select: {
      id: true,
      type: true,
      provider: true,
      status: true,
      requestedCount: true,
      processedCount: true,
      currentSymbol: true,
      successCount: true,
      skippedCount: true,
      failedCount: true,
      startedAt: true,
      finishedAt: true,
      durationMs: true,
      message: true,
    },
  });

  if (!run) {
    return NextResponse.json({ error: "No active analyst sync run found." }, { status: 404 });
  }

  if (run.status === "partial_success") {
    await prisma.syncRun.update({
      where: { id: run.id },
      data: { status: "running", finishedAt: null, message: null },
    });
  }

  const allSymbols = await getAllActiveNasdaq100Symbols();

  const processedItems = await prisma.syncRunItem.findMany({
    where: { syncRunId: run.id },
    select: { symbol: true },
  });
  const processedSet = new Set(processedItems.map((i) => i.symbol));

  const remaining = allSymbols.filter((s) => !processedSet.has(s));

  if (remaining.length === 0) {
    const finishedAt = new Date();
    const durationMs = finishedAt.getTime() - run.startedAt.getTime();
    const finalStatus =
      run.failedCount > 0 && run.successCount === 0
        ? "failed"
        : run.failedCount > 0 || run.skippedCount > 0
        ? "partial_success"
        : "success";

    const updated = await prisma.syncRun.update({
      where: { id: run.id },
      data: {
        status: finalStatus,
        finishedAt,
        durationMs,
        currentSymbol: null,
        message: `All ${run.requestedCount} stocks processed.`,
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

  const chunk = remaining.slice(0, CHUNK_SIZE);

  let rateLimitHit = false;
  let localSuccess = 0;
  let localSkipped = 0;
  let localFailed = 0;
  let lastSymbolEndedAt = 0;

  const newItems: Array<{
    syncRunId: string;
    symbol: string;
    status: string;
    reason: string | null;
    dbAction: string;
  }> = [];

  for (const symbol of chunk) {
    if (rateLimitHit) {
      newItems.push({
        syncRunId: run.id,
        symbol,
        status: "skipped",
        reason: "Skipped after rate limit",
        dbAction: "kept_existing",
      });
      localSkipped++;
      continue;
    }

    // Pace between symbols to respect Finnhub rate limits
    const elapsed = Date.now() - lastSymbolEndedAt;
    if (lastSymbolEndedAt > 0 && elapsed < SYMBOL_DELAY_MS) {
      await sleep(SYMBOL_DELAY_MS - elapsed);
    }

    await prisma.syncRun.update({
      where: { id: run.id },
      data: { currentSymbol: symbol },
    });

    const stock = await prisma.stock.findUnique({
      where: { symbol },
      include: { quote: true, analystData: true },
    });

    if (!stock) {
      newItems.push({
        syncRunId: run.id,
        symbol,
        status: "skipped",
        reason: "Symbol not found in DB",
        dbAction: "not_found",
      });
      localSkipped++;
      lastSymbolEndedAt = Date.now();
      continue;
    }

    // ── Provider composition ───────────────────────────────────────────────
    // FMP: price-target-consensus → targetConsensus, targetHigh, targetLow, targetMedian
    // Finnhub: /stock/recommendation → strongBuy/buy/hold/sell/strongSell counts + rating
    // Both called in parallel; each failure handled independently.
    const [fmpResult, finnhubResult] = await Promise.all([
      fetchFmpPriceTargetConsensus(symbol),
      fetchFinnhubAnalystData(symbol),
    ]);

    lastSymbolEndedAt = Date.now();

    // Finnhub rate limit stops the chunk
    if (!finnhubResult.ok && finnhubResult.error?.includes("429")) {
      rateLimitHit = true;
      newItems.push({
        syncRunId: run.id,
        symbol,
        status: "skipped",
        reason: "Finnhub rate limit reached",
        dbAction: "kept_existing",
      });
      localSkipped++;
      continue;
    }

    // FMP quota exceeded stops the chunk
    if (!fmpResult.ok && fmpResult.quotaExceeded) {
      rateLimitHit = true;
      newItems.push({
        syncRunId: run.id,
        symbol,
        status: "skipped",
        reason: "FMP quota exceeded",
        dbAction: "kept_existing",
      });
      localSkipped++;
      continue;
    }

    // If both providers returned no usable data, count as failure
    if (!fmpResult.ok && !finnhubResult.ok) {
      newItems.push({
        syncRunId: run.id,
        symbol,
        status: "failed",
        reason: `FMP: ${fmpResult.error ?? "unknown"}; Finnhub: ${finnhubResult.error ?? "unknown"}`,
        dbAction: "kept_existing",
      });
      localFailed++;
      continue;
    }

    const now = new Date();

    // ── Compose target data from FMP ───────────────────────────────────────
    // targetConsensus is stored as both targetPrice and targetMean (primary consensus value)
    const fmpData = fmpResult.ok ? (fmpResult.data ?? null) : null;
    const targetConsensus = fmpData?.targetConsensus ?? null;
    const targetHigh = fmpData?.targetHigh ?? null;
    const targetLow = fmpData?.targetLow ?? null;
    const targetMedian = fmpData?.targetMedian ?? null;

    const targetPrice = isValidNumber(targetConsensus) ? targetConsensus : null;
    const targetMean = targetPrice; // consensus = primary price, stored in both fields

    // ── Compose recommendation data from Finnhub ───────────────────────────
    const finnhubData = finnhubResult.ok ? (finnhubResult.data ?? null) : null;
    const strongBuyCount = finnhubData?.strongBuyCount ?? null;
    const buyCount = finnhubData?.buyCount ?? null;
    const holdCount = finnhubData?.holdCount ?? null;
    const sellCount = finnhubData?.sellCount ?? null;
    const strongSellCount = finnhubData?.strongSellCount ?? null;
    const analystCount = finnhubData?.analystCount ?? null;
    const analystRating = finnhubData?.analystRating ?? null;

    // ── Calculate upside internally from stored quote price ────────────────
    const currentPrice = stock.quote ? Number(stock.quote.price) : null;
    let analystUpsidePercent: number | null = null;
    if (targetPrice !== null && currentPrice !== null && currentPrice > 0) {
      analystUpsidePercent = ((targetPrice - currentPrice) / currentPrice) * 100;
    }

    const existing = stock.analystData;
    const isNew = !existing;
    const hasTarget = targetPrice !== null;

    // Determine targetStatus:
    // - Valid consensus → "has_target" (also repairs old has_target+null-price rows)
    // - No consensus, existing was "has_target" with null price (old bad row) → "no_target_available"
    // - No consensus, other existing status → preserve existing status
    const newTargetStatus = hasTarget
      ? "has_target"
      : existing?.targetStatus === "has_target" && existing?.targetPrice === null
      ? "no_target_available"
      : (existing?.targetStatus ?? null);

    const safeNum = (v: number | null) => (isValidNumber(v) ? v : null);
    const safeInt = (v: number | null) => (v !== null && Number.isFinite(v) ? Math.round(v) : null);

    try {
      await prisma.stockAnalystData.upsert({
        where: { stockId: stock.id },
        create: {
          stockId: stock.id,
          targetPrice: safeNum(targetPrice),
          targetMean: safeNum(targetMean),
          targetHigh: safeNum(targetHigh),
          targetLow: safeNum(targetLow),
          targetMedian: safeNum(targetMedian),
          analystUpsidePercent:
            analystUpsidePercent !== null && Number.isFinite(analystUpsidePercent)
              ? analystUpsidePercent
              : null,
          analystRating: analystRating ?? null,
          analystCount: safeInt(analystCount),
          strongBuyCount: safeInt(strongBuyCount),
          buyCount: safeInt(buyCount),
          holdCount: safeInt(holdCount),
          sellCount: safeInt(sellCount),
          strongSellCount: safeInt(strongSellCount),
          source: "fmp+finnhub",
          lastSyncedAt: now,
          sourceUpdatedAt: null,
          targetStatus: newTargetStatus,
          targetLastAttemptedAt: now,
          targetLastFoundAt: hasTarget ? now : null,
        },
        update: {
          targetPrice: safeNum(targetPrice) ?? existing?.targetPrice ?? null,
          targetMean: safeNum(targetMean) ?? existing?.targetMean ?? null,
          targetHigh: safeNum(targetHigh) ?? existing?.targetHigh ?? null,
          targetLow: safeNum(targetLow) ?? existing?.targetLow ?? null,
          targetMedian: safeNum(targetMedian) ?? existing?.targetMedian ?? null,
          analystUpsidePercent:
            analystUpsidePercent !== null && Number.isFinite(analystUpsidePercent)
              ? analystUpsidePercent
              : (existing?.analystUpsidePercent ?? null),
          analystRating: analystRating ?? existing?.analystRating ?? null,
          analystCount: safeInt(analystCount) ?? existing?.analystCount ?? null,
          strongBuyCount: safeInt(strongBuyCount) ?? existing?.strongBuyCount ?? null,
          buyCount: safeInt(buyCount) ?? existing?.buyCount ?? null,
          holdCount: safeInt(holdCount) ?? existing?.holdCount ?? null,
          sellCount: safeInt(sellCount) ?? existing?.sellCount ?? null,
          strongSellCount: safeInt(strongSellCount) ?? existing?.strongSellCount ?? null,
          source: "fmp+finnhub",
          lastSyncedAt: now,
          targetStatus: newTargetStatus,
          targetLastAttemptedAt: now,
          targetLastFoundAt: hasTarget ? now : (existing?.targetLastFoundAt ?? null),
        },
      });

      localSuccess++;
      newItems.push({
        syncRunId: run.id,
        symbol,
        status: "success",
        reason: isNew ? "created_analyst_data" : "updated_analyst_data",
        dbAction: isNew ? "created" : "updated",
      });
    } catch {
      localFailed++;
      newItems.push({
        syncRunId: run.id,
        symbol,
        status: "failed",
        reason: "DB upsert error",
        dbAction: "kept_existing",
      });
    }
  }

  if (newItems.length > 0) {
    await prisma.syncRunItem.createMany({ data: newItems });
  }

  const newProcessed = run.processedCount + newItems.length;
  const newSuccess = run.successCount + localSuccess;
  const newSkipped = run.skippedCount + localSkipped;
  const newFailed = run.failedCount + localFailed;

  const isLastChunk = remaining.length <= chunk.length;
  const shouldFinish = isLastChunk || rateLimitHit;

  let updateData: Parameters<typeof prisma.syncRun.update>[0]["data"] = {
    processedCount: newProcessed,
    successCount: newSuccess,
    skippedCount: newSkipped,
    failedCount: newFailed,
    currentSymbol: shouldFinish ? null : undefined,
  };

  if (shouldFinish) {
    const finishedAt = new Date();
    const durationMs = finishedAt.getTime() - run.startedAt.getTime();
    const finalStatus =
      newSuccess === 0
        ? "failed"
        : newFailed > 0 || newSkipped > 0 || !isLastChunk
        ? "partial_success"
        : "success";

    updateData = {
      ...updateData,
      status: finalStatus,
      finishedAt,
      durationMs,
      message: rateLimitHit
        ? "Rate limit reached. Continue the sync after waiting."
        : `Completed. ${newSuccess} updated, ${newSkipped} skipped, ${newFailed} failed.`,
    };
  }

  const updated = await prisma.syncRun.update({
    where: { id: run.id },
    data: updateData,
    select: {
      id: true, type: true, provider: true, status: true,
      requestedCount: true, processedCount: true, currentSymbol: true,
      successCount: true, skippedCount: true, failedCount: true,
      startedAt: true, finishedAt: true, durationMs: true, message: true,
    },
  });

  return NextResponse.json({ progress: serializeRun(updated), done: shouldFinish });
}
