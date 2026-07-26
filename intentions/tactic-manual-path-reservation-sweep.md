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
validates: []
blocked_by: []
office_hours:
  reason: "/qa-fix: opus-fixable residue (PR #2964 Verification section states a
    stale test-suite total: 3042/3042, tree reports 3046/3046) found, but the
    qa-fix attempt cap was already reached (ATTEMPT_N=2, CAP=2) by the attempt-1
    fixing pass; escalating to office-hours for a manual PR-description
    correction"
  since: 2026-07-25
  recommendation: >-
    ## Recommended next steps — `tactic-manual-path-reservation-sweep` (PR
    #2964)


    **Bottom line: one administrative edit to the PR description unblocks this.
    No code change, no re-QA.**


    ### 1. The fix (one line, in the PR body — not the tree)


    PR #2964's `## Verification` section (line 35 of the body) currently reads:


    ```

    - `.claude/skills/dispatch-propagate/scripts/test-dispatch-scripts.sh` —
    3042/3042 passed.

    ```


    It must read:


    ```

    - `.claude/skills/dispatch-propagate/scripts/test-dispatch-scripts.sh` —
    3046/3046 passed.

    ```


    The count went stale when the attempt-1 qa-fix pass landed the
    `manual-orphan-saturated` regression test in
    `.claude/skills/dispatch-propagate/scripts/test-dispatch-scripts.sh` — 4 new
    assertions, 3042 → 3046 — without refreshing the PR body. Apply with `gh pr
    edit 2964 --body-file <file>` (fetch the current body first via `gh pr view
    2964 --json body --jq .body`, edit only that one number, write it back). Per
    the sandbox rule, run every `gh` call with `dangerouslyDisableSandbox:
    true`.


    Optional 30-second confirmation before editing: run
    `.claude/skills/dispatch-propagate/scripts/test-dispatch-scripts.sh` and
    read the trailing total. It should print `3046/3046 passed`. If it prints
    anything else, the number to write is whatever the suite actually reports —
    do not hand-copy 3046.


    ### 2. This is administrative only


    There is no code defect. The suite is genuinely green at 3046/3046; only the
    *stated* total in the PR description drifted. Nothing in
    `dispatch-select-tick` or `test-dispatch-scripts.sh` needs to change, and no
    re-QA is required beyond confirming the corrected number matches a real
    suite run. Do not re-run the full QA pass for this.


    ### 3. The rest of the qa-fix chain is clean for this node


    - **Item 11** (proportionality of the ~30 lines of comments across the two
    overlapping sweep tests, and whether the saturated-ledger test subsumes the
    single-marker test) was triaged in attempt 2 and resolved as
    **already-satisfied** — the two tests assert genuinely distinct
    discriminators, and comment density matches the file's house style (~18%
    comment lines file-wide). No action.

    - **Attempts 0 and 1** were re-verified intact in attempt 2, including a
    live mutation test (deleting the `--manual` block's `reservation_sweep` call
    made both sweep-regression tests fail, then restored cleanly). No action.

    - **Item 16** (the `## needs-main residue` section on the node body —
    multi-day real-world confirmation that phantom `live=N` no longer inflates
    on the manual path) is a **planned deferral**, already correctly recorded
    and well-formed. It routes the merged tactic to `main-qa` post-merge. It is
    **not** what this park is about and must not be treated as blocking; leave
    the section untouched.


    So once the description number is corrected, this node has no outstanding qa
    residue.


    ### 4. Why qa-fix can't do this itself — and how to resume


    `ATTEMPT_N` is at `CAP=2` for the qa-fix auto-fix budget. Both attempts were
    spent on *different* items (attempt 0: the `--manual` block rationale
    comment; attempt 1: the `manual-orphan-saturated` coverage gap). The budget
    is exhausted, so qa-fix will not auto-run a third fixing pass for this
    trivially mechanical item — hence the park. It will not resolve itself; a
    human or office-hours session must act.


    Resume sequence:


    1. Edit the PR body as in step 1 above.

    2. Clear the `office_hours` park on `tactic-manual-path-reservation-sweep`.
    Do this from a worktree whose `HEAD == origin/main` —
    `park-node`/`transition-node` read the local checkout, and a stale worktree
    will silently revert the park state or clobber newer `origin/main` content.

    3. Let the chain proceed `qa` → `review` → merge. Post-merge it lands in
    `main-qa` on item 16, as already planned.


    Nothing here requires a new commit to the branch, so no CI re-run is
    triggered by the fix itself.
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
