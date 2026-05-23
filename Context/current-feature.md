# Phase 9I — Fundamental Score Foundation + Score Methodology Tab

## Status

Completed (2026-05-23)

---

## Goal

Build the first version of FomoFilter's **Fundamental Score**.

The score should rate the quality of a company based on the financial metrics already synced from Finnhub into `StockMetric`.

This phase should also add an Admin documentation tab that explains how the score is calculated, which metrics are used, what each metric means, and how a sample score is derived.

The goal is not to create the final perfect scoring system. The goal is to create a transparent, deterministic, explainable v1 score that makes Nasdaq 100 stocks eligible for the Scanner once they have both:

```txt
StockQuote
StockScore
```

---

## Why This Phase Is Needed

The Scanner currently requires:

```ts
quote: { isNot: null }
score: { isNot: null }
```

After the previous phases, Nasdaq 100 stocks have:

- Universe membership.
- Quote snapshot.
- Basic financial metrics.
- Data Inventory visibility.

But many stocks still do not have `StockScore`.

Therefore, they are not visible in `/scanner`.

This phase should create the first real `StockScore` rows based on available fundamentals.

---

## Product Direction

The first score should be:

```txt
Fundamental Score
```

It should answer:

```txt
How fundamentally strong is this company?
```

It should not yet answer:

```txt
Is this stock a perfect buy today?
Is this stock technically breaking out?
Is this stock cheap relative to analyst target?
Is there a news catalyst?
```

Those can be separate future scores.

---

## Important Scope Decision

This phase should focus on a **fundamentals-first deterministic score**.

Use only fields already available in `StockMetric`.

Do not use:

- AI.
- News.
- Analyst target price.
- Analyst upside.
- Technical indicators.
- Historical candles.
- Sector-relative Z-score.
- Peer ranking.
- FCF/ROIC/moat fields not currently available.
- External provider calls.

---

## User's Full Scoring Vision

The long-term desired model includes:

### Profitability

- ROE.
- ROA.
- ROIC.
- Gross Margin.
- Operating Margin.
- Net Margin.
- EPS Growth.

### Financial Health

- Debt/Equity.
- Current Ratio.
- Quick Ratio.
- Interest Coverage Ratio.
- Free Cash Flow.
- FCF Margin.

### Growth

- Revenue Growth YoY.
- Revenue Growth 3Y CAGR.
- EPS Growth.
- FCF Growth.
- Book Value Growth.

### Valuation

- P/E.
- P/B.
- P/FCF.
- EV/EBITDA.
- PEG Ratio.

### Efficiency

- Asset Turnover.
- Inventory Turnover.
- Days Sales Outstanding.
- Operating Leverage.

### Moat Indicators

- Margin consistency over time.
- Market share stability/growth.
- R&D as % of revenue.
- Brand strength.
- Customer loyalty.

### Desired Future Scoring Method

Long term, the ideal score may use:

- Peer comparison by sector.
- Normalized 0–10 metric scores.
- Sector-specific weights.
- Different emphasis per sector.

Examples:

| Sector | Possible Emphasis |
| --- | --- |
| Technology | Growth + FCF |
| Financials | ROE + P/B |
| Utilities | Liquidity + debt |
| Consumer | Margins + consistency |

This long-term vision is valid, but it is too large for v1.

---

## Challenge / Design Constraint

Not all desired metrics are currently available.

Current Finnhub metrics cover many useful fields, but not all long-term fields.

### Available Now From `StockMetric`

Available and suitable for v1:

- Revenue Growth TTM YoY.
- EPS Growth TTM YoY.
- Revenue Growth 3Y.
- EPS Growth 3Y.
- Gross Margin TTM.
- Operating Margin TTM.
- Net Profit Margin TTM.
- ROE TTM.
- ROA TTM.
- Debt / Equity.
- Current Ratio.
- Quick Ratio.
- Interest Coverage.
- P/E TTM.
- Forward P/E.
- PEG TTM.
- Forward PEG.
- P/S.
- P/B.
- EV/EBITDA.
- EPS TTM.
- Beta.
- Market Cap.
- 52W High.
- 52W Low.
- Dividend Yield.

### Not Available / Not In v1

Do not include in v1:

- ROIC.
- Free Cash Flow.
- FCF Margin.
- FCF Growth.
- Book Value Growth.
- P/FCF.
- Asset Turnover.
- Inventory Turnover.
- DSO.
- Operating Leverage.
- Margin consistency over time.
- Market share.
- R&D as % of revenue.
- Brand strength.
- Customer loyalty.
- Sector-relative peer comparison.
- Z-score normalization.

These can be future phases once data is available and the model is stable.

---

## Scoring Method v1

Use deterministic threshold scoring.

Each metric should be converted into a normalized score from:

```txt
0 to 10
```

Then each category score should be calculated from its metric scores.

Then the final Fundamental Score should be a weighted average from category scores.

Do not use Z-score in v1.

Do not use relative ranking in v1.

Reason:

- Nasdaq 100 is too small for stable sector-relative distributions.
- Outliers can distort Z-scores.
- Deterministic thresholds are easier to debug.
- The scoring method should be explainable in the Admin `Score Methodology` tab.

---

## v1 Category Weights

Use these initial category weights:

| Category | Weight |
| --- | ---: |
| Growth | 30% |
| Profitability | 30% |
| Valuation | 20% |
| Financial Health | 15% |
| Risk / Context | 5% |

Total:

```txt
100%
```

These weights can be adjusted later.

---

## v1 Categories and Metrics

### 1. Growth — 30%

Use:

| Metric | Source Field |
| --- | --- |
| Revenue Growth TTM YoY | `StockMetric.revenueGrowthTTMYoy` |
| EPS Growth TTM YoY | `StockMetric.epsGrowthTTMYoy` |
| Revenue Growth 3Y | `StockMetric.revenueGrowth3Y` |
| EPS Growth 3Y | `StockMetric.epsGrowth3Y` |

Optional future metric:

- Quarterly growth, but do not use it heavily in v1 because it is more volatile.

### 2. Profitability — 30%

Use:

| Metric | Source Field |
| --- | --- |
| Gross Margin TTM | `StockMetric.grossMarginTTM` |
| Operating Margin TTM | `StockMetric.operatingMarginTTM` |
| Net Profit Margin TTM | `StockMetric.netProfitMarginTTM` |
| ROE TTM | `StockMetric.roeTTM` |
| ROA TTM | `StockMetric.roaTTM` |

Important:

ROE should be capped for scoring because buyback-heavy companies can show extreme values.

Do not change the stored raw value.

Only cap the value inside the scoring function.

Recommended scoring cap:

```txt
ROE values above 60% should be treated as 60% for scoring.
```

### 3. Financial Health — 15%

Use:

| Metric | Source Field |
| --- | --- |
| Debt / Equity | `StockMetric.totalDebtToEquityAnnual` |
| Current Ratio | `StockMetric.currentRatioAnnual` |
| Quick Ratio | `StockMetric.quickRatioAnnual` |
| Interest Coverage | `StockMetric.netInterestCoverageAnnual` |

Important:

Interest Coverage should be capped for scoring.

Recommended scoring cap:

```txt
Interest Coverage values above 30x should be treated as 30x for scoring.
```

### 4. Valuation — 20%

Use:

| Metric | Source Field |
| --- | --- |
| P/E TTM | `StockMetric.peBasicExclExtraTTM` |
| Forward P/E | `StockMetric.forwardPE` |
| PEG TTM | `StockMetric.pegTTM` |
| Forward PEG | `StockMetric.forwardPEG` |
| P/S | `StockMetric.psTTM` |
| EV/EBITDA | `StockMetric.evEbitdaTTM` |

Important:

Lower valuation is not always automatically better.

Avoid giving maximum score to suspiciously low values.

Use bounded ranges.

### 5. Risk / Context — 5%

Use:

| Metric | Source Field |
| --- | --- |
| Beta | `StockMetric.beta` |
| Market Cap | `StockMetric.marketCapitalization` |

This category should have low weight.

Purpose:

- Slightly penalize extreme beta.
- Slightly reward stability/scale.
- Avoid over-weighting size.

Do not use 52W high/low in this score yet.

52W high/low may be useful later for technical/contextual timing, but this phase is fundamentals-first.

---

## Metric Scoring Rules

Implement simple helper functions.

Suggested examples:

### Higher Is Better

Use for:

- Revenue growth.
- EPS growth.
- Margins.
- ROA.
- Current ratio up to an ideal range.
- Interest coverage up to cap.

Example:

```txt
>= 25% → 10
15% to 25% → 8
8% to 15% → 6
0% to 8% → 4
< 0% → 1
missing → null
```

### Lower Is Better

Use for:

- Debt / Equity.
- PEG.
- P/E after sensible bounds.
- EV/EBITDA after sensible bounds.

Example for Debt / Equity:

```txt
0 to 0.5 → 10
0.5 to 1.0 → 8
1.0 to 2.0 → 5
2.0 to 4.0 → 2
> 4.0 → 0
missing → null
```

### Ideal Range

Use for:

- Current Ratio.
- Quick Ratio.
- P/E.
- Beta.

Example for Current Ratio:

```txt
1.5 to 3.0 → 10
1.0 to 1.5 → 7
3.0 to 5.0 → 6
0.7 to 1.0 → 3
< 0.7 → 0
> 5.0 → 5
missing → null
```

Example for Beta:

```txt
0.8 to 1.4 → 10
0.5 to 0.8 → 8
1.4 to 1.8 → 6
1.8 to 2.5 → 3
> 2.5 → 1
< 0.5 → 6
missing → null
```

### Cap Extreme Values

Use caps inside the scoring function:

```txt
ROE cap: 60%
Interest Coverage cap: 30x
```

Do not cap stored raw values.

---

## Missing Metric Handling

If a metric is missing:

- Do not give it 0 automatically.
- Exclude it from that category's average.
- If all metrics in a category are missing, category score should be null.
- If a category score is null, exclude it from the final weighted average.
- Final score should be calculated from available category weights only, re-normalized.

Example:

If Risk/Context is missing but all other categories exist, calculate the final score from the other 95% of weights normalized to 100%.

This prevents one missing optional metric from unfairly destroying the score.

---

## Output Score Scale

Store and display scores from:

```txt
0 to 100
```

Internal metric score:

```txt
0 to 10
```

Category scores:

```txt
0 to 100
```

Final Fundamental Score:

```txt
0 to 100
```

Example:

```txt
Growth metric average: 7.5 / 10 → Growth Score: 75
```

---

## DB / StockScore Model

Use the existing `StockScore` model if it already exists.

Do not create a new score table unless the current model cannot support the required fields.

Inspect current Prisma schema before implementation.

The score should store at least:

- Total fundamental score.
- Growth score.
- Profitability score.
- Valuation score.
- Financial health score.
- Risk/context score.
- Last calculated timestamp.
- Method/version if possible.

If the existing `StockScore` model has different field names, map to the closest existing fields.

If fields are missing and a migration is needed, add only the required fields.

Possible fields:

```txt
fundamentalScore
growthScore
profitabilityScore
valuationScore
financialHealthScore
riskContextScore
scoreVersion
lastCalculatedAt
```

Do not add unrelated score fields.

---

## Score Version

Use a version label:

```txt
fundamental-v1
```

Store it if the schema supports it or if a migration is added.

If not stored in DB, at minimum include it in code constants and methodology documentation.

---

## Score Calculation Target

Add an Admin action to calculate scores for stocks with metrics.

Recommended button:

```txt
Calculate Fundamental Scores
```

Recommended section:

```txt
Score Calculation
```

Recommended location:

```txt
/admin/sync → Sync Actions
```

or a new tab if the existing page is too crowded.

This action should:

1. Find stocks with `StockMetric`.
2. Calculate Fundamental Score.
3. Upsert `StockScore`.
4. Persist a `SyncRun` / `SyncRunItem` or a similar log if the existing sync log system supports internal calculations.
5. Return counts:
   - requested
   - calculated
   - skipped
   - failed

The action should not call external APIs.

---

## SyncRun Logging

Even though this is not an external provider sync, it should be logged.

Recommended:

```txt
SyncRun.type = fundamental-score-calculation
SyncRun.provider = internal
```

Per-symbol item examples:

```txt
Calculated fundamental-v1 score
Skipped — missing StockMetric
Failed — invalid data
```

---

## Admin UI Updates

### Sync Actions Tab

Add a section:

```txt
Score Calculation
```

Button:

```txt
Calculate Fundamental Scores
```

Helper text:

```txt
Calculates internal Fundamental Score v1 for stocks with synced Finnhub metrics. Does not call external APIs.
```

Badge:

```txt
Internal
```

or:

```txt
Writes to DB
```

The existing progress panel pattern should be used.

---

## Data Inventory Updates

Update the Data Inventory tab to show score fields.

Recommended new columns:

| Column | Source Label |
| --- | --- |
| Fundamental Score | Internal |
| Growth Score | Internal |
| Profitability Score | Internal |
| Valuation Score | Internal |
| Financial Health Score | Internal |
| Risk / Context Score | Internal |
| Score Version | Internal |
| Score Last Calculated | DB / Internal |
| Has Score | Internal |
| Scanner Eligible | Internal |
| Missing Reason | Internal |

`Has Score`, `Scanner Eligible`, and `Missing Reason` already exist, but must reflect the new `StockScore` rows.

Expected after calculation:

- Stocks with quote + metrics + score should become Scanner Eligible.
- Stocks missing quote remain not eligible.
- Stocks missing metrics remain not eligible.
- Stocks with metrics but failed score calculation should show a clear missing/failure reason if available.

---

## Score Methodology Tab

Add a new Admin tab:

```txt
Score Methodology
```

Purpose:

Provide live documentation for how the Fundamental Score is calculated.

This tab should help the user understand and later adjust the model.

It should include:

1. Short overview of Fundamental Score.
2. Category weights table.
3. Category explanations.
4. Metric explanations.
5. Source field names.
6. Direction:
   - higher is better
   - lower is better
   - ideal range
7. Scoring examples.
8. Caps / warnings.
9. Future improvements.

---

## Score Methodology Content

### Overview Section

Explain:

```txt
Fundamental Score v1 rates company quality from 0 to 100 using available Finnhub basic financial metrics.
It is deterministic, transparent, and does not use AI or external calls during calculation.
```

### Category Weight Table

Include:

| Category | Weight | Main Idea |
| --- | ---: | --- |
| Growth | 30% | Revenue and EPS expansion |
| Profitability | 30% | Margins and returns |
| Valuation | 20% | Price paid relative to earnings/sales/EBITDA/growth |
| Financial Health | 15% | Debt, liquidity, and interest coverage |
| Risk / Context | 5% | Beta and company size context |

### Metric Table

For each metric, show:

| Metric | Category | Source | Direction | Example Rule | Notes |
| --- | --- | --- | --- | --- | --- |

Example row:

| ROE | Profitability | Finnhub `roeTTM` | Higher is better, capped | 30%+ = strong | Capped at 60% for scoring because buybacks can distort ROE |

### Example Calculation

Add one simple illustrative example.

Example:

```txt
Example Company
Growth Score: 80
Profitability Score: 75
Valuation Score: 60
Financial Health Score: 70
Risk / Context Score: 65

Final Score =
80 * 0.30 +
75 * 0.30 +
60 * 0.20 +
70 * 0.15 +
65 * 0.05
= 72.25
```

This example does not need to use a real stock.

---

## Do Not Build Yet

Do not build in this phase:

- Sector-relative scoring.
- Z-score.
- Peer comparison.
- AI-generated scores.
- Moat score.
- FCF score.
- ROIC score.
- Efficiency score.
- Analyst target/upside score.
- News/catalyst score.
- Technical score.
- Stock recommendation engine.
- Buy/sell/hold advice.

The methodology tab may list these as future improvements, but they should not affect the score.

---

## Scanner Behavior

Do not directly change Scanner filters or UI.

After `StockScore` rows are created, the existing Scanner may start showing Nasdaq 100 stocks because the existing condition is satisfied:

```ts
quote exists
score exists
```

This is acceptable.

But do not edit Scanner logic in this phase unless a clear bug is discovered and approved.

---

## Validation

Run:

```txt
npm run build
npx tsc --noEmit
npx prisma validate
npx prisma migrate status
```

If a migration is needed, use a clear migration name, such as:

```txt
add_fundamental_score_fields
```

---

## Browser QA

### Score Calculation

Open:

```txt
/admin/sync → Sync Actions
```

Run:

```txt
Calculate Fundamental Scores
```

Confirm:

1. Button appears.
2. Helper text says internal calculation and no external APIs.
3. Progress panel appears.
4. Result shows calculated/skipped/failed counts.
5. Sync History records the run with provider `internal`.
6. No external API call happens.

