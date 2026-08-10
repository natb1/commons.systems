#!/usr/bin/env bash
# Tests for dispatch-resolve-worktree -- moved verbatim from test-dispatch-scripts.sh
# (tactic-dispatch-test-monolith-split). Original section: 4757-5203.
set -euo pipefail

FIXTURE_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=dispatch-test-fixture.sh
source "$FIXTURE_DIR/dispatch-test-fixture.sh"

# >>> MOVED FROM test-dispatch-scripts.sh >>>
# ============================================================================
# dispatch-resolve-worktree tests
# ============================================================================
echo ""
echo "=== dispatch-resolve-worktree ==="

# A two-record worktree list: the main worktree on `main`, plus a 42-* worktree.
WORKTREE_LIST_42='worktree /repo
HEAD abc123
branch refs/heads/main

worktree /worktrees/42-my-feature
HEAD def456
branch refs/heads/42-my-feature

'

# 1. explicit mode + an existing <N>-* worktree + no live session → enter <path>.
#    The liveness check is mode-independent (#837); a sessionless worktree
#    recycles after completion.
echo "Test: explicit + sessionless <N>-* worktree → enter"
setup
printf '%s' "$WORKTREE_LIST_42" > "$STUB_DIR/worktree-list.txt"
select_target_fake_claude   # orphan world: no live sessions
result=$("$TMPDIR_TEST/dispatch-resolve-worktree" 42 explicit)
assert_eq "explicit + sessionless worktree → enter <path>" \
  "enter /worktrees/42-my-feature" "$result"
teardown

# 1b. #1612: the enter/reconcile path forces dispatch-find-pr's retry delay to 0.
#     emit_enter_reconciled calls dispatch-find-pr under the dispatch lock, so its
#     1s self-fetch retry sleep must be suppressed (DISPATCH_FIND_PR_RETRY_DELAY=0)
#     even when the inherited environment sets a non-zero delay — otherwise the
#     sleep extends the lock window on every reused-worktree resolution.
echo "Test: #1612 enter path forces dispatch-find-pr retry delay 0 under the lock"
setup
printf '%s' "$WORKTREE_LIST_42" > "$STUB_DIR/worktree-list.txt"
select_target_fake_claude   # orphan world: no live session → enter path
# Probe find-pr: record the retry delay observed, then return empty (no PR →
# enter unchanged). Overwrites the real copy setup installed.
cat > "$TMPDIR_TEST/dispatch-find-pr" <<'PROBE'
#!/usr/bin/env bash
STUB_DIR="$(cd "$(dirname "$0")" && pwd)/stub"
printf '%s\n' "${DISPATCH_FIND_PR_RETRY_DELAY:-unset}" > "$STUB_DIR/find-pr-delay-seen.txt"
exit 0
PROBE
chmod +x "$TMPDIR_TEST/dispatch-find-pr"
export DISPATCH_FIND_PR_RETRY_DELAY=99   # a non-zero inherited delay the call must override
result=$("$TMPDIR_TEST/dispatch-resolve-worktree" 42 explicit)
export DISPATCH_FIND_PR_RETRY_DELAY=0    # restore harness default for later tests
assert_eq "#1612 enter path → enter unchanged (probe returns no PR)" \
  "enter /worktrees/42-my-feature" "$result"
assert_eq "#1612 enter path forced find-pr retry delay to 0 (not the inherited 99)" \
  "0" "$(cat "$STUB_DIR/find-pr-delay-seen.txt")"
teardown

# 2. explicit mode + a live-session-owned worktree → conflict <path> (#837). The
#    recycle path no longer fires into a worktree whose previous worker is live.
echo "Test: explicit + live-session <N>-* worktree → conflict"
setup
printf '%s' "$WORKTREE_LIST_42" > "$STUB_DIR/worktree-list.txt"
select_target_fake_claude "42-my-feature"
result=$("$TMPDIR_TEST/dispatch-resolve-worktree" 42 explicit)
assert_eq "explicit + live-session worktree → conflict <path>" \
  "conflict /worktrees/42-my-feature" "$result"
teardown

