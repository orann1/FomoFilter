# Phase 9G — Admin Data Inventory Tab

## Status

Completed

---

## Goal

Add a new **Data Inventory** tab to `/admin/sync`.

The goal is to provide a physical, DB-backed view of the current stock data stored in FomoFilter.

This tab should help answer:

- Which stocks exist in the DB?
- Which universes do they belong to?
- Which profile fields are available?
- Which quote fields are available?
- Which provider/source supplied each field?
- Which stocks have scores?
- Which stocks are currently eligible for the Scanner?
- Which data is missing and why?

This phase is a visibility/admin phase.

It must not add new sync actions, new external API calls, scoring logic, or Scanner behavior changes.

---

## Why This Phase Is Needed

After Phase 9F, Nasdaq 100 quote snapshots are stored in the DB, but `/scanner` does not show those stocks yet because the Scanner currently requires `StockScore` rows.

Current Scanner logic requires:

```ts
quote: { isNot: null }
score: { isNot: null }
```

Nasdaq 100 stocks now have `StockQuote` rows, but most or all do not yet have `StockScore` rows.

Because of this, we need a DB visibility screen that shows the real state of stored data before we continue adding fundamentals, analyst data, scoring, or Scanner expansion.

The new tab should become the admin source of truth for:

```txt
What data do we currently have?
Where did it come from?
What is missing?
Why is a stock not visible in the Scanner?
```

---

## Current Data Context

After Phase 9F, the system should have:

### Nasdaq 100 Membership

- 100 active Nasdaq 100 members.
- Membership source: `static_fallback`.
- Stored in `StockUniverseMember`.

### Profile / Reference Data

Profile enrichment was previously done through FMP.

Typical fields may include:

- Company name.
- Exchange.
- Sector.
- Industry.
- Market cap.

### Quote Snapshot Data

Nasdaq 100 quote snapshots are now synced through Finnhub.

Finnhub quote provides:

- Price.
- Change percent.
- Open.
- Day high.
- Day low.
- Previous close.
- Timestamp / source updated timestamp.

Finnhub `/quote` does **not** provide volume.

Volume should therefore be:

- Existing value if already present from a different provider.
- `N/A` if not available.
- Never labeled as Finnhub if Finnhub did not supply it.

### Scanner Visibility

Nasdaq 100 stocks may not appear in `/scanner` yet because they are missing `StockScore`.

This is expected and should be visible in the new Data Inventory tab.

---

## Scope

Build a new tab in `/admin/sync`:

```txt
Data Inventory
```

The tab should render a table:

```txt
Stock Data Inventory
```

The table should display all stocks currently stored in the DB.

Expected current count is around 104 stocks, but the implementation must not hardcode this number.

---

## Non-Scope

Do not build the following in this phase:

- New sync actions.
- New API provider calls.
- External API calls from this tab.
- New routes.
- Scanner redesign.
- Scanner filter changes.
- StockScore calculation.
- Fundamentals sync.
- Analyst sync.
- Candles sync.
- Technical indicators.
- Cron jobs.
- Background jobs.
- Alert evaluation.
- New provider integrations.

This phase reads existing DB data only.

---

## Core Rule

The Data Inventory tab must be DB-only.

Allowed:

```txt
Prisma DB query
Server-side loader
Existing DB relations
Derived DB-backed status fields
```

Not allowed:

```txt
Finnhub API call
FMP API call
Twelve Data API call
Any fetch to an external provider
Client-side API call to refresh data
localStorage-based data state
Hardcoded stock counts
```

---

## Tab Placement

Add the tab inside the existing `/admin/sync` page.

Current tabs include:

- Overview.
- Sync Actions.
- Provider Tests.
- Sync History.

Add:

```txt
Data Inventory
```

Recommended order:

```txt
Overview
Data Inventory
Sync Actions
Provider Tests
Sync History
```

`Data Inventory` should be easy to find.

---

## Table Header Structure

The table must use a two-row header.

### Header Row 1 — Parameter Name

Shows the field/parameter name.

Example:

```txt
Symbol | Company Name | Price | Change % | Open | Day High | Day Low | Previous Close | Volume | Has Score | Scanner Eligible
```

### Header Row 2 — Data Source

Shows the source of that parameter.

Example:

```txt
DB | FMP | Finnhub | Finnhub | Finnhub | Finnhub | Finnhub | Finnhub | Twelve Data / N/A | Internal | Internal
```

### Stock Rows

Stock rows begin below the two header rows.

Example concept:

| Symbol | Company Name | Price | Change % | Open | Day High | Day Low | Previous Close | Volume | Has Score | Scanner Eligible |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- | --- |
| DB | FMP | Finnhub | Finnhub | Finnhub | Finnhub | Finnhub | Finnhub | Twelve Data / N/A | Internal | Internal |
| AAPL | Apple Inc. | 198.20 | 1.4% | 196.00 | 199.10 | 195.80 | 195.40 | N/A | No | No — Missing score |

The actual UI does not need to look exactly like this markdown table, but it must visually show:

```txt
Parameter name
Source label under the parameter name
Stock values below
```

---

## Allowed Source Labels

Not every source is an external provider.

Allowed source labels:

```txt
DB
Static Fallback
FMP
Finnhub
Twelve Data
Internal
Mixed
N/A
```

Use short labels to keep the table readable.

---

## Recommended Columns

Include these columns if the data exists or can be derived safely from current DB relations.

### Identity / Profile

| Column | Source Label | Notes |
| --- | --- | --- |
| Symbol | DB | From `Stock.symbol` |
| Company Name | FMP / DB | Use FMP if profile-enriched; DB if only stored stock name is available |
| Exchange | FMP | If stored |
| Sector | FMP | If stored |
| Industry | FMP | If stored |
| Market Cap | FMP | If stored |

### Universe

| Column | Source Label | Notes |
| --- | --- | --- |
| In Nasdaq 100 | Static Fallback / DB | Derived from active `StockUniverseMember` |
| Universe Source | DB | Show actual membership source, e.g. `static_fallback` |
| Membership Active | DB | Yes/No |
| Membership Last Seen | DB | `lastSeenAt` if available |
| Membership Removed At | DB | Optional, if useful |

### Quote Snapshot

| Column | Source Label | Notes |
| --- | --- | --- |
| Has Quote | DB | Yes/No |
| Price | Finnhub / actual quote source | Prefer `StockQuote.source` if present |
| Change % | Finnhub / actual quote source | Prefer `StockQuote.source` if present |
| Open | Finnhub / actual quote source | Prefer `StockQuote.source` if present |
| Day High | Finnhub / actual quote source | Prefer `StockQuote.source` if present |
| Day Low | Finnhub / actual quote source | Prefer `StockQuote.source` if present |
| Previous Close | Finnhub / actual quote source | Prefer `StockQuote.source` if present |
| Volume | Twelve Data / N/A / actual source | Do not label volume as Finnhub unless Finnhub actually supplied it |
| Quote Source | DB | `StockQuote.source` |
| Quote Last Synced | DB | `StockQuote.lastSyncedAt` |
| Quote Source Updated | Finnhub / actual quote source | `StockQuote.sourceUpdatedAt` |

### Scanner / Internal Status

| Column | Source Label | Notes |
| --- | --- | --- |
| Has Score | Internal | Whether `StockScore` exists |
| Scanner Eligible | Internal | Based on current Scanner rules |
| Missing Reason | Internal | Explain why not scanner eligible |

### Optional Useful Columns

Add only if easy and already available from DB relations:

| Column | Source Label | Notes |
| --- | --- | --- |
| In Watchlist | DB | Yes/No |
| Has Active Alert | DB | Yes/No |
| Created At | DB | If useful |
| Updated At | DB | If useful |

Do not add columns that require a new provider call.

---

## Per-Cell Source Rules

### General Rule

If a field has an actual stored source value, use it.

For example:

```txt
Price source = StockQuote.source
Quote Source = DB
Universe Source = StockUniverseMember.source
```

### Quote Fields

For quote fields, prefer the actual quote source:

```txt
StockQuote.source
```

If `StockQuote.source = finnhub`, then:

- Price source = Finnhub.
- Change % source = Finnhub.
- Open source = Finnhub.
- Day High source = Finnhub.
- Day Low source = Finnhub.
- Previous Close source = Finnhub.
- Quote Source source label = DB.

Volume is different.

Since Finnhub `/quote` does not return volume:

- If volume is null: source label should be `N/A`.
- If volume exists from a previous provider and source cannot be separated per field: show the value, but label source carefully as `Mixed` or `DB`.
- Do not label volume as Finnhub unless the implementation can prove Finnhub supplied it.

### Profile Fields

If current DB does not track profile-field source per field, use the planned/current known source label:

```txt
FMP
```

For example:

- Company Name → FMP / DB.
- Exchange → FMP.
- Sector → FMP.
- Industry → FMP.
- Market Cap → FMP.

If the exact source is unknown, use:

```txt
DB
```

or:

```txt
Mixed
```

Do not invent provider attribution.

### Internal Fields

Fields calculated by the app should use:

```txt
Internal
```

Examples:

- Has Score.
- Scanner Eligible.
- Missing Reason.

### Static Fallback Fields

Universe membership fields should show:

```txt
Static Fallback / DB
```

or use the actual stored membership source:

```txt
static_fallback
```

---

## Data Loader

Create a server-side data loader.

Suggested file:

```txt
src/lib/data/admin-stock-data.ts
```

Suggested function:

```ts
getAdminStockDataInventory()
```

The loader should query stocks with relevant relations.

Suggested includes, adjusted to match the actual Prisma schema:

```ts
stock.findMany({
  include: {
    quote: true,
    score: true,
    universeMemberships: true,
    watchlistItems: true,
    alertRules: true,
  },
})
```

Use the actual relation names from the Prisma schema.

Do not guess relation names if they differ.

Return a clean view model to the client.

---

## Suggested View Model

The final structure can vary, but it should be clean and table-friendly.

Example:

```ts
type AdminStockDataInventoryRow = {
  id: string;
  symbol: string;
  companyName: string | null;
  exchange: string | null;
  sector: string | null;
  industry: string | null;
  marketCap: string | null;

  inNasdaq100: boolean;
  universeSource: string | null;
  membershipActive: boolean;
  membershipLastSeenAt: string | null;

  hasQuote: boolean;
  price: string | null;
  changePercent: string | null;
  open: string | null;
  dayHigh: string | null;
  dayLow: string | null;
  previousClose: string | null;
  volume: string | null;
  quoteSource: string | null;
  quoteLastSyncedAt: string | null;
  quoteSourceUpdatedAt: string | null;

  hasScore: boolean;
  scannerEligible: boolean;
  missingReason: string;

  inWatchlist?: boolean;
  hasActiveAlert?: boolean;
};
```

Use strings for formatted display if that matches existing Admin UI patterns.

---

## Scanner Eligible Logic

Add derived fields:

```txt
scannerEligible
missingReason
```

Use the current Scanner behavior.

Current Scanner requirement:

```txt
stock is active
quote exists
score exists
```

Therefore:

```txt
scannerEligible = true only if:
- stock is active
- StockQuote exists
- StockScore exists
```

Suggested missing reason logic:

```txt
if stock inactive:
  Inactive stock
else if no quote:
  Missing quote
else if no score:
  Missing score
else:
  Ready for scanner
```

For Nasdaq 100 stocks after Phase 9F, expected result is usually:

```txt
Scanner Eligible: No
Missing Reason: Missing score
```

Do not change Scanner filtering in this phase.

---

## UI Requirements

The Data Inventory tab should be readable for 100+ rows.

Recommended UI:

- Horizontal scroll.
- Compact table rows.
- Two-row sticky header if simple to implement.
- Clear Yes/No badges.
- `N/A` for missing values.
- Clean number formatting.
- Clean date formatting.
- Avoid over-design.

Recommended but optional if small and safe:

- Search by symbol/company.
- Filter: All / Missing Score / Missing Quote / Scanner Eligible.
- Filter: Nasdaq 100 only.
- Small summary cards above the table.

Do not overbuild.

---

## Suggested Summary Cards

Add summary cards at the top of the Data Inventory tab if easy.

Examples:

```txt
Total Stocks
With Quote
Missing Quote
With Score
Scanner Eligible
Nasdaq 100 Active
```

These should be DB-backed from the rows, not hardcoded.

---

## Formatting Rules

### Missing Values

Use:

```txt
N/A
```

Do not show empty strings.

### Booleans

Use readable values:

```txt
Yes
No
```

