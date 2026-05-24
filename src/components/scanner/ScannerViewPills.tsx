export type ScannerView =
  | "all"
  | "high-opportunity"
  | "high-fundamentals"
  | "high-growth"
  | "high-profitability"
  | "reasonable-valuation"
  | "in-watchlist"
  | "alert-active";

interface ViewPill {
  key: ScannerView;
  label: string;
  icon: string;
  tooltip?: string;
}

interface DisabledPill {
  label: string;
  icon: string;
  tooltip: string;
}

const views: ViewPill[] = [
  { key: "all", label: "All Stocks", icon: "◈" },
  { key: "high-opportunity", label: "High Opportunity", icon: "🎯", tooltip: "Opportunity Score ≥ 75" },
  { key: "high-fundamentals", label: "High Fundamentals", icon: "📊", tooltip: "Fundamental Score ≥ 75" },
  { key: "high-growth", label: "High Growth", icon: "📈", tooltip: "Growth Score ≥ 75" },
  { key: "high-profitability", label: "High Profitability", icon: "💰", tooltip: "Profitability Score ≥ 75" },
  { key: "reasonable-valuation", label: "Reasonable Valuation", icon: "🎯", tooltip: "Valuation Score ≥ 60" },
  { key: "in-watchlist", label: "In Watchlist", icon: "⭐" },
  { key: "alert-active", label: "Alert Active", icon: "🔔" },
];

const disabledViews: DisabledPill[] = [
  { label: "Hot Today", icon: "🔥", tooltip: "Coming soon — requires technical/momentum/news data" },
  { label: "Strong Momentum", icon: "🚀", tooltip: "Coming soon — requires technical/momentum/news data" },
  { label: "Unusual Volume", icon: "🌋", tooltip: "Coming soon — requires technical/momentum/news data" },
  { label: "FOMO Risk", icon: "⚡", tooltip: "Coming soon — requires technical/momentum/news data" },
];

interface ScannerViewPillsProps {
  activeView: ScannerView;
  onViewChange: (view: ScannerView) => void;
}

export default function ScannerViewPills({ activeView, onViewChange }: ScannerViewPillsProps) {
  return (
    <div className="flex flex-wrap gap-2 mb-4">
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

      {disabledViews.map((view) => (
        <div key={view.label} title={view.tooltip} className="cursor-not-allowed">
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border border-slate-800/60 text-slate-600 bg-slate-900/40 whitespace-nowrap select-none">
            <span>{view.icon}</span>
            {view.label}
          </span>
        </div>
      ))}
    </div>
  );
}
