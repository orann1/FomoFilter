export type ScannerView =
  | "all"
  | "hot-today"
  | "strong-momentum"
  | "best-opportunities"
  | "unusual-volume"
  | "fomo-risk"
  | "in-watchlist"
  | "alert-active";

interface ViewPill {
  key: ScannerView;
  label: string;
  icon: string;
}

const views: ViewPill[] = [
  { key: "all", label: "All Stocks", icon: "◈" },
  { key: "hot-today", label: "Hot Today", icon: "🔥" },
  { key: "strong-momentum", label: "Strong Momentum", icon: "📈" },
  { key: "best-opportunities", label: "Best Opportunities", icon: "🎯" },
  { key: "unusual-volume", label: "Unusual Volume", icon: "🌋" },
  { key: "fomo-risk", label: "FOMO Risk", icon: "⚡" },
  { key: "in-watchlist", label: "In Watchlist", icon: "⭐" },
  { key: "alert-active", label: "Alert Active", icon: "🔔" },
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
