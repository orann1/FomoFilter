import { Star } from "lucide-react";
import { mockHotStocks, type RiskLevel } from "@/src/lib/mock-data";
import { formatCurrency, formatPercent } from "@/src/lib/formatters";

const riskColors: Record<RiskLevel, string> = {
  LOW: "text-emerald-400 bg-emerald-500/10 border-emerald-800/50",
  MEDIUM: "text-amber-400 bg-amber-500/10 border-amber-800/50",
  HIGH: "text-orange-400 bg-orange-500/10 border-orange-800/50",
  EXTREME: "text-red-400 bg-red-500/10 border-red-800/50",
};

function ScorePill({ value, type }: { value: number; type: "hot" | "opp" }) {
  const isHigh = value >= 80;
  const isMid = value >= 60;
  const color = type === "hot"
    ? isHigh ? "text-orange-300 bg-orange-500/15" : isMid ? "text-amber-400 bg-amber-500/10" : "text-slate-400 bg-slate-700/40"
    : isHigh ? "text-emerald-300 bg-emerald-500/15" : isMid ? "text-teal-400 bg-teal-500/10" : "text-slate-400 bg-slate-700/40";
  return (
    <span className={`inline-block text-xs font-semibold px-1.5 py-0.5 rounded ${color}`}>
      {value}
    </span>
  );
}

export default function HotStocksTable() {
  return (
    <div className="bg-[#111318] border border-slate-800 rounded-xl overflow-hidden mb-5">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
        <h2 className="text-white font-semibold text-sm">Hot Stocks Today</h2>
        <span className="text-xs text-slate-500">{mockHotStocks.length} stocks</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800">
              <th className="w-8 px-4 py-3 text-left"></th>
              <th className="px-4 py-3 text-left text-xs text-slate-500 font-medium">Symbol</th>
              <th className="px-4 py-3 text-right text-xs text-slate-500 font-medium">Price</th>
              <th className="px-4 py-3 text-right text-xs text-slate-500 font-medium">Change</th>
              <th className="px-4 py-3 text-left text-xs text-slate-500 font-medium">Setup</th>
              <th className="px-4 py-3 text-center text-xs text-slate-500 font-medium">Hot</th>
              <th className="px-4 py-3 text-center text-xs text-slate-500 font-medium">Opp</th>
              <th className="px-4 py-3 text-left text-xs text-slate-500 font-medium">Risk</th>
              <th className="px-4 py-3 text-left text-xs text-slate-500 font-medium">Catalyst</th>
            </tr>
          </thead>
          <tbody>
            {mockHotStocks.map((stock) => (
              <tr
                key={stock.symbol}
                className="border-b border-slate-800/60 hover:bg-slate-800/30 cursor-pointer transition-colors last:border-0"
              >
                <td className="px-4 py-3">
                  <Star
                    size={14}
                    className={stock.inWatchlist ? "text-amber-400 fill-amber-400" : "text-slate-600"}
                  />
                </td>
                <td className="px-4 py-3">
                  <p className="text-white font-semibold">{stock.symbol}</p>
                  <p className="text-slate-500 text-xs">{stock.name}</p>
                </td>
                <td className="px-4 py-3 text-right text-white font-medium">
                  {formatCurrency(stock.price)}
                </td>
                <td className={`px-4 py-3 text-right font-medium ${stock.change >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                  {formatPercent(stock.change)}
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs bg-slate-700/60 text-slate-300 border border-slate-700 px-2 py-0.5 rounded-full">
                    {stock.setup}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <ScorePill value={stock.hot} type="hot" />
                </td>
                <td className="px-4 py-3 text-center">
                  <ScorePill value={stock.opp} type="opp" />
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs border px-1.5 py-0.5 rounded-full font-medium ${riskColors[stock.risk]}`}>
                    {stock.risk}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <p className="text-slate-300 text-xs">{stock.catalyst}</p>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
