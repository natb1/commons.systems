---
id: tactic-phase-boot-offload-launcher
kind: tactic
statement: Offload precomputable phase-boot prelude to the launcher and
  propagate review-fix's dropped in-session merge to qa-fix
owner: ai
status: raw
parent: null
rationale: "Boot-boilerplate facet of the standup-cost lever
  (strategy-token-economy clarification 12). The launcher chain
  (dispatch-launch-worker -> provision-node-worktree -> dispatch-merge-main)
  already runs the deterministic prelude before the session exists, and passes N
  and the worktree path as prompt args, yet phase skills re-derive them
  in-session; boot judgment content is near-zero. review-fix already dropped its
  in-session fetch/merge (review-fix/SKILL.md:199-201, ~3-4 boot round-trips)
  because the launcher merged; qa-fix has not (re-does the merge at Step 0.5,
  qa-fix/SKILL.md:227-233, plus a redundant second context-pack, ~6-7
  round-trips). Propagate the review-fix pattern to qa-fix and push
  precomputable prelude (N, PR link, merge-base, context-pack) into the launcher
  as a prepared file. Freshness-bounded: launcher precompute is allowed only for
  values fixed at launch or produced by the launcher's own merge step, never a
  value that can go stale against the merged tree (qa-fix's diff must stay
  post-merge). Parity-gated and measured by tactic-phase-standup-audit-lens."
reading: null
gap: null
serves:
  - strategy-token-economy
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention:
  boost: 15
  override: null
  rationale: "Author-directed 2026-07-16: top-rank the three token-economy
    standup-cost tactics above the working frontier (below the main-health
    sentinel at 100, which the write-path guard reserves).
    strategy-token-economy carries no strategy-level boost, so the tactic
    carries the full weight itself; boost 15 clears the current working max
    (~14.5)."
phase: null
execution: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Offload precomputable phase-boot prelude to the launcher and propagate review-fix's dropped in-session merge to qa-fix

Surfaced in the /align-strategy standup-cost round ([[strategy-token-economy]]
clarification 12, 2026-07-16 interview). Boot-boilerplate facet of the
standup-cost lever; gated on [[tactic-phase-standup-audit-lens]].

The launcher chain (`dispatch-launch-worker` → `provision-node-worktree` →
`dispatch-merge-main`) already runs the deterministic prelude before the session
exists and passes N + the worktree path as prompt args (`dispatch-launch-worker:164`),
yet phase skills re-derive them in-session. review-fix is the exemplar: it
explicitly dropped its in-session fetch/merge (`review-fix/SKILL.md:199-201`)
because the launcher merged (~3–4 boot round-trips). qa-fix has NOT adopted this
— it re-does the merge (`qa-fix/SKILL.md:227-233`, Step 0.5) plus a redundant
second `dispatch-context-pack`, at ~6–7 round-trips. Work: propagate the
review-fix pattern to qa-fix; push precomputable prelude (N, PR link, merge-base,
context-pack) into the launcher as a prepared file. **Freshness bound:** launcher
precompute is allowed only for values fixed at launch or produced by the
launcher's own merge step — never a value that can go stale against the merged
tree, so qa-fix's diff must stay post-merge.
