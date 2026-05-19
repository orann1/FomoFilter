# Scanner Full Feature Specification

## Feature Name

Scanner — Market Universe, Data Provider, Scoring Engine, Ranking, and Alert Evaluation

## Purpose

The Scanner is the core discovery engine of FomoFilter.

The current Scanner foundation already provides the page, filters, sorting, DB-backed data, mobile cards, and reuse of the existing Stock Preview Drawer.

This document defines the full Scanner roadmap after the foundation stage: how the app will move from seeded/demo data to a real stock discovery system that scans a large market universe, pulls market data from external providers, calculates scores, ranks stocks, detects setups/catalysts, and powers alerts.

---

## Product Goal

The Scanner should help users answer:

> Which stocks are worth looking at right now, why are they moving, and are they real opportunities or FOMO traps?

The Scanner should not simply show “stocks that went up today.” It should combine:

- Market activity
- Price momentum
- Relative volume
- Fundamentals
- Valuation
- Analyst upside
- Technical setup
- Catalysts
- Risk signals
- User watchlist context
- Active alerts

The output should be a ranked, filterable list of stocks that helps the user decide what deserves attention.

---

## Core User Value

The final Scanner should:

1. Scan a large stock universe such as Russell 1000, S&P 500, Nasdaq 100, or NYSE/Nasdaq common stocks.
2. Pull fresh market and company data from one or more providers.
3. Calculate Hot Score, Opportunity Score, Risk Level, Setup Status, and Signal Quality.
4. Rank stocks according to the selected scanner view.
5. Explain why each stock appears.
6. Let users open the existing Stock Preview Drawer for quick research.
7. Let users add/edit/remove watchlist entries and create alerts.
8. Eventually trigger alerts based on real market conditions.

---

## Current State Before This Roadmap

Already implemented:

- Dashboard page
- Scanner foundation page at `/scanner`
- DB-backed scanner data loader
- Search, filters, sorting, view pills
- Desktop scanner table
- Mobile scanner cards
- Existing Stock Preview Drawer reused from Scanner and Dashboard
- Add/Edit/Remove Watchlist actions persisted with Prisma
- Create Alert action persisted with Prisma
- Alert Active indicator
- Prisma + Neon data layer
- Seed data

Not yet implemented:

- Real market universe import
- External market data API integration
- Quote sync jobs
- Fundamentals sync
- Analyst data sync
- News/catalyst sync
- Scoring engine
- Setup classification engine
- Scanner-specific ranking engine
- Scheduled sync
- Alert evaluation engine
- Large universe performance handling

---

## Product Boundary

FomoFilter is a research and decision-support tool, not a financial advisor.

Avoid:

- “Buy this stock”
- “Guaranteed upside”
- “Safe investment”
- “This will go up”

Use:

- “Worth tracking”
- “Potential opportunity”
- “Momentum signal”
- “High-risk setup”
- “Possible FOMO risk”
- “Needs confirmation”
- “Watch for pullback”
- “Requires further validation”

---

## Final Scanner Views

The Scanner should support multiple predefined views. Each view ranks the same stock universe differently.

| View | Purpose | Primary Ranking Logic |
| --- | --- | --- |
| All Stocks | Show the full scannable universe | Default / Best Signal |
| Hot Today | Stocks with strong current activity | Hot Score + relative volume + daily move |
| Strong Momentum | Sustained short-term price strength | Momentum + trend + volume |
| Best Opportunities | High opportunity with acceptable risk | Opportunity Score + analyst upside + valuation |
| Unusual Volume | Volume spikes vs average | Relative volume |
| FOMO Risk | Stocks that may be overextended | Hot Score + risk + low entry quality |
| Near Entry | Stocks close to a reasonable entry zone | Entry quality + opportunity |
| Pullback Watch | Hot stocks that need a better entry | Momentum + overextension penalty |
| Earnings Crash Watch | Potential overreactions after earnings | Drop + quality + recovery potential |
| Analyst Favorites | Strong analyst support / upside | Analyst rating + target upside |
| Quality Growth | Growth + profitability + financial strength | Fundamentals + opportunity |
| Cheap Growth | Growth with reasonable valuation | Growth + valuation |

