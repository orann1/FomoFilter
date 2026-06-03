# Scanner Decision Tags — FomoFilter

## When To Read This File

Read this file before changing:

```txt
Decision Tag
Strength chips
Concern chips
Rule-based stock summaries
Scanner expanded row decision summary
Drawer decision snapshot
Opportunity/highlight labels
```

---

## When To Update This File

Update this file after QA and before commit approval if you change:

```txt
Decision Tag labels
Strength rules
Concern rules
Thresholds
UI meaning of Decision Tag
Rule-based suggested action
```

Also update:

```txt
Context/scoring-system.md
Context/Features/scanner-feature-spec.md
Context/Features/drawer-feature-spec.md if Drawer uses tags
Context/feature-history.md after phase completion
```

---

## Status

Implemented in Scanner expanded row.

Planned for Drawer in Phase 21C.

---

## Purpose

Decision Tags and chips provide a fast, readable explanation of a stock.

They should answer:

```txt
Why is this stock interesting?
What is the main strength?
What is the main concern?
Should I inspect it further?
```

They are rule-based UI helpers.

They are not:

```txt
Financial advice
AI-generated recommendations
External analyst ratings
Buy/sell signals
```

---

## User-Facing Labels

Preferred labels:

```txt
Decision Tag
Strengths
Concerns
No major concerns detected
```

Avoid:

```txt
Status
Signal
Buy Signal
Risk: HIGH
```

---

## Decision Tag Concept

Decision Tag should be derived from available DB-backed scores and flags.

Possible tags:

```txt
Strong Opportunity
Attractive
Watch
Lower Priority
Mixed Setup
```

Exact labels can evolve, but must remain cautious and research-oriented.

---

## Suggested Rule Concepts

These are product rules, not guaranteed exact implementation.

### Strong Opportunity

Possible condition:

```txt
Opportunity Score >= 80
Strong or good fundamentals
No major concerns
```

### Attractive

Possible condition:

```txt
Opportunity Score >= 70
Some positive strengths
Concerns are manageable
```

### Watch

Possible condition:

```txt
Opportunity Score between 55 and 69
or strong fundamentals but weak upside/valuation
```

### Lower Priority

Possible condition:

```txt
Opportunity Score < 55
or major concerns dominate strengths
```

---

## Strength Chips

Examples:

```txt
Strong fundamentals
High analyst upside
Strong profitability
Reasonable valuation
Healthy financials
Good stability
Positive price position
```

Possible rule ideas:

```txt
fundamentalScore >= 80 → Strong fundamentals
analystUpsidePercent >= 20 → High analyst upside
profitabilityScore >= 80 → Strong profitability
valuationScore >= 70 → Reasonable valuation
financialHealthScore >= 75 → Healthy financials
stabilityScore >= 75 → Good stability
```

---

## Concern Chips

Examples:

```txt
Elevated valuation
Low analyst upside
Negative analyst upside
Near 52W high
Higher volatility
Weak fundamentals
Weak financial health
```

Possible rule ideas:

```txt
valuationScore < 40 → Elevated valuation
analystUpsidePercent < 0 → Negative analyst upside
analystUpsidePercent < 5 → Low analyst upside
52W position > 0.95 → Near 52W high
stabilityScore < 50 → Higher volatility
fundamentalScore < 50 → Weak fundamentals
financialHealthScore < 50 → Weak financial health
```

If no concerns:

```txt
No major concerns detected
```

Do not hide the concern row.

---

## Rule-Based Suggested Action

Optional, if implemented.

Labels should be cautious:

```txt
Review now
Review, but check valuation
Watch for better risk/reward
Lower priority
```

Do not use:

```txt
Buy
Sell
Hold
```

Always label as:

```txt
Rule-based suggestion
```

---

## UI Requirements

### Scanner Expanded Row

Display:

```txt
Decision Tag
Strength chips
Concern chips
Company Snapshot
```

### Drawer

Phase 21C should reuse or mirror the same logic.

Display:

```txt
Decision Snapshot
Decision Tag
Strength chips
Concern chips
Optional rule-based suggestion
```

---

## Tooltip

Decision Tag tooltip:

```txt
Rule-based tag derived from Opportunity Score, fundamentals, valuation, analyst upside, stability, and detected concerns. It is not an external analyst rating.
```

Strengths tooltip:

```txt
Positive rule-based signals detected from the stored scores and synced data.
```

Concerns tooltip:

```txt
Potential weaknesses detected from the stored scores and synced data.
```

---

## Documentation Rule

If any threshold or tag meaning changes, update this file and any UI Score/Methodology copy that references it.

---

## Related Docs

```txt
Context/scoring-system.md
Context/Algorithms/opportunity-score-v2.md
Context/Features/scanner-feature-spec.md
Context/Features/drawer-feature-spec.md
Context/data-model.md
```
