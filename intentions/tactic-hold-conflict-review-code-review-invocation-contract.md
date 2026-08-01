---
id: tactic-hold-conflict-review-code-review-invocation-contract
kind: tactic
statement: "hold: provision-conflict on
  `tactic-review-code-review-invocation-contract` — a tracked hold blocking the
  source until the mechanical retry state is resolved"
owner: ai
status: codified
parent: null
rationale: null
reading: null
gap: null
serves:
  - strategy-token-economy
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: null
execution: null
validates: []
blocked_by: []
office_hours:
  reason: "/dispatch-conflict Lane 3: origin/main merge conflict on node
    tactic-review-code-review-invocation-contract's own branch (PR #3007),
    single conflicted file .claude/workflows/review-fix.js. An opus resolver
    subagent judged the conflict ambiguous: reconciling it requires deleting a
    Skill-tool invocation path that a separately-landed sibling tactic
    (tactic-lane-instrument-substitution-guard, origin/main commit 778a1c94)
    unconditionally CI-pins by literal grep count in
    test-review-fix-instrument.sh (wired into .github/workflows/unit-tests.yml's
    hook-tests job). That test file did not conflict in this merge — it
    auto-merged cleanly, since it is a new file — but its grep-pinned assertions
    assume code-review still runs as a Skill-tool agent finder inside the
    Workflow's fan-out, which this node's own Unit 4 (commit 2b0d6f95)
    deliberately removes. A correct merge of review-fix.js therefore red-lights
    that CI suite. Deciding which tactic's doctrine the test should encode after
    the merge is a coordinated decision outside this lane's single-file
    conflict-resolution scope, and cannot be resolved by weakening the test
    (forbidden). See the attached recommendation for the concrete retarget
    path."
  since: 2026-07-31
  recommendation: >-
    # Next steps: `tactic-review-code-review-invocation-contract` (PR #3007)


    ## The decision needed


    This is a doctrine call, not a merge mechanic. Two independently-landed
    tactics encode contradictory beliefs about how `/code-review` runs, and
    `origin/main` now has CI teeth enforcing the losing one.


    The recommended resolution: **retarget the two grep-pinned assertions in
    `test-review-fix-instrument.sh` to the `security-review`-only shape.** They
    currently assume `code-review` is still a Skill-tool agent finder inside the
    Workflow's fan-out, which HEAD's redesign deletes by design:


    - `grep -c "instrumentFailed.has('code-review')"` expects `1` — under HEAD's
    design that guard has no referent, since there is no `code-review` finder
    result left to null out. Retarget to `security-review`.

    - `grep -c 'instrumentClause(INSTRUMENTS'` expects `2` ("both Lane-A prompt
    branches") — only the `security-review` branch survives. Narrow to `1`.


    This is retargeting an anti-regression test to the invariant that is
    actually true after the merge, not weakening it. The gate it guards (a
    finder must not silently substitute its own review when a named built-in is
    rejected) stays fully in force for `security-review`, the only finder to
    which it can still apply.


    The alternative — deciding `tactic-lane-instrument-substitution-guard`'s
    doctrine wins and rethinking this node's redesign — should be named but
    looks wrong: `code-review` ships with `disable-model-invocation`, so a
    `Skill(skill: "code-review", ...)` call inside the sandboxed Workflow is
    *structurally* never invocable, no matter what the gate asserts. Keeping
    that doctrine keeps a path that cannot work. Note also that `origin/main` as
    it stands right now sets `deviation: true` on every `/review-fix` pass,
    because the gate fires unconditionally on the always-rejected `code-review`
    call. Main is already degraded, and this test conflict is what's holding the
    fix out.


    ## Artifacts


    - `.claude/workflows/review-fix.js` — the single conflicted file. The
    automated pass aborts the merge before parking, so expect a clean tree, not
    live markers.

    - `.claude/skills/dispatch-propagate/scripts/test-review-fix-instrument.sh`
    — the CI-pinning test. Not in this node's scope, but blocking its merge.

    -
    `.claude/skills/dispatch-propagate/scripts/review-fix-instrument-probe.mjs`
    — the probe the test drives.

    - `.github/workflows/unit-tests.yml:211-212` — where the test is
    unconditionally wired into the `hook-tests` job.

    - `intentions/tactic-review-code-review-invocation-contract.md` — the node
    body's "Merge-order note" (end of Unit 4) anticipated only a
    `finderPrompt`-branch text collision and said "deletion wins." It did not
    anticipate the CI teeth, so it is not sufficient authority here on its own.


    ## Shape of the reconciled `review-fix.js`


    A resolver subagent designed and syntactically confirmed this during the
    automated conflict pass, but did not apply it. Starting point for the
    hand-merge:


    - Keep `origin/main`'s `INSTRUMENTS` registry, `instrumentVerdict()`,
    `transcriptVerdictDetail()`, the transcript-verification stage, and the
    `instrumentFailures`/`coverage_note`/`deviation` wiring — but scope all of
    it to `security-review` only.

    - Rewire references from the deleted
    `qualityFinders`/`qualityResults`/`securityFinders`/`securityResults` names
    onto HEAD's `probeFinders`/`probeResults`/`waveTwoFinders`/`waveTwoResults`.

    - Drop the `code-review` branch of `finderPrompt`/`instrumentClause`.

    - Leave HEAD's contract untouched: the top-of-script hard fail when
    `args.code_review` is missing or not `status: "ok"`,
    `codeReviewParsePrompt`, `parsedCodeReview`, and the mechanical
    `touched_files` enforcement.

    - Split the shared Lane-A schema/blurb in two, so the instrument-free
    `parse:code-review` structuring subagent is not asked to produce an
    instrument receipt. This also makes the third assertion (`required:
    ['fixed', 'residue', 'instrument']` count `1`) satisfiable as written — no
    change needed there.

    - The probe's `code-review` fixture cases stay green if the `INSTRUMENTS`
    entry is kept as inert unused data. That is a workaround; prefer removing
    the entry and the fixture cases together if the doctrine decision goes the
    recommended way.


    ## Confirming the reconciliation


    After resolving, `node --check` the resolved
    `.claude/workflows/review-fix.js`, then run
    `.claude/skills/dispatch-propagate/scripts/run-unit-tests.sh --pr-scripts`
    for real — that exercises `test-review-fix-instrument.sh` and is the actual
    check on whether the doctrine reconciliation holds. A green `node --check`
    alone proves nothing here; the whole conflict lives in the test.
  session_type: other
pace_exempt: false
rounds: null
attributes:
  hold_for: tactic-review-code-review-invocation-contract
  hold_kind: provision-conflict
---
# hold: provision-conflict on tactic-review-code-review-invocation-contract

## Context

`tactic-review-code-review-invocation-contract` hit a mechanical retry state (`provision-conflict`) on 2026-07-31. A mechanical retry state is not "no autonomous path exists, human required", so the source is NOT parked. Instead this born-parked hold tactic (`tactic-hold-conflict-review-code-review-invocation-contract`) carries the park, and `tactic-review-code-review-invocation-contract` gains a `blocked_by` edge naming it. The source's own `office_hours` is never written.

## Reason

/dispatch-conflict Lane 3: origin/main merge conflict on node tactic-review-code-review-invocation-contract's own branch (PR #3007), single conflicted file .claude/workflows/review-fix.js. An opus resolver subagent judged the conflict ambiguous: reconciling it requires deleting a Skill-tool invocation path that a separately-landed sibling tactic (tactic-lane-instrument-substitution-guard, origin/main commit 778a1c94) unconditionally CI-pins by literal grep count in test-review-fix-instrument.sh (wired into .github/workflows/unit-tests.yml's hook-tests job). That test file did not conflict in this merge — it auto-merged cleanly, since it is a new file — but its grep-pinned assertions assume code-review still runs as a Skill-tool agent finder inside the Workflow's fan-out, which this node's own Unit 4 (commit 2b0d6f95) deliberately removes. A correct merge of review-fix.js therefore red-lights that CI suite. Deciding which tactic's doctrine the test should encode after the merge is a coordinated decision outside this lane's single-file conflict-resolution scope, and cannot be resolved by weakening the test (forbidden). See the attached recommendation for the concrete retarget path.

