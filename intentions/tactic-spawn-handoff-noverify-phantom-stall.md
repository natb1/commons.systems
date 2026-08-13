---
id: tactic-spawn-handoff-noverify-phantom-stall
kind: tactic
statement: "The spawn-handoff reservation
  (tactic-router-spawn-window-duplicate-worker) holds a budget slot for the full
  DISPATCH_RESERVATION_HANDOFF_TTL_S (300s) on the sole evidence that
  dispatch-spawn-job --no-verify returned 0 -- a flag that explicitly skips
  registration verification -- so any condition that makes `claude --bg` exit 0
  without a session ever registering (auto-mode classifier denial, bg-supervisor
  parenting failure, stale daemon version, OOM during boot) converts each launch
  attempt into a 300s reservation with zero work performed, and a fleet with
  enough such nodes can pin LIVE_COUNT >= TARGET_N and hard-stop every
  subsequent tick at concurrency-cap: a self-sustaining stall driven purely by
  phantom claims; and symmetrically, the same post-spawn registration probe
  false-negatives in the opposite direction -- returning rc=1 while the session
  is in fact live -- so the node owns making that probe correct, not choosing
  which way it may be wrong"
owner: ai
status: raw
parent: null
rationale: "Widened 2026-08-05 by the bootstrap monitor pass to own BOTH
  directions of the same unreliable boot-window probe, because they are one
  defect in the post-spawn registration check and splitting them would leave
  each half looking like an isolated flake. Direction A (the original statement
  above): dispatch-spawn-job --no-verify returns 0 and NO session ever
  registers, so a phantom reservation holds a budget slot for the full 300s TTL.
  Direction B (Finding 11, measured repeatedly across this session): the
  post-spawn registration poll FALSE-NEGATIVES -- it returns rc=1, reporting
  that no session registered, while the session is in fact live and working.
  Direction B is why --no-verify is passed as standing practice in the bootstrap
  spawn recipe, which in turn is what exposes Direction A: the workaround for
  the false negative disables the only check that would have caught the phantom.
  Any fix must therefore make the probe correct rather than choosing which way
  it is allowed to be wrong -- a fix that only hardens the reservation side
  leaves operators still passing --no-verify to dodge B, and a fix that only
  corrects B leaves every existing --no-verify caller unguarded."
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
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# The spawn-handoff reservation (tactic-router-spawn-window-duplicate-worker) holds a budget slot for the full DISPATCH_RESERVATION_HANDOFF_TTL_S (300s) on the sole evidence that dispatch-spawn-job --no-verify returned 0 -- a flag that explicitly skips registration verification -- so any condition that makes `claude --bg` exit 0 without a session ever registering (auto-mode classifier denial, bg-supervisor parenting failure, stale daemon version, OOM during boot) converts each launch attempt into a 300s reservation with zero work performed, and a fleet with enough such nodes can pin LIVE_COUNT >= TARGET_N and hard-stop every subsequent tick at concurrency-cap: a self-sustaining stall driven purely by phantom claims

## Provenance

- **Location**: `.claude/skills/dispatch-propagate/scripts/lib-reservation-ledger.sh:609`
- **Source**: `/review-fix` red-team finder (`red-team-2`), PR review pass
- **Adversarial verdict**: Deferred — classified `Deferred` at review-fix classify stage (not sent to adversarial verify; the `security_class` of `required` combined with `Deferred` bucket means the classifier judged this real but out of scope for the landing PR, not a false positive)
- **Source PR**: #2995 (`tactic-router-spawn-window-duplicate-worker`, the PR that landed the spawn-handoff fix this finding is about)

## Finding detail

The handoff makes every successful spawn kick hold a budget slot for a full
`DISPATCH_RESERVATION_HANDOFF_TTL_S` (300s), and the only evidence a worker
exists is that `dispatch-spawn-job --no-verify` returned 0 — a flag that, per
`dispatch-spawn-job:29` and `:78`, explicitly SKIPS the registration verify, so
the kick's exit code is the sole signal.

Phantom-spawn stall scenario: any condition that makes `claude --bg` exit 0
without a session ever registering — an auto-mode classifier denial of the
spawned prompt, a bg-supervisor parenting failure, a stale daemon version, an
OOM during boot — now converts each launch attempt into a 300s reservation
with zero work performed. Rule (a) never fires (no worker of that name ever
registers), so the slot is held the full TTL, then reclaimed, then the same
node is re-selected, re-kicked, and re-held for another 300s, indefinitely.
With `TARGET_N` such nodes the ledger alone pins `LIVE_COUNT >= TARGET_N` and
`dispatch-select-tick:645-651` hard-stops every subsequent tick at
`concurrency-cap` — a self-sustaining fleet stall driven purely by phantom
claims.

Before this change the marker was cleared on the kick, so a phantom spawn cost
nothing and other nodes stayed dispatchable; the change converts a harmless
failure into a budget-consuming one.

**Recommended fix**: Do not let an unverified kick hold a budget slot for the
full TTL. Either drop `--no-verify` on the graph spawn sites so
`verify_agent_registered_under` confirms the session before
`reservation_mark_spawned` stamps the handoff, or record the spawned job id in
the marker and have rule (a-handoff) reclaim as soon as the job is definitively
absent from `claude agents --json --all` (the `claude_session_id_is_live` /
`claude_job_id_for_name_all` primitives already exist), falling back to the
TTL only on an UNKNOWN registry.

## Partially addressed 2026-08-13 — PR #3073, merge `3fea9f35`. NODE STAYS OPEN.

PR #3073 fixed **the `/dispatch-ladder` lane only**. Both directions remain
open on every other spawn path, which is why this node is re-scoped rather
than closed.

**What landed.** `dispatch-ladder-advance` (branch commit `4a4be10d`) now
verifies, after `dispatch-graph-execute` reports a launch, that a session
named `$NODE_ID` actually registered with the daemon
(`dispatch-ladder-advance:278-395`). On a miss it releases the reservation and
throws with a named diagnostic that enumerates the known exit-0-without-a-
session causes. Direction B — the probe false-negativing under load — is
handled by widening `LIB_CLAUDE_AGENTS_VERIFY_INTERVAL_S` to 3s through the
library's existing seam (≈12s per candidate cwd, two candidates tried
sequentially, worst case ≈24s, comfortably inside
`dispatch-ladder-await`'s 90s `BOOT_GRACE_S`). A second unit (`13f60b5b`) made
the claim read fail-safe: an unreadable registry never drops a claim.

**The scope note in the shipped code is explicit**: *"The tick's own
`--no-verify` path is untouched"* (`dispatch-ladder-advance:289`).

## Remaining scope

1. **The tick's budget path.** `dispatch-graph-execute` still spawns through
   `dispatch-spawn-job --no-verify`, and `reservation_mark_spawned`
   (`lib-reservation-ledger.sh:609`) still stamps a handoff on the sole
   evidence of exit 0. Every phantom-stall mechanism in the statement above is
   live for the tick — the fleet-scale case, where enough phantoms pin
   `LIVE_COUNT >= TARGET_N` and hard-stop every subsequent tick at
   concurrency-cap.
2. **Probe correctness itself.** The ladder lane widened a *timeout*; it did
   not make the registration probe correct. Direction B is worked around, not
   fixed, and the workaround does not generalize — the tick cannot afford
   ≈24s of sequential polling per spawn, which is precisely why it passes
   `--no-verify` in the first place.

The original framing still holds and should not be split: any real fix must
make the probe correct rather than choose which way it is allowed to be wrong.
The ladder lane is evidence that the verify-side fix works when its cost is
affordable; it says nothing about the budget path, which is the harder half.
