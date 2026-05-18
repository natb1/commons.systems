#!/usr/bin/env bash
# Unit-test suite for dispatch-phase, dispatch-select-target, dispatch-trace-leaf.
# Uses PATH shims to fake gh and git — no network required.
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
  chmod +x "$TMPDIR_TEST/dispatch-phase" \
           "$TMPDIR_TEST/dispatch-select-target" \
           "$TMPDIR_TEST/dispatch-trace-leaf"

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
    if [[ -f "$STUB_DIR/pr-list-full.json" ]]; then
      cat "$STUB_DIR/pr-list-full.json"
    else
      echo "[]"
    fi
    ;;
  "pr list --state open --json number,createdAt,headRefName")
    if [[ -f "$STUB_DIR/pr-list-brief.json" ]]; then
      cat "$STUB_DIR/pr-list-brief.json"
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

# Helper to build a PR JSON entry for the brief PR list (dispatch-select-target).
make_pr_brief() {
  local num="$1" branch="$2" created="$3"
  printf '{"number":%s,"headRefName":"%s","createdAt":"%s"}' "$num" "$branch" "$created"
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

# 9. Draft + green + dispatch:security-reviewed → ready
echo "Test: draft + green + dispatch:security-reviewed → ready"
setup
printf '[%s]\n' "$(make_pr 10 "42-my-feature" "true" '[{"name":"dispatch:security-reviewed"}]' "$GREEN_ROLLUP")" \
  > "$STUB_DIR/pr-list-full.json"
result=$("$TMPDIR_TEST/dispatch-phase" "42")
assert_eq "draft + green + dispatch:security-reviewed → ready" "ready" "$result"
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

# ============================================================================
# dispatch-select-target tests
# ============================================================================
echo ""
echo "=== dispatch-select-target ==="

# For dispatch-select-target we need both the brief PR list (for enumeration)
# and the full PR list (for dispatch-phase calls).

setup_both_pr_lists() {
  local full_json="$1"
  local brief_json="$2"
  printf '%s\n' "$full_json" > "$STUB_DIR/pr-list-full.json"
  printf '%s\n' "$brief_json" > "$STUB_DIR/pr-list-brief.json"
}

# 1. A non-QA PR is chosen over a QA PR and a help-wanted issue.
echo "Test: non-QA PR beats QA PR and issue"
setup
# PR 10 in verify phase (no CI green), PR 20 in qa phase (CI green, no label).
FULL='['"$(make_pr 10 "10-verify-me" "true" "$NO_LABELS" "$FAILING_ROLLUP")"','"$(make_pr 20 "20-qa-me" "true" "$NO_LABELS" "$GREEN_ROLLUP")"']'
BRIEF='['"$(make_pr_brief 10 "10-verify-me" "2024-01-01T00:00:00Z")"','"$(make_pr_brief 20 "20-qa-me" "2024-01-02T00:00:00Z")"']'
setup_both_pr_lists "$FULL" "$BRIEF"
printf '[{"number":99,"createdAt":"2024-01-01T00:00:00Z"}]\n' > "$STUB_DIR/issue-list.json"
# No worktrees for these branches.
printf 'worktree /repo\nHEAD abc123\n\n' > "$STUB_DIR/worktree-list.txt"
result=$("$TMPDIR_TEST/dispatch-select-target")
assert_eq "non-QA PR (verify) chosen first" "pr 10 10-verify-me" "$result"
teardown

# 2. PR with a local worktree is skipped.
echo "Test: PR whose branch has a worktree is skipped"
setup
FULL='['"$(make_pr 10 "10-active-branch" "true" "$NO_LABELS" "$FAILING_ROLLUP")"','"$(make_pr 20 "20-other" "true" "$NO_LABELS" "$FAILING_ROLLUP")"']'
BRIEF='['"$(make_pr_brief 10 "10-active-branch" "2024-01-01T00:00:00Z")"','"$(make_pr_brief 20 "20-other" "2024-01-02T00:00:00Z")"']'
setup_both_pr_lists "$FULL" "$BRIEF"
echo '[]' > "$STUB_DIR/issue-list.json"
# Worktree exists for branch 10-active-branch.
printf 'worktree /repo\nHEAD abc123\nbranch refs/heads/10-active-branch\n\nworktree /worktrees/10-active-branch\nHEAD def456\nbranch refs/heads/10-active-branch\n\n' \
  > "$STUB_DIR/worktree-list.txt"
result=$("$TMPDIR_TEST/dispatch-select-target")
assert_eq "PR with worktree skipped; next PR returned" "pr 20 20-other" "$result"
teardown

# 3. When no eligible PR exists, a help-wanted issue is chosen.
echo "Test: no eligible PR → help-wanted issue"
setup
echo '[]' > "$STUB_DIR/pr-list-full.json"
echo '[]' > "$STUB_DIR/pr-list-brief.json"
printf '[{"number":55,"createdAt":"2024-03-01T00:00:00Z"}]\n' > "$STUB_DIR/issue-list.json"
printf 'worktree /repo\nHEAD abc123\n\n' > "$STUB_DIR/worktree-list.txt"
result=$("$TMPDIR_TEST/dispatch-select-target")
assert_eq "no PR → help-wanted issue" "issue 55" "$result"
teardown

# 4. --qa mode returns only QA PRs.
echo "Test: --qa mode returns QA PR"
setup
FULL='['"$(make_pr 10 "10-verify-me" "true" "$NO_LABELS" "$FAILING_ROLLUP")"','"$(make_pr 20 "20-qa-me" "true" "$NO_LABELS" "$GREEN_ROLLUP")"']'
BRIEF='['"$(make_pr_brief 20 "20-qa-me" "2024-01-02T00:00:00Z")"','"$(make_pr_brief 10 "10-verify-me" "2024-01-01T00:00:00Z")"']'
setup_both_pr_lists "$FULL" "$BRIEF"
echo '[]' > "$STUB_DIR/issue-list.json"
printf 'worktree /repo\nHEAD abc123\n\n' > "$STUB_DIR/worktree-list.txt"
result=$("$TMPDIR_TEST/dispatch-select-target" --qa)
assert_eq "--qa mode returns QA PR" "pr 20 20-qa-me" "$result"
teardown

# 5. Nothing eligible → empty.
echo "Test: nothing eligible → empty"
setup
echo '[]' > "$STUB_DIR/pr-list-full.json"
echo '[]' > "$STUB_DIR/pr-list-brief.json"
echo '[]' > "$STUB_DIR/issue-list.json"
printf 'worktree /repo\nHEAD abc123\n\n' > "$STUB_DIR/worktree-list.txt"
result=$("$TMPDIR_TEST/dispatch-select-target")
assert_eq "nothing eligible → empty" "empty" "$result"
teardown

# 6. --qa mode with no QA PR → empty (ignores help-wanted issues).
echo "Test: --qa mode with no QA PR → empty"
setup
echo '[]' > "$STUB_DIR/pr-list-full.json"
echo '[]' > "$STUB_DIR/pr-list-brief.json"
printf '[{"number":77,"createdAt":"2024-01-01T00:00:00Z"}]\n' > "$STUB_DIR/issue-list.json"
printf 'worktree /repo\nHEAD abc123\n\n' > "$STUB_DIR/worktree-list.txt"
result=$("$TMPDIR_TEST/dispatch-select-target" --qa)
assert_eq "--qa mode no QA PR → empty" "empty" "$result"
teardown

# 7. All PRs done → falls through to help-wanted issue.
echo "Test: all PRs done → help-wanted issue"
setup
FULL='['"$(make_pr 10 "10-done-pr" "false" "$NO_LABELS" "$GREEN_ROLLUP")"']'
BRIEF='['"$(make_pr_brief 10 "10-done-pr" "2024-01-01T00:00:00Z")"']'
setup_both_pr_lists "$FULL" "$BRIEF"
printf '[{"number":33,"createdAt":"2024-01-01T00:00:00Z"}]\n' > "$STUB_DIR/issue-list.json"
printf 'worktree /repo\nHEAD abc123\n\n' > "$STUB_DIR/worktree-list.txt"
result=$("$TMPDIR_TEST/dispatch-select-target")
assert_eq "done PRs skipped; help-wanted issue returned" "issue 33" "$result"
teardown

# 8. ready beats security beats review beats simplify beats verify.
echo "Test: ready beats security beats review beats simplify beats verify"
setup
# Five PRs, each in a different phase. verify (PR 10) is oldest, ready (PR 50) is newest.
# The ready-phase PR must be chosen regardless of age.
READY_LABELS='[{"name":"dispatch:security-reviewed"}]'
SECURITY_LABELS='[{"name":"dispatch:reviewed"}]'
REVIEW_LABELS='[{"name":"dispatch:refactored"}]'
SIMPLIFY_LABELS='[{"name":"dispatch:qa-done"}]'
FULL='['
FULL+="$(make_pr 10 "10-verify" "true" "$NO_LABELS" "$FAILING_ROLLUP")"','
FULL+="$(make_pr 20 "20-simplify" "true" "$SIMPLIFY_LABELS" "$GREEN_ROLLUP")"','
FULL+="$(make_pr 30 "30-review" "true" "$REVIEW_LABELS" "$GREEN_ROLLUP")"','
FULL+="$(make_pr 40 "40-security" "true" "$SECURITY_LABELS" "$GREEN_ROLLUP")"','
FULL+="$(make_pr 50 "50-ready" "true" "$READY_LABELS" "$GREEN_ROLLUP")"
FULL+=']'
BRIEF='['
BRIEF+="$(make_pr_brief 10 "10-verify" "2024-01-01T00:00:00Z")"','
BRIEF+="$(make_pr_brief 20 "20-simplify" "2024-01-02T00:00:00Z")"','
BRIEF+="$(make_pr_brief 30 "30-review" "2024-01-03T00:00:00Z")"','
BRIEF+="$(make_pr_brief 40 "40-security" "2024-01-04T00:00:00Z")"','
BRIEF+="$(make_pr_brief 50 "50-ready" "2024-01-05T00:00:00Z")"
BRIEF+=']'
setup_both_pr_lists "$FULL" "$BRIEF"
echo '[]' > "$STUB_DIR/issue-list.json"
printf 'worktree /repo\nHEAD abc123\n\n' > "$STUB_DIR/worktree-list.txt"
result=$("$TMPDIR_TEST/dispatch-select-target")
assert_eq "ready beats security/review/simplify/verify" "pr 50 50-ready" "$result"
teardown

# 9. security beats review beats simplify beats verify (no ready PR).
echo "Test: security beats review/simplify/verify"
setup
SECURITY_LABELS='[{"name":"dispatch:reviewed"}]'
REVIEW_LABELS='[{"name":"dispatch:refactored"}]'
SIMPLIFY_LABELS='[{"name":"dispatch:qa-done"}]'
FULL='['
FULL+="$(make_pr 10 "10-verify" "true" "$NO_LABELS" "$FAILING_ROLLUP")"','
FULL+="$(make_pr 20 "20-simplify" "true" "$SIMPLIFY_LABELS" "$GREEN_ROLLUP")"','
FULL+="$(make_pr 30 "30-review" "true" "$REVIEW_LABELS" "$GREEN_ROLLUP")"','
FULL+="$(make_pr 40 "40-security" "true" "$SECURITY_LABELS" "$GREEN_ROLLUP")"
FULL+=']'
BRIEF='['
BRIEF+="$(make_pr_brief 10 "10-verify" "2024-01-01T00:00:00Z")"','
BRIEF+="$(make_pr_brief 20 "20-simplify" "2024-01-02T00:00:00Z")"','
BRIEF+="$(make_pr_brief 30 "30-review" "2024-01-03T00:00:00Z")"','
BRIEF+="$(make_pr_brief 40 "40-security" "2024-01-04T00:00:00Z")"
BRIEF+=']'
setup_both_pr_lists "$FULL" "$BRIEF"
echo '[]' > "$STUB_DIR/issue-list.json"
printf 'worktree /repo\nHEAD abc123\n\n' > "$STUB_DIR/worktree-list.txt"
result=$("$TMPDIR_TEST/dispatch-select-target")
assert_eq "security beats review/simplify/verify" "pr 40 40-security" "$result"
teardown

# 10. Within one phase, the oldest PR wins.
echo "Test: within same phase, oldest PR wins"
setup
# Two review-phase PRs; PR 30 is older.
REVIEW_LABELS='[{"name":"dispatch:refactored"}]'
FULL='['
FULL+="$(make_pr 30 "30-review-a" "true" "$REVIEW_LABELS" "$GREEN_ROLLUP")"','
FULL+="$(make_pr 31 "31-review-b" "true" "$REVIEW_LABELS" "$GREEN_ROLLUP")"
FULL+=']'
BRIEF='['
BRIEF+="$(make_pr_brief 30 "30-review-a" "2024-01-01T00:00:00Z")"','
BRIEF+="$(make_pr_brief 31 "31-review-b" "2024-01-02T00:00:00Z")"
BRIEF+=']'
setup_both_pr_lists "$FULL" "$BRIEF"
echo '[]' > "$STUB_DIR/issue-list.json"
printf 'worktree /repo\nHEAD abc123\n\n' > "$STUB_DIR/worktree-list.txt"
result=$("$TMPDIR_TEST/dispatch-select-target")
assert_eq "oldest review PR wins within phase" "pr 30 30-review-a" "$result"
teardown

# 11. Any non-QA PR beats a help-wanted issue; help-wanted issue beats a QA PR.
echo "Test: verify PR beats issue; issue beats QA PR"
setup
# verify PR (10), QA PR (20), help-wanted issue (55).
FULL='['
FULL+="$(make_pr 10 "10-verify" "true" "$NO_LABELS" "$FAILING_ROLLUP")"','
FULL+="$(make_pr 20 "20-qa" "true" "$NO_LABELS" "$GREEN_ROLLUP")"
FULL+=']'
BRIEF='['
BRIEF+="$(make_pr_brief 10 "10-verify" "2024-01-01T00:00:00Z")"','
BRIEF+="$(make_pr_brief 20 "20-qa" "2024-01-02T00:00:00Z")"
BRIEF+=']'
setup_both_pr_lists "$FULL" "$BRIEF"
printf '[{"number":55,"createdAt":"2024-01-01T00:00:00Z"}]\n' > "$STUB_DIR/issue-list.json"
printf 'worktree /repo\nHEAD abc123\n\n' > "$STUB_DIR/worktree-list.txt"
result=$("$TMPDIR_TEST/dispatch-select-target")
assert_eq "verify PR beats issue (non-QA > issue > qa)" "pr 10 10-verify" "$result"
teardown

# 11b. No non-QA PR: help-wanted issue beats QA PR.
echo "Test: help-wanted issue beats QA PR"
setup
FULL='['"$(make_pr 20 "20-qa" "true" "$NO_LABELS" "$GREEN_ROLLUP")"']'
BRIEF='['"$(make_pr_brief 20 "20-qa" "2024-01-02T00:00:00Z")"']'
setup_both_pr_lists "$FULL" "$BRIEF"
printf '[{"number":55,"createdAt":"2024-01-01T00:00:00Z"}]\n' > "$STUB_DIR/issue-list.json"
printf 'worktree /repo\nHEAD abc123\n\n' > "$STUB_DIR/worktree-list.txt"
result=$("$TMPDIR_TEST/dispatch-select-target")
assert_eq "help-wanted issue beats QA PR" "issue 55" "$result"
teardown

# 11c. A help-wanted issue with a local worktree is skipped; next issue chosen.
echo "Test: help-wanted issue with worktree skipped; next issue chosen"
setup
echo '[]' > "$STUB_DIR/pr-list-full.json"
echo '[]' > "$STUB_DIR/pr-list-brief.json"
printf '[{"number":50,"createdAt":"2024-01-01T00:00:00Z"},{"number":51,"createdAt":"2024-01-02T00:00:00Z"}]\n' \
  > "$STUB_DIR/issue-list.json"
# Worktree exists for issue 50 (branch 50-some-slug) — a session owns it.
printf 'worktree /repo\nHEAD abc123\n\nworktree /worktrees/50-some-slug\nHEAD def456\nbranch refs/heads/50-some-slug\n\n' \
  > "$STUB_DIR/worktree-list.txt"
result=$("$TMPDIR_TEST/dispatch-select-target")
assert_eq "issue 50 (has worktree) skipped; issue 51 chosen" "issue 51" "$result"
teardown

# 11d. The only help-wanted issue has a worktree → empty (not selected).
echo "Test: lone help-wanted issue with worktree → empty"
setup
echo '[]' > "$STUB_DIR/pr-list-full.json"
echo '[]' > "$STUB_DIR/pr-list-brief.json"
printf '[{"number":50,"createdAt":"2024-01-01T00:00:00Z"}]\n' > "$STUB_DIR/issue-list.json"
printf 'worktree /repo\nHEAD abc123\n\nworktree /worktrees/50-some-slug\nHEAD def456\nbranch refs/heads/50-some-slug\n\n' \
  > "$STUB_DIR/worktree-list.txt"
result=$("$TMPDIR_TEST/dispatch-select-target")
assert_eq "lone help-wanted issue with worktree → empty" "empty" "$result"
teardown

# 11e. A help-wanted issue with a worktree is skipped in favor of a QA PR.
echo "Test: help-wanted issue with worktree skipped → QA PR chosen"
setup
FULL='['"$(make_pr 20 "20-qa" "true" "$NO_LABELS" "$GREEN_ROLLUP")"']'
BRIEF='['"$(make_pr_brief 20 "20-qa" "2024-01-02T00:00:00Z")"']'
setup_both_pr_lists "$FULL" "$BRIEF"
printf '[{"number":50,"createdAt":"2024-01-01T00:00:00Z"}]\n' > "$STUB_DIR/issue-list.json"
printf 'worktree /repo\nHEAD abc123\n\nworktree /worktrees/50-some-slug\nHEAD def456\nbranch refs/heads/50-some-slug\n\n' \
  > "$STUB_DIR/worktree-list.txt"
result=$("$TMPDIR_TEST/dispatch-select-target")
assert_eq "help-wanted issue with worktree skipped → QA PR" "pr 20 20-qa" "$result"
teardown

# 11f. Worktree prefix disambiguation: branch 60-foo does not mask issue 6.
echo "Test: worktree 60-foo does not mask help-wanted issue 6"
setup
echo '[]' > "$STUB_DIR/pr-list-full.json"
echo '[]' > "$STUB_DIR/pr-list-brief.json"
printf '[{"number":6,"createdAt":"2024-01-01T00:00:00Z"}]\n' > "$STUB_DIR/issue-list.json"
printf 'worktree /repo\nHEAD abc123\n\nworktree /worktrees/60-foo\nHEAD def456\nbranch refs/heads/60-foo\n\n' \
  > "$STUB_DIR/worktree-list.txt"
result=$("$TMPDIR_TEST/dispatch-select-target")
assert_eq "worktree 60-foo does not mask issue 6" "issue 6" "$result"
teardown

# 12. --qa mode returns only the oldest QA PR (ignores non-QA PRs).
echo "Test: --qa mode ignores non-QA PRs and returns oldest QA PR"
setup
SECURITY_LABELS='[{"name":"dispatch:reviewed"}]'
FULL='['
FULL+="$(make_pr 10 "10-security" "true" "$SECURITY_LABELS" "$GREEN_ROLLUP")"','
FULL+="$(make_pr 20 "20-qa-old" "true" "$NO_LABELS" "$GREEN_ROLLUP")"','
FULL+="$(make_pr 30 "30-qa-new" "true" "$NO_LABELS" "$GREEN_ROLLUP")"
FULL+=']'
# Brief list sorted oldest-first: 10, 20, 30.
BRIEF='['
BRIEF+="$(make_pr_brief 10 "10-security" "2024-01-01T00:00:00Z")"','
BRIEF+="$(make_pr_brief 20 "20-qa-old" "2024-01-02T00:00:00Z")"','
BRIEF+="$(make_pr_brief 30 "30-qa-new" "2024-01-03T00:00:00Z")"
BRIEF+=']'
setup_both_pr_lists "$FULL" "$BRIEF"
echo '[]' > "$STUB_DIR/issue-list.json"
printf 'worktree /repo\nHEAD abc123\n\n' > "$STUB_DIR/worktree-list.txt"
result=$("$TMPDIR_TEST/dispatch-select-target" --qa)
assert_eq "--qa returns oldest QA PR (ignores security PR)" "pr 20 20-qa-old" "$result"
teardown

# 13. waiting PR is skipped in favor of a help-wanted issue.
echo "Test: waiting PR skipped in favor of help-wanted issue"
setup
# PR 10 in waiting phase (pending CI); no other PRs.
FULL='['"$(make_pr 10 "10-waiting" "true" "$NO_LABELS" "$PENDING_ROLLUP")"']'
BRIEF='['"$(make_pr_brief 10 "10-waiting" "2024-01-01T00:00:00Z")"']'
setup_both_pr_lists "$FULL" "$BRIEF"
printf '[{"number":55,"createdAt":"2024-01-01T00:00:00Z"}]\n' > "$STUB_DIR/issue-list.json"
printf 'worktree /repo\nHEAD abc123\n\n' > "$STUB_DIR/worktree-list.txt"
result=$("$TMPDIR_TEST/dispatch-select-target")
assert_eq "waiting PR skipped; help-wanted issue returned" "issue 55" "$result"
teardown

# 14. waiting PR is skipped in favor of a newer verify-phase PR.
echo "Test: waiting PR skipped in favor of verify PR"
setup
# PR 10 (older) in waiting phase, PR 20 (newer) in verify phase.
FULL='['"$(make_pr 10 "10-waiting" "true" "$NO_LABELS" "$PENDING_ROLLUP")"','"$(make_pr 20 "20-verify" "true" "$NO_LABELS" "$FAILING_ROLLUP")"']'
BRIEF='['"$(make_pr_brief 10 "10-waiting" "2024-01-01T00:00:00Z")"','"$(make_pr_brief 20 "20-verify" "2024-01-02T00:00:00Z")"']'
setup_both_pr_lists "$FULL" "$BRIEF"
echo '[]' > "$STUB_DIR/issue-list.json"
printf 'worktree /repo\nHEAD abc123\n\n' > "$STUB_DIR/worktree-list.txt"
result=$("$TMPDIR_TEST/dispatch-select-target")
assert_eq "waiting PR skipped; verify PR returned" "pr 20 20-verify" "$result"
teardown

# 15. A lone waiting PR (nothing else queued) yields empty.
echo "Test: lone waiting PR → empty"
setup
FULL='['"$(make_pr 10 "10-waiting" "true" "$NO_LABELS" "$PENDING_ROLLUP")"']'
BRIEF='['"$(make_pr_brief 10 "10-waiting" "2024-01-01T00:00:00Z")"']'
setup_both_pr_lists "$FULL" "$BRIEF"
echo '[]' > "$STUB_DIR/issue-list.json"
printf 'worktree /repo\nHEAD abc123\n\n' > "$STUB_DIR/worktree-list.txt"
result=$("$TMPDIR_TEST/dispatch-select-target")
assert_eq "lone waiting PR → empty" "empty" "$result"
teardown

# 16. Open issue worktree → worktree output, queue scan skipped.
echo "Test: open issue worktree → worktree <N> <branch>, scan skipped"
setup
# Seed a verify PR that would normally be selected — proves the scan is skipped.
FULL='['"$(make_pr 10 "10-verify-me" "true" "$NO_LABELS" "$FAILING_ROLLUP")"']'
BRIEF='['"$(make_pr_brief 10 "10-verify-me" "2024-01-01T00:00:00Z")"']'
setup_both_pr_lists "$FULL" "$BRIEF"
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
setup_both_pr_lists '[]' '[]'
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
setup_both_pr_lists '[]' '[]'
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
FULL='['"$(make_pr 10 "10-verify-me" "true" "$NO_LABELS" "$FAILING_ROLLUP")"']'
BRIEF='['"$(make_pr_brief 10 "10-verify-me" "2024-01-01T00:00:00Z")"']'
setup_both_pr_lists "$FULL" "$BRIEF"
echo '[]' > "$STUB_DIR/issue-list.json"
printf 'worktree /repo\nHEAD abc123\n\n' > "$STUB_DIR/worktree-list.txt"
printf 'main' > "$STUB_DIR/current-branch.txt"
result=$("$TMPDIR_TEST/dispatch-select-target")
assert_eq "main branch → normal scan result (verify PR)" "pr 10 10-verify-me" "$result"
teardown

# 20. --qa mode from an issue worktree → detection skipped, QA PR returned.
echo "Test: --qa mode from issue worktree → detection skipped, QA PR returned"
setup
# QA-phase PR: draft + green + no label.
FULL='['"$(make_pr 20 "20-qa-me" "true" "$NO_LABELS" "$GREEN_ROLLUP")"']'
BRIEF='['"$(make_pr_brief 20 "20-qa-me" "2024-01-01T00:00:00Z")"']'
setup_both_pr_lists "$FULL" "$BRIEF"
echo '[]' > "$STUB_DIR/issue-list.json"
printf 'worktree /repo\nHEAD abc123\n\n' > "$STUB_DIR/worktree-list.txt"
# Current branch looks like an issue worktree, but --qa skips detection.
printf '42-x' > "$STUB_DIR/current-branch.txt"
printf '{"state":"OPEN"}' > "$STUB_DIR/issue-state-42.json"
result=$("$TMPDIR_TEST/dispatch-select-target" --qa)
assert_eq "--qa mode from issue worktree → normal QA scan (pr 20 20-qa-me)" "pr 20 20-qa-me" "$result"
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
# summary
# ============================================================================
report_results
