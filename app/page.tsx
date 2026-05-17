export const dynamic = "force-dynamic";

import ClientAppShell from "@/src/components/layout/ClientAppShell";
import DashboardHeader from "@/src/components/dashboard/DashboardHeader";
import TodaysSignalCard from "@/src/components/dashboard/TodaysSignalCard";
import MarketStatsGrid from "@/src/components/dashboard/MarketStatsGrid";
import SummaryCardsGrid from "@/src/components/dashboard/SummaryCardsGrid";
import DashboardGrid from "@/src/components/dashboard/DashboardGrid";
import { getDashboardData } from "@/src/lib/data/dashboard";

export default async function Home() {
  const data = await getDashboardData();

  return (
    <ClientAppShell user={data.user}>
      <DashboardHeader />
      <TodaysSignalCard />
      <MarketStatsGrid stats={data.marketStats} />
      <SummaryCardsGrid cards={data.summaryCards} />
      <DashboardGrid
        hotStocks={data.hotStocks}
        watchlistItems={data.watchlistItems}
        stockDrawerDetails={data.stockDrawerDetails}
        discoverSetups={data.discoverSetups}
        topScoreChanges={data.topScoreChanges}
        aiInsights={data.aiInsights}
        recentAlerts={data.recentAlerts}
      />
    </ClientAppShell>
  );
}
