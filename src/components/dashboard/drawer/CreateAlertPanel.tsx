"use client";

import { useState, useTransition } from "react";
import { X, Bell } from "lucide-react";
import { type AlertTypeLocal, type AlertFrequencyLocal } from "@/src/types/drawer";
import { type ActiveAlertRule } from "@/src/lib/data/dashboard";
import { createAlertRule } from "@/src/actions/drawer-actions";

interface CreateAlertPanelProps {
  symbol: string;
  currentPrice: number;
  hotScore: number;
  oppScore: number;
  relativeVolume: number;
  existingAlerts: ActiveAlertRule[];
  onSuccess: () => void;
  onCancel: () => void;
}

const ALERT_TYPES: AlertTypeLocal[] = [
  "Price Above",
  "Price Below",
  "Hot Score Above",
  "Opportunity Score Above",
  "Relative Volume Above",
];

const FREQUENCIES: AlertFrequencyLocal[] = ["Once", "Daily", "Always"];

function getDefaultThreshold(
  alertType: AlertTypeLocal,
  price: number,
  hotScore: number,
  oppScore: number,
  relVol: number
): string {
  switch (alertType) {
    case "Price Above":
      return (Math.ceil(price * 1.02 * 100) / 100).toFixed(2);
    case "Price Below":
      return (Math.floor(price * 0.95 * 100) / 100).toFixed(2);
    case "Hot Score Above":
      return String(Math.min(hotScore + 5, 100));
    case "Opportunity Score Above":
      return String(Math.min(oppScore + 5, 100));
    case "Relative Volume Above":
      return (relVol + 0.5).toFixed(1);
  }
}

function buildSummary(
  symbol: string,
  alertType: AlertTypeLocal,
  threshold: string,
  frequency: AlertFrequencyLocal
): string {
  const freqLabel =
    frequency === "Once" ? "once" : frequency === "Daily" ? "daily" : "every time";
  const val = threshold || "...";
  switch (alertType) {
    case "Price Above":
      return `Alert ${freqLabel} when ${symbol} price goes above $${val}`;
    case "Price Below":
      return `Alert ${freqLabel} when ${symbol} price drops below $${val}`;
    case "Hot Score Above":
      return `Alert ${freqLabel} when ${symbol} Hot Score exceeds ${val}`;
    case "Opportunity Score Above":
      return `Alert ${freqLabel} when ${symbol} Opportunity Score exceeds ${val}`;
    case "Relative Volume Above":
      return `Alert ${freqLabel} when ${symbol} relative volume exceeds ${val}x`;
  }
}

function formatAlertType(type: string): string {
  switch (type) {
    case "PRICE_ABOVE": return "Price Above";
    case "PRICE_BELOW": return "Price Below";
    case "HOT_SCORE_ABOVE": return "Hot Score Above";
    case "OPPORTUNITY_SCORE_ABOVE": return "Opp Score Above";
    case "RELATIVE_VOLUME_ABOVE": return "Rel Vol Above";
    default: return type;
  }
}

function formatFrequency(freq: string): string {
  switch (freq) {
    case "ONCE": return "Once";
    case "DAILY": return "Daily";
    case "ALWAYS": return "Always";
    default: return freq;
  }
}

