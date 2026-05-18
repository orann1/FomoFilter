"use client";

import { useEffect, useState } from "react";
import { type HotStock, type WatchlistItem, type StockDrawerDetail, type ScannerSetup, type ScoreChange, type AiInsight, type RecentAlert } from "@/src/lib/mock-data";
import { type LocalWatchlistEntry } from "@/src/types/drawer";
import { type ActiveAlertRule } from "@/src/lib/data/dashboard";
import HotStocksTable from "./HotStocksTable";
import DiscoverSetups from "./DiscoverSetups";
import TopScoreChanges from "./TopScoreChanges";
import WatchlistWidget from "./WatchlistWidget";
import AiInsightsWidget from "./AiInsightsWidget";
import RecentAlertsWidget from "./RecentAlertsWidget";
import StockPreviewDrawer from "./StockPreviewDrawer";

const CLOSE_ANIMATION_MS = 300;

interface DashboardGridProps {
  hotStocks: HotStock[];
  watchlistItems: WatchlistItem[];
  stockDrawerDetails: Record<string, StockDrawerDetail>;
  discoverSetups: ScannerSetup[];
  topScoreChanges: ScoreChange[];
  aiInsights: AiInsight[];
  recentAlerts: RecentAlert[];
  alertRulesBySymbol: Record<string, ActiveAlertRule[]>;
}

export default function DashboardGrid({
  hotStocks,
  watchlistItems,
  stockDrawerDetails,
  discoverSetups,
  topScoreChanges,
  aiInsights,
  recentAlerts,
  alertRulesBySymbol,
}: DashboardGridProps) {
  const [selectedStock, setSelectedStock] = useState<HotStock | null>(null);
  const [isDrawerClosing, setIsDrawerClosing] = useState(false);
  const [localWatchlistEntries, setLocalWatchlistEntries] = useState<
    Record<string, LocalWatchlistEntry>
  >({});

  // Sync selectedStock with refreshed hotStocks prop so drawer reflects DB state
  useEffect(() => {
    if (selectedStock) {
      const updated = hotStocks.find((s) => s.symbol === selectedStock.symbol);
      if (updated) setSelectedStock(updated);
    }
  }, [hotStocks]); // eslint-disable-line react-hooks/exhaustive-deps

  function closeDrawer() {
    setIsDrawerClosing(true);
    setTimeout(() => {
      setSelectedStock(null);
      setIsDrawerClosing(false);
    }, CLOSE_ANIMATION_MS);
  }

  function handleSelectStock(stock: HotStock) {
    if (selectedStock?.symbol === stock.symbol) {
      closeDrawer();
    } else {
      setIsDrawerClosing(false);
      setSelectedStock(stock);
    }
  }

  function handleAddToWatchlist(entry: LocalWatchlistEntry) {
    if (!selectedStock) return;
    setLocalWatchlistEntries((prev) => ({ ...prev, [selectedStock.symbol]: entry }));
  }

  function handleEditWatchlist(entry: LocalWatchlistEntry) {
    if (!selectedStock) return;
    setLocalWatchlistEntries((prev) => ({ ...prev, [selectedStock.symbol]: entry }));
  }

  function handleRemoveFromWatchlist() {
    if (!selectedStock) return;
    setLocalWatchlistEntries((prev) => {
      const next = { ...prev };
      delete next[selectedStock.symbol];
      return next;
    });
  }

  const localEntryForSelected = selectedStock
    ? localWatchlistEntries[selectedStock.symbol]
    : undefined;

  const watchlistSymbols = new Set([
    ...watchlistItems.map((item) => item.symbol),
    ...Object.keys(localWatchlistEntries),
  ]);

  return (
    <>
      {/* On desktop: two-column grid. On mobile: single column, right widgets stack below. */}
      <div className="flex flex-col md:grid md:grid-cols-[1fr_340px] gap-5">
        {/* Left column */}
        <div className="min-w-0 flex flex-col gap-5">
          <HotStocksTable
            hotStocks={hotStocks}
            selectedSymbol={isDrawerClosing ? null : (selectedStock?.symbol ?? null)}
            onSelectStock={handleSelectStock}
            watchlistSymbols={watchlistSymbols}
          />
          <DiscoverSetups setups={discoverSetups} />
        </div>

        {/* Right column — stacks below on mobile */}
        <div className="flex flex-col gap-5">
          <TopScoreChanges scoreChanges={topScoreChanges} />
          <WatchlistWidget watchlistItems={watchlistItems} />
          <AiInsightsWidget insights={aiInsights} />
          <RecentAlertsWidget alerts={recentAlerts} />
        </div>
      </div>

      {selectedStock && (
        <StockPreviewDrawer
          stock={selectedStock}
          isClosing={isDrawerClosing}
          onClose={closeDrawer}
          localWatchlistEntry={localEntryForSelected}
          onAddToWatchlist={handleAddToWatchlist}
          onEditWatchlist={handleEditWatchlist}
          onRemoveFromWatchlist={handleRemoveFromWatchlist}
          stockDrawerDetails={stockDrawerDetails}
          dbWatchlistItems={watchlistItems}
          alertRulesBySymbol={alertRulesBySymbol}
        />
      )}
    </>
  );
}