---

## Target Scanner Columns

The Scanner table should eventually support the following columns.

### Core Columns

| Column | Purpose |
| --- | --- |
| Star | Watchlist state |
| Symbol / Company | Stock identity |
| Sector / Industry | Classification |
| Price | Latest price |
| Daily Change % | Current session movement |
| Weekly Change % | Short-term trend |
| Monthly Change % | Medium-term trend |
| Relative Volume | Volume anomaly |
| Hot Score | Current market heat |
| Opportunity Score | Potential attractiveness |
| Risk Level | Risk classification |
| Setup Status | Suggested tracking state |
| Signal Quality | Final qualitative label |
| Analyst Upside | Upside to target |
| Analyst Rating | Consensus view |
| Catalyst | Why the stock is moving |
| Alert Active | User alert state |

### Later Optional Columns

| Column | Purpose |
| --- | --- |
| Market Cap | Size filter |
| Forward P/E | Valuation |
| PEG Ratio | Valuation vs growth |
| Revenue Growth | Growth quality |
| EPS Growth | Earnings growth |
| Gross Margin | Profitability |
| ROE | Capital efficiency |
| Debt/Equity | Financial risk |
| RSI | Technical momentum |
| Price vs SMA50 | Trend / entry quality |
| 52w High Distance | Overextension |
| Earnings Date | Event risk |

---

## Final Scanner Filters

### MVP/Current Filters

- Search by ticker/company
- View pills
- Sector
- Risk
- Setup
- Watchlist only
- Alert active only

### Future Filters

| Filter | Values / Example |
| --- | --- |
| Universe | S&P 500, Russell 1000, Nasdaq 100, NYSE/Nasdaq |
| Exchange | NASDAQ, NYSE, AMEX |
| Market Cap | Large, Mid, Small, custom range |
| Sector | Technology, Healthcare, Financials, etc. |
| Industry | Semiconductors, Software, Banks, etc. |
| Price Range | $5–$50, $50–$200, custom |
| Daily Change | Above/below % |
| Weekly Change | Above/below % |
| Monthly Change | Above/below % |
| Relative Volume | Above 1.5x, 2x, 3x |
| Hot Score | Above threshold |
| Opportunity Score | Above threshold |
| Risk Level | Low, Medium, High, Extreme |
| Setup Status | Near Entry, Extended, Pullback Watch, etc. |
| Analyst Upside | Above % |
| Analyst Rating | Buy, Hold, Sell, Strong Buy |
| Valuation | Forward P/E, PEG ranges |
| Fundamental Quality | Growth/margin/ROE thresholds |
| Earnings Window | Before/after earnings |
| Catalyst Type | Earnings, analyst, news, volume, breakout |
| Watchlist | In / not in watchlist |
| Alerts | Has active alert / no alert |

---

## Final Scanner Sorting Options

| Sort | Purpose |
| --- | --- |
| Best Signal | Main combined ranking |
| Hot Score | Most active/hot stocks |
| Opportunity Score | Best opportunity setups |
| Daily Change | Largest daily movers |
| Weekly Momentum | Strong short-term trend |
| Relative Volume | Most unusual volume |
| Analyst Upside | Highest target upside |
| Risk Level | Sort by risk |
| Entry Quality | Best entry setup |
| Market Cap | Size-based sorting |
| Catalyst Strength | Strongest reason for move |

---

# Suggested Development Phases

## Phase 8 — Market Universe Definition

### Goal

Define what stocks the Scanner will scan.

The app needs a clear universe before connecting external APIs or calculating scores.

### Scope

Decide and document the first supported market universe.

Potential options:

- S&P 500
- Nasdaq 100
- Russell 1000
- NYSE + Nasdaq common stocks
- Custom curated universe
- User watchlist only

Recommended starting point:

> Russell 1000 or S&P 500 for quality and coverage, then expand later.

### Decisions Required

- Include ETFs?
- Include ADRs?
- Include penny stocks?
- Include OTC?
- Minimum market cap?
- Minimum price?
- Minimum volume?
- Include inactive/delisted stocks?
- How often to refresh the universe?

