#!/usr/bin/env bash
# Tests for detect-changes.sh (+ list-go-modules.sh) -- moved verbatim from test-dispatch-scripts.sh
# (tactic-dispatch-test-monolith-split). Originally mis-homed as a trailing section of
# test-dispatch-jit-calendar-import.sh: this section was added to the monolith after the
# tactic's manifest, under a non-standard '----' banner the extractor's '====' boundary
# detector missed, so it landed in the wrong file; this moves it to its own home.
set -euo pipefail

FIXTURE_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=dispatch-test-fixture.sh
source "$FIXTURE_DIR/dispatch-test-fixture.sh"

# >>> MOVED FROM test-dispatch-scripts.sh >>>
# ---------------------------------------------------------------------------
# Tests for detect-changes.sh
# ---------------------------------------------------------------------------
#
# Integration tests that run the REAL detect-changes.sh and the REAL
# list-go-modules.sh against a stubbed `git` and a fake repo tree. The fake
# tree carries go.mod files at the three module roots so list-go-modules.sh
# performs genuine module discovery and detect-changes.sh builds its runtime
# `grep -E` alternation regex from that discovery (PR #745). Nothing here
# re-implements the detection logic.

dc_setup() {
  TEST_TMP="$(mktemp -d)"
  cp "$SCRIPT_DIR/detect-changes.sh" "$TEST_TMP/"
  cp "$SCRIPT_DIR/list-go-modules.sh" "$TEST_TMP/"
  chmod +x "$TEST_TMP/detect-changes.sh" "$TEST_TMP/list-go-modules.sh"

  # Stub resolve-diff-base.sh alongside the copied SUT. These cases exercise
  # the CATEGORY regexes against a stubbed git, not baseline resolution, so the
  # base is a fixed sentinel; resolve-diff-base.sh has its own suite
  # (test-resolve-diff-base.sh) and the real-repo cases at the bottom of this
  # file exercise the two wired together. $DC_BASE_RC lets a case make the
  # helper fail, which must abort detect-changes.sh rather than yield "no
  # categories".
  export DC_BASE_RC=0
  cat > "$TEST_TMP/resolve-diff-base.sh" <<BASEEOF
#!/usr/bin/env bash
if [ "\${DC_BASE_RC:-0}" -ne 0 ]; then
  echo "resolve-diff-base: stubbed failure" >&2
  exit "\$DC_BASE_RC"
fi
echo "0000000000000000000000000000000000000000"
BASEEOF
  chmod +x "$TEST_TMP/resolve-diff-base.sh"

  # Fake repo root whose go.mod files drive genuine module discovery.
  FAKE_REPO="$TEST_TMP/repo"
  mkdir -p "$FAKE_REPO/budget-etl" \
           "$FAKE_REPO/scaffolding/firebase" \
           "$FAKE_REPO/retired-tui"
  : > "$FAKE_REPO/budget-etl/go.mod"
  : > "$FAKE_REPO/scaffolding/firebase/go.mod"
  : > "$FAKE_REPO/retired-tui/go.mod"

  # Per-test inputs/outputs.
  DC_CHANGED="$TEST_TMP/changed.txt"
  : > "$DC_CHANGED"
  GITHUB_OUTPUT="$TEST_TMP/github_output.txt"
  export GITHUB_OUTPUT
  : > "$GITHUB_OUTPUT"

  STUB_BIN="$TEST_TMP/bin"
  mkdir -p "$STUB_BIN"
  ORIG_PATH="$PATH"
  export PATH="$STUB_BIN:$PATH"

  # Stub git: diff cats the per-test changed-files list; show-toplevel echoes
  # the fake repo root (so list-go-modules.sh discovers the fake modules).
  # A leading `-C <dir>` is skipped: detect-changes.sh now names the tree it
  # diffs explicitly rather than relying on the process CWD.
  cat > "$STUB_BIN/git" <<GITEOF
#!/usr/bin/env bash
set -euo pipefail
if [ "\${1:-}" = "-C" ]; then shift 2; fi
cmd="\$1"; shift || true
case "\$cmd" in
  diff)
    cat "$DC_CHANGED"
    ;;
  rev-parse)
    echo "$FAKE_REPO"
    ;;
  *)
    echo "unexpected git: \$cmd \$*" >&2
    exit 1
    ;;
