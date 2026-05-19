# Current Feature

## Feature Name

Phase 9C — Safe Quote Sync Metadata, API Keys, and Sync Reporting

## Status

Not Started

---

## Feature Reference

This feature continues the Market Data Sync roadmap.

Read this strategy document before implementation:

```txt
Context/Features/market-data-sync-strategy.md
```

Also use the project context files:

```txt
Context/CLAUDE.md
Context/project-overview.md
Context/coding-standards.md
Context/ai-interaction.md
Context/current-feature.md
```

---

## Goal

Make the manual market-data sync safer and more transparent before expanding it beyond small samples.

This phase focuses on:

1. API key setup and validation.
2. Safe DB update rules.
3. Quote sync metadata.
4. Partial sync handling.
5. Clear sync result reporting in `/admin/sync`.

This phase should not build full Russell 1000 sync, cron jobs, scoring, alert evaluation, or full market-data automation.

---

## Why This Phase Matters

Market data sync can fail for many reasons:

- Missing API key.
- Invalid API key.
- Rate limits.
- Network timeout.
- Provider error.
- Provider returns empty data.
- Provider returns partial data.
- One symbol fails while others succeed.
- Provider returns null, empty string, or invalid numbers.

The system must never create data holes because of a bad API response.

Preferred behavior:

```txt
Keep the last known good value.
Report what failed.
Save what succeeded.
Do not hide partial failure.
```

---

## Core Rules

### Rule 1 — Ask the User for API Keys

Before running real provider tests or sync actions, ask the user to add API keys to `.env.local`.

Expected variables:

```env
FMP_API_KEY=
TWELVE_DATA_API_KEY=
FINNHUB_API_KEY=
```

The user has already created the keys, but they must be added locally.

After adding keys:

```txt
Restart the dev server.
```

Important:

- Do not ask the user to paste keys into chat.
- Do not hardcode keys.
- Do not commit `.env.local`.
- Do not expose keys to the client.
- Do not log keys.
- Do not return keys in server action responses.

---

### Rule 2 — Never Overwrite Good Data with Bad Data

Never overwrite existing non-empty DB values with:

- `null`
- `undefined`
- empty string
- `NaN`
- invalid number
- missing provider response
- failed provider response
- partial provider response that lacks the required field

If a new value is invalid, keep the current DB value and report the issue.

Example:

```txt
Provider returns price = null
→ Do not update StockQuote.price
→ Keep old price
→ Mark symbol as skipped
→ Reason: Missing or invalid price
```

---

### Rule 3 — Partial Success Is Not Full Success

If some symbols succeed and some fail, the sync status must be:

```txt
partial_success
```

Do not report `success` unless every requested symbol was processed and updated successfully.

---

### Rule 4 — Save Successful Symbols Even If Later Symbols Fail

Do not wrap the entire sync in one large transaction.

A sync of many symbols should not be all-or-nothing.

Preferred behavior:

```txt
Each symbol update is atomic.
Successes are saved.
Failures are reported.
The run can be repeated.
```

Example:

```txt
Requested: 50
Updated: 40
Skipped: 5
Failed: 5
Status: partial_success
```

The 40 successful updates should remain saved.

---

### Rule 5 — Scanner and Dashboard Must Never Call APIs During Render

The UI should read from DB only.

Correct architecture:

```txt
Admin Manual Sync
      ↓
Provider API
      ↓
DB
      ↓
Scanner / Dashboard / Drawer
```

Do not call providers inside dashboard/scanner render loaders.

---

## Implementation Scope

### Build in This Phase

1. Add safe update helpers.
2. Improve quote sample sync safety.
3. Add quote sync metadata to `StockQuote`.
4. Improve sync result shape.
5. Improve `/admin/sync` result reporting.
6. Ask user to add API keys locally before real provider testing.
7. Ensure sample sync keeps previous DB values when provider data is bad.
8. Ensure partial sync results are visible and understandable.

---

## Out of Scope

Do not build these in this phase:

- Full Russell 1000 quote sync.
- Full fundamentals sync.
- Full analyst sync.
- Full news persistence.
- Historical candle sync.
- Technical calculations.
- Score recalculation.
- Alert evaluation.
- Scheduled cron jobs.
- Background queue.
- Retry failed-only action.
- Persistent `SyncRun` / `SyncRunItem` tables, unless explicitly approved.
- Auth for `/admin/sync`.
- User-facing sync controls outside `/admin/sync`.

---

## API Key Setup Requirements

Before testing with configured keys, the AI agent should ask the user:

```txt
Please add these keys to .env.local:

FMP_API_KEY=
TWELVE_DATA_API_KEY=
FINNHUB_API_KEY=

Then restart the dev server.
```

Do not request the actual key values in chat.

The `/admin/sync` page should continue to show:

```txt
Configured / Missing
```

for each provider.

It must never show the actual key.

---

## Safe Update Helper Requirements

Create a small shared helper for safe updates.

Suggested file:

```txt
src/lib/market-data/safe-update.ts
```

Suggested helpers:

```ts
export function isValidNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export function keepExistingIfInvalid<T>(
  incoming: T | null | undefined,
  existing: T
): T {
  if (incoming === null || incoming === undefined) return existing;

  if (typeof incoming === "string" && incoming.trim() === "") {
    return existing;
  }

  if (typeof incoming === "number" && !Number.isFinite(incoming)) {
    return existing;
  }

  return incoming;
}
```

Use equivalent logic if a better implementation fits the existing code style.

### Important

Safe update helpers should be used before writing provider data to DB.

---

## StockQuote Metadata

The current known gap:

```txt
StockQuote.source does not exist.
StockQuote.lastSyncedAt does not exist.
```

This phase should add quote sync metadata if missing.

Suggested Prisma changes:

```prisma
model StockQuote {
  // existing fields...

  source          String?
  lastSyncedAt    DateTime?
  sourceUpdatedAt DateTime?
}
```

Use these fields to record:

| Field | Meaning |
| --- | --- |
| `source` | provider that last successfully updated the quote |
| `lastSyncedAt` | when our system successfully wrote/validated the quote |
| `sourceUpdatedAt` | timestamp from provider, if available |

If schema changes are needed, use Prisma migration only.

Suggested migration name:

```txt
add-stock-quote-sync-metadata
```

Do not use `prisma db push`.

---

## Sync Result Reporting

Every sync action should return a detailed result.

Suggested type:

```ts
export type SyncRunStatus = "success" | "partial_success" | "failed";

export type SyncSymbolResult = {
  symbol: string;
  status: "success" | "skipped" | "failed";
  reason?: string;
  dbAction: "updated" | "kept_existing" | "not_found" | "none";
};

export type SyncActionResult = {
  status: SyncRunStatus;
  provider: "fmp" | "twelve-data" | "finnhub";
  action: string;
  requestedCount: number;
  successCount: number;
  skippedCount: number;
  failedCount: number;
  updatedSymbols: string[];
  skippedSymbols: SyncSymbolResult[];
  failedSymbols: SyncSymbolResult[];
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  persisted: boolean;
  message: string;
};
```

The exact shape can vary, but it must include:

- status
- provider
- action
- requested count
- success count
- skipped count
- failed count
- updated symbols
- skipped symbols with reasons
- failed symbols with reasons
- started time
- finished time
- duration
- whether data was persisted

---

## Status Rules

### success

Use only when:

```txt
All requested symbols were updated successfully.
```

### partial_success

Use when:

```txt
At least one symbol succeeded
AND at least one symbol was skipped or failed.
```

### failed

Use when:

```txt
No requested symbols were successfully updated.
```

---

## Difference Between Skipped and Failed

### Skipped

Provider responded, but the data is not usable.

Examples:

- Missing price.
- Invalid number.
- Empty response for symbol.
- Symbol missing from batch response.
- Empty string for required profile field.

DB behavior:

```txt
Keep existing value.
Do not overwrite.
Report skipped.
```

### Failed

Provider/system error occurred.

Examples:

- API timeout.
- Rate limit.
- HTTP 500.
- Invalid API key.
- Network failure.
- Unexpected provider format.

DB behavior:

```txt
Keep existing value.
Do not overwrite.
Report failed.
```

---

## Quote Sync Behavior

Update `Sync Quotes Sample`.

Expected behavior:

1. Load a small set of existing DB symbols.
2. Fetch quotes from Twelve Data.
3. For each symbol:
   - Validate provider response.
   - Validate price.
   - Safely parse numeric fields.
   - Update only valid fields.
   - Keep existing DB values for invalid fields.
   - Set `source = "twelve-data"` only when at least one valid quote field is updated.
   - Set `lastSyncedAt` only when the quote is successfully updated.
   - Set `sourceUpdatedAt` if provider timestamp exists.
4. Return detailed sync report.
5. Do not create duplicate `StockQuote` rows.
6. Do not create duplicate `Stock` rows.
7. Do not update symbols that do not exist in DB.

