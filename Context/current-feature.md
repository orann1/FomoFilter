# Current Feature

## Feature Name

Dashboard Phase 6 — Persist Drawer Actions with Server Actions and Prisma

## Status

Completed

---

## Context

Phase 5 moved the dashboard from mock runtime data to Prisma-backed database data while keeping the UI visually identical to the previous phase.

Phase 6 should now make the main drawer actions persistent instead of local-only.

The app already has:

- Dashboard data loaded from Prisma through `src/lib/data/dashboard.ts`
- Prisma schema and seed data
- Stock Preview Drawer
- Add to Watchlist panel
- Edit Watchlist panel
- Create Alert panel
- Local-only state updates from Phase 3
- Responsive/mobile drawer polish from Phase 4

The goal of this phase is to persist the user actions from the stock drawer into the database using Server Actions, while keeping the current UI and UX mostly unchanged.

---

## Primary Goal

Replace the current local-only drawer action behavior with database-backed mutations.

The user should be able to:

1. Add a stock to the watchlist and have it saved in the database.
2. Edit an existing watchlist item and have the changes saved in the database.
3. Create an alert rule and have it saved in the database.
4. See the dashboard refresh/update after each mutation.

This phase should not introduce live market data, AI API calls, authentication, cron jobs, or notification delivery.

---

## Relevant Screenshot References

Use these screenshots as UX references for the existing drawer actions. Do not redesign from scratch.

### Add to Watchlist panel

```txt
Context/screenshots/Hot-stocks-click-open-right-pannel-adding-to-watchlist.png
```

Use this for:

- Add-to-watchlist panel layout
- Watchlist selector
- Reason field
- Status selector
- Optional entry zone and target fields
- Green primary CTA

### Create Alert panel

```txt
Context/screenshots/Hot-stocks-click-open-right-pannel-adding-alert.png
```

Use this for:

- Alert panel layout
- Alert type selector
- Threshold input
- Frequency selector
- Notify method selector
- Live alert summary
- Orange alert CTA

### Drawer base state

```txt
Context/screenshots/Hot-stocks-click-open-right-pannel.png
Context/screenshots/Hot-stocks-click-open-right-pannel-bottom.png
Context/screenshots/Hot-stocks-click-open-right-pannel-bottom-2.png
```

Use these for:

- Drawer layout
- Watch Context
- Sticky footer
- Existing CTA logic
- Desktop drawer behavior

---

## Build in This Phase

### 1. Server Actions for Drawer Mutations

Create server actions for:

- Add to Watchlist
- Edit Watchlist item
- Create Alert rule

Suggested file:

```txt
src/actions/drawer-actions.ts
```

The actions should use Prisma server-side only.

Expected actions:

```ts
addStockToWatchlist(input)
updateWatchlistItem(input)
createAlertRule(input)
```

Use proper TypeScript types and validation.

---

### 2. Input Validation

Use Zod for action input validation.

Suggested schemas:

```txt
src/lib/validation/drawer-actions.ts
```

Validate:

#### Add to Watchlist

- `userId`
- `stockId` or `symbol`
- `watchlistId` or default watchlist fallback
- `reason`
- `status`
- `entryZoneLow`
- `entryZoneHigh`
- `personalTarget`
- `stopLoss` if included later

#### Edit Watchlist

- `watchlistItemId`
- `status`
- `reason`
- `entryZoneLow`
- `entryZoneHigh`
- `personalTarget`
- `stopLoss`

#### Create Alert

- `userId`
- `stockId` or `symbol`
- `type`
- `threshold`
- `frequency`
- `notify method` if supported by current schema

Keep validation simple and aligned with the current Prisma schema.

---

### 3. Persist Add to Watchlist

When the user submits Add to Watchlist:

- Create or update the correct `WatchlistItem` in the database.
- Use the existing seeded/default user for now.
- Use the existing default watchlist, or create/find one if needed.
- Avoid duplicates by using unique constraints/upsert logic.
- Return the updated watchlist item.

Expected UI after success:

- Show success banner.
- Close the Add to Watchlist panel.
- Keep the drawer open.
- Drawer switches to watchlist mode.
- Table star becomes filled/yellow.
- My Watchlist widget updates after refresh.

Implementation can use `router.refresh()` after successful server action to reload dashboard data.

---

### 4. Persist Edit Watchlist

When the user submits Edit Watchlist:

- Update the existing `WatchlistItem` in the database.
- Return the updated item.

