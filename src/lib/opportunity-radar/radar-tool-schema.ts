/**
 * Anthropic Tool Use Schema for Opportunity Radar
 * Defines the structured input schema that Claude must conform to
 * when returning Opportunity Radar scan results via tool_use.
 */

export const RADAR_TOOL_NAME = "create_radar_scan_output";

export const RADAR_TOOL_SCHEMA = {
  type: "object" as const,
  properties: {
    schemaVersion: {
      type: "string",
      description: "Schema version, e.g., '2.0' for v2 (reasonTags-based) or '1.0' for v1 (lens-based)",
    },
    scanDate: {
      type: "string",
      description: "ISO 8601 datetime of the scan",
    },
    timeWindow: {
      type: "string",
      description: "Time window analyzed, e.g., '24_hours'",
    },
    providerMetadata: {
      type: "object",
      properties: {
        provider: {
          type: "string",
          description: "Provider name, e.g., 'Anthropic'",
        },
        model: {
          type: "string",
          description: "Model name, e.g., 'claude-sonnet-4.6'",
        },
        actualThinkingEffort: {
          type: ["string", "null"],
          description: "Actual thinking effort used if applicable",
        },
        promptDeclaredThinkingEffort: {
          type: ["string", "null"],
          description: "Thinking effort declared in prompt if applicable",
        },
        searchEnabled: {
          type: "boolean",
          description: "Whether web search is enabled (should be false for db_context)",
        },
        sourceMode: {
          type: "string",
          enum: ["db_context", "fixture", "web_search"],
          description: "Source mode: db_context (DB only), fixture (test data), or web_search (future)",
        },
        notes: {
          type: ["string", "null"],
          description: "Optional notes about the scan",
        },
      },
      required: ["provider", "model", "searchEnabled", "sourceMode"],
    },
    summary: {
      type: "object",
      properties: {
        headline: {
          type: "string",
          description: "Summary headline of the scan",
        },
        candidateCount: {
          type: "integer",
          minimum: 0,
          description: "Number of candidates returned",
        },
        rejectedCount: {
          type: "integer",
          minimum: 0,
          description: "Number of candidates rejected",
        },
        topTheme: {
          type: "string",
          description: "Overall market theme or summary",
        },
      },
      required: ["headline", "candidateCount", "rejectedCount", "topTheme"],
    },
    candidates: {
      type: "array",
      description: "Array of research candidates (up to 10, ranked by research priority)",
      minItems: 0,
      maxItems: 10,
      items: {
        type: "object",
        properties: {
          ticker: {
            type: "string",
            description: "Stock ticker symbol, must be non-empty and copied from DB context",
          },
          companyName: {
            type: "string",
            description: "Company name, must be non-empty and copied from DB context",
          },
          radarLens: {
            type: ["string", "null"],
            enum: ["attention_spike", "overreaction", "value_gap", "future_theme", null],
            description: "[v1 only] Radar lens categorization. Nullable for v2 output.",
          },
          detailedCategory: {
            type: ["string", "null"],
            description: "[v1 only] Detailed category name. Nullable for v2 output.",
          },
          reasonTags: {
            type: "array",
            items: {
              type: "string",
              enum: [
                "analyst_upside",
                "analyst_revision",
                "valuation_gap",
                "recent_weakness",
                "earnings_reaction",
                "momentum_shift",
                "unusual_attention",
                "sector_theme",
                "ai_theme",
                "turnaround_watch",
                "speculative_growth",
                "high_risk",
                "quality_pullback",
                "technical_setup",
                "other"
              ]
            },
            description: "[v2 only] Discovery signal tags. Required for v2 schema.",
          },
          researchPriority: {
            type: "integer",
            minimum: 1,
            maximum: 5,
            description: "[v2 only] Research priority rank 1-5 (5=highest). Required for v2 schema.",
          },
          headline: {
            type: "string",
            description: "One-line headline for the candidate. CRITICAL: Do NOT use buy/sell/hold/recommendation language.",
          },
          radarBullets: {
            type: "array",
            items: { type: "string" },
            description: "Key signal bullets (usually 3). Use neutral language: 'worth reviewing', 'signals suggest', not 'buy'/'sell'.",
          },
          thesis: {
            type: "string",
            description: "Investment thesis or narrative. CRITICAL: Do NOT use buy/sell/recommendation language. Use 'research candidate', 'worth reviewing', 'potential opportunity'.",
          },
          whyNow: {
            type: "string",
            description: "Why this candidate is relevant now. CRITICAL: Do NOT use buy/sell language. Use 'market attention', 'catalyst identification', 'signal pattern'.",
          },
          mainCatalyst: {
            type: "string",
            description: "Primary catalyst or trigger. Do NOT use buy/sell language.",
          },
          whatLooksInteresting: {
            type: "array",
            items: { type: "string" },
            description: "Bullish factors worth monitoring. Do NOT use buy/strong buy language. Use neutral alternatives.",
          },
          keyConcerns: {
            type: "array",
            items: { type: "string" },
            description: "Risk factors or bearish signals. Do NOT use sell/recommend caution language. Use 'drawdown risk', 'caution warranted'.",
          },
          nextCheck: {
            type: "string",
            description: "What to verify or monitor next. Do NOT use buy/sell language.",
          },
          sourceEvidence: {
            type: "array",
            minItems: 1,
            description: "Evidence items supporting the candidate, at least one required",
            items: {
              type: "object",
              properties: {
                sourceName: {
                  type: "string",
                  description: "Source name, must be non-empty",
                },
                sourceType: {
                  type: "string",
                  enum: ["db_score", "analyst_data", "market_data", "news", "research"],
                  description: "Type of source",
                },
                url: {
                  type: ["string", "null"],
                  description: "URL if available, may be null for internal DB sources",
                },
                title: {
                  type: ["string", "null"],
                  description: "Title or headline of evidence source",
                },
                publishedAt: {
                  type: ["string", "null"],
                  description: "ISO 8601 publication date if available",
                },
                snippet: {
                  type: "string",
                  description: "Evidence summary or quote, must be non-empty",
                },
                credibilityTier: {
                  type: "string",
                  enum: ["primary", "secondary", "tertiary", "experimental"],
                  description: "Credibility assessment",
                },
                relevanceScore: {
                  type: "integer",
                  minimum: 0,
                  maximum: 100,
                  description: "Relevance score 0-100",
                },
              },
              required: [
                "sourceName",
                "sourceType",
                "snippet",
                "credibilityTier",
                "relevanceScore",
              ],
            },
          },
          attentionScore: {
            type: "integer",
            minimum: 0,
            maximum: 100,
            description: "Attention score 0-100",
          },
          confidenceScore: {
            type: "integer",
            minimum: 0,
            maximum: 100,
            description: "Confidence score 0-100",
          },
          hypeRiskScore: {
            type: "integer",
            minimum: 0,
            maximum: 100,
            description: "Hype/risk score 0-100",
          },
          radarSignalStrength: {
            type: "integer",
            minimum: 0,
            maximum: 100,
            description: "Signal strength 0-100",
          },
          radarConvictionScore: {
            type: "integer",
            minimum: 0,
            maximum: 100,
            description: "Conviction score 0-100",
          },
          sourceQualityScore: {
            type: "integer",
            minimum: 0,
            maximum: 100,
            description: "Source quality score 0-100",
          },
          manipulationRiskScore: {
            type: "integer",
            minimum: 0,
            maximum: 100,
            description: "Manipulation risk score 0-100",
          },
          trendStatus: {
            type: "string",
            enum: ["new_today", "repeated", "back_on_radar", "cooling_down"],
            description: "Trend status",
          },
          appearancesLast7Days: {
            type: ["integer", "null"],
            description: "Number of appearances in last 7 days",
          },
          appearancesLast30Days: {
            type: ["integer", "null"],
            description: "Number of appearances in last 30 days",
          },
          tags: {
            type: "array",
            items: { type: "string" },
            description: "Tags for categorization",
          },
        },
        required: [
          "ticker",
          "companyName",
          "headline",
          "radarBullets",
          "thesis",
          "whyNow",
          "mainCatalyst",
          "whatLooksInteresting",
          "keyConcerns",
          "nextCheck",
          "sourceEvidence",
          "attentionScore",
          "confidenceScore",
          "hypeRiskScore",
          "radarSignalStrength",
          "radarConvictionScore",
          "sourceQualityScore",
          "manipulationRiskScore",
          "trendStatus",
          "tags",
          "reasonTags",
          "researchPriority",
        ],
      },
    },
    rejectedCandidates: {
      type: "array",
      description: "Array of candidates that were evaluated but rejected",
      items: {
        type: "object",
        properties: {
          ticker: {
            type: ["string", "null"],
          },
          companyName: {
            type: ["string", "null"],
          },
          reason: {
            type: "string",
          },
        },
      },
    },
    agentSelfCheck: {
      type: "object",
      properties: {
        jsonValid: {
          type: "boolean",
          description: "Whether JSON structure is valid",
        },
        noBuySellLanguage: {
          type: "boolean",
          description: "Whether output avoids buy/sell recommendations",
        },
        allCandidatesHaveEvidence: {
          type: "boolean",
          description: "Whether all candidates have evidence",
        },
        allScoresUseZeroToHundred: {
          type: "boolean",
          description: "Whether all scores use 0-100 scale",
        },
        uncertaintyDisclosed: {
          type: "boolean",
          description: "Whether uncertainty is disclosed",
        },
        possibleWeaknesses: {
          type: "array",
          items: { type: "string" },
          description: "Possible weaknesses in the scan",
        },
      },
      required: [
        "jsonValid",
        "noBuySellLanguage",
        "allCandidatesHaveEvidence",
        "allScoresUseZeroToHundred",
        "uncertaintyDisclosed",
        "possibleWeaknesses",
      ],
    },
  },
  required: [
    "schemaVersion",
    "scanDate",
    "timeWindow",
    "providerMetadata",
    "summary",
    "candidates",
    "rejectedCandidates",
    "agentSelfCheck",
  ],
};

export const RADAR_TOOL_DEFINITION = {
  name: RADAR_TOOL_NAME,
  description:
    "Return a structured Opportunity Radar scan output from the provided FomoFilter DB context. " +
    "The output contains research candidates identified from provided market context. " +
    "Do NOT claim public web search. Use only the database context provided. " +
    "All candidates must have valid ticker and company name from the context. " +
    "All evidence must be grounded in internal database sources.",
  input_schema: RADAR_TOOL_SCHEMA,
};
