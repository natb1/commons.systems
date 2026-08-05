#!/usr/bin/env bash
# Tests for dispatch-drift-scan -- moved verbatim from test-dispatch-scripts.sh
# (tactic-dispatch-test-monolith-split). Original section: 23165-23428.
set -euo pipefail

FIXTURE_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=dispatch-test-fixture.sh
source "$FIXTURE_DIR/dispatch-test-fixture.sh"

# >>> MOVED FROM test-dispatch-scripts.sh >>>
# dispatch-drift-scan tests
# ============================================================================
#
# Each test gets a fresh tmp tree:
#   $TMPDIR_TEST/scripts/   copy of dispatch-drift-scan
#   $TMPDIR_TEST/bin/       gh + git stubs (prepended to PATH)
#   $TMPDIR_TEST/tree/      the fixture working tree the script greps / stats
#
# The stubs key on "$*" and read fixtures from TREE = dirname/.. = $TMPDIR_TEST,
# which is a separate dir from the fixture working tree ($TMPDIR_TEST/tree) the
# test cds into. So stub fixtures (issue.json, prs.json, commits.txt) live at
# $TMPDIR_TEST/*, while the real files the script existence-checks/greps live at
# $TMPDIR_TEST/tree/*.


drift_scan_setup() {
  TMPDIR_TEST=$(mktemp -d)
  mkdir -p "$TMPDIR_TEST/scripts" "$TMPDIR_TEST/bin" "$TMPDIR_TEST/tree"

  cp "$SCRIPT_DIR/dispatch-drift-scan" "$TMPDIR_TEST/scripts/dispatch-drift-scan"
  chmod +x "$TMPDIR_TEST/scripts/dispatch-drift-scan"
  # dispatch-drift-scan now sources lib.sh (for gh_retry); $SCRIPT_DIR inside the
  # copied script resolves to this temp scripts/ dir, so lib.sh must live there.
  cp "$SCRIPT_DIR/lib.sh" "$TMPDIR_TEST/scripts/lib.sh"

  cat > "$TMPDIR_TEST/bin/gh" <<'STUB'
#!/usr/bin/env bash
args="$*"
TREE="$(cd "$(dirname "$0")/.." && pwd)"
case "$args" in
  api\ repos/*/issues/[0-9]*)
    # gh_issue_view_rest single-issue GET: gh api repos/.../issues/<N>.
    # Serves issue.json in raw REST shape (created_at, not createdAt).
    if [[ -f "$TREE/issue.json" ]]; then
      cat "$TREE/issue.json"
    else
      echo '{"number":1080,"title":"","body":"no refs","state":"open","state_reason":null,"created_at":"2026-01-01T00:00:00Z","labels":[],"assignees":[]}'
    fi
    ;;
  api\ *repos/*/pulls\?state=closed*)
    # dispatch-drift-scan's merged-PR window now hits an inline REST call (#2258):
    # `gh api --paginate repos/{owner}/{repo}/pulls?state=closed&sort=updated&...`.
    # The leading `*` absorbs the optional `--paginate`. Serve the SAME fixture
    # data the old `gh pr list --state merged` arm served, but in REST snake_case
    # (number,title,merged_at,created_at,updated_at) — the script filters and
    # remaps to mergedAt locally.
    if [[ -f "$TREE/prs.json" ]]; then
      cat "$TREE/prs.json"
    else
      echo '[]'
    fi
    ;;
  *)
    echo "gh stub: unknown invocation: $args" >&2
    exit 1
    ;;
esac
STUB
  chmod +x "$TMPDIR_TEST/bin/gh"

  cat > "$TMPDIR_TEST/bin/git" <<'STUB'
#!/usr/bin/env bash
args="$*"
TREE="$(cd "$(dirname "$0")/.." && pwd)"
case "$args" in
  log\ --since=*)
    if [[ -f "$TREE/commits.txt" ]]; then
      cat "$TREE/commits.txt"
    fi
    ;;
  *)
    exit 0
    ;;
esac
STUB
  chmod +x "$TMPDIR_TEST/bin/git"

  SAVED_PATH_DRIFT="$PATH"
  export PATH="$TMPDIR_TEST/bin:$PATH"
}

