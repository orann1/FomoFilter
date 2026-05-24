export const OPPORTUNITY_SCORE_VERSION = "opportunity-v1";

export type OpportunityScoreInput = {
  fundamentalScore: number | null;
  valuationScore: number | null;
  growthScore: number | null;
  riskContextScore: number | null;
  price: number | null;
  week52High: number | null;
  week52Low: number | null;
};

export type OpportunityScoreOutput = {
  opportunityScore: number;
  opportunityScoreVersion: string;
};

function scorePricePosition(
  price: number | null,
  week52High: number | null,
  week52Low: number | null
): number | null {
  if (price == null || week52High == null || week52Low == null) return null;
  const range = week52High - week52Low;
  if (range <= 0) return null;
  const position = (price - week52Low) / range;
  if (position >= 0.20 && position <= 0.60) return 100;
  if (position > 0.60 && position <= 0.80) return 75;
  if (position > 0.80 && position <= 0.95) return 50;
  if (position > 0.95) return 30;
  return 60; // 0.00–0.20: cheap but possibly weak
}

export function calculateOpportunityScore(
  input: OpportunityScoreInput
): OpportunityScoreOutput | null {
  if (input.fundamentalScore == null) return null;

  const pricePositionScore = scorePricePosition(
    input.price,
    input.week52High,
    input.week52Low
  );

  const WEIGHTS: Array<{ score: number | null; weight: number }> = [
    { score: input.fundamentalScore, weight: 0.35 },
    { score: input.valuationScore,   weight: 0.30 },
    { score: input.growthScore,      weight: 0.20 },
    { score: input.riskContextScore, weight: 0.10 },
    { score: pricePositionScore,     weight: 0.05 },
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

  const opportunityScore = Math.round(weightedSum / totalWeight);

  return { opportunityScore, opportunityScoreVersion: OPPORTUNITY_SCORE_VERSION };
}
