# Scoring System — FomoFilter

## When To Read This File

Read this file before changing:

```txt
Score calculation actions
Score display labels
Score methodology text
Scanner score columns
Drawer score sections
Dashboard score cards
Any score formula
```

This file is an index and summary. Detailed formulas live in `Context/Algorithms/`.

---

## When To Update This File

Update this file after QA and before commit approval if you change:

```txt
A score formula
Score version names
Score inputs
Score display meaning
Score ownership
Future score roadmap
```

Also update the relevant algorithm file.

---

## Current Production Scores

| Score | Version | Status | Detailed Doc |
| --- | --- | --- | --- |
| Fundamental Score | `fundamental-v1` | Implemented | `Context/Algorithms/fundamental-score-v1.md` |
| Opportunity Score | `opportunity-v2` | Implemented | `Context/Algorithms/opportunity-score-v2.md` |
| Analyst Rating Stars | UI derived | Implemented | `Context/Algorithms/analyst-rating-and-upside.md` |
| Decision Tag | Rule-based UI tag | Implemented in Scanner expanded row | `Context/Algorithms/scanner-decision-tags.md` |

---

## Current UI Labels

Use these labels consistently:

| Internal / Legacy | User-facing label |
| --- | --- |
| `oppScore` | Opportunity |
| `fundamentalScore` | Fundamental |
| `riskContextScore` | Stability |
| `analystUpsidePercent` | Analyst Upside |
| `analystRating` | Rating |
| `Status` | Decision Tag |

Avoid old labels unless explicitly scoped:

```txt
Hot Score
Risk
Opp.
Fund.
FOMO Risk
Signal
```

---

## Fundamental Score v1

Purpose:

```txt
Measures company quality using fundamentals, valuation, growth, profitability, financial health, and stability/risk context.
```

Source:

```txt
DB only
Mostly StockMetric and related score components
```

Provider calls:

```txt
None during calculation
```

Stored in:

```txt
StockScore.fundamentalScore
StockScore.fundamentalScoreVersion
StockScore.fundamentalCalculatedAt
```

Detailed doc:

```txt
Context/Algorithms/fundamental-score-v1.md
```

---

## Opportunity Score v2

Purpose:

```txt
Ranks whether a stock is an attractive opportunity right now.
```

Current components:

| Component | Weight |
| --- | ---: |
| Fundamental Quality | 25% |
| Valuation | 20% |
| Growth | 15% |
| Analyst Upside | 20% |
| Analyst Sentiment / Confidence | 10% |
| Price Position | 5% |
| Stability / Risk Context | 5% |

Source:

```txt
DB only
```

Stored in:

```txt
StockScore.oppScore
StockScore.oppScoreVersion = opportunity-v2
StockScore.oppCalculatedAt
```

Provider calls:

```txt
None during calculation
```

Detailed doc:

```txt
Context/Algorithms/opportunity-score-v2.md
```

---

## Analyst Rating Stars

Purpose:

```txt
Display analyst recommendation data in a readable visual form.
```

Source:

```txt
StockAnalystData recommendation counts and rating label
```

Typical mapping:

```txt
Strong Buy → 5 stars
Buy → 4 stars
Hold → 3 stars
Sell → 2 stars
Strong Sell → 1 star
```

If recommendation counts are available, UI can calculate weighted half-stars.

Detailed doc:

```txt
Context/Algorithms/analyst-rating-and-upside.md
```

---

## Decision Tag

Purpose:

```txt
Rule-based UI tag for fast scanner/drawer interpretation.
```

Examples:

```txt
Strong Opportunity
Attractive
Watch
Lower Priority
```

Decision Tag is not an external analyst rating.

It should be derived from:

```txt
Opportunity Score
Fundamental Score
Valuation
Analyst Upside
Stability
Detected strengths/concerns
```

Detailed doc:

```txt
Context/Algorithms/scanner-decision-tags.md
```

---

## Future Scores

Planned but not implemented as production scores:

| Future Score | Requires |
| --- | --- |
| Momentum Score | Historical daily candles |
| Hot Score v1 | Momentum, volume heat, catalyst/news logic |
| FOMO Risk | Momentum/heat + valuation/stability/extension logic |
| Best Signal Score | Composite of opportunity + momentum + catalyst + risk |

Do not display future scores as real unless they are implemented and DB-backed.

---

## Score Calculation Rules

```txt
Score calculations must be DB-only.
Do not call external providers during scoring.
Do not treat missing inputs as zero unless the algorithm explicitly requires it.
Use documented version names.
Update Score Methodology UI when formulas change.
Update relevant algorithm MD files after QA.
```

---

## Related Docs

```txt
Context/sync-workflows.md
Context/data-model.md
Context/Algorithms/fundamental-score-v1.md
Context/Algorithms/opportunity-score-v2.md
Context/Algorithms/analyst-rating-and-upside.md
Context/Algorithms/scanner-decision-tags.md
```
