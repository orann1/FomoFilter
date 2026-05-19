import { Star, Bell, Flame, Target, TriangleAlert } from "lucide-react";
import type { HotStock, RiskLevel } from "@/src/lib/mock-data";
import type { ActiveAlertRule } from "@/src/lib/data/dashboard";
import { formatCurrency, formatPercent } from "@/src/lib/formatters";

const riskStyles: Record<RiskLevel, string> = {
  LOW: "text-emerald-400 bg-emerald-500/10 border-emerald-800/50",
  MEDIUM: "text-amber-400 bg-amber-500/10 border-amber-800/50",
  HIGH: "text-orange-400 bg-orange-500/10 border-orange-800/50",
  EXTREME: "text-red-400 bg-red-500/10 border-red-800/50",
};

function ScorePill({ value, type }: { value: number; type: "hot" | "opp" }) {
  const high = value >= 80;
  const mid = value >= 60;
  const color = type === "hot"
    ? high ? "text-orange-300" : mid ? "text-orange-400/70" : "text-slate-500"
    : high ? "text-emerald-300" : mid ? "text-emerald-400/70" : "text-slate-500";
  return (
    <span className={`font-semibold tabular-nums ${color}`}>{value}</span>
  );
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
      <table className="w-full text-sm border-collapse min-w-[960px]">
        <thead>
          <tr className="border-b border-slate-800 bg-[#0d0f14]">
            <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 py-3 w-8"></th>
            <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 py-3">Symbol</th>
            <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 py-3">Sector</th>
            <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 py-3">Price</th>
            <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 py-3">Day %</th>
            <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 py-3">
              <span className="flex items-center justify-end gap-1"><Flame size={11} className="text-orange-400" />Hot</span>
            </th>
            <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 py-3">
              <span className="flex items-center justify-end gap-1"><Target size={11} className="text-emerald-400" />Opp</span>
            </th>
            <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 py-3">Risk</th>
            <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 py-3">Setup</th>
            <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 py-3">Rel Vol</th>
            <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 py-3">Upside</th>
            <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 py-3">Catalyst</th>
            <th className="text-center text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 py-3 w-8"></th>
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
                <td className="px-3 py-3">
                  {stock.inWatchlist ? (
                    <Star size={13} className="text-amber-400 fill-amber-400" />
                  ) : (
                    <Star size={13} className="text-slate-700" />
                  )}
                </td>

                {/* Symbol + name + index badge */}
                <td className="px-3 py-3">
                  <div>
                    <span className="text-white font-semibold">{stock.symbol}</span>
                    <p className="text-xs text-slate-500 truncate max-w-[140px]">{stock.name}</p>
                    {stock.isSp500 && stock.isNasdaq100 ? (
                      <span className="text-[10px] text-blue-400/70 font-medium">S&P 500 · NDX</span>
                    ) : stock.isSp500 ? (
                      <span className="text-[10px] text-blue-400/70 font-medium">S&P 500</span>
                    ) : stock.isNasdaq100 ? (
                      <span className="text-[10px] text-blue-400/70 font-medium">Nasdaq 100</span>
                    ) : stock.isRussell1000Only ? (
                      <span className="text-[10px] text-slate-600 font-medium">R1000 Only</span>
                    ) : null}
                  </div>
                </td>

                {/* Sector */}
                <td className="px-3 py-3">
                  <span className="text-xs text-slate-400">{stock.sector || "—"}</span>
                </td>

                {/* Price */}
                <td className="px-3 py-3 text-right">
                  <span className="text-white font-medium tabular-nums">{formatCurrency(stock.price)}</span>
                </td>

                {/* Daily change */}
                <td className="px-3 py-3 text-right">
                  <span className={`font-semibold tabular-nums ${stock.change >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                    {formatPercent(stock.change)}
                  </span>
                </td>

                {/* Hot Score */}
                <td className="px-3 py-3 text-right">
                  <ScorePill value={stock.hot} type="hot" />
                </td>

                {/* Opp Score */}
                <td className="px-3 py-3 text-right">
                  <ScorePill value={stock.opp} type="opp" />
                </td>

                {/* Risk */}
                <td className="px-3 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${riskStyles[stock.risk]}`}>
                    {stock.risk}
                  </span>
                </td>

                {/* Setup */}
                <td className="px-3 py-3">
                  <span className="text-xs text-slate-400 bg-slate-800/60 border border-slate-700/40 px-2 py-0.5 rounded-full whitespace-nowrap">
                    {stock.setup}
                  </span>
                </td>

                {/* Relative Volume */}
                <td className="px-3 py-3 text-right">
                  <span className={`tabular-nums text-xs font-medium ${stock.relativeVolume >= 2 ? "text-orange-400" : stock.relativeVolume >= 1.5 ? "text-amber-400" : "text-slate-400"}`}>
                    {stock.relativeVolume.toFixed(1)}x
                  </span>
                </td>

                {/* Analyst Upside */}
                <td className="px-3 py-3 text-right">
                  <span className={`tabular-nums text-xs font-medium ${stock.analystUpside >= 20 ? "text-emerald-400" : stock.analystUpside >= 10 ? "text-emerald-400/70" : "text-slate-400"}`}>
                    {stock.analystUpside > 0 ? `+${stock.analystUpside.toFixed(1)}%` : "—"}
                  </span>
                </td>

                {/* Catalyst */}
                <td className="px-3 py-3">
                  <span className="text-xs text-slate-400 truncate max-w-[120px] block">{stock.catalyst || "—"}</span>
                </td>

                {/* Alert indicator */}
                <td className="px-3 py-3 text-center">
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
