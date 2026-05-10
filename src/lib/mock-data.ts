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
    "US market is bullish today. AI infrastructure stocks are leading momentum but general retail data is underperforming. Best moves recap: AMD highest FOMO rate, SMC.",
  tags: ["Bullish Market", "Best Moves", "Watch: AMD, SMCI"],
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
};

export const mockHotStocks: HotStock[] = [
  {
    symbol: "NVDA",
    name: "NVIDIA Corporation",
    price: 924.32,
    change: 8.42,
    setup: "AI demand surge",
    hot: 94,
    opp: 78,
    risk: "MEDIUM",
    catalyst: "Earnings beat",
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
    setup: "Earnings beat",
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
    setup: "New gov contract",
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
    setup: "Price vol impact",
    hot: 74,
    opp: 58,
    risk: "HIGH",
    catalyst: "Price vol impact",
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
    setup: "MI300X demand",
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
