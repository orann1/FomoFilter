import { prisma } from "@/src/lib/db/prisma";
import { formatCompactCurrency } from "@/src/lib/formatters";

export type DashboardUser = {
  name: string;
  email: string;
  initials: string;
  plan: string;
};

export type ActiveAlertRule = {
  type: string;
  threshold: number | null;
  frequency: string;
  notifyVia: string;
};

export type DashboardStockRow = {
  symbol: string;
  name: string;
  sector: string | null;
  price: number | null;
  changePercent: number | null;
  fundamentalScore: number | null;
  growthScore: number | null;
  profitabilityScore: number | null;
  valuationScore: number | null;
  financialHealthScore: number | null;
  riskContextScore: number | null;
  oppScore: number | null;
  analystUpsidePercent?: number | null;
  marketCap: string | null;
  forwardPe: number | null;
  pegRatio: number | null;
  roe: number | null;
  revenueGrowthYoY: number | null;
};

export type DashboardSectorRow = {
  sector: string;
  stockCount: number;
  avgFundamentalScore: number | null;
  avgGrowthScore: number | null;
  avgProfitabilityScore: number | null;
  topSymbol: string | null;
  topScore: number | null;
};

export type DashboardWarning = {
  key: string;
  message: string;
  action: string | null;
};

export type DashboardSummary = {
  totalStocks: number;
  scannerReadyStocks: number;
  withQuotes: number;
  withMetrics: number;
  withScores: number;
  activeUniverseStocks: number;
  averageFundamentalScore: number | null;
  stocksAbove75: number;
  stocksAbove80: number;
  averageOpportunityScore: number | null;
  stocksAboveOpportunity75: number;
  withAnalystData: number;
  averageAnalystUpside: number | null;
  stocksWithHighUpside: number;
  // Target discovery (Phase 15)
  withTargetPrice: number;
  ratingCoverage: number;
  targetCoverage: number;
  noTargetAvailable: number;
  eligibleForTargetRetry: number;
};

export type DashboardAnalystRow = {
  symbol: string;
  name: string;
  sector: string | null;
  price: number | null;
  analystTargetPrice: number | null;
  analystUpsidePercent: number | null;
  analystRating: string | null;
  analystCount: number | null;
  fundamentalScore: number | null;
  oppScore: number | null;
};

export type DashboardFreshness = {
  lastMarketDataSyncAt: string | null;
  lastScoreCalculationAt: string | null;
  quoteCoveragePercent: number;
  metricCoveragePercent: number;
  scoreCoveragePercent: number;
};

export type DashboardWatchlistItem = {
  id: string;
  symbol: string;
  name: string;
  price: number | null;
  changePercent: number | null;
  fundamentalScore: number | null;
  oppScore: number | null;
  status: string;
  entryZoneLow: number | null;
  entryZoneHigh: number | null;
  target: number | null;
  stopLoss: number | null;
  notes: string | null;
  stockId: string;
};

export type ActiveAlertsSummary = {
  totalRules: number;
  bySymbol: Array<{
    symbol: string;
    rules: ActiveAlertRule[];
  }>;
};

export type DashboardData = {
  user: DashboardUser;
  summary: DashboardSummary;
  freshness: DashboardFreshness;
  topOpportunityStocks: DashboardStockRow[];
  topFundamentalStocks: DashboardStockRow[];
  sectorSummary: DashboardSectorRow[];
  dataWarnings: DashboardWarning[];
  watchlistItems: DashboardWatchlistItem[];
  alertRulesBySymbol: Record<string, ActiveAlertRule[]>;
  activeAlertsSummary: ActiveAlertsSummary;
  topAnalystUpsideStocks: DashboardAnalystRow[];
};

