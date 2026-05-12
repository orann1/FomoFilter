"use client";

import { useEffect, useRef, useState } from "react";
import {
  X,
  Star,
  Sparkles,
  TrendingUp,
  Clock,
  TriangleAlert,
  Flame,
  Target,
  Bell,
  Pencil,
} from "lucide-react";
import {
  mockStockDrawerDetails,
  mockWatchlist,
  type HotStock,
  type WatchStatus,
} from "@/src/lib/mock-data";
import { formatCurrency, formatPercent, formatSignedNumber } from "@/src/lib/formatters";
import { type DrawerAction, type LocalWatchlistEntry, type WatchStatusLocal } from "@/src/types/drawer";
import AddToWatchlistPanel from "./drawer/AddToWatchlistPanel";
import EditWatchlistPanel, { type EditWatchlistInitialValues } from "./drawer/EditWatchlistPanel";
import CreateAlertPanel from "./drawer/CreateAlertPanel";
import DrawerSuccessMessage from "./drawer/DrawerSuccessMessage";

const sentimentColors = {
  bullish: "text-emerald-400 bg-emerald-500/10 border border-emerald-800/50",
  cautious: "text-amber-400 bg-amber-500/10 border border-amber-800/50",
  bearish: "text-red-400 bg-red-500/10 border border-red-800/50",
};

function SectionCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-[#16181f] border border-slate-800 rounded-xl p-4 ${className}`}>
      {children}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">{children}</p>
  );
}

