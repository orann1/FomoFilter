# Opportunity Radar AI Agent Design — Phase 23B

## Overview

Phase 23B defines the design and architecture for the AI agent that powers Opportunity Radar, without implementing any real AI calls, provider integrations, or database changes.

This phase is **documentation and planning only**.

---

## A. Product Role

The AI agent is the **research engine** behind Opportunity Radar.

Its purpose:

```txt
Find and explain research candidates, not recommendations.
Surface stocks worth further review based on available signals (DB context or web search).
Separate external signal (from AI) from internal FomoFilter validation.
Produce structured, machine-readable output.
Support manual admin execution and future scheduled execution.
```

The AI agent should:

- Identify potential research candidates from provided signals/context
- Rank candidates by research priority
- Explain why each candidate appeared (catalyst, signal, trend context)
- Provide evidence citations for each claim
- Assign discovery signals / reason tags (e.g., analyst_upside, valuation_gap, momentum_shift)
- Allow candidates outside the FomoFilter DB universe (external discovery)
- Measure signal strength, confidence, and hype risk
- Persist results for later database storage and UI display
- Never produce buy/sell recommendations
- Use cautious, research-focused language
- Mark candidates that are external (not in FomoFilter DB) clearly

The AI agent outputs are **structured candidates** that can be stored in the database and displayed by /opportunity-radar.

---

## A.1 Phase 24B Product Direction Update

**Previous output contract (Phase 23B, based on Phase 23A Lens model):**
- Forced candidates into one of 4 lenses: Attention Spike, Overreaction, Value Gap, Future Theme
- Lens categorization was primary UX concept
- External discovery not a designed concept

**New output contract (Phase 24B+, scan-based research signal tracker) — Phase 24B-1 IMPLEMENTED:**
- ✓ Return up to 10 ranked research candidates (no forced lens coverage)
- ✓ Use reasonTags / discoverySignals instead of forced lenses
- ✓ Allow and clearly mark candidates outside FomoFilter DB (external discovery)
- ✓ Include DB validation status (matched, not_found, inactive, symbol_conflict, pending_match)
- ✓ Include trend assessment (new, repeated, back_on_radar, cooling_down)
- ✓ Provide research priority score/rank (1–5)
- ✓ Support scan period metadata (explicit time window analyzed via scanPeriodStart/End/Label)
- ✓ Keep research-only, no recommendation language

---

## A.2 Phase 24B Prompt and Output Contract (Proposed)

This section documents the proposed prompt direction and output contract for Phase 24B implementation. **None of these changes are implemented yet** — this is planning/spec only.

### Phase 24B Prompt Direction

**Key changes from Phase 23B:**

**Previous approach (Phase 23B, Lens-based):**
```
Return up to N candidates.
Each candidate must be assigned to ONE of four lenses:
  - Attention Spike
  - Overreaction
  - Value Gap
  - Future Theme
Provide one candidate per lens if possible.
```

**New approach (Phase 24B, Signal-based):**
```
Return up to 10 research candidates ranked by research priority.
Do NOT force candidates into four fixed lenses.
Do NOT require one candidate per category.
Use discovery signals / reason tags (flexible, extensible).
Allow candidates outside FomoFilter DB — mark as external discovery.
Use scan period metadata (explicit start/end time window).
If you have a prior scan summary, consider it and explain new candidates or recurring themes.
Treat repeated appearances as a signal requiring attention, not as a recommendation.
Keep all language research-focused. No buy/sell/hold language.
If source mode is db_context, be honest that analysis is based on provided DB context only, not public/external signals.
```

### Phase 24B Proposed Candidate Fields

**Proposed output structure for each candidate** (Phase 24B implementation):

```ts
{
  // Identity
  ticker: string,
  companyName: string,
  
  // Ranking & Priority
  rank: number,                    // 1–10 (rank within scan)
  researchPriority: number,        // 1–5 (high = repeated or high conviction)
  
  // Narrative
  headline: string,                // 1-line summary
  whyAppeared: string,             // explanation of signal/catalyst
  mainCatalyst: string,            // primary trigger
  keyBullets: string[],            // 3 key signals
  keyConcerns: string[],           // risk factors / bearish signals
  nextCheck: string,               // what to verify next
  
  // Discovery Signals (NEW — added alongside radarLens, not replacing)
  reasonTags: string[],            // e.g., ["analyst_upside", "valuation_gap", "momentum_shift", "narrative_change"]
  
  // Evidence
  evidence: Evidence[],            // sources supporting the candidate
  
  // Trend & History
  trendStatus: "new" | "repeated" | "back_on_radar" | "cooling_down",
  appearancesLast7Days: number,
  appearancesLast30Days: number,
  
  // DB Validation (NEW)
  externalDiscoveryStatus: "in_db" | "external_discovery",
  dbValidationStatus: "matched" | "not_found" | "pending_match",
  
  // Scores (AI Assessment, NOT production scores)
  attentionScore: number,          // 0-100
  confidenceScore: number,         // 0-100
  hypeRiskScore: number,           // 0-100
  radarSignalStrength: number,     // 0-100
  radarConvictionScore: number,    // 0-100
}
```

**Legacy fields (preserved for backward compatibility) — Phase 24B-1 Status:**
- `radarLens` — v1 legacy field. Remains in schema for existing Phase 23C records (non-null values preserved). Made nullable (String?) in Phase 24B-1 to support v2 output format where lens assignment is not forced. v2 output can have null radarLens; v1 records keep non-null values. Do NOT remove or rename this field.
- `detailedCategory` — v1 legacy field. Made nullable (String?) in Phase 24B-1 to support v2. v2 output uses reasonTags instead. v1 records keep non-null values.
- `tags` — General metadata tags. Preserved alongside new `reasonTags`. Both can be present simultaneously (backward compatible).

**Proposed reasonTags values** (non-exhaustive, AI can add others):
```
"analyst_upside"      — Analyst consensus suggests upside
"analyst_upgrade"     — Recent analyst upgrade
"valuation_gap"       — Valuation appears disconnected from fundamentals
"momentum_shift"      — Price/volume momentum change
"earnings_beat"       — Recent earnings beat expectations
"narrative_change"    — New market narrative / theme emerging
"high_short_interest" — Significant short position
"insider_activity"    — Insider trading / buying activity
"catalyst_signal"     — Upcoming catalyst identified
"technical_setup"     — Technical chart pattern
"sector_strength"     — Sector/industry momentum
"supply_demand"       — Supply/demand imbalance
```

### Phase 24B Scan Period Metadata (Proposed)

**Immediate Phase 24B-1 fields:**

```ts
{
  scanDate: ISO8601,               // when scan executed (already exists)
  scanPeriodStart: ISO8601,        // explicit analysis window start — ADD TO SCHEMA
  scanPeriodEnd: ISO8601,          // explicit analysis window end — ADD TO SCHEMA
  scanLabel?: string,              // optional human label (e.g., "Post-earnings cycle") — ADD TO SCHEMA
  
  // ... existing fields ...
}
```

**Deferred / Future fields (do NOT add in Phase 24B-1):**

```ts
{
  previousScanId?: string,         // link to prior scan for context — DEFERRED
  comparisonSummary?: Json,        // summary statistics — DEFERRED (compute on read instead)
  scanMode?: string,               // "standard", "universe_expansion", "deep_dive" — DEFERRED
}
```

### Phase 24B Prompt Tone (Proposed)

**Research-first framing:**
```
"Identify up to 10 research candidates worth further review.
Each candidate should be supported by clear signal(s) and evidence.
Rank candidates by research priority / conviction.
Mark candidates that are external to FomoFilter DB.
Avoid buy/sell/hold language. Use: 'worth reviewing', 'signals suggest', 'potential opportunity', 'requires attention'."
```

**Honesty about source mode:**
```
"If source_mode = db_context:
  Be clear that your analysis is based on the provided DB context only.
  Do not claim public/web knowledge unless included in the context.
  Do not say 'recent news suggests' if relying only on DB data."
  
"If source_mode = web_search:
  You may reference external news, research, and public signals.
  Cite sources in evidence fields."
```

---

## B. Phase 23B Scope

**Scope: Docs/design only. No implementation.**

### In Scope

```txt
- Agent goal definition
- Agent input design (what data the agent receives)
- Agent source strategy (where the agent looks for candidates)
- AI provider / model evaluation framework
- Prompt versioning strategy
- Output schema definition
- Evidence requirements and structure
- Scoring / validation concepts (non-production design)
- Admin configuration requirements (provider, sources, prompts)
- Manual admin execution flow
- Future DB persistence plan (schema sketches)
- Safety and copy rules
- QA / evaluation plan for testing agent outputs
- Phase breakdown (23B, 23C, 23D)
```

### Out of Scope

```txt
- Real AI calls to any provider
- Actual provider API integration code
- Web scraping or news fetching implementation
- Database schema changes or migrations
- Prisma model additions
- Admin UI implementation
- API routes or server-side handlers
- Scheduled job implementation
- Provider API key storage implementation
- Provider secret management implementation
- Production scoring changes
- Real prompt training or fine-tuning
- Production database reads/writes
```

