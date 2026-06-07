/**
 * Build Opportunity Radar Prompt
 * Constructs a prompt for Claude with DB context (controlled source pack mode)
 * Phase 23C-2C: DB-backed context instead of public web search
 */

import { prisma } from "@/src/lib/db/prisma";

export interface StockContextItem {
  symbol: string;
  name: string;
  sector: string;
  currentPrice?: number | null;
  priceChange?: number | null;
  fundamentalScore?: number | null;
  opportunityScore?: number | null;
  analystRating?: string | null;
  analystTargetPrice?: number | null;
  analystUpsidePercent?: number | null;
}

/**
 * Load a subset of active stocks from DB for context
 * Returns top ~20 stocks by Opportunity Score to give Claude
 * a constrained, real market context
 */
export async function loadStockContext(
  limit: number = 20
): Promise<StockContextItem[]> {
  try {
    const stocks = await prisma.stock.findMany({
      where: {
        isActive: true,
      },
      select: {
        symbol: true,
        name: true,
        sector: true,
        quote: {
          select: {
            price: true,
            changePercent: true,
          },
        },
        score: {
          select: {
            opportunityScore: true,
            fundamentalScore: true,
          },
        },
        analystData: {
          select: {
            analystRating: true,
            targetPrice: true,
            analystUpsidePercent: true,
          },
        },
      },
      orderBy: {
        score: {
          opportunityScore: "desc",
        },
      },
      take: limit,
    });

    return stocks.map((stock) => ({
      symbol: stock.symbol,
      name: stock.name ?? "Unknown",
      sector: stock.sector ?? "Unknown",
      currentPrice: stock.quote?.price ? parseFloat(stock.quote.price.toString()) : undefined,
      priceChange: stock.quote?.changePercent ? parseFloat(stock.quote.changePercent.toString()) : undefined,
      fundamentalScore: stock.score?.fundamentalScore ? parseFloat(stock.score.fundamentalScore.toString()) : undefined,
      opportunityScore: stock.score?.opportunityScore ?? undefined,
      analystRating: stock.analystData?.analystRating ?? undefined,
      analystTargetPrice: stock.analystData?.targetPrice ? parseFloat(stock.analystData.targetPrice.toString()) : undefined,
      analystUpsidePercent: stock.analystData?.analystUpsidePercent ? parseFloat(stock.analystData.analystUpsidePercent.toString()) : undefined,
    }));
  } catch (error) {
    console.error("Failed to load stock context:", error);
    return [];
  }
}

/**
 * Format stock context as readable text for the prompt
 */
function formatStockContext(stocks: StockContextItem[]): string {
  if (stocks.length === 0) {
    return "No stocks available in context.";
  }

  const lines = stocks.map((stock) => {
    let line = `- ${stock.symbol} (${stock.name}, ${stock.sector})`;
    if (stock.currentPrice !== null && stock.currentPrice !== undefined) {
      line += ` | Price: $${stock.currentPrice.toFixed(2)}`;
    }
    if (
      stock.priceChange !== null &&
      stock.priceChange !== undefined &&
      stock.priceChange !== 0
    ) {
      const sign = stock.priceChange >= 0 ? "+" : "";
      line += ` (${sign}${stock.priceChange.toFixed(2)}%)`;
    }
    if (stock.opportunityScore !== null && stock.opportunityScore !== undefined) {
      line += ` | Opportunity: ${stock.opportunityScore}`;
    }
    if (
      stock.fundamentalScore !== null &&
      stock.fundamentalScore !== undefined
    ) {
      line += ` | Fundamental: ${stock.fundamentalScore.toFixed(1)}`;
    }
    if (stock.analystRating) {
      line += ` | Rating: ${stock.analystRating}`;
    }
    return line;
  });

  return lines.join("\n");
}

/**
 * Build the complete Opportunity Radar prompt
 * Uses DB context (controlled source pack mode)
 */
