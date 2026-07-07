---
id: strategy-tailscale-auth-visibility
kind: strategy
statement: "Tailscale auth state is never a mystery: expiry is designed out on
  stationary nodes, and any NeedsLogin surfaces as a named diagnosis at shell
  login and office-hours"
owner: human
status: refining
parent: strategy-autonomous-execution
rationale: "Motivated by the 2026-07-07 wezterm incident: tailscale on the
  dispatch-router host was logged out (BackendState NeedsLogin, empty
  Self.DNSName), the wezterm config's tailscale-driven ssh_domains discovery
  silently produced an empty domain list, and the only symptom was a Windows GUI
  window closing instantly with a cryptic log line ('desired default domain
  nixos was not found in mux'). The failure surfaced two layers and one OS away
  from its cause, and nothing in the system named the diagnosis; resolution cost
  a human debugging session plus an interactive browser login. Under parent
  strategy-autonomous-execution this is an attention-economics defect: the
  substrate the autonomous chain and the author's daily work run on can silently
  lose its network/auth footing, converting a known, nameable state into an
  unbounded forensic escalation. The strategy takes a two-sided posture split by
  node role. On the stationary dispatch-router host, the expiry class is
  designed out entirely: per-node key expiry is disabled, accepting that console
  revocation remains the active control while the passive expiry backstop is
  judged low-value on a stationary home machine. On portable client machines the
  passive backstop keeps its value, so expiry stays enabled and the requirement
  is visibility only — auth state apparent at interactive shell login,
  resolution manual. Fully autonomous re-auth via stored reusable auth keys was
  considered and rejected: a silently stealable credential that can enroll new
  devices is a worse surface than either alternative."
reading: router-host node key expiry at Tailscale default (enabled); no auth
  health check exists on any machine; wezterm config fails silently to an empty
  ssh_domains on NeedsLogin (2026-07-07 incident)
gap: reading 'router-host node key expiry at Tailscale default (enabled); no
  auth health check exists on any machine; wezterm config fails silently to an
  empty ssh_domains on NeedsLogin (2026-07-07 incident)' does not meet threshold
  'router-host node shows key expiry disabled in the admin console, an
  interactive-shell-login check names Tailscale auth state on each machine, and
  the next NeedsLogin incident is first diagnosed by the named check rather than
  forensic debugging'
serves:
  - virtue-progressive-detachment
  - virtue-alignment-of-attachments
recovers: []
clarifications:
  - question: Does this strategy cover all expiring credentials in the environment
      substrate (GPG pinentry cache, Drive mounts, gh tokens) or Tailscale only?
    answer: Tailscale only. Generalizing to a substrate-wide credential-health
      strategy was offered and declined; other credential classes remain out of
      scope until they earn their own strategy. Recorded 2026-07-07 interview.
  - question: How autonomous should re-auth be, given the security trade-off?
    answer: Full autonomy via a stored reusable auth key is rejected — it creates a
      silently stealable credential that can enroll new devices, a worse surface
      than keeping one known node alive. For the stationary router host,
      per-node key expiry is disabled instead (the failure class disappears;
      console revocation remains the active control, and tailnet membership
      alone grants no shell access since SSH still authenticates on top). On
      portable clients, resolution stays manual — only visibility is required.
      Recorded 2026-07-07 interview.
  - question: Which node is 'the node' whose expiry is designed out?
    answer: The node that hosts the dispatch router. It remains a stationary home
      machine, and no portable machine needs to serve tailscale hostnames.
      Portable machines exist today that must access tailscale hosts as clients;
      if those become unauthenticated, that must become apparent at interactive
      shell login. Recorded 2026-07-07 interview.
  - question: Where does the diagnosis surface, and in which shells?
    answer: Interactive shell login on each machine, plus the office-hours
      status-signal surface for the router host. Non-interactive shells (the
      dispatch fleet) are excluded — a check firing in every bg agent session
      adds latency and noise where no human is looking; those sessions rely on
      the office-hours signal. Recorded 2026-07-07 interview.
  - question: Does disabling key expiry on the router host remove the need for
      detection there?
    answer: No. Manual `tailscale logout`, tailscaled state loss, and reinstall
      still produce NeedsLogin; the detection net stays in scope on the router
      host as a safety net for the residual causes. Recorded 2026-07-07
      interview.
tooling_goals: []
success_signal:
  observable: a Tailscale NeedsLogin event on any machine surfaces as a named
    diagnosis at interactive shell login (and at office-hours for the router
    host) before any downstream tool failure is debugged
  sensor: the shell-login health check itself (tailscale status BackendState),
    plus owner review at office-hours of the next incident's resolution trace
  threshold: router-host node shows key expiry disabled in the admin console, an
    interactive-shell-login check names Tailscale auth state on each machine,
    and the next NeedsLogin incident is first diagnosed by the named check
    rather than forensic debugging
  is_proxy: false
attention: null
phase: null
execution: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes:
  conditions:
    - the dispatch-router host remains a stationary home machine; if it becomes
      portable, key expiry is re-enabled there and the expiry-design-out no
      longer applies to it
    - no portable machine needs to serve tailscale hostnames — hosts stay
      stationary; portable machines are clients only
    - Tailscale remains the mesh/SSH substrate for cross-machine access
    - per-node key-expiry disable remains available on the current Tailscale
      plan tier
---
# Tailscale auth state is never a mystery: expiry is designed out on stationary nodes, and any NeedsLogin surfaces as a named diagnosis at shell login and office-hours
