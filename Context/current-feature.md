# Current Feature — Awaiting Phase 23 Definition

## Active Phase

```txt
None — Phase 22C complete and merged.
Next phase: Phase 23 — Historical Daily + Momentum Foundation (not yet started).
```

## Status

```txt
Phase 22C — Data Inventory Pagination + Sync Scale Hardening: Complete.
Committed and merged to main on feature/data-inventory-scale-hardening.
Phase 23 not yet defined or started.
```

---

## Required Reading

Always read:

```txt
Context/README.md
Context/project-overview.md
Context/current-feature.md
Context/coding-standards.md
Context/ai-interaction.md
Context/product-lead-workflow.md
```

For this phase, also read:

```txt
Context/Features/admin-sync-feature-spec.md
Context/sync-workflows.md
Context/data-model.md
Context/Features/market-data-sync-strategy.md
Context/Features/dashboard-feature-spec.md
Context/Features/scanner-feature-spec.md
```

Read only if needed:

```txt
Context/architecture.md
Context/feature-history.md
Context/scoring-system.md
Context/Algorithms/fundamental-score-v1.md
Context/Algorithms/opportunity-score-v2.md
Context/Algorithms/analyst-rating-and-upside.md
Context/Features/drawer-feature-spec.md
```

---

## Goal

Prepare FomoFilter Admin/Data Health surfaces to handle the expanded multi-universe stock universe comfortably.

Phase 22B expanded the app from a Nasdaq 100-centered system to multi-universe coverage with:

```txt
US Stocks default scanner view
Nasdaq 100 membership
S&P 500 membership
~518 unique active stocks after S&P 500 sync
Provider-backed syncs operating on deduplicated unique active symbols
```

Phase 22C should focus on scale hardening for 500–1000 stocks, especially in:

```txt
Admin Sync
Data Inventory
Sync History
Sync status panels
Coverage / freshness reporting
```

This phase should make the operational data-health experience usable before expanding further toward 1000 stocks or building Daily Stock Opportunity Radar.

---

## Product Context

Current architecture rule:

```txt
External providers / static sources
→ Admin Sync workflows / future scheduled jobs
→ Database
→ Dashboard / Scanner / Drawer
```

Scanner, Dashboard, and Drawer must not call providers directly.

Current production workflows:

```txt
Nasdaq 100 Universe Sync
S&P 500 Universe Sync
Daily Market Data Sync over all unique active universe symbols
Company Data Sync over all unique active universe symbols
Calculate Fundamental Scores
Calculate Opportunity Scores
```

Current universe state after Phase 22B:

```txt
nasdaq-100 active members: 100
sp-500 active members: 499
unique active stocks across all universes: ~518
overlap: ~84
duplicate Stock rows by symbol: 0
```

---

## Why This Phase Matters

After Phase 22B, the system can track hundreds of stocks. The next bottleneck is operational visibility:

```txt
Can Data Inventory remain readable at 500+ rows?
Can Data Inventory support 1000 rows?
Can Admin Sync show progress, status, and coverage clearly?
Can Sync History remain understandable after larger runs?
Can the user quickly find missing data, stale rows, failed symbols, and skipped provider results?
```

Without this cleanup, adding more universes or building Daily Radar will make Admin/Data Health noisy and hard to operate.

---

## Product Role Split

```txt
Scanner          = stock discovery workspace
Dashboard        = high-level overview and action surface
Drawer           = visual decision cockpit
Admin Sync       = operational sync control center
Data Inventory   = data health, coverage, freshness, missing data, source/status
Sync History     = operational run history and per-symbol debugging
Daily Radar      = future web/news/catalyst discovery module
```

Data Inventory must not become a second Scanner.

---

## Current Problem / Expected Audit Focus

Before implementation, the actual repository state must be audited.

Known areas to inspect:

