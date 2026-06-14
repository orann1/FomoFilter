# Opportunity Radar — Feature Spec

## Product Role

**Phase 24B+ (Current Approved Direction):**

Opportunity Radar is a **scan-based research signal tracker** that surfaces candidates from the latest AI scan, tracks recurring signals across scans, and validates discovered candidates against FomoFilter DB when available.

It is separate from Scanner:
- Scanner is a structured filter and sort workspace for stocks already in the DB.
- Opportunity Radar is a discovery surface that surfaces research candidates worth further review based on AI-identified signals and market analysis.

Opportunity Radar is not financial advice.
It surfaces research candidates worth further review, not buy/sell recommendations.

---

**Phase 23A (Legacy / Previous Direction):**

Phase 23A established a Lens-based daily briefing direction with four fixed lenses (Attention Spike, Overreaction, Value Gap, Future Theme) and 3-card Opportunity Deck design. This direction has been superseded by the Phase 24B scan-based research signal tracker concept (see below).

---

## Current Phase

**Phase 24B-0 — Opportunity Radar Product Rework Spec (Active)**

Phase 24B-0 is defining the new product direction before implementation.
- Current status: Planning / Documentation only
- No schema, code, or UI changes in this phase
- Next phase: Phase 24B-1 (Data Model Foundation)

See `Context/current-feature.md` for Phase 24B-0 scope and next phase planning.

---

**Phase 23C-3 (Completed — Previous Current Phase)**

Phase 23C-3 (completed in previous work) transitioned /opportunity-radar from mock-only visual demo to a real DB-backed briefing page using the Lens-based direction:
- Reads persisted RadarScan/RadarCandidate/RadarEvidence data from database
- Displays results from Phase 23C-2B (fixture scans) and Phase 23C-2C (Claude db_context scans)
- Implements Lens filtering by radarLens (4-lens categorization)
- Implements time window filtering by scanDate
- Implements source mode labeling (fixture, db_context)

**Note:** Phase 23C-3 uses the Lens-based UI direction. This direction is being superseded by Phase 24B's scan-based research signal tracker concept. The Phase 23C-3 DB data (scans, candidates, evidence) will remain compatible and readable during the Phase 24B transition.

---

## Target Route

```txt
/opportunity-radar
```

This is a top-level route.
It is not nested under /scanner or /admin.

Status in Phase 23A (completed): implemented with mock data only.
Status in Phase 23C-3 (current): reads persisted DB-backed scan results; no mock data by default.
Status in future phases (23D+): scheduled daily scans, web/search modes, etc.

---

## Design Direction

**Phase 24B+ Target Direction (New Approved Product Direction)**

Opportunity Radar is a **scan-based research signal tracker** with two primary views:

**Primary View — Latest Scan (Cards):**
```txt
Shows up to 10 ranked research candidates from the most recent successful scan.
Compact cards with:
- Rank (1-10)
- Ticker + Company name
- DB Status badge (In DB / External Discovery)
- Trend Status (New / Repeated / Back on Radar / Attention Needed)
- Discovery Signals / Reason Tags (replaces forced Lens categorization)
- Headline
- Main Catalyst
- Evidence quality indicator
- FomoFilter validation snapshot (if in DB)
- Next Check action
```

**Secondary Views — Historical & Comparison (Tables):**
```txt
Scan History — All scans with candidate counts, status, metadata
Repeated Signals — Candidates appearing in multiple scans (attention signal)
New Discoveries — Candidates first seen in latest scan
Compare Scans — Side-by-side comparison of two scans showing rank changes
```

The page feels like an intelligent research briefing surface.
It separates latest discoveries (cards) from historical analysis (tables).
External candidates are clearly marked and distinct from DB-validated candidates.
No forced lens categorization; instead, flexible discovery signal tags.

---

**Phase 23A Legacy Design Direction**

Phase 23A (completed) established a Lens-based daily briefing direction:

```txt
Visually innovative, engaging, dark UI
Radar / command-center feel  
Not a standard data table
Cards with narrative content
Lens-based discovery and filtering (4 forced lenses)
3-card Opportunity Deck for focused attention
Intel Brief side panel for deep narrative context
Category and historical signal metadata
Time control tabs
Responsible research-framing footer
```

