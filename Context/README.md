# Context README — FomoFilter Documentation Map

## Purpose

This file routes AI coding agents to the smallest relevant context files.

Do not read every Markdown file by default.

Read only:

```txt
1. Core files required for every task
2. Focused feature/spec/algorithm files related to the change
3. Feature history only when historical context is needed
```

---

## Required For Every Task

| File | Purpose |
| --- | --- |
| `Context/project-overview.md` | Product identity, implemented state, roadmap |
| `Context/current-feature.md` | Active phase and task requirements |
| `Context/coding-standards.md` | TypeScript, React, Next.js, Tailwind, Prisma rules |
| `Context/ai-interaction.md` | AI workflow, QA, commit, and docs protocol |

---

## Read Only When Relevant

| You are changing... | Read before implementation | Update after QA if changed |
| --- | --- | --- |
| Scanner table, filters, pagination, expanded row, mobile cards | `Context/Features/scanner-feature-spec.md` | same file |
| Drawer / stock preview panel | `Context/Features/drawer-feature-spec.md` | same file |
| Dashboard | `Context/Features/dashboard-feature-spec.md` | same file |
| Admin Sync UI or admin workflows | `Context/Features/admin-sync-feature-spec.md` | same file |
| Opportunity Radar / market discovery page | `Context/Features/opportunity-radar-feature-spec.md` | same file |
| Market data providers or provider responsibilities | `Context/Features/market-data-sync-strategy.md` | same file |
| Sync routes / sync cadence / SyncRun behavior | `Context/sync-workflows.md` | same file |
| Prisma schema / DB ownership | `Context/data-model.md` | same file |
| App architecture / data flow | `Context/architecture.md` | same file |
| Fundamental Score | `Context/scoring-system.md` and `Context/Algorithms/fundamental-score-v1.md` | both files if behavior changed |
| Opportunity Score | `Context/scoring-system.md` and `Context/Algorithms/opportunity-score-v2.md` | both files if behavior changed |
| Analyst target/upside/rating logic | `Context/Algorithms/analyst-rating-and-upside.md` | same file |
| Decision Tag / Strengths / Concerns | `Context/Algorithms/scanner-decision-tags.md` | same file |
| Past implementation details | `Context/feature-history.md` | only append completed phase summaries |

---

## Documentation Maintenance Protocol

Before requesting commit approval:

1. Check whether the change affects any documented concept.
2. If yes, update the relevant Markdown file.
3. If no, state why no documentation update was needed.
4. Include a `Documentation Updates` section in the final report.

Required report section:

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

## File Responsibilities

### Core

| File | Responsibility |
| --- | --- |
| `CLAUDE.md` | Root entry point and command list |
| `Context/README.md` | Documentation routing map |
| `Context/project-overview.md` | Current product and roadmap |
| `Context/current-feature.md` | Active phase only |
| `Context/feature-history.md` | Completed phases only |
| `Context/coding-standards.md` | Coding rules |
| `Context/ai-interaction.md` | AI workflow rules |

### Architecture / Data

| File | Responsibility |
| --- | --- |
| `Context/architecture.md` | App architecture and data flow |
| `Context/data-model.md` | Actual Prisma model ownership |
| `Context/sync-workflows.md` | Universe, company, daily, score sync workflows |
| `Context/scoring-system.md` | Score index and links to algorithm docs |

### Features

| File | Responsibility |
| --- | --- |
| `Context/Features/scanner-feature-spec.md` | Scanner product/UX/behavior spec |
| `Context/Features/drawer-feature-spec.md` | Drawer decision workspace spec |
| `Context/Features/dashboard-feature-spec.md` | Dashboard spec |
| `Context/Features/admin-sync-feature-spec.md` | Admin Sync spec |
| `Context/Features/opportunity-radar-feature-spec.md` | Opportunity Radar market discovery spec |
| `Context/Features/market-data-sync-strategy.md` | Provider strategy |

### Algorithms

| File | Responsibility |
| --- | --- |
| `Context/Algorithms/fundamental-score-v1.md` | Fundamental Score formula |
| `Context/Algorithms/opportunity-score-v2.md` | Opportunity Score v2 formula |
| `Context/Algorithms/analyst-rating-and-upside.md` | Analyst target/upside/rating mapping |
| `Context/Algorithms/scanner-decision-tags.md` | Decision tags, strengths, concerns |

---

## Context Discipline

Keep files focused.

Avoid turning any file into a general archive.

`current-feature.md` must stay short and active-task focused.

`feature-history.md` stores completed phase summaries and should be read only when needed.
