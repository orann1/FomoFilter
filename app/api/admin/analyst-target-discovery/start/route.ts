import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/db/prisma";
import { getEligibleTargetDiscoverySymbols } from "@/src/lib/data/admin-analyst-target";

export const TARGET_DISCOVERY_SYNC_TYPE = "analyst-target-discovery-sync";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const mode: "start" | "restart" = body.mode === "restart" ? "restart" : "start";

  if (mode === "restart") {
    await prisma.syncRun.updateMany({
      where: { type: TARGET_DISCOVERY_SYNC_TYPE, status: { in: ["running", "partial_success"] } },
      data: {
        status: "partial_success",
        finishedAt: new Date(),
        message: "Restarted by user before completion.",
      },
    });
  } else {
    const existing = await prisma.syncRun.findFirst({
      where: { type: TARGET_DISCOVERY_SYNC_TYPE, status: "running" },
    });
    if (existing) {
      return NextResponse.json({ error: "A target discovery sync is already running." }, { status: 409 });
    }
  }

  const eligible = await getEligibleTargetDiscoverySymbols();

  const run = await prisma.syncRun.create({
    data: {
      type: TARGET_DISCOVERY_SYNC_TYPE,
      provider: "fmp",
      status: "running",
      requestedCount: eligible.length,
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
