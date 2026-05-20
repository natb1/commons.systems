#!/usr/bin/env bash
# Unit-test suite for dispatch-phase, dispatch-select-target, dispatch-trace-leaf,
# dispatch-complete-phase, dispatch-resolve-worktree. Uses PATH shims to fake gh
# and git — no network required.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# --- test helpers -----------------------------------------------------------

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

# --- harness ----------------------------------------------------------------

SAVED_PATH="$PATH"
TMPDIR_TEST=""
STUB_DIR=""

setup() {
  TMPDIR_TEST=$(mktemp -d)
  STUB_DIR="$TMPDIR_TEST/stub"
  mkdir -p "$TMPDIR_TEST/bin" "$STUB_DIR"

  # Copy the scripts under test into the tmp dir so they can call each other
  # via SCRIPT_DIR resolution without relying on the real filesystem PATH.
  cp "$SCRIPT_DIR/dispatch-phase" "$TMPDIR_TEST/dispatch-phase"
  cp "$SCRIPT_DIR/dispatch-select-target" "$TMPDIR_TEST/dispatch-select-target"
  cp "$SCRIPT_DIR/dispatch-trace-leaf" "$TMPDIR_TEST/dispatch-trace-leaf"
  cp "$SCRIPT_DIR/dispatch-complete-phase" "$TMPDIR_TEST/dispatch-complete-phase"
  cp "$SCRIPT_DIR/dispatch-resolve-worktree" "$TMPDIR_TEST/dispatch-resolve-worktree"
  chmod +x "$TMPDIR_TEST/dispatch-phase" \
           "$TMPDIR_TEST/dispatch-select-target" \
           "$TMPDIR_TEST/dispatch-trace-leaf" \
           "$TMPDIR_TEST/dispatch-complete-phase" \
           "$TMPDIR_TEST/dispatch-resolve-worktree"

  # dispatch-select-target calls dispatch-phase as "$SCRIPT_DIR/dispatch-phase".
  # Since we copied them all to TMPDIR_TEST, SCRIPT_DIR inside each copy will
  # resolve to TMPDIR_TEST correctly.

  # stub gh
  cat > "$TMPDIR_TEST/bin/gh" <<'STUB'
#!/usr/bin/env bash
STUB_DIR="$(cd "$(dirname "$0")/.." && pwd)/stub"
# Reconstruct full args string for matching.
args="$*"
case "$args" in
  "pr list --state open --json number,headRefName,isDraft,statusCheckRollup,labels")
    echo "pr list" >> "$STUB_DIR/gh-pr-list-calls.log"
    if [[ -f "$STUB_DIR/pr-list-full.json" ]]; then
      cat "$STUB_DIR/pr-list-full.json"
    else
      echo "[]"
    fi
    ;;
  "pr list --state open --json number,createdAt,headRefName,isDraft,statusCheckRollup,labels")
    echo "pr list" >> "$STUB_DIR/gh-pr-list-calls.log"
    if [[ -f "$STUB_DIR/pr-list-union.json" ]]; then
      cat "$STUB_DIR/pr-list-union.json"
    else
      echo "[]"
    fi
    ;;
  "issue list --label help wanted --state open --json number,createdAt")
    if [[ -f "$STUB_DIR/issue-list.json" ]]; then
      cat "$STUB_DIR/issue-list.json"
    else
      echo "[]"
    fi
    ;;
  issue\ view\ *\ --json\ state)
    # dispatch-select-target worktree detection: gh issue view <num> --json state
    num=$(echo "$args" | awk '{print $3}')
    if [[ -f "$STUB_DIR/issue-state-${num}.json" ]]; then
      cat "$STUB_DIR/issue-state-${num}.json"
    else
      exit 1
    fi
    ;;
  issue\ view\ *\ --json\ title,body,comments,number,state)
    # issue-blocking / issue-sub-issues call: gh issue view <num> --json ...
    num=$(echo "$args" | awk '{print $3}')
    if [[ -f "$STUB_DIR/issue-${num}.json" ]]; then
      cat "$STUB_DIR/issue-${num}.json"
    else
      echo "{\"title\":\"Issue $num\",\"body\":\"\",\"comments\":[],\"number\":$num,\"state\":\"OPEN\"}"
    fi
    ;;
  issue\ view\ *\ --json\ title)
    # dispatch-resolve-worktree create case: gh issue view <num> --json title
    num=$(echo "$args" | awk '{print $3}')
    if [[ -f "$STUB_DIR/issue-title-${num}.json" ]]; then
      cat "$STUB_DIR/issue-title-${num}.json"
    else
      echo "{\"title\":\"Issue $num\"}"
    fi
    ;;
  api\ */dependencies/blocked_by)
    path=$(echo "$args" | awk '{print $2}')
    num=$(echo "$path" | grep -oE '[0-9]+' | tail -1)
    if [[ -f "$STUB_DIR/blockers-${num}.json" ]]; then
      cat "$STUB_DIR/blockers-${num}.json"
    else
      echo "[]"
    fi
    ;;
  api\ */sub_issues)
    path=$(echo "$args" | awk '{print $2}')
    num=$(echo "$path" | grep -oE '[0-9]+' | tail -1)
    if [[ -f "$STUB_DIR/subissues-${num}.json" ]]; then
      cat "$STUB_DIR/subissues-${num}.json"
    else
      echo "[]"
    fi
    ;;
  label\ create\ *)
    # dispatch-complete-phase creates the label only when the apply reported
    # it missing.
    echo "$args" >> "$STUB_DIR/gh-label-create.log"
    ;;
  pr\ edit\ *)
    # dispatch-complete-phase applies the label to the PR. $STUB_DIR/pr-edit-mode
    # selects behavior (default: succeed and log the args).
    mode="ok"
    [[ -f "$STUB_DIR/pr-edit-mode" ]] && mode=$(cat "$STUB_DIR/pr-edit-mode")
    case "$mode" in
      label-missing)
        # The label does not exist until gh label create runs: model gh's
        # missing-label error until then, then succeed on the retry.
        if [[ -f "$STUB_DIR/gh-label-create.log" ]]; then
          echo "$args" >> "$STUB_DIR/gh-pr-edit.log"
        else
          label="${args##* }"
          echo "failed to update: '$label' not found" >&2
          exit 1
        fi
        ;;
      other-failure)
        # An apply failure unrelated to a missing label.
        echo "GraphQL: Could not resolve to a PullRequest" >&2
        exit 1
        ;;
      *)
        echo "$args" >> "$STUB_DIR/gh-pr-edit.log"
        ;;
    esac
    ;;
  "api repos/{owner}/{repo}/commits/main")
    # main_broken_sha: resolve origin/main's HEAD SHA. Default: healthy main.
    if [[ -f "$STUB_DIR/main-commit.json" ]]; then cat "$STUB_DIR/main-commit.json"
    else echo '{"sha":"mainhead0"}'; fi
    ;;
  api\ repos/*/commits/*/check-runs)
    # main_broken_sha: CodeQL check-runs for main's HEAD. Default: none.
    if [[ -f "$STUB_DIR/main-check-runs.json" ]]; then cat "$STUB_DIR/main-check-runs.json"
    else echo '{"check_runs":[]}'; fi
    ;;
  run\ list\ --branch\ main\ *)
    # main_broken_sha: Actions workflow runs on main. Default: none.
    if [[ -f "$STUB_DIR/main-run-list.json" ]]; then cat "$STUB_DIR/main-run-list.json"
    else echo '[]'; fi
    ;;
  *)
    echo "gh stub: unknown invocation: $args" >&2
    exit 1
    ;;
esac
STUB
  chmod +x "$TMPDIR_TEST/bin/gh"

  # stub git
  cat > "$TMPDIR_TEST/bin/git" <<'STUB'
#!/usr/bin/env bash
STUB_DIR="$(cd "$(dirname "$0")/.." && pwd)/stub"
args="$*"
case "$args" in
  "worktree list --porcelain")
    if [[ -f "$STUB_DIR/worktree-list.txt" ]]; then
      cat "$STUB_DIR/worktree-list.txt"
    else
      # Default: one worktree entry for the main worktree (no branch for bare)
      printf 'worktree /repo\nHEAD abc123\n\n'
    fi
    ;;
  "rev-parse --abbrev-ref HEAD")
    if [[ -f "$STUB_DIR/current-branch.txt" ]]; then
      cat "$STUB_DIR/current-branch.txt"
    else
      echo "main"
    fi
    ;;
  *)
    echo "git stub: unknown invocation: $args" >&2
    exit 1
    ;;
