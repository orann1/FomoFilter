# Phase 19 — FMP Daily Market Data Sync Migration

## Status

Completed (2026-06-01)

---

## Goal

Migrate the **Daily Market Data Sync** workflow from the legacy Finnhub quote + basic metrics implementation to FMP Starter.

This phase should make Daily Market Data Sync responsible only for daily-changing market data.

The target ownership is:

```txt
Daily Market Data Sync
→ quote
→ price movement
→ volume
→ 52-week context
→ 50/200 day averages if available
→ daily price-change windows
→ future daily candles foundation
```

Company Data Sync already owns slow-changing company and financial data after Phase 18.

---

## Why This Phase Is Needed

After Phase 18, Company Data Sync now owns:

```txt
FMP profile
FMP ratios-ttm
FMP financial-growth
FMP price-target-consensus
Finnhub analyst recommendation counts
```

Phase 18 confirmed:

```txt
StockMetric coverage: 100 / 100
provider = fmp: 100 / 100
Fundamental Score recalculates successfully
Opportunity Score recalculates successfully
```

However, Daily Market Data Sync still uses the legacy Finnhub flow:

```txt
Finnhub quote
Finnhub basic financial metrics
```

This creates a data-ownership problem:

```txt
Daily Market Data Sync still fetches some company/financial metrics,
even though those now belong to Company Data Sync.
```

Phase 19 should clean this up by moving Daily Market Data Sync to FMP market data and removing financial metrics from the daily workflow.

---

## Critical Product Decision

Do not add another daily sync.

Do not duplicate StockQuote.

Do not create duplicate market data tables unless absolutely required.

Do not keep fetching company financial metrics inside Daily Market Data Sync.

Instead:

```txt
Reuse the existing Daily Market Data Sync flow.
Replace legacy Finnhub quote source with FMP quote data.
Keep StockQuote as the main quote table.
Use existing progress / continue / restart / history mechanisms.
Stop updating StockMetric from Daily Market Data Sync.
Leave StockMetric ownership to Company Data Sync.
```

---

## Scope

Phase 19 includes:

1. Audit existing Daily Market Data Sync implementation.
2. Replace Finnhub quote calls with FMP quote calls.
3. Stop Daily Market Data Sync from fetching/upserting Finnhub basic financial metrics.
4. Map FMP quote fields into existing `StockQuote`.
5. Preserve daily progress UI and chunked sync behavior.
6. Preserve SyncRun / SyncRunItem / Sync History.
7. Update UI copy to remove legacy Finnhub wording.
8. Update Data Inventory source/freshness labels where needed.
9. Confirm Scanner and Dashboard still read from DB only.
10. Confirm Company Data Sync remains the owner of StockMetric.

---

## Non-Scope

Do not implement:

- Historical candles table.
- Momentum Score.
- Relative volume calculation.
- RSI / EMA / MACD.
- News sync.
- Earnings/catalyst sync.
- Intraday refresh.
- Opportunity Score v2.
- Analyst Sentiment Score.
- Full deletion of Finnhub provider.
- Deletion of Finnhub analyst recommendation logic.
- Refactor of Company Data Sync.
- New database models unless absolutely required.

Do not change scoring formulas.

Do not automatically recalculate scores after Daily Market Data Sync.

---

## Provider Strategy For This Phase

| Data Type | Current Provider | New Provider | Workflow |
| --- | --- | --- | --- |
| Current price | Finnhub | FMP | Daily Market Data Sync |
| Day change | Finnhub | FMP | Daily Market Data Sync |
| Day change % | Finnhub | FMP | Daily Market Data Sync |
| Open / high / low | Finnhub | FMP | Daily Market Data Sync |
| Previous close | Finnhub | FMP | Daily Market Data Sync |
| Volume | Finnhub / mixed | FMP | Daily Market Data Sync |
| Market cap | Finnhub/FMP mixed | FMP quote/profile | Daily / Company depending field |
| 52-week high / low | Finnhub legacy | FMP quote | Daily Market Data Sync |
| priceAvg50 / priceAvg200 | Not currently reliable | FMP quote | Daily Market Data Sync |
| Basic financial metrics | Finnhub | No longer daily | Company Data Sync |
| Analyst recommendations | Finnhub | Finnhub | Company Data Sync |

