# Market Data Sync Strategy

## Document Purpose

This document defines the data sync strategy for FomoFilter.

The goal is to decide:

- Which market data is needed.
- Which provider should supply each data type.
- Which data should be persisted in the database.
- Which data can be fetched on demand.
- Which data belongs in localStorage.
- How often each data type should be refreshed.
- How manual sync should work before scheduled automation is built.

This document is strategic. It is not a direct implementation task.

A separate `current-feature.md` should be created before coding each implementation phase.

---

## Core Principle

FomoFilter should not call external market APIs directly from the Scanner UI.

Correct architecture:

```txt
Market Data Providers
        ↓
Manual / Scheduled Sync Jobs
        ↓
Database
        ↓
Scanner / Dashboard / Drawer / Alerts
```

The Scanner should read from the database only.

The drawer and future stock details page may fetch selected enrichment data on demand, but only with clear stale-data rules and API-limit awareness.

---

## Provider Strategy

Yahoo Finance and Apify Yahoo are removed from the core strategy.

| Provider | Main Role |
| --- | --- |
| FMP | Universe/index membership, company profile, fundamentals, analyst data, earnings |
| Twelve Data | Quotes, daily OHLC, historical candles, technical base data |
| Finnhub | News, catalyst enrichment, fallback quotes |
| Internal Engine | Technical calculations, scoring, setup classification, alert evaluation |

---

## Provider Responsibilities

### FMP

Use FMP mainly for slower-changing reference and fundamental data.

Primary responsibilities:

- Russell 1000 / S&P 500 / Nasdaq 100 membership, if available.
- Company profile.
- Exchange, sector, industry.
- Market cap.
- Financial statements.
- Key metrics and ratios.
- Analyst target price.
- Analyst ratings / recommendations.
- Earnings calendar.
- Earnings surprises.

FMP should not be used for high-frequency quote refreshes in the free plan unless needed for a small sample.

### Twelve Data

Use Twelve Data mainly for market data and historical time series.

Primary responsibilities:

- Current quote.
- Daily price change.
- Open / high / low / close.
- Volume.
- Historical daily candles.
- Time series needed for momentum.
- Time series needed for technical calculations.
- Optional technical indicators if internal calculations are not enough.

Twelve Data free plan has limited credits, so it should be used carefully:

- Sample sync during development.
- Watchlist-first sync.
- Batch sync if credit usage is acceptable.
- Avoid pulling deep historical data for the full Russell 1000 every day.

### Finnhub

Use Finnhub mainly for news and catalyst enrichment.

Primary responsibilities:

- Company news.
- Market news relevant to selected stocks.
- News for watchlist stocks.
- News for top scanner candidates.
- Catalyst enrichment.
- Fallback quote provider if Twelve Data is unavailable or insufficient.

Do not pull news for the full Russell 1000 every day.

### Internal Engine

Use internal code for derived calculations.

Responsibilities:

- Relative volume.
- Moving averages.
- Momentum.
- Volatility.
- RSI / MACD, if implemented internally.
- Hot Score.
- Opportunity Score.
- Risk Score.
- Setup classification.
- FOMO Risk classification.
- Alert evaluation.

Derived values should be calculated from persisted DB data.

---

## Data Storage Policy

### 1. Persisted in DB

Data that affects scanning, filtering, sorting, scoring, alerts, or shared UI must be stored in the DB.

Examples:

- Symbol.
- Company name.
- Exchange.
- Sector.
- Industry.
- Universe membership.
- Current price.
- Daily change percent.
- Volume.
- Average volume.
- Relative volume.
- Daily OHLC.
- Historical candles needed for calculations.
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

### 2. On-Demand with DB Cache

Data that is useful only when opening a stock drawer or future stock details page can be fetched on demand and cached in the DB.

Examples:

- Long company description.
- CEO / employee count / website.
- Detailed company profile.
- Latest detailed news.
- Full analyst history.
- Full financial statement details.
- Full historical chart depth.
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

### 3. On-Demand Without Persistence

For early testing, some enrichment can be fetched on demand without saving.

Examples:

- Temporary provider spike results.
- One-off API endpoint testing.
- Debug-only data.
- Manual research outputs.

This should not be used for core Scanner behavior.

### 4. localStorage Only

Use localStorage only for UI state and user preferences.

Good localStorage use cases:

- Last selected Scanner filters.
- Last selected universe.
- Last selected sort.
- Collapsed/expanded panel state.
- Theme/UI preferences.
- Last selected table density.
- Temporary UI-only state.

Avoid localStorage for:

- Quotes.
- Fundamentals.
- Analyst data.
- News/catalysts.
- Scores.
- Alert state.
- Watchlist state.
- Anything needed by server-side loaders.
- Anything needed across devices.

Rule:

```txt
DB cache = data used by the system
localStorage = UI preference/state only
```

---

## Data Types, Providers, and Frequency

