#!/usr/bin/env bash
# Unit tests for sanitize_launch_env() from lib-sanitize-launch-env.sh (#1879).
# Runs standalone: ./test-sanitize-launch-env.sh
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/lib-sanitize-launch-env.sh"

# --- test helpers (copied verbatim from test-dispatch-scripts.sh) ------------

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

# --- helper: run a subshell case and accumulate counters in parent -----------
# Each case runs in a subshell (to isolate PATH / DIRENV_ mutations). The
# subshell prints "  PASS: ..." / "  FAIL: ..." lines which we collect and
# count in the parent so report_results sees real totals.
run_case() {
  local case_label="$1"
  shift
  echo "--- $case_label ---"

  local output rc
  # Use `if` form so set -e does not abort on a subshell non-zero exit;
  # we want to collect output even if the subshell fails.
  if output=$("$@" 2>&1); then rc=0; else rc=$?; fi
  echo "$output"

  local p f
  p=$(grep -c "^  PASS:" <<<"$output" 2>/dev/null || true)
  f=$(grep -c "^  FAIL:" <<<"$output" 2>/dev/null || true)

  # Infrastructure-failure guard: a subshell that crashes before emitting any
  # PASS/FAIL line (e.g. a failed `source`, a bash error, or an E2BIG during
  # case setup) would otherwise contribute 0 assertions, letting report_results
  # pass vacuously. If neither a PASS nor a FAIL was emitted and the subshell
  # exited non-zero, record one synthetic FAIL so the crash is reported.
  if (( p == 0 && f == 0 && rc != 0 )); then
    echo "  FAIL: $case_label (subshell crashed, rc=$rc, no PASS/FAIL emitted)"
    f=1
  fi

  PASS=$((PASS + p))
  FAIL=$((FAIL + f))
  TOTAL=$((TOTAL + p + f))
}

# --- Case 1 body: runs inside a subshell via run_case -------------------------
# Isolates the big DIRENV_DIFF export and PATH mutation from later cases.
case1_body() {
  # Re-source the lib inside the subshell (it was sourced at top level so the
  # function definition is inherited, but assert_eq helpers are NOT — they live
  # in the parent's environment; this subshell defines its own copies).
  PASS=0; FAIL=0; TOTAL=0

  assert_eq() {
    local label="$1" expected="$2" actual="$3"
    if [[ "$expected" == "$actual" ]]; then
      echo "  PASS: $label"
    else
      echo "  FAIL: $label"
      echo "    expected: '$expected'"
      echo "    actual:   '$actual'"
    fi
  }

  export DIRENV_DIFF="$(head -c 1500000 /dev/zero | tr '\0' x)"
  export DIRENV_WATCHES="something"
  export PATH="/a:/b:/a:/b:/c:/a:$PATH"

  sanitize_launch_env

  # (a) DIRENV_* vars are gone
  assert_eq "case1a DIRENV_DIFF gone"    "UNSET" "${DIRENV_DIFF:-UNSET}"
  assert_eq "case1a DIRENV_WATCHES gone" "UNSET" "${DIRENV_WATCHES:-UNSET}"
  direnv_remaining="${!DIRENV_@}"
  assert_eq "case1a no DIRENV_ vars remain" "" "$direnv_remaining"

  # (b) PATH is deduped and order-preserved: the synthetic prefix collapses to /a:/b:/c
  prefix="$(cut -d: -f1-3 <<<"$PATH")"
  assert_eq "case1b prefix is /a:/b:/c" "/a:/b:/c" "$prefix"
  # Confirm no second /a survives: :/a: must appear at most once
  no_second_a="$(case ":$PATH:" in *:/a:*:/a:*) echo dup;; *) echo no-dup;; esac)"
  assert_eq "case1b no duplicate /a" "no-dup" "$no_second_a"

  # (c) A child execve still works after the prune. Use the `if` form so a
  # non-zero `env` exit is captured into child_rc and reported as a FAIL,
  # rather than aborting the subshell under set -e before the assertion runs.
  if env >/dev/null; then child_rc=0; else child_rc=$?; fi
  assert_eq "case1c child execve succeeds" "0" "$child_rc"

  # Dedup on a fully controlled synthetic PATH: prepend dupes in a sub-subshell
  # (real PATH still in scope so step 3 finds env/wc/getconf).
  synthetic_result="$(
    export PATH="/a:/b:/a:/b:/c:/a:$PATH"
    sanitize_launch_env >/dev/null 2>&1
    cut -d: -f1-3 <<<"$PATH"
  )"
  assert_eq "case1b synthetic dedup" "/a:/b:/c" "$synthetic_result"
}

