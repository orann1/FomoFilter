import type {
  ProviderTestResult,
  NormalizedCompanyProfile,
} from "@/src/lib/market-data/types";
import {
  NASDAQ_100_SYMBOLS,
  type IndexConstituent,
} from "@/src/lib/market-data/nasdaq100-fallback-symbols";

// FMP deprecated all /api/v3/ legacy endpoints after August 31, 2025.
// All requests now use the /stable/ base URL with symbol as a query param.
const BASE_URL = "https://financialmodelingprep.com/stable";

function getApiKey(): string | null {
  return process.env.FMP_API_KEY ?? null;
}

function handleFmpError(
  status: number,
  body: string,
  action: string
): ProviderTestResult {
  const safe = body.slice(0, 300);
  if (status === 403) {
    return {
      ok: false,
      provider: "fmp",
      action,
      error: `FMP returned HTTP 403. The API key may be invalid or not authorized for this endpoint. No DB values were changed. Body: ${safe}`,
    };
  }
  if (status === 429) {
    return {
      ok: false,
      provider: "fmp",
      action,
      error: "FMP rate limit exceeded (429). No DB values were changed.",
    };
  }
  return {
    ok: false,
    provider: "fmp",
    action,
    error: `FMP responded with status ${status}. No DB values were changed. Body: ${safe}`,
  };
}

export async function testFmpProfile(
  symbol: string
): Promise<ProviderTestResult<NormalizedCompanyProfile>> {
  return fetchFmpCompanyProfile(symbol);
}

export async function fetchFmpCompanyProfile(
  symbol: string
): Promise<ProviderTestResult<NormalizedCompanyProfile>> {
  const apiKey = getApiKey();
  if (!apiKey) {
    return {
      ok: false,
      provider: "fmp",
      action: "company-profile",
      error: "Missing FMP_API_KEY",
    };
  }

  try {
    const url = `${BASE_URL}/profile?symbol=${encodeURIComponent(symbol)}&apikey=${apiKey}`;
    const res = await fetch(url, { cache: "no-store" });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return handleFmpError(res.status, body, "company-profile") as ProviderTestResult<NormalizedCompanyProfile>;
    }

    const json: unknown = await res.json();

    if (!Array.isArray(json) || json.length === 0) {
      return {
        ok: false,
        provider: "fmp",
        action: "company-profile",
        error: `No profile data returned for ${symbol}`,
        raw: json,
      };
    }

    const raw = json[0] as Record<string, unknown>;

    const profile: NormalizedCompanyProfile = {
      symbol: typeof raw.symbol === "string" ? raw.symbol : symbol,
      name: typeof raw.companyName === "string" ? raw.companyName : null,
      // stable endpoint uses "exchange", not "exchangeShortName"
      exchange: typeof raw.exchange === "string" ? raw.exchange : null,
      sector: typeof raw.sector === "string" ? raw.sector : null,
      industry: typeof raw.industry === "string" ? raw.industry : null,
      // stable endpoint uses "marketCap", not "mktCap"
      marketCap: typeof raw.marketCap === "number" ? raw.marketCap : null,
      beta: typeof raw.beta === "number" && Number.isFinite(raw.beta) ? raw.beta : null,
      currency: typeof raw.currency === "string" ? raw.currency : null,
      country: typeof raw.country === "string" ? raw.country : null,
      website: typeof raw.website === "string" ? raw.website : null,
      description: typeof raw.description === "string" ? raw.description : null,
      source: "fmp",
    };

    return {
      ok: true,
      provider: "fmp",
      action: "company-profile",
      data: profile,
      raw,
    };
  } catch (err) {
    return {
      ok: false,
      provider: "fmp",
      action: "company-profile",
      error: err instanceof Error ? err.message : "Unknown error fetching FMP profile",
    };
  }
}

export type FmpAnalystTarget = {
  symbol: string;
  targetHigh: number | null;
  targetLow: number | null;
  targetMean: number | null;
  targetMedian: number | null;
  strongBuy: number | null;
  buy: number | null;
  hold: number | null;
  sell: number | null;
  strongSell: number | null;
};