esac
STUB
  chmod +x "$TMPDIR_TEST/bin/git"

  # Make a fake issue-blocking script that the trace-leaf script can call.
  # dispatch-trace-leaf resolves REF_SCRIPTS_DIR relative to SCRIPT_DIR
  # (two levels up, then ref-pr-workflow/scripts). Inside TMPDIR_TEST the
  # copied scripts have SCRIPT_DIR = TMPDIR_TEST, so REF_SCRIPTS_DIR would
  # be "$TMPDIR_TEST/../../ref-pr-workflow/scripts" which is wrong.
  # Instead, create fake issue-blocking and issue-sub-issues in a fake
  # ref-pr-workflow/scripts dir alongside TMPDIR_TEST.
  mkdir -p "$TMPDIR_TEST/ref-pr-workflow/scripts"

  # We need to patch the copied dispatch-trace-leaf so REF_SCRIPTS_DIR
  # points at our fake scripts. Use a wrapper approach: write a thin wrapper
  # that sets the env and calls the real script with a patched path.
  cat > "$TMPDIR_TEST/ref-pr-workflow/scripts/issue-blocking" <<'FAKE'
#!/usr/bin/env bash
STUB_DIR="$(cd "$(dirname "$0")/../../stub" && pwd)"
num="${1:-}"
# Strip leading # if present.
num="${num#\#}"
# issue-blocking calls lib.sh resolve_issue_number then gh api + gh issue view.
# Our fake: just read a stub file.
blocker_nums=""
if [[ -f "$STUB_DIR/blockers-${num}.json" ]]; then
  blocker_nums=$(cat "$STUB_DIR/blockers-${num}.json" | jq -r '.[].number' 2>/dev/null || true)
fi
for dep in $blocker_nums; do
  if [[ -f "$STUB_DIR/issue-${dep}.json" ]]; then
    cat "$STUB_DIR/issue-${dep}.json"
  else
    echo "{\"title\":\"Issue $dep\",\"body\":\"\",\"comments\":[],\"number\":$dep,\"state\":\"OPEN\"}"
  fi
done
FAKE
  chmod +x "$TMPDIR_TEST/ref-pr-workflow/scripts/issue-blocking"

  cat > "$TMPDIR_TEST/ref-pr-workflow/scripts/issue-sub-issues" <<'FAKE'
#!/usr/bin/env bash
STUB_DIR="$(cd "$(dirname "$0")/../../stub" && pwd)"
num="${1:-}"
num="${num#\#}"
sub_nums=""
if [[ -f "$STUB_DIR/subissues-${num}.json" ]]; then
  sub_nums=$(cat "$STUB_DIR/subissues-${num}.json" | jq -r '.[].number' 2>/dev/null || true)
fi
for sub in $sub_nums; do
  if [[ -f "$STUB_DIR/issue-${sub}.json" ]]; then
    cat "$STUB_DIR/issue-${sub}.json"
  else
    echo "{\"title\":\"Issue $sub\",\"body\":\"\",\"comments\":[],\"number\":$sub,\"state\":\"OPEN\"}"
  fi
done
FAKE
  chmod +x "$TMPDIR_TEST/ref-pr-workflow/scripts/issue-sub-issues"

  # Patch the copied dispatch-trace-leaf to use our fake ref-pr-workflow dir.
  # Replace the REF_SCRIPTS_DIR line so it points into TMPDIR_TEST.
  # We do this by writing a wrapper script.
  mv "$TMPDIR_TEST/dispatch-trace-leaf" "$TMPDIR_TEST/dispatch-trace-leaf.real"
  cat > "$TMPDIR_TEST/dispatch-trace-leaf" <<WRAPPER
#!/usr/bin/env bash
set -euo pipefail
# Override REF_SCRIPTS_DIR to point at fake scripts.
export _DISPATCH_TRACE_LEAF_REF_OVERRIDE="$TMPDIR_TEST/ref-pr-workflow/scripts"
exec "$TMPDIR_TEST/dispatch-trace-leaf.real" "\$@"
WRAPPER
  chmod +x "$TMPDIR_TEST/dispatch-trace-leaf"

  # Patch the real script to honour the override env var.
  # Re-write the REF_SCRIPTS_DIR line in the .real copy.
  # Use a sed in-place to replace the REF_SCRIPTS_DIR assignment.
  sed -i 's|REF_SCRIPTS_DIR="$(cd "\$SCRIPT_DIR/\.\./\.\./ref-pr-workflow/scripts" && pwd)"|REF_SCRIPTS_DIR="${_DISPATCH_TRACE_LEAF_REF_OVERRIDE:-$(cd "\$SCRIPT_DIR/../../ref-pr-workflow/scripts" \&\& pwd)}"|' \
    "$TMPDIR_TEST/dispatch-trace-leaf.real"

  export PATH="$TMPDIR_TEST/bin:$PATH"
}

teardown() {
  rm -rf "$TMPDIR_TEST"
  TMPDIR_TEST=""
  STUB_DIR=""
  export PATH="$SAVED_PATH"
}
trap '[ -n "${TMPDIR_TEST:-}" ] && rm -rf "$TMPDIR_TEST"' EXIT

# Helper to build a PR JSON entry for the full PR list (dispatch-phase).
make_pr() {
  local num="$1" branch="$2" is_draft="$3" labels_json="$4" rollup_json="$5"
  printf '{"number":%s,"headRefName":"%s","isDraft":%s,"labels":%s,"statusCheckRollup":%s}' \
    "$num" "$branch" "$is_draft" "$labels_json" "$rollup_json"
}

# Helper to build a PR JSON entry for the single union PR list that
# dispatch-select-target fetches and exports to dispatch-phase. Carries the
# union of fields both scripts need.
make_pr_union() {
  local num="$1" branch="$2" created="$3" is_draft="$4" labels_json="$5" rollup_json="$6"
  printf '{"number":%s,"createdAt":"%s","headRefName":"%s","isDraft":%s,"labels":%s,"statusCheckRollup":%s}' \
    "$num" "$created" "$branch" "$is_draft" "$labels_json" "$rollup_json"
}

# Green rollup (two passing check runs).
GREEN_ROLLUP='[{"status":"COMPLETED","conclusion":"SUCCESS"},{"status":"COMPLETED","conclusion":"NEUTRAL"}]'
# Failing rollup.
FAILING_ROLLUP='[{"status":"COMPLETED","conclusion":"FAILURE"}]'
# Pending rollup (one check not yet complete).
PENDING_ROLLUP='[{"status":"IN_PROGRESS","conclusion":null}]'
# Mixed rollup: one check concluded failing, one still pending.
MIXED_ROLLUP='[{"status":"COMPLETED","conclusion":"FAILURE"},{"status":"IN_PROGRESS","conclusion":null}]'
# Empty rollup.
EMPTY_ROLLUP='[]'
# No labels.
NO_LABELS='[]'

# ============================================================================
# dispatch-phase tests
# ============================================================================
echo "=== dispatch-phase ==="

# 1. No PR → implement
echo "Test: no PR → implement"
setup
echo '[]' > "$STUB_DIR/pr-list-full.json"
result=$("$TMPDIR_TEST/dispatch-phase" "42")
assert_eq "no PR → implement" "implement" "$result"
teardown

# 2. Draft + failing CI → verify
echo "Test: draft + failing CI → verify"
setup
printf '[%s]\n' "$(make_pr 10 "42-my-feature" "true" "$NO_LABELS" "$FAILING_ROLLUP")" \
  > "$STUB_DIR/pr-list-full.json"
result=$("$TMPDIR_TEST/dispatch-phase" "42")
assert_eq "draft + failing CI → verify" "verify" "$result"
teardown

# 3. Draft + pending CI → waiting
echo "Test: draft + pending CI → waiting"
setup
printf '[%s]\n' "$(make_pr 10 "42-my-feature" "true" "$NO_LABELS" "$PENDING_ROLLUP")" \
  > "$STUB_DIR/pr-list-full.json"