# 2b. explicit mode + an UNKNOWN daemon (claude unqueryable) → conflict <path>.
#     worktree_has_live_session folds UNKNOWN into occupied, so explicit resolve
#     fails safe to conflict, exactly as queue mode does (3c).
echo "Test: explicit + unqueryable daemon → conflict (fail-safe)"
setup
printf '%s' "$WORKTREE_LIST_42" > "$STUB_DIR/worktree-list.txt"
# setup's default CLAUDE_AGENTS_CMD points at a non-existent binary (UNKNOWN).
result=$("$TMPDIR_TEST/dispatch-resolve-worktree" 42 explicit)
assert_eq "explicit + unqueryable daemon → conflict <path>" \
  "conflict /worktrees/42-my-feature" "$result"
teardown

# 3. queue mode + a live-session-owned worktree → conflict <path>. The liveness
#    check is mode-independent (#837): both modes yield conflict for a live
#    session — see test 2 for the explicit-mode counterpart.
echo "Test: queue + live-session <N>-* worktree → conflict"
setup
printf '%s' "$WORKTREE_LIST_42" > "$STUB_DIR/worktree-list.txt"
select_target_fake_claude "42-my-feature"
result=$("$TMPDIR_TEST/dispatch-resolve-worktree" 42 queue)
assert_eq "queue + live-session worktree → conflict <path>" \
  "conflict /worktrees/42-my-feature" "$result"
teardown

# 3b. queue mode + an orphan worktree (no live session) → enter <path>. The
#     queue target recycles the orphan instead of stalling the tick (#905).
echo "Test: queue + orphan <N>-* worktree → enter"
setup
printf '%s' "$WORKTREE_LIST_42" > "$STUB_DIR/worktree-list.txt"
select_target_fake_claude
result=$("$TMPDIR_TEST/dispatch-resolve-worktree" 42 queue)
assert_eq "queue + orphan worktree → enter <path>" \
  "enter /worktrees/42-my-feature" "$result"
teardown

# 3c. queue mode + an UNKNOWN daemon (claude unqueryable) → conflict <path>.
#     worktree_has_live_session folds UNKNOWN into occupied, so resolve fails
#     safe to conflict rather than entering a possibly-owned worktree.
echo "Test: queue + unqueryable daemon → conflict (fail-safe)"
setup
printf '%s' "$WORKTREE_LIST_42" > "$STUB_DIR/worktree-list.txt"
# setup's default CLAUDE_AGENTS_CMD points at a non-existent binary (UNKNOWN).
result=$("$TMPDIR_TEST/dispatch-resolve-worktree" 42 queue)
assert_eq "queue + unqueryable daemon → conflict <path>" \
  "conflict /worktrees/42-my-feature" "$result"
teardown

# 4. No matching worktree → create <N>-<slug> from the issue title.
echo "Test: no worktree → create <N>-<slug>"
setup
echo '{"state":"open","title":"Add a feature"}' > "$STUB_DIR/arg-issue-42.json"
result=$("$TMPDIR_TEST/dispatch-resolve-worktree" 42 explicit)
assert_eq "no worktree → create <N>-<slug>" "create 42-add-a-feature" "$result"
teardown

# 5. Sanitization: uppercase, punctuation, and leading/trailing spaces collapse
#    to a lowercase dash-joined slug.
echo "Test: title sanitization → create"
setup
printf '{"state":"open","title":"  Fix: The Foo/Bar Widget!  "}' > "$STUB_DIR/arg-issue-7.json"
result=$("$TMPDIR_TEST/dispatch-resolve-worktree" 7 explicit)
assert_eq "messy title sanitized → create" "create 7-fix-the-foo-bar-widget" "$result"
teardown

# 6. Truncation: a long title yields a branch <= 32 chars matching the
#    WorktreeCreate hook form (acceptance criterion 2).
echo "Test: long title truncated to <= 32-char branch → create"
setup
echo '{"state":"open","title":"Extract the worktree resolution logic into a dedicated script"}' \
  > "$STUB_DIR/arg-issue-656.json"
result=$("$TMPDIR_TEST/dispatch-resolve-worktree" 656 explicit)
assert_eq "long title truncated → exact create line" \
  "create 656-extract-the-worktree-resolut" "$result"