export async function fetchFmpAnalystTarget(
  symbol: string
): Promise<ProviderTestResult<FmpAnalystTarget>> {
  const apiKey = getApiKey();
  if (!apiKey) {
    return {
      ok: false,
      provider: "fmp",
      action: "analyst-target",
      error: "Missing FMP_API_KEY",
    };
  }

  try {
    const url = `${BASE_URL}/analyst-estimates?symbol=${encodeURIComponent(symbol)}&period=annual&limit=1&apikey=${apiKey}`;
    const res = await fetch(url, { cache: "no-store" });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return handleFmpError(res.status, body, "analyst-target") as ProviderTestResult<FmpAnalystTarget>;
    }

    const json: unknown = await res.json();
    if (!Array.isArray(json) || json.length === 0) {
      return {
        ok: false,
        provider: "fmp",
        action: "analyst-target",
        error: `No analyst data returned for ${symbol}`,
        raw: json,
      };
    }

    const raw = json[0] as Record<string, unknown>;
    const target: FmpAnalystTarget = {
      symbol,
      targetHigh: typeof raw.revenueHigh === "number" ? raw.revenueHigh : null,
      targetLow: typeof raw.revenueLow === "number" ? raw.revenueLow : null,
      targetMean: typeof raw.revenueAvg === "number" ? raw.revenueAvg : null,
      targetMedian: null,
      strongBuy: null,
      buy: null,
      hold: null,
      sell: null,
      strongSell: null,
    };

    return {
      ok: true,
      provider: "fmp",
      action: "analyst-target",
      data: target,
      raw,
    };
  } catch (err) {
    return {
      ok: false,
      provider: "fmp",
      action: "analyst-target",
      error: err instanceof Error ? err.message : "Unknown error fetching FMP analyst data",
    };
  }
}

// ── Price Target Summary ───────────────────────────────────────────────────────
//
// FMP /stable/price-target-summary returns an array of price target objects
// for a given symbol. This is the endpoint used in Phase 15 for target discovery.

export type FmpPriceTargetSummary = {
  symbol: string;
  targetHigh: number | null;
  targetLow: number | null;
  targetMean: number | null;
  targetMedian: number | null;
  targetConsensus: number | null;
};

export type FmpPriceTargetResult =
  | { ok: true; data: FmpPriceTargetSummary }
  | { ok: false; quotaExceeded: boolean; planLimited: boolean; error: string };

export async function fetchFmpPriceTargetSummary(
  symbol: string
): Promise<FmpPriceTargetResult> {
  const apiKey = getApiKey();
  if (!apiKey) {
    return { ok: false, quotaExceeded: false, planLimited: false, error: "Missing FMP_API_KEY" };
  }

  try {
    const url = `${BASE_URL}/price-target-summary?symbol=${encodeURIComponent(symbol)}&apikey=${apiKey}`;
    const res = await fetch(url, { cache: "no-store" });

    if (res.status === 429) {
      return { ok: false, quotaExceeded: true, planLimited: false, error: "FMP quota exceeded (429)." };
    }

    if (res.status === 402) {
      return {
        ok: false,
        quotaExceeded: false,
        planLimited: true,
        error: "FMP price target data is not available for this symbol on the current plan.",
      };
    }

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      const safe = body.slice(0, 200);
      if (res.status === 403) {
        return { ok: false, quotaExceeded: false, planLimited: false, error: `FMP HTTP 403 — key invalid or not authorized. Body: ${safe}` };
      }
      return { ok: false, quotaExceeded: false, planLimited: false, error: `FMP HTTP ${res.status}. Body: ${safe}` };
    }

    const json: unknown = await res.json();

    // Response is an array; empty array means no target data
    if (!Array.isArray(json) || json.length === 0) {
      return { ok: false, quotaExceeded: false, planLimited: false, error: "empty" };
    }

    const raw = json[0] as Record<string, unknown>;

    const asNum = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : null);

    return {
      ok: true,
      data: {
        symbol,
        targetHigh: asNum(raw.targetHigh),
        targetLow: asNum(raw.targetLow),
        targetMean: asNum(raw.targetMean),
        targetMedian: asNum(raw.targetMedian),
        targetConsensus: asNum(raw.targetConsensus),
      },
    };
  } catch (err) {
    return {
      ok: false,
      quotaExceeded: false,
      planLimited: false,
      error: err instanceof Error ? err.message : "Unknown error fetching FMP price target",
    };
  }
}

