"use client";

import { useState, useTransition, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  testFmpProfileAction,
  testTwelveQuoteAction,
  testFinnhubNewsAction,
  syncQuotesSampleAction,
  syncProfilesSampleAction,
  syncNasdaq100UniverseAction,
  calculateFundamentalScoresAction,
  calculateOpportunityScoresAction,
} from "@/src/actions/market-data-actions";
import type {
  ProviderTestResult,
  SyncActionResult,
  SyncRunStatus,
  SyncSymbolResult,
} from "@/src/lib/market-data/types";
import type {
  UniverseSyncActionResult,
  ScoreCalcResult,
} from "@/src/actions/market-data-actions";
import type { UniverseOverviewRow, DbStockSummary } from "@/src/lib/data/admin-universes";
import type { AdminStockDataInventoryRow } from "@/src/lib/data/admin-stock-data";
import DataInventoryTab from "@/src/components/admin/DataInventoryTab";
import ScoreMethodologyTab from "@/src/components/admin/ScoreMethodologyTab";
import {
  CheckCircle,
  XCircle,
  Loader2,
  Database,
  FlaskConical,
  RefreshCw,
  AlertTriangle,
  Info,
  ShieldAlert,
  ChevronDown,
  ChevronRight,
  Clock,
  Globe,
  BarChart3,
  History,
  List,
  BookOpen,
  Calculator,
  Play,
  SkipForward,
  RotateCcw,
} from "lucide-react";

// ── Serialised types from the server ─────────────────────────────────────────

interface SyncRunItemData {
  id: string;
  symbol: string;
  status: string;
  reason: string | null;
  dbAction: string;
  createdAt: string;
}

interface SyncRunData {
  id: string;
  type: string;
  provider: string;
  status: string;
  requestedCount: number;
  successCount: number;
  skippedCount: number;
  failedCount: number;
  persisted: boolean;
  message: string | null;
  startedAt: string;
  finishedAt: string | null;
  durationMs: number | null;
  createdAt: string;
  items: SyncRunItemData[];
}

type ChunkedSyncProgress = {
  id: string;
  type: string;
  provider: string;
  status: string;
  requestedCount: number;
  processedCount: number;
  currentSymbol: string | null;
  successCount: number;
  skippedCount: number;
  failedCount: number;
  startedAt: string;
  finishedAt: string | null;
  durationMs: number | null;
  message: string | null;
};

interface ProviderStatus {
  fmp: boolean;
  twelveData: boolean;
  finnhub: boolean;
}

interface SyncPageClientProps {
  providerStatus: ProviderStatus;
  recentSyncRuns: SyncRunData[];
  universeOverview: UniverseOverviewRow[];
  dbStockSummary: DbStockSummary;
  stockInventory: AdminStockDataInventoryRow[];
  initialChunkedSync: ChunkedSyncProgress | null;
  initialAnalystSync: ChunkedSyncProgress | null;
  initialTargetDiscoverySync: ChunkedSyncProgress | null;
}

type LastResult =
  | { kind: "test"; result: ProviderTestResult }
  | { kind: "sync"; result: SyncActionResult }
  | { kind: "universe"; result: UniverseSyncActionResult }
  | { kind: "score-calc"; result: ScoreCalcResult }
  | null;

type TabId = "overview" | "data-inventory" | "sync-actions" | "provider-tests" | "sync-history" | "score-methodology";

// ── Helper — is this run continuable? ────────────────────────────────────────

function isIncomplete(p: ChunkedSyncProgress | null): boolean {
  if (!p) return false;
  return (
    (p.status === "running" || p.status === "partial_success") &&
    p.processedCount < p.requestedCount
  );
}

function isTerminal(p: ChunkedSyncProgress | null): boolean {
  if (!p) return false;
  return p.status === "success" || p.status === "failed" ||
    (p.status === "partial_success" && p.processedCount >= p.requestedCount);
}

// ── ETA formatter ─────────────────────────────────────────────────────────────

function formatDuration(ms: number): string {
  const totalSec = Math.round(ms / 1000);
  const mins = Math.floor(totalSec / 60).toString().padStart(2, "0");
  const secs = (totalSec % 60).toString().padStart(2, "0");
  return `${mins}:${secs}`;
}

// ── Score calc result viewer ──────────────────────────────────────────────────