branch="${result#create }"
TOTAL=$((TOTAL + 1))
if [[ "${#branch}" -le 32 ]]; then
  PASS=$((PASS + 1)); echo "  PASS: truncated branch <= 32 chars"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: truncated branch <= 32 chars (${#branch})"
fi
TOTAL=$((TOTAL + 1))
if [[ "$branch" =~ ^[0-9]+-[a-z0-9]+(-[a-z0-9]+)*$ ]]; then
  PASS=$((PASS + 1)); echo "  PASS: truncated branch matches WorktreeCreate form"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: truncated branch matches WorktreeCreate form"
fi
teardown

# 7. explicit mode invoked from within <N>-* worktree (current-branch = <N>-*)
#    AND matching worktree entry → enter <path> (no special-case `here`).
#    current-branch.txt is not read by dispatch-resolve-worktree (the `here`
#    check was removed); it is seeded here only to document the scenario intent.
echo "Test: explicit from issue-branch cwd with matching worktree → enter (not here)"
setup
printf '%s' "$WORKTREE_LIST_42" > "$STUB_DIR/worktree-list.txt"
select_target_fake_claude   # sessionless so the #837 liveness check proceeds to enter
result=$("$TMPDIR_TEST/dispatch-resolve-worktree" 42 explicit)
assert_eq "explicit from issue-branch cwd, matching worktree → enter (not here)" \
  "enter /worktrees/42-my-feature" "$result"
teardown

# 7b. queue mode invoked from within <N>-* worktree (current-branch = <N>-*)
#     AND a live-session-owned matching worktree → conflict <path> (worktree
#     scan runs normally).
echo "Test: queue from issue-branch cwd with live-session worktree → conflict (not here)"
setup
printf '%s' "$WORKTREE_LIST_42" > "$STUB_DIR/worktree-list.txt"
select_target_fake_claude "42-my-feature"
result=$("$TMPDIR_TEST/dispatch-resolve-worktree" 42 queue)
assert_eq "queue from issue-branch cwd, live-session worktree → conflict (not here)" \
  "conflict /worktrees/42-my-feature" "$result"
teardown

# 8. A non-matching worktree (different issue) → create.
echo "Test: only a non-matching worktree → create"
setup
printf 'worktree /repo\nHEAD abc123\nbranch refs/heads/main\n\nworktree /worktrees/99-other\nHEAD def456\nbranch refs/heads/99-other\n\n' \
  > "$STUB_DIR/worktree-list.txt"
echo '{"state":"open","title":"My Task"}' > "$STUB_DIR/arg-issue-42.json"
result=$("$TMPDIR_TEST/dispatch-resolve-worktree" 42 queue)
assert_eq "non-matching worktree → create" "create 42-my-task" "$result"
teardown

# 9. Argument validation: missing args, non-numeric issue, bad mode → exit 1.
echo "Test: argument validation → non-zero exit"
setup
if "$TMPDIR_TEST/dispatch-resolve-worktree" 2>/dev/null; then rc=0; else rc=$?; fi
assert_eq "missing both args exits non-zero" "1" "$rc"
if "$TMPDIR_TEST/dispatch-resolve-worktree" 42 2>/dev/null; then rc=0; else rc=$?; fi
assert_eq "missing mode arg exits non-zero" "1" "$rc"
if "$TMPDIR_TEST/dispatch-resolve-worktree" abc explicit 2>/dev/null; then rc=0; else rc=$?; fi
assert_eq "non-numeric issue exits non-zero" "1" "$rc"
if "$TMPDIR_TEST/dispatch-resolve-worktree" 0 explicit 2>/dev/null; then rc=0; else rc=$?; fi
assert_eq "issue zero exits non-zero" "1" "$rc"
if "$TMPDIR_TEST/dispatch-resolve-worktree" 42 bogus 2>/dev/null; then rc=0; else rc=$?; fi
assert_eq "bad mode exits non-zero" "1" "$rc"
teardown

# 10. A title with no alphanumerics sanitizes to an empty slug → exit 1.
echo "Test: title with no alphanumerics → empty-slug error"
setup
echo '{"state":"open","title":"!!!"}' > "$STUB_DIR/arg-issue-42.json"
if "$TMPDIR_TEST/dispatch-resolve-worktree" 42 explicit 2>/dev/null; then rc=0; else rc=$?; fi
assert_eq "empty-slug title exits non-zero" "1" "$rc"
teardown

# 10a. No worktree + the issue has an open PR → create-existing <pr-head>. The
#      create path checks dispatch-find-pr first (#943); a PR present means an
#      existing branch, so the resolver hands the caller the PR head branch to
#      materialize instead of a fresh <N>-<slug>. The local-vs-remote choice is
#      a materialize-spawn concern, so the resolver emits the same line for both.
echo "Test: no worktree + open PR → create-existing <pr-head>"
setup
printf '[{"number":100,"headRefName":"42-existing-pr-branch"}]\n' > "$STUB_DIR/pr-list-full.json"
echo '{"number":100,"state":"open","head":{"ref":"42-existing-pr-branch"}}' > "$STUB_DIR/pr-headref-100.json"
result=$("$TMPDIR_TEST/dispatch-resolve-worktree" 42 explicit)
assert_eq "no worktree + open PR → create-existing <pr-head>" \
  "create-existing 42-existing-pr-branch" "$result"
teardown

# 10b. No worktree + NO PR → create <N>-<slug> unchanged (#943 AC #5). The
#      find-pr check falls through (find-pr returns empty), so the fresh-slug
#      create logic is preserved for the genuine implement phase.
echo "Test: no worktree + no PR → create <N>-<slug> (find-pr fall-through, AC #5)"
setup
echo '{"state":"open","title":"Add a feature"}' > "$STUB_DIR/arg-issue-42.json"
result=$("$TMPDIR_TEST/dispatch-resolve-worktree" 42 explicit)
assert_eq "no worktree + no PR → create <N>-<slug>" "create 42-add-a-feature" "$result"
teardown

# 10c. #1612: the create path's #943/#1591 PR-existence check forces
#      dispatch-find-pr's retry delay to 0. The create-path dispatch-find-pr call
#      (added by #1591) also runs under the dispatch lock, so its 1s self-fetch
#      retry sleep must be suppressed (DISPATCH_FIND_PR_RETRY_DELAY=0) even when
#      the inherited environment sets a non-zero delay — a genuine-new-issue (the
#      common queue path) returns no PR here and would otherwise pay the full
#      sleep under the lock.
echo "Test: #1612 create path forces dispatch-find-pr retry delay 0 under the lock"
setup
echo '{"state":"open","title":"Add a feature"}' > "$STUB_DIR/arg-issue-42.json"
# Probe find-pr: record the retry delay observed, then return empty (no PR →
# fall through to fresh-slug create). Overwrites the real copy setup installed.
cat > "$TMPDIR_TEST/dispatch-find-pr" <<'PROBE'
#!/usr/bin/env bash
STUB_DIR="$(cd "$(dirname "$0")" && pwd)/stub"
printf '%s\n' "${DISPATCH_FIND_PR_RETRY_DELAY:-unset}" > "$STUB_DIR/find-pr-delay-seen.txt"
exit 0
PROBE
chmod +x "$TMPDIR_TEST/dispatch-find-pr"
export DISPATCH_FIND_PR_RETRY_DELAY=99   # a non-zero inherited delay the call must override
result=$("$TMPDIR_TEST/dispatch-resolve-worktree" 42 explicit)
export DISPATCH_FIND_PR_RETRY_DELAY=0    # restore harness default for later tests
assert_eq "#1612 create path → create <N>-<slug> (probe returns no PR)" \
  "create 42-add-a-feature" "$result"
assert_eq "#1612 create path forced find-pr retry delay to 0 (not the inherited 99)" \
  "0" "$(cat "$STUB_DIR/find-pr-delay-seen.txt")"
teardown

# ----------------------------------------------------------------------------
# Branch reconciliation on the `enter` path (#913). PR existence is driven via
# pr-list-full.json (dispatch-find-pr's prefix match on headRefName); the PR
# head branch is driven via pr-headref-<num>.json (gh_pr_view_rest head.ref).
# The git stub logs checkouts to git-checkout.log and reads the unique-commit
# count from rev-list-count.txt (default 0).
# ----------------------------------------------------------------------------

# 11. Wrong branch + PR + no unique commits → re-point: enter AND checkout logged.
echo "Test: reconcile wrong branch (no unique commits) → re-point + enter"
setup
printf '%s' "$WORKTREE_LIST_42" > "$STUB_DIR/worktree-list.txt"
select_target_fake_claude   # sessionless: explicit liveness check (#837) proceeds to reconcile
printf '[{"number":100,"headRefName":"42-pr-branch"}]\n' > "$STUB_DIR/pr-list-full.json"
echo '{"number":100,"state":"open","head":{"ref":"42-pr-branch"}}' > "$STUB_DIR/pr-headref-100.json"
result=$("$TMPDIR_TEST/dispatch-resolve-worktree" 42 explicit)
assert_eq "wrong branch + no unique commits → enter" \
  "enter /worktrees/42-my-feature" "$result"
checkout_logged=$([[ -f "$STUB_DIR/git-checkout.log" ]] && grep -q -- "-B 42-pr-branch origin/42-pr-branch" "$STUB_DIR/git-checkout.log" && echo yes || echo no)
assert_eq "wrong branch + no unique commits → re-point checkout logged" "yes" "$checkout_logged"
teardown

# 12. Worktree already on the PR head branch → enter, no redundant checkout.
echo "Test: worktree already on PR branch → enter, no checkout"
setup
printf '%s' "$WORKTREE_LIST_42" > "$STUB_DIR/worktree-list.txt"
select_target_fake_claude   # sessionless: explicit liveness check (#837) proceeds to reconcile
printf '[{"number":100,"headRefName":"42-my-feature"}]\n' > "$STUB_DIR/pr-list-full.json"
echo '{"number":100,"state":"open","head":{"ref":"42-my-feature"}}' > "$STUB_DIR/pr-headref-100.json"
result=$("$TMPDIR_TEST/dispatch-resolve-worktree" 42 explicit)
assert_eq "already on PR branch → enter" "enter /worktrees/42-my-feature" "$result"
checkout_logged=$([[ -f "$STUB_DIR/git-checkout.log" ]] && echo yes || echo no)
assert_eq "already on PR branch → no checkout" "no" "$checkout_logged"
teardown

# 13. Wrong branch + unique commits on the worktree branch → conflict.
echo "Test: reconcile wrong branch (unique commits) → conflict"
setup
printf '%s' "$WORKTREE_LIST_42" > "$STUB_DIR/worktree-list.txt"
select_target_fake_claude   # sessionless: conflict here is from unique commits, not liveness (#837)
printf '[{"number":100,"headRefName":"42-pr-branch"}]\n' > "$STUB_DIR/pr-list-full.json"
echo '{"number":100,"state":"open","head":{"ref":"42-pr-branch"}}' > "$STUB_DIR/pr-headref-100.json"
echo "2" > "$STUB_DIR/rev-list-count.txt"
result=$("$TMPDIR_TEST/dispatch-resolve-worktree" 42 explicit)
assert_eq "wrong branch + unique commits → conflict" \
  "conflict /worktrees/42-my-feature" "$result"
checkout_logged=$([[ -f "$STUB_DIR/git-checkout.log" ]] && echo yes || echo no)
assert_eq "wrong branch + unique commits → no checkout" "no" "$checkout_logged"
teardown

# 14. No PR for the issue (implement phase) → enter unchanged: no gh pr view,
#     no checkout.
echo "Test: no PR → enter unchanged (no pr view, no checkout)"
setup
printf '%s' "$WORKTREE_LIST_42" > "$STUB_DIR/worktree-list.txt"
select_target_fake_claude   # sessionless: explicit liveness check (#837) proceeds to reconcile
# No pr-list-full.json: dispatch-find-pr finds no PR.
result=$("$TMPDIR_TEST/dispatch-resolve-worktree" 42 explicit)
assert_eq "no PR → enter" "enter /worktrees/42-my-feature" "$result"
pr_view_called=$([[ -f "$STUB_DIR/gh-pr-view-headref.log" ]] && echo yes || echo no)
assert_eq "no PR → gh-pr-view not called" "no" "$pr_view_called"
checkout_logged=$([[ -f "$STUB_DIR/git-checkout.log" ]] && echo yes || echo no)
assert_eq "no PR → no checkout" "no" "$checkout_logged"
teardown

# 15. queue-orphan + wrong branch + PR → reconciliation applies in queue mode too.
echo "Test: queue orphan + wrong branch + PR → re-point + enter"
setup
printf '%s' "$WORKTREE_LIST_42" > "$STUB_DIR/worktree-list.txt"
select_target_fake_claude   # orphan: no live session owns the worktree
printf '[{"number":100,"headRefName":"42-pr-branch"}]\n' > "$STUB_DIR/pr-list-full.json"
echo '{"number":100,"state":"open","head":{"ref":"42-pr-branch"}}' > "$STUB_DIR/pr-headref-100.json"
result=$("$TMPDIR_TEST/dispatch-resolve-worktree" 42 queue)
assert_eq "queue orphan + wrong branch → enter" \
  "enter /worktrees/42-my-feature" "$result"
checkout_logged=$([[ -f "$STUB_DIR/git-checkout.log" ]] && grep -q -- "-B 42-pr-branch origin/42-pr-branch" "$STUB_DIR/git-checkout.log" && echo yes || echo no)
assert_eq "queue orphan + wrong branch → re-point checkout logged" "yes" "$checkout_logged"
teardown

# 16. queue live-session + wrong branch + PR → the live-session conflict
#     short-circuits before reconciliation: conflict, no gh pr view, no checkout.
#     Documents that live-session ownership takes precedence over branch identity.
echo "Test: queue live-session + wrong branch → conflict (no reconciliation)"
setup
printf '%s' "$WORKTREE_LIST_42" > "$STUB_DIR/worktree-list.txt"
select_target_fake_claude "42-my-feature"   # live session owns the worktree
printf '[{"number":100,"headRefName":"42-pr-branch"}]\n' > "$STUB_DIR/pr-list-full.json"
echo '{"number":100,"state":"open","head":{"ref":"42-pr-branch"}}' > "$STUB_DIR/pr-headref-100.json"
result=$("$TMPDIR_TEST/dispatch-resolve-worktree" 42 queue)
assert_eq "queue live-session + wrong branch → conflict" \
  "conflict /worktrees/42-my-feature" "$result"
pr_view_called=$([[ -f "$STUB_DIR/gh-pr-view-headref.log" ]] && echo yes || echo no)
assert_eq "queue live-session + wrong branch → gh-pr-view not called" "no" "$pr_view_called"
checkout_logged=$([[ -f "$STUB_DIR/git-checkout.log" ]] && echo yes || echo no)
assert_eq "queue live-session + wrong branch → no checkout" "no" "$checkout_logged"
teardown

# 17. PR found but headRefName empty/unusable → error, not a silent enter. An
#     empty headRefName once a PR exists is a failed lookup; entering
#     unreconciled would defeat the reconciliation guard. The same check blocks
#     option/refspec injection via the GitHub-sourced branch name.
echo "Test: PR + empty headRefName → error (no silent enter, no checkout)"
setup
printf '%s' "$WORKTREE_LIST_42" > "$STUB_DIR/worktree-list.txt"
select_target_fake_claude   # sessionless: explicit liveness check (#837) proceeds to reconcile
printf '[{"number":100,"headRefName":"42-pr-branch"}]\n' > "$STUB_DIR/pr-list-full.json"
echo '{"number":100,"state":"open","head":{"ref":""}}' > "$STUB_DIR/pr-headref-100.json"
if result=$("$TMPDIR_TEST/dispatch-resolve-worktree" 42 explicit 2>/dev/null); then rc=0; else rc=$?; fi
assert_eq "PR + empty headRefName → exit 1" "1" "$rc"
checkout_logged=$([[ -f "$STUB_DIR/git-checkout.log" ]] && echo yes || echo no)
assert_eq "PR + empty headRefName → no checkout" "no" "$checkout_logged"
teardown

# 18. PR head branch carrying an option-injection name → error before any git
#     call. Guards the GitHub-sourced headRefName at the external boundary.
echo "Test: PR + injection-shaped headRefName → error (no checkout)"
setup
printf '%s' "$WORKTREE_LIST_42" > "$STUB_DIR/worktree-list.txt"
select_target_fake_claude   # sessionless: explicit liveness check (#837) proceeds to reconcile
printf '[{"number":100,"headRefName":"42-pr-branch"}]\n' > "$STUB_DIR/pr-list-full.json"
echo '{"number":100,"state":"open","head":{"ref":"--upload-pack=evil"}}' > "$STUB_DIR/pr-headref-100.json"
if result=$("$TMPDIR_TEST/dispatch-resolve-worktree" 42 explicit 2>/dev/null); then rc=0; else rc=$?; fi
assert_eq "PR + injection-shaped headRefName → exit 1" "1" "$rc"
checkout_logged=$([[ -f "$STUB_DIR/git-checkout.log" ]] && echo yes || echo no)
assert_eq "PR + injection-shaped headRefName → no checkout" "no" "$checkout_logged"
teardown

# ----------------------------------------------------------------------------
# PR-number-as-issue-key rejection (#926). The REST issues endpoint serves PRs
# too; a PR's JSON carries a "pull_request" key (the same discriminator
# dispatch-resolve-arg uses). A PR number passed as the issue key must be
# rejected up front — never slugged into a stray <pr-num>-* worktree. The #922
# scenario: PR 922 lives on branch 918-dispatch-move and closes issue 918, so
# PR number and closing-issue number differ.
# ----------------------------------------------------------------------------

# 19a. PR number passed as the issue key → reject before the create-path slug.
#      arg-issue-922.json carries "pull_request" AND a usable title, so the test
#      proves the guard fires *before* the create path (no decision line despite a
#      usable title in the issue object).
echo "Test: PR number as issue key → reject (no stray <pr-num>-* worktree)"
setup
echo '{"number":922,"state":"open","title":"some pr title","pull_request":{"url":"https://api.github.com/repos/o/r/pulls/922"}}' \
  > "$STUB_DIR/arg-issue-922.json"
if result=$("$TMPDIR_TEST/dispatch-resolve-worktree" 922 queue 2>/dev/null); then rc=0; else rc=$?; fi
assert_eq "PR number as issue key → exit 1" "1" "$rc"
assert_eq "PR number as issue key → no decision line" "" "$result"
teardown

# 19b. The PR's closing-issue number (918) resolves the real <issue>-* worktree.
#      arg-issue-918.json has NO "pull_request" key, so the guard is skipped; the
#      orphan 918-dispatch-move worktree is entered (PR 922's headRefName matches
#      the worktree branch, so reconciliation is a no-op).
echo "Test: PR closing-issue number → enter the real <issue>-* worktree"
setup
printf 'worktree /repo\nHEAD abc123\nbranch refs/heads/main\n\nworktree /worktrees/918-dispatch-move\nHEAD def456\nbranch refs/heads/918-dispatch-move\n\n' \
  > "$STUB_DIR/worktree-list.txt"
select_target_fake_claude   # orphan: no live session owns the worktree
echo '{"number":918}' > "$STUB_DIR/arg-issue-918.json"
printf '[{"number":922,"headRefName":"918-dispatch-move"}]\n' > "$STUB_DIR/pr-list-full.json"
echo '{"number":922,"state":"open","head":{"ref":"918-dispatch-move"}}' > "$STUB_DIR/pr-headref-922.json"
result=$("$TMPDIR_TEST/dispatch-resolve-worktree" 918 queue)
assert_eq "PR closing-issue number → enter real worktree" \
  "enter /worktrees/918-dispatch-move" "$result"
teardown

# 19c. PR number passed as issue key with a stale <pr-num>-* worktree on disk.
#      The guard fires BEFORE the worktree scan, so the stale 922-* worktree is
#      never entered — this is the main correctness rationale for placing the guard
#      before the scan rather than only before the create path.
echo "Test: PR number as issue key + stale stray worktree → reject (no enter)"
setup
printf 'worktree /repo\nHEAD abc123\nbranch refs/heads/main\n\nworktree /worktrees/922-stray\nHEAD fff999\nbranch refs/heads/922-stray\n\n' \
  > "$STUB_DIR/worktree-list.txt"
echo '{"number":922,"pull_request":{"url":"https://api.github.com/repos/o/r/pulls/922"}}' \
  > "$STUB_DIR/arg-issue-922.json"
select_target_fake_claude   # orphan: no live session (liveness is irrelevant — guard fires first)
if result=$("$TMPDIR_TEST/dispatch-resolve-worktree" 922 queue 2>/dev/null); then rc=0; else rc=$?; fi
assert_eq "PR number + stale stray worktree → exit 1" "1" "$rc"
assert_eq "PR number + stale stray worktree → no decision line" "" "$result"
teardown

# <<< END MOVED <<<

report_results
