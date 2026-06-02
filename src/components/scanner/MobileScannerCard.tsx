import { Star, Bell } from "lucide-react";
import type { HotStock } from "@/src/lib/mock-data";
import type { ActiveAlertRule } from "@/src/lib/data/dashboard";
import { formatCurrency, formatPercent } from "@/src/lib/formatters";

interface MobileScannerCardProps {
  stock: HotStock;
  alertRulesBySymbol: Record<string, ActiveAlertRule[]>;
  onSelectStock: (stock: HotStock) => void;
}

function ScoreBar({ label, value }: { label: string; value: number | null | undefined }) {
  const n = value != null ? Math.round(Number(value)) : null;
  const barColor =
    n == null ? "bg-slate-700" :
    n >= 80 ? "bg-emerald-500" :
    n >= 60 ? "bg-emerald-500/60" :
    n >= 40 ? "bg-amber-500" :
    "bg-red-500/70";
  const textColor =
    n == null ? "text-slate-600" :
    n >= 80 ? "text-emerald-300" :
    n >= 60 ? "text-emerald-400/80" :
    n >= 40 ? "text-amber-300" :
    "text-red-400/70";

  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex items-center justify-between gap-1">
        <span className={`text-xs font-semibold tabular-nums ${textColor}`}>
          {n != null ? n : "—"}
        </span>
      </div>
      <div className="w-full bg-slate-800 rounded-full h-1 overflow-hidden">
        <div className={`h-full rounded-full ${barColor}`} style={{ width: n != null ? `${n}%` : "0%" }} />
      </div>
      <span className="text-[9px] text-slate-600 leading-none">{label}</span>
    </div>
  );
}

function ratingToStars(stock: HotStock): number {
  const total = stock.analystCount;
  if (total && total > 0) {
    const weighted =
      ((stock.analystStrongBuyCount ?? 0) * 5 +
        (stock.analystBuyCount ?? 0) * 4 +
        (stock.analystHoldCount ?? 0) * 3 +
        (stock.analystSellCount ?? 0) * 2 +
        (stock.analystStrongSellCount ?? 0) * 1) /
      total;
    return Math.round(weighted * 2) / 2;
  }
  switch (stock.analystRatingNormalized) {
    case "Strong Buy": return 5;
    case "Buy": return 4;
    case "Hold": return 3;
    case "Sell": return 2;
    case "Strong Sell": return 1;
    default: return 0;
  }
}

function StarDisplay({ stars }: { stars: number }) {
  if (stars === 0) return null;
  return (
    <span className="flex items-center gap-0.5 text-[11px] leading-none">
      {[1, 2, 3, 4, 5].map((i) => {
        if (stars >= i) return <span key={i} className="text-amber-400">★</span>;
        if (stars >= i - 0.5) {
          return (
            <span
              key={i}
              style={{
                background: "linear-gradient(90deg, #fbbf24 50%, #475569 50%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              ★
            </span>
          );
        }
        return <span key={i} className="text-slate-600">★</span>;
      })}
    </span>
  );
}

export default function MobileScannerCard({
  stock,
  alertRulesBySymbol,
  onSelectStock,
}: MobileScannerCardProps) {
  const hasAlert = (alertRulesBySymbol[stock.symbol]?.length ?? 0) > 0;
  const stars = ratingToStars(stock);

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

      {/* Score bars */}
      <div className="grid grid-cols-4 gap-3 border-t border-slate-800/60 pt-2.5 mb-2.5">
        <ScoreBar label="Opportunity" value={stock.oppScore} />
        <ScoreBar label="Fundamental" value={stock.fundamentalScore} />
        <ScoreBar label="Valuation" value={stock.valuationScore} />
        <ScoreBar label="Stability" value={stock.riskContextScore} />
      </div>

      {/* Analyst row */}
      {(stock.analystUpsidePercent != null || stock.analystRatingNormalized) && (
        <div className="flex items-center gap-3 text-xs border-t border-slate-800/60 pt-2">
          {stock.analystUpsidePercent != null && (
            <span>
              <span className="text-slate-500">Upside </span>
              <span className={`font-semibold tabular-nums ${stock.analystUpsidePercent >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                {stock.analystUpsidePercent >= 0 ? "+" : ""}{Number(stock.analystUpsidePercent).toFixed(1)}%
              </span>
            </span>
          )}
          {stars > 0 && (
            <span className="flex items-center gap-1">
              <StarDisplay stars={stars} />
              {stock.analystRatingNormalized && (
                <span className="text-[10px] text-slate-500">{stock.analystRatingNormalized}</span>
              )}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