### Data Inventory

Open:

```txt
/admin/sync → Data Inventory
```

Confirm:

1. Fundamental Score columns are visible.
2. Score source row labels show `Internal`.
3. Stocks with metrics now show score values.
4. Has Score changes to Yes.
5. Scanner Eligible changes to Yes for stocks with quote + score.
6. Missing Reason changes to Ready for scanner for eligible stocks.

### Score Methodology

Open:

```txt
/admin/sync → Score Methodology
```

Confirm:

1. Tab appears.
2. Category weights are shown.
3. Metric explanations are shown.
4. Example calculation is shown.
5. Caps and known limitations are documented.
6. Future improvements are listed.

### Scanner Smoke Test

Open:

```txt
/scanner
```

Confirm:

1. Page loads.
2. Nasdaq 100 stocks with quote + score may now appear.
3. No external provider API calls happen from Scanner render.
4. Existing scanner layout does not break.

---

## Required Implementation Report

Return a concise report in English only with:

1. Files created.
2. Files changed.
3. Whether a migration was needed.
4. If migration was added, migration name and fields.
5. StockScore model fields used/added.
6. Score calculation helpers created.
7. Category weights.
8. Metric scoring rules implemented.
9. Missing metric behavior.
10. Caps implemented.
11. Score methodology tab content.
12. Admin action added.
13. SyncRun logging summary.
14. Data Inventory updates.
15. Browser QA results.
16. Scanner smoke test result.
17. Automated check results.
18. Known issues.
19. Ready for commit or not.

---

## Acceptance Criteria

Phase 9I is complete when:

- Fundamental Score v1 is calculated from existing `StockMetric` data.
- Score is deterministic and explainable.
- No external API calls are made during score calculation.
- `StockScore` rows are created or updated.
- Data Inventory shows score columns.
- `Score Methodology` tab explains the model.
- SyncRun logs the internal score calculation.
- Missing metrics do not automatically become zero.
- Extreme values are capped only during scoring, not in raw stored data.
- Scanner is not directly modified.
- Build passes.
- TypeScript passes.
- Prisma validates.
- Migration status is clean.

---

## History

