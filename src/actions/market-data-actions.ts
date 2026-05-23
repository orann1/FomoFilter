"use server";

import { prisma } from "@/src/lib/db/prisma";
import {
  testFmpProfile,
  fetchFmpCompanyProfile,
  fetchFmpNasdaq100Constituents,
} from "@/src/lib/market-data/providers/fmp";
import { testTwelveQuote, fetchTwelveQuotes } from "@/src/lib/market-data/providers/twelve-data";
import {
  testFinnhubNews,
  fetchFinnhubQuote,
  fetchFinnhubBasicFinancials,
} from "@/src/lib/market-data/providers/finnhub";
import { isValidNumber, keepExistingIfInvalid } from "@/src/lib/market-data/safe-update";
import {
  getNextNasdaq100QuoteBatch,
  getNextNasdaq100MarketDataBatch,
} from "@/src/lib/data/admin-universes";
import type {
  ProviderTestResult,
  NormalizedQuote,
  SyncActionResult,
  SyncRunStatus,
  SyncSymbolResult,
} from "@/src/lib/market-data/types";

export type UniverseSyncActionResult = {
  status: SyncRunStatus;
  provider: string;
  action: string;
  requestedCount: number;
  successCount: number;
  skippedCount: number;
  failedCount: number;
  deactivatedCount: number;
  createdStocks: number;
  createdMemberships: number;
  reactivated: number;
  alreadyActive: number;
  message: string;
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  persisted: boolean;
  items: Array<{
    symbol: string;
    status: string;
    reason: string;
    dbAction: string;
  }>;
};

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

