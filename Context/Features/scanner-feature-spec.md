# Scanner Feature Specification — FomoFilter

## Document Purpose

This document defines the full product and technical vision for the **Scanner** feature in FomoFilter.

The Scanner is the main stock discovery workspace. It should eventually scan a large stock universe, rank stocks by meaningful signals, and help users find hot stocks, opportunities, and FOMO-risk setups.

This document is intentionally broader than one implementation step. It should be used to plan future development phases. Each phase should later be translated into a focused `current-feature.md` file.

---

## 1. Feature Identity

| Field | Value |
| --- | --- |
| Feature name | Scanner |
| Route | `/scanner` |
| Product role | Main stock discovery workspace |
| Core purpose | Help users discover, filter, rank, inspect, and track market opportunities |
| Initial data source | Existing Prisma DB data seeded from mock data |
| Future data source | External market data APIs + scoring engine |
| Main interaction | Filter/sort stocks → open Stock Preview Drawer → add to watchlist or create alert |

---

## 2. Product Problem

Retail investors often discover hot stocks too late. Most stock screeners show raw data, but they do not clearly explain:

- Which stocks are worth checking today
- Why a stock is moving
- Whether the move is backed by real signals or just hype
- Whether a stock is still an opportunity or already overextended
- Which stocks are becoming interesting before they are obvious
- Which stocks are risky FOMO traps

The Scanner should reduce noise and help users quickly find stocks that deserve attention.

---

## 3. Core Value Proposition

The Scanner should not be only a table of stocks.

It should answer:

> Which stocks are interesting right now, why are they interesting, and what should I do next: track, wait, avoid, or investigate deeper?

### Main value layers

1. **Discovery** — surface interesting stocks from a large universe.
2. **Ranking** — sort by meaningful signals, not only price movement.
3. **Filtering** — allow the user to narrow by risk, setup, sector, watchlist state, alerts, and signal type.
4. **Explanation** — show why each stock appears in the Scanner.
5. **Action** — let the user open the existing drawer, add to watchlist, edit watchlist, remove, or create alerts.

---

## 4. Future Vision

Eventually, the Scanner should scan a broad universe such as:

- Russell 1000
- S&P 500
- Nasdaq 100
- NYSE + Nasdaq common stocks
- Custom user watch universe
- Sector-specific universes such as AI, semiconductors, fintech, software, healthcare

The final Scanner should rank stocks using data such as:

- Daily / weekly / monthly price change
- Relative volume
- Momentum trend
- Analyst target upside
- Valuation
- Fundamental quality
- Technical setup
- News / catalyst strength
- Earnings reactions
- Risk and volatility
- FOMO risk
- User watchlist and alert state

---

## 5. Current Phase Goal

The first implementation should be **Scanner Page Foundation**.

This phase should create a usable `/scanner` page that uses the existing DB-backed data and reuses the already-built Stock Preview Drawer.

### Current phase should include

- New `/scanner` route
- Scanner page header
- View pills / saved setup views
- Search by ticker/company
- Basic filters
- Sorting
- Desktop scanner table
- Mobile stock cards
- Result count
- Empty state
- Reuse of existing Stock Preview Drawer
- Reuse of existing watchlist and alert actions
- Data loaded from Prisma through server-side loader

### Current phase should not include

- External market API integration
- Live market data sync
- Real scoring algorithm calculation
- Saved custom scanner views
- Advanced filter builder
- Pagination for large datasets
- Export
- AI-powered natural language search
- Stock comparison
- Auth / multi-user behavior beyond current demo user
- Alert evaluation engine

---

## 6. User Flow

### Primary flow

1. User opens `/scanner`.
2. User sees a ranked stock table and setup view pills.
3. User searches or filters the list.
4. User sorts by score, change, volume, upside, or risk.
5. User clicks a stock row/card.
6. Existing Stock Preview Drawer opens.
7. User reviews scores, catalyst, AI insight, watch context, and alerts.
8. User takes action:
   - Add to Watchlist
   - Edit Watchlist
   - Remove from Watchlist
   - Create Alert
   - View Full Details later

### Secondary flow

