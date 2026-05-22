"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  testFmpProfileAction,
  testTwelveQuoteAction,
  testFinnhubNewsAction,
  syncQuotesSampleAction,
  syncProfilesSampleAction,
  syncNasdaq100UniverseAction,
} from "@/src/actions/market-data-actions";
import type {
  ProviderTestResult,
  SyncActionResult,
  SyncRunStatus,
  SyncSymbolResult,
} from "@/src/lib/market-data/types";
import type { UniverseSyncActionResult } from "@/src/actions/market-data-actions";
import type { UniverseOverviewRow, DbStockSummary } from "@/src/lib/data/admin-universes";
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
}

type LastResult =
  | { kind: "test"; result: ProviderTestResult }
  | { kind: "sync"; result: SyncActionResult }
  | { kind: "universe"; result: UniverseSyncActionResult }
  | null;

type TabId = "overview" | "sync-actions" | "provider-tests" | "sync-history";

// ── Sync action metadata (write actions only) ─────────────────────────────────

const SYNC_ACTION_META: Record<string, { label: string; durationNote: string }> = {
  "sync-nasdaq100": {
    label: "Sync Nasdaq 100 Universe",
    durationNote: "Nasdaq 100 universe sync may take around 45–75 seconds.",
  },
  "sync-quotes": {
    label: "Sync Quotes Sample",
    durationNote: "Quote sample sync typically takes 5–15 seconds.",
  },
  "sync-profiles": {
    label: "Sync Profiles Sample",
    durationNote: "Profile sample sync typically takes 10–25 seconds.",
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
}

function ActionButton({ onClick, disabled, loading, label, description, variant }: ActionButtonProps) {
  const btnBase =
    "inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap shrink-0";
  const btnStyle =
    variant === "sync"
      ? "bg-emerald-700 hover:bg-emerald-600 text-white border border-emerald-600"
      : "bg-slate-700 hover:bg-slate-600 text-slate-200 border border-slate-600";

  return (
    <div className="flex items-start gap-3">
      <button className={`${btnBase} ${btnStyle} mt-0.5`} onClick={onClick} disabled={disabled}>
        {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
        {label}
      </button>
      <p className="text-xs text-slate-500 leading-relaxed pt-0.5">{description}</p>
    </div>
  );
}

// ── Sync in progress panel ────────────────────────────────────────────────────

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
        <td className="px-3 py-2.5 text-xs font-mono text-slate-300">{run.type}</td>
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
  { id: "sync-actions", label: "Sync Actions", icon: <RefreshCw className="w-3.5 h-3.5" /> },
  { id: "provider-tests", label: "Provider Tests", icon: <FlaskConical className="w-3.5 h-3.5" /> },
  { id: "sync-history", label: "Sync History", icon: <History className="w-3.5 h-3.5" /> },
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
}: SyncPageClientProps) {
  const router = useRouter();
  const [lastResult, setLastResult] = useState<LastResult>(null);
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  function startTimer() {
    setElapsedSeconds(0);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setElapsedSeconds((s) => s + 1);
    }, 1000);
  }

  function stopTimer() {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }

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

  const isLoading = isPending;
  const allConfigured = providerStatus.fmp && providerStatus.twelveData && providerStatus.finnhub;

  const activeSyncMeta =
    activeAction && activeAction in SYNC_ACTION_META ? SYNC_ACTION_META[activeAction] : null;
  const isSyncRunning = isLoading && activeSyncMeta !== null;

  const lastSyncResult =
    lastResult?.kind === "sync" || lastResult?.kind === "universe" ? lastResult : null;
  const lastTestResult = lastResult?.kind === "test" ? lastResult : null;

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
        <h1 className="text-xl font-bold text-white">Market Data Sync</h1>
        <p className="text-sm text-slate-400 mt-1">
          Internal tool for managing universe membership, testing data providers, and manually
          syncing a small sample of stock data.
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
      {/* Tab 2 — Sync Actions                                              */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {activeTab === "sync-actions" && (
        <div className="space-y-5">

          {/* Sync in progress panel */}
          {isSyncRunning && activeSyncMeta && (
            <SyncInProgressPanel
              actionLabel={activeSyncMeta.label}
              elapsedSeconds={elapsedSeconds}
              durationNote={activeSyncMeta.durationNote}
            />
          )}

          {/* Universe Management */}
          <section className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 space-y-3">
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <Globe className="w-4 h-4 text-slate-400" />
                <h2 className="text-sm font-semibold text-slate-200">Universe Management</h2>
                <span className="text-xs font-medium text-emerald-700 bg-emerald-900/40 border border-emerald-800/50 px-2 py-0.5 rounded ml-1">
                  Writes to DB
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Syncs Nasdaq 100 index membership only. Creates missing stocks, updates memberships,
                deactivates removed symbols. Does not sync quotes. Never deletes stocks, watchlist, or alerts.
              </p>
            </div>
            <ActionButton
              variant="sync"
              onClick={() => runUniverseSync("sync-nasdaq100", syncNasdaq100UniverseAction)}
              disabled={isLoading}
              loading={activeAction === "sync-nasdaq100"}
              label="Sync Nasdaq 100 Universe"
              description="Syncs Nasdaq 100 membership from static fallback list. FMP is used only for profile enrichment. No quote sync."
            />
            <div className="rounded bg-slate-900/60 border border-slate-700/60 px-3 py-2.5 space-y-2">
              <div className="flex items-start gap-2">
                <Info className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                <div className="text-xs space-y-0.5">
                  <p className="text-slate-300 font-medium">
                    Current source: Static fallback list, manually validated
                  </p>
                  <p className="text-slate-500">
                    FMP is used only for profile enrichment (name, sector, marketCap). Live FMP
                    constituents require a paid endpoint.
                  </p>
                  <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1.5 text-slate-500 font-mono">
                    <span>
                      compositionAsOf: <span className="text-slate-400">2026-01-20</span>
                    </span>
                    <span>
                      lastVerifiedAt: <span className="text-slate-400">2026-05-21</span>
                    </span>
                    <span>
                      symbolCount: <span className="text-slate-400">100</span>
                    </span>
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

          {/* Sample Sync */}
          <section className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 space-y-3">
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <RefreshCw className="w-4 h-4 text-slate-400" />
                <h2 className="text-sm font-semibold text-slate-200">Sample Sync</h2>
                <span className="text-xs font-medium text-emerald-700 bg-emerald-900/40 border border-emerald-800/50 px-2 py-0.5 rounded ml-1">
                  Writes to DB
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Each action fetches data for up to 5 existing DB symbols and updates only valid
                fields. Symbols not in the database are skipped.
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
            <div className="flex items-start gap-2 rounded bg-slate-900/60 border border-slate-700/60 px-3 py-2.5 mt-1">
              <Info className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
              <p className="text-xs text-slate-500 leading-relaxed">
                <span className="text-slate-400 font-medium">DB safety: </span>
                If provider data is missing, empty, invalid, or the API fails, existing DB values are
                kept unchanged and the symbol is reported as skipped or failed.
              </p>
            </div>
          </section>

          {/* Review Results */}
          <section className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
            <h2 className="text-sm font-semibold text-slate-200 mb-3">Review Results</h2>
            {lastSyncResult === null ? (
              <div className="flex items-start gap-2.5 text-slate-500">
                <Info className="w-4 h-4 shrink-0 mt-0.5" />
                <p className="text-sm leading-relaxed">
                  No sync action has run yet. Run a universe sync or sample sync above to see results
                  here.
                </p>
              </div>
            ) : lastSyncResult.kind === "sync" ? (
              <SyncResultViewer result={lastSyncResult.result} />
            ) : (
              <UniverseSyncResultViewer result={lastSyncResult.result} />
            )}
          </section>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* Tab 3 — Provider Tests                                            */}
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
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* Tab 4 — Sync History                                              */}
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

    </div>
  );
}
