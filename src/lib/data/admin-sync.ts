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

export async function getRecentSyncRuns(limit = 10): Promise<SyncRunRow[]> {
  return prisma.syncRun.findMany({
    take: limit,
    orderBy: { startedAt: "desc" },
    include: {
      items: { orderBy: { createdAt: "asc" } },
    },
  });
}
