# Current Feature — Phase 21E

## Active Phase

```txt
Phase 21E — Data Inventory / Admin Data Health Cleanup
```

## Status

Phase 21E complete. Committed and merged to main.

No active phase. Awaiting next phase definition.

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
Context/Features/market-data-sync-strategy.md
Context/data-model.md
Context/scoring-system.md
Context/Features/dashboard-feature-spec.md
```

Read only if needed:

```txt
Context/architecture.md
Context/feature-history.md
Context/Algorithms/fundamental-score-v1.md
Context/Algorithms/opportunity-score-v2.md
Context/Algorithms/analyst-rating-and-upside.md
Context/Features/scanner-feature-spec.md
Context/Features/drawer-feature-spec.md
```

---

## Goal

Clean up Admin Sync / Data Inventory so it becomes a clear operational data-health surface.

Admin Sync should help the user understand:

```txt
What data can I sync?
What provider/source is used?
Which DB tables are affected?
When was each data category last refreshed?
Is the data fresh enough for Scanner / Dashboard / Drawer?
What data coverage is missing?
Which production workflows are safe to run?
Which tools are developer/legacy only?
What was the last sync result?
```

The Data Inventory / Admin Data Health area should make data coverage and freshness easier to read without becoming a second Scanner.

---

## Product Role Split

```txt
Scanner Row      = fast comparison across stocks
Expanded Row     = detailed dry data view for deeper research
Drawer           = visual decision cockpit / decision workspace
Dashboard        = high-level overview and action surface
Admin Sync       = operational data health / sync control center
Data Inventory   = coverage, freshness, missing data, provider/source status
Stock Details    = future full research page
```

---

## Current Context

Phase 21D completed the Dashboard cleanup.

The next planned phase is:

```txt
Phase 21E — Data Inventory / Admin Data Health Cleanup
```

Admin Sync already has production concepts such as:

```txt
Sync Actions
Provider Tests
Sync History
Data Inventory
Score Methodology
```

Current production sync buttons include:

```txt
Sync Stock Universe
Sync Daily Market Data
Sync Company Data
Calculate Fundamental Scores
Calculate Opportunity Scores
```

Known planned cleanup goals:

```txt
Clean old labels
Align with FMP Starter strategy
Make data inventory easier to read
Separate production workflows from legacy/developer tools
Improve freshness/status terminology
```

---

## Current Problem / Expected Audit Focus

Before implementation, the actual repository state must be audited.

Potential issues to look for:

```txt
Old/legacy copy such as Finnhub quote legacy sync, FMP only for profile enrichment, Opportunity v1, Risk instead of Stability.
Production workflows mixed with developer/legacy tools.
Data Inventory too dense or too raw.
Freshness/status terminology unclear.
Provider/source labels inconsistent with FMP Starter strategy.
Score Methodology text outdated or inconsistent with Fundamental Score v1 / Opportunity Score v2.
SyncRun statuses or counts hard to understand.
Data Inventory duplicating Scanner or Dashboard instead of showing coverage/freshness.
Admin Sync UI showing plan-limited or legacy tools without clear labels.
```

---

## Scope

Phase 21E likely includes:

```txt
Audit the current Admin Sync page and Data Inventory.
Identify production workflows vs developer/legacy tools.
Clean Admin Sync labels and copy.
Clarify provider/source labels.
Clarify which workflow writes which DB models.
Improve Data Inventory readability.
Improve freshness/status terminology.
Improve Sync History readability if needed.
Improve Score Methodology copy only if it is stale or confusing.
Keep production sync workflows intact.
Preserve resumable/chunked sync behavior.
Update relevant documentation after QA.
```

---

## Non-Scope

Do not implement:

```txt
New provider integration
New paid provider endpoint usage
Historical price data
Historical charts
Momentum Score
Hot Score
FOMO Risk
News/catalyst foundation
AI insight generation
Alert evaluation engine
New DB schema unless explicitly approved after audit
New migrations unless explicitly approved after audit
New scoring formulas
New sync workflow behavior unless explicitly approved after audit
```

Do not change:

```txt
Provider responsibilities
Sync workflow ownership
Score formulas
Fundamental Score v1
Opportunity Score v2
DB schema
Prisma models
Existing production sync behavior
Existing SyncRun / SyncRunItem persistence
Existing progress/restart/resumable flows
```

No migration is expected for the first audit.

---

## Product Rules

Admin Sync must clearly separate:

```txt
Production workflows
Provider tests
Sync history
Data inventory / data health
Score methodology
Developer / legacy tools
```

Production workflows should stay focused on:

```txt
Universe Sync
Daily Market Data Sync
Company Data Sync
Score Calculation
```

Provider/source wording must be accurate:

```txt
Nasdaq 100 membership source = static fallback
Profile/fundamentals/ratios/growth/analyst targets = FMP
Analyst recommendation counts = Finnhub
Daily quote / 52W / averages = FMP
Scores = internal DB-only calculations
Watchlist / alerts = internal DB
```

Data Inventory should show:

```txt
Coverage
Freshness
Missing data
Provider/source
Sync status
Score version
```

Data Inventory should not become:

```txt
A second Scanner
A stock discovery table
A dashboard duplicate
A raw debug-only dump
```

---

## First Required Step

Start with an Audit / Planning task only.

Reason:

```txt
Admin Sync touches sync workflows, provider labels, SyncRun history, data inventory, and score methodology.
The exact current repo state must be verified before any implementation.
```

The first Claude task must not change code or docs.

After the audit report, the Product Lead will decide the implementation scope and write a separate implementation prompt.

---

## Audit Questions

The audit should answer:

```txt
What Admin Sync tabs/sections currently exist?
Which sections are production workflows?
Which sections are provider tests?
Which sections are developer/legacy tools?
Which labels/copy are stale or inaccurate?
Which data-source labels are wrong or unclear?
Does the UI still reference old provider responsibilities?
Does the UI still reference Opportunity v1 or Risk when it should say Opportunity v2 / Stability?
Does Data Inventory clearly show coverage, freshness, missing data, source, sync status, and score version?
Does Data Inventory duplicate Scanner/Dashboard?
Does Score Methodology match current scoring docs?
Does Sync History clearly show status, provider/source, counts, failures/skips, and elapsed time?
Are progress panels and resumable behavior preserved and clear?
Are there any provider calls from normal UI render paths?
What implementation changes are recommended?
What files are likely to change?
What documentation updates will likely be needed?
```

---

## Expected Implementation Direction After Audit

Implementation is likely to focus on:

```txt
Admin Sync copy cleanup
Production vs legacy/developer grouping
Data Inventory readability
Freshness/source/status terminology
Score Methodology text alignment
Minor UI layout improvements
Documentation updates
```

Implementation should avoid:

```txt
Schema changes
Provider changes
Sync orchestration changes
Scoring formula changes
Large refactors
```

---

## Acceptance Criteria For Final Phase Completion

Phase 21E will be complete when:

```txt
Admin Sync clearly separates production workflows, provider tests, sync history, data inventory, score methodology, and legacy/developer tools.
All production sync copy accurately reflects current provider/source responsibilities.
Data Inventory is easier to read and focused on data health.
Data Inventory shows coverage, freshness, missing data, source/provider, sync status, and score version where available.
Data Inventory does not behave like a second Scanner.
Score Methodology accurately reflects Fundamental Score v1 and Opportunity Score v2.
Old/stale labels are removed or clearly marked as legacy/developer only.
Risk is not used as a user-facing score label where Stability is intended.
Opportunity v1 is not presented as current production scoring.
Progress panels and resumable sync behavior remain intact.
Provider tests remain non-mutating.
No provider calls are added to normal UI render paths.
No schema change or migration occurs unless explicitly approved.
No score formula changes occur.
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
Provider Tests tab
Sync History tab
Data Inventory tab
Score Methodology tab
Production workflow labels and descriptions
Developer/legacy tool labeling
Progress panel behavior if visible
Sync history table readability
Data Inventory readability
Data freshness/source/status labels
Score Methodology current formulas
No old user-facing Risk label where Stability is intended
No Opportunity v1 displayed as current score
No broken layout or overflow
```

Regression QA should verify:

```txt
Dashboard loads
Scanner loads
Scanner Drawer opens
Admin Sync loads
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
Context/Features/market-data-sync-strategy.md
Context/scoring-system.md
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
