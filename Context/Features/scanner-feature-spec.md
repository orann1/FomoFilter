# Scanner Feature Specification — FomoFilter

## When To Read This File

Read this file before changing:

```txt
/scanner route
Scanner main table
Scanner quick filters
Scanner advanced filters
Scanner sorting
Scanner pagination
Scanner search
Scanner expanded row
Scanner mobile cards
Scanner result count / empty state
Scanner Decision Tag / strengths / concerns display
```

Do not read this file for Drawer-only changes unless the Drawer data is passed from Scanner.

---

## When To Update This File

Update this file after QA and before commit approval if you change Scanner behavior, layout, filters, sorting, pagination, columns, expanded row, or mobile cards.

---

## Current Scanner Role

The Scanner is the main stock discovery workspace.

It should answer:

```txt
Which stocks are interesting?
Why are they interesting?
What is the upside?
Are fundamentals strong?
Is valuation reasonable?
Is the stock stable enough?
Should I open the drawer for deeper review?
```

---

## Product Role Split

```txt
Scanner Row      = fast comparison across stocks (main table columns)
Expanded Row     = detailed dry data view for deeper research — full metric tables
Drawer           = visual decision cockpit — synthesized signals, narrative, action-focused
Stock Details    = future full research page (not yet implemented)
```

The Drawer and Expanded Row serve different purposes. The Expanded Row is the primary place for full dry metric tables. The Drawer synthesizes data into a decision-focused layout with narrative and visual signal cards. Do not make them visually identical.

It is not a raw data inventory table.

---

## Current Route

```txt
/scanner
```

---

## Current Data Source

Scanner data is DB-backed.

Expected flow:

```txt
Prisma server loader
→ normalized scanner stock objects
→ client-side search/filter/sort/pagination
→ table / mobile cards / expanded row
```

Scanner must not call external providers.

---

## Current Main Table

Current main table columns:

```txt
Symbol
Sector
Price
Day %
Opportunity
Fundamental
Valuation
Stability
Analyst Upside
Rating
```

Removed from main table and moved to expanded row:

```txt
Growth
Profitability
Financial Health
P/E
PEG
ROE
Revenue Growth
Market Cap
Target Price
Target High / Median / Low
52W values
Data freshness
```

---

## Current Default State

```txt
View: US Stocks (all active unique stocks across all synced universes)
Sort: Opportunity Score descending
Page size: 20
Highlighted column: Opportunity
```

Result text example:

```txt
Showing 1–20 of 518 stocks
Showing all stocks — sorted by Opportunity Score
```

---

## Universe Selector

Scanner displays a universe selector above the table. Available options:

```txt
US Stocks (slug: "all")  — default — all unique active stocks across all synced universes
Nasdaq 100 (slug: "nasdaq-100") — Nasdaq 100 members only
S&P 500 (slug: "sp-500")        — S&P 500 members only (after membership sync)
Russell 1000 (slug: "russell-1000") — Russell 1000 (future/no data yet)
```

URL parameter: `?universe=nasdaq-100`, `?universe=sp-500`, etc.

Default route `/scanner` with no parameter loads US Stocks (all active unique).

No duplicate rows: stocks belonging to multiple universes appear once in all views.

---

## Pagination

Current behavior:

```txt
Page sizes: 10 / 20 / 50 / 100
Default: 20
Search/filter/sort happen before pagination
Changing search/filter/sort/page size resets to page 1
Mobile cards use the same paginated result set
```

Required order:

```txt
all stocks
→ search
→ filters
→ sort
→ pagination
```

---

## Search

Search should apply to the full dataset before pagination.

Supported search targets:

```txt
Symbol
Company name
```

Keep sector/name search if already supported.

---

## Quick Filters

Current quick filters:

```txt
All Stocks
High Opportunity
High Fundamentals
High Analyst Upside
Reasonable Valuation
In Watchlist
```

Optional if implemented:

```txt
Positive Day %
```

Unsupported future filters should not be shown as disabled pills:

```txt
Hot Today
Strong Momentum
Unusual Volume
FOMO Risk
```

Those require future data/scores.

---

## Advanced Filters

Advanced Filters should be collapsed by default.

Typical filters:

```txt
Index
Sector
Watchlist
Alert Active
Positive Day %
Min Opportunity
Min Fundamental
Min Growth
Min Profitability
Min Valuation
Min Health
Min Analyst Upside
```

Advanced filters apply before pagination.

---

## Sorting

Allowed sort options should match visible main-table columns:

```txt
Opportunity Score
Fundamental Score
Analyst Upside
Valuation Score
Stability Score
Price Change %
Symbol A–Z
```

Do not include hidden fields like Market Cap unless visible in the main table.

Active sort column should have:

```txt
Header arrow
Clear highlight
Subtle column tint
```

---

## Visual Language

### Calculated Scores

Use score bars and score numbers for:

```txt
Opportunity
Fundamental
Valuation
Stability
```

### Analyst Rating

Use:

```txt
Stars + numeric value
Recommendation label on second line
```

Example:

```txt
★★★★☆ 4.0
Buy
```

### Stability

User-facing label:

```txt
Stability
```

Internal source may be:

```txt
riskContextScore
```

Tooltip meaning:

```txt
Higher Stability means more favorable / lower-risk context.
It does not mean higher risk.
```

---

## Expanded Row

Current expanded row sections:

```txt
Decision Summary
Company Snapshot
Our Calculated Scores
Analyst View
Valuation Metrics
Growth & Profitability
Financial Health
Market Position
Data Freshness
```

### Decision Summary

Contains:

```txt
Decision Tag
Strengths
Concerns
```

If no concerns:

```txt
No major concerns detected
```

Decision Tag is rule-based and not an external analyst rating.

### Company Snapshot

Uses DB-backed `Stock` profile fields:

```txt
Company name
Sector
Industry
Market Cap
Description
```

Description should show meaningful text, not only a few words.

Beta should not be in Company Snapshot; it belongs in market/stability context.

### Our Calculated Scores

Shows:

```txt
Opportunity Score
Fundamental Score
Growth Score
Profitability Score
Valuation Score
Financial Health Score
Stability Score
```

### Analyst View

Shows:

```txt
Rating stars
Analyst count
Consensus target
Upside %
Target high / median / low
Source / synced date if available
```

### Market Position

Shows:

```txt
Current price
Day %
52W high / low
Price Avg 50 / 200
52W position
Beta if available
```

### Data Freshness

Shows sync/calculation dates and sources.

Values must not wrap awkwardly.

---

## Empty State

If no results:

```txt
No stocks match these filters.
Try clearing filters or lowering the score thresholds.
```

Provide a clear filters button if available.

---

## Mobile

Mobile cards should:

```txt
Use paginated results
Use clear labels
Show key decision fields
Use Stability, not Risk
Avoid rendering 1000 cards at once
```

---

## Drawer Relationship

Scanner opens the drawer, but the drawer is not the Scanner.

Current drawer cleanup is planned in:

```txt
Phase 21C — Drawer Real Data & Decision Workspace Cleanup
```

Scanner should not reintroduce mock drawer fields.

---

## Future Scanner Work

Future features:

```txt
Historical daily + momentum foundation
Momentum filters
Hot Score
FOMO Risk
News/catalyst filters
Saved scanner views
Stock comparison
Export
Natural-language scanner search
```

Do not display future filters as active unless data exists.

---

## Related Docs

```txt
Context/Features/drawer-feature-spec.md
Context/scoring-system.md
Context/Algorithms/scanner-decision-tags.md
Context/Algorithms/opportunity-score-v2.md
Context/data-model.md
Context/sync-workflows.md
```
