#!/usr/bin/env bash
# Tests for lib-worktree-records -- moved verbatim from test-dispatch-scripts.sh
# (tactic-dispatch-test-monolith-split). Original section: 5204-5358.
set -euo pipefail

FIXTURE_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=dispatch-test-fixture.sh
source "$FIXTURE_DIR/dispatch-test-fixture.sh"

# >>> MOVED FROM test-dispatch-scripts.sh >>>
# ============================================================================
# list_worktree_records (lib.sh) tests
# ============================================================================
echo ""
echo "=== list_worktree_records ==="

# list_worktree_records emits one tab-separated <issue-number>\t<path>\t<branch>
# line per registered worktree. Each test sources the lib.sh copy and runs the
# function in a subshell; the git stub serves the porcelain fixture written to
# worktree-list.txt.

# 1. Normal worktrees with issue-prefixed branches → issue-number populated.
echo "Test: issue-prefixed branches → number populated"
setup
printf 'worktree /worktrees/42-my-feature\nHEAD def456\nbranch refs/heads/42-my-feature\n\nworktree /worktrees/100-another\nHEAD ghi789\nbranch refs/heads/100-another\n\n' \
  > "$STUB_DIR/worktree-list.txt"
result=$( source "$TMPDIR_TEST/lib.sh"; list_worktree_records )
expected=$(printf '42\t/worktrees/42-my-feature\t42-my-feature\n100\t/worktrees/100-another\t100-another')
assert_eq "issue-prefixed branches → records with number" "$expected" "$result"
teardown

# 2. A worktree with no branch line (detached HEAD) → empty number and branch.
#    This is the case cleanup_stale_worktree_processes depends on.
echo "Test: no branch line → empty number and branch"
setup
printf 'worktree /worktrees/detached\nHEAD abc123\n\n' \
  > "$STUB_DIR/worktree-list.txt"
result=$( source "$TMPDIR_TEST/lib.sh"; list_worktree_records )
expected=$(printf '\t/worktrees/detached\t')
assert_eq "detached HEAD → empty number, empty branch" "$expected" "$result"
teardown

# 3. A non-issue branch name (main) → empty number, branch populated.
echo "Test: non-issue branch → empty number, branch populated"
setup
printf 'worktree /repo\nHEAD abc123\nbranch refs/heads/main\n\n' \
  > "$STUB_DIR/worktree-list.txt"
result=$( source "$TMPDIR_TEST/lib.sh"; list_worktree_records )
expected=$(printf '\t/repo\tmain')
assert_eq "non-issue branch → empty number, branch kept" "$expected" "$result"
teardown

# 4. Mixed fixture (non-issue + bare + issue-prefixed + detached + non-issue) →
#    every record emitted in git worktree list input order.
echo "Test: mixed fixture → all records in input order"
setup
printf 'worktree /repo\nHEAD abc123\nbranch refs/heads/main\n\nworktree /repo/.bare\nbare\n\nworktree /worktrees/42-my-feature\nHEAD def456\nbranch refs/heads/42-my-feature\n\nworktree /worktrees/detached\nHEAD aaa111\n\nworktree /worktrees/feature-x\nHEAD bbb222\nbranch refs/heads/feature-x\n\n' \
  > "$STUB_DIR/worktree-list.txt"
result=$( source "$TMPDIR_TEST/lib.sh"; list_worktree_records )
expected=$(printf '\t/repo\tmain\n\t/repo/.bare\t\n42\t/worktrees/42-my-feature\t42-my-feature\n\t/worktrees/detached\t\n\t/worktrees/feature-x\tfeature-x')
assert_eq "mixed fixture → all records, input order" "$expected" "$result"
teardown

# ============================================================================
# split_worktree_record (lib.sh) tests
# ============================================================================
echo ""
echo "=== split_worktree_record ==="

# split_worktree_record splits one list_worktree_records line into the globals
# WT_NUM / WT_PATH / WT_BRANCH via parameter expansion — preserving the empty
# leading/trailing fields that `IFS=$'\t' read` would trim. The function is
# pure (no git), so each test sources lib.sh in a subshell directly.

# 1. Issue-prefixed record → all three fields populated.
echo "Test: issue-prefixed record → all fields"
result=$( source "$SCRIPT_DIR/lib.sh"
          split_worktree_record $'42\t/wt/42-x\t42-x'
          printf '%s|%s|%s' "$WT_NUM" "$WT_PATH" "$WT_BRANCH" )
