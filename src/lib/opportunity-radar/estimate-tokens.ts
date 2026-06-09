/**
 * Estimate prompt tokens with improved accuracy for Anthropic Claude models
 *
 * Uses a hybrid approach based on character count and word count.
 * More accurate than simple char/4 or pure word-based estimates.
 *
 * This is a local estimation and will differ from actual Anthropic API token usage.
 * Useful for UI feedback about prompt size.
 * For exact token count, use the server-side token counting endpoint.
 *
 * @param text The text to estimate tokens for
 * @returns Estimated token count
 */
export function estimatePromptTokens(text: string): number {
  if (!text || text.length === 0) {
    return 0;
  }

  // Hybrid approach:
  // 1. Use character count as base (Claude tokenizer is roughly 4.5 chars per token for markdown)
  // 2. Adjust slightly for markdown/code blocks which are typically more token-efficient

  // Character-based estimate (conservative for typical prose)
  const charEstimate = Math.ceil(text.length / 4.5);

  // Word-based secondary check
  const words = text.split(/\s+/).filter((w) => w.length > 0).length;
  const wordEstimate = Math.ceil(words * 1.25); // Conservative word multiplier

  // Use the lower of the two estimates (tends to be more accurate for markdown/structured text)
  const estimatedTokens = Math.min(charEstimate, wordEstimate);

  return Math.max(1, estimatedTokens);
}
