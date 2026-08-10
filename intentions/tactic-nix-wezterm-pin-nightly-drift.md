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
office_hours:
  reason: "The plan cannot be authored without an author decision this node does
    not record. The tactic's own OPEN QUESTION -- whether upstream publishes an
    immutable per-build nightly URL alongside the rolling `nightly` tag -- was
    resolved NO by this session on 2026-08-09 (GET
    /repos/wezterm/wezterm/releases/tags/20260716-195552-76b606ec -> 404; the
    `nightly` release's only Windows assets are WezTerm-windows-nightly.zip +
    .sha256, asset updated_at 2026-08-09T04:21:22Z, i.e. re-uploaded again
    today; wezterm.org's install docs list exactly two Windows URLs, the
    immutable stable per-build zip and the mutable nightly zip). That forecloses
    the tactic's own preferred, smallest-diff, guarantee-preserving fix, and
    every remaining option carries a consequence the author must ratify.
    Proposed clarification for ratification: 'Upstream publishes no immutable
    per-build nightly URL -- only the rolling `nightly` tag, overwritten in
    place. Which remediation should this tactic take: (a) pin the immutable
    stable release 20240203-110809-5046fc22 on BOTH the Windows zip and the WSL
    source build (per wezterm-pin.nix:1-21's same-build contract), accepting a
    ~2.5-year downgrade of the daily-driver terminal since no non-prerelease has
    been cut since 2024-02-03; (b) replace the Nix fixed-output content-pin with
    an activation-time fetch, which the tactic's own rationale says silently
    reintroduces the documented GUI/WSL mux PDU handshake failure and which CI
    cannot disprove (ubuntu-latest never runs the /mnt/c/Users-gated activation
    script), so this requires naming a substitute version-match guarantee; or
    (c) mirror the asset to an owned, never-overwritten location -- which is
    already claimed by the pre-existing draft tactic-wezterm-owned-asset-mirror
    under strategy-distribute-workflow and strategy-owned-orchestration, so
    choosing it also requires deciding whether this node supersedes, depends on,
    or distinguishes itself from that draft, a cross-strategy graph-shape call a
    per-node finalize cannot make.' Each option is a product/requirements
    decision, not a mechanism an autonomous plan may pick. Note also that the
    serving strategy's own record carries no `conditions` entries at all, so
    none of these premises is captured upstream either; because a per-node
    session cannot write the strategy, the ratified answer should land here on
    this tactic. The diagnosis itself is NOT in doubt -- it was confirmed
    against the live failing-run log (run 30962835594, 2026-08-05: `hash
    mismatch in fixed-output derivation '.../WezTerm-windows-nightly.zip.drv'`,
    matching nix/home/wezterm-pin.nix:42 exactly) and needs no re-verification
    when this unparks. Recommend: the author picks one of (a)/(b)/(c) above (or
    another remediation), records it as a dated clarification or condition via
    /align on strategy-main-health or directly on this tactic, and then re-runs
    /align-tactics tactic-nix-wezterm-pin-nightly-drift to author the plan
    against the ratified choice."
  since: 2026-08-09
  recommendation: null
  session_type: other
pace_exempt: false
rounds: null
attributes: {}
---
# Main Nix Validate is permanently red because nix/home/wezterm-pin.nix pins a hash for a NIGHTLY artifact republished under the same name -- stop pinning a moving target so the check is green by construction rather than by periodic hash-chasing