// ── Price Target Consensus ────────────────────────────────────────────────────
//
// FMP /stable/price-target-consensus is the correct endpoint for main target values.
// It returns targetConsensus, targetHigh, targetLow, targetMedian.
// price-target-summary only returns averaging data (lastMonthAvg, lastQuarterAvg, etc.)
// and should NOT be used as the primary target source.

export type FmpPriceTargetConsensus = {
  symbol: string;
  targetConsensus: number | null;
  targetHigh: number | null;
  targetLow: number | null;
  targetMedian: number | null;
};

export type FmpPriceTargetConsensusResult =
  | { ok: true; data: FmpPriceTargetConsensus }
  | { ok: false; quotaExceeded: boolean; planLimited: boolean; error: string };

export async function fetchFmpPriceTargetConsensus(
  symbol: string
): Promise<FmpPriceTargetConsensusResult> {
  const apiKey = getApiKey();
  if (!apiKey) {
    return { ok: false, quotaExceeded: false, planLimited: false, error: "Missing FMP_API_KEY" };
  }

  try {
    const url = `${BASE_URL}/price-target-consensus?symbol=${encodeURIComponent(symbol)}&apikey=${apiKey}`;
    const res = await fetch(url, { cache: "no-store" });

    if (res.status === 429) {
      return { ok: false, quotaExceeded: true, planLimited: false, error: "FMP quota exceeded (429)." };
    }

    if (res.status === 402) {
      return {
        ok: false,
        quotaExceeded: false,
        planLimited: true,
        error: "FMP price target consensus is not available for this symbol on the current plan.",
      };
    }

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      const safe = body.slice(0, 200);
      if (res.status === 403) {
        return { ok: false, quotaExceeded: false, planLimited: false, error: `FMP HTTP 403 — key invalid or not authorized. Body: ${safe}` };
      }
      return { ok: false, quotaExceeded: false, planLimited: false, error: `FMP HTTP ${res.status}. Body: ${safe}` };
    }

    const json: unknown = await res.json();

    // Response may be a single object or an array
    let raw: Record<string, unknown> | undefined;
    if (Array.isArray(json)) {
      raw = json.length > 0 ? (json[0] as Record<string, unknown>) : undefined;
    } else if (json && typeof json === "object") {
      raw = json as Record<string, unknown>;
    }

    if (!raw) {
      return { ok: false, quotaExceeded: false, planLimited: false, error: "empty" };
    }

    const asNum = (v: unknown) =>
      typeof v === "number" && Number.isFinite(v) && v !== 0 ? v : null;

    const targetConsensus = asNum(raw.targetConsensus);
    const targetHigh = asNum(raw.targetHigh);
    const targetLow = asNum(raw.targetLow);
    const targetMedian = asNum(raw.targetMedian);

    // All-null response means no data available
    if (targetConsensus === null && targetHigh === null && targetLow === null) {
      return { ok: false, quotaExceeded: false, planLimited: false, error: "empty" };
    }

    return {
      ok: true,
      data: { symbol, targetConsensus, targetHigh, targetLow, targetMedian },
    };
  } catch (err) {
    return {
      ok: false,
      quotaExceeded: false,
      planLimited: false,
      error: err instanceof Error ? err.message : "Unknown error fetching FMP price target consensus",
    };
  }
}

// ── Nasdaq 100 Constituent List ────────────────────────────────────────────────
//
// Investigation result (2026-05-21):
//   Endpoint tested:  https://financialmodelingprep.com/stable/nasdaq-constituent
//   HTTP status:      402 Payment Required — not available on current plan
//   /api/v4 variants: 403 Legacy endpoint — deprecated after August 31, 2025
//
// Approach: use the maintained NASDAQ_100_SYMBOLS static list for index composition.
// FMP /stable/profile (HTTP 200 on current plan) enriches new stocks when first created.
// Upgrade to /stable/nasdaq-constituent when the plan includes it.

export async function fetchFmpNasdaq100Constituents(): Promise<
  ProviderTestResult<IndexConstituent[]>
