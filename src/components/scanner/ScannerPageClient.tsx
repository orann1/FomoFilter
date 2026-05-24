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
import ScannerFilters, { type ScannerFilterState, DEFAULT_FILTERS, hasActiveFilters } from "./ScannerFilters";
import ScannerTable from "./ScannerTable";
import MobileScannerCard from "./MobileScannerCard";
import { Radar, Globe, Lock } from "lucide-react";

const CLOSE_ANIMATION_MS = 300;

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
    case "risk-score":
      return sorted.sort((a, b) => nullLast(a.riskContextScore, b.riskContextScore));
    case "daily-change":
      return sorted.sort((a, b) => b.change - a.change);
    case "market-cap":
      return sorted.sort((a, b) => nullLast(a.marketCapFull, b.marketCapFull));
    case "pe-ratio":
      return sorted.sort((a, b) => nullLast(a.peRatio, b.peRatio, false));
    case "peg-ratio":
      return sorted.sort((a, b) => nullLast(a.pegRatio, b.pegRatio, false));
    case "roe":
      return sorted.sort((a, b) => nullLast(a.roe, b.roe));
    case "revenue-growth":
      return sorted.sort((a, b) => nullLast(a.revenueGrowth, b.revenueGrowth));
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
    case "high-fundamentals":
      return stocks.filter((s) => (s.fundamentalScore ?? 0) >= 75);
    case "high-growth":
      return stocks.filter((s) => (s.growthScore ?? 0) >= 75);
    case "high-profitability":
      return stocks.filter((s) => (s.profitabilityScore ?? 0) >= 75);
    case "reasonable-valuation":
      return stocks.filter((s) => (s.valuationScore ?? 0) >= 60);
    case "in-watchlist":
      return stocks.filter((s) => s.inWatchlist);
    case "alert-active":
      return stocks.filter((s) => (alertRulesBySymbol[s.symbol]?.length ?? 0) > 0);
    default:
      return stocks;
  }
}

function applyScoreThresholds(stocks: HotStock[], filters: ScannerFilterState): HotStock[] {
  return stocks.filter((s) => {
    if (filters.minFundamental > 0 && (s.fundamentalScore ?? 0) < filters.minFundamental) return false;
    if (filters.minGrowth > 0 && (s.growthScore ?? 0) < filters.minGrowth) return false;
    if (filters.minProfitability > 0 && (s.profitabilityScore ?? 0) < filters.minProfitability) return false;
    if (filters.minValuation > 0 && (s.valuationScore ?? 0) < filters.minValuation) return false;
    if (filters.minHealth > 0 && (s.financialHealthScore ?? 0) < filters.minHealth) return false;
    if (filters.positiveDay && s.change < 0) return false;
    return true;
  });
}

