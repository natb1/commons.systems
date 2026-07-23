---
id: tactic-graph-census-2026-07-11
kind: tactic
statement: "census: drain accumulated reconciliation debt (52 owed prune(s), 0
  unverified PR-merge(s), 0 orphan(s)) — prune done-but-present nodes with edge
  repair, absorb unverified PR-merges, and repair orphans"
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
phase: null
execution: null
validates: []
blocked_by: []
office_hours:
  reason: "Census run 2026-07-23: 58 of 61 owed prunes drained across 6
    graph-commits, with inbound blocked_by repaired on 14 live nodes in the same
    commits; validate-graph ok (358 nodes, 0 unresolved prose refs, 0 orphans, 0
    unverified PR-merges). 3 nodes are deliberately NOT pruned and block
    resolution of this census node: (1) tactic-domain-selection-scoring - its
    2026-07 scoring dossier (8 delegation records scored, 2 selects) is the sole
    copy in the repo and its live dependent tactic-domain-selection-owner-review
    exists to ratify it; relocate the dossier to strategy-domain-selection
    before pruning. (2) tactic-flake-unit-tests-select-tick - phase done but no
    merged work; claimed substitute PR #2933 is still an open draft and the
    guard is absent from main. (3) tactic-phase-skill-node-targets - one round-2
    finding is still true and homeless: the .claude/hooks/dispatch-stop.sh:62-63
    backstop comment asserts the backstop does not apply the reset-dance, stale
    now that graph-commit is far-ahead-safe."
  since: 2026-07-23
  recommendation: "Resolve the three holds, then prune them and set this node
    phase -> done to clear the recurrence latch. (1) relocate the scoring
    dossier to strategy-domain-selection, then prune both it and its dependent's
    blocker edge; (2) treat tactic-flake-unit-tests-select-tick as a
    graph-integrity defect - reset it to an open phase (as was done for
    tactic-main-red-sync-completion-test) or land PR #2933, do not prune a
    falsely-done node; (3) fix the stale dispatch-stop.sh comment, or carry it
    as a follow-up tactic, then prune."
pace_exempt: false
rounds: null
attributes:
  census: true
  batch:
    donePresent:
      - tactic-align-curriculum-maintenance
      - tactic-align-gate-strategy-phase
      - tactic-align-session-claiming
      - tactic-analytics-vitals-delivery
      - tactic-approve-hook-command-separators
      - tactic-attention-critical-path-propagation
      - tactic-audio-position-persist
      - tactic-blog-feed-parser-correctness
      - tactic-blog-prerender-injection
      - tactic-budget-balance-observations
      - tactic-budget-display-input-edges
      - tactic-budget-etl-balance-history
      - tactic-budget-idb-atomic-writes
      - tactic-budget-overlap-anchor-merge
      - tactic-budget-week-axis-consistency
      - tactic-ci-change-detection-transitive
      - tactic-context-chunk-selection
      - tactic-copy-approval-planning-rule
      - tactic-copy-change-audit-instrument
      - tactic-crypto-core-consolidate
      - tactic-dispatch-lifecycle-sensor
      - tactic-dispatch-script-hardening
      - tactic-domain-selection-scoring
      - tactic-fellspiral-prerender-feed-parity
      - tactic-firebase-integration-audit
      - tactic-firebase-rules-residue-prune
      - tactic-graph-router-transitions
      - tactic-graph-self-consistency-sweep
      - tactic-graph-separability-audit
      - tactic-grounding-gap-analysis
      - tactic-grounding-research-skill
      - tactic-indieweb-syndication-markup
      - tactic-main-qa-triage-before-provision
      - tactic-nix-export-nixos-modules
      - tactic-phase-skill-node-targets
      - tactic-print-annotations
      - tactic-print-annotations-epub
      - tactic-print-bookmarks-rule-privacy
      - tactic-print-spread-navigation
      - tactic-print-viewer-save-reliability
      - tactic-reading-program-text-coverage
      - tactic-reading-review-candidate-extension
      - tactic-reading-review-skill
      - tactic-recover-publishing-reading
      - tactic-review-curriculum-coverage-sensor
      - tactic-review-lows-attention-tools
      - tactic-review-lows-publishing
      - tactic-review-lows-shared-infra
      - tactic-shared-ui-correctness
      - tactic-sidecar-cross-tab-safety
      - tactic-token-economy-sensor
      - tactic-token-hygiene-sweep
    mergedUnabsorbed: []
    orphans: []
---
# census: drain reconciliation debt (2026-07-11)

## Context

The standing per-tick reconciliation duty (dispatch-graph-census) found accumulated reconciliation debt of 52, at or above the birth threshold. This born-parked census carries the batch to drain. It is the recurrence latch: no second census is born while this one stays open (phase !== done). Drain the batch, then resolve this node to clear the latch.

## Batch

- Owed prunes (done-but-present) (52):
  - tactic-align-curriculum-maintenance
  - tactic-align-gate-strategy-phase
  - tactic-align-session-claiming
  - tactic-analytics-vitals-delivery
  - tactic-approve-hook-command-separators
  - tactic-attention-critical-path-propagation
  - tactic-audio-position-persist
  - tactic-blog-feed-parser-correctness
  - tactic-blog-prerender-injection
  - tactic-budget-balance-observations
  - tactic-budget-display-input-edges
  - tactic-budget-etl-balance-history
  - tactic-budget-idb-atomic-writes
  - tactic-budget-overlap-anchor-merge
  - tactic-budget-week-axis-consistency
  - tactic-ci-change-detection-transitive
  - tactic-context-chunk-selection
  - tactic-copy-approval-planning-rule
  - tactic-copy-change-audit-instrument
  - tactic-crypto-core-consolidate
  - tactic-dispatch-lifecycle-sensor
  - tactic-dispatch-script-hardening
  - tactic-domain-selection-scoring
  - tactic-fellspiral-prerender-feed-parity
  - tactic-firebase-integration-audit
  - tactic-firebase-rules-residue-prune
  - tactic-graph-router-transitions
  - tactic-graph-self-consistency-sweep
  - tactic-graph-separability-audit
  - tactic-grounding-gap-analysis
  - tactic-grounding-research-skill
  - tactic-indieweb-syndication-markup
  - tactic-main-qa-triage-before-provision
  - tactic-nix-export-nixos-modules
  - tactic-phase-skill-node-targets
  - tactic-print-annotations
  - tactic-print-annotations-epub
  - tactic-print-bookmarks-rule-privacy
  - tactic-print-spread-navigation
  - tactic-print-viewer-save-reliability
  - tactic-reading-program-text-coverage
  - tactic-reading-review-candidate-extension
  - tactic-reading-review-skill
  - tactic-recover-publishing-reading
  - tactic-review-curriculum-coverage-sensor
  - tactic-review-lows-attention-tools
  - tactic-review-lows-publishing
  - tactic-review-lows-shared-infra
  - tactic-shared-ui-correctness
  - tactic-sidecar-cross-tab-safety
  - tactic-token-economy-sensor
  - tactic-token-hygiene-sweep
- Unverified PR-merges: none
- Orphans (dangling parent/serves): none

## How to drain

Re-derive the batch at execution (the snapshot above may have aged): prune each done-but-present node via `graph-commit --prune <id>`, removing any inbound `blocked_by` entry that names it in the same commit; absorb any unverified PR-merge (reconcile-graph-merged); repair any orphan's dangling `parent`/`serves`. Then set this node's `phase` to `done` and prune it so the recurrence latch clears.

