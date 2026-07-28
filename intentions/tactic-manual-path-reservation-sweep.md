---
id: tactic-manual-path-reservation-sweep
kind: tactic
statement: reconcile the reservation ledger (reservation_sweep) in
  dispatch-select-tick's --manual fan-out block before reading
  reservation_count, so paused+manual dispatch never sees phantom live=N from
  dead-session orphans
owner: ai
status: codified
parent: null
rationale: Immediate parity fix (migration step i) for the 2026-07-23 cross-mode
  ledger-validity clarification on strategy-graph-native-dispatch. In the
  standing paused+manual operating mode the manual fan-out path is the ledger's
  only live consumer, and it deliberately skips reservation_sweep — so
  dead-session orphans accumulate unboundedly, inflating live=N and throttling
  or zeroing manual fan-out (the phantom-worker incident, 2026-07-23). Reverses
  the 'manual is safe, only pacing' aside in
  tactic-explicit-node-reservation-sweep-policy for the paused+manual mode it
  did not consider. Boosted top-of-normal + finalized this round per author
  direction.
reading: null
gap: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention:
  boost: 90
  override: null
  rationale: "Author-directed 2026-07-23 /align-strategy round: the
    reservation-ledger cross-mode-validity fix ranks at the top of normal
    (non-main-health) work — below the strategy-main-health emergency ceiling
    (boost 100), which the 2026-07-13 write-path guard keeps dominant. Own-boost
    90 composes below 100, tripping no guard, while topping the ~11-max normal
    field."
phase: qa
execution:
  branch: tactic-manual-path-reservation-sweep
  pr: 2964
  attempts: {}
  markers:
    - planned
  strategy_fingerprint: null
  fix: null
  completion: null
validates: []
blocked_by: []
office_hours:
  reason: "/qa-fix: planner scope-deviation on opus-fixable residue — PR body's
    stale test-suite count (body 3046/3046, tree 3183/3183) can only be fixed by
    editing PR #2964's GitHub description text, which is outside the auto-fix
    lane's working-tree scope; a permanent escalation, not attempt-cap
    exhaustion"
  since: 2026-07-28
  recommendation: |-
    ## Recommendation — PR #2964 office-hours park

    **Take option 1 now, option 2 as the durable fix. Skip option 3.**

    The code change is correct and the suite is green. The only thing standing between
    this PR and merge is one line of prose in its GitHub description. Fix it by hand,
    then remove the class of finding rather than building a new write path for it.

    ### Why not option 3

    Giving the qa-fix auto-fix lane a `gh pr edit` step would hand an autonomous lane
    an untracked, un-reviewed write channel (PR description text lands with no diff,
    no CI, no review) to serve exactly one recurring finding — and that finding only
    exists because triage asks for an unstable assertion in the first place. Fixing
    the input is cheaper and smaller than fixing the pipeline. The `/implement-unit`
    boundary — "auto-fixes land as working-tree commits" — is a good boundary; the
    scope-deviation escape did the right thing by refusing.

    ### Step 1 — unblock #2964 (do this regardless)

    The count in the body is unstable by construction: `test-dispatch-scripts.sh` is a
    shared file that grows from unrelated concurrent PRs, so any number written there
    is stale within days. Drop the number instead of refreshing it — refreshing just
    restarts the clock.

    From the worktree, with `dangerouslyDisableSandbox: true` on every `gh` call:

    ```bash
    cd /home/n8/natb1/commons.systems/.claude/worktrees/tactic-manual-path-reservation-sweep
    gh pr view 2964 --json body --jq .body > tmp/pr-2964-body.md
    ```

    Then edit the last line of `tmp/pr-2964-body.md`, replacing:

    ```
    - `.claude/skills/dispatch-propagate/scripts/test-dispatch-scripts.sh` — 3046/3046 passed.
    ```

    with:

    ```
    - `.claude/skills/dispatch-propagate/scripts/test-dispatch-scripts.sh` — full suite passes (exit 0).
    ```

    Apply and confirm no count survives:

    ```bash
    gh pr edit 2964 --body-file tmp/pr-2964-body.md
    gh pr view 2964 --json body --jq .body | grep -n 'passed'
    ```

    The `grep` should show only the countless line. Nothing else in the body changes —
    the Problem and Change sections are accurate and there are no `Closes` lines to
    disturb (this is a graph-node-lane PR).

    ### Step 2 — clear the park and let qa re-run

    The node stays at phase `qa`; clearing the park just returns it to the qa lane,
    where a fresh pass finds no count to compare and the residue item is gone for good.
    Run the **worktree-local** script and pass `-C` explicitly — running the copy from
    another checkout, or omitting `-C`, exits 0 while committing nothing:

    ```bash
    packages/intentionsutil/scripts/clear-park \
      tactic-manual-path-reservation-sweep \
      "PR body test-count assertion removed by hand; residue item no longer applies"
    ```

    Verify it actually landed before walking away:

    ```bash
    git fetch origin main
    git show origin/main:intentions/tactic-manual-path-reservation-sweep.md | grep -n 'office_hours'
    ```

    The unrelated `## needs-main residue` item 16 (multi-day live=N confirmation) stays
    as-is — it is a planned deferral, not part of this escalation, and should ride the
    normal main-qa path after merge.

    ### Step 3 — kill the class (the actual fix)

    Two small edits, both worth recording as one tactic node rather than doing ad hoc:

    1. **Triage may not ask for it.** In
       `.claude/skills/qa-fix/references/triage-subagent.md`, add a classification
       constraint: an item is only `script-verifiable` when its remediation lands in a
       tracked file. A finding whose only fix is editing PR description text, labels,
       or other GitHub-side metadata classifies as `needs-human-judgment`. This stops
       the Opus fix-planner from being handed work it is structurally unable to do,
       and converts three wasted qa-fix passes into one clean escalation on the first
       pass.

    2. **The convention that produced the bad assertion.** PR-body `## Verification`
       sections are free prose written at implement time
       (`.claude/skills/implement/SKILL.md`, Step 4 "Open the draft PR", ~line 377) —
       nothing mandates the count, a session just chose one. Add a line there: cite the
       suite and its exit status, never an assertion count, for suites in shared files
       that unrelated PRs extend. Note that the tactic node's own ` ```verify ` block
       already gets this right — `intentions/tactic-manual-path-reservation-sweep.md`
       line 114 runs the script bare with no count — so the plan schema is fine and only
       the PR-body prose convention needs the guardrail.

    ### Cost of doing nothing

    Every future PR that writes an exact suite count into its body against a shared
    growing test file will burn its full qa-fix attempt budget and land in this same
    queue. Step 3 costs one small PR; skipping it costs a recurring office-hours item.
  session_type: other