> {
  const apiKey = getApiKey();
  if (!apiKey) {
    return {
      ok: false,
      provider: "fmp",
      action: "nasdaq100-constituents",
      error: "Missing FMP_API_KEY",
    };
  }

  const symbols = [...NASDAQ_100_SYMBOLS];

  // Fetch profiles for all symbols in parallel (batches of 10 to avoid rate limits).
  const BATCH = 10;
  const constituents: IndexConstituent[] = [];
  const errors: string[] = [];

  for (let i = 0; i < symbols.length; i += BATCH) {
    const batch = symbols.slice(i, i + BATCH);
    const results = await Promise.allSettled(
      batch.map(async (symbol) => {
        const url = `${BASE_URL}/profile?symbol=${encodeURIComponent(symbol)}&apikey=${apiKey}`;
        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) {
          throw new Error(`HTTP ${res.status} for ${symbol}`);
        }
        const json: unknown = await res.json();
        if (!Array.isArray(json) || json.length === 0) {
          // Return minimal data from static list if profile not available
          return { symbol } as IndexConstituent;
        }
        const raw = json[0] as Record<string, unknown>;
        return {
          symbol: typeof raw.symbol === "string" ? raw.symbol : symbol,
          companyName: typeof raw.companyName === "string" ? raw.companyName : null,
          exchange: typeof raw.exchange === "string" ? raw.exchange : null,
          sector: typeof raw.sector === "string" ? raw.sector : null,
          industry: typeof raw.industry === "string" ? raw.industry : null,
          marketCap: typeof raw.marketCap === "number" ? raw.marketCap : null,
        } satisfies IndexConstituent;
      })
    );
    for (const r of results) {
      if (r.status === "fulfilled") {
        constituents.push(r.value);
      } else {
        errors.push(r.reason instanceof Error ? r.reason.message : String(r.reason));
      }
    }
  }

  if (constituents.length === 0) {
    return {
      ok: false,
      provider: "fmp",
      action: "nasdaq100-constituents",
      error: `All ${symbols.length} profile fetches failed. Errors: ${errors.slice(0, 3).join("; ")}`,
    };
  }

  return {
    ok: true,
    provider: "fmp",
    action: "nasdaq100-constituents",
    data: constituents,
  };
}

// ── FMP Quote (Phase 19) ──────────────────────────────────────────────────────
//
// /stable/quote returns a daily market snapshot per symbol.
// FMP uses "changePercentage" (not "changesPercentage").
// timestamp is Unix seconds — callers multiply by 1000 for Date conversion.

export type FmpQuote = {
  symbol: string;
  price: number | null;
  change: number | null;
  changePercentage: number | null;
  open: number | null;
  dayHigh: number | null;
  dayLow: number | null;
  previousClose: number | null;
  volume: number | null;
  marketCap: number | null;
  yearHigh: number | null;
  yearLow: number | null;
  priceAvg50: number | null;
  priceAvg200: number | null;
  exchange: string | null;
  timestamp: number | null;
};

export async function fetchFmpQuote(symbol: string): Promise<FmpSimpleResult<FmpQuote>> {
  const apiKey = getApiKey();
  if (!apiKey) return fmpSimpleError("Missing FMP_API_KEY");
  try {
    const res = await fmpFetch(`quote?symbol=${encodeURIComponent(symbol)}`, apiKey);
    if (!res.ok) return fmpSimpleError(res.error, res.rateLimitHit);
    const arr = Array.isArray(res.json) ? res.json : [];
    if (arr.length === 0) return fmpSimpleError(`No quote data for ${symbol}`);
    const raw = arr[0] as Record<string, unknown>;
    const n = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : null);
    return {
      ok: true,
      data: {
        symbol: typeof raw.symbol === "string" ? raw.symbol : symbol,
        price: n(raw.price),
        change: n(raw.change),
        changePercentage: n(raw.changePercentage),
        open: n(raw.open),
        dayHigh: n(raw.dayHigh),
        dayLow: n(raw.dayLow),
        previousClose: n(raw.previousClose),
        volume: n(raw.volume),
        marketCap: n(raw.marketCap),
        yearHigh: n(raw.yearHigh),
        yearLow: n(raw.yearLow),
        priceAvg50: n(raw.priceAvg50),
        priceAvg200: n(raw.priceAvg200),
        exchange: typeof raw.exchange === "string" ? raw.exchange : null,
        timestamp: n(raw.timestamp),
      },
    };
  } catch (err) {
    return fmpSimpleError(err instanceof Error ? err.message : "Unknown error fetching FMP quote");
  }
}

