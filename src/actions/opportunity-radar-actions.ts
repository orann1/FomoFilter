"use server";

import { validateRadarScanOutput } from "@/src/lib/opportunity-radar/validate-radar-output";
import { persistRadarScanOutput, persistFailedRadarScan } from "@/src/lib/opportunity-radar/persist-radar-output";
import { sampleRadarOutput } from "@/src/lib/opportunity-radar/sample-radar-output";
import { callClaudeRadar } from "@/src/lib/opportunity-radar/claude-radar-provider";
import { buildRadarPrompt, loadStockContext } from "@/src/lib/opportunity-radar/build-radar-prompt";
import { createRadarDebugTrace } from "@/src/lib/opportunity-radar/radar-debug-trace";
import { RADAR_TOOL_DEFINITION } from "@/src/lib/opportunity-radar/radar-tool-schema";
import { loadEffectiveRadarConfig } from "@/src/lib/opportunity-radar/radar-ai-config";

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
  debugTracePath?: string;
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
 * Phase 23C-2C+: Real Claude API execution with Tool Use structured output
 *
 * This action:
 * - Builds a prompt with DB context (controlled source pack mode)
 * - Calls Claude server-side with Tool Use (structured output requirement)
 * - Claude returns tool_use block with create_radar_scan_output
 * - Validates the structured output with strict rules
 * - Persists valid output to DB if validation passes
 * - Returns clear error if tool_use is missing, validation fails, or API fails
 * - Does NOT persist invalid output
 * - Optionally writes debug trace file when RADAR_DEBUG_AI_TRACE=true
 */
