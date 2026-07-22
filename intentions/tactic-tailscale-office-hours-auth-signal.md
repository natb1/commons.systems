---
id: tactic-tailscale-office-hours-auth-signal
kind: tactic
statement: Router-host Tailscale auth state feeds the office-hours signal
  surface so a NeedsLogin on the stationary router host is visible at
  office-hours even when no human is on an interactive shell there
owner: human
status: delegated
parent: null
rationale: Split 2026-07-13 from the tactic-tailscale-shell-health-check draft
  (which bundled 'router host also feeds the office-hours signal') by
  /align-tactics round 1. The office-hours feed is a distinct, design-entangled
  surface with no existing local->cloud push path, so it is born-parked for
  author design ratification rather than auto-planned. Off the minimum
  signal-threshold path this round.
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
  reason: "Design decision needed before implementation (design-entangled,
    deferred to the author by the 2026-07-07 strategy interview). The
    office-hours signal surface today is a cloud-side function sampling external
    SaaS (GitHub/GA4/GSC/PSI) into Firestore
    (functions/src/project-signals-core.ts) — it has no path to observe a local
    machine's . Surfacing router-host auth state at office-hours needs a NEW
    push: either (a) the router host pushes its BackendState to a Firestore
    office-hours signal doc (new persisted surface + security-rules + a local
    systemd timer or dispatch-tick write), or (b) a graph/status-file signal the
    office-hours session reads locally on the router host. Option (a) also
    intersects the in-flight office-hours-snapshot machinery under
    strategy-graph-native-dispatch, so the author should pick the surface to
    avoid duplicating it. This surface is OFF the minimum signal-threshold path
    this round — the threshold's clauses (key-expiry-disabled [done],
    interactive shell-login check, next-incident-diagnosis) are met by
    tactic-tailscale-shell-health-check +
    tactic-wezterm-config-auth-diagnostics. Recommend: at office-hours pick (a)
    vs (b), reconcile with the strategy-graph-native-dispatch
    office-hours-snapshot producer if (a); then re-run /align-tactics to plan
    the chosen shape."
  since: 2026-07-13
  recommendation: null
pace_exempt: false
rounds: null
attributes: {}
---
# Router-host Tailscale auth state feeds the office-hours signal surface so a NeedsLogin on the stationary router host is visible at office-hours even when no human is on an interactive shell there
