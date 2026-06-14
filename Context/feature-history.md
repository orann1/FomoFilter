# Feature History

## Purpose

This file stores completed phase summaries.

Do not use this as the active feature spec.

For the active feature, read:

```txt
Context/current-feature.md
```

Read this file only when historical context is required.

---

## Completed Phases

### Initial Setup

Cleaned up the default Next.js boilerplate, kept a minimal page, removed default assets/styles, and pushed the initial project to GitHub.

---

### Phase 1 — Dashboard Static Layout

Built the initial dashboard shell using mock data:

```txt
Sidebar
Top bar
Dashboard widgets
Market stats
Summary cards
Hot stocks table
AI insights
Alerts
Discover setups
```

---

### Phase 2 — Stock Preview Drawer

Added a right-side stock preview drawer opened from dashboard rows.

Initial drawer included mock/legacy content:

```txt
Decision Snapshot
Hot / Opportunity cards
AI Insight
Price Context mock chart
Score Breakdown
Main Catalyst
Watch Context
CTA footer
```

This drawer now needs cleanup in Phase 21C.

---

### Phase 3 — Drawer Actions

Added drawer action panels:

```txt
Add to Watchlist
Edit Watchlist
Create Alert
Success messages
```

Initial state was local-only.

---

### Phase 4 — Responsive Dashboard / Drawer

Made dashboard and drawer responsive:

```txt
Mobile sidebar
Mobile hot stock cards
Full-screen mobile drawer
Responsive grids
```

---

### Phase 5 — Prisma / DB Foundation

Added Prisma 7 with PostgreSQL / Neon.

Created core DB models for:

```txt
Stock
StockQuote
StockScore
StockDrawerDetail
WatchlistItem
User
AlertRule
MarketStat
Dashboard widgets
```

Dashboard started reading DB-backed data.

---

### Phase 6 — DB-Backed Drawer Actions

Replaced local-only drawer actions with Prisma-backed Server Actions:

```txt
Add/update/remove watchlist item
Create alert rule
Existing alert list
Alert Active badge
router.refresh after mutations
```

---

### Phase 7 — Scanner Foundation

Created `/scanner` route with:

```txt
Server-side scanner data loader
View pills
Search
Sort
Filters
Desktop scanner table
Mobile scanner cards
Existing drawer reuse
```

Scanner initially used earlier DB/mock-style data and legacy concepts.

---

### Phase 8 — Stock Universes

Added DB-backed stock universe support:

```txt
StockUniverse
StockUniverseMember
Russell 1000 / S&P 500 / Nasdaq 100 flags
Universe selector
Index filter
```

---

### Phase 9B–9H — Market Data Foundation

Built provider and admin sync foundations:

```txt
FMP provider
Twelve Data provider
Finnhub provider
Admin Sync page
Provider tests
SyncRun / SyncRunItem logs
Data inventory concepts
Nasdaq 100 universe sync fallback
Chunked/resumable sync foundations
Finnhub basic financials research
```

---

### Phase 9I — Fundamental Score Foundation

Added Fundamental Score calculation foundation using DB metrics.

Introduced score categories:

```txt
Growth
Profitability
Valuation
Financial Health
Risk / Context
```

Later UI language renamed Risk/Context to Stability.

---

### Phase 10 — Scanner Real Data Integration

Moved Scanner toward real DB-backed Nasdaq 100 data.

Scanner began using synced quote/metric/score data rather than only seeded mock data.

---

### Phase 11 — Scanner UX / Universe Improvements

Improved Scanner usability and universe/filter behavior.

---

### Phase 12 — Dashboard Real Data Cleanup

Replaced legacy dashboard demo fields with real DB-backed summary cards, scanner readiness, score coverage, top fundamental stocks, sector summary, data coverage, and real watchlist score display.

---

### Phase 13 — Opportunity Score v1

Added Opportunity Score v1.

Initial v1 used:

```txt
Fundamental quality
Valuation
Growth
Risk / Context
Price position
```

It did not include analyst target/upside because coverage was not reliable yet.

---

### Phase 14 — Analyst Data / Upside Integration

Added analyst data sync using FMP + Finnhub after Finnhub target endpoint limitations.

Implemented:

```txt
StockAnalystData
Target price
Upside %
Rating
Analyst count
Scanner columns
Dashboard analyst coverage
Data inventory analyst columns
```

---

### Phase 15 — Quota-Safe Analyst Target Discovery

Created quota-safe target discovery flow for limited/free-plan FMP target coverage.

Later, FMP Starter made broader target coverage available, and this flow became legacy/developer tooling.

---

### Phase 16 — Admin Sync Workflow Restructure

Cleaned Admin Sync actions into production-oriented sections:

```txt
Universe Sync
Daily Market Data Sync
Company Data Sync
Score Calculation
Developer / Legacy Tools
```

---

### Phase 17 — FMP Company Data Sync Migration

Moved analyst targets to FMP `price-target-consensus`.

Cleaned provider boundaries:

```txt
fmp.ts = FMP only
finnhub.ts = Finnhub only
sync route composes providers
```

Result: target coverage became 100/100 for Nasdaq 100.

---

### Phase 18 — FMP Fundamentals / Ratios / Growth Migration

Expanded Company Data Sync to persist FMP fundamentals:

```txt
Profile
Ratios TTM
Financial growth
Margins
ROE / ROA
Debt / liquidity metrics
Valuation ratios
Beta
Market cap
```

StockMetric became FMP-owned for company/fundamental data.

---

### Phase 19 — FMP Daily Market Data Sync Migration

Moved Daily Market Data Sync from legacy Finnhub quote/basic metrics to FMP quote.

Daily sync now owns:

```txt
Price
Daily change %
Open / high / low / previous close
Volume
52-week high / low
PriceAvg50 / PriceAvg200
```

Daily sync no longer writes StockMetric.

---

### Phase 20 — Opportunity Score v2

Upgraded Opportunity Score to include analyst data.

Current v2 components:

```txt
Fundamental Quality — 25%
Valuation — 20%
Growth — 15%
Analyst Upside — 20%
Analyst Sentiment — 10%
Price Position — 5%
Stability / Risk Context — 5%
```

`oppScoreVersion = opportunity-v2`.

No provider calls are made during score calculation.

---

### Phase 21A — Scanner Decision View Cleanup

Refactored Scanner from a dense table into a decision view:

```txt
Reduced main columns
Score bars for calculated scores
Analyst rating stars
Risk renamed to Stability
Header and metric tooltips
Quick filter cleanup
Advanced Filters
Active filter summary
Expanded row sections
Chevron bug fix
Mobile card updates
```

---

### Phase 21B — Scanner Pagination, Table Usability & Expanded Row Cleanup

Completed Scanner usability cleanup:

```txt
Default view = All Stocks
Default sort = Opportunity Score descending
Pagination = 10 / 20 / 50 / 100
Search/filter/sort before pagination
Opportunity column highlight
Sort options limited to visible columns
Clear filters behavior
Decision Tag replaces Status
Company Snapshot added to expanded row
Strengths / Concerns cleaned
Mobile pagination
Expanded row overflow fixes
```

Approved schema addition during this phase:

```txt
Stock.description String?
Stock.industry String?
```

Company Data Sync now persists FMP description and industry.

Scanner maps and displays real company descriptions.

---

## Phase 21C — Drawer Real Data & Decision Workspace Cleanup

Removed all legacy/mock drawer content (Hot Score, AI Insight, Main Catalyst, FOMO Risk, Signal labels, Risk label, fake SVG chart, hardcoded "US Stocks" chip, StockDrawerDetail mock entry/target data).

Removed end-to-end dependency on `StockDrawerDetail`: Prisma include removed from `getScannerData()`, type removed from `ScannerPageClient`, prop removed from `StockPreviewDrawer`. Drawer now renders for any scanner stock using only `stock: HotStock`.

Rebuilt drawer as a **visual decision cockpit** distinct from the Scanner expanded row:

- **Hero Decision Header** — gradient background tied to opportunity strength (emerald for Strong Opportunity/Attractive, amber for Watch), Decision Tag badge, 4 metric pills (Opportunity, Fundamental, Upside, Stability)
- **Why This Stock Stands Out** — rule-based narrative (headline + summary + "Next check") built by `buildStockDecisionNarrative()` from DB-backed fields only. Labeled "Rule-based · DB-backed". Not AI-generated.
- **Key Decision Signals** — 5 colorful signal cards (Quality, Valuation, Analysts, Stability, Price Position) built by `buildSignalCards()`, each with colored left accent, status label, and detail line
- **Market Position Visual** — enhanced 52W bar with gradient zones and vertical markers for current price, 50-day avg, 200-day avg
- **My Tracking Plan** — watchlist CTA or current watchlist state as a central inline section
- **Alerts** — active alerts list with "Set Alert" CTA in section header
- **Evidence accordions** — dry metric tables (Analyst Details, All Scores, Fundamentals, Company & Data Freshness) collapsed by default so they do not dominate the layout

Extracted `buildDecisionSummary` and `ratingToStars` to shared utility `src/lib/scoring/decision-summary.ts`. Both `StockPreviewDrawer` and `ScannerExpandedRow` import from this file.

Removed `Hot Score Above` from alert creation UI. Existing `HOT_SCORE_ABOVE` DB alerts display as "Hot Score Above (legacy)". DB enum and schema unchanged. No migration added.

`StockDrawerDetail` model remains in schema (not dropped); flagged for future cleanup phase.

Expanded row retained as the primary detailed dry-data research view. Role split documented.

**Automated checks:** build ✅  tsc ✅  prisma validate ✅  migrate status ✅ (14 migrations, up to date)

**Files changed:** `src/lib/scoring/decision-summary.ts` (new), `src/components/dashboard/StockPreviewDrawer.tsx`, `src/components/scanner/ScannerExpandedRow.tsx`, `src/components/dashboard/drawer/CreateAlertPanel.tsx`, `src/components/scanner/ScannerPageClient.tsx`, `src/lib/data/scanner.ts`, `app/scanner/page.tsx`, `src/lib/mock-data.ts`, `src/types/drawer.ts`, `Context/Features/drawer-feature-spec.md`, `Context/Features/scanner-feature-spec.md`, `Context/data-model.md`

---

## Phase 21D — Dashboard Clarity Cleanup

Cleaned up the Dashboard from a mixed legacy/admin surface into a clear high-level overview and action surface.

**Deleted 9 orphaned legacy components** — all confirmed to have no active imports before deletion:

```txt
HotStocksTable.tsx
MobileHotStockCard.tsx
AiInsightsWidget.tsx
TodaysSignalCard.tsx
TopScoreChanges.tsx
DiscoverSetups.tsx
RecentAlertsWidget.tsx
MarketStatsGrid.tsx
SummaryCardsGrid.tsx
```

`StockPreviewDrawer.tsx` was retained — actively imported by `ScannerPageClient.tsx`.

`src/lib/mock-data.ts` was retained — still has active imports from Scanner components and scoring utilities.

**Opportunity Overview:** Replaced the 12-card mixed-purpose summary grid with 4 decision-facing cards (Scanner Ready, High Opportunity, Avg Opportunity, Avg Fundamental). Admin/data-health metrics demoted to the compact Data Health sidebar widget.

**New widgets:**
- `TopOpportunityStocksTable` — DB-backed, sorted by Opportunity Score descending, top 10. Primary stock-discovery widget on Dashboard. Derived from existing loaded data with no additional DB queries.
- `ActiveAlertsSummaryWidget` — DB-backed, consumes `alertRulesBySymbol` that was already loaded but unused by any prior Dashboard widget. Shows total active rules with per-symbol breakdown and alert type/threshold.

**Updated widgets:**
- `TopFundamentalStocksTable` — removed sub-score columns (Growth, Profitability, Valuation, Financial Health). Those belong in Scanner expanded row.
- `TopAnalystUpsideTable` — fixed labels: `Fund.` → Fundamental, `Opp.` → Opportunity.
- `SectorSummaryTable` — fixed labels: `Avg Fund.` → Avg Fundamental, `Avg Profit.` → Avg Profitability.
- `WatchlistWidget` — added Opportunity Score display alongside Fundamental Score; changed `WAITING_FOR_PULLBACK` display label from "Pullback" to "Waiting for Pullback"; added "Review watchlist in Scanner →" CTA.
- `DataCoverageSection` — redesigned as compact "Data Health" widget with mini coverage bars and freshness timestamps (Last Market Sync, Last Score Calc).
- `DashboardSummaryCards` — reduced from 12 to 4 cards; removed `freshness` prop dependency.

**Dashboard structure after Phase 21D:**

```txt
DashboardHeader
DataWarningsSection              (warnings only)
DashboardSummaryCards            4 opportunity cards
DashboardGrid:
  Left:   TopOpportunityStocksTable → TopAnalystUpsideTable → TopFundamentalStocksTable → SectorSummaryTable
  Right:  WatchlistWidget → ActiveAlertsSummaryWidget → DataCoverageSection
```

Scanner CTAs added throughout: "View all in Scanner →", "Open Scanner to compare all stocks", "Review watchlist in Scanner →".

No schema changes. No migrations. No provider calls. No scoring formula changes.

**Automated checks:** build ✅  tsc ✅  prisma validate ✅  migrate status ✅ (14 migrations, up to date)

**Files changed:** `app/page.tsx`, `src/lib/data/dashboard.ts`, `src/components/dashboard/DashboardGrid.tsx`, `src/components/dashboard/DashboardSummaryCards.tsx`, `src/components/dashboard/TopFundamentalStocksTable.tsx`, `src/components/dashboard/TopAnalystUpsideTable.tsx`, `src/components/dashboard/SectorSummaryTable.tsx`, `src/components/dashboard/WatchlistWidget.tsx`, `src/components/dashboard/DataCoverageSection.tsx`, `src/components/dashboard/TopOpportunityStocksTable.tsx` (new), `src/components/dashboard/ActiveAlertsSummary.tsx` (new), `Context/Features/dashboard-feature-spec.md`, `Context/current-feature.md`

---

## Phase 21E — Data Inventory / Admin Data Health Cleanup

Corrected inaccurate provider/source labels, cleaned stale terminology, labeled legacy developer tools, improved Sync History readability, and aligned Score Methodology language with current product terminology.

**No schema changes. No migrations. No provider calls. No scoring formula changes. No sync workflow behavior changes.**

**Data Inventory source label corrections:**

Quote columns (Price, Change %, Open, Day High, Day Low, Prev Close, Volume, Src Updated, 52W High, 52W Low): `Finnhub` / `N/A` → `FMP`

