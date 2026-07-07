---
id: tactic-tailscale-router-expiry-disable
kind: tactic
statement: Disable per-node key expiry for the dispatch-router host in the
  Tailscale admin console (one-time owner action; verify node shows 'Key expiry
  disabled')
owner: human
status: raw
parent: null
rationale: "Surfaced in the 2026-07-07 strategy interview: the design-out half
  of the strategy. Admin console → Machines → nixos → three-dot menu → Disable
  key expiry. Owner-only: requires the Tailscale admin login. Per the strategy's
  conditions, applies only while the router host stays a stationary home
  machine; re-enable if it ever becomes portable."
reading: null
gap: null
serves:
  - strategy-tailscale-auth-visibility
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
# Disable per-node key expiry for the dispatch-router host in the Tailscale admin console (one-time owner action; verify node shows 'Key expiry disabled')