// Ordered universe display list — Nasdaq 100 first, then others alphabetically
const UNIVERSE_DISPLAY_ORDER = ["nasdaq-100", "russell-1000", "sp-500"];

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

  const [selectedStock, setSelectedStock] = useState<HotStock | null>(null);
  const [isDrawerClosing, setIsDrawerClosing] = useState(false);
  const [localWatchlistEntries, setLocalWatchlistEntries] = useState<Record<string, LocalWatchlistEntry>>({});

  const [activeView, setActiveView] = useState<ScannerView>("all");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>("fundamental-score");
  const [filters, setFilters] = useState<ScannerFilterState>(DEFAULT_FILTERS);
  const [universeSlug, setUniverseSlug] = useState(selectedUniverseSlug);

  useEffect(() => {
    if (selectedStock) {
      const updated = stocks.find((s) => s.symbol === selectedStock.symbol);
      if (updated) setSelectedStock(updated);
    }
  }, [stocks]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleUniverseChange(slug: string) {
    setUniverseSlug(slug);
    router.push(`/scanner?universe=${slug}`);
  }

  const availableSectors = useMemo(() => {
    const sectors = [...new Set(stocks.map((s) => s.sector).filter(Boolean))].sort();
    return sectors;
  }, [stocks]);

  const filteredStocks = useMemo(() => {
    let result = [...stocks];

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (s) => s.symbol.toLowerCase().includes(q) || s.name.toLowerCase().includes(q)
      );
    }

    result = applyIndexFilter(result, filters.indexFilter);

    if (filters.sector !== "all") {
      result = result.filter((s) => s.sector === filters.sector);
    }

    if (filters.watchlistOnly) {
      result = result.filter((s) => s.inWatchlist);
    }

    if (filters.alertActiveOnly) {
      result = result.filter((s) => (alertRulesBySymbol[s.symbol]?.length ?? 0) > 0);
    }

    result = applyScoreThresholds(result, filters);
    result = applyViewFilter(result, alertRulesBySymbol, activeView);
    result = sortStocks(result, sortBy);

    return result;
  }, [stocks, search, filters, activeView, sortBy, alertRulesBySymbol]);

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

  // Build ordered universe list for selector: show known universes in preferred order;
  // include any others from DB that aren't in our list
  const orderedUniverses = useMemo(() => {
    const bySlug = new Map(universes.map((u) => [u.slug, u]));
    const ordered: ScannerUniverse[] = [];
    for (const slug of UNIVERSE_DISPLAY_ORDER) {
      const u = bySlug.get(slug);
      if (u) ordered.push(u);
    }
    // add any remaining universes not in the preset order
    for (const u of universes) {
      if (!UNIVERSE_DISPLAY_ORDER.includes(u.slug)) ordered.push(u);
    }
    return ordered;
  }, [universes]);

  const isFiltered = hasActiveFilters(filters) || search.trim() !== "" || activeView !== "all";

  return (
    <div>
      <ScannerHeader />

      {/* Universe selector */}
      {orderedUniverses.length > 0 && (
        <div className="flex items-center gap-2 mb-4">
          <div className="flex items-center gap-1.5 text-slate-500">
            <Globe size={13} />
            <span className="text-xs font-medium">Universe:</span>
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {orderedUniverses.map((u) => {
              const isActive = universeSlug === u.slug;
              const isAvailable = u.hasData;

              if (!isAvailable) {
                return (
                  <div
                    key={u.slug}
                    title="Coming soon — universe data is not loaded yet."
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border border-slate-800/60 text-slate-600 bg-slate-900/40 cursor-not-allowed select-none"
                  >
                    <Lock size={10} />
                    {u.name}
                    <span className="text-[10px] text-slate-700">Coming soon</span>
                  </div>
                );
              }

              return (
                <button
                  key={u.slug}
                  onClick={() => handleUniverseChange(u.slug)}
                  className={`px-3 py-1.5 rounded-lg text-xs border transition-colors ${
                    isActive
                      ? "bg-emerald-500/10 border-emerald-600/50 text-emerald-300 font-medium"
                      : "bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-slate-300"
                  }`}
                >
                  {u.name}
                </button>
              );
            })}
          </div>
          <span className="text-xs text-slate-600 ml-1">{stocks.length} stocks</span>
        </div>
      )}

      <ScannerViewPills activeView={activeView} onViewChange={setActiveView} />

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

      {/* Empty states */}
      {filteredStocks.length === 0 && stocks.length > 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Radar size={40} className="text-slate-700 mb-4" />
          <p className="text-slate-400 font-medium mb-1">No stocks match your filters.</p>
          <p className="text-sm text-slate-600 mb-4">
            Try lowering the score threshold, clearing the sector filter, or selecting All Stocks.
          </p>
          {isFiltered && (
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
          )}
        </div>
      )}

      {stocks.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Radar size={40} className="text-slate-700 mb-4" />
          <p className="text-slate-400 font-medium mb-1">No scanner data available yet.</p>
          <p className="text-sm text-slate-600">
            Run Market Data Sync and Calculate Fundamental Scores from Admin Sync.
          </p>
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