assert_eq "issue-prefixed record split" "42|/wt/42-x|42-x" "$result"

# 2. Non-issue branch record (empty leading issue-number field) → WT_NUM empty,
#    WT_PATH and WT_BRANCH intact.
echo "Test: non-issue record → empty WT_NUM, path intact"
result=$( source "$SCRIPT_DIR/lib.sh"
          split_worktree_record $'\t/repo\tmain'
          printf '%s|%s|%s' "$WT_NUM" "$WT_PATH" "$WT_BRANCH" )
assert_eq "non-issue record split" "|/repo|main" "$result"

# 3. Detached-HEAD / bare record (empty leading and trailing fields) → only
#    WT_PATH populated.
echo "Test: detached/bare record → only WT_PATH"
result=$( source "$SCRIPT_DIR/lib.sh"
          split_worktree_record $'\t/wt/detached\t'
          printf '%s|%s|%s' "$WT_NUM" "$WT_PATH" "$WT_BRANCH" )
assert_eq "detached/bare record split" "|/wt/detached|" "$result"

# 4. Integration: mirrors cleanup_stale_worktree_processes' active-set loop.
#    Every worktree path, including a non-issue worktree like `main`, must reach
#    active_paths intact — split_worktree_record must not let the bare branch
#    name `main` land there in place of the path `/repo`.
echo "Test: non-issue worktree path reaches the active set"
setup
printf 'worktree /repo\nHEAD abc123\nbranch refs/heads/main\n\nworktree /worktrees/42-x\nHEAD def456\nbranch refs/heads/42-x\n\nworktree /worktrees/detached\nHEAD ghi789\n\n' \
  > "$STUB_DIR/worktree-list.txt"
result=$(
  source "$TMPDIR_TEST/lib.sh"
  active_paths=""
  while IFS= read -r line; do
    split_worktree_record "$line"
    [ -z "$WT_PATH" ] && continue
    active_paths+="$WT_PATH "
  done < <(list_worktree_records)
  printf '%s' "$active_paths"
)
assert_eq "active_paths holds every full worktree path" \
  "/repo /worktrees/42-x /worktrees/detached " "$result"
teardown

# ============================================================================
# resolve_project_root (lib.sh) tests
# ============================================================================
echo ""
echo "=== resolve_project_root ==="

# resolve_project_root calls `git rev-parse --path-format=absolute
# --git-common-dir`, so each test creates a stub `git` in a temp bin dir
# and exports it onto PATH before sourcing lib.sh in a subshell.

# 1. git reports a .bare dir → resolve_project_root prints the parent (project root)
#    and exits 0.
echo "Test: git reports .bare dir → prints parent and exits 0"
_rpr_stub=$(mktemp -d)
cat > "$_rpr_stub/git" <<'GIT_STUB'
#!/usr/bin/env bash
case "$*" in
  "rev-parse --path-format=absolute --git-common-dir") echo "/project/.bare" ;;
  *) exit 1 ;;
esac
GIT_STUB
chmod +x "$_rpr_stub/git"
result=$(PATH="$_rpr_stub:$SAVED_PATH" bash -c '
  source "'"$SCRIPT_DIR"'/lib.sh"
  resolve_project_root
')
assert_eq "git reports .bare → prints project root" "/project" "$result"
rm -rf "$_rpr_stub"

# 2. git rev-parse exits non-zero (not in a git repo) → resolve_project_root
#    returns non-zero and prints nothing to stdout.
echo "Test: git rev-parse fails → non-zero return, no stdout"
_rpr_stub=$(mktemp -d)
cat > "$_rpr_stub/git" <<'GIT_STUB'
#!/usr/bin/env bash
exit 1
GIT_STUB
chmod +x "$_rpr_stub/git"
if result=$(PATH="$_rpr_stub:$SAVED_PATH" bash -c '
  source "'"$SCRIPT_DIR"'/lib.sh"
  resolve_project_root
'); then rc=0; else rc=$?; fi
assert_eq "git rev-parse fails → non-zero return" "1" "$rc"
assert_eq "git rev-parse fails → no stdout" "" "$result"
rm -rf "$_rpr_stub"

# <<< END MOVED <<<

report_results
