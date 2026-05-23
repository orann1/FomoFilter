import { prisma } from "@/src/lib/db/prisma";

export type AdminStockDataInventoryRow = {
  id: string;
  symbol: string;
  companyName: string | null;
  sector: string | null;
  marketCap: string | null;

  inNasdaq100: boolean;
  universeSource: string | null;
  membershipActive: boolean;
  membershipLastSeenAt: string | null;

  hasQuote: boolean;
  price: string | null;
  changePercent: string | null;
  open: string | null;
  dayHigh: string | null;
  dayLow: string | null;
  previousClose: string | null;
  volume: string | null;
  volumeSourceLabel: string;
  quoteSource: string | null;
  quoteSourceLabel: string;
  quoteLastSyncedAt: string | null;
  quoteSourceUpdatedAt: string | null;

  hasScore: boolean;
  fundamentalScore: string | null;
  growthScore: string | null;
  profitabilityScore: string | null;
  valuationScore: string | null;
  financialHealthScore: string | null;
  riskContextScore: string | null;
  scoreVersion: string | null;
  scoreLastCalculatedAt: string | null;
  scannerEligible: boolean;
  missingReason: string;

  hasMetric: boolean;
  metricProvider: string | null;
  metricLastSyncedAt: string | null;
  // Growth (% scale)
  revenueGrowthTTMYoy: string | null;
  epsGrowthTTMYoy: string | null;
  revenueGrowth3Y: string | null;
  epsGrowth3Y: string | null;
  // Profitability
  grossMarginTTM: string | null;
  operatingMarginTTM: string | null;
  netProfitMarginTTM: string | null;
  roeTTM: string | null;
  roaTTM: string | null;
  // Financial strength
  totalDebtToEquityAnnual: string | null;
  currentRatioAnnual: string | null;
  // Valuation
  peBasicExclExtraTTM: string | null;
  forwardPE: string | null;
  pegTTM: string | null;
  psTTM: string | null;
  pbAnnual: string | null;
  evEbitdaTTM: string | null;
  epsTTM: string | null;
  // Market / risk
  beta: string | null;
  marketCapitalizationMetric: string | null;
  week52High: string | null;
  week52Low: string | null;
  dividendYieldIndicatedAnnual: string | null;

  inWatchlist: boolean;
  hasActiveAlert: boolean;
};

function formatShortDate(d: Date | null | undefined): string | null {
  if (!d) return null;
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const h = d.getHours().toString().padStart(2, "0");
  const m = d.getMinutes().toString().padStart(2, "0");
  return `${d.getDate()} ${months[d.getMonth()]} ${h}:${m}`;
}

function fmtDecimal(val: { toString(): string } | null | undefined, decimals = 2): string | null {
  if (val == null) return null;
  const n = parseFloat(val.toString());
  return isNaN(n) ? null : n.toFixed(decimals);
}

function normalizeSource(source: string | null | undefined): string {
  if (!source) return "DB";
  switch (source.toLowerCase()) {
    case "finnhub": return "Finnhub";
    case "twelve-data":
    case "twelvedata":
    case "twelve_data": return "Twelve Data";
    case "fmp": return "FMP";
    case "static_fallback":
    case "static-fallback": return "Static Fallback";
    default: return "DB";
  }
}

