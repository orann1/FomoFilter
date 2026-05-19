"use server";

import { prisma } from "@/src/lib/db/prisma";
import { testFmpProfile, fetchFmpCompanyProfile } from "@/src/lib/market-data/providers/fmp";
import { testTwelveQuote, fetchTwelveQuotes } from "@/src/lib/market-data/providers/twelve-data";
import { testFinnhubNews } from "@/src/lib/market-data/providers/finnhub";
import type { ProviderTestResult, SyncSummary } from "@/src/lib/market-data/types";

const SAMPLE_SYMBOLS = ["NVDA", "AMD", "TSLA", "PLTR", "SMCI"];

function stripRaw<T>(result: ProviderTestResult<T>): ProviderTestResult<T> {
  const { raw: _raw, ...safe } = result;
  return safe;
}

export async function testFmpProfileAction(): Promise<ProviderTestResult> {
  return stripRaw(await testFmpProfile("NVDA"));
}

export async function testTwelveQuoteAction(): Promise<ProviderTestResult> {
  return stripRaw(await testTwelveQuote("NVDA"));
}

export async function testFinnhubNewsAction(): Promise<ProviderTestResult> {
  return stripRaw(await testFinnhubNews("NVDA"));
}

export async function syncQuotesSampleAction(): Promise<SyncSummary> {
  // Load real symbols from DB, fall back to sample list
  const dbStocks = await prisma.stock.findMany({
    where: { isActive: true },
    select: { symbol: true },
    take: 10,
  });

  const symbols =
    dbStocks.length > 0
      ? dbStocks.map((s) => s.symbol).slice(0, 5)
      : SAMPLE_SYMBOLS;

  const result = await fetchTwelveQuotes(symbols);

  const summary: SyncSummary = {
    provider: "twelve-data",
    action: "quotes-sample",
    symbolsRequested: symbols,
    successCount: 0,
    errorCount: 0,
    failedSymbols: [],
    persisted: false,
    errors: [],
  };

  if (!result.ok || !result.data) {
    summary.errorCount = symbols.length;
    summary.failedSymbols = symbols;
    summary.errors = [result.error ?? "Unknown error"];
    return summary;
  }

  const quotes = result.data;
  const fetchedSymbols = new Set(quotes.map((q) => q.symbol));

  // Persist to DB for symbols that exist and have valid price
  for (const quote of quotes) {
    if (quote.price === null) {
      summary.errorCount++;
      summary.failedSymbols.push(quote.symbol);
      summary.errors.push(`${quote.symbol}: No price returned`);
      continue;
    }

    try {
      const stock = await prisma.stock.findUnique({ where: { symbol: quote.symbol } });
      if (!stock) {
        summary.errorCount++;
        summary.failedSymbols.push(quote.symbol);
        summary.errors.push(`${quote.symbol}: Not found in database`);
        continue;
      }

      await prisma.stockQuote.upsert({
        where: { stockId: stock.id },
        create: {
          stockId: stock.id,
          price: quote.price,
          changePercent: quote.changePercent ?? 0,
          volume: quote.volume !== null ? String(Math.round(quote.volume)) : null,
        },
        update: {
          price: quote.price,
          changePercent: quote.changePercent ?? 0,
          volume: quote.volume !== null ? String(Math.round(quote.volume)) : undefined,
        },
      });

      summary.successCount++;
      summary.persisted = true;
    } catch (err) {
      summary.errorCount++;
      summary.failedSymbols.push(quote.symbol);
      summary.errors.push(
        `${quote.symbol}: ${err instanceof Error ? err.message : "DB error"}`
      );
    }
  }

  // Symbols that were requested but not returned by provider
  for (const sym of symbols) {
    if (!fetchedSymbols.has(sym)) {
      summary.errorCount++;
      summary.failedSymbols.push(sym);
      summary.errors.push(`${sym}: Not returned by provider`);
    }
  }

  return summary;
}

export async function syncProfilesSampleAction(): Promise<SyncSummary> {
  const dbStocks = await prisma.stock.findMany({
    where: { isActive: true },
    select: { symbol: true },
    take: 5,
  });

  const symbols =
    dbStocks.length > 0
      ? dbStocks.map((s) => s.symbol).slice(0, 5)
      : SAMPLE_SYMBOLS.slice(0, 5);

  const summary: SyncSummary = {
    provider: "fmp",
    action: "profiles-sample",
    symbolsRequested: symbols,
    successCount: 0,
    errorCount: 0,
    failedSymbols: [],
    persisted: false,
    errors: [],
  };

  for (const symbol of symbols) {
    const result = await fetchFmpCompanyProfile(symbol);

    if (!result.ok || !result.data) {
      summary.errorCount++;
      summary.failedSymbols.push(symbol);
      summary.errors.push(`${symbol}: ${result.error ?? "Unknown error"}`);
      continue;
    }

    const profile = result.data;

    try {
      const stock = await prisma.stock.findUnique({ where: { symbol } });
      if (!stock) {
        summary.errorCount++;
        summary.failedSymbols.push(symbol);
        summary.errors.push(`${symbol}: Not found in database`);
        continue;
      }

      // Update only the fields that exist on the Stock model
      await prisma.stock.update({
        where: { id: stock.id },
        data: {
          name: profile.name ?? stock.name,
          sector: profile.sector ?? stock.sector,
          marketCap: profile.marketCap !== null ? String(profile.marketCap) : stock.marketCap,
        },
      });

      summary.successCount++;
      summary.persisted = true;
    } catch (err) {
      summary.errorCount++;
      summary.failedSymbols.push(symbol);
      summary.errors.push(
        `${symbol}: ${err instanceof Error ? err.message : "DB error"}`
      );
    }
  }

  return summary;
}
