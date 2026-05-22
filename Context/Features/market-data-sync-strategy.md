# Market Data Sync Strategy

## Document Purpose

This document defines the updated market data sync strategy for FomoFilter after the completion of Phases 9B–9E and the Phase 9F provider-limit review.

The goal is to define:

- Which market data FomoFilter needs.
- Which provider should supply each data type under the current free-plan limits.
- Which data should be persisted in the database.
- Which data should be cached on demand.
- Which data belongs only in local UI state.
- How manual sync should work before scheduled automation.
- How future phases should expand safely without calling APIs from Scanner render paths.

This is a strategy document, not a direct implementation task.

Each implementation step should still be defined separately in `current-feature.md`.

---

## Core Architecture Principle

FomoFilter must not call external market APIs directly from the Scanner UI.

Correct architecture:

```txt
Market Data Providers / Fallback Sources
        ↓
Manual Sync Actions / Future Scheduled Jobs
        ↓
Database
        ↓
Scanner / Dashboard / Drawer / Alerts
```

The Scanner, Dashboard, and main UI must read from the database.

External API calls should happen only in:

- Admin manual sync actions.
- Future scheduled sync jobs.
- Carefully controlled on-demand enrichment flows with DB caching.

Never call provider APIs directly from normal render paths.

---

## Current Implementation Status

The market data foundation already includes:

| Area | Status |
| --- | --- |
| Provider layer | Implemented for FMP, Twelve Data, Finnhub |
| Admin Sync page | Implemented |
| Provider tests | Implemented |
| Quote sample sync | Implemented with Twelve Data |
| Profile sample sync | Implemented with FMP |
| Safe update helpers | Implemented |
| SyncRun / SyncRunItem logs | Implemented |
| Admin sync history | Implemented |
| Universe overview | Implemented |
| DB stock summary | Implemented |
| Nasdaq 100 membership sync | Implemented with static fallback + FMP profile enrichment |
| Admin tabs and pending state | Implemented |

Important current limitations:

```txt
Live Nasdaq 100 constituent endpoints are not available on the current free plans.
Twelve Data free plan allows only 8 API credits/minute.
Finnhub free plan allows 60 calls/minute and is better suited for broad quote snapshot coverage.
```

Therefore:

- Nasdaq 100 membership currently uses a manually validated static fallback list.
- Nasdaq 100 quote snapshot coverage should use Finnhub if field coverage is sufficient.
- Twelve Data should be kept for deeper OHLCV, historical candles, and technical base data in smaller batches.

---

## Provider Strategy

Yahoo Finance and Apify Yahoo are removed from the core strategy.

| Provider / Source | Main Role |
| --- | --- |
| Static / Manual Fallback | Universe/index membership when live provider endpoints are unavailable; currently used for Nasdaq 100 |
| Finnhub | Primary free-plan quote snapshot coverage, company news, market news, catalyst enrichment |
| FMP | Company profile, sector/industry, market cap, fundamentals, analyst data, earnings; universe/index membership only if available in the current plan |
| Twelve Data | Daily OHLCV enrichment, historical candles, technical base data, fallback/deeper market data when API credits allow |
| Internal Engine | Technical calculations, relative volume, analyst upside, scoring, setup classification, alert evaluation |

---

## Source Attribution Rules

Provider/source attribution must be precise.

### Universe Membership Source

`StockUniverseMember.source` should represent where the membership list came from.

Current Nasdaq 100 membership:

```txt
source = static_fallback
```

FMP is not the membership source for Nasdaq 100 in the current plan.

### Profile Enrichment Source

FMP may still be used to enrich stocks with:

- Company name
- Sector
- Industry
- Exchange
- Market cap

But this does not make FMP the membership source.

Correct wording:

```txt
Nasdaq 100 membership source = static_fallback
Profile enrichment source = fmp
```

### Quote Snapshot Source

For broad quote snapshot coverage under the current free plans:

```txt
source = finnhub
SyncRun.provider = finnhub
```

Twelve Data can still be used for sample quote testing and deeper OHLCV/candle data.

### SyncRun Provider

For universe sync from the static fallback list:

```txt
SyncRun.provider = static_fallback
SyncRun.type = nasdaq100-universe-sync
```

For profile sync:

```txt
SyncRun.provider = fmp
```

For broad quote snapshot sync:

```txt
SyncRun.provider = finnhub
```

