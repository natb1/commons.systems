---
id: tactic-reservation-ledger-issue-num-residue
kind: tactic
statement: Retire the legacy issue-number derivation in the reservation ledger —
  reserved_claimed_nums and its sole consumer claimed_issue_nums — which yields
  a meaningless value for node-id markers and has no production call site
owner: ai
status: raw
parent: null
rationale: Byproduct of the 2026-07-25 concurrency/serialization review.
  reserved_claimed_nums derives a claimed issue number as the marker basename's
  numeric prefix, but dispatch-select-tick writes markers named by node id, so
  the derivation yields the literal string before the first hyphen. Inert today
  because claimed_issue_nums has no production caller — which is itself the
  argument for deleting rather than repairing it. tactic-legacy-router-removal
  never names this file.
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
# Retire the legacy issue-number derivation in the reservation ledger — reserved_claimed_nums and its sole consumer claimed_issue_nums — which yields a meaningless value for node-id markers and has no production call site

## Context

Retained byproduct of the 2026-07-25 concurrency/serialization review
(`strategy-graph-native-dispatch`). Not yet planned. Low severity, recorded
because the graph is the sole tracker for defects.

`reserved_claimed_nums` in
`.claude/skills/dispatch-propagate/scripts/lib-reservation-ledger.sh` derives a
claimed ISSUE NUMBER from each marker's basename via `${bn%%-*}` — the legacy gh
lane's `<issue-N>-<slug>` naming. The graph lane writes markers named by node id
(`dispatch-select-tick` calls `reservation_write "$id" "$id" "$session"`), so
the derivation returns only the segment before the first hyphen — for any
tactic-kind node id, the bare literal string that prefixes every one of them.

It is inert: `claimed_issue_nums`, the sole consumer, has no production call
site — only the library and the test file reference it. That is the argument for
DELETING rather than repairing: the function speaks a retiring lane's language
and no longer has a caller to serve.

## Scope sketch (for /align-tactics, not a plan)

- In scope: delete `reserved_claimed_nums` and `claimed_issue_nums` with their
  tests, or — if the gh lane still needs them while draining — move them behind
  the legacy boundary rather than leaving them in the shared ledger library.
  Confirm the no-caller finding at planning time; it was established by grep in
  the 2026-07-25 review and the gh lane was still draining then.
- `tactic-legacy-router-removal` is the umbrella for gh-lane removal but its
  scope list never names this file, which is why this is tracked separately.