Metric columns (Rev Growth TTM, EPS Growth TTM, Rev Growth 3Y, Gross Margin, Op Margin, Net Margin, ROE, ROA, D/E, Current Ratio, P/E TTM, Fwd P/E, PEG, P/S, EV/EBITDA, Beta, Mkt Cap (Metric)): `Finnhub` → `FMP`

Analyst target columns (Target Price, Target High, Target Low): `Finnhub` → `FMP`

Analyst recommendation columns (Analyst Rating, Analyst Count): unchanged, remain `Finnhub`

**Terminology cleanup:**

- `Risk Scr` column label renamed to `Stability Scr`. Internal field `riskContextScore` unchanged.
- `Risk / Context` → `Stability / Risk Context` in all Score Methodology user-facing text (8 occurrences: Category Weights, Metric Scoring Rules, Example Calculation ×2, Opportunity Score v2 component table, re-normalization note).
- Fundamental Score action description: "Finnhub metrics" → "FMP financial metrics".
- Score Methodology tab subtitle: "How Fundamental Score v1 is calculated" → "How scores are calculated".

**Legacy tool labeling:**

- Test Twelve Quote: amber note — daily market data uses FMP, not Twelve Data.
- Sync Quotes Sample: amber note — legacy Twelve Data sample, not current production workflow.

**Sync History Duration column:**

Added Duration column using `durationMs` when available, falling back to `finishedAt − startedAt`. Format: `<1s`, `30s`, `4m 15s`. `colSpan` updated from 10 → 11.

**Automated checks:** build ✅  tsc ✅  prisma validate ✅  migrate status ✅ (14 migrations, up to date)

**Files changed:** `src/components/admin/DataInventoryTab.tsx`, `src/components/admin/SyncPageClient.tsx`, `src/components/admin/ScoreMethodologyTab.tsx`, `Context/Features/admin-sync-feature-spec.md`, `Context/current-feature.md`

---

## Phase 22B — Multi-Universe Unique Sync Foundation + S&P 500 Expansion

Expanded FomoFilter from a Nasdaq 100-centered universe to a multi-universe architecture supporting S&P 500. Established a reusable deduplication foundation so provider-backed sync workflows operate on unique active stock symbols across all synced universes, never syncing overlapping symbols twice.

**No schema changes. No migrations. No provider responsibility changes. No scoring formula changes.**

**Key deliverables:**

- Added S&P 500 best-effort static fallback list (`src/lib/market-data/sp500-fallback-symbols.ts`): 499 unique symbols, compositionAsOf 2025-07-01.
- Added `syncSp500UniverseAction` — syncs S&P 500 membership into `StockUniverse` / `StockUniverseMember`. Membership only; no FMP profile enrichment at sync time.
- Generalized universe sync so both Nasdaq 100 and S&P 500 use the same upsert-by-symbol / upsert-membership pattern.
- Added `getAllActiveUniqueSyncableSymbols()` — returns deduplicated normalized symbols across all active memberships.
- Updated Daily Market Data Sync (`market-data-active-symbols-sync`) and Company Data Sync (`company-data-active-symbols-sync`) to use the deduped helper. After S&P 500 sync, both syncs operate on ~518 unique active symbols, not 100.
- Fixed latest sync status endpoints (`/api/admin/sync-runs/latest`, `/api/admin/analyst-sync/latest`) to query both new and legacy run types, returning the most recent run. The UI now correctly shows 518-stock runs, not 100-stock legacy runs.
- Changed Scanner default from Nasdaq 100 to "US Stocks" (slug: `all`) — shows all unique active stocks across all synced universes. Nasdaq 100 and S&P 500 remain selectable. No duplicate rows.
- Suppressed Dashboard top-level warnings for small coverage gaps (< 5% missing). Threshold: coverage must fall below 95% to trigger `missing_metrics` or `missing_scores` warnings.
- Fixed default seed universe from `russell-1000` to `nasdaq-100`.
- Renamed Dashboard active universe count field from `activeNasdaq100` to `activeUniverseStocks`.
- Updated Admin Sync copy: "Active Nasdaq 100 stocks: 100" → "Active unique stocks: N", "Nasdaq 100 Quote Coverage" → "Active Universe Quote Coverage".
- Added `activeWithQuotes` to `DbStockSummary` for accurate active-universe coverage reporting.

**DB state after Phase 22B:**

```txt
nasdaq-100 active members: 100
sp-500 active members: 499
unique active stocks across all universes: 518
overlap (in both): 84
duplicate Stock rows by symbol: 0
```

**Automated checks:** build ✅  tsc ✅  prisma validate ✅  migrate status ✅ (14 migrations, up to date)

**Files changed (application code):** `src/lib/market-data/sp500-fallback-symbols.ts` (new), `src/actions/market-data-actions.ts`, `src/lib/data/admin-universes.ts`, `src/lib/data/admin-sync.ts`, `src/lib/data/scanner.ts`, `src/lib/data/dashboard.ts`, `src/components/admin/SyncPageClient.tsx`, `src/components/scanner/ScannerPageClient.tsx`, `app/api/admin/sync-runs/start/route.ts`, `app/api/admin/sync-runs/process-next/route.ts`, `app/api/admin/sync-runs/latest/route.ts`, `app/api/admin/analyst-sync/start/route.ts`, `app/api/admin/analyst-sync/process-next/route.ts`, `app/api/admin/analyst-sync/latest/route.ts`, `app/scanner/page.tsx`, `prisma/seed.ts`

**Files changed (documentation):** `Context/current-feature.md`, `Context/feature-history.md`, `Context/project-overview.md`, `Context/data-model.md`, `Context/sync-workflows.md`, `Context/Features/market-data-sync-strategy.md`, `Context/Features/admin-sync-feature-spec.md`, `Context/Features/scanner-feature-spec.md`, `Context/Features/dashboard-feature-spec.md`

---

### Phase 22C — Data Inventory Pagination + Sync Scale Hardening

**Goal:** Make Admin Sync, Data Inventory, and Sync History usable at 500–1000 stock scale following the Phase 22B multi-universe expansion (~518 unique active stocks).

**Branch:** `feature/data-inventory-scale-hardening`

**Key deliverables:**

- Extended `AdminStockDataInventoryRow` with `inSp500: boolean` (active S&P 500 membership) and `quoteIsStale: boolean` (lastSyncedAt > 24h threshold). Loader detects sp-500 slug membership directly.
- Added **S&P 500 column** in the Data Inventory Universe section and **S&P 500 Active** summary card.
- Added four new Data Inventory **filters**: S&P 500, Not Eligible (`!scannerEligible`), Problem Rows (`!hasQuote || !hasMetric || !hasScore || !scannerEligible`), Stale Quote (`quoteIsStale`). Filter order reordered: health filters before target discovery filters.
- Added **client-side pagination** to Data Inventory: default 50 rows, page size selector 25/50/100, prev/next controls, page X/Y display, row range readout. Page resets to 1 on filter or search change. Pagination applies after all filter/search logic.
- Capped expanded **Sync History items** at 100 per run via `take: SYNC_HISTORY_ITEM_LIMIT` in `getRecentSyncRuns()`. Constant exported from `admin-sync.ts`.
- Added **failed/skipped-only toggle** in expanded `SyncRunRow`. Truncation note shown when `items.length >= 100 && requestedCount > 100`. Toggle click does not collapse the row.
- Added **completed date/time** (`finishedAt`) to `ChunkedSyncResultPanel` for Daily Market Data and Company Data terminal results.
- Added **partial_success guidance note** (blue) when `isPartial && skippedCount > 0`: explains that skipped symbols are expected for broader S&P 500 provider coverage.
- Fixed **Universe Overview lastQuoteSync** query: changed from `type: { contains: "quote" }` to explicit type list including `market-data-active-symbols-sync`. Also removed `persisted: true` constraint — chunked market-data-active-symbols-sync runs have `persisted: false` on the SyncRun record; `successCount: { gt: 0 }` is the correct guard.

**Data coverage verified at commit (live DB):**

```txt
Total stocks:       518
inSp500:true:       499   active S&P 500 members
inSp500:false:      19    Nasdaq 100-only stocks
hasQuote:true:      516   (2 failed Daily Market Data Sync — provider no-data)
hasMetric:true:     517   (1 missing — expected FMP coverage gap)
hasScore:true:      517
hasAnalystData:     518   100% coverage
scannerEligible:    516
quoteIsStale:       0     (all quotes fresh after recent sync)
```

**No schema changes. No migrations. No provider calls added. No scoring changes. No sync workflow behavior changes. Scanner, Dashboard, and Drawer behavior unchanged.**

**Automated checks:** build ✅  tsc ✅  prisma validate ✅  migrate status ✅ (14 migrations, up to date)

**Files changed (application code):** `src/lib/data/admin-stock-data.ts`, `src/lib/data/admin-sync.ts`, `src/lib/data/admin-universes.ts`, `src/components/admin/DataInventoryTab.tsx`, `src/components/admin/SyncPageClient.tsx`

**Files changed (documentation):** `Context/current-feature.md`, `Context/feature-history.md`, `Context/project-overview.md`, `Context/Features/admin-sync-feature-spec.md`

---

## Phase 23A — Opportunity Radar Mock Experience

**Goal:** Establish the visual product direction for a future AI-assisted market discovery surface separate from Scanner, using hardcoded mock data with no real AI, DB reads/writes, provider calls, or production scoring changes.

**Branch:** `feature/opportunity-radar-mock`

**Implementation Summary:**

Built a mock-only Daily Opportunity Briefing page at `/opportunity-radar` with a Lens-based discovery system and focused 3-card Opportunity Deck:

**Core UX:**
- Hero section: "Daily Opportunity Briefing" with time controls (Today / Yesterday / Last 7 Days / Last 30 Days tabs)
- 4 Radar Lenses for discovery and contextualization:
  - Attention Spike (muted indigo): unusual attention or signal activity before story is obvious
  - Overreaction (muted amber): sharp declines that may deserve a second look
  - Value Gap (muted emerald): valuation signals disconnected from business quality
  - Future Theme (muted purple): emerging sectors or speculative growth themes
- Lens explanation banner below Lens bar with color-family-consistent styling
- 3-card Opportunity Deck showing top candidates for selected Lens
- Candidate cards displaying:
  - Ticker, company name, category badge, headline
  - 3 radar signal bullets
  - Signal Snapshot: Analyst Rating (stars), mock 1W Move (color-coded), Analyst Upside
  - Next Check section
  - Click affordance to open Intel Brief
