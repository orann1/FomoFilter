import { Star, Bell, BarChart3 } from "lucide-react";
import type { HotStock } from "@/src/lib/mock-data";
import type { ActiveAlertRule } from "@/src/lib/data/dashboard";
import { formatCurrency, formatPercent, formatScore, formatMetricPercent, formatRatio, formatCompactCurrency } from "@/src/lib/formatters";

function ScoreCell({ value }: { value: number | null | undefined }) {
  if (value == null) return <span className="text-slate-600 text-xs">N/A</span>;
  const n = Math.round(Number(value));
  const color = n >= 75 ? "text-emerald-300" : n >= 55 ? "text-amber-300" : n >= 40 ? "text-slate-300" : "text-slate-500";
  return <span className={`font-semibold tabular-nums text-sm ${color}`}>{n}</span>;
}

interface ScannerTableProps {
  stocks: HotStock[];
  selectedSymbol: string | null;
  alertRulesBySymbol: Record<string, ActiveAlertRule[]>;
  onSelectStock: (stock: HotStock) => void;
}

export default function ScannerTable({
  stocks,
  selectedSymbol,
  alertRulesBySymbol,
  onSelectStock,
}: ScannerTableProps) {
  if (stocks.length === 0) return null;

  return (
    <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-800">
      <table className="w-full text-sm border-collapse min-w-[1200px]">
        <thead>
          <tr className="border-b border-slate-800 bg-[#0d0f14]">
            <th className="w-8 px-3 py-3"></th>
            <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 py-3">Symbol</th>
            <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 py-3">Sector</th>
            <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 py-3">Price</th>
            <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 py-3">Day %</th>
            {/* Score columns */}
            <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 py-3">
              <span className="flex items-center justify-end gap-1"><BarChart3 size={11} className="text-emerald-400" />Fund.</span>
            </th>
            <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 py-3">Growth</th>
            <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 py-3">Profit.</th>
            <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 py-3">Valuat.</th>
            <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 py-3">Health</th>
            <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 py-3">Risk</th>
            {/* Metric columns */}
            <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 py-3">P/E</th>
            <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 py-3">PEG</th>
            <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 py-3">Rev Gr.</th>
            <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 py-3">EPS Gr.</th>
            <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 py-3">ROE</th>
            <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 py-3">D/E</th>
            <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 py-3">Mkt Cap</th>
            <th className="w-8 px-3 py-3"></th>
          </tr>
        </thead>
        <tbody>
          {stocks.map((stock) => {
            const isSelected = stock.symbol === selectedSymbol;
            const hasAlert = (alertRulesBySymbol[stock.symbol]?.length ?? 0) > 0;

            return (
              <tr
                key={stock.symbol}
                onClick={() => onSelectStock(stock)}
                className={`border-b border-slate-800/60 cursor-pointer transition-colors ${
                  isSelected
                    ? "bg-emerald-900/10 border-l-2 border-l-emerald-600"
                    : "hover:bg-slate-800/40"
                }`}
              >
                {/* Watchlist star */}
                <td className="px-3 py-2.5">
                  {stock.inWatchlist ? (
                    <Star size={13} className="text-amber-400 fill-amber-400" />
                  ) : (
                    <Star size={13} className="text-slate-700" />
                  )}
                </td>

                {/* Symbol + name + index badge */}
                <td className="px-3 py-2.5">
                  <div>
                    <span className="text-white font-semibold">{stock.symbol}</span>
                    <p className="text-xs text-slate-500 truncate max-w-[130px]">{stock.name}</p>
                    {stock.isSp500 && stock.isNasdaq100 ? (
                      <span className="text-[10px] text-blue-400/70 font-medium">S&P · NDX</span>
                    ) : stock.isSp500 ? (
                      <span className="text-[10px] text-blue-400/70 font-medium">S&P 500</span>
                    ) : stock.isNasdaq100 ? (
                      <span className="text-[10px] text-blue-400/70 font-medium">Nasdaq 100</span>
                    ) : stock.isRussell1000Only ? (
                      <span className="text-[10px] text-slate-600 font-medium">R1000</span>
                    ) : null}
                  </div>
                </td>

                {/* Sector */}
                <td className="px-3 py-2.5">
                  <span className="text-xs text-slate-400 whitespace-nowrap">{stock.sector || "—"}</span>
                </td>

                {/* Price */}
                <td className="px-3 py-2.5 text-right">
                  <span className="text-white font-medium tabular-nums text-xs">{formatCurrency(stock.price)}</span>
                </td>

                {/* Daily change */}
                <td className="px-3 py-2.5 text-right">
                  <span className={`font-semibold tabular-nums text-xs ${stock.change >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                    {formatPercent(stock.change)}
                  </span>
                </td>

                {/* Fundamental Score */}
                <td className="px-3 py-2.5 text-right">
                  <ScoreCell value={stock.fundamentalScore} />
                </td>

                {/* Growth Score */}
                <td className="px-3 py-2.5 text-right">
                  <ScoreCell value={stock.growthScore} />
                </td>

                {/* Profitability Score */}
                <td className="px-3 py-2.5 text-right">
                  <ScoreCell value={stock.profitabilityScore} />
                </td>

                {/* Valuation Score */}
                <td className="px-3 py-2.5 text-right">
                  <ScoreCell value={stock.valuationScore} />
                </td>

                {/* Financial Health Score */}
                <td className="px-3 py-2.5 text-right">
                  <ScoreCell value={stock.financialHealthScore} />
                </td>

                {/* Risk Context Score */}
                <td className="px-3 py-2.5 text-right">
                  <ScoreCell value={stock.riskContextScore} />
                </td>

                {/* P/E */}
                <td className="px-3 py-2.5 text-right">
                  <span className="text-xs text-slate-300 tabular-nums">{formatRatio(stock.peRatio)}</span>
                </td>

                {/* PEG */}
                <td className="px-3 py-2.5 text-right">
                  <span className="text-xs text-slate-300 tabular-nums">{formatRatio(stock.pegRatio, 2)}</span>
                </td>

                {/* Revenue Growth */}
                <td className="px-3 py-2.5 text-right">
                  <span className={`text-xs tabular-nums ${stock.revenueGrowth != null ? (stock.revenueGrowth >= 0 ? "text-emerald-400/80" : "text-red-400/80") : "text-slate-600"}`}>
                    {formatMetricPercent(stock.revenueGrowth)}
                  </span>
                </td>

                {/* EPS Growth */}
                <td className="px-3 py-2.5 text-right">
                  <span className={`text-xs tabular-nums ${stock.epsGrowth != null ? (stock.epsGrowth >= 0 ? "text-emerald-400/80" : "text-red-400/80") : "text-slate-600"}`}>
                    {formatMetricPercent(stock.epsGrowth)}
                  </span>
                </td>

                {/* ROE */}
                <td className="px-3 py-2.5 text-right">
                  <span className="text-xs text-slate-300 tabular-nums">{formatScore(stock.roe) === "N/A" ? <span className="text-slate-600">N/A</span> : `${Number(stock.roe).toFixed(1)}%`}</span>
                </td>

                {/* Debt/Equity */}
                <td className="px-3 py-2.5 text-right">
                  <span className="text-xs text-slate-300 tabular-nums">{formatRatio(stock.debtToEquity, 2)}</span>
                </td>

                {/* Market Cap */}
                <td className="px-3 py-2.5 text-right">
                  <span className="text-xs text-slate-400 tabular-nums">{formatCompactCurrency(stock.marketCapFull)}</span>
                </td>

                {/* Alert indicator */}
                <td className="px-3 py-2.5 text-center">
                  {hasAlert && (
                    <Bell size={12} className="text-amber-400 mx-auto" />
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
