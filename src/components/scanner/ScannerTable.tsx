"use client";

import React, { useState } from "react";
import { Star, Bell, ChevronDown, ChevronRight } from "lucide-react";
import type { HotStock } from "@/src/lib/mock-data";
import type { ActiveAlertRule } from "@/src/lib/data/dashboard";
import { formatCurrency, formatPercent } from "@/src/lib/formatters";
import ScannerExpandedRow from "./ScannerExpandedRow";

// 12 total columns: star + symbol + sector + price + day% + opp + fund + valuation + stability + upside + rating + expand
const TOTAL_COLS = 12;

// --- Score tiers ---
function scoreBarColor(n: number): string {
  if (n >= 80) return "bg-emerald-500";
  if (n >= 60) return "bg-emerald-500/60";
  if (n >= 40) return "bg-amber-500";
  return "bg-red-500/70";
}

function scoreTextColor(n: number): string {
  if (n >= 80) return "text-emerald-300";
  if (n >= 60) return "text-emerald-400/80";
  if (n >= 40) return "text-amber-300";
  return "text-red-400/70";
}

// --- Score cell with mini progress bar ---
function ScoreCell({ value }: { value: number | null | undefined }) {
  if (value == null) return <span className="text-slate-600 text-xs">N/A</span>;
  const n = Math.round(Number(value));
  return (
    <div className="flex items-center gap-1.5 justify-end">
      <div className="w-12 bg-slate-800 rounded-full h-1 overflow-hidden shrink-0">
        <div className={`h-full rounded-full ${scoreBarColor(n)}`} style={{ width: `${n}%` }} />
      </div>
      <span className={`text-xs font-semibold tabular-nums w-6 text-right ${scoreTextColor(n)}`}>{n}</span>
    </div>
  );
}

