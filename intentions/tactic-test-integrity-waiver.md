---
id: tactic-test-integrity-waiver
kind: tactic
statement: "test-integrity waiver: author-approved, node-recorded, per-signal
  scoped waivers the CI check nets out — office-hours approval resumes the
  normal ladder"
owner: ai
status: raw
parent: null
rationale: "Surfaced by the 2026-07-10 integrity-approval interview (strategy
  clarification: mechanical-integrity-gate waiver workflow). The check's two
  mechanical co-deletion exemptions deliberately bias-to-fire on the residual
  class — behavioral tests of deliberately deleted behavior on a surviving
  symbol — so a legitimate removal in that class is permanently red with no
  supported path except human override-merge, which skips review/qa and
  auto-merge. First case: tactic-analytics-vitals-delivery / PR #2835."
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
# test-integrity waiver: author-approved, node-recorded, per-signal scoped waivers the CI check nets out — office-hours approval resumes the normal ladder

Draft context from the 2026-07-10 /align-strategy interview (strategy
clarification "mechanical integrity gate … supported workflow" on
strategy-graph-native-dispatch is the doctrine home; this draft carries the
implementation sketch for /align-tactics to finalize).

## Implementation sketch

1. **Waiver home (schema).** A waiver list on the tactic node — proposed
   `execution.waivers: [{pr, signal, max_net, paths, approved, reason}]` —
   frontmatter state, never part of the tactic scope hash (like
   attempts/markers), so a waiver write cannot demote the chain-of-custody
   gate. Exact field home decided at finalization; validator gains the shape
   check.
2. **Check side.** `.github/scripts/check-test-integrity.sh` resolves the PR
   number from the Actions event context, looks up origin/main's
   `intentions/*.md` node whose `execution.pr` matches, and nets each waived
   {signal, max_net, paths} out of its counts before evaluating. Bias-to-fire
   preserved: no node, no waiver, over-scope, or out-of-path removals all
   fire exactly as today. The gh queue drain is complete (author-stated
   2026-07-10), so no legacy-lane fallback path is needed.
3. **Park side.** The worker that determines a firing is intentional and
   legitimate parks the node to office_hours with the EXACT proposed waiver
   object as the recommendation (condition 6) — never fix-loops on a
   red-by-design check.
4. **Office hours.** The approval step: the human approves; the office-hours
   session (Claude) writes the waiver into the node, and that same
   interactive graph-commit clears the park (strategy clarification 4). The
   waiver write is human-approval-gated — an auto-mode worker never writes
   one.
5. **Resume.** With the check green, the node proceeds through the normal
   ladder — fix/qa/review and the standard auto-merge arm at clean review
   completion. Override-merge is retired as the integrity-gate path.

## Scope decisions (author-ratified 2026-07-10)

- Per-signal, count-and-path scoped — a later genuine weakening on the same
  PR still fires.
- Deliberately NOT head-SHA-pinned: review-fix's own content-fix pushes must
  not invalidate the approval and loop the node back to office hours.
- No new recovers edge: the check stays an owned script; only the CI
  executor is rented (existing delegation-github lean).

## Provenance / first case

PR #2835 (tactic-analytics-vitals-delivery): removing dead try/catch
wrappers orphaned 3 behavioral tests of the deleted swallow-and-report
branch; `logEvent` survives, so the import-based co-deletion exemption
(issue #2637 class) correctly does not apply — the residual class this
waiver channel exists for. Interim emulation of this design (waiver-shaped
marker + author override-merge in place of the arm) is encoded in the tick
instruction and executed for #2835 in the 2026-07-10 round.
