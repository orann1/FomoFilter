"use client";

import { type ActiveAlertRule, type DashboardStockRow, type DashboardSectorRow, type DashboardWatchlistItem, type DashboardAnalystRow } from "@/src/lib/data/dashboard";
import TopFundamentalStocksTable from "./TopFundamentalStocksTable";
import SectorSummaryTable from "./SectorSummaryTable";
import WatchlistWidget from "./WatchlistWidget";
import DataCoverageSection from "./DataCoverageSection";
import TopAnalystUpsideTable from "./TopAnalystUpsideTable";
import type { DashboardSummary, DashboardFreshness } from "@/src/lib/data/dashboard";

interface DashboardGridProps {
  topFundamentalStocks: DashboardStockRow[];
  sectorSummary: DashboardSectorRow[];
  watchlistItems: DashboardWatchlistItem[];
  summary: DashboardSummary;
  freshness: DashboardFreshness;
  alertRulesBySymbol: Record<string, ActiveAlertRule[]>;
  topAnalystUpsideStocks: DashboardAnalystRow[];
}

export default function DashboardGrid({
  topFundamentalStocks,
  sectorSummary,
  watchlistItems,
  summary,
  freshness,
  topAnalystUpsideStocks,
}: DashboardGridProps) {
  return (
    <div className="flex flex-col md:grid md:grid-cols-[1fr_320px] gap-5">
      {/* Left column */}
      <div className="min-w-0 flex flex-col gap-5">
        <TopFundamentalStocksTable stocks={topFundamentalStocks} />
        <TopAnalystUpsideTable stocks={topAnalystUpsideStocks} />
        <SectorSummaryTable sectors={sectorSummary} />
      </div>

      {/* Right column */}
      <div className="flex flex-col gap-5">
        <DataCoverageSection summary={summary} freshness={freshness} />
        <WatchlistWidget watchlistItems={watchlistItems} />
      </div>
    </div>
  );
}
