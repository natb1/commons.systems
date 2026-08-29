# Pinned WezTerm nightly — single source of truth.
#
# Both the WSL package (wezterm.nix, built from source at `rev`) and the Windows
# GUI binary (wezterm-windows.nix, the matching nightly zip) are pinned to the
# SAME upstream build here, so the mux client (Windows GUI) and server (WSL
# wezterm-mux-server) always speak the same PDU protocol version. Drift between
# the two is what makes the GUI window close on connect with a version error.
#
# Why a pin at all: upstream distributes exactly ONE Windows nightly zip (the
# latest), overwriting it in place, while nixpkgs pins a *snapshot* nightly by
# commit. Left to their own devices the two sides only match by luck. Pinning
# both to one commit here makes the match deterministic and reproducible.
#
# `version` is authoritative and is read from the distributed Windows binary
# itself (the zip's internal `WezTerm-windows-<version>` directory name), NOT
# the upstream `nightly` git ref — that ref is frequently stale and points at a
# different commit than the published assets.
#
# Regenerate on every deliberate upgrade with:  nix/home/sync-wezterm.sh
# (that script resolves the current nightly commit + all three hashes and
# rewrites this file atomically). Do not hand-edit the hashes.
{
  # <date>-<time>-<shorthash> from the Windows zip's directory name.
  version = "20260716-195552-76b606ec";

  # Full commit the above build corresponds to.
  rev = "76b606ec597a3c0263fa60321548637451c0a547";

  # NAR hash of the wezterm source tree (fetchSubmodules = true) at `rev`.
  srcHash = "sha256-FLU1R78C1xLPsJ1udBk9bW0BbVry4lGiC0kvPfMI66c=";

  # Vendored cargo dependencies hash for the source at `rev`.
  cargoHash = "sha256-jY7lTOfbT74tAZ7he1xudCN7BUxZBzY+8+e1d2g2v4I=";

  # SHA-256 of WezTerm-windows-nightly.zip as published for this build.
  #
  # This hash is a BYTE pin against a URL upstream overwrites in place, so it
  # expires on upstream's schedule rather than on any change of ours. Two
  # distinct expiry modes:
  #
  #   1. Upstream re-uploads the asset for an UNCHANGED build — the bytes (and
  #      this hash) change while `version`/`rev` stay put. Refreshing only this
  #      hash is correct then, and the other four fields must be left alone.
  #   2. Upstream publishes a NEWER nightly. The rolling URL now serves a
  #      different build, and refreshing only this hash would install a Windows
  #      GUI that does not match the WSL mux server — the exact drift this file
  #      exists to prevent. A full `sync-wezterm.sh` run is the only correct
  #      response.
  #
  # Measured 2026-08-29: the live asset unpacks to
  # WezTerm-windows-20260829-194257-08e5e0af, i.e. mode 2 against the
  # `version` below. The hash is therefore knowingly stale, and
  # `windowsInstallEnabled` is false until the parked remediation lands.
  windowsZipHash = "sha256-bTvVHVpB8Mh6g2lF2RB9Egs2IApanVb5Z1R2M9UCZZ8=";

  # Whether home-manager activation installs the Windows GUI (wezterm-windows.nix).
  #
  # WORKAROUND, not a design choice. While false, `nixosConfigurations.nixos`
  # carries no fixed-output derivation over the rolling `nightly` URL, so the
  # build no longer fails whenever upstream has published since the last pin
  # refresh — which, for a nightly, is most days. Nothing is uninstalled: the
  # activation script is dropped from the generation, so a Windows GUI already
  # in %LOCALAPPDATA% is left exactly as it is.
  #
  # The real fix is parked in office-hours on
  # intentions/tactic-nix-wezterm-pin-nightly-drift.md, awaiting an author
  # decision between pinning the last immutable stable release, fetching at
  # activation time, and mirroring the asset to an owned never-overwritten
  # location (intentions/tactic-wezterm-owned-asset-mirror.md). This flag picks
  # none of those.
  #
  # It goes back to true either when one of those lands, or when
  # sync-wezterm.sh regenerates this file — a successful sync leaves the pin
  # matching the live asset, so the install works again until upstream's next
  # nightly. That is the same holding action as before, now explicit.
  windowsInstallEnabled = false;
}
