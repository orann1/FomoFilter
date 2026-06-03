# Fundamental Score v1 — FomoFilter

## When To Read This File

Read this file before changing:

```txt
Fundamental Score formula
Fundamental Score weights
Fundamental Score input fields
Fundamental Score component scores
Score methodology text for Fundamental Score
Scanner/Drawer labels explaining Fundamental Score
```

---

## When To Update This File

Update this file after QA and before commit approval if you change:

```txt
Fundamental Score formula
Component weights
Input fields
Missing-data behavior
Version name
Score interpretation
Score Methodology UI copy
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
fundamental-v1
```

Stored in:

```txt
StockScore.fundamentalScore
StockScore.fundamentalScoreVersion
StockScore.fundamentalCalculatedAt
```

Component fields may include:

```txt
StockScore.growthScore
StockScore.profitabilityScore
StockScore.valuationScore
StockScore.financialHealthScore
StockScore.riskContextScore
```

User-facing UI label for `riskContextScore`:

```txt
Stability
```

---

## Purpose

Fundamental Score answers:

```txt
How strong is this company fundamentally?
```

It is a 0–100 internal score based on synced DB fundamentals.

It should not answer:

```txt
Is this stock hot today?
Is this a short-term momentum trade?
Should I buy this stock?
```

---

## Data Source

Fundamental Score is calculated from persisted database data only.

Primary source:

```txt
StockMetric
```

May also use related DB data where already persisted.

No external provider calls are allowed during score calculation.

Correct flow:

```txt
Company Data Sync
→ StockMetric / Stock profile data
→ Calculate Fundamental Scores
→ StockScore
→ Scanner / Dashboard / Drawer
```

---

## Main Component Concepts

Fundamental Score uses the following conceptual components:

```txt
Growth
Profitability
Valuation
Financial Health
Stability / Risk Context
```

Exact implementation should be verified in:

```txt
src/lib/scoring/*
src/actions/market-data-actions.ts
```

If implementation and documentation differ, update this file after confirming the current code.

---

## Component Meanings

### Growth

Answers:

```txt
Is the company growing revenue and earnings?
```

Typical inputs:

```txt
Revenue Growth TTM YoY
EPS Growth TTM YoY
Revenue Growth 3Y
EPS Growth 3Y
```

Higher is generally better.

---

### Profitability

Answers:

```txt
Is the company profitable and efficient?
```

Typical inputs:

```txt
Gross Margin
Operating Margin
Net Margin
ROE
ROA
```

Higher is generally better.

---

### Valuation

Answers:

```txt
Is the stock reasonably valued relative to fundamentals and growth?
```

Typical inputs:

```txt
P/E
Forward P/E
P/S
P/B
EV/EBITDA
PEG
```

Higher Valuation Score means more attractive/reasonable valuation.

Important UI wording:

```txt
Higher Valuation Score = better valuation context.
It does not mean higher valuation/more expensive.
```

---

### Financial Health

Answers:

```txt
Does the company have a reasonable balance sheet and liquidity profile?
```

Typical inputs:

```txt
Debt / Equity
Current Ratio
Quick Ratio
Interest Coverage
```

Higher is generally better.

---

### Stability / Risk Context

Internal field may be named:

```txt
riskContextScore
```

User-facing label must be:

```txt
Stability
```

Meaning:

```txt
Higher Stability means more favorable / lower-risk context.
```

Typical inputs:

```txt
Beta
Market capitalization
Other persisted risk/context fields
```

Do not label this as `Risk` in UI, because a value of 100 means favorable stability, not high risk.

---

## Missing Data Behavior

Missing inputs should not automatically be treated as zero unless the implemented algorithm explicitly requires it.

Expected behavior:

```txt
Ignore missing components where appropriate
Normalize available weights if implemented
Return null if required core inputs are missing
```

Before changing missing-data behavior, update this doc and Score Methodology UI.

---

## Score Interpretation

| Score | Meaning |
| ---: | --- |
| 80–100 | Strong fundamentals |
| 60–79 | Good fundamentals |
| 40–59 | Mixed / average |
| 0–39 | Weak fundamentals |

Use cautious language:

```txt
Strong fundamentals
Good quality
Mixed fundamentals
Weak fundamentals
```

Avoid:

```txt
Safe stock
Guaranteed quality
Buy signal
```

---

## UI Usage

Fundamental Score appears in:

```txt
Scanner main table
Scanner expanded row
Drawer after Phase 21C
Dashboard top fundamental stocks
Data Inventory / Admin if relevant
Score Methodology
```

Display recommendations:

```txt
Use score bars
Show numeric score
Add tooltip explaining higher is better
Use "Fundamental", not "Fund." where space allows
```

---

## Documentation Checklist For Changes

If Fundamental Score changes, update:

```txt
Context/Algorithms/fundamental-score-v1.md
Context/scoring-system.md
Admin Sync Score Methodology UI
Context/Features/admin-sync-feature-spec.md if UI behavior changes
Context/feature-history.md after phase completion
```

---

## Related Docs

```txt
Context/scoring-system.md
Context/data-model.md
Context/sync-workflows.md
Context/Features/scanner-feature-spec.md
Context/Features/drawer-feature-spec.md
```
