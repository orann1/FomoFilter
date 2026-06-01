# Phase 16 — Sync Architecture Cleanup & Workflow Refactor

## Status

Completed

---

## Goal

Clean up and refactor the Admin Sync architecture into a small number of clear, consistent, product-level workflows.

The project currently has several sync actions that were created during development and testing phases. Some are still useful, some are temporary workarounds, and some are now confusing because FMP Starter changes the provider strategy.

Phase 16 should reorganize Admin Sync around three main workflows:

```txt
1. Universe Sync
2. Company Data Sync
3. Daily Market Data Sync
```

Future optional workflow:

```txt
4. Intraday / Frequent Market Refresh Sync
```

This phase is primarily about:

```txt
Architecture cleanup
UI cleanup
Workflow naming
Refactoring existing sync logic
Removing obsolete/development-era clutter
Preserving existing good sync mechanics
Avoiding duplicate DB tables and duplicate logic
```

---

## Why This Phase Is Needed

The app was built incrementally through multiple phases:

- Universe sync.
- Quote sync.
- Market data sync.
- Analyst data sync.
- Analyst target discovery.
- Fundamental score calculation.
- Opportunity score calculation.
- Dashboard cleanup.
- Scanner real-data integration.
- FMP Starter endpoint testing.

This created a functional but increasingly confusing Admin Sync area.

Current examples of development-era sync actions:

```txt
Sync Nasdaq 100 Universe
Sync All Nasdaq 100 Market Data
Sync Nasdaq 100 Analyst Data
Analyst Target Discovery
Sample DB Writes
Provider Tests
```

These names describe implementation phases and provider experiments, not clean product workflows.

Now that FMP Starter has been purchased and tested, the sync architecture should be cleaned before adding more features.

---

## Critical Product Decision

Do not keep adding patches.

Do not build more parallel sync actions.

Do not create duplicate DB tables.

Do not create duplicate provider logic.

Do not create duplicate progress mechanisms.

Instead:

```txt
Refactor existing logic into clean workflows.
Reuse existing models and sync infrastructure.
Remove or hide obsolete UI actions.
Keep the system consistent before adding new data types.
```

---

## Important Rules

This phase must be implemented carefully and incrementally.

### Do

- Audit first.
- Refactor existing code.
- Reuse existing SyncRun and SyncRunItem.
- Reuse existing progress UI patterns.
- Reuse existing chunked sync patterns.
- Reuse existing provider functions if still valid.
- Keep Continue / Restart behavior where applicable.
- Keep Sync History logging.
- Keep Data Inventory useful.
- Keep Provider Tests available, but move developer-only tools out of the main workflow.
- Delete temporary, obsolete, and debug files.
- Keep old working logic until replacement is verified.

### Do Not

- Do not add new scoring formulas.
- Do not change Fundamental Score.
- Do not change Opportunity Score.
- Do not add Analyst Sentiment Score yet.
- Do not add Momentum Score yet.
- Do not add Catalyst Score yet.
- Do not add new providers.
- Do not add Yahoo.
- Do not install packages.
- Do not create duplicate Prisma models if existing tables can be reused.
- Do not create new sync actions that duplicate old actions.
- Do not delete production logic blindly.
- Do not break Scanner or Dashboard.
- Do not remove Sync History.
- Do not remove progress UI.
- Do not expose API keys or raw payloads.

---

## Current Provider Strategy After FMP Starter Test

FMP Starter endpoint verification showed:

### FMP Starter can be primary provider for:

```txt
Profile
Quotes
Historical daily prices
Key metrics
Ratios
Ratios TTM
Key metrics TTM
Financial growth
Financial statements
Price target consensus
Price target summary
News
Earnings
```

### Finnhub should remain for:

```txt
Analyst recommendation counts
Strong Buy / Buy / Hold / Sell / Strong Sell
Analyst count
```

### Do not rely on FMP Starter for:

```txt
Analyst ratings / grades endpoints
Technical indicator endpoint
Batch quote by comma-separated symbols
```

### Technical indicators should be calculated internally from:

```txt
FMP historical daily candles
```

---

## New Admin Sync Structure

The Sync Actions tab should be reorganized around these sections:

```txt
1. Universe Sync
2. Company Data Sync
3. Daily Market Data Sync
4. Score Calculation
5. Developer / Provider Tools
```

---

# 1. Universe Sync

## Purpose

Build and maintain the list of stocks the system tracks.

Initial scope:

```txt
Nasdaq 100
```

Future scope:

```txt
S&P 500
Russell 1000
Russell 2000
Custom watchlists
All US Stocks
```

## What It Should Do

```txt
Create missing Stock rows
Update StockUniverse rows
Update StockUniverseMember rows
Mark removed symbols inactive for that universe
Keep historical stock rows
```

