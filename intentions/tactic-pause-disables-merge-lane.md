---
id: tactic-pause-disables-merge-lane
kind: tactic
statement: Run the node-lane merge lane on dispatch-tick's paused branch so
  pausing worker spawning does not also stop the queue draining
owner: ai
status: raw
parent: null
rationale: "Found by the 2026-08-11 rsi iteration while re-measuring the
  dispatch pause's resume criteria. graph-auto-merge runs only inside
  dispatch-select-tick, which sits past the pause short-circuit's exit 0, so no
  reviewed node-lane PR merges while the sentinel exists. That contradicts the
  recorded intent that the sentinel gates worker SPAWNING only and that the
  paused branch covers what a queue needs to drain, and it made the standing
  pause self-blocking: its own first resume criterion requires PR #3052 to
  merge, and #3052 sat 23/23 green and unmerged for exactly that reason."
reading: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: main-qa
execution:
  branch: tactic-pause-disables-merge-lane
  pr: 3068
  attempts: {}
  markers:
    - planned
  strategy_fingerprint: null
  fix:
    since: 2026-08-11
    attempt: 2
    pushed_sha: 74548a2b793abec41ac2d6f044de22c99040f8ff
  conflict: null
  completion:
    mergedAt: 2026-08-12T15:52:11Z
    mergeCommitSha: 41600c4222b939ff732b7d69eefee1eaeab49a1c
    graphCommitSha: null
  lane_pass: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Run the node-lane merge lane on dispatch-tick's paused branch so pausing worker spawning does not also stop the queue draining

## Context

The pause sentinel is documented as gating worker **spawning** only. Its own
comment at `.claude/skills/dispatch-propagate/scripts/dispatch-tick:311-312`
says "The sentinel gates worker SPAWNING only, never ledger bookkeeping", and
the pause record's rationale claims the paused branch runs "precisely the set
needed to drain a queue, so pausing costs no healing".

That is not what the code does. The paused branch runs five sweeps —
reservation, stand-down re-check, stale-hold re-check, frozen-session, and
terminal-disposition — and then exits at `dispatch-tick:415`. The node-lane
merge lane is not among them: `graph-auto-merge` is invoked at
`dispatch-select-tick:505`, and every `dispatch-select-tick` invocation sits at
`dispatch-tick:638-642`, past that exit. Merging a reviewed, green PR is the
terminal drain step for a node, so pausing **does** cost healing.

The consequence is not theoretical. The dispatch pause standing since
2026-08-10 records five resume criteria (now carried as
`attributes.pause.resume_criteria` on `strategy-recursive-self-improvement`).
Criterion 1 requires PR #3052 to be merged. #3052 is a node-lane PR in phase
`review` that sat 23/23 green, `mergeable: CLEAN`, and unmerged — because the
only lane that would merge it does not run while the pause it gates is in
force. A pause whose first resume criterion requires an action the pause itself
disables cannot lift on its own. The two escapes — an operator-run
`dispatch-tick --manual` (which bypasses the sentinel at `dispatch-tick:314`,
testing `-z "$MANUAL"`) and an author hand-merge — are operator actions that no
part of the record named as a dependency of resuming.

Intended outcome: pausing spawning stops new work starting, and nothing else.
Work already through review still lands, so a pause drains toward its own
resume criteria instead of latching against them.

## Scope

One unit. **Recommended model: sonnet** — a small, well-understood shell change
in one file, with an existing test suite and an established idiom to copy.

**Changes** — `.claude/skills/dispatch-propagate/scripts/dispatch-tick`, inside
the paused branch (`dispatch-tick:314-415`), before its `exit 0`:

Run the node-lane drain chain there, in this order:

1. `dispatch-graph-main-red-sync` to compute `OPEN_MAIN_RED`. **This is not
   optional.** At `dispatch-select-tick:467` that value is what gates the merge
   lane, and `dispatch-select-tick:497-499` records why: a node-lane merge must
   be suppressed both while main is broken and while main health is UNKNOWN,
   because a transient read failure must not defeat a load-bearing safety gate.
   Copying the merge call without the gate would merge into a red main.
