"use client";

import { useState, useMemo } from "react";
import type { ReactNode } from "react";
import { Search, CheckCircle, XCircle, List } from "lucide-react";
import type { AdminStockDataInventoryRow } from "@/src/lib/data/admin-stock-data";

type FilterId =
  | "all"
  | "scanner-eligible"
  | "missing-score"
  | "missing-quote"
  | "missing-metrics"
  | "missing-analyst"
  | "nasdaq100"
  | "missing-target"
  | "has-target"
  | "no-target-available"
  | "plan-limited"
  | "eligible-target-retry"
  | "provider-error-target";

const FILTERS: Array<{ id: FilterId; label: string }> = [
  { id: "all", label: "All" },
  { id: "scanner-eligible", label: "Scanner Eligible" },
  { id: "missing-score", label: "Missing Score" },
  { id: "missing-quote", label: "Missing Quote" },
  { id: "missing-metrics", label: "Missing Metrics" },
  { id: "missing-analyst", label: "Missing Analyst" },
  { id: "nasdaq100", label: "Nasdaq 100" },
  { id: "missing-target", label: "Missing Target" },
  { id: "has-target", label: "Has Target" },
  { id: "no-target-available", label: "No Target Available" },
  { id: "plan-limited", label: "Plan Limited" },
  { id: "eligible-target-retry", label: "Eligible for Retry" },
  { id: "provider-error-target", label: "Provider Error" },
];

interface ColumnDef {
  label: string;
  sourceLabel: string;
  align: "left" | "right" | "center";
  minWidth?: string;
  render: (row: AdminStockDataInventoryRow) => ReactNode;
}

function YesNoBadge({ value }: { value: boolean }) {
  return value ? (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-400">
      <CheckCircle className="w-3 h-3" />
      Yes
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-500">
      <XCircle className="w-3 h-3" />
      No
    </span>
  );
}

function NA() {
  return <span className="text-slate-600 text-xs">N/A</span>;
}

function SummaryCard({
  label,
  value,
  color = "text-slate-200",
}: {
  label: string;
  value: number;
  color?: string;
}) {
  return (
    <div className="bg-slate-900/60 border border-slate-700/60 rounded px-3 py-2.5">
      <p className={`text-xl font-bold ${color}`}>{value}</p>
      <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{label}</p>
    </div>
  );
}

