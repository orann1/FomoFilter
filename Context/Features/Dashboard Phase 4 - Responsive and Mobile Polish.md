# Current Feature

## Feature Name

Dashboard Phase 4 — Responsive and Mobile Polish

## Status

Completed

---

## Context

Phase 1 built the static FomoFilter dashboard with mock data.
Phase 2 added the stock preview drawer.
Phase 3 added local drawer actions for Add to Watchlist, Edit Watchlist, and Create Alert.

This phase focuses only on making the existing dashboard and drawer responsive and usable on smaller screens.

FomoFilter is a dark-mode-first AI stock discovery dashboard. The mobile experience should preserve the same product value:

- Quickly understand today’s market signal
- Review hot stocks
- Open a stock preview
- Track stocks
- Create alerts
- Use the app without horizontal layout problems

Use the existing mock data and local state only.

Read the project context files before implementation:

- `Context/CLAUDE.md`
- `Context/project-overview.md`
- `Context/coding-standards.md`
- `Context/ai-interaction.md`
- `Context/current-feature.md`

---

## Primary Goal

Make the existing dashboard and stock preview drawer responsive across desktop, tablet, and mobile.

The app should remain desktop-first, but it must be usable on mobile widths.

Target breakpoints to test:

```txt
Desktop: 1440px+
Laptop: 1024px–1366px
Tablet: 768px–1024px
Mobile: 390px–430px
```

---

## Important Implementation Scope

### Build in this phase

Improve the existing Phase 1–3 UI for responsive behavior:

- Responsive app shell
- Mobile sidebar behavior
- Responsive top bar
- Responsive dashboard grid
- Mobile Hot Stocks cards instead of wide table
- Mobile-friendly stock preview drawer / sheet
- Mobile-friendly Add to Watchlist, Edit Watchlist, and Create Alert panels
- Better scroll behavior and sticky footer behavior on small screens
- Overflow, spacing, and clipping fixes

### Do not build in this phase

Do not build these yet:

- Real database integration
- Prisma schema implementation
- Authentication
- API routes
- Server Actions
- Real market data provider integration
- AI API calls
- Stripe / monetization
- Full Scanner page
- Full Stock Details page
- Full Watchlist page
- Full Alerts page
- Persisted watchlist or alert data
- New product features outside responsive polish

---

## Relevant Screenshot References

Use these screenshots as the visual source of truth for the existing dashboard and drawer design.
The responsive version should keep the same visual identity, but adapt the layout for smaller screens.

### Main dashboard top

```txt
Context/screenshots/Main-screen-Top.png
```

Use this for:

- Sidebar style
- Top navigation style
- Dashboard title
- Today’s Signal card
- Market index cards
- Summary KPI cards

### Main dashboard lower area

```txt
Context/screenshots/Main-screen-bottom.png
```

Use this for:

- Hot Stocks table layout on desktop
- Discover Setups grid
- Top Score Changes placement
- My Watchlist widget

### Main dashboard bottom/right widgets

```txt
Context/screenshots/Main-screen-bottom-2.png
```

Use this for:

- AI Insights widget
- Recent Alerts widget
- Lower page spacing

### Stock preview drawer

```txt
Context/screenshots/Hot-stocks-click-open-right-pannel.png
Context/screenshots/Hot-stocks-click-open-right-pannel-bottom.png
Context/screenshots/Hot-stocks-click-open-right-pannel-bottom-2.png
```

Use these for:

- Desktop drawer structure
- Drawer content order
- Watch Context
- Sticky CTA footer

### Drawer action panels

```txt
Context/screenshots/Hot-stocks-click-open-right-pannel-adding-to-watchlist.png
Context/screenshots/Hot-stocks-click-open-right-pannel-adding-alert.png
```

Use these for:

- Add to Watchlist panel behavior
- Create Alert panel behavior
- Form spacing inside the drawer

---

## Responsive Requirements

## 1. App Shell

### Desktop

Keep the existing desktop layout:

- Fixed left sidebar
- Top bar across the main content area
- Main dashboard content
- Right-side drawer when stock is selected

### Tablet

For tablet widths:

- Sidebar may collapse to icon-only or drawer behavior
- Main content should remain readable
- Right-side drawer may be narrower or become a full-height overlay panel
- Avoid horizontal page overflow

### Mobile

For mobile widths:

- Sidebar should become a slide-out menu or hidden behind a menu button
- Main content should use single-column layout
- Top bar should fit without clipping
- Search can be compact or full-width below the top row
- Universe / data freshness can move to a smaller secondary row
- No horizontal page scroll

---

## 2. Top Bar

On desktop, keep current layout.

On mobile:

- Keep a menu/sidebar toggle visible
- Keep search usable
- Keep notification icon visible
- Universe selector and data freshness can be shortened or stacked
- Prevent text overflow in the top bar

Suggested mobile behavior:

```txt
Top row: menu button | logo/app state if needed | notification
Second row: search input
Small metadata row: US Stocks · Updated 2 min ago · Delayed data
```

Do not add real search behavior yet.

---

## 3. Dashboard Content

### Mobile section order

On mobile, order content by decision value:

1. Dashboard header
2. Today’s Signal
3. Market index cards
4. Summary KPI cards
5. Hot Stocks as mobile cards
6. Top Score Changes
7. My Watchlist
8. Discover Setups
9. AI Insights
10. Recent Alerts

---

## 4. Market Stats and KPI Cards

### Desktop

Keep current grids.

### Mobile

Use compact card grids:

- Market stats: 2 columns if space allows, otherwise 1 column
- KPI cards: 1 column or 2 columns if readable
- Keep values prominent
- Do not shrink text too aggressively

