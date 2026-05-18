# Current Feature

## Feature Name

Scanner Phase 7 — Scanner Page Foundation

## Status

Completed

---

## Feature Spec Reference

Before implementing this feature, read the full Scanner feature specification:

```txt
Context/Fetures/scanner-feature-spec.md
```

This `current-feature.md` is the active implementation plan for the first Scanner development phase only.  
The full feature spec contains the broader Scanner vision, future phases, filters, scoring ideas, DB context, and long-term roadmap.

> Important: Use the path exactly as written above if the project folder is named `Fetures`. If this is a typo and the real folder is `Features`, use the real project path.

---

## Context

FomoFilter already has:

- A DB-backed dashboard using Prisma and Neon
- A responsive app shell with sidebar and top bar
- Hot Stocks table and mobile stock cards
- Stock Preview Drawer
- Add/Edit/Remove Watchlist actions persisted with Prisma
- Create Alert action persisted with Prisma
- Alert Active indicator
- Existing reusable dashboard components and drawer actions

This phase adds the first version of the dedicated Scanner page.

The Scanner is the main discovery workspace for FomoFilter.  
It should help users search, filter, sort, and inspect stocks using the existing seeded/DB-backed data.

The goal is to create the foundation of the Scanner page without building live market API integration, scoring engine recalculation, advanced saved views, or new database models.

---

## Primary Goal

Build a new `/scanner` page that displays a full-page stock discovery workspace using the existing Prisma-backed stock data.

The page should allow users to:

- Browse scanner stocks
- Search by ticker or company
- Filter by basic fields
- Sort by important metrics
- Switch between predefined scanner views
- Open the existing Stock Preview Drawer from any stock row/card
- Use existing drawer actions: Add/Edit/Remove Watchlist and Create Alert

This phase should make the Scanner feel like a real workspace, not just a copied dashboard widget.

---

## Important Scope Decision

This phase is **Scanner Page Foundation** only.

Use existing scores and existing seeded/DB data.

Do not build:

- A new scoring engine
- External market data API integration
- Live price sync
- AI-generated scanner results
- Saved custom views
- Complex pagination
- Auth
- New Prisma models unless absolutely required

---

## Build in This Phase

### 1. New Scanner Route

Create a new route:

```txt
/scanner
```

The page should render inside the existing app shell style.

Recommended page title:

```txt
Scanner
Discover hot stocks, filter FOMO, and find setups worth tracking.
```

---

### 2. Scanner Data Loader

Create a dedicated server-side data loader if needed, for example:

```txt
src/lib/data/scanner.ts
```

The loader should use Prisma and return a clean scanner data shape.

It may reuse existing logic from:

```txt
src/lib/data/dashboard.ts
```

but avoid duplicating large blocks of logic if a shared helper would be cleaner.

The loader should return enough data for:

- Scanner table/cards
- Watchlist state
- Active alert state
- Existing Stock Preview Drawer props

Do not read directly from `src/lib/mock-data.ts` at runtime for scanner data.

---

### 3. Scanner Data Contract

Define or use a clear data shape for scanner rows.

Suggested shape:

```ts
export type ScannerStock = {
  symbol: string;
  name: string;
  sector: string | null;
  industry?: string | null;
  price: number;
  changePercent: number;
  weekChangePercent?: number | null;
  monthChangePercent?: number | null;
  relativeVolume: number | null;
  marketCap: string | null;
  analystTarget?: number | null;
  analystUpside: number | null;
  analystRating?: string | null;
  hotScore: number;
  opportunityScore: number;
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "EXTREME";
  setupStatus: string;
  catalyst: string | null;
  inWatchlist: boolean;
  hasActiveAlerts: boolean;
};
```

Use the actual DB fields and existing types where appropriate.  
Do not create duplicate types if an equivalent shared type already exists.

---

### 4. Scanner Page Layout

The scanner page should include:

1. Header
2. Top controls
3. Predefined scanner view pills
4. Filter controls
5. Sort control
6. Result count
7. Desktop stock table
8. Mobile stock cards
9. Existing Stock Preview Drawer integration
10. Empty state when no results match filters

