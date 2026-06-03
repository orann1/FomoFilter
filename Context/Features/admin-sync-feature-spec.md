# Admin Sync Feature Specification — FomoFilter

## When To Read This File

Read this file before changing:

```txt
/admin/sync page
Sync Actions tab
Provider Tests tab
Sync History tab
Data Inventory tab
Score Methodology tab
Admin sync text/copy
Sync progress panels
SyncRun display labels
```

---

## When To Update This File

Update this file after QA and before commit approval if Admin Sync behavior, copy, tabs, workflow grouping, or sync status display changes.

---

## Admin Sync Role

Admin Sync is the operational control center for market data and scoring.

It should clearly answer:

```txt
What data can I sync?
What provider/source is used?
How often should I run it?
What DB tables are affected?
What was the last result?
Is the data fresh enough?
```

---

## Current Main Sections

### Sync Actions

Production-oriented workflows:

```txt
Universe Sync
Daily Market Data Sync
Company Data Sync
Score Calculation
```

Legacy/developer tools should be separated from production workflows.

### Provider Tests

Purpose:

```txt
Validate provider/API access without writing app data.
```

### Sync History

Purpose:

```txt
Show SyncRun / SyncRunItem history.
```

### Data Inventory

Purpose:

```txt
Show DB coverage, missing data, freshness, and source status.
```

### Score Methodology

Purpose:

```txt
Document the calculation logic used by current scores.
```

---

## Current Production Sync Buttons

| Button | Role |
| --- | --- |
| Sync Stock Universe | Refresh static fallback Nasdaq 100 universe membership |
| Sync Daily Market Data | Refresh FMP quote data |
| Sync Company Data | Refresh FMP/Finnhub company, metrics, analyst data |
| Calculate Fundamental Scores | Internal DB-only scoring |
| Calculate Opportunity Scores | Internal DB-only Opportunity Score v2 |

---

## Copy Rules

Admin text must be accurate.

Do not use old/legacy copy like:

```txt
Finnhub quote legacy sync
FMP only for profile enrichment
Opportunity v1
Risk score if UI now says Stability
```

unless specifically describing history or legacy tools.

---

## Progress / History Rules

Preserve:

```txt
Progress panels
Continue/restart flows
Elapsed time
Requested/processed/succeeded/skipped/failed counts
SyncRun records
SyncRunItem records
```

Do not remove existing resumable behavior without approval.

---

## Score Methodology Rules

If a score formula changes:

```txt
Update Score Methodology tab
Update relevant Algorithm MD file
Update Context/scoring-system.md
```

Current formulas:

```txt
Fundamental Score v1
Opportunity Score v2
```

---

## Data Inventory Rules

Data Inventory is a data health tool, not a scanner.

It should show:

```txt
Coverage
Freshness
Missing data
Provider/source
Sync status
Score version
```

Do not turn it into a second stock discovery screen.

---

## Legacy / Developer Tools

Legacy tools may exist, such as:

```txt
Analyst Target Discovery
Provider limit experiments
```

They should be clearly labeled:

```txt
Developer / Legacy Tools
Not production workflows
```

---

## Planned Cleanup

Future planned:

```txt
Phase 21E — Data Inventory / Admin Data Health Cleanup
```

Likely goals:

```txt
Clean old labels
Align with FMP Starter strategy
Make data inventory easier to read
Separate production workflows from legacy tools
Improve freshness/status terminology
```

---

## Related Docs

```txt
Context/sync-workflows.md
Context/Features/market-data-sync-strategy.md
Context/scoring-system.md
Context/data-model.md
```