# --- Case 2 body: no DIRENV_* vars set — no unbound-variable error -----------
case2_body() {
  assert_eq() {
    local label="$1" expected="$2" actual="$3"
    if [[ "$expected" == "$actual" ]]; then
      echo "  PASS: $label"
    else
      echo "  FAIL: $label"
      echo "    expected: '$expected'"
      echo "    actual:   '$actual'"
    fi
  }

  # Clear any DIRENV_* that may be inherited from the outer shell (e.g. direnv)
  unset -v "${!DIRENV_@}" 2>/dev/null || true

  if sanitize_launch_env; then rc=0; else rc=$?; fi
  assert_eq "case2 returns 0 with no DIRENV_ vars" "0" "$rc"
}

# --- Case 3 body: over-budget environment triggers the guard ------------------
# The guard's budget is ARG_MAX - 131072. We need a single NON-DIRENV_ var (so
# step 1's prune won't remove it) sized to land in a narrow window:
#   - above budget  (ARG_MAX - 131072)  → guard fires and returns 1
#   - below ARG_MAX                      → step 3's env/wc/getconf can still exec
# This keeps the test in the "guard fires cleanly" zone, not "env itself is
# E2BIG before the guard can measure it" zone.
#
# ARG_MAX is not a portable constant (Linux often 2 MB or 3.2 MB; macOS ~1 MB),
# so the BIG size MUST be computed from the live `getconf ARG_MAX` rather than
# hardcoded — otherwise the `export BIG=...` itself E2BIGs on small-ARG_MAX
# platforms and the subshell crashes with no PASS/FAIL output. We place BIG at
# budget + 65536: comfortably above the budget, and with ~64 KB of the 131072
# safety margin still free below ARG_MAX for env/wc/getconf to exec. If ARG_MAX
# is too small to open this window at all, skip the case rather than crash.
case3_body() {
  assert_eq() {
    local label="$1" expected="$2" actual="$3"
    if [[ "$expected" == "$actual" ]]; then
      echo "  PASS: $label"
    else
      echo "  FAIL: $label"
      echo "    expected: '$expected'"
      echo "    actual:   '$actual'"
    fi
  }

  local _arg_max _big_size
  _arg_max=$(getconf ARG_MAX)
  # Need room for a value above (ARG_MAX - 131072) yet below ARG_MAX. With a
  # 262144 floor the window (and the rest of the env) comfortably fits.
  if (( _arg_max < 262144 )); then
    echo "  PASS: case3 skip (ARG_MAX too small: ${_arg_max})"
    return 0
  fi
  _big_size=$(( (_arg_max - 131072) + 65536 ))

  export BIG="$(head -c "$_big_size" /dev/zero | tr '\0' x)"

  # Capture stderr; use `if` form so set -e does not abort on return 1
  if err=$(sanitize_launch_env 2>&1 1>/dev/null); then rc=0; else rc=$?; fi

  assert_eq "case3 guard returns non-zero" "1" "$rc"

  has_ticket="$(case "$err" in *'#1879'*) echo yes;; *) echo no;; esac)"
  assert_eq "case3 stderr contains #1879" "yes" "$has_ticket"

  has_oversized="$(case "$err" in *'too large'*|*'Argument list'*|*'oversized'*) echo yes;; *) echo no;; esac)"
  assert_eq "case3 stderr names env-size cause" "yes" "$has_oversized"
}

# --- Run cases ---------------------------------------------------------------

run_case "Case 1: DIRENV_ prune and PATH dedup" bash -c "
  source '$SCRIPT_DIR/lib-sanitize-launch-env.sh'
  $(declare -f case1_body)
  case1_body
"

run_case "Case 2: no DIRENV_ vars, returns 0 under set -u" bash -c "
  source '$SCRIPT_DIR/lib-sanitize-launch-env.sh'
  $(declare -f case2_body)
  case2_body
"

run_case "Case 3: over-budget env triggers guard" bash -c "
  source '$SCRIPT_DIR/lib-sanitize-launch-env.sh'
  $(declare -f case3_body)
  case3_body
"

report_results
