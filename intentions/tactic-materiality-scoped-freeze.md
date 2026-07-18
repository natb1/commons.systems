---
id: tactic-materiality-scoped-freeze
kind: tactic
statement: "Materiality-scoped strategy-edit freeze: widen the strategy
  fingerprint stamp to {hash, sha} and move child classification with
  same-commit re-stamp into the editing round"
owner: ai
status: raw
parent: null
rationale: "Surfaced in the 2026-07-18 /align-strategy interview on scope-change
  tracking (the materiality-scoped-freeze clarification): a strategy edit today
  soft-freezes every stamped open child regardless of relevance — 9 in-flight
  children staled by the low-rank skill-rename edit — because the freeze
  conflates materiality with urgency and the bare-hash stamp carries no delta
  provenance. The author's rank-gate alternative was DIVERGED in the same
  clarification; this carrier implements the adopted design. Likely finalizes as
  a backlog tactic (off-path) unless a future signal path includes it."
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

# Materiality-scoped strategy-edit freeze: widen the strategy fingerprint stamp to {hash, sha} and move child classification with same-commit re-stamp into the editing round

Draft context (retained by /align-strategy 2026-07-18; not yet planned).
Authoritative doctrine: the materiality-scoped-freeze clarification and the
migration-sequencing clarification on `strategy-graph-native-dispatch`
(both 2026-07-18).

## Target design

- `execution.strategy_fingerprint` map values widen from a bare hash string to
  `{hash, sha}` — `sha` is the origin/main commit whose strategy content the
  stamp was taken against, mirroring the tactic scope-custody stamp. A stale
  child recovers the exact delta via
  `git diff <sha>..origin/main -- intentions/<strategy-id>.md`.
- The editing `/align-strategy` round classifies each stamped open child of the
  edited strategy: orthogonal → re-stamp in the same graph-commit (no freeze
  fires); materially affected → left stale (freezes, re-evaluates at its own
  rank as today); must-land-first migration → additionally
  `child.blocked_by += [carrier]` (backward attention-compounding then boosts
  the carrier by what it blocks).
- Selector staleness logic is otherwise unchanged — no rank gate (DIVERGED in
  the clarification: rank is not a proxy for materiality).

## Reference-site census

- `packages/intentionsutil/src/schema.ts` — `Execution.strategy_fingerprint`
  map value type (`string` → `string | {hash, sha}`; the bare-string legacy
  scalar form stays deprecated).
- `packages/intentionsutil/src/router.ts` — `strategyFingerprint` (hash recipe
  unchanged), `isStrategyStale` (read `.hash` in either form), the freeze-event
  emission, and every stamping site.
- `packages/intentionsutil/scripts/validate-graph.ts` — accept both forms
  during migration; reject bare strings after step 4.
- `.claude/skills/align-strategy/SKILL.md` step 5 — the soft-freeze warning
  becomes the classification-and-re-stamp step (orthogonal / affected /
  must-land-first, per the clarification).
- `.claude/skills/align-tactics/SKILL.md` re-evaluation mode — re-stamps write
  the `{hash, sha}` form.

## Migration (ordered; from the clarification)

1. Additive schema: accept `string | {hash, sha}`; staleness reads the hash in
   either form. No behavior change.
2. New stamps write `{hash, sha}`.
3. Bare-hash stamps migrate opportunistically at each re-stamp.
4. Drop the bare-string map-value form.

Single atomic PR is plausible (few live stamps); decide at finalize per the
atomic-vs-sequenced pattern of `tactic-fix-interrupt-orthogonal-state`.
