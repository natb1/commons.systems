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

# JSX camelCase violation fixtures (camelCase analogs of the CSS violations above)
# fontSize: '14px',  (px font-size in JSX)
VIOL_JSX_FONTSIZE="fontSize: '14${_PX}',"
# fontWeight: 300,  (off-scale font-weight in JSX)
VIOL_JSX_FONTWEIGHT="fontWeight: 300,"
# marginTop: '5px',  (px spacing in JSX)
VIOL_JSX_MARGIN="marginTop: '5${_PX}',"
# gap: '8px',  (px gap in JSX)
VIOL_JSX_GAP="gap: '8${_PX}',"
# multiline split: property name and value on separate lines — neither fires alone
VIOL_JSX_MULTILINE_NAME="fontSize:"
VIOL_JSX_MULTILINE_VALUE="'14${_PX}',"
# fontSize: '14px', // ds-lint-disable-line: ...  (escaped JSX violation, // form)
VIOL_JSX_ESCAPED="fontSize: '14${_PX}', // ds-lint-disable-line: SVG label, no exact token"

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

# ---------------------------------------------------------------------------
# Test 17: net-new px fontSize in a JSX style object IS flagged → [px font-size].
# Exercises FONTSIZE_JSX_RE — the JSX camelCase detector, previously uncovered.
# ---------------------------------------------------------------------------
echo "Test 17: net-new JSX px fontSize is flagged"
make_repo
mkdir -p "$REPO/myapp/src/components"
{
  printf '%s\n' 'const style = {'
  printf '%s\n' "  $VIOL_JSX_FONTSIZE"
  printf '%s\n' '};'
} > "$REPO/myapp/src/components/Widget.tsx"
git -C "$REPO" add -A
git -C "$REPO" commit --quiet -m "add JSX fontSize violation"
run_sut
[ "$RC" -ne 0 ] && _rc=nonzero || _rc=zero
assert_eq "jsx-fontSize: exit non-zero" "nonzero" "$_rc"
assert_contains "jsx-fontSize: output names the file" "Widget.tsx" "$OUT"
assert_contains "jsx-fontSize: px font-size detector tag" "[px font-size]" "$OUT"

# ---------------------------------------------------------------------------
# Test 18: net-new off-scale JSX fontWeight IS flagged → [off-scale font-weight].
# Exercises FONTWEIGHT_JSX_RE.
# ---------------------------------------------------------------------------
echo "Test 18: net-new JSX off-scale fontWeight is flagged"
make_repo
mkdir -p "$REPO/myapp/src/components"
{
  printf '%s\n' 'const style = {'
  printf '%s\n' "  $VIOL_JSX_FONTWEIGHT"
  printf '%s\n' '};'
} > "$REPO/myapp/src/components/Widget.tsx"
git -C "$REPO" add -A
git -C "$REPO" commit --quiet -m "add JSX fontWeight violation"
run_sut
[ "$RC" -ne 0 ] && _rc=nonzero || _rc=zero
assert_eq "jsx-fontWeight: exit non-zero" "nonzero" "$_rc"
assert_contains "jsx-fontWeight: output names the file" "Widget.tsx" "$OUT"
assert_contains "jsx-fontWeight: off-scale detector tag" "[off-scale font-weight]" "$OUT"

# ---------------------------------------------------------------------------
# Test 19: net-new px JSX marginTop IS flagged → [px spacing].
# Exercises SPACING_JSX_RE.
# ---------------------------------------------------------------------------
echo "Test 19: net-new JSX px marginTop is flagged"
make_repo
mkdir -p "$REPO/myapp/src/components"
{
  printf '%s\n' 'const style = {'
  printf '%s\n' "  $VIOL_JSX_MARGIN"
  printf '%s\n' '};'
} > "$REPO/myapp/src/components/Widget.tsx"
git -C "$REPO" add -A
git -C "$REPO" commit --quiet -m "add JSX margin violation"
run_sut
[ "$RC" -ne 0 ] && _rc=nonzero || _rc=zero
assert_eq "jsx-margin: exit non-zero" "nonzero" "$_rc"
assert_contains "jsx-margin: output names the file" "Widget.tsx" "$OUT"
assert_contains "jsx-margin: px spacing detector tag" "[px spacing]" "$OUT"

