# Phase 11 — Scanner UX & Universe Selector Improvements

## Status

Completed (2026-05-24)

---

## Goal

Improve the Scanner UX now that Phase 10 connected `/scanner` to real DB data.

Phase 10 made the Scanner functional with real Nasdaq 100 data. Phase 11 should make it easier to use, easier to understand, and cleaner for daily stock discovery.

The focus is:

```txt
Universe selector correctness
Scanner table readability
Real-data filters
Real-data sort options
Score explanations
Expandable stock details
Clean unsupported UI
Minimal Dashboard cleanup/audit
```

This phase should not introduce new data providers, new sync logic, or new scoring formulas.

---

## Why This Phase Is Needed

After Phase 10, `/scanner` now shows around 100 real Nasdaq 100 stocks with:

- Quote data.
- Fundamental Score.
- Category scores.
- Finnhub metric fields.
- Real DB-backed rows.

However, there is a known UX issue:

```txt
Universe selector still shows Russell 1000,
while the active/default data is Nasdaq 100.
```

Also, the table now has many real columns, which is useful but can become visually dense.

Phase 11 should make the Scanner more usable before expanding to larger universes like Russell 1000.

---

## Product Direction

The Scanner should become a practical **Fundamental Scanner v1**.

It should help the user answer:

```txt
Which Nasdaq 100 companies have the strongest fundamentals?
Which companies are strong in growth, profitability, valuation, and financial health?
Which metrics explain the score?
How can I quickly filter and sort the list?
```

It should not yet answer:

```txt
Which stocks have strong momentum?
Which stocks have unusual volume?
Which stocks have a catalyst?
Which stocks have analyst upside?
Which stocks have a technical breakout setup?
```

Those will be future phases.

---

## Scope

Phase 11 includes:

1. Fix Universe Selector UX.
2. Improve Scanner table layout.
3. Add score explanations/tooltips.
4. Add useful real-data filter pills.
5. Improve sort options.
6. Add expandable row or details panel.
7. Improve empty states.
8. Keep unsupported future concepts disabled or hidden.
9. Audit/minimally clean Dashboard if safe.

---

## Non-Scope

Do not build:

- New data sync.
- New external API calls.
- New provider integrations.
- New Fundamental Score formula.
- Opportunity Score.
- Hot Score.
- Technical indicators.
- Volume anomaly detection.
- News/catalyst detection.
- Analyst target/upside.
- Russell 1000 sync.
- Pagination/virtualization unless required for current performance.
- Watchlist actions unless already existing and safe.
- Alerts logic changes.
- AI insights.

---

# 1. Universe Selector Fix

## Current Problem

The Scanner data defaults to Nasdaq 100, but the universe selector shows a Russell 1000 button.

Known issue from Phase 10:

```txt
Universe selector strip shows "Russell 1000" button,
but the selected data is Nasdaq 100.
No button appears active because selected slug is nasdaq-100,
but only rendered base universe is russell-1000.
```

This is confusing and must be fixed.

---

## Requirements

The Scanner should clearly show the active universe.

For current data:

```txt
Universe: Nasdaq 100
```

The active universe selector should show:

```txt
Nasdaq 100
```

and it should be highlighted.

If Russell 1000 is not available yet, do not show it as an active selectable option.

Acceptable options:

### Option A — Show only available universes

Show:

```txt
Nasdaq 100
```

Only.

### Option B — Show future universes disabled

Show:

```txt
Nasdaq 100
Russell 1000 — Coming soon
S&P 500 — Coming soon
```

Only `Nasdaq 100` should be active/selectable.

Disabled future options should have a tooltip:

```txt
Coming soon — universe data is not loaded yet.
```

Recommended:

```txt
Option B
```

because it communicates roadmap without confusing the user.

---

## Data Source

Universe options should be DB-backed where possible.

Use `StockUniverse` records if available.

The active universe should be derived from the current query/filter.

