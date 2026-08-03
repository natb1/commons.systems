#!/usr/bin/env bash
# Tests for dispatch-find-owning-pr -- moved verbatim from test-dispatch-scripts.sh
# (tactic-dispatch-test-monolith-split). Original section: 29345-29581.
set -euo pipefail

FIXTURE_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=dispatch-test-fixture.sh
source "$FIXTURE_DIR/dispatch-test-fixture.sh"

# >>> MOVED FROM test-dispatch-scripts.sh >>>
# ============================================================================
# dispatch-find-owning-pr
# ============================================================================
# Reuses assert_contains_local / assert_not_contains_local (defined in the
# drift-scan section above). The gh stub keys on `args="$*"` and reads fixtures
# from $TMPDIR_TEST (TREE = bin/.. = TMPDIR_TEST), mirroring the drift-scan stub
# shape. Fixtures live in tmp ($TMPDIR_TEST), so heredoc redirection is fine.

find_owning_pr_setup() {
  TMPDIR_TEST=$(mktemp -d)
  mkdir -p "$TMPDIR_TEST/scripts" "$TMPDIR_TEST/bin"

  cp "$SCRIPT_DIR/dispatch-find-owning-pr" "$TMPDIR_TEST/scripts/dispatch-find-owning-pr"
  chmod +x "$TMPDIR_TEST/scripts/dispatch-find-owning-pr"
  # The copied script sources lib.sh via its own SCRIPT_DIR (= temp scripts/),
  # so lib.sh must sit alongside it.
  cp "$SCRIPT_DIR/lib.sh" "$TMPDIR_TEST/scripts/lib.sh"

  cat > "$TMPDIR_TEST/bin/gh" <<'STUB'
#!/usr/bin/env bash
args="$*"
TREE="$(cd "$(dirname "$0")/.." && pwd)"
case "$args" in
  pr\ list\ --state\ open*)
    # pr_list_open: gh pr list --state open --limit <N> --json number,headRefName.
    # If a failure fixture is present, emulate a non-truncation gh failure
    # (auth/network) by writing its text to stderr and exiting non-zero.
    if [ -f "$TREE/pr_list_fail.txt" ]; then
      cat "$TREE/pr_list_fail.txt" >&2
      exit 1
    fi
    cat "$TREE/prs.json"
    ;;
  api\ repos/*contents/*)
    # ownership probe: gh api repos/{owner}/{repo}/contents/<path>?ref=<branch>
    # 200 (exit 0) iff owners.txt names the requested branch, else 404 (exit 1).
    ref="${args##*ref=}"
    if grep -qx "$ref" "$TREE/owners.txt" 2>/dev/null; then exit 0; else exit 1; fi
    ;;
  pr\ view\ *closingIssuesReferences*)
    cat "$TREE/closing.json"
    ;;
  api\ *dependencies/blocked_by*)
    # Real call uses --jq '.[].number'; stub emits the already-reduced numbers.
    cat "$TREE/blocked_by.txt" 2>/dev/null || true
    ;;
  api\ *dependencies/blocking*)
    cat "$TREE/blocking.txt" 2>/dev/null || true
    ;;
  *)
    echo "gh stub: unknown invocation: $args" >&2
    exit 1
    ;;
esac
STUB
  chmod +x "$TMPDIR_TEST/bin/gh"

  SAVED_PATH_FOP="$PATH"
  export PATH="$TMPDIR_TEST/bin:$PATH"
}

find_owning_pr_teardown() {
  cd "$SCRIPT_DIR"
  rm -rf "$TMPDIR_TEST"
  TMPDIR_TEST=""
  export PATH="$SAVED_PATH_FOP"
}

# --- Test: clear defer ---

echo "Test: dispatch-find-owning-pr defers behind the lone owning PR's closing issue"
find_owning_pr_setup
cat > "$TMPDIR_TEST/prs.json" <<'EOF'
[{"number":7,"headRefName":"feat-x"}]
EOF
cat > "$TMPDIR_TEST/owners.txt" <<'EOF'
feat-x
EOF
cat > "$TMPDIR_TEST/closing.json" <<'EOF'
{"closingIssuesReferences":[{"number":42}]}
EOF
out=$("$TMPDIR_TEST/scripts/dispatch-find-owning-pr" 100 "some/file.ts"); rc=$?
assert_eq "dispatch-find-owning-pr: clean defer exits 0" "0" "$rc"
assert_contains_local "dispatch-find-owning-pr: emits defer:42:7" "defer:42:7" "$out"
find_owning_pr_teardown

# --- Test: multiple owning PRs ---

echo "Test: dispatch-find-owning-pr flags multiple owning PRs"
find_owning_pr_setup
cat > "$TMPDIR_TEST/prs.json" <<'EOF'
[{"number":7,"headRefName":"feat-x"},{"number":8,"headRefName":"feat-y"}]
EOF
cat > "$TMPDIR_TEST/owners.txt" <<'EOF'
feat-x
feat-y
EOF
out=$("$TMPDIR_TEST/scripts/dispatch-find-owning-pr" 100 "some/file.ts"); rc=$?
assert_eq "dispatch-find-owning-pr: multiple owners exits 0" "0" "$rc"
assert_contains_local "dispatch-find-owning-pr: emits not-clear:multiple-owning-prs" "not-clear:multiple-owning-prs" "$out"
find_owning_pr_teardown

# --- Test: owning PR closes 0 issues ---

echo "Test: dispatch-find-owning-pr flags an owning PR that closes 0 issues"
find_owning_pr_setup
cat > "$TMPDIR_TEST/prs.json" <<'EOF'
[{"number":7,"headRefName":"feat-x"}]
EOF
cat > "$TMPDIR_TEST/owners.txt" <<'EOF'
feat-x
EOF
cat > "$TMPDIR_TEST/closing.json" <<'EOF'
{"closingIssuesReferences":[]}
EOF
out=$("$TMPDIR_TEST/scripts/dispatch-find-owning-pr" 100 "some/file.ts"); rc=$?
assert_eq "dispatch-find-owning-pr: closes-0 exits 0" "0" "$rc"
assert_contains_local "dispatch-find-owning-pr: emits not-clear:owning-pr-closes-0-issues" "not-clear:owning-pr-closes-0-issues" "$out"
find_owning_pr_teardown

# --- Test: owning PR closes 2 issues ---

echo "Test: dispatch-find-owning-pr flags an owning PR that closes 2 issues"
find_owning_pr_setup
cat > "$TMPDIR_TEST/prs.json" <<'EOF'
[{"number":7,"headRefName":"feat-x"}]
EOF
cat > "$TMPDIR_TEST/owners.txt" <<'EOF'
feat-x
EOF
cat > "$TMPDIR_TEST/closing.json" <<'EOF'
{"closingIssuesReferences":[{"number":42},{"number":43}]}
EOF
out=$("$TMPDIR_TEST/scripts/dispatch-find-owning-pr" 100 "some/file.ts"); rc=$?
assert_eq "dispatch-find-owning-pr: closes-2 exits 0" "0" "$rc"
assert_contains_local "dispatch-find-owning-pr: emits not-clear:owning-pr-closes-2-issues" "not-clear:owning-pr-closes-2-issues" "$out"
find_owning_pr_teardown

# --- Test: already blocked ---

echo "Test: dispatch-find-owning-pr flags an already-blocked target"
find_owning_pr_setup
cat > "$TMPDIR_TEST/prs.json" <<'EOF'
[{"number":7,"headRefName":"feat-x"}]
EOF
cat > "$TMPDIR_TEST/owners.txt" <<'EOF'
feat-x
EOF
cat > "$TMPDIR_TEST/closing.json" <<'EOF'
{"closingIssuesReferences":[{"number":42}]}
EOF
cat > "$TMPDIR_TEST/blocked_by.txt" <<'EOF'
42
EOF
out=$("$TMPDIR_TEST/scripts/dispatch-find-owning-pr" 100 "some/file.ts"); rc=$?
assert_eq "dispatch-find-owning-pr: already-blocked exits 0" "0" "$rc"
assert_contains_local "dispatch-find-owning-pr: emits not-clear:already-blocked" "not-clear:already-blocked" "$out"
find_owning_pr_teardown

# --- Test: would cycle ---

echo "Test: dispatch-find-owning-pr flags a direct cycle"
find_owning_pr_setup
cat > "$TMPDIR_TEST/prs.json" <<'EOF'
[{"number":7,"headRefName":"feat-x"}]
EOF
cat > "$TMPDIR_TEST/owners.txt" <<'EOF'
feat-x
EOF
cat > "$TMPDIR_TEST/closing.json" <<'EOF'
{"closingIssuesReferences":[{"number":42}]}
EOF
cat > "$TMPDIR_TEST/blocking.txt" <<'EOF'
42
EOF
out=$("$TMPDIR_TEST/scripts/dispatch-find-owning-pr" 100 "some/file.ts"); rc=$?
assert_eq "dispatch-find-owning-pr: would-cycle exits 0" "0" "$rc"
assert_contains_local "dispatch-find-owning-pr: emits not-clear:would-cycle" "not-clear:would-cycle" "$out"
find_owning_pr_teardown

# --- Test: proceed (no owner) ---

echo "Test: dispatch-find-owning-pr proceeds when no open PR owns the path"
find_owning_pr_setup
cat > "$TMPDIR_TEST/prs.json" <<'EOF'
[{"number":7,"headRefName":"feat-x"},{"number":8,"headRefName":"feat-y"}]
EOF
: > "$TMPDIR_TEST/owners.txt"
out=$("$TMPDIR_TEST/scripts/dispatch-find-owning-pr" 100 "some/file.ts"); rc=$?
assert_eq "dispatch-find-owning-pr: proceed exits 0" "0" "$rc"
assert_contains_local "dispatch-find-owning-pr: emits proceed" "proceed" "$out"
assert_not_contains_local "dispatch-find-owning-pr: proceed is not a defer" "defer:" "$out"
find_owning_pr_teardown

# --- Test: truncated PR list ---

echo "Test: dispatch-find-owning-pr reports a truncated PR snapshot"
find_owning_pr_setup
# Limit 2 + a 2-element list trips pr_list_open's length==limit guard.
export DISPATCH_PR_LIST_LIMIT=2
cat > "$TMPDIR_TEST/prs.json" <<'EOF'
[{"number":7,"headRefName":"feat-x"},{"number":8,"headRefName":"feat-y"}]
EOF
: > "$TMPDIR_TEST/owners.txt"
out=$("$TMPDIR_TEST/scripts/dispatch-find-owning-pr" 100 "some/file.ts"); rc=$?
unset DISPATCH_PR_LIST_LIMIT
assert_eq "dispatch-find-owning-pr: truncated exits 0" "0" "$rc"
assert_contains_local "dispatch-find-owning-pr: emits not-clear:pr-list-truncated" "not-clear:pr-list-truncated" "$out"
find_owning_pr_teardown

# --- Test: pr_list_open non-truncation failure (auth/network) ---

echo "Test: dispatch-find-owning-pr propagates a non-truncation pr_list_open failure and exits 1"
find_owning_pr_setup
# gh pr list fails for a non-truncation reason; the script must exit 1 and pass
# the error text through to stderr (dispatch-find-owning-pr:74-76).
cat > "$TMPDIR_TEST/pr_list_fail.txt" <<'EOF'
gh: authentication required (HTTP 401)
EOF
out=$("$TMPDIR_TEST/scripts/dispatch-find-owning-pr" 100 "some/file.ts" 2>"$TMPDIR_TEST/fop_err") && rc=0 || rc=$?
err=$(cat "$TMPDIR_TEST/fop_err")
assert_eq "dispatch-find-owning-pr: pr_list_open failure exits 1" "1" "$rc"
assert_contains_local "dispatch-find-owning-pr: propagates pr_list_open error to stderr" "authentication required" "$err"
find_owning_pr_teardown

# --- Test: usage errors (exit 2) ---

echo "Test: dispatch-find-owning-pr usage errors exit 2"
find_owning_pr_setup
out=$("$TMPDIR_TEST/scripts/dispatch-find-owning-pr" 2>/dev/null) && rc=0 || rc=$?
assert_eq "dispatch-find-owning-pr: missing args exits 2" "2" "$rc"
out=$("$TMPDIR_TEST/scripts/dispatch-find-owning-pr" 100 2>/dev/null) && rc=0 || rc=$?
assert_eq "dispatch-find-owning-pr: missing path exits 2" "2" "$rc"
out=$("$TMPDIR_TEST/scripts/dispatch-find-owning-pr" notadigit "some/file.ts" 2>/dev/null) && rc=0 || rc=$?
assert_eq "dispatch-find-owning-pr: non-digit N exits 2" "2" "$rc"
find_owning_pr_teardown

# <<< END MOVED <<<

report_results
