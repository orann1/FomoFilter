import { Search } from "lucide-react";

export type SortKey =
  | "opportunity-score"
  | "fundamental-score"
  | "analyst-upside"
  | "valuation-score"
  | "risk-score"
  | "daily-change"
  | "symbol";

export const sortOptions: { value: SortKey; label: string }[] = [
  { value: "opportunity-score", label: "Opportunity Score" },
  { value: "fundamental-score", label: "Fundamental Score" },
  { value: "analyst-upside", label: "Analyst Upside" },
  { value: "valuation-score", label: "Valuation Score" },
  { value: "risk-score", label: "Stability Score" },
  { value: "daily-change", label: "Price Change %" },
  { value: "symbol", label: "Symbol A–Z" },
];

interface ScannerControlsProps {
  search: string;
  onSearchChange: (value: string) => void;
}

export default function ScannerControls({ search, onSearchChange }: ScannerControlsProps) {
  return (
    <div className="relative w-full">
      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
      <input
        type="text"
        placeholder="Search ticker or company..."
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        className="w-full bg-slate-800/60 border border-slate-700/60 rounded-lg pl-8 pr-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-600/60 transition-colors"
      />
    </div>
  );
}