---

## 5. Hot Stocks Mobile Layout

On desktop, keep the existing table.

On mobile, do not show the wide table. Replace it with stacked stock cards.

Each mobile stock card should show:

- Favorite star
- Symbol
- Company name
- Price
- Daily change
- Setup badge
- Hot score
- Opportunity score
- Risk badge
- Catalyst
- Tap/click behavior to open the stock preview drawer/sheet

Suggested mobile card structure:

```txt
NVDA        +8.42%
NVIDIA Corporation
$924.32

Setup: Pullback Watch    Risk: Medium
Hot 94     Opp 78
Catalyst: AI demand surge
```

Behavior:

- Tapping a mobile card opens the stock preview drawer/sheet
- Selected state should be visible if the drawer/sheet is open
- Favorite star must reflect local watchlist state after Phase 3 actions

---

## 6. Stock Preview Drawer / Mobile Sheet

### Desktop

Keep the current right-side drawer.

### Mobile

The drawer should not remain a narrow side panel.

Use one of these patterns:

Preferred:

- Full-screen mobile sheet/panel

Acceptable:

- Bottom sheet that expands near full height

Mobile drawer/sheet requirements:

- Header stays visible at the top
- CTA footer stays sticky at the bottom
- Content scrolls between header and footer
- No content should be hidden behind the sticky footer
- Close button must be easy to tap
- Add/Edit/Alert panels must fit without clipping
- Form fields must be readable and tappable

Mobile content order:

1. Header
2. Decision Snapshot
3. Hot / Opportunity score cards
4. AI Insight
5. Price Context
6. Score Breakdown
7. Main Catalyst
8. Watch Context
9. Sticky CTA footer

---

## 7. Drawer Action Panels on Mobile

The Phase 3 action panels must work on mobile:

- Add to Watchlist
- Edit Watchlist
- Create Alert

Requirements:

- Opening one panel closes the other panels
- Forms should not be too wide
- Inputs should be full-width on mobile
- Button rows should stack if needed
- Submit success banner should remain visible
- Panel should close after successful submit
- Drawer/sheet should remain open
- Sticky footer must not cover form submit buttons

No persistence should be added.

---

## 8. Right Column Widgets on Mobile

On desktop, right column widgets can remain as they are.

On mobile:

- Top Score Changes should become a normal section below Hot Stocks
- My Watchlist should become a normal section
- AI Insights should become a normal section
- Recent Alerts should become a normal section
- Avoid cramped side-by-side cards
- Preserve spacing between widgets

---

## 9. Overflow and Scroll Rules

Fix all obvious responsive issues:

- No horizontal page scroll on mobile
- No clipped drawer content
- No clipped table/card content
- No hidden CTA buttons
- No content hidden behind sticky footer
- Long text should wrap or truncate cleanly
- Catalyst text can be truncated on compact cards
- Keep the dashboard scroll smooth

---

## Component Guidance

Reuse existing components where possible.

Do not create a second duplicate dashboard.

Likely files to update:

```txt
src/components/layout/AppSidebar.tsx
src/components/layout/TopBar.tsx
src/components/dashboard/DashboardGrid.tsx
src/components/dashboard/HotStocksTable.tsx
src/components/dashboard/StockPreviewDrawer.tsx
src/components/dashboard/drawer/AddToWatchlistPanel.tsx
src/components/dashboard/drawer/EditWatchlistPanel.tsx
src/components/dashboard/drawer/CreateAlertPanel.tsx
src/components/dashboard/*.tsx
src/app/page.tsx
src/app/globals.css
```

If helpful, create a small mobile-specific component:

```txt
src/components/dashboard/MobileHotStockCard.tsx
```

Keep implementation focused. Do not over-refactor.

---

## Styling Requirements

Use Tailwind CSS v4.

Important:

- Do not create `tailwind.config.ts`
- Do not create `tailwind.config.js`
- Use Tailwind utility classes directly
- Keep the app dark-mode-first
- Keep the existing visual identity
- Keep purple mainly for AI areas
- Keep emerald/green for logo, opportunity, success
- Keep orange/red for heat, risk, and warnings

---

## Acceptance Criteria

The feature is complete when:

- Desktop dashboard still looks correct
- Desktop drawer still works correctly
- Add/Edit/Alert local drawer actions still work
- Mobile dashboard has no horizontal page scroll
- Mobile Hot Stocks uses cards instead of a wide table
- Mobile stock card click opens a usable preview drawer/sheet
- Mobile drawer/sheet has sticky header and sticky CTA footer
- Add/Edit/Alert panels are usable on mobile
- Content is not clipped behind sticky footer
- Watchlist star state remains consistent across table/cards/drawer after local Add to Watchlist
- The project builds successfully with:

```txt
npm run build
```

- There are no TypeScript errors
- There are no obvious unused imports or lint issues

---

## Out of Scope for This Feature

Keep these explicitly out of scope:

- Real API calls
- Prisma/database work
- Auth work
- Real market data work
- Persisted watchlist or alerts
- Full Scanner page
- Full Watchlist page
- Full Alerts page
- Full Stock Details page
- New scoring logic
- New AI functionality
- New monetization work

---

## Implementation Notes for AI Agent

- Make responsive changes incrementally.
- Start with layout and overflow fixes.
- Then add mobile stock cards.
- Then adjust drawer/mobile sheet behavior.
- Then verify Add/Edit/Alert panels on mobile.
- Keep desktop behavior intact.
- Use existing mock data and local state only.
- Do not add new product features.
- Ask before large refactors.
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
