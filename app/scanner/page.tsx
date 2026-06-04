export const dynamic = "force-dynamic";

import ClientAppShell from "@/src/components/layout/ClientAppShell";
import { getScannerData } from "@/src/lib/data/scanner";
import ScannerPageClient from "@/src/components/scanner/ScannerPageClient";

interface ScannerPageProps {
  searchParams: Promise<{ universe?: string }>;
}

export default async function ScannerPage({ searchParams }: ScannerPageProps) {
  const params = await searchParams;
  const universeSlug = params.universe ?? "nasdaq-100";

  const data = await getScannerData({ universeSlug });

  return (
    <ClientAppShell user={data.user} showSearch={false}>
      <ScannerPageClient
        stocks={data.stocks}
        watchlistItems={data.watchlistItems}
        alertRulesBySymbol={data.alertRulesBySymbol}
        universes={data.universes}
        selectedUniverseSlug={data.selectedUniverseSlug}
      />
    </ClientAppShell>
  );
}