result=$("$TMPDIR_TEST/dispatch-phase" "42")
assert_eq "draft + pending CI → waiting" "waiting" "$result"
teardown

# 4. Draft + empty rollup → waiting
echo "Test: draft + empty rollup → waiting"
setup
printf '[%s]\n' "$(make_pr 10 "42-my-feature" "true" "$NO_LABELS" "$EMPTY_ROLLUP")" \
  > "$STUB_DIR/pr-list-full.json"
result=$("$TMPDIR_TEST/dispatch-phase" "42")
assert_eq "draft + empty rollup → waiting" "waiting" "$result"
teardown

# 4b. Draft + mixed rollup (failing + pending) → verify (failure wins)
echo "Test: draft + mixed rollup → verify"
setup
printf '[%s]\n' "$(make_pr 10 "42-my-feature" "true" "$NO_LABELS" "$MIXED_ROLLUP")" \
  > "$STUB_DIR/pr-list-full.json"
result=$("$TMPDIR_TEST/dispatch-phase" "42")
assert_eq "draft + mixed rollup (fail+pending) → verify" "verify" "$result"
teardown

# 5. Draft + green + no label → qa
echo "Test: draft + green + no label → qa"
setup
printf '[%s]\n' "$(make_pr 10 "42-my-feature" "true" "$NO_LABELS" "$GREEN_ROLLUP")" \
  > "$STUB_DIR/pr-list-full.json"
result=$("$TMPDIR_TEST/dispatch-phase" "42")
assert_eq "draft + green + no label → qa" "qa" "$result"
teardown

# 6. Draft + green + dispatch:qa-done → simplify
echo "Test: draft + green + dispatch:qa-done → simplify"
setup
printf '[%s]\n' "$(make_pr 10 "42-my-feature" "true" '[{"name":"dispatch:qa-done"}]' "$GREEN_ROLLUP")" \
  > "$STUB_DIR/pr-list-full.json"
result=$("$TMPDIR_TEST/dispatch-phase" "42")
assert_eq "draft + green + dispatch:qa-done → simplify" "simplify" "$result"
teardown

# 7. Draft + green + dispatch:refactored → review
echo "Test: draft + green + dispatch:refactored → review"
setup
printf '[%s]\n' "$(make_pr 10 "42-my-feature" "true" '[{"name":"dispatch:refactored"}]' "$GREEN_ROLLUP")" \
  > "$STUB_DIR/pr-list-full.json"
result=$("$TMPDIR_TEST/dispatch-phase" "42")
assert_eq "draft + green + dispatch:refactored → review" "review" "$result"
teardown

# 8. Draft + green + dispatch:reviewed → security
echo "Test: draft + green + dispatch:reviewed → security"
setup
printf '[%s]\n' "$(make_pr 10 "42-my-feature" "true" '[{"name":"dispatch:reviewed"}]' "$GREEN_ROLLUP")" \
  > "$STUB_DIR/pr-list-full.json"
result=$("$TMPDIR_TEST/dispatch-phase" "42")
assert_eq "draft + green + dispatch:reviewed → security" "security" "$result"
teardown

# 9. Draft + green + dispatch:security-reviewed → security (re-entry)
echo "Test: draft + green + dispatch:security-reviewed → security (re-entry)"
setup
printf '[%s]\n' "$(make_pr 10 "42-my-feature" "true" '[{"name":"dispatch:security-reviewed"}]' "$GREEN_ROLLUP")" \
  > "$STUB_DIR/pr-list-full.json"
result=$("$TMPDIR_TEST/dispatch-phase" "42")
assert_eq "draft + green + dispatch:security-reviewed → security (re-entry)" "security" "$result"
teardown

# 10. Non-draft PR → done
echo "Test: non-draft PR → done"
setup
printf '[%s]\n' "$(make_pr 10 "42-my-feature" "false" "$NO_LABELS" "$GREEN_ROLLUP")" \
  > "$STUB_DIR/pr-list-full.json"
result=$("$TMPDIR_TEST/dispatch-phase" "42")
assert_eq "non-draft PR → done" "done" "$result"
teardown

# 11. Branch arg exact match
echo "Test: branch arg → qa"
setup
printf '[%s]\n' "$(make_pr 10 "42-my-feature" "true" "$NO_LABELS" "$GREEN_ROLLUP")" \
  > "$STUB_DIR/pr-list-full.json"
result=$("$TMPDIR_TEST/dispatch-phase" "42-my-feature")
assert_eq "branch arg exact match → qa" "qa" "$result"
teardown

# 12. Issue prefix disambiguation: issue 6 should not match branch "60-foo"
echo "Test: issue 6 does not match branch 60-foo"
setup
printf '[%s]\n' "$(make_pr 10 "60-foo" "true" "$NO_LABELS" "$GREEN_ROLLUP")" \
  > "$STUB_DIR/pr-list-full.json"
result=$("$TMPDIR_TEST/dispatch-phase" "6")
assert_eq "issue 6 does not match branch 60-foo" "implement" "$result"
teardown

# 13. DISPATCH_PR_LIST is used in place of a self-issued gh pr list.
echo "Test: DISPATCH_PR_LIST overrides self-fetch"
setup
# pr-list-full.json is empty: a self-fetch would yield implement. The verify
# PR lives only in the env var, so a verify result proves the env var won.
echo '[]' > "$STUB_DIR/pr-list-full.json"
ENV_LIST='['"$(make_pr 42 "42-verify" "true" "$NO_LABELS" "$FAILING_ROLLUP")"']'
result=$(DISPATCH_PR_LIST="$ENV_LIST" "$TMPDIR_TEST/dispatch-phase" "42")
assert_eq "DISPATCH_PR_LIST used over self-fetch → verify" "verify" "$result"
teardown

# ============================================================================
# dispatch-select-target tests
# ============================================================================
echo ""
echo "=== dispatch-select-target ==="

# dispatch-select-target fetches one union PR list and exports it via
# DISPATCH_PR_LIST, so each per-PR dispatch-phase call reuses it. The harness
# only needs to seed that single list.

setup_union_pr_list() {
  local union_json="$1"
  printf '%s\n' "$union_json" > "$STUB_DIR/pr-list-union.json"
}

# 1. A non-QA PR is chosen over a QA PR and a help-wanted issue.
echo "Test: non-QA PR beats QA PR and issue"
setup
# PR 10 in verify phase (no CI green), PR 20 in qa phase (CI green, no label).
UNION='['"$(make_pr_union 10 "10-verify-me" "2024-01-01T00:00:00Z" "true" "$NO_LABELS" "$FAILING_ROLLUP")"','"$(make_pr_union 20 "20-qa-me" "2024-01-02T00:00:00Z" "true" "$NO_LABELS" "$GREEN_ROLLUP")"']'
setup_union_pr_list "$UNION"
printf '[{"number":99,"createdAt":"2024-01-01T00:00:00Z"}]\n' > "$STUB_DIR/issue-list.json"
# No worktrees for these branches.
printf 'worktree /repo\nHEAD abc123\n\n' > "$STUB_DIR/worktree-list.txt"
result=$("$TMPDIR_TEST/dispatch-select-target")
assert_eq "non-QA PR (verify) chosen first" "pr 10 10-verify-me verify" "$result"
teardown

# 2. PR with a local worktree is skipped.
echo "Test: PR whose branch has a worktree is skipped"
setup
UNION='['"$(make_pr_union 10 "10-active-branch" "2024-01-01T00:00:00Z" "true" "$NO_LABELS" "$FAILING_ROLLUP")"','"$(make_pr_union 20 "20-other" "2024-01-02T00:00:00Z" "true" "$NO_LABELS" "$FAILING_ROLLUP")"']'
setup_union_pr_list "$UNION"
echo '[]' > "$STUB_DIR/issue-list.json"
# Worktree exists for branch 10-active-branch.
printf 'worktree /repo\nHEAD abc123\nbranch refs/heads/10-active-branch\n\nworktree /worktrees/10-active-branch\nHEAD def456\nbranch refs/heads/10-active-branch\n\n' \
  > "$STUB_DIR/worktree-list.txt"
result=$("$TMPDIR_TEST/dispatch-select-target")
assert_eq "PR with worktree skipped; next PR returned" "pr 20 20-other verify" "$result"
teardown

