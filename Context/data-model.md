# Data Model — FomoFilter

## When To Read This File

Read this file before changing:

```txt
Prisma schema
Database model ownership
DB field mappings
Scanner/Dashboard/Drawer DB data contracts
Sync writes
Score storage
Watchlist/alert persistence
```

---

## When To Update This File

Update this file after QA and before commit approval if you change:

```txt
prisma/schema.prisma
Model relationships
Model ownership
Important DB fields
Which sync writes which model
Which screen reads which model
```

If a migration is added, update this file.

---

## Model Ownership Summary

| Model | Primary Owner | Used By |
| --- | --- | --- |
| `User` | Demo/user layer | Watchlist, alerts |
| `Stock` | Universe + Company Data Sync | Dashboard, Scanner, Drawer |
| `StockQuote` | Daily Market Data Sync | Dashboard, Scanner, Drawer, scores |
| `StockMetric` | Company Data Sync | Scores, Scanner, Drawer |
| `StockScore` | Score Calculation | Dashboard, Scanner, Drawer |
| `StockAnalystData` | Company Data Sync | Scanner, Dashboard, Drawer, Opportunity Score |
| `StockUniverse` | Universe Sync / seed | Scanner universe selector |
| `StockUniverseMember` | Universe Sync | Scanner membership/index flags |
| `WatchlistItem` | Watchlist Server Actions | Scanner, Drawer, Dashboard |
| `AlertRule` | Alert Server Actions | Scanner, Drawer |
| `StockDrawerDetail` | Legacy — no active owner | Not used by any UI render path (Phase 21C). Schema retained, no migration yet. |
| `SyncRun` | Admin sync workflows | Admin Sync, freshness checks |
| `SyncRunItem` | Admin sync workflows | Sync history/details |
| `RadarScan` | Future admin AI scan button / scheduled jobs (Phase 23C+) | Opportunity Radar UI (Phase 23C+), admin history |
| `RadarCandidate` | RadarScan execution results | Opportunity Radar UI, research candidate display |
| `RadarEvidence` | RadarScan execution results | Evidence citations in Radar UI |

---

## Important Models

### Stock

Purpose:

```txt
Core stock identity and company profile.
```

Important fields:

```txt
symbol
name
sector
industry
description
marketCap
isActive
```

Current ownership:

```txt
Universe Sync creates/activates stock symbols.
Company Data Sync enriches profile fields from FMP.
```

Important notes:

```txt
description and industry were added in Phase 21B.
FMP already returns these fields.
Company Data Sync persists them.
Scanner expanded row and future Drawer Company Snapshot use them.
```

Do not store quote values or metric values on `Stock` unless they are identity/profile fields.

---

### StockQuote

Purpose:

```txt
Latest daily market quote snapshot.
```

Current owner:

```txt
Daily Market Data Sync
```

Important fields:

```txt
price
changePercent
open
dayHigh
dayLow
previousClose
volume
week52High
week52Low
priceAvg50
priceAvg200
source
sourceUpdatedAt
lastSyncedAt
```

Rules:

```txt
Daily Market Data Sync writes StockQuote.
Company Data Sync should not write StockQuote.
UI reads StockQuote from DB.
```

---

### StockMetric

Purpose:

```txt
Slow-changing company fundamentals, ratios, growth, profitability, valuation, and financial health data.
```

Current owner:

```txt
Company Data Sync
```

Data source:

```txt
FMP profile / key metrics / ratios / financial growth
```

Examples:

```txt
grossMarginTTM
operatingMarginTTM
netProfitMarginTTM
roeTTM
roaTTM
totalDebtToEquityAnnual
currentRatioAnnual
quickRatioAnnual
netInterestCoverageAnnual
peBasicExclExtraTTM
psTTM
pbAnnual
evEbitdaTTM
pegTTM
revenueGrowthTTMYoy
epsGrowthTTMYoy
revenueGrowth3Y
epsGrowth3Y
beta
marketCapitalization
```

Rules:

```txt
Daily Market Data Sync should not write StockMetric.
Score calculations read StockMetric.
```

---

### StockScore

Purpose:

```txt
Stores internal calculated scores.
```

Current owner:

```txt
Score Calculation actions
```

Important current scores:

```txt
fundamentalScore
fundamentalScoreVersion
fundamentalCalculatedAt
oppScore
oppScoreVersion
oppCalculatedAt
growthScore
profitabilityScore
valuationScore
financialHealthScore
riskContextScore
```

UI label:

```txt
riskContextScore is displayed as Stability in the UI.
```

Current versions:

```txt
fundamental-v1
opportunity-v2
```

Rules:

```txt
No provider calls during score calculation.
Missing score inputs should not be treated as zero unless the algorithm explicitly says so.
```

---

### StockAnalystData

Purpose:

```txt
Stores analyst target and recommendation data.
```

Current owner:

```txt
Company Data Sync
```

Current data sources:

```txt
FMP price-target-consensus for target values
Finnhub recommendation counts for recommendation/rating values
```

Important fields:

```txt
targetPrice
targetMean
targetHigh
targetLow
targetMedian
analystUpsidePercent
analystRating
analystCount
strongBuyCount
buyCount
holdCount
sellCount
strongSellCount
source
lastSyncedAt
targetStatus
targetLastAttemptedAt
targetLastFoundAt
```

Rules:

```txt
Opportunity Score v2 reads analystUpsidePercent and recommendation counts.
Scanner/Drawer display analyst targets, upside, ratings, and counts.
```

---

### StockUniverse / StockUniverseMember

Purpose:

```txt
Defines stock universes and index membership.
```

Current usage:

```txt
Nasdaq 100 active universe (slug: nasdaq-100)
S&P 500 universe (slug: sp-500, Phase 22B)
Russell 1000 (slug: russell-1000, seeded but not production-populated)
```

Current membership sources:

```txt
Nasdaq 100 — static fallback list (100 symbols)
S&P 500 — best-effort static fallback list (499 unique symbols, Phase 22B)
```

Multi-universe overlap behavior (Phase 22B):

```txt
Stock is unique by symbol (Stock.symbol has a unique DB constraint).
If a symbol belongs to both Nasdaq 100 and S&P 500:
  - One Stock record exists.
  - Two StockUniverseMember records exist (one per universe).
Do not create duplicate Stock records for overlapping universe symbols.
Upsert Stock by normalized symbol.
Universe membership overlap creates multiple StockUniverseMember rows, not multiple Stock rows.
```

Membership deactivation:

```txt
When a symbol is removed from one universe, only that specific StockUniverseMember
is deactivated (isActive: false). The Stock record and memberships in other universes
are not affected.
```

Rules:

```txt
Universe membership source is not the same as profile provider.
FMP profile enrichment does not make FMP the universe membership source.
Do not describe static fallback lists as live provider membership.
```

---

### WatchlistItem

Purpose:

```txt
Stores user-specific watchlist state and notes.
```

Current owner:

```txt
Drawer/watchlist Server Actions
```

Used by:

```txt
Scanner stars
Drawer watchlist context/actions
Dashboard watchlist widgets
```

Do not replace DB watchlist state with localStorage.

---

### AlertRule

Purpose:

```txt
Stores user alert rules.
```

Current owner:

```txt
Drawer/alert Server Actions
```

Current status:

```txt
Rules can be created and displayed.
Full alert evaluation engine is future work.
```

---

### SyncRun / SyncRunItem

Purpose:

```txt
Tracks admin sync runs and per-symbol results.
```

Used by:

```txt
Admin Sync history
Dashboard freshness warnings
QA/debugging
```

Current production types:

```txt
nasdaq100-universe-sync           — Nasdaq 100 membership sync
sp500-universe-sync               — S&P 500 membership sync (Phase 22B)
market-data-active-symbols-sync   — Daily Market Data Sync (Phase 22B+)
company-data-active-symbols-sync  — Company Data Sync (Phase 22B+)
fundamental-score-calculation     — Fundamental Score
opportunity-score-calculation     — Opportunity Score
```