## What It Should Not Do

```txt
Do not sync quotes
Do not sync financial metrics
Do not sync analyst data
Do not sync news
Do not calculate scores
Do not delete stocks
```

## Frequency

Manual:

```txt
Weekly or monthly
```

## Existing Logic To Refactor

Current action:

```txt
Sync Nasdaq 100 Universe
```

Should become:

```txt
Sync Stock Universe
```

or:

```txt
Sync Universe — Nasdaq 100
```

## UI Copy

Suggested title:

```txt
Universe Sync
```

Suggested button:

```txt
Sync Stock Universe
```

Suggested description:

```txt
Builds and updates the active stock universe. Creates missing stocks, updates membership, and marks removed symbols inactive. Does not sync market or financial data.
```

Suggested badge:

```txt
Manual / Weekly
```

---

# 2. Company Data Sync

## Purpose

Sync slower-changing company and financial data for all active stocks in the selected universe.

This workflow replaces scattered development-era actions that separately handled metrics, analyst data, and target discovery.

## Data Included

Recommended v1 data types:

```txt
Company profile
Sector
Industry
Description
Market cap baseline
Beta
Financial statements
Key metrics
Key metrics TTM
Ratios
Ratios TTM
Financial growth
Analyst price target consensus
Analyst price target summary
Finnhub recommendation counts
Earnings data
```

## Provider Sources

| Data Type | Provider |
| --- | --- |
| Profile | FMP |
| Key Metrics | FMP |
| Key Metrics TTM | FMP |
| Ratios | FMP |
| Ratios TTM | FMP |
| Financial Growth | FMP |
| Financial Statements | FMP |
| Analyst Target Consensus | FMP |
| Analyst Target Summary | FMP |
| Earnings | FMP |
| Analyst Recommendation Counts | Finnhub |

## Frequency

Manual or scheduled later:

```txt
Weekly
After earnings season
After major provider refresh
```

## Existing Logic To Refactor / Merge

Current actions to evaluate:

```txt
Sync Nasdaq 100 Analyst Data
Analyst Target Discovery
Parts of Sync All Nasdaq 100 Market Data
Profile sample sync
Any FMP profile/metric sync helpers
```

## Important Notes

The old Analyst Target Discovery workflow was useful for the free FMP plan, but after FMP Starter testing, the main target source should become:

```txt
FMP /stable/price-target-consensus
```

This should replace the old reliance on:

```txt
FMP /stable/price-target-summary
```

for primary target fields.

Correct mapping:

```txt
targetConsensus → primary target price / targetMean
targetHigh → targetHigh
targetLow → targetLow
targetMedian → targetMedian
```

Price Target Summary should only be used as recency support:

```txt
lastMonthAvgPriceTarget
lastQuarterAvgPriceTarget
lastYearAvgPriceTarget
allTimeAvgPriceTarget
```

## What To Do With Analyst Target Discovery

Do not delete immediately unless safe.

Recommended:

```txt
Move to Developer / Legacy Tools
or hide from the main Sync Actions workflow
or mark as legacy/free-plan fallback
```

It should no longer be the main target workflow if FMP Starter consensus coverage is confirmed.

## UI Copy

Suggested title:

```txt
Company Data Sync
```

Suggested button:

```txt
Sync Company Data
```

Suggested description:

```txt
Syncs slower-changing company data: profile, fundamentals, ratios, financial growth, analyst targets, analyst recommendation counts, and earnings data.
```

Suggested badge:

```txt
Weekly / Slow-changing
```

Suggested note:

```txt
Run weekly or after earnings updates. Does not calculate scores automatically.
```

---

# 3. Daily Market Data Sync

## Purpose

Sync market data that changes daily.

This should be separate from Company Data Sync.

## Data Included

Recommended v1:

```txt
Current price
Day change %
Open
Day high
Day low
Previous close
Volume
Year high
Year low
priceAvg50
priceAvg200
Historical daily candles
Recent volume history
Daily price change windows
```

Derived internally later:

```txt
Relative volume
SMA
EMA
RSI
MACD
Momentum inputs
Trend strength
```

## Provider Sources

| Data Type | Provider |
| --- | --- |
| Quote | FMP |
| Quote short | FMP |
| Historical daily EOD | FMP |
| Stock price change windows | FMP |
| Derived indicators | Internal |

## Frequency

Manual initially:

```txt
Daily
```

Future:

```txt
Scheduled after market close
```

## Existing Logic To Refactor

Current action:

```txt
Sync All Nasdaq 100 Market Data
```

This should be split and renamed.

The daily part should become:

```txt
Sync Daily Market Data
```

## UI Copy

Suggested title:

```txt
Daily Market Data Sync
```

Suggested button:

```txt
Sync Daily Market Data
```