# 3. When no eligible PR exists, a help-wanted issue is chosen.
echo "Test: no eligible PR → help-wanted issue"
setup
echo '[]' > "$STUB_DIR/pr-list-union.json"
printf '[{"number":55,"createdAt":"2024-03-01T00:00:00Z"}]\n' > "$STUB_DIR/issue-list.json"
printf 'worktree /repo\nHEAD abc123\n\n' > "$STUB_DIR/worktree-list.txt"
result=$("$TMPDIR_TEST/dispatch-select-target")
assert_eq "no PR → help-wanted issue" "issue 55" "$result"
teardown

# 4. --qa mode returns only QA PRs.
echo "Test: --qa mode returns QA PR"
setup
UNION='['"$(make_pr_union 20 "20-qa-me" "2024-01-02T00:00:00Z" "true" "$NO_LABELS" "$GREEN_ROLLUP")"','"$(make_pr_union 10 "10-verify-me" "2024-01-01T00:00:00Z" "true" "$NO_LABELS" "$FAILING_ROLLUP")"']'
setup_union_pr_list "$UNION"
echo '[]' > "$STUB_DIR/issue-list.json"
printf 'worktree /repo\nHEAD abc123\n\n' > "$STUB_DIR/worktree-list.txt"
result=$("$TMPDIR_TEST/dispatch-select-target" --qa)
assert_eq "--qa mode returns QA PR" "pr 20 20-qa-me" "$result"
teardown

# 5. Nothing eligible → empty.
echo "Test: nothing eligible → empty"
setup
echo '[]' > "$STUB_DIR/pr-list-union.json"
echo '[]' > "$STUB_DIR/issue-list.json"
printf 'worktree /repo\nHEAD abc123\n\n' > "$STUB_DIR/worktree-list.txt"
result=$("$TMPDIR_TEST/dispatch-select-target")
assert_eq "nothing eligible → empty" "empty" "$result"
teardown

# 6. --qa mode with no QA PR → empty (ignores help-wanted issues).
echo "Test: --qa mode with no QA PR → empty"
setup
echo '[]' > "$STUB_DIR/pr-list-union.json"
printf '[{"number":77,"createdAt":"2024-01-01T00:00:00Z"}]\n' > "$STUB_DIR/issue-list.json"
printf 'worktree /repo\nHEAD abc123\n\n' > "$STUB_DIR/worktree-list.txt"
result=$("$TMPDIR_TEST/dispatch-select-target" --qa)
assert_eq "--qa mode no QA PR → empty" "empty" "$result"
teardown

# 7. All PRs done → falls through to help-wanted issue.
echo "Test: all PRs done → help-wanted issue"
setup
UNION='['"$(make_pr_union 10 "10-done-pr" "2024-01-01T00:00:00Z" "false" "$NO_LABELS" "$GREEN_ROLLUP")"']'
setup_union_pr_list "$UNION"
printf '[{"number":33,"createdAt":"2024-01-01T00:00:00Z"}]\n' > "$STUB_DIR/issue-list.json"
printf 'worktree /repo\nHEAD abc123\n\n' > "$STUB_DIR/worktree-list.txt"
result=$("$TMPDIR_TEST/dispatch-select-target")
assert_eq "done PRs skipped; help-wanted issue returned" "issue 33" "$result"
teardown

# 8. security is the top non-QA tier: it beats review, simplify, and verify.
echo "Test: security beats review/simplify/verify"
setup
SECURITY_LABELS='[{"name":"dispatch:reviewed"}]'
REVIEW_LABELS='[{"name":"dispatch:refactored"}]'
SIMPLIFY_LABELS='[{"name":"dispatch:qa-done"}]'
UNION='['
UNION+="$(make_pr_union 10 "10-verify" "2024-01-01T00:00:00Z" "true" "$NO_LABELS" "$FAILING_ROLLUP")"','
UNION+="$(make_pr_union 20 "20-simplify" "2024-01-02T00:00:00Z" "true" "$SIMPLIFY_LABELS" "$GREEN_ROLLUP")"','
UNION+="$(make_pr_union 30 "30-review" "2024-01-03T00:00:00Z" "true" "$REVIEW_LABELS" "$GREEN_ROLLUP")"','
UNION+="$(make_pr_union 40 "40-security" "2024-01-04T00:00:00Z" "true" "$SECURITY_LABELS" "$GREEN_ROLLUP")"
UNION+=']'
setup_union_pr_list "$UNION"
echo '[]' > "$STUB_DIR/issue-list.json"
printf 'worktree /repo\nHEAD abc123\n\n' > "$STUB_DIR/worktree-list.txt"
result=$("$TMPDIR_TEST/dispatch-select-target")
assert_eq "security beats review/simplify/verify" "pr 40 40-security security" "$result"
teardown

# 9. Within one phase, the oldest PR wins.
echo "Test: within same phase, oldest PR wins"
setup
# Two review-phase PRs; PR 30 is older.
REVIEW_LABELS='[{"name":"dispatch:refactored"}]'
UNION='['
UNION+="$(make_pr_union 30 "30-review-a" "2024-01-01T00:00:00Z" "true" "$REVIEW_LABELS" "$GREEN_ROLLUP")"','
UNION+="$(make_pr_union 31 "31-review-b" "2024-01-02T00:00:00Z" "true" "$REVIEW_LABELS" "$GREEN_ROLLUP")"
UNION+=']'
setup_union_pr_list "$UNION"
echo '[]' > "$STUB_DIR/issue-list.json"
printf 'worktree /repo\nHEAD abc123\n\n' > "$STUB_DIR/worktree-list.txt"
result=$("$TMPDIR_TEST/dispatch-select-target")
assert_eq "oldest review PR wins within phase" "pr 30 30-review-a review" "$result"
teardown

# 10. Any non-QA PR beats a help-wanted issue; help-wanted issue beats a QA PR.
echo "Test: verify PR beats issue; issue beats QA PR"
setup
# verify PR (10), QA PR (20), help-wanted issue (55).
UNION='['
UNION+="$(make_pr_union 10 "10-verify" "2024-01-01T00:00:00Z" "true" "$NO_LABELS" "$FAILING_ROLLUP")"','
UNION+="$(make_pr_union 20 "20-qa" "2024-01-02T00:00:00Z" "true" "$NO_LABELS" "$GREEN_ROLLUP")"
UNION+=']'
setup_union_pr_list "$UNION"
printf '[{"number":55,"createdAt":"2024-01-01T00:00:00Z"}]\n' > "$STUB_DIR/issue-list.json"
printf 'worktree /repo\nHEAD abc123\n\n' > "$STUB_DIR/worktree-list.txt"
result=$("$TMPDIR_TEST/dispatch-select-target")
assert_eq "verify PR beats issue (non-QA > issue > qa)" "pr 10 10-verify verify" "$result"
teardown

# 10b. No non-QA PR: help-wanted issue beats QA PR.
echo "Test: help-wanted issue beats QA PR"
setup
UNION='['"$(make_pr_union 20 "20-qa" "2024-01-02T00:00:00Z" "true" "$NO_LABELS" "$GREEN_ROLLUP")"']'
setup_union_pr_list "$UNION"
printf '[{"number":55,"createdAt":"2024-01-01T00:00:00Z"}]\n' > "$STUB_DIR/issue-list.json"
printf 'worktree /repo\nHEAD abc123\n\n' > "$STUB_DIR/worktree-list.txt"
result=$("$TMPDIR_TEST/dispatch-select-target")
assert_eq "help-wanted issue beats QA PR" "issue 55" "$result"
teardown

# 11. --qa mode returns only the oldest QA PR (ignores non-QA PRs).
echo "Test: --qa mode ignores non-QA PRs and returns oldest QA PR"
setup
SECURITY_LABELS='[{"name":"dispatch:reviewed"}]'
UNION='['
UNION+="$(make_pr_union 10 "10-security" "2024-01-01T00:00:00Z" "true" "$SECURITY_LABELS" "$GREEN_ROLLUP")"','
UNION+="$(make_pr_union 20 "20-qa-old" "2024-01-02T00:00:00Z" "true" "$NO_LABELS" "$GREEN_ROLLUP")"','
UNION+="$(make_pr_union 30 "30-qa-new" "2024-01-03T00:00:00Z" "true" "$NO_LABELS" "$GREEN_ROLLUP")"
UNION+=']'
setup_union_pr_list "$UNION"
echo '[]' > "$STUB_DIR/issue-list.json"
printf 'worktree /repo\nHEAD abc123\n\n' > "$STUB_DIR/worktree-list.txt"
result=$("$TMPDIR_TEST/dispatch-select-target" --qa)
assert_eq "--qa returns oldest QA PR (ignores security PR)" "pr 20 20-qa-old" "$result"
teardown

