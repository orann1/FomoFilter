# Opportunity Radar — Feature Spec

## Product Role

Opportunity Radar is a future AI-assisted market discovery surface, separate from Scanner.

Scanner is a structured filter and sort workspace for stocks already in the DB.
Opportunity Radar is a discovery surface that surfaces interesting setups with richer narrative context, categories, and signals — designed to look like an intelligent daily briefing from the market.

Opportunity Radar is not financial advice.
It surfaces research candidates worth further review, not buy/sell recommendations.

---

## Current Phase

**Phase 23A — Mock-Only Visual Experience**

Phase 23A establishes the visual product direction using hardcoded mock data.
No AI agent runs.
No web search or scraping.
No DB reads or writes.
No schema changes or migrations.
No provider calls.

The goal of Phase 23A is to confirm the visual and product direction before any AI or data infrastructure is built.

---

## Target Route

```txt
/opportunity-radar
```

This is a top-level route.
It is not nested under /scanner or /admin.

Status in Phase 23A: implemented with mock data only.
Status in future phases: reads from persisted DB results after AI agent runs.

---

## Design Direction

```txt
Visually innovative, engaging, dark UI
Radar / command-center feel
Not a standard data table
Cards with narrative content
Score bars and badges
Category lanes with distinct visual identity
Featured candidate section with elevated visual presence
Time control tabs
Responsible research-framing footer
```

The page must feel visually distinct from Scanner and Dashboard.
It should feel like an intelligent briefing surface, not a filter tool.

---

## Page Sections

### 1. Hero / Market Pulse

Top section of the page.

Contains:
```txt
Page title: "Opportunity Radar"
Subtitle copy: "Stocks worth a closer look — based on AI-style market discovery signals from the last 24 hours."
Market pulse summary line: e.g. "Scanning 12 candidates across 6 categories today."
Last updated timestamp (mock)
Research disclaimer notice (brief, single line)
```

---

### 2. Time Controls

Tabs that filter the displayed candidates by time window.

Options:
```txt
Today
Yesterday
Last 7 Days
Last 30 Days
```

In Phase 23A: switching tabs shows a hardcoded subset of mock candidates for each time window.
In future phases: tabs query persisted AI scan results for the selected time period.

---

### 3. Summary Cards

A row of summary stat cards beneath the time controls.

Example cards:
```txt
Total Candidates Today: [count]
New Today: [count]
Repeated Signals: [count]
Categories Active: [count]
Avg Attention Score: [value]
```

All values are mock in Phase 23A.

---

### 4. Opportunity Lanes / Categories

The main body of the page is organized into category lanes.

Each lane represents a candidate category:

```txt
Unusual Attention
Beaten Down / Possible Overreaction
Possibly Undervalued
Emerging Theme
Pre-Breakout Watch
High-Risk Speculative
```

Each lane contains:
```txt
Category label and icon
Brief category description
Candidate cards for stocks in this category
```

Lanes with no candidates for the selected time period can be hidden or shown with an empty state.

---

### 5. Featured Candidate

A visually elevated candidate card highlighted above or within the category lanes.

The featured candidate has:
```txt
Expanded card size
Full thesis, why now, bull/bear case displayed without collapse
Prominent attention score visual
Featured badge or callout
```

In Phase 23A: one or two hardcoded featured candidates.
In future phases: AI agent or editorial selection drives the featured slot.

---

### 6. Candidate Cards

Standard candidate cards within each category lane.

Each card displays:

```txt
ticker
companyName
category
headline
thesis
whyNow
mainCatalyst
bullCase
bearCase
nextCheck
attentionScore       (0–100)
confidenceScore      (0–100)
hypeRiskScore        (0–100)
evidenceCount
sourceTypes          (string[])
tags                 (string[])
```

Score bars render for attentionScore, confidenceScore, and hypeRiskScore.

Cards may truncate long thesis/bull/bear copy with a "read more" toggle.

---

### 7. Persistent Signals Section

A dedicated section for candidates that have appeared across multiple days.

Contains:
```txt
Section heading: "Persistent Signals"
Section description: "These candidates have appeared in multiple radar scans. Sustained attention may indicate ongoing relevance — or stubborn hype."
Filtered list of candidates where appearancesLast7Days >= 2 or trendStatus === "repeated" or "back_on_radar"
```

---

### 8. New Today Section

A dedicated section for candidates appearing for the first time today.

Contains:
```txt
Section heading: "New Today"
Section description: "These candidates appeared in today's scan for the first time."
Filtered list of candidates where trendStatus === "new_today"
```

---

### 9. Research Discipline Footer

A footer section at the bottom of the page.

Contains:
```txt
"Opportunity Radar surfaces research candidates based on AI-style signals. These candidates require your own validation before any decision. This is not financial advice."
Link or reference to research methodology (future phase).
```

