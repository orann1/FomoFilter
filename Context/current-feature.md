# Current Feature — Phase 22B

## Active Phase

```txt
Phase 22B — Multi-Universe Unique Sync Foundation + S&P 500 Expansion
```

## Status

Phase 22B complete. Committed and merged to main.

No active phase. Awaiting next phase definition.

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
Context/data-model.md
Context/sync-workflows.md
Context/Features/market-data-sync-strategy.md
Context/Features/admin-sync-feature-spec.md
Context/Features/scanner-feature-spec.md
Context/Features/dashboard-feature-spec.md
Context/scoring-system.md
```

Read only if needed:

```txt
Context/architecture.md
Context/feature-history.md
Context/Algorithms/fundamental-score-v1.md
Context/Algorithms/opportunity-score-v2.md
Context/Algorithms/analyst-rating-and-upside.md
Context/Features/drawer-feature-spec.md
```

---

## Goal

Expand FomoFilter from a Nasdaq 100-centered universe toward a broader S&P 500-backed universe while first fixing the architecture so sync workflows operate on **unique active stock symbols**, not duplicate universe memberships.

This phase should establish a reusable multi-universe foundation and add S&P 500 support without duplicating provider calls for symbols that belong to both Nasdaq 100 and S&P 500.

---

## Core Product Principle

Separate stock identity from universe membership:

```txt
Stock = one unique company/security record by symbol
StockUniverseMember = membership of that symbol in one or more universes
```

Example:

```txt
NVDA exists once in Stock.
NVDA can have multiple memberships:
  - nasdaq-100
  - sp-500
