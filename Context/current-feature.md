# Phase 20 — Opportunity Score v2 with Analyst Targets

## Status

Completed

---

## Goal

Upgrade the existing Opportunity Score from `opportunity-v1` to `opportunity-v2` by adding analyst target and analyst sentiment signals.

The current Opportunity Score does **not** include:

```txt
Analyst target price
Analyst upside %
Target high / low / median
Analyst recommendation counts
Analyst count / confidence
```

After Phase 17 and Phase 19, the app now has reliable coverage for the missing inputs:

```txt
Analyst target coverage: 100 / 100
Analyst upside coverage: 100 / 100
Target high / low / median coverage: 100 / 100
Analyst rating/count coverage: 100 / 100
Quote coverage: 100 / 100
52-week context coverage: 100 / 100
```

Phase 20 should use this new data to make Opportunity Score more meaningful.

---

## Important User Requirements

This phase must update more than the calculation code.

Required updates:

```txt
1. Update the Opportunity Score calculation logic.
2. Update the Admin Sync Actions button description for Calculate Opportunity Scores.
3. Update the Score Methodology tab with the new v2 calculation explanation.
4. Update any UI text that still describes Opportunity Score v1.
5. Keep the implementation clean and avoid duplicate score fields/tables.
```

The user specifically requested:

```txt
Do not only change the calculation.
Also update:
- Admin → Sync Actions → Calculate Opportunity Scores description
- Admin → Score Methodology tab
```

---

## Why This Phase Is Needed

The original Opportunity Score was intentionally conservative because analyst target coverage was poor.

Earlier phases had:

```txt
Target price coverage: partial / unreliable
Analyst upside: N/A for many stocks
```

Therefore Opportunity Score v1 did not include analyst target signals.

Now the data is available and reliable after:

```txt
Phase 17 — FMP price-target-consensus migration
Phase 18 — FMP fundamentals/ratios/growth migration
Phase 19 — FMP daily quote migration
```

Opportunity Score should now reflect:

```txt
Is this a fundamentally strong company?
Is valuation reasonable?
Is growth attractive?
Is risk acceptable?
Is the stock trading in an attractive price range?
Do analysts see meaningful upside?
Is analyst sentiment supportive?
```

---

## Critical Product Decision

Do not create a separate new score table.

Do not create duplicate score fields unless absolutely required.

Use existing fields:

```txt
StockScore.oppScore
StockScore.oppScoreVersion
StockScore.oppCalculatedAt
```

Update:

```txt
oppScoreVersion = "opportunity-v2"
```

Keep previous v1 logic only as internal reference/fallback if useful.

---

## Scope

Phase 20 includes:

1. Audit existing Opportunity Score v1 logic.
2. Define Opportunity Score v2 formula.
3. Add analyst target/upside component.
4. Add analyst sentiment component from recommendation counts.
5. Use existing valuation/growth/fundamental/risk/price position inputs.
6. Preserve missing-data re-normalization.
7. Update Calculate Opportunity Scores action.
8. Update Admin Sync Actions button text.
9. Update Score Methodology tab.
10. Update Data Inventory if needed.
11. Update Scanner/Dashboard only if labels/version display needs refresh.
12. Run score calculation and verify outputs.

---

## Non-Scope

Do not build:

- Analyst Sentiment Score as a separate score.
- Momentum Score.
- Catalyst Score.
- News sync.
- Historical candle indicators.
- Technical score.
- Intraday sync.
- New database score table.
- New provider calls.
- New live API calls from Scanner/Dashboard.
- New scoring formulas for Fundamental Score.

Do not change:

```txt
Fundamental Score formula
Growth Score formula
Profitability Score formula
Valuation Score formula
Financial Health Score formula
Risk Context Score formula
Daily Market Data Sync
Company Data Sync
Universe Sync
```

---

## Existing Opportunity Score v1

Current v1 is based on:

```txt
Fundamental Quality
Valuation
Growth
Risk / Context
Price Position
```

It does not use:

```txt
Analyst Target
Analyst Upside
Analyst Rating
Analyst Count
Recommendation Counts
```

---

# 1. Required Audit Before Implementation

Inspect:

```txt
src/lib/scoring/opportunity-score.ts
src/actions/market-data-actions.ts
src/components/admin/ScoreMethodologyTab.tsx
src/components/admin/SyncPageClient.tsx
src/components/admin/DataInventoryTab.tsx
src/lib/data/scanner.ts
src/lib/data/dashboard.ts
prisma/schema.prisma
```

Document:

```txt
Current Opportunity Score v1 weights
Current inputs used
Current missing-data behavior
Current scoreVersion value
Where Calculate Opportunity Scores button text appears
Where Score Methodology describes Opportunity Score
Where oppScore is displayed
```

Do not start implementation before confirming all existing touchpoints.

---

# 2. Data Inputs Available For v2

## Existing Score Inputs

From `StockScore`:

```txt
fundamentalScore
growthScore
profitabilityScore
valuationScore
financialHealthScore
riskContextScore
```

From `StockMetric`:

```txt
peBasicExclExtraTTM
psTTM
pbAnnual
evEbitdaTTM
pegTTM
revenueGrowthTTMYoy
epsGrowthTTMYoy
beta
marketCapitalization
```

From `StockQuote`:

```txt
price
week52High
week52Low
priceAvg50
priceAvg200
```

