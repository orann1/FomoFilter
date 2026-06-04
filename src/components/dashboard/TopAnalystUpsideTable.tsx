import type { DashboardAnalystRow } from "@/src/lib/data/dashboard";
import { BadgeDollarSign } from "lucide-react";

function ScoreBadge({ value }: { value: number | null }) {
  if (value == null) return <span className="text-slate-600 text-xs">N/A</span>;
  const color =
    value >= 75 ? "text-emerald-300" : value >= 55 ? "text-amber-300" : "text-slate-400";
  return <span className={`text-xs font-semibold tabular-nums ${color}`}>{value}</span>;
}

function RatingBadge({ rating }: { rating: string | null }) {
  if (!rating) return <span className="text-slate-600 text-xs">N/A</span>;
  const cls =
    rating === "Strong Buy" ? "text-emerald-300 font-semibold" :
    rating === "Buy" ? "text-emerald-400" :
    rating === "Hold" ? "text-amber-400" :
    rating === "Sell" ? "text-red-400" :
    rating === "Strong Sell" ? "text-red-300 font-semibold" :
    "text-slate-400";
  return <span className={`text-xs ${cls}`}>{rating}</span>;
}

interface TopAnalystUpsideTableProps {
  stocks: DashboardAnalystRow[];
}

export default function TopAnalystUpsideTable({ stocks }: TopAnalystUpsideTableProps) {
  if (stocks.length === 0) {
    return (
      <div className="bg-[#111318] border border-slate-800 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <BadgeDollarSign size={14} className="text-slate-400" />
          <h2 className="text-sm font-semibold text-slate-200">Top Analyst Upside</h2>
        </div>
        <p className="text-sm text-slate-500">
          No analyst data available yet. Run Analyst Data Sync from Admin Sync.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-[#111318] border border-slate-800 rounded-xl overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-800">
        <BadgeDollarSign size={14} className="text-slate-400" />
        <h2 className="text-sm font-semibold text-slate-200">Top Analyst Upside</h2>
        <span className="text-xs text-slate-500 ml-1">by consensus target</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-800/60">
              <th className="px-4 py-2 text-xs font-semibold text-slate-500">Symbol</th>
              <th className="px-3 py-2 text-xs font-semibold text-slate-500 text-right">Price</th>
              <th className="px-3 py-2 text-xs font-semibold text-slate-500 text-right">Target</th>
              <th className="px-3 py-2 text-xs font-semibold text-slate-500 text-right">Upside</th>
              <th className="px-3 py-2 text-xs font-semibold text-slate-500">Rating</th>
              <th className="px-3 py-2 text-xs font-semibold text-slate-500 text-right">Fundamental</th>
              <th className="px-3 py-2 text-xs font-semibold text-slate-500 text-right">Opportunity</th>
            </tr>
          </thead>
          <tbody>
            {stocks.map((stock) => {
              const upside = stock.analystUpsidePercent;
              const upsideColor =
                upside != null && upside > 0 ? "text-emerald-400" :
                upside != null && upside < 0 ? "text-red-400" :
                "text-slate-400";
              return (
                <tr key={stock.symbol} className="border-b border-slate-800/30 hover:bg-slate-800/30">
                  <td className="px-4 py-2.5">
                    <span className="font-mono font-semibold text-slate-100">{stock.symbol}</span>
                    {stock.sector && (
                      <span className="ml-2 text-xs text-slate-600">{stock.sector}</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <span className="font-mono text-xs text-slate-300">
                      {stock.price != null ? `$${stock.price.toFixed(2)}` : "N/A"}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <span className="font-mono text-xs text-slate-300">
                      {stock.analystTargetPrice != null ? `$${stock.analystTargetPrice.toFixed(2)}` : "N/A"}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <span className={`font-mono text-xs font-semibold ${upsideColor}`}>
                      {upside != null
                        ? `${upside >= 0 ? "+" : ""}${upside.toFixed(1)}%`
                        : "N/A"}
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    <RatingBadge rating={stock.analystRating} />
                    {stock.analystCount != null && (
                      <span className="ml-1 text-[10px] text-slate-600">({stock.analystCount})</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <ScoreBadge value={stock.fundamentalScore} />
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <ScoreBadge value={stock.oppScore} />
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
