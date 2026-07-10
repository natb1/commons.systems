---
id: tactic-node-toolchain-single-source
kind: tactic
statement: Derive the nix dev-shell node version from .node-version (or assert
  equality in the shell hook) so CI and dev shell cannot silently drift
owner: ai
status: raw
parent: null
rationale: "Surfaced at the 2026-07-07 /align-strategy operational-mechanics
  round: CI pins node via .node-version (22.22.3, dodging the 22.23.0 undici
  OAuth regression) while flake.nix ships nodejs_22 from nixos-unstable, so
  patch-level drift is invisible until something breaks — the Playwright browser
  mismatch already did (local acceptance runs blocked, CI authoritative).
  Options in preference order: read .node-version in the flake and
  build/override that exact version; or cheaper, a dev-shell hook that compares
  `node --version` to .node-version and fails loudly on mismatch. Either makes
  the drift impossible or at least loud. Retained as a draft for
  /align-tactics."
reading: null
gap: null
serves:
  - strategy-distribute-workflow
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
# Derive the nix dev-shell node version from .node-version (or assert equality in the shell hook) so CI and dev shell cannot silently drift