drift_scan_teardown() {
  cd "$SCRIPT_DIR"
  rm -rf "$TMPDIR_TEST"
  TMPDIR_TEST=""
  export PATH="$SAVED_PATH_DRIFT"
}

# --- Test: evidence output ---

echo "Test: dispatch-drift-scan emits the four evidence inputs"
drift_scan_setup
# Fixture working tree: a present path and a present name ref.
printf 'echo hi\n' > "$TMPDIR_TEST/tree/present.sh"
printf 'presentName_token here\n' > "$TMPDIR_TEST/tree/lib.txt"
cat > "$TMPDIR_TEST/issue.json" <<'EOF'
{"number":1080,"title":"","body":"Touches `present.sh` and `does/not/exist.ts`. Uses `presentName_token` and `absentName_token`.","state":"open","state_reason":null,"created_at":"2026-06-03T00:00:00Z","labels":[],"assignees":[]}
EOF
cat > "$TMPDIR_TEST/prs.json" <<'EOF'
[{"number":42,"title":"some pr","created_at":"2026-05-20T00:00:00Z","merged_at":"2026-06-04T00:00:00Z","updated_at":"2026-06-04T00:00:00Z"}]
EOF
cat > "$TMPDIR_TEST/commits.txt" <<'EOF'
abc1234 reworked present.sh distinctively_committed
def5678 unrelated touch
EOF
cd "$TMPDIR_TEST/tree"
out=$("$TMPDIR_TEST/scripts/dispatch-drift-scan" 1080); rc=$?
assert_eq "dispatch-drift-scan: evidence output exits 0" "0" "$rc"
assert_contains_local "dispatch-drift-scan: prints createdAt anchor" "2026-06-03T00:00:00Z" "$out"
assert_contains_local "dispatch-drift-scan: absent path flagged [ABSENT]" "does/not/exist.ts [ABSENT]" "$out"
assert_not_contains_local "dispatch-drift-scan: present path not flagged [ABSENT]" "present.sh [ABSENT]" "$out"
assert_contains_local "dispatch-drift-scan: present path line renders" "  present.sh" "$out"
assert_contains_local "dispatch-drift-scan: absent name flagged [NOT FOUND]" "absentName_token [NOT FOUND]" "$out"
assert_not_contains_local "dispatch-drift-scan: present name not flagged [NOT FOUND]" "presentName_token [NOT FOUND]" "$out"
assert_contains_local "dispatch-drift-scan: a commit line renders" "distinctively_committed" "$out"
assert_contains_local "dispatch-drift-scan: merged PR enumerated" "#42" "$out"
drift_scan_teardown

# --- Test: too-wide-window guard ---

echo "Test: dispatch-drift-scan trips the too-wide-window guard at the 100-PR limit"
drift_scan_setup
printf 'echo hi\n' > "$TMPDIR_TEST/tree/present.sh"
cat > "$TMPDIR_TEST/issue.json" <<'EOF'
{"number":1080,"title":"","body":"Touches `present.sh`.","state":"open","state_reason":null,"created_at":"2026-06-03T00:00:00Z","labels":[],"assignees":[]}
EOF
# REST snake_case fixtures, all merged IN-WINDOW (merged_at >= the 2026-06-03
# anchor) so the local merged_at filter keeps all 100 and the >=100 in-window
# guard fires. updated_at >= merged_at as REST guarantees.
jq -nc '[range(100) | {number: (.+1), title: ("pr " + (.+1|tostring)), created_at: "2026-05-25T00:00:00Z", merged_at: "2026-06-04T00:00:00Z", updated_at: "2026-06-04T00:00:00Z"}]' \
  > "$TMPDIR_TEST/prs.json"
cd "$TMPDIR_TEST/tree"
out=$("$TMPDIR_TEST/scripts/dispatch-drift-scan" 1080); rc=$?
assert_eq "dispatch-drift-scan: too-wide window still exits 0" "0" "$rc"
assert_contains_local "dispatch-drift-scan: emits WINDOW-TOO-WIDE marker" "WINDOW-TOO-WIDE" "$out"
assert_contains_local "dispatch-drift-scan: recommends re-run" "Re-run" "$out"
assert_contains_local "dispatch-drift-scan: recommends /file-issue" "/file-issue" "$out"
assert_contains_local "dispatch-drift-scan: anchor still prints under guard" "2026-06-03T00:00:00Z" "$out"
assert_not_contains_local "dispatch-drift-scan: partial PR list suppressed" "pr 50" "$out"
drift_scan_teardown

