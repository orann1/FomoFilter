import AppSidebar from "@/src/components/layout/AppSidebar";
import TopBar from "@/src/components/layout/TopBar";
import DashboardHeader from "@/src/components/dashboard/DashboardHeader";
import TodaysSignalCard from "@/src/components/dashboard/TodaysSignalCard";
import MarketStatsGrid from "@/src/components/dashboard/MarketStatsGrid";
import SummaryCardsGrid from "@/src/components/dashboard/SummaryCardsGrid";
import HotStocksTable from "@/src/components/dashboard/HotStocksTable";
import TopScoreChanges from "@/src/components/dashboard/TopScoreChanges";
import WatchlistWidget from "@/src/components/dashboard/WatchlistWidget";
import DiscoverSetups from "@/src/components/dashboard/DiscoverSetups";
import AiInsightsWidget from "@/src/components/dashboard/AiInsightsWidget";
import RecentAlertsWidget from "@/src/components/dashboard/RecentAlertsWidget";

export default function Home() {
  return (
    <div className="flex h-screen bg-[#0a0b0f] overflow-hidden">
      <AppSidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto px-6 py-6 pb-10">
          <DashboardHeader />
          <TodaysSignalCard />
          <MarketStatsGrid />
          <SummaryCardsGrid />
          <div className="grid grid-cols-[1fr_340px] gap-5">
            <div className="min-w-0 flex flex-col gap-5">
              <HotStocksTable />
              <DiscoverSetups />
            </div>
            <div className="flex flex-col gap-5">
              <TopScoreChanges />
              <WatchlistWidget />
              <AiInsightsWidget />
              <RecentAlertsWidget />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
