export const mockUser = {
  id: "user_1",
  name: "John Doe",
  email: "orann1@gmail.com",
  image: null,
  plan: "PRO" as const,
  initials: "JD",
};

export const mockTodaysSignal = {
  summary:
    "US market is bullish today. AI infrastructure stocks are leading momentum, but several names look overextended. Best current setup: AMD. Highest FOMO risk: SMCI.",
  tags: ["Bullish Market", "Best Setup: AMD", "FOMO Risk: SMCI"],
  sentiment: "bullish" as const,
};

export const mockMarketStats = [
  { label: "S&P 500", value: "5,432.12", change: "+1.24%", up: true },
  { label: "NASDAQ", value: "17,892.45", change: "+1.87%", up: true },
  { label: "DOW", value: "39,127.80", change: "-0.03%", up: false },
  { label: "VIX", value: "14.23", change: "-6.22%", up: false },
];

export const mockSummaryCards = [
  { label: "Hot Stocks Today", value: 24, icon: "Flame", color: "orange" },
  { label: "Top Opportunities", value: 18, icon: "Target", color: "emerald" },
  { label: "Active Alerts", value: 7, icon: "Bell", color: "amber" },
];

export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "EXTREME";

export type HotStock = {
  symbol: string;
  name: string;
  price: number;
  change: number;
  setup: string;
  hot: number;
  opp: number;
  risk: RiskLevel;
  catalyst: string;
  inWatchlist: boolean;
  sector: string;
  weekChange: number;
  monthChange: number;
  volume: string;
  relativeVolume: number;
  analystTarget: number;
  analystUpside: number;
  analystRating: string;
  marketCap: string;
  universeSlugs?: string[];
  isSp500?: boolean;
  isNasdaq100?: boolean;
  isRussell1000?: boolean;
  isRussell1000Only?: boolean;
  // Phase 10: fundamental score fields (from StockScore)
  fundamentalScore?: number | null;
  growthScore?: number | null;
  profitabilityScore?: number | null;
  valuationScore?: number | null;
  financialHealthScore?: number | null;
  riskContextScore?: number | null;
  // Phase 10: key metric fields (from StockMetric)
  peRatio?: number | null;
  pegRatio?: number | null;
  revenueGrowth?: number | null;
  epsGrowth?: number | null;
  roe?: number | null;
  debtToEquity?: number | null;
  marketCapFull?: number | null;
  // Phase 11: detail panel metric fields
  grossMargin?: number | null;
  operatingMargin?: number | null;
  netMargin?: number | null;
  roa?: number | null;
  currentRatio?: number | null;
  quickRatio?: number | null;
  interestCoverage?: number | null;
  forwardPE?: number | null;
  forwardPEG?: number | null;
  ps?: number | null;
  pb?: number | null;
  evToEbitda?: number | null;
  revenueGrowth3Y?: number | null;
  epsGrowth3Y?: number | null;
  beta?: number | null;
  // Phase 11: score metadata
  scoreVersion?: string | null;
  scoreLastCalculated?: string | null;
  // Phase 11: data freshness
  quoteLastSynced?: string | null;
  metricsLastSynced?: string | null;
  quoteSource?: string | null;
  metricsSource?: string | null;
  // Phase 13: opportunity score
  oppScore?: number | null;
  oppScoreVersion?: string | null;
  oppCalculatedAt?: string | null;
  // Phase 14: analyst data
  analystTargetPrice?: number | null;
  analystUpsidePercent?: number | null;
  analystRatingNormalized?: string | null;
  analystCount?: number | null;
  analystTargetHigh?: number | null;
  analystTargetLow?: number | null;
  analystTargetMedian?: number | null;
  analystSource?: string | null;
  analystLastSyncedAt?: string | null;
  analystStrongBuyCount?: number | null;
  analystBuyCount?: number | null;
  analystHoldCount?: number | null;
  analystSellCount?: number | null;
  analystStrongSellCount?: number | null;
  // Phase 21A: quote 52W and moving average fields
  week52High?: number | null;
  week52Low?: number | null;
  priceAvg50?: number | null;
  priceAvg200?: number | null;
};

