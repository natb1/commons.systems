---
id: tactic-hold-conflict-align-tactics-tactic-mode-drift-gate
kind: tactic
statement: "hold: provision-conflict on
  `tactic-align-tactics-tactic-mode-drift-gate` — a tracked hold blocking the
  source until the mechanical retry state is resolved"
owner: ai
status: codified
parent: null
rationale: null
reading: null
gap: null
serves:
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
  reason: "/dispatch-conflict Lane 3: the origin/main merge conflict on this
    branch's own tracked file
    (.claude/skills/dispatch-propagate/scripts/test-dispatch-scripts.sh,
    modify/delete against origin/main's 58e5bc34 split-into-per-SUT-files
    commit) resolves cleanly and mechanically -- but the node's own frozen plan
    verification section hardcodes a `verify` block that runs the now-deleted
    monolith path, so plan verification fails on a stale path, not a real code
    defect. Lane 3 has no authority to edit the node's own plan body (that
    requires a graph write), so it escalates per the exit-1 verify-block-failure
    contract rather than landing a resolution the plan itself cannot verify."
  since: 2026-08-04
  recommendation: >-
    # Resume: `tactic-align-tactics-tactic-mode-drift-gate` (PR #2982) —
    conflict resolution parked


    **Root cause:** not a real code conflict. `origin/main` commit `58e5bc34`
    deleted the monolithic `test-dispatch-scripts.sh` and split it into ~99
    per-SUT siblings; this branch's Unit 2 driver block was anchored inside that
    now-deleted file, and — the actual reason Lane 3 escalated — the node's own
    frozen plan hardcodes that deleted path in a ` ```verify ` block, so plan
    verification fails on a stale path rather than a defect. Every other verify
    block passed (`node --check align-tactics.js`, and the 14-assertion
    `align-tactics-gates-probe: ALL PASS`).


    ## 1. Fix the node's plan body first (this is the part Lane 3 had no
    authority to do)


    Edit `intentions/tactic-align-tactics-tactic-mode-drift-gate.md`. The verify
    block at **line ~595–597** is the blocker: replace
    `.claude/skills/dispatch-propagate/scripts/test-dispatch-scripts.sh` with
    `.claude/skills/dispatch-propagate/scripts/test-align-tactics-gates.sh`.
    (Dropping the block entirely is also defensible — the
    `align-tactics-gates-probe.mjs` verify block two lines above already covers
    the same assertions — but keeping it preserves the call-site/regression
    `grep -c` checks that live only in the shell driver.)


    The stale path also appears in the plan prose at **lines 393, 405, 436, 464,
    and 570**; update those so a clean-session implementer isn't sent to a
    deleted file. Note line 405 quotes the sentinel string `// >>>
    computePhaseGates: sliced + eval'd by test-dispatch-scripts.sh
    (align-tactics) >>>` — keep that string exactly as-is if Unit 1 already
    wrote it into `align-tactics.js`, since the probe's `START` matcher and the
    exactly-once sentinel check depend on it verbatim (`align-tactics.js` shows
    the tempref sentinel still carries the old name on main, so this naming is
    consistent, not stale).


    Land the body edit with `graph-commit`, or re-author via `/align-tactics
    tactic-align-tactics-tactic-mode-drift-gate`. Do **not** hand-edit and leave
    it uncommitted — a concurrent `write-node.ts` will clobber it.


    ## 2. Redo the git resolution (confirm it's still current — `origin/main`
    has moved since the draft)


    Re-run `git merge --no-edit origin/main` on the branch (currently at
    `8da2e146`, unresolved after a `reset --hard`). Expect the same single
    `modify/delete` conflict on `test-dispatch-scripts.sh`; everything else
    auto-merges.


    1. `git rm
    .claude/skills/dispatch-propagate/scripts/test-dispatch-scripts.sh` — accept
    main's deletion.

    2. Create
    `.claude/skills/dispatch-propagate/scripts/test-align-tactics-gates.sh`
    modeled exactly on its sibling `test-align-tactics-tempref.sh`:
    `#!/usr/bin/env bash`, `set -euo pipefail`, `FIXTURE_DIR="$(cd "$(dirname
    "$0")" && pwd)"`, `source "$FIXTURE_DIR/dispatch-test-fixture.sh"` (which
    supplies `SCRIPT_DIR`, `REPO_ROOT`, `assert_eq`, `report_results`), then the
    verbatim Unit-2 driver assertions from the plan, ending in `report_results`.
    `chmod +x` it. Keep the `printf '%s'` form — `.claude/rules/shell-json.md`
    is linted on net-new `.sh` lines.

    3. `git add` both paths, confirm no `<<<<<<<`/`=======`/`>>>>>>>` remain,
    `git commit --no-edit`.


    ## 3. Don't miss the CI wiring — the drafted resolution did not cover it


    The whole point of Unit 2 is per-PR coverage, and `run-unit-tests.sh` sets
    `RUN_PR_SCRIPTS` only for changed paths under the scripts dir — a PR
    touching only `align-tactics.js` would run nothing. Add an explicit step to
    the `hook-tests` job in `.github/workflows/unit-tests.yml`, next to the
    existing `Run align-tactics resolveTempRefs tests` step (~line 209):


    ```yaml
          - name: Run align-tactics computePhaseGates tests
            run: .claude/skills/dispatch-propagate/scripts/test-align-tactics-gates.sh
    ```


    That job's header comment explicitly says to keep the list in sync when
    adding a suite whose SUT lives outside the scripts dir —
    `.claude/workflows/align-tactics.js` does.


    ## 4. Verify and re-dispatch


    Locally: run the three surviving verify blocks (`node --check
    .claude/workflows/align-tactics.js`, `node
    .../align-tactics-gates-probe.mjs`, `node
    .../align-tactics-tempref-probe.mjs`) plus the new
    `.../test-align-tactics-gates.sh` directly — expect
    `align-tactics-gates-probe: ALL PASS` and a clean `report_results`. Confirm
    PR #2982 flips off `mergeable: false`.


    Once the plan body edit has landed on `origin/main`, re-invoke
    `/dispatch-conflict tactic-align-tactics-tactic-mode-drift-gate`. With the
    stale verify path gone, Lane 3 should reproduce the conflict, apply the same
    resolution, pass all verify blocks, and run through to a push and
    node-terminal marker without escalating.
  session_type: other
pace_exempt: false
rounds: null
attributes:
  hold_for: tactic-align-tactics-tactic-mode-drift-gate
  hold_kind: provision-conflict
---
# hold: provision-conflict on tactic-align-tactics-tactic-mode-drift-gate

## Context

`tactic-align-tactics-tactic-mode-drift-gate` hit a mechanical retry state (`provision-conflict`) on 2026-08-04. A mechanical retry state is not "no autonomous path exists, human required", so the source is NOT parked. Instead this born-parked hold tactic (`tactic-hold-conflict-align-tactics-tactic-mode-drift-gate`) carries the park, and `tactic-align-tactics-tactic-mode-drift-gate` gains a `blocked_by` edge naming it. The source's own `office_hours` is never written.

## Reason

/dispatch-conflict Lane 3: the origin/main merge conflict on this branch's own tracked file (.claude/skills/dispatch-propagate/scripts/test-dispatch-scripts.sh, modify/delete against origin/main's 58e5bc34 split-into-per-SUT-files commit) resolves cleanly and mechanically -- but the node's own frozen plan verification section hardcodes a `verify` block that runs the now-deleted monolith path, so plan verification fails on a stale path, not a real code defect. Lane 3 has no authority to edit the node's own plan body (that requires a graph write), so it escalates per the exit-1 verify-block-failure contract rather than landing a resolution the plan itself cannot verify.

## How to resolve

# Resume: `tactic-align-tactics-tactic-mode-drift-gate` (PR #2982) — conflict resolution parked

**Root cause:** not a real code conflict. `origin/main` commit `58e5bc34` deleted the monolithic `test-dispatch-scripts.sh` and split it into ~99 per-SUT siblings; this branch's Unit 2 driver block was anchored inside that now-deleted file, and — the actual reason Lane 3 escalated — the node's own frozen plan hardcodes that deleted path in a ` ```verify ` block, so plan verification fails on a stale path rather than a defect. Every other verify block passed (`node --check align-tactics.js`, and the 14-assertion `align-tactics-gates-probe: ALL PASS`).

