# Current Feature — Phase 23C-2A: Opportunity Radar Output Validation + DB Persistence From Fixture

## Active Phase

```txt
Phase 23C-2A — Opportunity Radar Output Validation + DB Persistence From Fixture
Status: Implementation in progress
Focus: Validate AI agent output and persist fixture data to RadarScan, RadarCandidate, RadarEvidence tables
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

Implement Phase 23C-2A — Opportunity Radar Output Validation + DB Persistence From Fixture.

Create server-side validation and persistence functions for Radar AI output, using a local fixture to test that:
1. Radar scan output JSON can be validated for schema compliance
2. Valid output can be persisted to the database
3. Fixture data does not require external AI/provider calls

**This phase does NOT:**
- Call Claude, OpenAI, Gemini, Grok, or any AI provider
- Call external search/web/news APIs
- Add Admin Scan button UI
- Add scheduled jobs
- Update /opportunity-radar to read from DB
- Change production scoring logic
- Add provider/prompt/source configuration models

**This phase DOES:**
- Define TypeScript types for Radar agent output (RadarScanOutput, RadarCandidateOutput, etc.)
- Implement validation function with strict rules (0-100 scores, enum checking, prohibited language, evidence requirements)
- Implement persistence function using Prisma transactions
- Create sample fixture with 3 candidates covering different radar lenses
- Create QA script to test validation and persistence
- Update documentation

---

## Scope — Validation + Fixture Persistence Only

### In Scope

```txt
- TypeScript types for Radar agent output (opportunity-radar-agent.ts)
- Validation function with strict rule enforcement
- Persistence function using Prisma with transaction support
- Sample fixture with 3 realistic candidates (attention_spike, overreaction, value_gap)
- QA script for testing validation and persistence
- Documentation updates (current-feature.md, data-model.md)
```

### Out of Scope

```txt
- Admin Scan button UI or Server Action
- /opportunity-radar route changes or UI updates
- AI provider API calls (Claude, OpenAI, Gemini, Grok, Anthropic SDK)
- External search/web/news API calls
- Web scraping implementation
- Scheduled job implementation
- RadarPromptVersion, RadarProviderConfig, RadarSource models
- Production scoring changes
- Seed data
- Admin UI
- API routes
- SyncRun records (unless unavoidable)
- Provider/prompt/source configuration screens
```

---

## Phase 23C-2A Deliverables

This phase produces:

```txt
1. src/types/opportunity-radar-agent.ts — TypeScript types for RadarScanOutput, RadarCandidateOutput, ValidatedRadarScanOutput
2. src/lib/opportunity-radar/validate-radar-output.ts — Validation function with strict rules
3. src/lib/opportunity-radar/persist-radar-output.ts — Persistence function using Prisma transactions
4. src/lib/opportunity-radar/sample-radar-output.ts — Fixture with 3 candidates
5. scripts/run-radar-fixture-persistence.ts — QA script for manual testing
6. Context/current-feature.md updated with Phase 23C-2A spec
7. Context/data-model.md reviewed and updated if needed
8. All automated checks passing: build, TypeScript, prisma validate, prisma migrate status
```

---

## Acceptance Criteria

**Type Definition:**
```txt
✓ RadarScanOutput type covers full output schema
✓ RadarCandidateOutput type matches candidate fields
✓ RejectedCandidateOutput type defined
✓ All score fields are strictly typed as number
✓ Enums properly constrained (radarLens, trendStatus, credibilityTier, etc.)
```

**Validation Function:**
```txt
✓ Validates schemaVersion = "1.0"
✓ Rejects if candidates array > 10 items
✓ Checks all scores are 0-100 integers
✓ Detects 0-10 scale scores and rejects with clear error
✓ Validates radarLens enum values
✓ Validates trendStatus enum values
✓ Validates credibilityTier enum values
✓ Requires at least 1 evidence per candidate
✓ Scans for prohibited financial language (buy, sell, guaranteed, etc.)
✓ Checks URL validity when provided
✓ Returns clear errors and warnings
```

**Persistence Function:**
```txt
✓ Creates RadarScan record with correct metadata
✓ Creates RadarCandidate records with sortRank
✓ Links to Stock by ticker (stockId null if not found)
✓ Creates RadarEvidence records for each evidence item
✓ Uses Prisma transaction for atomicity
✓ Returns scanId, candidateCount, evidenceCount
✓ Handles errors gracefully with descriptive messages
```

**Fixture Data:**
```txt
✓ Fixture has 3 candidates with different lenses (attention_spike, overreaction, value_gap)
✓ All candidates have at least 2 sources
✓ No prohibited language in any text field
✓ All scores are 0-100 integers
✓ Provider metadata correctly set (Anthropic, claude-sonnet-4.6, sourceMode: fixture)
✓ agentSelfCheck accurately describes fixture
✓ Real stock tickers (NVDA, SMCI, META) for stockId linking
✓ Evidence includes mix of URL and non-URL sources
```

**Automated Checks:**
```txt
✓ npm run build succeeds
✓ npx tsc --noEmit succeeds (no TypeScript errors)
✓ npx prisma validate passes (schema unchanged from 23C-1B)
✓ npx prisma migrate status shows clean state (no new migrations)
```

**Scope Confirmation:**
```txt
✓ No application UI changed
✓ No /opportunity-radar route changes
✓ No Admin UI added
✓ No API routes added
✓ No Server Actions added
✓ No AI/provider calls
✓ No external web/search calls
✓ No scheduled jobs
✓ No production scoring changes
✓ No Prisma schema changes (uses existing tables)
✓ No new migrations (schema from 23C-1B sufficient)
```

---

## Required Final Report

Before commit approval, return in English:

```txt
1. Branch name used
2. Files inspected
3. Files changed
4. Implementation summary:
   - Types: RadarScanOutput, RadarCandidateOutput, etc.
   - Validation: strict rule enforcement
   - Persistence: Prisma transaction-based
   - Fixture: 3 candidates with evidence
5. Validation behavior tested:
   - Valid fixture passes
   - Invalid score scale rejected
   - Prohibited language rejected
   - Missing evidence rejected
   - Invalid enum rejected
6. Persistence behavior tested:
   - Scan record created with metadata
   - Candidates persisted with sortRank
   - Evidence linked correctly
   - Stock linking (null if not found)
7. Automated check results:
   - npm run build
   - npx tsc --noEmit
   - npx prisma validate
   - npx prisma migrate status
8. Documentation Updates:
   - Updated: Context/current-feature.md
   - Checked: Context/data-model.md, Context/project-overview.md
   - Reason: Schema unchanged; metadata already documented in 23C-1B
   - MD files changed: current-feature.md only
9. Scope confirmation:
   - application UI changed: NO
   - DB/schema changed: NO (uses existing models)
   - migrations added: NO
   - provider/AI/API calls: NO
   - external search/web calls: NO
   - production scoring changed: NO
   - Admin UI changed: NO
   - /opportunity-radar UI changed: NO
10. Known issues or risks
11. Ready for review or not
```

Do not commit without explicit approval.
