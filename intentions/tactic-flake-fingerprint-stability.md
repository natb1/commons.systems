---
id: tactic-flake-fingerprint-stability
kind: tactic
statement: Make the flake fingerprint's stable-id component deterministic for a
  given failing assertion, so two CI recurrences of one failure cannot mint two
  separate flake tracking tactics
owner: ai
status: codified
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
attention: null
phase: qa
execution:
  branch: tactic-flake-fingerprint-stability
  pr: 2979
  attempts: {}
  markers:
    - planned
  strategy_fingerprint: null
  fix: null
  completion: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Make the flake fingerprint's stable-id component deterministic

## Context

`dispatch-flake-dedup-node` dedupes flake tracking nodes by a fixed-string grep
for a canonical `Fingerprint: <fingerprint>` line in node bodies. The fingerprint
format, produced in `.claude/skills/fix-checks/SKILL.md`, is
`<failing-check-name> — <stable-id>`. The check name is mechanical; the
**stable id is chosen by the model**, and nothing constrains that choice.

So two recurrences of the *same* failure can produce two different fingerprints,
and the grep — which is exact and fixed-string — matches neither against the
other. Dedup silently reports `NONE` both times and two nodes are filed.

Observed 2026-07-22. One assertion failure in
`.claude/skills/dispatch-propagate/scripts/test-dispatch-scripts.sh` produced two
flake tactics three minutes apart, from two CI runs of the same underlying
defect. Their fingerprints were:

- `hook-tests — .claude/skills/dispatch-propagate/scripts/test-dispatch-scripts.sh:22026` (keyed on file:line)
- `hook-tests — select-tick on-main but primary checkout off-main → guard halts (exit 2)` (keyed on the test name)

Both are reasonable readings of "stable identifier". Neither is wrong; they are
simply not the same, which is the whole problem. Both nodes were later pruned as
non-defects.

Note the file:line form is not merely *different*, it is actively unstable: any
edit above line 22026 in that file moves the anchor, so the same failure
re-fingerprints on an unrelated change. A test name does not have that property.

## Priority note

This is deliberately scoped as a **follow-up**, not a blocker. The stale-head
guard (`tactic-flake-classifier-stale-head-guard`) suppresses the filing of both
nodes in the observed incident regardless of fingerprint, because both were
stale-head false positives caught before any node write. Fingerprint instability
only becomes load-bearing for a *genuine* flake that recurs and must dedupe
against its own prior node. Real, but lower severity than the guard.

## Unit 1 — pin the stable-id rule

**Recommended model:** opus

**Scope.** In `.claude/skills/fix-checks/SKILL.md`, replace the open-ended
"stable identifier" instruction with a single deterministic rule and state the
precedence explicitly. Recommended rule, strongest first:

1. The failing **test name / assertion label** as the suite prints it, verbatim.
2. Only when no such label exists, the failing **file path** with **no line
   number** (line numbers drift on unrelated edits).

Never a line number, never a run id, never a timestamp, never a PR number — each
of those varies across recurrences of one defect and so defeats dedup by
construction. Include a worked example drawn from the incident above showing the
two fingerprints that should have been one.

**Explicitly out of scope.** Do not change `dispatch-flake-dedup-node`'s
matching. Its exact fixed-string grep on a canonical label line is correct and
deliberately strict; the defect is upstream, in what the caller feeds it. Do not
attempt retroactive normalization of fingerprints already recorded in existing
nodes.

## Unit 2 — narrow the blast radius of a near-miss

**Recommended model:** opus

**Dependencies.** Unit 1.

**Scope.** A pinned rule reduces divergence but cannot eliminate it, since the
id is still model-produced prose. Add a cheap secondary signal so a near-miss is
visible rather than silent: when the guard returns `NONE`, have the caller also
grep the node bodies for the failing **check name** alone (the mechanical half of
the fingerprint) and, on a hit whose stable-id differs, surface it as a possible
duplicate for a human to collapse rather than silently filing a second node.

Keep this advisory. It must not block filing — a genuinely distinct flake in the
same CI job is a normal, expected case and must still be trackable.

## Verification

```verify
bash .claude/skills/dispatch-propagate/scripts/lint-prose-rules.sh
```

Mostly a documentation-and-judgment change, so verification is largely by
inspection: re-read the incident's two fingerprints against the new rule and
confirm it forces both to the same string (it should select the test-name form
for each). If Unit 2 lands with any script surface, that surface needs its own
unit test alongside the sibling `test-*.sh` files in
`.claude/skills/dispatch-propagate/scripts/`.
