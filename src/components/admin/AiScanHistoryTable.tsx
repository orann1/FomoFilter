"use client";

import { useEffect, useState } from "react";
import { getRadarScanHistoryAction } from "@/src/actions/radar-history-actions";
import type { RadarScanHistoryItem } from "@/src/actions/radar-history-actions";
import { ExternalLink, Loader2 } from "lucide-react";

export function AiScanHistoryTable() {
  const [history, setHistory] = useState<RadarScanHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const scans = await getRadarScanHistoryAction(10);
        setHistory(scans);
      } catch (error) {
        console.error("Failed to load scan history:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadHistory();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="text-center py-6 text-xs text-slate-500">
        No AI scans yet. Run Claude Scan from the AI Scan tab to populate history.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-slate-700 text-slate-400">
            <th className="text-left py-2 px-3 font-semibold">Date/Time</th>
            <th className="text-left py-2 px-3 font-semibold">Status</th>
            <th className="text-left py-2 px-3 font-semibold">Provider</th>
            <th className="text-left py-2 px-3 font-semibold">Source</th>
            <th className="text-right py-2 px-3 font-semibold">Candidates</th>
            <th className="text-right py-2 px-3 font-semibold">Duration</th>
            <th className="text-left py-2 px-3 font-semibold">Config</th>
            <th className="text-center py-2 px-3 font-semibold">Action</th>
          </tr>
        </thead>
        <tbody>
          {history.map((scan) => {
            const scanDate = new Date(scan.scanDate);
            const formattedDate = scanDate.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            });

            const statusColor =
              scan.status === "success"
                ? "text-emerald-400"
                : scan.status === "failed"
                  ? "text-red-400"
                  : "text-yellow-400";

            return (
              <tr key={scan.scanId} className="border-b border-slate-700/50 hover:bg-slate-700/20">
                <td className="py-2 px-3 font-mono text-slate-300">{formattedDate}</td>
                <td className={`py-2 px-3 font-semibold ${statusColor}`}>{scan.status}</td>
                <td className="py-2 px-3 text-slate-400">{scan.provider}</td>
                <td className="py-2 px-3 text-slate-400">{scan.sourceMode}</td>
                <td className="py-2 px-3 text-right font-mono text-emerald-400">
                  {scan.totalProcessed}/{scan.totalCandidatesReturned}
                </td>
                <td className="py-2 px-3 text-right font-mono text-slate-400">
                  {scan.executionTimeMs ? `${scan.executionTimeMs}ms` : "—"}
                </td>
                <td className="py-2 px-3 text-slate-400 text-xs">
                  {scan.configId ? `DB: ${scan.configId.slice(0, 6)}...` : "Env/Def"}
                </td>
                <td className="py-2 px-3 text-center">
                  <a
                    href={`/opportunity-radar?scan=${scan.scanId}`}
                    className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 transition-colors"
                    title="View in Opportunity Radar"
                  >
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
