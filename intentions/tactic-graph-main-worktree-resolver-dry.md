---
id: tactic-graph-main-worktree-resolver-dry
kind: tactic
statement: "Extract the duplicated main-checked-out-worktree resolver into a shared lib.sh helper. The awk one-liner `git worktree list --porcelain | awk '/^worktree /{wt=substr($0,10)} /^branch refs\\/heads\\/main$/{print wt; exit}'` (resolve the project root = the worktree with `main` checked out) is copy-pasted verbatim across four files added/edited by tactic-graph-router-selector: .claude/hooks/worktree-create.sh, .claude/skills/dispatch-propagate/scripts/dispatch-graph-execute, .claude/skills/dispatch-propagate/scripts/provision-node-worktree, and .claude/skills/dispatch-propagate/scripts/graph-select-target. Introduce one helper (e.g. resolve_main_worktree in lib.sh, honoring the DISPATCH_GRAPH_MAIN_WORKTREE test override where the two execute/provision scripts already do) and replace the four copies. Low-severity DRY cleanup; no behavior change."
owner: ai
status: raw
parent: null
rationale: "Deferred review finding from the tactic-graph-router-selector terminal review during the 2026-07-07 graph-native router tick. Deferred low-severity finding from the tactic-graph-router-selector terminal review (PR #2785, merged 9a50fe47). Not blocking — armed and merged clean. The project-root resolver `git worktree list --porcelain | awk '/^worktree /{wt=substr($0,10)} /^branch refs/heads/main$/{print wt; exit}'` appears verbatim in four files: - .claude/hooks/worktree-create.sh (node lane) - .claude/skills/dispatch-propagate/scripts/dispatch-graph-execute (with DISPATCH_GRAPH_MAIN_WORKTREE override) - .claude/skills/dispatch-propagate/scripts/provision-node-worktree (with DISPATCH_GRAPH_MAIN_WORKTREE override) - .claude/skills/dispatch-propagate/scripts/graph-select-target (NATIVE_ROOT resolution) Extract to a single sourceable helper in lib.sh (or a small lib-graph-worktree.sh) so the override handling and the awk parse live in one place. graph-select-target and the two execute-path scripts already source lib-reservation-ledger.sh which sources lib.sh, so the helper is reachable; worktree-create.sh sources it directly if needed. Prefer clear errors on an unresolvable root (matches the existing per-site error messages). Pure refactor — the router.test.ts and test-dispatch-scripts.sh integration cases must stay green."
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

# Extract the duplicated main-checked-out-worktree resolver into a shared lib.sh helper. The awk one-liner `git worktree l

Deferred low-severity finding from the tactic-graph-router-selector terminal review (PR #2785, merged 9a50fe47). Not blocking — armed and merged clean.

The project-root resolver `git worktree list --porcelain | awk '/^worktree /{wt=substr($0,10)} /^branch refs/heads/main$/{print wt; exit}'` appears verbatim in four files:
- .claude/hooks/worktree-create.sh (node lane)
- .claude/skills/dispatch-propagate/scripts/dispatch-graph-execute (with DISPATCH_GRAPH_MAIN_WORKTREE override)
- .claude/skills/dispatch-propagate/scripts/provision-node-worktree (with DISPATCH_GRAPH_MAIN_WORKTREE override)
- .claude/skills/dispatch-propagate/scripts/graph-select-target (NATIVE_ROOT resolution)

Extract to a single sourceable helper in lib.sh (or a small lib-graph-worktree.sh) so the override handling and the awk parse live in one place. graph-select-target and the two execute-path scripts already source lib-reservation-ledger.sh which sources lib.sh, so the helper is reachable; worktree-create.sh sources it directly if needed. Prefer clear errors on an unresolvable root (matches the existing per-site error messages). Pure refactor — the router.test.ts and test-dispatch-scripts.sh integration cases must stay green.
