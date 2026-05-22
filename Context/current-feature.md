# Current Feature

## Feature Name

Phase 9F — Nasdaq 100 Controlled Quote Snapshot Sync

## Status

Completed

---

## Feature Reference

This feature continues the updated Market Data Sync strategy.

Read these documents before implementation:

```txt
Context/Features/market-data-sync-strategy-updated.md
Context/current-feature.md
```

Also use the project context files:

```txt
Context/CLAUDE.md
Context/project-overview.md
Context/coding-standards.md
Context/ai-interaction.md
```

---

## Goal

Add a controlled quote snapshot sync for active Nasdaq 100 members.

The goal is to update quote data for the Nasdaq 100 in safe, limited batches using Twelve Data, without running a full all-at-once sync and without calling APIs from Scanner render paths.

This phase should reduce `Missing Quotes` and `Stale Quotes` in the Admin Universe Overview and make the Scanner more useful with real quote snapshot data.

---

## Current Context

Phase 9E completed:

- Nasdaq 100 universe management.
- 100 active Nasdaq 100 members in the DB.
- Static fallback source for Nasdaq 100 membership.
- FMP used only for profile enrichment.
- Admin Sync tabs.
- DB Stock Summary.
- Universe Overview.
- SyncRun / SyncRunItem logging.
- Admin in-progress panel with elapsed timer.

Current issue after Phase 9E:

```txt
Nasdaq 100 has active members, but many are missing quotes or have stale quotes.
```

Phase 9F should address quote coverage only.

---

## Core Scope

Build:

1. Nasdaq 100 quote snapshot batch sync.
2. Batch size fixed at 25 symbols per run.
3. Smart selection of the next 25 symbols.
4. Twelve Data as the primary quote provider.
5. Reuse existing quote sync logic and safe-update behavior.
6. Persist `SyncRun` and `SyncRunItem`.
7. Add an Admin button in the Sync Actions tab.
8. Update Admin overview after sync.
9. Keep all existing Admin tabs and loading UX.

---

## Critical Rules

### Rule 1 — No Full Nasdaq 100 All-at-Once Sync

Do not add:

```txt
Sync All Nasdaq 100 Quotes
```

Only add:

```txt
Sync Nasdaq 100 Quote Snapshots — Next 25
```

or a very similar label.

---

### Rule 2 — Fixed Batch Size

Use a fixed batch size:

```txt
25 symbols per run
```

Do not add a batch-size selector in this phase.

Reason:

- Lower API credit risk.
- Simpler QA.
- Better controlled behavior.
- Easier to reason about rotating batches.

---

### Rule 3 — Use Only Active Nasdaq 100 Members

The quote batch must select only:

```txt
Nasdaq 100 members where StockUniverseMember.isActive = true
```

Do not sync inactive Nasdaq 100 members in this phase.

Do not sync S&P 500 or Russell 1000 in this phase.

---

### Rule 4 — No API Calls from Scanner/Dashboard Render

Do not call Twelve Data, FMP, or Finnhub from:

```txt
/scanner
/
Dashboard render
Drawer render
```

Quote sync must happen only through Admin manual sync actions.

---

### Rule 5 — Keep Safe Update Behavior

Provider data must not blindly overwrite existing DB values.

If Twelve Data returns missing, invalid, empty, or unusable values:

- Do not overwrite existing valid values.
- Mark the symbol as skipped or failed.
- Preserve other successful symbols.
- Store the issue in `SyncRunItem.reason`.
- Set the correct `dbAction`.

---

### Rule 6 — No Scoring Yet

Do not add or modify:

```txt
Hot Score
Opportunity Score
Risk Score
FOMO Risk
Setup classification
Alert evaluation
```

This phase only syncs quote snapshots.

---

## Data to Sync

Phase 9F is not just “price”.

It should sync the quote snapshot fields available from Twelve Data and supported by the current schema.

Target quote snapshot data:

```txt
current price
daily change
daily change percent
volume
open
high
low
previous close / close
source
last synced timestamp
source updated timestamp, if available
```

Before implementation, inspect:

