import { Star, Bell } from "lucide-react";

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

interface ScannerFiltersProps {
  filters: ScannerFilterState;
  onFilterChange: (filters: ScannerFilterState) => void;
  availableSectors: string[];
  isOpen: boolean;
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

const selectBase =
  "bg-slate-800/80 border border-slate-700/60 rounded-lg px-2 py-1.5 text-xs " +
  "focus:outline-none focus:border-emerald-600/60 transition-colors cursor-pointer";
const selectActive = "border-emerald-600/50 text-emerald-300";
const selectIdle   = "text-slate-400";

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
        style={{ colorScheme: "dark" }}
        className={`${selectBase} ${value > 0 ? selectActive : selectIdle}`}
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
  isOpen,
}: ScannerFiltersProps) {
  if (!isOpen) return null;

  function update(partial: Partial<ScannerFilterState>) {
    onFilterChange({ ...filters, ...partial });
  }

  return (
    <div className="mb-3 p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-4">
      {/* Row 1: Index + Sector + toggles */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={filters.indexFilter}
          onChange={(e) => update({ indexFilter: e.target.value as IndexFilter })}
          style={{ colorScheme: "dark" }}
          className={`${selectBase} ${filters.indexFilter !== "all" ? selectActive : selectIdle}`}
        >
          {indexOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>

        <select
          value={filters.sector}
          onChange={(e) => update({ sector: e.target.value })}
          style={{ colorScheme: "dark" }}
          className={`${selectBase} ${filters.sector !== "all" ? selectActive : selectIdle}`}
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
          Watchlist Only
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
      </div>

      {/* Row 2: Score thresholds */}
      <div className="flex flex-wrap items-center gap-3">
        <ThresholdSelect label="Min Opportunity" value={filters.minOpportunity} onChange={(v) => update({ minOpportunity: v })} />
        <ThresholdSelect label="Min Fundamental" value={filters.minFundamental} onChange={(v) => update({ minFundamental: v })} />
        <ThresholdSelect label="Min Growth"      value={filters.minGrowth}      onChange={(v) => update({ minGrowth: v })} />
        <ThresholdSelect label="Min Profitability" value={filters.minProfitability} onChange={(v) => update({ minProfitability: v })} />
        <ThresholdSelect label="Min Valuation"  value={filters.minValuation}   onChange={(v) => update({ minValuation: v })} />
        <ThresholdSelect label="Min Health"     value={filters.minHealth}      onChange={(v) => update({ minHealth: v })} />

        <div className="flex items-center gap-1.5">
          <span className="text-xs text-slate-500 whitespace-nowrap">Min Analyst Upside</span>
          <select
            value={filters.minAnalystUpside}
            onChange={(e) => update({ minAnalystUpside: Number(e.target.value) as AnalystUpsideThreshold })}
            style={{ colorScheme: "dark" }}
            className={`${selectBase} ${filters.minAnalystUpside > 0 ? selectActive : selectIdle}`}
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