For Twelve Data sample/deeper OHLCV sync:

```txt
SyncRun.provider = twelve-data
```

---

## Provider Responsibilities

### Static / Manual Fallback

Use static/manual fallback only when a live provider endpoint is unavailable.

Current usage:

```txt
Nasdaq 100 membership = static_fallback
```

Rules:

- The file must clearly say fallback.
- The Admin UI must clearly show the source.
- Metadata must include verification date and symbol count.
- SyncRun must state that the membership came from static fallback.
- Static fallback must not be presented as live provider sync.

Current Nasdaq 100 fallback metadata:

```ts
source: "static_fallback"
provider: "manual"
index: "nasdaq-100"
compositionAsOf: "2026-01-20"
lastVerifiedAt: "2026-05-21"
symbolCount: 100
```

Future upgrade path:

```txt
Replace static_fallback with live FMP or another paid/reliable constituent source when available.
```

---

### Finnhub

Use Finnhub mainly for broad quote snapshot coverage on the free plan, news, and catalyst enrichment.

Primary responsibilities:

- Quote snapshot coverage for Nasdaq 100 and other controlled batches when fields are sufficient.
- Current price.
- Daily change.
- Daily change percent.
- Open / high / low / previous close if available from the quote endpoint.
- Timestamp / source update timestamp if available.
- Company news.
- Market news.
- Watchlist news.
- News for top scanner candidates.
- Catalyst enrichment.

Important limitation:

```txt
Finnhub quote must be inspected before relying on it for every quote field.
If Finnhub does not return volume, do not invent volume and do not overwrite existing volume with null.
```

Current free-plan advantage:

```txt
Finnhub free plan allows 60 calls/minute.
This is more practical for Nasdaq 100 quote coverage than Twelve Data's 8 credits/minute free limit.
```

Current constituent limitation:

```txt
Finnhub /indices/constituents returns HTTP 200 with HTML paywall content on the current plan.
```

So Finnhub is not currently used as a live Nasdaq 100 constituent source.

---

### FMP

Use FMP mainly for slower-changing reference, profile, fundamental, analyst, and earnings data.

Primary responsibilities:

- Company profile.
- Company name.
- Exchange.
- Sector.
- Industry.
- Market cap.
- Financial statements.
- Key metrics and ratios.
- Revenue growth.
- EPS growth.
- Margins.
- ROE.
- Debt/equity.
- Forward P/E.
- PEG.
- Analyst target price.
- Analyst recommendations.
- Earnings calendar.
- Earnings surprises.

Conditional responsibility:

- Universe/index membership only if the endpoint is available in the active plan.

Current finding:

```txt
FMP /stable/nasdaq-constituent returns HTTP 402 on the current plan.
```

So FMP is not currently used as the live Nasdaq 100 constituent source.

FMP should not be used for high-frequency quote refreshes unless there is a specific fallback need.

---

### Twelve Data

Use Twelve Data for deeper market data, OHLCV enrichment, and historical price/time-series data.

Primary responsibilities:

- Daily OHLCV enrichment where Finnhub quote is insufficient.
- Historical daily candles.
- Historical intraday candles if needed later.
- Time series needed for momentum.
- Time series needed for technical calculations.
- Volume enrichment if Finnhub quote does not provide volume.
- Optional technical indicators if internal calculations are not enough.

Free-plan caution:

```txt
Twelve Data free plan allows 8 API credits/minute and 800/day.
A 25-symbol quote batch exceeds the current free-plan per-minute limit.
```

Therefore:

- Do not use Twelve Data as the primary broad Nasdaq 100 quote coverage provider while on the free plan.
- Use Twelve Data for small controlled OHLCV/candle samples.
- Avoid full Russell 1000 sync.
- Store timestamps and avoid repeated unnecessary calls.
- Prefer batch endpoints only when credit usage is acceptable.

---

### Internal Engine

Use internal code for derived calculations.

Responsibilities:

- Analyst upside.
- Average volume if volume history exists.
- Relative volume if volume history exists.
- Moving averages if candles exist.
- Momentum if candles exist.
- Volatility if candles exist.
- RSI / MACD if implemented internally.
- Hot Score.
- Opportunity Score.
- Risk Score.
- Setup classification.
- FOMO Risk classification.
- Alert evaluation.

Derived values should be calculated from persisted DB data, not directly from API responses in the UI.

