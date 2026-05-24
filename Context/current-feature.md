# Phase 9J — Resumable Chunked Market Data Sync

## Status

Completed

---

## Goal

Replace the current long-running Nasdaq 100 full market-data sync with a scalable, resumable, chunk-based sync architecture.

The new architecture must support:

```txt
Nasdaq 100 now
Russell 1000 later
Larger universes in the future
```

The process must be highly informative for the Admin user:

- Show real progress.
- Show how many stocks were scanned.
- Show how many succeeded, skipped, and failed.
- Show a progress bar.
- Show current symbol.
- Show elapsed time.
- Show estimated remaining time.
- Show clear success / partial success / failed messages.
- Allow continuing from the middle if the process stops.
- Allow restarting the full sync from scratch if the user wants fresh data for everything.

---

## Why This Change Is Needed

The previous Phase 9J implementation proved that syncing all Nasdaq 100 stocks can work locally.

Manual QA result:

```txt
Requested: 100
Processed: 100
Updated: 100
Failed: 0
Duration: ~385 seconds
```

This is functionally correct for local development, but it is not scalable.

If 100 stocks take around 6.5 minutes, then 1000 stocks may take around:

```txt
60–70 minutes
```

A single long server action is not suitable for that.

Problems with the long-running action approach:

- Risk of request timeout.
- Not suitable for serverless environments.
- Not scalable to 1000+ stocks.
- Hard to resume if interrupted.
- User must keep the request alive.
- Failure in the middle is harder to recover from.
- Progress depends on one long execution.

Therefore, Phase 9J should be rebuilt as a **resumable chunked sync job**.

---

## Core Architecture

Do not run the whole universe sync inside one long server action.

Use a job-style flow:

```txt
User clicks Start
  ↓
Create SyncRun in DB
  ↓
UI repeatedly calls Process Next Chunk
  ↓
Each chunk processes a small number of stocks
  ↓
Progress is saved after every symbol
  ↓
UI polls progress from DB
  ↓
If interrupted, the run can be resumed
```

---

## Main User Workflow

The Sync Actions tab should show this clean workflow:

```txt
1. Sync Nasdaq 100 Universe
2. Sync All Nasdaq 100 Market Data
3. Calculate Fundamental Scores
```

The market-data action should be informative and resumable.

---

## Buttons

### Keep

Keep:

```txt
Sync Nasdaq 100 Universe
Sync All Nasdaq 100 Market Data
Calculate Fundamental Scores
```

### Remove From UI

Do not show old buttons:

```txt
Sync Nasdaq 100 Quotes + Metrics — Next 25
Sync Nasdaq 100 Quote Snapshots — Next 25
```

No old market-data buttons should remain visible.

### Market Data Buttons

The market-data section should support these user actions:

#### Start New Sync

```txt
Start Full Market Data Sync
```

or:

```txt
Sync All Nasdaq 100 Market Data
```

Creates a new SyncRun and begins processing from the first active stock.

#### Continue Sync

```txt
Continue Sync
```

Visible when there is an existing incomplete sync run.

Continues from where the previous run stopped.

#### Restart Full Sync

```txt
Restart Full Sync
```

Visible when a completed or incomplete sync exists.

Starts a new run from the beginning, refreshing all active stocks again.

This should be explicit so the user understands it will rescan all stocks.

Recommended confirmation text:

```txt
This will start a new full sync for all active Nasdaq 100 stocks. Existing quote and metric rows will be updated safely. Continue?
```

Do not delete existing StockQuote or StockMetric rows before restarting.

Restart means:

```txt
Create new SyncRun
Process all active stocks again
Upsert fresh quote + metric data
```

---

## SyncRun Lifecycle

### 1. queued

A SyncRun has been created but not yet processed.

### 2. running

A SyncRun is actively being processed by chunks.

### 3. paused / interrupted

Processing stopped before completion.

This may happen because:

- User closed the page.
- Request failed.
- Rate limit occurred.
- Server timeout.
- Manual stop in a future phase.

If no explicit `paused` status exists, use `partial_success` or another existing status carefully, but the UI must be able to identify an incomplete run.

### 4. success

All target stocks were processed successfully.

### 5. partial_success

