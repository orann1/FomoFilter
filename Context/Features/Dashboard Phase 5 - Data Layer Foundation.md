# Current Feature

## Feature Name

Data Layer Foundation with Prisma and Seeded Stock Data

## Status

Completed

---

## Context

Phase 1–4 completed the dashboard UI, stock preview drawer, drawer actions, and responsive/mobile polish.

The app currently uses local mock data from:

```txt
src/lib/mock-data.ts
```

Phase 5 starts the transition from static mock data to a real application data layer.

This phase should create the first Prisma-backed data foundation and seed the database using the existing mock data structure. The goal is not to connect live market APIs yet. The goal is to make the dashboard read from a database-backed data source while keeping the current UI and behavior intact.

Use the project context files before implementation:

- `Context/CLAUDE.md`
- `Context/project-overview.md`
- `Context/coding-standards.md`
- `Context/ai-interaction.md`
- `Context/current-feature.md`

---

## Primary Goal

Create the initial database foundation for FomoFilter using Prisma, then load the current dashboard data from seeded database records instead of relying only on hardcoded mock arrays.

The UI should look and behave the same after this phase.

---

## Important Scope

### Build in this phase

- Add Prisma to the project if it is not already installed.
- Create an initial `prisma/schema.prisma` based on the MVP data needed by the current dashboard.
- Add a Prisma client helper.
- Add a database seed script that inserts data equivalent to the current mock data.
- Replace dashboard data loading with a server-side data loader that reads from Prisma.
- Keep the existing mock data file available as fallback/reference for now.
- Preserve all dashboard, drawer, action, and responsive behavior from Phases 1–4.
- Keep Add/Edit Watchlist and Create Alert behavior local-only unless it can be wired safely to the database without expanding scope.

### Do not build in this phase

- Do not connect to live market data providers.
- Do not add Twelve Data, FMP, Polygon, Finnhub, or any external data API.
- Do not add OpenAI API calls.
- Do not build authentication.
- Do not build Stripe or monetization.
- Do not build the full Scanner page.
- Do not build the full Stock Details page.
- Do not build the full Watchlist page.
- Do not build the full Alerts page.
- Do not add background jobs or scheduled refresh.
- Do not implement real-time prices.
- Do not redesign the dashboard UI.

---

## Database Choice

Use the project’s intended database direction from `project-overview.md`: PostgreSQL with Prisma.

If `DATABASE_URL` is missing, stop and ask the user before proceeding with migrations.

Do not silently switch to SQLite unless the user explicitly approves it.

---

## Suggested Prisma Models for This Phase

Keep the first schema practical and limited to dashboard needs.

Use these models as the Phase 5 starting point:

```prisma
model User {
  id                String          @id @default(cuid())
  email             String          @unique
  name              String?
  initials          String?
  plan              Plan            @default(FREE)
  createdAt         DateTime        @default(now())
  updatedAt         DateTime        @updatedAt

  watchlistItems    WatchlistItem[]
  alertRules        AlertRule[]
}

enum Plan {
  FREE
  PRO
}

model Stock {
  id                String          @id @default(cuid())
  symbol            String          @unique
  name              String
  sector            String?
  marketCap         String?
  isActive          Boolean         @default(true)
  createdAt         DateTime        @default(now())
  updatedAt         DateTime        @updatedAt

  quote             StockQuote?
  score             StockScore?
  drawerDetail      StockDrawerDetail?
  watchlistItems    WatchlistItem[]
  alertRules        AlertRule[]
}

model StockQuote {
  id                String          @id @default(cuid())
  stockId           String          @unique
  stock             Stock           @relation(fields: [stockId], references: [id], onDelete: Cascade)

  price             Decimal
  changePercent     Decimal
  volume            String?
  relativeVolume    Decimal?
  analystTarget     Decimal?
  analystUpside     Decimal?
  analystRating     String?
  updatedLabel      String          @default("Updated 2 min ago")
  createdAt         DateTime        @default(now())
  updatedAt         DateTime        @updatedAt
}

model StockScore {
  id                String          @id @default(cuid())
  stockId           String          @unique
  stock             Stock           @relation(fields: [stockId], references: [id], onDelete: Cascade)

  hotScore          Int
  hotScoreChange    Int             @default(0)
  opportunityScore  Int
  opportunityChange Int             @default(0)
  riskLevel         RiskLevel
  setupStatus       String
  catalyst          String
  signalLabel       String?
  createdAt         DateTime        @default(now())
  updatedAt         DateTime        @updatedAt
}

enum RiskLevel {
  LOW
  MEDIUM
  HIGH
  EXTREME
}

model StockDrawerDetail {
  id                String          @id @default(cuid())
  stockId           String          @unique
  stock             Stock           @relation(fields: [stockId], references: [id], onDelete: Cascade)

  suggestedAction   String
  fomoRisk          String
  entryContext      String
  aiSentiment       String
  aiWhatHappening   String
  aiWhatItMeans     String
  aiWhatToWatch     String
  entryZoneLow      Decimal?
  entryZoneHigh     Decimal?
  target            Decimal?
  distanceToTarget  Decimal?
  catalystDetail    String?
  catalystConfidence String?
  createdAt         DateTime        @default(now())
  updatedAt         DateTime        @updatedAt
}

model WatchlistItem {
  id                String          @id @default(cuid())
  userId            String
  user              User            @relation(fields: [userId], references: [id], onDelete: Cascade)
  stockId           String
  stock             Stock           @relation(fields: [stockId], references: [id], onDelete: Cascade)

  status            WatchStatus     @default(WATCHING)
  reason            String?
  entryZoneLow      Decimal?
  entryZoneHigh     Decimal?
  target            Decimal?
  stopLoss          Decimal?
  hotScoreChange    Int             @default(0)
  opportunityChange Int             @default(0)
  latestSignal      String?
  createdAt         DateTime        @default(now())
  updatedAt         DateTime        @updatedAt

  @@unique([userId, stockId])
  @@index([userId])
  @@index([stockId])
}

enum WatchStatus {
  WATCHING
  WAITING
  READY_TO_BUY
  HOLDING
  AVOIDING
  ARCHIVED
}

model AlertRule {
  id                String          @id @default(cuid())
  userId            String
  user              User            @relation(fields: [userId], references: [id], onDelete: Cascade)
  stockId           String
  stock             Stock           @relation(fields: [stockId], references: [id], onDelete: Cascade)

  type              AlertType
  threshold         Decimal?
  frequency         AlertFrequency  @default(ONCE)
  notifyVia         String          @default("in-app")
  isActive          Boolean         @default(true)
  createdAt         DateTime        @default(now())
  updatedAt         DateTime        @updatedAt

  @@index([userId])
  @@index([stockId])
}

enum AlertType {
  PRICE_ABOVE
  PRICE_BELOW
  HOT_SCORE_ABOVE
  OPPORTUNITY_SCORE_ABOVE
  RELATIVE_VOLUME_ABOVE
}

enum AlertFrequency {
  ONCE
  DAILY
  ALWAYS
}

model MarketStat {
  id                String          @id @default(cuid())
  label             String          @unique
  value             String
  change            String
  up                Boolean
  sortOrder         Int             @default(0)
}

model DashboardSummaryCard {
  id                String          @id @default(cuid())
  label             String
  value             Int
  icon              String
  color             String
  sortOrder         Int             @default(0)
}

model DiscoverSetup {
  id                String          @id @default(cuid())
  slug              String          @unique
  name              String
  icon              String
  description       String
  tickers           String[]
  sortOrder         Int             @default(0)
}

model AiInsight {
  id                String          @id @default(cuid())
  symbol            String
  sentiment         String
  title             String
  summary           String
  minutesAgo        Int
  createdAt         DateTime        @default(now())
}

model RecentAlert {
  id                String          @id @default(cuid())
  symbol            String
  type              String
  message           String
  note              String
  minutesAgo        Int
  isNew             Boolean         @default(false)
  icon              String
  createdAt         DateTime        @default(now())
}
```

