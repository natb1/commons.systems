---
id: tactic-tailscale-router-expiry-disable
kind: tactic
statement: Disable per-node key expiry for the dispatch-router host in the
  Tailscale admin console (one-time owner action; verify node shows 'Key expiry
  disabled')
owner: human
status: codified
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
clarifications:
  - question: When was the console action performed and how was it verified?
    answer: "Owner disabled key expiry for the nixos node in the Tailscale admin
      console on 2026-07-07; machine-side verification: tailscale status --json
      shows Self.KeyExpiry null (an expiry-enabled node carries a timestamp).
      Recorded 2026-07-07."
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
# Disable per-node key expiry for the dispatch-router host in the Tailscale admin console (one-time owner action; verify node shows 'Key expiry disabled')
