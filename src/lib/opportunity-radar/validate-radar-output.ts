import type {
  RadarScanOutput,
  RadarCandidateOutput,
  ValidatedRadarScanOutput,
} from "@/src/types/opportunity-radar-agent";

export type ValidationResult<T> = {
  success: boolean;
  data?: T;
  errors: string[];
  warnings: string[];
};

const PROHIBITED_PHRASES = [
  "buy",
  "sell",
  "strong buy",
  "guaranteed",
  "safe investment",
  "will go up",
  "best stock to buy",
  "underperform",
  "outperform",
];

const VALID_RADAR_LENSES = [
  "attention_spike",
  "overreaction",
  "value_gap",
  "future_theme",
];

const VALID_TREND_STATUSES = [
  "new_today",
  "repeated",
  "back_on_radar",
  "cooling_down",
];

const VALID_CREDIBILITY_TIERS = [
  "primary",
  "secondary",
  "tertiary",
  "experimental",
];

/**
 * Scan text for prohibited financial language
 */
function findProhibitedLanguage(text: string): string[] {
  const found: string[] = [];
  const lowerText = text.toLowerCase();

  for (const phrase of PROHIBITED_PHRASES) {
    if (lowerText.includes(phrase.toLowerCase())) {
      found.push(phrase);
    }
  }

  return found;
}

/**
 * Check if a score looks like 0-10 scale when it should be 0-100
 */
function detectZeroToTenScale(
  scores: Record<string, number>
): { isLikelyZeroToTen: boolean; affectedFields: string[] } {
  const zeroToTenFields: string[] = [];

  for (const [key, value] of Object.entries(scores)) {
    // If most/all non-zero scores are <= 10, likely 0-10 scale
    if (typeof value === "number" && value > 0 && value <= 10) {
      zeroToTenFields.push(key);
    }
  }

  // If we have multiple fields < 10, likely 0-10 scale
  const isLikelyZeroToTen = zeroToTenFields.length >= 2;

  return { isLikelyZeroToTen, affectedFields: zeroToTenFields };
}

/**
 * Validate a single candidate
 */