Some stocks succeeded but some were skipped/failed, or the run stopped before all targets were processed.

### 6. failed

No stocks were successfully processed.

---

## DB Requirements

Use the existing `SyncRun` and `SyncRunItem` models where possible.

Existing or recently added progress fields:

```txt
requestedCount
processedCount
successCount
skippedCount
failedCount
currentSymbol
status
startedAt
finishedAt
durationMs
message
persisted
```

If missing, add only minimal fields.

Potential additional fields if needed:

```txt
chunkSize
universeSlug
syncScope
lastProcessedSymbol
```

Only add them if implementation genuinely needs them.

Avoid unnecessary schema complexity.

---

## SyncRun Type

Use:

```txt
market-data-universe-chunked-sync
```

or, if keeping it specific for this phase:

```txt
market-data-nasdaq100-chunked-sync
```

Recommended for future scalability:

```txt
market-data-universe-chunked-sync
```

with metadata/message indicating:

```txt
universeSlug = nasdaq-100
```

If adding `universeSlug` to SyncRun is too much for this phase, use the type:

```txt
market-data-nasdaq100-chunked-sync
```

Provider:

```txt
finnhub
```

---

## Target Universe

For this phase, the UI should sync:

```txt
Nasdaq 100
```

Select all active Nasdaq 100 stocks from DB:

```txt
StockUniverseMember.isActive = true
universe.slug = "nasdaq-100"
```

Do not hardcode 100.

Use DB count.

Future phases can reuse the same architecture for:

```txt
S&P 500
Russell 1000
Custom watchlist
All active stocks
```

---

## Chunk Size

Use a small controlled chunk.

Recommended:

```txt
10 stocks per chunk
```

Each stock requires:

```txt
1 Finnhub quote call
1 Finnhub metrics call
```

So each chunk is:

```txt
10 stocks × 2 calls = 20 Finnhub calls
```

This is safer than 100 stocks in one request.

Expected chunk duration:

```txt
20–40 seconds
```

depending on API and DB latency.

If this still risks timeout, reduce chunk size to:

```txt
5 stocks
```

Do not process all 100 or 1000 in one request.

---

## Rate Limit Strategy

Finnhub free plan:

```txt
60 calls/minute
```

Use call-start pacing, not sleep-after-call.

### Correct pacing

Track the time each Finnhub call starts.

Before each Finnhub call:

```txt
elapsed = now - lastFinnhubCallStartedAt
if elapsed < 1100ms:
  wait 1100ms - elapsed
start call
set lastFinnhubCallStartedAt = now
```

Do not add a fixed delay after each call.

This avoids unnecessary runtime while keeping calls under the rate limit.

Target:

```txt
~54 calls/minute
```

---

## 429 Handling

If Finnhub returns 429:

1. Preserve already successful updates.
2. Persist current progress.
3. Show clear message:
   ```txt
   Finnhub rate limit reached. You can continue the sync after waiting.
   ```
4. Stop the current chunk safely.
5. Mark the SyncRun as incomplete / partial.
6. Show a `Continue Sync` button.

Do not wait forever.

Do not use infinite retry.

For this scalable architecture, it is better to stop safely and let the user continue.

---

## Processing Logic

### Start New Sync

When user clicks:

```txt
Start Full Market Data Sync
```

Do:

1. Load all active Nasdaq 100 symbols.
2. Create new SyncRun.
3. Set:
   ```txt
   requestedCount = number of active symbols
   processedCount = 0
   successCount = 0
   skippedCount = 0
   failedCount = 0
   status = running
   currentSymbol = null
   ```
4. Begin chunk processing.

### Process Next Chunk

For the current SyncRun:

1. Determine which symbols have not yet been processed for this run.
2. Select next `chunkSize` symbols.
3. For each symbol:
   - Set `currentSymbol`.
   - Fetch quote.
   - Fetch metrics.
   - Upsert StockQuote.
   - Upsert StockMetric.
   - Create SyncRunItem.
   - Update processed/success/skipped/failed counts.
4. If no more symbols:
   - Mark SyncRun success / partial_success / failed.
5. If chunk completes but symbols remain:
   - Leave status as running.
   - UI should call next chunk automatically or show Continue.

### Continue Sync

When user clicks:

```txt
Continue Sync
```

