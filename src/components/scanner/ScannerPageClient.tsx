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
import ScannerControls, { type SortKey, sortOptions } from "./ScannerControls";
import ScannerFilters, { type ScannerFilterState, DEFAULT_FILTERS, hasActiveFilters } from "./ScannerFilters";
import ScannerTable from "./ScannerTable";
import MobileScannerCard from "./MobileScannerCard";
import { Radar, Globe, Lock, Filter, ArrowUpDown, SlidersHorizontal, ChevronDown, ChevronUp, X } from "lucide-react";

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
    case "opportunity-score":  return sorted.sort((a, b) => nullLast(a.oppScore, b.oppScore));
    case "fundamental-score":  return sorted.sort((a, b) => nullLast(a.fundamentalScore, b.fundamentalScore));
    case "valuation-score":    return sorted.sort((a, b) => nullLast(a.valuationScore, b.valuationScore));
    case "risk-score":         return sorted.sort((a, b) => nullLast(a.riskContextScore, b.riskContextScore));
    case "daily-change":       return sorted.sort((a, b) => b.change - a.change);
    case "analyst-upside":     return sorted.sort((a, b) => nullLast(a.analystUpsidePercent, b.analystUpsidePercent));
    case "symbol":             return sorted.sort((a, b) => a.symbol.localeCompare(b.symbol));
    default:                   return sorted;
  }
}

function applyIndexFilter(stocks: HotStock[], indexFilter: ScannerFilterState["indexFilter"]): HotStock[] {
  switch (indexFilter) {
    case "sp-500":             return stocks.filter((s) => s.isSp500);
    case "nasdaq-100":         return stocks.filter((s) => s.isNasdaq100);
    case "russell-1000-only":  return stocks.filter((s) => s.isRussell1000Only);
    default:                   return stocks;
  }
}

function applyViewFilter(
  stocks: HotStock[],
  alertRulesBySymbol: Record<string, ActiveAlertRule[]>,
  view: ScannerView
): HotStock[] {
  switch (view) {
    case "high-opportunity":     return stocks.filter((s) => (s.oppScore ?? 0) >= 75);
    case "high-fundamentals":    return stocks.filter((s) => (s.fundamentalScore ?? 0) >= 75);
    case "high-analyst-upside":  return stocks.filter((s) => (s.analystUpsidePercent ?? -Infinity) >= 20);
    case "reasonable-valuation": return stocks.filter((s) => (s.valuationScore ?? 0) >= 60);
    case "in-watchlist":         return stocks.filter((s) => s.inWatchlist);
    default:                     return stocks;
  }
}

function applyScoreThresholds(stocks: HotStock[], filters: ScannerFilterState): HotStock[] {
  return stocks.filter((s) => {
    if (filters.minOpportunity > 0 && (s.oppScore ?? 0) < filters.minOpportunity) return false;
    if (filters.minFundamental > 0 && (s.fundamentalScore ?? 0) < filters.minFundamental) return false;
    if (filters.minGrowth > 0 && (s.growthScore ?? 0) < filters.minGrowth) return false;
    if (filters.minProfitability > 0 && (s.profitabilityScore ?? 0) < filters.minProfitability) return false;
    if (filters.minValuation > 0 && (s.valuationScore ?? 0) < filters.minValuation) return false;
    if (filters.minHealth > 0 && (s.financialHealthScore ?? 0) < filters.minHealth) return false;
    if (filters.positiveDay && s.change < 0) return false;
    if (filters.minAnalystUpside > 0 && (s.analystUpsidePercent ?? -Infinity) < filters.minAnalystUpside) return false;
    return true;
  });
}

function computeHighlightedColumns(view: ScannerView, filters: ScannerFilterState): Set<string> {
  const cols = new Set<string>();
  if (view === "high-opportunity" || filters.minOpportunity > 0) cols.add("opportunity");
  if (view === "high-fundamentals" || filters.minFundamental > 0) cols.add("fundamental");
  if (view === "high-analyst-upside" || filters.minAnalystUpside > 0) cols.add("upside");
  if (view === "reasonable-valuation" || filters.minValuation > 0) cols.add("valuation");
  if (filters.positiveDay) cols.add("day");
  return cols;
}

