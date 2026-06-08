/**
 * Claude Radar Provider Adapter — Tool Use Implementation
 * Server-side only - calls Anthropic Messages API via fetch
 * Phase 23C-2C+: Structured Tool Use output for Opportunity Radar scans
 *
 * Primary path: Claude returns tool_use block with create_radar_scan_output
 * Fallback: None (fail safely if tool_use is missing)
 */

import type { RadarScanOutput } from "@/src/types/opportunity-radar-agent";
import {
  RADAR_TOOL_NAME,
  RADAR_TOOL_DEFINITION,
} from "./radar-tool-schema";
import type { RadarDebugTraceCollector } from "./radar-debug-trace";

export interface ClaudeProviderRequest {
  prompt: string;
  trace?: RadarDebugTraceCollector;
  toolSchema?: unknown;
}

export interface ClaudeProviderResponse {
  success: boolean;
  rawText?: string;
  parsed?: RadarScanOutput;
  error?: string;
  toolUseFound?: boolean;
  metadata?: {
    model: string;
    provider: string;
    executionTimeMs?: number;
    inputTokens?: number;
    outputTokens?: number;
  };
}

function getAnthropicApiKey(): string | null {
  return process.env.ANTHROPIC_API_KEY ?? null;
}

function getRadarModel(): string {
  return process.env.ANTHROPIC_RADAR_MODEL ?? "claude-sonnet-4.6";
}

function getRadarMaxTokens(): number {
  const env = process.env.ANTHROPIC_RADAR_MAX_TOKENS;
  if (env) {
    const parsed = parseInt(env, 10);
    if (!isNaN(parsed) && parsed > 0) return parsed;
  }
  return 8192; // default: high enough for complete tool output with structured candidates
}

/**
 * Call Claude via Anthropic Messages API with Tool Use
 * Expects Claude to return tool_use block with create_radar_scan_output
 * Fails safely if tool_use is missing or tool input validation fails
 */