// ── FMP Fundamental Endpoints (Phase 18) ──────────────────────────────────────
//
// All margin/ROE/ROA fields from ratios-ttm are returned as decimal fractions
// (e.g. 0.45 = 45%). Callers must multiply by 100 to store as % scale.
// Ratio fields (P/E, D/E, current ratio, etc.) are already plain ratios — no normalization.
// Growth fields from financial-growth are also decimal fractions — callers multiply by 100.

// ── Generic FMP result type ───────────────────────────────────────────────────

type FmpSimpleResult<T> =
  | { ok: true; data: T; rateLimitHit?: false }
  | { ok: false; error: string; rateLimitHit?: boolean };

function fmpSimpleError<T>(error: string, rateLimitHit = false): FmpSimpleResult<T> {
  return { ok: false, error, rateLimitHit };
}

async function fmpFetch(
  path: string,
  apiKey: string
): Promise<{ ok: true; json: unknown } | { ok: false; error: string; rateLimitHit: boolean }> {
  const url = `${BASE_URL}/${path}&apikey=${apiKey}`;
  const res = await fetch(url, { cache: "no-store" });
  if (res.status === 429) {
    return { ok: false, error: "FMP rate limit exceeded (429)", rateLimitHit: true };
  }
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    return { ok: false, error: `FMP HTTP ${res.status}. Body: ${body.slice(0, 200)}`, rateLimitHit: false };
  }
  const json: unknown = await res.json();
  return { ok: true, json };
}

// ── Key Metrics (annual, most recent) ────────────────────────────────────────

export type FmpKeyMetrics = {
  symbol: string;
  marketCap: number | null;
  enterpriseValue: number | null;
  peRatio: number | null;
  pbRatio: number | null;
  priceToSalesRatio: number | null;
  enterpriseValueOverEBITDA: number | null;
  debtToEquity: number | null;
  currentRatio: number | null;
  interestCoverage: number | null;
  roeTTM: number | null;
  netIncomePerShare: number | null;
};

export async function fetchFmpKeyMetrics(symbol: string): Promise<FmpSimpleResult<FmpKeyMetrics>> {
  const apiKey = getApiKey();
  if (!apiKey) return fmpSimpleError("Missing FMP_API_KEY");
  try {
    const res = await fmpFetch(`key-metrics?symbol=${encodeURIComponent(symbol)}&limit=1`, apiKey);
    if (!res.ok) return fmpSimpleError(res.error, res.rateLimitHit);
    const arr = Array.isArray(res.json) ? res.json : [];
    if (arr.length === 0) return fmpSimpleError("No key metrics data");
    const raw = arr[0] as Record<string, unknown>;
    const n = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : null);
    return {
      ok: true,
      data: {
        symbol,
        marketCap: n(raw.marketCap),
        enterpriseValue: n(raw.enterpriseValue),
        peRatio: n(raw.peRatio),
        pbRatio: n(raw.pbRatio),
        priceToSalesRatio: n(raw.priceToSalesRatio),
        enterpriseValueOverEBITDA: n(raw.enterpriseValueOverEBITDA),
        debtToEquity: n(raw.debtToEquity),
        currentRatio: n(raw.currentRatio),
        interestCoverage: n(raw.interestCoverage),
        roeTTM: n(raw.roe),
        netIncomePerShare: n(raw.netIncomePerShare),
      },
    };
  } catch (err) {
    return fmpSimpleError(err instanceof Error ? err.message : "Unknown error");
  }
}

// ── Key Metrics TTM ───────────────────────────────────────────────────────────

export type FmpKeyMetricsTtm = {
  symbol: string;
  marketCapTTM: number | null;
  peRatioTTM: number | null;
  pbRatioTTM: number | null;
  priceToSalesRatioTTM: number | null;
  enterpriseValueOverEBITDATTM: number | null;
  netIncomePerShareTTM: number | null;
  roeTTM: number | null;
  debtToEquityTTM: number | null;
  currentRatioTTM: number | null;
  interestCoverageTTM: number | null;
};

