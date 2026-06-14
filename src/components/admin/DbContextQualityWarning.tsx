"use client";

import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { assessDbContextQualityAction } from "@/src/actions/db-context-quality-actions";
import type { DbContextQuality } from "@/src/lib/opportunity-radar/db-context-quality";

interface DbContextQualityWarningProps {
  dbContextLimit: number;
}

export function DbContextQualityWarning({ dbContextLimit }: DbContextQualityWarningProps) {
  const [quality, setQuality] = useState<DbContextQuality | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const assessQuality = async () => {
      setIsLoading(true);
      try {
        const result = await assessDbContextQualityAction(dbContextLimit);
        setQuality(result);
      } catch (error) {
        console.error("Failed to assess DB context quality:", error);
      } finally {
        setIsLoading(false);
      }
    };

    assessQuality();
  }, [dbContextLimit]);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-2">
        <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
        <span className="text-xs text-slate-500">Checking database context quality...</span>
      </div>
    );
  }

  if (!quality) {
    return null;
  }

  const isWarning = quality.overallCompleteness < 80;
  const isError = quality.overallCompleteness < 50;

  if (!isWarning && !isError) {
    return (
      <div className="flex items-start gap-2 p-2 rounded bg-slate-900/40 border border-slate-700/30">
        <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
        <div className="text-xs text-slate-400">
          Database context has good completeness ({quality.overallCompleteness}%)
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-start gap-2 p-2.5 rounded border ${
      isError
        ? "bg-red-900/20 border-red-800/40"
        : "bg-amber-900/20 border-amber-800/40"
    }`}>
      <AlertCircle className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${
        isError ? "text-red-400" : "text-amber-400"
      }`} />
      <div className={`text-xs space-y-1 ${isError ? "text-red-300" : "text-amber-300"}`}>
        <p className="font-semibold">Database context completeness: {quality.overallCompleteness}%</p>
        <p className="text-xs leading-relaxed">
          Quotes: {quality.quoteCompleteness}% • Scores: {quality.scoreCompleteness}% • Analyst: {quality.analystCompleteness}%
        </p>
        {quality.warning && (
          <p className="text-xs leading-relaxed mt-1">{quality.warning}</p>
        )}
      </div>
    </div>
  );
}