# 12. waiting PR is skipped in favor of a help-wanted issue.
echo "Test: waiting PR skipped in favor of help-wanted issue"
setup
# PR 10 in waiting phase (pending CI); no other PRs.
UNION='['"$(make_pr_union 10 "10-waiting" "2024-01-01T00:00:00Z" "true" "$NO_LABELS" "$PENDING_ROLLUP")"']'
setup_union_pr_list "$UNION"
printf '[{"number":55,"createdAt":"2024-01-01T00:00:00Z"}]\n' > "$STUB_DIR/issue-list.json"
printf 'worktree /repo\nHEAD abc123\n\n' > "$STUB_DIR/worktree-list.txt"
result=$("$TMPDIR_TEST/dispatch-select-target")
assert_eq "waiting PR skipped; help-wanted issue returned" "issue 55" "$result"
teardown

# 13. waiting PR is skipped in favor of a newer verify-phase PR.
echo "Test: waiting PR skipped in favor of verify PR"
setup
# PR 10 (older) in waiting phase, PR 20 (newer) in verify phase.
UNION='['"$(make_pr_union 10 "10-waiting" "2024-01-01T00:00:00Z" "true" "$NO_LABELS" "$PENDING_ROLLUP")"','"$(make_pr_union 20 "20-verify" "2024-01-02T00:00:00Z" "true" "$NO_LABELS" "$FAILING_ROLLUP")"']'
setup_union_pr_list "$UNION"
echo '[]' > "$STUB_DIR/issue-list.json"
printf 'worktree /repo\nHEAD abc123\n\n' > "$STUB_DIR/worktree-list.txt"
result=$("$TMPDIR_TEST/dispatch-select-target")
assert_eq "waiting PR skipped; verify PR returned" "pr 20 20-verify verify" "$result"
teardown

# 14. A lone waiting PR (nothing else queued) yields empty.
echo "Test: lone waiting PR → empty"
setup
UNION='['"$(make_pr_union 10 "10-waiting" "2024-01-01T00:00:00Z" "true" "$NO_LABELS" "$PENDING_ROLLUP")"']'
setup_union_pr_list "$UNION"
echo '[]' > "$STUB_DIR/issue-list.json"
printf 'worktree /repo\nHEAD abc123\n\n' > "$STUB_DIR/worktree-list.txt"
result=$("$TMPDIR_TEST/dispatch-select-target")
assert_eq "lone waiting PR → empty" "empty" "$result"
teardown

# 16. Open issue worktree → worktree output, queue scan skipped.
echo "Test: open issue worktree → worktree <N> <branch>, scan skipped"
setup
# Seed a verify PR that would normally be selected — proves the scan is skipped.
UNION='['"$(make_pr_union 10 "10-verify-me" "2024-01-01T00:00:00Z" "true" "$NO_LABELS" "$FAILING_ROLLUP")"']'
setup_union_pr_list "$UNION"
echo '[]' > "$STUB_DIR/issue-list.json"
printf 'worktree /repo\nHEAD abc123\n\n' > "$STUB_DIR/worktree-list.txt"
printf '42-some-slug' > "$STUB_DIR/current-branch.txt"
printf '{"state":"OPEN"}' > "$STUB_DIR/issue-state-42.json"
result=$("$TMPDIR_TEST/dispatch-select-target")
assert_eq "open issue worktree → worktree 42 42-some-slug" "worktree 42 42-some-slug" "$result"
teardown

# 17. Closed issue worktree → worktree-closed.
echo "Test: closed issue worktree → worktree-closed <N> <branch>"
setup
setup_union_pr_list '[]'
echo '[]' > "$STUB_DIR/issue-list.json"
printf 'worktree /repo\nHEAD abc123\n\n' > "$STUB_DIR/worktree-list.txt"
printf '42-some-slug' > "$STUB_DIR/current-branch.txt"
printf '{"state":"CLOSED"}' > "$STUB_DIR/issue-state-42.json"
result=$("$TMPDIR_TEST/dispatch-select-target")
assert_eq "closed issue worktree → worktree-closed 42 42-some-slug" "worktree-closed 42 42-some-slug" "$result"
teardown

# 18. Unknown issue worktree (no state file → gh fails) → worktree-closed.
echo "Test: unknown issue worktree → worktree-closed <N> <branch>"
setup
setup_union_pr_list '[]'
echo '[]' > "$STUB_DIR/issue-list.json"
printf 'worktree /repo\nHEAD abc123\n\n' > "$STUB_DIR/worktree-list.txt"
printf '999-gone' > "$STUB_DIR/current-branch.txt"
# No issue-state-999.json — gh stub exits 1, models a nonexistent issue.
result=$("$TMPDIR_TEST/dispatch-select-target")
assert_eq "unknown issue worktree → worktree-closed 999 999-gone" "worktree-closed 999 999-gone" "$result"
teardown

# 19. main branch → queue scan unchanged, normal result returned.
echo "Test: main branch → queue scan runs normally"
setup
UNION='['"$(make_pr_union 10 "10-verify-me" "2024-01-01T00:00:00Z" "true" "$NO_LABELS" "$FAILING_ROLLUP")"']'
setup_union_pr_list "$UNION"
echo '[]' > "$STUB_DIR/issue-list.json"
printf 'worktree /repo\nHEAD abc123\n\n' > "$STUB_DIR/worktree-list.txt"
printf 'main' > "$STUB_DIR/current-branch.txt"
result=$("$TMPDIR_TEST/dispatch-select-target")
assert_eq "main branch → normal scan result (verify PR)" "pr 10 10-verify-me verify" "$result"
teardown

# 20. --qa mode from an issue worktree → detection skipped, QA PR returned.
echo "Test: --qa mode from issue worktree → detection skipped, QA PR returned"
setup
# QA-phase PR: draft + green + no label.
UNION='['"$(make_pr_union 20 "20-qa-me" "2024-01-01T00:00:00Z" "true" "$NO_LABELS" "$GREEN_ROLLUP")"']'
setup_union_pr_list "$UNION"
echo '[]' > "$STUB_DIR/issue-list.json"
printf 'worktree /repo\nHEAD abc123\n\n' > "$STUB_DIR/worktree-list.txt"
# Current branch looks like an issue worktree, but --qa skips detection.
printf '42-x' > "$STUB_DIR/current-branch.txt"
printf '{"state":"OPEN"}' > "$STUB_DIR/issue-state-42.json"
result=$("$TMPDIR_TEST/dispatch-select-target" --qa)
assert_eq "--qa mode from issue worktree → normal QA scan (pr 20 20-qa-me)" "pr 20 20-qa-me" "$result"
teardown

# --- origin/main CI health gate (issue #660) --------------------------------
# The gate runs before the priority ladder in default mode. It aggregates main's
# HEAD CI from check-runs (CodeQL) and Actions workflow runs; a failing
# conclusion short-circuits to "main-broken <sha>".
#
# The explicit-`/dispatch <issue|pr>` bypass is structural and not script-
# testable here: an explicit argument skips the queue scan entirely (SKILL.md
# Step 1), so dispatch-select-target is never invoked on that path.

# 21. main green (explicit success checks) → normal selection.
echo "Test: main green → normal selection"
setup
UNION='['"$(make_pr_union 10 "10-verify-me" "2024-01-01T00:00:00Z" "true" "$NO_LABELS" "$FAILING_ROLLUP")"']'
setup_union_pr_list "$UNION"
echo '[]' > "$STUB_DIR/issue-list.json"
printf 'worktree /repo\nHEAD abc123\n\n' > "$STUB_DIR/worktree-list.txt"
printf '{"sha":"mainhead0"}' > "$STUB_DIR/main-commit.json"
printf '{"check_runs":[{"status":"completed","conclusion":"success"}]}' \
  > "$STUB_DIR/main-check-runs.json"
