# Current Feature — Phase 23B: Opportunity Radar AI Agent Design

## Active Phase

```txt
Phase 23B — Opportunity Radar AI Agent Design
Status: Planning / Documentation phase
Branch: docs/opportunity-radar-ai-agent-spec
Focus: Design and specification only (no implementation)
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
Context/Features/opportunity-radar-ai-agent-spec.md (new, primary spec)
Context/Features/opportunity-radar-feature-spec.md (Phase 23A context)
Context/Features/admin-sync-feature-spec.md (where AI agent will integrate)
```

Read only if needed:

```txt
Context/architecture.md
Context/scoring-system.md
Context/Algorithms/opportunity-score-v2.md
Context/Algorithms/fundamental-score-v1.md
```

---

## Goal

Document and design the AI agent system that powers Opportunity Radar, establishing architecture, configuration concepts, output schema, and evaluation strategy — **without implementing any real AI calls, provider integration, or database changes**.

Phase 23B is **specification and planning only**.

---

## Phase Summary

Phase 23A established the visual direction for Opportunity Radar using mock data and hardcoded candidates.

Phase 23B designs the AI agent that will eventually replace mock data with real, AI-generated candidates in Phase 23C+.

The design covers:

```txt
- Agent product role and responsibility
- Input design (what the agent receives)
- Source strategy (where the agent looks)
- AI provider/model evaluation framework
- Prompt versioning and management
- Output schema with evidence requirements
- Admin configuration for provider/source/prompt management
- Safety and language rules
- Phase breakdown for incremental rollout (23C, 23D)
- Open questions for Phase 23C implementation
```

---

## Scope — Docs/Design Only

### In Scope

```txt
- AI agent goal and product role
- Agent input design
- Agent source and data strategy
- Provider / model evaluation framework
- Prompt management and versioning strategy
- Output schema and field definitions
- Evidence and citation requirements
- Scoring concepts (non-production design)
- Admin provider/source/prompt configuration requirements
- Manual execution flow and future scheduled execution
- Safety and language rule enforcement
- QA and evaluation plan
- Phase breakdown for 23C, 23D, and beyond
- Open questions for Phase 23C implementation
```

### Out of Scope — No Implementation

```txt
- Real AI provider API calls or integration
- Provider authentication or key storage code
- Web scraping or news fetching implementation
- Database schema changes or migrations
- Prisma model additions
- Admin UI implementation
- API routes or server-side handlers
- Scheduled job or cron implementation
- Provider configuration storage in database
- Real prompt execution or testing
- AI model fine-tuning
- Production database reads/writes
- Application code changes
- Scoring logic changes
```

---

## Non-Scope Clarifications

This phase is **design only**. Do not:

```txt
- Write code or handlers
- Create database migrations
- Add Prisma models
- Build Admin UI
- Integrate with any AI provider
- Call any external services
- Change production scoring
- Modify application logic
```

All implementation is deferred to Phase 23C and beyond.

---

## Product Role

The AI agent is the **research engine** behind Opportunity Radar.

Its job:

```txt
Find research candidates, not recommendations.
Explain why each candidate appeared.
Surface market signals worth further investigation.
Separate external signal from internal FomoFilter validation.
Produce structured output for database storage.
Support manual admin execution first, scheduled execution later.
```

The agent does **not**:

```txt
- Make buy/sell recommendations
- Replace human judgment
- Provide financial advice
- Hallucinate or invent facts
- Bypass evidence requirements
```

---

## Acceptance Criteria

Phase 23B is complete when:

```txt
✅ New file: Context/Features/opportunity-radar-ai-agent-spec.md exists
✅ Spec clearly defines:
   - Agent goal and role
   - Input and output schemas
   - Admin configuration concepts
   - Provider evaluation framework
   - Prompt management strategy
   - Source registry design
   - Safety and language rules
   - Phase breakdown for 23C+
   - Open questions for future phases
✅ Spec distinguishes design (Phase 23B) from implementation (Phase 23C+)
✅ No code implemented
✅ No database schema changed
✅ No migrations added
✅ No provider/AI integration
✅ No Admin UI implementation
✅ No production scoring changed
✅ Context/current-feature.md reflects Phase 23B as active
✅ Context/project-overview.md shows Phase 23A complete, Phase 23B active
✅ Context/README.md includes routing to new spec
✅ No commit
```

---

## QA Requirements

Documentation review only (no app QA needed):

```txt
✅ Verify spec is internally consistent
✅ Verify no unintended implementation scope is implied
✅ Verify admin/editable config is clearly marked as "future implementation"
✅ Verify Phase 23B is marked as "docs/design only"
✅ Verify Phase 23C responsibility is clear
✅ Verify open questions are actionable for Phase 23C
✅ Verify no code was accidentally changed
✅ Verify no database schema was changed
✅ Verify no migrations were added
```

---

## Documentation Checklist

Update after creating the new spec:

```txt
✅ Context/Features/opportunity-radar-ai-agent-spec.md — new file
✅ Context/current-feature.md — this file, reflect Phase 23B active
✅ Context/project-overview.md — update roadmap (Phase 23A complete, 23B active)
✅ Context/README.md — add routing to new AI agent spec
```

Do not update:

```txt
Context/data-model.md — no schema changes
Context/sync-workflows.md — no workflow changes
Context/Features/admin-sync-feature-spec.md — no admin workflow changes yet
Context/scoring-system.md — no scoring changes
Context/feature-history.md — Phase 23B is not complete yet (docs setup only)
```

---

## Required Final Report

Before closing Phase 23B, return:

```txt
1. Branch name used
2. Files inspected
3. Files changed
4. New files added
5. Documentation summary
6. Phase breakdown summary
7. Scope confirmation:
   - Application code changed or not
   - DB/schema changed or not
   - Migrations added or not
   - Provider/AI/API implementation added or not
   - Production scoring changed or not
8. Documentation Updates:
   - Updated:
   - Checked but not updated:
   - Reason:
   - MD files changed:
9. Open questions documented
10. Ready for review or not
```

Do not commit without explicit approval.
Do not move to Phase 23C without completing this phase.