2. `graph-auto-merge`, guarded by the same `[[ -z "$OPEN_MAIN_RED" ]]` condition
   used at `dispatch-select-tick:504`.
3. `reconcile-graph-merged`, unconditionally, matching
   `dispatch-select-tick:535`. Without it a PR merged on the paused branch is
   never absorbed to `done`/`main-qa`, leaving nodes merged-but-unreconciled —
   a worse state than not merging at all. The reconciler is the only sanctioned
   absorber; never hand-transition a merged node.

Use the paused branch's existing **conditional-source + verify + loud-failure**
idiom (see the `reservation_sweep` block at `dispatch-tick:316-334` and the four
sweeps after it): source the dependency only if the function is not already
defined, verify the load explicitly rather than absorbing failure with
`|| true`, and on a load failure log loudly to stderr and continue rather than
aborting the tick.

**Out of scope:**

- The **issue-lane** merge (`dispatch-auto-merge`, `dispatch-select-tick:487`).
  The issue lane is legacy; the graph lane is the live path. Note the same gap
  exists there and leave it — do not widen this unit.
- Any change to what the pause does about **spawning**. Selection, spawning, and
  reseed-arming must stay behind the pause. This unit adds draining only.
- Removing or relaxing the `OPEN_MAIN_RED` gate.
- The pace curve, `--manual` behaviour, and the sentinel's own location.
- Lifting the current pause. Resume is a separate, attended `/rsi` decision
  against the recorded criteria.

## Dependencies

None. This unit does not depend on #3052 landing, and #3052 does not depend on
this — they are the same incident from two directions.

## Reuse

- `dispatch-tick:316-334` — the `reservation_sweep` block. The exact
  conditional-source + verify + loud-failure idiom to copy, with the comment
  convention explaining why the call belongs on this branch.
- `dispatch-select-tick:467` — `OPEN_MAIN_RED=$("$SCRIPT_DIR/dispatch-graph-main-red-sync") || OPEN_MAIN_RED=UNKNOWN`.
  Reuse verbatim, including the `|| OPEN_MAIN_RED=UNKNOWN` fallback, which is
  what makes an unreadable main fail closed.
- `dispatch-select-tick:504-511` — the guarded `graph-auto-merge` call and its
  `merge: ` line-echo loop.
- `dispatch-select-tick:535` — the unconditional `reconcile-graph-merged` call,
  including its sandbox note (it needs `gh` TLS and the npm cache).
- `.claude/skills/dispatch-propagate/scripts/test-dispatch-tick.sh` — the
  existing suite; add cases alongside the current paused-branch tests rather
  than starting a new file.

## Verification

Add tests to the existing dispatch-tick suite covering:

1. With the sentinel present and main known-good, a paused tick invokes
   `graph-auto-merge` and `reconcile-graph-merged`, and still invokes **no**
   spawn and no `dispatch-select-tick`.
2. With the sentinel present and `OPEN_MAIN_RED` non-empty (main red), a paused
   tick does **not** invoke `graph-auto-merge` — the safety gate survives the
   move.
3. With the sentinel present and `dispatch-graph-main-red-sync` failing, the
   merge is suppressed (UNKNOWN fails closed).
4. The five existing paused-branch sweeps still run, in their current order.
5. A non-paused tick is unchanged — no double merge call from running both the
   paused-branch chain and `dispatch-select-tick`'s.

```verify
.claude/skills/dispatch-propagate/scripts/test-dispatch-tick.sh
```

```verify
.claude/skills/dispatch-propagate/scripts/run-lint.sh
```

Confirm the new suite actually runs in CI: shell suites outside
`dispatch-propagate/scripts` are not auto-discovered, and this one is inside it,
so `run-unit-tests.sh`'s glob covers it — but verify the step appears in the
run rather than trusting a green check.

Manual, after landing: with the sentinel in place, confirm a reviewed node-lane
PR merges on a heartbeat tick with no operator action, and that
`journalctl --user -t dispatch-tick` still logs
`paused (sentinel present at ...); no scheduling this tick`. Then re-measure
resume criterion 1.
