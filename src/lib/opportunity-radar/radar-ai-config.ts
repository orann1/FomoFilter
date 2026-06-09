import { prisma } from "@/src/lib/db/prisma";

export type EffectiveRadarConfig = {
  promptTemplate: string;
  promptSource: "db" | "env" | "code_default";
  maxTokens: number;
  maxTokensSource: "db" | "env" | "code_default";
  dbContextLimit: number;
  dbContextLimitSource: "db" | "env" | "code_default";
  candidateLimit: number;
  candidateLimitSource: "db" | "env" | "code_default";
  debugTraceEnabled: boolean;
  debugTraceEnabledSource: "db" | "env" | "code_default";
  model: string;
  modelSource: "db" | "env" | "code_default";
  promptVersion: string;
  schemaVersion: string;
  configId?: string;
};

export const DEFAULT_RADAR_PROMPT = `You are an AI research analyst for active investors. Your role is to identify and explain potential research candidates based on available market data.

## Your Mission
Analyze active US stocks and identify those worth further research. Focus on:
- Interesting valuations or growth catalysts
- Significant analyst positioning or consensus changes
- Notable market positioning or technical setups
- Potential structural or thematic trends

## Output Requirements
You must return structured candidates in the specified JSON tool format.
Each candidate needs:
- Ticker and company name
- One of four categorization lenses: Attention Spike, Overreaction, Value Gap, or Future Theme
- Detailed thesis explaining why it's worth research
- Evidence citations with credibility assessment
- Radar scores (0-100 scale) for attention, confidence, and hype risk
- Next steps for manual validation

## Critical Rules
1. **No Buy/Sell Recommendations**: This is research discovery, not investment advice.
2. **Evidence Quality**: Every candidate must have at least 2 credible sources citing specific catalysts or data points.
3. **Hype Risk Assessment**: Evaluate and disclose manipulation risk, momentum chasing, or unsupported claims.
4. **Caution on FOMO Language**: Avoid language that sounds like financial advice or pressure.
5. **Scoring Honesty**: If you're uncertain about a candidate, reflect that in lower confidence/higher hype-risk scores.
6. **Analyst Context**: Use analyst target/upside data only as context about market consensus — not as validation of your thesis.

## Candidate Scoring Guide
- **Attention Score (0-100)**: How much attention or momentum does this signal deserve in market research?
- **Confidence Score (0-100)**: How confident are you in this candidate's fundamentals and thesis validity?
- **Hype Risk Score (0-100)**: How much risk of hype/manipulation/unsupported claims is present?
- **Signal Strength (0-100)**: How strong is the underlying evidence for this candidate?
- **Conviction Score (0-100)**: How likely is this candidate to remain relevant in 30 days?

---

You will be provided a list of active US stocks to analyze. For each candidate you identify:
1. Explain the research signal
2. Cite specific evidence with credibility assessment
3. Return structured JSON output with required fields
4. Avoid double-counting: don't repeat evidence or duplicate candidates across lenses

Return your candidates in the specified JSON tool format.`;

export const CODE_DEFAULT_MAX_TOKENS = 8192;
export const CODE_DEFAULT_DB_CONTEXT_LIMIT = 20;
export const CODE_DEFAULT_CANDIDATE_LIMIT = 10;
export const CODE_DEFAULT_MODEL = "claude-sonnet-4.6";

/**
 * Load effective Radar AI config with fallback chain:
 * 1. Active DB config (if exists)
 * 2. Environment variables (if set)
 * 3. Code defaults
 */
