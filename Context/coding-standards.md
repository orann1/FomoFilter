# Coding Standards — FomoFilter

## When To Read This File

Read this file before every implementation task.

This file defines the baseline coding, architecture, database, UI, testing, and reporting rules for FomoFilter.

---

## When To Update This File

Update this file after QA and before commit approval if you change:

```txt
Core coding conventions
TypeScript standards
React / Next.js conventions
Prisma / migration rules
Project file organization
Testing/check requirements
Documentation maintenance rules
```

Do not update this file for one-off feature behavior changes. Update the relevant feature/spec/algorithm file instead.

---

## Core Principles

```txt
Keep changes focused.
Prefer small, reviewable diffs.
Do not refactor unrelated areas.
Do not add features outside the active spec.
Do not add dependencies without approval.
Do not commit without explicit user approval.
```

FomoFilter is a research and decision-support tool. Avoid wording or UI behavior that implies direct financial advice.

---

## TypeScript Rules

Use strict TypeScript.

Rules:

```txt
Avoid `any`.
Prefer explicit types for shared data contracts.
Prefer normalized plain objects for UI data.
Do not expose Prisma model complexity directly to client components.
Use null intentionally for missing optional data.
Do not treat missing financial values as 0 unless explicitly required by the algorithm.
Keep utility functions typed.
Keep Server Action/API responses typed and structured.
```

Preferred response shape:

```ts
type ActionResult<T> = {
  success: boolean;
  data?: T;
  error?: string;
};
```

---

## React / Next.js Rules

The project uses:

```txt
Next.js App Router
React
TypeScript
Tailwind CSS v4
```

### Server Components

Use Server Components by default for:

```txt
Page-level data loading
Dashboard initial data
Scanner initial data
Admin initial data
Static/mostly read-only sections
```

### Client Components

Use Client Components only for interactivity:

```txt
Scanner search/filter/sort/pagination
Expanded row state
Drawer open/close state
Forms
Watchlist/alert action panels
Mobile menus
Interactive controls
```

Rules:

```txt
Do not import Prisma in Client Components.
Do not call provider APIs from Client Components.
Do not move server-only logic into client code.
Keep UI components presentation-focused where possible.
```

---

## Data Access Rules

Prisma access is allowed only in server-side code:

```txt
src/lib/data/*
src/actions/*
app/api/* route handlers
prisma/seed.ts
```

Do not access Prisma from:

```txt
Client components
UI-only components
Browser utilities
Shared utilities imported by client components
```

Normal UI render paths must read from the database.

Do not call external market-data providers from:

```txt
Scanner
Dashboard
Drawer
Stock display components
```

Provider calls belong in:

```txt
Admin Sync workflows
Future scheduled jobs
Provider tests
Explicit approved enrichment flows with DB persistence
```

---

## Market Data / Provider Rules

Provider clients should live under:

```txt
src/lib/market-data/providers/*
```

Provider composition should happen in:

```txt
Admin sync route handlers
Server-side sync orchestration code
```

Rules:

```txt
Do not overwrite valid DB values with null/empty provider values.
Do not invent values when providers do not return them.
Store provider/source attribution where relevant.
Store timestamps/freshness where relevant.
Handle known provider plan limitations as skipped/limited, not app failures.
```

---

## Prisma / Migration Rules

If schema changes are needed:

```txt
Use Prisma migrations.
Do not use `prisma db push`.
Do not manually edit applied migrations.
Do not add a migration unless the active task explicitly approves it or the user approves it after investigation.
```

Required commands after schema changes:

```bash
npx prisma validate
npx prisma migrate status
npm run build
npx tsc --noEmit
```

After a schema change, update:

```txt
Context/data-model.md
Any affected feature/spec docs
Context/feature-history.md after phase completion
```

---

## Sync Workflow Rules

Sync workflows should have clear ownership.

Current production ownership:

```txt
Universe Sync → Stock / StockUniverse / StockUniverseMember
Company Data Sync → Stock / StockMetric / StockAnalystData
Daily Market Data Sync → StockQuote
Score Calculation → StockScore
```

Do not mix responsibilities without explicit approval.

Examples:

```txt
Daily Market Data Sync should not write StockMetric.
Company Data Sync should not write StockQuote.
Score calculations should not call providers.
Scanner/Dashboard/Drawer should not call providers.
```

---

## Scoring Rules

