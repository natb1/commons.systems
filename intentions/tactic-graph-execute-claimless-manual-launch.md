---
id: tactic-graph-execute-claimless-manual-launch
kind: tactic
statement: dispatch-graph-execute performs its own claimed-set check and refuses
  to launch a node already covered by it, so a direct launch that never went
  through the selector is claim-safe without selecting
owner: ai
status: raw
parent: null
rationale: "The PREVENTION half of the 2026-08-05 /align concurrent-session
  interview (detection is tactic-fleet-watch-duplicate-session-predicate;
  resolution is tactic-duplicate-session-mechanical-resolution). The whole
  double-dispatch guard lives in the SELECTOR: graph-select-target:787-800 skips
  a node when reservation_exists holds, folding worktree_has_live_session in as
  fail-safe and naming WHY via worktree_occupancy_state (free / live-session /
  terminal / reserved). dispatch-graph-execute has NO occupancy check — its only
  mention of worktree_has_live_session is a comment at :298. It merely hands off
  a claim it assumes its caller already holds (hand_off_reservation /
  reservation_mark_spawned at :150-161) and clears one outright on
  stale-selection (12) and scope-stale (13) at :392 and :408. A caller that
  never selected holds no claim, so the handoff re-stamps nothing and the guard
  is structurally absent in BOTH race directions. OBSERVED LIVE
  2026-08-05T22:31Z: a park-clearing drain cleared a node's office_hours — which
  is exactly what makes it tick-selectable — dispatch-tick reconciled and
  launched it at 22:31:25Z, and the drain's own direct dispatch-graph-execute
  launched a second /qa-main into the SAME worktree at 22:31:34Z; the author
  stopped one by hand. DISTINCT FROM two adjacent tactics, both done:
  tactic-router-spawn-window-duplicate-worker (#2995) makes an EXISTING claim
  survive the boot window and does not create one for a claimless caller;
  tactic-graph-router-live-worker-visibility (#2918) added graph-select-target
  --standalone so a manual tick is concurrency-safe. THE PACE QUESTION IS
  SETTLED and no longer blocks this: --standalone is deliberately
  pace-ceiling-gated (:91-92, and 'standalone selection is paced to zero' at
  :391) and dispatch-target-workers returns 0 on the weekly curve, so the
  claim-safe and bootstrap-exempt routes were disjoint. The 2026-08-05 interview
  ruled that the ceiling GOVERNS for every unattended caller and that the gap
  closes from this side instead — this refusal makes a direct launch claim-safe
  without selecting, so no pace bypass is added. Shape: mirror the selector's
  claimed-set decision in the per-spec loop (the `for spec in \"$@\"` at :163)
  before provisioning, refusing with a distinct non-launch disposition alongside
  the existing `waiting <id>` / stale-selection / scope-stale lines rather than
  launching. Defence-in-depth for every caller, including the selector's own."
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
# dispatch-graph-execute must itself refuse to launch a node already covered by the claimed set, and a bootstrap-exempt manual launch must have a claim-safe route
