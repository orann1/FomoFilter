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

export type NormalizedAnalystData = {
  symbol: string;
  provider: "fmp+finnhub";
  // Price target
  targetHigh: number | null;
  targetLow: number | null;
  targetMean: number | null;
  targetMedian: number | null;
  // Recommendation counts (most recent period)
  strongBuyCount: number | null;
  buyCount: number | null;
  holdCount: number | null;
  sellCount: number | null;
  strongSellCount: number | null;
  analystCount: number | null;
  // Derived rating (normalized)
  analystRating: string | null;
  // Metadata
  sourceUpdatedAt: string | null;
};

export async function fetchFinnhubAnalystData(
  symbol: string
): Promise<ProviderTestResult<NormalizedAnalystData>> {
  const finnhubKey = getApiKey();
  const fmpKey = process.env.FMP_API_KEY ?? "";

  if (!finnhubKey) {
    return {
      ok: false,
      provider: "finnhub",
      action: "analyst-data",
      error: "Missing FINNHUB_API_KEY",
    };
  }

  const toNum = (v: unknown): number | null => {
    if (v === null || v === undefined) return null;
    const n = Number(v);
    return isNaN(n) || n === 0 ? null : n;
  };

  try {
    // Fetch FMP price-target-summary and Finnhub recommendation in parallel
    const fetchPromises: [Promise<Response>, Promise<Response>] = [
      fmpKey
        ? fetch(
            `https://financialmodelingprep.com/stable/price-target-summary?symbol=${encodeURIComponent(symbol)}&apikey=${fmpKey}`,
            { cache: "no-store" }
          )
        : Promise.resolve(new Response(null, { status: 0 })),
      fetch(
        `${BASE_URL}/stock/recommendation?symbol=${encodeURIComponent(symbol)}&token=${finnhubKey}`,
        { cache: "no-store" }
      ),
    ];

    const [fmpRes, recRes] = await Promise.all(fetchPromises);

    if (recRes.status === 429) {
      return {
        ok: false,
        provider: "fmp+finnhub",
        action: "analyst-data",
        error: "Finnhub rate limit exceeded (429)",
      };
    }

    // Parse FMP price target data
    let targetHigh: number | null = null;
    let targetLow: number | null = null;
    let targetMean: number | null = null;
    let targetMedian: number | null = null;
    let sourceUpdatedAt: string | null = null;

    if (fmpKey && fmpRes.ok) {
      const fmpRaw = await fmpRes.json() as unknown;
      // FMP returns an array; take the first element
      const fmpJson = (Array.isArray(fmpRaw) ? fmpRaw[0] : fmpRaw) as Record<string, unknown> | undefined;
      if (fmpJson) {
        // Use best available window: last month → last quarter → last year (for coverage)
        targetMean =
          toNum(fmpJson.lastMonthAvgPriceTarget) ??
          toNum(fmpJson.lastQuarterAvgPriceTarget) ??
          toNum(fmpJson.lastYearAvgPriceTarget);
        // Store last quarter as "median" proxy
        targetMedian = toNum(fmpJson.lastQuarterAvgPriceTarget);
        // price-target-summary does not provide per-analyst high/low; leave as null
        if (typeof fmpJson.updatedAt === "string") sourceUpdatedAt = fmpJson.updatedAt;
        else if (typeof fmpJson.publishedDate === "string") sourceUpdatedAt = fmpJson.publishedDate;
      }
    }

    // Parse Finnhub recommendation counts
    let strongBuyCount: number | null = null;
    let buyCount: number | null = null;
    let holdCount: number | null = null;
    let sellCount: number | null = null;
    let strongSellCount: number | null = null;
    let analystCount: number | null = null;
    let analystRating: string | null = null;

    if (recRes.ok) {
      const recJson = await recRes.json() as unknown[];
      if (Array.isArray(recJson) && recJson.length > 0) {
        const recent = recJson[0] as Record<string, unknown>;
        strongBuyCount = typeof recent.strongBuy === "number" ? recent.strongBuy : null;
        buyCount = typeof recent.buy === "number" ? recent.buy : null;
        holdCount = typeof recent.hold === "number" ? recent.hold : null;
        sellCount = typeof recent.sell === "number" ? recent.sell : null;
        strongSellCount = typeof recent.strongSell === "number" ? recent.strongSell : null;

        const total =
          (strongBuyCount ?? 0) +
          (buyCount ?? 0) +
          (holdCount ?? 0) +
          (sellCount ?? 0) +
          (strongSellCount ?? 0);
        analystCount = total > 0 ? total : null;

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
      }
    }

    // Require at least some useful data
    if (targetMean === null && analystCount === null) {
      return {
        ok: false,
        provider: "fmp+finnhub",
        action: "analyst-data",
        error: `No analyst data available for ${symbol}`,
      };
    }

    const data: NormalizedAnalystData = {
      symbol,
      provider: "fmp+finnhub",
      targetHigh,
      targetLow,
      targetMean,
      targetMedian,
      strongBuyCount,
      buyCount,
      holdCount,
      sellCount,
      strongSellCount,
      analystCount,
      analystRating,
      sourceUpdatedAt,
    };

    return {
      ok: true,
      provider: "fmp+finnhub",
      action: "analyst-data",
      data,
    };
  } catch (err) {
    return {
      ok: false,
      provider: "fmp+finnhub",
      action: "analyst-data",
      error: err instanceof Error ? err.message : "Unknown error fetching analyst data",
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
