"use client";

import { useState, useTransition } from "react";
import {
  runOpportunityRadarFixtureScanAction,
  runOpportunityRadarClaudeScanAction,
} from "@/src/actions/opportunity-radar-actions";
import type {
  RadarFixtureScanResult,
  RadarClaudeScanResult,
} from "@/src/actions/opportunity-radar-actions";
import {
  CheckCircle,
  XCircle,
  Loader2,
  Info,
  Play,
  Radar,
} from "lucide-react";

interface AiScanTabProps {
  anyChunkedRunning?: boolean;
}

function RadarFixtureScanResultViewer({ result }: { result: RadarFixtureScanResult }) {
  if (result.success) {
    return (
      <div className="rounded-lg bg-slate-900/80 border border-emerald-800/60 p-4 space-y-3">
        <div className="flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="text-sm font-semibold text-emerald-300">Success — fixture validated and persisted</span>
        </div>
        <div className="grid grid-cols-3 gap-3 text-xs">
          <div>
            <p className="text-slate-500 mb-0.5">Scan ID</p>
            <p className="font-mono font-semibold text-slate-200 break-all">{result.scanId}</p>
          </div>
          <div>
            <p className="text-slate-500 mb-0.5">Candidates</p>
            <p className="font-mono font-semibold text-emerald-400">{result.candidateCount}</p>
          </div>
          <div>
            <p className="text-slate-500 mb-0.5">Evidence</p>
            <p className="font-mono font-semibold text-emerald-400">{result.evidenceCount}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-slate-900/80 border border-red-800/60 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <XCircle className="w-4 h-4 text-red-400 shrink-0" />
        <span className="text-sm font-semibold text-red-300">Failed</span>
      </div>
      <p className="text-xs text-red-400">{result.error || "Unknown error"}</p>
      {result.validationErrors && result.validationErrors.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs font-semibold text-slate-400">Validation errors:</p>
          <ul className="list-disc list-inside space-y-0.5">
            {result.validationErrors.map((err, i) => (
              <li key={i} className="text-xs text-red-400">{err}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function RadarClaudeScanResultViewer({ result }: { result: RadarClaudeScanResult }) {
  if (result.success) {
    return (
      <div className="rounded-lg bg-slate-900/80 border border-emerald-800/60 p-4 space-y-3">
        <div className="flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="text-sm font-semibold text-emerald-300">Success — Claude scan executed and persisted</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <p className="text-slate-500 mb-0.5">Scan ID</p>
            <p className="font-mono font-semibold text-slate-200 break-all text-xs">{result.scanId}</p>
          </div>
          <div>
            <p className="text-slate-500 mb-0.5">Candidates</p>
            <p className="font-mono font-semibold text-emerald-400">{result.candidateCount}</p>
          </div>
          <div>
            <p className="text-slate-500 mb-0.5">Evidence</p>
            <p className="font-mono font-semibold text-emerald-400">{result.evidenceCount}</p>
          </div>
          <div>
            <p className="text-slate-500 mb-0.5">Duration</p>
            <p className="font-mono font-semibold text-slate-300">
              {result.executionTimeMs ? `${result.executionTimeMs}ms` : "N/A"}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs border-t border-slate-700/50 pt-3">
          <div>
            <p className="text-slate-500 mb-0.5">Provider</p>
            <p className="font-mono text-slate-300">{result.provider}</p>
          </div>
          <div>
            <p className="text-slate-500 mb-0.5">Model</p>
            <p className="font-mono text-slate-300">{result.model}</p>
          </div>
          <div>
            <p className="text-slate-500 mb-0.5">Source Mode</p>
            <p className="font-mono text-slate-300">{result.sourceMode}</p>
          </div>
        </div>
        {result.debugTracePath && (
          <div className="border-t border-slate-700/50 pt-3">
            <p className="text-xs text-slate-400 mb-1">Debug trace:</p>
            <p className="font-mono text-xs text-slate-300">{result.debugTracePath}</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-slate-900/80 border border-red-800/60 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <XCircle className="w-4 h-4 text-red-400 shrink-0" />
        <span className="text-sm font-semibold text-red-300">Failed</span>
      </div>
      <p className="text-xs text-red-400">{result.error || "Unknown error"}</p>
      {result.validationErrors && result.validationErrors.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs font-semibold text-slate-400">Validation errors:</p>
          <ul className="list-disc list-inside space-y-0.5">
            {result.validationErrors.map((err, i) => (
              <li key={i} className="text-xs text-red-400">{err}</li>
            ))}
          </ul>
        </div>
      )}
      {result.rawOutputPreview && (
        <div className="space-y-1">
          <p className="text-xs font-semibold text-slate-400">Claude output (first 500 chars):</p>
          <pre className="text-xs bg-slate-950 border border-slate-700/50 rounded p-2 overflow-x-auto text-slate-400 whitespace-pre-wrap break-words">
            {result.rawOutputPreview}
          </pre>
        </div>
      )}
      {result.debugTracePath && (
        <div className="border-t border-slate-700/50 pt-3">
          <p className="text-xs text-slate-400 mb-1">Debug trace:</p>
          <p className="font-mono text-xs text-slate-300">{result.debugTracePath}</p>
        </div>
      )}
    </div>
  );
}

function RadarClaudeScanProgressViewer() {
  const steps = [
    "Preparing Claude scan",
    "Loading database context",
    "Sending request to Claude",
    "Waiting for structured tool output",
    "Validating tool output",
    "Persisting scan results",
    "Finalizing result",
  ];

  return (
    <div className="rounded-lg bg-slate-900/80 border border-blue-800/60 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Loader2 className="w-4 h-4 text-blue-400 shrink-0 animate-spin" />
        <span className="text-sm font-semibold text-blue-300">Claude scan in progress</span>
      </div>

      <div className="space-y-2">
        {steps.map((step, idx) => {
          return (
            <div key={idx} className="flex items-center gap-2 text-xs">
              <div className="w-3.5 h-3.5 rounded-full border border-slate-600 bg-slate-700 shrink-0 flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-slate-600" />
              </div>
              <span className="text-slate-500">{step}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function AiScanTab({ anyChunkedRunning }: AiScanTabProps) {
  const [radarResult, setRadarResult] = useState<RadarFixtureScanResult | null>(null);
  const [radarLoading, setRadarLoading] = useState(false);
  const [radarClaudeResult, setRadarClaudeResult] = useState<RadarClaudeScanResult | null>(null);
  const [radarClaudeLoading, setRadarClaudeLoading] = useState(false);
  const [isLoading] = useTransition();

  function handleRunRadarFixtureScan() {
    setRadarLoading(true);
    setRadarResult(null);
    runOpportunityRadarFixtureScanAction().then((result) => {
      setRadarResult(result);
      setRadarLoading(false);
    });
  }

  function handleRunRadarClaudeScan() {
    setRadarClaudeLoading(true);
    setRadarClaudeResult(null);
    runOpportunityRadarClaudeScanAction().then((result) => {
      setRadarClaudeResult(result);
      setRadarClaudeLoading(false);
    });
  }

  return (
    <div className="space-y-5">
      {/* Opportunity Radar Fixture Scan */}
      <section className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 space-y-3">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <Radar className="w-4 h-4 text-slate-400" />
            <h2 className="text-sm font-semibold text-slate-200">Fixture Scan</h2>
            <span className="text-xs font-medium text-blue-700 bg-blue-900/40 border border-blue-800/50 px-2 py-0.5 rounded ml-1">
              Test Data
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Run fixture-based Radar validation and persistence. No AI provider or external search is called.
            Validates sample fixture data against strict rules and persists to RadarScan, RadarCandidate, and RadarEvidence tables.
          </p>
        </div>

        <button
          onClick={handleRunRadarFixtureScan}
          disabled={radarLoading || isLoading || anyChunkedRunning}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium bg-blue-700 hover:bg-blue-600 text-white border border-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {radarLoading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Play className="w-3.5 h-3.5" />
          )}
          Run Fixture Scan
        </button>

        {radarResult && <RadarFixtureScanResultViewer result={radarResult} />}

        <div className="rounded bg-slate-900/60 border border-slate-700/60 px-3 py-2.5 space-y-2">
          <div className="flex items-start gap-2">
            <Info className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
            <div className="text-xs space-y-0.5 text-slate-500">
              <p className="text-slate-400 font-medium">Local test data — no external APIs</p>
              <p>This action runs a local sample fixture through the validation and persistence pipeline. It does not call Claude, OpenAI, or any external APIs. Real AI integration is available in the Claude Scan section below.</p>
              <p className="mt-1">On success, creates 1 RadarScan record, 3 RadarCandidate records (NVDA, SMCI, META), and 7 RadarEvidence records with full validation of scores, enums, evidence, and prohibited language.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Opportunity Radar Claude Scan */}
      <section className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 space-y-3">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <Radar className="w-4 h-4 text-slate-400" />
            <h2 className="text-sm font-semibold text-slate-200">Claude Scan</h2>
            <span className="text-xs font-medium text-emerald-700 bg-emerald-900/40 border border-emerald-800/50 px-2 py-0.5 rounded ml-1">
              Server-Side AI
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Run a real Claude Sonnet 4.6 scan using database-backed context (controlled source pack mode).
            Claude analyzes active stocks from the database and identifies research candidates.
            Uses server-side execution only — requires <span className="font-mono text-slate-400">ANTHROPIC_API_KEY</span> environment variable.
          </p>
        </div>

        <button
          onClick={handleRunRadarClaudeScan}
          disabled={radarClaudeLoading || isLoading || anyChunkedRunning}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium bg-emerald-700 hover:bg-emerald-600 text-white border border-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {radarClaudeLoading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Play className="w-3.5 h-3.5" />
          )}
          Run Claude Scan
        </button>

        {radarClaudeLoading && <RadarClaudeScanProgressViewer />}
        {radarClaudeResult && <RadarClaudeScanResultViewer result={radarClaudeResult} />}

        <div className="rounded bg-slate-900/60 border border-slate-700/60 px-3 py-2.5 space-y-2">
          <div className="flex items-start gap-2">
            <Info className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
            <div className="text-xs space-y-0.5 text-slate-500">
              <p className="text-slate-400 font-medium">Real Claude integration — server-side only</p>
              <p>
                This action calls Claude Sonnet 4.6 server-side using a database-backed context (controlled source pack mode).
                Claude receives a list of top active stocks from the database and generates research candidates without claiming public web discovery.
              </p>
              <p className="mt-1">
                <strong>Important:</strong> Normal UI render paths do not call this AI scan. The /opportunity-radar page reads persisted DB results only — it never calls Claude or any external API directly.
              </p>
              <p className="mt-1">
                <strong>Requirements:</strong> Set <span className="font-mono text-slate-300">ANTHROPIC_API_KEY</span> in your environment.
                This action does not claim real web search — it uses only database context for candidate analysis.
              </p>
              <p className="mt-1">
                <strong>On success:</strong> Creates 1 RadarScan record, multiple RadarCandidate records, and RadarEvidence with full validation.
                All validation rules apply (prohibited language, score ranges, enum values, evidence quality).
              </p>
              <p className="mt-1">
                <strong>On failure:</strong> Shows clear error messages (missing API key, provider errors, validation failures) without persisting invalid data.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
