import type { ProviderTestResult, NormalizedQuote } from "@/src/lib/market-data/types";

const BASE_URL = "https://api.twelvedata.com";

function getApiKey(): string | null {
  return process.env.TWELVE_DATA_API_KEY ?? null;
}

export async function testTwelveQuote(
  symbol: string
): Promise<ProviderTestResult<NormalizedQuote>> {
  return fetchTwelveQuote(symbol);
}

export async function fetchTwelveQuote(
  symbol: string
): Promise<ProviderTestResult<NormalizedQuote>> {
  const apiKey = getApiKey();
  if (!apiKey) {
    return {
      ok: false,
      provider: "twelve-data",
      action: "quote",
      error: "Missing TWELVE_DATA_API_KEY",
    };
  }

  try {
    const url = `${BASE_URL}/quote?symbol=${encodeURIComponent(symbol)}&apikey=${apiKey}`;
    const res = await fetch(url, { cache: "no-store" });

    if (res.status === 429) {
      return {
        ok: false,
        provider: "twelve-data",
        action: "quote",
        error: "Twelve Data rate limit exceeded (429)",
      };
    }

    if (!res.ok) {
      return {
        ok: false,
        provider: "twelve-data",
        action: "quote",
        error: `Twelve Data responded with status ${res.status}`,
      };
    }

    const json: unknown = await res.json();
    const raw = json as Record<string, unknown>;

    if (raw.status === "error" || raw.code) {
      const msg = typeof raw.message === "string" ? raw.message : "Provider error";
      return {
        ok: false,
        provider: "twelve-data",
        action: "quote",
        error: `Twelve Data error: ${msg}`,
        raw,
      };
    }

    const toNum = (v: unknown): number | null => {
      if (v === null || v === undefined) return null;
      const n = typeof v === "string" ? parseFloat(v) : Number(v);
      return isNaN(n) ? null : n;
    };

    const quote: NormalizedQuote = {
      symbol: typeof raw.symbol === "string" ? raw.symbol : symbol,
      price: toNum(raw.close),
      changePercent: toNum(raw.percent_change),
      open: toNum(raw.open),
      high: toNum(raw.high),
      low: toNum(raw.low),
      previousClose: toNum(raw.previous_close),
      volume: toNum(raw.volume),
      timestamp: typeof raw.datetime === "string" ? raw.datetime : null,
      source: "twelve-data",
    };

    return {
      ok: true,
      provider: "twelve-data",
      action: "quote",
      data: quote,
      raw,
    };
  } catch (err) {
    return {
      ok: false,
      provider: "twelve-data",
      action: "quote",
      error: err instanceof Error ? err.message : "Unknown error fetching Twelve Data quote",
    };
  }
}

export async function fetchTwelveQuotes(
  symbols: string[]
): Promise<ProviderTestResult<NormalizedQuote[]>> {
  const apiKey = getApiKey();
  if (!apiKey) {
    return {
      ok: false,
      provider: "twelve-data",
      action: "quotes-batch",
      error: "Missing TWELVE_DATA_API_KEY",
    };
  }

  if (symbols.length === 0) {
    return {
      ok: false,
      provider: "twelve-data",
      action: "quotes-batch",
      error: "No symbols provided",
    };
  }

  try {
    const symbolList = symbols.map(encodeURIComponent).join(",");
    const url = `${BASE_URL}/quote?symbol=${symbolList}&apikey=${apiKey}`;
    const res = await fetch(url, { cache: "no-store" });

    if (res.status === 429) {
      return {
        ok: false,
        provider: "twelve-data",
        action: "quotes-batch",
        error: "Twelve Data rate limit exceeded (429)",
      };
    }

    if (!res.ok) {
      return {
        ok: false,
        provider: "twelve-data",
        action: "quotes-batch",
        error: `Twelve Data responded with status ${res.status}`,
      };
    }

    const json: unknown = await res.json();

    const toNum = (v: unknown): number | null => {
      if (v === null || v === undefined) return null;
      const n = typeof v === "string" ? parseFloat(v) : Number(v);
      return isNaN(n) ? null : n;
    };

    const parseQuote = (raw: Record<string, unknown>, sym: string): NormalizedQuote => ({
      symbol: typeof raw.symbol === "string" ? raw.symbol : sym,
      price: toNum(raw.close),
      changePercent: toNum(raw.percent_change),
      open: toNum(raw.open),
      high: toNum(raw.high),
      low: toNum(raw.low),
      previousClose: toNum(raw.previous_close),
      volume: toNum(raw.volume),
      timestamp: typeof raw.datetime === "string" ? raw.datetime : null,
      source: "twelve-data",
    });

    // Single symbol returns an object; multiple symbols returns a keyed object
    if (symbols.length === 1) {
      const raw = json as Record<string, unknown>;
      if (raw.status === "error" || raw.code) {
        const msg = typeof raw.message === "string" ? raw.message : "Provider error";
        return {
          ok: false,
          provider: "twelve-data",
          action: "quotes-batch",
          error: `Twelve Data error: ${msg}`,
          raw,
        };
      }
      return {
        ok: true,
        provider: "twelve-data",
        action: "quotes-batch",
        data: [parseQuote(raw, symbols[0])],
        raw,
      };
    }

    const rawMap = json as Record<string, Record<string, unknown>>;
    const quotes: NormalizedQuote[] = [];
    for (const sym of symbols) {
      const raw = rawMap[sym];
      if (raw && !raw.code) {
        quotes.push(parseQuote(raw, sym));
      }
    }

    return {
      ok: true,
      provider: "twelve-data",
      action: "quotes-batch",
      data: quotes,
      raw: json,
    };
  } catch (err) {
    return {
      ok: false,
      provider: "twelve-data",
      action: "quotes-batch",
      error: err instanceof Error ? err.message : "Unknown error fetching Twelve Data quotes",
    };
  }
}
