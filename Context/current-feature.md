# Current Feature

## Feature Name

Dashboard Phase 1 — Static Layout with Mock Data

## Status

Completed

---

## Context

This feature builds the first implementation phase of the FomoFilter dashboard.

FomoFilter is an AI-powered hot stock discovery and tracking platform. The dashboard should help users quickly understand:

- What is hot today
- Which stocks are gaining momentum
- Which stocks are worth tracking
- Which alerts and AI insights need attention
- Which setups are available for deeper scanning

This phase should focus only on the main dashboard static layout using existing mock data.

Use the project context files before implementation:

- `Context/CLAUDE.md`
- `Context/project-overview.md`
- `Context/coding-standards.md`
- `Context/ai-interaction.md`
- `Context/current-feature.md`

---

## Important Implementation Scope

### Build in this phase

Build the dashboard UI using mock data from:

```txt
src/lib/mock-data.ts
```

The dashboard should use the existing mock data exports:

- `mockUser`
- `mockTodaysSignal`
- `mockMarketStats`
- `mockSummaryCards`
- `mockHotStocks`
- `mockTopScoreChanges`
- `mockWatchlist`
- `mockDiscoverSetups`
- `mockAiInsights`
- `mockRecentAlerts`

### Do not build in this phase

Do not build these yet:

- Stock preview drawer
- Create Alert flow
- Add to Watchlist flow
- Edit Watchlist flow
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

Those will be handled in later phases.

---

## Phase Plan

The dashboard should be built incrementally across multiple phases.

### Phase 1 — Dashboard Static Layout with Mock Data

Current task.

Build the main dashboard layout with mock data only.

### Phase 2 — Stock Preview Drawer

Later task.

Clicking a stock row opens the right-side stock preview drawer.

Reference screenshots for later:

- `Context/screenshots/Hot-stocks-click-open-right-pannel.png`
- `Context/screenshots/Hot-stocks-click-open-right-pannel-bottom.png`
- `Context/screenshots/Hot-stocks-click-open-right-pannel-bottom-2.png`

### Phase 3 — Drawer Actions

Later task.

Add interaction states for:

- Create Alert
- Add to Watchlist
- After Add to Watchlist success state

Reference screenshots for later:

- `Context/screenshots/Hot-stocks-click-open-right-pannel-adding-alert.png`
- `Context/screenshots/Hot-stocks-click-open-right-pannel-adding-to-watchlist.png`

### Phase 4 — Responsive / Mobile Polish

Later task.

Improve mobile-specific dashboard and stock card layouts.

### Phase 5 — Real Data Integration

Later task.

Replace mock data with database/API-backed data.

---

## Primary Goal

Replace the current placeholder home page with a polished desktop-first dashboard for FomoFilter.

The current app page only shows:

```tsx
<h1>To get started, edit the page.tsx file.</h1>
```

Replace it with the Phase 1 dashboard.

---

## Relevant Screenshot References for Phase 1

Use these screenshots as visual references. The implementation does not need to be pixel-perfect, but it should closely match the product structure, visual hierarchy, and dark dashboard feel.

### Main dashboard top

```txt
Context/screenshots/Main-screen-Top.png
```

Use this for:

- Sidebar
- Top navigation bar
- Dashboard title
- Data freshness text
- Universe selector
- Today’s Signal
- Market index cards
- Summary KPI cards
- Top of Hot Stocks table
- Top Score Changes placement

### Main dashboard lower area

```txt
Context/screenshots/Main-screen-bottom.png
```

Use this for:

- Hot Stocks table
- Discover Setups grid
- Top Score Changes
- My Watchlist widget

### Main dashboard bottom/right widgets

```txt
Context/screenshots/Main-screen-bottom-2.png
```

Use this for:

- AI Insights widget
- Recent Alerts widget
- Lower right column spacing
- Bottom page continuation

---

## Layout Requirements

### Overall layout

Use a desktop-first dashboard shell:

- Fixed left sidebar
- Top bar across the main content area
- Main content area with dashboard sections
- Dark mode first
- Clean financial SaaS look
- Subtle borders
- Rounded cards
- Compact but readable spacing

Suggested page structure:

```txt
DashboardShell
├── Sidebar
├── MainArea
│   ├── TopBar
│   └── DashboardContent
│       ├── DashboardHeader
│       ├── TodaysSignalCard
│       ├── MarketStatsGrid
│       ├── SummaryCardsGrid
│       ├── MainDashboardGrid
│       │   ├── LeftColumn
│       │   │   ├── HotStocksTable
│       │   │   └── DiscoverSetups
│       │   └── RightColumn
│       │       ├── TopScoreChanges
│       │       ├── WatchlistWidget
│       │       ├── AiInsightsWidget
│       │       └── RecentAlertsWidget
```

