import { ArrowRight } from "lucide-react";
import Link from "next/link";
import type { DashboardStockRow } from "@/src/lib/data/dashboard";
import { formatCurrency, formatPercent, formatScore, formatMetricPercent, formatRatio } from "@/src/lib/formatters";

function ScoreBar({ value }: { value: number | null }) {
  if (value == null) return <span className="text-slate-500 text-xs">N/A</span>;
  const color =
    value >= 80
      ? "bg-emerald-500"
      : value >= 65
        ? "bg-teal-500"
        : value >= 50
          ? "bg-amber-500"
          : "bg-slate-600";
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-white text-xs font-semibold w-6 text-right">{value}</span>
      <div className="w-12 h-1.5 bg-slate-700 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

interface TopFundamentalStocksTableProps {
  stocks: DashboardStockRow[];
}

export default function TopFundamentalStocksTable({ stocks }: TopFundamentalStocksTableProps) {
  if (stocks.length === 0) {
    return (
      <div className="bg-[#111318] border border-slate-800 rounded-xl p-8 text-center mb-5">
        <p className="text-slate-400 text-sm">No scored stocks found.</p>
        <p className="text-slate-500 text-xs mt-1">
          Run Market Data Sync and Calculate Fundamental Scores in Admin.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-[#111318] border border-slate-800 rounded-xl overflow-hidden mb-5">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
        <div>
          <h2 className="text-white font-semibold text-sm">Top Fundamental Stocks</h2>
          <p className="text-slate-500 text-xs mt-0.5">Sorted by Fundamental Score — top {stocks.length}</p>
        </div>
        <Link
          href="/scanner"
          className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
        >
          View all <ArrowRight size={12} />
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
              <th className="px-4 py-3 text-center text-xs text-slate-500 font-medium">Opp.</th>
              <th className="px-4 py-3 text-center text-xs text-slate-500 font-medium">Fund.</th>
              <th className="px-4 py-3 text-center text-xs text-slate-500 font-medium">Growth</th>
              <th className="px-4 py-3 text-center text-xs text-slate-500 font-medium">Profit.</th>
              <th className="px-4 py-3 text-center text-xs text-slate-500 font-medium">Valuat.</th>
              <th className="px-4 py-3 text-center text-xs text-slate-500 font-medium">Health</th>
              <th className="px-4 py-3 text-right text-xs text-slate-500 font-medium">Mkt Cap</th>
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
                <td className="px-4 py-3 text-center">
                  <span className="text-xs font-semibold tabular-nums text-emerald-300">
                    {formatScore(stock.oppScore)}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <ScoreBar value={stock.fundamentalScore} />
                </td>
                <td className="px-4 py-3 text-center">
                  <span className="text-slate-300 text-xs">{formatScore(stock.growthScore)}</span>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className="text-slate-300 text-xs">{formatScore(stock.profitabilityScore)}</span>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className="text-slate-300 text-xs">{formatScore(stock.valuationScore)}</span>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className="text-slate-300 text-xs">{formatScore(stock.financialHealthScore)}</span>
                </td>
                <td className="px-4 py-3 text-right text-slate-400 text-xs">
                  {stock.marketCap ?? "N/A"}
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
            <div className="flex items-center gap-3">
              <ScoreBar value={stock.fundamentalScore} />
              <span className="text-slate-500 text-xs">
                G:{formatScore(stock.growthScore)} P:{formatScore(stock.profitabilityScore)} H:{formatScore(stock.financialHealthScore)}
              </span>
              <span className="text-slate-500 text-xs ml-auto">{stock.marketCap ?? "N/A"}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
