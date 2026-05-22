// Nasdaq 100 static fallback symbol list.
//
// Source strategy:
//   FMP /stable/nasdaq-constituent returns HTTP 402 on the current plan.
//   Finnhub /indices/constituents returns HTTP 200 with an HTML paywall — not parseable.
//   This list is cross-referenced against two manual validation sources (Jan 20 2026).
//   SNDK and WDC are excluded: present in one source only, not confirmed by the second.
//   GOOG and GOOGL are both included as separate trading tickers per standard Nasdaq 100 composition.
//   FMP /stable/profile is used only for profile enrichment (name, sector, marketCap) —
//   not as the constituent source.
//
// Update this list when quarterly rebalancing occurs.

export const NASDAQ_100_FALLBACK_METADATA = {
  source: "static_fallback",
  provider: "manual",
  index: "nasdaq-100",
  compositionAsOf: "2026-01-20",
  lastVerifiedAt: "2026-05-21",
  symbolCount: 100,
  notes:
    "FMP /stable/nasdaq-constituent returns HTTP 402 on current plan. Finnhub /indices/constituents returns HTTP 200 with HTML paywall — not parseable. Symbol list cross-referenced against two manual validation sources (Jan 20 2026). SNDK and WDC excluded: present in one source only, not confirmed by the second. CSCO and TSLA restored after being dropped in a prior alphabetization error. GOOG and GOOGL are both included as separate trading tickers per standard Nasdaq 100 composition.",
} as const;

export const NASDAQ_100_SYMBOLS: ReadonlyArray<string> = [
  "AAPL", "ABNB", "ADBE", "ADI",  "ADP",  "ADSK", "AEP",  "ALNY", "AMAT", "AMD",
  "AMGN", "AMZN", "APP",  "ARM",  "ASML", "AVGO", "AXON", "BKNG", "BKR",  "CCEP",
  "CDNS", "CEG",  "CHTR", "CMCSA","COST", "CPRT", "CRWD", "CSCO", "CSGP", "CSX",
  "CTAS", "CTSH", "DASH", "DDOG", "DXCM", "EA",   "EXC",  "EXPE", "FANG", "FAST",
  "FER",  "FTNT", "GEHC", "GILD", "GOOG", "GOOGL","HON",  "IDXX", "INSM", "INTC",
  "INTU", "ISRG", "KDP",  "KHC",  "KLAC", "LIN",  "LRCX", "MAR",  "MCHP", "MDLZ",
  "MELI", "META", "MNST", "MPWR", "MRVL", "MSFT", "MSTR", "MU",   "NFLX", "NVDA",
  "NXPI", "ODFL", "ORLY", "PANW", "PAYX", "PCAR", "PDD",  "PEP",  "PLTR", "PYPL",
  "QCOM", "REGN", "ROP",  "ROST", "SBUX", "SHOP", "SNPS", "STX",  "TMUS", "TRI",
  "TSLA", "TTWO", "TXN",  "VRSK", "VRTX", "WBD",  "WDAY", "WMT",  "XEL",  "ZS",
];

export type IndexConstituent = {
  symbol: string;
  companyName?: string | null;
  exchange?: string | null;
  sector?: string | null;
  industry?: string | null;
  marketCap?: number | null;
};
