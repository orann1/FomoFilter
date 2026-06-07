/**
 * Claude Radar Provider Adapter
 * Server-side only - calls Anthropic Messages API via fetch
 * Phase 23C-2C: Real Claude integration for Opportunity Radar scans
 */

import type { RadarScanOutput } from "@/src/types/opportunity-radar-agent";

export interface ClaudeProviderRequest {
  prompt: string;
}

export interface ClaudeProviderResponse {
  success: boolean;
  rawText?: string;
  parsed?: RadarScanOutput;
  error?: string;
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

/**
 * Call Claude Sonnet 4.6 server-side via Anthropic Messages API
 * Returns raw text response and parsed JSON if valid
 */
export async function callClaudeRadar(
  request: ClaudeProviderRequest
): Promise<ClaudeProviderResponse> {
  const apiKey = getAnthropicApiKey();
  const model = getRadarModel();

  if (!apiKey) {
    return {
      success: false,
      error:
        "Missing ANTHROPIC_API_KEY environment variable. Add it to .env to enable Claude Radar scans.",
      metadata: { model, provider: "Anthropic" },
    };
  }

  const startTime = Date.now();

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model,
        max_tokens: 4096,
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

    interface AnthropicMessage {
      content: Array<{ type: string; text?: string }>;
      usage?: {
        input_tokens?: number;
        output_tokens?: number;
      };
    }

    const data = (await response.json()) as AnthropicMessage;

    const textBlock = data.content?.find((c) => c.type === "text");
    const rawText = textBlock?.text || "";

    if (!rawText) {
      return {
        success: false,
        error: "Claude returned an empty response.",
        metadata: { model, provider: "Anthropic", executionTimeMs },
      };
    }

    // Extract JSON from response (could be wrapped in markdown code blocks)
    let jsonText = rawText;
    const jsonMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonText = jsonMatch[1];
    }

    let parsed: RadarScanOutput | undefined;
    try {
      parsed = JSON.parse(jsonText) as RadarScanOutput;
    } catch {
      // JSON parse failed - return raw text for validation to handle
    }

    return {
      success: true,
      rawText,
      parsed,
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
