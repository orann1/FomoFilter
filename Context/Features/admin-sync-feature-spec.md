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

## Data Inventory Source Labels (Phase 21E)

Correct source labels as of Phase 21E:

| Column Group | Source Label |
| --- | --- |
| Price, Change %, Open, Day High, Day Low, Prev Close, Volume, Src Updated, 52W High, 52W Low | FMP |
| Rev Growth TTM, EPS Growth TTM, Rev Growth 3Y, Gross Margin, Op Margin, Net Margin, ROE, ROA, D/E, Current Ratio, P/E TTM, Fwd P/E, PEG, P/S, EV/EBITDA, Beta, Mkt Cap (Metric) | FMP |
| Target Price, Target High, Target Low | FMP |
| Analyst Rating, Analyst Count | Finnhub |
| Analyst Source, Last Synced, Has Quote, Quote Source, Has Metrics, Metrics Source, Metrics Synced, Analyst Synced | DB |
| Has Score, Fund. Score, Growth Scr, Profit Scr, Valuation Scr, Fin Health Scr, Stability Scr, Score Ver., Score Calc At, Opp. Score, Opp. Version, Opp. Calc At, Scanner Eligible, Missing Reason | Internal |
| Target Status, Tgt Attempted, Tgt Found, Tgt Retry At, Tgt Attempts | FMP |

The user-facing label for `riskContextScore` is **Stability Scr** (not "Risk Scr").
The internal field name `riskContextScore` is unchanged.

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

### Twelve Data — Legacy Provider (Phase 21E)

Twelve Data tests are preserved but clearly labeled as legacy:

- **Test Twelve Quote** — developer reference only. Daily Market Data Sync uses FMP, not Twelve Data.
- **Sync Quotes Sample** — legacy sample that uses Twelve Data. Not the current production daily market data workflow.

Do not remove Twelve Data tests without approval.
Do not change their underlying client behavior.

---

## Sync History — Duration Column (Phase 21E)

Sync History shows a **Duration** column using `durationMs` if available, falling back to computing from `startedAt` and `finishedAt`. If neither is available, shows `N/A`.

Display format:
- Under 1 second: `<1s`
- Seconds: `30s`
- Minutes and seconds: `4m 15s`

---

## Score Methodology — Stability / Risk Context (Phase 21E)

The fifth scoring category is displayed as **Stability / Risk Context** in all user-facing and admin-facing text.

- Old label: `Risk / Context`
- New label: `Stability / Risk Context`
- Internal field: `riskContextScore` (unchanged)
- Applies to: Category Weights table, Metric Scoring Rules, Example Calculation, Opportunity Score v2 component table

The Score Methodology tab subtitle reads: **"How scores are calculated"** (covers both Fundamental Score v1 and Opportunity Score v2).

---

## Phase 21E — Completed Cleanup

Phase 21E completed the following changes:

```txt
Corrected Data Inventory source labels (Finnhub/N/A → FMP for quote, metric, and analyst target columns)
Renamed "Risk Scr" → "Stability Scr" in Data Inventory (internal field riskContextScore unchanged)
Renamed "Risk / Context" → "Stability / Risk Context" in Score Methodology (all occurrences)
Updated Fundamental Score action description: "FMP financial metrics" (not "Finnhub metrics")
Updated Score Methodology tab subtitle to "How scores are calculated"
Labeled Twelve Data provider test and Sync Quotes Sample as legacy / not current production
Added Duration column to Sync History using durationMs or computed from startedAt/finishedAt
```

---

## Related Docs

```txt
Context/sync-workflows.md
Context/Features/market-data-sync-strategy.md
Context/scoring-system.md
Context/data-model.md
```