---

## C. Agent Execution Model

The intended future execution flow:

```
User or Scheduled Job
  ↓
Admin Scan Button / Scheduled Daily Job
  ↓
Load Active AI Provider Config
  (provider name, model, endpoint, API key reference)
  ↓
Load Active Prompt Version
  (system prompt, user template, schema version, safety rules)
  ↓
Load Active Source Registry
  (which sources to search, credibility tiers, keywords, refresh cadence)
  ↓
Optionally Load DB Universe Context
  (active stock list, current scores, analyst data for enrichment)
  ↓
Run AI Agent
  (process sources, generate candidates, structure output)
  ↓
Validate Structured Output
  (schema conformance, required fields, evidence quality)
  ↓
Persist Scan Result to DB
  (RadarScan, RadarCandidate, RadarEvidence records — Phase 23C)
  ↓
/opportunity-radar Reads DB Results
  (displays candidates from persisted scan)
```

### Key Architectural Rules

- The **UI must never call the AI agent directly**.
- The **UI must never call external providers or web sources directly**.
- The **agent runs server-side only**, initiated from Admin or scheduled jobs.
- All **future production reads are DB-backed**, following the existing FomoFilter architecture rule.
- The **agent is stateless**: it produces a scan result that is stored independently.

---

## D. Manual First, Scheduled Later

The rollout is incremental:

```txt
Phase 23B (current):
  Design, specification, and planning only.
  No implementation.

Phase 23C:
  DB schema for radar scans, candidates, evidence, provider config, source registry, prompt versions.
  Manual Admin Scan button.
  Server-side agent execution from Admin route.
  Result persistence in DB.
  /opportunity-radar page reads DB scan results.

Phase 23D (future):
  Scheduled daily scan trigger.
  Monitoring and alerting for scan health.
  Possible integration with Scanner / Watchlist / Alerts.
```

---

## E. Admin AI Provider Configuration

Define future admin-managed provider configuration.

**Purpose:**
Allow changing AI provider/model without code deployment.

**Configuration Fields (Design Only):**

```typescript
type AdminAIProviderConfig = {
  // Identification
  id: string;
  providerName: "OpenAI" | "Anthropic" | "Google" | "xAI" | "Custom";
  displayName: string;           // e.g., "GPT-4o", "Claude 3.5 Sonnet"
  
  // Connection
  baseUrl?: string;              // e.g., "https://api.openai.com/v1"
  endpoint?: string;             // provider-specific endpoint name
  apiKeyReference?: string;       // e.g., "env:OPENAI_API_KEY" or encrypted DB reference
  
  // Model
  modelName: string;             // exact model ID (e.g., "gpt-4o-2024-11-20")
  
  // Control
  isActive: boolean;             // only one provider active at a time
  priority?: number;             // fallback order if multi-provider in future
  
  // Tuning
  maxTokens?: number;            // output limit
  temperature?: number;          // 0.0–1.0, controls randomness
  
  // Limits
  timeoutMs?: number;            // request timeout
  costLimitPerRun?: number;      // max cost budget per scan
  
  // Feature Control
  enabledForRadar: boolean;       // can be used for Radar agent scans
  
  // Metadata
  notes?: string;
  lastTestedAt?: Date;
  testStatus?: "untested" | "success" | "failed";
  createdAt: Date;
  updatedAt: Date;
};
```

**Security Requirements (Design Only):**

```txt
- Do not store raw API keys in plain text in database.
- Prefer encrypted storage or environment variable references.
- Admin UI should mask keys on display (show only last 4 chars, e.g., "...KEY9xyz").
- Future Admin UI should support "Test Connection" behavior to validate key without exposing it.
- Audit logs should track who changed provider config and when.
- Provider calls must run server-side only.
- Keys must not be sent to client components.
- Consider using a secrets management system (e.g., AWS Secrets Manager, HashiCorp Vault) for production.
```

---

## F. Source Registry Configuration

Define editable source registry for future implementation.

**Purpose:**
Allow changing agent sources without code deployment.

**Configuration Fields (Design Only):**

```typescript
type AdminSourceRegistry = {
  // Identification
  id: string;
  sourceName: string;           // e.g., "TechCrunch", "Seeking Alpha", "Reddit WSB"
  
  // Type and Location
  sourceType:
    | "news_site"               // TechCrunch, Ars Technica
    | "finance_site"            // Yahoo Finance, Seeking Alpha
    | "blog"                    // Individual financial blogs
    | "newsletter"              // Substack, Quora, etc.
    | "rss"                     // RSS feeds
    | "social"                  // Twitter/X, Reddit
    | "analyst_site"            // Analyst research
    | "internal_watchlist"      // FomoFilter watchlist candidates
    | "custom_url";
  
  url?: string;                 // source URL (for web sources)
  
  // Control
  enabled: boolean;             // active in current scans
  
  // Quality and Trust
  credibilityTier:
    | "primary"                 // high-quality source (analyst, major publication)
    | "secondary"               // established media (regular news)
    | "tertiary"                // community/social (user-generated)
    | "experimental";           // new or unproven source
  
  // Content Focus
  categoryFocus?: string[];     // e.g., ["tech", "growth", "biotech"]
  includeKeywords?: string[];   // e.g., ["earnings", "breakout", "insider"]
  excludeKeywords?: string[];   // e.g., ["fake", "spam"]
  
  // Usage Rules
  allowedUse:
    | "scan"                    // used in main Opportunity Radar scans
    | "evidence"                // can provide evidence/citations only
    | "discovery_only";         // exploratory, not persisted
  
  // Monitoring
  refreshCadence?:
    | "realtime"
    | "hourly"
    | "daily"
    | "weekly"
    | "manual";
  lastCheckedAt?: Date;
  failureCount?: number;
  
  // Metadata
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
};
```

**Implementation Considerations (Design Only):**

```txt
- Some sources (RSS, custom URLs) may be fetched directly.
- Some sources (Twitter, Reddit) may require scraping or API access.
- Some sources (news sites) may require permission or terms compliance.
- Phase 23C/23D will decide how each source is fetched.
- Registry should separate data from fetching mechanism.
- Credibility tier informs confidence scoring and evidence weighting.
- allowedUse field prevents accidental misuse (e.g., don't cite user blogs as primary evidence).
```

---

## G. Prompt Management

Define editable prompt versioning for future implementation.

**Purpose:**
Allow prompt changes without code deployment.
Enable A/B testing of different prompt approaches.
Track which prompt was used for each scan.

**Configuration Fields (Design Only):**

```typescript
type AdminPromptVersion = {
  // Identification
  id: string;
  promptName: string;           // e.g., "Radar Candidate Generator v1"
  promptVersion: string;        // e.g., "1.0", "1.1"
  
  // Content
  systemPrompt: string;         // instructions for the AI
  userPromptTemplate: string;   // template with {{placeholders}} for dynamic data
  
  // Output Contract
  outputSchemaVersion: string;  // e.g., "1.0" (matches output schema versioning)
  
  // Control
  isActive: boolean;            // only one prompt active at a time
  
  // Compatibility
  modelCompatibility?: string[]; // e.g., ["gpt-4o", "gpt-4-turbo"] (optional compatibility note)
  
  // Metadata
  createdBy?: string;
  createdAt: Date;
  notes?: string;
  evaluationStatus:
    | "draft"
    | "in_testing"
    | "approved"
    | "archived";
};
```

**Prompt Rules (Design Only):**

```txt
- Prompt must forbid buy/sell recommendations. Add explicit safety clause.
- Prompt must enforce structured JSON output conformance.
- Prompt must require uncertainty and evidence quality flags in output.
- Prompt must cite sources for each claim.
- Prompt must explicitly prohibit hallucination and explain consequence.
- Prompt should use cautious research language (worth reviewing, may be worth monitoring).
- Prompt changes should be versioned with review history.
- Each scan result should store promptVersion used so results are reproducible.
- Admin UI should support prompt editing with version control.
- Prompt editing should be admin-only.
```

---

## H. AI Provider / Model Evaluation Framework

Create a framework to evaluate and compare AI providers and models for Opportunity Radar agent tasks.

**Providers to Evaluate:**

1. **OpenAI**
   - Models: GPT-4o, GPT-4 Turbo, GPT-4, others

2. **Anthropic Claude**
   - Models: Claude 3.5 Sonnet, Claude 3 Opus, Claude 3 Haiku, others

3. **Google Gemini**
   - Models: Gemini 2.0 Flash, Gemini 1.5 Pro, Gemini 1.5 Flash, others

4. **xAI Grok**
   - Models: Grok-3, Grok-2, others

**Evaluation Dimensions:**

