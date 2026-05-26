import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/db/prisma";

const ANALYST_SYNC_TYPE = "analyst-data-nasdaq100-sync";

export async function GET() {
  const run = await prisma.syncRun.findFirst({
    where: { type: ANALYST_SYNC_TYPE },
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

  if (!run) return NextResponse.json(null);

  return NextResponse.json({
    ...run,
    startedAt: run.startedAt.toISOString(),
    finishedAt: run.finishedAt?.toISOString() ?? null,
  });
}
