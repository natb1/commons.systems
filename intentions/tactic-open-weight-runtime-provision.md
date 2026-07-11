---
id: tactic-open-weight-runtime-provision
kind: tactic
statement: Provision the local open-weight inference runtime — install a server,
  pull a current coding model, verify a prompt round-trip
owner: human
status: delegated
parent: null
rationale: "The open-weight recovery drill (tactic-recovery-drill-open-weight)
  needs a working local-inference substrate first. Provisioning is author work:
  host installs, model choice against owned hardware, and the
  hardware-affordability observation that delegation-os-hardware's
  review_trigger and strategy-open-weight-readiness's conditions both read. The
  runtime is strategy-open-weight-readiness's standing substrate ('keep the
  substrate warm'), minted this round because the drill is the first consumer —
  honest multi-entry serves per the artifact-owner rule."
reading: null
gap: null
serves:
  - strategy-open-weight-readiness
  - strategy-exercise-recovery-paths
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
  reason: "Author-only: installing an inference server and choosing a model
    against owned hardware needs host access (sudo/installs) and owner judgment
    on VRAM/cost trade-offs. About 30 author-minutes with the recommendation in
    hand."
  since: 2026-07-11
  recommendation: "Install a local inference server on the dev host (ollama is the
    low-friction path: `nix run nixpkgs#ollama -- serve`, or install per
    platform); pull a current open-weight coding model sized to the hardware
    (e.g. qwen2.5-coder:32b if VRAM allows, else the 14b/7b quant); verify one
    prompt round-trip against a repo file. Record which model/quant fits the
    owned hardware — that observation feeds delegation-os-hardware's
    review_trigger ('local-inference requirements from
    strategy-open-weight-readiness') and unblocks
    tactic-recovery-drill-open-weight."
pace_exempt: false
rounds: null
attributes: {}
---
# Provision the local open-weight inference runtime — install a server, pull a current coding model, verify a prompt round-trip
