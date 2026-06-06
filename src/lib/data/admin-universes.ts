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
  missingMetrics: number;
  lastUniverseSync: string | null;
  lastQuoteSync: string | null;
  // Refresh cycle: count of active members with lastSyncedAt strictly newer than the oldest
  quoteRefreshCycleSynced: number;
};

export type DbStockSummary = {
  totalStocks: number;
  activeInAtLeastOneUniverse: number;
  activeWithQuotes: number;
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
              metric: { select: { lastSyncedAt: true } },
            },
          },
        },
      },
    },
  });

  // Latest SyncRun per universe slug for universe sync
  const universeSyncRuns = await prisma.syncRun.findMany({
    where: { type: { in: ["nasdaq100-universe-sync", "sp500-universe-sync"] } },
    orderBy: { startedAt: "desc" },
    take: 50,
  });

  const quoteSyncRuns = await prisma.syncRun.findMany({
    where: {
      type: {
        in: [
          "market-data-active-symbols-sync",
          "market-data-nasdaq100-chunked-sync",
          "market-data-nasdaq100-batch",
          "quotes-nasdaq100-batch",
        ],
      },
      successCount: { gt: 0 },
      // persisted flag is not reliably set for chunked market-data-active-symbols-sync runs;
      // successCount > 0 is sufficient to confirm real data was written.
    },
    orderBy: { startedAt: "desc" },
    take: 5,
  });

  // All nasdaq100-batch runs in chronological order — used for cycle boundary calculation
  const batchSyncRuns = await prisma.syncRun.findMany({
    where: { type: "quotes-nasdaq100-batch" },
    orderBy: { startedAt: "asc" },
    select: { startedAt: true, successCount: true },
  });

  const latestUniverseSync = universeSyncRuns[0]?.startedAt ?? null;
  const latestQuoteSync = quoteSyncRuns[0]?.startedAt ?? null;

  const staleThreshold = new Date(Date.now() - STALE_THRESHOLD_MS);

  return universes.map((universe) => {
    const activeMembers = universe.members.filter((m) => m.isActive);
    const inactiveMembers = universe.members.filter((m) => !m.isActive);

    const missingQuotes = activeMembers.filter((m) => !m.stock.quote).length;
    const missingMetrics = activeMembers.filter((m) => !m.stock.metric).length;

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

    // Refresh cycle: derive cycle start from SyncRun history using running-total boundary.
    // Scan runs oldest→newest, accumulate successCount; when total reaches activeCount,
    // that marks the end of a complete cycle — the next run starts a new cycle.
    // This correctly tracks 25→50→75→100 progression across consecutive batch runs.
    let quoteRefreshCycleSynced = 0;
    if (universe.slug === "nasdaq-100") {
      const totalActive = activeMembers.length;
      let running = 0;
      let cycleStart: Date | null = null;
      let cycleComplete = false;

      for (const run of batchSyncRuns) {
        if (cycleStart === null) cycleStart = run.startedAt;
        running += run.successCount;
        if (running >= totalActive) {
          running = 0;
          cycleComplete = true;
          cycleStart = null; // reset: next run begins a new cycle
        } else {
          cycleComplete = false;
        }
      }

      if (cycleComplete && cycleStart === null && batchSyncRuns.length > 0) {
        // Last cycle just completed, no new run started yet
        quoteRefreshCycleSynced = totalActive;
      } else if (cycleStart !== null) {
        // Cycle in progress: count DB members updated since cycle start
        const threshold = cycleStart;
        quoteRefreshCycleSynced = activeMembers.filter((m) => {
          const t = m.stock.quote?.lastSyncedAt;
          return t !== null && t !== undefined && t >= threshold;
        }).length;
      }
    }

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
      missingMetrics,
      lastUniverseSync: latestUniverseSync?.toISOString() ?? null,
      lastQuoteSync: latestQuoteSync?.toISOString() ?? null,
      quoteRefreshCycleSynced,
    };
  });
}

