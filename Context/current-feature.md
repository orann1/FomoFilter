# Current Feature — Phase 21C

## Active Phase

```txt
Phase 21C — Drawer Real Data & Decision Workspace Cleanup
```

## Status

Not Started

---

## Required Reading

Always read:

```txt
Context/README.md
Context/project-overview.md
Context/current-feature.md
Context/coding-standards.md
Context/ai-interaction.md
```

For this phase, also read:

```txt
Context/Features/drawer-feature-spec.md
Context/Features/scanner-feature-spec.md
Context/scoring-system.md
Context/data-model.md
```

Read only if needed:

```txt
Context/feature-history.md
Context/architecture.md
Context/sync-workflows.md
Context/Algorithms/scanner-decision-tags.md
Context/Algorithms/opportunity-score-v2.md
```

---

## Goal

Refactor the stock preview drawer from a legacy/mock-style preview into a real DB-backed **Stock Decision Workspace**.

The drawer should align with the cleaned Scanner language and use real persisted data.

---

## Current Problem

The drawer appears to still contain legacy/mock-oriented sections such as:

```txt
Hot Score
Signal
AI Insight
Main Catalyst
Price Context mock chart
Watch Context
Pullback/setup labels
FOMO risk
Entry context
```

These concepts do not match the current DB-backed Scanner and scoring model.

---

## Product Principle

The drawer should answer:

```txt
Should I investigate this stock further?
Why is this stock interesting?
What are the main strengths?
What are the main concerns?
What do analysts think?
Is valuation reasonable?
Where is the stock trading relative to its range?
Is the data fresh?
What actions can I take?
```

It should not present mock AI/catalyst/hot-score content as real.

---

## Scope

Phase 21C includes:

```txt
Audit drawer data sources
Remove or replace mock/legacy drawer sections
Use real DB-backed stock data
Align drawer labels with Scanner:
  - Opportunity
  - Fundamental
  - Valuation
  - Stability
  - Analyst Upside
  - Rating
  - Decision Tag
Add/clean sections:
  - Header
  - Decision Snapshot
  - Company Snapshot
  - Our Calculated Scores
  - Analyst View
  - Valuation & Fundamentals
  - Market Position
  - Watchlist / Alert Context
  - Data Freshness
  - Actions Footer
Preserve real watchlist and alert actions
Add tooltips to important drawer metrics
Verify responsive drawer layout
```

---

## Non-Scope

Do not implement:

```txt
New provider calls
AI generation
News/catalyst APIs
Historical candles
Historical charts
Momentum Score
Hot Score
FOMO Risk engine
Technical indicators
New stock details page
Dashboard cleanup
Admin Sync cleanup
```

Do not change:

```txt
DB schema unless explicitly approved
Scoring formulas
Opportunity Score v2
Fundamental Score
Provider responsibilities
Sync workflows
```

No migration is expected.

---

## Required Drawer Audit

Before redesigning, inspect the drawer files and report:

```txt
Which drawer fields come from real DB data?
Which fields come from mock-data.ts?
Which fields are legacy and should be removed?
Which actions are real and should be preserved?
```

Search for:

```txt
Hot Score
hotScore
Opp Score
oppScore
Signal
AI Insight
Main Catalyst
FOMO
Pullback Watch
Price Context
Watch Context
setup
catalyst
entry
```

---

## Target Drawer Structure

```txt
Header
Decision Snapshot
Company Snapshot
Our Calculated Scores
Analyst View
Valuation & Fundamentals
Market Position
Watchlist / Alert Context
Data Freshness
Actions Footer
```

Only show real DB-backed sections.

If data is missing, show a clear empty state or hide the section.

---

## Acceptance Criteria

Phase 21C is complete when:

```txt
Drawer no longer presents mock/legacy AI/catalyst/hot-score content as real.
Drawer uses real DB-backed stock data.
Drawer language matches Scanner.
Company Snapshot shows real description when available.
Calculated scores match Scanner/expanded row.
Analyst data matches Scanner/expanded row.
Market position uses real quote/52W/average data.
Watchlist and Alert states/actions still work.
Data freshness is visible.
Tooltips exist for important metrics.
Drawer layout is readable and responsive.
No new provider calls are added.
No scoring formulas are changed.
No unnecessary migration is added.
Scanner pagination/search/filter/sort remain working.
Dashboard/Admin still load.
Build passes.
TypeScript passes.
Prisma validates.
Migration status is clean.
```

---

## QA Requirements

Browser QA must open drawer for:

```txt
ADBE
NVDA
NFLX
GOOG
TSLA
CHTR
```

Confirm:

```txt
Header shows real stock data
Decision Snapshot is rule-based/real
Company Snapshot uses DB description
Scores match Scanner/expanded row
Analyst View matches Scanner/expanded row
Valuation/Fundamental metrics match expanded row
Market Position uses real quote/52W/average data
Watchlist/Alert state is real
No mock/legacy sections remain
No overflow or clipped text
Footer actions work
Opening another stock updates drawer data
Drawer does not show stale previous stock data
```

Regression QA:

```txt
Scanner pagination works
Search works
Sort works
Quick filters work
Advanced filters work
Expanded row works
Dashboard loads
Admin Sync loads
No provider calls from drawer/scanner
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
Context/Features/drawer-feature-spec.md
Context/Features/scanner-feature-spec.md
Context/data-model.md
Context/scoring-system.md
Context/feature-history.md
```

If no documentation update is needed, explain why in the final report.

The final implementation report must include:

```md
## Documentation Updates

Updated:
- ...

Checked but not updated:
- ...

Reason:
- ...
```

---

## Reporting Requirements

Return implementation and QA reports in English only.

Do not commit without explicit user approval.
