# Current Feature — Phase 23B-3: Opportunity Radar Prompt + Output Schema Draft

## Active Phase

```txt
Phase 23B-3 — Opportunity Radar Prompt + Output Schema Draft
Status: Documentation-only planning; schema and prompt specification in progress
Focus: Define production-ready prompt contract and output schema before Phase 23C implementation
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
Context/Features/opportunity-radar-ai-agent-spec.md (especially Phase 23B-3 section)
Context/Features/opportunity-radar-feature-spec.md
Context/Features/admin-sync-feature-spec.md
Context/architecture.md
Context/scoring-system.md (to understand why Radar scores differ from production scores)
```

---

## Goal

Define a production-ready prompt contract and output schema for the Opportunity Radar AI Agent before Phase 23C implementation begins.

This phase documents:
- Production Prompt v1 for Claude Sonnet 4.6 (primary) and GPT 5.4 (fallback)
- Strict JSON output schema v1 with all required and optional fields
- Validation rules, score ranges, and prohibited language checks
- Text length limits for UI suitability
- Field classification (DB-persisted vs. UI-facing vs. internal-only)
- Score clarifications (why Radar scores ≠ production scores)
- Implementation implications for Phase 23C

This phase does not implement code, run AI agents, change schemas, or modify production scoring.

---

## Scope — Documentation Only

### In Scope

```txt
- Production Prompt v1 text (system + user template)
- Output Schema v1 with TypeScript-like notation
- Validation rules for Phase 23C implementation
- Text length limits by field
- Field classification table
- Score definitions and clarifications
- Claude Sonnet 4.6 specific notes
- GPT 5.4 fallback notes
- Safety and prohibited language rules
- Provider metadata structure
- Agent self-check structure
- Rejected candidate structure
```

### Out of Scope

```txt
- Real AI provider API calls or integration
- Provider authentication or key storage code
- Web/search pipeline implementation
- Database schema changes or migrations
- Prisma model additions
- Admin UI implementation
- API routes or server-side handlers
- Scheduled job implementation
- Production scoring changes
- Prompt execution code
- Multi-provider routing logic
- Testing or validation runs
```

---

## Scope — Documentation Only

### In Scope

```txt
- Update AI agent spec with model research findings
- Document primary/fallback provider decision
- Document actual benchmark caveats
- Document that quality outranks latency/cost for daily scans
- Document Phase 23C implications
- Append completed Phase 23B-2 summary to feature history
```

### Out of Scope

```txt
- Real AI provider API calls or integration
- Provider authentication or key storage code
- Web/search pipeline implementation
- Database schema changes or migrations
- Prisma model additions
- Admin UI implementation
- API routes or server-side handlers
- Scheduled job implementation
- Production scoring changes
- Prompt execution code
- Multi-provider routing or fallback logic
```

---

## Phase 23B-3 Deliverables

This phase produces:

```txt
1. Production Prompt v1 (system + user template) in Context/Features/opportunity-radar-ai-agent-spec.md
2. Output Schema v1 (TypeScript-like specification) in same file
3. Validation Rules section with specific rules for Phase 23C implementation
4. Text Field Length Limits table
5. Field Classification table (DB persisted, UI-facing, internal QA)
6. Score Clarification section explaining why Radar scores ≠ Opportunity/Fundamental scores
7. Claude Sonnet 4.6 specific notes (quality, latency, implementation considerations)
8. GPT 5.4 fallback notes (schema issue with 0–10 scores, validation strictness)
9. Non-scope list (what is explicitly NOT included)
10. Documentation updates to Context/current-feature.md and Context/project-overview.md
```

---

## Phase 23C Implications

When Phase 23C begins (DB schema + manual admin scan), it should use:

```txt
- The Production Prompt v1 defined in Phase 23B-3
- The Output Schema v1 defined in Phase 23B-3
- The Validation Rules section for output validation
- The Text Length Limits for enforcing UI-friendly output
- The Field Classification table to decide DB schema structure
- Claude Sonnet 4.6 as the default quality candidate (with GPT 5.4 as fallback)
- Single active provider architecture (not multi-provider ensemble)
- Provider adapter pattern so the active provider can be changed without code deployment
- Output validation layer that rejects or normalizes bad outputs
- Server-side execution only through Admin button / future scheduled job
- DB-backed persisted scan results before /opportunity-radar reads real results
```

Important implementation caveat:

```txt
If Claude Sonnet 4.6 does not have native web/search access in the chosen API/runtime, Phase 23C must include a server-side source/search pipeline that feeds source material into Claude.
The UI must never call AI or external search/providers directly.
Claude output should be constrained with max_tokens to keep it compact.
```

---

## Documentation Checklist

Update now:

```txt
✅ Context/Features/opportunity-radar-ai-agent-spec.md — add Phase 23B-3 section with prompt, schema, validation rules
✅ Context/current-feature.md — this file, reflect Phase 23B-3 scope and deliverables
✅ Context/project-overview.md — roadmap note for Phase 23B progress (provider decision + prompt/schema drafting)
```

Check but do not update (no implementation changes):

```txt
Context/data-model.md — no schema changes in this phase
Context/sync-workflows.md — no workflow changes in this phase
Context/Features/admin-sync-feature-spec.md — no Admin workflow change yet
Context/scoring-system.md — no production scoring changes
Context/Algorithms/*.md — no algorithm changes
Context/architecture.md — no architectural changes in this phase
```

---

## Acceptance Criteria

**Documentation Completeness:**
```txt
✅ Production Prompt v1 documented (system + user template)
✅ Output Schema v1 documented (TypeScript-like specification)
✅ Validation Rules documented for Phase 23C
✅ Text Length Limits table created
✅ Field Classification table created
✅ Score Clarification section explains Radar scores ≠ production scores
✅ Claude Sonnet 4.6 specific notes documented
✅ GPT 5.4 fallback notes documented (including 0–10 score issue)
✅ Non-scope list is explicit
```

**Quality Standards:**
```txt
✅ Prompt is production-ready and specific
✅ Schema is strict and validates well
✅ Validation rules are clear and actionable
✅ All text limits are enforced
✅ Field classification is complete
✅ Score definitions prevent confusion with production scores
✅ Provider notes are implementation-ready for Phase 23C
```

**Scope Confirmation:**
```txt
✅ No application code changed
✅ No database schema changed
✅ No migrations added
✅ No provider/AI/API implementation added
✅ No production scoring changed
✅ No Admin UI implementation
✅ No scheduled job implementation
```

---

## Required Final Report

Before commit approval, return in English:

```txt
1. Branch name used
2. Files inspected
3. Files changed
4. Documentation summary
5. Prompt/Schema summary
6. Scope confirmation:
   - Application code changed or not
   - DB/schema changed or not
   - Migrations added or not
   - Provider/AI/API implementation added or not
   - Production scoring changed or not
7. Documentation Updates:
   - Updated:
   - Checked but not updated:
   - Reason:
   - MD files changed:
8. Known issues or open questions
9. Ready for review or not
```

Do not commit without explicit approval.
Do not start Phase 23C from this task.