### DB Considerations

Existing `Stock` model likely needs or already has:

- `symbol`
- `name`
- `exchange`
- `sector`
- `industry`
- `marketCap`
- `isActive`

Potential future additions:

- `isEtf`
- `isAdr`
- `country`
- `currency`
- `universeTags`
- `lastUniverseSyncAt`

Avoid schema changes unless the existing schema cannot support the selected universe.

### Output

- Documented first universe decision
- Universe inclusion/exclusion rules
- Minimal DB mapping required
- No external API integration yet

### Out of Scope

- API connection
- Quote sync
- Scoring
- Scheduled jobs

---

## Phase 9 — Market Data Provider Research and Decision

### Goal

Choose the first external data provider based on actual Scanner requirements.

### Providers to Compare

- Financial Modeling Prep
- Twelve Data
- Finnhub
- Polygon.io
- Alpha Vantage
- Nasdaq data sources
- IEX Cloud / other available providers

### Evaluation Criteria

| Criteria | Why It Matters |
| --- | --- |
| Price | Monthly cost and scaling |
| Rate limits | Ability to scan hundreds/thousands of stocks |
| Quotes | Current price/change/volume |
| Historical prices | Momentum and technical calculations |
| Fundamentals | Opportunity Score inputs |
| Analyst targets | Analyst upside and ratings |
| News | Catalyst detection |
| Earnings | Earnings crash watch |
| Bulk endpoints | Efficient sync |
| Commercial use | Monetization/legal safety |
| Data freshness | Real-time vs delayed |
| Reliability | Production use |
| Documentation | Development speed |

### Required Data Categories

Minimum for first useful Scanner:

- Company profile
- Current quote
- Daily change
- Volume
- Average volume
- Market cap
- Sector/industry
- Analyst target/upside if available
- Basic fundamentals if available

Later:

- Earnings
- News
- Historical prices
- Technical indicators
- Insider activity
- Short interest

### Output

- Provider comparison table
- Recommended provider
- Backup provider
- Cost/rate-limit notes
- API limitations
- First integration scope

### Out of Scope

- Writing provider code
- Changing DB schema
- Syncing data

---

## Phase 10 — Market Data Provider Layer

### Goal

Create an abstraction layer for external market data access.

The app should not call an external provider directly from UI, actions, or random services.

### Suggested Structure

```txt
src/lib/market-data/
  provider.ts
  types.ts
  fmp-provider.ts
  twelve-data-provider.ts
  index.ts
```

### Provider Interface Example

```ts
export interface MarketDataProvider {
  getCompanyProfiles(symbols: string[]): Promise<CompanyProfile[]>;
  getQuotes(symbols: string[]): Promise<MarketQuote[]>;
  getHistoricalPrices(symbol: string, range: string): Promise<HistoricalPrice[]>;
  getAnalystTargets(symbols: string[]): Promise<AnalystTarget[]>;
  getNews(symbols: string[]): Promise<MarketNewsItem[]>;
}
```

### Implementation Notes

- Use environment variables for API keys.
- Never expose API keys to client components.
- Handle provider errors gracefully.
- Normalize provider-specific responses into internal types.
- Add basic logging for failures.
- Use batching where possible.
- Respect rate limits.

### Output

- Provider abstraction
- One initial provider implementation
- Normalized internal types
- No UI changes required

### Out of Scope

- Scheduled sync
- Full scoring engine
- Alert evaluation
- Multi-provider fallback unless easy

---

## Phase 11 — Stock Universe Import / Sync

### Goal

Populate or update the `Stock` table with a real market universe.

### Scope

- Fetch/import list of symbols
- Create or update stocks
- Update company name
- Update exchange
- Update sector/industry
- Mark inactive stocks
- Prevent duplicates
- Log sync results

### Suggested Sync Strategy

- Use upsert by `symbol`
- Normalize symbols consistently
- Use transaction or safe batching
- Add sync logs
- Keep idempotent behavior

### DB Entities Involved

- `Stock`
- `DataProviderSyncLog` if available

