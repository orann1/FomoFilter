import { SlidersHorizontal, Star, Bell, X } from "lucide-react";
import type { RiskLevel } from "@/src/lib/mock-data";

export type ScannerFilterState = {
  sector: string;
  risk: string;
  setup: string;
  watchlistOnly: boolean;
  alertActiveOnly: boolean;
};

interface ScannerFiltersProps {
  filters: ScannerFilterState;
  onFilterChange: (filters: ScannerFilterState) => void;
  availableSectors: string[];
  availableSetups: string[];
}

const riskOptions: { value: string; label: string }[] = [
  { value: "all", label: "All Risk" },
  { value: "LOW", label: "Low" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HIGH", label: "High" },
  { value: "EXTREME", label: "Extreme" },
];

const riskColors: Record<string, string> = {
  LOW: "text-emerald-400",
  MEDIUM: "text-amber-400",
  HIGH: "text-orange-400",
  EXTREME: "text-red-400",
};

export function hasActiveFilters(filters: ScannerFilterState): boolean {
  return (
    filters.sector !== "all" ||
    filters.risk !== "all" ||
    filters.setup !== "all" ||
    filters.watchlistOnly ||
    filters.alertActiveOnly
  );
}

export default function ScannerFilters({
  filters,
  onFilterChange,
  availableSectors,
  availableSetups,
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

      {/* Risk */}
      <select
        value={filters.risk}
        onChange={(e) => update({ risk: e.target.value })}
        className={`bg-slate-800/60 border rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-emerald-600/60 transition-colors cursor-pointer ${
          filters.risk !== "all"
            ? "border-emerald-600/50 text-emerald-300"
            : "border-slate-700/60 text-slate-400"
        }`}
      >
        {riskOptions.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>

      {/* Setup */}
      <select
        value={filters.setup}
        onChange={(e) => update({ setup: e.target.value })}
        className={`bg-slate-800/60 border rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-emerald-600/60 transition-colors cursor-pointer ${
          filters.setup !== "all"
            ? "border-emerald-600/50 text-emerald-300"
            : "border-slate-700/60 text-slate-400"
        }`}
      >
        <option value="all">All Setups</option>
        {availableSetups.map((s) => (
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
              risk: "all",
              setup: "all",
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
