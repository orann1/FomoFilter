"use client";

import { useState, useMemo, useCallback, useRef } from "react";
import {
  Clock,
  AlertTriangle,
  Zap,
  Repeat2,
  TrendingDown,
  Target,
  Layers,
  BarChart2,
  Flame,
  Activity,
  Search,
  X,
  Radio,
  Crosshair,
  ChevronDown,
  ChevronUp,
  Star,
  CheckCircle,
  XCircle,
  TrendingUp,
  Database,
  Calendar,
  AlertCircle,
} from "lucide-react";
import type {
  RadarCandidate,
  RadarCandidateSnapshot,
  RadarCategory,
  RadarTimeWindow,
  RadarTrendStatus,
} from "@/src/types/opportunity-radar";
import type { OpportunityRadarPageData, RadarCandidateView } from "@/src/lib/data/opportunity-radar";

// ─── Lens type (UI-only grouping) ────────────────────────────────────────────

type RadarLens = "all" | "attention_spike" | "overreaction" | "value_gap" | "future_theme";

type LensMeta = {
  label: string;
  Icon: React.ComponentType<{ size?: number; className?: string }>;
  categories: RadarCategory[];
};

const LENS: Record<RadarLens, LensMeta> = {
  all: { label: "All Signals", Icon: Radio, categories: [] },
  attention_spike: {
    label: "Attention Spike",
    Icon: Zap,
    categories: ["unusual_attention", "pre_breakout"],
  },
  overreaction: {
    label: "Overreaction",
    Icon: TrendingDown,
    categories: ["beaten_down"],
  },
  value_gap: {
    label: "Value Gap",
    Icon: Target,
    categories: ["possibly_undervalued"],
  },
  future_theme: {
    label: "Future Theme",
    Icon: Layers,
    categories: ["emerging_theme", "speculative_upside"],
  },
};

const LENS_ORDER: RadarLens[] = ["attention_spike", "overreaction", "value_gap", "future_theme"];

const LENS_EXPLANATIONS: Record<RadarLens, { text: string; color: string }> = {
  all: { text: "", color: "" },
  attention_spike: {
    text: "Unusual attention, coverage, or signal activity before the story is fully obvious.",
    color: "border-indigo-800/40 bg-indigo-900/15 text-indigo-50",
  },
  overreaction: {
    text: "Sharp declines or negative reactions that may deserve a second look.",
    color: "border-amber-800/40 bg-amber-900/15 text-amber-50",
  },
  value_gap: {
    text: "Stocks where valuation signals may look disconnected from business quality.",
    color: "border-emerald-800/40 bg-emerald-900/15 text-emerald-50",
  },
  future_theme: {
    text: "Names connected to emerging sectors, narratives, or speculative future growth.",
    color: "border-purple-800/40 bg-purple-900/15 text-purple-50",
  },
};

// ─── Category meta (used for card badges only) ────────────────────────────────

type CatMeta = {
  label: string;
  Icon: React.ComponentType<{ size?: number; className?: string }>;
  text: string;
  border: string;
  bg: string;
  dot: string;
  topBar: string;
  glow: string;
};

const CAT: Record<RadarCategory, CatMeta> = {
  unusual_attention: {
    label: "Unusual Attention",
    Icon: Zap,
    text: "text-indigo-300",
    border: "border-indigo-700",
    bg: "bg-indigo-900/30",
    dot: "bg-indigo-400",
    topBar: "from-indigo-500 via-indigo-700/40 to-transparent",
    glow: "shadow-indigo-900/40",
  },
  beaten_down: {
    label: "Beaten Down",
    Icon: TrendingDown,
    text: "text-amber-300",
    border: "border-amber-700",
    bg: "bg-amber-900/25",
    dot: "bg-amber-400",
    topBar: "from-amber-500 via-amber-700/40 to-transparent",
    glow: "shadow-amber-900/40",
  },
  possibly_undervalued: {
    label: "Possibly Undervalued",
    Icon: Target,
    text: "text-emerald-300",
    border: "border-emerald-700",
    bg: "bg-emerald-900/25",
    dot: "bg-emerald-400",
    topBar: "from-emerald-500 via-emerald-700/40 to-transparent",
    glow: "shadow-emerald-900/40",
  },
  emerging_theme: {
    label: "Emerging Theme",
    Icon: Layers,
    text: "text-purple-300",
    border: "border-purple-700",
    bg: "bg-purple-900/25",
    dot: "bg-purple-400",
    topBar: "from-purple-500 via-purple-700/40 to-transparent",
    glow: "shadow-purple-900/40",
  },
  pre_breakout: {
    label: "Pre-Breakout Watch",
    Icon: BarChart2,
    text: "text-indigo-300",
    border: "border-indigo-700",
    bg: "bg-indigo-900/25",
    dot: "bg-indigo-400",
    topBar: "from-indigo-500 via-indigo-700/40 to-transparent",
    glow: "shadow-indigo-900/40",
  },
  speculative_upside: {
    label: "Speculative",
    Icon: Flame,
    text: "text-purple-300",
    border: "border-purple-700",
    bg: "bg-purple-900/25",
    dot: "bg-purple-400",
    topBar: "from-purple-500 via-purple-700/40 to-transparent",
    glow: "shadow-purple-900/40",
  },
};

