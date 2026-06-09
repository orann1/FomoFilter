# Current Feature

## Active Phase

```txt
Phase 24A-2 — AI Scan Config MVP + Result Report
Status: ✅ COMPLETED (Committed and Merged)

No active phase is currently started.
Next phases may include: Phase 24A-3 (scheduled scans), Phase 24B (provider switching), or other enhancements.
```

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