esac
GITEOF
  chmod +x "$STUB_BIN/git"
}

dc_teardown() {
  export PATH="$ORIG_PATH"
  unset GITHUB_OUTPUT
  rm -rf "$TEST_TMP"
}

# Write a changed-files list, run detect-changes.sh, then print "true" if the
# given output key was emitted as "<key>=true", else "false".
dc_run() {
  local key="$1"; shift
  printf '%s\n' "$@" > "$DC_CHANGED"
  : > "$GITHUB_OUTPUT"
  "$TEST_TMP/detect-changes.sh" >/dev/null 2>&1
  if grep -qx "${key}=true" "$GITHUB_OUTPUT"; then
    echo "true"
  else
    echo "false"
  fi
}

# Same, for a changed-files list the caller has already written to $DC_CHANGED.
# The SIGPIPE case below needs a list far too large to pass as argv.
dc_run_prewritten() {
  local key="$1"
  : > "$GITHUB_OUTPUT"
  "$TEST_TMP/detect-changes.sh" >/dev/null 2>&1
  if grep -qx "${key}=true" "$GITHUB_OUTPUT"; then
    echo "true"
  else
    echo "false"
  fi
}

# --- nix ---
dc_setup
assert_eq "detect-changes: nix=true for *.nix file"        "true"  "$(dc_run nix 'nix/foo.nix')"
assert_eq "detect-changes: nix=true for flake.nix"         "true"  "$(dc_run nix 'flake.nix')"
assert_eq "detect-changes: nix=true for flake.lock"        "true"  "$(dc_run nix 'flake.lock')"
assert_eq "detect-changes: nix absent for unrelated path"  "false" "$(dc_run nix 'README.md')"
dc_teardown

# --- playwright ---
dc_setup
assert_eq "detect-changes: playwright=true for package-lock.json"    "true"  "$(dc_run playwright 'package-lock.json')"
assert_eq "detect-changes: playwright=true for flake.lock"           "true"  "$(dc_run playwright 'flake.lock')"
assert_eq "detect-changes: playwright=true for version-sync script"  "true"  "$(dc_run playwright '.github/scripts/check-playwright-version-sync.sh')"
assert_eq "detect-changes: playwright absent for unrelated path"     "false" "$(dc_run playwright 'README.md')"
dc_teardown

# --- rules ---
dc_setup
assert_eq "detect-changes: rules=true for firestore.rules"         "true"  "$(dc_run rules 'firestore.rules')"
assert_eq "detect-changes: rules=true for storage.rules"           "true"  "$(dc_run rules 'storage.rules')"
assert_eq "detect-changes: rules=true for packages/rules-test/ path"        "true"  "$(dc_run rules 'packages/rules-test/x')"
assert_eq "detect-changes: rules=true for detect-changes.sh self"  "true"  "$(dc_run rules '.claude/skills/dispatch-propagate/scripts/detect-changes.sh')"
assert_eq "detect-changes: rules=true for firebase.json"           "true"  "$(dc_run rules 'firebase.json')"
assert_eq "detect-changes: rules=true for package.json"            "true"  "$(dc_run rules 'package.json')"
assert_eq "detect-changes: rules absent for unrelated path"        "false" "$(dc_run rules 'README.md')"
dc_teardown

# --- graph ---
dc_setup
assert_eq "detect-changes: graph=true for packages/intentionsutil path"  "true"  "$(dc_run graph 'packages/intentionsutil/src/sensors.ts')"
assert_eq "detect-changes: graph=true for validate-graph.ts"             "true"  "$(dc_run graph 'packages/intentionsutil/scripts/validate-graph.ts')"
assert_eq "detect-changes: graph=true for an intentions/ node"           "true"  "$(dc_run graph 'intentions/tactic-x.md')"
assert_eq "detect-changes: graph absent for unrelated path"              "false" "$(dc_run graph 'README.md')"
assert_eq "detect-changes: graph absent for another package"             "false" "$(dc_run graph 'packages/ds/src/x.ts')"
dc_teardown