```

Provider-backed sync workflows must run on:

```txt
deduplicated unique active symbols
```

not on:

```txt
every membership row across every universe
```

If Nasdaq 100 and S&P 500 overlap, the symbol must not be synced twice.

---

## Why This Matters

Adding S&P 500 will create overlap with existing Nasdaq 100 symbols.

Without unique-symbol sync, overlapping symbols would cause:

```txt
Duplicate FMP/Finnhub calls
Longer sync duration
Unnecessary API quota usage
Unnecessary Neon writes
Duplicate SyncRunItem rows
Confusing sync reports
No product value
```

This phase must prevent that.

---

## Product Context

Current architecture rule:

```txt
External providers / static sources
→ Admin Sync workflows / future scheduled jobs
→ Database
→ Dashboard / Scanner / Drawer
```

Scanner, Dashboard, and Drawer must not call providers directly.

Current production sync ownership:

```txt
Universe Sync → Stock / StockUniverse / StockUniverseMember
Company Data Sync → Stock / StockMetric / StockAnalystData
Daily Market Data Sync → StockQuote
Score Calculation → StockScore
```

Current provider strategy:

```txt
Nasdaq 100 membership → static fallback list
Company profile / fundamentals / ratios / growth / analyst targets → FMP
Analyst recommendation counts → Finnhub
Daily quote / 52W / 50/200 averages → FMP
Scores → internal DB-only calculations
```

---

## Phase 22A Audit Findings To Address

The audit found:

```txt
The schema already supports multi-universe membership.
StockUniverse and StockUniverseMember can support S&P 500 without migration.
Current production sync is hardwired to Nasdaq 100.
getAllActiveNasdaq100Symbols() is used by sync routes.
Daily Market Data Sync and Company Data Sync are effectively Nasdaq-100-only.
Dashboard has Nasdaq-specific field naming such as activeNasdaq100.
Seed currently sets russell-1000 as default even though production data is Nasdaq 100.
Scanner currently loads all stocks into the client; 250–500 stocks should be acceptable, 1000 may need later optimization.
Data Inventory pagination/virtualization is a later blocker before 500–1000, but not required for this phase.
```

---

## Product Decisions

```txt
First expansion source: S&P 500.
Use static fallback list for S&P 500 membership in this phase.
Do not use FMP live index constituent endpoint in this phase.
Do not add schema/migration unless implementation proves absolutely required and Product Owner approves.
Do not change provider responsibilities.
Do not change scoring formulas.
Do not build Daily Stock Opportunity Radar yet.
Do not implement historical price data or Momentum Score yet.
Do not redesign Data Inventory yet.
```

Implementation direction:

```txt
Support S&P 500 full list in code.
Ensure provider sync runs on deduplicated unique active symbols.
Preserve existing Nasdaq 100 behavior.
Allow staged sync/QA operationally if needed.
```

---

## Scope

Phase 22B includes:

```txt
Add S&P 500 static fallback symbol list.
Create or generalize universe sync logic so S&P 500 can be synced into StockUniverse / StockUniverseMember.
Preserve existing Nasdaq 100 universe sync behavior.
Generalize Nasdaq-specific active symbol helper(s).
Introduce deduplicated unique active syncable symbol helper(s).
Ensure Daily Market Data Sync and Company Data Sync do not sync overlapping symbols twice.
Fix default universe mismatch if needed.
Rename or generalize Nasdaq-specific Dashboard data fields where needed.
Update Admin Sync UI/copy to support S&P 500 / multi-universe where needed.
Update Data Inventory / Admin labels only where required for multi-universe clarity.
Update documentation after QA.
```

---

## Non-Scope

Do not implement:

```txt
Russell 1000 expansion
Thematic universes
Daily Stock Opportunity Radar
Historical price data
Momentum Score
Hot Score
FOMO Risk
News/catalyst ingestion
AI insight generation
Alert evaluation engine
Stock details page
Server-side Scanner filtering/search
Data Inventory pagination/virtualization
CSV import UI
Live index membership provider integration
Provider plan upgrade logic
```

Do not change:

```txt
DB schema
Prisma models
Existing score formulas
Fundamental Score v1
Opportunity Score v2
Provider responsibilities
Normal UI provider-call boundaries
Watchlist/alert behavior
Drawer decision cockpit behavior
Scanner main UX unless required for universe selection correctness
Dashboard structure unless required for naming/summary correctness
```

No migration is expected.

---

## Required Design Rules

### 1. Unique stock records

```txt
Stock.symbol remains the unique identity.
Do not create duplicate Stock records for overlapping universe symbols.
Upsert Stock by normalized symbol.
Universe membership overlap should create multiple StockUniverseMember rows.
```

### 2. Unique provider sync

```txt
Provider-backed sync workflows must dedupe symbols before creating SyncRunItems or calling providers.
If syncing all active stocks or multiple universes, dedupe by normalized symbol.
A symbol that belongs to both Nasdaq 100 and S&P 500 should be processed once.
```

### 3. Membership sync vs data sync

Universe membership sync:

```txt
Owns StockUniverse / StockUniverseMember membership.
May create Stock shell records.
Should not fetch full fundamentals/quotes unless already part of the existing approved universe sync behavior.
```

Provider data sync:

```txt
Daily Market Data Sync writes StockQuote.
Company Data Sync writes Stock / StockMetric / StockAnalystData.
Score Calculation writes StockScore.
```

Do not mix workflow ownership.

### 4. Static fallback list

For S&P 500 in this phase:

```txt
Use a static fallback list.
Include metadata similar to Nasdaq 100 fallback metadata if practical.
Do not present static fallback membership as live provider data.
```

### 5. Backward compatibility

Existing Nasdaq 100 behavior must continue to work.

```txt
Nasdaq 100 sync still works.
Existing scanner universe selection still works.
Existing dashboard still loads.
Existing drawer still works.
Existing admin sync flows still load.
```

---

## Implementation Requirements

### 1. Add S&P 500 fallback symbols

Add an S&P 500 static fallback list.

Preferred location:

```txt
src/lib/market-data/sp500-fallback-symbols.ts
```

or a nearby naming pattern if the repository convention suggests a better file.

Requirements:

```txt
Export S&P 500 symbols as a typed readonly list.
Include metadata: source = static_fallback, composition/verification notes if known, symbol count.
Normalize symbols consistently with existing Nasdaq 100 list.
Do not include duplicate symbols inside the list.
Do not include invalid symbols.
```

If obtaining a full accurate S&P 500 list is not feasible inside implementation time, stop and report. Do not invent symbols.

### 2. Generalize universe sync

Current Nasdaq 100 universe sync should be generalized or extended.

Requirements:

```txt
S&P 500 universe row should be created or updated with slug "sp-500".
Nasdaq 100 universe row should keep slug "nasdaq-100".
Sync should upsert Stock records by symbol.
Sync should upsert StockUniverseMember by stockId + universeId.
Stocks that disappear from a specific universe should be deactivated for that universe membership, not globally deleted.
Overlapping symbols should keep all active memberships.
```

Do not break:

```txt
syncNasdaq100UniverseAction
existing Admin Sync button behavior
existing SyncRun / SyncRunItem history
```

If adding a new action is safer than over-generalizing, do that. Keep the diff focused.

### 3. Generalize active symbol helpers

Replace or supplement:

```txt
getAllActiveNasdaq100Symbols()
```

with helpers such as:

```txt
getAllActiveUniverseSymbols(universeSlug)
getAllActiveUniqueSyncableSymbols()
getAllActiveUniqueSymbolsForUniverses(universeSlugs)
```

Exact names can vary, but behavior must be clear.

Requirements:

```txt
Helpers must return deduplicated normalized symbols.
Helpers should not return duplicate symbols because of overlapping memberships.
Existing Nasdaq 100 callers should continue to work or be updated safely.
Provider sync routes should use deduped helpers.
```

### 4. Daily Market Data Sync dedupe

Update Daily Market Data Sync routes/actions if needed so the symbol list is deduped before:

```txt
creating SyncRunItems
calling FMP quote
persisting StockQuote
reporting requested/processed counts
```

Do not change provider behavior or endpoint.

Current source remains:

```txt
FMP /stable/quote
```

### 5. Company Data Sync dedupe

Update Company Data Sync routes/actions if needed so the symbol list is deduped before:

```txt
creating SyncRunItems
calling FMP profile/ratios/growth/target endpoints
calling Finnhub recommendation counts
persisting Stock / StockMetric / StockAnalystData
reporting requested/processed counts
```

Do not change provider behavior or endpoints.

Current sources remain:

```txt
FMP: profile, ratios, growth, price-target consensus
Finnhub: recommendation counts
```

### 6. Score Calculation scope

Inspect score calculation actions.

If they already operate on unique Stock records, do not change them.

If they are universe-specific or duplicate-prone, adjust to process unique active Stock records only.

Do not change formulas or weights.

### 7. Default universe consistency

Fix default universe mismatch if confirmed in code/seed.

Expected product behavior:

```txt
The operational default should not point to an empty/demo Russell 1000 universe.
Default should reflect the current useful production universe or a clear All/Primary universe behavior.
```

Options:

```txt
Set nasdaq-100 as default until broader universe is production-ready.
Or define a clear default once S&P 500 is populated.
```

Choose the minimal safe change and document it in the final report.

### 8. Dashboard naming cleanup

Generalize Nasdaq-specific naming where needed.

Examples from audit:

```txt
activeNasdaq100
Nasdaq-specific total stock fallback logic
Nasdaq-specific freshness queries
```

Requirements:

```txt
Dashboard should not mislabel broader universe coverage as Nasdaq 100.
Dashboard totals should reflect the selected/default operational universe or active unique syncable stocks, whichever is currently implemented.
Do not redesign Dashboard.
Do not change Dashboard structure unless required for correct naming/data.
```

### 9. Admin Sync UI/copy

Update Admin Sync as needed:

```txt
Show S&P 500 universe sync option if implemented.
Keep Nasdaq 100 universe sync available.
Clarify static fallback source for S&P 500.
Clarify that Company/Daily syncs operate on unique active symbols and do not duplicate overlapping universe members.
Preserve production workflow grouping.
Preserve provider tests.
Preserve sync history.
Preserve progress panels and resumable behavior.
```

### 10. Scanner universe behavior

Ensure Scanner universe selection remains correct.

Requirements:

```txt
Nasdaq 100 selection still works.
S&P 500 selection works after sync has membership data.
All/default behavior is not misleading.
Pagination/search/filter/sort still work.
No duplicate rows for symbols that belong to multiple universes.
```

### 11. Data Inventory behavior

Do not redesign Data Inventory in this phase.

But ensure:

```txt
Overlapping universe memberships do not create duplicate stock rows.
Universe/membership display remains understandable.
Expanded universe rows do not break filters.
```

### 12. Documentation

After implementation and QA:

Update relevant docs if behavior changed:

```txt
Context/sync-workflows.md
Context/Features/market-data-sync-strategy.md
Context/Features/admin-sync-feature-spec.md
Context/data-model.md, only if ownership/behavior notes changed
Context/Features/scanner-feature-spec.md, only if scanner universe behavior changed
Context/Features/dashboard-feature-spec.md, only if Dashboard data contract/naming changed
Context/project-overview.md
Context/current-feature.md
```

Do not update algorithm docs unless scoring formulas changed.

---

## Acceptance Criteria

Phase 22B is complete when:

```txt
S&P 500 static fallback list exists and is valid.
S&P 500 universe can be synced into StockUniverse / StockUniverseMember.
Nasdaq 100 universe sync still works.
Overlapping Nasdaq 100 + S&P 500 symbols produce one Stock record and multiple memberships.
Provider-backed syncs dedupe symbols before provider calls and SyncRunItems.
No duplicate provider calls are made for overlapping symbols during combined/active sync.
No duplicate scanner rows appear for overlapping symbols.
Dashboard no longer uses misleading Nasdaq-only naming for broader universe counts.
Default universe behavior is corrected or explicitly justified.
Admin Sync clearly distinguishes Nasdaq 100 and S&P 500 universe membership sync.
Company/Daily sync copy clarifies unique active symbols where appropriate.
No schema changes.
No migrations.
No provider responsibility changes.
No scoring formula changes.
Scanner, Dashboard, Drawer, Admin Sync all load.
Build passes.
TypeScript passes.
Prisma validates.
Migration status is clean.
Documentation updated after QA.
```

---

## QA Requirements

Browser QA:

```txt
/admin/sync loads.
Sync Actions tab shows Nasdaq 100 and S&P 500 universe sync options if implemented.
Admin copy clearly says S&P 500 membership uses static fallback.
Sync History remains readable.
Data Inventory loads.
Scanner loads.
Scanner universe selector works.
Nasdaq 100 view has no duplicate rows.
S&P 500 view has no duplicate rows after membership exists.
All/default view has no duplicate rows if available.
Dashboard loads.
Drawer opens from Scanner.
```

Functional QA:

```txt
Run or dry-run universe sync for S&P 500 if safe.
Confirm S&P 500 StockUniverse exists.
Confirm StockUniverseMember records exist for S&P 500.
Confirm overlapping symbols have one Stock row and multiple memberships.
Confirm active unique sync helper returns deduped symbols.
Confirm Daily Market Data Sync symbol count is deduped.
Confirm Company Data Sync symbol count is deduped.
Confirm no duplicate SyncRunItem rows for overlapping symbols in the same run.
```

If full provider sync for 500 symbols is too expensive/time-consuming during QA:

```txt
Run a small controlled test subset if supported.
Otherwise verify dedupe logic with local DB queries and report exactly what was not fully run.
```

Regression QA:

```txt
Nasdaq 100 sync still works.
Dashboard loads and values are not obviously wrong.
Scanner search works.
Scanner sort works.
Scanner pagination works.
Scanner expanded row opens.
Scanner Drawer opens and still shows decision cockpit.
Admin Sync Provider Tests render.
Data Inventory filters still work if testable.
No provider calls from Dashboard/Scanner/Drawer normal UI render paths.
```

Automated checks:

```bash
npm run build
npx tsc --noEmit
npx prisma validate
npx prisma migrate status
```

---

## Documentation Update Checklist

Before requesting commit approval, check and update if needed:

```txt
Context/sync-workflows.md
Context/Features/market-data-sync-strategy.md
Context/Features/admin-sync-feature-spec.md
Context/data-model.md
Context/Features/scanner-feature-spec.md
Context/Features/dashboard-feature-spec.md
Context/project-overview.md
Context/current-feature.md
```

Do not update unless relevant:

```txt
Context/scoring-system.md
Context/Algorithms/fundamental-score-v1.md
Context/Algorithms/opportunity-score-v2.md
Context/Algorithms/analyst-rating-and-upside.md
Context/Algorithms/scanner-decision-tags.md
Context/Features/drawer-feature-spec.md
```

The final implementation report must include:

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

---

## Reporting Requirements

Implementation and QA reports must be written in English only.

Required final implementation report:

```txt
1. Branch name used.
2. Files inspected.
3. Files changed.
4. New files added.
5. Implementation summary.
6. Universe sync changes.
7. Unique/deduped sync behavior.
8. S&P 500 support details.
9. Nasdaq 100 regression result.
10. Dashboard/scanner/admin impacts.
11. QA results.
12. Regression QA results.
13. Automated check results.
14. Documentation Updates:
   - Updated:
   - Checked but not updated:
   - Reason:
   - MD files changed:
15. Known issues.
16. Ready for commit or not.
```

Explicitly confirm:

```txt
prisma/schema.prisma changed or not.
Migrations added or not.
Provider calls added or not.
Provider responsibilities changed or not.
Scoring formulas changed or not.
Duplicate provider sync for overlapping symbols prevented or not.
```

Do not commit without explicit user approval.
