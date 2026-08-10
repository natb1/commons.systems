---
id: delegation-os-hardware
kind: delegation
statement: The working environment delegated to Microsoft — Windows hosting a
  WSL2 Linux userland on owned hardware
owner: human
status: codified
parent: null
rationale: "The development machine runs Windows with the actual working
  environment — repos, toolchain, dispatch chain — living in a WSL2 Linux
  userland on owned hardware. The delegation is shallower than it looks for the
  same reason delegation-firebase's is: what Microsoft holds is hosting
  convenience for a userland that is already portable, so the substitute path is
  re-hosting the same Linux environment on bare metal. This record is also the
  substrate half of strategy-open-weight-readiness: its condition that
  local-inference hardware stays affordable is read against the hardware
  recorded here. Axis resolution (tactic-delegation-classification-derivation,
  2026-08-04): recovery_cost resolved to `moderate` — the recorded assessment
  was days to reprovision the dev environment and peripherals on owned
  hardware."
reading: null
gap: null
serves: []
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
attributes:
  delegatee: Microsoft (Windows); hardware owned outright
  delegated: the host operating system under the working environment
  origin: inherited
  divergence:
    level: moderate
    imported:
      - telemetry and data collection
      - forced update cadence
      - ecosystem push (account sign-in, bundled services)
    contradictions: []
  irreversibility:
    recovery_path: substitute — re-host the existing WSL2 Linux userland on
      bare-metal Linux; the working environment already lives there
    recovery_cost: moderate
    gated:
      level: none
      note: no gating stated — the working environment is a WSL2 Linux userland that
        re-hosts on bare metal unchanged
    last_exercised: null
  non_delegable_floor: the ability to provision the working environment from
    scratch on a fresh machine
  review_trigger: Windows changes hostile to WSL2; hardware refresh;
    local-inference requirements from strategy-open-weight-readiness
  last_assessed: 2026-07-02
  household:
    shared: false
    basis: The author's development machine and WSL2 working environment; not
      household-shared.
    consent: []
    preferences: []
---
# The working environment delegated to Microsoft — Windows hosting a WSL2 Linux userland on owned hardware