# --- Test: missing / invalid argument ---

echo "Test: dispatch-drift-scan rejects a missing or non-digit argument"
drift_scan_setup
out=$("$TMPDIR_TEST/scripts/dispatch-drift-scan" 2>/dev/null) && rc=0 || rc=$?
assert_eq "dispatch-drift-scan: missing arg exits 2" "2" "$rc"
err=$("$TMPDIR_TEST/scripts/dispatch-drift-scan" 2>&1 1>/dev/null) || true
assert_contains_local "dispatch-drift-scan: missing arg stderr mentions usage" "usage" "$err"
out=$("$TMPDIR_TEST/scripts/dispatch-drift-scan" abc 2>/dev/null) && rc=0 || rc=$?
assert_eq "dispatch-drift-scan: non-digit arg exits 2" "2" "$rc"
drift_scan_teardown

# --- Test: no path references → commit scan skipped ---

echo "Test: dispatch-drift-scan skips the commit scan when no path refs are named"
drift_scan_setup
cat > "$TMPDIR_TEST/issue.json" <<'EOF'
{"number":1080,"title":"","body":"Uses `somename_ref` only.","state":"open","state_reason":null,"created_at":"2026-06-03T00:00:00Z","labels":[],"assignees":[]}
EOF
cd "$TMPDIR_TEST/tree"
out=$("$TMPDIR_TEST/scripts/dispatch-drift-scan" 1080); rc=$?
assert_eq "dispatch-drift-scan: no-path-refs exits 0" "0" "$rc"
assert_contains_local "dispatch-drift-scan: notes commit scan skipped" "commit scan skipped" "$out"
drift_scan_teardown

# --- Regression: present name ref found even when grep_out is large ---
# Guards defect 1: under `set -o pipefail` the old `printf … | grep -qF` test
# SIGPIPEs printf when grep -q short-circuits on the first match, flagging every
# present name [NOT FOUND] once grep_out is large. The here-string fix avoids the
# upstream process entirely. The bug only manifests at scale, so build a large
# fixture file containing many lines with the present name token.

echo "Test: dispatch-drift-scan finds a present name ref under a large grep_out (pipefail regression)"
drift_scan_setup
printf 'echo hi\n' > "$TMPDIR_TEST/tree/present.sh"
# Build a large fixture without a `yes | head` pipeline: under this suite's
# `set -o pipefail`, head closing the pipe SIGPIPEs yes (exit 141) and would
# abort the suite. awk writes all 20000 lines itself, no broken pipe.
awk 'BEGIN { for (i = 0; i < 20000; i++) print "scalename_tok appears here" }' \
  > "$TMPDIR_TEST/tree/big.txt"
cat > "$TMPDIR_TEST/issue.json" <<'EOF'
{"number":1080,"title":"","body":"Uses `scalename_tok` across `present.sh`.","state":"open","state_reason":null,"created_at":"2026-06-03T00:00:00Z","labels":[],"assignees":[]}
EOF
cat > "$TMPDIR_TEST/prs.json" <<'EOF'
[]
EOF
cat > "$TMPDIR_TEST/commits.txt" <<'EOF'
abc1234 some commit
EOF
cd "$TMPDIR_TEST/tree"
out=$("$TMPDIR_TEST/scripts/dispatch-drift-scan" 1080); rc=$?
assert_eq "dispatch-drift-scan: large-grep_out scan exits 0" "0" "$rc"
assert_not_contains_local "dispatch-drift-scan: present name ref found even when grep_out is large (pipefail regression)" "scalename_tok [NOT FOUND]" "$out"
drift_scan_teardown

# --- Regression: slash-commands are not classified as path refs ---
# Guards defect 2: tokens like /file-issue and /qa-fix contain `/`, so the
# old is_path_token treated them as filesystem paths and existence-checked them,
# flagging [ABSENT]. They are skill references and must fall through to name refs.