1. User selects a Scanner view such as `FOMO Risk`.
2. Scanner filters/ranks stocks that match that view.
3. User opens stocks one by one in the drawer.
4. User tracks or avoids based on the drawer decision snapshot.

---

## 7. Scanner Views

Scanner views are predefined discovery modes. In the first phase, they can be implemented as client-side filters over the current DB data.

| View | Purpose | Suggested logic for MVP |
| --- | --- | --- |
| Hot Today | Shows the hottest current movers | Sort by Hot Score descending |
| Strong Momentum | Shows stocks with strong trend | Hot Score high + positive daily change |
| Best Opportunities | Shows attractive risk/reward setups | Opportunity Score descending |
| Unusual Volume | Shows volume-driven movers | Relative Volume descending |
| FOMO Risk | Shows hot but risky/extended names | Hot Score high + Risk High/Extreme or Opportunity lower |
| In Watchlist | Shows only tracked stocks | `inWatchlist = true` |
| Alert Active | Shows stocks with active alerts | `hasActiveAlerts = true` |
| Near Entry | Shows stocks near useful entry zone | Setup Status = Near Entry, or later algorithmic |
| Earnings Crash Watch | Future view for post-earnings drops | Out of scope for first phase unless data exists |

### Initial required views

For Scanner Foundation, implement these first:

- Hot Today
- Strong Momentum
- Best Opportunities
- Unusual Volume
- FOMO Risk
- In Watchlist
- Alert Active

---

## 8. Filters

### MVP filters

| Filter | Type | Notes |
| --- | --- | --- |
| Search | Text | Search by ticker or company name |
| Sector | Dropdown | Values derived from available stocks |
| Risk Level | Dropdown / pills | All, Low, Medium, High, Extreme |
| Setup Status | Dropdown | Pullback Watch, Extended, Track, Avoid, Near Entry |
| Watchlist Only | Toggle | Show only stocks in user watchlist |
| Alert Active Only | Toggle | Show only stocks with active alerts |

### Future filters

| Filter | Notes |
| --- | --- |
| Market cap range | Small, mid, large, mega cap |
| Price range | Min/max price |
| Daily change range | Useful for momentum or crash views |
| Weekly / monthly change range | Longer-term trend filtering |
| Relative volume range | Unusual volume discovery |
| Analyst upside range | Opportunity discovery |
| Hot Score range | Score threshold |
| Opportunity Score range | Score threshold |
| Valuation filters | Forward P/E, PEG, etc. |
| Earnings date window | Before/after earnings |
| Catalyst type | Earnings, analyst upgrade, contract, sector news, technical breakout |
| Country/exchange | US first, later international |
| Exclude FOMO Risk | Hide high-risk overextended stocks |

---

## 9. Sorting

### MVP sorting options

| Sort option | Direction | Purpose |
| --- | --- | --- |
| Best Signal | Desc | Combined score, future default ranking |
| Hot Score | Desc | Hottest names first |
| Opportunity Score | Desc | Best opportunity first |
| Daily Change | Desc | Biggest daily movers |
| Relative Volume | Desc | Unusual volume first |
| Analyst Upside | Desc | Highest target upside first |
| Market Cap | Desc | Largest companies first |
| Risk Level | Desc / custom | Higher risk first for FOMO review |
| Symbol | Asc | Alphabetical fallback |

### Default sort recommendation

Initial phase:

```txt
Hot Score descending
```

Future default:

```txt
Best Signal Score descending
```

---

## 10. Ranking Concepts

The Scanner should eventually support multiple ranking concepts.

### Hot Score

Answers:

> How hot is this stock right now?

Uses:

- Price momentum
- Relative volume
- Catalyst strength
- Technical trend
- Market activity

### Opportunity Score

Answers:

> Is this still an attractive opportunity?

Uses:

- Analyst upside
- Valuation
- Fundamental quality
- Entry quality
- Risk adjustment

### FOMO Risk

Answers:

> Is this stock potentially overextended or dangerous to chase?

Uses:

- Very high Hot Score
- High/Extreme risk
- Negative or falling Opportunity Score
- Price far above entry zone or moving averages
- Extreme relative volume without enough catalyst support

### Best Signal Score — future