---

## Sidebar Requirements

The sidebar should include:

- FomoFilter logo / initials block
- App name: `FomoFilter`
- Navigation items:
  - Dashboard
  - Scanner
  - Watchlist
  - Alerts
  - Stocks
  - AI Insights
- Alerts badge showing `3`
- Bottom section:
  - Settings
  - User profile block using `mockUser`

Use Lucide icons where appropriate.

Suggested icons:

- Dashboard: `LayoutDashboard`
- Scanner: `Radar`
- Watchlist: `Star`
- Alerts: `Bell`
- Stocks: `LineChart`
- AI Insights: `Sparkles`
- Settings: `Settings`

---

## Top Bar Requirements

The top bar should include:

- Sidebar collapse icon placeholder/button
- Global search input with placeholder:

```txt
Search ticker or company...
```

- Data freshness text:

```txt
US Stocks | Updated 2 min ago | Delayed data
```

- Universe selector:

```txt
Universe: US Stocks
```

- Notification icon with badge `3`

In Phase 1, these controls do not need real functionality.

---

## Dashboard Content Requirements

### 1. Dashboard Header

Show:

```txt
Dashboard
Market overview and your tracked stocks
```

---

### 2. Today’s Signal

Use `mockTodaysSignal`.

This card should feel like an AI brief, not a generic notification.

Required elements:

- AI/spark icon
- Title: `Today's Signal`
- Small badge: `AI Brief`
- Summary from `mockTodaysSignal.summary`
- Tag pills from `mockTodaysSignal.tags`

Style notes:

- Slight purple/AI accent
- Dark card
- Clear but not overly bright

---

### 3. Market Stats

Use `mockMarketStats`.

Display 4 cards:

- S&P 500
- NASDAQ
- DOW
- VIX

Each card should show:

- Label
- Value
- Change percentage
- Green/red directional styling based on `up`

---

### 4. Summary KPI Cards

Use `mockSummaryCards`.

Display 3 cards:

- Hot Stocks Today
- Top Opportunities
- Active Alerts

Each card should show:

- Icon
- Value
- Label
- Optional short subtext, for example:
  - `Score > 80`
  - `Score > 75`
  - `3 triggered today`

---

### 5. Hot Stocks Today Table

Use `mockHotStocks`.

The dashboard table should be compact and decision-oriented.

Columns for Phase 1:

- Favorite star
- Symbol + company name
- Price
- Daily change
- Setup
- Hot score
- Opportunity score
- Risk
- Catalyst

For each row:

- Symbol should be prominent
- Company name should be muted below symbol
- Price should be formatted as currency
- Change should be green/red
- Setup should be shown as a small badge
- Hot and Opportunity scores should be small score pills
- Risk should be a colored badge
- Catalyst should include title and a small muted line if space allows
- Show a subtle row hover state

Important:

- Do not implement row click drawer yet.
- It is okay to make rows look clickable visually, but no drawer behavior in Phase 1.
- Keep the horizontal table manageable. If needed, allow horizontal overflow only inside the table container.

---

### 6. Top Score Changes Widget

Use `mockTopScoreChanges`.

Show a compact card list with:

- Symbol
- Hot score + delta
- Opportunity score + delta
- Optional reason if space allows

Positive deltas should be green. Negative deltas should be red.

This widget should help answer:

> Which stocks are heating up now?

---

### 7. My Watchlist Widget

Use `mockWatchlist`.

Show a compact card/list view with:

- Symbol
- Company name
- Price
- Daily change
- Status badge
- Entry zone
- Target
- Notes
- Hot/Opp score if space allows

The watchlist should feel personal and decision-oriented, not just a list of tickers.

---

### 8. Discover Setups

Use `mockDiscoverSetups`.

Show a grid of setup cards.

Each setup card should include:

- Icon
- Setup name
- Number of stocks or ticker count
- Top tickers
- Description

Suggested section title:

```txt
Discover Setups
```

Include a small `All Views` link/button.

---

### 9. AI Insights Widget

Use `mockAiInsights`.

Each insight card should show:

- Symbol
- Sentiment badge
- Title
- Summary
- Time generated, e.g. `10 min ago`