---

## Data Categories and Provider Mapping

| Data Category | Data Examples | Primary Provider / Source | Fallback | Storage |
| --- | --- | --- | --- | --- |
| Universe membership | Nasdaq 100, S&P 500, Russell 1000 members | FMP if plan allows | Static/manual fallback | DB |
| Company identity | Symbol, name, exchange | FMP | Twelve Data reference if available | DB |
| Company classification | Sector, industry | FMP | Manual/source fallback | DB |
| Market cap | Market cap | FMP | None initially | DB |
| Quote snapshot | Price, change, change %, basic OHLC if available | Finnhub | Twelve Data/FMP | DB |
| Volume | Volume / volume enrichment | Twelve Data preferred; Finnhub only if available | FMP if available | DB |
| Historical candles | Daily/intraday OHLCV | Twelve Data | FMP | DB |
| Fundamentals | Statements, ratios, growth, margins | FMP | None initially | DB |
| Analyst data | Target price, recommendations, estimates | FMP | Finnhub if available | DB |
| Earnings | Calendar, surprises | FMP | Finnhub | DB |
| News | Company/market news | Finnhub | FMP | DB cache |
| Catalyst label | News-derived reason/catalyst | Internal + Finnhub/FMP | AI later | DB |
| Technicals | MA, RSI, momentum, volatility | Internal from candles | Twelve Data indicators only if needed | DB |
| Scores | Hot/Opp/Risk/FOMO | Internal | None | DB |
| Alerts | Alert evaluation and events | Internal | None | DB |

---

## Data Storage Policy

### Persist in DB

Data that affects scanning, filtering, sorting, scoring, alerts, or shared UI must be stored in the DB.

Examples:

- Symbol.
- Company name.
- Exchange.
- Sector.
- Industry.
- Universe membership.
- Current price.
- Daily change.
- Daily change percent.
- Open/high/low/close if available.
- Volume if available.
- Average volume later.
- Relative volume later.
- Historical candles later if needed for calculations.
- Analyst target price.
- Analyst upside.
- Analyst recommendation summary.
- Fundamentals used for Opportunity Score.
- Hot Score.
- Opportunity Score.
- Risk level.
- Setup status.
- Watchlist items.
- Alert rules.
- Alert events.

Reason:

The Scanner must be fast, stable, sortable, filterable, and independent of live API calls.

### On-Demand with DB Cache

Data useful only when opening a drawer or future stock details page can be fetched on demand and cached.

Examples:

- Long company description.
- CEO / employee count / website.
- Detailed company profile.
- Latest detailed news.
- Full analyst history.
- Full financial statement details.
- Deep historical chart data.
- AI-generated stock summary.
- Peer comparison.

Recommended flow:

```txt
Open stock details
→ Check DB cache
→ If stale, fetch from provider
→ Save refreshed data
→ Render result
```

### localStorage Only

Use localStorage only for UI state and preferences.

Good localStorage use cases:

- Last selected Scanner filters.
- Last selected universe.
- Last selected sort.
- Collapsed/expanded UI panels.
- Last selected admin tab, if desired.
- Theme/UI preferences.
- Table density.

Do not use localStorage for:

- Quotes.
- Fundamentals.
- Analyst data.
- News.
- Scores.
- Alert state.
- Watchlist state.
- Server-side loader data.

Rule:

```txt
DB cache = data used by the system
localStorage = UI preference/state only
```

---

## Current DB-Backed Admin Sync Capabilities

The Admin Sync page at:

```txt
/admin/sync
```

currently provides:

### Overview Tab

- DB Stock Summary.
- Universe Overview.
- Read-only snapshot of current DB/universe coverage.

### Sync Actions Tab

- Sync Nasdaq 100 Universe.
- Sync Quotes Sample.
- Sync Profiles Sample.
- Review Results.
- Sync in-progress panel with elapsed time and indeterminate progress bar.

### Provider Tests Tab

- API Key Configuration.
- Test FMP Profile.
- Test Twelve Quote.
- Test Finnhub News.
- No-DB-write provider validation.

### Sync History Tab

- Recent Sync Runs.
- Expandable symbol-level details.

---

## Data Types, Providers, and Refresh Frequency

