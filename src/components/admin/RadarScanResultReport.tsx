import type { RadarClaudeScanResult } from "@/src/actions/opportunity-radar-actions";
import { CheckCircle, Info } from "lucide-react";

interface RadarScanResultReportProps {
  result: RadarClaudeScanResult;
}

export function RadarScanResultReport({ result }: RadarScanResultReportProps) {
  if (!result.success || !result.scanId) return null;

  return (
    <div className="space-y-4">
      {/* Success Summary */}
      <div className="rounded-lg bg-slate-900/80 border border-emerald-800/60 p-4 space-y-3">
        <div className="flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="text-sm font-semibold text-emerald-300">
            Claude Scan Completed Successfully
          </span>
        </div>

        {/* Scan Metadata */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs border-b border-slate-700/50 pb-3">
          <div>
            <p className="text-slate-500 mb-0.5">Scan ID</p>
            <p className="font-mono font-semibold text-slate-200 break-all text-xs">
              {result.scanId}
            </p>
          </div>
          <div>
            <p className="text-slate-500 mb-0.5">Candidates</p>
            <p className="font-mono font-semibold text-emerald-400">
              {result.candidateCount || 0}
            </p>
          </div>
          <div>
            <p className="text-slate-500 mb-0.5">Evidence</p>
            <p className="font-mono font-semibold text-emerald-400">
              {result.evidenceCount || 0}
            </p>
          </div>
          <div>
            <p className="text-slate-500 mb-0.5">Duration</p>
            <p className="font-mono font-semibold text-slate-300">
              {result.executionTimeMs ? `${result.executionTimeMs}ms` : "N/A"}
            </p>
          </div>
        </div>

        {/* Provider & Model */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs border-b border-slate-700/50 pb-3">
          <div>
            <p className="text-slate-500 mb-0.5">Provider</p>
            <p className="font-mono text-slate-300">{result.provider || "N/A"}</p>
          </div>
          <div>
            <p className="text-slate-500 mb-0.5">Model</p>
            <p className="font-mono text-slate-300">{result.model || "N/A"}</p>
          </div>
          <div>
            <p className="text-slate-500 mb-0.5">Source Mode</p>
            <p className="font-mono text-slate-300">{result.sourceMode || "N/A"}</p>
          </div>
        </div>

        {/* Debug Trace Link */}
        {result.debugTracePath && (
          <div className="text-xs pt-2">
            <p className="text-slate-400 mb-1">Debug trace:</p>
            <p className="font-mono text-slate-400 break-all">{result.debugTracePath}</p>
          </div>
        )}
      </div>

      {/* Disclaimer */}
      <div className="rounded bg-slate-900/60 border border-slate-700/60 px-3 py-2.5">
        <div className="flex items-start gap-2">
          <Info className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
          <div className="text-xs space-y-0.5 text-slate-500">
            <p className="text-slate-400 font-medium">Research candidates only — not financial advice</p>
            <p>
              The candidates returned by Claude Radar are AI-identified research opportunities based on database context.
              They are not endorsements or investment recommendations. All candidates require manual review and validation
              against your own research and risk criteria before any action.
            </p>
            <p className="mt-1">
              View persisted candidates and explore them further on the{" "}
              <span className="text-blue-300">/opportunity-radar</span> page.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