# --- go (the core of #749: regex must cover every discovered module root) ---
dc_setup
assert_eq "detect-changes: go=true for budget-etl module"           "true"  "$(dc_run go 'budget-etl/main.go')"
assert_eq "detect-changes: go=true for scaffolding/firebase module" "true"  "$(dc_run go 'scaffolding/firebase/x.go')"
assert_eq "detect-changes: go=true for retired-tui module"         "true"  "$(dc_run go 'retired-tui/y.go')"
assert_eq "detect-changes: go absent for non-Go path"               "false" "$(dc_run go 'README.md')"
dc_teardown

# --- combined multi-file diff sets multiple categories ---
dc_setup
assert_eq "detect-changes: combined diff sets nix=true" "true" "$(dc_run nix 'flake.nix' 'budget-etl/main.go')"
assert_eq "detect-changes: combined diff sets go=true"  "true" "$(dc_run go  'flake.nix' 'budget-etl/main.go')"
dc_teardown

# --- empty diff sets none of the keys ---
dc_setup
assert_eq "detect-changes: empty diff leaves nix unset"        "false" "$(dc_run nix)"
assert_eq "detect-changes: empty diff leaves playwright unset" "false" "$(dc_run playwright)"
assert_eq "detect-changes: empty diff leaves rules unset"      "false" "$(dc_run rules)"
assert_eq "detect-changes: empty diff leaves graph unset"      "false" "$(dc_run graph)"
assert_eq "detect-changes: empty diff leaves go unset"         "false" "$(dc_run go)"
dc_teardown

# --- REGRESSION: a change set larger than the 64 KiB pipe buffer -------------
#
# Every category test used to be spelled `echo "$CHANGED" | grep -qE ...`. Under
# `set -o pipefail` that is a VACUOUS-PASS shape of its own: `grep -q` exits at
# the FIRST match and closes the pipe, so once $CHANGED outgrows the 64 KiB pipe
# buffer the writer takes SIGPIPE, the pipeline's status is 141, and the `if`
# reads FALSE on a diff that MATCHED. The category goes unset and the gated CI
# job is skipped — green, having installed nothing and run nothing.
#
# It gets WORSE the bigger the change is, which inverts the risk: a repo-wide
# lockfile bump or codemod, the change most in need of the gated jobs, is
# exactly the one that outruns the buffer. And it needs the match near the FRONT
# of the list, which alphabetical `git diff --name-only` output makes ordinary.
#
# MEASURED, pre-fix, on this exact fixture (360,900 bytes, `flake.nix` first):
#   pipeline    rc=141   -> nix unset
#   here-string rc=0     -> nix=true
# ---------------------------------------------------------------------------
dc_setup
{
  printf 'flake.nix\n'
  awk 'BEGIN { for (i = 0; i < 12000; i++) printf "some/other/path/file-%d.txt\n", i }'
} > "$DC_CHANGED"
DC_BIG_BYTES=$(wc -c < "$DC_CHANGED")
[ "$DC_BIG_BYTES" -gt 65536 ] && _v=yes || _v=no
assert_eq "big-diff: the fixture really does exceed the 64 KiB pipe buffer" "yes" "$_v"
assert_eq "big-diff: nix=true when the match is the FIRST line of a 350 KB diff" \
  "true" "$(dc_run_prewritten nix)"
# Negative control on the same oversized input: a category that genuinely does
# not match must still read false, so the assertion above is not just "big input
# turns everything on".
assert_eq "big-diff: rules stays false on the same oversized diff" \
  "false" "$(dc_run_prewritten rules)"
assert_eq "big-diff: deadcode stays false on the same oversized diff" \
  "false" "$(dc_run_prewritten deadcode)"
# The go category builds its regex at runtime from list-go-modules.sh, so it
# takes the same treatment and needs its own oversized case.
{
  printf 'budget-etl/main.go\n'
  awk 'BEGIN { for (i = 0; i < 12000; i++) printf "some/other/path/file-%d.txt\n", i }'
} > "$DC_CHANGED"
assert_eq "big-diff: go=true when the match is the FIRST line of a 350 KB diff" \
  "true" "$(dc_run_prewritten go)"