function buildFilterSummary(
  view: ScannerView,
  filters: ScannerFilterState,
  search: string,
  sortBy: SortKey
): { parts: string[]; sortLabel: string } {
  const parts: string[] = [];
  if (search.trim()) parts.push(`Searching "${search.trim()}"`);
  if (view === "high-opportunity")     parts.push("High Opportunity (≥ 75)");
  if (view === "high-fundamentals")    parts.push("High Fundamentals (≥ 75)");
  if (view === "high-analyst-upside")  parts.push("High Analyst Upside (≥ 20%)");
  if (view === "reasonable-valuation") parts.push("Reasonable Valuation (≥ 60)");
  if (view === "in-watchlist")         parts.push("In Watchlist");
  if (filters.minOpportunity > 0)     parts.push(`Opportunity ≥ ${filters.minOpportunity}`);
  if (filters.minFundamental > 0)     parts.push(`Fundamental ≥ ${filters.minFundamental}`);
  if (filters.minValuation > 0)       parts.push(`Valuation ≥ ${filters.minValuation}`);
  if (filters.minGrowth > 0)          parts.push(`Growth ≥ ${filters.minGrowth}`);
  if (filters.minProfitability > 0)   parts.push(`Profitability ≥ ${filters.minProfitability}`);
  if (filters.minHealth > 0)          parts.push(`Health ≥ ${filters.minHealth}`);
  if (filters.minAnalystUpside > 0)   parts.push(`Analyst Upside ≥ ${filters.minAnalystUpside}%`);
  if (filters.positiveDay)            parts.push("Positive Day %");
  if (filters.watchlistOnly)          parts.push("Watchlist Only");
  if (filters.alertActiveOnly)        parts.push("Alert Active");
  if (filters.sector !== "all")       parts.push(`Sector: ${filters.sector}`);
  if (filters.indexFilter !== "all")  parts.push(`Index: ${filters.indexFilter}`);
  const sortLabel = sortOptions.find((o) => o.value === sortBy)?.label ?? sortBy;
  return { parts, sortLabel };
}

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

  // Default: High Opportunity + Opportunity Score sort
  const [activeView, setActiveView] = useState<ScannerView>("high-opportunity");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>("opportunity-score");
  const [filters, setFilters] = useState<ScannerFilterState>(DEFAULT_FILTERS);
  const [universeSlug, setUniverseSlug] = useState(selectedUniverseSlug);
  const [advancedOpen, setAdvancedOpen] = useState(false);

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
      result = result.filter((s) => s.symbol.toLowerCase().includes(q) || s.name.toLowerCase().includes(q));
    }
    result = applyIndexFilter(result, filters.indexFilter);
    if (filters.sector !== "all") result = result.filter((s) => s.sector === filters.sector);
    if (filters.watchlistOnly) result = result.filter((s) => s.inWatchlist);
    if (filters.alertActiveOnly) result = result.filter((s) => (alertRulesBySymbol[s.symbol]?.length ?? 0) > 0);
    result = applyScoreThresholds(result, filters);
    result = applyViewFilter(result, alertRulesBySymbol, activeView);
    result = sortStocks(result, sortBy);
    return result;
  }, [stocks, search, filters, activeView, sortBy, alertRulesBySymbol]);

  const highlightedColumns = useMemo(() => computeHighlightedColumns(activeView, filters), [activeView, filters]);
  const { parts: filterSummaryParts, sortLabel } = useMemo(
    () => buildFilterSummary(activeView, filters, search, sortBy),
    [activeView, filters, search, sortBy]
  );

  const advancedActive = hasActiveFilters(filters);

  function clearAllFilters() {
    setSearch("");
    setActiveView("all");
    setFilters(DEFAULT_FILTERS);
    setSortBy("opportunity-score");
    setAdvancedOpen(false);
  }

  function closeDrawer() {
    setIsDrawerClosing(true);
    setTimeout(() => { setSelectedStock(null); setIsDrawerClosing(false); }, CLOSE_ANIMATION_MS);
  }

  function handleSelectStock(stock: HotStock) {
    if (selectedStock?.symbol === stock.symbol) closeDrawer();
    else { setIsDrawerClosing(false); setSelectedStock(stock); }
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
    setLocalWatchlistEntries((prev) => { const next = { ...prev }; delete next[selectedStock.symbol]; return next; });
  }

  const localEntryForSelected = selectedStock ? localWatchlistEntries[selectedStock.symbol] : undefined;

  const orderedUniverses = useMemo(() => {
    const bySlug = new Map(universes.map((u) => [u.slug, u]));
    const ordered: ScannerUniverse[] = [];
    for (const slug of UNIVERSE_DISPLAY_ORDER) { const u = bySlug.get(slug); if (u) ordered.push(u); }
    for (const u of universes) { if (!UNIVERSE_DISPLAY_ORDER.includes(u.slug)) ordered.push(u); }
    return ordered;
  }, [universes]);

  const isFiltered = advancedActive || search.trim() !== "" || activeView !== "all";

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
              if (!u.hasData) {
                return (
                  <div key={u.slug} title="Coming soon." className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border border-slate-800/60 text-slate-600 bg-slate-900/40 cursor-not-allowed select-none">
                    <Lock size={10} />{u.name}<span className="text-[10px] text-slate-700">Coming soon</span>
                  </div>
                );
              }
              return (
                <button key={u.slug} onClick={() => handleUniverseChange(u.slug)}
                  className={`px-3 py-1.5 rounded-lg text-xs border transition-colors ${isActive ? "bg-emerald-500/10 border-emerald-600/50 text-emerald-300 font-medium" : "bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-slate-300"}`}>
                  {u.name}
                </button>
              );
            })}
          </div>
          <span className="text-xs text-slate-600 ml-1">{stocks.length} stocks</span>
        </div>
      )}

      {/* Row 1: Quick filter pills + Sort + Count */}
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 mb-3">
        <ScannerViewPills activeView={activeView} onViewChange={setActiveView} />
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1.5">
            <ArrowUpDown size={12} className="text-slate-500 shrink-0" />
            <span className="text-xs text-slate-500 whitespace-nowrap">Sort</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortKey)}
              style={{ colorScheme: "dark" }}
              className="bg-slate-800/80 border border-slate-700/60 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-emerald-600/60 transition-colors cursor-pointer"
            >
              {sortOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <span className="text-xs text-slate-600 whitespace-nowrap">
            {filteredStocks.length === stocks.length
              ? `${stocks.length} stocks`
              : `${filteredStocks.length} / ${stocks.length}`}
          </span>
        </div>
      </div>

      {/* Row 2: Search + Advanced Filters toggle */}
      <div className="flex items-center gap-2 mb-3">
        {/* Search */}
        <div className="flex-1 min-w-0">
          <ScannerControls search={search} onSearchChange={setSearch} />
        </div>

        {/* Advanced Filters toggle */}
        <button
          onClick={() => setAdvancedOpen((v) => !v)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs border transition-colors shrink-0 ${
            advancedActive
              ? "bg-emerald-500/10 border-emerald-600/50 text-emerald-300"
              : advancedOpen
              ? "bg-slate-700/60 border-slate-600/60 text-slate-300"
              : "bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-slate-300 hover:border-slate-600"
          }`}
        >
          <SlidersHorizontal size={12} />
          <span>Filters</span>
          {advancedActive && (
            <span className="bg-emerald-600/30 text-emerald-300 rounded-full px-1.5 py-0.5 text-[9px] font-semibold leading-none">
              ON
            </span>
          )}
          {advancedOpen ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
        </button>

        {/* Clear — only when something is active */}
        {isFiltered && (
          <button
            onClick={clearAllFilters}
            className="flex items-center gap-1 px-2 py-2 rounded-lg text-xs text-slate-500 hover:text-slate-300 border border-transparent hover:border-slate-700/60 transition-colors shrink-0"
            title="Clear all filters and reset"
          >
            <X size={12} />
          </button>
        )}
      </div>

      {/* Advanced Filters panel (controlled) */}
      <ScannerFilters
        filters={filters}
        onFilterChange={setFilters}
        availableSectors={availableSectors}
        isOpen={advancedOpen}
      />

      {/* Active filter + sort summary */}
      <div className="flex items-start gap-2 mb-3 px-3 py-2 bg-slate-800/30 border border-slate-800/60 rounded-lg">
        <Filter size={11} className="text-slate-600 mt-0.5 shrink-0" />
        <p className="text-xs text-slate-500">
          {filterSummaryParts.length > 0 ? (
            <>
              <span className="text-slate-400">{filterSummaryParts.join(" · ")}</span>
              <span className="text-slate-600 mx-1.5">—</span>
            </>
          ) : null}
          <>sorted by <span className="text-slate-400">{sortLabel}</span></>
          {highlightedColumns.size > 0 && (
            <span className="text-amber-500/50 ml-1.5">· highlighted column header shows filtered data</span>
          )}
        </p>
      </div>

      {/* Desktop table */}
      <ScannerTable
        stocks={filteredStocks}
        selectedSymbol={isDrawerClosing ? null : (selectedStock?.symbol ?? null)}
        alertRulesBySymbol={alertRulesBySymbol}
        onSelectStock={handleSelectStock}
        highlightedColumns={highlightedColumns}
      />

      {/* Mobile cards */}
      {filteredStocks.length > 0 && (
        <div className="md:hidden flex flex-col gap-3">
          {filteredStocks.map((stock) => (
            <MobileScannerCard key={stock.symbol} stock={stock} alertRulesBySymbol={alertRulesBySymbol} onSelectStock={handleSelectStock} />
          ))}
        </div>
      )}

      {/* Empty states */}
      {filteredStocks.length === 0 && stocks.length > 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Radar size={40} className="text-slate-700 mb-4" />
          <p className="text-slate-400 font-medium mb-1">No stocks match your filters.</p>
          <p className="text-sm text-slate-600 mb-4">Try lowering the score threshold, clearing filters, or selecting All Stocks.</p>
          {isFiltered && (
            <button onClick={clearAllFilters} className="text-xs text-emerald-400 hover:text-emerald-300 border border-emerald-800/50 px-3 py-1.5 rounded-lg transition-colors">
              Reset filters
            </button>
          )}
        </div>
      )}

      {stocks.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Radar size={40} className="text-slate-700 mb-4" />
          <p className="text-slate-400 font-medium mb-1">No scanner data available yet.</p>
          <p className="text-sm text-slate-600">Run Market Data Sync and Calculate Fundamental Scores from Admin Sync.</p>
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
