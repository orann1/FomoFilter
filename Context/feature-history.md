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
