"use client";

import { useState } from "react";
import { X, Pencil } from "lucide-react";
import { type LocalWatchlistEntry, type WatchStatusLocal } from "@/src/types/drawer";

export type EditWatchlistInitialValues = {
  status: WatchStatusLocal;
  reason: string;
  entryZoneLow: string;
  entryZoneHigh: string;
  target: string;
  stopLoss: string;
};

interface EditWatchlistPanelProps {
  symbol: string;
  initialValues: EditWatchlistInitialValues;
  onSubmit: (entry: LocalWatchlistEntry) => void;
  onCancel: () => void;
}

const STATUS_OPTIONS: WatchStatusLocal[] = ["Watching", "Waiting", "Ready to Buy"];

export default function EditWatchlistPanel({
  symbol,
  initialValues,
  onSubmit,
  onCancel,
}: EditWatchlistPanelProps) {
  const [status, setStatus] = useState<WatchStatusLocal>(initialValues.status);
  const [reason, setReason] = useState(initialValues.reason);
  const [entryZoneLow, setEntryZoneLow] = useState(initialValues.entryZoneLow);
  const [entryZoneHigh, setEntryZoneHigh] = useState(initialValues.entryZoneHigh);
  const [target, setTarget] = useState(initialValues.target);
  const [stopLoss, setStopLoss] = useState(initialValues.stopLoss);
  const [error, setError] = useState<string | null>(null);

  function validate(): string | null {
    const low = parseFloat(entryZoneLow);
    const high = parseFloat(entryZoneHigh);
    if (entryZoneLow && entryZoneHigh && !isNaN(low) && !isNaN(high) && low > high) {
      return "Entry zone low must be less than or equal to high.";
    }
    if (target && isNaN(parseFloat(target))) return "Target must be a valid number.";
    if (stopLoss && isNaN(parseFloat(stopLoss))) return "Stop loss must be a valid number.";
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
      stopLoss,
    });
  }

  return (
    <div className="bg-[#16181f] border border-slate-700/80 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-700/10">
        <div className="flex items-center gap-2">
          <Pencil size={13} className="text-slate-300" />
          <span className="text-sm font-semibold text-slate-300">Edit Watchlist — {symbol}</span>
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
          <label className="text-xs text-slate-500 mb-1.5 block">Status</label>
          <div className="flex gap-2">
            {STATUS_OPTIONS.map((opt) => (
              <button
                key={opt}
                onClick={() => setStatus(opt)}
                className={`flex-1 text-xs py-1.5 rounded-lg border transition-colors font-medium ${
                  status === opt
                    ? "bg-slate-300/15 border-slate-400/50 text-slate-200"
                    : "bg-slate-800/60 border-slate-700 text-slate-400 hover:text-slate-300"
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs text-slate-500 mb-1 block">Notes / reason</label>
          <input
            type="text"
            value={reason}
            onChange={(e) => { setReason(e.target.value); setError(null); }}
            placeholder="e.g. Watching for pullback entry"
            className="w-full bg-slate-800/60 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-slate-500 transition-colors"
          />
        </div>

        <div>
          <label className="text-xs text-slate-500 mb-1 block">Entry zone</label>
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

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Target</label>
            <input
              type="number"
              value={target}
              onChange={(e) => { setTarget(e.target.value); setError(null); }}
              placeholder="e.g. 1050"
              className="w-full bg-slate-800/60 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-slate-600 transition-colors"
            />
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Stop loss</label>
            <input
              type="number"
              value={stopLoss}
              onChange={(e) => { setStopLoss(e.target.value); setError(null); }}
              placeholder="e.g. 840"
              className="w-full bg-slate-800/60 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-slate-600 transition-colors"
            />
          </div>
        </div>

        {error && <p className="text-xs text-red-400">{error}</p>}

        <button
          onClick={handleSubmit}
          className="w-full bg-slate-700 hover:bg-slate-600 text-white text-sm font-semibold py-2.5 rounded-lg transition-colors"
        >
          Save Changes
        </button>
      </div>
    </div>
  );
}
