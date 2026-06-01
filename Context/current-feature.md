# Phase 15 — Quota-Safe Analyst Target Discovery Sync

## Status

Completed

---

## Goal

Build a quota-safe and resumable analyst target discovery process.

The purpose is to gradually improve analyst target price coverage without relying on a paid provider upgrade yet.

This phase should add a special Admin sync flow that attempts to discover analyst target prices using the currently available provider access, while respecting quota limits and storing progress over multiple days.

This phase does **not** change Opportunity Score.

---

## Why This Phase Is Needed

Phase 14 added analyst data using:

```txt
FMP price target data
Finnhub recommendation counts
```

Final Phase 14 coverage:

```txt
Analyst rating/count coverage: 100 / 100
Target price coverage: 16 / 100
```

The low target price coverage creates a problem:

```txt
Analyst Upside cannot be used in Opportunity Score yet,
because most stocks do not have target price data.
```

However, target price data does not change daily. It can be discovered gradually.

The user is willing to scan target data over multiple days or weeks if needed.

Therefore, Phase 15 should create a controlled discovery workflow:

```txt
Try to find missing analyst targets gradually.
Stop safely when quota is reached.
Continue from where it stopped on the next day.
Track which symbols were checked, found, empty, failed, or quota-blocked.
```

---

## Key Product Decision

Do **not** blindly scan exactly 16 stocks per day.

Instead, implement a smarter quota-safe discovery process.

The process should stop based on:

```txt
max attempts per run
max targets found per run
provider quota / 429
no more eligible symbols
```

Recommended defaults:

```txt
maxAttemptsPerRun = 40
maxTargetsFoundPerRun = 16
chunkSize = 10
```

This is better than scanning exactly 16 symbols because many symbols may return no target data.

---

## Scope

Phase 15 includes:

1. Admin button for quota-safe target discovery.
2. FMP target-only discovery flow.
3. DB-backed progress tracking.
4. Continue next day from unprocessed/eligible symbols.
5. Restart discovery cycle.
6. Target discovery status per stock.
7. Data Inventory visibility.
8. Dashboard/Scanner continue to display target data already discovered.
9. No Opportunity Score changes.

---

## Non-Scope

Do not build:

- Analyst Sentiment Score.
- Opportunity Score v2.
- Technical/momentum data.
- News/catalyst data.
- Yahoo Finance integration.
- New provider package installation.
- Paid provider integration.
- Automatic daily cron.
- External calls from Scanner/Dashboard.
- Changes to Fundamental Score or Opportunity Score formulas.

---

# 1. Provider Decision

Use FMP target endpoint only for this phase.

Current Phase 14 selected:

```txt
FMP /stable/price-target-summary
```

for price target data.

Finnhub recommendation data is already working and should remain unchanged.

Do not re-sync Finnhub recommendations in this phase unless the existing analyst sync requires it. This phase is specifically about target discovery.

---

## Why Not Yahoo Now

Yahoo was tested and found unreliable in the current server-side environment.

Observed issues:

```txt
401 Invalid Crumb
Requires browser-like cookie/session handling
Requires yahoo-finance2 or equivalent package
No official SLA
Fragile auth flow
```

So Yahoo should not be added in this phase.

---

## Why Not Analyst Upside Score Yet

Current target coverage is too low:

```txt
16 / 100
```

Until target coverage reaches an acceptable threshold, analyst target/upside should remain display-only.

Recommended threshold before scoring:

```txt
>= 60% minimum
>= 80% preferred
```

---

# 2. New Admin Action

Add a new button:

```txt
Sync Analyst Targets — Quota Safe
```

Location:

```txt
/admin/sync → Sync Actions → Analyst Data Sync
```

or inside a separate subsection:

```txt
Analyst Target Discovery
```

Helper text:

```txt
Attempts to discover missing analyst target prices using a conservative request budget. Stops safely when the provider quota is reached and can continue later.
```

Important note:

```txt
This does not change Opportunity Score. Target data remains display-only until coverage is high enough.
```

---

## Button States