**Status:** This direction has been superseded by Phase 24B's scan-based research signal tracker concept. The visual style (dark UI, cards, narrative content) is preserved, but the structure (lens forcing, 3-card deck only, time control tabs) is being replaced with a more flexible scan-based organization.

---

## Phase 24B+ Target Page Structure

**Tab-Based Organization (Phase 24B implementation):**

Opportunity Radar /opportunity-radar will be organized into **5 primary tabs**:

### Tab 1: Latest Scan (Primary)

**Purpose:** Answer "What should I research right now?"

**Main user question:** What are the top research candidates from the most recent scan?

**Data needed:**
- Most recent successful RadarScan
- Up to 10 candidates ranked by researchPriority
- Evidence count per candidate
- DB validation (stockId match, production scores if available)
- Trend status (computed from scan history)

**UI format:** Compact cards, up to 10 per screen (horizontal scroll or grid)

**Key fields per card:**
- Rank (1-10)
- Ticker, Company Name
- **DB Status badge:** "In DB" (green) or "External Discovery" (yellow/warning)
- Trend Status pill: "New" / "Repeated" / "Back on Radar" / "Attention Needed"
- Discovery Signals (reason tags, not forced lenses)
- Headline (1-2 lines)
- Main Catalyst
- Evidence quality: count + top credibility tier
- FomoFilter validation (if In DB):
  - Opportunity Score
  - Fundamental Score
  - Analyst Rating
  - Analyst Upside %
- "View Evidence" link
- "Add to Watchlist" button (if In DB only)

**Empty state:** "No candidates in latest scan" with prompt to run a scan

---

### Tab 2: Scan History

**Purpose:** Answer "How has the market signal evolved over time?"

**Main user question:** What scans have been run, and what did they find?

**Data needed:**
- All RadarScans from last 30 days
- Candidate count per scan
- Status (success/failed)
- Provider, model, source mode
- Scan timestamp

**UI format:** Table with sortable columns and expandable rows

**Columns:**
- Scan Date/Time
- Status (success/failed badge)
- Provider
- Model
- Candidate Count
- Discovery Signals (summary)
- Source Mode (db_context / web_search / fixture)

**Expand row to:** Show candidate list for that scan in collapsed table

**Empty state:** "No scans yet. Run a scan from Admin to get started."

---

### Tab 3: Repeated Signals

**Purpose:** Answer "Which candidates keep appearing? (Requires attention)"

**Main user question:** What research candidates have appeared in multiple scans?

**Implementation note (Phase 24B-3+):**
This tab uses **computed values from scan history**, not persisted schema fields:
- Appearance count = queried count of scans containing this ticker (last 30 days)
- First Seen date = MIN(scanDate) from scan history
- Last Seen date = MAX(scanDate) from scan history
- Trend = computed from appearance frequency (rising/stable/declining)
- Avg Rank = computed from sortRank values across scans

**Data needed:**
- Candidates appearing in ≥2 scans in last 30 days
- Appearance count (computed from scan history)
- First and last seen dates (computed, not persisted)
- Trend (rising, stable, declining in appearance frequency — computed)
- Average rank across scans (if ranked — computed)
- DB status
- Latest discovery signals

**UI format:** Table with sortable columns

**Columns:**
- Ticker
- Company Name
- Appearances (count: last 7d / last 30d)
- First Seen (date)
- Last Seen (date)
- Trend (↑ rising, → stable, ↓ declining)
- Avg Rank (if applicable)
- DB Status
- Reason Tags

**Filter options:**
- Min appearance count (≥2, ≥3, ≥5)
- Time period (last 7d, last 30d)

**Sort options:**
- Appearances desc (default)
- Last Seen desc
- Avg Rank asc

**Empty state:** "No repeated signals in selected period"

---

### Tab 4: New Discoveries

**Purpose:** Answer "What new candidates appeared in the latest scan?"

**Main user question:** What new research candidates were discovered?

**Data needed:**
- Candidates with trendStatus="new_today" (or first appearance in selected scan)
- All fields same as Latest Scan tab
- Emphasis on external discovery status

**UI format:** Cards (same as Latest Scan) or optionally switch to table view

