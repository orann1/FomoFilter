import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/db/prisma";
import { getAllActiveNasdaq100Symbols } from "@/src/lib/data/admin-universes";
import {
  fetchFmpPriceTargetConsensus,
  fetchFmpCompanyProfile,
  fetchFmpRatiosTtm,
  fetchFmpFinancialGrowth,
} from "@/src/lib/market-data/providers/fmp";
import { fetchFinnhubAnalystData } from "@/src/lib/market-data/providers/finnhub";
import { isValidNumber } from "@/src/lib/market-data/safe-update";

const ANALYST_SYNC_TYPE = "analyst-data-nasdaq100-sync";
const CHUNK_SIZE = 10;
// One FMP consensus + 3 FMP fundamentals + one Finnhub call per symbol, run in parallel.
// Pacing: ≥1200ms between symbol starts to respect Finnhub free plan (~60 calls/min).
const SYMBOL_DELAY_MS = 1200;

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

// Convert FMP decimal margin/ROE/ROA to % scale (0.45 → 45.0)
function toPct(v: number | null): number | null {
  return v !== null && Number.isFinite(v) ? v * 100 : null;
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
      include: { quote: true, analystData: true, metric: true },
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
    // FMP (parallel): price-target-consensus + profile + ratios-ttm + financial-growth
    // Finnhub (parallel): /stock/recommendation → rating counts
    const [fmpTargetResult, fmpProfileResult, fmpRatiosResult, fmpGrowthResult, finnhubResult] =
      await Promise.all([
        fetchFmpPriceTargetConsensus(symbol),
        fetchFmpCompanyProfile(symbol),
        fetchFmpRatiosTtm(symbol),
        fetchFmpFinancialGrowth(symbol),
        fetchFinnhubAnalystData(symbol),
      ]);

    lastSymbolEndedAt = Date.now();

    // Detect rate limits — stop chunk on Finnhub 429 or FMP 429
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

    if (!fmpRatiosResult.ok && fmpRatiosResult.rateLimitHit) {
      rateLimitHit = true;
      newItems.push({
        syncRunId: run.id,
        symbol,
        status: "skipped",
        reason: "FMP rate limit reached",
        dbAction: "kept_existing",
      });
      localSkipped++;
      continue;
    }

    // FMP quota exceeded stops the chunk
    if (!fmpTargetResult.ok && fmpTargetResult.quotaExceeded) {
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

    const now = new Date();
    const safeNum = (v: number | null) => (isValidNumber(v) ? v : null);
    const safeInt = (v: number | null) => (v !== null && Number.isFinite(v) ? Math.round(v) : null);

    // ── Analyst data upsert (Phase 17 behavior — preserved) ───────────────
    const fmpData = fmpTargetResult.ok ? (fmpTargetResult.data ?? null) : null;
    const targetConsensus = fmpData?.targetConsensus ?? null;
    const targetHigh = fmpData?.targetHigh ?? null;
    const targetLow = fmpData?.targetLow ?? null;
    const targetMedian = fmpData?.targetMedian ?? null;
    const targetPrice = isValidNumber(targetConsensus) ? targetConsensus : null;
    const targetMean = targetPrice;

    const finnhubData = finnhubResult.ok ? (finnhubResult.data ?? null) : null;
    const strongBuyCount = finnhubData?.strongBuyCount ?? null;
    const buyCount = finnhubData?.buyCount ?? null;
    const holdCount = finnhubData?.holdCount ?? null;
    const sellCount = finnhubData?.sellCount ?? null;
    const strongSellCount = finnhubData?.strongSellCount ?? null;
    const analystCount = finnhubData?.analystCount ?? null;
    const analystRating = finnhubData?.analystRating ?? null;

    const currentPrice = stock.quote ? Number(stock.quote.price) : null;
    let analystUpsidePercent: number | null = null;
    if (targetPrice !== null && currentPrice !== null && currentPrice > 0) {
      analystUpsidePercent = ((targetPrice - currentPrice) / currentPrice) * 100;
    }

    const existing = stock.analystData;
    const isNewAnalyst = !existing;
    const hasTarget = targetPrice !== null;

    const newTargetStatus = hasTarget
      ? "has_target"
      : existing?.targetStatus === "has_target" && existing?.targetPrice === null
      ? "no_target_available"
      : (existing?.targetStatus ?? null);

    let analystDbAction = "kept_existing";
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
      analystDbAction = isNewAnalyst ? "created_analyst" : "updated_analyst";
    } catch {
      // Analyst upsert failed — log but continue to metric upsert
      analystDbAction = "analyst_db_error";
    }

    // ── Stock profile update from FMP ──────────────────────────────────────
    const fmpProfile = fmpProfileResult.ok ? fmpProfileResult.data : null;
    if (fmpProfile) {
      const profileUpdate: Record<string, string | null | undefined> = {};
      if (fmpProfile.name && fmpProfile.name.trim().length > 0) {
        profileUpdate.name = fmpProfile.name;
      }
      if (fmpProfile.sector && fmpProfile.sector.trim().length > 0) {
        profileUpdate.sector = fmpProfile.sector;
      }
      // Persist industry — only overwrite if FMP returned a non-empty value
      if (fmpProfile.industry && fmpProfile.industry.trim().length > 0) {
        profileUpdate.industry = fmpProfile.industry;
      }
      // Persist description — only overwrite if FMP returned a non-empty value
      if (fmpProfile.description && fmpProfile.description.trim().length > 0) {
        profileUpdate.description = fmpProfile.description;
      }
      if (Object.keys(profileUpdate).length > 0) {
        try {
          await prisma.stock.update({ where: { id: stock.id }, data: profileUpdate });
        } catch {
          // Non-fatal: profile update failure doesn't block metric upsert
        }
      }
    }

    // ── FMP Fundamentals → StockMetric upsert ─────────────────────────────
    const fmpRatios = fmpRatiosResult.ok ? fmpRatiosResult.data : null;
    const fmpGrowth = fmpGrowthResult.ok ? fmpGrowthResult.data : null;
    const existingMetric = stock.metric;

    // Profitability — FMP returns as decimal (0.45 = 45%), multiply by 100
    const grossMarginTTM     = safeNum(toPct(fmpRatios?.grossProfitMarginTTM ?? null));
    const operatingMarginTTM = safeNum(toPct(fmpRatios?.operatingProfitMarginTTM ?? null));
    const netProfitMarginTTM = safeNum(toPct(fmpRatios?.netProfitMarginTTM ?? null));
    const roeTTM             = safeNum(toPct(fmpRatios?.returnOnEquityTTM ?? null));
    const roaTTM             = safeNum(toPct(fmpRatios?.returnOnAssetsTTM ?? null));

    // Financial health — plain ratios
    const totalDebtToEquityAnnual   = safeNum(fmpRatios?.debtEquityRatioTTM ?? null);
    const currentRatioAnnual        = safeNum(fmpRatios?.currentRatioTTM ?? null);
    const quickRatioAnnual          = safeNum(fmpRatios?.quickRatioTTM ?? null);
    const netInterestCoverageAnnual = safeNum(fmpRatios?.interestCoverageTTM ?? null);

    // Valuation — plain ratios/multiples
    const peBasicExclExtraTTM          = safeNum(fmpRatios?.priceEarningsRatioTTM ?? null);
    const psTTM                        = safeNum(fmpRatios?.priceToSalesRatioTTM ?? null);
    const pbAnnual                     = safeNum(fmpRatios?.priceToBookRatioTTM ?? null);
    const evEbitdaTTM                  = safeNum(fmpRatios?.enterpriseValueMultipleTTM ?? null);
    const pegTTM                       = safeNum(fmpRatios?.priceEarningsToGrowthRatioTTM ?? null);

    // Profile-derived
    const beta               = safeNum(fmpProfile?.beta ?? null);
    const marketCapitalization = safeNum(fmpProfile?.marketCap ?? null);

    // Growth — FMP returns as decimal (0.075 = 7.5%), multiply by 100
    const revenueGrowthTTMYoy = safeNum(toPct(fmpGrowth?.revenueGrowth ?? null));
    const epsGrowthTTMYoy     = safeNum(toPct(fmpGrowth?.epsgrowth ?? null));
    const revenueGrowth3Y     = safeNum(toPct(fmpGrowth?.threeYRevenueGrowthPerShare ?? null));
    const epsGrowth3Y         = safeNum(toPct(fmpGrowth?.threeYNetIncomeGrowthPerShare ?? null));

    const hasFmpMetrics = fmpProfile !== null || fmpRatios !== null || fmpGrowth !== null;

    let metricDbAction = "kept_existing";
    if (hasFmpMetrics) {
      try {
        await prisma.stockMetric.upsert({
          where: { stockId: stock.id },
          create: {
            stockId: stock.id,
            provider: "fmp",
            // Growth
            revenueGrowthTTMYoy: revenueGrowthTTMYoy ?? undefined,
            epsGrowthTTMYoy: epsGrowthTTMYoy ?? undefined,
            revenueGrowth3Y: revenueGrowth3Y ?? undefined,
            epsGrowth3Y: epsGrowth3Y ?? undefined,
            // Profitability
            grossMarginTTM: grossMarginTTM ?? undefined,
            operatingMarginTTM: operatingMarginTTM ?? undefined,
            netProfitMarginTTM: netProfitMarginTTM ?? undefined,
            roeTTM: roeTTM ?? undefined,
            roaTTM: roaTTM ?? undefined,
            // Financial health
            totalDebtToEquityAnnual: totalDebtToEquityAnnual ?? undefined,
            currentRatioAnnual: currentRatioAnnual ?? undefined,
            quickRatioAnnual: quickRatioAnnual ?? undefined,
            netInterestCoverageAnnual: netInterestCoverageAnnual ?? undefined,
            // Valuation
            peBasicExclExtraTTM: peBasicExclExtraTTM ?? undefined,
            psTTM: psTTM ?? undefined,
            pbAnnual: pbAnnual ?? undefined,
            evEbitdaTTM: evEbitdaTTM ?? undefined,
            pegTTM: pegTTM ?? undefined,
            // Market/risk
            beta: beta ?? undefined,
            marketCapitalization: marketCapitalization ?? undefined,
            lastSyncedAt: now,
          },
          update: {
            provider: "fmp",
            // Growth
            revenueGrowthTTMYoy:    revenueGrowthTTMYoy    ?? existingMetric?.revenueGrowthTTMYoy    ?? null,
            epsGrowthTTMYoy:        epsGrowthTTMYoy        ?? existingMetric?.epsGrowthTTMYoy        ?? null,
            revenueGrowth3Y:        revenueGrowth3Y        ?? existingMetric?.revenueGrowth3Y        ?? null,
            epsGrowth3Y:            epsGrowth3Y            ?? existingMetric?.epsGrowth3Y            ?? null,
            // Profitability
            grossMarginTTM:         grossMarginTTM         ?? existingMetric?.grossMarginTTM         ?? null,
            operatingMarginTTM:     operatingMarginTTM     ?? existingMetric?.operatingMarginTTM     ?? null,
            netProfitMarginTTM:     netProfitMarginTTM     ?? existingMetric?.netProfitMarginTTM     ?? null,
            roeTTM:                 roeTTM                 ?? existingMetric?.roeTTM                 ?? null,
            roaTTM:                 roaTTM                 ?? existingMetric?.roaTTM                 ?? null,
            // Financial health
            totalDebtToEquityAnnual:   totalDebtToEquityAnnual   ?? existingMetric?.totalDebtToEquityAnnual   ?? null,
            currentRatioAnnual:        currentRatioAnnual        ?? existingMetric?.currentRatioAnnual        ?? null,
            quickRatioAnnual:          quickRatioAnnual          ?? existingMetric?.quickRatioAnnual          ?? null,
            netInterestCoverageAnnual: netInterestCoverageAnnual ?? existingMetric?.netInterestCoverageAnnual ?? null,
            // Valuation
            peBasicExclExtraTTM: peBasicExclExtraTTM ?? existingMetric?.peBasicExclExtraTTM ?? null,
            psTTM:               psTTM               ?? existingMetric?.psTTM               ?? null,
            pbAnnual:            pbAnnual            ?? existingMetric?.pbAnnual            ?? null,
            evEbitdaTTM:         evEbitdaTTM         ?? existingMetric?.evEbitdaTTM         ?? null,
            pegTTM:              pegTTM              ?? existingMetric?.pegTTM              ?? null,
            // Market/risk — preserve forwardPE, forwardPEG, week52High/Low from Finnhub daily sync
            beta:                beta                ?? existingMetric?.beta                ?? null,
            marketCapitalization: marketCapitalization ?? existingMetric?.marketCapitalization ?? null,
            lastSyncedAt: now,
            // Fields NOT updated here (remain from Finnhub daily sync):
            //   forwardPE, forwardPEG, week52High, week52Low,
            //   revenueGrowthQuarterlyYoy, epsGrowthQuarterlyYoy,
            //   dividendYieldIndicatedAnnual, epsTTM
          },
        });
        metricDbAction = existingMetric ? "updated_metric" : "created_metric";
      } catch {
        metricDbAction = "metric_db_error";
      }
    }

    // ── Determine overall outcome ──────────────────────────────────────────
    const analystOk = analystDbAction !== "analyst_db_error" && analystDbAction !== "kept_existing";
    const metricOk  = metricDbAction  !== "metric_db_error"  && metricDbAction  !== "kept_existing";
    const anySuccess = analystOk || metricOk;
    const bothFailed = analystDbAction === "analyst_db_error" && metricDbAction === "metric_db_error";

    if (anySuccess) {
      localSuccess++;
      newItems.push({
        syncRunId: run.id,
        symbol,
        status: "success",
        reason: `${analystDbAction}, ${metricDbAction}`,
        dbAction: [analystDbAction, metricDbAction].filter((a) => a !== "kept_existing").join("+") || "updated",
      });
    } else if (bothFailed) {
      localFailed++;
      newItems.push({
        syncRunId: run.id,
        symbol,
        status: "failed",
        reason: "Analyst and metric DB upsert both failed",
        dbAction: "kept_existing",
      });
    } else {
      localSkipped++;
      newItems.push({
        syncRunId: run.id,
        symbol,
        status: "skipped",
        reason: `${analystDbAction}, ${metricDbAction}`,
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