Expected UI after success:

- Show success banner.
- Close the Edit panel.
- Keep the drawer open.
- Watch Context reflects the updated DB data.
- My Watchlist widget reflects the updated DB data after refresh.

Use `router.refresh()` if that is the simplest reliable approach.

---

### 5. Persist Create Alert

When the user submits Create Alert:

- Create an `AlertRule` in the database.
- Associate it with the current user and selected stock.
- Store alert type, threshold, frequency, active state and timestamps.

Expected UI after success:

- Show success banner.
- Close the Create Alert panel.
- Keep the drawer open.
- No notification delivery yet.
- No cron evaluation yet.

Optional, only if simple:

- Add a small local indication that an alert exists for this stock.

Do not build the full Alerts page in this phase.

---

### 6. Replace Local-Only State Where Needed

The drawer may still use local UI state for:

- Which panel is open
- Form input state
- Success message state
- Selected stock state

But persistent business state should come from Prisma after mutation and refresh.

Do not keep separate long-lived local state that conflicts with DB state.

Important consistency after mutation:

- Drawer header star
- Hot Stocks table star
- Watch Context
- CTA footer
- My Watchlist widget

These should all reflect DB-backed state after refresh.

---

### 7. Keep Existing UX

Do not redesign the drawer or dashboard.

Keep:

- Existing dark UI
- Existing drawer layout
- Existing forms
- Existing sticky footer
- Existing success banner pattern
- Existing responsive/mobile behavior
- Existing auto-scroll-to-panel behavior from Phase 4

Only change the implementation from local-only behavior to persistent DB-backed behavior.

---

## Do Not Build in This Phase

Do not build these yet:

- Authentication / real logged-in users
- Multiple user accounts
- Live market data API
- AI API calls
- Alert evaluation cron jobs
- Email/push notification delivery
- Full Alerts page
- Full Watchlist page
- Full Scanner page
- Stock Details page
- Stripe / monetization
- Complex optimistic cache framework
- Real-time updates

---

## Implementation Notes

### Current User

Until authentication is implemented, use the seeded mock/default user from the database.

Expected seeded user:

```txt
orann1@gmail.com
```

Do not hardcode this in many places. Prefer a small helper if needed.

Suggested helper:

```txt
src/lib/data/current-user.ts
```

Possible function:

```ts
getCurrentUserForDemo()
```

Keep this simple and easy to replace later when auth is added.

---

### Server Action Return Shape

Use a consistent return pattern:

```ts
{
  success: boolean;
  data?: T;
  error?: string;
}
```

Client components should show user-friendly errors and success messages.

---

### Refresh Strategy

Preferred simple approach for this phase:

- Submit server action
- On success, show success banner
- Close panel
- Call `router.refresh()` to reload server data

This avoids complex local reconciliation bugs.

If optimistic updates are kept, ensure they do not conflict with refreshed DB data.

---

### Error Handling

Handle common errors:

- Missing stock
- Missing user
- Missing default watchlist
- Invalid threshold
- Invalid form input
- Prisma errors

User-facing messages should be simple:

- `Could not add stock to watchlist.`
- `Could not update watchlist item.`
- `Could not create alert.`

Do not expose raw Prisma errors in the UI.

---

## Suggested Files

New files:

```txt
src/actions/drawer-actions.ts
src/lib/validation/drawer-actions.ts
src/lib/data/current-user.ts
```

Potentially updated files:

```txt
src/components/dashboard/StockPreviewDrawer.tsx
src/components/dashboard/drawer/AddToWatchlistPanel.tsx
src/components/dashboard/drawer/EditWatchlistPanel.tsx
src/components/dashboard/drawer/CreateAlertPanel.tsx
src/components/dashboard/DashboardGrid.tsx
src/lib/data/dashboard.ts
prisma/schema.prisma
prisma/seed.ts
```

Only update Prisma schema/seed if the current schema is missing fields needed for this phase.

If schema changes are needed, use Prisma migrations only.

---

## Acceptance Criteria

The feature is complete when:

- Add to Watchlist saves to the database.
- Edit Watchlist saves to the database.
- Create Alert saves to the database.
- The dashboard reloads/refreshes from DB-backed data after each mutation.
- The table star updates after adding to watchlist.
- The drawer header star updates after adding to watchlist.
- The drawer CTA footer changes correctly after adding to watchlist.
- The Watch Context reflects persisted DB data.
- My Watchlist widget reflects persisted DB data after refresh.
- Success banners appear after successful actions.
- Panels close after successful submit.
- Drawer stays open after successful submit.
- Validation errors are handled gracefully.
- No API routes are added unless clearly necessary.
- No live market data integration is added.
- No auth implementation is added.
- No OpenAI calls are added.
- The project builds successfully with:

```txt
npm run build
```

- Prisma validates successfully with:

```txt
npx prisma validate
```

- If a migration is added, migration status is clean with:

```txt
npx prisma migrate status
```

---

## Manual Test Checklist

Test with a stock already in watchlist:

- Open NVDA drawer.
- Click Edit.
- Change notes/reason or target.
- Save.
- Confirm success banner.
- Confirm panel closes.
- Confirm Watch Context updates.
- Refresh browser.
- Confirm changes persist.

Test with a stock not in watchlist:

- Open SMCI or PLTR drawer.
- Click Add to Watchlist.
- Fill/confirm form.
- Submit.
- Confirm success banner.
- Confirm panel closes.
- Confirm drawer switches to watchlist mode.
- Confirm table star becomes yellow.
- Confirm My Watchlist updates.
- Refresh browser.
- Confirm stock remains in watchlist.

Test alert creation:

- Open any stock drawer.
- Click Alert.
- Confirm default threshold is based on current stock price.
- Submit.
- Confirm success banner.
- Confirm panel closes.
- Confirm alert rule exists in DB.
- Refresh browser.
- Confirm no UI crash.

Mobile sanity check:

- Open drawer on mobile width.
- Scroll down.
- Tap Edit or Alert from sticky footer.
- Confirm drawer auto-scrolls to the opened panel.
- Submit action.
- Confirm success banner is visible.

---

## Out of Scope

Keep these explicitly out of scope:

- Sending alerts
- Evaluating alert conditions
- Alert history/event generation
- Email notifications
- Push notifications
- Auth sessions
- User registration/login
- Real-time market data
- AI-generated Today's Signal
- AI-generated stock summaries
- Payment/Pro restrictions
- Full page navigation beyond the current dashboard

---

## Implementation Notes for AI Agent

- Keep changes focused on Phase 6 only.
- Use Server Actions for mutations unless there is a strong reason not to.
- Keep Prisma access server-side only.
- Do not import Prisma into client components.
- Do not add API routes unless necessary.
- Use Zod validation.
- Use existing UI components and styling.
- Do not redesign.
- Prefer `router.refresh()` after mutation for consistency.
- Avoid over-engineering optimistic state.
- Ask before schema changes if they are large.
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
- Phase 6 completed (2026-05-18): Replaced local-only drawer actions with DB-backed Server Actions and Prisma. Created `src/lib/data/current-user.ts` with `getCurrentUserForDemo()` helper (looks up demo user by email, easy to swap for real auth later). Created `src/lib/validation/drawer-actions.ts` with Zod schemas for all four mutations. Created `src/actions/drawer-actions.ts` with four server actions: `addStockToWatchlist` (upsert via `userId_stockId` composite key), `updateWatchlistItem` (find by composite key then update by id), `removeStockFromWatchlist` (find then delete by id), `createAlertRule` (create with stock/user lookup). Prisma 7 enum values used as string literals with `as const` (Prisma 7 does not re-export enums from `@prisma/client`). Added `ActiveAlertRule` exported type and `alertRulesBySymbol: Record<string, ActiveAlertRule[]>` to `getDashboardData()` in `dashboard.ts`; the alert rule query runs separately after the 9-element `Promise.all` to avoid TypeScript tuple inference breakage at 10+ elements. Threaded `alertRulesBySymbol` through `app/page.tsx` → `DashboardGrid` → `StockPreviewDrawer` → `CreateAlertPanel`. Added "Alert Active" amber badge to drawer header when `existingAlerts.length > 0`. Added existing alerts list inside `CreateAlertPanel` with `formatAlertType` / `formatFrequency` helpers. Added Remove from Watchlist button at the bottom of `EditWatchlistPanel` (red-tinted text, trash icon, separate `useTransition` from save). All mutations call `router.refresh()` on success to reload server data; `DashboardGrid` syncs `selectedStock` from refreshed `hotStocks` prop via `useEffect`. No new Prisma models added, no migration created — existing Phase 5 schema was sufficient. Build passes with zero TypeScript errors. `prisma validate` and `prisma migrate status` both pass clean. Approved by user.
