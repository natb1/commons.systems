#!/usr/bin/env bash
# Regression test for the routing-decision-log prod-leak fix
# (tactic-test-decision-log-prod-leak). Guards two things:
#
#   Part A (dynamic): running test-dispatch-standdown.sh / test-dispatch-stop-hook.sh
#     under a redirected HOME, with the inherited log-path overrides stripped,
#     never writes to what would resolve as the production routing-decisions.jsonl
#     under that HOME.
#   Part B (static ratchet): every test-*.sh suite in this directory either
#     sources one of the two shared harnesses (dispatch-test-fixture.sh /
#     test-helpers.sh) or sets one of the log-path override env vars directly,
#     or is named in an explicit KNOWN_UNISOLATED allowlist below -- so a new
#     suite that reaches lib-decision-log.sh without isolating cannot be added
#     silently.
set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# shellcheck source=test-helpers.sh
source "$SCRIPT_DIR/test-helpers.sh"

echo "=== decision-log isolation regression ==="

# ---------------------------------------------------------------------------
# Part A -- dynamic: no suite writes to the production path.
# ---------------------------------------------------------------------------

check_suite_isolated() {
  local suite="$1"
  local fake_home out rc
  fake_home=$(mktemp -d)

  if out=$(env -u DISPATCH_DECISION_LOG_DIR -u DISPATCH_DECISION_LOG_FILE -u DECISION_LOG_FILE \
    HOME="$fake_home" "$SCRIPT_DIR/$suite" 2>&1); then
    rc=0
  else
    rc=$?
  fi

  assert_eq "$suite exits 0 under redirected HOME" "0" "$rc"
  if [[ "$rc" != "0" ]]; then
    echo "    output:"
    echo "$out" | sed 's/^/      /'
  fi

  local prod_file="$fake_home/.local/share/commons-dispatch/routing-decisions.jsonl"
  local prod_lock="$prod_file.lock"

  TOTAL=$((TOTAL + 1))
  if [[ ! -e "$prod_file" ]]; then
    PASS=$((PASS + 1))
    echo "  PASS: $suite did not write $prod_file"
  else
    FAIL=$((FAIL + 1))
    echo "  FAIL: $suite wrote $prod_file"
    echo "    contents:"
    cat "$prod_file" | sed 's/^/      /'
  fi

  TOTAL=$((TOTAL + 1))
  if [[ ! -e "$prod_lock" ]]; then
    PASS=$((PASS + 1))
    echo "  PASS: $suite did not write $prod_lock"
  else
    FAIL=$((FAIL + 1))
    echo "  FAIL: $suite wrote $prod_lock"
    echo "    contents:"
    cat "$prod_lock" | sed 's/^/      /'
  fi

  rm -rf "$fake_home"
}

check_suite_isolated "test-dispatch-standdown.sh"
check_suite_isolated "test-dispatch-stop-hook.sh"

# ---------------------------------------------------------------------------
# Part B -- static ratchet: a new suite cannot regress this by omission.
# ---------------------------------------------------------------------------

# Suites verified at plan time (2026-08-01) to not reach lib-decision-log.sh
# through either shared harness, and confirmed not to need it. Add a file here
# only if it provably cannot reach lib-decision-log.sh; otherwise source
# dispatch-test-fixture.sh or test-helpers.sh.
KNOWN_UNISOLATED=(
  test-dispatch-fleet-alarm.sh
  test-graph-write-rollback.sh
  test-lib-claude-agents-zsh-path-clobber.sh
  test-pid-cleanup.sh
  test-reclaim-audit.sh
  test-run-smoke-tests.sh
  test-sanitize-launch-env.sh
)

for f in "${KNOWN_UNISOLATED[@]}"; do
  assert_file_exists "KNOWN_UNISOLATED entry still exists: $f" "$SCRIPT_DIR/$f"
done

is_known_unisolated() {
  local name="$1" entry
  for entry in "${KNOWN_UNISOLATED[@]}"; do
    [[ "$entry" == "$name" ]] && return 0
  done
  return 1
}

for test_script in "$SCRIPT_DIR"/test-*.sh; do
  name=$(basename "$test_script")
  [[ "$name" == "test-helpers.sh" ]] && continue
  [[ "$name" == "test-decision-log-isolation.sh" ]] && continue

  isolated=false
  if grep -qF "dispatch-test-fixture.sh" "$test_script" \
    || grep -qF "test-helpers.sh" "$test_script" \
    || grep -qF "DISPATCH_DECISION_LOG_DIR" "$test_script" \
    || grep -qF "DISPATCH_DECISION_LOG_FILE" "$test_script"; then
    isolated=true
  fi

  TOTAL=$((TOTAL + 1))
  if [[ "$isolated" == "true" ]]; then
    PASS=$((PASS + 1))
    echo "  PASS: $name is isolated"
  elif is_known_unisolated "$name"; then
    PASS=$((PASS + 1))
    echo "  PASS: $name is un-isolated but explicitly allowlisted (KNOWN_UNISOLATED)"
  else
    FAIL=$((FAIL + 1))
    echo "  FAIL: $name is not isolated and not in KNOWN_UNISOLATED"
    echo "    add the file to KNOWN_UNISOLATED only if it provably cannot reach lib-decision-log.sh;"
    echo "    otherwise source dispatch-test-fixture.sh or test-helpers.sh."
  fi
done

report_results
