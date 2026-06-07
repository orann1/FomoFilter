# Current Feature — Phase 23C-3: Opportunity Radar DB Reader

## Completed Phase

```txt
Phase 23C-3 — Opportunity Radar DB Reader
Status: Completed - QA Passed - Approved for Commit
Focus: /opportunity-radar page now reads persisted RadarScan/RadarCandidate/RadarEvidence data from database
```

## What This Phase Implements

**DB-backed page rendering:**
- Server-side data loader reads successful RadarScan records from the last 30 days
- Includes RadarCandidate and RadarEvidence records with linked Stock/StockScore/StockQuote/StockAnalystData
- Normalized plain objects passed to client component (no Prisma exposure)
- Empty state when no successful scans exist

**Time window filtering:**
- Today: candidates from current calendar day
- Yesterday: candidates from previous calendar day
- Last 7 Days: candidates from the last 7 days
- Last 30 Days: candidates from the last 30 days

**Source mode labeling:**
- `fixture` → "Fixture scan · local test data"
- `db_context` → "Claude DB-context scan · no public web search"
- No false claims about public web discovery

**Candidate display:**
- Ticker, company name, headline, bullets from DB
- Signal Snapshot uses DB-backed validation metrics (Opportunity Score, Fundamental Score, Analyst Upside, etc.)
- Intel Brief shows thesis, narrative fields, evidence/citations
- Missing values show as N/A, not 0

**Scope confirmation:**
- /opportunity-radar no longer displays mock data by default
- Admin UI unchanged
- No Prisma schema changes
- No new migrations
- No provider/AI calls from page render
- No external web/search API calls
- Time tab counts calculated from DB data per selected window
- Lens counts calculated from DB data per selected window

---

## Required Reading

Always read:

```txt
Context/README.md
Context/project-overview.md
Context/current-feature.md
Context/coding-standards.md
Context/ai-interaction.md
Context/architecture.md
Context/data-model.md
```

For this phase, also read:

```txt
Context/Features/opportunity-radar-feature-spec.md
Context/Features/opportunity-radar-ai-agent-spec.md
Context/Features/admin-sync-feature-spec.md
```

---

## Scope — DB Reader Only

### In Scope

```txt
- Server-side data loader (src/lib/data/opportunity-radar.ts)
- Normalized UI data types (OpportunityRadarPageData, RadarCandidateView, RadarScanView, etc.)
- Page component update (app/opportunity-radar/page.tsx)
- Client component update (OpportunityRadarPageClient) to use DB data instead of mock
- Time window filtering by scanDate
- Lens filtering by radarLens
- Empty state when no scans exist
- Source mode labeling (fixture, db_context)
- Evidence/citation display from RadarEvidence records
- Snapshot metrics from linked Stock/StockScore/StockQuote/StockAnalystData
- Type updates (opportunity-radar.ts) to support new fields
- Documentation updates (current-feature, opportunity-radar-feature-spec, opportunity-radar-ai-agent-spec, project-overview)
```

### Out of Scope

```txt
- Claude/OpenAI/Gemini/Grok calls from /opportunity-radar
- Web/search/news API calls
- Scheduled daily scans
- Admin UI changes (buttons already added in Phase 23C-2B)
- Prisma schema changes or migrations
- Production scoring changes
- Scanner/Dashboard/Drawer changes
- Provider/source config models
- Mock data removal from repo (kept for reference/dev)
- /opportunity-radar now uses DB by default but mock fallback not shown as real data
```

---

## Phase 23C-3 Deliverables

This phase produces:

```txt
1. src/lib/data/opportunity-radar.ts — Server-side data loader
2. Updated app/opportunity-radar/page.tsx — Loads DB data via server loader
3. Updated src/components/opportunity-radar/OpportunityRadarPageClient.tsx — Consumes DB data, not mock
4. Updated src/types/opportunity-radar.ts — Added scanDate, radarLens, evidence fields
5. Context/current-feature.md — Updated to Phase 23C-3
6. Context/Features/opportunity-radar-feature-spec.md — Updated to reflect DB reader implementation
7. Context/Features/opportunity-radar-ai-agent-spec.md — Added Phase 23C-3 implementation notes
8. Context/project-overview.md — Roadmap updated
9. All automated checks passing: build, TypeScript, prisma validate, prisma migrate status
```

---

## Acceptance Criteria

**Server-side data loader:**
```txt
✓ getOpportunityRadarData() queries RadarScan with status="success"
✓ Loads from last 30 days of scans
✓ Includes RadarCandidate records
✓ Includes RadarEvidence records
✓ Links Stock/StockScore/StockQuote/StockAnalystData where available
✓ Orders scans by scanDate descending
✓ Returns normalized plain objects (no Prisma)
✓ Handles empty state when no scans exist
```

**Page component:**
```txt
✓ Loads data via getOpportunityRadarData()
✓ Passes normalized data to OpportunityRadarPageClient
✓ Keeps page server-rendered/dynamic as appropriate
✓ No provider calls
✓ No mock data imports
```

