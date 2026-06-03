# Product Lead Workflow — FomoFilter

Repository path: `Context/product-lead-workflow.md`

## Purpose

This document defines the working model between:

```txt
User = Product Owner
ChatGPT Project = Product Lead / Product Architect
Claude Code = Main Developer inside VS Code
Repository Markdown docs = shared source of truth
```

The goal is to keep product thinking, implementation, QA, documentation, branching, commits, and repository context synchronized without overloading either AI with irrelevant context.

---

## When To Read This File

Read this file when:

```txt
Planning a new feature
Preparing a Claude prompt
Reviewing a Claude implementation report
Deciding whether a feature is ready for commit
Preparing the finish/commit/merge prompt
Updating project documentation
Starting a new phase
Setting up or maintaining the ChatGPT Project workflow
```

Do not read this file for small code-only tasks unless workflow, QA, documentation, branching, or Claude handoff is involved.

---

## When To Update This File

Update this file after QA and before commit approval if the workflow changes, including:

```txt
Role split between ChatGPT and Claude
Claude prompt requirements
Branch workflow
Finish/commit/merge workflow
QA process
Commit approval process
Documentation update process
ChatGPT Project knowledge refresh process
```

---

## Core Roles

### User — Product Owner

The user owns:

```txt
Product direction
Final priority decisions
QA approval
Commit approval
Project knowledge uploads to ChatGPT
Final decision on whether to continue/fix/split/stop a phase
```

The user should not need to repeatedly explain the whole project because the Markdown system provides shared context.

---

### ChatGPT Project — Product Lead

ChatGPT is responsible for:

```txt
Feature definition
UX flow thinking
Product tradeoff analysis
Phase planning
Spec writing
Claude prompt creation
Claude report review
QA planning
Edge-case analysis
Documentation governance reminders
Next-step recommendations
Finish-work prompt creation after QA approval
```

ChatGPT does **not** write production code by default.

ChatGPT should produce clear implementation tasks for Claude.

---

### Claude Code — Main Developer

Claude is responsible for:

```txt
Reading relevant repository docs
Inspecting actual repo files
Creating a task branch before implementation
Implementing scoped tasks
Running build/typecheck/Prisma checks
Running browser QA where relevant
Updating relevant MD docs after QA
Returning implementation reports in English
Waiting for explicit commit approval
Completing the approved branch via the finish-work prompt
```

Claude should not decide major product direction independently.

Claude should not implement unscoped features.

Claude should not commit or merge without explicit approval and a finish-work prompt.

---

## Source of Truth

The repository is the final source of truth.

The Markdown docs define product/architecture/scoring/sync/feature context.

ChatGPT Project uses uploaded MD files as knowledge, but those files can become stale when Claude changes docs in the repository.

If Claude updates any MD file, the user must upload the updated MD file(s) to the ChatGPT Project before ChatGPT relies on that area again.

---

## ChatGPT Project Knowledge Freshness Rule

ChatGPT must assume project knowledge may be stale if:

```txt
Claude reports that MD files were changed
The user mentions documentation updates in the repo
A Claude report includes a Documentation Updates section with updated files
A new phase was completed after the last upload
```

Before continuing product decisions that depend on those docs, ChatGPT should say:

```txt
Claude changed documentation files. Please upload the updated MD files to the ChatGPT Project before we continue relying on the project knowledge.
```

If the user wants to continue without uploading, ChatGPT should rely on the latest Claude report provided in the chat and clearly say the uploaded knowledge may be stale.

---

## Documentation File Handling In ChatGPT Project

In the repository, docs live in paths such as:

```txt
Context/README.md
Context/Features/scanner-feature-spec.md
Context/Algorithms/opportunity-score-v2.md
```

In ChatGPT Project, files may be uploaded flat using their original filenames.

Examples:

```txt
Context/README.md → README.md
Context/Features/scanner-feature-spec.md → scanner-feature-spec.md
Context/Algorithms/opportunity-score-v2.md → opportunity-score-v2.md
```

ChatGPT should treat repository paths inside Markdown docs as logical paths and resolve them by filename if folders are unavailable.

If multiple files share the same basename, ChatGPT should ask the user which file is current.

---

## Standard Feature Workflow

### Step 1 — Product Discussion

