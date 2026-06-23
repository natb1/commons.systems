#!/usr/bin/env bash
# Tests for lint-ds-drift.sh.
# Builds ephemeral git repos to validate the diff-scoping and detection logic.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd -P)"
source "$SCRIPT_DIR/test-helpers.sh"
SUT="$SCRIPT_DIR/lint-ds-drift.sh"

TMP_ROOT=""
cleanup() { [ -n "${TMP_ROOT:-}" ] && rm -rf "$TMP_ROOT"; }
trap cleanup EXIT INT TERM

# Assemble the banned literals from pieces so this source file never contains a
# contiguous bannable sequence on a non-comment line. These variables are used
# only to write fixture content into ephemeral repos.
_H='#'
_PX='px'
# color: #fde68a;  (raw hex)
VIOL_HEX="color: ${_H}fde68a;"
# color: #abcdef;  (raw hex, used for baseline + out-of-scope fixtures)
VIOL_HEX2="color: ${_H}abcdef;"
# font-size: 11px;  (px font-size)
VIOL_FONTSIZE="font-size: 11${_PX};"
# font-weight: 300;  (off-scale font-weight)
VIOL_FONTWEIGHT="font-weight: 300;"
# gap: 5px;  (px spacing)
VIOL_SPACING="gap: 5${_PX};"
# font-size: 11px; /* ds-lint-disable-line: ... */  (escaped violation)
VIOL_ESCAPED="font-size: 11${_PX}; /* ds-lint-disable-line: SVG label, no exact token */"
# /* brand was #abcdef */  (hex in a comment line)
COMMENT_HEX="/* brand was ${_H}abcdef */"

# Build a fresh ephemeral repo. Sets globals: REPO, BARE.
# $1 (optional): "with_violation" — seed the origin/main baseline with a
#   violating hex line in the in-scope CSS file.
REPO=""
BARE=""
make_repo() {
  local include_viol="${1:-}"
  REPO=$(mktemp -d "$TMP_ROOT/repo.XXXXXX")
  BARE=$(mktemp -d "$TMP_ROOT/bare.XXXXXX")

  git -C "$BARE" init --bare --quiet --initial-branch=main

  git -C "$REPO" init --quiet --initial-branch=main
  git -C "$REPO" config user.email "test@example.com"
  git -C "$REPO" config user.name "Test User"
  git -C "$REPO" remote add origin "$BARE"

  # Write the baseline in-scope CSS file (myapp/src/style/theme.css).
  mkdir -p "$REPO/myapp/src/style"
  printf '%s\n' '.theme {' > "$REPO/myapp/src/style/theme.css"
  printf '%s\n' '  display: block;' >> "$REPO/myapp/src/style/theme.css"
  if [ "$include_viol" = "with_violation" ]; then
    printf '%s\n' "  $VIOL_HEX2" >> "$REPO/myapp/src/style/theme.css"
  fi
  printf '%s\n' '}' >> "$REPO/myapp/src/style/theme.css"

  git -C "$REPO" add -A
  git -C "$REPO" commit --quiet -m "baseline"
  git -C "$REPO" push --quiet origin main

  git -C "$REPO" checkout --quiet -b feature

  # Ensure origin/main is fetchable so origin/main...HEAD resolves.
  git -C "$REPO" fetch --quiet origin main
}

# Run the SUT with CWD inside $REPO. Sets globals: RC, OUT.
RC=0
OUT=""
run_sut() {
  local prev_dir
  prev_dir=$(pwd)
  cd "$REPO"
  set +e
  OUT=$("$SUT" 2>&1)
  RC=$?
  set -e
  cd "$prev_dir"
}

TMP_ROOT=$(mktemp -d)

# ---------------------------------------------------------------------------
# Test 1: net-new raw hex color IS flagged → [raw hex].
# ---------------------------------------------------------------------------
echo "Test 1: net-new raw hex is flagged"
make_repo
printf '%s\n' "  $VIOL_HEX" >> "$REPO/myapp/src/style/theme.css"
git -C "$REPO" add -A
git -C "$REPO" commit --quiet -m "add hex violation"
run_sut
[ "$RC" -ne 0 ] && _rc=nonzero || _rc=zero
assert_eq "hex: exit non-zero" "nonzero" "$_rc"
assert_contains "hex: output names the file" "theme.css" "$OUT"
assert_contains "hex: raw hex detector tag" "[raw hex]" "$OUT"
assert_contains "hex: remediation pointer present" "packages/ds/tokens/" "$OUT"

# ---------------------------------------------------------------------------
# Test 2: net-new px font-size IS flagged → [px font-size].
# ---------------------------------------------------------------------------
echo "Test 2: net-new px font-size is flagged"
make_repo
printf '%s\n' "  $VIOL_FONTSIZE" >> "$REPO/myapp/src/style/theme.css"
git -C "$REPO" add -A
git -C "$REPO" commit --quiet -m "add font-size violation"
run_sut
[ "$RC" -ne 0 ] && _rc=nonzero || _rc=zero
assert_eq "font-size: exit non-zero" "nonzero" "$_rc"
assert_contains "font-size: output names the file" "theme.css" "$OUT"
assert_contains "font-size: px font-size detector tag" "[px font-size]" "$OUT"