| Dimension | Rationale | Notes |
| --- | --- | --- |
| **Structured JSON Reliability** | Output must parse perfectly | How often does output conform to schema? No hallucination of extra fields? |
| **Web/Search Capability** | Agent needs current market signals | Can the model access real-time web data or current market info? Integration complexity? |
| **Financial Reasoning Quality** | Agent discusses stocks and markets | Quality of financial analysis, sector knowledge, catalyst identification |
| **Hallucination Control** | Must not invent facts | Rate of made-up company info, fake catalysts, confidence calibration |
| **Citation / Evidence Handling** | Must cite sources | Quality and accuracy of source attribution. Does it cite real URLs? |
| **Long-Context Capability** | Agent processes source registry + candidates | Can it handle 100K+ tokens? How much source data can it ingest? |
| **Cost Per Scan** | Budget constraint | Dollars per run for a full daily scan (100–1000 candidates) |
| **Latency** | User experience | Time to first token, time to completion for typical run |
| **Rate Limits** | Availability | Requests per minute, tokens per day, concurrent request limits |
| **Tool/Function Calling** | Future integration patterns | Does model support structured outputs, function definitions? |
| **Safety / Compliance Behavior** | Responsible use | Does it refuse certain market content? How strict is the safety filter? |
| **Ease of Server-Side Integration** | Engineering lift | SDK quality, documentation, error handling, retry logic |
| **Vendor Lock-In Risk** | Strategic concern | Is the API stable? Is there a self-hosted option? Migration effort if switching? |

**Important Notes:**

```txt
⚠️ CRITICAL: Model names and pricing must be verified against official provider documentation 
            before implementation. This spec lists examples only. 
            Do not assume prices or model availability without checking official sources.

Prices change frequently. Cost estimates should be refreshed quarterly.

Model capabilities change with updates. Evaluation should be re-run before major releases.

Use official benchmarks (HellaSwag, MATH, HumanEval, Financial Reasoning datasets) if available.
```

**Evaluation Process (Design Only):**

```txt
1. Create test prompts in Phase 23B.
2. Run same prompt against multiple providers/models with same source data.
3. Parse structured output from each provider.
4. Compare:
   - Candidate quality (relevance, accuracy, usefulness)
   - Duplicate rate across providers
   - Hallucination rate (invented companies, fake catalysts)
   - Evidence usability (quality of citations)
   - Cost per run
   - Latency (time to completion)
5. Manual review scoring rubric (Phase 23B draft).
6. Save test outputs for reproducible comparison.
7. Select provider/model based on tradeoff analysis.
```

### Phase 23B-2 Provider / Model Research Decision

**Status:** Product research completed and documented. No code implementation.

Phase 23B-2 compared real Opportunity Radar-style outputs from:

```txt
Claude Sonnet 4.6
OpenAI GPT 5.4
Google Gemini
xAI Grok
```

The test used the real-agent benchmark direction: each model was asked to search public sources and return structured Opportunity Radar candidates. The user did not manually prepare source packs. This better reflects the desired product workflow, where the agent searches, filters, and returns research candidates.

**Important Test Conditions:**

```txt
- Search was enabled in the tested environments.
- Claude Sonnet 4.6 was significantly slower than the other models.
- Latency is not a primary blocker because the Radar scan is expected to run once daily.
- All models should be treated as normal/default thinking effort unless explicitly configured otherwise.
- Grok was tested using a free / fast model, so it should not be considered a fair production-quality comparison against paid Claude/OpenAI models.
- Prompt-declared thinkingEffort values in some benchmark JSON outputs may not reflect the real execution settings and should not be used as ground truth.
```

**Observed Quality Ranking:**

| Rank | Model | Product Decision | Notes |
| ---: | --- | --- | --- |
| 1 | Claude Sonnet 4.6 | Primary quality candidate for Phase 23C MVP | Best overall candidate quality, strongest narrative depth, best concerns/rejected-candidate reasoning. Slow, but acceptable for daily scan. |
| 2 | OpenAI GPT 5.4 | Strong fallback / comparison model | Clean, conservative, good evidence quality. Needs stricter schema validation because one run used 0–10 style scores where 0–100 was requested. |
| 3 | Grok free/fast | Experimental; retest only with paid/high-quality Grok before production conclusions | Found some differentiated names, but free/fast test is not comparable. JSON/schema compliance and depth require retesting. |
| 4 | Gemini | Deprioritized as primary model based on this benchmark | Returned fewer candidates and showed weaker breadth/quality relative to Claude and GPT in this test. May remain useful for grounding/cost experiments. |

**Primary Model Recommendation:**

```txt
Default Provider Candidate for Phase 23C MVP: Anthropic Claude Sonnet 4.6
Fallback Provider Candidate: OpenAI GPT 5.4
Experimental / Retest Later: paid xAI Grok model
Deprioritized for MVP Default: Gemini
```

**Why Claude Sonnet 4.6 Leads:**

```txt
- Best qualitative stock-selection output from user testing.
- Strongest explanations for why candidates appeared now.
- Better handling of concerns, uncertainty, and rejected candidates.
- Better fit for research-first, narrative-heavy Opportunity Radar output.
- Slower latency is acceptable because the scan is daily / admin-triggered, not interactive UI.
```

**GPT 5.4 Role:**

```txt
GPT 5.4 should remain the first fallback and benchmark model.
It produced good, structured results and used strong evidence, but schema enforcement must be stricter.
Validation must reject or normalize outputs that use 0–10 scoring when the schema requires 0–100.
```

**Grok Role:**

```txt
The Grok result should not be used to reject or approve Grok as a production candidate because it was produced with a free/fast model.
Grok remains interesting for attention/social/buzz discovery, but it should be retested later with a paid production-capable model and explicit schema constraints.
```

**Gemini Role:**

```txt
Gemini remains a possible grounding/search or low-cost candidate, but it is not the primary MVP model based on the current benchmark.
It should not block Phase 23C if Claude and GPT cover quality and fallback needs.
```

**Product Weighting Decision:**

```txt
Quality of candidates is more important than latency or lowest cost.
Daily scan latency is acceptable if output quality is meaningfully better.
Phase 23C should start with a single active provider, not multi-provider production routing.
Admin/provider configuration should still support switching provider/model without code changes.
```

**Implementation Consequences for Phase 23C:**

```txt
- Build provider adapter architecture, but run one active provider by default.
- Configure Claude Sonnet 4.6 as the default candidate if API/tooling supports the required search/source pipeline.
- Keep GPT 5.4 as fallback / comparison.
- Do not build multi-provider consensus, voting, or ensemble logic in the MVP.
- Add output validation for score ranges, enum values, prohibited language, and evidence presence.
- If Claude API execution lacks native web search in the chosen runtime, Phase 23C must provide a server-side source/search pipeline that feeds source material into Claude.
```

**Benchmark Prompt Adjustment:**

Future benchmark and production prompts must explicitly enforce:

```txt
Use scores from 0 to 100 only.
Do not use 0–10 scoring.
Example: attentionScore: 85, confidenceScore: 72, hypeRiskScore: 41.
```

Provider metadata should distinguish configured prompt labels from actual runtime settings:

```ts
type ProviderBenchmarkMetadata = {
  provider: string;
  model: string;
  actualThinkingEffort: "default" | "regular" | "high" | "extended" | "fast" | "free";
  promptDeclaredThinkingEffort?: string;
  searchEnabled: boolean;
  notes?: string;
};
```

---

## I. Agent Input Design

Define what the agent receives when it runs.

**Inputs (Design Only):**

```typescript
type RadarAgentInput = {
  // Execution Context
  scanDate: Date;                   // when the scan runs
  scanId: string;                   // unique scan identifier
  
  // Time Window
  timeWindow:
    | "24h"                         // last 24 hours
    | "7d"                          // last 7 days
    | "30d"                         // last 30 days
    | "custom";
  customWindowDays?: number;        // if timeWindow = "custom"
  
  // Sources and Configuration
  activeSourceRegistry: AdminSourceRegistry[];
  activePromptVersion: AdminPromptVersion;
  activeProviderConfig: AdminAIProviderConfig;
  
  // Optional DB Context
  // (included only if agent is enriching candidates against DB universe)
  dbUniverse?: {
    stocks: {
      ticker: string;
      companyName: string;
      sector: string;
      currentPrice?: number;
      priceChange1W?: number;
      analystUpside?: number;
      analystRating?: string;
      opportunityScore?: number;
      fundamentalScore?: number;
      valuationScore?: number;
      stabilityScore?: number;
      isWatchlisted?: boolean;
      hasAlerts?: boolean;
    }[];
  };
};
```

**Design Decision: Cold Start vs. Warm Start**

Two approaches exist:

1. **Cold Start (Agent Scans Web First)**
   - Agent searches all active sources for interesting candidates.
   - Agent generates candidates from web signals alone.
   - In Phase 23C, optionally cross-reference candidates against DB universe.
   - Advantage: discovers candidates not in DB.
   - Disadvantage: may include illiquid stocks, delisted symbols, no FomoFilter validation.

2. **Warm Start (Agent Enriches DB Universe)**
   - Agent receives list of DB-backed stocks.
   - Agent researches each stock for recent signals.
   - Agent produces radar candidates for DB stocks only.
   - Advantage: all candidates are known, validated, in DB.
   - Disadvantage: misses emerging/new candidates not yet in DB.

