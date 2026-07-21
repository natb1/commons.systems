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
  version = "20260716-195552-76b606ec";
  rev = "76b606ec597a3c0263fa60321548637451c0a547";
  srcHash = "sha256-FLU1R78C1xLPsJ1udBk9bW0BbVry4lGiC0kvPfMI66c=";
  cargoHash = "sha256-jY7lTOfbT74tAZ7he1xudCN7BUxZBzY+8+e1d2g2v4I=";
  windowsZipHash = "sha256-Q8kQvp4jzW3rqj40VtmJYq1hVssiNH7DoTAMFpsd+8k=";
}