1. The current `StockQuote` Prisma model.
2. The current `NormalizedQuote` type.
3. The current `fetchTwelveQuotes()` normalization.
4. The current `syncQuotesSampleAction()` upsert logic.

Then decide whether the existing schema already supports the desired fields.

---

## Schema Decision Requirement

Before coding the batch sync, inspect `StockQuote`.

### If `StockQuote` already supports enough fields

Do not add a migration.

Use existing fields only.

### If important quote snapshot fields are missing

Add a small Prisma migration.

Potential fields to consider only if missing and supported by Twelve Data:

```txt
open
high
low
previousClose
volume
change
changePercent
source
lastSyncedAt
sourceUpdatedAt
```

Do not add fields that are not currently needed.

Do not add historical candle fields to `StockQuote`.

Historical candles belong in a future `StockCandle` table or equivalent.

---

## Provider

Use Twelve Data.

```txt
provider = twelve-data
```

Do not use FMP for the Nasdaq 100 quote batch unless Twelve Data fails and a fallback is explicitly approved in a later phase.

Do not use Finnhub fallback in this phase unless explicitly required after QA.

---

## Batch Selection Logic

Create a selector for the next 25 Nasdaq 100 quote targets.

Suggested function:

```ts
getNextNasdaq100QuoteBatch(limit = 25)
```

Suggested location:

```txt
src/lib/data/admin-universes.ts
```

or a more appropriate server-side data file if it already exists.

Selection rules:

```txt
1. Active Nasdaq 100 members with no StockQuote first
2. Then active Nasdaq 100 members with oldest StockQuote.lastSyncedAt
3. Tie-breaker: symbol ASC
4. Limit 25
```

More detailed behavior:

- Only select stocks with active Nasdaq 100 membership.
- Prefer missing quotes first.
- For existing quotes, oldest `lastSyncedAt` first.
- Treat `lastSyncedAt = null` as stale.
- Use symbol ASC as deterministic fallback.
- Return exactly up to 25 symbols.
- If fewer than 25 active symbols need sync, return fewer.
- If all 100 are fresh, still allow selecting the 25 oldest if the button is clicked manually.

---

## Server Action

Add a new server action.

Suggested function name:

```ts
syncNasdaq100QuoteSnapshotsAction()
```

or:

```ts
syncNasdaq100QuotesBatchAction()
```

Requirements:

1. Load the next 25 active Nasdaq 100 symbols using the batch selection logic.
2. If no symbols are found, return a clear skipped/no-op result.
3. Call Twelve Data batch quote function.
4. Apply safe validation per symbol.
5. Upsert/update `StockQuote`.
6. Persist `SyncRun`.
7. Persist `SyncRunItem` for each requested symbol.
8. Return a user-friendly `SyncActionResult`.
9. Call `router.refresh()` from the client after completion.
10. Do not expose raw provider payloads.
11. Do not expose API keys.

---

## Reuse Existing Quote Sync Logic

Do not duplicate the entire logic from `syncQuotesSampleAction`.

Refactor if needed.

Preferred approach:

Create a shared core helper such as:

```ts
syncQuotesForSymbols({
  symbols,
  type,
  provider,
  sourceLabel,
})
```

Then use it from both:

```ts
syncQuotesSampleAction()
syncNasdaq100QuoteSnapshotsAction()
```

Important:

- Keep existing sample quote sync working.
- Preserve existing result shape.
- Preserve existing safe update behavior.
- Preserve existing SyncRun logging.
- Avoid copy/paste divergence.

If refactoring introduces risk, keep the change small but still avoid unnecessary duplication where practical.

---

## SyncRun / SyncRunItem

Use the persistent logging system from Phase 9D.

### SyncRun

For Nasdaq 100 quote batch:

```txt
type = quotes-nasdaq100-batch
provider = twelve-data
```

Recommended message:

```txt
Synced quote snapshots for next 25 active Nasdaq 100 members using Twelve Data. Selection priority: missing quotes first, then oldest lastSyncedAt.
```

Counts:

```txt
requestedCount = selected symbol count
successCount = successful updates
skippedCount = skipped symbols
failedCount = failed symbols
persisted = true if at least one DB update occurred
status = success / partial_success / failed
```

