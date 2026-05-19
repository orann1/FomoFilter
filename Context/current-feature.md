# Current Feature

## Feature Name

Phase 9B — Market Data Provider Layer and Admin Sync Shell

## Status

Completed

---

## Feature Reference

This feature is part of the Market Data Sync roadmap.

Read the strategy document before implementation:

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

Build the first technical foundation for external market data providers and create a developer/admin manual sync page.

This phase should make it possible to test external provider responses and run small sample sync actions manually, without building full production sync, scheduled jobs, or scoring logic yet.

The goal is not to fully populate the database.

The goal is to create a safe foundation for:

- FMP
- Twelve Data
- Finnhub
- Manual provider testing
- Manual sample sync buttons
- Future quote/profile/news/fundamental sync phases

---

## Product Context

FomoFilter’s Scanner should not call external APIs directly during page rendering.

Correct architecture:

```txt
External Market Data APIs
        ↓
Provider Layer
        ↓
Manual / Scheduled Sync Jobs
        ↓
Database
        ↓
Scanner / Dashboard / Drawer / Alerts
```

This phase creates the provider layer and a simple admin shell to test it.

---

## Important Decisions

### Providers

Use these providers:

| Provider | Role |
| --- | --- |
| FMP | Universe, company profile, fundamentals, analyst data, earnings |
| Twelve Data | Quotes, OHLC, historical candles, technical base |
| Finnhub | News, catalyst enrichment, fallback quotes |

Do not include Yahoo / Apify Yahoo in the core provider strategy.

---

### This Phase Combines Two Earlier Ideas

This phase combines:

```txt
Provider Layer Skeleton
+
Admin Manual Sync Shell
```

Reason:

Provider files without a testing UI are too theoretical, and an admin sync UI without provider clients is not useful.

However, this phase should still stay small and safe.

---

## Build in This Phase

### 1. Market Data Provider Types

Create shared provider types.

Suggested file:

```txt
src/lib/market-data/types.ts
```

Include normalized types such as:

```ts
export type MarketDataProvider = "fmp" | "twelve-data" | "finnhub";

export type ProviderTestResult<T = unknown> = {
  ok: boolean;
  provider: MarketDataProvider;
  action: string;
  data?: T;
  error?: string;
  raw?: unknown;
};

export type NormalizedQuote = {
  symbol: string;
  price: number | null;
  changePercent: number | null;
  open: number | null;
  high: number | null;
  low: number | null;
  previousClose: number | null;
  volume: number | null;
  timestamp?: string | null;
  source: MarketDataProvider;
};

export type NormalizedCompanyProfile = {
  symbol: string;
  name: string | null;
  exchange: string | null;
  sector: string | null;
  industry: string | null;
  marketCap: number | null;
  currency: string | null;
  country: string | null;
  website?: string | null;
  description?: string | null;
  source: MarketDataProvider;
};

export type NormalizedNewsItem = {
  symbol: string;
  headline: string;
  summary?: string | null;
  url?: string | null;
  sourceName?: string | null;
  publishedAt?: string | null;
  source: MarketDataProvider;
};
```

Keep types practical and minimal. Do not overdesign.

---

### 2. Provider Clients

Create provider client files.

Suggested files:

```txt
src/lib/market-data/providers/fmp.ts
src/lib/market-data/providers/twelve-data.ts
src/lib/market-data/providers/finnhub.ts
```

Provider clients must run server-side only.

Do not expose API keys to the client.

Use environment variables:

```txt
FMP_API_KEY
TWELVE_DATA_API_KEY
FINNHUB_API_KEY
```

Each provider file should include a small set of safe functions.

#### FMP Provider

Initial functions:

```ts
testFmpProfile(symbol: string)
fetchFmpCompanyProfile(symbol: string)
```

Optional if simple:

```ts
fetchFmpAnalystTarget(symbol: string)
```

Do not build full fundamentals sync in this phase.

#### Twelve Data Provider

Initial functions:

```ts
testTwelveQuote(symbol: string)
fetchTwelveQuote(symbol: string)
```

Optional if simple:

```ts
fetchTwelveQuotes(symbols: string[])
```

Do not build full historical candle sync in this phase.

#### Finnhub Provider

Initial functions:

```ts
testFinnhubNews(symbol: string)
fetchFinnhubCompanyNews(symbol: string)
```

Optional if simple:

```ts
fetchFinnhubQuote(symbol: string)
```

Do not build full news sync in this phase.

---

### 3. Provider Error Handling

Every provider function should:

- Check for missing API key.
- Avoid throwing raw errors into the UI.
- Return a normalized success/error result.
- Include enough information for debugging.
- Never log API keys.
- Never return API keys to the client.
- Handle provider-specific error responses safely.
- Handle rate-limit errors gracefully.

Example error shape:

```ts
{
  ok: false,
  provider: "twelve-data",
  action: "quote",
  error: "Missing TWELVE_DATA_API_KEY"
}
```

---

### 4. Admin Sync Page

Create an admin/developer page:

```txt
/admin/sync
```

This is a development/admin tool, not a normal user-facing page.

The page should:

- Reuse the existing app shell if practical.
- Be clearly labeled as admin/developer tooling.
- Show provider status.
- Show manual test buttons.
- Show sync/sample action buttons.
- Show last result output in a readable format.
- Avoid exposing secrets.

Suggested title:

```txt
Market Data Sync
```

Subtitle:

```txt
Test providers and run safe manual sync actions before scheduled sync is added.
```

---

### 5. Admin Sync Buttons

Keep the first version small.

#### Provider Test Buttons

Add these buttons:

| Button | Action |
| --- | --- |
| Test FMP Profile | Fetch profile for `NVDA` |
| Test Twelve Quote | Fetch quote for `NVDA` |
| Test Finnhub News | Fetch recent news for `NVDA` |

These buttons should not persist data to the database by default. They should display normalized provider results.

#### Sample Sync Buttons

Add these buttons, but keep persistence limited:

| Button | Action |
| --- | --- |
| Sync Quotes Sample | Fetch quotes for 5-10 symbols and update `StockQuote` only if compatible |
| Sync Profiles Sample | Fetch profiles for 5 symbols and update `Stock` fields only if compatible |

Do not persist news, fundamentals, analyst data, or historical candles in this phase unless already fully supported by existing schema and explicitly safe.

---

## Persistence Scope

### Allowed Persistence

Allowed only if compatible with existing schema:

1. Quote sample sync:
   - Update existing `StockQuote` records.
   - Use existing stock symbols from DB.
   - Update only fields that clearly map.
   - Add/update `source` and `lastSyncedAt` only if fields already exist or if a minimal schema update is approved.

2. Profile sample sync:
   - Update basic `Stock` fields if they exist:
     - name
     - exchange
     - sector
     - industry
     - marketCap
     - currency
     - country

### Not Allowed Yet

Do not persist in this phase:

- Full fundamentals.
- Full analyst data.
- Full news dataset.
- Historical candles.
- Technical indicators.
- Scores.
- Alert events.
- AI summaries.

---

## Database / Prisma Rules

Before changing schema, investigate what already exists.

Report first if schema changes are needed.

Do not create migrations unless required.

Possible schema additions may be needed later, but avoid them in this phase unless absolutely necessary.

Examples of fields that may already exist or may be needed later:

```txt
StockQuote.source
StockQuote.lastSyncedAt
StockQuote.sourceUpdatedAt
```

If these are missing, do not automatically add them unless the current sample sync requires them. Prefer to report the gap first.

---

## Server Actions / Route Handlers

Implement admin sync actions server-side.

Acceptable options:

- Server Actions under `src/actions/market-data-actions.ts`
- Route handlers under `app/api/admin/sync/...`

Prefer the approach that fits the existing code style.

Requirements:

- Must run server-side.
- Must not expose API keys.
- Must return safe structured results.
- Must support loading/error UI on `/admin/sync`.
- Must not execute sync on page load.
- Must only run when user clicks a button.

---

## UI Requirements

The `/admin/sync` page should include sections.

### 1. Provider Configuration

Show whether each provider key is configured.

Example:

```txt
FMP: Configured / Missing
Twelve Data: Configured / Missing
Finnhub: Configured / Missing
```

Do not show the actual key.

### 2. Provider Tests

Buttons:

```txt
Test FMP Profile
Test Twelve Quote
Test Finnhub News
```

