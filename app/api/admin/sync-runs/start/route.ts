import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/db/prisma";
import { getAllActiveNasdaq100Symbols } from "@/src/lib/data/admin-universes";

const CHUNKED_SYNC_TYPE = "market-data-nasdaq100-chunked-sync";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const mode: "start" | "restart" = body.mode === "restart" ? "restart" : "start";

  const symbols = await getAllActiveNasdaq100Symbols();

  if (mode === "restart") {
    // Mark any in-progress run as interrupted
    await prisma.syncRun.updateMany({
      where: { type: CHUNKED_SYNC_TYPE, status: "running" },
      data: {
        status: "partial_success",
        finishedAt: new Date(),
        message: "Restarted by user before completion.",
      },
    });
  } else {
    // Block duplicate start
    const existing = await prisma.syncRun.findFirst({
      where: { type: CHUNKED_SYNC_TYPE, status: "running" },
    });
    if (existing) {
      return NextResponse.json({ error: "A sync is already running." }, { status: 409 });
    }
  }

  const run = await prisma.syncRun.create({
    data: {
      type: CHUNKED_SYNC_TYPE,
      provider: "fmp",
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
