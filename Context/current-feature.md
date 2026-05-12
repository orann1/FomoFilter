# Current Feature

## Feature Name

Dashboard Phase 3 — Drawer Actions: Add to Watchlist, Edit Watchlist, and Create Alert

## Status

Completed

---

## Context

Phase 1 built the static dashboard layout with mock data.

Phase 2 added the right-side stock preview drawer. Users can now click a stock row in the Hot Stocks table, open a drawer, inspect stock details, and see different CTA states depending on whether the stock is already in the watchlist.

This feature focuses only on the next interaction layer inside the existing stock preview drawer.

The goal of Phase 3 is to make the drawer actions feel real and useful while still using mock/local state only.

Use the project context files before implementation:

- `Context/CLAUDE.md`
- `Context/project-overview.md`
- `Context/coding-standards.md`
- `Context/ai-interaction.md`
- `Context/current-feature.md`

Use the existing mock data from:

```txt
src/lib/mock-data.ts
```

---

## Important Implementation Scope

### Build in this phase

Build action flows inside the existing stock preview drawer:

1. **Add to Watchlist flow**
   - For stocks that are not currently in the watchlist.
   - Open an inline form/panel inside the drawer.
   - Allow the user to set a tracking reason, status, optional entry zone and optional target.
   - After submitting, update local UI state only.

2. **Edit Watchlist flow**
   - For stocks already in the watchlist.
   - Open an inline form/panel inside the drawer.
   - Allow editing watchlist tracking context.
   - After submitting, update local UI state only.

3. **Create Alert flow**
   - Open an inline form/panel inside the drawer.
   - Allow creating a simple alert rule.
   - After submitting, show a local success state/toast only.

4. **Success states**
   - Show clear confirmation after adding to watchlist, editing watchlist, or creating an alert.
   - Update CTA labels and Watch Context immediately in the UI.

5. **Local state only**
   - Use React state.
   - Do not persist data to a database.
   - Do not call APIs.

### Do not build in this phase

Do not build these yet:

- Real database persistence
- Prisma schema changes
- API routes
- Server Actions
- Authentication
- Real alert delivery
- Email/push notification integration
- Real market data provider integration
- Real AI API calls
- Full Watchlist page
- Full Alerts page
- Full Stock Details page
- Scanner page
- Mobile-specific redesign

---

## Primary Goal

Make the stock drawer actions usable enough for MVP prototyping:

- A user can click a non-watchlist stock and add it to the watchlist.
- A user can click a watchlist stock and edit its tracking context.
- A user can create a simple alert from the drawer.
- The UI should reflect these changes immediately using local state.

This phase should complete the core dashboard loop:

```txt
Discover stock → inspect drawer → track stock or create alert
```

---

## Relevant Screenshot References for Phase 3

Use these screenshots as visual references. The implementation does not need to be pixel-perfect, but it should follow the same structure, visual hierarchy and dark dashboard style.

### Add to Watchlist flow

```txt
Context/screenshots/Hot-stocks-click-open-right-pannel-adding-to-watchlist.png
```

Use this for:

- Add to Watchlist panel inside the drawer
- Watchlist selector
- Reason/tracking field
- Status selector
- Optional entry zone / target area
- Primary green Add to Watchlist CTA
- Short disclaimer text

### Create Alert flow

```txt
Context/screenshots/Hot-stocks-click-open-right-pannel-adding-alert.png
```

Use this for:

- Create Alert panel inside the drawer
- Alert type selector
- Threshold input
- Frequency selector
- Notification method selector
- Alert summary line
- Primary Create Alert CTA

### Existing drawer reference

```txt
Context/screenshots/Hot-stocks-click-open-right-pannel.png
Context/screenshots/Hot-stocks-click-open-right-pannel-bottom.png
Context/screenshots/Hot-stocks-click-open-right-pannel-bottom-2.png
```

Use these only to preserve the existing drawer structure and avoid breaking Phase 2.

---

## UX Requirements

### General behavior

The action flows should happen inside the existing drawer.

