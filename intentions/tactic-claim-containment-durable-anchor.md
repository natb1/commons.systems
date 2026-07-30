---
id: tactic-claim-containment-durable-anchor
kind: tactic
statement: Anchor a claimed node's freeze in durable state rather than the
  daemon-backed session registry, so a registry loss cannot silently free an
  undeclared pass without firing the fuse
owner: ai
status: raw
parent: null
rationale: "Byproduct of the 2026-07-29 /align-strategy dispatch-containment
  interview; the first of two recorded leaks in the terminal-trichotomy
  containment. worktree_has_live_session reads `claude agents --json`, described
  by its own helper header as the daemon-backed registry of live sessions. On a
  daemon restart, host reboot, or job-entry GC, a held-for-debug session stops
  reading as live: the node becomes selectable with no declaration ever made,
  and the fuse does NOT fire because nothing was reaped by dispatch-self-close —
  the evidence evaporated, so the case is indistinguishable from 'no pass ever
  ran'. Fix direction: a durable record that a pass started and never declared,
  surviving registry loss. Adjacent tactic-graph-router-live-worker-read-robust
  covers tolerating an empty or partial read and does NOT close this, because
  after a genuine restart the read is correct and still reports no live session.
  Frequency of registry loss is reasoned about, not measured — worth quantifying
  during planning."
reading: null
gap: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention:
  boost: 20
  override: null
  rationale: "Bootstrap re-scale 2026-07-30: Waves B-D of a three-band interim
    scale (50 / 20 / 10) - dispatch-containment and evidence-custody work that
    follows the Wave-A write-path fixes. Interim scaffolding only;
    tactic-attention-tier-ranking and tactic-attention-boost-scripts retire this
    numeric scheme."
phase: null
execution: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Anchor a claimed node's freeze in durable state rather than the daemon-backed session registry, so a registry loss cannot silently free an undeclared pass without firing the fuse
