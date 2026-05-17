import { Sparkles } from "lucide-react";
import { mockTodaysSignal } from "@/src/lib/mock-data";

export default function TodaysSignalCard() {
  const signal = mockTodaysSignal;
  return (
    <div className="bg-[#13111f] border border-purple-900/50 rounded-xl p-4 mb-5">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-purple-700/40 flex items-center justify-center shrink-0 mt-0.5">
          <Sparkles size={15} className="text-purple-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-white font-semibold text-sm">Today&apos;s Signal</span>
            <span className="text-xs bg-purple-800/60 text-purple-300 border border-purple-700/50 px-2 py-0.5 rounded-full">
              AI Brief
            </span>
          </div>
          <p className="text-slate-300 text-sm leading-relaxed">{signal.summary}</p>
          <div className="flex flex-wrap gap-2 mt-3">
            {signal.tags.map((tag) => (
              <span
                key={tag}
                className="text-xs text-purple-300 bg-purple-900/30 border border-purple-800/50 px-2 py-0.5 rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