Do:

1. Use the latest incomplete SyncRun.
2. Process next chunk.
3. Continue from unprocessed symbols.
4. Do not start from the beginning.
5. Do not duplicate SyncRunItems for already processed symbols.

### Restart Full Sync

When user clicks:

```txt
Restart Full Sync
```

Do:

1. Create a new SyncRun.
2. Target all active stocks again.
3. Upsert fresh quote and metric data.
4. Previous SyncRun remains in history.

---

## How To Know Which Symbols Are Already Processed

Use `SyncRunItem`.

For a given SyncRun:

```txt
processed symbols = SyncRunItem.symbol values for that syncRunId
```

Unprocessed symbols:

```txt
active universe symbols - processed symbols
```

This is more reliable than using `processedCount` alone.

`processedCount` is for display.

`SyncRunItem` is the source of truth for resume.

---

## UI Progress Requirements

The progress panel must be informative.

During running state, show:

```txt
Sync in progress
Sync All Nasdaq 100 Market Data

Current symbol: AAPL
Processed: 17 / 100
Succeeded: 16
Skipped: 1
Failed: 0
Progress: 17%
Elapsed time: 01:42
Estimated time remaining: 08:10
Current chunk size: 10
```

### Progress Bar

Use real progress:

```txt
processedCount / requestedCount * 100
```

### Estimated Remaining Time

Estimate from actual speed.

Formula:

```txt
elapsedMs = now - startedAt
processed = processedCount
remaining = requestedCount - processedCount

avgMsPerStock = elapsedMs / max(processed, 1)
estimatedRemainingMs = remaining * avgMsPerStock
```

Display only after at least a few stocks are processed.

Before enough data:

```txt
Estimating...
```

Do not show fake ETA.

Use real observed progress.

---

## UI Status Messages

### Running

```txt
Sync is running. Please keep this page open.
```

### Completed successfully

```txt
Success — all 100 stocks were synced.
```

or DB-based:

```txt
Success — all X stocks were synced.
```

### Partial / interrupted

```txt
Sync stopped before completion.
Processed X / Y stocks.
You can continue from where it stopped.
```

Show button:

```txt
Continue Sync
```

### Failed

```txt
Sync failed before any stock was updated.
You can restart the full sync.
```

Show button:

```txt
Restart Full Sync
```

### Rate limit

```txt
Finnhub rate limit reached.
Processed X / Y stocks.
Wait a moment, then continue the sync.
```

Show:

```txt
Continue Sync
Restart Full Sync
```

---

## Auto-Continue vs Manual Continue

Preferred for this phase:

```txt
Auto-process chunks while the page stays open.
```

Flow:

1. User clicks Start.
2. UI calls process-next-chunk.
3. When chunk completes, UI checks if run is still running.
4. If symbols remain, UI calls process-next-chunk again.
5. Progress polling continues.
6. If an error or rate limit occurs, auto-processing stops and user sees Continue.

This avoids one long request while still giving a one-click experience.

If auto-processing is too risky, manual Continue is acceptable, but the user specifically wants a smooth informative process, so auto-processing is preferred.

---

## Polling

Use a lightweight API route or loader to fetch progress.

Recommended:

```txt
GET /api/admin/sync-runs/latest?type=market-data-nasdaq100-chunked-sync
```

or updated equivalent.

Poll every:

```txt
2 seconds
```

Stop polling when:

```txt
status is success / partial_success / failed
```

Keep polling while:

```txt
status = running
```

---

## Process Next Chunk API

Add or update an endpoint/action:

```txt
POST /api/admin/sync-runs/process-next
```

or a server action if it does not block progress polling.

Given previous QA, API route is preferred for progress operations because server action polling can be blocked behind long-running actions.

The endpoint should:

- Process only one chunk.
- Return current progress.
- Never expose API keys.
- Never return raw provider payloads.
- Respect rate limits.
- Be idempotent as much as possible.

---

## Start / Restart API

Add or update endpoint/action:

```txt
POST /api/admin/sync-runs/start
```

or an equivalent server action.

It should support:

```txt
mode = start
mode = restart
universeSlug = nasdaq-100
```

If server action is used, it must not perform the full sync. It should only create the SyncRun.

---

## Concurrency Rules