printf '[{"headSha":"mainhead0","conclusion":"success"}]' \
  > "$STUB_DIR/main-run-list.json"
result=$("$TMPDIR_TEST/dispatch-select-target")
assert_eq "main green → normal selection (verify PR)" "pr 10 10-verify-me verify" "$result"
teardown

# 22. main failing check-run → main-broken; priority ladder skipped.
echo "Test: main failing check-run → main-broken"
setup
# Seed a verify PR + help-wanted issue — both must be ignored once the gate trips.
UNION='['"$(make_pr_union 10 "10-verify-me" "2024-01-01T00:00:00Z" "true" "$NO_LABELS" "$FAILING_ROLLUP")"']'
setup_union_pr_list "$UNION"
printf '[{"number":55,"createdAt":"2024-01-01T00:00:00Z"}]\n' > "$STUB_DIR/issue-list.json"
printf 'worktree /repo\nHEAD abc123\n\n' > "$STUB_DIR/worktree-list.txt"
printf '{"sha":"mainhead0"}' > "$STUB_DIR/main-commit.json"
printf '{"check_runs":[{"status":"completed","conclusion":"failure"}]}' \
  > "$STUB_DIR/main-check-runs.json"
printf '[]' > "$STUB_DIR/main-run-list.json"
result=$("$TMPDIR_TEST/dispatch-select-target")
assert_eq "main failing check-run → main-broken (ladder skipped)" "main-broken mainhead0" "$result"
teardown

# 23. main failing workflow run → main-broken.
echo "Test: main failing workflow run → main-broken"
setup
UNION='['"$(make_pr_union 10 "10-verify-me" "2024-01-01T00:00:00Z" "true" "$NO_LABELS" "$FAILING_ROLLUP")"']'
setup_union_pr_list "$UNION"
echo '[]' > "$STUB_DIR/issue-list.json"
printf 'worktree /repo\nHEAD abc123\n\n' > "$STUB_DIR/worktree-list.txt"
printf '{"sha":"mainhead0"}' > "$STUB_DIR/main-commit.json"
printf '{"check_runs":[]}' > "$STUB_DIR/main-check-runs.json"
printf '[{"headSha":"mainhead0","conclusion":"failure"}]' \
  > "$STUB_DIR/main-run-list.json"
result=$("$TMPDIR_TEST/dispatch-select-target")
assert_eq "main failing workflow run → main-broken" "main-broken mainhead0" "$result"
teardown

# 24. main in-progress checks → gate not tripped, normal selection.
echo "Test: main in-progress checks → not tripped"
setup
UNION='['"$(make_pr_union 10 "10-verify-me" "2024-01-01T00:00:00Z" "true" "$NO_LABELS" "$FAILING_ROLLUP")"']'
setup_union_pr_list "$UNION"
echo '[]' > "$STUB_DIR/issue-list.json"
printf 'worktree /repo\nHEAD abc123\n\n' > "$STUB_DIR/worktree-list.txt"
printf '{"sha":"mainhead0"}' > "$STUB_DIR/main-commit.json"
printf '{"check_runs":[{"status":"in_progress","conclusion":null}]}' \
  > "$STUB_DIR/main-check-runs.json"
printf '[{"headSha":"mainhead0","conclusion":null}]' \
  > "$STUB_DIR/main-run-list.json"
result=$("$TMPDIR_TEST/dispatch-select-target")
assert_eq "main in-progress → normal selection (verify PR)" "pr 10 10-verify-me verify" "$result"
teardown

# 25. Failing workflow run on a stale SHA → gate not tripped (headSha filter).
echo "Test: main failing run on stale SHA → not tripped"
setup
UNION='['"$(make_pr_union 10 "10-verify-me" "2024-01-01T00:00:00Z" "true" "$NO_LABELS" "$FAILING_ROLLUP")"']'
setup_union_pr_list "$UNION"
echo '[]' > "$STUB_DIR/issue-list.json"
printf 'worktree /repo\nHEAD abc123\n\n' > "$STUB_DIR/worktree-list.txt"
printf '{"sha":"mainhead0"}' > "$STUB_DIR/main-commit.json"
printf '{"check_runs":[]}' > "$STUB_DIR/main-check-runs.json"
printf '[{"headSha":"oldsha99","conclusion":"failure"}]' \
  > "$STUB_DIR/main-run-list.json"
result=$("$TMPDIR_TEST/dispatch-select-target")
assert_eq "main failing run on stale SHA → normal selection (verify PR)" "pr 10 10-verify-me verify" "$result"
teardown

# 26. --qa mode bypasses the gate even when main is broken.
echo "Test: --qa mode bypasses the main-CI gate"
setup
UNION='['"$(make_pr_union 20 "20-qa-me" "2024-01-01T00:00:00Z" "true" "$NO_LABELS" "$GREEN_ROLLUP")"']'
setup_union_pr_list "$UNION"
echo '[]' > "$STUB_DIR/issue-list.json"
printf 'worktree /repo\nHEAD abc123\n\n' > "$STUB_DIR/worktree-list.txt"
printf '{"sha":"mainhead0"}' > "$STUB_DIR/main-commit.json"
printf '{"check_runs":[{"status":"completed","conclusion":"failure"}]}' \
  > "$STUB_DIR/main-check-runs.json"
printf '[]' > "$STUB_DIR/main-run-list.json"
result=$("$TMPDIR_TEST/dispatch-select-target" --qa)
assert_eq "--qa mode bypasses gate → QA PR returned" "pr 20 20-qa-me" "$result"
teardown

# 27. Current-worktree continuation bypasses the gate even when main is broken.
echo "Test: worktree continuation bypasses the main-CI gate"
setup
setup_union_pr_list '[]'
echo '[]' > "$STUB_DIR/issue-list.json"
printf 'worktree /repo\nHEAD abc123\n\n' > "$STUB_DIR/worktree-list.txt"
printf '42-some-slug' > "$STUB_DIR/current-branch.txt"
printf '{"state":"OPEN"}' > "$STUB_DIR/issue-state-42.json"
printf '{"sha":"mainhead0"}' > "$STUB_DIR/main-commit.json"
printf '{"check_runs":[{"status":"completed","conclusion":"failure"}]}' \
  > "$STUB_DIR/main-check-runs.json"
printf '[]' > "$STUB_DIR/main-run-list.json"
result=$("$TMPDIR_TEST/dispatch-select-target")
assert_eq "worktree continuation bypasses gate → worktree 42 42-some-slug" "worktree 42 42-some-slug" "$result"
teardown

# 28. Selecting a target issues exactly one gh pr list call (down from 1 + N).
echo "Test: dispatch-select-target fetches the open-PR list once"
setup
UNION='['
UNION+="$(make_pr_union 10 "10-verify" "2024-01-01T00:00:00Z" "true" "$NO_LABELS" "$FAILING_ROLLUP")"','
UNION+="$(make_pr_union 20 "20-qa" "2024-01-02T00:00:00Z" "true" "$NO_LABELS" "$GREEN_ROLLUP")"','
UNION+="$(make_pr_union 30 "30-waiting" "2024-01-03T00:00:00Z" "true" "$NO_LABELS" "$PENDING_ROLLUP")"
UNION+=']'
setup_union_pr_list "$UNION"
echo '[]' > "$STUB_DIR/issue-list.json"
printf 'worktree /repo\nHEAD abc123\n\n' > "$STUB_DIR/worktree-list.txt"
result=$("$TMPDIR_TEST/dispatch-select-target")
assert_eq "select-target result over 3 PRs" "pr 10 10-verify verify" "$result"
count=$(wc -l < "$STUB_DIR/gh-pr-list-calls.log" | tr -d ' ')
assert_eq "exactly one gh pr list call regardless of PR count" "1" "$count"
teardown

# 22. A simplify-phase PR winning emits the simplify phase on the result line.
echo "Test: simplify PR winner → pr <n> <branch> simplify"
setup
SIMPLIFY_LABELS='[{"name":"dispatch:qa-done"}]'
UNION='['"$(make_pr_union 25 "25-simplify-me" "2024-01-01T00:00:00Z" "true" "$SIMPLIFY_LABELS" "$GREEN_ROLLUP")"']'
setup_union_pr_list "$UNION"
echo '[]' > "$STUB_DIR/issue-list.json"
printf 'worktree /repo\nHEAD abc123\n\n' > "$STUB_DIR/worktree-list.txt"
result=$("$TMPDIR_TEST/dispatch-select-target")
assert_eq "simplify PR winner emits phase" "pr 25 25-simplify-me simplify" "$result"
teardown

