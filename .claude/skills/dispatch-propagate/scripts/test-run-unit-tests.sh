#!/usr/bin/env bash
# Tests for run-unit-tests.sh's auto-detect baseline.
#
# THE GATE ON THE GATES. The baseline now resolved at run-unit-tests.sh's
# resolve-diff-base.sh call used
# to be spelt `origin/main...HEAD` inline. On a push to `main` actions/checkout leaves
# refs/remotes/origin/main pointing AT the pushed commit, so that range was
# HEAD..HEAD — empty. RUN_CI_SCRIPTS / RUN_PR_SCRIPTS / RUN_NIX / RUN_RULES all
# stayed false, get-changed-apps.sh returned nothing, and the script printed
# "No test suites matched changed files. Nothing to check." and exited 0.
#
# That is the §7 circularity in this fix: those two flags decide whether the
# test-*.sh globs in .github/scripts and dispatch-propagate/scripts run AT ALL,
# so until this site is fixed no suite in either directory — including the ones
# proving this fix — has a post-merge vector.
#
# Each case runs the REAL run-unit-tests.sh with CWD inside an ephemeral repo.
# The fixture touches only .github/scripts/, so no workspace is dirty:
# ensure_deps, the build stage and vitest are all skipped and the CI-scripts
# glob is the single observable target.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd -P)"
source "$SCRIPT_DIR/test-helpers.sh"
SUT="$SCRIPT_DIR/run-unit-tests.sh"

TMP_ROOT=""
cleanup() { [ -n "${TMP_ROOT:-}" ] && rm -rf "$TMP_ROOT"; }
trap cleanup EXIT INT TERM
TMP_ROOT=$(mktemp -d)

NOTHING_TO_CHECK="No test suites matched changed files. Nothing to check."

# ---------------------------------------------------------------------------
# Fixture: a workspace repo carrying one trivial CI-script suite.
#
# $1: "at-tip"  — push-to-main shape: the .github/scripts change is in the
#                 commit that origin/main and HEAD both point at.
#     (default) — a feature branch one commit ahead of origin/main.
# $2: "failing" — make the planted suite exit 1, so the run's exit status
#                 proves the glob genuinely EXECUTED rather than merely being
#                 reported as reached.
# Sets: REPO
# ---------------------------------------------------------------------------
REPO=""
make_repo() {
  local shape="${1:-branch}" suite_mode="${2:-passing}"
  REPO=$(mktemp -d "$TMP_ROOT/repo.XXXXXX")

  git -C "$REPO" init -q -b main
  git -C "$REPO" config user.email "test@example.com"
  git -C "$REPO" config user.name "Test User"

  printf '{ "name": "root", "private": true, "workspaces": ["myapp"] }\n' \
    > "$REPO/package.json"
  mkdir -p "$REPO/myapp/src" "$REPO/.github/scripts"
  printf '{ "name": "myapp", "version": "0.0.0" }\n' > "$REPO/myapp/package.json"
  printf 'export const x = 1;\n' > "$REPO/myapp/src/index.ts"
  printf '%s\n' '#!/usr/bin/env bash' > "$REPO/.github/scripts/some-check.sh"
  git -C "$REPO" add -A
  git -C "$REPO" commit -q -m "baseline"

  local baseline
  baseline=$(git -C "$REPO" rev-parse HEAD)

  # The change under test: a .github/scripts edit, plus the suite that the
  # RUN_CI_SCRIPTS glob will pick up.
  _write_ci_change() {
    printf '%s\n' '#!/usr/bin/env bash' > "$REPO/.github/scripts/some-check.sh"
    printf '%s\n' '# edited' >> "$REPO/.github/scripts/some-check.sh"
    printf '%s\n' '#!/usr/bin/env bash' > "$REPO/.github/scripts/test-planted.sh"
    printf '%s\n' 'echo "planted CI suite ran"' >> "$REPO/.github/scripts/test-planted.sh"
    if [ "$suite_mode" = "failing" ]; then
      printf '%s\n' 'exit 1' >> "$REPO/.github/scripts/test-planted.sh"
    fi
    chmod +x "$REPO/.github/scripts/test-planted.sh"
  }

  if [ "$shape" = "at-tip" ]; then
    _write_ci_change
    git -C "$REPO" add -A
    git -C "$REPO" commit -q -m "touch .github/scripts (the push)"
    git -C "$REPO" update-ref refs/remotes/origin/main "$(git -C "$REPO" rev-parse HEAD)"
  else
    git -C "$REPO" update-ref refs/remotes/origin/main "$baseline"
    git -C "$REPO" checkout -q -b feature
    _write_ci_change
    git -C "$REPO" add -A
    git -C "$REPO" commit -q -m "touch .github/scripts"
  fi
}