function ScoreCalcResultViewer({ result }: { result: ScoreCalcResult }) {
  const [showItems, setShowItems] = useState(false);
  const startedDate = new Date(result.startedAt);
  const finishedDate = new Date(result.finishedAt);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4">
        <InlineSyncStatusBadge status={result.status} />
        <span className="text-xs text-slate-400">{result.message}</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
        <MetaRow label="Provider" value={result.provider} />
        <MetaRow label="Action" value={result.action} />
        <MetaRow label="Requested" value={result.requestedCount} />
        <MetaRow label="Calculated" value={<span className="text-emerald-400">{result.calculatedCount}</span>} />
        <MetaRow label="Skipped" value={<span className="text-amber-400">{result.skippedCount}</span>} />
        <MetaRow label="Failed" value={<span className="text-red-400">{result.failedCount}</span>} />
        <MetaRow label="Started" value={startedDate.toLocaleTimeString()} />
        <MetaRow label="Finished" value={finishedDate.toLocaleTimeString()} />
        <MetaRow label="Duration" value={`${result.durationMs} ms`} />
        <MetaRow
          label="Persisted"
          value={result.persisted ? <span className="text-emerald-400">Yes</span> : <span className="text-slate-400">No</span>}
        />
      </div>
      {result.items.length > 0 && (
        <div>
          <button
            className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1.5 mb-2"
            onClick={() => setShowItems((v) => !v)}
          >
            {showItems ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            {showItems ? "Hide" : "Show"} symbol details ({result.items.length})
          </button>
          {showItems && (
            <div className="space-y-0.5 max-h-72 overflow-y-auto">
              {result.items.map((item, i) => (
                <div key={i} className="flex items-start gap-2 text-xs">
                  <ItemStatusIcon status={item.status} />
                  <span className="font-mono font-semibold text-slate-200 w-14 shrink-0">{item.symbol}</span>
                  <span className={item.status === "success" ? "text-emerald-400" : item.status === "skipped" ? "text-amber-400" : "text-red-400"}>
                    {item.dbAction}
                  </span>
                  {item.reason && <span className="text-slate-500">— {item.reason}</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Sync action metadata ───────────────────────────────────────────────────────

const SYNC_ACTION_META: Record<string, { label: string; durationNote: string }> = {
  "sync-nasdaq100": {
    label: "Sync Stock Universe",
    durationNote: "Universe sync may take around 45–75 seconds.",
  },
  "sync-quotes": {
    label: "Sync Quotes Sample",
    durationNote: "Quote sample sync typically takes 5–15 seconds.",
  },
  "sync-profiles": {
    label: "Sync Profiles Sample",
    durationNote: "Profile sample sync typically takes 10–25 seconds.",
  },
  "calc-fundamental-scores": {
    label: "Calculate Fundamental Scores",
    durationNote: "Score calculation is internal — typically completes in a few seconds for 100 stocks.",
  },
  "calc-opportunity-scores": {
    label: "Calculate Opportunity Scores",
    durationNote: "Opportunity Score calculation is internal — typically completes in a few seconds for 100 stocks.",
  },
};

// ── Shared primitives ─────────────────────────────────────────────────────────

function StatusBadge({ configured }: { configured: boolean }) {
  return configured ? (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-400">
      <CheckCircle className="w-3 h-3" />
      Configured
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-red-400">
      <XCircle className="w-3 h-3" />
      Missing
    </span>
  );
}

function SyncStatusBadge({ status }: { status: SyncRunStatus | string }) {
  if (status === "success") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 bg-emerald-900/30 border border-emerald-800/50 px-2 py-0.5 rounded">
        <CheckCircle className="w-3 h-3" />
        Success
      </span>
    );
  }
  if (status === "partial_success") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-400 bg-amber-900/30 border border-amber-800/50 px-2 py-0.5 rounded">
        <AlertTriangle className="w-3 h-3" />
        Partial
      </span>
    );
  }
  if (status === "running") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-400 bg-blue-900/30 border border-blue-800/50 px-2 py-0.5 rounded">
        <Loader2 className="w-3 h-3 animate-spin" />
        Running
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-400 bg-red-900/30 border border-red-800/50 px-2 py-0.5 rounded">
      <XCircle className="w-3 h-3" />
      Failed
    </span>
  );
}

function InlineSyncStatusBadge({ status }: { status: SyncRunStatus }) {
  if (status === "success") {
    return (
      <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-400">
        <CheckCircle className="w-4 h-4" />
        Success
      </span>
    );
  }
  if (status === "partial_success") {
    return (
      <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-amber-400">
        <AlertTriangle className="w-4 h-4" />
        Partial Success
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-red-400">
      <XCircle className="w-4 h-4" />
      Failed
    </span>
  );
}

function MetaRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="text-slate-500 w-24 shrink-0">{label}</span>
      <span className="text-slate-200">{value}</span>
    </div>
  );
}

// ── Action button ─────────────────────────────────────────────────────────────

interface ActionButtonProps {
  onClick: () => void;
  disabled: boolean;
  loading: boolean;
  label: string;
  description: string;
  variant: "test" | "sync";
  icon?: React.ReactNode;
}

function ActionButton({ onClick, disabled, loading, label, description, variant, icon }: ActionButtonProps) {
  const btnBase =
    "inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap shrink-0";
  const btnStyle =
    variant === "sync"
      ? "bg-emerald-700 hover:bg-emerald-600 text-white border border-emerald-600"
      : "bg-slate-700 hover:bg-slate-600 text-slate-200 border border-slate-600";

  return (
    <div className="flex items-start gap-3">
      <button className={`${btnBase} ${btnStyle} mt-0.5`} onClick={onClick} disabled={disabled}>
        {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : icon ?? null}
        {label}
      </button>
      <p className="text-xs text-slate-500 leading-relaxed pt-0.5">{description}</p>
    </div>
  );
}

// ── Chunked sync progress panel ───────────────────────────────────────────────

function ChunkedSyncProgressPanel({
  progress,
  autoRunning,
  chunkError,
  elapsedMs,
}: {
  progress: ChunkedSyncProgress;
  autoRunning: boolean;
  chunkError: string | null;
  elapsedMs: number;
}) {
  const processedCount = progress.processedCount;
  const requestedCount = progress.requestedCount;
  const progressPercent =
    requestedCount > 0 ? Math.min(100, Math.round((processedCount / requestedCount) * 100)) : 0;

  // ETA calculation — only show after 2+ processed to avoid absurd early estimates
  let etaStr = "Estimating…";
  if (processedCount >= 2 && elapsedMs > 0) {
    const avgMsPerStock = elapsedMs / processedCount;
    const remaining = requestedCount - processedCount;
    const etaMs = remaining * avgMsPerStock;
    etaStr = `~${formatDuration(etaMs)} remaining`;
  }

  const elapsedStr = formatDuration(elapsedMs);

  return (
    <div className="rounded-lg bg-slate-900/80 border border-emerald-800/60 p-4 space-y-3">
      <div className="flex items-center gap-2">
        {autoRunning ? (
          <Loader2 className="w-4 h-4 text-emerald-400 animate-spin shrink-0" />
        ) : (
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
        )}
        <span className="text-sm font-semibold text-emerald-300">
          {autoRunning ? "Sync in progress" : "Sync paused"}
        </span>
      </div>

      {progress.currentSymbol && (
        <p className="text-xs text-slate-400">
          Current symbol:{" "}
          <span className="font-mono font-semibold text-slate-200">{progress.currentSymbol}</span>
        </p>
      )}

      <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-slate-500">Processed</span>
          <span className="font-mono text-slate-200">
            {processedCount} / {requestedCount}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-slate-500">Succeeded</span>
          <span className="font-mono text-emerald-400">{progress.successCount}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-slate-500">Skipped</span>
          <span className="font-mono text-amber-400">{progress.skippedCount}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-slate-500">Failed</span>
          <span className="font-mono text-red-400">{progress.failedCount}</span>
        </div>
      </div>

      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>Progress</span>
          <span className="font-mono">{progressPercent}%</span>
        </div>
        <div className="w-full h-2 bg-slate-700 rounded overflow-hidden">
          <div
            className="h-full bg-emerald-500 rounded transition-all duration-700"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-slate-400">
        <span className="font-mono">Elapsed: {elapsedStr}</span>
        {autoRunning && processedCount >= 2 && (
          <span className="font-mono">{etaStr}</span>
        )}
      </div>

      {chunkError && (
        <p className="text-xs text-red-400 bg-red-900/20 border border-red-800/40 rounded px-2 py-1.5">
          {chunkError}
        </p>
      )}

      {progress.message && (
        <p className="text-xs text-amber-400">{progress.message}</p>
      )}

      {autoRunning && (
        <p className="text-xs text-slate-500">
          Processing chunk by chunk. Please keep this page open.
        </p>
      )}
    </div>
  );
}

// ── Paused sync panel ─────────────────────────────────────────────────────────

function PausedSyncPanel({
  progress,
  chunkError,
}: {
  progress: ChunkedSyncProgress;
  chunkError: string | null;
}) {
  const processedCount = progress.processedCount;
  const requestedCount = progress.requestedCount;
  const progressPercent =
    requestedCount > 0 ? Math.min(100, Math.round((processedCount / requestedCount) * 100)) : 0;

  const pausedAt = progress.finishedAt
    ? new Date(progress.finishedAt).toLocaleString([], {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  const reason = progress.message ?? "Sync was interrupted before completion.";

  return (
    <div className="rounded-lg bg-slate-900/80 border border-amber-800/60 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
        <span className="text-sm font-semibold text-amber-300">Sync paused</span>
      </div>

      {pausedAt && (
        <p className="text-xs text-slate-400">
          Paused at: <span className="text-slate-200">{pausedAt}</span>
        </p>
      )}

      <p className="text-xs text-slate-400">
        Reason: <span className="text-slate-300">{reason}</span>
      </p>

      {progress.currentSymbol && (
        <p className="text-xs text-slate-400">
          Last symbol:{" "}
          <span className="font-mono font-semibold text-slate-200">{progress.currentSymbol}</span>
        </p>
      )}

      <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-slate-500">Processed</span>
          <span className="font-mono text-slate-200">
            {processedCount} / {requestedCount}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-slate-500">Succeeded</span>
          <span className="font-mono text-emerald-400">{progress.successCount}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-slate-500">Skipped</span>
          <span className="font-mono text-amber-400">{progress.skippedCount}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-slate-500">Failed</span>
          <span className="font-mono text-red-400">{progress.failedCount}</span>
        </div>
      </div>

      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>Progress</span>
          <span className="font-mono">{progressPercent}%</span>
        </div>
        <div className="w-full h-2 bg-slate-700 rounded overflow-hidden">
          <div
            className="h-full bg-amber-500 rounded"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {chunkError && (
        <p className="text-xs text-red-400 bg-red-900/20 border border-red-800/40 rounded px-2 py-1.5">
          {chunkError}
        </p>
      )}

      <p className="text-xs text-slate-500">
        You can continue from the last saved progress, or restart to rescan all active Nasdaq 100 stocks.
      </p>
    </div>
  );
}

// ── Chunked sync result panel ─────────────────────────────────────────────────

function ChunkedSyncResultPanel({ progress }: { progress: ChunkedSyncProgress }) {
  const isSuccess = progress.status === "success";
  const isPartial =
    progress.status === "partial_success" && progress.processedCount >= progress.requestedCount;
  const isFailed = progress.status === "failed";

  return (
    <div className="rounded-lg bg-slate-900/80 border border-slate-700/60 p-4 space-y-3">
      <div className="flex items-center gap-2">
        {isSuccess && <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />}
        {isPartial && <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />}
        {isFailed && <XCircle className="w-4 h-4 text-red-400 shrink-0" />}
        <span className={`text-sm font-semibold ${isSuccess ? "text-emerald-300" : isPartial ? "text-amber-300" : "text-red-300"}`}>
          {isSuccess
            ? `Success — all ${progress.requestedCount} stocks synced.`
            : isPartial
            ? `Partial success — ${progress.successCount} updated, ${progress.skippedCount} skipped, ${progress.failedCount} failed.`
            : `Sync failed — ${progress.successCount} updated before failure.`}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs">
        <MetaRow label="Requested" value={progress.requestedCount} />
        <MetaRow label="Processed" value={progress.processedCount} />
        <MetaRow label="Succeeded" value={<span className="text-emerald-400">{progress.successCount}</span>} />
        <MetaRow label="Skipped" value={<span className="text-amber-400">{progress.skippedCount}</span>} />
        <MetaRow label="Failed" value={<span className="text-red-400">{progress.failedCount}</span>} />
        {progress.durationMs !== null && (
          <MetaRow label="Duration" value={formatDuration(progress.durationMs)} />
        )}
      </div>

      {progress.message && (
        <p className="text-xs text-slate-400">{progress.message}</p>
      )}

      <p className="text-xs text-slate-500">
        Check the Sync History tab for a full record.
      </p>
    </div>
  );
}

// ── Sync in progress panel (for non-chunked actions) ─────────────────────────

function SyncInProgressPanel({
  actionLabel,
  elapsedSeconds,
  durationNote,
}: {
  actionLabel: string;
  elapsedSeconds: number;
  durationNote: string;
}) {
  const mins = Math.floor(elapsedSeconds / 60).toString().padStart(2, "0");
  const secs = (elapsedSeconds % 60).toString().padStart(2, "0");

  return (
    <div className="rounded-lg bg-slate-900/80 border border-emerald-800/60 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Loader2 className="w-4 h-4 text-emerald-400 animate-spin shrink-0" />
        <span className="text-sm font-semibold text-emerald-300">Sync in progress</span>
      </div>
      <p className="text-sm text-slate-200 font-medium">{actionLabel}</p>
      <p className="text-xs text-slate-400 font-mono">Elapsed time: {mins}:{secs}</p>
      <div className="w-full h-1.5 bg-slate-700 rounded overflow-hidden">
        <div
          className="h-full w-2/5 bg-emerald-500 rounded"
          style={{ animation: "indeterminate-bar 1.4s ease-in-out infinite" }}
        />
      </div>
      <p className="text-xs text-amber-400">{durationNote}</p>
      <p className="text-xs text-slate-500">Please keep this page open until the sync completes.</p>
    </div>
  );
}

// ── Result viewers ────────────────────────────────────────────────────────────

function SyncResultViewer({ result }: { result: SyncActionResult }) {
  const startedDate = new Date(result.startedAt);
  const finishedDate = new Date(result.finishedAt);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4">
        <InlineSyncStatusBadge status={result.status} />
        <span className="text-xs text-slate-400">{result.message}</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
        <MetaRow label="Provider" value={result.provider} />
        <MetaRow label="Action" value={result.action} />
        <MetaRow label="Requested" value={result.requestedCount} />
        <MetaRow label="Updated" value={<span className="text-emerald-400">{result.successCount}</span>} />
        <MetaRow label="Skipped" value={<span className="text-amber-400">{result.skippedCount}</span>} />
        <MetaRow label="Failed" value={<span className="text-red-400">{result.failedCount}</span>} />
        <MetaRow label="Started" value={startedDate.toLocaleTimeString()} />
        <MetaRow label="Finished" value={finishedDate.toLocaleTimeString()} />
        <MetaRow label="Duration" value={`${result.durationMs} ms`} />
        <MetaRow
          label="Persisted"
          value={
            result.persisted ? (
              <span className="text-emerald-400">Yes</span>
            ) : (
              <span className="text-slate-400">No</span>
            )
          }
        />
      </div>

      {result.updatedSymbols.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Updated ({result.successCount})
          </p>
          <div className="space-y-0.5">
            {result.updatedSymbols.map((sym) => (
              <div key={sym} className="flex items-center gap-2 text-xs text-emerald-300">
                <CheckCircle className="w-3 h-3 shrink-0" />
                <span className="font-mono font-medium">{sym}</span>
                <span className="text-slate-500">— updated</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {result.skippedSymbols.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Skipped ({result.skippedCount}) — kept existing DB value
          </p>
          <div className="space-y-0.5">
            {(result.skippedSymbols as SyncSymbolResult[]).map((s) => (
              <div key={s.symbol} className="flex items-start gap-2 text-xs text-amber-300">
                <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" />
                <span className="font-mono font-medium">{s.symbol}</span>
                {s.reason && <span className="text-slate-400">— {s.reason}</span>}
                <span className="text-slate-500 ml-auto shrink-0">kept existing value</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {result.failedSymbols.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Failed ({result.failedCount}) — kept existing DB value
          </p>
          <div className="space-y-0.5">
            {(result.failedSymbols as SyncSymbolResult[]).map((s) => (
              <div key={s.symbol} className="flex items-start gap-2 text-xs text-red-300">
                <XCircle className="w-3 h-3 shrink-0 mt-0.5" />
                <span className="font-mono font-medium">{s.symbol}</span>
                {s.reason && <span className="text-slate-400">— {s.reason}</span>}
                <span className="text-slate-500 ml-auto shrink-0">kept existing value</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function TestResultViewer({ result }: { result: ProviderTestResult }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        {result.ok ? (
          <span className="text-xs font-semibold text-emerald-400">OK</span>
        ) : (
          <span className="text-xs font-semibold text-red-400">FAILED</span>
        )}
        <span className="text-xs text-slate-400">
          {result.provider} / {result.action}
        </span>
      </div>
      {!result.ok && result.error && (
        <p className="text-xs text-red-300 bg-red-900/20 border border-red-900/40 rounded px-3 py-2">
          {result.error}
        </p>
      )}
      {result.ok && result.data !== undefined && (
        <pre className="text-xs text-slate-300 bg-slate-900 rounded p-3 overflow-auto max-h-72 whitespace-pre-wrap break-all">
          {JSON.stringify(result.data, null, 2)}
        </pre>
      )}
    </div>
  );
}

function UniverseSyncResultViewer({ result }: { result: UniverseSyncActionResult }) {
  const [showItems, setShowItems] = useState(false);
  const startedDate = new Date(result.startedAt);
  const finishedDate = new Date(result.finishedAt);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4">
        <InlineSyncStatusBadge status={result.status} />
        <span className="text-xs text-slate-400">{result.message}</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
        <MetaRow label="Provider" value={result.provider} />
        <MetaRow label="Action" value={result.action} />
        <MetaRow label="Fetched" value={result.requestedCount} />
        <MetaRow label="Created stocks" value={<span className="text-emerald-400">{result.createdStocks}</span>} />
        <MetaRow label="Created mbrs" value={<span className="text-emerald-400">{result.createdMemberships}</span>} />
        <MetaRow label="Reactivated" value={<span className="text-blue-400">{result.reactivated}</span>} />
        <MetaRow label="Already active" value={<span className="text-slate-400">{result.alreadyActive}</span>} />
        <MetaRow label="Deactivated" value={<span className="text-amber-400">{result.deactivatedCount}</span>} />
        <MetaRow label="Failed" value={<span className="text-red-400">{result.failedCount}</span>} />
        <MetaRow label="Started" value={startedDate.toLocaleTimeString()} />
        <MetaRow label="Finished" value={finishedDate.toLocaleTimeString()} />
        <MetaRow label="Duration" value={`${result.durationMs} ms`} />
      </div>

      {result.items.length > 0 && (
        <div>
          <button
            className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1.5 mb-2"
            onClick={() => setShowItems((v) => !v)}
          >
            {showItems ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            {showItems ? "Hide" : "Show"} symbol details ({result.items.length})
          </button>
          {showItems && (
            <div className="space-y-0.5 max-h-72 overflow-y-auto">
              {result.items.map((item, i) => (
                <div key={i} className="flex items-start gap-2 text-xs">
                  <ItemStatusIcon status={item.status} />
                  <span className="font-mono font-semibold text-slate-200 w-14 shrink-0">{item.symbol}</span>
                  <span
                    className={
                      item.status === "success"
                        ? "text-emerald-400"
                        : item.status === "skipped"
                        ? "text-amber-400"
                        : "text-red-400"
                    }
                  >
                    {item.dbAction}
                  </span>
                  {item.reason && <span className="text-slate-500">— {item.reason}</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Recent Sync Runs ──────────────────────────────────────────────────────────

const SYNC_RUN_TYPE_LABELS: Record<string, string> = {
  "analyst-data-nasdaq100-sync": "Company Data Sync",
  "market-data-nasdaq100-batch": "Daily Market Data Sync",
  "fundamental-score-calculation": "Fundamental Score Calc",
  "opportunity-score-calculation": "Opportunity Score Calc",
  "nasdaq100-universe-sync": "Universe Sync",
  "analyst-target-discovery": "Target Discovery (Legacy)",
};

function syncRunTypeLabel(type: string): string {
  return SYNC_RUN_TYPE_LABELS[type] ?? type;
}

function ItemStatusIcon({ status }: { status: string }) {
  if (status === "success") return <CheckCircle className="w-3 h-3 text-emerald-400 shrink-0" />;
  if (status === "skipped") return <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />;
  return <XCircle className="w-3 h-3 text-red-400 shrink-0" />;
}

function dbActionLabel(action: string): string {
  if (action === "updated") return "updated";
  if (action === "kept_existing") return "kept existing";
  if (action === "not_found") return "not found";
  return action;
}

function SyncRunRow({ run }: { run: SyncRunData }) {
  const [expanded, setExpanded] = useState(false);
  const startedDate = new Date(run.startedAt);

  return (
    <>
      <tr
        className="border-b border-slate-700/50 hover:bg-slate-800/40 cursor-pointer"
        onClick={() => setExpanded((v) => !v)}
      >
        <td className="px-3 py-2.5 text-xs text-slate-400 whitespace-nowrap">
          <span className="inline-flex items-center gap-1.5">
            <Clock className="w-3 h-3 shrink-0" />
            {startedDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            <span className="text-slate-600 text-[10px]">
              {startedDate.toLocaleDateString([], { month: "short", day: "numeric" })}
            </span>
          </span>
        </td>
        <td className="px-3 py-2.5 text-xs text-slate-300">
          <span>{syncRunTypeLabel(run.type)}</span>
          {SYNC_RUN_TYPE_LABELS[run.type] && (
            <span className="ml-1 font-mono text-slate-600 text-[10px]">{run.type}</span>
          )}
        </td>
        <td className="px-3 py-2.5 text-xs text-slate-400">{run.provider}</td>
        <td className="px-3 py-2.5">
          <SyncStatusBadge status={run.status} />
        </td>
        <td className="px-3 py-2.5 text-xs text-slate-300 text-right">{run.requestedCount}</td>
        <td className="px-3 py-2.5 text-xs text-emerald-400 text-right">{run.successCount}</td>
        <td className="px-3 py-2.5 text-xs text-amber-400 text-right">{run.skippedCount}</td>
        <td className="px-3 py-2.5 text-xs text-red-400 text-right">{run.failedCount}</td>
        <td className="px-3 py-2.5 text-xs text-center">
          {run.persisted ? (
            <span className="text-emerald-400">Yes</span>
          ) : (
            <span className="text-slate-600">No</span>
          )}
        </td>
        <td className="px-3 py-2.5 text-slate-500">
          {expanded ? (
            <ChevronDown className="w-3.5 h-3.5" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5" />
          )}
        </td>
      </tr>
      {expanded && run.items.length > 0 && (
        <tr className="border-b border-slate-700/30 bg-slate-900/40">
          <td colSpan={10} className="px-4 py-3">
            <div className="space-y-1">
              {run.items.map((item) => (
                <div key={item.id} className="flex items-start gap-2 text-xs">
                  <ItemStatusIcon status={item.status} />
                  <span className="font-mono font-semibold text-slate-200 w-14 shrink-0">
                    {item.symbol}
                  </span>
                  <span
                    className={
                      item.status === "success"
                        ? "text-emerald-400"
                        : item.status === "skipped"
                        ? "text-amber-400"
                        : "text-red-400"
                    }
                  >
                    {item.status}
                  </span>
                  {item.reason && (
                    <span className="text-slate-500">— {item.reason}</span>
                  )}
                  <span className="ml-auto text-slate-600 shrink-0">
                    {dbActionLabel(item.dbAction)}
                  </span>
                </div>
              ))}
            </div>
          </td>
        </tr>
      )}
      {expanded && run.items.length === 0 && (
        <tr className="border-b border-slate-700/30 bg-slate-900/40">
          <td colSpan={10} className="px-4 py-3 text-xs text-slate-600">
            No symbol-level items recorded.
          </td>
        </tr>
      )}
    </>
  );
}

function RecentSyncRunsTable({ runs }: { runs: SyncRunData[] }) {
  if (runs.length === 0) {
    return (
      <div className="flex items-start gap-2.5 text-slate-500">
        <Info className="w-4 h-4 shrink-0 mt-0.5" />
        <p className="text-sm leading-relaxed">
          No sync runs yet. Run a sample sync to see history here.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left min-w-[700px]">
        <thead>
          <tr className="border-b border-slate-700">
            {["Time", "Type", "Provider", "Status", "Req", "Updated", "Skipped", "Failed", "Persisted", ""].map(
              (h) => (
                <th
                  key={h}
                  className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500"
                >
                  {h}
                </th>
              )
            )}
          </tr>
        </thead>
        <tbody>
          {runs.map((run) => (
            <SyncRunRow key={run.id} run={run} />
          ))}
        </tbody>
      </table>
      <p className="mt-2 text-[10px] text-slate-600">Click a row to expand symbol-level details.</p>
    </div>
  );
}

// ── DB Stock Summary panel ────────────────────────────────────────────────────

function DbStockSummaryPanel({ summary }: { summary: DbStockSummary }) {
  const metrics: Array<{ label: string; value: number; color: string }> = [
    { label: "Total stocks in DB", value: summary.totalStocks, color: "text-slate-200" },
    { label: "Active in ≥1 universe", value: summary.activeInAtLeastOneUniverse, color: "text-emerald-400" },
    { label: "Inactive only", value: summary.inactiveOnly, color: "text-amber-400" },
    { label: "Watchlist only (no active universe)", value: summary.watchlistOnly, color: "text-blue-400" },
    { label: "Not classified", value: summary.notClassified, color: "text-slate-500" },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
      {metrics.map(({ label, value, color }) => (
        <div key={label} className="bg-slate-900/60 border border-slate-700/60 rounded px-3 py-2.5">
          <p className={`text-xl font-bold ${color}`}>{value}</p>
          <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{label}</p>
        </div>
      ))}
    </div>
  );
}

// ── Universe Overview table ───────────────────────────────────────────────────

function formatSyncTime(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return (
    d.toLocaleDateString([], { month: "short", day: "numeric" }) +
    " " +
    d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  );
}

function UniverseOverviewTable({ rows }: { rows: UniverseOverviewRow[] }) {
  if (rows.length === 0) {
    return (
      <div className="flex items-start gap-2.5 text-slate-500">
        <Info className="w-4 h-4 shrink-0 mt-0.5" />
        <p className="text-sm">No universes found. Run a universe sync or check the seed.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left min-w-[760px]">
        <thead>
          <tr className="border-b border-slate-700">
            {[
              "Universe",
              "Active",
              "Inactive",
              "Total",
              "Missing Quotes",
              "Stale Quotes",
              "With Profile",
              "Last Universe Sync",
              "Last Quote Sync",
            ].map((h) => (
              <th
                key={h}
                className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.universeId} className="border-b border-slate-700/40 hover:bg-slate-800/30">
              <td className="px-3 py-2.5">
                <div className="flex items-center gap-1.5">
                  <Globe className="w-3 h-3 text-slate-500 shrink-0" />
                  <span className="text-sm text-slate-200 font-medium">{row.universeName}</span>
                </div>
                <span className="text-[10px] text-slate-600 font-mono">{row.universeSlug}</span>
              </td>
              <td className="px-3 py-2.5 text-sm text-emerald-400 font-semibold">{row.activeMembers}</td>
              <td className="px-3 py-2.5 text-sm text-amber-400">{row.inactiveMembers}</td>
              <td className="px-3 py-2.5 text-sm text-slate-300">{row.totalKnown}</td>
              <td className="px-3 py-2.5 text-sm">
                {row.missingQuotes > 0 ? (
                  <span className="text-red-400">{row.missingQuotes}</span>
                ) : (
                  <span className="text-slate-600">0</span>
                )}
              </td>
              <td className="px-3 py-2.5 text-sm">
                {row.staleQuotes > 0 ? (
                  <span className="text-amber-400">{row.staleQuotes}</span>
                ) : (
                  <span className="text-slate-600">0</span>
                )}
              </td>
              <td className="px-3 py-2.5 text-sm text-slate-300">{row.withProfile}</td>
              <td className="px-3 py-2.5 text-xs text-slate-400">{formatSyncTime(row.lastUniverseSync)}</td>
              <td className="px-3 py-2.5 text-xs text-slate-400">{formatSyncTime(row.lastQuoteSync)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Tab bar ───────────────────────────────────────────────────────────────────

const TABS: Array<{ id: TabId; label: string; icon: React.ReactNode }> = [
  { id: "overview", label: "Overview", icon: <BarChart3 className="w-3.5 h-3.5" /> },
  { id: "data-inventory", label: "Data Inventory", icon: <List className="w-3.5 h-3.5" /> },
  { id: "sync-actions", label: "Sync Actions", icon: <RefreshCw className="w-3.5 h-3.5" /> },
  { id: "provider-tests", label: "Provider Tests", icon: <FlaskConical className="w-3.5 h-3.5" /> },
  { id: "sync-history", label: "Sync History", icon: <History className="w-3.5 h-3.5" /> },
  { id: "score-methodology", label: "Score Methodology", icon: <BookOpen className="w-3.5 h-3.5" /> },
];

function TabBar({
  active,
  onChange,
}: {
  active: TabId;
  onChange: (id: TabId) => void;
}) {
  return (
    <div className="flex gap-0.5 border-b border-slate-700">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`inline-flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
            active === tab.id
              ? "text-white border-emerald-500"
              : "text-slate-400 hover:text-slate-200 border-transparent"
          }`}
        >
          {tab.icon}
          {tab.label}
        </button>
      ))}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function SyncPageClient({
  providerStatus,
  recentSyncRuns,
  universeOverview,
  dbStockSummary,
  stockInventory,
  initialChunkedSync,
  initialAnalystSync,
  initialTargetDiscoverySync,
}: SyncPageClientProps) {
  const router = useRouter();
  const [lastResult, setLastResult] = useState<LastResult>(null);
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [devToolsExpanded, setDevToolsExpanded] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Market data chunked sync state
  const [chunkedSync, setChunkedSync] = useState<ChunkedSyncProgress | null>(initialChunkedSync);
  const [autoRunning, setAutoRunning] = useState(false);
  const [chunkError, setChunkError] = useState<string | null>(null);
  const autoRunRef = useRef(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const syncStartedAtRef = useRef<number>(0);
  const [elapsedMs, setElapsedMs] = useState(0);

  // Analyst data chunked sync state
  const [analystSync, setAnalystSync] = useState<ChunkedSyncProgress | null>(initialAnalystSync);
  const [analystAutoRunning, setAnalystAutoRunning] = useState(false);
  const [analystChunkError, setAnalystChunkError] = useState<string | null>(null);
  const analystAutoRunRef = useRef(false);
  const analystPollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const analystSyncStartedAtRef = useRef<number>(0);
  const [analystElapsedMs, setAnalystElapsedMs] = useState(0);
  const analystTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Target discovery chunked sync state
  const [targetDiscoverySync, setTargetDiscoverySync] = useState<ChunkedSyncProgress | null>(initialTargetDiscoverySync);
  const [targetDiscoveryAutoRunning, setTargetDiscoveryAutoRunning] = useState(false);
  const [targetDiscoveryChunkError, setTargetDiscoveryChunkError] = useState<string | null>(null);
  const targetDiscoveryAutoRunRef = useRef(false);
  const targetDiscoveryPollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const targetDiscoverySyncStartedAtRef = useRef<number>(0);
  const [targetDiscoveryElapsedMs, setTargetDiscoveryElapsedMs] = useState(0);
  const targetDiscoveryTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (pollRef.current) clearInterval(pollRef.current);
      autoRunRef.current = false;
      if (analystTimerRef.current) clearInterval(analystTimerRef.current);
      if (analystPollRef.current) clearInterval(analystPollRef.current);
      analystAutoRunRef.current = false;
      if (targetDiscoveryTimerRef.current) clearInterval(targetDiscoveryTimerRef.current);
      if (targetDiscoveryPollRef.current) clearInterval(targetDiscoveryPollRef.current);
      targetDiscoveryAutoRunRef.current = false;
    };
  }, []);

  // ── Polling for chunked sync progress ──────────────────────────────────────

  function startPolling() {
    if (pollRef.current) return;
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch("/api/admin/sync-runs/latest", { cache: "no-store" });
        if (res.ok) {
          const progress: ChunkedSyncProgress | null = await res.json();
          if (progress) setChunkedSync(progress);
        }
      } catch {
        // network error — keep polling
      }
    }, 2000);
  }

  function stopPolling() {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }

  // ── Elapsed timer for chunked sync ─────────────────────────────────────────

  function startElapsedTimer() {
    syncStartedAtRef.current = Date.now();
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setElapsedMs(Date.now() - syncStartedAtRef.current);
    }, 500);
  }

  function stopElapsedTimer() {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }

  // ── Elapsed timer for other sync actions ───────────────────────────────────

  const [elapsedSeconds2, setElapsedSeconds2] = useState(0);
  const timerRef2 = useRef<ReturnType<typeof setInterval> | null>(null);

  function startTimer() {
    setElapsedSeconds2(0);
    if (timerRef2.current) clearInterval(timerRef2.current);
    timerRef2.current = setInterval(() => setElapsedSeconds2((s) => s + 1), 1000);
  }

  function stopTimer() {
    if (timerRef2.current) { clearInterval(timerRef2.current); timerRef2.current = null; }
  }

  // ── Chunked sync auto-run loop ─────────────────────────────────────────────

  const startAutoRun = useCallback(async () => {
    autoRunRef.current = true;
    setAutoRunning(true);
    setChunkError(null);
    startPolling();
    startElapsedTimer();

    try {
      while (autoRunRef.current) {
        const res = await fetch("/api/admin/sync-runs/process-next", { method: "POST" });
        const data = await res.json();

        if (!res.ok) {
          setChunkError(data.error ?? "Chunk processing failed.");
          break;
        }

        if (data.progress) setChunkedSync(data.progress);

        if (data.done || !autoRunRef.current) break;
        if (data.progress?.status !== "running") break;
      }
    } catch (err) {
      setChunkError(err instanceof Error ? err.message : "Network error during chunk.");
    }

    stopPolling();
    stopElapsedTimer();
    autoRunRef.current = false;
    setAutoRunning(false);

    // Final poll for latest state
    try {
      const finalRes = await fetch("/api/admin/sync-runs/latest", { cache: "no-store" });
      if (finalRes.ok) {
        const finalProgress = await finalRes.json();
        if (finalProgress) setChunkedSync(finalProgress);
      }
    } catch {
      // ignore
    }

    router.refresh();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  async function handleStartSync() {
    setChunkError(null);
    const res = await fetch("/api/admin/sync-runs/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: "start" }),
    });
    const data = await res.json();
    if (!res.ok) {
      setChunkError(data.error ?? "Failed to start sync.");
      return;
    }
    setChunkedSync(data);
    await startAutoRun();
  }

  async function handleContinue() {
    setChunkError(null);
    await startAutoRun();
  }

  async function handleRestart() {
    setChunkError(null);
    const res = await fetch("/api/admin/sync-runs/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: "restart" }),
    });
    const data = await res.json();
    if (!res.ok) {
      setChunkError(data.error ?? "Failed to restart sync.");
      return;
    }
    setChunkedSync(data);
    await startAutoRun();
  }

  // ── Analyst sync helpers ───────────────────────────────────────────────────

  function startAnalystPolling() {
    if (analystPollRef.current) return;
    analystPollRef.current = setInterval(async () => {
      try {
        const res = await fetch("/api/admin/analyst-sync/latest", { cache: "no-store" });
        if (res.ok) {
          const progress: ChunkedSyncProgress | null = await res.json();
          if (progress) setAnalystSync(progress);
        }
      } catch {
        // network error — keep polling
      }
    }, 2000);
  }

  function stopAnalystPolling() {
    if (analystPollRef.current) {
      clearInterval(analystPollRef.current);
      analystPollRef.current = null;
    }
  }

  function startAnalystElapsedTimer() {
    analystSyncStartedAtRef.current = Date.now();
    if (analystTimerRef.current) clearInterval(analystTimerRef.current);
    analystTimerRef.current = setInterval(() => {
      setAnalystElapsedMs(Date.now() - analystSyncStartedAtRef.current);
    }, 500);
  }

  function stopAnalystElapsedTimer() {
    if (analystTimerRef.current) {
      clearInterval(analystTimerRef.current);
      analystTimerRef.current = null;
    }
  }

  const startAnalystAutoRun = useCallback(async () => {
    analystAutoRunRef.current = true;
    setAnalystAutoRunning(true);
    setAnalystChunkError(null);
    startAnalystPolling();
    startAnalystElapsedTimer();

    try {
      while (analystAutoRunRef.current) {
        const res = await fetch("/api/admin/analyst-sync/process-next", { method: "POST" });
        const data = await res.json();

        if (!res.ok) {
          setAnalystChunkError(data.error ?? "Chunk processing failed.");
          break;
        }

        if (data.progress) setAnalystSync(data.progress);

        if (data.done || !analystAutoRunRef.current) break;
        if (data.progress?.status !== "running") break;
      }
    } catch (err) {
      setAnalystChunkError(err instanceof Error ? err.message : "Network error during chunk.");
    }

    stopAnalystPolling();
    stopAnalystElapsedTimer();
    analystAutoRunRef.current = false;
    setAnalystAutoRunning(false);

    try {
      const finalRes = await fetch("/api/admin/analyst-sync/latest", { cache: "no-store" });
      if (finalRes.ok) {
        const finalProgress = await finalRes.json();
        if (finalProgress) setAnalystSync(finalProgress);
      }
    } catch {
      // ignore
    }

    router.refresh();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  async function handleStartAnalystSync() {
    setAnalystChunkError(null);
    const res = await fetch("/api/admin/analyst-sync/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: "start" }),
    });
    const data = await res.json();
    if (!res.ok) {
      setAnalystChunkError(data.error ?? "Failed to start analyst sync.");
      return;
    }
    setAnalystSync(data);
    await startAnalystAutoRun();
  }

  async function handleContinueAnalystSync() {
    setAnalystChunkError(null);
    await startAnalystAutoRun();
  }

  async function handleRestartAnalystSync() {
    setAnalystChunkError(null);
    const res = await fetch("/api/admin/analyst-sync/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: "restart" }),
    });
    const data = await res.json();
    if (!res.ok) {
      setAnalystChunkError(data.error ?? "Failed to restart analyst sync.");
      return;
    }
    setAnalystSync(data);
    await startAnalystAutoRun();
  }

  // ── Target discovery helpers ───────────────────────────────────────────────

  function startTargetDiscoveryPolling() {
    if (targetDiscoveryPollRef.current) return;
    targetDiscoveryPollRef.current = setInterval(async () => {
      try {
        const res = await fetch("/api/admin/analyst-target-discovery/latest", { cache: "no-store" });
        if (res.ok) {
          const progress: ChunkedSyncProgress | null = await res.json();
          if (progress) setTargetDiscoverySync(progress);
        }
      } catch {
        // network error — keep polling
      }
    }, 2000);
  }

  function stopTargetDiscoveryPolling() {
    if (targetDiscoveryPollRef.current) {
      clearInterval(targetDiscoveryPollRef.current);
      targetDiscoveryPollRef.current = null;
    }
  }

  function startTargetDiscoveryElapsedTimer() {
    targetDiscoverySyncStartedAtRef.current = Date.now();
    if (targetDiscoveryTimerRef.current) clearInterval(targetDiscoveryTimerRef.current);
    targetDiscoveryTimerRef.current = setInterval(() => {
      setTargetDiscoveryElapsedMs(Date.now() - targetDiscoverySyncStartedAtRef.current);
    }, 500);
  }

  function stopTargetDiscoveryElapsedTimer() {
    if (targetDiscoveryTimerRef.current) {
      clearInterval(targetDiscoveryTimerRef.current);
      targetDiscoveryTimerRef.current = null;
    }
  }

  const startTargetDiscoveryAutoRun = useCallback(async () => {
    targetDiscoveryAutoRunRef.current = true;
    setTargetDiscoveryAutoRunning(true);
    setTargetDiscoveryChunkError(null);
    startTargetDiscoveryPolling();
    startTargetDiscoveryElapsedTimer();

    try {
      while (targetDiscoveryAutoRunRef.current) {
        const res = await fetch("/api/admin/analyst-target-discovery/process-next", { method: "POST" });
        const data = await res.json();

        if (!res.ok) {
          setTargetDiscoveryChunkError(data.error ?? "Chunk processing failed.");
          break;
        }

        if (data.progress) setTargetDiscoverySync(data.progress);

        if (data.done || !targetDiscoveryAutoRunRef.current) break;
        if (data.progress?.status !== "running") break;
      }
    } catch (err) {
      setTargetDiscoveryChunkError(err instanceof Error ? err.message : "Network error during chunk.");
    }

    stopTargetDiscoveryPolling();
    stopTargetDiscoveryElapsedTimer();
    targetDiscoveryAutoRunRef.current = false;
    setTargetDiscoveryAutoRunning(false);

    try {
      const finalRes = await fetch("/api/admin/analyst-target-discovery/latest", { cache: "no-store" });
      if (finalRes.ok) {
        const finalProgress = await finalRes.json();
        if (finalProgress) setTargetDiscoverySync(finalProgress);
      }
    } catch {
      // ignore
    }

    router.refresh();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  async function handleStartTargetDiscovery() {
    setTargetDiscoveryChunkError(null);
    const res = await fetch("/api/admin/analyst-target-discovery/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: "start" }),
    });
    const data = await res.json();
    if (!res.ok) {
      setTargetDiscoveryChunkError(data.error ?? "Failed to start target discovery.");
      return;
    }
    setTargetDiscoverySync(data);
    await startTargetDiscoveryAutoRun();
  }

  async function handleContinueTargetDiscovery() {
    setTargetDiscoveryChunkError(null);
    // If the run hit the attempt limit (processedCount >= MAX_ATTEMPTS_PER_RUN),
    // process-next would immediately return done without processing anything.
    // Create a new run so the next batch of eligible symbols is processed.
    const MAX_ATTEMPTS = 40;
    const hitLimit = targetDiscoverySync !== null && targetDiscoverySync.processedCount >= MAX_ATTEMPTS;
    if (hitLimit) {
      const res = await fetch("/api/admin/analyst-target-discovery/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "start" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setTargetDiscoveryChunkError(data.error ?? "Failed to continue target discovery.");
        return;
      }
      setTargetDiscoverySync(data);
    }
    await startTargetDiscoveryAutoRun();
  }

  async function handleRestartTargetDiscovery() {
    if (!confirm("This will start a new target discovery cycle. Existing target data will be updated safely where new data is found. Continue?")) return;
    setTargetDiscoveryChunkError(null);
    const res = await fetch("/api/admin/analyst-target-discovery/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: "restart" }),
    });
    const data = await res.json();
    if (!res.ok) {
      setTargetDiscoveryChunkError(data.error ?? "Failed to restart target discovery.");
      return;
    }
    setTargetDiscoverySync(data);
    await startTargetDiscoveryAutoRun();
  }

  // ── Other sync/test helpers ────────────────────────────────────────────────

  function runTest(label: string, fn: () => Promise<ProviderTestResult>) {
    setActiveAction(label);
    startTransition(async () => {
      const result = await fn();
      setLastResult({ kind: "test", result });
      setActiveAction(null);
    });
  }

  function runSync(label: string, fn: () => Promise<SyncActionResult>) {
    setActiveAction(label);
    startTimer();
    startTransition(async () => {
      const result = await fn();
      stopTimer();
      setLastResult({ kind: "sync", result });
      setActiveAction(null);
      router.refresh();
    });
  }

  function runUniverseSync(label: string, fn: () => Promise<UniverseSyncActionResult>) {
    setActiveAction(label);
    startTimer();
    startTransition(async () => {
      const result = await fn();
      stopTimer();
      setLastResult({ kind: "universe", result });
      setActiveAction(null);
      router.refresh();
    });
  }

  function runScoreCalc(label: string, fn: () => Promise<ScoreCalcResult>) {
    setActiveAction(label);
    startTimer();
    startTransition(async () => {
      const result = await fn();
      stopTimer();
      setLastResult({ kind: "score-calc", result });
      setActiveAction(null);
      router.refresh();
    });
  }

  // ── Derived state ──────────────────────────────────────────────────────────

  const isLoading = isPending;
  const allConfigured = providerStatus.fmp && providerStatus.twelveData && providerStatus.finnhub;

  const activeSyncMeta =
    activeAction && activeAction in SYNC_ACTION_META ? SYNC_ACTION_META[activeAction] : null;
  const isSyncRunning = activeSyncMeta !== null;

  const nasdaq100Overview = universeOverview.find((r) => r.universeSlug === "nasdaq-100") ?? null;
  const nasdaq100MetricSynced = nasdaq100Overview
    ? nasdaq100Overview.activeMembers - nasdaq100Overview.missingMetrics
    : null;
  const nasdaq100MetricMissing = nasdaq100Overview?.missingMetrics ?? null;
  const nasdaq100MetricTotal = nasdaq100Overview?.activeMembers ?? null;

  const lastSyncResult =
    lastResult?.kind === "sync" ||
    lastResult?.kind === "universe" ||
    lastResult?.kind === "score-calc"
      ? lastResult
      : null;
  const lastTestResult = lastResult?.kind === "test" ? lastResult : null;

  const showProgress = autoRunning;
  const showPaused = !autoRunning && isIncomplete(chunkedSync);
  const showResult = !autoRunning && chunkedSync && isTerminal(chunkedSync);
  const showContinue = !autoRunning && isIncomplete(chunkedSync);
  const showRestart = !autoRunning && chunkedSync !== null;

  const analystShowProgress = analystAutoRunning;
  const analystShowPaused = !analystAutoRunning && isIncomplete(analystSync);
  const analystShowResult = !analystAutoRunning && analystSync && isTerminal(analystSync);
  const analystShowContinue = !analystAutoRunning && isIncomplete(analystSync);
  const analystShowRestart = !analystAutoRunning && analystSync !== null;

  const targetDiscoveryShowProgress = targetDiscoveryAutoRunning;
  const targetDiscoveryShowPaused = !targetDiscoveryAutoRunning && isIncomplete(targetDiscoverySync);
  const targetDiscoveryShowResult = !targetDiscoveryAutoRunning && targetDiscoverySync && isTerminal(targetDiscoverySync);
  const targetDiscoveryShowContinue = !targetDiscoveryAutoRunning && isIncomplete(targetDiscoverySync);
  const targetDiscoveryShowRestart = !targetDiscoveryAutoRunning && targetDiscoverySync !== null;
  const targetDiscoveryNeverRun = targetDiscoverySync === null;

  const anyChunkedRunning = autoRunning || analystAutoRunning || targetDiscoveryAutoRunning;

  return (
    <div className="max-w-4xl mx-auto space-y-5">

      {/* ── Page header ─────────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <ShieldAlert className="w-4 h-4 text-amber-500" />
          <span className="text-xs font-semibold uppercase tracking-widest text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded">
            Admin / Developer
          </span>
        </div>
        <h1 className="text-xl font-bold text-white">Admin Sync</h1>
        <p className="text-sm text-slate-400 mt-1">
          Manage universe membership, sync company and market data, calculate scores, and test data providers.
        </p>
      </div>

      {/* ── Tab bar ─────────────────────────────────────────────────────── */}
      <TabBar active={activeTab} onChange={setActiveTab} />

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* Tab 1 — Overview                                                  */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {activeTab === "overview" && (
        <div className="space-y-5">
          <section className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-slate-400" />
              <h2 className="text-sm font-semibold text-slate-200">DB Stock Summary</h2>
              <span className="text-xs text-slate-500 ml-1">Read-only snapshot</span>
            </div>
            <DbStockSummaryPanel summary={dbStockSummary} />
          </section>

          <section className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-slate-400" />
              <h2 className="text-sm font-semibold text-slate-200">Universe Overview</h2>
              <span className="text-xs text-slate-500 ml-1">Read-only snapshot — updates after each sync</span>
            </div>
            <UniverseOverviewTable rows={universeOverview} />
          </section>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* Tab 2 — Data Inventory                                            */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {activeTab === "data-inventory" && (
        <DataInventoryTab rows={stockInventory} />
      )}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* Tab 3 — Sync Actions                                              */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {activeTab === "sync-actions" && (
        <div className="space-y-5">

          {/* 1 — Universe Sync */}
          <section className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 space-y-3">
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <Globe className="w-4 h-4 text-slate-400" />
                <h2 className="text-sm font-semibold text-slate-200">Universe Sync</h2>
                <span className="text-xs font-medium text-emerald-700 bg-emerald-900/40 border border-emerald-800/50 px-2 py-0.5 rounded ml-1">
                  Writes to DB
                </span>
                <span className="text-xs font-medium text-slate-500 bg-slate-700/60 px-2 py-0.5 rounded ml-1">
                  Manual / Weekly
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Builds and updates the active stock universe. Creates missing stocks, updates membership,
                and marks removed symbols inactive. Does not sync market or financial data.
              </p>
            </div>
            <ActionButton
              variant="sync"
              onClick={() => runUniverseSync("sync-nasdaq100", syncNasdaq100UniverseAction)}
              disabled={isLoading || anyChunkedRunning}
              loading={activeAction === "sync-nasdaq100"}
              label="Sync Stock Universe"
              description="Syncs Nasdaq 100 membership from the static fallback list. FMP index constituent endpoints require a higher plan tier, so static fallback is the current universe membership source. No quote or financial data sync."
            />
            {isSyncRunning && activeAction === "sync-nasdaq100" && activeSyncMeta && (
              <SyncInProgressPanel
                actionLabel={activeSyncMeta.label}
                elapsedSeconds={elapsedSeconds2}
                durationNote={activeSyncMeta.durationNote}
              />
            )}
            <div className="rounded bg-slate-900/60 border border-slate-700/60 px-3 py-2.5 space-y-2">
              <div className="flex items-start gap-2">
                <Info className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                <div className="text-xs space-y-0.5">
                  <p className="text-slate-300 font-medium">
                    Current source: Static fallback list
                  </p>
                  <p className="text-slate-500">
                    Nasdaq 100 membership currently uses a manually validated static fallback list
                    because FMP index constituent endpoints require a higher plan tier. This affects
                    universe membership only. FMP Starter is still used for company, market,
                    financial, and analyst target data in other sync workflows.
                  </p>
                  <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1.5 text-slate-500 font-mono">
                    <span>compositionAsOf: <span className="text-slate-400">2026-01-20</span></span>
                    <span>lastVerifiedAt: <span className="text-slate-400">2026-05-21</span></span>
                    <span>symbolCount: <span className="text-slate-400">100</span></span>
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-2 border-t border-slate-700/60 pt-2">
                <Info className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                <p className="text-xs text-slate-500 leading-relaxed">
                  <span className="text-slate-400 font-medium">Safe: </span>
                  Stocks leaving the index have their membership marked inactive — they are never
                  deleted. Stocks re-entering the index are reactivated. Existing quotes, watchlist
                  items, and alerts are untouched.
                </p>
              </div>
            </div>
          </section>

          {/* 2 — Daily Market Data Sync (chunked) */}
          <section className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 space-y-3">
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <RefreshCw className="w-4 h-4 text-slate-400" />
                <h2 className="text-sm font-semibold text-slate-200">Daily Market Data Sync</h2>
                <span className="text-xs font-medium text-emerald-700 bg-emerald-900/40 border border-emerald-800/50 px-2 py-0.5 rounded ml-1">
                  Writes to DB
                </span>
                <span className="text-xs font-medium text-slate-500 bg-slate-700/60 px-2 py-0.5 rounded ml-1">
                  Daily
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Refreshes daily-changing market data for all active stocks: quotes, price movement,
                volume, and market context. Runs in resumable chunks — progress is saved after each
                stock so the sync can be continued if interrupted. Current implementation still uses
                the legacy Finnhub quote + basic metrics sync until the FMP daily-data migration is
                completed.
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap gap-2">
              {!chunkedSync || isTerminal(chunkedSync) ? (
                <button
                  onClick={handleStartSync}
                  disabled={isLoading || anyChunkedRunning}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium bg-emerald-700 hover:bg-emerald-600 text-white border border-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {anyChunkedRunning ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Play className="w-3.5 h-3.5" />
                  )}
                  Sync Daily Market Data
                </button>
              ) : null}

              {showContinue && (
                <button
                  onClick={handleContinue}
                  disabled={isLoading || anyChunkedRunning}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium bg-blue-700 hover:bg-blue-600 text-white border border-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <SkipForward className="w-3.5 h-3.5" />
                  Continue Sync
                </button>
              )}

              {showRestart && !autoRunning && (
                <button
                  onClick={handleRestart}
                  disabled={isLoading || anyChunkedRunning}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium bg-slate-700 hover:bg-slate-600 text-slate-200 border border-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Restart Full Sync
                </button>
              )}
            </div>

            {/* Progress panel — while auto-running */}
            {showProgress && chunkedSync && (
              <ChunkedSyncProgressPanel
                progress={chunkedSync}
                autoRunning={autoRunning}
                chunkError={chunkError}
                elapsedMs={elapsedMs}
              />
            )}

            {/* Paused panel — interrupted and continuable */}
            {showPaused && chunkedSync && (
              <PausedSyncPanel progress={chunkedSync} chunkError={chunkError} />
            )}

            {/* Chunk error when no run is active yet */}
            {chunkError && !chunkedSync && (
              <p className="text-xs text-red-400 bg-red-900/20 border border-red-800/40 rounded px-3 py-2">
                {chunkError}
              </p>
            )}

            {/* Result panel after completion */}
            {showResult && chunkedSync && (
              <ChunkedSyncResultPanel progress={chunkedSync} />
            )}

            {/* Explanation panel */}
            <div className="rounded bg-slate-900/60 border border-slate-700/60 px-3 py-2.5 space-y-2">
              <div className="flex items-start gap-2">
                <Info className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                <div className="text-xs space-y-0.5 text-slate-500">
                  <p>Run once per trading day, preferably after market close.</p>
                  <p>Current provider: Finnhub legacy sync. Fetches quote + basic metrics per stock (2 calls). In the upcoming FMP migration, company metrics will move to Company Data Sync and this workflow will focus on daily market data only. Chunk size: 10.</p>
                  {nasdaq100MetricTotal !== null && (
                    <>
                      <p>
                        Active Nasdaq 100 stocks:{" "}
                        <span className="text-slate-300 font-mono">{nasdaq100MetricTotal}</span>
                      </p>
                      <p>
                        Estimated Finnhub calls:{" "}
                        <span className="text-slate-300 font-mono">{nasdaq100MetricTotal * 2}</span>
                      </p>
                    </>
                  )}
                  <p>Estimated duration: ~3–5 minutes for 100 stocks.</p>
                  <p>Rate limited to ~54 calls/minute (≥1.1s between calls).</p>
                  <p className="text-amber-500">Please keep this page open while the sync runs.</p>
                </div>
              </div>
              <div className="flex items-start gap-2 border-t border-slate-700/60 pt-2">
                <Info className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                <p className="text-xs text-slate-500 leading-relaxed">
                  Current legacy sync may update basic metrics. After the FMP migration, Fundamental
                  Scores should be refreshed after{" "}
                  <span className="text-slate-400 font-medium">Company Data Sync</span>
                  , not after a pure daily market data sync.
                </p>
              </div>
            </div>

            {nasdaq100MetricTotal !== null && (
              <div className="rounded bg-slate-900/60 border border-slate-700/60 px-3 py-2.5 space-y-1.5">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Legacy metrics coverage
                </p>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Current legacy Finnhub sync coverage. Company metrics will move to Company Data Sync after the FMP migration.
                </p>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <p className="text-slate-500 mb-0.5">Have metrics</p>
                    <p className={`font-mono font-semibold ${nasdaq100MetricSynced === nasdaq100MetricTotal ? "text-emerald-400" : "text-slate-200"}`}>
                      {nasdaq100MetricSynced} / {nasdaq100MetricTotal}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500 mb-0.5">Missing metrics</p>
                    <p className={`font-mono font-semibold ${nasdaq100MetricMissing! > 0 ? "text-amber-400" : "text-slate-600"}`}>
                      {nasdaq100MetricMissing}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* 3 — Company Data Sync (chunked) */}
          <section className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 space-y-3">
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <Database className="w-4 h-4 text-slate-400" />
                <h2 className="text-sm font-semibold text-slate-200">Company Data Sync</h2>
                <span className="text-xs font-medium text-emerald-700 bg-emerald-900/40 border border-emerald-800/50 px-2 py-0.5 rounded ml-1">
                  Writes to DB
                </span>
                <span className="text-xs font-medium text-slate-500 bg-slate-700/60 px-2 py-0.5 rounded ml-1">
                  Weekly / Slow-changing
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Syncs slower-changing company data for all active stocks. Current implementation
                refreshes analyst target prices, recommendation counts, and upside %. Future FMP
                migration will add fundamentals, ratios, growth, profile, and earnings data. Does
                not calculate scores automatically.
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap gap-2">
              {!analystSync || isTerminal(analystSync) ? (
                <button
                  onClick={handleStartAnalystSync}
                  disabled={isLoading || anyChunkedRunning}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium bg-emerald-700 hover:bg-emerald-600 text-white border border-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {analystAutoRunning ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Play className="w-3.5 h-3.5" />
                  )}
                  Sync Company Data
                </button>
              ) : null}

              {analystShowContinue && (
                <button
                  onClick={handleContinueAnalystSync}
                  disabled={isLoading || anyChunkedRunning}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium bg-blue-700 hover:bg-blue-600 text-white border border-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <SkipForward className="w-3.5 h-3.5" />
                  Continue Sync
                </button>
              )}

              {analystShowRestart && !analystAutoRunning && (
                <button
                  onClick={handleRestartAnalystSync}
                  disabled={isLoading || anyChunkedRunning}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium bg-slate-700 hover:bg-slate-600 text-slate-200 border border-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Restart Full Sync
                </button>
              )}
            </div>

            {analystShowProgress && analystSync && (
              <ChunkedSyncProgressPanel
                progress={analystSync}
                autoRunning={analystAutoRunning}
                chunkError={analystChunkError}
                elapsedMs={analystElapsedMs}
              />
            )}

            {analystShowPaused && analystSync && (
              <PausedSyncPanel progress={analystSync} chunkError={analystChunkError} />
            )}

            {analystChunkError && !analystSync && (
              <p className="text-xs text-red-400 bg-red-900/20 border border-red-800/40 rounded px-3 py-2">
                {analystChunkError}
              </p>
            )}

            {analystShowResult && analystSync && (
              <ChunkedSyncResultPanel progress={analystSync} />
            )}

            <div className="rounded bg-slate-900/60 border border-slate-700/60 px-3 py-2.5 space-y-2">
              <div className="flex items-start gap-2">
                <Info className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                <div className="text-xs space-y-0.5 text-slate-500">
                  <p>Target prices: FMP <span className="font-mono text-slate-400">/stable/price-target-consensus</span> (targetConsensus, targetHigh, targetLow, targetMedian).</p>
                  <p>Recommendation counts: Finnhub <span className="font-mono text-slate-400">/stock/recommendation</span> (strongBuy/buy/hold/sell/strongSell).</p>
                  <p>Chunk size: 10 stocks. Uses ~1.2s pacing between symbols to stay within provider limits.</p>
                  <p>Upside % is calculated internally: <span className="font-mono text-slate-400">((targetConsensus - price) / price) × 100</span>.</p>
                </div>
              </div>
            </div>
          </section>

          {/* 4 — Score Calculation */}
          <section className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 space-y-3">
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <Calculator className="w-4 h-4 text-slate-400" />
                <h2 className="text-sm font-semibold text-slate-200">Score Calculation</h2>
                <span className="text-xs font-medium text-blue-700 bg-blue-900/40 border border-blue-800/50 px-2 py-0.5 rounded ml-1">
                  Internal
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Calculates internal Fundamental Score v1 for stocks with synced Finnhub metrics. Does not call external APIs.
              </p>
            </div>
            <ActionButton
              variant="sync"
              onClick={() => runScoreCalc("calc-fundamental-scores", calculateFundamentalScoresAction)}
              disabled={isLoading || anyChunkedRunning}
              loading={activeAction === "calc-fundamental-scores"}
              label="Calculate Fundamental Scores"
              description="Reads existing StockMetric rows and writes Fundamental Score to StockScore. No external API calls. Stocks with a score + quote become scanner-eligible."
            />
            {isSyncRunning && activeAction === "calc-fundamental-scores" && activeSyncMeta && (
              <SyncInProgressPanel
                actionLabel={activeSyncMeta.label}
                elapsedSeconds={elapsedSeconds2}
                durationNote={activeSyncMeta.durationNote}
              />
            )}
            <div className="flex items-start gap-2 rounded bg-slate-900/60 border border-slate-700/60 px-3 py-2.5">
              <Info className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
              <p className="text-xs text-slate-500 leading-relaxed">
                <span className="text-slate-400 font-medium">Safe: </span>
                Updates only <span className="font-mono text-slate-400">fundamentalScore</span> and related category fields on existing
                score rows. Does not overwrite <span className="font-mono text-slate-400">hotScore</span> or{" "}
                <span className="font-mono text-slate-400">opportunityScore</span>. Creates a minimal score row for stocks that
                have metrics but no existing score yet.
              </p>
            </div>

            <ActionButton
              variant="sync"
              onClick={() => runScoreCalc("calc-opportunity-scores", calculateOpportunityScoresAction)}
              disabled={isLoading || anyChunkedRunning}
              loading={activeAction === "calc-opportunity-scores"}
              label="Calculate Opportunity Scores"
              description="Calculates Opportunity Score v1 from stored Fundamental Score, valuation, growth, risk/context, and 52-week price position. No external APIs."
            />
            {isSyncRunning && activeAction === "calc-opportunity-scores" && activeSyncMeta && (
              <SyncInProgressPanel
                actionLabel={activeSyncMeta.label}
                elapsedSeconds={elapsedSeconds2}
                durationNote={activeSyncMeta.durationNote}
              />
            )}
            <div className="flex items-start gap-2 rounded bg-slate-900/60 border border-slate-700/60 px-3 py-2.5">
              <Info className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
              <p className="text-xs text-slate-500 leading-relaxed">
                <span className="text-slate-400 font-medium">Internal: </span>
                Updates only <span className="font-mono text-slate-400">oppScore</span>,{" "}
                <span className="font-mono text-slate-400">oppScoreVersion</span>, and{" "}
                <span className="font-mono text-slate-400">oppCalculatedAt</span>. Skips stocks with no{" "}
                <span className="font-mono text-slate-400">fundamentalScore</span>. No external provider calls.
              </p>
            </div>
          </section>

          {/* 5 — Developer / Legacy Tools */}
          <section className="bg-slate-800/50 border border-slate-700/60 rounded-lg overflow-hidden">
            <button
              className="w-full flex items-center gap-2 px-4 py-3 text-left hover:bg-slate-700/30 transition-colors"
              onClick={() => setDevToolsExpanded((v) => !v)}
            >
              {devToolsExpanded ? (
                <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" />
              ) : (
                <ChevronRight className="w-4 h-4 text-slate-500 shrink-0" />
              )}
              <FlaskConical className="w-4 h-4 text-slate-500 shrink-0" />
              <span className="text-sm font-medium text-slate-400">Developer / Legacy Tools</span>
              <span className="text-xs font-medium text-slate-600 bg-slate-700/60 px-2 py-0.5 rounded ml-1">
                Not production workflows
              </span>
            </button>

            {devToolsExpanded && (
              <div className="border-t border-slate-700/60 p-4 space-y-4">
                <p className="text-xs text-slate-500 leading-relaxed">
                  These tools are legacy or developer-only utilities. They are not part of the main sync workflow.
                  Company Data Sync now uses FMP <span className="font-mono">price-target-consensus</span> as the primary target source.
                  Analyst Target Discovery is a legacy fallback for limited/free FMP plans.
                </p>

                {/* Analyst Target Discovery (Legacy) */}
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <Database className="w-4 h-4 text-slate-500" />
                      <h3 className="text-sm font-medium text-slate-400">Analyst Target Discovery</h3>
                      <span className="text-xs font-medium text-amber-700 bg-amber-900/40 border border-amber-800/50 px-2 py-0.5 rounded ml-1">
                        Legacy
                      </span>
                      <span className="text-xs font-medium text-blue-700 bg-blue-900/40 border border-blue-800/50 px-2 py-0.5 rounded ml-1">
                        Quota Safe
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      Legacy fallback for limited/free plans. Company Data Sync now uses FMP price-target-consensus as the primary target source.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {(targetDiscoveryNeverRun || (!targetDiscoveryAutoRunning && isTerminal(targetDiscoverySync))) && (
                      <button
                        onClick={handleStartTargetDiscovery}
                        disabled={isLoading || anyChunkedRunning}
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium bg-slate-700 hover:bg-slate-600 text-slate-200 border border-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {targetDiscoveryAutoRunning ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Play className="w-3.5 h-3.5" />
                        )}
                        Start Target Discovery
                      </button>
                    )}

                    {targetDiscoveryShowContinue && (
                      <button
                        onClick={handleContinueTargetDiscovery}
                        disabled={isLoading || anyChunkedRunning}
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium bg-blue-700 hover:bg-blue-600 text-white border border-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <SkipForward className="w-3.5 h-3.5" />
                        Continue Target Discovery
                      </button>
                    )}

                    {targetDiscoveryShowRestart && !targetDiscoveryAutoRunning && (
                      <button
                        onClick={handleRestartTargetDiscovery}
                        disabled={isLoading || anyChunkedRunning}
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium bg-slate-700 hover:bg-slate-600 text-slate-200 border border-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Restart Discovery Cycle
                      </button>
                    )}
                  </div>

                  {targetDiscoveryShowProgress && targetDiscoverySync && (
                    <ChunkedSyncProgressPanel
                      progress={targetDiscoverySync}
                      autoRunning={targetDiscoveryAutoRunning}
                      chunkError={targetDiscoveryChunkError}
                      elapsedMs={targetDiscoveryElapsedMs}
                    />
                  )}

                  {targetDiscoveryShowPaused && targetDiscoverySync && (
                    <PausedSyncPanel progress={targetDiscoverySync} chunkError={targetDiscoveryChunkError} />
                  )}

                  {targetDiscoveryChunkError && !targetDiscoverySync && (
                    <p className="text-xs text-red-400 bg-red-900/20 border border-red-800/40 rounded px-3 py-2">
                      {targetDiscoveryChunkError}
                    </p>
                  )}

                  {targetDiscoveryShowResult && targetDiscoverySync && (
                    <ChunkedSyncResultPanel progress={targetDiscoverySync} />
                  )}

                  <div className="rounded bg-slate-900/60 border border-slate-700/60 px-3 py-2.5 space-y-1">
                    <div className="flex items-start gap-2">
                      <Info className="w-3.5 h-3.5 text-slate-600 shrink-0 mt-0.5" />
                      <div className="text-xs space-y-0.5 text-slate-600">
                        <p>Uses FMP <span className="font-mono text-slate-500">/stable/price-target-summary</span>. 1 call per symbol.</p>
                        <p>Run limits: max 40 attempts or 16 targets found per run. Chunk size: 10.</p>
                        <p>Cooldowns: has_target → 14d · no_target → 30d · error → 1d · plan_limited (HTTP 402) → 90d.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* Review Results (for universe sync and score calc) */}
          {lastSyncResult !== null && (
            <section className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
              <h2 className="text-sm font-semibold text-slate-200 mb-3">Review Results</h2>
              {lastSyncResult.kind === "sync" ? (
                <SyncResultViewer result={lastSyncResult.result} />
              ) : lastSyncResult.kind === "universe" ? (
                <UniverseSyncResultViewer result={lastSyncResult.result} />
              ) : (
                <ScoreCalcResultViewer result={(lastSyncResult as { kind: "score-calc"; result: ScoreCalcResult }).result} />
              )}
            </section>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* Tab 4 — Provider Tests                                            */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {activeTab === "provider-tests" && (
        <div className="space-y-5">

          {/* API Key Configuration */}
          <section className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-slate-400" />
              <h2 className="text-sm font-semibold text-slate-200">API Key Configuration</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {(
                [
                  { label: "FMP", key: "fmp" as const },
                  { label: "Twelve Data", key: "twelveData" as const },
                  { label: "Finnhub", key: "finnhub" as const },
                ] as const
              ).map(({ label, key }) => (
                <div
                  key={key}
                  className="flex items-center justify-between bg-slate-900/60 rounded px-3 py-2"
                >
                  <span className="text-sm text-slate-300">{label}</span>
                  <StatusBadge configured={providerStatus[key]} />
                </div>
              ))}
            </div>
            {!allConfigured && (
              <div className="rounded bg-amber-900/20 border border-amber-700/40 px-3 py-2.5 text-xs text-amber-300 space-y-1.5">
                <p className="font-semibold">One or more API keys are missing</p>
                <p>
                  Add the following to{" "}
                  <span className="font-mono">.env.local</span> and restart the dev server:
                </p>
                <pre className="mt-1 text-amber-200/80 leading-relaxed">
{`FMP_API_KEY=
TWELVE_DATA_API_KEY=
FINNHUB_API_KEY=`}
                </pre>
                <p className="text-amber-500">Do not paste key values into chat.</p>
              </div>
            )}
          </section>

          {/* Provider Tests */}
          <section className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 space-y-3">
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <FlaskConical className="w-4 h-4 text-slate-400" />
                <h2 className="text-sm font-semibold text-slate-200">Provider Tests</h2>
                <span className="text-xs font-medium text-slate-500 bg-slate-700/60 px-2 py-0.5 rounded ml-1">
                  No DB write
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Fetch a single NVDA result from each provider and display the normalized output.
                Nothing is written to the database.
              </p>
            </div>
            <div className="space-y-2.5">
              <ActionButton
                variant="test"
                onClick={() => runTest("fmp-profile", testFmpProfileAction)}
                disabled={isLoading}
                loading={activeAction === "fmp-profile"}
                label="Test FMP Profile"
                description="Fetches NVDA company profile from FMP. No DB write."
              />
              <ActionButton
                variant="test"
                onClick={() => runTest("twelve-quote", testTwelveQuoteAction)}
                disabled={isLoading}
                loading={activeAction === "twelve-quote"}
                label="Test Twelve Quote"
                description="Fetches NVDA latest quote from Twelve Data. No DB write."
              />
              <ActionButton
                variant="test"
                onClick={() => runTest("finnhub-news", testFinnhubNewsAction)}
                disabled={isLoading}
                loading={activeAction === "finnhub-news"}
                label="Test Finnhub News"
                description="Fetches recent NVDA news headlines from Finnhub. No DB write."
              />
            </div>
          </section>

          {/* Test Results */}
          <section className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
            <h2 className="text-sm font-semibold text-slate-200 mb-3">Test Result</h2>
            {lastTestResult === null ? (
              <div className="flex items-start gap-2.5 text-slate-500">
                <Info className="w-4 h-4 shrink-0 mt-0.5" />
                <p className="text-sm leading-relaxed">
                  No provider test has run yet. Click a test button above to see the result here.
                </p>
              </div>
            ) : (
              <TestResultViewer result={lastTestResult.result} />
            )}
          </section>

          {/* Sample DB Writes */}
          <section className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 space-y-3">
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <Database className="w-4 h-4 text-slate-400" />
                <h2 className="text-sm font-semibold text-slate-200">Sample DB Writes</h2>
                <span className="text-xs font-medium text-emerald-700 bg-emerald-900/40 border border-emerald-800/50 px-2 py-0.5 rounded ml-1">
                  Writes to DB
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Developer utility. Writes sample data for up to 5 existing DB symbols. Nothing is
                created — only valid fields on existing stocks are updated.
              </p>
            </div>
            <div className="space-y-2.5">
              <ActionButton
                variant="sync"
                onClick={() => runSync("sync-quotes", syncQuotesSampleAction)}
                disabled={isLoading}
                loading={activeAction === "sync-quotes"}
                label="Sync Quotes Sample"
                description="Updates StockQuote (price, changePercent, volume, source, lastSyncedAt) for up to 5 existing DB symbols via Twelve Data."
              />
              <ActionButton
                variant="sync"
                onClick={() => runSync("sync-profiles", syncProfilesSampleAction)}
                disabled={isLoading}
                loading={activeAction === "sync-profiles"}
                label="Sync Profiles Sample"
                description="Updates Stock (name, sector, marketCap) for up to 5 existing DB symbols via FMP."
              />
            </div>
            {isSyncRunning && (activeAction === "sync-quotes" || activeAction === "sync-profiles") && activeSyncMeta && (
              <SyncInProgressPanel
                actionLabel={activeSyncMeta.label}
                elapsedSeconds={elapsedSeconds2}
                durationNote={activeSyncMeta.durationNote}
              />
            )}
            <div className="flex items-start gap-2 rounded bg-slate-900/60 border border-slate-700/60 px-3 py-2.5">
              <Info className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
              <p className="text-xs text-slate-500 leading-relaxed">
                <span className="text-slate-400 font-medium">DB safety: </span>
                If provider data is missing, empty, invalid, or the API fails, existing DB values are
                kept unchanged and the symbol is reported as skipped or failed.
              </p>
            </div>
          </section>

          {/* Sample DB Writes — Review Results */}
          {lastSyncResult !== null && lastSyncResult.kind === "sync" && (
            <section className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
              <h2 className="text-sm font-semibold text-slate-200 mb-3">Review Results</h2>
              <SyncResultViewer result={lastSyncResult.result} />
            </section>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* Tab 5 — Sync History                                              */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {activeTab === "sync-history" && (
        <div className="space-y-5">
          <section className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <History className="w-4 h-4 text-slate-400" />
              <h2 className="text-sm font-semibold text-slate-200">Recent Sync Runs</h2>
              <span className="text-xs text-slate-500 ml-1">Latest 10 runs</span>
            </div>
            <RecentSyncRunsTable runs={recentSyncRuns} />
          </section>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* Tab 6 — Score Methodology                                         */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {activeTab === "score-methodology" && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-slate-400" />
            <h2 className="text-sm font-semibold text-slate-200">Score Methodology</h2>
            <span className="text-xs text-slate-500 ml-1">How Fundamental Score v1 is calculated</span>
          </div>
          <ScoreMethodologyTab />
        </div>
      )}

    </div>
  );
}
