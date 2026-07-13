---
id: tactic-graph-main-self-heal
kind: tactic
statement: "graph-native red-main self-heal: tick repo-health gate +
  find-or-create latch/work node, diagnose-main rewritten graph-native, legacy
  issue-latch cleanup"
owner: ai
status: raw
parent: null
rationale: "Retained from the 2026-07-12 /align-strategy interview triggered by
  the red-main episode of the same day: the legacy dispatch-diagnose-main flow
  re-enabled the repo's disabled has_issues feature to file its
  dispatch:main-broken latch issue, regressing the drain ratchet. The author
  decided the greenfield shape: one graph node is latch, announcement, and work
  item; no gh issue, no label. Supersedes tactic-dispatch-legacy-rewire Unit 1
  latitude on the announcement surface (see the strategy's 2026-07-12
  clarifications)."
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
# graph-native red-main self-heal: tick repo-health gate + find-or-create latch/work node, diagnose-main rewritten graph-native, legacy issue-latch cleanup

Draft — retained interview context per the retain-not-refine contract.
/align-tactics finalizes, splits, or merges; nothing below is a plan schema.

## Decided shape (2026-07-12 interview, authoritative)

One graph node carries latch, announcement, and work item:

- The graph tick gains a **repo-health gate**: on detecting a red
  `origin/main` HEAD it **find-or-creates a single tactic node**
  (`tactic-main-red-<shortsha>` shape) via the normal `graph-commit` write
  path. Find-or-create keeps one open node per red episode — a re-detection
  during the same episode updates the body, never duplicates.
- The node body carries the **redacted diagnosis** (failing check/step name,
  high-level error category, likely cause — same redaction bar the legacy
  `dispatch-diagnose-main` skill documents: no raw log lines, no secrets, no
  CI internals).
- The node is **pace-exempt with priority attention** — composes with the
  recorded pace-exempt doctrine (bypasses the pace gate, never the
  `--exhausted` hard floor). The router selects it like any tactic; the
  fleet fixes main autonomously. That selection is the self-heal.
- **Node open ⇔ gate latched**: the tick's health gate treats an open
  main-red node as "episode already being handled" and lets the queue flow.
  The sensor observing green **completes the node** and re-arms the gate.
- No gh issue, no `dispatch:*` label, no re-enabled GitHub features
  (`has_issues` stays disabled — drain-state monotonicity condition on
  `strategy-graph-native-dispatch`).

## Deprecation half

- `dispatch-diagnose-main`'s SKILL.md is rewritten graph-native: write the
  node, never `gh issue`; never touch repo feature flags. (The 2026-07-12
  episode: the skill's find-or-create-issue mandate led the job to re-enable
  `has_issues` via PATCH — the spec itself was the defect.)
- Steelman diverged (recorded on the strategy): no gh-issue mirror for
  human visibility — owned surfaces (office-hours dashboard, statusline,
  the graph) announce red main.

## Cleanup unit — sequencing is load-bearing

The legacy latch reader is `dispatch-select-tick` step 1c (~line 387): open
`dispatch:main-broken` issue = latched. Cleanup — close the 2026-07-12
latch issue and re-disable `has_issues` — **must land after** the graph
latch replaces that reader, else the queue freezes mid-red or diagnose-main
refiles. Until then the open issue stands.

## Coordination

- `tactic-dispatch-legacy-rewire` Unit 1 (phase: implement, live) scopes the
  same latch extraction and left the announcement surface as implementer's
  choice — that latitude is now superseded by the strategy's 2026-07-12
  clarification. /align-tactics reconciles the two nodes (fold this shape
  into Unit 1, or block Unit 1 on this node) rather than letting both run.
- The current red episode itself is tracked by
  `tactic-graph-fastpath-guard-diff-base` (the underlying guard bug) and,
  interim, by the legacy latch issue.
