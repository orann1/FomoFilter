import { ArrowRight, Zap } from "lucide-react";
import Link from "next/link";
import type { DashboardStockRow } from "@/src/lib/data/dashboard";
import { formatCurrency, formatPercent, formatScore } from "@/src/lib/formatters";

function ScoreBar({ value, color = "emerald" }: { value: number | null; color?: "emerald" | "blue" }) {
  if (value == null) return <span className="text-slate-500 text-xs">N/A</span>;
  const barColor =
    color === "blue"
      ? value >= 80 ? "bg-blue-400" : value >= 65 ? "bg-blue-500" : value >= 50 ? "bg-blue-600" : "bg-slate-600"
      : value >= 80 ? "bg-emerald-500" : value >= 65 ? "bg-teal-500" : value >= 50 ? "bg-amber-500" : "bg-slate-600";
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-white text-xs font-semibold w-6 text-right">{value}</span>
      <div className="w-10 h-1.5 bg-slate-700 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${barColor}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

interface TopOpportunityStocksTableProps {
  stocks: DashboardStockRow[];
}

export default function TopOpportunityStocksTable({ stocks }: TopOpportunityStocksTableProps) {
  if (stocks.length === 0) {
    return (
      <div className="bg-[#111318] border border-slate-800 rounded-xl p-8 text-center mb-5">
        <Zap size={20} className="text-slate-600 mx-auto mb-2" />
        <p className="text-slate-400 text-sm">No opportunity data yet.</p>
        <p className="text-slate-500 text-xs mt-1">
          Run Market Data Sync and Calculate Fundamental Scores in Admin.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-[#111318] border border-slate-800 rounded-xl overflow-hidden mb-5">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Zap size={14} className="text-emerald-400" />
          <div>
            <h2 className="text-white font-semibold text-sm">Top Opportunity Stocks</h2>
            <p className="text-slate-500 text-xs mt-0.5">Sorted by Opportunity Score — top {stocks.length}</p>
          </div>
        </div>
        <Link
          href="/scanner"
          className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
        >
          View all in Scanner <ArrowRight size={12} />
        </Link>
      </div>

      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800">
              <th className="px-4 py-3 text-left text-xs text-slate-500 font-medium">Symbol</th>
              <th className="px-4 py-3 text-left text-xs text-slate-500 font-medium">Sector</th>
              <th className="px-4 py-3 text-right text-xs text-slate-500 font-medium">Price</th>
              <th className="px-4 py-3 text-right text-xs text-slate-500 font-medium">Day %</th>
              <th className="px-4 py-3 text-center text-xs text-slate-500 font-medium">Opportunity</th>
              <th className="px-4 py-3 text-center text-xs text-slate-500 font-medium">Fundamental</th>
              <th className="px-4 py-3 text-right text-xs text-slate-500 font-medium">Analyst Upside</th>
            </tr>
          </thead>
          <tbody>
            {stocks.map((stock, idx) => (
              <tr
                key={stock.symbol}
                className="border-b border-slate-800/60 last:border-0 hover:bg-slate-800/20 transition-colors"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-600 text-xs w-4 text-right">{idx + 1}</span>
                    <div>
                      <p className="text-white font-semibold">{stock.symbol}</p>
                      <p className="text-slate-500 text-xs truncate max-w-[120px]">{stock.name}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="text-slate-400 text-xs">{stock.sector ?? "N/A"}</span>
                </td>
                <td className="px-4 py-3 text-right text-white font-medium">
                  {stock.price != null ? formatCurrency(stock.price) : "N/A"}
                </td>
                <td
                  className={`px-4 py-3 text-right font-medium text-xs ${
                    stock.changePercent == null
                      ? "text-slate-500"
                      : stock.changePercent >= 0
                        ? "text-emerald-400"
                        : "text-red-400"
                  }`}
                >
                  {stock.changePercent != null ? formatPercent(stock.changePercent) : "N/A"}
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-center">
                    <ScoreBar value={stock.oppScore} color="emerald" />
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-center">
                    <ScoreBar value={stock.fundamentalScore} color="blue" />
                  </div>
                </td>
                <td className="px-4 py-3 text-right">
                  {stock.analystUpsidePercent != null ? (
                    <span
                      className={`text-xs font-semibold tabular-nums ${
                        stock.analystUpsidePercent > 0 ? "text-emerald-400" : "text-red-400"
                      }`}
                    >
                      {stock.analystUpsidePercent >= 0 ? "+" : ""}
                      {stock.analystUpsidePercent.toFixed(1)}%
                    </span>
                  ) : (
                    <span className="text-slate-500 text-xs">N/A</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden flex flex-col divide-y divide-slate-800/60">
        {stocks.map((stock, idx) => (
          <div key={stock.symbol} className="px-4 py-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-slate-600 text-xs">{idx + 1}</span>
                <div>
                  <p className="text-white font-semibold text-sm">{stock.symbol}</p>
                  <p className="text-slate-500 text-xs">{stock.sector ?? "N/A"}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-white text-sm font-medium">
                  {stock.price != null ? formatCurrency(stock.price) : "N/A"}
                </p>
                <p
                  className={`text-xs font-medium ${
                    stock.changePercent == null
                      ? "text-slate-500"
                      : stock.changePercent >= 0
                        ? "text-emerald-400"
                        : "text-red-400"
                  }`}
                >
                  {stock.changePercent != null ? formatPercent(stock.changePercent) : "N/A"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <span className="text-slate-500 text-xs">Opp:</span>
                <ScoreBar value={stock.oppScore} color="emerald" />
              </div>
              <div className="flex items-center gap-1">
                <span className="text-slate-500 text-xs">Fund:</span>
                <ScoreBar value={stock.fundamentalScore} color="blue" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="px-5 py-3 border-t border-slate-800/60">
        <Link
          href="/scanner"
          className="flex items-center gap-1 text-xs text-slate-400 hover:text-emerald-400 transition-colors"
        >
          Open Scanner to compare all stocks <ArrowRight size={12} />
        </Link>
      </div>
    </div>
  );
}
