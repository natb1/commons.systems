---
id: tactic-terminal-disposition-sweep-park-without-cas
kind: tactic
statement: "lib-frozen-session-park's sweeps invoke park-node with no --base CAS
  token, so their already-parked guard is a bare read-then-write: a specific
  office_hours park that lands between the guard and the write is silently
  overwritten with generic boilerplate, destroying the author-facing reason and
  recommendation an office-hours reviewer needs"
owner: ai
status: raw
parent: null
rationale: "CONFIRMED 2026-08-04 by direct diff, with a line-level root cause.
  THE DEFECT: both sweeps in
  `.claude/skills/dispatch-propagate/scripts/lib-frozen-session-park.sh` gate on
  an `already parked` check (step (8), `:487-495` and `:995-1001`) that reads
  `git show origin/main:intentions/<id>.md` and skips the candidate when
  `office_hours` is non-null. That guard is correct in shape but ADVISORY ONLY,
  because the write it guards passes no compare-and-swap token: the call sites
  build `park_args+=(\"$name\" \"$reason\" \"$recommendation\")` (step (12), and
  `:524` in the frozen sweep) and invoke `park-node` WITHOUT `--base`.
  `park-node` without `--base` sets `office_hours` unconditionally, so any park
  that lands in the window between the guard's read and the sweep's write is
  overwritten rather than refused. THE EVIDENCE: four clobbers on `origin/main`
  in the four days to 2026-08-04, each a specific park immediately followed by a
  generic `session ended without declaring a disposition` park on the same node
  -- `tactic-attention-surface-graph-read` (specific 1c09ccf1, clobbered 351s
  later), `tactic-explicit-node-reservation-sweep-policy` (ac4c24f7, 441s),
  `tactic-office-hours-select-fresh-main` (69cf82b3, 809s), and
  `tactic-test-decision-log-prod-leak` (754c2916, 28817s -- the long gap is a
  legitimate later re-park, not this race). `git diff ac4c24f7 bc1a2df4 --
  intentions/tactic-explicit-node-reservation-sweep-policy.md` shows both
  `reason` and `recommendation` replaced wholesale. THE CONSEQUENCE: the
  replacement text instructs the reader to `Read the session's transcript or
  attach the held job` -- but the sweep only fires on sessions that are already
  terminal, and the reap that follows deletes the job dir, so the boilerplate
  points at evidence the same lifecycle destroys. What is lost is precisely the
  author-decision content office-hours exists to consume. WHY IT COMPOUNDS: the
  sweep only ever sees these nodes because `qa-main`'s WAIT-park path and
  `qa-fix` never call `mark-node-terminal` (tracked as
  tactic-qa-fix-node-terminal-declaration), so the session never declares a
  disposition, `dispatch-self-close` holds it, and the sweep adopts it as a
  candidate. That gap supplies the candidates; this defect turns each one into
  data loss. Distinct from tactic-self-close-reap-silent-noop, which is about a
  reap that declines silently, not a park that overwrites. NOT A NEW DOCTRINE:
  the repository already specifies the correct shape in the diagnosis-time
  compare-and-swap reference -- capture each node's base blob at diagnosis time
  and pin it through `park-node --base`, routing an exit-3 stale-diagnosis
  refusal back to re-diagnosis. These sweeps predate or bypass that contract."
reading: null
gap: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention:
  boost: 12
  override: null
  rationale: Bug-ledger tracking node under the standing priority order
    (token-efficiency first, bug-ledger second). Boost 12 matches the other
    bug-ledger nodes in this cluster; re-simulated over the live store after
    writing to confirm 0 tier changes and 0 value drift onto non-target nodes.
  tier: 1
phase: null
execution: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# lib-frozen-session-park's sweeps invoke park-node with no --base CAS token, so their already-parked guard is a bare read-then-write: a specific office_hours park that lands between the guard and the write is silently overwritten with generic boilerplate, destroying the author-facing reason and recommendation an office-hours reviewer needs
