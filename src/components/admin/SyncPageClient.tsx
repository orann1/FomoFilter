"use client";

import { useState, useTransition } from "react";
import {
  testFmpProfileAction,
  testTwelveQuoteAction,
  testFinnhubNewsAction,
  syncQuotesSampleAction,
  syncProfilesSampleAction,
} from "@/src/actions/market-data-actions";
import type {
  ProviderTestResult,
  SyncActionResult,
  SyncRunStatus,
} from "@/src/lib/market-data/types";
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
  ArrowRight,
} from "lucide-react";

interface ProviderStatus {
  fmp: boolean;
  twelveData: boolean;
  finnhub: boolean;
}

interface SyncPageClientProps {
  providerStatus: ProviderStatus;
}

type LastResult =
  | { kind: "test"; result: ProviderTestResult }
  | { kind: "sync"; result: SyncActionResult }
  | null;

// ── Shared primitives ────────────────────────────────────────────────────────

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

function SyncStatusBadge({ status }: { status: SyncRunStatus }) {
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

// ── Action buttons ────────────────────────────────────────────────────────────

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

// ── Result viewers ────────────────────────────────────────────────────────────

function SyncResultViewer({ result }: { result: SyncActionResult }) {
  const startedDate = new Date(result.startedAt);
  const finishedDate = new Date(result.finishedAt);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4">
        <SyncStatusBadge status={result.status} />
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
            {result.skippedSymbols.map((s) => (
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
            {result.failedSymbols.map((s) => (
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

// ── Main component ────────────────────────────────────────────────────────────

export default function SyncPageClient({ providerStatus }: SyncPageClientProps) {
  const [lastResult, setLastResult] = useState<LastResult>(null);
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

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
    startTransition(async () => {
      const result = await fn();
      setLastResult({ kind: "sync", result });
      setActiveAction(null);
    });
  }

  const isLoading = isPending;
  const allConfigured = providerStatus.fmp && providerStatus.twelveData && providerStatus.finnhub;

  return (
    <div className="max-w-3xl mx-auto space-y-5">

      {/* ── Page header ───────────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <ShieldAlert className="w-4 h-4 text-amber-500" />
          <span className="text-xs font-semibold uppercase tracking-widest text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded">
            Admin / Developer
          </span>
        </div>
        <h1 className="text-xl font-bold text-white">Market Data Sync</h1>
        <p className="text-sm text-slate-400 mt-1">
          Internal tool for testing data providers and manually syncing a small sample of stock data.
          Not for regular use.
        </p>
      </div>

      {/* ── Workflow guide ────────────────────────────────────────────────── */}
      <section className="bg-slate-900/60 border border-slate-700/60 rounded-lg px-4 py-3">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5">
          Recommended Workflow
        </p>
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          {[
            "1 — Check API Keys",
            "2 — Test Providers",
            "3 — Run Sample Sync",
            "4 — Review Results",
          ].map((step, i, arr) => (
            <span key={step} className="flex items-center gap-1.5">
              <span className="text-slate-200 font-medium">{step}</span>
              {i < arr.length - 1 && <ArrowRight className="w-3 h-3 text-slate-600 shrink-0" />}
            </span>
          ))}
        </div>
        <p className="text-xs text-slate-500 mt-2">
          Always run provider tests first. Sample sync writes to the DB — test buttons do not.
        </p>
      </section>

      {/* ── Step 1: Provider Configuration ───────────────────────────────── */}
      <section className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-slate-400" />
          <h2 className="text-sm font-semibold text-slate-200">
            Step 1 — API Key Configuration
          </h2>
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
              Add the following to <span className="font-mono">.env.local</span> and restart the dev server:
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

      {/* ── Step 2: Provider Tests ────────────────────────────────────────── */}
      <section className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 space-y-3">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <FlaskConical className="w-4 h-4 text-slate-400" />
            <h2 className="text-sm font-semibold text-slate-200">
              Step 2 — Provider Tests
            </h2>
            <span className="text-xs font-medium text-slate-500 bg-slate-700/60 px-2 py-0.5 rounded ml-1">
              No DB write
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Use these buttons first to verify that each API provider responds correctly.
            These actions fetch a single NVDA result and display the normalized output.
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

      {/* ── Step 3: Sample Sync ───────────────────────────────────────────── */}
      <section className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 space-y-3">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <RefreshCw className="w-4 h-4 text-slate-400" />
            <h2 className="text-sm font-semibold text-slate-200">
              Step 3 — Sample Sync
            </h2>
            <span className="text-xs font-medium text-emerald-700 bg-emerald-900/40 border border-emerald-800/50 px-2 py-0.5 rounded ml-1">
              Writes to DB
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Use these only after provider tests pass. Each action fetches data for up to 5 existing
            DB symbols and updates only valid fields. Symbols not in the database are skipped.
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
            kept unchanged and the symbol is reported as skipped or failed. No data holes are created.
          </p>
        </div>
      </section>

      {/* ── Step 4: Results ───────────────────────────────────────────────── */}
      <section className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
        <h2 className="text-sm font-semibold text-slate-200 mb-3">
          Step 4 — Last Result
        </h2>
        {lastResult === null ? (
          <div className="flex items-start gap-2.5 text-slate-500">
            <Info className="w-4 h-4 shrink-0 mt-0.5" />
            <p className="text-sm leading-relaxed">
              No sync action has run yet. Run a provider test or sample sync above to see results here.
            </p>
          </div>
        ) : lastResult.kind === "sync" ? (
          <SyncResultViewer result={lastResult.result} />
        ) : (
          <TestResultViewer result={lastResult.result} />
        )}
      </section>
    </div>
  );
}
