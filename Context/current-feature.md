# Current Feature

## Active Phase

```txt
No active implementation phase currently started.

Status: ✅ Phase 24B-1 COMPLETED (Opportunity Radar Output Contract + Data Model Foundation)

Previous phases completed:
  - Phase 24A-2 ✅ COMPLETED (AI Scan Config MVP + Result Report)
  - Phase 24B-0 ✅ COMPLETED (Opportunity Radar Product Rework Spec)
  - Phase 24B-1 ✅ COMPLETED (Radar Output Contract + Data Model Foundation)

Next planned phases (not yet started):
  - Phase 24B-2: Prompt Rework + AI Scan Behavior
  - Phase 24B-3: /opportunity-radar UI Rework (5 tabs, comparison tables, computed fields)
```

## Phase 24B-1 — Opportunity Radar Output Contract + Data Model Foundation

### Purpose

Implement the minimal data model and output-contract foundation for the Phase 24B Opportunity Radar rework.

This phase prepares the schema, output contract, validation, persistence, and compatibility layer.

**Out of scope:** Full /opportunity-radar UI rework (Phase 24B-3), scheduled scans, web search integration, provider switching.

### Scope — Phase 24B-1

**In Scope:**
- Prisma schema changes: RadarScan (scanPeriodStart, scanPeriodEnd, scanLabel) + RadarCandidate (reasonTags, externalDiscoveryStatus, dbValidationStatus, researchPriority)
- Migration and schema validation
- Claude output schema v2: reasonTags supported, max 10 candidates, radarLens optional
- Updated build-radar-prompt to request up to 10 ranked candidates with reasonTags
- Updated validate-radar-output for v2 format
- Updated persist-radar-output for DB matching and external discovery handling
- Updated sample-radar-output fixture
- Admin UI compatibility (no redesign, minimal copy updates)
- /opportunity-radar compatibility (reads old and new records, no UI rework)
- Backward compatibility for existing Phase 23C records

**Out of Scope:**
- Full /opportunity-radar UI rework (5 tabs, tabbed structure)
- Scan history / comparison tables
- Repeated signals computation
- Scheduled scans
- Web search integration
- Provider switching
- Auto-universe expansion
- Scanner/Dashboard/Drawer changes
- Production score formula changes

### Implementation Requirements

**1. Schema Changes**

Add minimal backward-compatible fields:

**RadarScan:**
- `scanPeriodStart DateTime?`
- `scanPeriodEnd DateTime?`
- `scanLabel String?`

**RadarCandidate:**
- `reasonTags String[]` (default empty array)
- `externalDiscoveryStatus String?` (values: "in_db", "external_discovery")
- `dbValidationStatus String?` (values: "matched", "not_found", "inactive", "symbol_conflict", "pending_match")
- `researchPriority Int?` (range 1–5, where 5 = highest)
- `radarLens String?` (**made nullable** for v2 support; v1 records keep non-null values; v2 output does not require lens assignment)
- `detailedCategory String?` (**made nullable** for v2 support; v1 legacy field; v2 uses reasonTags instead)

Do NOT remove or modify: 
- `tags` (general metadata, preserved alongside reasonTags)
- `trendStatus`, `sortRank`, `stockId`
- Values of existing v1 records (backward compatible)

**2. Output Schema v2**

Claude tool output schema must support:
- `reasonTags` (required array)
- `researchPriority` (required integer 1–5)
- Candidate count capped at 10
- `radarLens` optional or legacy-compatible, not required for v2

Controlled initial reasonTags:
- analyst_upside, analyst_revision, valuation_gap, recent_weakness, earnings_reaction, momentum_shift, unusual_attention, sector_theme, ai_theme, turnaround_watch, speculative_growth, high_risk, quality_pullback, technical_setup, other

Behavior: Reject unknown reasonTags with clear validation error (safer approach).

**3. Prompt Updates**

Build-radar-prompt must:
- Ask for up to 10 ranked research candidates
- Not force coverage of four lenses/categories
- Not require Attention Spike / Overreaction / Value Gap / Future Theme
- Use reasonTags / discoverySignals
- Allow candidates outside DB universe if meaningful
- Mark outside-DB candidates as external discoveries
- Not invent FomoFilter production scores for external candidates
- Ask for researchPriority 1–5
- State repeated appearances are attention signals, not recommendations
- Keep research-only language
- Prohibit buy/sell/hold/guaranteed/safe language

