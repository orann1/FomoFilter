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

**Phase 23A Final Approved Direction**

```txt
Visually innovative, engaging, dark UI
Radar / command-center feel  
Not a standard data table
Cards with narrative content
Lens-based discovery and filtering
3-card Opportunity Deck for focused attention
Intel Brief side panel for deep narrative context
Category and historical signal metadata
Time control tabs
Responsible research-framing footer
```

The page feels visually distinct from Scanner and Dashboard.
It works as an intelligent briefing surface with focused discovery (3 top candidates per Lens view) and deep context (Intel Brief for each card).

---

## Page Sections

### 1. Hero / Daily Opportunity Briefing

Top section of the page.

Contains:
```txt
Page title: "Daily Opportunity Briefing"
Subtitle copy: "Stocks worth a closer look — based on AI-style market discovery signals from the last 24 hours."
Mock experience badge: "Mock experience · AI scan not connected yet"
Last updated timestamp (mock)
Time controls: Today / Yesterday / Last 7 Days / Last 30 Days tabs
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

### 3. Radar Lens Bar

Four interactive buttons that filter and contextualize the Opportunity Deck:

```txt
Attention Spike (Zap icon)
  - Includes: unusual_attention, pre_breakout categories
  - Signal: Unusual attention, coverage, or signal activity before the story is fully obvious
  - Color family: muted indigo

Overreaction (TrendingDown icon)
  - Includes: beaten_down category
  - Signal: Sharp declines or negative reactions that may deserve a second look
  - Color family: muted amber

Value Gap (Target icon)
  - Includes: possibly_undervalued category
  - Signal: Stocks where valuation signals may look disconnected from business quality
  - Color family: muted emerald

Future Theme (Layers icon)
  - Includes: emerging_theme, speculative_upside categories
  - Signal: Names connected to emerging sectors, narratives, or speculative future growth
  - Color family: muted purple
```

Each Lens button shows:
```txt
Icon and label
Count of matching candidates
Color identity (border when unselected, background fill when active)
```

---

### 4. Lens Explanation Banner

A banner that appears below the Lens bar when a Lens is selected.

Contains:
```txt
Lens name (e.g., "Attention Spike")
Explanation copy for that Lens
Candidate count for the selected time window and Lens
```

The banner uses the same color family as its Lens for visual coherence.

---

### 5. Opportunity Deck

A fixed 3-card horizontal deck that displays the top candidates for the selected Lens and time window.

In Phase 23A: shows up to 3 hardcoded candidates per Lens selection.
In future phases: will show top 3 from persisted DB scan results.

Each card is clickable to open the Intel Brief.

---

### 6. Candidate Cards

Standard cards within the Opportunity Deck.

Each card displays (visible on card):
```txt
Ticker (large, prominent)
Company name (smaller)
One category badge (Unusual Attention, Beaten Down, etc.)
Headline (2-line truncation)
3 radar bullets (key signals)
Signal Snapshot:
  - Analyst Rating with stars (★★★★☆)
  - Mock 1W Move (-6.8%, color-coded by magnitude)
  - Analyst Upside (+18%)
Next Check (category-colored box)
Click affordance: "Click for Intel Brief"
```

When selected, the card highlights and shows "Intel Brief open" with ChevronUp icon.

---

### 7. Intel Brief Panel

A detailed side panel that opens when a candidate card is clicked.

**Left column — Radar Narrative:**
```txt
Header: ticker, company, badges, "Intelligence Brief" label
Why it is on the radar: 3 key bullets
What looks interesting: bullish signals (emerald-tinted background)
Key concerns: bearish signals (red-tinted background)
What to verify next: next checkpoint with description
Source / metadata: source types and evidence count
```

**Right column — FomoFilter Validation:**
```txt
Radar Conviction (hero display)
  - large score (0–100)
  - interpretation: "Worth reviewing · validation needed"
Primary validation metrics (2-column grid):
  - Opportunity Score
  - Fundamental Score
  - Analyst Upside
  - Analyst Rating with stars