### SyncRunItem

For each requested symbol, store:

```txt
symbol
status
reason
dbAction
```

Suggested `dbAction` values:

```txt
updated
created
kept_existing
not_found
failed
```

If existing quote rows are always upserted, use clear wording:

```txt
created_quote
updated_quote
kept_existing
not_found
failed
```

Consistency matters more than exact naming.

---

## Admin UI

Update `/admin/sync`.

The page already has tabs. Keep them.

### Sync Actions Tab

Add a new action under the existing sync actions:

```txt
Sync Nasdaq 100 Quote Snapshots — Next 25
```

Suggested helper text:

```txt
Writes to DB. Uses Twelve Data. Selects active Nasdaq 100 members with missing quotes first, then oldest quote sync time. Fixed batch size: 25.
```

Show this near the universe sync and sample sync actions.

Do not put this in the Provider Tests tab.

### In-Progress Panel

The existing in-progress panel should work for this new action.

Add action metadata:

```txt
Action name: Sync Nasdaq 100 Quote Snapshots
Typical duration: around 20–60 seconds for 25 symbols
```

Do not show fake percentage progress.

Do not show fake remaining time.

### Review Results

The existing Review Results panel should display the result of the new action.

It should show:

- requested count
- updated count
- skipped count
- failed count
- symbols updated
- symbols skipped
- symbols failed
- reasons

### Sync History Tab

The new run should appear in Recent Sync Runs.

Expanding it should show symbol-level details.

### Overview Tab

After sync and refresh:

- `Missing Quotes` for Nasdaq 100 should decrease.
- `Stale Quotes` should change based on current stale logic.
- `Last Quote Sync` should update.
- DB Stock Summary should remain stable unless no stock existed, which should not happen because Phase 9E created the Nasdaq 100 stocks.

---

## No UI Route Changes

Do not create new routes.

Keep everything inside:

```txt
/admin/sync
```

Do not add user-facing sync controls to `/scanner`.

---

## Stale Quote Logic

Use the existing Universe Overview stale quote logic.

If needed, keep it simple:

```txt
StockQuote.lastSyncedAt is null or older than 24 hours
```

or:

```txt
older than today
```

Do not over-engineer market-calendar logic in this phase.

---

## API Credit / Rate Safety

Twelve Data free plan is limited.

Rules:

- Fixed 25-symbol batch only.
- No all-at-once Nasdaq 100 sync.
- No automatic loop to run all 100.
- No cron.
- No retry loop.
- No infinite polling.
- Do not call Twelve Data from render paths.
- Do not run multiple quote batch actions concurrently.
- Disable buttons while a sync action is running.

If Twelve Data batch endpoint has a provider-side limit smaller than 25, report it and stop.

Do not silently split into multiple provider requests unless explicitly approved.

---

## Out of Scope

Do not build these in this phase:

```txt
Full Nasdaq 100 quote sync
S&P 500 quote sync
Russell 1000 quote sync
Watchlist quote sync
Active-alert quote sync
Configurable batch size
Cron or scheduled sync
Historical candles
StockCandle table
Technical indicators
Relative volume
Average volume
Scoring
Alert evaluation
News sync
Analyst data sync
Fundamentals sync
Retry failed button
Background jobs
Polling
Queue system
User-facing scanner sync controls
```

---

## Manual QA Checklist

### 1. Automated Checks

Run:

```txt
npm run build
npx tsc --noEmit
npx prisma validate
npx prisma migrate status
```

If a migration is needed, confirm:

- Migration name is clear.
- Migration only touches quote snapshot fields.
- No unrelated schema changes.

---

### 2. Pre-Sync Admin State

Open:

```txt
/admin/sync
```

Go to the Overview tab.

Record:

```txt
Nasdaq 100 Active Members
Missing Quotes
Stale Quotes
Last Quote Sync
Total Stocks in DB
```

Expected before first batch:

```txt
Active Members = 100
Missing Quotes likely high
```

---

### 3. Run Nasdaq 100 Quote Snapshot Batch

Go to the Sync Actions tab.

Click:

```txt
Sync Nasdaq 100 Quote Snapshots — Next 25
```

Expected:

