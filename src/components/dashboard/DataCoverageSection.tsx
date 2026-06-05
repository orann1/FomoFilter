import { RefreshCw, Calculator, CheckCircle } from "lucide-react";
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

function MiniCoverageBar({ label, pct }: { label: string; pct: number }) {
  const barColor = pct >= 95 ? "bg-emerald-500" : pct >= 70 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="flex items-center gap-2">
      <span className="text-slate-500 text-xs w-20 shrink-0">{label}</span>
      <div className="flex-1 h-1 bg-slate-700 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-slate-400 text-xs w-8 text-right shrink-0">{pct}%</span>
    </div>
  );
}

interface DataCoverageSectionProps {
  summary: DashboardSummary;
  freshness: DashboardFreshness;
}

export default function DataCoverageSection({ summary, freshness }: DataCoverageSectionProps) {
  const total = summary.activeUniverseStocks > 0 ? summary.activeUniverseStocks : summary.totalStocks;
  const scorePct = total > 0 ? Math.round((summary.withScores / total) * 100) : 0;
  const metricPct = total > 0 ? Math.round((summary.withMetrics / total) * 100) : 0;
  const scannerReadyPct = total > 0 ? Math.round((summary.scannerReadyStocks / total) * 100) : 0;

  return (
    <div className="bg-[#111318] border border-slate-800 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <CheckCircle size={13} className="text-slate-400" />
        <h2 className="text-white font-semibold text-sm">Data Health</h2>
      </div>

      <div className="flex flex-col gap-1.5 mb-3">
        <MiniCoverageBar label="Scanner Ready" pct={scannerReadyPct} />
        <MiniCoverageBar label="Scores" pct={scorePct} />
        <MiniCoverageBar label="Metrics" pct={metricPct} />
      </div>

      <div className="border-t border-slate-800/60 pt-3 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <RefreshCw size={11} className="text-slate-500" />
            <span className="text-slate-500 text-xs">Last Market Sync</span>
          </div>
          <span className="text-slate-300 text-xs">{formatSyncDate(freshness.lastMarketDataSyncAt)}</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Calculator size={11} className="text-slate-500" />
            <span className="text-slate-500 text-xs">Last Score Calc</span>
          </div>
          <span className="text-slate-300 text-xs">{formatSyncDate(freshness.lastScoreCalculationAt)}</span>
        </div>
      </div>
    </div>
  );
}
