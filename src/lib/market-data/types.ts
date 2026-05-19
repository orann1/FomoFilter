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

// Legacy summary type — kept for backward compatibility
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

export type SyncRunStatus = "success" | "partial_success" | "failed";

export type SyncSymbolResult = {
  symbol: string;
  status: "success" | "skipped" | "failed";
  reason?: string;
  dbAction: "updated" | "kept_existing" | "not_found" | "none";
};

export type SyncActionResult = {
  status: SyncRunStatus;
  provider: MarketDataProvider;
  action: string;
  requestedCount: number;
  successCount: number;
  skippedCount: number;
  failedCount: number;
  updatedSymbols: string[];
  skippedSymbols: SyncSymbolResult[];
  failedSymbols: SyncSymbolResult[];
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  persisted: boolean;
  message: string;
};