const TREND: Record<RadarTrendStatus, { label: string; cls: string }> = {
  new_today: { label: "New Today", cls: "bg-emerald-900/60 text-emerald-300 border-emerald-700" },
  repeated: { label: "Repeated", cls: "bg-blue-900/60 text-blue-300 border-blue-700" },
  back_on_radar: { label: "Back on Radar", cls: "bg-purple-900/60 text-purple-300 border-purple-700" },
  cooling_down: { label: "Cooling", cls: "bg-slate-800 text-slate-400 border-slate-700" },
};

const TIME_WINDOWS: { key: RadarTimeWindow; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "yesterday", label: "Yesterday" },
  { key: "last7days", label: "Last 7 Days" },
  { key: "last30days", label: "Last 30 Days" },
];

const BULLET_ICONS = [Activity, Crosshair, Search] as const;

// ─── Utilities ────────────────────────────────────────────────────────────────

function getDateRange(w: RadarTimeWindow): { start: Date; end: Date } {
  const now = new Date();
  const end = new Date();

  switch (w) {
    case "today":
      // From start of today to end of today
      const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      return { start: startToday, end };
    case "yesterday":
      // All of yesterday
      const startYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
      const endYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      return { start: startYesterday, end: endYesterday };
    case "last7days":
      const start7 = new Date(now);
      start7.setDate(start7.getDate() - 7);
      return { start: start7, end };
    case "last30days":
      const start30 = new Date(now);
      start30.setDate(start30.getDate() - 30);
      return { start: start30, end };
  }
}

function filterByWindow(list: RadarCandidate[], w: RadarTimeWindow) {
  const { start, end } = getDateRange(w);
  return list.filter((c) => {
    if (!c.scanDate) return false;
    const scanDate = new Date(c.scanDate);
    return scanDate >= start && scanDate <= end;
  });
}

function filterByLens(list: RadarCandidate[], l: RadarLens) {
  if (l === "all") return list;
  return list.filter((c) => c.radarLens === l);
}

function maxBy<T>(arr: T[], fn: (t: T) => number): T | null {
  if (!arr.length) return null;
  return arr.reduce((best, cur) => (fn(cur) > fn(best) ? cur : best));
}

// ─── Atoms ────────────────────────────────────────────────────────────────────

