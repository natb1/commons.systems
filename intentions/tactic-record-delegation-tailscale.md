---
id: tactic-record-delegation-tailscale
kind: tactic
statement: "Record delegation-tailscale: the mesh network's coordination server
  and auth are an undocumented third-party attachment"
owner: human
status: raw
parent: null
rationale: "Surfaced in the 2026-07-07 strategy interview's delegation sweep: no
  delegation-*.md covers Tailscale, yet cross-machine SSH access (wezterm mux
  domains) depends on its coordination server and auth model —
  delegation-connectivity covers only the ISP layer. Per kind-delegation
  doctrine an attachment without a record has no divergence/irreversibility
  accounting and no review trigger. Owner interview needed to fill the record
  (divergence, recovery path — e.g. headscale as the self-hosted control-plane
  substitute, WireGuard as the floor)."
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
# Record delegation-tailscale: the mesh network's coordination server and auth are an undocumented third-party attachment