Legacy types (backward-compatible — displayed in history only):

```txt
analyst-data-nasdaq100-sync          — Company Data Sync before Phase 22B
market-data-nasdaq100-chunked-sync   — Daily Market Data Sync before Phase 22B
market-data-nasdaq100-batch          — Daily Market Data Sync (batch variant)
quotes-nasdaq100-batch               — Quote batch (legacy)
```

Rules:

```txt
Use clear provider labels.
Use partial_success when some symbols are skipped but useful data was persisted.
Do not treat expected provider coverage limitations as application failures.
```

---

### RadarAiConfig

Purpose:

```txt
Stores database-backed configuration for Opportunity Radar AI scans.
Allows admin to edit prompt template, token limits, context limits, and debug settings without code changes.
Phase 24A-2: Initial MVP with editable prompt, token, and context controls.
```

Primary Owner:

```txt
Phase 24A-2: Admin users via AI Scan Config section in /admin/sync
```

Important fields:

```txt
name — human-readable config name (e.g., "Default Radar AI Config")
isActive — whether this config is currently active (only one active config at a time)
promptTemplate — the system prompt used by Claude for Radar scans
maxTokens — max output tokens for Claude API calls (range: 2000–50000)
dbContextLimit — how many stocks to include in the database context (range: 1–100)
candidateLimit — target number of candidates to return from Claude (range: 1–20)
model — Claude model to use for scans (e.g., "claude-sonnet-4-6", "claude-opus-4-8")
debugTraceEnabled — whether to write debug trace files on next scan
promptVersion — versioned identifier for the prompt (e.g., "opportunity-radar-v1")
schemaVersion — versioned identifier for the output schema (e.g., "candidate-output-v1")
changeNotes — optional notes on why this config was created/updated
createdAt — timestamp when config was created
updatedAt — timestamp when config was last modified
```

Relationships:

```txt
RadarAiConfig can have many RadarScan records (one-to-many)
RadarScan.configId (nullable) — foreign key to RadarAiConfig
```

Fallback chain (when loading effective config):

```txt
1. Active DB config (isActive: true) — if exists
2. Environment variables (RADAR_PROMPT, ANTHROPIC_RADAR_MAX_TOKENS, ANTHROPIC_RADAR_MODEL, etc.) — if set
3. Code defaults — built-in prompt, hardcoded limits, and "claude-sonnet-4-6"

For model field specifically:
1. DB config.model — if set and active config exists
2. ANTHROPIC_RADAR_MODEL env var — if set
3. Code default: "claude-sonnet-4-6"
```

Rules:

```txt
API key remains environment-only (ANTHROPIC_API_KEY). Never store API keys in DB.
Model selection remains environment-only (ANTHROPIC_RADAR_MODEL). Not editable in UI this phase.
promptTemplate must be at least 200 characters.
maxTokens must be an integer between 2000 and 50000.
dbContextLimit must be an integer between 1 and 100.
candidateLimit must be an integer between 1 and 20.
Only one active config at a time. Setting isActive=true deactivates others (manual process).
Backward compatibility: existing RadarScan rows with configId=null are valid.
When a RadarScan is created with a DB config, configId is stored and can be referenced for auditing.
```

---

### RadarScan

Purpose:

```txt
Represents one Opportunity Radar AI agent execution.
Stores metadata about the scan run, provider/model used, timing, token usage, and overall results.
```

Primary Owner:

```txt
Phase 23C+: Admin AI Scan button and future scheduled daily jobs
```

Important fields:

