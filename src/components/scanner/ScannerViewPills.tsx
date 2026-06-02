export type ScannerView =
  | "all"
  | "high-opportunity"
  | "high-fundamentals"
  | "high-analyst-upside"
  | "reasonable-valuation"
  | "in-watchlist";

interface ViewPill {
  key: ScannerView;
  label: string;
  icon: string;
  tooltip?: string;
}

const views: ViewPill[] = [
  { key: "all", label: "All Stocks", icon: "◈" },
  { key: "high-opportunity", label: "High Opportunity", icon: "🎯", tooltip: "Opportunity Score ≥ 75" },
  { key: "high-fundamentals", label: "High Fundamentals", icon: "📊", tooltip: "Fundamental Score ≥ 75" },
  { key: "high-analyst-upside", label: "High Analyst Upside", icon: "🧠", tooltip: "Analyst Upside ≥ 20%" },
  { key: "reasonable-valuation", label: "Reasonable Valuation", icon: "⚖️", tooltip: "Valuation Score ≥ 60" },
  { key: "in-watchlist", label: "In Watchlist", icon: "⭐" },
];

interface ScannerViewPillsProps {
  activeView: ScannerView;
  onViewChange: (view: ScannerView) => void;
}

export default function ScannerViewPills({ activeView, onViewChange }: ScannerViewPillsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {views.map((view) => (
        <button
          key={view.key}
          onClick={() => onViewChange(view.key)}
          title={view.tooltip}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors whitespace-nowrap ${
            activeView === view.key
              ? "bg-emerald-600/20 border-emerald-600/50 text-emerald-300"
              : "bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-slate-200 hover:border-slate-600"
          }`}
        >
          <span>{view.icon}</span>
          {view.label}
        </button>
      ))}
    </div>
  );
}