### Output

- Real stock universe in DB
- Repeatable sync command or script
- Sync log

### Out of Scope

- Price data
- Scoring
- Alerts
- Real-time updates

---

## Phase 12 — Quote and Price Sync

### Goal

Fetch current market quote data for the universe and store it in the DB.

### Data to Sync

- Current price
- Previous close
- Open
- Day high/low
- Volume
- Average volume
- Relative volume
- Daily change %
- 52-week high/low
- Captured timestamp

### DB Entities

- `StockQuote`

### Behavior

- For each stock, store/update latest quote snapshot.
- Decide whether to keep historical snapshots or only latest.
- Use batching to avoid rate-limit issues.
- Handle missing data safely.
- Record sync status.

### Scanner Impact

After this phase, Scanner should show real current market values instead of seeded demo values.

### Out of Scope

- Fundamentals
- Analyst data
- Scoring recalculation
- News/catalysts
- Scheduled cron

---

## Phase 13 — Fundamentals and Analyst Data Sync

### Goal

Sync the data needed for Opportunity Score and analyst-based scanner views.

### Fundamentals to Sync

- Revenue growth YoY
- EPS growth YoY
- ROE
- Gross margin
- Operating margin
- Net margin
- Debt/equity
- Current ratio
- Forward P/E
- PEG ratio
- Free cash flow

### Analyst Data to Sync

- Consensus rating
- Target price
- Upside %
- Strong buy / buy / hold / sell counts
- Latest changes if available

### DB Entities

- `StockMetric`
- `AnalystSnapshot`

### Scanner Impact

Enables:

- Best Opportunities
- Analyst Favorites
- Cheap Growth
- Quality Growth
- Opportunity Score calculation

### Out of Scope

- Full financial statement modeling
- Multi-year historical fundamentals
- Paid premium datasets unless approved

---

## Phase 14 — Scoring Engine v1

### Goal

Calculate real Hot Score, Opportunity Score, Risk Level, and component scores from DB data.

### Suggested Modules

```txt
src/lib/scoring/
  normalize.ts
  hot-score.ts
  opportunity-score.ts
  risk-level.ts
  setup-status.ts
  signal-quality.ts
  calculate-stock-score.ts
```

### Hot Score Inputs

- Daily change %
- Weekly change %
- Monthly change %
- Relative volume
- Price vs moving averages
- Breakout signal
- Catalyst strength
- Sector momentum

### Opportunity Score Inputs

- Analyst upside
- Fundamental quality
- Valuation
- Growth
- Entry quality
- Risk penalty

### Risk Level Inputs

- Extreme price move
- Overextension from moving averages
- High volatility
- Negative analyst upside
- Weak fundamentals
- High debt
- Low liquidity
- Very high relative volume without catalyst

### Component Scores

Store component scores to explain the result:

- `momentumScore`
- `volumeScore`
- `catalystScore`
- `analystScore`
- `fundamentalsScore`
- `technicalScore`
- `valuationScore`

### Output

- `StockScore` updated for each stock
- Scanner ranks by calculated scores
- Drawer score breakdown reflects calculated values

### Important Rule

Scoring should be explainable. Avoid black-box scores.

### Out of Scope

- AI-generated scoring
- Full backtesting
- Portfolio recommendations

---

## Phase 15 — Setup Classification Engine

### Goal

Classify each stock into an actionable setup label.

### Setup Status Examples

- Near Entry
- Pullback Watch
- Extended
- Track
- Avoid
- Needs Confirmation
- FOMO Risk
- Earnings Crash Watch
- Breakout Candidate
- Oversold Opportunity

### Logic Examples

| Setup | Possible Logic |
| --- | --- |
| Near Entry | Good opportunity score + price near support/entry zone |
| Pullback Watch | Hot stock but above ideal entry |
| Extended | Strong move + overbought/overextended |
| Track | Interesting but needs more confirmation |
| Avoid | Weak opportunity + high risk |
| FOMO Risk | High hot score + high risk + weak entry quality |
| Earnings Crash Watch | Large post-earnings drop + quality not broken |
| Breakout Candidate | Price near/above resistance + volume confirmation |