A future composite ranking could combine:

```txt
Best Signal = Hot Score + Opportunity Score + Catalyst Strength - Risk Penalty
```

This should not be implemented in Scanner Foundation unless already available.

---

## 11. Data Contract

The Scanner UI should depend on a clear data shape. This avoids coupling the UI directly to Prisma model details.

### Suggested TypeScript shape

```ts
type ScannerStock = {
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

### Data principles

- UI components should receive normalized plain objects.
- Prisma types should remain in server-side loaders.
- Client components should not import Prisma directly.
- Existing drawer should receive the same data it currently needs.
- If a required field does not exist, derive it from available DB data rather than adding schema immediately.

---

## 12. Database Model Mapping

The Scanner should initially use existing Phase 5/6 models.

### Existing relevant models

| Model | Scanner usage |
| --- | --- |
| `Stock` | Symbol, name, sector, industry, market cap |
| `StockQuote` | Price, daily change, relative volume |
| `StockScore` | Hot Score, Opportunity Score, Risk Level |
| `StockDrawerDetail` | Setup status, catalyst, AI/drawer details if available |
| `WatchlistItem` | Watchlist state for current user |
| `AlertRule` | Active alert state for current user |
| `DiscoverSetup` | Optional source for view pills/cards |
| `AiInsight` | Optional supporting insight data |
| `RecentAlert` | Widget only; not the same as AlertRule |

### Important rule

Do not create new DB tables for Scanner Foundation unless the existing schema truly cannot support the first version.

Most Scanner Foundation work should be possible through:

- Loader/query changes
- UI components
- Client-side filtering/sorting
- Reuse of existing drawer actions

---

## 13. Data Loading Strategy

### First phase

Create a server-side scanner data loader such as:

```txt
src/lib/data/scanner.ts
```

Possible function:

```ts
getScannerData()
```

It should:

- Load stocks from Prisma
- Include latest quote data
- Include latest score data
- Include drawer detail fields needed by the row/card
- Include watchlist state for the current demo user
- Include active alert state for the current demo user
- Return normalized `ScannerStock[]`

### Important

Do not query Prisma from client components.

The `/scanner` page should be a server component that loads data and passes it into a client component for filtering/sorting/drawer interaction.

### Suggested structure

```txt
src/app/scanner/page.tsx
src/lib/data/scanner.ts
src/components/scanner/ScannerClient.tsx
src/components/scanner/ScannerHeader.tsx
src/components/scanner/ScannerControls.tsx
src/components/scanner/ScannerTable.tsx
src/components/scanner/MobileScannerCard.tsx
src/components/scanner/ScannerEmptyState.tsx
```

---

## 14. UI Structure

### Desktop layout

```txt
ScannerPage
├── AppShell / Sidebar / TopBar
└── MainContent
    ├── ScannerHeader
    ├── ScannerViewPills
    ├── ScannerControls
    │   ├── Search
    │   ├── Sector filter
    │   ├── Risk filter
    │   ├── Setup filter
    │   └── Sort dropdown
    ├── ResultsSummary
    ├── ScannerTable
    └── StockPreviewDrawer