Do not hardcode misleading labels.

If a fallback is needed, it should be accurate:

```txt
nasdaq-100 → Nasdaq 100
```

---

## Acceptance Criteria

- Scanner default universe label is Nasdaq 100.
- Nasdaq 100 button is visible and active.
- Russell 1000 is not shown as active unless real Russell 1000 data exists.
- If Russell 1000 is shown, it is disabled and marked Coming soon.
- Result count matches selected universe/filter.

---

# 2. Scanner Table Layout Improvements

## Current Situation

Phase 10 introduced real data columns:

```txt
Symbol
Sector
Price
Day %
Fund.
Growth
Profit.
Valuat.
Health
Risk
P/E
PEG
Rev Gr.
EPS Gr.
ROE
D/E
Mkt Cap
```

This is useful, but it can be dense.

---

## Requirements

Keep the main table focused and readable.

Recommended main table columns:

```txt
Symbol
Company
Sector
Price
Day %
Fundamental
Growth
Profitability
Valuation
Health
Risk
P/E
PEG
ROE
Revenue Growth
Market Cap
```

If the table is still too wide, move some metrics into an expandable details row.

Recommended fields to move to details if needed:

```txt
EPS Growth
Debt/Equity
Gross Margin
Operating Margin
Net Margin
Forward P/E
EV/EBITDA
Beta
Quote Last Synced
Score Last Calculated
Metrics Last Synced
```

Do not remove important data completely; just move it to a more readable location.

---

## Visual Priorities

The most important columns should be easiest to scan:

1. Symbol / Company.
2. Fundamental Score.
3. Category scores.
4. Price / Day %.
5. Key valuation and growth metrics.

Scores should stand out visually but remain readable.

Use consistent formatting:

```txt
Score: integer 0–100
Percent: +12.4%
Currency: $610.26
Market Cap: $1.55T
Missing: N/A
```

---

# 3. Expandable Stock Details

## Goal

Add a way to inspect why a stock scored well or poorly without overloading the main table.

This can be:

```txt
Expandable row
Details drawer
Side panel
Modal
```

Recommended:

```txt
Expandable row
```

because it is simpler and keeps the user in the table context.

---

## Details Content

When a user expands a stock, show grouped sections:

### Score Breakdown

```txt
Fundamental Score
Growth Score
Profitability Score
Valuation Score
Financial Health Score
Risk / Context Score
Score Version
Score Last Calculated
```

### Growth Metrics

```txt
Revenue Growth TTM
EPS Growth TTM
Revenue Growth 3Y
EPS Growth 3Y
```

### Profitability Metrics

```txt
Gross Margin
Operating Margin
Net Margin
ROE
ROA
```

### Valuation Metrics

```txt
P/E
Forward P/E
PEG
Forward PEG
P/S
P/B
EV/EBITDA
```

### Financial Health Metrics

```txt
Debt / Equity
Current Ratio
Quick Ratio
Interest Coverage
```

### Quote / Data Freshness

```txt
Quote Last Synced
Metric Last Synced
Quote Source
Metrics Source
```

---

## Important

Do not call external APIs from the details panel.

Use data already loaded from DB or include necessary fields in the existing loader.

Avoid N+1 queries.

---

# 4. Score Tooltips / Explanations

## Goal

Help the user understand what each score means.

Add small tooltips or info icons for score columns.

Recommended tooltip text:

### Fundamental

```txt
Weighted score from growth, profitability, valuation, financial health, and risk/context.
```

### Growth

```txt
Revenue and EPS growth metrics.
```

### Profitability

```txt
Margins, ROE, and ROA.
```

### Valuation

```txt
Price paid relative to earnings, sales, EBITDA, and growth.
```

### Financial Health

```txt
Debt, liquidity, and interest coverage.
```

### Risk / Context

```txt
Beta and company size context.
```

---

## Link to Methodology