---

## FMP Endpoint To Use

Use the verified FMP Starter endpoint:

```txt
/stable/quote?symbol={symbol}
```

FMP Starter verification showed this endpoint works for all tested symbols.

Expected useful fields include:

```txt
symbol
price
change
changePercentage
open
dayHigh
dayLow
previousClose
volume
marketCap
yearHigh
yearLow
priceAvg50
priceAvg200
exchange
timestamp
```

Important mapping note:

```txt
FMP uses changePercentage
not changesPercentage
```

---

# 1. Required Audit Before Implementation

Before changing logic, inspect and document:

## Current Daily Sync UI

```txt
src/components/admin/SyncPageClient.tsx
```

Check:

- Daily Market Data Sync button.
- Current helper text.
- Progress panel.
- Polling behavior.
- Continue / Restart behavior.
- Coverage panel.
- SyncRun type used by this workflow.

---

## Current Daily Sync Backend

Inspect:

```txt
app/api/admin/sync-runs/start/route.ts
app/api/admin/sync-runs/process-next/route.ts
app/api/admin/sync-runs/latest/route.ts
src/actions/market-data-actions.ts
src/lib/data/admin-sync.ts
```

Find:

- Where Finnhub quote is called.
- Where Finnhub basic financials are called.
- Where StockQuote is upserted.
- Where StockMetric is upserted by daily sync.
- Which counts/statuses are used.
- Whether the same API route is still named market-data-nasdaq100-chunked-sync.

---

## Providers

Inspect:

```txt
src/lib/market-data/providers/fmp.ts
src/lib/market-data/providers/finnhub.ts
```

Confirm or add:

```txt
fetchFmpQuote(symbol)
```

Provider boundary rules:

```txt
fmp.ts = FMP calls only
finnhub.ts = Finnhub calls only
daily sync process route = orchestrates FMP quote usage
```

Do not put FMP calls in `finnhub.ts`.

---

## DB Models

Inspect:

```txt
StockQuote
StockMetric
Stock
SyncRun
SyncRunItem
```

Confirm existing fields before adding anything.

No migration is expected unless `StockQuote` lacks required fields.

If a migration is needed, stop and explain before adding it.

---

# 2. StockQuote Mapping

Map FMP quote fields into existing `StockQuote`.

Suggested mapping:

| FMP field | DB field | Normalization |
| --- | --- | --- |
| symbol | stock symbol relation | none |
| price | price / currentPrice | none |
| change | change | none |
| changePercentage | changePercent | none |
| open | open | none |
| dayHigh | dayHigh | none |
| dayLow | dayLow | none |
| previousClose | previousClose | none |
| volume | volume | none |
| marketCap | marketCap if quote table has it | full USD |
| yearHigh | week52High / yearHigh field if exists | none |
| yearLow | week52Low / yearLow field if exists | none |
| priceAvg50 | priceAvg50 if exists | none |
| priceAvg200 | priceAvg200 if exists | none |
| exchange | exchange if exists | none |
| timestamp | sourceUpdatedAt / provider timestamp | convert safely |

If a DB field does not exist:

```txt
Do not add it automatically.
Report the missing field.
Only add migration if approved.
```

---

## Important Source Decision

Set quote provider/source to:

```txt
fmp
```

Do not use:

```txt
fmp+finnhub
```

for quote source.

Daily Market Data Sync should be FMP-only after this phase.

---

# 3. Remove StockMetric Updates From Daily Sync

Daily Market Data Sync should no longer call or upsert:

```txt
Finnhub /stock/metric
StockMetric basic financial metrics
```

Reason:

```txt
StockMetric now belongs to Company Data Sync.
Company Data Sync already refreshes FMP ratios/growth/profile data.
```

Required:

- Remove daily-sync dependency on `fetchFinnhubBasicFinancials`.
- Remove StockMetric upsert from daily sync route.
- Do not delete the provider function yet, unless confirmed unused elsewhere.
- Do not delete existing StockMetric data.
- Do not delete legacy fields.

This phase should stop future daily overwrites of company metric data.

---

# 4. SyncRun Type

Current daily workflow likely uses:

```txt
market-data-nasdaq100-chunked-sync
```

Default recommendation:

```txt
Keep this SyncRun type for now to avoid breaking polling/history.
Display label should remain Daily Market Data Sync.
```

If changing type is low risk, document first.

Do not break Sync History.

---

# 5. Progress UI

Preserve the existing behavior:

```txt
current symbol
processed / total
success / skipped / failed
elapsed time
progress bar
final result
continue
restart
sync history
```

Do not create a new progress system.

If the previous daily sync displayed metrics coverage, update the panel to quote/daily coverage.

---

# 6. UI Copy Updates

Update Daily Market Data Sync text after migration.

Suggested title:

```txt
Daily Market Data Sync
```

Suggested description:

```txt
Refreshes daily-changing market data for all active stocks: quotes, price movement, volume, 52-week context, and moving-average context from FMP. Does not sync company financial metrics.
```

Suggested helper text:

```txt
Current provider: FMP /stable/quote. Fetches one quote snapshot per active stock. Company metrics are handled by Company Data Sync.
```

Suggested note:

```txt
Run once per trading day, preferably after market close.
```

Remove old wording:

```txt
legacy Finnhub quote + basic metrics
2 calls per stock
metrics coverage
Current legacy sync may update basic metrics
```

Coverage panel should become:

```txt
Quote Coverage
```

or:

```txt
Daily Market Data Coverage
```

Suggested coverage fields:

```txt
Have quote
Missing quote
Last daily sync
Provider source: FMP
```

Do not show `Legacy metrics coverage` after migration.

---

# 7. Data Inventory Updates

Update Data Inventory source/freshness display if needed:

```txt
Quote Source = FMP
Quote Last Synced
Price
Change %
Volume
52-week high / low if shown
```

Metric source should remain:

```txt
FMP
```

from Company Data Sync.

Avoid showing quote provider as Finnhub after this phase.

---

# 8. Scanner Updates

Scanner reads DB only.

After migration:

```txt
Price
Day %
Market cap
Target / Upside
Scores
```

should still display correctly.

Required:

- No provider calls from Scanner.
- Missing values show N/A.
- Sort/filter still work.
- Target/Upside remain populated.
- Scores unchanged until recalculated manually.

Do not redesign Scanner.

---

# 9. Dashboard Updates

Dashboard reads DB only.

After migration:

```txt
Quote coverage should remain 100/100.
Metric coverage should remain 100/100 from Company Data Sync.
Target coverage should remain 100/100.
```

No live provider calls.

No redesign.

---

# 10. Rate Limit / Runtime

FMP Starter has higher call limits than the previous free plan.

Daily sync should now require:

```txt
1 FMP call per stock
~100 calls for Nasdaq 100
```

Expected runtime should be shorter than the previous legacy sync.

If pacing remains conservative, document it.

Suggested UI note:

```txt
Estimated calls: 1 FMP quote call per stock.
```

Do not remove pacing completely unless safe.

---

# 11. QA Requirements

## Admin Sync

Open:

```txt
/admin/sync → Sync Actions
```

Run:

```txt
Sync Daily Market Data
```

Confirm:

1. Progress panel works.
2. Current symbol updates.
3. Processed / total updates.
4. Succeeded / skipped / failed update.
5. Final result appears.
6. Sync History records the run.
7. Provider shows `fmp`.
8. UI no longer says legacy Finnhub.
9. UI no longer says quote + basic metrics.
10. UI no longer shows legacy metrics coverage.

