---
id: tactic-mainqa-budget-pipeline
kind: tactic
statement: Verify the budget statement pipeline live end-to-end — fresh QFX
  ingest, idempotent re-run, categorization dialog context, .benc decrypt in the
  hosted app
owner: human
status: delegated
parent: null
rationale: "Migrated 2026-07-05 from the legacy gh main-qa office-hours queue
  (target-state review): issues 2680, 2681, 2679, 2703. The owned local-first
  budgeting pipeline is target-state; its live verification needs the owner
  machine (Drive mount, real statement files, real password)."
reading: null
gap: null
serves:
  - strategy-recover-finance
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
  reason: needs owner machine + live credentials (Drive mount, real bank
    statement, encryption password) — live production verification migrated from
    the legacy main-qa queue
  since: 2026-07-05
  recommendation: null
pace_exempt: false
rounds: null
attributes: {}
---
# Verify the budget statement pipeline live end-to-end — fresh QFX ingest, idempotent re-run, categorization dialog context, .benc decrypt in the hosted app

## Context

Migrated from the legacy gh main-qa queue (target-state review); migration
record: tactic-mainqa-first-class-phase. Source issues (closed, content
preserved here): 2680, 2681, 2679, 2703 — needs-main residue from the
budget-sync orchestrator (issue 2645, PR 2678) and the shared-crypto
migration (issue 2668, PR 2695). Owned local-first budgeting
(`strategy-recover-finance`) is target-state. One owner sitting: live Drive
mount (/mnt/g), the distributed budget-etl binary, a real statement file, the
real encryption password.

## Verification checklist

1. **Encrypted end-to-end ingest of a fresh QFX** (was 2680): a fresh `.qfx`
   in Downloads is relocated to the statements directory and appears in the
   inspection report; the categorization dialog resolves uncategorized
   transactions; a fresh encrypted `.benc` snapshot is written; `current` is
   updated in place so the hosted budget app reloads it without manual
   refresh.
2. **Clean no-op re-run** (was 2681): re-running with no new downloads
   ingests nothing, writes no new snapshot, leaves `current` mtime unchanged,
   and exits 0 with a no-new-data message.
3. **Multi-iteration categorization context** (was 2679): when categorization
   does not converge in one pass, the second-iteration dialog still shows
   date/amount/description identifiers sufficient to decide without external
   lookup (including when the residual comes from budget-apply's merge stderr
   rather than the richer inspect-report array).
4. **.benc decrypt via shared crypto worker** (was 2703, PR 2695): a real
   `.benc` produced by budget-etl decrypts in the budget production build via
   the shared `@commons-systems/crypto` worker, byte-identical plaintext to
   the pre-migration crypto path.

## Completion

Pass → `phase: done` (prune). Broken → author an implement tactic with the
finding and prune this one. Clear the park by committing the outcome to this
node.
