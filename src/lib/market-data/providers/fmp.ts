import type {
  ProviderTestResult,
  NormalizedCompanyProfile,
} from "@/src/lib/market-data/types";

const BASE_URL = "https://financialmodelingprep.com/api/v3";

function getApiKey(): string | null {
  return process.env.FMP_API_KEY ?? null;
}

export async function testFmpProfile(
  symbol: string
): Promise<ProviderTestResult<NormalizedCompanyProfile>> {
  const result = await fetchFmpCompanyProfile(symbol);
  return result;
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
    const url = `${BASE_URL}/profile/${encodeURIComponent(symbol)}?apikey=${apiKey}`;
    const res = await fetch(url, { cache: "no-store" });

    if (res.status === 429) {
      return {
        ok: false,
        provider: "fmp",
        action: "company-profile",
        error: "FMP rate limit exceeded (429)",
      };
    }

    if (!res.ok) {
      return {
        ok: false,
        provider: "fmp",
        action: "company-profile",
        error: `FMP responded with status ${res.status}`,
      };
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
      exchange: typeof raw.exchangeShortName === "string" ? raw.exchangeShortName : null,
      sector: typeof raw.sector === "string" ? raw.sector : null,
      industry: typeof raw.industry === "string" ? raw.industry : null,
      marketCap: typeof raw.mktCap === "number" ? raw.mktCap : null,
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
    const url = `${BASE_URL}/analyst-estimates/${encodeURIComponent(symbol)}?apikey=${apiKey}&limit=1`;
    const res = await fetch(url, { cache: "no-store" });

    if (res.status === 429) {
      return {
        ok: false,
        provider: "fmp",
        action: "analyst-target",
        error: "FMP rate limit exceeded (429)",
      };
    }

    if (!res.ok) {
      return {
        ok: false,
        provider: "fmp",
        action: "analyst-target",
        error: `FMP responded with status ${res.status}`,
      };
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
      targetHigh: typeof raw.estimatedEpsHigh === "number" ? raw.estimatedEpsHigh : null,
      targetLow: typeof raw.estimatedEpsLow === "number" ? raw.estimatedEpsLow : null,
      targetMean: typeof raw.estimatedEpsMean === "number" ? raw.estimatedEpsMean : null,
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
