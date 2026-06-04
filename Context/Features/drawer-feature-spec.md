# Drawer Feature Specification — FomoFilter

## When To Read This File

Read this file before changing:

```txt
Stock preview drawer
Drawer header
Drawer decision workspace
Drawer narrative section
Drawer signal cards
Drawer market position visual
Drawer watchlist/alert actions
Drawer evidence accordions
Drawer layout/responsiveness
```

---

## When To Update This File

Update this file after QA and before commit approval if you change drawer behavior, data source, layout, actions, sections, or labels.

---

## Current Phase

Phase 21C completed (Phase 21C Refinement applied).

---

## Product Role

```txt
Scanner Row      = fast comparison across stocks
Expanded Row     = detailed dry data view for deeper research
Drawer           = visual decision cockpit / decision workspace
Stock Details    = future full research page (not yet implemented)
```

The Drawer is **not** a copy of the expanded row. It synthesizes data into a decision-focused layout. The expanded row remains the primary place for dry metric tables.

---

## Current Drawer Implementation

The drawer is a real DB-backed **Visual Decision Cockpit** implemented in Phase 21C (refined in Phase 21C Refinement).

It reads all content from the `stock: HotStock` object, populated by `getScannerData()` from Prisma models:

```txt
Stock (symbol, name, sector, industry, description, marketCap)
StockQuote (price, changePercent, week52High/Low, priceAvg50/200, quoteLastSynced, source)
StockScore (oppScore, fundamentalScore, growthScore, profitabilityScore, valuationScore, financialHealthScore, riskContextScore)
StockAnalystData (analystRating, analystCount, targets, upside, source, lastSyncedAt)
StockMetric (all valuation, growth, margin, financial health ratios)
WatchlistItem (via dbWatchlistItems prop)
AlertRule (via alertRulesBySymbol prop)
```

It does NOT depend on `StockDrawerDetail`.

---

## Drawer Sections

```txt
Hero Decision Header (sticky)
Why This Stock Stands Out (rule-based narrative)
Key Decision Signals (5 visual cards)
Market Position Visual (52W bar with markers + compact stats)
My Tracking Plan (watchlist CTA or watchlist state)
Alerts (active alerts + Set Alert CTA)
Evidence / Details (collapsible accordions):
  - Analyst Details
  - All Scores
  - Fundamentals
  - Company & Data Freshness
Sticky Actions Footer
```

---

## Hero Decision Header

Gradient background based on opportunity strength:

```txt
Strong Opportunity → emerald gradient
Attractive         → light emerald gradient
Watch              → amber gradient
Lower Priority     → neutral gradient
```

Shows:

```txt
Symbol
Company name
Sector · Industry (subtext)
Universe/index tags (Nasdaq 100, S&P 500, Russell 1000)
Alert Active chip (if real active alerts)
Watchlist star (if in watchlist)
Current price
Day %
Decision Tag badge (with tooltip)
4 metric pills: Opportunity, Fundamental, Upside, Stability
Quote synced date
Close button
```

Does not show:

```txt
stock.setup (legacy setupStatus)
stock.risk / Risk: MEDIUM (legacy riskLevel)
stock.catalyst
signal quality
hardcoded "US Stocks"
detail.lastUpdatedMinutes
```

---

## Why This Stock Stands Out

Rule-based narrative section. **Not AI-generated. Not labeled as AI.**

Content:
- Short headline summarizing the primary signal
- Summary sentence with specific signal positives
- Strength chips (green)
- Concern chips (amber)
- "Next check" box — the most important concern or caution

Built by `buildStockDecisionNarrative(stock)` in `src/lib/scoring/decision-summary.ts`.

Uses only DB-backed fields. Does not call any provider. Does not invent facts.

Labeled with: "Rule-based · DB-backed"

Language is cautious:
- "stands out because", "worth reviewing", "check whether", "verify whether"
- Never uses: buy, sell, guaranteed, safe, will go up

---

## Key Decision Signals

5 visual cards in a 2-column grid (last card spans full width if 5th is last odd):

```txt
Quality        — based on fundamentalScore
Valuation      — based on valuationScore
Analysts       — based on analystUpsidePercent + analystRatingNormalized
Stability      — based on riskContextScore
Price Position — based on 52W range position or priceAvg50
```