| Data Type | Primary Provider | Fallback | Storage | Refresh Frequency |
| --- | --- | --- | --- | --- |
| Russell 1000 membership | FMP | Manual CSV/import | DB | Monthly/manual |
| S&P 500 membership | FMP | Manual CSV/import | DB | Monthly/manual |
| Nasdaq 100 membership | FMP | Manual CSV/import | DB | Monthly/manual |
| Symbol/name/exchange | FMP | Twelve Data reference | DB | Monthly |
| Sector/industry | FMP | Twelve Data reference | DB | Monthly |
| Security type | FMP | Twelve Data reference | DB | Monthly |
| Current price | Twelve Data | Finnhub/FMP | DB | Daily |
| Daily change percent | Twelve Data | Finnhub/FMP | DB | Daily |
| Daily OHLC | Twelve Data | FMP | DB | Daily |
| Volume | Twelve Data | Finnhub/FMP | DB | Daily |
| Average volume | Internal from historical | Twelve Data/FMP | DB | Daily/weekly |
| Relative volume | Internal | None | DB | After quote sync |
| Historical daily candles | Twelve Data | FMP | DB | Daily/weekly |
| Moving averages | Internal | Twelve Data | DB | After candles sync |
| Momentum | Internal | None | DB | After candles sync |
| Volatility | Internal | None | DB | After candles sync |
| RSI/MACD | Internal preferred | Twelve Data | DB | After candles sync |
| Financial statements | FMP | None | DB/cache | Monthly/quarterly |
| Key metrics/ratios | FMP | Alpha Vantage later if needed | DB | Monthly |
| Revenue growth | FMP/Internal | None | DB | Monthly/quarterly |
| EPS growth | FMP/Internal | None | DB | Monthly/quarterly |
| Margins | FMP/Internal | None | DB | Monthly/quarterly |
| ROE | FMP/Internal | None | DB | Monthly/quarterly |
| Debt/equity | FMP/Internal | None | DB | Monthly/quarterly |
| Forward P/E | FMP | Finnhub | DB | Weekly/monthly |
| PEG | FMP | None | DB | Weekly/monthly |
| Analyst target price | FMP | Finnhub | DB | Weekly |
| Analyst recommendations | FMP | Finnhub | DB | Weekly |
| Analyst upside | Internal | None | DB | After quote update |
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

Every persisted market-data table should eventually include:

```txt
source
lastSyncedAt
sourceUpdatedAt
```

Suggested stale thresholds:

| Data Type | Stale After |
| --- | ---: |
| Quote / price | 24 hours or next market day |
| Daily OHLC | 24 hours or next market day |
| Volume / relative volume | 24 hours or next market day |
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

## Sync Priority Strategy

Because free API plans are limited, sync should be prioritized.

### Priority 1 — Watchlist

Always prioritize stocks the user is actively tracking.

Includes:

- Watchlist stocks.
- Stocks with active alerts.
- Stocks marked Ready to Buy or Waiting.

### Priority 2 — Scanner Candidates

Next prioritize stocks that are likely to matter today.

Includes:

- High daily move.
- High relative volume.
- High Hot Score.
- High Opportunity Score.
- Recent catalyst.
- Near entry zone.

### Priority 3 — Rotating Universe Batch

For the rest of Russell 1000, update gradually in batches.

Example:

```txt
Day 1: symbols 1-200
Day 2: symbols 201-400
Day 3: symbols 401-600
Day 4: symbols 601-800
Day 5: symbols 801-1000
```

---

## Manual Sync First

Before automatic scheduling, build manual sync controls.

Preferred location:

```txt
/admin/sync
```

Do not place development sync controls in the normal Scanner UI.

### Initial Manual Sync Buttons

| Button | Purpose |
| --- | --- |
| Sync Universe | Sync or seed universe/index membership |
| Sync Quotes Sample | Fetch quotes for 10-20 symbols |
| Sync Profiles Sample | Fetch reference/profile data for 10-20 symbols |
| Sync Historical Sample | Fetch daily candles for 5-10 symbols |
| Sync Fundamentals Sample | Fetch fundamentals for 3-5 symbols |
| Sync Analyst Sample | Fetch analyst data for 3-5 symbols |
| Sync News Sample | Fetch news for watchlist/top sample |

### Later Manual Sync Buttons

| Button | Purpose |
| --- | --- |
| Sync Quotes Watchlist | Update quotes for all watchlist stocks |
| Sync Quotes Russell Batch | Update a limited batch from Russell 1000 |
| Sync News Watchlist | Fetch news for watchlist stocks |
| Recalculate Scores | Recalculate Hot/Opp/Risk scores |
| Evaluate Alerts | Evaluate alert rules after quote refresh |

---

## Automatic Sync Later

Only after manual sync works reliably.