pace_exempt: false
rounds: null
attributes: {}
---

# reconcile the reservation ledger before the --manual fan-out count

## Context

In `dispatch-select-tick`'s `--manual` fan-out block, `LIVE_COUNT = BUSY + RESV`
where `RESV=$(reservation_count)`. The block already sources
`lib-claude-agents.sh` and `lib-reservation-ledger.sh`, but deliberately does
**not** call `reservation_sweep` first — the comment reads: "the manual path does
NOT sweep the reservation ledger (a possibly-stale count can only make manual
fan-out more conservative, which is safe)."

That reasoning is false in the standing **paused + manual-only** operating mode.
While the pause sentinel (`$XDG_DATA_HOME/commons-dispatch/paused`) is set, the
autonomous heartbeat exits before selection and never sweeps (see sibling
`tactic-heartbeat-sweep-before-pause`), so the manual tick is the **only** live
consumer of the ledger. Dead-session orphan markers then accumulate unboundedly,
inflating `live=N` (phantom workers) and throttling — or zeroing — manual
fan-out. This is the phantom-worker incident diagnosed 2026-07-23
(`router: manual fan-out: SPAWN_N=1 ... live=10` with no live workers).

Per the 2026-07-23 cross-mode ledger-validity clarification on
`strategy-graph-native-dispatch` (the pause sentinel gates *spawning*, never
*bookkeeping*), the manual path must reconcile the ledger before reading it.
This reverses, for the paused+manual mode, the "manual need not sweep — only
pacing, never a hard refusal" aside recorded in
`tactic-explicit-node-reservation-sweep-policy` (PR #2952): that aside addressed
the explicit-node hard-refusal path and did not consider paused+manual reaper
dormancy. PR #2952's own NODE_ARG-branch deliverable is unaffected.

## Units of work

### Unit 1 — sweep before the manual count

**Recommended model:** sonnet — a one-line shell insertion mirroring an existing
sibling call; no architectural judgment.

**Scope:** `.claude/skills/dispatch-propagate/scripts/dispatch-select-tick`, the
`--manual` fan-out block (locate by the comment "the manual path does NOT sweep
the reservation ledger"). The block already `source`s `lib-claude-agents.sh`
and `lib-reservation-ledger.sh`. Immediately **before** `RESV=$(reservation_count)`,
add:

```bash
reservation_sweep 1>&2 || true
```

and update the adjacent comment to say the manual path now reconciles the ledger
first (cross-mode validity, `strategy-graph-native-dispatch` 2026-07-23), citing
the paused+manual dormancy reason. `|| true` keeps it best-effort — a sweep
failure must never fail the tick. This mirrors the autonomous block's own
best-effort `reservation_sweep 1>&2 || true` call.

**Out of scope:** the `NODE_ARG` explicit-node branch (owned by
`tactic-explicit-node-reservation-sweep-policy`, PR #2952) and the autonomous
branch (already sweeps).

## Verification

```verify
.claude/skills/dispatch-propagate/scripts/test-dispatch-scripts.sh
```

### Unit 2 — test coverage

**Recommended model:** sonnet — mechanical test addition following the existing
`rl_setup` stale-marker pattern and the `sel_tick` manual-fan-out group.

**Scope:** `.claude/skills/dispatch-propagate/scripts/test-dispatch-scripts.sh`,
the `sel_tick` manual-fan-out test group. Add a test that plants a stale
dead-session reservation marker (a `session=` absent from `sel_tick_setup`'s fake
`claude_agents_list_all`, with `DISPATCH_RESERVATION_NOW` past the 30s boot
grace), runs a `--manual` tick, and asserts: (a) the reported `RESV`/`live` count
excludes the stale marker (the sweep ran), and (b) the marker file under
`$DISPATCH_RESERVATION_DIR` is gone afterward (the reclaim happened).

**Reuse:** `reservation_write` / `reservation_exists` / `reservation_sweep`
(`lib-reservation-ledger.sh`); `sel_tick_setup`'s `DISPATCH_RESERVATION_DIR` +
fake-agents wiring; the `rl_setup` group's dead-session-sweep test as the
reclaimable-marker reference.

**Dependencies:** Unit 1.
