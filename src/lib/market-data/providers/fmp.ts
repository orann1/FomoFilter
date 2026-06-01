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
