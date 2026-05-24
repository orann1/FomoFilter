"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import type { HotStock, WatchlistItem, StockDrawerDetail } from "@/src/lib/mock-data";
import type { LocalWatchlistEntry } from "@/src/types/drawer";
import type { ActiveAlertRule } from "@/src/lib/data/dashboard";
import type { ScannerUniverse } from "@/src/lib/data/scanner";
import StockPreviewDrawer from "@/src/components/dashboard/StockPreviewDrawer";
import ScannerHeader from "./ScannerHeader";
import ScannerViewPills, { type ScannerView } from "./ScannerViewPills";
import ScannerControls, { type SortKey } from "./ScannerControls";
import ScannerFilters, { type ScannerFilterState } from "./ScannerFilters";
import ScannerTable from "./ScannerTable";
import MobileScannerCard from "./MobileScannerCard";
import { Radar, Globe } from "lucide-react";

const CLOSE_ANIMATION_MS = 300;

const DEFAULT_FILTERS: ScannerFilterState = {
  sector: "all",
  indexFilter: "all",
  watchlistOnly: false,
  alertActiveOnly: false,
};

function nullLast(a: number | null | undefined, b: number | null | undefined, desc = true): number {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  return desc ? b - a : a - b;
}

function sortStocks(stocks: HotStock[], sortBy: SortKey): HotStock[] {
  const sorted = [...stocks];
  switch (sortBy) {
    case "fundamental-score":
      return sorted.sort((a, b) => nullLast(a.fundamentalScore, b.fundamentalScore));
    case "growth-score":
      return sorted.sort((a, b) => nullLast(a.growthScore, b.growthScore));
    case "profitability-score":
      return sorted.sort((a, b) => nullLast(a.profitabilityScore, b.profitabilityScore));
    case "valuation-score":
      return sorted.sort((a, b) => nullLast(a.valuationScore, b.valuationScore));
    case "health-score":
      return sorted.sort((a, b) => nullLast(a.financialHealthScore, b.financialHealthScore));
    case "daily-change":
      return sorted.sort((a, b) => b.change - a.change);
    case "market-cap":
      return sorted.sort((a, b) => nullLast(a.marketCapFull, b.marketCapFull));
    case "symbol":
      return sorted.sort((a, b) => a.symbol.localeCompare(b.symbol));
    default:
      return sorted;
  }
}

function applyIndexFilter(stocks: HotStock[], indexFilter: ScannerFilterState["indexFilter"]): HotStock[] {
  switch (indexFilter) {
    case "sp-500":
      return stocks.filter((s) => s.isSp500);
    case "nasdaq-100":
      return stocks.filter((s) => s.isNasdaq100);
    case "russell-1000-only":
      return stocks.filter((s) => s.isRussell1000Only);
    default:
      return stocks;
  }
}

function applyViewFilter(
  stocks: HotStock[],
  alertRulesBySymbol: Record<string, ActiveAlertRule[]>,
  view: ScannerView
): HotStock[] {
  switch (view) {
    case "in-watchlist":
      return stocks.filter((s) => s.inWatchlist);
    case "alert-active":
      return stocks.filter((s) => (alertRulesBySymbol[s.symbol]?.length ?? 0) > 0);
    default:
      return stocks;
  }
}

interface ScannerPageClientProps {
  stocks: HotStock[];
  watchlistItems: WatchlistItem[];
  stockDrawerDetails: Record<string, StockDrawerDetail>;
  alertRulesBySymbol: Record<string, ActiveAlertRule[]>;
  universes: ScannerUniverse[];
  selectedUniverseSlug: string;
}

export default function ScannerPageClient({
  stocks,
  watchlistItems,
  stockDrawerDetails,
  alertRulesBySymbol,
  universes,
  selectedUniverseSlug,
}: ScannerPageClientProps) {
  const router = useRouter();

  // Drawer state
  const [selectedStock, setSelectedStock] = useState<HotStock | null>(null);
  const [isDrawerClosing, setIsDrawerClosing] = useState(false);
  const [localWatchlistEntries, setLocalWatchlistEntries] = useState<Record<string, LocalWatchlistEntry>>({});

  // Scanner state
  const [activeView, setActiveView] = useState<ScannerView>("all");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>("fundamental-score");
  const [filters, setFilters] = useState<ScannerFilterState>(DEFAULT_FILTERS);
  const [universeSlug, setUniverseSlug] = useState(selectedUniverseSlug);

  // Sync selected stock after router.refresh()
  useEffect(() => {
    if (selectedStock) {
      const updated = stocks.find((s) => s.symbol === selectedStock.symbol);
      if (updated) setSelectedStock(updated);
    }
  }, [stocks]); // eslint-disable-line react-hooks/exhaustive-deps

  // When universe changes, reload via URL search param
  function handleUniverseChange(slug: string) {
    setUniverseSlug(slug);
    router.push(`/scanner?universe=${slug}`);
  }

  // Derive available filter options from data
  const availableSectors = useMemo(() => {
    const sectors = [...new Set(stocks.map((s) => s.sector).filter(Boolean))].sort();
    return sectors;
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

    // 2. Index filter
    result = applyIndexFilter(result, filters.indexFilter);

    // 3. Sector filter
    if (filters.sector !== "all") {
      result = result.filter((s) => s.sector === filters.sector);
    }

    // 4. Watchlist only
    if (filters.watchlistOnly) {
      result = result.filter((s) => s.inWatchlist);
    }

    // 5. Alert active only
    if (filters.alertActiveOnly) {
      result = result.filter((s) => (alertRulesBySymbol[s.symbol]?.length ?? 0) > 0);
    }

    // 6. View filter
    result = applyViewFilter(result, alertRulesBySymbol, activeView);

    // 7. Sort
    result = sortStocks(result, sortBy);

    return result;
  }, [stocks, search, filters, activeView, sortBy, alertRulesBySymbol]);

  function handleViewChange(view: ScannerView) {
    setActiveView(view);
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

  // Base universe options (only BASE_UNIVERSE type)
  const baseUniverses = universes.filter((u) => u.type === "BASE_UNIVERSE");

  return (
    <div>
      <ScannerHeader />

      {/* Universe selector */}
      {baseUniverses.length > 0 && (
        <div className="flex items-center gap-2 mb-4">
          <div className="flex items-center gap-1.5 text-slate-500">
            <Globe size={13} />
            <span className="text-xs font-medium">Universe:</span>
          </div>
          <div className="flex gap-1.5">
            {baseUniverses.map((u) => (
              <button
                key={u.slug}
                onClick={() => handleUniverseChange(u.slug)}
                className={`px-3 py-1.5 rounded-lg text-xs border transition-colors ${
                  universeSlug === u.slug
                    ? "bg-emerald-500/10 border-emerald-600/50 text-emerald-300 font-medium"
                    : "bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-slate-300"
                }`}
              >
                {u.name}
              </button>
            ))}
          </div>
          <span className="text-xs text-slate-600 ml-1">{stocks.length} stocks</span>
        </div>
      )}

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
              setSortBy("fundamental-score");
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
