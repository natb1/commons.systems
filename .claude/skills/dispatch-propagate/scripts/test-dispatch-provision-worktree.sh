#!/usr/bin/env bash
# Tests for dispatch-provision-worktree -- moved verbatim from test-dispatch-scripts.sh
# (tactic-dispatch-test-monolith-split). Original section: 19571-19703.
set -euo pipefail

FIXTURE_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=dispatch-test-fixture.sh
source "$FIXTURE_DIR/dispatch-test-fixture.sh"

# >>> MOVED FROM test-dispatch-scripts.sh >>>
# ============================================================================
# dispatch-provision-worktree (#1047)
# ============================================================================
# dispatch-provision-worktree runs direnv allow/exec then execs into
# dispatch-merge-main. It resolves dispatch-merge-main via its OWN SCRIPT_DIR,
# so to intercept the merge we copy the script under test into a tmpdir next to
# a FAKE dispatch-merge-main (the "copy script alongside fakes" pattern used by
# mat_setup). A PATH-shim provides a fake `direnv` that logs its argv; the fake
# dispatch-merge-main logs its argv and exits with a controllable RC
# (PROV_MERGE_RC, default 0).
echo ""
echo "============================================================"
echo "dispatch-provision-worktree tests (#1047)"
echo "============================================================"

# Sets PROV_TMPDIR, PROV_SCRIPT, PROV_DIRENV_LOG, PROV_MERGE_LOG.
prov_setup() {
  PROV_TMPDIR=$(mktemp -d)
  PROV_DIRENV_LOG="$PROV_TMPDIR/direnv.log"
  PROV_MERGE_LOG="$PROV_TMPDIR/merge-main.log"

  # Copy the script under test alongside a fake dispatch-merge-main, so the
  # script's SCRIPT_DIR-relative exec hits the fake.
  cp "$SCRIPT_DIR/dispatch-provision-worktree" "$PROV_TMPDIR/dispatch-provision-worktree"
  cat > "$PROV_TMPDIR/dispatch-merge-main" <<FAKE
#!/usr/bin/env bash
echo "\$*" >> "$PROV_MERGE_LOG"
exit \${PROV_MERGE_RC:-0}
FAKE
  chmod +x "$PROV_TMPDIR/dispatch-provision-worktree" "$PROV_TMPDIR/dispatch-merge-main"

  # PATH-shim a fake direnv that logs its argv (in its own bin dir so only direnv
  # is shadowed).
  mkdir -p "$PROV_TMPDIR/bin"
  cat > "$PROV_TMPDIR/bin/direnv" <<FAKE
#!/usr/bin/env bash
echo "\$*" >> "$PROV_DIRENV_LOG"
if [[ "\$1" == "allow" ]]; then
  [[ "\${DIRENV_ALLOW_RC:-0}" -ne 0 ]] && echo "fake-direnv-allow-stderr" >&2
  exit "\${DIRENV_ALLOW_RC:-0}"
fi
if [[ "\$1" == "exec" ]]; then
  [[ "\${DIRENV_EXEC_RC:-0}" -ne 0 ]] && echo "fake-direnv-exec-stderr" >&2
  exit "\${DIRENV_EXEC_RC:-0}"
fi
exit 0
FAKE
  chmod +x "$PROV_TMPDIR/bin/direnv"

  PROV_SCRIPT="$PROV_TMPDIR/dispatch-provision-worktree"
  export PATH="$PROV_TMPDIR/bin:$SAVED_PATH"
}

prov_teardown() {
  export PATH="$SAVED_PATH"
  rm -rf "$PROV_TMPDIR"
  unset PROV_TMPDIR PROV_SCRIPT PROV_DIRENV_LOG PROV_MERGE_LOG PROV_MERGE_RC DIRENV_ALLOW_RC DIRENV_EXEC_RC
}

# direnv argv capture + worktree forwarded to dispatch-merge-main (happy run).
echo "Test: provision invokes direnv allow/exec then forwards to merge-main"
prov_setup
WT="/home/n8/natb1/commons.systems/worktrees/77-example"
out=$("$PROV_SCRIPT" "$WT" 2>&1) && rc=0 || rc=$?
assert_eq "happy run → exit 0" "0" "$rc"
direnv_lines=$(cat "$PROV_DIRENV_LOG")
assert_eq "direnv allow <wt> captured" "allow $WT" "$(sed -n '1p' "$PROV_DIRENV_LOG")"
assert_eq "direnv exec <wt> true captured" "exec $WT true" "$(sed -n '2p' "$PROV_DIRENV_LOG")"
assert_eq "worktree forwarded to merge-main" "$WT" "$(cat "$PROV_MERGE_LOG")"
prov_teardown

