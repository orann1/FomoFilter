export const OPPORTUNITY_SCORE_VERSION = "opportunity-v2";

export type OpportunityScoreInput = {
  fundamentalScore: number | null;
  valuationScore: number | null;
  growthScore: number | null;
  riskContextScore: number | null;
  // Analyst
  analystUpsidePercent: number | null;
  strongBuyCount: number | null;
  buyCount: number | null;
  holdCount: number | null;
  sellCount: number | null;
  strongSellCount: number | null;
  analystCount: number | null;
  // Price position
  price: number | null;
  week52High: number | null;
  week52Low: number | null;
};

export type OpportunityScoreOutput = {
  opportunityScore: number;
  opportunityScoreVersion: string;
};

function scoreAnalystUpside(upsidePct: number | null): number | null {
  if (upsidePct == null) return null;
  // Cap input at 60% for scoring — raw stored value is untouched
  if (upsidePct >= 60) return 100;
  if (upsidePct >= 40) return 90;
  if (upsidePct >= 30) return 82;
  if (upsidePct >= 20) return 72;
  if (upsidePct >= 10) return 60;
  if (upsidePct >= 0)  return 45;
  if (upsidePct >= -10) return 30;
  return 15;
}

function scoreAnalystSentiment(
  strongBuy: number | null,
  buy: number | null,
  hold: number | null,
  sell: number | null,
  strongSell: number | null,
  analystCount: number | null
): number | null {
  const sb = strongBuy ?? 0;
  const b  = buy ?? 0;
  const h  = hold ?? 0;
  const s  = sell ?? 0;
  const ss = strongSell ?? 0;
  const total = sb + b + h + s + ss;
  if (total === 0) return null;

  const rawSentiment = (sb * 100 + b * 80 + h * 50 + s * 20 + ss * 0) / total;

  const count = analystCount ?? total;
  let confidence: number;
  if (count >= 30)     confidence = 1.00;
  else if (count >= 20) confidence = 0.95;
  else if (count >= 10) confidence = 0.90;
  else if (count >= 5)  confidence = 0.80;
  else if (count >= 1)  confidence = 0.65;
  else return null;

  return 50 + (rawSentiment - 50) * confidence;
}

function scorePricePosition(
  price: number | null,
  week52High: number | null,
  week52Low: number | null
): number | null {
  if (price == null || week52High == null || week52Low == null) return null;
  const range = week52High - week52Low;
  if (range <= 0) return null;
  const position = (price - week52Low) / range;
  if (position < 0)                          return 50;
  if (position <= 0.20)                      return 65;
  if (position <= 0.60)                      return 100;
  if (position <= 0.75)                      return 80;
  if (position <= 0.90)                      return 60;
  if (position <= 1.00)                      return 40;
  return 30; // > 1.00 (above 52W high)
}

export function calculateOpportunityScore(
  input: OpportunityScoreInput
): OpportunityScoreOutput | null {
  if (input.fundamentalScore == null) return null;

  const analystUpsideScore   = scoreAnalystUpside(input.analystUpsidePercent);
  const analystSentimentScore = scoreAnalystSentiment(
    input.strongBuyCount,
    input.buyCount,
    input.holdCount,
    input.sellCount,
    input.strongSellCount,
    input.analystCount
  );
  const pricePositionScore = scorePricePosition(
    input.price,
    input.week52High,
    input.week52Low
  );

  const WEIGHTS: Array<{ score: number | null; weight: number }> = [
    { score: input.fundamentalScore,   weight: 0.25 },
    { score: input.valuationScore,     weight: 0.20 },
    { score: input.growthScore,        weight: 0.15 },
    { score: analystUpsideScore,       weight: 0.20 },
    { score: analystSentimentScore,    weight: 0.10 },
    { score: pricePositionScore,       weight: 0.05 },
    { score: input.riskContextScore,   weight: 0.05 },
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