function TrendPill({ status }: { status: RadarTrendStatus }) {
  const t = TREND[status];
  return (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border flex-shrink-0 ${t.cls}`}>
      {t.label}
    </span>
  );
}

function CategoryPill({ category }: { category: RadarCategory }) {
  const cm = CAT[category];
  const CatIcon = cm.Icon;
  return (
    <span
      className={`text-[10px] font-medium px-2 py-0.5 rounded border flex items-center gap-1 flex-shrink-0 ${cm.bg} ${cm.text} ${cm.border}`}
    >
      <CatIcon size={10} />
      {cm.label}
    </span>
  );
}

// ─── Utilities ────────────────────────────────────────────────────────────────

function toPoints(text: string, max = 2): string[] {
  return text
    .split(/\.\s+/)
    .map((s) => s.trim().replace(/\.$/, ""))
    .filter((s) => s.length > 10)
    .slice(0, max);
}

function scoreColor(v: number) {
  if (v >= 70) return "bg-emerald-500";
  if (v >= 50) return "bg-blue-500";
  if (v >= 30) return "bg-amber-500";
  return "bg-red-500";
}

function ratingStars(rating: string): string {
  const r = rating.toLowerCase();
  if (r.includes("outperform")) return "★★★★☆";
  if (r.includes("hold")) return "★★★☆☆";
  if (r.includes("speculative")) return "★★☆☆☆";
  return "★★★☆☆";
}

function priceChangeColor(change: number): string {
  if (change > 3) return "text-emerald-400";
  if (change > 0) return "text-emerald-300";
  if (change > -3) return "text-slate-400";
  if (change > -8) return "text-amber-300";
  return "text-red-300";
}

function priceChangeLabel(change: number): string {
  const sign = change >= 0 ? "+" : "";
  return `${sign}${change.toFixed(1)}%`;
}

// ─── Insight Cards ────────────────────────────────────────────────────────────

type InsightTheme = {
  border: string;
  gradient: string;
  iconColor: string;
  labelColor: string;
  valueColor: string;
  subColor: string;
};

const INSIGHT_THEMES: Record<"blue" | "emerald" | "purple" | "red", InsightTheme> = {
  blue: {
    border: "border-blue-700/50",
    gradient: "from-blue-900/50",
    iconColor: "text-blue-400",
    labelColor: "text-blue-300",
    valueColor: "text-white",
    subColor: "text-blue-200/70",
  },
  emerald: {
    border: "border-emerald-700/50",
    gradient: "from-emerald-900/50",
    iconColor: "text-emerald-400",
    labelColor: "text-emerald-300",
    valueColor: "text-white",
    subColor: "text-emerald-200/70",
  },
  purple: {
    border: "border-purple-700/50",
    gradient: "from-purple-900/50",
    iconColor: "text-purple-400",
    labelColor: "text-purple-300",
    valueColor: "text-white",
    subColor: "text-purple-200/70",
  },
  red: {
    border: "border-red-800/50",
    gradient: "from-red-900/50",
    iconColor: "text-red-400",
    labelColor: "text-red-300",
    valueColor: "text-white",
    subColor: "text-red-200/70",
  },
};

function InsightCard({
  icon,
  label,
  value,
  sub,
  theme,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  sub?: string;
  theme: InsightTheme;
}) {
  return (
    <div
      className={`rounded-xl border ${theme.border} bg-gradient-to-br ${theme.gradient} to-slate-950 p-3.5 flex flex-col gap-1.5`}
    >
      <div className="flex items-center gap-1.5">
        <span className={theme.iconColor}>{icon}</span>
        <p className={`text-[10px] font-bold uppercase tracking-widest ${theme.labelColor}`}>
          {label}
        </p>
      </div>
      <div className={`text-xl font-black leading-tight ${theme.valueColor}`}>{value}</div>
      {sub && <p className={`text-[11px] leading-tight ${theme.subColor}`}>{sub}</p>}
    </div>
  );
}

// ─── Opportunity Card ─────────────────────────────────────────────────────────

function OpportunityCard({
  candidate,
  isSelected,
  onClick,
}: {
  candidate: RadarCandidate;
  isSelected: boolean;
  onClick: () => void;
}) {
  const cm = CAT[candidate.category];
  const hypeHigh = candidate.hypeRiskScore > 70;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => e.key === "Enter" && onClick()}
      className={`group relative flex flex-col rounded-2xl border cursor-pointer transition-all duration-200 overflow-hidden select-none ${
        isSelected
          ? `${cm.border} ${cm.bg} shadow-xl ${cm.glow}`
          : "border-slate-800 bg-slate-900/70 hover:border-slate-600 hover:bg-slate-900/90"
      }`}
    >
      {/* Category gradient top bar */}
      <div className={`h-[3px] w-full bg-gradient-to-r ${cm.topBar} flex-shrink-0`} />

      <div className="p-4 flex flex-col gap-3 flex-1">

        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-3xl font-black text-white leading-none tracking-tight">{candidate.ticker}</p>
            <p className="text-[11px] text-slate-500 mt-0.5 truncate">{candidate.companyName}</p>
          </div>
          <div className="flex-shrink-0">
            <CategoryPill category={candidate.category} />
          </div>
        </div>

        {/* Headline */}
        <p className="text-sm font-semibold text-slate-100 leading-snug line-clamp-2">
          {candidate.headline}
        </p>

        {/* Teaser bullets */}
        <div className="flex flex-col gap-1.5">
          {candidate.bullets.slice(0, 3).map((bullet, i) => {
            const BulletIcon = BULLET_ICONS[i];
            return (
              <div key={i} className="flex items-start gap-2">
                <BulletIcon size={12} className={`${cm.text} opacity-70 shrink-0 mt-0.5`} />
                <p className="text-sm text-slate-400 leading-snug">{bullet}</p>
              </div>
            );
          })}
        </div>

        {/* Signal Snapshot — analyst rating, 1W move, upside */}
        <div className="flex flex-col gap-2 pt-2 border-t border-slate-800/50">
          <p className="text-[9px] text-slate-500 uppercase tracking-widest font-medium mb-1">Signal Snapshot</p>

          <div className="flex items-center justify-between text-sm">
            <span className="text-amber-300">{ratingStars(candidate.snapshot.analystRating)}</span>
            <span className="text-slate-300">{candidate.snapshot.analystRating}</span>
          </div>

          {candidate.snapshot.priceChange1WPercent !== undefined && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">1W Move</span>
              <span className={`font-semibold ${priceChangeColor(candidate.snapshot.priceChange1WPercent)}`}>
                {priceChangeLabel(candidate.snapshot.priceChange1WPercent)}
              </span>
            </div>
          )}

          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">Upside</span>
            <span className="text-emerald-300 font-semibold">+{candidate.snapshot.analystUpsidePercent}%</span>
          </div>
        </div>

        {/* Next check */}
        <div className={`rounded-lg px-3 py-2 ${cm.bg} border ${cm.border}`}>
          <p className={`text-[9px] font-bold uppercase tracking-widest ${cm.text} mb-0.5`}>Next Check</p>
          <p className="text-xs text-slate-300 leading-snug">{candidate.nextCheck}</p>
        </div>

        {/* Click affordance */}
        <div className="flex items-center justify-center gap-1 mt-auto">
          {isSelected ? (
            <span className={`text-[11px] font-medium ${cm.text} flex items-center gap-1`}>
              Intel Brief open <ChevronUp size={11} />
            </span>
          ) : (
            <span className="text-[11px] text-slate-600 group-hover:text-slate-400 transition-colors flex items-center gap-1">
              Click for Intel Brief <ChevronDown size={11} />
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Empty Slot ───────────────────────────────────────────────────────────────

function EmptySlot() {
  return (
    <div className="rounded-2xl border border-dashed border-slate-800/40 bg-slate-900/15 flex flex-col items-center justify-center p-8 min-h-[300px]">
      <Radio size={20} className="text-slate-800 mb-2" />
      <p className="text-sm text-slate-700 font-medium mb-1">No further signals</p>
      <p className="text-xs text-slate-800 text-center">Switch the Radar Lens to explore other lanes</p>
    </div>
  );
}

// ─── Intel Panel sub-components ──────────────────────────────────────────────

function NarrativeBullet({
  icon,
  text,
  iconClass = "text-slate-500",
}: {
  icon: React.ReactNode;
  text: string;
  iconClass?: string;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <span className={`shrink-0 mt-0.5 ${iconClass}`}>{icon}</span>
      <p className="text-sm text-slate-300 leading-snug">{text}</p>
    </div>
  );
}

function SnapshotScoreBar({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  const barColor = scoreColor(value);
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-slate-400">{label}</span>
        <span className="text-sm font-black text-white tabular-nums">{value}</span>
      </div>
      <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
        <div className={`h-full ${barColor} rounded-full`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function SnapshotMetricRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-slate-800/50 last:border-0">
      <span className="text-xs text-slate-500">{label}</span>
      <span className="text-xs font-semibold text-slate-200 tabular-nums">{value}</span>
    </div>
  );
}

// ─── Intel Panel ──────────────────────────────────────────────────────────────

function ConvictionBreakdownRow({
  label,
  value,
  helper,
}: {
  label: string;
  value: string | number;
  helper?: string;
}) {
  return (
    <div className="flex items-start justify-between pb-2.5 border-b border-slate-800/40 last:border-0">
      <div className="flex flex-col gap-0.5">
        <span className="text-[10px] text-slate-400">{label}</span>
        {helper && <span className="text-[9px] text-slate-600">{helper}</span>}
      </div>
      <span className="text-sm font-black text-slate-100 tabular-nums">{value}</span>
    </div>
  );
}

function IntelPanel({
  candidate,
  onClose,
}: {
  candidate: RadarCandidate;
  onClose: () => void;
}) {
  const cm = CAT[candidate.category];
  const CatIcon = cm.Icon;
  const snap = candidate.snapshot;
  const bullPoints = toPoints(candidate.bullCase, 2);
  const bearPoints = toPoints(candidate.bearCase, 2);

  return (
    <div
      className={`rounded-2xl border ${cm.border} bg-gradient-to-br from-[#080f1f] via-[#0b0e1a] to-slate-950 overflow-hidden`}
    >
      <div className={`h-[3px] w-full bg-gradient-to-r ${cm.topBar}`} />

      <div className="p-5">
        {/* ── Header ── */}
        <div className="flex items-start justify-between gap-4 mb-5">
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${cm.bg} border ${cm.border}`}
            >
              <CatIcon size={16} className={cm.text} />
            </div>
            <div>
              <p className={`text-[9px] font-bold uppercase tracking-widest ${cm.text} mb-0.5`}>
                Intelligence Brief
              </p>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-2xl font-black text-white leading-none">{candidate.ticker}</span>
                <span className="text-sm text-slate-400">{candidate.companyName}</span>
                <TrendPill status={candidate.trendStatus} />
                <CategoryPill category={candidate.category} />
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-500 hover:text-white hover:bg-slate-800 transition-colors flex-shrink-0"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* ── Two-column body (balanced ratio) ── */}
        <div className="grid grid-cols-1 md:grid-cols-[3fr_2fr] gap-6">

          {/* LEFT — Clean Radar Narrative */}
          <div className="flex flex-col gap-4">
            <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500">
              Radar Narrative
            </p>

            {/* Why it is on the radar */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-1.5">
                <Activity size={13} className={cm.text} />
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Why it is on the radar
                </p>
              </div>
              <div className="flex flex-col gap-1.5 ml-4">
                {candidate.bullets.map((b, i) => (
                  <p key={i} className="text-sm text-slate-300 leading-snug">{b}</p>
                ))}
              </div>
            </div>

            {/* What looks interesting */}
            <div className="flex flex-col gap-2 bg-emerald-950/20 border border-emerald-900/30 rounded-lg p-3">
              <div className="flex items-center gap-1.5">
                <CheckCircle size={13} className="text-emerald-600" />
                <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">
                  What looks interesting
                </p>
              </div>
              <div className="flex flex-col gap-1.5">
                {bullPoints.map((pt, i) => (
                  <p key={i} className="text-sm text-slate-300 leading-snug">{pt}</p>
                ))}
              </div>
            </div>

            {/* Key concerns */}
            <div className="flex flex-col gap-2 bg-red-950/20 border border-red-900/30 rounded-lg p-3">
              <div className="flex items-center gap-1.5">
                <XCircle size={13} className="text-red-500" />
                <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest">
                  Key concerns
                </p>
              </div>
              <div className="flex flex-col gap-1.5">
                {bearPoints.map((pt, i) => (
                  <p key={i} className="text-sm text-slate-300 leading-snug">{pt}</p>
                ))}
              </div>
            </div>

            {/* What to verify next */}
            <div className={`rounded-lg p-3.5 ${cm.bg} border ${cm.border}`}>
              <div className="flex items-center gap-1.5 mb-1.5">
                <Calendar size={12} className={cm.text} />
                <p className={`text-[9px] font-bold uppercase tracking-widest ${cm.text}`}>What to verify next</p>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed">{candidate.nextCheck}</p>
            </div>

            {/* Source / metadata footer */}
            <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-800/40 text-[9px]">
              <div className="flex flex-wrap gap-1">
                {candidate.sourceTypes.map((s) => (
                  <span
                    key={s}
                    className="px-2 py-0.5 bg-slate-800 text-slate-400 rounded border border-slate-700"
                  >
                    {s}
                  </span>
                ))}
              </div>
              <div className="ml-auto text-slate-600">
                Evidence: <span className="text-slate-400">{candidate.evidenceCount}</span>
              </div>
            </div>
          </div>

          {/* RIGHT — FomoFilter Validation (readable panel) */}
          <div className="flex flex-col gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">
                FomoFilter Validation
              </p>
              <p className="text-[9px] text-slate-600">Mock composite · future DB-backed validation</p>
            </div>

            {/* Radar Conviction — Hero score */}
            <div className="bg-gradient-to-br from-blue-900/40 to-slate-900/40 border border-blue-700/40 rounded-lg p-4 flex flex-col items-center">
              <p className="text-[10px] font-bold text-blue-300 uppercase tracking-widest mb-3">
                Radar Conviction
              </p>
              <div className="text-4xl font-black text-white leading-none mb-2">
                {snap.radarConvictionScore}
              </div>
              <p className="text-[11px] text-blue-200 mb-2">/ 100</p>
              <p className="text-[10px] text-blue-300 text-center">Worth reviewing · validation needed</p>
            </div>

            {/* Primary validation grid */}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-slate-800/40 border border-slate-700/40 rounded-lg p-3">
                <p className="text-[10px] text-slate-500 uppercase tracking-wide mb-1.5 font-semibold">Opportunity Score</p>
                <p className="text-lg font-black text-white">{snap.opportunityScore}</p>
              </div>
              <div className="bg-slate-800/40 border border-slate-700/40 rounded-lg p-3">
                <p className="text-[10px] text-slate-500 uppercase tracking-wide mb-1.5 font-semibold">Fundamental Score</p>
                <p className="text-lg font-black text-white">{snap.fundamentalScore}</p>
              </div>
              <div className="bg-slate-800/40 border border-slate-700/40 rounded-lg p-3">
                <p className="text-[10px] text-slate-500 uppercase tracking-wide mb-1.5 font-semibold">Analyst Upside</p>
                <p className="text-lg font-black text-white">+{snap.analystUpsidePercent}%</p>
              </div>
              <div className="bg-slate-800/40 border border-slate-700/40 rounded-lg p-3">
                <p className="text-[10px] text-slate-500 uppercase tracking-wide mb-1.5 font-semibold">Analyst Rating</p>
                <p className="text-sm font-semibold text-amber-300">{ratingStars(snap.analystRating)} {snap.analystRating}</p>
              </div>
            </div>

            {/* Secondary metrics */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between py-2 px-3 bg-slate-800/20 rounded-lg border border-slate-800/40">
                <span className="text-[10px] text-slate-400 uppercase tracking-wide font-semibold">Valuation Score</span>
                <span className="text-sm font-bold text-white">{snap.valuationScore}</span>
              </div>
              <div className="flex items-center justify-between py-2 px-3 bg-slate-800/20 rounded-lg border border-slate-800/40">
                <span className="text-[10px] text-slate-400 uppercase tracking-wide font-semibold">Stability</span>
                <span className="text-sm font-bold text-white">{snap.stabilityScore}</span>
              </div>
              <div className="flex items-center justify-between py-2 px-3 bg-slate-800/20 rounded-lg border border-slate-800/40">
                <span className="text-[10px] text-slate-400 uppercase tracking-wide font-semibold">P/E</span>
                <span className="text-sm font-bold text-white">{snap.peRatio != null ? `${snap.peRatio}×` : "—"}</span>
              </div>
              {snap.week52PositionPercent && (
                <div className="flex items-center justify-between py-2 px-3 bg-slate-800/20 rounded-lg border border-slate-800/40">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wide font-semibold">52W Position</span>
                  <span className="text-sm font-bold text-white">{snap.week52PositionPercent}%</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── DB to UI conversion ──────────────────────────────────────────────────────

function convertDbCandidateToUi(dbCandidate: RadarCandidateView): RadarCandidate {
  // Map radarLens to category for UI styling/filtering
  const lensToCategory: Record<string, RadarCategory> = {
    attention_spike: "unusual_attention",
    overreaction: "beaten_down",
    value_gap: "possibly_undervalued",
    future_theme: "emerging_theme",
  };

  const category = (lensToCategory[dbCandidate.radarLens] ?? "unusual_attention") as RadarCategory;

  // Extract first 3 bullets from radarBullets
  const bullets: [string, string, string] = [
    dbCandidate.radarBullets[0] ?? "",
    dbCandidate.radarBullets[1] ?? "",
    dbCandidate.radarBullets[2] ?? "",
  ];

  // Map evidence to simple format for sourceTypes
  const sourceTypes = Array.from(new Set(dbCandidate.evidence.map((e) => e.sourceType))).slice(0, 3);

  return {
    id: dbCandidate.id,
    ticker: dbCandidate.ticker,
    companyName: dbCandidate.companyName,
    category,
    headline: dbCandidate.headline,
    thesis: dbCandidate.thesis,
    whyNow: dbCandidate.whyNow,
    mainCatalyst: dbCandidate.mainCatalyst,
    bullCase: dbCandidate.whatLooksInteresting.join(" "),
    bearCase: dbCandidate.keyConcerns.join(" "),
    nextCheck: dbCandidate.nextCheck,
    attentionScore: dbCandidate.attentionScore,
    confidenceScore: dbCandidate.confidenceScore,
    hypeRiskScore: dbCandidate.hypeRiskScore,
    bullets,
    evidenceCount: dbCandidate.evidence.length,
    sourceTypes,
    tags: dbCandidate.tags,
    trendStatus: dbCandidate.trendStatus as RadarTrendStatus,
    appearancesLast7Days: dbCandidate.appearancesLast7Days,
    appearancesLast30Days: dbCandidate.appearancesLast30Days,
    firstSeenDate: dbCandidate.scanDate,
    lastSeenDate: dbCandidate.scanDate,
    previousCategories: [],
    snapshot: {
      radarConvictionScore: dbCandidate.radarConvictionScore,
      radarSignalStrength: dbCandidate.radarSignalStrength,
      opportunityScore: dbCandidate.snapshot.opportunityScore ?? 0,
      fundamentalScore: dbCandidate.snapshot.fundamentalScore ?? 0,
      analystUpsidePercent: dbCandidate.snapshot.analystUpsidePercent ?? 0,
      analystRating: dbCandidate.snapshot.analystRating ?? "Neutral",
      valuationScore: dbCandidate.snapshot.valuationScore ?? 0,
      stabilityScore: dbCandidate.snapshot.stabilityScore ?? 0,
      peRatio: dbCandidate.snapshot.peRatio ?? undefined,
      week52PositionPercent: dbCandidate.snapshot.week52PositionPercent ?? undefined,
      marketCapLabel: dbCandidate.snapshot.marketCapLabel ?? undefined,
      priceChange1WPercent: dbCandidate.snapshot.priceChangePercent ?? undefined,
    },
    radarLens: dbCandidate.radarLens as RadarLens,
    scanDate: dbCandidate.scanDate,
    evidence: dbCandidate.evidence.map((e) => ({
      id: e.id,
      snippet: e.snippet,
      sourceName: e.sourceName,
      sourceType: e.sourceType,
      url: e.url,
    })),
  };
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export default function OpportunityRadarPageClient({ initialData }: { initialData: OpportunityRadarPageData }) {
  const [timeWindow, setTimeWindow] = useState<RadarTimeWindow>("today");
  const [lens, setLens] = useState<RadarLens>("attention_spike");
  const [intelId, setIntelId] = useState<string | null>(null);
  const intelRef = useRef<HTMLDivElement>(null);

  // Convert DB candidates to UI format
  const uiCandidates = useMemo(
    () => initialData.candidates.map(convertDbCandidateToUi),
    [initialData.candidates]
  );

  const byWindow = useMemo(
    () => filterByWindow(uiCandidates, timeWindow),
    [uiCandidates, timeWindow]
  );

  const displayed = useMemo(
    () => filterByLens(byWindow, lens),
    [byWindow, lens]
  );

  const deckCandidates = displayed.slice(0, 3);
  const intelCandidate = intelId ? displayed.find((c) => c.id === intelId) ?? null : null;

  // Lens counts (based on byWindow so changing lens shows how many in each)
  const lensCount = useCallback(
    (l: RadarLens) =>
      l === "all" ? byWindow.length : byWindow.filter((c) => LENS[l].categories.includes(c.category)).length,
    [byWindow]
  );

  // Insight data
  const topSignal = maxBy(displayed, (c) => c.snapshot.radarConvictionScore);
  const freshCandidates = displayed.filter((c) => c.trendStatus === "new_today");
  const cautionCandidates = displayed.filter((c) => c.hypeRiskScore > 75).slice(0, 2);
  const cautionTickers = cautionCandidates.map((c) => c.ticker).join(" / ");

  const handleCardClick = useCallback(
    (id: string) => {
      const opening = intelId !== id;
      setIntelId(opening ? id : null);
      if (opening) {
        setTimeout(() => {
          if (!intelRef.current) return;
          const main = document.querySelector("main");
          if (!main) return;
          const panelRect = intelRef.current.getBoundingClientRect();
          const mainRect = main.getBoundingClientRect();
          // Scroll just enough to show the intel panel header — keep cards partially in view
          const scrollTarget = main.scrollTop + (panelRect.top - mainRect.top) - 120;
          main.scrollTo({ top: scrollTarget, behavior: "smooth" });
        }, 60);
      }
    },
    [intelId]
  );

  const handleWindowChange = (w: RadarTimeWindow) => {
    setTimeWindow(w);
    setIntelId(null);
  };

  const handleLensChange = (l: RadarLens) => {
    setLens(l);
    setIntelId(null);
  };

  // Format sourceMode for display
  const getSourceModeLabel = (): string => {
    const mode = initialData.sourceSummary?.sourceMode;
    if (mode === "db_context") return "Claude DB-context scan · no public web search";
    if (mode === "fixture") return "Fixture scan · local test data";
    return mode ?? "Unknown source";
  };

  // Format scan date/time for display
  const formatScanTime = (): string => {
    if (!initialData.sourceSummary?.scanDate) return "No scans yet";
    const d = new Date(initialData.sourceSummary.scanDate);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  // Empty state
  if (!initialData.hasDbData) {
    return (
      <div className="max-w-6xl mx-auto flex flex-col gap-5">
        <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-br from-[#060d1b] via-[#0b0e1a] to-[#0a0b0f] px-6 py-12 flex flex-col items-center justify-center gap-4">
          <AlertCircle size={40} className="text-amber-400" />
          <div className="text-center max-w-md">
            <h2 className="text-xl font-bold text-white mb-2">No Radar scans yet</h2>
            <p className="text-sm text-slate-400 mb-4">
              Run a Fixture or Claude Radar Scan from Admin Sync to populate this briefing.
            </p>
            <a
              href="/admin/sync"
              className="inline-block px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium transition-colors"
            >
              Go to Admin Sync
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-5">

      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-br from-[#060d1b] via-[#0b0e1a] to-[#0a0b0f] px-6 py-5">
        <div className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/3 opacity-50">
          <div className="relative w-44 h-44">
            <div className="absolute inset-0 rounded-full border border-slate-700/20" />
            <div className="absolute inset-4 rounded-full border border-slate-700/20" />
            <div className="absolute inset-9 rounded-full border border-emerald-800/30" />
            <div className="absolute inset-14 rounded-full border border-emerald-700/35" />
            <div className="absolute inset-[52px] rounded-full bg-emerald-900/15 border border-emerald-600/30" />
            <div
              className="absolute top-1/2 left-1/2 h-px w-1/2 bg-gradient-to-r from-emerald-500/60 to-transparent origin-left opacity-50"
              style={{ transform: "rotate(-20deg)" }}
            />
          </div>
        </div>

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-semibold text-emerald-400 tracking-widest uppercase">
                Opportunity Radar
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight mb-1.5">
              Daily Opportunity Briefing
            </h1>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5 bg-blue-950/60 border border-blue-900/40 rounded-full px-3 py-1">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                <span className="text-[10px] text-blue-400 font-medium">
                  {getSourceModeLabel()}
                </span>
              </div>
              <span className="text-[10px] text-slate-600 flex items-center gap-1.5">
                <Clock size={10} />
                {formatScanTime()}
              </span>
            </div>
          </div>

          {/* Time controls */}
          <div className="flex gap-1 bg-slate-900/60 border border-slate-800 rounded-xl p-1 self-start sm:self-center flex-wrap">
            {TIME_WINDOWS.map((w) => (
              <button
                key={w.key}
                onClick={() => handleWindowChange(w.key)}
                className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                  timeWindow === w.key
                    ? "bg-slate-700 text-white"
                    : "text-slate-500 hover:text-slate-300 hover:bg-slate-800/50"
                }`}
              >
                {w.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── RADAR LENS FILTER BAR ───────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-2">
        {LENS_ORDER.map((l) => {
          const { label, Icon } = LENS[l];
          const count = lensCount(l);
          const active = lens === l;
          const lensColors: Record<RadarLens, { border: string; bg: string; active: string; icon: string; hoverBg: string }> = {
            all: { border: "border-slate-800", bg: "bg-slate-900/60", active: "bg-slate-700 border-slate-500", icon: "text-slate-400", hoverBg: "hover:bg-slate-800/80" },
            attention_spike: { border: "border-indigo-900/40", bg: "bg-slate-900/60", active: "bg-indigo-800 border-indigo-600", icon: "text-indigo-300", hoverBg: "hover:bg-slate-800/80 hover:border-indigo-800/60" },
            overreaction: { border: "border-amber-800/40", bg: "bg-slate-900/60", active: "bg-amber-700 border-amber-600", icon: "text-amber-300", hoverBg: "hover:bg-slate-800/80 hover:border-amber-800/60" },
            value_gap: { border: "border-emerald-800/40", bg: "bg-slate-900/60", active: "bg-emerald-700 border-emerald-600", icon: "text-emerald-300", hoverBg: "hover:bg-slate-800/80 hover:border-emerald-800/60" },
            future_theme: { border: "border-purple-800/40", bg: "bg-slate-900/60", active: "bg-purple-700 border-purple-600", icon: "text-purple-300", hoverBg: "hover:bg-slate-800/80 hover:border-purple-800/60" },
          };
          const colors = lensColors[l];
          return (
            <button
              key={l}
              onClick={() => handleLensChange(l)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all text-slate-300 ${
                active
                  ? `${colors.active} text-white`
                  : `${colors.bg} ${colors.border} ${colors.icon} ${colors.hoverBg}`
              }`}
            >
              <Icon size={14} className="flex-shrink-0" />
              <span>{label}</span>
              <span
                className={`text-xs font-bold px-1.5 py-0.5 rounded-md flex-shrink-0 ${
                  active ? "bg-white/15 text-white" : "bg-slate-700 text-slate-300"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── LENS EXPLANATION BANNER ─────────────────────────────────────────── */}
      {lens !== "all" && (
        <div
          className={`rounded-xl border px-4 py-3 flex items-start gap-3 ${
            LENS_EXPLANATIONS[lens].color
          }`}
        >
          <span className="text-sm font-semibold">{LENS[lens].label}</span>
          <span className="text-sm opacity-90">{LENS_EXPLANATIONS[lens].text}</span>
          <span className="ml-auto text-xs font-medium opacity-70">
            {lensCount(lens)} candidate{lensCount(lens) !== 1 ? "s" : ""}
          </span>
        </div>
      )}

      {/* ── OPPORTUNITY DECK ────────────────────────────────────────────────── */}
      <div>
        <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest mb-3 px-0.5">
          Opportunity Deck
          {lens !== "all" && (
            <span className="ml-2 normal-case font-normal text-slate-500">
              · {LENS[lens].label}
            </span>
          )}
        </p>
        <div className="radar-deck">
          {[0, 1, 2].map((i) => {
            const c = deckCandidates[i];
            return c ? (
              <OpportunityCard
                key={c.id}
                candidate={c}
                isSelected={intelId === c.id}
                onClick={() => handleCardClick(c.id)}
              />
            ) : (
              deckCandidates.length > 0 && i > 0 ? <EmptySlot key={`empty-${i}`} /> : null
            );
          })}
        </div>
      </div>

      {/* ── INTEL BRIEF PANEL ───────────────────────────────────────────────── */}
      {intelCandidate && (
        <div ref={intelRef} className="scroll-mt-4">
          <IntelPanel candidate={intelCandidate} onClose={() => setIntelId(null)} />
        </div>
      )}

      {/* ── RESEARCH DISCIPLINE FOOTER ──────────────────────────────────────── */}
      <footer className="border border-slate-800/40 rounded-xl p-4 bg-slate-900/20">
        <div className="flex items-start gap-2.5">
          <AlertTriangle size={13} className="text-amber-700 shrink-0 mt-0.5" />
          <p className="text-xs text-slate-500 leading-relaxed">
            <span className="text-slate-400 font-medium">Research Discipline: </span>
            Opportunity Radar surfaces research candidates based on mock AI-style signals. These
            candidates require your own independent validation before any decision. This is not
            financial advice. All scores and signals are simulated for product demonstration
            purposes only. No buy or sell recommendations are implied.
          </p>
        </div>
      </footer>
    </div>
  );
}