Important: This schema is only the first practical data foundation. It can evolve later through migrations.

---

## Required Files / Suggested Structure

Create or update:

```txt
prisma/schema.prisma
prisma/seed.ts
src/lib/db/prisma.ts
src/lib/data/dashboard.ts
src/app/page.tsx
```

Suggested responsibilities:

### `src/lib/db/prisma.ts`

- Export a singleton Prisma client.
- Avoid creating many Prisma clients in development hot reload.

### `prisma/seed.ts`

- Seed one mock user based on `mockUser`.
- Seed market stats.
- Seed summary cards.
- Seed stocks, quotes, scores and drawer details.
- Seed watchlist entries.
- Seed discover setups.
- Seed AI insights.
- Seed recent alerts.

### `src/lib/data/dashboard.ts`

Create one server-side function, for example:

```ts
export async function getDashboardData() {
  // read all data needed by the dashboard from Prisma
}
```

Return data in the same shape, or a very similar shape, to what current dashboard components already expect.

Prefer adapting data in the data loader instead of heavily refactoring UI components.

---

## UI Requirements

The visual dashboard should not change in this phase.

Preserve:

- Sidebar
- Top bar
- Today’s Signal card
- Market stats
- Summary cards
- Hot Stocks table/cards
- Stock preview drawer
- Add/Edit Watchlist panels
- Create Alert panel
- Responsive/mobile behavior

The user should not feel a visual difference after Phase 5 except that the data now comes from Prisma-seeded records.

---

## Local Action Behavior

For this phase, keep drawer actions local-only unless the user explicitly approves persistence.

Keep these behaviors from Phase 3:

- Add to Watchlist updates local UI state immediately.
- Edit Watchlist updates local UI state immediately.
- Create Alert shows local success state.

Do not persist Add/Edit/Alert submissions to the database yet unless this can be done safely without expanding scope.

If persistence is desired, stop and ask before implementing it.

---

## Migration Rules

Follow `Context/coding-standards.md`:

- Use Prisma migrations.
- Do not use `prisma db push`.
- Use `prisma migrate dev` for schema changes.
- Do not edit the production database directly.

Before running migration, confirm that `.env` has a valid `DATABASE_URL`.

If no database is configured, stop and ask the user.

---

## Acceptance Criteria

This phase is complete when:

- Prisma is installed and configured.
- `prisma/schema.prisma` exists.
- A valid Prisma migration exists for the Phase 5 schema.
- A seed script exists and can insert the initial dashboard data.
- The dashboard loads data through a server-side data loader instead of directly importing all UI data from `src/lib/mock-data.ts`.
- The dashboard UI still looks and behaves the same as Phase 4.
- Stock preview drawer still opens correctly.
- Add/Edit/Alert panels still work locally.
- Existing responsive/mobile behavior remains intact.
- No live market API is added.
- No auth is added.
- No Prisma/db push is used.
- The project builds successfully with:

```txt
npm run build
```

- There are no TypeScript errors.

---

## Out of Scope

Keep these explicitly out of scope:

- Live market data provider integration
- OpenAI API integration
- Real-time updates
- Auth/login/session handling
- Persisting user Add/Edit/Alert actions unless separately approved
- Scanner page
- Stock details page
- Watchlist page
- Alerts page
- Stripe/payment logic
- Background jobs / cron refresh
- Email or push notification delivery
- Portfolio/brokerage integration

---

## Implementation Notes for AI Agent

- Keep the UI stable.
- Prefer adapting database results to the existing component prop shapes.
- Avoid large UI refactors.
- Do not redesign components.
- Keep mock data file for reference/fallback unless removal is explicitly approved.
- If installing Prisma packages, explain what was installed.
- If database configuration is missing, stop and ask before migrating.
- Ask before changing the database provider.
- Run build after implementation.
- Do not commit unless explicitly asked.

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