# Run the SUT with CWD inside $REPO. Sets RC, OUT (stdout+stderr).
RC=0
OUT=""
run_sut() {
  local prev
  prev=$(pwd)
  cd "$REPO"
  set +e
  OUT=$("$SUT" 2>&1)
  RC=$?
  set -e
  cd "$prev"
}

# ---------------------------------------------------------------------------
# Test 1 (positive control): a feature branch reaches the CI-scripts stage.
# ---------------------------------------------------------------------------
echo "Test 1: branch shape runs the CI-script suites"
make_repo
run_sut
assert_eq "branch: exit 0" "0" "$RC"
assert_contains "branch: reached the CI-scripts stage" "=== CI scripts tests ===" "$OUT"
assert_contains "branch: the planted suite actually ran" "planted CI suite ran" "$OUT"

# ---------------------------------------------------------------------------
# Test 2 (THE FIX): the main-push shape runs the CI-script suites.
#
# The first assertion IS the bug reproduction: the expression this script used
# to carry sees nothing at all in exactly this state. The rest show the script
# now reaching, and executing, the suites.
# ---------------------------------------------------------------------------
echo "Test 2: main-push shape runs the CI-script suites"
make_repo at-tip
OLD_RANGE=$(git -C "$REPO" diff --name-only 'refs/remotes/origin/main...HEAD')  # diff-base-ok: the reproduction: asserts the old vacuous range sees nothing
assert_eq "main-push: the old three-dot range was empty" "" "$OLD_RANGE"
run_sut
assert_eq "main-push: exit 0" "0" "$RC"
assert_contains "main-push: reached the CI-scripts stage" "=== CI scripts tests ===" "$OUT"
assert_contains "main-push: the planted suite actually ran" "planted CI suite ran" "$OUT"
_absent=absent
[[ "$OUT" == *"$NOTHING_TO_CHECK"* ]] && _absent=present
assert_eq "main-push: the vacuous-exit message is absent" "absent" "$_absent"

# ---------------------------------------------------------------------------
# Test 3: a failing suite in the main-push shape reddens the run.
#
# Reaching the stage is not the same as the stage deciding the exit status.
# Before the fix a broken CI script could not redden a post-merge run at all,
# because the glob never executed.
# ---------------------------------------------------------------------------
echo "Test 3: main-push shape lets a failing CI suite redden the run"
make_repo at-tip failing
run_sut
[ "$RC" -ne 0 ] && _rc=nonzero || _rc=zero
assert_eq "main-push/failing: exit non-zero" "nonzero" "$_rc"
assert_contains "main-push/failing: names the failed lane" "Failed suites: ci-scripts" "$OUT"

# ---------------------------------------------------------------------------
# Test 4: an unresolvable baseline is a hard error, not a vacuous pass.
#
# The helper's exit code must propagate. run-unit-tests.sh assigns it in a plain
# assignment under `set -e`; get-changed-apps.sh (reached first, at :68) is
# checked with `if !`. Either way the run must go red rather than print
# "Nothing to check" and exit 0.
# ---------------------------------------------------------------------------
echo "Test 4: unresolvable baseline exits non-zero rather than passing vacuously"
make_repo
git -C "$REPO" update-ref -d refs/remotes/origin/main
run_sut
[ "$RC" -ne 0 ] && _rc=nonzero || _rc=zero
assert_eq "no origin/main: exit non-zero" "nonzero" "$_rc"
_absent=absent
[[ "$OUT" == *"$NOTHING_TO_CHECK"* ]] && _absent=present
assert_eq "no origin/main: did not report nothing-to-check" "absent" "$_absent"

report_results
