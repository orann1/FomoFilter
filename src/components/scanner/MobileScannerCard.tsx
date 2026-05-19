import { Star, Bell, Flame, Target } from "lucide-react";
import type { HotStock, RiskLevel } from "@/src/lib/mock-data";
import type { ActiveAlertRule } from "@/src/lib/data/dashboard";
import { formatCurrency, formatPercent } from "@/src/lib/formatters";

const riskStyles: Record<RiskLevel, string> = {
  LOW: "text-emerald-400 bg-emerald-500/10 border-emerald-800/50",
  MEDIUM: "text-amber-400 bg-amber-500/10 border-amber-800/50",
  HIGH: "text-orange-400 bg-orange-500/10 border-orange-800/50",
  EXTREME: "text-red-400 bg-red-500/10 border-red-800/50",
};

interface MobileScannerCardProps {
  stock: HotStock;
  alertRulesBySymbol: Record<string, ActiveAlertRule[]>;
  onSelectStock: (stock: HotStock) => void;
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
      <div className="flex items-start justify-between mb-2">
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

      {/* Scores row */}
      <div className="flex items-center gap-3 mb-2">
        <div className="flex items-center gap-1">
          <Flame size={11} className="text-orange-400" />
          <span className="text-xs text-slate-400">Hot</span>
          <span className="text-xs font-semibold text-orange-300 tabular-nums">{stock.hot}</span>
        </div>
        <div className="flex items-center gap-1">
          <Target size={11} className="text-emerald-400" />
          <span className="text-xs text-slate-400">Opp</span>
          <span className="text-xs font-semibold text-emerald-300 tabular-nums">{stock.opp}</span>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${riskStyles[stock.risk]}`}>
          {stock.risk}
        </span>
      </div>

      {/* Setup + catalyst row */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-slate-400 bg-slate-800/60 border border-slate-700/40 px-2 py-0.5 rounded-full truncate max-w-[120px]">
          {stock.setup}
        </span>
        {stock.catalyst && (
          <span className="text-xs text-slate-500 truncate flex-1 text-right">
            {stock.catalyst}
          </span>
        )}
      </div>
    </div>
  );
}