// --- Star rating ---
function ratingToStars(rating: string | null | undefined, counts?: {
  strongBuy?: number | null;
  buy?: number | null;
  hold?: number | null;
  sell?: number | null;
  strongSell?: number | null;
  total?: number | null;
}): number {
  if (counts?.total && counts.total > 0) {
    const total = counts.total;
    const weighted =
      ((counts.strongBuy ?? 0) * 5 +
        (counts.buy ?? 0) * 4 +
        (counts.hold ?? 0) * 3 +
        (counts.sell ?? 0) * 2 +
        (counts.strongSell ?? 0) * 1) /
      total;
    return Math.round(weighted * 2) / 2;
  }
  switch (rating) {
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
    <span className="flex items-center gap-0.5 text-[12px] leading-none" aria-label={`${stars} stars`}>
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

// Two-line rating: stars+number on line 1, label on line 2
function RatingCell({
  rating,
  counts,
}: {
  rating: string | null | undefined;
  counts?: Parameters<typeof ratingToStars>[1];
}) {
  if (!rating) return <span className="text-slate-600 text-xs">N/A</span>;
  const stars = ratingToStars(rating, counts);
  const labelColor =
    rating === "Strong Buy" ? "text-emerald-300" :
    rating === "Buy" ? "text-emerald-400/70" :
    rating === "Hold" ? "text-amber-400" :
    rating === "Sell" ? "text-red-400/70" :
    rating === "Strong Sell" ? "text-red-400" :
    "text-slate-400";

  return (
    <div className="flex flex-col items-start gap-0.5">
      <div className="flex items-center gap-1">
        <StarDisplay stars={stars} />
        {stars > 0 && (
          <span className="text-[10px] tabular-nums text-slate-500 leading-none">{stars.toFixed(1)}</span>
        )}
      </div>
      <span className={`text-[10px] font-medium leading-none ${labelColor}`}>{rating}</span>
    </div>
  );
}

// --- Column highlight helpers (header-only; cells have no background) ---
function thClass(highlighted: boolean): string {
  return highlighted ? "text-amber-400/70" : "text-slate-500";
}

// --- Header tooltip wrapper ---
function Th({
  children,
  tooltip,
  right,
  center,
  highlighted,
  groupStart,
  className,
}: {
  children: React.ReactNode;
  tooltip: string;
  right?: boolean;
  center?: boolean;
  highlighted?: boolean;
  groupStart?: boolean;
  className?: string;
}) {
  return (
    <th
      title={tooltip}
      className={`
        text-xs font-semibold uppercase tracking-wider px-3 py-3 cursor-help select-none
        ${right ? "text-right" : center ? "text-center" : "text-left"}
        ${groupStart ? "border-l border-slate-700/50" : ""}
        ${thClass(!!highlighted)}
        ${className ?? ""}
      `}
    >
      {children}
    </th>
  );
}

interface ScannerTableProps {
  stocks: HotStock[];
  selectedSymbol: string | null;
  alertRulesBySymbol: Record<string, ActiveAlertRule[]>;
  onSelectStock: (stock: HotStock) => void;
  highlightedColumns?: Set<string>;
}

export default function ScannerTable({
  stocks,
  selectedSymbol,
  alertRulesBySymbol,
  onSelectStock,
  highlightedColumns = new Set(),
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

  const hlDay   = highlightedColumns.has("day");
  const hlOpp   = highlightedColumns.has("opportunity");
  const hlFund  = highlightedColumns.has("fundamental");
  const hlVal   = highlightedColumns.has("valuation");
  const hlStab  = highlightedColumns.has("stability");
  const hlUpside = highlightedColumns.has("upside");

  return (
    <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-800">
      <table className="w-full text-sm border-collapse min-w-[920px]">
        <thead>
          <tr className="border-b border-slate-800 bg-[#0d0f14]">
            <th className="w-8 px-3 py-3"></th>

            {/* Group 1: Identity / Market */}
            <Th tooltip="Stock ticker, company name, and index membership.">Symbol</Th>
            <Th tooltip="Company sector based on FMP profile data.">Sector</Th>
            <Th tooltip="Latest synced market price from Daily Market Data Sync." right>Price</Th>
            <Th
              tooltip="Daily percentage change from the latest synced quote."
              right
              highlighted={hlDay}
            >
              Day %
            </Th>

            {/* Group 2: Calculated Scores */}
            <Th
              tooltip="Opportunity Score v2. Combines fundamental quality, valuation, growth, analyst upside, analyst sentiment, price position, and stability. Higher is better."
              right
              highlighted={hlOpp}
              groupStart
            >
              Opportunity
            </Th>
            <Th
              tooltip="Internal Fundamental Score based on growth, profitability, valuation, financial health, and stability inputs. Higher is better."
              right
              highlighted={hlFund}
            >
              Fundamental
            </Th>
            <Th
              tooltip="Internal Valuation Score based on valuation ratios such as P/E, P/S, EV/EBITDA, and PEG. Higher generally means more reasonable valuation."
              right
              highlighted={hlVal}
            >
              Valuation
            </Th>
            <Th
              tooltip="Stability Score measures risk context. Higher is better and generally means lower volatility/risk context based mainly on beta and related inputs."
              right
              highlighted={hlStab}
            >
              Stability
            </Th>

            {/* Group 3: Analyst Data */}
            <Th
              tooltip="Analyst target upside: the percentage difference between the current price and the consensus target price. Higher means analysts see more upside."
              center
              highlighted={hlUpside}
              groupStart
            >
              Analyst Upside
            </Th>
            <Th
              tooltip="Analyst recommendation summary converted to a star view. Based on stored recommendation counts."
              className="pl-5"
            >
              Rating
            </Th>

            <th className="w-8 px-2 py-3"></th>
          </tr>
        </thead>
        <tbody>
          {stocks.map((stock) => {
            const isSelected = stock.symbol === selectedSymbol;
            const hasAlert = (alertRulesBySymbol[stock.symbol]?.length ?? 0) > 0;
            const isExpanded = expandedSymbols.has(stock.symbol);

            const analystCounts = {
              strongBuy: stock.analystStrongBuyCount,
              buy: stock.analystBuyCount,
              hold: stock.analystHoldCount,
              sell: stock.analystSellCount,
              strongSell: stock.analystStrongSellCount,
              total: stock.analystCount,
            };

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
                  <td className="px-3 py-3">
                    {stock.inWatchlist ? (
                      <Star size={13} className="text-amber-400 fill-amber-400" />
                    ) : (
                      <Star size={13} className="text-slate-700" />
                    )}
                  </td>

                  {/* Symbol */}
                  <td className="px-3 py-3">
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

                  {/* Sector — truncated */}
                  <td className="px-3 py-3 max-w-[90px]">
                    <span
                      className="text-xs text-slate-400 block truncate"
                      title={stock.sector || undefined}
                    >
                      {stock.sector || "—"}
                    </span>
                  </td>

                  {/* Price */}
                  <td className="px-3 py-3 text-right">
                    <span className="text-white font-medium tabular-nums text-xs">{formatCurrency(stock.price)}</span>
                  </td>

                  {/* Day % */}
                  <td className="px-3 py-3 text-right">
                    <span className={`font-semibold tabular-nums text-xs ${stock.change >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                      {formatPercent(stock.change)}
                    </span>
                  </td>

                  {/* Opportunity — group 2 start */}
                  <td className="px-3 py-3 text-right border-l border-slate-700/30">
                    <ScoreCell value={stock.oppScore} />
                  </td>

                  {/* Fundamental */}
                  <td className="px-3 py-3 text-right">
                    <ScoreCell value={stock.fundamentalScore} />
                  </td>

                  {/* Valuation */}
                  <td className="px-3 py-3 text-right">
                    <ScoreCell value={stock.valuationScore} />
                  </td>

                  {/* Stability */}
                  <td className="px-3 py-3 text-right">
                    <ScoreCell value={stock.riskContextScore} />
                  </td>

                  {/* Analyst Upside — group 3 start, center-aligned */}
                  <td className="px-3 py-3 text-center border-l border-slate-700/30">
                    {stock.analystUpsidePercent != null ? (
                      <span className={`text-xs font-semibold tabular-nums ${stock.analystUpsidePercent >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                        {stock.analystUpsidePercent >= 0 ? "+" : ""}{Number(stock.analystUpsidePercent).toFixed(1)}%
                      </span>
                    ) : (
                      <span className="text-slate-600 text-xs">N/A</span>
                    )}
                  </td>

                  {/* Rating — two-line layout */}
                  <td className="px-3 py-3 pl-5">
                    <RatingCell rating={stock.analystRatingNormalized} counts={analystCounts} />
                  </td>

                  {/* Expand + Alert */}
                  <td className="px-2 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      {hasAlert && <Bell size={11} className="text-amber-400 shrink-0" />}
                      <button
                        onClick={(e) => toggleExpand(stock.symbol, e)}
                        title={isExpanded ? "Collapse details" : "Expand details"}
                        className="text-slate-500 hover:text-slate-300 transition-colors rounded p-0.5 shrink-0"
                      >
                        {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
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