**4. Validation Updates**

Validate-radar-output must:
- Validate reasonTags
- Validate max 10 candidates
- Validate researchPriority is integer 1–5 if present
- Not reject v2 output solely because radarLens is missing
- Continue validating evidence
- Continue validating score ranges 0–100
- Continue rejecting prohibited financial-advice language

**5. Persistence Updates**

Persist-radar-output must:
- Normalize ticker symbols consistently
- Try to match each candidate ticker to Stock.symbol
- If active stock found: set stockId, externalDiscoveryStatus="in_db", dbValidationStatus="matched"
- If no stock found: stockId=null, externalDiscoveryStatus="external_discovery", dbValidationStatus="not_found"
- If stock exists but isActive=false: set dbValidationStatus="inactive"
- Do not invent scores for external candidates
- Persist reasonTags
- Persist researchPriority if provided
- Preserve legacy fields for backward compatibility

**6. Sample Fixture Updates**

Sample-radar-output v2 style:
- Use reasonTags
- Use researchPriority
- Include at least one DB-matched candidate
- Include at least one external discovery candidate
- Keep evidence valid

**7. Admin UI Compatibility**

- Ensure existing Admin AI Scan UI does not crash with new fields
- Add small copy if low-risk: "External discoveries may not have FomoFilter validation until added to the DB universe."
- Do not overbuild

**8. /opportunity-radar Compatibility**

- Existing page loads with old and new records
- Old records still render
- New v2 records do not crash the page
- Failed scans remain excluded
- External candidates don't crash stock validation display
- Missing radarLens in v2 output doesn't crash old Lens-based UI

### Acceptance Criteria

- ✓ Prisma migration created and applied
- ✓ New schema fields exist
- ✓ Existing old Radar records remain readable
- ✓ Claude output schema v2 supports reasonTags, does not force radarLens
- ✓ Prompt no longer forces four categories
- ✓ Candidate count capped at 10
- ✓ Persistence matches candidates to DB stocks when possible
- ✓ External candidates persist with stockId=null and correct external discovery status
- ✓ External candidates do not show invented FomoFilter scores
- ✓ Failed scan persistence from prior hotfix still works
- ✓ /opportunity-radar loads without crashing
- ✓ Admin AI Scan tab loads without crashing
- ✓ Fixture scan works with v2 output
- ✓ Claude scan either works with v2 output or fails visibly
- ✓ No API keys exposed
- ✓ No provider calls added to normal UI render paths

## Phase 24B-0 — Opportunity Radar Product Rework Spec

### Purpose

Define the new product direction for Opportunity Radar before any schema, code, or UI changes.

This is **documentation and planning only**. No implementation in this phase.

### Problem Statement

Opportunity Radar is currently based on a Lens-based daily briefing model (Phase 23A) with four forced categories:

```txt
Attention Spike
Overreaction
Value Gap
Future Theme
```

This was useful as a visual proof-of-concept, but it is no longer the right product direction.

### New Product Direction

Opportunity Radar should become a **scan-based research signal tracker** that:

- Shows the latest scan as the primary experience
- Displays up to 10 ranked research candidates from the latest scan
- Allows candidates outside the FomoFilter DB universe
- Validates discovered candidates against FomoFilter DB when available
- Clearly marks non-DB candidates as "External Discovery / Not in FomoFilter DB"
- Tracks candidates across scan runs
- Highlights candidates that are new, repeated, back on radar, or attention-needed
- Treats repeated appearances as "requires attention", not as recommendations
- Uses scan periods and scan history, not fixed daily/weekly assumptions
- Uses cards for the latest scan
- Uses comparison/history tables for previous scans and recurring signals
- Uses reasonTags / discoverySignals instead of forced four-lens categorization
- Keeps all language research-only and avoids buy/sell/hold/recommendation wording

### Scope — Phase 24B-0 (This Phase)