export async function loadEffectiveRadarConfig(): Promise<EffectiveRadarConfig> {
  // Step 1: Load active DB config if exists
  const activeDbConfig = await prisma.radarAiConfig.findFirst({
    where: { isActive: true },
    orderBy: { createdAt: "desc" },
  });

  // Step 2: Build effective config with source tracking
  const promptTemplate = activeDbConfig?.promptTemplate
    ? { value: activeDbConfig.promptTemplate, source: "db" as const }
    : process.env.RADAR_PROMPT
      ? { value: process.env.RADAR_PROMPT, source: "env" as const }
      : { value: DEFAULT_RADAR_PROMPT, source: "code_default" as const };

  const maxTokens = activeDbConfig?.maxTokens
    ? { value: activeDbConfig.maxTokens, source: "db" as const }
    : process.env.ANTHROPIC_RADAR_MAX_TOKENS
      ? { value: parseInt(process.env.ANTHROPIC_RADAR_MAX_TOKENS, 10), source: "env" as const }
      : { value: CODE_DEFAULT_MAX_TOKENS, source: "code_default" as const };

  const dbContextLimit = activeDbConfig?.dbContextLimit
    ? { value: activeDbConfig.dbContextLimit, source: "db" as const }
    : process.env.RADAR_DB_CONTEXT_LIMIT
      ? { value: parseInt(process.env.RADAR_DB_CONTEXT_LIMIT, 10), source: "env" as const }
      : { value: CODE_DEFAULT_DB_CONTEXT_LIMIT, source: "code_default" as const };

  const candidateLimit = activeDbConfig?.candidateLimit
    ? { value: activeDbConfig.candidateLimit, source: "db" as const }
    : process.env.RADAR_CANDIDATE_LIMIT
      ? { value: parseInt(process.env.RADAR_CANDIDATE_LIMIT, 10), source: "env" as const }
      : { value: CODE_DEFAULT_CANDIDATE_LIMIT, source: "code_default" as const };

  const debugTraceEnabled = activeDbConfig?.debugTraceEnabled
    ? { value: activeDbConfig.debugTraceEnabled, source: "db" as const }
    : process.env.RADAR_DEBUG_AI_TRACE === "true"
      ? { value: true, source: "env" as const }
      : { value: false, source: "code_default" as const };

  const model = activeDbConfig?.model
    ? { value: activeDbConfig.model, source: "db" as const }
    : process.env.ANTHROPIC_RADAR_MODEL
      ? { value: process.env.ANTHROPIC_RADAR_MODEL, source: "env" as const }
      : { value: CODE_DEFAULT_MODEL, source: "code_default" as const };

  // Step 3: Validate promptTemplate
  if (promptTemplate.value.length < 200) {
    throw new Error(
      `Prompt template must be at least 200 characters. Current length: ${promptTemplate.value.length}`
    );
  }

  // Step 4: Validate numeric values
  if (!Number.isInteger(maxTokens.value) || maxTokens.value < 2000 || maxTokens.value > 50000) {
    throw new Error(
      `maxTokens must be a positive integer between 2000 and 50000. Got: ${maxTokens.value}`
    );
  }

  if (!Number.isInteger(dbContextLimit.value) || dbContextLimit.value < 1 || dbContextLimit.value > 100) {
    throw new Error(
      `dbContextLimit must be a positive integer between 1 and 100. Got: ${dbContextLimit.value}`
    );
  }

  if (!Number.isInteger(candidateLimit.value) || candidateLimit.value < 1 || candidateLimit.value > 20) {
    throw new Error(
      `candidateLimit must be a positive integer between 1 and 20. Got: ${candidateLimit.value}`
    );
  }

  return {
    promptTemplate: promptTemplate.value,
    promptSource: promptTemplate.source,
    maxTokens: maxTokens.value,
    maxTokensSource: maxTokens.source,
    dbContextLimit: dbContextLimit.value,
    dbContextLimitSource: dbContextLimit.source,
    candidateLimit: candidateLimit.value,
    candidateLimitSource: candidateLimit.source,
    debugTraceEnabled: debugTraceEnabled.value,
    debugTraceEnabledSource: debugTraceEnabled.source,
    model: model.value,
    modelSource: model.source,
    promptVersion: activeDbConfig?.promptVersion || "opportunity-radar-v1",
    schemaVersion: activeDbConfig?.schemaVersion || "candidate-output-v1",
    configId: activeDbConfig?.id,
  };
}

/**
 * Validate config values before saving
 */
export function validateRadarConfigInput(input: {
  promptTemplate?: string;
  maxTokens?: number;
  dbContextLimit?: number;
  candidateLimit?: number;
}): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (input.promptTemplate !== undefined) {
    if (input.promptTemplate.length < 200) {
      errors.push(
        `Prompt template must be at least 200 characters. Current length: ${input.promptTemplate.length}`
      );
    }
  }

  if (input.maxTokens !== undefined) {
    if (!Number.isInteger(input.maxTokens) || input.maxTokens < 2000 || input.maxTokens > 50000) {
      errors.push(
        `maxTokens must be a positive integer between 2000 and 50000. Got: ${input.maxTokens}`
      );
    }
  }

  if (input.dbContextLimit !== undefined) {
    if (!Number.isInteger(input.dbContextLimit) || input.dbContextLimit < 1 || input.dbContextLimit > 100) {
      errors.push(
        `dbContextLimit must be a positive integer between 1 and 100. Got: ${input.dbContextLimit}`
      );
    }
  }

  if (input.candidateLimit !== undefined) {
    if (!Number.isInteger(input.candidateLimit) || input.candidateLimit < 1 || input.candidateLimit > 20) {
      errors.push(
        `candidateLimit must be a positive integer between 1 and 20. Got: ${input.candidateLimit}`
      );
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
