#!/usr/bin/env bash
# Unit-test suite for budget-config-load — the standalone, repo-free per-user
# budget-etl config resolver. Drives the script under test directly via an
# XDG_CONFIG_HOME override (it sources nothing, so no copy is needed). No
# network, no emulator — deterministic and CI-safe.
#
# Mirrors the budget-etl config cases 7i-7o from
# .claude/skills/dispatch-propagate/scripts/test-dispatch-scripts.sh, adapted to
# drive the standalone resolver via XDG_CONFIG_HOME instead of the
# DISPATCH_CONFIG_DIR override plus a <type> argument.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
RESOLVER="$SCRIPT_DIR/budget-config-load"

# --- test helpers -----------------------------------------------------------

PASS=0
FAIL=0
TOTAL=0

assert_eq() {
  local label="$1" expected="$2" actual="$3"
  TOTAL=$((TOTAL + 1))
  if [[ "$expected" == "$actual" ]]; then
    PASS=$((PASS + 1))
    echo "  PASS: $label"
  else
    FAIL=$((FAIL + 1))
    echo "  FAIL: $label"
    echo "    expected: '$expected'"
    echo "    actual:   '$actual'"
  fi
}

report_results() {
  echo ""
  echo "================================"
  echo "Results: $PASS/$TOTAL passed, $FAIL failed"
  echo "================================"
  [[ "$FAIL" -eq 0 ]]
}

# --- harness ----------------------------------------------------------------
#
# config_setup mktemp -d's a fresh tree, points XDG_CONFIG_HOME at it, and
# creates the commons-systems config dir. CONFIG_FILE is the path the resolver
# reads ($XDG_CONFIG_HOME/commons-systems/budget-etl.json). config_teardown
# removes the tree and restores the original XDG_CONFIG_HOME.

SAVED_XDG="${XDG_CONFIG_HOME:-}"
HAD_XDG=0
[[ -n "${XDG_CONFIG_HOME:-}" ]] && HAD_XDG=1
TMPDIR_TEST=""
CONFIG_FILE=""

config_setup() {
  TMPDIR_TEST=$(mktemp -d)
  export XDG_CONFIG_HOME="$TMPDIR_TEST/config"
  mkdir -p "$XDG_CONFIG_HOME/commons-systems"
  CONFIG_FILE="$XDG_CONFIG_HOME/commons-systems/budget-etl.json"
}

config_teardown() {
  if [[ -n "$TMPDIR_TEST" && -d "$TMPDIR_TEST" ]]; then
    rm -rf "$TMPDIR_TEST"
  fi
  TMPDIR_TEST=""
  CONFIG_FILE=""
  if [[ "$HAD_XDG" -eq 1 ]]; then
    export XDG_CONFIG_HOME="$SAVED_XDG"
  else
    unset XDG_CONFIG_HOME
  fi
}

echo "=== budget-config-load schema ==="

# --- Test 7i: valid budget-etl.json round-trips, paths with spaces preserved -

echo "Test: valid budget-etl.json prints normalized JSON and paths with spaces round-trip"
config_setup
cat > "$CONFIG_FILE" <<'EOF'
{
  "downloads": "/mnt/c/Users/example/Downloads",
  "statements": "/mnt/g/My Drive/budget/statements",
  "snapshotDir": "/mnt/g/My Drive/budget/snapshots",
  "current": "/mnt/g/My Drive/budget/budget.enc.json"
}
EOF
out=$("$RESOLVER" 2>/dev/null); rc=$?
assert_eq "7i valid budget-etl.json exits 0" "0" "$rc"
dl=$(printf '%s' "$out" | jq -r '.downloads')
assert_eq "7i downloads round-trips" "/mnt/c/Users/example/Downloads" "$dl"
st=$(printf '%s' "$out" | jq -r '.statements')
assert_eq "7i statements round-trips (spaces preserved)" "/mnt/g/My Drive/budget/statements" "$st"
sd=$(printf '%s' "$out" | jq -r '.snapshotDir')
assert_eq "7i snapshotDir round-trips (spaces preserved)" "/mnt/g/My Drive/budget/snapshots" "$sd"
cur=$(printf '%s' "$out" | jq -r '.current')
assert_eq "7i current round-trips" "/mnt/g/My Drive/budget/budget.enc.json" "$cur"
config_teardown

# --- Test 7j: missing required field exits 1, stderr names the field ---------

