---
id: delegation-os-hardware
kind: delegation
statement: The working environment delegated to Microsoft — Windows hosting a
  WSL2 Linux userland on owned hardware
owner: human
status: codified
parent: null
serves: []
rationale: >-
  The development machine runs Windows with the actual working environment —
  repos, toolchain, dispatch chain — living in a WSL2 Linux userland on owned
  hardware. The delegation is shallower than it looks for the same reason
  delegation-firebase's is: what Microsoft holds is hosting convenience for a
  userland that is already portable, so the substitute path is re-hosting the
  same Linux environment on bare metal. This record is also the substrate
  half of strategy-open-weight-readiness: its condition that local-inference
  hardware stays affordable is read against the hardware recorded here.
reading: null
gap: null
clarifications: []
tooling_goals: []
success_signal: null
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
    recovery_cost: days — reprovision the dev environment and peripherals on
      owned hardware
    gated: false
    last_exercised: null
  classification: platform
  non_delegable_floor: the ability to provision the working environment from
    scratch on a fresh machine
  review_trigger: Windows changes hostile to WSL2; hardware refresh;
    local-inference requirements from strategy-open-weight-readiness
  last_assessed: 2026-07-02
---
# The working environment delegated to Microsoft — Windows hosting a WSL2 Linux userland on owned hardware