If possible, add a small link or note:

```txt
See Score Methodology in Admin for full calculation rules.
```

Do not duplicate the entire methodology inside the Scanner.

---

# 5. Real-Data Filter Pills

## Current / Previous Pills

Current or legacy pills may include:

```txt
All Stocks
Hot Today
Strong Momentum
Best Opportunities
Unusual Volume
FOMO Risk
In Watchlist
Alert Active
```

Some of these are unsupported because we do not yet have technical/news/momentum/catalyst data.

---

## Requirements

Do not show unsupported pills as if they work.

Recommended active pills for Phase 11:

```txt
All Stocks
High Fundamentals
High Growth
High Profitability
Reasonable Valuation
In Watchlist
Alert Active
```

Only keep `In Watchlist` and `Alert Active` if backed by real DB data.

---

## Suggested Pill Logic

### All Stocks

No extra filter.

### High Fundamentals

```txt
fundamentalScore >= 75
```

### High Growth

```txt
growthScore >= 75
```

### High Profitability

```txt
profitabilityScore >= 75
```

### Reasonable Valuation

Possible logic:

```txt
valuationScore >= 60
```

or:

```txt
valuationScore >= 50
```

Choose one and document it.

### In Watchlist

Only if DB relation exists.

### Alert Active

Only if DB relation exists.

---

## Unsupported Pills

Hide or disable:

```txt
Hot Today
Strong Momentum
Unusual Volume
FOMO Risk
Catalyst
Best Opportunities
```

If shown, they must be disabled with tooltip:

```txt
Coming soon — requires technical/momentum/news data.
```

Do not apply fake filters.

---

# 6. Filter Panel

## Filters To Keep / Add

Recommended filters:

```txt
Search by symbol/company
Universe
Sector
Minimum Fundamental Score
Minimum Growth Score
Minimum Profitability Score
Minimum Valuation Score
Minimum Financial Health Score
Market Cap range
Positive Day %
```

Keep it simple.

Do not create too many controls.

---

## Score Threshold Presets

If implementing sliders is too much, use dropdowns or select controls:

```txt
Any
50+
60+
70+
80+
90+
```

This is enough for v1.

---

## Sector Filter

The sector filter should be based on sectors present in the currently loaded real data.

Do not hardcode sector list unless necessary.

---

# 7. Sorting Improvements

## Default Sort

Keep:

```txt
Fundamental Score desc
```

## Sort Options

Recommended sort options:

```txt
Fundamental Score
Growth Score
Profitability Score
Valuation Score
Financial Health Score
Risk / Context Score
Day % Change
Market Cap
P/E
PEG
ROE
Revenue Growth
Symbol A–Z
```

Remove or hide unsupported sorts:

```txt
Best Signal
Hot
Opportunity
Setup
Catalyst
```

unless they are backed by real DB data.

---

# 8. Empty States

If no rows match filters, show a helpful message:

```txt
No stocks match your filters.
Try lowering the score threshold, clearing the sector filter, or selecting All Stocks.
```

If no data exists at all:

```txt
No scanner data available yet.
Run Market Data Sync and Calculate Fundamental Scores from Admin Sync.
```

---

# 9. Dashboard Minimal Cleanup / Audit

## Current Dashboard Issue

Dashboard shows many real stocks but still displays old fields:

```txt
Hot
Opp
Setup
Catalyst
```

Many are zero, unknown, or dash.

---

## Requirement

Phase 11 may include a minimal Dashboard cleanup if safe.

Preferred approach:

```txt
Audit Dashboard and make only small safe changes.
```

Possible safe changes:

- Rename `Hot Stocks Today` to `Top Fundamental Scores`.
- Show `Fundamental Score` instead of `Hot`.
- Show `Growth` / `Profitability` / `Valuation` instead of `Opp` / `Risk` if appropriate.
- Show `N/A` instead of fake zero.
- Remove or hide catalyst/setup if not backed by real data.

