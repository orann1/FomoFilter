# Current Feature — Phase 23A: Opportunity Radar Mock Experience

## Active Phase

```txt
Phase 23A — Opportunity Radar Mock Experience
Status: Implementation complete. QA passed. Documentation updated. Awaiting commit approval.
Branch: feature/opportunity-radar-mock
```

---

## Required Reading

Always read:

```txt
Context/README.md
Context/project-overview.md
Context/current-feature.md
Context/coding-standards.md
Context/ai-interaction.md
Context/product-lead-workflow.md
```

For this phase, also read:

```txt
Context/Features/opportunity-radar-feature-spec.md
```

Read only if needed:

```txt
Context/architecture.md
Context/Features/scanner-feature-spec.md
Context/Features/dashboard-feature-spec.md
```

---

## Goal (Achieved)

✅ Built a visually distinctive, mock-only Opportunity Radar page at `/opportunity-radar` that surfaces stocks worth further research based on simulated AI-style market discovery signals from the last 24 hours.

**Implementation Summary:**

Core Structure:
- Daily Opportunity Briefing hero with time controls (Today / Yesterday / Last 7 Days / Last 30 Days)
- 4 Radar Lenses for discovery: Attention Spike, Overreaction, Value Gap, Future Theme
- Lens explanation banner with color-coded identity
- 3-card Opportunity Deck showing top candidates for selected Lens
- Intel Brief side panel with deep narrative and validation context

Candidate Cards:
- Ticker, company name, category badge, headline
- 3 radar signal bullets
- Signal Snapshot: Analyst Rating (stars), mock 1W Move, Analyst Upside
- Next Check with category-colored callout
- Click to open Intel Brief

