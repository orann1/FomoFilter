import { AlertTriangle, ExternalLink } from "lucide-react";
import Link from "next/link";
import type { DashboardWarning } from "@/src/lib/data/dashboard";

interface DataWarningsSectionProps {
  warnings: DashboardWarning[];
}

export default function DataWarningsSection({ warnings }: DataWarningsSectionProps) {
  if (warnings.length === 0) return null;

  return (
    <div className="mb-5 flex flex-col gap-2">
      {warnings.map((w) => (
        <div
          key={w.key}
          className="flex items-start gap-3 bg-amber-500/5 border border-amber-800/40 rounded-xl px-4 py-3"
        >
          <AlertTriangle size={14} className="text-amber-400 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-amber-300 text-xs font-medium">{w.message}</p>
            {w.action && (
              <p className="text-slate-500 text-xs mt-0.5">
                {w.action}{" "}
                <Link
                  href="/admin/sync"
                  className="text-amber-400/70 hover:text-amber-400 inline-flex items-center gap-0.5 transition-colors"
                >
                  Open Admin <ExternalLink size={10} />
                </Link>
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
