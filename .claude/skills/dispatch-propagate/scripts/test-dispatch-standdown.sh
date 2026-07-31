#!/usr/bin/env bash
# Tests for dispatch-standdown — the CLI entry point a losing duplicate
# session calls to record its stand-down, after one final winner-liveness
# re-check at the moment of decision.
#
# Everything is faked: `claude agents --json` via CLAUDE_AGENTS_CMD (a small
# script printing a controlled registry array, the same idiom
# test-lib-standdown-recheck.sh and test-lib-claude-agents.sh use), and the
# ledger via DISPATCH_STANDDOWN_DIR (a scratch dir — no git repo required,
# standdown_dir's DISPATCH_STANDDOWN_DIR override bypasses resolve_project_root).
set -uo pipefail

FIXTURE_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=dispatch-test-fixture.sh
source "$FIXTURE_DIR/dispatch-test-fixture.sh"

DS_CMD="$SCRIPT_DIR/dispatch-standdown"

echo "=== dispatch-standdown ==="

DS_DIR=""
DS_FAKE=""
DS_LEDGER=""
DS_ENTRIES=()
DS_OUT=""
DS_ERR=""
DS_RC=0

ds_setup() {
  DS_DIR=$(mktemp -d)
  DS_FAKE="$DS_DIR/fake-claude"
  DS_LEDGER="$DS_DIR/ledger"
  DS_ENTRIES=()
  DS_OUT=""
  DS_ERR=""
  DS_RC=0
}

ds_teardown() {
  rm -rf "$DS_DIR"
  DS_DIR=""
  unset CLAUDE_AGENTS_CMD DISPATCH_STANDDOWN_DIR CLAUDE_CODE_SESSION_ID || true
}

# ds_add_session <sid> <name> — append one live registry entry.
ds_add_session() {
  DS_ENTRIES+=("{\"sessionId\":\"$1\",\"name\":\"$2\",\"status\":\"busy\"}")
}

# ds_install_claude [exit-code] — install the fake `claude` emitting the
# accumulated registry array (or, on a non-zero exit code, failing outright to
# model an unqueryable daemon) and point CLAUDE_AGENTS_CMD at it.
ds_install_claude() {
  local exit_code="${1:-0}" payload
  payload=$( IFS=,; printf '[%s]' "${DS_ENTRIES[*]}" )
  printf '%s' "$payload" > "$DS_DIR/payload.json"
  cat > "$DS_FAKE" <<FAKE
#!/usr/bin/env bash
if [[ "$exit_code" -ne 0 ]]; then
  echo "fake claude: simulated daemon failure" >&2
  exit $exit_code
fi
cat "$DS_DIR/payload.json"
exit 0
FAKE
  chmod +x "$DS_FAKE"
  CLAUDE_AGENTS_CMD="$DS_FAKE"
  export CLAUDE_AGENTS_CMD
}

ds_run() {
  DISPATCH_STANDDOWN_DIR="$DS_LEDGER"
  export DISPATCH_STANDDOWN_DIR
  if DS_OUT=$("$DS_CMD" "$@" 2>"$DS_DIR/err"); then DS_RC=0; else DS_RC=$?; fi
  DS_ERR=$(cat "$DS_DIR/err")
}

ds_marker_field() {
  sed -n "s/^$2=//p" "$DS_LEDGER/$1" | head -n1
}

# --- Test 1: winner live → stood-down, marker written -----------------------
echo "Test: winner live in the registry -> stood-down, marker written"
ds_setup
ds_add_session "aaaa1111-1111-1111-1111-111111111111" "tactic-some-node"
ds_install_claude 0
CLAUDE_CODE_SESSION_ID="bbbb2222-2222-2222-2222-222222222222"
export CLAUDE_CODE_SESSION_ID
ds_run "tactic-some-node" --winner "aaaa1111-1111-1111-1111-111111111111"
assert_eq "exit code 0" "0" "$DS_RC"
assert_eq "stdout is exactly stood-down" "stood-down" "$DS_OUT"
assert_eq "marker file exists" "yes" "$( [[ -f "$DS_LEDGER/tactic-some-node" ]] && echo yes || echo no )"
assert_eq "marker origin=declared" "declared" "$(ds_marker_field tactic-some-node origin)"
assert_eq "marker winner=<sid>" "aaaa1111-1111-1111-1111-111111111111" "$(ds_marker_field tactic-some-node winner)"
assert_eq "marker sessions=winner,own" "aaaa1111-1111-1111-1111-111111111111,bbbb2222-2222-2222-2222-222222222222" "$(ds_marker_field tactic-some-node sessions)"
ds_teardown

