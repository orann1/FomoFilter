export type RadarCategory =
  | "unusual_attention"
  | "beaten_down"
  | "possibly_undervalued"
  | "emerging_theme"
  | "pre_breakout"
  | "speculative_upside";

export type RadarTrendStatus =
  | "new_today"
  | "repeated"
  | "back_on_radar"
  | "cooling_down";

export type RadarTimeWindow = "today" | "yesterday" | "last7days" | "last30days";

export type RadarCandidateSnapshot = {
  radarConvictionScore: number;
  radarSignalStrength: number;
  opportunityScore: number;
  fundamentalScore: number;
  analystUpsidePercent: number;
  analystRating: string;
  valuationScore: number;
  stabilityScore: number;
  peRatio?: number | null;
  week52PositionPercent?: number;
  marketCapLabel?: string;
  priceChange1WPercent?: number;
  mockTrend30d?: number[];
};

export type RadarCandidate = {
  id: string;
  ticker: string;
  companyName: string;
  category: RadarCategory;
  headline: string;
  thesis: string;
  whyNow: string;
  mainCatalyst: string;
  bullCase: string;
  bearCase: string;
  nextCheck: string;
  attentionScore: number;
  confidenceScore: number;
  hypeRiskScore: number;
  bullets: [string, string, string];
  evidenceCount: number;
  sourceTypes: string[];
  tags: string[];
  trendStatus: RadarTrendStatus;
  appearancesLast7Days: number;
  appearancesLast30Days: number;
  firstSeenDate: string;
  lastSeenDate: string;
  previousCategories: string[];
  isFeatured?: boolean;
  snapshot: RadarCandidateSnapshot;
};
