# Dashboard Feature Specification — FomoFilter

## When To Read This File

Read this file before changing:

```txt
Dashboard route
Dashboard summary cards
Dashboard top stock tables
Dashboard data health/freshness cards
Dashboard widgets
Dashboard layout
```

---

## When To Update This File

Update this file after QA and before commit approval if Dashboard behavior, layout, data source, metrics, cards, or copy changes.

---

## Current Dashboard Role

The Dashboard should provide a high-level overview, not replace the Scanner.

It should answer:

```txt
Is the data fresh?
How healthy is the current dataset?
Which stocks are most interesting at a glance?
Where are the biggest opportunities?
What needs attention?
```

---

## Current Route

```txt
/
```

---

## Current Data Source

Dashboard should read DB-backed data through server loaders.

It must not call providers from render paths.

---

## Current Implemented Concepts

Dashboard currently includes DB-backed concepts such as:

```txt
Market/data summary cards
Average Opportunity
High Opportunity count
Rating / target coverage
Top Analyst Upside stocks
Top Fundamental stocks
Watchlist widgets
Recent alerts widgets
Data freshness warnings
```

Some early dashboard/mock sections may still exist and should be audited during Dashboard cleanup.

---

## Recommended Dashboard Structure

Future cleanup should organize Dashboard around:

```txt
Data Health
Scanner Readiness
Top Opportunity Stocks
Top Analyst Upside Stocks
Top Fundamental Stocks
Watchlist Summary
Sync Freshness / Warnings
Sector Summary
Recent Alerts
```

---

## What Dashboard Should Not Be

Dashboard should not become:

```txt
A second Scanner table
A raw data inventory
A debug-only admin page
A mock AI insight page
```

Detailed row-level analysis belongs in:

```txt
Scanner
Drawer
Future stock details page
```

Admin/data coverage belongs in:

```txt
Admin Sync / Data Inventory
```

---

## Current Known Cleanup Need

Planned:

```txt
Phase 21D — Dashboard Clarity Cleanup
```

Likely goals:

```txt
Remove stale/mock copy
Align labels with Opportunity v2 and Stability
Make top cards more decision-oriented
Separate data health from stock opportunity
Improve freshness warnings
Avoid duplicate tables
```

---

## Related Docs

```txt
Context/project-overview.md
Context/scoring-system.md
Context/sync-workflows.md
Context/data-model.md
Context/Features/scanner-feature-spec.md
```