# 23. A lone QA PR with no help-wanted issue emits the qa phase on the result line.
echo "Test: QA PR, no issue → pr <n> <branch> qa"
setup
UNION='['"$(make_pr_union 35 "35-qa-me" "2024-01-01T00:00:00Z" "true" "$NO_LABELS" "$GREEN_ROLLUP")"']'
setup_union_pr_list "$UNION"
echo '[]' > "$STUB_DIR/issue-list.json"
printf 'worktree /repo\nHEAD abc123\n\n' > "$STUB_DIR/worktree-list.txt"
result=$("$TMPDIR_TEST/dispatch-select-target")
assert_eq "QA PR (no issue) emits qa phase" "pr 35 35-qa-me qa" "$result"
teardown

# 24. Help-wanted issue with a worktree is skipped; the next-oldest issue is chosen.
echo "Test: issue with worktree skipped; next-oldest issue chosen"
setup
setup_union_pr_list '[]'
# Issue 55 is older, issue 66 is newer. Issue 55 has a 55-* worktree.
printf '[{"number":55,"createdAt":"2024-01-01T00:00:00Z"},{"number":66,"createdAt":"2024-01-02T00:00:00Z"}]\n' \
  > "$STUB_DIR/issue-list.json"
printf 'worktree /repo\nHEAD abc123\n\nworktree /worktrees/55-some-feature\nHEAD def456\nbranch refs/heads/55-some-feature\n\n' \
  > "$STUB_DIR/worktree-list.txt"
result=$("$TMPDIR_TEST/dispatch-select-target")
assert_eq "issue with worktree skipped; next issue 66 chosen" "issue 66" "$result"
teardown

# 25. A lone help-wanted issue that has a worktree → empty (nothing else queued).
echo "Test: lone worktree'd issue → empty"
setup
setup_union_pr_list '[]'
printf '[{"number":55,"createdAt":"2024-01-01T00:00:00Z"}]\n' > "$STUB_DIR/issue-list.json"
printf 'worktree /repo\nHEAD abc123\n\nworktree /worktrees/55-some-feature\nHEAD def456\nbranch refs/heads/55-some-feature\n\n' \
  > "$STUB_DIR/worktree-list.txt"
result=$("$TMPDIR_TEST/dispatch-select-target")
assert_eq "lone worktree'd issue → empty" "empty" "$result"
teardown

# 26. Worktree'd issue skipped; QA PR is next in line.
echo "Test: worktree'd issue skipped → QA PR selected"
setup
UNION='['"$(make_pr_union 20 "20-qa" "2024-01-01T00:00:00Z" "true" "$NO_LABELS" "$GREEN_ROLLUP")"']'
setup_union_pr_list "$UNION"
# The help-wanted issue would normally beat the QA PR, but it has a worktree.
printf '[{"number":55,"createdAt":"2024-01-01T00:00:00Z"}]\n' > "$STUB_DIR/issue-list.json"
printf 'worktree /repo\nHEAD abc123\n\nworktree /worktrees/55-some-feature\nHEAD def456\nbranch refs/heads/55-some-feature\n\n' \
  > "$STUB_DIR/worktree-list.txt"
result=$("$TMPDIR_TEST/dispatch-select-target")
assert_eq "worktree'd issue skipped → QA PR returned" "pr 20 20-qa qa" "$result"
teardown

# 27. Prefix disambiguation: issue 6 is NOT masked by an unrelated worktree on branch 60-foo.
echo "Test: issue 6 not masked by worktree on branch 60-foo"
setup
setup_union_pr_list '[]'
printf '[{"number":6,"createdAt":"2024-01-01T00:00:00Z"}]\n' > "$STUB_DIR/issue-list.json"
# Worktree exists for 60-foo, not for 6-*.
printf 'worktree /repo\nHEAD abc123\n\nworktree /worktrees/60-foo\nHEAD def456\nbranch refs/heads/60-foo\n\n' \
  > "$STUB_DIR/worktree-list.txt"
result=$("$TMPDIR_TEST/dispatch-select-target")
assert_eq "issue 6 not masked by 60-foo worktree" "issue 6" "$result"
teardown

# ============================================================================
# dispatch-trace-leaf tests
# ============================================================================
echo ""
echo "=== dispatch-trace-leaf ==="

# 1. No children → prints self.
echo "Test: no children → prints self"
setup
# No stub files means no blockers and no sub-issues.
result=$("$TMPDIR_TEST/dispatch-trace-leaf" "100")
assert_eq "no children → self (100)" "100" "$result"
teardown

# 2. Single blocker chain: 100 → 101 → 102 (leaf).
echo "Test: single blocker chain → deepest leaf"
setup
printf '[{"number":101}]\n' > "$STUB_DIR/blockers-100.json"
printf '[{"number":102}]\n' > "$STUB_DIR/blockers-101.json"
# 102 has no blockers or sub-issues → leaf.
printf '{"title":"Issue 101","body":"","comments":[],"number":101,"state":"OPEN"}\n' \
  > "$STUB_DIR/issue-101.json"
printf '{"title":"Issue 102","body":"","comments":[],"number":102,"state":"OPEN"}\n' \
  > "$STUB_DIR/issue-102.json"
result=$("$TMPDIR_TEST/dispatch-trace-leaf" "100")
assert_eq "blocker chain 100→101→102 → leaf 102" "102" "$result"
teardown

# 3. Multiple children → lowest-numbered leaf.
echo "Test: multiple children → lowest-numbered leaf"
setup
# 100 has sub-issues 200 and 201. 200 has no children (leaf), 201 has no children (leaf).
printf '[{"number":200},{"number":201}]\n' > "$STUB_DIR/subissues-100.json"
printf '{"title":"Issue 200","body":"","comments":[],"number":200,"state":"OPEN"}\n' \
  > "$STUB_DIR/issue-200.json"
printf '{"title":"Issue 201","body":"","comments":[],"number":201,"state":"OPEN"}\n' \
  > "$STUB_DIR/issue-201.json"
result=$("$TMPDIR_TEST/dispatch-trace-leaf" "100")
assert_eq "multiple children → lowest leaf (200)" "200" "$result"
teardown

# 4. Closed children are ignored.
echo "Test: closed children are ignored"
setup
# 100 has sub-issues 300 (closed) and 301 (open).
printf '[{"number":300},{"number":301}]\n' > "$STUB_DIR/subissues-100.json"
printf '{"title":"Issue 300","body":"","comments":[],"number":300,"state":"CLOSED"}\n' \
  > "$STUB_DIR/issue-300.json"
printf '{"title":"Issue 301","body":"","comments":[],"number":301,"state":"OPEN"}\n' \
  > "$STUB_DIR/issue-301.json"
result=$("$TMPDIR_TEST/dispatch-trace-leaf" "100")
assert_eq "closed children ignored → open leaf 301" "301" "$result"
teardown

# 5. All children closed → issue itself is a leaf.
echo "Test: all children closed → prints self"
setup
printf '[{"number":400}]\n' > "$STUB_DIR/subissues-100.json"
printf '{"title":"Issue 400","body":"","comments":[],"number":400,"state":"CLOSED"}\n' \
  > "$STUB_DIR/issue-400.json"
result=$("$TMPDIR_TEST/dispatch-trace-leaf" "100")
assert_eq "all children closed → self (100)" "100" "$result"
teardown

# 6. Cycle → falls back to N.
echo "Test: cycle → falls back to N"
setup
# 100 → sub 500, 500 → sub 100 (cycle).
printf '[{"number":500}]\n' > "$STUB_DIR/subissues-100.json"
printf '[{"number":100}]\n' > "$STUB_DIR/subissues-500.json"
printf '{"title":"Issue 500","body":"","comments":[],"number":500,"state":"OPEN"}\n' \
  > "$STUB_DIR/issue-500.json"
result=$("$TMPDIR_TEST/dispatch-trace-leaf" "100")
assert_eq "cycle → fallback to N (100)" "100" "$result"
teardown

