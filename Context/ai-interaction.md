# AI Interaction Guidelines

## When To Read This File

Read this file before every implementation task.

It defines the workflow, communication rules, QA expectations, commit rules, and documentation update protocol.

---

## Communication

- Be concise and direct.
- Explain non-obvious decisions briefly.
- Ask before large refactors or architectural changes.
- Do not add features not in the active spec.
- Do not delete files without clarification.
- Implementation reports must be written in English only.
- If requirements are unclear, ask before coding.

---

## Standard Feature Workflow

Use this workflow for every feature/fix:

1. **Read context**
   - Read `Context/README.md`.
   - Read required core files.
   - Read only focused files relevant to the task.

2. **Document active task**
   - Update `Context/current-feature.md` before implementation if the task changed.

3. **Branch**
   - Create a focused branch:
     - `feature/[feature-name]`
     - `fix/[fix-name]`

4. **Implement**
   - Implement only the active feature/fix.
   - Keep changes focused.
   - Do not refactor unrelated code.

5. **Test**
   - Run browser QA for UI changes.
   - Run automated checks:
     ```bash
     npm run build
     npx tsc --noEmit
     npx prisma validate
     npx prisma migrate status
     ```

6. **Iterate**
   - Fix issues found in QA.
   - Stop after 2–3 failed attempts and explain the problem.

7. **Documentation check**
   - Check whether documentation must be updated.
   - Update relevant MD files after QA and before commit approval.

8. **Ask for commit approval**
   - Do not commit automatically.
   - Include changed files, QA, checks, known issues, and documentation updates.

9. **Commit**
   - Commit only after explicit approval.

10. **Merge and cleanup**
   - Merge to main only after approval.
   - Delete branch after merge if requested/approved.
   - Append completed phase summary to `Context/feature-history.md`.

---

## Commit Rules

- Ask before committing.
- Keep commits focused.
- Use conventional commit messages:
  - `feat:`
  - `fix:`
  - `chore:`
  - `docs:`
  - `refactor:`
- Never include “Generated with Claude” or similar text in commit messages.

---

## Documentation Maintenance Protocol

Before requesting commit approval, check whether the implementation changed any documented concept.

If yes, update the relevant Markdown documentation after QA passes and before asking for commit approval.

If documentation should be updated and the user did not request it, proactively mention it.

Implementation is not ready for commit until documentation impact was checked.

### Documentation Update Map

| Change type | Update |
| --- | --- |
| Prisma schema changed | `Context/data-model.md` |
| Sync workflow changed | `Context/sync-workflows.md` |
| Provider responsibility changed | `Context/Features/market-data-sync-strategy.md` |
| Scanner behavior changed | `Context/Features/scanner-feature-spec.md` |
| Drawer behavior changed | `Context/Features/drawer-feature-spec.md` |
| Dashboard behavior changed | `Context/Features/dashboard-feature-spec.md` |
| Admin Sync behavior changed | `Context/Features/admin-sync-feature-spec.md` |
| Architecture / data flow changed | `Context/architecture.md` |
| Fundamental Score changed | `Context/Algorithms/fundamental-score-v1.md` |
| Opportunity Score changed | `Context/Algorithms/opportunity-score-v2.md` |
| Analyst rating/upside changed | `Context/Algorithms/analyst-rating-and-upside.md` |
| Decision tags changed | `Context/Algorithms/scanner-decision-tags.md` |
| Phase completed | `Context/feature-history.md` |
| New phase started | `Context/current-feature.md` |

### Required Final Report Section

Every implementation report must include:

```md
## Documentation Updates

Updated:
- ...

Checked but not updated:
- ...

Reason:
- ...
```

If no documentation update was needed, say why.

---

## Code Change Rules

- Make minimal changes needed for the active task.
- Do not add “nice to have” features.
- Preserve existing project patterns.
- Do not change scoring formulas unless the active task explicitly says so.
- Do not change DB schema unless the active task explicitly approves it.
- Do not add provider/API calls from normal UI render paths.
- Scanner, Dashboard, and Drawer should read DB data.

---

## When Stuck

If something is not working after 2–3 attempts:

1. Stop.
2. Explain the issue.
3. Summarize attempts.
4. Suggest options.
5. Ask for direction.

Do not keep trying random fixes.

---

## QA Expectations

### Browser QA Required For

```txt
Scanner UI
Drawer UI
Dashboard UI
Admin Sync UI
Watchlist actions
Alert actions
Pagination/filter/search changes
```

### Automated Checks Required Before Commit Approval

```bash
npm run build
npx tsc --noEmit
npx prisma validate
npx prisma migrate status
```

### DB Changes

If schema changes:

```txt
Use prisma migrate dev
Do not use db push
Run prisma migrate status
Update Context/data-model.md after QA
```

---

## Context Management

- `current-feature.md` must stay focused on the active feature only.
- Completed phase summaries belong in `feature-history.md`.
- For large features, create a focused spec in `Context/Features/`.
- For scoring/data logic, create or update `Context/Algorithms/`.
- Do not add large historical logs to active feature specs.
