"use client";

import { useState, useTransition, useEffect } from "react";
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
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { RadarConfigSection } from "./RadarConfigSection";
import { RadarScanResultReport } from "./RadarScanResultReport";
import { LatestAiScanSummary } from "./LatestAiScanSummary";
import { EstimatedProgressPanel } from "./EstimatedProgressPanel";
import { getEffectiveRadarConfigAction } from "@/src/actions/radar-config-actions";
import type { EffectiveRadarConfig } from "@/src/lib/opportunity-radar/radar-ai-config";

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

export default function AiScanTab({ anyChunkedRunning }: AiScanTabProps) {
  const [radarResult, setRadarResult] = useState<RadarFixtureScanResult | null>(null);
  const [radarLoading, setRadarLoading] = useState(false);
  const [radarClaudeResult, setRadarClaudeResult] = useState<RadarClaudeScanResult | null>(null);
  const [radarClaudeLoading, setRadarClaudeLoading] = useState(false);
  const [isQaTestExpanded, setIsQaTestExpanded] = useState(false);
  const [currentConfig, setCurrentConfig] = useState<EffectiveRadarConfig | null>(null);
  const [configLoading, setConfigLoading] = useState(true);
  const [isLoading] = useTransition();

  // Load current config on mount
  useEffect(() => {
    const loadConfig = async () => {
      setConfigLoading(true);
      try {
        const result = await getEffectiveRadarConfigAction();
        if (result.success && result.config) {
          setCurrentConfig(result.config);
        }
      } catch (error) {
        console.error("Failed to load config:", error);
      } finally {
        setConfigLoading(false);
      }
    };

    loadConfig();
  }, []);

  const handleConfigUpdate = async () => {
    // Reload config after update
    const result = await getEffectiveRadarConfigAction();
    if (result.success && result.config) {
      setCurrentConfig(result.config);
    }
  };

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

  if (configLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* AI Scan Config Section */}
      {currentConfig && (
        <RadarConfigSection currentConfig={currentConfig} onConfigUpdate={handleConfigUpdate} />
      )}

      {/* Claude Scan — Primary Action */}
      <section className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 space-y-3">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <Radar className="w-4 h-4 text-slate-400" />
            <h2 className="text-sm font-semibold text-slate-200">Claude Scan</h2>
            <span className="text-xs font-medium text-emerald-700 bg-emerald-900/40 border border-emerald-800/50 px-2 py-0.5 rounded ml-1">
              Primary Action
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Run a real Claude scan using the active AI Scan Config. Claude analyzes database context and identifies research candidates.
            Server-side execution only — requires <span className="font-mono text-slate-400">ANTHROPIC_API_KEY</span> environment variable.
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

        <EstimatedProgressPanel isRunning={radarClaudeLoading} />
        {radarClaudeResult && <RadarScanResultReport result={radarClaudeResult} />}

        <div className="rounded bg-slate-900/60 border border-slate-700/60 px-3 py-2.5 space-y-2">
          <div className="flex items-start gap-2">
            <Info className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
            <div className="text-xs space-y-0.5 text-slate-500">
              <p className="text-slate-400 font-medium">Real Claude integration — server-side only</p>
              <p>
                This action calls Claude Sonnet 4.6 server-side using database-backed context (controlled source pack mode).
                Configuration is loaded from the AI Scan Config section above.
              </p>
              <p className="mt-1">
                <strong>Important:</strong> Normal UI render paths do not call this AI scan. The /opportunity-radar page reads persisted DB results only.
              </p>
              <p className="mt-1">
                <strong>Progress Display:</strong> The progress steps shown are <em>estimated</em> stages and do not represent live real-time progress updates.
                Exact live stage tracking requires future database job progress tracking.
              </p>
              <p className="mt-1">
                <strong>On success:</strong> Creates 1 RadarScan record (linked to your config), multiple RadarCandidate records, and RadarEvidence.
              </p>
              <p className="mt-1">
                <strong>On failure:</strong> Shows clear error messages without persisting invalid data.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Latest AI Scan Summary */}
      <LatestAiScanSummary refreshTrigger={radarClaudeResult?.scanId || radarResult?.scanId || Date.now()} />

      {/* QA / Test Scan — Collapsed Section */}
      <section className="bg-slate-800/50 border border-slate-700 rounded-lg space-y-0">
        <button
          onClick={() => setIsQaTestExpanded(!isQaTestExpanded)}
          className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-700/30 transition-colors"
        >
          <div className="flex items-center gap-3">
            {isQaTestExpanded ? (
              <ChevronUp className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            )}
            <div className="text-left">
              <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                QA / Test Scan
                <span className="text-xs font-medium text-blue-700 bg-blue-900/40 border border-blue-800/50 px-2 py-0.5 rounded">
                  Test Data Only
                </span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Fixture scan for validation and testing — uses local sample data only
              </p>
            </div>
          </div>
        </button>

        {isQaTestExpanded && (
          <div className="border-t border-slate-700 px-4 py-4 space-y-3">
            <p className="text-xs text-slate-500 leading-relaxed">
              Run fixture-based Radar validation and persistence. No AI provider or external search is called.
              Uses local sample data to test the validation and persistence pipeline.
            </p>

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

            <div className="rounded bg-slate-900/60 border border-slate-700/60 px-3 py-2.5">
              <div className="flex items-start gap-2">
                <Info className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                <div className="text-xs space-y-0.5 text-slate-500">
                  <p className="text-slate-400 font-medium">Local test data — no external APIs</p>
                  <p>Runs a local sample fixture through the validation and persistence pipeline. Creates 1 RadarScan, 3 RadarCandidate, and 7 RadarEvidence records for testing purposes.</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