```txt
scanDate — when the scan executed
timeWindow — time period scanned (e.g., "24h", "7d", "30d")
provider — AI provider name (e.g., "claude", "gpt")
model — model identifier (e.g., "claude-sonnet-4.6")
promptVersion — versioned prompt identifier (e.g., "opportunity-radar-v1")
schemaVersion — versioned output schema (e.g., "candidate-output-v1")
status — scan status (e.g., "completed", "failed", "partial_success")
sourceMode — how sources were gathered (e.g., "web_search", "provider_native", "mock")
searchEnabled — whether external search was used
totalCandidatesReturned — total candidates produced by AI
totalRejected — candidates rejected by validation layer
totalProcessed — successfully persisted candidates
executionTimeMs — total scan duration
tokenPrompt — prompt tokens used
tokenCompletion — completion tokens used
costEstimate — estimated API cost
summaryOverallMarketTheme — AI's overall market assessment
summaryQualityNotes — AI's self-assessment of output quality
configId — optional foreign key to RadarAiConfig if DB config was used
```

Relationships:

```txt
RadarScan has many RadarCandidate records
RadarScan optionally belongs to RadarAiConfig (configId nullable)
RadarScan has no direct Stock relationship
candidates RadarCandidate[] — inverse relation
config RadarAiConfig? — optional relation (null if using env/code defaults)
```

Rules:

```txt
RadarScan is immutable once created (no updates to status/summary after initial completion).
Do not read from RadarScan during normal UI render; use RadarCandidate and RadarEvidence.
Provider and model names use strings (not enums) to support future provider additions.
Status field uses strings (not enums) to allow flexible AI/validation state tracking.
```

---

### RadarCandidate

Purpose:

```txt
Represents one research candidate discovered and assessed by a RadarScan execution.
Stores the AI agent's structured output for a single candidate: thesis, scores, evidence pointers, and UI metadata.
These are AI assessment scores, NOT production Opportunity/Fundamental scores.
```

Primary Owner:

```txt
RadarScan execution results (written once per scan)
```

Important fields:

```txt
scanId — foreign key to parent RadarScan
stockId — optional reference to Stock DB if matched during enrichment
ticker — candidate ticker symbol
companyName — candidate company name
radarLens — categorization lens (e.g., "Attention Spike", "Overreaction", "Value Gap", "Future Theme")
detailedCategory — sub-category or specific signal (e.g., "Analyst Upgrade")
headline — one-line summary suitable for UI display
thesis — longer explanation of why the candidate appeared
whyNow — time-context (e.g., catalyst, earnings, news)
mainCatalyst — primary reason for signal (free-text or structured)
attentionScore — AI assessment 0-100 (not production Opportunity Score)
confidenceScore — AI confidence in assessment
hypeRiskScore — AI assessment of hype/manipulation risk
radarSignalStrength — AI strength of signal evidence
radarConvictionScore — AI conviction level (distinct from production scores)
trendStatus — trend direction (e.g., "emerging", "strengthening", "fading")
appearancesLast7Days — how many scans mentioned this candidate in last 7 days
appearancesLast30Days — how many scans mentioned this candidate in last 30 days
tags — user/AI-assigned labels (array of strings)
sortRank — UI display rank within the scan
```

Relationships:

```txt
RadarCandidate belongs to RadarScan (required)
RadarCandidate optionally belongs to Stock (stockId can be null)
RadarCandidate has many RadarEvidence records
scan RadarScan @relation
stock Stock? @relation
evidence RadarEvidence[]
```

Unique constraint:

```txt
@@unique([scanId, ticker]) — no duplicate ticker within a single scan
```

Rules:

```txt
Radar scores (attentionScore, confidenceScore, etc.) are AI assessment scores, NOT production scores.
Do not use Radar scores in production Opportunity Score or Fundamental Score calculations.
Do not use Radar scores to override or replace production scores in UI display.
stockId can be null if the candidate was not matched to an existing Stock record.
Deleting a RadarScan cascades to delete all child RadarCandidate records.
Deleting a Stock does not delete RadarCandidate records; stockId becomes null.
```

---

### RadarEvidence

Purpose:

```txt
Represents source citations and evidence for a RadarCandidate assessment.
Stores where/why the AI agent found the candidate: article URLs, news titles, credibility scores.
```

Primary Owner:

```txt
RadarScan execution results (written as part of candidate output)
```

