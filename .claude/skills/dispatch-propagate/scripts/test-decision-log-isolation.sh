#!/usr/bin/env bash
# Regression test for the routing-decision-log prod-leak fix
# (tactic-test-decision-log-prod-leak). Guards three things:
#
#   Part A (dynamic): running test-dispatch-standdown.sh / test-dispatch-stop-hook.sh
#     under a redirected HOME, with the inherited log-path overrides stripped,
#     writes nothing at all under what would resolve as the production
#     $HOME/.local/share/commons-dispatch directory.
#   Part B (static ratchet, pre-filter only): every test-*.sh suite in this
#     directory either sources one of the two shared harnesses
#     (dispatch-test-fixture.sh / test-helpers.sh) or assigns one of the
#     log-path override env vars, or is named in an explicit KNOWN_UNISOLATED
#     allowlist below -- so a new suite that reaches lib-decision-log.sh
#     without isolating cannot be added silently.
#
#     The static match is deliberately anchored to a real *statement* (an
#     actual `source`/`.` line, an actual `VAR=` assignment), not a bare
#     substring anywhere in the file. A substring search is trivially satisfied
#     by accident: a prose comment naming the harness, a commented-out source
#     line, or a string literal naming the env var all marked a still-leaking
#     suite "isolated". That was not hypothetical -- two suites here
#     (test-dispatch-daemon-liveness.sh, test-dispatch-heal-units.sh) name
#     dispatch-test-fixture.sh only in their header prose, and the substring
#     form passed them while they isolate nothing. Both are now allowlisted and
#     dynamically proved by Part C.
#
#     Known residual limit of any grep-based matcher: a line inside a here-doc
#     body is indistinguishable from a statement without parsing the shell, so
#     a suite whose only "source" line is here-doc content would still be read
#     as isolated. Detecting that needs a shell parser, which is more machinery
#     than this ratchet is worth; it is also not an accidental shape, unlike
#     the prose mentions above. Part A remains the real proof for the suites
#     that matter.
#   Part C (dynamic, allowlist): every KNOWN_UNISOLATED entry is *proved* not
#     to leak by the Part A check rather than merely asserted to be harmless,
#     so the allowlist cannot silently become a hole. The same dynamic check is
#     not run over all ~145 suites: that would re-run the entire shell suite a
#     second time inside one test. The static ratchet is the cheap pre-filter;
#     anything it exempts is dynamically verified here.
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

  # Assert on the whole production directory, not just routing-decisions.jsonl
  # and its .lock: any file created there under the redirected HOME means the
  # suite resolved a production path.
  local prod_dir="$fake_home/.local/share/commons-dispatch"
  local leaked entry
  leaked=$(find "$prod_dir" -mindepth 1 2>/dev/null)

  TOTAL=$((TOTAL + 1))
  if [[ -z "$leaked" ]]; then
    PASS=$((PASS + 1))
    echo "  PASS: $suite wrote nothing under $prod_dir"
  else
    FAIL=$((FAIL + 1))
    echo "  FAIL: $suite wrote under $prod_dir:"
    echo "$leaked" | sed 's/^/      /'
    while IFS= read -r entry; do
      [[ -f "$entry" ]] || continue
      echo "    contents of $entry:"
      sed 's/^/      /' "$entry"
    done <<<"$leaked"
  fi

  rm -rf "$fake_home"
}

check_suite_isolated "test-dispatch-standdown.sh"
check_suite_isolated "test-dispatch-stop-hook.sh"

# ---------------------------------------------------------------------------
# Part B -- static ratchet: a new suite cannot regress this by omission.
# ---------------------------------------------------------------------------

# Suites that isolate through neither shared harness nor an override
# assignment. Every entry is dynamically proved leak-free by Part C below, so
# adding a file here is not a way to opt out of the check -- an entry that
# actually reaches lib-decision-log.sh fails Part C. Prefer sourcing
# dispatch-test-fixture.sh or test-helpers.sh over adding a file here.
KNOWN_UNISOLATED=(
  test-dispatch-daemon-liveness.sh
  test-dispatch-fleet-alarm.sh
  test-dispatch-heal-units.sh
  test-dispatch-terminal-gap-audit.sh
  test-graph-write-rollback.sh
  test-lib-claude-agents-zsh-path-clobber.sh
  test-pid-cleanup.sh
  test-reclaim-audit.sh
  test-run-smoke-tests.sh
  test-sanitize-launch-env.sh
)

# Anchored to real statements. `SOURCE_RE` must match an actual `source`/`.`
# command; `ASSIGN_RE` an actual assignment to one of the override vars. A
# mention inside a comment, a string literal, or a here-doc must not count --
# that is the false-assurance hole a fixed-substring search leaves open.
SOURCE_RE='^[[:space:]]*(source|\.)[[:space:]]+.*(test-helpers|dispatch-test-fixture)\.sh'
ASSIGN_RE='^[[:space:]]*(export[[:space:]]+|env[[:space:]]+)?DISPATCH_DECISION_LOG_(DIR|FILE)='

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
  if grep -Eq "$SOURCE_RE" "$test_script" || grep -Eq "$ASSIGN_RE" "$test_script"; then
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
    echo "    (the static match is anchored: a mention in a comment or string does not count.)"
  fi
done

# ---------------------------------------------------------------------------
# Part C -- dynamic: the allowlist is proved, not promised.
# ---------------------------------------------------------------------------
# Everything Part B exempts gets the Part A treatment, so "provably cannot
# reach lib-decision-log.sh" is re-proved on every run instead of resting on a
# reviewer's word at the time the entry was added.

for f in "${KNOWN_UNISOLATED[@]}"; do
  check_suite_isolated "$f"
done

report_results
