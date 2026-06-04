"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { X, Star, Bell, Pencil, Clock, ChevronDown, ChevronUp } from "lucide-react";
import type { HotStock, WatchlistItem, WatchStatus } from "@/src/lib/mock-data";
import { formatCurrency, formatPercent, formatRatio, formatCompactCurrency } from "@/src/lib/formatters";
import type { DrawerAction, LocalWatchlistEntry, WatchStatusLocal } from "@/src/types/drawer";
import type { ActiveAlertRule } from "@/src/lib/data/dashboard";
import {
  buildDecisionSummary,
  ratingToStars,
  buildStockDecisionNarrative,
  buildSignalCards,
  type SignalColor,
} from "@/src/lib/scoring/decision-summary";
import AddToWatchlistPanel from "./drawer/AddToWatchlistPanel";
import EditWatchlistPanel, { type EditWatchlistInitialValues } from "./drawer/EditWatchlistPanel";
import CreateAlertPanel from "./drawer/CreateAlertPanel";
import DrawerSuccessMessage from "./drawer/DrawerSuccessMessage";

// ── Formatting helpers ──────────────────────────────────────────────────────

function fmtPct(v: number | null | undefined): string {
  if (v == null) return "N/A";
  const sign = v >= 0 ? "+" : "";
  return `${sign}${Number(v).toFixed(1)}%`;
}

function fmtNum(v: number | null | undefined, decimals = 1): string {
  if (v == null) return "N/A";
  return Number(v).toFixed(decimals);
}

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "N/A";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function fmtPrice(v: number | null | undefined): string {
  if (v == null) return "N/A";
  return `$${Number(v).toFixed(2)}`;
}

function mapWatchStatus(status: WatchStatus): WatchStatusLocal {
  switch (status) {
    case "READY_TO_BUY": return "Ready to Buy";
    case "WAITING_FOR_PULLBACK": return "Waiting";
    default: return "Watching";
  }
}

// ── Signal card palette ─────────────────────────────────────────────────────

const CARD_COLORS: Record<SignalColor, { bg: string; border: string; accentBg: string; statusText: string }> = {
  emerald: { bg: "bg-emerald-500/10", border: "border-emerald-600/25", accentBg: "bg-emerald-500",  statusText: "text-emerald-300" },
  blue:    { bg: "bg-blue-500/10",    border: "border-blue-600/25",    accentBg: "bg-blue-500",     statusText: "text-blue-300"    },
  amber:   { bg: "bg-amber-500/10",   border: "border-amber-600/25",   accentBg: "bg-amber-400",    statusText: "text-amber-300"   },
  red:     { bg: "bg-red-500/10",     border: "border-red-600/25",     accentBg: "bg-red-500",      statusText: "text-red-300"     },
  slate:   { bg: "bg-slate-800/40",   border: "border-slate-700/30",   accentBg: "bg-slate-600",    statusText: "text-slate-400"   },
};

// ── Sub-components ──────────────────────────────────────────────────────────

function SectionCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-[#16181f] border border-slate-800 rounded-xl p-4 ${className}`}>
      {children}
    </div>
  );
}

function SectionLabel({ children, tooltip }: { children: React.ReactNode; tooltip?: string }) {
  return (
    <p
      className={`text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 ${tooltip ? "cursor-help" : ""}`}
      title={tooltip}
    >
      {children}
    </p>
  );
}

