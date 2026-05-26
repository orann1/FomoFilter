"use client";

import React, { useState } from "react";
import { Star, Bell, BarChart3, Info, ChevronDown, ChevronRight } from "lucide-react";
import type { HotStock } from "@/src/lib/mock-data";
import type { ActiveAlertRule } from "@/src/lib/data/dashboard";
import { formatCurrency, formatPercent, formatMetricPercent, formatRatio, formatCompactCurrency } from "@/src/lib/formatters";
import ScannerExpandedRow from "./ScannerExpandedRow";

const SCORE_TOOLTIPS: Record<string, string> = {
  "Opp.": "Opportunity Score v1 — combines fundamental quality (35%), valuation (30%), growth (20%), risk/context (10%), and 52W price position (5%).",
  "Fund.": "Weighted score from growth, profitability, valuation, financial health, and risk/context.",
  "Growth": "Revenue and EPS growth metrics.",
  "Profit.": "Margins, ROE, and ROA.",
  "Valuat.": "Price paid relative to earnings, sales, EBITDA, and growth.",
  "Health": "Debt, liquidity, and interest coverage.",
  "Risk": "Beta and company size context.",
};

const TOTAL_COLS = 20;

function ScoreCell({ value }: { value: number | null | undefined }) {
  if (value == null) return <span className="text-slate-600 text-xs">N/A</span>;
  const n = Math.round(Number(value));
  const color = n >= 75 ? "text-emerald-300" : n >= 55 ? "text-amber-300" : n >= 40 ? "text-slate-300" : "text-slate-500";
  return <span className={`font-semibold tabular-nums text-sm ${color}`}>{n}</span>;
}

