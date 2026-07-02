#!/usr/bin/env bash
# Unit-test suite for office-hours-snapshot-launch (#2661). Drives the launcher
# via a FAKE producer stub (OFFICE_HOURS_SNAPSHOT_CMD) and an isolated state dir,
# so no node/network is required (the CMD override skips the node guard).
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
LAUNCH="$SCRIPT_DIR/office-hours-snapshot-launch"

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

# Poll up to ~5s for a file to exist.
wait_for_file() {
  local f="$1" n=0
  while [[ ! -e "$f" && $n -lt 50 ]]; do sleep 0.1; n=$((n + 1)); done
}

# Poll up to ~5s for a file to contain a substring.
wait_for_content() {
  local f="$1" needle="$2" n=0
  while [[ $n -lt 50 ]]; do
    [[ -e "$f" ]] && grep -q -- "$needle" "$f" && return 0
    sleep 0.1; n=$((n + 1))
  done
  return 1
}

# --- harness ----------------------------------------------------------------

TMPDIR_TEST=""
cleanup() { [[ -n "$TMPDIR_TEST" && -d "$TMPDIR_TEST" ]] && rm -rf "$TMPDIR_TEST"; }
trap cleanup EXIT

TMPDIR_TEST=$(mktemp -d)
STATE_DIR="$TMPDIR_TEST/state"
MARKER="$TMPDIR_TEST/marker"
FAKE="$TMPDIR_TEST/fake-producer"

# Fake producer: parse --scope <value> and append the value to $FAKE_MARKER.
cat >"$FAKE" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
scope=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --scope) scope="$2"; shift 2 ;;
    *) shift ;;
  esac
done
echo "$scope" >> "$FAKE_MARKER"
EOF
chmod +x "$FAKE"

export OFFICE_HOURS_SNAPSHOT_STATE_DIR="$STATE_DIR"
export OFFICE_HOURS_SNAPSHOT_CMD="bash $FAKE"
export FAKE_MARKER="$MARKER"

# --- Case 1: gate OFF -> no-op, no launch -----------------------------------
echo "== Case 1: gate OFF =="
unset OFFICE_HOURS_SNAPSHOT_ENABLED || true
rc=0
"$LAUNCH" full || rc=$?
assert_eq "gate off: exit 0" "0" "$rc"
sleep 0.5
if [[ -e "$MARKER" ]]; then
  assert_eq "gate off: marker absent" "absent" "present"
else
  assert_eq "gate off: marker absent" "absent" "absent"
fi

# --- Case 2: invalid scope / wrong arg count -> hard error, no launch -------
echo "== Case 2: misuse =="
export OFFICE_HOURS_SNAPSHOT_ENABLED=1
rc=0
"$LAUNCH" bogus || rc=$?
[[ "$rc" -ne 0 ]] && assert_eq "invalid scope: non-zero exit" "nonzero" "nonzero" \
  || assert_eq "invalid scope: non-zero exit" "nonzero" "zero"
rc=0
"$LAUNCH" || rc=$?
[[ "$rc" -ne 0 ]] && assert_eq "no args: non-zero exit" "nonzero" "nonzero" \
  || assert_eq "no args: non-zero exit" "nonzero" "zero"
sleep 0.5
if [[ -e "$MARKER" ]]; then
  assert_eq "misuse: marker absent" "absent" "present"
else
  assert_eq "misuse: marker absent" "absent" "absent"
fi

# --- Case 3: gate ON, scope=full -> returns fast, then marker records full ---
echo "== Case 3: gate ON, full =="
export OFFICE_HOURS_SNAPSHOT_ENABLED=1
SECONDS=0
rc=0
"$LAUNCH" full || rc=$?
elapsed=$SECONDS
assert_eq "full: exit 0" "0" "$rc"
[[ "$elapsed" -lt 10 ]] && assert_eq "full: launcher returns fast (<10s)" "fast" "fast" \
  || assert_eq "full: launcher returns fast (<10s)" "fast" "slow(${elapsed}s)"
if wait_for_content "$MARKER" "full"; then
  assert_eq "full: marker records scope" "full" "$(grep -c '^full$' "$MARKER" >/dev/null && echo full)"
else
  assert_eq "full: marker records scope" "full" "MISSING"
fi

# --- Case 4: gate ON, scope=parked-only -> marker + both lock files exist ----
echo "== Case 4: gate ON, parked-only =="
rc=0
"$LAUNCH" parked-only || rc=$?
assert_eq "parked-only: exit 0" "0" "$rc"
if wait_for_content "$MARKER" "parked-only"; then
  assert_eq "parked-only: marker records scope" "parked-only" "parked-only"
else
  assert_eq "parked-only: marker records scope" "parked-only" "MISSING"
fi
# Both per-scope lock files should have been created by their runs.
wait_for_file "$STATE_DIR/office-hours-snapshot-full.lock"
wait_for_file "$STATE_DIR/office-hours-snapshot-parked-only.lock"
[[ -e "$STATE_DIR/office-hours-snapshot-full.lock" ]] \
  && assert_eq "per-scope lock: full.lock exists" "yes" "yes" \
  || assert_eq "per-scope lock: full.lock exists" "yes" "no"
[[ -e "$STATE_DIR/office-hours-snapshot-parked-only.lock" ]] \
  && assert_eq "per-scope lock: parked-only.lock exists" "yes" "yes" \
  || assert_eq "per-scope lock: parked-only.lock exists" "yes" "no"

report_results
