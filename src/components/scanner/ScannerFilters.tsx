import { SlidersHorizontal, Star, Bell, X } from "lucide-react";

export type IndexFilter = "all" | "sp-500" | "nasdaq-100" | "russell-1000-only";
export type ScoreThreshold = 0 | 50 | 60 | 70 | 80 | 90;

export type AnalystUpsideThreshold = 0 | 10 | 20 | 30 | 50;

export type ScannerFilterState = {
  sector: string;
  indexFilter: IndexFilter;
  watchlistOnly: boolean;
  alertActiveOnly: boolean;
  minOpportunity: ScoreThreshold;
  minFundamental: ScoreThreshold;
  minGrowth: ScoreThreshold;
  minProfitability: ScoreThreshold;
  minValuation: ScoreThreshold;
  minHealth: ScoreThreshold;
  positiveDay: boolean;
  minAnalystUpside: AnalystUpsideThreshold;
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

const analystUpsideOptions: { value: AnalystUpsideThreshold; label: string }[] = [
  { value: 0, label: "Any" },
  { value: 10, label: "10%+" },
  { value: 20, label: "20%+" },
  { value: 30, label: "30%+" },
  { value: 50, label: "50%+" },
];

const thresholdOptions: { value: ScoreThreshold; label: string }[] = [
  { value: 0, label: "Any" },
  { value: 50, label: "50+" },
  { value: 60, label: "60+" },
  { value: 70, label: "70+" },
  { value: 80, label: "80+" },
  { value: 90, label: "90+" },
];

export function hasActiveFilters(filters: ScannerFilterState): boolean {
  return (
    filters.sector !== "all" ||
    filters.indexFilter !== "all" ||
    filters.watchlistOnly ||
    filters.alertActiveOnly ||
    filters.minOpportunity > 0 ||
    filters.minFundamental > 0 ||
    filters.minGrowth > 0 ||
    filters.minProfitability > 0 ||
    filters.minValuation > 0 ||
    filters.minHealth > 0 ||
    filters.positiveDay ||
    filters.minAnalystUpside > 0
  );
}

export const DEFAULT_FILTERS: ScannerFilterState = {
  sector: "all",
  indexFilter: "all",
  watchlistOnly: false,
  alertActiveOnly: false,
  minOpportunity: 0,
  minFundamental: 0,
  minGrowth: 0,
  minProfitability: 0,
  minValuation: 0,
  minHealth: 0,
  positiveDay: false,
  minAnalystUpside: 0,
};

function ThresholdSelect({
  label,
  value,
  onChange,
}: {
  label: string;
  value: ScoreThreshold;
  onChange: (v: ScoreThreshold) => void;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs text-slate-500 whitespace-nowrap">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(Number(e.target.value) as ScoreThreshold)}
        className={`bg-slate-800/60 border rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-emerald-600/60 transition-colors cursor-pointer ${
          value > 0
            ? "border-emerald-600/50 text-emerald-300"
            : "border-slate-700/60 text-slate-400"
        }`}
      >
        {thresholdOptions.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
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
    <div className="space-y-2 mb-4">
      {/* Row 1: index, sector, watchlist, alert, day% */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1.5 text-slate-500">
          <SlidersHorizontal size={13} />
          <span className="text-xs font-medium">Filters:</span>
        </div>

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

        <button
          onClick={() => update({ positiveDay: !filters.positiveDay })}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs border transition-colors ${
            filters.positiveDay
              ? "bg-emerald-500/10 border-emerald-700/50 text-emerald-400"
              : "bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-slate-300"
          }`}
        >
          Positive Day %
        </button>

        {active && (
          <button
            onClick={() => onFilterChange(DEFAULT_FILTERS)}
            className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs text-slate-500 hover:text-slate-300 transition-colors"
          >
            <X size={11} />
            Clear
          </button>
        )}
      </div>

      {/* Row 2: score thresholds */}
      <div className="flex flex-wrap items-center gap-3 pl-[calc(13px+0.375rem+0.5rem)]">
        <ThresholdSelect label="Min Opp." value={filters.minOpportunity} onChange={(v) => update({ minOpportunity: v })} />
        <ThresholdSelect label="Min Fund." value={filters.minFundamental} onChange={(v) => update({ minFundamental: v })} />
        <ThresholdSelect label="Min Growth" value={filters.minGrowth} onChange={(v) => update({ minGrowth: v })} />
        <ThresholdSelect label="Min Profit." value={filters.minProfitability} onChange={(v) => update({ minProfitability: v })} />
        <ThresholdSelect label="Min Valuat." value={filters.minValuation} onChange={(v) => update({ minValuation: v })} />
        <ThresholdSelect label="Min Health" value={filters.minHealth} onChange={(v) => update({ minHealth: v })} />

        {/* Analyst Upside filter */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-slate-500 whitespace-nowrap">Min Upside</span>
          <select
            value={filters.minAnalystUpside}
            onChange={(e) => update({ minAnalystUpside: Number(e.target.value) as AnalystUpsideThreshold })}
            className={`bg-slate-800/60 border rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-emerald-600/60 transition-colors cursor-pointer ${
              filters.minAnalystUpside > 0
                ? "border-emerald-600/50 text-emerald-300"
                : "border-slate-700/60 text-slate-400"
            }`}
          >
            {analystUpsideOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