async function persistSyncLog(
  type: string,
  provider: string,
  status: SyncRunStatus,
  requestedCount: number,
  successCount: number,
  skippedCount: number,
  failedCount: number,
  persisted: boolean,
  message: string,
  startedAt: Date,
  finishedAt: Date,
  durationMs: number,
  updatedSymbols: string[],
  skippedSymbols: SyncSymbolResult[],
  failedSymbols: SyncSymbolResult[]
): Promise<void> {
  const syncRun = await prisma.syncRun.create({
    data: {
      type,
      provider,
      status,
      requestedCount,
      successCount,
      skippedCount,
      failedCount,
      persisted,
      message,
      startedAt,
      finishedAt,
      durationMs,
    },
  });

  const items = [
    ...updatedSymbols.map((sym) => ({
      syncRunId: syncRun.id,
      symbol: sym,
      status: "success",
      reason: "Updated successfully",
      dbAction: "updated",
    })),
    ...skippedSymbols.map((s) => ({
      syncRunId: syncRun.id,
      symbol: s.symbol,
      status: "skipped",
      reason: s.reason ?? null,
      dbAction: s.dbAction,
    })),
    ...failedSymbols.map((s) => ({
      syncRunId: syncRun.id,
      symbol: s.symbol,
      status: "failed",
      reason: s.reason ?? null,
      dbAction: s.dbAction,
    })),
  ];

  if (items.length > 0) {
    await prisma.syncRunItem.createMany({ data: items });
  }
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

// ── Shared quote sync core ────────────────────────────────────────────────────

async function syncQuotesForSymbols(
  symbols: string[],
  syncType: string,
  provider: "twelve-data" | "finnhub" = "twelve-data"
): Promise<SyncActionResult> {
  const startedAt = new Date();

  const updatedSymbols: string[] = [];
  const skippedSymbols: SyncSymbolResult[] = [];
  const failedSymbols: SyncSymbolResult[] = [];
  const quoteDbActions = new Map<string, string>();
  const symbolQuoteMap = new Map<string, NormalizedQuote>();

  // ── Fetch phase ──────────────────────────────────────────────────────────

  if (provider === "finnhub") {
    let rateLimitHit = false;

    for (const symbol of symbols) {
      if (rateLimitHit) {
        skippedSymbols.push({
          symbol,
          status: "skipped",
          reason: "Finnhub rate limit reached. Wait and run again.",
          dbAction: "kept_existing",
        });
        continue;
      }

      const result = await fetchFinnhubQuote(symbol);

      if (!result.ok) {
        if (
          result.error?.includes("rate limit") ||
          result.error?.includes("429")
        ) {
          rateLimitHit = true;
          skippedSymbols.push({
            symbol,
            status: "skipped",
            reason: "Finnhub rate limit reached. Wait and run again.",
            dbAction: "kept_existing",
          });
        } else {
          failedSymbols.push({
            symbol,
            status: "failed",
            reason: result.error ?? "Provider request failed",
            dbAction: "kept_existing",
          });
        }
        continue;
      }

      if (result.data) {
        symbolQuoteMap.set(symbol, result.data);
      } else {
        skippedSymbols.push({
          symbol,
          status: "skipped",
          reason: "No quote data returned by Finnhub",
          dbAction: "kept_existing",
        });
      }
    }
  } else {
    // Twelve Data batch fetch
    const providerResult = await fetchTwelveQuotes(symbols);

    if (!providerResult.ok || !providerResult.data) {
      const finishedAt = new Date();
      const durationMs = finishedAt.getTime() - startedAt.getTime();
      const errorMsg =
        providerResult.error ?? "Provider request failed before any symbol was processed";
      const allFailed: SyncSymbolResult[] = symbols.map((sym) => ({
        symbol: sym,
        status: "failed",
        reason: providerResult.error ?? "Provider request failed",
        dbAction: "kept_existing",
      }));
      const failSyncRun = await prisma.syncRun.create({
        data: {
          type: syncType,
          provider,
          status: "failed",
          requestedCount: symbols.length,
          successCount: 0,
          skippedCount: 0,
          failedCount: symbols.length,
          persisted: false,
          message: errorMsg,
          startedAt,
          finishedAt,
          durationMs,
        },
      });
      await prisma.syncRunItem.createMany({
        data: allFailed.map((s) => ({
          syncRunId: failSyncRun.id,
          symbol: s.symbol,
          status: "failed",
          reason: s.reason ?? null,
          dbAction: s.dbAction,
        })),
      });
      return {
        status: "failed",
        provider,
        action: syncType,
        requestedCount: symbols.length,
        successCount: 0,
        skippedCount: 0,
        failedCount: symbols.length,
        updatedSymbols: [],
        skippedSymbols: [],
        failedSymbols: allFailed,
        startedAt: startedAt.toISOString(),
        finishedAt: finishedAt.toISOString(),
        durationMs,
        persisted: false,
        message: errorMsg,
      };
    }

    for (const q of providerResult.data) {
      symbolQuoteMap.set(q.symbol, q);
    }
  }

  // ── Process phase ────────────────────────────────────────────────────────

  const handledSymbols = new Set([
    ...skippedSymbols.map((s) => s.symbol),
    ...failedSymbols.map((s) => s.symbol),
  ]);

  for (const symbol of symbols) {
    if (handledSymbols.has(symbol)) continue;

    const quote = symbolQuoteMap.get(symbol);

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
      const isNewQuote = !existing;

      await prisma.stockQuote.upsert({
        where: { stockId: stock.id },
        create: {
          stockId: stock.id,
          price: quote.price,
          changePercent: isValidNumber(quote.changePercent) ? quote.changePercent : 0,
          volume: isValidNumber(quote.volume) ? String(Math.round(quote.volume)) : null,
          open: isValidNumber(quote.open) ? quote.open : null,
          dayHigh: isValidNumber(quote.high) ? quote.high : null,
          dayLow: isValidNumber(quote.low) ? quote.low : null,
          previousClose: isValidNumber(quote.previousClose) ? quote.previousClose : null,
          source: provider,
          lastSyncedAt: now,
          sourceUpdatedAt: quote.timestamp ? new Date(quote.timestamp) : null,
        },
        update: {
          price: quote.price,
          changePercent: isValidNumber(quote.changePercent)
            ? quote.changePercent
            : existing?.changePercent ?? 0,
          // Finnhub /quote has no volume — preserve existing value rather than overwriting
          volume: isValidNumber(quote.volume)
            ? String(Math.round(quote.volume))
            : existing?.volume ?? undefined,
          open: isValidNumber(quote.open) ? quote.open : existing?.open ?? null,
          dayHigh: isValidNumber(quote.high) ? quote.high : existing?.dayHigh ?? null,
          dayLow: isValidNumber(quote.low) ? quote.low : existing?.dayLow ?? null,
          previousClose: isValidNumber(quote.previousClose)
            ? quote.previousClose
            : existing?.previousClose ?? null,
          source: provider,
          lastSyncedAt: now,
          sourceUpdatedAt: quote.timestamp
            ? new Date(quote.timestamp)
            : existing?.sourceUpdatedAt ?? null,
        },
      });

      updatedSymbols.push(symbol);
      quoteDbActions.set(symbol, isNewQuote ? "created_quote" : "updated_quote");
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
  const durationMs = finishedAt.getTime() - startedAt.getTime();
  const successCount = updatedSymbols.length;
  const skippedCount = skippedSymbols.length;
  const failedCount = failedSymbols.length;
  const status = deriveSyncStatus(successCount, skippedCount, failedCount);
  const persisted = successCount > 0;

  const messageParts: string[] = [`${successCount} updated`];
  if (skippedCount > 0) messageParts.push(`${skippedCount} skipped`);
  if (failedCount > 0) messageParts.push(`${failedCount} failed`);
  const message = messageParts.join(", ");

  const syncRun = await prisma.syncRun.create({
    data: {
      type: syncType,
      provider,
      status,
      requestedCount: symbols.length,
      successCount,
      skippedCount,
      failedCount,
      persisted,
      message,
      startedAt,
      finishedAt,
      durationMs,
    },
  });

  const items = [
    ...updatedSymbols.map((sym) => ({
      syncRunId: syncRun.id,
      symbol: sym,
      status: "success",
      reason: "Updated successfully",
      dbAction: quoteDbActions.get(sym) ?? "updated_quote",
    })),
    ...skippedSymbols.map((s) => ({
      syncRunId: syncRun.id,
      symbol: s.symbol,
      status: "skipped",
      reason: s.reason ?? null,
      dbAction: s.dbAction,
    })),
    ...failedSymbols.map((s) => ({
      syncRunId: syncRun.id,
      symbol: s.symbol,
      status: "failed",
      reason: s.reason ?? null,
      dbAction: s.dbAction,
    })),
  ];

  if (items.length > 0) {
    await prisma.syncRunItem.createMany({ data: items });
  }

  return {
    status,
    provider,
    action: syncType,
    requestedCount: symbols.length,
    successCount,
    skippedCount,
    failedCount,
    updatedSymbols,
    skippedSymbols,
    failedSymbols,
    startedAt: startedAt.toISOString(),
    finishedAt: finishedAt.toISOString(),
    durationMs,
    persisted,
    message,
  };
}

export async function syncQuotesSampleAction(): Promise<SyncActionResult> {
  const dbStocks = await prisma.stock.findMany({
    where: { isActive: true },
    select: { symbol: true },
    take: 10,
  });

  const symbols =
    dbStocks.length > 0
      ? dbStocks.map((s) => s.symbol).slice(0, 5)
      : ["NVDA", "AMD", "TSLA", "PLTR", "SMCI"];

  return syncQuotesForSymbols(symbols, "quotes-sample");
}

// ── Nasdaq 100 Quote Snapshot Batch Sync ─────────────────────────────────────

export async function syncNasdaq100QuoteSnapshotsAction(): Promise<SyncActionResult> {
  const symbols = await getNextNasdaq100QuoteBatch(25);

  if (symbols.length === 0) {
    const now = new Date().toISOString();
    return {
      status: "failed",
      provider: "finnhub",
      action: "quotes-nasdaq100-batch",
      requestedCount: 0,
      successCount: 0,
      skippedCount: 0,
      failedCount: 0,
      updatedSymbols: [],
      skippedSymbols: [],
      failedSymbols: [],
      startedAt: now,
      finishedAt: now,
      durationMs: 0,
      persisted: false,
      message:
        "No active Nasdaq 100 members found. Run the Nasdaq 100 Universe sync first.",
    };
  }

  return syncQuotesForSymbols(symbols, "quotes-nasdaq100-batch", "finnhub");
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
  const durationMs = finishedAt.getTime() - startedAt.getTime();
  const successCount = updatedSymbols.length;
  const skippedCount = skippedSymbols.length;
  const failedCount = failedSymbols.length;
  const status = deriveSyncStatus(successCount, skippedCount, failedCount);
  const persisted = successCount > 0;

  const messageParts: string[] = [`${successCount} updated`];
  if (skippedCount > 0) messageParts.push(`${skippedCount} skipped`);
  if (failedCount > 0) messageParts.push(`${failedCount} failed`);
  const message = messageParts.join(", ");

  await persistSyncLog(
    "profiles-sample", "fmp", status,
    symbols.length, successCount, skippedCount, failedCount, persisted,
    message, startedAt, finishedAt, durationMs,
    updatedSymbols, skippedSymbols, failedSymbols
  );

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
    durationMs,
    persisted,
    message,
  };
}

// ── Nasdaq 100 Market Data Batch Sync (quote + metrics) ──────────────────────

export async function syncNasdaq100MarketDataAction(): Promise<SyncActionResult> {
  const startedAt = new Date();
  const SYNC_TYPE = "market-data-nasdaq100-batch";
  const PROVIDER = "finnhub";

  const symbols = await getNextNasdaq100MarketDataBatch(25);

  if (symbols.length === 0) {
    const now = new Date().toISOString();
    return {
      status: "failed",
      provider: PROVIDER,
      action: SYNC_TYPE,
      requestedCount: 0,
      successCount: 0,
      skippedCount: 0,
      failedCount: 0,
      updatedSymbols: [],
      skippedSymbols: [],
      failedSymbols: [],
      startedAt: now,
      finishedAt: now,
      durationMs: 0,
      persisted: false,
      message: "No active Nasdaq 100 members found. Run the Nasdaq 100 Universe sync first.",
    };
  }

  const updatedSymbols: string[] = [];
  const skippedSymbols: SyncSymbolResult[] = [];
  const failedSymbols: SyncSymbolResult[] = [];
  const symbolDbActions = new Map<string, string>();

  let rateLimitHit = false;

  for (const symbol of symbols) {
    if (rateLimitHit) {
      skippedSymbols.push({
        symbol,
        status: "skipped",
        reason: "Finnhub rate limit reached. Wait and run again.",
        dbAction: "kept_existing",
      });
      continue;
    }

    // Look up the stock record once
    const stock = await prisma.stock.findUnique({
      where: { symbol },
      include: { quote: true, metric: true },
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

    const now = new Date();
    let quoteOutcome = "skipped";
    let metricsOutcome = "skipped";
    let anySuccess = false;
    let dbActionParts: string[] = [];

    // ── Quote call ──────────────────────────────────────────────────────────
    const quoteResult = await fetchFinnhubQuote(symbol);

    if (!quoteResult.ok) {
      if (quoteResult.error?.includes("rate limit") || quoteResult.error?.includes("429")) {
        rateLimitHit = true;
        skippedSymbols.push({
          symbol,
          status: "skipped",
          reason: "Finnhub rate limit reached. Wait and run again.",
          dbAction: "kept_existing",
        });
        continue;
      }
      quoteOutcome = `failed — ${quoteResult.error ?? "provider error"}`;
    } else if (quoteResult.data && isValidNumber(quoteResult.data.price)) {
      const q = quoteResult.data;
      const existing = stock.quote;
      const isNew = !existing;
      try {
        await prisma.stockQuote.upsert({
          where: { stockId: stock.id },
          create: {
            stockId: stock.id,
            price: q.price!,
            changePercent: isValidNumber(q.changePercent) ? q.changePercent! : 0,
            open: isValidNumber(q.open) ? q.open : null,
            dayHigh: isValidNumber(q.high) ? q.high : null,
            dayLow: isValidNumber(q.low) ? q.low : null,
            previousClose: isValidNumber(q.previousClose) ? q.previousClose : null,
            source: PROVIDER,
            lastSyncedAt: now,
            sourceUpdatedAt: q.timestamp ? new Date(q.timestamp) : null,
          },
          update: {
            price: q.price!,
            changePercent: isValidNumber(q.changePercent) ? q.changePercent! : (existing?.changePercent ?? 0),
            open: isValidNumber(q.open) ? q.open : (existing?.open ?? null),
            dayHigh: isValidNumber(q.high) ? q.high : (existing?.dayHigh ?? null),
            dayLow: isValidNumber(q.low) ? q.low : (existing?.dayLow ?? null),
            previousClose: isValidNumber(q.previousClose) ? q.previousClose : (existing?.previousClose ?? null),
            source: PROVIDER,
            lastSyncedAt: now,
            sourceUpdatedAt: q.timestamp ? new Date(q.timestamp) : (existing?.sourceUpdatedAt ?? null),
          },
        });
        quoteOutcome = isNew ? "created" : "updated";
        anySuccess = true;
        dbActionParts.push(isNew ? "created_quote" : "updated_quote");
      } catch {
        quoteOutcome = "failed — db error";
      }
    } else {
      quoteOutcome = "skipped — no price";
    }

    // ── Metrics call ────────────────────────────────────────────────────────
    const metricsResult = await fetchFinnhubBasicFinancials(symbol);

    if (!metricsResult.ok) {
      if (metricsResult.error?.includes("rate limit") || metricsResult.error?.includes("429")) {
        rateLimitHit = true;
        metricsOutcome = "skipped — rate limit";
      } else {
        metricsOutcome = `failed — ${metricsResult.error ?? "provider error"}`;
      }
    } else if (metricsResult.data) {
      const m = metricsResult.data;
      const existingMetric = stock.metric;
      const isNew = !existingMetric;

      const safeNum = (v: number | null) => (isValidNumber(v) ? v : null);

      try {
        await prisma.stockMetric.upsert({
          where: { stockId: stock.id },
          create: {
            stockId: stock.id,
            provider: PROVIDER,
            revenueGrowthTTMYoy: safeNum(m.revenueGrowthTTMYoy),
            epsGrowthTTMYoy: safeNum(m.epsGrowthTTMYoy),
            revenueGrowthQuarterlyYoy: safeNum(m.revenueGrowthQuarterlyYoy),
            epsGrowthQuarterlyYoy: safeNum(m.epsGrowthQuarterlyYoy),
            revenueGrowth3Y: safeNum(m.revenueGrowth3Y),
            epsGrowth3Y: safeNum(m.epsGrowth3Y),
            grossMarginTTM: safeNum(m.grossMarginTTM),
            operatingMarginTTM: safeNum(m.operatingMarginTTM),
            netProfitMarginTTM: safeNum(m.netProfitMarginTTM),
            roeTTM: safeNum(m.roeTTM),
            roaTTM: safeNum(m.roaTTM),
            totalDebtToEquityAnnual: safeNum(m.totalDebtToEquityAnnual),
            currentRatioAnnual: safeNum(m.currentRatioAnnual),
            quickRatioAnnual: safeNum(m.quickRatioAnnual),
            netInterestCoverageAnnual: safeNum(m.netInterestCoverageAnnual),
            peBasicExclExtraTTM: safeNum(m.peBasicExclExtraTTM),
            forwardPE: safeNum(m.forwardPE),
            pegTTM: safeNum(m.pegTTM),
            forwardPEG: safeNum(m.forwardPEG),
            psTTM: safeNum(m.psTTM),
            pbAnnual: safeNum(m.pbAnnual),
            evEbitdaTTM: safeNum(m.evEbitdaTTM),
            epsTTM: safeNum(m.epsTTM),
            beta: safeNum(m.beta),
            marketCapitalization: safeNum(m.marketCapitalization),
            week52High: safeNum(m.week52High),
            week52Low: safeNum(m.week52Low),
            dividendYieldIndicatedAnnual: safeNum(m.dividendYieldIndicatedAnnual),
            rawMetricCount: m.rawMetricCount,
            lastSyncedAt: now,
          },
          update: {
            provider: PROVIDER,
            revenueGrowthTTMYoy: safeNum(m.revenueGrowthTTMYoy) ?? existingMetric?.revenueGrowthTTMYoy ?? null,
            epsGrowthTTMYoy: safeNum(m.epsGrowthTTMYoy) ?? existingMetric?.epsGrowthTTMYoy ?? null,
            revenueGrowthQuarterlyYoy: safeNum(m.revenueGrowthQuarterlyYoy) ?? existingMetric?.revenueGrowthQuarterlyYoy ?? null,
            epsGrowthQuarterlyYoy: safeNum(m.epsGrowthQuarterlyYoy) ?? existingMetric?.epsGrowthQuarterlyYoy ?? null,
            revenueGrowth3Y: safeNum(m.revenueGrowth3Y) ?? existingMetric?.revenueGrowth3Y ?? null,
            epsGrowth3Y: safeNum(m.epsGrowth3Y) ?? existingMetric?.epsGrowth3Y ?? null,
            grossMarginTTM: safeNum(m.grossMarginTTM) ?? existingMetric?.grossMarginTTM ?? null,
            operatingMarginTTM: safeNum(m.operatingMarginTTM) ?? existingMetric?.operatingMarginTTM ?? null,
            netProfitMarginTTM: safeNum(m.netProfitMarginTTM) ?? existingMetric?.netProfitMarginTTM ?? null,
            roeTTM: safeNum(m.roeTTM) ?? existingMetric?.roeTTM ?? null,
            roaTTM: safeNum(m.roaTTM) ?? existingMetric?.roaTTM ?? null,
            totalDebtToEquityAnnual: safeNum(m.totalDebtToEquityAnnual) ?? existingMetric?.totalDebtToEquityAnnual ?? null,
            currentRatioAnnual: safeNum(m.currentRatioAnnual) ?? existingMetric?.currentRatioAnnual ?? null,
            quickRatioAnnual: safeNum(m.quickRatioAnnual) ?? existingMetric?.quickRatioAnnual ?? null,
            netInterestCoverageAnnual: safeNum(m.netInterestCoverageAnnual) ?? existingMetric?.netInterestCoverageAnnual ?? null,
            peBasicExclExtraTTM: safeNum(m.peBasicExclExtraTTM) ?? existingMetric?.peBasicExclExtraTTM ?? null,
            forwardPE: safeNum(m.forwardPE) ?? existingMetric?.forwardPE ?? null,
            pegTTM: safeNum(m.pegTTM) ?? existingMetric?.pegTTM ?? null,
            forwardPEG: safeNum(m.forwardPEG) ?? existingMetric?.forwardPEG ?? null,
            psTTM: safeNum(m.psTTM) ?? existingMetric?.psTTM ?? null,
            pbAnnual: safeNum(m.pbAnnual) ?? existingMetric?.pbAnnual ?? null,
            evEbitdaTTM: safeNum(m.evEbitdaTTM) ?? existingMetric?.evEbitdaTTM ?? null,
            epsTTM: safeNum(m.epsTTM) ?? existingMetric?.epsTTM ?? null,
            beta: safeNum(m.beta) ?? existingMetric?.beta ?? null,
            marketCapitalization: safeNum(m.marketCapitalization) ?? existingMetric?.marketCapitalization ?? null,
            week52High: safeNum(m.week52High) ?? existingMetric?.week52High ?? null,
            week52Low: safeNum(m.week52Low) ?? existingMetric?.week52Low ?? null,
            dividendYieldIndicatedAnnual: safeNum(m.dividendYieldIndicatedAnnual) ?? existingMetric?.dividendYieldIndicatedAnnual ?? null,
            rawMetricCount: m.rawMetricCount,
            lastSyncedAt: now,
          },
        });
        metricsOutcome = isNew ? "created" : "updated";
        anySuccess = true;
        dbActionParts.push(isNew ? "created_metrics" : "updated_metrics");
      } catch {
        metricsOutcome = "failed — db error";
      }
    } else {
      metricsOutcome = "skipped — no metric data";
    }

    const reason = `Quote: ${quoteOutcome}, Metrics: ${metricsOutcome}`;
    const dbAction = dbActionParts.length > 0 ? dbActionParts.join("_") : "kept_existing";

    if (anySuccess) {
      updatedSymbols.push(symbol);
      symbolDbActions.set(symbol, dbAction);
    } else {
      const allSkipped =
        quoteOutcome.startsWith("skipped") && metricsOutcome.startsWith("skipped");
      if (allSkipped) {
        skippedSymbols.push({ symbol, status: "skipped", reason, dbAction: "kept_existing" });
      } else {
        failedSymbols.push({ symbol, status: "failed", reason, dbAction: "kept_existing" });
      }
    }

    // Small delay between symbols to stay under Finnhub 60 calls/minute limit (2 calls/symbol)
    await new Promise((r) => setTimeout(r, 500));
  }

  const finishedAt = new Date();
  const durationMs = finishedAt.getTime() - startedAt.getTime();
  const successCount = updatedSymbols.length;
  const skippedCount = skippedSymbols.length;
  const failedCount = failedSymbols.length;
  const status = deriveSyncStatus(successCount, skippedCount, failedCount);
  const persisted = successCount > 0;

  const messageParts: string[] = [`${successCount} updated`];
  if (skippedCount > 0) messageParts.push(`${skippedCount} skipped`);
  if (failedCount > 0) messageParts.push(`${failedCount} failed`);
  const message = messageParts.join(", ");

  const syncRun = await prisma.syncRun.create({
    data: {
      type: SYNC_TYPE,
      provider: PROVIDER,
      status,
      requestedCount: symbols.length,
      successCount,
      skippedCount,
      failedCount,
      persisted,
      message,
      startedAt,
      finishedAt,
      durationMs,
    },
  });

  const items = [
    ...updatedSymbols.map((sym) => ({
      syncRunId: syncRun.id,
      symbol: sym,
      status: "success",
      reason: "Updated successfully",
      dbAction: symbolDbActions.get(sym) ?? "updated",
    })),
    ...skippedSymbols.map((s) => ({
      syncRunId: syncRun.id,
      symbol: s.symbol,
      status: "skipped",
      reason: s.reason ?? null,
      dbAction: s.dbAction,
    })),
    ...failedSymbols.map((s) => ({
      syncRunId: syncRun.id,
      symbol: s.symbol,
      status: "failed",
      reason: s.reason ?? null,
      dbAction: s.dbAction,
    })),
  ];

  if (items.length > 0) {
    await prisma.syncRunItem.createMany({ data: items });
  }

  return {
    status,
    provider: PROVIDER,
    action: SYNC_TYPE,
    requestedCount: symbols.length,
    successCount,
    skippedCount,
    failedCount,
    updatedSymbols,
    skippedSymbols,
    failedSymbols,
    startedAt: startedAt.toISOString(),
    finishedAt: finishedAt.toISOString(),
    durationMs,
    persisted,
    message,
  };
}

// ── Nasdaq 100 Universe Sync ──────────────────────────────────────────────────

export async function syncNasdaq100UniverseAction(): Promise<UniverseSyncActionResult> {
  const startedAt = new Date();

  type ItemRecord = { symbol: string; status: string; reason: string; dbAction: string };
  const items: ItemRecord[] = [];

  let createdStocks = 0;
  let createdMemberships = 0;
  let reactivated = 0;
  let alreadyActive = 0;
  let deactivatedCount = 0;
  let failedCount = 0;
  let skippedCount = 0;

  // 1. Fetch constituents (static list + FMP profile enrichment)
  const constituentResult = await fetchFmpNasdaq100Constituents();

  if (!constituentResult.ok || !constituentResult.data) {
    const finishedAt = new Date();
    const msg = constituentResult.error ?? "Provider request failed";
    await prisma.syncRun.create({
      data: {
        type: "nasdaq100-universe-sync",
        provider: "static_fallback",
        status: "failed",
        requestedCount: 0,
        successCount: 0,
        skippedCount: 0,
        failedCount: 1,
        persisted: false,
        message: msg,
        startedAt,
        finishedAt,
        durationMs: finishedAt.getTime() - startedAt.getTime(),
      },
    });
    return {
      status: "failed",
      provider: "static_fallback",
      action: "nasdaq100-universe-sync",
      requestedCount: 0,
      successCount: 0,
      skippedCount: 0,
      failedCount: 1,
      deactivatedCount: 0,
      createdStocks: 0,
      createdMemberships: 0,
      reactivated: 0,
      alreadyActive: 0,
      message: msg,
      startedAt: startedAt.toISOString(),
      finishedAt: finishedAt.toISOString(),
      durationMs: finishedAt.getTime() - startedAt.getTime(),
      persisted: false,
      items: [],
    };
  }

  const constituents = constituentResult.data;
  const returnedSymbols = new Set(constituents.map((c) => c.symbol.toUpperCase()));

  // 2. Ensure Nasdaq 100 universe exists
  const universe = await prisma.stockUniverse.upsert({
    where: { slug: "nasdaq-100" },
    create: {
      name: "Nasdaq 100",
      slug: "nasdaq-100",
      type: "INDEX",
      isDefault: false,
      isSystem: true,
    },
    update: { updatedAt: new Date() },
  });

  // 3. Get currently active Nasdaq 100 members for deactivation pass
  const activeBeforeSync = await prisma.stockUniverseMember.findMany({
    where: { universeId: universe.id, isActive: true },
    select: { stockId: true, stock: { select: { symbol: true } } },
  });
  const activeSymbolsBeforeSync = new Map(
    activeBeforeSync.map((m) => [m.stock.symbol.toUpperCase(), m.stockId])
  );

  // 4. Process each returned constituent
  for (const constituent of constituents) {
    const symbol = constituent.symbol.toUpperCase();
    if (!symbol || symbol.trim().length === 0) {
      skippedCount++;
      items.push({ symbol, status: "skipped", reason: "Invalid symbol", dbAction: "invalid_symbol" });
      continue;
    }

    try {
      const now = new Date();

      // Upsert stock
      let stock = await prisma.stock.findUnique({ where: { symbol } });
      let newStockCreated = false;

      if (!stock) {
        stock = await prisma.stock.create({
          data: {
            symbol,
            name: constituent.companyName ?? symbol,
            sector: constituent.sector ?? undefined,
            marketCap: constituent.marketCap != null ? String(constituent.marketCap) : undefined,
          },
        });
        newStockCreated = true;
        createdStocks++;
      } else {
        // Safe update: only fill missing fields, never overwrite valid with null
        const updateData: Record<string, unknown> = {};
        if (constituent.companyName && !stock.name) updateData.name = constituent.companyName;
        if (constituent.sector && !stock.sector) updateData.sector = constituent.sector;
        if (constituent.marketCap != null && !stock.marketCap) {
          updateData.marketCap = String(constituent.marketCap);
        }
        if (Object.keys(updateData).length > 0) {
          await prisma.stock.update({ where: { id: stock.id }, data: updateData });
        }
      }

      // Upsert membership
      const existingMembership = await prisma.stockUniverseMember.findUnique({
        where: { stockId_universeId: { stockId: stock.id, universeId: universe.id } },
      });

      if (!existingMembership) {
        await prisma.stockUniverseMember.create({
          data: {
            stockId: stock.id,
            universeId: universe.id,
            isActive: true,
            addedAt: now,
            lastSeenAt: now,
            source: "static_fallback",
            statusReasonCode: "created_from_static_fallback",
          },
        });
        createdMemberships++;
        const dbAction = newStockCreated ? "created_stock_and_membership" : "created_membership";
        items.push({
          symbol,
          status: "success",
          reason: newStockCreated ? "Created stock and membership" : "Created membership",
          dbAction,
        });
      } else if (!existingMembership.isActive) {
        await prisma.stockUniverseMember.update({
          where: { stockId_universeId: { stockId: stock.id, universeId: universe.id } },
          data: {
            isActive: true,
            lastSeenAt: now,
            removedAt: null,
            statusReasonCode: "reactivated_from_provider",
          },
        });
        reactivated++;
        items.push({ symbol, status: "success", reason: "Membership reactivated", dbAction: "reactivated_membership" });
      } else {
        await prisma.stockUniverseMember.update({
          where: { stockId_universeId: { stockId: stock.id, universeId: universe.id } },
          data: {
            lastSeenAt: now,
            statusReasonCode: "provider_active",
          },
        });
        alreadyActive++;
        items.push({ symbol, status: "success", reason: "Already active", dbAction: "already_active" });
      }
    } catch (err) {
      failedCount++;
      items.push({
        symbol,
        status: "failed",
        reason: err instanceof Error ? err.message : "Unknown error",
        dbAction: "failed",
      });
    }
  }

  // 5. Deactivate previously active symbols missing from latest sync
  const now = new Date();
  for (const [sym, stockId] of activeSymbolsBeforeSync) {
    if (!returnedSymbols.has(sym)) {
      try {
        await prisma.stockUniverseMember.update({
          where: { stockId_universeId: { stockId, universeId: universe.id } },
          data: {
            isActive: false,
            removedAt: now,
            statusReasonCode: "missing_from_latest_provider_sync",
          },
        });
        deactivatedCount++;
        items.push({
          symbol: sym,
          status: "success",
          reason: "Not returned by latest provider sync",
          dbAction: "deactivated_membership",
        });
      } catch (err) {
        failedCount++;
        items.push({
          symbol: sym,
          status: "failed",
          reason: err instanceof Error ? err.message : "Deactivation error",
          dbAction: "failed",
        });
      }
    }
  }

  const finishedAt = new Date();
  const durationMs = finishedAt.getTime() - startedAt.getTime();
  const successCount = createdStocks + createdMemberships + reactivated + alreadyActive + deactivatedCount;
  const status: SyncRunStatus =
    failedCount > 0 && successCount === 0
      ? "failed"
      : failedCount > 0 || skippedCount > 0
      ? "partial_success"
      : "success";
  const persisted = successCount > 0;

  const message = [
    `Fetched ${constituents.length} symbols from static fallback list.`,
    `FMP /stable/nasdaq-constituent returned HTTP 402 on current plan.`,
    `Finnhub /indices/constituents returned HTML paywall.`,
    `FMP was used only for profile enrichment.`,
    `Created stocks: ${createdStocks}.`,
    `Created memberships: ${createdMemberships}.`,
    `Reactivated: ${reactivated}.`,
    `Already active: ${alreadyActive}.`,
    `Deactivated: ${deactivatedCount}.`,
    `Failed: ${failedCount}.`,
  ].join(" ");

  // 6. Persist SyncRun + SyncRunItems
  const syncRun = await prisma.syncRun.create({
    data: {
      type: "nasdaq100-universe-sync",
      provider: "static_fallback",
      status,
      requestedCount: constituents.length,
      successCount,
      skippedCount,
      failedCount,
      persisted,
      message,
      startedAt,
      finishedAt,
      durationMs,
    },
  });

  if (items.length > 0) {
    await prisma.syncRunItem.createMany({
      data: items.map((item) => ({
        syncRunId: syncRun.id,
        symbol: item.symbol,
        status: item.status,
        reason: item.reason,
        dbAction: item.dbAction,
      })),
    });
  }

  return {
    status,
    provider: "static_fallback",
    action: "nasdaq100-universe-sync",
    requestedCount: constituents.length,
    successCount,
    skippedCount,
    failedCount,
    deactivatedCount,
    createdStocks,
    createdMemberships,
    reactivated,
    alreadyActive,
    message,
    startedAt: startedAt.toISOString(),
    finishedAt: finishedAt.toISOString(),
    durationMs,
    persisted,
    items,
  };
}