**In Scope:**
- Product direction documentation
- Target UI/UX structure (5 tabs)
- Proposed output contract (without forcing radarLens enum)
- Proposed candidate card fields
- Proposed data model fields (as planned, not implemented)
- Historical comparison model concept
- External discovery behavior concept
- Non-scope clarification

**Out of Scope:**
- Schema changes or migrations
- Code implementation
- Prompt changes
- UI component changes
- Watchlist/alert support for external discoveries
- Scheduled scans (Phase 24A-3)
- Web search integration (Phase 24C+)
- Provider switching (Phase 25+)

### Next Likely Phases

**Phase 24B-1:** Radar Data Model Foundation (Minimal Schema Update)
- Add immediate schema fields **only** (do NOT add deferred fields):
  - RadarScan: scanPeriodStart, scanPeriodEnd, scanLabel
  - RadarCandidate: reasonTags, externalDiscoveryStatus, dbValidationStatus, researchPriority
- Keep radarLens and tags unchanged; add reasonTags **alongside** them (not replacing)
- Update validation logic for new fields
- Update sample fixtures
- Backfill existing records with computed values
- **Deferred fields (firstSeenScanId, lastSeenScanId, rankChange, etc.) NOT added in this phase**

**Phase 24B-2:** Prompt Rework + AI Scan Behavior
- Update Claude prompt to request reasonTags instead of forcing lenses
- Implement ticker matching for external discovery candidates
- Add DB validation status computation
- Test new output format

**Phase 24B-3:** /opportunity-radar UI Rework
- Replace Lens-based UI with 5-tab structure
- Latest Scan cards (up to 10 candidates with DB status, trend status, discovery signals)
- Scan History table
- Repeated Signals table (computed from scan history, not persisted fields)
- New Discoveries tab
- Compare Scans tab (computed rank changes, not persisted rankChange field)
- Data loaders compute: firstSeenDate, lastSeenDate, appearanceCount, trendStatus
- Browser QA for all workflows

**Phase 24B-4+:** Enhancements and Scheduling
- Admin configuration enhancements (scanLabel, scanPeriodStart/End UI)
- Scheduled scan triggers (Phase 24A-3)
- Web search modes (future)
- Provider switching (future)

### Documentation References

See specific sections in:
- `Context/Features/opportunity-radar-feature-spec.md` — New product role and tab structure
- `Context/Features/opportunity-radar-ai-agent-spec.md` — New output contract design
- `Context/data-model.md` — Planned Phase 24B fields (not yet implemented)

## What This Phase Implements

**A. Data Model: RadarAiConfig**
- New RadarAiConfig model with editable fields
- Fields: promptTemplate, maxTokens, dbContextLimit, candidateLimit, model, debugTraceEnabled, promptVersion, schemaVersion, changeNotes
- Relationships: One active config at a time; RadarScan.configId (nullable, SetNull on delete)
- Migrations created and applied successfully (RadarAiConfig + model field)

**B. Config Loading: Effective Config Fallback Chain**
- DB config loading with fallback to env vars, then code defaults
- Source tracking: promptSource, maxTokensSource, dbContextLimitSource, modelSource, etc.
- Validation: prompt min 200 chars, tokens 2000–50000, context/candidate limits, model non-empty
- Seeded default config on database init (idempotent) with model field
- Model fallback: DB config.model → ANTHROPIC_RADAR_MODEL env → "claude-sonnet-4-6" default

**C. Claude Scan Behavior**
- Loads effective config on each scan
- Uses DB prompt template if active config exists
- Uses DB max tokens for API request
- Uses DB context limit for stock selection
- Uses DB model (or env/default) for Claude API call
- Stores configId on RadarScan for audit trail
- Returns post-scan metadata to result report (includes model used)

