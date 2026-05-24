import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/db/prisma";
import { getAllActiveNasdaq100Symbols } from "@/src/lib/data/admin-universes";
import {
  fetchFinnhubQuote,
  fetchFinnhubBasicFinancials,
} from "@/src/lib/market-data/providers/finnhub";
import { isValidNumber } from "@/src/lib/market-data/safe-update";

const CHUNKED_SYNC_TYPE = "market-data-nasdaq100-chunked-sync";
const CHUNK_SIZE = 10;
const CALL_DELAY_MS = 1100; // call-start pacing — ≥1.1s between Finnhub calls

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
  // Find the active or most-recently-partial run to continue
  const run = await prisma.syncRun.findFirst({
    where: {
      type: CHUNKED_SYNC_TYPE,
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
    return NextResponse.json({ error: "No active sync run found." }, { status: 404 });
  }

  // If the run was partial_success, re-open it so it can continue
  if (run.status === "partial_success") {
    await prisma.syncRun.update({
      where: { id: run.id },
      data: { status: "running", finishedAt: null, message: null },
    });
  }

  const allSymbols = await getAllActiveNasdaq100Symbols();

  // Source of truth: which symbols already have a SyncRunItem for this run
  const processedItems = await prisma.syncRunItem.findMany({
    where: { syncRunId: run.id },
    select: { symbol: true },
  });
  const processedSet = new Set(processedItems.map((i) => i.symbol));

  const remaining = allSymbols.filter((s) => !processedSet.has(s));

  if (remaining.length === 0) {
    // All symbols already processed — finalize
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
    return NextResponse.json({ progress: serializeRun(updated), done: true });
  }

  const chunk = remaining.slice(0, CHUNK_SIZE);

  let lastCallStartedAt = 0;
  let rateLimitHit = false;
  let localSuccess = 0;
  let localSkipped = 0;
  let localFailed = 0;

  const PROVIDER = "finnhub";
  const now = new Date();

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

    // Update current symbol in DB so polling can show it
    await prisma.syncRun.update({
      where: { id: run.id },
      data: { currentSymbol: symbol },
    });

    const stock = await prisma.stock.findUnique({
      where: { symbol },
      include: { quote: true, metric: true },
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
      continue;
    }

    let quoteOutcome = "skipped";
    let metricsOutcome = "skipped";
    let anySuccess = false;
    const dbActionParts: string[] = [];

    // ── Quote call (call-start pacing) ──────────────────────────────────────
    const elapsedSinceQuoteStart = Date.now() - lastCallStartedAt;
    if (lastCallStartedAt > 0 && elapsedSinceQuoteStart < CALL_DELAY_MS) {
      await sleep(CALL_DELAY_MS - elapsedSinceQuoteStart);
    }
    lastCallStartedAt = Date.now();

    const quoteResult = await fetchFinnhubQuote(symbol);

    if (!quoteResult.ok) {
      if (
        quoteResult.error?.includes("rate limit") ||
        quoteResult.error?.includes("429")
      ) {
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
      quoteOutcome = `failed — ${quoteResult.error ?? "provider error"}`;
    } else if (quoteResult.data && isValidNumber(quoteResult.data.price)) {
      const q = quoteResult.data;
      const existing = stock.quote;
      const isNew = !existing;
      try {
        await prisma.stockQuote.upsert({
          where: { stockId: stock.id },
          create: {
            stockId: stock.id,
            price: q.price!,
            changePercent: isValidNumber(q.changePercent) ? q.changePercent! : 0,
            open: isValidNumber(q.open) ? q.open : null,
            dayHigh: isValidNumber(q.high) ? q.high : null,
            dayLow: isValidNumber(q.low) ? q.low : null,
            previousClose: isValidNumber(q.previousClose) ? q.previousClose : null,
            source: PROVIDER,
            lastSyncedAt: now,
            sourceUpdatedAt: q.timestamp ? new Date(q.timestamp) : null,
          },
          update: {
            price: q.price!,
            changePercent: isValidNumber(q.changePercent)
              ? q.changePercent!
              : (existing?.changePercent ?? 0),
            open: isValidNumber(q.open) ? q.open : (existing?.open ?? null),
            dayHigh: isValidNumber(q.high) ? q.high : (existing?.dayHigh ?? null),
            dayLow: isValidNumber(q.low) ? q.low : (existing?.dayLow ?? null),
            previousClose: isValidNumber(q.previousClose)
              ? q.previousClose
              : (existing?.previousClose ?? null),
            source: PROVIDER,
            lastSyncedAt: now,
            sourceUpdatedAt: q.timestamp
              ? new Date(q.timestamp)
              : (existing?.sourceUpdatedAt ?? null),
          },
        });
        quoteOutcome = isNew ? "created" : "updated";
        anySuccess = true;
        dbActionParts.push(isNew ? "created_quote" : "updated_quote");
      } catch {
        quoteOutcome = "failed — db error";
      }
    } else {
      quoteOutcome = "skipped — no price";
    }

    // ── Metrics call (call-start pacing) ────────────────────────────────────
    const elapsedSinceMetricsStart = Date.now() - lastCallStartedAt;
    if (elapsedSinceMetricsStart < CALL_DELAY_MS) {
      await sleep(CALL_DELAY_MS - elapsedSinceMetricsStart);
    }
    lastCallStartedAt = Date.now();

    const metricsResult = await fetchFinnhubBasicFinancials(symbol);

    if (!metricsResult.ok) {
      if (
        metricsResult.error?.includes("rate limit") ||
        metricsResult.error?.includes("429")
      ) {
        rateLimitHit = true;
        metricsOutcome = "skipped — rate limit";
      } else {
        metricsOutcome = `failed — ${metricsResult.error ?? "provider error"}`;
      }
    } else if (metricsResult.data) {
      const m = metricsResult.data;
      const existingMetric = stock.metric;
      const isNew = !existingMetric;

      const safeNum = (v: number | null) => (isValidNumber(v) ? v : null);

      try {
        await prisma.stockMetric.upsert({
          where: { stockId: stock.id },
          create: {
            stockId: stock.id,
            provider: PROVIDER,
            revenueGrowthTTMYoy: safeNum(m.revenueGrowthTTMYoy),
            epsGrowthTTMYoy: safeNum(m.epsGrowthTTMYoy),
            revenueGrowthQuarterlyYoy: safeNum(m.revenueGrowthQuarterlyYoy),
            epsGrowthQuarterlyYoy: safeNum(m.epsGrowthQuarterlyYoy),
            revenueGrowth3Y: safeNum(m.revenueGrowth3Y),
            epsGrowth3Y: safeNum(m.epsGrowth3Y),
            grossMarginTTM: safeNum(m.grossMarginTTM),
            operatingMarginTTM: safeNum(m.operatingMarginTTM),
            netProfitMarginTTM: safeNum(m.netProfitMarginTTM),
            roeTTM: safeNum(m.roeTTM),
            roaTTM: safeNum(m.roaTTM),
            totalDebtToEquityAnnual: safeNum(m.totalDebtToEquityAnnual),
            currentRatioAnnual: safeNum(m.currentRatioAnnual),
            quickRatioAnnual: safeNum(m.quickRatioAnnual),
            netInterestCoverageAnnual: safeNum(m.netInterestCoverageAnnual),
            peBasicExclExtraTTM: safeNum(m.peBasicExclExtraTTM),
            forwardPE: safeNum(m.forwardPE),
            pegTTM: safeNum(m.pegTTM),
            forwardPEG: safeNum(m.forwardPEG),
            psTTM: safeNum(m.psTTM),
            pbAnnual: safeNum(m.pbAnnual),
            evEbitdaTTM: safeNum(m.evEbitdaTTM),
            epsTTM: safeNum(m.epsTTM),
            beta: safeNum(m.beta),
            marketCapitalization: safeNum(m.marketCapitalization),
            week52High: safeNum(m.week52High),
            week52Low: safeNum(m.week52Low),
            dividendYieldIndicatedAnnual: safeNum(m.dividendYieldIndicatedAnnual),
            rawMetricCount: m.rawMetricCount,
            lastSyncedAt: now,
          },
          update: {
            provider: PROVIDER,
            revenueGrowthTTMYoy: safeNum(m.revenueGrowthTTMYoy) ?? existingMetric?.revenueGrowthTTMYoy ?? null,
            epsGrowthTTMYoy: safeNum(m.epsGrowthTTMYoy) ?? existingMetric?.epsGrowthTTMYoy ?? null,
            revenueGrowthQuarterlyYoy: safeNum(m.revenueGrowthQuarterlyYoy) ?? existingMetric?.revenueGrowthQuarterlyYoy ?? null,
            epsGrowthQuarterlyYoy: safeNum(m.epsGrowthQuarterlyYoy) ?? existingMetric?.epsGrowthQuarterlyYoy ?? null,
            revenueGrowth3Y: safeNum(m.revenueGrowth3Y) ?? existingMetric?.revenueGrowth3Y ?? null,
            epsGrowth3Y: safeNum(m.epsGrowth3Y) ?? existingMetric?.epsGrowth3Y ?? null,
            grossMarginTTM: safeNum(m.grossMarginTTM) ?? existingMetric?.grossMarginTTM ?? null,
            operatingMarginTTM: safeNum(m.operatingMarginTTM) ?? existingMetric?.operatingMarginTTM ?? null,
            netProfitMarginTTM: safeNum(m.netProfitMarginTTM) ?? existingMetric?.netProfitMarginTTM ?? null,
            roeTTM: safeNum(m.roeTTM) ?? existingMetric?.roeTTM ?? null,
            roaTTM: safeNum(m.roaTTM) ?? existingMetric?.roaTTM ?? null,
            totalDebtToEquityAnnual: safeNum(m.totalDebtToEquityAnnual) ?? existingMetric?.totalDebtToEquityAnnual ?? null,
            currentRatioAnnual: safeNum(m.currentRatioAnnual) ?? existingMetric?.currentRatioAnnual ?? null,
            quickRatioAnnual: safeNum(m.quickRatioAnnual) ?? existingMetric?.quickRatioAnnual ?? null,
            netInterestCoverageAnnual: safeNum(m.netInterestCoverageAnnual) ?? existingMetric?.netInterestCoverageAnnual ?? null,
            peBasicExclExtraTTM: safeNum(m.peBasicExclExtraTTM) ?? existingMetric?.peBasicExclExtraTTM ?? null,
            forwardPE: safeNum(m.forwardPE) ?? existingMetric?.forwardPE ?? null,
            pegTTM: safeNum(m.pegTTM) ?? existingMetric?.pegTTM ?? null,
            forwardPEG: safeNum(m.forwardPEG) ?? existingMetric?.forwardPEG ?? null,
            psTTM: safeNum(m.psTTM) ?? existingMetric?.psTTM ?? null,
            pbAnnual: safeNum(m.pbAnnual) ?? existingMetric?.pbAnnual ?? null,
            evEbitdaTTM: safeNum(m.evEbitdaTTM) ?? existingMetric?.evEbitdaTTM ?? null,
            epsTTM: safeNum(m.epsTTM) ?? existingMetric?.epsTTM ?? null,
            beta: safeNum(m.beta) ?? existingMetric?.beta ?? null,
            marketCapitalization: safeNum(m.marketCapitalization) ?? existingMetric?.marketCapitalization ?? null,
            week52High: safeNum(m.week52High) ?? existingMetric?.week52High ?? null,
            week52Low: safeNum(m.week52Low) ?? existingMetric?.week52Low ?? null,
            dividendYieldIndicatedAnnual: safeNum(m.dividendYieldIndicatedAnnual) ?? existingMetric?.dividendYieldIndicatedAnnual ?? null,
            rawMetricCount: m.rawMetricCount,
            lastSyncedAt: now,
          },
        });
        metricsOutcome = isNew ? "created" : "updated";
        anySuccess = true;
        dbActionParts.push(isNew ? "created_metrics" : "updated_metrics");
      } catch {
        metricsOutcome = "failed — db error";
      }
    } else {
      metricsOutcome = "skipped — no metric data";
    }

    const reason = `Quote: ${quoteOutcome}, Metrics: ${metricsOutcome}`;
    const dbAction = dbActionParts.length > 0 ? dbActionParts.join("+") : "kept_existing";

    if (anySuccess) {
      localSuccess++;
      newItems.push({ syncRunId: run.id, symbol, status: "success", reason, dbAction });
    } else if (
      quoteOutcome.startsWith("skipped") &&
      metricsOutcome.startsWith("skipped")
    ) {
      localSkipped++;
      newItems.push({ syncRunId: run.id, symbol, status: "skipped", reason, dbAction: "kept_existing" });
    } else {
      localFailed++;
      newItems.push({ syncRunId: run.id, symbol, status: "failed", reason, dbAction: "kept_existing" });
    }
  }

  // Persist SyncRunItems for this chunk
  if (newItems.length > 0) {
    await prisma.syncRunItem.createMany({ data: newItems });
  }

  // Update SyncRun aggregate counts
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
        ? "Finnhub rate limit reached. Continue the sync after waiting."
        : `Completed. ${newSuccess} updated, ${newSkipped} skipped, ${newFailed} failed.`,
    };
  }

  const updated = await prisma.syncRun.update({
    where: { id: run.id },
    data: updateData,
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

  const done = shouldFinish;
  return NextResponse.json({ progress: serializeRun(updated), done });
}
