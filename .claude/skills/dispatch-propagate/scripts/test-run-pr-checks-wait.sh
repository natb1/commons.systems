#!/usr/bin/env bash
# Tests for run-pr-checks-wait.sh's bounded watch and its pending-row verdict.
#
# Two defects are covered here:
#
#   1. The watch was unbounded. `gh pr checks --watch` blocks on a check run
#      that never reports (GitHub leaves it `queued` with a null conclusion
#      after its parent check suite has already concluded), and this script is
#      invoked by a model through the Bash tool, whose ceiling is 600s — so the
#      whole tool call burned with no verdict.
#
#   2. Bounding the watch ALONE would be worse than the hang: the post-watch
#      parse exits 1 only on gh's `fail` bucket, so a still-`pending` row would
#      fall through to exit 0 — a false green on a PR whose CI never reported.
#
# The suite runs the REAL run-pr-checks-wait.sh (not a copy), so it sources the
# REAL lib.sh from its own directory and the pending arm reaches the real
# dispatch_ci_verdict_rest — including that helper's orphaned-check-run rule (a
# run whose parent suite has concluded is adapted to STALE, hence `failing`).
# Only `gh` and `timeout` are stubbed onto PATH; the stub `timeout` logs its
# invocation and then execs the real coreutils binary, so the bound is genuinely
# enforced rather than merely observed.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd -P)"
source "$SCRIPT_DIR/test-helpers.sh"
SUT="$SCRIPT_DIR/run-pr-checks-wait.sh"

# Resolve the real coreutils timeout BEFORE the stub shadows it on PATH.
REAL_TIMEOUT="$(command -v timeout)" || REAL_TIMEOUT=""
if [[ -z "$REAL_TIMEOUT" ]]; then
  echo "ERROR: coreutils timeout not found on PATH; run-pr-checks-wait.sh requires it" >&2
  exit 1
fi

SAVED_PATH="$PATH"
TMP_ROOT=""
STUB=""
cleanup() {
  PATH="$SAVED_PATH"
  [[ -n "${TMP_ROOT:-}" ]] && rm -rf "$TMP_ROOT"
  return 0
}
trap cleanup EXIT INT TERM

# A tick-owned verdict cache would shadow the classifier's answer here.
unset DISPATCH_CI_VERDICT_CACHE || true
# Keep a stub error from costing four retries with backoff sleeps.
export GH_RETRY_ATTEMPTS=1

PR=42

# A REST pull object shaped the way gh_pr_view_rest's projection expects
# (.state and .head.sha are read unconditionally). $1 = head sha.
write_pr_fixture() {
  local sha="$1"
  cat > "$STUB/pr.json" <<EOF
{
  "number": $PR,
  "title": "a pull request",
  "body": "",
  "state": "open",
  "merged_at": null,
  "merge_commit_sha": null,
  "mergeable": true,
  "mergeable_state": "blocked",
  "head": {"ref": "a-branch", "sha": "$sha"},
  "labels": []
}
EOF
}