export default function CreateAlertPanel({
  symbol,
  currentPrice,
  hotScore,
  oppScore,
  relativeVolume,
  existingAlerts,
  onSuccess,
  onCancel,
}: CreateAlertPanelProps) {
  const [alertType, setAlertType] = useState<AlertTypeLocal>("Price Above");
  const [threshold, setThreshold] = useState(() =>
    getDefaultThreshold("Price Above", currentPrice, hotScore, oppScore, relativeVolume)
  );
  const [frequency, setFrequency] = useState<AlertFrequencyLocal>("Once");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleAlertTypeChange(type: AlertTypeLocal) {
    setAlertType(type);
    setThreshold(getDefaultThreshold(type, currentPrice, hotScore, oppScore, relativeVolume));
    setError(null);
  }

  function validate(): string | null {
    if (!threshold.trim() || isNaN(parseFloat(threshold))) {
      return "Threshold must be a valid number.";
    }
    return null;
  }

  function handleSubmit() {
    const err = validate();
    if (err) {
      setError(err);
      return;
    }
    startTransition(async () => {
      const result = await createAlertRule({ symbol, type: alertType, threshold, frequency });
      if (!result.success) {
        setError(result.error);
        return;
      }
      onSuccess();
    });
  }

  const summary = buildSummary(symbol, alertType, threshold, frequency);

  return (
    <div className="bg-[#16181f] border border-slate-700/80 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-amber-500/5">
        <div className="flex items-center gap-2">
          <Bell size={13} className="text-amber-400" />
          <span className="text-sm font-semibold text-amber-400">Create Alert for {symbol}</span>
        </div>
        <button
          onClick={onCancel}
          disabled={isPending}
          className="text-slate-500 hover:text-white transition-colors p-1 rounded disabled:opacity-50"
        >
          <X size={14} />
        </button>
      </div>

      <div className="px-4 py-3 space-y-3">

        {/* Existing alerts */}
        {existingAlerts.length > 0 && (
          <div className="bg-amber-500/5 border border-amber-800/30 rounded-lg px-3 py-2.5">
            <p className="text-xs text-amber-400/80 font-medium mb-1.5 flex items-center gap-1">
              <Bell size={10} />
              Active alerts for {symbol}
            </p>
            <div className="space-y-1">
              {existingAlerts.map((alert, i) => (
                <p key={i} className="text-xs text-slate-400">
                  {formatAlertType(alert.type)}
                  {alert.threshold !== null && (
                    <span className="text-slate-300"> ${alert.threshold}</span>
                  )}
                  {" · "}
                  {formatFrequency(alert.frequency)}
                  {" · "}
                  {alert.notifyVia}
                </p>
              ))}
            </div>
          </div>
        )}

        <div>
          <label className="text-xs text-slate-500 mb-1 block">Alert Type</label>
          <select
            value={alertType}
            onChange={(e) => handleAlertTypeChange(e.target.value as AlertTypeLocal)}
            disabled={isPending}
            className="w-full bg-slate-800/60 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-600 transition-colors disabled:opacity-60"
          >
            {ALERT_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs text-slate-500 mb-1 block">Threshold</label>
          <input
            type="number"
            value={threshold}
            onChange={(e) => { setThreshold(e.target.value); setError(null); }}
            disabled={isPending}
            className="w-full bg-slate-800/60 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-600 transition-colors disabled:opacity-60"
          />
        </div>

        <div>
          <label className="text-xs text-slate-500 mb-1.5 block">Frequency</label>
          <div className="flex gap-2">
            {FREQUENCIES.map((f) => (
              <button
                key={f}
                onClick={() => setFrequency(f)}
                disabled={isPending}
                className={`flex-1 text-xs py-1.5 rounded-lg border transition-colors font-medium disabled:opacity-60 ${
                  frequency === f
                    ? "bg-amber-500/15 border-amber-600/50 text-amber-400"
                    : "bg-slate-800/60 border-slate-700 text-slate-400 hover:text-slate-300"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs text-slate-500 mb-1.5 block">Notify via</label>
          <div className="flex gap-2">
            <button className="px-3 py-1.5 bg-amber-500/15 border border-amber-600/50 text-amber-400 text-xs rounded-lg font-medium">
              In-app
            </button>
            <button
              disabled
              className="px-3 py-1.5 bg-slate-800/40 border border-slate-700/50 text-slate-600 text-xs rounded-lg cursor-not-allowed"
            >
              Email (coming soon)
            </button>
          </div>
        </div>

        <div className="bg-slate-800/60 border border-slate-700/60 rounded-lg px-3 py-2.5">
          <p className="text-xs text-slate-500 mb-1">Alert summary</p>
          <p className="text-xs text-slate-300 leading-relaxed">{summary}</p>
        </div>

        {error && <p className="text-xs text-red-400">{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={isPending}
          className="w-full bg-amber-600 hover:bg-amber-500 text-white text-sm font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <Bell size={13} />
          {isPending ? "Saving..." : "Create Alert"}
        </button>
      </div>
    </div>
  );
}
