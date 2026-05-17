import { prisma } from "@/src/lib/db/prisma";
import type {
  HotStock,
  WatchlistItem,
  StockDrawerDetail,
  ScannerSetup,
  ScoreChange,
  AiInsight,
  RecentAlert,
  RiskLevel,
} from "@/src/lib/mock-data";

export type DashboardUser = {
  name: string;
  email: string;
  initials: string;
  plan: string;
};

export type DashboardData = {
  user: DashboardUser;
  marketStats: Array<{ label: string; value: string; change: string; up: boolean }>;
  summaryCards: Array<{ label: string; value: number; icon: string; color: string }>;
  hotStocks: HotStock[];
  watchlistItems: WatchlistItem[];
  stockDrawerDetails: Record<string, StockDrawerDetail>;
  discoverSetups: ScannerSetup[];
  topScoreChanges: ScoreChange[];
  aiInsights: AiInsight[];
  recentAlerts: RecentAlert[];
};

export async function getDashboardData(): Promise<DashboardData> {
  const [
    dbUser,
    dbMarketStats,
    dbSummaryCards,
    dbStocks,
    dbWatchlistItems,
    dbSetups,
    dbScoreChanges,
    dbAiInsights,
    dbAlerts,
  ] = await Promise.all([
    prisma.user.findFirst({ orderBy: { createdAt: "asc" } }),
    prisma.marketStat.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.dashboardSummaryCard.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.stock.findMany({
      where: { isActive: true, quote: { isNot: null }, score: { isNot: null } },
      include: { quote: true, score: true, drawerDetail: true },
      orderBy: { score: { hotScore: "desc" } },
    }),
    prisma.watchlistItem.findMany({
      include: { stock: { include: { quote: true, score: true } } },
      orderBy: { createdAt: "asc" },
    }),
    prisma.discoverSetup.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.stockScore.findMany({
      orderBy: { hotScoreChange: "desc" },
      take: 4,
      include: { stock: true },
    }),
    prisma.aiInsight.findMany({ orderBy: { minutesAgo: "asc" }, take: 10 }),
    prisma.recentAlert.findMany({ orderBy: { minutesAgo: "asc" }, take: 10 }),
  ]);

  // ── User ─────────────────────────────────────────────────────────────────────
  const user: DashboardUser = {
    name: dbUser?.name ?? "User",
    email: dbUser?.email ?? "",
    initials: dbUser?.initials ?? "U",
    plan: dbUser?.plan ?? "FREE",
  };

  // ── Market Stats ─────────────────────────────────────────────────────────────
  const marketStats = dbMarketStats.map((s) => ({
    label: s.label,
    value: s.value,
    change: s.change,
    up: s.up,
  }));

  // ── Summary Cards ────────────────────────────────────────────────────────────
  const summaryCards = dbSummaryCards.map((c) => ({
    label: c.label,
    value: c.value,
    icon: c.icon,
    color: c.color,
  }));

  // ── Hot Stocks ────────────────────────────────────────────────────────────────
  const hotStocks: HotStock[] = dbStocks
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
      inWatchlist: dbWatchlistItems.some((w) => w.stockId === s.id),
      sector: s.sector ?? "",
      weekChange: Number(s.quote!.weekChange),
      monthChange: Number(s.quote!.monthChange),
      volume: s.quote!.volume ?? "",
      relativeVolume: Number(s.quote!.relativeVolume ?? 0),
      analystTarget: Number(s.quote!.analystTarget ?? 0),
      analystUpside: Number(s.quote!.analystUpside ?? 0),
      analystRating: s.quote!.analystRating ?? "",
      marketCap: s.marketCap ?? "",
    }));

  // ── Watchlist Items ──────────────────────────────────────────────────────────
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

  // ── Stock Drawer Details ──────────────────────────────────────────────────────
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

  // ── Discover Setups ──────────────────────────────────────────────────────────
  const discoverSetups: ScannerSetup[] = dbSetups.map((s) => ({
    slug: s.slug,
    name: s.name,
    icon: s.icon,
    description: s.description,
    tickers: s.tickers,
  }));

  // ── Top Score Changes ─────────────────────────────────────────────────────────
  const topScoreChanges: ScoreChange[] = dbScoreChanges.map((s) => ({
    symbol: s.stock.symbol,
    hotScore: s.hotScore,
    hotScoreChange: s.hotScoreChange,
    oppScore: s.opportunityScore,
    oppScoreChange: s.opportunityChange,
    reason: s.signalLabel ?? "",
  }));

  // ── AI Insights ──────────────────────────────────────────────────────────────
  const aiInsights: AiInsight[] = dbAiInsights.map((i) => ({
    symbol: i.symbol,
    sentiment: i.sentiment as "bullish" | "cautious" | "bearish",
    title: i.title,
    summary: i.summary,
    minutesAgo: i.minutesAgo,
  }));

  // ── Recent Alerts ─────────────────────────────────────────────────────────────
  const recentAlerts: RecentAlert[] = dbAlerts.map((a) => ({
    symbol: a.symbol,
    type: a.type as RecentAlert["type"],
    message: a.message,
    note: a.note,
    minutesAgo: a.minutesAgo,
    isNew: a.isNew,
    icon: a.icon as "trending-up" | "flame",
  }));

  return {
    user,
    marketStats,
    summaryCards,
    hotStocks,
    watchlistItems,
    stockDrawerDetails,
    discoverSetups,
    topScoreChanges,
    aiInsights,
    recentAlerts,
  };
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