Show result output:

- Provider
- Action
- Status
- Normalized data preview
- Error message if failed

### 3. Sample Sync

Buttons:

```txt
Sync Quotes Sample
Sync Profiles Sample
```

Show result summary:

- Symbols requested
- Success count
- Error count
- Provider used
- Any failed symbols
- Whether data was persisted

### 4. Result Viewer

Show the last action result.

Use a readable JSON block or compact cards.

Avoid overly large output.

---

## Suggested Sample Symbols

Use a small fixed sample list from existing DB symbols.

Suggested fallback:

```txt
NVDA
AMD
TSLA
PLTR
SMCI
```

Prefer loading real symbols from the DB if easy.

Do not sync the full Russell 1000 in this phase.

---

## Environment Variables

Add documentation/comments if needed, but do not commit actual secrets.

Expected variables:

```txt
FMP_API_KEY=
TWELVE_DATA_API_KEY=
FINNHUB_API_KEY=
```

Rules:

- Do not commit `.env`.
- Do not commit `.env.local`.
- Do not expose keys in browser.
- Do not print keys in logs.

---

## Out of Scope

Do not build these in this phase:

- Full Russell 1000 sync.
- Full quote sync for all stocks.
- Full fundamentals sync.
- Full analyst sync.
- Full news sync.
- Historical candle sync.
- Technical calculations.
- Score recalculation.
- Alert evaluation.
- Scheduled cron jobs.
- Background jobs.
- Queue system.
- Admin authentication.
- User-facing sync controls.
- Multi-provider reconciliation.
- Provider billing/cost dashboard.
- Real-time streaming.

---

## Manual Test Checklist

### Environment

- With missing keys:
  - `/admin/sync` should load.
  - Provider status should show missing keys.
  - Test buttons should return clear missing-key errors.
  - App should not crash.

- With configured keys:
  - Provider status should show configured.
  - Test buttons should return normalized results.

### Provider Tests

- Test FMP Profile returns profile data for NVDA or clear provider error.
- Test Twelve Quote returns quote data for NVDA or clear provider error.
- Test Finnhub News returns news data for NVDA or clear provider error.

### Sample Sync

- Sync Quotes Sample runs for a small list.
- It does not exceed expected free-plan usage.
- It reports success/error counts.
- If persistence is enabled, `StockQuote` updates correctly.
- Scanner still loads after sync.

- Sync Profiles Sample runs for a small list.
- It reports success/error counts.
- If persistence is enabled, `Stock` profile fields update correctly.
- Scanner still loads after sync.

### Regression

- Dashboard still loads.
- Scanner still loads.
- Stock drawer still works.
- Add/Edit/Remove Watchlist still works.
- Create Alert still works.
- No API calls are made during Scanner render.
- No API calls are made during Dashboard render.

---

## Validation Commands

Run:

```txt
npm run build
npx prisma validate
npx prisma migrate status
```

If schema changes are made:

```txt
npx prisma migrate dev --name market-data-provider-admin-shell
npm run db:seed
```

Only use migrations if necessary.

Do not use Prisma `db push`.

---

## Acceptance Criteria

This phase is complete when:

- Provider type definitions exist.
- FMP provider client exists.
- Twelve Data provider client exists.
- Finnhub provider client exists.
- Provider functions safely handle missing API keys and errors.
- `/admin/sync` exists.
- Admin page can test FMP profile.
- Admin page can test Twelve Data quote.
- Admin page can test Finnhub news.
- Admin page can run small sample quote sync.
- Admin page can run small sample profile sync.
- API keys are never exposed to the browser.
- No full sync is implemented.
- No scheduled jobs are implemented.
- Scanner and Dashboard still read from DB only.
- Build passes.
- Prisma validation passes.
- Migration status is clean.

---

## Required Implementation Report

After implementation, provide a report:

1. Files created.
2. Files changed.
3. Provider functions implemented.
4. Whether schema changes were needed.
5. How missing API keys are handled.
6. Which buttons exist on `/admin/sync`.
7. Whether sample sync persists to DB.
8. Test results with missing keys.
9. Test results with configured keys, if keys are available.
10. Build / Prisma validation results.
11. Known issues.
12. Whether ready for browser QA.

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