**Recommendation:**
Start with **Warm Start** in Phase 23C. Cold Start can be added later after 23C stabilizes.

Both approaches should be documented as options in Phase 23B.

---

## J. Agent Output Schema

Define required structured output.

**Output Schema (Design Only):**

```typescript
type RadarScanOutput = {
  // Metadata
  scanId: string;
  scanDate: Date;
  provider: string;               // "OpenAI" | "Anthropic" | "Google" | "xAI"
  model: string;                  // exact model name
  promptVersion: string;          // which prompt was used
  timeWindow: string;             // "24h" | "7d" | "30d" | "custom"
  
  // Results
  candidates: RadarCandidateOutput[];
  
  // Quality Flags
  totalProcessed: number;         // total source items processed
  totalGenerated: number;         // total candidate outputs
  validOutputCount: number;       // after schema validation
  rejectedCount: number;          // failed validation
  executionTimeMs: number;        // agent execution duration
  tokenUsage?: {
    prompt: number;
    completion: number;
    total: number;
  };
  costEstimate?: number;          // USD cost of this run
};

type RadarCandidateOutput = {
  // Identification
  ticker: string;
  companyName: string;
  
  // Radar Lens (assigned by agent)
  radarLens:
    | "attention_spike"
    | "overreaction"
    | "value_gap"
    | "future_theme";
  detailedCategory: string;       // e.g., "unusual_attention", "beaten_down", "emerging_theme"
  
  // Narrative
  headline: string;               // one-line summary
  radarBullets: string[];         // 3 key signals
  thesis: string;                 // detailed investment thesis
  whyNow: string;                 // catalyst / timing explanation
  mainCatalyst: string;           // primary reason for appearance
  
  // What to Review
  whatLooksInteresting: string[]; // bullish signals / opportunities
  keyConcerns: string[];          // bearish signals / risks
  nextCheck: string;              // what to verify next
  
  // Evidence
  sourceEvidence: {
    sourceName: string;
    sourceType: string;           // news_site, finance_site, social, etc.
    url?: string;
    title?: string;
    publishedAt?: Date;
    snippet: string;              // excerpt or summary
    credibilityTier: "primary" | "secondary" | "tertiary" | "experimental";
    relevanceScore: number;       // 0–100, agent's confidence in relevance
  }[];
  
  // Scoring (Agent Assessment)
  attentionScore: number;         // 0–100: how much signal activity?
  confidenceScore: number;        // 0–100: how confident is this candidate?
  hypeRiskScore: number;          // 0–100: how much pure hype vs. substance?
  
  // Aggregate Radar Signals
  radarSignalStrength: number;    // 0–100: overall signal strength
  radarConvictionScore: number;   // 0–100: agent's conviction this is worth researching
  sourceQualityScore: number;     // 0–100: quality of evidence sources
  manipulationRiskScore: number;  // 0–100: risk of pump/manipulation
  
  // History Simulation (for future Phase 23C+)
  trendStatus:
    | "new_today"
    | "repeated"
    | "back_on_radar"
    | "cooling_down";
  appearancesLast7Days: number;
  appearancesLast30Days: number;
  
  // Tags and Metadata
  tags: string[];                 // e.g., ["biotech", "AI", "earnings_pending"]
  
  // Rejection (optional)
  disqualifiedReason?: string;    // if candidate was rejected before output
};
```

**Schema Notes:**

```txt
- All text fields must follow research-focused language rules (no buy/sell).
- Scores must be integers 0–100 (no decimals).
- Evidence array must have at least one source.
- ticker and companyName must be non-null and non-empty.
- radarLens must be one of the four approved lenses.
- whyNow must explain the timing/catalyst.
```

---

## K. Radar Lens Mapping

Use the approved Phase 23A lens model.

**The Four Radar Lenses:**

| Lens | Meaning | Signal | Example Categories |
| --- | --- | --- | --- |
| **Attention Spike** | Unusual activity spike | Volume, search interest, social media activity, coverage surge | unusual_attention, pre_breakout |
| **Overreaction** | Sharp declines seem overdone | Large single-day/week down move, panic selling | beaten_down, possible_overreaction |
| **Value Gap** | Valuation disconnect | Stock price low vs. business quality, ratio arbitrage | possibly_undervalued |
| **Future Theme** | Emerging sector/narrative | Connected to rising macro trend, new technology | emerging_theme, speculative_upside |

**Agent Responsibility (Design Only):**

```txt
- Agent receives active source data.
- Agent identifies which lens each candidate belongs to.
- Agent assigns a single primary lens per candidate.
- Agent must explain why the candidate fits that lens.
- Agent must cite evidence for the lens assignment.
```

---

## L. Scoring Concepts (Design Only)

Define scoring as **future design only**, not current production scoring.

**Radar Conviction Scores:**

These are **agent assessment scores**, not production DB scores.

```txt
attentionScore (0–100)
  Meaning: How much signal activity or buzz?
  Inputs: source volume, social mentions, analyst attention
  
confidenceScore (0–100)
  Meaning: How confident is the agent that this is real?
  Inputs: evidence quality, citation diversity, analyst backing
  
hypeRiskScore (0–100)
  Meaning: How much is pure hype vs. substance?
  Inputs: source credibility mix, keyword inflation, pump indicators
  
radarSignalStrength (0–100)
  Meaning: Aggregate signal strength across all lenses.
  Inputs: combination of above scores
  
radarConvictionScore (0–100)
  Meaning: Agent's conviction this is worth researching.
  Inputs: signal strength + confidence - hype risk
  
sourceQualityScore (0–100)
  Meaning: Quality of evidence sources.
  Inputs: credibility tier distribution, URL validity
  
manipulationRiskScore (0–100)
  Meaning: Risk of coordinated hype / pump scheme.
  Inputs: source patterns, language patterns, timing patterns
```

**Important Clarifications:**

```txt
- These radar scores are NOT production scores.
- They do NOT replace or compete with Opportunity Score or Fundamental Score.
- They are agent assessment scores only.
- They exist only in scan output and future DB RadarCandidate records.
- Production scoring (Opportunity Score, Fundamental Score) remains unchanged and DB-backed.
- In Phase 23C+, radar scores can be persisted in DB for future features.
- Radar scores are informational for QA and debugging, not user-facing initially.
```

---

## M. Safety and Language Rules

The agent output must enforce responsible research language.

**Prohibited Language:**

```txt
"buy"                           // → "worth reviewing"
"sell"                          // → "caution warranted"
"guaranteed upside"             // → "analyst targets suggest"
"safe investment"               // → "lower-risk candidate"
"will go up"                    // → "signals suggest upside potential"
"best stock to buy"             // → "research candidate worth monitoring"
"strong buy"                    // → "favorable signal pattern"
"underperform"                  // → "thesis requires validation"
"outperform"                    // → "signals are positive"
```

**Required Language Patterns:**

```txt
"research candidate"
"worth reviewing"
"requires independent validation"
"may be worth a closer look"
"signals suggest"
"possible opportunity"
"worth monitoring"
"potential setup"
"analyst targets suggest"
"data indicates"
```

**Safety Mechanisms (Design Only):**

```txt
- Prompt must explicitly forbid buy/sell recommendations.
- Output validation must scan for prohibited keywords and reject if found.
- Prompt should require evidence for every claim (no hallucination).
- Prompt should calibrate uncertainty ("possible" vs. "likely" vs. "confirmed").
- System prompt should include explicit constraint: "You are not a financial advisor."
```

---

## N. Disqualification Rules

Define when a candidate should be rejected.

**Automatic Disqualifications (Design Only):**

```txt
✗ No clear catalyst or reason for appearance
  (signal is unexplained or vague)

✗ Pure hype without evidence
  (only social media mentions, no institutional backing)

✗ Penny stock or illiquid micro-cap (if excluded by policy)
  (ticker not in DB, market cap < $500M, average volume < 100k)

✗ Unverifiable ticker
  (symbol does not match real company or is delisted)

✗ Low-quality source only
  (all evidence from tertiary/experimental sources)

✗ Manipulation / pump risk too high
  (manipulationRiskScore > 80)

✗ Stale news misrepresented as new
  (headline date is 30+ days old but labeled as "today")
```

---

## O. Evaluation / QA Plan

Define how to test the agent before production use.

**Testing Approach (Design Only):**

```txt
Phase 23B: Create test framework and rubric (no implementation).

Phase 23C: 
  1. Run same prompt on multiple providers/models
  2. Collect outputs for same source data
  3. Compare structured output validity
  4. Count duplicates across providers
  5. Count hallucinations (invented companies, catalysts)
  6. Assess evidence usefulness and accuracy
  7. Assess candidate quality and relevance
  8. Measure cost per run
  9. Measure latency
 10. Manual review scoring using rubric
 11. Save test outputs for documentation
```

**Manual Review Rubric (Phase 23B Design):**

