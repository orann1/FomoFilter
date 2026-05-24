import { Star, Bell, BarChart3 } from "lucide-react";
import type { HotStock } from "@/src/lib/mock-data";
import type { ActiveAlertRule } from "@/src/lib/data/dashboard";
import { formatCurrency, formatPercent, formatScore, formatMetricPercent } from "@/src/lib/formatters";

interface MobileScannerCardProps {
  stock: HotStock;
  alertRulesBySymbol: Record<string, ActiveAlertRule[]>;
  onSelectStock: (stock: HotStock) => void;
}

function ScoreBadge({ label, value }: { label: string; value: number | null | undefined }) {
  const display = formatScore(value);
  const n = value != null ? Math.round(Number(value)) : null;
  const color = n == null ? "text-slate-600" : n >= 75 ? "text-emerald-300" : n >= 55 ? "text-amber-300" : "text-slate-400";
  return (
    <div className="flex flex-col items-center">
      <span className={`text-sm font-semibold tabular-nums ${color}`}>{display}</span>
      <span className="text-[10px] text-slate-600">{label}</span>
    </div>
  );
}

export default function MobileScannerCard({
  stock,
  alertRulesBySymbol,
  onSelectStock,
}: MobileScannerCardProps) {
  const hasAlert = (alertRulesBySymbol[stock.symbol]?.length ?? 0) > 0;

  return (
    <div
      onClick={() => onSelectStock(stock)}
      className="bg-[#16181f] border border-slate-800 rounded-xl p-4 cursor-pointer active:bg-slate-800/60 transition-colors"
    >
      {/* Top row: symbol + price */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-white font-bold text-base">{stock.symbol}</span>
            {stock.inWatchlist && (
              <Star size={12} className="text-amber-400 fill-amber-400 shrink-0" />
            )}
            {hasAlert && (
              <Bell size={12} className="text-amber-400 shrink-0" />
            )}
          </div>
          <p className="text-xs text-slate-500 truncate">{stock.name}</p>
          {stock.sector && (
            <p className="text-[10px] text-slate-600 mt-0.5">{stock.sector}</p>
          )}
          {(stock.isSp500 || stock.isNasdaq100 || stock.isRussell1000Only) && (
            <p className="text-[10px] text-blue-400/70 font-medium mt-0.5">
              {stock.isSp500 && stock.isNasdaq100
                ? "S&P 500 · NDX"
                : stock.isSp500
                ? "S&P 500"
                : stock.isNasdaq100
                ? "Nasdaq 100"
                : "R1000 Only"}
            </p>
          )}
        </div>
        <div className="text-right shrink-0 ml-3">
          <p className="text-white font-semibold tabular-nums">{formatCurrency(stock.price)}</p>
          <p className={`text-xs font-semibold tabular-nums ${stock.change >= 0 ? "text-emerald-400" : "text-red-400"}`}>
            {formatPercent(stock.change)}
          </p>
        </div>
      </div>

      {/* Score row */}
      <div className="flex items-center justify-between border-t border-slate-800/60 pt-2.5">
        <div className="flex items-center gap-1 text-slate-600">
          <BarChart3 size={11} />
          <span className="text-[10px]">Scores</span>
        </div>
        <div className="flex gap-4">
          <ScoreBadge label="Fund." value={stock.fundamentalScore} />
          <ScoreBadge label="Growth" value={stock.growthScore} />
          <ScoreBadge label="Profit." value={stock.profitabilityScore} />
          <ScoreBadge label="Health" value={stock.financialHealthScore} />
        </div>
      </div>

      {/* Metrics row */}
      {(stock.peRatio != null || stock.revenueGrowth != null || stock.roe != null) && (
        <div className="flex gap-4 mt-2 text-xs text-slate-500">
          {stock.peRatio != null && (
            <span>P/E <span className="text-slate-300">{Number(stock.peRatio).toFixed(1)}</span></span>
          )}
          {stock.revenueGrowth != null && (
            <span>Rev <span className={stock.revenueGrowth >= 0 ? "text-emerald-400/80" : "text-red-400/80"}>{formatMetricPercent(stock.revenueGrowth)}</span></span>
          )}
          {stock.roe != null && (
            <span>ROE <span className="text-slate-300">{Number(stock.roe).toFixed(1)}%</span></span>
          )}
        </div>
      )}
    </div>
  );
}