export async function buildRadarPrompt(): Promise<string> {
  const stocks = await loadStockContext(20);
  const stockContext = formatStockContext(stocks);

  return `You are an AI research analyst. Your task is to identify research candidates from the provided stock context.

IMPORTANT RULES:
1. You MUST only suggest stocks that are listed in the "Stock Context" section below.
2. You MUST NOT claim you searched the public web. You are analyzing a controlled database context.
3. You MUST NOT provide buy/sell recommendations. Only identify research candidates worth further review.
4. You MUST produce valid JSON output matching the schema below.
5. You MUST include at least 2 and at most 10 candidates.
6. You MUST assign exactly one radarLens per candidate (attention_spike, overreaction, value_gap, or future_theme).
7. All scores must be 0-100 integers only.
8. Each candidate MUST have at least 2 pieces of evidence.
9. You MUST be honest about uncertainty and data limitations.
10. You MUST NOT invent URLs, source names, or external references that don't exist.

STOCK CONTEXT (Database-Backed Controlled Source):
${stockContext}

Your task:
- Identify 2-10 stocks from the above context that have interesting characteristics.
- For each candidate, explain what pattern or signal makes it worth research review.
- Each candidate should have a specific radarLens (why it appears interesting).
- Provide evidence supporting each candidate (you can reference price movements, scores, sector trends, or fundamental metrics).
- Reject any candidates that don't meet minimum quality/signal criteria.
- Include an agentSelfCheck that honestly assesses the quality of your work.

Return ONLY valid JSON matching this schema (no markdown, no explanation):

{
  "schemaVersion": "1.0",
  "scanDate": "2026-06-07T10:30:00Z",
  "timeWindow": "24h",
  "providerMetadata": {
    "provider": "Anthropic",
    "model": "claude-sonnet-4.6",
    "actualThinkingEffort": "default",
    "promptDeclaredThinkingEffort": "regular",
    "searchEnabled": false,
    "sourceMode": "db_context",
    "notes": "Claude scan with database-backed context"
  },
  "summary": {
    "headline": "Brief summary of candidates found",
    "candidateCount": 3,
    "rejectedCount": 1,
    "topTheme": "Overall market theme"
  },
  "candidates": [
    {
      "ticker": "SYMBOL",
      "companyName": "Company Name",
      "radarLens": "attention_spike|overreaction|value_gap|future_theme",
      "detailedCategory": "Category description",
      "headline": "One-line headline",
      "radarBullets": ["Bullet 1", "Bullet 2"],
      "thesis": "Why this stock is interesting",
      "whyNow": "Why now specifically",
      "mainCatalyst": "Key upcoming catalyst or signal",
      "whatLooksInteresting": ["Interesting aspect 1", "Interesting aspect 2"],
      "keyConcerns": ["Concern 1", "Concern 2"],
      "nextCheck": "What to monitor next",
      "sourceEvidence": [
        {
          "sourceName": "Database Context",
          "sourceType": "market_data",
          "url": null,
          "title": null,
          "publishedAt": null,
          "snippet": "Evidence or observation from the data",
          "credibilityTier": "primary",
          "relevanceScore": 75
        }
      ],
      "attentionScore": 70,
      "confidenceScore": 65,
      "hypeRiskScore": 40,
      "radarSignalStrength": 75,
      "radarConvictionScore": 68,
      "sourceQualityScore": 70,
      "manipulationRiskScore": 35,
      "trendStatus": "new_today",
      "appearancesLast7Days": 1,
      "appearancesLast30Days": 3,
      "tags": ["Tag1", "Tag2"]
    }
  ],
  "rejectedCandidates": [
    {
      "ticker": "REJECTED",
      "reason": "Why rejected",
      "evidenceSummary": "Brief summary of why it didn't meet criteria"
    }
  ],
  "agentSelfCheck": {
    "jsonValid": true,
    "noBuySellLanguage": true,
    "allCandidatesHaveEvidence": true,
    "allScoresUseZeroToHundred": true,
    "uncertaintyDisclosed": true,
    "possibleWeaknesses": ["Limitation 1", "Limitation 2"]
  }
}`;
}