| Job | Frequency |
| --- | --- |
| Sync quotes for watchlist | Daily after market close |
| Sync quote batch for Russell 1000 | Daily rotating batch |
| Sync historical candles | Daily/weekly |
| Sync fundamentals | Monthly |
| Sync analyst targets | Weekly |
| Sync earnings calendar | Weekly |
| Sync news for watchlist/top candidates | Daily |
| Recalculate scores | After quote/fundamental sync |
| Evaluate alerts | After quote/score sync |
| Sync universe membership | Monthly |

---

## Recommended Development Phases

### Phase 9A — Market Data Sync Strategy

Create this strategy document.

No code changes.

### Phase 9B — Provider Layer Skeleton

Build provider interfaces and API clients.

Suggested files:

```txt
src/lib/market-data/types.ts
src/lib/market-data/providers/fmp.ts
src/lib/market-data/providers/twelve-data.ts
src/lib/market-data/providers/finnhub.ts
```

No full sync yet.

### Phase 9C — Admin Manual Sync Shell

Create:

```txt
/admin/sync
```

Add manual sync buttons and basic execution result display.

No cron.

### Phase 9D — First Real Sync: Quotes Sample

Fetch quotes for 10-20 symbols.

Recommended provider:

```txt
Twelve Data
```

Fallback:

```txt
Finnhub
```

Save to existing `StockQuote` model if compatible.

Add/verify:

```txt
source
lastSyncedAt
```

### Phase 9E — Profile / Reference Sync Sample

Fetch company profile/reference data for 10-20 symbols.

Recommended provider:

```txt
FMP
```

Save to `Stock` fields or a dedicated profile table if needed.

### Phase 9F — Historical Candles Sample

Fetch daily historical candles for 5-10 symbols.

Recommended provider:

```txt
Twelve Data
```

This enables internal technical calculations later.

### Phase 9G — Fundamentals / Analyst Sample

Fetch fundamentals and analyst data for 3-5 symbols.

Recommended provider:

```txt
FMP
```

This prepares the Opportunity Score.

### Phase 9H — News Sample

Fetch news for watchlist/top candidates only.

Recommended provider:

```txt
Finnhub
```

Fallback:

```txt
FMP
```

### Phase 9I — Sync Logs and Error Handling

Add persistence for sync job runs.

Possible future model:

```prisma
model SyncRun {
  id           String    @id @default(cuid())
  type         String
  provider     String
  status       String
  startedAt    DateTime  @default(now())
  finishedAt   DateTime?
  successCount Int       @default(0)
  errorCount   Int       @default(0)
  errorMessage String?
}
```

This should not be built until sync flows are real enough to justify it.

---

## MVP Sync Scope

The first useful MVP sync should not attempt to populate every data category.

Recommended MVP:

1. Manual quote sync for sample symbols.
2. Manual profile sync for sample symbols.
3. Save provider/source/timestamp.
4. Scanner reflects updated quote/profile data.
5. Build remains stable.
6. No scheduled jobs yet.
7. No scoring recalculation yet.

---

## API Limit Strategy

### Free Plan Assumptions

Known free limits from user-provided screenshots:

| Provider | Free Limit |
| --- | --- |
| FMP | 250 calls/day |
| Finnhub | 60 calls/minute |
| Twelve Data | 8 API credits/minute, 800 credits/day |

Because endpoint credit costs vary, do not assume full Russell 1000 sync is possible for all data types under free plans.

### Free Mode Rules

- Use sample sizes first.
- Avoid full universe deep sync.
- Prefer batch endpoints where credits are acceptable.
- Prioritize watchlist.
- Prioritize active alerts.
- Prioritize top scanner candidates.
- Update slow-changing data weekly/monthly.
- Store timestamps to avoid repeated calls.
- Never call APIs repeatedly from render paths.

---

## What Not to Build Yet

Do not build these until later:

- Full Russell 1000 quote sync.
- Full fundamentals sync for all stocks.
- Full news sync for all stocks.
- Scheduled cron jobs.
- Alert evaluation engine.
- Score recalculation engine.
- AI news summarization.
- Real-time streaming.
- Multi-provider reconciliation.
- Paid-plan optimization.
- User-facing sync controls.

---

## Open Questions

1. Which provider will be tested first for quote sync: Twelve Data or Finnhub?
2. Does the existing `StockQuote` model already support all fields needed for quote sync?
3. Should profile data be stored directly on `Stock` or in a separate `StockProfile` table?
4. Do we need a `StockCandle` table before calculating technical indicators?
5. Should `/admin/sync` be hidden behind a simple dev-only flag?
6. How should API keys be stored per environment?
7. Should sync results be logged in DB from the first implementation phase, or only printed in the UI initially?
8. Should on-demand drawer enrichment be built before or after scheduled sync?

---

## Current Recommendation

Next implementation step:

```txt
Phase 9B — Provider Layer Skeleton
```

Then:

```txt
Phase 9C — Admin Manual Sync Shell
```

Then:

```txt
Phase 9D — Quotes Sample Sync
```

Do not build scheduled sync yet.

Do not build scoring engine yet.

Do not connect APIs directly to Scanner render logic.
