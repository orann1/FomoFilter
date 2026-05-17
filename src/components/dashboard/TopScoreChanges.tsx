import { TrendingUp } from "lucide-react";
import { type ScoreChange } from "@/src/lib/mock-data";

interface TopScoreChangesProps {
  scoreChanges: ScoreChange[];
}

export default function TopScoreChanges({ scoreChanges }: TopScoreChangesProps) {
  return (
    <div className="bg-[#111318] border border-slate-800 rounded-xl overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-4 border-b border-slate-800">
        <TrendingUp size={14} className="text-orange-400" />
        <h2 className="text-white font-semibold text-sm">Top Score Changes</h2>
      </div>
      <div className="divide-y divide-slate-800/60">
        {scoreChanges.map((item) => (
          <div key={item.symbol} className="px-4 py-3 hover:bg-slate-800/20 transition-colors">
            <div className="flex items-center justify-between mb-1">
              <span className="text-white font-semibold text-sm">{item.symbol}</span>
              <span className="text-xs text-slate-500">{item.reason}</span>
            </div>
            <div className="flex gap-4">
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-500">Hot</span>
                <span className="text-xs font-semibold text-orange-300">{item.hotScore}</span>
                <span className={`text-xs font-medium ${item.hotScoreChange >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                  {item.hotScoreChange >= 0 ? "+" : ""}{item.hotScoreChange}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-500">Opp</span>
                <span className="text-xs font-semibold text-emerald-300">{item.oppScore}</span>
                <span className={`text-xs font-medium ${item.oppScoreChange >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                  {item.oppScoreChange >= 0 ? "+" : ""}{item.oppScoreChange}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
