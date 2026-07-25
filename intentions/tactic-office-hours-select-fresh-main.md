---
id: tactic-office-hours-select-fresh-main
kind: tactic
statement: office-hours-select.ts performs its own local origin/main freshness
  read so every consumer inherits it, retiring the wrapper-only
  park_live_on_main duplication
owner: ai
status: raw
parent: null
rationale: Byproduct of the 2026-07-25 concurrency/serialization review,
  resolving the purity-premise clarification recorded the same day. The
  origin/main park-liveness guard lives only in office-hours-graph
  (park_live_on_main), so every other consumer of the selector must reimplement
  it; a stale-worktree false positive has been observed live, and this round's
  subagent sweep had to be told in prose to re-check origin/main.
  graph-select-target already sets the precedent by snapshotting origin/main
  itself via git archive.
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
  rationale: "Author-directed 2026-07-25: the queue-serialization work
    (dispatch-queue claim integrity, office-hours drain claiming, and the
    cross-queue landing path) is the current focus — boosted to parity with
    tactic-graph-router-live-worker-read-robust, the existing author-set boost
    on this same defect class, and deliberately below strategy-main-health's
    standing 100 so the main-health signal keeps its recorded dominance."
phase: null
execution: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# office-hours-select.ts performs its own local origin/main freshness read so every consumer inherits it, retiring the wrapper-only park_live_on_main duplication

## Context

Retained byproduct of the 2026-07-25 concurrency/serialization review
(`strategy-graph-native-dispatch`). Not yet planned.

`office-hours-select.ts` reads only the LOCAL `intentions/` store, so it lists a
node whose park was already cleared on `origin/main` whenever the checkout lags
— a stale PR-branch worktree being the common case. The authoritative check
exists but lives in the bash wrapper `office-hours-graph` as
`park_live_on_main`, which confirms each candidate via
`git show origin/main:intentions/<id>.md` before launching.

Because the guard sits in the wrapper, every other consumer must reimplement it.
This round's subagent sweep had to be instructed in prose to re-check
`origin/main` for all ten candidate nodes, and a stale-worktree false positive
has been observed live.

## Doctrinal basis (settled 2026-07-25, do not re-litigate)

`tactic-office-hours-concurrency-dedup` recorded a decision to make zero changes
to `office-hours-select.ts`, reasoning that daemon/network checks would violate
its "no gh, no daemon, no network" contract. The author amended the premise this
round: the real contract is avoiding Claude sequencing system/network commands
that a script could do with fewer round trips and fewer tokens (recorded on
`strategy-token-economy`). A local `git show origin/main` inside the script is
therefore preferred, not merely tolerated — doing it once in the script beats
every caller re-deriving it. `graph-select-target` already does exactly this
with `git archive origin/main`, and `office-hours-select.ts` already performs fs
reads, so it was never pure in the sense the annotation implied.

## Scope sketch (for /align-tactics, not a plan)

- In scope: the selector resolves park liveness against `origin/main` itself;
  `park_live_on_main` retires or becomes a thin call-through. Keep the existing
  stdout disposition contract (`launch` / `empty` / `empty not-parked`) intact —
  `office-hours-graph` parses it.
- Out of scope: the bash-side LIVENESS dedup from
  `tactic-office-hours-concurrency-dedup`, which is unaffected — bash is equally
  a script, and the daemon read genuinely does belong outside the pure module.
