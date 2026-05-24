import {
  Database,
  ScanLine,
  BarChart3,
  Target,
  TrendingUp,
  Award,
  RefreshCw,
  Calculator,
} from "lucide-react";
import type { DashboardSummary, DashboardFreshness } from "@/src/lib/data/dashboard";

function formatSyncDate(isoStr: string | null): string {
  if (!isoStr) return "N/A";
  const d = new Date(isoStr);
  return d.toLocaleString("en-US", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

interface CardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  accent: "emerald" | "blue" | "amber" | "purple" | "slate";
}

function SummaryCard({ icon, label, value, sub, accent }: CardProps) {
  const accentMap = {
    emerald: { bg: "bg-emerald-500/10", iconColor: "text-emerald-400", valueColor: "text-emerald-400" },
    blue: { bg: "bg-blue-500/10", iconColor: "text-blue-400", valueColor: "text-blue-400" },
    amber: { bg: "bg-amber-500/10", iconColor: "text-amber-400", valueColor: "text-amber-400" },
    purple: { bg: "bg-purple-500/10", iconColor: "text-purple-400", valueColor: "text-purple-400" },
    slate: { bg: "bg-slate-700/40", iconColor: "text-slate-400", valueColor: "text-slate-300" },
  };
  const colors = accentMap[accent];

  return (
    <div className="bg-[#111318] border border-slate-800 rounded-xl p-4 flex items-start gap-3">
      <div className={`w-9 h-9 rounded-lg ${colors.bg} flex items-center justify-center shrink-0`}>
        <span className={colors.iconColor}>{icon}</span>
      </div>
      <div className="min-w-0">
        <p className={`text-2xl font-bold ${colors.valueColor} leading-tight`}>{value}</p>
        <p className="text-slate-300 text-sm font-medium leading-tight mt-0.5">{label}</p>
        {sub && <p className="text-slate-500 text-xs mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

interface DashboardSummaryCardsProps {
  summary: DashboardSummary;
  freshness: DashboardFreshness;
}

export default function DashboardSummaryCards({ summary, freshness }: DashboardSummaryCardsProps) {
  const avgScore =
    summary.averageFundamentalScore != null
      ? String(summary.averageFundamentalScore)
      : "N/A";

  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
      <SummaryCard
        icon={<Database size={16} />}
        label="Total Stocks"
        value={String(summary.activeNasdaq100 > 0 ? summary.activeNasdaq100 : summary.totalStocks)}
        sub="Nasdaq 100 active"
        accent="blue"
      />
      <SummaryCard
        icon={<ScanLine size={16} />}
        label="Scanner Ready"
        value={String(summary.scannerReadyStocks)}
        sub="Quote + score"
        accent="emerald"
      />
      <SummaryCard
        icon={<BarChart3 size={16} />}
        label="With Metrics"
        value={String(summary.withMetrics)}
        sub={`${freshness.metricCoveragePercent}% coverage`}
        accent="blue"
      />
      <SummaryCard
        icon={<Target size={16} />}
        label="With Scores"
        value={String(summary.withScores)}
        sub={`${freshness.scoreCoveragePercent}% coverage`}
        accent="emerald"
      />
      <SummaryCard
        icon={<TrendingUp size={16} />}
        label="Avg Fundamental"
        value={avgScore}
        sub="Fundamental score avg"
        accent="purple"
      />
      <SummaryCard
        icon={<Award size={16} />}
        label="Stocks Above 75"
        value={String(summary.stocksAbove75)}
        sub={`${summary.stocksAbove80} above 80`}
        accent="amber"
      />
      <SummaryCard
        icon={<Target size={16} />}
        label="Avg Opportunity"
        value={summary.averageOpportunityScore != null ? String(summary.averageOpportunityScore) : "N/A"}
        sub="Opportunity score avg"
        accent="emerald"
      />
      <SummaryCard
        icon={<Award size={16} />}
        label="High Opportunity"
        value={String(summary.stocksAboveOpportunity75)}
        sub="Opportunity score ≥ 75"
        accent="emerald"
      />
      <SummaryCard
        icon={<RefreshCw size={16} />}
        label="Last Market Sync"
        value={formatSyncDate(freshness.lastMarketDataSyncAt)}
        accent="slate"
      />
      <SummaryCard
        icon={<Calculator size={16} />}
        label="Last Score Calc"
        value={formatSyncDate(freshness.lastScoreCalculationAt)}
        accent="slate"
      />
    </div>
  );
}
