# Current Feature

## Feature Name

Scanner Phase 8 — Market Universe Definition

## Status

Completed

---

## Feature Reference

This feature is part of the broader Scanner roadmap.

Read the full Scanner feature roadmap before implementation:

```txt
Context/Features/scanner-full-roadmap.md
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

Add database-backed market universe support to FomoFilter so the Scanner can work from a clearly defined stock universe instead of simply loading every stock in the database.

The first base scanning universe is:

```txt
Russell 1000
```

Important product meaning:

Russell 1000 is not used because the index itself is the investment focus. It is used as a practical base universe for large and mid-cap US-listed stocks.

The Scanner should also classify stocks by index membership:

```txt
S&P 500
Nasdaq 100
Russell 1000 Only
```

`Russell 1000 Only` is not a real index and should not be stored as a separate universe. It should be calculated as:

```txt
Member of Russell 1000
AND not member of S&P 500
AND not member of Nasdaq 100
```

---

## Product Value

This phase prepares the Scanner to answer:

> Which group of US stocks am I scanning?

Instead of scanning a random list of seeded stocks, the Scanner should be able to load stocks from a selected base universe and filter them by index classification.

This is the foundation for future phases:

- Real Russell 1000 import
- S&P 500 / Nasdaq 100 classification
- Live market data sync
- Scoring engine
- Ranking logic
- Alert evaluation

---

## Current State

The Scanner page already exists and works with DB-backed data.

Already completed:

- `/scanner` route
- DB-backed scanner loader
- Search
- View pills
- Filters
- Sorting
- Desktop scanner table
- Mobile scanner cards
- Reused `StockPreviewDrawer`
- DB-backed Add/Edit/Remove Watchlist
- DB-backed Create Alert
- Alert Active indication
- No duplicate drawer/actions

Current limitation:

The Scanner currently loads stocks from the database without a proper universe model. There is no structured way to say:

- This stock belongs to Russell 1000
- This stock belongs to S&P 500
- This stock belongs to Nasdaq 100
- This stock is Russell 1000 only
- This is the default scanning universe

---

## Important Product Decisions

### 1. Base Universe

Use `Russell 1000` as the first base universe.

Reason:

- It represents a broad set of large and mid-cap US stocks.
- It is wide enough to find less obvious opportunities.
- It is less noisy than scanning all NYSE/Nasdaq stocks.
- It is more useful for this product than starting only with S&P 500 or Nasdaq 100.

### 2. Index Classification

Stocks can belong to multiple universes/indexes.

Examples:

```txt
NVDA → Russell 1000, S&P 500, Nasdaq 100
JPM  → Russell 1000, S&P 500
SOFI → Russell 1000 only
```

### 3. Russell 1000 Only

Do not create `Russell 1000 Only` as a DB universe.

It should be derived in query/filter logic.

### 4. No Price-Based Eligibility Filter

Do not exclude stocks because their price is below `$5`.

Reason:

- Russell 1000 already limits the universe to larger/more relevant companies.
- Low share price does not automatically mean low-quality company.
- Price should be a Scanner filter later, not a hard universe-level exclusion.

### 5. Exclusions

The universe should eventually exclude non-common-stock instruments:

- ETFs
- Funds
- Warrants
- Units
- Preferred shares
- OTC securities
- Inactive/delisted stocks

For this phase, only add fields needed to support this if missing. Do not overbuild eligibility logic yet.

---

## Implementation Scope

### Build in This Phase

1. Add DB support for stock universes.
2. Add DB support for stock-universe membership.
3. Seed system universes:
   - Russell 1000
   - S&P 500
   - Nasdaq 100
4. Temporarily assign existing seeded stocks to universes for demo/testing purposes.
5. Update Scanner data loading so it can filter by selected universe.
6. Add a simple Universe selector to the Scanner UI.
7. Add an Index filter to the Scanner UI.
8. Keep Scanner visual behavior mostly unchanged.
9. Keep all existing Scanner search/filter/sort/drawer functionality working.

---

## Out of Scope

Do not build these in this phase:

- External market API integration
- Real Russell 1000 import
- Real S&P 500 import
- Real Nasdaq 100 import
- Automated index membership sync
- Live quote sync
- Scoring engine
- Setup classification engine
- Alert evaluation engine
- Stock details page
- Watchlist page
- Alerts page
- Auth
- User-created custom universes
- Universe management UI
- Price/volume/market-cap eligibility filters
- Multi-universe selection
- Advanced universe analytics

---

## Required Investigation Before Code Changes

Before implementing, inspect the current schema and code.

Report briefly:

1. What fields already exist on `Stock` that relate to:
   - exchange
   - country
   - currency
   - isActive
   - security type / instrument type
   - ETF/ADR flags
2. Whether `StockUniverse` already exists.
3. Whether `StockUniverseMember` already exists.
4. Whether any existing table already supports many-to-many universe membership.
5. Whether a Prisma migration is required.
6. What changes are needed in `seed.ts`.
7. What changes are needed in `getScannerData()`.

Do not create duplicate models or fields.

---

## Proposed Prisma Changes

Only add these if they do not already exist.

### Enum

```prisma
enum StockUniverseType {
  BASE_UNIVERSE
  INDEX
  THEME
  CUSTOM
}
```

### StockUniverse

```prisma
model StockUniverse {
  id          String            @id @default(cuid())
  name        String
  slug        String            @unique
  description String?
  type        StockUniverseType
  isDefault   Boolean           @default(false)
  isSystem    Boolean           @default(true)
  createdAt   DateTime          @default(now())
  updatedAt   DateTime          @updatedAt

  members     StockUniverseMember[]

  @@index([type])
  @@index([isDefault])
}
```

### StockUniverseMember

```prisma
model StockUniverseMember {
  stockId    String
  universeId String
  addedAt    DateTime @default(now())

  stock       Stock         @relation(fields: [stockId], references: [id], onDelete: Cascade)
  universe    StockUniverse @relation(fields: [universeId], references: [id], onDelete: Cascade)

  @@id([stockId, universeId])
  @@index([universeId])
  @@index([stockId])
}
```

### Stock Model Relation

Add relation to `Stock` only if missing:

```prisma
universeMemberships StockUniverseMember[]
```

### Optional Stock Fields

Before adding these, check what already exists.

Add only minimal missing fields if useful now:

```prisma
securityType String?
isEtf        Boolean @default(false)
isAdr        Boolean @default(false)
```

Do not add price, volume, or market-cap eligibility rules in this phase.

---

## Seed Requirements

Update `prisma/seed.ts`.

The seed must remain idempotent.

Create/upsert these system universes:

| Name | Slug | Type | Default |
| --- | --- | --- | --- |
| Russell 1000 | `russell-1000` | `BASE_UNIVERSE` | `true` |
| S&P 500 | `sp-500` | `INDEX` | `false` |
| Nasdaq 100 | `nasdaq-100` | `INDEX` | `false` |

### Temporary Demo Membership

Because real index import is not part of this phase:

- Assign all currently seeded stocks to `Russell 1000`.
- Assign reasonable demo stocks to `S&P 500` and/or `Nasdaq 100` only for UI testing.
- Do not treat seeded membership as authoritative market data.

Example demo assignment:

```txt
NVDA → Russell 1000, S&P 500, Nasdaq 100
AMD  → Russell 1000, S&P 500, Nasdaq 100
TSLA → Russell 1000, S&P 500, Nasdaq 100
PLTR → Russell 1000, S&P 500
SMCI → Russell 1000
```

If exact membership is uncertain, keep the demo assignment simple and document it in code comments.

### Idempotency

Running seed multiple times must not create duplicate:

- universes
- universe memberships
- stocks

Use `upsert`, composite keys, or controlled cleanup patterns.

---

## Scanner Data Loader Requirements

Update:

```txt
src/lib/data/scanner.ts
```

The loader should support a selected universe.

Suggested function signature:

```ts
getScannerData({
  universeSlug?: string;
  indexFilter?: string;
})
```

Or equivalent.

Default behavior:

```txt
universeSlug = "russell-1000"
```

The loader should:

1. Load available universes needed by the Scanner UI.
2. Load stocks that are members of the selected base universe.
3. Include index membership data for each stock.
4. Compute derived classification:
   - `isSp500`
   - `isNasdaq100`
   - `isRussell1000`
   - `isRussell1000Only`
5. Preserve all existing fields needed by the Scanner table, mobile cards, and drawer.
6. Preserve all watchlist and alert states.

### Important

Do not break the prop shape expected by:

```txt
StockPreviewDrawer
ScannerPageClient
ScannerTable
MobileScannerCard
```

If the data contract needs small additions, add them carefully.

---

## Scanner UI Requirements

Update the Scanner page UI.

### Universe Selector

Add a simple Universe selector to the Scanner controls area.

Initial options:

```txt
Russell 1000
```

If the DB returns more universes later, the selector should be ready to show them.

For this phase, it is acceptable if only `Russell 1000` is available.

### Index Filter

Add an index filter with these options:

```txt
All
S&P 500
Nasdaq 100
Russell 1000 Only
```

Behavior:

- `All`: show all stocks in selected base universe.
- `S&P 500`: show stocks that are members of S&P 500.
- `Nasdaq 100`: show stocks that are members of Nasdaq 100.
- `Russell 1000 Only`: show stocks that are in Russell 1000 but not in S&P 500 or Nasdaq 100.

### Scanner Table

The table can optionally show a compact index label/badge.

Examples:

```txt
S&P 500
Nasdaq 100
Russell 1000 Only
```

Do not overcrowd the table.

If adding an index badge makes the table too crowded, keep it only in the drawer or mobile card for now.

### Mobile Cards

Mobile cards may show a compact index badge if space allows.

---

## Data Contract Additions

Add fields only if needed.

Suggested additions to scanner stock shape:

```ts
type ScannerStock = {
  // existing fields...

  universeSlugs: string[];
  indexLabels: string[];

  isSp500: boolean;
  isNasdaq100: boolean;
  isRussell1000: boolean;
  isRussell1000Only: boolean;
};
```

Do not remove existing fields.

---

## Filtering Logic

The new index filter should work together with existing filters:

- Search
- View pills
- Sector filter
- Risk filter
- Setup filter
- Watchlist toggle
- Alert Active toggle
- Sorting

Clear filters should reset the index filter to:

```txt
All
```

Universe selector should remain:

```txt
Russell 1000
```

unless the user changed it and there are multiple universes available.

---

## Validation Requirements

Run:

```txt
npm run build
npx prisma validate
npx prisma migrate status
```

If schema changes are added:

```txt
npx prisma migrate dev --name add-stock-universes
```

After migration:

```txt
npm run db:seed
```

Only use Prisma migration workflow. Do not use `db push`.

---

## Manual Test Checklist

### Database

- `StockUniverse` table exists.
- `StockUniverseMember` table exists.
- Seed creates `Russell 1000`, `S&P 500`, and `Nasdaq 100`.
- Existing stocks are members of `Russell 1000`.
- Some demo stocks are members of S&P 500 and/or Nasdaq 100.
- Seed can run twice without duplicates.

### Scanner

- `/scanner` loads successfully.
- Default universe is `Russell 1000`.
- Universe selector shows `Russell 1000`.
- Index filter shows:
  - All
  - S&P 500
  - Nasdaq 100
  - Russell 1000 Only
- `All` shows all selected-universe stocks.
- `S&P 500` shows only S&P 500 members.
- `Nasdaq 100` shows only Nasdaq 100 members.
- `Russell 1000 Only` shows only stocks not in S&P 500 or Nasdaq 100.
- Existing search/filter/sort behavior still works.
- Drawer still opens from Scanner.
- Add/Edit/Remove Watchlist still works from Scanner.
- Create Alert still works from Scanner.
- Alert Active still works.
- Mobile scanner still works.

### Dashboard

- Dashboard still loads.
- Dashboard drawer still works.
- Existing dashboard widgets are unaffected.

---

## Acceptance Criteria

This phase is complete when:

- Stock universe support exists in the DB.
- Russell 1000, S&P 500, and Nasdaq 100 are seeded as system universes.
- Existing stocks are assigned to Russell 1000 for now.
- The Scanner loads stocks from the selected base universe.
- The Scanner has a Universe selector.
- The Scanner has an Index filter.
- `Russell 1000 Only` is derived, not stored as a separate universe.
- No price filter is used as a universe eligibility rule.
- No external API is connected.
- No real index import is implemented.
- Existing Scanner features still work.
- Build passes.
- Prisma validation passes.
- Migration status is clean.
- Seed is idempotent.

---

## Notes for AI Agent

- Investigate existing schema before changing it.
- Avoid duplicate models and fields.
- Keep this phase focused on universe structure and scanner filtering.
- Do not connect external APIs.
- Do not implement real Russell/S&P/Nasdaq import.
- Do not rewrite scanner or drawer.
- Keep existing working dashboard/scanner behavior intact.
- If a schema change is needed, use Prisma migrations only.
- If unsure about demo index membership, use simple documented seed assumptions.

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
