import { Star } from "lucide-react";
import { type HotStock, type RiskLevel } from "@/src/lib/mock-data";
import { formatCurrency, formatPercent } from "@/src/lib/formatters";

const riskColors: Record<RiskLevel, string> = {
  LOW: "text-emerald-400 bg-emerald-500/10 border-emerald-800/50",
  MEDIUM: "text-amber-400 bg-amber-500/10 border-amber-800/50",
  HIGH: "text-orange-400 bg-orange-500/10 border-orange-800/50",
  EXTREME: "text-red-400 bg-red-500/10 border-red-800/50",
};

interface MobileHotStockCardProps {
  stock: HotStock;
  isSelected: boolean;
  isInWatchlist: boolean;
  onSelect: (stock: HotStock) => void;
}

export default function MobileHotStockCard({
  stock,
  isSelected,
  isInWatchlist,
  onSelect,
}: MobileHotStockCardProps) {
  return (
    <div
      onClick={() => onSelect(stock)}
      className={`bg-[#111318] border rounded-xl p-4 cursor-pointer transition-colors ${
        isSelected
          ? "border-orange-500/60 bg-slate-800/40"
          : "border-slate-800 hover:border-slate-700 hover:bg-slate-800/20"
      }`}
    >
      {/* Top row: symbol + change */}
      <div className="flex items-start justify-between mb-1">
        <div className="flex items-center gap-2">
          <Star
            size={13}
            className={isInWatchlist ? "text-amber-400 fill-amber-400" : "text-slate-600"}
          />
          <span className={`font-bold text-base ${isSelected ? "text-orange-300" : "text-white"}`}>
            {stock.symbol}
          </span>
        </div>
        <span
          className={`text-sm font-semibold ${stock.change >= 0 ? "text-emerald-400" : "text-red-400"}`}
        >
          {formatPercent(stock.change)}
        </span>
      </div>

      {/* Company name + price */}
      <p className="text-slate-500 text-xs mb-2 truncate">{stock.name}</p>
      <p className="text-white font-semibold text-sm mb-3">{formatCurrency(stock.price)}</p>

      {/* Badges row */}
      <div className="flex items-center gap-2 flex-wrap mb-2">
        <span className="text-xs bg-slate-700/60 text-slate-300 border border-slate-700 px-2 py-0.5 rounded-full">
          {stock.setup}
        </span>
        <span className={`text-xs border px-2 py-0.5 rounded-full font-medium ${riskColors[stock.risk]}`}>
          {stock.risk}
        </span>
      </div>

      {/* Scores row */}
      <div className="flex items-center gap-3 mb-2">
        <span className="text-xs text-slate-500">
          Hot <span className="text-orange-300 font-semibold">{stock.hot}</span>
        </span>
        <span className="text-slate-700">·</span>
        <span className="text-xs text-slate-500">
          Opp <span className="text-emerald-300 font-semibold">{stock.opp}</span>
        </span>
      </div>

      {/* Catalyst */}
      <p className="text-slate-400 text-xs truncate">{stock.catalyst}</p>
    </div>
  );
}