const COLUMNS: ColumnDef[] = [
  // ── Identity ────────────────────────────────────────────────────────────────
  {
    label: "Symbol",
    sourceLabel: "DB",
    align: "left",
    minWidth: "70px",
    render: (r) => (
      <span className="font-mono font-semibold text-slate-100 whitespace-nowrap">{r.symbol}</span>
    ),
  },
  {
    label: "Company Name",
    sourceLabel: "FMP / DB",
    align: "left",
    minWidth: "160px",
    render: (r) =>
      r.companyName ? (
        <span className="text-slate-300 whitespace-nowrap">{r.companyName}</span>
      ) : (
        <NA />
      ),
  },
  {
    label: "Sector",
    sourceLabel: "FMP",
    align: "left",
    minWidth: "120px",
    render: (r) =>
      r.sector ? (
        <span className="text-xs text-slate-400 whitespace-nowrap">{r.sector}</span>
      ) : (
        <NA />
      ),
  },
  {
    label: "Market Cap",
    sourceLabel: "FMP",
    align: "right",
    minWidth: "90px",
    render: (r) =>
      r.marketCap ? <span className="text-xs text-slate-300">{r.marketCap}</span> : <NA />,
  },
  // ── Universe ─────────────────────────────────────────────────────────────────
  {
    label: "Nasdaq 100",
    sourceLabel: "Static Fallback",
    align: "center",
    minWidth: "90px",
    render: (r) => <YesNoBadge value={r.inNasdaq100} />,
  },
  {
    label: "Univ. Source",
    sourceLabel: "DB",
    align: "left",
    minWidth: "110px",
    render: (r) =>
      r.universeSource ? (
        <span className="font-mono text-[10px] text-slate-400">{r.universeSource}</span>
      ) : (
        <NA />
      ),
  },
  {
    label: "Mbr Active",
    sourceLabel: "DB",
    align: "center",
    minWidth: "80px",
    render: (r) => (r.inNasdaq100 ? <YesNoBadge value={r.membershipActive} /> : <NA />),
  },
  {
    label: "Mbr Last Seen",
    sourceLabel: "DB",
    align: "left",
    minWidth: "120px",
    render: (r) =>
      r.membershipLastSeenAt ? (
        <span className="text-xs text-slate-400">{r.membershipLastSeenAt}</span>
      ) : (
        <NA />
      ),
  },
  // ── Quote ─────────────────────────────────────────────────────────────────────
  {
    label: "Has Quote",
    sourceLabel: "DB",
    align: "center",
    minWidth: "80px",
    render: (r) => <YesNoBadge value={r.hasQuote} />,
  },
  {
    label: "Price",
    sourceLabel: "FMP",
    align: "right",
    minWidth: "70px",
    render: (r) =>
      r.price ? <span className="font-mono text-slate-200">{r.price}</span> : <NA />,
  },
  {
    label: "Change %",
    sourceLabel: "FMP",
    align: "right",
    minWidth: "80px",
    render: (r) => {
      if (!r.changePercent) return <NA />;
      const val = parseFloat(r.changePercent);
      const cls = val > 0 ? "text-emerald-400" : val < 0 ? "text-red-400" : "text-slate-300";
      return <span className={`font-mono ${cls}`}>{r.changePercent}</span>;
    },
  },
  {
    label: "Open",
    sourceLabel: "FMP",
    align: "right",
    minWidth: "70px",
    render: (r) =>
      r.open ? <span className="font-mono text-slate-300">{r.open}</span> : <NA />,
  },
  {
    label: "Day High",
    sourceLabel: "FMP",
    align: "right",
    minWidth: "70px",
    render: (r) =>
      r.dayHigh ? <span className="font-mono text-slate-300">{r.dayHigh}</span> : <NA />,
  },
  {
    label: "Day Low",
    sourceLabel: "FMP",
    align: "right",
    minWidth: "70px",
    render: (r) =>
      r.dayLow ? <span className="font-mono text-slate-300">{r.dayLow}</span> : <NA />,
  },
  {
    label: "Prev Close",
    sourceLabel: "FMP",
    align: "right",
    minWidth: "80px",
    render: (r) =>
      r.previousClose ? (
        <span className="font-mono text-slate-300">{r.previousClose}</span>
      ) : (
        <NA />
      ),
  },
  {
    label: "Volume",
    sourceLabel: "FMP",
    align: "right",
    minWidth: "90px",
    render: (r) =>
      r.volume ? (
        <span className="font-mono text-xs text-slate-300">{r.volume}</span>
      ) : (
        <NA />
      ),
  },
  {
    label: "Quote Source",
    sourceLabel: "DB",
    align: "left",
    minWidth: "90px",
    render: (r) =>
      r.quoteSource ? (
        <span className="font-mono text-[10px] text-slate-400">{r.quoteSource}</span>
      ) : (
        <NA />
      ),
  },
  {
    label: "Last Synced",
    sourceLabel: "DB",
    align: "left",
    minWidth: "120px",
    render: (r) =>
      r.quoteLastSyncedAt ? (
        <span className="text-xs text-slate-400">{r.quoteLastSyncedAt}</span>
      ) : (
        <NA />
      ),
  },
  {
    label: "Src Updated",
    sourceLabel: "FMP",
    align: "left",
    minWidth: "120px",
    render: (r) =>
      r.quoteSourceUpdatedAt ? (
        <span className="text-xs text-slate-400">{r.quoteSourceUpdatedAt}</span>
      ) : (
        <NA />
      ),
  },
  // ── Metrics ───────────────────────────────────────────────────────────────────
  {
    label: "Has Metrics",
    sourceLabel: "DB",
    align: "center",
    minWidth: "90px",
    render: (r) => <YesNoBadge value={r.hasMetric} />,
  },
  {
    label: "Metrics Source",
    sourceLabel: "DB",
    align: "left",
    minWidth: "90px",
    render: (r) =>
      r.metricProvider ? (
        <span className="font-mono text-[10px] text-slate-400">{r.metricProvider}</span>
      ) : (
        <NA />
      ),
  },
  {
    label: "Metrics Synced",
    sourceLabel: "DB",
    align: "left",
    minWidth: "120px",
    render: (r) =>
      r.metricLastSyncedAt ? (
        <span className="text-xs text-slate-400">{r.metricLastSyncedAt}</span>
      ) : (
        <NA />
      ),
  },
  {
    label: "Rev Growth TTM",
    sourceLabel: "FMP",
    align: "right",
    minWidth: "100px",
    render: (r) =>
      r.revenueGrowthTTMYoy ? (
        <span className="font-mono text-xs text-slate-300">{r.revenueGrowthTTMYoy}</span>
      ) : (
        <NA />
      ),
  },
  {
    label: "EPS Growth TTM",
    sourceLabel: "FMP",
    align: "right",
    minWidth: "100px",
    render: (r) =>
      r.epsGrowthTTMYoy ? (
        <span className="font-mono text-xs text-slate-300">{r.epsGrowthTTMYoy}</span>
      ) : (
        <NA />
      ),
  },
  {
    label: "Rev Growth 3Y",
    sourceLabel: "FMP",
    align: "right",
    minWidth: "95px",
    render: (r) =>
      r.revenueGrowth3Y ? (
        <span className="font-mono text-xs text-slate-300">{r.revenueGrowth3Y}</span>
      ) : (
        <NA />
      ),
  },
  {
    label: "Gross Margin",
    sourceLabel: "FMP",
    align: "right",
    minWidth: "90px",
    render: (r) =>
      r.grossMarginTTM ? (
        <span className="font-mono text-xs text-slate-300">{r.grossMarginTTM}</span>
      ) : (
        <NA />
      ),
  },
  {
    label: "Op Margin",
    sourceLabel: "FMP",
    align: "right",
    minWidth: "85px",
    render: (r) =>
      r.operatingMarginTTM ? (
        <span className="font-mono text-xs text-slate-300">{r.operatingMarginTTM}</span>
      ) : (
        <NA />
      ),
  },
  {
    label: "Net Margin",
    sourceLabel: "FMP",
    align: "right",
    minWidth: "85px",
    render: (r) =>
      r.netProfitMarginTTM ? (
        <span className="font-mono text-xs text-slate-300">{r.netProfitMarginTTM}</span>
      ) : (
        <NA />
      ),
  },
  {
    label: "ROE",
    sourceLabel: "FMP",
    align: "right",
    minWidth: "70px",
    render: (r) =>
      r.roeTTM ? (
        <span className="font-mono text-xs text-slate-300">{r.roeTTM}</span>
      ) : (
        <NA />
      ),
  },
  {
    label: "ROA",
    sourceLabel: "FMP",
    align: "right",
    minWidth: "70px",
    render: (r) =>
      r.roaTTM ? (
        <span className="font-mono text-xs text-slate-300">{r.roaTTM}</span>
      ) : (
        <NA />
      ),
  },
  {
    label: "D/E",
    sourceLabel: "FMP",
    align: "right",
    minWidth: "60px",
    render: (r) =>
      r.totalDebtToEquityAnnual ? (
        <span className="font-mono text-xs text-slate-300">{r.totalDebtToEquityAnnual}</span>
      ) : (
        <NA />
      ),
  },
  {
    label: "Current Ratio",
    sourceLabel: "FMP",
    align: "right",
    minWidth: "90px",
    render: (r) =>
      r.currentRatioAnnual ? (
        <span className="font-mono text-xs text-slate-300">{r.currentRatioAnnual}</span>
      ) : (
        <NA />
      ),
  },
  {
    label: "P/E TTM",
    sourceLabel: "FMP",
    align: "right",
    minWidth: "70px",
    render: (r) =>
      r.peBasicExclExtraTTM ? (
        <span className="font-mono text-xs text-slate-300">{r.peBasicExclExtraTTM}</span>
      ) : (
        <NA />
      ),
  },
  {
    label: "Fwd P/E",
    sourceLabel: "FMP",
    align: "right",
    minWidth: "70px",
    render: (r) =>
      r.forwardPE ? (
        <span className="font-mono text-xs text-slate-300">{r.forwardPE}</span>
      ) : (
        <NA />
      ),
  },
  {
    label: "PEG",
    sourceLabel: "FMP",
    align: "right",
    minWidth: "60px",
    render: (r) =>
      r.pegTTM ? (
        <span className="font-mono text-xs text-slate-300">{r.pegTTM}</span>
      ) : (
        <NA />
      ),
  },
  {
    label: "P/S",
    sourceLabel: "FMP",
    align: "right",
    minWidth: "60px",
    render: (r) =>
      r.psTTM ? (
        <span className="font-mono text-xs text-slate-300">{r.psTTM}</span>
      ) : (
        <NA />
      ),
  },
  {
    label: "EV/EBITDA",
    sourceLabel: "FMP",
    align: "right",
    minWidth: "80px",
    render: (r) =>
      r.evEbitdaTTM ? (
        <span className="font-mono text-xs text-slate-300">{r.evEbitdaTTM}</span>
      ) : (
        <NA />
      ),
  },
  {
    label: "Beta",
    sourceLabel: "FMP",
    align: "right",
    minWidth: "60px",
    render: (r) =>
      r.beta ? (
        <span className="font-mono text-xs text-slate-300">{r.beta}</span>
      ) : (
        <NA />
      ),
  },
  {
    label: "Mkt Cap (Metric)",
    sourceLabel: "FMP",
    align: "right",
    minWidth: "100px",
    render: (r) =>
      r.marketCapitalizationMetric ? (
        <span className="font-mono text-xs text-slate-300">{r.marketCapitalizationMetric}</span>
      ) : (
        <NA />
      ),
  },
  {
    label: "52W High",
    sourceLabel: "FMP",
    align: "right",
    minWidth: "70px",
    render: (r) =>
      r.week52High ? (
        <span className="font-mono text-xs text-slate-300">{r.week52High}</span>
      ) : (
        <NA />
      ),
  },
  {
    label: "52W Low",
    sourceLabel: "FMP",
    align: "right",
    minWidth: "70px",
    render: (r) =>
      r.week52Low ? (
        <span className="font-mono text-xs text-slate-300">{r.week52Low}</span>
      ) : (
        <NA />
      ),
  },
  // ── Score / Internal ─────────────────────────────────────────────────────────
  {
    label: "Has Score",
    sourceLabel: "Internal",
    align: "center",
    minWidth: "80px",
    render: (r) => <YesNoBadge value={r.hasScore} />,
  },
  {
    label: "Fund. Score",
    sourceLabel: "Internal",
    align: "right",
    minWidth: "90px",
    render: (r) =>
      r.fundamentalScore ? (
        <span className="font-mono font-semibold text-emerald-300">{r.fundamentalScore}</span>
      ) : (
        <NA />
      ),
  },
  {
    label: "Growth Scr",
    sourceLabel: "Internal",
    align: "right",
    minWidth: "80px",
    render: (r) =>
      r.growthScore ? (
        <span className="font-mono text-xs text-slate-300">{r.growthScore}</span>
      ) : (
        <NA />
      ),
  },
  {
    label: "Profit Scr",
    sourceLabel: "Internal",
    align: "right",
    minWidth: "80px",
    render: (r) =>
      r.profitabilityScore ? (
        <span className="font-mono text-xs text-slate-300">{r.profitabilityScore}</span>
      ) : (
        <NA />
      ),
  },
  {
    label: "Valuation Scr",
    sourceLabel: "Internal",
    align: "right",
    minWidth: "90px",
    render: (r) =>
      r.valuationScore ? (
        <span className="font-mono text-xs text-slate-300">{r.valuationScore}</span>
      ) : (
        <NA />
      ),
  },
  {
    label: "Fin Health Scr",
    sourceLabel: "Internal",
    align: "right",
    minWidth: "95px",
    render: (r) =>
      r.financialHealthScore ? (
        <span className="font-mono text-xs text-slate-300">{r.financialHealthScore}</span>
      ) : (
        <NA />
      ),
  },
  {
    label: "Stability Scr",
    sourceLabel: "Internal",
    align: "right",
    minWidth: "80px",
    render: (r) =>
      r.riskContextScore ? (
        <span className="font-mono text-xs text-slate-300">{r.riskContextScore}</span>
      ) : (
        <NA />
      ),
  },
  {
    label: "Score Ver.",
    sourceLabel: "Internal",
    align: "left",
    minWidth: "100px",
    render: (r) =>
      r.scoreVersion ? (
        <span className="font-mono text-[10px] text-slate-500">{r.scoreVersion}</span>
      ) : (
        <NA />
      ),
  },
  {
    label: "Score Calc At",
    sourceLabel: "Internal",
    align: "left",
    minWidth: "120px",
    render: (r) =>
      r.scoreLastCalculatedAt ? (
        <span className="text-xs text-slate-400">{r.scoreLastCalculatedAt}</span>
      ) : (
        <NA />
      ),
  },
  {
    label: "Opp. Score",
    sourceLabel: "Internal",
    align: "right",
    minWidth: "90px",
    render: (r) => {
      if (!r.opportunityScore) return <NA />;
      const n = parseFloat(r.opportunityScore);
      const color = n >= 75 ? "text-emerald-300" : n >= 55 ? "text-amber-300" : "text-slate-400";
      return <span className={`text-xs font-semibold tabular-nums ${color}`}>{r.opportunityScore}</span>;
    },
  },
  {
    label: "Opp. Version",
    sourceLabel: "Internal",
    align: "left",
    minWidth: "110px",
    render: (r) =>
      r.opportunityScoreVersion ? (
        <span className="font-mono text-[10px] text-slate-500">{r.opportunityScoreVersion}</span>
      ) : (
        <NA />
      ),
  },
  {
    label: "Opp. Calc At",
    sourceLabel: "Internal",
    align: "left",
    minWidth: "120px",
    render: (r) =>
      r.opportunityCalculatedAt ? (
        <span className="text-xs text-slate-400">{r.opportunityCalculatedAt}</span>
      ) : (
        <NA />
      ),
  },
  {
    label: "Scanner Eligible",
    sourceLabel: "Internal",
    align: "center",
    minWidth: "110px",
    render: (r) => <YesNoBadge value={r.scannerEligible} />,
  },
  {
    label: "Missing Reason",
    sourceLabel: "Internal",
    align: "left",
    minWidth: "140px",
    render: (r) => (
      <span
        className={`text-xs whitespace-nowrap ${
          r.scannerEligible ? "text-emerald-400" : "text-amber-400"
        }`}
      >
        {r.missingReason}
      </span>
    ),
  },
  // ── Analyst Data ──────────────────────────────────────────────────────────────
  {
    label: "Has Analyst",
    sourceLabel: "DB",
    align: "center",
    minWidth: "90px",
    render: (r) => <YesNoBadge value={r.hasAnalystData} />,
  },
  {
    label: "Target Price",
    sourceLabel: "FMP",
    align: "right",
    minWidth: "90px",
    render: (r) =>
      r.analystTargetPrice ? (
        <span className="font-mono text-xs text-slate-300">{r.analystTargetPrice}</span>
      ) : (
        <NA />
      ),
  },
  {
    label: "Upside %",
    sourceLabel: "Internal",
    align: "right",
    minWidth: "80px",
    render: (r) => {
      if (!r.analystUpsidePercent) return <NA />;
      const val = parseFloat(r.analystUpsidePercent);
      const cls = val > 0 ? "text-emerald-400" : val < 0 ? "text-red-400" : "text-slate-300";
      return <span className={`font-mono text-xs ${cls}`}>{r.analystUpsidePercent}</span>;
    },
  },
  {
    label: "Analyst Rating",
    sourceLabel: "Finnhub",
    align: "left",
    minWidth: "100px",
    render: (r) => {
      if (!r.analystRating) return <NA />;
      const cls =
        r.analystRating === "Strong Buy" ? "text-emerald-300 font-medium" :
        r.analystRating === "Buy" ? "text-emerald-400" :
        r.analystRating === "Hold" ? "text-amber-400" :
        r.analystRating === "Sell" ? "text-red-400" :
        r.analystRating === "Strong Sell" ? "text-red-300 font-medium" :
        "text-slate-400";
      return <span className={`text-xs ${cls}`}>{r.analystRating}</span>;
    },
  },
  {
    label: "Analyst Count",
    sourceLabel: "Finnhub",
    align: "right",
    minWidth: "90px",
    render: (r) =>
      r.analystCount ? (
        <span className="font-mono text-xs text-slate-300">{r.analystCount}</span>
      ) : (
        <NA />
      ),
  },
  {
    label: "Target High",
    sourceLabel: "FMP",
    align: "right",
    minWidth: "90px",
    render: (r) =>
      r.analystTargetHigh ? (
        <span className="font-mono text-xs text-slate-300">{r.analystTargetHigh}</span>
      ) : (
        <NA />
      ),
  },
  {
    label: "Target Low",
    sourceLabel: "FMP",
    align: "right",
    minWidth: "90px",
    render: (r) =>
      r.analystTargetLow ? (
        <span className="font-mono text-xs text-slate-300">{r.analystTargetLow}</span>
      ) : (
        <NA />
      ),
  },
  {
    label: "Analyst Source",
    sourceLabel: "DB",
    align: "left",
    minWidth: "90px",
    render: (r) =>
      r.analystSource ? (
        <span className="font-mono text-[10px] text-slate-400">{r.analystSource}</span>
      ) : (
        <NA />
      ),
  },
  {
    label: "Analyst Synced",
    sourceLabel: "DB",
    align: "left",
    minWidth: "120px",
    render: (r) =>
      r.analystLastSyncedAt ? (
        <span className="text-xs text-slate-400">{r.analystLastSyncedAt}</span>
      ) : (
        <NA />
      ),
  },
  // ── Target Discovery ─────────────────────────────────────────────────────────
  {
    label: "Target Status",
    sourceLabel: "FMP",
    align: "left",
    minWidth: "130px",
    render: (r) => {
      if (!r.targetStatus) return <span className="text-[10px] text-slate-600">not_checked</span>;
      const cls =
        r.targetStatus === "has_target" ? "text-emerald-400 font-medium" :
        r.targetStatus === "no_target_available" ? "text-slate-500" :
        r.targetStatus === "quota_blocked" ? "text-amber-400" :
        r.targetStatus === "provider_error" ? "text-red-400" :
        r.targetStatus === "plan_limited" ? "text-blue-400" :
        r.targetStatus === "stale_target" ? "text-amber-300" :
        "text-slate-500";
      return <span className={`font-mono text-[10px] ${cls}`}>{r.targetStatus}</span>;
    },
  },
  {
    label: "Tgt Attempted",
    sourceLabel: "FMP",
    align: "left",
    minWidth: "115px",
    render: (r) =>
      r.targetLastAttemptedAt ? (
        <span className="text-xs text-slate-400">{r.targetLastAttemptedAt}</span>
      ) : (
        <NA />
      ),
  },
  {
    label: "Tgt Found",
    sourceLabel: "FMP",
    align: "left",
    minWidth: "115px",
    render: (r) =>
      r.targetLastFoundAt ? (
        <span className="text-xs text-slate-400">{r.targetLastFoundAt}</span>
      ) : (
        <NA />
      ),
  },
  {
    label: "Tgt Retry At",
    sourceLabel: "FMP",
    align: "left",
    minWidth: "115px",
    render: (r) =>
      r.targetNextRetryAt ? (
        <span className="text-xs text-slate-400">{r.targetNextRetryAt}</span>
      ) : (
        <NA />
      ),
  },
  {
    label: "Tgt Attempts",
    sourceLabel: "FMP",
    align: "right",
    minWidth: "90px",
    render: (r) => (
      <span className="font-mono text-xs text-slate-400">{r.targetAttemptCount}</span>
    ),
  },
  // ── Optional ──────────────────────────────────────────────────────────────────
  {
    label: "In Watchlist",
    sourceLabel: "DB",
    align: "center",
    minWidth: "80px",
    render: (r) => <YesNoBadge value={r.inWatchlist} />,
  },
  {
    label: "Active Alert",
    sourceLabel: "DB",
    align: "center",
    minWidth: "80px",
    render: (r) => <YesNoBadge value={r.hasActiveAlert} />,
  },
];

