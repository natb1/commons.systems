---
id: tactic-wezterm-config-auth-diagnostics
kind: tactic
statement: wezterm.lua ssh_domains discovery fails loudly on Tailscale
  NeedsLogin instead of silently returning an empty domain list
owner: ai
status: raw
parent: null
rationale: "Surfaced in the 2026-07-07 strategy interview, directly from the
  motivating incident. nix/home/wezterm.nix's generated Lua parses tailscale
  status --json and quietly yields zero ssh_domains when Self.DNSName is empty
  (BackendState NeedsLogin), so wezterm-gui dies with the cryptic 'desired
  default domain nixos was not found in mux'. The config should detect
  BackendState != Running and wezterm.log_error a named diagnosis ('tailscale is
  logged out on <host> — run: sudo tailscale up') so the wezterm log itself
  carries the root cause; optionally surface it in the GUI rather than
  terminating bare."
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
# wezterm.lua ssh_domains discovery fails loudly on Tailscale NeedsLogin instead of silently returning an empty domain list
