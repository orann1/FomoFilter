# Current Feature — Phase 23C-2B: Opportunity Radar Admin Scan Button + Fixture Execution

## Active Phase

```txt
Phase 23C-2B — Opportunity Radar Admin Scan Button + Fixture Execution
Status: Completed - QA Passed - Ready for Merge
Focus: Add Admin UI button to trigger fixture validation and persistence from /admin/sync page
```

**✓ Completion Checklist:**
- ✓ Server Action implemented (runOpportunityRadarFixtureScanAction)
- ✓ Admin UI section added to /admin/sync Sync Actions tab
- ✓ Result viewer components (success/error states)
- ✓ Admin button QA passed (fixture scan executed successfully)
- ✓ DB persistence verified (scanId cmq471fq600000sc86guhom4e with 3 candidates, 7 evidence)
- ✓ Stock linking verified (NVDA, SMCI, META)
- ✓ Re-click behavior verified (separate scans created, no data loss)
- ✓ Admin regression verified (all sections still render)
- ✓ Route regression verified (/, /scanner, /opportunity-radar)
- ✓ Validation tests passed (8/8)
- ✓ Automated checks passed (build, tsc, prisma validate, migrate status)
- ✓ Documentation updated (feature-history, current-feature, admin-sync-feature-spec, project-overview)
- ✓ Code ready for commit and merge

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
Context/sync-workflows.md
```

For this phase, also read:

```txt
Context/Features/opportunity-radar-ai-agent-spec.md
Context/Features/opportunity-radar-feature-spec.md
Context/Features/admin-sync-feature-spec.md
Context/scoring-system.md
Context/Algorithms/opportunity-score-v2.md
Context/Algorithms/fundamental-score-v1.md
```

---

## Goal

Implement Phase 23C-2B — Opportunity Radar Admin Scan Button + Fixture Execution.

Add a manual Admin control to the /admin/sync Sync Actions tab that allows users to trigger the Opportunity Radar fixture validation and persistence flow with a single click.

Uses the existing Phase 23C-2A infrastructure:
- validateRadarScanOutput(...) validation function
- persistRadarScanOutput(...) persistence function
- sampleRadarOutput fixture data

**This phase does NOT:**
- Call Claude, OpenAI, Gemini, Grok, or any AI provider
- Call external search/web/news APIs
- Add real provider integration
- Add provider/prompt/source configuration models
- Update /opportunity-radar to read from DB
- Add scheduled jobs
- Change production scoring logic
- Change Prisma schema or add migrations

**This phase DOES:**
- Create a Server Action to validate fixture and persist to DB
- Add Admin UI section to Sync Actions tab with button and result display
- Show success state with scanId, candidateCount, evidenceCount
- Show error state with validation errors if any
- Update documentation (current-feature, admin-sync-feature-spec, project-overview)

---

## Scope — Admin Button + Fixture Execution Only

### In Scope

```txt
- Server Action (runOpportunityRadarFixtureScanAction) that validates and persists fixture
- Admin UI section in /admin/sync Sync Actions tab
- Button to trigger the action
- Success state display (scanId, candidateCount, evidenceCount)
- Error state display (error message + validation errors if any)
- Documentation updates (current-feature.md, admin-sync-feature-spec.md, project-overview.md)
```

### Out of Scope

```txt
- Real Claude/OpenAI/Gemini/Grok API calls
- External search/web/news API calls
- Provider configuration models
- Prompt version management
- Source registry management
- /opportunity-radar UI changes (still mock-only)
- Scheduled job implementation
- Real AI agent execution (comes in Phase 23C-2C)
- SyncRun integration for Radar scans (use RadarScan directly)
- Prisma schema changes or migrations
- Production scoring changes
```

---

## Phase 23C-2B Deliverables

This phase produces:

```txt
1. src/actions/opportunity-radar-actions.ts — Server Action for fixture scan
2. Updated src/components/admin/SyncPageClient.tsx — New Opportunity Radar section in Sync Actions tab
3. RadarFixtureScanResultViewer component — Display success/error states
4. Context/current-feature.md updated to Phase 23C-2B spec
5. Context/Features/admin-sync-feature-spec.md — Add Opportunity Radar section
6. Context/project-overview.md — Update roadmap to Phase 23C-2B active
7. All automated checks passing: build, TypeScript, prisma validate, prisma migrate status
```

---

## Acceptance Criteria

**Admin UI:**
```txt
✓ /admin/sync Sync Actions tab has new Opportunity Radar section
✓ Section title, icon, and badges clearly visible
✓ Copy explains "fixture-only" and "no AI/provider/search calls"
✓ Button labeled "Run Fixture Radar Scan"
✓ Button disabled while loading, enabled otherwise
✓ Loading state shows spinner icon
✓ Button does not trigger on double-click
```

**Server Action:**
```txt
✓ runOpportunityRadarFixtureScanAction exists in src/actions/opportunity-radar-actions.ts
✓ Returns RadarFixtureScanResult type
✓ Validates sampleRadarOutput with validateRadarScanOutput()
✓ Persists with persistRadarScanOutput() if validation passes
✓ Returns success: true, scanId, candidateCount, evidenceCount on success
✓ Returns success: false, error, validationErrors on failure
✓ No external AI/provider/search calls made
```

**Success State Display:**
```txt
✓ Shows green success badge with checkmark
✓ Displays scanId (monospace font)
✓ Displays candidateCount (emerald color)
✓ Displays evidenceCount (emerald color)
✓ All three values in clear labeled grid
```

**Error State Display:**
```txt
✓ Shows red error badge with X icon
✓ Displays error message
✓ Shows list of validation errors if present
✓ Error text is readable and actionable
```

**Fixture Execution:**
```txt
✓ Clicking button creates real RadarScan record in DB
✓ RadarScan has correct metadata (provider, model, status, summary)
✓ 3 RadarCandidate records created (NVDA, SMCI, META)
✓ Stock linking works (NVDA, SMCI, META symbols found)
✓ 7 RadarEvidence records created (2, 3, 2 per candidate)
✓ Multiple clicks create separate scans (no duplicates deleted)
```

**Automated Checks:**
```txt
✓ npm run build succeeds
✓ npx tsc --noEmit succeeds (no TypeScript errors)
✓ npx prisma validate passes (schema unchanged)
✓ npx prisma migrate status shows clean state (no new migrations)
✓ Existing validation tests (test-radar-validation.ts) still pass
✓ Existing persistence QA script (run-radar-fixture-persistence.ts) still works
```

**Scope Confirmation:**
```txt
✓ Admin UI changed (SyncPageClient.tsx only)
✓ /opportunity-radar unchanged (still mock-only)
✓ /scanner unchanged
✓ / (dashboard) unchanged
✓ No Prisma schema changes
✓ No new migrations
✓ No AI/provider calls
✓ No external web/search calls
✓ No production scoring changes
✓ No scheduled jobs added
```

---

## Required Final Report

Before commit approval, return in English:

```txt
1. Branch name used
2. Files inspected
3. Files changed
4. Implementation summary:
   - Server Action: runOpportunityRadarFixtureScanAction()
   - Admin UI: New Opportunity Radar section in Sync Actions tab
   - Result display: Success and error states
