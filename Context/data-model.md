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
```

Relationships:

```txt
RadarScan has many RadarCandidate records
RadarScan has no direct Stock relationship
candidates RadarCandidate[] — inverse relation
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

## Radar Schema — Phase 23C-1B/2A Status

**Phase 23C-1B (completed):**
- RadarScan, RadarCandidate, RadarEvidence models added
- Migration created and applied
- Cascade deletes implemented correctly
- String types used (no Prisma enums) for flexibility during prompt/schema iterations

**Phase 23C-2A (in progress):**
- Validation function for RadarScanOutput with strict rules (enums, scores 0-100, prohibited language, evidence requirements)
- Persistence function using Prisma transactions
- Sample fixture with 3 test candidates
- QA script for validation and persistence testing
- No external AI/provider calls; fixture data only

**Phase 23C-2B/2C (future):**
- Admin AI Scan button implementation with real AI execution
- Provider/prompt/source configuration models (RadarPromptVersion, RadarProviderConfig, etc.)

**Phase 23C-3+ (future):**
- Scheduled daily scans
- /opportunity-radar reads from DB instead of mock data

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
