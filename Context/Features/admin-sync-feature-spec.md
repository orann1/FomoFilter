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
Universe Sync (Nasdaq 100 + S&P 500)
Daily Market Data Sync
Company Data Sync
Score Calculation
Opportunity Radar Fixture Scan (Phase 23C-2B, fixture-only test phase)
```

Legacy/developer tools should be separated from production workflows.

### Opportunity Radar Fixture Scan (Phase 23C-2B)

**Role:**
Test admin workflow for validating and persisting Opportunity Radar fixture data. Fixture-only implementation — no AI provider or external API calls.

**Scope:**
- Button: "Run Fixture Radar Scan"
- Triggers Server Action: runOpportunityRadarFixtureScanAction()
- Validates sampleRadarOutput fixture (3 NVDA/SMCI/META candidates)
- Persists to RadarScan + RadarCandidate + RadarEvidence if validation passes
- Success display: scanId, candidateCount, evidenceCount
- Error display: error message + validation errors list

**Copy Rules:**
- Clearly label as "Fixture Phase" and "fixture-only"
- Explicitly state: "No AI provider or external search is called in this phase"
- Mention Phase 23C-2B context: test workflow before real AI integration
- Real AI integration deferred to Phase 23C-2C

**DB Behavior:**
- Creates 1 RadarScan record (status: "success", provider: "Anthropic", model: "claude-sonnet-4.6", sourceMode: "fixture")
- Creates 3 RadarCandidate records with sortRank 0-2 (NVDA, SMCI, META)
- Attempts Stock linking by ticker symbol (stockId null if not found)
- Creates 7 RadarEvidence records (2 for NVDA, 3 for SMCI, 2 for META)
- Uses Prisma transaction for atomicity
- Multiple clicks create separate scans (no destructive deletes of prior fixtures)

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

Both current and legacy SyncRun type strings are displayed with readable labels.

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

## Current Production Sync Buttons (Phase 22B)

| Button | Role |
| --- | --- |
| Sync Nasdaq 100 Universe | Refresh Nasdaq 100 membership from static fallback list. Includes FMP profile enrichment for new stocks. |
| Sync S&P 500 Universe | Refresh S&P 500 membership from best-effort static fallback list. Membership only — no FMP profile calls. Run Company Data Sync after to enrich new stocks. |
| Sync Daily Market Data | Refresh FMP quote data for all unique active universe stocks (deduplicated). |
| Sync Company Data | Refresh FMP/Finnhub company, metrics, and analyst data for all unique active universe stocks (deduplicated). |
| Calculate Fundamental Scores | Internal DB-only Fundamental Score v1 calculation. |
| Calculate Opportunity Scores | Internal DB-only Opportunity Score v2 calculation. |

---

## Universe Sync — Multi-Universe Behavior (Phase 22B)

Both Nasdaq 100 and S&P 500 use static fallback membership:

```txt
Nasdaq 100:
  source: static_fallback
  compositionAsOf: 2026-01-20
  symbolCount: 100
  FMP profile enrichment: yes (called during sync for new stocks)
  SyncRun type: nasdaq100-universe-sync

S&P 500:
  source: static_fallback / manual (best-effort)
  compositionAsOf: 2025-07-01
  symbolCount: 499 unique symbols
  FMP profile enrichment: no (membership only — run Company Data Sync separately)
  SyncRun type: sp500-universe-sync
```

Important:

```txt
Neither Nasdaq 100 nor S&P 500 membership uses a live provider index constituent feed.
FMP index constituent endpoints require a higher plan tier than currently used.
```

Overlap behavior:

```txt
Stock is unique by symbol.
If a symbol belongs to both Nasdaq 100 and S&P 500:
  - One Stock record exists.
  - Two StockUniverseMember records exist (one per universe).