**Client component:**
```txt
✓ Accepts initialData prop (OpportunityRadarPageData)
✓ Converts DB candidates to UI format
✓ Time tabs filter by scanDate
✓ Lens buttons filter by radarLens
✓ Opportunity Deck shows top 3 candidates per time + lens
✓ Candidate cards use DB fields
✓ Intel Brief uses DB narrative and evidence fields
✓ Snapshot shows DB validation metrics or N/A
✓ Source mode badge shows fixture/db_context/etc (not "Mock experience")
✓ Empty state when no DB data
✓ No console errors
```

**Time window filtering:**
```txt
✓ Today: scanDate within current calendar day
✓ Yesterday: scanDate within previous calendar day
✓ Last 7 Days: scanDate >= now - 7 days
✓ Last 30 Days: scanDate >= now - 30 days
```

**Lens filtering:**
```txt
✓ Attention Spike: radarLens = "attention_spike"
✓ Overreaction: radarLens = "overreaction"
✓ Value Gap: radarLens = "value_gap"
✓ Future Theme: radarLens = "future_theme"
✓ Lens counts based on selected time window
```

**Empty state:**
```txt
✓ Shown when no successful RadarScan records
✓ Clear message: "No Radar scans yet"
✓ Copy: "Run a Fixture or Claude Radar Scan from Admin Sync to populate this briefing."
✓ Link to /admin/sync
✓ No mock data shown as real
```

**Source mode labeling:**
```txt
✓ fixture → "Fixture scan · local test data"
✓ db_context → "Claude DB-context scan · no public web search"
✓ Metadata shows provider, model, sourceMode, scanDate
✓ No "public web scan" claims
✓ No "Mock experience" badge when DB data exists
```

**Scope confirmation:**
```txt
✓ /opportunity-radar changed (now DB-backed)
✓ Admin UI unchanged
✓ /scanner, /, /admin/sync unchanged
✓ No Prisma schema changes
✓ No new migrations
✓ No provider calls from page
✓ No external API calls from page
✓ No production scoring changes
✓ No scheduled jobs
```

---

## QA Requirements

Browser QA is required because /opportunity-radar UI changes to read from DB.

### A. DB-backed data scenario
- Ensure at least one successful RadarScan exists (from Phase 23C-2B or 23C-2C)
- Load /opportunity-radar
- Confirm candidates display with DB values (not mock)
- Confirm source mode badge shows correct label (fixture or db_context)
- Confirm no "Mock experience" badge appears
- Confirm metadata shows provider/model/scanDate

### B. Time tabs
- Test Today tab: candidates from current date only
- Test Yesterday tab: candidates from previous date
- Test Last 7 Days tab: candidates from last 7 days
- Test Last 30 Days tab: candidates from last 30 days
- Confirm candidate counts update per tab
- Confirm empty state appears if time window has no candidates

### C. Lens filtering
- Test each lens button (Attention Spike, Overreaction, Value Gap, Future Theme)
- Confirm deck shows top 3 candidates for selected lens + time window
- Confirm counts are accurate for selected time window
- Confirm empty state appears if lens has no candidates

### D. Candidate cards
- Click a candidate card
- Confirm ticker/company/headline/bullets show DB values
- Confirm Signal Snapshot uses DB snapshot values or N/A (not 0)
- Confirm evidence count matches

### E. Intel Brief
- Click a candidate to open Intel Brief
- Confirm narrative fields (thesis, whyNow, mainCatalyst, etc.) are DB-backed
- Confirm evidence records display
- Confirm URL null does not render broken links
- Confirm validation metrics display correctly
- Confirm sourceMode/evidence wording does not claim public web discovery

### F. Empty state
- If practical, temporarily query a time window/lens with no candidates
- Confirm empty deck state appears
- Do not delete production data just to test this

### G. Regression routes
- / loads
- /scanner loads  
- /admin/sync loads
- Admin Fixture and Claude buttons still render
- No console errors

---

## Automated Checks Required Before Commit

```bash
npm run build             # Must pass, no TypeScript errors
npx tsc --noEmit        # Must pass
npx prisma validate     # Must pass
npx prisma migrate status  # Must show "Database schema is up to date!"
```

---

## Documentation Updates

Required updates after QA and before commit:

```txt
✓ Context/current-feature.md — This file, now describes Phase 23C-3
✓ Context/Features/opportunity-radar-feature-spec.md — Updated to reflect DB-backed reader
✓ Context/Features/opportunity-radar-ai-agent-spec.md — Added Phase 23C-3 implementation notes
✓ Context/project-overview.md — Roadmap updated to active Phase 23C-3
```

Check but likely no update:
```txt
- Context/data-model.md (RadarScan/Candidate/Evidence models unchanged)
- Context/sync-workflows.md (No sync changes)
- Context/Features/admin-sync-feature-spec.md (Admin UI already documented)
- Context/scoring-system.md (No scoring changes)
```

---

## Ready for Review?

This phase is ready for browser QA and final review once:
- All automated checks pass ✓
- Page loads without errors ✓
- DB-backed candidates display correctly ✓
- Time tabs work ✓
- Lens filters work ✓
- Empty state works ✓
- Source mode labeling is accurate ✓
- Documentation updated ✓

Do not commit until explicit approval is given.