export const mockHotStocks: HotStock[] = [
  {
    symbol: "NVDA",
    name: "NVIDIA Corporation",
    price: 924.32,
    change: 8.42,
    setup: "Pullback Watch",
    hot: 94,
    opp: 78,
    risk: "MEDIUM",
    catalyst: "AI demand surge",
    inWatchlist: true,
    sector: "Technology",
    weekChange: 12.1,
    monthChange: 24.3,
    volume: "48.2M",
    relativeVolume: 2.4,
    analystTarget: 1050,
    analystUpside: 13.6,
    analystRating: "Strong Buy",
    marketCap: "$2.27T",
  },
  {
    symbol: "SMCI",
    name: "Super Micro Computer",
    price: 812.45,
    change: 10.96,
    setup: "Extended",
    hot: 91,
    opp: 65,
    risk: "HIGH",
    catalyst: "Earnings beat",
    inWatchlist: false,
    sector: "Technology",
    weekChange: 18.4,
    monthChange: 32.1,
    volume: "12.1M",
    relativeVolume: 3.1,
    analystTarget: 950,
    analystUpside: 17.0,
    analystRating: "Buy",
    marketCap: "$48.2B",
  },
  {
    symbol: "PLTR",
    name: "Palantir Technologies",
    price: 24.87,
    change: 4.23,
    setup: "Track",
    hot: 82,
    opp: 71,
    risk: "MEDIUM",
    catalyst: "New gov contract",
    inWatchlist: false,
    sector: "Technology",
    weekChange: 7.2,
    monthChange: 15.8,
    volume: "62.4M",
    relativeVolume: 1.8,
    analystTarget: 28,
    analystUpside: 12.5,
    analystRating: "Hold",
    marketCap: "$53.1B",
  },
  {
    symbol: "TSLA",
    name: "Tesla Inc.",
    price: 179.32,
    change: -2.14,
    setup: "Avoid",
    hot: 74,
    opp: 58,
    risk: "HIGH",
    catalyst: "Price cuts impact",
    inWatchlist: true,
    sector: "Consumer Cyclical",
    weekChange: -4.1,
    monthChange: -8.3,
    volume: "108.7M",
    relativeVolume: 1.3,
    analystTarget: 210,
    analystUpside: 17.1,
    analystRating: "Hold",
    marketCap: "$570.4B",
  },
  {
    symbol: "AMD",
    name: "Advanced Micro Devices",
    price: 158.42,
    change: 5.67,
    setup: "Near Entry",
    hot: 88,
    opp: 82,
    risk: "MEDIUM",
    catalyst: "MI300X demand",
    inWatchlist: true,
    sector: "Technology",
    weekChange: 9.3,
    monthChange: 18.7,
    volume: "38.9M",
    relativeVolume: 2.1,
    analystTarget: 195,
    analystUpside: 23.1,
    analystRating: "Buy",
    marketCap: "$256.8B",
  },
];

export type ScoreChange = {
  symbol: string;
  hotScore: number;
  hotScoreChange: number;
  oppScore: number;
  oppScoreChange: number;
  reason: string;
};

export const mockTopScoreChanges: ScoreChange[] = [
  { symbol: "SOFI", hotScore: 82, hotScoreChange: 14, oppScore: 71, oppScoreChange: 8, reason: "Earnings surprise" },
  { symbol: "SMCI", hotScore: 91, hotScoreChange: 12, oppScore: 65, oppScoreChange: -3, reason: "Volume spike" },
  { symbol: "KVYO", hotScore: 74, hotScoreChange: 9, oppScore: 68, oppScoreChange: 5, reason: "Analyst upgrade" },
  { symbol: "MHNI", hotScore: 67, hotScoreChange: 7, oppScore: 72, oppScoreChange: 11, reason: "Sector rotation" },
];