Suggested description:

```txt
Refreshes daily-changing market data for all active stocks: quotes, price movement, volume, 52-week context, daily candles, and derived daily market indicators.
```

Suggested badge:

```txt
Daily
```

Suggested note:

```txt
Run once per trading day, preferably after market close.
```

---

# 4. Score Calculation

## Purpose

Keep scoring actions separate from data sync.

## Current Buttons To Keep

```txt
Calculate Fundamental Scores
Calculate Opportunity Scores
```

## Future Buttons

Not in this phase:

```txt
Calculate Analyst Sentiment Score
Calculate Momentum Score
Calculate Catalyst Score
```

## Rules

Scores should not be recalculated automatically by data sync unless explicitly approved later.

Each score calculation should remain internal:

```txt
provider = internal
```

Each score action should log SyncRun and SyncRunItem where appropriate.

---

# 5. Developer / Provider Tools

## Purpose

Keep testing utilities available without cluttering the main workflow.

Move or keep under Provider Tests tab:

```txt
Provider Tests
Sample DB Writes
Legacy Analyst Target Discovery if kept
Any old sample sync buttons
```

## Rules

These should not appear as main production workflows.

They should be clearly labeled:

```txt
Developer utility
Test only
Writes sample data
Legacy fallback
```

---

## Required Audit Before Implementation

Before changing code, inspect and document:

### Admin UI

```txt
src/components/admin/SyncPageClient.tsx
src/components/admin/DataInventoryTab.tsx
src/components/admin/ScoreMethodologyTab.tsx
app/admin/sync/page.tsx
```

### Data Loaders

```txt
src/lib/data/admin-sync.ts
src/lib/data/admin-universes.ts
src/lib/data/admin-stock-data.ts
src/lib/data/dashboard.ts
src/lib/data/scanner.ts
```

### Actions / API Routes

```txt
src/actions/market-data-actions.ts
app/api/admin/sync-runs/*
app/api/admin/analyst-sync/*
app/api/admin/analyst-target-discovery/*
any other admin sync API routes
```

### Providers

```txt
src/lib/market-data/providers/fmp.ts
src/lib/market-data/providers/finnhub.ts
src/lib/market-data/providers/twelve-data.ts
```

### Prisma Models

```txt
Stock
StockQuote
StockMetric
StockAnalystData
StockScore
StockUniverse
StockUniverseMember
SyncRun
SyncRunItem
```

### Temporary / Obsolete Files

Search for:

```txt
tmp/
debug scripts
QA scripts
screenshot artifacts
old provider test files
dev logs
Playwright artifacts
debug API routes
raw provider payload dumps
```

Delete only files that are clearly temporary or obsolete.

Do not delete production logic unless confirmed safe.

---

## Refactor Principles

### Prefer Renaming / Reorganizing Before Rewriting

If an existing action already works, do not duplicate it.

Example:

```txt
Sync Nasdaq 100 Universe → rename/reframe as Universe Sync
```

### Prefer Reusing SyncRun

All main workflows should use:

```txt
SyncRun
SyncRunItem
```

Do not introduce new tracking tables unless absolutely necessary.

### Prefer Reusing Progress UI

All workflows should show consistent progress:

```txt
current symbol
processed / total
success / skipped / failed
elapsed time
progress bar
final result
continue
restart
history
```

### Prefer Clean Provider Boundaries

Provider functions should be:

```txt
small
typed
normalized
safe
no API key leaks
```

### Do Not Keep Development Naming

Avoid UI names like:

```txt
Nasdaq 100 Quote Snapshots
Analyst Target Discovery
Full Sync
Sample Sync
```

in the main product workflow.

Use product names:

```txt
Universe Sync
Company Data Sync
Daily Market Data Sync
```

---

## Data Ownership by Workflow

| Data / Feature | Workflow |
| --- | --- |
| Stock universe | Universe Sync |
| Stock membership | Universe Sync |
| Profile | Company Data Sync |
| Sector / Industry | Company Data Sync |
| Description | Company Data Sync |
| Statements | Company Data Sync |
| Key Metrics | Company Data Sync |
| Ratios | Company Data Sync |
| Financial Growth | Company Data Sync |
| Analyst Targets | Company Data Sync |
| Analyst Ratings / Recommendations | Company Data Sync |
| Earnings | Company Data Sync |
| Quote | Daily Market Data Sync |
| Volume | Daily Market Data Sync |
| 52-week context | Daily Market Data Sync |
| Daily candles | Daily Market Data Sync |
| Relative volume | Daily Market Data Sync / Internal |
| Momentum base data | Daily Market Data Sync / Internal |
| News | Future Daily or Catalyst Sync |
| Scores | Score Calculation |

---

## What Should Be Cleaned From Main Sync UI

