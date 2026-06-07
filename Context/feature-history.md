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
