/**
 * Sample/Fixture Opportunity Radar AI Agent Output
 * Used for Phase 23C-2A validation and persistence testing
 * This is FIXTURE DATA only - not a real AI scan result
 */

import type { RadarScanOutput } from "@/src/types/opportunity-radar-agent";

export const sampleRadarOutput: RadarScanOutput = {
  schemaVersion: "1.0",
  scanDate: "2026-06-07T10:30:00Z",
  timeWindow: "24h",

  providerMetadata: {
    provider: "Anthropic",
    model: "claude-sonnet-4.6",
    actualThinkingEffort: "default",
    promptDeclaredThinkingEffort: "regular",
    searchEnabled: false,
    sourceMode: "fixture",
    notes: "Fixture data for Phase 23C-2A testing",
  },

  summary: {
    headline:
      "Three research candidates identified across different market signals",
    candidateCount: 3,
    rejectedCount: 1,
    topTheme: "AI infrastructure and overreaction recovery",
  },

  candidates: [
    {
      ticker: "NVDA",
      companyName: "NVIDIA Corporation",
      radarLens: "attention_spike",
      detailedCategory: "unusual_attention",
      headline:
        "Institutional research volume rising ahead of product cycle clarity",
      radarBullets: [
        "Research note volume elevated in last 48 hours without public news",
        "Pattern resembles pre-announcement institutional positioning",
        "First appearance in this scan - new signal",
      ],
      thesis:
        "Fixture signals indicate unusually elevated research coverage across AI infrastructure topics. The pattern may suggest market participants positioning ahead of a catalyst or narrative development.",
      whyNow:
        "Institutional activity metrics suggest concentrated interest without a corresponding public news event. This pattern may precede either a catalyst or sentiment-driven valuation adjustment.",
      mainCatalyst:
        "Potential GPU architecture updates or major partner ecosystem announcements",
      whatLooksInteresting: [
        "AI infrastructure investment thesis remains intact",
        "Data center demand fundamentals continue supportive",
        "Product cycle timing may be approaching clarity",
      ],
      keyConcerns: [
        "Current valuation reflects significant market expectations",
        "Attention spikes without clear catalysts frequently resolve as sentiment noise",
        "Disappointment risk is material at current price levels",
      ],
      nextCheck:
        "Monitor upcoming product announcements and partner conference disclosures",
      sourceEvidence: [
        {
          sourceName: "Institutional Research Aggregator",
          sourceType: "research_notes",
          url: "https://example.com/research/ai-infrastructure",
          title: "AI Infrastructure Sector Deep Dive - June 2026",
          publishedAt: "2026-06-07T06:00:00Z",
          snippet:
            "GPU demand signals show sustained institutional attention, with research note volume above 30-day average.",
          credibilityTier: "primary",
          relevanceScore: 82,
        },
        {
          sourceName: "Market Data Provider",
          sourceType: "technical_analysis",
          url: null,
          title: null,
          publishedAt: null,
          snippet:
            "Price consolidation pattern consistent with accumulation before directional move.",
          credibilityTier: "secondary",
          relevanceScore: 68,
        },
      ],
      attentionScore: 74,
      confidenceScore: 62,
      hypeRiskScore: 58,
      radarSignalStrength: 78,
      radarConvictionScore: 71,
      sourceQualityScore: 75,
      manipulationRiskScore: 35,
      trendStatus: "new_today",
      appearancesLast7Days: 1,
      appearancesLast30Days: 3,
      tags: ["AI", "semiconductors", "data-center", "fixture"],
    },
    {
      ticker: "SMCI",
      companyName: "Super Micro Computer Inc.",
      radarLens: "overreaction",
      detailedCategory: "beaten_down",
      headline:
        "Sharp multi-week decline signals may have extended beyond fundamental support",
      radarBullets: [
        "Stock down significantly from recent highs amid uncertainty",
        "Selling pressure decelerating - volume declining despite lower prices",
        "Server demand fundamentals remain intact beneath noise",
      ],
      thesis:
        "Fixture analysis suggests the recent drawdown may have extended beyond what business fundamentals alone justify. The pattern resembles overreaction setups worth monitoring for stabilization signals.",
      whyNow:
        "Price action in recent sessions shows deceleration in downward pressure with declining volume - a pattern sometimes observed before stabilization begins.",
      mainCatalyst:
        "Resolution of regulatory and filing timeline concerns with updated guidance clarity",
      whatLooksInteresting: [
        "Server demand fundamentals remain supportive of underlying business",
        "Regulatory timeline clarity may reduce uncertainty premium",
        "Technical stabilization signals emerging in daily price action",
      ],
      keyConcerns: [
        "Uncertainty around regulatory status has not fully resolved",
        "Another negative development could extend the drawdown significantly",
        "Market psychology may require time to rebuild confidence",
      ],
      nextCheck:
        "Watch for filing updates and regulatory communication in next 30 days",
      sourceEvidence: [
        {
          sourceName: "Regulatory Filing Database",
          sourceType: "regulatory_filings",
          url: "https://example.com/sec-filings",
          title: "Recent SEC Filings - SMCI",
          publishedAt: "2026-06-05T00:00:00Z",
          snippet:
            "Recent regulatory filings show timeline discussions with relevant agencies.",
          credibilityTier: "primary",
          relevanceScore: 85,
        },
        {
          sourceName: "Technical Analysis",
          sourceType: "technical_analysis",
          url: null,
          title: null,
          publishedAt: null,
          snippet:
            "Volume profile suggests accumulation zone forming near recent lows.",
          credibilityTier: "secondary",
          relevanceScore: 71,
        },
        {
          sourceName: "Fundamental Analysis",
          sourceType: "fundamental_analysis",
          url: "https://example.com/analysis/smci-servers",
          title: "Server Market Demand Analysis",
          publishedAt: "2026-06-06T00:00:00Z",
          snippet:
            "Server shipment data continues to show healthy demand trends in AI workload categories.",
          credibilityTier: "secondary",
          relevanceScore: 79,
        },
      ],
      attentionScore: 65,
      confidenceScore: 51,
      hypeRiskScore: 44,
      radarSignalStrength: 72,
      radarConvictionScore: 63,
      sourceQualityScore: 78,
      manipulationRiskScore: 28,
      trendStatus: "back_on_radar",
      appearancesLast7Days: 2,
      appearancesLast30Days: 6,
      tags: ["servers", "ai-hardware", "beaten-down", "fixture"],
    },
    {
      ticker: "META",
      companyName: "Meta Platforms Inc.",
      radarLens: "value_gap",
      detailedCategory: "possibly_undervalued",
      headline:
        "Forward earnings multiples appear compressed relative to AI investment scale",
      radarBullets: [
        "Forward multiples below peer group despite similar AI infrastructure investment",
        "Recent engagement metrics ahead of revised estimates",
        "Sustained signal - appeared multiple times in 7-day window",
      ],
      thesis:
        "Fixture analysis indicates current valuations may reflect market skepticism around AI monetization timing rather than fundamental deterioration. The valuation gap may represent a research opportunity worth monitoring.",
      whyNow:
        "Recent results showed stronger-than-expected engagement metrics, yet the stock has not re-rated accordingly. This disconnect suggests potential valuation lag relative to underlying business trends.",
      mainCatalyst:
        "AI-powered advertising tools demonstrating measurable ROI improvements for advertisers",
      whatLooksInteresting: [
        "Forward multiples provide margin of safety at current levels",
        "Engagement acceleration provides positive inflection signal",
        "AI monetization thesis gaining traction in market discussions",
      ],
      keyConcerns: [
        "Capital expenditure intensity rising faster than revenue growth",
        "AI investment ROI timeline uncertain and may extend beyond estimates",
        "Competitive pressures in advertising remain significant",
      ],
      nextCheck:
        "Monitor ad revenue per user and AI monetization metrics at next earnings",
      sourceEvidence: [
        {
          sourceName: "Earnings Analysis Platform",
          sourceType: "earnings_transcripts",
          url: "https://example.com/earnings/meta",
          title: "Meta Q1 2026 Earnings Analysis",
          publishedAt: "2026-06-04T00:00:00Z",
          snippet:
            "Engagement metrics exceeded guidance by 150 basis points, signaling stronger user monetization.",
          credibilityTier: "primary",
          relevanceScore: 88,
        },
        {
          sourceName: "Valuation Model Database",
          sourceType: "fundamental_analysis",
          url: "https://example.com/valuation/meta",
          title: "Comparative Valuation Analysis - Mega-Cap Tech",
          publishedAt: "2026-06-06T00:00:00Z",
          snippet:
            "Forward P/E comparison shows Meta trading at meaningful discount to peers with similar revenue growth.",
          credibilityTier: "secondary",
          relevanceScore: 81,
        },
      ],
      attentionScore: 58,
      confidenceScore: 72,
      hypeRiskScore: 32,
      radarSignalStrength: 71,
      radarConvictionScore: 68,
      sourceQualityScore: 84,
      manipulationRiskScore: 18,
      trendStatus: "repeated",
      appearancesLast7Days: 3,
      appearancesLast30Days: 8,
      tags: ["social-media", "ai-monetization", "value", "fixture"],
    },
  ],

  rejectedCandidates: [
    {
      ticker: "UNKN",
      companyName: "Unknown Ticker Corp",
      reason:
        "Ticker symbol could not be verified against known stock universe",
      evidenceSummary:
        "Symbol does not match any real company in available databases",
    },
  ],

  agentSelfCheck: {
    jsonValid: true,
    noBuySellLanguage: true,
    allCandidatesHaveEvidence: true,
    allScoresUseZeroToHundred: true,
    uncertaintyDisclosed: true,
    possibleWeaknesses: [
      "Fixture data - not derived from real market signals",
      "Evidence URLs are example endpoints, not real sources",
    ],
  },
};
