import type {
  ProviderTestResult,
  NormalizedNewsItem,
  NormalizedQuote,
} from "@/src/lib/market-data/types";

export type NormalizedBasicFinancials = {
  symbol: string;
  provider: "finnhub";
  // Growth (% scale — 12.76 = 12.76%)
  revenueGrowthTTMYoy: number | null;
  epsGrowthTTMYoy: number | null;
  revenueGrowthQuarterlyYoy: number | null;
  epsGrowthQuarterlyYoy: number | null;
  revenueGrowth3Y: number | null;
  epsGrowth3Y: number | null;
  // Profitability (% scale)
  grossMarginTTM: number | null;
  operatingMarginTTM: number | null;
  netProfitMarginTTM: number | null;
  roeTTM: number | null;
  roaTTM: number | null;
  // Financial strength (ratio)
  totalDebtToEquityAnnual: number | null;
  currentRatioAnnual: number | null;
  quickRatioAnnual: number | null;
  netInterestCoverageAnnual: number | null;
  // Valuation (ratio/multiple)
  peBasicExclExtraTTM: number | null;
  forwardPE: number | null;
  pegTTM: number | null;
  forwardPEG: number | null;
  psTTM: number | null;
  pbAnnual: number | null;
  evEbitdaTTM: number | null;
  epsTTM: number | null;
  // Market / risk
  beta: number | null;
  marketCapitalization: number | null; // full USD (Finnhub millions * 1,000,000)
  week52High: number | null;
  week52Low: number | null;
  dividendYieldIndicatedAnnual: number | null;
  // Metadata
  rawMetricCount: number;
};

const BASE_URL = "https://finnhub.io/api/v1";

function getApiKey(): string | null {
  return process.env.FINNHUB_API_KEY ?? null;
}

function toISODateString(date: Date): string {
  return date.toISOString().split("T")[0];
}

export async function testFinnhubNews(
  symbol: string
): Promise<ProviderTestResult<NormalizedNewsItem[]>> {
  return fetchFinnhubCompanyNews(symbol);
}

export async function fetchFinnhubCompanyNews(
  symbol: string
): Promise<ProviderTestResult<NormalizedNewsItem[]>> {
  const apiKey = getApiKey();
  if (!apiKey) {
    return {
      ok: false,
      provider: "finnhub",
      action: "company-news",
      error: "Missing FINNHUB_API_KEY",
    };
  }

  try {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - 7);

    const url =
      `${BASE_URL}/company-news` +
      `?symbol=${encodeURIComponent(symbol)}` +
      `&from=${toISODateString(from)}` +
      `&to=${toISODateString(to)}` +
      `&token=${apiKey}`;

    const res = await fetch(url, { cache: "no-store" });

    if (res.status === 429) {
      return {
        ok: false,
        provider: "finnhub",
        action: "company-news",
        error: "Finnhub rate limit exceeded (429)",
      };
    }

    if (!res.ok) {
      return {
        ok: false,
        provider: "finnhub",
        action: "company-news",
        error: `Finnhub responded with status ${res.status}`,
      };
    }

    const json: unknown = await res.json();

    if (!Array.isArray(json)) {
      return {
        ok: false,
        provider: "finnhub",
        action: "company-news",
        error: "Unexpected response format from Finnhub",
        raw: json,
      };
    }

    const items: NormalizedNewsItem[] = (json as Record<string, unknown>[])
      .slice(0, 10)
      .map((item) => ({
        symbol,
        headline: typeof item.headline === "string" ? item.headline : "",
        summary: typeof item.summary === "string" ? item.summary : null,
        url: typeof item.url === "string" ? item.url : null,
        sourceName: typeof item.source === "string" ? item.source : null,
        publishedAt:
          typeof item.datetime === "number"
            ? new Date(item.datetime * 1000).toISOString()
            : null,
        source: "finnhub" as const,
      }));

    return {
      ok: true,
      provider: "finnhub",
      action: "company-news",
      data: items,
      raw: json,
    };
  } catch (err) {
    return {
      ok: false,
      provider: "finnhub",
      action: "company-news",
      error: err instanceof Error ? err.message : "Unknown error fetching Finnhub news",
    };
  }
}

