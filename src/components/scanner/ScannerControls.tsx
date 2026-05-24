import { Search, ArrowUpDown } from "lucide-react";

export type SortKey =
  | "fundamental-score"
  | "growth-score"
  | "profitability-score"
  | "valuation-score"
  | "health-score"
  | "daily-change"
  | "market-cap"
  | "symbol";

const sortOptions: { value: SortKey; label: string }[] = [
  { value: "fundamental-score", label: "Fundamental Score" },
  { value: "growth-score", label: "Growth Score" },
  { value: "profitability-score", label: "Profitability Score" },
  { value: "valuation-score", label: "Valuation Score" },
  { value: "health-score", label: "Financial Health Score" },
  { value: "daily-change", label: "Day % Change" },
  { value: "market-cap", label: "Market Cap" },
  { value: "symbol", label: "Symbol (A–Z)" },
];

interface ScannerControlsProps {
  search: string;
  onSearchChange: (value: string) => void;
  sortBy: SortKey;
  onSortChange: (value: SortKey) => void;
  resultCount: number;
  totalCount: number;
}

export default function ScannerControls({
  search,
  onSearchChange,
  sortBy,
  onSortChange,
  resultCount,
  totalCount,
}: ScannerControlsProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 mb-4">
      {/* Search */}
      <div className="relative flex-1">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
        <input
          type="text"
          placeholder="Search ticker or company..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full bg-slate-800/60 border border-slate-700/60 rounded-lg pl-8 pr-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-600/60 transition-colors"
        />
      </div>

      {/* Sort */}
      <div className="flex items-center gap-2 shrink-0">
        <ArrowUpDown size={14} className="text-slate-500 shrink-0" />
        <select
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value as SortKey)}
          className="bg-slate-800/60 border border-slate-700/60 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-emerald-600/60 transition-colors cursor-pointer"
        >
          {sortOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Result count */}
      <div className="flex items-center shrink-0">
        <span className="text-xs text-slate-500">
          {resultCount === totalCount ? (
            <>{totalCount} stocks</>
          ) : (
            <>{resultCount} of {totalCount} stocks</>
          )}
        </span>
      </div>
    </div>
  );
}
