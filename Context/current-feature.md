# Current Feature

## Feature Name

Phase 9E — Universe Management and Nasdaq 100 Membership Sync

## Status

Not Started

---

## Feature Reference

This feature continues the Market Data Sync and Scanner roadmap.

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

Build a real universe/index management layer in the Admin area and start with Nasdaq 100 as the first real externally-synced universe.

This phase is not about syncing prices.

This phase is about knowing and controlling:

```txt
Which stocks exist in the DB
Which universe/index each stock belongs to
Which stocks are currently active in an index
Which stocks were previously in an index but are no longer active
Where the membership data came from
When the universe was last synced
How many stocks are missing quotes or profile data
```

After this phase, the Admin area should make it clear how many stocks exist in the DB, how many belong to each universe, and why they are there.

This prepares the system for Nasdaq 100 controlled quote sync in the next phase.

---

## High-Level Scope

Build:

1. A stronger `StockUniverseMember` membership model.
2. A real Nasdaq 100 universe sync action.
3. A Universe Overview table in Admin.
4. A DB stock summary in Admin.
5. Persistent `SyncRun` / `SyncRunItem` logs for universe sync.
6. Safe active/inactive membership handling.

Do not build quote batch sync in this phase.

---

## Core Product Rule

A stock and a universe membership are not the same thing.

```txt
Stock = a company/ticker known by the system
StockUniverse = an index/list such as Nasdaq 100, S&P 500, Russell 1000
StockUniverseMember = the relationship between a stock and a universe
```

A stock can exist in the DB even if it is no longer active in any universe.

---

## Critical Rules

### Rule 1 — Never Delete Stocks During Universe Sync

Universe sync must never delete records from `Stock`.

If a stock leaves Nasdaq 100:

- Keep the `Stock` record.
- Keep its quotes.
- Keep its logs.
- Keep its drawer/profile data.
- Keep its watchlist item if it has one.
- Keep its alerts if it has any.
- Mark only the Nasdaq 100 membership as inactive.

```txt
Leaving an index does not mean leaving the product.
```

---

### Rule 2 — Never Modify Watchlist or Alerts

Universe sync must not modify:

```txt
WatchlistItem
AlertRule
```

If a stock is in the watchlist and leaves Nasdaq 100:

- It remains in the watchlist.
- Its alerts remain active.
- Only its Nasdaq 100 membership becomes inactive.

---

### Rule 3 — Membership Is Dynamic

Nasdaq 100, S&P 500, and Russell 1000 are dynamic lists.

The system must support:

- New members
- Existing members
- Reactivated members
- Removed/inactive members
- Future additional universes

---

### Rule 4 — Use a Real Provider Source

Do not hardcode Nasdaq 100 symbols as a permanent seed.

Use a real provider source.

Preferred provider:

```txt
FMP stable endpoint
```

But do not guess the endpoint.

Before implementation, investigate and confirm with the configured FMP API key:

```txt
Which stable endpoint returns Nasdaq 100 constituents
Whether it works with the current plan
What the exact response shape is
Which fields are available
```

Do not use deprecated `/api/v3` endpoints.

---

### Rule 5 — No Price Sync Yet

This phase must not sync quotes for the Nasdaq 100.

Do not add:

```txt
Sync Nasdaq 100 Quotes
Sync All Quotes
Quote batch sync
Historical candles
Scoring
Alert evaluation
```

The next phase will use the universe membership created here.

---

## Data Model Changes

### 1. Update StockUniverseMember

Extend `StockUniverseMember` so it can track active/inactive membership state.

Recommended fields:

```prisma
isActive          Boolean   @default(true)
addedAt           DateTime  @default(now())
lastSeenAt        DateTime?
removedAt         DateTime?
source            String?
statusReasonCode  String?
```

If the model already has some of these fields, update only what is missing.

Suggested meaning:

| Field | Meaning |
| --- | --- |
| `isActive` | Whether the stock is currently active in the universe |
| `addedAt` | When the membership was first created |
| `lastSeenAt` | Last time the provider returned this symbol for this universe |
| `removedAt` | When the symbol stopped appearing in provider results |
| `source` | Provider/source of the membership, e.g. `fmp` |
| `statusReasonCode` | Short machine-friendly reason for current state |

Suggested `statusReasonCode` values:

```txt
provider_active
created_from_provider
reactivated_from_provider
missing_from_latest_provider_sync
manual_seed
unknown
```

Do not use long free-text messages here unless needed.

---

### 2. Migration

Create a Prisma migration.

Suggested command:

```txt
npx prisma migrate dev --name add-universe-membership-status
```

Do not use:

```txt
prisma db push
```

---

## Provider Investigation Requirement