## 1. Fix the node's plan body first (this is the part Lane 3 had no authority to do)

Edit `intentions/tactic-align-tactics-tactic-mode-drift-gate.md`. The verify block at **line ~595–597** is the blocker: replace `.claude/skills/dispatch-propagate/scripts/test-dispatch-scripts.sh` with `.claude/skills/dispatch-propagate/scripts/test-align-tactics-gates.sh`. (Dropping the block entirely is also defensible — the `align-tactics-gates-probe.mjs` verify block two lines above already covers the same assertions — but keeping it preserves the call-site/regression `grep -c` checks that live only in the shell driver.)

The stale path also appears in the plan prose at **lines 393, 405, 436, 464, and 570**; update those so a clean-session implementer isn't sent to a deleted file. Note line 405 quotes the sentinel string `// >>> computePhaseGates: sliced + eval'd by test-dispatch-scripts.sh (align-tactics) >>>` — keep that string exactly as-is if Unit 1 already wrote it into `align-tactics.js`, since the probe's `START` matcher and the exactly-once sentinel check depend on it verbatim (`align-tactics.js` shows the tempref sentinel still carries the old name on main, so this naming is consistent, not stale).

Land the body edit with `graph-commit`, or re-author via `/align-tactics tactic-align-tactics-tactic-mode-drift-gate`. Do **not** hand-edit and leave it uncommitted — a concurrent `write-node.ts` will clobber it.

## 2. Redo the git resolution (confirm it's still current — `origin/main` has moved since the draft)

Re-run `git merge --no-edit origin/main` on the branch (currently at `8da2e146`, unresolved after a `reset --hard`). Expect the same single `modify/delete` conflict on `test-dispatch-scripts.sh`; everything else auto-merges.

1. `git rm .claude/skills/dispatch-propagate/scripts/test-dispatch-scripts.sh` — accept main's deletion.
2. Create `.claude/skills/dispatch-propagate/scripts/test-align-tactics-gates.sh` modeled exactly on its sibling `test-align-tactics-tempref.sh`: `#!/usr/bin/env bash`, `set -euo pipefail`, `FIXTURE_DIR="$(cd "$(dirname "$0")" && pwd)"`, `source "$FIXTURE_DIR/dispatch-test-fixture.sh"` (which supplies `SCRIPT_DIR`, `REPO_ROOT`, `assert_eq`, `report_results`), then the verbatim Unit-2 driver assertions from the plan, ending in `report_results`. `chmod +x` it. Keep the `printf '%s'` form — `.claude/rules/shell-json.md` is linted on net-new `.sh` lines.
3. `git add` both paths, confirm no `<<<<<<<`/`=======`/`>>>>>>>` remain, `git commit --no-edit`.

