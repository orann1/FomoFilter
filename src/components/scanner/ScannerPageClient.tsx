"use client";

import { useEffect, useState, useMemo } from "react";
import type { HotStock, WatchlistItem, StockDrawerDetail } from "@/src/lib/mock-data";
import type { LocalWatchlistEntry } from "@/src/types/drawer";
import type { ActiveAlertRule } from "@/src/lib/data/dashboard";
import StockPreviewDrawer from "@/src/components/dashboard/StockPreviewDrawer";
import ScannerHeader from "./ScannerHeader";
import ScannerViewPills, { type ScannerView } from "./ScannerViewPills";
import ScannerControls, { type SortKey } from "./ScannerControls";
import ScannerFilters, { type ScannerFilterState } from "./ScannerFilters";
import ScannerTable from "./ScannerTable";
import MobileScannerCard from "./MobileScannerCard";
import { Radar } from "lucide-react";

const CLOSE_ANIMATION_MS = 300;

const DEFAULT_FILTERS: ScannerFilterState = {
  sector: "all",
  risk: "all",
  setup: "all",
  watchlistOnly: false,
  alertActiveOnly: false,
};

function getRiskPenalty(risk: string): number {
  switch (risk) {
    case "EXTREME": return 30;
    case "HIGH": return 20;
    case "MEDIUM": return 10;
    default: return 0;
  }
}

function computeBestSignal(stock: HotStock): number {
  const analystScore = Math.min(stock.analystUpside * 2, 100);
  const penalty = getRiskPenalty(stock.risk);
  return stock.hot * 0.4 + stock.opp * 0.4 + analystScore * 0.1 - penalty * 0.1;
}

function sortStocks(stocks: HotStock[], sortBy: SortKey): HotStock[] {
  const sorted = [...stocks];
  switch (sortBy) {
    case "best-signal":
      return sorted.sort((a, b) => computeBestSignal(b) - computeBestSignal(a));
    case "hot-score":
      return sorted.sort((a, b) => b.hot - a.hot);
    case "opp-score":
      return sorted.sort((a, b) => b.opp - a.opp);
    case "daily-change":
      return sorted.sort((a, b) => b.change - a.change);
    case "rel-volume":
      return sorted.sort((a, b) => b.relativeVolume - a.relativeVolume);
    case "analyst-upside":
      return sorted.sort((a, b) => b.analystUpside - a.analystUpside);
    case "symbol":
      return sorted.sort((a, b) => a.symbol.localeCompare(b.symbol));
    default:
      return sorted;
  }
}

function applyViewFilter(
  stocks: HotStock[],
  alertRulesBySymbol: Record<string, ActiveAlertRule[]>,
  view: ScannerView
): HotStock[] {
  switch (view) {
    case "strong-momentum":
      return stocks.filter((s) => s.change > 3 || s.weekChange > 5);
    case "unusual-volume":
      return stocks.filter((s) => s.relativeVolume > 1.5);
    case "fomo-risk":
      return stocks.filter((s) => s.risk === "HIGH" || s.risk === "EXTREME");
    case "in-watchlist":
      return stocks.filter((s) => s.inWatchlist);
    case "alert-active":
      return stocks.filter((s) => (alertRulesBySymbol[s.symbol]?.length ?? 0) > 0);
    default:
      return stocks;
  }
}

function getViewDefaultSort(view: ScannerView): SortKey {
  switch (view) {
    case "hot-today": return "hot-score";
    case "strong-momentum": return "daily-change";
    case "best-opportunities": return "opp-score";
    case "unusual-volume": return "rel-volume";
    case "fomo-risk": return "hot-score";
    default: return "best-signal";
  }
}

interface ScannerPageClientProps {
  stocks: HotStock[];
  watchlistItems: WatchlistItem[];
  stockDrawerDetails: Record<string, StockDrawerDetail>;
  alertRulesBySymbol: Record<string, ActiveAlertRule[]>;
}

