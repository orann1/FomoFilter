import { ScanLine, TrendingUp, Award, Target } from "lucide-react";
import type { DashboardSummary } from "@/src/lib/data/dashboard";

interface CardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  accent: "emerald" | "blue" | "amber" | "purple";
}

function OpportunityCard({ icon, label, value, sub, accent }: CardProps) {
  const accentMap = {
    emerald: { bg: "bg-emerald-500/10", iconColor: "text-emerald-400", valueColor: "text-emerald-400" },
    blue: { bg: "bg-blue-500/10", iconColor: "text-blue-400", valueColor: "text-blue-400" },
    amber: { bg: "bg-amber-500/10", iconColor: "text-amber-400", valueColor: "text-amber-400" },
    purple: { bg: "bg-purple-500/10", iconColor: "text-purple-400", valueColor: "text-purple-400" },
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
}

export default function DashboardSummaryCards({ summary }: DashboardSummaryCardsProps) {
  const totalDisplay = summary.activeNasdaq100 > 0 ? summary.activeNasdaq100 : summary.totalStocks;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
      <OpportunityCard
        icon={<ScanLine size={16} />}
        label="Scanner Ready"
        value={String(summary.scannerReadyStocks)}
        sub={`of ${totalDisplay} total stocks`}
        accent="emerald"
      />
      <OpportunityCard
        icon={<Award size={16} />}
        label="High Opportunity"
        value={String(summary.stocksAboveOpportunity75)}
        sub="Opportunity score ≥ 75"
        accent="amber"
      />
      <OpportunityCard
        icon={<Target size={16} />}
        label="Avg Opportunity"
        value={summary.averageOpportunityScore != null ? String(summary.averageOpportunityScore) : "N/A"}
        sub="Opportunity score average"
        accent="blue"
      />
      <OpportunityCard
        icon={<TrendingUp size={16} />}
        label="Avg Fundamental"
        value={summary.averageFundamentalScore != null ? String(summary.averageFundamentalScore) : "N/A"}
        sub="Fundamental score average"
        accent="purple"
      />
    </div>
  );
}
