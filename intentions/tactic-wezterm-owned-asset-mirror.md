---
id: tactic-wezterm-owned-asset-mirror
kind: tactic
statement: pin the WezTerm Windows GUI to an asset the project owns, so an
  upstream repackage of the same build can never break a build
owner: ai
status: raw
parent: null
rationale: "Retained from the 2026-07-23 /align-strategy round on the wezterm
  pin. nix/home/wezterm-windows.nix:30 content-pins a rolling upstream URL by
  sha256, so upstream republishing the SAME build with different bytes breaks
  nixos-build with no commit involved — twice in eight days (2026-07-22 PR 2921,
  then again 2026-07-23 04:50Z). The pin's requirement is BUILD identity;
  fetchurl's sha256 enforces BYTE identity, a stronger property upstream does
  not maintain. Greenfield endorsed by the author 2026-07-23: mirror the zip to
  an owned, never-overwritten asset and pin that. Full diagnosis, rejected
  alternatives, and the general invariant: strategy-distribute-workflow's
  2026-07-23 clarification."
reading: null
gap: null
serves:
  - strategy-distribute-workflow
  - strategy-owned-orchestration
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
# pin the WezTerm Windows GUI to an asset the project owns, so an upstream repackage of the same build can never break a build

Retained context from the 2026-07-23 `/align-strategy` round. Not planned —
`/align-tactics` owns decomposition and the quality bar.

## The invariant to preserve

The Windows GUI (mux client) and the WSL `wezterm-mux-server` must be the **same
wezterm build**, or the mux PDU handshake fails and the GUI window closes on
connect (`nix/home/wezterm-windows.nix` header). That is *build* identity —
`version` / `rev`. It is not byte identity.

## Why the current mechanism fails

`nix/home/wezterm-windows.nix:30` fetches
`https://github.com/wez/wezterm/releases/download/nightly/WezTerm-windows-nightly.zip`
through `pkgs.fetchurl` with `sha256 = pin.windowsZipHash`
(`nix/home/wezterm-pin.nix`). `fetchurl`'s hash is a **byte-identity** pin
against a URL upstream overwrites in place, so it enforces a stronger property
than the invariant needs — and one upstream does not maintain.

Evidence (verified 2026-07-23):

| when | pinned hash | live asset | build in zip |
|---|---|---|---|
| 2026-07-22 (PR 2921) | `42256640…` | matched | `20260716-195552-76b606ec` |
| 2026-07-23 04:50Z | `42256640…` | `6d3bd51d…` | `20260716-195552-76b606ec` — **unchanged** |

Same build, different bytes, twice in eight days. The 2026-07-22 fix survived
under 24 hours. Reproduce with:

```
gh api repos/wez/wezterm/releases/tags/nightly \
  --jq '.assets[] | select(.name=="WezTerm-windows-nightly.zip") | .digest'
```

## Sketch of the fix

`nix/home/sync-wezterm.sh` already fetches the zip and derives `VERSION` from
its internal `WezTerm-windows-<version>` directory name (lines 29–38) — that
derivation *is* the build-identity assertion. Extend it, on deliberate upgrade
only:

1. fetch the upstream nightly zip (existing behavior);
2. assert it unpacks to `WezTerm-windows-$VERSION` (existing behavior, promoted
   to an explicit hard check);
3. publish **those exact bytes** as an asset the project owns, under a
   version-scoped tag (e.g. `wezterm-$VERSION`) that is never overwritten;
4. rewrite `windowsZipHash` from the mirror, and repoint
   `wezterm-windows.nix`'s `url` at the mirror.

The mirror host is not fixed to GitHub releases — any store that will not
overwrite a published object satisfies the invariant.

## Out of scope

- Cross-building the Windows GUI from source at `rev`. That is the ideal
  greenfield (invariant true by construction, matching the Playwright axis's
  endorsed shape) but is a large, unscoped Rust/DirectWrite/Direct3D
  cross-compilation project. Named as the target, deliberately not planned here.
- Removing `nix/home/` from CI's built closure — that is
  `tactic-nix-instance-flake-extraction` (phase `implement`), which lands
  regardless and fixes the false CI red but not the workstation break.
- The immediate unblock. Applied 2026-07-23 as PR 2953: `windowsZipHash`
  refreshed to `sha256-bTvVHVpB8Mh6g2lF2RB9Egs2IApanVb5Z1R2M9UCZZ8=` for the
  unchanged build `20260716-195552-76b606ec`, with `version`/`rev`/`srcHash`/
  `cargoHash` left alone. That is a holding action on the same mutable URL, so
  it goes stale again on the next upstream repackage and does not reduce this
  tactic's scope. The third such refresh is the signal that no refresh cadence
  fixes a byte pin against an overwritable reference.
