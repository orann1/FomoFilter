"use server";

/**
 * Server-side token counting using Anthropic's token counting capability
 * Phase 24A-2: Token accounting for prompt, context, and full requests
 */

import { RADAR_TOOL_DEFINITION } from "@/src/lib/opportunity-radar/radar-tool-schema";
import { loadStockContext } from "@/src/lib/opportunity-radar/build-radar-prompt";

export type TokenCountResult = {
  success: boolean;
  inputTokens?: number;
  cacheCreationInputTokens?: number;
  cacheReadInputTokens?: number;
  error?: string;
};

/**
 * Get exact token count for a prompt using Anthropic's API
 * Uses the token counting endpoint (no inference, no cost beyond API call)
 *
 * @param promptText The prompt text to count tokens for
 * @returns Token count result with inputTokens or error
 */
export async function getExactTokenCountAction(
  promptText: string
): Promise<TokenCountResult> {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      return {
        success: false,
        error: "Exact token count requires ANTHROPIC_API_KEY environment variable.",
      };
    }

    if (!promptText || promptText.length === 0) {
      return {
        success: true,
        inputTokens: 0,
      };
    }

    // Use Anthropic's token counting endpoint via fetch
    // The endpoint is: POST /v1/messages/count_tokens
    const response = await fetch("https://api.anthropic.com/v1/messages/count_tokens", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-20241022",
        messages: [
          {
            role: "user",
            content: promptText,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Token counting API error:", response.status, errorText);

      return {
        success: false,
        error: `Token counting failed (HTTP ${response.status}). Verify API key and retry.`,
      };
    }

    const data = await response.json() as {
      input_tokens?: number;
      cache_creation_input_tokens?: number;
      cache_read_input_tokens?: number;
    };

    return {
      success: true,
      inputTokens: data.input_tokens || 0,
      cacheCreationInputTokens: data.cache_creation_input_tokens,
      cacheReadInputTokens: data.cache_read_input_tokens,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return {
      success: false,
      error: `Token counting failed: ${message}`,
    };
  }
}

/**
 * Get exact full request token count including prompt, context, and tool schema
 * This builds the actual message structure that Claude Scan would use
 *
 * @param promptTemplate The editable prompt template
 * @param model The Claude model to use
 * @param dbContextLimit How many stocks to include in context
 * @returns Token count result with full request inputTokens or error
 */
export async function getExactFullRequestTokenCountAction(
  promptTemplate: string,
  model: string,
  dbContextLimit: number
): Promise<TokenCountResult> {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      return {
        success: false,
        error: "Exact token count requires ANTHROPIC_API_KEY environment variable.",
      };
    }

    // Load actual DB context (stocks) to get realistic token count
    const stocks = await loadStockContext(dbContextLimit);

    // Build the context block similar to buildRadarPrompt
    const contextBlock = stocks
      .map((stock) => {
        const price = stock.currentPrice ? `$${stock.currentPrice.toFixed(2)}` : "N/A";
        const change = stock.priceChange !== null && stock.priceChange !== undefined ? `${stock.priceChange > 0 ? "+" : ""}${stock.priceChange.toFixed(2)}%` : "N/A";
        return `${stock.symbol} (${stock.name}): Price ${price}, Change ${change}`;
      })
      .join("\n");

    // Build the full prompt similar to Claude Scan
    const fullPrompt = `${promptTemplate}

## Current Market Data

${contextBlock}`;

    // Call token counting with the full message structure
    const response = await fetch("https://api.anthropic.com/v1/messages/count_tokens", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        system: [
          {
            type: "text",
            text: "You are an AI research analyst.",
          },
        ],
        tools: [RADAR_TOOL_DEFINITION],
        messages: [
          {
            role: "user",
            content: fullPrompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Token counting API error:", response.status, errorText);

      return {
        success: false,
        error: `Token counting failed (HTTP ${response.status}). Verify API key and retry.`,
      };
    }

    const data = await response.json() as {
      input_tokens?: number;
      cache_creation_input_tokens?: number;
      cache_read_input_tokens?: number;
    };

    return {
      success: true,
      inputTokens: data.input_tokens || 0,
      cacheCreationInputTokens: data.cache_creation_input_tokens,
      cacheReadInputTokens: data.cache_read_input_tokens,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return {
      success: false,
      error: `Token counting failed: ${message}`,
    };
  }
}