# ---------------------------------------------------------------------------
# Test 20: net-new px JSX gap IS flagged → [px spacing].
# Exercises SPACING_GAP_JSX_RE.
# ---------------------------------------------------------------------------
echo "Test 20: net-new JSX px gap is flagged"
make_repo
mkdir -p "$REPO/myapp/src/components"
{
  printf '%s\n' 'const style = {'
  printf '%s\n' "  $VIOL_JSX_GAP"
  printf '%s\n' '};'
} > "$REPO/myapp/src/components/Widget.tsx"
git -C "$REPO" add -A
git -C "$REPO" commit --quiet -m "add JSX gap violation"
run_sut
[ "$RC" -ne 0 ] && _rc=nonzero || _rc=zero
assert_eq "jsx-gap: exit non-zero" "nonzero" "$_rc"
assert_contains "jsx-gap: output names the file" "Widget.tsx" "$OUT"
assert_contains "jsx-gap: px spacing detector tag" "[px spacing]" "$OUT"

# ---------------------------------------------------------------------------
# Test 21: multiline JSX form (property name and value on separate lines) is
# NOT flagged — a KNOWN GAP locked in as a characterization test.
# The single-line detectors process the diff line-by-line in isolation:
# the `fontSize:` line carries no px, and the `'14px'` value line carries no
# `fontSize`, so neither line matches any single-line detector and the linter
# exits 0 (PASS). This asserts CURRENT (passing) behavior to catch UNINTENDED
# changes; it is a documented limitation, not a weakened test. FLIP this
# assertion to expect a violation if/when multiline detection is ever added.
# ---------------------------------------------------------------------------
echo "Test 21: multiline JSX fontSize is not caught (known single-line-regex gap)"
make_repo
mkdir -p "$REPO/myapp/src/components"
{
  printf '%s\n' 'const style = {'
  printf '%s\n' "  $VIOL_JSX_MULTILINE_NAME"
  printf '%s\n' "  $VIOL_JSX_MULTILINE_VALUE"
  printf '%s\n' '};'
} > "$REPO/myapp/src/components/Widget.tsx"
git -C "$REPO" add -A
git -C "$REPO" commit --quiet -m "add multiline JSX fontSize"
run_sut
assert_eq "jsx-multiline: exit 0 (known gap)" "0" "$RC"
assert_contains "jsx-multiline: PASS printed" "PASS" "$OUT"

# ---------------------------------------------------------------------------
# Test 22: JSX clean-line false-positive battery (camelCase analog of Tests 5-12).
# A battery of legitimate camelCase style-object values on added lines in an
# in-scope .tsx file — none of which the four JSX detectors should reach. This
# exercises the false-positive (precision) side of FONTSIZE_JSX_RE,
# FONTWEIGHT_JSX_RE, SPACING_JSX_RE, and SPACING_GAP_JSX_RE: a future regex edit
# that widens any JSX detector to over-match would start flagging legitimate app
# code, and this test would catch that regression.
# ---------------------------------------------------------------------------
echo "Test 22: JSX clean camelCase lines pass (precision battery)"
make_repo
mkdir -p "$REPO/myapp/src/components"
{
  printf '%s\n' 'const style = {'
  printf '%s\n' '  fontWeight: 400,'
  printf '%s\n' '  fontWeight: 700,'
  printf '%s\n' "  fontSize: 'var(--text-sm)',"
  printf '%s\n' "  borderRadius: '4px',"
  printf '%s\n' '  margin: 0,'
  printf '%s\n' '  gap: 0,'
  printf '%s\n' "  marginTop: 'var(--space-1)',"
  printf '%s\n' "  paddingTop: 'var(--space-2)',"
  printf '%s\n' '};'
} > "$REPO/myapp/src/components/Widget.tsx"
git -C "$REPO" add -A
git -C "$REPO" commit --quiet -m "add JSX clean camelCase lines"
run_sut
assert_eq "jsx-clean-battery: exit 0" "0" "$RC"
assert_contains "jsx-clean-battery: PASS printed" "PASS" "$OUT"

