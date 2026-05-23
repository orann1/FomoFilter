export const SCORE_VERSION = "fundamental-v1";

export type FundamentalScoreInput = {
  // Growth
  revenueGrowthTTMYoy: number | null;
  epsGrowthTTMYoy: number | null;
  revenueGrowth3Y: number | null;
  epsGrowth3Y: number | null;
  // Profitability
  grossMarginTTM: number | null;
  operatingMarginTTM: number | null;
  netProfitMarginTTM: number | null;
  roeTTM: number | null;
  roaTTM: number | null;
  // Financial Health
  totalDebtToEquityAnnual: number | null;
  currentRatioAnnual: number | null;
  quickRatioAnnual: number | null;
  netInterestCoverageAnnual: number | null;
  // Valuation
  peBasicExclExtraTTM: number | null;
  forwardPE: number | null;
  pegTTM: number | null;
  forwardPEG: number | null;
  psTTM: number | null;
  evEbitdaTTM: number | null;
  // Risk / Context
  beta: number | null;
  marketCapitalization: number | null;
};

export type FundamentalScoreOutput = {
  fundamentalScore: number;
  growthScore: number;
  profitabilityScore: number;
  valuationScore: number;
  financialHealthScore: number;
  riskContextScore: number | null;
  scoreVersion: string;
};

// ── Metric scoring helpers ────────────────────────────────────────────────────

function scoreGrowthPct(pct: number | null): number | null {
  if (pct == null) return null;
  if (pct >= 25) return 10;
  if (pct >= 15) return 8;
  if (pct >= 8) return 6;
  if (pct >= 0) return 4;
  return 1;
}

function scoreMarginPct(pct: number | null): number | null {
  if (pct == null) return null;
  if (pct >= 30) return 10;
  if (pct >= 20) return 8;
  if (pct >= 12) return 6;
  if (pct >= 5) return 4;
  if (pct >= 0) return 2;
  return 0;
}

function scoreOperatingMarginPct(pct: number | null): number | null {
  if (pct == null) return null;
  if (pct >= 25) return 10;
  if (pct >= 15) return 8;
  if (pct >= 8) return 6;
  if (pct >= 0) return 3;
  return 0;
}

function scoreNetMarginPct(pct: number | null): number | null {
  if (pct == null) return null;
  if (pct >= 20) return 10;
  if (pct >= 12) return 8;
  if (pct >= 6) return 6;
  if (pct >= 0) return 3;
  return 0;
}

function scoreROE(roe: number | null): number | null {
  if (roe == null) return null;
  const capped = Math.min(roe, 60);
  if (capped >= 30) return 10;
  if (capped >= 20) return 8;
  if (capped >= 12) return 6;
  if (capped >= 5) return 3;
  if (capped >= 0) return 1;
  return 0;
}

function scoreROA(roa: number | null): number | null {
  if (roa == null) return null;
  if (roa >= 15) return 10;
  if (roa >= 10) return 8;
  if (roa >= 6) return 6;
  if (roa >= 3) return 4;
  if (roa >= 0) return 2;
  return 0;
}

function scoreDebtToEquity(de: number | null): number | null {
  if (de == null) return null;
  if (de < 0) return 5; // negative equity — unusual, don't score high or low
  if (de <= 0.5) return 10;
  if (de <= 1.0) return 8;
  if (de <= 2.0) return 5;
  if (de <= 4.0) return 2;
  return 0;
}

function scoreCurrentRatio(cr: number | null): number | null {
  if (cr == null) return null;
  if (cr >= 1.5 && cr <= 3.0) return 10;
  if (cr >= 1.0 && cr < 1.5) return 7;
  if (cr > 3.0 && cr <= 5.0) return 6;
  if (cr >= 0.7 && cr < 1.0) return 3;
  if (cr > 5.0) return 5;
  return 0; // < 0.7
}

function scoreQuickRatio(qr: number | null): number | null {
  if (qr == null) return null;
  if (qr >= 1.5) return 10;
  if (qr >= 1.0) return 8;
  if (qr >= 0.7) return 5;
  if (qr >= 0.5) return 3;
  return 0;
}

function scoreInterestCoverage(ic: number | null): number | null {
  if (ic == null) return null;
  const capped = Math.min(ic, 30);
  if (ic < 0) return 0;
  if (capped >= 20) return 10;
  if (capped >= 10) return 8;
  if (capped >= 5) return 6;
  if (capped >= 2) return 3;
  if (capped >= 1) return 1;
  return 0;
}

function scorePE(pe: number | null): number | null {
  if (pe == null) return null;
  if (pe <= 0) return null; // negative earnings — skip
  if (pe >= 5 && pe <= 15) return 9;
  if (pe > 15 && pe <= 25) return 8;
  if (pe > 25 && pe <= 35) return 6;
  if (pe > 35 && pe <= 50) return 4;
  if (pe > 50 && pe <= 80) return 2;
  if (pe < 5) return 5; // suspiciously low — avoid over-rewarding
  return 1; // > 80
}

function scorePEG(peg: number | null): number | null {
  if (peg == null) return null;
  if (peg <= 0) return null; // negative PEG — skip
  if (peg <= 0.5) return 9; // suspiciously low — avoid max score
  if (peg <= 1.0) return 10;
  if (peg <= 1.5) return 8;
  if (peg <= 2.0) return 6;
  if (peg <= 3.0) return 3;
  return 1;
}