function ScoreHeader({ label }: { label: string }) {
  const tip = SCORE_TOOLTIPS[label];
  return (
    <span className="inline-flex items-center justify-end gap-1">
      {label === "Fund." && <BarChart3 size={11} className="text-emerald-400" />}
      {label}
      {tip && (
        <span title={tip} className="text-slate-600 hover:text-slate-400 cursor-help transition-colors">
          <Info size={10} />
        </span>
      )}
    </span>
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
  const [expandedSymbols, setExpandedSymbols] = useState<Set<string>>(new Set());

  function toggleExpand(symbol: string, e: React.MouseEvent) {
    e.stopPropagation();
    setExpandedSymbols((prev) => {
      const next = new Set(prev);
      if (next.has(symbol)) next.delete(symbol);
      else next.add(symbol);
      return next;
    });
  }

  if (stocks.length === 0) return null;

  return (
    <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-800">
      <table className="w-full text-sm border-collapse min-w-[1100px]">
        <thead>
          <tr className="border-b border-slate-800 bg-[#0d0f14]">
            <th className="w-8 px-3 py-3"></th>
            <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 py-3">Symbol</th>
            <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 py-3">Sector</th>
            <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 py-3">Price</th>
            <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 py-3">Day %</th>
            <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 py-3">Target</th>
            <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 py-3">Upside</th>
            <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 py-3">Rating</th>
            <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 py-3">
              <ScoreHeader label="Opp." />
            </th>
            <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 py-3">
              <ScoreHeader label="Fund." />
            </th>
            <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 py-3">
              <ScoreHeader label="Growth" />
            </th>
            <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 py-3">
              <ScoreHeader label="Profit." />
            </th>
            <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 py-3">
              <ScoreHeader label="Valuat." />
            </th>
            <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 py-3">
              <ScoreHeader label="Health" />
            </th>
            <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 py-3">
              <ScoreHeader label="Risk" />
            </th>
            <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 py-3">P/E</th>
            <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 py-3">PEG</th>
            <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 py-3">ROE</th>
            <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 py-3">Rev Gr.</th>
            <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 py-3">Mkt Cap</th>
            <th className="w-8 px-3 py-3"></th>
          </tr>
        </thead>
        <tbody>
          {stocks.map((stock) => {
            const isSelected = stock.symbol === selectedSymbol;
            const hasAlert = (alertRulesBySymbol[stock.symbol]?.length ?? 0) > 0;
            const isExpanded = expandedSymbols.has(stock.symbol);

            return (
              <React.Fragment key={stock.symbol}>
                <tr
                  onClick={() => onSelectStock(stock)}
                  className={`border-b border-slate-800/60 cursor-pointer transition-colors ${
                    isSelected
                      ? "bg-emerald-900/10 border-l-2 border-l-emerald-600"
                      : isExpanded
                      ? "bg-slate-800/20"
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

                  {/* Analyst Target */}
                  <td className="px-3 py-2.5 text-right">
                    <span className="text-xs text-slate-300 tabular-nums">
                      {stock.analystTargetPrice != null ? formatCurrency(stock.analystTargetPrice) : <span className="text-slate-600">N/A</span>}
                    </span>
                  </td>

                  {/* Analyst Upside */}
                  <td className="px-3 py-2.5 text-right">
                    {stock.analystUpsidePercent != null ? (
                      <span className={`text-xs font-semibold tabular-nums ${stock.analystUpsidePercent >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                        {stock.analystUpsidePercent >= 0 ? "+" : ""}{Number(stock.analystUpsidePercent).toFixed(1)}%
                      </span>
                    ) : (
                      <span className="text-slate-600 text-xs">N/A</span>
                    )}
                  </td>

                  {/* Analyst Rating */}
                  <td className="px-3 py-2.5 text-left">
                    {stock.analystRatingNormalized ? (
                      <span className={`text-xs font-medium ${
                        stock.analystRatingNormalized === "Strong Buy" ? "text-emerald-300" :
                        stock.analystRatingNormalized === "Buy" ? "text-emerald-400/70" :
                        stock.analystRatingNormalized === "Hold" ? "text-amber-400" :
                        stock.analystRatingNormalized === "Sell" ? "text-red-400/70" :
                        stock.analystRatingNormalized === "Strong Sell" ? "text-red-400" :
                        "text-slate-500"
                      }`}>{stock.analystRatingNormalized}</span>
                    ) : (
                      <span className="text-slate-600 text-xs">N/A</span>
                    )}
                  </td>

                  <td className="px-3 py-2.5 text-right"><ScoreCell value={stock.oppScore} /></td>
                  <td className="px-3 py-2.5 text-right"><ScoreCell value={stock.fundamentalScore} /></td>
                  <td className="px-3 py-2.5 text-right"><ScoreCell value={stock.growthScore} /></td>
                  <td className="px-3 py-2.5 text-right"><ScoreCell value={stock.profitabilityScore} /></td>
                  <td className="px-3 py-2.5 text-right"><ScoreCell value={stock.valuationScore} /></td>
                  <td className="px-3 py-2.5 text-right"><ScoreCell value={stock.financialHealthScore} /></td>
                  <td className="px-3 py-2.5 text-right"><ScoreCell value={stock.riskContextScore} /></td>

                  {/* P/E */}
                  <td className="px-3 py-2.5 text-right">
                    <span className="text-xs text-slate-300 tabular-nums">{formatRatio(stock.peRatio)}</span>
                  </td>

                  {/* PEG */}
                  <td className="px-3 py-2.5 text-right">
                    <span className="text-xs text-slate-300 tabular-nums">{formatRatio(stock.pegRatio, 2)}</span>
                  </td>

                  {/* ROE */}
                  <td className="px-3 py-2.5 text-right">
                    <span className="text-xs text-slate-300 tabular-nums">
                      {stock.roe != null ? `${Number(stock.roe).toFixed(1)}%` : <span className="text-slate-600">N/A</span>}
                    </span>
                  </td>

                  {/* Revenue Growth */}
                  <td className="px-3 py-2.5 text-right">
                    <span className={`text-xs tabular-nums ${stock.revenueGrowth != null ? (stock.revenueGrowth >= 0 ? "text-emerald-400/80" : "text-red-400/80") : "text-slate-600"}`}>
                      {formatMetricPercent(stock.revenueGrowth)}
                    </span>
                  </td>

                  {/* Market Cap */}
                  <td className="px-3 py-2.5 text-right">
                    <span className="text-xs text-slate-400 tabular-nums">{formatCompactCurrency(stock.marketCapFull)}</span>
                  </td>

                  {/* Expand + Alert indicator */}
                  <td className="px-2 py-2.5 text-center">
                    <div className="flex items-center justify-center gap-1">
                      {hasAlert && <Bell size={11} className="text-amber-400" />}
                      <button
                        onClick={(e) => toggleExpand(stock.symbol, e)}
                        title="Show details"
                        className="text-slate-600 hover:text-slate-300 transition-colors rounded p-0.5"
                      >
                        {isExpanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                      </button>
                    </div>
                  </td>
                </tr>

                {isExpanded && (
                  <ScannerExpandedRow key={`${stock.symbol}-expanded`} stock={stock} colSpan={TOTAL_COLS} />
                )}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