Optional badges are fine.

### Numbers

Format reasonably:

- Price: 2 decimals.
- Percent: 2 decimals + `%`.
- Market cap: compact format if already available.
- Large numbers: compact or comma format.

### Dates

Use readable short date/time format.

Example:

```txt
22 May 14:03
```

or the existing project date format.

---

## Source Row Visual Style

The second header row should be visually lighter than the parameter-name row.

Recommended styling:

- Smaller text.
- Muted color.
- Uppercase or small caps if consistent.
- No large visual noise.

Example:

```txt
Price
Finnhub
```

This should appear inside the header, not repeated for every row.

---

## Data Integrity Requirements

The table must accurately show current DB state.

Do not:

- Pretend a field exists if it is null.
- Show provider attribution that is not known.
- Show Finnhub as the source for volume if Finnhub does not return volume.
- Mark Scanner Eligible as Yes without a score.
- Hide stocks that are missing data.
- Filter out stocks without quotes or scores by default.

This is an inventory table, so missing data is part of the point.

---

## Performance Requirements

The current DB stock count is small enough for a single admin table.

Still:

- Use a server-side loader.
- Avoid external calls.
- Avoid per-row client fetches.
- Avoid expensive repeated calculations on the client.
- Keep the view model compact.

Pagination is not required for ~100 stocks.

If the table later grows to Russell 1000, pagination/virtualization can be added in a future phase.

---

## Browser QA Checklist

Open:

```txt
/admin/sync
```

Go to:

```txt
Data Inventory
```

Confirm:

1. The tab appears.
2. The table title is visible:
   ```txt
   Stock Data Inventory
   ```
3. The table loads all stocks from the DB.
4. Nasdaq 100 stocks are visible.
5. Rows are not filtered out just because they are missing score.
6. The header has two rows:
   - parameter names
   - source labels.
7. Source labels are visible under the parameter names.
8. Quote fields are visible for synced Nasdaq 100 stocks:
   - price
   - change %
   - open
   - day high
   - day low
   - previous close
   - quote source
   - quote last synced
9. Quote source shows `finnhub` for Phase 9F quote rows.
10. Volume shows `N/A` or an existing value, but is not incorrectly labeled as Finnhub if Finnhub did not provide it.
11. Has Score shows `No` for Nasdaq 100 stocks without `StockScore`.
12. Scanner Eligible shows `No` for stocks missing score.
13. Missing Reason shows `Missing score` for Nasdaq 100 quote-only stocks.
14. Existing seeded scanner stocks with quote + score show `Scanner Eligible = Yes`, if applicable.
15. No external API calls happen when opening the tab.
16. Existing Admin tabs still work.
17. Existing sync actions still work.
18. The table is readable with horizontal scroll if needed.

---

## Validation

Run:

```txt
npm run build
npx tsc --noEmit
npx prisma validate
npx prisma migrate status
```

No Prisma migration should be needed for this phase.

If a migration appears necessary, stop and report why before adding one.

---

## Required Implementation Report

Return a concise report in English only with:

1. Files created.
2. Files changed.
3. New or updated data loader.
4. Relations used in the DB query.
5. Columns added to the Data Inventory table.
6. Source row labels used.
7. Scanner Eligible logic.
8. Missing Reason logic.
9. Summary cards added, if any.
10. Whether search/filter was added.
11. Whether any migration was needed.
12. Browser QA result.
13. Automated check results.
14. Known issues.
15. Ready for commit or not.

---

## Acceptance Criteria

Phase 9G is complete when:

- `/admin/sync` has a new `Data Inventory` tab.
- The tab shows a DB-backed table of all stocks.
- The table has a two-row header:
  - parameter names.
  - source labels.
- The table shows current identity/profile, universe, quote, and internal/scanner status fields.
- Nasdaq 100 stocks are visible even without scores.
- Quote fields synced by Finnhub are visible.
- Volume is not incorrectly attributed to Finnhub.
- Scanner Eligible and Missing Reason explain why stocks do or do not appear in `/scanner`.
- No external APIs are called from the tab.
- No Scanner behavior is changed.
- No scoring is added.
- No migration is added unless explicitly justified.
- Build passes.
- TypeScript passes.
- Prisma validate passes.
- Prisma migrate status is clean.

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