```
Each candidate rated on 5-point scale (5=excellent, 1=unusable):

Relevance: Is this candidate actually interesting and researchable?
Evidence: Are sources real? Are citations accurate?
Clarity: Is the thesis clear and well-explained?
Caution: Is language appropriately cautious (no buy/sell)?
Completeness: Does it include all required fields?
Lens Fit: Does the assigned lens make sense?
Catalyst: Is the "why now" clear and time-sensitive?
Risk Assessment: Are concerns and risks honestly discussed?
Feasibility: Can a human researcher validate this quickly?
Calibration: Does confidence score match evidence quality?

Overall Score = average of 10 dimensions
Acceptable = 4.0+
```

**Comparison Process (Design Only):**

```
For each provider/model tested:

Provider: OpenAI GPT-4o
Model Version: gpt-4o-2024-11-20
Cost per run: $X.XX
Latency: Y seconds
Candidates generated: N
Duplicates vs OpenAI: M%
Hallucination rate: P%
Manual review score: Q/5.0
Notes: ...
```

---

## P. Phase Breakdown

Define implementation phases for Opportunity Radar AI capability.

### Phase 23B (Current)

```txt
Goal:      Design and specify the AI agent system
Status:    Planning / Documentation only
Scope:     Spec document, evaluation framework, prompt drafts
Output:    Context/Features/opportunity-radar-ai-agent-spec.md
Timeline:  1 phase (docs-only)
Next:      Phase 23B-3 prompt/schema drafting or Phase 23B-4 admin config UX/spec, if approved
```

### Phase 23B-1

```txt
Goal:      Create AI agent spec and update current-feature setup
Scope:     Full spec, phase breakdown, open questions
Output:    Context/Features/opportunity-radar-ai-agent-spec.md (current task)
Timeline:  1 phase (docs-only, no code)
```

### Phase 23B-2 — Provider / Model Research Decision (Completed)

```txt
Goal:      Compare model outputs and document the initial provider decision
Scope:     Real-agent benchmark across Claude Sonnet 4.6, GPT 5.4, Gemini, and Grok
           Evaluate candidate quality, why-now clarity, evidence quality, reasoning, safety, and schema reliability
           Record product decision for Phase 23C MVP provider selection
Output:    Provider decision documented in this spec and feature history
Decision:  Claude Sonnet 4.6 = primary quality candidate
           GPT 5.4 = fallback / benchmark
           Grok = experimental; retest paid model later
           Gemini = deprioritized for MVP default
Constraint: No code, no API integration, no schema changes, no production scoring changes
```

### Phase 23B-3 (Optional, Future)

```txt
Goal:      Prompt and output schema drafting
Scope:     Write production-grade system prompt
           Write user prompt template
           Define output schema in detail
           Draft safety guardrails and validation rules
Output:    Prompt files, schema validation spec
Timeline:  1 phase (drafting / iteration)
```

### Phase 23B-4 (Optional, Future)

```txt
Goal:      Admin config UX/spec for provider/source/prompt management
Scope:     Design Admin Sync / settings screens for:
             - AI provider selection and key storage
             - Source registry CRUD
             - Prompt version management
           Design Test Connection flow
           Design audit logging
Output:    Admin UX spec, wireframes, data model sketches
Timeline:  1 phase (UX/design)
```

### Phase 23C-1 (Future)

```txt
Goal:      DB schema design for radar persistence
Scope:     Prisma models: RadarScan, RadarCandidate, RadarEvidence
           Prisma models: AdminAIProviderConfig, AdminSourceRegistry, AdminPromptVersion
           Relationships and indices
           Migration strategy
Output:    Context/data-model.md updates, Prisma schema
Timeline:  1 phase (schema design)
```

### Phase 23C-2 (Future)

```txt
Goal:      Manual Admin Scan button, server-side execution, result persistence
Scope:     Admin UI button for "Run Radar Scan"
           Server-side agent orchestration logic
           Output validation and error handling
           Result persistence to DB
           Scan history display
Output:    Working manual scan button in Admin
Timeline:  2–3 phases (implementation + QA)
```

### Phase 23C-3 — Opportunity Radar DB Reader (Current)

**Status: Implementation Complete - Awaiting QA and Review**

```txt
Goal:      Opportunity Radar page reads DB scan results instead of mock
Scope:     Server-side data loader (getOpportunityRadarData)
           Query RadarScan records with status="success" from last 30 days
           Include RadarCandidate and RadarEvidence records
           Link Stock/StockScore/StockQuote/StockAnalystData where available
           Normalize to plain objects for client (no Prisma exposure)
           Page component loads data via server-side loader
           Client component converts DB candidates to UI format
           Time window filtering: Today, Yesterday, Last 7 Days, Last 30 Days
           Lens filtering: Attention Spike, Overreaction, Value Gap, Future Theme
           Source mode labeling: "Fixture scan · local test data" or "Claude DB-context scan · no public web search"
           Empty state when no successful scans exist
           No mock data displayed by default
Completed: src/lib/data/opportunity-radar.ts (data loader)
           Updated app/opportunity-radar/page.tsx (loads DB data)
           Updated OpportunityRadarPageClient.tsx (consumes DB data)
           Updated src/types/opportunity-radar.ts (added DB-backed fields)
           Conversion function (DB RadarCandidateView → UI RadarCandidate)
Output:    Working /opportunity-radar connected to DB
Timeline:  1 phase (implementation complete)
```

### Phase 23C-3+ — Tool Use Debug Trace Logging (Current)

**Status: Implementation Complete - Development Debug Infrastructure**

```txt
Goal:      Add development-only debug trace logging for Claude Radar Tool Use flow
Scope:     Development-only debug tracing (RADAR_DEBUG_AI_TRACE=true)
           Debug trace helper module: src/lib/opportunity-radar/radar-debug-trace.ts
           Structured JSON logging of: DB context, API request/response, tool use diagnostics, validation, persistence
           Debug output directory: tmp/radar-debug/ (git-ignored)
           One trace file per Claude scan attempt
           No secrets (API key redacted) in trace files
           Admin result shows debug trace path when available
           Optional full-payload logging (RADAR_DEBUG_FULL_PAYLOAD=true)
           Safe serialization: BigInt, Date, Error objects handled
           Non-blocking: if trace write fails, scan continues
Completed: src/lib/opportunity-radar/radar-debug-trace.ts (trace collector)
           Updated src/lib/opportunity-radar/claude-radar-provider.ts (trace integration)
           Updated src/actions/opportunity-radar-actions.ts (trace lifecycle)
           Updated src/components/admin/SyncPageClient.tsx (display debug trace path)
           Updated .gitignore (tmp/ ignored)
           Created scripts/test-radar-debug-trace.ts (comprehensive test suite)
Output:    Development debug infrastructure for Claude Radar Tool Use diagnostics
Timeline:  1 phase (infrastructure only, no production changes)
Notes:     Use RADAR_DEBUG_AI_TRACE=true in .env to enable
           Debug traces help diagnose Tool Use shape issues without guessing
           Traces are local files only, never committed to repository
```

### Phase 23D (Future)

```txt
Goal:      Scheduled daily scan and monitoring
Scope:     Scheduled job trigger (cron, Lambda, cloud scheduler)
           Automatic daily scan execution
           Monitoring for failures
           Alert on scan health issues
           Optionally: integration with Scanner / Watchlist / Alerts
Output:    Automated daily scanning
Timeline:  2–3 phases (infrastructure + monitoring)
```

---

## Q. Open Questions

These design decisions are deferred to Phase 23C and implementation.

```txt
Q1. Source Registry Implementation:
  - Should source registry support RSS feeds, direct web search, API integration, or all three?
  - How should non-API sources (news sites) be scraped without terms-of-service violations?
  - Should we use a dedicated scraping service or build in-house?

Q2. AI Provider Key Storage:
  - Should provider keys be stored as environment variables only?
  - Or should they be encrypted in the database with secure retrieval?
  - What encryption standard? (AES-256, TweetNaCl, others?)
  - How should key rotation work?

Q3. Multi-Provider Fallback:
  - Should the first production agent use a single provider?
  - Or should we implement fallback logic (try OpenAI, fall back to Anthropic)?
  - What is the cost tradeoff?

Q4. Agent Source Strategy:
  - Should the agent scan the open web first and discover candidates?
  - Or should it start from the DB universe of known stocks?
  - Can we do a hybrid approach (DB stocks + web discovery)?

Q5. Candidate Volume:
  - How many candidates should a daily scan produce?
  - How many should be persisted to DB (top 50? all 100+)?
  - Should failed/low-confidence candidates be stored or discarded?

Q6. Partial Output Handling:
  - If the agent times out or errors mid-run, should we persist partial output?
  - Or should we require complete, validated output before persistence?
  - How should incomplete runs be flagged?

Q7. Evidence URL Requirements:
  - Must every candidate have at least one URL-based source?
  - Or can agent sources (e.g., "social media consensus") count without URLs?
  - How do we validate and archive URLs over time?

Q8. Source Quality Minimum:
  - What is the minimum acceptable source quality tier?
  - Can a candidate be 100% tertiary sources?
  - Should we require at least one "primary" or "secondary" source?

Q9. Admin Configuration Secrets:
  - Should admin users be able to input API keys directly?
  - Or should they manage environment variable names and use a CI/CD system for actual keys?
  - What are the security implications?

Q10. Radar Score Persistence:
  - Should radar scores be stored only for debugging?
  - Or should they be persisted to DB for future feature use (e.g., scoring Opportunity Score)?
  - How should they be versioned with the prompt that generated them?
```

