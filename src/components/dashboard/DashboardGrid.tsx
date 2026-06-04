"use client";

import {
  type ActiveAlertsSummary,
  type DashboardStockRow,
  type DashboardSectorRow,
  type DashboardWatchlistItem,
  type DashboardAnalystRow,
  type ActiveAlertRule,
} from "@/src/lib/data/dashboard";
import TopOpportunityStocksTable from "./TopOpportunityStocksTable";
import TopFundamentalStocksTable from "./TopFundamentalStocksTable";
import SectorSummaryTable from "./SectorSummaryTable";
import WatchlistWidget from "./WatchlistWidget";
import DataCoverageSection from "./DataCoverageSection";
import TopAnalystUpsideTable from "./TopAnalystUpsideTable";
import ActiveAlertsSummaryWidget from "./ActiveAlertsSummary";
import type { DashboardSummary, DashboardFreshness } from "@/src/lib/data/dashboard";

interface DashboardGridProps {
  topOpportunityStocks: DashboardStockRow[];
  topFundamentalStocks: DashboardStockRow[];
  sectorSummary: DashboardSectorRow[];
  watchlistItems: DashboardWatchlistItem[];
  summary: DashboardSummary;
  freshness: DashboardFreshness;
  alertRulesBySymbol: Record<string, ActiveAlertRule[]>;
  activeAlertsSummary: ActiveAlertsSummary;
  topAnalystUpsideStocks: DashboardAnalystRow[];
}

export default function DashboardGrid({
  topOpportunityStocks,
  topFundamentalStocks,
  sectorSummary,
  watchlistItems,
  summary,
  freshness,
  activeAlertsSummary,
  topAnalystUpsideStocks,
}: DashboardGridProps) {
  return (
    <div className="flex flex-col md:grid md:grid-cols-[1fr_320px] gap-5">
      {/* Left column */}
      <div className="min-w-0 flex flex-col gap-5">
        <TopOpportunityStocksTable stocks={topOpportunityStocks} />
        <TopAnalystUpsideTable stocks={topAnalystUpsideStocks} />
        <TopFundamentalStocksTable stocks={topFundamentalStocks} />
        <SectorSummaryTable sectors={sectorSummary} />
      </div>

      {/* Right sidebar */}
      <div className="flex flex-col gap-5">
        <WatchlistWidget watchlistItems={watchlistItems} />
        <ActiveAlertsSummaryWidget summary={activeAlertsSummary} />
        <DataCoverageSection summary={summary} freshness={freshness} />
      </div>
    </div>
  );
}
