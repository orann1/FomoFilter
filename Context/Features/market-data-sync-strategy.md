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
| Nasdaq 100 membership | Static fallback list | Universe Sync |
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

Current Nasdaq 100 membership source:

```txt
static_fallback
```

FMP profile enrichment does not make FMP the membership source.

Correct wording:

```txt
Universe membership source = static fallback
Profile enrichment source = FMP
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
Nasdaq 100 membership
```

Rules:

```txt
Be explicit that this is static fallback.
Do not describe it as live provider membership.
Keep metadata/verification notes where implemented.
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
Company profile
Company name
Sector
Industry
Description
Market cap
Beta
Ratios
Key metrics
Financial growth
Analyst target consensus
Daily quote
52-week context
50/200 averages
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
| Universe Sync | Static fallback + optional FMP profile enrichment | Stock, StockUniverse, StockUniverseMember |
| Company Data Sync | FMP + Finnhub | Stock, StockMetric, StockAnalystData |
| Daily Market Data Sync | FMP quote | StockQuote |
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