---

## Phase 23B-3 — Opportunity Radar Prompt + Output Schema Draft

### Purpose

Define a production-ready prompt contract and output schema for the Opportunity Radar AI Agent before Phase 23C implementation begins.

This phase documents:
- Production Prompt v1 for Claude Sonnet 4.6 as the primary provider candidate
- Fallback prompt notes for OpenAI GPT 5.4
- Strict JSON output schema v1 with required and optional fields
- Score validation rules and 0–100 integer enforcement
- Evidence validation requirements
- Rejected candidate structure
- Provider metadata structure
- Safety and prohibited language rules
- Output length limits by field
- UI-facing vs. DB-persisted vs. internal-only field classification
- Phase 23C implementation implications

**Important Constraint:** This phase is documentation only. No implementation code. No database changes. No migrations. No provider/AI calls. No Admin UI. No production scoring changes.

---

### A. Purpose Statement

The production prompt must instruct the AI agent to:

```txt
1. Search public sources for stocks that may deserve further research within the last 24–30 hours
2. Return research candidates only, not recommendations or buy/sell advice
3. Avoid buy/sell/hold language entirely
4. Prefer fewer high-quality candidates over weak filler
5. Exclude penny stocks, illiquid microcaps, pure hype, stale stories, and unverifiable claims
6. Assign exactly one radar lens per candidate from the four approved lenses
7. Return valid JSON output conforming to the schema
8. Use 0–100 integer scores only (never 0–10 style)
9. Include at least one evidence item per candidate
10. Include rejected candidates with disqualification reasons
11. Include uncertainty flags and limitations discovered during the search
12. Never invent URLs, article titles, sources, or ticker symbols
13. Use concise, research-focused text suitable for UI display
14. Clearly distinguish evidence-backed claims from interpretations
15. Calibrate confidence and conviction scores to match evidence quality
```

---

### B. Provider Target and Constraints

**Primary Provider:**
- Name: Anthropic
- Model: Claude Sonnet 4.6
- Rationale: Best research-quality output from Phase 23B-2 benchmark. Slower latency acceptable for daily scans.
- Constraint: Prompt must enforce compact JSON fields because Claude output can be verbose.

**Fallback Provider:**
- Name: OpenAI
- Model: GPT 5.4
- Rationale: Strong, conservative output. Good evidence quality.
- Constraint: Must enforce 0–100 score scale strictly. One Phase 23B-2 test run used 0–10 style scores despite 0–100 requirement. Validation must reject or normalize these.

**General Constraints:**
- Prompt must not depend on UI, browser runtime, or client-side execution
- Prompt runs server-side only through Admin button or future scheduled job
- Prompt should assume sources will be provided by Phase 23C infrastructure
- Prompt should not require native web search if the chosen API runtime doesn't support it
- Prompt should be version-controlled and allow admin changes without code deployment

---

### C. Production Prompt v1

```txt
SYSTEM PROMPT:

You are an AI research assistant for FomoFilter, a stock research platform. 
Your role is to identify research candidates — stocks worth further review — based on recent market signals and public sources.

CRITICAL CONSTRAINTS:

1. Research Only, Not Financial Advice
   You must NOT provide buy/sell/hold recommendations.
   You must NOT use language that implies you are a financial advisor.
   Example prohibited phrases: "buy", "sell", "strong buy", "guaranteed upside", "safe investment"
   Example approved phrases: "research candidate", "worth reviewing", "signals suggest", "may be worth a closer look"

2. Structured JSON Output Only
   Your response must be a valid JSON object conforming to the provided schema.
   Do not include markdown, code blocks, explanations, or text outside the JSON.
   The JSON response must be parseable without cleanup or transformation.

3. Score Scale: 0–100 Integers Only
   All score fields must be integers from 0 to 100.
   Do NOT use 0–10 scale.
   Do NOT use decimals or percentages with the % symbol.
   Example: attentionScore: 75 (not 7.5, not 75%)

4. Hallucination Prevention
   Do not invent ticker symbols, company names, URLs, article titles, or dates.
   If you cannot verify a source or ticker, exclude the candidate entirely.
   If uncertain about a fact, include an explicit uncertainty note in the candidate or reject the candidate.

5. Evidence Requirements
   Every candidate must have at least one source citation.
   Each source must include a real URL if the source is web-based.
   If a source cannot provide a URL, mark the sourceQualityScore lower to reflect this limitation.
   Never cite sources that do not exist.

6. Rejected Candidates
   Include rejected candidates in the rejectedCandidates array.
   Explain why each candidate was rejected (e.g., "penny stock", "no clear catalyst", "unverifiable ticker").
   Use the rejectedCandidates section to show your reasoning and safety checks.

7. Radar Lens Assignment
   Assign exactly one radar lens to each candidate from:
     - attention_spike: unusual activity, coverage surge, social mention spike
     - overreaction: sharp declines, panic selling, beaten-down sentiment
     - value_gap: valuation disconnect, ratio arbitrage, quality mismatch
     - future_theme: emerging sector, new narrative, speculative upside
   Justify the lens choice in the thesis and whyNow fields.

8. Time Window Awareness
   Focus on signals from the last 24–30 hours.
   If a story is older than 30 days, only include it if there is a fresh catalyst or development today.
   Explicitly mark "trendStatus" as "cooling_down" for older stories re-appearing.

9. Uncertainty and Limitations
   Calibrate confidence and conviction scores to match evidence quality.
   If evidence is sparse, set confidenceScore and radarConvictionScore lower.
   Include limitations in the agentSelfCheck section.
   Example: "Only 2 sources available for this candidate; would benefit from additional verification."

10. Quality Over Quantity
    Return fewer high-quality candidates (5–10) rather than many weak candidates (20–50).
    If you cannot find substantive candidates, return a smaller list.
    Use rejectedCandidates to show your filtering logic.

OUTPUT SCHEMA:

[Candidate fields as documented in the Phase 23B-3 Output Schema section below]

LANGUAGE TONE:

- Use research-focused language: "potential opportunity", "worth reviewing", "requires further validation"
- Avoid superlatives: not "best stock", but "interesting signal pattern"
- Avoid certainty claims: not "will go up", but "signals suggest upside potential"
- Acknowledge uncertainty: "limited evidence but notable pattern"

EVIDENCE CITATIONS:

- Provide real URLs when possible
- Include publication dates if known
- Include the original snippet or headline as provided by the source
- Classify each source by credibility: primary, secondary, tertiary, experimental

MANIFEST:

Before finalizing your output:
- Check that every candidate has at least one evidence source
- Check that all scores are 0–100 integers
- Check that no prohibited language was used
- Check that tickers are verifiable
- Check that rejected candidates show clear disqualification logic
- Include agentSelfCheck results in the output
```

**User Prompt Template:**

```txt
You are searching for Opportunity Radar research candidates.

Time Window: {{timeWindow}} (e.g., "last 24 hours")
Scan Date: {{scanDate}}

Active Sources:
{{sourceRegistry}}

Recent Market Context:
{{optionalDbUniverse}}

Task:

1. Search the provided sources for interesting stocks.
2. Identify candidates using the four Radar Lenses.
3. Structure each candidate with required fields.
4. Include at least 3–10 candidates if substantive opportunities exist.
5. Include rejected candidates showing why they were excluded.
6. Return valid JSON conforming to the schema.

Return only JSON. No explanations outside the JSON object.
```

---

### D. Output Schema v1

**Top-Level Response Object:**

