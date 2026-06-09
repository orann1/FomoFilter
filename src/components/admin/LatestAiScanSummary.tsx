"use client";

import { useEffect, useState } from "react";
import { getLatestRadarScanAction } from "@/src/actions/radar-history-actions";
import type { LatestRadarScanSummary } from "@/src/actions/radar-history-actions";
import { Radar, ExternalLink, Loader2 } from "lucide-react";

export function LatestAiScanSummary() {
  const [latestScan, setLatestScan] = useState<LatestRadarScanSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadLatestScan = async () => {
      try {
        const scan = await getLatestRadarScanAction();
        setLatestScan(scan);
      } catch (error) {
        console.error("Failed to load latest scan:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadLatestScan();
  }, []);

  if (isLoading) {
    return (
      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 flex items-center justify-center">
        <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!latestScan) {
    return (
      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <Radar className="w-4 h-4 text-slate-400" />
          <h3 className="text-sm font-semibold text-slate-200">Latest AI Scan</h3>
        </div>
        <p className="text-xs text-slate-500">No AI scans yet. Run Claude Scan to get started.</p>
      </div>
    );
  }

  const scanDate = new Date(latestScan.scanDate);
  const formattedDate = scanDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const statusColor =
    latestScan.status === "success"
      ? "text-emerald-400 bg-emerald-900/20 border-emerald-800/50"
      : "text-red-400 bg-red-900/20 border-red-800/50";

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Radar className="w-4 h-4 text-slate-400" />
          <h3 className="text-sm font-semibold text-slate-200">Latest AI Scan</h3>
        </div>
        <a
          href="/opportunity-radar"
          className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium text-blue-300 hover:bg-blue-900/30 border border-blue-800/50 transition-colors"
        >
          View Radar <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs border-b border-slate-700/50 pb-3">
        <div>
          <p className="text-slate-500 mb-0.5">Date/Time</p>
          <p className="font-mono text-slate-300">{formattedDate}</p>
        </div>
        <div>
          <p className="text-slate-500 mb-0.5">Status</p>
          <p className={`font-mono font-semibold px-2 py-1 rounded border ${statusColor} inline-block`}>
            {latestScan.status}
          </p>
        </div>
        <div>
          <p className="text-slate-500 mb-0.5">Provider/Model</p>
          <p className="font-mono text-slate-300">
            {latestScan.provider} / {latestScan.model}
          </p>
        </div>
        <div>
          <p className="text-slate-500 mb-0.5">Candidates</p>
          <p className="font-mono text-emerald-400">
            {latestScan.totalProcessed}/{latestScan.totalCandidatesReturned}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div>
          <p className="text-slate-500 mb-0.5">Duration</p>
          <p className="font-mono text-slate-300">
            {latestScan.executionTimeMs ? `${latestScan.executionTimeMs}ms` : "N/A"}
          </p>
        </div>
        <div>
          <p className="text-slate-500 mb-0.5">Prompt Version</p>
          <p className="font-mono text-slate-300 text-xs">{latestScan.promptVersion}</p>
        </div>
        <div>
          <p className="text-slate-500 mb-0.5">Config</p>
          <p className="font-mono text-slate-300 text-xs">
            {latestScan.configId ? `DB: ${latestScan.configId.slice(0, 8)}...` : "Env/Default"}
          </p>
        </div>
        <div>
          <p className="text-slate-500 mb-0.5">Evidence</p>
          <p className="font-mono text-slate-300">
            {latestScan.totalProcessed > 0 ? "✓" : "—"}
          </p>
        </div>
      </div>
    </div>
  );
}