# ---------------------------------------------------------------------------
# Test 23: real JSX violation carrying the inline // escape hatch is NOT
# flagged. Mirrors Test 13 (the CSS /* ... */ form) for the TSX-appropriate
# `// ds-lint-disable-line: <reason>` single-line comment form documented at
# lint-ds-drift.sh:215. Guards the escape-hatch check (`*ds-lint-disable-line*`)
# against a regression that broke it specifically for TSX-style // comments.
# ---------------------------------------------------------------------------
echo "Test 23: escaped JSX violation (// form) is not flagged"
make_repo
mkdir -p "$REPO/myapp/src/components"
{
  printf '%s\n' 'const style = {'
  printf '%s\n' "  $VIOL_JSX_ESCAPED"
  printf '%s\n' '};'
} > "$REPO/myapp/src/components/Widget.tsx"
git -C "$REPO" add -A
git -C "$REPO" commit --quiet -m "add escaped JSX violation"
run_sut
assert_eq "jsx-escaped: exit 0" "0" "$RC"
assert_contains "jsx-escaped: PASS printed" "PASS" "$OUT"

# ---------------------------------------------------------------------------
# THE PUSH-TO-MAIN SHAPE.
#
# actions/checkout leaves refs/remotes/origin/main pointing AT the pushed
# commit, so HEAD == origin/main and the `origin/main...HEAD` range this linter
# used to carry expanded to HEAD..HEAD — empty. The linter then reported a
# clean pass without inspecting a single line, on every push to main, inside
# the REQUIRED `lint` job.
#
# Same fixture as make_repo, but the violating commit stays on main and
# origin/main is moved onto it rather than a feature branch being cut.
# ---------------------------------------------------------------------------
make_main_push_repo() {
  REPO=$(mktemp -d "$TMP_ROOT/repo.XXXXXX")
  BARE=$(mktemp -d "$TMP_ROOT/bare.XXXXXX")

  git -C "$BARE" init --bare --quiet --initial-branch=main

  git -C "$REPO" init --quiet --initial-branch=main
  git -C "$REPO" config user.email "test@example.com"
  git -C "$REPO" config user.name "Test User"
  git -C "$REPO" remote add origin "$BARE"

  mkdir -p "$REPO/myapp/src/style"
  printf '%s\n' '.theme {' > "$REPO/myapp/src/style/theme.css"
  printf '%s\n' '  display: block;' >> "$REPO/myapp/src/style/theme.css"
  printf '%s\n' '}' >> "$REPO/myapp/src/style/theme.css"
  git -C "$REPO" add -A
  git -C "$REPO" commit --quiet -m "baseline"
  git -C "$REPO" push --quiet origin main

  # The push under test: a raw hex colour, committed on main.
  printf '%s\n' "  $VIOL_HEX" >> "$REPO/myapp/src/style/theme.css"
  git -C "$REPO" add -A
  git -C "$REPO" commit --quiet -m "add hex violation (the push)"
  git -C "$REPO" push --quiet origin main
  # This is the state actions/checkout leaves on a push to main.
  git -C "$REPO" update-ref refs/remotes/origin/main "$(git -C "$REPO" rev-parse HEAD)"
}

echo "Test 24: main-push shape flags the violation"
make_main_push_repo
# The reproduction, stated as an assertion: the expression this linter used to
# carry sees nothing at all in exactly this state.
assert_eq "main-push: the old three-dot range was empty" "" \
  "$(git -C "$REPO" diff --name-only 'refs/remotes/origin/main...HEAD')"  # diff-base-ok: the reproduction: asserts the old vacuous range sees nothing
run_sut
[ "$RC" -ne 0 ] && _mp_rc=nonzero || _mp_rc=zero
assert_eq "main-push: exit non-zero" "nonzero" "$_mp_rc"
assert_contains "main-push: output names the file" "theme.css" "$OUT"
assert_contains "main-push: raw hex detector tag" "[raw hex]" "$OUT"

# A clean main push must still pass — the fix must not invent violations.
echo "Test 25: clean main-push shape passes"
make_main_push_repo
printf '%s\n' '/* no-op */' >> "$REPO/myapp/src/style/theme.css"
git -C "$REPO" add -A
git -C "$REPO" commit --quiet -m "clean follow-up push"
git -C "$REPO" push --quiet origin main
git -C "$REPO" update-ref refs/remotes/origin/main "$(git -C "$REPO" rev-parse HEAD)"
run_sut
assert_eq "main-push clean: exit 0" "0" "$RC"

report_results