```typescript
type RadarScanOutput = {
  // Schema metadata
  schemaVersion: string;              // e.g., "1.0"
  scanDate: string;                   // ISO 8601 date-time, e.g., "2026-06-07T14:30:00Z"
  timeWindow: string;                 // e.g., "24h", "7d", "30d", "custom"
  
  // Provider metadata
  providerMetadata: {
    provider: string;                 // "Anthropic" | "OpenAI" | "Google" | "xAI"
    model: string;                    // exact model name, e.g., "claude-sonnet-4.6", "gpt-5.4"
    actualThinkingEffort?: string;    // "default" | "regular" | "high" | "extended"
    promptDeclaredThinkingEffort?: string; // what the prompt config said
    searchEnabled: boolean;            // was web search used?
    sourceMode: string;               // "live_search" | "provided_sources" | "hybrid"
    notes?: string;                   // any runtime notes (e.g., "search rate limited")
  };
  
  // Summary
  summary: {
    headline: string;                 // brief scan summary
    candidateCount: number;
    rejectedCount: number;
    topTheme: string;                 // highest-priority theme, e.g., "AI-related earnings catalysts"
  };
  
  // Main results
  candidates: RadarCandidate[];
  rejectedCandidates: RejectedCandidate[];
  
  // Agent self-check
  agentSelfCheck: {
    jsonValid: boolean;               // did output validate against schema?
    noBuySellLanguage: boolean;       // no prohibited financial language?
    allCandidatesHaveEvidence: boolean; // every candidate has ≥1 evidence?
    allScoresUseZeroToHundred: boolean; // all scores 0–100 integers?
    uncertaintyDisclosed: boolean;    // agent noted limitations?
    possibleWeaknesses: string[];     // list of identified weaknesses
  };
};

type RadarCandidate = {
  // Identification
  ticker: string;                     // non-empty, verified symbol
  companyName: string;                // non-empty legal name
  
  // Radar lens
  radarLens: "attention_spike" | "overreaction" | "value_gap" | "future_theme";
  detailedCategory: string;           // e.g., "unusual_attention", "beaten_down", "emerging_theme"
  
  // Narrative
  headline: string;                   // max 140 chars, one-line summary
  radarBullets: string[];             // 3 key signals, max 120 chars each
  thesis: string;                     // max 500 chars, detailed investment case
  whyNow: string;                     // max 350 chars, catalyst / timing explanation
  mainCatalyst: string;               // max 180 chars, primary reason for appearance
  
  // Review guidance
  whatLooksInteresting: string[];     // 2–4 bullish signals, max 160 chars each
  keyConcerns: string[];              // 2–4 bearish signals / risks, max 160 chars each
  nextCheck: string;                  // max 180 chars, what to verify next
  
  // Evidence
  sourceEvidence: {
    sourceName: string;               // e.g., "TechCrunch", "Yahoo Finance", "Seeking Alpha"
    sourceType: string;               // "news_site" | "finance_site" | "blog" | "social" | "analyst" | "rss"
    url?: string;                     // web URL if available; null if source cannot expose URL
    title?: string;                   // article headline if available
    publishedAt?: string;             // ISO 8601 date if known
    snippet: string;                  // excerpt or summary, max 250 chars
    credibilityTier: "primary" | "secondary" | "tertiary" | "experimental";
    relevanceScore: number;           // 0–100, agent's confidence in relevance
  }[];
  
  // Radar scoring (agent assessment, not DB-backed production scores)
  attentionScore: number;             // 0–100: signal volume / activity level
  confidenceScore: number;            // 0–100: confidence this is real / verified
  hypeRiskScore: number;              // 0–100: pure hype vs. substance (higher = more hype)
  
  // Aggregate radar signals
  radarSignalStrength: number;        // 0–100: combined signal strength across lenses
  radarConvictionScore: number;       // 0–100: agent's conviction worth researching
  sourceQualityScore: number;         // 0–100: quality of evidence sources
  manipulationRiskScore: number;      // 0–100: risk of pump/scheme (higher = more risk)
  
  // Trend context
  trendStatus: "new_today" | "repeated" | "back_on_radar" | "cooling_down";
  appearancesLast7Days?: number;      // count of mentions in last 7 days
  appearancesLast30Days?: number;     // count of mentions in last 30 days
  
  // Tags
  tags: string[];                     // e.g., ["AI", "earnings_pending", "CEO_change"]
};

type RejectedCandidate = {
  ticker: string;                     // symbol (if known)
  companyName?: string;               // name (if known)
  reason: string;                     // disqualification reason
  evidenceSummary?: string;           // brief note on what was found
};
```

---

### E. Validation Rules for Phase 23C

**JSON Conformance:**
- Output must parse without cleanup
- No trailing commas
- All required fields present
- No extra undefined fields

**Schema Version Matching:**
- schemaVersion must equal the expected version (e.g., "1.0")
- Reject outputs if version mismatch

**Candidate Array Limits:**
- Maximum 10 candidates per scan (to avoid noise)
- Minimum 1 candidate (if substantive opportunities found)
- If fewer than 3 candidates found, include notes explaining why

**Radar Lens Enum:**
- radarLens must be one of: `attention_spike`, `overreaction`, `value_gap`, `future_theme`
- Reject if other value

**Score Validation (Critical):**
- All numeric score fields must be integers
- All numeric score fields must be in range [0, 100]
- Reject output if any score uses 0–10 style
- Reject output if any score is a decimal or has % suffix

**Evidence Validation:**
- Each candidate must have `sourceEvidence.length >= 1`
- Each evidence item must have `sourceName`, `sourceType`, `snippet`
- Each evidence item must have `credibilityTier` matching approved enum
- If `url` is null, set `sourceQualityScore` lower and document why
- Reject candidates if all evidence sources are marked "experimental"

**Ticker and Company Name:**
- Both must be non-empty strings
- Both should be verifiable against a ticker database
- Consider rejecting if ticker cannot be verified against live ticker API

**Prohibited Language Scan:**
- Scan headline, thesis, radarBullets, whatLooksInteresting, keyConcerns for prohibited words:
  - "buy", "sell", "strong buy", "underperform", "outperform", "guaranteed upside", "safe investment", "will go up"
- If any prohibited word found, reject output or mark as unsafe

**Trend Status Enum:**
- trendStatus must be one of: `new_today`, `repeated`, `back_on_radar`, `cooling_down`
- Reject if other value

**Text Field Length Limits:**
- See Section F below for exact limits

---

### F. Suggested Text Length Limits

These limits are guidelines to keep output UI-friendly. Enforce as soft limits or hard limits based on Phase 23C's choice.

| Field | Max Length | Notes |
| --- | --- | --- |
| headline | 140 characters | One-line summary for card title |
| radarBullets (each) | 120 characters | 3 key signals, displayed as bullet list |
| thesis | 500 characters | Detailed case, fits in Intel Brief panel |
| whyNow | 350 characters | Catalyst / timing explanation |
| mainCatalyst | 180 characters | Primary reason for appearance |
| whatLooksInteresting (each) | 160 characters | Bullish signal; typically 2–4 items |
| keyConcerns (each) | 160 characters | Risk / concern; typically 2–4 items |
| nextCheck | 180 characters | What to verify next |
| snippet (in evidence) | 250 characters | Excerpt from source |
| detailedCategory | 100 characters | Specific category within lens |
| sourceName | 100 characters | Publication / source name |
| tags (each) | 50 characters | E.g., "AI", "earnings_pending" |

---

### G. Field Classification Table

This table clarifies which fields are persisted to DB, shown in UI, or internal-only.

| Field | Purpose | Future DB Persisted? | UI-facing? | Internal QA Only? |
| --- | --- | --- | --- | --- |
| **radarLens** | Primary category | Yes | Yes (filter/tab) | No |
| **headline** | Card title | Yes | Yes | No |
| **radarBullets** | Key signals | Yes | Yes (card content) | No |
| **thesis** | Detailed case | Yes | Yes (Intel Brief) | No |
| **whyNow** | Catalyst/timing | Yes | Yes (Intel Brief) | No |
| **mainCatalyst** | Primary reason | Yes | Yes (Intel Brief) | No |
| **whatLooksInteresting** | Bullish signals | Yes | Yes (Intel Brief) | No |
| **keyConcerns** | Risks | Yes | Yes (Intel Brief) | No |
| **nextCheck** | Verification steps | Yes | Yes (Intel Brief) | No |
| **sourceEvidence** | Citations | Yes | Yes (footnotes/links) | No |
| **attentionScore** | Signal volume | Maybe | No | Yes (debug only) |
| **confidenceScore** | Verification confidence | Maybe | No | Yes (debug only) |
| **hypeRiskScore** | Hype vs. substance | Maybe | No | Yes (debug only) |
| **radarSignalStrength** | Aggregate strength | Maybe | No | Yes (debug only) |
| **radarConvictionScore** | Research conviction | Maybe | Possibly (future) | No |
| **sourceQualityScore** | Evidence quality | Maybe | No | Yes (debug only) |
| **manipulationRiskScore** | Pump/scheme risk | Maybe | No | Yes (debug only) |
| **providerMetadata** | AI provider details | Yes (audit trail) | No | Yes (debugging) |
| **agentSelfCheck** | Validation status | Yes (audit trail) | No | Yes (QA) |
| **rejectedCandidates** | Disqualified candidates | Maybe | No | Yes (QA/transparency) |
| **trendStatus** | Recurrence pattern | Yes | Possibly (future) | No |
| **appearancesLast7Days** | Historical mention count | Yes | Possibly (future) | No |
| **tags** | Categorical labels | Yes | Possibly (filter) | No |

---

### H. Score Clarification

**What Radar Scores Are:**

```txt
Radar scores are agent assessment scores generated by the AI during the scan.
They represent the agent's opinion about signal quality, confidence, and risk.
They are NOT production database scores.
```

**What They Are NOT:**

