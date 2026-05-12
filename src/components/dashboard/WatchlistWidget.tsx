import { Star } from "lucide-react";
import { mockWatchlist, type WatchStatus } from "@/src/lib/mock-data";
import { formatCurrency, formatPercent } from "@/src/lib/formatters";

const statusColors: Record<WatchStatus, string> = {
  WATCHING: "text-blue-400 bg-blue-500/10 border-blue-800/50",
  WAITING_FOR_PULLBACK: "text-amber-400 bg-amber-500/10 border-amber-800/50",
  READY_TO_BUY: "text-emerald-400 bg-emerald-500/10 border-emerald-800/50",
  HOLDING: "text-purple-400 bg-purple-500/10 border-purple-800/50",
  AVOIDING: "text-red-400 bg-red-500/10 border-red-800/50",
  ARCHIVED: "text-slate-400 bg-slate-500/10 border-slate-700/50",
};

const statusLabel: Record<WatchStatus, string> = {
  WATCHING: "Watching",
  WAITING_FOR_PULLBACK: "Pullback",
  READY_TO_BUY: "Ready",
  HOLDING: "Holding",
  AVOIDING: "Avoiding",
  ARCHIVED: "Archived",
};

export default function WatchlistWidget() {
  return (
    <div className="bg-[#111318] border border-slate-800 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-4 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Star size={14} className="text-amber-400" />
          <h2 className="text-white font-semibold text-sm">My Watchlist</h2>
        </div>
        <span className="text-xs text-slate-500">{mockWatchlist.length} stocks</span>
      </div>
      <div className="divide-y divide-slate-800/60">
        {mockWatchlist.map((item) => (
          <div key={item.symbol} className="px-4 py-3 hover:bg-slate-800/20 transition-colors">
            <div className="flex items-start justify-between mb-1.5">
              <div>
                <span className="text-white font-semibold text-sm">{item.symbol}</span>
                <p className="text-slate-500 text-xs">{item.name}</p>
              </div>
              <div className="text-right">
                <p className="text-white text-sm font-medium">{formatCurrency(item.price)}</p>
                <p className={`text-xs font-medium ${item.change >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                  {formatPercent(item.change)}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`text-xs border px-1.5 py-0.5 rounded-full font-medium ${statusColors[item.status]}`}>
                  {statusLabel[item.status]}
                </span>
                <span className="text-xs text-slate-500">
                  Entry {formatCurrency(item.entryZoneLow)}–{formatCurrency(item.entryZoneHigh)}
                </span>
              </div>
              <span className="text-xs text-slate-500">T: {formatCurrency(item.target)}</span>
            </div>
            {item.notes && (
              <p className="text-xs text-slate-500 mt-1 italic">{item.notes}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