function ScoreBar({
  label,
  value,
  tooltip,
}: {
  label: string;
  value: number | null | undefined;
  tooltip: string;
}) {
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
    <div className="flex items-center gap-2">
      <span className="text-xs text-slate-400 w-28 shrink-0 cursor-help" title={tooltip}>{label}</span>
      <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${barColor} transition-all`}
          style={{ width: n != null ? `${n}%` : "0%" }}
        />
      </div>
      <span className={`text-xs font-semibold tabular-nums w-7 text-right ${textColor}`}>
        {n != null ? n : "N/A"}
      </span>
    </div>
  );
}

function MetricRow({
  label,
  value,
  tooltip,
  valueClass,
}: {
  label: string;
  value: string;
  tooltip: string;
  valueClass?: string;
}) {
  return (
    <div className="flex items-baseline justify-between gap-2 py-0.5 min-w-0">
      <span className="text-xs text-slate-500 cursor-help shrink-0 leading-snug" title={tooltip}>
        {label}
      </span>
      <span
        className={`text-xs font-medium text-right min-w-0 truncate leading-snug ${valueClass ?? "text-slate-300"} ${value === "N/A" ? "!text-slate-600" : ""}`}
        title={value}
      >
        {value}
      </span>
    </div>
  );
}

function SubGroupTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mt-3 mb-1.5 border-t border-slate-800/60 pt-2 first:mt-0 first:border-0 first:pt-0">
      {children}
    </p>
  );
}

function StarDisplay({ stars }: { stars: number }) {
  if (stars === 0) return <span className="text-slate-600 text-xs">N/A</span>;
  return (
    <span className="flex items-center gap-0.5 text-[14px] leading-none">
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

function MetricPill({
  label,
  value,
  tooltip,
  score,
  isUpside,
  upsideVal,
}: {
  label: string;
  value: string;
  tooltip: string;
  score?: number | null;
  isUpside?: boolean;
  upsideVal?: number | null;
}) {
  let valueColor = "text-slate-300";
  if (isUpside) {
    if (upsideVal != null)
      valueColor = upsideVal >= 10 ? "text-emerald-300" : upsideVal >= 0 ? "text-slate-300" : "text-red-300";
  } else if (score != null) {
    valueColor =
      score >= 80 ? "text-emerald-300" :
      score >= 60 ? "text-emerald-400/80" :
      score >= 40 ? "text-amber-300" :
      "text-red-400/70";
  }

  return (
    <div
      className="bg-slate-900/70 border border-slate-800 rounded-lg px-2 py-1.5 text-center cursor-help"
      title={tooltip}
    >
      <p className="text-[10px] text-slate-500 leading-tight mb-0.5 truncate">{label}</p>
      <p className={`text-sm font-bold tabular-nums leading-tight ${valueColor} ${value === "N/A" ? "!text-slate-600" : ""}`}>
        {value}
      </p>
    </div>
  );
}

function Accordion({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-[#16181f] border border-slate-800 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider hover:bg-slate-800/40 transition-colors"
      >
        {title}
        {open ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
      </button>
      {open && (
        <div className="px-4 pb-4 border-t border-slate-800/60">
          {children}
        </div>
      )}
    </div>
  );
}

// ── Alert formatting ────────────────────────────────────────────────────────

function formatAlertType(type: string): string {
  switch (type) {
    case "PRICE_ABOVE": return "Price Above";
    case "PRICE_BELOW": return "Price Below";
    case "HOT_SCORE_ABOVE": return "Hot Score Above (legacy)";
    case "OPPORTUNITY_SCORE_ABOVE": return "Opp Score Above";
    case "RELATIVE_VOLUME_ABOVE": return "Rel Vol Above";
    default: return type;
  }
}

function formatFrequency(freq: string): string {
  switch (freq) {
    case "ONCE": return "Once";
    case "DAILY": return "Daily";
    case "ALWAYS": return "Always";
    default: return freq;
  }
}

// ── Props ───────────────────────────────────────────────────────────────────

interface StockPreviewDrawerProps {
  stock: HotStock;
  isClosing: boolean;
  onClose: () => void;
  localWatchlistEntry?: LocalWatchlistEntry;
  onAddToWatchlist: (entry: LocalWatchlistEntry) => void;
  onEditWatchlist: (entry: LocalWatchlistEntry) => void;
  onRemoveFromWatchlist: () => void;
  dbWatchlistItems: WatchlistItem[];
  alertRulesBySymbol: Record<string, ActiveAlertRule[]>;
}

// ── Main component ──────────────────────────────────────────────────────────

export default function StockPreviewDrawer({
  stock,
  isClosing,
  onClose,
  localWatchlistEntry,
  onAddToWatchlist,
  onEditWatchlist,
  onRemoveFromWatchlist,
  dbWatchlistItems,
  alertRulesBySymbol,
}: StockPreviewDrawerProps) {
  const router = useRouter();
  const originalWatchlistItem = dbWatchlistItems.find((w) => w.symbol === stock.symbol);
  const existingAlerts = alertRulesBySymbol[stock.symbol] ?? [];
  const hasActiveAlerts = existingAlerts.length > 0;
  const isInWatchlist = stock.inWatchlist || !!localWatchlistEntry || !!originalWatchlistItem;

  const [activeAction, setActiveAction] = useState<DrawerAction>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setActiveAction(null);
    setSuccessMessage(null);
  }, [stock.symbol]);

  useEffect(() => {
    if (activeAction) {
      scrollContainerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [activeAction]);

  function openAction(action: DrawerAction) {
    setSuccessMessage(null);
    setActiveAction(action);
  }

  function handleAddToWatchlist(entry: LocalWatchlistEntry) {
    onAddToWatchlist(entry);
    setActiveAction(null);
    setSuccessMessage(`${stock.symbol} added to your watchlist`);
    router.refresh();
  }

  function handleEditWatchlist(entry: LocalWatchlistEntry) {
    onEditWatchlist(entry);
    setActiveAction(null);
    setSuccessMessage("Watchlist updated");
    router.refresh();
  }

  function handleRemoveFromWatchlist() {
    onRemoveFromWatchlist();
    setActiveAction(null);
    setSuccessMessage(`${stock.symbol} removed from Watchlist`);
    router.refresh();
  }

  function handleCreateAlert() {
    setActiveAction(null);
    setSuccessMessage(`Alert created for ${stock.symbol}`);
    router.refresh();
  }

  // Watchlist entry resolution (prefer optimistic local state, fall back to DB)
  const watchEntry = localWatchlistEntry ?? (originalWatchlistItem
    ? {
        watchlist: "Main Watchlist",
        reason: originalWatchlistItem.notes,
        status: mapWatchStatus(originalWatchlistItem.status),
        entryZoneLow: String(originalWatchlistItem.entryZoneLow || ""),
        entryZoneHigh: String(originalWatchlistItem.entryZoneHigh || ""),
        target: String(originalWatchlistItem.target || ""),
        stopLoss: String(originalWatchlistItem.stopLoss || ""),
      }
    : null);

  const editInitialValues: EditWatchlistInitialValues = localWatchlistEntry
    ? {
        status: localWatchlistEntry.status,
        reason: localWatchlistEntry.reason,
        entryZoneLow: localWatchlistEntry.entryZoneLow,
        entryZoneHigh: localWatchlistEntry.entryZoneHigh,
        target: localWatchlistEntry.target,
        stopLoss: localWatchlistEntry.stopLoss,
      }
    : originalWatchlistItem
    ? {
        status: mapWatchStatus(originalWatchlistItem.status),
        reason: originalWatchlistItem.notes,
        entryZoneLow: String(originalWatchlistItem.entryZoneLow || ""),
        entryZoneHigh: String(originalWatchlistItem.entryZoneHigh || ""),
        target: String(originalWatchlistItem.target || ""),
        stopLoss: String(originalWatchlistItem.stopLoss || ""),
      }
    : { status: "Watching", reason: "", entryZoneLow: "", entryZoneHigh: "", target: "", stopLoss: "" };

  // Computed data
  const { strengths, concerns, badge, badgeColor } = buildDecisionSummary(stock);
  const starCount = ratingToStars(stock);
  const narrative = buildStockDecisionNarrative(stock);
  const signalCards = buildSignalCards(stock);

  const universeTags: string[] = [];
  if (stock.isNasdaq100) universeTags.push("Nasdaq 100");
  if (stock.isSp500) universeTags.push("S&P 500");
  if (stock.isRussell1000 && !stock.isNasdaq100 && !stock.isSp500) universeTags.push("Russell 1000");

  // 52W position (0–100)
  const week52Pos =
    stock.week52High != null && stock.week52Low != null && stock.week52High !== stock.week52Low
      ? ((stock.price - stock.week52Low) / (stock.week52High - stock.week52Low)) * 100
      : null;

  // Avg positions on 52W bar
  const avg50Pos =
    stock.week52High != null && stock.week52Low != null &&
    stock.week52High !== stock.week52Low && stock.priceAvg50 != null
      ? ((stock.priceAvg50 - stock.week52Low) / (stock.week52High - stock.week52Low)) * 100
      : null;
  const avg200Pos =
    stock.week52High != null && stock.week52Low != null &&
    stock.week52High !== stock.week52Low && stock.priceAvg200 != null
      ? ((stock.priceAvg200 - stock.week52Low) / (stock.week52High - stock.week52Low)) * 100
      : null;

  // Hero gradient tied to opportunity strength
  const heroGradient =
    badge === "Strong Opportunity" ? "bg-gradient-to-b from-emerald-950/50 to-transparent"
    : badge === "Attractive"       ? "bg-gradient-to-b from-emerald-950/30 to-transparent"
    : badge === "Watch"            ? "bg-gradient-to-b from-amber-950/30 to-transparent"
    : "bg-gradient-to-b from-slate-900/30 to-transparent";

  return (
    <div
      className={`fixed bg-[#0f1015] shadow-2xl z-50 flex flex-col
        inset-0 md:inset-auto md:right-0 md:top-0 md:h-screen md:w-[520px] md:border-l md:border-slate-700/80
        ${isClosing ? "animate-drawer-slide-out" : "animate-drawer-slide-in"}
      `}
    >
      {/* ── Hero Decision Header ── */}
      <div className={`flex-none border-b border-slate-800 px-5 pt-4 pb-4 ${heroGradient}`}>

        {/* Symbol row */}
        <div className="flex items-start justify-between mb-1.5">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-white text-xl font-bold">{stock.symbol}</span>
              {isInWatchlist && (
                <Star size={14} className="text-amber-400 fill-amber-400 shrink-0" />
              )}
              {hasActiveAlerts && (
                <span className="flex items-center gap-1 text-amber-400 bg-amber-500/10 border border-amber-800/40 px-2 py-0.5 rounded-full text-xs leading-none">
                  <Bell size={9} />
                  Alert Active
                </span>
              )}
              {universeTags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs bg-slate-700/70 text-slate-300 border border-slate-700 px-2 py-0.5 rounded-full leading-none shrink-0"
                >
                  {tag}
                </span>
              ))}
            </div>
            <p className="text-slate-400 text-sm mt-0.5 truncate">{stock.name}</p>
            {(stock.sector || stock.industry) && (
              <p className="text-slate-600 text-xs mt-0.5 truncate">
                {[stock.sector, stock.industry].filter(Boolean).join(" · ")}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-white transition-colors ml-3 mt-0.5 p-1 rounded-lg hover:bg-slate-800"
          >
            <X size={18} />
          </button>
        </div>

        {/* Price + day% */}
        <div className="flex items-end gap-3 mb-2.5">
          <span className="text-white text-2xl font-bold">{formatCurrency(stock.price)}</span>
          <span className={`text-base font-semibold mb-0.5 ${stock.change >= 0 ? "text-emerald-400" : "text-red-400"}`}>
            {formatPercent(stock.change)}
          </span>
        </div>

        {/* Decision Tag badge */}
        <div className="mb-2.5">
          <span
            className={`inline-block text-xs font-semibold px-3 py-1 rounded-full cursor-help ${badgeColor}`}
            title="Rule-based tag derived from Opportunity Score, fundamentals, valuation, analyst upside, stability, and detected concerns. It is not an external analyst rating."
          >
            {badge}
          </span>
        </div>

        {/* 4 key metric pills */}
        <div className="grid grid-cols-4 gap-1.5 mb-2">
          <MetricPill
            label="Opportunity"
            value={stock.oppScore != null ? String(Math.round(stock.oppScore)) : "N/A"}
            tooltip="Opportunity Score v2. Combines fundamental quality, valuation, growth, analyst upside, analyst sentiment, price position, and stability. Higher is better."
            score={stock.oppScore}
          />
          <MetricPill
            label="Fundamental"
            value={stock.fundamentalScore != null ? String(Math.round(stock.fundamentalScore)) : "N/A"}
            tooltip="Internal Fundamental Score based on growth, profitability, valuation, financial health, and stability inputs. Higher is better."
            score={stock.fundamentalScore}
          />
          <MetricPill
            label="Upside"
            value={
              stock.analystUpsidePercent != null
                ? `${stock.analystUpsidePercent >= 0 ? "+" : ""}${stock.analystUpsidePercent.toFixed(1)}%`
                : "N/A"
            }
            tooltip="Analyst target upside: percentage difference between current price and analyst consensus target price. Higher means analysts see more upside."
            isUpside
            upsideVal={stock.analystUpsidePercent}
          />
          <MetricPill
            label="Stability"
            value={stock.riskContextScore != null ? String(Math.round(stock.riskContextScore)) : "N/A"}
            tooltip="Stability Score: higher is better, generally meaning lower volatility/risk context based on beta and related risk inputs."
            score={stock.riskContextScore}
          />
        </div>

        {stock.quoteLastSynced && (
          <div className="flex items-center gap-1 text-slate-600 text-xs">
            <Clock size={10} />
            <span>Quote synced {fmtDate(stock.quoteLastSynced)}</span>
          </div>
        )}
      </div>

      {/* ── Scrollable Content ── */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-3">

        {successMessage && (
          <DrawerSuccessMessage message={successMessage} onDismiss={() => setSuccessMessage(null)} />
        )}

        {activeAction === "add-watchlist" && (
          <AddToWatchlistPanel
            symbol={stock.symbol}
            onSuccess={handleAddToWatchlist}
            onCancel={() => setActiveAction(null)}
          />
        )}
        {activeAction === "edit-watchlist" && (
          <EditWatchlistPanel
            symbol={stock.symbol}
            initialValues={editInitialValues}
            onSuccess={handleEditWatchlist}
            onRemove={handleRemoveFromWatchlist}
            onCancel={() => setActiveAction(null)}
          />
        )}
        {activeAction === "create-alert" && (
          <CreateAlertPanel
            symbol={stock.symbol}
            currentPrice={stock.price}
            oppScore={stock.oppScore ?? 0}
            relativeVolume={stock.relativeVolume ?? 0}
            existingAlerts={existingAlerts}
            onSuccess={handleCreateAlert}
            onCancel={() => setActiveAction(null)}
          />
        )}

        {/* ── 1. Why This Stock Stands Out ── */}
        <SectionCard>
          <div className="flex items-center gap-2 mb-2.5">
            <p className="text-xs font-semibold text-slate-300 leading-tight">
              Why This Stock Stands Out
            </p>
            <span className="text-[10px] text-slate-600 bg-slate-800/60 border border-slate-700/40 px-1.5 py-0.5 rounded-full whitespace-nowrap">
              Rule-based · DB-backed
            </span>
          </div>

          {/* Headline + summary */}
          <div className="border-l-2 border-slate-700 pl-3 mb-3">
            <p className="text-sm font-semibold text-white leading-snug">{narrative.headline}</p>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">{narrative.summary}</p>
          </div>

          {/* Strengths + concerns chips */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            {strengths.map((s) => (
              <span
                key={s}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 border border-emerald-600/20 text-emerald-300/90 whitespace-nowrap"
              >
                <span className="text-emerald-500 leading-none text-[11px]">+</span>{s}
              </span>
            ))}
            {concerns.map((c) => (
              <span
                key={c}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/10 border border-amber-600/20 text-amber-300/90 whitespace-nowrap"
              >
                <span className="text-amber-500 leading-none text-[11px]">−</span>{c}
              </span>
            ))}
            {strengths.length === 0 && concerns.length === 0 && (
              <span className="text-[10px] text-slate-600 italic">No strong signals detected from synced data</span>
            )}
          </div>

          {/* Next check */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-lg px-3 py-2">
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Next check
            </p>
            <p className="text-xs text-slate-400 leading-relaxed">{narrative.mainCheck}</p>
          </div>
        </SectionCard>

        {/* ── 2. Key Decision Signals ── */}
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Key Decision Signals
          </p>
          <div className="grid grid-cols-2 gap-2">
            {signalCards.map((card, idx) => {
              const colors = CARD_COLORS[card.statusColor];
              const isLastOdd = idx === signalCards.length - 1 && signalCards.length % 2 === 1;
              return (
                <div
                  key={card.label}
                  className={`relative overflow-hidden ${colors.bg} border ${colors.border} rounded-xl p-3 ${isLastOdd ? "col-span-2" : ""}`}
                >
                  <div className={`absolute left-0 top-0 bottom-0 w-1 ${colors.accentBg}`} />
                  <div className="pl-2.5">
                    <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                      {card.label}
                    </p>
                    <p className={`text-sm font-bold leading-tight ${colors.statusText}`}>{card.status}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-tight">{card.detail}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── 3. Market Position Visual ── */}
        <SectionCard>
          <SectionLabel>Market Position</SectionLabel>

          {/* 52W visual bar */}
          {week52Pos != null ? (
            <div className="mb-4">
              <div className="flex justify-between text-[10px] text-slate-500 mb-1.5">
                <span title="52-week low">{fmtPrice(stock.week52Low)}</span>
                <span
                  className="text-slate-400 font-medium cursor-help"
                  title="Current price position within the 52-week range. 100% = at 52-week high, 0% = at 52-week low."
                >
                  {week52Pos.toFixed(0)}% of 52W range
                </span>
                <span title="52-week high">{fmtPrice(stock.week52High)}</span>
              </div>
              <div className="relative h-3 bg-slate-800 rounded-full overflow-hidden">
                {/* Gradient zone fill */}
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/15 via-slate-700/20 to-amber-500/20 rounded-full" />
                {/* 200-day avg marker */}
                {avg200Pos != null && (
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-blue-400/70"
                    style={{ left: `${Math.min(98, Math.max(2, avg200Pos))}%` }}
                    title={`200-day avg: ${fmtPrice(stock.priceAvg200)}`}
                  />
                )}
                {/* 50-day avg marker */}
                {avg50Pos != null && (
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-amber-400/70"
                    style={{ left: `${Math.min(98, Math.max(2, avg50Pos))}%` }}
                    title={`50-day avg: ${fmtPrice(stock.priceAvg50)}`}
                  />
                )}
                {/* Current price marker */}
                <div
                  className="absolute top-0 bottom-0 w-1 bg-white rounded-full"
                  style={{ left: `calc(${Math.min(98, Math.max(2, week52Pos))}% - 2px)` }}
                />
              </div>
              <div className="flex items-center gap-3 mt-1.5 text-[10px] text-slate-600">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-0.5 bg-white rounded-full inline-block" />
                  Current
                </span>
                {avg50Pos != null && (
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-0.5 bg-amber-400/70 inline-block" />
                    50-day avg
                  </span>
                )}
                {avg200Pos != null && (
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-0.5 bg-blue-400/70 inline-block" />
                    200-day avg
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div className="mb-4 h-3 bg-slate-800 rounded-full opacity-40" />
          )}

          {/* Compact stats grid */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-0">
            <MetricRow
              label="Current Price"
              value={formatCurrency(stock.price)}
              tooltip="Latest synced market price."
            />
            <MetricRow
              label="Day %"
              value={fmtPct(stock.change)}
              tooltip="Daily percentage change from the latest synced quote."
              valueClass={stock.change >= 0 ? "text-emerald-400" : "text-red-400"}
            />
            <MetricRow
              label="52W High"
              value={fmtPrice(stock.week52High)}
              tooltip="52-week price high from synced quote data."
            />
            <MetricRow
              label="52W Low"
              value={fmtPrice(stock.week52Low)}
              tooltip="52-week price low from synced quote data."
            />
            <MetricRow
              label="Avg 50"
              value={fmtPrice(stock.priceAvg50)}
              tooltip="50-day simple moving average from synced quote data."
            />
            <MetricRow
              label="Avg 200"
              value={fmtPrice(stock.priceAvg200)}
              tooltip="200-day simple moving average from synced quote data."
            />
            <MetricRow
              label="Beta"
              value={stock.beta != null ? Number(stock.beta).toFixed(2) : "N/A"}
              tooltip="Beta measures stock volatility relative to the market. Higher beta generally means higher volatility."
            />
          </div>
        </SectionCard>

        {/* ── 4. My Tracking Plan ── */}
        <SectionCard>
          <SectionLabel>My Tracking Plan</SectionLabel>

          {isInWatchlist && watchEntry ? (
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <Star size={12} className="text-amber-400 fill-amber-400" />
                  <span className="text-xs text-amber-400 font-medium">In your watchlist</span>
                  <span className="text-xs text-slate-500 bg-slate-800 border border-slate-700 px-1.5 py-0.5 rounded-full">
                    {watchEntry.status}
                  </span>
                </div>
                <button
                  onClick={() => openAction("edit-watchlist")}
                  className="flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors"
                >
                  <Pencil size={11} />
                  Edit
                </button>
              </div>

              {(watchEntry.entryZoneLow || watchEntry.target || watchEntry.stopLoss) && (
                <div className="grid grid-cols-3 gap-2 mb-2.5">
                  {watchEntry.entryZoneLow && watchEntry.entryZoneHigh && (
                    <div className="bg-slate-900/60 rounded-lg p-2">
                      <p className="text-[10px] text-slate-500 mb-0.5">Entry zone</p>
                      <p className="text-xs text-slate-300 font-medium leading-tight">
                        {formatCurrency(parseFloat(watchEntry.entryZoneLow))}–{formatCurrency(parseFloat(watchEntry.entryZoneHigh))}
                      </p>
                    </div>
                  )}
                  {watchEntry.target && (
                    <div className="bg-slate-900/60 rounded-lg p-2">
                      <p className="text-[10px] text-slate-500 mb-0.5">Target</p>
                      <p className="text-xs text-emerald-400 font-medium">
                        {formatCurrency(parseFloat(watchEntry.target))}
                      </p>
                    </div>
                  )}
                  {watchEntry.stopLoss && (
                    <div className="bg-slate-900/60 rounded-lg p-2">
                      <p className="text-[10px] text-slate-500 mb-0.5">Stop loss</p>
                      <p className="text-xs text-red-400 font-medium">
                        {formatCurrency(parseFloat(watchEntry.stopLoss))}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {watchEntry.reason && (
                <div className="bg-slate-800/60 border border-slate-700/60 rounded-lg px-3 py-2">
                  <p className="text-[10px] text-slate-500 mb-0.5">Tracking reason</p>
                  <p className="text-xs text-slate-300">{watchEntry.reason}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-2">
              <Star size={22} className="text-slate-700 mx-auto mb-2" />
              <p className="text-sm font-medium text-slate-400 mb-1">Not yet tracking {stock.symbol}</p>
              <p className="text-xs text-slate-600 mb-3 leading-relaxed">
                Add to your watchlist to save notes, entry zone, target, stop loss, and alerts.
              </p>
              <button
                onClick={() => openAction("add-watchlist")}
                className="w-full text-sm font-semibold px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors flex items-center justify-center gap-2"
              >
                <Star size={14} />
                Add to Watchlist
              </button>
            </div>
          )}
        </SectionCard>

        {/* ── 5. Alerts ── */}
        <SectionCard>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Alerts</p>
            <button
              onClick={() => openAction("create-alert")}
              className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg border transition-colors ${
                activeAction === "create-alert"
                  ? "bg-amber-700/50 border-amber-600/50 text-amber-300"
                  : "bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700"
              }`}
            >
              <Bell size={11} />
              Set Alert
            </button>
          </div>

          {hasActiveAlerts ? (
            <div className="space-y-2">
              {existingAlerts.map((alert, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <Bell size={10} className="text-amber-400/70 shrink-0" />
                  <span className="text-slate-300 font-medium">{formatAlertType(alert.type)}</span>
                  {alert.threshold !== null && (
                    <span className="text-slate-400">{alert.threshold}</span>
                  )}
                  <span className="text-slate-600 ml-auto">{formatFrequency(alert.frequency)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-600">No active alerts for {stock.symbol}.</p>
          )}
        </SectionCard>

        {/* ── 6. Evidence (collapsible) ── */}
        <div className="space-y-2">

          {/* Analyst Details */}
          <Accordion title="Analyst Details">
            <div className="pt-3">
              <div className="flex items-center gap-1.5 flex-wrap mb-2.5">
                <StarDisplay stars={starCount} />
                {starCount > 0 && (
                  <span className="text-xs tabular-nums text-slate-400">{starCount.toFixed(1)}</span>
                )}
                {starCount > 0 && <span className="text-slate-600 text-xs">·</span>}
                {stock.analystRatingNormalized ? (
                  <span
                    className={`text-xs font-semibold cursor-help ${
                      stock.analystRatingNormalized === "Strong Buy" ? "text-emerald-300" :
                      stock.analystRatingNormalized === "Buy" ? "text-emerald-400/70" :
                      stock.analystRatingNormalized === "Hold" ? "text-amber-400" :
                      stock.analystRatingNormalized === "Sell" ? "text-red-400/70" :
                      "text-slate-400"
                    }`}
                    title="Analyst recommendation summary converted to a star view using stored recommendation counts."
                  >
                    {stock.analystRatingNormalized}
                  </span>
                ) : (
                  <span className="text-slate-600 text-xs">No rating</span>
                )}
              </div>
              <div className="space-y-0.5">
                <MetricRow
                  label="Analysts"
                  value={stock.analystCount != null ? String(stock.analystCount) : "N/A"}
                  tooltip="Number of analyst recommendations included in the stored recommendation snapshot."
                />
                <MetricRow
                  label="Consensus Target"
                  value={fmtPrice(stock.analystTargetPrice)}
                  tooltip="Consensus analyst target price from the stored analyst target data."
                  valueClass={stock.analystUpsidePercent != null && stock.analystUpsidePercent > 0 ? "text-emerald-300" : undefined}
                />
                <MetricRow
                  label="Analyst Upside"
                  value={
                    stock.analystUpsidePercent != null
                      ? `${stock.analystUpsidePercent >= 0 ? "+" : ""}${Number(stock.analystUpsidePercent).toFixed(1)}%`
                      : "N/A"
                  }
                  tooltip="Analyst target upside: the percentage difference between the current price and the consensus target price. Higher means analysts see more upside."
                  valueClass={
                    stock.analystUpsidePercent != null
                      ? stock.analystUpsidePercent >= 0 ? "text-emerald-400" : "text-red-400"
                      : undefined
                  }
                />
                <MetricRow label="Target High" value={fmtPrice(stock.analystTargetHigh)} tooltip="Highest analyst price target." />
                <MetricRow label="Target Median" value={fmtPrice(stock.analystTargetMedian)} tooltip="Median analyst price target." />
                <MetricRow label="Target Low" value={fmtPrice(stock.analystTargetLow)} tooltip="Lowest analyst price target." />
                <MetricRow label="Synced" value={fmtDate(stock.analystLastSyncedAt)} tooltip="Date when analyst data was last synced from providers." />
                <MetricRow label="Source" value={stock.analystSource ?? "N/A"} tooltip="Data provider for analyst data." />
              </div>
            </div>
          </Accordion>

          {/* All Scores */}
          <Accordion title="All Scores">
            <div className="pt-3 space-y-1.5">
              <ScoreBar
                label="Opportunity"
                value={stock.oppScore}
                tooltip="Opportunity Score v2. Combines fundamental quality, valuation, growth, analyst upside, analyst sentiment, price position, and stability. Higher is better."
              />
              <ScoreBar
                label="Fundamental"
                value={stock.fundamentalScore}
                tooltip="Internal Fundamental Score based on growth, profitability, valuation, financial health, and stability inputs. Higher is better."
              />
              <ScoreBar
                label="Growth"
                value={stock.growthScore}
                tooltip="Score for revenue and earnings growth trajectory. Higher means stronger growth metrics."
              />
              <ScoreBar
                label="Profitability"
                value={stock.profitabilityScore}
                tooltip="Score for profitability including margins, ROE, and ROA. Higher means better profitability."
              />
              <ScoreBar
                label="Valuation"
                value={stock.valuationScore}
                tooltip="Score for how reasonably valued the stock is based on P/E, P/S, EV/EBITDA, and PEG. Higher means more reasonable valuation."
              />
              <ScoreBar
                label="Financial Health"
                value={stock.financialHealthScore}
                tooltip="Score for balance sheet and liquidity strength. Higher means stronger financial health."
              />
              <ScoreBar
                label="Stability"
                value={stock.riskContextScore}
                tooltip="Stability Score measures the stock's risk context. Higher is better: a higher score generally means lower volatility/risk context based mainly on beta and related risk inputs."
              />
              <div className="mt-2 pt-2 border-t border-slate-800/60 space-y-0.5">
                <MetricRow
                  label="Fund. Version"
                  value={stock.scoreVersion ?? "N/A"}
                  tooltip="Version of the Fundamental Score calculation formula."
                />
                <MetricRow
                  label="Fund. Calculated"
                  value={fmtDate(stock.scoreLastCalculated)}
                  tooltip="Date when Fundamental Score was last calculated by FomoFilter."
                />
                <MetricRow
                  label="Opp. Version"
                  value={stock.oppScoreVersion ?? "N/A"}
                  tooltip="Version of the Opportunity Score calculation formula."
                />
                <MetricRow
                  label="Opp. Calculated"
                  value={fmtDate(stock.oppCalculatedAt)}
                  tooltip="Date when Opportunity Score v2 was last calculated by FomoFilter."
                />
              </div>
            </div>
          </Accordion>

          {/* Fundamentals */}
          <Accordion title="Fundamentals">
            <div className="pt-3">
              <SubGroupTitle>Valuation</SubGroupTitle>
              <div className="space-y-0.5">
                <MetricRow label="P/E" value={formatRatio(stock.peRatio)} tooltip="Price-to-Earnings ratio TTM. Lower generally means cheaper relative to earnings." />
                <MetricRow label="Forward P/E" value={formatRatio(stock.forwardPE)} tooltip="Price-to-Forward-Earnings estimate. Lower generally means cheaper relative to expected earnings." />
                <MetricRow label="PEG" value={formatRatio(stock.pegRatio, 2)} tooltip="Price/Earnings-to-Growth ratio. Values near or below 1 may indicate reasonable valuation relative to growth." />
                <MetricRow label="Forward PEG" value={formatRatio(stock.forwardPEG, 2)} tooltip="Forward PEG ratio based on forward earnings estimate." />
                <MetricRow label="P/S" value={formatRatio(stock.ps, 2)} tooltip="Price-to-Sales ratio TTM. Lower may indicate more reasonable valuation relative to revenue." />
                <MetricRow label="P/B" value={formatRatio(stock.pb, 2)} tooltip="Price-to-Book ratio. Lower may indicate stock is cheaper relative to book value." />
                <MetricRow label="EV/EBITDA" value={formatRatio(stock.evToEbitda, 1)} tooltip="Enterprise Value to EBITDA. A lower value often indicates more reasonable valuation." />
              </div>

              <SubGroupTitle>Growth &amp; Profitability</SubGroupTitle>
              <div className="space-y-0.5">
                <MetricRow
                  label="Rev Growth TTM"
                  value={fmtPct(stock.revenueGrowth)}
                  tooltip="Year-over-year revenue growth for the trailing twelve months."
                  valueClass={stock.revenueGrowth != null ? (stock.revenueGrowth >= 0 ? "text-emerald-400/80" : "text-red-400/80") : undefined}
                />
                <MetricRow
                  label="EPS Growth TTM"
                  value={fmtPct(stock.epsGrowth)}
                  tooltip="Year-over-year earnings per share growth for the trailing twelve months."
                  valueClass={stock.epsGrowth != null ? (stock.epsGrowth >= 0 ? "text-emerald-400/80" : "text-red-400/80") : undefined}
                />
                <MetricRow
                  label="Rev Growth 3Y"
                  value={fmtPct(stock.revenueGrowth3Y)}
                  tooltip="3-year compound annual revenue growth rate."
                  valueClass={stock.revenueGrowth3Y != null ? (stock.revenueGrowth3Y >= 0 ? "text-emerald-400/80" : "text-red-400/80") : undefined}
                />
                <MetricRow
                  label="EPS Growth 3Y"
                  value={fmtPct(stock.epsGrowth3Y)}
                  tooltip="3-year compound annual EPS growth rate."
                  valueClass={stock.epsGrowth3Y != null ? (stock.epsGrowth3Y >= 0 ? "text-emerald-400/80" : "text-red-400/80") : undefined}
                />
                <MetricRow label="Gross Margin" value={fmtPct(stock.grossMargin)} tooltip="Gross profit as a percentage of revenue. Higher means better gross profitability." />
                <MetricRow label="Operating Margin" value={fmtPct(stock.operatingMargin)} tooltip="Operating profit as a percentage of revenue. Higher means more operational efficiency." />
                <MetricRow label="Net Margin" value={fmtPct(stock.netMargin)} tooltip="Net profit as a percentage of revenue. Higher means more bottom-line profitability." />
                <MetricRow
                  label="ROE"
                  value={stock.roe != null ? `${fmtNum(stock.roe)}%` : "N/A"}
                  tooltip="Return on Equity — net income divided by shareholders' equity. Higher generally means better use of equity capital."
                />
                <MetricRow
                  label="ROA"
                  value={stock.roa != null ? `${fmtNum(stock.roa)}%` : "N/A"}
                  tooltip="Return on Assets — net income divided by total assets. Higher generally means better asset efficiency."
                />
              </div>

              <SubGroupTitle>Financial Health</SubGroupTitle>
              <div className="space-y-0.5">
                <MetricRow label="Debt / Equity" value={formatRatio(stock.debtToEquity, 2)} tooltip="Total debt divided by shareholders' equity. Lower generally means less leverage." />
                <MetricRow
                  label="Current Ratio"
                  value={stock.currentRatio != null ? fmtNum(stock.currentRatio) : "N/A"}
                  tooltip="Current assets divided by current liabilities. A ratio above 1 generally indicates good short-term liquidity."
                />
                <MetricRow
                  label="Quick Ratio"
                  value={stock.quickRatio != null ? fmtNum(stock.quickRatio) : "N/A"}
                  tooltip="Like current ratio but excluding inventory. A ratio above 1 generally indicates strong liquidity."
                />
                <MetricRow
                  label="Interest Coverage"
                  value={stock.interestCoverage != null ? `${fmtNum(stock.interestCoverage)}x` : "N/A"}
                  tooltip="EBIT divided by interest expense. Higher means the company can more easily cover its interest payments."
                />
              </div>
            </div>
          </Accordion>

          {/* Company & Freshness */}
          <Accordion title="Company &amp; Data Freshness">
            <div className="pt-3">
              {/* Company info */}
              <div className="mb-3">
                <p className="text-xs font-medium text-slate-200 mb-0.5">{stock.name}</p>
                {(stock.sector || stock.industry) && (
                  <p className="text-xs text-slate-500 mb-1">
                    {[stock.sector, stock.industry].filter(Boolean).join(" · ")}
                  </p>
                )}
                {stock.marketCapFull != null && (
                  <p className="text-xs text-slate-500 mb-1">
                    Market Cap <span className="text-slate-300 font-medium">{formatCompactCurrency(stock.marketCapFull)}</span>
                  </p>
                )}
                {stock.description ? (
                  <p
                    className="text-xs text-slate-400 leading-relaxed mt-1"
                    style={{ display: "-webkit-box", WebkitLineClamp: 4, WebkitBoxOrient: "vertical", overflow: "hidden" }}
                    title={stock.description}
                  >
                    {stock.description}
                  </p>
                ) : (
                  <p className="text-xs text-slate-600 italic mt-1">Description not available</p>
                )}
              </div>

              {/* Data freshness */}
              <div className="border-t border-slate-800/60 pt-3 space-y-0.5">
                <MetricRow label="Quote Synced" value={fmtDate(stock.quoteLastSynced)} tooltip="Date when price quote data was last synced." />
                <MetricRow label="Quote Source" value={stock.quoteSource ?? "N/A"} tooltip="Data provider for price quote." />
                <MetricRow label="Metrics Synced" value={fmtDate(stock.metricsLastSynced)} tooltip="Date when fundamental metrics were last synced." />
                <MetricRow label="Metrics Source" value={stock.metricsSource ?? "N/A"} tooltip="Data provider for fundamental metrics." />
                <MetricRow label="Analyst Synced" value={fmtDate(stock.analystLastSyncedAt)} tooltip="Date when analyst data was last synced." />
                <MetricRow label="Analyst Source" value={stock.analystSource ?? "N/A"} tooltip="Data provider for analyst data." />
                <MetricRow label="Opp. Calculated" value={fmtDate(stock.oppCalculatedAt)} tooltip="Date when Opportunity Score v2 was last calculated by FomoFilter." />
                <MetricRow label="Fund. Calculated" value={fmtDate(stock.scoreLastCalculated)} tooltip="Date when Fundamental Score was last calculated by FomoFilter." />
              </div>
            </div>
          </Accordion>

        </div>

        {/* Bottom spacer */}
        <div className="h-2" />
      </div>

      {/* ── Sticky Actions Footer ── */}
      <div className="flex-none border-t border-slate-800 px-4 md:px-5 py-3 md:py-4 bg-[#0f1015]">
        {isInWatchlist ? (
          <div className="flex items-center gap-2">
            <button
              onClick={() => openAction("edit-watchlist")}
              className={`flex-1 min-w-0 text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
                activeAction === "edit-watchlist"
                  ? "bg-slate-600 border border-slate-500 text-white"
                  : "bg-slate-700 hover:bg-slate-600 text-slate-200 border border-slate-600"
              }`}
            >
              <Pencil size={13} />
              Edit Watchlist
            </button>
            <button
              onClick={() => openAction("create-alert")}
              className={`px-3 py-2.5 text-sm font-medium rounded-lg border transition-colors flex items-center gap-1.5 ${
                activeAction === "create-alert"
                  ? "bg-amber-700/50 border-amber-600/50 text-amber-300"
                  : "bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700"
              }`}
            >
              <Bell size={13} />
              Alert
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={() => openAction("add-watchlist")}
              className={`flex-1 min-w-0 text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
                activeAction === "add-watchlist"
                  ? "bg-emerald-700 text-white"
                  : "bg-emerald-600 hover:bg-emerald-500 text-white"
              }`}
            >
              <Star size={14} />
              Add to Watchlist
            </button>
            <button
              onClick={() => openAction("create-alert")}
              className={`px-3 py-2.5 text-sm font-medium rounded-lg border transition-colors flex items-center gap-1.5 ${
                activeAction === "create-alert"
                  ? "bg-amber-700/50 border-amber-600/50 text-amber-300"
                  : "bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700"
              }`}
            >
              <Bell size={13} />
              Alert
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
