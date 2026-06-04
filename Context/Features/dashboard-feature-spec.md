# Dashboard Feature Specification — FomoFilter

## When To Read This File

Read this file before changing:

```txt
Dashboard route
Dashboard summary cards
Dashboard top stock tables
Dashboard data health/freshness cards
Dashboard widgets
Dashboard layout
```

---

## When To Update This File

Update this file after QA and before commit approval if Dashboard behavior, layout, data source, metrics, cards, or copy changes.

---

## Current Dashboard Role

The Dashboard is a high-level overview and action surface, not a second Scanner.

It helps the user quickly understand:

```txt
Is the data fresh?
Is the scanner ready?
Which stocks look most interesting at a glance?
Where is analyst upside strongest?
Which stocks are fundamentally strongest?
What is happening in my watchlist?
What active alerts exist?
What needs attention?
```

---

## Current Route

```txt
/
```

---

## Current Data Source

Dashboard reads DB-backed data through `src/lib/data/dashboard.ts`.

It must not call providers from render paths.

---

## Current Dashboard Structure (Phase 21D)

```txt
DashboardHeader
DataWarningsSection          — only rendered when warnings exist
DashboardSummaryCards        — 4 opportunity-facing cards (top section)
DashboardGrid:
  Left column:
    TopOpportunityStocksTable
    TopAnalystUpsideTable
    TopFundamentalStocksTable
    SectorSummaryTable
  Right sidebar:
    WatchlistWidget
    ActiveAlertsSummaryWidget
    DataCoverageSection       — compact Data Health
```

---

## Opportunity Overview Cards (DashboardSummaryCards)

Four decision-facing cards only:

```txt
Scanner Ready     — stocks with quote + score
High Opportunity  — stocks with Opportunity score ≥ 75
Avg Opportunity   — average Opportunity score across universe
Avg Fundamental   — average Fundamental score across universe
```

Admin/data-health metrics (With Metrics, With Scores, Rating Coverage, Target Coverage, Last Market Sync, Last Score Calc) are demoted to the compact DataCoverageSection in the right sidebar.

---

## Top Opportunity Stocks Widget

- Sorted by Opportunity Score descending.
- Columns: Symbol, Sector, Price, Day %, Opportunity (score bar), Fundamental (score bar), Analyst Upside.
- Top 10 stocks.
- CTA: "View all in Scanner →" in header and footer strip.
- DB-backed, derived from existing loaded data in `getDashboardData`.

---

## Top Analyst Upside Widget

- Sorted by analyst upside percent descending.
- Columns: Symbol, Price, Target, Upside, Rating, Fundamental, Opportunity.
- All labels use full words: Fundamental, Opportunity (not Fund., Opp.).
- Top 10 stocks.

---

## Top Fundamental Stocks Widget

- Sorted by Fundamental Score descending.
- Columns: Symbol, Sector, Price, Day %, Opportunity, Fundamental.
- Simplified from prior spec: Growth, Profitability, Valuation, Financial Health sub-score columns removed.
- Those detailed sub-scores belong in Scanner expanded row.
- CTA: "View all in Scanner →".
- Top 15 stocks.

---

## Sector Summary Widget

- Sorted by average Fundamental Score descending.
- Columns: Sector, Stocks, Avg Fundamental (with bar), Avg Growth, Avg Profitability, Top Stock.
- Labels use full words: Avg Fundamental, Avg Profitability (not Avg Fund., Avg Profit.).

---

## Active Alerts Summary Widget

- DB-backed, reads from active `alertRule` records.
- Shows total active rule count.
- Lists symbols with active rules.
- Shows alert type (human-readable label) and threshold per rule.
- `HOT_SCORE_ABOVE` alert type displays as "Hot Score Above (legacy)" — safe legacy display only.
- Does not evaluate alerts; evaluation engine is future work.

---

## Watchlist Widget

- DB-backed, reads from `watchlistItem` records.
- Shows symbol, name, price, day %, Opportunity Score, Fundamental Score, status badge, and user note.
- Status labels:
  - WATCHING → Watching
  - WAITING_FOR_PULLBACK → Waiting for Pullback
  - WAITING → Waiting for Pullback
  - READY_TO_BUY → Ready
  - HOLDING → Holding
  - AVOIDING → Avoiding
  - ARCHIVED → Archived