Before coding the final sync action, investigate the correct FMP stable endpoint for Nasdaq 100 constituents.

The implementation report must include:

```txt
Endpoint tested
Sanitized URL
HTTP status
Whether it works with current API key
Response shape summary
Fields available
Final endpoint chosen
```

Do not expose API keys.

Do not store raw provider payloads.

Do not return full raw provider responses to the browser.

---

## Nasdaq 100 Universe Sync

### Admin Button

Add a new button in `/admin/sync`:

```txt
Sync Nasdaq 100 Universe
```

Suggested section:

```txt
Universe Management
```

or:

```txt
Index Universe Management
```

This button should sync universe membership only.

It should not sync quotes.

---

### What the Button Does

When clicked:

1. Fetch Nasdaq 100 constituents from the verified provider endpoint.
2. Validate and normalize symbols.
3. Ensure the `Nasdaq 100` universe exists.
4. For each returned symbol:
   - Create a `Stock` if it does not exist.
   - Update safe basic identity fields if available and valid.
   - Create or update the `StockUniverseMember`.
   - Set `isActive = true`.
   - Set `lastSeenAt = now`.
   - Clear `removedAt`.
   - Set `source = fmp`.
   - Set a suitable `statusReasonCode`.
5. Find previously active Nasdaq 100 members that were not returned by the provider.
6. Mark those memberships as inactive:
   - `isActive = false`
   - `removedAt = now`
   - `statusReasonCode = missing_from_latest_provider_sync`
7. Do not delete stocks.
8. Do not modify watchlist.
9. Do not modify alerts.
10. Persist a `SyncRun` and `SyncRunItem` rows.

---

## Membership Sync Logic

### Returned Symbol Already Active

If the symbol is already an active Nasdaq 100 member:

```txt
isActive remains true
lastSeenAt = now
removedAt = null
statusReasonCode = provider_active
```

Suggested `dbAction`:

```txt
already_active
```

---

### Returned Symbol Exists but Membership Is Inactive

If the stock exists and the membership exists but is inactive:

```txt
isActive = true
lastSeenAt = now
removedAt = null
statusReasonCode = reactivated_from_provider
```

Suggested `dbAction`:

```txt
reactivated_membership
```

---

### Returned Symbol Exists but Membership Does Not Exist

If the stock exists but has no Nasdaq 100 membership:

```txt
create StockUniverseMember
isActive = true
addedAt = now
lastSeenAt = now
source = fmp
statusReasonCode = created_from_provider
```

Suggested `dbAction`:

```txt
created_membership
```

---

### Returned Symbol Does Not Exist in Stock

If the symbol does not exist in `Stock`:

```txt
create Stock
create StockUniverseMember
```

Use safe field mapping from provider data.

Suggested `dbAction`:

```txt
created_stock_and_membership
```

---

### Previously Active Symbol Missing from Latest Provider Response

If a stock was active in Nasdaq 100 but is not returned by the latest provider sync:

```txt
isActive = false
removedAt = now
statusReasonCode = missing_from_latest_provider_sync
```

Suggested `dbAction`:

```txt
deactivated_membership
```

Do not delete the stock.

---

## Stock Field Safety

When creating/updating `Stock` from the provider:

Allowed safe fields may include:

```txt
symbol
companyName
exchange
sector
industry
marketCap
```

Rules:

- Do not overwrite valid existing values with null.
- Do not overwrite valid existing values with empty strings.
- Do not overwrite numeric values with invalid numbers.
- Normalize symbols consistently.
- Keep the same safe update principles from Phase 9C.

---

## SyncRun / SyncRunItem Logging

Use the persistent logging system created in Phase 9D.

Add a new sync type:

```txt
nasdaq100-universe-sync
```

Provider:

```txt
fmp
```

### SyncRun Counts

Use existing count fields as much as possible:

| SyncRun field | Suggested meaning |
| --- | --- |
| `requestedCount` | Number of symbols fetched from provider |
| `successCount` | Number of symbols/memberships successfully processed, including already active |
| `skippedCount` | Invalid or unsupported symbols skipped |
| `failedCount` | Symbols that failed processing |
| `persisted` | true if any DB change was made, or if the run completed successfully |

Because the existing `SyncRun` model does not have custom metric columns, include a concise summary in `message`.

Example message:

```txt
Fetched 101 symbols. Created stocks: 8. Created memberships: 8. Reactivated: 2. Already active: 91. Deactivated: 3. Failed: 0.
```

---

### SyncRunItem

Create one `SyncRunItem` per meaningful symbol-level action.

For returned symbols:

```txt
symbol
status: success / skipped / failed
reason
dbAction
```

For deactivated symbols, also create `SyncRunItem` rows so the user can see which symbols left the index.

Suggested `dbAction` values for this phase:

```txt
created_stock_and_membership
created_membership
reactivated_membership
already_active
deactivated_membership
invalid_symbol
failed
```

It is acceptable that these extend the earlier quote-sync dbAction values.

---

## Admin UI — Universe Overview

Add a new section to `/admin/sync`:

```txt
Universe Overview
```

or:

```txt
Index Universe Status
```

This should give visibility into what the DB currently contains.

### Required Table

Show one row per universe.

Suggested columns:

| Universe | Active Members | Inactive Members | Total Known | Missing Quotes | Stale Quotes | With Profile | Last Universe Sync | Last Quote Sync |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | --- | --- |

Definitions:

| Column | Meaning |
| --- | --- |
| `Active Members` | Memberships where `isActive = true` |
| `Inactive Members` | Memberships where `isActive = false` |
| `Total Known` | Active + inactive memberships |
| `Missing Quotes` | Active members with no `StockQuote` |
| `Stale Quotes` | Active members with missing/old `StockQuote.lastSyncedAt` |
| `With Profile` | Active members with basic profile fields populated |
| `Last Universe Sync` | Latest `SyncRun` for this universe sync type |
| `Last Quote Sync` | Latest relevant quote sync for this universe, if available |

For stale quote logic, use a simple rule in this phase:

```txt
StockQuote.lastSyncedAt is null or older than today
```

If this is too complex for the current schema, use:

```txt
StockQuote.lastSyncedAt is null or older than 24 hours
```

---

## Admin UI — DB Stock Summary

Add a compact summary above or near Universe Overview.

Suggested metrics:

| Metric | Meaning |
| --- | --- |
| Total Stocks in DB | All stocks in `Stock` |
| Active in at least one universe | Stocks with at least one active membership |
| Inactive only | Stocks with inactive memberships and no active memberships |
| Watchlist only | Stocks that are in watchlist but no active universe |
| Not classified | Stocks with no active universe, no watchlist, and no active alert |

This is important to identify mock/demo leftovers.

Do not delete or archive anything in this phase.

---

## Optional Drill-Down

A member drill-down is useful but not mandatory for this phase.

If implemented, keep it lightweight.

Example:

```txt
View Members
```

Columns:

| Symbol | Company | Active | Source | Added At | Last Seen | Removed At | Quote Status |
| --- | --- | --- | --- | --- | --- | --- | --- |

If this adds too much complexity, defer to a future phase.

Minimum requirement for this phase:

```txt
Universe Overview table exists and is accurate.
```

---

## Data Loader

Create or update a server-side data loader for universe overview.

Suggested file:

```txt
src/lib/data/admin-universes.ts
```

Suggested functions:

```ts
getUniverseOverview()
getDbStockSummary()
```

Requirements:

- Server-side only.
- No provider calls in render.
- No API keys.
- Efficient queries.
- Works even when a universe has zero members.
- Works with existing seeded/demo data.
- Returns serializable data to the client.

---

## Provider Layer

Add a provider function for Nasdaq 100 constituents.

Suggested location:

```txt
src/lib/market-data/providers/fmp.ts
```

Suggested function name:

```ts
fetchFmpNasdaq100Constituents()
```

Requirements:

- Uses verified FMP stable endpoint.
- Does not use `/api/v3`.
- Handles HTTP errors clearly.
- Strips raw provider payloads before returning to the client.
- Normalizes symbol/company fields.
- Returns clean typed data only.

Suggested typed result:

```ts
type IndexConstituent = {
  symbol: string;
  companyName?: string | null;
  exchange?: string | null;
  sector?: string | null;
  industry?: string | null;
  marketCap?: number | null;
};
```

---

## Server Action

Add a server action for the Admin button.

Suggested function:

```ts
syncNasdaq100UniverseAction()
```

Requirements:

- Calls the FMP provider function.
- Applies membership sync logic.
- Uses safe updates.
- Persists `SyncRun` / `SyncRunItem`.
- Returns a user-friendly result to the Admin UI.
- Does not expose raw provider data.
- Does not expose API keys.

---

## UI Placement Recommendation

In `/admin/sync`, the page can be organized like this:

```txt
Step 1 — API Key Configuration
Step 2 — Provider Tests
Step 3 — Universe Management
Step 4 — Sample Sync
Step 5 — Review Results
Step 6 — Recent Sync Runs
Universe Overview / DB Stock Summary
```

Do not worry if the exact numbering differs, but the page should remain clear.

The new universe sync action must not be visually mixed with quote/profile sync buttons without explanation.

---

## Out of Scope

Do not build these in this phase:

```txt
Nasdaq 100 quote sync
Sync All Nasdaq 100 Quotes
S&P 500 sync
Russell 1000 sync
Full market sync
Cron or scheduled jobs
Historical candles
Technical indicators
Scoring
Alert evaluation
News persistence
Analyst target sync
Retry failed
Manual delete/archive UI
Admin authentication
Provider cost dashboard
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

Expected:

- Build passes.
- TypeScript passes.
- Prisma validates.
- Migration status is clean.

---

### 2. Provider Endpoint QA

Test the FMP Nasdaq 100 constituents endpoint.

Expected report:

```txt
Endpoint tested
Sanitized URL
HTTP status
Works with current key: yes/no
Response shape summary
Fields available
```

Confirm:

- No `/api/v3` endpoint is used.
- No API key is logged.
- No full raw payload is returned to browser.

---

### 3. Universe Overview Before Sync

Open `/admin/sync`.

Expected:

- DB Stock Summary is visible.
- Universe Overview is visible.
- Existing seeded universes show current counts.
- Page works even if Nasdaq 100 has only demo data before sync.

---

### 4. Run Sync Nasdaq 100 Universe

Click:

```txt
Sync Nasdaq 100 Universe
```

Expected:

- Action completes without syncing quotes.
- Admin result panel shows clear summary.
- `SyncRun` is created with type `nasdaq100-universe-sync`.
- Provider is `fmp`.
- `SyncRunItem` rows are created.
- DB Stock Summary updates.
- Universe Overview updates.

---

### 5. Verify Membership Counts

After sync:

Expected:

- Nasdaq 100 active count is close to the provider result count.
- Total known = active + inactive.
- Missing quotes may be high, and that is expected because this phase does not sync quotes.
- Last Universe Sync is updated.
- Last Quote Sync is unchanged unless quote sync was run separately.

---

### 6. Verify No Stock Deletes

Before and after sync, confirm:

- No existing `Stock` records were deleted.
- Existing watchlist stocks remain.
- Existing alert stocks remain.
- Existing quotes remain.

---

### 7. Verify Inactive Handling

If practical, simulate a provider response missing a previously active symbol.

Expected:

- That membership becomes `isActive = false`.
- `removedAt` is set.
- `statusReasonCode = missing_from_latest_provider_sync`.
- The stock remains in `Stock`.
- Watchlist/alerts remain untouched.
- A `SyncRunItem` logs `deactivated_membership`.

---

### 8. Verify Reactivation Handling

If practical, simulate a symbol that was inactive and appears again.

Expected:

- `isActive = true`.
- `removedAt = null`.
- `lastSeenAt` updates.
- `statusReasonCode = reactivated_from_provider`.
- A `SyncRunItem` logs `reactivated_membership`.

---

### 9. Verify Recent Sync Runs

Expected:

- Recent Sync Runs shows the universe sync.
- Expanding the run shows symbol-level actions.
- Deactivated symbols are visible in the details.
- Counts and message are understandable.

---

### 10. Regression

Confirm:

- Dashboard still loads.
- Scanner still loads.
- Drawer still works.
- Watchlist actions still work.
- Alert actions still work.
- Admin Sync provider tests still work.
- Quote sample sync still works.
- Profile sample sync still works.
- No provider calls happen during Dashboard render.
- No provider calls happen during Scanner render.

---

## Acceptance Criteria

This phase is complete when:

- `StockUniverseMember` tracks active/inactive status.
- Prisma migration is created and applied.
- Correct FMP stable endpoint for Nasdaq 100 constituents is verified.
- `Sync Nasdaq 100 Universe` button exists.
- Nasdaq 100 symbols are fetched from provider.
- Missing `Stock` records are created safely.
- Existing stocks are reused safely.
- Memberships are created, updated, reactivated, or deactivated correctly.
- Stocks are never deleted by universe sync.
- Watchlist is never modified by universe sync.
- Alerts are never modified by universe sync.
- `SyncRun` is persisted for universe sync.
- `SyncRunItem` rows are persisted for symbol-level actions.
- Admin shows DB Stock Summary.
- Admin shows Universe Overview.
- Universe Overview shows active/inactive/total/missing quote/profile-related counts.
- Refreshing `/admin/sync` keeps overview visible and accurate.
- No quote sync for Nasdaq 100 is added.
- No cron is added.
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
5. FMP endpoint investigation result.
6. Final endpoint used.
7. Provider response shape summary.
8. New/updated provider functions.
9. New/updated server actions.
10. Universe sync logic summary.
11. Stock deletion verification.
12. Watchlist/alerts untouched verification.
13. SyncRun/SyncRunItem logging summary.
14. Admin Universe Overview summary.
15. DB Stock Summary result.
16. QA result for Nasdaq 100 sync.
17. Page refresh result.
18. Build / TypeScript / Prisma results.
19. Known issues.
20. Whether ready for browser QA.

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