export const dynamic = "force-dynamic";

import ClientAppShell from "@/src/components/layout/ClientAppShell";
import OpportunityRadarPageClient from "@/src/components/opportunity-radar/OpportunityRadarPageClient";
import { getCurrentUserForDemo } from "@/src/lib/data/current-user";
import type { DashboardUser } from "@/src/lib/data/dashboard";

async function getPageUser(): Promise<DashboardUser> {
  const user = await getCurrentUserForDemo();
  const displayName = user.name ?? user.email;
  const parts = displayName.trim().split(/\s+/);
  const initials =
    parts.length >= 2
      ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
      : displayName.slice(0, 2).toUpperCase();
  return {
    name: displayName,
    email: user.email,
    initials,
    plan: "Pro",
  };
}

export default async function OpportunityRadarPage() {
  const user = await getPageUser();
  return (
    <ClientAppShell user={user} showSearch={false}>
      <OpportunityRadarPageClient />
    </ClientAppShell>
  );
}