- Button disables.
- Other write action buttons disable.
- In-progress panel appears.
- Elapsed timer updates.
- Indeterminate progress bar appears.
- No fake percentage.
- No fake remaining time.
- Action completes.
- Review Results updates.

---

### 4. Result Verification

Expected:

```txt
requestedCount <= 25
provider = twelve-data
type = quotes-nasdaq100-batch
status = success or partial_success
```

Confirm:

- Updated symbols are listed.
- Skipped symbols have reasons.
- Failed symbols have reasons.
- No API keys are shown.
- No raw provider payloads are shown.

---

### 5. SyncRun Verification

Go to Sync History tab.

Confirm:

- A new row appears.
- Type is `quotes-nasdaq100-batch`.
- Provider is `twelve-data`.
- Counts match Review Results.
- Expanding the row shows symbol-level details.
- `dbAction` values are meaningful.

---

### 6. Overview Verification

Return to Overview tab after sync.

Confirm:

- Nasdaq 100 `Missing Quotes` decreases by successful new quote count.
- `Last Quote Sync` updates.
- `Total Stocks in DB` does not unexpectedly increase.
- Universe membership counts remain unchanged.
- No watchlist or alert counts are affected.

---

### 7. Repeat Run

Run the action again.

Expected:

- It selects the next batch of 25 based on missing quotes / oldest sync.
- It should not repeatedly select the exact same 25 if other Nasdaq 100 symbols are still missing quotes.
- After multiple runs, Missing Quotes should continue decreasing.
- No duplicate StockQuote rows are created.

---

### 8. Idempotency / Duplicate Rows

Verify:

- `StockQuote` remains one row per stock.
- Existing quote rows are updated, not duplicated.
- Re-running after all 100 have quotes updates the 25 oldest, not creates duplicates.

---

### 9. Error / Partial Failure Behavior

If practical, simulate or observe a partial provider issue.

Expected:

- Successful symbols are persisted.
- Failed/skipped symbols keep existing values.
- Run status is `partial_success` if at least one success and at least one issue.
- Run status is `failed` only if no symbols succeed.
- Reasons are visible.

---

### 10. Regression

Confirm:

- Dashboard still loads.
- Scanner still loads.
- Drawer still opens.
- Watchlist actions still work.
- Alert actions still work.
- Provider tests still work.
- Sync Quotes Sample still works.
- Sync Profiles Sample still works.
- Sync Nasdaq 100 Universe still works.
- No provider calls happen during Dashboard render.
- No provider calls happen during Scanner render.

---

## Acceptance Criteria

This phase is complete when:

- Nasdaq 100 quote batch action exists.
- Batch size is fixed at 25.
- Only active Nasdaq 100 members are selected.
- Selection prioritizes missing quotes first.
- Then oldest `lastSyncedAt`.
- Twelve Data is used as provider.
- Quote snapshot fields are safely persisted.
- Existing valid data is not overwritten by invalid provider data.
- `SyncRun` is created with type `quotes-nasdaq100-batch`.
- `SyncRun.provider = twelve-data`.
- `SyncRunItem` rows are created per symbol.
- Admin Review Results shows the run outcome.
- Admin Sync History shows the run.
- Universe Overview updates quote coverage.
- Missing Quotes decreases after successful batches.
- No full Nasdaq 100 sync is added.
- No scoring is added.
- No cron is added.
- No API calls happen from Scanner render.
- Build passes.
- Prisma validates.
- Migration status is clean.

---

## Required Implementation Report

After implementation, return a report in English only with:

1. Files created.
2. Files changed.
3. Whether a Prisma migration was needed.
4. If migration was added, migration name and fields.
5. Current `StockQuote` fields reviewed.
6. Twelve Data quote fields available after normalization.
7. New or refactored helper functions.
8. New server action.
9. Batch selection logic summary.
10. Admin UI changes.
11. SyncRun / SyncRunItem logging summary.
12. Pre-sync quote coverage.
13. Post-sync quote coverage after one run.
14. Repeat-run behavior.
15. API key exposure verification.
16. Regression results.
17. Automated check results.
18. Known issues.
19. Ready for browser QA or not.

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