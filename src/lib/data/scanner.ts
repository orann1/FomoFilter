import { prisma } from "@/src/lib/db/prisma";
import type { HotStock, WatchlistItem, StockDrawerDetail, RiskLevel } from "@/src/lib/mock-data";
import type { DashboardUser, ActiveAlertRule } from "@/src/lib/data/dashboard";

export type ScannerData = {
  user: DashboardUser;
  stocks: HotStock[];
  watchlistItems: WatchlistItem[];
  stockDrawerDetails: Record<string, StockDrawerDetail>;
  alertRulesBySymbol: Record<string, ActiveAlertRule[]>;
};

export async function getScannerData(): Promise<ScannerData> {
  const [dbUser, dbStocks, dbWatchlistItems] = await Promise.all([
    prisma.user.findFirst({ orderBy: { createdAt: "asc" } }),
    prisma.stock.findMany({
      where: { isActive: true, quote: { isNot: null }, score: { isNot: null } },
      include: { quote: true, score: true, drawerDetail: true },
      orderBy: { score: { hotScore: "desc" } },
    }),
    prisma.watchlistItem.findMany({
      include: { stock: { include: { quote: true, score: true } } },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const dbAlertRules = await prisma.alertRule.findMany({
    where: { isActive: true },
    include: { stock: { select: { symbol: true } } },
    orderBy: { createdAt: "desc" },
  });

  const user: DashboardUser = {
    name: dbUser?.name ?? "User",
    email: dbUser?.email ?? "",
    initials: dbUser?.initials ?? "U",
    plan: dbUser?.plan ?? "FREE",
  };

  const watchlistStockIds = new Set(dbWatchlistItems.map((w) => w.stockId));

  const stocks: HotStock[] = dbStocks
    .filter((s) => s.quote && s.score)
    .map((s) => ({
      symbol: s.symbol,
      name: s.name,
      price: Number(s.quote!.price),
      change: Number(s.quote!.changePercent),
      setup: s.score!.setupStatus,
      hot: s.score!.hotScore,
      opp: s.score!.opportunityScore,
      risk: s.score!.riskLevel as RiskLevel,
      catalyst: s.score!.catalyst,
      inWatchlist: watchlistStockIds.has(s.id),
      sector: s.sector ?? "",
      weekChange: Number(s.quote!.weekChange),
      monthChange: Number(s.quote!.monthChange),
      volume: s.quote!.volume ?? "",
      relativeVolume: Number(s.quote!.relativeVolume ?? 0),
      analystTarget: Number(s.quote!.analystTarget ?? 0),
      analystUpside: Number(s.quote!.analystUpside ?? 0),
      analystRating: s.quote!.analystRating ?? "",
      marketCap: String(s.marketCap ?? ""),
    }));

  const watchlistItems: WatchlistItem[] = dbWatchlistItems
    .filter((w) => w.stock.quote && w.stock.score)
    .map((w) => ({
      symbol: w.stock.symbol,
      name: w.stock.name,
      price: Number(w.stock.quote!.price),
      change: Number(w.stock.quote!.changePercent),
      hot: w.stock.score!.hotScore,
      opp: w.stock.score!.opportunityScore,
      status: mapDbWatchStatus(w.status),
      entryZoneLow: Number(w.entryZoneLow ?? 0),
      entryZoneHigh: Number(w.entryZoneHigh ?? 0),
      target: Number(w.target ?? 0),
      stopLoss: Number(w.stopLoss ?? 0),
      notes: w.reason ?? "",
    }));

  const stockDrawerDetails: Record<string, StockDrawerDetail> = {};
  for (const s of dbStocks) {
    const d = s.drawerDetail;
    const score = s.score;
    if (!d || !score) continue;

    stockDrawerDetails[s.symbol] = {
      suggestedAction: d.suggestedAction,
      fomoRisk: d.fomoRisk,
      entryContext: d.entryContext,
      hotDelta: d.hotDelta,
      oppDelta: d.oppDelta,
      hotScoreExplain: d.hotScoreExplain ?? "",
      oppScoreExplain: d.oppScoreExplain ?? "",
      hotBreakdown: {
        momentum: d.hotMomentum ?? 0,
        volumeHeat: d.hotVolumeHeat ?? 0,
        catalyst: d.hotCatalyst ?? 0,
        technicals: d.hotTechnicals ?? 0,
      },
      oppBreakdown: {
        analystUpside: d.oppAnalystUpside ?? 0,
        fundamentals: d.oppFundamentals ?? 0,
        valuation: d.oppValuation ?? 0,
        entryQuality: d.oppEntryQuality ?? 0,
      },
      aiWhatsHappening: d.aiWhatHappening,
      aiWhatItMeans: d.aiWhatItMeans,
      aiWhatToWatch: d.aiWhatToWatch,
      aiSentiment: d.aiSentiment as "bullish" | "cautious" | "bearish",
      aiGeneratedMinutes: d.aiGeneratedMinutes,
      catalystType: d.catalystType ?? "",
      catalystExplanation: d.catalystExplanation ?? "",
      catalystConfidence: (d.catalystConfidence as "High" | "Medium" | "Low") ?? "Medium",
      catalystSource: d.catalystSource ?? "",
      catalystHoursAgo: d.catalystHoursAgo ?? 0,
      entryZoneLow: Number(d.entryZoneLow ?? 0),
      entryZoneHigh: Number(d.entryZoneHigh ?? 0),
      target: Number(d.target ?? 0),
      distanceToTarget: d.distanceToTarget ?? "",
      priceEntryContext: d.entryContext,
      watchSince: d.watchSince ?? undefined,
      hotScoreChangeSinceAdded: score.hotScoreChange,
      oppScoreChangeSinceAdded: score.opportunityChange,
      latestPersonalSignal: d.latestPersonalSignal ?? undefined,
      signalQuality: d.signalQuality ?? "",
      lastUpdatedMinutes: d.lastUpdatedMinutes,
      suggestedTrackingReason: d.suggestedTrackingReason ?? undefined,
    };
  }

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

  return { user, stocks, watchlistItems, stockDrawerDetails, alertRulesBySymbol };
}

function mapDbWatchStatus(status: string): WatchlistItem["status"] {
  switch (status) {
    case "WAITING":
      return "WAITING_FOR_PULLBACK";
    case "READY_TO_BUY":
      return "READY_TO_BUY";
    case "HOLDING":
      return "HOLDING";
    case "AVOIDING":
      return "AVOIDING";
    case "ARCHIVED":
      return "ARCHIVED";
    default:
      return "WATCHING";
  }
}