**D. Admin UI: AI Scan Config Section (+ Token Accounting)**
- Collapsed by default at top of AI Scan tab
- Shows config sources (DB / Env / Code Default) for all fields
- Shows maxTokens, dbContextLimit, candidateLimit summary
- API key status explanation (read-only, env-only, restart needed)
- Expandable form to edit:
  - Prompt template (textarea with token estimation)
    - Shows: "Prompt template tokens: ~{number}" (prompt-only, not full request)
    - Helper: "Only counts the editable prompt template text."
    - Updates live as user edits
    - Estimation: hybrid algorithm (char/4.5 vs words*1.25, uses lower)
  
  **Token Breakdown Section** (below prompt):
    - Clear cost breakdown showing all components:
      - Prompt template: ~{tokens}
      - DB stock context: ~{tokens} (estimated from selected stock count)
      - Tool schema / runtime: ~{tokens} (tool definition, message wrapper, etc.)
      - Estimated full request: ~{tokens} (sum of above)
      - Exact full request: {tokens} (if counted from API)
    - "Count full request tokens" button:
      - Calls Anthropic token counting API with full message (prompt + context + tools)
      - Server-side only, no client API call
      - Includes actual DB context, message formatting, tool schema
      - Safe error if ANTHROPIC_API_KEY missing
      - No Claude inference, no scan data persisted
    - Helper: "Full request includes... Final API usage may differ slightly."
  
  - Max tokens (number input, 2000–50000)
  - DB Stocks Sent to Claude (was "DB Context Limit") (1–100)
    - Helper: "Number of stocks included in context (1–100). Higher values increase token usage."
  - Max Candidates to Return (was "Candidate Limit") (1–20)
    - Helper: "Maximum research candidates Claude can return (1–20). Higher values may increase noise."
  - Claude model (text input, e.g., "claude-sonnet-4-6")
  - Debug trace toggle
  - Change notes field
- Save button triggers saveRadarConfigAction
- Success/error message display
- Config reloads after save

**E. Admin UI: Claude Scan Reorganization**
- Moved to primary visible section (below config)
- Renamed to "Claude Scan" with "Primary Action" badge
- Uses active DB config
- Shows updated progress UI with honest labeling ("Estimated progress")
- Returns post-scan result report

**F. Admin UI: Fixture Scan Reorganization**
- Moved into collapsed "QA / Test Scan" section
- Collapsed by default
- Button: "Run Fixture Scan"
- Same functionality, different layout
- Not changed to "obsolete" — still useful for testing validation pipeline

**G. Post-Scan Result Report Component**
- Displays after Claude Scan completes
- Shows: scanId, candidates, evidence, duration
- Shows: provider, model, sourceMode
- Shows: token usage (prompt, completion, total) if available
- Shows: configId if DB config was used
- Shows: debugTracePath if enabled
- Includes safety disclaimer: "Research candidates only"
- Includes link to /opportunity-radar

**H. Honest Progress UI**
- Progress steps labeled as "Estimated progress"
- Note: "Exact live step tracking requires future progress tracking phase"
- Does not claim exact real-time stage updates
- Does not misleadingly appear stuck on first step

## Scope — Phase 24A-2 Only

### In Scope

```txt
- RadarAiConfig model + migrations (including model field)
- Config loading with fallback chain (DB → Env → Defaults)
- Default config seeding (idempotent)
- saveRadarConfigAction and getEffectiveRadarConfigAction
- RadarConfigSection component (collapsed, expandable form)
- Editable model field in config form
- RadarScanResultReport component
- Updated Claude scan action to use DB config (including model)
- Updated build-radar-prompt to accept custom prompt + context limit
- Updated persistRadarScanOutput to accept and store configId
- Updated AiScanTab layout (config at top, Claude primary, Fixture in QA section)
- Improved token estimation accuracy (hybrid algorithm: char/4.5 vs words*1.25)
- Server-side exact token counting (Anthropic API, no client call, safe error handling)
- Clearer field labels:
  - "DB Stocks Sent to Claude" (was "DB Context Limit")
  - "Max Candidates to Return" (was "Candidate Limit")
- Improved helper text for all config fields
- API key status explanation (env-only, restart needed, never shown)
- Honest progress UI labeling
- API key remains env-only (no editing UI)
```

### Out of Scope

```txt
- Scheduled scans
- Full real-time DB job progress tracking
- Provider switching UI
- API key editing UI
- Model selection UI
- Multiple active configs (only one at a time, manual DB edit for now)
- Cost estimation (skip or show "Not calculated")
- Historical config versioning
- Scanner/Dashboard/Drawer changes
- Opportunity Score/Fundamental Score changes
- /opportunity-radar changes
```

