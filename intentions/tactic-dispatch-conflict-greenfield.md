---
id: tactic-dispatch-conflict-greenfield
kind: tactic
statement: "Build dispatch-conflict: auto-resolve mechanical merge conflicts
  from existing graph requirements, park only on conflicts needing author input
  on intention"
owner: ai
status: raw
parent: null
rationale: "Surfaced in the 2026-07-18 /align-strategy interview as the
  greenfield state for conflict resolution (clarification 67). Renames
  /fix-conflicts to dispatch-conflict AND upgrades its behavior: today
  graph-commit parks on any conflict (the loser's-mailbox park); the greenfield
  skill resolves mechanical conflicts decidable from the graph and reserves
  office_hours parks for genuine intention contention. Finalize as a BACKLOG
  tactic (off-path, low rank) per clarification 69."
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
office_hours:
  reason: "Cannot finalize: this tactic and the sibling
    tactic-graph-commit-auto-serialization (the 2026-07-13
    automatic-serialization draft) target the SAME behavior -- upgrading
    graph-commit's park-on-any-conflict so mechanical conflicts auto-resolve and
    only genuine INTENTION conflicts park -- and the split of responsibility
    between the two is undecided. tactic-graph-commit-auto-serialization was
    itself parked on 2026-07-19 for exactly this reason: the two drafts target
    the same upgrade under two incompatible architectures -- (a) a 5-layer
    resolution ladder built INTO graph-commit the bash script (that tactic),
    versus (b) a graph-native model-driven skill, dispatch-conflict, renamed
    from /fix-conflicts (this tactic). That park already worked out a
    recommended greenfield partition: graph-commit the script owns the
    deterministic mechanical layers 1-3 (git three-way auto-merge, a net-new
    structural field-level/list-union frontmatter merge, and stale --base auto
    re-read/re-apply); this tactic (dispatch-conflict) owns layer-4 model
    reconciliation (opus subagent, resolved/ambiguous verdict, a scope guard
    limiting the model to mechanical divergence on human-owned doctrine fields)
    and layer-5 true-conflict office_hours parking. Two concrete options were
    floated: (1) narrow tactic-graph-commit-auto-serialization to layers 1-3 and
    fold layers 4-5 into this tactic, or (2) supersede that tactic entirely into
    this one (prune it). But that recommendation was explicitly left unratified:
    'which architecture wins, or how the ladder partitions across script and
    skill, is an author design decision -- not something an autonomous finalize
    should pick.' Finalizing THIS tactic now, under any one reading of that
    partition, would repeat the exact premature pick the sibling park avoided,
    and would lock in a scope for this node before the sibling's park is
    resolved -- the same record-completeness defect (clarification 31) already
    named there, now blocking the other half of the same duplicate pair."
  since: 2026-07-19
  recommendation: "Same fix as tactic-graph-commit-auto-serialization's park: run
    one /align-strategy reconciliation pass on strategy-graph-native-dispatch,
    ratify the layer partition as a clarification, then /align-tactics both
    tactics together in one pass so neither node's plan pre-empts the other's
    scope. Recommended partition (already drafted on the sibling's park,
    repeated here for symmetry): this tactic (dispatch-conflict) owns model
    reconciliation and true-conflict parking (layers 4-5);
    tactic-graph-commit-auto-serialization is narrowed to the deterministic
    mechanical layers (1-3) rather than pruned, since that scope (three-way
    auto-merge, structural field-level/list-union merge, stale-base re-apply) is
    real net-new code distinct from this tactic's model-driven layers."
pace_exempt: false
rounds: null
attributes: {}
---
# Build dispatch-conflict: auto-resolve mechanical merge conflicts from existing graph requirements, park only on conflicts needing author input on intention

Draft context (retained by /align-strategy 2026-07-18; not yet planned). The greenfield conflict-resolution state (strategy clarification 67).

## Target behavior

`dispatch-conflict` (renamed from `/fix-conflicts`, made graph-native):
- **Auto-resolve mechanical conflicts** — any conflict decidable from existing graph requirements — without author involvement.
- **Park to office_hours only on intention conflicts** — conflicts that genuinely need author input on *intent*, not mechanics.

## What this upgrades

Today graph-commit parks on *any* rebase conflict (the loser's-mailbox park). The greenfield skill narrows parking to genuine intention contention, so mechanical conflicts clear autonomously.

`/fix-conflicts` today is legacy issue-lane-only (`.claude/skills/fix-conflicts/SKILL.md:37-50`, branch `<N>-…` only). This tactic both renames it into the dispatch-* namespace ([[tactic-dispatch-skill-rename]]) and rebuilds it for the graph-native lane.