echo "Test: budget-etl.json missing required field exits 1 and stderr names the field"
config_setup
cat > "$CONFIG_FILE" <<'EOF'
{
  "downloads": "/mnt/c/Users/example/Downloads",
  "statements": "/mnt/g/My Drive/budget/statements",
  "snapshotDir": "/mnt/g/My Drive/budget/snapshots"
}
EOF
rc=0
err=$("$RESOLVER" 2>&1 1>/dev/null) || rc=$?
assert_eq "7j missing current field exits 1" "1" "$rc"
TOTAL=$((TOTAL + 1))
if [[ "$err" == *"current"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: 7j missing-current error names the field"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: 7j missing-current error names the field"
  echo "    stderr: $err"
fi
config_teardown

# --- Test 7k: non-string field exits 1, stderr names the field ---------------

echo "Test: budget-etl.json with non-string downloads exits 1 and stderr names the field"
config_setup
cat > "$CONFIG_FILE" <<'EOF'
{
  "downloads": 42,
  "statements": "/mnt/g/My Drive/budget/statements",
  "snapshotDir": "/mnt/g/My Drive/budget/snapshots",
  "current": "/mnt/g/My Drive/budget/budget.enc.json"
}
EOF
rc=0
err=$("$RESOLVER" 2>&1 1>/dev/null) || rc=$?
assert_eq "7k non-string downloads exits 1" "1" "$rc"
TOTAL=$((TOTAL + 1))
if [[ "$err" == *"downloads"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: 7k non-string downloads stderr mentions downloads"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: 7k non-string downloads stderr mentions downloads"
  echo "    stderr: $err"
fi
config_teardown

# --- Test 7l: empty-string field exits 1, stderr names the field -------------

echo "Test: budget-etl.json with empty-string snapshotDir exits 1 and stderr names the field"
config_setup
cat > "$CONFIG_FILE" <<'EOF'
{
  "downloads": "/mnt/c/Users/example/Downloads",
  "statements": "/mnt/g/My Drive/budget/statements",
  "snapshotDir": "",
  "current": "/mnt/g/My Drive/budget/budget.enc.json"
}
EOF
rc=0
err=$("$RESOLVER" 2>&1 1>/dev/null) || rc=$?
assert_eq "7l empty snapshotDir exits 1" "1" "$rc"
TOTAL=$((TOTAL + 1))
if [[ "$err" == *"snapshotDir"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: 7l empty snapshotDir stderr mentions snapshotDir"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: 7l empty snapshotDir stderr mentions snapshotDir"
  echo "    stderr: $err"
fi
config_teardown

# --- Test 7m: absent budget-etl.json prints no-config and exits 0 ------------

echo "Test: absent budget-etl.json prints no-config and exits 0"
config_setup
# no file written — config dir is empty
out=$("$RESOLVER" 2>/dev/null); rc=$?
assert_eq "7m absent budget-etl.json exits 0" "0" "$rc"
assert_eq "7m absent budget-etl.json prints no-config" "no-config" "$out"
config_teardown

# --- Test 7n: relative path field exits 1, names the field and 'absolute' ----

echo "Test: budget-etl.json with a relative downloads path exits 1 and names the field"
config_setup
cat > "$CONFIG_FILE" <<'EOF'
{
  "downloads": "relative/Downloads",
  "statements": "/mnt/g/My Drive/budget/statements",
  "snapshotDir": "/mnt/g/My Drive/budget/snapshots",
  "current": "/mnt/g/My Drive/budget/budget.enc.json"
}
EOF
rc=0
err=$("$RESOLVER" 2>&1 1>/dev/null) || rc=$?
assert_eq "7n relative downloads exits 1" "1" "$rc"
TOTAL=$((TOTAL + 1))
if [[ "$err" == *"downloads"* && "$err" == *"absolute"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: 7n relative downloads error names the field and 'absolute'"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: 7n relative downloads error names the field and 'absolute'"
  echo "    stderr: $err"
fi
config_teardown

# --- Test 7o: '..'-component path exits 1, names the field and '..' ----------

echo "Test: budget-etl.json with a '..' component in statements exits 1 and names the field"
config_setup
cat > "$CONFIG_FILE" <<'EOF'
{
  "downloads": "/mnt/c/Users/example/Downloads",
  "statements": "/mnt/g/My Drive/../../../etc",
  "snapshotDir": "/mnt/g/My Drive/budget/snapshots",
  "current": "/mnt/g/My Drive/budget/budget.enc.json"
}
EOF
rc=0
err=$("$RESOLVER" 2>&1 1>/dev/null) || rc=$?
assert_eq "7o '..' statements exits 1" "1" "$rc"
TOTAL=$((TOTAL + 1))
if [[ "$err" == *"statements"* && "$err" == *".."* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: 7o '..' statements error names the field and '..'"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: 7o '..' statements error names the field and '..'"
  echo "    stderr: $err"
fi
config_teardown

report_results
