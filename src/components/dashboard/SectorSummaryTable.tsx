import type { DashboardSectorRow } from "@/src/lib/data/dashboard";
import { formatScore } from "@/src/lib/formatters";

interface SectorSummaryTableProps {
  sectors: DashboardSectorRow[];
}

export default function SectorSummaryTable({ sectors }: SectorSummaryTableProps) {
  if (sectors.length === 0) return null;

  return (
    <div className="bg-[#111318] border border-slate-800 rounded-xl overflow-hidden mb-5">
      <div className="px-5 py-4 border-b border-slate-800">
        <h2 className="text-white font-semibold text-sm">Sector Summary</h2>
        <p className="text-slate-500 text-xs mt-0.5">Average Fundamental Score by sector</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800">
              <th className="px-4 py-3 text-left text-xs text-slate-500 font-medium">Sector</th>
              <th className="px-4 py-3 text-center text-xs text-slate-500 font-medium">Stocks</th>
              <th className="px-4 py-3 text-center text-xs text-slate-500 font-medium">Avg Fund.</th>
              <th className="px-4 py-3 text-center text-xs text-slate-500 font-medium">Avg Growth</th>
              <th className="px-4 py-3 text-center text-xs text-slate-500 font-medium">Avg Profit.</th>
              <th className="px-4 py-3 text-left text-xs text-slate-500 font-medium">Top Stock</th>
            </tr>
          </thead>
          <tbody>
            {sectors.map((row) => {
              const fundScore = row.avgFundamentalScore ?? 0;
              const barColor =
                fundScore >= 75
                  ? "bg-emerald-500"
                  : fundScore >= 60
                    ? "bg-teal-500"
                    : fundScore >= 45
                      ? "bg-amber-500"
                      : "bg-slate-600";

              return (
                <tr key={row.sector} className="border-b border-slate-800/60 last:border-0 hover:bg-slate-800/20 transition-colors">
                  <td className="px-4 py-3 text-slate-300 text-sm font-medium">{row.sector}</td>
                  <td className="px-4 py-3 text-center text-slate-400 text-sm">{row.stockCount}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1.5">
                      <span className="text-white text-xs font-semibold w-6 text-right">
                        {formatScore(row.avgFundamentalScore)}
                      </span>
                      <div className="w-14 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${barColor}`}
                          style={{ width: `${fundScore}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center text-slate-400 text-xs">
                    {formatScore(row.avgGrowthScore)}
                  </td>
                  <td className="px-4 py-3 text-center text-slate-400 text-xs">
                    {formatScore(row.avgProfitabilityScore)}
                  </td>
                  <td className="px-4 py-3">
                    {row.topSymbol ? (
                      <span className="text-xs">
                        <span className="text-white font-semibold">{row.topSymbol}</span>
                        <span className="text-slate-500 ml-1">{formatScore(row.topScore)}</span>
                      </span>
                    ) : (
                      <span className="text-slate-500 text-xs">N/A</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
