export const dynamic = "force-dynamic";

import ClientAppShell from "@/src/components/layout/ClientAppShell";
import DashboardHeader from "@/src/components/dashboard/DashboardHeader";
import DashboardSummaryCards from "@/src/components/dashboard/DashboardSummaryCards";
import DataWarningsSection from "@/src/components/dashboard/DataWarningsSection";
import DashboardGrid from "@/src/components/dashboard/DashboardGrid";
import { getDashboardData } from "@/src/lib/data/dashboard";

export default async function Home() {
  const data = await getDashboardData();

  return (
    <ClientAppShell user={data.user}>
      <DashboardHeader />
      <DataWarningsSection warnings={data.dataWarnings} />
      <DashboardSummaryCards summary={data.summary} freshness={data.freshness} />
      <DashboardGrid
        topFundamentalStocks={data.topFundamentalStocks}
        sectorSummary={data.sectorSummary}
        watchlistItems={data.watchlistItems}
        summary={data.summary}
        freshness={data.freshness}
        alertRulesBySymbol={data.alertRulesBySymbol}
      />
    </ClientAppShell>
  );
}