## How to resolve

# Next steps: `tactic-review-code-review-invocation-contract` (PR #3007)

## The decision needed

This is a doctrine call, not a merge mechanic. Two independently-landed tactics encode contradictory beliefs about how `/code-review` runs, and `origin/main` now has CI teeth enforcing the losing one.

The recommended resolution: **retarget the two grep-pinned assertions in `test-review-fix-instrument.sh` to the `security-review`-only shape.** They currently assume `code-review` is still a Skill-tool agent finder inside the Workflow's fan-out, which HEAD's redesign deletes by design:

- `grep -c "instrumentFailed.has('code-review')"` expects `1` — under HEAD's design that guard has no referent, since there is no `code-review` finder result left to null out. Retarget to `security-review`.
- `grep -c 'instrumentClause(INSTRUMENTS'` expects `2` ("both Lane-A prompt branches") — only the `security-review` branch survives. Narrow to `1`.

This is retargeting an anti-regression test to the invariant that is actually true after the merge, not weakening it. The gate it guards (a finder must not silently substitute its own review when a named built-in is rejected) stays fully in force for `security-review`, the only finder to which it can still apply.

The alternative — deciding `tactic-lane-instrument-substitution-guard`'s doctrine wins and rethinking this node's redesign — should be named but looks wrong: `code-review` ships with `disable-model-invocation`, so a `Skill(skill: "code-review", ...)` call inside the sandboxed Workflow is *structurally* never invocable, no matter what the gate asserts. Keeping that doctrine keeps a path that cannot work. Note also that `origin/main` as it stands right now sets `deviation: true` on every `/review-fix` pass, because the gate fires unconditionally on the always-rejected `code-review` call. Main is already degraded, and this test conflict is what's holding the fix out.

