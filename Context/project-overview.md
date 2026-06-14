# FomoFilter Project Overview

## When To Read This File

Read this file at the start of every feature or fix to understand:

```txt
What FomoFilter is
What is already implemented
What is still legacy
Where the product is going next
```

Do not use this file for detailed algorithms, schema, or implementation steps. Use the focused docs referenced below.

---

## Product Identity

| Field | Value |
| --- | --- |
| Name | FomoFilter |
| Product type | Stock scanner, decision-support, watchlist, alerts, and scoring platform |
| Main users | Active retail investors, swing traders, growth investors, high-risk/high-reward investors |
| Core promise | Find interesting stocks, understand why they are interesting, and decide whether they are worth tracking |
| Product boundary | Research and decision support only; not financial advice |

Use cautious language:

```txt
Worth tracking
Potential opportunity
High-risk setup
Requires further validation
Analyst upside remains attractive
```

Avoid:

```txt
Buy now
Guaranteed upside
Safe investment
Will go up
```

---

## Current Implemented State

### Core App

```txt
Next.js App Router
TypeScript
Tailwind CSS v4
Prisma ORM
PostgreSQL / Neon
DB-backed dashboard and scanner
Admin sync workflows
Watchlist and alert rules
```

### Main Routes

| Route | Status | Purpose |
| --- | --- | --- |
| `/` | Implemented | Dashboard — high-level overview and action surface |
| `/scanner` | Implemented | Main stock discovery workspace |
| `/admin/sync` | Implemented | Manual data sync, provider tests, sync history, data inventory |
| Drawer from Scanner | Implemented | Visual decision cockpit — rule-based narrative, signal cards, watchlist/alert actions |
| `/opportunity-radar` | Implemented (Phase 23A) | AI-style market discovery surface — Lens-based mock experience with Opportunity Deck and Intel Brief. No AI/DB/providers in Phase 23A. |

---

## Current Data Architecture

Normal UI reads from the database only.

```txt
External providers / static sources
→ Admin sync workflows
→ Database
→ Dashboard / Scanner / Drawer
```

No provider calls should happen from normal UI render paths.

### Current Provider Roles

| Area | Current Source |
| --- | --- |
| Nasdaq 100 membership | Static fallback list (100 symbols) |
| S&P 500 membership | Best-effort static fallback list (499 unique symbols, Phase 22B) |
| Company profile | FMP |
| Company fundamentals / ratios / growth | FMP |
| Analyst target consensus | FMP |
| Analyst recommendation counts | Finnhub |
| Daily quote / price / volume / 52-week context | FMP |
| Scores | Internal calculations from DB data |

---

## Current Sync Workflows

| Workflow | Role |
| --- | --- |
| Nasdaq 100 Universe Sync | Builds/refreshes Nasdaq 100 membership from static fallback list. Enriches new stocks via FMP profile. |
| S&P 500 Universe Sync | Builds/refreshes S&P 500 membership from best-effort static fallback list (499 symbols, Phase 22B). Membership only — no provider profile calls. |
| Company Data Sync | Refreshes profile, industry, description, fundamentals, ratios, growth, analyst targets, and recommendation counts for all unique active universe stocks (deduplicated). |
| Daily Market Data Sync | Refreshes daily quote, price, daily change, volume, 52-week context, and 50/200 averages for all unique active universe stocks (deduplicated). |
| Calculate Fundamental Scores | Internal DB-only score calculation |
| Calculate Opportunity Scores | Internal DB-only Opportunity Score v2 calculation |
| Provider Tests | Validates API connectivity without writing app data |
| Legacy / Developer Tools | Older fallback tools that should not be treated as production workflows |

---

## Current Scores

| Score | Status | Source |
| --- | --- | --- |
| Fundamental Score v1 | Implemented | Internal calculation from StockMetric and related DB data |
| Opportunity Score v2 | Implemented | Internal calculation using fundamentals, valuation, growth, analyst upside/sentiment, price position, stability |
| Analyst Rating stars | Implemented in UI | Derived from stored recommendation data |
| Decision Tag | Implemented in Scanner expanded row | Rule-based UI tag |
| Hot Score | Legacy/mock concept | Not current production score |
| Momentum Score | Future | Requires historical candles |
| FOMO Risk | Future | Requires momentum/heat/catalyst logic |

For formulas, read:

```txt
Context/scoring-system.md
Context/Algorithms/fundamental-score-v1.md
Context/Algorithms/opportunity-score-v2.md
Context/Algorithms/analyst-rating-and-upside.md
Context/Algorithms/scanner-decision-tags.md
```

---

## Current Scanner State

Scanner is now a DB-backed decision view supporting multi-universe selection.

Implemented:

```txt
US Stocks default view (all unique active stocks across all synced universes)
Universe selector: US Stocks / Nasdaq 100 / S&P 500 (selectable)
No duplicate rows for symbols in multiple universes
Opportunity Score default sort
Pagination: 10 / 20 / 50 / 100
Search/filter/sort before pagination
Quick filters
Advanced filters
Clear filters
Active sort column highlight
Score bars
Analyst rating stars
Risk renamed to Stability in UI
Expanded row with:
  - Decision Tag
  - Strengths / Concerns
  - Company Snapshot
  - Our Calculated Scores
  - Analyst View
  - Valuation Metrics
  - Growth & Profitability
  - Financial Health
  - Market Position
  - Data Freshness
```

---

## Planned Roadmap

| Phase | Status | Focus |
| --- | --- | --- |
| Phase 21A | Completed | Scanner Decision View Cleanup |
| Phase 21B | Completed | Scanner Pagination, Table Usability & Expanded Row Cleanup |
| Phase 21C | Completed | Drawer Real Data & Decision Workspace Cleanup |
| Phase 21D | Completed | Dashboard Clarity Cleanup |
| Phase 21E | Completed | Data Inventory / Admin Data Health Cleanup |
| Phase 22B | Completed | Multi-Universe Unique Sync Foundation + S&P 500 Expansion |
| Phase 22C | Completed | Data Inventory pagination / sync hardening |
| Phase 23A | Completed | Opportunity Radar Mock Experience — Lens-based discovery with 4 lenses, 3-card Opportunity Deck, Intel Brief. Visual product direction validated. |
| Phase 23B | Completed | Opportunity Radar AI Agent Design — spec completed; provider/model research decision documented (Phase 23B-2); prompt and output schema drafted (Phase 23B-3). Claude Sonnet 4.6 primary, GPT 5.4 fallback. Design/docs only; no implementation. |
| Phase 23C-1B | Completed | Opportunity Radar DB Persistence Schema — RadarScan, RadarCandidate, RadarEvidence models added. Migration created and applied. No Admin scan button or AI execution yet. |
| Phase 23C-2A | Completed | Opportunity Radar Output Validation + DB Persistence From Fixture — Validation function, persistence function, sample fixture, QA script. Fixture-only, no external AI/provider calls. |
| Phase 23C-2B | Completed | Opportunity Radar Admin Scan Button + Fixture Execution — Admin UI button in Sync Actions tab triggers fixture validation and persistence. Fixture-only, no real AI/provider calls yet. |
| Phase 23C-2C | Completed | Opportunity Radar Claude Provider Adapter + Controlled Admin Execution — Real Claude Sonnet 4.6 API execution server-side, DB-backed context (controlled source pack mode), validation gatekeeper, clear error handling, Admin UI distinction |
| Phase 23C-3 | Completed | Opportunity Radar DB Reader — /opportunity-radar page reads persisted DB scan results; time window filtering; source mode labeling; no mock data by default. |
| Phase 24B-0 | In Planning | Opportunity Radar Product Rework Spec — Planning phase documenting new scan-based research signal tracker direction (replacing Phase 23A lens-based concept). No implementation yet. Next: Phase 24B-1 (schema + output contract). |
| Phase 24A-3 | Planned | Scheduled Daily Scan — automation and monitoring for Opportunity Radar |
| Phase 24B-1+ | Planned | Opportunity Radar Rework Implementation — Data model, prompt, UI, and feature implementation phases (24B-1 through 24B-4+). |
| Phase 24 | Planned | Historical Daily + Momentum Foundation (after Opportunity Radar direction is finalized) |
| Phase 25 | Planned | Momentum Indicators |
| Phase 26 | Planned | Hot Score v1 |
| Phase 27 | Planned | Alert Evaluation Engine |
| Phase 28 | Planned | Stock Details Page |
| Phase 29 | Planned | News / Catalyst Data Foundation |

---

## Documentation Update Rule

If this file becomes outdated because the product state or roadmap changes, update it after QA and before commit approval.