export async function runOpportunityRadarClaudeScanAction(): Promise<RadarClaudeScanResult> {
  const trace = createRadarDebugTrace();
  let debugTracePath: string | null = null;
  let configId: string | undefined;

  try {
    // Step 0: Load effective config from DB/Env/Defaults
    const config = await loadEffectiveRadarConfig();
    configId = config.configId;

    // Step 1: Build prompt with DB context using config values
    const prompt = await buildRadarPrompt(config.promptTemplate, config.dbContextLimit);
    const stocks = await loadStockContext(config.dbContextLimit);

    // Populate trace with DB context
    trace.setDbContext(stocks, prompt);

    // Step 2: Call Claude (expects tool_use response with structured output)
    const providerResponse = await callClaudeRadar({
      prompt,
      trace,
      toolSchema: RADAR_TOOL_DEFINITION,
      maxTokens: config.maxTokens,
      model: config.model,
    });

    // Step 3: Check for provider error
    if (!providerResponse.success) {
      trace.setFinalResult(
        "provider_error",
        providerResponse.error || "Claude call failed"
      );
      debugTracePath = await trace.writeToDisk();

      // Persist failed scan to database for audit trail
      const failureType = providerResponse.error?.includes("max_tokens")
        ? "truncation"
        : "provider_error";
      await persistFailedRadarScan(
        providerResponse.error || "Claude call failed",
        providerResponse.metadata?.provider || "Anthropic",
        providerResponse.metadata?.model || "claude-sonnet-4.6",
        providerResponse.metadata?.executionTimeMs,
        providerResponse.metadata?.inputTokens,
        providerResponse.metadata?.outputTokens,
        config.configId,
        failureType
      );

      return {
        success: false,
        error: providerResponse.error || "Claude call failed",
        provider: providerResponse.metadata?.provider || "Anthropic",
        model: providerResponse.metadata?.model || "claude-sonnet-4.6",
        sourceMode: "db_context",
        executionTimeMs: providerResponse.metadata?.executionTimeMs,
        debugTracePath: debugTracePath || undefined,
      };
    }

    // Step 4: Check if tool_use was returned
    if (!providerResponse.toolUseFound) {
      trace.setFinalResult(
        "provider_error",
        "Claude did not return the required structured tool output"
      );
      debugTracePath = await trace.writeToDisk();

      // Persist failed scan to database for audit trail
      await persistFailedRadarScan(
        "Claude did not return the required structured tool output. Tool Use may not be available in your API version.",
        providerResponse.metadata?.provider || "Anthropic",
        providerResponse.metadata?.model || "claude-sonnet-4.6",
        providerResponse.metadata?.executionTimeMs,
        providerResponse.metadata?.inputTokens,
        providerResponse.metadata?.outputTokens,
        config.configId,
        "validation_error"
      );

      return {
        success: false,
        error: "Claude did not return the required structured tool output. Tool Use may not be available in your API version.",
        provider: providerResponse.metadata?.provider || "Anthropic",
        model: providerResponse.metadata?.model || "claude-sonnet-4.6",
        sourceMode: "db_context",
        executionTimeMs: providerResponse.metadata?.executionTimeMs,
        debugTracePath: debugTracePath || undefined,
      };
    }

    // Step 5: Validate tool output
    if (!providerResponse.parsed) {
      trace.setFinalResult(
        "provider_error",
        "Tool input could not be parsed or is invalid"
      );
      debugTracePath = await trace.writeToDisk();

      // Persist failed scan to database for audit trail
      await persistFailedRadarScan(
        "Tool input could not be parsed or is invalid",
        providerResponse.metadata?.provider || "Anthropic",
        providerResponse.metadata?.model || "claude-sonnet-4.6",
        providerResponse.metadata?.executionTimeMs,
        providerResponse.metadata?.inputTokens,
        providerResponse.metadata?.outputTokens,
        config.configId,
        "validation_error"
      );

      return {
        success: false,
        error: "Tool input could not be parsed or is invalid",
        provider: providerResponse.metadata?.provider || "Anthropic",
        model: providerResponse.metadata?.model || "claude-sonnet-4.6",
        sourceMode: "db_context",
        executionTimeMs: providerResponse.metadata?.executionTimeMs,
        debugTracePath: debugTracePath || undefined,
      };
    }

    const validationResult = validateRadarScanOutput(providerResponse.parsed);

    trace.setValidation(validationResult);

    if (!validationResult.success) {
      trace.setFinalResult(
        "validation_error",
        `Tool output validation failed: ${validationResult.errors[0] || "unknown"}`
      );
      debugTracePath = await trace.writeToDisk();

      // Persist failed scan to database for audit trail
      await persistFailedRadarScan(
        `Tool output validation failed: ${validationResult.errors[0] || "unknown error"}`,
        providerResponse.metadata?.provider || "Anthropic",
        providerResponse.metadata?.model || "claude-sonnet-4.6",
        providerResponse.metadata?.executionTimeMs,
        providerResponse.metadata?.inputTokens,
        providerResponse.metadata?.outputTokens,
        config.configId,
        "validation_error"
      );

      return {
        success: false,
        error: "Tool output validation failed",
        validationErrors: validationResult.errors,
        provider: providerResponse.metadata?.provider || "Anthropic",
        model: providerResponse.metadata?.model || "claude-sonnet-4.6",
        sourceMode: "db_context",
        executionTimeMs: providerResponse.metadata?.executionTimeMs,
        debugTracePath: debugTracePath || undefined,
      };
    }

    if (!validationResult.data) {
      trace.setFinalResult(
        "validation_error",
        "No validated data to persist"
      );
      debugTracePath = await trace.writeToDisk();

      // Persist failed scan to database for audit trail
      await persistFailedRadarScan(
        "No validated data to persist",
        providerResponse.metadata?.provider || "Anthropic",
        providerResponse.metadata?.model || "claude-sonnet-4.6",
        providerResponse.metadata?.executionTimeMs,
        providerResponse.metadata?.inputTokens,
        providerResponse.metadata?.outputTokens,
        config.configId,
        "validation_error"
      );

      return {
        success: false,
        error: "No validated data to persist",
        provider: providerResponse.metadata?.provider || "Anthropic",
        model: providerResponse.metadata?.model || "claude-sonnet-4.6",
        sourceMode: "db_context",
        executionTimeMs: providerResponse.metadata?.executionTimeMs,
        debugTracePath: debugTracePath || undefined,
      };
    }

    // Step 6: Persist to database
    trace.setPersistence(true, false, null, 0, 0);

    const persistResult = await persistRadarScanOutput(validationResult.data, config.configId);

    if (!persistResult.success) {
      trace.setPersistence(
        true,
        false,
        null,
        0,
        0,
        persistResult.error || "Persistence failed"
      );
      trace.setFinalResult(
        "persistence_error",
        persistResult.error || "Persistence failed"
      );
      debugTracePath = await trace.writeToDisk();

      // Persist failed scan to database for audit trail
      await persistFailedRadarScan(
        persistResult.error || "Persistence failed",
        providerResponse.metadata?.provider || "Anthropic",
        providerResponse.metadata?.model || "claude-sonnet-4.6",
        providerResponse.metadata?.executionTimeMs,
        providerResponse.metadata?.inputTokens,
        providerResponse.metadata?.outputTokens,
        config.configId,
        "persistence_error"
      );

      return {
        success: false,
        error: persistResult.error || "Persistence failed",
        provider: providerResponse.metadata?.provider || "Anthropic",
        model: providerResponse.metadata?.model || "claude-sonnet-4.6",
        sourceMode: "db_context",
        executionTimeMs: providerResponse.metadata?.executionTimeMs,
        debugTracePath: debugTracePath || undefined,
      };
    }

    // Step 7: Return success with metrics
    trace.setPersistence(
      true,
      true,
      persistResult.scanId || null,
      persistResult.candidateCount || 0,
      persistResult.evidenceCount || 0
    );
    trace.setFinalResult("success", "Radar scan completed successfully");
    debugTracePath = await trace.writeToDisk();

    return {
      success: true,
      scanId: persistResult.scanId,
      candidateCount: persistResult.candidateCount,
      evidenceCount: persistResult.evidenceCount,
      provider: providerResponse.metadata?.provider || "Anthropic",
      model: providerResponse.metadata?.model || "claude-sonnet-4.6",
      sourceMode: "db_context",
      executionTimeMs: providerResponse.metadata?.executionTimeMs,
      debugTracePath: debugTracePath || undefined,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const errorMessage = `Action failed: ${message}`;

    trace.setFinalResult(
      "provider_error",
      errorMessage
    );

    try {
      debugTracePath = await trace.writeToDisk();
    } catch {
      // Silently ignore trace write failures
    }

    // Persist failed scan to database for audit trail
    try {
      await persistFailedRadarScan(
        errorMessage,
        "Anthropic",
        "claude-sonnet-4.6",
        undefined,
        undefined,
        undefined,
        configId,
        "provider_error"
      );
    } catch {
      // Silently ignore persistence failures
    }

    return {
      success: false,
      error: errorMessage,
      provider: "Anthropic",
      model: "claude-sonnet-4.6",
      sourceMode: "db_context",
      debugTracePath: debugTracePath || undefined,
    };
  }
}
