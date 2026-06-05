# Sync Workflows — FomoFilter

## When To Read This File

Read this file before changing:

```txt
Admin Sync
Sync buttons
Sync routes
Provider usage
SyncRun / SyncRunItem logic
Data freshness
Universe sync
Company data sync
Daily market data sync
Score calculation workflows
```

---

## When To Update This File

Update this file after QA and before commit approval if you change:

```txt
What a sync does
Which provider it uses
Which DB models it writes
How often it should run
SyncRun type/provider/status logic
Admin Sync copy or workflow sections
```

---

## Core Rule

Provider calls happen in sync workflows, not in normal UI render paths.

```txt
Provider / Static Source
→ Admin Sync workflow
→ Database
→ UI reads DB
```

---

## Current Production Workflows

### 1. Universe Sync

Purpose:

```txt
Build/refresh stock universe membership.
Currently supports two universes: Nasdaq 100 and S&P 500.
```

#### Nasdaq 100 Universe Sync

Current membership source:

```txt
Static fallback list (nasdaq100-fallback-symbols.ts)
compositionAsOf: 2026-01-20 — 100 symbols
```

Provider role:

```txt
FMP /stable/profile is called during Nasdaq 100 universe sync to enrich
company profile fields (name, sector, marketCap) for new stocks.
FMP is not the constituent membership source.
```

Writes:

```txt
Stock (upsert by symbol — enriched with FMP profile for new entries)
StockUniverse (slug: nasdaq-100)
StockUniverseMember
SyncRun (type: nasdaq100-universe-sync)
SyncRunItem
```

Run cadence:

```txt
Manual / weekly or monthly
```

Important copy:

```txt
Nasdaq 100 membership currently uses a manually validated static fallback list
because FMP index constituent endpoints require a higher plan tier or are not
used in the current implementation.
```

#### S&P 500 Universe Sync (Phase 22B)

Current membership source:

```txt
Best-effort static fallback list (sp500-fallback-symbols.ts)
compositionAsOf: 2025-07-01 — 499 unique symbols
```

Provider role:

```txt
No provider calls during S&P 500 universe sync.
Stock shell records are created with symbol as name.
Company Data Sync enriches profiles via FMP after universe sync.
```

Writes:

```txt
Stock (upsert by symbol — shell only, name = symbol for new entries)
StockUniverse (slug: sp-500)
StockUniverseMember
SyncRun (type: sp500-universe-sync)
SyncRunItem
```

Run cadence:

```txt
Manual / after quarterly rebalancing
```

Important copy:

```txt
S&P 500 membership uses a best-effort static fallback list. It is not a live
provider feed. FMP index constituent endpoints require a higher plan tier.
After syncing S&P 500 universe membership, run Company Data Sync to enrich
profile fields via FMP for any new stock shell records.
```

#### Multi-Universe Overlap Behavior

```txt
Stock is unique by symbol.
If a symbol (e.g., NVDA) belongs to both Nasdaq 100 and S&P 500:
  - One Stock record exists in the database.
  - Two StockUniverseMember records exist (one per universe).
  - Company Data Sync and Daily Market Data Sync process the symbol once.
Stocks leaving one universe have that specific membership deactivated.
Stocks in other universes are not affected.
```

---

### 2. Company Data Sync

Purpose:

```txt
Refresh slower-changing company, fundamental, analyst, and profile data
for all unique active stocks across all synced universes.
```

Symbol scope (Phase 22B):

```txt
Operates on deduplicated unique active symbols across all synced universes.
Overlapping symbols (e.g., NVDA in Nasdaq 100 and S&P 500) are processed once.
Symbol list is deduplicated before SyncRunItem creation and before provider calls.
```

Current sources:

```txt
FMP:
- company profile
- industry
- description
- market cap
- beta
- ratios
- key metrics
- financial growth
- price target consensus

Finnhub:
- analyst recommendation counts
```

Writes:

```txt
Stock
StockMetric
StockAnalystData
SyncRun (type: company-data-active-symbols-sync)
SyncRunItem
```

Important fields written to `Stock`:

```txt
name
sector
industry
description
marketCap
```

Important fields written to `StockMetric`:

```txt
growth
profitability
valuation
financial health
beta
market capitalization
```

Important fields written to `StockAnalystData`:

```txt
targetPrice
targetMean
targetHigh
targetLow
targetMedian
analystUpsidePercent
analystRating
analystCount
recommendation counts
source = fmp+finnhub
```

Run cadence:

```txt
Weekly or after earnings updates.
Manual during development.
```

Does not:

```txt
Calculate scores automatically
Write StockQuote
Call providers from Scanner
```

After running Company Data Sync, usually run:

```txt
Calculate Fundamental Scores
Calculate Opportunity Scores
```

Legacy SyncRun type:

```txt
analyst-data-nasdaq100-sync — still displayed in history as "Company Data Sync (legacy)"
```