| Data Type | Primary Provider / Source | Fallback | Storage | Refresh Frequency |
| --- | --- | --- | --- | --- |
| Nasdaq 100 membership | Static fallback currently; FMP if plan allows | Manual CSV/import | DB | Monthly/manual |
| S&P 500 membership | FMP if plan allows | Manual CSV/import | DB | Monthly/manual |
| Russell 1000 membership | FMP if plan allows | Manual CSV/import | DB | Monthly/manual |
| Symbol/name/exchange | FMP | Twelve Data reference | DB | Monthly |
| Sector/industry | FMP | Manual/source fallback | DB | Monthly |
| Market cap | FMP | None initially | DB | Monthly |
| Quote snapshot | Finnhub | Twelve Data/FMP | DB | Daily/manual batch |
| Current price | Finnhub | Twelve Data/FMP | DB | Daily/manual batch |
| Daily change percent | Finnhub | Twelve Data/FMP | DB | Daily/manual batch |
| Daily OHLC | Finnhub if available; Twelve Data for deeper OHLCV | Twelve Data/FMP | DB | Daily/manual batch |
| Volume | Twelve Data preferred; Finnhub only if available | Finnhub/FMP | DB | Daily/manual/small batch |
| Average volume | Internal from candles/volume history | Twelve Data/FMP | DB | Daily/weekly |
| Relative volume | Internal | None | DB | After quote/candle sync |
| Historical daily candles | Twelve Data | FMP | DB | Daily/weekly |
| Moving averages | Internal | Twelve Data indicators if needed | DB | After candle sync |
| Momentum | Internal | None | DB | After candle sync |
| Volatility | Internal | None | DB | After candle sync |
| RSI/MACD | Internal preferred | Twelve Data indicators if needed | DB | After candle sync |
| Financial statements | FMP | None initially | DB/cache | Monthly/quarterly |
| Key metrics/ratios | FMP | None initially | DB | Monthly/quarterly |
| Revenue growth | FMP/Internal | None | DB | Monthly/quarterly |
| EPS growth | FMP/Internal | None | DB | Monthly/quarterly |
| Margins | FMP/Internal | None | DB | Monthly/quarterly |
| ROE | FMP/Internal | None | DB | Monthly/quarterly |
| Debt/equity | FMP/Internal | None | DB | Monthly/quarterly |
| Forward P/E | FMP | Finnhub if available | DB | Weekly/monthly |
| PEG | FMP | None initially | DB | Weekly/monthly |
| Analyst target price | FMP | Finnhub if available | DB | Weekly |
| Analyst recommendations | FMP | Finnhub if available | DB | Weekly |
| Analyst upside | Internal | None | DB | After quote + analyst sync |
| Earnings calendar | FMP | Finnhub | DB | Weekly |
| Earnings surprises | FMP | Finnhub | DB | Weekly / around earnings |
| Company news | Finnhub | FMP | DB cache | Daily for subset |
| Catalyst label | Internal/Finnhub/FMP | AI later | DB | After news sync |
| Company description | FMP | Finnhub | On-demand DB cache | 30-90 days |
| Detailed profile | FMP | Finnhub | On-demand DB cache | 30-90 days |
| AI stock summary | Internal AI | None | DB cache | On demand / after data refresh |
| Scores | Internal | None | DB | After relevant sync |
| Alert evaluation | Internal | None | DB | After quote/score sync |

---

## Stale Data Policy

Every persisted market-data table should include or eventually include:

```txt
source
lastSyncedAt
sourceUpdatedAt
```

Suggested stale thresholds:

| Data Type | Stale After |
| --- | ---: |
| Quote snapshot | 24 hours or next market day |
| Daily OHLC | 24 hours or next market day |
| Volume | 24 hours or next market day |
| Historical candles | 24-72 hours |
| News | 6-12 hours |
| Analyst targets | 7 days |
| Recommendations | 7 days |
| Earnings calendar | 7 days |
| Fundamentals | 30 days |
| Financial statements | 30-90 days |
| Company profile | 30-90 days |
| Company description | 30-90 days |
| Universe membership | 30 days |
| Scores | When source inputs change |
| Alert evaluations | After quote/score refresh |

---

## Safe Update Policy

Provider data must not blindly overwrite existing DB values.

Rules:

- Do not overwrite valid existing values with `null`.
- Do not overwrite valid existing values with empty strings.
- Do not overwrite valid numbers with invalid numbers.
- If a provider returns an error, keep existing values.
- If a symbol fails, keep successful updates for other symbols.
- A partial run should be stored as `partial_success`.
- Each symbol update should be atomic where practical.
- If Finnhub quote does not return volume, keep existing volume unchanged.

Existing helpers:

```txt
isValidNumber
keepExistingIfInvalid
```

These should continue to be used and expanded as needed.

---

## Sync Logging Policy

Every manual sync action that writes or attempts to write data should persist a log.

Current models:

```txt
SyncRun
SyncRunItem
```

Sync logs should include:

- Sync type.
- Provider/source.
- Status.
- Requested count.
- Success count.
- Skipped count.
- Failed count.
- Persisted flag.
- Message.
- Started/finished time.
- Duration.
- Symbol-level status.
- Symbol-level reason.
- Symbol-level DB action.

Do not store:

- API keys.
- Raw provider payloads.
- URLs containing keys.
- Large debug JSON responses.

---

## Sync Priority Strategy

Because free API plans are limited, sync should be prioritized.

### Priority 1 — Active User-Relevant Stocks

Prioritize:

- Watchlist stocks.
- Stocks with active alerts.
- Stocks marked Ready to Buy or Waiting.

Note:

The current watchlist is still partly demo/seeded, so it should not be the first production-like universe sync target.

### Priority 2 — Managed Universe Subsets

Prioritize controlled, known universes before the full market.

Current first target:

```txt
Nasdaq 100
```

Reason:

- 100 active members.
- More realistic than demo watchlist.
- Smaller than Russell 1000.
- Useful for scanner validation.

### Priority 3 — Rotating Universe Batch

For larger universes, update gradually in controlled batches.

Example:

```txt
Nasdaq 100 quote snapshots: 25 symbols per run with Finnhub if quote endpoint validation passes
Twelve Data OHLCV/candles: small batches only
Russell 1000 later: rotating batches only
```

Do not build full Russell 1000 sync yet.

---

## Recommended Development Phases From Current Point

Completed:

| Phase | Status |
| --- | --- |
| 9A | Market Data Sync Strategy completed |
| 9B | Provider Layer + Admin Sync Shell completed |
| 9C | Safe Quote Metadata + Detailed Sync Reporting completed |
| 9D | Persistent SyncRun / SyncRunItem logs completed |
| 9E | Universe Management + Nasdaq 100 Membership Sync + Admin UX completed |

Recommended next phases:

### Phase 9F — Nasdaq 100 Finnhub Quote Snapshot Sync

Goal:

Sync quote snapshots for active Nasdaq 100 members in controlled batches using the provider that best fits the current free-plan limits.

Recommended provider:

```txt
Finnhub
```

Recommended batch:

```txt
Next 25 active Nasdaq 100 members
```

Reason:

```txt
Finnhub free plan allows 60 calls/minute, which is more practical for broad quote snapshot coverage than Twelve Data's 8 credits/minute free limit.
```

Before implementation, inspect the existing `fetchFinnhubQuote` provider function and confirm which fields are available.

Selection priority:

```txt
1. Active Nasdaq 100 members with no StockQuote
2. Then active Nasdaq 100 members with oldest StockQuote.lastSyncedAt
3. Tie-breaker: symbol ASC
4. Limit 25
```

Data to sync if Finnhub supports it:

- Current price.
- Daily change.
- Daily change percent.
- Open.
- High.
- Low.
- Previous close / close.
- Timestamp / source updated timestamp if available.
- Volume only if Finnhub returns it.

Important:

```txt
Do not invent volume.
Do not overwrite existing volume with null if Finnhub does not return volume.
```

Twelve Data should be kept for deeper OHLCV, historical candles, and technical base data in later phases.

Do not add scoring yet.

---

### Phase 9G — FMP Fundamentals / Analyst Sample

Goal:

Fetch and persist a small sample of fundamentals and analyst data.

Recommended provider:

```txt
FMP
```

Purpose:

- Prepare Opportunity Score.
- Calculate analyst upside.
- Add valuation context.
- Support the app's fundamentals-first stock selection approach.

---

### Phase 9H — Internal Fundamental / Valuation Calculations

Goal:

Calculate fundamental and valuation-derived fields from persisted FMP data.

Examples:

- Analyst upside.
- Revenue growth scoring.
- EPS growth scoring.
- Profitability scoring.
- Valuation scoring.
- Opportunity Score foundations.

