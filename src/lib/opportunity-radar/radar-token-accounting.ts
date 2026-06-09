/**
 * Token Accounting for Opportunity Radar AI Scans
 * Phase 24A-2: Clear separation of prompt, context, and runtime token costs
 *
 * Provides token estimation for different components of the full Claude request.
 */

import { estimatePromptTokens } from "./estimate-tokens";

/**
 * Estimate tokens for just the editable prompt template
 */
export function estimatePromptTemplateTokens(promptTemplate: string): number {
  return estimatePromptTokens(promptTemplate);
}

/**
 * Estimate tokens for DB context (stocks)
 *
 * Based on the buildRadarPrompt logic, each stock uses roughly:
 * - Symbol: 2 tokens
 * - Name: 3-5 tokens
 * - Metrics (price, change, analysts): 30-40 tokens
 * Average: ~50 tokens per stock
 */
export function estimateDbContextTokens(stockCount: number): number {
  const tokensPerStock = 50; // Conservative estimate
  return Math.max(0, stockCount * tokensPerStock);
}

/**
 * Estimate tokens for Claude message formatting, tool schema, and runtime instructions
 *
 * Includes:
 * - Message wrapper (role, content labels): ~10 tokens
 * - Tool definition (RADAR_TOOL_DEFINITION): ~800-900 tokens
 * - System instructions in prompt: already counted in prompt
 * - Response formatting instructions: ~50-100 tokens
 */
export function estimateToolSchemaAndRuntimeTokens(): number {
  // Message wrapper
  const messageWrapper = 10;

  // Tool schema (rough estimate of RADAR_TOOL_DEFINITION)
  const toolSchema = 850;

  // Response formatting and runtime instructions
  const runtimeInstructions = 75;

  return messageWrapper + toolSchema + runtimeInstructions;
}

/**
 * Estimate full request token cost
 */
export function estimateFullRequestTokens(
  promptTemplate: string,
  dbStockCount: number
): number {
  const promptTokens = estimatePromptTemplateTokens(promptTemplate);
  const contextTokens = estimateDbContextTokens(dbStockCount);
  const runtimeTokens = estimateToolSchemaAndRuntimeTokens();

  return promptTokens + contextTokens + runtimeTokens;
}

/**
 * Token breakdown for UI display
 */
export interface TokenBreakdown {
  promptTemplateTokens: number;
  dbContextTokens: number;
  toolSchemaAndRuntimeTokens: number;
  estimatedFullRequestTokens: number;
  exactFullRequestTokens?: number;
}

export function calculateTokenBreakdown(
  promptTemplate: string,
  dbStockCount: number,
  exactFullRequestTokens?: number
): TokenBreakdown {
  const promptTemplateTokens = estimatePromptTemplateTokens(promptTemplate);
  const dbContextTokens = estimateDbContextTokens(dbStockCount);
  const toolSchemaAndRuntimeTokens = estimateToolSchemaAndRuntimeTokens();
  const estimatedFullRequestTokens =
    promptTemplateTokens + dbContextTokens + toolSchemaAndRuntimeTokens;

  return {
    promptTemplateTokens,
    dbContextTokens,
    toolSchemaAndRuntimeTokens,
    estimatedFullRequestTokens,
    exactFullRequestTokens,
  };
}
