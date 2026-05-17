import { Sparkles } from "lucide-react";
import { type AiInsight } from "@/src/lib/mock-data";

const sentimentColors: Record<AiInsight["sentiment"], string> = {
  bullish: "text-emerald-400 bg-emerald-500/10 border-emerald-800/50",
  cautious: "text-amber-400 bg-amber-500/10 border-amber-800/50",
  bearish: "text-red-400 bg-red-500/10 border-red-800/50",
};

interface AiInsightsWidgetProps {
  insights: AiInsight[];
}

export default function AiInsightsWidget({ insights }: AiInsightsWidgetProps) {
  return (
    <div className="bg-[#111318] border border-slate-800 rounded-xl overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-4 border-b border-slate-800">
        <Sparkles size={14} className="text-purple-400" />
        <h2 className="text-white font-semibold text-sm">AI Insights</h2>
      </div>
      <div className="divide-y divide-slate-800/60">
        {insights.map((insight) => (
          <div key={`${insight.symbol}-${insight.minutesAgo}`} className="px-4 py-3">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <span className="text-white font-semibold text-sm">{insight.symbol}</span>
                <span className={`text-xs border px-1.5 py-0.5 rounded-full font-medium capitalize ${sentimentColors[insight.sentiment]}`}>
                  {insight.sentiment}
                </span>
              </div>
              <span className="text-xs text-slate-600">{insight.minutesAgo} min ago</span>
            </div>
            <p className="text-slate-300 text-xs font-medium mb-0.5">{insight.title}</p>
            <p className="text-slate-500 text-xs leading-relaxed">{insight.summary}</p>
          </div>
        ))}
      </div>
      <div className="px-4 py-3 border-t border-slate-800">
        <p className="text-slate-600 text-xs text-center">Research support only. Not financial advice.</p>
      </div>
    </div>
  );
}