Important fields:

```txt
candidateId — foreign key to parent RadarCandidate
sourceName — human-readable source label (e.g., "TradingView Ideas", "Finviz", "Reddit WSB")
sourceType — source category (e.g., "news", "social_media", "technical_analysis", "analyst_report")
url — hyperlink to the source (optional if source is not online)
title — headline or label of the source material
publishedAt — timestamp of source publication
snippet — excerpt or summary of the source content
credibilityTier — AI's credibility assessment (e.g., "tier1_established", "tier2_credible", "tier3_community", "tier4_unverified")
relevanceScore — how relevant the evidence is to the candidate assessment (0-100)
```

Relationships:

```txt
RadarEvidence belongs to RadarCandidate (required)
candidate RadarCandidate @relation
```

Rules:

```txt
Evidence is read-only once persisted (no updates).
Deleting a RadarCandidate cascades to delete all child RadarEvidence records.
Multiple evidence records can support a single candidate.
Evidence is used for UI citations and transparency, not for future re-ranking.
```

---

## Radar Scores vs. Production Scores

**Important distinction:**

Radar models (RadarScan, RadarCandidate, RadarEvidence) store **AI agent assessment outputs**, not production scores.

**Production scores** (Fundamental Score v1, Opportunity Score v2):
- Calculated from DB fundamentals, analyst data, and price metrics
- Used in Scanner default sort and Dashboard priority
- Deterministic and reproducible from DB state

**Radar scores** (attentionScore, confidenceScore, radarSignalStrength, radarConvictionScore):
- AI agent's subjective assessment of signal strength, confidence, hype risk
- Not used in production scoring
- Useful for AI-powered discovery and ranking within Radar candidates
- Should never be confused with or substituted for production scores

**Radar candidates** are research discoveries, not investment recommendations.
They are presented to the user for further manual review, not as automatic buy signals.

---

## Radar Schema — Current Status

**Phase 23C-1B (completed):**
- RadarScan, RadarCandidate, RadarEvidence models added
- Migration created and applied
- Cascade deletes implemented correctly
- String types used (no Prisma enums) for flexibility during prompt/schema iterations

**Phase 23C-2A (completed):**
- Validation function for RadarScanOutput with strict rules
- Persistence function using Prisma transactions
- Sample fixture with 3 test candidates
- QA script for validation and persistence testing

**Phase 23C-2B/2C (completed):**
- Admin AI Scan button implementation with real Claude execution
- /opportunity-radar reads from DB instead of mock data

**Phase 24A-1 (completed):**
- Admin UI reorganization: Fixture Scan and Claude Scan moved to dedicated AI Scan tab
- Backend code preservation, UI-only changes

**Phase 24A-2 (completed):**
- RadarAiConfig model added with editable prompt, token, and context controls
- Migration: configId field added to RadarScan
- Effective config loader with fallback chain (DB → Env → Code Default)
- Admin UI: AI Scan Config section (collapsed by default) with editable form
- Admin UI: Claude Scan remains primary action, uses DB config
- Admin UI: Fixture Scan moved to collapsed "QA / Test Scan" section
- Post-scan result report with metadata and disclaimer
- Honest progress UI labeling ("Estimated progress")
- API key remains env-only (not editable in UI)

**Phase 24B-0 (active — planning):**
- Documentation: Product rework spec defining scan-based research signal tracker
- No schema changes in this phase

**Phase 24B-1+ (future):**
- Schema updates with new fields (see Planned Phase 24B Fields below)
- Scheduled daily scans
- Full real-time DB job progress tracking
- Additional configuration options (provider switching, etc.)

---

## Planned / Proposed Phase 24B Radar Rework Fields

**Status:** This section documents planned Radar schema changes for Phase 24B. **Fields are separated into immediate Phase 24B-1 targets and deferred/future optimizations.**

---

### Phase 24B-1: Immediate Schema Foundation

**These fields are the implementation target for Phase 24B-1. Add these and only these to the schema.**

#### RadarScan (Phase 24B-1 Additions)