export async function fetchFmpKeyMetricsTtm(symbol: string): Promise<FmpSimpleResult<FmpKeyMetricsTtm>> {
  const apiKey = getApiKey();
  if (!apiKey) return fmpSimpleError("Missing FMP_API_KEY");
  try {
    const res = await fmpFetch(`key-metrics-ttm?symbol=${encodeURIComponent(symbol)}`, apiKey);
    if (!res.ok) return fmpSimpleError(res.error, res.rateLimitHit);
    // Response can be an array or a single object depending on endpoint version
    const raw = Array.isArray(res.json) && (res.json as unknown[]).length > 0
      ? (res.json as Record<string, unknown>[])[0]
      : typeof res.json === "object" && res.json !== null
      ? (res.json as Record<string, unknown>)
      : null;
    if (!raw) return fmpSimpleError("Empty key-metrics-ttm response");
    const n = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : null);
    return {
      ok: true,
      data: {
        symbol,
        marketCapTTM: n(raw.marketCapTTM),
        peRatioTTM: n(raw.peRatioTTM),
        pbRatioTTM: n(raw.pbRatioTTM),
        priceToSalesRatioTTM: n(raw.priceToSalesRatioTTM),
        enterpriseValueOverEBITDATTM: n(raw.enterpriseValueOverEBITDATTM),
        netIncomePerShareTTM: n(raw.netIncomePerShareTTM),
        roeTTM: n(raw.roeTTM),
        debtToEquityTTM: n(raw.debtToEquityTTM),
        currentRatioTTM: n(raw.currentRatioTTM),
        interestCoverageTTM: n(raw.interestCoverageTTM),
      },
    };
  } catch (err) {
    return fmpSimpleError(err instanceof Error ? err.message : "Unknown error");
  }
}

// ── Ratios (annual, most recent) ──────────────────────────────────────────────

export type FmpRatios = {
  symbol: string;
  // Margins (decimal — 0.45 = 45%, callers multiply by 100)
  grossProfitMargin: number | null;
  operatingProfitMargin: number | null;
  netProfitMargin: number | null;
  returnOnEquity: number | null;
  returnOnAssets: number | null;
  // Health (plain ratios)
  debtEquityRatio: number | null;
  currentRatio: number | null;
  quickRatio: number | null;
  interestCoverage: number | null;
  // Valuation
  priceEarningsRatio: number | null;
  priceToSalesRatio: number | null;
  priceToBookRatio: number | null;
  enterpriseValueMultiple: number | null;
  priceEarningsToGrowthRatio: number | null;
};

export async function fetchFmpRatios(symbol: string): Promise<FmpSimpleResult<FmpRatios>> {
  const apiKey = getApiKey();
  if (!apiKey) return fmpSimpleError("Missing FMP_API_KEY");
  try {
    const res = await fmpFetch(`ratios?symbol=${encodeURIComponent(symbol)}&limit=1`, apiKey);
    if (!res.ok) return fmpSimpleError(res.error, res.rateLimitHit);
    const arr = Array.isArray(res.json) ? res.json : [];
    if (arr.length === 0) return fmpSimpleError("No ratios data");
    const raw = arr[0] as Record<string, unknown>;
    const n = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : null);
    return {
      ok: true,
      data: {
        symbol,
        grossProfitMargin: n(raw.grossProfitMargin),
        operatingProfitMargin: n(raw.operatingProfitMargin),
        netProfitMargin: n(raw.netProfitMargin),
        returnOnEquity: n(raw.returnOnEquity),
        returnOnAssets: n(raw.returnOnAssets),
        debtEquityRatio: n(raw.debtEquityRatio),
        currentRatio: n(raw.currentRatio),
        quickRatio: n(raw.quickRatio),
        interestCoverage: n(raw.interestCoverage),
        priceEarningsRatio: n(raw.priceEarningsRatio),
        priceToSalesRatio: n(raw.priceToSalesRatio),
        priceToBookRatio: n(raw.priceToBookRatio),
        enterpriseValueMultiple: n(raw.enterpriseValueMultiple),
        priceEarningsToGrowthRatio: n(raw.priceEarningsToGrowthRatio),
      },
    };
  } catch (err) {
    return fmpSimpleError(err instanceof Error ? err.message : "Unknown error");
  }
}

// ── Ratios TTM ────────────────────────────────────────────────────────────────

export type FmpRatiosTtm = {
  symbol: string;
  // Margins (decimal — callers multiply by 100 for % scale)
  grossProfitMarginTTM: number | null;
  operatingProfitMarginTTM: number | null;
  netProfitMarginTTM: number | null;
  returnOnEquityTTM: number | null;
  returnOnAssetsTTM: number | null;
  // Health (plain ratios, no normalization)
  debtEquityRatioTTM: number | null;
  currentRatioTTM: number | null;
  quickRatioTTM: number | null;
  interestCoverageTTM: number | null;
  // Valuation (plain ratios/multiples)
  priceEarningsRatioTTM: number | null;
  priceToSalesRatioTTM: number | null;
  priceToBookRatioTTM: number | null;
  enterpriseValueMultipleTTM: number | null;
  priceEarningsToGrowthRatioTTM: number | null;
};