# 7. Sub-issues via issue-sub-issues path.
echo "Test: sub-issues chain"
setup
printf '[{"number":601}]\n' > "$STUB_DIR/subissues-600.json"
printf '{"title":"Issue 601","body":"","comments":[],"number":601,"state":"OPEN"}\n' \
  > "$STUB_DIR/issue-601.json"
result=$("$TMPDIR_TEST/dispatch-trace-leaf" "600")
assert_eq "sub-issues chain 600→601 → leaf 601" "601" "$result"
teardown

# ============================================================================
# dispatch-complete-phase tests
# ============================================================================
echo ""
echo "=== dispatch-complete-phase ==="

# Reports whether the gh stub recorded a `gh label create` call.
label_create_state() {
  [[ -f "$STUB_DIR/gh-label-create.log" ]] && echo "present" || echo "absent"
}

# 1-4. Phase → label mapping. The label already exists (default stub mode), so
# the script applies it with a single `gh pr edit` and issues no `gh label create`.
echo "Test: qa → dispatch:qa-done (apply only, no label create)"
setup
"$TMPDIR_TEST/dispatch-complete-phase" 21 qa
assert_eq "qa applies dispatch:qa-done" \
  "pr edit 21 --add-label dispatch:qa-done" "$(cat "$STUB_DIR/gh-pr-edit.log")"
assert_eq "qa: no gh label create when label exists" "absent" "$(label_create_state)"
teardown

echo "Test: review → dispatch:reviewed (apply only, no label create)"
setup
"$TMPDIR_TEST/dispatch-complete-phase" 30 review
assert_eq "review applies dispatch:reviewed" \
  "pr edit 30 --add-label dispatch:reviewed" "$(cat "$STUB_DIR/gh-pr-edit.log")"
assert_eq "review: no gh label create when label exists" "absent" "$(label_create_state)"
teardown

echo "Test: security → dispatch:security-reviewed (apply only, no label create)"
setup
"$TMPDIR_TEST/dispatch-complete-phase" 40 security
assert_eq "security applies dispatch:security-reviewed" \
  "pr edit 40 --add-label dispatch:security-reviewed" "$(cat "$STUB_DIR/gh-pr-edit.log")"
assert_eq "security: no gh label create when label exists" "absent" "$(label_create_state)"
teardown

# 5. Label missing: the apply fails "not found", so the script creates the
#    label (BFD4F2, "dispatch workflow: <suffix> phase complete") and retries.
echo "Test: label missing → create then retry"
setup
echo "label-missing" > "$STUB_DIR/pr-edit-mode"
"$TMPDIR_TEST/dispatch-complete-phase" 30 review
assert_eq "label-missing: label created with workflow description" \
  "label create dispatch:reviewed --color BFD4F2 --description dispatch workflow: reviewed phase complete" \
  "$(cat "$STUB_DIR/gh-label-create.log")"
assert_eq "label-missing: label applied on retry" \
  "pr edit 30 --add-label dispatch:reviewed" "$(cat "$STUB_DIR/gh-pr-edit.log")"
teardown

# 6. An apply failure unrelated to a missing label exits non-zero and creates
#    no label.
echo "Test: other apply failure → non-zero exit, no label create"
setup
echo "other-failure" > "$STUB_DIR/pr-edit-mode"
if "$TMPDIR_TEST/dispatch-complete-phase" 40 security 2>/dev/null; then rc=0; else rc=$?; fi
assert_eq "other apply failure exits non-zero" "1" "$rc"
assert_eq "other failure: no spurious label create" "absent" "$(label_create_state)"
teardown

# 7. Unknown phase → non-zero exit.
echo "Test: unknown phase → non-zero exit"
setup
if "$TMPDIR_TEST/dispatch-complete-phase" 25 bogus 2>/dev/null; then rc=0; else rc=$?; fi
assert_eq "unknown phase exits non-zero" "1" "$rc"
teardown

# 8. Missing phase arg → non-zero exit.
echo "Test: missing args → non-zero exit"
setup
if "$TMPDIR_TEST/dispatch-complete-phase" 25 2>/dev/null; then rc=0; else rc=$?; fi
assert_eq "missing phase arg exits non-zero" "1" "$rc"
teardown

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

# 1. Current branch is <N>-* → here (mode-independent).
echo "Test: current branch <N>-* → here (both modes)"
setup
echo "42-my-feature" > "$STUB_DIR/current-branch.txt"
result=$("$TMPDIR_TEST/dispatch-resolve-worktree" 42 explicit)
assert_eq "current branch <N>-* → here (explicit)" "here" "$result"
result=$("$TMPDIR_TEST/dispatch-resolve-worktree" 42 queue)
assert_eq "current branch <N>-* → here (queue)" "here" "$result"
teardown

# 2. explicit mode + an existing <N>-* worktree → enter <path>.
echo "Test: explicit + existing <N>-* worktree → enter"
setup
printf '%s' "$WORKTREE_LIST_42" > "$STUB_DIR/worktree-list.txt"
result=$("$TMPDIR_TEST/dispatch-resolve-worktree" 42 explicit)
assert_eq "explicit + existing worktree → enter <path>" \
  "enter /worktrees/42-my-feature" "$result"
teardown

# 3. queue mode + the same worktree setup → conflict <path>. Acceptance
#    criterion 3: same target, explicit → enter, queue → conflict.
echo "Test: queue + existing <N>-* worktree → conflict"
setup
printf '%s' "$WORKTREE_LIST_42" > "$STUB_DIR/worktree-list.txt"
result=$("$TMPDIR_TEST/dispatch-resolve-worktree" 42 queue)
assert_eq "queue + existing worktree → conflict <path>" \
  "conflict /worktrees/42-my-feature" "$result"
teardown

# 4. No matching worktree → create <N>-<slug> from the issue title.
echo "Test: no worktree → create <N>-<slug>"
setup
echo '{"title":"Add a feature"}' > "$STUB_DIR/issue-title-42.json"
result=$("$TMPDIR_TEST/dispatch-resolve-worktree" 42 explicit)
assert_eq "no worktree → create <N>-<slug>" "create 42-add-a-feature" "$result"
teardown

# 5. Sanitization: uppercase, punctuation, and leading/trailing spaces collapse
#    to a lowercase dash-joined slug.
echo "Test: title sanitization → create"
setup
printf '{"title":"  Fix: The Foo/Bar Widget!  "}' > "$STUB_DIR/issue-title-7.json"
result=$("$TMPDIR_TEST/dispatch-resolve-worktree" 7 explicit)
assert_eq "messy title sanitized → create" "create 7-fix-the-foo-bar-widget" "$result"
teardown

# 6. Truncation: a long title yields a branch <= 32 chars matching the
#    WorktreeCreate hook form (acceptance criterion 2).
echo "Test: long title truncated to <= 32-char branch → create"
setup
echo '{"title":"Extract the worktree resolution logic into a dedicated script"}' \
  > "$STUB_DIR/issue-title-656.json"
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

# 7. here precedence: current branch <N>-* wins even when a matching worktree
#    also exists — the here check fires before the worktree scan.
echo "Test: here precedence over a matching worktree"
setup
echo "42-my-feature" > "$STUB_DIR/current-branch.txt"
printf '%s' "$WORKTREE_LIST_42" > "$STUB_DIR/worktree-list.txt"
result=$("$TMPDIR_TEST/dispatch-resolve-worktree" 42 explicit)
assert_eq "here wins over a matching worktree" "here" "$result"
teardown

# 8. A non-matching worktree (different issue) → create.
echo "Test: only a non-matching worktree → create"
setup
printf 'worktree /repo\nHEAD abc123\nbranch refs/heads/main\n\nworktree /worktrees/99-other\nHEAD def456\nbranch refs/heads/99-other\n\n' \
  > "$STUB_DIR/worktree-list.txt"
echo '{"title":"My Task"}' > "$STUB_DIR/issue-title-42.json"
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
echo '{"title":"!!!"}' > "$STUB_DIR/issue-title-42.json"
if "$TMPDIR_TEST/dispatch-resolve-worktree" 42 explicit 2>/dev/null; then rc=0; else rc=$?; fi
assert_eq "empty-slug title exits non-zero" "1" "$rc"
teardown

# ============================================================================
# summary
# ============================================================================
report_results