export async function getDashboardData(): Promise<DashboardData> {
  const [
    dbUser,
    dbStocks,
    dbWatchlistItems,
    lastMarketDataSync,
    lastScoreCalc,
  ] = await Promise.all([
    prisma.user.findFirst({ orderBy: { createdAt: "asc" } }),
    prisma.stock.findMany({
      where: { isActive: true },
      include: {
        quote: true,
        score: true,
        metric: true,
        analystData: true,
        universeMemberships: { include: { universe: { select: { slug: true } } } },
      },
    }),
    prisma.watchlistItem.findMany({
      include: { stock: { include: { quote: true, score: true } } },
      orderBy: { createdAt: "asc" },
    }),
    prisma.syncRun.findFirst({
      where: {
        type: {
          in: [
            "market-data-active-symbols-sync",
            "market-data-nasdaq100-chunked-sync",
            "market-data-nasdaq100-batch",
            "quotes-nasdaq100-batch",
          ],
        },
        status: { in: ["success", "partial_success"] },
      },
      orderBy: { startedAt: "desc" },
    }),
    prisma.syncRun.findFirst({
      where: {
        type: "fundamental-score-calculation",
        status: { in: ["success", "partial_success"] },
        successCount: { gt: 0 },
      },
      orderBy: { startedAt: "desc" },
    }),
  ]);

  const dbAlertRules = await prisma.alertRule.findMany({
    where: { isActive: true },
    include: { stock: { select: { symbol: true } } },
    orderBy: { createdAt: "desc" },
  });

  // ── User ──────────────────────────────────────────────────────────────────────
  const user: DashboardUser = {
    name: dbUser?.name ?? "User",
    email: dbUser?.email ?? "",
    initials: dbUser?.initials ?? "U",
    plan: dbUser?.plan ?? "FREE",
  };

  // ── Coverage counts ───────────────────────────────────────────────────────────
  // Count unique stocks with at least one active universe membership
  const stocksWithActiveMembership = dbStocks.filter((s) =>
    s.universeMemberships.some((m) => m.isActive)
  );
  const activeUniverseStocks = stocksWithActiveMembership.length;
  const totalStocks = activeUniverseStocks > 0 ? activeUniverseStocks : dbStocks.filter((s) => s.isActive).length;

  const withQuotes = dbStocks.filter((s) => s.quote !== null).length;
  const withMetrics = dbStocks.filter((s) => s.metric !== null).length;
  const withScores = dbStocks.filter((s) => s.score?.fundamentalScore != null).length;
  const scannerReadyStocks = dbStocks.filter(
    (s) => s.quote !== null && s.score?.fundamentalScore != null
  ).length;

  const scoresArr = dbStocks
    .map((s) => s.score?.fundamentalScore)
    .filter((v): v is NonNullable<typeof v> => v != null)
    .map(Number);

  const averageFundamentalScore =
    scoresArr.length > 0
      ? Math.round(scoresArr.reduce((a, b) => a + b, 0) / scoresArr.length)
      : null;

  const stocksAbove75 = scoresArr.filter((v) => v >= 75).length;
  const stocksAbove80 = scoresArr.filter((v) => v >= 80).length;

  const oppScoresArr = dbStocks
    .map((s) => s.score?.oppScore)
    .filter((v): v is NonNullable<typeof v> => v != null)
    .map(Number);

  const averageOpportunityScore =
    oppScoresArr.length > 0
      ? Math.round(oppScoresArr.reduce((a, b) => a + b, 0) / oppScoresArr.length)
      : null;

  const stocksAboveOpportunity75 = oppScoresArr.filter((v) => v >= 75).length;

  const withAnalystData = dbStocks.filter((s) => s.analystData !== null).length;
  const analystUpsideArr = dbStocks
    .map((s) => s.analystData?.analystUpsidePercent)
    .filter((v): v is NonNullable<typeof v> => v != null)
    .map(Number);
  const averageAnalystUpside =
    analystUpsideArr.length > 0
      ? Math.round(analystUpsideArr.reduce((a, b) => a + b, 0) / analystUpsideArr.length)
      : null;
  const stocksWithHighUpside = analystUpsideArr.filter((v) => v >= 20).length;

  // Target discovery coverage (Phase 15)
  const now = new Date();
  const withTargetPrice = dbStocks.filter((s) => s.analystData?.targetPrice != null).length;
  const ratingCoverage = dbStocks.filter((s) => s.analystData?.analystRating != null).length;
  const targetCoverage = withTargetPrice;
  const noTargetAvailable = dbStocks.filter((s) => s.analystData?.targetStatus === "no_target_available").length;
  const eligibleForTargetRetry = dbStocks.filter((s) => {
    const ad = s.analystData;
    if (!ad || !ad.targetStatus || ad.targetStatus === "not_checked") return true;
    if (ad.targetStatus === "provider_error" || ad.targetStatus === "quota_blocked" || ad.targetStatus === "no_target_available") {
      return !ad.targetNextRetryAt || ad.targetNextRetryAt <= now;
    }
    return false;
  }).length;

  const summary: DashboardSummary = {
    totalStocks,
    scannerReadyStocks,
    withQuotes,
    withMetrics,
    withScores,
    activeUniverseStocks,
    averageFundamentalScore,
    stocksAbove75,
    stocksAbove80,
    averageOpportunityScore,
    stocksAboveOpportunity75,
    withAnalystData,
    averageAnalystUpside,
    stocksWithHighUpside,
    withTargetPrice,
    ratingCoverage,
    targetCoverage,
    noTargetAvailable,
    eligibleForTargetRetry,
  };

  // ── Freshness ─────────────────────────────────────────────────────────────────
  const quoteCoveragePercent =
    totalStocks > 0 ? Math.round((withQuotes / totalStocks) * 100) : 0;
  const metricCoveragePercent =
    totalStocks > 0 ? Math.round((withMetrics / totalStocks) * 100) : 0;
  const scoreCoveragePercent =
    totalStocks > 0 ? Math.round((withScores / totalStocks) * 100) : 0;

  const freshness: DashboardFreshness = {
    lastMarketDataSyncAt: lastMarketDataSync?.finishedAt?.toISOString() ?? lastMarketDataSync?.startedAt?.toISOString() ?? null,
    lastScoreCalculationAt: lastScoreCalc?.finishedAt?.toISOString() ?? lastScoreCalc?.startedAt?.toISOString() ?? null,
    quoteCoveragePercent,
    metricCoveragePercent,
    scoreCoveragePercent,
  };

  // ── Top Opportunity Stocks ────────────────────────────────────────────────────
  const topOpportunityStocks: DashboardStockRow[] = dbStocks
    .filter((s) => s.score?.oppScore != null && s.quote !== null)
    .sort((a, b) => Number(b.score!.oppScore!) - Number(a.score!.oppScore!))
    .slice(0, 10)
    .map((s) => ({
      symbol: s.symbol,
      name: s.name,
      sector: s.sector ?? null,
      price: s.quote ? Number(s.quote.price) : null,
      changePercent: s.quote?.changePercent != null ? Number(s.quote.changePercent) : null,
      fundamentalScore: s.score?.fundamentalScore != null ? Math.round(Number(s.score.fundamentalScore)) : null,
      growthScore: s.score?.growthScore != null ? Math.round(Number(s.score.growthScore)) : null,
      profitabilityScore: s.score?.profitabilityScore != null ? Math.round(Number(s.score.profitabilityScore)) : null,
      valuationScore: s.score?.valuationScore != null ? Math.round(Number(s.score.valuationScore)) : null,
      financialHealthScore: s.score?.financialHealthScore != null ? Math.round(Number(s.score.financialHealthScore)) : null,
      riskContextScore: s.score?.riskContextScore != null ? Math.round(Number(s.score.riskContextScore)) : null,
      oppScore: s.score?.oppScore != null ? Math.round(Number(s.score.oppScore)) : null,
      marketCap: s.marketCap != null ? formatCompactCurrency(Number(s.marketCap)) : null,
      forwardPe: s.metric?.forwardPE != null ? Number(s.metric.forwardPE) : null,
      pegRatio: s.metric?.forwardPEG != null ? Number(s.metric.forwardPEG) : null,
      roe: s.metric?.roeTTM != null ? Number(s.metric.roeTTM) : null,
      revenueGrowthYoY: s.metric?.revenueGrowthTTMYoy != null ? Number(s.metric.revenueGrowthTTMYoy) : null,
      analystUpsidePercent: s.analystData?.analystUpsidePercent != null ? Number(s.analystData.analystUpsidePercent) : null,
    }));

  // ── Top Fundamental Stocks ────────────────────────────────────────────────────
  const topFundamentalStocks: DashboardStockRow[] = dbStocks
    .filter((s) => s.score?.fundamentalScore != null && s.quote !== null)
    .sort((a, b) => Number(b.score!.fundamentalScore!) - Number(a.score!.fundamentalScore!))
    .slice(0, 15)
    .map((s) => ({
      symbol: s.symbol,
      name: s.name,
      sector: s.sector ?? null,
      price: s.quote ? Number(s.quote.price) : null,
      changePercent: s.quote?.changePercent != null ? Number(s.quote.changePercent) : null,
      fundamentalScore: s.score?.fundamentalScore != null ? Math.round(Number(s.score.fundamentalScore)) : null,
      growthScore: s.score?.growthScore != null ? Math.round(Number(s.score.growthScore)) : null,
      profitabilityScore: s.score?.profitabilityScore != null ? Math.round(Number(s.score.profitabilityScore)) : null,
      valuationScore: s.score?.valuationScore != null ? Math.round(Number(s.score.valuationScore)) : null,
      financialHealthScore: s.score?.financialHealthScore != null ? Math.round(Number(s.score.financialHealthScore)) : null,
      riskContextScore: s.score?.riskContextScore != null ? Math.round(Number(s.score.riskContextScore)) : null,
      oppScore: s.score?.oppScore != null ? Math.round(Number(s.score.oppScore)) : null,
      marketCap: s.marketCap != null ? formatCompactCurrency(Number(s.marketCap)) : null,
      forwardPe: s.metric?.forwardPE != null ? Number(s.metric.forwardPE) : null,
      pegRatio: s.metric?.forwardPEG != null ? Number(s.metric.forwardPEG) : null,
      roe: s.metric?.roeTTM != null ? Number(s.metric.roeTTM) : null,
      revenueGrowthYoY: s.metric?.revenueGrowthTTMYoy != null ? Number(s.metric.revenueGrowthTTMYoy) : null,
    }));

  // ── Sector Summary ────────────────────────────────────────────────────────────
  const sectorMap = new Map<
    string,
    { stocks: Array<{ symbol: string; fundamentalScore: number; growthScore: number | null; profitabilityScore: number | null }> }
  >();

  for (const s of dbStocks) {
    if (!s.sector || s.score?.fundamentalScore == null) continue;
    const sector = s.sector;
    if (!sectorMap.has(sector)) sectorMap.set(sector, { stocks: [] });
    sectorMap.get(sector)!.stocks.push({
      symbol: s.symbol,
      fundamentalScore: Math.round(Number(s.score.fundamentalScore)),
      growthScore: s.score.growthScore != null ? Math.round(Number(s.score.growthScore)) : null,
      profitabilityScore: s.score.profitabilityScore != null ? Math.round(Number(s.score.profitabilityScore)) : null,
    });
  }

  const sectorSummary: DashboardSectorRow[] = Array.from(sectorMap.entries())
    .map(([sector, { stocks }]) => {
      const fundScores = stocks.map((s) => s.fundamentalScore);
      const avgFund = fundScores.length > 0
        ? Math.round(fundScores.reduce((a, b) => a + b, 0) / fundScores.length)
        : null;
      const growthScores = stocks.map((s) => s.growthScore).filter((v): v is number => v != null);
      const avgGrowth = growthScores.length > 0
        ? Math.round(growthScores.reduce((a, b) => a + b, 0) / growthScores.length)
        : null;
      const profScores = stocks.map((s) => s.profitabilityScore).filter((v): v is number => v != null);
      const avgProf = profScores.length > 0
        ? Math.round(profScores.reduce((a, b) => a + b, 0) / profScores.length)
        : null;
      const topStock = stocks.reduce((best, s) => s.fundamentalScore > best.fundamentalScore ? s : best, stocks[0]);
      return {
        sector,
        stockCount: stocks.length,
        avgFundamentalScore: avgFund,
        avgGrowthScore: avgGrowth,
        avgProfitabilityScore: avgProf,
        topSymbol: topStock?.symbol ?? null,
        topScore: topStock?.fundamentalScore ?? null,
      };
    })
    .sort((a, b) => (b.avgFundamentalScore ?? 0) - (a.avgFundamentalScore ?? 0));

  // ── Data Warnings ─────────────────────────────────────────────────────────────
  const COVERAGE_WARN_THRESHOLD = 0.95;

  const dataWarnings: DashboardWarning[] = [];
  const missingMetrics = totalStocks - withMetrics;
  const missingScores = totalStocks - withScores;
  const metricsCoverage = totalStocks > 0 ? withMetrics / totalStocks : 1;
  const scoresCoverage = totalStocks > 0 ? withScores / totalStocks : 1;

  if (!lastMarketDataSync) {
    dataWarnings.push({
      key: "no_sync",
      message: "Market data has not been synced yet.",
      action: "Run Market Data Sync in Admin.",
    });
  } else if (missingMetrics > 0 && metricsCoverage < COVERAGE_WARN_THRESHOLD) {
    dataWarnings.push({
      key: "missing_metrics",
      message: `${missingMetrics} stock${missingMetrics > 1 ? "s are" : " is"} missing metrics (${Math.round(metricsCoverage * 100)}% coverage).`,
      action: "Run Company Data Sync to fill gaps.",
    });
  }

  if (withScores === 0) {
    dataWarnings.push({
      key: "no_scores",
      message: "No scores calculated yet.",
      action: "Run Calculate Fundamental Scores in Admin.",
    });
  } else if (!lastScoreCalc) {
    dataWarnings.push({
      key: "no_score_run",
      message: "Scores exist, but no score calculation run record was found. Re-run to track freshness.",
      action: "Run Calculate Fundamental Scores in Admin.",
    });
  } else if (missingScores > 0 && scoresCoverage < COVERAGE_WARN_THRESHOLD) {
    dataWarnings.push({
      key: "missing_scores",
      message: `${missingScores} stock${missingScores > 1 ? "s are" : " is"} missing scores (${Math.round(scoresCoverage * 100)}% coverage).`,
      action: "Run Calculate Fundamental Scores to fill gaps.",
    });
  }

  if (
    lastMarketDataSync &&
    lastScoreCalc &&
    lastScoreCalc.startedAt < lastMarketDataSync.startedAt
  ) {
    dataWarnings.push({
      key: "stale_scores",
      message: "Market data is newer than scores.",
      action: "Recalculate Fundamental Scores in Admin.",
    });
  }

  // ── Watchlist Items ───────────────────────────────────────────────────────────
  const watchlistItems: DashboardWatchlistItem[] = dbWatchlistItems.map((w) => ({
    id: w.id,
    symbol: w.stock.symbol,
    name: w.stock.name,
    price: w.stock.quote ? Number(w.stock.quote.price) : null,
    changePercent: w.stock.quote?.changePercent != null ? Number(w.stock.quote.changePercent) : null,
    fundamentalScore: w.stock.score?.fundamentalScore != null ? Math.round(Number(w.stock.score.fundamentalScore)) : null,
    oppScore: w.stock.score?.oppScore != null ? Math.round(Number(w.stock.score.oppScore)) : null,
    status: w.status,
    entryZoneLow: w.entryZoneLow != null ? Number(w.entryZoneLow) : null,
    entryZoneHigh: w.entryZoneHigh != null ? Number(w.entryZoneHigh) : null,
    target: w.target != null ? Number(w.target) : null,
    stopLoss: w.stopLoss != null ? Number(w.stopLoss) : null,
    notes: w.reason ?? null,
    stockId: w.stockId,
  }));

  // ── Top Analyst Upside Stocks ─────────────────────────────────────────────────
  const topAnalystUpsideStocks: DashboardAnalystRow[] = dbStocks
    .filter((s) => s.analystData?.analystUpsidePercent != null && s.quote !== null)
    .sort((a, b) => Number(b.analystData!.analystUpsidePercent!) - Number(a.analystData!.analystUpsidePercent!))
    .slice(0, 10)
    .map((s) => ({
      symbol: s.symbol,
      name: s.name,
      sector: s.sector ?? null,
      price: s.quote ? Number(s.quote.price) : null,
      analystTargetPrice: s.analystData?.targetMean != null ? Number(s.analystData.targetMean) : null,
      analystUpsidePercent: s.analystData?.analystUpsidePercent != null ? Number(s.analystData.analystUpsidePercent) : null,
      analystRating: s.analystData?.analystRating ?? null,
      analystCount: s.analystData?.analystCount ?? null,
      fundamentalScore: s.score?.fundamentalScore != null ? Math.round(Number(s.score.fundamentalScore)) : null,
      oppScore: s.score?.oppScore != null ? Math.round(Number(s.score.oppScore)) : null,
    }));

  // ── Alert Rules by Symbol ─────────────────────────────────────────────────────
  const alertRulesBySymbol: Record<string, ActiveAlertRule[]> = {};
  for (const rule of dbAlertRules) {
    const sym = rule.stock.symbol;
    if (!alertRulesBySymbol[sym]) alertRulesBySymbol[sym] = [];
    alertRulesBySymbol[sym].push({
      type: rule.type,
      threshold: rule.threshold ? Number(rule.threshold) : null,
      frequency: rule.frequency,
      notifyVia: rule.notifyVia,
    });
  }

  // ── Active Alerts Summary ─────────────────────────────────────────────────────
  const activeAlertsSummary: ActiveAlertsSummary = {
    totalRules: dbAlertRules.length,
    bySymbol: Object.entries(alertRulesBySymbol).map(([symbol, rules]) => ({ symbol, rules })),
  };

  return {
    user,
    summary,
    freshness,
    topOpportunityStocks,
    topFundamentalStocks,
    sectorSummary,
    dataWarnings,
    watchlistItems,
    alertRulesBySymbol,
    activeAlertsSummary,
    topAnalystUpsideStocks,
  };
}