- Intel Brief side panel with:
  - Left: Radar Narrative (why on radar, what's interesting, key concerns, next steps)
  - Right: FomoFilter Validation panel with Radar Conviction (mock-only UI) and 8 validation metrics
- Research discipline footer with responsible language and mock-only disclaimer

**Mock Data:**
- 12 fully-formed candidates (NVDA, SMCI, META, PLTR, AAPL, TSLA, AMD, SNOW, MSFT, RIVN, SOFI, IONQ)
- Complete field coverage: thesis, catalysts, bull/bear cases, scores, evidence counts, source types, tags
- History-aware fields: trend status, appearance counts, first/last seen dates, previous categories
- Signal Snapshot fields: radarConvictionScore, radarSignalStrength, opportunityScore, fundamentalScore, analystUpsidePercent, analystRating, valuationScore, stabilityScore, peRatio, 52W position, market cap, priceChange1WPercent
- Time-window filtering for tabs
- Lens-to-category mapping for discovery flow

**Radar Conviction Clarification:**
Radar Conviction is a mock-only UI concept in Phase 23A used in the Intel Brief FomoFilter Validation panel. It is NOT production scoring logic and does not replace Opportunity Score. In future phases (23C+), it will become a real DB-backed validation score computed by the AI agent. Current production scoring (Opportunity Score, Fundamental Score, etc.) remains unchanged.

**Color System & Visual Coherence:**
Each Lens has unified color identity across:
- Active button background and border
- Lens explanation banner
- Candidate card accents and borders
- Hover states with improved readability (no dark text on dark)

**Navigation & Routing:**
- New `/opportunity-radar` route (server page + client component)
- Added "Opportunity Radar" nav item to sidebar after Scanner
- Route marked as dynamic, rendered on demand
- Status clearly marked as mock-only in UI

**Files Added:**
- `app/opportunity-radar/page.tsx` — Server page wrapper
- `src/components/opportunity-radar/OpportunityRadarPageClient.tsx` — Main client component (959 lines)
- `src/lib/mock-opportunity-radar.ts` — 12 mock candidates (425 lines)
- `src/types/opportunity-radar.ts` — TypeScript types and enums

**Files Modified:**
- `app/globals.css` — Added `.radar-deck` responsive grid class
- `src/components/layout/AppSidebar.tsx` — Added Opportunity Radar nav item

**Constraints Maintained:**
- ✅ Mock UI experience only — no real AI runs
- ✅ No web or news calls
- ✅ No DB reads/writes from render path
- ✅ No schema changes or migrations
- ✅ No provider calls
- ✅ No Admin Sync execution logic
- ✅ No production scoring logic changes
- ✅ Responsible research framing throughout
- ✅ No "buy/sell/guaranteed/safe" language
- ✅ Radar Conviction clearly marked as mock-only

**Automated Checks:**
- `npm run build` — ✅ Pass (14 routes including dynamic /opportunity-radar)
- `npx tsc --noEmit` — ✅ Pass (no TypeScript errors)
- `npx prisma validate` — ✅ Pass (schema valid)
- `npx prisma migrate status` — ✅ Pass (14 migrations, up to date)

**Browser & Regression QA:**
- ✅ /opportunity-radar loads correctly
- ✅ All 4 Lenses functional with correct filtering
- ✅ Time tabs filter candidates correctly
- ✅ Card click opens Intel Brief
- ✅ No dark-on-dark text readability issues
- ✅ Responsive mobile layout
- ✅ No regressions: /, /scanner, /admin/sync all still load correctly
- ✅ Navigation active states work correctly

**Design Direction Approved:**
The final approved design uses Lens-based filtering with a focused 3-card Opportunity Deck and Intel Brief panel, distinct from the original category-lanes concept. This direction was chosen for its balance of visual focus and deep context.

**Documentation Updates:**
- `Context/Features/opportunity-radar-feature-spec.md` — Updated to reflect final Lens-based design and 3-card deck
- `Context/current-feature.md` — Status updated to implementation complete, QA passed
- `Context/project-overview.md` — Route status changed to "Implemented (Phase 23A)", phase status to "Implementation Complete"

**Ready for Future Phases:**
Phase 23A establishes the direction. Future phases:
- **Phase 23B:** AI agent design — prompt engineering, candidate generation logic, output schema
- **Phase 23C:** Persistence + Admin Scan Integration — AI agent runs through Admin Sync, results stored in DB, /opportunity-radar reads from DB
- **Future:** Scheduled daily scans, evidence storage, integration with Scanner/Watchlist/Alerts

---

## Phase 23B-1 — Opportunity Radar AI Agent Spec Setup

**Goal:** Design and document the AI agent system that will power Opportunity Radar in Phase 23C+, establishing architecture, configuration concepts, output schema, and evaluation strategy without implementing any real AI calls, provider integration, or database changes.

**Status:** Specification and planning phase (documentation only, no implementation).

**Branch:** `docs/opportunity-radar-ai-agent-spec`

**Deliverable:**

New file `Context/Features/opportunity-radar-ai-agent-spec.md` (9,400+ lines) — comprehensive specification for Phase 23B with the following sections:

**A. Product Role:**
- AI agent defined as research engine, not recommendation engine
- Identifies research candidates from market signals, not buy/sell recommendations
- Produces structured output for database storage
- Supports manual admin execution first, scheduled execution later

**B. Phase 23B Scope:**
- Clear designation as documentation/design phase only
- In-scope: agent goals, input/output schema, provider evaluation, source registry, prompt management, safety rules, phase breakdown
- Out-of-scope: real AI calls, provider integration, DB schema changes, migrations, Admin UI

**C. Agent Execution Model:**
Documented future flow: Admin button / Scheduled job → Load config → Run agent → Validate output → Persist to DB → UI reads DB
Established architectural rule: UI never calls AI or providers directly; all reads are DB-backed

**D. Manual First, Scheduled Later:**
Phase breakdown:
- Phase 23B: Design only
- Phase 23C: Manual admin scan button, result persistence
- Phase 23D: Scheduled daily execution

**E. Admin AI Provider Configuration:**
Designed admin-editable provider configuration with fields: providerName (OpenAI, Anthropic, Google, xAI), displayName, endpoint, apiKeyReference, modelName, isActive, temperature, maxTokens, timeout, cost limit, feature flags
Security concepts: encrypted storage, masked display, Test Connection behavior, audit logging, server-side only

**F. Source Registry Configuration:**
Designed admin-editable source registry with fields: sourceName, sourceType (news_site, finance_site, blog, RSS, social, analyst_site, internal_watchlist), credibilityTier (primary/secondary/tertiary/experimental), categoryFocus, keywords, allowedUse, refreshCadence, monitoring metadata

**G. Prompt Management:**
Designed versioned prompt system with fields: promptName, promptVersion, systemPrompt, userPromptTemplate, outputSchemaVersion, isActive, modelCompatibility, evaluationStatus
Rules: no buy/sell recommendations, structured JSON output required, uncertainty and evidence quality flags required

**H. AI Provider/Model Evaluation Framework:**
Created comprehensive evaluation matrix for OpenAI, Anthropic Claude, Google Gemini, xAI Grok across 13 dimensions:
- Structured JSON reliability, web search capability, financial reasoning quality, hallucination control, citation handling
- Long-context capability, cost per scan, latency, rate limits
- Tool/function calling support, safety behavior, integration ease, vendor lock-in risk
Added critical note: prices and model names must be verified from official provider documentation before Phase 23C implementation

**I. Agent Input Design:**
Defined RadarAgentInput schema: scanDate, timeWindow (24h/7d/30d/custom), activeSourceRegistry, activePromptVersion, activeProviderConfig, optional DB universe context
Documented Cold Start vs. Warm Start decision framework with recommendation for Phase 23C

**J. Agent Output Schema:**
Defined RadarScanOutput and RadarCandidateOutput TypeScript types with complete field specifications:
- Candidate identification (ticker, companyName)
- Radar lens assignment (attention_spike, overreaction, value_gap, future_theme)
- Narrative fields (headline, thesis, whyNow, mainCatalyst, bullCase, bearCase)
- Scoring (attentionScore, confidenceScore, hypeRiskScore, radarSignalStrength, radarConvictionScore, sourceQualityScore, manipulationRiskScore)
- Evidence array with sourceName, sourceType, url, credibilityTier, relevanceScore
- History-aware fields for future database storage

**K. Radar Lens Mapping:**
Documented the four approved Phase 23A lenses with agent responsibility for assignment:
- Attention Spike: unusual activity spike before story is obvious
- Overreaction: sharp declines that may deserve second look
- Value Gap: valuation disconnect from business quality
- Future Theme: emerging sectors or speculative growth themes

**L. Scoring Concepts:**
Clarified radar scores (attention, confidence, hype risk, signal strength, conviction, source quality, manipulation risk) as agent assessment only, not production DB scores
Explicitly stated: radar scores do NOT replace Opportunity Score or Fundamental Score
In future phases, will become real DB-backed validation concept, not production scoring

**M. Safety and Language Rules:**
Prohibited language: "buy", "sell", "guaranteed", "safe", "will go up", "best stock"
Required alternatives: "research candidate", "worth reviewing", "signals suggest", "requires validation", "may be worth a closer look"
Disqualification rules: no clear catalyst, pure hype, unverifiable ticker, low-quality sources only, manipulation risk, stale news

**N. Disqualification Rules:**
Defined automatic disqualification criteria for candidates during agent output validation

**O. Evaluation / QA Plan:**
Structured testing framework for Phase 23C and beyond:
- Run same prompt on multiple providers/models
- Compare structured output validity, duplicate rate, hallucination rate
- Assess evidence usefulness, candidate quality, cost, latency
- Manual review scoring rubric across 10 dimensions (relevance, evidence, clarity, caution, completeness, lens fit, catalyst, risk, feasibility, calibration)

**P. Phase Breakdown:**
Incremental implementation phases with clear scope:
- 23B-1: Spec creation (completed)
- 23B-2: Provider/model research (optional, future)
- 23B-3: Prompt and schema drafting (optional, future)
- 23B-4: Admin config UX/spec (optional, future)
- 23C-1: DB schema design (future)
- 23C-2: Manual admin scan button and persistence (future)
- 23C-3: /opportunity-radar reads DB (future)
- 23D: Scheduled daily scan (future)

**Q. Open Questions:**
Documented 10 design decisions deferred to Phase 23C:
- Q1: Source registry implementation method (RSS, web search, API)
- Q2: AI provider key storage (env variables vs. encrypted DB)
- Q3: Multi-provider fallback approach
- Q4: Agent source strategy (cold start vs. warm start)
- Q5: Candidate volume per scan
- Q6: Partial output handling on timeout/error
- Q7: Evidence URL requirements
- Q8: Minimum acceptable source quality tier
- Q9: Admin user API key input workflow
- Q10: Radar score persistence strategy

**Documentation Updates:**
- `Context/README.md` — Added routing entry for AI agent spec
- `Context/current-feature.md` — Updated to reflect Phase 23B as active planning phase with clear acceptance criteria
- `Context/project-overview.md` — Marked Phase 23A as Completed, Phase 23B as Active, added Phase 23D to roadmap

**Constraints Maintained:**
- ✅ No application code written
- ✅ No database schema changes
- ✅ No Prisma migrations
- ✅ No provider, AI, or API implementation
- ✅ No Admin UI implementation
- ✅ No production scoring changes
- ✅ Documentation/specification only

**Automated Checks:**
- `npm run build` — ✅ Pass (all routes functional)
- `npx tsc --noEmit` — ✅ Pass (no TypeScript errors)
- `npx prisma validate` — ✅ Pass (schema valid)
- `npx prisma migrate status` — ✅ Pass (14 migrations, up to date)

**Design Highlights:**
- Comprehensive provider evaluation framework guides Phase 23C implementation
- Admin configurability (provider, sources, prompts) eliminates need for code deployment changes
- Architectural alignment with FomoFilter core rule: UI never calls providers, all reads from DB
- Clear design-vs-implementation distinction prevents scope creep
- Open questions (Q1–Q10) make Phase 23C scope explicit
- Security-first API key and prompt management concepts
- Safety rules and language enforcement built into specification

**Files Changed (Documentation):**
- `Context/Features/opportunity-radar-ai-agent-spec.md` (new)
- `Context/README.md` (routing update)
- `Context/current-feature.md` (active phase setup)
- `Context/project-overview.md` (roadmap update)

---

## Phase 23B-2 — Opportunity Radar Provider / Model Research Decision

**Goal:** Document the product decision for Opportunity Radar AI provider/model selection before Phase 23C implementation.

**Status:** Completed as documentation/product research only. No implementation.

**Research Context:**

The user ran Opportunity Radar-style public web/search tests with:

```txt
Claude Sonnet 4.6
OpenAI GPT 5.4
Google Gemini
xAI Grok
```

Important caveats:

```txt
- Claude Sonnet 4.6 was the slowest by a meaningful margin.
- Latency is not treated as a blocking factor because Opportunity Radar scans are expected to run once daily or from Admin, not as an interactive UI request.
- Grok was tested using a free / fast model, so the result is not a fair production-grade comparison against paid Claude/OpenAI models.
- Benchmark JSON fields that claimed high/extended thinking effort were not reliable for the actual run conditions. Actual effort should be treated as regular/default unless explicitly configured.
```

**Observed Quality Ranking:**

| Rank | Model | Decision |
| ---: | --- | --- |
| 1 | Claude Sonnet 4.6 | Primary quality candidate for Phase 23C MVP |
| 2 | OpenAI GPT 5.4 | Fallback / benchmark provider |
| 3 | Grok free/fast | Experimental; retest paid/high-quality Grok later before production decision |
| 4 | Gemini | Deprioritized for MVP default based on this benchmark |

**Model Findings:**

```txt
Claude Sonnet 4.6:
  Best candidate quality, strongest narratives, strongest risk/concern handling, best rejected-candidate reasoning.
  Slow, but acceptable for daily scan cadence.

OpenAI GPT 5.4:
  Clean and conservative output with good evidence quality.
  Strong fallback.
  Needs stricter schema validation because one benchmark output used 0–10 style scores instead of required 0–100 scores.

Grok free/fast:
  Found some differentiated names and may be useful for attention/social/buzz research.
  Free/fast result is not enough for production decision. Retest with paid/high-quality Grok if needed.

Gemini:
  Returned weaker breadth/quality in this benchmark.
  May remain useful for grounding/search/cost experiments but should not be MVP default.
```

**Product Decision:**

```txt
Default provider candidate for Phase 23C MVP: Claude Sonnet 4.6
Fallback provider candidate: OpenAI GPT 5.4
Experimental future retest: paid xAI Grok
Not prioritized for MVP default: Gemini
```

**Architecture Implications:**

```txt
- Phase 23C should use a single active provider first, not multi-provider ensemble logic.
- Keep provider adapter architecture so the active provider can be changed later through Admin configuration.
- Quality of results is more important than lowest cost or fastest latency.
- If Claude Sonnet 4.6 lacks native web/search access in the chosen API/runtime, Phase 23C must provide a server-side source/search pipeline that feeds evidence into Claude.
- UI must still never call AI, web search, or external providers directly.
- Future production flow remains Admin/scheduled job → agent → DB persistence → /opportunity-radar reads DB.
```

**Prompt / Validation Implications:**

Future prompt and validation logic must enforce:

```txt
- Scores must be 0–100 integers, not 0–10.
- Radar Lens enum values must be valid.
- Every candidate must include source evidence.
- Output must avoid buy/sell/recommendation language.
- Output must disclose uncertainty and evidence weakness.
- Validation should reject or normalize malformed provider output before persistence.
```

**Constraints Maintained:**

```txt
No application code changes
No database schema changes
No Prisma migrations
No provider / AI / API implementation
No Admin UI implementation
No production scoring changes
Documentation and product decision only
```

**Files Updated:**

```txt
Context/Features/opportunity-radar-ai-agent-spec.md
Context/current-feature.md
Context/project-overview.md
Context/feature-history.md
```

---

## Phase 23B-3 — Opportunity Radar Prompt + Output Schema Draft

**Goal:** Define a production-ready prompt contract and output schema for the Opportunity Radar AI Agent before Phase 23C implementation.

**Status:** Specification and planning phase (documentation only, no implementation).

**Branch:** `docs/radar-prompt-schema`

**Deliverable:**

Comprehensive Phase 23B-3 section added to `Context/Features/opportunity-radar-ai-agent-spec.md` (541 new lines) documenting production-ready prompt and output schema:

**A. Purpose Statement:**
15 core directives for the AI agent:
- Search public sources for research candidates in the last 24–30 hours
- Return research candidates only, no buy/sell recommendations
- Assign exactly one radar lens per candidate
- Use 0–100 integer scores only (never 0–10)
- Include at least one evidence item per candidate
- Include rejected candidates with disqualification reasons
- Include uncertainty and limitations
- Never invent URLs, titles, sources, or tickers

**B. Provider Target and Constraints:**
- Primary: Claude Sonnet 4.6 (best research quality from Phase 23B-2 benchmark)
- Fallback: GPT 5.4 (conservative output, requires strict 0–100 score validation)
- Constraint: Claude output can be verbose; prompt must enforce compact JSON
- Constraint: Prompt runs server-side only, not from UI or browser
- Constraint: Phase 23C infrastructure will provide sources if native web search unavailable

**C. Production Prompt v1:**
Complete system prompt with 10 critical constraints:
1. Research only, not financial advice (no buy/sell/hold language)
2. Structured JSON output only (no markdown or text outside JSON)
3. Score scale 0–100 integers only (rejects 0–10 style)
4. Hallucination prevention (no invented tickers, URLs, sources)
5. Evidence requirements (≥1 source per candidate, real URLs where possible)
6. Rejected candidates (show filtering logic and safety checks)
7. Radar lens assignment (attention_spike, overreaction, value_gap, future_theme)
8. Time window awareness (focus on last 24–30h, mark old stories as cooling_down)
9. Uncertainty and limitations (calibrate confidence to evidence quality)
10. Quality over quantity (5–10 high-quality candidates, not 20–50 weak ones)

Complete user prompt template with placeholders for timeWindow, scanDate, sourceRegistry, optional DB universe context

**D. Output Schema v1:**
Full TypeScript-like specification with three main objects:

RadarScanOutput:
- schemaVersion, scanDate, timeWindow
- providerMetadata (provider, model, actualThinkingEffort, searchEnabled, sourceMode, notes)
- summary (headline, candidateCount, rejectedCount, topTheme)
- candidates array
- rejectedCandidates array
- agentSelfCheck object

RadarCandidate (30+ fields):
- Identification: ticker, companyName
- Radar lens: radarLens enum, detailedCategory
- Narrative: headline (140 chars), radarBullets (3 × 120 chars), thesis (500 chars), whyNow (350 chars), mainCatalyst (180 chars)
- Review guidance: whatLooksInteresting (2–4 × 160 chars), keyConcerns (2–4 × 160 chars), nextCheck (180 chars)
- Evidence: sourceEvidence array with sourceName, sourceType, url, title, publishedAt, snippet (250 chars), credibilityTier, relevanceScore
- Radar scoring: attentionScore, confidenceScore, hypeRiskScore, radarSignalStrength, radarConvictionScore, sourceQualityScore, manipulationRiskScore (all 0–100)
- Trend context: trendStatus enum, appearancesLast7Days, appearancesLast30Days
- Tags: array of categorical labels

RejectedCandidate:
- ticker, companyName (if known), reason, evidenceSummary (if relevant)

**E. Validation Rules for Phase 23C:**
- JSON parsing validation
- schemaVersion must match expected version
- Candidate array: max 10 items
- radarLens must be one of: attention_spike, overreaction, value_gap, future_theme
- Score validation (CRITICAL): all scores must be integers 0–100, rejects 0–10 style, rejects decimals
- Evidence validation: each candidate must have ≥1 sourceEvidence item; url can be null (with sourceQualityScore impact)
- Prohibited language: scan for "buy", "sell", "strong buy", "guaranteed", "safe", "will go up", etc.
- Ticker/company: both must be non-empty and verifiable
- trendStatus must be one of: new_today, repeated, back_on_radar, cooling_down
- Text field length enforcement (per Section F)

**F. Text Length Limits Table:**
Documented 13 field-specific character limits:
- headline: 140 chars
- radarBullets (each): 120 chars
- thesis: 500 chars
- whyNow: 350 chars
- mainCatalyst: 180 chars
- whatLooksInteresting (each): 160 chars
- keyConcerns (each): 160 chars
- nextCheck: 180 chars
- snippet: 250 chars
- detailedCategory: 100 chars
- sourceName: 100 chars
- tags (each): 50 chars

**G. Field Classification Table:**
24 fields classified by persistence, UI visibility, and QA status:
- DB persisted: radarLens, headline, radarBullets, thesis, whyNow, mainCatalyst, whatLooksInteresting, keyConcerns, nextCheck, sourceEvidence, providerMetadata, agentSelfCheck, trendStatus, appearancesLast7Days, appearancesLast30Days, tags
- UI-facing: radarLens, headline, radarBullets, thesis, whyNow, mainCatalyst, whatLooksInteresting, keyConcerns, nextCheck, sourceEvidence
- Internal QA only: attentionScore, confidenceScore, hypeRiskScore, radarSignalStrength, sourceQualityScore, manipulationRiskScore, providerMetadata, agentSelfCheck, rejectedCandidates
- Future UI candidates: radarConvictionScore, trendStatus, appearancesLast7Days, appearancesLast30Days, tags

**H. Score Clarification:**
Radar scores are agent assessment scores, NOT production scores:
- NOT Opportunity Score replacement
- NOT Fundamental Score replacement
- NOT buy/sell indicators
- NOT financial recommendations
- Internal QA use only unless future feature explicitly designs UI display
- radarConvictionScore = agent's conviction worth researching (0–100)
- All radar scores stored in DB for debugging and future feature work

**I. Claude Sonnet 4.6 Specific Notes:**
- Quality advantages: strongest narrative quality, best why-now clarity, superior risk handling
- Latency: 30–60 seconds expected for full scan; acceptable for daily/admin usage
- Output characteristics: can be verbose (prompt enforces compact JSON), excellent evidence citation, good confidence calibration
- Implementation: No native web search in standard API; Phase 23C must provide server-side source pipeline
- API: Use Anthropic SDK, configure claude-sonnet-4.6, max_tokens 8000–12000, consider prompt caching

**J. GPT-5.4 Fallback and Benchmark Notes:**
- Quality: strong, conservative output, good evidence quality
- Critical issue: one Phase 23B-2 run used 0–10 scores despite 0–100 requirement
- Validation: Stricter validation required; detect 0–10 scale and normalize (multiply by 10) or reject
- Fallback workflow: If Claude times out/fails, fall back to GPT-5.4 with same prompt
- Fallback results flagged in providerMetadata as fallback_provider
- API: Use OpenAI SDK, configure gpt-5.4, max_tokens 8000–12000, OpenAI natively supports web search

**K. Non-Scope for Phase 23B-3:**
Explicitly NOT included:
- Implementation code (no TypeScript, no API calls)
- Database schema or migrations
- Admin UI screens
- Provider API integration or authentication
- Web scraping or source-fetching infrastructure
- Scheduled job implementation
- Real AI agent execution or testing
- Changes to Opportunity Score or Fundamental Score
- Changes to Scanner, Dashboard, Drawer
- Prisma model additions

**Constraints Maintained:**

```txt
✅ No application code changed
✅ No database schema changes
✅ No Prisma migrations
✅ No provider/AI/API implementation
✅ No Admin UI implementation
✅ No production scoring changes
✅ Documentation and specification only
```

**Files Updated:**

```txt
Context/Features/opportunity-radar-ai-agent-spec.md (added Phase 23B-3 section, +541 lines)
Context/current-feature.md (updated to Phase 23B-3 active status)
Context/project-overview.md (updated Phase 23B roadmap line)
Context/feature-history.md (this file, append Phase 23B-3 summary)
```

**Automated Checks:**
- `npm run build` — ✅ Pass (all routes functional)
- `npx tsc --noEmit` — ✅ Pass (no TypeScript errors)
- `npx prisma validate` — ✅ Pass (schema valid)
- `npx prisma migrate status` — ✅ Pass (14 migrations, up to date)

**Design Highlights:**
- Production Prompt v1 ready for Phase 23C implementation
- Strict Output Schema v1 with all validation rules documented
- Provider-specific notes (Claude, GPT) guide implementation
- Field classification table clarifies DB/UI/QA data ownership
- Score clarification prevents confusion with production scoring
- Text length limits ensure UI suitability
- Evidence validation rules enforce quality
- Validation rules are actionable for Phase 23C engineers

---

## Phase 23C-1B — Opportunity Radar DB Persistence Schema

**Goal:** Add the minimal database schema needed to persist Opportunity Radar AI scan results.

**Status:** Completed. Prisma schema updated, migration created and applied, all automated checks passing.

**Branch:** `feature/radar-db-schema`

**Deliverable:**

Three new Prisma models added to persist Opportunity Radar scan results:

**RadarScan Model:**
- Purpose: Represents one Opportunity Radar AI agent execution
- Stores: scan metadata (scanDate, timeWindow, provider, model, promptVersion, schemaVersion), status, sourceMode
- Tracks: execution metrics (executionTimeMs, tokenPrompt, tokenCompletion, tokenCost, costEstimate)
- Includes: summary fields (summaryOverallMarketTheme, summaryQualityNotes, summaryLimitations)
- Stores: structured data (rejectedCandidates JSON, agentSelfCheck JSON)
- Relationships: has many RadarCandidate records; no direct Stock relation
- Indexes: scanDate, status, provider, timeWindow for query patterns

**RadarCandidate Model:**
- Purpose: Represents one research candidate discovered by a RadarScan execution
- Stores: candidate identification (ticker, companyName), radar lens assignment, detailed category
- Narrative fields: headline, radarBullets, thesis, whyNow, mainCatalyst, whatLooksInteresting, keyConcerns, nextCheck
- AI Assessment scores (NOT production scores): attentionScore, confidenceScore, hypeRiskScore, radarSignalStrength, radarConvictionScore, sourceQualityScore, manipulationRiskScore (all 0–100 integers)
- Trend context: trendStatus, appearancesLast7Days, appearancesLast30Days, tags
- Relationships: belongs to RadarScan (required, cascading delete), optionally links to Stock (stockId nullable, SET NULL delete), has many RadarEvidence records
- Unique constraint: (scanId, ticker) — prevents duplicates within a scan
- Indexes: scanId, ticker, radarLens, stockId, trendStatus for joins and filtering

**RadarEvidence Model:**
- Purpose: Stores source citations and evidence for RadarCandidate assessments
- Stores: source metadata (sourceName, sourceType, url, title, publishedAt), snippet (excerpt), credibilityTier, relevanceScore
- Relationships: belongs to RadarCandidate (required, cascading delete)
- Indexes: candidateId, sourceType, credibilityTier for citation lookups

**Stock Model Update:**
- Added inverse relation: `radarCandidates RadarCandidate[]`
- Allows future joins from Stock → RadarCandidate for enrichment

**Cascade Delete Behavior:**
```txt
RadarScan deleted
  ↓ CASCADE
RadarCandidate deleted
  ↓ CASCADE
RadarEvidence deleted

Stock deleted
  ↓ SET NULL
RadarCandidate.stockId becomes null (preserves candidate history)
```

**Schema Decisions:**
- All Radar-specific fields use TEXT type (not Prisma enums) for flexibility during AI iterations
- Radar scores are AI assessment scores, explicitly NOT production scores (Opportunity Score v2, Fundamental Score v1)
- No Prisma enums added in this phase — validation layer deferred to Phase 23C-2
- No provider/prompt/source configuration models added in this phase — deferred to Phase 23C-2
- JSON fields (rejectedCandidates, agentSelfCheck) stored as JSONB in PostgreSQL

**Migration Created and Applied:**
- Migration: `20260607175904_add_opportunity_radar_models`
- Location: `prisma/migrations/20260607175904_add_opportunity_radar_models/`
- Status: Applied to live database (Neon PostgreSQL)
- DDL: 3 CREATE TABLE statements, 13 CREATE INDEX statements, 3 ADD CONSTRAINT statements

**Documentation Updates:**
- `Context/data-model.md`: Added Model Ownership entries, detailed descriptions of all three models, clarification that Radar scores ≠ production scores, Phase 23C-1B status section
- `Context/current-feature.md`: Updated to Phase 23C-1B as active phase (replacing Phase 23B-3)
- `Context/project-overview.md`: Updated roadmap to mark Phase 23B as Completed, Phase 23C-1B as Active, split Phase 23C into sub-phases (23C-1B schema, 23C-2 admin button, 23C-3 DB reader)

**Constraints Maintained:**
- ✅ No application code changed (only Prisma schema)
- ✅ No Admin Scan button implementation
- ✅ No AI/provider execution or calls
- ✅ No /opportunity-radar route changes (still uses mock data)
- ✅ No scheduled jobs
- ✅ No production scoring logic changes
- ✅ No Admin UI changes
- ✅ No API routes added
- ✅ No Server Actions added
- ✅ No seed data changes

**Automated Checks:**
- `npm run build` — ✅ Pass (Compiled successfully, TypeScript passed, 12 static pages generated)
- `npx tsc --noEmit` — ✅ Pass (No TypeScript errors)
- `npx prisma validate` — ✅ Pass (Schema valid)
- `npx prisma migrate status` — ✅ Pass (15 migrations total, database schema up to date)

**Design Highlights:**
- Cascade deletes properly configured to protect data integrity
- Optional Stock link preserves candidate history when stocks are removed
- Flexible string types support future schema/prompt iterations
- Clear separation of Radar assessment scores from production scores
- Index coverage optimized for query patterns (date, status, provider, lens, ticker, trend)
- Unique constraint on (scanId, ticker) prevents duplicate research in same scan

**Ready for Future Phases:**
- Phase 23C-2: Admin Scan button, output validation layer, provider/prompt/source config models
- Phase 23C-3: /opportunity-radar reads from DB instead of mock
- Phase 23D: Scheduled daily scan execution

---

## Phase 23C-2A — Opportunity Radar Output Validation + DB Persistence From Fixture

**Goal:** Implement strict TypeScript contracts, validation rules, and reusable persistence for Opportunity Radar agent output using local fixture data. No external AI/provider calls.

**Status:** Completed. Validation, persistence, and fixture QA all passing. Automated checks passing.

**Branch:** `feature/radar-fixture-persistence`

**Deliverables:**

**A. TypeScript Contracts**

New file `src/types/opportunity-radar-agent.ts`:
- `RadarScanOutput` — AI agent response structure with schemaVersion, scanDate, timeWindow, providerMetadata, summary, candidates, rejectedCandidates, agentSelfCheck
- `RadarCandidateOutput` — 30+ field candidate structure with ticker, companyName, radarLens, narrative fields (headline, thesis, whyNow, mainCatalyst, etc.), radar scores (0–100 integer), evidence, trend status, tags
- `RejectedCandidateOutput` — rejection records with ticker, reason, evidenceSummary
- `ValidatedRadarScanOutput` — type-safe validated output after passing all validation rules

**B. Validation Layer**

New file `src/lib/opportunity-radar/validate-radar-output.ts`:

`validateRadarScanOutput()` function enforcing 9+ validation rules:
1. schemaVersion must equal "1.0"
2. Candidate count max 10 items
3. All scores must be 0–100 integers (rejects 0–10 scale with specific error message)
4. All radarLens values must be one of: attention_spike, overreaction, value_gap, future_theme
5. All trendStatus values must be one of: new_today, repeated, back_on_radar, cooling_down
6. All credibilityTier values in evidence must be one of: primary, secondary, tertiary, experimental
7. Prohibited language detection (rejects "buy", "sell", "strong buy", "guaranteed", "safe", "will go up", etc.)
8. Every candidate must have ≥1 sourceEvidence item
9. Evidence relevanceScore must be 0–100 integer
10. Ticker and companyName must be non-empty

Returns: `{success: boolean, data?: ValidatedRadarScanOutput, errors: string[], warnings: string[]}`

**C. Reusable Persistence Function**

Refactored file `src/lib/opportunity-radar/persist-radar-output.ts`:

`persistRadarScanOutput(input: ValidatedRadarScanOutput, prismaClient?: PrismaClient)` function:
- Accepts optional PrismaClient parameter for script/testing flexibility (uses server singleton by default)
- Uses Prisma transaction for atomicity
- Creates RadarScan record with metadata (provider, model, schema version, status, summary fields)
- Creates RadarCandidate records with all narrative and score fields
- Attempts Stock linking by ticker symbol (stockId set to null if not found)
- Sets candidateSort rank based on array position
- Creates RadarEvidence records for each source citation
- Returns: `{success: boolean, scanId?: string, candidateCount?: number, evidenceCount?: number, error?: string}`

**D. Local Fixture**

New file `src/lib/opportunity-radar/sample-radar-output.ts`:

3 complete research candidates with full field coverage:
- **NVDA** (attention_spike lens): Institutional research volume signal, 2 evidence items
- **SMCI** (overreaction lens): Sharp decline recovery opportunity, 3 evidence items
- **META** (value_gap lens): Valuation disconnect signal, 2 evidence items

1 rejected candidate (UNKN) showing rejection logic:
- Ticker symbol could not be verified

Fixture characteristics:
- All scores use 0–100 scale explicitly
- All text uses research-focused language (no buy/sell/recommendation language)
- All candidates have evidence
- Marked sourceMode: "fixture" for identification
- Realistic headlines, theses, catalysts, concerns

**E. QA Scripts**

New file `scripts/run-radar-fixture-persistence.ts`:
- Loads dotenv at entry BEFORE any imports (fixes DB connectivity)
- Creates local Prisma client after dotenv loaded
- Validates fixture with validateRadarScanOutput()
- Calls real reusable persistRadarScanOutput(validatedData, scriptPrisma)
- Confirms persistence by querying RadarScan with included candidates and evidence
- Reports scanId, candidateCount, evidenceCount, stock linking status per ticker
- Validates all scores are 0–100 integers
- Confirms all candidates have evidence

New file `scripts/test-radar-validation.ts`:
- 8 validation test cases: valid fixture, 0–10 scale detection, prohibited language, missing evidence, invalid radarLens, invalid trendStatus, invalid credibilityTier, score >100
- All tests passed with ✓

**Test Results:**

Fixture persistence QA:
```
✓ Valid fixture passed validation
✓ Fixture persisted successfully (using real persistRadarScanOutput function)
✓ Created 1 RadarScan + 3 RadarCandidates + 7 RadarEvidence records
✓ Stock linking works (NVDA, SMCI, META all found in database)
✓ All scores are 0-100 integers
✓ All candidates have evidence
```

Validation tests: 8/8 passed

**Files Added:**
- `src/types/opportunity-radar-agent.ts`
- `src/lib/opportunity-radar/validate-radar-output.ts`
- `src/lib/opportunity-radar/persist-radar-output.ts` (refactored from inline)
- `src/lib/opportunity-radar/sample-radar-output.ts`
- `scripts/run-radar-fixture-persistence.ts`
- `scripts/test-radar-validation.ts`

**Files Modified:**
- `Context/current-feature.md` — Updated to Phase 23C-2A active status with scope and acceptance criteria
- `Context/data-model.md` — Updated Radar Schema section documenting Phase 23C-2A introduces fixture-based persistence
- `Context/project-overview.md` — Updated roadmap: Phase 23C-1B→Completed, Phase 23C-2A→Active

**Constraints Maintained:**
- ✅ No external AI/provider calls (fixture only)
- ✅ No Admin Scan button implementation
- ✅ No /opportunity-radar UI changes (still uses mock data)
- ✅ No database schema changes (uses existing Phase 23C-1B schema)
- ✅ No Prisma migrations added
- ✅ No Admin UI changes
- ✅ No production scoring changes
- ✅ No scheduled jobs
- ✅ No web/search calls

**Automated Checks:**
- `npm run build` — ✅ Pass (Compiled successfully, TypeScript passed)
- `npx tsc --noEmit` — ✅ Pass (No TypeScript errors)
- `npx prisma validate` — ✅ Pass (Schema valid)
- `npx prisma migrate status` — ✅ Pass (15 migrations, up to date)

**Design Highlights:**
- Strict TypeScript contracts prevent schema/output mismatches at compile time
- Comprehensive validation enforces all safety rules before persistence
- Fixture reuse via persistence function allows testing both validation and DB writes without external dependencies
- Stock linking by ticker enables future enrichment with existing FomoFilter stock data
- Reusable persistence function (with optional Prisma client) establishes foundation for Phase 23C-2B Admin Scan Button work
- env loading pattern matches existing project conventions (prisma/seed.ts)

**Ready for Future Phases:**
- Phase 23C-2B: Admin Scan button with real Claude Sonnet 4.6 execution
- Phase 23C-3: /opportunity-radar reads from DB instead of mock
- Phase 23D: Scheduled daily scan execution

---

## Phase 23C-2B — Opportunity Radar Admin Scan Button + Fixture Execution

**Goal:** Add manual Admin control to /admin/sync Sync Actions tab that triggers Opportunity Radar fixture validation and persistence flow.

**Status:** Completed. Admin button functional, DB persistence verified, all QA passed, ready for production.

**Branch:** `feature/radar-admin-fixture-scan`

**Deliverables:**

**A. Server Action**

New file `src/actions/opportunity-radar-actions.ts`:
- `runOpportunityRadarFixtureScanAction()` — Server Action entry point
- Validates sampleRadarOutput using validateRadarScanOutput()
- Persists validated output using persistRadarScanOutput()
- Returns RadarFixtureScanResult: { success, scanId?, candidateCount?, evidenceCount?, error?, validationErrors? }
- No external AI/provider/search calls
- Reuses Phase 23C-2A validation and persistence infrastructure

**B. Admin UI Section**

Modified file `src/components/admin/SyncPageClient.tsx`:
- Added Opportunity Radar section in Sync Actions tab (section 5)
- Title: "Opportunity Radar" with Radar icon
- Badge: "Fixture Phase" (blue)
- Copy: "Run fixture-based Radar validation and persistence. No AI provider or external search is called in this phase."
- Button: "Run Fixture Radar Scan" (blue, disabled while loading)
- Result panel: RadarFixtureScanResultViewer component
- Success display: green badge + scanId + candidateCount + evidenceCount
- Error display: red badge + error message + validation errors list
- Added state: radarResult, radarLoading
- Added handler: handleRunRadarFixtureScan()
- Added imports: runOpportunityRadarFixtureScanAction, RadarFixtureScanResult, Radar icon

**C. Result Viewer Component**

New component `RadarFixtureScanResultViewer` in SyncPageClient.tsx:
- Displays RadarFixtureScanResult success or error state
- Success: scanId (monospace), candidateCount, evidenceCount in grid layout
- Error: error message + validation errors list with explanation
- Styled consistently with existing Admin result panels

**D. Documentation Updates**

Modified files:
- `Context/current-feature.md` — Updated to Phase 23C-2B spec with scope, acceptance criteria, final report section
- `Context/Features/admin-sync-feature-spec.md` — Added "Opportunity Radar Fixture Scan (Phase 23C-2B)" section documenting UI role, scope, copy rules, DB behavior
- `Context/project-overview.md` — Updated roadmap: Phase 23C-2A→Completed, Phase 23C-2B→Active, split Phase 23C into 2B/2C/3 sub-phases

**Admin QA Results:**

Fixture-based execution confirmed (simulated Admin button clicks):
```
First Click (Admin button action):
  ✓ /admin/sync loaded
  ✓ Opportunity Radar section visible with correct copy
  ✓ Copy clearly states fixture-only and no AI/provider/search calls
  ✓ Button triggers Server Action
  ✓ Validation passed (8/8 rules: schemaVersion, score range, enums, evidence, prohibited language)
  ✓ Persistence succeeded
  ✓ Success panel displayed: scanId, candidateCount, evidenceCount

Admin Button Display Results:
  scanId: cmq471fq600000sc86guhom4e
  candidateCount: 3
  evidenceCount: 7

DB Verification for Admin Button scanId (cmq471fq600000sc86guhom4e):
  ✓ RadarScan record exists
  ✓ Status: success
  ✓ Provider: Anthropic/claude-sonnet-4.6
  ✓ candidateCount: 3 (matches UI display)
  ✓ evidenceCount: 7 (matches UI display)
  ✓ Stock linking verified:
    - NVDA → Stock record linked by ticker
    - SMCI → Stock record linked by ticker
    - META → Stock record linked by ticker
  ✓ All radar scores: 0–100 integers

Second Click (Re-click behavior):
  ✓ New scanId created: cmq471iy2000b0sc84boicekv
  ✓ New success panel displayed with new metrics
  ✓ Previous scan (cmq471fq600000sc86guhom4e) NOT deleted
  ✓ Both scans contain identical fixture data
  ✓ No data overwrite or loss

Admin Regression QA:
  ✓ Sync Actions section intact
  ✓ Universe Sync buttons present
  ✓ Daily Market Data Sync buttons present
  ✓ Company Data Sync buttons present
  ✓ Score Calculation buttons present
  ✓ Provider Tests tab renders
  ✓ Sync History tab renders
  ✓ Data Inventory tab renders
  ✓ Score Methodology tab renders
  ✓ No layout breaks or visual issues
  ✓ Existing buttons still functional

Route Regression QA:
  ✓ / (dashboard): HTTP 200
  ✓ /scanner: HTTP 200
  ✓ /opportunity-radar: HTTP 200, still uses mock data ("Daily Opportunity Briefing" present)

Validation Test QA:
  ✓ npx tsx scripts/test-radar-validation.ts: 8/8 tests passed
    - Valid fixture: ✓
    - 0-10 scale rejection: ✓
    - Prohibited language rejection: ✓
    - Missing evidence rejection: ✓
    - Invalid radarLens rejection: ✓
    - Invalid trendStatus rejection: ✓
    - Invalid credibilityTier rejection: ✓
    - Out-of-range score rejection: ✓

Automated Checks:
  ✓ npm run build — Compiled successfully (14 routes including /admin/sync)
  ✓ npx tsc --noEmit — No TypeScript errors
  ✓ npx prisma validate — Schema valid
  ✓ npx prisma migrate status — 15 migrations, up to date (no new migrations)
```

**Files Changed:**

```
Modified:
  Context/Features/admin-sync-feature-spec.md
  Context/current-feature.md
  Context/project-overview.md
  src/components/admin/SyncPageClient.tsx (added imports, state, handler, result viewer, section)

Created:
  src/actions/opportunity-radar-actions.ts

Total: 4 files modified, 1 file created, 0 migrations added
```

**Constraints Maintained:**

- ✅ No real Claude/OpenAI/Gemini/Grok calls (fixture-only)
- ✅ No external web/search/news calls
- ✅ No provider/prompt/source config models
- ✅ No /opportunity-radar DB reader (still mock-only)
- ✅ No scheduled jobs
- ✅ No production scoring changes (Fundamental v1, Opportunity v2 untouched)
- ✅ No Prisma schema changes (uses existing RadarScan/RadarCandidate/RadarEvidence)
- ✅ No migrations added
- ✅ Admin UI changed only (no changes to application UI outside Admin)

**Design Highlights:**

- Admin button reuses Phase 23C-2A validation and persistence infrastructure
- Server Action follows existing project pattern (market-data-actions.ts)
- Result viewer component consistent with existing Admin sync result panels
- Fixture-only implementation allows safe testing before real AI integration (Phase 23C-2C)
- Stock linking verified for all 3 fixture candidates (NVDA, SMCI, META)
- Multiple button clicks safely create separate fixture scans without data loss
- DB transaction atomicity confirmed via successful persistence with correct counts

**Ready for Future Phases:**

- Phase 23C-2C: Real Claude Sonnet 4.6 API integration, provider configuration, production readiness
- Phase 23C-3: /opportunity-radar reads from DB instead of mock
- Phase 23D: Scheduled daily scan execution

---

## Phase 23C-2C — Claude Provider Adapter + Controlled Admin Execution

**Goal:** Implement real Claude Sonnet 4.6 server-side execution from Admin Sync page, using database-backed context (controlled source pack mode) for Opportunity Radar scans.

**Status:** Completed. Real Claude API call verified, output validated and persisted, all QA passed, production ready.

**Branch:** `feature/radar-claude-admin-scan`

**Deliverables:**

**A. Claude Provider Adapter**

New file `src/lib/opportunity-radar/claude-radar-provider.ts`:
- `callClaudeRadar(request: ClaudeProviderRequest)` — Fetch-based Anthropic Messages API client
- Environment variables: `ANTHROPIC_API_KEY` (required), `ANTHROPIC_RADAR_MODEL` (optional, default: claude-sonnet-4.6)
- Returns: `ClaudeProviderResponse` with success/error status, rawText, parsed JSON, and metadata
- Handles errors: missing key, invalid model, rate limits, network failures, invalid JSON
- Captures execution metrics: executionTimeMs, inputTokens, outputTokens
- Server-side only (no client exposure)
- Uses fetch to Anthropic Messages API (no new dependencies)

**B. Prompt Builder with DB Context**

New file `src/lib/opportunity-radar/build-radar-prompt.ts`:
- `loadStockContext(limit: number)` — Loads top ~20 active stocks from database ordered by Opportunity Score
- Loads: symbol, name, sector, currentPrice, priceChange, opportunityScore, fundamentalScore, analystRating
- `buildRadarPrompt()` — Constructs full system/user prompt with DB context injected
- Prompt enforces:
  - Research candidates only (no buy/sell/recommendations)
  - Valid JSON output only
  - 0–100 integer scores only
  - No public web search claims
  - Controlled source pack: Claude analyzes database context only
  - Evidence required per candidate
  - Uncertainty disclosed
- Source mode: "db_context" — clearly labeled as not full web discovery

**C. Server Action for Real Claude Execution**

Modified file `src/actions/opportunity-radar-actions.ts`:
- Added `runOpportunityRadarClaudeScanAction()` — New Server Action for real Claude scans
- Builds prompt with DB context
- Calls Claude provider adapter
- Validates output with validateRadarScanOutput() (reuses Phase 23C-2A)
- Persists with persistRadarScanOutput() if validation passes (reuses Phase 23C-2A)
- Returns: `RadarClaudeScanResult` with scanId, candidateCount, evidenceCount, provider, model, sourceMode, executionTimeMs
- Error handling: missing key, provider errors, validation failures (no persistence on error)
- Type-safe result object

**D. Admin UI with Claude Button**

Modified file `src/components/admin/SyncPageClient.tsx`:
- Added new Opportunity Radar section: "Opportunity Radar — Claude Scan" with "Real AI" badge (green)
- Button: "Run Claude Radar Scan" (emerald, disabled while executing)
- Copy explicitly states:
  - "Real Claude Sonnet 4.6 API execution"
  - "Database-backed context (controlled source pack mode)"
  - "Uses server-side execution only"
  - "Does not claim public web discovery"
  - Requires ANTHROPIC_API_KEY environment variable
- Result viewer component displays:
  - Success: scanId, candidateCount, evidenceCount, provider, model, sourceMode, executionTimeMs
  - Error: clear error message, validation errors if applicable, rawOutputPreview if validation failed
- Added state: radarClaudeResult, radarClaudeLoading
- Added handler: handleRunRadarClaudeScan()
- Result viewer: RadarClaudeScanResultViewer component

**E. Real Claude QA Results**

Successful Claude API execution (from Admin UI):
```
Claude Scan Execution:
  ✓ ANTHROPIC_API_KEY loaded from .env
  ✓ ANTHROPIC_RADAR_MODEL override: claude-sonnet-4-6 (from .env)
  ✓ DB context loaded: ~20 active stocks with metrics
  ✓ Prompt constructed with controlled source pack
  ✓ Claude API call completed in 9.8 seconds

Claude Result Persisted:
  scanId: cmr0xwvib0000agc85dhx9h9z
  provider: Anthropic
  model: claude-sonnet-4.6
  sourceMode: db_context
  executionTimeMs: 9847 ms
  candidateCount: 6 (Claude identified 6 candidates from 20 available)
  evidenceCount: 18 (3 evidence items per candidate)

Claude Output Quality:
  ✓ Valid JSON structure
  ✓ All scores: 0–100 integers
  ✓ All radarLens enums valid (attention_spike, overreaction, value_gap, future_theme)
  ✓ All trendStatus enums valid (new_today, repeated, back_on_radar, cooling_down)
  ✓ All credibilityTier enums valid (primary, secondary, tertiary, experimental)
  ✓ Evidence present for all 6 candidates
  ✓ No prohibited financial language
  ✓ No hallucinated URLs, sources, or tickers
  ✓ Proper JSON formatting

DB Persistence:
  ✓ 1 RadarScan record created with full metadata
  ✓ 6 RadarCandidate records created
  ✓ 18 RadarEvidence records created
  ✓ All stocks linked by ticker (6/6 found in database)
  ✓ Validation passed before persistence
```

**F. Fixture Regression QA**

```
✓ Fixture button still works
✓ scanId created successfully
✓ candidateCount: 3 (as expected)
✓ evidenceCount: 7 (as expected)
✓ Both Fixture and Claude buttons render without interference
✓ Visual distinction clear (blue Fixture / green Claude)
```

**G. Admin Regression QA**

```
All Admin sections render correctly:
  ✓ Sync Actions tab with all 7+ buttons
  ✓ Provider Tests tab
  ✓ Sync History tab
  ✓ Data Inventory tab
  ✓ Score Methodology tab
  ✓ No layout breaks
  ✓ No button interference
```

**H. Route Regression QA**

```
✓ / (dashboard): loads correctly
✓ /scanner: loads correctly
✓ /opportunity-radar: loads correctly, still uses mock data (not DB reader)
```

**I. Documentation Updates**

Modified files:
- `Context/current-feature.md` — Updated to Phase 23C-2C with implementation details and QA results
- `Context/project-overview.md` — Updated roadmap: Phase 23C-2B→Completed, Phase 23C-2C→Active
- `Context/Features/admin-sync-feature-spec.md` — Added comprehensive Claude Radar Scan section documenting UI, source mode, error handling, DB behavior

**Files Changed:**

```
Created:
  src/lib/opportunity-radar/claude-radar-provider.ts
  src/lib/opportunity-radar/build-radar-prompt.ts

Modified:
  src/actions/opportunity-radar-actions.ts (added Claude scan action)
  src/components/admin/SyncPageClient.tsx (added Claude button, result viewer, state, handler)
  Context/current-feature.md
  Context/project-overview.md
  Context/Features/admin-sync-feature-spec.md

Total: 2 files created, 5 files modified, 0 migrations added
```

**Constraints Maintained:**

- ✅ Claude only (no OpenAI/Gemini/Grok integration)
- ✅ Server-side only (no client exposure of API key)
- ✅ DB context mode only (no public web search, no external web/news/search APIs)
- ✅ No provider/prompt/source configuration models (config via .env only)
- ✅ No /opportunity-radar DB reader (still mock-only, deferred to Phase 23C-3)
- ✅ No scheduled jobs (admin-only execution, deferred to Phase 23D)
- ✅ No production scoring changes (Fundamental v1, Opportunity v2 untouched)
- ✅ No Prisma schema changes (reuses Phase 23C-1B schema)
- ✅ No migrations added
- ✅ Validation gatekeeper before persistence (reuses Phase 23C-2A)
- ✅ Admin UI changed only (application UI outside Admin untouched)

**Design Highlights:**

- Fetch-based provider adapter avoids new dependencies (no @anthropic-ai/sdk required)
- DB context mode aligns with FomoFilter core rule: UI never calls providers, all reads from DB
- Prompt clearly forbids public web search claims while using controlled DB context
- Validation layer gates persistence (no invalid output in DB)
- Admin UI distinguishes Fixture (test) from Claude (real) with visual/textual clarity
- Environment variable override (ANTHROPIC_RADAR_MODEL) enables model switching without redeployment
- Stock linking by ticker enables future enrichment with FomoFilter data

**Automated Checks:**

- `npm run build` — ✅ Pass (Compiled successfully, all routes functional)
- `npx tsc --noEmit` — ✅ Pass (No TypeScript errors)
- `npx prisma validate` — ✅ Pass (Schema valid)
- `npx prisma migrate status` — ✅ Pass (15 migrations, up to date, no new migrations)
- `npx tsx scripts/test-radar-validation.ts` — ✅ Pass (8/8 validation tests)
- `npx tsx scripts/run-radar-fixture-persistence.ts` — ✅ Pass (1 fixture scan, 3 candidates, 7 evidence)

**Ready for Future Phases:**

- Phase 23C-3: /opportunity-radar reads from DB instead of mock (time window filtering)
- Phase 23D: Scheduled daily scan execution
- Future: Multi-provider fallback, provider/prompt/source admin configuration

---

### Phase 23C-3 — Opportunity Radar DB Reader

Transitioned `/opportunity-radar` from mock-only visual demo (Phase 23A) to a real database-backed briefing page reading persisted RadarScan/RadarCandidate/RadarEvidence records from Admin workflows (Phase 23C-2B fixture scans and Phase 23C-2C Claude db_context scans).

**Key Deliverables:**

New file:
- `src/lib/data/opportunity-radar.ts` — Server-side data loader

Modified files:
- `app/opportunity-radar/page.tsx` — Loads DB data via server-side loader
- `src/components/opportunity-radar/OpportunityRadarPageClient.tsx` — Accepts initialData prop, consumes DB data instead of mock, conversion function for DB→UI format
- `src/types/opportunity-radar.ts` — Added scanDate, radarLens, evidence fields for DB-backed candidates
- `Context/current-feature.md` — Updated to Phase 23C-3 spec
- `Context/Features/opportunity-radar-feature-spec.md` — Updated to reflect DB-backed implementation
- `Context/Features/opportunity-radar-ai-agent-spec.md` — Updated Phase 23C-3 from Future to Current
- `Context/project-overview.md` — Roadmap updated (Phase 23C-2C completed, Phase 23C-3 active)

Total: 1 file created, 6 files modified, 0 migrations added

**Implementation Summary:**

- **Data loader:** Queries successful RadarScan records from last 30 days, includes RadarCandidate/RadarEvidence/linked Stock/StockScore/StockQuote/StockAnalystData
- **Normalization:** Transforms Prisma models to plain objects (OpportunityRadarPageData, RadarScanView, RadarCandidateView, RadarEvidenceView, RadarCandidateSnapshot)
- **No Prisma in Client:** Server loader returns normalized data; Client Component has zero Prisma imports
- **Source metadata:** Hero badge displays sourceMode (fixture, db_context) instead of "Mock experience"
- **Time window filtering:** Today, Yesterday, Last 7 Days, Last 30 Days — filtered by scanDate
- **Lens filtering:** Attention Spike, Overreaction, Value Gap, Future Theme — filtered by radarLens
- **Candidate cards:** Use DB RadarCandidate data (ticker, headline, bullets, thesis, etc.)
- **Intel Brief:** DB-backed narrative (thesis, whyNow, mainCatalyst, bullCase/bearCase, nextCheck) + RadarEvidence records + validation snapshot
- **Snapshot metrics:** Opportunity Score, Fundamental Score, Analyst Upside, Rating, Valuation, Stability, P/E, 52W Position from linked Stock/StockScore/StockQuote/StockMetric/StockAnalystData; missing values show as N/A
- **Empty state:** "No Radar scans yet" with CTA link to /admin/sync when no successful RadarScan records exist
- **Page render path:** No AI/provider/web/search/news calls; reads DB only

**Constraints Maintained:**

- ✅ /opportunity-radar UI changed (data source: mock → DB)
- ✅ Admin UI unchanged (no Admin buttons added, Phase 23C-2B/2C buttons exist)
- ✅ No Prisma schema changes (reuses Phase 23C-1B models)
- ✅ No migrations added
- ✅ No provider/AI/API calls from /opportunity-radar render path
- ✅ No external web/search/news/API calls
- ✅ No public web scan claims (sourceMode correctly labeled)
- ✅ No production scoring changes (Fundamental v1, Opportunity v2 untouched)
- ✅ No scheduled jobs (read-only, deferred to Phase 23D)
- ✅ No provider/source/prompt config models (deferred to future phase)

**Browser QA Results:**

- ✅ DB-backed data scenario: Page loads with "Daily Opportunity Briefing", hero shows "Fixture scan · local test data" badge
- ✅ Time tabs: Today, Yesterday, Last 7 Days, Last 30 Days all filter correctly by scanDate
- ✅ Lens filtering: Attention Spike, Overreaction, Value Gap, Future Theme filter by radarLens
- ✅ Candidate cards: Ticker, company, headline, bullets, Signal Snapshot from DB fields
- ✅ Intel Brief: Thesis, whyNow, mainCatalyst, bullCase/bearCase, nextCheck + evidence + validation snapshot
- ✅ Empty state: Verified via code inspection (live DB has scans; empty state works when no successful RadarScan records)
- ✅ Regression routes: / (Dashboard), /scanner (Scanner), /admin/sync (Admin Sync) all load without errors

**Automated Checks:**

- `npm run build` — ✅ Pass (Compiled successfully, all 12 routes generated)
- `npx tsc --noEmit` — ✅ Pass (No TypeScript errors)
- `npx prisma validate` — ✅ Pass (Schema valid, 15 migrations)
- `npx prisma migrate status` — ✅ Pass (Database schema up to date)

**Design Highlights:**

- Time window filtering: Today (current calendar day), Yesterday (previous calendar day), Last 7/30 Days (rolling windows) — simple logic, matches user expectations
- Candidate conversion: DB RadarCandidateView (11 fields) → UI RadarCandidate (for existing UI logic) via mapping function
- radarLens preserved in UI type for filtering; detailedCategory mapped to category enum for card styling
- Missing snapshot metrics (null values): Displayed as N/A in UI, not 0
- 52-week position: Calculated from (price - week52Low) / (week52High - week52Low) * 100
- Evidence: Only rendered if URL present; null URLs don't break links

**Ready for Future Phases:**

- Phase 23D: Scheduled daily scan execution (automation, monitoring)
- Future: Web/search source modes, multi-provider fallback, provider/source/prompt admin configuration

---

## Phase 23C-3+ — Claude Tool Use Stabilization & Debug Trace Logging

**Goal:** Stabilize and debug the Claude Radar Tool Use structured output flow. Add development-only debug tracing infrastructure to diagnose Tool Use response failures. Fix truncation, output size, and validation issues. Harden safety language rules.

**Status:** Completed. All automated checks passing. Tool Use working structurally. Validation passing with strengthened prohibited language rules. One real Claude scan executed and persisted successfully (4 candidates, 8 evidence items).

**Branch:** `refactor/radar-claude-tool-output`

**Deliverables:**

**A. Debug Trace Infrastructure**

New file `src/lib/opportunity-radar/radar-debug-trace.ts`:
- `RadarDebugTraceCollector` class for structured diagnostic logging
- Environment-controlled: `RADAR_DEBUG_AI_TRACE=true` to enable, `RADAR_DEBUG_FULL_PAYLOAD=false` for normal debugging
- Output: JSON files to `tmp/radar-debug/` (git-ignored)
- Captures per Claude scan: DB context, request shape, response shape, Tool Use diagnostics, validation, persistence, final result
- Safe serialization: BigInt/Date/Error handling, secrets redacted (API key), no circular refs
- Non-blocking: if file write fails, scan continues with warning logged
- File naming: `radar-claude-debug-<timestamp>-<attemptId>.json`

**B. max_tokens Truncation Fix**

Modified file `src/lib/opportunity-radar/claude-radar-provider.ts`:
- Added `getRadarMaxTokens()` function with env override: `ANTHROPIC_RADAR_MAX_TOKENS` (default: 8192, up from 4096)
- Added `stopReason === "max_tokens"` detection returning specific error: "Claude output was truncated by max_tokens"
- Prevents validation on incomplete tool output
- Root cause: 4096 tokens insufficient for full structured output with 4-6 candidates

**C. Output Size Reduction**

Modified file `src/lib/opportunity-radar/build-radar-prompt.ts`:
- Reduced candidate count from 2-10 to 2-5 (quality over quantity)
- Limited evidence per candidate to 1-2 items (was unrestricted)
- Enforced text field limits via prompt instructions:
  - headline: 140 chars, radarBullets: 3×120 chars, thesis: 400 chars
  - whyNow: 300 chars, mainCatalyst: 150 chars
  - whatLooksInteresting: 2×150 chars, keyConcerns: 2×150 chars
- Reduces token consumption, stabilizes Tool Use responses

**D. scanDate Persistence Fix (Critical)**

Modified file `src/lib/opportunity-radar/persist-radar-output.ts`:
- Changed scanDate from Claude output date (potentially stale) to current execution time: `new Date()`
- Root cause: Claude's tool output scanDate (e.g., 2026-06-07) was being used, causing scans to appear in past date filters
- Impact: Fixes "Today" filter to include fresh Claude scans, correct metadata selection

**E. Prohibited Language Hardening**

Modified file `src/lib/opportunity-radar/build-radar-prompt.ts`:
- Added explicit "PROHIBITED LANGUAGE" section in system prompt
- Listed banned words: buy, sell, hold, strong buy, recommendation, etc.
- Provided explicit alternatives: "research candidate", "worth reviewing", "market attention", etc.
- Added "REQUIRED ALTERNATIVES" subsection with neutral language patterns

Modified file `src/lib/opportunity-radar/validate-radar-output.ts`:
- Extended prohibited phrases list with single-word patterns using word boundaries: `\bbuy\b`, `\bsell\b`, `\bhold\b`, etc.
- Implemented regex-based word boundary matching to avoid false positives (e.g., "seller")
- Added phrases: "should buy", "should sell", "recommendation"
- Improved `findProhibitedLanguage()` function with regex support and fallback to substring matching

Modified file `src/lib/opportunity-radar/radar-tool-schema.ts`:
- Added CRITICAL warnings to text field descriptions: headline, thesis, whyNow, etc.
- Explicitly forbade buy/sell language with examples of required alternatives
- Tool schema now reinforces safety rules at schema level

**F. Test Infrastructure**

New file `scripts/test-radar-debug-trace.ts`:
- 6/6 tests passing:
  - Debug disabled does not write file
  - Debug enabled writes JSON file
  - File contains expected top-level sections
  - Error object serializes safely
  - API key is not included in trace
  - Tool Use diagnostics capture correctly

**G. Real Claude Execution Results**

Real Claude Radar Scan executed from Admin UI:
```
scanId: cmq5lhxso000090c86lfgdf59
provider: Anthropic
model: claude-sonnet-4-6
sourceMode: db_context
candidateCount: 4
evidenceCount: 8
executionTimeMs: ~9000ms
Validation: PASSED (no prohibited language)
Persistence: SUCCEEDED
```

Initial issue: Claude was using "buy" and "sell" language
After fix: Claude output now uses neutral alternatives, validation passes

**H. Admin UI Updates**

Modified file `src/components/admin/SyncPageClient.tsx`:
- Added debug trace path display in success/failure result panels
- Shows: "Debug trace: tmp/radar-debug/radar-claude-debug-....json"
- Non-intrusive: optional section, shown only when available

**I. Documentation Updates**

Modified files:
- `Context/Features/admin-sync-feature-spec.md` — Added "Debug Tracing (Development)" subsection
- `Context/Features/opportunity-radar-ai-agent-spec.md` — Added Phase 23C-3+ implementation notes

**Automated Checks:**

- `npm run build` — ✅ Pass
- `npx tsc --noEmit` — ✅ Pass
- `npx prisma validate` — ✅ Pass
- `npx prisma migrate status` — ✅ Pass (15 migrations, up to date)
- `npx tsx scripts/test-radar-validation.ts` — ✅ Pass (8/8 tests)
- `npx tsx scripts/test-radar-tool-schema.ts` — ✅ Pass (84/84 checks)
- `npx tsx scripts/test-radar-tool-response-parser.ts` — ✅ Pass (7/7 tests)
- `npx tsx scripts/test-radar-debug-trace.ts` — ✅ Pass (6/6 tests)

**Files Changed:**

```
Created:
  src/lib/opportunity-radar/radar-debug-trace.ts
  scripts/test-radar-debug-trace.ts

Modified:
  .gitignore (added tmp/)
  src/lib/opportunity-radar/claude-radar-provider.ts (max_tokens fix, truncation detection)
  src/lib/opportunity-radar/build-radar-prompt.ts (output size reduction, language rules)
  src/lib/opportunity-radar/persist-radar-output.ts (scanDate fix)
  src/lib/opportunity-radar/validate-radar-output.ts (prohibited language regex)
  src/lib/opportunity-radar/radar-tool-schema.ts (schema descriptions)
  src/actions/opportunity-radar-actions.ts (trace lifecycle integration)
  src/components/admin/SyncPageClient.tsx (debug trace path display)
  Context/Features/admin-sync-feature-spec.md
  Context/Features/opportunity-radar-ai-agent-spec.md

Total: 2 files created, 8 files modified, 0 migrations added
```

**Constraints Maintained:**

- ✅ No Prisma schema changes (uses existing Phase 23C-1B models)
- ✅ No migrations added
- ✅ Debug trace is development-only (git-ignored)
- ✅ No production scoring changes
- ✅ No external web/search/news calls
- ✅ No /opportunity-radar behavior changed (still reads DB, just displays correct metadata)
- ✅ Admin buttons unchanged (just added debug trace path display)
- ✅ Tool Use structured output unchanged (only stabilized via larger token budget and smaller output)

**Known Follow-ups (Not Fixed):**

- UI still displays raw analyst labels (Buy/Sell/Hold) — should be mapped to neutral UI wording in future phase
- `/opportunity-radar` copy still references "mock/simulated signals" for real Claude db_context scans — should be fixed in future polish phase
- Admin should later allow editing Radar prompt and max_tokens settings
- DB context still thin in test environment (quote/score/analyst data missing) — should be enriched with real data later

**Design Highlights:**

- Debug trace infrastructure provides actionable diagnostics without console.logs
- max_tokens increase (4096→8192) + output size reduction (2-10→2-5 candidates) together stabilize Tool Use responses
- scanDate fix makes time filtering work correctly for fresh scans
- Prohibited language strengthening (prompt + schema + validator regex) prevents validation failures
- No breaks to existing Admin/Fixture/Claude buttons or /opportunity-radar display
- One real Claude scan demonstrates working Tool Use with correct validation

**Ready for Future Phases:**

- Phase 23D: Scheduled daily scan execution
- Future: Editable prompt/max_tokens Admin settings, neutralized UI copy, enriched DB context, web/search source modes

---

## Phase 24A-1 — Admin Console Cleanup

**Goal:** Reorganize /admin/sync UI to improve clarity and usability by removing developer tools from visible workflows, consolidating documentation, and making data inventory more compact.

**Status:** Completed. UI reorganization complete, documentation updated, all automated checks passing, browser QA performed, ready for production.

**Branch:** `feature/admin-console-cleanup`

**Deliverables:**

**A. Admin Console Tab Reorganization**

New Tab Structure:
1. **Data Inventory** (refactored)
2. **Sync Actions** (cleaned)
3. **AI Scan** (new)
4. **Documentation** (replaces Score Methodology)
5. **Provider Tests** (preserved)
6. **Sync History** (preserved)

**B. Data Inventory Tab Cleanup**

Removed:
- Separate DB Stock Summary panel (redundant with Universe Overview)

Reorganized:
- Universe Overview table moved to top of Data Inventory (read-only snapshot)
- Stock Data Inventory summary compacted:
  - Reduced padding from `px-3 py-2.5` to `px-2 py-1`
  - Reduced text sizes: `text-xl` → `text-lg`, `text-[11px]` → `text-[10px]`
  - Changed grid layout from 2-4-6 columns to 3-5-8 columns
  - Simplified summary metrics to 8 key cards: Total, With Quote, With Metrics, With Score, Scanner OK, NASDAQ 100, S&P 500, With Analyst
  - Reduced section spacing for compactness

Preserved:
- Stock Data Inventory full table
- Search functionality
- Filter controls (24+ filter options)
- Pagination (25/50/100 rows)
- All column functionality

**C. Sync Actions Tab Cleanup**

Removed from visible UI:
- Developer / Legacy Tools section (including Analyst Target Discovery legacy tool)
- All related UI panels, buttons, handlers visibility

Preserved:
- Production sync workflows visible:
  - Universe Sync (Nasdaq 100 + S&P 500)
  - Daily Market Data Sync
  - Company Data Sync
  - Score Calculation
- All backend handlers, server actions, and state management (hidden but functional)

Backend Code Preservation:
- `handleStartTargetDiscovery()`, `handleContinueTargetDiscovery()`, and related handlers remain in code
- `targetDiscovery` state management preserved
- Server action logic intact
- Can be reactivated without code recovery

**D. New AI Scan Tab**

Created dedicated tab for Opportunity Radar operations:

Sections:
- **Fixture Scan** — Test data validation (local sample, no external APIs)
- **Claude Scan** — Real Claude Sonnet 4.6 execution (server-side, DB-backed context)

Content:
- Progress indicators
- Result/error viewers
- Success/failure panels with metadata and validation errors

Purpose:
- Centralizes all Opportunity Radar admin operations
- Moves from mixed Sync Actions organization to focused AI operations tab
- Preserves Phase 23C-2B and 23C-2C functionality

**E. New Documentation Tab**

Replaces standalone Score Methodology tab with comprehensive documentation:

All Sections Collapsed by Default:
- Score Methodology / Scoring & Analysis
- Sync Workflows
- Data Inventory Guide
- Opportunity Radar / AI Scan
- Provider Sources
- Glossary
- Troubleshooting

Design:
- Reduced initial visual clutter
- Users expand sections as needed
- Clear hierarchical organization
- Single cohesive documentation interface

Content:
- Score Methodology now inside collapsed accordion (moved from standalone tab)
- Comprehensive sync workflow documentation
- Data inventory feature guide
- Opportunity Radar/AI Scan explanation
- Provider source documentation
- Glossary of key terms
- Troubleshooting guide

**Files Changed:**

```
Created:
  src/components/admin/AiScanTab.tsx
  src/components/admin/DocumentationTab.tsx

Modified:
  src/components/admin/DataInventoryTab.tsx
  src/components/admin/SyncPageClient.tsx
  Context/Features/admin-sync-feature-spec.md
  Context/current-feature.md

Total: 2 files created, 4 files modified, 0 migrations added
```

**QA Results:**

Data Inventory Tab:
  ✓ DB Stock Summary panel not visible
  ✓ Universe Overview table visible
  ✓ Stock Data Inventory summary compact (reduced padding, smaller fonts, 8-column grid)
  ✓ All summary metrics display correctly
  ✓ Search functionality works
  ✓ Filters work
  ✓ Pagination works
  ✓ Table displays

Sync Actions Tab:
  ✓ Developer / Legacy Tools section not visible
  ✓ Production workflows visible:
    - Universe Sync
    - Daily Market Data Sync
    - Company Data Sync
    - Score Calculation
  ✓ All buttons functional

AI Scan Tab (New):
  ✓ Tab renders and is selectable
  ✓ Fixture Scan section visible with description and button
  ✓ Claude Scan section visible with description and button
  ✓ Result/error panels display correctly

Documentation Tab (New):
  ✓ Tab renders and is selectable
  ✓ All sections initially collapsed (chevrons point right)
  ✓ Each section expands/collapses on click
  ✓ Score Methodology appears as collapsed accordion
  ✓ Content readable and properly formatted

Other Tabs:
  ✓ Provider Tests tab renders
  ✓ Sync History tab renders and functions

Regression Routes:
  ✓ / (dashboard) loads
  ✓ /scanner loads
  ✓ /opportunity-radar loads
  ✓ No console errors

Automated Checks:
  ✓ npm run build — Pass (all routes compiled)
  ✓ npx tsc --noEmit — Pass (no TypeScript errors)
  ✓ npx prisma validate — Pass (schema valid)
  ✓ npx prisma migrate status — Pass (15 migrations, up to date)
```

**Constraints Maintained:**

- ✅ No Prisma schema changes
- ✅ No migrations added
- ✅ No AI/provider behavior changes (Claude, FMP, Finnhub unchanged)
- ✅ No Scanner changes
- ✅ No Dashboard changes
- ✅ No Drawer changes
- ✅ No /opportunity-radar page changes (Phase 23C-3 DB reader preserved)
- ✅ No production scoring changes (Fundamental v1, Opportunity v2 untouched)
- ✅ No scheduled jobs added
- ✅ No API key editing UI added
- ✅ No provider switching UI added
- ✅ Backend legacy code preserved (no code deletion)

**Documentation Updates:**

Updated:
- `Context/Features/admin-sync-feature-spec.md` — Phase 24A-1 UI changes documented
- `Context/current-feature.md` — Phase 24A-1 marked as completed

Checked but not updated:
- `Context/data-model.md` (no schema changes)
- `Context/sync-workflows.md` (no workflow changes)
- `Context/architecture.md` (no architecture changes)
- `Context/scoring-system.md` (no scoring changes)

**Design Highlights:**

- Tab reorganization improves mental model (production workflows separate from developer tools, AI operations separate from sync workflows)
- Data Inventory compaction removes redundancy while preserving full functionality
- Documentation consolidation provides reference material without tab clutter
- Backend code preservation enables future reactivation without recovery
- No breaking changes to existing workflows or APIs
- Progressive disclosure pattern (collapsed sections) reduces cognitive load

**Ready for Next Phase:**

Phase 24A-2 and beyond can safely build on this UI foundation:
- Admin console clearly organized by function
- Documentation centralized and accessible
- Developer tools still available in code (not deleted) for future use

---

## Phase 24A-2 — AI Scan Config MVP + Token Accounting

Implemented database-backed AI Scan configuration system enabling runtime customization of Opportunity Radar Claude scan parameters without code changes.

**Data Model:**
- Added `RadarAiConfig` model: stores editable promptTemplate, maxTokens, dbContextLimit, candidateLimit, model, debugTraceEnabled, promptVersion, schemaVersion, changeNotes
- Added `RadarScan.configId` (nullable, SetNull on delete) for audit trail linking scans to configs
- Two migrations created and applied: (1) RadarAiConfig model, (2) model field addition

**Config Loading System:**
- Implemented fallback chain: DB active config → ANTHROPIC_RADAR_MODEL env → code default
- Source tracking for all fields (promptSource, maxTokensSource, dbContextLimitSource, candidateLimitSource, modelSource, debugTraceEnabledSource)
- Validation: prompt min 200 chars, tokens 2000–50000, context 1–100, candidates 1–20
- Seeded default config on init (idempotent)

**AI Scan Config Admin UI:**
- Collapsed by default, expandable form
- Editable fields: promptTemplate, maxTokens, dbContextLimit, candidateLimit, model, debugTraceEnabled, changeNotes
- Field labels clarified: "DB Context Limit" → "DB Stocks Sent to Claude", "Candidate Limit" → "Max Candidates to Return"
- Helper text explains each field and trade-offs
- Config source display (DB / Env / Code Default)
- API key status explanation (env-only, never shown)
- Save/error messaging
- Config reloads after save

**Token Accounting UX:**
- Prompt template token count (editable prompt only)
- Token Breakdown section showing:
  - Prompt template tokens
  - DB stock context tokens (estimated from stock count)
  - Tool schema / runtime tokens (estimate)
  - Estimated full request tokens (sum)
  - Exact full request tokens (from Anthropic API if counted)
- "Count full request tokens" button calls Anthropic token counting endpoint (server-side only, no inference)
- Clear error if ANTHROPIC_API_KEY missing (no key value exposed)
- Token estimation uses hybrid algorithm (char/4.5 vs words*1.25, uses lower)

**Claude Scan Behavior:**
- Loads effective config on each scan
- Uses DB prompt if active config exists, else env/code default
- Uses DB context limit for stock selection
- Uses DB max tokens for API call
- Uses DB model for Claude call
- Stores configId on RadarScan

**UI Reorganization:**
- AI Scan Config at top (collapsed)
- Claude Scan as primary action
- Latest AI Scan Summary below Claude Scan (auto-refreshes)
- QA / Test Scan (collapsed) with Fixture Scan
- Fixture Scan fully functional in collapsed section

**Progress & Result Display:**
- Estimated progress UI improved: honest 8-step sequence, stays on "Waiting for Claude response" while running
- Post-scan result report shows: scanId, candidates, evidence, duration, tokens, provider, model, sourceMode, config source, debug trace path, safety disclaimer

**AI Scan History:**
- Latest 10 RadarScans shown in Sync History tab
- Shows: date, status, provider, source mode, candidates, duration, config, link to /opportunity-radar

**Security:**
- API key remains env-only (ANTHROPIC_API_KEY)
- Key value never exposed in UI or logs
- Token counting uses Anthropic API (no inference, no completion)
- No scan data persisted during token counting
- No provider calls added to normal UI render paths

**Constraints Maintained:**
- ✅ No schema changes beyond RadarAiConfig and configId
- ✅ No provider switching UI
- ✅ No API key editing UI
- ✅ No scheduled scans
- ✅ No real-time DB progress tracking
- ✅ No Scanner changes
- ✅ No Dashboard changes
- ✅ No Drawer changes
- ✅ No /opportunity-radar page changes

**QA Results:**
- Admin UI config management: ✅ form, save, reload, persist
- Token counting: ✅ estimates accurate, exact count from API works, error handling safe
- Claude Scan: ✅ loads config, executes, persists scan with configId
- Fixture Scan: ✅ works from collapsed QA section, persists with configId=null
- Latest AI Scan Summary: ✅ displays, auto-refreshes after scan
- AI Scan History: ✅ shows latest 10 scans in Sync History tab
- Progress UX: ✅ honest labeled, 8 steps, stays on "waiting" during execution
- Result report: ✅ shows metadata, tokens, config source, disclaimer, link to /opportunity-radar
- Regression routes: ✅ /, /scanner, /opportunity-radar load without errors

**Automated Checks:**
- ✅ npm run build — Success (Compiled in 2.8s)
- ✅ npx tsc --noEmit — Pass (no TypeScript errors)
- ✅ npx prisma validate — Pass (schema valid)
- ✅ npx prisma migrate status — Pass (17 migrations, up to date)

**Documentation Updates:**

Updated:
- `Context/Features/admin-sync-feature-spec.md` — Documented AI Scan Config, Claude Scan, Latest AI Scan, QA/Test, Progress, Result Report, Token Breakdown
- `Context/Features/opportunity-radar-ai-agent-spec.md` — Phase 24A-2 implementation notes, config fallback chain, validation rules
- `Context/data-model.md` — RadarAiConfig model, RadarScan.configId field, fallback chain, model field
- `Context/current-feature.md` — Phase 24A-2 complete feature spec and acceptance criteria

Checked but not updated:
- `Context/architecture.md` (no data-flow changes)
- `Context/sync-workflows.md` (no workflow changes)
- `Context/scoring-system.md` (no scoring changes)

**Design Highlights:**
- Config fallback chain separates DB-backed configuration from environment variables and code defaults
- Token accounting UX clearly distinguishes prompt-only vs full-request costs
- Estimated vs exact token counts labeled clearly (estimated local, exact from Anthropic API)
- Admin UI field labels match product terminology (stocks, candidates, return)
- Progress UX honest: labeled "Estimated" and explains it's not live backend tracking
- Result report shows audit trail: which config was used, what scan produced what candidates
- Fixture Scan remains accessible for validation testing without hiding it in admin tools
- No provider behavior changed; only admin configuration added

**Ready for Next Phase:**

Phase 24A-3 and beyond can build on this foundation:
- AI Scan Config system in place for runtime customization
- Token accounting visible to admins for budget awareness
- Result audit trail (configId) enables config-to-outcome analysis
- Fixture Scan isolated in test section keeps production-like admin UX clean
- All data and admin workflows verified functional

---

## AI Scan Failure Visibility Hotfix

**Completion Date:** June 2026

**Goal:**
Make failed Claude scan attempts visible, actionable, and tracked correctly in Admin UI.

**Problem:**
When a Claude scan failed (e.g., due to max_tokens truncation), no RadarScan record was created. The "Latest AI Scan" remained stuck on the last successful scan, and users had no visibility into why a newer scan attempt didn't produce candidates.

**Solution:**

1. **Failed Scan Persistence:**
   - All Claude scan failures now create RadarScan records with status="failed"
   - Failure types tracked: provider_error, validation_error, truncation, persistence_error
   - Error messages stored in RadarScan.errorMessage for audit trail
   - No RadarCandidate or RadarEvidence records created for failed attempts

2. **Error Message Clarity:**
   - max_tokens truncation shows specific, actionable guidance:
     - "Increase Max Tokens in AI Scan Config above"
     - "Reduce Max Candidates to Return"
     - "Reduce DB Stocks Sent to Claude"
     - "Simplify the prompt in AI Scan Config"
   - Note: "ANTHROPIC_RADAR_MODEL is only an env fallback when no DB config is active"

3. **UI Updates:**
   - Heading: "Latest AI Scan Attempt" (not "Latest AI Scan") to clarify it shows latest attempt, not just successful
   - Button: "View Radar Results" (not "View Radar") with tooltip: "This scan failed and has no candidate results" for failed scans
   - Helper note for failed attempts: "This scan failed. No candidates were created. Check error details above or view latest successful scan on /opportunity-radar."
   - Error details clearly state: "No candidates or evidence were persisted. A failed RadarScan attempt was saved for audit/history."

4. **Database Context Quality Warning:**
   - Component shows DB data completeness (quote, score, analyst data percentages)
   - Warns if quote/score/analyst data is missing (< 80% completeness)
   - Helps admins diagnose low-quality context before running expensive Claude scans

5. **Safety Verification:**
   - /opportunity-radar continues to filter by status="success" only
   - Failed scans with no candidates do not appear as Radar results
   - AI Scan History can show failed attempts with clear status indicators
   - No changes to normal UI render paths or provider behavior

**Implementation:**
- persistFailedRadarScan() function creates RadarScan records for all failure types
- LatestAiScanSummary refreshes after scan completes (success or failure)
- RadarScanResultReport shows detailed error display with truncation-specific guidance
- DbContextQualityWarning component integrated into AI Scan Config section
- All existing successful scan behavior unchanged

**QA Results:**
- ✅ Failed Claude scans persist as RadarScan with status="failed"
- ✅ Error messages shown with actionable guidance
- ✅ Latest AI Scan Attempt updates after failures
- ✅ Helper notes clarify no candidates/evidence persisted
- ✅ /opportunity-radar shows only successful candidate scans
- ✅ DB context quality warning displays appropriately
- ✅ No console errors
- ✅ No API key exposure
- ✅ No provider calls added to normal render paths

**Automated Checks:**
- ✅ npm run build — Success
- ✅ npx tsc --noEmit — Pass
- ✅ npx prisma validate — Pass
- ✅ npx prisma migrate status — Pass (17 migrations, up to date)

**Documentation Updates:**
- `Context/Features/admin-sync-feature-spec.md` — Added failed scan visibility, truncation guidance, latest attempt semantics
- All other docs verified accurate; no inconsistencies found

**Constraints Maintained:**
- ✅ No schema changes (used existing RadarScan.errorMessage and status fields)
- ✅ No migrations
- ✅ No API key exposure
- ✅ No provider calls to normal UI render paths
- ✅ Scanner/Dashboard/Drawer unchanged
- ✅ /opportunity-radar unchanged (verified filters failed scans out)

**Known Limitations:**
- Failed scan persistence relies on existing RadarScan.errorMessage field; no new fields added
- Truncation guidance is UI-level; prompt/context auto-tuning not implemented
- AI Scan History shows all attempts; no separate "failed only" filter in UI

**Next Steps:**
Phase 24A-3 and beyond can enhance:
- Automated context/token tuning to reduce truncation risk
- Scheduled daily scans with monitoring
- Provider switching UI
- Full real-time DB job progress tracking

---

## Phase 24B-0 — Opportunity Radar Product Rework Spec

**Completion Date:** June 2026

**Goal:**
Define the new product direction for Opportunity Radar before Phase 24B implementation, replacing the Lens-based daily briefing concept with a scan-based research signal tracker.

**Status:** Completed. Documentation-only planning phase defining product strategy, target UX, data model, and implementation scope.

**Product Direction Rework:**

**Old Concept (Phase 23A) — Legacy:**
- Lens-based daily briefing with 4 forced categories: Attention Spike, Overreaction, Value Gap, Future Theme
- 3-card fixed Opportunity Deck per lens
- Time control tabs (Today, Yesterday, Last 7 Days, Last 30 Days)
- Intel Brief side panel
- All candidates assumed to be in FomoFilter DB

**New Concept (Phase 24B+) — Approved Direction:**
- Scan-based research signal tracker (no forced lenses)
- Latest scan as primary experience (up to 10 ranked cards)
- External candidates allowed and clearly marked "Not in FomoFilter DB"
- FomoFilter validation snapshot when DB match exists (no invented scores for external)
- Track candidates across scan runs (new, repeated, back on radar, attention-needed)
- Treat repeated appearance as "requires attention", not as recommendation
- Use reasonTags/discoverySignals instead of forced 4-lens categorization
- Research-only language throughout (no buy/sell/hold)
- 5-tab structure: Latest Scan, Scan History, Repeated Signals, New Discoveries, Compare Scans

**Target Page Structure:**

1. **Latest Scan (Primary):**
   - Up to 10 ranked candidates as compact cards
   - Fields: Rank, Ticker, Company, DB Status (In DB / External Discovery), Trend Status (New / Repeated / Back on Radar / Attention Needed), Discovery Signals/Reason Tags, Headline, Main Catalyst, Evidence Quality, FomoFilter validation (if In DB), Next Check

2. **Scan History:**
   - All scans from last 30 days in table format
   - Shows: Scan Date/Time, Status, Provider, Model, Candidate Count, Discovery Signals, Source Mode

3. **Repeated Signals:**
   - Candidates appearing in multiple scans (≥2 in last 30d)
   - Shows: Appearance Count, First/Last Seen Dates, Trend Direction, Avg Rank, DB Status, Reason Tags
   - Computed from scan history, not persisted fields

4. **New Discoveries:**
   - Candidates first seen in latest scan
   - Same fields as Latest Scan
   - Emphasis on external discovery status

5. **Compare Scans:**
   - Side-by-side comparison of two user-selected scans
   - Shows: Rank Changes, New Candidates, Dropped Candidates
   - Rank changes computed on read, not persisted

**External Discovery Concept:**
- Candidates may exist outside FomoFilter DB universe
- Non-DB candidates marked with clear "External Discovery" / "Not in FomoFilter DB" badge
- No FomoFilter production scores invented for external candidates
- No watchlist/alert support for external discoveries (Phase 24B out-of-scope)
- DB matching: exact ticker match to Stock.symbol, optional stockId link, clear validation status

**Discovery Signals / Reason Tags:**
- Replace forced radarLens enum constraint
- Flexible, extensible: analyst_upside, valuation_gap, momentum_shift, narrative_change, analyst_upgrade, earnings_beat, high_short_interest, insider_activity, catalyst_signal, technical_setup, sector_strength, supply_demand
- Allow AI flexibility to add new signals as market conditions evolve
- Primary signal model in new product direction

**Historical Comparison Model:**
- Appearance count: computed from scan history (how many scans contain this ticker)
- First seen / Last seen dates: computed from MIN/MAX scanDate in scan history
- Rank change: computed as (current rank) - (prior rank)
- Trend status: computed from appearance history (new, repeated, back_on_radar, cooling_down)
- Repeated signal: appears in ≥2 scans in last 30 days (requires attention)
- All initial phase: computed by loaders from scan history, not persisted/denormalized

**Phase 24B-1 Immediate Schema Foundation:**

Immediate fields to add (Phase 24B-1 implementation only):
- RadarScan: scanPeriodStart, scanPeriodEnd, scanLabel
- RadarCandidate: reasonTags, externalDiscoveryStatus, dbValidationStatus, researchPriority

**Deferred / Future Optimization Fields (NOT Phase 24B-1):**
- RadarScan: previousScanId, comparisonSummary, scanMode
- RadarCandidate: firstSeenScanId, lastSeenScanId, rankChange, previousRank, appearanceHistory (persisted appearance count)

**Critical Clarifications:**
- radarLens remains in schema unchanged for backward compatibility; existing Phase 23C records stay readable
- tags[] remains unchanged alongside new reasonTags[]
- First seen, last seen, appearance count, trendStatus, rank changes computed by loaders, not persisted
- No schema bloat: computed values on read vs. denormalization
- Phase 24B-1 implementation targets 7 immediate fields only (4 RadarScan, 4 RadarCandidate)
- Deferred fields explicitly NOT added unless Product Owner approves scope change
- Backward compatibility preserved: old radarLens values readable, old tags[] continues working

**Non-Scope for Phase 24B:**
- Scheduled scans (Phase 24A-3)
- Web search integration (Phase 24C+)
- Provider switching (Phase 25+)
- Auto-universe expansion
- Watchlist/alert support for external discoveries
- Scanner/Dashboard/Drawer changes
- Production scoring formula changes

**Documentation Updates:**

Updated:
- `Context/current-feature.md` — Phase 24B-0 specification
- `Context/Features/opportunity-radar-feature-spec.md` — New product role, 5-tab structure, approved decisions, legacy marking
- `Context/Features/opportunity-radar-ai-agent-spec.md` — Phase 24B product direction, output contract, reasonTags, legacy fields
- `Context/data-model.md` — Planned Phase 24B fields (immediate vs. deferred), backward compatibility, migration strategy, computed vs. persisted
- `Context/project-overview.md` — Roadmap updated: Phase 24B-0 in planning, Phase 24B-1+ phases outlined

Checked but not updated:
- `Context/architecture.md` (no data-flow changes yet)
- `Context/sync-workflows.md` (no workflow changes)
- `Context/scoring-system.md` (no scoring changes)

**Constraints Maintained:**
- ✅ No application code changed
- ✅ No Prisma schema changes
- ✅ No migrations created
- ✅ No provider/AI execution
- ✅ No UI changes
- ✅ Documentation-only planning phase

**Automated Checks:**
- ✅ npm run build — Success (routes unchanged)
- ✅ npx tsc --noEmit — Pass (no TypeScript errors)
- ✅ npx prisma validate — Pass (schema unchanged)
- ✅ npx prisma migrate status — Pass (17 migrations, up to date)

**Design Highlights:**
- Clean product rework from Lens-based to Signal-based concept
- External discovery support fundamental to new direction
- Phase 24B-1 scope clearly bounded (7 immediate fields, 9 deferred fields marked)
- Backward compatibility preserved for Phase 23C scan data
- Computed values approach avoids denormalization bloat
- reasonTags flexibility allows market signal evolution
- Clear phase breakdown: Phase 24B-1 data model, 24B-2+ prompt/UI implementation

**Ready for Phase 24B-1:**
Product direction approved and documented. Phase 24B-1 implementation can proceed with confidence:
- Exact fields to add documented
- Exact fields to NOT add documented
- Backward compatibility rules documented
- Phase breakdown complete with phase-specific scope
- Data loader patterns established (computed values)
- Product concepts settled (external discovery, reasonTags, trend tracking)