**Key fields (same as Latest Scan):**
- Rank
- Ticker, Company Name
- **DB Status badge (prominent)**
- Trend Status (should be "New")
- Discovery Signals
- Headline
- Main Catalyst
- Evidence
- FomoFilter validation (if In DB)

**Empty state:** "No new discoveries in this scan"

---

### Tab 5: Compare Scans

**Purpose:** Answer "How did the candidate set change between two scans?"

**Main user question:** Which candidates are new, which returned, which dropped?

**Implementation note (Phase 24B-3+):**
This tab computes comparison values on read, not from persisted fields:
- Rank Change = (sortRank in Scan B) - (sortRank in Scan A)
- Matching = ticker matching between two scans
- New candidates = appear in B but not in A
- Dropped candidates = appear in A but not in B

**Data needed:**
- Two scans selected by user (Scan A, Scan B)
- Candidates in Scan A
- Candidates in Scan B
- Matching candidates (same ticker)
- Rank differences (computed as Rank B - Rank A)

**UI format:** Table with comparison columns

**Columns:**
- Ticker
- Company Name
- Rank in A (or "not in A")
- Rank in B (or "not in B")
- Rank Change (↑ improved, ↓ worsened, — unchanged, + new, - dropped)
- Trend Status (in B)
- DB Status
- Discovery Signals (in B)

**Color coding:**
- New candidates: green highlight
- Dropped candidates: gray/muted
- Rank improved: up arrow (green)
- Rank worsened: down arrow (red)

**Sort options:**
- Rank change desc
- Rank in B asc

**Comparison summary:**
```
Scan A (date): X candidates
Scan B (date): Y candidates
New: +N, Dropped: -M, Repeated: Z, Rank improved: P, Rank worsened: Q
```

**Empty state:** "Select two scans to compare"

---

## Phase 24B+ Approved Product Decisions

**Key decisions:**
- ✅ No fixed daily/weekly schedule by default; organized by scan runs
- ✅ Latest Scan is the primary view (not a 3-card deck per lens)
- ✅ Up to 10 candidates in Latest Scan (not fixed 3 per lens)
- ✅ Cards for latest, tables for history/comparison
- ✅ Candidates may exist outside DB (external discovery)
- ✅ External candidates clearly marked with visual badge
- ✅ No FomoFilter production scores invented for external candidates
- ✅ Repeated appearance = "Requires Attention" signal, not recommendation
- ✅ Four lenses no longer primary UX (use discovery signals / reasonTags instead)
- ✅ Research-only language throughout (no buy/sell/hold wording)
- ✅ Track candidates across scans (first seen, last seen, appearance count)

**Non-scope for Phase 24B:**
- Scheduled scans (Phase 24A-3)
- Web search integration (Phase 24C+)
- Provider switching (Phase 25+)
- Auto-universe expansion (future)
- Watchlist support for external discoveries (future)
- Alert support for external discoveries (future)
- Scanner/Dashboard/Drawer changes
- Production scoring formula changes

---

## Page Sections (Legacy — Phase 23A Lens-Based Concept)

### 1. Hero / Daily Opportunity Briefing

Top section of the page.

Contains:
```txt
Page title: "Daily Opportunity Briefing"
Subtitle copy: "Stocks worth a closer look — based on AI-style market discovery signals from the last 24 hours."
Source mode badge (DB-backed in Phase 23C-3):
  - "Fixture scan · local test data" (if sourceMode = fixture)
  - "Claude DB-context scan · no public web search" (if sourceMode = db_context)
  - Other source modes display as "Source scan type · description" for future phases
Last updated timestamp (from scanDate of latest successful scan)
Time controls: Today / Yesterday / Last 7 Days / Last 30 Days tabs
```

Phase 23C-3 note: The badge no longer shows "Mock experience · AI scan not connected yet" when DB scans exist.
If no DB scans exist, an empty state appears instead of the hero and candidates.

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
In Phase 23C-3 (current): tabs filter persisted RadarScan candidates by scanDate.
  - Today: scanDate within current calendar day
  - Yesterday: scanDate within previous calendar day
  - Last 7 Days: scanDate >= now - 7 days
  - Last 30 Days: scanDate >= now - 30 days

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