export default function ScannerPageClient({
  stocks,
  watchlistItems,
  stockDrawerDetails,
  alertRulesBySymbol,
}: ScannerPageClientProps) {
  // Drawer state
  const [selectedStock, setSelectedStock] = useState<HotStock | null>(null);
  const [isDrawerClosing, setIsDrawerClosing] = useState(false);
  const [localWatchlistEntries, setLocalWatchlistEntries] = useState<Record<string, LocalWatchlistEntry>>({});

  // Scanner state
  const [activeView, setActiveView] = useState<ScannerView>("all");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>("best-signal");
  const [filters, setFilters] = useState<ScannerFilterState>(DEFAULT_FILTERS);

  // Sync selected stock after router.refresh()
  useEffect(() => {
    if (selectedStock) {
      const updated = stocks.find((s) => s.symbol === selectedStock.symbol);
      if (updated) setSelectedStock(updated);
    }
  }, [stocks]); // eslint-disable-line react-hooks/exhaustive-deps

  // Derive available filter options from data
  const availableSectors = useMemo(() => {
    const sectors = [...new Set(stocks.map((s) => s.sector).filter(Boolean))].sort();
    return sectors;
  }, [stocks]);

  const availableSetups = useMemo(() => {
    const setups = [...new Set(stocks.map((s) => s.setup).filter(Boolean))].sort();
    return setups;
  }, [stocks]);

  // Apply filters + view + sort
  const filteredStocks = useMemo(() => {
    let result = [...stocks];

    // 1. Search
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (s) => s.symbol.toLowerCase().includes(q) || s.name.toLowerCase().includes(q)
      );
    }

    // 2. Sector filter
    if (filters.sector !== "all") {
      result = result.filter((s) => s.sector === filters.sector);
    }

    // 3. Risk filter
    if (filters.risk !== "all") {
      result = result.filter((s) => s.risk === filters.risk);
    }

    // 4. Setup filter
    if (filters.setup !== "all") {
      result = result.filter((s) => s.setup === filters.setup);
    }

    // 5. Watchlist only
    if (filters.watchlistOnly) {
      result = result.filter((s) => s.inWatchlist);
    }

    // 6. Alert active only
    if (filters.alertActiveOnly) {
      result = result.filter((s) => (alertRulesBySymbol[s.symbol]?.length ?? 0) > 0);
    }

    // 7. View filter
    result = applyViewFilter(result, alertRulesBySymbol, activeView);

    // 8. Sort — view's default sort unless user has selected one
    const effectiveSort = sortBy;
    result = sortStocks(result, effectiveSort);

    return result;
  }, [stocks, search, filters, activeView, sortBy, alertRulesBySymbol]);

  function handleViewChange(view: ScannerView) {
    setActiveView(view);
    setSortBy(getViewDefaultSort(view));
  }

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

  return (
    <div>
      <ScannerHeader />

      <ScannerViewPills activeView={activeView} onViewChange={handleViewChange} />

      <ScannerControls
        search={search}
        onSearchChange={setSearch}
        sortBy={sortBy}
        onSortChange={setSortBy}
        resultCount={filteredStocks.length}
        totalCount={stocks.length}
      />

      <ScannerFilters
        filters={filters}
        onFilterChange={setFilters}
        availableSectors={availableSectors}
        availableSetups={availableSetups}
      />

      {/* Desktop table */}
      <ScannerTable
        stocks={filteredStocks}
        selectedSymbol={isDrawerClosing ? null : (selectedStock?.symbol ?? null)}
        alertRulesBySymbol={alertRulesBySymbol}
        onSelectStock={handleSelectStock}
      />

      {/* Mobile cards */}
      {filteredStocks.length > 0 && (
        <div className="md:hidden flex flex-col gap-3">
          {filteredStocks.map((stock) => (
            <MobileScannerCard
              key={stock.symbol}
              stock={stock}
              alertRulesBySymbol={alertRulesBySymbol}
              onSelectStock={handleSelectStock}
            />
          ))}
        </div>
      )}

      {/* Empty state */}
      {filteredStocks.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Radar size={40} className="text-slate-700 mb-4" />
          <p className="text-slate-400 font-medium mb-1">No stocks match your filters.</p>
          <p className="text-sm text-slate-600 mb-4">
            Try clearing your search or changing the selected view.
          </p>
          <button
            onClick={() => {
              setSearch("");
              setActiveView("all");
              setFilters(DEFAULT_FILTERS);
              setSortBy("best-signal");
            }}
            className="text-xs text-emerald-400 hover:text-emerald-300 border border-emerald-800/50 px-3 py-1.5 rounded-lg transition-colors"
          >
            Reset filters
          </button>
        </div>
      )}

      {/* Drawer */}
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
    </div>
  );
}
