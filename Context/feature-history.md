# Feature History

## Purpose

This file stores completed phase summaries.

Do not use this as the active feature spec.

For the active feature, read:

```txt
Context/current-feature.md
```

Read this file only when historical context is required.

---

## Completed Phases

### Initial Setup

Cleaned up the default Next.js boilerplate, kept a minimal page, removed default assets/styles, and pushed the initial project to GitHub.

---

### Phase 1 — Dashboard Static Layout

Built the initial dashboard shell using mock data:

```txt
Sidebar
Top bar
Dashboard widgets
Market stats
Summary cards
Hot stocks table
AI insights
Alerts
Discover setups
```

---

### Phase 2 — Stock Preview Drawer

Added a right-side stock preview drawer opened from dashboard rows.

Initial drawer included mock/legacy content:

```txt
Decision Snapshot
Hot / Opportunity cards
AI Insight
Price Context mock chart
Score Breakdown
Main Catalyst
Watch Context
CTA footer
```

This drawer now needs cleanup in Phase 21C.

---

### Phase 3 — Drawer Actions

Added drawer action panels:

```txt
Add to Watchlist
Edit Watchlist
Create Alert
Success messages
```

Initial state was local-only.

---

### Phase 4 — Responsive Dashboard / Drawer

Made dashboard and drawer responsive:

```txt
Mobile sidebar
Mobile hot stock cards
Full-screen mobile drawer
Responsive grids
```

---

### Phase 5 — Prisma / DB Foundation

Added Prisma 7 with PostgreSQL / Neon.

Created core DB models for:

```txt
Stock
StockQuote
StockScore
StockDrawerDetail
WatchlistItem
User
AlertRule
MarketStat
Dashboard widgets
```

Dashboard started reading DB-backed data.

---

### Phase 6 — DB-Backed Drawer Actions

Replaced local-only drawer actions with Prisma-backed Server Actions:

```txt
Add/update/remove watchlist item
Create alert rule
Existing alert list
Alert Active badge
router.refresh after mutations
```

---

### Phase 7 — Scanner Foundation

Created `/scanner` route with:

```txt
Server-side scanner data loader
View pills
Search
Sort
Filters
Desktop scanner table
Mobile scanner cards
Existing drawer reuse
```

Scanner initially used earlier DB/mock-style data and legacy concepts.

---

### Phase 8 — Stock Universes

Added DB-backed stock universe support:

```txt
StockUniverse
StockUniverseMember
Russell 1000 / S&P 500 / Nasdaq 100 flags
Universe selector
Index filter
```

---

### Phase 9B–9H — Market Data Foundation

Built provider and admin sync foundations:

```txt
FMP provider
Twelve Data provider
Finnhub provider
Admin Sync page
Provider tests
SyncRun / SyncRunItem logs
Data inventory concepts
Nasdaq 100 universe sync fallback
Chunked/resumable sync foundations
Finnhub basic financials research
```

---

### Phase 9I — Fundamental Score Foundation

Added Fundamental Score calculation foundation using DB metrics.

Introduced score categories:

```txt
Growth
Profitability
Valuation
Financial Health
Risk / Context
```

Later UI language renamed Risk/Context to Stability.

---

### Phase 10 — Scanner Real Data Integration

Moved Scanner toward real DB-backed Nasdaq 100 data.

Scanner began using synced quote/metric/score data rather than only seeded mock data.

---

### Phase 11 — Scanner UX / Universe Improvements

Improved Scanner usability and universe/filter behavior.

---

### Phase 12 — Dashboard Real Data Cleanup

Replaced legacy dashboard demo fields with real DB-backed summary cards, scanner readiness, score coverage, top fundamental stocks, sector summary, data coverage, and real watchlist score display.

---

### Phase 13 — Opportunity Score v1

Added Opportunity Score v1.

Initial v1 used:

```txt
Fundamental quality
Valuation
Growth
Risk / Context
Price position
```

It did not include analyst target/upside because coverage was not reliable yet.

---

### Phase 14 — Analyst Data / Upside Integration

Added analyst data sync using FMP + Finnhub after Finnhub target endpoint limitations.

Implemented:

```txt
StockAnalystData
Target price
Upside %
Rating
Analyst count
Scanner columns
Dashboard analyst coverage
Data inventory analyst columns
```

---

### Phase 15 — Quota-Safe Analyst Target Discovery

Created quota-safe target discovery flow for limited/free-plan FMP target coverage.

Later, FMP Starter made broader target coverage available, and this flow became legacy/developer tooling.

---

### Phase 16 — Admin Sync Workflow Restructure

Cleaned Admin Sync actions into production-oriented sections:

```txt
Universe Sync
Daily Market Data Sync
Company Data Sync
Score Calculation
Developer / Legacy Tools
```

---

### Phase 17 — FMP Company Data Sync Migration

Moved analyst targets to FMP `price-target-consensus`.

Cleaned provider boundaries:

```txt
fmp.ts = FMP only
finnhub.ts = Finnhub only
sync route composes providers
```

Result: target coverage became 100/100 for Nasdaq 100.

---

### Phase 18 — FMP Fundamentals / Ratios / Growth Migration

Expanded Company Data Sync to persist FMP fundamentals:

```txt
Profile
Ratios TTM
Financial growth
Margins
ROE / ROA
Debt / liquidity metrics
Valuation ratios
Beta
Market cap
```

StockMetric became FMP-owned for company/fundamental data.

---

### Phase 19 — FMP Daily Market Data Sync Migration

Moved Daily Market Data Sync from legacy Finnhub quote/basic metrics to FMP quote.

Daily sync now owns:

```txt
Price
Daily change %
Open / high / low / previous close
Volume
52-week high / low
PriceAvg50 / PriceAvg200
```

Daily sync no longer writes StockMetric.

---

### Phase 20 — Opportunity Score v2

Upgraded Opportunity Score to include analyst data.

Current v2 components:

```txt
Fundamental Quality — 25%
Valuation — 20%
Growth — 15%
Analyst Upside — 20%
Analyst Sentiment — 10%
Price Position — 5%
Stability / Risk Context — 5%
```

`oppScoreVersion = opportunity-v2`.

No provider calls are made during score calculation.

---

### Phase 21A — Scanner Decision View Cleanup

Refactored Scanner from a dense table into a decision view:

```txt
Reduced main columns
Score bars for calculated scores
Analyst rating stars
Risk renamed to Stability
Header and metric tooltips
Quick filter cleanup
Advanced Filters
Active filter summary
Expanded row sections
Chevron bug fix
Mobile card updates
```

---

### Phase 21B — Scanner Pagination, Table Usability & Expanded Row Cleanup

Completed Scanner usability cleanup:

```txt
Default view = All Stocks
Default sort = Opportunity Score descending
Pagination = 10 / 20 / 50 / 100
Search/filter/sort before pagination
Opportunity column highlight
Sort options limited to visible columns
Clear filters behavior
Decision Tag replaces Status
Company Snapshot added to expanded row
Strengths / Concerns cleaned
Mobile pagination
Expanded row overflow fixes
```

Approved schema addition during this phase:

```txt
Stock.description String?
Stock.industry String?
```

Company Data Sync now persists FMP description and industry.

Scanner maps and displays real company descriptions.

---

## Next Planned Phase

```txt
Phase 21C — Drawer Real Data & Decision Workspace Cleanup
```

The drawer is the next legacy area and should be cleaned to use real DB-backed data.