```txt
✗ Radar scores are NOT "Opportunity Score" — Opportunity Score remains a DB-backed, internal calculation.
✗ Radar scores are NOT "Fundamental Score" — Fundamental Score remains unchanged.
✗ Radar scores do NOT replace Opportunity Score or Fundamental Score.
✗ Radar scores are NOT a buy/sell indicator.
✗ Radar scores are NOT a financial recommendation.
✗ Radar scores should NOT be displayed in Scanner or Dashboard as if they are production scores.
```

**Score Definitions (Agent Assessment Only):**

| Score | Meaning | Inputs | Range | Display Policy |
| --- | --- | --- | --- | --- |
| **attentionScore** | Signal volume / buzz level | source volume, social mentions | 0–100 | Internal QA only |
| **confidenceScore** | How confident agent is this is real | evidence quality, verification status | 0–100 | Internal QA only |
| **hypeRiskScore** | Pure hype vs. substantive signal | source credibility, language patterns | 0–100 | Internal QA only |
| **radarSignalStrength** | Combined signal strength across lenses | aggregate of above | 0–100 | Internal QA only |
| **radarConvictionScore** | Agent's conviction this is worth researching | signal strength + confidence - hype risk | 0–100 | Future: possibly in Intel Brief |
| **sourceQualityScore** | Quality of evidence sources | credibility tier distribution, URL validity | 0–100 | Internal QA only |
| **manipulationRiskScore** | Risk of pump/scheme | source patterns, timing patterns | 0–100 | Internal QA only |

**In Phase 23C+:**
- Radar scores should be stored in database for debugging and future feature work
- Radar scores should NOT be shown in normal UI unless explicitly designed as research-support signals
- If a radar score is shown to users, it must be clearly labeled "Research Signal Confidence" or "Signal Quality Assessment" — never "Buy/Sell Score"

---

### I. Claude Sonnet 4.6 Specific Notes

**Quality Advantages:**
- Strongest research narrative quality from Phase 23B-2 benchmark
- Best handling of uncertainty and rejected-candidate reasoning
- Superior explanation of "why now" and catalyst clarity
- Strong financial reasoning and sector knowledge

**Latency:**
- Significantly slower than GPT-5.4 and other models tested
- Latency is acceptable for daily/manual scans (not real-time interactive use)
- Expect 30–60 seconds for a full scan; consider this in timeout configuration

**Output Characteristics:**
- Can be verbose; prompt must enforce compact JSON fields
- Usually adheres to schema constraints well
- Excellent at evidence citation and source attribution
- Good calibration of confidence scores to evidence quality

**Implementation Considerations for Phase 23C:**
- Claude Sonnet 4.6 does not have native web search in standard API as of knowledge cutoff
- Phase 23C infrastructure must provide server-side search/source pipeline
- Feed search results or curated sources to Claude via the user prompt
- Use the `sourceRegistry` to inform which sources Claude should prioritize

**API Integration:**
- Use Anthropic SDK for server-side execution
- Configure to use `claude-sonnet-4.6` model ID
- Consider prompt caching for repeated scans with similar source data
- Set max_tokens to 8000–12000 to constrain output size

---

### J. GPT-5.4 Fallback and Benchmark Notes

**Quality Characteristics:**
- Strong, conservative output from Phase 23B-2 benchmark
- Good evidence quality and source attribution
- Reliable schema compliance in most cases

**Critical Schema Issue:**
- One Phase 23B-2 test run returned scores in 0–10 style despite 0–100 requirement in prompt
- Example: `attentionScore: 7` instead of `attentionScore: 70`
- Validation layer MUST reject or normalize 0–10 outputs
- Validation logic: If any score < 0 or > 10, assume 0–10 scale and multiply by 10; reject if score > 100 after normalization

**Schema Validation Strictness:**
- More strict validation required for OpenAI outputs vs. Claude
- Always validate that all scores are truly 0–100 integers
- Check for off-by-one or scale-switching errors

**Fallback Workflow:**
- If Claude Sonnet 4.6 times out or fails, Phase 23C infrastructure should automatically fall back to GPT-5.4
- Fallback should use same prompt structure and output schema
- Fallback results should be flagged in providerMetadata as "fallback_provider: true"
- User should be notified that fallback occurred and quality may differ

**API Integration:**
- Use OpenAI SDK for server-side execution
- Configure to use `gpt-5.4` (or current latest model ID)
- Set max_tokens similar to Claude (8000–12000)
- OpenAI natively supports web search; can be enabled in request configuration

---

### K. Non-Scope for Phase 23B-3

Explicitly NOT included in this phase:

```txt
✗ Implementation code (no TypeScript, no API calls, no routes)
✗ Database schema or migrations (no Prisma changes)
✗ Admin UI screens or forms
✗ Provider API integration or authentication
✗ Web scraping or source-fetching infrastructure
✗ Scheduled job implementation
✗ Real AI agent execution or testing
✗ Changes to production Opportunity Score or Fundamental Score
✗ Changes to Scanner, Dashboard, or Drawer
✗ Changes to existing Admin Sync workflows
✗ Prisma model additions
```

This phase is **documentation and specification only**, preparing the groundwork for Phase 23C implementation.

---

---

## Phase 24A-2 Implementation: DB-Backed Config MVP

Phase 24A-2 implements the admin configuration system for Opportunity Radar, enabling runtime customization of prompt, tokens, and context without code changes.

**Implemented (Phase 24A-2):**
- RadarAiConfig model: stores editable prompt template, max tokens, context limit, candidate limit, Claude model, debug settings
- Config loader with fallback chain: DB active config → Environment variables → Code defaults
- Admin UI: collapsed "AI Scan Config" section with editable form (prompt, tokens, context, candidates, model)
- Server Actions: saveRadarConfigAction, getEffectiveRadarConfigAction, getLatestRadarScanAction, getRadarScanHistoryAction
- Latest AI Scan summary: displays most recent RadarScan metadata
- AI Scan History table: shows latest 10 RadarScans in Sync History tab
- Claude Scan behavior: loads effective config, uses DB-backed prompt/tokens/context limit/model
- Post-scan result report: displays metadata, token usage, config source, model used, disclaimer
- Token estimation: improved word-based algorithm (words * 1.35 + punctuation * 0.6 + linebreaks) with live feedback
- Documentation: config fallback behavior, admin UI, history tracking, model selection

**Config Fallback Chain (24A-2):**
1. DB: Active RadarAiConfig (isActive: true)
2. Env: RADAR_PROMPT, ANTHROPIC_RADAR_MAX_TOKENS, RADAR_DB_CONTEXT_LIMIT, RADAR_CANDIDATE_LIMIT, RADAR_DEBUG_AI_TRACE, ANTHROPIC_RADAR_MODEL
3. Code defaults: DEFAULT_RADAR_PROMPT, 8192 tokens, 20 context, 10 candidates, "claude-sonnet-4-6" model

**Validation (24A-2):**
- Prompt template: min 200 characters
- maxTokens: 2000–50000 range
- dbContextLimit: 1–100 range
- candidateLimit: 1–20 range
- model: non-empty string (e.g., "claude-sonnet-4-6")
- All validation happens server-side

**Not Yet Implemented (future phases):**
- Provider switching UI (currently supports Claude only; switching to other providers requires code changes)
- Full real-time DB job progress tracking (currently shows honest client-side estimated progress)
- Scheduled scans (currently manual admin button only)
- Cost estimation
- Multiple active config versions/history
- API key management UI (currently env-only)

---

## Summary

Phase 23B defines the Opportunity Radar AI Agent system through comprehensive documentation and design patterns, without implementing any real AI calls, provider integration, or database changes.

Phase 24A-2 implements the **admin configuration system**, enabling runtime customization of core agent parameters (prompt, token limits, context scope) through a database-backed config with environment variable fallback.

The phase establishes:

- **Agent role**: research engine for Opportunity Radar
- **Execution model**: manual admin button first, scheduled later
- **Configuration system**: admin-editable provider, source, and prompt management
- **Output schema**: structured candidate records with evidence and scoring
- **Evaluation framework**: comparison methodology for providers/models
- **Provider research decision (23B-2)**: Claude Sonnet 4.6 primary candidate, GPT 5.4 fallback, Grok experimental, Gemini deprioritized for MVP default
- **Prompt and schema (23B-3)**: production-ready prompt contract, strict JSON output schema, validation rules, text limits, field classification
- **Architectural rules**: server-side only, DB-backed reads, UI never calls AI
- **Phase breakdown**: incremental rollout from Phase 23C onward
- **Open questions**: design decisions deferred to Phase 23C

This documentation is the foundation for Phase 23C implementation.

---

## Documentation Update Map

If this specification changes in future phases, update:

```txt
Context/Features/opportunity-radar-ai-agent-spec.md  — this file
Context/current-feature.md                           — active phase spec
Context/project-overview.md                          — roadmap and status
Context/README.md                                    — routing map (if sections added)
Context/data-model.md                                — if DB schema is designed
Context/Features/admin-sync-feature-spec.md          — if Admin workflow changes
Context/feature-history.md                           — after Phase 23B completion
```
