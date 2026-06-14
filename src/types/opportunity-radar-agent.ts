/**
 * Opportunity Radar AI Agent Output Schema v1
 * Defines the structure of the AI agent's scan result output.
 * These types are used for validation and persistence into the database.
 */

export type RadarScanOutput = {
  // Schema metadata
  schemaVersion: string;
  scanDate: string;
  timeWindow: string;
  // Phase 24B: optional scan period and label
  scanPeriodStart?: string;
  scanPeriodEnd?: string;
  scanLabel?: string;

  // Provider metadata
  providerMetadata: {
    provider: string;
    model: string;
    actualThinkingEffort?: string;
    promptDeclaredThinkingEffort?: string;
    searchEnabled: boolean;
    sourceMode: string;
    notes?: string;
  };

  // Summary
  summary: {
    headline: string;
    candidateCount: number;
    rejectedCount: number;
    topTheme: string;
  };

  // Main results
  candidates: RadarCandidateOutput[];
  rejectedCandidates: RejectedCandidateOutput[];

  // Agent self-check
  agentSelfCheck: {
    jsonValid: boolean;
    noBuySellLanguage: boolean;
    allCandidatesHaveEvidence: boolean;
    allScoresUseZeroToHundred: boolean;
    uncertaintyDisclosed: boolean;
    possibleWeaknesses: string[];
  };
};

export type RadarCandidateOutput = {
  // Identification
  ticker: string;
  companyName: string;

  // Radar lens (v1, optional for backward compatibility)
  radarLens?: "attention_spike" | "overreaction" | "value_gap" | "future_theme" | null;
  detailedCategory?: string | null;

  // Phase 24B: Discovery signals (v2)
  reasonTags?: (
    | "analyst_upside"
    | "analyst_revision"
    | "valuation_gap"
    | "recent_weakness"
    | "earnings_reaction"
    | "momentum_shift"
    | "unusual_attention"
    | "sector_theme"
    | "ai_theme"
    | "turnaround_watch"
    | "speculative_growth"
    | "high_risk"
    | "quality_pullback"
    | "technical_setup"
    | "other"
  )[];
  researchPriority?: number; // 1-5, where 5 is highest

  // Narrative
  headline: string;
  radarBullets: string[];
  thesis: string;
  whyNow: string;
  mainCatalyst: string;

  // Review guidance
  whatLooksInteresting: string[];
  keyConcerns: string[];
  nextCheck: string;

  // Evidence
  sourceEvidence: {
    sourceName: string;
    sourceType: string;
    url?: string | null;
    title?: string | null;
    publishedAt?: string | null;
    snippet: string;
    credibilityTier: "primary" | "secondary" | "tertiary" | "experimental";
    relevanceScore: number;
  }[];

  // Radar scoring (agent assessment)
  attentionScore: number;
  confidenceScore: number;
  hypeRiskScore: number;

  // Aggregate radar signals
  radarSignalStrength: number;
  radarConvictionScore: number;
  sourceQualityScore: number;
  manipulationRiskScore: number;

  // Trend context
  trendStatus: "new_today" | "repeated" | "back_on_radar" | "cooling_down";
  appearancesLast7Days?: number;
  appearancesLast30Days?: number;

  // Tags
  tags: string[];

  // Optional rejection
  disqualifiedReason?: string;
};

export type RejectedCandidateOutput = {
  ticker: string;
  companyName?: string;
  reason: string;
  evidenceSummary?: string;
};

/**
 * Validated version of RadarScanOutput - stricter typing after validation
 */
export type ValidatedRadarScanOutput = RadarScanOutput;