export type WatchStatus = "WATCHING" | "WAITING_FOR_PULLBACK" | "READY_TO_BUY" | "HOLDING" | "AVOIDING" | "ARCHIVED";

export type WatchlistItem = {
  symbol: string;
  name: string;
  price: number;
  change: number;
  hot: number;
  opp: number;
  status: WatchStatus;
  entryZoneLow: number;
  entryZoneHigh: number;
  target: number;
  stopLoss: number;
  notes: string;
};

export const mockWatchlist: WatchlistItem[] = [
  {
    symbol: "NVDA",
    name: "NVIDIA Corporation",
    price: 924.32,
    change: 8.42,
    hot: 94,
    opp: 78,
    status: "WATCHING",
    entryZoneLow: 880,
    entryZoneHigh: 920,
    target: 1050,
    stopLoss: 840,
    notes: "Pullback Watch",
  },
  {
    symbol: "PLTR",
    name: "Palantir Technologies",
    price: 24.87,
    change: 4.23,
    hot: 82,
    opp: 71,
    status: "READY_TO_BUY",
    entryZoneLow: 23,
    entryZoneHigh: 25,
    target: 32,
    stopLoss: 21,
    notes: "Super 60 setup",
  },
  {
    symbol: "AMD",
    name: "Advanced Micro Devices",
    price: 158.42,
    change: 5.67,
    hot: 88,
    opp: 82,
    status: "WATCHING",
    entryZoneLow: 150,
    entryZoneHigh: 160,
    target: 195,
    stopLoss: 140,
    notes: "AI cycle play",
  },
];

export type ScannerSetup = {
  slug: string;
  name: string;
  icon: string;
  description: string;
  tickers: string[];
};

export const mockDiscoverSetups: ScannerSetup[] = [
  {
    slug: "hot-today",
    name: "Hot Today",
    icon: "🔥",
    description: "Highest current activity",
    tickers: ["NVDA", "SMCI", "PLTR"],
  },
  {
    slug: "strong-momentum",
    name: "Strong Momentum",
    icon: "📈",
    description: "Stocks with strong short-term trend",
    tickers: ["AMD", "META", "ANET"],
  },
  {
    slug: "best-opportunities",
    name: "Best Opportunities",
    icon: "🎯",
    description: "Strong risk/reward based on scoring",
    tickers: ["SMCI", "SOFI", "KVYO"],
  },
  {
    slug: "unusual-volume",
    name: "Unusual Volume",
    icon: "🌋",
    description: "Relative volume spikes",
    tickers: ["DIS", "PFE", "VO"],
  },
  {
    slug: "breakout-candidates",
    name: "Breakout Candidates",
    icon: "🚀",
    description: "Technical breakout setups",
    tickers: ["ORCL", "PANW", "ZS"],
  },
  {
    slug: "oversold-opportunities",
    name: "Oversold Opportunities",
    icon: "🧊",
    description: "Pullbacks with possible upside",
    tickers: ["BURL", "LULU", "DKNG"],
  },
  {
    slug: "earnings-crash-watch",
    name: "Earnings Crash Watch",
    icon: "📉",
    description: "Possible overreactions after earnings",
    tickers: ["SMCI", "META", "COIN"],
  },
  {
    slug: "fomo-risk",
    name: "FOMO Risk",
    icon: "⚡",
    description: "Possible overextension — high risk",
    tickers: ["SMCI", "META, COIN"],
  },
];

export type AiInsight = {
  symbol: string;
  sentiment: "bullish" | "cautious" | "bearish";
  title: string;
  summary: string;
  minutesAgo: number;
};

export const mockAiInsights: AiInsight[] = [
  {
    symbol: "NVDA",
    sentiment: "bullish",
    title: "Strong momentum continues",
    summary:
      "NVIDIA AI chip demand remains exceptionally strong. Data center revenue beat expectations by 15%. Technical indicators suggest continued bullish momentum.",
    minutesAgo: 10,
  },
  {
    symbol: "SMCI",
    sentiment: "cautious",
    title: "Potential overextension warning",
    summary:
      "Super Micro Computer has rallied 45% in 2 weeks. RSI at 78 suggests overbought conditions. Consider waiting for a pullback before entry.",
    minutesAgo: 25,
  },
  {
    symbol: "AMD",
    sentiment: "bullish",
    title: "Best setup of the day",
    summary:
      "AMD is consolidating near key support with improving momentum. MI300X orders exceeding expectations. Good risk/reward entry point.",
    minutesAgo: 45,
  },
];

