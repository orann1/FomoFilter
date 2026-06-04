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
Nasdaq 100 active universe
S&P 500 / Russell 1000 concepts where seeded or planned
```

Current Nasdaq 100 membership source:

```txt
static fallback list
```

Rules:

```txt
Universe membership source is not the same as profile provider.
FMP profile enrichment does not make FMP the universe membership source.
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

Typical types include:

```txt
nasdaq100-universe-sync
market-data-nasdaq100-chunked-sync
analyst-data-nasdaq100-sync
fundamental-score-calculation
opportunity-score-calculation
```

Rules:

```txt
Use clear provider labels.
Use partial_success when some symbols are skipped but useful data was persisted.
Do not treat expected provider coverage limitations as application failures.
```

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
