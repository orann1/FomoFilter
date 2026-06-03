# Opportunity Score v2 — FomoFilter

## When To Read This File

Read this file before changing:

```txt
Opportunity Score formula
Opportunity Score weights
Analyst upside scoring
Analyst sentiment scoring
Price position scoring
Opportunity Score version
Scanner Opportunity column
Drawer Opportunity score
Score Methodology text for Opportunity Score
```

---

## When To Update This File

Update this file after QA and before commit approval if you change:

```txt
Opportunity Score formula
Component weights
Input fields
Missing-data behavior
Analyst upside scoring
Analyst sentiment scoring
Price position scoring
Version name
```

Also update:

```txt
Context/scoring-system.md
Context/Features/admin-sync-feature-spec.md if Score Methodology UI changes
Context/feature-history.md when phase is completed
```

---

## Status

Implemented.

Current version:

```txt
opportunity-v2
```

Stored in:

```txt
StockScore.oppScore
StockScore.oppScoreVersion
StockScore.oppCalculatedAt
```

---

## Purpose

Opportunity Score answers:

```txt
Is this stock an attractive opportunity right now based on quality, valuation, analyst upside, sentiment, price position, and stability?
```

It is not a buy recommendation.

It is a prioritization score for research.

---

## Data Source

Opportunity Score is calculated from persisted database data only.

No provider calls are allowed during score calculation.

Correct flow:

```txt
Company Data Sync + Daily Market Data Sync
→ DB data
→ Calculate Fundamental Scores if needed
→ Calculate Opportunity Scores
→ StockScore.oppScore
→ Scanner / Dashboard / Drawer
```

---

## Current Formula

Opportunity Score v2 uses 7 components:

| Component | Weight | Source |
| --- | ---: | --- |
| Fundamental Quality | 25% | `StockScore.fundamentalScore` |
| Valuation | 20% | `StockScore.valuationScore` |
| Growth | 15% | `StockScore.growthScore` |
| Analyst Upside | 20% | `StockAnalystData.analystUpsidePercent` |
| Analyst Sentiment / Confidence | 10% | `StockAnalystData` recommendation counts |
| Price Position | 5% | `StockQuote.week52High`, `StockQuote.week52Low`, current price |
| Stability / Risk Context | 5% | `StockScore.riskContextScore` |

Total:

```txt
100%
```

---

## Required Core Input

Fundamental Quality is required.

If `fundamentalScore` is missing, Opportunity Score should return null or skip the stock according to the implementation.

---

## Missing Data Behavior

Missing optional components should be excluded and weights should be normalized across available components.

Do not treat missing analyst upside, sentiment, price position, or risk context as zero unless explicitly changing the algorithm.

Expected behavior:

```txt
Missing required fundamental score → no Opportunity Score
Missing optional component → re-normalize available weights
```

---

## Analyst Upside Component

Purpose:

```txt
Reward stocks with positive analyst target upside.
```

Source:

```txt
StockAnalystData.analystUpsidePercent
```

Raw DB value must not be modified by scoring.

Scoring may cap upside for scoring purposes.

Current design:

```txt
Analyst upside is capped at 60% for scoring.
Raw analystUpsidePercent remains unchanged.
```

Interpretation:

```txt
High positive upside improves Opportunity Score.
Low or negative upside reduces this component.
```

---

## Analyst Sentiment / Confidence Component

Purpose:

```txt
Reward broad positive analyst support while reducing confidence when analyst coverage is thin.
```

Source:

```txt
strongBuyCount
buyCount
holdCount
sellCount
strongSellCount
analystCount
```

Conceptual approach:

```txt
Calculate weighted recommendation sentiment.
Apply confidence adjustment based on analyst count.
Thin coverage should pull sentiment toward neutral.
```

User-facing label:

```txt
Rating
Analyst Rating
```

Detailed mapping lives in:

```txt
Context/Algorithms/analyst-rating-and-upside.md
```

---

## Price Position Component

Purpose:

```txt
Avoid over-rewarding stocks that may already be extremely stretched.
```

Source:

```txt
Current price
52-week high
52-week low
```

Current conceptual formula:

```txt
position = (price - week52Low) / (week52High - week52Low)
```

Current scoring concept:

| 52W Position | Score |
| --- | ---: |
| 0.20–0.60 | 100 |
| 0.60–0.80 | 75 |
| 0.80–0.95 | 50 |
| >0.95 | 30 |
| 0.00–0.20 | 60 |

If 52-week range is missing or invalid:

```txt
component = null
re-normalize weights
```

---

## Stability / Risk Context Component

Internal source field:

```txt
StockScore.riskContextScore
```

User-facing label:

```txt
Stability
```

Meaning:

```txt
Higher Stability means more favorable / lower-risk context.
```

Do not display this as `Risk` in UI.

---

## Score Interpretation

| Score | Meaning |
| ---: | --- |
| 80–100 | Strong opportunity |
| 75–79 | High opportunity |
| 60–74 | Attractive / worth reviewing |
| 40–59 | Mixed opportunity |
| 0–39 | Lower priority |

Use cautious language:

```txt
Strong Opportunity
Worth reviewing
Lower priority
Potential opportunity
```

Avoid:

```txt
Buy
Sell
Safe
Guaranteed upside
```

---

## UI Usage

Opportunity Score appears in:

```txt
Scanner default sort
Scanner main table
Scanner expanded row
Dashboard opportunity cards/tables
Drawer after Phase 21C
Data Inventory
```

Current Scanner default behavior:

```txt
All Stocks
Sort by Opportunity Score descending
Opportunity column highlighted
```

---

## Admin / Score Methodology Requirements

If Opportunity Score changes, update:

```txt
Admin Sync → Score Methodology tab
Calculate Opportunity Scores button description
Context/Algorithms/opportunity-score-v2.md
Context/scoring-system.md
```

---

## Related Docs

```txt
Context/scoring-system.md
Context/Algorithms/analyst-rating-and-upside.md
Context/Algorithms/scanner-decision-tags.md
Context/data-model.md
Context/sync-workflows.md
Context/Features/scanner-feature-spec.md
Context/Features/drawer-feature-spec.md
```