The user and ChatGPT discuss:

```txt
Problem
User need
Product goal
UX flow
Data needed
Risks
Non-scope
Priority
Success criteria
```

ChatGPT should challenge weak or overly complex ideas.

Useful questions:

```txt
What user decision will this feature improve?
Can this be solved with existing data?
Is this needed now or later?
Does it add complexity to sync/scoring/UI?
What is the smallest useful version?
How will we QA it?
```

---

### Step 2 — Phase Definition

ChatGPT helps define the phase:

```txt
Phase name
Goal
Scope
Non-scope
Relevant context files
Likely files involved
Acceptance criteria
QA requirements
Documentation update checklist
Suggested branch name
```

For large phases, ChatGPT can create or update a focused `Context/current-feature.md` spec.

---

### Step 3 — Claude Prompt Creation

ChatGPT writes a focused Claude prompt.

Every Claude prompt for implementation or code changes must include:

```txt
Goal
Branch setup
Context files to read
Files likely involved
Constraints
Non-scope
Implementation requirements
Acceptance criteria
QA requirements
Documentation update requirements
Required final report in English
Do not commit without approval
```

Claude prompts should be written in English.

---

### Step 4 — Branch Setup By Claude

Before implementation, Claude must:

```txt
Check current git status
Check current branch
Stop if there are unexpected uncommitted changes
Create and switch to a new short descriptive branch
Start implementation only after the branch is active
```

Branch naming convention:

```txt
feature/[short-name]
fix/[short-name]
docs/[short-name]
refactor/[short-name]
```

Examples:

```txt
feature/drawer-real-data
fix/scanner-pagination
docs/context-refresh
refactor/admin-sync-copy
```

If there are uncommitted changes before branch creation, Claude must stop and report.

---

### Step 5 — Claude Implementation

Claude implements inside VS Code.

Claude must:

```txt
Read requested context files
Inspect relevant repo files
Stay within scope
Run required checks
Run browser QA where relevant
Update relevant docs after QA if needed
Report changed files
Report MD files changed
Report known issues
Wait for commit approval
```

---

### Step 6 — Claude Report Review

The user sends Claude’s report to ChatGPT.

ChatGPT reviews:

```txt
Branch name used
Scope control
Files changed
Unapproved DB/API/provider/scoring changes
QA quality
Automated check results
Documentation Updates section
MD files changed
Known issues
UX/product concerns
Commit readiness
```

If issues remain, ChatGPT writes a focused fix prompt for Claude.

---

### Step 7 — Documentation Freshness Check

Before recommending commit, ChatGPT must check whether Claude changed MD files.

If yes, ChatGPT must tell the user:

```txt
Claude changed documentation files. Please upload the updated MD files to the ChatGPT Project before we continue relying on the project knowledge.
```

If the user is about to commit, the commit can still proceed, but the ChatGPT Project knowledge must be refreshed before relying on those docs again.

---

### Step 8 — Commit Approval

A feature is ready for the finish-work prompt only when:

```txt
Implementation is complete
Browser QA is complete when relevant
Automated checks pass
Documentation impact was checked
Relevant MD docs were updated if needed
Known issues are acceptable
ChatGPT review passes
User explicitly approves QA/commit
Branch name is known
Commit message is clear
```

Claude should not commit without explicit approval.

---

### Step 9 — Finish Work Prompt

After QA is approved, ChatGPT provides a dedicated finish-work prompt.

The finish prompt must include all final steps together:

```txt
Update feature-history.md with completed phase summary
Update current-feature.md if needed
Confirm relevant docs were updated
Run final checks if needed
Show git status
Stage all changed files
Commit with detailed message
Switch to main
Pull latest main
Merge the completed branch into main
Delete the completed branch
Show final git status
Report MD files changed
Remind user to upload changed MD files to ChatGPT Project
Do not start next phase
```

---

## Required Branch Block For Claude Prompts

Add this block to every implementation/change prompt:

```txt
Branch setup:
- Before changing files, check the current git status and current branch.
- If there are uncommitted changes that are not part of this task, stop and report them.
- Create and switch to a new branch named: [branch-name].
- Only after the branch is active, begin implementation.
- Do not commit until I explicitly approve.
```

---

## Claude Prompt Templates

### 1. Audit / Planning Prompt

