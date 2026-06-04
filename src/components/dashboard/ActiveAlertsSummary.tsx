import { Bell } from "lucide-react";
import type { ActiveAlertsSummary } from "@/src/lib/data/dashboard";

function formatAlertType(type: string): string {
  switch (type) {
    case "PRICE_ABOVE": return "Price Above";
    case "PRICE_BELOW": return "Price Below";
    case "OPPORTUNITY_SCORE_ABOVE": return "Opportunity Score Above";
    case "FUNDAMENTAL_SCORE_ABOVE": return "Fundamental Score Above";
    case "HOT_SCORE_ABOVE": return "Hot Score Above (legacy)";
    case "PERCENT_CHANGE_ABOVE": return "Day % Above";
    case "PERCENT_CHANGE_BELOW": return "Day % Below";
    default: return type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  }
}

interface ActiveAlertsSummaryProps {
  summary: ActiveAlertsSummary;
}

export default function ActiveAlertsSummaryWidget({ summary }: ActiveAlertsSummaryProps) {
  return (
    <div className="bg-[#111318] border border-slate-800 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-4 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Bell size={14} className="text-blue-400" />
          <h2 className="text-white font-semibold text-sm">Active Alerts</h2>
        </div>
        <span className="text-xs text-slate-500">
          {summary.totalRules} rule{summary.totalRules !== 1 ? "s" : ""}
        </span>
      </div>

      {summary.totalRules === 0 ? (
        <div className="px-4 py-6 text-center">
          <p className="text-slate-500 text-xs">No active alert rules.</p>
          <p className="text-slate-600 text-xs mt-1">
            Add alerts from the Scanner drawer.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-slate-800/60">
          {summary.bySymbol.map(({ symbol, rules }) => (
            <div key={symbol} className="px-4 py-3">
              <p className="text-white font-semibold text-sm mb-1">{symbol}</p>
              <div className="flex flex-col gap-1">
                {rules.map((rule, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-slate-400 text-xs">{formatAlertType(rule.type)}</span>
                    {rule.threshold != null && (
                      <span className="text-slate-300 text-xs tabular-nums">{rule.threshold}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