**Immediate new fields for Phase 24B-1:**

```prisma
scanPeriodStart     DateTime?        // explicit start of time window analyzed
scanPeriodEnd       DateTime?        // explicit end of time window analyzed
scanLabel           String?          // optional human-readable context (e.g., "Post-earnings cycle")
```

**Rationale:**
- Explicit period metadata clarifies what time window was actually analyzed
- scanLabel provides human context (useful in admin logs and history)
- Minimal addition; does not block Phase 24B-1 implementation

#### RadarCandidate (Phase 24B-1 Additions)

**Immediate new fields for Phase 24B-1:**

```prisma
// Discovery signals (added alongside, not replacing radarLens)
reasonTags          String[]         // e.g., ["analyst_upside", "valuation_gap", "momentum_shift"]

// External discovery support
externalDiscoveryStatus  String      // "in_db" (stockId not null) or "external_discovery" (stockId null)
dbValidationStatus   String          // "matched", "not_found", "pending_match"

// Research priority (computed during persistence, not a user input)
researchPriority    Int?             // 1–5, computed from trendStatus + appearance count
```

**Rationale:**
- `reasonTags` provides flexible discovery signal categorization (not forced into 4 lenses); added **alongside** `tags[]`
- `externalDiscoveryStatus` + `dbValidationStatus` enable clear UI labeling of non-DB candidates
- `researchPriority` guides UI ranking and emphasis (repeated = high priority)
- All new fields are **nullable** for backward compatibility

**CRITICAL — Do NOT add these fields in Phase 24B-1:**
- `firstSeenScanId` — Deferred (see below)
- `lastSeenScanId` — Deferred (see below)
- `rankChange` — Deferred (see below)
- `previousRank` — Deferred (see below)
- `appearanceHistory[]` — Deferred (see below)
- Other fields marked "Deferred / Future Optimization" below

---

### Deferred / Future Optimization Fields (NOT Phase 24B-1)

**These fields are designed for future phases, NOT Phase 24B-1. Do not add them to schema unless Product Owner explicitly approves a scope change.**

#### RadarScan (Deferred Additions)

**Deferred new fields (future phases only):**

```prisma
previousScanId      String?          // FK to prior RadarScan for easier comparison
scanMode            String?          // "standard", "universe_expansion", "deep_dive"
comparisonSummary   Json?            // {newCount, repeatedCount, backOnRadar, coolingCount}
```

**Why deferred:**
- `previousScanId` — Convenience field; comparison can be done via date queries
- `scanMode` — Not needed for Phase 24B UI; future enhancement
- `comparisonSummary` — Can be computed on read in Phase 24B-3

#### RadarCandidate (Deferred Additions)

**Deferred new fields (future phases only):**

```prisma
firstSeenScanId     String?          // FK to RadarScan where this ticker first appeared
lastSeenScanId      String?          // FK to RadarScan where this ticker last appeared
appearanceHistory   Json?            // [{scanId, scanDate, rank, trendStatus}, ...]
rankChange          Int?             // Difference in sortRank between consecutive scans
previousRank        Int?             // sortRank from prior scan
```

**Why deferred:**
- First seen / last seen dates — Compute from scan history in data loaders (Phase 24B-3), not stored
- Appearance count — Compute from scan history in data loaders, not stored
- `rankChange`, `previousRank` — Compute during scan comparison in Phase 24B-4+
- `appearanceHistory` — Future performance optimization if scan comparison is slow

---

### Computed Fields (Not Persisted in Phase 24B-1)

**These behaviors should be computed by data loaders, NOT stored in schema:**

```
firstSeenDate       — Compute from: (SELECT MIN(scanDate) FROM RadarScan WHERE ticker = candidate.ticker)
lastSeenDate        — Compute from: (SELECT MAX(scanDate) FROM RadarScan WHERE ticker = candidate.ticker)
appearanceCount     — Compute from: (SELECT COUNT(*) FROM RadarScan WHERE contains candidate.ticker in last 30d)
rankChange          — Compute from: (rank in current scan) - (rank in prior scan)
trendStatus         — Compute from: appearance history logic (new, repeated, back_on_radar, cooling_down)
isTrendingUp        — Compute from: appearance trend direction
```

