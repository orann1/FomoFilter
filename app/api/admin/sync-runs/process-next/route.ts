import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/db/prisma";
import { getAllActiveUniqueSyncableSymbols } from "@/src/lib/data/admin-universes";
import { fetchFmpQuote } from "@/src/lib/market-data/providers/fmp";
import { isValidNumber } from "@/src/lib/market-data/safe-update";

const CHUNKED_SYNC_TYPE = "market-data-active-symbols-sync";
const CHUNK_SIZE = 10;
// FMP Starter allows ~750+ calls/minute — 250ms pacing is conservative but fast.
const CALL_DELAY_MS = 250;

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function serializeRun(run: {
  id: string;
  type: string;
  provider: string;
  status: string;
  requestedCount: number;
  processedCount: number;
  currentSymbol: string | null;
  successCount: number;
  skippedCount: number;
  failedCount: number;
  startedAt: Date;
  finishedAt: Date | null;
  durationMs: number | null;
  message: string | null;
}) {
  return {
    id: run.id,
    type: run.type,
    provider: run.provider,
    status: run.status,
    requestedCount: run.requestedCount,
    processedCount: run.processedCount,
    currentSymbol: run.currentSymbol,
    successCount: run.successCount,
    skippedCount: run.skippedCount,
    failedCount: run.failedCount,
    startedAt: run.startedAt.toISOString(),
    finishedAt: run.finishedAt?.toISOString() ?? null,
    durationMs: run.durationMs,
    message: run.message,
  };
}

