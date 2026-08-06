---
id: tactic-nix-wezterm-pin-nightly-drift
kind: tactic
statement: Main Nix Validate is permanently red because nix/home/wezterm-pin.nix
  pins a hash for a NIGHTLY artifact republished under the same name -- stop
  pinning a moving target so the check is green by construction rather than by
  periodic hash-chasing
owner: ai
status: raw
parent: null
rationale: "Ruled FILE in the 2026-08-05 /align interview. Bumping
  windowsZipHash only buys time until the next nightly republish, so the check
  re-reds on upstream's schedule rather than on any change of ours. A
  permanently-red REQUIRED check is corrosive in a specific way: it trains every
  session to read red-main as normal, destroying exactly the signal
  strategy-main-health exists to keep meaningful -- which is why this serves
  main health rather than being tolerated as cosmetic. Candidate fixes: pin a
  stable release instead of the nightly, or drop the hash check for that input.
  RECORDED CAVEAT: the mechanism was taken from the session's working plan and
  was NOT re-verified against nix/home/wezterm-pin.nix during the interview, so
  the implementing session must confirm the diagnosis before acting on it."
reading: null
gap: null
serves:
  - strategy-main-health
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
# Main Nix Validate is permanently red because nix/home/wezterm-pin.nix pins a hash for a NIGHTLY artifact republished under the same name -- stop pinning a moving target so the check is green by construction rather than by periodic hash-chasing