```

### Mobile layout

```txt
ScannerPage Mobile
├── TopBar with hamburger/search
├── Header
├── Horizontal view pills
├── Compact filters
├── Result count
├── Mobile stock cards
└── Full-screen StockPreviewDrawer
```

---

## 15. Desktop Table Columns

### Required columns for Scanner Foundation

| Column | Description |
| --- | --- |
| Star | Watchlist state |
| Symbol / Company | Main identifier |
| Price | Current/latest price |
| Daily Change | Daily movement |
| Hot Score | Current heat score |
| Opportunity Score | Opportunity score |
| Risk | Risk level badge |
| Setup | Setup status |
| Rel Volume | Relative volume |
| Analyst Upside | Analyst target upside |
| Catalyst | Reason/mover text |
| Alert | Active alert indicator |

### Row behavior

- Row hover state
- Row selected state when drawer is open
- Click row opens existing `StockPreviewDrawer`
- Star shows watchlist state
- Alert indicator shows if active alerts exist
- Should not open a separate Stock Details page yet

---

## 16. Mobile Card Content

Each mobile card should show:

- Symbol
- Company name
- Price
- Daily change
- Hot Score
- Opportunity Score
- Risk badge
- Setup badge
- Catalyst
- Watchlist star
- Alert indicator if active

Clicking a mobile card should open the full-screen drawer.

---

## 17. Reuse of Existing Drawer

Scanner should not create a new drawer.

It should reuse:

```txt
src/components/dashboard/StockPreviewDrawer.tsx
```

or the drawer should be moved to a shared location if needed, such as:

```txt
src/components/stocks/StockPreviewDrawer.tsx
```

### Rule

Do not duplicate drawer code.

If moving the drawer to a shared folder is needed, do it carefully and update imports.

### Drawer behavior on Scanner

- Same content as dashboard drawer
- Same Add/Edit/Remove Watchlist actions
- Same Create Alert action
- Same Alert Active indicator
- Same mobile full-screen behavior
- Same `router.refresh()` behavior after mutations

---

## 18. Client-Side State

The Scanner client component should manage:

- Selected stock symbol
- Active scanner view
- Search query
- Filter values
- Sort option

### Suggested state

```ts
type ScannerViewSlug =
  | "hot-today"
  | "strong-momentum"
  | "best-opportunities"
  | "unusual-volume"
  | "fomo-risk"
  | "in-watchlist"
  | "alert-active";
```

```ts
type ScannerSortKey =
  | "hotScore"
  | "opportunityScore"
  | "dailyChange"
  | "relativeVolume"
  | "analystUpside"
  | "marketCap"
  | "symbol";
