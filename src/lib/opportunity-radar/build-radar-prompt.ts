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
 * Tool Use mode: Claude will use the create_radar_scan_output tool with structured output
 */
export async function buildRadarPrompt(): Promise<string> {
  const stocks = await loadStockContext(20);
  const stockContext = formatStockContext(stocks);

  return `You are an AI research analyst. Your task is to identify research candidates from the provided stock context using structured tool output.

CRITICAL GROUNDING RULES (These are absolute — no exceptions):
1. You MUST use the create_radar_scan_output tool to return your analysis.
2. You MUST only suggest stocks that exist in the "Stock Context" section below.
3. You MUST NOT claim you performed public web searches. This is a database-backed controlled context analysis only.
4. You MUST NOT provide buy/sell/hold recommendations. Only identify research candidates that merit further review.
5. You MUST NOT invent ticker symbols, company names, URLs, or external sources that don't exist.
6. You MUST be honest about data limitations and uncertainty in your agentSelfCheck.

PROHIBITED LANGUAGE (Absolute — will cause rejection if used):
- NEVER use the words: "buy", "sell", "hold", "strong buy", "recommendation"
- NEVER use phrases like: "underperform", "outperform", "guaranteed upside", "will go up", "best stock"
- NEVER suggest or imply a financial decision

REQUIRED ALTERNATIVES (Use these instead):
- Instead of "buy": use "research candidate", "worth reviewing", "merit further analysis", "capture market attention"
- Instead of "sell": use "downward pressure", "drawdown risk", "caution warranted", "requires validation"
- Instead of "strong buy": use "favorable signal pattern", "positive analyst view", "compelling setup"
- Instead of "buyback": use "capital return", "shareholder distribution", "balance sheet action"
- Instead of "recommendation": use "research thesis", "signal pattern", "catalyst identification"

Use cautious language throughout:
- "potential opportunity" not "sure thing"
- "signals suggest" not "will definitely"
- "worth monitoring" not "about to happen"
- "may warrant review" not "should be bought"

CANDIDATE QUALITY RULES:
7. Identify 2-5 candidates from the provided context that have interesting characteristics worth reviewing.
   (Focus on quality over quantity. Return fewer high-quality candidates.)
8. Each candidate MUST have a ticker and company name exactly matching the context provided.
9. Each candidate MUST have 1-2 evidence items with non-empty sourceName and snippet.
10. Each candidate MUST be assigned exactly one radarLens: attention_spike, overreaction, value_gap, or future_theme.
11. Reject candidates that are too weak, have no clear signals, or don't meet minimum quality criteria.

TEXT FIELD LIMITS (keep output concise):
12. headline: max 140 characters
13. radarBullets: exactly 3 items, max 120 chars each
14. thesis: max 400 characters
15. whyNow: max 300 characters
16. mainCatalyst: max 150 characters
17. whatLooksInteresting: exactly 2 items, max 150 chars each
18. keyConcerns: exactly 2 items, max 150 chars each
19. nextCheck: max 150 characters

SCORING RULES:
20. All scores (attention, confidence, hype risk, conviction, etc.) must be integers from 0 to 100 only.
21. Do NOT use 0-10 scale. Convert if needed: (old_score / 10) * 100.

OUTPUT REQUIREMENTS:
22. Use the create_radar_scan_output tool with the complete schema.
23. Include a detailedCategory field for each candidate.
24. Include evidence with sourceName, snippet, credibilityTier, and relevanceScore.
25. For db_context mode, evidence URLs may be null (reference internal database sources).
26. Include agentSelfCheck with honest assessment of work quality.

STOCK CONTEXT (Database-Backed Controlled Source):
${stockContext}

Your analysis process:
1. Review the stock context above carefully.
2. Identify stocks with interesting signals, patterns, or characteristics.
3. For each candidate, explain the radar lens (why it's worth research).
4. Ground evidence in the provided context (scores, sectors, ratings, price movements).
5. Reject candidates that don't have clear signals or minimum quality.
6. Return complete structured output via the create_radar_scan_output tool.

Example candidate structure (use this as your template):

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
      "headline": "One-line headline (max 140 chars)",
      "radarBullets": ["Signal 1 (max 120 chars)", "Signal 2 (max 120 chars)", "Signal 3 (max 120 chars)"],
      "thesis": "Why this stock is interesting (max 400 chars)",
      "whyNow": "Why now specifically (max 300 chars)",
      "mainCatalyst": "Key upcoming catalyst (max 150 chars)",
      "whatLooksInteresting": ["Aspect 1 (max 150 chars)", "Aspect 2 (max 150 chars)"],
      "keyConcerns": ["Risk 1 (max 150 chars)", "Risk 2 (max 150 chars)"],
      "nextCheck": "What to monitor next (max 150 chars)",
      "sourceEvidence": [
        {
          "sourceName": "Database Context",
          "sourceType": "market_data",
          "url": null,
          "snippet": "Key data or observation (max 250 chars)",
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
