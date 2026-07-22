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
office_hours:
  reason: "graph-commit: mechanical-unresolved — 1 field(s) diverged across
    concurrent writes and could not be auto-merged (layers 1-3 exhausted)"
  since: 2026-07-22
  recommendation: >-
    A concurrent writer landed an overlapping edit to this node while this
    session's edit was in flight; this writer's content was NOT landed. This
    session's unlanded content is preserved at
    /tmp/tmp.1qjbcMlBRv/tactic-main-red-sync-completion-test.md (this machine
    only — may not survive past this session). Recommended: the losing writer
    re-reads the current origin/main content, manually merges in its intended
    edit, and re-runs graph-commit on the merged result — that same commit
    clears this office_hours park. A third session encountering this park while
    the loser is still working should wait rather than attempt its own merge
    (the mailbox discipline).


    Diverged field 'phase' on tactic-main-red-sync-completion-test:
      this session's value: implement
      origin/main's value: done
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