setup() {
  TMP_ROOT=$(mktemp -d)
  STUB="$TMP_ROOT/stub"
  mkdir -p "$TMP_ROOT/bin" "$STUB"
  : > "$STUB/gh-calls.log"
  : > "$STUB/timeout-calls.log"

  cat > "$TMP_ROOT/bin/gh" <<EOF
#!/usr/bin/env bash
STUB="$STUB"
EOF
  cat >> "$TMP_ROOT/bin/gh" <<'STUBEOF'
printf 'gh %s\n' "$*" >> "$STUB/gh-calls.log"

if [[ "${1:-}" == "api" ]]; then
  path=""
  for a in "$@"; do path="$a"; done
  case "$path" in
    */check-runs)
      sha="${path%/check-runs}"
      sha="${sha##*/}"
      if [[ -f "$STUB/check-runs-$sha.json" ]]; then
        cat "$STUB/check-runs-$sha.json"
        exit 0
      fi
      printf 'stub gh: no check-runs fixture for sha %s\n' "$sha" >&2
      exit 1
      ;;
    */check-suites/*)
      suite="${path##*/}"
      if [[ -f "$STUB/check-suite-$suite.json" ]]; then
        cat "$STUB/check-suite-$suite.json"
        exit 0
      fi
      printf 'stub gh: no check-suite fixture for %s\n' "$suite" >&2
      exit 1
      ;;
    */pulls/*)
      if [[ -f "$STUB/pr.json" ]]; then
        cat "$STUB/pr.json"
        exit 0
      fi
      printf 'stub gh: no pull fixture\n' >&2
      exit 1
      ;;
  esac
  printf 'stub gh: unhandled api path: %s\n' "$path" >&2
  exit 1
fi

if [[ "${1:-}" == "pr" && "${2:-}" == "checks" ]]; then
  for a in "$@"; do
    if [[ "$a" == "--watch" ]]; then
      if [[ -f "$STUB/watch-sleep" ]]; then
        sleep "$(cat "$STUB/watch-sleep")"
      fi
      exit 0
    fi
    if [[ "$a" == "--json" ]]; then
      cat "$STUB/checks.json"
      exit 0
    fi
  done
  # Human-readable table (display only).
  printf 'some-check\tpass\t1s\n'
  exit 0
fi

printf 'stub gh: unhandled invocation: %s\n' "$*" >&2
exit 1
STUBEOF
  chmod +x "$TMP_ROOT/bin/gh"

  # Recording pass-through for timeout: proves the watch runs UNDER a bound and
  # still enforces it (the real binary does the killing).
  cat > "$TMP_ROOT/bin/timeout" <<EOF
#!/usr/bin/env bash
printf 'timeout %s\n' "\$*" >> "$STUB/timeout-calls.log"
exec "$REAL_TIMEOUT" "\$@"
EOF
  chmod +x "$TMP_ROOT/bin/timeout"

  PATH="$TMP_ROOT/bin:$SAVED_PATH"
}

teardown() {
  PATH="$SAVED_PATH"
  rm -rf "$TMP_ROOT"
  TMP_ROOT=""
  STUB=""
}

RC=0
OUT=""
run_sut() {
  RC=0
  set +e
  OUT=$("$SUT" "$PR" 2>&1)
  RC=$?
  set -e
}

# ---------------------------------------------------------------------------
# Unchanged behavior: gh's `fail` bucket stays the authoritative red signal, and
# an all-green board stays green.
# ---------------------------------------------------------------------------

echo "=== fail bucket and all-pass (unchanged) ==="
setup
cat > "$STUB/checks.json" <<'EOF'
[{"bucket":"fail","state":"FAILURE","name":"unit-tests"},
 {"bucket":"pass","state":"SUCCESS","name":"lint"}]
EOF
run_sut
assert_eq "fail bucket → exit 1" "1" "$RC"
# The fail parse runs FIRST and short-circuits, so no classifier call is needed.
api_calls=$(grep -c 'gh api' "$STUB/gh-calls.log") || api_calls=0
assert_eq "fail bucket → no REST classifier call" "0" "$api_calls"
teardown

setup
cat > "$STUB/checks.json" <<'EOF'
[{"bucket":"pass","state":"SUCCESS","name":"unit-tests"},
 {"bucket":"pass","state":"SUCCESS","name":"lint"}]
EOF
run_sut
assert_eq "all pass → exit 0" "0" "$RC"
teardown

# ---------------------------------------------------------------------------
# The new pending arm. A `pending` row is not `fail`, so before this change the
# script fell through to exit 0 on every case below.
# ---------------------------------------------------------------------------

echo "=== pending row → classifier verdict ==="

# Orphaned check run: `queued` with a null conclusion, parent suite COMPLETED.
# dispatch_ci_verdict_rest adapts it to STALE, which classifies `failing`.
setup
cat > "$STUB/checks.json" <<'EOF'
[{"bucket":"pass","state":"SUCCESS","name":"lint"},
 {"bucket":"pending","state":"QUEUED","name":"e2e-tests"}]
EOF
write_pr_fixture "sha-orphan"
cat > "$STUB/check-runs-sha-orphan.json" <<'EOF'
{"check_runs":[{"status":"completed","conclusion":"success","check_suite":{"id":880}},
               {"status":"queued","conclusion":null,"check_suite":{"id":990}}]}
EOF
printf '%s' '{"status":"completed"}' > "$STUB/check-suite-990.json"
run_sut
assert_eq "pending row classifying failing → exit 1" "1" "$RC"
assert_contains "pending row classifying failing → names the stuck check" \
  "e2e-tests" "$OUT"
teardown

# Genuinely still-running check: parent suite has NOT concluded, so the orphan
# rule does not fire and the verdict is pending — indeterminate, not green.
setup
cat > "$STUB/checks.json" <<'EOF'
[{"bucket":"pass","state":"SUCCESS","name":"lint"},
 {"bucket":"pending","state":"IN_PROGRESS","name":"slow-suite"}]
EOF
write_pr_fixture "sha-running"
cat > "$STUB/check-runs-sha-running.json" <<'EOF'
{"check_runs":[{"status":"in_progress","conclusion":null,"check_suite":{"id":991}}]}
EOF
printf '%s' '{"status":"in_progress"}' > "$STUB/check-suite-991.json"
PR_CHECKS_WATCH_S=7 run_sut
assert_eq "pending row still pending → exit 2 (not green)" "2" "$RC"
assert_contains "pending row still pending → reports the bound it waited out" \
  "checks not concluded after 7s" "$OUT"
teardown

# A pending row that the classifier resolves green (skipped/neutral noise).
setup
cat > "$STUB/checks.json" <<'EOF'
[{"bucket":"pass","state":"SUCCESS","name":"lint"},
 {"bucket":"pending","state":"QUEUED","name":"noise"}]
EOF
write_pr_fixture "sha-green"
cat > "$STUB/check-runs-sha-green.json" <<'EOF'
{"check_runs":[{"status":"completed","conclusion":"success"},
               {"status":"completed","conclusion":"neutral"},
               {"status":"completed","conclusion":"skipped"}]}
EOF
run_sut
assert_eq "pending row classifying passing → exit 0" "0" "$RC"
teardown

# ---------------------------------------------------------------------------
# The bound itself.
# ---------------------------------------------------------------------------

echo "=== the watch is bounded ==="
setup
cat > "$STUB/checks.json" <<'EOF'
[{"bucket":"pass","state":"SUCCESS","name":"lint"}]
EOF
run_sut
assert_eq "default bound: exit 0" "0" "$RC"
assert_file_contains "watch runs under timeout with the 540s default" \
  "$STUB/timeout-calls.log" "timeout 540 gh pr checks $PR --watch"

# Regression guard. The bound exists so the pending-row classification below the
# watch actually runs; the real caller is a model Bash tool call whose own
# ceiling is 600s. A default at or above 600 is unreachable — the tool call dies
# before `timeout` fires and no verdict is produced. Assert the INEQUALITY, not
# just the literal, so a future edit that raises the default past the ceiling
# goes red even if it also updates the literal above.
default_bound=$(sed -n 's/^timeout \([0-9][0-9]*\) gh pr checks.*/\1/p' \
  "$STUB/timeout-calls.log" | head -1)