```

### Filtering approach

For Scanner Foundation:

- Perform filtering/sorting client-side.
- Do not implement server-side filtering yet.
- Do not implement URL params yet unless simple and low-risk.

---

## 19. Empty, Loading, and Error States

### Empty state

If filters return zero stocks, show:

```txt
No stocks match your filters.
Try changing the scanner view or clearing filters.
```

Actions:

- Clear filters
- Reset to Hot Today

### Loading state

If needed for client transitions, use skeletons or subtle loading indicators.

### Error state

If data loading fails, show a user-friendly error message and avoid crashing the page.

---

## 20. Suggested Development Phases for Scanner

### Phase 7A — Scanner Definition and Data Contract

- Define `ScannerStock` data shape
- Identify fields available from DB
- Create `getScannerData()` loader
- Avoid schema changes unless necessary

### Phase 7B — Scanner Route and Static Layout

- Add `/scanner` route
- Reuse app shell
- Add header, view pills, controls, and placeholder table area

### Phase 7C — Scanner Table and Mobile Cards

- Render DB-backed scanner stocks
- Build desktop table
- Build mobile cards
- Add result count and empty state

### Phase 7D — Search, Filters, and Sorting

- Implement client-side search
- Implement view pills
- Implement basic filters
- Implement sorting

### Phase 7E — Drawer Reuse

- Connect row/card click to existing drawer
- Ensure Add/Edit/Remove Watchlist works from scanner
- Ensure Create Alert works from scanner
- Ensure Alert Active and star state update after `router.refresh()`

### Phase 7F — Polish and Validation

- Responsive polish
- Check overflow/table width
- Build validation
- Manual testing

---

## 21. Current Feature Scope Recommendation

For the first `current-feature.md` generated from this spec, use this scope:

### Feature name

```txt
Scanner Page Foundation — Route, DB Loader, Filters, Sorting, and Drawer Reuse
```

### Include

- `/scanner` route
- `getScannerData()` loader
- desktop scanner table
- mobile scanner cards
- view pills
- search
- basic filters
- sorting
- result count
- empty state
- reuse existing drawer and persisted actions

### Exclude

- scoring engine
- live API
- saved custom scanner views
- pagination
- stock details page
- auth
- AI generation
- alert evaluation engine

---

## 22. Acceptance Criteria for Scanner Foundation

The feature is complete when:

- `/scanner` route exists and renders inside the existing app shell
- Scanner uses Prisma-loaded data, not runtime mock imports
- User can search by symbol/company
- User can switch predefined scanner views
- User can filter by sector, risk, setup, watchlist state, and alert state
- User can sort by score/change/volume/upside
- Result count updates based on filters
- Empty state appears when no results match
- Desktop table is usable and visually aligned with the dashboard
- Mobile stock cards are usable and visually aligned with dashboard mobile cards
- Clicking a row/card opens the existing Stock Preview Drawer
- Existing drawer actions work from the scanner:
  - Add Watchlist
  - Edit Watchlist
  - Remove Watchlist
  - Create Alert
- Table/card watchlist and alert states update after mutations
- No new Prisma migration is added unless explicitly required and approved
- `npm run build` passes
- `npx prisma validate` passes
- Existing dashboard behavior remains intact

---

## 23. Out of Scope

Keep these explicitly out of scope for Scanner Foundation:

- Real market API connection
- Scheduled stock universe sync
- Live quotes
- Real Hot Score calculation engine
- Real Opportunity Score calculation engine
- AI-generated Scanner explanations
- Saved custom filters
- User-defined scanner views
- Pagination for thousands of rows
- Stock comparison
- Export CSV
- Full Stock Details page
- Full Watchlist page
- Full Alerts page
- Auth implementation
- Alert evaluation engine
- Email/push notification delivery

---

## 24. Product Notes and Decisions

### Why Scanner before API?

The Scanner page defines what data and interactions the product needs. Building this first helps avoid selecting a market data API too early.

Once the Scanner is working with existing DB data, it will be easier to decide which API fields are truly required.

### Why not build scoring now?

The Scanner can first display existing scores from the DB. A scoring engine should be a separate phase to avoid mixing UI, filtering, data quality, and algorithm design in one large task.

### Why reuse drawer?

The drawer already contains the action loop. Reusing it prevents duplication and ensures the user experience is consistent across Dashboard and Scanner.

---

## 25. Future Phases After Scanner Foundation

Recommended sequence:

1. **Watchlist Page** — manage tracked stocks in a full page.
2. **Alerts Page** — manage alert rules and triggered alerts.
3. **Scoring Engine v1** — calculate Hot/Opportunity/Risk from available data.
4. **Market Data API Research** — compare providers and choose the first integration.
5. **Market Data Provider Layer** — create abstraction for selected provider.
6. **Market Data Sync** — import quotes/fundamentals/analyst data.
7. **Alert Evaluation Engine** — evaluate active alerts against refreshed data.
8. **AI Insight Generation** — replace static/seeded insights with AI-generated summaries.
9. **Auth and User Accounts** — replace demo user with real accounts.

---

## 26. Implementation Rules for AI Agents

Before implementing any scanner phase:

- Read `Context/CLAUDE.md`
- Read `Context/project-overview.md`
- Read `Context/coding-standards.md`
- Read `Context/ai-interaction.md`
- Read the current `Context/current-feature.md`

Development rules:

- Investigate existing components before creating new ones.
- Reuse existing dashboard/drawer components when possible.
- Do not duplicate the stock drawer.
- Do not create a Prisma migration unless truly required.
- Do not introduce external APIs in Scanner Foundation.
- Do not change working dashboard behavior.
- Keep changes incremental.
- Run build before completion.
- Do not commit without user approval.

---

## 27. Open Questions

These do not block Scanner Foundation:

1. Which final universe should be supported first: Russell 1000, S&P 500, Nasdaq 100, or NYSE/Nasdaq common stocks?
2. Should Scanner filters eventually be reflected in URL query params?
3. Should users be able to save custom scanner views?
4. Should Scanner support server-side filtering/pagination when the stock universe grows?
5. What should the final `Best Signal` formula be?
6. Which market data API best supports all required fields at acceptable cost?
7. Should Scanner include AI-generated explanations per row, or only inside the drawer?

---

## 28. Final Product Intent

The Scanner should become the main engine of FomoFilter.

It should help the user move from:

```txt
I wonder which stocks are interesting today...
```

to:

```txt
Here are the best-ranked setups right now, why they matter, which are risky, and which ones I should track.
```

The first foundation phase should not solve everything. It should establish the route, layout, data contract, filtering/sorting behavior, and drawer reuse needed for the Scanner to become the product’s core discovery tool.