function validateCandidate(
  candidate: unknown,
  index: number
): { valid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (typeof candidate !== "object" || candidate === null) {
    return {
      valid: false,
      errors: [`Candidate ${index}: not an object`],
      warnings: [],
    };
  }

  const c = candidate as Record<string, unknown>;

  // Required fields
  if (typeof c.ticker !== "string" || c.ticker.trim() === "") {
    errors.push(`Candidate ${index}: ticker must be a non-empty string`);
  }

  if (typeof c.companyName !== "string" || c.companyName.trim() === "") {
    errors.push(
      `Candidate ${index}: companyName must be a non-empty string`
    );
  }

  // Radar lens
  if (!VALID_RADAR_LENSES.includes(c.radarLens as string)) {
    errors.push(
      `Candidate ${index}: radarLens must be one of ${VALID_RADAR_LENSES.join(", ")}`
    );
  }

  // Trend status
  if (!VALID_TREND_STATUSES.includes(c.trendStatus as string)) {
    errors.push(
      `Candidate ${index}: trendStatus must be one of ${VALID_TREND_STATUSES.join(", ")}`
    );
  }

  // Scores validation
  const scores: Record<string, number> = {
    attentionScore: c.attentionScore as number,
    confidenceScore: c.confidenceScore as number,
    hypeRiskScore: c.hypeRiskScore as number,
    radarSignalStrength: c.radarSignalStrength as number,
    radarConvictionScore: c.radarConvictionScore as number,
    sourceQualityScore: c.sourceQualityScore as number,
    manipulationRiskScore: c.manipulationRiskScore as number,
  };

  for (const [key, value] of Object.entries(scores)) {
    if (typeof value !== "number") {
      errors.push(`Candidate ${index}: ${key} must be a number`);
    } else if (!Number.isInteger(value)) {
      errors.push(`Candidate ${index}: ${key} must be an integer (got ${value})`);
    } else if (value < 0 || value > 100) {
      errors.push(`Candidate ${index}: ${key} must be 0-100 (got ${value})`);
    }
  }

  // Check for 0-10 scale
  const { isLikelyZeroToTen, affectedFields } = detectZeroToTenScale(scores);
  if (isLikelyZeroToTen) {
    errors.push(
      `Candidate ${index}: scores appear to use 0-10 scale (fields: ${affectedFields.join(", ")}), but 0-100 is required`
    );
  }

  // Evidence validation
  const evidence = c.sourceEvidence as unknown[];
  if (
    !Array.isArray(evidence) ||
    evidence.length === 0
  ) {
    errors.push(
      `Candidate ${index}: must have at least one evidence item in sourceEvidence`
    );
  } else {
    evidence.forEach((ev, evIndex) => {
      if (typeof ev !== "object" || ev === null) {
        errors.push(
          `Candidate ${index}: evidence ${evIndex} is not an object`
        );
        return;
      }

      const e = ev as Record<string, unknown>;

      if (typeof e.sourceName !== "string" || !e.sourceName.toString().trim()) {
        errors.push(
          `Candidate ${index}: evidence ${evIndex} sourceName must be non-empty`
        );
      }

      if (typeof e.snippet !== "string" || !e.snippet.toString().trim()) {
        errors.push(
          `Candidate ${index}: evidence ${evIndex} snippet must be non-empty`
        );
      }

      if (!VALID_CREDIBILITY_TIERS.includes(e.credibilityTier as string)) {
        errors.push(
          `Candidate ${index}: evidence ${evIndex} credibilityTier must be one of ${VALID_CREDIBILITY_TIERS.join(", ")}`
        );
      }

      const relevanceScore = e.relevanceScore as number;
      if (typeof relevanceScore !== "number") {
        errors.push(
          `Candidate ${index}: evidence ${evIndex} relevanceScore must be a number`
        );
      } else if (!Number.isInteger(relevanceScore)) {
        errors.push(
          `Candidate ${index}: evidence ${evIndex} relevanceScore must be an integer`
        );
      } else if (relevanceScore < 0 || relevanceScore > 100) {
        errors.push(
          `Candidate ${index}: evidence ${evIndex} relevanceScore must be 0-100`
        );
      }

      if (!e.url) {
        warnings.push(
          `Candidate ${index}: evidence ${evIndex} has no URL, may reduce credibility`
        );
      }
    });
  }

  // Prohibited language check
  const textFieldsToCheck = {
    headline: c.headline as string,
    thesis: c.thesis as string,
    whyNow: c.whyNow as string,
    mainCatalyst: c.mainCatalyst as string,
  };

  for (const [fieldName, text] of Object.entries(textFieldsToCheck)) {
    if (typeof text === "string") {
      const prohibited = findProhibitedLanguage(text);
      if (prohibited.length > 0) {
        errors.push(
          `Candidate ${index}: ${fieldName} contains prohibited language: ${prohibited.join(", ")}`
        );
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Main validation function for Radar scan output
 */
export function validateRadarScanOutput(
  raw: unknown
): ValidationResult<ValidatedRadarScanOutput> {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Must be an object
  if (typeof raw !== "object" || raw === null) {
    return {
      success: false,
      errors: ["Output must be an object"],
      warnings: [],
    };
  }

  const output = raw as Record<string, unknown>;

  // Schema version
  if (output.schemaVersion !== "1.0") {
    errors.push(
      `schemaVersion must be "1.0" (got "${output.schemaVersion}")`
    );
  }

  // Candidates must be an array
  if (!Array.isArray(output.candidates)) {
    errors.push("candidates must be an array");
  } else {
    const candidates = output.candidates as unknown[];

    // Max 10 candidates
    if (candidates.length > 10) {
      errors.push(`candidates array has ${candidates.length} items, max 10`);
    }

    // Validate each candidate
    for (let i = 0; i < candidates.length; i++) {
      const { valid, errors: candErrors, warnings: candWarnings } =
        validateCandidate(candidates[i], i);

      if (!valid) {
        errors.push(...candErrors);
      }
      warnings.push(...candWarnings);
    }
  }

  // Rejected candidates (if present)
  if (
    output.rejectedCandidates &&
    !Array.isArray(output.rejectedCandidates)
  ) {
    errors.push("rejectedCandidates must be an array if present");
  }

  // Provider metadata
  const pm = output.providerMetadata as Record<string, unknown>;
  if (typeof pm?.provider !== "string" || !pm.provider) {
    errors.push("providerMetadata.provider must be a non-empty string");
  }
  if (typeof pm?.model !== "string" || !pm.model) {
    errors.push("providerMetadata.model must be a non-empty string");
  }
  if (typeof pm?.searchEnabled !== "boolean") {
    errors.push("providerMetadata.searchEnabled must be a boolean");
  }

  // Agent self-check (if present)
  const asc = output.agentSelfCheck as Record<string, unknown>;
  if (asc) {
    if (typeof asc.jsonValid !== "boolean") {
      warnings.push("agentSelfCheck.jsonValid should be a boolean");
    }
    if (typeof asc.noBuySellLanguage !== "boolean") {
      warnings.push("agentSelfCheck.noBuySellLanguage should be a boolean");
    }
    if (typeof asc.allCandidatesHaveEvidence !== "boolean") {
      warnings.push("agentSelfCheck.allCandidatesHaveEvidence should be a boolean");
    }
    if (typeof asc.allScoresUseZeroToHundred !== "boolean") {
      warnings.push("agentSelfCheck.allScoresUseZeroToHundred should be a boolean");
    }
  }

  const success = errors.length === 0;

  if (success) {
    return {
      success: true,
      data: output as ValidatedRadarScanOutput,
      errors,
      warnings,
    };
  }

  return {
    success: false,
    errors,
    warnings,
  };
}
