# Market Data Sync Strategy — FomoFilter

## When To Read This File

Read this file before changing:

```txt
Market data providers
Provider responsibilities
Universe / Company / Daily sync responsibilities
Provider source labels
Provider tests
Admin Sync data-source copy
Any feature that adds or changes external financial data
```

Do not read this file for UI-only changes that do not touch data sources or sync ownership.

---

## When To Update This File

Update this file after QA and before commit approval if you change:

```txt
Which provider supplies a data category
Which sync workflow writes a data category
Provider plan assumptions
Source attribution
Data freshness behavior
External API usage
```

---

## Core Rule

FomoFilter UI must not call external market APIs from normal render paths.

Correct flow:

```txt
Provider / Static Source
→ Admin Sync or future scheduled job
→ Database
→ Dashboard / Scanner / Drawer / Alerts
```

Provider calls are allowed only in:

```txt
Admin sync workflows
Provider tests
Future scheduled jobs
Explicit approved enrichment flows with DB caching
```

---

## Current Provider Strategy

| Data Category | Current Source | Workflow |
| --- | --- | --- |
| Nasdaq 100 membership | Static fallback list (100 symbols) | Universe Sync |
| S&P 500 membership | Best-effort static fallback list (499 symbols) | Universe Sync |
| Company profile | FMP | Company Data Sync |
| Company industry / description | FMP | Company Data Sync |
| Company fundamentals / ratios / growth | FMP | Company Data Sync |
| Analyst target consensus | FMP | Company Data Sync |
| Analyst recommendation counts | Finnhub | Company Data Sync |
| Daily quote / price / 52W / averages | FMP | Daily Market Data Sync |
| Scores | Internal DB-only calculations | Score Calculation |
| Watchlist / alerts | Internal DB | Server Actions |

---

## Source Attribution Rules

### Universe Membership

Current membership sources:

```txt
Nasdaq 100 — static_fallback
S&P 500 — static_fallback / manual (best-effort, not a live provider feed)
```

FMP profile enrichment does not make FMP the membership source for either index.

Correct wording:

```txt
Universe membership source = static fallback (both Nasdaq 100 and S&P 500)
Profile enrichment source = FMP (called during Nasdaq 100 sync; called separately via Company Data Sync for S&P 500)
```

Important:

```txt
Do not describe S&P 500 or Nasdaq 100 membership as live provider data.
Do not present the static fallback list as a real-time index constituent feed.
```

### Company Data

Current company data source:

```txt
FMP + Finnhub
```

Use:

```txt
fmp
fmp+finnhub
internal
static_fallback
```

where appropriate.

### Daily Market Data

Current daily quote source:

```txt
fmp
```

Daily sync should not say Finnhub legacy unless referencing history or legacy tools.

---

## Provider Responsibilities

### Static Fallback

Used for:

```txt
Nasdaq 100 membership (100 symbols, compositionAsOf 2026-01-20)
S&P 500 membership (499 unique symbols, best-effort, compositionAsOf 2025-07-01)
```

Rules:

```txt
Be explicit that these are static fallback lists.
Do not describe them as live provider membership.
Keep metadata/verification notes where implemented.
Update lists when quarterly rebalancing occurs.
```

Multi-universe overlap:

```txt
A symbol in both Nasdaq 100 and S&P 500 produces one Stock record and two
StockUniverseMember rows. Provider-backed data sync deduplicates by symbol
before calling providers — overlapping symbols are synced once per run.
```

Future:

```txt
Replace with live index constituent source if plan/provider supports it.
```

---

### FMP

Primary provider for paid Starter plan data.

Current responsibilities:

```txt
Company profile (name, sector, industry, description, marketCap, beta)
Ratios / key metrics / financial growth
Analyst target consensus
Daily quote / 52-week context / 50/200 averages
Profile enrichment during Nasdaq 100 universe sync (for new stock entries)
```