# Exit-code passthrough from the fake dispatch-merge-main.
echo "Test: merge RC 0 → provision exits 0"
prov_setup
PROV_MERGE_RC=0 "$PROV_SCRIPT" "/wt/a" >/dev/null 2>&1 && rc=0 || rc=$?
assert_eq "merge RC 0 → exit 0" "0" "$rc"
prov_teardown

echo "Test: merge RC 3 (conflict) → provision exits 3"
prov_setup
PROV_MERGE_RC=3 "$PROV_SCRIPT" "/wt/a" >/dev/null 2>&1 && rc=0 || rc=$?
assert_eq "merge RC 3 → exit 3" "3" "$rc"
prov_teardown

echo "Test: merge RC 1 (fetch/other) → provision exits 1"
prov_setup
PROV_MERGE_RC=1 "$PROV_SCRIPT" "/wt/a" >/dev/null 2>&1 && rc=0 || rc=$?
assert_eq "merge RC 1 → exit 1" "1" "$rc"
prov_teardown

# Usage errors — exit 2 (the script's own guards, before any exec).
echo "Test: no arg → exit 2"
prov_setup
"$PROV_SCRIPT" >/dev/null 2>&1 && rc=0 || rc=$?
assert_eq "no arg → exit 2" "2" "$rc"
prov_teardown

echo "Test: flag-shaped arg → exit 2"
prov_setup
"$PROV_SCRIPT" "-x" >/dev/null 2>&1 && rc=0 || rc=$?
assert_eq "flag-shaped arg → exit 2" "2" "$rc"
prov_teardown

echo "Test: extra arg → exit 2"
prov_setup
"$PROV_SCRIPT" "/wt/a" extra >/dev/null 2>&1 && rc=0 || rc=$?
assert_eq "extra arg → exit 2" "2" "$rc"
prov_teardown

# direnv warm-up failures surface and abort before merge (#855). A non-zero
# `direnv exec`/`direnv allow` must make the script exit 1 with a diagnostic
# naming the worktree, and must NOT proceed to exec dispatch-merge-main.
echo "Test: direnv exec failure → exit 1, abort before merge"
prov_setup
WT="/home/n8/natb1/commons.systems/worktrees/77-example"
out=$(DIRENV_EXEC_RC=1 "$PROV_SCRIPT" "$WT" 2>&1) && rc=0 || rc=$?
assert_eq "direnv exec failure → exit 1" "1" "$rc"
assert_eq "diagnostic names the worktree" "1" "$([[ "$out" == *"$WT"* ]] && echo 1 || echo 0)"
assert_eq "diagnostic includes direnv stderr" "1" "$([[ "$out" == *"fake-direnv-exec-stderr"* ]] && echo 1 || echo 0)"
assert_eq "merge-main not reached on exec failure" "0" "$([[ -s "$PROV_MERGE_LOG" ]] && echo 1 || echo 0)"
prov_teardown

echo "Test: direnv allow failure → exit 1, abort before exec and before merge"
prov_setup
WT="/home/n8/natb1/commons.systems/worktrees/77-example"
out=$(DIRENV_ALLOW_RC=1 "$PROV_SCRIPT" "$WT" 2>&1) && rc=0 || rc=$?
assert_eq "direnv allow failure → exit 1" "1" "$rc"
assert_eq "diagnostic names the worktree" "1" "$([[ "$out" == *"$WT"* ]] && echo 1 || echo 0)"
assert_eq "diagnostic includes direnv stderr" "1" "$([[ "$out" == *"fake-direnv-allow-stderr"* ]] && echo 1 || echo 0)"
assert_eq "direnv log holds only the allow line" "allow $WT" "$(cat "$PROV_DIRENV_LOG")"
assert_eq "merge-main not reached on allow failure" "0" "$([[ -s "$PROV_MERGE_LOG" ]] && echo 1 || echo 0)"
prov_teardown

# <<< END MOVED <<<

report_results