Each card has:
- Colored left accent bar
- Status label (e.g., "Strong", "Reasonable", "Elevated")
- Detail line (e.g., "Fundamental 88 — strong quality signals")
- Color coding: emerald (favorable), blue (neutral), amber (needs check), red (concern)

Built by `buildSignalCards(stock)` in `src/lib/scoring/decision-summary.ts`.

---

## Market Position Visual

A visual 52W range bar with markers:

```txt
Horizontal bar with gradient zone (green → neutral → amber)
White vertical marker — current price position
Amber vertical marker — 50-day moving average (if available)
Blue vertical marker  — 200-day moving average (if available)
Legend below bar
```

Below the bar: compact 2-column stats grid:

```txt
Current Price | Day %
52W High      | 52W Low
Avg 50        | Avg 200
Beta
```

No historical chart. A historical chart tab must not be shown until real historical price-per-date data exists in the DB.

---

## My Tracking Plan

If **not in watchlist:**
- Large CTA card with explanatory copy
- "Add to Watchlist" button

If **in watchlist:**
- Watchlist status chip
- Entry zone / Target / Stop loss cards (if entered by user)
- Tracking reason / notes
- "Edit" action button inline

Preserves all existing Add/Edit/Remove watchlist server actions unchanged.

---

## Alerts

Separate section from "My Tracking Plan":

- Active alert rules list (type, threshold, frequency)
- "Set Alert" button in section header
- HOT_SCORE_ABOVE alerts display as "Hot Score Above (legacy)" and do not crash
- New alert creation does not offer "Hot Score Above" as an option

---

## Evidence (Collapsible Accordions)

Collapsed by default. Contains detailed dry evidence used to support the decision workspace.

### Analyst Details

```txt
Stars + rating + label
Analyst count
Consensus Target
Analyst Upside %
Target High / Median / Low
Analyst Synced date
Source
```

### All Scores

```txt
7 score bars: Opportunity, Fundamental, Growth, Profitability, Valuation, Financial Health, Stability
Score versions and calculation dates
```

### Fundamentals

Grouped into Valuation, Growth & Profitability, Financial Health — same metrics as scanner expanded row.

### Company & Data Freshness

```txt
Company name, sector/industry, market cap, description (4-line clamp)
Quote / Metrics / Analyst sync dates and sources
Opportunity and Fundamental calculation dates
```

---

## Sticky Actions Footer

Always visible at bottom:

```txt
In watchlist: Edit Watchlist + Alert
Not in watchlist: Add to Watchlist + Alert
```

Removed:
- View Full Details (non-functional)
- Details (non-functional)

---

## Alert Creation

Alert type options in UI:

```txt
Price Above
Price Below
Opportunity Score Above
Relative Volume Above
```

Removed from UI: `Hot Score Above`

DB enum `HOT_SCORE_ABOVE` is preserved. Existing alerts display as `Hot Score Above (legacy)`. No schema change.

---

## Shared Logic

`src/lib/scoring/decision-summary.ts` exports:

```txt
buildDecisionSummary(stock)          — Decision Tag, Strengths, Concerns (shared with ScannerExpandedRow)
ratingToStars(stock)                  — star rating (shared with ScannerExpandedRow)
buildStockDecisionNarrative(stock)   — Drawer narrative: headline, summary, mainCheck
buildSignalCards(stock)              — 5 signal cards for decision cockpit
```

`StockPreviewDrawer` and `ScannerExpandedRow` both import from this shared utility.

---

## StockDrawerDetail Model

The `StockDrawerDetail` Prisma model remains in the schema but is no longer used by the Drawer or any UI render path.

It is not queried in:

```txt
getScannerData()
ScannerPageClient
StockPreviewDrawer
```

May be cleaned up (migration to drop the table) in a future phase.

---

## Data Source Rule

```txt
No provider calls from Drawer.
All data read from DB via getScannerData().
getScannerData() does NOT include drawerDetail in its Prisma query.
Historical chart tabs must not be shown until real price-history DB data exists.
```

---

## Related Docs

```txt
Context/Features/scanner-feature-spec.md
Context/scoring-system.md
Context/Algorithms/scanner-decision-tags.md
Context/Algorithms/opportunity-score-v2.md
Context/Algorithms/analyst-rating-and-upside.md
Context/data-model.md
Context/sync-workflows.md
```
