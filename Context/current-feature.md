# Current Feature — Phase 23B-2: Opportunity Radar Provider / Model Research Decision

## Active Phase

```txt
Phase 23B-2 — Opportunity Radar Provider / Model Research Decision
Status: Product research completed; documentation update ready for codebase commit
Focus: Document model-selection decision only (no implementation)
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
Context/Features/opportunity-radar-ai-agent-spec.md
Context/Features/opportunity-radar-feature-spec.md
Context/Features/admin-sync-feature-spec.md
Context/architecture.md
```

Read only if scoring behavior is changed, which is not part of this phase:

```txt
Context/scoring-system.md
Context/Algorithms/opportunity-score-v2.md
Context/Algorithms/fundamental-score-v1.md
Context/Algorithms/analyst-rating-and-upside.md
```

---

## Goal

Document the product research decision for Opportunity Radar AI provider/model selection before Phase 23C implementation.

This phase records the benchmark findings and the MVP provider strategy. It does not implement any provider, AI call, search pipeline, Admin UI, DB schema, or scoring logic.

---

## Research Inputs

User-tested Opportunity Radar-style searches with:

```txt
Claude Sonnet 4.6
OpenAI GPT 5.4
Google Gemini
xAI Grok
```

Important test context:

```txt
- Claude Sonnet 4.6 produced the best-quality results.
- GPT 5.4 ranked second.
- Grok ranked ahead of Gemini in the user's experience, but this Grok run used a free / fast model, so it is not a fair production-grade comparison.
- Gemini ranked last in the user's qualitative comparison.
- Claude was much slower than the other models, but latency is not a deciding factor because the scan is expected to run once daily.
- The benchmark prompt metadata around thinkingEffort was not fully reliable; actual runs should be treated as regular/default effort unless explicitly configured otherwise.
```

---

## Product Decision

```txt
Primary Provider Candidate for Phase 23C MVP: Anthropic Claude Sonnet 4.6
Fallback / Benchmark Provider: OpenAI GPT 5.4
Experimental / Retest Later: paid xAI Grok model
Deprioritized for MVP Default: Gemini
```

Decision rationale:

```txt
Quality of research candidates matters more than lowest cost or fastest response.
Claude Sonnet 4.6 had the strongest narrative quality, concerns, why-now reasoning, and rejected-candidate logic.
GPT 5.4 remains the strongest fallback because it produced clean and conservative results.
Grok should not be judged from the free/fast run for production readiness.
Gemini can remain a future grounding/cost experiment but should not be the MVP default.
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

## Phase 23C Implications

When Phase 23C begins, it should start with:

```txt
- Single active provider, not multi-provider ensemble logic
- Provider adapter architecture so the active provider can be changed later
- Claude Sonnet 4.6 as the default quality candidate if the chosen API/source pipeline supports the required workflow
- GPT 5.4 as fallback / benchmark
- Output validation for score ranges, enums, evidence presence, and prohibited language
- Server-side execution only through Admin/future scheduled job
- DB-backed persisted scan results before /opportunity-radar reads real results
```

Important implementation caveat:

```txt
If Claude Sonnet 4.6 does not have native web/search access in the chosen API/runtime, Phase 23C must include a server-side source/search pipeline that feeds source material into Claude.
The UI must never call AI or external search/providers directly.
```

---

## Documentation Checklist

Update now:

```txt
✅ Context/Features/opportunity-radar-ai-agent-spec.md — provider/model research decision
✅ Context/current-feature.md — this file, reflect Phase 23B-2 decision
✅ Context/project-overview.md — roadmap note for Phase 23B research decision
✅ Context/feature-history.md — append Phase 23B-2 completed summary
```

No update needed unless implementation changes:

```txt
Context/data-model.md — no schema changes
Context/sync-workflows.md — no workflow changes
Context/Features/admin-sync-feature-spec.md — no Admin workflow change yet
Context/scoring-system.md — no scoring changes
```

---

## Acceptance Criteria

```txt
✅ Provider/model research decision documented
✅ Claude Sonnet 4.6 recorded as primary quality candidate
✅ GPT 5.4 recorded as fallback / benchmark
✅ Grok free/fast caveat recorded
✅ Gemini deprioritized for MVP default
✅ Latency noted as secondary due to daily scan cadence
✅ Quality-over-cost principle recorded
✅ Phase 23C starts with single active provider, not multi-provider ensemble
✅ No code changed
✅ No database schema changed
✅ No migrations added
✅ No provider/AI/API implementation added
✅ No production scoring changed
```

---

## Required Final Report

Before commit approval, return:

```txt
1. Branch name used
2. Files inspected
3. Files changed
4. Documentation summary
5. Provider/model decision summary
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
8. Ready for review or not
```

Do not commit without explicit approval.
Do not start Phase 23C from this task.
