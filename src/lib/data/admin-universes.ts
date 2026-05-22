import { prisma } from "@/src/lib/db/prisma";

export type UniverseOverviewRow = {
  universeId: string;
  universeName: string;
  universeSlug: string;
  activeMembers: number;
  inactiveMembers: number;
  totalKnown: number;
  missingQuotes: number;
  staleQuotes: number;
  withProfile: number;
  lastUniverseSync: string | null;
  lastQuoteSync: string | null;
};

export type DbStockSummary = {
  totalStocks: number;
  activeInAtLeastOneUniverse: number;
  inactiveOnly: number;
  watchlistOnly: number;
  notClassified: number;
};

const STALE_THRESHOLD_MS = 24 * 60 * 60 * 1000; // 24 hours

export async function getUniverseOverview(): Promise<UniverseOverviewRow[]> {
  const universes = await prisma.stockUniverse.findMany({
    orderBy: [{ isDefault: "desc" }, { name: "asc" }],
    include: {
      members: {
        include: {
          stock: {
            include: {
              quote: true,
            },
          },
        },
      },
    },
  });

  // Latest SyncRun per universe slug for universe sync
  const universeSyncRuns = await prisma.syncRun.findMany({
    where: { type: { startsWith: "nasdaq100-universe" } },
    orderBy: { startedAt: "desc" },
    take: 50,
  });

  const quoteSyncRuns = await prisma.syncRun.findMany({
    where: { type: { contains: "quote" } },
    orderBy: { startedAt: "desc" },
    take: 20,
  });

  const latestUniverseSync = universeSyncRuns[0]?.startedAt ?? null;
  const latestQuoteSync = quoteSyncRuns[0]?.startedAt ?? null;

  const staleThreshold = new Date(Date.now() - STALE_THRESHOLD_MS);

  return universes.map((universe) => {
    const activeMembers = universe.members.filter((m) => m.isActive);
    const inactiveMembers = universe.members.filter((m) => !m.isActive);

    const missingQuotes = activeMembers.filter((m) => !m.stock.quote).length;

    const staleQuotes = activeMembers.filter((m) => {
      const q = m.stock.quote;
      if (!q) return false;
      if (!q.lastSyncedAt) return true;
      return q.lastSyncedAt < staleThreshold;
    }).length;

    const withProfile = activeMembers.filter((m) => {
      const s = m.stock;
      return s.name && s.name.trim().length > 0 && s.sector;
    }).length;

    return {
      universeId: universe.id,
      universeName: universe.name,
      universeSlug: universe.slug,
      activeMembers: activeMembers.length,
      inactiveMembers: inactiveMembers.length,
      totalKnown: universe.members.length,
      missingQuotes,
      staleQuotes,
      withProfile,
      lastUniverseSync: latestUniverseSync?.toISOString() ?? null,
      lastQuoteSync: latestQuoteSync?.toISOString() ?? null,
    };
  });
}

export async function getDbStockSummary(): Promise<DbStockSummary> {
  const [
    totalStocks,
    stocksWithActiveMembership,
    stocksInWatchlist,
  ] = await Promise.all([
    prisma.stock.count(),
    prisma.stock.count({
      where: {
        universeMemberships: {
          some: { isActive: true },
        },
      },
    }),
    prisma.stock.count({
      where: {
        watchlistItems: { some: {} },
      },
    }),
  ]);

  // Inactive only: has memberships, all inactive, not in watchlist
  const inactiveOnly = await prisma.stock.count({
    where: {
      universeMemberships: {
        some: { isActive: false },
        none: { isActive: true },
      },
      watchlistItems: { none: {} },
    },
  });

  // Watchlist only: in watchlist, no active universe membership
  const watchlistOnly = await prisma.stock.count({
    where: {
      watchlistItems: { some: {} },
      universeMemberships: {
        none: { isActive: true },
      },
    },
  });

  // Not classified: no active universe, no watchlist, no alert
  const notClassified = await prisma.stock.count({
    where: {
      universeMemberships: {
        none: { isActive: true },
      },
      watchlistItems: { none: {} },
      alertRules: { none: {} },
    },
  });

  return {
    totalStocks,
    activeInAtLeastOneUniverse: stocksWithActiveMembership,
    inactiveOnly,
    watchlistOnly,
    notClassified,
  };
}
