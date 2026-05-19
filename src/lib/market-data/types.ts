export type MarketDataProvider = "fmp" | "twelve-data" | "finnhub";

export type ProviderTestResult<T = unknown> = {
  ok: boolean;
  provider: MarketDataProvider;
  action: string;
  data?: T;
  error?: string;
  raw?: unknown;
};

export type NormalizedQuote = {
  symbol: string;
  price: number | null;
  changePercent: number | null;
  open: number | null;
  high: number | null;
  low: number | null;
  previousClose: number | null;
  volume: number | null;
  timestamp?: string | null;
  source: MarketDataProvider;
};

export type NormalizedCompanyProfile = {
  symbol: string;
  name: string | null;
  exchange: string | null;
  sector: string | null;
  industry: string | null;
  marketCap: number | null;
  currency: string | null;
  country: string | null;
  website?: string | null;
  description?: string | null;
  source: MarketDataProvider;
};

export type NormalizedNewsItem = {
  symbol: string;
  headline: string;
  summary?: string | null;
  url?: string | null;
  sourceName?: string | null;
  publishedAt?: string | null;
  source: MarketDataProvider;
};

export type SyncSummary = {
  provider: MarketDataProvider;
  action: string;
  symbolsRequested: string[];
  successCount: number;
  errorCount: number;
  failedSymbols: string[];
  persisted: boolean;
  errors: string[];
};