**Benefits:**
- Avoids denormalization and schema bloat in Phase 24B-1
- Keeps scans immutable (only insert, never update)
- Allows UI to compute these values with fresh data from latest scans
- Can be optimized to persisted fields in Phase 24B-4+ if performance requires

---

### Backward Compatibility

**Do NOT change or remove these fields in Phase 24B-1:**

- **`radarLens` (legacy)** — Stays in schema unchanged; existing Phase 23C records keep their values
  - New prompts will return `reasonTags` instead
  - Old scans with `radarLens` remain readable
  - UI can display old `radarLens` values or map to new `reasonTags` for display
  - **Do NOT remove or rename this field**

- **`tags[]` (legacy)** — Stays in schema unchanged; remains general-purpose metadata
  - New `reasonTags[]` is added **alongside**, not replacing `tags[]`
  - Backfill: `reasonTags = tags` (copy existing array during migration)
  - **Do NOT remove, rename, or change this field**

- **`trendStatus`, `appearancesLast7Days`, `appearancesLast30Days`** — Already exist; no changes needed

---

### Migration Strategy (Phase 24B-1 Only)

**Phase 24B-1 migration will:**

1. Add Phase 24B-1 fields to schema:
   - RadarScan: scanPeriodStart, scanPeriodEnd, scanLabel
   - RadarCandidate: reasonTags, externalDiscoveryStatus, dbValidationStatus, researchPriority

2. Backfill existing records with computed values:
   ```sql
   -- RadarCandidate backfill
   UPDATE RadarCandidate SET
     reasonTags = tags,  -- copy existing general tags
     externalDiscoveryStatus = IF(stockId IS NOT NULL, 'in_db', 'external_discovery'),
     dbValidationStatus = IF(stockId IS NOT NULL, 'matched', 'not_found'),
     researchPriority = 3  -- neutral default; will be recomputed during next scan
   WHERE reasonTags IS NULL;
   ```

3. Keep radarLens and tags unchanged (do NOT rename, remove, or modify)

4. Leave deferred fields in design only; do NOT add to schema

---

### Phase 24B Implementation Scope

**Phase 24B-1 (Data Model):**
1. Create migration adding Phase 24B-1 fields only (see above)
2. Backfill existing records with computed values
3. Update validation logic to accept/validate new Phase 24B-1 fields
4. Update sample fixtures with new fields
5. **Do NOT add deferred fields to schema**
6. **Do NOT remove or rename radarLens, tags**

**Phase 24B-2+ (Prompt + AI Behavior):**
1. Update prompt to return `reasonTags` in addition to (or instead of) radarLens for new scans
2. Implement ticker matching for `externalDiscoveryStatus` and `dbValidationStatus`
3. Compute `researchPriority` during persistence
4. Old radarLens values remain readable from Phase 23C scans

**Phase 24B-3 (UI Rework):**
1. Update `/opportunity-radar` UI to use new fields and 5-tab structure
2. Data loaders compute: firstSeenDate, lastSeenDate, appearanceCount, trendStatus, rankChange
3. Display computed values in UI (do not fetch from persisted fields)

**Phase 24B-4+ (Future):**
1. If performance requires, optimize by adding deferred fields (with explicit approval)
2. Implement scan comparison with persisted comparison metadata (future optimization)

---

---

## Schema Change Rules

If changing schema:

```txt
Use prisma migrate dev
Do not use db push
Run prisma migrate status
Update this file after QA
Update related feature docs if behavior changes
```

Required checks:

```bash
npx prisma validate
npx prisma migrate status
npm run build
npx tsc --noEmit
```

---

## Related Docs

```txt
Context/architecture.md
Context/sync-workflows.md
Context/scoring-system.md
Context/Features/market-data-sync-strategy.md
```
