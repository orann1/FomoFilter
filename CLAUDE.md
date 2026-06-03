# CLAUDE.md — FomoFilter AI Entry Point

## Project

**FomoFilter** is a DB-backed stock scanner, watchlist, alert, scoring, and decision-support platform.

The app helps active investors discover, rank, inspect, and track stocks using synced market data, fundamentals, analyst data, internal scores, watchlist state, and alerts.

FomoFilter is a **research and decision-support tool**, not a financial advisor.

---

## Required Reading Order

Before implementing any feature or fix, read these files in this order:

1. `Context/README.md`
2. `Context/project-overview.md`
3. `Context/current-feature.md`
4. `Context/coding-standards.md`
5. `Context/ai-interaction.md`

Then read only the focused files that are relevant to the task. Use `Context/README.md` as the routing map.

---

## Commands

```bash
npm run dev
npm run build
npm run start
npm run lint
npx tsc --noEmit
npx prisma validate
npx prisma migrate status
```

Dev server runs at:

```txt
http://localhost:3000
```

---

## Core Architecture Rule

Normal UI render paths must read from the database only.

Do not call external market-data providers from:

```txt
Scanner
Dashboard
Drawer
Stock display components
```

Provider calls belong in:

```txt
Admin sync workflows
Future scheduled jobs
Explicit approved enrichment flows with DB persistence
```

---

## Documentation Maintenance Protocol

Before requesting commit approval, check whether the implementation changed any documented concept.

If yes, update the relevant Markdown documentation after QA passes and before asking for commit approval.

Implementation is not ready for commit until documentation impact was checked.

If documentation should be updated and the user did not ask for it, proactively mention it.

Use this map:

```txt
Prisma schema changed → Context/data-model.md
Sync workflow changed → Context/sync-workflows.md
Provider responsibility changed → Context/Features/market-data-sync-strategy.md
Architecture / data flow changed → Context/architecture.md
Scanner behavior changed → Context/Features/scanner-feature-spec.md
Drawer behavior changed → Context/Features/drawer-feature-spec.md
Dashboard behavior changed → Context/Features/dashboard-feature-spec.md
Admin Sync behavior changed → Context/Features/admin-sync-feature-spec.md
Fundamental Score changed → Context/Algorithms/fundamental-score-v1.md
Opportunity Score changed → Context/Algorithms/opportunity-score-v2.md
Analyst rating/upside changed → Context/Algorithms/analyst-rating-and-upside.md
Decision tags changed → Context/Algorithms/scanner-decision-tags.md
Phase completed → Context/feature-history.md
New active phase started → Context/current-feature.md
```

---

## Commit Rule

Do not commit without explicit approval.

Before asking for commit approval, return:

```txt
Build result
TypeScript result
Prisma validate result
Prisma migrate status result
Browser QA result
Documentation update result
Changed files list
Known issues
```

Never include “Generated with Claude” or similar text in commit messages.
