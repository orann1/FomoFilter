"use client";

import { useState } from "react";
import { type HotStock } from "@/src/lib/mock-data";
import { type LocalWatchlistEntry } from "@/src/types/drawer";
import { mockWatchlist } from "@/src/lib/mock-data";
import HotStocksTable from "./HotStocksTable";
import DiscoverSetups from "./DiscoverSetups";
import TopScoreChanges from "./TopScoreChanges";
import WatchlistWidget from "./WatchlistWidget";
import AiInsightsWidget from "./AiInsightsWidget";
import RecentAlertsWidget from "./RecentAlertsWidget";
import StockPreviewDrawer from "./StockPreviewDrawer";

const CLOSE_ANIMATION_MS = 300;

export default function DashboardGrid() {
  const [selectedStock, setSelectedStock] = useState<HotStock | null>(null);
  const [isDrawerClosing, setIsDrawerClosing] = useState(false);
  const [localWatchlistEntries, setLocalWatchlistEntries] = useState<
    Record<string, LocalWatchlistEntry>
  >({});

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

  const localEntryForSelected = selectedStock
    ? localWatchlistEntries[selectedStock.symbol]
    : undefined;

  const watchlistSymbols = new Set([
    ...mockWatchlist.map((item) => item.symbol),
    ...Object.keys(localWatchlistEntries),
  ]);

  return (
    <>
      <div className="grid grid-cols-[1fr_340px] gap-5">
        <div className="min-w-0 flex flex-col gap-5">
          <HotStocksTable
            selectedSymbol={isDrawerClosing ? null : (selectedStock?.symbol ?? null)}
            onSelectStock={handleSelectStock}
            watchlistSymbols={watchlistSymbols}
          />
          <DiscoverSetups />
        </div>
        <div className="flex flex-col gap-5">
          <TopScoreChanges />
          <WatchlistWidget />
          <AiInsightsWidget />
          <RecentAlertsWidget />
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
        />
      )}
    </>
  );
}
