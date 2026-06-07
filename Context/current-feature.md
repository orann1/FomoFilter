# Current Feature — Phase 23C-2C: Claude Provider Adapter + Controlled Admin Execution

## Active Phase

```txt
Phase 23C-2C — Claude Provider Adapter + Controlled Admin Execution
Status: Completed - QA Passed - Ready for Merge
Focus: Real Claude Sonnet 4.6 API execution from Admin Sync page with DB-backed context (controlled source pack mode)
```

## What This Phase Implements

**Server-side Claude integration:**
- Claude provider adapter using fetch to Anthropic Messages API
- Prompt builder that loads active stocks from database as context
- New Server Action to call Claude and validate/persist results
- Admin UI button to trigger real Claude scans
- Clear error handling for missing API key and provider failures

**Key constraints:**
- Server-side only — no client exposure of API key
- DB context mode — Claude analyzes provided stocks, no public web search claims
- Validation gatekeeper — invalid Claude output is not persisted
- Clear labeling — Admin UI distinguishes fixture from real AI execution
- Error transparency — missing keys, provider errors, validation failures all show clear messages

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

## Scope — Claude Integration Only

### In Scope

```txt
- Claude provider adapter (fetch-based, server-side only)
- Prompt builder using DB context (controlled source pack mode)
- Server Action (runOpportunityRadarClaudeScanAction) for real Claude calls
- Admin UI button to trigger Claude scans
- Result display (success: scanId, candidateCount, evidenceCount, provider, model, sourceMode, executionTimeMs)
- Error display (missing key, provider error, validation errors, raw output preview)
- Environment variable: ANTHROPIC_API_KEY (required)
- Optional env override: ANTHROPIC_RADAR_MODEL (default: claude-sonnet-4.6)
- Documentation updates (current-feature, admin-sync-feature-spec, opportunity-radar-ai-agent-spec, project-overview)
```

### Out of Scope

```txt
- OpenAI integration
- Gemini integration
- Grok integration
- Multi-provider routing or fallback
- Provider configuration database models
- Prompt version management database models
- Source registry database models
- Scheduled daily scans
- /opportunity-radar page DB reader (Phase 23C-3)
- SyncRun integration for Radar scans
- Production scoring changes
- Prisma schema changes or migrations
- Real public web search (uses DB context only)
- Cost estimation features
- Provider secret encryption/storage
- Public web search claims
```

---

## Phase 23C-2C Deliverables

This phase produces:

```txt
1. src/lib/opportunity-radar/claude-radar-provider.ts — fetch-based Anthropic API client
2. src/lib/opportunity-radar/build-radar-prompt.ts — Prompt builder with DB context loading
3. Updated src/actions/opportunity-radar-actions.ts — New runOpportunityRadarClaudeScanAction()
4. Updated src/components/admin/SyncPageClient.tsx — Claude Radar Scan button and result viewer
5. Context/current-feature.md — updated to Phase 23C-2C spec
6. Context/project-overview.md — roadmap updated (Phase 23C-2B → 23C-2C active)
7. Context/Features/admin-sync-feature-spec.md — added Claude Radar Scan section
8. Context/Features/opportunity-radar-ai-agent-spec.md — added implementation notes
9. All automated checks passing: build, TypeScript, prisma validate, prisma migrate status
```

---

## Acceptance Criteria

**Server-side provider adapter:**
```txt
✓ Claude provider uses fetch to Anthropic Messages API
✓ API key read from ANTHROPIC_API_KEY environment variable
✓ Model read from ANTHROPIC_RADAR_MODEL (default: claude-sonnet-4.6)
✓ Returns clear error if API key missing
✓ Returns clear error if model not available
✓ Captures execution time
✓ Parses JSON from response (handles markdown code blocks)
✓ Returns both raw text and parsed object
✓ Records provider metadata: provider, model, executionTimeMs, token usage
```

**Prompt builder:**
```txt
✓ Loads active stocks from database (top ~20 by opportunity score)
✓ Builds prompt that enforces: research-only, no buy/sell, valid JSON, no web search claims
✓ Prompt includes explicit instruction to use DB context only
✓ Prompt includes all validation rules (prohibited language, score ranges, enum values)
✓ Returns full prompt text ready for API call
```

**Server Action (runOpportunityRadarClaudeScanAction):**
```txt
✓ Builds prompt with DB context
✓ Calls Claude via provider adapter
✓ Validates output with validateRadarScanOutput()
✓ Returns error if API key missing without calling Claude
✓ Returns error if provider call fails (API error, rate limit, etc)
✓ Returns error with validationErrors if output invalid
✓ Persists to DB if validation passes
✓ Returns success: true, scanId, candidateCount, evidenceCount on success
✓ Returns provider, model, sourceMode, executionTimeMs metadata
✓ Does not persist invalid Claude output
```