### Required quote fields for success

At minimum, a quote update should require:

```txt
symbol
valid price
```

If price is missing/invalid:

```txt
skip symbol
keep existing DB values
```

### Optional quote fields

These can be updated only when valid:

- changePercent
- open
- high
- low
- previousClose
- volume

If any optional field is missing, keep the existing value and add a warning if useful.

---

## Profile Sync Behavior

Update `Sync Profiles Sample` safe update behavior.

Expected behavior:

1. Fetch profiles from FMP.
2. For each symbol:
   - Validate profile response.
   - Update only valid fields.
   - Never overwrite existing useful values with `null`, `undefined`, empty string, or invalid numbers.
3. Return detailed sync report.
4. Do not create duplicate `Stock` rows.

Fields to update only when valid:

- name
- sector
- marketCap
- exchange, industry, country, currency if already supported by schema and mapping

Important:

Use helper logic that treats empty string as invalid.

---

## Admin UI Reporting

Update `/admin/sync` result viewer to show clear sync summaries.

After a sync, show:

```txt
Status: Success / Partial Success / Failed
Provider
Action
Requested
Updated
Skipped
Failed
Started
Finished
Duration
Persisted: Yes/No
```

Show tables/lists:

### Updated Symbols

```txt
NVDA — updated
AMD — updated
```

### Skipped Symbols

```txt
SMCI — skipped — Missing price — kept existing value
```

### Failed Symbols

```txt
PLTR — failed — Rate limit — kept existing value
```

The UI should make it clear:

```txt
Skipped/failed symbols keep their last known DB value.
```

---

## Partial Failure Policy

If a sync fails after processing some symbols:

- Keep already-saved successful updates.
- Report remaining symbols as failed if possible.
- Show `partial_success`.
- Do not rollback successful symbol updates.
- Do not mark the whole run as success.
- Do not hide the failure.

If the provider batch request fails before any symbol is processed:

```txt
status = failed
successCount = 0
```

If provider returns partial batch data:

```txt
available symbols = success/skipped based on data quality
missing symbols = skipped or failed with reason
```

---

## Future Persistent Sync Logs

Do not build persistent sync logs in this phase unless explicitly approved.

But design the result shape so it can later map to:

```prisma
model SyncRun {
  id           String   @id @default(cuid())
  type         String
  provider     String
  status       String
  requested    Int
  succeeded    Int
  skipped      Int
  failed       Int
  startedAt    DateTime @default(now())
  finishedAt   DateTime?
  errorMessage String?
}

model SyncRunItem {
  id          String @id @default(cuid())
  syncRunId   String
  symbol      String
  status      String
  reason      String?
  dbAction    String
}
```

This is future work.

---

## Validation Commands

Run:

```txt
npm run build
npx tsc --noEmit
npx prisma validate
npx prisma migrate status
```

If schema changes are made:

```txt
npx prisma migrate dev --name add-stock-quote-sync-metadata
npm run db:seed
```

Only use Prisma migrations.

---

## Manual QA Checklist

### Missing API Keys

- `/admin/sync` loads.
- Providers show Missing.
- Buttons return clear missing-key errors.
- No crash.
- No DB writes.

### Configured API Keys

After user adds keys to `.env.local` and restarts server:

- Providers show Configured.
- Test Twelve Quote works.
- Test FMP Profile works.
- Test Finnhub News works.

### Quote Sync

- Run Sync Quotes Sample.
- Confirm status is success, partial_success, or failed.
- Confirm counts are correct.
- Confirm invalid provider data does not overwrite existing DB values.
- Confirm skipped/failed symbols are listed with reasons.
- Confirm successful symbols update `StockQuote`.
- Confirm `source` and `lastSyncedAt` update only for successful quote updates.
- Confirm scanner/dashboard still load.

### Profile Sync

- Run Sync Profiles Sample.
- Confirm empty/null provider fields do not overwrite existing useful DB values.
- Confirm counts are correct.
- Confirm skipped/failed symbols are listed with reasons.

### Partial Failure

If practical, simulate partial failure by using one invalid symbol in a sample list.

Expected:

- Valid symbols update.
- Invalid symbol is skipped/failed.
- Overall status is partial_success.
- Existing values are kept for invalid symbol.

### Regression

- Dashboard still loads.
- Scanner still loads.
- Drawer still works.
- Add/Edit/Remove Watchlist still works.
- Create Alert still works.
- No provider calls happen during dashboard/scanner render.

---

## Acceptance Criteria

This phase is complete when:

- API key setup instructions are clear.
- Safe update helpers exist.
- Quote sync does not overwrite good data with bad data.
- Profile sync does not overwrite good data with bad data.
- Quote metadata exists on `StockQuote` if migration was required.
- Sync results show success/skipped/failed breakdown.
- Partial sync is reported as partial_success.
- Successful symbols remain saved even if other symbols fail.
- `/admin/sync` clearly shows what happened in every sync.
- API keys are still safe.
- No full sync, cron, scoring, or alert evaluation is added.
- Build passes.
- Prisma validation passes.
- Migration status is clean.

---

## Required Implementation Report

After implementation, provide:

1. Files created.
2. Files changed.
3. Whether schema was changed.
4. Migration name, if any.
5. How API key setup is handled.
6. Safe update helper details.
7. Quote sync behavior.
8. Profile sync behavior.
9. Sync result shape.
10. Partial failure behavior.
11. Missing-key QA result.
12. Configured-key QA result, if keys are available.
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
- Phase 9C completed (2026-05-19): Added safe quote sync metadata, API key validation, and detailed sync reporting. Added `source`, `lastSyncedAt`, `sourceUpdatedAt` fields to `StockQuote` via migration `20260519144031_add_stock_quote_sync_metadata`. Created `src/lib/market-data/safe-update.ts` with `isValidNumber`, `keepExistingIfInvalid` helpers. Updated `src/lib/market-data/types.ts` with `SyncRunStatus`, `SyncSymbolResult`, `SyncActionResult` types replacing the coarse `SyncSummary`. Rewrote `src/actions/market-data-actions.ts` to use safe helpers and return per-symbol success/skipped/failed breakdown; each symbol update is atomic (partial success preserved). Rewrote `src/components/admin/SyncPageClient.tsx` with 4-step workflow layout, button descriptions, DB safety note, empty result placeholder, and clear updated/skipped/failed symbol lists. Added `Admin Sync` nav item to `AppSidebar.tsx` behind `NEXT_PUBLIC_SHOW_ADMIN_TOOLS=true` flag with amber DEV badge and active state. Fixed FMP provider: all `/api/v3/` legacy endpoints return HTTP 403 for non-legacy users (deprecated after August 31, 2025) — replaced with `/stable/profile?symbol=` and `/stable/analyst-estimates?symbol=&period=annual&limit=1`; fixed field mappings (`marketCap` not `mktCap`, `exchange` not `exchangeShortName`). Build passes, `prisma validate` and `prisma migrate status` both clean. QA confirmed: Twelve Data quote sync OK, FMP profile sync OK (all 5 symbols), Finnhub news test OK, partial-success simulation OK, no duplicate rows, no API key exposure, dashboard/scanner/drawer regression clean. Approved by user.
- Phase 9B completed (2026-05-19): Built the market data provider layer and admin manual sync shell. Created shared provider types in `src/lib/market-data/types.ts` (`MarketDataProvider`, `ProviderTestResult`, `NormalizedQuote`, `NormalizedCompanyProfile`, `NormalizedNewsItem`, `SyncSummary`). Created three server-side-only provider clients: `providers/fmp.ts` (`testFmpProfile`, `fetchFmpCompanyProfile`, `fetchFmpAnalystTarget`), `providers/twelve-data.ts` (`testTwelveQuote`, `fetchTwelveQuote`, `fetchTwelveQuotes` batch), `providers/finnhub.ts` (`testFinnhubNews`, `fetchFinnhubCompanyNews`, `fetchFinnhubQuote`). All providers check for missing API key, handle HTTP errors, handle rate limits (429), normalize response shapes, and never expose keys. Created `src/actions/market-data-actions.ts` with five server actions: `testFmpProfileAction`, `testTwelveQuoteAction`, `testFinnhubNewsAction`, `syncQuotesSampleAction` (upserts `StockQuote` for up to 5 DB symbols via Twelve Data), `syncProfilesSampleAction` (updates `Stock.name/sector/marketCap` for up to 5 DB symbols via FMP). Raw provider response bodies stripped from action returns via `stripRaw()` before client serialization. Created `app/admin/sync/page.tsx` (server component, resolves key presence server-side) and `src/components/admin/SyncPageClient.tsx` (client, all 5 action buttons with loading states and result viewer). No schema changes, no new migrations, no existing files modified. `StockQuote.source` and `StockQuote.lastSyncedAt` intentionally not added — noted as a gap for Phase 9D. Build passes, `prisma validate` and `prisma migrate status` both clean. Approved by user.
