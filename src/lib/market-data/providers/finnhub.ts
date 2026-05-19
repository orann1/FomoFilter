import type {
  ProviderTestResult,
  NormalizedNewsItem,
  NormalizedQuote,
} from "@/src/lib/market-data/types";

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
      timestamp: null,
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
