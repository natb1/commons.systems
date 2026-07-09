#!/usr/bin/env bash
# Refresh nix/home/wezterm-pin.nix to the current upstream WezTerm nightly.
#
# The Windows GUI (mux client) and the WSL wezterm-mux-server must be the same
# build or the mux handshake fails and the GUI window closes on connect. Upstream
# ships exactly ONE Windows nightly zip (overwritten in place), so the only way to
# keep both sides deterministic is to pin one commit and build/download both from
# it. This script captures that pin.
#
# It derives the target from the distributed Windows binary itself — the zip's
# internal `WezTerm-windows-<date>-<time>-<shorthash>` directory name — NOT the
# upstream `nightly` git ref, which is frequently stale and points at a different
# commit than the published assets.
#
# Run from the repo root, then `home-manager switch` (from a NON-WezTerm shell —
# the mux restart drops the pane you launch it from). Requires network + nix.
#
# Usage: nix/home/sync-wezterm.sh
set -euo pipefail

REPO_ROOT=$(git rev-parse --show-toplevel)
PIN_FILE="$REPO_ROOT/nix/home/wezterm-pin.nix"
ZIP_URL="https://github.com/wez/wezterm/releases/download/nightly/WezTerm-windows-nightly.zip"
FAKE_HASH="sha256-AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA="

system=$(nix eval --impure --raw --expr 'builtins.currentSystem')

echo "==> Downloading current Windows nightly zip"
ZIP_PATH=$(nix-prefetch-url --print-path --type sha256 "$ZIP_URL" 2>/dev/null | tail -1)
WINDOWS_ZIP_HASH=$(nix hash convert --hash-algo sha256 --to sri \
  "$(nix-prefetch-url --type sha256 "$ZIP_URL" 2>/dev/null | tail -1)")

echo "==> Reading version from the distributed binary"
# The zip's top-level directory is authoritative: WezTerm-windows-<version>.
VERSION=$(nix shell nixpkgs#unzip -c unzip -Z1 "$ZIP_PATH" \
  | grep -oE '^WezTerm-windows-[0-9]{8}-[0-9]{6}-[0-9a-f]+' \
  | head -1 | sed 's/^WezTerm-windows-//')
SHORT_SHA=${VERSION##*-}
echo "    version:   $VERSION"

echo "==> Resolving full commit for $SHORT_SHA"
REV=$(curl -fsSL "https://api.github.com/repos/wez/wezterm/commits/$SHORT_SHA" --jq '.sha')
echo "    rev:       $REV"

echo "==> Fetching source (fetchSubmodules) to compute srcHash — this is slow"
SRC_PATH=$(nix eval --impure --raw --expr \
  "builtins.fetchGit { url = \"https://github.com/wezterm/wezterm\"; rev = \"$REV\"; submodules = true; }")
SRC_HASH=$(nix hash path --sri --type sha256 "$SRC_PATH")
echo "    srcHash:   $SRC_HASH"

# Write the pin with the real srcHash and a placeholder cargoHash, then let a
# build surface the real vendor hash from the mismatch error.
write_pin() {
  cat > "$PIN_FILE" <<EOF
# Pinned WezTerm nightly — single source of truth.
#
# Both the WSL package (wezterm.nix, built from source at \`rev\`) and the Windows
# GUI binary (wezterm-windows.nix, the matching nightly zip) are pinned to the
# SAME upstream build here, so the mux client (Windows GUI) and server (WSL
# wezterm-mux-server) always speak the same PDU protocol version.
#
# \`version\` is authoritative and is read from the distributed Windows binary
# itself (the zip's internal \`WezTerm-windows-<version>\` directory name), NOT
# the upstream \`nightly\` git ref — that ref is frequently stale.
#
# Regenerate with:  nix/home/sync-wezterm.sh  (do not hand-edit the hashes).
{
  version = "$VERSION";
  rev = "$REV";
  srcHash = "$SRC_HASH";
  cargoHash = "$1";
  windowsZipHash = "$WINDOWS_ZIP_HASH";
}
EOF
}

echo "==> Resolving cargoHash via a vendor build"
write_pin "$FAKE_HASH"
CARGO_HASH=$(nix build "$REPO_ROOT#packages.$system.wezterm" --no-link 2>&1 \
  | grep -oE 'got:[[:space:]]+sha256-[A-Za-z0-9+/=]+' | grep -oE 'sha256-[A-Za-z0-9+/=]+' | head -1 || true)

if [ -z "$CARGO_HASH" ]; then
  echo "ERROR: could not extract cargoHash — the build may have succeeded with the" >&2
  echo "       fake hash (unexpected) or failed for another reason. Re-run manually:" >&2
  echo "       nix build $REPO_ROOT#packages.$system.wezterm" >&2
  exit 1
fi
echo "    cargoHash: $CARGO_HASH"

write_pin "$CARGO_HASH"

echo "==> Verifying the pinned package evaluates"
nix build "$REPO_ROOT#packages.$system.wezterm" --no-link --dry-run

echo
echo "Wrote $PIN_FILE for $VERSION."
echo "Next: home-manager switch (from a non-WezTerm shell), then restart the"
echo "Windows GUI so both sides load $VERSION."
