import { Star, ArrowRight } from "lucide-react";
import Link from "next/link";
import type { DashboardWatchlistItem } from "@/src/lib/data/dashboard";
import { formatCurrency, formatPercent, formatScore } from "@/src/lib/formatters";

const statusColors: Record<string, string> = {
  WATCHING: "text-blue-400 bg-blue-500/10 border-blue-800/50",
  WAITING_FOR_PULLBACK: "text-amber-400 bg-amber-500/10 border-amber-800/50",
  WAITING: "text-amber-400 bg-amber-500/10 border-amber-800/50",
  READY_TO_BUY: "text-emerald-400 bg-emerald-500/10 border-emerald-800/50",
  HOLDING: "text-purple-400 bg-purple-500/10 border-purple-800/50",
  AVOIDING: "text-red-400 bg-red-500/10 border-red-800/50",
  ARCHIVED: "text-slate-400 bg-slate-500/10 border-slate-700/50",
};

const statusLabel: Record<string, string> = {
  WATCHING: "Watching",
  WAITING_FOR_PULLBACK: "Waiting for Pullback",
  WAITING: "Waiting for Pullback",
  READY_TO_BUY: "Ready",
  HOLDING: "Holding",
  AVOIDING: "Avoiding",
  ARCHIVED: "Archived",
};

interface WatchlistWidgetProps {
  watchlistItems: DashboardWatchlistItem[];
}

export default function WatchlistWidget({ watchlistItems }: WatchlistWidgetProps) {
  return (
    <div className="bg-[#111318] border border-slate-800 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-4 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Star size={14} className="text-amber-400" />
          <h2 className="text-white font-semibold text-sm">My Watchlist</h2>
        </div>
        <span className="text-xs text-slate-500">{watchlistItems.length} stocks</span>
      </div>

      {watchlistItems.length === 0 ? (
        <div className="px-4 py-6 text-center">
          <p className="text-slate-500 text-xs">No stocks in watchlist.</p>
          <p className="text-slate-600 text-xs mt-1">
            Add stocks from the{" "}
            <Link href="/scanner" className="text-emerald-400 hover:text-emerald-300">
              Scanner
            </Link>
            .
          </p>
        </div>
      ) : (
        <>
          <div className="divide-y divide-slate-800/60">
            {watchlistItems.map((item) => (
              <div key={item.id} className="px-4 py-3 hover:bg-slate-800/20 transition-colors">
                <div className="flex items-start justify-between mb-1.5">
                  <div>
                    <span className="text-white font-semibold text-sm">{item.symbol}</span>
                    <p className="text-slate-500 text-xs">{item.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-white text-sm font-medium">
                      {item.price != null ? formatCurrency(item.price) : "N/A"}
                    </p>
                    <p
                      className={`text-xs font-medium ${
                        item.changePercent == null
                          ? "text-slate-500"
                          : item.changePercent >= 0
                            ? "text-emerald-400"
                            : "text-red-400"
                      }`}
                    >
                      {item.changePercent != null ? formatPercent(item.changePercent) : "N/A"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between flex-wrap gap-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`text-xs border px-1.5 py-0.5 rounded-full font-medium ${
                        statusColors[item.status] ?? statusColors["WATCHING"]
                      }`}
                    >
                      {statusLabel[item.status] ?? item.status}
                    </span>
                    {item.oppScore != null && (
                      <span className="text-xs text-slate-500">
                        Opp: <span className="text-emerald-300 font-semibold">{formatScore(item.oppScore)}</span>
                      </span>
                    )}
                    {item.fundamentalScore != null && (
                      <span className="text-xs text-slate-500">
                        Fund: <span className="text-slate-300">{formatScore(item.fundamentalScore)}</span>
                      </span>
                    )}
                  </div>
                  {item.target != null && item.target > 0 && (
                    <span className="text-xs text-slate-500">T: {formatCurrency(item.target)}</span>
                  )}
                </div>
                {item.notes && (
                  <p className="text-xs text-slate-500 mt-1 italic">{item.notes}</p>
                )}
              </div>
            ))}
          </div>
          <div className="px-4 py-3 border-t border-slate-800/60">
            <Link
              href="/scanner"
              className="flex items-center gap-1 text-xs text-slate-400 hover:text-emerald-400 transition-colors"
            >
              Review watchlist in Scanner <ArrowRight size={12} />
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