**Admin UI:**
```txt
✓ New "Run Claude Radar Scan" button in Opportunity Radar section
✓ Button clearly labeled and distinguished from Fixture button
✓ Copy explains: Claude server-side, DB context mode, no public web scan claim
✓ Button disabled while Claude scan running
✓ Loading state shows spinner icon
✓ Success state displays scanId, candidateCount, evidenceCount, provider, model, sourceMode, executionTimeMs
✓ Error state displays error message
✓ Error state shows validation errors if present
✓ Error state shows rawOutputPreview (first 500 chars) if validation failed
✓ Result viewer shows no API key or sensitive data
```

**Scope confirmation:**
```txt
✓ Admin UI changed (SyncPageClient.tsx only)
✓ /opportunity-radar unchanged (still mock-only)
✓ /scanner unchanged
✓ / (dashboard) unchanged
✓ No Prisma schema changes
✓ No new migrations
✓ No OpenAI/Gemini/Grok calls
✓ No real public web/search API calls
✓ No production scoring changes
✓ No scheduled jobs added
✓ No provider config models added
✓ No prompt/source registry models added
```

---

## Implementation Notes

**Why fetch instead of @anthropic-ai/sdk:**
- Reduces dependencies (project avoids adding new major packages without approval)
- Follows existing project pattern (market data providers use fetch)
- Simple Messages API request format is straightforward to implement
- Maintains fine control over request/response handling

**Why DB context instead of real web search:**
- No real web search infrastructure exists yet (spec from Phase 23B/23C)
- DB context is a controlled, auditable source (real market stocks in the system)
- Matches "controlled source pack" mode from opportunity-radar-ai-agent-spec
- Prevents false claims of public web discovery
- Admin UI clearly labels this as DB-context scan, not web scan

**Why validation before persistence:**
- Invalid Claude output (hallucinations, wrong format, prohibited language) should not pollute the database
- validateRadarScanOutput() is the gatekeeper — enforces same rules as fixture
- Admin sees clear error messages instead of silent failures
- Preserves data integrity from the start

---

## QA & Testing Plan

### Manual Browser QA Required

**A. Missing API key scenario**
- Ensure ANTHROPIC_API_KEY is not set or empty
- Click "Run Claude Radar Scan"
- Confirm error message about missing key is displayed
- Confirm no RadarScan records are created

**B. Successful provider scenario (if API key available)**
- Set ANTHROPIC_API_KEY
- Click "Run Claude Radar Scan"
- Confirm loading state shows spinner
- Confirm scan completes and displays success panel
- Confirm scanId, candidateCount, evidenceCount are shown
- Confirm provider="Anthropic", model shows correct name
- Confirm sourceMode="db_context"
- Confirm RadarScan exists in database
- Confirm RadarCandidate records created with stock links
- Confirm RadarEvidence records created

**C. Validation failure handling (if applicable)**
- If Claude returns invalid JSON or violates rules
- Confirm error message is shown
- Confirm validation errors are listed
- Confirm rawOutputPreview shows first 500 chars safely
- Confirm no RadarScan/candidates are persisted

**D. Fixture button regression**
- Confirm "Run Fixture Radar Scan" still works
- Confirm scanId/candidate/evidence counts display
- Confirm fixture and Claude buttons can both be used

**E. Admin regression**
- Confirm all other Admin sections render (Sync Actions, Provider Tests, Sync History, Data Inventory, Score Methodology)
- Confirm no layout breakage
- Confirm existing sync buttons still work

**F. Route regression**
- Confirm / (dashboard) loads
- Confirm /scanner loads
- Confirm /opportunity-radar loads and still uses mock data

### Automated Checks

```bash
npm run build               # Must succeed, no TypeScript errors
npx tsc --noEmit          # Must pass
npx prisma validate       # Must pass
npx prisma migrate status # Must show "Database schema is up to date!"
```

---

## Known Issues & Constraints

**1. Database context may be empty**
- If database has no active stocks, Claude receives empty context
- Prompt handles this gracefully but may return no candidates
- Admin sees success with candidateCount=0 (correct behavior)

**2. Model availability**
- ANTHROPIC_RADAR_MODEL default is claude-sonnet-4.6
- If this model becomes unavailable, Admin sees clear error: "Claude model not available..."
- User can override with ANTHROPIC_RADAR_MODEL environment variable

**3. No real web search**
- Admin UI clearly states "Does not claim public web discovery"
- Prompt instructions forbid public web search claims
- This is intentional — real web search comes in future phases

**4. Token usage not persisted yet**
- Claude response includes input/output tokens
- Provider adapter captures them in metadata
- RadarScan model has token fields but we don't store them yet
- This is acceptable for Phase 23C-2C; cost tracking is future work

---

## Ready for Review?

This phase is ready for browser QA and final review once:
- All automated checks pass ✓
- Admin UI renders without errors ✓
- Both Fixture and Claude buttons are clickable ✓
- Documentation is complete ✓
- Error scenarios are tested ✓

Do not commit until explicit approval is given.