export async function getAdminStockDataInventory(): Promise<AdminStockDataInventoryRow[]> {
  const stocks = await prisma.stock.findMany({
    include: {
      quote: true,
      score: true,
      metric: true,
      universeMemberships: {
        include: {
          universe: { select: { slug: true } },
        },
      },
      watchlistItems: { select: { id: true } },
      alertRules: { select: { id: true, isActive: true } },
    },
    orderBy: { symbol: "asc" },
  });

  return stocks.map((stock) => {
    const nasdaq100Membership =
      stock.universeMemberships.find((m) => m.universe.slug === "nasdaq-100") ?? null;

    const quote = stock.quote;
    const score = stock.score;
    const metric = stock.metric;

    const quoteSourceRaw = quote?.source ?? null;
    const quoteSourceLabel = normalizeSource(quoteSourceRaw);

    // Finnhub /quote does not return volume — if source is finnhub and volume exists, it's from a prior provider
    let volumeSourceLabel: string;
    if (!quote || quote.volume == null) {
      volumeSourceLabel = "N/A";
    } else if (quoteSourceRaw?.toLowerCase() === "finnhub") {
      volumeSourceLabel = "Mixed";
    } else {
      volumeSourceLabel = quoteSourceLabel;
    }

    let scannerEligible = false;
    let missingReason = "Ready for scanner";
    if (!stock.isActive) {
      missingReason = "Inactive stock";
    } else if (!quote) {
      missingReason = "Missing quote";
    } else if (!score) {
      missingReason = "Missing score";
    } else {
      scannerEligible = true;
    }

    return {
      id: stock.id,
      symbol: stock.symbol,
      companyName: stock.name ?? null,
      sector: stock.sector ?? null,
      marketCap: stock.marketCap ?? null,

      inNasdaq100: nasdaq100Membership !== null,
      universeSource: nasdaq100Membership?.source ?? null,
      membershipActive: nasdaq100Membership?.isActive ?? false,
      membershipLastSeenAt: formatShortDate(nasdaq100Membership?.lastSeenAt),

      hasQuote: quote !== null,
      price: fmtDecimal(quote?.price),
      changePercent: quote !== null ? `${fmtDecimal(quote.changePercent)}%` : null,
      open: fmtDecimal(quote?.open),
      dayHigh: fmtDecimal(quote?.dayHigh),
      dayLow: fmtDecimal(quote?.dayLow),
      previousClose: fmtDecimal(quote?.previousClose),
      volume: quote?.volume ?? null,
      volumeSourceLabel,
      quoteSource: quoteSourceRaw,
      quoteSourceLabel,
      quoteLastSyncedAt: formatShortDate(quote?.lastSyncedAt),
      quoteSourceUpdatedAt: formatShortDate(quote?.sourceUpdatedAt),

      hasScore: score !== null,
      fundamentalScore: score?.fundamentalScore != null ? fmtDecimal(score.fundamentalScore, 1) : null,
      growthScore: score?.growthScore != null ? fmtDecimal(score.growthScore, 1) : null,
      profitabilityScore: score?.profitabilityScore != null ? fmtDecimal(score.profitabilityScore, 1) : null,
      valuationScore: score?.valuationScore != null ? fmtDecimal(score.valuationScore, 1) : null,
      financialHealthScore: score?.financialHealthScore != null ? fmtDecimal(score.financialHealthScore, 1) : null,
      riskContextScore: score?.riskContextScore != null ? fmtDecimal(score.riskContextScore, 1) : null,
      scoreVersion: score?.scoreVersion ?? null,
      scoreLastCalculatedAt: formatShortDate(score?.lastCalculatedAt),
      scannerEligible,
      missingReason,

      hasMetric: metric !== null,
      metricProvider: metric?.provider ?? null,
      metricLastSyncedAt: formatShortDate(metric?.lastSyncedAt),
      revenueGrowthTTMYoy: metric?.revenueGrowthTTMYoy != null ? `${fmtDecimal(metric.revenueGrowthTTMYoy)}%` : null,
      epsGrowthTTMYoy: metric?.epsGrowthTTMYoy != null ? `${fmtDecimal(metric.epsGrowthTTMYoy)}%` : null,
      revenueGrowth3Y: metric?.revenueGrowth3Y != null ? `${fmtDecimal(metric.revenueGrowth3Y)}%` : null,
      epsGrowth3Y: metric?.epsGrowth3Y != null ? `${fmtDecimal(metric.epsGrowth3Y)}%` : null,
      grossMarginTTM: metric?.grossMarginTTM != null ? `${fmtDecimal(metric.grossMarginTTM)}%` : null,
      operatingMarginTTM: metric?.operatingMarginTTM != null ? `${fmtDecimal(metric.operatingMarginTTM)}%` : null,
      netProfitMarginTTM: metric?.netProfitMarginTTM != null ? `${fmtDecimal(metric.netProfitMarginTTM)}%` : null,
      roeTTM: metric?.roeTTM != null ? `${fmtDecimal(metric.roeTTM)}%` : null,
      roaTTM: metric?.roaTTM != null ? `${fmtDecimal(metric.roaTTM)}%` : null,
      totalDebtToEquityAnnual: fmtDecimal(metric?.totalDebtToEquityAnnual),
      currentRatioAnnual: fmtDecimal(metric?.currentRatioAnnual),
      peBasicExclExtraTTM: fmtDecimal(metric?.peBasicExclExtraTTM),
      forwardPE: fmtDecimal(metric?.forwardPE),
      pegTTM: fmtDecimal(metric?.pegTTM),
      psTTM: fmtDecimal(metric?.psTTM),
      pbAnnual: fmtDecimal(metric?.pbAnnual),
      evEbitdaTTM: fmtDecimal(metric?.evEbitdaTTM),
      epsTTM: fmtDecimal(metric?.epsTTM),
      beta: fmtDecimal(metric?.beta),
      marketCapitalizationMetric: metric?.marketCapitalization != null
        ? `$${(parseFloat(metric.marketCapitalization.toString()) / 1e9).toFixed(2)}B`
        : null,
      week52High: fmtDecimal(metric?.week52High),
      week52Low: fmtDecimal(metric?.week52Low),
      dividendYieldIndicatedAnnual: metric?.dividendYieldIndicatedAnnual != null
        ? `${fmtDecimal(metric.dividendYieldIndicatedAnnual)}%`
        : null,

      inWatchlist: stock.watchlistItems.length > 0,
      hasActiveAlert: stock.alertRules.some((r) => r.isActive),
    };
  });
}