If this becomes too large, defer Dashboard cleanup to Phase 12 and document it clearly.

---

# 10. No Data Changes

Do not add new DB fields.

Do not change scoring formulas.

Do not sync new provider data.

Do not call external APIs.

This is a UI/data mapping improvement phase.

No Prisma migration should be needed.

---

# 11. Performance

For 100 stocks, client-side filtering/sorting is acceptable.

For 1000+ future stocks, this may need pagination/virtualization.

Do not overbuild pagination now unless it is easy and safe.

Avoid:

- N+1 queries.
- external calls.
- repeated server calls for every filter change unless necessary.

---

# 12. Browser QA Checklist

Open:

```txt
/scanner
```

Confirm:

1. Universe selector shows Nasdaq 100 as active.
2. Russell 1000 is not misleadingly active.
3. Result count matches displayed rows.
4. Default sort is Fundamental Score descending.
5. Main table is readable.
6. Fundamental Score is visible.
7. Category scores are visible.
8. Score tooltips appear.
9. Search by symbol/company works.
10. Sector filter works.
11. Score threshold filters work.
12. Real-data pills work:
    - All Stocks
    - High Fundamentals
    - High Growth
    - High Profitability
    - Reasonable Valuation
13. Unsupported pills are hidden or disabled.
14. Expandable row/details panel works.
15. Details show score breakdown and metric groups.
16. Missing values show N/A.
17. No fake zeros are shown for missing values.
18. No external provider calls happen from Scanner.
19. Layout works for 100 rows.
20. Mobile card view still works.

Open:

```txt
/
```

Dashboard QA:

1. Dashboard loads.
2. If changed, new labels use real data.
3. If not changed, known Dashboard issues are documented for next phase.

---

# 13. Regression QA

Confirm:

- Admin Sync loads.
- Data Inventory loads.
- Score Methodology loads.
- Market Data Sync works or remains unchanged.
- Calculate Fundamental Scores works or remains unchanged.
- Provider Tests tab works.
- Sample DB Writes work.
- Watchlist page loads.
- Alerts page loads if applicable.
- Scanner has no provider calls.
- Build passes.

---

# 14. Validation

Run:

```txt
npm run build
npx tsc --noEmit
npx prisma validate
npx prisma migrate status
```

No Prisma migration should be needed.

If a migration is needed, stop and explain why.

---

# 15. Required Implementation Report

Return a concise report in English only with:

1. Files inspected.
2. Files changed.
3. Universe selector fix.
4. Main table changes.
5. Details/expandable panel implementation.
6. Score tooltip implementation.
7. Filter pills added/removed/disabled.
8. Filter controls added/changed.
9. Sort options changed.
10. Empty state changes.
11. Dashboard changes or Dashboard deferral note.
12. Confirmation no provider calls were added.
13. Browser QA results.
14. Regression QA results.
15. Automated check results.
16. Known issues.
17. Ready for commit or not.

---

## Acceptance Criteria

Phase 11 is complete when:

- Universe selector clearly shows Nasdaq 100 as active.
- Russell 1000 is not misleadingly shown as active.
- Scanner table is readable with real data.
- User can understand what the scores mean.
- User can filter by real score-based concepts.
- Unsupported future concepts are hidden or disabled.
- Expandable details show score and metric breakdown.
- Empty states are helpful.
- Dashboard is either minimally cleaned or explicitly deferred.
- No external provider calls are added.
- No scoring formula is changed.
- No migration is added.
- Build passes.
- TypeScript passes.
- Prisma validates.
- Migration status is clean.

---

## Future Phases

After Phase 11:

```txt
Phase 12 — Dashboard Real Data Cleanup
Phase 13 — Opportunity Score
Phase 14 — Technical / Momentum Data
Phase 15 — News / Catalyst Data
Phase 16 — Russell 1000 Universe Expansion
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