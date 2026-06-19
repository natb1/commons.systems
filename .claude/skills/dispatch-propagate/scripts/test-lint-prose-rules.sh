#!/usr/bin/env bash
# Tests for lint-prose-rules.sh.
# Builds ephemeral git repos to validate the diff-scoping and detection logic.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd -P)"
source "$SCRIPT_DIR/test-helpers.sh"
SUT="$SCRIPT_DIR/lint-prose-rules.sh"

TMP_ROOT=""
cleanup() { [ -n "${TMP_ROOT:-}" ] && rm -rf "$TMP_ROOT"; }
trap cleanup EXIT INT TERM

# Assemble the banned pattern from pieces so this source file never contains
# the contiguous sequence on a non-comment line. These variables are used to
# write fixture content into ephemeral repos only.
_PIPE='|'
# Produces the string: X=$(echo "$J" | jq -r .a)
VIOL_CONTENT="X=\$(echo \"\$J\" $_PIPE jq -r .a)"

# Build a fresh ephemeral repo. Sets globals: REPO, BARE.
# $1 (optional): "with_violation" — include VIOL_CONTENT in the origin/main baseline.
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

  # Write the baseline script.sh.
  printf '%s\n' '#!/usr/bin/env bash' > "$REPO/script.sh"
  printf '%s\n' 'jq -r .field <<<"$VAR"' >> "$REPO/script.sh"
  if [ "$include_viol" = "with_violation" ]; then
    printf '%s\n' "$VIOL_CONTENT" >> "$REPO/script.sh"
  fi

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
# Test 1: net-new violation IS flagged.
# Baseline has no violation. HEAD adds the banned pattern to a .sh file.
# ---------------------------------------------------------------------------
echo "Test 1: net-new violation is flagged"
make_repo
printf '%s\n' "$VIOL_CONTENT" >> "$REPO/script.sh"
git -C "$REPO" add -A
git -C "$REPO" commit --quiet -m "add violation"
run_sut
[ "$RC" -ne 0 ] && _t1_rc=nonzero || _t1_rc=zero
assert_eq "violation: exit non-zero" "nonzero" "$_t1_rc"
assert_contains "violation: output names the file" "script.sh" "$OUT"
assert_contains "violation: remediation pointer present" "shell-json.md" "$OUT"
assert_contains "violation: good-form hint present" '<<<"$VAR"' "$OUT"

# ---------------------------------------------------------------------------
# Test 2: pre-existing violation is NOT flagged.
# The banned pattern is already on origin/main; HEAD makes a no-op change
# elsewhere so the diff shows no net-new addition of the violating line.
# ---------------------------------------------------------------------------
echo "Test 2: pre-existing violation is not flagged"
make_repo with_violation
echo "# no-op change" >> "$REPO/script.sh"
git -C "$REPO" add -A
git -C "$REPO" commit --quiet -m "no-op change"
run_sut
assert_eq "pre-existing: exit 0" "0" "$RC"
assert_contains "pre-existing: PASS printed" "PASS" "$OUT"

# ---------------------------------------------------------------------------
# Test 3: added comment mentioning the pattern is NOT flagged.
# The linter skips comment lines (first non-whitespace char is #).
# ---------------------------------------------------------------------------
echo "Test 3: added comment is not flagged"
make_repo
# Write a comment referencing the pattern; assembled in parts here to avoid
# the contiguous banned sequence appearing on this non-comment source line.
COMMENT_LINE="# do not use: echo \"\$X\" $_PIPE jq"
printf '%s\n' "$COMMENT_LINE" >> "$REPO/script.sh"
git -C "$REPO" add -A
git -C "$REPO" commit --quiet -m "add comment"
run_sut
assert_eq "comment: exit 0" "0" "$RC"
assert_contains "comment: PASS printed" "PASS" "$OUT"

# ---------------------------------------------------------------------------
# Test 4: clean added line passes.
# HEAD adds a here-string form (the correct pattern), which must not be flagged.
# ---------------------------------------------------------------------------
echo "Test 4: clean added line passes"
make_repo
echo 'jq -r .a <<<"$J"' >> "$REPO/script.sh"
git -C "$REPO" add -A
git -C "$REPO" commit --quiet -m "add clean line"
run_sut
assert_eq "clean-line: exit 0" "0" "$RC"
assert_contains "clean-line: PASS printed" "PASS" "$OUT"

report_results
