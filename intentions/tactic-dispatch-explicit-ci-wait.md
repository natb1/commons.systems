---
id: tactic-dispatch-explicit-ci-wait
kind: tactic
statement: make the explicit-node dispatch lane wait out in-flight CI up to the
  reservation TTL instead of skipping, leaving the autonomous and --manual paths
  unchanged
owner: ai
status: raw
parent: null
rationale: Surfaced by the 2026-07-29 /align-strategy interview confirming
  dispatch <node-id> semantics (strategy clarification 131). The explicit lane
  skips on pending CI at two surfaces (sensor_gate's ci-pending, provision exit
  10 ci-waiting), both of which assume a next tick that does not exist under the
  standing paused/manual-only operating mode, so the human hits a dead end and
  must re-run by hand.
reading: null
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
  reason: >-
    Requirement ambiguity blocking this tactic's central design decision,
    verified against

    origin/main 766a136f by the 2026-08-19 /align-tactics tactic-mode drift
    review.


    THE PROBLEM. This node's Scope carries the recorded rationale for its bound
    verbatim from

    strategy clarification 131 — "selection writes the reservation marker before
    the wait, so the

    wait holds a concurrency slot for its whole duration; one constant cannot
    drift from the

    other" — and that premise is FALSE at one of the two surfaces the node
    scopes.


    VERIFIED AT THE PROVISION-TIME SURFACE: the marker IS held.
    dispatch-select-tick's

    emit_graph_selection calls reservation_write with origin=explicit
    (dispatch-select-tick:264,

    origin stamped at :1117) and releases the selection lock before
    dispatch-graph-execute runs

    provision-node-worktree, whose exit 10 ci-waiting
    (provision-node-worktree:412-424) is

    therefore reached with a live claim already in the ledger.


    VERIFIED AT THE SELECTION-TIME SURFACE: no marker is held at all.
    graph-select-target's

    sensor_gate ci-pending skip (called at :1222, qa|review arm at :1136-1142)
    returns rc 1 and

    continues, so SELECTED_COUNT stays 0; graph-select-target's own
    reservation_write (:1258) is

    both downstream of that gate and guarded by [[ -n "$STANDALONE" ]], and the
    explicit lane

    invokes it WITHOUT --standalone (dispatch-select-tick:1114-1117); and
    emit_graph_selection

    returns 1 on an empty selection, so its reservation_write never executes.
    The lane falls

    straight to node-not-selectable (:1126-1133).


    ALSO VERIFIED — the two surfaces are LARGELY PHASE-DISJOINT, not redundant.
    sensor_gate

    CI-gates only its qa|review arm, while provision's exit-10 gate runs
    unconditionally on phase

    (provision-node-worktree:412-424 has no phase guard). So at implement / fix
    / align-tactics /

    main-qa, provision exit 10 is the ONLY surface; at qa|review, selection is
    the surface that

    normally fires and exit 10 is reached only on the intra-tick race where CI
    goes pending

    between selection and provision (the race
    tactic-autonomous-ci-pending-liveness-bound's design

    decision (d) records). Covering one surface therefore drops most of the
    other's phases, which

    makes this node's own "or establish and document which single surface"
    option a coverage

    reduction along phase lines rather than a de-duplication.


    AUTHOR DECISION OWED — three options, materially different, none an
    implementer's choice:


    (a) The selection-time wait writes a PROVISIONAL reservation claim before
    waiting, so the
        consequence clarification 131 explicitly accepted ("a manual dispatch can now hold a
        ledger slot for up to the TTL, which is exactly the ledger-consuming behavior the
        paused-scheduling condition requires") actually obtains. This is a new ledger write at a
        point that has none today; it needs rollback-on-timeout semantics (graph-select-target's
        STANDALONE_CLAIMED EXIT trap is the existing precedent), and getting it wrong leaks a slot
        per failed explicit dispatch — precisely the failure the origin=explicit stamp was added
        to prevent.

    (b) The selection-time wait BORROWS the TTL as a bare bound magnitude with
    no slot held —
        keeping clarification 131's constant while abandoning its stated reason and the
        paused-scheduling honoring it claimed.

    (c) The tactic NARROWS to the provision-time surface only, where the
    recorded rationale holds
        verbatim and no new concurrency semantics are introduced — accepting that qa|review, the
        phase pair this tactic was raised for, keeps dead-ending on node-not-selectable.

    RECORD-COMPLETENESS FRAMING (strategy clarification 31 / condition 7). The
    gap is in the

    record, not in this session's reading of it: strategy clarification 131
    states as settled fact

    a code property that does not hold at one of the two surfaces it names. The
    fix is an author

    /align pass on strategy-graph-native-dispatch that amends clarification 131
    with the chosen

    option above. This session is a per-node /align-tactics run and never edits
    the serving

    strategy, so the amendment is named here rather than written.


    THREE IMMATERIAL OBSERVATIONS, verified this round, also owed to that /align
    pass (none blocks

    the plan; recorded so they are not rediscovered):


    1. BOUND MAGNITUDE. The tree's other detached CI wait, dispatch-ladder-run,
    budgets
       CI_WAIT_S=3600 (dispatch-ladder-run:375) — six times the
       DISPATCH_RESERVATION_STANDALONE_TTL_S default of 600 (lib-reservation-ledger.sh:629). Real
       check durations here routinely exceed 600s, so at the default this wait will often reach
       its timeout fallback rather than its success path. Clarification 131 already records the
       disposition ("if real check durations exceed it the fix is raising that one constant rather
       than adding a second"), so no new decision is owed — but note raising it also lengthens how
       long a leaked origin=explicit marker occupies a slot under reservation_sweep rule (c-ttl).

    2. PAUSE MECHANISM. This node's rationale leans on the standing
    paused/manual-only operating
       mode. The MODE holds. Its MECHANISM differs from the strategy condition's 2026-07-26
       parenthetical: at HEAD lib-pause-state.sh still implements the file sentinel
       (DISPATCH_PAUSE_FLAG under $XDG_DATA_HOME/commons-dispatch/paused) and no dispatch.config/
       directory exists in the tree; the JSON-field replacement is tracked at
       tactic-dispatch-pause-config-field, phase implement. Immaterial here — the wait reads no
       pause state under either mechanism.

    3. PROGRESS OUTPUT AND DRIFTED ANCHORS. The Scope item "emit progress while
    waiting" must go
       to STDERR, never stdout: dispatch-tick captures the whole of dispatch-select-tick's stdout
       as the decision-line protocol (dispatch-tick:821), and dispatch-select-tick likewise
       captures graph-select-target's stdout (:1112-1116), so a progress line on stdout corrupts
       the protocol instead of reaching the terminal. Current anchors, since clarification 136's
       cites have drifted (the same drift clarification 209 documents): sensor_gate ci-pending is
       graph-select-target:1136-1142 (136 cites :628); provision exit 10 is
       provision-node-worktree:412-424 (cited :138). DISPATCH_RESERVATION_STANDALONE_TTL_S has
       exactly one read site, lib-reservation-ledger.sh:629, a function-local inside
       reservation_sweep — so this node's "the SAME constant, not a copy" requirement means
       reading the env var with the identical :-600 default and numeric guard, unless the plan
       adds a shared accessor.

    CORRECTED THIS ROUND (no decision owed): this node's rationale and ##
    Context cited "strategy

    clarification 132"; the entry they describe is at 1-indexed position 131.
    Both citations were

    fixed in the same commit that wrote this park.
  since: 2026-08-19
  recommendation: >-
    Run /align strategy-graph-native-dispatch and amend clarification 131 by
    picking (a), (b) or

    (c) from the park reason — that single choice unblocks this tactic
    completely. Option (c) is

    the cheapest to ship and the only one needing no new concurrency semantics,
    but it leaves

    qa|review — the phase pair this tactic was raised for — still dead-ending,
    so it is a real

    scope reduction rather than a shortcut. Option (a) is what clarification 131
    already reads as

    intending, and its cost is a new provisional ledger write needing
    rollback-on-timeout.

    Fold the three immaterial observations into the same /align pass while it is
    open.

    Then re-run /align-tactics tactic-dispatch-explicit-ci-wait; the drift
    review will clear and

    the plan phase will author the body against the chosen option. Nothing else
    is owed first —

    the two skip surfaces, the TTL read site and the sibling boundary against

    tactic-autonomous-ci-pending-liveness-bound were all verified this round and
    are recorded above.
  session_type: other
pace_exempt: false
rounds: null
attributes: {}
---
# make the explicit-node dispatch lane wait out in-flight CI up to the reservation TTL instead of skipping, leaving the autonomous and --manual paths unchanged

## Context

The explicit-node lane skips on in-flight CI at two surfaces:

1. **Selection-time** — `graph-select-target`'s `sensor_gate`, `qa|review` arm: `dispatch-ci-ready`
   exits 1 while checks are in progress, the gate returns skip reason `ci-pending`, and with `--node`
   set that is the only candidate, so the selector prints `empty` and `dispatch-select-tick` emits
   `node-not-selectable <id>` (exit 1 from `dispatch-tick`).
2. **Provision-time** — `provision-node-worktree` exit 10 (`ci-waiting`: a draft PR whose checks have
   not concluded), which `dispatch-graph-execute` reports as `waiting <id>` with the comment
   "Retry next tick".

Both assume a next tick. Under the standing paused/manual-only operating mode there is none, so the
human gets a dead end and must re-run by hand. Strategy clarification 131 (2026-07-29) adopts a
bounded wait on this lane only.

## Scope

- On the EXPLICIT-NODE lane only, poll the CI verdict until it concludes rather than skipping.
  The autonomous path and `--manual` keep skipping, byte-for-byte: `dispatch-tick` is also the
  systemd/heartbeat entry point and must never block.
- Bound the wait by `DISPATCH_RESERVATION_STANDALONE_TTL_S` (default 600s) — the SAME constant, read
  from the same place, not a copy and not a new constant. Rationale: selection writes the reservation
  marker before the wait, so the wait holds a concurrency slot for its whole duration; one constant
  cannot drift from the other.
- On timeout, fall back to today's behavior with a message naming the PR and how long it waited.
- Cover both surfaces above, or establish and document which single surface the wait belongs at.
- Emit progress while waiting so a foreground terminal is not silent.

Out of scope: changing check durations, changing the TTL's default, or waiting on anything other
than a CI verdict (a merge conflict routes to `/dispatch-conflict` Lane 3 and is not a wait case).

## Dependencies

None hard. Note the overlap with `tactic-dispatch-explicit-critical-path-walk`: both touch the
explicit-node lane in `dispatch-select-tick` / `graph-select-target`, so whichever lands second
should expect a merge in that region.

## Reuse

- `dispatch-ci-ready` — the existing CI verdict primitive
- `dispatch_ci_verdict_rest` / `gh_pr_view_rest` — `lib.sh`
- `DISPATCH_RESERVATION_STANDALONE_TTL_S` and `reservation_sweep` — `lib-reservation-ledger.sh`

## Verification

Unit-test the wait loop against a stubbed verdict source (concludes green, concludes red, never
concludes → timeout). Assert the autonomous and `--manual` paths do not wait. Manual: run
`dispatch <id>` against a node whose PR has checks in flight and confirm it waits, then dispatches.


## Author ruling, 2026-08-29 — clarification 131 amended to option (a)

**Ruled (author, 2026-08-29 batch-execution sitting; recorded in
`plans/dispatch-rsi-author-rulings.md` §"Ruling 3", and landed as an amendment on
`strategy-graph-native-dispatch` clarification 131).**

**OPTION (a) — MAKE THE PREMISE TRUE.** The selection-time wait writes a
**provisional reservation claim before it waits**, so both surfaces genuinely hold
a concurrency slot and the Scope bullet's rationale above becomes true rather than
being narrowed away. This accepts the cost of a new ledger write at a point that
has none today, needing rollback-on-timeout semantics; model it on
`graph-select-target`'s `STANDALONE_CLAIMED` EXIT trap. Getting it wrong leaks a
slot per failed explicit dispatch — the failure the `origin=explicit` stamp exists
to prevent.

**Rejected: option (c), narrowing this tactic to the provision-time surface only.**
Cheaper, and it needed no new concurrency semantics, but it left the `qa|review`
phase pair — the very pair this tactic was raised for — still dead-ending on
`node-not-selectable`. Also rejected: option (b), borrowing the TTL as a bare bound
magnitude with no slot held.

**This node's central design decision is therefore settled and it is plannable.**
Scope item "Cover both surfaces above, or establish and document which single
surface the wait belongs at" resolves to **both surfaces**, with the selection-time
one taking a provisional reservation.

### Three immaterial observations, retained from the 2026-08-19 park

None blocks the plan; recorded here so they are not rediscovered when the park
clears and the field is destroyed.

1. **Bound magnitude.** The tree's other detached CI wait, `dispatch-ladder-run`,
   budgets `CI_WAIT_S=3600` at
   `.claude/skills/dispatch-ladder/scripts/dispatch-ladder-run:375` — six times
   the `DISPATCH_RESERVATION_STANDALONE_TTL_S` default of 600
   (`lib-reservation-ledger.sh:629`). (The park cited the script bare; it lives
   under the `dispatch-ladder` skill, not `dispatch-propagate`. Re-anchored
   2026-08-30; the line number is unchanged.) Real check durations here routinely
   exceed 600s, so at the default this wait will often reach its timeout fallback
   rather than its success path. Clarification 131 already records the disposition
   ("if real check durations exceed it the fix is raising that one constant rather
   than adding a second"), so no new decision is owed — but raising it also
   lengthens how long a leaked `origin=explicit` marker occupies a slot under
   `reservation_sweep` rule (c-ttl).
2. **Pause mechanism.** This node's rationale leans on the standing
   paused/manual-only operating mode. The **mode** holds; its **mechanism** differs
   from the strategy condition's 2026-07-26 parenthetical — at HEAD
   `lib-pause-state.sh` still implements the file sentinel (`DISPATCH_PAUSE_FLAG`
   under `$XDG_DATA_HOME/commons-dispatch/paused`), and the JSON-field replacement
   is tracked at `tactic-dispatch-pause-config-field`, `phase: implement`.
   Immaterial here — the wait reads no pause state under either mechanism.
3. **Progress output and drifted anchors.** The Scope item "emit progress while
   waiting" must go to **STDERR, never stdout**: `dispatch-tick` captures the whole
   of `dispatch-select-tick`'s stdout as the decision-line protocol (the three
   `SEL_OUT=$(...)` capture sites at `dispatch-tick:877-881`), and
   `dispatch-select-tick` likewise captures `graph-select-target`'s stdout (the
   `GRAPH_OUT=$(...)` captures at `dispatch-select-tick:1215-1216` and
   `:1221-1222`), so a progress line on stdout corrupts the protocol instead of
   reaching the terminal. (The park's `dispatch-tick:821` and
   `dispatch-select-tick:1112-1116` no longer resolve; re-measured 2026-08-30.)
   Current anchors: `sensor_gate` ci-pending is `graph-select-target:1136-1142`
   (clarification 136 cites `:628`); provision exit 10 is
   `provision-node-worktree:412-424` (cited `:138`).
   `DISPATCH_RESERVATION_STANDALONE_TTL_S` has exactly one read site,
   `lib-reservation-ledger.sh:629`, a function-local inside `reservation_sweep` —
   so this node's "the SAME constant, not a copy" requirement means reading the env
   var with the identical `:-600` default and numeric guard, unless the plan adds a
   shared accessor.