export async function callClaudeRadar(
  request: ClaudeProviderRequest
): Promise<ClaudeProviderResponse> {
  const apiKey = getAnthropicApiKey();
  const model = getRadarModel();
  const { trace, toolSchema } = request;

  if (!apiKey) {
    return {
      success: false,
      error:
        "Missing ANTHROPIC_API_KEY environment variable. Add it to .env to enable Claude Radar scans.",
      metadata: { model, provider: "Anthropic" },
    };
  }

  const startTime = Date.now();
  const maxTokens = getRadarMaxTokens();

  try {
    const toolChoice = {
      type: "tool",
      name: RADAR_TOOL_NAME,
    };

    if (trace) {
      trace.setRequest(
        model,
        maxTokens,
        toolChoice,
        RADAR_TOOL_NAME,
        toolSchema || RADAR_TOOL_DEFINITION,
        request.prompt
      );
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model,
        max_tokens: maxTokens,
        tools: [RADAR_TOOL_DEFINITION],
        tool_choice: toolChoice,
        messages: [
          {
            role: "user",
            content: request.prompt,
          },
        ],
      }),
    });

    const executionTimeMs = Date.now() - startTime;

    if (!response.ok) {
      const errorBody = await response.text().catch(() => "");
      const safe = errorBody.slice(0, 500);

      if (response.status === 401) {
        return {
          success: false,
          error:
            "Anthropic API key is invalid or unauthorized. Check ANTHROPIC_API_KEY.",
          metadata: { model, provider: "Anthropic", executionTimeMs },
        };
      }

      if (response.status === 429) {
        return {
          success: false,
          error:
            "Anthropic API rate limit exceeded. Try again in a few moments.",
          metadata: { model, provider: "Anthropic", executionTimeMs },
        };
      }

      if (response.status === 400) {
        return {
          success: false,
          error: `Claude model not available or rejected by provider. Check ANTHROPIC_RADAR_MODEL. Status: ${response.status}`,
          metadata: { model, provider: "Anthropic", executionTimeMs },
        };
      }

      return {
        success: false,
        error: `Anthropic API error (${response.status}). ${safe}`,
        metadata: { model, provider: "Anthropic", executionTimeMs },
      };
    }

    interface AnthropicContentBlock {
      type: string;
      text?: string;
      name?: string;
      id?: string;
      input?: unknown;
    }

    interface AnthropicMessage {
      content: AnthropicContentBlock[];
      usage?: {
        input_tokens?: number;
        output_tokens?: number;
      };
    }

    const data = (await response.json()) as AnthropicMessage;
    const anthropicData = data as unknown as Record<string, unknown>;
    const stopReason = (anthropicData.stop_reason as string) || "unknown";

    if (trace) {
      trace.setAnthropicResponse(response.status, stopReason, data.usage, data.content);
    }

    // Check for truncation by max_tokens
    if (stopReason === "max_tokens") {
      return {
        success: false,
        error: `Claude output was truncated by max_tokens (${maxTokens}). The tool output was incomplete. Increase ANTHROPIC_RADAR_MAX_TOKENS or reduce the candidate complexity in the prompt.`,
        toolUseFound: false,
        metadata: {
          model,
          provider: "Anthropic",
          executionTimeMs: Date.now() - startTime,
          inputTokens: data.usage?.input_tokens,
          outputTokens: data.usage?.output_tokens,
        },
      };
    }

    // Look for tool_use block
    const toolUseBlock = data.content?.find(
      (c) => c.type === "tool_use" && c.name === RADAR_TOOL_NAME
    );

    if (!toolUseBlock) {
      // No tool_use found - fail safely, don't try to extract text
      const textBlocks = data.content?.map((c) => c.text || "").join(" ") || "";

      if (trace) {
        trace.setToolUse(null);
      }

      return {
        success: false,
        error: `Claude did not return the required structured tool output (${RADAR_TOOL_NAME}). Response contains only text content. Ensure tool_choice is supported by your API version.`,
        rawText: textBlocks,
        toolUseFound: false,
        metadata: {
          model,
          provider: "Anthropic",
          executionTimeMs,
          inputTokens: data.usage?.input_tokens,
          outputTokens: data.usage?.output_tokens,
        },
      };
    }

    // Extract input from tool_use
    let toolInput = toolUseBlock.input;
    let parseError: string | undefined;

    // Handle case where input might be a string (some API versions)
    if (typeof toolInput === "string") {
      try {
        toolInput = JSON.parse(toolInput);
      } catch (e) {
        parseError = e instanceof Error ? e.message : "JSON parse failed";

        if (trace) {
          trace.setToolUse(toolUseBlock, undefined, parseError);
        }

        return {
          success: false,
          error: "Tool input is a string but not valid JSON.",
          toolUseFound: true,
          metadata: {
            model,
            provider: "Anthropic",
            executionTimeMs,
            inputTokens: data.usage?.input_tokens,
            outputTokens: data.usage?.output_tokens,
          },
        };
      }
    }

    if (!toolInput || typeof toolInput !== "object") {
      if (trace) {
        trace.setToolUse(toolUseBlock, toolInput);
      }

      return {
        success: false,
        error: "Tool input is missing or invalid (not an object).",
        toolUseFound: true,
        metadata: {
          model,
          provider: "Anthropic",
          executionTimeMs,
          inputTokens: data.usage?.input_tokens,
          outputTokens: data.usage?.output_tokens,
        },
      };
    }

    if (trace) {
      trace.setToolUse(toolUseBlock, toolInput);
    }

    // Safe diagnostics: log top-level keys and candidates structure
    const inputObj = toolInput as Record<string, unknown>;
    const topLevelKeys = Object.keys(inputObj);
    const hasCandidates = "candidates" in inputObj;
    const candidatesType = hasCandidates ? typeof inputObj.candidates : "missing";
    const isArray = Array.isArray(inputObj.candidates);

    // Check for alternate candidate field names
    const alternateNames = ["results", "radarCandidates", "opportunities", "researchCandidates"];
    const foundAlternates = alternateNames.filter((name) => name in inputObj);

    // Log diagnostics for debugging (will help identify shape issues)
    if (!isArray) {
      console.log("[RADAR-PROVIDER-DIAGNOSTIC]", {
        toolName: toolUseBlock.name,
        topLevelKeys,
        hasCandidates,
        candidatesType,
        isArray,
        foundAlternates,
        candidatesStructure: hasCandidates
          ? `${typeof inputObj.candidates} with ${
              Array.isArray(inputObj.candidates) ? "items" : "no array"
            }`
          : "missing",
      });
    }

    const parsed = toolInput as RadarScanOutput;

    return {
      success: true,
      parsed,
      toolUseFound: true,
      metadata: {
        model,
        provider: "Anthropic",
        executionTimeMs,
        inputTokens: data.usage?.input_tokens,
        outputTokens: data.usage?.output_tokens,
      },
    };
  } catch (error) {
    const executionTimeMs = Date.now() - startTime;
    const message =
      error instanceof Error ? error.message : "Unknown network error";

    return {
      success: false,
      error: `Provider call failed: ${message}`,
      metadata: { model, provider: "Anthropic", executionTimeMs },
    };
  }
}