export type AlertType =
  | "PRICE_ABOVE"
  | "PRICE_BELOW"
  | "HOT_SCORE_ABOVE"
  | "RELATIVE_VOLUME_ABOVE"
  | "DAILY_CHANGE_ABOVE";

export type RecentAlert = {
  symbol: string;
  type: AlertType;
  message: string;
  note: string;
  minutesAgo: number;
  isNew: boolean;
  icon: "trending-up" | "flame";
};

export const mockRecentAlerts: RecentAlert[] = [
  {
    symbol: "NVDA",
    type: "PRICE_ABOVE",
    message: "NVDA crossed above $920",
    note: "Momentum is strong, but price is now near your target zone.",
    minutesAgo: 2,
    isNew: true,
    icon: "trending-up",
  },
  {
    symbol: "SMCI",
    type: "HOT_SCORE_ABOVE",
    message: "SMCI Hot Score reached 91",
    note: "One of the highest scores today. Consider reviewing your position sizing.",
    minutesAgo: 15,
    isNew: true,
    icon: "flame",
  },
  {
    symbol: "AMD",
    type: "RELATIVE_VOLUME_ABOVE",
    message: "AMD relative volume 2.1x",
    note: "Volume picking up near support zone — worth watching.",
    minutesAgo: 34,
    isNew: false,
    icon: "trending-up",
  },
];

export type StockDrawerDetail = {
  suggestedAction: string;
  fomoRisk: string;
  entryContext: string;
  hotDelta: number;
  oppDelta: number;
  hotScoreExplain: string;
  oppScoreExplain: string;
  hotBreakdown: { momentum: number; volumeHeat: number; catalyst: number; technicals: number };
  oppBreakdown: { analystUpside: number; fundamentals: number; valuation: number; entryQuality: number };
  aiWhatsHappening: string;
  aiWhatItMeans: string;
  aiWhatToWatch: string;
  aiSentiment: "bullish" | "cautious" | "bearish";
  aiGeneratedMinutes: number;
  catalystType: string;
  catalystExplanation: string;
  catalystConfidence: "High" | "Medium" | "Low";
  catalystSource: string;
  catalystHoursAgo: number;
  entryZoneLow: number;
  entryZoneHigh: number;
  target: number;
  distanceToTarget: string;
  priceEntryContext: string;
  watchSince?: string;
  hotScoreChangeSinceAdded?: number;
  oppScoreChangeSinceAdded?: number;
  latestPersonalSignal?: string;
  stopLoss?: number;
  signalQuality: string;
  lastUpdatedMinutes: number;
  suggestedTrackingReason?: string;
};