assert_eq "default bound is numeric" "540" "$default_bound"
if [[ -n "$default_bound" && "$default_bound" -lt 600 ]]; then
  assert_eq "default bound sits under the 600s Bash-tool ceiling" "ok" "ok"
else
  assert_eq "default bound sits under the 600s Bash-tool ceiling" \
    "ok" "bound ${default_bound:-<unparsed>} is not < 600"
fi
teardown

setup
cat > "$STUB/checks.json" <<'EOF'
[{"bucket":"pass","state":"SUCCESS","name":"lint"}]
EOF
PR_CHECKS_WATCH_S=33 run_sut
assert_file_contains "PR_CHECKS_WATCH_S overrides the bound" \
  "$STUB/timeout-calls.log" "timeout 33 gh pr checks $PR --watch"
teardown

# A watch that outlives the bound must be cut off and the verdict parse must
# still run. Without the bound this call blocks for the full stub sleep.
setup
printf '%s' '10' > "$STUB/watch-sleep"
cat > "$STUB/checks.json" <<'EOF'
[{"bucket":"fail","state":"FAILURE","name":"unit-tests"}]
EOF
started=$SECONDS
PR_CHECKS_WATCH_S=1 run_sut
elapsed=$((SECONDS - started))
assert_eq "watch exceeding the bound still reaches the verdict parse" "1" "$RC"
if [[ "$elapsed" -lt 8 ]]; then
  assert_eq "watch exceeding the bound returns near the bound, not the sleep" "ok" "ok"
else
  assert_eq "watch exceeding the bound returns near the bound, not the sleep" \
    "ok" "took ${elapsed}s"
fi
teardown

report_results
