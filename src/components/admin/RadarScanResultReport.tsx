import type { RadarClaudeScanResult } from "@/src/actions/opportunity-radar-actions";
import { CheckCircle, XCircle, AlertCircle, Info } from "lucide-react";

interface RadarScanResultReportProps {
  result: RadarClaudeScanResult;
}

export function RadarScanResultReport({ result }: RadarScanResultReportProps) {
  // Show error report for failed scans
  if (!result.success) {
    const isTruncation = result.error?.includes("max_tokens");
    const isValidationError = result.validationErrors && result.validationErrors.length > 0;

    return (
      <div className="space-y-4">
        <div className="rounded-lg bg-slate-900/80 border border-red-800/60 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <XCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span className="text-sm font-semibold text-red-300">
              {isTruncation ? "Claude Scan Failed — Output Truncated" : "Claude Scan Failed"}
            </span>
          </div>

          {/* Error Message */}
          <div className="border-b border-slate-700/50 pb-3">
            <p className="text-xs text-slate-500 mb-1">Error</p>
            <p className="text-xs text-red-400 leading-relaxed">{result.error}</p>
          </div>

          {/* Execution Metadata */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs border-b border-slate-700/50 pb-3">
            <div>
              <p className="text-slate-500 mb-0.5">Provider</p>
              <p className="font-mono text-slate-300">{result.provider || "Anthropic"}</p>
            </div>
            <div>
              <p className="text-slate-500 mb-0.5">Model</p>
              <p className="font-mono text-slate-300">{result.model || "claude-sonnet-4.6"}</p>
            </div>
            <div>
              <p className="text-slate-500 mb-0.5">Duration</p>
              <p className="font-mono text-slate-300">
                {result.executionTimeMs ? `${result.executionTimeMs}ms` : "N/A"}
              </p>
            </div>
          </div>

          {/* Validation Errors */}
          {isValidationError && (
            <div className="border-b border-slate-700/50 pb-3">
              <p className="text-xs font-semibold text-slate-400 mb-2">Validation Errors:</p>
              <ul className="list-disc list-inside space-y-1">
                {result.validationErrors?.map((err, i) => (
                  <li key={i} className="text-xs text-red-400">{err}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Raw Output Preview */}
          {result.rawOutputPreview && (
            <div className="border-b border-slate-700/50 pb-3">
              <p className="text-xs font-semibold text-slate-400 mb-2">Claude Output (first 500 chars):</p>
              <pre className="text-xs bg-slate-950 border border-slate-700/50 rounded p-2 overflow-x-auto text-slate-400 whitespace-pre-wrap break-words max-h-32">
                {result.rawOutputPreview}
              </pre>
            </div>
          )}

          {/* Debug Trace */}
          {result.debugTracePath && (
            <div className="text-xs pt-2">
              <p className="text-slate-400 mb-1">Debug trace:</p>
              <p className="font-mono text-slate-400 break-all text-xs">{result.debugTracePath}</p>
            </div>
          )}
        </div>

        {/* Truncation-Specific Guidance */}
        {isTruncation && (
          <div className="rounded-lg bg-amber-900/30 border border-amber-800/60 px-4 py-3 space-y-3">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="text-xs space-y-2">
                <p className="font-semibold text-amber-300">Output Truncation — Claude reached max_tokens limit</p>
                <p className="text-amber-200 leading-relaxed">
                  The Claude response was incomplete because it hit the maximum output token limit. The failed scan attempt was saved for audit, but no RadarCandidate or RadarEvidence records were created.
                </p>
                <div className="space-y-1.5 mt-3">
                  <p className="font-semibold text-amber-300">To resolve, try one or more of:</p>
                  <ul className="list-disc list-inside space-y-1 text-amber-200">
                    <li><strong>Increase Max Tokens</strong> in the AI Scan Config above</li>
                    <li><strong>Reduce Max Candidates to Return</strong> to lower output complexity</li>
                    <li><strong>Reduce DB Stocks Sent to Claude</strong> to simplify context processing</li>
                    <li><strong>Simplify the prompt</strong> in the AI Scan Config to be more concise</li>
                  </ul>
                </div>
                <p className="text-amber-100/70 text-xs mt-2 italic">
                  Note: ANTHROPIC_RADAR_MAX_TOKENS environment variable is only an env fallback when no DB config is active.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* General Error Info */}
        {!result.success && (
          <div className="rounded bg-slate-900/60 border border-slate-700/60 px-3 py-2.5">
            <div className="flex items-start gap-2">
              <Info className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
              <div className="text-xs space-y-0.5 text-slate-500">
                <p className="text-slate-400 font-medium">No candidates or evidence were persisted</p>
                <p>
                  A failed RadarScan attempt was saved for audit and history. Because validation failed,
                  no RadarCandidate or RadarEvidence records were created. Check the latest successful scan on the{" "}
                  <span className="text-blue-300">/opportunity-radar</span> page.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Success report (existing code)
  if (!result.scanId) return null;

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
