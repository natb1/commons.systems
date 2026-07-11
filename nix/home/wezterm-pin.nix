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
  version = "20260707-093716-fff02ca5";

  # Full commit the above build corresponds to.
  rev = "fff02ca501c3b457f99b467a86061d2b150c51f2";

  # NAR hash of the wezterm source tree (fetchSubmodules = true) at `rev`.
  srcHash = "sha256-q351PUvUy9jbqcAgQfkZqgrEuc4X/Y/H9N8b9+60mjY=";

  # Vendored cargo dependencies hash for the source at `rev`.
  cargoHash = "sha256-jY7lTOfbT74tAZ7he1xudCN7BUxZBzY+8+e1d2g2v4I=";

  # SHA-256 of WezTerm-windows-nightly.zip as published for this build.
  windowsZipHash = "sha256-Beo9PtQ5UmqdmBbagYfVoS0hglseF/1F/uUMHtGxr1c=";
}