---

### Phase 9I — News / Catalyst Sync

Goal:

Fetch and cache news for selected subsets only.

Recommended provider:

```txt
Finnhub
```

Scope:

- Watchlist.
- Active alerts.
- Top scanner candidates.
- Not full Russell 1000.

---

### Phase 9J — Optional Historical Candles / Technical Timing Sample

Goal:

Fetch and persist a small historical candle sample only if technical timing becomes a priority.

Recommended provider:

```txt
Twelve Data
```

Purpose:

- Enable optional timing indicators.
- Enable momentum/volatility calculations later.
- Not required for the fundamentals-first MVP.

---

### Phase 9K — Scoring Engine

Goal:

Calculate Hot Score, Opportunity Score, Risk Score, FOMO Risk, and setup classification from stored inputs.

Provider:

```txt
Internal Engine
```

---

## API Limit Strategy

Known free-plan constraints:

| Provider | Free Limit / Current Finding |
| --- | --- |
| FMP | 250 calls/day; some endpoints such as `/stable/nasdaq-constituent` require paid plan |
| Finnhub | 60 calls/minute; `/indices/constituents` returns HTML paywall on current plan |
| Twelve Data | 8 API credits/minute, 800 credits/day |

Free-mode rules:

- Use sample sizes first.
- Avoid full universe deep sync.
- Prefer controlled batches.
- Prefer the provider whose free limit fits the data category.
- Store timestamps.
- Avoid repeated unnecessary calls.
- Never call APIs from render paths.
- Log every write sync.
- Start with Nasdaq 100 before Russell 1000.

Current free-plan alignment:

| Provider / Source | Free-plan reality | Practical sync decision |
| --- | --- | --- |
| Static / Manual Fallback | No API limit, manually maintained | Use for Nasdaq 100 membership until a live constituent endpoint is available |
| Finnhub | 60 calls/minute; index constituents unavailable on current plan | Use as the practical primary provider for broad quote snapshot coverage on the free plan, plus news/catalysts |
| FMP | 250 calls/day; some index constituent endpoints require paid access | Use for profile/reference/fundamental/analyst samples and monthly/slow refreshes, not high-frequency quotes |
| Twelve Data | 8 API credits/minute and 800/day | Use for OHLCV/candles and technical base data in small controlled batches; not ideal for broad quote coverage on the free plan |
| Internal Engine | No provider limit | Use for calculations from stored DB data only |

Important:

```txt
Phase 9F should switch to Finnhub quote snapshots and use Next 25, if Finnhub quote fields and rate behavior are confirmed.
```

Twelve Data remains important for OHLCV/candles, but broad quote coverage should not depend on Twelve Data while the 8-credits/minute free limit is active.

---

## What Not To Build Yet

Do not build these yet:

- Full Russell 1000 quote sync.
- Full Nasdaq 100 all-at-once quote sync.
- Full fundamentals sync for all stocks.
- Full news sync for all stocks.
- Scheduled cron jobs.
- Alert evaluation engine.
- Score recalculation engine.
- AI news summarization.
- Real-time streaming.
- Background queues.
- Multi-provider reconciliation.
- Paid-plan optimization.
- User-facing sync controls.

---

## Open Questions

1. Does the existing `fetchFinnhubQuote` function return all quote snapshot fields needed for Phase 9F?
2. Does Finnhub return volume, or should volume remain unchanged until Twelve Data OHLCV/candles are synced?
3. Should Phase 9F add or reuse existing `StockQuote` OHLC fields for Finnhub quote data?
4. Should Phase 9F use fixed batch size 25 with Finnhub while the 60 calls/minute free limit is active?
5. Should quote sync update only active Nasdaq 100 members for now?
6. Should quote snapshot sync use `sourceUpdatedAt` from provider if available?
7. Should `lastSyncedAt` represent completion time or per-symbol update time?
8. How should failed symbols be retried later?
9. When should watchlist/active-alert quote priority be added, given current watchlist is seeded/demo?
10. When should static fallback be replaced with a live paid constituent provider?

---

## Current Recommendation

Next implementation step:

```txt
Phase 9F — Nasdaq 100 Finnhub Quote Snapshot Sync
```

Do not build scheduled sync yet.

Do not build scoring engine yet.

Do not connect APIs directly to Scanner render logic.
