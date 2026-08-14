---
id: tactic-rsi-session-sweep-trigger
kind: tactic
statement: Replace the ladder-only phase-boundary spawn with a lane-agnostic
  sweep over ended sessions' dispatch-stamp sidecars, so /rsi fires for phase
  and unattended-intervention sessions on BOTH drivers and is scoped to the
  exact session id
owner: ai
status: raw
parent: null
rationale: "Drafted by the 2026-08-14 /align round, carrying that round's
  amendment to the every-run evaluation condition and the trigger-surface
  condition recorded with it. Cross-cutting serves is honest, not nearest-fit:
  the EVALUATION CONTRACT is owned by strategy-recursive-self-improvement, while
  the ARTIFACTS — dispatch-ladder-run, dispatch-tick, dispatch-graph-execute and
  the /rsi skill body — are dispatch-surface artifacts owned by
  strategy-graph-native-dispatch. Same split, and same reasoning, as
  tactic-ladder-per-phase-evaluation."
reading: null
serves:
  - strategy-recursive-self-improvement
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
# Replace the ladder-only phase-boundary spawn with a lane-agnostic sweep over ended sessions' dispatch-stamp sidecars, so /rsi fires for phase and unattended-intervention sessions on BOTH drivers and is scoped to the exact session id

# Replace the ladder-only phase-boundary spawn with a lane-agnostic sweep over ended sessions' dispatch-stamp sidecars, so /rsi fires for phase and unattended-intervention sessions on BOTH drivers and is scoped to the exact session id

Drafted by the 2026-08-14 `/align` round. Read the trigger-surface condition and the
"Which trigger surface fires /rsi" clarification on `strategy-recursive-self-improvement`
at `origin/main` for the reasoning this node executes; they are authoritative and this is
their mechanism.

## The problem this exists to fix

The two dispatch drivers are structurally asymmetric. `dispatch-ladder-run`'s
`spawn_phase_eval()` fires `/rsi` at each `awaited` event — an explicit phase boundary. The
scheduled tick has no such event: `dispatch-graph-execute` spawns a worker and exits, and only
the FOLLOWING tick observes a changed node phase. So there is nowhere in the tick that
corresponds to "a phase just finished", and keying the trigger on driver control flow forces
two detectors that will drift apart.

## The shape

One detector, keyed on the session rather than the driver: sweep sessions that have ended, have
a `<stem>.dispatch-stamp.json` sidecar (written at session birth by the `SessionStart` hook,
carrying `node_id` — the same sidecar `aggregate-usage.sh --node` already matches on), and have
no evaluation record. Apply the gate (`tactic-rsi-trigger-threshold-gate`), then spawn.

In scope: phase workers on both drivers, plus the unattended intervention lanes —
`dispatch-invalid-state`, `dispatch-conflict`, `fix-checks`, `qa-main`, `diagnose-main`,
`jit-reminder`. Out of scope: attended `/office-hours` sittings.

## Two things this buys beyond the widening

1. **Exact scope.** `.claude/skills/rsi/SKILL.md` currently records "There is no per-phase
   session id, and inventing one is not this job's business" and approximates scope as
   `--node <id> --since <epoch>`. A sidecar sweep yields the real session id, so `/rsi` can take
   `--session <sid>`. That is also the fix for `eval-since-bound-excludes-worker`, the finding
   ledger's highest-recurrence entry.
2. **A stale-citation repair, folded in rather than separately tracked.** `.claude/skills/rsi/`
   `SKILL.md:8`, `.claude/skills/dispatch-ladder/SKILL.md:365` and
   `dispatch-ladder-run:124` all cite "condition 14" of this strategy. The conditions array has
   16 entries after the 2026-08-14 round and the one they mean is index 7. Since this node edits
   all three files anyway, repair the citations here. Do NOT mint a node for it: the general
   defect (ordinal citations are not insertion-stable) is already tracked by
   `tactic-clarification-citation-ids`, which is in flight at phase review on PR 3041 and parked.

## Explicitly NOT this node

The gate itself is `tactic-rsi-trigger-threshold-gate`; the distribution that feeds it is
`tactic-rsi-audit-threshold-table`. This node is the detector and the scope change only.

## Validation order (the pause)

Dispatch has been paused by author directive since 2026-08-10, so the tick path cannot be
validated end-to-end until the pause lifts. Build both halves in this one lane-agnostic change,
validate the ladder path immediately, and carry an explicit "tick path unvalidated until the
pause lifts" mark that this node's `main-qa` must discharge when it does.
