---
id: tactic-orphaned-delegation-records-reading
kind: tactic
statement: read-sensors.ts's readDelegationRecordsReading is now unreachable
  from production code (superseded by two new per-strategy reading functions
  landed on tactic-first-sensor-pass), but it is also the only code implementing
  a doctrine rule about excluding declined delegation records from unexercised
  counts for strategy-exercise-recovery-paths. An author needs to decide whether
  that rule still governs the new readings before the orphaned function and its
  tests can be safely deleted.
owner: ai
status: raw
parent: null
rationale: null
reading: null
serves:
  - strategy-graph-drives-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: done
execution:
  branch: pr16-node-mutation-scripts
  pr: 3138
  attempts: {}
  markers: []
  strategy_fingerprint: null
  fix: null
  conflict: null
  completion:
    mergedAt: 2026-08-30T00:43:02Z
    mergeCommitSha: 96d22cb13f56d4240305033b9ad9af76009f9ceb
    graphCommitSha: null
  lane_pass: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Orphaned readDelegationRecordsReading vs. exercise-recovery-paths counting rule

## Provenance

- `packages/intentionsutil/scripts/read-sensors.ts:899` — dead-code / doctrine-gap
  finding, deferred from the `/review-fix` code-review residue pass on this PR
  (bucket: Deferred, source: code-review). Not routed through the
  input-validation/red-team adversarial-verify pipeline, so no adversarial-verify
  verdict is recorded for it.
- Category: `readDelegationRecordsReading` has no remaining production caller —
  the sensor dispatch now routes `strategy-exercise-recovery-paths` through a
  different, newly added reading function — so only the test file still
  exercises it. Left as-is it can silently drift out of sync with the module.
- The non-trivial part is a semantics question, not a bug: the orphaned
  function is the only place that implements a rule for
  `strategy-exercise-recovery-paths` about not counting a delegation record
  with a "declined" origin as unexercised (such a record has no entered path
  to walk). Whether the newly landed per-strategy reading still needs to honor
  that rule, or whether the rule has been superseded by a simpler threshold
  count, is an open call for a human/author to make before the dead function
  and its tests can be safely removed.
- No runtime bug is implicated; this is dead code plus an unresolved reading-
  semantics decision.

Source PR: #3062


## What shipped — 2026-08-30, branch A executed

Landed in #3138 (merge commit `96d22cb1`), Position 2 of the dispatch/RSI
serialized window, as PR16 Unit 5. The threshold half landed as `8a823862`.

The ruling — **the declined-origin rule still governs; port it, then delete the
dead function** — was executed in the required order.

1. **Ported.** `readExerciseRecoveryPathsReading` counted over all records with
   no declined special-casing. Declined-origin records are now their own class
   and are never counted as unexercised. There are 22 delegation records and
   exactly one, `delegation-hosted-publishing`, is `origin: declined`.
2. **Docstring corrected.** The sentence that rationalized the drop — that this
   strategy's threshold "just asks how many records have `last_exercised` set" —
   is gone. It was the reasoning the ruling overturns, and leaving it would have
   invited the next reader to re-drop the rule.
3. **The two rule tests were RETARGETED, not deleted.** They are the only
   assertions of the declined-origin rule anywhere in the repo, so deleting them
   would have been the weakening `.claude/rules/test-integrity.md` forbids. One
   lost its `oldest last_assessed` assertion because the surviving function does
   not compute that field — only the deleted one did — and the test was renamed
   to match what it now asserts rather than left with a lying name. The
   load-bearing declined-origin half is preserved and strengthened.
4. **Reader first, then threshold.** `deriveGap` is trimmed, case-insensitive
   string equality, so a reading that embeds its read date can never meet any
   fixed threshold. The reader now emits a canonical date-free literal in the met
   state — exported as `EXERCISE_RECOVERY_PATHS_MET_READING` — and reserves the
   counts-and-date form for the unmet state. The threshold on
   `strategy-exercise-recovery-paths` was then set to **exactly** that literal,
   piped from the merged source rather than retyped, because an independently
   worded threshold is precisely the silent no-op this step was corrected to
   avoid.
5. **`readDelegationRecordsReading` deleted.** `readDelegationRecords` and
   `renderDelegationRecordsReport` are live and survive with their own tests.

### One guard beyond the ruling

The met state additionally requires **at least one active record**. "Every
active record is exercised" is vacuously true over zero records, and reporting
green off zero measured paths would be a false all-clear on the exact condition
this strategy exists to detect.

### The plan's verification step was wrong, and the corrected result

The serialized plan said to verify by confirming `deriveGap` returns `null`.
That **cannot pass today** and following it literally would suggest a correct
reader had failed: 18 of 22 records have `last_exercised: null`, and excluding
the declined one still leaves **17 of 21 active records unexercised**.

What was verified instead, on the live node after the threshold landed:

- `threshold === EXERCISE_RECOVERY_PATHS_MET_READING` → **true** (byte-identical)
- `deriveGap` on the live reading → **non-null**, correctly — the work is undone
- `deriveGap` with the reading set to the met literal → **null**

That is the real deliverable: the signal was **permanently unsatisfiable**
before, and is now merely unmet. The gap is open because 17 drills have not been
run, not because the threshold is unreachable prose.

Live reading at close: `exercised: 4/21 active records (1 declined-origin
excluded); 17 null last_exercised; review_trigger firing not recorded (sensor
read 2026-08-30)` — the declined-origin exclusion is visible in it, where the
prior reading said `4/22 records; 18 null`.

### Execution record

This node previously carried `execution.pr: 3062` — the merged 2026-08-10 PR
that registered the delegation-records sensor and **created** this orphan. It
was not the PR that resolved it. `execution` now points at #3138, which shipped
the port, so branch, pr and completion all describe one landing; #3062 is
recorded here instead.

**Verification:** `intentionsutil` vitest 1252/1252 across 57 files, including a
fixture test where every active record is exercised, asserting the canonical
literal and `deriveGap` → `null`.