The UI should support:

```txt
Start Target Discovery
Continue Target Discovery
Restart Target Discovery Cycle
```

### Start Target Discovery

Creates a new discovery SyncRun.

### Continue Target Discovery

Continues an incomplete discovery run or starts from eligible remaining symbols.

### Restart Target Discovery Cycle

Starts a fresh cycle from the beginning without deleting existing analyst data.

Confirmation message:

```txt
This will start a new target discovery cycle. Existing target data will be updated safely where new data is found. Continue?
```

---

# 3. SyncRun Type

Use a dedicated SyncRun type:

```txt
analyst-target-discovery-sync
```

Provider:

```txt
fmp
```

Do not reuse the Phase 14 full analyst sync type if it exists.

Reason:

```txt
Phase 14 = full analyst sync: ratings + target where available
Phase 15 = target discovery only, quota-safe, multi-day
```

---

# 4. Target Discovery Status

Add discovery tracking fields.

Preferred location:

```txt
StockAnalystData
```

Recommended fields:

```prisma
targetStatus String?
targetLastAttemptedAt DateTime?
targetLastFoundAt DateTime?
targetNextRetryAt DateTime?
targetAttemptCount Int @default(0)
targetLastMessage String?
```

Possible `targetStatus` values:

```txt
not_checked
has_target
no_target_available
provider_error
quota_blocked
stale_target
```

If `StockAnalystData` may not exist yet for a stock, create one with null target fields and discovery status when attempting.

---

## Status Meaning

### not_checked

No target discovery attempt has been made yet.

### has_target

Provider returned usable target data.

### no_target_available

Provider returned a valid response but no target data, for example:

```txt
[]
```

### provider_error

Provider returned an error that is not quota-related.

### quota_blocked

Run stopped due to quota/429.

### stale_target

Existing target is older than refresh threshold and eligible for refresh.

---

# 5. Retry / Cooldown Rules

Target data does not change daily, so avoid wasteful repeated checks.

Recommended cooldowns:

| Status | Retry Rule |
| --- | --- |
| has_target | refresh after 14 days |
| no_target_available | retry after 30 days |
| provider_error | retry after 1 day |
| quota_blocked | retry next day |
| not_checked | eligible immediately |

These are defaults and can be constants in code.

---

# 6. Eligible Symbol Selection

The discovery run should select active Nasdaq 100 stocks.

Base universe:

```txt
StockUniverseMember.isActive = true
universe.slug = "nasdaq-100"
```

Then prioritize eligible symbols:

1. `not_checked` or no `StockAnalystData`.
2. `provider_error` where `targetNextRetryAt <= now`.
3. existing target older than 14 days.
4. `no_target_available` where `targetNextRetryAt <= now`.

Do not repeatedly scan symbols with recent `no_target_available`.

---

## Source of Truth for Run Progress

Use both:

```txt
SyncRunItem
StockAnalystData targetStatus fields
```

For a specific SyncRun:

```txt
processed symbols = SyncRunItem.symbol for this run
```

For cross-day discovery state:

```txt
StockAnalystData.targetStatus
targetLastAttemptedAt
targetNextRetryAt
```

---

# 7. Run Limits

Use conservative run limits.

Recommended constants:

```txt
MAX_ATTEMPTS_PER_RUN = 40
MAX_TARGETS_FOUND_PER_RUN = 16
CHUNK_SIZE = 10
```

A run should stop when any of these happens:

```txt
attempted >= MAX_ATTEMPTS_PER_RUN
targetsFound >= MAX_TARGETS_FOUND_PER_RUN
provider quota / 429 reached
no eligible symbols left
```

---

# 8. Processing Logic

For each symbol:

1. Mark current symbol in SyncRun.
2. Call FMP target endpoint.
3. If target data returned:
   - update target fields.
   - calculate analystUpsidePercent using current StockQuote.price.
   - set targetStatus = `has_target`.
   - set targetLastFoundAt = now.
   - set targetNextRetryAt = now + 14 days.
   - increment targetsFound.
