"use server";

import { validateRadarScanOutput } from "@/src/lib/opportunity-radar/validate-radar-output";
import { persistRadarScanOutput } from "@/src/lib/opportunity-radar/persist-radar-output";
import { sampleRadarOutput } from "@/src/lib/opportunity-radar/sample-radar-output";
import { callClaudeRadar } from "@/src/lib/opportunity-radar/claude-radar-provider";
import { buildRadarPrompt } from "@/src/lib/opportunity-radar/build-radar-prompt";

export type RadarFixtureScanResult = {
  success: boolean;
  scanId?: string;
  candidateCount?: number;
  evidenceCount?: number;
  error?: string;
  validationErrors?: string[];
};

export type RadarClaudeScanResult = {
  success: boolean;
  scanId?: string;
  candidateCount?: number;
  evidenceCount?: number;
  provider?: string;
  model?: string;
  sourceMode?: string;
  executionTimeMs?: number;
  error?: string;
  validationErrors?: string[];
  rawOutputPreview?: string;
};

/**
 * Run Opportunity Radar fixture validation and persistence
 * Phase 23C-2B: Admin button trigger for fixture-only scan
 *
 * This action:
 * - Validates sampleRadarOutput using strict rules
 * - Persists valid output to RadarScan/RadarCandidate/RadarEvidence tables
 * - Does NOT call any external AI, provider, or search APIs
 * - Returns scanId, candidateCount, evidenceCount on success
 */
export async function runOpportunityRadarFixtureScanAction(): Promise<RadarFixtureScanResult> {
  try {
    // Step 1: Validate fixture
    const validationResult = validateRadarScanOutput(sampleRadarOutput);

    if (!validationResult.success) {
      return {
        success: false,
        error: "Fixture validation failed",
        validationErrors: validationResult.errors,
      };
    }

    if (!validationResult.data) {
      return {
        success: false,
        error: "No validated data to persist",
      };
    }

    // Step 2: Persist to database
    const persistResult = await persistRadarScanOutput(validationResult.data);

    if (!persistResult.success) {
      return {
        success: false,
        error: persistResult.error || "Persistence failed",
      };
    }

    // Step 3: Return success with metrics
    return {
      success: true,
      scanId: persistResult.scanId,
      candidateCount: persistResult.candidateCount,
      evidenceCount: persistResult.evidenceCount,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return {
      success: false,
      error: `Action failed: ${message}`,
    };
  }
}

/**
 * Run Opportunity Radar Claude scan
 * Phase 23C-2C: Real Claude API execution from Admin
 *
 * This action:
 * - Builds a prompt with DB context (controlled source pack mode)
 * - Calls Claude server-side via Anthropic API
 * - Validates the output with strict rules
 * - Persists valid output to DB if validation passes
 * - Returns clear error if API key missing, provider fails, or validation fails
 * - Does NOT persist invalid output
 */
export async function runOpportunityRadarClaudeScanAction(): Promise<RadarClaudeScanResult> {
  try {
    // Step 1: Build prompt with DB context
    const prompt = await buildRadarPrompt();

    // Step 2: Call Claude
    const providerResponse = await callClaudeRadar({ prompt });

    if (!providerResponse.success || !providerResponse.rawText) {
      return {
        success: false,
        error: providerResponse.error || "Claude call failed",
        provider: providerResponse.metadata?.provider || "Anthropic",
        model: providerResponse.metadata?.model || "claude-sonnet-4.6",
        sourceMode: "db_context",
        executionTimeMs: providerResponse.metadata?.executionTimeMs,
      };
    }

    // Step 3: Parse and validate
    const validationResult = providerResponse.parsed
      ? validateRadarScanOutput(providerResponse.parsed)
      : { success: false, data: undefined, errors: ["Invalid JSON from Claude"], warnings: [] };

    if (!validationResult.success) {
      const preview = providerResponse.rawText.slice(0, 500);
      return {
        success: false,
        error: "Claude output validation failed",
        validationErrors: validationResult.errors,
        rawOutputPreview: preview,
        provider: providerResponse.metadata?.provider || "Anthropic",
        model: providerResponse.metadata?.model || "claude-sonnet-4.6",
        sourceMode: "db_context",
        executionTimeMs: providerResponse.metadata?.executionTimeMs,
      };
    }

    if (!validationResult.data) {
      return {
        success: false,
        error: "No validated data to persist",
        provider: providerResponse.metadata?.provider || "Anthropic",
        model: providerResponse.metadata?.model || "claude-sonnet-4.6",
        sourceMode: "db_context",
        executionTimeMs: providerResponse.metadata?.executionTimeMs,
      };
    }

    // Step 4: Persist to database
    const persistResult = await persistRadarScanOutput(validationResult.data);

    if (!persistResult.success) {
      return {
        success: false,
        error: persistResult.error || "Persistence failed",
        provider: providerResponse.metadata?.provider || "Anthropic",
        model: providerResponse.metadata?.model || "claude-sonnet-4.6",
        sourceMode: "db_context",
        executionTimeMs: providerResponse.metadata?.executionTimeMs,
      };
    }

    // Step 5: Return success with metrics
    return {
      success: true,
      scanId: persistResult.scanId,
      candidateCount: persistResult.candidateCount,
      evidenceCount: persistResult.evidenceCount,
      provider: providerResponse.metadata?.provider || "Anthropic",
      model: providerResponse.metadata?.model || "claude-sonnet-4.6",
      sourceMode: "db_context",
      executionTimeMs: providerResponse.metadata?.executionTimeMs,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return {
      success: false,
      error: `Action failed: ${message}`,
      provider: "Anthropic",
      model: "claude-sonnet-4.6",
      sourceMode: "db_context",
    };
  }
}