- Initial Next.js setup: Cleaned up boilerplate by keeping only H1 in `page.tsx`, removed default CSS styles in `globals.css` while keeping Tailwind import, deleted default SVG files, committed changes, and pushed to GitHub repository.
- Planned dashboard implementation in multiple phases.
- Current feature defined as Phase 1: Dashboard Static Layout with Mock Data.
- Phase 1 completed (2026-05-11): Built full dashboard shell with sidebar, top bar, and all 10 widgets using mock data only. Installed lucide-react. Created `src/lib/formatters.ts` and all components under `src/components/layout/` and `src/components/dashboard/`. Polish pass: fixed Today's Signal copy, separated setup status from catalyst in mock data, changed logo accent to emerald, added bottom scroll padding. Build passes with zero TypeScript errors. Approved by user.
- Phase 2 completed (2026-05-12): Added right-side stock preview drawer. Clicking a row in `HotStocksTable` highlights the row and slides in a 520px drawer from the right. Drawer includes: sticky header (symbol, price, badges, close button), Decision Snapshot, Hot and Opportunity score cards, AI Insight, Price Context (mock SVG chart with timeframe pills), Score Breakdown (progress bars), Main Catalyst, Watch Context (watchlist vs non-watchlist states), and sticky CTA footer. Added `StockDrawerDetail` type and `mockStockDrawerDetails` to `mock-data.ts`. Created `DashboardGrid.tsx` as a client component managing selected stock state and close animation timing. Slide-in and slide-out animations registered via Tailwind v4 `@theme` directive. Row de-selects and drawer closes with exit animation when re-clicking the same row or pressing X. Build passes with zero TypeScript errors. Approved by user.
- Phase 3 completed (2026-05-12): Implemented drawer action flows — Add to Watchlist, Edit Watchlist, and Create Alert — as inline panels inside the existing stock preview drawer. Created `src/types/drawer.ts` for local state types. Created four new components under `src/components/dashboard/drawer/`: `AddToWatchlistPanel.tsx`, `EditWatchlistPanel.tsx`, `CreateAlertPanel.tsx`, and `DrawerSuccessMessage.tsx`. Updated `StockPreviewDrawer.tsx` to manage `activeDrawerAction` and `successMessage` state, render the active panel at the top of the scrollable area, update Watch Context from local state, and wire all CTA footer buttons. Updated `DashboardGrid.tsx` to hold `localWatchlistEntries` state and pass it down with callbacks. Updated `HotStocksTable.tsx` to accept a `watchlistSymbols` set so table stars update immediately when a stock is added locally. Drawer slide animation switched from CSS keyframe class-swapping (unreliable on persistent DOM elements) to a CSS transition approach using `translate-x` and `opacity` with a `requestAnimationFrame` mount trigger. Build passes with zero TypeScript errors. Approved by user.
- Phase 4 completed (2026-05-12): Made the existing dashboard and stock preview drawer responsive across desktop, tablet, and mobile. Created `ClientAppShell.tsx` to manage mobile sidebar state and backdrop. Updated `AppSidebar.tsx` to slide in from the left on mobile with a close button, always visible on `md+`. Updated `TopBar.tsx` with a hamburger menu button on mobile and a second-row search input. Updated `app/page.tsx` to use `ClientAppShell`. Made `MarketStatsGrid` 2-column on mobile and `SummaryCardsGrid` single-column on mobile. Updated `DashboardGrid.tsx` to stack to a single column on mobile. Created `MobileHotStockCard.tsx` for mobile Hot Stocks display. Updated `HotStocksTable.tsx` to hide the wide table on mobile and show mobile cards instead. Updated `StockPreviewDrawer.tsx` to be full-screen on mobile (`fixed inset-0`) and right-side 520px panel on desktop. Added scroll-to-top behavior when opening a drawer action panel from the sticky footer using a `scrollContainerRef`. Build passes with zero TypeScript errors. Approved by user.
- Phase 5 completed (2026-05-17): Added Prisma 7 data layer foundation with PostgreSQL (Neon). Installed `prisma`, `@prisma/client`, `@prisma/adapter-pg`, `pg`, `tsx`, `dotenv`. Created `prisma/schema.prisma` with 13 models (Stock, StockQuote, StockScore, StockDrawerDetail, WatchlistItem, User, AlertRule, MarketStat, DashboardSummaryCard, DiscoverSetup, AiInsight, RecentAlert, plus enums). Configured Prisma 7 with `prisma.config.ts` (dotenv loading + datasource URL — required because Prisma 7 no longer supports `url` in schema.prisma). Created `src/lib/db/prisma.ts` as a singleton PrismaClient using `@prisma/adapter-pg`. Created `prisma/seed.ts` seeding all dashboard data (user, market stats, summary cards, 5 hot stocks with quotes/scores/drawer details, 3 extra stocks for top score changes, watchlist items, discover setups, AI insights, recent alerts). Created `src/lib/data/dashboard.ts` with `getDashboardData()` server-side loader. Updated `app/page.tsx` to be an async server component calling `getDashboardData()` and passing data as props; marked `force-dynamic` to prevent static pre-rendering. Updated all dashboard components to accept data as props instead of importing from `mock-data.ts` — type-only imports from `mock-data.ts` remain (types are still defined there); `TodaysSignalCard` still uses `mockTodaysSignal` as there is no DB model for the signal yet. Applied migration and seed to both dev (`ep-dry-river`) and prod (`ep-red-block`) Neon databases. Seed is idempotent (upserts by unique keys; AiInsight/RecentAlert/SummaryCard use deleteMany+createMany). Add/Edit/Alert drawer actions remain local-only. Build passes with zero TypeScript errors. Approved by user.
- Phase 6 completed (2026-05-18): Replaced local-only drawer actions with DB-backed Server Actions and Prisma. Created `src/lib/data/current-user.ts` with `getCurrentUserForDemo()` helper (looks up demo user by email, easy to swap for real auth later). Created `src/lib/validation/drawer-actions.ts` with Zod schemas for all four mutations. Created `src/actions/drawer-actions.ts` with four server actions: `addStockToWatchlist` (upsert via `userId_stockId` composite key), `updateWatchlistItem` (find by composite key then update by id), `removeStockFromWatchlist` (find then delete by id), `createAlertRule` (create with stock/user lookup). Prisma 7 enum values used as string literals with `as const` (Prisma 7 does not re-export enums from `@prisma/client`). Added `ActiveAlertRule` exported type and `alertRulesBySymbol: Record<string, ActiveAlertRule[]>` to `getDashboardData()` in `dashboard.ts`; the alert rule query runs separately after the 9-element `Promise.all` to avoid TypeScript tuple inference breakage at 10+ elements. Threaded `alertRulesBySymbol` through `app/page.tsx` → `DashboardGrid` → `StockPreviewDrawer` → `CreateAlertPanel`. Added "Alert Active" amber badge to drawer header when `existingAlerts.length > 0`. Added existing alerts list inside `CreateAlertPanel` with `formatAlertType` / `formatFrequency` helpers. Added Remove from Watchlist button at the bottom of `EditWatchlistPanel` (red-tinted text, trash icon, separate `useTransition` from save). All mutations call `router.refresh()` on success to reload server data; `DashboardGrid` syncs `selectedStock` from refreshed `hotStocks` prop via `useEffect`. No new Prisma models added, no migration created — existing Phase 5 schema was sufficient. Build passes with zero TypeScript errors. `prisma validate` and `prisma migrate status` both pass clean. Approved by user.
- Phase 7 completed (2026-05-18): Built the Scanner page foundation at `/scanner`. Created `src/lib/data/scanner.ts` with `getScannerData()` server-side loader using existing Prisma models (Stock, StockQuote, StockScore, StockDrawerDetail, WatchlistItem, AlertRule). Created `app/scanner/page.tsx` as a dynamic server component. Created 7 scanner-specific components under `src/components/scanner/`: `ScannerPageClient.tsx` (client state manager), `ScannerHeader.tsx`, `ScannerViewPills.tsx` (8 preset views: All Stocks, Hot Today, Strong Momentum, Best Opportunities, Unusual Volume, FOMO Risk, In Watchlist, Alert Active), `ScannerControls.tsx` (search input + sort dropdown + result count), `ScannerFilters.tsx` (Sector / Risk / Setup dropdowns + Watchlist / Alert Active toggles + Clear), `ScannerTable.tsx` (desktop 13-column table with hover and selected-row state), `MobileScannerCard.tsx` (mobile stock cards). Client-side filtering and sorting (Best Signal formula, Hot Score, Opp Score, Daily Change, Relative Volume, Analyst Upside, Symbol). Reused existing `StockPreviewDrawer` from the dashboard without modification — all drawer actions (Add/Edit/Remove Watchlist, Create Alert) work identically from the Scanner. Updated `AppSidebar.tsx` to use `usePathname()` and `Link` for dynamic active nav state so Scanner nav item highlights correctly. Added `showSearch` prop to `TopBar` and `ClientAppShell` (defaults `true`) and passed `showSearch={false}` from the scanner page to hide the redundant TopBar search on `/scanner`. No new Prisma models, no migration, no schema changes. No duplicate server actions. Build passes with zero TypeScript errors. `prisma validate` and `prisma migrate status` both pass clean. Approved by user.
- Phase 8 completed (2026-05-19): Added database-backed market universe support to the Scanner. Added `StockUniverseType` enum, `StockUniverse` and `StockUniverseMember` models to `prisma/schema.prisma`; added `universeMemberships` relation on `Stock`. Applied migration `20260519115623_add_stock_universes`. Updated `prisma/seed.ts` to create/upsert three system universes (Russell 1000 as `BASE_UNIVERSE` with `isDefault=true`, S&P 500 and Nasdaq 100 as `INDEX`) and assign all 8 seeded stocks to Russell 1000 with demo sub-membership (NVDA/AMD/TSLA → S&P 500 + Nasdaq 100, PLTR → S&P 500, SMCI/SOFI/KVYO/MHNI → Russell 1000 only). Seed is fully idempotent. Updated `getScannerData()` to accept `universeSlug` param (defaults to `russell-1000`), filter stocks by universe membership, include per-stock membership slugs, and derive `isSp500`, `isNasdaq100`, `isRussell1000`, `isRussell1000Only` flags — `isRussell1000Only` is computed, not stored. Scanner page reads `?universe=<slug>` query param and passes available universes and selected slug to the client. Added Universe selector strip (Globe icon, shows base universes, highlights active). Added Index filter dropdown (All Indexes / S&P 500 / Nasdaq 100 / Russell 1000 Only) to `ScannerFilters`; clear filters resets it to All. Added compact index badge below stock name in `ScannerTable` symbol cell and in `MobileScannerCard`. Added five optional universe fields to `HotStock` type in `mock-data.ts` (no dashboard impact). No external APIs, no real index import, no scoring engine, no price-eligibility rules. All existing scanner/drawer/dashboard behavior preserved. Build passes with zero TypeScript errors. `prisma validate` and `prisma migrate status` both pass clean. Seed idempotency verified by running twice. Approved by user.
- Phase 9B completed (2026-05-19): Built the market data provider layer and admin manual sync shell. Created shared provider types in `src/lib/market-data/types.ts` (`MarketDataProvider`, `ProviderTestResult`, `NormalizedQuote`, `NormalizedCompanyProfile`, `NormalizedNewsItem`, `SyncSummary`). Created three server-side-only provider clients: `providers/fmp.ts` (`testFmpProfile`, `fetchFmpCompanyProfile`, `fetchFmpAnalystTarget`), `providers/twelve-data.ts` (`testTwelveQuote`, `fetchTwelveQuote`, `fetchTwelveQuotes` batch), `providers/finnhub.ts` (`testFinnhubNews`, `fetchFinnhubCompanyNews`, `fetchFinnhubQuote`). All providers check for missing API key, handle HTTP errors, handle rate limits (429), normalize response shapes, and never expose keys. Created `src/actions/market-data-actions.ts` with five server actions: `testFmpProfileAction`, `testTwelveQuoteAction`, `testFinnhubNewsAction`, `syncQuotesSampleAction` (upserts `StockQuote` for up to 5 DB symbols via Twelve Data), `syncProfilesSampleAction` (updates `Stock.name/sector/marketCap` for up to 5 DB symbols via FMP). Raw provider response bodies stripped from action returns via `stripRaw()` before client serialization. Created `app/admin/sync/page.tsx` (server component, resolves key presence server-side) and `src/components/admin/SyncPageClient.tsx` (client, all 5 action buttons with loading states and result viewer). No schema changes, no new migrations, no existing files modified. `StockQuote.source` and `StockQuote.lastSyncedAt` intentionally not added — noted as a gap for Phase 9D. Build passes, `prisma validate` and `prisma migrate status` both clean. Approved by user.
- Phase 9C completed (2026-05-19): Added safe quote sync metadata, API key validation, and detailed sync reporting. Added `source`, `lastSyncedAt`, `sourceUpdatedAt` fields to `StockQuote` via migration `20260519144031_add_stock_quote_sync_metadata`. Created `src/lib/market-data/safe-update.ts` with `isValidNumber`, `keepExistingIfInvalid` helpers. Updated `src/lib/market-data/types.ts` with `SyncRunStatus`, `SyncSymbolResult`, `SyncActionResult` types replacing the coarse `SyncSummary`. Rewrote `src/actions/market-data-actions.ts` to use safe helpers and return per-symbol success/skipped/failed breakdown; each symbol update is atomic (partial success preserved). Rewrote `src/components/admin/SyncPageClient.tsx` with 4-step workflow layout, button descriptions, DB safety note, empty result placeholder, and clear updated/skipped/failed symbol lists. Added `Admin Sync` nav item to `AppSidebar.tsx` behind `NEXT_PUBLIC_SHOW_ADMIN_TOOLS=true` flag with amber DEV badge and active state. Fixed FMP provider: all `/api/v3/` legacy endpoints return HTTP 403 for non-legacy users (deprecated after August 31, 2025) — replaced with `/stable/profile?symbol=` and `/stable/analyst-estimates?symbol=&period=annual&limit=1`; fixed field mappings (`marketCap` not `mktCap`, `exchange` not `exchangeShortName`). Build passes, `prisma validate` and `prisma migrate status` both clean. QA confirmed: Twelve Data quote sync OK, FMP profile sync OK (all 5 symbols), Finnhub news test OK, partial-success simulation OK, no duplicate rows, no API key exposure, dashboard/scanner/drawer regression clean. Approved by user.
- Phase 9D completed (2026-05-19): Added persistent sync logging for manual market-data sync actions. Added `SyncRun` and `SyncRunItem` Prisma models via migration `20260519191321_add_sync_run_logs`. Created `src/lib/data/admin-sync.ts` with `getRecentSyncRuns(limit = 10)` server loader. Updated `src/actions/market-data-actions.ts` with `persistSyncLog()` helper; both `syncQuotesSampleAction` and `syncProfilesSampleAction` now persist a `SyncRun` + per-symbol `SyncRunItem` rows on every run (including early-failure paths). Updated `src/components/admin/SyncPageClient.tsx`: renamed Step 4 to "Review Results", added Step 5 "Recent Sync Runs" — a table showing the latest 10 runs with green/amber/red status badges, counts, and click-to-expand symbol-level details (symbol, status, reason, dbAction). Updated `app/admin/sync/page.tsx` to load recent sync runs server-side and pass serialised to the client; `router.refresh()` called after each sync to keep the table current. Cascade delete on SyncRunItem. No API keys, URLs, or raw provider payloads stored. Safe update behavior unchanged. Build passes, `prisma validate` and `prisma migrate status` both clean. Full QA passed: schema verified, persist logic audited on all code paths, security confirmed, no regressions. Approved by user.
- Phase 9E completed (2026-05-21): Added universe management and Nasdaq 100 membership sync with Admin visibility and UX improvements. Extended `StockUniverseMember` with active/inactive membership metadata (`isActive`, `lastSeenAt`, `removedAt`, `source`, `statusReasonCode`) via migration `20260521135955_add_universe_membership_status`. Added a manually validated Nasdaq 100 static fallback source in `src/lib/market-data/nasdaq100-fallback-symbols.ts` with 100 unique symbols and explicit metadata (`source = static_fallback`, `compositionAsOf = 2026-01-20`, `lastVerifiedAt = 2026-05-21`); FMP and Finnhub live constituent endpoints were investigated but unavailable on the current plans, so FMP is used only for profile enrichment. Added `fetchFmpNasdaq100Constituents()` flow using the fallback symbols plus FMP profile enrichment, and added `syncNasdaq100UniverseAction()` to create missing stocks, create/reactivate/deactivate Nasdaq 100 memberships, persist `SyncRun`/`SyncRunItem` logs, and never delete stocks or modify watchlist/alerts. Created `src/lib/data/admin-universes.ts` with `getUniverseOverview()` and `getDbStockSummary()` loaders. Updated `/admin/sync` with DB Stock Summary, Universe Overview, static fallback source banner, and a `Sync Nasdaq 100 Universe` action. Manual QA confirmed the sync creates/maintains 100 active Nasdaq 100 members, preserves existing stocks/watchlist/alerts, stores `StockUniverseMember.source = static_fallback`, stores `SyncRun.provider = static_fallback`, and keeps profile enrichment separate from membership source. Added Admin Sync UX polish before commit: reorganized `/admin/sync` into four tabs (`Overview`, `Sync Actions`, `Provider Tests`, `Sync History`), added an in-progress panel for long-running write actions with elapsed timer and indeterminate progress bar, disabled duplicate submissions while sync is running, and kept all existing provider tests, sample syncs, review results, and sync history intact. Build passes, `tsc`, `prisma validate`, and `prisma migrate status` all clean. Approved by user.
- Phase 9F completed (2026-05-22): Added controlled Nasdaq 100 quote snapshot batch sync. Added `open`, `dayHigh`, `dayLow`, `previousClose` to `StockQuote` via migration `20260522062445_add_quote_ohlc_fields`. Added `getNextNasdaq100QuoteBatch(limit=25)` selector in `admin-universes.ts` (missing quotes first, then oldest `lastSyncedAt`, then symbol ASC). Refactored quote sync into shared `syncQuotesForSymbols()` helper reused by both `syncQuotesSampleAction` and new `syncNasdaq100QuoteSnapshotsAction`. New action uses Finnhub as provider (sequential per-symbol calls, safe update behavior, 429 detection), persists `SyncRun` with `type=quotes-nasdaq100-batch` and `provider=finnhub`, and persists `SyncRunItem` per symbol. Added `quoteRefreshCycleSynced` field to `UniverseOverviewRow` using a SyncRun running-total cycle boundary algorithm (scans batch runs oldest→newest, accumulates successCount, resets when total reaches activeCount — correctly tracks 25→50→75→100 progression). Admin Sync Actions tab shows new button with inline in-progress panel (appears directly below button, no scrolling needed). Overview tab shows two-part Nasdaq 100 coverage: Part A (quote coverage count, always visible), Part B (current refresh cycle progress, visible only when missing=0). Fixed Finnhub Unix timestamp conversion (`raw.t * 1000`). Build passes, `tsc`, `prisma validate`, and `prisma migrate status` all clean. Approved by user.
- Phase 9G completed (2026-05-22): Added Data Inventory tab to `/admin/sync`. Created `src/lib/data/admin-stock-data.ts` with `getAdminStockDataInventory()` — queries all stocks with `quote`, `score`, `universeMemberships` (including `universe.slug`), `watchlistItems`, and `alertRules` in a single Prisma query; derives `scannerEligible`, `missingReason`, `volumeSourceLabel`, and `quoteSourceLabel` server-side; formats all values as strings. Created `src/components/admin/DataInventoryTab.tsx` as a client component with: 6 summary cards (Total Stocks, With Quote, Missing Quote, With Score, Scanner Eligible, Nasdaq 100 Active); symbol/company text search; filter pills (All / Scanner Eligible / Missing Score / Missing Quote / Nasdaq 100); 24-column table with a two-row header (parameter name + source label). Columns cover Identity (Symbol, Company Name, Sector, Market Cap), Universe (Nasdaq 100, Univ. Source, Mbr Active, Mbr Last Seen), Quote (Has Quote, Price, Change %, Open, Day High, Day Low, Prev Close, Volume, Quote Source, Last Synced, Src Updated), and Internal (Has Score, Scanner Eligible, Missing Reason, In Watchlist, Active Alert). Volume is labeled `N/A` when null and `Mixed` when the quote source is Finnhub but a prior value exists — Finnhub is never incorrectly credited as the volume source. Tab order: Overview → Data Inventory → Sync Actions → Provider Tests → Sync History. No new Prisma models, no migrations. Build passes, `tsc`, `prisma validate`, and `prisma migrate status` all clean. Approved by user.
- Phase 9H-A completed (2026-05-22): Finnhub Basic Financials Research. Inspected `src/lib/market-data/providers/finnhub.ts`. Created and deleted a temporary script `tmp_research_finnhub.mjs`. No production code was changed. Tested endpoints `/stock/metric`, `/stock/price-target`, `/stock/recommendation`, `/calendar/earnings`, `/stock/profile2` on symbols AAPL, MSFT, NVDA, AMD, TSLA. Full findings below. No DB schema changes, no sync actions, no Scanner changes, no commits.
- Phase 9H-B completed (2026-05-23): Nasdaq 100 Quote + Basic Financials Sync. Added `StockMetric` Prisma model (28 Decimal? fields: growth, profitability, financial strength, valuation, market/risk context; `stockId @unique`; `provider`, `rawMetricCount`, `lastSyncedAt`, `createdAt`, `updatedAt`) via migration `20260522154752_add_stock_metrics`. Added `fetchFinnhubBasicFinancials(symbol)` to `src/lib/market-data/providers/finnhub.ts` mapping 28 Finnhub metric fields with bracket notation for `totalDebt/totalEquityAnnual`, `52WeekHigh`, `52WeekLow`; Finnhub `marketCapitalization` (millions) multiplied by 1,000,000 before storing; percentage fields stored as-is (47.86 = 47.86%). Added `getNextNasdaq100MarketDataBatch(limit=25)` selector in `src/lib/data/admin-universes.ts` (priority: missing metrics → missing quotes → oldest metric sync → oldest quote sync → symbol ASC). Added `syncNasdaq100MarketDataAction()` to `src/actions/market-data-actions.ts` (type=`market-data-nasdaq100-batch`, provider=`finnhub`; 2 Finnhub calls per symbol — quote + metric; 500ms delay between symbols; stops on 429 rate-limit with partial-success persistence; safe-update pattern: create uses `safeNum() ?? undefined`, update uses `safeNum() ?? existingMetric?.field ?? null`; non-null assertion on required `price` field confirmed valid by preceding `isValidNumber` guard; persists `SyncRun` + `SyncRunItem` per symbol with per-field outcome messages). Extended `AdminStockDataInventoryRow` type and `getAdminStockDataInventory()` in `src/lib/data/admin-stock-data.ts` with 30+ metric fields (metric relation included in Prisma query; percentage fields suffixed with `%`; market cap formatted as `$X.XXB`). Updated `src/components/admin/DataInventoryTab.tsx`: added 20+ metric columns across Growth, Profitability, Financial Strength, and Valuation/Market sections with `Finnhub` source labels; added `Missing Metrics` filter pill; expanded summary cards from 6 to 8 (added With Metrics, Missing Metrics). Updated `src/components/admin/SyncPageClient.tsx`: added `Nasdaq 100 Market Data Sync` section in Sync Actions tab with metrics coverage panel; UX cleanup — removed old quote-only Nasdaq batch button from Sync Actions, removed Sample Sync from Sync Actions, added `Sample DB Writes` section to Provider Tests tab with inline progress panel. `syncNasdaq100QuoteSnapshotsAction` retained in `market-data-actions.ts` (internal use, not exposed in UI). Build passes, `tsc --noEmit` zero errors, `prisma validate` valid, `prisma migrate status` clean. Approved by user.
- Phase 9I completed (2026-05-23): Fundamental Score Foundation + Score Methodology Tab. Added 8 nullable fields to `StockScore` via migration `20260523153618_add_fundamental_score_fields` (`fundamentalScore`, `growthScore`, `profitabilityScore`, `valuationScore`, `financialHealthScore`, `riskContextScore`, `scoreVersion`, `lastCalculatedAt`). Created `src/lib/scoring/fundamental-score.ts` — deterministic scoring engine with 16 metric helper functions, `categoryAverage()` excluding nulls, weight re-normalization for missing categories, ROE cap at 60% and Interest Coverage cap at 30x (scoring only, raw values untouched), version constant `SCORE_VERSION = "fundamental-v1"`. Added `calculateFundamentalScoresAction()` to `src/actions/market-data-actions.ts` — no external API calls, skips stocks without `StockMetric`, upserts `StockScore` preserving existing `hotScore`/`opportunityScore`, persists `SyncRun` (`type=fundamental-score-calculation`, `provider=internal`) + `SyncRunItem` per symbol. Created `src/components/admin/ScoreMethodologyTab.tsx` — 6 sections: overview, category weights, 21-metric scoring rules table, caps/limitations, example calculation (score=72), future improvements. Updated `src/lib/data/admin-stock-data.ts` and `DataInventoryTab.tsx` to include 8 score columns with `Internal` source labels. Updated `SyncPageClient.tsx` to add Score Calculation section (Sync Actions tab) and Score Methodology tab (tab 6). Bug found and fixed during QA: Turbopack dev server had stale Prisma client cache from before `prisma generate` — fixed by clearing `.next/` and re-running `prisma generate`. Result: 100 stocks scored, 0 failed, 101 scanner-eligible, no duplicates, all scores in [0,100]. Build passes, `tsc --noEmit` zero errors, `prisma validate` valid, `prisma migrate status` clean. Approved by user.