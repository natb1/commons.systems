# Pinned WezTerm nightly — single source of truth.
#
# Both the WSL package (wezterm.nix, built from source at `rev`) and the Windows
# GUI binary (wezterm-windows.nix, the matching nightly zip) are pinned to the
# SAME upstream build here, so the mux client (Windows GUI) and server (WSL
# wezterm-mux-server) always speak the same PDU protocol version.
#
# `version` is authoritative and is read from the distributed Windows binary
# itself (the zip's internal `WezTerm-windows-<version>` directory name), NOT
# the upstream `nightly` git ref — that ref is frequently stale.
#
# Regenerate with:  nix/home/sync-wezterm.sh  (do not hand-edit the hashes).
{
  version = "20260805-104032-4b1c3c15";
  rev = "4b1c3c151eb530e569f867e1461693c56fe89695";
  srcHash = "sha256-cZ5RDeHP9cBa1Qu6E96lRjKW4aC/wMJBZNpUZ2kAWuU=";
  cargoHash = "sha256-4jm0uMj0/6fcLHSvd7y12h1QjQ/VavkmNc5L/ebQez0=";
  windowsZipHash = "sha256-s/Jfeer9ELfFkYnzXMMPMbOQ42nQ3lxe7khksDHaGks=";
}