export async function fetchFmpRatiosTtm(symbol: string): Promise<FmpSimpleResult<FmpRatiosTtm>> {
  const apiKey = getApiKey();
  if (!apiKey) return fmpSimpleError("Missing FMP_API_KEY");
  try {
    const res = await fmpFetch(`ratios-ttm?symbol=${encodeURIComponent(symbol)}`, apiKey);
    if (!res.ok) return fmpSimpleError(res.error, res.rateLimitHit);
    // ratios-ttm returns a single object or an array with one entry
    const raw = Array.isArray(res.json) && (res.json as unknown[]).length > 0
      ? (res.json as Record<string, unknown>[])[0]
      : typeof res.json === "object" && res.json !== null
      ? (res.json as Record<string, unknown>)
      : null;
    if (!raw) return fmpSimpleError("Empty ratios-ttm response");
    const n = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : null);
    return {
      ok: true,
      data: {
        symbol,
        grossProfitMarginTTM: n(raw.grossProfitMarginTTM),
        operatingProfitMarginTTM: n(raw.operatingProfitMarginTTM),
        netProfitMarginTTM: n(raw.netProfitMarginTTM),
        returnOnEquityTTM: n(raw.returnOnEquityTTM),
        returnOnAssetsTTM: n(raw.returnOnAssetsTTM),
        debtEquityRatioTTM: n(raw.debtEquityRatioTTM),
        currentRatioTTM: n(raw.currentRatioTTM),
        quickRatioTTM: n(raw.quickRatioTTM),
        interestCoverageTTM: n(raw.interestCoverageTTM),
        priceEarningsRatioTTM: n(raw.priceEarningsRatioTTM),
        priceToSalesRatioTTM: n(raw.priceToSalesRatioTTM),
        priceToBookRatioTTM: n(raw.priceToBookRatioTTM),
        enterpriseValueMultipleTTM: n(raw.enterpriseValueMultipleTTM),
        priceEarningsToGrowthRatioTTM: n(raw.priceEarningsToGrowthRatioTTM),
      },
    };
  } catch (err) {
    return fmpSimpleError(err instanceof Error ? err.message : "Unknown error");
  }
}

// ── Financial Growth (annual, most recent) ────────────────────────────────────

export type FmpFinancialGrowth = {
  symbol: string;
  // Growth (decimal fraction — callers multiply by 100 for % scale)
  revenueGrowth: number | null;
  epsgrowth: number | null;
  threeYRevenueGrowthPerShare: number | null;
  threeYNetIncomeGrowthPerShare: number | null;
  netIncomeGrowth: number | null;
  freeCashFlowGrowth: number | null;
};

export async function fetchFmpFinancialGrowth(symbol: string): Promise<FmpSimpleResult<FmpFinancialGrowth>> {
  const apiKey = getApiKey();
  if (!apiKey) return fmpSimpleError("Missing FMP_API_KEY");
  try {
    const res = await fmpFetch(`financial-growth?symbol=${encodeURIComponent(symbol)}&limit=1`, apiKey);
    if (!res.ok) return fmpSimpleError(res.error, res.rateLimitHit);
    const arr = Array.isArray(res.json) ? res.json : [];
    if (arr.length === 0) return fmpSimpleError("No financial-growth data");
    const raw = arr[0] as Record<string, unknown>;
    const n = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : null);
    return {
      ok: true,
      data: {
        symbol,
        revenueGrowth: n(raw.revenueGrowth),
        epsgrowth: n(raw.epsgrowth),
        threeYRevenueGrowthPerShare: n(raw.threeYRevenueGrowthPerShare),
        threeYNetIncomeGrowthPerShare: n(raw.threeYNetIncomeGrowthPerShare),
        netIncomeGrowth: n(raw.netIncomeGrowth),
        freeCashFlowGrowth: n(raw.freeCashFlowGrowth),
      },
    };
  } catch (err) {
    return fmpSimpleError(err instanceof Error ? err.message : "Unknown error");
  }
}