export async function getNextNasdaq100QuoteBatch(limit = 25): Promise<string[]> {
  const universe = await prisma.stockUniverse.findUnique({
    where: { slug: "nasdaq-100" },
  });

  if (!universe) return [];

  const members = await prisma.stockUniverseMember.findMany({
    where: { universeId: universe.id, isActive: true },
    include: {
      stock: {
        select: {
          symbol: true,
          quote: { select: { lastSyncedAt: true } },
        },
      },
    },
  });

  // Sort: missing quotes first (null → -1), then oldest lastSyncedAt, then symbol ASC
  members.sort((a, b) => {
    const aTime = a.stock.quote?.lastSyncedAt?.getTime() ?? -1;
    const bTime = b.stock.quote?.lastSyncedAt?.getTime() ?? -1;
    if (aTime !== bTime) return aTime - bTime;
    return a.stock.symbol.localeCompare(b.stock.symbol);
  });

  return members.slice(0, limit).map((m) => m.stock.symbol);
}

// Priority: missing metrics first, then missing quotes, then oldest metric sync, then oldest quote sync, then symbol ASC
export async function getNextNasdaq100MarketDataBatch(limit = 25): Promise<string[]> {
  const universe = await prisma.stockUniverse.findUnique({
    where: { slug: "nasdaq-100" },
  });

  if (!universe) return [];

  const members = await prisma.stockUniverseMember.findMany({
    where: { universeId: universe.id, isActive: true },
    include: {
      stock: {
        select: {
          symbol: true,
          quote: { select: { lastSyncedAt: true } },
          metric: { select: { lastSyncedAt: true } },
        },
      },
    },
  });

  members.sort((a, b) => {
    const aMetric = a.stock.metric?.lastSyncedAt?.getTime() ?? -1;
    const bMetric = b.stock.metric?.lastSyncedAt?.getTime() ?? -1;
    const aQuote = a.stock.quote?.lastSyncedAt?.getTime() ?? -1;
    const bQuote = b.stock.quote?.lastSyncedAt?.getTime() ?? -1;

    // Missing metric always first
    if (aMetric === -1 && bMetric !== -1) return -1;
    if (bMetric === -1 && aMetric !== -1) return 1;
    // Both missing metric — missing quote comes next
    if (aMetric === -1 && bMetric === -1) {
      if (aQuote === -1 && bQuote !== -1) return -1;
      if (bQuote === -1 && aQuote !== -1) return 1;
      return a.stock.symbol.localeCompare(b.stock.symbol);
    }
    // Both have metrics — sort by oldest metric sync, then oldest quote sync
    if (aMetric !== bMetric) return aMetric - bMetric;
    if (aQuote !== bQuote) return aQuote - bQuote;
    return a.stock.symbol.localeCompare(b.stock.symbol);
  });

  return members.slice(0, limit).map((m) => m.stock.symbol);
}

export async function getAllActiveNasdaq100Symbols(): Promise<string[]> {
  return getAllActiveUniverseSymbols("nasdaq-100");
}

export async function getAllActiveUniverseSymbols(universeSlug: string): Promise<string[]> {
  const universe = await prisma.stockUniverse.findUnique({
    where: { slug: universeSlug },
  });

  if (!universe) return [];

  const members = await prisma.stockUniverseMember.findMany({
    where: { universeId: universe.id, isActive: true },
    include: { stock: { select: { symbol: true } } },
    orderBy: { stock: { symbol: "asc" } },
  });

  return members.map((m) => m.stock.symbol);
}

// Returns deduplicated symbols across all active universe memberships.
// If a symbol belongs to multiple universes, it appears once.
export async function getAllActiveUniqueSyncableSymbols(): Promise<string[]> {
  const members = await prisma.stockUniverseMember.findMany({
    where: { isActive: true },
    include: { stock: { select: { symbol: true } } },
    orderBy: { stock: { symbol: "asc" } },
  });

  const seen = new Set<string>();
  const symbols: string[] = [];
  for (const m of members) {
    const sym = m.stock.symbol;
    if (!seen.has(sym)) {
      seen.add(sym);
      symbols.push(sym);
    }
  }
  return symbols;
}

export async function getDbStockSummary(): Promise<DbStockSummary> {
  const [
    totalStocks,
    stocksWithActiveMembership,
    stocksWithActiveMembershipAndQuote,
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
        universeMemberships: { some: { isActive: true } },
        quote: { isNot: null },
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
    activeWithQuotes: stocksWithActiveMembershipAndQuote,
    inactiveOnly,
    watchlistOnly,
    notClassified,
  };
}