interface DataInventoryTabProps {
  rows: AdminStockDataInventoryRow[];
}

export default function DataInventoryTab({ rows }: DataInventoryTabProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterId>("all");

  const summary = useMemo(
    () => ({
      totalStocks: rows.length,
      withQuote: rows.filter((r) => r.hasQuote).length,
      missingQuote: rows.filter((r) => !r.hasQuote).length,
      withMetric: rows.filter((r) => r.hasMetric).length,
      missingMetric: rows.filter((r) => !r.hasMetric).length,
      withScore: rows.filter((r) => r.hasScore).length,
      scannerEligible: rows.filter((r) => r.scannerEligible).length,
      withAnalystData: rows.filter((r) => r.hasAnalystData).length,
      missingAnalyst: rows.filter((r) => !r.hasAnalystData).length,
      nasdaq100Active: rows.filter((r) => r.inNasdaq100 && r.membershipActive).length,
      hasTarget: rows.filter((r) => r.targetStatus === "has_target").length,
      planLimited: rows.filter((r) => r.targetStatus === "plan_limited").length,
      missingTarget: rows.filter((r) => !r.targetStatus || r.targetStatus === "not_checked" || r.targetStatus === "no_target_available").length,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rows]
  );

  const filteredRows = useMemo(() => {
    let result = rows;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (r) =>
          r.symbol.toLowerCase().includes(q) ||
          (r.companyName?.toLowerCase() ?? "").includes(q)
      );
    }

    switch (activeFilter) {
      case "scanner-eligible":
        result = result.filter((r) => r.scannerEligible);
        break;
      case "missing-score":
        result = result.filter((r) => !r.hasScore);
        break;
      case "missing-quote":
        result = result.filter((r) => !r.hasQuote);
        break;
      case "missing-metrics":
        result = result.filter((r) => !r.hasMetric);
        break;
      case "missing-analyst":
        result = result.filter((r) => !r.hasAnalystData);
        break;
      case "nasdaq100":
        result = result.filter((r) => r.inNasdaq100 && r.membershipActive);
        break;
      case "missing-target":
        result = result.filter((r) => !r.targetStatus || r.targetStatus === "not_checked" || r.targetStatus === "no_target_available");
        break;
      case "has-target":
        result = result.filter((r) => r.targetStatus === "has_target");
        break;
      case "no-target-available":
        result = result.filter((r) => r.targetStatus === "no_target_available");
        break;
      case "plan-limited":
        result = result.filter((r) => r.targetStatus === "plan_limited");
        break;
      case "eligible-target-retry": {
        const nowTs = new Date().toISOString().slice(0, 16);
        result = result.filter((r) => {
          if (!r.targetStatus || r.targetStatus === "not_checked") return true;
          // plan_limited has a 90-day cooldown — excluded from short eligible-retry filter
          if (r.targetStatus === "provider_error" || r.targetStatus === "quota_blocked" || r.targetStatus === "no_target_available") {
            return !r.targetNextRetryAt || r.targetNextRetryAt <= nowTs;
          }
          return false;
        });
        break;
      }
      case "provider-error-target":
        result = result.filter((r) => r.targetStatus === "provider_error");
        break;
    }

    return result;
  }, [rows, searchQuery, activeFilter]);

  return (
    <div className="space-y-5">

      {/* Summary cards */}
      <section className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 space-y-3">
        <div className="flex items-center gap-2">
          <List className="w-4 h-4 text-slate-400" />
          <h2 className="text-sm font-semibold text-slate-200">Stock Data Inventory</h2>
          <span className="text-xs text-slate-500 ml-1">DB-only snapshot</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2">
          <SummaryCard label="Total Stocks" value={summary.totalStocks} />
          <SummaryCard label="With Quote" value={summary.withQuote} color="text-emerald-400" />
          <SummaryCard label="With Metrics" value={summary.withMetric} color="text-emerald-400" />
          <SummaryCard label="With Score" value={summary.withScore} color="text-emerald-400" />
          <SummaryCard
            label="Scanner Eligible"
            value={summary.scannerEligible}
            color={summary.scannerEligible > 0 ? "text-emerald-400" : "text-amber-400"}
          />
          <SummaryCard label="Nasdaq 100 Active" value={summary.nasdaq100Active} color="text-blue-400" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-slate-700/50">
          <SummaryCard label="With Analyst Data" value={summary.withAnalystData} color="text-emerald-400" />
          <SummaryCard
            label="Missing Analyst"
            value={summary.missingAnalyst}
            color={summary.missingAnalyst > 0 ? "text-amber-400" : "text-slate-400"}
          />
          <SummaryCard label="Has Target Price" value={summary.hasTarget} color="text-emerald-400" />
          <SummaryCard
            label="Missing Target"
            value={summary.missingTarget}
            color={summary.missingTarget > 0 ? "text-amber-400" : "text-slate-400"}
          />
          <SummaryCard
            label="Plan Limited"
            value={summary.planLimited}
            color={summary.planLimited > 0 ? "text-blue-400" : "text-slate-400"}
          />
        </div>
      </section>

      {/* Search + filter controls */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search symbol or company…"
            className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-1.5 pl-8 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-slate-500"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setActiveFilter(f.id)}
              className={`px-2.5 py-1 text-xs font-medium rounded transition-colors border ${
                activeFilter === f.id
                  ? "bg-emerald-700/60 text-emerald-200 border-emerald-700"
                  : "bg-slate-700/50 text-slate-400 border-slate-700 hover:text-slate-200"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <span className="text-xs text-slate-500 whitespace-nowrap">
          {filteredRows.length} / {rows.length} rows
        </span>
      </div>

      {/* Table */}
      <section className="bg-slate-800/50 border border-slate-700 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              {/* Row 1 — parameter names */}
              <tr className="border-b border-slate-600 bg-slate-900/70">
                {COLUMNS.map((col) => (
                  <th
                    key={col.label}
                    className={`px-3 py-2 text-xs font-semibold text-slate-300 whitespace-nowrap ${
                      col.align === "right"
                        ? "text-right"
                        : col.align === "center"
                        ? "text-center"
                        : ""
                    }`}
                    style={{ minWidth: col.minWidth }}
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
              {/* Row 2 — source labels */}
              <tr className="border-b border-slate-700 bg-slate-900/40">
                {COLUMNS.map((col) => (
                  <th
                    key={col.label + "-src"}
                    className={`px-3 py-1 text-[10px] font-normal uppercase tracking-wider text-slate-600 whitespace-nowrap ${
                      col.align === "right"
                        ? "text-right"
                        : col.align === "center"
                        ? "text-center"
                        : ""
                    }`}
                  >
                    {col.sourceLabel}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={COLUMNS.length}
                    className="px-4 py-8 text-center text-sm text-slate-500"
                  >
                    No stocks match the current filter.
                  </td>
                </tr>
              ) : (
                filteredRows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-slate-700/30 hover:bg-slate-800/40"
                  >
                    {COLUMNS.map((col) => (
                      <td
                        key={col.label}
                        className={`px-3 py-2 text-xs ${
                          col.align === "right"
                            ? "text-right"
                            : col.align === "center"
                            ? "text-center"
                            : ""
                        }`}
                      >
                        {col.render(row)}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-2 border-t border-slate-700/40 bg-slate-900/30">
          <p className="text-[10px] text-slate-600">
            Showing {filteredRows.length} of {rows.length} stocks. Data is read directly from the
            DB — no external API calls.
          </p>
        </div>
      </section>
    </div>
  );
}
