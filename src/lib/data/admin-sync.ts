import { prisma } from "@/src/lib/db/prisma";

export type SyncRunItemRow = {
  id: string;
  symbol: string;
  status: string;
  reason: string | null;
  dbAction: string;
  createdAt: Date;
};

export type SyncRunRow = {
  id: string;
  type: string;
  provider: string;
  status: string;
  requestedCount: number;
  successCount: number;
  skippedCount: number;
  failedCount: number;
  persisted: boolean;
  message: string | null;
  startedAt: Date;
  finishedAt: Date | null;
  durationMs: number | null;
  createdAt: Date;
  items: SyncRunItemRow[];
};

const CHUNKED_SYNC_TYPES = ["market-data-active-symbols-sync", "market-data-nasdaq100-chunked-sync"] as const;
const ANALYST_SYNC_TYPES = ["company-data-active-symbols-sync", "analyst-data-nasdaq100-sync"] as const;
const TARGET_DISCOVERY_SYNC_TYPE = "analyst-target-discovery-sync";

export type LatestChunkedSyncRun = {
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
  startedAt: string;
  finishedAt: string | null;
  durationMs: number | null;
  message: string | null;
};

export async function getLatestTargetDiscoverySyncRun(): Promise<LatestChunkedSyncRun | null> {
  const run = await prisma.syncRun.findFirst({
    where: { type: TARGET_DISCOVERY_SYNC_TYPE },
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
  if (!run) return null;
  return {
    ...run,
    startedAt: run.startedAt.toISOString(),
    finishedAt: run.finishedAt?.toISOString() ?? null,
  };
}

export async function getLatestAnalystSyncRun(): Promise<LatestChunkedSyncRun | null> {
  const run = await prisma.syncRun.findFirst({
    where: { type: { in: [...ANALYST_SYNC_TYPES] } },
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
  if (!run) return null;
  return {
    ...run,
    startedAt: run.startedAt.toISOString(),
    finishedAt: run.finishedAt?.toISOString() ?? null,
  };
}

export async function getLatestChunkedSyncRun(): Promise<LatestChunkedSyncRun | null> {
  const run = await prisma.syncRun.findFirst({
    where: { type: { in: [...CHUNKED_SYNC_TYPES] } },
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
  if (!run) return null;
  return {
    ...run,
    startedAt: run.startedAt.toISOString(),
    finishedAt: run.finishedAt?.toISOString() ?? null,
  };
}

export async function getRecentSyncRuns(limit = 10): Promise<SyncRunRow[]> {
  return prisma.syncRun.findMany({
    take: limit,
    orderBy: { startedAt: "desc" },
    include: {
      items: { orderBy: { createdAt: "asc" } },
    },
  });
}