Current important endpoints:

```txt
/stable/profile
/stable/quote
/stable/ratios-ttm
/stable/key-metrics
/stable/key-metrics-ttm
/stable/financial-growth
/stable/price-target-consensus
```

Do not use FMP index constituent endpoints as production membership source unless confirmed available and implemented.

---

### Finnhub

Current responsibilities:

```txt
Analyst recommendation counts
```

Potential future responsibilities:

```txt
News
Market news
Catalyst enrichment
Fallback quote testing
```

Do not use Finnhub for target price if current plan blocks the endpoint.

---

### Twelve Data

Current status:

```txt
Not the primary provider after FMP Starter migration.
```

Future possible use:

```txt
Historical candles
OHLCV
Momentum foundation
Technical indicator base data
```

Do not reintroduce Twelve Data as broad daily sync provider unless explicitly scoped.

---

### Internal Engine

Owns derived data:

```txt
Fundamental Score
Opportunity Score
Analyst upside calculation from stored target/price
Analyst rating stars from stored counts
Decision Tag
Future Momentum Score
Future Hot Score
Future FOMO Risk
Alert evaluation
```

Derived values should come from DB data, not direct provider calls in UI.

---

## Multi-Universe Provider Sync Scope (Phase 22B)

Company Data Sync and Daily Market Data Sync now operate on all unique active symbols across all synced universes.

```txt
Symbol list is deduplicated before:
  - SyncRunItem creation
  - Provider calls (FMP quote, FMP profile/ratios/growth, Finnhub recommendation counts)

A symbol that belongs to both Nasdaq 100 and S&P 500 is processed once per run.
No duplicate SyncRunItem rows are created for overlapping symbols in the same run.
```

Score calculation operates on all active `Stock` records, which are unique by symbol.
No scope change was needed for score calculation.

---

## Current Data Storage Policy

Persist data in DB if it affects:

```txt
Scanner
Dashboard
Drawer
Sorting/filtering
Scoring
Alerts
Watchlist state
Data freshness
```

Examples:

```txt
Stock identity/profile
Universe membership
Quotes
Fundamentals
Analyst data
Scores
Watchlist
Alerts
Sync history
```

Do not use localStorage for provider data.

localStorage may be used only for UI preferences if approved.

---

## Current Sync Workflows

For implementation details read:

```txt
Context/sync-workflows.md
```

Summary:

| Workflow | Source | Writes |
| --- | --- | --- |
| Nasdaq 100 Universe Sync | Static fallback + FMP profile enrichment for new stocks | Stock, StockUniverse, StockUniverseMember |
| S&P 500 Universe Sync | Best-effort static fallback only (no provider calls) | Stock (shell), StockUniverse, StockUniverseMember |
| Company Data Sync | FMP + Finnhub — all unique active universe symbols | Stock, StockMetric, StockAnalystData |
| Daily Market Data Sync | FMP quote — all unique active universe symbols | StockQuote |
| Fundamental Score Calculation | Internal DB-only | StockScore |
| Opportunity Score Calculation | Internal DB-only | StockScore |

---

## Provider Tests

Provider tests should:

```txt
Validate API key/access
Avoid app data mutation
Report plan/access limits
Not replace production sync workflows
```

---

## What Not To Do

Do not:

```txt
Call providers from Scanner/Dashboard/Drawer render paths.
Overwrite valid DB values with null provider values.
Invent values when providers do not return them.
Mark expected provider plan limitations as app failures.
Mix daily quote writes into Company Data Sync.
Mix fundamental writes into Daily Market Data Sync.
Present static fallback membership as live provider data.
Describe S&P 500 or Nasdaq 100 membership as a live provider feed.
```

---

## Related Docs

```txt
Context/architecture.md
Context/sync-workflows.md
Context/data-model.md
Context/Features/admin-sync-feature-spec.md
Context/Algorithms/analyst-rating-and-upside.md
```