Suggested layout:

```txt
ScannerPage
├── AppShell / existing layout
├── ScannerHeader
├── ScannerControls
│   ├── Search input
│   ├── Sort dropdown
│   └── Optional compact filters
├── ScannerViewPills
├── ScannerResults
│   ├── DesktopScannerTable
│   └── MobileScannerCards
└── StockPreviewDrawer
```

---

## Scanner Views

Add predefined view pills/tabs.

Initial views:

| View | Purpose |
| --- | --- |
| Hot Today | Highest Hot Score / strongest movers |
| Strong Momentum | Stocks with strong short-term movement |
| Best Opportunities | High Opportunity Score |
| Unusual Volume | Stocks with high relative volume |
| FOMO Risk | Hot stocks with higher risk or stretched setup |
| In Watchlist | Stocks already tracked by the user |
| Alert Active | Stocks with active alert rules |

For Phase 7, these can be implemented as client-side filters/sorts over the loaded data.

Do not build saved custom views yet.

---

## Filters

Implement basic filters only.

Recommended Phase 7 filters:

| Filter | Behavior |
| --- | --- |
| Search | Match ticker or company name |
| Sector | All + available sectors from data |
| Risk | All / Low / Medium / High / Extreme |
| Setup | All + available setup statuses |
| Watchlist only | Show only stocks in user watchlist |
| Alert active only | Show only stocks with active alerts |

Keep filters simple and reliable.

Do not implement advanced filter builder yet.

---

## Sorting

Implement a simple sort dropdown.

Recommended sort options:

| Sort | Default Direction |
| --- | --- |
| Best Signal | Desc |
| Hot Score | Desc |
| Opportunity Score | Desc |
| Daily Change | Desc |
| Relative Volume | Desc |
| Analyst Upside | Desc |
| Market Cap | Desc |
| Symbol | Asc |

### Best Signal

For Phase 7, `Best Signal` can be a simple client-side calculated sort.

Suggested formula:

```ts
bestSignal =
  hotScore * 0.4 +
  opportunityScore * 0.4 +
  analystUpsideScore * 0.1 -
  riskPenalty * 0.1
```

Keep it simple.  
Do not build the final scoring engine in this phase.

If this formula is too much for Phase 7, sort by a weighted combination of existing Hot Score and Opportunity Score only.

---

## Desktop Table Requirements

The desktop scanner table should be richer than the dashboard Hot Stocks preview table.

Recommended columns:

- Star / watchlist state
- Symbol + company name
- Sector
- Price
- Daily change %
- Hot Score
- Opportunity Score
- Risk
- Setup
- Relative Volume
- Analyst Upside
- Catalyst
- Alert indicator

Behavior:

- Row hover state
- Selected row state when drawer is open
- Clicking row opens existing StockPreviewDrawer
- Star should reflect current DB-backed watchlist state
- Alert indicator should reflect current DB-backed active alerts
- Table should remain readable with horizontal overflow if needed

Do not build inline editing inside the table.

---

## Mobile Requirements

On mobile, do not use a wide table.

Use stock cards.

Each card should show:

- Symbol
- Company name
- Price
- Daily change %
- Hot Score
- Opportunity Score
- Risk
- Setup
- Catalyst
- Watchlist star
- Alert Active indicator if applicable

Clicking a mobile card should open the existing full-screen mobile drawer.

---

## Drawer Reuse Requirements

Do not build a new drawer.

Reuse the existing:

```txt
src/components/dashboard/StockPreviewDrawer.tsx
```

or extract it to a more generic shared location if needed.

Important:

- Avoid large refactors unless necessary.
- If moving the drawer component, preserve all existing dashboard behavior.
- Drawer actions must still work:
  - Add to Watchlist
  - Edit Watchlist
  - Remove from Watchlist
  - Create Alert
  - Alert Active indicator
  - Existing alerts list

The scanner should pass the same kind of data needed by the drawer.

---

## Suggested Components

Create scanner-specific components under:

```txt
src/components/scanner/
```

Suggested components:

```txt
src/components/scanner/ScannerHeader.tsx
src/components/scanner/ScannerControls.tsx
src/components/scanner/ScannerViewPills.tsx
src/components/scanner/ScannerFilters.tsx
src/components/scanner/ScannerTable.tsx
src/components/scanner/MobileScannerCard.tsx
src/components/scanner/ScannerResults.tsx
```

If some existing dashboard components can be reused cleanly, reuse them.  
Do not duplicate large components unnecessarily.

---

## Suggested Files

Potential new files:

```txt
src/app/scanner/page.tsx
src/lib/data/scanner.ts
src/components/scanner/ScannerPageClient.tsx
src/components/scanner/ScannerHeader.tsx
src/components/scanner/ScannerControls.tsx
src/components/scanner/ScannerViewPills.tsx
src/components/scanner/ScannerFilters.tsx
src/components/scanner/ScannerTable.tsx
src/components/scanner/MobileScannerCard.tsx
```

Use client components only where interactive state is needed:

- search
- filters
- sorting
- selected stock drawer state

Keep Prisma and DB loading server-side only.

---

## UI / UX Direction

The Scanner should feel like a professional stock discovery workspace.

Visual direction:

- Same dark theme as dashboard
- Same card/table language
- Same score pills and risk badges
- Same watchlist star style
- Same alert badge style
- Compact but readable
- Data-dense, but not overwhelming

The page should feel more focused than the dashboard.

Dashboard = overview  
Scanner = discovery workspace

---

## Empty States

Add a simple empty state when filters return no results.

Example:

```txt
No stocks match your filters.
Try clearing search or changing the selected view.
```

Add a clear reset filters action if simple.

---

## Out of Scope

Do not build these in this phase:

- External market data API
- Live quote refresh
- Scoring engine calculation
- Saved custom scanner views
- User-created scanner filters
- URL query parameter sync
- Pagination
- CSV export
- AI search
- Full Stock Details page
- Full Watchlist page
- Full Alerts page
- Auth
- New Prisma models
- Prisma migration unless absolutely required
- Alert evaluation engine
- Notification delivery

---

## Implementation Notes for AI Agent

Follow project files:

- `Context/CLAUDE.md`
- `Context/project-overview.md`
- `Context/coding-standards.md`
- `Context/ai-interaction.md`
- `Context/current-feature.md`
- `Context/Fetures/scanner-feature-spec.md`

Important rules:

- Investigate existing components before creating new duplicates.
- Reuse existing drawer/actions where possible.
- Keep DB access server-side only.
- Keep client-side filtering/sorting simple for this phase.
- Do not change existing dashboard behavior.
- Do not alter Prisma schema unless truly necessary.
- If schema changes appear necessary, stop and explain before implementing.

---

## Acceptance Criteria

The feature is complete when:

- `/scanner` route exists and renders correctly
- Scanner page uses DB-backed data from Prisma
- Search works by ticker/company
- View pills filter/sort results
- Basic filters work
- Sort dropdown works
- Result count updates
- Desktop table renders scanner stocks
- Mobile cards render scanner stocks
- Clicking a row/card opens the existing Stock Preview Drawer
- Drawer actions still work from the scanner page
- Watchlist state is correct
- Alert Active state is correct
- Empty state appears when no results match filters
- Dashboard behavior remains unchanged
- No external API integration is added
- No scoring engine is added
- No Prisma migration is added unless explicitly approved
- Build passes with no TypeScript errors

Run:

```txt
npm run build
npx prisma validate
npx prisma migrate status
```

---

## Manual Test Checklist

1. Open `/scanner`
2. Confirm scanner table/cards load from DB
3. Search for `NVDA`
4. Search for a company name like `Palantir`
5. Select `Best Opportunities`
6. Select `FOMO Risk`
7. Filter by risk
8. Filter by sector
9. Toggle Watchlist only
10. Toggle Alert active only
11. Sort by Hot Score
12. Sort by Opportunity Score
13. Open a stock drawer from the table
14. Add to Watchlist from scanner drawer
15. Remove from Watchlist from scanner drawer
16. Create Alert from scanner drawer
17. Confirm Alert Active appears
18. Confirm dashboard still works
19. Test mobile layout briefly

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
