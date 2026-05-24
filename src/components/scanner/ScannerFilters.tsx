import { SlidersHorizontal, Star, Bell, X } from "lucide-react";

export type IndexFilter = "all" | "sp-500" | "nasdaq-100" | "russell-1000-only";

export type ScannerFilterState = {
  sector: string;
  indexFilter: IndexFilter;
  watchlistOnly: boolean;
  alertActiveOnly: boolean;
};

interface ScannerFiltersProps {
  filters: ScannerFilterState;
  onFilterChange: (filters: ScannerFilterState) => void;
  availableSectors: string[];
}

const indexOptions: { value: IndexFilter; label: string }[] = [
  { value: "all", label: "All Indexes" },
  { value: "sp-500", label: "S&P 500" },
  { value: "nasdaq-100", label: "Nasdaq 100" },
  { value: "russell-1000-only", label: "Russell 1000 Only" },
];

export function hasActiveFilters(filters: ScannerFilterState): boolean {
  return (
    filters.sector !== "all" ||
    filters.indexFilter !== "all" ||
    filters.watchlistOnly ||
    filters.alertActiveOnly
  );
}

export default function ScannerFilters({
  filters,
  onFilterChange,
  availableSectors,
}: ScannerFiltersProps) {
  function update(partial: Partial<ScannerFilterState>) {
    onFilterChange({ ...filters, ...partial });
  }

  const active = hasActiveFilters(filters);

  return (
    <div className="flex flex-wrap items-center gap-2 mb-4">
      <div className="flex items-center gap-1.5 text-slate-500">
        <SlidersHorizontal size={13} />
        <span className="text-xs font-medium">Filters:</span>
      </div>

      {/* Index filter */}
      <select
        value={filters.indexFilter}
        onChange={(e) => update({ indexFilter: e.target.value as IndexFilter })}
        className={`bg-slate-800/60 border rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-emerald-600/60 transition-colors cursor-pointer ${
          filters.indexFilter !== "all"
            ? "border-emerald-600/50 text-emerald-300"
            : "border-slate-700/60 text-slate-400"
        }`}
      >
        {indexOptions.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>

      {/* Sector */}
      <select
        value={filters.sector}
        onChange={(e) => update({ sector: e.target.value })}
        className={`bg-slate-800/60 border rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-emerald-600/60 transition-colors cursor-pointer ${
          filters.sector !== "all"
            ? "border-emerald-600/50 text-emerald-300"
            : "border-slate-700/60 text-slate-400"
        }`}
      >
        <option value="all">All Sectors</option>
        {availableSectors.map((s) => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>

      {/* Watchlist only toggle */}
      <button
        onClick={() => update({ watchlistOnly: !filters.watchlistOnly })}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs border transition-colors ${
          filters.watchlistOnly
            ? "bg-amber-500/10 border-amber-700/50 text-amber-400"
            : "bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-slate-300"
        }`}
      >
        <Star size={11} className={filters.watchlistOnly ? "fill-amber-400 text-amber-400" : ""} />
        Watchlist
      </button>

      {/* Alert active only toggle */}
      <button
        onClick={() => update({ alertActiveOnly: !filters.alertActiveOnly })}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs border transition-colors ${
          filters.alertActiveOnly
            ? "bg-amber-500/10 border-amber-700/50 text-amber-400"
            : "bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-slate-300"
        }`}
      >
        <Bell size={11} />
        Alert Active
      </button>

      {/* Clear filters */}
      {active && (
        <button
          onClick={() =>
            onFilterChange({
              sector: "all",
              indexFilter: "all",
              watchlistOnly: false,
              alertActiveOnly: false,
            })
          }
          className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs text-slate-500 hover:text-slate-300 transition-colors"
        >
          <X size={11} />
          Clear
        </button>
      )}
    </div>
  );
}
