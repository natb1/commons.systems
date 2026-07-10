---
id: tactic-tailscale-shell-health-check
kind: tactic
statement: "Interactive-shell-login Tailscale auth check: BackendState !=
  Running prints a named banner with the ready login URL; router host also feeds
  the office-hours signal"
owner: ai
status: raw
parent: null
rationale: "Surfaced in the 2026-07-07 strategy interview. Detection half of the
  strategy: a fast local check (tailscale status --json over the local socket,
  milliseconds) at interactive shell init only — non-interactive/dispatch shells
  excluded per clarification. On NeedsLogin it should name the diagnosis and
  include the auth URL (tailscale status already prints 'Log in at: <url>') so
  resolution is one click, not a debugging session. The office-hours feed
  mechanism for the router host (Firestore metrics sampler vs a graph/status
  signal) is design-entangled and left to /align-tactics."
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
# Interactive-shell-login Tailscale auth check: BackendState != Running prints a named banner with the ready login URL; router host also feeds the office-hours signal