export async function POST() {
  // Find the active or most-recently-partial run to continue
  const run = await prisma.syncRun.findFirst({
    where: {
      type: CHUNKED_SYNC_TYPE,
      status: { in: ["running", "partial_success"] },
    },
    orderBy: { startedAt: "desc" },
    select: {
      id: true,
      type: true,
      provider: true,
      status: true,
      requestedCount: true,
      processedCount: true,
      currentSymbol: true,
      successCount: true,
      skippedCount: true,
      failedCount: true,
      startedAt: true,
      finishedAt: true,
      durationMs: true,
      message: true,
    },
  });

  if (!run) {
    return NextResponse.json({ error: "No active sync run found." }, { status: 404 });
  }

  // If the run was partial_success, re-open it so it can continue
  if (run.status === "partial_success") {
    await prisma.syncRun.update({
      where: { id: run.id },
      data: { status: "running", finishedAt: null, message: null },
    });
  }

  const allSymbols = await getAllActiveUniqueSyncableSymbols();

  // Source of truth: which symbols already have a SyncRunItem for this run
  const processedItems = await prisma.syncRunItem.findMany({
    where: { syncRunId: run.id },
    select: { symbol: true },
  });
  const processedSet = new Set(processedItems.map((i) => i.symbol));

  const remaining = allSymbols.filter((s) => !processedSet.has(s));

  if (remaining.length === 0) {
    // All symbols already processed — finalize
    const finishedAt = new Date();
    const durationMs = finishedAt.getTime() - run.startedAt.getTime();
    const finalStatus =
      run.failedCount > 0 && run.successCount === 0
        ? "failed"
        : run.failedCount > 0 || run.skippedCount > 0
        ? "partial_success"
        : "success";

    const updated = await prisma.syncRun.update({
      where: { id: run.id },
      data: {
        status: finalStatus,
        finishedAt,
        durationMs,
        currentSymbol: null,
        message: `All ${run.requestedCount} stocks processed.`,
      },
      select: {
        id: true,
        type: true,
        provider: true,
        status: true,
        requestedCount: true,
        processedCount: true,
        currentSymbol: true,
        successCount: true,
        skippedCount: true,
        failedCount: true,
        startedAt: true,
        finishedAt: true,
        durationMs: true,
        message: true,
      },
    });
    return NextResponse.json({ progress: serializeRun(updated), done: true });
  }

  const chunk = remaining.slice(0, CHUNK_SIZE);

  let lastCallStartedAt = 0;
  let rateLimitHit = false;
  let localSuccess = 0;
  let localSkipped = 0;
  let localFailed = 0;

  const PROVIDER = "fmp";
  const now = new Date();

  const newItems: Array<{
    syncRunId: string;
    symbol: string;
    status: string;
    reason: string | null;
    dbAction: string;
  }> = [];

  for (const symbol of chunk) {
    if (rateLimitHit) {
      newItems.push({
        syncRunId: run.id,
        symbol,
        status: "skipped",
        reason: "Skipped after rate limit",
        dbAction: "kept_existing",
      });
      localSkipped++;
      continue;
    }

    // Update current symbol in DB so polling can show it
    await prisma.syncRun.update({
      where: { id: run.id },
      data: { currentSymbol: symbol },
    });

    const stock = await prisma.stock.findUnique({
      where: { symbol },
      include: { quote: true },
    });

    if (!stock) {
      newItems.push({
        syncRunId: run.id,
        symbol,
        status: "skipped",
        reason: "Symbol not found in DB",
        dbAction: "not_found",
      });
      localSkipped++;
      continue;
    }

    let quoteOutcome = "skipped";
    let anySuccess = false;
    const dbActionParts: string[] = [];

    // ── FMP quote call (call-start pacing) ─────────────────────────────────
    const elapsedSinceStart = Date.now() - lastCallStartedAt;
    if (lastCallStartedAt > 0 && elapsedSinceStart < CALL_DELAY_MS) {
      await sleep(CALL_DELAY_MS - elapsedSinceStart);
    }
    lastCallStartedAt = Date.now();

    const quoteResult = await fetchFmpQuote(symbol);

    if (!quoteResult.ok) {
      if (quoteResult.rateLimitHit || quoteResult.error?.includes("429")) {
        rateLimitHit = true;
        newItems.push({
          syncRunId: run.id,
          symbol,
          status: "skipped",
          reason: "FMP rate limit reached",
          dbAction: "kept_existing",
        });
        localSkipped++;
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
            changePercent: isValidNumber(q.changePercentage) ? q.changePercentage! : 0,
            open: isValidNumber(q.open) ? q.open : null,
            dayHigh: isValidNumber(q.dayHigh) ? q.dayHigh : null,
            dayLow: isValidNumber(q.dayLow) ? q.dayLow : null,
            previousClose: isValidNumber(q.previousClose) ? q.previousClose : null,
            volume: isValidNumber(q.volume) ? q.volume!.toString() : null,
            week52High: isValidNumber(q.yearHigh) ? q.yearHigh : null,
            week52Low: isValidNumber(q.yearLow) ? q.yearLow : null,
            priceAvg50: isValidNumber(q.priceAvg50) ? q.priceAvg50 : null,
            priceAvg200: isValidNumber(q.priceAvg200) ? q.priceAvg200 : null,
            source: PROVIDER,
            lastSyncedAt: now,
            sourceUpdatedAt: q.timestamp ? new Date(q.timestamp * 1000) : null,
          },
          update: {
            price: q.price!,
            changePercent: isValidNumber(q.changePercentage)
              ? q.changePercentage!
              : (existing?.changePercent ?? 0),
            open: isValidNumber(q.open) ? q.open : (existing?.open ?? null),
            dayHigh: isValidNumber(q.dayHigh) ? q.dayHigh : (existing?.dayHigh ?? null),
            dayLow: isValidNumber(q.dayLow) ? q.dayLow : (existing?.dayLow ?? null),
            previousClose: isValidNumber(q.previousClose)
              ? q.previousClose
              : (existing?.previousClose ?? null),
            volume: isValidNumber(q.volume)
              ? q.volume!.toString()
              : (existing?.volume ?? null),
            week52High: isValidNumber(q.yearHigh) ? q.yearHigh : (existing?.week52High ?? null),
            week52Low: isValidNumber(q.yearLow) ? q.yearLow : (existing?.week52Low ?? null),
            priceAvg50: isValidNumber(q.priceAvg50)
              ? q.priceAvg50
              : (existing?.priceAvg50 ?? null),
            priceAvg200: isValidNumber(q.priceAvg200)
              ? q.priceAvg200
              : (existing?.priceAvg200 ?? null),
            source: PROVIDER,
            lastSyncedAt: now,
            sourceUpdatedAt: q.timestamp
              ? new Date(q.timestamp * 1000)
              : (existing?.sourceUpdatedAt ?? null),
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

    const reason = `Quote: ${quoteOutcome}`;
    const dbAction = dbActionParts.length > 0 ? dbActionParts.join("+") : "kept_existing";

    if (anySuccess) {
      localSuccess++;
      newItems.push({ syncRunId: run.id, symbol, status: "success", reason, dbAction });
    } else if (quoteOutcome.startsWith("skipped")) {
      localSkipped++;
      newItems.push({ syncRunId: run.id, symbol, status: "skipped", reason, dbAction: "kept_existing" });
    } else {
      localFailed++;
      newItems.push({ syncRunId: run.id, symbol, status: "failed", reason, dbAction: "kept_existing" });
    }
  }

  // Persist SyncRunItems for this chunk
  if (newItems.length > 0) {
    await prisma.syncRunItem.createMany({ data: newItems });
  }

  // Update SyncRun aggregate counts
  const newProcessed = run.processedCount + newItems.length;
  const newSuccess = run.successCount + localSuccess;
  const newSkipped = run.skippedCount + localSkipped;
  const newFailed = run.failedCount + localFailed;

  const isLastChunk = remaining.length <= chunk.length;
  const shouldFinish = isLastChunk || rateLimitHit;

  let updateData: Parameters<typeof prisma.syncRun.update>[0]["data"] = {
    processedCount: newProcessed,
    successCount: newSuccess,
    skippedCount: newSkipped,
    failedCount: newFailed,
    currentSymbol: shouldFinish ? null : undefined,
  };

  if (shouldFinish) {
    const finishedAt = new Date();
    const durationMs = finishedAt.getTime() - run.startedAt.getTime();
    const finalStatus =
      newSuccess === 0
        ? "failed"
        : newFailed > 0 || newSkipped > 0 || !isLastChunk
        ? "partial_success"
        : "success";

    updateData = {
      ...updateData,
      status: finalStatus,
      finishedAt,
      durationMs,
      message: rateLimitHit
        ? "FMP rate limit reached. Continue the sync after waiting."
        : `Completed. ${newSuccess} updated, ${newSkipped} skipped, ${newFailed} failed.`,
    };
  }

  const updated = await prisma.syncRun.update({
    where: { id: run.id },
    data: updateData,
    select: {
      id: true,
      type: true,
      provider: true,
      status: true,
      requestedCount: true,
      processedCount: true,
      currentSymbol: true,
      successCount: true,
      skippedCount: true,
      failedCount: true,
      startedAt: true,
      finishedAt: true,
      durationMs: true,
      message: true,
    },
  });

  const done = shouldFinish;
  return NextResponse.json({ progress: serializeRun(updated), done });
}
