"use client";

import { useState, useTransition } from "react";
import {
  testFmpProfileAction,
  testTwelveQuoteAction,
  testFinnhubNewsAction,
  syncQuotesSampleAction,
  syncProfilesSampleAction,
} from "@/src/actions/market-data-actions";
import type { ProviderTestResult, SyncSummary } from "@/src/lib/market-data/types";
import { CheckCircle, XCircle, Loader2, Database, FlaskConical, RefreshCw } from "lucide-react";

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
  | { kind: "sync"; result: SyncSummary }
  | null;

function StatusBadge({ configured }: { configured: boolean }) {
  return configured ? (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-400">
      <CheckCircle className="w-3.5 h-3.5" />
      Configured
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-red-400">
      <XCircle className="w-3.5 h-3.5" />
      Missing
    </span>
  );
}

function ActionButton({
  onClick,
  disabled,
  loading,
  children,
  variant = "default",
}: {
  onClick: () => void;
  disabled: boolean;
  loading: boolean;
  children: React.ReactNode;
  variant?: "default" | "sync";
}) {
  const base =
    "inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed";
  const styles =
    variant === "sync"
      ? "bg-emerald-600 hover:bg-emerald-500 text-white"
      : "bg-slate-700 hover:bg-slate-600 text-slate-100";

  return (
    <button className={`${base} ${styles}`} onClick={onClick} disabled={disabled}>
      {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
      {children}
    </button>
  );
}

function ResultViewer({ result }: { result: LastResult }) {
  if (!result) return null;

  if (result.kind === "test") {
    const r = result.result;
    return (
      <div className="mt-1 space-y-2">
        <div className="flex items-center gap-2">
          {r.ok ? (
            <span className="text-xs font-semibold text-emerald-400">OK</span>
          ) : (
            <span className="text-xs font-semibold text-red-400">FAILED</span>
          )}
          <span className="text-xs text-slate-400">
            {r.provider} / {r.action}
          </span>
        </div>
        {!r.ok && r.error && (
          <p className="text-xs text-red-300 bg-red-900/20 rounded px-2 py-1">{r.error}</p>
        )}
        {r.ok && r.data !== undefined && (
          <pre className="text-xs text-slate-300 bg-slate-900 rounded p-3 overflow-auto max-h-72 whitespace-pre-wrap break-all">
            {JSON.stringify(r.data, null, 2)}
          </pre>
        )}
      </div>
    );
  }

  const s = result.result;
  return (
    <div className="mt-1 space-y-2">
      <div className="flex flex-wrap items-center gap-3 text-xs">
        <span className="text-slate-400">
          Provider: <span className="text-slate-200">{s.provider}</span>
        </span>
        <span className="text-slate-400">
          Requested: <span className="text-slate-200">{s.symbolsRequested.join(", ")}</span>
        </span>
        <span className="text-emerald-400 font-medium">{s.successCount} succeeded</span>
        {s.errorCount > 0 && (
          <span className="text-red-400 font-medium">{s.errorCount} failed</span>
        )}
        <span
          className={`font-medium ${s.persisted ? "text-emerald-400" : "text-amber-400"}`}
        >
          {s.persisted ? "Persisted to DB" : "Not persisted"}
        </span>
      </div>
      {s.failedSymbols.length > 0 && (
        <p className="text-xs text-red-300">
          Failed symbols: {s.failedSymbols.join(", ")}
        </p>
      )}
      {s.errors.length > 0 && (
        <div className="bg-red-900/20 rounded p-2 space-y-0.5">
          {s.errors.map((e, i) => (
            <p key={i} className="text-xs text-red-300">
              {e}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

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

  function runSync(label: string, fn: () => Promise<SyncSummary>) {
    setActiveAction(label);
    startTransition(async () => {
      const result = await fn();
      setLastResult({ kind: "sync", result });
      setActiveAction(null);
    });
  }

  const isLoading = isPending;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-semibold uppercase tracking-widest text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded">
            Admin / Developer
          </span>
        </div>
        <h1 className="text-xl font-bold text-white">Market Data Sync</h1>
        <p className="text-sm text-slate-400 mt-1">
          Test providers and run safe manual sync actions before scheduled sync is added.
        </p>
      </div>

      {/* Provider Configuration */}
      <section className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 space-y-3">
        <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
          <Database className="w-4 h-4 text-slate-400" />
          Provider Configuration
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
      </section>

      {/* Provider Tests */}
      <section className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 space-y-3">
        <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
          <FlaskConical className="w-4 h-4 text-slate-400" />
          Provider Tests
          <span className="text-xs text-slate-500 font-normal ml-1">
            (no DB write — displays normalized result for NVDA)
          </span>
        </h2>
        <div className="flex flex-wrap gap-2">
          <ActionButton
            onClick={() => runTest("fmp-profile", testFmpProfileAction)}
            disabled={isLoading}
            loading={activeAction === "fmp-profile"}
          >
            Test FMP Profile
          </ActionButton>
          <ActionButton
            onClick={() => runTest("twelve-quote", testTwelveQuoteAction)}
            disabled={isLoading}
            loading={activeAction === "twelve-quote"}
          >
            Test Twelve Quote
          </ActionButton>
          <ActionButton
            onClick={() => runTest("finnhub-news", testFinnhubNewsAction)}
            disabled={isLoading}
            loading={activeAction === "finnhub-news"}
          >
            Test Finnhub News
          </ActionButton>
        </div>
      </section>

      {/* Sample Sync */}
      <section className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 space-y-3">
        <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
          <RefreshCw className="w-4 h-4 text-slate-400" />
          Sample Sync
          <span className="text-xs text-slate-500 font-normal ml-1">
            (persists to DB for existing symbols only)
          </span>
        </h2>
        <div className="flex flex-wrap gap-2">
          <ActionButton
            variant="sync"
            onClick={() => runSync("sync-quotes", syncQuotesSampleAction)}
            disabled={isLoading}
            loading={activeAction === "sync-quotes"}
          >
            Sync Quotes Sample
          </ActionButton>
          <ActionButton
            variant="sync"
            onClick={() => runSync("sync-profiles", syncProfilesSampleAction)}
            disabled={isLoading}
            loading={activeAction === "sync-profiles"}
          >
            Sync Profiles Sample
          </ActionButton>
        </div>
      </section>

      {/* Result Viewer */}
      {lastResult && (
        <section className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
          <h2 className="text-sm font-semibold text-slate-200 mb-2">Last Result</h2>
          <ResultViewer result={lastResult} />
        </section>
      )}
    </div>
  );
}