From `StockAnalystData`:

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
```

---

# 3. Opportunity Score v2 Formula

Recommended v2 components:

| Component | Weight |
| --- | ---: |
| Fundamental Quality | 25% |
| Valuation | 20% |
| Growth | 15% |
| Analyst Upside | 20% |
| Analyst Sentiment / Confidence | 10% |
| Price Position | 5% |
| Risk / Context | 5% |

Total:

```txt
100%
```

---

## Why These Weights

### Fundamental Quality — 25%

The company still needs to be fundamentally strong.

Uses:

```txt
fundamentalScore
```

### Valuation — 20%

Opportunity should prefer stocks that are not extremely expensive.

Uses:

```txt
valuationScore
```

### Growth — 15%

Growth remains important, especially for tech/growth companies.

Uses:

```txt
growthScore
```

### Analyst Upside — 20%

Now that target coverage is 100/100, analyst upside can become a major opportunity signal.

Uses:

```txt
analystUpsidePercent
targetPrice
current price
```

### Analyst Sentiment / Confidence — 10%

Recommendation counts can help validate or challenge the upside signal.

Uses:

```txt
strongBuyCount
buyCount
holdCount
sellCount
strongSellCount
analystCount
analystRating
```

### Price Position — 5%

Helps avoid giving the highest opportunity scores only to stocks already near their 52-week high.

Uses:

```txt
price
week52High
week52Low
```

### Risk / Context — 5%

Keeps high-beta/speculative stocks from being over-rewarded.

Uses:

```txt
riskContextScore
```

---

# 4. Analyst Upside Scoring

Input:

```txt
analystUpsidePercent
```

Recommended scoring scale:

| Analyst Upside | Score |
| --- | ---: |
| >= 60% | 100 |
| 40% to <60% | 90 |
| 30% to <40% | 82 |
| 20% to <30% | 72 |
| 10% to <20% | 60 |
| 0% to <10% | 45 |
| -10% to <0% | 30 |
| < -10% | 15 |
| missing | null |

Important:

```txt
Missing should be null, not 0.
```

Even though current coverage is 100/100, keep missing-data handling for future universes.

---

# 5. Analyst Sentiment / Confidence Scoring

Use recommendation counts.

Recommended weighted recommendation score:

```txt
Strong Buy = 100
Buy = 80
Hold = 50
Sell = 20
Strong Sell = 0
```

Formula:

```txt
rawSentiment =
(
  strongBuy * 100 +
  buy * 80 +
  hold * 50 +
  sell * 20 +
  strongSell * 0
) / totalRecommendations
```

Where:

```txt
totalRecommendations = strongBuy + buy + hold + sell + strongSell
```

If totalRecommendations is missing or zero:

```txt
sentimentScore = null
```

---

## Analyst Count Confidence Adjustment

Recommendation from 3 analysts should not carry the same weight as recommendation from 50 analysts.

Use a confidence multiplier:

| Analyst Count | Confidence |
| --- | ---: |
| >= 30 | 1.00 |
| 20–29 | 0.95 |
| 10–19 | 0.90 |
| 5–9 | 0.80 |
| 1–4 | 0.65 |
| 0 / missing | null |

Final sentiment component:

```txt
analystSentimentScore = 50 + ((rawSentiment - 50) * confidence)
```

Reason:

```txt
Low analyst count should pull the score toward neutral, not directly crush it.
```

Example:

```txt
rawSentiment = 90
analystCount = 4
confidence = 0.65