echo "Test: dispatch-drift-scan does not classify slash-commands as path refs"
drift_scan_setup
printf 'echo hi\n' > "$TMPDIR_TEST/tree/present.sh"
cat > "$TMPDIR_TEST/issue.json" <<'EOF'
{"number":1080,"title":"","body":"Run `/qa-fix` and `/file-issue` then `present.sh`.","state":"open","state_reason":null,"created_at":"2026-06-03T00:00:00Z","labels":[],"assignees":[]}
EOF
cat > "$TMPDIR_TEST/prs.json" <<'EOF'
[]
EOF
: > "$TMPDIR_TEST/commits.txt"
cd "$TMPDIR_TEST/tree"
out=$("$TMPDIR_TEST/scripts/dispatch-drift-scan" 1080); rc=$?
assert_eq "dispatch-drift-scan: slash-command scan exits 0" "0" "$rc"
assert_not_contains_local "dispatch-drift-scan: /file-issue not existence-checked as a path" "/file-issue [ABSENT]" "$out"
assert_not_contains_local "dispatch-drift-scan: /qa-fix not existence-checked as a path" "/qa-fix [ABSENT]" "$out"
drift_scan_teardown

# --- Security regression: backtick-span globs are not expanded against the cwd ---
# Guards the unquoted-`for tok in $span` glob-injection defect: the issue body is
# attacker-influenceable (public repo). A span of a bare `*` must NOT expand to
# the working-tree filenames; the fix tokenizes with `read -ra` (no globbing), so
# `*` is dropped (it is neither a path token nor a >=3-char name ref) and the
# uniquely-named fixture file never surfaces in the output.

echo "Test: dispatch-drift-scan does not glob-expand backtick spans against the cwd"
drift_scan_setup
printf 'echo hi\n' > "$TMPDIR_TEST/tree/globbed_unique_xyz.sh"
cat > "$TMPDIR_TEST/issue.json" <<'EOF'
{"number":1080,"title":"","body":"Touches `*` widely.","state":"open","state_reason":null,"created_at":"2026-06-03T00:00:00Z","labels":[],"assignees":[]}
EOF
cat > "$TMPDIR_TEST/prs.json" <<'EOF'
[]
EOF
: > "$TMPDIR_TEST/commits.txt"
cd "$TMPDIR_TEST/tree"
out=$("$TMPDIR_TEST/scripts/dispatch-drift-scan" 1080); rc=$?
assert_eq "dispatch-drift-scan: glob-span scan exits 0" "0" "$rc"
assert_not_contains_local "dispatch-drift-scan: bare-* span not glob-expanded against cwd" "globbed_unique_xyz" "$out"
drift_scan_teardown

# --- Security regression: path-traversal tokens are rejected, not probed ---
# Guards the path-traversal defect: a backtick span citing `../../../etc/passwd`
# must not be existence-checked (which would let a crafted issue body probe paths
# outside the worktree). The fix drops any token containing `..`, so the
# traversal reference never appears in the output at all.

echo "Test: dispatch-drift-scan rejects path-traversal reference tokens"
drift_scan_setup
printf 'echo hi\n' > "$TMPDIR_TEST/tree/present.sh"
cat > "$TMPDIR_TEST/issue.json" <<'EOF'
{"number":1080,"title":"","body":"Touches `present.sh` and `../../../etc/passwd`.","state":"open","state_reason":null,"created_at":"2026-06-03T00:00:00Z","labels":[],"assignees":[]}
EOF
cat > "$TMPDIR_TEST/prs.json" <<'EOF'
[]
EOF
: > "$TMPDIR_TEST/commits.txt"
cd "$TMPDIR_TEST/tree"
out=$("$TMPDIR_TEST/scripts/dispatch-drift-scan" 1080); rc=$?
assert_eq "dispatch-drift-scan: traversal scan exits 0" "0" "$rc"
assert_not_contains_local "dispatch-drift-scan: traversal token not existence-probed" "etc/passwd" "$out"
assert_contains_local "dispatch-drift-scan: a legitimate sibling path still renders" "  present.sh" "$out"
drift_scan_teardown

# <<< END MOVED <<<

report_results