5. Server Action behavior:
   - Accepts no parameters
   - Validates sampleRadarOutput
   - Persists if validation passes
   - Returns scanId, candidateCount, evidenceCount on success
6. Admin UI behavior:
   - Button triggers action
   - Loading state while running
   - Success display with metrics
   - Error display with messages
7. Browser QA results:
   - /admin/sync loads
   - Opportunity Radar section visible
   - Button clickable and triggers action
   - Success/error states display correctly
   - Real DB write confirmed (scanId, candidates, evidence)
   - /opportunity-radar still mock-only
   - /scanner unaffected
   - / (dashboard) unaffected
8. DB persistence from Admin button:
   - scanId: [actual ID from QA]
   - candidateCount: 3
   - evidenceCount: 7
9. Automated check results:
   - npm run build
   - npx tsc --noEmit
   - npx prisma validate
   - npx prisma migrate status
   - validation test script still passes
   - persistence QA script still works
10. Documentation Updates:
   - Updated: Context/current-feature.md, Context/Features/admin-sync-feature-spec.md, Context/project-overview.md
   - Checked: Context/data-model.md (no schema changes, not updated)
   - Reason: Phase 23C-2B specifies Admin UI only, no schema changes needed
   - MD files changed: 3 files
11. Scope confirmation:
   - Admin UI changed: YES (SyncPageClient.tsx)
   - Application UI outside Admin changed: NO
   - DB/schema changed: NO
   - migrations added: NO
   - provider/AI/API calls: NO
   - external search/web calls: NO
   - production scoring changed: NO
   - /opportunity-radar UI changed: NO
12. Known issues or risks
13. Ready for review or not
```

Do not commit without explicit approval.