Main Sync Actions should no longer prominently show development-era buttons:

```txt
Sync Nasdaq 100 Quote Snapshots
Sync Nasdaq 100 Quotes + Metrics — Next 25
Sync All Nasdaq 100 Market Data
Sync Nasdaq 100 Analyst Data
Analyst Target Discovery
Sample Sync
Sample DB Writes
```

Expected handling:

| Old Item | New Handling |
| --- | --- |
| Sync Nasdaq 100 Universe | Refactor into Universe Sync |
| Sync All Nasdaq 100 Market Data | Split into Daily Market Data Sync + Company Data Sync |
| Sync Nasdaq 100 Analyst Data | Merge into Company Data Sync |
| Analyst Target Discovery | Move to Developer/Legacy or hide after replacement |
| Sample Sync | Provider Tests / Developer Tools only |
| Provider Tests | Keep in Provider Tests tab |
| Sample DB Writes | Keep in Provider Tests tab, clearly labeled |

---

## Phase 16 Implementation Scope

This phase should focus on cleanup and structure.

### Required

```txt
Admin Sync UI reorganized into the new workflow sections.
Old/development-era main buttons hidden, renamed, or moved.
Descriptions and helper text updated.
Existing progress mechanisms preserved.
Sync History still works.
Data Inventory still works.
Provider Tests still available.
Temporary obsolete files removed.
No duplicate DB tables added.
```

### Optional Only If Safe

```txt
Rename SyncRun type labels in UI, without changing historical data.
Add display labels for old SyncRun types.
Move legacy tools into a collapsible Developer Tools section.
Add config constants for workflow names.
```

### Not Required Yet

```txt
Implement full FMP Company Data migration.
Implement full FMP Daily Market Data migration.
Add historical candles table.
Add Momentum Score.
Add Catalyst Score.
Remove old DB fields.
Remove old routes that may still be referenced.
```

---

## Acceptance Criteria

Phase 16 is complete when:

- Admin Sync has a clean workflow-based structure.
- Main workflows are:
  - Universe Sync
  - Company Data Sync
  - Daily Market Data Sync
  - Score Calculation
- Old development-era buttons are not cluttering the main workflow.
- Legacy/test tools are clearly moved or labeled.
- Existing working sync logic is preserved.
- Progress bar and progress details remain available.
- Continue / Restart behavior remains available where applicable.
- Sync History remains accurate.
- No duplicate Prisma models/tables are created.
- Temporary/debug files are removed.
- Scanner still loads.
- Dashboard still loads.
- Data Inventory still loads.
- Score Methodology still loads.
- Provider Tests still load.
- Build passes.
- TypeScript passes.
- Prisma validates.
- Migration status is clean.

---

## Browser QA Checklist

Open:

```txt
/admin/sync
```

Confirm:

1. Sync Actions tab is clean and organized.
2. Universe Sync section appears.
3. Company Data Sync section appears.
4. Daily Market Data Sync section appears.
5. Score Calculation section appears.
6. Old buttons are not shown in the main workflow.
7. Legacy/developer tools are moved or clearly labeled.
8. Descriptions explain frequency and data ownership.
9. Progress panel still works for existing actions.
10. Continue / Restart behavior still works where applicable.
11. Sync History still displays previous runs.
12. Provider Tests tab still works.
13. Data Inventory tab still works.
14. Score Methodology tab still works.

Open:

```txt
/scanner
/
```

Confirm:

1. Scanner loads.
2. Dashboard loads.
3. No provider calls happen from Scanner/Dashboard render.
4. No UI regression.

---

## Validation

Run:

```txt
npm run build
npx tsc --noEmit
npx prisma validate
npx prisma migrate status
```

No migration is expected in this phase.

If a migration is needed, stop and explain why before adding it.

---

## Required Implementation Report

Return a concise report in English only with:

1. Files inspected.
2. Current sync actions found.
3. Obsolete/development-era items found.
4. Files deleted.
5. Files changed.
6. Main UI restructuring performed.
7. What was kept.
8. What was moved to Developer/Provider tools.
9. What was hidden or removed from main UI.
10. Whether any API routes/actions were deleted or only hidden.
11. Confirmation no duplicate DB tables/models were created.
12. Confirmation progress/continue/history behavior was preserved.
13. Browser QA results.
14. Regression QA results.
15. Automated check results.
16. Known issues.
17. Ready for commit or not.

---

## Future Phases After This Cleanup

After Phase 16, continue with implementation phases:

```txt
Phase 17 — FMP Company Data Sync Migration
Phase 18 — FMP Daily Market Data Sync Migration
Phase 19 — Opportunity Score v2 with Analyst Targets
Phase 20 — Historical Daily + Momentum Foundation
Phase 21 — News and Earnings Catalyst Foundation
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