Do not allow multiple active market-data syncs for the same universe.

Before starting:

1. Check if a running/incomplete SyncRun exists.
2. If yes:
   - Show Continue Sync.
   - Do not start another one unless user chooses Restart.
3. If Restart:
   - Mark old run as partial/interrupted if needed.
   - Create new run.

The UI should clearly show:

```txt
A sync is already in progress.
Continue it or restart from the beginning.
```

---

## Data Safety

Do not delete existing data during sync.

Use safe upsert behavior.

Rules:

- Do not overwrite valid quote values with invalid provider data.
- Do not overwrite valid metric values with invalid provider data.
- If one provider call fails for a symbol, preserve existing data.
- If quote succeeds but metrics fails, save quote and mark partial.
- If metrics succeeds but quote fails, save metrics and mark partial.
- Create a SyncRunItem for every processed symbol.

---

## Review Results

After completion, show:

```txt
Success / Partial Success / Failed
Requested
Processed
Succeeded
Skipped
Failed
Duration
Persisted
Message
```

Symbol details should show per-symbol reason.

Example:

```txt
AAPL — updated_quote_updated_metrics — Quote updated, Metrics updated
MSFT — partial_update — Quote updated, Metrics skipped
```

---

## Sync History

Sync History should show the chunked sync run.

Columns should show:

- type
- provider
- status
- requested
- processed if available
- updated/success
- skipped
- failed
- persisted

Expanding the row should show per-symbol details.

---

## Data Inventory

No major redesign needed.

After sync:

- Quote Last Synced updates.
- Metrics Last Synced updates.
- Metrics Source remains Finnhub.
- Has Metrics remains accurate.

---

## Score Calculation

Do not automatically calculate scores after market data sync.

After market data sync completes, show a reminder:

```txt
Market data sync completed. Run Calculate Fundamental Scores to refresh scores.
```

---

## No Scanner Changes

Do not change Scanner in this phase.

---

## UX Copy Requirements

The market-data section should explain:

```txt
This sync updates quote snapshots and basic financial metrics for all active Nasdaq 100 stocks.
The process runs in small chunks so it can handle larger universes later.
Progress is saved after each stock.
If the process stops, you can continue from where it stopped.
Use Restart Full Sync if you want to rescan all stocks from the beginning.
```

Show key numbers:

```txt
Active stocks: X
Estimated Finnhub calls: X * 2
Chunk size: 10
Rate limit: paced below 60 calls/minute
```

---

## Timeout / Deployment Note

This chunked architecture is designed to avoid long single-request timeouts.

Still document:

```txt
Each chunk must complete within deployment request limits.
If chunk duration is too long, reduce chunk size.
For large universes, this design can be extended into a true background worker or scheduled job.
```

---

## Browser QA Checklist

### Initial UI

Open:

```txt
/admin/sync → Sync Actions
```

Confirm:

1. Old Next 25 buttons are absent.
2. Sync All Nasdaq 100 Market Data is visible.
3. Explanation text is clear.
4. Active stock count is shown.
5. Estimated calls are shown.
6. Chunk size is shown.
7. Continue / Restart controls appear only when relevant.

### Start Full Sync

Click:

```txt
Sync All Nasdaq 100 Market Data
```

Confirm:

1. SyncRun is created.
2. Progress panel appears.
3. Progress bar starts at 0%.
4. Current symbol appears.
5. Processed / total updates.
6. Succeeded/skipped/failed updates.
7. ETA appears after some progress.
8. UI continues chunk-by-chunk without one long blocking request.
9. Buttons are disabled or changed appropriately while running.

### Continue Sync

Simulate interruption if practical:

1. Stop the process or reload page mid-run.
2. Return to Sync Actions.
3. UI shows incomplete sync.
4. Continue Sync button appears.
5. Clicking Continue resumes from unprocessed symbols.
6. Already processed symbols are not duplicated.

### Restart Full Sync

Click:

```txt
Restart Full Sync
```

Confirm:

1. New SyncRun is created.
2. Previous run remains in history.
3. New run starts from all active stocks again.
4. Existing StockQuote and StockMetric rows are updated safely, not duplicated.

### Completion

After run completes:

1. Status is success if all stocks processed.
2. Processed equals requested.
3. Progress reaches 100%.
4. Clear success message appears.
5. Review Results shows final counts.
6. Sync History records the run.
7. Data Inventory timestamps update.

### Rate Limit

If 429 occurs:

1. Sync stops safely or pauses.
2. Progress is persisted.
3. Message explains rate limit.
4. Continue Sync is available.
5. No successful data is lost.

### Duplicate Checks

Confirm:

- No duplicate StockQuote rows.
- No duplicate StockMetric rows.
- No duplicate SyncRunItem rows for the same symbol in the same run.

### Regression

Confirm:

- Universe Sync works.
- Calculate Fundamental Scores works.
- Provider Tests work.
- Sample DB Writes work.
- Data Inventory works.
- Score Methodology works.
- Dashboard loads.
- Scanner loads.
- No external provider calls happen from Scanner render.

---

## Validation

Run:

```txt
npm run build
npx tsc --noEmit
npx prisma validate
npx prisma migrate status
```

---

## Required Implementation Report

Return a concise report in English only with:

1. Files created.
2. Files changed.
3. Migration name and fields, if any.
4. Old buttons removed.
5. New start/continue/restart behavior.
6. Chunk size.
7. Rate-limit strategy.
8. Progress tracking implementation.
9. ETA calculation.
10. Polling implementation.
11. API routes/server actions added.
12. Resume logic.
13. Restart logic.
14. SyncRun / SyncRunItem usage.
15. Full sync QA result.
16. Continue QA result.
17. Restart QA result.
18. Runtime per chunk.
19. Duplicate row verification.
20. Automated check results.
21. Known issues.
22. Ready for commit or not.

---

## Acceptance Criteria

Phase 9J is complete when:

- The old `Next 25` market-data buttons are gone from the UI.
- There is one clear market-data sync flow.
- The sync runs in chunks, not as one long request.
- The process can continue after interruption.
- The user can restart the full sync from the beginning.
- Progress is informative and DB-backed.
- Progress includes:
  - current symbol
  - processed / total
  - succeeded / skipped / failed
  - elapsed time
  - estimated remaining time
  - progress bar
- Clear success/partial/failure messages are shown.
- Rate limits are handled safely.
- No duplicate quote/metric rows are created.
- Score calculation remains a separate explicit step.
- Scanner is unchanged.
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
- Phase 9J completed (2026-05-24): Resumable Chunked Market Data Sync. Replaced the old long-running Nasdaq 100 full sync (single server action, ~385s) with a scalable chunk-based architecture. Added `processedCount` and `currentSymbol` to `SyncRun` via migration `20260524061553_add_sync_run_progress_fields`. Created three new API routes: `POST /api/admin/sync-runs/start` (creates or restarts SyncRun), `POST /api/admin/sync-runs/process-next` (processes one chunk of 10 stocks), `GET /api/admin/sync-runs/latest` (polling endpoint, updated type). Removed old `syncNasdaq100MarketDataAction` batch server action and all old Next 25 buttons from the UI. Chunk size: 10 stocks per chunk (20 Finnhub calls). Rate-limit strategy: call-start pacing — ≥1100ms between Finnhub call starts (~54 calls/minute). Resume logic: `SyncRunItem` rows for the active `syncRunId` are the source of truth; unprocessed = all active symbols minus already-itemised symbols. Restart creates a new `SyncRun`; previous run remains in history. Auto-continue loop: UI calls `process-next` sequentially while `status === "running"` and `!done`; 2-second polling via `/latest` runs in parallel. ETA: `avgMsPerStock = elapsedMs / processedCount`; shows "Estimating…" until processedCount ≥ 2. Paused state UX: dedicated `PausedSyncPanel` shows paused-at timestamp (`finishedAt`), reason (`message` or fallback), last symbol, processed/total counts, amber progress bar, and guidance text. Rate limit message: "Finnhub rate limit reached. Continue the sync after waiting." Restart message: "Restarted by user before completion." No duplicate `StockQuote`, `StockMetric`, or `SyncRunItem` rows. Score calculation remains a separate explicit step. Scanner unchanged. Build passes, `tsc --noEmit` zero errors, `prisma validate` valid, `prisma generate` run to refresh client types. Approved by user.