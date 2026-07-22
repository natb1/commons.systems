---
id: tactic-main-red-sync-completion-test
kind: tactic
statement: Add a direct test for dispatch-graph-main-red-sync's green-main completion path
owner: ai
status: raw
parent: null
rationale: "Retained review residue from PR #2919 (tactic-graph-main-self-heal):
  dispatch-graph-main-red-sync's green-main recovery-completion logic (dump-node
  -> jq phase=done -> write-node -> graph-commit --base, gated on
  execution===null) is untested — test-dispatch-scripts.sh fakes the whole
  script and scopes its internals out. The plan's own verification section
  deferred this to manual simulated-red-sha runs."
reading: null
gap: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: done
execution: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Add a direct test for dispatch-graph-main-red-sync's green-main completion path

Deferred from the `/review-fix` pass on PR #2919 (`tactic-graph-main-self-heal`),
review disposition `Deferred` (code-review residue).

**Location:** `.claude/skills/dispatch-propagate/scripts/dispatch-graph-main-red-sync:78`
(the green-main recovery-completion logic).

**Failure scenario:** the completion path (`dump-node` → `jq phase=done` →
`write-node` → `graph-commit --base`, gated on `execution === null`) is
untested — `test-dispatch-scripts.sh` fakes the whole script and scopes its
internals out. An untested completion path risks silently completing a node
with a live in-flight fix, or failing to complete a genuinely resolved node,
neither of which any current test would catch.

**Adversarial verdict:** not independently verified (this is code-review
residue, already confirmed by `/code-review`'s own internal review pass —
per the review-fix disposition table, Lane-A findings are not re-run through
the shared adversarial-verify step).

**Recommended fix:** add a direct test invoking the real script with fake
node/repo-health/dump-node/write-node/graph-commit shims asserting: (a) open
node + green main + null execution → completion attempted and the initial-read
id still printed to stdout, (b) open node + non-null execution → completion
skipped (no premature completion of in-flight fixes), (c) repo-health reports a
sha (still red) → no completion, (d) repo-health non-zero → `MB_SHA=UNKNOWN` →
no completion, and that only node ids (not `dump-node`/`graph-commit` chatter)
reach stdout.

**Source PR:** #2919 (`tactic-graph-main-self-heal`).
