import AppSidebar from "@/src/components/layout/AppSidebar";
import TopBar from "@/src/components/layout/TopBar";
import DashboardHeader from "@/src/components/dashboard/DashboardHeader";
import TodaysSignalCard from "@/src/components/dashboard/TodaysSignalCard";
import MarketStatsGrid from "@/src/components/dashboard/MarketStatsGrid";
import SummaryCardsGrid from "@/src/components/dashboard/SummaryCardsGrid";
import DashboardGrid from "@/src/components/dashboard/DashboardGrid";

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
          <DashboardGrid />
        </main>
      </div>
    </div>
  );
}