4. If response is empty array:
   - keep target fields unchanged unless currently null.
   - set targetStatus = `no_target_available`.
   - set targetNextRetryAt = now + 30 days.
5. If provider error:
   - set targetStatus = `provider_error`.
   - set targetNextRetryAt = now + 1 day.
6. If quota/429:
   - set run status partial/interrupted.
   - set message:
     ```txt
     FMP quota reached. Continue target discovery tomorrow.
     ```
   - stop processing.
7. Create SyncRunItem for every attempted symbol.
8. Update SyncRun counts after every symbol.

---

## Preserve Existing Data

If a stock already has a target price and the new response is empty:

```txt
Do not delete the existing target.
```

Instead:

```txt
Keep old target.
Update targetLastAttemptedAt.
Set targetLastMessage if needed.
```

Only replace target fields when new valid target data is returned.

---

# 9. Counts To Track

The progress UI and SyncRun should show:

```txt
attempted
targetsFound
noTargetAvailable
providerErrors
quotaStopped
processed / eligible total
```

Map these into existing SyncRun fields where possible:

```txt
requestedCount = eligible count or run budget
processedCount = attempted
successCount = targetsFound
skippedCount = noTargetAvailable
failedCount = providerErrors
```

If more detail is needed, include in message or SyncRunItem reasons.

---

# 10. Progress UI

The progress panel should behave like other chunked syncs.

Show:

```txt
Current symbol
Attempted this run
Targets found
No target available
Provider errors
Quota stopped
Processed / eligible
Elapsed time
Estimated remaining time
Progress bar
```

Example:

```txt
Target Discovery in progress
Current symbol: MSFT
Attempted: 24 / 40
Targets found: 3 / 16
No target available: 20
Errors: 0
Quota stopped: No
Eligible remaining: 62
Elapsed: 02:15
```

---

## End States

### success

Use when:

```txt
Run completed without quota block and no errors.
```

### partial_success

Use when:

```txt
Some targets found or attempts completed, but quota reached or run stopped by limit.
```

### failed

Use when:

```txt
No symbols attempted or all attempts failed due to provider/system error.
```

---

# 11. Messages

Use clear messages.

### Targets found limit reached

```txt
Target discovery paused after finding 16 targets. Continue later to scan more symbols.
```

### Attempts limit reached

```txt
Target discovery paused after 40 attempts to protect provider quota. Continue later.
```

### Quota reached

```txt
FMP quota reached. Continue target discovery tomorrow.
```

### No eligible symbols

```txt
No eligible symbols to scan. Targets are fresh or waiting for retry cooldown.
```

### Completed

```txt
Target discovery completed for all currently eligible symbols.
```

---

# 12. Data Inventory Updates

Add or show fields:

```txt
Target Status
Target Last Attempted
Target Last Found
Target Next Retry
Target Attempt Count
Target Last Message
```

Add filters:

```txt
Missing Target
Has Target
No Target Available
Eligible for Target Retry
Provider Error
```

This helps understand why only some stocks have target data.

---

# 13. Scanner Updates

Minimal changes only.

Scanner already shows:

```txt
Target
Upside
Rating
```

No major Scanner redesign.

Optional:

In expandable row, add:

```txt
Target Status
Target Last Attempted
Target Next Retry
```

If not too crowded.

---

# 14. Dashboard Updates

Add or improve analyst coverage display.

Recommended:

```txt
Target Coverage: X / 100
Rating Coverage: 100 / 100
Targets Found This Cycle: X
No Target Available: Y
Eligible for Retry: Z
```

Do not make Dashboard too complex.

---

# 15. Score Methodology Update

Add note:

```txt
Analyst target data is discovered gradually due to provider quota and coverage limits.
Analyst Upside remains display-only until target coverage is high enough.
```

Do not change Opportunity Score v1.

Do not add Analyst Upside to Opportunity Score yet.

---

# 16. API Routes / Actions

If using API routes, suggested endpoints:

