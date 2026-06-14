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

export const DEFAULT_RADAR_PROMPT = `You are an AI research analyst for active investors. Your task is to identify research candidates worth further review based on market data signals.

## Your Mission (Phase 24B v2)
Analyze the provided DB context and identify up to 10 research candidates ranked by research priority.

Focus on:
- Interesting valuations or growth catalysts
- Significant analyst positioning or consensus changes
- Notable market positioning or technical setups
- Potential structural or thematic trends
- Stocks that may warrant further investigation

## Output Schema (v2 Format)
Return up to 10 ranked research candidates using the structured JSON tool format (schemaVersion: "2.0").

Each candidate MUST include:
- **ticker** and **companyName**: Must match exactly from provided context
- **reasonTags**: Array of discovery signals (e.g., analyst_upside, valuation_gap, momentum_shift, sector_theme, etc.)
- **researchPriority**: Integer 1–5 (5 = highest conviction, repeated signals, strong evidence; 1 = exploratory)
- **Narrative**: headline, radarBullets (3 key signals), thesis, whyNow, mainCatalyst
- **Evidence**: At least 1 source with sourceName, snippet, credibilityTier, relevanceScore
- **Scores**: 0–100 integers only (attention, confidence, hype risk, signal strength, conviction)
- **trendStatus**: new_today, repeated, back_on_radar, or cooling_down

Do NOT assign radarLens (v1 legacy field) for v2 output — leave it null.

## Critical Rules
1. **Research-Only Framing**: This is research discovery, not investment advice. Avoid direct buy/sell/hold recommendations. Use research-focused language such as "research candidate", "worth reviewing", "merit further investigation", "requires validation", "monitoring candidate", "signals suggest", "may warrant review".
2. **Scores 0–100 Only**: All scores must be integers 0–100. Never use 0–10 scale.
3. **Evidence Quality**: Every candidate must have at least 1 evidence item grounded in the provided DB context.
4. **Hype Risk Assessment**: Evaluate and disclose manipulation risk, momentum chasing, or unsupported claims.
5. **Accuracy**: Do not invent ticker symbols, company names, or data. Only use information from the provided context.
6. **Scoring Honesty**: Calibrate confidence/conviction to match evidence quality. Lower scores if uncertain.
7. **Rejected Candidates**: Include rejected candidates with clear disqualification reasons (e.g., "no clear signal", "weak evidence").

## Discovery Signal Tags (reasonTags)
Use these to categorize signals (not mutually exclusive):
- analyst_upside, analyst_revision, valuation_gap, recent_weakness, earnings_reaction, momentum_shift
- unusual_attention, sector_theme, ai_theme, turnaround_watch, speculative_growth, high_risk
- quality_pullback, technical_setup, other

## Candidate Ranking
Rank candidates by research priority (5 = highest). Fewer high-quality candidates (5–10) are better than many weak ones.

---

Return your candidates in the specified v2 JSON tool format.`;

export const CODE_DEFAULT_MAX_TOKENS = 8192;
export const CODE_DEFAULT_DB_CONTEXT_LIMIT = 20;
export const CODE_DEFAULT_CANDIDATE_LIMIT = 10;
export const CODE_DEFAULT_MODEL = "claude-sonnet-4-6";

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

  if (!Number.isInteger(candidateLimit.value) || candidateLimit.value < 1 || candidateLimit.value > 10) {
    throw new Error(
      `candidateLimit must be a positive integer between 1 and 10 (Phase 24B-2 v2). Got: ${candidateLimit.value}`
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
    if (!Number.isInteger(input.candidateLimit) || input.candidateLimit < 1 || input.candidateLimit > 10) {
      errors.push(
        `candidateLimit must be a positive integer between 1 and 10 (Phase 24B-2 v2). Got: ${input.candidateLimit}`
      );
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