## Artifacts

- `.claude/workflows/review-fix.js` — the single conflicted file. The automated pass aborts the merge before parking, so expect a clean tree, not live markers.
- `.claude/skills/dispatch-propagate/scripts/test-review-fix-instrument.sh` — the CI-pinning test. Not in this node's scope, but blocking its merge.
- `.claude/skills/dispatch-propagate/scripts/review-fix-instrument-probe.mjs` — the probe the test drives.
- `.github/workflows/unit-tests.yml:211-212` — where the test is unconditionally wired into the `hook-tests` job.
- `intentions/tactic-review-code-review-invocation-contract.md` — the node body's "Merge-order note" (end of Unit 4) anticipated only a `finderPrompt`-branch text collision and said "deletion wins." It did not anticipate the CI teeth, so it is not sufficient authority here on its own.

## Shape of the reconciled `review-fix.js`

A resolver subagent designed and syntactically confirmed this during the automated conflict pass, but did not apply it. Starting point for the hand-merge:

- Keep `origin/main`'s `INSTRUMENTS` registry, `instrumentVerdict()`, `transcriptVerdictDetail()`, the transcript-verification stage, and the `instrumentFailures`/`coverage_note`/`deviation` wiring — but scope all of it to `security-review` only.
- Rewire references from the deleted `qualityFinders`/`qualityResults`/`securityFinders`/`securityResults` names onto HEAD's `probeFinders`/`probeResults`/`waveTwoFinders`/`waveTwoResults`.
- Drop the `code-review` branch of `finderPrompt`/`instrumentClause`.
- Leave HEAD's contract untouched: the top-of-script hard fail when `args.code_review` is missing or not `status: "ok"`, `codeReviewParsePrompt`, `parsedCodeReview`, and the mechanical `touched_files` enforcement.
- Split the shared Lane-A schema/blurb in two, so the instrument-free `parse:code-review` structuring subagent is not asked to produce an instrument receipt. This also makes the third assertion (`required: ['fixed', 'residue', 'instrument']` count `1`) satisfiable as written — no change needed there.
- The probe's `code-review` fixture cases stay green if the `INSTRUMENTS` entry is kept as inert unused data. That is a workaround; prefer removing the entry and the fixture cases together if the doctrine decision goes the recommended way.

## Confirming the reconciliation

After resolving, `node --check` the resolved `.claude/workflows/review-fix.js`, then run `.claude/skills/dispatch-propagate/scripts/run-unit-tests.sh --pr-scripts` for real — that exercises `test-review-fix-instrument.sh` and is the actual check on whether the doctrine reconciliation holds. A green `node --check` alone proves nothing here; the whole conflict lives in the test.

The `blocked_by` edge on `tactic-review-code-review-invocation-contract` clears only when this node leaves the open set: resolve the hold tactic to `phase: done` (then prune) — clearing `office_hours` alone does not unblock the source.