## Required Reading

Always read:

```txt
Context/README.md
Context/project-overview.md
Context/current-feature.md (this file)
Context/coding-standards.md
Context/ai-interaction.md
Context/architecture.md
Context/data-model.md
```

For this phase, also read:

```txt
Context/Features/admin-sync-feature-spec.md
Context/Features/opportunity-radar-ai-agent-spec.md
```

## Acceptance Criteria

### Schema & Config

```txt
✓ RadarAiConfig model exists with all required fields (including model)
✓ RadarScan.configId field added (nullable)
✓ Migrations created and applied (npx prisma migrate status shows "up to date")
✓ Default config seeded (idempotent — no duplicates on repeated seed)
✓ Config validation works (prompt min 200 chars, tokens 2000–50000, limits in range, model non-empty)
✓ Fallback chain works for all fields (DB → Env → Code Default)
✓ Model fallback chain works (DB config.model → env var → code default)
✓ API key remains env-only (not exposed in config object)
```

### Admin UI

```txt
✓ AI Scan Config section exists and is collapsed by default
✓ Config source is displayed (DB / Env / Code Default) for each field
✓ Expand shows editable form with all fields
✓ Prompt template textarea is functional with improved token estimation
✓ "Count exact tokens" button appears next to estimated token count
✓ Clicking "Count exact tokens" calls server-side Anthropic API and shows result
✓ If ANTHROPIC_API_KEY missing, shows safe error: "Exact token count requires ANTHROPIC_API_KEY..."
✓ No API key value is exposed anywhere
✓ Token error message doesn't interrupt config saving
✓ Max tokens, DB Stocks Sent to Claude, Max Candidates to Return inputs work
✓ Helper text shows: "Number of stocks..." and "Maximum research candidates..." respectively
✓ Claude model input is editable
✓ Debug trace checkbox works
✓ Change notes field is optional
✓ API key status explanation shows: "API Key: Read from ANTHROPIC_API_KEY environment variable..."
✓ Save button calls saveRadarConfigAction
✓ Success/error messages display after save
✓ Config reloads after successful save
✓ Next Claude scan uses saved config (including model)
✓ Claude Scan remains primary visible action
✓ Fixture Scan is inside collapsed "QA / Test Scan"
✓ Fixture Scan still works from collapsed section
✓ Progress UI is labeled as "Estimated progress"
✓ Post-scan report displays after completion
✓ Report includes scanId, candidates, evidence, duration, tokens, model, config source
✓ Report includes safety disclaimer
✓ Token estimation is more accurate (~500 for default prompt, not ~620)
✓ Disclaimer distinguishes "Estimated tokens" vs "Exact tokens"
```

### Behavior

```txt
✓ Claude Scan loads config on each execution
✓ Claude Scan uses DB prompt if active config exists
✓ Claude Scan uses DB max tokens for API request
✓ Claude Scan uses DB context limit for stock selection
✓ Claude Scan stores configId on RadarScan
✓ Fixture Scan still works without DB config (persists with configId=null)
✓ No validation failures cause DB persistence
✓ No provider calls from normal UI render paths
✓ No Scanner/Dashboard/Drawer/opportunity-radar changes
✓ No API key exposed in logs or UI
```

## QA Requirements

### Browser QA

**Load Admin Page**
- Navigate to /admin/sync
- Confirm no errors on load
- AI Scan tab is visible and selectable
- Click AI Scan tab

**AI Scan Config Section**
- Confirm "AI Scan Config" section exists at top
- Confirm it is collapsed by default
- Confirm config source is displayed (e.g., "Using DB config")
- Confirm token/limit summary is shown
- Click to expand
- Confirm form fields render (prompt textarea, inputs, checkbox, save button)
- Confirm current values are populated

**Edit Config**
- Change maxTokens to a different value (e.g., 6000)
- Change "DB Stocks Sent to Claude" to a different value (e.g., 15)
- Confirm helper text is clear: "Number of stocks included in context..."
- Change "Max Candidates to Return" to a different value (e.g., 8)
- Confirm helper text is clear: "Maximum research candidates..."
- Add a change note
- Click Save button
- Confirm success message appears
- Confirm save completes without errors
- Reload page
- Confirm new values persist in form