### Output

- Setup status for each stock
- Setup explanations where possible
- Scanner view filters become more meaningful

### Out of Scope

- Manual user setup tagging
- Complex technical backtesting

---

## Phase 16 — Catalyst Detection v1

### Goal

Detect or infer why a stock is moving.

### Catalyst Sources

- Earnings beat/miss
- Analyst upgrade/downgrade
- News headlines
- Unusual volume
- Sector move
- 52-week breakout
- Major daily move
- Guidance change
- Product/company announcement

### Initial Approach

Start simple:

- Use provider news if available
- Use earnings calendar/results if available
- Use analyst target/rating changes if available
- Use volume/momentum as fallback catalyst

### Catalyst Fields

Potential fields:

- `catalystType`
- `catalystTitle`
- `catalystSummary`
- `catalystConfidence`
- `source`
- `publishedAt`

### Scanner Impact

Enables the key question:

> Why is this stock showing up?

### Out of Scope

- Full AI news interpretation
- Sentiment engine
- Paid news feeds unless approved

---

## Phase 17 — Scanner Ranking Logic

### Goal

Define how each Scanner view sorts and prioritizes stocks.

### Best Signal Example

```txt
Best Signal =
  Hot Score * 0.35 +
  Opportunity Score * 0.35 +
  Catalyst Score * 0.15 -
  Risk Penalty * 0.15
```

### View-Specific Ranking Examples

| View | Ranking Logic |
| --- | --- |
| Hot Today | Hot Score + relative volume + daily change |
| Best Opportunities | Opportunity Score + analyst upside + quality |
| FOMO Risk | Hot Score + Risk Level + low entry quality |
| Near Entry | Opportunity Score + entry quality |
| Unusual Volume | Relative volume descending |
| Earnings Crash Watch | Drop % + quality + analyst upside |
| Analyst Favorites | Analyst rating + upside |
| Quality Growth | Fundamentals + opportunity |

### Implementation Notes

- Keep ranking logic isolated.
- Make ranking explainable.
- Avoid hardcoding logic inside UI components.
- Add helper functions for view filtering and sorting.

### Output

- Consistent default scanner rankings
- Clear reason why stocks appear in each view

---

## Phase 18 — Scheduled Sync / Cron

### Goal

Automate data refreshes.

### Sync Types

| Sync | Frequency |
| --- | --- |
| Universe sync | Weekly / manual |
| Quote sync | Every X minutes during market hours |
| Fundamentals sync | Daily / weekly |
| Analyst sync | Daily |
| News/catalyst sync | Several times per day |
| Score recalculation | After relevant data sync |
| Alert evaluation | After quote/score sync |

### Possible Tools

- Vercel Cron
- Inngest
- Trigger.dev
- GitHub Actions for manual/dev jobs

### Requirements

- Prevent overlapping jobs
- Log sync success/failure
- Handle API rate limits
- Retry safely
- Keep jobs idempotent

### Output

- Automated refresh pipeline
- Scanner stays current without manual intervention

---

## Phase 19 — Alert Evaluation Engine

### Goal

Evaluate saved `AlertRule` records against live DB data and create triggered alert events.

### Supported Alert Types

- Price above
- Price below
- Daily change above
- Daily change below
- Relative volume above
- Hot Score above
- Opportunity Score above
- New catalyst detected
- Setup changed
- Risk level changed

### DB Entities

- `AlertRule`
- `AlertEvent`
- `RecentAlert` or replacement if still used

### Behavior

- Load active alert rules
- Check current quote/score data
- Create alert event if condition is met
- Avoid duplicate spam
- Respect frequency setting
- Show triggered alerts in UI

### Out of Scope

- Email delivery initially
- Push notifications
- SMS
- Complex notification preferences

---

## Phase 20 — Advanced Scanner UX

### Goal

Improve Scanner usability after real data and scoring exist.

### Features