Secondary metrics (rows):
  - Valuation Score
  - Stability
  - P/E
  - 52W Position %
```

All Intel Brief scores are mock-only and represent future DB-backed validation concepts.

---

### 8. Research Discipline Footer

A footer section at the bottom of the page.

Contains:
```txt
"Research Discipline: Opportunity Radar surfaces research candidates based on mock AI-style signals. 
These candidates require your own independent validation before any decision. This is not financial advice. 
All scores and signals are simulated for product demonstration purposes only. No buy or sell recommendations 
are implied."
```

The footer is visible on every page load and uses responsible language.

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

## Radar Conviction (Mock-Only)

In Phase 23A, Radar Conviction is a **mock-only UI concept** used in the Intel Brief's FomoFilter Validation panel.

**Important clarifications:**
- Radar Conviction is NOT production scoring logic
- It does not replace or compete with Opportunity Score
- It is a simulated "composite conviction" UI metric for visual demonstration
- It exists only in the Intel Brief, not on the card level
- In future phases (23C+), Radar Conviction will become a real DB-backed validation score computed by the AI agent
- Production scoring (Opportunity Score, Fundamental Score, etc.) remains unchanged

**Fields:**
```ts
radarConvictionScore: number        // 0–100, mock-only, Intel Brief only
radarSignalStrength: number         // 0–100, mock-only, supporting metric
```

---

## Candidate Card Data Type

Full TypeScript shape for a candidate card (as implemented in Phase 23A):

```ts
type RadarCandidate = {
  // Identification
  id: string;
  ticker: string;
  companyName: string;
  
  // Categorization
  category: RadarCategory;  // unusual_attention | beaten_down | possibly_undervalued | 
                             // emerging_theme | pre_breakout | speculative_upside
  
  // Narrative Content
  headline: string;
  thesis: string;
  whyNow: string;
  mainCatalyst: string;
  bullCase: string;
  bearCase: string;
  nextCheck: string;
  
  // Scoring (mock in Phase 23A)
  attentionScore: number;       // 0–100
  confidenceScore: number;      // 0–100
  hypeRiskScore: number;        // 0–100
  
  // Snapshot Validation Scores (mock in Phase 23A)
  snapshot: {
    radarConvictionScore: number;      // 0–100, mock-only
    radarSignalStrength: number;       // 0–100, mock-only
    opportunityScore: number;          // 0–100, mock
    fundamentalScore: number;          // 0–100, mock
    analystUpsidePercent: number;      // %, mock
    analystRating: string;             // "Outperform" | "Hold" | etc, mock
    valuationScore: number;            // 0–100, mock
    stabilityScore: number;            // 0–100, mock
    peRatio?: number | null;           // mock
    week52PositionPercent?: number;    // %, mock
    marketCapLabel?: string;           // mock
    priceChange1WPercent?: number;     // %, mock 1-week price move
  };
  
  // Evidence and Attribution
  evidenceCount: number;
  sourceTypes: string[];
  tags: string[];
  
  // History-Aware Mock Fields (for time filtering and signal context)
  trendStatus: "new_today" | "repeated" | "back_on_radar" | "cooling_down";
  appearancesLast7Days: number;
  appearancesLast30Days: number;
  firstSeenDate: string;        // ISO date string
  lastSeenDate: string;         // ISO date string
  previousCategories: string[]; // empty array if new_today
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

UI Sections Not in Phase 23A:
- Category lanes (original concept; replaced by Lens-based filtering)
- Featured candidate section (original concept; may return in 23C+ with editorial or AI selection)
- Summary stat cards (original concept; may return in 23C+ with real scan results)
- Dedicated Persistent Signals section (original concept; may return in 23C+)
- Dedicated New Today section (original concept; may return in 23C+)
```

**Design Note:** The original Phase 23A spec proposed category lanes as the main structure. The final approved design uses a Lens-based filter system with a focused 3-card Opportunity Deck and Intel Brief panel. This direction was approved after UX validation. Category lanes, featured candidates, and dedicated signal sections remain good concepts for future phases but are not Phase 23A scope.

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