Preferred behavior:

- Do not open a full-page route.
- Do not open a large blocking modal over the dashboard.
- Use an inline panel/card near the top of the drawer, below the stock header.
- Keep the drawer header and sticky CTA footer behavior intact.
- Allow cancel/close for each action panel.
- Only one action panel should be open at a time.

Example states:

```txt
default drawer
drawer + add to watchlist panel
drawer + edit watchlist panel
drawer + create alert panel
drawer + success confirmation
```

---

## Add to Watchlist Flow

### When to show

Show this flow when the selected stock is not in the watchlist.

Primary CTA:

```txt
Add to Watchlist
```

### Form fields

Use a compact form with these fields:

1. **Watchlist**
   - Default: `Main Watchlist`
   - This can be a disabled dropdown or simple select for now.

2. **Reason for tracking**
   - Use an input/select/textarea.
   - Pre-fill or suggest a reason based on the stock drawer detail.
   - Example:
     ```txt
     Strong momentum building
     ```

3. **Status**
   - Options:
     - Watching
     - Waiting
     - Ready to Buy
   - Use decision-support language.
   - Do not use direct investment advice language.

4. **Entry zone**
   - Optional.
   - Two inputs:
     - Low
     - High

5. **Target**
   - Optional single input.

### Submit behavior

On submit:

- Update local state so the stock is treated as in-watchlist.
- Change primary CTA behavior from `Add to Watchlist` to watchlist/edit state.
- Show a success confirmation:
  ```txt
  SMCI added to your watchlist
  ```
- Update Watch Context section to reflect the new tracking data.
- Do not persist anything.

### Copy rules

Use safe decision-support wording:

- “Track”
- “Watch”
- “Entry zone”
- “Target”
- “Reason for tracking”
- “Not a buy recommendation”

Avoid:

- “Buy now”
- “Guaranteed upside”
- “Safe entry”

---

## Edit Watchlist Flow

### When to show

Show this flow when the selected stock is already in the watchlist.

CTA:

```txt
Edit Watchlist
```

or:

```txt
Edit
```

### Form fields

Use a compact edit panel with:

- Status
- Reason / notes
- Entry zone low
- Entry zone high
- Target
- Stop loss
- Confidence, optional
- Timeframe, optional

For MVP, it is acceptable to implement only:

- Status
- Notes
- Entry zone
- Target
- Stop loss

### Submit behavior

On submit:

- Update local state only.
- Update the Watch Context section.
- Show a success confirmation:
  ```txt
  Watchlist updated
  ```
- Close the edit panel or keep it open briefly with success state.

---

## Create Alert Flow

### When to show

The Create Alert flow can be opened for any selected stock.

CTA:

```txt
Create Alert
```

or:

```txt
Alert
```

### Form fields

Use a compact form with:

1. **Alert Type**
   - Price Above
   - Price Below
   - Hot Score Above
   - Opportunity Score Above
   - Relative Volume Above

2. **Threshold**
   - Numeric input.
   - Default value should be suggested based on alert type and current stock data.

3. **Frequency**
   - Once
   - Daily
   - Always

4. **Notify via**
   - In-app
   - Email later / disabled
   - Push Notification can appear as mock label only if needed.

5. **Summary**
   - A generated sentence showing what the alert means.
   - Example:
     ```txt
     Alert once when SMCI price goes above $853.07
     ```

### Submit behavior

On submit:

- Add the alert to local state or local list if needed.
- Show success confirmation:
  ```txt
  Alert created for SMCI
  ```
- Optionally increment the alert badge locally if simple.
- Do not implement real notification logic.

---

## CTA Footer Requirements

The sticky CTA footer should adapt based on stock/watchlist state.

### Stock not in watchlist

Show:

```txt
[Add to Watchlist] [Create Alert] [Full Details]
```

- `Add to Watchlist` should be primary.
- `Create Alert` should be secondary.
- `Full Details` can be secondary or tertiary.

### Stock in watchlist

Show:

```txt
[View Full Details] [Edit Watchlist] [Create Alert]
```

- `View Full Details` can remain primary for now.
- `Edit Watchlist` opens edit panel.
- `Create Alert` opens alert panel.

### While action panel is open

Keep the footer visible, but avoid duplicate/conflicting actions.

Acceptable options:

- Keep footer unchanged.
- Or temporarily show a single primary submit button inside the panel and keep footer secondary.

Do not let the sticky footer cover form content.

---

## State Management Requirements

Use local React state only.

Expected state concepts:

```ts
selectedStock
activeDrawerAction // "add-watchlist" | "edit-watchlist" | "create-alert" | null
localWatchlistOverrides
localAlertEvents
successMessage
```

Names can differ, but keep the logic simple and readable.

Important:

- Clicking another stock should reset the active action panel.
- Closing the drawer should reset the active action panel.
- Submitting a form should not close the drawer unless the UX clearly benefits.
- No API calls.
- No database writes.
- No server actions.

---

## Component Suggestions

Keep the existing Phase 2 structure and add focused components only if helpful.

Suggested new components:

```txt
src/components/dashboard/drawer/AddToWatchlistPanel.tsx
src/components/dashboard/drawer/EditWatchlistPanel.tsx
src/components/dashboard/drawer/CreateAlertPanel.tsx
src/components/dashboard/drawer/DrawerSuccessMessage.tsx
```

If a new folder is too much for the current structure, place them under:

```txt
src/components/dashboard/
```

But keep files focused.

Do not make `StockPreviewDrawer.tsx` too large. Extract form panels if the file becomes hard to read.

---

## Validation Requirements

Use TypeScript types.

Avoid `any`.

Use existing mock data types where possible.

If new local types are needed, define them clearly.

Form validation can be lightweight in this phase:

- Required fields should not be empty.
- Numeric thresholds should be valid numbers.
- Entry zone low should not be greater than entry zone high.

Do not add Zod yet unless it is already part of the project and simple to use.

---

## Styling Requirements

Keep the existing Phase 2 visual style:

- Dark mode
- Premium financial SaaS look
- Subtle cards
- Soft borders
- Compact forms
- Green primary CTA
- Purple AI accent only where relevant
- Amber/red for risk and warning states
- Muted helper text

Do not redesign the dashboard.

Do not redesign the drawer.

Only add the action panels and success states.

---

## Acceptance Criteria

The feature is complete when:

- Clicking `Add to Watchlist` opens a compact Add to Watchlist panel inside the drawer.
- Submitting Add to Watchlist updates the selected stock locally as tracked.
- The Watch Context updates after adding the stock.
- Clicking `Edit Watchlist` opens a compact edit panel for tracked stocks.
- Submitting Edit Watchlist updates the Watch Context locally.
- Clicking `Create Alert` opens a compact Create Alert panel inside the drawer.
- Submitting Create Alert shows a success confirmation.
- Only one action panel can be open at a time.
- Changing selected stock resets the active panel.
- Closing the drawer resets the active panel.
- The drawer remains visually stable and scrollable.
- Sticky footer does not cover form content.
- No API/database/auth/Prisma work is added.
- The project builds successfully with:

```txt
npm run build
```

- There are no TypeScript errors.
- There are no unused imports or obvious lint issues.

---

## Out of Scope for This Feature

Keep these explicitly out of scope:

- Real watchlist persistence
- Real alert persistence
- Real notification delivery
- Real user authentication
- API routes
- Server Actions
- Prisma/database work
- Full Watchlist page
- Full Alerts page
- Full Stock Details page
- Scanner page
- Mobile-specific redesign
- Real market data integration
- Real AI API integration
- Stripe / monetization

---

## Implementation Notes for AI Agent

- Build incrementally.
- Preserve the existing Phase 1 and Phase 2 layout.
- Do not refactor unrelated dashboard widgets.
- Keep action forms compact.
- Use local state only.
- Avoid over-engineering.
- Do not add features outside Phase 3.
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
