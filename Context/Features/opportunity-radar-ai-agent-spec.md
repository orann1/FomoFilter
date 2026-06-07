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
Surface stocks worth further review based on external market signals.
Separate external signal (from AI) from internal FomoFilter validation.
Produce structured, machine-readable output.
Support manual admin execution and future scheduled execution.
```

The AI agent should:

- Identify potential research candidates from external sources
- Explain why each candidate appeared (catalyst, signal, trend context)
- Provide evidence citations for each claim
- Assign structured radar lenses (Attention Spike, Overreaction, Value Gap, Future Theme)
- Measure signal strength, confidence, and hype risk
- Persist results for later database storage and UI display
- Never produce buy/sell recommendations
- Use cautious, research-focused language

The AI agent outputs are **structured candidates** that can be stored in the database and displayed by /opportunity-radar.

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
Next:      Phase 23B-2 if provider research is needed
```

### Phase 23B-1

```txt
Goal:      Create AI agent spec and update current-feature setup
Scope:     Full spec, phase breakdown, open questions
Output:    Context/Features/opportunity-radar-ai-agent-spec.md (current task)
Timeline:  1 phase (docs-only, no code)
```

### Phase 23B-2 (Optional, Future)

```txt
Goal:      Provider / model research and comparison
Scope:     Test prompts on OpenAI, Anthropic, Google, xAI
           Collect structured outputs
           Compare reliability, quality, cost, latency
           Document findings
Output:    Evaluation report, selected provider/model recommendation
Timeline:  1 phase (research / testing)
Constraint: Use official documentation; verify prices
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

### Phase 23C-3 (Future)

```txt
Goal:      Opportunity Radar page reads DB scan results
Scope:     Update /opportunity-radar to read from RadarScan / RadarCandidate tables
           Filter by time window, lens, category
           Link Intel Brief to DB data
           Remove mock data
Output:    Working /opportunity-radar connected to DB
Timeline:  1 phase (implementation + QA)
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

## Summary

Phase 23B defines the Opportunity Radar AI Agent system through comprehensive documentation and design patterns, without implementing any real AI calls, provider integration, or database changes.

The phase establishes:

- **Agent role**: research engine for Opportunity Radar
- **Execution model**: manual admin button first, scheduled later
- **Configuration system**: admin-editable provider, source, and prompt management
- **Output schema**: structured candidate records with evidence and scoring
- **Evaluation framework**: comparison methodology for providers/models
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
