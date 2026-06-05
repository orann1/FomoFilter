import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/db/prisma";
import { getAllActiveUniqueSyncableSymbols } from "@/src/lib/data/admin-universes";

export const ANALYST_SYNC_TYPE = "company-data-active-symbols-sync";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const mode: "start" | "restart" = body.mode === "restart" ? "restart" : "start";

  const symbols = await getAllActiveUniqueSyncableSymbols();

  if (mode === "restart") {
    await prisma.syncRun.updateMany({
      where: { type: ANALYST_SYNC_TYPE, status: "running" },
      data: {
        status: "partial_success",
        finishedAt: new Date(),
        message: "Restarted by user before completion.",
      },
    });
  } else {
    const existing = await prisma.syncRun.findFirst({
      where: { type: ANALYST_SYNC_TYPE, status: "running" },
    });
    if (existing) {
      return NextResponse.json({ error: "A sync is already running." }, { status: 409 });
    }
  }

  const run = await prisma.syncRun.create({
    data: {
      type: ANALYST_SYNC_TYPE,
      provider: "fmp+finnhub",
      status: "running",
      requestedCount: symbols.length,
      processedCount: 0,
      successCount: 0,
      skippedCount: 0,
      failedCount: 0,
      startedAt: new Date(),
    },
  });

  return NextResponse.json({
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
    finishedAt: null,
    durationMs: null,
    message: run.message,
  });
}
