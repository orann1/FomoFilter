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
Build/refresh Nasdaq 100 universe membership.
```

Current membership source:

```txt
Static fallback list
```

Provider role:

```txt
FMP may enrich profile fields.
FMP is not currently the live Nasdaq 100 membership source.
```

Writes:

```txt
Stock
StockUniverse
StockUniverseMember
SyncRun
SyncRunItem
```

Run cadence:

```txt
Manual / weekly or monthly
```

Important copy:

```txt
Nasdaq 100 membership currently uses a manually validated static fallback list because FMP index constituent endpoints require a higher plan tier or are not used in the current implementation.
```

---

### 2. Company Data Sync

Purpose:

```txt
Refresh slower-changing company, fundamental, analyst, and profile data.
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
SyncRun
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

---

### 3. Daily Market Data Sync

Purpose:

```txt
Refresh daily market quote data.
```

Current source:

```txt
FMP /stable/quote
```

Writes:

```txt
StockQuote
SyncRun
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
SyncRun
SyncRunItem
```

Reads:

```txt
StockMetric
StockQuote where needed
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
SyncRun
SyncRunItem
```

Reads:

```txt
StockScore fundamental/component scores
StockAnalystData
StockQuote
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
