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
 * Optionally accepts a custom prompt template and context limit
 */
export async function buildRadarPrompt(
  customPrompt?: string,
  contextLimit?: number
): Promise<string> {
  const limit = contextLimit || 20;
  const stocks = await loadStockContext(limit);
  const stockContext = formatStockContext(stocks);

  // Use custom prompt if provided, otherwise use default
  if (customPrompt) {
    return `${customPrompt}

STOCK CONTEXT (Database-Backed Controlled Source):
${stockContext}

Your analysis process:
1. Review the stock context above carefully.
2. Identify stocks with interesting signals, patterns, or characteristics.
3. For each candidate, explain the radar lens (why it's worth research).
4. Ground evidence in the provided context (scores, sectors, ratings, price movements).
5. Reject candidates that don't have clear signals or minimum quality.
6. Return complete structured output via the create_radar_scan_output tool.`;
  }

  return `You are an AI research analyst for active investors. Your task is to identify research candidates worth further review based on market data signals.

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
   Return fewer candidates if quality is limited; prioritize signal strength over maximum count.
8. Each candidate MUST have a ticker and company name exactly matching the context provided.
9. Each candidate MUST have 1-2 evidence items with non-empty sourceName and snippet.
10. Each candidate MUST have one or more discovery signal tags (reasonTags):
    analyst_upside, analyst_revision, valuation_gap, recent_weakness, earnings_reaction, momentum_shift,
    unusual_attention, sector_theme, ai_theme, turnaround_watch, speculative_growth, high_risk,
    quality_pullback, technical_setup, other
    (Do NOT assign radarLens unless necessary for backward compatibility; prioritize reasonTags.)
11. Each candidate MUST have a researchPriority integer from 1 to 5 (5 = highest).
12. Reject candidates that are too weak, have no clear signals, or don't meet minimum quality criteria.

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

Example candidate structure (Phase 24B v2 format):

{
  "schemaVersion": "2.0",
  "scanDate": "2026-06-07T10:30:00Z",
  "timeWindow": "24h",
  "providerMetadata": {
    "provider": "Anthropic",
    "model": "claude-sonnet-4-6",
    "actualThinkingEffort": "default",
    "promptDeclaredThinkingEffort": "regular",
    "searchEnabled": false,
    "sourceMode": "db_context",
    "notes": "Claude scan with database-backed context"
  },
  "summary": {
    "headline": "Brief summary of research candidates",
    "candidateCount": 5,
    "rejectedCount": 2,
    "topTheme": "Overall market theme or signal pattern"
  },
  "candidates": [
    {
      "rank": 1,
      "ticker": "SYMBOL",
      "companyName": "Company Name",
      "radarLens": null,
      "detailedCategory": null,
      "reasonTags": ["analyst_upside", "momentum_shift"],
      "researchPriority": 5,
      "headline": "One-line headline (max 140 chars)",
      "radarBullets": ["Signal 1 (max 120 chars)", "Signal 2 (max 120 chars)", "Signal 3 (max 120 chars)"],
      "thesis": "Why this stock is worth reviewing (max 400 chars)",
      "whyNow": "Why now specifically (max 300 chars)",
      "mainCatalyst": "Key trigger or signal (max 150 chars)",
      "whatLooksInteresting": ["Aspect 1 (max 150 chars)", "Aspect 2 (max 150 chars)"],
      "keyConcerns": ["Risk 1 (max 150 chars)", "Risk 2 (max 150 chars)"],
      "nextCheck": "What to verify or monitor (max 150 chars)",
      "sourceEvidence": [
        {
          "sourceName": "Database Context",
          "sourceType": "db_score",
          "url": null,
          "snippet": "Key observation from context (max 250 chars)",
          "credibilityTier": "primary",
          "relevanceScore": 85
        }
      ],
      "attentionScore": 75,
      "confidenceScore": 70,
      "hypeRiskScore": 35,
      "radarSignalStrength": 80,
      "radarConvictionScore": 72,
      "sourceQualityScore": 75,
      "manipulationRiskScore": 30,
      "trendStatus": "new_today",
      "appearancesLast7Days": 1,
      "appearancesLast30Days": 2,
      "tags": ["momentum", "analyst_positive"]
    }
  ],
  "rejectedCandidates": [
    {
      "ticker": "REJECTED",
      "reason": "Why rejected",
      "companyName": "Company Name"
    }
  ],
  "agentSelfCheck": {
    "jsonValid": true,
    "noBuySellLanguage": true,
    "allCandidatesHaveEvidence": true,
    "allScoresUseZeroToHundred": true,
    "uncertaintyDisclosed": true,
    "possibleWeaknesses": ["Limited to provided DB context", "Short time window"]
  }
}`;
}