---

## History-Aware Mock Fields

Each candidate carries history-aware metadata that simulates multi-day tracking behavior.

Fields:

```ts
trendStatus: "new_today" | "repeated" | "back_on_radar" | "cooling_down"
appearancesLast7Days: number
appearancesLast30Days: number
firstSeenDate: string      // ISO date string
lastSeenDate: string       // ISO date string
previousCategories: string[]  // empty array if new_today
```

---

## UI Badges

Each candidate card displays a badge based on `trendStatus`:

| trendStatus | Badge |
| --- | --- |
| `new_today` | New Today |
| `repeated` | Repeated Signal |
| `back_on_radar` | Back on Radar |
| `cooling_down` | Cooling Down |

Badges should be visually distinct and color-coded.

---

## Candidate Categories

| Category | Description |
| --- | --- |
| Unusual Attention | Volume or search interest significantly above normal without obvious catalyst |
| Beaten Down / Possible Overreaction | Stock down significantly; signals suggest potential overreaction worth validating |
| Possibly Undervalued | Valuation metrics below historical or sector norms; may warrant a closer look |
| Emerging Theme | Connected to a rising sector, trend, or macro theme gaining momentum |
| Pre-Breakout Watch | Technical or fundamental setup that often precedes a breakout — requires validation |
| High-Risk Speculative | High volatility, hype risk, or uncertainty; requires maximum caution |

---

## Candidate Card Type

Full TypeScript shape for a candidate card (to be defined in implementation):

```ts
type RadarCandidate = {
  id: string;
  ticker: string;
  companyName: string;
  category: RadarCategory;
  headline: string;
  thesis: string;
  whyNow: string;
  mainCatalyst: string;
  bullCase: string;
  bearCase: string;
  nextCheck: string;
  attentionScore: number;       // 0–100
  confidenceScore: number;      // 0–100
  hypeRiskScore: number;        // 0–100
  evidenceCount: number;
  sourceTypes: string[];
  tags: string[];
  trendStatus: "new_today" | "repeated" | "back_on_radar" | "cooling_down";
  appearancesLast7Days: number;
  appearancesLast30Days: number;
  firstSeenDate: string;
  lastSeenDate: string;
  previousCategories: string[];
  isFeatured?: boolean;
};
```

---

## Safety and Copy Rules

All copy on the Opportunity Radar page must follow these rules:

Use:
```txt
"research candidates"
"worth reviewing"
"requires validation"
"may be worth a closer look"
"signals suggest"
"potential setup"
"worth monitoring"
```

Avoid:
```txt
"buy"
"sell"
"guaranteed"
"safe"
"will go up"
"strong buy"
"underperform"
"outperform"
```

The research disclaimer footer is required on every page load.

---

## Non-Scope (Phase 23A)

Do not implement in Phase 23A:

```txt
Real AI agent or LLM calls
Web search or scraping
News/catalyst ingestion from external sources
DB reads or writes
Prisma migration or schema changes
Provider calls (FMP, Finnhub, etc.)
Admin Sync execution logic for radar
Real citations with source URLs
Score formula changes
Alert evaluation engine
Historical price data
Momentum Score
Watchlist / alert integration with radar candidates
Scheduled jobs or cron tasks
Score persistence
```

---

## Future Phases

| Phase | Focus |
| --- | --- |
| Phase 23A | Mock-only visual experience (current) |
| Phase 23B | AI agent design — prompt engineering, candidate generation logic, output schema |
| Phase 23C | DB persistence + Admin Scan button — AI agent runs through Admin, results stored, page reads from DB |
| Future | Scheduled daily scan, source evidence storage, integration with Scanner / Watchlist / Alerts |
| Later | Historical Daily + Momentum Foundation (after radar direction is validated) |

---

## Architecture Note (Future)

When the AI agent is implemented (Phase 23B+), it will follow this flow:

```txt
Admin Sync button / future scheduled job
→ AI agent runs (reads DB stocks, generates candidates)
→ Results persisted to DB (new RadarScan / RadarCandidate models)
→ /opportunity-radar reads persisted results from DB
```

The page must never call the AI agent directly from the UI render path.
The page must never call external providers from the UI render path.
All future reads will be from the database only, following the existing FomoFilter architecture rule.

---

## Documentation Update Map

If this feature changes in future phases, update:

```txt
Context/Features/opportunity-radar-feature-spec.md  — this file
Context/current-feature.md                          — active phase spec
Context/project-overview.md                         — roadmap and routes
Context/README.md                                   — feature routing map
Context/data-model.md                               — if DB schema is added
Context/sync-workflows.md                           — if Admin Sync workflow is added
Context/feature-history.md                          — after phase completion
```
