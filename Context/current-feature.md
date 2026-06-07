# Current Feature — Phase 23C-1B: Opportunity Radar DB Persistence Schema

## Active Phase

```txt
Phase 23C-1B — Opportunity Radar DB Persistence Schema
Status: Completed; Prisma schema added, migration created and applied, automated checks passed, ready for merge
Focus: Add minimal database schema for Radar scan results persistence (RadarScan, RadarCandidate, RadarEvidence)
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

Implement Phase 23C-1B — Opportunity Radar DB Persistence Schema.

Add the minimal database schema needed to persist Opportunity Radar AI scan results for future use by /opportunity-radar page.

**This phase does NOT:**
- Implement AI execution or provider calls
- Add Admin Scan button
- Update /opportunity-radar to read from DB
- Add scheduled jobs
- Add provider/prompt/source admin configuration models
- Change production scoring logic

**This phase DOES:**
- Add RadarScan model (scan metadata)
- Add RadarCandidate model (research candidates)
- Add RadarEvidence model (source citations)
- Create Prisma migration
- Validate schema and build
- Update documentation

---

## Scope — Prisma Schema + Migration Only

### In Scope

```txt
- RadarScan model (scan execution metadata)
- RadarCandidate model (candidate research data)
- RadarEvidence model (source citations)
- Stock inverse relation (radarCandidates)
- Prisma migration creation and validation
- Cascade delete rules
- Database index placement
- Schema documentation in Context/data-model.md
```

### Out of Scope

```txt
- Admin Scan button UI or Server Action
- /opportunity-radar route changes
- AI provider API calls
- Web search implementation
- Validation layer
- Scheduled job implementation
- RadarPromptVersion, RadarProviderConfig, RadarSource models (Phase 23C-2)
- Production scoring changes
- Seed data
- Admin UI
- API routes
```

---

## Phase 23C-1B Deliverables

This phase produces:

```txt
1. Prisma schema: RadarScan, RadarCandidate, RadarEvidence models added to schema.prisma
2. Stock inverse relation: radarCandidates RadarCandidate[] added to Stock model
3. Migration: 20260607175904_add_opportunity_radar_models created and applied
4. Context/data-model.md updated with model descriptions and clarifications
5. Context/current-feature.md updated to reflect Phase 23C-1B as active phase
6. Context/project-overview.md updated with Phase 23C-1B status
7. All automated checks passing: build, TypeScript, prisma validate, prisma migrate status
```

---

## Acceptance Criteria

**Schema Implementation:**
```txt
✅ RadarScan model added with all specified fields and indexes
✅ RadarCandidate model added with all specified fields and indexes
✅ RadarEvidence model added with all specified fields and indexes
✅ Stock model updated with radarCandidates inverse relation
✅ Cascade deletes: RadarScan → RadarCandidate, RadarCandidate → RadarEvidence
✅ SetNull delete: Stock deletion does not delete RadarCandidate (stockId becomes null)
✅ Unique constraint on [scanId, ticker] for RadarCandidate
✅ String types used (no Prisma enums) for Radar fields
✅ Index placement matches existing patterns
```

**Database & Validation:**
```txt
✅ Migration created and applied to live database
✅ npx prisma validate passes
✅ npx prisma migrate status shows clean state
✅ npm run build succeeds
✅ npx tsc --noEmit succeeds (no TypeScript errors)
```

**Documentation:**
```txt
✅ Context/data-model.md updated with Model Ownership Summary entries
✅ Context/data-model.md updated with detailed RadarScan/RadarCandidate/RadarEvidence sections
✅ Context/data-model.md includes "Radar Scores vs. Production Scores" clarification
✅ Context/data-model.md includes "Radar Schema — Phase 23C-1B Status" section
✅ Context/current-feature.md updated to show Phase 23C-1B as active phase
✅ Context/project-overview.md updated with Phase 23C-1B in roadmap
```

**Scope Confirmation:**
```txt
✅ No application code changed
✅ No /opportunity-radar route changes
✅ No Admin UI changes
✅ No API routes added
✅ No Server Actions added
✅ No AI/provider calls
✅ No scheduled jobs
✅ No production scoring changes
```

---

## Required Final Report

Before commit approval, return in English:

```txt
1. Branch name used
2. Files inspected
3. Files changed
4. Migration created:
   - migration folder/name
   - summary of schema changes
5. Implementation summary
6. Automated check results:
   - npm run build
   - npx tsc --noEmit
   - npx prisma validate
   - npx prisma migrate status
7. Documentation Updates:
   - Updated:
   - Checked but not updated:
   - Reason:
   - MD files changed:
8. Scope confirmation:
   - application code changed or not
   - DB/schema changed or not
   - migrations added or not
   - provider/AI/API implementation added or not
   - production scoring changed or not
   - Admin UI changed or not
   - /opportunity-radar UI changed or not
9. Known issues or risks
10. Ready for review or not
```

Do not commit without explicit approval.
