# Drawer Feature Specification — FomoFilter

## When To Read This File

Read this file before changing:

```txt
Stock preview drawer
Drawer header
Drawer decision snapshot
Drawer company snapshot
Drawer score sections
Drawer analyst view
Drawer watchlist/alert actions
Drawer data freshness
Drawer layout/responsiveness
```

---

## When To Update This File

Update this file after QA and before commit approval if you change drawer behavior, data source, layout, actions, sections, or labels.

---

## Current Phase

Drawer cleanup is the active planned work:

```txt
Phase 21C — Drawer Real Data & Decision Workspace Cleanup
```

---

## Current Problem

The drawer was created in early mock phases and appears to still contain legacy/mock-oriented sections:

```txt
Hot Score
Signal: Strong but Extended
Risk: MEDIUM
AI Insight
Main Catalyst
Price Context mock chart
Watch Context legacy labels
Pullback/setup labels
Entry context
FOMO risk
```

These should not be presented as real unless backed by current DB data.

---

## Target Drawer Role

The drawer is a focused single-stock decision workspace.

| Area | Role |
| --- | --- |
| Main Scanner Table | Compare many stocks quickly |
| Expanded Row | Quick inline detail |
| Drawer | Focused decision workspace for one stock |

The drawer should answer:

```txt
Why is this stock interesting?
What are the main strengths?
What are the main concerns?
What do analysts think?
Is valuation reasonable?
Where is price relative to its range?
Is data fresh?
What action can I take?
```

---

## Target Drawer Sections

```txt
Header
Decision Snapshot
Company Snapshot
Our Calculated Scores
Analyst View
Valuation & Fundamentals
Market Position
Watchlist / Alert Context
Data Freshness
Actions Footer
```

Only show real DB-backed sections.

If a section has no real data, hide it or show a truthful empty state.

---

## Header

Should show:

```txt
Symbol
Company name
Watchlist/favorite state
Sector · Industry
Current price
Day %
Universe/index tags if available
Quote synced time if available
```

Remove or replace if not real:

```txt
Pullback Watch
Signal
Risk: MEDIUM
Updated 2m ago
```

---

## Decision Snapshot

Should show:

```txt
Decision Tag
Opportunity Score
Fundamental Score
Strength chips
Concern chips
Optional rule-based next step
```

Decision Tag must be explained as rule-based.

No AI text unless AI generation is explicitly implemented later.

---

## Company Snapshot

Should show real DB-backed profile data:

```txt
Description
Sector
Industry
Market Cap
Exchange if available
```

Description should be readable:

```txt
2–4 lines
tooltip/title with full text if truncated
```

---

## Our Calculated Scores

Should show app-calculated scores using the same visual language as Scanner:

```txt
Opportunity Score v2
Fundamental Score
Growth Score
Profitability Score
Valuation Score
Financial Health Score
Stability Score
```

Use:

```txt
Score bars
Score numbers
Tooltips
Score version / calculated date if available
```

Do not show Hot Score unless implemented as a real score.

---

## Analyst View

Should show real DB-backed analyst data:

```txt
Rating stars + numeric value + label
Analyst count
Consensus target
Analyst upside %
Target high
Target median
Target low
Source
Last synced date
```

Use same star logic as Scanner.

---

## Valuation & Fundamentals

Should show key DB-backed metrics:

```txt
P/E
Forward P/E
PEG
Forward PEG
P/S
P/B
EV/EBITDA
Revenue Growth TTM
EPS Growth TTM
Gross Margin
Operating Margin
Net Margin
ROE
ROA
Debt / Equity
Current Ratio
Interest Coverage
```

Avoid dumping every field if it becomes unreadable.

Group into:

```txt
Valuation
Growth & Profitability
Financial Health
```

---

## Market Position

Should show real daily quote/market context:

```txt
Current price
Day %
52W high
52W low
52W position
Price Avg 50
Price Avg 200
Beta
```

Do not show a historical chart unless the chart is real and DB-backed.

Historical charts are future work.

---

## Watchlist / Alert Context

Preserve real actions:

```txt
Add to Watchlist
Edit Watchlist
Remove from Watchlist
Create Alert
Edit Alert if supported
```

Show real state:

```txt
In Watchlist
Watchlist note
Alert Active
Alert rule details
```

Do not show mock values like entry/stop/target unless they are real user-entered DB fields.

---

## Data Freshness

Show:

```txt
Quote synced
Quote source
Metrics synced
Metrics source
Analyst synced
Analyst source
Opportunity calculated
Fundamental calculated
```

Values should not wrap awkwardly.

Use truncate/tooltips for long sources.

---

## Remove Legacy / Mock Content

Remove or replace if not DB-backed:

```txt
Hot Score
AI Insight
Main Catalyst
Price Context mock chart
FOMO risk
Signal
Setup / Pullback Watch
Entry context
Mock Watch Context values
```

Real but incomplete is better than polished mock data.

---

## Tooltips

Required tooltips for important metrics:

```txt
Decision Tag
Opportunity Score
Fundamental Score
Valuation Score
Stability Score
Analyst Upside
Analyst Rating
P/E
PEG
ROE
Revenue Growth
52W position
Beta
Data freshness fields
```

---

## Responsiveness

Drawer should:

```txt
Scroll correctly
Avoid content hidden behind sticky footer
Avoid horizontal overflow
Wrap cards cleanly
Keep close button visible
Work on desktop and mobile widths
```

---

## QA Checklist

Open drawer for:

```txt
ADBE
NVDA
NFLX
GOOG
TSLA
CHTR
```

Confirm:

```txt
No mock/legacy sections remain
Header uses real data
Decision Snapshot is rule-based/real
Company Snapshot uses DB description
Scores match Scanner/expanded row
Analyst View matches Scanner/expanded row
Market Position uses real quote data
Watchlist/Alert actions still work
Data Freshness visible
No overflow
Drawer updates correctly when another stock is opened
```

---

## Related Docs

```txt
Context/Features/scanner-feature-spec.md
Context/scoring-system.md
Context/Algorithms/scanner-decision-tags.md
Context/Algorithms/opportunity-score-v2.md
Context/data-model.md
Context/sync-workflows.md
```