Intel Brief:
- Left: Radar Narrative (why on radar, what's interesting, concerns, next steps)
- Right: FomoFilter Validation (Radar Conviction + 9 validation metrics)
- All scores are mock-only UI concepts

Mock Data:
- 12 fully-formed candidates with comprehensive field coverage
- History-aware fields (trend status, appearance counts, dates)
- Time-window filtering for tabs
- Lens-to-category mapping for discovery flow

Constraints Maintained:
- ✅ Mock UI experience only — no real AI runs
- ✅ No web or news calls
- ✅ No DB reads/writes from render path
- ✅ No schema changes or migrations
- ✅ No provider calls
- ✅ No Admin Sync execution logic
- ✅ No production scoring logic changes
- ✅ Responsible research framing throughout

---

## Product Role

Opportunity Radar is a future AI-assisted market discovery surface, separate from Scanner.

Scanner is a structured filter workspace for stocks already in the DB.
Opportunity Radar is a discovery surface that surfaces interesting setups with richer narrative context, categories, and signals — designed to look like an intelligent daily briefing.

Current phase (23A) establishes the visual product direction before any AI or data infrastructure is built.

---

## Why This Phase Exists

FomoFilter currently supports:

```txt
Scanner — structured filter and sort workspace
Dashboard — high-level portfolio overview
Drawer — decision cockpit for a single stock
```

There is no surface that says: "Here are the stocks worth paying attention to today — and here is why."

Opportunity Radar fills this gap.

Before building the AI agent, DB persistence, and Admin scan workflow required for a real version, the product needs to validate the visual direction and user experience. Phase 23A produces a mock experience that looks and feels like the real product, so the direction can be confirmed before engineering investment begins.

---

## Core User Need

The user needs to be able to open Opportunity Radar and immediately understand:

```txt
What stocks are worth reviewing today?
Why is each one interesting?
How long has this signal been active?
What category does it fall into?
What is the risk profile?
```

The mock must feel like a real product, not a placeholder.

---

## Scope

```txt
New route: /opportunity-radar
Mock-only data: hardcoded or locally generated, no DB reads required
Visually distinctive page: dark UI, radar/command-center aesthetic
Time controls: Today, Yesterday, Last 7 Days, Last 30 Days
Hero / Market Pulse section
Summary cards
Opportunity lanes / category sections
Featured candidate card
Standard candidate cards
Persistent Signals section
New Today section
Research discipline footer
History-aware mock fields and badges (New Today, Repeated Signal, Back on Radar, Cooling Down)
Navigation: add Opportunity Radar to nav sidebar and/or header
Responsible copy: no buy/sell language, research-framing only
```

---

## Non-Scope

Do not implement in Phase 23A:

```txt
Real AI agent
Web search or scraping
News/catalyst ingestion
DB reads or writes
Prisma migration or schema change
Provider calls
Admin Sync execution logic
Real citations or sources
Score formula changes
Alert evaluation engine
Historical price data
Momentum Score
Watchlist integration
Scanner integration
Scheduled jobs
Score persistence
```

---

## Visual Direction

Opportunity Radar must feel visually different from Scanner and Dashboard.

Design guidelines:

```txt
Dark base, elevated UI treatment
Radar / command-center feel
Not a standard data table
Cards with narrative content (thesis, why now, catalyst, bull/bear case)
Score bars and badges
Category lanes with distinct identity
Featured candidate section with expanded visual presence
Time control tabs
Responsible footer copy
```

Refer to Context/Features/opportunity-radar-feature-spec.md for the complete section-by-section layout and candidate card field spec.

---

## Mock Data Requirements

All data must be mock / hardcoded.

Mock data must include:

```txt
8–12 candidate stocks across the defined categories
Full candidate card fields per stock
History-aware fields (trend status, appearance counts, first/last seen dates)
A mix of trend statuses: new_today, repeated, back_on_radar, cooling_down
At least 2 featured candidate candidates
At least 1 candidate per category
Realistic-feeling ticker symbols, company names, theses, and catalysts
Attention, confidence, and hype risk scores (0–100 range)
Evidence count and source type labels
Tags
```

Mock data should be defined in a local TypeScript constant or fixture file.
It must not be fetched from any external source.
It must not be stored in or read from the DB.

---

## History-Aware Mock Behavior

Even in mock form, the Opportunity Radar must simulate history awareness.

Each mock candidate must carry:

```txt
trendStatus: "new_today" | "repeated" | "back_on_radar" | "cooling_down"
appearancesLast7Days: number
appearancesLast30Days: number
firstSeenDate: string (ISO date)
lastSeenDate: string (ISO date)
previousCategories: string[] (empty if new_today)
```

These fields drive the UI badges:

```txt
"New Today" — trendStatus === "new_today"
"Repeated Signal" — trendStatus === "repeated"
"Back on Radar" — trendStatus === "back_on_radar"
"Cooling Down" — trendStatus === "cooling_down"
```

Time control tabs (Today, Yesterday, Last 7 Days, Last 30 Days) should filter or visually adjust the displayed candidates based on mock data — even if the filtering is simulated via hardcoded subsets per time period.

---

## Route Proposal

```txt
/opportunity-radar
```

This is a new top-level route.
It is not a sub-route of /scanner or /admin.

---

## Navigation Proposal

Add Opportunity Radar to the main navigation:

```txt
Position: after Scanner in sidebar/nav
Label: "Opportunity Radar" or "Radar"
Icon: radar/signal/compass icon (lucide or equivalent)
State: active / real page (not disabled or greyed out)
```

---

## Acceptance Criteria

Phase 23A is complete when:

```txt
/opportunity-radar loads without error.
All page sections render with mock data.
Time control tabs render and respond to interaction.
All candidate categories are represented.
Candidate cards show all defined fields.
History-aware badges render correctly based on trendStatus.
Featured candidate section is visible and distinct.
Persistent Signals section is visible.
New Today section is visible.
Research discipline footer is present.
No buy/sell language appears anywhere on the page.
Navigation includes Opportunity Radar.
No DB reads or writes occur.
No provider calls occur.
No AI runs.
No schema changes or migrations.
Build passes.
TypeScript passes.
Prisma validate passes.
Prisma migrate status shows no pending migrations.
```

---

## QA Requirements

Browser QA must verify:

```txt
/opportunity-radar initial load
Hero / Market Pulse section
Time control tab interaction
Summary cards
Category lanes / opportunity sections
Featured candidate card display
Standard candidate cards with all fields
History-aware badges (New Today, Repeated Signal, Back on Radar, Cooling Down)
Persistent Signals section
New Today section
Research discipline footer
Navigation Opportunity Radar link
No layout overflow or broken sections
Mobile/responsive behavior
```

Regression QA must verify:

```txt
/ (Dashboard) still loads
/scanner still loads
/admin/sync still loads
Scanner Drawer still opens
No provider calls from /opportunity-radar render path
```

Automated checks:

```bash
npm run build
npx tsc --noEmit
npx prisma validate
npx prisma migrate status
```

---

## Documentation Checklist

Before requesting commit approval, check and update if needed:

```txt
Context/Features/opportunity-radar-feature-spec.md — primary spec for this phase
Context/project-overview.md — roadmap and routes (already updated in Phase 23A setup)
Context/README.md — feature routing map (already updated in Phase 23A setup)
Context/current-feature.md — this file, update status after completion
Context/feature-history.md — append completed phase summary after commit approval
```

Do not update:

```txt
Context/data-model.md — no schema change
Context/sync-workflows.md — no sync change
Context/Features/admin-sync-feature-spec.md — no admin sync change
Context/Features/market-data-sync-strategy.md — no provider change
Context/scoring-system.md — no score change
```

---

## Required Final Report

Before requesting commit approval, return:

```txt
Branch name used
Files inspected
Files changed
New files added
Implementation summary
QA results (browser)
Automated check results (build, tsc, prisma validate, prisma migrate status)
Documentation Updates:
  - Updated:
  - Checked but not updated:
  - Reason:
  - MD files changed:
Known issues
Ready for review or not
```

Do not commit without explicit approval.
