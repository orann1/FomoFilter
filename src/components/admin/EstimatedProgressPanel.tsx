import { useEffect, useState } from "react";
import { Loader2, Info } from "lucide-react";

interface EstimatedProgressPanelProps {
  isRunning: boolean;
}

export function EstimatedProgressPanel({ isRunning }: EstimatedProgressPanelProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    "Preparing Claude scan",
    "Loading database context",
    "Building prompt from active config",
    "Sending request to Claude",
    "Waiting for Claude response",
    "Validating structured output",
    "Persisting scan results",
    "Finalizing result",
  ];

  useEffect(() => {
    if (!isRunning) {
      setCurrentStep(0);
      return;
    }

    // Advance through initial steps quickly
    let currentStepIndex = 0;
    const advanceSteps = () => {
      if (currentStepIndex < 4) {
        currentStepIndex++;
        setCurrentStep(currentStepIndex);
        setTimeout(advanceSteps, 800);
      } else {
        // Stay on step 5 (Waiting for Claude response) while running
        setCurrentStep(4);
      }
    };

    advanceSteps();
  }, [isRunning]);

  if (!isRunning) {
    return null;
  }

  return (
    <div className="rounded-lg bg-slate-900/80 border border-blue-800/60 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Loader2 className="w-4 h-4 text-blue-400 shrink-0 animate-spin" />
        <span className="text-sm font-semibold text-blue-300">Estimated progress</span>
      </div>

      <div className="space-y-2">
        {steps.map((step, idx) => {
          const isActive = idx === currentStep;
          const isCompleted = idx < currentStep;
          return (
            <div key={idx} className="flex items-center gap-2 text-xs">
              <div
                className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 ${
                  isActive
                    ? "border-blue-400 bg-blue-500/20"
                    : isCompleted
                      ? "border-emerald-400 bg-emerald-500/20"
                      : "border-slate-600 bg-slate-700"
                }`}
              >
                {isCompleted && <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
                {isActive && <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />}
              </div>
              <span
                className={
                  isActive || isCompleted
                    ? "text-slate-300 font-medium"
                    : "text-slate-500"
                }
              >
                {step}
              </span>
            </div>
          );
        })}
      </div>

      <div className="rounded bg-slate-900/60 border border-slate-700/50 px-3 py-2 flex items-start gap-2">
        <Info className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
        <p className="text-xs text-slate-400">
          Progress is estimated. Exact backend step tracking will require future scan job progress tracking.
        </p>
      </div>
    </div>
  );
}