score = 50 + ((90 - 50) * 0.65)
score = 76
```

---

# 6. Price Position Scoring

Use 52-week range.

Formula:

```txt
position = (price - week52Low) / (week52High - week52Low)
```

Recommended scale:

| Position in 52W Range | Score |
| --- | ---: |
| 0.20 to 0.60 | 100 |
| 0.60 to 0.75 | 80 |
| 0.75 to 0.90 | 60 |
| 0.90 to 1.00 | 40 |
| > 1.00 | 30 |
| 0.00 to 0.20 | 65 |
| < 0.00 | 50 |
| missing / invalid range | null |

Interpretation:

```txt
Middle-lower part of 52W range is often a better opportunity zone.
Very high near 52W high is less attractive.
Very low near 52W low may signal risk, so do not score it as 100 automatically.
```

---

# 7. Missing Data Re-normalization

Keep existing v1 behavior:

```txt
Do not treat missing components as zero.
Remove missing components from denominator.
Re-normalize weights among available components.
```

Example:

If a stock is missing analyst sentiment but has everything else:

```txt
Exclude analyst sentiment 10%.
Re-normalize the remaining 90% to 100%.
```

Minimum required component:

```txt
fundamentalScore must exist.
```

If `fundamentalScore` is missing:

```txt
oppScore = null
skip / not calculated
```

---

# 8. Caps and Guardrails

## Analyst Upside Cap

Analyst targets can be overly optimistic.

Cap input for scoring:

```txt
analystUpsidePercent scoring max = 60%
```

Do not alter raw stored value.

## Extreme Valuation Guardrail

Do not create hard exclusions in this phase.

Let valuationScore handle expensive stocks.

## Negative Earnings

If valuation metrics like P/E are null:

```txt
valuationScore already handles missing/available fields.
Do not add separate penalty in Opportunity v2 unless already existing.
```

## High Risk

Risk component weight remains low at 5%.

Do not over-penalize high beta if analysts and fundamentals are strong.

---

# 9. Score Versioning

Update:

```txt
oppScoreVersion = "opportunity-v2"
```

Keep:

```txt
oppCalculatedAt = now
```

Do not add new DB fields unless absolutely required.

No migration is expected.

---

# 10. Admin Sync Actions Text Update

Update the Calculate Opportunity Scores button/section description.

Current text likely describes v1.

New suggested description:

```txt
Calculates Opportunity Score v2 using fundamental quality, valuation, growth, analyst upside, analyst sentiment, price position, and risk context. Uses only DB data; no external API calls.
```

Additional helper text:

```txt
Run after Company Data Sync and Daily Market Data Sync so analyst targets, quotes, and financial metrics are fresh.
```

Important:

```txt
Do not say it calls FMP/Finnhub directly.
Score calculation is internal and DB-only.
```

---

# 11. Score Methodology Tab Update

Update the Score Methodology tab.

Required section:

```txt
Opportunity Score v2
```

Must include:

1. Purpose.
2. Component weights.
3. Analyst Upside scoring scale.
4. Analyst Sentiment formula.
5. Analyst Count confidence adjustment.
6. Price Position formula.
7. Missing-data re-normalization.
8. Example calculation.
9. Note that raw analyst target values are not modified.
10. Note that no external APIs are called during scoring.

Suggested text:

```txt
Opportunity Score v2 estimates how attractive a stock looks right now by combining internal quality scores with analyst target upside and market context.
```

Component table:

| Component | Weight | Source |
| --- | ---: | --- |
| Fundamental Quality | 25% | StockScore.fundamentalScore |
| Valuation | 20% | StockScore.valuationScore |
| Growth | 15% | StockScore.growthScore |
| Analyst Upside | 20% | StockAnalystData.analystUpsidePercent |
| Analyst Sentiment | 10% | Finnhub recommendation counts stored in DB |
| Price Position | 5% | StockQuote 52-week range |
| Risk / Context | 5% | StockScore.riskContextScore |

---

# 12. Data Inventory Updates

Check whether Data Inventory already shows:

```txt
Opp. Score
Opp. Version
Opp. Calc At
Analyst Upside
Analyst Rating
Analyst Count
```

Required:

```txt
Opp. Version should show opportunity-v2 after recalculation.
```

Optional:

```txt
Show Analyst Upside near Opportunity Score if already easy.
```

Do not overload Data Inventory.

---

# 13. Scanner Updates

Scanner already shows:

```txt
Opp.
Fund.
Target
Upside
Rating
```

Required:

```txt
Opportunity Score values should update after calculation.
Sorting by Opportunity Score should still work.
High Opportunity pill should still work.
Expanded row should show Opportunity Score explanation if it already exists.
```

Optional text update:

```txt
Opportunity Score v2 now includes analyst upside and sentiment.
```

Do not redesign Scanner.

---

# 14. Dashboard Updates

Dashboard already has opportunity cards.

Required:

```txt
Avg Opportunity should reflect v2 after recalculation.
High Opportunity count should update.
Top opportunity/analyst upside sections should still work.
```

Optional:

```txt
Update label/tooltips to mention v2 if present.
```

Do not redesign Dashboard.

---

# 15. QA Requirements

## Before Calculation

Record baseline:

```txt
Average oppScore
Top 10 oppScore stocks
oppScoreVersion distribution
Number with opportunity-v1
Number with opportunity-v2
```

---

## Run Calculation

Open:

```txt
/admin/sync → Sync Actions
```

Run:

```txt
Calculate Opportunity Scores
```

Confirm:

```txt
No external API calls.
Status success or partial_success only if expected.
100 active Nasdaq 100 calculated.
0 failed.
oppScoreVersion = opportunity-v2.
```

---

## Score Result Coverage

Report:

```txt
Total active Nasdaq 100 stocks
With oppScore
With oppScoreVersion = opportunity-v2
With analystUpsidePercent
With analyst sentiment inputs
Failed/skipped
```

Expected:

```txt
100 / 100 active Nasdaq 100 should have opportunity-v2.
```

---

## Score Spot Check

Return table for:

```txt
AAPL
MSFT
NVDA
META
TSLA
AMZN
PLTR
AVGO
AMD
GOOGL
```

Columns:

```txt
Symbol
Old Opp Score
New Opp Score
Fundamental
Valuation
Growth
Analyst Upside
Analyst Sentiment
Price Position
Risk
Final Opp v2
Reason / explanation
```

Validate:

```txt
High upside + good fundamentals should improve.
Very expensive stocks should still be constrained by valuation.
Negative analyst upside should reduce opportunity.
High beta should slightly reduce opportunity.
```

---

## Plausibility Checks

Look for:

```txt
Stocks with very high analyst upside but weak fundamentals.
Stocks with strong fundamentals but low/negative upside.
Stocks near 52-week highs.
Stocks with very high valuation.
Stocks with low analyst count.
```

Confirm the score behaves reasonably.

---

## Admin UI QA

Confirm:

```txt
Calculate Opportunity Scores button text updated.
Helper text mentions v2 inputs.
No misleading v1 text remains.
Score Methodology tab documents v2.
```

---

## Data Inventory QA

Confirm:

```txt
Opp. Score updated.
Opp. Version = opportunity-v2.
Opp. Calc At updated.
Analyst Upside remains visible.
No fake zero values.
```

---

## Scanner QA

Confirm:

```txt
Scanner loads.
Opportunity column updated.
Sort by Opportunity Score works.
High Opportunity pill works.
Target/Upside/Rating still visible.
No provider calls from Scanner.
```

---

## Dashboard QA

Confirm:

```txt
Dashboard loads.
Avg Opportunity updated.
High Opportunity count updated.
Top rows look plausible.
No provider calls from Dashboard.
```

---

## Regression

Confirm:

```txt
Universe Sync loads.
Company Data Sync loads.
Daily Market Data Sync loads.
Score Calculation works.
Provider Tests load.
Sync History works.
Data Inventory loads.
Score Methodology loads.
Scanner loads.
Dashboard loads.
No provider calls from score calculation.
```

---

# 16. Validation

Run:

```txt
npm run build
npx tsc --noEmit
npx prisma validate
npx prisma migrate status
```

No migration is expected.

If a migration is needed, stop and explain why before adding it.

---

# 17. Required Implementation Report

Return a concise report in English only with:

1. Files inspected.
2. Current v1 formula summary.
3. New v2 formula and weights.
4. Analyst Upside scoring scale.
5. Analyst Sentiment formula.
6. Price Position formula.
7. Files changed.
8. Whether migration was needed.
9. Admin Sync button text update.
10. Score Methodology update.
11. Data Inventory update if any.
12. Scanner/Dashboard update if any.
13. Baseline oppScore vs new oppScore summary.
14. Score spot-check table.
15. Plausibility analysis.
16. Regression QA results.
17. Automated check results.
18. Known issues.
19. Ready for commit or not.

---

## Required Formula Table In Report

Include:

| Component | Weight | Source | Missing Handling |
| --- | ---: | --- | --- |
| Fundamental Quality | 25% | StockScore.fundamentalScore | required |
| Valuation | 20% | StockScore.valuationScore | re-normalize |
| Growth | 15% | StockScore.growthScore | re-normalize |
| Analyst Upside | 20% | StockAnalystData.analystUpsidePercent | re-normalize |
| Analyst Sentiment | 10% | recommendation counts | re-normalize |
| Price Position | 5% | StockQuote 52W range | re-normalize |
| Risk / Context | 5% | StockScore.riskContextScore | re-normalize |

---

## Acceptance Criteria

Phase 20 is complete when:

- Opportunity Score uses v2 formula.
- Analyst Upside is included.
- Analyst Sentiment is included.
- Price Position still included.
- Missing data is re-normalized, not treated as zero.
- oppScoreVersion is `opportunity-v2`.
- Calculate Opportunity Scores button text is updated.
- Score Methodology tab fully documents v2.
- Data Inventory shows opportunity-v2 after recalculation.
- Scanner and Dashboard reflect updated scores.
- No new DB table is created.
- No unnecessary migration is added.
- Fundamental Score formula is unchanged.
- No provider calls are added to scoring.
- Build passes.
- TypeScript passes.
- Prisma validates.
- Migration status is clean.

---

## Future Phases

After Phase 20:

```txt
Phase 21 — Historical Daily + Momentum Foundation
Phase 22 — Analyst Sentiment Score
Phase 23 — News and Earnings Catalyst Foundation
```

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
- Phase 9J completed (2026-05-24): Resumable Chunked Market Data Sync. Replaced the old long-running Nasdaq 100 full sync (single server action, ~385s) with a scalable chunk-based architecture. Added `processedCount` and `currentSymbol` to `SyncRun` via migration `20260524061553_add_sync_run_progress_fields`. Created three new API routes: `POST /api/admin/sync-runs/start` (creates or restarts SyncRun), `POST /api/admin/sync-runs/process-next` (processes one chunk of 10 stocks), `GET /api/admin/sync-runs/latest` (polling endpoint, updated type). Removed old `syncNasdaq100MarketDataAction` batch server action and all old Next 25 buttons from the UI. Chunk size: 10 stocks per chunk (20 Finnhub calls). Rate-limit strategy: call-start pacing — ≥1100ms between Finnhub call starts (~54 calls/minute). Resume logic: `SyncRunItem` rows for the active `syncRunId` are the source of truth; unprocessed = all active symbols minus already-itemised symbols. Restart creates a new `SyncRun`; previous run remains in history. Auto-continue loop: UI calls `process-next` sequentially while `status === "running"` and `!done`; 2-second polling via `/latest` runs in parallel. ETA: `avgMsPerStock = elapsedMs / processedCount`; shows "Estimating…" until processedCount ≥ 2. Paused state UX: dedicated `PausedSyncPanel` shows paused-at timestamp (`finishedAt`), reason (`message` or fallback), last symbol, processed/total counts, amber progress bar, and guidance text. Rate limit message: "Finnhub rate limit reached. Continue the sync after waiting." Restart message: "Restarted by user before completion." No duplicate `StockQuote`, `StockMetric`, or `SyncRunItem` rows. Score calculation remains a separate explicit step. Scanner unchanged. Build passes, `tsc --noEmit` zero errors, `prisma validate` valid, `prisma generate` run to refresh client types. Approved by user.
- Phase 10 completed (2026-05-24): Scanner Real Data Integration. Moved `/scanner` from 5 demo/seed stocks to 100 real Nasdaq 100 stocks from the DB. Changed default universe from `russell-1000` to `nasdaq-100`; added `isActive: true` membership filter and `metric: true` include to the Prisma query. Added 4 formatter helpers to `src/lib/formatters.ts` (`formatScore`, `formatMetricPercent`, `formatRatio`, `formatCompactCurrency`). Extended `HotStock` type in `mock-data.ts` with 13 new optional fields for fundamental scores and key metrics. Rewrote `ScannerTable.tsx` with 18 real columns (Symbol, Sector, Price, Day%, Fund., Growth, Profit., Valuat., Health, Risk, P/E, PEG, Rev Gr., EPS Gr., ROE, D/E, Mkt Cap). Replaced sort options with 8 fundamental-focused keys; default sort is Fundamental Score descending. Removed Risk and Setup filters (not backed by real data). Reduced view pills to 3 active (All Stocks, In Watchlist, Alert Active); 5 unsupported pills (Hot Today, Strong Momentum, Best Opportunities, Unusual Volume, FOMO Risk) shown as disabled with "Coming soon" tooltips. Updated `MobileScannerCard.tsx` to show fundamental/growth/profitability/health scores and key metrics. Updated `ScannerHeader.tsx` subtitle. Dashboard audited — still uses `hotScore`/`opportunityScore` (= 0 for real stocks); deferred to Phase 11. No Prisma migration needed. No external provider calls added. Browser QA confirmed: 100 stocks loading (META top at Fund=89), all new columns visible with real values, N/A for missing metrics, disabled pills visible, dashboard unbroken. Build passes, `tsc --noEmit` zero errors, `prisma validate` valid, `prisma migrate status` clean. Known issue: universe selector strip shows "Russell 1000" button (only BASE_UNIVERSE type) with no active highlight since selected data is Nasdaq 100 (INDEX type) — UX improvement deferred to Phase 11. Approved by user.
- Phase 11 completed (2026-05-24): Scanner UX & Universe Selector Improvements. Fixed universe selector — Nasdaq 100 shown as active, Russell 1000 and S&P 500 shown as disabled "Coming soon" (backed by DB `hasData` count). Extended `HotStock` type with 20 new optional fields (detail metrics, score metadata, data freshness). Updated `getScannerData()` to map all new fields and compute `hasData` per universe via grouped Prisma query. Rewrote `ScannerTable` with score column tooltips (Info icon + title text), removed D/E and EPS Growth from main table, added expandable row chevron — clicking expands `ScannerExpandedRow` inline without opening the drawer. Created `ScannerExpandedRow` component with 6 grouped sections: Score Breakdown (progress bars + version + last calculated), Growth, Profitability, Valuation, Financial Health, and Data Freshness. Updated `ScannerViewPills` with 4 new active pills: High Fundamentals (≥75), High Growth (≥75), High Profitability (≥75), Reasonable Valuation (≥60). Updated `ScannerFilters` with 5 score threshold dropdowns (Any/50+/60+/70+/80+/90+) and Positive Day% toggle; exported `DEFAULT_FILTERS`. Updated `ScannerControls` with 5 new sort options (Risk Score, P/E, PEG, ROE, Revenue Growth — 13 total). Updated `ScannerPageClient` with new view/threshold filter logic, fixed universe selector rendering, improved empty states (no-match vs no-data). Dashboard deferred to Phase 12. No external provider calls, no schema changes, no Prisma migration. Build passes, TypeScript clean. Approved by user.
- Phase 12 completed (2026-05-24): Dashboard Real Data Cleanup. Fully replaced the legacy/demo dashboard with a real-data overview screen. Rewrote `src/lib/data/dashboard.ts` — removed all seeded-data queries (MarketStat, DashboardSummaryCard, DiscoverSetup, AiInsight, RecentAlert, hotScore-based ordering) and replaced with real Prisma queries across Stock, StockQuote, StockMetric, StockScore, StockUniverseMember, and SyncRun. New `DashboardData` type exports: `DashboardSummary`, `DashboardFreshness`, `DashboardStockRow`, `DashboardSectorRow`, `DashboardWarning`, `DashboardWatchlistItem`. Created 5 new components: `DashboardSummaryCards.tsx` (8 real cards: Total Stocks, Scanner Ready, With Metrics, With Scores, Avg Fundamental, Stocks Above 75, Last Market Sync, Last Score Calc), `TopFundamentalStocksTable.tsx` (top 15 by fundamentalScore desc, with score bars and sub-scores), `SectorSummaryTable.tsx` (avg fundamental/growth/profitability per sector, top stock per sector), `DataCoverageSection.tsx` (progress bars for quotes/metrics/scores/scanner-ready with capped 100% display and "+N rows outside universe" note), `DataWarningsSection.tsx` (amber warnings for missing sync, missing metrics, missing scores, stale scores). Updated `DashboardHeader.tsx` (new subtitle), `DashboardGrid.tsx` (removed legacy widgets, wired new components), `WatchlistWidget.tsx` (shows fundamentalScore instead of hot/opp, uses `DashboardWatchlistItem` type), `app/page.tsx` (removed TodaysSignalCard, MarketStatsGrid, old SummaryCardsGrid; added new components). No Prisma migration added. No external provider calls. No scoring formula changes. Browser QA confirmed: 100 stocks, META top at Fund=89, all legacy fields absent, data warnings functional, coverage bars capped at 100%, sector summary present, watchlist shows Fund scores, Scanner and Admin Sync unbroken. Build passes, `tsc --noEmit` zero errors, `prisma validate` valid, `prisma migrate status` clean. Approved by user.
- Phase 13 completed (2026-05-24): Opportunity Score v1. Added `oppScore Decimal?`, `oppScoreVersion String?`, `oppCalculatedAt DateTime?` to `StockScore` via migration `20260524135513_add_opportunity_score_fields`. Created `src/lib/scoring/opportunity-score.ts` — deterministic scoring engine with weighted average (fundamentalScore 35%, valuationScore 30%, growthScore 20%, riskContextScore 10%, pricePosition 5%), null-exclusion with weight re-normalization for missing components, price position scoring from 52W high/low (`(price - week52Low) / (week52High - week52Low)` → scored 30–100), version constant `OPPORTUNITY_SCORE_VERSION = "opportunity-v1"`. Added `calculateOpportunityScoresAction()` to `src/actions/market-data-actions.ts` — no external calls, skips stocks without fundamentalScore, upserts `StockScore.oppScore`, persists `SyncRun` (`type=opportunity-score-calculation`, `provider=internal`) + `SyncRunItem` per symbol. Fixed Turbopack stale cache bug (same as Phase 9I): cleared `.next/` and re-ran `prisma generate` before QA. Admin Sync Actions tab: added "Calculate Opportunity Scores" button with helper text and Internal badge. Score Methodology tab: added Opportunity Score v1 section with weights, price position table, missing data rules, version. Data Inventory: added Opp. Score, Opp. Version, Opp. Calc At columns. Scanner: added Opp. column (between Day% and Fund.), sort by Opportunity Score, "High Opportunity" pill (≥75), "Min Opp." threshold filter, expanded row shows Opportunity Score section with formula explanation. Dashboard: added "Avg Opportunity" and "High Opportunity" summary cards; added Opp. column to Top Fundamental Stocks table. No external provider calls added. Build passes, `tsc --noEmit` zero errors, `prisma validate` valid, `prisma migrate status` clean. Approved by user.
- Phase 14 completed (2026-05-26): Analyst Data & Upside Integration. Added `StockAnalystData` Prisma model (targetPrice, analystUpsidePercent, analystRating, analystCount, targetHigh, targetLow, targetMedian, targetMean, strongBuy/buy/hold/sell/strongSell counts, source, lastSyncedAt, sourceUpdatedAt) via migration `20260525182611_add_stock_analyst_data`. Provider strategy: FMP `/stable/price-target-summary` for price targets (returns array — parsed correctly), Finnhub `/stock/recommendation` for analyst counts and derived rating; source stored as `fmp+finnhub`. Added `MarketDataProvider` union type extended to include `"fmp+finnhub"`. Created three chunked sync API routes: `POST /api/admin/analyst-sync/start` (start/restart), `POST /api/admin/analyst-sync/process-next` (chunk of 10, 1200ms pacing), `GET /api/admin/analyst-sync/latest` (polling). Sync result: 100/100 Nasdaq 100 stocks succeeded; 16 have FMP target price data (FMP free plan coverage limitation — 84 return empty array, stored as null); all 100 have Finnhub recommendation rating and count. Upside calculated internally from stored quote: `((targetMean - price) / price) × 100`. Admin Sync Actions tab: added Analyst Data Sync section with Start/Continue/Restart chunked UX. Sync History: records `analyst-data-nasdaq100-sync` with `provider=fmp+finnhub`. Data Inventory: added 9 analyst columns (Has Analyst, Target Price, Upside %, Rating, Count, Target High, Target Low, Source, Last Synced) with 2 new summary cards. Scanner: added Target, Upside, Rating columns; sort by Analyst Upside and Target Price; Min Analyst Upside filter; High Analyst Upside pill (≥20%); Analyst Data section in expanded row. Fixed ScannerTable React key prop warning (fragment changed from `<>` to `<React.Fragment key={...}>`). Dashboard: added 2 analyst summary cards (With Analyst Data, Avg Analyst Upside); added Top Analyst Upside table (top 10 by upside%). Score Methodology tab: added Analyst Data section noting data is collected but not yet scored. Dashboard freshness bug fixed: `lastScoreCalc` query was requiring `status="success"` but Fundamental Score action always writes `status="partial_success"` (skipped stocks without metrics); fixed to `status: { in: ["success","partial_success"] }, successCount: { gt: 0 }`; improved warning messages. Opportunity Score v1 formula unchanged. No provider calls from Scanner or Dashboard. Build passes, `tsc --noEmit` zero errors, `prisma validate` valid, `prisma migrate status` clean. Known issue: FMP free plan covers only 16 of 100 Nasdaq 100 symbols for price-target-summary; remaining 84 show N/A for target price and upside. Approved by user.
- Phase 15 completed (2026-06-01): Quota-Safe Analyst Target Discovery Sync. Added `targetStatus`, `targetLastAttemptedAt`, `targetLastFoundAt`, `targetNextRetryAt`, `targetAttemptCount`, `targetLastMessage` fields to `StockAnalystData` via migration `20260528133632_add_target_discovery_fields`. Created three API routes (`POST /api/admin/analyst-target-discovery/start`, `POST /api/admin/analyst-target-discovery/process-next`, `GET /api/admin/analyst-target-discovery/latest`) and `src/lib/data/admin-analyst-target.ts` with eligible symbol selector and cooldown constants. Run limits: MAX_ATTEMPTS_PER_RUN=40, MAX_TARGETS_FOUND_PER_RUN=16, CHUNK_SIZE=10. Eligible symbol priority: not_checked → provider_error (1d retry) → stale has_target (14d) → no_target_available (30d) → plan_limited (90d). FMP HTTP 402 classified as `plan_limited` (not `provider_error`) with 90-day retry, counted as skipped not failed, existing target data preserved. FMP 429 stops run as `quota_blocked` with 1-day retry. 5xx/network errors remain `provider_error` with 1-day retry. Admin Sync Actions tab: added Analyst Target Discovery section with Start/Continue/Restart chunked UX, quota-safe badge, and cooldown info including plan_limited note. Data Inventory: added `plan-limited` filter pill, Plan Limited summary card (blue), `plan_limited` status rendered in blue distinct from red `provider_error`; `eligible-target-retry` filter explicitly excludes `plan_limited`. Dashboard and Scanner unchanged — no provider calls added, Opportunity Score unchanged. QA result: 40 symbols classified as `plan_limited` in first run (0 provider_error today), targetNextRetryAt ≈ 2026-08-30 for all plan_limited records, has_target records untouched (HAS_TARGET_TOUCHED_TODAY=0). Known issue (pre-existing, not caused by this phase): 19 has_target records from May 28 have null targetMean/targetPrice — suggests FMP may return target data under a different field name than expected; to investigate before Phase 16. Build passes, tsc --noEmit zero errors, prisma validate valid. Approved by user.
- Phase 16 completed (2026-06-01): Sync Architecture Cleanup & Workflow Refactor. Reorganized Admin Sync UI into clean product-level workflows. Renamed page title from "Market Data Sync" to "Admin Sync". Restructured Sync Actions tab into four clearly labeled sections: Universe Sync (badge: Manual / Weekly, button: "Sync Stock Universe"), Daily Market Data Sync (badge: Daily, button: "Sync Daily Market Data"), Company Data Sync (badge: Weekly / Slow-changing, button: "Sync Company Data"), and Score Calculation. Moved Analyst Target Discovery out of the main workflow into a new collapsible "Developer / Legacy Tools" section (collapsed by default, labeled "Not production workflows", "Legacy" badge). All existing sync handlers, progress panels (ChunkedSyncProgressPanel, PausedSyncPanel, ChunkedSyncResultPanel), Continue/Restart behavior, elapsed timers, polling logic, and Sync History remain fully intact. No API routes changed. No Prisma migration. No duplicate models. No temporary files. Build passes, tsc --noEmit zero errors, prisma validate valid, prisma migrate status clean (12 migrations, up to date). Browser QA passed: /admin/sync, /scanner, and / all load correctly. Approved by user.
- Phase 17 completed (2026-06-01): FMP Company Data Sync Migration. Fixed the field mapping bug from Phase 14/15 where FMP `/stable/price-target-summary` was incorrectly used as a source for targetMean/targetHigh/targetLow/targetMedian (those fields do not exist in that endpoint). Added `fetchFmpPriceTargetConsensus` to `fmp.ts` (calls `/stable/price-target-consensus` which correctly returns targetConsensus, targetHigh, targetLow, targetMedian). Enforced clean provider boundaries: `fmp.ts` contains only FMP calls, `finnhub.ts` contains only Finnhub calls (removed FMP call that was inside `fetchFinnhubAnalystData`). Provider composition moved into `app/api/admin/analyst-sync/process-next/route.ts` which calls `fetchFmpPriceTargetConsensus` + `fetchFinnhubAnalystData` in parallel per symbol and combines results before upsert. Updated upsert to set `targetStatus`, `targetLastFoundAt`, `targetLastAttemptedAt` — repairs old bad rows where `targetStatus = has_target` but `targetPrice = null`. SyncRun type kept as `analyst-data-nasdaq100-sync` (changing would break history/polling); UI label remains "Company Data Sync". SyncRun.provider = `fmp+finnhub`. Updated SyncPageClient.tsx description to reflect FMP consensus as source. Updated ScoreMethodologyTab.tsx to Phase 17 analyst data source table. Legacy Analyst Target Discovery remains in Developer/Legacy Tools with updated labels. No Prisma migration needed (all StockAnalystData fields existed). QA results: pre-sync targetPrice=0/100, bad rows=19; post-sync targetPrice=100/100, targetHigh=100/100, targetLow=100/100, targetMedian=100/100, analystUpsidePercent=100/100, bad rows=0. All 11 SyncRun types unaffected. Scores unchanged (avg fundamental=64.2, avg opportunity=60.3). Build passes, tsc --noEmit zero errors, prisma validate valid, prisma migrate status clean (12 migrations). Approved by user.
- Phase 18 completed (2026-06-01): FMP Fundamentals, Ratios & Growth Migration. Extended Company Data Sync to fetch FMP company fundamentals per symbol alongside the existing analyst sync. Added `beta` field to `NormalizedCompanyProfile` in types.ts. Added 5 new FMP provider functions to `fmp.ts`: `fetchFmpKeyMetrics`, `fetchFmpKeyMetricsTtm`, `fetchFmpRatios`, `fetchFmpRatiosTtm`, `fetchFmpFinancialGrowth`. Updated `fetchFmpCompanyProfile` to also extract and return `beta` from the profile response. Extended `app/api/admin/analyst-sync/process-next/route.ts` to call 4 FMP endpoints per symbol in parallel (profile, ratios-ttm, financial-growth, price-target-consensus) plus 1 Finnhub call (recommendation), then upsert both `StockAnalystData` (Phase 17 behavior preserved) and `StockMetric` (FMP data). Field mapping and normalization: FMP margin/ROE/ROA fields (decimal) multiplied by 100 for % scale; growth fields (decimal fraction) multiplied by 100; ratio fields (P/E, D/E, current ratio, etc.) stored as-is. Fields not covered by FMP (forwardPE, forwardPEG, week52High, week52Low, quarterly growth, dividendYield) preserved from Finnhub's last daily sync via safe-update pattern. Provider set to `fmp` on StockMetric after Company Data Sync. Stock.name and Stock.sector updated from FMP profile (only if non-null). Calls per stock: 4 FMP + 1 Finnhub = 5 total; ~500 calls for 100 stocks; estimated 3-5 min. Updated SyncPageClient.tsx Company Data Sync helper text with endpoint details and call estimates. Updated ScoreMethodologyTab.tsx data source overview to reference FMP Starter. No Prisma migration needed (all StockMetric fields already existed). Build passes, tsc --noEmit zero errors, prisma validate valid, prisma migrate status clean (12 migrations). Fixed the field mapping bug from Phase 14/15 where FMP `/stable/price-target-summary` was incorrectly used as a source for targetMean/targetHigh/targetLow/targetMedian (those fields do not exist in that endpoint). Added `fetchFmpPriceTargetConsensus` to `fmp.ts` (calls `/stable/price-target-consensus` which correctly returns targetConsensus, targetHigh, targetLow, targetMedian). Enforced clean provider boundaries: `fmp.ts` contains only FMP calls, `finnhub.ts` contains only Finnhub calls (removed FMP call that was inside `fetchFinnhubAnalystData`). Provider composition moved into `app/api/admin/analyst-sync/process-next/route.ts` which calls `fetchFmpPriceTargetConsensus` + `fetchFinnhubAnalystData` in parallel per symbol and combines results before upsert. Updated upsert to set `targetStatus`, `targetLastFoundAt`, `targetLastAttemptedAt` — repairs old bad rows where `targetStatus = has_target` but `targetPrice = null`. SyncRun type kept as `analyst-data-nasdaq100-sync` (changing would break history/polling); UI label remains "Company Data Sync". SyncRun.provider = `fmp+finnhub`. Updated SyncPageClient.tsx description to reflect FMP consensus as source. Updated ScoreMethodologyTab.tsx to Phase 17 analyst data source table. Legacy Analyst Target Discovery remains in Developer/Legacy Tools with updated labels. No Prisma migration needed (all StockAnalystData fields existed). QA results: pre-sync targetPrice=0/100, bad rows=19; post-sync targetPrice=100/100, targetHigh=100/100, targetLow=100/100, targetMedian=100/100, analystUpsidePercent=100/100, bad rows=0. All 11 SyncRun types unaffected. Scores unchanged (avg fundamental=64.2, avg opportunity=60.3). Build passes, tsc --noEmit zero errors, prisma validate valid, prisma migrate status clean (12 migrations). Approved by user.
- Phase 19 completed (2026-06-01): FMP Daily Market Data Sync Migration. Migrated Daily Market Data Sync from legacy Finnhub quote + basic metrics to FMP `/stable/quote` only. Added `fetchFmpQuote(symbol)` to `fmp.ts`. Added migration `20260601193636_add_stock_quote_52w_and_averages` to extend `StockQuote` with `week52High`, `week52Low`, `priceAvg50`, `priceAvg200`. Rewrote `app/api/admin/sync-runs/process-next/route.ts` — FMP quote only, all StockMetric writes removed, PROVIDER set to `fmp`, pacing reduced to 250ms (FMP Starter). Updated `app/api/admin/sync-runs/start/route.ts` — provider changed from `finnhub` to `fmp`. Updated `SyncPageClient.tsx` — removed all legacy Finnhub wording, replaced "Legacy metrics coverage" panel with "Quote Coverage" (100/100), updated description and info panel to reference FMP, fixed pre-existing `SYNC_RUN_TYPE_LABELS` bug (added `market-data-nasdaq100-chunked-sync` key). SyncRun type kept as `market-data-nasdaq100-chunked-sync` to preserve Sync History. QA confirmed: 100/100 stocks synced (0 skipped, 0 failed), all 14 StockQuote fields populated including new 52-week and moving-average fields, source=fmp on all rows, StockMetric byte-for-byte unchanged (provider=fmp, same lastSyncedAt, same values — Daily Sync did not touch StockMetric), Scanner loads 100 stocks with real prices/scores, Dashboard coverage 100/100 for quotes/metrics/scores/targets, all 6 admin tabs load, Developer/Legacy Tools preserved. Runtime: ~2m15s for 100 stocks (was ~5min with 2 Finnhub calls/stock). Build passes, tsc --noEmit zero errors, prisma validate valid, prisma migrate status clean (13 migrations). Approved by user.
- Phase 20 completed (2026-06-02): Opportunity Score v2 with Analyst Targets. Rewrote `src/lib/scoring/opportunity-score.ts` — new v2 formula with 7 components (Fundamental Quality 25%, Valuation 20%, Growth 15%, Analyst Upside 20%, Analyst Sentiment 10%, Price Position 5%, Risk/Context 5%); analyst upside scored on 8-tier scale (≥60%→100 down to <−10%→15), capped at 60% for scoring but raw value untouched; analyst sentiment uses weighted recommendation counts (SB=100, B=80, H=50, S=20, SS=0) divided by total, then pulled toward neutral via confidence multiplier based on analyst count (≥30→1.00, 20–29→0.95, 10–19→0.90, 5–9→0.80, 1–4→0.65); price position reads from StockQuote.week52High/Low (FMP daily sync); missing components re-normalized not zeroed; fundamentalScore required. Updated `calculateOpportunityScoresAction` in `src/actions/market-data-actions.ts` — added `analystData` include, updated input mapping, version constant set to `opportunity-v2`. Updated `src/components/admin/SyncPageClient.tsx` button description to v2 wording referencing all 7 components, DB-only, run after Company/Daily syncs. Rewrote Opportunity Score section in `src/components/admin/ScoreMethodologyTab.tsx` — full v2 documentation including component table, analyst upside scale, sentiment formula, confidence table, price position table, re-normalization note, example calculation; updated Analyst Data section to say fields are now scored in v2; updated legacy Phase 15 note to reference v2. QA results: baseline avg=63.49 (v1), post-calc avg=63.34 (v2); 100/100 Nasdaq 100 calculated, 0 failed, 4 seed stocks skipped (no fundamentalScore — expected); all scores in [0,100]; NVDA improved 79→82 (high upside 41.8%), AMD reduced 62→55 (negative upside −12.3%), AVGO reduced 70→64 (near-zero upside −0.2%), PLTR constrained at 66 (poor valuation despite strong growth), TSLA remains low at 38 (weak fundamentals); no fake zeros; score distribution bell-shaped around 60–74. No migration. No new DB table. No provider calls. Build passes, tsc --noEmit zero errors, prisma validate valid, prisma migrate status clean (13 migrations). Approved by user.