function BreakdownBar({ label, value }: { label: string; value: number }) {
  const barColor = value >= 80 ? "bg-emerald-500" : value >= 60 ? "bg-amber-500" : "bg-slate-600";
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-slate-400 w-28 shrink-0">{label}</span>
      <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${barColor} transition-all`} style={{ width: `${value}%` }} />
      </div>
      <span className="text-xs text-slate-300 w-7 text-right">{value}</span>
    </div>
  );
}

function mapWatchStatus(status: WatchStatus): WatchStatusLocal {
  switch (status) {
    case "READY_TO_BUY":
      return "Ready to Buy";
    case "WAITING_FOR_PULLBACK":
      return "Waiting";
    default:
      return "Watching";
  }
}

interface StockPreviewDrawerProps {
  stock: HotStock;
  isClosing: boolean;
  onClose: () => void;
  localWatchlistEntry?: LocalWatchlistEntry;
  onAddToWatchlist: (entry: LocalWatchlistEntry) => void;
  onEditWatchlist: (entry: LocalWatchlistEntry) => void;
}

export default function StockPreviewDrawer({
  stock,
  isClosing,
  onClose,
  localWatchlistEntry,
  onAddToWatchlist,
  onEditWatchlist,
}: StockPreviewDrawerProps) {
  const detail = mockStockDrawerDetails[stock.symbol];
  const originalWatchlistItem = mockWatchlist.find((w) => w.symbol === stock.symbol);

  const isInWatchlist = stock.inWatchlist || !!localWatchlistEntry;

  const [activeAction, setActiveAction] = useState<DrawerAction>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setActiveAction(null);
    setSuccessMessage(null);
  }, [stock.symbol]);

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    if (activeAction) {
      scrollContainerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [activeAction]);

  if (!detail) return null;

  function openAction(action: DrawerAction) {
    setSuccessMessage(null);
    setActiveAction(action);
  }

  function handleAddToWatchlist(entry: LocalWatchlistEntry) {
    onAddToWatchlist(entry);
    setActiveAction(null);
    setSuccessMessage(`${stock.symbol} added to your watchlist`);
  }

  function handleEditWatchlist(entry: LocalWatchlistEntry) {
    onEditWatchlist(entry);
    setActiveAction(null);
    setSuccessMessage("Watchlist updated");
  }

  function handleCreateAlert() {
    setActiveAction(null);
    setSuccessMessage(`Alert created for ${stock.symbol}`);
  }

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
        entryZoneLow: String(originalWatchlistItem.entryZoneLow),
        entryZoneHigh: String(originalWatchlistItem.entryZoneHigh),
        target: String(originalWatchlistItem.target),
        stopLoss: String(originalWatchlistItem.stopLoss),
      }
    : { status: "Watching", reason: "", entryZoneLow: "", entryZoneHigh: "", target: "", stopLoss: "" };

  // Merged watchlist display data
  const watchEntry = localWatchlistEntry ?? (originalWatchlistItem
    ? {
        watchlist: "Main Watchlist",
        reason: originalWatchlistItem.notes,
        status: mapWatchStatus(originalWatchlistItem.status),
        entryZoneLow: String(originalWatchlistItem.entryZoneLow),
        entryZoneHigh: String(originalWatchlistItem.entryZoneHigh),
        target: String(originalWatchlistItem.target),
        stopLoss: String(originalWatchlistItem.stopLoss),
      }
    : null);

  return (
    <div
      className={`fixed bg-[#0f1015] shadow-2xl z-50 flex flex-col
        inset-0 md:inset-auto md:right-0 md:top-0 md:h-screen md:w-[520px] md:border-l md:border-slate-700/80
        ${isClosing || !mounted ? "translate-x-full opacity-0" : "translate-x-0 opacity-100"}
      `}
      style={{ transition: "transform 260ms cubic-bezier(0.16, 1, 0.3, 1), opacity 260ms cubic-bezier(0.16, 1, 0.3, 1)" }}
    >
      {/* ── Sticky Header ── */}
      <div className="flex-none border-b border-slate-800 px-5 pt-4 pb-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-white text-xl font-bold">{stock.symbol}</span>
              {isInWatchlist && (
                <Star size={14} className="text-amber-400 fill-amber-400 shrink-0" />
              )}
              <span className="text-xs bg-slate-700/70 text-slate-300 border border-slate-700 px-2 py-0.5 rounded-full shrink-0">
                {stock.setup}
              </span>
            </div>
            <p className="text-slate-400 text-sm mt-0.5 truncate">{stock.name}</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-white transition-colors ml-3 mt-0.5 p-1 rounded-lg hover:bg-slate-800"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex items-end gap-3 mb-2.5">
          <span className="text-white text-2xl font-bold">{formatCurrency(stock.price)}</span>
          <span
            className={`text-base font-semibold mb-0.5 ${stock.change >= 0 ? "text-emerald-400" : "text-red-400"}`}
          >
            {formatPercent(stock.change)}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-400 bg-slate-800/60 border border-slate-700/60 px-2.5 py-1 rounded-full leading-none">
            Signal: {detail.signalQuality}
          </span>
          <span className="text-amber-400 bg-amber-500/10 border border-amber-800/40 px-2.5 py-1 rounded-full leading-none">
            Risk: {stock.risk}
          </span>
          <span className="text-slate-400 bg-slate-800/60 border border-slate-700/60 px-2.5 py-1 rounded-full leading-none">
            US Stocks
          </span>
          <span className="text-slate-600 flex items-center gap-1 pl-0.5">
            <span className="text-slate-700">·</span>
            <Clock size={10} />
            Updated {detail.lastUpdatedMinutes}m ago
          </span>
        </div>
      </div>

      {/* ── Scrollable Content ── */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-4">

        {/* Success message */}
        {successMessage && (
          <DrawerSuccessMessage
            message={successMessage}
            onDismiss={() => setSuccessMessage(null)}
          />
        )}

        {/* Action panels — only one at a time */}
        {activeAction === "add-watchlist" && (
          <AddToWatchlistPanel
            symbol={stock.symbol}
            suggestedReason={detail.suggestedTrackingReason}
            onSubmit={handleAddToWatchlist}
            onCancel={() => setActiveAction(null)}
          />
        )}
        {activeAction === "edit-watchlist" && (
          <EditWatchlistPanel
            symbol={stock.symbol}
            initialValues={editInitialValues}
            onSubmit={handleEditWatchlist}
            onCancel={() => setActiveAction(null)}
          />
        )}
        {activeAction === "create-alert" && (
          <CreateAlertPanel
            symbol={stock.symbol}
            currentPrice={stock.price}
            hotScore={stock.hot}
            oppScore={stock.opp}
            relativeVolume={stock.relativeVolume}
            onSubmit={handleCreateAlert}
            onCancel={() => setActiveAction(null)}
          />
        )}

        {/* 1. Decision Snapshot */}
        <SectionCard>
          <SectionTitle>Decision Snapshot</SectionTitle>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="text-xs text-slate-500 mb-0.5">Setup</p>
              <p className="text-sm text-white font-medium">{stock.setup}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-0.5">Suggested action</p>
              <p className="text-sm text-emerald-400 font-medium">{detail.suggestedAction}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-0.5">Main catalyst</p>
              <p className="text-sm text-white font-medium">{stock.catalyst}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-0.5">FOMO risk</p>
              <p className="text-sm text-amber-400 font-medium">{detail.fomoRisk}</p>
            </div>
            <div className="col-span-2">
              <p className="text-xs text-slate-500 mb-0.5">Entry context</p>
              <p className="text-sm text-slate-300">{detail.entryContext}</p>
            </div>
          </div>
        </SectionCard>

        {/* 2. Score Cards */}
        <div className="grid grid-cols-2 gap-3">
          <SectionCard>
            <div className="flex items-center gap-1.5 mb-2">
              <Flame size={13} className="text-orange-400" />
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Hot Score</p>
            </div>
            <div className="flex items-end gap-2 mb-1">
              <span className="text-3xl font-bold text-orange-300">{stock.hot}</span>
              <span
                className={`text-sm font-semibold mb-1 ${detail.hotDelta >= 0 ? "text-emerald-400" : "text-red-400"}`}
              >
                {formatSignedNumber(detail.hotDelta)}
              </span>
            </div>
            <p className="text-xs text-slate-500 leading-snug">{detail.hotScoreExplain}</p>
          </SectionCard>

          <SectionCard>
            <div className="flex items-center gap-1.5 mb-2">
              <Target size={13} className="text-emerald-400" />
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Opp Score</p>
            </div>
            <div className="flex items-end gap-2 mb-1">
              <span className="text-3xl font-bold text-emerald-300">{stock.opp}</span>
              <span
                className={`text-sm font-semibold mb-1 ${detail.oppDelta >= 0 ? "text-emerald-400" : "text-red-400"}`}
              >
                {formatSignedNumber(detail.oppDelta)}
              </span>
            </div>
            <p className="text-xs text-slate-500 leading-snug">{detail.oppScoreExplain}</p>
          </SectionCard>
        </div>

        {/* 3. AI Insight */}
        <SectionCard>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5">
              <Sparkles size={13} className="text-purple-400" />
              <SectionTitle>AI Insight</SectionTitle>
            </div>
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-medium ${sentimentColors[detail.aiSentiment]}`}
            >
              {detail.aiSentiment}
            </span>
          </div>
          <div className="space-y-2.5">
            <div>
              <p className="text-xs text-purple-400 font-medium mb-0.5">What&apos;s happening</p>
              <p className="text-xs text-slate-300 leading-relaxed">{detail.aiWhatsHappening}</p>
            </div>
            <div>
              <p className="text-xs text-purple-400 font-medium mb-0.5">What it means</p>
              <p className="text-xs text-slate-300 leading-relaxed">{detail.aiWhatItMeans}</p>
            </div>
            <div>
              <p className="text-xs text-purple-400 font-medium mb-0.5">What to watch</p>
              <p className="text-xs text-slate-300 leading-relaxed">{detail.aiWhatToWatch}</p>
            </div>
          </div>
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-800">
            <p className="text-xs text-slate-600">Generated {detail.aiGeneratedMinutes}m ago</p>
            <p className="text-xs text-slate-600">Research support only. Not financial advice.</p>
          </div>
        </SectionCard>

        {/* 4. Price Context */}
        <SectionCard>
          <div className="flex items-center justify-between mb-3">
            <SectionTitle>Price Context</SectionTitle>
            <div className="flex gap-1">
              {["1D", "1W", "1M", "6M"].map((tf) => (
                <button
                  key={tf}
                  className={`text-xs px-2 py-0.5 rounded ${
                    tf === "1M" ? "bg-slate-700 text-white" : "text-slate-500 hover:text-slate-300"
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>
          </div>

          <div className="relative h-16 mb-4">
            <svg viewBox="0 0 400 60" className="w-full h-full" preserveAspectRatio="none">
              <defs>
                <linearGradient id={`grad-${stock.symbol}`} x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="0%"
                    stopColor={stock.change >= 0 ? "#10b981" : "#ef4444"}
                    stopOpacity="0.3"
                  />
                  <stop
                    offset="100%"
                    stopColor={stock.change >= 0 ? "#10b981" : "#ef4444"}
                    stopOpacity="0"
                  />
                </linearGradient>
              </defs>
              <path
                d="M 0 45 C 40 42, 80 38, 120 35 S 180 28, 220 25 S 280 15, 320 18 S 370 12, 400 8"
                fill="none"
                stroke={stock.change >= 0 ? "#10b981" : "#ef4444"}
                strokeWidth="2"
              />
              <path
                d="M 0 45 C 40 42, 80 38, 120 35 S 180 28, 220 25 S 280 15, 320 18 S 370 12, 400 8 L 400 60 L 0 60 Z"
                fill={`url(#grad-${stock.symbol})`}
              />
            </svg>
          </div>

          <div className="grid grid-cols-3 gap-3 text-xs">
            <div>
              <p className="text-slate-500 mb-0.5">Entry zone</p>
              <p className="text-slate-300 font-medium">
                {formatCurrency(detail.entryZoneLow)} – {formatCurrency(detail.entryZoneHigh)}
              </p>
            </div>
            <div>
              <p className="text-slate-500 mb-0.5">Target</p>
              <p className="text-emerald-400 font-medium">{formatCurrency(detail.target)}</p>
            </div>
            <div>
              <p className="text-slate-500 mb-0.5">Distance</p>
              <p className="text-emerald-400 font-medium">{detail.distanceToTarget}</p>
            </div>
          </div>
          <p className="text-xs text-amber-400 mt-2 flex items-center gap-1">
            <TriangleAlert size={10} />
            {detail.priceEntryContext}
          </p>
        </SectionCard>

        {/* 5. Score Breakdown */}
        <SectionCard>
          <SectionTitle>Why these scores?</SectionTitle>
          <div className="mb-4">
            <p className="text-xs text-orange-400 font-medium mb-2 flex items-center gap-1">
              <Flame size={11} /> Hot Score breakdown
            </p>
            <div className="space-y-2">
              <BreakdownBar label="Momentum" value={detail.hotBreakdown.momentum} />
              <BreakdownBar label="Volume Heat" value={detail.hotBreakdown.volumeHeat} />
              <BreakdownBar label="Catalyst" value={detail.hotBreakdown.catalyst} />
              <BreakdownBar label="Technicals" value={detail.hotBreakdown.technicals} />
            </div>
          </div>
          <div>
            <p className="text-xs text-emerald-400 font-medium mb-2 flex items-center gap-1">
              <Target size={11} /> Opportunity Score breakdown
            </p>
            <div className="space-y-2">
              <BreakdownBar label="Analyst Upside" value={detail.oppBreakdown.analystUpside} />
              <BreakdownBar label="Fundamentals" value={detail.oppBreakdown.fundamentals} />
              <BreakdownBar label="Valuation" value={detail.oppBreakdown.valuation} />
              <BreakdownBar label="Entry Quality" value={detail.oppBreakdown.entryQuality} />
            </div>
          </div>
        </SectionCard>

        {/* 6. Main Catalyst */}
        <SectionCard>
          <SectionTitle>Main Catalyst</SectionTitle>
          <div className="flex items-start justify-between mb-2">
            <div>
              <p className="text-sm text-white font-semibold">{detail.catalystType}</p>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">{detail.catalystExplanation}</p>
            </div>
          </div>
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-800">
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                detail.catalystConfidence === "High"
                  ? "text-emerald-400 bg-emerald-500/10 border border-emerald-800/50"
                  : detail.catalystConfidence === "Medium"
                  ? "text-amber-400 bg-amber-500/10 border border-amber-800/50"
                  : "text-slate-400 bg-slate-700/40"
              }`}
            >
              Confidence: {detail.catalystConfidence}
            </span>
            <p className="text-xs text-slate-600">
              {detail.catalystSource} · {detail.catalystHoursAgo}h ago
            </p>
          </div>
        </SectionCard>

        {/* 7. Watch Context */}
        <SectionCard>
          <SectionTitle>Watch Context</SectionTitle>
          {isInWatchlist && watchEntry ? (
            <div>
              <div className="flex items-center gap-1.5 mb-3">
                <Star size={12} className="text-amber-400 fill-amber-400" />
                <span className="text-xs text-amber-400 font-medium">In your watchlist</span>
                <span className="text-xs text-slate-500 bg-slate-800 border border-slate-700 px-1.5 py-0.5 rounded-full ml-1">
                  {watchEntry.status}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 mb-3">
                {watchEntry.entryZoneLow && watchEntry.entryZoneHigh && (
                  <div>
                    <p className="text-xs text-slate-500 mb-0.5">Entry zone</p>
                    <p className="text-xs text-slate-300 font-medium">
                      {formatCurrency(parseFloat(watchEntry.entryZoneLow))} –{" "}
                      {formatCurrency(parseFloat(watchEntry.entryZoneHigh))}
                    </p>
                  </div>
                )}
                {watchEntry.target && (
                  <div>
                    <p className="text-xs text-slate-500 mb-0.5">Target</p>
                    <p className="text-xs text-emerald-400 font-medium">
                      {formatCurrency(parseFloat(watchEntry.target))}
                    </p>
                  </div>
                )}
                {watchEntry.stopLoss && (
                  <div>
                    <p className="text-xs text-slate-500 mb-0.5">Stop loss</p>
                    <p className="text-xs text-red-400 font-medium">
                      {formatCurrency(parseFloat(watchEntry.stopLoss))}
                    </p>
                  </div>
                )}
                {detail.watchSince && (
                  <div>
                    <p className="text-xs text-slate-500 mb-0.5">Since added</p>
                    <p className="text-xs text-slate-300 font-medium">{detail.watchSince}</p>
                  </div>
                )}
              </div>
              {watchEntry.reason && (
                <div className="bg-slate-800/60 border border-slate-700/60 rounded-lg px-3 py-2">
                  <p className="text-xs text-slate-500 mb-0.5">Tracking reason</p>
                  <p className="text-xs text-slate-300">{watchEntry.reason}</p>
                </div>
              )}
              {!watchEntry.reason && detail.latestPersonalSignal && (
                <div className="bg-slate-800/60 border border-slate-700/60 rounded-lg px-3 py-2">
                  <p className="text-xs text-slate-500 mb-0.5">Latest signal</p>
                  <p className="text-xs text-slate-300">{detail.latestPersonalSignal}</p>
                </div>
              )}
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <Star size={12} className="text-slate-600" />
                <span className="text-xs text-slate-500 font-medium">Not in your watchlist yet</span>
              </div>
              {detail.suggestedTrackingReason && (
                <div className="bg-slate-800/60 border border-slate-700/60 rounded-lg px-3 py-2 mt-2">
                  <p className="text-xs text-slate-500 mb-0.5">Why track it?</p>
                  <p className="text-xs text-slate-300">{detail.suggestedTrackingReason}</p>
                </div>
              )}
            </div>
          )}
        </SectionCard>

      </div>

      {/* ── Sticky CTA Footer ── */}
      <div className="flex-none border-t border-slate-800 px-4 md:px-5 py-3 md:py-4 bg-[#0f1015]">
        {isInWatchlist ? (
          <div className="flex items-center gap-2 flex-wrap">
            <button className="flex-1 min-w-0 bg-slate-100 hover:bg-white text-slate-900 text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors flex items-center justify-center gap-1.5">
              <TrendingUp size={14} />
              View Full Details
            </button>
            <button
              onClick={() => openAction("edit-watchlist")}
              className={`px-3 py-2.5 text-sm font-medium rounded-lg border transition-colors flex items-center gap-1.5 ${
                activeAction === "edit-watchlist"
                  ? "bg-slate-600 border-slate-500 text-white"
                  : "bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700"
              }`}
            >
              <Pencil size={13} />
              Edit
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
          <div className="flex items-center gap-2 flex-wrap">
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
            <button className="px-3 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium rounded-lg border border-slate-700 transition-colors">
              Details
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