export const mockStockDrawerDetails: Record<string, StockDrawerDetail> = {
  NVDA: {
    suggestedAction: "Wait for pullback",
    fomoRisk: "Medium — extended from entry",
    entryContext: "Above ideal entry zone",
    hotDelta: 6,
    oppDelta: 2,
    hotScoreExplain: "Driven by AI chip demand and strong volume confirmation",
    oppScoreExplain: "Solid upside potential but entry is stretched",
    hotBreakdown: { momentum: 92, volumeHeat: 88, catalyst: 95, technicals: 80 },
    oppBreakdown: { analystUpside: 74, fundamentals: 90, valuation: 65, entryQuality: 55 },
    aiWhatsHappening: "NVIDIA's data center revenue continues to exceed expectations, driven by massive AI infrastructure demand from hyperscalers.",
    aiWhatItMeans: "Strong momentum, but price is above the ideal entry zone. Confirmation from a pullback would improve risk/reward significantly.",
    aiWhatToWatch: "Look for a pullback toward $880–$920 support zone or confirmation of institutional buying on above-average volume.",
    aiSentiment: "bullish",
    aiGeneratedMinutes: 10,
    catalystType: "AI demand surge",
    catalystExplanation: "Data center revenue and chip demand remain exceptionally strong. Hyperscaler capex expanding significantly.",
    catalystConfidence: "High",
    catalystSource: "Latest market update",
    catalystHoursAgo: 2,
    entryZoneLow: 880,
    entryZoneHigh: 920,
    target: 1050,
    distanceToTarget: "+13.6%",
    priceEntryContext: "Above ideal entry zone",
    watchSince: "Mar 2024",
    hotScoreChangeSinceAdded: 12,
    oppScoreChangeSinceAdded: 5,
    latestPersonalSignal: "Track closely — near upper entry zone",
    stopLoss: 840,
    signalQuality: "Strong but Extended",
    lastUpdatedMinutes: 2,
  },
  SMCI: {
    suggestedAction: "Needs confirmation",
    fomoRisk: "High — extended 45% in 2 weeks",
    entryContext: "Extended — wait for consolidation",
    hotDelta: 12,
    oppDelta: -3,
    hotScoreExplain: "Volume surge on earnings beat driving momentum score",
    oppScoreExplain: "High upside but overextended technicals reduce opportunity score",
    hotBreakdown: { momentum: 95, volumeHeat: 96, catalyst: 90, technicals: 72 },
    oppBreakdown: { analystUpside: 80, fundamentals: 75, valuation: 55, entryQuality: 40 },
    aiWhatsHappening: "Super Micro Computer rallied sharply on a strong earnings beat with AI server demand driving revenue well above guidance.",
    aiWhatItMeans: "Momentum is very high, but the stock is technically overextended. RSI near 78 raises significant caution flags.",
    aiWhatToWatch: "Monitor for a pullback to $720–$760 before considering entry. Volume normalization is a key signal to watch.",
    aiSentiment: "cautious",
    aiGeneratedMinutes: 25,
    catalystType: "Earnings beat",
    catalystExplanation: "Q2 earnings exceeded estimates by 18%. AI server shipments ahead of guidance with strong forward orders.",
    catalystConfidence: "High",
    catalystSource: "Earnings release",
    catalystHoursAgo: 6,
    entryZoneLow: 720,
    entryZoneHigh: 760,
    target: 950,
    distanceToTarget: "+17.0%",
    priceEntryContext: "Extended — well above entry zone",
    signalQuality: "Hot but Overextended",
    lastUpdatedMinutes: 5,
    suggestedTrackingReason: "Earnings momentum stock — watch for pullback to entry zone",
  },
  PLTR: {
    suggestedAction: "Track closely",
    fomoRisk: "Low — within entry zone",
    entryContext: "Near entry zone",
    hotDelta: 9,
    oppDelta: 5,
    hotScoreExplain: "Government contract catalyst boosting momentum score",
    oppScoreExplain: "Fair valuation with solid analyst upside and clean setup",
    hotBreakdown: { momentum: 78, volumeHeat: 75, catalyst: 85, technicals: 82 },
    oppBreakdown: { analystUpside: 72, fundamentals: 68, valuation: 70, entryQuality: 78 },
    aiWhatsHappening: "Palantir secured a new government AI contract expanding its federal data platform footprint significantly.",
    aiWhatItMeans: "The catalyst is real and recurring. Government contracts provide durable revenue visibility over multiple years.",
    aiWhatToWatch: "Watch for commercial segment acceleration and whether the stock holds above $23 on any pullback.",
    aiSentiment: "bullish",
    aiGeneratedMinutes: 18,
    catalystType: "Government contract",
    catalystExplanation: "New multi-year federal AI data platform contract adds to recurring revenue backlog.",
    catalystConfidence: "High",
    catalystSource: "Company announcement",
    catalystHoursAgo: 4,
    entryZoneLow: 23,
    entryZoneHigh: 25,
    target: 32,
    distanceToTarget: "+12.5%",
    priceEntryContext: "Near entry zone",
    signalQuality: "Worth Watching",
    lastUpdatedMinutes: 3,
    suggestedTrackingReason: "Government AI contract catalyst with clean technical setup",
  },
  TSLA: {
    suggestedAction: "Wait for confirmation",
    fomoRisk: "Medium — declining momentum",
    entryContext: "Below support — caution zone",
    hotDelta: -5,
    oppDelta: -3,
    hotScoreExplain: "Price cuts and margin pressure weighing on momentum score",
    oppScoreExplain: "Analyst upside remains but fundamentals under increasing pressure",
    hotBreakdown: { momentum: 45, volumeHeat: 72, catalyst: 60, technicals: 50 },
    oppBreakdown: { analystUpside: 65, fundamentals: 50, valuation: 52, entryQuality: 48 },
    aiWhatsHappening: "Tesla's aggressive price cutting strategy is weighing on margins and investor confidence across multiple global markets.",
    aiWhatItMeans: "The setup is weak. Revenue growth is slowing while competition is intensifying from Chinese EV makers.",
    aiWhatToWatch: "Watch Q3 delivery numbers and whether gross margins stabilize above 15%. A break above $185 would improve the setup.",
    aiSentiment: "cautious",
    aiGeneratedMinutes: 40,
    catalystType: "Price cut impact",
    catalystExplanation: "Multiple global price cuts in Q2 pressured margins. Market reacted negatively to margin guidance reduction.",
    catalystConfidence: "Medium",
    catalystSource: "Earnings call",
    catalystHoursAgo: 12,
    entryZoneLow: 165,
    entryZoneHigh: 175,
    target: 210,
    distanceToTarget: "+17.1%",
    priceEntryContext: "Near lower entry zone",
    watchSince: "Jan 2024",
    hotScoreChangeSinceAdded: -8,
    oppScoreChangeSinceAdded: -5,
    latestPersonalSignal: "Avoid for now — setup is weak",
    stopLoss: 155,
    signalQuality: "Weak Setup",
    lastUpdatedMinutes: 8,
  },
  AMD: {
    suggestedAction: "Near entry zone",
    fomoRisk: "Low — consolidating near support",
    entryContext: "Near ideal entry zone",
    hotDelta: 8,
    oppDelta: 7,
    hotScoreExplain: "MI300X demand catalyst with strong volume confirmation",
    oppScoreExplain: "Best opportunity score today — strong risk/reward at current price",
    hotBreakdown: { momentum: 85, volumeHeat: 82, catalyst: 88, technicals: 86 },
    oppBreakdown: { analystUpside: 88, fundamentals: 82, valuation: 78, entryQuality: 84 },
    aiWhatsHappening: "AMD is consolidating near key support after strong MI300X AI chip demand data from major cloud customers.",
    aiWhatItMeans: "Best setup of the day. The stock is near an attractive entry zone with strong fundamental and technical support.",
    aiWhatToWatch: "Watch for continuation above $162 as confirmation of breakout. Volume should be above average on the move.",
    aiSentiment: "bullish",
    aiGeneratedMinutes: 45,
    catalystType: "AI chip demand",
    catalystExplanation: "MI300X AI accelerator orders exceeding expectations. Data center customers increasing orders significantly.",
    catalystConfidence: "High",
    catalystSource: "Industry data + analyst updates",
    catalystHoursAgo: 3,
    entryZoneLow: 150,
    entryZoneHigh: 160,
    target: 195,
    distanceToTarget: "+23.1%",
    priceEntryContext: "Near entry zone",
    watchSince: "Feb 2024",
    hotScoreChangeSinceAdded: 15,
    oppScoreChangeSinceAdded: 10,
    latestPersonalSignal: "Track closely — near ideal entry",
    stopLoss: 140,
    signalQuality: "Strong Signal",
    lastUpdatedMinutes: 1,
  },
};