Use when repo state is unclear.

```txt
You are working on FomoFilter.

Do not change code.
Do not change DB/schema.
Do not run migrations.
Do not commit.

Goal:
[Describe audit goal]

Read:
- [Context files]

Inspect likely files:
- [Files/directories]

Report in English:
1. Files inspected
2. Current behavior
3. Data sources
4. Risks
5. Recommended implementation plan
6. Files likely to change
7. Questions/blockers
```

---

### 2. Implementation Prompt

Use when scope is approved.

```txt
You are working on FomoFilter.

Goal:
[Clear implementation goal]

Branch setup:
- Before changing files, check the current git status and current branch.
- If there are uncommitted changes that are not part of this task, stop and report them.
- Create and switch to a new branch named: [feature/short-name or fix/short-name].
- Only after the branch is active, begin implementation.
- Do not commit until I explicitly approve.

Read:
- [Context files]

Files likely involved:
- [Files/directories]

Constraints:
- Do not change DB/schema unless explicitly approved.
- Do not add provider calls unless explicitly approved.
- Do not change scoring formulas unless explicitly scoped.
- Do not redesign unrelated areas.
- Do not commit.

Implementation requirements:
- [Detailed requirements]

Acceptance criteria:
- [Clear criteria]

QA requirements:
- [Browser and regression QA]

Run:
npm run build
npx tsc --noEmit
npx prisma validate
npx prisma migrate status

Documentation requirements:
- Check documentation impact after QA.
- Update relevant MD files if needed.
- If you changed any MD files, list them explicitly in the final report.

Return final report in English:
1. Branch name used.
2. Files changed.
3. Implementation summary.
4. QA results.
5. Automated check results.
6. Documentation Updates.
7. MD files changed, if any.
8. Known issues.
9. Ready for commit or not.

Do not commit.
```

---

### 3. Fix / QA Prompt

Use after QA finds issues.

```txt
You are working on FomoFilter.

Fix only the following issues:
- [Issue 1]
- [Issue 2]

Branch setup:
- If already on the task branch, stay on it.
- If not on the task branch, stop and report.
- Do not create a second branch unless I explicitly ask.

Do not refactor unrelated code.
Do not change DB/schema.
Do not add provider calls.
Do not change scoring formulas.
Do not commit.

Re-run focused QA:
- [QA steps]

Run:
npm run build
npx tsc --noEmit
npx prisma validate
npx prisma migrate status

Documentation requirements:
- Check documentation impact after QA.
- Update relevant MD files if needed.
- If you changed any MD files, list them explicitly in the final report.

Return a delta report in English:
1. Branch name.
2. Files changed.
3. Fixes applied.
4. QA results.
5. Automated check results.
6. Documentation Updates.
7. MD files changed, if any.
8. Ready for commit or not.

Do not commit.
```

---

### 4. Finish Work Prompt

Use only after QA approval.

```txt
QA is approved. Finish the work.

You are currently working on branch: [branch-name].

Do not change application logic unless a final documentation-only update is required.

Final documentation:
- Update `Context/feature-history.md` with a concise completed summary for this phase/fix.
- Update `Context/current-feature.md` only if the active phase should be marked complete or prepared for the next phase.
- Confirm all relevant documentation files were already updated.
- If you change any MD files now, list them explicitly in the final report.

Git finish steps:
1. Run final checks if they were not run after the last change:
   - npm run build
   - npx tsc --noEmit
   - npx prisma validate
   - npx prisma migrate status
2. Show `git status`.
3. Stage all changed files:
   - git add -A
4. Commit with this message:
   - [commit message]
5. Switch to main:
   - git checkout main
6. Pull latest main:
   - git pull
7. Merge the completed branch:
   - git merge [branch-name]
8. Delete the completed branch:
   - git branch -d [branch-name]
9. Show final `git status`.

Return final report in English:
1. Branch completed.
2. Files committed.
3. Commit hash.
4. Merge result.
5. Deleted branch confirmation.
6. Final git status.
7. MD files changed, if any.
8. Reminder whether updated MD files need to be uploaded to ChatGPT Project.

Do not start the next phase.
```

---

## Commit Message Guidance

Commit messages should be specific.

Examples:

```txt
feat(scanner): add pagination and company snapshot
feat(drawer): replace legacy preview with real decision data
fix(scanner): improve expanded row company description layout
docs(context): add focused AI workflow documentation
```

For larger feature commits, include a detailed commit body:

```txt
feat(drawer): replace legacy preview with real decision data

- Remove mock AI insight, catalyst, and hot score sections
- Add DB-backed decision snapshot and company profile
- Add analyst, market position, and data freshness sections
- Preserve watchlist and alert actions
- Update drawer feature spec and feature history
```

---

## Claude Final Report Requirements

Every Claude report must include:

```txt
Branch name used
Files inspected
Files changed
Implementation summary
QA results
Automated check results
Documentation Updates
MD files changed, if any
Known issues
Ready for commit or not
```

Required section:

```md
## Documentation Updates

Updated:
- ...

Checked but not updated:
- ...

Reason:
- ...

MD files changed:
- ...
```

If no MD files changed, Claude must state:

```txt
MD files changed: none
```

---

## ChatGPT Review Checklist

When reviewing a Claude report, ChatGPT should check:

```txt
Did Claude create/use the correct branch?
Did Claude stay within scope?
Were any DB/schema/API/provider/scoring changes made?
Were they approved?
Did browser QA actually run?
Are automated checks complete?
Were docs updated when required?
Did Claude list changed MD files?
Does the user need to upload updated MD files to ChatGPT Project?
Are there UX issues still visible?
Are known issues acceptable?
Is this ready for the finish-work prompt?
```

---

## Documentation Update Map

If Claude changes:

```txt
Prisma schema → Context/data-model.md
Sync workflow → Context/sync-workflows.md
Provider responsibility → Context/Features/market-data-sync-strategy.md
Scanner behavior → Context/Features/scanner-feature-spec.md
Drawer behavior → Context/Features/drawer-feature-spec.md
Dashboard behavior → Context/Features/dashboard-feature-spec.md
Admin Sync behavior → Context/Features/admin-sync-feature-spec.md
Scoring formula → Context/scoring-system.md + relevant Algorithm doc
Decision Tags → Context/Algorithms/scanner-decision-tags.md
Active phase completed → Context/feature-history.md
New phase started → Context/current-feature.md
Workflow changed → Context/product-lead-workflow.md
```

---

## Safety Rules

Claude must stop and report if:

```txt
There are unexpected uncommitted changes before branch creation.
The current branch is not expected.
Merge conflict occurs.
Final checks fail.
A migration appears unexpectedly.
MD files changed but were not mentioned in the report.
```

Do not force delete branches.

Use:

```txt
git branch -d [branch-name]
```

not:

```txt
git branch -D [branch-name]
```

unless explicitly approved.

---

## Anti-Patterns

Avoid:

```txt
Claude receives vague product conversations
Claude decides product direction alone
Claude implements without creating a branch
ChatGPT says "commit it" without a finish-work prompt
Claude commits without QA approval
Claude merges without explicit finish prompt
ChatGPT writes production code by default
Every task reads every MD file
current-feature.md becomes a history archive again
Mock data is presented as real
UI calls providers directly
Scoring changes happen without docs updates
Commit happens before QA/docs review
ChatGPT relies on stale uploaded MD files after Claude changed docs
```

---

## Good Working Pattern

```txt
User: I want to improve Drawer.
ChatGPT: Defines product goal, scope, risks, QA.
ChatGPT: Creates Claude implementation prompt with branch setup.
Claude: Creates branch, implements, QA, reports.
User: Sends Claude report to ChatGPT.
ChatGPT: Reviews report and flags issues.
Claude: Fixes focused issues on same branch.
Claude: Updates docs if needed.
ChatGPT: Reminds user to upload changed MD files if any.
User: Approves QA/commit.
ChatGPT: Provides Finish Work Prompt.
Claude: Updates history/docs, commits, merges to main, deletes branch.
User: Uploads changed MD files to ChatGPT Project if needed.
```

---

## Current Phase Reminder

Current active phase:

```txt
Phase 21C — Drawer Real Data & Decision Workspace Cleanup
```

Before starting it, use:

```txt
Context/current-feature.md
Context/Features/drawer-feature-spec.md
Context/Features/scanner-feature-spec.md
Context/scoring-system.md
Context/data-model.md
```