**Token Count Features**
- Confirm estimated token count is displayed with live updates (should be ~500 for default prompt, not ~620)
- Confirm "Count exact tokens" button appears next to estimated count
- Click "Count exact tokens" button:
  - If ANTHROPIC_API_KEY is configured:
    - Button shows loading state
    - After completion, shows "Exact: {number}" with the exact token count
    - No Claude scan is triggered (confirm no pricing in logs)
  - If ANTHROPIC_API_KEY is missing:
    - Shows error: "Exact token count requires ANTHROPIC_API_KEY environment variable"
    - No key value is exposed
    - Can still save config normally with estimated tokens
- Confirm token disclaimer: "Estimated tokens are approximate; exact token count includes message formatting. Final API usage may differ due to context and tool schema."
- Confirm API key status explanation: "API Key: Read from ANTHROPIC_API_KEY environment variable on the server."

**Claude Scan Section**
- Confirm it is the primary visible action (after config)
- Confirm "Primary Action" badge is shown
- Confirm progress display is labeled honestly
- Click "Run Claude Scan" button
- Monitor progress display (should show estimated stages)
- After completion, confirm post-scan result report appears
- Confirm report shows:
  - Scan ID
  - Candidate count
  - Evidence count
  - Duration
  - Provider, model, source mode
  - Token usage (if available)
  - Debug trace link (if enabled)
  - Safety disclaimer
- Confirm report includes link to /opportunity-radar

**QA / Test Scan Section**
- Confirm "QA / Test Scan" section exists below Claude Scan
- Confirm it is collapsed by default
- Click to expand
- Confirm Fixture Scan button is visible
- Click "Run Fixture Scan"
- Confirm it still works and persists to DB

**Regression Routes**
- / loads without errors
- /scanner loads without errors
- /opportunity-radar loads without errors
- No console errors in DevTools

### Automated Checks

```bash
npm run build                 # Must pass, no errors
npx tsc --noEmit            # Must pass, no TypeScript errors
npx prisma validate         # Must pass, schema is valid
npx prisma migrate status   # Must show "Database schema is up to date!"
```

## Documentation Updates

### Updated

- `Context/data-model.md` — Added RadarAiConfig model, updated RadarScan.configId, updated Radar Schema status
- `Context/Features/admin-sync-feature-spec.md` — Phase 24A-2 AI Scan Config and UI changes
- `Context/current-feature.md` — This file, Phase 24A-2 spec and acceptance criteria

### Checked but Not Updated

- `Context/architecture.md` — No architecture changes; config loading is internal to opportunity-radar module
- `Context/sync-workflows.md` — No sync workflow changes
- `Context/Features/opportunity-radar-ai-agent-spec.md` — General design doc; Phase 24A-2 details documented in admin-sync-feature-spec.md
- `Context/scoring-system.md` — No scoring changes
- `Context/project-overview.md` — Keep Phase 23C-3 as most recent public feature; Phase 24A-2 is admin-only infrastructure

## Ready for Review?

**Automated Checks:**
- npm run build passes ✓
- npx tsc --noEmit passes ✓
- npx prisma validate passes ✓
- npx prisma migrate status shows "up to date" ✓

**Browser QA:**
- Admin UI Config section works ✓
- Save config persists changes ✓
- Claude Scan uses saved config ✓
- Post-scan report displays ✓
- Fixture Scan still works from collapsed section ✓
- Progress UI is labeled honestly ✓
- No console errors ✓

**Regression:**
- / loads ✓
- /scanner loads ✓
- /opportunity-radar loads ✓

**Documentation:**
- data-model.md updated ✓
- admin-sync-feature-spec.md updated ✓
- current-feature.md updated ✓
- Scope confirmed (Phase 24A-2 only) ✓

**Code Quality:**
- API key remains env-only ✓
- No provider calls from normal render paths ✓
- No Scanner/Dashboard/Drawer changes ✓
- Minimal, focused changes ✓

Do not commit until explicit approval is given.