Include subtle disclaimer text near the bottom:

```txt
Research support only. Not financial advice.
```

---

### 10. Recent Alerts Widget

Use `mockRecentAlerts`.

Show:

- Section title: `Recent Alerts`
- Badge for new alerts count
- Alert cards with:
  - Symbol
  - Message
  - Note
  - Time ago
  - Icon based on alert type/icon

Alerts should feel like insight alerts, not dry system logs.

---

## Component Suggestions

Follow the file organization rules in `Context/coding-standards.md`.

Suggested components:

```txt
src/components/layout/AppSidebar.tsx
src/components/layout/TopBar.tsx
src/components/dashboard/DashboardHeader.tsx
src/components/dashboard/TodaysSignalCard.tsx
src/components/dashboard/MarketStatsGrid.tsx
src/components/dashboard/SummaryCardsGrid.tsx
src/components/dashboard/HotStocksTable.tsx
src/components/dashboard/TopScoreChanges.tsx
src/components/dashboard/WatchlistWidget.tsx
src/components/dashboard/DiscoverSetups.tsx
src/components/dashboard/AiInsightsWidget.tsx
src/components/dashboard/RecentAlertsWidget.tsx
```

Suggested utilities:

```txt
src/lib/formatters.ts
```

Potential formatter helpers:

- `formatCurrency(value: number): string`
- `formatPercent(value: number): string`
- `formatSignedNumber(value: number): string`

Keep components focused and avoid overly large files.

---

## Styling Requirements

Use Tailwind CSS v4.

Important:

- Do not create `tailwind.config.ts`
- Do not create `tailwind.config.js`
- Use Tailwind utility classes directly
- Keep the app dark-mode-first
- Use the existing `src/app/globals.css` Tailwind import

Visual direction:

- Background: near-black
- Cards: very dark gray
- Borders: subtle slate/neutral borders
- Positive values: green
- Negative values: red
- Warning/risk: amber/red
- AI accent: purple
- Text hierarchy:
  - White / near-white for primary text
  - Muted gray for secondary text

---

## Current App State

The current app is almost empty:

- `src/app/page.tsx` only renders a placeholder H1
- `src/app/layout.tsx` has the basic root layout and fonts
- `src/app/globals.css` only imports Tailwind

In this phase, update the page and add the necessary components to render the dashboard.

Do not change the app into a multi-route structure yet unless necessary.

It is acceptable for `/` to render the dashboard for now.

---

## Acceptance Criteria

The feature is complete when:

- The home page renders the Phase 1 dashboard instead of the placeholder H1
- The dashboard uses data from `src/lib/mock-data.ts`
- The visual structure matches the referenced screenshots closely enough for Phase 1
- Sidebar, top bar, dashboard widgets, tables and cards are present
- No real API/database/auth integration is added
- No drawer interactions are implemented yet
- The project builds successfully with:

```txt
npm run build
```

- There are no TypeScript errors
- There are no unused imports or obvious lint issues

---

## Out of Scope for This Feature

Keep these explicitly out of scope:

- Right-side stock preview drawer
- Clicking stock rows to open drawer
- Create alert form
- Add to watchlist form
- Edit watchlist state
- Mobile stock cards polish
- Scanner page
- Watchlist page
- Alerts page
- Stock details page
- Prisma/database work
- Auth work
- Real market data work

---

## Implementation Notes for AI Agent

- Build incrementally.
- Start by creating the layout shell.
- Then add dashboard widgets one by one.
- Use mock data only.
- Keep the code readable and componentized.
- Do not over-engineer.
- Do not add features outside Phase 1.
- Ask before large refactors.
- Do not commit unless explicitly asked.

---

## History

- Initial Next.js setup: Cleaned up boilerplate by keeping only H1 in `page.tsx`, removed default CSS styles in `globals.css` while keeping Tailwind import, deleted default SVG files, committed changes, and pushed to GitHub repository.
- Planned dashboard implementation in multiple phases.
- Current feature defined as Phase 1: Dashboard Static Layout with Mock Data.
- Phase 1 completed (2026-05-11): Built full dashboard shell with sidebar, top bar, and all 10 widgets using mock data only. Installed lucide-react. Created `src/lib/formatters.ts` and all components under `src/components/layout/` and `src/components/dashboard/`. Polish pass: fixed Today's Signal copy, separated setup status from catalyst in mock data, changed logo accent to emerald, added bottom scroll padding. Build passes with zero TypeScript errors. Approved by user.
