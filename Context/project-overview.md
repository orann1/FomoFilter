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
| `/` | Implemented | Dashboard overview |
| `/scanner` | Implemented | Main stock discovery workspace |
| `/admin/sync` | Implemented | Manual data sync, provider tests, sync history, data inventory |
| Drawer from scanner/dashboard | Implemented but partly legacy | Stock preview / action workspace; cleanup planned in Phase 21C |

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
| Nasdaq 100 membership | Static fallback list |
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
| Universe Sync | Builds/refreshes Nasdaq 100 membership from static fallback list |
| Company Data Sync | Refreshes profile, industry, description, fundamentals, ratios, growth, analyst targets, recommendation counts |
| Daily Market Data Sync | Refreshes daily quote, price, daily change, volume, 52-week context, 50/200 averages |
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

Scanner is now a DB-backed decision view.

Implemented:

```txt
All Stocks default view
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

Next related work:

```txt
Phase 21C — Drawer Real Data & Decision Workspace Cleanup
```

---

## Known Legacy Area

The stock preview drawer still appears to contain legacy/mock-oriented sections such as:

```txt
Hot Score
Signal
AI Insight
Main Catalyst
Price Context mock chart
Watch Context legacy labels
Pullback/setup language
```

This is the active next cleanup area.

---

## Planned Roadmap

| Phase | Planned Focus |
| --- | --- |
| Phase 21C | Drawer Real Data & Decision Workspace Cleanup |
| Phase 21D | Dashboard Clarity Cleanup |
| Phase 21E | Data Inventory / Admin Data Health Cleanup |
| Phase 22 | Historical Daily + Momentum Foundation |
| Phase 23 | Momentum Indicators |
| Phase 24 | Hot Score v1 |
| Phase 25 | Alert Evaluation Engine |
| Phase 26 | Stock Details Page |
| Phase 27 | News / Catalyst Data Foundation |
| Phase 28 | AI Insight Generation |

---

## Documentation Update Rule

If this file becomes outdated because the product state or roadmap changes, update it after QA and before commit approval.
