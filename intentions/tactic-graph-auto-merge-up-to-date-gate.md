---
id: tactic-graph-auto-merge-up-to-date-gate
kind: tactic
statement: graph-auto-merge merges only a PR whose branch is current with
  origin/main and whose passing checks ran on that current base; when BEHIND the
  tick scripts gh api update-branch and defers the merge to a later green tick
owner: ai
status: raw
parent: null
rationale: "Surfaced in the 2026-07-19 /align-strategy interview recording the
  stale-base auto-merge gap: a merged review PR's green CI had run on a stale
  base and main went red after the merge. Author direction: merge eligibility
  requires the PR up to date with main with all checks passing on that current
  base; all scriptable steps of the done-phase merge path live in the dispatch
  router. Retained as a follow-up to tactic-graph-tick-node-lane-auto-merge (PR
  #2904 lands as-is; the author accepts the interim unguarded window until this
  ships)."
reading: null
gap: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention:
  boost: 50
  override: null
  rationale: "Bootstrap re-scale 2026-07-30: Wave A of a three-band interim scale
    (50 / 20 / 10) that puts write-path integrity work above ordinary feature
    work. This band holds the silent graph-write-corruption defects plus the two
    paths the bootstrap arms or depends on. Interim scaffolding only -
    tactic-attention-tier-ranking replaces the whole numeric scheme with
    lexicographic (tier, rank) and max-lifting, and
    tactic-attention-boost-scripts converts these boosts to tier/bug_fix marks."
phase: null
execution: null
validates: []
blocked_by:
  - tactic-graph-tick-node-lane-auto-merge
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# graph-auto-merge merges only a PR whose branch is current with origin/main and whose passing checks ran on that current base; when BEHIND the tick scripts gh api update-branch and defers the merge to a later green tick

## Context

Draft byproduct of the 2026-07-19 `/align-strategy` interview (strategy-graph-native-dispatch,
stale-base auto-merge clarification). A merged review PR's green CI had run on a
stale base; main went red after the merge. `graph-auto-merge`
(tactic-graph-tick-node-lane-auto-merge, PR #2904) gates on green CI +
`mergeable==MERGEABLE` + the `reviewed` marker + a fresh scope fingerprint — but
`MERGEABLE` does not mean up to date, so a PR behind main can merge on a verdict
computed against a base that no longer exists.

## Design (author-directed, from the interview)

Add a fifth conjunct to `graph-auto-merge`'s per-candidate gate: the PR branch
must be current with `origin/main`, and the passing checks must have run on that
current base.

- Sense currency via the PR's `mergeStateStatus` (`BEHIND`) or an equivalent
  base-oid comparison against `origin/main`.
- When BEHIND: the tick scripts the remediation itself — `gh api
  repos/{owner}/{repo}/pulls/<pr>/update-branch` — then skips the candidate this
  tick (checks re-run on the fresh base). A later tick merges when the verdict
  is green on the now-current base. Emit a `synced #<pr> (<id>)` stdout line.
- All scriptable steps of the done-phase merge path live in the dispatch router
  (the tick reconciler), never in a phase worker or the author.
- Regression routing after a sync stays owned by
  tactic-graph-review-exclusion-stall-recovery (WIP at drafting time): a red
  check reaches the fix worker via `needsReviewStallRecovery(ci: failing)`; a
  CONFLICTING PR takes the same fix demotion and the conflict itself routes to
  the `/fix-conflicts` conflict worker at re-provisioning (exit 11). This gate
  only updates the branch and defers — it never routes fix/conflict itself.

## Steelman resolution (recorded in the strategy clarification)

Diverged from GitHub-native branch protection (require-up-to-date) + merge
queue: that machinery solves stale-base CI but moves merge behavior into GitHub
config the graph cannot read, deepening delegation-github (which the serving
strategy recovers). The owned tick gate keeps merge keyed on graph state.

## Sequencing

`blocked_by: tactic-graph-tick-node-lane-auto-merge` — this edits the
`graph-auto-merge` script that PR #2904 introduces; it cannot land first. PR
#2904 lands as-is; the author accepted the interim window in which
`graph-auto-merge` can merge a stale-base green PR until this ships.

## Out of scope

- The stall-recovery reconciler's fix/conflict routing (owned by
  tactic-graph-review-exclusion-stall-recovery).
- The legacy label-gated `dispatch-auto-merge` (draining gh queue) — no
  up-to-date gate is added there.