Scoring logic must be deterministic and DB-backed.

Rules:

```txt
No provider calls during score calculation.
Do not change score formulas unless explicitly scoped.
Do not silently change component weights.
Do not relabel score meanings without updating docs and UI methodology.
Do not display future/mock scores as production scores.
```

If scoring changes, update:

```txt
Context/scoring-system.md
Relevant Context/Algorithms/*.md file
Admin Score Methodology UI if affected
```

Current production scores:

```txt
Fundamental Score v1
Opportunity Score v2
Analyst Rating Stars
Decision Tag
```

---

## UI / Tailwind Rules

The project uses Tailwind CSS v4.

Rules:

```txt
Preserve the dark UI style.
Prefer readable labels over unclear abbreviations.
Use tooltips for financial metrics and calculated scores.
Avoid over-dense layouts.
Use responsive layouts and avoid overflow.
Use N/A for missing values, not 0.
Do not show mock data as real.
Keep cards/tables readable on desktop and mobile.
```

For financial metrics:

```txt
Use clear labels.
Explain whether higher is better.
Explain if the value is internal/app-calculated or provider/raw.
```

Use UI language consistently:

```txt
Opportunity
Fundamental
Valuation
Stability
Analyst Upside
Rating
Decision Tag
```

Avoid old/unclear user-facing labels:

```txt
Opp.
Fund.
Risk
Hot Score
FOMO Risk
Signal
```

unless explicitly implementing those as real current features.

---

## File Organization Rules

Use these locations:

```txt
src/lib/data/*                         server-side data loaders
src/lib/market-data/providers/*        provider clients
src/lib/scoring/*                      scoring logic
src/actions/*                          Server Actions
app/api/*                              API routes / sync routes
src/components/scanner/*               Scanner UI
src/components/admin/*                 Admin UI
src/components/*                       shared or higher-level components
Context/*                              project documentation
```

Do not create duplicate utility/helper files when an existing one can be safely reused.

Before adding a new file, check if a nearby existing file already owns that responsibility.

---

## Error Handling Rules

Use clear error handling.

Rules:

```txt
Return useful error messages.
Do not swallow errors silently.
Do not expose API keys/secrets.
Do not log sensitive values.
For sync workflows, record useful SyncRun/SyncRunItem messages.
For provider limitations, classify the limitation accurately.
```

For UI:

```txt
Show N/A for missing data.
Show helpful empty states.
Avoid broken/blank cards.
Do not show misleading fallback values.
```

---

## Testing / Validation Rules

Run these before requesting commit approval:

```bash
npm run build
npx tsc --noEmit
npx prisma validate
npx prisma migrate status
```

Run browser QA for:

```txt
Scanner UI changes
Drawer UI changes
Dashboard UI changes
Admin Sync UI changes
Pagination/search/filter changes
Watchlist/alert action changes
```

Browser QA should include:

```txt
Initial load
Main workflow
Edge/empty states
Regression of nearby features
Mobile check when relevant
```

---

## Documentation Maintenance Rule

Before requesting commit approval, check whether the implementation changed any documented concept.

If yes, update the relevant Markdown file after QA and before asking for commit approval.

If documentation should be updated and the user did not request it, proactively mention it.

Implementation is not ready for commit until documentation impact has been checked.

Use the routing map in:

```txt
Context/README.md
Context/ai-interaction.md
```

Common updates:

```txt
Schema changed → Context/data-model.md
Sync changed → Context/sync-workflows.md
Provider changed → Context/Features/market-data-sync-strategy.md
Scanner changed → Context/Features/scanner-feature-spec.md
Drawer changed → Context/Features/drawer-feature-spec.md
Score changed → Context/scoring-system.md + relevant Algorithm doc
Phase completed → Context/feature-history.md
```

---

## Reporting Rules

Implementation reports must be written in English only.

Every report should include:

```txt
Files inspected
Files changed
Implementation summary
QA results
Automated check results
Documentation Updates
Known issues
Ready for commit or not
```

Required section:

```md
## Documentation Updates

Updated:
- ...

Checked but not updated:
- ...

Reason:
- ...
```

If no documentation update was needed, state why.

---

## Commit Rule

Do not commit without explicit user approval.

Before asking for commit approval, provide:

```txt
Git status summary
Changed files list
QA result
Automated checks
Documentation update result
Known issues
```

Never include generated-by-AI signatures in commits.
