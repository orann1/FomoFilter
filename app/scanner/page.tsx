export const dynamic = "force-dynamic";

import ClientAppShell from "@/src/components/layout/ClientAppShell";
import { getScannerData } from "@/src/lib/data/scanner";
import ScannerPageClient from "@/src/components/scanner/ScannerPageClient";

export default async function ScannerPage() {
  const data = await getScannerData();

  return (
    <ClientAppShell user={data.user} showSearch={false}>
      <ScannerPageClient
        stocks={data.stocks}
        watchlistItems={data.watchlistItems}
        stockDrawerDetails={data.stockDrawerDetails}
        alertRulesBySymbol={data.alertRulesBySymbol}
      />
    </ClientAppShell>
  );
}
