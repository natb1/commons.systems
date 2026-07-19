---
id: tactic-graph-commit-landing-lock
kind: tactic
statement: graph-commit serializes the rebase→stamp→push critical section behind
  a CAS-claimed lock ref with TTL steal — interim mitigation, deleted when
  tactic-graph-ref-split lands
owner: ai
status: raw
parent: null
rationale: "Retained draft from the 2026-07-19 /align-strategy round
  (strategy-graph-native-dispatch clarification 80). Rebase-retry exhaustion —
  MAX_PUSH_ATTEMPTS=5 burned with zero progress, observed three times on
  2026-07-19 — is landing contention on the single linear main ref, not
  same-node edit contention, so it is orthogonal to the 2026-07-13 merge ladder
  (tactic-graph-commit-auto-serialization owns the content-merge layers 1-3).
  Git's server-side ref update is already an atomic compare-and-swap, so ref
  integrity is never at risk; what dies on each losing attempt is the stamp
  investment: branch protection requires the four checks green on the exact SHA,
  so every retry re-buys 30-180s of CI whose vulnerability window is the entire
  stamp duration. The lock protects the stamp investment, not ref atomicity —
  writers queue instead of racing blindly. Explicitly interim per the ratified
  greenfield direction (design-proposals rule): it exists only because the stamp
  is expensive, and is deleted when the ref split removes the stamp."
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
# graph-commit serializes the rebase→stamp→push critical section behind a CAS-claimed lock ref with TTL steal — interim mitigation, deleted when tactic-graph-ref-split lands

Retained draft context (2026-07-19 /align-strategy round; strategy clarification 80
is the deciding record — read it first).

## Design sketch

- A lock ref (e.g. `refs/graph/landing-lock`) claimed by an atomic CAS
  ref-update (push with expected-old-value, or `gh api` ref create/update) —
  the claim itself is race-safe because it uses the same server-side CAS
  primitive the final push does.
- Held over the whole critical section in `graph-commit`'s `try_land`:
  `pull --rebase origin main` → scratch-branch force-push → `await_checks` →
  `push <sha>:main`. Released on every exit path (success, conflict park,
  check failure), mirroring the scratch-branch cleanup discipline.
- Stale-lock recovery: the lock payload encodes holder id + expiry (TTL sized
  to CHECK_TIMEOUT_SECONDS plus margin); a waiter steals only after expiry.
  A holder's dead session must never wedge the fleet.
- The final push keeps CAS as the safety net: non-graph pushes (PR
  auto-merges) do not take this lock, so main can still occasionally advance
  under a holder — retry under the still-held lock; with cooperating writers
  queued this becomes rare instead of near-certain.
- Waiters poll/backoff on the lock instead of burning CI stamps; exhaustion
  semantics (exit 11 "main busy") remain as the outer bound.

## Non-goals

- Does not serialize node edits — same-node content contention stays with the
  merge ladder (`tactic-graph-commit-auto-serialization` layers 1-3,
  `tactic-dispatch-conflict-greenfield` layers 4-5).
- Does not change branch protection or CI.

## Interim status

Deleted when `tactic-graph-ref-split` lands — the lock protects the CI-stamp
investment, and that design removes the stamp.
