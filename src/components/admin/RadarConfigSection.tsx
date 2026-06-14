"use client";

import { useState, useEffect } from "react";
import { ChevronDown, ChevronUp, Save, AlertCircle, CheckCircle, Zap, Loader2 } from "lucide-react";
import { saveRadarConfigAction, getRadarConfigAction } from "@/src/actions/radar-config-actions";
import { getExactFullRequestTokenCountAction } from "@/src/actions/token-counting-actions";
import {
  calculateTokenBreakdown,
  type TokenBreakdown,
} from "@/src/lib/opportunity-radar/radar-token-accounting";
import type { EffectiveRadarConfig } from "@/src/lib/opportunity-radar/radar-ai-config";
import { DbContextQualityWarning } from "./DbContextQualityWarning";

interface RadarConfigSectionProps {
  currentConfig: EffectiveRadarConfig;
  onConfigUpdate?: () => void;
}

export function RadarConfigSection({ currentConfig, onConfigUpdate }: RadarConfigSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isCountingFullRequest, setIsCountingFullRequest] = useState(false);
  const [exactFullRequestTokens, setExactFullRequestTokens] = useState<{ value: number; error?: string } | null>(null);
  const [tokenBreakdown, setTokenBreakdown] = useState<TokenBreakdown | null>(null);

  const [formData, setFormData] = useState({
    promptTemplate: currentConfig.promptTemplate,
    maxTokens: currentConfig.maxTokens,
    dbContextLimit: currentConfig.dbContextLimit,
    candidateLimit: currentConfig.candidateLimit,
    model: currentConfig.model,
    debugTraceEnabled: currentConfig.debugTraceEnabledSource === "db" ? currentConfig.debugTraceEnabled : false,
    changeNotes: "",
  });

  const handleSaveConfig = async () => {
    setIsSaving(true);
    setSaveMessage(null);

    try {
      const result = await saveRadarConfigAction({
        configId: currentConfig.configId,
        promptTemplate: formData.promptTemplate,
        maxTokens: formData.maxTokens,
        dbContextLimit: formData.dbContextLimit,
        candidateLimit: formData.candidateLimit,
        model: formData.model,
        debugTraceEnabled: formData.debugTraceEnabled,
        changeNotes: formData.changeNotes,
      });

      if (result.success) {
        setSaveMessage({ type: "success", text: "Configuration saved successfully" });
        onConfigUpdate?.();
        // Clear change notes after save
        setFormData((prev) => ({ ...prev, changeNotes: "" }));
      } else {
        setSaveMessage({
          type: "error",
          text: result.error || "Failed to save configuration",
        });
      }
    } catch (error) {
      setSaveMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Calculate token breakdown whenever prompt or context changes
  useEffect(() => {
    const breakdown = calculateTokenBreakdown(formData.promptTemplate, formData.dbContextLimit);
    setTokenBreakdown(breakdown);
  }, [formData.promptTemplate, formData.dbContextLimit]);

  const handleCountFullRequestTokens = async () => {
    setIsCountingFullRequest(true);
    setExactFullRequestTokens(null);

    try {
      const result = await getExactFullRequestTokenCountAction(
        formData.promptTemplate,
        formData.model,
        formData.dbContextLimit
      );

      if (result.success && result.inputTokens !== undefined) {
        setExactFullRequestTokens({ value: result.inputTokens });
        // Update the token breakdown with exact count
        if (tokenBreakdown) {
          setTokenBreakdown({
            ...tokenBreakdown,
            exactFullRequestTokens: result.inputTokens,
          });
        }
      } else {
        setExactFullRequestTokens({ value: 0, error: result.error || "Failed to count tokens" });
      }
    } catch (error) {
      setExactFullRequestTokens({
        value: 0,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsCountingFullRequest(false);
    }
  };

  return (
    <section className="bg-slate-800/50 border border-slate-700 rounded-lg space-y-0">
      {/* Header — Collapsed/Expanded Toggle */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-700/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
          <div className="text-left">
            <h3 className="text-sm font-semibold text-slate-200">AI Scan Config</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {currentConfig.promptSource === "db"
                ? "Using DB config"
                : currentConfig.promptSource === "env"
                  ? "Using env config"
                  : "Using code defaults"}
              {" • "}
              {currentConfig.maxTokens} tokens {" • "}
              {currentConfig.dbContextLimit} stocks {" • "}
              {currentConfig.candidateLimit} candidates
            </p>
          </div>
        </div>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-slate-700 px-4 py-4 space-y-4">
          {/* Config Sources Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-900/50 rounded p-3 border border-slate-700/50">
            <div>
              <p className="text-slate-500 mb-1">Prompt Source</p>
              <p className="font-mono text-slate-300 capitalize">{currentConfig.promptSource}</p>
            </div>
            <div>
              <p className="text-slate-500 mb-1">Model Source</p>
              <p className="font-mono text-slate-300 capitalize">{currentConfig.modelSource}</p>
            </div>
            <div>
              <p className="text-slate-500 mb-1">API Key</p>
              <p className="font-mono text-slate-300">
                {process.env.ANTHROPIC_API_KEY ? "Configured" : "Missing"}
              </p>
            </div>
            <div>
              <p className="text-slate-500 mb-1">Debug Trace</p>
              <p className="font-mono text-slate-300">
                {currentConfig.debugTraceEnabledSource === "env" ? "Env enabled" : currentConfig.debugTraceEnabled ? "DB enabled" : "Disabled"}
              </p>
            </div>
          </div>

          {/* DB Context Quality Warning */}
          <div>
            <p className="text-xs font-semibold text-slate-300 mb-2">Database Context</p>
            <DbContextQualityWarning dbContextLimit={formData.dbContextLimit} />
          </div>

          {/* API Key Status Explanation */}
          <div className="rounded bg-slate-900/60 border border-slate-700/60 px-3 py-2.5 space-y-1">
            <p className="text-xs text-slate-400">
              <span className="font-medium text-slate-300">API Key:</span> Read from <span className="font-mono">ANTHROPIC_API_KEY</span> environment variable on the server.
            </p>
            <p className="text-xs text-slate-500">
              The key value is never displayed or logged. Restart the dev server after updating <span className="font-mono">.env</span>.
            </p>
          </div>

          {/* Editable Fields */}
          <div className="space-y-4">
            {/* Prompt Template */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">Prompt Template</label>
              <textarea
                value={formData.promptTemplate}
                onChange={(e) => setFormData((prev) => ({ ...prev, promptTemplate: e.target.value }))}
                className="w-full px-3 py-2 rounded border border-slate-600 bg-slate-900 text-slate-200 text-xs font-mono focus:border-emerald-500 focus:outline-none"
                rows={6}
              />
              <p className="text-xs text-slate-500 mt-1">
                Length: {formData.promptTemplate.length} chars · Prompt template tokens: ~{tokenBreakdown?.promptTemplateTokens || 0} (min 200 chars)
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                Only counts the editable prompt template text.
              </p>
            </div>

            {/* Token Breakdown Section */}
            {tokenBreakdown && (
              <div className="rounded bg-slate-900/40 border border-slate-700/60 px-3 py-3 space-y-2">
                <p className="text-xs font-semibold text-slate-300 mb-2">Token Breakdown</p>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Prompt template:</span>
                    <span className="text-slate-300 font-mono">~{tokenBreakdown.promptTemplateTokens}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">DB stock context:</span>
                    <span className="text-slate-300 font-mono">~{tokenBreakdown.dbContextTokens}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Tool schema/runtime:</span>
                    <span className="text-slate-300 font-mono">~{tokenBreakdown.toolSchemaAndRuntimeTokens}</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-700/50 pt-1 mt-1">
                    <span className="text-slate-400 font-medium">Estimated full request:</span>
                    <span className="text-emerald-400 font-mono font-semibold">~{tokenBreakdown.estimatedFullRequestTokens}</span>
                  </div>
                </div>
                {tokenBreakdown.exactFullRequestTokens !== undefined && (
                  <div className="flex justify-between border-t border-emerald-800/30 pt-1 mt-1">
                    <span className="text-emerald-400 font-medium">Exact full request:</span>
                    <span className="text-emerald-400 font-mono font-semibold">{tokenBreakdown.exactFullRequestTokens}</span>
                  </div>
                )}
                <div className="flex items-start gap-2 mt-2 pt-2 border-t border-slate-700/50">
                  <button
                    onClick={handleCountFullRequestTokens}
                    disabled={isCountingFullRequest}
                    className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded border border-slate-600 hover:border-emerald-500 text-slate-400 hover:text-emerald-400 hover:bg-slate-700/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isCountingFullRequest ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Zap className="w-3 h-3" />
                    )}
                    Count full request tokens
                  </button>
                </div>
                {exactFullRequestTokens?.error && (
                  <p className="text-xs text-amber-400 mt-1">{exactFullRequestTokens.error}</p>
                )}
                <p className="text-xs text-slate-500 mt-2">
                  Full request includes the editable prompt, selected DB stock context, Claude message formatting, and tool schema. Final API usage may differ slightly.
                </p>
              </div>
            )}

            {/* Numeric Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">Max Tokens</label>
                <input
                  type="number"
                  value={formData.maxTokens}
                  onChange={(e) => setFormData((prev) => ({ ...prev, maxTokens: parseInt(e.target.value, 10) || 0 }))}
                  min="2000"
                  max="50000"
                  className="w-full px-3 py-2 rounded border border-slate-600 bg-slate-900 text-slate-200 text-xs focus:border-emerald-500 focus:outline-none"
                />
                <p className="text-xs text-slate-500 mt-1">Range: 2000–50000</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">DB Stocks Sent to Claude</label>
                <input
                  type="number"
                  value={formData.dbContextLimit}
                  onChange={(e) => setFormData((prev) => ({ ...prev, dbContextLimit: parseInt(e.target.value, 10) || 0 }))}
                  min="1"
                  max="100"
                  className="w-full px-3 py-2 rounded border border-slate-600 bg-slate-900 text-slate-200 text-xs focus:border-emerald-500 focus:outline-none"
                />
                <p className="text-xs text-slate-500 mt-1">Number of stocks included in context (1–100). Higher values increase token usage.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">Max Candidates to Return</label>
                <input
                  type="number"
                  value={formData.candidateLimit}
                  onChange={(e) => setFormData((prev) => ({ ...prev, candidateLimit: parseInt(e.target.value, 10) || 0 }))}
                  min="1"
                  max="20"
                  className="w-full px-3 py-2 rounded border border-slate-600 bg-slate-900 text-slate-200 text-xs focus:border-emerald-500 focus:outline-none"
                />
                <p className="text-xs text-slate-500 mt-1">Maximum research candidates Claude can return (1–20). Higher values may increase noise.</p>
              </div>
            </div>

            {/* Model Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">Claude Model</label>
              <input
                type="text"
                value={formData.model}
                onChange={(e) => setFormData((prev) => ({ ...prev, model: e.target.value }))}
                placeholder="claude-sonnet-4-6"
                className="w-full px-3 py-2 rounded border border-slate-600 bg-slate-900 text-slate-200 text-xs placeholder-slate-600 focus:border-emerald-500 focus:outline-none"
              />
              <p className="text-xs text-slate-500 mt-1">Model to use for Claude scans (e.g., claude-sonnet-4-6, claude-opus-4-8)</p>
            </div>

            {/* Checkbox & Change Notes */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.debugTraceEnabled}
                  onChange={(e) => setFormData((prev) => ({ ...prev, debugTraceEnabled: e.target.checked }))}
                  className="w-4 h-4 rounded border border-slate-600 bg-slate-900 cursor-pointer"
                />
                <span className="text-xs text-slate-300">Enable debug trace on next scan</span>
              </label>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">Change Notes (optional)</label>
                <input
                  type="text"
                  value={formData.changeNotes}
                  onChange={(e) => setFormData((prev) => ({ ...prev, changeNotes: e.target.value }))}
                  placeholder="Document why you changed this config..."
                  className="w-full px-3 py-2 rounded border border-slate-600 bg-slate-900 text-slate-200 text-xs placeholder-slate-600 focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Save Message */}
            {saveMessage && (
              <div
                className={`flex items-start gap-2 rounded p-3 ${
                  saveMessage.type === "success"
                    ? "bg-emerald-900/30 border border-emerald-800/50"
                    : "bg-red-900/30 border border-red-800/50"
                }`}
              >
                {saveMessage.type === "success" ? (
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                )}
                <p className={`text-xs ${saveMessage.type === "success" ? "text-emerald-300" : "text-red-300"}`}>
                  {saveMessage.text}
                </p>
              </div>
            )}

            {/* Save Button */}
            <button
              onClick={handleSaveConfig}
              disabled={isSaving}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium bg-emerald-700 hover:bg-emerald-600 text-white border border-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-emerald-300 border-t-emerald-600 rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Config
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