# --- Test 2: winner definitely absent → winner-absent, no marker ------------
echo "Test: winner definitely absent from the registry -> winner-absent, no marker written"
ds_setup
ds_add_session "cccc3333-3333-3333-3333-333333333333" "some-other-node"
ds_install_claude 0
ds_run "tactic-some-node" --winner "aaaa1111-1111-1111-1111-111111111111"
assert_eq "exit code 3" "3" "$DS_RC"
assert_eq "stdout is exactly winner-absent" "winner-absent" "$DS_OUT"
assert_eq "no marker file written" "no" "$( [[ -f "$DS_LEDGER/tactic-some-node" ]] && echo yes || echo no )"
ds_teardown

# --- Test 3: daemon UNKNOWN → fail safe to stood-down ------------------------
echo "Test: fake claude fails (daemon UNKNOWN) -> fail-safe stood-down, exit 0"
ds_setup
ds_install_claude 1
ds_run "tactic-some-node" --winner "aaaa1111-1111-1111-1111-111111111111"
assert_eq "exit code 0 (fail-safe)" "0" "$DS_RC"
assert_eq "stdout is exactly stood-down" "stood-down" "$DS_OUT"
assert_eq "marker file exists" "yes" "$( [[ -f "$DS_LEDGER/tactic-some-node" ]] && echo yes || echo no )"
ds_teardown

# --- Test 4: bad arguments ----------------------------------------------------
echo "Test: bad node id -> exit 2, no marker"
ds_setup
ds_add_session "aaaa1111-1111-1111-1111-111111111111" "tactic-some-node"
ds_install_claude 0
ds_run "Not-A-Valid-Node-ID" --winner "aaaa1111-1111-1111-1111-111111111111"
assert_eq "exit code 2" "2" "$DS_RC"
assert_eq "no marker file written" "no" "$( [[ -f "$DS_LEDGER/Not-A-Valid-Node-ID" ]] && echo yes || echo no )"
ds_teardown

echo "Test: bad session id -> exit 2, no marker"
ds_setup
ds_add_session "aaaa1111-1111-1111-1111-111111111111" "tactic-some-node"
ds_install_claude 0
ds_run "tactic-some-node" --winner "not-hex!!"
assert_eq "exit code 2" "2" "$DS_RC"
assert_eq "no marker file written" "no" "$( [[ -f "$DS_LEDGER/tactic-some-node" ]] && echo yes || echo no )"
ds_teardown

echo "Test: missing --winner flag -> exit 2, no marker"
ds_setup
ds_add_session "aaaa1111-1111-1111-1111-111111111111" "tactic-some-node"
ds_install_claude 0
ds_run "tactic-some-node"
assert_eq "exit code 2" "2" "$DS_RC"
assert_eq "no marker file written" "no" "$( [[ -f "$DS_LEDGER/tactic-some-node" ]] && echo yes || echo no )"
ds_teardown

# --- Test 5: CLAUDE_CODE_SESSION_ID unset -> sessions holds only the winner --
echo "Test: CLAUDE_CODE_SESSION_ID unset -> marker sessions= holds only the winner sid, no trailing comma"
ds_setup
ds_add_session "aaaa1111-1111-1111-1111-111111111111" "tactic-some-node"
ds_install_claude 0
unset CLAUDE_CODE_SESSION_ID || true
ds_run "tactic-some-node" --winner "aaaa1111-1111-1111-1111-111111111111"
assert_eq "exit code 0" "0" "$DS_RC"
assert_eq "stdout is exactly stood-down" "stood-down" "$DS_OUT"
assert_eq "marker sessions=<winner> only" "aaaa1111-1111-1111-1111-111111111111" "$(ds_marker_field tactic-some-node sessions)"
ds_teardown

# --- Test 6: an unwritable ledger is exit 4, NOT the usage-error 2 -----------
# The caller must be able to tell "your arguments were wrong" (retry with
# different ones) from "the stand-down was NOT recorded" — yielding the turn on
# the latter re-creates the silent hold this protocol exists to close.
echo "Test: an unwritable ledger dir -> exit 4 ledger-unwritable, no marker, distinct from usage error"
ds_setup
ds_add_session "aaaa1111-1111-1111-1111-111111111111" "tactic-some-node"
ds_install_claude 0
# A regular file where the ledger dir's PARENT must be: standdown_write's
# `mkdir -p` cannot succeed, so the marker cannot be written.
printf 'not a directory\n' > "$DS_DIR/blocker"
DS_LEDGER="$DS_DIR/blocker/ledger"
ds_run "tactic-some-node" --winner "aaaa1111-1111-1111-1111-111111111111"
assert_eq "exit code 4" "4" "$DS_RC"
assert_eq "stdout is exactly ledger-unwritable" "ledger-unwritable" "$DS_OUT"
assert_eq "no marker file written" "no" "$( [[ -f "$DS_LEDGER/tactic-some-node" ]] && echo yes || echo no )"
ds_teardown

report_results