# ---------------------------------------------------------------------------
# Test 3: net-new off-scale font-weight IS flagged → [off-scale font-weight].
# ---------------------------------------------------------------------------
echo "Test 3: net-new off-scale font-weight is flagged"
make_repo
printf '%s\n' "  $VIOL_FONTWEIGHT" >> "$REPO/myapp/src/style/theme.css"
git -C "$REPO" add -A
git -C "$REPO" commit --quiet -m "add font-weight violation"
run_sut
[ "$RC" -ne 0 ] && _rc=nonzero || _rc=zero
assert_eq "font-weight: exit non-zero" "nonzero" "$_rc"
assert_contains "font-weight: output names the file" "theme.css" "$OUT"
assert_contains "font-weight: off-scale detector tag" "[off-scale font-weight]" "$OUT"

# ---------------------------------------------------------------------------
# Test 4: net-new px spacing (gap) IS flagged → [px spacing].
# ---------------------------------------------------------------------------
echo "Test 4: net-new px spacing is flagged"
make_repo
printf '%s\n' "  $VIOL_SPACING" >> "$REPO/myapp/src/style/theme.css"
git -C "$REPO" add -A
git -C "$REPO" commit --quiet -m "add spacing violation"
run_sut
[ "$RC" -ne 0 ] && _rc=nonzero || _rc=zero
assert_eq "spacing: exit non-zero" "nonzero" "$_rc"
assert_contains "spacing: output names the file" "theme.css" "$OUT"
assert_contains "spacing: px spacing detector tag" "[px spacing]" "$OUT"

# ---------------------------------------------------------------------------
# Tests 5-12: net-new clean lines pass.
# A battery of legitimate px / weight / token usages on added lines in an
# in-scope file — none of which the property-scoped detectors should reach.
# ---------------------------------------------------------------------------
echo "Tests 5-12: clean added lines pass"
make_repo
{
  printf '%s\n' '  border: 1px solid black;'
  printf '%s\n' '  outline-offset: 2px;'
  printf '%s\n' '}'
  printf '%s\n' '@media (min-width: 600px) {'
  printf '%s\n' '  .x { margin: var(--space-1); }'
  printf '%s\n' '  .y { font-weight: 700; }'
  printf '%s\n' '  .z { font-weight: bold; }'
  printf '%s\n' '  .r { border-radius: 4px; }'
  printf '%s\n' '  .t { --texture-pitch: 24px; }'
  printf '%s\n' '}'
} >> "$REPO/myapp/src/style/theme.css"
git -C "$REPO" add -A
git -C "$REPO" commit --quiet -m "add clean lines"
run_sut
assert_eq "clean-battery: exit 0" "0" "$RC"
assert_contains "clean-battery: PASS printed" "PASS" "$OUT"

# ---------------------------------------------------------------------------
# Test 13: real violation carrying the inline escape hatch is NOT flagged.
# ---------------------------------------------------------------------------
echo "Test 13: escaped violation is not flagged"
make_repo
printf '%s\n' "  $VIOL_ESCAPED" >> "$REPO/myapp/src/style/theme.css"
git -C "$REPO" add -A
git -C "$REPO" commit --quiet -m "add escaped violation"
run_sut
assert_eq "escaped: exit 0" "0" "$RC"
assert_contains "escaped: PASS printed" "PASS" "$OUT"

# ---------------------------------------------------------------------------
# Test 14: a hex inside a comment line is NOT flagged (comment skip).
# ---------------------------------------------------------------------------
echo "Test 14: hex in a comment line is not flagged"
make_repo
printf '%s\n' "  $COMMENT_HEX" >> "$REPO/myapp/src/style/theme.css"
git -C "$REPO" add -A
git -C "$REPO" commit --quiet -m "add comment hex"
run_sut
assert_eq "comment-hex: exit 0" "0" "$RC"
assert_contains "comment-hex: PASS printed" "PASS" "$OUT"

# ---------------------------------------------------------------------------
# Test 15: pre-existing baseline violation is NOT re-flagged.
# The violating hex is already on origin/main; HEAD makes a no-op edit
# elsewhere in the same file, so no net-new addition of the violating line.
# ---------------------------------------------------------------------------
echo "Test 15: pre-existing baseline violation is not re-flagged"
make_repo with_violation
printf '%s\n' '  width: 100%;' >> "$REPO/myapp/src/style/theme.css"
git -C "$REPO" add -A
git -C "$REPO" commit --quiet -m "no-op edit"
run_sut
assert_eq "baseline: exit 0" "0" "$RC"
assert_contains "baseline: PASS printed" "PASS" "$OUT"

# ---------------------------------------------------------------------------
# Test 16: a raw hex added in a packages/ds/-pathed CSS file is NOT flagged.
# The design system owns the literals and is exempt.
# ---------------------------------------------------------------------------
echo "Test 16: out-of-scope packages/ds hex is not flagged"
make_repo
mkdir -p "$REPO/packages/ds/src"
printf '%s\n' '.ds {' > "$REPO/packages/ds/src/tokens.css"
printf '%s\n' "  $VIOL_HEX2" >> "$REPO/packages/ds/src/tokens.css"
printf '%s\n' '}' >> "$REPO/packages/ds/src/tokens.css"
git -C "$REPO" add -A
git -C "$REPO" commit --quiet -m "add ds hex"
run_sut
assert_eq "out-of-scope: exit 0" "0" "$RC"
assert_contains "out-of-scope: PASS printed" "PASS" "$OUT"

report_results
