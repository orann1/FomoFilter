export const dynamic = "force-dynamic";

import ClientAppShell from "@/src/components/layout/ClientAppShell";
import SyncPageClient from "@/src/components/admin/SyncPageClient";
import { getCurrentUserForDemo } from "@/src/lib/data/current-user";

function isKeyConfigured(key: string | undefined): boolean {
  return typeof key === "string" && key.trim().length > 0;
}

export default async function AdminSyncPage() {
  const user = await getCurrentUserForDemo();

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
      <SyncPageClient providerStatus={providerStatus} />
    </ClientAppShell>
  );
}