dc_teardown

# --- the helper's failure must abort, never yield "no categories" ---
# Before, an unresolvable origin/main fell back to HEAD~1 and then to
# CHANGED="" with only a ::warning:: — a green run that installed no tools and
# skipped every gated job.
dc_setup
export DC_BASE_RC=4
printf '%s\n' 'flake.nix' > "$DC_CHANGED"
: > "$GITHUB_OUTPUT"
set +e
"$TEST_TMP/detect-changes.sh" >/dev/null 2>&1
_rc=$?
set -e
[ "$_rc" -ne 0 ] && _v=nonzero || _v=zero
assert_eq "detect-changes: a failed base resolution aborts" "nonzero" "$_v"
assert_eq "detect-changes: no categories emitted on abort" "" "$(cat "$GITHUB_OUTPUT")"
export DC_BASE_RC=0
dc_teardown

# <<< END MOVED <<<

# ---------------------------------------------------------------------------
# Real-repo cases: detect-changes.sh + the REAL resolve-diff-base.sh, against
# hermetic git repos. The stubbed cases above cannot see baseline resolution at
# all, and baseline resolution is where the defect lived.
#
# THE PUSH-TO-MAIN SHAPE. actions/checkout leaves refs/remotes/origin/main
# pointing AT the pushed commit, so HEAD == origin/main and the
# `origin/main...HEAD` range this script used to carry was empty. Every
# category read false, and the 29 `steps.changes.outputs.*` gates across this
# repo's workflows all skipped their jobs on every post-merge run.
# ---------------------------------------------------------------------------
DC_REAL_TMP=""
dc_real_cleanup() { [ -n "${DC_REAL_TMP:-}" ] && rm -rf "$DC_REAL_TMP"; return 0; }

# CHAIN onto the fixture's own EXIT trap (dispatch-test-fixture.sh:1468) rather
# than replacing it. `trap` installs, it does not append: a bare
# `trap dc_real_cleanup EXIT` here silently DISARMED
# `_dispatch_test_exit_trap`, which owns the fixture's $TMPDIR_TEST cleanup (two
# directories leaked per run) plus the host-systemd and routing-decision-log
# leak guards. Those guards exist precisely to catch an abort partway through a
# suite, and disarming them turns a leak into a green run — the same
# safety-check-silently-disabled shape this PR is about. Same idiom as
# `test-dispatch-verify-instrument-invocation.sh`'s own chained handler.
#
# $? is preserved across the chain by hand. The fixture's trap opens with
# `local rc=$?` and exits with it, so it must see the SUITE's status, not the
# cleanup's — `trap 'cleanup; _dispatch_test_exit_trap' EXIT` would hand it
# `rm`'s 0 and turn a failing suite green. `set +e` guards the `(exit "$rc")`
# that restores the status, which errexit would otherwise treat as a failing
# non-final command and act on.
# Signals get their OWN handlers, and the status is passed in explicitly.
# `trap fn EXIT INT TERM` installs one handler for all three, and at handler
# entry $? is the last COMPLETED command's status -- NOT 128+signo. So a suite
# killed by TERM (a cancelled Actions job, a step timeout) or INT (Ctrl-C) ran
# only part of its assertions and still exits 0: green. CI runs this suite
# unguarded, so that is a vacuous pass of exactly the shape this PR closes.
dc_real_exit_trap() {
  local rc=${1:-$?}
  dc_real_cleanup
  set +e
  (exit "$rc")
  _dispatch_test_exit_trap
}
trap dc_real_exit_trap EXIT
trap 'dc_real_exit_trap 130' INT
trap 'dc_real_exit_trap 143' TERM
DC_REAL_TMP=$(mktemp -d)

