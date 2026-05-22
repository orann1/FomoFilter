export const dynamic = "force-dynamic";

import ClientAppShell from "@/src/components/layout/ClientAppShell";
import SyncPageClient from "@/src/components/admin/SyncPageClient";
import { getCurrentUserForDemo } from "@/src/lib/data/current-user";
import { getRecentSyncRuns } from "@/src/lib/data/admin-sync";
import { getUniverseOverview, getDbStockSummary } from "@/src/lib/data/admin-universes";

function isKeyConfigured(key: string | undefined): boolean {
  return typeof key === "string" && key.trim().length > 0;
}

export default async function AdminSyncPage() {
  const [user, recentSyncRuns, universeOverview, dbStockSummary] = await Promise.all([
    getCurrentUserForDemo(),
    getRecentSyncRuns(10),
    getUniverseOverview(),
    getDbStockSummary(),
  ]);

  const providerStatus = {
    fmp: isKeyConfigured(process.env.FMP_API_KEY),
    twelveData: isKeyConfigured(process.env.TWELVE_DATA_API_KEY),
    finnhub: isKeyConfigured(process.env.FINNHUB_API_KEY),
  };

  const dashboardUser = {
    name: user.name ?? "Admin",
    email: user.email,
    initials: user.initials ?? "A",
    plan: user.plan,
  };

  return (
    <ClientAppShell user={dashboardUser} showSearch={false}>
      <SyncPageClient
        providerStatus={providerStatus}
        recentSyncRuns={recentSyncRuns.map((run) => ({
          ...run,
          startedAt: run.startedAt.toISOString(),
          finishedAt: run.finishedAt?.toISOString() ?? null,
          createdAt: run.createdAt.toISOString(),
          items: run.items.map((item) => ({
            ...item,
            createdAt: item.createdAt.toISOString(),
          })),
        }))}
        universeOverview={universeOverview}
        dbStockSummary={dbStockSummary}
      />
    </ClientAppShell>
  );
}