export async function fetchFinnhubQuote(
  symbol: string
): Promise<ProviderTestResult<NormalizedQuote>> {
  const apiKey = getApiKey();
  if (!apiKey) {
    return {
      ok: false,
      provider: "finnhub",
      action: "quote",
      error: "Missing FINNHUB_API_KEY",
    };
  }

  try {
    const url = `${BASE_URL}/quote?symbol=${encodeURIComponent(symbol)}&token=${apiKey}`;
    const res = await fetch(url, { cache: "no-store" });

    if (res.status === 429) {
      return {
        ok: false,
        provider: "finnhub",
        action: "quote",
        error: "Finnhub rate limit exceeded (429)",
      };
    }

    if (!res.ok) {
      return {
        ok: false,
        provider: "finnhub",
        action: "quote",
        error: `Finnhub responded with status ${res.status}`,
      };
    }

    const json: unknown = await res.json();
    const raw = json as Record<string, unknown>;

    const toNum = (v: unknown): number | null => {
      if (v === null || v === undefined) return null;
      const n = Number(v);
      return isNaN(n) || n === 0 ? null : n;
    };

    const quote: NormalizedQuote = {
      symbol,
      price: toNum(raw.c),
      changePercent: toNum(raw.dp),
      open: toNum(raw.o),
      high: toNum(raw.h),
      low: toNum(raw.l),
      previousClose: toNum(raw.pc),
      volume: null,
      timestamp:
        typeof raw.t === "number" && raw.t > 0
          ? new Date(raw.t * 1000).toISOString()
          : null,
      source: "finnhub",
    };

    return {
      ok: true,
      provider: "finnhub",
      action: "quote",
      data: quote,
      raw,
    };
  } catch (err) {
    return {
      ok: false,
      provider: "finnhub",
      action: "quote",
      error: err instanceof Error ? err.message : "Unknown error fetching Finnhub quote",
    };
  }
}

// Recommendation counts from Finnhub /stock/recommendation.
// This type is Finnhub-only — no FMP fields.
export type NormalizedFinnhubRecommendation = {
  symbol: string;
  provider: "finnhub";
  strongBuyCount: number | null;
  buyCount: number | null;
  holdCount: number | null;
  sellCount: number | null;
  strongSellCount: number | null;
  analystCount: number | null;
  analystRating: string | null;
  recommendationPeriod: string | null;
};

export async function fetchFinnhubAnalystData(
  symbol: string
): Promise<ProviderTestResult<NormalizedFinnhubRecommendation>> {
  const finnhubKey = getApiKey();

  if (!finnhubKey) {
    return {
      ok: false,
      provider: "finnhub",
      action: "analyst-data",
      error: "Missing FINNHUB_API_KEY",
    };
  }

  try {
    const res = await fetch(
      `${BASE_URL}/stock/recommendation?symbol=${encodeURIComponent(symbol)}&token=${finnhubKey}`,
      { cache: "no-store" }
    );

    if (res.status === 429) {
      return {
        ok: false,
        provider: "finnhub",
        action: "analyst-data",
        error: "Finnhub rate limit exceeded (429)",
      };
    }

    if (!res.ok) {
      return {
        ok: false,
        provider: "finnhub",
        action: "analyst-data",
        error: `Finnhub responded with status ${res.status}`,
      };
    }

    const recJson = (await res.json()) as unknown[];

    if (!Array.isArray(recJson) || recJson.length === 0) {
      return {
        ok: false,
        provider: "finnhub",
        action: "analyst-data",
        error: `No recommendation data available for ${symbol}`,
      };
    }

    const recent = recJson[0] as Record<string, unknown>;
    const strongBuyCount = typeof recent.strongBuy === "number" ? recent.strongBuy : null;
    const buyCount = typeof recent.buy === "number" ? recent.buy : null;
    const holdCount = typeof recent.hold === "number" ? recent.hold : null;
    const sellCount = typeof recent.sell === "number" ? recent.sell : null;
    const strongSellCount = typeof recent.strongSell === "number" ? recent.strongSell : null;
    const recommendationPeriod = typeof recent.period === "string" ? recent.period : null;

    const total =
      (strongBuyCount ?? 0) +
      (buyCount ?? 0) +
      (holdCount ?? 0) +
      (sellCount ?? 0) +
      (strongSellCount ?? 0);
    const analystCount = total > 0 ? total : null;

    let analystRating: string | null = null;
    if (analystCount && analystCount > 0) {
      const bullish = (strongBuyCount ?? 0) + (buyCount ?? 0);
      const bearish = (sellCount ?? 0) + (strongSellCount ?? 0);
      const neutral = holdCount ?? 0;

      if ((strongBuyCount ?? 0) > bullish * 0.5) {
        analystRating = "Strong Buy";
      } else if (bullish >= neutral && bullish >= bearish) {
        analystRating = "Buy";
      } else if (neutral >= bullish && neutral >= bearish) {
        analystRating = "Hold";
      } else if (bearish > bullish && (strongSellCount ?? 0) > bearish * 0.5) {
        analystRating = "Strong Sell";
      } else if (bearish > bullish) {
        analystRating = "Sell";
      } else {
        analystRating = "Hold";
      }
    }

    return {
      ok: true,
      provider: "finnhub",
      action: "analyst-data",
      data: {
        symbol,
        provider: "finnhub",
        strongBuyCount,
        buyCount,
        holdCount,
        sellCount,
        strongSellCount,
        analystCount,
        analystRating,
        recommendationPeriod,
      },
    };
  } catch (err) {
    return {
      ok: false,
      provider: "finnhub",
      action: "analyst-data",
      error: err instanceof Error ? err.message : "Unknown error fetching Finnhub recommendation data",
    };
  }
}