# ---------------------------------------------------------------------------
# REGRESSION: the EXIT trap above must CHAIN, must preserve $?, and the signal
# handlers must be their OWN registrations.
#
# `trap` installs a handler, it does not append one. A bare
# `trap dc_real_cleanup EXIT` here overwrote `_dispatch_test_exit_trap`
# (dispatch-test-fixture.sh:1468), which owns the fixture's $TMPDIR_TEST cleanup
# AND its two leak guards (host systemd state, routing-decision log). Measured
# consequence of the replacement: 2 stray directories per run in a fresh
# $TMPDIR, and a forged systemd leak exiting 0 instead of 1 — a safety check
# silently disabled, which is the same class of defect as the vacuous CI pass
# this PR exists to close.
#
# Asserted end-to-end in a CHILD process, not by inspecting the trap string: the
# child sources the real fixture and installs THIS FILE'S ACTUAL function bodies
# (via `declare -f`), so the test tracks the code rather than a copy of it.
#   clean run -> exit 0, nothing left in its own private $TMPDIR
#   forged host-systemd leak -> exit NON-ZERO, still nothing left behind
#   failing assertion + report_results -> exit NON-ZERO (the $?-preservation
#                                         half; the buggy idiom returns 0 here)
#   TERM mid-run -> exit 143 (the split-handler half; one shared
#                             `trap fn EXIT INT TERM` returns 0 here)
# The second case is the one the bare trap broke. The last is what the separate
# INT/TERM registrations above exist for: without it, reverting them to the
# combined `trap dc_real_exit_trap EXIT INT TERM` leaves this suite green.
# ---------------------------------------------------------------------------
echo "Regression: the EXIT trap chains onto the fixture's leak guards"
dc_trap_harness() {  # <path> <"clean"|"leak"|"fail"|"signal">
  {
    printf '%s\n' '#!/usr/bin/env bash'
    printf '%s\n' 'set -euo pipefail'
    printf 'source %q\n' "$SCRIPT_DIR/dispatch-test-fixture.sh"
    printf '%s\n' 'DC_REAL_TMP=""'
    declare -f dc_real_cleanup
    declare -f dc_real_exit_trap
    printf '%s\n' 'trap dc_real_exit_trap EXIT'
    printf '%s\n' "trap 'dc_real_exit_trap 130' INT"
    printf '%s\n' "trap 'dc_real_exit_trap 143' TERM"
    printf '%s\n' 'DC_REAL_TMP=$(mktemp -d)'
    if [ "$2" = "leak" ]; then
      # A recorded call to the real `systemctl` is exactly what
      # dispatch_host_systemd_guard_check trips on.
      printf '%s\n' 'printf "start some.service\n" >> "$DISPATCH_GUARD_SYSTEMCTL_LOG"'
    fi
    if [ "$2" = "fail" ]; then
      printf '%s\n' 'assert_eq "deliberate failure" "expected" "actual"'
      printf '%s\n' 'report_results'
    elif [ "$2" = "signal" ]; then
      # Kill the harness with TERM mid-run. bash runs the trap between
      # commands, so the `exit 0` below is never reached WHEN THE HANDLER
      # IS CORRECT -- and is exactly what a buggy handler falls through
      # to, which is what makes this case discriminating.
      printf '%s\n' 'kill -TERM $$'
      printf '%s\n' 'exit 0'
    else
      printf '%s\n' 'exit 0'
    fi
  } > "$1"
}

DC_TRAP_DIR=$(mktemp -d "$DC_REAL_TMP/traptest.XXXXXX")
for dc_trap_case in clean leak fail signal; do
  dc_trap_harness "$DC_TRAP_DIR/$dc_trap_case.sh" "$dc_trap_case"
  DC_TRAP_TMPDIR=$(mktemp -d "$DC_TRAP_DIR/tmp-$dc_trap_case.XXXXXX")
  set +e
  TMPDIR="$DC_TRAP_TMPDIR" bash "$DC_TRAP_DIR/$dc_trap_case.sh" >/dev/null 2>&1
  DC_TRAP_RC=$?
  set -e
  DC_TRAP_LEFT=$(find "$DC_TRAP_TMPDIR" -maxdepth 1 -mindepth 1 | wc -l)
  assert_eq "trap chain ($dc_trap_case): nothing leaks into a fresh TMPDIR" \
    "0" "$DC_TRAP_LEFT"
  if [ "$dc_trap_case" = "clean" ]; then
    assert_eq "trap chain (clean): a clean run still exits 0" "0" "$DC_TRAP_RC"
  elif [ "$dc_trap_case" = "signal" ]; then
    # The whole point of the separate INT/TERM registrations: with one shared
    # `trap dc_real_exit_trap EXIT INT TERM` this is 0, because at handler
    # entry $? is the last COMPLETED command's status and NOT 128+signo.
    # Asserted as 143 exactly, not merely non-zero -- "non-zero" would also
    # accept the harness dying for an unrelated reason.
    assert_eq "trap chain (signal): a TERM-killed suite exits 143, not 0" \
      "143" "$DC_TRAP_RC"
  else
    [ "$DC_TRAP_RC" -ne 0 ] && _v=nonzero || _v=zero
    assert_eq "trap chain ($dc_trap_case): status reaches the fixture trap" \
      "nonzero" "$_v"
  fi
