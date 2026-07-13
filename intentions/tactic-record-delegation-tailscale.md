---
id: tactic-record-delegation-tailscale
kind: tactic
statement: "Record delegation-tailscale: the mesh network's coordination server
  and auth are an undocumented third-party attachment"
owner: human
status: delegated
parent: null
rationale: "Surfaced in the 2026-07-07 strategy interview's delegation sweep: no
  delegation-*.md covers Tailscale, yet cross-machine SSH access (wezterm mux
  domains) depends on its coordination server and auth model —
  delegation-connectivity covers only the ISP layer. Per kind-delegation
  doctrine an attachment without a record has no divergence/irreversibility
  accounting and no review trigger. Owner interview needed to fill the record
  (divergence, recovery path — e.g. headscale as the self-hosted control-plane
  substitute, WireGuard as the floor). Born-parked 2026-07-13 by /align-tactics
  round 1 (off the signal path; needs the owner interview)."
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
office_hours:
  reason: "Owner interview needed to author intentions/delegation-tailscale.md: no
    delegation-*.md records Tailscale, yet cross-machine SSH (wezterm mux
    domains) depends on its coordination server and auth model
    (delegation-connectivity covers only the ISP layer). Per kind-delegation
    doctrine an unrecorded attachment has no divergence/irreversibility
    accounting or review trigger. The record needs the author's risk judgment on
    divergence, irreversibility, and the recovery path (e.g. headscale as the
    self-hosted control-plane substitute, WireGuard as the floor). Not
    claude-decidable. Recommend: at office-hours fill delegation-tailscale.md
    (divergence, irreversibility, recovery path) using
    delegation-connectivity.md as the template."
  since: 2026-07-13
  recommendation: null
pace_exempt: false
rounds: null
attributes: {}
---
# Record delegation-tailscale: the mesh network's coordination server and auth are an undocumented third-party attachment
