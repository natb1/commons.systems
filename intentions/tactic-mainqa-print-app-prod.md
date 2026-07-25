---
id: tactic-mainqa-print-app-prod
kind: tactic
statement: Verify print app behavior against production — load-more pagination
  past 24 items, composite index and name-cursor adequacy, exhausted-stream read
  reduction, bounded PDF metadata reads
owner: human
status: delegated
parent: null
rationale: "Migrated 2026-07-05 from the legacy gh main-qa office-hours queue
  (target-state review): issues 2724, 2723, 2762, 2589. The print shared-media
  app is a product surface unaffected by the dispatch-architecture migration;
  these checks need production Firestore data volumes (>24 public items),
  deployed composite indexes, and DevTools observation."
reading: null
gap: null
serves:
  - strategy-household-shared-attachments
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: main-qa
execution: null
validates: []
blocked_by: []
office_hours:
  reason: needs production Firestore data volume, deployed indexes, and browser
    DevTools observation with real usage
  since: 2026-07-05
  recommendation: null
pace_exempt: false
rounds: null
attributes: {}
---
# Verify print app behavior against production — load-more pagination past 24 items, composite index and name-cursor adequacy, exhausted-stream read reduction, bounded PDF metadata reads

## Context

Migrated from the legacy gh main-qa queue (target-state review); migration
record: tactic-mainqa-first-class-phase. Source issues (closed, content
preserved here): 2724, 2723, 2762, 2589 — needs-main residue from the
media-list pagination work (issue 2709, PR 2715), the exhausted-stream read
reduction (issue 2754, PR 2761), and bounded PDF enrichment (issue 2497, PR
2586). The print shared-media app is a product surface unaffected by the
dispatch-architecture migration. QA seeds cap at 3 public items, so
pagination needs production data volume (>24 public items); the
read-reduction and boundedness checks need DevTools/network observation.

## Verification checklist

1. **Load-more pagination** (was 2724, PR 2715): with >24 public items, page
   1 of `/` shows exactly the first 24 in stable order (addedAt desc, id
   desc); Load more appends the next page without duplicates or gaps; the
   button disappears when exhausted.
2. **Composite index + name-cursor adequacy** (was 2723): the two composite
   indexes (publicDomain+addedAt, memberEmails+addedAt) plus the
   `orderBy(documentId(),'desc')`/`startAfter(...)` cursor form serve the
   bounded queries in production with no failed-precondition/missing-index
   error (the emulator auto-creates indexes, so only real Firestore proves
   this).
3. **Exhausted-stream read reduction** (was 2762, PR 2761): the exhausted
   stream is no longer re-queried per Load-more page in the live app — watch
   the Firestore usage/network panel; no missing or mis-ordered results.
4. **Bounded PDF metadata reads** (was 2589, PR 2586): opening a large
   (>4 MB) PDF via the local-folder flow populates title and page count while
   reading only a small header/trailer byte range (DevTools file-access
   profiling), not the full file.

## Completion

Pass → `phase: done` (prune). Broken → author an implement tactic with the
finding and prune this one. Clear the park by committing the outcome to this
node.