- Saved custom views
- URL query params for filters
- Column visibility
- Server-side pagination
- Server-side sorting/filtering for large universes
- Export results
- Compare stocks
- “Why ranked here?” tooltip
- Score breakdown tooltip
- Filter drawer on mobile
- Sector heatmap
- Watchlist overlay
- AI-generated daily scanner summary

### Out of Scope Initially

Do not build these before the data/scoring foundation is reliable.

---

# Data Model Overview for Full Scanner

## Existing / Expected Entities

| Entity | Purpose |
| --- | --- |
| Stock | Core stock identity |
| StockQuote | Current and historical quote snapshots |
| StockMetric | Fundamentals and valuation |
| StockTechnical | Technical indicators |
| AnalystSnapshot | Ratings and target price |
| NewsItem | News/catalyst data |
| StockScore | Calculated scores and components |
| StockDrawerDetail | Drawer-specific details |
| WatchlistItem | User tracking context |
| AlertRule | Saved alert rule |
| AlertEvent | Triggered alerts |
| MarketStat | Market overview |
| DataProviderSyncLog | Sync status |

## Potential Future Fields

Only add these if required:

### Stock

- `isEtf`
- `isAdr`
- `universeTags`
- `lastUniverseSyncAt`

### StockQuote

- `weekChangePercent`
- `monthChangePercent`
- `avgVolume`
- `relativeVolume`
- `fiftyTwoWeekHigh`
- `fiftyTwoWeekLow`
- `distanceFrom52wHighPercent`
- `distanceFrom52wLowPercent`

### StockScore

- `bestSignalScore`
- `signalQuality`
- `setupStatus`
- `fomoRiskScore`
- `entryQualityScore`

### NewsItem / Catalyst

- `catalystType`
- `catalystConfidence`
- `isMajorCatalyst`

---

# Development Rules for AI Agents

When implementing these phases:

1. Investigate existing code and schema before adding anything.
2. Do not duplicate models, actions, data loaders, components, or mapping logic.
3. Do not create Prisma migrations unless the current schema truly cannot support the phase.
4. Prefer provider/data/scoring logic in isolated modules.
5. Keep UI components free of API/provider logic.
6. Keep secrets on the server only.
7. Use idempotent sync operations.
8. Use DB-backed data as source of truth.
9. Keep Scanner and Dashboard data contracts compatible where practical.
10. Reuse the existing Stock Preview Drawer and drawer actions.
11. Build one phase at a time.
12. Run build and Prisma validation before commit.

---

# Recommended Order

The recommended order from here:

1. Phase 8 — Market Universe Definition
2. Phase 9 — Market Data Provider Research and Decision
3. Phase 10 — Market Data Provider Layer
4. Phase 11 — Stock Universe Import / Sync
5. Phase 12 — Quote and Price Sync
6. Phase 13 — Fundamentals and Analyst Data Sync
7. Phase 14 — Scoring Engine v1
8. Phase 15 — Setup Classification Engine
9. Phase 16 — Catalyst Detection v1
10. Phase 17 — Scanner Ranking Logic
11. Phase 18 — Scheduled Sync / Cron
12. Phase 19 — Alert Evaluation Engine
13. Phase 20 — Advanced Scanner UX

---

# Open Questions

These should be answered before or during the relevant phase:

1. What is the first stock universe?
2. Which external API provider will be used first?
3. What data freshness is acceptable for MVP?
4. Is delayed quote data acceptable?
5. How many stocks should be scanned in the first version?
6. How often should quotes be refreshed?
7. Which scoring inputs are available from the selected provider?
8. Should Scanner ranking be transparent to users?
9. Should user-defined saved scanner views be Pro-only later?
10. When should auth be introduced?

---

# Success Criteria for the Full Scanner

The Scanner is successful when:

- It scans a real stock universe.
- It displays fresh DB-backed quote data.
- It calculates real scores.
- It ranks stocks according to clear view-specific logic.
- It explains why stocks appear.
- It allows users to track and alert on stocks.
- It updates automatically.
- It avoids obvious FOMO traps by showing risk and entry quality.
- It becomes a daily decision-support tool for discovering potential opportunities.

---

🏗️ **FomoFilter Scanner — Find the signal. Filter the FOMO.**
