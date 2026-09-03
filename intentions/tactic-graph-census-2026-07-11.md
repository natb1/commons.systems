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
blocked_by:
  - tactic-flake-unit-tests-select-tick
superseded_by: []
supersession_expiry: null
office_hours: null
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

