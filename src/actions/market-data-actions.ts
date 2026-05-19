"use server";

import { prisma } from "@/src/lib/db/prisma";
import { testFmpProfile, fetchFmpCompanyProfile } from "@/src/lib/market-data/providers/fmp";
import { testTwelveQuote, fetchTwelveQuotes } from "@/src/lib/market-data/providers/twelve-data";
import { testFinnhubNews } from "@/src/lib/market-data/providers/finnhub";
import { isValidNumber, keepExistingIfInvalid } from "@/src/lib/market-data/safe-update";
import type {
  ProviderTestResult,
  SyncActionResult,
  SyncRunStatus,
  SyncSymbolResult,
} from "@/src/lib/market-data/types";

function stripRaw<T>(result: ProviderTestResult<T>): ProviderTestResult<T> {
  const { raw: _raw, ...safe } = result;
  return safe;
}

function deriveSyncStatus(
  successCount: number,
  skippedCount: number,
  failedCount: number
): SyncRunStatus {
  if (successCount === 0) return "failed";
  if (skippedCount > 0 || failedCount > 0) return "partial_success";
  return "success";
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

export async function syncQuotesSampleAction(): Promise<SyncActionResult> {
  const startedAt = new Date();

  const dbStocks = await prisma.stock.findMany({
    where: { isActive: true },
    select: { symbol: true },
    take: 10,
  });

  const symbols =
    dbStocks.length > 0
      ? dbStocks.map((s) => s.symbol).slice(0, 5)
      : ["NVDA", "AMD", "TSLA", "PLTR", "SMCI"];

  const updatedSymbols: string[] = [];
  const skippedSymbols: SyncSymbolResult[] = [];
  const failedSymbols: SyncSymbolResult[] = [];

  const providerResult = await fetchTwelveQuotes(symbols);

  if (!providerResult.ok || !providerResult.data) {
    const finishedAt = new Date();
    for (const sym of symbols) {
      failedSymbols.push({
        symbol: sym,
        status: "failed",
        reason: providerResult.error ?? "Provider request failed",
        dbAction: "kept_existing",
      });
    }
    return {
      status: "failed",
      provider: "twelve-data",
      action: "quotes-sample",
      requestedCount: symbols.length,
      successCount: 0,
      skippedCount: 0,
      failedCount: symbols.length,
      updatedSymbols: [],
      skippedSymbols: [],
      failedSymbols,
      startedAt: startedAt.toISOString(),
      finishedAt: finishedAt.toISOString(),
      durationMs: finishedAt.getTime() - startedAt.getTime(),
      persisted: false,
      message: providerResult.error ?? "Provider request failed before any symbol was processed",
    };
  }

  const quotes = providerResult.data;
  const fetchedSymbolMap = new Map(quotes.map((q) => [q.symbol, q]));

  for (const symbol of symbols) {
    const quote = fetchedSymbolMap.get(symbol);

    if (!quote) {
      skippedSymbols.push({
        symbol,
        status: "skipped",
        reason: "Symbol not returned by provider",
        dbAction: "kept_existing",
      });
      continue;
    }

    if (!isValidNumber(quote.price)) {
      skippedSymbols.push({
        symbol,
        status: "skipped",
        reason: "Missing or invalid price",
        dbAction: "kept_existing",
      });
      continue;
    }

    try {
      const stock = await prisma.stock.findUnique({
        where: { symbol },
        include: { quote: true },
      });

      if (!stock) {
        skippedSymbols.push({
          symbol,
          status: "skipped",
          reason: "Symbol not found in database",
          dbAction: "not_found",
        });
        continue;
      }

      const existing = stock.quote;
      const now = new Date();

      await prisma.stockQuote.upsert({
        where: { stockId: stock.id },
        create: {
          stockId: stock.id,
          price: quote.price,
          changePercent: isValidNumber(quote.changePercent) ? quote.changePercent : 0,
          volume: isValidNumber(quote.volume) ? String(Math.round(quote.volume)) : null,
          source: "twelve-data",
          lastSyncedAt: now,
          sourceUpdatedAt: quote.timestamp ? new Date(quote.timestamp) : null,
        },
        update: {
          price: quote.price,
          changePercent: isValidNumber(quote.changePercent)
            ? quote.changePercent
            : existing?.changePercent ?? 0,
          volume: isValidNumber(quote.volume)
            ? String(Math.round(quote.volume))
            : existing?.volume ?? undefined,
          source: "twelve-data",
          lastSyncedAt: now,
          sourceUpdatedAt: quote.timestamp
            ? new Date(quote.timestamp)
            : existing?.sourceUpdatedAt ?? null,
        },
      });

      updatedSymbols.push(symbol);
    } catch (err) {
      failedSymbols.push({
        symbol,
        status: "failed",
        reason: err instanceof Error ? err.message : "Database error",
        dbAction: "kept_existing",
      });
    }
  }

  const finishedAt = new Date();
  const successCount = updatedSymbols.length;
  const skippedCount = skippedSymbols.length;
  const failedCount = failedSymbols.length;
  const status = deriveSyncStatus(successCount, skippedCount, failedCount);

  const messageParts: string[] = [`${successCount} updated`];
  if (skippedCount > 0) messageParts.push(`${skippedCount} skipped`);
  if (failedCount > 0) messageParts.push(`${failedCount} failed`);

  return {
    status,
    provider: "twelve-data",
    action: "quotes-sample",
    requestedCount: symbols.length,
    successCount,
    skippedCount,
    failedCount,
    updatedSymbols,
    skippedSymbols,
    failedSymbols,
    startedAt: startedAt.toISOString(),
    finishedAt: finishedAt.toISOString(),
    durationMs: finishedAt.getTime() - startedAt.getTime(),
    persisted: successCount > 0,
    message: messageParts.join(", "),
  };
}

export async function syncProfilesSampleAction(): Promise<SyncActionResult> {
  const startedAt = new Date();

  const dbStocks = await prisma.stock.findMany({
    where: { isActive: true },
    select: { symbol: true },
    take: 5,
  });

  const symbols =
    dbStocks.length > 0
      ? dbStocks.map((s) => s.symbol).slice(0, 5)
      : ["NVDA", "AMD", "TSLA", "PLTR", "SMCI"];

  const updatedSymbols: string[] = [];
  const skippedSymbols: SyncSymbolResult[] = [];
  const failedSymbols: SyncSymbolResult[] = [];

  for (const symbol of symbols) {
    const result = await fetchFmpCompanyProfile(symbol);

    if (!result.ok || !result.data) {
      failedSymbols.push({
        symbol,
        status: "failed",
        reason: result.error ?? "Provider request failed",
        dbAction: "kept_existing",
      });
      continue;
    }

    const profile = result.data;

    try {
      const stock = await prisma.stock.findUnique({ where: { symbol } });

      if (!stock) {
        skippedSymbols.push({
          symbol,
          status: "skipped",
          reason: "Symbol not found in database",
          dbAction: "not_found",
        });
        continue;
      }

      const safeName = keepExistingIfInvalid(profile.name, stock.name);
      const safeSector = keepExistingIfInvalid(profile.sector, stock.sector ?? null);
      const safeMarketCap = isValidNumber(profile.marketCap)
        ? String(profile.marketCap)
        : stock.marketCap;

      await prisma.stock.update({
        where: { id: stock.id },
        data: {
          name: safeName,
          sector: safeSector ?? undefined,
          marketCap: safeMarketCap ?? undefined,
        },
      });

      updatedSymbols.push(symbol);
    } catch (err) {
      failedSymbols.push({
        symbol,
        status: "failed",
        reason: err instanceof Error ? err.message : "Database error",
        dbAction: "kept_existing",
      });
    }
  }

  const finishedAt = new Date();
  const successCount = updatedSymbols.length;
  const skippedCount = skippedSymbols.length;
  const failedCount = failedSymbols.length;
  const status = deriveSyncStatus(successCount, skippedCount, failedCount);

  const messageParts: string[] = [`${successCount} updated`];
  if (skippedCount > 0) messageParts.push(`${skippedCount} skipped`);
  if (failedCount > 0) messageParts.push(`${failedCount} failed`);

  return {
    status,
    provider: "fmp",
    action: "profiles-sample",
    requestedCount: symbols.length,
    successCount,
    skippedCount,
    failedCount,
    updatedSymbols,
    skippedSymbols,
    failedSymbols,
    startedAt: startedAt.toISOString(),
    finishedAt: finishedAt.toISOString(),
    durationMs: finishedAt.getTime() - startedAt.getTime(),
    persisted: successCount > 0,
    message: messageParts.join(", "),
  };
}