export async function fetchFinnhubBasicFinancials(
  symbol: string
): Promise<ProviderTestResult<NormalizedBasicFinancials>> {
  const apiKey = getApiKey();
  if (!apiKey) {
    return {
      ok: false,
      provider: "finnhub",
      action: "basic-financials",
      error: "Missing FINNHUB_API_KEY",
    };
  }

  try {
    const url =
      `${BASE_URL}/stock/metric` +
      `?symbol=${encodeURIComponent(symbol)}` +
      `&metric=all` +
      `&token=${apiKey}`;

    const res = await fetch(url, { cache: "no-store" });

    if (res.status === 429) {
      return {
        ok: false,
        provider: "finnhub",
        action: "basic-financials",
        error: "Finnhub rate limit exceeded (429)",
      };
    }

    if (!res.ok) {
      return {
        ok: false,
        provider: "finnhub",
        action: "basic-financials",
        error: `Finnhub responded with status ${res.status}`,
      };
    }

    const json: unknown = await res.json();
    const raw = json as Record<string, unknown>;
    const metric = (raw.metric ?? {}) as Record<string, unknown>;

    const toNum = (v: unknown): number | null => {
      if (v === null || v === undefined) return null;
      const n = Number(v);
      return isNaN(n) ? null : n;
    };

    const rawMetricCount = Object.keys(metric).length;

    // marketCapitalization from Finnhub is in millions USD — convert to full USD
    const marketCapMillions = toNum(metric["marketCapitalization"]);
    const marketCapFull =
      marketCapMillions !== null && marketCapMillions > 0
        ? marketCapMillions * 1_000_000
        : null;

    const data: NormalizedBasicFinancials = {
      symbol,
      provider: "finnhub",
      revenueGrowthTTMYoy: toNum(metric["revenueGrowthTTMYoy"]),
      epsGrowthTTMYoy: toNum(metric["epsGrowthTTMYoy"]),
      revenueGrowthQuarterlyYoy: toNum(metric["revenueGrowthQuarterlyYoy"]),
      epsGrowthQuarterlyYoy: toNum(metric["epsGrowthQuarterlyYoy"]),
      revenueGrowth3Y: toNum(metric["revenueGrowth3Y"]),
      epsGrowth3Y: toNum(metric["epsGrowth3Y"]),
      grossMarginTTM: toNum(metric["grossMarginTTM"]),
      operatingMarginTTM: toNum(metric["operatingMarginTTM"]),
      netProfitMarginTTM: toNum(metric["netProfitMarginTTM"]),
      roeTTM: toNum(metric["roeTTM"]),
      roaTTM: toNum(metric["roaTTM"]),
      totalDebtToEquityAnnual: toNum(metric["totalDebt/totalEquityAnnual"]),
      currentRatioAnnual: toNum(metric["currentRatioAnnual"]),
      quickRatioAnnual: toNum(metric["quickRatioAnnual"]),
      netInterestCoverageAnnual: toNum(metric["netInterestCoverageAnnual"]),
      peBasicExclExtraTTM: toNum(metric["peBasicExclExtraTTM"]),
      forwardPE: toNum(metric["forwardPE"]),
      pegTTM: toNum(metric["pegTTM"]),
      forwardPEG: toNum(metric["forwardPEG"]),
      psTTM: toNum(metric["psTTM"]),
      pbAnnual: toNum(metric["pbAnnual"]),
      evEbitdaTTM: toNum(metric["evEbitdaTTM"]),
      epsTTM: toNum(metric["epsTTM"]),
      beta: toNum(metric["beta"]),
      marketCapitalization: marketCapFull,
      week52High: toNum(metric["52WeekHigh"]),
      week52Low: toNum(metric["52WeekLow"]),
      dividendYieldIndicatedAnnual: toNum(metric["dividendYieldIndicatedAnnual"]),
      rawMetricCount,
    };

    return {
      ok: true,
      provider: "finnhub",
      action: "basic-financials",
      data,
      raw,
    };
  } catch (err) {
    return {
      ok: false,
      provider: "finnhub",
      action: "basic-financials",
      error:
        err instanceof Error
          ? err.message
          : "Unknown error fetching Finnhub basic financials",
    };
  }
}
