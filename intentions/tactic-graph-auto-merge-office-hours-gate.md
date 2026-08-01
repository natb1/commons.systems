---
id: tactic-graph-auto-merge-office-hours-gate
kind: tactic
statement: graph-auto-merge must decline to merge a node-lane PR while its node
  carries a live office_hours park
owner: ai
status: raw
parent: null
rationale: "Surfaced 2026-08-01 while investigating a stopped-node QA subagent's
  review of PR #3006 (tactic-lane-instrument-substitution-guard). Direct read of
  .claude/skills/dispatch-propagate/scripts/graph-auto-merge (lines 78-94,
  113-173) confirms: the candidate-enumeration query selects every kind:tactic
  node at phase:review whose execution.pr is non-null and whose
  execution.markers includes \"reviewed\" — it does not read node.office_hours
  anywhere. The per-candidate merge gates that follow (PR state OPEN, mergeable
  MERGEABLE, CI verdict passing, tactic-scope-fingerprint freshness) likewise
  never consult office_hours. So a node at phase:review carrying BOTH the
  reviewed marker AND a live, unresolved office_hours park is currently
  indistinguishable to this script from a clean reviewed node — it merges the
  PR regardless. This is a real code-level gap, confirmed by reading the
  script directly, independent of the exact PR #3006 timeline (which needs its
  own separate confirmation — see gap below)."
reading: null
gap: "Not yet confirmed: whether PR #3006 was actually merged by graph-auto-merge
  while tactic-lane-instrument-substitution-guard already carried a live
  office_hours park at phase:review (the motivating near-miss), or whether the
  park was set later at qa-main after a clean merge (the commit trail read
  2026-08-01 — 36a7fd5e qa-fix residue filing precedes the 0428a3b1 park, both
  after the 22:45:49Z merge — is at least consistent with the latter, less
  alarming, reading). Confirming the precise sequence is a prerequisite to
  scoping the fix (e.g. does the gate need to check office_hours only at
  phase:review, or should reconcile-graph-merged also refuse to advance a
  parked node to main-qa)."
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal:
  observable: "graph-auto-merge's per-candidate gate skips (holds, does not
    merge) any phase:review node whose office_hours is non-null, verified by a
    test fixture: a reviewed, green, fresh, mergeable PR whose node also
    carries a non-null office_hours must NOT be merged."
  sensor: test-graph-auto-merge.sh
  threshold: "new test case passes; existing test-graph-auto-merge.sh suite
    unaffected"
  is_proxy: false
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
# graph-auto-merge must decline to merge a node-lane PR while its node carries a live office_hours park

Draft finding, not yet decomposed — recorded here per the standing rule that
findings and UNKNOWNs land as graph nodes, never journald or plan prose alone.
`/align-tactics` still owes this node a proper decomposition round; the scope
below is what the investigating session established, not a finished plan.

## The confirmed gap

`.claude/skills/dispatch-propagate/scripts/graph-auto-merge` is, per its own
header comment, "the ONLY code that merges a node-lane PR." Its candidate
enumeration (Step 2, lines 83-94) is:

```js
if (n.kind !== "tactic") continue;
if (n.phase !== "review") continue;
const pr = n.execution && n.execution.pr;
if (pr === null || pr === undefined) continue;
const markers = (n.execution && n.execution.markers) || [];
if (!markers.includes("reviewed")) continue;
```

No `office_hours` read anywhere in this file. The per-candidate merge gates
that follow (PR state OPEN, `mergeable === MERGEABLE`, CI verdict `passing`,
the fail-closed tactic-scope-fingerprint freshness re-check) are all
orthogonal to `office_hours` too. A node satisfying every one of those gates
gets merged (`gh_pr_merge_rest ... --squash`) regardless of whether it also
carries a live `office_hours` park.

Every other lane in this fleet treats a non-null `office_hours` as a hard stop
— the router excludes parked nodes from `select-targets.ts` candidates
entirely, and `transition-node`/`clear-park` are the only sanctioned ways to
move a parked node forward. `graph-auto-merge` is the one write path that
currently doesn't ask.

## Why this matters

A node can, in principle, reach `phase:review` with the `reviewed` marker set
and *still* accumulate an `office_hours` park afterward — e.g. a `/review-fix`
pass that gets partway through, hits something requiring human judgment (a
harness limitation, an ambiguous finding, a scope question), and parks the
node without clearing the `reviewed` marker it already set on an earlier,
clean pass. If a tick's `graph-auto-merge` sweep runs in that window, it merges
the PR anyway — the office_hours park is left dangling on a node whose PR has
already shipped, and whatever the park was flagging never got human eyes
before the code landed.

## Open question (see `gap` in frontmatter)

Whether this has already happened for real (PR #3006) or is a live-but-not-yet-
triggered code path is not yet confirmed — the commit trail on
`tactic-lane-instrument-substitution-guard` read 2026-08-01 is at least
consistent with the park having been set *after* a clean merge (at the
downstream qa-main phase, not at review time), which would make PR #3006 a
red herring for this specific node rather than a live occurrence. Either way,
the code-level gap is real and confirmed by direct read; an `/align-tactics`
round should confirm the historical question before scoping the fix (which
likely also touches `reconcile-graph-merged`'s post-merge phase advancement,
not just `graph-auto-merge` itself).

## Shape of a fix (not yet decided)

Candidate: add `if (n.office_hours != null) continue;` (or an explicit
`held <id> (parked)` log line, matching the existing `held <id> (missing-stamp)`
/ `held <id> (scope-stale)` convention) to the Step 2 candidate filter or the
Step 4 per-candidate gate loop. `test-graph-auto-merge.sh` already has fixture
scaffolding for the scope-stale hold path (`held <id> (scope-stale)`) to model
the new test case after.
