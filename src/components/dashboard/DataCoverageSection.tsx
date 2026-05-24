import type { DashboardSummary, DashboardFreshness } from "@/src/lib/data/dashboard";

function CoverageBar({ label, count, total }: { label: string; count: number; total: number }) {
  const covered = Math.min(count, total);
  const displayPct = total > 0 ? Math.round((covered / total) * 100) : 0;
  const extra = count > total ? count - total : 0;
  const barColor =
    displayPct >= 95 ? "bg-emerald-500" : displayPct >= 70 ? "bg-amber-500" : "bg-red-500";

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-3">
        <span className="text-slate-400 text-xs w-24 shrink-0">{label}</span>
        <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
          <div className={`h-full rounded-full ${barColor}`} style={{ width: `${displayPct}%` }} />
        </div>
        <span className="text-slate-300 text-xs w-20 text-right shrink-0">
          {covered} / {total}
          <span className="text-slate-500 ml-1">({displayPct}%)</span>
        </span>
      </div>
      {extra > 0 && (
        <p className="text-slate-600 text-xs pl-[6.5rem]">
          +{extra} row{extra > 1 ? "s" : ""} outside selected universe
        </p>
      )}
    </div>
  );
}

interface DataCoverageSectionProps {
  summary: DashboardSummary;
  freshness: DashboardFreshness;
}

export default function DataCoverageSection({ summary, freshness: _ }: DataCoverageSectionProps) {
  const total = summary.activeNasdaq100 > 0 ? summary.activeNasdaq100 : summary.totalStocks;

  return (
    <div className="bg-[#111318] border border-slate-800 rounded-xl p-5 mb-5">
      <h2 className="text-white font-semibold text-sm mb-4">Data Coverage</h2>
      <div className="flex flex-col gap-3">
        <CoverageBar label="Quotes" count={summary.withQuotes} total={total} />
        <CoverageBar label="Metrics" count={summary.withMetrics} total={total} />
        <CoverageBar label="Scores" count={summary.withScores} total={total} />
        <CoverageBar label="Scanner Ready" count={summary.scannerReadyStocks} total={total} />
      </div>
    </div>
  );
}
