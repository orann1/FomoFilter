# Current Feature

## Feature Name

Phase 9D — Persistent Sync Logs for Manual Market Data Sync

## Status

Completed

---

## Feature Reference

This feature continues the Market Data Sync roadmap.

Read these documents before implementation:

```txt
Context/Features/market-data-sync-strategy.md
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

Add persistent sync logging for manual market-data sync actions.

The goal is to make every sync auditable after page refresh, browser close, or later debugging.

After this phase, `/admin/sync` should not only show the latest in-memory result. It should also show recent persisted sync runs and symbol-level results.

This phase prepares the system for controlled quote batches in the next phase.

---

## Why This Phase Matters

Manual sync already supports:

- Provider tests
- Quote sample sync
- Profile sample sync
- Safe update behavior
- Partial success handling
- Detailed in-page result reporting

But the current result is temporary. Once the page refreshes, the sync history is lost.

Before expanding from 5-symbol samples to larger batches, the system needs persistent logs.

Important questions this phase should answer after every sync:

```txt
What sync ran?
When did it run?
Which provider was used?
How many symbols were requested?
How many succeeded?
How many were skipped?
How many failed?
Which symbols failed?
Why did they fail?
Were DB values updated or kept?
Can I safely run the sync again?
```

---

## Core Rules

### Rule 1 — Keep Successful Updates

If a sync updates some symbols and then later symbols fail, keep the successful updates.

Do not roll back the whole sync.

Each symbol update should remain atomic.

---

### Rule 2 — Persist the Sync Result

Every sample sync action that writes or attempts to write DB data must create a persisted sync log.

This includes:

- `Sync Quotes Sample`
- `Sync Profiles Sample`

Provider test buttons may optionally log, but they are not required in this phase because they do not write to DB.

---

### Rule 3 — Never Hide Partial Failure

If one symbol fails or is skipped, the run must not be shown as full success.

Use:

```txt
partial_success
```

when some symbols succeed and others fail/skip.

---

### Rule 4 — Keep Existing DB Values on Failure

If a provider returns bad data, empty data, or an error:

- Do not overwrite existing DB values.
- Log the symbol as skipped or failed.
- Store the reason.
- Store `dbAction = kept_existing`.

---

### Rule 5 — Do Not Build More Sync Scope Yet

This phase is about logging, not expanding sync coverage.

Do not add:

- Full Russell 1000 sync
- Watchlist sync
- Active alerts sync
- Cron
- Scoring
- Alert evaluation
- Historical candle sync
- Fundamentals sync beyond the existing profile sample behavior

---

## Build in This Phase

### 1. Add SyncRun Model

Add a Prisma model to persist the overall sync run.

Suggested model:

```prisma
model SyncRun {
  id             String        @id @default(cuid())
  type           String
  provider       String
  status         String
  requestedCount Int
  successCount   Int
  skippedCount   Int
  failedCount    Int
  persisted      Boolean       @default(false)
  message        String?
  startedAt      DateTime
  finishedAt     DateTime?
  durationMs     Int?
  createdAt      DateTime      @default(now())
  items          SyncRunItem[]

  @@index([type])
  @@index([provider])
  @@index([status])
  @@index([startedAt])
}
```

Allowed statuses:

```txt
success
partial_success
failed
```

Allowed types should match existing actions:

```txt
quotes-sample
profiles-sample
```

Optional provider test types can be added later.

---

### 2. Add SyncRunItem Model

Add a Prisma model to persist symbol-level results.

Suggested model:

```prisma
model SyncRunItem {
  id        String   @id @default(cuid())
  syncRunId String
  syncRun   SyncRun @relation(fields: [syncRunId], references: [id], onDelete: Cascade)

  symbol    String
  status    String
  reason    String?
  dbAction  String
  createdAt DateTime @default(now())

  @@index([syncRunId])
  @@index([symbol])
  @@index([status])
}
```

Allowed item statuses:

```txt
success
skipped
failed
```

Allowed `dbAction` values:

```txt
updated
kept_existing
not_found
none
```

---

### 3. Create Migration

Use Prisma migration only.

Suggested command:

```txt
npx prisma migrate dev --name add-sync-run-logs
```

Do not use:

```txt
prisma db push
```

---

### 4. Persist Sync Logs from Server Actions

Update existing sync server actions in:

```txt
src/actions/market-data-actions.ts
```

When `Sync Quotes Sample` or `Sync Profiles Sample` finishes, persist:

1. One `SyncRun`
2. One `SyncRunItem` per symbol result

The persisted values should match the in-page result.

Important:

- If the whole provider batch request fails before symbol processing starts, create a `SyncRun` with status `failed`.
- If symbol processing is partial, create `SyncRun` with status `partial_success`.
- If all symbols succeed, create `SyncRun` with status `success`.

---

### 5. Keep Current Result UI

Do not remove the current last-result panel.

The immediate result after button click is still useful.

Keep:

```txt
Step 4 — Review Results
```

or if it has not yet been renamed, rename:

```txt
Step 4 — Last Result
```

to:

```txt
Step 4 — Review Results
```

---

### 6. Add Recent Sync Runs UI

Add a new section to `/admin/sync`:

```txt
Recent Sync Runs
```

Place it below the current result viewer.

Show the latest 10 sync runs.

Suggested table columns:

| Time | Type | Provider | Status | Requested | Updated | Skipped | Failed | Persisted |
| --- | --- | --- | --- | ---: | ---: | ---: | ---: | --- |

Use clear visual badges:

- green for `success`
- amber for `partial_success`
- red for `failed`

---

### 7. Add Symbol-Level Details

For each recent sync run, allow viewing symbol-level details.

Acceptable UI options:

1. Expand/collapse row
2. Details panel under selected run
3. Simple nested list under each run card

Show:

| Symbol | Status | Reason | DB Action |
| --- | --- | --- | --- |

Examples:

```txt
NVDA — success — Quote updated — updated
SMCI — skipped — Missing price — kept_existing
PLTR — failed — Provider timeout — kept_existing
```

---

### 8. Server Data Loader

Create or update a server-side data loader for recent sync runs.

Suggested file:

```txt
src/lib/data/admin-sync.ts
```

Suggested function:

```ts
getRecentSyncRuns(limit = 10)
```

Requirements:

- Server-side only.
- Query latest sync runs.
- Include items.
- Do not expose secrets.
- Sort newest first.

---

### 9. Refresh After Sync

After running a sync action:

- The immediate result viewer should update.
- The recent sync runs list should also reflect the new run.

Implementation options:

- Use `router.refresh()` after action success.
- Or return the persisted run and update local state.

Prefer the approach that fits the existing code style.

---

## Data Retention

No retention cleanup is required in this phase.

Future cleanup can delete old sync logs after a configured period.

Do not build cleanup jobs now.

---

## What Should Be Logged

### For SyncRun

Log:

- type
- provider
- status
- requestedCount
- successCount
- skippedCount
- failedCount
- persisted
- message
- startedAt
- finishedAt
- durationMs

### For SyncRunItem

Log:

- symbol
- status
- reason
- dbAction

Do not log:

- API keys
- full raw provider payloads
- URLs containing API keys
- secrets
- unnecessary large JSON responses

---

## Security / Safety

- Do not expose API keys in sync logs.
- Do not store full provider response payloads.
- Do not store sanitized URLs unless clearly safe.
- Do not make `/admin/sync` public-user ready.
- Do not add auth in this phase.
- Keep `NEXT_PUBLIC_SHOW_ADMIN_TOOLS=true` gating for sidebar visibility.

---

## Out of Scope

Do not build these in this phase:

- Full quote batch sync
- Watchlist quote sync
- Active-alert quote sync
- Russell 1000 sync
- Retry failed button
- Cron / scheduled jobs
- Queue system
- Alert evaluation
- Score recalculation
- Historical candle sync
- News persistence
- Fundamentals sync beyond current profile sample
- Admin authentication
- Provider cost dashboard

---

## Manual QA Checklist

### Migration / Schema

Run:

```txt
npx prisma validate
npx prisma migrate status
```

Confirm:

- New migration exists.
- Database is up to date.
- No unrelated schema changes were made.

---

### Sync Quotes Sample Logging

Run:

```txt
Sync Quotes Sample
```

Expected:

- Current result panel shows the sync result.
- Recent Sync Runs list gets a new row.
- Row shows correct type: `quotes-sample`.
- Provider: `twelve-data`.
- Requested / updated / skipped / failed counts match the result panel.
- Symbol-level details show all requested symbols.
- Successful symbols show `dbAction = updated`.
- No duplicate `StockQuote` rows are created.

---

### Sync Profiles Sample Logging

Run:

```txt
Sync Profiles Sample
```

Expected:

- Current result panel shows the sync result.
- Recent Sync Runs list gets a new row.
- Row shows correct type: `profiles-sample`.
- Provider: `fmp`.
- Requested / updated / skipped / failed counts match the result panel.
- Symbol-level details show all requested symbols.
- Successful symbols show `dbAction = updated`.
- Failed/skipped symbols show clear reasons.
- Existing DB values remain protected by safe update rules.

---

### Partial Failure Logging

If practical, simulate a partial failure.

Expected:

- SyncRun status is `partial_success`.
- Successful symbols are logged as `success`.
- Failed/skipped symbols are logged correctly.
- Reasons are persisted.
- DB actions are correct.
- Current result and recent history match.

---

### Failed Run Logging

If practical, temporarily test missing provider key or invalid provider behavior.

Expected:

- SyncRun status is `failed` if no symbols succeed.
- Failure reason is clear.
- No DB values are overwritten.
- Log does not contain API keys.

---

### Page Refresh Behavior

After running a sync:

1. Refresh `/admin/sync`.
2. Confirm recent sync runs are still visible.
3. Confirm symbol-level details are still available.

This is the main acceptance check for persistent logs.

---

### Regression

Confirm:

- Dashboard still loads.
- Scanner still loads.
- Drawer still works.
- Add/Edit/Remove Watchlist still works.
- Create Alert still works.
- Admin Sync sidebar item still works.
- No provider calls happen during Dashboard or Scanner render.

---

## Validation Commands

Run:

```txt
npm run build
npx tsc --noEmit
npx prisma validate
npx prisma migrate status
```

If migration is added:

```txt
npx prisma migrate dev --name add-sync-run-logs
```

Do not use `db push`.

---

## Acceptance Criteria

This phase is complete when:

- `SyncRun` model exists.
- `SyncRunItem` model exists.
- Prisma migration is created and applied.
- Quote sample sync persists a `SyncRun`.
- Quote sample sync persists `SyncRunItem` rows.
- Profile sample sync persists a `SyncRun`.
- Profile sample sync persists `SyncRunItem` rows.
- `/admin/sync` shows recent sync runs after page refresh.
- Symbol-level details are visible.
- Counts match between immediate result and persisted log.
- Partial failures are logged as `partial_success`.
- Failed runs are logged as `failed`.
- No API keys or raw sensitive payloads are stored.
- Safe update behavior remains unchanged.
- No full sync or cron is added.
- Build passes.
- Prisma validation passes.
- Migration status is clean.

---

## Required Implementation Report

After implementation, provide:

1. Files created.
2. Files changed.
3. Prisma schema changes.
4. Migration name.
5. SyncRun fields implemented.
6. SyncRunItem fields implemented.
7. Which actions now persist logs.
8. Recent Sync Runs UI summary.
9. Symbol-level details UI summary.
10. QA result for quote sample sync.
11. QA result for profile sample sync.
12. Page refresh persistence result.
13. Build / Prisma validation results.
14. Known issues.
15. Whether ready for browser QA.

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