"use client";

import { useState } from "react";
import { X, Star } from "lucide-react";
import { type LocalWatchlistEntry, type WatchStatusLocal } from "@/src/types/drawer";

interface AddToWatchlistPanelProps {
  symbol: string;
  suggestedReason?: string;
  onSubmit: (entry: LocalWatchlistEntry) => void;
  onCancel: () => void;
}

const STATUS_OPTIONS: WatchStatusLocal[] = ["Watching", "Waiting", "Ready to Buy"];

export default function AddToWatchlistPanel({
  symbol,
  suggestedReason,
  onSubmit,
  onCancel,
}: AddToWatchlistPanelProps) {
  const [reason, setReason] = useState(suggestedReason ?? "");
  const [status, setStatus] = useState<WatchStatusLocal>("Watching");
  const [entryZoneLow, setEntryZoneLow] = useState("");
  const [entryZoneHigh, setEntryZoneHigh] = useState("");
  const [target, setTarget] = useState("");
  const [error, setError] = useState<string | null>(null);

  function validate(): string | null {
    if (!reason.trim()) return "Reason for tracking is required.";
    const low = parseFloat(entryZoneLow);
    const high = parseFloat(entryZoneHigh);
    if (entryZoneLow && entryZoneHigh && !isNaN(low) && !isNaN(high) && low > high) {
      return "Entry zone low must be less than or equal to high.";
    }
    if (target && isNaN(parseFloat(target))) return "Target must be a valid number.";
    return null;
  }

  function handleSubmit() {
    const err = validate();
    if (err) {
      setError(err);
      return;
    }
    onSubmit({
      watchlist: "Main Watchlist",
      reason: reason.trim(),
      status,
      entryZoneLow,
      entryZoneHigh,
      target,
      stopLoss: "",
    });
  }

  return (
    <div className="bg-[#16181f] border border-slate-700/80 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-emerald-500/5">
        <div className="flex items-center gap-2">
          <Star size={13} className="text-emerald-400" />
          <span className="text-sm font-semibold text-emerald-400">Add to Watchlist</span>
        </div>
        <button
          onClick={onCancel}
          className="text-slate-500 hover:text-white transition-colors p-1 rounded"
        >
          <X size={14} />
        </button>
      </div>

      <div className="px-4 py-3 space-y-3">
        <div>
          <label className="text-xs text-slate-500 mb-1 block">Watchlist</label>
          <div className="bg-slate-800/40 border border-slate-700/60 rounded-lg px-3 py-2 text-sm text-slate-500 cursor-not-allowed select-none">
            Main Watchlist
          </div>
        </div>

        <div>
          <label className="text-xs text-slate-500 mb-1 block">
            Reason for tracking <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={reason}
            onChange={(e) => { setReason(e.target.value); setError(null); }}
            placeholder="e.g. Strong momentum building"
            className="w-full bg-slate-800/60 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-600 transition-colors"
          />
        </div>

        <div>
          <label className="text-xs text-slate-500 mb-1.5 block">Status</label>
          <div className="flex gap-2">
            {STATUS_OPTIONS.map((opt) => (
              <button
                key={opt}
                onClick={() => setStatus(opt)}
                className={`flex-1 text-xs py-1.5 rounded-lg border transition-colors font-medium ${
                  status === opt
                    ? "bg-emerald-500/15 border-emerald-600/50 text-emerald-400"
                    : "bg-slate-800/60 border-slate-700 text-slate-400 hover:text-slate-300"
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs text-slate-500 mb-1 block">
            Entry zone <span className="text-slate-600">(optional)</span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              value={entryZoneLow}
              onChange={(e) => { setEntryZoneLow(e.target.value); setError(null); }}
              placeholder="Low"
              className="bg-slate-800/60 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-slate-600 transition-colors"
            />
            <input
              type="number"
              value={entryZoneHigh}
              onChange={(e) => { setEntryZoneHigh(e.target.value); setError(null); }}
              placeholder="High"
              className="bg-slate-800/60 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-slate-600 transition-colors"
            />
          </div>
        </div>

        <div>
          <label className="text-xs text-slate-500 mb-1 block">
            Target <span className="text-slate-600">(optional)</span>
          </label>
          <input
            type="number"
            value={target}
            onChange={(e) => { setTarget(e.target.value); setError(null); }}
            placeholder="e.g. 950"
            className="w-full bg-slate-800/60 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-slate-600 transition-colors"
          />
        </div>

        {error && <p className="text-xs text-red-400">{error}</p>}

        <div className="pt-1 space-y-2">
          <button
            onClick={handleSubmit}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-1.5"
          >
            <Star size={13} />
            Add {symbol} to Watchlist
          </button>
          <p className="text-center text-xs text-slate-600">
            Not a buy recommendation. For tracking purposes only.
          </p>
        </div>
      </div>
    </div>
  );
}