---

## Coverage Report After Sync

Report:

```txt
Total active Nasdaq 100 stocks
With StockQuote row
Quote source = fmp
With price
With day change %
With open
With day high
With day low
With previous close
With volume
With 52-week high / low if fields exist
With priceAvg50 / priceAvg200 if fields exist
Missing quotes
Failed symbols
```

Expected:

```txt
100 / 100 active stocks should have FMP quote rows.
```

---

## StockMetric Preservation

Confirm:

```txt
StockMetric rows remain provider = fmp from Company Data Sync.
Daily Market Data Sync did not overwrite StockMetric.
Daily Market Data Sync did not call Finnhub basicFinancials.
Financial metrics remain intact after Daily sync.
```

Spot check:

```txt
AAPL
MSFT
NVDA
META
TSLA
```

Compare before/after:

```txt
grossMarginTTM
roeTTM
revenueGrowthTTMYoy
peBasicExclExtraTTM
provider
lastSyncedAt
```

These should not be overwritten by Daily sync.

---

## Scanner QA

Confirm:

```txt
Scanner loads
100 stocks visible
Prices updated
Day % updated
Target/Upside still populated
Scores still visible
Sort/filter still work
No provider calls from Scanner
```

---

## Dashboard QA

Confirm:

```txt
Dashboard loads
Quote coverage correct
Metric coverage still correct
Target coverage still 100/100
No provider calls from Dashboard
No stale warning introduced
```

---

## Regression

Confirm:

```txt
Universe Sync still works
Company Data Sync still works
Daily Market Data Sync works
Score Calculation works
Provider Tests load
Sync History works
Data Inventory loads
Score Methodology loads
Scanner loads
Dashboard loads
Legacy Target Discovery remains hidden/legacy
```

---

# 12. Validation

Run:

```txt
npm run build
npx tsc --noEmit
npx prisma validate
npx prisma migrate status
```

If a migration is needed, stop and explain why before adding it.

---

# 13. Required Implementation Report

Return a concise report in English only with:

1. Files inspected.
2. Existing Daily Sync behavior found.
3. FMP endpoint used.
4. StockQuote field mapping table.
5. Files changed.
6. Whether migration was needed.
7. Whether Finnhub basic metrics were removed from Daily sync.
8. Whether StockMetric writes were removed from Daily sync.
9. Provider composition after migration.
10. Calls per stock and estimated runtime.
11. UI copy changes.
12. Quote coverage before/after.
13. StockMetric preservation verification.
14. Data Inventory verification.
15. Scanner verification.
16. Dashboard verification.
17. Regression QA results.
18. Automated check results.
19. Known issues.
20. Ready for commit or not.

---

## Required Field Mapping Table In Report

Include:

| Category | FMP endpoint | FMP field | DB field | Normalization |
| --- | --- | --- | --- | --- |

Examples:

```txt
Quote | /stable/quote | price | price | none
Quote | /stable/quote | changePercentage | changePercent | none
Quote | /stable/quote | yearHigh | week52High | none
```

---

## Acceptance Criteria

Phase 19 is complete when:

- Daily Market Data Sync uses FMP quote data.
- Daily Market Data Sync no longer fetches Finnhub basic financial metrics.
- Daily Market Data Sync no longer upserts StockMetric.
- StockMetric remains owned by Company Data Sync.
- StockQuote is updated from FMP for all active stocks.
- Quote source shows FMP.
- UI copy no longer says legacy Finnhub.
- Progress/continue/history behavior is preserved.
- Scanner and Dashboard load.
- Company Data Sync is not broken.
- No duplicate quote table is created.
- No unnecessary migration is added.
- Build passes.
- TypeScript passes.
- Prisma validates.
- Migration status is clean.

---

## Future Phases

After Phase 19:

```txt
Phase 20 — Opportunity Score v2 with Analyst Targets
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