function scorePS(ps: number | null): number | null {
  if (ps == null) return null;
  if (ps <= 0) return null;
  if (ps <= 1) return 10;
  if (ps <= 3) return 8;
  if (ps <= 6) return 6;
  if (ps <= 10) return 4;
  if (ps <= 20) return 2;
  return 1;
}

function scoreEVEBITDA(ev: number | null): number | null {
  if (ev == null) return null;
  if (ev <= 0) return null;
  if (ev <= 8) return 9; // very low — avoid max
  if (ev <= 12) return 10;
  if (ev <= 18) return 8;
  if (ev <= 25) return 6;
  if (ev <= 35) return 3;
  return 1;
}

function scoreBeta(beta: number | null): number | null {
  if (beta == null) return null;
  if (beta >= 0.8 && beta <= 1.4) return 10;
  if (beta >= 0.5 && beta < 0.8) return 8;
  if (beta > 1.4 && beta <= 1.8) return 6;
  if (beta > 1.8 && beta <= 2.5) return 3;
  if (beta > 2.5) return 1;
  return 6; // < 0.5 (very low volatility — decent)
}

function scoreMarketCap(mcap: number | null): number | null {
  if (mcap == null) return null;
  const billions = mcap / 1e9;
  if (billions >= 100) return 10;
  if (billions >= 50) return 8;
  if (billions >= 20) return 6;
  if (billions >= 5) return 4;
  if (billions >= 1) return 2;
  return 1;
}

// ── Category average (null-safe, excludes missing metrics) ───────────────────

function categoryAverage(scores: Array<number | null>): number | null {
  const valid = scores.filter((s): s is number => s !== null);
  if (valid.length === 0) return null;
  return valid.reduce((a, b) => a + b, 0) / valid.length;
}

// ── Main calculation ──────────────────────────────────────────────────────────

export function calculateFundamentalScore(input: FundamentalScoreInput): FundamentalScoreOutput | null {
  // Category 1: Growth (30%)
  const growthMetrics = [
    scoreGrowthPct(input.revenueGrowthTTMYoy),
    scoreGrowthPct(input.epsGrowthTTMYoy),
    scoreGrowthPct(input.revenueGrowth3Y),
    scoreGrowthPct(input.epsGrowth3Y),
  ];
  const growthAvg = categoryAverage(growthMetrics);

  // Category 2: Profitability (30%)
  const profitabilityMetrics = [
    scoreMarginPct(input.grossMarginTTM),
    scoreOperatingMarginPct(input.operatingMarginTTM),
    scoreNetMarginPct(input.netProfitMarginTTM),
    scoreROE(input.roeTTM),
    scoreROA(input.roaTTM),
  ];
  const profitabilityAvg = categoryAverage(profitabilityMetrics);

  // Category 3: Financial Health (15%)
  const healthMetrics = [
    scoreDebtToEquity(input.totalDebtToEquityAnnual),
    scoreCurrentRatio(input.currentRatioAnnual),
    scoreQuickRatio(input.quickRatioAnnual),
    scoreInterestCoverage(input.netInterestCoverageAnnual),
  ];
  const healthAvg = categoryAverage(healthMetrics);

  // Category 4: Valuation (20%)
  const valuationMetrics = [
    scorePE(input.peBasicExclExtraTTM),
    scorePE(input.forwardPE),
    scorePEG(input.pegTTM),
    scorePEG(input.forwardPEG),
    scorePS(input.psTTM),
    scoreEVEBITDA(input.evEbitdaTTM),
  ];
  const valuationAvg = categoryAverage(valuationMetrics);

  // Category 5: Risk / Context (5%)
  const riskMetrics = [
    scoreBeta(input.beta),
    scoreMarketCap(input.marketCapitalization),
  ];
  const riskAvg = categoryAverage(riskMetrics);

  // All of the 4 main categories (95% weight) must produce a score
  if (growthAvg === null && profitabilityAvg === null && healthAvg === null && valuationAvg === null) {
    return null;
  }

  // Convert 0–10 metric averages to 0–100 category scores
  const growthScore = growthAvg !== null ? Math.round(growthAvg * 10) : null;
  const profitabilityScore = profitabilityAvg !== null ? Math.round(profitabilityAvg * 10) : null;
  const financialHealthScore = healthAvg !== null ? Math.round(healthAvg * 10) : null;
  const valuationScore = valuationAvg !== null ? Math.round(valuationAvg * 10) : null;
  const riskContextScore = riskAvg !== null ? Math.round(riskAvg * 10) : null;

  // Weighted average — re-normalize if some categories are null
  const WEIGHTS: Array<{ score: number | null; weight: number }> = [
    { score: growthScore, weight: 0.30 },
    { score: profitabilityScore, weight: 0.30 },
    { score: valuationScore, weight: 0.20 },
    { score: financialHealthScore, weight: 0.15 },
    { score: riskContextScore, weight: 0.05 },
  ];

  let weightedSum = 0;
  let totalWeight = 0;
  for (const { score, weight } of WEIGHTS) {
    if (score !== null) {
      weightedSum += score * weight;
      totalWeight += weight;
    }
  }

  if (totalWeight === 0) return null;

  const fundamentalScore = Math.round(weightedSum / totalWeight);

  return {
    fundamentalScore,
    growthScore: growthScore ?? 0,
    profitabilityScore: profitabilityScore ?? 0,
    valuationScore: valuationScore ?? 0,
    financialHealthScore: financialHealthScore ?? 0,
    riskContextScore: riskContextScore,
    scoreVersion: SCORE_VERSION,
  };
}
