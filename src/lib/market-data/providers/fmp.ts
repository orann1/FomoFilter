import type {
  ProviderTestResult,
  NormalizedCompanyProfile,
} from "@/src/lib/market-data/types";

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