```txt
POST /api/admin/analyst-target-discovery/start
POST /api/admin/analyst-target-discovery/process-next
GET  /api/admin/analyst-target-discovery/latest
```

Reusing analyst sync endpoints is acceptable only if the behavior remains clear and not confusing.

Recommended:

```txt
Use separate routes for target discovery.
```

This keeps Phase 14 full analyst sync separate from Phase 15 target discovery.

---

# 17. Rate Limit / Quota Handling

FMP daily quota may return:

```txt
429
```

or another quota-specific error.

Detect it safely.

Do not retry forever.

When quota is reached:

1. Persist progress.
2. Mark run partial/interrupted.
3. Store message.
4. Show Continue tomorrow.
5. Do not lose data already found.

---

# 18. Security

Do not expose:

```txt
API keys
raw provider payloads
provider URLs with keys
debug dumps
```

Temporary test files must be deleted before final report.

---

# 19. Browser QA Checklist

## Admin Sync

Open:

```txt
/admin/sync → Sync Actions
```

Confirm:

1. Sync Analyst Targets — Quota Safe button appears.
2. Helper text explains daily/quota-safe behavior.
3. Start target discovery.
4. Progress panel appears.
5. Attempted count updates.
6. Targets found count updates.
7. No target count updates.
8. Stops on limit or quota.
9. Continue button appears if incomplete.
10. Restart cycle button works.

## Data Inventory

Confirm:

1. Target Status appears.
2. Target Last Attempted appears.
3. Target Last Found appears.
4. Target Next Retry appears.
5. Target Attempt Count appears.
6. Missing Target filter works.
7. Has Target filter works.
8. Eligible for Retry filter works.

## Scanner

Confirm:

1. Target/Upside still show existing data.
2. Missing values show N/A.
3. Optional target status is visible in expanded row if implemented.
4. No provider calls from Scanner.

## Dashboard

Confirm:

1. Target coverage appears.
2. Rating coverage remains correct.
3. Missing target data is represented honestly.
4. No provider calls from Dashboard.

---

# 20. Regression QA

Confirm:

- Full analyst sync from Phase 14 still works or is unchanged.
- Market Data Sync still works.
- Fundamental Score calculation still works.
- Opportunity Score calculation still works.
- Scanner loads.
- Dashboard loads.
- Admin Sync loads.
- Data Inventory loads.
- Score Methodology loads.

---

# 21. Validation

Run:

```txt
npm run build
npx tsc --noEmit
npx prisma validate
npx prisma migrate status
```

Migration is expected if new tracking fields are added.

---

# 22. Required Implementation Report

Return a concise report in English only with:

1. Files inspected.
2. Files changed.
3. Migration name and fields if added.
4. New target discovery action/routes.
5. Run limits used.
6. Eligible symbol selection logic.
7. Retry/cooldown logic.
8. Quota handling.
9. Progress UI behavior.
10. Data Inventory updates.
11. Scanner updates if any.
12. Dashboard updates.
13. Score Methodology update.
14. Browser QA results.
15. Target discovery run result.
16. Coverage change after run.
17. Regression QA results.
18. Automated check results.
19. Known issues.
20. Ready for commit or not.

---

## Acceptance Criteria

Phase 15 is complete when:

- A quota-safe target discovery sync exists.
- It does not blindly scan all symbols in one run.
- It stops safely on run budget or provider quota.
- It saves progress.
- It can continue later.
- It can restart a fresh discovery cycle.
- It tracks target status per stock.
- Data Inventory shows discovery status.
- Dashboard shows target coverage honestly.
- Existing target data is not deleted by empty responses.
- Opportunity Score is unchanged.
- No Yahoo dependency is added.
- No provider calls from Scanner/Dashboard are added.
- Build passes.
- TypeScript passes.
- Prisma validates.
- Migration status is clean.

---

## Future Phase

After this phase:

```txt
Phase 16 — Analyst Sentiment Score
```

or, if target coverage improves enough:

```txt
Phase 16 — Opportunity Score v2 with Analyst Signals
```

Decision should depend on target coverage after several discovery runs.

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