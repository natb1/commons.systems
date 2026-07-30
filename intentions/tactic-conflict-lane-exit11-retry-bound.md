---
id: tactic-conflict-lane-exit11-retry-bound
kind: tactic
statement: "Bound the exit-11 conflict-lane kicks: an ineffective Lane 3
  dispatch-conflict session must still reach a tracked hold, not accumulate
  unbounded live-session claims"
owner: ai
status: raw
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
attention:
  boost: 20
  override: null
  rationale: "Bootstrap re-scale 2026-07-30: Waves B-D of a three-band interim
    scale (50 / 20 / 10) - dispatch-containment and evidence-custody work that
    follows the Wave-A write-path fixes. Interim scaffolding only;
    tactic-attention-tier-ranking and tactic-attention-boost-scripts retire this
    numeric scheme."
phase: null
execution: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Bound the exit-11 conflict-lane kicks: an ineffective Lane 3 dispatch-conflict session must still reach a tracked hold, not accumulate unbounded live-session claims

## Provenance

- **Source:** review-fix pass on PR #2977 (`tactic-dispatch-conflict-branch-merge-lane`), finding `residue-3` (code-review lane residue).
- **Location:** `.claude/skills/dispatch-propagate/scripts/dispatch-graph-execute:248` (the case-11 branch).
- **Failure scenario:** `dispatch-graph-execute` case 11 now spawns a `/dispatch-conflict` Lane 3 session on every provision exit 11 and returns `conflict-lane`. The `CONFLICT_STRIKE_CAP=5` strike-then-hold ladder that used to bound this state now runs only when the spawn itself fails — a lane that launches but never resolves (the session dies on an API error, exhausts context, or exits without declaring a terminal disposition) is not counted anywhere. Before PR #2977 this state was bounded and escalated to a `hold-node` tracked hold; that bound no longer applies to a launched-but-stuck lane. What actually happens to such a session is not yet observed: `.claude/hooks/dispatch-stop.sh` discriminator 2 hands an unmarked-terminal session to `dispatch-self-close --node <id>`, which HOLDS the job alive — a held job stays live in `claude agents --json`, and `graph-select-target`'s `worktree_has_live_session` check is name-keyed on the node id, so this could read as a permanently stuck live-session slot with the node unselectable, rather than a per-tick respawn. Needs production observation to confirm which occurs before a fix is designed.
- **Adversarial verdict:** not independently verified by an adversarial skeptic — filed directly as an out-of-scope deferred finding (bucket `Deferred`, source `code-review`); out-of-contract for PR #2977, whose plan explicitly settled "route to the lane before striking" and "do not extend the strike logic."
- **Recommended fix:** N consecutive exit-11 ticks on one node must reach a tracked hold regardless of whether the lane launched, with the counter reset on provision exit 0 (as the exit-0 path already does) — reuse the existing `.claude/worktrees/<id>.conflict-strikes` sidecar or add a sibling. First confirm via production observation whether an unresolved Lane 3 session actually HOLDS (stuck live-session slot) or respawns per tick, since the fix shape differs. Note: `tactic-graph-router-conflict-routing` is expected to replace this whole branch with an `execution.conflict` interrupt — land the cap wherever that interrupt will enforce it rather than deepening the interim ladder.
- **Source PR:** #2977