---

### 3. Daily Market Data Sync

Purpose:

```txt
Refresh daily market quote data for all unique active stocks across all synced universes.
```

Symbol scope (Phase 22B):

```txt
Operates on deduplicated unique active symbols across all synced universes.
Overlapping symbols are processed once.
Symbol list is deduplicated before SyncRunItem creation and before provider calls.
```

Current source:

```txt
FMP /stable/quote
```

Writes:

```txt
StockQuote
SyncRun (type: market-data-active-symbols-sync)
SyncRunItem
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
sourceUpdatedAt
lastSyncedAt
```

Run cadence:

```txt
Daily
```

Does not:

```txt
Write StockMetric
Write analyst data
Calculate scores automatically
```

After running Daily Market Data Sync, run Opportunity Score if price-position freshness matters.

Legacy SyncRun types:

```txt
market-data-nasdaq100-chunked-sync — still displayed in history as "Daily Market Data Sync (legacy)"
market-data-nasdaq100-batch — still displayed in history as "Daily Market Data Sync (legacy)"
quotes-nasdaq100-batch — still displayed in history as "Daily Market Data Sync (legacy)"
```

---

### 4. Calculate Fundamental Scores

Purpose:

```txt
Calculate internal Fundamental Score and component scores from DB metrics.
```

Source:

```txt
Database only
```

Provider:

```txt
internal
```

Writes:

```txt
StockScore
SyncRun (type: fundamental-score-calculation)
SyncRunItem
```

Reads:

```txt
StockMetric
StockQuote where needed
```

Operates on:

```txt
All active Stock records (prisma.stock.findMany where isActive: true).
Already deduplicated by Stock uniqueness — no universe-specific scoping needed.
```

Does not:

```txt
Call providers
Write StockMetric
Write StockQuote
```

Expected status:

```txt
success or partial_success
```

`partial_success` is valid when inactive/seed stocks lack metrics but active universe stocks calculate successfully.

---

### 5. Calculate Opportunity Scores

Purpose:

```txt
Calculate Opportunity Score v2.
```

Source:

```txt
Database only
```

Provider:

```txt
internal
```

Writes:

```txt
StockScore.oppScore
StockScore.oppScoreVersion
StockScore.oppCalculatedAt
SyncRun (type: opportunity-score-calculation)
SyncRunItem
```

Reads:

```txt
StockScore fundamental/component scores
StockAnalystData
StockQuote
```

Operates on:

```txt
All active Stock records (prisma.stock.findMany where isActive: true).
Already deduplicated by Stock uniqueness.
```

Current version:

```txt
opportunity-v2
```

Does not:

```txt
Call providers
Change Fundamental Score formula
Write provider data
```

---

## Developer / Legacy Tools

Some older tools may still exist under Developer / Legacy sections.

Examples:

```txt
Analyst Target Discovery
Provider limit experiments
Old fallback tools
```

Rules:

```txt
Do not treat legacy tools as production workflows.
Do not expand legacy tools unless explicitly requested.
Prefer Company Data Sync and Daily Market Data Sync for production data.
```

---

## Provider Tests

Purpose:

```txt
Validate API keys and provider access without writing application data.
```

Rules:

```txt
Provider tests should not mutate stock data.
Provider tests should not be used as app sync workflows.
```

---

## SyncRun Type Reference

Current production types:

```txt
nasdaq100-universe-sync        — Nasdaq 100 membership sync
sp500-universe-sync            — S&P 500 membership sync (Phase 22B)
market-data-active-symbols-sync — Daily Market Data Sync (Phase 22B+)
company-data-active-symbols-sync — Company Data Sync (Phase 22B+)
fundamental-score-calculation   — Fundamental Score
opportunity-score-calculation   — Opportunity Score
```

Legacy types (backward-compatible, display in history only):

```txt
analyst-data-nasdaq100-sync         — Company Data Sync before Phase 22B
market-data-nasdaq100-chunked-sync  — Daily Market Data Sync before Phase 22B
market-data-nasdaq100-batch         — Daily Market Data Sync (batch variant)
quotes-nasdaq100-batch              — Quote batch (legacy)
```

---

## SyncRun Status Rules

Use clear and truthful statuses.

```txt
success = completed as expected
partial_success = useful data persisted but some symbols skipped or unavailable
failed = workflow failed or no useful data persisted
running = active sync
paused = resumable sync paused intentionally
```

Expected skipped examples:

```txt
Inactive seed stocks
Provider returns no data for a symbol
Known plan limitation handled as skipped/plan_limited
```

Do not mark expected missing provider coverage as application failure unless it blocks the workflow.

---

## Documentation Links

```txt
Context/data-model.md
Context/Features/market-data-sync-strategy.md
Context/Algorithms/fundamental-score-v1.md
Context/Algorithms/opportunity-score-v2.md
Context/Features/admin-sync-feature-spec.md
```
