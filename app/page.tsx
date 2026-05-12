import ClientAppShell from "@/src/components/layout/ClientAppShell";
import DashboardHeader from "@/src/components/dashboard/DashboardHeader";
import TodaysSignalCard from "@/src/components/dashboard/TodaysSignalCard";
import MarketStatsGrid from "@/src/components/dashboard/MarketStatsGrid";
import SummaryCardsGrid from "@/src/components/dashboard/SummaryCardsGrid";
import DashboardGrid from "@/src/components/dashboard/DashboardGrid";

export default function Home() {
  return (
    <ClientAppShell>
      <DashboardHeader />
      <TodaysSignalCard />
      <MarketStatsGrid />
      <SummaryCardsGrid />
      <DashboardGrid />
    </ClientAppShell>
  );
}