done
rm -rf "$DC_TRAP_DIR"

# Build a repo whose tip commit adds flake.nix and firestore.rules, with
# origin/main pointing at that same commit. Sets DC_REPO.
DC_REPO=""
dc_make_main_push_repo() {
  DC_REPO=$(mktemp -d "$DC_REAL_TMP/repo.XXXXXX")
  git -C "$DC_REPO" init -q -b main
  git -C "$DC_REPO" config user.email "test@example.com"
  git -C "$DC_REPO" config user.name "Test User"
  printf 'baseline\n' > "$DC_REPO/README"
  git -C "$DC_REPO" add README
  git -C "$DC_REPO" commit -q -m "baseline"
  printf '{ }\n' > "$DC_REPO/flake.nix"
  printf 'service cloud.firestore { }\n' > "$DC_REPO/firestore.rules"
  git -C "$DC_REPO" add -A
  git -C "$DC_REPO" commit -q -m "the push"
  git -C "$DC_REPO" update-ref refs/remotes/origin/main "$(git -C "$DC_REPO" rev-parse HEAD)"
}

# Run the REAL detect-changes.sh with CWD inside $DC_REPO. Sets DC_RC, DC_ERR
# and writes categories to $DC_OUT_FILE.
DC_RC=0
DC_ERR=""
DC_OUT_FILE=""
dc_run_real() {
  local prev
  prev=$(pwd)
  DC_OUT_FILE=$(mktemp "$DC_REAL_TMP/gh_output.XXXXXX")
  cd "$DC_REPO"
  set +e
  DC_ERR=$(GITHUB_OUTPUT="$DC_OUT_FILE" "$SCRIPT_DIR/detect-changes.sh" 2>&1 >/dev/null)
  DC_RC=$?
  set -e
  cd "$prev"
}

echo "Real-repo: main-push shape emits categories"
dc_make_main_push_repo
# The reproduction, stated as an assertion: the expression this script used to
# carry sees nothing at all in exactly this state.
assert_eq "main-push: the old three-dot range was empty" "" \
  "$(git -C "$DC_REPO" diff --name-only 'refs/remotes/origin/main...HEAD')"  # diff-base-ok: the reproduction: asserts the old vacuous range sees nothing
dc_run_real
assert_eq "main-push: exit 0" "0" "$DC_RC"
assert_contains_local "main-push: emits nix=true" "nix=true" "$(cat "$DC_OUT_FILE")"
assert_contains_local "main-push: emits rules=true" "rules=true" "$(cat "$DC_OUT_FILE")"
assert_contains_local "main-push: provenance names source=first-parent" \
  "source=first-parent" "$DC_ERR"

echo "Real-repo: an unresolvable origin/main is a named failure"
dc_make_main_push_repo
git -C "$DC_REPO" update-ref -d refs/remotes/origin/main
dc_run_real
[ "$DC_RC" -ne 0 ] && _v=nonzero || _v=zero
assert_eq "no origin/main: exit non-zero" "nonzero" "$_v"
assert_contains_local "no origin/main: names the unresolvable ref" "origin/main" "$DC_ERR"
assert_eq "no origin/main: emitted no categories" "" "$(cat "$DC_OUT_FILE")"

report_results