- CTA: "Review watchlist in Scanner →".
- DB enum is unchanged.

---

## Data Health Widget (DataCoverageSection)

- Compact right-sidebar widget.
- Shows Scanner Ready %, Scores %, Metrics % as mini coverage bars.
- Shows Last Market Sync and Last Score Calc timestamps.
- Secondary information — does not dominate the Dashboard surface.

---

## Data Warnings Section

- Shown only when warnings exist (missing sync, missing scores, stale scores).
- Rendered above the summary cards, high prominence.

---

## What Dashboard Should Not Be

```txt
A second Scanner table
A raw data inventory (admin-flavored)
A debug-only admin page
A mock AI insight page
```

Detailed row-level analysis belongs in:

```txt
Scanner
Drawer
Future stock details page
```

Admin/data coverage belongs in:

```txt
Admin Sync / Data Inventory
```

---

## Active Components (Phase 21D)

```txt
DashboardHeader.tsx
DashboardSummaryCards.tsx
DataWarningsSection.tsx
DashboardGrid.tsx
TopOpportunityStocksTable.tsx   — new in Phase 21D
TopFundamentalStocksTable.tsx
TopAnalystUpsideTable.tsx
SectorSummaryTable.tsx
WatchlistWidget.tsx
ActiveAlertsSummary.tsx         — new in Phase 21D
DataCoverageSection.tsx
```

Drawer panel components shared with Scanner Drawer (do not delete):

```txt
src/components/dashboard/drawer/AddToWatchlistPanel.tsx
src/components/dashboard/drawer/EditWatchlistPanel.tsx
src/components/dashboard/drawer/CreateAlertPanel.tsx
src/components/dashboard/drawer/DrawerSuccessMessage.tsx
```

---

## Deleted Legacy Components (Phase 21D)

The following were orphaned and deleted:

```txt
HotStocksTable.tsx
MobileHotStockCard.tsx
AiInsightsWidget.tsx
TodaysSignalCard.tsx
TopScoreChanges.tsx
DiscoverSetups.tsx
RecentAlertsWidget.tsx
MarketStatsGrid.tsx
SummaryCardsGrid.tsx
```

`StockPreviewDrawer.tsx` was retained — it is imported and used by `ScannerPageClient.tsx`.

`src/lib/mock-data.ts` was retained — it still has active imports from Scanner components and scoring utilities.

---

## Navigation / CTAs

```txt
View all in Scanner →       — in TopOpportunityStocksTable and TopFundamentalStocksTable
Open Scanner →              — footer strip in TopOpportunityStocksTable
Review watchlist in Scanner → — footer of WatchlistWidget
Add stocks from the Scanner — empty-state link in WatchlistWidget
```

No new routes. No drawer integration from Dashboard in Phase 21D.

---

## Data Loader

`src/lib/data/dashboard.ts` — `getDashboardData()`:

```txt
topOpportunityStocks     — derived from existing dbStocks, sorted by oppScore desc, top 10
topFundamentalStocks     — sorted by fundamentalScore desc, top 15
topAnalystUpsideStocks   — sorted by analystUpsidePercent desc, top 10
sectorSummary            — aggregated by sector, sorted by avgFundamentalScore desc
alertRulesBySymbol       — active alertRules grouped by symbol
activeAlertsSummary      — totalRules + bySymbol array from alertRulesBySymbol
watchlistItems           — includes oppScore (added Phase 21D)
summary                  — DashboardSummary with coverage counts and averages
freshness                — lastMarketDataSyncAt, lastScoreCalculationAt, coverage percents
dataWarnings             — generated from sync and score state
user                     — from DB
```

---

## Terminology Reference

Active labels used on Dashboard:

```txt
Opportunity
Fundamental
Analyst Upside
Rating
Target
Stability (if applicable)
Avg Fundamental
Avg Profitability
Avg Growth
Waiting for Pullback
```

Forbidden labels on Dashboard (except legacy alert display):

```txt
Opp.
Fund.
Profit.
Valuat.
Hot Score
FOMO Risk
Signal
Setup
AI Insight
Risk (as a score label)
```

---

## Related Docs

```txt
Context/project-overview.md
Context/scoring-system.md
Context/sync-workflows.md
Context/data-model.md
Context/Features/scanner-feature-spec.md
Context/Features/drawer-feature-spec.md
```