```txt
Data Inventory row count and rendering approach
Whether Data Inventory currently loads all rows client-side
Whether search/filter/sort is client-side only
Whether Data Inventory needs pagination, page size, or server-side query support
Whether Data Inventory filters remain useful with ~518 rows
Whether Sync History becomes noisy with 500+ SyncRunItems
Whether SyncRun expanded details need pagination/limit/collapse behavior
Whether Admin Sync status panels clearly show latest run dates and counts
Whether Daily/Company sync latest status is clear after multi-universe changes
Whether failed/skipped symbols are easy to find
Whether Data Inventory coverage summaries are enough
Whether Dashboard/Data Health and Admin/Data Inventory overlap correctly
```

---

## Scope

Phase 22C is expected to include, after audit approval:

```txt
Data Inventory pagination or virtualization, if needed
Data Inventory search/filter usability improvements
Data Inventory page-size controls, if needed
Data Inventory summary/coverage cards, if needed
Sync History readability improvements for large runs
SyncRun item display limits or pagination, if needed
Admin Sync latest status clarity
Freshness/date labels in status panels
Clearer skipped/failed/partial_success reporting
Noisy warning cleanup if still needed
Documentation updates after QA
```

The first step must be Audit / Planning only.

---

## Non-Scope

Do not implement in Phase 22C audit:

```txt
New universe expansion
Russell 1000
Thematic universes
Daily Stock Opportunity Radar
Historical price data
Momentum Score
Hot Score
FOMO Risk
News/catalyst ingestion
AI insight generation
Alert evaluation engine
Stock details page
Provider plan upgrade logic
New provider endpoints
Scoring formula changes
```

Do not change:

```txt
DB schema
Prisma models
Provider responsibilities
Score formulas
Universe membership logic
Scanner default behavior
Dashboard structure
Drawer behavior
Watchlist/alert behavior
```

No schema change is expected unless the audit proves otherwise and Product Owner approves.

---

## Product Questions To Answer

The audit should answer:

```txt
Is Data Inventory currently usable at ~518 rows?
Will it remain usable at 1000 rows?
Does Data Inventory need client-side pagination, server-side pagination, or virtualization?
What is the safest smallest improvement?
Does Sync History need pagination or row limits for SyncRunItems?
Are latest run dates/counts clear enough in Admin Sync status panels?
Can the user easily see what data is missing and why?
Can the user find failed/skipped symbols after a 500-symbol run?
Does partial_success have clear operational meaning in the UI?
Do Dashboard warnings and Admin data-health views complement each other?
Do any queries become expensive at 500+ stocks?
Do we need DB indexes before 1000 stocks?
Can this phase be done without schema/migration?
```

---

## Audit Questions

### 1. Current Data Inventory implementation

Answer:

```txt
Which component owns Data Inventory?
How is data loaded?
How many rows are loaded currently?
Are all rows sent to the client?
Are filtering/search/sort handled client-side or server-side?
Does it render all rows at once?
What fields/columns exist?
Which columns are most useful?
Which columns make it too dense?
```

### 2. Data Inventory scale assessment

Answer:

```txt
How does Data Inventory behave at ~518 rows?
What risks exist at 1000 rows?
Is browser performance acceptable?
Is mobile/responsive behavior acceptable?
Would client-side pagination be enough?
Would server-side pagination be safer?
Would virtualization be overkill?
What is the smallest safe Phase 22C implementation?
```

### 3. Data Inventory UX/readability assessment

Answer:

```txt
Can the user quickly find:
- missing quote
- missing metrics
- missing analyst data
- missing scores
- stale quote
- stale metrics
- stale scores
- skipped provider results
- scanner-ineligible stocks

Are filters clear?
Is search useful?
Are rows too dense?
Should there be summary cards or grouped filters?
Which columns should stay always visible?
Which columns could be hidden/collapsed?
```

### 4. Sync History implementation

Answer:

```txt
Which component owns Sync History?
How are SyncRun and SyncRunItem loaded?
Are expanded SyncRunItems limited?
Are all SyncRunItems rendered for a large run?
Does the table remain readable after 500+ item runs?
Are failed/skipped rows easy to find?
Are statuses and durations clear?
Does Sync History need pagination, filtering, or item limits?
```

### 5. Admin Sync status panel assessment

Answer:

```txt
Do Daily Market Data and Company Data status panels show:
- latest run date
- run type
- status
- requested count
- succeeded/skipped/failed counts
- duration
- partial_success reason
- active unique stock count
- coverage percentage

Are labels still accurate after Phase 22B?
Is partial_success understandable?
Does the user know what to do next after partial_success?
```

### 6. Query/performance assessment

Inspect data loaders and route handlers.

Answer:

```txt
Which queries may become expensive at 500–1000 stocks?
Are includes/selects too large?
Are unnecessary fields loaded?
Are SyncRunItems loaded without limits?
Are indexes sufficient based on current schema?
Is a schema/index change needed? Expected answer should be no unless audit proves otherwise.
```

### 7. Documentation impact forecast

Forecast which docs would likely need updates if implementation proceeds:

```txt
Context/Features/admin-sync-feature-spec.md
Context/sync-workflows.md
Context/data-model.md if query/index/schema behavior changes
Context/project-overview.md
Context/current-feature.md
```

### 8. Recommended implementation plan

Recommend a scoped implementation plan.

Prefer small, safe steps such as:

```txt
Data Inventory client-side pagination + page size
Data Inventory quick health filters
Sync History item limit / "show only failed/skipped" filter
Admin latest status panel copy and freshness cleanup
Documentation updates
```

Avoid large refactors unless proven necessary.

---

## Expected Implementation Direction After Audit

Likely implementation should focus on:

```txt
Data Inventory page size / pagination
Data Inventory health filters
Better large-run Sync History readability
Better latest run status visibility
No schema changes
No provider changes
No score changes
No scanner/dashboard/drawer redesign
```

---

## Acceptance Criteria For This Audit

The audit is complete when it provides:

```txt
Data Inventory current implementation map
Data Inventory 500/1000-row scalability assessment
Sync History scalability assessment
Admin Sync latest status assessment
Query/performance risks
Recommended smallest safe implementation scope
Files likely to change
Docs likely to change
Clear Product Owner decisions/blockers
```

---

## Acceptance Criteria For Final Phase Completion

Phase 22C will be complete when, after approved implementation:

```txt
Data Inventory remains usable at ~518 rows and is ready for 1000.
Data Inventory does not render as an unmanageable giant table.
The user can quickly find missing/stale/skipped/problem rows.
Sync History remains readable after large sync runs.
Large SyncRunItem lists do not overwhelm the UI.
Admin Sync status panels clearly show latest run date, counts, status, and coverage.
partial_success is understandable and actionable.
No provider calls are added to normal UI render paths.
No schema change or migration occurs unless explicitly approved.
No scoring formula changes occur.
Dashboard, Scanner, Drawer, and Admin Sync still load.
Build, TypeScript, Prisma validate, and migrate status pass.
Documentation is updated after QA.
```

---

## QA Requirements For Final Implementation

Browser QA should verify:

```txt
/admin/sync initial load
Sync Actions tab
Sync History tab
Data Inventory tab
Data Inventory pagination/search/filter behavior
Data Inventory problem-row discovery
Sync History large-run readability
Expanded SyncRunItem behavior
Daily Market Data latest status panel
Company Data latest status panel
No broken layout or overflow
```

Regression QA should verify:

```txt
Dashboard loads
Scanner loads
Scanner default US Stocks still works
Scanner universe selector still works
Scanner Drawer opens
Admin Sync Provider Tests render
No provider calls from Dashboard/Scanner/Drawer normal UI render paths
```

Automated checks:

```bash
npm run build
npx tsc --noEmit
npx prisma validate
npx prisma migrate status
```

---

## Documentation Update Checklist

Before requesting commit approval, check and update if needed:

```txt
Context/Features/admin-sync-feature-spec.md
Context/sync-workflows.md
Context/data-model.md
Context/project-overview.md
Context/current-feature.md
Context/feature-history.md
```

Only update files whose documented concepts changed.

The final implementation report must include:

```md
## Documentation Updates

Updated:
- ...

Checked but not updated:
- ...

Reason:
- ...

MD files changed:
- ...
```

---

## Reporting Requirements

Audit, implementation, QA, and final reports must be written in English only.

Do not commit without explicit user approval.
