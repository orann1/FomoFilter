# Current Feature

## Feature Name

Dashboard Phase 2 — Stock Preview Drawer

## Status

Not Started

---

## Context

Phase 1 completed the static FomoFilter dashboard using mock data. Phase 2 adds the first interactive dashboard behavior: clicking a stock row in the Hot Stocks Today table opens a right-side stock preview drawer.

The drawer should help the user quickly understand:

- What stock was selected
- Why the stock is interesting
- Whether the move looks like a signal or FOMO
- What the current setup, risk, catalyst and score context are
- Whether the stock is already in the watchlist
- What actions are available next

Use the project context files before implementation:

- `Context/CLAUDE.md`
- `Context/project-overview.md`
- `Context/coding-standards.md`
- `Context/ai-interaction.md`
- `Context/current-feature.md`

---

## Primary Goal

Add a right-side stock preview drawer to the existing dashboard.

When the user clicks a stock row in `HotStocksTable`, the selected stock should be highlighted and a drawer should slide in from the right side of the screen.

This phase should use mock data only.

---

## Data Source

Use existing mock data from:

```txt
src/lib/mock-data.ts
```

Primary data source:

- `mockHotStocks`
- `mockWatchlist`
- `mockAiInsights`
- `mockRecentAlerts`

If additional mock fields are needed for the drawer, update `src/lib/mock-data.ts` carefully and keep the data simple.

Do not add API calls, database calls, Prisma, server actions, or real market data integration in this phase.

---

## Relevant Screenshot References for Phase 2

Use these screenshots as visual references. The implementation does not need to be pixel-perfect, but it should closely match the structure, visual hierarchy and dark dashboard feel.

### Stock row clicked — drawer open

```txt
Context/screenshots/Hot-stocks-click-open-right-pannel.png
```

Use this for:

- Drawer placement
- Selected row state
- Drawer header
- Price and score summary
- Decision Snapshot
- AI Insight
- Price Context

### Drawer lower section

```txt
Context/screenshots/Hot-stocks-click-open-right-pannel-bottom.png
```

Use this for:

- Score Breakdown
- Main Catalyst
- Watch Context
- Drawer spacing and scroll behavior

### Drawer bottom / sticky CTA area

```txt
Context/screenshots/Hot-stocks-click-open-right-pannel-bottom-2.png
```

Use this for:

- Bottom section layout
- Sticky footer behavior
- CTA hierarchy
- Full Details / Edit / Alert actions

---

## Build in This Phase

### 1. Clickable Hot Stocks rows

Update `HotStocksTable` so each stock row can be selected.

Requirements:

- Clicking a row sets the selected stock
- Selected row gets a subtle highlight
- Rows keep the existing hover state and `cursor-pointer`
- No route navigation is needed
- The selected row should remain visible behind the drawer

---

### 2. Stock Preview Drawer

Create a new drawer component, suggested file:

```txt
src/components/dashboard/StockPreviewDrawer.tsx
```

The drawer should:

- Slide in from the right
- Use a premium dark SaaS style
- Avoid heavy modal behavior
- Keep the dashboard visible behind it
- Use no overlay, or only a very subtle overlay if necessary
- Have a clear left border and shadow
- Be scrollable internally if content is long
- Have a sticky header and sticky CTA footer if practical

Suggested desktop width:

```txt
500px–560px
```

---

## Drawer Content Requirements

### 1. Sticky Header

Show:

- Symbol
- Company name
- Setup badge
- Close button
- Current price
- Daily change
- Last updated text, for example: `Updated 2m ago`
- Signal Quality badge
- Risk badge
- Universe badge or text: `US Stocks`

Example content:

```txt
NVDA
NVIDIA Corporation
$924.32  +5.42%
Signal: Strong but Extended | Risk: Medium | Updated 2m ago
```

---

### 2. Decision Snapshot

This is the most important product section.

Show a compact card with:

- Setup
- Suggested action
- Main catalyst
- FOMO risk
- Entry context

Use decision-support language only. Do not use direct financial advice language.

Good examples:

- `Track closely`
- `Wait for pullback`
- `Near entry zone`
- `Extended`
- `Needs confirmation`
- `High-risk setup`
- `Worth watching`

Avoid:

- `Buy now`
- `Sell now`
- `Guaranteed upside`

---

### 3. Score Cards

Show two score cards side by side where possible:

#### Hot Score

- Score value
- Delta value
- Label
- Short explanation

#### Opportunity Score

- Score value
- Delta value
- Label
- Short explanation

Use subtle semantic color:

- Warm/orange accent for Hot Score
- Emerald/green accent for Opportunity Score
- Green delta for positive
- Red delta for negative

---

### 4. AI Insight

Create a structured AI Insight card using mock content.

Suggested rows:

- `What’s happening`
- `What it means`
- `What to watch`

Also show:

- Sentiment badge
- Generated time
- Small disclaimer:

```txt
Research support only. Not financial advice.
```

---

### 5. Price Context

Add a compact chart-like card.

Since this phase uses mock data only, the chart can be a styled placeholder or simple mock line/area visualization.

Show:

- Title: `Price Context`
- Timeframe pills: `1D`, `1W`, `1M`, `6M`
- Current price marker/label
- Entry zone
- Target
- Distance to target
- Entry context, for example: `Above ideal entry zone`

Do not add a real charting library unless it is already available and simple to use.

---

### 6. Score Breakdown

Add a section titled:

```txt
Why these scores?
```

Show compact rows or progress bars for:

Hot Score breakdown:

- Momentum
- Volume Heat
- Catalyst
- Technicals

Opportunity Score breakdown:

- Analyst Upside
- Fundamentals
- Valuation
- Entry Quality

Mock values are acceptable.

---

### 7. Main Catalyst

Show a compact catalyst card with:

- Catalyst type
- Short explanation
- Confidence
- Source/time text

Example:

```txt
AI demand surge
Data center revenue and chip demand remain strong.
Confidence: High
Latest market update · 2h ago
```

---

### 8. Watch Context

If the stock is already in the watchlist, show:

- In Watchlist: Yes
- Entry zone
- Target
- Stop loss if available
- Since added mock value
- Hot Score change mock value
- Opportunity Score change mock value
- Latest personal signal

If the stock is not in the watchlist, show:

- Not in watchlist yet
- Suggested tracking reason
- Primary CTA should be `Add to Watchlist`

---

### 9. Sticky CTA Footer

Add bottom CTA area.

If stock is already in watchlist:

- Primary: `View Full Details`
- Secondary: `Edit Watchlist`
- Secondary: `Create Alert`

If stock is not in watchlist:

- Primary: `Add to Watchlist`
- Secondary: `Create Alert`
- Tertiary: `View Full Details`

In this phase, buttons do not need to open forms yet.

They can be non-functional placeholders or simple buttons with no action.

---

## Component Suggestions

Suggested new or updated files:

```txt
src/components/dashboard/StockPreviewDrawer.tsx
src/components/dashboard/HotStocksTable.tsx
src/app/page.tsx
```

Optional helper component files if useful:

```txt
src/components/dashboard/DrawerScoreCard.tsx
src/components/dashboard/DrawerSection.tsx
```

Keep the implementation simple. Do not over-componentize unless it improves readability.

---

## Out of Scope for This Feature

Do not build these in Phase 2:

- Create Alert form
- Add to Watchlist form
- Edit Watchlist form
- Success state after adding to watchlist
- Full Scanner page
- Full Stock Details page
- Full Watchlist page
- Full Alerts page
- Mobile-specific drawer redesign
- Real chart integration
- Real AI API calls
- Real market data API calls
- Prisma/database work
- Auth work
- Stripe/monetization work

The drawer CTA buttons can exist visually, but their full behavior belongs to a later phase.

---

## Acceptance Criteria

The feature is complete when:

- Clicking a row in `HotStocksTable` opens a right-side stock preview drawer
- The selected row is visually highlighted
- The drawer can be closed
- The dashboard remains visible behind the drawer
- The drawer does not use a heavy dark overlay
- Drawer content uses mock data only
- The drawer includes:
  - Header
  - Decision Snapshot
  - Hot and Opportunity score cards
  - AI Insight
  - Price Context
  - Score Breakdown
  - Main Catalyst
  - Watch Context
  - CTA footer
- Watchlist and non-watchlist stocks show different CTA/context states
- Build passes successfully with:

```txt
npm run build
```

- There are no TypeScript errors
- There are no unused imports or obvious lint issues

---

## Implementation Notes for AI Agent

- Build incrementally.
- Start by adding selected stock state in the dashboard page.
- Then update `HotStocksTable` to accept selection props.
- Then add the drawer component.
- Use existing mock data first.
- Add small mock-only derived values where needed.
- Keep the design close to the screenshots.
- Do not start Phase 3 action forms.
- Ask before large refactors.
- Do not commit unless explicitly asked.

---

## History

- Initial Next.js setup: Cleaned up boilerplate by keeping only H1 in `page.tsx`, removed default CSS styles in `globals.css` while keeping Tailwind import, deleted default SVG files, committed changes, and pushed to GitHub repository.
- Planned dashboard implementation in multiple phases.
- Current feature defined as Phase 1: Dashboard Static Layout with Mock Data.
- Phase 1 completed (2026-05-11): Built full dashboard shell with sidebar, top bar, and all 10 widgets using mock data only. Installed lucide-react. Created `src/lib/formatters.ts` and all components under `src/components/layout/` and `src/components/dashboard/`. Polish pass: fixed Today's Signal copy, separated setup status from catalyst in mock data, changed logo accent to emerald, added bottom scroll padding. Build passes with zero TypeScript errors. Approved by user.