## 3. Don't miss the CI wiring — the drafted resolution did not cover it

The whole point of Unit 2 is per-PR coverage, and `run-unit-tests.sh` sets `RUN_PR_SCRIPTS` only for changed paths under the scripts dir — a PR touching only `align-tactics.js` would run nothing. Add an explicit step to the `hook-tests` job in `.github/workflows/unit-tests.yml`, next to the existing `Run align-tactics resolveTempRefs tests` step (~line 209):

```yaml
      - name: Run align-tactics computePhaseGates tests
        run: .claude/skills/dispatch-propagate/scripts/test-align-tactics-gates.sh
```

That job's header comment explicitly says to keep the list in sync when adding a suite whose SUT lives outside the scripts dir — `.claude/workflows/align-tactics.js` does.

## 4. Verify and re-dispatch

Locally: run the three surviving verify blocks (`node --check .claude/workflows/align-tactics.js`, `node .../align-tactics-gates-probe.mjs`, `node .../align-tactics-tempref-probe.mjs`) plus the new `.../test-align-tactics-gates.sh` directly — expect `align-tactics-gates-probe: ALL PASS` and a clean `report_results`. Confirm PR #2982 flips off `mergeable: false`.

Once the plan body edit has landed on `origin/main`, re-invoke `/dispatch-conflict tactic-align-tactics-tactic-mode-drift-gate`. With the stale verify path gone, Lane 3 should reproduce the conflict, apply the same resolution, pass all verify blocks, and run through to a push and node-terminal marker without escalating.

The `blocked_by` edge on `tactic-align-tactics-tactic-mode-drift-gate` clears only when this node leaves the open set: resolve the hold tactic to `phase: done` (then prune) — clearing `office_hours` alone does not unblock the source.