Stocks leaving one universe have that specific membership deactivated.
Stocks in other universes are unaffected.
Existing quotes, watchlist items, and alerts are untouched.
```

---

## Daily Market Data Sync — Multi-Universe Scope (Phase 22B)

```txt
Operates on all unique active symbols across all synced universes.
Symbols are deduplicated before SyncRunItem creation and before FMP quote calls.
A symbol in both Nasdaq 100 and S&P 500 is processed once per run.
SyncRun type: market-data-active-symbols-sync
Provider: FMP /stable/quote
```

Latest/status query (Phase 22B fix):

```txt
/api/admin/sync-runs/latest queries both market-data-active-symbols-sync and market-data-nasdaq100-chunked-sync.
Most recent run (by startedAt) is returned — new type is preferred once it exists.
getLatestChunkedSyncRun() helper in admin-sync.ts uses the same both-type query.
```

---

## Company Data Sync — Multi-Universe Scope (Phase 22B)

```txt
Operates on all unique active symbols across all synced universes.
Symbols are deduplicated before SyncRunItem creation and before provider calls.
A symbol in both Nasdaq 100 and S&P 500 is processed once per run.
SyncRun type: company-data-active-symbols-sync
Providers: FMP (profile, ratios, growth, price-target-consensus) + Finnhub (recommendation counts)
```

Latest/status query (Phase 22B fix):

```txt
/api/admin/analyst-sync/latest queries both company-data-active-symbols-sync and analyst-data-nasdaq100-sync.
Most recent run (by startedAt) is returned — new type is preferred once it exists.
getLatestAnalystSyncRun() helper in admin-sync.ts uses the same both-type query.
```

---

## SyncRun Type Labels

Current production types and their display labels:

| SyncRun type | Display label |
| --- | --- |
| `nasdaq100-universe-sync` | Nasdaq 100 Universe Sync |
| `sp500-universe-sync` | S&P 500 Universe Sync |
| `market-data-active-symbols-sync` | Daily Market Data Sync |
| `company-data-active-symbols-sync` | Company Data Sync |
| `fundamental-score-calculation` | Fundamental Score Calc |
| `opportunity-score-calculation` | Opportunity Score Calc |

Legacy types (backward-compatible — display in history only):

| SyncRun type | Display label |
| --- | --- |
| `analyst-data-nasdaq100-sync` | Company Data Sync (legacy) |
| `market-data-nasdaq100-chunked-sync` | Daily Market Data Sync (legacy) |
| `market-data-nasdaq100-batch` | Daily Market Data Sync (legacy) |
| `analyst-target-discovery` | Target Discovery (Legacy) |

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

Do not describe S&P 500 or Nasdaq 100 membership as a live provider feed.

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

### Data Inventory Pagination (Phase 22C)

Data Inventory renders client-side paginated rows.

```txt
Default page size: 50 rows
Page size options: 25 / 50 / 100
Pagination controls: rows-per-page selector, prev/next, page X / Y
Page resets to 1 on filter or search change
Filter and search apply before pagination
All rows are loaded server-side; pagination is purely a render concern
```

### Data Inventory Filters (Phase 22C)

Current filter set:

```txt
All
Scanner Eligible
Not Eligible             — inverse of Scanner Eligible
Problem Rows             — !hasQuote || !hasMetric || !hasScore || !scannerEligible
Missing Quote
Stale Quote              — has quote but lastSyncedAt > 24 hours ago
Missing Metrics
Missing Score
Missing Analyst
S&P 500                  — active S&P 500 members (sp-500 slug, isActive = true)
Nasdaq 100               — active Nasdaq 100 members (nasdaq-100 slug, isActive = true)
Missing Target
Has Target
No Target Available
Plan Limited
Eligible for Retry
Provider Error
```

### Data Inventory Summary Cards (Phase 22C)

First row: Total Stocks, With Quote, With Metrics, With Score, Scanner Eligible, Nasdaq 100 Active, S&P 500 Active.

Second row: With Analyst Data, Missing Analyst, Has Target Price, Missing Target, Plan Limited.

### Data Inventory Columns (Phase 22C)

Universe section includes:
- Nasdaq 100 (yes/no badge, Static Fallback source)
- S&P 500 (yes/no badge, Static Fallback source) — added Phase 22C
- Univ. Source, Mbr Active, Mbr Last Seen

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

## Sync History Rules (Phase 22C)

SyncRunItems per expanded row are capped at 100 (loaded via `take: 100` in `getRecentSyncRuns`).

Expanded row controls:

```txt
Toggle: "Show failed/skipped only" — filters the displayed items to non-success statuses
Truncation note: shown when items.length >= 100 and requestedCount > 100
  "Showing first 100 of N items — use failed/skipped filter to surface problems."
```

If "show failed/skipped only" is active and items are truncated, a note warns:
"Note: items list is capped at 100 — failures beyond the first 100 items may not appear here."

The Sync History label remains "Latest 10 runs".

---

## Admin Sync Status Panels (Phase 22C)

`ChunkedSyncResultPanel` (shown after a terminal Daily Market Data or Company Data sync run):

```txt
Shows: requested, processed, succeeded, skipped, failed, duration, completed date/time
Completed date: formatted as "Jun 5 at 14:32" from progress.finishedAt
```

`partial_success` guidance (shown when isPartial and skippedCount > 0):

```txt
"Skipped symbols are expected — typically S&P 500 stocks without full FMP coverage,
or symbols the provider returned no data for. Check Sync History for symbol-level detail."
```

Universe Overview `lastQuoteSync` column now queries by explicit type list:

```txt
market-data-active-symbols-sync  (current production type, Phase 22B+)
market-data-nasdaq100-chunked-sync
market-data-nasdaq100-batch
quotes-nasdaq100-batch
```

Previously used `type: { contains: "quote" }` which missed the new production type.

The `persisted: true` condition was also removed from the query.
`market-data-active-symbols-sync` chunked sync runs set `persisted: false` on the SyncRun record.
`successCount: { gt: 0 }` is retained as the guard — only runs that actually updated stocks
are considered for the lastQuoteSync display.

---

## Phase 22B — Multi-Universe Unique Sync Foundation + S&P 500 Expansion

Phase 22B completed the following changes:

```txt
Added S&P 500 best-effort static fallback symbol list (499 unique symbols).
Added Sync S&P 500 Universe button (membership-only sync, no FMP profile calls).
Renamed Sync Stock Universe → Sync Nasdaq 100 Universe (behavior preserved).
Updated Universe Sync info copy to explain multi-universe overlap behavior.
Updated Daily Market Data Sync to operate on unique active symbols across all universes.
Updated Company Data Sync to operate on unique active symbols across all universes.
Updated Daily/Company sync copy to explain unique-symbol deduplication.
Added SyncRun type labels for new types and legacy backward-compatible display.
Updated paused sync panel copy (removed Nasdaq-100-specific reference).
Added "Nasdaq 100 Quote Coverage" label to the quote coverage panel (scoped label).
```

---

## Related Docs

```txt
Context/sync-workflows.md
Context/Features/market-data-sync-strategy.md
Context/scoring-system.md
Context/data-model.md
```
