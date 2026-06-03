# Analyst Rating and Upside — FomoFilter

## When To Read This File

Read this file before changing:

```txt
Analyst target sync
Analyst upside calculation
Analyst rating labels
Analyst rating stars
Recommendation count mapping
Opportunity Score analyst sentiment input
Scanner Analyst View
Drawer Analyst View
```

---

## When To Update This File

Update this file after QA and before commit approval if you change:

```txt
FMP target mapping
Finnhub recommendation mapping
Upside calculation
Rating label derivation
Star rating logic
Analyst sentiment logic
Analyst data UI meaning
```

Also update:

```txt
Context/scoring-system.md
Context/Algorithms/opportunity-score-v2.md if Opportunity scoring is affected
Context/Features/market-data-sync-strategy.md if provider responsibility changes
Context/feature-history.md after phase completion
```

---

## Status

Implemented.

Current sources:

```txt
FMP price-target-consensus
Finnhub recommendation counts
```

Stored in:

```txt
StockAnalystData
```

Provider/source label:

```txt
fmp+finnhub
```

---

## Data Flow

```txt
Company Data Sync
→ FMP target consensus
→ Finnhub recommendation counts
→ StockAnalystData
→ Scanner / Dashboard / Drawer / Opportunity Score
```

No provider calls should happen from Scanner, Dashboard, or Drawer.

---

## Target Price Data

Primary source:

```txt
FMP /stable/price-target-consensus
```

Expected target fields:

```txt
targetPrice
targetMean
targetHigh
targetLow
targetMedian
```

App display labels:

```txt
Consensus Target
Target High
Target Median
Target Low
```

---

## Analyst Upside Calculation

Purpose:

```txt
Shows the potential upside/downside from current price to analyst consensus target.
```

Formula:

```txt
analystUpsidePercent = ((targetPrice - currentPrice) / currentPrice) * 100
```

Rules:

```txt
If price or target is missing/invalid, upside should be null.
Do not show null as 0.
Show N/A for missing values.
Do not invent target values.
```

Opportunity Score v2 uses analyst upside as one component, but does not modify the raw stored value.

---

## Recommendation Counts

Source:

```txt
Finnhub /stock/recommendation
```

Stored fields may include:

```txt
strongBuyCount
buyCount
holdCount
sellCount
strongSellCount
analystCount
analystRating
```

---

## Analyst Rating Label

Typical labels:

```txt
Strong Buy
Buy
Hold
Sell
Strong Sell
```

If using counts to derive label, use a deterministic weighted method.

Avoid vague labels unless clearly mapped.

---

## Star Rating Display

Purpose:

```txt
Make analyst rating easier to read in Scanner and Drawer.
```

Current UI design:

```txt
Stars + numeric value on first line
Recommendation label on second line
```

Example:

```txt
★★★★☆ 4.0
Buy
```

Suggested basic mapping:

| Rating | Stars |
| --- | ---: |
| Strong Buy | 5.0 |
| Buy | 4.0 |
| Hold | 3.0 |
| Sell | 2.0 |
| Strong Sell | 1.0 |

If recommendation counts are available, use weighted stars:

```txt
Strong Buy = 5
Buy = 4
Hold = 3
Sell = 2
Strong Sell = 1
weightedAverage = weightedSum / analystCount
round to nearest 0.5
```

Half-star support is allowed if already implemented.

---

## Analyst Sentiment For Opportunity Score

Opportunity Score v2 uses analyst sentiment/confidence.

Concept:

```txt
Positive recommendations improve sentiment.
Thin analyst coverage should reduce confidence.
Low analyst count pulls sentiment toward neutral.
```

This is scoring logic. If changed, update:

```txt
Context/Algorithms/opportunity-score-v2.md
```

---

## UI Rules

### Scanner

Main table should show:

```txt
Analyst Upside
Rating stars + label
```

Expanded row should show:

```txt
Analyst Rating stars
Analyst Count
Consensus Target
Analyst Upside
Target High / Median / Low
Last analyst sync
Source
```

### Drawer

After Phase 21C, Drawer should show the same analyst data as Scanner/expanded row.

---

## Missing Data Display

Use:

```txt
N/A
```

for missing:

```txt
Target
Upside
Rating
Analyst count
```

Do not show missing values as:

```txt
0
0%
Unknown Buy
```

---

## Tooltips

Recommended tooltip text:

### Analyst Upside

```txt
Analyst target upside: the percentage difference between the current price and the consensus target price. Higher means analysts see more upside.
```

### Analyst Rating

```txt
Analyst recommendation summary converted to a star view using stored recommendation counts.
```

### Analyst Count

```txt
Number of analyst recommendations included in the stored recommendation snapshot.
```

### Consensus Target

```txt
Consensus analyst target price from the stored analyst target data.
```

---

## Related Docs

```txt
Context/scoring-system.md
Context/Algorithms/opportunity-score-v2.md
Context/Features/scanner-feature-spec.md
Context/Features/drawer-feature-spec.md
Context/Features/market-data-sync-strategy.md
Context/data-model.md
```
