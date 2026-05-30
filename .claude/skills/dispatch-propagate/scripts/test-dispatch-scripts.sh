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
  cp "$SCRIPT_DIR/dispatch-find-pr" "$TMPDIR_TEST/dispatch-find-pr"
  cp "$SCRIPT_DIR/dispatch-resolve-arg" "$TMPDIR_TEST/dispatch-resolve-arg"
  cp "$SCRIPT_DIR/dispatch-select-target" "$TMPDIR_TEST/dispatch-select-target"
  cp "$SCRIPT_DIR/dispatch-trace-leaf" "$TMPDIR_TEST/dispatch-trace-leaf"
  cp "$SCRIPT_DIR/dispatch-check-blockers" "$TMPDIR_TEST/dispatch-check-blockers"
  cp "$SCRIPT_DIR/dispatch-complete-phase" "$TMPDIR_TEST/dispatch-complete-phase"
  cp "$SCRIPT_DIR/dispatch-apply-office-hours" "$TMPDIR_TEST/dispatch-apply-office-hours"
  cp "$SCRIPT_DIR/dispatch-resolve-worktree" "$TMPDIR_TEST/dispatch-resolve-worktree"
  # dispatch-select-target's JIT scan calls dispatch-config-load and
  # dispatch-project-status-read as "$SCRIPT_DIR/<name>". SCRIPT_DIR resolves to
  # TMPDIR_TEST for the copied dispatch-select-target, so the two helpers must
  # sit directly in TMPDIR_TEST (NOT TMPDIR_TEST/scripts/).
  cp "$SCRIPT_DIR/dispatch-config-load" "$TMPDIR_TEST/dispatch-config-load"
  cp "$SCRIPT_DIR/dispatch-project-status-read" \
    "$TMPDIR_TEST/dispatch-project-status-read"
  # dispatch-trace-leaf and dispatch-resolve-worktree `source` lib.sh via their
  # SCRIPT_DIR, which resolves to TMPDIR_TEST for these copies — so lib.sh must
  # sit alongside them. It is sourced, not executed, so it needs no chmod +x.
  cp "$SCRIPT_DIR/lib.sh" "$TMPDIR_TEST/lib.sh"
  # dispatch-select-target sources lib-claude-agents.sh via its SCRIPT_DIR
  # (TMPDIR_TEST under test). Sourced, not executed — no chmod +x needed.
  cp "$SCRIPT_DIR/lib-claude-agents.sh" "$TMPDIR_TEST/lib-claude-agents.sh"
  chmod +x "$TMPDIR_TEST/dispatch-phase" \
           "$TMPDIR_TEST/dispatch-find-pr" \
           "$TMPDIR_TEST/dispatch-resolve-arg" \
           "$TMPDIR_TEST/dispatch-select-target" \
           "$TMPDIR_TEST/dispatch-trace-leaf" \
           "$TMPDIR_TEST/dispatch-check-blockers" \
           "$TMPDIR_TEST/dispatch-complete-phase" \
           "$TMPDIR_TEST/dispatch-apply-office-hours" \
           "$TMPDIR_TEST/dispatch-resolve-worktree" \
           "$TMPDIR_TEST/dispatch-config-load" \
           "$TMPDIR_TEST/dispatch-project-status-read"

  # JIT scan config dir. With no jit.json written into it, dispatch-config-load
  # jit returns "no-config", so jit_scan returns immediately — every existing
  # dispatch-select-target test stays green.
  mkdir -p "$TMPDIR_TEST/config"
  export DISPATCH_CONFIG_DIR="$TMPDIR_TEST/config"
  export DISPATCH_FIND_PR_RETRY_DELAY=0

  # Default the worktree-liveness daemon to UNKNOWN: point CLAUDE_AGENTS_CMD at a
  # path with no executable so `claude agents --json` exits non-zero. The
  # worktree_has_live_session predicate folds UNKNOWN into "occupied", so a
  # worktree-bearing row fails safe to skip/conflict — preserving the pre-#905
  # stat-only behavior for every test that does not opt into a richer fake — and
  # no test reaches the real `claude` daemon. Per-test calls to
  # select_target_fake_claude override this to model live or orphan worktrees.
  export CLAUDE_AGENTS_CMD="$TMPDIR_TEST/no-such-claude"

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
  "pr list --state open --json number,headRefName")
    # dispatch-find-pr self-fetch: only the two correlation fields.
    echo "pr list" >> "$STUB_DIR/gh-pr-list-calls.log"
    echo "pr list" >> "$STUB_DIR/gh-find-pr-calls.log"
    call_count=$(wc -l < "$STUB_DIR/gh-find-pr-calls.log")
    if [[ "$call_count" -ge 2 && -f "$STUB_DIR/pr-list-retry.json" ]]; then
      cat "$STUB_DIR/pr-list-retry.json"
    elif [[ -f "$STUB_DIR/pr-list-full.json" ]]; then
      cat "$STUB_DIR/pr-list-full.json"
    else
      echo "[]"
    fi
    ;;
  "pr list --state open --json number,createdAt,headRefName,isDraft,statusCheckRollup,labels,closingIssuesReferences")
    echo "pr list" >> "$STUB_DIR/gh-pr-list-calls.log"
    if [[ -f "$STUB_DIR/pr-list-union.json" ]]; then
      cat "$STUB_DIR/pr-list-union.json"
    else
      echo "[]"
    fi
    ;;
  "issue list --state open --limit 300 --json number,createdAt,labels")
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
  issue\ view\ *\ --json\ closedByPullRequestsReferences)
    # dispatch-find-pr cross-check fallback: gh issue view <num> --json closedByPullRequestsReferences
    num=$(echo "$args" | awk '{print $3}')
    if [[ -f "$STUB_DIR/issue-closing-prs-${num}.json" ]]; then
      cat "$STUB_DIR/issue-closing-prs-${num}.json"
    else
      echo '{"closedByPullRequestsReferences":[]}'
    fi
    ;;
  api\ */dependencies/blocked_by)
    path=$(echo "$args" | awk '{print $2}')
    num=$(echo "$path" | grep -oE '[0-9]+' | tail -1)
    # Failure injection: a marker file models a transient gh API failure on this
    # issue's blocked_by lookup (mirrors the issue-blocking fake's contract), so
    # count_open_blockers callers (e.g. dispatch-check-blockers) can exercise the
    # gh_api_array failure path.
    if [[ -f "$STUB_DIR/gh-fail-blocked_by-${num}" ]]; then
      echo "gh: API error on issues/${num}/dependencies/blocked_by" >&2
      exit 1
    fi
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
  api\ repos/*/issues/*)
    # dispatch-resolve-arg discriminator: gh api repos/{owner}/{repo}/issues/<N>.
    # The REST issues endpoint returns PRs too; a PR's JSON carries a
    # "pull_request" key. The fixture file decides issue-vs-PR; an arg-issue-<N>.err
    # fixture models a non-404 gh failure; absence of either fixture models a 404
    # (the number is neither an issue nor a PR).
    num="${args##*/}"
    if [[ -f "$STUB_DIR/arg-issue-${num}.json" ]]; then
      cat "$STUB_DIR/arg-issue-${num}.json"
    elif [[ -f "$STUB_DIR/arg-issue-${num}.err" ]]; then
      cat "$STUB_DIR/arg-issue-${num}.err" >&2
      exit 1
    else
      echo "gh: Not Found (HTTP 404)" >&2
      exit 1
    fi
    ;;
  pr\ view\ *\ --json\ closingIssuesReferences)
    # dispatch-resolve-arg PR branch: gh pr view <N> --json closingIssuesReferences.
    num=$(echo "$args" | awk '{print $3}')
    if [[ -f "$STUB_DIR/arg-closing-${num}.json" ]]; then
      cat "$STUB_DIR/arg-closing-${num}.json"
    else
      echo '{"closingIssuesReferences":[]}'
    fi
    ;;
  pr\ view\ *\ --json\ headRefName)
    # dispatch-resolve-worktree reconciliation: gh pr view <N> --json headRefName.
    echo "pr view" >> "$STUB_DIR/gh-pr-view-headref.log"
    num=$(echo "$args" | awk '{print $3}')
    if [[ -f "$STUB_DIR/pr-headref-${num}.json" ]]; then
      cat "$STUB_DIR/pr-headref-${num}.json"
    else
      echo '{"headRefName":""}'
    fi
    ;;
  label\ create\ *)
    # dispatch-complete-phase / dispatch-apply-office-hours create the label only
    # when the apply reported it missing.
    echo "$args" >> "$STUB_DIR/gh-label-create.log"
    ;;
  issue\ view\ *\ --json\ labels)
    # dispatch-apply-office-hours idempotency read: gh issue view <num> --json labels.
    # $STUB_DIR/issue-labels-<num>.json supplies the labels object; absence means
    # the issue carries no labels.
    num=$(echo "$args" | awk '{print $3}')
    if [[ -f "$STUB_DIR/issue-labels-${num}.json" ]]; then
      cat "$STUB_DIR/issue-labels-${num}.json"
    else
      echo '{"labels":[]}'
    fi
    ;;
  issue\ edit\ *)
    # dispatch-apply-office-hours applies the label to the ISSUE.
    # $STUB_DIR/issue-edit-mode selects behavior (default: succeed and log args).
    mode="ok"
    [[ -f "$STUB_DIR/issue-edit-mode" ]] && mode=$(cat "$STUB_DIR/issue-edit-mode")
    case "$mode" in
      label-missing)
        # The label does not exist until gh label create runs: model gh's
        # missing-label error until then, then succeed on the retry.
        if [[ -f "$STUB_DIR/gh-label-create.log" ]]; then
          echo "$args" >> "$STUB_DIR/gh-issue-edit.log"
        else
          label="${args##* }"
          echo "failed to update: '$label' not found" >&2
          exit 1
        fi
        ;;
      *)
        echo "$args" >> "$STUB_DIR/gh-issue-edit.log"
        ;;
    esac
    ;;
  issue\ comment\ *)
    # dispatch-apply-office-hours posts the why-comment to the ISSUE.
    echo "$args" >> "$STUB_DIR/gh-issue-comment.log"
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
  issue\ list\ --repo\ *)
    # JIT scan: gh issue list --repo <repo> --label <label> --state <open|closed> --json ...
    # Fixtures are keyed by sanitized label + state; absent fixture → empty list.
    jit_label=""
    jit_state=""
    set -- $args
    while [[ $# -gt 0 ]]; do
      case "$1" in
        --label) jit_label="$2"; shift 2 ;;
        --state) jit_state="$2"; shift 2 ;;
        *) shift ;;
      esac
    done
    jit_key=$(printf '%s' "$jit_label" | tr '/:' '__')
    jit_fixture="$STUB_DIR/jit-issues-${jit_state}-${jit_key}.json"
    if [[ -f "$jit_fixture" ]]; then
      cat "$jit_fixture"
    else
      echo "[]"
    fi
    ;;
  "project item-list "*)
    # JIT scan via dispatch-project-status-read.
    if [[ -f "$STUB_DIR/project-item-list.json" ]]; then
      cat "$STUB_DIR/project-item-list.json"
    else
      echo '{"items":[],"totalCount":0}'
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
  "rev-parse --show-toplevel")
    if [[ -f "$STUB_DIR/worktree-toplevel.txt" ]]; then
      cat "$STUB_DIR/worktree-toplevel.txt"
    else
      echo "/repo"
    fi
    ;;
  -C\ *\ fetch\ *)
    # dispatch-resolve-worktree reconciliation: fetch the PR head branch.
    : ;;
  -C\ *\ rev-list\ --count\ *)
    # dispatch-resolve-worktree reconciliation: commits unique to the worktree
    # branch. Default 0 (lossless re-point); rev-list-count.txt overrides to N.
    if [[ -f "$STUB_DIR/rev-list-count.txt" ]]; then
      cat "$STUB_DIR/rev-list-count.txt"
    else
      echo "0"
    fi
    ;;
  -C\ *\ checkout\ *)
    # dispatch-resolve-worktree reconciliation: re-point to the PR head branch.
    echo "$args" >> "$STUB_DIR/git-checkout.log"
    ;;
  *)
    echo "git stub: unknown invocation: $args" >&2
    exit 1
    ;;
esac
STUB
  chmod +x "$TMPDIR_TEST/bin/git"

  # dispatch-trace-leaf calls issue-blocking and issue-sub-issues as sibling
  # scripts ("$SCRIPT_DIR/issue-blocking"). Since the copied dispatch-trace-leaf
  # has SCRIPT_DIR = TMPDIR_TEST, place fake versions of those scripts directly
  # in TMPDIR_TEST so they are found alongside it. The fakes read stub files
  # instead of calling gh.
  cat > "$TMPDIR_TEST/issue-blocking" <<'FAKE'
#!/usr/bin/env bash
STUB_DIR="$(cd "$(dirname "$0")/stub" && pwd)"
num="${1:-}"
# Strip leading # if present.
num="${num#\#}"
# Failure injection: a marker file models a transient gh API failure on this
# issue's blocked_by lookup. The real issue-blocking exits non-zero (with a
# gh_api_array stderr diagnostic) on a genuine gh failure — the fake mirrors
# that contract so dispatch-trace-leaf's failure handling can be exercised.
if [[ -f "$STUB_DIR/gh-fail-blocked_by-${num}" ]]; then
  echo "error: gh api call failed for issues/${num}/dependencies/blocked_by" >&2
  exit 1
fi
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
  chmod +x "$TMPDIR_TEST/issue-blocking"

  cat > "$TMPDIR_TEST/issue-sub-issues" <<'FAKE'
#!/usr/bin/env bash
STUB_DIR="$(cd "$(dirname "$0")/stub" && pwd)"
num="${1:-}"
num="${num#\#}"
# Failure injection — same contract as issue-blocking's, for the sub_issues
# lookup.
if [[ -f "$STUB_DIR/gh-fail-sub_issues-${num}" ]]; then
  echo "error: gh api call failed for issues/${num}/sub_issues" >&2
  exit 1
fi
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
  chmod +x "$TMPDIR_TEST/issue-sub-issues"

  export PATH="$TMPDIR_TEST/bin:$PATH"
}

teardown() {
  rm -rf "$TMPDIR_TEST"
  TMPDIR_TEST=""
  STUB_DIR=""
  export PATH="$SAVED_PATH"
  unset DISPATCH_CONFIG_DIR
  unset DISPATCH_FIND_PR_RETRY_DELAY
  # Per-test exports for the liveness gate must not leak across tests.
  unset CLAUDE_AGENTS_CMD
  unset CLAUDE_CODE_SESSION_ID
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
# union of fields both scripts need. The 7th arg, closing_json, is the
# closingIssuesReferences array; it defaults to [] (PR closes no issue), so
# existing 6-arg call sites keep working unchanged.
make_pr_union() {
  local num="$1" branch="$2" created="$3" is_draft="$4" labels_json="$5" rollup_json="$6" closing_json="${7:-[]}"
  printf '{"number":%s,"createdAt":"%s","headRefName":"%s","isDraft":%s,"labels":%s,"statusCheckRollup":%s,"closingIssuesReferences":%s}' \
    "$num" "$created" "$branch" "$is_draft" "$labels_json" "$rollup_json" "$closing_json"
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

# 6. Draft + green + dispatch:qa-done → code-review
echo "Test: draft + green + dispatch:qa-done → code-review"
setup
printf '[%s]\n' "$(make_pr 10 "42-my-feature" "true" '[{"name":"dispatch:qa-done"}]' "$GREEN_ROLLUP")" \
  > "$STUB_DIR/pr-list-full.json"
result=$("$TMPDIR_TEST/dispatch-phase" "42")
assert_eq "draft + green + dispatch:qa-done → code-review" "code-review" "$result"
teardown

# 7. Draft + green + dispatch:code-reviewed → review
echo "Test: draft + green + dispatch:code-reviewed → review"
setup
printf '[%s]\n' "$(make_pr 10 "42-my-feature" "true" '[{"name":"dispatch:code-reviewed"}]' "$GREEN_ROLLUP")" \
  > "$STUB_DIR/pr-list-full.json"
result=$("$TMPDIR_TEST/dispatch-phase" "42")
assert_eq "draft + green + dispatch:code-reviewed → review" "review" "$result"
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
# dispatch-find-pr tests
# ============================================================================
echo ""
echo "=== dispatch-find-pr ==="

# 1. Matching branch prefix + matching title → prints PR number.
echo "Test: matching branch prefix + matching title → PR number"
setup
printf '[{"number":42,"headRefName":"42-my-feature","title":"feature: 42 something"}]\n' \
  > "$STUB_DIR/pr-list-full.json"
result=$("$TMPDIR_TEST/dispatch-find-pr" "42")
assert_eq "matching branch prefix + matching title → PR number" "42" "$result"
teardown

# 2. Matching branch prefix + non-matching title → still prints PR number (the #670 case).
# The script never reads title — that's the point; this is the regression case from #673.
echo "Test: matching branch prefix + non-matching title → PR number (#670 case)"
setup
printf '[{"number":670,"headRefName":"669-budget-sankey","title":"budget: use schemeTableau10 in sankey chart"}]\n' \
  > "$STUB_DIR/pr-list-full.json"
result=$("$TMPDIR_TEST/dispatch-find-pr" "669")
assert_eq "matching branch prefix, non-matching title → PR number" "670" "$result"
teardown

# 3. No PR → prints empty.
echo "Test: no PR → empty"
setup
printf '[]\n' > "$STUB_DIR/pr-list-full.json"
result=$("$TMPDIR_TEST/dispatch-find-pr" "42")
assert_eq "no PR → empty output" "" "$result"
teardown

# 4. DISPATCH_PR_LIST overrides self-fetch.
# pr-list-full.json is empty: a self-fetch would yield empty. The PR lives only
# in the env var, so a non-empty result proves the env var won.
echo "Test: DISPATCH_PR_LIST overrides self-fetch"
setup
printf '[]\n' > "$STUB_DIR/pr-list-full.json"
result=$(DISPATCH_PR_LIST='[{"number":670,"headRefName":"669-x"}]' "$TMPDIR_TEST/dispatch-find-pr" "669")
assert_eq "DISPATCH_PR_LIST used over self-fetch → PR number" "670" "$result"
teardown

# 5. Issue-prefix disambiguation: issue 6 must not match branch "60-foo".
# The trailing "-" in the startswith match is what prevents the collision.
echo "Test: issue 6 does not match branch 60-foo"
setup
printf '[{"number":10,"headRefName":"60-foo"}]\n' > "$STUB_DIR/pr-list-full.json"
result=$("$TMPDIR_TEST/dispatch-find-pr" "6")
assert_eq "issue 6 does not match branch 60-foo → empty" "" "$result"
teardown

# 6. Flake recovery: first pr list call is empty, second returns the PR.
# Models gh pr list flaking (exit 0 + []) on call 1 and returning the real list
# on call 2. The retry-on-empty should produce the PR number.
echo "Test: flake recovery — empty first call, PR on retry → PR number"
setup
printf '[]\n' > "$STUB_DIR/pr-list-full.json"
printf '[{"number":820,"headRefName":"820-x"}]\n' > "$STUB_DIR/pr-list-retry.json"
result=$("$TMPDIR_TEST/dispatch-find-pr" "820")
assert_eq "flake recovery → PR number" "820" "$result"
teardown

# 7. Cross-check fallback: pr list yields empty on both attempts, but the
# issue's closedByPullRequestsReferences lists an OPEN PR. This covers the
# case where the branch was renamed away from the <issue>- convention.
echo "Test: cross-check fallback — issue references an OPEN PR → PR number"
setup
printf '[]\n' > "$STUB_DIR/pr-list-full.json"
printf '{"closedByPullRequestsReferences":[{"number":830,"state":"OPEN"}]}\n' \
  > "$STUB_DIR/issue-closing-prs-822.json"
result=$("$TMPDIR_TEST/dispatch-find-pr" "822")
assert_eq "cross-check OPEN reference → PR number" "830" "$result"
teardown

# 8. Cross-check ignores non-OPEN references. The script's contract is "open
# PR for issue N or empty"; a MERGED reference must not be reported.
echo "Test: cross-check ignores MERGED reference → empty"
setup
printf '[]\n' > "$STUB_DIR/pr-list-full.json"
printf '{"closedByPullRequestsReferences":[{"number":840,"state":"MERGED"}]}\n' \
  > "$STUB_DIR/issue-closing-prs-822.json"
result=$("$TMPDIR_TEST/dispatch-find-pr" "822")
assert_eq "cross-check MERGED reference → empty" "" "$result"
teardown

# 9. Genuine empty: pr list empty on both attempts AND issue references no
# PR. Output stays empty, exit 0 — the "no PR exists" answer.
echo "Test: genuine empty (no PR, no references) → empty"
setup
printf '[]\n' > "$STUB_DIR/pr-list-full.json"
printf '{"closedByPullRequestsReferences":[]}\n' \
  > "$STUB_DIR/issue-closing-prs-822.json"
result=$("$TMPDIR_TEST/dispatch-find-pr" "822")
assert_eq "genuine empty → empty" "" "$result"
teardown

# 10. DISPATCH_PR_LIST supplied without matching branch; cross-check resolves PR.
# The retry (step 1) is skipped when DISPATCH_PR_LIST is set — the caller owns
# the list. The cross-check (step 2) still runs regardless, using a different gh
# endpoint that the caller cannot pre-supply.
echo "Test: DISPATCH_PR_LIST no match + cross-check OPEN reference → PR number"
setup
printf '[{"number":850,"headRefName":"999-unrelated"}]\n' > "$STUB_DIR/pr-list-full.json"
printf '{"closedByPullRequestsReferences":[{"number":851,"state":"OPEN"}]}\n' \
  > "$STUB_DIR/issue-closing-prs-822.json"
result=$(DISPATCH_PR_LIST='[{"number":850,"headRefName":"999-unrelated"}]' \
  "$TMPDIR_TEST/dispatch-find-pr" "822")
assert_eq "DISPATCH_PR_LIST no prefix match; cross-check finds OPEN PR → PR number" "851" "$result"
# Verify no self-fetch: gh pr list --state open --json number,headRefName was not called.
if [[ -f "$STUB_DIR/gh-find-pr-calls.log" ]]; then
  call_count=$(wc -l < "$STUB_DIR/gh-find-pr-calls.log")
else
  call_count=0
fi
assert_eq "no self-fetch gh pr list calls when DISPATCH_PR_LIST set" "0" "$call_count"
teardown

# ============================================================================
# dispatch-resolve-arg tests
# ============================================================================
echo ""
echo "=== dispatch-resolve-arg ==="

# 1. Issue argument → stdout is the number unchanged, exit 0.
echo "Test: issue number → passes through unchanged"
setup
printf '{"number":736,"state":"open"}\n' > "$STUB_DIR/arg-issue-736.json"
result=$("$TMPDIR_TEST/dispatch-resolve-arg" "736")
assert_eq "issue number → passes through" "736" "$result"
teardown

# 2. Leading '#' is tolerated → same resolution as bare number.
echo "Test: leading '#' is stripped and resolves correctly"
setup
printf '{"number":736,"state":"open"}\n' > "$STUB_DIR/arg-issue-736.json"
result=$("$TMPDIR_TEST/dispatch-resolve-arg" "#736")
assert_eq "leading '#' stripped → issue number" "736" "$result"
teardown

# 3. PR closing exactly one issue → stdout is the closing issue number.
# PR 717 closes issue 715.
echo "Test: PR closing one issue → that issue number"
setup
printf '{"number":717,"pull_request":{}}\n' > "$STUB_DIR/arg-issue-717.json"
printf '{"closingIssuesReferences":[{"number":715}]}\n' > "$STUB_DIR/arg-closing-717.json"
result=$("$TMPDIR_TEST/dispatch-resolve-arg" "717")
assert_eq "PR closing one issue → closing issue number" "715" "$result"
teardown

# 4. PR closing zero issues → exit 3.
# arg-closing-718.json explicitly carries an empty array to model zero references.
echo "Test: PR with no closing issue → exit 3"
setup
printf '{"number":718,"pull_request":{}}\n' > "$STUB_DIR/arg-issue-718.json"
printf '{"closingIssuesReferences":[]}\n' > "$STUB_DIR/arg-closing-718.json"
if ( "$TMPDIR_TEST/dispatch-resolve-arg" "718" ) >/dev/null 2>&1; then rc=0; else rc=$?; fi
assert_eq "PR closing zero issues → exit 3" "3" "$rc"
teardown

# 5. PR closing multiple issues → exit 4.
echo "Test: PR closing multiple issues → exit 4"
setup
printf '{"number":719,"pull_request":{}}\n' > "$STUB_DIR/arg-issue-719.json"
printf '{"closingIssuesReferences":[{"number":700},{"number":701}]}\n' > "$STUB_DIR/arg-closing-719.json"
if ( "$TMPDIR_TEST/dispatch-resolve-arg" "719" ) >/dev/null 2>&1; then rc=0; else rc=$?; fi
assert_eq "PR closing multiple issues → exit 4" "4" "$rc"
teardown

# 6. Number is neither an issue nor a PR (no fixture → stub 404s) → exit 2.
echo "Test: unknown number → exit 2"
setup
# No arg-issue-999.json: the stub returns 404.
if ( "$TMPDIR_TEST/dispatch-resolve-arg" "999" ) >/dev/null 2>&1; then rc=0; else rc=$?; fi
assert_eq "neither issue nor PR → exit 2" "2" "$rc"
teardown

# 7. Non-numeric argument → exit 1.
echo "Test: non-numeric argument → exit 1"
setup
if ( "$TMPDIR_TEST/dispatch-resolve-arg" "abc" ) >/dev/null 2>&1; then rc=0; else rc=$?; fi
assert_eq "non-numeric argument → exit 1" "1" "$rc"
teardown

# 8. Missing argument → exit 1.
echo "Test: missing argument → exit 1"
setup
if ( "$TMPDIR_TEST/dispatch-resolve-arg" ) >/dev/null 2>&1; then rc=0; else rc=$?; fi
assert_eq "missing argument → exit 1" "1" "$rc"
teardown

# 9. Non-404 gh failure (auth/network) → exit 1, not misreported as exit 2.
echo "Test: non-404 lookup failure → exit 1"
setup
printf 'gh: HTTP 503: Service unavailable\n' > "$STUB_DIR/arg-issue-998.err"
if ( "$TMPDIR_TEST/dispatch-resolve-arg" "998" ) >/dev/null 2>&1; then rc=0; else rc=$?; fi
assert_eq "non-404 lookup failure → exit 1" "1" "$rc"
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

# Install a fake `claude` for the worktree-liveness checks in
# dispatch-select-target and dispatch-resolve-worktree. Each argument is a
# worktree basename that should report a *live* session; the fake's
# `agents --json` returns one entry per name (client-side jq in
# claude_sessions_with_name applies the name filter, exactly as in production).
# Call with zero arguments to model an orphan-worktree world — `[]`, no live
# sessions — which the predicate reports as free, so the row is NOT skipped and
# a queue-mode resolve emits `enter`. Overrides the UNKNOWN default from setup.
select_target_fake_claude() {
  local payload="[" name first=1
  for name in "$@"; do
    if (( first )); then first=0; else payload+=","; fi
    payload+="{\"sessionId\":\"s-$name\",\"pid\":1,\"status\":\"busy\",\"name\":\"$name\",\"cwd\":\"\"}"
  done
  payload+="]"
  printf '%s' "$payload" > "$TMPDIR_TEST/claude-payload.json"
  cat > "$TMPDIR_TEST/bin/claude" <<'FAKE'
#!/usr/bin/env bash
# Ignore all args (including --cwd); return the full payload. The caller's jq
# name filter selects the matching session, as the real daemon path does.
cat "$(cd "$(dirname "$0")/.." && pwd)/claude-payload.json"
exit 0
FAKE
  chmod +x "$TMPDIR_TEST/bin/claude"
  export CLAUDE_AGENTS_CMD="$TMPDIR_TEST/bin/claude"
}

# 1. A non-QA PR is chosen over a QA PR and a help-wanted issue.
echo "Test: non-QA PR beats QA PR and issue"
setup
# PR 10 in verify phase (no CI green), PR 20 in qa phase (CI green, no label).
UNION='['"$(make_pr_union 10 "10-verify-me" "2024-01-01T00:00:00Z" "true" "$NO_LABELS" "$FAILING_ROLLUP")"','"$(make_pr_union 20 "20-qa-me" "2024-01-02T00:00:00Z" "true" "$NO_LABELS" "$GREEN_ROLLUP")"']'
setup_union_pr_list "$UNION"
printf '[{"number":99,"createdAt":"2024-01-01T00:00:00Z","labels":[{"name":"help wanted"}]}]\n' > "$STUB_DIR/issue-list.json"
# No worktrees for these branches.
printf 'worktree /repo\nHEAD abc123\n\n' > "$STUB_DIR/worktree-list.txt"
result=$("$TMPDIR_TEST/dispatch-select-target")
assert_eq "non-QA PR (verify) chosen first" "pr 10 10-verify-me verify" "$result"
teardown

# 2. A PR whose branch worktree is owned by a live session is skipped.
echo "Test: PR whose branch worktree has a live session is skipped"
setup
UNION='['"$(make_pr_union 10 "10-active-branch" "2024-01-01T00:00:00Z" "true" "$NO_LABELS" "$FAILING_ROLLUP")"','"$(make_pr_union 20 "20-other" "2024-01-02T00:00:00Z" "true" "$NO_LABELS" "$FAILING_ROLLUP")"']'
setup_union_pr_list "$UNION"
echo '[]' > "$STUB_DIR/issue-list.json"
# Worktree exists for branch 10-active-branch, owned by a live session.
# /repo is on main — git never allows two worktrees to share a branch, so
# the main worktree uses refs/heads/main here (not 10-active-branch).
printf 'worktree /repo\nHEAD abc123\nbranch refs/heads/main\n\nworktree /worktrees/10-active-branch\nHEAD def456\nbranch refs/heads/10-active-branch\n\n' \
  > "$STUB_DIR/worktree-list.txt"
select_target_fake_claude "10-active-branch"
result=$("$TMPDIR_TEST/dispatch-select-target")
assert_eq "PR with live-session worktree skipped; next PR returned" "pr 20 20-other verify" "$result"
teardown

# 2b. A PR whose branch worktree is an orphan (no live session) is NOT skipped —
#     the orphan is a reuse signal, not a priority skip (#905).
echo "Test: PR whose branch worktree is an orphan is not skipped"
setup
UNION='['"$(make_pr_union 10 "10-active-branch" "2024-01-01T00:00:00Z" "true" "$NO_LABELS" "$FAILING_ROLLUP")"','"$(make_pr_union 20 "20-other" "2024-01-02T00:00:00Z" "true" "$NO_LABELS" "$FAILING_ROLLUP")"']'
setup_union_pr_list "$UNION"
echo '[]' > "$STUB_DIR/issue-list.json"
printf 'worktree /repo\nHEAD abc123\nbranch refs/heads/main\n\nworktree /worktrees/10-active-branch\nHEAD def456\nbranch refs/heads/10-active-branch\n\n' \
  > "$STUB_DIR/worktree-list.txt"
# No live sessions: 10-active-branch's worktree is an orphan.
select_target_fake_claude
result=$("$TMPDIR_TEST/dispatch-select-target")
assert_eq "PR with orphan worktree is selected, not skipped" "pr 10 10-active-branch verify" "$result"
teardown

# 2b. A PR whose ISSUE carries dispatch:office-hours is skipped (issue #909).
# The label lives on the issue, not the PR — the skip resolves the issue number
# from the PR's branch prefix (<N>-) and reads the issue's labels. PR 10's branch
# is 10-parked → issue #10, which is parked; PR 20's branch is 20-other → issue
# #20, which is not. Neither PR itself carries the label.
echo "Test: PR whose issue carries dispatch:office-hours is skipped"
setup
UNION='['"$(make_pr_union 10 "10-parked" "2024-01-01T00:00:00Z" "true" "$NO_LABELS" "$FAILING_ROLLUP")"','"$(make_pr_union 20 "20-other" "2024-01-02T00:00:00Z" "true" "$NO_LABELS" "$FAILING_ROLLUP")"']'
setup_union_pr_list "$UNION"
# Issue #10 is parked (dispatch:office-hours); issue #20 is not. Neither carries
# "help wanted", so neither competes in the issue queue — they exist here only as
# the office-hours-label source the PR loop reads via ISSUE_LABELS_JSON.
printf '[{"number":10,"createdAt":"2024-01-01T00:00:00Z","labels":[{"name":"dispatch:office-hours"}]},{"number":20,"createdAt":"2024-01-02T00:00:00Z","labels":[]}]\n' \
  > "$STUB_DIR/issue-list.json"
printf 'worktree /repo\nHEAD abc123\n\n' > "$STUB_DIR/worktree-list.txt"
result=$("$TMPDIR_TEST/dispatch-select-target")
assert_eq "PR with parked issue skipped; unparked sibling returned" "pr 20 20-other verify" "$result"
teardown

# 3. When no eligible PR exists, a help-wanted issue is chosen.
echo "Test: no eligible PR → help-wanted issue"
setup
echo '[]' > "$STUB_DIR/pr-list-union.json"
printf '[{"number":55,"createdAt":"2024-03-01T00:00:00Z","labels":[{"name":"help wanted"}]}]\n' > "$STUB_DIR/issue-list.json"
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
printf '[{"number":77,"createdAt":"2024-01-01T00:00:00Z","labels":[{"name":"help wanted"}]}]\n' > "$STUB_DIR/issue-list.json"
printf 'worktree /repo\nHEAD abc123\n\n' > "$STUB_DIR/worktree-list.txt"
result=$("$TMPDIR_TEST/dispatch-select-target" --qa)
assert_eq "--qa mode no QA PR → empty" "empty" "$result"
teardown

# 7. All PRs done → falls through to help-wanted issue.
echo "Test: all PRs done → help-wanted issue"
setup
UNION='['"$(make_pr_union 10 "10-done-pr" "2024-01-01T00:00:00Z" "false" "$NO_LABELS" "$GREEN_ROLLUP")"']'
setup_union_pr_list "$UNION"
printf '[{"number":33,"createdAt":"2024-01-01T00:00:00Z","labels":[{"name":"help wanted"}]}]\n' > "$STUB_DIR/issue-list.json"
printf 'worktree /repo\nHEAD abc123\n\n' > "$STUB_DIR/worktree-list.txt"
result=$("$TMPDIR_TEST/dispatch-select-target")
assert_eq "done PRs skipped; help-wanted issue returned" "issue 33" "$result"
teardown

# 8. security is the top non-QA tier: it beats review, code-review, and verify.
echo "Test: security beats review/code-review/verify"
setup
SECURITY_LABELS='[{"name":"dispatch:reviewed"}]'
REVIEW_LABELS='[{"name":"dispatch:code-reviewed"}]'
CODE_REVIEW_LABELS='[{"name":"dispatch:qa-done"}]'
UNION='['
UNION+="$(make_pr_union 10 "10-verify" "2024-01-01T00:00:00Z" "true" "$NO_LABELS" "$FAILING_ROLLUP")"','
UNION+="$(make_pr_union 20 "20-code-review" "2024-01-02T00:00:00Z" "true" "$CODE_REVIEW_LABELS" "$GREEN_ROLLUP")"','
UNION+="$(make_pr_union 30 "30-review" "2024-01-03T00:00:00Z" "true" "$REVIEW_LABELS" "$GREEN_ROLLUP")"','
UNION+="$(make_pr_union 40 "40-security" "2024-01-04T00:00:00Z" "true" "$SECURITY_LABELS" "$GREEN_ROLLUP")"
UNION+=']'
setup_union_pr_list "$UNION"
echo '[]' > "$STUB_DIR/issue-list.json"
printf 'worktree /repo\nHEAD abc123\n\n' > "$STUB_DIR/worktree-list.txt"
result=$("$TMPDIR_TEST/dispatch-select-target")
assert_eq "security beats review/code-review/verify" "pr 40 40-security security" "$result"
teardown

# 9. Within one phase, the oldest PR wins.
echo "Test: within same phase, oldest PR wins"
setup
# Two review-phase PRs; PR 30 is older.
REVIEW_LABELS='[{"name":"dispatch:code-reviewed"}]'
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
printf '[{"number":55,"createdAt":"2024-01-01T00:00:00Z","labels":[{"name":"help wanted"}]}]\n' > "$STUB_DIR/issue-list.json"
printf 'worktree /repo\nHEAD abc123\n\n' > "$STUB_DIR/worktree-list.txt"
result=$("$TMPDIR_TEST/dispatch-select-target")
assert_eq "verify PR beats issue (non-QA > issue > qa)" "pr 10 10-verify verify" "$result"
teardown

# 10b. No non-QA PR: help-wanted issue beats QA PR.
echo "Test: help-wanted issue beats QA PR"
setup
UNION='['"$(make_pr_union 20 "20-qa" "2024-01-02T00:00:00Z" "true" "$NO_LABELS" "$GREEN_ROLLUP")"']'
setup_union_pr_list "$UNION"
printf '[{"number":55,"createdAt":"2024-01-01T00:00:00Z","labels":[{"name":"help wanted"}]}]\n' > "$STUB_DIR/issue-list.json"
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
printf '[{"number":55,"createdAt":"2024-01-01T00:00:00Z","labels":[{"name":"help wanted"}]}]\n' > "$STUB_DIR/issue-list.json"
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

# 20. --qa mode with a non-main current branch → normal QA PR returned.
echo "Test: --qa mode with non-main current branch → QA PR returned"
setup
# QA-phase PR: draft + green + no label.
UNION='['"$(make_pr_union 20 "20-qa-me" "2024-01-01T00:00:00Z" "true" "$NO_LABELS" "$GREEN_ROLLUP")"']'
setup_union_pr_list "$UNION"
echo '[]' > "$STUB_DIR/issue-list.json"
printf 'worktree /repo\nHEAD abc123\n\n' > "$STUB_DIR/worktree-list.txt"
# Non-main current branch: cwd does not affect --qa selection.
printf '42-x' > "$STUB_DIR/current-branch.txt"
result=$("$TMPDIR_TEST/dispatch-select-target" --qa)
assert_eq "--qa mode with non-main current branch → QA PR returned" "pr 20 20-qa-me" "$result"
teardown

# --- origin/main CI health gate (issue #660) --------------------------------
# The gate runs before the priority ladder in default mode. It aggregates main's
# HEAD CI from check-runs (CodeQL) and Actions workflow runs; a failing
# conclusion short-circuits to "main-broken <sha>". The gate is uniform —
# there is no cwd-based bypass.
#
# The explicit-`/dispatch-propagate <issue|pr>` bypass is structural and not script-
# testable here: an explicit argument skips the queue scan entirely (SKILL.md
# Step 3), so dispatch-select-target is never invoked on that path.

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
printf '[{"number":55,"createdAt":"2024-01-01T00:00:00Z","labels":[{"name":"help wanted"}]}]\n' > "$STUB_DIR/issue-list.json"
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

# --- --health-only mode (issue #683 AC: gate before sweep) ------------------
# --health-only runs the JIT scan and the gate, then exits without the queue
# scan. /dispatch-propagate SKILL.md calls it before dispatch-sweep so the sweep does
# not run while main is red.

# 27a. --health-only, main green, not in a worktree → "ok", exit 0.
echo "Test: --health-only + main green → ok"
setup
echo '[]' > "$STUB_DIR/pr-list-union.json"
echo '[]' > "$STUB_DIR/issue-list.json"
printf 'worktree /repo\nHEAD abc123\n\n' > "$STUB_DIR/worktree-list.txt"
printf 'main' > "$STUB_DIR/current-branch.txt"
printf '{"sha":"mainhead0"}' > "$STUB_DIR/main-commit.json"
printf '{"check_runs":[{"status":"completed","conclusion":"success"}]}' \
  > "$STUB_DIR/main-check-runs.json"
printf '[{"headSha":"mainhead0","conclusion":"success"}]' \
  > "$STUB_DIR/main-run-list.json"
if result=$("$TMPDIR_TEST/dispatch-select-target" --health-only); then rc=0; else rc=$?; fi
assert_eq "--health-only main green → ok" "ok" "$result"
assert_eq "--health-only main green → exit 0" "0" "$rc"
teardown

# 27b. --health-only, main red, not in a worktree → "main-broken <sha>", exit 0.
echo "Test: --health-only + main red → main-broken"
setup
echo '[]' > "$STUB_DIR/pr-list-union.json"
echo '[]' > "$STUB_DIR/issue-list.json"
printf 'worktree /repo\nHEAD abc123\n\n' > "$STUB_DIR/worktree-list.txt"
printf 'main' > "$STUB_DIR/current-branch.txt"
printf '{"sha":"mainhead0"}' > "$STUB_DIR/main-commit.json"
printf '{"check_runs":[{"status":"completed","conclusion":"failure"}]}' \
  > "$STUB_DIR/main-check-runs.json"
printf '[]' > "$STUB_DIR/main-run-list.json"
if result=$("$TMPDIR_TEST/dispatch-select-target" --health-only); then rc=0; else rc=$?; fi
assert_eq "--health-only main red → main-broken mainhead0" "main-broken mainhead0" "$result"
assert_eq "--health-only main red → exit 0" "0" "$rc"
teardown

# 27c. --health-only + <N>-* current branch + red main → main-broken (no bypass).
echo "Test: --health-only + issue-branch cwd + red main → main-broken (cwd ignored)"
setup
echo '[]' > "$STUB_DIR/pr-list-union.json"
echo '[]' > "$STUB_DIR/issue-list.json"
printf 'worktree /repo\nHEAD abc123\n\n' > "$STUB_DIR/worktree-list.txt"
printf '42-some-slug' > "$STUB_DIR/current-branch.txt"
printf '{"sha":"mainhead0"}' > "$STUB_DIR/main-commit.json"
printf '{"check_runs":[{"status":"completed","conclusion":"failure"}]}' \
  > "$STUB_DIR/main-check-runs.json"
printf '[]' > "$STUB_DIR/main-run-list.json"
if result=$("$TMPDIR_TEST/dispatch-select-target" --health-only); then rc=0; else rc=$?; fi
assert_eq "--health-only issue-branch cwd, red main → main-broken mainhead0" "main-broken mainhead0" "$result"
assert_eq "--health-only issue-branch cwd, red main → exit 0" "0" "$rc"
teardown

# 27d. --health-only --qa is mutually exclusive → exit non-zero, error on stderr.
echo "Test: --health-only + --qa → error"
setup
err_file="$TMPDIR_TEST/err.txt"
if "$TMPDIR_TEST/dispatch-select-target" --health-only --qa >/dev/null 2>"$err_file"; then
  rc=0
else
  rc=$?
fi
[[ "$rc" -ne 0 ]] && rc_nonzero=yes || rc_nonzero=no
assert_eq "--health-only --qa exits non-zero" "yes" "$rc_nonzero"
err_contents=$(cat "$err_file")
[[ "$err_contents" == *"mutually exclusive"* ]] && err_msg=ok || err_msg="missing: $err_contents"
assert_eq "--health-only --qa error mentions mutually exclusive" "ok" "$err_msg"
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

# 22. A code-review-phase PR winning emits the code-review phase on the result line.
echo "Test: code-review PR winner → pr <n> <branch> code-review"
setup
CODE_REVIEW_LABELS='[{"name":"dispatch:qa-done"}]'
UNION='['"$(make_pr_union 25 "25-code-review-me" "2024-01-01T00:00:00Z" "true" "$CODE_REVIEW_LABELS" "$GREEN_ROLLUP")"']'
setup_union_pr_list "$UNION"
echo '[]' > "$STUB_DIR/issue-list.json"
printf 'worktree /repo\nHEAD abc123\n\n' > "$STUB_DIR/worktree-list.txt"
result=$("$TMPDIR_TEST/dispatch-select-target")
assert_eq "code-review PR winner emits phase" "pr 25 25-code-review-me code-review" "$result"
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

# 24. Help-wanted issue whose <N>-* worktree has a live session is skipped; the
#     next-oldest issue is chosen.
echo "Test: issue with live-session worktree skipped; next-oldest issue chosen"
setup
setup_union_pr_list '[]'
# Issue 55 is older, issue 66 is newer. Issue 55 has a 55-* worktree.
printf '[{"number":55,"createdAt":"2024-01-01T00:00:00Z","labels":[{"name":"help wanted"}]},{"number":66,"createdAt":"2024-01-02T00:00:00Z","labels":[{"name":"help wanted"}]}]\n' \
  > "$STUB_DIR/issue-list.json"
printf 'worktree /repo\nHEAD abc123\n\nworktree /worktrees/55-some-feature\nHEAD def456\nbranch refs/heads/55-some-feature\n\n' \
  > "$STUB_DIR/worktree-list.txt"
select_target_fake_claude "55-some-feature"
result=$("$TMPDIR_TEST/dispatch-select-target")
assert_eq "issue with live-session worktree skipped; next issue 66 chosen" "issue 66" "$result"
teardown

# 24b. Help-wanted issue whose <N>-* worktree is an orphan (no live session) is
#      NOT skipped — it is selected and resolved to a leaf (#905).
echo "Test: issue with orphan worktree is not skipped"
setup
setup_union_pr_list '[]'
printf '[{"number":55,"createdAt":"2024-01-01T00:00:00Z","labels":[{"name":"help wanted"}]},{"number":66,"createdAt":"2024-01-02T00:00:00Z","labels":[{"name":"help wanted"}]}]\n' \
  > "$STUB_DIR/issue-list.json"
printf 'worktree /repo\nHEAD abc123\n\nworktree /worktrees/55-some-feature\nHEAD def456\nbranch refs/heads/55-some-feature\n\n' \
  > "$STUB_DIR/worktree-list.txt"
# No live sessions: 55's worktree is an orphan. dispatch-trace-leaf resolves the
# issue's own leaf (no open blockers / sub-issues stubbed → the issue itself).
select_target_fake_claude
result=$("$TMPDIR_TEST/dispatch-select-target")
assert_eq "issue with orphan worktree selected, not skipped" "issue 55" "$result"
teardown

# 25. A lone help-wanted issue whose worktree has a live session → empty
#     (nothing else queued).
echo "Test: lone live-session-worktree'd issue → empty"
setup
setup_union_pr_list '[]'
printf '[{"number":55,"createdAt":"2024-01-01T00:00:00Z","labels":[{"name":"help wanted"}]}]\n' > "$STUB_DIR/issue-list.json"
printf 'worktree /repo\nHEAD abc123\n\nworktree /worktrees/55-some-feature\nHEAD def456\nbranch refs/heads/55-some-feature\n\n' \
  > "$STUB_DIR/worktree-list.txt"
select_target_fake_claude "55-some-feature"
result=$("$TMPDIR_TEST/dispatch-select-target")
assert_eq "lone live-session-worktree'd issue → empty" "empty" "$result"
teardown

# 26. Live-session-worktree'd issue skipped; QA PR is next in line.
echo "Test: live-session-worktree'd issue skipped → QA PR selected"
setup
UNION='['"$(make_pr_union 20 "20-qa" "2024-01-01T00:00:00Z" "true" "$NO_LABELS" "$GREEN_ROLLUP")"']'
setup_union_pr_list "$UNION"
# The help-wanted issue would normally beat the QA PR, but a live session owns
# its worktree.
printf '[{"number":55,"createdAt":"2024-01-01T00:00:00Z","labels":[{"name":"help wanted"}]}]\n' > "$STUB_DIR/issue-list.json"
printf 'worktree /repo\nHEAD abc123\n\nworktree /worktrees/55-some-feature\nHEAD def456\nbranch refs/heads/55-some-feature\n\n' \
  > "$STUB_DIR/worktree-list.txt"
select_target_fake_claude "55-some-feature"
result=$("$TMPDIR_TEST/dispatch-select-target")
assert_eq "live-session-worktree'd issue skipped → QA PR returned" "pr 20 20-qa qa" "$result"
teardown

# 27. Prefix disambiguation: issue 6 is NOT masked by an unrelated worktree on branch 60-foo.
echo "Test: issue 6 not masked by worktree on branch 60-foo"
setup
setup_union_pr_list '[]'
printf '[{"number":6,"createdAt":"2024-01-01T00:00:00Z","labels":[{"name":"help wanted"}]}]\n' > "$STUB_DIR/issue-list.json"
# Worktree exists for 60-foo, not for 6-*.
printf 'worktree /repo\nHEAD abc123\n\nworktree /worktrees/60-foo\nHEAD def456\nbranch refs/heads/60-foo\n\n' \
  > "$STUB_DIR/worktree-list.txt"
result=$("$TMPDIR_TEST/dispatch-select-target")
assert_eq "issue 6 not masked by 60-foo worktree" "issue 6" "$result"
teardown

# --- topic-category prioritization (issue #707) -----------------------------
# A topic category (priority → bug → testing infrastructure → dispatch → other) nests
# outside the phase ladder. A PR's category is resolved from the labels of the
# issues it closes; an issue's category from its own labels.

# 28. A PR closing a `bug` issue outranks a PR closing a `dispatch` issue, even
#     when the dispatch PR is older — category beats age.
echo "Test: PR closing a bug issue beats PR closing a dispatch issue"
setup
# PR 20 (older) closes dispatch issue 200; PR 10 (newer) closes bug issue 100.
UNION='['
UNION+="$(make_pr_union 20 "20-dispatch-pr" "2024-01-01T00:00:00Z" "true" "$NO_LABELS" "$FAILING_ROLLUP" '[{"number":200}]')"','
UNION+="$(make_pr_union 10 "10-bug-pr" "2024-01-02T00:00:00Z" "true" "$NO_LABELS" "$FAILING_ROLLUP" '[{"number":100}]')"
UNION+=']'
setup_union_pr_list "$UNION"
# Issues 100/200 are the closing issues — they carry the topic label that the
# PRs inherit. No "help wanted" label, so they are not themselves queue items.
printf '[{"number":100,"createdAt":"2024-01-01T00:00:00Z","labels":[{"name":"bug"}]},{"number":200,"createdAt":"2024-01-01T00:00:00Z","labels":[{"name":"dispatch"}]}]\n' \
  > "$STUB_DIR/issue-list.json"
printf 'worktree /repo\nHEAD abc123\n\n' > "$STUB_DIR/worktree-list.txt"
result=$("$TMPDIR_TEST/dispatch-select-target")
assert_eq "bug-closing PR beats dispatch-closing PR" "pr 10 10-bug-pr verify" "$result"
teardown

# 29. A help-wanted issue labeled `testing infrastructure` outranks a help-wanted
#     issue with no topic label, even when the topic-labeled issue is newer.
echo "Test: testing-infrastructure issue beats issue with no topic label"
setup
setup_union_pr_list '[]'
# Issue 400 (older) has no topic label; issue 300 (newer) is testing infrastructure.
printf '[{"number":400,"createdAt":"2024-01-01T00:00:00Z","labels":[{"name":"help wanted"}]},{"number":300,"createdAt":"2024-01-02T00:00:00Z","labels":[{"name":"help wanted"},{"name":"testing infrastructure"}]}]\n' \
  > "$STUB_DIR/issue-list.json"
printf 'worktree /repo\nHEAD abc123\n\n' > "$STUB_DIR/worktree-list.txt"
result=$("$TMPDIR_TEST/dispatch-select-target")
assert_eq "testing-infrastructure issue beats untopiced issue" "issue 300" "$result"
teardown

# 30. A PR that closes no issue resolves to the `other` category — so a
#     help-wanted `bug` issue outranks it, even though within one category a
#     verify PR would beat the issue.
echo "Test: PR closing no issue ranks in 'other'"
setup
# PR 10 is verify-phase and closes no issue (make_pr_union's closing arg
# defaults to []). Issue 500 is a help-wanted bug.
UNION='['"$(make_pr_union 10 "10-no-closing" "2024-01-01T00:00:00Z" "true" "$NO_LABELS" "$FAILING_ROLLUP")"']'
setup_union_pr_list "$UNION"
printf '[{"number":500,"createdAt":"2024-01-01T00:00:00Z","labels":[{"name":"help wanted"},{"name":"bug"}]}]\n' \
  > "$STUB_DIR/issue-list.json"
printf 'worktree /repo\nHEAD abc123\n\n' > "$STUB_DIR/worktree-list.txt"
result=$("$TMPDIR_TEST/dispatch-select-target")
assert_eq "PR with no closing issue is 'other'; bug issue wins" "issue 500" "$result"
teardown

# 30b. A PR closing a plain `bug` issue outranks a PR closing a `priority`-only
#      issue — `priority` is a sub-axis nested inside each topic category, not
#      a top-level category. A `priority`-only issue resolves to topic `other`,
#      which ranks below `bug`. The older bug-closing PR wins.
echo "Test: PR closing a bug issue beats PR closing a priority-only issue"
setup
# PR 20 (older) closes bug issue 200; PR 10 (newer) closes priority-only issue 100.
UNION='['
UNION+="$(make_pr_union 20 "20-bug-pr" "2024-01-01T00:00:00Z" "true" "$NO_LABELS" "$FAILING_ROLLUP" '[{"number":200}]')"','
UNION+="$(make_pr_union 10 "10-priority-pr" "2024-01-02T00:00:00Z" "true" "$NO_LABELS" "$FAILING_ROLLUP" '[{"number":100}]')"
UNION+=']'
setup_union_pr_list "$UNION"
# Issues 100/200 are the closing issues — they carry the topic label that the
# PRs inherit. No "help wanted" label, so they are not themselves queue items.
printf '[{"number":100,"createdAt":"2024-01-01T00:00:00Z","labels":[{"name":"priority"}]},{"number":200,"createdAt":"2024-01-01T00:00:00Z","labels":[{"name":"bug"}]}]\n' \
  > "$STUB_DIR/issue-list.json"
printf 'worktree /repo\nHEAD abc123\n\n' > "$STUB_DIR/worktree-list.txt"
result=$("$TMPDIR_TEST/dispatch-select-target")
assert_eq "bug-closing PR beats priority-only-closing PR" "pr 20 20-bug-pr verify" "$result"
teardown

# 30c. A PR closing a `(bug, priority)` issue outranks a PR closing a plain
#      `bug` issue, even when the plain-bug PR is older — within the `bug`
#      topic category, `priority` items rank above non-`priority` items.
echo "Test: PR closing a (bug, priority) issue beats PR closing a plain bug issue"
setup
# PR 20 (older) closes plain bug issue 200; PR 10 (newer) closes (bug, priority) issue 100.
UNION='['
UNION+="$(make_pr_union 20 "20-bug-pr" "2024-01-01T00:00:00Z" "true" "$NO_LABELS" "$FAILING_ROLLUP" '[{"number":200}]')"','
UNION+="$(make_pr_union 10 "10-bug-priority-pr" "2024-01-02T00:00:00Z" "true" "$NO_LABELS" "$FAILING_ROLLUP" '[{"number":100}]')"
UNION+=']'
setup_union_pr_list "$UNION"
# Issue 100 carries both `bug` and `priority`; issue 200 carries only `bug`.
printf '[{"number":100,"createdAt":"2024-01-01T00:00:00Z","labels":[{"name":"bug"},{"name":"priority"}]},{"number":200,"createdAt":"2024-01-01T00:00:00Z","labels":[{"name":"bug"}]}]\n' \
  > "$STUB_DIR/issue-list.json"
printf 'worktree /repo\nHEAD abc123\n\n' > "$STUB_DIR/worktree-list.txt"
result=$("$TMPDIR_TEST/dispatch-select-target")
assert_eq "(bug, priority)-closing PR beats plain-bug-closing PR" "pr 10 10-bug-priority-pr verify" "$result"
teardown

# 30d. A PR closing a `(dispatch, priority)` issue ranks below every PR closing
#      a plain `bug` issue — `priority` is a sub-axis nested inside each topic
#      category, so it does not cross topic boundaries. The bug-closing PR wins.
echo "Test: PR closing a plain bug issue beats PR closing a (dispatch, priority) issue"
setup
# PR 10 (older) closes (dispatch, priority) issue 100; PR 20 (newer) closes plain bug issue 200.
UNION='['
UNION+="$(make_pr_union 10 "10-dispatch-priority-pr" "2024-01-01T00:00:00Z" "true" "$NO_LABELS" "$FAILING_ROLLUP" '[{"number":100}]')"','
UNION+="$(make_pr_union 20 "20-bug-pr" "2024-01-02T00:00:00Z" "true" "$NO_LABELS" "$FAILING_ROLLUP" '[{"number":200}]')"
UNION+=']'
setup_union_pr_list "$UNION"
# Issue 100 carries both `dispatch` and `priority`; issue 200 carries only `bug`.
printf '[{"number":100,"createdAt":"2024-01-01T00:00:00Z","labels":[{"name":"dispatch"},{"name":"priority"}]},{"number":200,"createdAt":"2024-01-01T00:00:00Z","labels":[{"name":"bug"}]}]\n' \
  > "$STUB_DIR/issue-list.json"
printf 'worktree /repo\nHEAD abc123\n\n' > "$STUB_DIR/worktree-list.txt"
result=$("$TMPDIR_TEST/dispatch-select-target")
assert_eq "plain-bug PR beats (dispatch, priority) PR — priority does not cross topics" "pr 20 20-bug-pr verify" "$result"
teardown

# 30e. The 2026-05-29 reproduction (#905). A queue of bug+priority PRs, all but
#      one carrying an *orphan* worktree, alongside a lower-priority bug
#      help-wanted issue with no worktree. Before the fix the orphan worktrees
#      skipped every priority PR and the selector fell through to the
#      help-wanted issue, violating the priority order. After the fix only the
#      live-session-owned PR (#898) is skipped; the oldest remaining
#      security-phase priority PR (#895) wins.
echo "Test: orphan-worktree bug+priority PRs still beat a no-worktree help-wanted issue (#905)"
setup
UNION='['
UNION+="$(make_pr_union 898 "898-security" "2026-05-20T00:00:00Z" "true" '[{"name":"dispatch:security-reviewed"}]' "$GREEN_ROLLUP" '[{"number":896}]')"','
UNION+="$(make_pr_union 895 "895-security" "2026-05-21T00:00:00Z" "true" '[{"name":"dispatch:security-reviewed"}]' "$GREEN_ROLLUP" '[{"number":806}]')"','
UNION+="$(make_pr_union 893 "893-qa" "2026-05-22T00:00:00Z" "true" "$NO_LABELS" "$GREEN_ROLLUP" '[{"number":892}]')"','
UNION+="$(make_pr_union 883 "883-qa" "2026-05-23T00:00:00Z" "true" "$NO_LABELS" "$GREEN_ROLLUP" '[{"number":879}]')"
UNION+=']'
setup_union_pr_list "$UNION"
# Each PR's closing issue carries bug + priority; issue 886 is a lower-priority
# (no `priority`) bug help-wanted issue with no worktree.
printf '%s\n' '[{"number":896,"createdAt":"2026-05-01T00:00:00Z","labels":[{"name":"bug"},{"name":"priority"}]},{"number":806,"createdAt":"2026-05-01T00:00:00Z","labels":[{"name":"bug"},{"name":"priority"}]},{"number":892,"createdAt":"2026-05-01T00:00:00Z","labels":[{"name":"bug"},{"name":"priority"}]},{"number":879,"createdAt":"2026-05-01T00:00:00Z","labels":[{"name":"bug"},{"name":"priority"}]},{"number":886,"createdAt":"2026-05-02T00:00:00Z","labels":[{"name":"bug"},{"name":"help wanted"}]}]' \
  > "$STUB_DIR/issue-list.json"
# Worktrees exist for all four PR branches; none for issue 886.
printf 'worktree /repo\nHEAD abc123\n\nworktree /worktrees/898-security\nHEAD a1\nbranch refs/heads/898-security\n\nworktree /worktrees/895-security\nHEAD a2\nbranch refs/heads/895-security\n\nworktree /worktrees/893-qa\nHEAD a3\nbranch refs/heads/893-qa\n\nworktree /worktrees/883-qa\nHEAD a4\nbranch refs/heads/883-qa\n\n' \
  > "$STUB_DIR/worktree-list.txt"
# Only #898's worktree has a live session; #895/#893/#883 are orphans.
select_target_fake_claude "898-security"
result=$("$TMPDIR_TEST/dispatch-select-target")
assert_eq "orphan priority PRs not skipped; oldest security priority PR wins" "pr 895 895-security security" "$result"
teardown

# --- blocked-issue PR skip (issue #786) -------------------------------------
# dispatch-select-target skips a PR from every PR-ladder tier when any issue it
# closes is blocked_by an open issue; a closing issue blocked only by
# already-closed issues does not gate. The skip runs before FIRST_PR is
# populated, so --qa mode inherits it. The gh stub serves
# api */dependencies/blocked_by from blockers-<num>.json (default []).

# 31. A PR whose closing issue is blocked_by an open issue is skipped; the
#     next eligible PR is selected.
echo "Test: PR closing a blocked issue is skipped"
setup
# PR 10 (older) closes issue 100, blocked_by open issue 999; PR 20 (newer)
# closes issue 200, which has no blocker.
UNION='['
UNION+="$(make_pr_union 10 "10-blocked-pr" "2024-01-01T00:00:00Z" "true" "$NO_LABELS" "$FAILING_ROLLUP" '[{"number":100}]')"','
UNION+="$(make_pr_union 20 "20-clear-pr" "2024-01-02T00:00:00Z" "true" "$NO_LABELS" "$FAILING_ROLLUP" '[{"number":200}]')"
UNION+=']'
setup_union_pr_list "$UNION"
echo '[]' > "$STUB_DIR/issue-list.json"
printf '[{"number":999,"state":"open"}]\n' > "$STUB_DIR/blockers-100.json"
printf 'worktree /repo\nHEAD abc123\n\n' > "$STUB_DIR/worktree-list.txt"
result=$("$TMPDIR_TEST/dispatch-select-target")
assert_eq "PR closing a blocked issue skipped → next PR chosen" "pr 20 20-clear-pr verify" "$result"
teardown

# 32. A PR whose closing issue is blocked only by an already-closed issue is
#     NOT skipped — a closed blocker does not gate work.
echo "Test: PR closing an issue blocked only by a closed issue is not skipped"
setup
UNION='['"$(make_pr_union 10 "10-clear-pr" "2024-01-01T00:00:00Z" "true" "$NO_LABELS" "$FAILING_ROLLUP" '[{"number":100}]')"']'
setup_union_pr_list "$UNION"
echo '[]' > "$STUB_DIR/issue-list.json"
printf '[{"number":888,"state":"closed"}]\n' > "$STUB_DIR/blockers-100.json"
printf 'worktree /repo\nHEAD abc123\n\n' > "$STUB_DIR/worktree-list.txt"
result=$("$TMPDIR_TEST/dispatch-select-target")
assert_eq "closed-only blocker does not gate → PR 10 chosen" "pr 10 10-clear-pr verify" "$result"
teardown

# 33. --qa mode inherits the blocked-PR skip: the older QA PR closes a blocked
#     issue, so --qa returns the newer unblocked QA PR.
echo "Test: --qa mode skips a QA PR closing a blocked issue"
setup
UNION='['
UNION+="$(make_pr_union 10 "10-blocked-qa" "2024-01-01T00:00:00Z" "true" "$NO_LABELS" "$GREEN_ROLLUP" '[{"number":100}]')"','
UNION+="$(make_pr_union 20 "20-clear-qa" "2024-01-02T00:00:00Z" "true" "$NO_LABELS" "$GREEN_ROLLUP" '[{"number":200}]')"
UNION+=']'
setup_union_pr_list "$UNION"
echo '[]' > "$STUB_DIR/issue-list.json"
printf '[{"number":999,"state":"open"}]\n' > "$STUB_DIR/blockers-100.json"
printf 'worktree /repo\nHEAD abc123\n\n' > "$STUB_DIR/worktree-list.txt"
result=$("$TMPDIR_TEST/dispatch-select-target" --qa)
assert_eq "--qa skips QA PR closing a blocked issue → newer QA PR" "pr 20 20-clear-qa" "$result"
teardown

# 34. A PR closing multiple issues where any one is blocked_by an open issue is
#     skipped — the inner loop must check ALL closing issues, not just the first.
echo "Test: multi-issue PR — any closing issue blocked → PR skipped"
setup
# PR 10 closes issues 100 (unblocked) and 101 (blocked by open 999); PR 20 closes 200 (unblocked).
UNION='['
UNION+="$(make_pr_union 10 "10-multi-blocked-pr" "2024-01-01T00:00:00Z" "true" "$NO_LABELS" "$FAILING_ROLLUP" '[{"number":100},{"number":101}]')"','
UNION+="$(make_pr_union 20 "20-clear-pr" "2024-01-02T00:00:00Z" "true" "$NO_LABELS" "$FAILING_ROLLUP" '[{"number":200}]')"
UNION+=']'
setup_union_pr_list "$UNION"
echo '[]' > "$STUB_DIR/issue-list.json"
# Issue 100: no blockers. Issue 101: blocked by open 999.
printf '[]\n' > "$STUB_DIR/blockers-100.json"
printf '[{"number":999,"state":"open"}]\n' > "$STUB_DIR/blockers-101.json"
printf 'worktree /repo\nHEAD abc123\n\n' > "$STUB_DIR/worktree-list.txt"
result=$("$TMPDIR_TEST/dispatch-select-target")
assert_eq "multi-issue PR with later blocked issue → skipped → next PR chosen" "pr 20 20-clear-pr verify" "$result"
teardown

# --- help-wanted leaf reachability (issue #715) -----------------------------
# dispatch-select-target runs dispatch-trace-leaf <N> queue for each help-wanted
# candidate and skips any whose subtree is fully worktree-conflicted (trace
# exits 2), exactly as a direct worktree is skipped. Sub-issue 5500 sits on
# branch 5500-blocked, which does NOT prefix-match 55-, so issue 55 is never
# falsely flagged as directly worktree'd.

# 35. A help-wanted issue with a fully worktree-conflicted subtree is skipped;
#     the next help-wanted issue is selected.
echo "Test: subtree-blocked help-wanted issue skipped → next issue chosen"
setup
setup_union_pr_list '[]'
# Issue 55 (older) has open sub-issue 5500; issue 66 (newer) has no children.
printf '[{"number":55,"createdAt":"2024-01-01T00:00:00Z","labels":[{"name":"help wanted"}]},{"number":66,"createdAt":"2024-01-02T00:00:00Z","labels":[{"name":"help wanted"}]}]\n' \
  > "$STUB_DIR/issue-list.json"
printf '[{"number":5500}]\n' > "$STUB_DIR/subissues-55.json"
printf '{"title":"Issue 5500","body":"","comments":[],"number":5500,"state":"OPEN"}\n' \
  > "$STUB_DIR/issue-5500.json"
# Sub-issue 5500's worktree exists (owned by another session) → trace 55 exits 2.
printf 'worktree /repo\nHEAD abc123\n\nworktree /worktrees/5500-blocked\nHEAD def456\nbranch refs/heads/5500-blocked\n\n' \
  > "$STUB_DIR/worktree-list.txt"
result=$("$TMPDIR_TEST/dispatch-select-target")
assert_eq "subtree-blocked issue 55 skipped → issue 66 chosen" "issue 66" "$result"
teardown

# 36. Every help-wanted issue is subtree-blocked → falls through to a QA PR.
echo "Test: all help-wanted issues subtree-blocked → QA PR selected"
setup
UNION='['"$(make_pr_union 20 "20-qa" "2024-01-01T00:00:00Z" "true" "$NO_LABELS" "$GREEN_ROLLUP")"']'
setup_union_pr_list "$UNION"
printf '[{"number":55,"createdAt":"2024-01-01T00:00:00Z","labels":[{"name":"help wanted"}]}]\n' > "$STUB_DIR/issue-list.json"
printf '[{"number":5500}]\n' > "$STUB_DIR/subissues-55.json"
printf '{"title":"Issue 5500","body":"","comments":[],"number":5500,"state":"OPEN"}\n' \
  > "$STUB_DIR/issue-5500.json"
printf 'worktree /repo\nHEAD abc123\n\nworktree /worktrees/5500-blocked\nHEAD def456\nbranch refs/heads/5500-blocked\n\n' \
  > "$STUB_DIR/worktree-list.txt"
result=$("$TMPDIR_TEST/dispatch-select-target")
assert_eq "subtree-blocked issue 55 → falls through to QA PR" "pr 20 20-qa qa" "$result"
teardown

# 37. Every help-wanted issue is subtree-blocked and no QA PR → empty.
echo "Test: all help-wanted issues subtree-blocked, no QA PR → empty"
setup
setup_union_pr_list '[]'
printf '[{"number":55,"createdAt":"2024-01-01T00:00:00Z","labels":[{"name":"help wanted"}]}]\n' > "$STUB_DIR/issue-list.json"
printf '[{"number":5500}]\n' > "$STUB_DIR/subissues-55.json"
printf '{"title":"Issue 5500","body":"","comments":[],"number":5500,"state":"OPEN"}\n' \
  > "$STUB_DIR/issue-5500.json"
printf 'worktree /repo\nHEAD abc123\n\nworktree /worktrees/5500-blocked\nHEAD def456\nbranch refs/heads/5500-blocked\n\n' \
  > "$STUB_DIR/worktree-list.txt"
result=$("$TMPDIR_TEST/dispatch-select-target")
assert_eq "subtree-blocked issue 55, no QA PR → empty" "empty" "$result"
teardown

# 38. A help-wanted issue with a startable open leaf emits the resolved leaf
#     number (which differs from the top-level issue).
echo "Test: help-wanted issue resolves to its startable leaf"
setup
setup_union_pr_list '[]'
printf '[{"number":55,"createdAt":"2024-01-01T00:00:00Z","labels":[{"name":"help wanted"}]}]\n' > "$STUB_DIR/issue-list.json"
printf '[{"number":5500}]\n' > "$STUB_DIR/subissues-55.json"
printf '{"title":"Issue 5500","body":"","comments":[],"number":5500,"state":"OPEN"}\n' \
  > "$STUB_DIR/issue-5500.json"
# No worktree for 5500 — the leaf is startable.
printf 'worktree /repo\nHEAD abc123\n\n' > "$STUB_DIR/worktree-list.txt"
result=$("$TMPDIR_TEST/dispatch-select-target")
assert_eq "help-wanted issue 55 resolves to leaf 5500" "issue 5500" "$result"
teardown

# 39. dispatch-trace-leaf exit 1 (usage error) is a hard failure, never a skip.
echo "Test: dispatch-trace-leaf exit 1 → dispatch-select-target hard-fails"
setup
setup_union_pr_list '[]'
printf '[{"number":55,"createdAt":"2024-01-01T00:00:00Z","labels":[{"name":"help wanted"}]}]\n' > "$STUB_DIR/issue-list.json"
printf 'worktree /repo\nHEAD abc123\n\n' > "$STUB_DIR/worktree-list.txt"
# Replace the copied leaf-trace script with a stub that always exits 1.
cat > "$TMPDIR_TEST/dispatch-trace-leaf" <<'STUB'
#!/usr/bin/env bash
echo "error: usage" >&2
exit 1
STUB
chmod +x "$TMPDIR_TEST/dispatch-trace-leaf"
if result=$("$TMPDIR_TEST/dispatch-select-target" 2>/dev/null); then rc=0; else rc=$?; fi
[[ "$rc" -ne 0 ]] && rc_nonzero=yes || rc_nonzero=no
assert_eq "dispatch-trace-leaf exit 1 → select-target exits non-zero" "yes" "$rc_nonzero"
[[ "$result" != issue* ]] && no_issue=yes || no_issue=no
assert_eq "dispatch-trace-leaf exit 1 → no issue line emitted" "yes" "$no_issue"
teardown

# --- ready-PR gate (#920) ---
# An open help-wanted issue whose closing PR is non-draft (ready) is excluded
# from the issue queue. The gate uses closingIssuesReferences from PR_LIST —
# no extra gh call. A *draft* closing PR must NOT gate the issue.

# 40. An open issue closed by a non-draft (ready) PR is excluded from the issue
#     queue. The non-draft PR itself is skipped at the phase level (done), but
#     the issue must also be excluded so no worker is wasted deriving "done".
echo "Test: open issue closed by non-draft PR is excluded from issue queue (#920)"
setup
# Non-draft PR 10 closes issue 55 (help-wanted). PR phase will be "done" and
# skipped in the PR loop; issue 55 must also be gated out by READY_PR_CLOSED_ISSUES.
# Issue 66 is also help-wanted and not closed by any PR — it should be selected.
UNION='['"$(make_pr_union 10 "10-ready-pr" "2024-01-01T00:00:00Z" "false" "$NO_LABELS" "$GREEN_ROLLUP" '[{"number":55}]')"']'
setup_union_pr_list "$UNION"
printf '[{"number":55,"createdAt":"2024-01-01T00:00:00Z","labels":[{"name":"help wanted"}]},{"number":66,"createdAt":"2024-01-02T00:00:00Z","labels":[{"name":"help wanted"}]}]\n' \
  > "$STUB_DIR/issue-list.json"
printf 'worktree /repo\nHEAD abc123\n\n' > "$STUB_DIR/worktree-list.txt"
result=$("$TMPDIR_TEST/dispatch-select-target")
assert_eq "issue closed by non-draft PR excluded; next issue selected" "issue 66" "$result"
teardown

# 41. A draft closing PR does NOT gate the issue — a stalled/orphaned draft is
#     the normal in-flight dispatch state and must leave the issue selectable so
#     the chain can resume by recycling the worktree.
#     To observe the issue-queue path: the draft PR is in waiting phase (pending
#     CI), so it is skipped in the PR loop, leaving only the issue queue.
echo "Test: open issue closed only by a draft PR is still selected (#920)"
setup
# Draft PR 10 (pending CI → waiting phase, skipped) closes issue 55 (help-wanted).
# isDraft=true → must NOT gate issue 55. Waiting phase skip clears the PR from
# the ladder, so issue 55 is the only remaining candidate.
UNION='['"$(make_pr_union 10 "10-draft-pr" "2024-01-01T00:00:00Z" "true" "$NO_LABELS" "$PENDING_ROLLUP" '[{"number":55}]')"']'
setup_union_pr_list "$UNION"
printf '[{"number":55,"createdAt":"2024-01-01T00:00:00Z","labels":[{"name":"help wanted"}]}]\n' \
  > "$STUB_DIR/issue-list.json"
printf 'worktree /repo\nHEAD abc123\n\n' > "$STUB_DIR/worktree-list.txt"
result=$("$TMPDIR_TEST/dispatch-select-target")
assert_eq "issue closed only by draft PR is still selectable" "issue 55" "$result"
teardown

# ============================================================================
# --- JIT scan ---
# dispatch-select-target's JIT scan runs before the main-broken health gate.
# It is inert with no jit.json.
# A JIT test seeds:
#   $DISPATCH_CONFIG_DIR/jit.json       — the jit definitions
#   $DISPATCH_CONFIG_DIR/projects.json  — the project catalog
#   $STUB_DIR/jit-issues-open-<label>.json   — the jit's open issue(s)
#   $STUB_DIR/jit-issues-closed-<label>.json — closed issues (cadence jits)
#   $STUB_DIR/project-item-list.json    — the project's items, by content.url
# Sanitized label = label with '/' and ':' replaced by '_'.
# ============================================================================

# A one-project catalog reused by the JIT tests below.
JIT_PROJECTS_JSON='{
  "projects": [
    { "key": "household", "owner": "natb1", "number": 5,
      "statusField": "Status", "statusInProgress": "In Progress",
      "statusDone": "Done" }
  ]
}'

# JS1. No jit.json → the scan is skipped and selection behaves as today.
echo "Test: JIT scan — no jit.json → scan skipped, normal selection"
setup
# No jit.json written into $DISPATCH_CONFIG_DIR. Seed a normal issue queue.
echo '[]' > "$STUB_DIR/pr-list-union.json"
printf '[{"number":55,"createdAt":"2024-03-01T00:00:00Z","labels":[{"name":"help wanted"}]}]\n' > "$STUB_DIR/issue-list.json"
printf 'worktree /repo\nHEAD abc123\n\n' > "$STUB_DIR/worktree-list.txt"
result=$("$TMPDIR_TEST/dispatch-select-target")
assert_eq "no jit.json → scan inert, normal selection" "issue 55" "$result"
teardown

# JS2. Cadence jit with a prior closed issue → due from closedAt + dueAfterClose.
echo "Test: JIT scan — cadence jit, prior closed issue → jit-reminder"
setup
printf '%s\n' "$JIT_PROJECTS_JSON" > "$DISPATCH_CONFIG_DIR/projects.json"
cat > "$DISPATCH_CONFIG_DIR/jit.json" <<'EOF'
{ "jits": [
  { "key": "daily-chore", "repo": "natb1/household", "label": "jit:daily-chore",
    "title": "Daily chore", "body": "Recurring daily chore.",
    "project": "household", "remindAfterClose": "12h", "dueAfterClose": "24h" }
] }
EOF
printf '[{"number":42,"createdAt":"2026-05-01T00:00:00Z"}]\n' \
  > "$STUB_DIR/jit-issues-open-jit_daily-chore.json"
printf '[{"closedAt":"2026-05-10T00:00:00Z"}]\n' \
  > "$STUB_DIR/jit-issues-closed-jit_daily-chore.json"
printf '{"items":[{"id":"PVTI_001","content":{"url":"https://github.com/natb1/household/issues/42"},"status":"Todo"}]}\n' \
  > "$STUB_DIR/project-item-list.json"
echo '[]' > "$STUB_DIR/pr-list-union.json"
echo '[]' > "$STUB_DIR/issue-list.json"
printf 'worktree /repo\nHEAD abc123\n\n' > "$STUB_DIR/worktree-list.txt"
result=$("$TMPDIR_TEST/dispatch-select-target")
assert_eq "cadence jit with closed issue → jit-reminder" \
  "jit-reminder natb1/household 42 household PVTI_001" "$result"
teardown

# JS3. Cadence jit, no closed issue → cold-start due from
#      createdAt + dueAfterClose − remindAfterClose.
echo "Test: JIT scan — cadence jit, cold start (no closed issue) → jit-reminder"
setup
printf '%s\n' "$JIT_PROJECTS_JSON" > "$DISPATCH_CONFIG_DIR/projects.json"
cat > "$DISPATCH_CONFIG_DIR/jit.json" <<'EOF'
{ "jits": [
  { "key": "daily-chore", "repo": "natb1/household", "label": "jit:daily-chore",
    "title": "Daily chore", "body": "Recurring daily chore.",
    "project": "household", "remindAfterClose": "12h", "dueAfterClose": "24h" }
] }
EOF
printf '[{"number":42,"createdAt":"2026-05-01T00:00:00Z"}]\n' \
  > "$STUB_DIR/jit-issues-open-jit_daily-chore.json"
# No closed-issue fixture → cold start.
printf '{"items":[{"id":"PVTI_001","content":{"url":"https://github.com/natb1/household/issues/42"},"status":"Todo"}]}\n' \
  > "$STUB_DIR/project-item-list.json"
echo '[]' > "$STUB_DIR/pr-list-union.json"
echo '[]' > "$STUB_DIR/issue-list.json"
printf 'worktree /repo\nHEAD abc123\n\n' > "$STUB_DIR/worktree-list.txt"
result=$("$TMPDIR_TEST/dispatch-select-target")
assert_eq "cadence jit cold start → jit-reminder" \
  "jit-reminder natb1/household 42 household PVTI_001" "$result"
teardown

# JS4. Check-script jit → due from createdAt + dueAfterCreate.
echo "Test: JIT scan — check-script jit → jit-reminder"
setup
printf '%s\n' "$JIT_PROJECTS_JSON" > "$DISPATCH_CONFIG_DIR/projects.json"
cat > "$DISPATCH_CONFIG_DIR/jit.json" <<'EOF'
{ "jits": [
  { "key": "email-review", "repo": "natb1/household", "label": "jit:email-review",
    "title": "Email review", "body": "Review the inbox.",
    "project": "household", "dueAfterCreate": "48h" }
] }
EOF
printf '[{"number":77,"createdAt":"2026-05-01T00:00:00Z"}]\n' \
  > "$STUB_DIR/jit-issues-open-jit_email-review.json"
printf '{"items":[{"id":"PVTI_077","content":{"url":"https://github.com/natb1/household/issues/77"},"status":"Todo"}]}\n' \
  > "$STUB_DIR/project-item-list.json"
echo '[]' > "$STUB_DIR/pr-list-union.json"
echo '[]' > "$STUB_DIR/issue-list.json"
printf 'worktree /repo\nHEAD abc123\n\n' > "$STUB_DIR/worktree-list.txt"
result=$("$TMPDIR_TEST/dispatch-select-target")
assert_eq "check-script jit → jit-reminder" \
  "jit-reminder natb1/household 77 household PVTI_077" "$result"
teardown

# JS5a. In-Progress exclusion → the jit is skipped, selection falls through.
echo "Test: JIT scan — In Progress status excludes the jit"
setup
printf '%s\n' "$JIT_PROJECTS_JSON" > "$DISPATCH_CONFIG_DIR/projects.json"
cat > "$DISPATCH_CONFIG_DIR/jit.json" <<'EOF'
{ "jits": [
  { "key": "daily-chore", "repo": "natb1/household", "label": "jit:daily-chore",
    "title": "Daily chore", "body": "Recurring daily chore.",
    "project": "household", "remindAfterClose": "12h", "dueAfterClose": "24h" }
] }
EOF
printf '[{"number":42,"createdAt":"2026-05-01T00:00:00Z"}]\n' \
  > "$STUB_DIR/jit-issues-open-jit_daily-chore.json"
printf '[{"closedAt":"2026-05-10T00:00:00Z"}]\n' \
  > "$STUB_DIR/jit-issues-closed-jit_daily-chore.json"
printf '{"items":[{"id":"PVTI_001","content":{"url":"https://github.com/natb1/household/issues/42"},"status":"In Progress"}]}\n' \
  > "$STUB_DIR/project-item-list.json"
echo '[]' > "$STUB_DIR/pr-list-union.json"
printf '[{"number":55,"createdAt":"2024-03-01T00:00:00Z","labels":[{"name":"help wanted"}]}]\n' > "$STUB_DIR/issue-list.json"
printf 'worktree /repo\nHEAD abc123\n\n' > "$STUB_DIR/worktree-list.txt"
result=$("$TMPDIR_TEST/dispatch-select-target")
assert_eq "In Progress jit excluded → falls through to issue queue" "issue 55" "$result"
teardown

# JS5b. Done exclusion → the jit is skipped, selection falls through.
echo "Test: JIT scan — Done status excludes the jit"
setup
printf '%s\n' "$JIT_PROJECTS_JSON" > "$DISPATCH_CONFIG_DIR/projects.json"
cat > "$DISPATCH_CONFIG_DIR/jit.json" <<'EOF'
{ "jits": [
  { "key": "daily-chore", "repo": "natb1/household", "label": "jit:daily-chore",
    "title": "Daily chore", "body": "Recurring daily chore.",
    "project": "household", "remindAfterClose": "12h", "dueAfterClose": "24h" }
] }
EOF
printf '[{"number":42,"createdAt":"2026-05-01T00:00:00Z"}]\n' \
  > "$STUB_DIR/jit-issues-open-jit_daily-chore.json"
printf '[{"closedAt":"2026-05-10T00:00:00Z"}]\n' \
  > "$STUB_DIR/jit-issues-closed-jit_daily-chore.json"
printf '{"items":[{"id":"PVTI_001","content":{"url":"https://github.com/natb1/household/issues/42"},"status":"Done"}]}\n' \
  > "$STUB_DIR/project-item-list.json"
echo '[]' > "$STUB_DIR/pr-list-union.json"
echo '[]' > "$STUB_DIR/issue-list.json"
printf 'worktree /repo\nHEAD abc123\n\n' > "$STUB_DIR/worktree-list.txt"
result=$("$TMPDIR_TEST/dispatch-select-target")
assert_eq "Done jit excluded → falls through to empty" "empty" "$result"
teardown

# JS6. Two eligible jits → the earlier-due one wins (verifies due arithmetic).
echo "Test: JIT scan — two eligible jits, earlier due wins"
setup
printf '%s\n' "$JIT_PROJECTS_JSON" > "$DISPATCH_CONFIG_DIR/projects.json"
cat > "$DISPATCH_CONFIG_DIR/jit.json" <<'EOF'
{ "jits": [
  { "key": "jit-a", "repo": "natb1/household", "label": "jit:jit-a",
    "title": "Jit A", "body": "Jit A.", "project": "household",
    "remindAfterClose": "12h", "dueAfterClose": "24h" },
  { "key": "jit-b", "repo": "natb1/household", "label": "jit:jit-b",
    "title": "Jit B", "body": "Jit B.", "project": "household",
    "remindAfterClose": "12h", "dueAfterClose": "24h" }
] }
EOF
# jit-a: closed 2026-05-10 → due 2026-05-11. jit-b: closed 2026-05-05 → due
# 2026-05-06 — earlier, so jit-b wins.
printf '[{"number":10,"createdAt":"2026-05-01T00:00:00Z"}]\n' \
  > "$STUB_DIR/jit-issues-open-jit_jit-a.json"
printf '[{"closedAt":"2026-05-10T00:00:00Z"}]\n' \
  > "$STUB_DIR/jit-issues-closed-jit_jit-a.json"
printf '[{"number":20,"createdAt":"2026-05-01T00:00:00Z"}]\n' \
  > "$STUB_DIR/jit-issues-open-jit_jit-b.json"
printf '[{"closedAt":"2026-05-05T00:00:00Z"}]\n' \
  > "$STUB_DIR/jit-issues-closed-jit_jit-b.json"
printf '{"items":[{"id":"PVTI_010","content":{"url":"https://github.com/natb1/household/issues/10"},"status":"Todo"},{"id":"PVTI_020","content":{"url":"https://github.com/natb1/household/issues/20"},"status":"Todo"}]}\n' \
  > "$STUB_DIR/project-item-list.json"
echo '[]' > "$STUB_DIR/pr-list-union.json"
echo '[]' > "$STUB_DIR/issue-list.json"
printf 'worktree /repo\nHEAD abc123\n\n' > "$STUB_DIR/worktree-list.txt"
result=$("$TMPDIR_TEST/dispatch-select-target")
assert_eq "two jits → earlier-due jit-b wins" \
  "jit-reminder natb1/household 20 household PVTI_020" "$result"
teardown

# JS6b. Flip the offsets so the other jit wins — ordering is genuinely
#       due-driven, not fixture-order-driven.
echo "Test: JIT scan — two eligible jits, ordering flips with the offsets"
setup
printf '%s\n' "$JIT_PROJECTS_JSON" > "$DISPATCH_CONFIG_DIR/projects.json"
cat > "$DISPATCH_CONFIG_DIR/jit.json" <<'EOF'
{ "jits": [
  { "key": "jit-a", "repo": "natb1/household", "label": "jit:jit-a",
    "title": "Jit A", "body": "Jit A.", "project": "household",
    "remindAfterClose": "12h", "dueAfterClose": "24h" },
  { "key": "jit-b", "repo": "natb1/household", "label": "jit:jit-b",
    "title": "Jit B", "body": "Jit B.", "project": "household",
    "remindAfterClose": "12h", "dueAfterClose": "24h" }
] }
EOF
# jit-a: closed 2026-05-01 → due 2026-05-02 — now the earlier one, jit-a wins.
printf '[{"number":10,"createdAt":"2026-05-01T00:00:00Z"}]\n' \
  > "$STUB_DIR/jit-issues-open-jit_jit-a.json"
printf '[{"closedAt":"2026-05-01T00:00:00Z"}]\n' \
  > "$STUB_DIR/jit-issues-closed-jit_jit-a.json"
printf '[{"number":20,"createdAt":"2026-05-01T00:00:00Z"}]\n' \
  > "$STUB_DIR/jit-issues-open-jit_jit-b.json"
printf '[{"closedAt":"2026-05-05T00:00:00Z"}]\n' \
  > "$STUB_DIR/jit-issues-closed-jit_jit-b.json"
printf '{"items":[{"id":"PVTI_010","content":{"url":"https://github.com/natb1/household/issues/10"},"status":"Todo"},{"id":"PVTI_020","content":{"url":"https://github.com/natb1/household/issues/20"},"status":"Todo"}]}\n' \
  > "$STUB_DIR/project-item-list.json"
echo '[]' > "$STUB_DIR/pr-list-union.json"
echo '[]' > "$STUB_DIR/issue-list.json"
printf 'worktree /repo\nHEAD abc123\n\n' > "$STUB_DIR/worktree-list.txt"
result=$("$TMPDIR_TEST/dispatch-select-target")
assert_eq "flipped offsets → earlier-due jit-a wins" \
  "jit-reminder natb1/household 10 household PVTI_010" "$result"
teardown

# JS7. jit-reminder is emitted even when origin/main is red — the scan runs
#      before the main-broken gate.
echo "Test: JIT scan — jit-reminder emitted even when origin/main is red"
setup
printf '%s\n' "$JIT_PROJECTS_JSON" > "$DISPATCH_CONFIG_DIR/projects.json"
cat > "$DISPATCH_CONFIG_DIR/jit.json" <<'EOF'
{ "jits": [
  { "key": "daily-chore", "repo": "natb1/household", "label": "jit:daily-chore",
    "title": "Daily chore", "body": "Recurring daily chore.",
    "project": "household", "remindAfterClose": "12h", "dueAfterClose": "24h" }
] }
EOF
printf '[{"number":42,"createdAt":"2026-05-01T00:00:00Z"}]\n' \
  > "$STUB_DIR/jit-issues-open-jit_daily-chore.json"
printf '[{"closedAt":"2026-05-10T00:00:00Z"}]\n' \
  > "$STUB_DIR/jit-issues-closed-jit_daily-chore.json"
printf '{"items":[{"id":"PVTI_001","content":{"url":"https://github.com/natb1/household/issues/42"},"status":"Todo"}]}\n' \
  > "$STUB_DIR/project-item-list.json"
echo '[]' > "$STUB_DIR/pr-list-union.json"
echo '[]' > "$STUB_DIR/issue-list.json"
printf 'worktree /repo\nHEAD abc123\n\n' > "$STUB_DIR/worktree-list.txt"
# Red main: a failing check-run on main's HEAD.
printf '{"sha":"mainhead0"}' > "$STUB_DIR/main-commit.json"
printf '{"check_runs":[{"status":"completed","conclusion":"failure"}]}' \
  > "$STUB_DIR/main-check-runs.json"
printf '[]' > "$STUB_DIR/main-run-list.json"
result=$("$TMPDIR_TEST/dispatch-select-target")
assert_eq "jit-reminder beats red main (default mode)" \
  "jit-reminder natb1/household 42 household PVTI_001" "$result"
# Same in --health-only mode.
result=$("$TMPDIR_TEST/dispatch-select-target" --health-only)
assert_eq "jit-reminder beats red main (--health-only mode)" \
  "jit-reminder natb1/household 42 household PVTI_001" "$result"
teardown

# JS8. A jit with no open issue contributes no candidate → falls through.
echo "Test: JIT scan — jit with no open issue contributes no candidate"
setup
printf '%s\n' "$JIT_PROJECTS_JSON" > "$DISPATCH_CONFIG_DIR/projects.json"
cat > "$DISPATCH_CONFIG_DIR/jit.json" <<'EOF'
{ "jits": [
  { "key": "daily-chore", "repo": "natb1/household", "label": "jit:daily-chore",
    "title": "Daily chore", "body": "Recurring daily chore.",
    "project": "household", "remindAfterClose": "12h", "dueAfterClose": "24h" }
] }
EOF
# No open-issue fixture → the gh stub returns [] → no candidate.
echo '[]' > "$STUB_DIR/pr-list-union.json"
printf '[{"number":55,"createdAt":"2024-03-01T00:00:00Z","labels":[{"name":"help wanted"}]}]\n' > "$STUB_DIR/issue-list.json"
printf 'worktree /repo\nHEAD abc123\n\n' > "$STUB_DIR/worktree-list.txt"
result=$("$TMPDIR_TEST/dispatch-select-target")
assert_eq "jit with no open issue → falls through to issue queue" "issue 55" "$result"
teardown

# JS9. A leading-zero duration is parsed as base-10, not octal. jit-x's
#      "012h" must mean 12h (octal would make it 10h, flipping the winner).
echo "Test: JIT scan — leading-zero duration parses as base-10, not octal"
setup
printf '%s\n' "$JIT_PROJECTS_JSON" > "$DISPATCH_CONFIG_DIR/projects.json"
cat > "$DISPATCH_CONFIG_DIR/jit.json" <<'EOF'
{ "jits": [
  { "key": "jit-x", "repo": "natb1/household", "label": "jit:jit-x",
    "title": "Jit X", "body": "Jit X.", "project": "household",
    "remindAfterClose": "12h", "dueAfterClose": "012h" },
  { "key": "jit-y", "repo": "natb1/household", "label": "jit:jit-y",
    "title": "Jit Y", "body": "Jit Y.", "project": "household",
    "remindAfterClose": "12h", "dueAfterClose": "11h" }
] }
EOF
# Both closed at the same instant: jit-x due = +12h, jit-y due = +11h, so
# jit-y is earlier and wins. Octal-parsing "012h" as 10h would wrongly pick
# jit-x.
printf '[{"number":10,"createdAt":"2026-05-01T00:00:00Z"}]\n' \
  > "$STUB_DIR/jit-issues-open-jit_jit-x.json"
printf '[{"closedAt":"2026-05-10T00:00:00Z"}]\n' \
  > "$STUB_DIR/jit-issues-closed-jit_jit-x.json"
printf '[{"number":20,"createdAt":"2026-05-01T00:00:00Z"}]\n' \
  > "$STUB_DIR/jit-issues-open-jit_jit-y.json"
printf '[{"closedAt":"2026-05-10T00:00:00Z"}]\n' \
  > "$STUB_DIR/jit-issues-closed-jit_jit-y.json"
printf '{"items":[{"id":"PVTI_010","content":{"url":"https://github.com/natb1/household/issues/10"},"status":"Todo"},{"id":"PVTI_020","content":{"url":"https://github.com/natb1/household/issues/20"},"status":"Todo"}]}\n' \
  > "$STUB_DIR/project-item-list.json"
echo '[]' > "$STUB_DIR/pr-list-union.json"
echo '[]' > "$STUB_DIR/issue-list.json"
printf 'worktree /repo\nHEAD abc123\n\n' > "$STUB_DIR/worktree-list.txt"
result=$("$TMPDIR_TEST/dispatch-select-target")
assert_eq "leading-zero duration is base-10 → earlier-due jit-y wins" \
  "jit-reminder natb1/household 20 household PVTI_020" "$result"
teardown

# JS10. parse_duration rejects an invalid duration string → dispatch-select-target
#       exits non-zero before emitting any candidate.
echo "Test: JIT scan — parse_duration rejects invalid duration"
setup
printf '%s\n' "$JIT_PROJECTS_JSON" > "$DISPATCH_CONFIG_DIR/projects.json"
cat > "$DISPATCH_CONFIG_DIR/jit.json" <<'EOF'
{ "jits": [
  { "key": "bad-duration", "repo": "natb1/household", "label": "jit:bad-duration",
    "title": "Bad duration", "body": "Has an invalid dueAfterClose.",
    "project": "household", "remindAfterClose": "12h", "dueAfterClose": "24" }
] }
EOF
# Open issue exists so the loop body runs; closed issue exists so max_closed is
# non-empty and parse_duration is reached immediately (no cold-start branch).
printf '[{"number":99,"createdAt":"2026-05-01T00:00:00Z"}]\n' \
  > "$STUB_DIR/jit-issues-open-jit_bad-duration.json"
printf '[{"closedAt":"2026-05-10T00:00:00Z"}]\n' \
  > "$STUB_DIR/jit-issues-closed-jit_bad-duration.json"
echo '[]' > "$STUB_DIR/pr-list-union.json"
echo '[]' > "$STUB_DIR/issue-list.json"
printf 'worktree /repo\nHEAD abc123\n\n' > "$STUB_DIR/worktree-list.txt"
if result=$("$TMPDIR_TEST/dispatch-select-target" 2>/dev/null); then rc=0; else rc=$?; fi
[[ "$rc" -ne 0 ]] && rc_nonzero=yes || rc_nonzero=no
assert_eq "invalid duration → exits non-zero" "yes" "$rc_nonzero"
teardown

# OH1. The PR-phase office-hours skip is issue-anchored (issue #909): see the
# "PR whose issue carries dispatch:office-hours is skipped" test in the
# dispatch-select-target section above. The label lives on the issue, never the
# PR, so there is no PR-label filter here.

# OH2. A help-wanted issue carrying dispatch:office-hours is skipped.
echo "Test: help-wanted issue with dispatch:office-hours is skipped"
setup
echo '[]' > "$STUB_DIR/pr-list-union.json"
# Issue 55 is parked; issue 66 is the next eligible help-wanted issue.
printf '%s\n' \
  '[{"number":55,"createdAt":"2024-01-01T00:00:00Z","labels":[{"name":"help wanted"},{"name":"dispatch:office-hours"}]},{"number":66,"createdAt":"2024-01-02T00:00:00Z","labels":[{"name":"help wanted"}]}]' \
  > "$STUB_DIR/issue-list.json"
printf 'worktree /repo\nHEAD abc123\n\n' > "$STUB_DIR/worktree-list.txt"
result=$("$TMPDIR_TEST/dispatch-select-target")
assert_eq "parked issue skipped; next help-wanted issue returned" "issue 66" "$result"
teardown

# OH3. A PR whose issue is parked (dispatch:office-hours) and that also has a
#      worktree on disk is not selected — the PR-ladder worktree-skip keeps it
#      out regardless of the label. This test codifies the no-regression claim:
#      the old sweep-adoption mechanism would have picked such a PR; without it
#      the worktree'd PR stays out.
echo "Test: office-hours PR with worktree on disk is not selected"
setup
# PR 10's issue (#10) is parked (dispatch:office-hours) and PR 10 also has a
# worktree on disk. PR 20 is the second eligible verify PR with no parked issue
# and no worktree.
UNION='['
UNION+="$(make_pr_union 10 "10-oh-parked" "2024-01-01T00:00:00Z" "true" "$NO_LABELS" "$FAILING_ROLLUP")"','
UNION+="$(make_pr_union 20 "20-active" "2024-01-02T00:00:00Z" "true" "$NO_LABELS" "$FAILING_ROLLUP")"
UNION+=']'
setup_union_pr_list "$UNION"
# Issue #10 is parked (the office-hours label lives on the issue, issue #909).
printf '[{"number":10,"createdAt":"2024-01-01T00:00:00Z","labels":[{"name":"dispatch:office-hours"}]}]\n' \
  > "$STUB_DIR/issue-list.json"
# Worktree exists on disk for 10-oh-parked (what the old adoption mechanism would
# have targeted); no worktree for 20-active.
printf 'worktree /repo\nHEAD abc123\n\nworktree /worktrees/10-oh-parked\nHEAD def456\nbranch refs/heads/10-oh-parked\n\n' \
  > "$STUB_DIR/worktree-list.txt"
result=$("$TMPDIR_TEST/dispatch-select-target")
assert_eq "office-hours PR with worktree not selected; second PR chosen" "pr 20 20-active verify" "$result"
teardown

# --- ready-PR gate (issue #920) ---------------------------------------------
# An open help-wanted issue whose only closing PR is non-draft (ready) is
# excluded from the issue queue. A *draft* closing PR does NOT gate the issue.

# R1. Excluded by ready PR.
# Non-draft PR closes issue 55; issue 55 (older) and issue 66 (newer) are both
# help-wanted. Without the gate the oldest (55) would win. Assert the result is
# issue 66 — 55 is gated out.
echo "Test: Excluded by ready PR."
setup
# Non-draft (ready) PR 100 with green rollup closes issue 55.
UNION='['"$(make_pr_union 100 "55-ready-pr" "2024-01-01T00:00:00Z" "false" "$NO_LABELS" "$GREEN_ROLLUP" '[{"number":55}]')"']'
setup_union_pr_list "$UNION"
# Issue 55 is older (Jan 01), issue 66 is newer (Jan 02); both help-wanted.
printf '[{"number":55,"createdAt":"2024-01-01T00:00:00Z","labels":[{"name":"help wanted"}]},{"number":66,"createdAt":"2024-01-02T00:00:00Z","labels":[{"name":"help wanted"}]}]\n' \
  > "$STUB_DIR/issue-list.json"
printf 'worktree /repo\nHEAD abc123\n\n' > "$STUB_DIR/worktree-list.txt"
result=$("$TMPDIR_TEST/dispatch-select-target")
assert_eq "ready PR closes issue 55; issue 66 chosen instead" "issue 66" "$result"
teardown

# R2. Draft PR does not gate.
# A draft PR (isDraft=true, pending rollup → classified waiting, dropped from
# the ladder) closes issue 55; issue 55 is help-wanted with no worktree. Assert
# the result is issue 55 — the draft does not exclude its issue.
echo "Test: Draft PR does not gate."
setup
# Draft (isDraft=true, pending rollup) PR 100 closes issue 55.
UNION='['"$(make_pr_union 100 "55-draft-pr" "2024-01-01T00:00:00Z" "true" "$NO_LABELS" "$PENDING_ROLLUP" '[{"number":55}]')"']'
setup_union_pr_list "$UNION"
printf '[{"number":55,"createdAt":"2024-01-01T00:00:00Z","labels":[{"name":"help wanted"}]}]\n' \
  > "$STUB_DIR/issue-list.json"
printf 'worktree /repo\nHEAD abc123\n\n' > "$STUB_DIR/worktree-list.txt"
result=$("$TMPDIR_TEST/dispatch-select-target")
assert_eq "draft PR does not gate issue 55; issue 55 chosen" "issue 55" "$result"
teardown

# ============================================================================
# dispatch-trace-leaf tests
# ============================================================================
echo ""
echo "=== dispatch-trace-leaf ==="

# The default empty-worktree-list stub means no <N>-* branch is ever conflicted,
# so explicit mode and queue mode behave identically for the chain/leaf tests
# below. New mode-specific behavior is exercised in tests 8-12.

# 1. No children → prints self.
echo "Test: no children → prints self"
setup
# No stub files means no blockers and no sub-issues.
result=$("$TMPDIR_TEST/dispatch-trace-leaf" "100" "explicit")
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
result=$("$TMPDIR_TEST/dispatch-trace-leaf" "100" "explicit")
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
result=$("$TMPDIR_TEST/dispatch-trace-leaf" "100" "explicit")
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
result=$("$TMPDIR_TEST/dispatch-trace-leaf" "100" "explicit")
assert_eq "closed children ignored → open leaf 301" "301" "$result"
teardown

# 5. All children closed → issue itself is a leaf.
echo "Test: all children closed → prints self"
setup
printf '[{"number":400}]\n' > "$STUB_DIR/subissues-100.json"
printf '{"title":"Issue 400","body":"","comments":[],"number":400,"state":"CLOSED"}\n' \
  > "$STUB_DIR/issue-400.json"
result=$("$TMPDIR_TEST/dispatch-trace-leaf" "100" "explicit")
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
result=$("$TMPDIR_TEST/dispatch-trace-leaf" "100" "explicit")
assert_eq "cycle → fallback to N (100)" "100" "$result"
teardown

# 7. Sub-issues via issue-sub-issues path.
echo "Test: sub-issues chain"
setup
printf '[{"number":601}]\n' > "$STUB_DIR/subissues-600.json"
printf '{"title":"Issue 601","body":"","comments":[],"number":601,"state":"OPEN"}\n' \
  > "$STUB_DIR/issue-601.json"
result=$("$TMPDIR_TEST/dispatch-trace-leaf" "600" "explicit")
assert_eq "sub-issues chain 600→601 → leaf 601" "601" "$result"
teardown

# 8. Queue mode: conflicted child is skipped → sibling is returned.
echo "Test: queue mode → skips conflicted child, returns sibling"
setup
# 700 has two open sub-issues: 701 (worktree-owned) and 702 (clean).
printf '[{"number":701},{"number":702}]\n' > "$STUB_DIR/subissues-700.json"
printf '{"title":"Issue 701","body":"","comments":[],"number":701,"state":"OPEN"}\n' \
  > "$STUB_DIR/issue-701.json"
printf '{"title":"Issue 702","body":"","comments":[],"number":702,"state":"OPEN"}\n' \
  > "$STUB_DIR/issue-702.json"
# Pretend another session owns 701's worktree on branch 701-feature.
printf 'worktree /repo\nHEAD abc123\n\nworktree /worktrees/701-feature\nHEAD def456\nbranch refs/heads/701-feature\n\n' \
  > "$STUB_DIR/worktree-list.txt"
result=$("$TMPDIR_TEST/dispatch-trace-leaf" "700" "queue")
assert_eq "queue: conflicted child 701 skipped → sibling 702" "702" "$result"
teardown

# 9. Explicit mode: conflicted child returned unchanged (no worktree filtering).
echo "Test: explicit mode → conflicted child returned (no filtering)"
setup
# Same fixture as test 8, but invoked in explicit mode.
printf '[{"number":701},{"number":702}]\n' > "$STUB_DIR/subissues-700.json"
printf '{"title":"Issue 701","body":"","comments":[],"number":701,"state":"OPEN"}\n' \
  > "$STUB_DIR/issue-701.json"
printf '{"title":"Issue 702","body":"","comments":[],"number":702,"state":"OPEN"}\n' \
  > "$STUB_DIR/issue-702.json"
printf 'worktree /repo\nHEAD abc123\n\nworktree /worktrees/701-feature\nHEAD def456\nbranch refs/heads/701-feature\n\n' \
  > "$STUB_DIR/worktree-list.txt"
result=$("$TMPDIR_TEST/dispatch-trace-leaf" "700" "explicit")
assert_eq "explicit: lowest leaf 701 unchanged" "701" "$result"
teardown

# 10. Queue mode: every child is worktree-conflicted → non-zero exit.
echo "Test: queue mode → all leaves conflicted, exits non-zero"
setup
printf '[{"number":701},{"number":702}]\n' > "$STUB_DIR/subissues-700.json"
printf '{"title":"Issue 701","body":"","comments":[],"number":701,"state":"OPEN"}\n' \
  > "$STUB_DIR/issue-701.json"
printf '{"title":"Issue 702","body":"","comments":[],"number":702,"state":"OPEN"}\n' \
  > "$STUB_DIR/issue-702.json"
# Both children's worktrees exist.
printf 'worktree /repo\nHEAD abc123\n\nworktree /worktrees/701-feature\nHEAD def456\nbranch refs/heads/701-feature\n\nworktree /worktrees/702-feature\nHEAD ghi789\nbranch refs/heads/702-feature\n\n' \
  > "$STUB_DIR/worktree-list.txt"
err_out=$("$TMPDIR_TEST/dispatch-trace-leaf" "700" "queue" 2>&1 1>/dev/null && echo "EXIT=0" || echo "EXIT=$?")
case "$err_out" in
  *"worktree-conflicted"*"EXIT="[1-9]*) status="ok" ;;
  *) status="bad: $err_out" ;;
esac
assert_eq "queue: all blocked → non-zero with stderr message" "ok" "$status"
teardown

# 11. Missing mode → arity error on stderr, exit 1.
echo "Test: missing mode arg → usage error"
setup
err_out=$("$TMPDIR_TEST/dispatch-trace-leaf" "100" 2>&1 1>/dev/null && echo "EXIT=0" || echo "EXIT=$?")
case "$err_out" in
  *"usage:"*"EXIT=1") status="ok" ;;
  *) status="bad: $err_out" ;;
esac
assert_eq "missing mode → usage error, exit 1" "ok" "$status"
teardown

# 12. Invalid mode string → usage error on stderr, exit 1.
echo "Test: invalid mode arg → usage error"
setup
err_out=$("$TMPDIR_TEST/dispatch-trace-leaf" "100" "bogus" 2>&1 1>/dev/null && echo "EXIT=0" || echo "EXIT=$?")
case "$err_out" in
  *"usage:"*"EXIT=1") status="ok" ;;
  *) status="bad: $err_out" ;;
esac
assert_eq "invalid mode → usage error, exit 1" "ok" "$status"
teardown

# 13. issue-blocking failure → hard error (exit 1), never emits N as a leaf.
echo "Test: issue-blocking failure → exit 1, no leaf emitted"
setup
# No stub files: 800 would otherwise resolve as a childless leaf. The injected
# blocked_by failure must abort instead of mis-classifying 800 as startable.
: > "$STUB_DIR/gh-fail-blocked_by-800"
stdout=$("$TMPDIR_TEST/dispatch-trace-leaf" "800" "queue" 2>/dev/null) && rc=0 || rc=$?
assert_eq "issue-blocking failure → exit 1" "1" "$rc"
assert_eq "issue-blocking failure → no leaf on stdout" "" "$stdout"
teardown

# 14. issue-sub-issues failure → same hard error. issue-blocking succeeds
#     (empty = no blockers), then the sub_issues lookup fails.
echo "Test: issue-sub-issues failure → exit 1, no leaf emitted"
setup
: > "$STUB_DIR/gh-fail-sub_issues-800"
stdout=$("$TMPDIR_TEST/dispatch-trace-leaf" "800" "queue" 2>/dev/null) && rc=0 || rc=$?
assert_eq "issue-sub-issues failure → exit 1" "1" "$rc"
assert_eq "issue-sub-issues failure → no leaf on stdout" "" "$stdout"
teardown

# 15. issue-blocking failure in explicit mode → exit 1, NOT the cycle-fallback
#     "print N".
echo "Test: issue-blocking failure (explicit) → exit 1, not cycle-fallback"
setup
: > "$STUB_DIR/gh-fail-blocked_by-800"
stdout=$("$TMPDIR_TEST/dispatch-trace-leaf" "800" "explicit" 2>/dev/null) && rc=0 || rc=$?
assert_eq "issue-blocking failure (explicit) → exit 1" "1" "$rc"
assert_eq "issue-blocking failure (explicit) → no N printed" "" "$stdout"
teardown

# 16. A failure one level deep is re-propagated through the recursive frame.
#     Tests 13-15 inject the failure at the root issue, so find_leaf returns
#     the rc-3 hard error from its first frame. Here 800 has sub-issue 801 and
#     it is 801's blocker lookup that fails — exercising the `rc -eq 3` branch
#     in find_leaf's descent loop, which must carry the hard error up rather
#     than mask it as "no leaf in this subtree".
echo "Test: gh failure one level deep → re-propagated, exit 1"
setup
printf '[{"number":801}]\n' > "$STUB_DIR/subissues-800.json"
: > "$STUB_DIR/gh-fail-blocked_by-801"
stdout=$("$TMPDIR_TEST/dispatch-trace-leaf" "800" "queue" 2>/dev/null) && rc=0 || rc=$?
assert_eq "deep gh failure → exit 1" "1" "$rc"
assert_eq "deep gh failure → no leaf on stdout" "" "$stdout"
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

# Phase → label mapping. The label already exists (default stub mode), so
# the script applies it with a single `gh pr edit` and issues no `gh label create`.
echo "Test: qa → dispatch:qa-done (apply only, no label create)"
setup
"$TMPDIR_TEST/dispatch-complete-phase" 21 qa
assert_eq "qa applies dispatch:qa-done" \
  "pr edit 21 --add-label dispatch:qa-done" "$(cat "$STUB_DIR/gh-pr-edit.log")"
assert_eq "qa: no gh label create when label exists" "absent" "$(label_create_state)"
teardown

echo "Test: code-review → dispatch:code-reviewed (apply only, no label create)"
setup
"$TMPDIR_TEST/dispatch-complete-phase" 25 code-review
assert_eq "code-review applies dispatch:code-reviewed" \
  "pr edit 25 --add-label dispatch:code-reviewed" "$(cat "$STUB_DIR/gh-pr-edit.log")"
assert_eq "code-review: no gh label create when label exists" "absent" "$(label_create_state)"
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

# Label missing: the apply fails "not found", so the script creates the
# label (BFD4F2, "dispatch workflow: <suffix> phase complete") and retries.
echo "Test: label missing → create then retry"
setup
echo "label-missing" > "$STUB_DIR/pr-edit-mode"
"$TMPDIR_TEST/dispatch-complete-phase" 30 qa
assert_eq "label-missing: label created with workflow description" \
  "label create dispatch:qa-done --color BFD4F2 --description dispatch workflow: qa-done phase complete" \
  "$(cat "$STUB_DIR/gh-label-create.log")"
assert_eq "label-missing: label applied on retry" \
  "pr edit 30 --add-label dispatch:qa-done" "$(cat "$STUB_DIR/gh-pr-edit.log")"
teardown

# An apply failure unrelated to a missing label exits non-zero and creates
# no label.
echo "Test: other apply failure → non-zero exit, no label create"
setup
echo "other-failure" > "$STUB_DIR/pr-edit-mode"
if "$TMPDIR_TEST/dispatch-complete-phase" 40 qa 2>/dev/null; then rc=0; else rc=$?; fi
assert_eq "other apply failure exits non-zero" "1" "$rc"
assert_eq "other failure: no spurious label create" "absent" "$(label_create_state)"
teardown

# Unknown phase → non-zero exit.
echo "Test: unknown phase → non-zero exit"
setup
if "$TMPDIR_TEST/dispatch-complete-phase" 25 bogus 2>/dev/null; then rc=0; else rc=$?; fi
assert_eq "unknown phase exits non-zero" "1" "$rc"
teardown

# Missing phase arg → non-zero exit.
echo "Test: missing args → non-zero exit"
setup
if "$TMPDIR_TEST/dispatch-complete-phase" 25 2>/dev/null; then rc=0; else rc=$?; fi
assert_eq "missing phase arg exits non-zero" "1" "$rc"
teardown

# Static guard: only dispatch-complete-phase contains the BFD4F2 hex color.
# Exclude this test file (which references BFD4F2 in fixtures and comments)
# rather than whitelisting specific extensions — that way any future
# regression in a .sh wrapper is caught alongside .md regressions.
echo "Test: only dispatch-complete-phase contains the BFD4F2 hex"
REPO_ROOT=$(cd "$SCRIPT_DIR/../../../.." && pwd)
# grep exits 2 on permission errors (e.g. sandbox-blocked directories); treat
# that as non-fatal — the important check is the matched file list, not whether
# grep could read every directory.
matches=$(grep -rl 'BFD4F2' "$REPO_ROOT/.claude" \
  --exclude='test-dispatch-scripts.sh' 2>/dev/null \
  | sed "s|$REPO_ROOT/||" | sort || true)
assert_eq "only dispatch-complete-phase owns BFD4F2" \
  ".claude/skills/dispatch-propagate/scripts/dispatch-complete-phase" \
  "$matches"

# ============================================================================
# dispatch-apply-office-hours tests
# ============================================================================
echo ""
echo "=== dispatch-apply-office-hours ==="

# Reports whether the gh stub recorded a given call log (present/absent).
log_state() {
  [[ -f "$STUB_DIR/$1" ]] && echo "present" || echo "absent"
}

# Happy path: the issue carries no office-hours label, so the script applies it
# to the ISSUE and posts a why-comment containing the reason text.
echo "Test: label absent → apply to issue + post why-comment"
setup
"$TMPDIR_TEST/dispatch-apply-office-hours" 42 "phase exited before completion"
assert_eq "applies dispatch:office-hours to the issue" \
  "issue edit 42 --add-label dispatch:office-hours" "$(cat "$STUB_DIR/gh-issue-edit.log")"
assert_eq "happy path: no gh label create when label exists" \
  "absent" "$(log_state gh-label-create.log)"
TOTAL=$((TOTAL + 1))
if grep -q "Reason: phase exited before completion" "$STUB_DIR/gh-issue-comment.log"; then
  PASS=$((PASS + 1)); echo "  PASS: why-comment contains the reason"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: why-comment contains the reason"
fi
TOTAL=$((TOTAL + 1))
if grep -q "^issue comment 42 " "$STUB_DIR/gh-issue-comment.log"; then
  PASS=$((PASS + 1)); echo "  PASS: comment targets the issue"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: comment targets the issue"
fi
teardown

# Idempotent: the issue already carries the label → no re-apply, no duplicate
# comment.
echo "Test: label already present → no edit, no duplicate comment"
setup
echo '{"labels":[{"name":"dispatch:office-hours"}]}' > "$STUB_DIR/issue-labels-42.json"
"$TMPDIR_TEST/dispatch-apply-office-hours" 42 "phase ran but did not advance"
assert_eq "idempotent: no label edit" "absent" "$(log_state gh-issue-edit.log)"
assert_eq "idempotent: no duplicate comment" "absent" "$(log_state gh-issue-comment.log)"
teardown

# Missing reason (only an issue number) → non-zero exit, no edit, no comment.
echo "Test: missing reason → non-zero exit, no edit, no comment"
setup
if "$TMPDIR_TEST/dispatch-apply-office-hours" 42 2>/dev/null; then rc=0; else rc=$?; fi
assert_eq "missing reason exits non-zero" "1" "$rc"
assert_eq "missing reason: no label edit" "absent" "$(log_state gh-issue-edit.log)"
assert_eq "missing reason: no comment" "absent" "$(log_state gh-issue-comment.log)"
teardown

# Empty reason → same as missing reason.
echo "Test: empty reason → non-zero exit, no edit, no comment"
setup
if "$TMPDIR_TEST/dispatch-apply-office-hours" 42 "" 2>/dev/null; then rc=0; else rc=$?; fi
assert_eq "empty reason exits non-zero" "1" "$rc"
assert_eq "empty reason: no label edit" "absent" "$(log_state gh-issue-edit.log)"
teardown

# Missing both args → non-zero exit.
echo "Test: missing both args → non-zero exit"
setup
if "$TMPDIR_TEST/dispatch-apply-office-hours" 2>/dev/null; then rc=0; else rc=$?; fi
assert_eq "missing both args exits non-zero" "1" "$rc"
teardown

# Non-numeric, flag-like issue number → hard error, no gh calls. Guards against a
# flag-like first arg (e.g. --repo other/repo) being argument-injected into the
# gh issue view/edit/comment calls.
echo "Test: non-numeric issue number → non-zero exit, no edit/comment"
setup
if "$TMPDIR_TEST/dispatch-apply-office-hours" "--repo other/repo" "a reason" 2>/dev/null; then rc=0; else rc=$?; fi
assert_eq "non-numeric issue number exits non-zero" "1" "$rc"
assert_eq "non-numeric issue number: no label edit" "absent" "$(log_state gh-issue-edit.log)"
assert_eq "non-numeric issue number: no comment" "absent" "$(log_state gh-issue-comment.log)"
teardown

# Create-on-first-use: the apply fails "not found" (the *label* does not exist
# in the repo yet), so the script creates it with the canonical FBCA04 color and
# retries the edit, then posts the comment.
echo "Test: label not found → create (FBCA04) then retry + comment"
setup
echo "label-missing" > "$STUB_DIR/issue-edit-mode"
"$TMPDIR_TEST/dispatch-apply-office-hours" 42 "phase exited before completion"
TOTAL=$((TOTAL + 1))
if grep -q "^label create dispatch:office-hours --color FBCA04 " "$STUB_DIR/gh-label-create.log"; then
  PASS=$((PASS + 1)); echo "  PASS: label created with FBCA04 color"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: label created with FBCA04 color"
fi
assert_eq "create-on-first-use: label applied on retry" \
  "issue edit 42 --add-label dispatch:office-hours" "$(cat "$STUB_DIR/gh-issue-edit.log")"
assert_eq "create-on-first-use: why-comment posted" \
  "present" "$(log_state gh-issue-comment.log)"
teardown

# dispatch-apply-office-hours owns the FBCA04 hex. (A single-source-of-truth
# guard that excludes the two writer hooks is deferred to the unit that routes
# them through this script and removes their inline FBCA04 references.)
echo "Test: dispatch-apply-office-hours contains the FBCA04 hex"
TOTAL=$((TOTAL + 1))
if grep -q 'FBCA04' "$SCRIPT_DIR/dispatch-apply-office-hours"; then
  PASS=$((PASS + 1)); echo "  PASS: dispatch-apply-office-hours owns FBCA04"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: dispatch-apply-office-hours owns FBCA04"
fi

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

# ----------------------------------------------------------------------------
# Branch reconciliation on the `enter` path (#913). PR existence is driven via
# pr-list-full.json (dispatch-find-pr's prefix match on headRefName); the PR
# head branch is driven via pr-headref-<num>.json (gh pr view headRefName).
# The git stub logs checkouts to git-checkout.log and reads the unique-commit
# count from rev-list-count.txt (default 0).
# ----------------------------------------------------------------------------

# 11. Wrong branch + PR + no unique commits → re-point: enter AND checkout logged.
echo "Test: reconcile wrong branch (no unique commits) → re-point + enter"
setup
printf '%s' "$WORKTREE_LIST_42" > "$STUB_DIR/worktree-list.txt"
select_target_fake_claude   # sessionless: explicit liveness check (#837) proceeds to reconcile
printf '[{"number":100,"headRefName":"42-pr-branch"}]\n' > "$STUB_DIR/pr-list-full.json"
echo '{"headRefName":"42-pr-branch"}' > "$STUB_DIR/pr-headref-100.json"
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
echo '{"headRefName":"42-my-feature"}' > "$STUB_DIR/pr-headref-100.json"
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
echo '{"headRefName":"42-pr-branch"}' > "$STUB_DIR/pr-headref-100.json"
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
assert_eq "no PR → gh pr view not called" "no" "$pr_view_called"
checkout_logged=$([[ -f "$STUB_DIR/git-checkout.log" ]] && echo yes || echo no)
assert_eq "no PR → no checkout" "no" "$checkout_logged"
teardown

# 15. queue-orphan + wrong branch + PR → reconciliation applies in queue mode too.
echo "Test: queue orphan + wrong branch + PR → re-point + enter"
setup
printf '%s' "$WORKTREE_LIST_42" > "$STUB_DIR/worktree-list.txt"
select_target_fake_claude   # orphan: no live session owns the worktree
printf '[{"number":100,"headRefName":"42-pr-branch"}]\n' > "$STUB_DIR/pr-list-full.json"
echo '{"headRefName":"42-pr-branch"}' > "$STUB_DIR/pr-headref-100.json"
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
echo '{"headRefName":"42-pr-branch"}' > "$STUB_DIR/pr-headref-100.json"
result=$("$TMPDIR_TEST/dispatch-resolve-worktree" 42 queue)
assert_eq "queue live-session + wrong branch → conflict" \
  "conflict /worktrees/42-my-feature" "$result"
pr_view_called=$([[ -f "$STUB_DIR/gh-pr-view-headref.log" ]] && echo yes || echo no)
assert_eq "queue live-session + wrong branch → gh pr view not called" "no" "$pr_view_called"
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
echo '{"headRefName":""}' > "$STUB_DIR/pr-headref-100.json"
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
echo '{"headRefName":"--upload-pack=evil"}' > "$STUB_DIR/pr-headref-100.json"
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
#      arg-issue-922.json carries "pull_request"; an issue-title-922.json is also
#      seeded so the test proves the guard fires *before* the create path (no
#      decision line despite a usable title fixture).
echo "Test: PR number as issue key → reject (no stray <pr-num>-* worktree)"
setup
echo '{"number":922,"pull_request":{"url":"https://api.github.com/repos/o/r/pulls/922"}}' \
  > "$STUB_DIR/arg-issue-922.json"
echo '{"title":"some pr title"}' > "$STUB_DIR/issue-title-922.json"
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
echo '{"headRefName":"918-dispatch-move"}' > "$STUB_DIR/pr-headref-922.json"
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
# dispatch-sweep tests
# ============================================================================
echo ""
echo "=== dispatch-sweep ==="

# Sweep tests use their own setup/teardown — the script under test sources
# lib-worktree-in-sync.sh from SCRIPT_DIR and shells out to gh/git in patterns
# the main suite's shims don't cover.
#
# Per-test layout under TMPDIR_TEST:
#   bin/                          PATH shim dir (gh, git)
#   scripts/dispatch-sweep        copy of the script under test
#   scripts/lib-worktree-in-sync.sh   sourced helper
#   project/                      fake project root
#   project/.bare/                fake git common dir (parent = project/)
#   project/worktrees/<n>-<slug>/ fake worktrees
#   project/tmp/                  sweep log default dir
#   stub/                         per-test JSON + record files (calls, gh out)
#
# Shims:
#   gh   — gh-pr-list-all.json drives `pr list --state all`; each entry carries
#          {state, headRefName, number}. MERGED entries populate MERGED_BY_BRANCH;
#          OPEN entries populate OPEN_BY_BRANCH. DRAFT is unused (isDraft not consumed).
#   git  — knows worktree list/remove/prune, branch -D, -C <p> status,
#          -C <p> rev-list --count, -C <p> log -1 --format=%ct, and
#          rev-parse --path-format=absolute --git-common-dir.
#          Every mutating call is appended to $STUB_DIR/calls.

sweep_setup() {
  TMPDIR_TEST=$(mktemp -d)
  STUB_DIR="$TMPDIR_TEST/stub"
  mkdir -p "$TMPDIR_TEST/bin" "$STUB_DIR" "$TMPDIR_TEST/scripts" \
           "$TMPDIR_TEST/project/.bare" "$TMPDIR_TEST/project/worktrees" \
           "$TMPDIR_TEST/project/tmp" "$TMPDIR_TEST/fake"

  cp "$SCRIPT_DIR/dispatch-sweep" "$TMPDIR_TEST/scripts/dispatch-sweep"
  cp "$SCRIPT_DIR/lib-worktree-in-sync.sh" "$TMPDIR_TEST/scripts/lib-worktree-in-sync.sh"
  cp "$SCRIPT_DIR/lib-claude-agents.sh" "$TMPDIR_TEST/scripts/lib-claude-agents.sh"
  chmod +x "$TMPDIR_TEST/scripts/dispatch-sweep"

  # Default empty gh output (each test may overwrite).
  echo '[]' > "$STUB_DIR/gh-pr-list-all.json"

  # Default empty worktree list (each test should overwrite with its records).
  : > "$STUB_DIR/worktree-list.txt"

  # gh shim — handles dispatch-sweep's calls.
  cat > "$TMPDIR_TEST/bin/gh" <<'STUB'
#!/usr/bin/env bash
STUB_DIR="$(cd "$(dirname "$0")/.." && pwd)/stub"
args="$*"
case "$args" in
  "pr list --state all --json number,headRefName,state --limit 200")
    cat "$STUB_DIR/gh-pr-list-all.json"
    ;;
  issue\ view\ *\ --json\ state\ -q\ .state)
    # dispatch-sweep closed-issue check: gh issue view <N> --json state -q .state
    num=$(echo "$args" | awk '{print $3}')
    # Controllable failure: if SWEEP_GH_ISSUE_FAIL matches this issue number, fail.
    if [[ "${SWEEP_GH_ISSUE_FAIL:-}" == "$num" ]]; then
      echo "gh sweep stub: simulated gh issue view failure for $num" >&2
      exit 1
    fi
    # Per-issue state fixture: issue-state-<N>.txt holds the raw state string.
    f="$STUB_DIR/issue-state-${num}.txt"
    if [[ -f "$f" ]]; then
      cat "$f"
    else
      echo "gh sweep stub: no issue-state-${num}.txt for issue view $num" >&2
      exit 1
    fi
    ;;
  *)
    echo "gh sweep stub: unknown invocation: $args" >&2
    exit 1
    ;;
esac
STUB
  chmod +x "$TMPDIR_TEST/bin/gh"

  # git shim — multi-mode; records every mutating call so tests can assert.
  cat > "$TMPDIR_TEST/bin/git" <<'STUB'
#!/usr/bin/env bash
STUB_DIR="$(cd "$(dirname "$0")/.." && pwd)/stub"
PROJECT_ROOT_FAKE="$(cd "$(dirname "$0")/.." && pwd)/project"

# Detect `-C <path>` prefix.
if [[ "${1:-}" == "-C" ]]; then
  ctx_path="$2"
  shift 2
  sub="$1"; shift
  rest="$*"
  case "$sub $rest" in
    "status --porcelain")
      # Per-path porcelain output; default empty (clean).
      key=$(echo "$ctx_path" | tr '/' '_')
      f="$STUB_DIR/status${key}.txt"
      [[ -f "$f" ]] && cat "$f"
      exit 0
      ;;
    "rev-list --count HEAD --not --remotes")
      key=$(echo "$ctx_path" | tr '/' '_')
      f="$STUB_DIR/revlist${key}.txt"
      if [[ -f "$f" ]]; then cat "$f"; else echo "0"; fi
      exit 0
      ;;
    "log -1 --format=%ct HEAD")
      key=$(echo "$ctx_path" | tr '/' '_')
      f="$STUB_DIR/headct${key}.txt"
      if [[ -f "$f" ]]; then cat "$f"; else exit 1; fi
      exit 0
      ;;
    *)
      echo "git -C stub: unknown invocation: -C $ctx_path $sub $rest" >&2
      exit 1
      ;;
  esac
fi

args="$*"
case "$args" in
  "rev-parse --path-format=absolute --git-common-dir")
    echo "$PROJECT_ROOT_FAKE/.bare"
    ;;
  "worktree list --porcelain")
    cat "$STUB_DIR/worktree-list.txt"
    ;;
  "worktree remove --force "*)
    path="${args#worktree remove --force }"
    echo "worktree-remove-force:$path" >> "$STUB_DIR/calls"
    ;;
  "worktree remove "*)
    path="${args#worktree remove }"
    echo "worktree-remove:$path" >> "$STUB_DIR/calls"
    ;;
  "worktree prune")
    echo "worktree-prune" >> "$STUB_DIR/calls"
    ;;
  "branch -D "*)
    name="${args#branch -D }"
    echo "branch-D:$name" >> "$STUB_DIR/calls"
    ;;
  *)
    echo "git sweep stub: unknown invocation: $args" >&2
    exit 1
    ;;
esac
STUB
  chmod +x "$TMPDIR_TEST/bin/git"

  export PATH="$TMPDIR_TEST/bin:$PATH"

  # Default fake `claude` — prints `[]` and exits 0 (no live sessions).
  # Step 3's liveness gate sees a definite "no sessions" and proceeds with
  # removal. Tests that need a live session call sweep_fake_claude_sessions_by_name.
  local default_fake="$TMPDIR_TEST/fake/claude"
  cat > "$default_fake" <<'FAKE'
#!/usr/bin/env bash
printf '[]'
exit 0
FAKE
  chmod +x "$default_fake"

  # Defaults for dispatch-sweep env overrides.
  export CLAUDE_AGENTS_CMD="$default_fake"
  export DISPATCH_SWEEP_LOG_FILE="$STUB_DIR/sweep.log"
  export DISPATCH_SWEEP_NOW="2026-01-01T00:00:00Z"
}

sweep_teardown() {
  rm -rf "$TMPDIR_TEST"
  TMPDIR_TEST=""
  STUB_DIR=""
  export PATH="$SAVED_PATH"
  unset CLAUDE_AGENTS_CMD DISPATCH_SWEEP_LOG_FILE DISPATCH_SWEEP_NOW
}

# Helper: register a worktree in the porcelain list AND create its directory.
# Each record is the blank-line-terminated block dispatch-sweep parses.
sweep_register_wt() {
  local wt_path="$1" branch="$2"
  mkdir -p "$wt_path"
  printf 'worktree %s\nHEAD abc123\nbranch refs/heads/%s\n\n' \
    "$wt_path" "$branch" >> "$STUB_DIR/worktree-list.txt"
}

# Convenience: convert an absolute path to the status/revlist/headct key
# used by the git -C shim.
sweep_path_key() {
  echo "$1" | tr '/' '_'
}

# Helper: install a fake `claude` whose `agents --json` invocation (NO --cwd)
# returns sessions keyed by name — matching how claude_sessions_with_name
# queries the daemon after the #882 Unit 2 name-keyed rewrite.
# Each argument must be in `name=sid` form; name is the worktree basename
# (as passed via --name=<basename> by dispatch-spawn-worker). The cwd field is
# set to "" since name-keyed classification ignores it.
# The fake ignores any --cwd argument and always returns the full payload; the
# client-side jq select(.name == $name) in claude_sessions_with_name does the
# filtering, exactly as in production.
sweep_fake_claude_sessions_by_name() {
  local fake="$TMPDIR_TEST/fake/claude"
  local all_payload="[" entry name sid first=1
  for entry in "$@"; do
    name="${entry%%=*}"
    sid="${entry#*=}"
    if (( first )); then first=0; else all_payload+=","; fi
    all_payload+="{\"sessionId\":\"$sid\",\"pid\":1,\"status\":\"busy\",\"name\":\"$name\",\"cwd\":\"\"}"
  done
  all_payload+="]"
  printf '%s' "$all_payload" > "$TMPDIR_TEST/fake/payload.json"
  cat > "$fake" <<'FAKE'
#!/usr/bin/env bash
# Ignore any args (including --cwd) — return the full payload unconditionally.
# claude_sessions_with_name applies its own jq name filter client-side.
cat "$(cd "$(dirname "$0")" && pwd)/payload.json"
exit 0
FAKE
  chmod +x "$fake"
  export CLAUDE_AGENTS_CMD="$fake"
}

# --- Test 1: merged classification triggers cleanup --------------------------

echo "Test: merged worktree (in-sync) is removed + branch deleted"
sweep_setup
WT_PATH="$TMPDIR_TEST/project/worktrees/42-feature"
sweep_register_wt "$WT_PATH" "42-feature"
echo '[{"number":100,"headRefName":"42-feature","state":"MERGED"}]' \
  > "$STUB_DIR/gh-pr-list-all.json"
# Clean tree + zero unpushed (defaults already match this — explicit for clarity).
key=$(sweep_path_key "$WT_PATH")
: > "$STUB_DIR/status${key}.txt"
echo "0" > "$STUB_DIR/revlist${key}.txt"

# Run the sweep; capture stdout, stderr, and exit code.
out=$("$TMPDIR_TEST/scripts/dispatch-sweep" 2>/dev/null); rc=$?
assert_eq "merged sweep exits 0" "0" "$rc"
assert_eq "merged sweep emits no stdout (nothing to adopt)" "" "$out"

# Calls recorded.
calls=$(cat "$STUB_DIR/calls" 2>/dev/null || true)
TOTAL=$((TOTAL + 1))
if echo "$calls" | grep -qx "worktree-remove:$WT_PATH"; then
  PASS=$((PASS + 1)); echo "  PASS: merged worktree remove call recorded"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: merged worktree remove call recorded"
  echo "    calls: $calls"
fi
TOTAL=$((TOTAL + 1))
if echo "$calls" | grep -qx "branch-D:42-feature"; then
  PASS=$((PASS + 1)); echo "  PASS: merged branch -D call recorded"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: merged branch -D call recorded"
fi

# Log entry.
TOTAL=$((TOTAL + 1))
if grep -q "REMOVE_MERGED: '$WT_PATH' branch=42-feature pr=#100" \
   "$DISPATCH_SWEEP_LOG_FILE"; then
  PASS=$((PASS + 1)); echo "  PASS: REMOVE_MERGED log line present"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: REMOVE_MERGED log line present"
  echo "    log:"; sed 's/^/      /' "$DISPATCH_SWEEP_LOG_FILE" 2>/dev/null
fi
sweep_teardown

# --- Test 1b: closed-issue worktree (in-sync) is removed + branch deleted ----

echo "Test: closed-issue worktree (in-sync) is removed + branch deleted"
sweep_setup
WT_PATH="$TMPDIR_TEST/project/worktrees/57-closed-feature"
sweep_register_wt "$WT_PATH" "57-closed-feature"
# No merged PRs — the closed-issue path must fire.
echo '[]' > "$STUB_DIR/gh-pr-list-all.json"
# Issue 57 is CLOSED.
echo "CLOSED" > "$STUB_DIR/issue-state-57.txt"
# Clean tree + zero unpushed (defaults).
key=$(sweep_path_key "$WT_PATH")
: > "$STUB_DIR/status${key}.txt"
echo "0" > "$STUB_DIR/revlist${key}.txt"

out=$("$TMPDIR_TEST/scripts/dispatch-sweep" 2>/dev/null); rc=$?
assert_eq "closed-issue sweep exits 0" "0" "$rc"
assert_eq "closed-issue sweep emits no stdout" "" "$out"

calls=$(cat "$STUB_DIR/calls" 2>/dev/null || true)
TOTAL=$((TOTAL + 1))
if echo "$calls" | grep -qx "worktree-remove:$WT_PATH"; then
  PASS=$((PASS + 1)); echo "  PASS: REMOVE_CLOSED_ISSUE worktree-remove call recorded"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: REMOVE_CLOSED_ISSUE worktree-remove call recorded"
  echo "    calls: $calls"
fi
TOTAL=$((TOTAL + 1))
if echo "$calls" | grep -qx "branch-D:57-closed-feature"; then
  PASS=$((PASS + 1)); echo "  PASS: REMOVE_CLOSED_ISSUE branch -D call recorded"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: REMOVE_CLOSED_ISSUE branch -D call recorded"
fi
TOTAL=$((TOTAL + 1))
if grep -q "REMOVE_CLOSED_ISSUE: '$WT_PATH' branch=57-closed-feature issue=#57" \
   "$DISPATCH_SWEEP_LOG_FILE"; then
  PASS=$((PASS + 1)); echo "  PASS: REMOVE_CLOSED_ISSUE log line present"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: REMOVE_CLOSED_ISSUE log line present"
  echo "    log:"; sed 's/^/      /' "$DISPATCH_SWEEP_LOG_FILE" 2>/dev/null
fi
sweep_teardown

# --- Test 1c: closed-issue worktree (not-in-sync) is kept ---------------------

echo "Test: closed-issue worktree (not-in-sync) is kept"
sweep_setup
WT_PATH="$TMPDIR_TEST/project/worktrees/58-closed-dirty"
sweep_register_wt "$WT_PATH" "58-closed-dirty"
echo '[]' > "$STUB_DIR/gh-pr-list-all.json"
echo "CLOSED" > "$STUB_DIR/issue-state-58.txt"
# Not-in-sync: has an uncommitted change.
key=$(sweep_path_key "$WT_PATH")
echo " M somefile.txt" > "$STUB_DIR/status${key}.txt"

out=$("$TMPDIR_TEST/scripts/dispatch-sweep" 2>/dev/null); rc=$?
assert_eq "closed-not-in-sync sweep exits 0" "0" "$rc"

calls=$(cat "$STUB_DIR/calls" 2>/dev/null || true)
TOTAL=$((TOTAL + 1))
if ! echo "$calls" | grep -q "worktree-remove"; then
  PASS=$((PASS + 1)); echo "  PASS: SKIP_CLOSED_NOT_IN_SYNC no worktree-remove call"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: SKIP_CLOSED_NOT_IN_SYNC no worktree-remove call"
  echo "    calls: $calls"
fi
TOTAL=$((TOTAL + 1))
if grep -q "SKIP_CLOSED_NOT_IN_SYNC: '$WT_PATH' branch=58-closed-dirty issue=#58" \
   "$DISPATCH_SWEEP_LOG_FILE"; then
  PASS=$((PASS + 1)); echo "  PASS: SKIP_CLOSED_NOT_IN_SYNC log line present"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: SKIP_CLOSED_NOT_IN_SYNC log line present"
  echo "    log:"; sed 's/^/      /' "$DISPATCH_SWEEP_LOG_FILE" 2>/dev/null
fi
sweep_teardown

# --- Test 1d: open-issue worktree is kept (regression guard) -----------------

echo "Test: open-issue worktree is kept (regression guard)"
sweep_setup
WT_PATH="$TMPDIR_TEST/project/worktrees/59-open-feature"
sweep_register_wt "$WT_PATH" "59-open-feature"
echo '[]' > "$STUB_DIR/gh-pr-list-all.json"
echo "OPEN" > "$STUB_DIR/issue-state-59.txt"
key=$(sweep_path_key "$WT_PATH")
: > "$STUB_DIR/status${key}.txt"
echo "0" > "$STUB_DIR/revlist${key}.txt"

out=$("$TMPDIR_TEST/scripts/dispatch-sweep" 2>/dev/null); rc=$?
assert_eq "open-issue sweep exits 0" "0" "$rc"

calls=$(cat "$STUB_DIR/calls" 2>/dev/null || true)
TOTAL=$((TOTAL + 1))
if ! echo "$calls" | grep -q "worktree-remove"; then
  PASS=$((PASS + 1)); echo "  PASS: open-issue worktree not removed"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: open-issue worktree not removed"
  echo "    calls: $calls"
fi
sweep_teardown

# --- Test 1e: gh issue view fails → ERROR_ISSUE_STATE_FETCH, exit 1 ----------

echo "Test: gh issue view fails → ERROR_ISSUE_STATE_FETCH on stderr, exit 1"
sweep_setup
WT_PATH="$TMPDIR_TEST/project/worktrees/60-closed-feature"
sweep_register_wt "$WT_PATH" "60-closed-feature"
echo '[]' > "$STUB_DIR/gh-pr-list-all.json"
# No issue-state-60.txt — let gh fail via the SWEEP_GH_ISSUE_FAIL env var.
export SWEEP_GH_ISSUE_FAIL="60"

stderr_out=$("$TMPDIR_TEST/scripts/dispatch-sweep" 2>&1 1>/dev/null) && rc=0 || rc=$?
assert_eq "gh issue view fail → exit 1" "1" "$rc"
TOTAL=$((TOTAL + 1))
if echo "$stderr_out" | grep -q "60"; then
  PASS=$((PASS + 1)); echo "  PASS: ERROR_ISSUE_STATE_FETCH stderr mentions issue number"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: ERROR_ISSUE_STATE_FETCH stderr mentions issue number"
  echo "    stderr: $stderr_out"
fi
unset SWEEP_GH_ISSUE_FAIL
sweep_teardown

# --- Test 1f: open-PR worktree with closed issue is kept (OPEN_BY_BRANCH guard) ---

echo "Test: open-PR worktree with closed issue is kept (OPEN_BY_BRANCH guard)"
sweep_setup
WT_PATH="$TMPDIR_TEST/project/worktrees/61-active-pr"
sweep_register_wt "$WT_PATH" "61-active-pr"
echo '[{"state":"OPEN","headRefName":"61-active-pr","number":888}]' \
  > "$STUB_DIR/gh-pr-list-all.json"
# Issue is CLOSED, but the OPEN_BY_BRANCH guard must short-circuit before gh issue view.
echo "CLOSED" > "$STUB_DIR/issue-state-61.txt"
key=$(sweep_path_key "$WT_PATH")
: > "$STUB_DIR/status${key}.txt"
echo "0" > "$STUB_DIR/revlist${key}.txt"

out=$("$TMPDIR_TEST/scripts/dispatch-sweep" 2>/dev/null); rc=$?
assert_eq "open-PR closed-issue sweep exits 0" "0" "$rc"

calls=$(cat "$STUB_DIR/calls" 2>/dev/null || true)
TOTAL=$((TOTAL + 1))
if ! echo "$calls" | grep -q "worktree-remove"; then
  PASS=$((PASS + 1)); echo "  PASS: open-PR worktree not removed despite closed issue"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: open-PR worktree not removed despite closed issue"
  echo "    calls: $calls"
fi
sweep_teardown

# --- Test 15: Step 3 with live name-match — merged+in-sync worktree is kept --
#
# A merged + in-sync worktree whose basename matches a live session in the
# fake-claude registry must NOT be removed; the script must log
# SKIP_MERGED_LIVE_SESSION and add it to the surviving list.

echo "Test: Step 3 skips merged+in-sync worktree when a live session matches its basename"
sweep_setup
WT_PATH="$TMPDIR_TEST/project/worktrees/70-live-merged"
sweep_register_wt "$WT_PATH" "70-live-merged"
key=$(sweep_path_key "$WT_PATH")
: > "$STUB_DIR/status${key}.txt"
echo "0" > "$STUB_DIR/revlist${key}.txt"
echo '[{"number":300,"headRefName":"70-live-merged","state":"MERGED"}]' \
  > "$STUB_DIR/gh-pr-list-all.json"
# Register a live session whose name matches the worktree's basename.
sweep_fake_claude_sessions_by_name "70-live-merged=sess-live-70"

out=$("$TMPDIR_TEST/scripts/dispatch-sweep" 2>/dev/null); rc=$?
assert_eq "Step3-live-merged sweep exits 0" "0" "$rc"

# The worktree must NOT have been removed.
calls=$(cat "$STUB_DIR/calls" 2>/dev/null || true)
TOTAL=$((TOTAL + 1))
if echo "$calls" | grep -q "worktree-remove:$WT_PATH"; then
  FAIL=$((FAIL + 1)); echo "  FAIL: Step 3 must NOT remove a worktree with a live session"
  echo "    calls: $calls"
else
  PASS=$((PASS + 1)); echo "  PASS: Step 3 did not remove the live-session worktree"
fi

# The log must carry SKIP_MERGED_LIVE_SESSION.
TOTAL=$((TOTAL + 1))
if grep -q "SKIP_MERGED_LIVE_SESSION: '$WT_PATH' branch=70-live-merged pr=#300" \
   "$DISPATCH_SWEEP_LOG_FILE"; then
  PASS=$((PASS + 1)); echo "  PASS: SKIP_MERGED_LIVE_SESSION log line present"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: SKIP_MERGED_LIVE_SESSION log line present"
  echo "    log:"; sed 's/^/      /' "$DISPATCH_SWEEP_LOG_FILE" 2>/dev/null
fi
sweep_teardown

# --- Test 16: Step 3 happy path — merged+in-sync with no live session is removed

echo "Test: Step 3 removes merged+in-sync worktree when no live session matches its basename"
sweep_setup
WT_PATH="$TMPDIR_TEST/project/worktrees/71-no-live-merged"
sweep_register_wt "$WT_PATH" "71-no-live-merged"
key=$(sweep_path_key "$WT_PATH")
: > "$STUB_DIR/status${key}.txt"
echo "0" > "$STUB_DIR/revlist${key}.txt"
echo '[{"number":301,"headRefName":"71-no-live-merged","state":"MERGED"}]' \
  > "$STUB_DIR/gh-pr-list-all.json"
# Default fake (no live sessions) — the worktree is free to remove.

out=$("$TMPDIR_TEST/scripts/dispatch-sweep" 2>/dev/null); rc=$?
assert_eq "Step3-no-live-merged sweep exits 0" "0" "$rc"

calls=$(cat "$STUB_DIR/calls" 2>/dev/null || true)
TOTAL=$((TOTAL + 1))
if echo "$calls" | grep -qx "worktree-remove:$WT_PATH"; then
  PASS=$((PASS + 1)); echo "  PASS: Step 3 removed the unoccupied merged worktree"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: Step 3 removed the unoccupied merged worktree"
  echo "    calls: $calls"
fi

TOTAL=$((TOTAL + 1))
if grep -q "REMOVE_MERGED: '$WT_PATH' branch=71-no-live-merged pr=#301" \
   "$DISPATCH_SWEEP_LOG_FILE"; then
  PASS=$((PASS + 1)); echo "  PASS: REMOVE_MERGED log line present"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: REMOVE_MERGED log line present"
  echo "    log:"; sed 's/^/      /' "$DISPATCH_SWEEP_LOG_FILE" 2>/dev/null
fi
sweep_teardown

# ============================================================================
# dispatch-acquire-lock tests
# ============================================================================
#
# Each test gets a fresh tmp tree:
#   $TMPDIR_TEST/stub/         lock file + per-test output capture files
#   $TMPDIR_TEST/scripts/      a copy of dispatch-acquire-lock
#   $TMPDIR_TEST/fake/         fake `claude` script for the liveness check
#
# DISPATCH_LOCK_FILE is exported so the script never touches the real shared
# lock. Every test sets CLAUDE_CODE_SESSION_ID directly to identify the caller,
# and uses lock_fake_claude_sessions to stub `claude agents --json` for the
# foreign-holder liveness check via CLAUDE_AGENTS_CMD.

lock_setup() {
  TMPDIR_TEST=$(mktemp -d)
  STUB_DIR="$TMPDIR_TEST/stub"
  mkdir -p "$STUB_DIR" "$TMPDIR_TEST/scripts" "$TMPDIR_TEST/fake"

  cp "$SCRIPT_DIR/dispatch-acquire-lock" "$TMPDIR_TEST/scripts/dispatch-acquire-lock"
  chmod +x "$TMPDIR_TEST/scripts/dispatch-acquire-lock"

  export DISPATCH_LOCK_FILE="$STUB_DIR/dispatch.lock"
}

lock_teardown() {
  rm -rf "$TMPDIR_TEST"
  TMPDIR_TEST=""
  STUB_DIR=""
  unset DISPATCH_LOCK_FILE CLAUDE_CODE_SESSION_ID CLAUDE_AGENTS_CMD \
    DISPATCH_LOCK_WAIT_INTERVAL DISPATCH_LOCK_WAIT_TIMEOUT
}

# Helper: install a fake `claude` whose `agents --json` invocation prints a
# JSON array of session objects carrying the given sessionIds (and exits 0).
# Points CLAUDE_AGENTS_CMD at the fake. Call with zero args to simulate an
# empty registry (`[]`). Safe to re-invoke mid-test: regenerates the fake.
#
# Each argument is either a bare sessionId or a `sid=cwd` entry. A bare sid
# emits `"cwd":""`; a `sid=/path` entry emits `"cwd":"/path"`. The cwd field
# feeds the marker-based reclaim path in dispatch-acquire-lock — tests that
# do not care about cwd can keep passing bare sessionIds unchanged.
lock_fake_claude_sessions() {
  local fake="$TMPDIR_TEST/fake/claude"
  local payload="[" entry sid cwd first=1
  for entry in "$@"; do
    if [[ "$entry" == *=* ]]; then
      sid="${entry%%=*}"
      cwd="${entry#*=}"
    else
      sid="$entry"
      cwd=""
    fi
    if (( first )); then first=0; else payload+=","; fi
    # Test paths under $TMPDIR_TEST never contain quotes or backslashes, so
    # raw interpolation is sufficient (no JSON-escaping needed).
    payload+="{\"sessionId\":\"$sid\",\"pid\":1,\"status\":\"busy\",\"name\":\"x\",\"cwd\":\"$cwd\"}"
  done
  payload+="]"
  printf '%s' "$payload" > "$TMPDIR_TEST/fake/payload.json"
  cat > "$fake" <<FAKE
#!/usr/bin/env bash
cat "$TMPDIR_TEST/fake/payload.json"
exit 0
FAKE
  chmod +x "$fake"
  export CLAUDE_AGENTS_CMD="$fake"
}

# Helper: install a fake `claude` whose `agents --json` invocation exits with
# the given non-zero code (and prints nothing). Used to exercise the
# fail-safe "treat foreign holder as live when the daemon cannot be queried"
# contract.
lock_fake_claude_failure() {
  local exit_code="${1:-1}"
  local fake="$TMPDIR_TEST/fake/claude"
  cat > "$fake" <<FAKE
#!/usr/bin/env bash
exit $exit_code
FAKE
  chmod +x "$fake"
  export CLAUDE_AGENTS_CMD="$fake"
}

# Helper: install a fake `claude` that exits 0 with the given literal stdout
# payload. Used to exercise is_live_session's fail-safe branches for output
# that is not a parseable JSON array of sessions (whitespace-only, non-array
# JSON like `{}`/`null`, malformed JSON).
lock_fake_claude_payload() {
  local payload="$1"
  local fake="$TMPDIR_TEST/fake/claude"
  printf '%s' "$payload" > "$TMPDIR_TEST/fake/payload.txt"
  cat > "$fake" <<FAKE
#!/usr/bin/env bash
cat "$TMPDIR_TEST/fake/payload.txt"
exit 0
FAKE
  chmod +x "$fake"
  export CLAUDE_AGENTS_CMD="$fake"
}

# --- Test 1: first acquisition with an absent lock file ----------------------

echo "Test: first acquisition writes the sessionId and prints acquired"
lock_setup
export CLAUDE_CODE_SESSION_ID="sess-100"
lock_fake_claude_sessions "sess-100"
# The lock file does not exist yet.
out=$("$TMPDIR_TEST/scripts/dispatch-acquire-lock" 2>/dev/null); rc=$?
assert_eq "first-acquisition exits 0" "0" "$rc"
assert_eq "first-acquisition prints acquired" "acquired" "$out"
lock_contents=$(cat "$DISPATCH_LOCK_FILE" 2>/dev/null || true)
assert_eq "lock file records the sessionId" "sess-100" "$lock_contents"
lock_teardown

# --- Test 2: two parallel invocations, distinct sessions ---------------------

echo "Test: two parallel invocations yield exactly one acquired, one busy"
lock_setup
# Both sessionIds are present in the registry — both are live.
lock_fake_claude_sessions "sess-200a" "sess-200b"
# Launch both in the background, each with its own sessionId, sharing the
# one lock file. The blocking flock serializes them.
( export CLAUDE_CODE_SESSION_ID="sess-200a"
  "$TMPDIR_TEST/scripts/dispatch-acquire-lock" ) >"$STUB_DIR/out-a" 2>&1 &
( export CLAUDE_CODE_SESSION_ID="sess-200b"
  "$TMPDIR_TEST/scripts/dispatch-acquire-lock" ) >"$STUB_DIR/out-b" 2>&1 &
wait
out_a=$(cat "$STUB_DIR/out-a" 2>/dev/null || true)
out_b=$(cat "$STUB_DIR/out-b" 2>/dev/null || true)
sorted=$(printf '%s\n%s\n' "$out_a" "$out_b" | sort)
assert_eq "parallel invocations: exactly one acquired, one busy" \
  "$(printf 'acquired\nbusy')" "$sorted"
lock_teardown

# --- Test 3: stale lock — recorded sessionId not in the registry -------------

echo "Test: stale lock with a recorded sessionId absent from the registry is reclaimed"
lock_setup
# Pre-write a recorded sessionId that no longer appears in the registry.
printf '%s\n' "sess-300-gone" > "$DISPATCH_LOCK_FILE"
export CLAUDE_CODE_SESSION_ID="sess-300-new"
lock_fake_claude_sessions "sess-300-new"   # registry knows only our session
out=$("$TMPDIR_TEST/scripts/dispatch-acquire-lock" 2>/dev/null); rc=$?
assert_eq "stale-absent-sid exits 0" "0" "$rc"
assert_eq "stale-absent-sid prints acquired" "acquired" "$out"
lock_contents=$(cat "$DISPATCH_LOCK_FILE" 2>/dev/null || true)
assert_eq "stale-absent-sid lock file rewritten to new sessionId" \
  "sess-300-new" "$lock_contents"
lock_teardown

# --- Test 4: stale lock — registry empty (no live sessions at all) -----------

echo "Test: stale lock with an empty registry is reclaimed"
lock_setup
printf '%s\n' "sess-400-gone" > "$DISPATCH_LOCK_FILE"
export CLAUDE_CODE_SESSION_ID="sess-400-new"
lock_fake_claude_sessions   # zero args → empty registry `[]`
out=$("$TMPDIR_TEST/scripts/dispatch-acquire-lock" 2>/dev/null); rc=$?
assert_eq "empty-registry exits 0" "0" "$rc"
assert_eq "empty-registry prints acquired" "acquired" "$out"
lock_contents=$(cat "$DISPATCH_LOCK_FILE" 2>/dev/null || true)
assert_eq "empty-registry lock file rewritten to new sessionId" \
  "sess-400-new" "$lock_contents"
lock_teardown

# --- Test 5: same-session re-entry -------------------------------------------

echo "Test: same-session re-entry proceeds (not busy)"
lock_setup
# The recorded sessionId is our own session and is in the registry.
printf '%s\n' "sess-500" > "$DISPATCH_LOCK_FILE"
export CLAUDE_CODE_SESSION_ID="sess-500"
lock_fake_claude_sessions "sess-500"
out=$("$TMPDIR_TEST/scripts/dispatch-acquire-lock" 2>/dev/null); rc=$?
assert_eq "re-entry exits 0" "0" "$rc"
assert_eq "re-entry prints acquired" "acquired" "$out"
lock_teardown

# --- Test 6a: misconfiguration — non-git dir, no DISPATCH_LOCK_FILE ----------

echo "Test: non-git dir with no DISPATCH_LOCK_FILE exits 2"
lock_setup
export CLAUDE_CODE_SESSION_ID="sess-600"
lock_fake_claude_sessions "sess-600"
nongit=$(mktemp -d)
# `set -e` is in effect: capture the exit code with an if/else. env -u strips
# the lock-file override for just this invocation.
if ( cd "$nongit" && env -u DISPATCH_LOCK_FILE \
       "$TMPDIR_TEST/scripts/dispatch-acquire-lock" ) 2>"$STUB_DIR/err6"; then
  rc=0
else
  rc=$?
fi
assert_eq "misconfiguration (non-git) exits 2" "2" "$rc"
err6=$(cat "$STUB_DIR/err6" 2>/dev/null || true)
# Assert the specific git-error message, not just non-empty stderr — this keeps
# the test's intent ("the git-lookup guard fired") robust to guard reordering:
# if Step 2 ever moved before Step 1, this assertion would fail rather than
# silently passing for the wrong reason.
TOTAL=$((TOTAL + 1))
if [[ "$err6" == *"not in a git repo"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: non-git misconfiguration writes the git-error to stderr"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: non-git misconfiguration writes the git-error to stderr"
  echo "    stderr: '$err6'"
fi
rm -rf "$nongit"
lock_teardown

# --- Test 6b: misconfiguration — CLAUDE_CODE_SESSION_ID unset → exit 2 -------

echo "Test: unset CLAUDE_CODE_SESSION_ID exits 2"
lock_setup
lock_fake_claude_sessions   # not strictly needed; daemon is never queried
# `set -e` is in effect: capture the exit code with an if/else. env -u strips
# CLAUDE_CODE_SESSION_ID for just this invocation.
if ( env -u CLAUDE_CODE_SESSION_ID \
       "$TMPDIR_TEST/scripts/dispatch-acquire-lock" ) 2>"$STUB_DIR/err6b"; then
  rc=0
else
  rc=$?
fi
assert_eq "missing CLAUDE_CODE_SESSION_ID exits 2" "2" "$rc"
err6b=$(cat "$STUB_DIR/err6b" 2>/dev/null || true)
TOTAL=$((TOTAL + 1))
if [[ "$err6b" == *"CLAUDE_CODE_SESSION_ID is unset"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: missing CLAUDE_CODE_SESSION_ID writes the session-id error to stderr"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: missing CLAUDE_CODE_SESSION_ID writes the session-id error to stderr"
  echo "    stderr: '$err6b'"
fi
lock_teardown

# --- Test 8: --wait with an own-session record acquires immediately ----------
#
# Our sessionId is recorded. --wait must NOT poll — try_acquire claims it on
# iteration 1. WAIT_TIMEOUT=0 proves no wait happened: a real wait would have
# to time out, which 0 cannot survive.

echo "Test: --wait with an own-session record acquires immediately"
lock_setup
printf '%s\n' "sess-800" > "$DISPATCH_LOCK_FILE"
export CLAUDE_CODE_SESSION_ID="sess-800"
lock_fake_claude_sessions "sess-800"
export DISPATCH_LOCK_WAIT_TIMEOUT=0
out=$("$TMPDIR_TEST/scripts/dispatch-acquire-lock" --wait 2>/dev/null); rc=$?
assert_eq "--wait own-session exits 0" "0" "$rc"
assert_eq "--wait own-session prints acquired" "acquired" "$out"
lock_teardown

# --- Test 9: --wait against a live foreign holder times out → busy -----------
#
# The recorded sessionId is a live foreign session that never leaves the
# registry. The --wait loop polls until WAIT_TIMEOUT elapses, then prints busy
# and exits 0.

echo "Test: --wait against a live foreign holder times out and prints busy"
lock_setup
printf '%s\n' "sess-900-foreign" > "$DISPATCH_LOCK_FILE"
export CLAUDE_CODE_SESSION_ID="sess-900-self"
lock_fake_claude_sessions "sess-900-foreign" "sess-900-self"
export DISPATCH_LOCK_WAIT_TIMEOUT=1
export DISPATCH_LOCK_WAIT_INTERVAL=0.2
# `set -e` is in effect: capture the exit code with an if/else.
if out=$("$TMPDIR_TEST/scripts/dispatch-acquire-lock" --wait 2>/dev/null); then
  rc=0
else
  rc=$?
fi
assert_eq "--wait timeout exits 0" "0" "$rc"
assert_eq "--wait timeout prints busy" "busy" "$out"
lock_teardown

# --- Test 10: --wait acquires once a contended holder goes stale -------------
#
# The recorded sessionId is live when --wait starts. Mid-wait we regenerate
# the fake `claude` to omit that sessionId, so the next poll's liveness check
# fails and the waiter reclaims the lock — recording its own sessionId.

echo "Test: --wait acquires once a contended holder goes stale"
lock_setup
printf '%s\n' "sess-1010-foreign" > "$DISPATCH_LOCK_FILE"
export CLAUDE_CODE_SESSION_ID="sess-1010-self"
lock_fake_claude_sessions "sess-1010-foreign" "sess-1010-self"
export DISPATCH_LOCK_WAIT_INTERVAL=0.1
export DISPATCH_LOCK_WAIT_TIMEOUT=10
( "$TMPDIR_TEST/scripts/dispatch-acquire-lock" --wait ) >"$STUB_DIR/out10" 2>&1 &
wait_pid=$!
sleep 0.5
# Holder goes away — regenerate the registry without its sessionId. The
# waiter has already exported CLAUDE_AGENTS_CMD; the fake script reads its
# payload file at run time, so rewriting the payload (and overwriting the
# script) is picked up by the next poll.
lock_fake_claude_sessions "sess-1010-self"
wait "$wait_pid"
out=$(cat "$STUB_DIR/out10" 2>/dev/null || true)
assert_eq "--wait reclaim prints acquired" "acquired" "$out"
lock_contents=$(cat "$DISPATCH_LOCK_FILE" 2>/dev/null || true)
assert_eq "--wait reclaim records our sessionId" "sess-1010-self" "$lock_contents"
lock_teardown

# --- Test 11: --release with an own-session record → released, file emptied --

echo "Test: --release with an own-session record clears the lock file"
lock_setup
printf '%s\n' "sess-1111" > "$DISPATCH_LOCK_FILE"
export CLAUDE_CODE_SESSION_ID="sess-1111"
lock_fake_claude_sessions "sess-1111"
out=$("$TMPDIR_TEST/scripts/dispatch-acquire-lock" --release 2>/dev/null); rc=$?
assert_eq "--release own-session exits 0" "0" "$rc"
assert_eq "--release own-session prints released" "released" "$out"
lock_contents=$(cat "$DISPATCH_LOCK_FILE" 2>/dev/null || true)
TOTAL=$((TOTAL + 1))
if [[ -z "$lock_contents" ]]; then
  PASS=$((PASS + 1)); echo "  PASS: --release empties the lock file"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: --release empties the lock file"
  echo "    lock file: '$lock_contents'"
fi
lock_teardown

# --- Test 12: --release with a foreign sessionId recorded → noop -------------

echo "Test: --release with a foreign sessionId recorded is a no-op"
lock_setup
printf '%s\n' "sess-1212-foreign" > "$DISPATCH_LOCK_FILE"
export CLAUDE_CODE_SESSION_ID="sess-1212-self"
lock_fake_claude_sessions "sess-1212-foreign" "sess-1212-self"
out=$("$TMPDIR_TEST/scripts/dispatch-acquire-lock" --release 2>/dev/null); rc=$?
assert_eq "--release foreign exits 0" "0" "$rc"
assert_eq "--release foreign prints noop" "noop" "$out"
lock_contents=$(cat "$DISPATCH_LOCK_FILE" 2>/dev/null || true)
assert_eq "--release foreign leaves the lock file unchanged" \
  "sess-1212-foreign" "$lock_contents"
lock_teardown

# --- Test 13: unknown argument exits 2 ---------------------------------------

echo "Test: an unknown argument exits 2"
lock_setup
# Set CLAUDE_CODE_SESSION_ID so the test exercises the arg-parse guard
# specifically. Without this, the script also exits 2 on the session-id guard
# (Step 2) — if Step 0 (arg parse) were ever moved after Step 2, this test
# would silently keep passing for the wrong reason.
export CLAUDE_CODE_SESSION_ID="sess-1300"
# `set -e` is in effect: capture the exit code with an if/else.
if ( "$TMPDIR_TEST/scripts/dispatch-acquire-lock" --bogus ) 2>"$STUB_DIR/err13"; then
  rc=0
else
  rc=$?
fi
assert_eq "unknown argument exits 2" "2" "$rc"
err13=$(cat "$STUB_DIR/err13" 2>/dev/null || true)
TOTAL=$((TOTAL + 1))
if [[ "$err13" == *"unknown argument"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: unknown argument writes the arg-parse error to stderr"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: unknown argument writes the arg-parse error to stderr"
  echo "    stderr: '$err13'"
fi
lock_teardown

# --- Test 14: a recorded sessionId absent from a non-empty registry is reclaimable

echo "Test: a recorded sessionId absent from a non-empty registry is reclaimable"
lock_setup
printf '%s\n' "sess-1414-gone" > "$DISPATCH_LOCK_FILE"
export CLAUDE_CODE_SESSION_ID="sess-1414-self"
# Registry has live sessions, but not the recorded holder — its session ended.
lock_fake_claude_sessions "sess-1414-other" "sess-1414-self"
out=$("$TMPDIR_TEST/scripts/dispatch-acquire-lock" 2>/dev/null); rc=$?
assert_eq "absent-from-registry exits 0" "0" "$rc"
assert_eq "absent-from-registry prints acquired" "acquired" "$out"
lock_contents=$(cat "$DISPATCH_LOCK_FILE" 2>/dev/null || true)
assert_eq "absent-from-registry lock file rewritten to caller's sessionId" \
  "sess-1414-self" "$lock_contents"
lock_teardown

# --- Test 15: daemon-unreachable → foreign holder treated as live → busy -----
#
# `claude agents --json` exits non-zero (binary missing, daemon down, etc.).
# The fail-safe contract says treat the recorded foreign holder as live — the
# lock must NOT be stolen. The caller prints busy.

echo "Test: daemon-unreachable treats a foreign holder as live (lock not stolen)"
lock_setup
printf '%s\n' "sess-1515-foreign" > "$DISPATCH_LOCK_FILE"
export CLAUDE_CODE_SESSION_ID="sess-1515-self"
lock_fake_claude_failure 1
out=$("$TMPDIR_TEST/scripts/dispatch-acquire-lock" 2>/dev/null); rc=$?
assert_eq "daemon-unreachable exits 0" "0" "$rc"
assert_eq "daemon-unreachable prints busy" "busy" "$out"
lock_contents=$(cat "$DISPATCH_LOCK_FILE" 2>/dev/null || true)
assert_eq "daemon-unreachable lock file is unchanged" \
  "sess-1515-foreign" "$lock_contents"
lock_teardown

# --- Test 16: --release with no lock file → noop, no error -------------------
#
# Tests 11/12 always pre-write a sessionId before --release; this exercises the
# absent-file branch that the script must treat as `noop` (nothing recorded to
# clear).

echo "Test: --release with no lock file prints noop"
lock_setup
export CLAUDE_CODE_SESSION_ID="sess-1616"
lock_fake_claude_sessions "sess-1616"
# Lock file deliberately not created.
out=$("$TMPDIR_TEST/scripts/dispatch-acquire-lock" --release 2>/dev/null); rc=$?
assert_eq "--release absent-file exits 0" "0" "$rc"
assert_eq "--release absent-file prints noop" "noop" "$out"
lock_teardown

# --- Test 17: opaque-failure stdout (whitespace-only) → foreign holder live --
#
# `claude agents --json` exits 0 but prints only whitespace. is_live_session
# must treat this as opaque/live (return 0) — the lock must not be stolen.

echo "Test: whitespace-only daemon stdout treats a foreign holder as live"
lock_setup
printf '%s\n' "sess-1717-foreign" > "$DISPATCH_LOCK_FILE"
export CLAUDE_CODE_SESSION_ID="sess-1717-self"
lock_fake_claude_payload $'   \n\t  \n'
out=$("$TMPDIR_TEST/scripts/dispatch-acquire-lock" 2>/dev/null); rc=$?
assert_eq "whitespace-stdout exits 0" "0" "$rc"
assert_eq "whitespace-stdout prints busy" "busy" "$out"
lock_contents=$(cat "$DISPATCH_LOCK_FILE" 2>/dev/null || true)
assert_eq "whitespace-stdout lock file is unchanged" \
  "sess-1717-foreign" "$lock_contents"
lock_teardown

# --- Test 18: non-array JSON stdout (object) → foreign holder live -----------
#
# `claude agents --json` exits 0 but prints a JSON object instead of an array
# (a daemon bug or API change). is_live_session's jq guard hits `error("not a
# JSON array")` and the function returns 0 (live). The lock must not be stolen.

echo "Test: non-array JSON daemon stdout treats a foreign holder as live"
lock_setup
printf '%s\n' "sess-1818-foreign" > "$DISPATCH_LOCK_FILE"
export CLAUDE_CODE_SESSION_ID="sess-1818-self"
lock_fake_claude_payload '{"error":"unexpected shape"}'
out=$("$TMPDIR_TEST/scripts/dispatch-acquire-lock" 2>/dev/null); rc=$?
assert_eq "non-array-json exits 0" "0" "$rc"
assert_eq "non-array-json prints busy" "busy" "$out"
lock_contents=$(cat "$DISPATCH_LOCK_FILE" 2>/dev/null || true)
assert_eq "non-array-json lock file is unchanged" \
  "sess-1818-foreign" "$lock_contents"
lock_teardown

# --- Test 19: malformed-JSON daemon stdout → foreign holder treated as live ---
#
# `claude agents --json` exits 0 but prints truncated/malformed JSON (a partial
# array like `[{"sessionId":`). jq cannot parse this — it exits non-zero — and
# is_live_session must treat the jq parse failure as opaque/live (return 0).
# The lock must NOT be stolen.

echo "Test: malformed-JSON daemon stdout treats a foreign holder as live"
lock_setup
printf '%s\n' "sess-1919-foreign" > "$DISPATCH_LOCK_FILE"
export CLAUDE_CODE_SESSION_ID="sess-1919-self"
lock_fake_claude_payload '[{"sessionId":'
out=$("$TMPDIR_TEST/scripts/dispatch-acquire-lock" 2>/dev/null); rc=$?
assert_eq "malformed-json exits 0" "0" "$rc"
assert_eq "malformed-json prints busy" "busy" "$out"
lock_contents=$(cat "$DISPATCH_LOCK_FILE" 2>/dev/null || true)
assert_eq "malformed-json lock file is unchanged" \
  "sess-1919-foreign" "$lock_contents"
lock_teardown

# --- Test 6c: --release with CLAUDE_CODE_SESSION_ID unset → exit 2 ----------
#
# The Step 2 CLAUDE_CODE_SESSION_ID guard runs before the `case "$MODE"` dispatch
# so `--release` fails the same way as a plain acquire when the session-id is
# unset. The foreign lock holder must be left untouched.

echo "Test: --release with unset CLAUDE_CODE_SESSION_ID exits 2, lock unchanged"
lock_setup
printf '%s\n' "sess-6c-foreign" > "$DISPATCH_LOCK_FILE"
lock_fake_claude_sessions   # not queried; guard fires before the mode dispatch
if ( env -u CLAUDE_CODE_SESSION_ID \
       "$TMPDIR_TEST/scripts/dispatch-acquire-lock" --release ) 2>"$STUB_DIR/err6c"; then
  rc=0
else
  rc=$?
fi
assert_eq "--release missing CLAUDE_CODE_SESSION_ID exits 2" "2" "$rc"
err6c=$(cat "$STUB_DIR/err6c" 2>/dev/null || true)
TOTAL=$((TOTAL + 1))
if [[ "$err6c" == *"CLAUDE_CODE_SESSION_ID is unset"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: --release missing-session-id writes the session-id error to stderr"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: --release missing-session-id writes the session-id error to stderr"
  echo "    stderr: '$err6c'"
fi
lock_contents=$(cat "$DISPATCH_LOCK_FILE" 2>/dev/null || true)
assert_eq "--release missing-session-id leaves the foreign lock intact" \
  "sess-6c-foreign" "$lock_contents"
lock_teardown

# --- Test 20: live foreign holder with marker → reclaim ----------------------
#
# A foreign holder's session is still live AND its cwd carries the
# tmp/dispatch-worktree marker, meaning it has completed Step 5. acquire must
# reclaim the lock (lenient branch) rather than block.

echo "Test: live foreign holder with marker → reclaim"
lock_setup
printf '%s\n' "sess-2020-foreign" > "$DISPATCH_LOCK_FILE"
export CLAUDE_CODE_SESSION_ID="sess-2020-self"
# Build the foreign holder's marker-bearing cwd inside the test tmp tree.
foreign_cwd="$TMPDIR_TEST/foreign-worktree"
mkdir -p "$foreign_cwd/tmp"
# The marker names the recorded holder (sess-2020-foreign) → reclaim.
printf '%s\n' "sess-2020-foreign" > "$foreign_cwd/tmp/dispatch-worktree"
lock_fake_claude_sessions "sess-2020-foreign=$foreign_cwd" "sess-2020-self=$TMPDIR_TEST"
out=$("$TMPDIR_TEST/scripts/dispatch-acquire-lock" 2>/dev/null); rc=$?
assert_eq "past-Step-5 holder reclaim exits 0" "0" "$rc"
assert_eq "past-Step-5 holder reclaim prints acquired" "acquired" "$out"
lock_contents=$(cat "$DISPATCH_LOCK_FILE" 2>/dev/null || true)
assert_eq "past-Step-5 holder reclaim rewrites lock to caller's sessionId" \
  "sess-2020-self" "$lock_contents"
lock_teardown

# --- Test 21: live foreign holder WITHOUT marker → busy (regression) ---------
#
# Today's strict blocking behavior on an in-flight Step 0–5 holder MUST be
# preserved: a live foreign holder whose cwd has no marker is still in
# selection and the lock must hold it.

echo "Test: live foreign holder without marker → busy (in-flight)"
lock_setup
printf '%s\n' "sess-2121-foreign" > "$DISPATCH_LOCK_FILE"
export CLAUDE_CODE_SESSION_ID="sess-2121-self"
foreign_cwd="$TMPDIR_TEST/foreign-worktree-no-marker"
mkdir -p "$foreign_cwd"   # cwd exists but marker file does NOT
lock_fake_claude_sessions "sess-2121-foreign=$foreign_cwd" "sess-2121-self=$TMPDIR_TEST"
out=$("$TMPDIR_TEST/scripts/dispatch-acquire-lock" 2>/dev/null); rc=$?
assert_eq "in-flight holder blocks: exits 0" "0" "$rc"
assert_eq "in-flight holder blocks: prints busy" "busy" "$out"
lock_contents=$(cat "$DISPATCH_LOCK_FILE" 2>/dev/null || true)
assert_eq "in-flight holder blocks: lock file unchanged" \
  "sess-2121-foreign" "$lock_contents"
lock_teardown

# --- Test 22: --release with marker present → released (lenient) ------------
#
# A caller whose CLAUDE_CODE_SESSION_ID differs from the recorded holder can
# still --release when the holder's cwd carries the marker. Closes the silent
# `noop` leak that today blocks subsequent /dispatch-propagate ticks.

echo "Test: --release with marker present from a different-sessionId caller → released"
lock_setup
printf '%s\n' "sess-2222-foreign" > "$DISPATCH_LOCK_FILE"
export CLAUDE_CODE_SESSION_ID="sess-2222-self"
foreign_cwd="$TMPDIR_TEST/foreign-worktree-with-marker"
mkdir -p "$foreign_cwd/tmp"
# The marker names the recorded holder (sess-2222-foreign) → lenient release.
printf '%s\n' "sess-2222-foreign" > "$foreign_cwd/tmp/dispatch-worktree"
lock_fake_claude_sessions "sess-2222-foreign=$foreign_cwd" "sess-2222-self=$TMPDIR_TEST"
out=$("$TMPDIR_TEST/scripts/dispatch-acquire-lock" --release 2>/dev/null); rc=$?
assert_eq "lenient --release exits 0" "0" "$rc"
assert_eq "lenient --release prints released" "released" "$out"
lock_contents=$(cat "$DISPATCH_LOCK_FILE" 2>/dev/null || true)
assert_eq "lenient --release empties the lock file" "" "$lock_contents"
lock_teardown

# --- Test 23: --release with NO marker → noop (strict pre-marker) -----------
#
# Refinement of Test 12: the marker is what flips the verdict to released.
# Without a marker, a different-sessionId caller's --release stays a noop and
# the lock file is left intact for the in-flight holder.

echo "Test: --release with foreign holder and NO marker → noop (pre-marker stop path)"
lock_setup
printf '%s\n' "sess-2323-foreign" > "$DISPATCH_LOCK_FILE"
export CLAUDE_CODE_SESSION_ID="sess-2323-self"
foreign_cwd="$TMPDIR_TEST/foreign-worktree-no-marker-release"
mkdir -p "$foreign_cwd"   # no marker
lock_fake_claude_sessions "sess-2323-foreign=$foreign_cwd" "sess-2323-self=$TMPDIR_TEST"
out=$("$TMPDIR_TEST/scripts/dispatch-acquire-lock" --release 2>/dev/null); rc=$?
assert_eq "pre-marker --release exits 0" "0" "$rc"
assert_eq "pre-marker --release prints noop" "noop" "$out"
lock_contents=$(cat "$DISPATCH_LOCK_FILE" 2>/dev/null || true)
assert_eq "pre-marker --release leaves the lock file unchanged" \
  "sess-2323-foreign" "$lock_contents"
lock_teardown

# --- Test 24: live foreign holder with MISMATCHED marker → busy (#928) -------
#
# The marker exists but names a DIFFERENT (older, since-finalized) session, not
# the recorded holder. A live mid-selection holder launched from a previously-
# marked worktree must NOT have its lock reclaimed: marker_names_holder rejects
# the content mismatch, so acquire stays busy.

echo "Test: live foreign holder with mismatched marker → busy (#928)"
lock_setup
printf '%s\n' "sess-2424-foreign" > "$DISPATCH_LOCK_FILE"
export CLAUDE_CODE_SESSION_ID="sess-2424-self"
foreign_cwd="$TMPDIR_TEST/foreign-worktree-stale-marker"
mkdir -p "$foreign_cwd/tmp"
# Marker names an unrelated, older session — not the recorded holder.
printf '%s\n' "sess-2424-some-older-session" > "$foreign_cwd/tmp/dispatch-worktree"
lock_fake_claude_sessions "sess-2424-foreign=$foreign_cwd" "sess-2424-self=$TMPDIR_TEST"
out=$("$TMPDIR_TEST/scripts/dispatch-acquire-lock" 2>/dev/null); rc=$?
assert_eq "mismatched-marker holder blocks: exits 0" "0" "$rc"
assert_eq "mismatched-marker holder blocks: prints busy" "busy" "$out"
lock_contents=$(cat "$DISPATCH_LOCK_FILE" 2>/dev/null || true)
assert_eq "mismatched-marker holder blocks: lock file unchanged" \
  "sess-2424-foreign" "$lock_contents"
lock_teardown

# --- Test 25: live foreign holder with EMPTY marker → busy (#928) ------------
#
# An empty marker is the shape stamped by .claude/hooks/worktree-create.sh's
# `touch` on every worktree creation. It names no session, so it must never
# reclaim a live holder co-located in that worktree.

echo "Test: live foreign holder with empty (touch) marker → busy (#928)"
lock_setup
printf '%s\n' "sess-2525-foreign" > "$DISPATCH_LOCK_FILE"
export CLAUDE_CODE_SESSION_ID="sess-2525-self"
foreign_cwd="$TMPDIR_TEST/foreign-worktree-empty-marker"
mkdir -p "$foreign_cwd/tmp"
# The hook's shape: a content-less marker.
touch "$foreign_cwd/tmp/dispatch-worktree"
lock_fake_claude_sessions "sess-2525-foreign=$foreign_cwd" "sess-2525-self=$TMPDIR_TEST"
out=$("$TMPDIR_TEST/scripts/dispatch-acquire-lock" 2>/dev/null); rc=$?
assert_eq "empty-marker holder blocks: exits 0" "0" "$rc"
assert_eq "empty-marker holder blocks: prints busy" "busy" "$out"
lock_contents=$(cat "$DISPATCH_LOCK_FILE" 2>/dev/null || true)
assert_eq "empty-marker holder blocks: lock file unchanged" \
  "sess-2525-foreign" "$lock_contents"
lock_teardown

# --- Test 25b: live foreign holder with FIFO marker → busy (no deadlock) -----
#
# marker_names_holder reads the marker's content; a non-regular file (here a
# FIFO) at that path would block the read indefinitely while the flock is held,
# deadlocking all routing. The regular-file guard must reject it and stay busy
# rather than reclaim or hang. A `timeout` bounds the call so a regression
# (reverting to a blocking read) surfaces as a hang, not a silent pass.

echo "Test: live foreign holder with FIFO marker → busy (no deadlock)"
lock_setup
printf '%s\n' "sess-25b-foreign" > "$DISPATCH_LOCK_FILE"
export CLAUDE_CODE_SESSION_ID="sess-25b-self"
foreign_cwd="$TMPDIR_TEST/foreign-worktree-fifo-marker"
mkdir -p "$foreign_cwd/tmp"
mkfifo "$foreign_cwd/tmp/dispatch-worktree"
lock_fake_claude_sessions "sess-25b-foreign=$foreign_cwd" "sess-25b-self=$TMPDIR_TEST"
out=$(timeout 10 "$TMPDIR_TEST/scripts/dispatch-acquire-lock" 2>/dev/null); rc=$?
assert_eq "fifo-marker holder blocks: exits 0 (no timeout/hang)" "0" "$rc"
assert_eq "fifo-marker holder blocks: prints busy" "busy" "$out"
lock_contents=$(cat "$DISPATCH_LOCK_FILE" 2>/dev/null || true)
assert_eq "fifo-marker holder blocks: lock file unchanged" \
  "sess-25b-foreign" "$lock_contents"
rm -f "$foreign_cwd/tmp/dispatch-worktree"
lock_teardown

# --- Test 26: --release with MISMATCHED marker → noop (#928) -----------------
#
# Symmetry with Test 24: a lenient --release must not fire when the marker
# names a session other than the recorded holder. The lock stays intact.

echo "Test: --release with mismatched marker → noop (#928)"
lock_setup
printf '%s\n' "sess-2626-foreign" > "$DISPATCH_LOCK_FILE"
export CLAUDE_CODE_SESSION_ID="sess-2626-self"
foreign_cwd="$TMPDIR_TEST/foreign-worktree-mismatch-release"
mkdir -p "$foreign_cwd/tmp"
printf '%s\n' "sess-2626-some-older-session" > "$foreign_cwd/tmp/dispatch-worktree"
lock_fake_claude_sessions "sess-2626-foreign=$foreign_cwd" "sess-2626-self=$TMPDIR_TEST"
out=$("$TMPDIR_TEST/scripts/dispatch-acquire-lock" --release 2>/dev/null); rc=$?
assert_eq "mismatched --release exits 0" "0" "$rc"
assert_eq "mismatched --release prints noop" "noop" "$out"
lock_contents=$(cat "$DISPATCH_LOCK_FILE" 2>/dev/null || true)
assert_eq "mismatched --release leaves the lock file unchanged" \
  "sess-2626-foreign" "$lock_contents"
lock_teardown

# ============================================================================
# lib-claude-agents.sh tests
# ============================================================================
echo "=== lib-claude-agents.sh ==="
#
# claude_sessions_under / worktree_has_live_session are sourced directly from
# the helper and exercised against a fake `claude` — a small temp script that
# CLAUDE_AGENTS_CMD points at by absolute path, so no real daemon is needed.
# The helper functions return non-zero on the "unknown" path; the test shell
# runs under `set -e`, so every call is wrapped in an `if` to capture the code.

# shellcheck source=/dev/null
source "$SCRIPT_DIR/lib-claude-agents.sh"

CA_DIR=""
CA_FAKE=""

ca_setup() {
  CA_DIR=$(mktemp -d)
  CA_FAKE="$CA_DIR/fake-claude"
}

ca_teardown() {
  rm -rf "$CA_DIR"
  CA_DIR=""
  CA_FAKE=""
  unset CLAUDE_AGENTS_CMD
}

# write_fake_claude <stdout-payload> <exit-code> — install a fake `claude` that
# prints <stdout-payload> verbatim and exits <exit-code>, ignoring its args,
# and point CLAUDE_AGENTS_CMD at it.
write_fake_claude() {
  local payload="$1" exit_code="$2"
  printf '%s' "$payload" > "$CA_DIR/payload.json"
  cat > "$CA_FAKE" <<FAKE
#!/usr/bin/env bash
cat "$CA_DIR/payload.json"
exit $exit_code
FAKE
  chmod +x "$CA_FAKE"
  CLAUDE_AGENTS_CMD="$CA_FAKE"
}

# --- Test 1: a live session is reported by both helpers ----------------------

echo "Test: a live session is reported by both helpers"
ca_setup
# worktree_has_live_session is now name-keyed: the session name must match
# basename "$CA_DIR" for the predicate to report occupied.
ca_basename=$(basename "$CA_DIR")
write_fake_claude "[{\"sessionId\":\"sess-1\",\"pid\":4242,\"status\":\"busy\",\"name\":\"$ca_basename\"}]" 0
if out=$(claude_sessions_under "$CA_DIR"); then rc=0; else rc=$?; fi
assert_eq "live: claude_sessions_under exits 0" "0" "$rc"
assert_eq "live: claude_sessions_under prints the session TSV line" \
  "$(printf 'sess-1\t4242\tbusy\t%s' "$ca_basename")" "$out"
if worktree_has_live_session "$CA_DIR"; then live=occupied; else live=free; fi
assert_eq "live: worktree_has_live_session reports occupied" "occupied" "$live"
ca_teardown

# --- Test 2: an empty registry means no live session ------------------------

echo "Test: an empty registry means no live session"
ca_setup
write_fake_claude '[]' 0
if worktree_has_live_session "$CA_DIR"; then live=occupied; else live=free; fi
assert_eq "empty: worktree_has_live_session reports free" "free" "$live"
ca_teardown

# --- Test 3: an empty [] is success with no lines, distinct from unknown ----

echo "Test: an empty [] is a successful no-sessions result, not unknown"
ca_setup
write_fake_claude '[]' 0
if out=$(claude_sessions_under "$CA_DIR"); then rc=0; else rc=$?; fi
assert_eq "empty: claude_sessions_under exits 0 (success, not unknown)" "0" "$rc"
assert_eq "empty: claude_sessions_under prints no session lines" "" "$out"
ca_teardown

# --- Test 4: a non-zero claude exit is unknown, folded to occupied ----------

echo "Test: a daemon-query failure is unknown and folds to occupied"
ca_setup
write_fake_claude '' 1
if out=$(claude_sessions_under "$CA_DIR"); then rc=0; else rc=$?; fi
assert_eq "daemon-fail: claude_sessions_under exits non-zero (unknown)" "1" "$rc"
if worktree_has_live_session "$CA_DIR"; then live=occupied; else live=free; fi
assert_eq "daemon-fail: worktree_has_live_session reports occupied" "occupied" "$live"
ca_teardown

# --- Test 5: a missing claude binary is unknown, folded to occupied ---------

echo "Test: a missing claude binary is unknown and folds to occupied"
ca_setup
CLAUDE_AGENTS_CMD="$CA_DIR/no-such-claude"
if out=$(claude_sessions_under "$CA_DIR"); then rc=0; else rc=$?; fi
assert_eq "missing-claude: claude_sessions_under exits non-zero (unknown)" "1" "$rc"
if worktree_has_live_session "$CA_DIR"; then live=occupied; else live=free; fi
assert_eq "missing-claude: worktree_has_live_session reports occupied" "occupied" "$live"
ca_teardown

# --- Test 6: non-array output is unknown, not no-sessions -------------------

echo "Test: non-array output is unknown, not a no-sessions result"
ca_setup
write_fake_claude '{}' 0
if out=$(claude_sessions_under "$CA_DIR"); then rc=0; else rc=$?; fi
assert_eq "non-array: claude_sessions_under exits non-zero (unknown)" "1" "$rc"
ca_teardown

# --- Test 7: a multi-session array yields one TSV line per session ----------

echo "Test: a multi-session array yields one TSV line per session"
ca_setup
write_fake_claude '[{"sessionId":"s-a","pid":11,"status":"busy","name":"alpha"},{"sessionId":"s-b","pid":22,"status":"idle","name":"beta"}]' 0
if out=$(claude_sessions_under "$CA_DIR"); then rc=0; else rc=$?; fi
assert_eq "multi: claude_sessions_under exits 0" "0" "$rc"
assert_eq "multi: claude_sessions_under prints both session TSV lines" \
  "$(printf 's-a\t11\tbusy\talpha\ns-b\t22\tidle\tbeta')" "$out"
ca_teardown

# --- Test 8: a zero exit with empty output is unknown, not no-sessions ------

echo "Test: a zero exit with empty output is unknown, not a no-sessions result"
ca_setup
write_fake_claude '' 0
if out=$(claude_sessions_under "$CA_DIR"); then rc=0; else rc=$?; fi
assert_eq "empty-output: claude_sessions_under exits non-zero (unknown)" "1" "$rc"
if worktree_has_live_session "$CA_DIR"; then live=occupied; else live=free; fi
assert_eq "empty-output: worktree_has_live_session reports occupied" "occupied" "$live"
ca_teardown

# --- Test 9: claude_sessions_under invokes `claude` with --cwd <path> -------

echo "Test: claude_sessions_under invokes claude with --cwd <path>"
ca_setup
# A fake claude that records its argv to a file, then prints a valid empty
# registry. write_fake_claude ignores argv, so verifying the server-side
# --cwd filter is actually passed through needs a bespoke fake.
cat > "$CA_FAKE" <<FAKE
#!/usr/bin/env bash
printf '%s\n' "\$@" > "$CA_DIR/argv"
echo '[]'
FAKE
chmod +x "$CA_FAKE"
CLAUDE_AGENTS_CMD="$CA_FAKE"
if claude_sessions_under "$CA_DIR" >/dev/null; then rc=0; else rc=$?; fi
assert_eq "cwd-arg: claude_sessions_under exits 0" "0" "$rc"
assert_eq "cwd-arg: claude invoked as 'agents --json --cwd <path>'" \
  "$(printf 'agents\n--json\n--cwd\n%s' "$CA_DIR")" "$(cat "$CA_DIR/argv")"
ca_teardown

# --- Test 10: claude_agents_count_by_name_prefix counts prefix-matching ----

echo "Test: claude_agents_count_by_name_prefix matches 2 of 3 sessions"
ca_setup
write_fake_claude '[
  {"sessionId":"a","pid":1,"status":"busy","name":"dispatch-worker-845-foo"},
  {"sessionId":"b","pid":2,"status":"busy","name":"dispatch-worker-720-bar"},
  {"sessionId":"c","pid":3,"status":"idle","name":"dispatch-router-baz"}
]' 0
if out=$(claude_agents_count_by_name_prefix dispatch-worker-); then rc=0; else rc=$?; fi
assert_eq "count: exits 0" "0" "$rc"
assert_eq "count: 2 of 3 match dispatch-worker-" "2" "$out"
ca_teardown

# --- Test 11: claude_agents_count_by_name_prefix returns 0 for no matches --

echo "Test: claude_agents_count_by_name_prefix returns 0 for no matches"
ca_setup
write_fake_claude '[{"sessionId":"a","pid":1,"status":"busy","name":"other-thing"}]' 0
if out=$(claude_agents_count_by_name_prefix dispatch-worker-); then rc=0; else rc=$?; fi
assert_eq "no-match: exits 0" "0" "$rc"
assert_eq "no-match: prints 0" "0" "$out"
ca_teardown

# --- Test 12: claude_agents_count_by_name_prefix reports UNKNOWN on failure-

echo "Test: claude_agents_count_by_name_prefix returns rc 1 on daemon failure"
ca_setup
write_fake_claude '' 1
if out=$(claude_agents_count_by_name_prefix dispatch-worker-); then rc=0; else rc=$?; fi
assert_eq "daemon-fail: exits non-zero (UNKNOWN)" "1" "$rc"
assert_eq "daemon-fail: prints nothing" "" "$out"
ca_teardown

# --- Test 13: claude_agents_count_by_name_prefix rejects non-array output --

echo "Test: claude_agents_count_by_name_prefix returns rc 1 on non-array output"
ca_setup
write_fake_claude '{}' 0
if out=$(claude_agents_count_by_name_prefix dispatch-worker-); then rc=0; else rc=$?; fi
assert_eq "non-array: exits non-zero (UNKNOWN)" "1" "$rc"
ca_teardown

# --- Test 14: router concurrency gate — skip when live >= target ----------

echo "Test: router gate skips spawn when live_count >= target_N"
ca_setup
# Three live dispatch-worker-* agents, target = 2 → skip branch.
write_fake_claude '[
  {"sessionId":"a","pid":1,"status":"busy","name":"dispatch-worker-1"},
  {"sessionId":"b","pid":2,"status":"busy","name":"dispatch-worker-2"},
  {"sessionId":"c","pid":3,"status":"busy","name":"dispatch-worker-3"}
]' 0
TARGET_N=2
ROUTE=""
if LIVE_COUNT=$(claude_agents_count_by_name_prefix dispatch-worker-); then
  if (( LIVE_COUNT >= TARGET_N )); then
    ROUTE="skip"
  else
    ROUTE="spawn"
  fi
else
  ROUTE="spawn-failopen"
fi
assert_eq "router-gate: 3 live >= target 2 → skip" "skip" "$ROUTE"
ca_teardown

# --- Test 15: router concurrency gate — spawn when live < target ----------

echo "Test: router gate spawns when live_count < target_N"
ca_setup
write_fake_claude '[{"sessionId":"a","pid":1,"status":"busy","name":"dispatch-worker-1"}]' 0
TARGET_N=2
ROUTE=""
if LIVE_COUNT=$(claude_agents_count_by_name_prefix dispatch-worker-); then
  if (( LIVE_COUNT >= TARGET_N )); then
    ROUTE="skip"
  else
    ROUTE="spawn"
  fi
else
  ROUTE="spawn-failopen"
fi
assert_eq "router-gate: 1 live < target 2 → spawn" "spawn" "$ROUTE"
ca_teardown

# --- Test 16: router concurrency gate — fail open when daemon UNKNOWN -----

echo "Test: router gate fails open to spawn when daemon UNKNOWN"
ca_setup
write_fake_claude '' 1
TARGET_N=2
ROUTE=""
if LIVE_COUNT=$(claude_agents_count_by_name_prefix dispatch-worker-); then
  if (( LIVE_COUNT >= TARGET_N )); then
    ROUTE="skip"
  else
    ROUTE="spawn"
  fi
else
  ROUTE="spawn-failopen"
fi
assert_eq "router-gate: daemon UNKNOWN → spawn-failopen" "spawn-failopen" "$ROUTE"
ca_teardown

# --- Test 17: claude_sessions_with_name — matched name exits 0 with TSV -----

echo "Test: claude_sessions_with_name exits 0 and emits TSV for matched name"
ca_setup
write_fake_claude '[{"sessionId":"sess-a","pid":111,"status":"busy","name":"my-worktree"}]' 0
if out=$(claude_sessions_with_name "my-worktree"); then rc=0; else rc=$?; fi
assert_eq "name-match: exits 0" "0" "$rc"
assert_eq "name-match: prints the TSV line" \
  "$(printf 'sess-a\t111\tbusy\tmy-worktree')" "$out"
ca_teardown

# --- Test 18: claude_sessions_with_name — no match exits 0 with no output ---

echo "Test: claude_sessions_with_name exits 0 and emits nothing when name not found"
ca_setup
write_fake_claude '[{"sessionId":"sess-a","pid":111,"status":"busy","name":"other-worktree"}]' 0
if out=$(claude_sessions_with_name "my-worktree"); then rc=0; else rc=$?; fi
assert_eq "name-no-match: exits 0" "0" "$rc"
assert_eq "name-no-match: prints nothing" "" "$out"
ca_teardown

# --- Test 19: claude_sessions_with_name — multi-session, only matching names -

echo "Test: claude_sessions_with_name emits only the matching sessions from a mixed array"
ca_setup
write_fake_claude '[
  {"sessionId":"s-1","pid":10,"status":"busy","name":"target-wt"},
  {"sessionId":"s-2","pid":20,"status":"idle","name":"other-wt"},
  {"sessionId":"s-3","pid":30,"status":"busy","name":"target-wt"}
]' 0
if out=$(claude_sessions_with_name "target-wt"); then rc=0; else rc=$?; fi
assert_eq "name-multi: exits 0" "0" "$rc"
assert_eq "name-multi: prints only the two matching lines" \
  "$(printf 's-1\t10\tbusy\ttarget-wt\ns-3\t30\tbusy\ttarget-wt')" "$out"
ca_teardown

# --- Test 20: claude_sessions_with_name UNKNOWN cases ------------------------

echo "Test: claude_sessions_with_name returns rc 1 on daemon failure (non-zero exit)"
ca_setup
write_fake_claude '' 1
if out=$(claude_sessions_with_name "my-worktree"); then rc=0; else rc=$?; fi
assert_eq "name-daemon-fail: exits 1 (UNKNOWN)" "1" "$rc"
assert_eq "name-daemon-fail: prints nothing" "" "$out"
ca_teardown

echo "Test: claude_sessions_with_name returns rc 1 when claude binary is missing"
ca_setup
CLAUDE_AGENTS_CMD="$CA_DIR/no-such-claude"
if out=$(claude_sessions_with_name "my-worktree"); then rc=0; else rc=$?; fi
assert_eq "name-missing-claude: exits 1 (UNKNOWN)" "1" "$rc"
ca_teardown

echo "Test: claude_sessions_with_name returns rc 1 on non-array JSON output"
ca_setup
write_fake_claude '{}' 0
if out=$(claude_sessions_with_name "my-worktree"); then rc=0; else rc=$?; fi
assert_eq "name-non-array: exits 1 (UNKNOWN)" "1" "$rc"
ca_teardown

echo "Test: claude_sessions_with_name returns rc 1 on zero exit with empty output"
ca_setup
write_fake_claude '' 0
if out=$(claude_sessions_with_name "my-worktree"); then rc=0; else rc=$?; fi
assert_eq "name-empty-output: exits 1 (UNKNOWN)" "1" "$rc"
ca_teardown

# --- Test 21: claude_sessions_with_name — invoked WITHOUT --cwd arg ----------

echo "Test: claude_sessions_with_name invokes claude without a --cwd argument"
ca_setup
cat > "$CA_FAKE" <<FAKE
#!/usr/bin/env bash
printf '%s\n' "\$@" > "$CA_DIR/argv"
echo '[]'
FAKE
chmod +x "$CA_FAKE"
CLAUDE_AGENTS_CMD="$CA_FAKE"
if claude_sessions_with_name "any-name" >/dev/null; then rc=0; else rc=$?; fi
assert_eq "name-no-cwd: exits 0" "0" "$rc"
assert_eq "name-no-cwd: claude invoked as 'agents --json' (no --cwd)" \
  "$(printf 'agents\n--json')" "$(cat "$CA_DIR/argv")"
ca_teardown

# --- Test 22: claude_sessions_with_name — empty name arg exits 1 -------------

echo "Test: claude_sessions_with_name rejects empty name argument"
ca_setup
write_fake_claude '[]' 0
if out=$(claude_sessions_with_name "" 2>/dev/null); then rc=0; else rc=$?; fi
assert_eq "name-empty-arg: exits 1" "1" "$rc"
ca_teardown

# --- Test 23 (updated worktree_has_live_session): cwd-match but wrong name → FREE

echo "Test: worktree_has_live_session reports free when session cwd matches but name differs from basename"
ca_setup
# The session's cwd could match CA_DIR, but its name does NOT match basename "$CA_DIR".
# Under the old cwd-based semantics this would have reported occupied (via
# claude_sessions_under). Under the new name-based semantics it must report free.
# The fake returns a session whose name is 'wrong-name', not basename "$CA_DIR".
write_fake_claude '[{"sessionId":"s-x","pid":99,"status":"busy","name":"wrong-name"}]' 0
if worktree_has_live_session "$CA_DIR"; then live=occupied; else live=free; fi
assert_eq "regression-guard: cwd-match wrong-name → free" "free" "$live"
ca_teardown

# --- Test 24: verify_agent_registered_under skips a stopped row --------------

echo "Test: verify_agent_registered_under does not count a stopped session as registered"
ca_setup
export LIB_CLAUDE_AGENTS_VERIFY_INTERVAL_S=0
# A row whose name matches the target but whose status is "stopped" must not
# satisfy the verify — only a live successor counts (mirrors the dedup guards).
write_fake_claude '[{"sessionId":"s-1","pid":7,"status":"stopped","name":"dispatch-dead"}]' 0
if verify_agent_registered_under "dispatch-dead" "$CA_DIR"; then rc=0; else rc=$?; fi
assert_eq "verify-stopped: stopped row is not registered (rc 1)" "1" "$rc"
# Positive control: a live row with the same name does satisfy the verify.
write_fake_claude '[{"sessionId":"s-1","pid":7,"status":"busy","name":"dispatch-live"}]' 0
if verify_agent_registered_under "dispatch-live" "$CA_DIR"; then rc=0; else rc=$?; fi
assert_eq "verify-live: busy row is registered (rc 0)" "0" "$rc"
unset LIB_CLAUDE_AGENTS_VERIFY_INTERVAL_S
ca_teardown

# --- Test 25: verify_agent_registered_under rejects a non-numeric interval ---

echo "Test: verify_agent_registered_under rejects a non-numeric interval override"
ca_setup
# `inf` is a valid GNU `sleep` argument that would hang the verify forever. The
# guard must reject it, warn on stderr, and fall back to the 0.2 s default so
# the call still returns (here: exhausts to rc 1 against an empty registry).
export LIB_CLAUDE_AGENTS_VERIFY_INTERVAL_S=inf
write_fake_claude '[]' 0
if err=$(verify_agent_registered_under "dispatch-x" "$CA_DIR" 2>&1 1>/dev/null); then rc=0; else rc=$?; fi
assert_eq "verify-bad-interval: exhausts and returns 1" "1" "$rc"
TOTAL=$((TOTAL + 1))
if printf '%s' "$err" | grep -q "is not a non-negative number"; then
  PASS=$((PASS + 1)); echo "  PASS: verify-bad-interval: warns and falls back to default"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: verify-bad-interval: warns and falls back to default"
fi
unset LIB_CLAUDE_AGENTS_VERIFY_INTERVAL_S
ca_teardown

# ============================================================================
# dispatch-config-load tests
# ============================================================================
#
# Each test gets a fresh tmp tree:
#   $TMPDIR_TEST/scripts/   a copy of dispatch-config-load
#   $TMPDIR_TEST/config/    synthetic config directory (DISPATCH_CONFIG_DIR)
#
# DISPATCH_CONFIG_DIR is exported so the script never touches the real
# dispatch.config/ directory and does not require a git repo.

config_setup() {
  TMPDIR_TEST=$(mktemp -d)
  mkdir -p "$TMPDIR_TEST/scripts" "$TMPDIR_TEST/config"

  cp "$SCRIPT_DIR/dispatch-config-load" "$TMPDIR_TEST/scripts/dispatch-config-load"
  chmod +x "$TMPDIR_TEST/scripts/dispatch-config-load"

  export DISPATCH_CONFIG_DIR="$TMPDIR_TEST/config"
}

config_teardown() {
  rm -rf "$TMPDIR_TEST"
  TMPDIR_TEST=""
  unset DISPATCH_CONFIG_DIR
}

# --- Test 1: valid projects.json prints normalized JSON ----------------------

echo "Test: valid projects.json prints normalized JSON"
config_setup
cat > "$DISPATCH_CONFIG_DIR/projects.json" <<'EOF'
{
  "projects": [
    {
      "key": "test-project",
      "owner": "test-owner",
      "number": 42,
      "statusField": "Status",
      "statusInProgress": "In Progress",
      "statusDone": "Done"
    }
  ]
}
EOF
out=$("$TMPDIR_TEST/scripts/dispatch-config-load" projects 2>/dev/null); rc=$?
assert_eq "valid projects.json exits 0" "0" "$rc"
key=$(printf '%s' "$out" | jq -r '.projects[0].key')
assert_eq "valid projects.json key" "test-project" "$key"
owner=$(printf '%s' "$out" | jq -r '.projects[0].owner')
assert_eq "valid projects.json owner" "test-owner" "$owner"
config_teardown

# --- Test 2: valid jit.json prints normalized JSON ---------------------------

echo "Test: valid jit.json prints normalized JSON"
config_setup
cat > "$DISPATCH_CONFIG_DIR/jit.json" <<'EOF'
{
  "jits": [
    {
      "key": "test-chore",
      "repo": "test-owner/test-repo",
      "label": "jit:test-chore",
      "title": "Test recurring chore",
      "body": "Test chore body.",
      "project": "test-project",
      "remindAfterClose": "12h",
      "dueAfterClose": "24h",
      "debounce": "1h"
    }
  ]
}
EOF
out=$("$TMPDIR_TEST/scripts/dispatch-config-load" jit 2>/dev/null); rc=$?
assert_eq "valid jit.json exits 0" "0" "$rc"
jit_key=$(printf '%s' "$out" | jq -r '.jits[0].key')
assert_eq "valid jit.json key" "test-chore" "$jit_key"
jit_label=$(printf '%s' "$out" | jq -r '.jits[0].label')
assert_eq "valid jit.json label" "jit:test-chore" "$jit_label"
config_teardown

# --- Test 3: absent file prints no-config and exits 0 ------------------------

echo "Test: absent file prints no-config and exits 0"
config_setup
# no file written — config dir is empty
out=$("$TMPDIR_TEST/scripts/dispatch-config-load" projects 2>/dev/null); rc=$?
assert_eq "absent file exits 0" "0" "$rc"
assert_eq "absent file prints no-config" "no-config" "$out"
config_teardown

# --- Test 4: invalid JSON exits 1 with an error ------------------------------

echo "Test: invalid JSON exits 1 and stderr mentions the cause"
config_setup
printf 'not valid json {{{' > "$DISPATCH_CONFIG_DIR/projects.json"
rc=0
err=$("$TMPDIR_TEST/scripts/dispatch-config-load" projects 2>&1 1>/dev/null) || rc=$?
assert_eq "invalid JSON exits 1" "1" "$rc"
TOTAL=$((TOTAL + 1))
if [[ "$err" == *"invalid JSON"* || "$err" == *"parse error"* || "$err" == *"Invalid"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: invalid JSON stderr mentions the cause"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: invalid JSON stderr mentions the cause"
  echo "    stderr: $err"
fi
config_teardown

# --- Test 5: missing required field exits 1 and names the field --------------

echo "Test: missing required field exits 1 and stderr names the field"
config_setup
cat > "$DISPATCH_CONFIG_DIR/projects.json" <<'EOF'
{
  "projects": [
    {
      "key": "test-project",
      "owner": "test-owner",
      "number": 1,
      "statusInProgress": "In Progress",
      "statusDone": "Done"
    }
  ]
}
EOF
rc=0
err=$("$TMPDIR_TEST/scripts/dispatch-config-load" projects 2>&1 1>/dev/null) || rc=$?
assert_eq "missing required field exits 1" "1" "$rc"
if [[ "$err" == *"statusField"* ]]; then
  assert_eq "missing-field error names the field" "yes" "yes"
else
  assert_eq "missing-field error names the field" "yes" "no: $err"
fi
config_teardown

# --- Test 6: top-level array exits 1 with a clear error ----------------------

echo "Test: top-level array exits 1 and stderr reports a clear error"
config_setup
printf '[1,2,3]' > "$DISPATCH_CONFIG_DIR/projects.json"
rc=0
err=$("$TMPDIR_TEST/scripts/dispatch-config-load" projects 2>&1 1>/dev/null) || rc=$?
assert_eq "top-level array exits 1" "1" "$rc"
TOTAL=$((TOTAL + 1))
if [[ "$err" == *"error:"* && "$err" == *"projects.json"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: top-level array stderr has clear error: $err"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: top-level array stderr has clear error"
  echo "    stderr: $err"
fi
config_teardown

# --- Test 7: empty config file exits 1 with a clear error --------------------

echo "Test: empty config file exits 1 and stderr reports a clear error"
config_setup
printf '' > "$DISPATCH_CONFIG_DIR/projects.json"
rc=0
err=$("$TMPDIR_TEST/scripts/dispatch-config-load" projects 2>&1 1>/dev/null) || rc=$?
assert_eq "empty file exits 1" "1" "$rc"
TOTAL=$((TOTAL + 1))
if [[ "$err" == *"error:"* && "$err" == *"projects.json"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: empty file stderr has clear error: $err"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: empty file stderr has clear error"
  echo "    stderr: $err"
fi
config_teardown

# --- Test 8: valid target-workers.json prints normalized JSON ---------------

echo "Test: valid target-workers.json prints normalized JSON"
config_setup
cat > "$DISPATCH_CONFIG_DIR/target-workers.json" <<'EOF'
{
  "target_weekly_usage_pct": 85,
  "weekly_increment_cap_pct": 8,
  "five_hour_target_floor_pct": 55,
  "weekly_curve_power": 2
}
EOF
out=$("$TMPDIR_TEST/scripts/dispatch-config-load" target-workers 2>/dev/null); rc=$?
assert_eq "valid target-workers.json exits 0" "0" "$rc"
tw_target=$(printf '%s' "$out" | jq -r '.target_weekly_usage_pct')
assert_eq "valid target-workers.json target_weekly_usage_pct" "85" "$tw_target"
tw_cap=$(printf '%s' "$out" | jq -r '.weekly_increment_cap_pct')
assert_eq "valid target-workers.json weekly_increment_cap_pct" "8" "$tw_cap"
tw_floor5=$(printf '%s' "$out" | jq -r '.five_hour_target_floor_pct')
assert_eq "valid target-workers.json five_hour_target_floor_pct" "55" "$tw_floor5"
tw_power=$(printf '%s' "$out" | jq -r '.weekly_curve_power')
assert_eq "valid target-workers.json weekly_curve_power" "2" "$tw_power"
config_teardown

# --- Test 9: absent target-workers.json prints no-config and exits 0 --------

echo "Test: absent target-workers.json prints no-config and exits 0"
config_setup
out=$("$TMPDIR_TEST/scripts/dispatch-config-load" target-workers 2>/dev/null); rc=$?
assert_eq "absent target-workers.json exits 0" "0" "$rc"
assert_eq "absent target-workers.json prints no-config" "no-config" "$out"
config_teardown

# --- Test 10: target-workers.json with a non-number field exits 1 -----------

echo "Test: target-workers.json with non-number field exits 1 and stderr names it"
config_setup
cat > "$DISPATCH_CONFIG_DIR/target-workers.json" <<'EOF'
{"target_weekly_usage_pct": "ninety"}
EOF
rc=0
err=$("$TMPDIR_TEST/scripts/dispatch-config-load" target-workers 2>&1 1>/dev/null) || rc=$?
assert_eq "non-number tunable exits 1" "1" "$rc"
TOTAL=$((TOTAL + 1))
if [[ "$err" == *"target_weekly_usage_pct"* && "$err" == *"number"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: non-number tunable stderr names the field and type"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: non-number tunable stderr names the field and type"
  echo "    stderr: $err"
fi
config_teardown

# --- Test 11: empty object is accepted (every tunable is optional) ----------

echo "Test: empty object target-workers.json is accepted"
config_setup
echo '{}' > "$DISPATCH_CONFIG_DIR/target-workers.json"
out=$("$TMPDIR_TEST/scripts/dispatch-config-load" target-workers 2>/dev/null); rc=$?
assert_eq "empty object exits 0" "0" "$rc"
# jq normalizes "{}" to "{}".
out_compact=$(printf '%s' "$out" | jq -c '.')
assert_eq "empty object prints {}" "{}" "$out_compact"
config_teardown

# --- Test 12: weekly_headroom_taper_pct: 0 is rejected (must be > 0) --------

echo "Test: weekly_headroom_taper_pct: 0 exits 1 and stderr says must be > 0"
config_setup
cat > "$DISPATCH_CONFIG_DIR/target-workers.json" <<'EOF'
{"weekly_headroom_taper_pct": 0}
EOF
rc=0
err=$("$TMPDIR_TEST/scripts/dispatch-config-load" target-workers 2>&1 1>/dev/null) || rc=$?
assert_eq "weekly_headroom_taper_pct 0 exits 1" "1" "$rc"
TOTAL=$((TOTAL + 1))
if [[ "$err" == *"weekly_headroom_taper_pct"* && "$err" == *"must be > 0"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: weekly_headroom_taper_pct 0 stderr says must be > 0"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: weekly_headroom_taper_pct 0 stderr says must be > 0"
  echo "    stderr: $err"
fi
config_teardown

# --- Test 12b: five_hour_target_ceiling_pct: 101 rejected (must be <= 100) ---

echo "Test: five_hour_target_ceiling_pct: 101 exits 1 and stderr says must be <= 100"
config_setup
cat > "$DISPATCH_CONFIG_DIR/target-workers.json" <<'EOF'
{"five_hour_target_ceiling_pct": 101}
EOF
rc=0
err=$("$TMPDIR_TEST/scripts/dispatch-config-load" target-workers 2>&1 1>/dev/null) || rc=$?
assert_eq "five_hour_target_ceiling_pct 101 exits 1" "1" "$rc"
TOTAL=$((TOTAL + 1))
if [[ "$err" == *"five_hour_target_ceiling_pct"* && "$err" == *"<= 100"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: five_hour_target_ceiling_pct 101 stderr says <= 100"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: five_hour_target_ceiling_pct 101 stderr says <= 100"
  echo "    stderr: $err"
fi
config_teardown

# --- Test 12c: weekly_curve_power: 200 accepted (no upper bound) ------------

echo "Test: weekly_curve_power: 200 accepted (unbounded above)"
config_setup
cat > "$DISPATCH_CONFIG_DIR/target-workers.json" <<'EOF'
{"weekly_curve_power": 200}
EOF
out=$("$TMPDIR_TEST/scripts/dispatch-config-load" target-workers 2>/dev/null); rc=$?
assert_eq "weekly_curve_power 200 exits 0 (no upper bound)" "0" "$rc"
tw_power=$(printf '%s' "$out" | jq -r '.weekly_curve_power')
assert_eq "weekly_curve_power 200 preserved" "200" "$tw_power"
config_teardown

# --- Test 12d: weekly_curve_power: 0 rejected (must be > 0) -----------------

echo "Test: weekly_curve_power: 0 exits 1 and stderr says must be > 0"
config_setup
cat > "$DISPATCH_CONFIG_DIR/target-workers.json" <<'EOF'
{"weekly_curve_power": 0}
EOF
rc=0
err=$("$TMPDIR_TEST/scripts/dispatch-config-load" target-workers 2>&1 1>/dev/null) || rc=$?
assert_eq "weekly_curve_power 0 exits 1" "1" "$rc"
TOTAL=$((TOTAL + 1))
if [[ "$err" == *"weekly_curve_power"* && "$err" == *"must be > 0"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: weekly_curve_power 0 stderr says must be > 0"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: weekly_curve_power 0 stderr says must be > 0"
  echo "    stderr: $err"
fi
config_teardown

# --- Test 13: max_concurrent_workers: -1 is rejected (must be > 0) -----------

echo "Test: max_concurrent_workers: -1 exits 1 and stderr says must be > 0"
config_setup
cat > "$DISPATCH_CONFIG_DIR/target-workers.json" <<'EOF'
{"max_concurrent_workers": -1}
EOF
rc=0
err=$("$TMPDIR_TEST/scripts/dispatch-config-load" target-workers 2>&1 1>/dev/null) || rc=$?
assert_eq "max_concurrent_workers -1 exits 1" "1" "$rc"
TOTAL=$((TOTAL + 1))
if [[ "$err" == *"max_concurrent_workers"* && "$err" == *"must be > 0"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: max_concurrent_workers -1 stderr says must be > 0"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: max_concurrent_workers -1 stderr says must be > 0"
  echo "    stderr: $err"
fi
config_teardown

# --- Test 13b: max_concurrent_workers: 200 accepted (no upper bound) --------

echo "Test: max_concurrent_workers: 200 accepted (unbounded above)"
config_setup
cat > "$DISPATCH_CONFIG_DIR/target-workers.json" <<'EOF'
{"max_concurrent_workers": 200}
EOF
out=$("$TMPDIR_TEST/scripts/dispatch-config-load" target-workers 2>/dev/null); rc=$?
assert_eq "max_concurrent_workers 200 exits 0 (no upper bound)" "0" "$rc"
config_teardown

# --- Test 13c: weekly_increment_floor_pct > cap rejected (cross-field) -------

echo "Test: weekly_increment_floor_pct > weekly_increment_cap_pct exits 1"
config_setup
cat > "$DISPATCH_CONFIG_DIR/target-workers.json" <<'EOF'
{"weekly_increment_floor_pct": 20, "weekly_increment_cap_pct": 5}
EOF
rc=0
err=$("$TMPDIR_TEST/scripts/dispatch-config-load" target-workers 2>&1 1>/dev/null) || rc=$?
assert_eq "floor > cap exits 1" "1" "$rc"
TOTAL=$((TOTAL + 1))
if [[ "$err" == *"weekly_increment_floor_pct"* && "$err" == *"<= weekly_increment_cap_pct"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: floor > cap stderr names the ordering rule"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: floor > cap stderr names the ordering rule"
  echo "    stderr: $err"
fi
config_teardown

# --- Test 13d: floor == cap accepted; only floor-alone (default cap) accepted -

echo "Test: weekly_increment_floor_pct == cap accepted; floor alone accepted"
config_setup
cat > "$DISPATCH_CONFIG_DIR/target-workers.json" <<'EOF'
{"weekly_increment_floor_pct": 5, "weekly_increment_cap_pct": 5}
EOF
out=$("$TMPDIR_TEST/scripts/dispatch-config-load" target-workers 2>/dev/null); rc=$?
assert_eq "floor == cap exits 0" "0" "$rc"
# Cross-check only fires when both are present: floor alone (cap defaulted) is
# not flagged here, by design — the validator does not know the script default.
echo '{"weekly_increment_floor_pct": 50}' > "$DISPATCH_CONFIG_DIR/target-workers.json"
out=$("$TMPDIR_TEST/scripts/dispatch-config-load" target-workers 2>/dev/null); rc=$?
assert_eq "floor alone (cap absent) exits 0" "0" "$rc"
config_teardown

# --- Test 13e: five_hour_target_floor_pct > ceiling rejected (cross-field) ---

echo "Test: five_hour_target_floor_pct > five_hour_target_ceiling_pct exits 1"
config_setup
cat > "$DISPATCH_CONFIG_DIR/target-workers.json" <<'EOF'
{"five_hour_target_floor_pct": 80, "five_hour_target_ceiling_pct": 50}
EOF
rc=0
err=$("$TMPDIR_TEST/scripts/dispatch-config-load" target-workers 2>&1 1>/dev/null) || rc=$?
assert_eq "floor5 > ceil5 exits 1" "1" "$rc"
TOTAL=$((TOTAL + 1))
if [[ "$err" == *"five_hour_target_floor_pct"* && "$err" == *"<= five_hour_target_ceiling_pct"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: floor5 > ceil5 stderr names the ordering rule"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: floor5 > ceil5 stderr names the ordering rule"
  echo "    stderr: $err"
fi
config_teardown

# ============================================================================
# dispatch-target-workers tests
# ============================================================================
#
# Each test gets a fresh tmp tree:
#   $TMPDIR_TEST/scripts/   copies of dispatch-target-workers + dispatch-config-load
#   $TMPDIR_TEST/config/    synthetic config directory (DISPATCH_CONFIG_DIR)
#   $TMPDIR_TEST/rl/        synthetic rate_limits.json directory
#
# All telemetry inputs are env-overridable; tests rely on the overrides rather
# than fixture files when shape matters more than the file path. The script
# defaults are baked in (target_weekly=90, weekly_increment_floor=1,
# weekly_increment_cap=10, weekly_curve_power=1, weekly_headroom_taper=20,
# five_hour_target_floor=50, five_hour_target_ceiling=80,
# five_hour_headroom_taper=15, max_workers=8); tests that vary tunables write a
# target-workers.json into the config dir.
#
# The pace curve needs the elapsed fraction x of the weekly window. With
# WEEK_SECONDS=604800, x = (WEEK_SECONDS - (resets_at_weekly - now)) /
# WEEK_SECONDS. Tests place x precisely by fixing NOW and choosing resets_at so
# remaining = resets_at - NOW lands at the desired fraction of WEEK_SECONDS:
#   x=0.5  → remaining=302400 → resets_at = NOW + 302400
#   x=0.25 → remaining=453600 → resets_at = NOW + 453600
#   x=1.0  → remaining≈0      → resets_at = NOW + 1 (still > now so not the
#                               "window already reset" path)
# Verified canonical curve at defaults (target_weekly=90, T=34, p=1, end=4.294):
#   W(0.25)=12, W(0.5)=31, W(0.75)=57, W(0.9)=75.96, W(1.0)=90.
echo ""
echo "=== dispatch-target-workers ==="

# Helper: epoch math for placing x. WEEK_SECONDS=604800.
TW_NOW=1000000
# remaining for a target x: (1 - x) * WEEK_SECONDS.
tw_resets_for_x() {
  # $1 = x as a decimal; print resets_at = NOW + max(1, round((1-x)*604800)).
  # The max(1,...) keeps remaining strictly positive at x=1.0 so Stage 1 does
  # NOT take the "window already reset" (remaining<=0) early-exit; the curve
  # then evaluates at x≈1.0 where W≈target_weekly. (At remaining=1 second,
  # x = (604800-1)/604800 ≈ 0.9999983, so W is within ~0.0002% of W(1)=90.)
  awk -v now="$TW_NOW" -v x="$1" '
    BEGIN { rem = int((1 - x) * 604800 + 0.5); if (rem < 1) rem = 1; printf "%d\n", now + rem }'
}

tw_setup() {
  TMPDIR_TEST=$(mktemp -d)
  mkdir -p "$TMPDIR_TEST/scripts" "$TMPDIR_TEST/config" "$TMPDIR_TEST/rl"

  cp "$SCRIPT_DIR/dispatch-target-workers" "$TMPDIR_TEST/scripts/dispatch-target-workers"
  cp "$SCRIPT_DIR/dispatch-config-load" "$TMPDIR_TEST/scripts/dispatch-config-load"
  chmod +x "$TMPDIR_TEST/scripts/dispatch-target-workers" \
           "$TMPDIR_TEST/scripts/dispatch-config-load"

  export DISPATCH_CONFIG_DIR="$TMPDIR_TEST/config"
  # Default: point at an absent file so tests without explicit telemetry get
  # the missing-telemetry fallback unless they override env vars.
  export DISPATCH_TARGET_WORKERS_RATE_LIMITS_PATH="$TMPDIR_TEST/rl/missing.json"
}

tw_teardown() {
  rm -rf "$TMPDIR_TEST"
  TMPDIR_TEST=""
  unset DISPATCH_CONFIG_DIR
  unset DISPATCH_TARGET_WORKERS_RATE_LIMITS_PATH
  unset DISPATCH_TARGET_WORKERS_NOW
  unset DISPATCH_TARGET_WORKERS_USED_WEEKLY
  unset DISPATCH_TARGET_WORKERS_RESETS_AT_WEEKLY
  unset DISPATCH_TARGET_WORKERS_USED_5H
  unset DISPATCH_TARGET_WORKERS_RESETS_AT_5H
}

# write_rl <file-name> <used_weekly> <resets_weekly> <used_5h> <resets_5h>
#   Write a rate_limits.json with the four telemetry fields. Set any of the
#   four to the literal string "absent" to omit the surrounding block.
write_rl() {
  local name="$1" uw="$2" rw="$3" u5="$4" r5="$5"
  local path="$TMPDIR_TEST/rl/$name"
  local seven=""
  local five=""
  if [[ "$uw" != "absent" && "$rw" != "absent" ]]; then
    seven="\"seven_day\":{\"used_percentage\":$uw,\"resets_at\":$rw}"
  fi
  if [[ "$u5" != "absent" && "$r5" != "absent" ]]; then
    five="\"five_hour\":{\"used_percentage\":$u5,\"resets_at\":$r5}"
  fi
  local parts=()
  [[ -n "$five" ]] && parts+=("$five")
  [[ -n "$seven" ]] && parts+=("$seven")
  local joined
  joined=$(IFS=,; printf '%s' "${parts[*]}")
  printf '{%s}\n' "$joined" > "$path"
  export DISPATCH_TARGET_WORKERS_RATE_LIMITS_PATH="$path"
}

# --- Test 1: curve reaches target_weekly only at x=1 ------------------------

echo "Test: weekly curve reaches target only at week end (W < target for x<1)"
tw_setup
# At x<1 the cumulative curve W is below target_weekly=90, so used_weekly just
# under the curve value yields F>0/N>=1, while used_weekly just over the
# week-end target only stays under-pace once x reaches 1. Probe by setting
# used_weekly = 89 (just below the 90 terminal) at several x:
#   x=0.5  → W=31  → used_weekly=89 is far ahead of pace → F=0 → N=0
#   x=0.99 → W=88.5→ used_weekly=89 still ahead of pace  → F=0 → N=0
#   x=1.0  → W=90  → used_weekly=89 → hw=1 → F>0 → N>=1   (only now under pace)
export DISPATCH_TARGET_WORKERS_NOW="$TW_NOW"
for spec in "0.5:0" "0.99:0" "1.0:ge1"; do
  x="${spec%%:*}"; want="${spec##*:}"
  r=$(tw_resets_for_x "$x")
  write_rl "curve.json" 89 "$r" 0 99999999
  result=$("$TMPDIR_TEST/scripts/dispatch-target-workers" 2>/dev/null)
  if [[ "$want" == "ge1" ]]; then
    TOTAL=$((TOTAL + 1))
    if (( result >= 1 )); then
      PASS=$((PASS + 1)); echo "  PASS: x=$x used_weekly=89 under pace → N=$result (>=1)"
    else
      FAIL=$((FAIL + 1)); echo "  FAIL: x=$x used_weekly=89 expected N>=1, got $result"
    fi
  else
    assert_eq "curve x=$x used_weekly=89 ahead of pace → N=0" "$want" "$result"
  fi
done
tw_teardown

# --- Test 2: W matches the canonical curve at x=0.5 -------------------------

echo "Test: weekly curve value W(0.5)=31 gates F=0 at the boundary"
tw_setup
# x=0.5 → W=31. used_weekly=31 → hw=0 → F=0 → N=0 (exactly at pace).
# used_weekly=30 → hw=1 → F>0 → N>=1 (just under pace).
export DISPATCH_TARGET_WORKERS_NOW="$TW_NOW"
r=$(tw_resets_for_x 0.5)
write_rl "rl.json" 31 "$r" 0 99999999
out=$("$TMPDIR_TEST/scripts/dispatch-target-workers" 2>/dev/null)
assert_eq "W(0.5)=31; used_weekly=31 at pace → N=0" "0" "$out"
write_rl "rl.json" 30 "$r" 0 99999999
out=$("$TMPDIR_TEST/scripts/dispatch-target-workers" 2>/dev/null)
TOTAL=$((TOTAL + 1))
if (( out >= 1 )); then
  PASS=$((PASS + 1)); echo "  PASS: used_weekly=30 just under pace → N=$out (>=1)"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: used_weekly=30 expected N>=1, got $out"
fi
tw_teardown

# --- Test 3: increment cap clamp lowers the terminal W(1) -------------------

echo "Test: weekly_increment_cap_pct clamp makes W(1) < target_weekly"
tw_setup
# With cap=3: end = clamp(1+2*(90/34-1), .., 3) = 3, so W(1) = 34*(1*1 +
# (3-1)*1/2) = 34*2 = 68 < target_weekly=90. At x=1, used_weekly=69 (> 68) is
# ahead of the clamped pace → F=0 → N=0; used_weekly=67 (< 68) is under pace →
# N>=1. This proves the cap hard-ceils the curve below target.
cat > "$DISPATCH_CONFIG_DIR/target-workers.json" <<'EOF'
{"weekly_increment_cap_pct": 3}
EOF
export DISPATCH_TARGET_WORKERS_NOW="$TW_NOW"
r=$(tw_resets_for_x 1.0)
write_rl "rl.json" 69 "$r" 0 99999999
out=$("$TMPDIR_TEST/scripts/dispatch-target-workers" 2>/dev/null)
assert_eq "cap=3 → W(1)=68; used_weekly=69 ahead → N=0" "0" "$out"
write_rl "rl.json" 67 "$r" 0 99999999
out=$("$TMPDIR_TEST/scripts/dispatch-target-workers" 2>/dev/null)
TOTAL=$((TOTAL + 1))
if (( out >= 1 )); then
  PASS=$((PASS + 1)); echo "  PASS: cap=3 W(1)=68; used_weekly=67 under pace → N=$out (>=1)"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: cap=3 used_weekly=67 expected N>=1, got $out"
fi
tw_teardown

# --- Test 4: increment floor sets the early-week minimum --------------------

echo "Test: weekly_increment_floor_pct sets the curve's early-week minimum"
tw_setup
# Raising the floor lifts the early-week curve. With floor=5, cap=5: end =
# clamp(1+2*(90/34-5)? no — end = floor + 2*(90/34 - floor) = 5 + 2*(2.647-5)
# = 5 - 4.706 = 0.294, then clamped to <=cap=5 (stays 0.294). The increment
# d(x) = floor + (end-floor)*x = 5 - 4.706*x stays near 5 early-week, so W
# rises fast at first. W(0.25) = 34*(5*0.25 + (0.294-5)*0.0625/2) =
# 34*(1.25 - 0.1471) = 34*1.1029 = 37.5. used_weekly=37 (< 37.5) under pace →
# N>=1; used_weekly=38 (> 37.5) ahead → N=0. (Default floor=1 gives W(0.25)=12,
# so the higher floor lifts early W from 12 to 37.5.)
cat > "$DISPATCH_CONFIG_DIR/target-workers.json" <<'EOF'
{"weekly_increment_floor_pct": 5, "weekly_increment_cap_pct": 5}
EOF
export DISPATCH_TARGET_WORKERS_NOW="$TW_NOW"
r=$(tw_resets_for_x 0.25)
write_rl "rl.json" 37 "$r" 0 99999999
out=$("$TMPDIR_TEST/scripts/dispatch-target-workers" 2>/dev/null)
TOTAL=$((TOTAL + 1))
if (( out >= 1 )); then
  PASS=$((PASS + 1)); echo "  PASS: floor=5 W(0.25)=37.5; used_weekly=37 under pace → N=$out"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: floor=5 used_weekly=37 expected N>=1, got $out"
fi
write_rl "rl.json" 38 "$r" 0 99999999
out=$("$TMPDIR_TEST/scripts/dispatch-target-workers" 2>/dev/null)
assert_eq "floor=5 W(0.25)=37.5; used_weekly=38 ahead → N=0" "0" "$out"
tw_teardown

# --- Test 5: remaining <= 0 (window already reset) prints 0 -----------------

echo "Test: weekly window already reset (remaining<=0) prints 0"
tw_setup
# resets_at_weekly <= now → remaining<=0 → Stage 1 prints 0 and exits.
export DISPATCH_TARGET_WORKERS_NOW="$TW_NOW"
write_rl "rl.json" 0 "$TW_NOW" 0 99999999
out=$("$TMPDIR_TEST/scripts/dispatch-target-workers" 2>/dev/null)
assert_eq "remaining==0 → 0" "0" "$out"
# Strictly negative remaining too.
write_rl "rl.json" 0 $((TW_NOW - 100)) 0 99999999
out=$("$TMPDIR_TEST/scripts/dispatch-target-workers" 2>/dev/null)
assert_eq "remaining<0 → 0" "0" "$out"
tw_teardown

# --- Test 6: F = 0 when used_weekly >= W (ahead of pace) → N=0 --------------

echo "Test: F=0 ahead-of-pace pause yields N=0 even with 5h headroom"
tw_setup
# x=0.5 → W=31. used_weekly=40 (>31) → hw<0 → F=0. used_5h=0 (full 5h
# headroom) but h5 = 0 - 0 = 0 → N=0. The ahead-of-pace pause overrides 5h
# headroom — this is the intentional early-week throttle.
export DISPATCH_TARGET_WORKERS_NOW="$TW_NOW"
r=$(tw_resets_for_x 0.5)
write_rl "rl.json" 40 "$r" 0 99999999
out=$("$TMPDIR_TEST/scripts/dispatch-target-workers" 2>/dev/null)
assert_eq "ahead of pace (used_weekly=40 > W=31) → F=0 → N=0" "0" "$out"
tw_teardown

# --- Test 7: F linear band floor5..ceil5 over weekly headroom Hw ------------

echo "Test: F scales floor5..ceil5 over weekly headroom Hw (observed via N)"
tw_setup
# x=0.5 → W=31, defaults floor5=50, ceil5=80, Hw=20.
#   used_weekly=11 → hw=20 (>=Hw) → F=80 (ceiling)
#   used_weekly=21 → hw=10        → F=50+(30)*(10/20)=65
#   used_weekly=26 → hw=5         → F=50+(30)*(5/20)=57.5
#   used_weekly=31 → hw=0         → F=0
# Observe F through N with used_5h chosen so N tracks the band. Hold used_5h=65:
#   F=80   → h5=15 → N=clamp(round(8*15/15),1,8)=8
#   F=65   → h5=0  → N=0
#   F=57.5 → h5<0  → N=0
# That only distinguishes ceiling vs below-65; to see the full F linear band,
# read F at the ceiling boundary (hw>=Hw → F=80) vs interior (hw=15 → F=72.5):
#   used_weekly=11 → hw=20 → F=80,   used_5h=72 → h5=8  → N=round(8*8/15)=4
#   used_weekly=16 → hw=15 → F=72.5, used_5h=72 → h5=0.5→ N=round(8*.5/15)=1
#   used_weekly=21 → hw=10 → F=65,   used_5h=72 → h5<0 → N=0
export DISPATCH_TARGET_WORKERS_NOW="$TW_NOW"
r=$(tw_resets_for_x 0.5)
write_rl "rl.json" 11 "$r" 72 99999999
out=$("$TMPDIR_TEST/scripts/dispatch-target-workers" 2>/dev/null)
assert_eq "F-band hw=20 → F=80, used_5h=72 → N=4" "4" "$out"
write_rl "rl.json" 16 "$r" 72 99999999
out=$("$TMPDIR_TEST/scripts/dispatch-target-workers" 2>/dev/null)
assert_eq "F-band hw=15 → F=72.5, used_5h=72 → N=1" "1" "$out"
write_rl "rl.json" 21 "$r" 72 99999999
out=$("$TMPDIR_TEST/scripts/dispatch-target-workers" 2>/dev/null)
assert_eq "F-band hw=10 → F=65, used_5h=72 ahead → N=0" "0" "$out"
tw_teardown

# --- Test 8: N=0 when used_5h >= F; floor(1)/ceiling(max) over H5 -----------

echo "Test: N floor/ceiling over five_hour_headroom_taper, F held at 80"
tw_setup
# x=0.5, used_weekly=11 → hw=20 → F=80 (ceiling). H5=15, max_workers=8.
# Sweep used_5h; h5 = 80 - used_5h:
#   used_5h=80 → h5=0  → N=0          (at target)
#   used_5h=79 → h5=1  → N=clamp(round(8*1/15),1,8)=1   (floor)
#   used_5h=71 → h5=9  → N=round(8*9/15)=5
#   used_5h=65 → h5=15 → N=8          (ceiling)
#   used_5h=50 → h5=30 → N=8          (clamped at ceiling)
export DISPATCH_TARGET_WORKERS_NOW="$TW_NOW"
r=$(tw_resets_for_x 0.5)
declare -A n_expected=([80]=0 [79]=1 [71]=5 [65]=8 [50]=8)
for u5 in 80 79 71 65 50; do
  write_rl "nsweep.json" 11 "$r" "$u5" 99999999
  result=$("$TMPDIR_TEST/scripts/dispatch-target-workers" 2>/dev/null)
  assert_eq "N-sweep F=80 used_5h=$u5 → ${n_expected[$u5]}" "${n_expected[$u5]}" "$result"
done
unset n_expected
tw_teardown

# --- Test 9: missing rate_limits.json file → 1 + stderr note ----------------

echo "Test: missing-telemetry-fallback prints 1 with a stderr note"
tw_setup
# Default rate-limits path points at a non-existent file.
export DISPATCH_TARGET_WORKERS_NOW="$TW_NOW"
out=$("$TMPDIR_TEST/scripts/dispatch-target-workers" 2>"$TMPDIR_TEST/stderr")
err=$(cat "$TMPDIR_TEST/stderr")
assert_eq "missing rate_limits.json → 1" "1" "$out"
TOTAL=$((TOTAL + 1))
if [[ "$err" == *"dispatch-target-workers"* && "$err" == *"fallback"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: missing rate_limits.json stderr has fallback note"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: missing rate_limits.json stderr has fallback note"
  echo "    stderr: $err"
fi
tw_teardown

# --- Test 10: only five_hour present → fallback (no weekly anchor) ----------

echo "Test: missing-seven-day-fallback prints 1"
tw_setup
export DISPATCH_TARGET_WORKERS_NOW="$TW_NOW"
# seven_day omitted → no weekly anchor → fallback 1.
write_rl "rl.json" absent absent 30 13600
out=$("$TMPDIR_TEST/scripts/dispatch-target-workers" 2>"$TMPDIR_TEST/stderr")
assert_eq "seven_day absent → fallback 1" "1" "$out"
err=$(cat "$TMPDIR_TEST/stderr")
TOTAL=$((TOTAL + 1))
if [[ "$err" == *"weekly anchor"* || "$err" == *"seven_day"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: seven_day-absent stderr names the weekly anchor"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: seven_day-absent stderr names the weekly anchor"
  echo "    stderr: $err"
fi
tw_teardown

# --- Test 11: only seven_day present → 5h gate uses used_5h=0 ---------------

echo "Test: missing-five-hour treats used_5h=0; N scales from F alone"
tw_setup
# seven_day only at x=0.5 (W=31): used_weekly=11 → hw=20 → F=80. 5h block absent
# → used_5h treated as 0 → h5=80 → N=8.
export DISPATCH_TARGET_WORKERS_NOW="$TW_NOW"
r=$(tw_resets_for_x 0.5)
write_rl "rl.json" 11 "$r" absent absent
out=$("$TMPDIR_TEST/scripts/dispatch-target-workers" 2>/dev/null)
assert_eq "five_hour absent; F=80 used_5h=0 → N=8" "8" "$out"
tw_teardown

# --- Test 12: config-file tunables are honored ------------------------------

echo "Test: config max_concurrent_workers tunable raises the absolute cap"
tw_setup
cat > "$DISPATCH_CONFIG_DIR/target-workers.json" <<'EOF'
{"max_concurrent_workers": 16}
EOF
# x=0.5, used_weekly=11 → F=80, used_5h=0 → h5=80 → N=clamp(round(16*80/15),1,16)
# = clamp(85,1,16) = 16.
export DISPATCH_TARGET_WORKERS_NOW="$TW_NOW"
r=$(tw_resets_for_x 0.5)
write_rl "rl.json" 11 "$r" 0 99999999
out=$("$TMPDIR_TEST/scripts/dispatch-target-workers" 2>/dev/null)
assert_eq "config max_concurrent_workers=16 → 16" "16" "$out"
tw_teardown

# --- Test 13: config five_hour_headroom_taper widens the N ramp -------------

echo "Test: config five_hour_headroom_taper_pct scales the N ramp"
tw_setup
# H5=30 (default 15). x=0.5, used_weekly=11 → F=80, used_5h=72 → h5=8.
# N=clamp(round(8*8/30),1,8)=clamp(round(2.13),1,8)=2 (vs N=4 at default H5=15).
cat > "$DISPATCH_CONFIG_DIR/target-workers.json" <<'EOF'
{"five_hour_headroom_taper_pct": 30}
EOF
export DISPATCH_TARGET_WORKERS_NOW="$TW_NOW"
r=$(tw_resets_for_x 0.5)
write_rl "rl.json" 11 "$r" 72 99999999
out=$("$TMPDIR_TEST/scripts/dispatch-target-workers" 2>/dev/null)
assert_eq "H5=30; F=80 used_5h=72 h5=8 → N=2" "2" "$out"
tw_teardown

# --- Test 14: per-field env override wins over file -------------------------

echo "Test: per-field env override wins over rate_limits.json"
tw_setup
export DISPATCH_TARGET_WORKERS_NOW="$TW_NOW"
r=$(tw_resets_for_x 0.5)
# File says used_5h=99 (over F → N=0); env override replaces with used_5h=0.
# used_weekly=11 → F=80, used_5h=0 → h5=80 → N=8.
write_rl "rl.json" 11 "$r" 99 99999999
export DISPATCH_TARGET_WORKERS_USED_5H=0
out=$("$TMPDIR_TEST/scripts/dispatch-target-workers" 2>/dev/null)
assert_eq "env override replaces used_5h → N=8" "8" "$out"
tw_teardown

# --- Test 15: per-field env override of resets_at_weekly places x -----------

echo "Test: per-field env override of resets_at_weekly drives the curve"
tw_setup
# File supplies used_weekly; env override supplies resets_at_weekly to place
# x=0.5. used_weekly=31 = W(0.5) → at pace → F=0 → N=0.
export DISPATCH_TARGET_WORKERS_NOW="$TW_NOW"
write_rl "rl.json" 31 99999999 0 99999999
export DISPATCH_TARGET_WORKERS_RESETS_AT_WEEKLY=$(tw_resets_for_x 0.5)
out=$("$TMPDIR_TEST/scripts/dispatch-target-workers" 2>/dev/null)
assert_eq "env resets override x=0.5; used_weekly=31 at pace → N=0" "0" "$out"
tw_teardown

# --- Test 16: rejected config field → defaults used -------------------------

echo "Test: out-of-range config field rejected; baked-in defaults used"
tw_setup
cat > "$DISPATCH_CONFIG_DIR/target-workers.json" <<'EOF'
{"weekly_headroom_taper_pct": 0}
EOF
# weekly_headroom_taper_pct=0 is rejected by dispatch-config-load (must be > 0).
# dispatch-target-workers silently ignores a failed config-load and uses the
# baked-in defaults (Hw=20). x=0.5, used_weekly=11 → hw=20 → F=80, used_5h=0 →
# N=8.
export DISPATCH_TARGET_WORKERS_NOW="$TW_NOW"
r=$(tw_resets_for_x 0.5)
write_rl "rl.json" 11 "$r" 0 99999999
out=$("$TMPDIR_TEST/scripts/dispatch-target-workers" 2>/dev/null)
assert_eq "rejected config → defaults → N=8" "8" "$out"
tw_teardown

# --- Test 17: non-numeric used_weekly sanitized fail-closed → 1 -------------

echo "Test: non-numeric used_weekly is treated as missing → conservative fallback"
tw_setup
# A corrupt/tampered used_weekly ("abc") must NOT coerce to 0. It is sanitized
# to missing, dropping the weekly anchor → fallback 1.
export DISPATCH_TARGET_WORKERS_NOW="$TW_NOW"
export DISPATCH_TARGET_WORKERS_USED_WEEKLY=abc
export DISPATCH_TARGET_WORKERS_RESETS_AT_WEEKLY=$(tw_resets_for_x 0.5)
export DISPATCH_TARGET_WORKERS_USED_5H=2
out=$("$TMPDIR_TEST/scripts/dispatch-target-workers" 2>"$TMPDIR_TEST/stderr")
assert_eq "non-numeric used_weekly → fallback 1 (not max_workers)" "1" "$out"
err=$(cat "$TMPDIR_TEST/stderr")
TOTAL=$((TOTAL + 1))
if [[ "$err" == *"non-numeric value"* && "$err" == *"WEEKLY_USED"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: non-numeric used_weekly stderr names the field"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: non-numeric used_weekly stderr names the field"
  echo "    stderr: $err"
fi
tw_teardown

# --- Test 18: non-integer NOW sanitized → weekly anchor missing → 1 ---------

echo "Test: non-integer NOW drops the weekly anchor → fallback 1"
tw_setup
# A malformed NOW must not let awk coerce garbage; the weekly anchor is dropped
# and the script falls back to 1.
export DISPATCH_TARGET_WORKERS_NOW="not-a-number"
write_rl "rl.json" 11 99999999 0 99999999
out=$("$TMPDIR_TEST/scripts/dispatch-target-workers" 2>"$TMPDIR_TEST/stderr")
assert_eq "non-integer NOW → fallback 1" "1" "$out"
err=$(cat "$TMPDIR_TEST/stderr")
TOTAL=$((TOTAL + 1))
if [[ "$err" == *"NOW"* && "$err" == *"non-integer"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: non-integer NOW stderr names NOW"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: non-integer NOW stderr names NOW"
  echo "    stderr: $err"
fi
tw_teardown

# --- Test 19: non-numeric resets_at_weekly → weekly anchor missing → 1 ------

echo "Test: non-numeric resets_at_weekly drops the weekly anchor → fallback 1"
tw_setup
export DISPATCH_TARGET_WORKERS_NOW="$TW_NOW"
export DISPATCH_TARGET_WORKERS_RESETS_AT_WEEKLY="garbage"
export DISPATCH_TARGET_WORKERS_USED_WEEKLY=11
out=$("$TMPDIR_TEST/scripts/dispatch-target-workers" 2>"$TMPDIR_TEST/stderr")
assert_eq "non-numeric resets_at_weekly → fallback 1" "1" "$out"
tw_teardown

# --- Test 20: weekly_curve_power back-loads the curve (p=2) -----------------

echo "Test: weekly_curve_power=2 back-loads spend (lower W early-week)"
tw_setup
# With p=2: end = 1 + 3*(90/34 - 1) = 1 + 3*1.647 = 5.941 (< cap 10).
# W(x) = 34*(1*x + (5.941-1)*x^3/3). At x=0.5:
#   W = 34*(0.5 + 4.941*0.125/3) = 34*(0.5 + 0.2059) = 34*0.7059 = 24.0.
# Lower than the p=1 W(0.5)=31 — back-loaded. used_weekly=23 (<24) under pace →
# N>=1; used_weekly=25 (>24) ahead → N=0.
cat > "$DISPATCH_CONFIG_DIR/target-workers.json" <<'EOF'
{"weekly_curve_power": 2}
EOF
export DISPATCH_TARGET_WORKERS_NOW="$TW_NOW"
r=$(tw_resets_for_x 0.5)
write_rl "rl.json" 23 "$r" 0 99999999
out=$("$TMPDIR_TEST/scripts/dispatch-target-workers" 2>/dev/null)
TOTAL=$((TOTAL + 1))
if (( out >= 1 )); then
  PASS=$((PASS + 1)); echo "  PASS: p=2 W(0.5)=24; used_weekly=23 under pace → N=$out"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: p=2 used_weekly=23 expected N>=1, got $out"
fi
write_rl "rl.json" 25 "$r" 0 99999999
out=$("$TMPDIR_TEST/scripts/dispatch-target-workers" 2>/dev/null)
assert_eq "p=2 W(0.5)=24; used_weekly=25 ahead → N=0" "0" "$out"
tw_teardown

# --- Test 21: end-to-end AC smoke — early-week no stall ---------------------

echo "Test: early-week AC smoke used_weekly=20, used_5h=2 → N>=1 (no stall)"
tw_setup
# Issue AC: at x≈0.5 (mid-week) with used_weekly=20, used_5h=2, the chain must
# not stall. x=0.5 → W=31, hw=11 → F=50+(30)*(11/20)=66.5, h5=66.5-2=64.5 →
# N=clamp(round(8*64.5/15),1,8)=8 (>=1).
export DISPATCH_TARGET_WORKERS_NOW="$TW_NOW"
r=$(tw_resets_for_x 0.5)
write_rl "rl.json" 20 "$r" 2 99999999
out=$("$TMPDIR_TEST/scripts/dispatch-target-workers" 2>/dev/null)
TOTAL=$((TOTAL + 1))
if (( out >= 1 )); then
  PASS=$((PASS + 1)); echo "  PASS: early-week smoke used_weekly=20 used_5h=2 → N=$out (>=1)"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: early-week smoke expected N>=1, got $out"
fi
tw_teardown

# ============================================================================
# dispatch-schedule-reseed tests
# ============================================================================
#
# dispatch-schedule-reseed writes a transient systemd.user timer at the next
# rate-limit cap reset. The test harness stubs `systemd-run` on PATH and
# records each invocation's argv, so a test can assert exactly what was
# scheduled. The script's env-var contract mirrors dispatch-target-workers's
# (per-field telemetry + path overrides) — tests rely on the overrides and
# do not require a real rate_limits.json on the filesystem.
#
# Each test gets a fresh tmp tree:
#   $TMPDIR_TEST/scripts/   copy of dispatch-schedule-reseed + dispatch-config-load
#   $TMPDIR_TEST/config/    synthetic config directory (DISPATCH_CONFIG_DIR)
#   $TMPDIR_TEST/rl/        synthetic rate_limits.json directory
#   $TMPDIR_TEST/bin/       systemd-run stub
#   $TMPDIR_TEST/systemd-log  recorded systemd-run argv (one line per call)
#   $TMPDIR_TEST/main/      a synthetic main worktree path
echo ""
echo "=== dispatch-schedule-reseed ==="

sr_setup() {
  TMPDIR_TEST=$(mktemp -d)
  mkdir -p "$TMPDIR_TEST/scripts" "$TMPDIR_TEST/config" "$TMPDIR_TEST/rl" \
    "$TMPDIR_TEST/bin" "$TMPDIR_TEST/main"

  cp "$SCRIPT_DIR/dispatch-schedule-reseed" "$TMPDIR_TEST/scripts/dispatch-schedule-reseed"
  cp "$SCRIPT_DIR/dispatch-config-load" "$TMPDIR_TEST/scripts/dispatch-config-load"
  chmod +x "$TMPDIR_TEST/scripts/dispatch-schedule-reseed" \
           "$TMPDIR_TEST/scripts/dispatch-config-load"

  export DISPATCH_CONFIG_DIR="$TMPDIR_TEST/config"
  # Default: point at an absent file so tests without explicit telemetry get
  # the missing-telemetry no-op unless they override env vars.
  export DISPATCH_SCHEDULE_RESEED_RATE_LIMITS_PATH="$TMPDIR_TEST/rl/missing.json"
  export DISPATCH_SCHEDULE_RESEED_MAIN_WORKTREE="$TMPDIR_TEST/main"

  # systemd-run stub: records its argv (one line per call), exits 0.
  cat > "$TMPDIR_TEST/bin/systemd-run" <<STUB
#!/usr/bin/env bash
echo "\$*" >> "$TMPDIR_TEST/systemd-log"
STUB
  chmod +x "$TMPDIR_TEST/bin/systemd-run"
  export DISPATCH_SCHEDULE_RESEED_SYSTEMD_RUN_CMD="$TMPDIR_TEST/bin/systemd-run"
}

sr_teardown() {
  rm -rf "$TMPDIR_TEST"
  TMPDIR_TEST=""
  unset DISPATCH_CONFIG_DIR
  unset DISPATCH_SCHEDULE_RESEED_RATE_LIMITS_PATH
  unset DISPATCH_SCHEDULE_RESEED_NOW
  unset DISPATCH_SCHEDULE_RESEED_USED_WEEKLY
  unset DISPATCH_SCHEDULE_RESEED_RESETS_AT_WEEKLY
  unset DISPATCH_SCHEDULE_RESEED_USED_5H
  unset DISPATCH_SCHEDULE_RESEED_RESETS_AT_5H
  unset DISPATCH_SCHEDULE_RESEED_MAIN_WORKTREE
  unset DISPATCH_SCHEDULE_RESEED_SYSTEMD_RUN_CMD
}

# sr_write_rl <file-name> <used_weekly> <resets_weekly> <used_5h> <resets_5h>
#   Write a rate_limits.json. Set any of the four to "absent" to omit the
#   surrounding block. Mirrors tw_write_rl above.
sr_write_rl() {
  local name="$1" uw="$2" rw="$3" u5="$4" r5="$5"
  local path="$TMPDIR_TEST/rl/$name"
  local seven=""
  local five=""
  if [[ "$uw" != "absent" && "$rw" != "absent" ]]; then
    seven="\"seven_day\":{\"used_percentage\":$uw,\"resets_at\":$rw}"
  fi
  if [[ "$u5" != "absent" && "$r5" != "absent" ]]; then
    five="\"five_hour\":{\"used_percentage\":$u5,\"resets_at\":$r5}"
  fi
  local parts=()
  [[ -n "$five" ]] && parts+=("$five")
  [[ -n "$seven" ]] && parts+=("$seven")
  local joined
  joined=$(IFS=,; printf '%s' "${parts[*]}")
  printf '{%s}\n' "$joined" > "$path"
  export DISPATCH_SCHEDULE_RESEED_RATE_LIMITS_PATH="$path"
}

# --- Test 1: weekly cap hit → schedules at weekly resets_at ------------------

echo "Test: weekly cap-hit schedules at the weekly resets_at"
sr_setup
export DISPATCH_SCHEDULE_RESEED_NOW=10000
# used_weekly=95 >= target_weekly=90 → weekly cap hit.
# 5h cap clear (10 < 50). Expect schedule at the weekly resets_at.
sr_write_rl "rl.json" 95 20000 10 15000
out=$("$TMPDIR_TEST/scripts/dispatch-schedule-reseed" 2>"$TMPDIR_TEST/stderr")
assert_eq "weekly cap-hit stdout names the unit" \
  "scheduled dispatch-reseed-20000 at 20000" "$out"
log=$(cat "$TMPDIR_TEST/systemd-log" 2>/dev/null || true)
TOTAL=$((TOTAL + 1))
if [[ "$log" == *"--unit=dispatch-reseed-20000"* \
   && "$log" == *"--on-calendar=@20000"* \
   && "$log" == *"--working-directory=$TMPDIR_TEST/main"* \
   && "$log" == *"$TMPDIR_TEST/main/.claude/skills/dispatch-propagate/scripts/dispatch-spawn-router"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: weekly cap-hit systemd-run argv (unit + calendar + cwd + exec)"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: weekly cap-hit systemd-run argv (unit + calendar + cwd + exec)"
  echo "    log: $log"
fi
sr_teardown

# --- Test 2: 5h cap hit → schedules at 5h resets_at --------------------------

echo "Test: 5h cap-hit schedules at the 5h resets_at"
sr_setup
export DISPATCH_SCHEDULE_RESEED_NOW=10000
# used_5h=60 >= target_5h=50 → 5h cap hit. Weekly clear (50 < 90).
sr_write_rl "rl.json" 50 20000 60 15000
out=$("$TMPDIR_TEST/scripts/dispatch-schedule-reseed" 2>/dev/null)
assert_eq "5h cap-hit stdout names the 5h reset unit" \
  "scheduled dispatch-reseed-15000 at 15000" "$out"
log=$(cat "$TMPDIR_TEST/systemd-log" 2>/dev/null || true)
TOTAL=$((TOTAL + 1))
if [[ "$log" == *"--unit=dispatch-reseed-15000"* \
   && "$log" == *"--on-calendar=@15000"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: 5h cap-hit systemd-run argv (unit + calendar)"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: 5h cap-hit systemd-run argv (unit + calendar)"
  echo "    log: $log"
fi
sr_teardown

# --- Test 3: both caps hit → picks the earlier reset -------------------------

echo "Test: both caps hit → schedules at the earlier resets_at"
sr_setup
export DISPATCH_SCHEDULE_RESEED_NOW=10000
# Both caps hit; 5h reset (15000) is earlier than weekly reset (20000).
sr_write_rl "rl.json" 95 20000 60 15000
out=$("$TMPDIR_TEST/scripts/dispatch-schedule-reseed" 2>/dev/null)
assert_eq "both caps hit; picks earlier reset" \
  "scheduled dispatch-reseed-15000 at 15000" "$out"
sr_teardown

# --- Test 4: neither cap hit → no-op (no systemd-run invocation) -------------

echo "Test: neither cap hit → silent no-op (no systemd-run call)"
sr_setup
export DISPATCH_SCHEDULE_RESEED_NOW=10000
# 50 < 90 weekly, 20 < 50 5h → no cap hit.
sr_write_rl "rl.json" 50 20000 20 15000
out=$("$TMPDIR_TEST/scripts/dispatch-schedule-reseed" 2>"$TMPDIR_TEST/stderr")
err=$(cat "$TMPDIR_TEST/stderr")
assert_eq "neither cap hit; stdout silent" "" "$out"
assert_eq "neither cap hit; stderr silent" "" "$err"
TOTAL=$((TOTAL + 1))
if [[ ! -s "$TMPDIR_TEST/systemd-log" ]]; then
  PASS=$((PASS + 1)); echo "  PASS: neither cap hit; no systemd-run invocation"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: neither cap hit; no systemd-run invocation"
  echo "    log: $(cat "$TMPDIR_TEST/systemd-log")"
fi
sr_teardown

# --- Test 5: missing telemetry file → no-op with stderr diagnostic -----------

echo "Test: missing rate_limits.json → no-op with stderr diagnostic"
sr_setup
export DISPATCH_SCHEDULE_RESEED_NOW=10000
# Default RATE_LIMITS_PATH points at a non-existent file.
out=$("$TMPDIR_TEST/scripts/dispatch-schedule-reseed" 2>"$TMPDIR_TEST/stderr")
err=$(cat "$TMPDIR_TEST/stderr")
assert_eq "missing telemetry; stdout silent" "" "$out"
TOTAL=$((TOTAL + 1))
if [[ "$err" == *"dispatch-schedule-reseed"* && "$err" == *"missing or unreadable"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: missing telemetry stderr names the diagnostic"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: missing telemetry stderr names the diagnostic"
  echo "    stderr: $err"
fi
TOTAL=$((TOTAL + 1))
if [[ ! -s "$TMPDIR_TEST/systemd-log" ]]; then
  PASS=$((PASS + 1)); echo "  PASS: missing telemetry; no systemd-run invocation"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: missing telemetry; no systemd-run invocation"
fi
sr_teardown

# --- Test 6: seven_day absent + 5h cap hit → schedules at 5h resets_at -------

echo "Test: seven_day absent + 5h cap-hit schedules at the 5h resets_at"
sr_setup
export DISPATCH_SCHEDULE_RESEED_NOW=10000
sr_write_rl "rl.json" absent absent 60 15000
out=$("$TMPDIR_TEST/scripts/dispatch-schedule-reseed" 2>/dev/null)
assert_eq "seven_day absent; 5h cap-hit schedules at 15000" \
  "scheduled dispatch-reseed-15000 at 15000" "$out"
sr_teardown

# --- Test 7: five_hour absent + weekly cap hit → schedules at weekly resets_at

echo "Test: five_hour absent + weekly cap-hit schedules at the weekly resets_at"
sr_setup
export DISPATCH_SCHEDULE_RESEED_NOW=10000
sr_write_rl "rl.json" 95 20000 absent absent
out=$("$TMPDIR_TEST/scripts/dispatch-schedule-reseed" 2>/dev/null)
assert_eq "five_hour absent; weekly cap-hit schedules at 20000" \
  "scheduled dispatch-reseed-20000 at 20000" "$out"
sr_teardown

# --- Test 8: idempotent re-call (unit already exists) → no-op, exit 0 --------

echo "Test: repeated call with the same resets_at is idempotent (single timer)"
sr_setup
export DISPATCH_SCHEDULE_RESEED_NOW=10000
sr_write_rl "rl.json" 95 20000 10 15000
# Replace the systemd-run stub with one that simulates the second call hitting
# the already-exists collision: first call succeeds; second call exits 1 with
# the "already exists" message on stderr.
cat > "$TMPDIR_TEST/bin/systemd-run" <<STUB
#!/usr/bin/env bash
echo "\$*" >> "$TMPDIR_TEST/systemd-log"
count=\$(wc -l < "$TMPDIR_TEST/systemd-log")
if [[ "\$count" -gt 1 ]]; then
  echo "Unit dispatch-reseed-20000.timer already exists." >&2
  exit 1
fi
STUB
chmod +x "$TMPDIR_TEST/bin/systemd-run"

out1=$("$TMPDIR_TEST/scripts/dispatch-schedule-reseed" 2>"$TMPDIR_TEST/stderr1")
rc1=$?
out2=$("$TMPDIR_TEST/scripts/dispatch-schedule-reseed" 2>"$TMPDIR_TEST/stderr2")
rc2=$?
assert_eq "first call exits 0" "0" "$rc1"
assert_eq "first call stdout names the new unit" \
  "scheduled dispatch-reseed-20000 at 20000" "$out1"
assert_eq "second call exits 0 (idempotent)" "0" "$rc2"
assert_eq "second call stdout silent" "" "$out2"
err2=$(cat "$TMPDIR_TEST/stderr2")
TOTAL=$((TOTAL + 1))
if [[ "$err2" == *"already scheduled"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: second call stderr notes already-scheduled"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: second call stderr notes already-scheduled"
  echo "    stderr2: $err2"
fi
sr_teardown

# --- Test 9: reseed_at already passed → no-op --------------------------------

echo "Test: reseed_at already passed → no-op (no systemd-run call)"
sr_setup
export DISPATCH_SCHEDULE_RESEED_NOW=10000
# Weekly cap hit but resets_at=5000 < now=10000 → already passed.
sr_write_rl "rl.json" 95 5000 10 15000
out=$("$TMPDIR_TEST/scripts/dispatch-schedule-reseed" 2>"$TMPDIR_TEST/stderr")
err=$(cat "$TMPDIR_TEST/stderr")
assert_eq "already-passed reseed; stdout silent" "" "$out"
TOTAL=$((TOTAL + 1))
if [[ "$err" == *"cap reset already passed"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: already-passed reseed; stderr contains 'cap reset already passed'"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: already-passed reseed; stderr contains 'cap reset already passed'"
  echo "    stderr: $err"
fi
TOTAL=$((TOTAL + 1))
if [[ "$err" == *"no-op"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: already-passed reseed; stderr contains 'no-op'"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: already-passed reseed; stderr contains 'no-op'"
  echo "    stderr: $err"
fi
TOTAL=$((TOTAL + 1))
if [[ ! -s "$TMPDIR_TEST/systemd-log" ]]; then
  PASS=$((PASS + 1)); echo "  PASS: already-passed reseed; no systemd-run invocation"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: already-passed reseed; no systemd-run invocation"
fi
sr_teardown

# --- Test 10: unexpected systemd-run failure → exit code passes through ------
#
# systemd-run can fail for reasons unrelated to the already-exists collision —
# e.g. D-Bus down, missing systemd, permission denied. The script's documented
# contract is: "non-zero — systemd-run failed for a reason other than the
# already-exists collision; the exit code is passed through." A naive
# `if cmd; then ...; fi; RC=$?` swallows the real exit code (because `$?`
# after `if` is the exit status of the construct itself, not the condition),
# so the test asserts the real exit code propagates.

echo "Test: unexpected systemd-run failure → exit code passes through"
sr_setup
export DISPATCH_SCHEDULE_RESEED_NOW=10000
sr_write_rl "rl.json" 95 20000 10 15000
# Replace the stub with one that exits 42 with a non-already-exists message.
cat > "$TMPDIR_TEST/bin/systemd-run" <<STUB
#!/usr/bin/env bash
echo "\$*" >> "$TMPDIR_TEST/systemd-log"
echo "D-Bus connection failed: Address not available" >&2
exit 42
STUB
chmod +x "$TMPDIR_TEST/bin/systemd-run"

# Use `if cmd; then rc=0; else rc=$?; fi` so `set -e` doesn't abort the suite
# on the expected non-zero exit, AND `$?` is captured inside the `else` branch
# where it correctly reflects the failed command's exit code.
if out=$("$TMPDIR_TEST/scripts/dispatch-schedule-reseed" 2>"$TMPDIR_TEST/stderr"); then
  rc=0
else
  rc=$?
fi
err=$(cat "$TMPDIR_TEST/stderr")
assert_eq "unexpected failure exit code passes through" "42" "$rc"
assert_eq "unexpected failure; stdout silent" "" "$out"
TOTAL=$((TOTAL + 1))
if [[ "$err" == *"D-Bus connection failed"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: unexpected failure surfaces systemd-run stderr"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: unexpected failure surfaces systemd-run stderr"
  echo "    stderr: $err"
fi
sr_teardown

# --- Test 11: seven_day present but resets_at null → block treated as absent -

echo "Test: seven_day present but resets_at null → block treated as absent"
sr_setup
export DISPATCH_SCHEDULE_RESEED_NOW=10000
cat > "$TMPDIR_TEST/rl/rl.json" <<'JSON'
{"seven_day":{"used_percentage":95,"resets_at":null},"five_hour":{"used_percentage":10,"resets_at":15000}}
JSON
export DISPATCH_SCHEDULE_RESEED_RATE_LIMITS_PATH="$TMPDIR_TEST/rl/rl.json"
out=$("$TMPDIR_TEST/scripts/dispatch-schedule-reseed" 2>"$TMPDIR_TEST/stderr")
err=$(cat "$TMPDIR_TEST/stderr")
assert_eq "partial seven_day record; stdout silent" "" "$out"
assert_eq "partial seven_day record; stderr silent" "" "$err"
TOTAL=$((TOTAL + 1))
if [[ ! -s "$TMPDIR_TEST/systemd-log" ]]; then
  PASS=$((PASS + 1)); echo "  PASS: partial seven_day record; no systemd-run invocation"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: partial seven_day record; no systemd-run invocation"
fi
sr_teardown

# --- Test 12: tampered resets_at → treated as missing, no RCE in `(( ))` -----
#
# bash arithmetic context evaluates array-index command substitution, so a
# resets_at value like `a[$(touch /tmp/pwn)]` from a tampered rate_limits.json
# (or a hostile env override) would execute the inner command when it reaches
# `(( CAND_WEEKLY <= CAND_5H ))` or `(( RESEED_AT <= NOW ))`. The sanitizer
# strips any *_RESETS that is not a pure integer; the malformed block is then
# treated as absent telemetry. The RCE canary is a sentinel file: if it
# appears, the injection executed.

echo "Test: tampered weekly resets_at is rejected (no RCE, treated as missing)"
sr_setup
export DISPATCH_SCHEDULE_RESEED_NOW=10000
CANARY="$TMPDIR_TEST/canary-weekly"
# Tampered weekly resets_at carries a bash-arithmetic RCE payload. 5h cap clear
# so the script no-ops cleanly with both blocks dropped.
export DISPATCH_SCHEDULE_RESEED_USED_WEEKLY=95
export DISPATCH_SCHEDULE_RESEED_RESETS_AT_WEEKLY='a[$(touch '"$CANARY"')]'
export DISPATCH_SCHEDULE_RESEED_USED_5H=10
export DISPATCH_SCHEDULE_RESEED_RESETS_AT_5H=15000
out=$("$TMPDIR_TEST/scripts/dispatch-schedule-reseed" 2>"$TMPDIR_TEST/stderr")
err=$(cat "$TMPDIR_TEST/stderr")
TOTAL=$((TOTAL + 1))
if [[ ! -e "$CANARY" ]]; then
  PASS=$((PASS + 1)); echo "  PASS: tampered weekly resets_at did not trigger RCE"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: tampered weekly resets_at triggered RCE (canary exists)"
fi
TOTAL=$((TOTAL + 1))
if [[ "$err" == *"WEEKLY_RESETS"* && "$err" == *"non-integer"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: tampered weekly resets_at stderr names the sanitizer"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: tampered weekly resets_at stderr names the sanitizer"
  echo "    stderr: $err"
fi
assert_eq "tampered weekly resets_at; no schedule line" "" "$out"
TOTAL=$((TOTAL + 1))
if [[ ! -s "$TMPDIR_TEST/systemd-log" ]]; then
  PASS=$((PASS + 1)); echo "  PASS: tampered weekly resets_at; no systemd-run invocation"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: tampered weekly resets_at; no systemd-run invocation"
fi
sr_teardown

echo "Test: tampered 5h resets_at is rejected (no RCE, treated as missing)"
sr_setup
export DISPATCH_SCHEDULE_RESEED_NOW=10000
CANARY="$TMPDIR_TEST/canary-5h"
export DISPATCH_SCHEDULE_RESEED_USED_WEEKLY=50
export DISPATCH_SCHEDULE_RESEED_RESETS_AT_WEEKLY=20000
export DISPATCH_SCHEDULE_RESEED_USED_5H=60
export DISPATCH_SCHEDULE_RESEED_RESETS_AT_5H='a[$(touch '"$CANARY"')]'
out=$("$TMPDIR_TEST/scripts/dispatch-schedule-reseed" 2>"$TMPDIR_TEST/stderr")
err=$(cat "$TMPDIR_TEST/stderr")
TOTAL=$((TOTAL + 1))
if [[ ! -e "$CANARY" ]]; then
  PASS=$((PASS + 1)); echo "  PASS: tampered 5h resets_at did not trigger RCE"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: tampered 5h resets_at triggered RCE (canary exists)"
fi
TOTAL=$((TOTAL + 1))
if [[ "$err" == *"FIVEH_RESETS"* && "$err" == *"non-integer"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: tampered 5h resets_at stderr names the sanitizer"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: tampered 5h resets_at stderr names the sanitizer"
  echo "    stderr: $err"
fi
# Weekly is still clear (50 < 90) and 5h block was dropped → silent no-op.
assert_eq "tampered 5h resets_at; no schedule line" "" "$out"
TOTAL=$((TOTAL + 1))
if [[ ! -s "$TMPDIR_TEST/systemd-log" ]]; then
  PASS=$((PASS + 1)); echo "  PASS: tampered 5h resets_at; no systemd-run invocation"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: tampered 5h resets_at; no systemd-run invocation"
fi
sr_teardown

# --- Test 13: non-integer DISPATCH_SCHEDULE_RESEED_NOW → abort exit 2 --------

echo "Test: non-integer NOW override aborts with exit 2"
sr_setup
export DISPATCH_SCHEDULE_RESEED_NOW='a[$(touch '"$TMPDIR_TEST/canary-now"')]'
sr_write_rl "rl.json" 95 20000 10 15000
if out=$("$TMPDIR_TEST/scripts/dispatch-schedule-reseed" 2>"$TMPDIR_TEST/stderr"); then
  rc=0
else
  rc=$?
fi
err=$(cat "$TMPDIR_TEST/stderr")
assert_eq "non-integer NOW; exit 2" "2" "$rc"
TOTAL=$((TOTAL + 1))
if [[ ! -e "$TMPDIR_TEST/canary-now" ]]; then
  PASS=$((PASS + 1)); echo "  PASS: non-integer NOW did not trigger RCE"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: non-integer NOW triggered RCE (canary exists)"
fi
TOTAL=$((TOTAL + 1))
if [[ "$err" == *"NOW must be an integer"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: non-integer NOW stderr names the validator"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: non-integer NOW stderr names the validator"
  echo "    stderr: $err"
fi
sr_teardown

# --- Test 14: non-numeric used_percentage → block treated as missing ---------

echo "Test: non-numeric used_percentage is rejected (block treated as missing)"
sr_setup
export DISPATCH_SCHEDULE_RESEED_NOW=10000
# Weekly USED is garbage; weekly block dropped. 5h is clear → silent no-op.
export DISPATCH_SCHEDULE_RESEED_USED_WEEKLY='nope'
export DISPATCH_SCHEDULE_RESEED_RESETS_AT_WEEKLY=20000
export DISPATCH_SCHEDULE_RESEED_USED_5H=10
export DISPATCH_SCHEDULE_RESEED_RESETS_AT_5H=15000
out=$("$TMPDIR_TEST/scripts/dispatch-schedule-reseed" 2>"$TMPDIR_TEST/stderr")
err=$(cat "$TMPDIR_TEST/stderr")
TOTAL=$((TOTAL + 1))
if [[ "$err" == *"WEEKLY_USED"* && "$err" == *"non-numeric"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: non-numeric WEEKLY_USED stderr names the sanitizer"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: non-numeric WEEKLY_USED stderr names the sanitizer"
  echo "    stderr: $err"
fi
assert_eq "non-numeric WEEKLY_USED; no schedule line" "" "$out"
TOTAL=$((TOTAL + 1))
if [[ ! -s "$TMPDIR_TEST/systemd-log" ]]; then
  PASS=$((PASS + 1)); echo "  PASS: non-numeric WEEKLY_USED; no systemd-run invocation"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: non-numeric WEEKLY_USED; no systemd-run invocation"
fi
sr_teardown

# ============================================================================
# dispatch project-helper tests (item-add / status-read / status-write)
# ============================================================================
#
# Each test gets a fresh tmp tree:
#   $TMPDIR_TEST/scripts/   copies of the loader + the three project helpers
#   $TMPDIR_TEST/config/    synthetic config directory (DISPATCH_CONFIG_DIR)
#   $TMPDIR_TEST/stub/      gh stub fixtures (item-list / field-list / view)
#   $TMPDIR_TEST/bin/       the gh PATH stub
#
# DISPATCH_CONFIG_DIR points at the synthetic config so the loader resolves the
# catalog without a git repo. The helpers resolve each other and the loader via
# SCRIPT_DIR, so all four scripts are co-located. The gh stub's item-edit case
# mutates item-list.json so a follow-up item-list reflects the Status change.

proj_setup() {
  TMPDIR_TEST=$(mktemp -d)
  STUB_DIR="$TMPDIR_TEST/stub"
  mkdir -p "$STUB_DIR" "$TMPDIR_TEST/scripts" "$TMPDIR_TEST/bin" \
    "$TMPDIR_TEST/config"

  cp "$SCRIPT_DIR/dispatch-config-load" "$TMPDIR_TEST/scripts/dispatch-config-load"
  cp "$SCRIPT_DIR/dispatch-project-item-add" \
    "$TMPDIR_TEST/scripts/dispatch-project-item-add"
  cp "$SCRIPT_DIR/dispatch-project-status-read" \
    "$TMPDIR_TEST/scripts/dispatch-project-status-read"
  cp "$SCRIPT_DIR/dispatch-project-status-write" \
    "$TMPDIR_TEST/scripts/dispatch-project-status-write"
  chmod +x "$TMPDIR_TEST/scripts/dispatch-config-load" \
           "$TMPDIR_TEST/scripts/dispatch-project-item-add" \
           "$TMPDIR_TEST/scripts/dispatch-project-status-read" \
           "$TMPDIR_TEST/scripts/dispatch-project-status-write"

  # Config fixture: one project, key example-project.
  cat > "$TMPDIR_TEST/config/projects.json" <<'EOF'
{
  "projects": [
    {
      "key": "example-project",
      "owner": "example-owner",
      "number": 1,
      "statusField": "Status",
      "statusInProgress": "In Progress",
      "statusDone": "Done"
    }
  ]
}
EOF
  export DISPATCH_CONFIG_DIR="$TMPDIR_TEST/config"

  # gh stub fixtures.
  cat > "$STUB_DIR/item-list.json" <<'EOF'
{
  "items": [
    {
      "id": "PVTI_item001",
      "content": {
        "type": "Issue",
        "number": 42,
        "repository": "https://github.com/example-owner/example-repo",
        "url": "https://github.com/example-owner/example-repo/issues/42"
      },
      "status": "Todo"
    }
  ],
  "totalCount": 1
}
EOF
  cat > "$STUB_DIR/field-list.json" <<'EOF'
{
  "fields": [
    { "id": "PVTF_title", "name": "Title", "type": "ProjectV2Field" },
    {
      "id": "PVTSSF_status",
      "name": "Status",
      "type": "ProjectV2SingleSelectField",
      "options": [
        { "id": "opt_todo", "name": "Todo" },
        { "id": "opt_inprogress", "name": "In Progress" },
        { "id": "opt_done", "name": "Done" }
      ]
    }
  ],
  "totalCount": 2
}
EOF
  cat > "$STUB_DIR/project-view.json" <<'EOF'
{ "id": "PVT_project001", "number": 1, "title": "Example Project" }
EOF

  # gh PATH stub.
  cat > "$TMPDIR_TEST/bin/gh" <<'STUB'
#!/usr/bin/env bash
STUB_DIR="$(cd "$(dirname "$0")/.." && pwd)/stub"
args="$*"
case "$args" in
  "project item-add "*)
    echo "$args" >> "$STUB_DIR/gh-item-add.log"
    echo '{"id":"PVTI_added001","title":"Added issue","type":"Issue"}'
    ;;
  "project item-list "*)
    cat "$STUB_DIR/item-list.json"
    ;;
  "project field-list "*)
    cat "$STUB_DIR/field-list.json"
    ;;
  "project view "*)
    cat "$STUB_DIR/project-view.json"
    ;;
  "project item-edit "*)
    echo "$args" >> "$STUB_DIR/gh-item-edit.log"
    # Parse --id and --single-select-option-id out of the args.
    item_id=""
    option_id=""
    set -- $args
    while [[ $# -gt 0 ]]; do
      case "$1" in
        --id) item_id="$2"; shift 2 ;;
        --single-select-option-id) option_id="$2"; shift 2 ;;
        *) shift ;;
      esac
    done
    # Map the option id back to its option name via field-list.json.
    option_name=$(jq -r --arg oid "$option_id" \
      '.fields[] | .options[]? | select(.id == $oid) | .name' \
      "$STUB_DIR/field-list.json")
    # Set the matching item's status key so a follow-up item-list reflects it.
    tmp=$(mktemp)
    jq --arg iid "$item_id" --arg sname "$option_name" \
      '.items |= map(if .id == $iid then .status = $sname else . end)' \
      "$STUB_DIR/item-list.json" > "$tmp"
    mv "$tmp" "$STUB_DIR/item-list.json"
    ;;
  *)
    echo "gh stub: unknown invocation: $args" >&2
    exit 1
    ;;
esac
STUB
  chmod +x "$TMPDIR_TEST/bin/gh"
  PATH="$TMPDIR_TEST/bin:$PATH"
}

proj_teardown() {
  rm -rf "$TMPDIR_TEST"
  PATH="$SAVED_PATH"
  TMPDIR_TEST=""
  STUB_DIR=""
  unset DISPATCH_CONFIG_DIR
}

# --- Test 1: adder adds an issue and prints the item id ----------------------

echo "Test: dispatch-project-item-add adds an issue and prints the item id"
proj_setup
rc=0
out=$("$TMPDIR_TEST/scripts/dispatch-project-item-add" example-project \
  https://github.com/example-owner/example-repo/issues/99 2>/dev/null) || rc=$?
assert_eq "adder exits 0" "0" "$rc"
assert_eq "adder prints the new item id" "PVTI_added001" "$out"
proj_teardown

# --- Test 2: reader returns the item id and Status value ---------------------

echo "Test: dispatch-project-status-read returns the item id and Status"
proj_setup
rc=0
out=$("$TMPDIR_TEST/scripts/dispatch-project-status-read" example-project \
  https://github.com/example-owner/example-repo/issues/42 2>/dev/null) || rc=$?
assert_eq "reader exits 0" "0" "$rc"
item_id=$(printf '%s' "$out" | jq -r '.itemId')
assert_eq "reader returns the item id" "PVTI_item001" "$item_id"
status=$(printf '%s' "$out" | jq -r '.status')
assert_eq "reader returns the Status value" "Todo" "$status"
proj_teardown

# --- Test 3: reader fails when the issue is not on the project ---------------

echo "Test: dispatch-project-status-read fails for an issue not on the project"
proj_setup
rc=0
"$TMPDIR_TEST/scripts/dispatch-project-status-read" example-project \
  https://github.com/example-owner/example-repo/issues/777 \
  >/dev/null 2>&1 || rc=$?
TOTAL=$((TOTAL + 1))
if [[ "$rc" -ne 0 ]]; then
  PASS=$((PASS + 1))
  echo "  PASS: reader exits non-zero for an absent issue"
else
  FAIL=$((FAIL + 1))
  echo "  FAIL: reader exits non-zero for an absent issue"
  echo "    expected: non-zero, actual: 0"
fi
proj_teardown

# --- Test 4: writer sets Status; change is visible via the reader ------------

echo "Test: dispatch-project-status-write sets Status, visible via the reader"
proj_setup
rc=0
"$TMPDIR_TEST/scripts/dispatch-project-status-write" example-project \
  https://github.com/example-owner/example-repo/issues/42 "In Progress" \
  >/dev/null 2>&1 || rc=$?
assert_eq "writer exits 0" "0" "$rc"
rc=0
out=$("$TMPDIR_TEST/scripts/dispatch-project-status-read" example-project \
  https://github.com/example-owner/example-repo/issues/42 2>/dev/null) || rc=$?
assert_eq "reader after write exits 0" "0" "$rc"
status=$(printf '%s' "$out" | jq -r '.status')
assert_eq "writer change is visible via the reader" "In Progress" "$status"
proj_teardown

# ============================================================================
# dispatch-spawn-router tests
# ============================================================================
echo "=== dispatch-spawn-router ==="
#
# dispatch-spawn-router is exercised against a fake `claude` — a multi-subcommand
# temp script DISPATCH_SPAWN_ROUTER_CLAUDE_CMD points at by absolute path, so no
# real daemon is needed. The same fake also backs the sourced lib-claude-agents.sh
# helper (dispatch-spawn-router exports CLAUDE_AGENTS_CMD to it).
#
# Each test gets a fresh tmp tree:
#   $TMPDIR_TEST/scripts/        copies of dispatch-spawn-router + lib-claude-agents.sh
#   $TMPDIR_TEST/worktrees/main/ the main worktree (the spawn subshell cd's here)
#   $TMPDIR_TEST/fake-claude     the multi-subcommand fake `claude`
#   $TMPDIR_TEST/registry.json   the `claude agents --json` fixture
#   $TMPDIR_TEST/bg-argv         recorded argv of each `claude --bg` call
#   $TMPDIR_TEST/rm-log          recorded job-ids of each `claude rm` call
#   $TMPDIR_TEST/stop-log        recorded job-ids of each `claude stop` call
#
# The test shell runs under `set -e`; dispatch-spawn-router can exit non-zero, so
# every invocation is wrapped in an `if`/`|| rc=$?` to capture the code.

SPAWN_ROUTER_REGISTRY=""
SPAWN_ROUTER_BG_ARGV=""
SPAWN_ROUTER_RM_LOG=""
SPAWN_ROUTER_STOP_LOG=""
SPAWN_ROUTER_PENDING=""

# write_fake_spawn_router_claude — install the multi-subcommand fake `claude`.
# Dispatches on $1:
#   agents   — print the registry fixture verbatim. The fake ignores --cwd:
#              claude_sessions_under does no client-side path filtering — it
#              trusts server-side `--cwd` filtering — so every fixture session
#              is returned. Fine here: each fixture holds only sessions a test
#              means dispatch-spawn-router to see. If SPAWN_BG_REGISTER_AFTER_N
#              mode left a pending sidecar, decrement its countdown; when it
#              reaches zero, merge the pending agent into the registry and
#              delete the sidecar.
#   --bg     — record full argv to bg-argv. Then:
#                - SPAWN_BG_REGISTER_AFTER_N=<n> set → write pending sidecar
#                  (name + countdown=n) so the agent first appears on the
#                  n-th subsequent `agents` call. Models the daemon's async-
#                  registration race that verify_agent_registered_under closes.
#                - else SPAWN_BG_REGISTERS=1 (default) → parse --name and
#                  jq-append the new agent to the fixture so the verify step
#                  finds it on the first attempt.
#                - else (SPAWN_BG_REGISTERS=0) → never register.
#   rm       — append $2 (the job-id) to rm-log.
#   stop     — append $2 (the job-id) to stop-log.
write_fake_spawn_router_claude() {
  cat > "$TMPDIR_TEST/fake-claude" <<FAKE
#!/usr/bin/env bash
set -uo pipefail
case "\${1:-}" in
  agents)
    if [[ -f "$SPAWN_ROUTER_PENDING" ]]; then
      pending_name=\$(sed -n '1p' "$SPAWN_ROUTER_PENDING")
      pending_count=\$(sed -n '2p' "$SPAWN_ROUTER_PENDING")
      pending_count=\$((pending_count - 1))
      if [[ "\$pending_count" -le 0 ]]; then
        tmp=\$(mktemp)
        jq --arg name "\$pending_name" \
          '. + [{"sessionId":("sess-"+\$name),"pid":9999,"cwd":"/main","kind":"background","status":"busy","name":\$name}]' \
          "$SPAWN_ROUTER_REGISTRY" > "\$tmp" && mv "\$tmp" "$SPAWN_ROUTER_REGISTRY"
        rm -f "$SPAWN_ROUTER_PENDING"
      else
        printf '%s\n%s\n' "\$pending_name" "\$pending_count" > "$SPAWN_ROUTER_PENDING"
      fi
    fi
    cat "$SPAWN_ROUTER_REGISTRY"
    ;;
  --bg)
    printf '%s\n' "\$@" > "$SPAWN_ROUTER_BG_ARGV"
    name=""
    while [[ \$# -gt 0 ]]; do
      if [[ "\$1" == "--name" ]]; then name="\${2:-}"; shift 2; continue; fi
      shift
    done
    if [[ -n "\${SPAWN_BG_REGISTER_AFTER_N:-}" ]]; then
      printf '%s\n%s\n' "\$name" "\$SPAWN_BG_REGISTER_AFTER_N" > "$SPAWN_ROUTER_PENDING"
    elif [[ "\${SPAWN_BG_REGISTERS:-1}" == "1" ]]; then
      tmp=\$(mktemp)
      jq --arg name "\$name" \
        '. + [{"sessionId":("sess-"+\$name),"pid":9999,"cwd":"/main","kind":"background","status":"busy","name":\$name}]' \
        "$SPAWN_ROUTER_REGISTRY" > "\$tmp" && mv "\$tmp" "$SPAWN_ROUTER_REGISTRY"
    fi
    ;;
  rm)
    shift
    printf '%s\n' "\${1:-}" >> "$SPAWN_ROUTER_RM_LOG"
    ;;
  stop)
    printf '%s\n' "\${2:-}" >> "$SPAWN_ROUTER_STOP_LOG"
    ;;
esac
FAKE
  chmod +x "$TMPDIR_TEST/fake-claude"
}

spawn_router_setup() {
  TMPDIR_TEST=$(mktemp -d)
  mkdir -p "$TMPDIR_TEST/scripts" "$TMPDIR_TEST/worktrees/main"

  # dispatch-spawn-router sources lib-claude-agents.sh from its own directory, so the
  # helper must sit alongside the copy. It is sourced, not executed — no chmod.
  cp "$SCRIPT_DIR/dispatch-spawn-router" "$TMPDIR_TEST/scripts/dispatch-spawn-router"
  cp "$SCRIPT_DIR/lib-claude-agents.sh" "$TMPDIR_TEST/scripts/lib-claude-agents.sh"
  chmod +x "$TMPDIR_TEST/scripts/dispatch-spawn-router"

  SPAWN_ROUTER_REGISTRY="$TMPDIR_TEST/registry.json"
  SPAWN_ROUTER_BG_ARGV="$TMPDIR_TEST/bg-argv"
  SPAWN_ROUTER_RM_LOG="$TMPDIR_TEST/rm-log"
  SPAWN_ROUTER_STOP_LOG="$TMPDIR_TEST/stop-log"
  SPAWN_ROUTER_PENDING="$TMPDIR_TEST/pending"
  printf '[]' > "$SPAWN_ROUTER_REGISTRY"

  export DISPATCH_SPAWN_ROUTER_MAIN_WORKTREE="$TMPDIR_TEST/worktrees/main"
  export DISPATCH_SPAWN_ROUTER_CLAUDE_CMD="$TMPDIR_TEST/fake-claude"
  export DISPATCH_SPAWN_ROUTER_SESSION_ID="sess-self"
}

spawn_router_teardown() {
  rm -rf "$TMPDIR_TEST"
  TMPDIR_TEST=""
  SPAWN_ROUTER_REGISTRY=""
  SPAWN_ROUTER_BG_ARGV=""
  SPAWN_ROUTER_RM_LOG=""
  SPAWN_ROUTER_STOP_LOG=""
  SPAWN_ROUTER_PENDING=""
  unset DISPATCH_SPAWN_ROUTER_MAIN_WORKTREE DISPATCH_SPAWN_ROUTER_CLAUDE_CMD \
    DISPATCH_SPAWN_ROUTER_SESSION_ID SPAWN_BG_REGISTERS SPAWN_BG_REGISTER_AFTER_N \
    LIB_CLAUDE_AGENTS_VERIFY_INTERVAL_S
}

# --- Test 1: spawn success ---------------------------------------------------

echo "Test: an empty registry spawns one /dispatch-propagate background job"
spawn_router_setup
write_fake_spawn_router_claude
if out=$("$TMPDIR_TEST/scripts/dispatch-spawn-router" 2>/dev/null); then rc=0; else rc=$?; fi
assert_eq "spawn: dispatch-spawn-router exits 0" "0" "$rc"
assert_eq "spawn: stdout is 'spawned'" "spawned" "$out"
# The recorded argv must be exactly: --bg --name dispatch-<id> \
#   --permission-mode auto /dispatch-propagate
mapfile -t bg_argv < "$SPAWN_ROUTER_BG_ARGV"
assert_eq "spawn: argv[0] is --bg" "--bg" "${bg_argv[0]:-}"
assert_eq "spawn: argv[1] is --name" "--name" "${bg_argv[1]:-}"
case "${bg_argv[2]:-}" in
  dispatch-*) name_ok=yes ;;
  *)          name_ok="no: ${bg_argv[2]:-}" ;;
esac
assert_eq "spawn: argv[2] is a dispatch-* agent name" "yes" "$name_ok"
assert_eq "spawn: argv[3] is --permission-mode" "--permission-mode" "${bg_argv[3]:-}"
assert_eq "spawn: argv[4] is auto" "auto" "${bg_argv[4]:-}"
assert_eq "spawn: argv[5] is /dispatch-propagate" "/dispatch-propagate" "${bg_argv[5]:-}"
spawn_router_teardown

# --- Test 2: dedup -----------------------------------------------------------

echo "Test: another live dispatch-* session deduplicates the spawn"
spawn_router_setup
printf '%s' \
  '[{"sessionId":"sess-other","pid":4242,"cwd":"/main","kind":"background","status":"busy","name":"dispatch-aaaa1111"}]' \
  > "$SPAWN_ROUTER_REGISTRY"
write_fake_spawn_router_claude
if out=$("$TMPDIR_TEST/scripts/dispatch-spawn-router" 2>/dev/null); then rc=0; else rc=$?; fi
assert_eq "dedup: dispatch-spawn-router exits 0" "0" "$rc"
assert_eq "dedup: stdout is 'deduped'" "deduped" "$out"
# No --bg invocation was recorded — nothing was spawned.
TOTAL=$((TOTAL + 1))
if [[ ! -e "$SPAWN_ROUTER_BG_ARGV" ]]; then
  PASS=$((PASS + 1)); echo "  PASS: dedup: no 'claude --bg' invocation recorded"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: dedup: no 'claude --bg' invocation recorded"
  echo "    bg-argv: $(cat "$SPAWN_ROUTER_BG_ARGV")"
fi
spawn_router_teardown

# --- Test 3: self-exclusion --------------------------------------------------

echo "Test: a dispatch-* session that is this session does not deduplicate"
spawn_router_setup
# The only dispatch-* session in the registry IS this session (sess-self).
printf '%s' \
  '[{"sessionId":"sess-self","pid":4242,"cwd":"/main","kind":"background","status":"busy","name":"dispatch-self0000"}]' \
  > "$SPAWN_ROUTER_REGISTRY"
write_fake_spawn_router_claude
if out=$("$TMPDIR_TEST/scripts/dispatch-spawn-router" 2>/dev/null); then rc=0; else rc=$?; fi
assert_eq "self-exclude: dispatch-spawn-router exits 0" "0" "$rc"
assert_eq "self-exclude: stdout is 'spawned' (own session is not 'another')" \
  "spawned" "$out"
spawn_router_teardown

# --- Test 4: spawn failure ---------------------------------------------------

echo "Test: a spawned job that never registers exits non-zero with a diagnostic"
spawn_router_setup
write_fake_spawn_router_claude
export SPAWN_BG_REGISTERS=0
# Skip the real inter-attempt sleeps — this test exercises the full exhaustion
# path, which would otherwise add ~0.8 s of wall-clock sleep.
export LIB_CLAUDE_AGENTS_VERIFY_INTERVAL_S=0
rc=0
err=$("$TMPDIR_TEST/scripts/dispatch-spawn-router" 2>&1 1>/dev/null) || rc=$?
TOTAL=$((TOTAL + 1))
if [[ "$rc" -ne 0 ]]; then
  PASS=$((PASS + 1)); echo "  PASS: spawn-fail: dispatch-spawn-router exits non-zero"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: spawn-fail: dispatch-spawn-router exits non-zero (rc=$rc)"
fi
TOTAL=$((TOTAL + 1))
if [[ "$err" == *"did not register"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: spawn-fail: stderr reports the unregistered agent"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: spawn-fail: stderr reports the unregistered agent"
  echo "    stderr: $err"
fi
spawn_router_teardown

# --- Test 5: unqueryable registry fails safe ---------------------------------

echo "Test: an unparseable session registry fails safe — spawns nothing"
spawn_router_setup
# A registry that is not a JSON array: lib-claude-agents.sh's
# claude_sessions_under cannot parse it and returns 1 (unknown). dispatch-spawn-router
# must treat unknown as "a dispatch agent may be running" and spawn nothing —
# the documented fail-safe in the script's Step 2 dedup guard.
printf '%s' 'not-a-json-array' > "$SPAWN_ROUTER_REGISTRY"
write_fake_spawn_router_claude
if out=$("$TMPDIR_TEST/scripts/dispatch-spawn-router" 2>/dev/null); then rc=0; else rc=$?; fi
assert_eq "unknown-registry: dispatch-spawn-router exits 0" "0" "$rc"
assert_eq "unknown-registry: stdout is 'deduped'" "deduped" "$out"
# No --bg invocation was recorded — nothing was spawned.
TOTAL=$((TOTAL + 1))
if [[ ! -e "$SPAWN_ROUTER_BG_ARGV" ]]; then
  PASS=$((PASS + 1)); echo "  PASS: unknown-registry: no 'claude --bg' invocation recorded"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: unknown-registry: no 'claude --bg' invocation recorded"
  echo "    bg-argv: $(cat "$SPAWN_ROUTER_BG_ARGV")"
fi
spawn_router_teardown

# --- Test 6: delayed registration absorbed by verify retry -------------------

echo "Test: a spawned job that registers on the 2nd 'agents' call still exits 0"
spawn_router_setup
write_fake_spawn_router_claude
# SPAWN_BG_REGISTER_AFTER_N=2 means the spawned agent first appears in the
# fake's registry on the 2nd subsequent `agents` call — modeling the daemon's
# async-registration race the issue describes. verify_agent_registered_under
# polls up to 5 times, so the 2nd attempt finds it and the script exits 0.
export SPAWN_BG_REGISTER_AFTER_N=2
err_file="$TMPDIR_TEST/stderr"
if out=$("$TMPDIR_TEST/scripts/dispatch-spawn-router" 2>"$err_file"); then rc=0; else rc=$?; fi
err=$(cat "$err_file")
assert_eq "delayed-register: dispatch-spawn-router exits 0" "0" "$rc"
assert_eq "delayed-register: stdout is 'spawned'" "spawned" "$out"
TOTAL=$((TOTAL + 1))
if [[ -z "${err//[[:space:]]/}" ]]; then
  PASS=$((PASS + 1)); echo "  PASS: delayed-register: no diagnostic on stderr"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: delayed-register: no diagnostic on stderr"
  echo "    stderr: $err"
fi
spawn_router_teardown

# --- Test 7: registration on the exact last attempt still exits 0 ------------

echo "Test: a spawned job that registers on the 5th (final) 'agents' call still exits 0"
spawn_router_setup
write_fake_spawn_router_claude
# SPAWN_BG_REGISTER_AFTER_N=5 makes the agent first appear on the 5th
# subsequent `agents` call — the last poll before verify_agent_registered_under
# exhausts its 5-attempt budget. This pins the off-by-one in the retry loop:
# the final attempt is honoured, so the script must still exit 0.
export SPAWN_BG_REGISTER_AFTER_N=5
export LIB_CLAUDE_AGENTS_VERIFY_INTERVAL_S=0
err_file="$TMPDIR_TEST/stderr"
if out=$("$TMPDIR_TEST/scripts/dispatch-spawn-router" 2>"$err_file"); then rc=0; else rc=$?; fi
err=$(cat "$err_file")
assert_eq "last-attempt-register: dispatch-spawn-router exits 0" "0" "$rc"
assert_eq "last-attempt-register: stdout is 'spawned'" "spawned" "$out"
TOTAL=$((TOTAL + 1))
if [[ -z "${err//[[:space:]]/}" ]]; then
  PASS=$((PASS + 1)); echo "  PASS: last-attempt-register: no diagnostic on stderr"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: last-attempt-register: no diagnostic on stderr"
  echo "    stderr: $err"
fi
spawn_router_teardown

# ============================================================================
# dispatch-spawn-worker tests
# ============================================================================
echo "=== dispatch-spawn-worker ==="
#
# dispatch-spawn-worker is exercised against a fake `claude` — a multi-subcommand
# temp script DISPATCH_SPAWN_WORKER_CLAUDE_CMD points at by absolute path, so
# no real daemon is needed. The same fake also backs the sourced
# lib-claude-agents.sh helper (dispatch-spawn-worker exports CLAUDE_AGENTS_CMD
# to it).
#
# Each test gets a fresh tmp tree:
#   $TMPDIR_TEST/scripts/dispatch-spawn-worker  copy of the script under test
#   $TMPDIR_TEST/scripts/lib-claude-agents.sh   sourced helper (not chmod'd)
#   $TMPDIR_TEST/worktrees/main/                backdrop only (not used by script)
#   $TMPDIR_TEST/worktrees/839-test-worker/     the target worktree path (arg 2)
#   $TMPDIR_TEST/fake-claude                    the multi-subcommand fake `claude`
#   $TMPDIR_TEST/registry.json                  `claude agents --json` fixture
#   $TMPDIR_TEST/bg-argv                        recorded argv of each `claude --bg` call
#   $TMPDIR_TEST/pwd-log                        records the spawn subshell's $PWD
#                                               so Test 2 can assert the script
#                                               cd'd into the target worktree.
#
# The test shell runs under `set -e`; dispatch-spawn-worker can exit non-zero,
# so every invocation is wrapped in an `if`/`|| rc=$?` to capture the code.

SPAWN_WORKER_REGISTRY=""
SPAWN_WORKER_BG_ARGV=""
SPAWN_WORKER_PWD_LOG=""
SPAWN_WORKER_PENDING=""
WORKER_TARGET_WORKTREE=""

# write_fake_spawn_worker_claude — install the multi-subcommand fake `claude`.
# Dispatches on $1:
#   agents   — print the registry fixture verbatim. The fake ignores --cwd:
#              claude_sessions_under does no client-side path filtering — it
#              trusts server-side `--cwd` filtering — so every fixture session
#              is returned. Fine here: each fixture holds only sessions a test
#              means dispatch-spawn-worker to see. If SPAWN_BG_REGISTER_AFTER_N
#              mode left a pending sidecar, decrement its countdown; when it
#              reaches zero, merge the pending agent into the registry and
#              delete the sidecar.
#   --bg     — record full argv to bg-argv AND record $PWD to pwd-log. Then:
#                - SPAWN_BG_REGISTER_AFTER_N=<n> set → write pending sidecar
#                  (name + countdown=n) so the agent first appears on the
#                  n-th subsequent `agents` call. Models the daemon's async-
#                  registration race that verify_agent_registered_under closes.
#                - else SPAWN_BG_REGISTERS=1 (default) → parse --name and
#                  jq-append the new agent to the fixture so the verify step
#                  finds it on the first attempt.
#                - else (SPAWN_BG_REGISTERS=0) → never register.
write_fake_spawn_worker_claude() {
  cat > "$TMPDIR_TEST/fake-claude" <<FAKE
#!/usr/bin/env bash
set -uo pipefail
case "\${1:-}" in
  agents)
    if [[ -f "$SPAWN_WORKER_PENDING" ]]; then
      pending_name=\$(sed -n '1p' "$SPAWN_WORKER_PENDING")
      pending_count=\$(sed -n '2p' "$SPAWN_WORKER_PENDING")
      pending_count=\$((pending_count - 1))
      if [[ "\$pending_count" -le 0 ]]; then
        tmp=\$(mktemp)
        jq --arg name "\$pending_name" \
          '. + [{"sessionId":("sess-"+\$name),"pid":9999,"cwd":"/worker","kind":"background","status":"busy","name":\$name}]' \
          "$SPAWN_WORKER_REGISTRY" > "\$tmp" && mv "\$tmp" "$SPAWN_WORKER_REGISTRY"
        rm -f "$SPAWN_WORKER_PENDING"
      else
        printf '%s\n%s\n' "\$pending_name" "\$pending_count" > "$SPAWN_WORKER_PENDING"
      fi
    fi
    cat "$SPAWN_WORKER_REGISTRY"
    ;;
  --bg)
    pwd >> "$SPAWN_WORKER_PWD_LOG"
    printf '%s\n' "\$@" > "$SPAWN_WORKER_BG_ARGV"
    name=""
    while [[ \$# -gt 0 ]]; do
      if [[ "\$1" == "--name" ]]; then name="\${2:-}"; shift 2; continue; fi
      shift
    done
    if [[ -n "\${SPAWN_BG_REGISTER_AFTER_N:-}" ]]; then
      printf '%s\n%s\n' "\$name" "\$SPAWN_BG_REGISTER_AFTER_N" > "$SPAWN_WORKER_PENDING"
    elif [[ "\${SPAWN_BG_REGISTERS:-1}" == "1" ]]; then
      tmp=\$(mktemp)
      jq --arg name "\$name" \
        '. + [{"sessionId":("sess-"+\$name),"pid":9999,"cwd":"/worker","kind":"background","status":"busy","name":\$name}]' \
        "$SPAWN_WORKER_REGISTRY" > "\$tmp" && mv "\$tmp" "$SPAWN_WORKER_REGISTRY"
    fi
    ;;
esac
FAKE
  chmod +x "$TMPDIR_TEST/fake-claude"
}

spawn_worker_setup() {
  TMPDIR_TEST=$(mktemp -d)
  mkdir -p "$TMPDIR_TEST/scripts" \
    "$TMPDIR_TEST/worktrees/main" \
    "$TMPDIR_TEST/worktrees/839-test-worker"

  # dispatch-spawn-worker sources lib-claude-agents.sh from its own directory,
  # so the helper must sit alongside the copy. It is sourced, not executed —
  # no chmod.
  cp "$SCRIPT_DIR/dispatch-spawn-worker" "$TMPDIR_TEST/scripts/dispatch-spawn-worker"
  cp "$SCRIPT_DIR/lib-claude-agents.sh" "$TMPDIR_TEST/scripts/lib-claude-agents.sh"
  chmod +x "$TMPDIR_TEST/scripts/dispatch-spawn-worker"

  SPAWN_WORKER_REGISTRY="$TMPDIR_TEST/registry.json"
  SPAWN_WORKER_BG_ARGV="$TMPDIR_TEST/bg-argv"
  SPAWN_WORKER_PWD_LOG="$TMPDIR_TEST/pwd-log"
  SPAWN_WORKER_PENDING="$TMPDIR_TEST/pending"
  WORKER_TARGET_WORKTREE="$TMPDIR_TEST/worktrees/839-test-worker"
  printf '[]' > "$SPAWN_WORKER_REGISTRY"

  export DISPATCH_SPAWN_WORKER_CLAUDE_CMD="$TMPDIR_TEST/fake-claude"
  export DISPATCH_SPAWN_WORKER_SESSION_ID="sess-self"
}

spawn_worker_teardown() {
  rm -rf "$TMPDIR_TEST"
  TMPDIR_TEST=""
  SPAWN_WORKER_REGISTRY=""
  SPAWN_WORKER_BG_ARGV=""
  SPAWN_WORKER_PWD_LOG=""
  SPAWN_WORKER_PENDING=""
  WORKER_TARGET_WORKTREE=""
  unset DISPATCH_SPAWN_WORKER_CLAUDE_CMD DISPATCH_SPAWN_WORKER_SESSION_ID \
    SPAWN_BG_REGISTERS SPAWN_BG_REGISTER_AFTER_N \
    LIB_CLAUDE_AGENTS_VERIFY_INTERVAL_S
}

# --- Test 1: spawn success ---------------------------------------------------

echo "Test: an empty registry spawns one /dispatch-worker background job"
spawn_worker_setup
write_fake_spawn_worker_claude
# Run from a stable known cwd so Test 2 (and 1's name/positional-arg
# assertions) can compare against it. The spawn subshell cd's into the target
# worktree; the script's own cwd is the caller's cwd.
SPAWN_CALLER_CWD="$TMPDIR_TEST/worktrees/main"
if out=$( cd "$SPAWN_CALLER_CWD" && "$TMPDIR_TEST/scripts/dispatch-spawn-worker" 839 "$WORKER_TARGET_WORKTREE" 2>/dev/null ); then rc=0; else rc=$?; fi
assert_eq "spawn-worker: dispatch-spawn-worker exits 0" "0" "$rc"
assert_eq "spawn-worker: stdout is 'spawned'" "spawned" "$out"
# The recorded argv must be exactly:
#   --bg --name <worktree-basename> --permission-mode auto
#   "/dispatch-worker 839 <worktree-path>"
mapfile -t sw_bg_argv < "$SPAWN_WORKER_BG_ARGV"
assert_eq "spawn-worker: argv[0] is --bg" "--bg" "${sw_bg_argv[0]:-}"
assert_eq "spawn-worker: argv[1] is --name" "--name" "${sw_bg_argv[1]:-}"
assert_eq "spawn-worker: argv[2] is the worktree basename" \
  "839-test-worker" "${sw_bg_argv[2]:-}"
assert_eq "spawn-worker: argv[3] is --permission-mode" "--permission-mode" "${sw_bg_argv[3]:-}"
assert_eq "spawn-worker: argv[4] is auto" "auto" "${sw_bg_argv[4]:-}"
assert_eq "spawn-worker: argv[5] is '/dispatch-worker 839 <worktree-path>'" \
  "/dispatch-worker 839 $WORKER_TARGET_WORKTREE" "${sw_bg_argv[5]:-}"
spawn_worker_teardown

# --- Test 2: spawn cwd is the target worktree path --------------------------

echo "Test: dispatch-spawn-worker invokes 'claude --bg' from the target worktree path, NOT the caller's cwd"
spawn_worker_setup
write_fake_spawn_worker_claude
SPAWN_CALLER_CWD="$TMPDIR_TEST/worktrees/main"
if out=$( cd "$SPAWN_CALLER_CWD" && "$TMPDIR_TEST/scripts/dispatch-spawn-worker" 839 "$WORKER_TARGET_WORKTREE" 2>/dev/null ); then rc=0; else rc=$?; fi
assert_eq "spawn-worker-cwd: exits 0" "0" "$rc"
# Read the first line of the pwd-log and compare it (via realpath) to the
# target worktree path. realpath is used to normalize platform-specific path
# differences (e.g. macOS /private/ prefix on /tmp).
sw_pwd_line=$(head -1 "$SPAWN_WORKER_PWD_LOG" 2>/dev/null || true)
TOTAL=$((TOTAL + 1))
if [[ "$(realpath "$sw_pwd_line" 2>/dev/null)" == "$(realpath "$WORKER_TARGET_WORKTREE")" ]]; then
  PASS=$((PASS + 1)); echo "  PASS: spawn-worker-cwd: 'claude --bg' ran with cwd = target worktree path"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: spawn-worker-cwd: 'claude --bg' ran with cwd = target worktree path"
  echo "    pwd-log:  '$sw_pwd_line'"
  echo "    expected: '$WORKER_TARGET_WORKTREE'"
fi
# Independently assert the cwd is NOT the caller's cwd — that is the
# regression the fix prevents (worker born in the wrong worktree).
TOTAL=$((TOTAL + 1))
if [[ "$(realpath "$sw_pwd_line" 2>/dev/null)" != "$(realpath "$SPAWN_CALLER_CWD")" ]]; then
  PASS=$((PASS + 1)); echo "  PASS: spawn-worker-cwd: 'claude --bg' did NOT run from the caller's cwd"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: spawn-worker-cwd: 'claude --bg' did NOT run from the caller's cwd"
  echo "    pwd-log: '$sw_pwd_line'"
fi
spawn_worker_teardown

# --- Test 3: per-worktree dedup ----------------------------------------------

echo "Test: another live same-name (worktree-basename) session deduplicates the spawn"
spawn_worker_setup
# The dedup is keyed on `name == <worktree-basename>` — i.e. `839-test-worker`
# in this test fixture. Prime the registry with a different sessionId whose
# name matches the worktree-basename the spawn would use.
printf '%s' \
  '[{"sessionId":"sess-other","pid":4242,"cwd":"/worker","kind":"background","status":"busy","name":"839-test-worker"}]' \
  > "$SPAWN_WORKER_REGISTRY"
write_fake_spawn_worker_claude
if out=$("$TMPDIR_TEST/scripts/dispatch-spawn-worker" 839 "$WORKER_TARGET_WORKTREE" 2>/dev/null); then rc=0; else rc=$?; fi
assert_eq "dedup-worker: dispatch-spawn-worker exits 0" "0" "$rc"
assert_eq "dedup-worker: stdout is 'deduped' (name-keyed dedup hit)" "deduped" "$out"
# No --bg invocation was recorded — nothing was spawned.
TOTAL=$((TOTAL + 1))
if [[ ! -e "$SPAWN_WORKER_BG_ARGV" ]]; then
  PASS=$((PASS + 1)); echo "  PASS: dedup-worker: no 'claude --bg' invocation recorded"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: dedup-worker: no 'claude --bg' invocation recorded"
  echo "    bg-argv: $(cat "$SPAWN_WORKER_BG_ARGV")"
fi
spawn_worker_teardown

# --- Test 4: self-exclusion --------------------------------------------------

echo "Test: a same-name session that is this session does not deduplicate"
spawn_worker_setup
# The only worker-named session in the registry IS this session (sess-self).
# Self-exclusion makes name-keyed dedup ignore sessionId == DISPATCH_SPAWN_WORKER_SESSION_ID.
printf '%s' \
  '[{"sessionId":"sess-self","pid":4242,"cwd":"/worker","kind":"background","status":"busy","name":"839-test-worker"}]' \
  > "$SPAWN_WORKER_REGISTRY"
write_fake_spawn_worker_claude
if out=$("$TMPDIR_TEST/scripts/dispatch-spawn-worker" 839 "$WORKER_TARGET_WORKTREE" 2>/dev/null); then rc=0; else rc=$?; fi
assert_eq "self-exclude-worker: dispatch-spawn-worker exits 0" "0" "$rc"
assert_eq "self-exclude-worker: stdout is 'spawned' (own session is not 'another')" \
  "spawned" "$out"
spawn_worker_teardown

# --- Test 5: spawn failure ---------------------------------------------------

echo "Test: a spawned worker job that never registers exits non-zero with a diagnostic"
spawn_worker_setup
write_fake_spawn_worker_claude
export SPAWN_BG_REGISTERS=0
# Skip the real inter-attempt sleeps — this test exercises the full exhaustion
# path, which would otherwise add ~0.8 s of wall-clock sleep.
export LIB_CLAUDE_AGENTS_VERIFY_INTERVAL_S=0
rc=0
err=$("$TMPDIR_TEST/scripts/dispatch-spawn-worker" 839 "$WORKER_TARGET_WORKTREE" 2>&1 1>/dev/null) || rc=$?
TOTAL=$((TOTAL + 1))
if [[ "$rc" -ne 0 ]]; then
  PASS=$((PASS + 1)); echo "  PASS: spawn-worker-fail: dispatch-spawn-worker exits non-zero"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: spawn-worker-fail: dispatch-spawn-worker exits non-zero (rc=$rc)"
fi
TOTAL=$((TOTAL + 1))
if [[ "$err" == *"did not register"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: spawn-worker-fail: stderr reports the unregistered agent"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: spawn-worker-fail: stderr reports the unregistered agent"
  echo "    stderr: $err"
fi
spawn_worker_teardown

# --- Test 6: unqueryable registry fails safe ---------------------------------

echo "Test: an unparseable session registry fails safe — spawns nothing"
spawn_worker_setup
# A registry that is not a JSON array: lib-claude-agents.sh's
# claude_sessions_under cannot parse it and returns 1 (unknown).
# dispatch-spawn-worker must treat unknown as "a dispatch agent may be running"
# and spawn nothing — the documented fail-safe in the script's Step 2 dedup
# guard.
printf '%s' 'not-a-json-array' > "$SPAWN_WORKER_REGISTRY"
write_fake_spawn_worker_claude
if out=$("$TMPDIR_TEST/scripts/dispatch-spawn-worker" 839 "$WORKER_TARGET_WORKTREE" 2>/dev/null); then rc=0; else rc=$?; fi
assert_eq "unknown-registry-worker: dispatch-spawn-worker exits 0" "0" "$rc"
assert_eq "unknown-registry-worker: stdout is 'deduped'" "deduped" "$out"
# No --bg invocation was recorded — nothing was spawned.
TOTAL=$((TOTAL + 1))
if [[ ! -e "$SPAWN_WORKER_BG_ARGV" ]]; then
  PASS=$((PASS + 1)); echo "  PASS: unknown-registry-worker: no 'claude --bg' invocation recorded"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: unknown-registry-worker: no 'claude --bg' invocation recorded"
  echo "    bg-argv: $(cat "$SPAWN_WORKER_BG_ARGV")"
fi
spawn_worker_teardown

# --- Test 7: missing args ----------------------------------------------------

echo "Test: missing arguments exit 2"
spawn_worker_setup
write_fake_spawn_worker_claude

# Sub-case A: no args at all
if "$TMPDIR_TEST/scripts/dispatch-spawn-worker" 2>/dev/null; then sw_rc_a=0; else sw_rc_a=$?; fi
assert_eq "missing-args-worker: no args → exit 2" "2" "$sw_rc_a"

# Sub-case B: only <N> given (no <worktree-path>)
if "$TMPDIR_TEST/scripts/dispatch-spawn-worker" 839 2>/dev/null; then sw_rc_b=0; else sw_rc_b=$?; fi
assert_eq "missing-args-worker: only <N> given → exit 2" "2" "$sw_rc_b"

# Sub-case C: three args given (extra argument)
if "$TMPDIR_TEST/scripts/dispatch-spawn-worker" 839 "$WORKER_TARGET_WORKTREE" extra 2>/dev/null; then sw_rc_c=0; else sw_rc_c=$?; fi
assert_eq "missing-args-worker: three args → exit 2" "2" "$sw_rc_c"

# Sub-case D: non-integer issue number rejected
if "$TMPDIR_TEST/scripts/dispatch-spawn-worker" "not-a-number" "$WORKER_TARGET_WORKTREE" 2>/dev/null; then sw_rc_d=0; else sw_rc_d=$?; fi
assert_eq "missing-args-worker: non-integer <N> → exit 2" "2" "$sw_rc_d"

# Sub-case E: non-existent worktree path rejected at the spawner edge
if "$TMPDIR_TEST/scripts/dispatch-spawn-worker" 839 "$TMPDIR_TEST/worktrees/does-not-exist" 2>/dev/null; then sw_rc_e=0; else sw_rc_e=$?; fi
assert_eq "missing-args-worker: non-existent <worktree-path> → exit 2" "2" "$sw_rc_e"

# Sub-case F: unsafe characters in <worktree-path> rejected (defense-in-depth
# against shell-metacharacter / whitespace injection into the prompt string
# passed to `claude --bg`). Path must exist so the `-d` check passes first,
# isolating the new char-validation step.
unsafe_path="$TMPDIR_TEST/worktrees/839 unsafe"
mkdir -p "$unsafe_path"
if "$TMPDIR_TEST/scripts/dispatch-spawn-worker" 839 "$unsafe_path" 2>/dev/null; then sw_rc_f=0; else sw_rc_f=$?; fi
assert_eq "missing-args-worker: unsafe chars in <worktree-path> → exit 2" "2" "$sw_rc_f"

spawn_worker_teardown

# --- Test 8: dedup + verify query the worktree path, not the spawner cwd ----
#
# Regression guard: in production the daemon server-side-filters `agents
# --json --cwd <path>` to sessions started under <path>. Since
# dispatch-spawn-worker `cd`s into the target worktree before `claude --bg`,
# the new worker registers under <worktree-path>, not under the spawner cwd
# (worktrees/main). Dedup and verify both query the worktree path so the new
# worker is found. If they queried the spawner cwd instead, the daemon would
# exclude the new worker, `registered` would stay empty, and the script would
# exit 1 — on every spawn in production.
#
# The default fake `claude` (write_fake_spawn_worker_claude) ignores --cwd,
# so the existing Tests 1–7 do not exercise this filter and would not catch
# the regression. This test installs a cwd-aware fake: its `agents` handler
# filters its registry-emit by --cwd, and its --bg handler records the new
# worker with cwd = $(pwd) at spawn time. With the fix, both queries pass
# the worktree path and the worker is found. Without it, verify returns no
# session and the script exits 1.
echo "Test: dedup + verify query the worktree path, not the spawner cwd"
spawn_worker_setup
cat > "$TMPDIR_TEST/fake-claude" <<FAKE
#!/usr/bin/env bash
set -uo pipefail
case "\${1:-}" in
  agents)
    shift
    requested_cwd=""
    while [[ \$# -gt 0 ]]; do
      case "\$1" in
        --cwd) requested_cwd="\${2:-}"; shift 2 ;;
        *) shift ;;
      esac
    done
    if [[ -n "\$requested_cwd" ]]; then
      jq --arg cwd "\$requested_cwd" '[.[] | select(.cwd == \$cwd)]' \
        "$SPAWN_WORKER_REGISTRY"
    else
      cat "$SPAWN_WORKER_REGISTRY"
    fi
    ;;
  --bg)
    bg_cwd="\$(pwd)"
    pwd >> "$SPAWN_WORKER_PWD_LOG"
    printf '%s\n' "\$@" > "$SPAWN_WORKER_BG_ARGV"
    name=""
    while [[ \$# -gt 0 ]]; do
      if [[ "\$1" == "--name" ]]; then name="\${2:-}"; shift 2; continue; fi
      shift
    done
    tmp=\$(mktemp)
    jq --arg name "\$name" --arg cwd "\$bg_cwd" \
      '. + [{"sessionId":("sess-"+\$name),"pid":9999,"cwd":\$cwd,"kind":"background","status":"busy","name":\$name}]' \
      "$SPAWN_WORKER_REGISTRY" > "\$tmp" && mv "\$tmp" "$SPAWN_WORKER_REGISTRY"
    ;;
  rm) ;;
esac
FAKE
chmod +x "$TMPDIR_TEST/fake-claude"
SPAWN_CALLER_CWD="$TMPDIR_TEST/worktrees/main"
if out=$( cd "$SPAWN_CALLER_CWD" && "$TMPDIR_TEST/scripts/dispatch-spawn-worker" 839 "$WORKER_TARGET_WORKTREE" 2>/dev/null ); then rc=0; else rc=$?; fi
assert_eq "cwd-aware-spawn: exits 0" "0" "$rc"
assert_eq "cwd-aware-spawn: stdout is 'spawned' (verify queried under worktree path, found the new worker)" \
  "spawned" "$out"
spawn_worker_teardown

# --- Test 9: delayed registration absorbed by verify retry -------------------

echo "Test: a spawned worker that registers on the 2nd 'agents' call still exits 0"
spawn_worker_setup
write_fake_spawn_worker_claude
# SPAWN_BG_REGISTER_AFTER_N=2 models the daemon's async-registration race:
# the spawned worker first appears in the fake's registry on the 2nd
# subsequent `agents` call. verify_agent_registered_under polls up to 5
# times, so the 2nd attempt finds the worker and the script exits 0.
export SPAWN_BG_REGISTER_AFTER_N=2
SPAWN_CALLER_CWD="$TMPDIR_TEST/worktrees/main"
err_file="$TMPDIR_TEST/stderr"
if out=$( cd "$SPAWN_CALLER_CWD" && "$TMPDIR_TEST/scripts/dispatch-spawn-worker" 839 "$WORKER_TARGET_WORKTREE" 2>"$err_file" ); then rc=0; else rc=$?; fi
err=$(cat "$err_file")
assert_eq "delayed-register-worker: dispatch-spawn-worker exits 0" "0" "$rc"
assert_eq "delayed-register-worker: stdout is 'spawned'" "spawned" "$out"
TOTAL=$((TOTAL + 1))
if [[ -z "${err//[[:space:]]/}" ]]; then
  PASS=$((PASS + 1)); echo "  PASS: delayed-register-worker: no diagnostic on stderr"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: delayed-register-worker: no diagnostic on stderr"
  echo "    stderr: $err"
fi
spawn_worker_teardown

# --- Test 10: registration on the exact last attempt still exits 0 -----------

echo "Test: a spawned worker that registers on the 5th (final) 'agents' call still exits 0"
spawn_worker_setup
write_fake_spawn_worker_claude
# SPAWN_BG_REGISTER_AFTER_N=5 makes the worker first appear on the 5th
# subsequent `agents` call — the last poll before verify_agent_registered_under
# exhausts its 5-attempt budget. This pins the off-by-one in the retry loop:
# the final attempt is honoured, so the script must still exit 0.
export SPAWN_BG_REGISTER_AFTER_N=5
export LIB_CLAUDE_AGENTS_VERIFY_INTERVAL_S=0
SPAWN_CALLER_CWD="$TMPDIR_TEST/worktrees/main"
err_file="$TMPDIR_TEST/stderr"
if out=$( cd "$SPAWN_CALLER_CWD" && "$TMPDIR_TEST/scripts/dispatch-spawn-worker" 839 "$WORKER_TARGET_WORKTREE" 2>"$err_file" ); then rc=0; else rc=$?; fi
err=$(cat "$err_file")
assert_eq "last-attempt-register-worker: dispatch-spawn-worker exits 0" "0" "$rc"
assert_eq "last-attempt-register-worker: stdout is 'spawned'" "spawned" "$out"
TOTAL=$((TOTAL + 1))
if [[ -z "${err//[[:space:]]/}" ]]; then
  PASS=$((PASS + 1)); echo "  PASS: last-attempt-register-worker: no diagnostic on stderr"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: last-attempt-register-worker: no diagnostic on stderr"
  echo "    stderr: $err"
fi
spawn_worker_teardown

# ============================================================================
# dispatch-self-close tests
# ============================================================================
echo "=== dispatch-self-close ==="
#
# dispatch-self-close runs `claude rm <job-id>` against the basename of
# $CLAUDE_JOB_DIR. The fake `claude` records its argv in SPAWN_RM_LOG (see
# write_fake_spawn_claude). When CLAUDE_JOB_DIR is unset, the script is a no-op
# — the foreground-safe gate that protects an interactive /dispatch-propagate from
# deleting the user's live conversation.

selfclose_setup() {
  TMPDIR_TEST=$(mktemp -d)
  mkdir -p "$TMPDIR_TEST/scripts"
  cp "$SCRIPT_DIR/dispatch-self-close" "$TMPDIR_TEST/scripts/dispatch-self-close"
  chmod +x "$TMPDIR_TEST/scripts/dispatch-self-close"

  # Reuse the dispatch-spawn-router fake `claude` writer: it already dispatches on
  # `rm` and appends $2 to SPAWN_ROUTER_RM_LOG. The unused SPAWN_ROUTER_REGISTRY /
  # SPAWN_ROUTER_BG_ARGV / SPAWN_ROUTER_STOP_LOG paths still need to be set because
  # the writer interpolates them into the fake-claude script body.
  SPAWN_ROUTER_REGISTRY="$TMPDIR_TEST/registry.json"
  SPAWN_ROUTER_BG_ARGV="$TMPDIR_TEST/bg-argv"
  SPAWN_ROUTER_RM_LOG="$TMPDIR_TEST/rm-log"
  SPAWN_ROUTER_STOP_LOG="$TMPDIR_TEST/stop-log"
  printf '[]' > "$SPAWN_ROUTER_REGISTRY"
  write_fake_spawn_router_claude

  export DISPATCH_SELF_CLOSE_CLAUDE_CMD="$TMPDIR_TEST/fake-claude"
}

selfclose_teardown() {
  rm -rf "$TMPDIR_TEST"
  TMPDIR_TEST=""
  SPAWN_ROUTER_REGISTRY=""
  SPAWN_ROUTER_BG_ARGV=""
  SPAWN_ROUTER_RM_LOG=""
  SPAWN_ROUTER_STOP_LOG=""
  unset DISPATCH_SELF_CLOSE_CLAUDE_CMD CLAUDE_JOB_DIR
}

# --- Test 1: managed-job → deletes itself -------------------------------------

echo "Test: a managed background job deletes itself by job-id (basename of CLAUDE_JOB_DIR)"
selfclose_setup
mkdir -p "$TMPDIR_TEST/jobs/abcd1234"
export CLAUDE_JOB_DIR="$TMPDIR_TEST/jobs/abcd1234"
if out=$("$TMPDIR_TEST/scripts/dispatch-self-close" 2>/dev/null); then rc=0; else rc=$?; fi
assert_eq "self-close: dispatch-self-close exits 0" "0" "$rc"
rm_log=$(cat "$SPAWN_ROUTER_RM_LOG" 2>/dev/null || true)
assert_eq "self-close: 'claude rm abcd1234' was invoked (basename, not full path)" \
  "abcd1234" "$rm_log"
selfclose_teardown

# --- Test 2: interactive → no-op ---------------------------------------------

echo "Test: an interactive session (CLAUDE_JOB_DIR unset) is a no-op with a diagnostic"
selfclose_setup
unset CLAUDE_JOB_DIR
rc=0
err=$("$TMPDIR_TEST/scripts/dispatch-self-close" 2>&1 1>/dev/null) || rc=$?
assert_eq "interactive: dispatch-self-close exits 0" "0" "$rc"
TOTAL=$((TOTAL + 1))
if [[ "$err" == *"not a managed background job"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: interactive: stderr reports 'not a managed background job'"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: interactive: stderr reports 'not a managed background job'"
  echo "    stderr: $err"
fi
TOTAL=$((TOTAL + 1))
if [[ ! -e "$SPAWN_ROUTER_RM_LOG" ]]; then
  PASS=$((PASS + 1)); echo "  PASS: interactive: no 'claude rm' invocation recorded"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: interactive: no 'claude rm' invocation recorded"
  echo "    rm-log: $(cat "$SPAWN_ROUTER_RM_LOG")"
fi
selfclose_teardown

# ============================================================================
# dispatch-jit-engine tests
# ============================================================================
#
# Each test gets a fresh tmp tree:
#   $TMPDIR_TEST/scripts/   copies of the engine + loader + project-item-add
#   $TMPDIR_TEST/config/    synthetic config directory (DISPATCH_CONFIG_DIR)
#   $TMPDIR_TEST/state/     the jit state-file directory (DISPATCH_JIT_STATE_DIR)
#   $TMPDIR_TEST/checkdir/  check-script directory (DISPATCH_JIT_SCRIPT_DIR)
#   $TMPDIR_TEST/stub/      gh stub fixtures + the gh-calls.log
#   $TMPDIR_TEST/bin/       the gh PATH stub
#
# The engine resolves dispatch-config-load and dispatch-project-item-add via its
# own SCRIPT_DIR — which becomes $TMPDIR_TEST/scripts for the copy — so all three
# scripts are co-located. The gh stub logs EVERY matched invocation to
# gh-calls.log so a test can assert "zero gh calls" (the debounce case). "now" is
# pinned via DISPATCH_JIT_NOW so every create decision is deterministic.

# A fixed reference epoch — 2026-01-01T00:00:00Z. Closed-issue timestamps in the
# fixtures are computed relative to this so the cadence math is deterministic.
JIT_NOW_EPOCH=1767225600

jit_setup() {
  TMPDIR_TEST=$(mktemp -d)
  STUB_DIR="$TMPDIR_TEST/stub"
  mkdir -p "$TMPDIR_TEST/scripts" "$STUB_DIR" "$TMPDIR_TEST/bin" \
    "$TMPDIR_TEST/config" "$TMPDIR_TEST/state" "$TMPDIR_TEST/checkdir"

  cp "$SCRIPT_DIR/dispatch-jit-engine" "$TMPDIR_TEST/scripts/dispatch-jit-engine"
  cp "$SCRIPT_DIR/dispatch-config-load" \
    "$TMPDIR_TEST/scripts/dispatch-config-load"
  cp "$SCRIPT_DIR/dispatch-project-item-add" \
    "$TMPDIR_TEST/scripts/dispatch-project-item-add"
  chmod +x "$TMPDIR_TEST/scripts/dispatch-jit-engine" \
           "$TMPDIR_TEST/scripts/dispatch-config-load" \
           "$TMPDIR_TEST/scripts/dispatch-project-item-add"

  export DISPATCH_CONFIG_DIR="$TMPDIR_TEST/config"
  export DISPATCH_JIT_STATE_DIR="$TMPDIR_TEST/state"
  export DISPATCH_JIT_SCRIPT_DIR="$TMPDIR_TEST/checkdir"
  export DISPATCH_JIT_NOW="$JIT_NOW_EPOCH"

  # gh PATH stub. Every matched subcommand is appended to gh-calls.log so the
  # debounce test can assert the log is absent (zero gh calls). issue list reads
  # open-issues.json / closed-issues.json fixtures if present, else "[]".
  cat > "$TMPDIR_TEST/bin/gh" <<'STUB'
#!/usr/bin/env bash
STUB_DIR="$(cd "$(dirname "$0")/.." && pwd)/stub"
args="$*"
echo "$args" >> "$STUB_DIR/gh-calls.log"
case "$args" in
  "label create "*)
    # Idempotent label create — default success.
    ;;
  *"issue list "*"--state open"*)
    if [[ -f "$STUB_DIR/open-issues.json" ]]; then
      cat "$STUB_DIR/open-issues.json"
    else
      echo '[]'
    fi
    ;;
  *"issue list "*"--state closed"*)
    if [[ -f "$STUB_DIR/closed-issues.json" ]]; then
      cat "$STUB_DIR/closed-issues.json"
    else
      echo '[]'
    fi
    ;;
  "issue create "*)
    echo "$args" >> "$STUB_DIR/gh-issue-create.log"
    echo "https://github.com/test-owner/test-repo/issues/123"
    ;;
  "project item-add "*)
    echo '{"id":"PVTI_jit001","title":"JIT issue","type":"Issue"}'
    ;;
  *)
    echo "gh stub: unknown invocation: $args" >&2
    exit 1
    ;;
esac
STUB
  chmod +x "$TMPDIR_TEST/bin/gh"
  PATH="$TMPDIR_TEST/bin:$PATH"
}

jit_teardown() {
  rm -rf "$TMPDIR_TEST"
  PATH="$SAVED_PATH"
  TMPDIR_TEST=""
  STUB_DIR=""
  unset DISPATCH_CONFIG_DIR
  unset DISPATCH_JIT_STATE_DIR
  unset DISPATCH_JIT_SCRIPT_DIR
  unset DISPATCH_JIT_NOW
}

# jit_write_projects — write a projects.json fixture with one project whose key
# matches the jit `project` field used throughout these tests.
jit_write_projects() {
  cat > "$TMPDIR_TEST/config/projects.json" <<'EOF'
{
  "projects": [
    {
      "key": "test-project",
      "owner": "test-owner",
      "number": 1,
      "statusField": "Status",
      "statusInProgress": "In Progress",
      "statusDone": "Done"
    }
  ]
}
EOF
}

# --- Test 1: no config — silent no-op ---------------------------------------

echo "Test: dispatch-jit-engine with no config is a silent no-op"
jit_setup
# No jit.json written in $DISPATCH_CONFIG_DIR.
rc=0
out=$("$TMPDIR_TEST/scripts/dispatch-jit-engine" 2>/dev/null) || rc=$?
assert_eq "no-config exits 0" "0" "$rc"
assert_eq "no-config prints nothing" "" "$out"
jit_teardown

# --- Test 2: cadence cold start creates an issue -----------------------------

echo "Test: dispatch-jit-engine cadence cold start creates an issue"
jit_setup
jit_write_projects
cat > "$TMPDIR_TEST/config/jit.json" <<'EOF'
{
  "jits": [
    {
      "key": "daily-chore",
      "repo": "test-owner/test-repo",
      "label": "jit:daily-chore",
      "title": "Daily chore",
      "body": "Recurring daily chore. Close when done.",
      "project": "test-project",
      "remindAfterClose": "12h"
    }
  ]
}
EOF
# open-issues.json and closed-issues.json absent — open/closed both "[]".
rc=0
out=$("$TMPDIR_TEST/scripts/dispatch-jit-engine" 2>/dev/null) || rc=$?
assert_eq "cold start exits 0" "0" "$rc"
TOTAL=$((TOTAL + 1))
if [[ "$out" == *"daily-chore: created #123"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: cold start reports created #123"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: cold start reports created #123"
  echo "    actual: $out"
fi
calls=$(cat "$STUB_DIR/gh-calls.log")
TOTAL=$((TOTAL + 1))
if [[ "$calls" == *"label create"* && "$calls" == *"issue list "*"--state open"* \
   && "$calls" == *"issue list "*"--state closed"* \
   && "$calls" == *"issue create"* && "$calls" == *"project item-add"* ]]; then
  PASS=$((PASS + 1))
  echo "  PASS: cold start invoked label create / list / create / item-add"
else
  FAIL=$((FAIL + 1))
  echo "  FAIL: cold start invoked label create / list / create / item-add"
  echo "    gh-calls.log: $calls"
fi
jit_teardown

# --- Test 3: cadence within window — skipped, no issue created ---------------

echo "Test: dispatch-jit-engine cadence within remindAfterClose is skipped"
jit_setup
jit_write_projects
cat > "$TMPDIR_TEST/config/jit.json" <<'EOF'
{
  "jits": [
    {
      "key": "daily-chore",
      "repo": "test-owner/test-repo",
      "label": "jit:daily-chore",
      "title": "Daily chore",
      "body": "Recurring daily chore. Close when done.",
      "project": "test-project",
      "remindAfterClose": "12h"
    }
  ]
}
EOF
# Newest closed issue closed 1h before "now" — within the 12h window.
closed_at=$(date -u -d "@$((JIT_NOW_EPOCH - 3600))" +%Y-%m-%dT%H:%M:%SZ)
printf '[{"number":40,"closedAt":"%s"}]\n' "$closed_at" \
  > "$STUB_DIR/closed-issues.json"
rc=0
out=$("$TMPDIR_TEST/scripts/dispatch-jit-engine" 2>/dev/null) || rc=$?
assert_eq "within-window exits 0" "0" "$rc"
TOTAL=$((TOTAL + 1))
if [[ "$out" == *"daily-chore: skipped (within remindAfterClose)"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: within-window reports skipped (within remindAfterClose)"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: within-window reports skipped (within remindAfterClose)"
  echo "    actual: $out"
fi
TOTAL=$((TOTAL + 1))
if [[ ! -f "$STUB_DIR/gh-issue-create.log" ]]; then
  PASS=$((PASS + 1)); echo "  PASS: within-window made no issue create call"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: within-window made no issue create call"
  echo "    gh-issue-create.log: $(cat "$STUB_DIR/gh-issue-create.log")"
fi
jit_teardown

# --- Test 4: cadence past window creates an issue ----------------------------

echo "Test: dispatch-jit-engine cadence past remindAfterClose creates an issue"
jit_setup
jit_write_projects
cat > "$TMPDIR_TEST/config/jit.json" <<'EOF'
{
  "jits": [
    {
      "key": "daily-chore",
      "repo": "test-owner/test-repo",
      "label": "jit:daily-chore",
      "title": "Daily chore",
      "body": "Recurring daily chore. Close when done.",
      "project": "test-project",
      "remindAfterClose": "12h"
    }
  ]
}
EOF
# Newest closed issue closed 24h before "now" — past the 12h window.
closed_at=$(date -u -d "@$((JIT_NOW_EPOCH - 86400))" +%Y-%m-%dT%H:%M:%SZ)
printf '[{"number":40,"closedAt":"%s"}]\n' "$closed_at" \
  > "$STUB_DIR/closed-issues.json"
rc=0
out=$("$TMPDIR_TEST/scripts/dispatch-jit-engine" 2>/dev/null) || rc=$?
assert_eq "past-window exits 0" "0" "$rc"
TOTAL=$((TOTAL + 1))
if [[ "$out" == *"daily-chore: created #123"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: past-window reports created #123"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: past-window reports created #123"
  echo "    actual: $out"
fi
jit_teardown

# --- Test 5: open-issue guard — skipped when an open issue exists ------------

echo "Test: dispatch-jit-engine skips when an open issue with the label exists"
jit_setup
jit_write_projects
cat > "$TMPDIR_TEST/config/jit.json" <<'EOF'
{
  "jits": [
    {
      "key": "daily-chore",
      "repo": "test-owner/test-repo",
      "label": "jit:daily-chore",
      "title": "Daily chore",
      "body": "Recurring daily chore. Close when done.",
      "project": "test-project",
      "remindAfterClose": "12h"
    }
  ]
}
EOF
echo '[{"number":50}]' > "$STUB_DIR/open-issues.json"
rc=0
out=$("$TMPDIR_TEST/scripts/dispatch-jit-engine" 2>/dev/null) || rc=$?
assert_eq "open-guard exits 0" "0" "$rc"
TOTAL=$((TOTAL + 1))
if [[ "$out" == *"daily-chore: skipped (open issue exists)"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: open-guard reports skipped (open issue exists)"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: open-guard reports skipped (open issue exists)"
  echo "    actual: $out"
fi
TOTAL=$((TOTAL + 1))
if [[ ! -f "$STUB_DIR/gh-issue-create.log" ]]; then
  PASS=$((PASS + 1)); echo "  PASS: open-guard made no issue create call"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: open-guard made no issue create call"
  echo "    gh-issue-create.log: $(cat "$STUB_DIR/gh-issue-create.log")"
fi
jit_teardown

# --- Test 6: check-script jit fires — creates an issue -----------------------

echo "Test: dispatch-jit-engine check-script jit creates an issue when it fires"
jit_setup
jit_write_projects
cat > "$TMPDIR_TEST/config/jit.json" <<'EOF'
{
  "jits": [
    {
      "key": "email-review",
      "repo": "test-owner/test-repo",
      "label": "jit:email-review",
      "title": "Review the inbox",
      "body": "The inbox needs attention.",
      "project": "test-project",
      "check": { "script": "mock-check" }
    }
  ]
}
EOF
# A check script whose exit code is controlled by MOCK_CHECK_RC.
cat > "$TMPDIR_TEST/checkdir/mock-check" <<'CHK'
#!/usr/bin/env bash
exit "${MOCK_CHECK_RC:-0}"
CHK
chmod +x "$TMPDIR_TEST/checkdir/mock-check"
rc=0
out=$(MOCK_CHECK_RC=0 "$TMPDIR_TEST/scripts/dispatch-jit-engine" 2>/dev/null) \
  || rc=$?
assert_eq "check-fire exits 0" "0" "$rc"
TOTAL=$((TOTAL + 1))
if [[ "$out" == *"email-review: created #123"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: check-fire reports created #123"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: check-fire reports created #123"
  echo "    actual: $out"
fi
jit_teardown

# --- Test 7: check-script jit does not fire — skipped ------------------------

echo "Test: dispatch-jit-engine check-script jit is skipped when it does not fire"
jit_setup
jit_write_projects
cat > "$TMPDIR_TEST/config/jit.json" <<'EOF'
{
  "jits": [
    {
      "key": "email-review",
      "repo": "test-owner/test-repo",
      "label": "jit:email-review",
      "title": "Review the inbox",
      "body": "The inbox needs attention.",
      "project": "test-project",
      "check": { "script": "mock-check" }
    }
  ]
}
EOF
cat > "$TMPDIR_TEST/checkdir/mock-check" <<'CHK'
#!/usr/bin/env bash
exit "${MOCK_CHECK_RC:-0}"
CHK
chmod +x "$TMPDIR_TEST/checkdir/mock-check"
rc=0
out=$(MOCK_CHECK_RC=1 "$TMPDIR_TEST/scripts/dispatch-jit-engine" 2>/dev/null) \
  || rc=$?
assert_eq "check-no-fire exits 0" "0" "$rc"
TOTAL=$((TOTAL + 1))
if [[ "$out" == *"email-review: skipped (check did not fire)"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: check-no-fire reports skipped (check did not fire)"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: check-no-fire reports skipped (check did not fire)"
  echo "    actual: $out"
fi
TOTAL=$((TOTAL + 1))
if [[ ! -f "$STUB_DIR/gh-issue-create.log" ]]; then
  PASS=$((PASS + 1)); echo "  PASS: check-no-fire made no issue create call"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: check-no-fire made no issue create call"
  echo "    gh-issue-create.log: $(cat "$STUB_DIR/gh-issue-create.log")"
fi
jit_teardown

# --- Test 8: debounce active — skipped with zero gh calls --------------------

echo "Test: dispatch-jit-engine debounce active skips with no gh call"
jit_setup
jit_write_projects
cat > "$TMPDIR_TEST/config/jit.json" <<'EOF'
{
  "jits": [
    {
      "key": "daily-chore",
      "repo": "test-owner/test-repo",
      "label": "jit:daily-chore",
      "title": "Daily chore",
      "body": "Recurring daily chore. Close when done.",
      "project": "test-project",
      "remindAfterClose": "12h",
      "debounce": "1h"
    }
  ]
}
EOF
# Pre-seed the state file: last check 5 minutes ago — within the 1h debounce.
printf '{"daily-chore": %s}\n' "$((JIT_NOW_EPOCH - 300))" \
  > "$TMPDIR_TEST/state/dispatch-jit-state.json"
rc=0
out=$("$TMPDIR_TEST/scripts/dispatch-jit-engine" 2>/dev/null) || rc=$?
assert_eq "debounce-active exits 0" "0" "$rc"
TOTAL=$((TOTAL + 1))
if [[ "$out" == *"daily-chore: debounced"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: debounce-active reports debounced"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: debounce-active reports debounced"
  echo "    actual: $out"
fi
TOTAL=$((TOTAL + 1))
if [[ ! -s "$STUB_DIR/gh-calls.log" ]]; then
  PASS=$((PASS + 1)); echo "  PASS: debounce-active made zero gh calls"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: debounce-active made zero gh calls"
  echo "    gh-calls.log: $(cat "$STUB_DIR/gh-calls.log")"
fi
jit_teardown

# --- Test 9: debounce elapsed — the check runs -------------------------------

echo "Test: dispatch-jit-engine runs the check once the debounce window elapsed"
jit_setup
jit_write_projects
cat > "$TMPDIR_TEST/config/jit.json" <<'EOF'
{
  "jits": [
    {
      "key": "daily-chore",
      "repo": "test-owner/test-repo",
      "label": "jit:daily-chore",
      "title": "Daily chore",
      "body": "Recurring daily chore. Close when done.",
      "project": "test-project",
      "remindAfterClose": "12h",
      "debounce": "1h"
    }
  ]
}
EOF
# Pre-seed the state file: last check 2h ago — past the 1h debounce window.
printf '{"daily-chore": %s}\n' "$((JIT_NOW_EPOCH - 7200))" \
  > "$TMPDIR_TEST/state/dispatch-jit-state.json"
rc=0
out=$("$TMPDIR_TEST/scripts/dispatch-jit-engine" 2>/dev/null) || rc=$?
assert_eq "debounce-elapsed exits 0" "0" "$rc"
TOTAL=$((TOTAL + 1))
if [[ "$out" != *"debounced"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: debounce-elapsed did not report debounced"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: debounce-elapsed did not report debounced"
  echo "    actual: $out"
fi
TOTAL=$((TOTAL + 1))
if [[ -s "$STUB_DIR/gh-calls.log" ]]; then
  PASS=$((PASS + 1)); echo "  PASS: debounce-elapsed ran the check (gh was called)"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: debounce-elapsed ran the check (gh was called)"
fi
jit_teardown

# --- Test 10: idempotency — a second run does not re-create the issue --------

echo "Test: dispatch-jit-engine is idempotent — a second run skips the open issue"
jit_setup
jit_write_projects
cat > "$TMPDIR_TEST/config/jit.json" <<'EOF'
{
  "jits": [
    {
      "key": "daily-chore",
      "repo": "test-owner/test-repo",
      "label": "jit:daily-chore",
      "title": "Daily chore",
      "body": "Recurring daily chore. Close when done.",
      "project": "test-project",
      "remindAfterClose": "12h"
    }
  ]
}
EOF
# Run 1: cold start (open/closed both "[]") — creates #123.
rc=0
out1=$("$TMPDIR_TEST/scripts/dispatch-jit-engine" 2>/dev/null) || rc=$?
assert_eq "idempotency run 1 exits 0" "0" "$rc"
TOTAL=$((TOTAL + 1))
if [[ "$out1" == *"daily-chore: created #123"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: idempotency run 1 created #123"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: idempotency run 1 created #123"
  echo "    actual: $out1"
fi
# Run 1 stamped the state file with a numeric timestamp for the jit key.
TOTAL=$((TOTAL + 1))
if jq -e '.["daily-chore"] | type == "number"' \
   "$TMPDIR_TEST/state/dispatch-jit-state.json" >/dev/null 2>&1; then
  PASS=$((PASS + 1)); echo "  PASS: run 1 stamped a numeric state timestamp"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: run 1 stamped a numeric state timestamp"
  echo "    state file: $(cat "$TMPDIR_TEST/state/dispatch-jit-state.json" 2>&1)"
fi
# The created issue is now open; record the call-log line count before run 2.
echo '[{"number":123}]' > "$STUB_DIR/open-issues.json"
calls_before=$(wc -l < "$STUB_DIR/gh-calls.log")
creates_before=0
[[ -f "$STUB_DIR/gh-issue-create.log" ]] \
  && creates_before=$(wc -l < "$STUB_DIR/gh-issue-create.log")
# Run 2: the open-issue guard fires — skipped, no second create.
rc=0
out2=$("$TMPDIR_TEST/scripts/dispatch-jit-engine" 2>/dev/null) || rc=$?
assert_eq "idempotency run 2 exits 0" "0" "$rc"
TOTAL=$((TOTAL + 1))
if [[ "$out2" == *"daily-chore: skipped (open issue exists)"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: idempotency run 2 skipped (open issue exists)"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: idempotency run 2 skipped (open issue exists)"
  echo "    actual: $out2"
fi
creates_after=0
[[ -f "$STUB_DIR/gh-issue-create.log" ]] \
  && creates_after=$(wc -l < "$STUB_DIR/gh-issue-create.log")
assert_eq "idempotency run 2 made no second issue create" \
  "$creates_before" "$creates_after"
jit_teardown

# ============================================================================
# dispatch-input-block hook tests
# ============================================================================
echo ""
echo "=== dispatch-input-block ==="
#
# The hook discriminates on CLAUDE_JOB_DIR/state.json {.name} starting with
# "dispatch-"; resolves the issue number from the current branch (the <N>-*
# prefix); parks the ISSUE via dispatch-apply-office-hours (the single write
# path — issue target, create-on-first-use, why-comment); runs dispatch-spawn.
# Always exits 0.
#
# Each test gets a fresh tmp tree:
#   $TMPDIR_TEST/hooks/dispatch-input-block.sh     — the hook under test
#   $TMPDIR_TEST/skills/dispatch-propagate/scripts/  — fakes for
#                                                    dispatch-apply-office-hours,
#                                                    dispatch-spawn
#   $TMPDIR_TEST/bin/{gh,git}                      — PATH shims
#   $TMPDIR_TEST/jobs/<id>/state.json              — fake CLAUDE_JOB_DIR ledger
#   $TMPDIR_TEST/stub/{gh,git,spawn}-calls.log     — recorded invocations
#
# HOOK_SCRIPT_DIR — the project hooks directory the test copies from. SCRIPT_DIR
# here is .claude/skills/dispatch-propagate/scripts; the hooks live at .claude/hooks.
HOOK_SCRIPT_DIR="$SCRIPT_DIR/../../../hooks"

ib_setup() {
  TMPDIR_TEST=$(mktemp -d)
  STUB_DIR="$TMPDIR_TEST/stub"
  mkdir -p "$TMPDIR_TEST/hooks" "$TMPDIR_TEST/skills/dispatch-propagate/scripts" \
    "$TMPDIR_TEST/bin" "$STUB_DIR" "$TMPDIR_TEST/jobs/abcd1234"

  cp "$HOOK_SCRIPT_DIR/dispatch-input-block.sh" \
    "$TMPDIR_TEST/hooks/dispatch-input-block.sh"
  chmod +x "$TMPDIR_TEST/hooks/dispatch-input-block.sh"

  # Fake dispatch-apply-office-hours: log argv to apply-office-hours.log so
  # tests can assert the issue target + reason the hook passed. The hook routes
  # every dispatch:office-hours apply through this single write path.
  cat > "$TMPDIR_TEST/skills/dispatch-propagate/scripts/dispatch-apply-office-hours" <<'FAKE'
#!/usr/bin/env bash
echo "$*" >> "$STUB_DIR/apply-office-hours.log"
exit 0
FAKE
  chmod +x "$TMPDIR_TEST/skills/dispatch-propagate/scripts/dispatch-apply-office-hours"

  # Fake dispatch-spawn-router: log invocations to spawn-calls.log.
  cat > "$TMPDIR_TEST/skills/dispatch-propagate/scripts/dispatch-spawn-router" <<'FAKE'
#!/usr/bin/env bash
echo "spawn" >> "$STUB_DIR/spawn-calls.log"
echo "spawned"
exit 0
FAKE
  chmod +x "$TMPDIR_TEST/skills/dispatch-propagate/scripts/dispatch-spawn-router"

  # gh PATH stub. pr-edit-mode/issue-edit-mode select behavior (default: ok and
  # log args). "label-missing" models the first apply failing with a missing-
  # label error; the create-then-retry idiom then succeeds on the second call.
  cat > "$TMPDIR_TEST/bin/gh" <<'STUB'
#!/usr/bin/env bash
STUB_DIR="$(cd "$(dirname "$0")/.." && pwd)/stub"
args="$*"
case "$args" in
  pr\ edit\ *)
    mode="ok"
    [[ -f "$STUB_DIR/pr-edit-mode" ]] && mode=$(cat "$STUB_DIR/pr-edit-mode")
    case "$mode" in
      label-missing)
        if [[ -f "$STUB_DIR/gh-label-create.log" ]]; then
          echo "$args" >> "$STUB_DIR/gh-pr-edit.log"
        else
          echo "failed to update: 'dispatch:office-hours' not found" >&2
          exit 1
        fi
        ;;
      *)
        echo "$args" >> "$STUB_DIR/gh-pr-edit.log"
        ;;
    esac
    ;;
  issue\ edit\ *)
    echo "$args" >> "$STUB_DIR/gh-issue-edit.log"
    ;;
  label\ create\ *)
    echo "$args" >> "$STUB_DIR/gh-label-create.log"
    ;;
  *)
    echo "gh stub: unknown invocation: $args" >&2
    exit 1
    ;;
esac
STUB
  chmod +x "$TMPDIR_TEST/bin/gh"

  # git PATH stub. The hook reads `rev-parse --abbrev-ref HEAD` to derive the
  # issue number. current-branch.txt is the per-test fixture.
  cat > "$TMPDIR_TEST/bin/git" <<'STUB'
#!/usr/bin/env bash
STUB_DIR="$(cd "$(dirname "$0")/.." && pwd)/stub"
args="$*"
case "$args" in
  "rev-parse --abbrev-ref HEAD")
    if [[ -f "$STUB_DIR/current-branch.txt" ]]; then
      cat "$STUB_DIR/current-branch.txt"
    else
      echo "main"
    fi
    ;;
  *) echo "git stub: unknown invocation: $args" >&2; exit 1 ;;
esac
STUB
  chmod +x "$TMPDIR_TEST/bin/git"

  export PATH="$TMPDIR_TEST/bin:$PATH"
  export STUB_DIR  # fakes resolve STUB_DIR from env
}

ib_teardown() {
  rm -rf "$TMPDIR_TEST"
  TMPDIR_TEST=""
  STUB_DIR=""
  export PATH="$SAVED_PATH"
  unset CLAUDE_JOB_DIR
}

# --- Test 1: dispatch-* job + PR exists → still parks the ISSUE, spawn baton --

echo "Test: dispatch-* job + branch <N>-* + PR exists → park ISSUE via apply-office-hours, spawn baton"
ib_setup
echo "123-foo-bar" > "$STUB_DIR/current-branch.txt"
echo "456" > "$STUB_DIR/find-pr-output"
echo '{"name":"dispatch-test001"}' > "$TMPDIR_TEST/jobs/abcd1234/state.json"
export CLAUDE_JOB_DIR="$TMPDIR_TEST/jobs/abcd1234"
"$TMPDIR_TEST/hooks/dispatch-input-block.sh" < /dev/null >/dev/null 2>&1
rc=$?
assert_eq "input-block: hook exits 0" "0" "$rc"
apply_log=$(cat "$STUB_DIR/apply-office-hours.log" 2>/dev/null || true)
apply_issue=$(printf '%s' "$apply_log" | awk '{print $1}')
apply_reason=$(printf '%s' "$apply_log" | cut -d' ' -f2-)
TOTAL=$((TOTAL + 1))
if [[ "$apply_issue" == "123" && -n "$apply_reason" ]]; then
  PASS=$((PASS + 1)); echo "  PASS: input-block: dispatch-apply-office-hours invoked with issue 123 + non-empty reason (issue target even with a PR)"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: input-block: dispatch-apply-office-hours invoked with issue 123 + non-empty reason"
  echo "    apply-log: $apply_log"
fi
TOTAL=$((TOTAL + 1))
if [[ ! -e "$STUB_DIR/gh-pr-edit.log" ]]; then
  PASS=$((PASS + 1)); echo "  PASS: input-block: no PR-targeted gh edit (apply is issue-only)"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: input-block: no PR-targeted gh edit (apply is issue-only)"
fi
spawn_calls=$(wc -l < "$STUB_DIR/spawn-calls.log" 2>/dev/null || echo 0)
assert_eq "input-block: dispatch-spawn invoked exactly once" "1" "$spawn_calls"
ib_teardown

# --- Test 2: dispatch-* job + no PR → park the ISSUE, spawn baton ------------

echo "Test: dispatch-* job + branch <N>-* + no PR → park ISSUE (implement phase)"
ib_setup
echo "789-bare" > "$STUB_DIR/current-branch.txt"
echo '{"name":"dispatch-test001"}' > "$TMPDIR_TEST/jobs/abcd1234/state.json"
export CLAUDE_JOB_DIR="$TMPDIR_TEST/jobs/abcd1234"
"$TMPDIR_TEST/hooks/dispatch-input-block.sh" < /dev/null >/dev/null 2>&1
rc=$?
assert_eq "input-block (no PR): hook exits 0" "0" "$rc"
apply_log=$(cat "$STUB_DIR/apply-office-hours.log" 2>/dev/null || true)
apply_issue=$(printf '%s' "$apply_log" | awk '{print $1}')
apply_reason=$(printf '%s' "$apply_log" | cut -d' ' -f2-)
TOTAL=$((TOTAL + 1))
if [[ "$apply_issue" == "789" && -n "$apply_reason" ]]; then
  PASS=$((PASS + 1)); echo "  PASS: input-block (no PR): dispatch-apply-office-hours invoked with issue 789 + non-empty reason"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: input-block (no PR): dispatch-apply-office-hours invoked with issue 789 + non-empty reason"
  echo "    apply-log: $apply_log"
fi
ib_teardown

# --- Test 3: CLAUDE_JOB_DIR unset → no-op (no label, no spawn) ---------------

echo "Test: CLAUDE_JOB_DIR unset → no-op (interactive session is excluded)"
ib_setup
echo "123-foo" > "$STUB_DIR/current-branch.txt"
echo "456" > "$STUB_DIR/find-pr-output"
unset CLAUDE_JOB_DIR
"$TMPDIR_TEST/hooks/dispatch-input-block.sh" < /dev/null >/dev/null 2>&1
rc=$?
assert_eq "no-job-dir: hook exits 0" "0" "$rc"
TOTAL=$((TOTAL + 1))
if [[ ! -e "$STUB_DIR/apply-office-hours.log" ]]; then
  PASS=$((PASS + 1)); echo "  PASS: no-job-dir: no office-hours apply was invoked"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: no-job-dir: no office-hours apply was invoked"
fi
TOTAL=$((TOTAL + 1))
if [[ ! -e "$STUB_DIR/spawn-calls.log" ]]; then
  PASS=$((PASS + 1)); echo "  PASS: no-job-dir: dispatch-spawn was not invoked"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: no-job-dir: dispatch-spawn was not invoked"
fi
ib_teardown

# --- Test 4: non-dispatch job name → no-op -----------------------------------

echo "Test: state.json name is not 'dispatch-*' → no-op (other background jobs excluded)"
ib_setup
echo "123-foo" > "$STUB_DIR/current-branch.txt"
echo "456" > "$STUB_DIR/find-pr-output"
echo '{"name":"manual-session"}' > "$TMPDIR_TEST/jobs/abcd1234/state.json"
export CLAUDE_JOB_DIR="$TMPDIR_TEST/jobs/abcd1234"
"$TMPDIR_TEST/hooks/dispatch-input-block.sh" < /dev/null >/dev/null 2>&1
rc=$?
assert_eq "non-dispatch: hook exits 0" "0" "$rc"
TOTAL=$((TOTAL + 1))
if [[ ! -e "$STUB_DIR/apply-office-hours.log" ]]; then
  PASS=$((PASS + 1)); echo "  PASS: non-dispatch: no office-hours apply was invoked"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: non-dispatch: no office-hours apply was invoked"
fi
TOTAL=$((TOTAL + 1))
if [[ ! -e "$STUB_DIR/spawn-calls.log" ]]; then
  PASS=$((PASS + 1)); echo "  PASS: non-dispatch: dispatch-spawn was not invoked"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: non-dispatch: dispatch-spawn was not invoked"
fi
ib_teardown

# --- Test 5: non-permission-prompt notification → silent pass-through --------

echo "Test: Notification with non-permission-prompt type → no-op (passes through silently)"
ib_setup
echo "123-foo" > "$STUB_DIR/current-branch.txt"
echo "456" > "$STUB_DIR/find-pr-output"
echo '{"name":"dispatch-test001"}' > "$TMPDIR_TEST/jobs/abcd1234/state.json"
export CLAUDE_JOB_DIR="$TMPDIR_TEST/jobs/abcd1234"
printf '%s' '{"notification_type":"session_complete"}' \
  | "$TMPDIR_TEST/hooks/dispatch-input-block.sh" >/dev/null 2>&1
rc=$?
assert_eq "non-permission-prompt: hook exits 0" "0" "$rc"
TOTAL=$((TOTAL + 1))
if [[ ! -e "$STUB_DIR/apply-office-hours.log" ]]; then
  PASS=$((PASS + 1)); echo "  PASS: non-permission-prompt: no office-hours apply was invoked"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: non-permission-prompt: no office-hours apply was invoked"
fi
ib_teardown

# --- Test 6: non-issue branch with dispatch job → no-op ----------------------

echo "Test: non-issue branch (main) + dispatch-* job → no-op (no label, no spawn)"
ib_setup
echo "main" > "$STUB_DIR/current-branch.txt"
echo '{"name":"dispatch-test001"}' > "$TMPDIR_TEST/jobs/abcd1234/state.json"
export CLAUDE_JOB_DIR="$TMPDIR_TEST/jobs/abcd1234"
"$TMPDIR_TEST/hooks/dispatch-input-block.sh" < /dev/null >/dev/null 2>&1
rc=$?
assert_eq "non-issue-branch: hook exits 0" "0" "$rc"
TOTAL=$((TOTAL + 1))
if [[ ! -e "$STUB_DIR/apply-office-hours.log" ]]; then
  PASS=$((PASS + 1)); echo "  PASS: non-issue-branch: no office-hours apply was invoked"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: non-issue-branch: no office-hours apply was invoked"
fi
TOTAL=$((TOTAL + 1))
if [[ ! -e "$STUB_DIR/spawn-calls.log" ]]; then
  PASS=$((PASS + 1)); echo "  PASS: non-issue-branch: dispatch-spawn was not invoked"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: non-issue-branch: dispatch-spawn was not invoked"
fi
ib_teardown

# ============================================================================
# dispatch-office-hours-strip hook tests
# ============================================================================
echo ""
echo "=== dispatch-office-hours-strip ==="
#
# UserPromptSubmit hook that removes dispatch:office-hours from the worktree's
# PR (or issue if no PR exists). No CLAUDE_JOB_DIR discriminator — a human
# submitting a prompt is the engagement signal regardless of session type.

ohs_setup() {
  TMPDIR_TEST=$(mktemp -d)
  STUB_DIR="$TMPDIR_TEST/stub"
  mkdir -p "$TMPDIR_TEST/hooks" "$TMPDIR_TEST/skills/dispatch-propagate/scripts" \
    "$TMPDIR_TEST/bin" "$STUB_DIR"

  cp "$HOOK_SCRIPT_DIR/dispatch-office-hours-strip.sh" \
    "$TMPDIR_TEST/hooks/dispatch-office-hours-strip.sh"
  chmod +x "$TMPDIR_TEST/hooks/dispatch-office-hours-strip.sh"

  cat > "$TMPDIR_TEST/skills/dispatch-propagate/scripts/dispatch-find-pr" <<'FAKE'
#!/usr/bin/env bash
[[ -f "$STUB_DIR/find-pr-output" ]] && cat "$STUB_DIR/find-pr-output"
exit 0
FAKE
  chmod +x "$TMPDIR_TEST/skills/dispatch-propagate/scripts/dispatch-find-pr"

  cat > "$TMPDIR_TEST/bin/gh" <<'STUB'
#!/usr/bin/env bash
STUB_DIR="$(cd "$(dirname "$0")/.." && pwd)/stub"
args="$*"
case "$args" in
  pr\ edit\ *) echo "$args" >> "$STUB_DIR/gh-pr-edit.log" ;;
  issue\ edit\ *) echo "$args" >> "$STUB_DIR/gh-issue-edit.log" ;;
  *) echo "gh stub: unknown invocation: $args" >&2; exit 1 ;;
esac
STUB
  chmod +x "$TMPDIR_TEST/bin/gh"

  cat > "$TMPDIR_TEST/bin/git" <<'STUB'
#!/usr/bin/env bash
STUB_DIR="$(cd "$(dirname "$0")/.." && pwd)/stub"
args="$*"
case "$args" in
  "rev-parse --abbrev-ref HEAD")
    if [[ -f "$STUB_DIR/current-branch.txt" ]]; then
      cat "$STUB_DIR/current-branch.txt"
    else
      echo "main"
    fi
    ;;
  *) echo "git stub: unknown invocation: $args" >&2; exit 1 ;;
esac
STUB
  chmod +x "$TMPDIR_TEST/bin/git"

  export PATH="$TMPDIR_TEST/bin:$PATH"
  export STUB_DIR
}

ohs_teardown() {
  rm -rf "$TMPDIR_TEST"
  TMPDIR_TEST=""
  STUB_DIR=""
  export PATH="$SAVED_PATH"
}

# --- Test 1: branch <N>-* + PR exists → strip from both PR and issue ----------
# The hook strips from both targets so a stale issue label (applied before the PR
# was opened) is also cleared. gh --remove-label is a no-op when the label is absent.

echo "Test: strip hook on <N>-* branch with PR → strips from both PR and issue"
ohs_setup
echo "123-foo-bar" > "$STUB_DIR/current-branch.txt"
echo "456" > "$STUB_DIR/find-pr-output"
"$TMPDIR_TEST/hooks/dispatch-office-hours-strip.sh" < /dev/null >/dev/null 2>&1
rc=$?
assert_eq "strip: hook exits 0" "0" "$rc"
pr_edit_log=$(cat "$STUB_DIR/gh-pr-edit.log" 2>/dev/null || true)
TOTAL=$((TOTAL + 1))
if [[ "$pr_edit_log" == *"pr edit 456 --remove-label dispatch:office-hours"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: strip: 'gh pr edit 456 --remove-label dispatch:office-hours' was invoked"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: strip: 'gh pr edit 456 --remove-label dispatch:office-hours' was invoked"
  echo "    pr-edit-log: $pr_edit_log"
fi
issue_edit_log=$(cat "$STUB_DIR/gh-issue-edit.log" 2>/dev/null || true)
TOTAL=$((TOTAL + 1))
if [[ "$issue_edit_log" == *"issue edit 123 --remove-label dispatch:office-hours"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: strip: 'gh issue edit 123 --remove-label dispatch:office-hours' also invoked (clears stale issue label)"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: strip: 'gh issue edit 123 --remove-label dispatch:office-hours' also invoked (clears stale issue label)"
  echo "    issue-edit-log: $issue_edit_log"
fi
ohs_teardown

# --- Test 2: branch <N>-* + no PR → strip from issue -------------------------

echo "Test: strip hook on <N>-* branch with no PR → 'gh issue edit --remove-label dispatch:office-hours'"
ohs_setup
echo "789-bare" > "$STUB_DIR/current-branch.txt"
# No find-pr-output → fall back to issue.
"$TMPDIR_TEST/hooks/dispatch-office-hours-strip.sh" < /dev/null >/dev/null 2>&1
rc=$?
assert_eq "strip (no PR): hook exits 0" "0" "$rc"
issue_edit_log=$(cat "$STUB_DIR/gh-issue-edit.log" 2>/dev/null || true)
TOTAL=$((TOTAL + 1))
if [[ "$issue_edit_log" == *"issue edit 789 --remove-label dispatch:office-hours"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: strip (no PR): 'gh issue edit 789 --remove-label dispatch:office-hours' was invoked"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: strip (no PR): 'gh issue edit 789 --remove-label dispatch:office-hours' was invoked"
  echo "    issue-edit-log: $issue_edit_log"
fi
ohs_teardown

# --- Test 3: branch is not <N>-* → no-op -------------------------------------

echo "Test: strip hook on non-issue branch (main) → no-op (no gh call)"
ohs_setup
echo "main" > "$STUB_DIR/current-branch.txt"
"$TMPDIR_TEST/hooks/dispatch-office-hours-strip.sh" < /dev/null >/dev/null 2>&1
rc=$?
assert_eq "strip (non-issue): hook exits 0" "0" "$rc"
TOTAL=$((TOTAL + 1))
if [[ ! -e "$STUB_DIR/gh-pr-edit.log" && ! -e "$STUB_DIR/gh-issue-edit.log" ]]; then
  PASS=$((PASS + 1)); echo "  PASS: strip (non-issue): no gh call was invoked"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: strip (non-issue): no gh call was invoked"
fi
ohs_teardown

# ============================================================================
# dispatch-stop hook tests
# ============================================================================
echo ""
echo "=== dispatch-stop ==="
#
# Stop hook owning the post-phase disposition: read phase-completed marker,
# decide branch (A absent / B advanced / C verify-retry / D non-advance),
# manage dispatch:office-hours, spawn router, self-close on advance.
# Discriminator: CLAUDE_JOB_DIR set, state.json present, .name matches ^[0-9]+-
# (workers only; router names like dispatch-<id> are skipped).
#
# Each test gets a fresh tmp tree:
#   $TMPDIR_TEST/hooks/dispatch-stop.sh               — hook under test
#   $TMPDIR_TEST/skills/dispatch-propagate/scripts/   — fakes for find-pr,
#                                                       apply-office-hours,
#                                                       phase, spawn-router,
#                                                       self-close
#   $TMPDIR_TEST/bin/{gh,git}                         — PATH shims
#   $TMPDIR_TEST/jobs/abcd1234/state.json             — fake CLAUDE_JOB_DIR
#   $TMPDIR_TEST/jobs/abcd1234/phase-completed        — marker (optional)
#   $TMPDIR_TEST/stub/                                — recorded invocations
#                                                       (order.log, *-calls.log,
#                                                       gh-*.log)

stop_setup() {
  TMPDIR_TEST=$(mktemp -d)
  STUB_DIR="$TMPDIR_TEST/stub"
  mkdir -p "$TMPDIR_TEST/hooks" "$TMPDIR_TEST/skills/dispatch-propagate/scripts" \
    "$TMPDIR_TEST/bin" "$STUB_DIR" "$TMPDIR_TEST/jobs/abcd1234"

  cp "$HOOK_SCRIPT_DIR/dispatch-stop.sh" \
    "$TMPDIR_TEST/hooks/dispatch-stop.sh"
  chmod +x "$TMPDIR_TEST/hooks/dispatch-stop.sh"

  # Fake dispatch-find-pr: prints contents of $STUB_DIR/find-pr-output if
  # present, else nothing.
  cat > "$TMPDIR_TEST/skills/dispatch-propagate/scripts/dispatch-find-pr" <<'FAKE'
#!/usr/bin/env bash
[[ -f "$STUB_DIR/find-pr-output" ]] && cat "$STUB_DIR/find-pr-output"
exit 0
FAKE
  chmod +x "$TMPDIR_TEST/skills/dispatch-propagate/scripts/dispatch-find-pr"

  # Fake dispatch-apply-office-hours: log argv to apply-office-hours.log and a
  # "label-apply" marker to order.log (the ordering test asserts spawn runs
  # after the apply). The Stop hook routes every dispatch:office-hours apply
  # through this single write path.
  cat > "$TMPDIR_TEST/skills/dispatch-propagate/scripts/dispatch-apply-office-hours" <<'FAKE'
#!/usr/bin/env bash
echo "$*" >> "$STUB_DIR/apply-office-hours.log"
echo "label-apply" >> "$STUB_DIR/order.log"
exit 0
FAKE
  chmod +x "$TMPDIR_TEST/skills/dispatch-propagate/scripts/dispatch-apply-office-hours"

  # Fake dispatch-phase: prints contents of $STUB_DIR/current-phase.txt if
  # present, else "implement".
  cat > "$TMPDIR_TEST/skills/dispatch-propagate/scripts/dispatch-phase" <<'FAKE'
#!/usr/bin/env bash
if [[ -f "$STUB_DIR/current-phase.txt" ]]; then
  cat "$STUB_DIR/current-phase.txt"
else
  echo "implement"
fi
exit 0
FAKE
  chmod +x "$TMPDIR_TEST/skills/dispatch-propagate/scripts/dispatch-phase"

  # Fake dispatch-spawn-router: log to order.log + spawn-calls.log.
  cat > "$TMPDIR_TEST/skills/dispatch-propagate/scripts/dispatch-spawn-router" <<'FAKE'
#!/usr/bin/env bash
echo "spawn" >> "$STUB_DIR/order.log"
echo "spawn" >> "$STUB_DIR/spawn-calls.log"
echo "spawned"
exit 0
FAKE
  chmod +x "$TMPDIR_TEST/skills/dispatch-propagate/scripts/dispatch-spawn-router"

  # Fake dispatch-self-close: log to order.log + self-close-calls.log.
  cat > "$TMPDIR_TEST/skills/dispatch-propagate/scripts/dispatch-self-close" <<'FAKE'
#!/usr/bin/env bash
echo "self-close" >> "$STUB_DIR/order.log"
echo "self-close" >> "$STUB_DIR/self-close-calls.log"
exit 0
FAKE
  chmod +x "$TMPDIR_TEST/skills/dispatch-propagate/scripts/dispatch-self-close"

  # gh PATH stub. issue-edit-mode "label-missing" models the apply-first /
  # create-on-"not found" idiom — first add-label fails with "not found" stderr,
  # exits 1; once gh-label-create.log exists, the retry succeeds.
  cat > "$TMPDIR_TEST/bin/gh" <<'STUB'
#!/usr/bin/env bash
STUB_DIR="$(cd "$(dirname "$0")/.." && pwd)/stub"
args="$*"
case "$args" in
  pr\ edit\ *--add-label*)
    echo "$args" >> "$STUB_DIR/gh-pr-edit.log"
    ;;
  pr\ edit\ *--remove-label*)
    echo "$args" >> "$STUB_DIR/gh-pr-remove.log"
    ;;
  pr\ view\ *)
    if [[ -f "$STUB_DIR/verify-count.txt" ]]; then
      cat "$STUB_DIR/verify-count.txt"
    else
      echo "0"
    fi
    ;;
  issue\ edit\ *--add-label*)
    mode="ok"
    [[ -f "$STUB_DIR/issue-edit-mode" ]] && mode=$(cat "$STUB_DIR/issue-edit-mode")
    case "$mode" in
      label-missing)
        if [[ -f "$STUB_DIR/gh-label-create.log" ]]; then
          echo "$args" >> "$STUB_DIR/gh-issue-edit.log"
          echo "label-apply" >> "$STUB_DIR/order.log"
        else
          echo "failed to update: 'dispatch:office-hours' not found" >&2
          exit 1
        fi
        ;;
      *)
        echo "$args" >> "$STUB_DIR/gh-issue-edit.log"
        echo "label-apply" >> "$STUB_DIR/order.log"
        ;;
    esac
    ;;
  issue\ edit\ *--remove-label*)
    echo "$args" >> "$STUB_DIR/gh-issue-remove.log"
    ;;
  label\ create\ *)
    echo "$args" >> "$STUB_DIR/gh-label-create.log"
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
STUB_DIR="$(cd "$(dirname "$0")/.." && pwd)/stub"
args="$*"
case "$args" in
  "rev-parse --abbrev-ref HEAD")
    if [[ -f "$STUB_DIR/current-branch.txt" ]]; then
      cat "$STUB_DIR/current-branch.txt"
    else
      echo "main"
    fi
    ;;
  *) echo "git stub: unknown invocation: $args" >&2; exit 1 ;;
esac
STUB
  chmod +x "$TMPDIR_TEST/bin/git"

  export PATH="$TMPDIR_TEST/bin:$PATH"
  export STUB_DIR
}

stop_teardown() {
  rm -rf "$TMPDIR_TEST"
  TMPDIR_TEST=""
  STUB_DIR=""
  export PATH="$SAVED_PATH"
  unset CLAUDE_JOB_DIR
}

# --- Test 1: marker present, phase advanced → strip both, spawn, self-close --

echo "Test: stop hook + marker present + phase advanced → strip PR+issue, spawn, self-close"
stop_setup
echo "123-foo-bar" > "$STUB_DIR/current-branch.txt"
echo "456" > "$STUB_DIR/find-pr-output"
echo "verify" > "$STUB_DIR/current-phase.txt"
echo '{"name":"123-foo-bar"}' > "$TMPDIR_TEST/jobs/abcd1234/state.json"
echo "phase=implement" > "$TMPDIR_TEST/jobs/abcd1234/phase-completed"
export CLAUDE_JOB_DIR="$TMPDIR_TEST/jobs/abcd1234"
"$TMPDIR_TEST/hooks/dispatch-stop.sh" < /dev/null >/dev/null 2>&1
rc=$?
assert_eq "stop advance: hook exits 0" "0" "$rc"
pr_remove_log=$(cat "$STUB_DIR/gh-pr-remove.log" 2>/dev/null || true)
TOTAL=$((TOTAL + 1))
if [[ "$pr_remove_log" == *"pr edit 456 --remove-label dispatch:office-hours"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: stop advance: PR --remove-label invoked"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: stop advance: PR --remove-label invoked"
  echo "    pr-remove-log: $pr_remove_log"
fi
issue_remove_log=$(cat "$STUB_DIR/gh-issue-remove.log" 2>/dev/null || true)
TOTAL=$((TOTAL + 1))
if [[ "$issue_remove_log" == *"issue edit 123 --remove-label dispatch:office-hours"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: stop advance: issue --remove-label invoked"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: stop advance: issue --remove-label invoked"
  echo "    issue-remove-log: $issue_remove_log"
fi
spawn_calls=$(wc -l < "$STUB_DIR/spawn-calls.log" 2>/dev/null || echo 0)
assert_eq "stop advance: spawn invoked exactly once" "1" "$spawn_calls"
self_close_calls=$(wc -l < "$STUB_DIR/self-close-calls.log" 2>/dev/null || echo 0)
assert_eq "stop advance: self-close invoked exactly once" "1" "$self_close_calls"
TOTAL=$((TOTAL + 1))
if [[ ! -e "$STUB_DIR/gh-pr-edit.log" && ! -e "$STUB_DIR/gh-issue-edit.log" ]]; then
  PASS=$((PASS + 1)); echo "  PASS: stop advance: no add-label calls were made"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: stop advance: no add-label calls were made"
fi
stop_teardown

# --- Test 2: marker present, same phase, verify, counter < 3 → spawn only ----

echo "Test: stop hook + same phase + verify + counter<3 → spawn only (silent variance)"
stop_setup
echo "123-foo-bar" > "$STUB_DIR/current-branch.txt"
echo "456" > "$STUB_DIR/find-pr-output"
echo "verify" > "$STUB_DIR/current-phase.txt"
echo "1" > "$STUB_DIR/verify-count.txt"
echo '{"name":"123-foo-bar"}' > "$TMPDIR_TEST/jobs/abcd1234/state.json"
echo "phase=verify" > "$TMPDIR_TEST/jobs/abcd1234/phase-completed"
export CLAUDE_JOB_DIR="$TMPDIR_TEST/jobs/abcd1234"
"$TMPDIR_TEST/hooks/dispatch-stop.sh" < /dev/null >/dev/null 2>&1
rc=$?
assert_eq "stop verify-retry: hook exits 0" "0" "$rc"
TOTAL=$((TOTAL + 1))
if [[ ! -e "$STUB_DIR/gh-pr-edit.log" && ! -e "$STUB_DIR/gh-issue-edit.log" \
   && ! -e "$STUB_DIR/gh-pr-remove.log" && ! -e "$STUB_DIR/gh-issue-remove.log" ]]; then
  PASS=$((PASS + 1)); echo "  PASS: stop verify-retry: no label add or remove invoked"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: stop verify-retry: no label add or remove invoked"
fi
TOTAL=$((TOTAL + 1))
if [[ ! -e "$STUB_DIR/self-close-calls.log" ]]; then
  PASS=$((PASS + 1)); echo "  PASS: stop verify-retry: self-close not invoked"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: stop verify-retry: self-close not invoked"
fi
spawn_calls=$(wc -l < "$STUB_DIR/spawn-calls.log" 2>/dev/null || echo 0)
assert_eq "stop verify-retry: spawn invoked exactly once" "1" "$spawn_calls"
stop_teardown

# --- Test 3: marker present, same phase, verify, counter >= 3 → branch D -----

echo "Test: stop hook + same phase + verify + counter>=3 → apply label to issue, spawn"
stop_setup
echo "123-foo-bar" > "$STUB_DIR/current-branch.txt"
echo "456" > "$STUB_DIR/find-pr-output"
echo "verify" > "$STUB_DIR/current-phase.txt"
echo "3" > "$STUB_DIR/verify-count.txt"
echo '{"name":"123-foo-bar"}' > "$TMPDIR_TEST/jobs/abcd1234/state.json"
echo "phase=verify" > "$TMPDIR_TEST/jobs/abcd1234/phase-completed"
export CLAUDE_JOB_DIR="$TMPDIR_TEST/jobs/abcd1234"
"$TMPDIR_TEST/hooks/dispatch-stop.sh" < /dev/null >/dev/null 2>&1
rc=$?
assert_eq "stop verify-exhausted: hook exits 0" "0" "$rc"
apply_log=$(cat "$STUB_DIR/apply-office-hours.log" 2>/dev/null || true)
apply_issue=$(printf '%s' "$apply_log" | awk '{print $1}')
apply_reason=$(printf '%s' "$apply_log" | cut -d' ' -f2-)
TOTAL=$((TOTAL + 1))
if [[ "$apply_issue" == "123" && -n "$apply_reason" ]]; then
  PASS=$((PASS + 1)); echo "  PASS: stop verify-exhausted: dispatch-apply-office-hours invoked with issue 123 + non-empty reason"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: stop verify-exhausted: dispatch-apply-office-hours invoked with issue 123 + non-empty reason"
  echo "    apply-log: $apply_log"
fi
TOTAL=$((TOTAL + 1))
if [[ ! -e "$STUB_DIR/gh-pr-edit.log" ]]; then
  PASS=$((PASS + 1)); echo "  PASS: stop verify-exhausted: PR --add-label not invoked"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: stop verify-exhausted: PR --add-label not invoked"
fi
spawn_calls=$(wc -l < "$STUB_DIR/spawn-calls.log" 2>/dev/null || echo 0)
assert_eq "stop verify-exhausted: spawn invoked exactly once" "1" "$spawn_calls"
TOTAL=$((TOTAL + 1))
if [[ ! -e "$STUB_DIR/self-close-calls.log" ]]; then
  PASS=$((PASS + 1)); echo "  PASS: stop verify-exhausted: self-close not invoked"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: stop verify-exhausted: self-close not invoked"
fi
stop_teardown

# --- Test 4: marker present, same phase, non-verify → branch D ---------------

echo "Test: stop hook + same phase + non-verify → apply label to issue, spawn"
stop_setup
echo "123-foo-bar" > "$STUB_DIR/current-branch.txt"
echo "456" > "$STUB_DIR/find-pr-output"
echo "qa" > "$STUB_DIR/current-phase.txt"
echo '{"name":"123-foo-bar"}' > "$TMPDIR_TEST/jobs/abcd1234/state.json"
echo "phase=qa" > "$TMPDIR_TEST/jobs/abcd1234/phase-completed"
export CLAUDE_JOB_DIR="$TMPDIR_TEST/jobs/abcd1234"
"$TMPDIR_TEST/hooks/dispatch-stop.sh" < /dev/null >/dev/null 2>&1
rc=$?
assert_eq "stop same-phase non-verify: hook exits 0" "0" "$rc"
apply_log=$(cat "$STUB_DIR/apply-office-hours.log" 2>/dev/null || true)
apply_issue=$(printf '%s' "$apply_log" | awk '{print $1}')
apply_reason=$(printf '%s' "$apply_log" | cut -d' ' -f2-)
TOTAL=$((TOTAL + 1))
if [[ "$apply_issue" == "123" && -n "$apply_reason" ]]; then
  PASS=$((PASS + 1)); echo "  PASS: stop same-phase non-verify: dispatch-apply-office-hours invoked with issue 123 + non-empty reason"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: stop same-phase non-verify: dispatch-apply-office-hours invoked with issue 123 + non-empty reason"
  echo "    apply-log: $apply_log"
fi
TOTAL=$((TOTAL + 1))
if [[ ! -e "$STUB_DIR/gh-pr-edit.log" ]]; then
  PASS=$((PASS + 1)); echo "  PASS: stop same-phase non-verify: PR --add-label not invoked"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: stop same-phase non-verify: PR --add-label not invoked"
fi
spawn_calls=$(wc -l < "$STUB_DIR/spawn-calls.log" 2>/dev/null || echo 0)
assert_eq "stop same-phase non-verify: spawn invoked exactly once" "1" "$spawn_calls"
TOTAL=$((TOTAL + 1))
if [[ ! -e "$STUB_DIR/self-close-calls.log" ]]; then
  PASS=$((PASS + 1)); echo "  PASS: stop same-phase non-verify: self-close not invoked"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: stop same-phase non-verify: self-close not invoked"
fi
stop_teardown

# --- Test 5: marker absent → apply label to issue, spawn ---------------------

echo "Test: stop hook + marker absent → apply label to issue, spawn"
stop_setup
echo "123-foo-bar" > "$STUB_DIR/current-branch.txt"
echo "implement" > "$STUB_DIR/current-phase.txt"
# No find-pr-output → implement-phase, no PR yet.
echo '{"name":"123-foo-bar"}' > "$TMPDIR_TEST/jobs/abcd1234/state.json"
# No phase-completed marker.
export CLAUDE_JOB_DIR="$TMPDIR_TEST/jobs/abcd1234"
"$TMPDIR_TEST/hooks/dispatch-stop.sh" < /dev/null >/dev/null 2>&1
rc=$?
assert_eq "stop marker-absent: hook exits 0" "0" "$rc"
apply_log=$(cat "$STUB_DIR/apply-office-hours.log" 2>/dev/null || true)
apply_issue=$(printf '%s' "$apply_log" | awk '{print $1}')
apply_reason=$(printf '%s' "$apply_log" | cut -d' ' -f2-)
TOTAL=$((TOTAL + 1))
if [[ "$apply_issue" == "123" && -n "$apply_reason" ]]; then
  PASS=$((PASS + 1)); echo "  PASS: stop marker-absent: dispatch-apply-office-hours invoked with issue 123 + non-empty reason"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: stop marker-absent: dispatch-apply-office-hours invoked with issue 123 + non-empty reason"
  echo "    apply-log: $apply_log"
fi
TOTAL=$((TOTAL + 1))
if [[ ! -e "$STUB_DIR/gh-pr-edit.log" && ! -e "$STUB_DIR/gh-pr-remove.log" \
   && ! -e "$STUB_DIR/gh-issue-remove.log" ]]; then
  PASS=$((PASS + 1)); echo "  PASS: stop marker-absent: no PR calls and no remove calls"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: stop marker-absent: no PR calls and no remove calls"
fi
spawn_calls=$(wc -l < "$STUB_DIR/spawn-calls.log" 2>/dev/null || echo 0)
assert_eq "stop marker-absent: spawn invoked exactly once" "1" "$spawn_calls"
TOTAL=$((TOTAL + 1))
if [[ ! -e "$STUB_DIR/self-close-calls.log" ]]; then
  PASS=$((PASS + 1)); echo "  PASS: stop marker-absent: self-close not invoked"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: stop marker-absent: self-close not invoked"
fi
stop_teardown

# --- Test 5b: marker absent + CURRENT_PHASE waiting → spawn only, no office-hours

echo "Test: stop hook + marker absent + phase waiting → spawn only, no office-hours (router-defer, not worker-actionable)"
stop_setup
echo "123-foo-bar" > "$STUB_DIR/current-branch.txt"
echo "456" > "$STUB_DIR/find-pr-output"
echo "waiting" > "$STUB_DIR/current-phase.txt"
echo '{"name":"123-foo-bar"}' > "$TMPDIR_TEST/jobs/abcd1234/state.json"
# No phase-completed marker → branch A; CURRENT_PHASE waiting → exemption.
export CLAUDE_JOB_DIR="$TMPDIR_TEST/jobs/abcd1234"
"$TMPDIR_TEST/hooks/dispatch-stop.sh" < /dev/null >/dev/null 2>&1
rc=$?
assert_eq "stop waiting-exempt: hook exits 0" "0" "$rc"
TOTAL=$((TOTAL + 1))
if [[ ! -e "$STUB_DIR/apply-office-hours.log" && ! -e "$STUB_DIR/gh-pr-edit.log" \
   && ! -e "$STUB_DIR/gh-issue-edit.log" ]]; then
  PASS=$((PASS + 1)); echo "  PASS: stop waiting-exempt: no office-hours apply (no add-label)"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: stop waiting-exempt: no office-hours apply (no add-label)"
  echo "    apply-log: $(cat "$STUB_DIR/apply-office-hours.log" 2>/dev/null || true)"
fi
spawn_calls=$(wc -l < "$STUB_DIR/spawn-calls.log" 2>/dev/null || echo 0)
assert_eq "stop waiting-exempt: spawn invoked exactly once" "1" "$spawn_calls"
TOTAL=$((TOTAL + 1))
if [[ ! -e "$STUB_DIR/self-close-calls.log" ]]; then
  PASS=$((PASS + 1)); echo "  PASS: stop waiting-exempt: self-close not invoked"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: stop waiting-exempt: self-close not invoked"
fi
stop_teardown

# --- Test 6: CLAUDE_JOB_DIR unset → no-op ------------------------------------

echo "Test: stop hook + CLAUDE_JOB_DIR unset → no-op (interactive session excluded)"
stop_setup
echo "123-foo-bar" > "$STUB_DIR/current-branch.txt"
unset CLAUDE_JOB_DIR
"$TMPDIR_TEST/hooks/dispatch-stop.sh" < /dev/null >/dev/null 2>&1
rc=$?
assert_eq "stop no-job-dir: hook exits 0" "0" "$rc"
TOTAL=$((TOTAL + 1))
if [[ ! -e "$STUB_DIR/gh-pr-edit.log" && ! -e "$STUB_DIR/gh-issue-edit.log" \
   && ! -e "$STUB_DIR/gh-pr-remove.log" && ! -e "$STUB_DIR/gh-issue-remove.log" ]]; then
  PASS=$((PASS + 1)); echo "  PASS: stop no-job-dir: no gh calls invoked"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: stop no-job-dir: no gh calls invoked"
fi
TOTAL=$((TOTAL + 1))
if [[ ! -e "$STUB_DIR/spawn-calls.log" ]]; then
  PASS=$((PASS + 1)); echo "  PASS: stop no-job-dir: spawn not invoked"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: stop no-job-dir: spawn not invoked"
fi
TOTAL=$((TOTAL + 1))
if [[ ! -e "$STUB_DIR/self-close-calls.log" ]]; then
  PASS=$((PASS + 1)); echo "  PASS: stop no-job-dir: self-close not invoked"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: stop no-job-dir: self-close not invoked"
fi
stop_teardown

# --- Test 7: router name discriminator → no-op -------------------------------

echo "Test: stop hook + state.json name 'dispatch-<id>' (router) → no-op"
stop_setup
echo "123-foo-bar" > "$STUB_DIR/current-branch.txt"
echo "456" > "$STUB_DIR/find-pr-output"
echo '{"name":"dispatch-test001"}' > "$TMPDIR_TEST/jobs/abcd1234/state.json"
echo "phase=implement" > "$TMPDIR_TEST/jobs/abcd1234/phase-completed"
export CLAUDE_JOB_DIR="$TMPDIR_TEST/jobs/abcd1234"
"$TMPDIR_TEST/hooks/dispatch-stop.sh" < /dev/null >/dev/null 2>&1
rc=$?
assert_eq "stop router-name: hook exits 0" "0" "$rc"
TOTAL=$((TOTAL + 1))
if [[ ! -e "$STUB_DIR/gh-pr-edit.log" && ! -e "$STUB_DIR/gh-issue-edit.log" \
   && ! -e "$STUB_DIR/gh-pr-remove.log" && ! -e "$STUB_DIR/gh-issue-remove.log" ]]; then
  PASS=$((PASS + 1)); echo "  PASS: stop router-name: no gh calls invoked"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: stop router-name: no gh calls invoked"
fi
TOTAL=$((TOTAL + 1))
if [[ ! -e "$STUB_DIR/spawn-calls.log" ]]; then
  PASS=$((PASS + 1)); echo "  PASS: stop router-name: spawn not invoked"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: stop router-name: spawn not invoked"
fi
TOTAL=$((TOTAL + 1))
if [[ ! -e "$STUB_DIR/self-close-calls.log" ]]; then
  PASS=$((PASS + 1)); echo "  PASS: stop router-name: self-close not invoked"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: stop router-name: self-close not invoked"
fi
stop_teardown

# --- Test 8: $CLAUDE_JOB_DIR/office-hours-reason overrides the branch default -

echo "Test: stop hook branch A + office-hours-reason file present → its contents pass as the reason"
stop_setup
echo "123-foo-bar" > "$STUB_DIR/current-branch.txt"
echo "implement" > "$STUB_DIR/current-phase.txt"
echo '{"name":"123-foo-bar"}' > "$TMPDIR_TEST/jobs/abcd1234/state.json"
# No phase-completed marker → branch A. Enrichment-hook reason override present.
printf '%s' "enriched: tool denied by policy" > "$TMPDIR_TEST/jobs/abcd1234/office-hours-reason"
export CLAUDE_JOB_DIR="$TMPDIR_TEST/jobs/abcd1234"
"$TMPDIR_TEST/hooks/dispatch-stop.sh" < /dev/null >/dev/null 2>&1
rc=$?
assert_eq "stop reason-override: hook exits 0" "0" "$rc"
apply_log=$(cat "$STUB_DIR/apply-office-hours.log" 2>/dev/null || true)
apply_issue=$(printf '%s' "$apply_log" | awk '{print $1}')
apply_reason=$(printf '%s' "$apply_log" | cut -d' ' -f2-)
TOTAL=$((TOTAL + 1))
if [[ "$apply_issue" == "123" && "$apply_reason" == "enriched: tool denied by policy" ]]; then
  PASS=$((PASS + 1)); echo "  PASS: stop reason-override: office-hours-reason contents passed as the reason"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: stop reason-override: office-hours-reason contents passed as the reason"
  echo "    apply-log: $apply_log"
fi
spawn_calls=$(wc -l < "$STUB_DIR/spawn-calls.log" 2>/dev/null || echo 0)
assert_eq "stop reason-override: spawn invoked exactly once" "1" "$spawn_calls"
stop_teardown

# --- Test 9: spawn-last ordering (branch D) ----------------------------------

echo "Test: stop hook branch D → spawn is invoked AFTER label apply"
stop_setup
echo "123-foo-bar" > "$STUB_DIR/current-branch.txt"
echo "456" > "$STUB_DIR/find-pr-output"
echo "qa" > "$STUB_DIR/current-phase.txt"
echo '{"name":"123-foo-bar"}' > "$TMPDIR_TEST/jobs/abcd1234/state.json"
echo "phase=qa" > "$TMPDIR_TEST/jobs/abcd1234/phase-completed"
export CLAUDE_JOB_DIR="$TMPDIR_TEST/jobs/abcd1234"
"$TMPDIR_TEST/hooks/dispatch-stop.sh" < /dev/null >/dev/null 2>&1
rc=$?
assert_eq "stop ordering: hook exits 0" "0" "$rc"
order_log=$(cat "$STUB_DIR/order.log" 2>/dev/null || true)
label_line=$(grep -n '^label-apply$' "$STUB_DIR/order.log" 2>/dev/null | head -n1 | cut -d: -f1)
spawn_line=$(grep -n '^spawn$' "$STUB_DIR/order.log" 2>/dev/null | head -n1 | cut -d: -f1)
TOTAL=$((TOTAL + 1))
if [[ -n "$label_line" && -n "$spawn_line" && "$spawn_line" -gt "$label_line" ]]; then
  PASS=$((PASS + 1)); echo "  PASS: stop ordering: spawn appears after label-apply"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: stop ordering: spawn appears after label-apply"
  echo "    order.log:"
  echo "$order_log" | sed 's/^/      /'
fi
stop_teardown

# --- Test 10: empty CURRENT_PHASE (dispatch-phase failure) → Branch D, no self-close --

echo "Test: stop hook + marker present + dispatch-phase fails (empty CURRENT_PHASE) → Branch D (park), no self-close"
stop_setup
echo "123-foo-bar" > "$STUB_DIR/current-branch.txt"
echo "456" > "$STUB_DIR/find-pr-output"
# Simulate dispatch-phase failure by making the fake return nothing (exit 1).
cat > "$TMPDIR_TEST/skills/dispatch-propagate/scripts/dispatch-phase" <<'FAKE'
#!/usr/bin/env bash
exit 1
FAKE
chmod +x "$TMPDIR_TEST/skills/dispatch-propagate/scripts/dispatch-phase"
echo '{"name":"123-foo-bar"}' > "$TMPDIR_TEST/jobs/abcd1234/state.json"
echo "phase=code-review" > "$TMPDIR_TEST/jobs/abcd1234/phase-completed"
export CLAUDE_JOB_DIR="$TMPDIR_TEST/jobs/abcd1234"
"$TMPDIR_TEST/hooks/dispatch-stop.sh" < /dev/null >/dev/null 2>&1
rc=$?
assert_eq "stop empty-phase: hook exits 0" "0" "$rc"
apply_log=$(cat "$STUB_DIR/apply-office-hours.log" 2>/dev/null || true)
apply_issue=$(printf '%s' "$apply_log" | awk '{print $1}')
apply_reason=$(printf '%s' "$apply_log" | cut -d' ' -f2-)
TOTAL=$((TOTAL + 1))
if [[ "$apply_issue" == "123" && -n "$apply_reason" ]]; then
  PASS=$((PASS + 1)); echo "  PASS: stop empty-phase: office-hours applied to issue (Branch D, not false Branch B)"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: stop empty-phase: office-hours applied to issue (Branch D, not false Branch B)"
  echo "    apply-log: $apply_log"
fi
TOTAL=$((TOTAL + 1))
if [[ ! -e "$STUB_DIR/self-close-calls.log" ]]; then
  PASS=$((PASS + 1)); echo "  PASS: stop empty-phase: self-close NOT invoked (no false advance)"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: stop empty-phase: self-close NOT invoked (no false advance)"
fi
TOTAL=$((TOTAL + 1))
if [[ ! -e "$STUB_DIR/gh-pr-remove.log" && ! -e "$STUB_DIR/gh-issue-remove.log" ]]; then
  PASS=$((PASS + 1)); echo "  PASS: stop empty-phase: no remove-label calls (no strip)"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: stop empty-phase: no remove-label calls (no strip)"
fi
spawn_calls=$(wc -l < "$STUB_DIR/spawn-calls.log" 2>/dev/null || echo 0)
assert_eq "stop empty-phase: spawn invoked exactly once" "1" "$spawn_calls"
stop_teardown

# --- Test 11: unrecognized MARKER_PHASE value → treated as absent (Branch A) --

echo "Test: stop hook + marker present with unrecognized phase value → Branch A (treat as absent), no self-close"
stop_setup
echo "123-foo-bar" > "$STUB_DIR/current-branch.txt"
echo "implement" > "$STUB_DIR/current-phase.txt"
echo '{"name":"123-foo-bar"}' > "$TMPDIR_TEST/jobs/abcd1234/state.json"
# A value outside the known phase set — would otherwise drive Branch B's
# self-close since "garbage-injection" != "implement".
echo "phase=garbage-injection" > "$TMPDIR_TEST/jobs/abcd1234/phase-completed"
export CLAUDE_JOB_DIR="$TMPDIR_TEST/jobs/abcd1234"
"$TMPDIR_TEST/hooks/dispatch-stop.sh" < /dev/null >/dev/null 2>&1
rc=$?
assert_eq "stop unknown-phase: hook exits 0" "0" "$rc"
apply_log=$(cat "$STUB_DIR/apply-office-hours.log" 2>/dev/null || true)
apply_issue=$(printf '%s' "$apply_log" | awk '{print $1}')
apply_reason=$(printf '%s' "$apply_log" | cut -d' ' -f2-)
TOTAL=$((TOTAL + 1))
if [[ "$apply_issue" == "123" && -n "$apply_reason" ]]; then
  PASS=$((PASS + 1)); echo "  PASS: stop unknown-phase: office-hours applied to issue (Branch A, not false Branch B)"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: stop unknown-phase: office-hours applied to issue (Branch A, not false Branch B)"
  echo "    apply-log: $apply_log"
fi
TOTAL=$((TOTAL + 1))
if [[ ! -e "$STUB_DIR/self-close-calls.log" ]]; then
  PASS=$((PASS + 1)); echo "  PASS: stop unknown-phase: self-close NOT invoked (corrupt marker doesn't drive advance)"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: stop unknown-phase: self-close NOT invoked (corrupt marker doesn't drive advance)"
fi
TOTAL=$((TOTAL + 1))
if [[ ! -e "$STUB_DIR/gh-pr-remove.log" && ! -e "$STUB_DIR/gh-issue-remove.log" ]]; then
  PASS=$((PASS + 1)); echo "  PASS: stop unknown-phase: no remove-label calls (no strip)"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: stop unknown-phase: no remove-label calls (no strip)"
fi
spawn_calls=$(wc -l < "$STUB_DIR/spawn-calls.log" 2>/dev/null || echo 0)
assert_eq "stop unknown-phase: spawn invoked exactly once" "1" "$spawn_calls"
stop_teardown

# --- Test 12: wrong-cwd regression — JOB_NAME drives ISSUE_NUM, not branch ---

echo "Test: stop hook + branch=main (wrong-cwd) + JOB_NAME=123-foo-bar → Branch B: spawn + self-close"
stop_setup
# Simulate the wrong-cwd bug scenario: git rev-parse returns "main" (the spawn
# cwd), not the target worktree branch.  With the fix, ISSUE_NUM comes from
# JOB_NAME, so this value is irrelevant and the hook must NOT exit early.
echo "main" > "$STUB_DIR/current-branch.txt"
echo "456" > "$STUB_DIR/find-pr-output"
echo "verify" > "$STUB_DIR/current-phase.txt"
echo '{"name":"123-foo-bar"}' > "$TMPDIR_TEST/jobs/abcd1234/state.json"
echo "phase=implement" > "$TMPDIR_TEST/jobs/abcd1234/phase-completed"
export CLAUDE_JOB_DIR="$TMPDIR_TEST/jobs/abcd1234"
"$TMPDIR_TEST/hooks/dispatch-stop.sh" < /dev/null >/dev/null 2>&1
rc=$?
assert_eq "stop wrong-cwd: hook exits 0" "0" "$rc"
spawn_calls=$(wc -l < "$STUB_DIR/spawn-calls.log" 2>/dev/null || echo 0)
assert_eq "stop wrong-cwd: spawn invoked exactly once" "1" "$spawn_calls"
self_close_calls=$(wc -l < "$STUB_DIR/self-close-calls.log" 2>/dev/null || echo 0)
assert_eq "stop wrong-cwd: self-close invoked exactly once" "1" "$self_close_calls"
stop_teardown

# ============================================================================
# ensure_deps (lib.sh) retry tests
# ============================================================================
echo ""
echo "=== ensure_deps retry ==="

# These tests use a fresh TMPDIR_TEST with a STUB_DIR holding npm and sleep
# shims on PATH. lib.sh is sourced from SCRIPT_DIR (not the TMPDIR_TEST copy)
# so ensure_deps resolves directly. REPO_ROOT is a fresh tmpdir with no
# node_modules — forcing the install branch every time.

# 1. ensure_deps retries and succeeds on attempt 3.
echo "Test: ensure_deps retries and succeeds on attempt 3"
TMPDIR_TEST=$(mktemp -d)
STUB_DIR="$TMPDIR_TEST/stub"
mkdir -p "$STUB_DIR"
REPO_ROOT_TEST=$(mktemp -d)

# npm stub: fail on calls 1 and 2; succeed on call 3.
cat > "$STUB_DIR/npm" <<'STUB'
#!/usr/bin/env bash
STUB_DIR="$(cd "$(dirname "$0")" && pwd)"
count_file="$STUB_DIR/npm-count"
count=0
[ -f "$count_file" ] && count=$(cat "$count_file")
count=$((count + 1))
echo "$count" > "$count_file"
if [ "$count" -lt 3 ]; then
  exit 1
fi
exit 0
STUB
chmod +x "$STUB_DIR/npm"

# sleep stub: no-op.
cat > "$STUB_DIR/sleep" <<'STUB'
#!/usr/bin/env bash
exit 0
STUB
chmod +x "$STUB_DIR/sleep"

export PATH="$STUB_DIR:$SAVED_PATH"
rc=0
( export REPO_ROOT="$REPO_ROOT_TEST"; source "$SCRIPT_DIR/lib.sh"; ensure_deps ) || rc=$?
assert_eq "ensure_deps succeeds on attempt 3 (exit code)" "0" "$rc"
npm_count=0
[ -f "$STUB_DIR/npm-count" ] && npm_count=$(cat "$STUB_DIR/npm-count")
assert_eq "ensure_deps called npm exactly 3 times" "3" "$npm_count"

rm -rf "$TMPDIR_TEST" "$REPO_ROOT_TEST"
TMPDIR_TEST=""
STUB_DIR=""
export PATH="$SAVED_PATH"

# 2. ensure_deps fails after exhausting all 3 attempts.
echo "Test: ensure_deps fails after exhausting all 3 attempts"
TMPDIR_TEST=$(mktemp -d)
STUB_DIR="$TMPDIR_TEST/stub"
mkdir -p "$STUB_DIR"
REPO_ROOT_TEST=$(mktemp -d)

# npm stub: always fails.
cat > "$STUB_DIR/npm" <<'STUB'
#!/usr/bin/env bash
STUB_DIR="$(cd "$(dirname "$0")" && pwd)"
count_file="$STUB_DIR/npm-count"
count=0
[ -f "$count_file" ] && count=$(cat "$count_file")
count=$((count + 1))
echo "$count" > "$count_file"
exit 1
STUB
chmod +x "$STUB_DIR/npm"

# sleep stub: no-op.
cat > "$STUB_DIR/sleep" <<'STUB'
#!/usr/bin/env bash
exit 0
STUB
chmod +x "$STUB_DIR/sleep"

export PATH="$STUB_DIR:$SAVED_PATH"
rc=0
( export REPO_ROOT="$REPO_ROOT_TEST"; source "$SCRIPT_DIR/lib.sh"; ensure_deps ) || rc=$?
TOTAL=$((TOTAL + 1))
if [ "$rc" -ne 0 ]; then
  PASS=$((PASS + 1))
  echo "  PASS: ensure_deps returns non-zero after 3 failed attempts"
else
  FAIL=$((FAIL + 1))
  echo "  FAIL: ensure_deps returns non-zero after 3 failed attempts"
  echo "    expected non-zero, got 0"
fi
npm_count=0
[ -f "$STUB_DIR/npm-count" ] && npm_count=$(cat "$STUB_DIR/npm-count")
assert_eq "ensure_deps tried npm exactly 3 times before giving up" "3" "$npm_count"

rm -rf "$TMPDIR_TEST" "$REPO_ROOT_TEST"
TMPDIR_TEST=""
STUB_DIR=""
export PATH="$SAVED_PATH"

# ============================================================================
# /dispatch-propagate router smoke (Step 5 create + Step 6 spawn)
# ============================================================================
# Pin the shell sequence documented in /dispatch-propagate SKILL.md Step 5's `create`
# branch and Step 6, by faking every external binary the sequence calls and
# asserting each fake was invoked with the expected arguments. This is a
# documentation-pinning test, not a behaviour test of the router itself: it
# catches the case where someone edits Step 5/6 in SKILL.md and forgets to
# update the spawn call, or where the documented shell sequence drifts from
# what the script expects.
#
# Tested sequence (matches /dispatch-propagate SKILL.md Step 5 create + Step 6):
#   GIT_COMMON_DIR=...                                       # faked git
#   PROJECT_ROOT=...
#   WORKTREE_PATH="$PROJECT_ROOT/worktrees/<branch>"
#   git worktree add -b <branch> "$WORKTREE_PATH" origin/main
#   direnv allow "$WORKTREE_PATH"
#   direnv exec "$WORKTREE_PATH" true
#   (cd "$WORKTREE_PATH" && sync-issue-context <N>)
#   dispatch-finalize-selection "$WORKTREE_PATH"   # cds in, writes marker, releases lock
#   dispatch-spawn-worker <N> "$WORKTREE_PATH"
echo ""
echo "=== /dispatch-propagate router smoke (Step 5 create + Step 6 spawn) ==="

router_smoke_setup() {
  TMPDIR_TEST=$(mktemp -d)
  mkdir -p "$TMPDIR_TEST/bin" "$TMPDIR_TEST/logs"

  # Faked PROJECT_ROOT — mock the layout `git rev-parse --git-common-dir`
  # would return (parent is the project root by the same idiom dispatch-spawn-router /
  # dispatch-acquire-lock use).
  mkdir -p "$TMPDIR_TEST/project/.bare" "$TMPDIR_TEST/project/worktrees"

  # Fake `git` — only supports the two subcommands the Step 5 create sequence
  # calls: `rev-parse --git-common-dir` (used for resolving PROJECT_ROOT) and
  # `worktree add -b <branch> <path> origin/main`. Each invocation appends its
  # full argv to a per-binary log. The rev-parse path returns the faked
  # .bare/ absolute path.
  cat > "$TMPDIR_TEST/bin/git" <<STUB
#!/usr/bin/env bash
echo "\$*" >> "$TMPDIR_TEST/logs/git.log"
case "\$*" in
  "rev-parse --path-format=absolute --git-common-dir")
    echo "$TMPDIR_TEST/project/.bare"
    ;;
  "worktree add -b "*)
    # No-op; the smoke test does not need a real worktree on disk.
    ;;
  *)
    echo "fake git: unexpected invocation: \$*" >&2
    exit 99
    ;;
esac
STUB
  chmod +x "$TMPDIR_TEST/bin/git"

  # Fake `direnv` — record its argv only.
  cat > "$TMPDIR_TEST/bin/direnv" <<STUB
#!/usr/bin/env bash
echo "\$*" >> "$TMPDIR_TEST/logs/direnv.log"
STUB
  chmod +x "$TMPDIR_TEST/bin/direnv"

  # Fake `sync-issue-context` — record cwd + argv.
  cat > "$TMPDIR_TEST/bin/sync-issue-context" <<STUB
#!/usr/bin/env bash
echo "cwd=\$PWD argv=\$*" >> "$TMPDIR_TEST/logs/sync-issue-context.log"
STUB
  chmod +x "$TMPDIR_TEST/bin/sync-issue-context"

  # Fake `dispatch-spawn-worker` — record argv only.
  cat > "$TMPDIR_TEST/bin/dispatch-spawn-worker" <<STUB
#!/usr/bin/env bash
echo "\$*" >> "$TMPDIR_TEST/logs/dispatch-spawn-worker.log"
echo spawned
STUB
  chmod +x "$TMPDIR_TEST/bin/dispatch-spawn-worker"

  export PATH="$TMPDIR_TEST/bin:$SAVED_PATH"
}

router_smoke_teardown() {
  rm -rf "$TMPDIR_TEST"
  TMPDIR_TEST=""
  export PATH="$SAVED_PATH"
}

echo "Test: Step 5 create + Step 6 sequence invokes git, direnv, sync, finalize-selection, and spawn-worker with the right args"
router_smoke_setup

# Run the documented shell sequence inline. The variable names match SKILL.md.
BRANCH="839-test"
ISSUE_NUM="839"
GIT_COMMON_DIR=$(git rev-parse --path-format=absolute --git-common-dir)
PROJECT_ROOT=$(dirname "$GIT_COMMON_DIR")
WORKTREE_PATH="$PROJECT_ROOT/worktrees/$BRANCH"
# The fake `git worktree add` does not actually create the directory, so make
# it here so the subshell `cd "$WORKTREE_PATH"` for sync-issue-context and the
# dispatch-finalize-selection wrapper's marker write succeed.
mkdir -p "$WORKTREE_PATH"

# Stub the router-cwd context so dispatch-finalize-selection's --release call
# resolves a lock file we control rather than the real repo's lock, succeeds
# strict-self-release (no foreign holder, no `claude agents --json` query),
# and we can assert the regression: the marker does NOT land in the router's
# starting cwd (the cwd-vs-target asymmetry that fixes #896).
ROUTER_CWD="$TMPDIR_TEST/router-cwd"
mkdir -p "$ROUTER_CWD"
export DISPATCH_LOCK_FILE="$TMPDIR_TEST/dispatch.lock"
export CLAUDE_CODE_SESSION_ID="router-smoke-session"
# Pre-fill the lock with our own sessionId so `--release` is a strict self-
# release (truncates the file and prints `released`).
echo "$CLAUDE_CODE_SESSION_ID" > "$DISPATCH_LOCK_FILE"

# cd into the router-equivalent cwd so the regression assertion below is
# meaningful — finalize-selection must NOT write a marker here.
SMOKE_ORIG_PWD="$PWD"
cd "$ROUTER_CWD"

git worktree add -b "$BRANCH" "$WORKTREE_PATH" origin/main
direnv allow "$WORKTREE_PATH"
direnv exec "$WORKTREE_PATH" true
(cd "$WORKTREE_PATH" && sync-issue-context "$ISSUE_NUM")
"$SCRIPT_DIR/dispatch-finalize-selection" "$WORKTREE_PATH"
dispatch-spawn-worker "$ISSUE_NUM" "$WORKTREE_PATH"

# Restore cwd so the rest of the test file is unaffected.
cd "$SMOKE_ORIG_PWD"

# Assertions: each fake binary's log captures one expected invocation.
assert_eq "git worktree add args" \
  "worktree add -b 839-test $WORKTREE_PATH origin/main" \
  "$(grep '^worktree add' "$TMPDIR_TEST/logs/git.log")"
assert_eq "direnv allow args" \
  "allow $WORKTREE_PATH" \
  "$(grep '^allow' "$TMPDIR_TEST/logs/direnv.log")"
assert_eq "direnv exec args" \
  "exec $WORKTREE_PATH true" \
  "$(grep '^exec' "$TMPDIR_TEST/logs/direnv.log")"
assert_eq "recovery marker created in target worktree" "1" \
  "$([ -f "$WORKTREE_PATH/tmp/dispatch-worktree" ] && echo 1 || echo 0)"
# Regression for #896: the wrapper must not leak the marker into the
# router's starting cwd.
assert_eq "no marker leaked into router cwd" "0" \
  "$([ -f "$ROUTER_CWD/tmp/dispatch-worktree" ] && echo 1 || echo 0)"
# The wrapper's exec dispatch-acquire-lock --release should have truncated
# the lock file (strict self-release).
assert_eq "lock released by finalize-selection" "" \
  "$(cat "$DISPATCH_LOCK_FILE")"
assert_eq "sync-issue-context cwd + arg" \
  "cwd=$WORKTREE_PATH argv=839" \
  "$(cat "$TMPDIR_TEST/logs/sync-issue-context.log")"
assert_eq "dispatch-spawn-worker args" \
  "839 $WORKTREE_PATH" \
  "$(cat "$TMPDIR_TEST/logs/dispatch-spawn-worker.log")"

unset DISPATCH_LOCK_FILE CLAUDE_CODE_SESSION_ID
router_smoke_teardown

# ============================================================================
# dispatch-handoff tests (#824)
# ============================================================================
echo "=== dispatch-handoff ==="

HANDOFF_SCRIPT="$SCRIPT_DIR/dispatch-handoff"

# Minimal per-test harness for handoff: does not need the full setup/teardown
# (no gh stub via PATH, no git stub). Uses env overrides to fake every external
# call the script makes.

# Helper — create a temp dir with fake command stubs.
handoff_setup() {
  HTMPDIR=$(mktemp -d)
  HSELF_CLOSE_LOG="$HTMPDIR/self-close.log"
  HSPAWN_LOG="$HTMPDIR/spawn.log"

  # Default fake dispatch-self-close: records the call, exits 0.
  cat > "$HTMPDIR/fake-self-close" <<'FAKE'
#!/usr/bin/env bash
echo "self-close called" >> "$HSELF_CLOSE_LOG"
exit 0
FAKE
  # Inject HSELF_CLOSE_LOG into the fake via env at call time.
  chmod +x "$HTMPDIR/fake-self-close"
}

handoff_teardown() {
  rm -rf "$HTMPDIR"
  unset HTMPDIR HSELF_CLOSE_LOG HSPAWN_LOG
}

# Run dispatch-handoff with fake commands injected via env.
run_handoff() {
  DISPATCH_HANDOFF_SELF_CLOSE_CMD="$HTMPDIR/fake-self-close" \
  HSELF_CLOSE_LOG="$HSELF_CLOSE_LOG" \
  HSPAWN_LOG="$HSPAWN_LOG" \
    "$HANDOFF_SCRIPT" "$@"
}

# ----- 1. --early-stop: calls self-close, exits 0 ---------------------------
echo "Test: dispatch-handoff --early-stop calls self-close and exits 0"
handoff_setup
# Wrap fake-self-close so that exec is simulated by just running and exiting.
# dispatch-handoff uses `exec` for self-close; the fake does not exec, it exits.
# The test just checks exit code and log presence.
run_handoff --early-stop
early_stop_exit=$?
assert_eq "--early-stop exit code" "0" "$early_stop_exit"
assert_eq "--early-stop self-close called" "self-close called" "$(cat "$HSELF_CLOSE_LOG" 2>/dev/null || echo '')"
# spawn must NOT be called on early-stop.
assert_eq "--early-stop no spawn" "" "$(cat "$HSPAWN_LOG" 2>/dev/null || echo '')"
handoff_teardown

# ----- 2. No arguments → exit 2 -----------------------------------------------
echo "Test: dispatch-handoff with no arguments → exit 2"
handoff_setup
# Use if/else to capture exit code without triggering set -e.
if run_handoff 2>/dev/null; then no_args_exit=0; else no_args_exit=$?; fi
assert_eq "no arguments: exit 2" "2" "$no_args_exit"
handoff_teardown

# ----- 3. CLAUDE_JOB_DIR unset: self-close is a no-op (interactive session) --
echo "Test: dispatch-handoff --early-stop with CLAUDE_JOB_DIR unset: self-close no-op, exits 0"
handoff_setup
# The real dispatch-self-close is a no-op when CLAUDE_JOB_DIR is unset.
# Our fake always succeeds — same observable behavior. The test verifies that
# dispatch-handoff does not error when CLAUDE_JOB_DIR is absent.
(unset CLAUDE_JOB_DIR; run_handoff --early-stop)
interactive_exit=$?
assert_eq "--early-stop interactive: exits 0" "0" "$interactive_exit"
handoff_teardown

# ============================================================================
# dispatch-finalize-selection tests (#896)
# ============================================================================
# Pin the cd-first contract introduced for #896. The wrapper takes one
# required <worktree-path> argument, cds into it, writes the
# tmp/dispatch-worktree marker, then execs dispatch-acquire-lock --release.
# The cd-first contract is what keeps the marker out of the router's cwd
# (worktrees/main); the previous implementation wrote into PWD and leaked
# the marker into the router's cwd, defeating the selection lock.
echo ""
echo "=== dispatch-finalize-selection ==="

FINALIZE_SCRIPT="$SCRIPT_DIR/dispatch-finalize-selection"

# ----- Test A (happy path / #896 regression) ---------------------------------
echo "Test: dispatch-finalize-selection writes marker into target worktree, not caller's cwd, and releases the lock"
lock_setup
# Set up two distinct dirs: A (caller's cwd) and B (target worktree).
ROUTER_CWD="$TMPDIR_TEST/A"
TARGET_WT="$TMPDIR_TEST/B"
mkdir -p "$ROUTER_CWD" "$TARGET_WT"
export CLAUDE_CODE_SESSION_ID="finalize-self-session"
# Pre-fill the lock with our own sessionId so the wrapper's --release is a
# strict self-release: it truncates the file and prints `released`.
echo "$CLAUDE_CODE_SESSION_ID" > "$DISPATCH_LOCK_FILE"

FIN_ORIG_PWD="$PWD"
cd "$ROUTER_CWD"
# Capture the exit code via `if` so the test file's `set -e` does not abort
# the whole suite before `finalize_exit` is set on a (regression) non-zero
# exit — same pattern as the error-path tests B/C/D below.
if "$FINALIZE_SCRIPT" "$TARGET_WT" > "$TMPDIR_TEST/finalize.out" 2>&1; then
  finalize_exit=0
else
  finalize_exit=$?
fi
cd "$FIN_ORIG_PWD"

assert_eq "happy path: exit 0" "0" "$finalize_exit"
assert_eq "happy path: marker in target worktree" "1" \
  "$([ -f "$TARGET_WT/tmp/dispatch-worktree" ] && echo 1 || echo 0)"
# #928: the marker is session-scoped — it carries the finalizing holder's
# CLAUDE_CODE_SESSION_ID, not an empty flag.
assert_eq "happy path: marker content names the finalizing session" \
  "$CLAUDE_CODE_SESSION_ID" \
  "$(cat "$TARGET_WT/tmp/dispatch-worktree")"
# Regression for #896: the wrapper must not write the marker into the
# caller's cwd. This is the load-bearing assertion.
assert_eq "happy path: no marker in caller cwd" "0" \
  "$([ -f "$ROUTER_CWD/tmp/dispatch-worktree" ] && echo 1 || echo 0)"
# Strict self-release truncates the lock file.
assert_eq "happy path: lock released" "" "$(cat "$DISPATCH_LOCK_FILE")"
assert_eq "happy path: stdout reports released" "released" \
  "$(cat "$TMPDIR_TEST/finalize.out")"
lock_teardown

# ----- Test B (missing argument) ---------------------------------------------
echo "Test: dispatch-finalize-selection with no args exits 2 with diagnostic"
lock_setup
if "$FINALIZE_SCRIPT" > "$TMPDIR_TEST/missing.out" 2> "$TMPDIR_TEST/missing.err"; then
  missing_exit=0
else
  missing_exit=$?
fi
assert_eq "missing arg: exit 2" "2" "$missing_exit"
assert_eq "missing arg: stderr names script and 'missing'" "1" \
  "$(grep -c 'dispatch-finalize-selection.*missing' "$TMPDIR_TEST/missing.err")"
lock_teardown

# ----- Test C (invalid worktree path) ----------------------------------------
echo "Test: dispatch-finalize-selection with nonexistent path exits 2 with diagnostic"
lock_setup
BAD_PATH="$TMPDIR_TEST/does-not-exist"
if "$FINALIZE_SCRIPT" "$BAD_PATH" > "$TMPDIR_TEST/invalid.out" 2> "$TMPDIR_TEST/invalid.err"; then
  invalid_exit=0
else
  invalid_exit=$?
fi
assert_eq "invalid path: exit 2" "2" "$invalid_exit"
assert_eq "invalid path: stderr names script and 'cannot cd'" "1" \
  "$(grep -c "dispatch-finalize-selection.*cannot cd.*$BAD_PATH" "$TMPDIR_TEST/invalid.err")"
# The marker must not have been written anywhere on this failure path.
assert_eq "invalid path: no marker created in $TMPDIR_TEST" "" \
  "$(find "$TMPDIR_TEST" -name dispatch-worktree -print 2>/dev/null)"
lock_teardown

# ----- Test D (extra argument) -----------------------------------------------
echo "Test: dispatch-finalize-selection with extra positional arg exits 2"
lock_setup
EXTRA_A="$TMPDIR_TEST/wt-a"
EXTRA_B="$TMPDIR_TEST/wt-b"
mkdir -p "$EXTRA_A" "$EXTRA_B"
if "$FINALIZE_SCRIPT" "$EXTRA_A" "$EXTRA_B" > "$TMPDIR_TEST/extra.out" 2> "$TMPDIR_TEST/extra.err"; then
  extra_exit=0
else
  extra_exit=$?
fi
assert_eq "extra arg: exit 2" "2" "$extra_exit"
assert_eq "extra arg: stderr names script and 'extra'" "1" \
  "$(grep -c 'dispatch-finalize-selection.*extra' "$TMPDIR_TEST/extra.err")"
# No marker landed in either dir on the rejected call.
assert_eq "extra arg: no marker in first arg path" "0" \
  "$([ -f "$EXTRA_A/tmp/dispatch-worktree" ] && echo 1 || echo 0)"
assert_eq "extra arg: no marker in second arg path" "0" \
  "$([ -f "$EXTRA_B/tmp/dispatch-worktree" ] && echo 1 || echo 0)"
lock_teardown

# ----- Test E (flag-shaped argument) -----------------------------------------
# A flag-shaped first arg (e.g. someone confusing this wrapper with
# dispatch-acquire-lock --release) is rejected before any cd/marker side effect.
echo "Test: dispatch-finalize-selection with flag-shaped arg exits 2"
lock_setup
if "$FINALIZE_SCRIPT" --release > "$TMPDIR_TEST/flag.out" 2> "$TMPDIR_TEST/flag.err"; then
  flag_exit=0
else
  flag_exit=$?
fi
assert_eq "flag arg: exit 2" "2" "$flag_exit"
assert_eq "flag arg: stderr names script and 'flag-shaped'" "1" \
  "$(grep -c 'dispatch-finalize-selection.*flag-shaped' "$TMPDIR_TEST/flag.err")"
# No marker created anywhere on the rejected call.
assert_eq "flag arg: no marker created in $TMPDIR_TEST" "" \
  "$(find "$TMPDIR_TEST" -name dispatch-worktree -print 2>/dev/null)"
lock_teardown

# ----- Test F (unset CLAUDE_CODE_SESSION_ID) ---------------------------------
# #928: the marker is session-scoped, so an unset CLAUDE_CODE_SESSION_ID is a
# misconfigured environment — the wrapper must fail clear (exit 2) rather than
# write an inert empty marker that could never reclaim a live holder. Mirrors
# dispatch-acquire-lock's Test 6b guard.
echo "Test: dispatch-finalize-selection with unset CLAUDE_CODE_SESSION_ID exits 2"
lock_setup
UNSET_WT="$TMPDIR_TEST/unset-wt"
mkdir -p "$UNSET_WT"
# `set -e` is in effect: capture the exit code with an if/else. env -u strips
# CLAUDE_CODE_SESSION_ID for just this invocation.
if ( env -u CLAUDE_CODE_SESSION_ID \
       "$FINALIZE_SCRIPT" "$UNSET_WT" ) > "$TMPDIR_TEST/unset.out" 2> "$TMPDIR_TEST/unset.err"; then
  unset_exit=0
else
  unset_exit=$?
fi
assert_eq "unset session: exit 2" "2" "$unset_exit"
assert_eq "unset session: stderr names script and 'is unset'" "1" \
  "$(grep -c 'dispatch-finalize-selection.*CLAUDE_CODE_SESSION_ID is unset' "$TMPDIR_TEST/unset.err")"
# The guard fires after the cd but before the marker write — no inert empty
# marker must land in the target worktree.
assert_eq "unset session: no marker created in target worktree" "0" \
  "$([ -f "$UNSET_WT/tmp/dispatch-worktree" ] && echo 1 || echo 0)"
lock_teardown

# ============================================================================
# restore-dispatch-skill tests (#903)
# ============================================================================
echo ""
echo "=== restore-dispatch-skill ==="
#
# SessionStart:clear recovery hook: emits the phase skill's SKILL.md body
# inline, so a context-cleared session resumes the phase skill semantically
# instead of relying on a prompt-engineering Reload directive that can be
# overridden by a competing injected user prompt (#903 root cause).
#
# Each test gets a fresh tmp tree:
#   $TMPDIR_TEST/.claude/hooks/restore-dispatch-skill.sh   — hook under test
#   $TMPDIR_TEST/.claude/skills/<phase-skill>/SKILL.md     — fixture body
#   $TMPDIR_TEST/.claude/skills/dispatch-propagate/scripts/dispatch-phase — phase shim
#   $TMPDIR_TEST/bin/{claude,git}                          — PATH shims
#   $TMPDIR_TEST/stub/                                     — fixture inputs
#
# HOOK_SCRIPT_DIR is already defined above at the dispatch-input-block section;
# reuse it here.

restore_setup() {
  TMPDIR_TEST=$(mktemp -d)
  STUB_DIR="$TMPDIR_TEST/stub"
  mkdir -p "$TMPDIR_TEST/.claude/hooks" \
    "$TMPDIR_TEST/.claude/skills/dispatch-propagate/scripts" \
    "$TMPDIR_TEST/bin" \
    "$STUB_DIR"
  for skill in plan-implement verify-pr dispatch-qa code-review-fix \
               review-fix security-review-fix dispatch-worker; do
    mkdir -p "$TMPDIR_TEST/.claude/skills/$skill"
    cat > "$TMPDIR_TEST/.claude/skills/$skill/SKILL.md" <<EOF
---
name: $skill
description: test fixture
---

# Test Skill $skill

RESTORE_MARKER_$skill body line.
EOF
  done

  cp "$HOOK_SCRIPT_DIR/restore-dispatch-skill.sh" \
    "$TMPDIR_TEST/.claude/hooks/restore-dispatch-skill.sh"
  chmod +x "$TMPDIR_TEST/.claude/hooks/restore-dispatch-skill.sh"

  # dispatch-phase shim: read $STUB_DIR/current-phase.txt.
  cat > "$TMPDIR_TEST/.claude/skills/dispatch-propagate/scripts/dispatch-phase" <<'FAKE'
#!/usr/bin/env bash
if [[ -f "$STUB_DIR/current-phase.txt" ]]; then
  cat "$STUB_DIR/current-phase.txt"
else
  echo "implement"
fi
exit 0
FAKE
  chmod +x "$TMPDIR_TEST/.claude/skills/dispatch-propagate/scripts/dispatch-phase"

  # claude PATH stub: handle `agents --json`.
  cat > "$TMPDIR_TEST/bin/claude" <<'STUB'
#!/usr/bin/env bash
STUB_DIR="$(cd "$(dirname "$0")/.." && pwd)/stub"
args="$*"
case "$args" in
  "agents --json")
    if [[ -f "$STUB_DIR/claude-agents.json" ]]; then
      cat "$STUB_DIR/claude-agents.json"
    else
      echo "[]"
    fi
    ;;
  *)
    exit 0
    ;;
esac
STUB
  chmod +x "$TMPDIR_TEST/bin/claude"

  # git PATH stub.
  cat > "$TMPDIR_TEST/bin/git" <<'STUB'
#!/usr/bin/env bash
STUB_DIR="$(cd "$(dirname "$0")/.." && pwd)/stub"
args="$*"
case "$args" in
  "rev-parse --abbrev-ref HEAD")
    if [[ -f "$STUB_DIR/current-branch.txt" ]]; then
      cat "$STUB_DIR/current-branch.txt"
    else
      echo "main"
    fi
    ;;
  "rev-parse --path-format=absolute --git-common-dir")
    cat "$STUB_DIR/git-common-dir.txt"
    ;;
  *)
    echo "git stub: unknown invocation: $args" >&2
    exit 1
    ;;
esac
STUB
  chmod +x "$TMPDIR_TEST/bin/git"

  # Provide --git-common-dir output. The hook computes PROJECT_ROOT as
  # dirname($GIT_COMMON_DIR), so $TMPDIR_TEST/.bare → PROJECT_ROOT=$TMPDIR_TEST
  # and WORKTREE_PATH=$TMPDIR_TEST/worktrees/<basename>.
  echo "$TMPDIR_TEST/.bare" > "$STUB_DIR/git-common-dir.txt"

  export PATH="$TMPDIR_TEST/bin:$PATH"
  export STUB_DIR
}

restore_teardown() {
  rm -rf "$TMPDIR_TEST"
  TMPDIR_TEST=""
  STUB_DIR=""
  export PATH="$SAVED_PATH"
}

run_restore() {
  printf '{"session_id":"sid-test"}' | \
    "$TMPDIR_TEST/.claude/hooks/restore-dispatch-skill.sh" 2>/dev/null
}

# Helper to set the agents fixture for sid-test.
set_agents_name() {
  printf '[{"sessionId":"sid-test","name":"%s"}]\n' "$1" > "$STUB_DIR/claude-agents.json"
}

# --- Test 1: implement → plan-implement body + ARGUMENTS: <N> -----------------
echo "Test: restore-dispatch-skill phase=implement → plan-implement body + args"
restore_setup
set_agents_name "903-foo"
echo "implement" > "$STUB_DIR/current-phase.txt"
output=$(run_restore)
TOTAL=$((TOTAL + 1))
if [[ "$output" == *"COMPACTION RECOVERY — resume the active phase skill below."* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: implement: header line emitted"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: implement: header line emitted"
  echo "    output: $output"
fi
TOTAL=$((TOTAL + 1))
expected_dir="Base directory for this skill: $TMPDIR_TEST/.claude/skills/plan-implement"
if [[ "$output" == *"$expected_dir"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: implement: base directory line emitted"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: implement: base directory line emitted"
  echo "    output: $output"
fi
TOTAL=$((TOTAL + 1))
if [[ "$output" == *"RESTORE_MARKER_plan-implement"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: implement: SKILL.md body marker emitted"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: implement: SKILL.md body marker emitted"
fi
TOTAL=$((TOTAL + 1))
if [[ "$output" == *"ARGUMENTS: 903"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: implement: ARGUMENTS line emitted"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: implement: ARGUMENTS line emitted"
  echo "    output: $output"
fi
# Frontmatter must be stripped — no `name: plan-implement` line should appear.
TOTAL=$((TOTAL + 1))
if [[ "$output" != *"name: plan-implement"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: implement: frontmatter stripped"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: implement: frontmatter stripped"
fi
restore_teardown

# --- Test 2: verify → verify-pr body, no ARGUMENTS ---------------------------
echo "Test: restore-dispatch-skill phase=verify → verify-pr body, no ARGUMENTS"
restore_setup
set_agents_name "903-foo"
echo "verify" > "$STUB_DIR/current-phase.txt"
output=$(run_restore)
TOTAL=$((TOTAL + 1))
expected_dir="Base directory for this skill: $TMPDIR_TEST/.claude/skills/verify-pr"
if [[ "$output" == *"$expected_dir"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: verify: base directory line emitted"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: verify: base directory line emitted"
  echo "    output: $output"
fi
TOTAL=$((TOTAL + 1))
if [[ "$output" == *"RESTORE_MARKER_verify-pr"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: verify: SKILL.md body marker emitted"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: verify: SKILL.md body marker emitted"
fi
TOTAL=$((TOTAL + 1))
if ! printf '%s\n' "$output" | grep -q '^ARGUMENTS:'; then
  PASS=$((PASS + 1)); echo "  PASS: verify: no ARGUMENTS line"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: verify: no ARGUMENTS line"
  echo "    output: $output"
fi
restore_teardown

# --- Test 3: qa → dispatch-qa body + ARGUMENTS: <N> --------------------------
echo "Test: restore-dispatch-skill phase=qa → dispatch-qa body + args"
restore_setup
set_agents_name "903-foo"
echo "qa" > "$STUB_DIR/current-phase.txt"
output=$(run_restore)
TOTAL=$((TOTAL + 1))
expected_dir="Base directory for this skill: $TMPDIR_TEST/.claude/skills/dispatch-qa"
if [[ "$output" == *"$expected_dir"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: qa: base directory line emitted"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: qa: base directory line emitted"
  echo "    output: $output"
fi
TOTAL=$((TOTAL + 1))
if [[ "$output" == *"RESTORE_MARKER_dispatch-qa"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: qa: SKILL.md body marker emitted"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: qa: SKILL.md body marker emitted"
fi
TOTAL=$((TOTAL + 1))
if [[ "$output" == *"ARGUMENTS: 903"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: qa: ARGUMENTS line emitted"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: qa: ARGUMENTS line emitted"
  echo "    output: $output"
fi
restore_teardown

# --- Test 4: code-review → code-review-fix body, no ARGUMENTS ----------------
echo "Test: restore-dispatch-skill phase=code-review → code-review-fix body, no ARGUMENTS"
restore_setup
set_agents_name "903-foo"
echo "code-review" > "$STUB_DIR/current-phase.txt"
output=$(run_restore)
TOTAL=$((TOTAL + 1))
expected_dir="Base directory for this skill: $TMPDIR_TEST/.claude/skills/code-review-fix"
if [[ "$output" == *"$expected_dir"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: code-review: base directory line emitted"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: code-review: base directory line emitted"
  echo "    output: $output"
fi
TOTAL=$((TOTAL + 1))
if [[ "$output" == *"RESTORE_MARKER_code-review-fix"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: code-review: SKILL.md body marker emitted"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: code-review: SKILL.md body marker emitted"
fi
TOTAL=$((TOTAL + 1))
if ! printf '%s\n' "$output" | grep -q '^ARGUMENTS:'; then
  PASS=$((PASS + 1)); echo "  PASS: code-review: no ARGUMENTS line"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: code-review: no ARGUMENTS line"
  echo "    output: $output"
fi
restore_teardown

# --- Test 5: review → review-fix body, no ARGUMENTS --------------------------
echo "Test: restore-dispatch-skill phase=review → review-fix body, no ARGUMENTS"
restore_setup
set_agents_name "903-foo"
echo "review" > "$STUB_DIR/current-phase.txt"
output=$(run_restore)
TOTAL=$((TOTAL + 1))
expected_dir="Base directory for this skill: $TMPDIR_TEST/.claude/skills/review-fix"
if [[ "$output" == *"$expected_dir"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: review: base directory line emitted"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: review: base directory line emitted"
  echo "    output: $output"
fi
TOTAL=$((TOTAL + 1))
if [[ "$output" == *"RESTORE_MARKER_review-fix"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: review: SKILL.md body marker emitted"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: review: SKILL.md body marker emitted"
fi
TOTAL=$((TOTAL + 1))
if ! printf '%s\n' "$output" | grep -q '^ARGUMENTS:'; then
  PASS=$((PASS + 1)); echo "  PASS: review: no ARGUMENTS line"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: review: no ARGUMENTS line"
  echo "    output: $output"
fi
restore_teardown

# --- Test 6: security → security-review-fix body, no ARGUMENTS ---------------
echo "Test: restore-dispatch-skill phase=security → security-review-fix body, no ARGUMENTS"
restore_setup
set_agents_name "903-foo"
echo "security" > "$STUB_DIR/current-phase.txt"
output=$(run_restore)
TOTAL=$((TOTAL + 1))
expected_dir="Base directory for this skill: $TMPDIR_TEST/.claude/skills/security-review-fix"
if [[ "$output" == *"$expected_dir"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: security: base directory line emitted"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: security: base directory line emitted"
  echo "    output: $output"
fi
TOTAL=$((TOTAL + 1))
if [[ "$output" == *"RESTORE_MARKER_security-review-fix"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: security: SKILL.md body marker emitted"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: security: SKILL.md body marker emitted"
fi
TOTAL=$((TOTAL + 1))
if ! printf '%s\n' "$output" | grep -q '^ARGUMENTS:'; then
  PASS=$((PASS + 1)); echo "  PASS: security: no ARGUMENTS line"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: security: no ARGUMENTS line"
  echo "    output: $output"
fi
restore_teardown

# --- Test 7: fallback (waiting) → dispatch-worker body + ARGUMENTS: <N> <path>
echo "Test: restore-dispatch-skill phase=waiting → dispatch-worker fallback"
restore_setup
set_agents_name "903-foo"
echo "waiting" > "$STUB_DIR/current-phase.txt"
output=$(run_restore)
TOTAL=$((TOTAL + 1))
expected_dir="Base directory for this skill: $TMPDIR_TEST/.claude/skills/dispatch-worker"
if [[ "$output" == *"$expected_dir"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: waiting: base directory line emitted"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: waiting: base directory line emitted"
  echo "    output: $output"
fi
TOTAL=$((TOTAL + 1))
if [[ "$output" == *"RESTORE_MARKER_dispatch-worker"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: waiting: SKILL.md body marker emitted"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: waiting: SKILL.md body marker emitted"
fi
TOTAL=$((TOTAL + 1))
expected_args="ARGUMENTS: 903 $TMPDIR_TEST/worktrees/903-foo"
if [[ "$output" == *"$expected_args"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: waiting: ARGUMENTS line with worktree path"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: waiting: ARGUMENTS line with worktree path"
  echo "    output: $output"
  echo "    expected to contain: $expected_args"
fi
restore_teardown

# --- Test 8: missing SKILL.md → legacy one-line Reload fallback --------------
echo "Test: restore-dispatch-skill missing SKILL.md → legacy fallback"
restore_setup
set_agents_name "903-foo"
echo "implement" > "$STUB_DIR/current-phase.txt"
rm -f "$TMPDIR_TEST/.claude/skills/plan-implement/SKILL.md"
output=$(run_restore)
TOTAL=$((TOTAL + 1))
if [[ "$output" == *"COMPACTION RECOVERY: Reload skill: /plan-implement 903"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: missing SKILL.md: legacy line emitted"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: missing SKILL.md: legacy line emitted"
  echo "    output: $output"
fi
TOTAL=$((TOTAL + 1))
if [[ "$output" != *"Base directory for this skill:"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: missing SKILL.md: no inline emission"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: missing SKILL.md: no inline emission"
fi
restore_teardown

# --- Test 9: router-shaped --name → no output -------------------------------
echo "Test: restore-dispatch-skill router-shaped --name → empty output"
restore_setup
set_agents_name "dispatch-abc123"
echo "implement" > "$STUB_DIR/current-phase.txt"
output=$(run_restore)
assert_eq "router-shaped name: empty output" "" "$output"
restore_teardown

# --- Test 10: path-traversal --name → no output ------------------------------
# Use a --name that matches the primary regex (^[0-9]+-) AND contains `..`
# to exercise the path-traversal rejection at lines 51-53 of the hook.
echo "Test: restore-dispatch-skill path-traversal --name → empty output"
restore_setup
set_agents_name "903-../bad"
echo "implement" > "$STUB_DIR/current-phase.txt"
output=$(run_restore)
assert_eq "path-traversal name: empty output" "" "$output"
restore_teardown

# --- Test 11: malformed frontmatter (no closing `---`) → file emitted verbatim
# An opening `---` with no closing delimiter must NOT have its body deleted to
# EOF (the over-delete failure mode the guard at line 151 prevents). The hook
# emits the file verbatim instead — the frontmatter lines, including the opening
# `---`, are preserved rather than stripped.
echo "Test: restore-dispatch-skill malformed frontmatter → file emitted verbatim"
restore_setup
set_agents_name "903-foo"
echo "implement" > "$STUB_DIR/current-phase.txt"
cat > "$TMPDIR_TEST/.claude/skills/plan-implement/SKILL.md" <<'EOF'
---
name: plan-implement
description: malformed fixture with no closing delimiter

# Test Skill plan-implement

RESTORE_MARKER_malformed body line.
EOF
output=$(run_restore)
TOTAL=$((TOTAL + 1))
if [[ "$output" == *"RESTORE_MARKER_malformed body line."* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: malformed frontmatter: body not deleted to EOF"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: malformed frontmatter: body not deleted to EOF"
  echo "    output: $output"
fi
# Verbatim emission keeps the unstrippable frontmatter lines (incl. the `name:`
# line that the normal path would have removed), proving the guard's else branch.
TOTAL=$((TOTAL + 1))
if [[ "$output" == *"name: plan-implement"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: malformed frontmatter: file emitted verbatim (frontmatter retained)"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: malformed frontmatter: file emitted verbatim (frontmatter retained)"
  echo "    output: $output"
fi
restore_teardown

# --- Test 12: control-char in --name → no output (reminder-injection guard) ---
# A session name carrying an embedded newline (JSON \n in the agents fixture,
# decoded to a real newline by `jq -r`) matches the primary `^[0-9]+-` regex
# but must be rejected by the basename guard at lines 51-53. Otherwise the
# newline would survive into WORKTREE_PATH → SKILL_ARGS and inject extra lines
# into the emitted system-reminder via the ARGUMENTS line.
echo "Test: restore-dispatch-skill control-char --name → empty output"
restore_setup
set_agents_name '903-foo\nINJECTED REMINDER LINE'
echo "implement" > "$STUB_DIR/current-phase.txt"
output=$(run_restore)
assert_eq "control-char name: empty output" "" "$output"
restore_teardown

# ============================================================================
# dispatch chain: no EnterWorktree/ExitWorktree mid-session (ratchet for #839)
# ============================================================================
echo "=== dispatch chain: no EnterWorktree/ExitWorktree mid-session ==="
#
# Regression guard for #839: the dispatch chain — router /dispatch-propagate and the
# skills the worker (/dispatch-worker) invokes — must not call EnterWorktree
# or ExitWorktree. The worker is born in its target worktree (cwd set by
# dispatch-spawn-worker); any mid-session worktree switch is at best a no-op
# and at worst an error. The router runs in worktrees/main and materializes
# the target worktree explicitly (git worktree add).
#
# Allowed exception: dispatch-worker/SKILL.md mentions the words in its
# preamble contract: "It never calls EnterWorktree or ExitWorktree."

PROJECT_ROOT_FOR_GUARD=$(cd "$SCRIPT_DIR/../../../.." && pwd)

# Map of chain-skill SKILL.md → allowed count of EnterWorktree+ExitWorktree
# substring mentions (grep -oE counts each occurrence, not each line).
declare -A CHAIN_GUARD_EXPECTED=(
  [".claude/skills/dispatch/SKILL.md"]=0
  [".claude/skills/dispatch-propagate/SKILL.md"]=0
  [".claude/skills/dispatch-worker/SKILL.md"]=2
  # Phase skills do not call EnterWorktree/ExitWorktree (#868): they write the
  # phase-completed marker and stop; the Stop hook (`.claude/hooks/dispatch-stop.sh`)
  # owns post-phase disposition (label management, router spawn, self-close).
  # This supersedes #824's terminal ExitWorktree action:"keep" pattern.
  [".claude/skills/dispatch-qa/SKILL.md"]=0
  [".claude/skills/plan-implement/SKILL.md"]=0
  [".claude/skills/code-review-fix/SKILL.md"]=0
  [".claude/skills/review-fix/SKILL.md"]=0
  [".claude/skills/security-review-fix/SKILL.md"]=0
  [".claude/skills/verify-pr/SKILL.md"]=0
  [".claude/skills/implement-unit/SKILL.md"]=0
  [".claude/skills/commit-merge-push/SKILL.md"]=0
)

for relpath in "${!CHAIN_GUARD_EXPECTED[@]}"; do
  abspath="$PROJECT_ROOT_FOR_GUARD/$relpath"
  expected="${CHAIN_GUARD_EXPECTED[$relpath]}"
  if [[ ! -f "$abspath" ]]; then
    TOTAL=$((TOTAL + 1)); FAIL=$((FAIL + 1))
    echo "  FAIL: chain-guard: file missing: $relpath"
    continue
  fi
  actual=$({ grep -oE 'EnterWorktree|ExitWorktree' "$abspath" || true; } | wc -l | tr -d ' ')
  assert_eq "chain-guard: $relpath: EnterWorktree/ExitWorktree count" \
    "$expected" "$actual"
done

# ============================================================================
# dispatch-check-blockers tests
# ============================================================================
echo ""
echo "=== dispatch-check-blockers ==="

# No open blockers (no fixture → stub returns []) → exit 0, no output.
echo "Test: no blockers → exit 0, silent"
setup
stdout=$("$TMPDIR_TEST/dispatch-check-blockers" 100 2>/dev/null) && rc=0 || rc=$?
assert_eq "no blockers → exit 0" "0" "$rc"
assert_eq "no blockers → no output" "" "$stdout"
teardown

# Only closed blockers do not gate → exit 0, no output.
echo "Test: closed-only blockers → exit 0, silent"
setup
printf '[{"number":888,"state":"closed"}]\n' > "$STUB_DIR/blockers-100.json"
stdout=$("$TMPDIR_TEST/dispatch-check-blockers" 100 2>/dev/null) && rc=0 || rc=$?
assert_eq "closed-only blockers → exit 0" "0" "$rc"
assert_eq "closed-only blockers → no output" "" "$stdout"
teardown

# One open blocker → exit 2, prints blocked:<num>.
echo "Test: one open blocker → exit 2, blocked:<num>"
setup
printf '[{"number":999,"state":"open"}]\n' > "$STUB_DIR/blockers-100.json"
stdout=$("$TMPDIR_TEST/dispatch-check-blockers" 100 2>/dev/null) && rc=0 || rc=$?
assert_eq "one open blocker → exit 2" "2" "$rc"
assert_eq "one open blocker → blocked:999" "blocked:999" "$stdout"
teardown

# Multiple open blockers → exit 2, comma-joined numbers; closed ones excluded.
echo "Test: mixed blockers → exit 2, only open numbers"
setup
printf '[{"number":999,"state":"open"},{"number":888,"state":"closed"},{"number":777,"state":"OPEN"}]\n' \
  > "$STUB_DIR/blockers-100.json"
stdout=$("$TMPDIR_TEST/dispatch-check-blockers" 100 2>/dev/null) && rc=0 || rc=$?
assert_eq "mixed blockers → exit 2" "2" "$rc"
assert_eq "mixed blockers → blocked:999,777" "blocked:999,777" "$stdout"
teardown

# Missing arg → usage error on stderr, exit 1.
echo "Test: missing arg → usage error, exit 1"
setup
err_out=$("$TMPDIR_TEST/dispatch-check-blockers" 2>&1 1>/dev/null && echo "EXIT=0" || echo "EXIT=$?")
case "$err_out" in
  *"usage:"*"EXIT=1") status="ok" ;;
  *) status="bad: $err_out" ;;
esac
assert_eq "missing arg → usage error, exit 1" "ok" "$status"
teardown

# Non-numeric arg → usage error, exit 1.
echo "Test: non-numeric arg → usage error, exit 1"
setup
err_out=$("$TMPDIR_TEST/dispatch-check-blockers" abc 2>&1 1>/dev/null && echo "EXIT=0" || echo "EXIT=$?")
case "$err_out" in
  *"usage:"*"EXIT=1") status="ok" ;;
  *) status="bad: $err_out" ;;
esac
assert_eq "non-numeric arg → usage error, exit 1" "ok" "$status"
teardown

# gh failure on the blocked_by lookup → hard error (exit 1), never a false "clear".
echo "Test: gh blocked_by failure → exit 1"
setup
: > "$STUB_DIR/gh-fail-blocked_by-100"
stdout=$("$TMPDIR_TEST/dispatch-check-blockers" 100 2>/dev/null) && rc=0 || rc=$?
assert_eq "gh blocked_by failure → exit 1" "1" "$rc"
assert_eq "gh blocked_by failure → no output" "" "$stdout"
teardown

# dispatch-jit-calendar-import tests
# ============================================================================
#
# These tests mirror the JIT-engine harness: each test gets a fresh tmp tree,
# a curl PATH stub for OAuth + Calendar API endpoints, and a gh PATH stub
# extended with issue close + body-bearing issue list. "now" is pinned via
# DISPATCH_CALENDAR_NOW; TZ is pinned to UTC so "today" boundaries are
# deterministic on any host.

# A fixed reference epoch — 2026-05-26T15:00:00Z, a Tuesday at 15:00 UTC.
# Today UTC: [2026-05-26T00:00:00Z .. 2026-05-27T00:00:00Z) = [1779753600 ..
# 1779840000). Events placed at 16:00Z / 17:00Z today and at 15:00Z tomorrow
# anchor the Rule-1 / Rule-2 / both-rules / not-fired cases.
CAL_NOW_EPOCH=1779807600

cal_setup() {
  TMPDIR_TEST=$(mktemp -d)
  STUB_DIR="$TMPDIR_TEST/stub"
  mkdir -p "$TMPDIR_TEST/scripts" "$STUB_DIR" "$TMPDIR_TEST/bin" \
    "$TMPDIR_TEST/config" "$TMPDIR_TEST/state"

  cp "$SCRIPT_DIR/dispatch-jit-calendar-import" \
    "$TMPDIR_TEST/scripts/dispatch-jit-calendar-import"
  cp "$SCRIPT_DIR/dispatch-config-load" \
    "$TMPDIR_TEST/scripts/dispatch-config-load"
  cp "$SCRIPT_DIR/dispatch-project-item-add" \
    "$TMPDIR_TEST/scripts/dispatch-project-item-add"
  chmod +x "$TMPDIR_TEST/scripts/dispatch-jit-calendar-import" \
           "$TMPDIR_TEST/scripts/dispatch-config-load" \
           "$TMPDIR_TEST/scripts/dispatch-project-item-add"

  # projects.json so dispatch-project-item-add resolves the project key.
  cat > "$TMPDIR_TEST/config/projects.json" <<'EOF'
{
  "projects": [
    {
      "key": "test-project",
      "owner": "test-owner",
      "number": 1,
      "statusField": "Status",
      "statusInProgress": "In Progress",
      "statusDone": "Done"
    }
  ]
}
EOF

  export DISPATCH_CONFIG_DIR="$TMPDIR_TEST/config"
  export DISPATCH_CALENDAR_STATE_DIR="$TMPDIR_TEST/state"
  export DISPATCH_CALENDAR_NOW="$CAL_NOW_EPOCH"
  export TZ=UTC
  export GOOGLE_CALENDAR_CLIENT_ID="fake-id"
  export GOOGLE_CALENDAR_CLIENT_SECRET="fake-secret"
  export GOOGLE_CALENDAR_REFRESH_TOKEN="fake-refresh"
  export CALENDAR_REPO="fixture-owner/fixture-repo"
  export CALENDAR_PROJECT_KEY="test-project"
  export CALENDAR_LABEL="jit:calendar"
  export CALENDAR_LOOKAHEAD="7d"
  export CALENDAR_DEBOUNCE="15m"

  # curl PATH stub. Switches on URL substring and serves fixture bodies.
  # Logs every invocation to curl-calls.log so tests can assert call counts
  # and verify the debounce path makes none.
  cat > "$TMPDIR_TEST/bin/curl" <<'STUB'
#!/usr/bin/env bash
STUB_DIR="$(cd "$(dirname "$0")/.." && pwd)/stub"
args="$*"
echo "$args" >> "$STUB_DIR/curl-calls.log"

if [[ "$args" == *"oauth2.googleapis.com/token"* ]]; then
  if [[ -f "$STUB_DIR/oauth-fail.flag" ]]; then
    exit 22
  fi
  echo '{"access_token":"fake-access-token","expires_in":3599}'
  exit 0
fi

# More specific (events) must precede the bare-calendar pattern.
if [[ "$args" == *"calendar/v3/calendars/primary/events"* ]]; then
  if [[ -f "$STUB_DIR/events.json" ]]; then
    cat "$STUB_DIR/events.json"
  else
    echo '{"items":[]}'
  fi
  exit 0
fi

if [[ "$args" == *"calendar/v3/calendars/primary"* ]]; then
  if [[ -f "$STUB_DIR/calendar.json" ]]; then
    cat "$STUB_DIR/calendar.json"
  else
    echo '{"defaultReminders":[]}'
  fi
  exit 0
fi

echo "curl stub: unknown URL in args: $args" >&2
exit 1
STUB
  chmod +x "$TMPDIR_TEST/bin/curl"

  # gh PATH stub. Extends the JIT-engine stub with issue close + a body-bearing
  # issue list reading open-issues.json.
  cat > "$TMPDIR_TEST/bin/gh" <<'STUB'
#!/usr/bin/env bash
STUB_DIR="$(cd "$(dirname "$0")/.." && pwd)/stub"
args="$*"
echo "$args" >> "$STUB_DIR/gh-calls.log"
case "$args" in
  "label create "*)
    ;;
  *"issue list "*"--state open"*)
    if [[ -f "$STUB_DIR/open-issues.json" ]]; then
      cat "$STUB_DIR/open-issues.json"
    else
      echo '[]'
    fi
    ;;
  "issue create "*)
    echo "$args" >> "$STUB_DIR/gh-issue-create.log"
    echo "https://github.com/fixture-owner/fixture-repo/issues/777"
    ;;
  "issue close "*)
    echo "$args" >> "$STUB_DIR/gh-issue-close.log"
    ;;
  "project item-add "*)
    echo '{"id":"PVTI_cal001","title":"Cal issue","type":"Issue"}'
    ;;
  *)
    echo "gh stub: unknown invocation: $args" >&2
    exit 1
    ;;
esac
STUB
  chmod +x "$TMPDIR_TEST/bin/gh"
  PATH="$TMPDIR_TEST/bin:$PATH"

  # Default calendar metadata fixture — popup 10 minutes before, used when
  # an event sets reminders.useDefault = true. Tests that need a different
  # default override this file.
  cat > "$STUB_DIR/calendar.json" <<'EOF'
{"defaultReminders":[{"method":"popup","minutes":10}]}
EOF
}

cal_teardown() {
  rm -rf "$TMPDIR_TEST"
  PATH="$SAVED_PATH"
  TMPDIR_TEST=""
  STUB_DIR=""
  unset DISPATCH_CONFIG_DIR
  unset DISPATCH_CALENDAR_STATE_DIR
  unset DISPATCH_CALENDAR_NOW
  unset TZ
  unset GOOGLE_CALENDAR_CLIENT_ID
  unset GOOGLE_CALENDAR_CLIENT_SECRET
  unset GOOGLE_CALENDAR_REFRESH_TOKEN
  unset CALENDAR_REPO
  unset CALENDAR_PROJECT_KEY
  unset CALENDAR_LABEL
  unset CALENDAR_LOOKAHEAD
  unset CALENDAR_DEBOUNCE
}

# --- Test 1: no config — silent no-op ---------------------------------------

echo "Test: dispatch-jit-calendar-import with no OAuth env vars is a silent no-op"
cal_setup
unset GOOGLE_CALENDAR_REFRESH_TOKEN
rc=0
out=$("$TMPDIR_TEST/scripts/dispatch-jit-calendar-import" 2>/dev/null) || rc=$?
assert_eq "no-config exits 0" "0" "$rc"
assert_eq "no-config prints nothing" "" "$out"
TOTAL=$((TOTAL + 1))
if [[ ! -f "$STUB_DIR/curl-calls.log" ]]; then
  PASS=$((PASS + 1)); echo "  PASS: no-config made zero curl calls"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: no-config made zero curl calls"
  echo "    curl-calls.log: $(cat "$STUB_DIR/curl-calls.log")"
fi
TOTAL=$((TOTAL + 1))
if [[ ! -f "$STUB_DIR/gh-calls.log" ]]; then
  PASS=$((PASS + 1)); echo "  PASS: no-config made zero gh calls"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: no-config made zero gh calls"
  echo "    gh-calls.log: $(cat "$STUB_DIR/gh-calls.log")"
fi
cal_teardown

# --- Test 2: debounce within window — skipped with zero network calls -------

echo "Test: dispatch-jit-calendar-import debounce within window skips with no network"
cal_setup
# Pre-seed state: last run 5 minutes ago — within the 15m default debounce.
printf '{"lastRun": %s}\n' "$((CAL_NOW_EPOCH - 300))" \
  > "$TMPDIR_TEST/state/dispatch-jit-calendar-state.json"
rc=0
out=$("$TMPDIR_TEST/scripts/dispatch-jit-calendar-import" 2>/dev/null) || rc=$?
assert_eq "debounce exits 0" "0" "$rc"
TOTAL=$((TOTAL + 1))
if [[ "$out" == *"calendar: debounced"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: debounce reports debounced"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: debounce reports debounced"
  echo "    actual: $out"
fi
TOTAL=$((TOTAL + 1))
if [[ ! -f "$STUB_DIR/curl-calls.log" && ! -f "$STUB_DIR/gh-calls.log" ]]; then
  PASS=$((PASS + 1)); echo "  PASS: debounce made zero curl + gh calls"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: debounce made zero curl + gh calls"
  [[ -f "$STUB_DIR/curl-calls.log" ]] && echo "    curl-calls.log: $(cat "$STUB_DIR/curl-calls.log")"
  [[ -f "$STUB_DIR/gh-calls.log" ]] && echo "    gh-calls.log: $(cat "$STUB_DIR/gh-calls.log")"
fi
cal_teardown

# --- Test 3: Rule 1 — today's event files one issue --------------------------

echo "Test: dispatch-jit-calendar-import Rule 1 (today's event) files one issue"
cal_setup
# Event today: starts 16:00Z, ends 17:00Z, no overrides, useDefault=true.
cat > "$STUB_DIR/events.json" <<'EOF'
{
  "items": [
    {
      "id": "evt-today",
      "status": "confirmed",
      "summary": "Today meeting",
      "description": "Discuss plan",
      "location": "Office",
      "htmlLink": "https://calendar.google.com/event?eid=evt-today",
      "start": {"dateTime": "2026-05-26T16:00:00Z"},
      "end":   {"dateTime": "2026-05-26T17:00:00Z"},
      "reminders": {"useDefault": true}
    }
  ]
}
EOF
rc=0
out=$("$TMPDIR_TEST/scripts/dispatch-jit-calendar-import" 2>/dev/null) || rc=$?
assert_eq "rule-1 exits 0" "0" "$rc"
TOTAL=$((TOTAL + 1))
if [[ "$out" == *"calendar: created #777 (evt-today)"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: rule-1 reports created #777 (evt-today)"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: rule-1 reports created #777 (evt-today)"
  echo "    actual: $out"
fi
# The created issue carries the marker and the configured label.
TOTAL=$((TOTAL + 1))
create_args=$(cat "$STUB_DIR/gh-issue-create.log" 2>/dev/null || echo "")
if [[ "$create_args" == *"event=evt-today"* \
   && "$create_args" == *"start=2026-05-26T16:00:00Z"* \
   && "$create_args" == *"end=2026-05-26T17:00:00Z"* \
   && "$create_args" == *"--label jit:calendar"* ]]; then
  PASS=$((PASS + 1))
  echo "  PASS: rule-1 issue body carries marker and --label jit:calendar"
else
  FAIL=$((FAIL + 1))
  echo "  FAIL: rule-1 issue body carries marker and --label jit:calendar"
  echo "    gh-issue-create.log: $create_args"
fi
# project item-add was called.
TOTAL=$((TOTAL + 1))
gh_calls=$(cat "$STUB_DIR/gh-calls.log")
if [[ "$gh_calls" == *"project item-add"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: rule-1 invoked project item-add"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: rule-1 invoked project item-add"
  echo "    gh-calls.log: $gh_calls"
fi
cal_teardown

# --- Test 4: Rule 1 — declined event is excluded -----------------------------

echo "Test: dispatch-jit-calendar-import excludes declined events"
cal_setup
cat > "$STUB_DIR/events.json" <<'EOF'
{
  "items": [
    {
      "id": "evt-declined",
      "status": "confirmed",
      "summary": "Declined meeting",
      "start": {"dateTime": "2026-05-26T16:00:00Z"},
      "end":   {"dateTime": "2026-05-26T17:00:00Z"},
      "attendees": [
        {"email": "other@example.com", "responseStatus": "accepted"},
        {"email": "self@example.com", "self": true, "responseStatus": "declined"}
      ],
      "reminders": {"useDefault": true}
    }
  ]
}
EOF
rc=0
out=$("$TMPDIR_TEST/scripts/dispatch-jit-calendar-import" 2>/dev/null) || rc=$?
assert_eq "declined exits 0" "0" "$rc"
TOTAL=$((TOTAL + 1))
if [[ ! -f "$STUB_DIR/gh-issue-create.log" ]]; then
  PASS=$((PASS + 1)); echo "  PASS: declined event filed no issue"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: declined event filed no issue"
  echo "    gh-issue-create.log: $(cat "$STUB_DIR/gh-issue-create.log")"
fi
cal_teardown

# --- Test 5: Rule 2 — passed reminder files one issue -----------------------

echo "Test: dispatch-jit-calendar-import Rule 2 (passed reminder) files one issue"
cal_setup
# Event tomorrow 15:00Z. With reminders.useDefault=false and overrides
# minutes=1500, trigger = start - 90000 = 1779804000 = NOW - 3600 < NOW.
cat > "$STUB_DIR/events.json" <<'EOF'
{
  "items": [
    {
      "id": "evt-tomorrow",
      "status": "confirmed",
      "summary": "Tomorrow meeting",
      "start": {"dateTime": "2026-05-27T15:00:00Z"},
      "end":   {"dateTime": "2026-05-27T16:00:00Z"},
      "reminders": {
        "useDefault": false,
        "overrides": [{"method": "popup", "minutes": 1500}]
      }
    }
  ]
}
EOF
rc=0
out=$("$TMPDIR_TEST/scripts/dispatch-jit-calendar-import" 2>/dev/null) || rc=$?
assert_eq "rule-2 exits 0" "0" "$rc"
TOTAL=$((TOTAL + 1))
if [[ "$out" == *"calendar: created #777 (evt-tomorrow)"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: rule-2 reports created #777 (evt-tomorrow)"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: rule-2 reports created #777 (evt-tomorrow)"
  echo "    actual: $out"
fi
cal_teardown

# --- Test 6: Rule 2 — future reminder only files nothing --------------------

echo "Test: dispatch-jit-calendar-import skips events whose reminder is still in the future"
cal_setup
# Same tomorrow event, but the only reminder is 30 min — trigger is well in
# the future, and Rule 1 doesn't apply (start is past today's end).
cat > "$STUB_DIR/events.json" <<'EOF'
{
  "items": [
    {
      "id": "evt-future-reminder",
      "status": "confirmed",
      "summary": "Tomorrow meeting future reminder",
      "start": {"dateTime": "2026-05-27T15:00:00Z"},
      "end":   {"dateTime": "2026-05-27T16:00:00Z"},
      "reminders": {
        "useDefault": false,
        "overrides": [{"method": "popup", "minutes": 30}]
      }
    }
  ]
}
EOF
rc=0
out=$("$TMPDIR_TEST/scripts/dispatch-jit-calendar-import" 2>/dev/null) || rc=$?
assert_eq "future-reminder exits 0" "0" "$rc"
TOTAL=$((TOTAL + 1))
if [[ ! -f "$STUB_DIR/gh-issue-create.log" ]]; then
  PASS=$((PASS + 1)); echo "  PASS: future-reminder filed no issue"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: future-reminder filed no issue"
  echo "    gh-issue-create.log: $(cat "$STUB_DIR/gh-issue-create.log")"
fi
cal_teardown

# --- Test 7: an event matching both rules yields exactly one issue ----------

echo "Test: dispatch-jit-calendar-import dedups an event matching both rules to one issue"
cal_setup
# Event today (Rule 1 satisfied) AND with a 120-min reminder whose trigger is
# already in the past (Rule 2 satisfied) — exactly one issue must result.
cat > "$STUB_DIR/events.json" <<'EOF'
{
  "items": [
    {
      "id": "evt-both",
      "status": "confirmed",
      "summary": "Both-rules meeting",
      "start": {"dateTime": "2026-05-26T16:00:00Z"},
      "end":   {"dateTime": "2026-05-26T17:00:00Z"},
      "reminders": {
        "useDefault": false,
        "overrides": [{"method": "popup", "minutes": 120}]
      }
    }
  ]
}
EOF
rc=0
out=$("$TMPDIR_TEST/scripts/dispatch-jit-calendar-import" 2>/dev/null) || rc=$?
assert_eq "both-rules exits 0" "0" "$rc"
TOTAL=$((TOTAL + 1))
# Count create invocations, not log lines: the --body arg contains embedded
# newlines, so one create spans multiple lines in the log.
create_lines=0
[[ -f "$STUB_DIR/gh-issue-create.log" ]] \
  && create_lines=$(grep -c "^issue create" "$STUB_DIR/gh-issue-create.log")
if [[ "$create_lines" -eq 1 ]]; then
  PASS=$((PASS + 1)); echo "  PASS: both-rules filed exactly one issue"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: both-rules filed exactly one issue"
  echo "    gh-issue-create.log: $(cat "$STUB_DIR/gh-issue-create.log" 2>&1)"
fi
cal_teardown

# --- Test 8: open-issue guard + closed prior does NOT suppress --------------

echo "Test: dispatch-jit-calendar-import skips events whose ID has an open issue"
cal_setup
# Two events: evt-suppress already has an open issue; evt-fresh is new.
# A closed prior for evt-fresh is NOT visible to --state open, so the open
# scan returns only evt-suppress — evt-fresh must still be filed.
cat > "$STUB_DIR/events.json" <<'EOF'
{
  "items": [
    {
      "id": "evt-suppress",
      "status": "confirmed",
      "summary": "Already-open meeting",
      "start": {"dateTime": "2026-05-26T16:00:00Z"},
      "end":   {"dateTime": "2026-05-26T17:00:00Z"},
      "reminders": {"useDefault": true}
    },
    {
      "id": "evt-fresh",
      "status": "confirmed",
      "summary": "Fresh meeting",
      "start": {"dateTime": "2026-05-26T18:00:00Z"},
      "end":   {"dateTime": "2026-05-26T19:00:00Z"},
      "reminders": {"useDefault": true}
    }
  ]
}
EOF
cat > "$STUB_DIR/open-issues.json" <<'EOF'
[
  {
    "number": 42,
    "body": "Existing reminder.\n\n<!-- dispatch:calendar event=evt-suppress start=2026-05-26T16:00:00Z end=2026-05-26T17:00:00Z -->"
  }
]
EOF
rc=0
out=$("$TMPDIR_TEST/scripts/dispatch-jit-calendar-import" 2>/dev/null) || rc=$?
assert_eq "open-guard exits 0" "0" "$rc"
TOTAL=$((TOTAL + 1))
create_lines=0
[[ -f "$STUB_DIR/gh-issue-create.log" ]] \
  && create_lines=$(grep -c "^issue create" "$STUB_DIR/gh-issue-create.log")
if [[ "$create_lines" -eq 1 ]]; then
  PASS=$((PASS + 1)); echo "  PASS: open-guard filed only evt-fresh (one create)"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: open-guard filed only evt-fresh (one create)"
  echo "    gh-issue-create.log: $(cat "$STUB_DIR/gh-issue-create.log" 2>&1)"
fi
TOTAL=$((TOTAL + 1))
create_args=$(cat "$STUB_DIR/gh-issue-create.log" 2>/dev/null || echo "")
if [[ "$create_args" == *"event=evt-fresh"* && "$create_args" != *"event=evt-suppress"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: open-guard filed evt-fresh and not evt-suppress"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: open-guard filed evt-fresh and not evt-suppress"
  echo "    gh-issue-create.log: $create_args"
fi
cal_teardown

# --- Test 9: past-event issue is closed -------------------------------------

echo "Test: dispatch-jit-calendar-import closes past-event issues"
cal_setup
# An open issue whose recorded end is yesterday — must be closed.
cat > "$STUB_DIR/open-issues.json" <<'EOF'
[
  {
    "number": 91,
    "body": "Past reminder.\n\n<!-- dispatch:calendar event=evt-past start=2026-05-25T10:00:00Z end=2026-05-25T11:00:00Z -->"
  }
]
EOF
# No upcoming events.
echo '{"items":[]}' > "$STUB_DIR/events.json"
rc=0
out=$("$TMPDIR_TEST/scripts/dispatch-jit-calendar-import" 2>/dev/null) || rc=$?
assert_eq "close-past exits 0" "0" "$rc"
TOTAL=$((TOTAL + 1))
if [[ "$out" == *"calendar: closed #91 (evt-past)"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: close-past reports closed #91 (evt-past)"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: close-past reports closed #91 (evt-past)"
  echo "    actual: $out"
fi
TOTAL=$((TOTAL + 1))
close_args=$(cat "$STUB_DIR/gh-issue-close.log" 2>/dev/null || echo "")
if [[ "$close_args" == *"issue close 91"* && "$close_args" == *"--comment"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: close-past invoked gh issue close 91 with a --comment"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: close-past invoked gh issue close 91 with a --comment"
  echo "    gh-issue-close.log: $close_args"
fi
cal_teardown

# --- Test 9b: marker forgery via event description is not trusted -----------
# An attacker who controls an event's description can embed a fake
# <!-- dispatch:calendar ... --> marker. Because the description is placed in
# the issue body BEFORE the canonical marker (appended last), parse_marker must
# take the LAST match. A first-match parse would let the fake marker spoof
# another event's identity: close the wrong issue and suppress the victim
# event's reminder. This test pins the last-match defense end to end.

echo "Test: dispatch-jit-calendar-import ignores a forged marker embedded ahead of the real one"
cal_setup
# Open issue #92: its real marker (evt-real, end in the FUTURE → must not close)
# is preceded by a forged marker claiming evt-victim with a PAST end.
cat > "$STUB_DIR/open-issues.json" <<'EOF'
[
  {
    "number": 92,
    "body": "Existing reminder.\n\n<!-- dispatch:calendar event=evt-victim start=2020-01-01T00:00:00Z end=2020-01-01T00:00:00Z -->\n\n<!-- dispatch:calendar event=evt-real start=2026-05-26T16:00:00Z end=2026-05-26T17:00:00Z -->"
  }
]
EOF
# A real today event whose ID matches the forged marker's victim claim. With the
# last-match defense, evt-victim is NOT in the open-event set, so it is filed.
cat > "$STUB_DIR/events.json" <<'EOF'
{
  "items": [
    {
      "id": "evt-victim",
      "status": "confirmed",
      "summary": "Victim meeting",
      "start": {"dateTime": "2026-05-26T16:00:00Z"},
      "end":   {"dateTime": "2026-05-26T17:00:00Z"},
      "reminders": {"useDefault": true}
    }
  ]
}
EOF
rc=0
out=$("$TMPDIR_TEST/scripts/dispatch-jit-calendar-import" 2>/dev/null) || rc=$?
assert_eq "forged-marker exits 0" "0" "$rc"
# Defense 1: the issue with the future real end is NOT closed (the forged past
# end must not drive a close).
TOTAL=$((TOTAL + 1))
close_args=$(cat "$STUB_DIR/gh-issue-close.log" 2>/dev/null || echo "")
if [[ "$close_args" != *"issue close 92"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: forged past-end marker does not close issue #92"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: forged past-end marker does not close issue #92"
  echo "    gh-issue-close.log: $close_args"
fi
# Defense 2: the forged victim ID does not suppress the real victim event — it
# is still filed (a first-match parse would have skipped it as already-open).
TOTAL=$((TOTAL + 1))
if [[ "$out" == *"calendar: created #777 (evt-victim)"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: forged marker does not suppress the real evt-victim reminder"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: forged marker does not suppress the real evt-victim reminder"
  echo "    actual: $out"
fi
cal_teardown

# --- Test 10: env-var overrides for CALENDAR_REPO + CALENDAR_LABEL ----------

echo "Test: dispatch-jit-calendar-import honors CALENDAR_REPO and CALENDAR_LABEL overrides"
cal_setup
export CALENDAR_REPO="custom-owner/custom-repo"
export CALENDAR_LABEL="custom-label"
cat > "$STUB_DIR/events.json" <<'EOF'
{
  "items": [
    {
      "id": "evt-override",
      "status": "confirmed",
      "summary": "Override-check meeting",
      "start": {"dateTime": "2026-05-26T16:00:00Z"},
      "end":   {"dateTime": "2026-05-26T17:00:00Z"},
      "reminders": {"useDefault": true}
    }
  ]
}
EOF
rc=0
out=$("$TMPDIR_TEST/scripts/dispatch-jit-calendar-import" 2>/dev/null) || rc=$?
assert_eq "overrides exits 0" "0" "$rc"
gh_calls=$(cat "$STUB_DIR/gh-calls.log")
TOTAL=$((TOTAL + 1))
if [[ "$gh_calls" == *"--repo custom-owner/custom-repo"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: overrides used --repo custom-owner/custom-repo"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: overrides used --repo custom-owner/custom-repo"
  echo "    gh-calls.log: $gh_calls"
fi
TOTAL=$((TOTAL + 1))
if [[ "$gh_calls" == *"--label custom-label"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: overrides used --label custom-label"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: overrides used --label custom-label"
  echo "    gh-calls.log: $gh_calls"
fi
cal_teardown

# --- Test 11: all-day event files an issue with "all-day" title -------------

echo "Test: dispatch-jit-calendar-import files all-day events with date-only start/end"
cal_setup
# All-day event today — Google Calendar uses start.date / end.date (no time)
# and end is exclusive. Tomorrow's date end makes it cover today.
cat > "$STUB_DIR/events.json" <<'EOF'
{
  "items": [
    {
      "id": "evt-allday",
      "status": "confirmed",
      "summary": "Birthday",
      "start": {"date": "2026-05-26"},
      "end":   {"date": "2026-05-27"},
      "reminders": {"useDefault": true}
    }
  ]
}
EOF
rc=0
out=$("$TMPDIR_TEST/scripts/dispatch-jit-calendar-import" 2>/dev/null) || rc=$?
assert_eq "all-day exits 0" "0" "$rc"
TOTAL=$((TOTAL + 1))
if [[ "$out" == *"calendar: created #777 (evt-allday)"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: all-day reports created #777 (evt-allday)"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: all-day reports created #777 (evt-allday)"
  echo "    actual: $out"
fi
TOTAL=$((TOTAL + 1))
create_args=$(cat "$STUB_DIR/gh-issue-create.log" 2>/dev/null || echo "")
if [[ "$create_args" == *"event=evt-allday"* \
   && "$create_args" == *"start=2026-05-26"* \
   && "$create_args" == *"end=2026-05-27"* \
   && "$create_args" == *"(all-day)"* \
   && "$create_args" != *"(00:00)"* ]]; then
  PASS=$((PASS + 1))
  echo "  PASS: all-day title and body carry (all-day), not (00:00)"
else
  FAIL=$((FAIL + 1))
  echo "  FAIL: all-day title and body carry (all-day), not (00:00)"
  echo "    gh-issue-create.log: $create_args"
fi
cal_teardown

# --- Test 12: Rule 1 — late-night event in the 23:00–midnight window ---------

echo "Test: dispatch-jit-calendar-import files a today event starting after 23:00 local"
cal_setup
# Event today starting 23:30Z — inside the final hour before midnight. Its only
# reminder (default popup 10m) triggers at 23:20Z, still in the future, so Rule 2
# does not fire: the event qualifies via Rule 1 alone. This locks in the
# END_OF_TODAY_LOCAL = next-midnight boundary; a 23:00 boundary would silently
# drop it.
cat > "$STUB_DIR/events.json" <<'EOF'
{
  "items": [
    {
      "id": "evt-late-night",
      "status": "confirmed",
      "summary": "Late night call",
      "start": {"dateTime": "2026-05-26T23:30:00Z"},
      "end":   {"dateTime": "2026-05-26T23:45:00Z"},
      "reminders": {"useDefault": true}
    }
  ]
}
EOF
rc=0
out=$("$TMPDIR_TEST/scripts/dispatch-jit-calendar-import" 2>/dev/null) || rc=$?
assert_eq "late-night exits 0" "0" "$rc"
TOTAL=$((TOTAL + 1))
if [[ "$out" == *"calendar: created #777 (evt-late-night)"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: late-night event filed via Rule 1"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: late-night event filed via Rule 1"
  echo "    actual: $out"
fi
cal_teardown

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

  # Fake repo root whose go.mod files drive genuine module discovery.
  FAKE_REPO="$TEST_TMP/repo"
  mkdir -p "$FAKE_REPO/budget-etl" \
           "$FAKE_REPO/scaffolding/firebase" \
           "$FAKE_REPO/productivity-tui"
  : > "$FAKE_REPO/budget-etl/go.mod"
  : > "$FAKE_REPO/scaffolding/firebase/go.mod"
  : > "$FAKE_REPO/productivity-tui/go.mod"

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
  cat > "$STUB_BIN/git" <<GITEOF
#!/usr/bin/env bash
set -euo pipefail
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
assert_eq "detect-changes: rules=true for rules-test/ path"        "true"  "$(dc_run rules 'rules-test/x')"
assert_eq "detect-changes: rules=true for detect-changes.sh self"  "true"  "$(dc_run rules '.claude/skills/dispatch-propagate/scripts/detect-changes.sh')"
assert_eq "detect-changes: rules=true for firebase.json"           "true"  "$(dc_run rules 'firebase.json')"
assert_eq "detect-changes: rules=true for package.json"            "true"  "$(dc_run rules 'package.json')"
assert_eq "detect-changes: rules absent for unrelated path"        "false" "$(dc_run rules 'README.md')"
dc_teardown

# --- go (the core of #749: regex must cover every discovered module root) ---
dc_setup
assert_eq "detect-changes: go=true for budget-etl module"           "true"  "$(dc_run go 'budget-etl/main.go')"
assert_eq "detect-changes: go=true for scaffolding/firebase module" "true"  "$(dc_run go 'scaffolding/firebase/x.go')"
assert_eq "detect-changes: go=true for productivity-tui module"     "true"  "$(dc_run go 'productivity-tui/y.go')"
assert_eq "detect-changes: go absent for non-Go path"               "false" "$(dc_run go 'README.md')"
dc_teardown

# --- combined multi-file diff sets multiple categories ---
dc_setup
assert_eq "detect-changes: combined diff sets nix=true" "true" "$(dc_run nix 'flake.nix' 'budget-etl/main.go')"
assert_eq "detect-changes: combined diff sets go=true"  "true" "$(dc_run go  'flake.nix' 'budget-etl/main.go')"
dc_teardown

# --- empty diff sets none of the four keys ---
dc_setup
assert_eq "detect-changes: empty diff leaves nix unset"        "false" "$(dc_run nix)"
assert_eq "detect-changes: empty diff leaves playwright unset" "false" "$(dc_run playwright)"
assert_eq "detect-changes: empty diff leaves rules unset"      "false" "$(dc_run rules)"
assert_eq "detect-changes: empty diff leaves go unset"         "false" "$(dc_run go)"
dc_teardown

# ============================================================================
# dispatch-select-tick tests (#919)
# ============================================================================
# The orchestrator runs against the REAL dispatch-acquire-lock (so lock-file
# state is genuine and the three-guard lock invariant is asserted directly via
# DISPATCH_LOCK_FILE) and against FAKE sub-scripts for jit-engine / resolve-arg
# / select-target (so each decision line is driven deterministically). git is
# PATH-shimmed to control the branch and the main-sync result.
echo ""
echo "=== dispatch-select-tick ==="

sel_tick_setup() {
  TMPDIR_TEST=$(mktemp -d)
  STUB_DIR="$TMPDIR_TEST/stub"
  mkdir -p "$STUB_DIR" "$TMPDIR_TEST/bin"

  cp "$SCRIPT_DIR/dispatch-select-tick" "$TMPDIR_TEST/dispatch-select-tick"
  cp "$SCRIPT_DIR/dispatch-acquire-lock" "$TMPDIR_TEST/dispatch-acquire-lock"
  chmod +x "$TMPDIR_TEST/dispatch-select-tick" "$TMPDIR_TEST/dispatch-acquire-lock"

  export DISPATCH_LOCK_FILE="$STUB_DIR/dispatch.lock"
  export CLAUDE_CODE_SESSION_ID="select-tick-session"
  # Fake `claude agents --json`: our own session is live → first acquisition
  # succeeds and a strict self-release works.
  cat > "$TMPDIR_TEST/fake-claude" <<'FAKE'
#!/usr/bin/env bash
echo '[{"sessionId":"select-tick-session","pid":1,"status":"busy","name":"x","cwd":""}]'
FAKE
  chmod +x "$TMPDIR_TEST/fake-claude"
  export CLAUDE_AGENTS_CMD="$TMPDIR_TEST/fake-claude"
  # Single-shot --wait so a busy test never blocks the suite.
  export DISPATCH_LOCK_WAIT_TIMEOUT=0
  export DISPATCH_LOCK_WAIT_INTERVAL=1

  # Default fake sub-scripts (overridable per test) — land in TMPDIR_TEST so the
  # orchestrator's SCRIPT_DIR resolution finds them.
  cat > "$TMPDIR_TEST/dispatch-jit-engine" <<'FAKE'
#!/usr/bin/env bash
exit 0
FAKE
  cat > "$TMPDIR_TEST/dispatch-resolve-arg" <<'FAKE'
#!/usr/bin/env bash
echo "$1"
FAKE
  cat > "$TMPDIR_TEST/dispatch-select-target" <<'FAKE'
#!/usr/bin/env bash
echo empty
FAKE
  chmod +x "$TMPDIR_TEST/dispatch-jit-engine" \
           "$TMPDIR_TEST/dispatch-resolve-arg" \
           "$TMPDIR_TEST/dispatch-select-target"

  # PATH-shimmed git: branch defaults to main; fetch/merge succeed unless a
  # FAKE_GIT_*_FAIL env var is set.
  cat > "$TMPDIR_TEST/bin/git" <<'STUB'
#!/usr/bin/env bash
case "$*" in
  "rev-parse --abbrev-ref HEAD") echo "${FAKE_GIT_BRANCH:-main}" ;;
  "fetch origin main") [[ -n "${FAKE_GIT_FETCH_FAIL:-}" ]] && exit 1 ; exit 0 ;;
  "merge --ff-only origin/main") [[ -n "${FAKE_GIT_MERGE_FAIL:-}" ]] && exit 1 ; exit 0 ;;
  *) exit 0 ;;
esac
STUB
  chmod +x "$TMPDIR_TEST/bin/git"
  export PATH="$TMPDIR_TEST/bin:$SAVED_PATH"
}

sel_tick_teardown() {
  export PATH="$SAVED_PATH"
  rm -rf "$TMPDIR_TEST"
  TMPDIR_TEST="" ; STUB_DIR=""
  unset DISPATCH_LOCK_FILE CLAUDE_CODE_SESSION_ID CLAUDE_AGENTS_CMD \
    DISPATCH_LOCK_WAIT_TIMEOUT DISPATCH_LOCK_WAIT_INTERVAL \
    FAKE_GIT_BRANCH FAKE_GIT_FETCH_FAIL FAKE_GIT_MERGE_FAIL
}

# Run the orchestrator, capturing full stdout; the decision is the last line.
run_sel_tick() {
  "$TMPDIR_TEST/dispatch-select-tick" "$@" 2>/dev/null
}

# --- empty queue → release + empty ------------------------------------------
echo "Test: select-tick empty queue → empty, lock released"
sel_tick_setup
out=$(run_sel_tick) ; rc=$?
assert_eq "empty: exit 0" "0" "$rc"
assert_eq "empty: decision line" "empty" "$(printf '%s\n' "$out" | tail -n 1)"
assert_eq "empty: lock released" "" "$(cat "$DISPATCH_LOCK_FILE")"
sel_tick_teardown

# --- pr selection → passthrough + lock HELD ----------------------------------
echo "Test: select-tick pr selection → passthrough, lock held"
sel_tick_setup
cat > "$TMPDIR_TEST/dispatch-select-target" <<'FAKE'
#!/usr/bin/env bash
echo "pr 660 660-some-branch code-review"
FAKE
chmod +x "$TMPDIR_TEST/dispatch-select-target"
out=$(run_sel_tick)
assert_eq "pr: decision line" "pr 660 660-some-branch code-review" \
  "$(printf '%s\n' "$out" | tail -n 1)"
assert_eq "pr: lock held (our session)" "select-tick-session" \
  "$(cat "$DISPATCH_LOCK_FILE")"
sel_tick_teardown

# --- issue selection → passthrough + lock HELD -------------------------------
echo "Test: select-tick issue selection → passthrough, lock held"
sel_tick_setup
cat > "$TMPDIR_TEST/dispatch-select-target" <<'FAKE'
#!/usr/bin/env bash
echo "issue 707"
FAKE
chmod +x "$TMPDIR_TEST/dispatch-select-target"
out=$(run_sel_tick)
assert_eq "issue: decision line" "issue 707" "$(printf '%s\n' "$out" | tail -n 1)"
assert_eq "issue: lock held" "select-tick-session" "$(cat "$DISPATCH_LOCK_FILE")"
sel_tick_teardown

# --- main-broken → passthrough + lock HELD (sub-skill releases) --------------
echo "Test: select-tick main-broken → passthrough, lock held"
sel_tick_setup
cat > "$TMPDIR_TEST/dispatch-select-target" <<'FAKE'
#!/usr/bin/env bash
echo "main-broken abc1234"
FAKE
chmod +x "$TMPDIR_TEST/dispatch-select-target"
out=$(run_sel_tick)
assert_eq "main-broken: decision line" "main-broken abc1234" \
  "$(printf '%s\n' "$out" | tail -n 1)"
assert_eq "main-broken: lock held" "select-tick-session" \
  "$(cat "$DISPATCH_LOCK_FILE")"
sel_tick_teardown

# --- jit-reminder → passthrough + lock HELD ----------------------------------
echo "Test: select-tick jit-reminder → passthrough, lock held"
sel_tick_setup
cat > "$TMPDIR_TEST/dispatch-select-target" <<'FAKE'
#!/usr/bin/env bash
echo "jit-reminder owner/repo 42 PVT_x ITEM_y"
FAKE
chmod +x "$TMPDIR_TEST/dispatch-select-target"
out=$(run_sel_tick)
assert_eq "jit-reminder: decision line" "jit-reminder owner/repo 42 PVT_x ITEM_y" \
  "$(printf '%s\n' "$out" | tail -n 1)"
assert_eq "jit-reminder: lock held" "select-tick-session" \
  "$(cat "$DISPATCH_LOCK_FILE")"
sel_tick_teardown

# --- explicit arg resolves → explicit <num> + lock HELD ----------------------
echo "Test: select-tick explicit arg → explicit <num>, lock held"
sel_tick_setup
out=$(run_sel_tick 55)
assert_eq "explicit: decision line" "explicit 55" "$(printf '%s\n' "$out" | tail -n 1)"
assert_eq "explicit: lock held" "select-tick-session" "$(cat "$DISPATCH_LOCK_FILE")"
sel_tick_teardown

# --- explicit arg leading '#' is stripped ------------------------------------
echo "Test: select-tick explicit arg strips leading '#'"
sel_tick_setup
out=$(run_sel_tick '#88')
assert_eq "explicit '#': decision line" "explicit 88" \
  "$(printf '%s\n' "$out" | tail -n 1)"
sel_tick_teardown

# --- resolver failure (garbage arg) → release + resolver-failed --------------
echo "Test: select-tick resolver failure → resolver-failed, lock released"
sel_tick_setup
cat > "$TMPDIR_TEST/dispatch-resolve-arg" <<'FAKE'
#!/usr/bin/env bash
echo "error: bad arg" >&2
exit 1
FAKE
chmod +x "$TMPDIR_TEST/dispatch-resolve-arg"
out=$(run_sel_tick abc)
assert_eq "resolver-failed: decision line" "resolver-failed" \
  "$(printf '%s\n' "$out" | tail -n 1)"
assert_eq "resolver-failed: lock released" "" "$(cat "$DISPATCH_LOCK_FILE")"
sel_tick_teardown

# --- sync failure on main → release + sync-failed ----------------------------
echo "Test: select-tick sync failure on main → sync-failed, lock released"
sel_tick_setup
export FAKE_GIT_FETCH_FAIL=1
out=$(run_sel_tick)
assert_eq "sync-failed: decision line" "sync-failed" \
  "$(printf '%s\n' "$out" | tail -n 1)"
assert_eq "sync-failed: lock released" "" "$(cat "$DISPATCH_LOCK_FILE")"
sel_tick_teardown

# --- off-main: main-sync skipped (fetch-fail does NOT trigger sync-failed) ----
echo "Test: select-tick off main skips sync (fetch-fail ignored)"
sel_tick_setup
export FAKE_GIT_BRANCH="707-some-branch"
export FAKE_GIT_FETCH_FAIL=1
out=$(run_sel_tick)
assert_eq "off-main: reaches selection (empty, not sync-failed)" "empty" \
  "$(printf '%s\n' "$out" | tail -n 1)"
sel_tick_teardown

# --- JIT created lines are passed through, prefixed --------------------------
echo "Test: select-tick passes JIT output through prefixed"
sel_tick_setup
cat > "$TMPDIR_TEST/dispatch-jit-engine" <<'FAKE'
#!/usr/bin/env bash
echo "weekly-review: created #42"
echo "standup: debounced"
FAKE
chmod +x "$TMPDIR_TEST/dispatch-jit-engine"
out=$(run_sel_tick)
assert_eq "jit passthrough: created line prefixed" "1" \
  "$(printf '%s\n' "$out" | grep -cF 'jit: weekly-review: created #42')"
assert_eq "jit passthrough: debounced line prefixed" "1" \
  "$(printf '%s\n' "$out" | grep -cF 'jit: standup: debounced')"
assert_eq "jit passthrough: decision still last" "empty" \
  "$(printf '%s\n' "$out" | tail -n 1)"
sel_tick_teardown

# --- busy lock → busy, nothing acquired, nothing released --------------------
echo "Test: select-tick busy lock → busy, foreign holder untouched"
sel_tick_setup
# Pre-fill the lock with a DIFFERENT, live session so --wait gives up as busy.
printf '%s\n' "other-live-session" > "$DISPATCH_LOCK_FILE"
cat > "$TMPDIR_TEST/fake-claude" <<'FAKE'
#!/usr/bin/env bash
echo '[{"sessionId":"other-live-session","pid":2,"status":"busy","name":"x","cwd":""}]'
FAKE
chmod +x "$TMPDIR_TEST/fake-claude"
out=$(run_sel_tick)
assert_eq "busy: decision line" "busy" "$(printf '%s\n' "$out" | tail -n 1)"
assert_eq "busy: foreign holder untouched (not released)" "other-live-session" \
  "$(cat "$DISPATCH_LOCK_FILE")"
sel_tick_teardown

# --- unexpected select-target line → release + exit 2 ------------------------
echo "Test: select-tick unexpected select-target line → exit 2, lock released"
sel_tick_setup
cat > "$TMPDIR_TEST/dispatch-select-target" <<'FAKE'
#!/usr/bin/env bash
echo "garbage unexpected line"
FAKE
chmod +x "$TMPDIR_TEST/dispatch-select-target"
err=$("$TMPDIR_TEST/dispatch-select-tick" 2>&1 1>/dev/null && echo "EXIT=0" || echo "EXIT=$?")
case "$err" in
  *"emitted unexpected"*"EXIT=2") status="ok" ;;
  *) status="bad: $err" ;;
esac
assert_eq "unexpected select-target → error + exit 2" "ok" "$status"
assert_eq "unexpected select-target: lock released" "" "$(cat "$DISPATCH_LOCK_FILE")"
sel_tick_teardown

# --- extra arguments → usage error, exit 2 -----------------------------------
echo "Test: select-tick extra arguments → exit 2"
sel_tick_setup
err=$("$TMPDIR_TEST/dispatch-select-tick" 1 2 2>&1 1>/dev/null && echo "EXIT=0" || echo "EXIT=$?")
case "$err" in
  *"unexpected extra arguments"*"EXIT=2") status="ok" ;;
  *) status="bad: $err" ;;
esac
assert_eq "extra args → usage error, exit 2" "ok" "$status"
sel_tick_teardown

# ============================================================================
# dispatch-materialize-spawn tests (#919)
# ============================================================================
# Runs against the REAL dispatch-materialize-spawn / dispatch-finalize-selection
# / dispatch-acquire-lock (so the marker-write + lock-release are genuine and
# asserted via DISPATCH_LOCK_FILE and the on-disk marker) and FAKE sub-scripts
# for every guard / resolve / phase / budget / spawn step (so each terminal
# token is driven deterministically). git/direnv/gh are PATH-shimmed.
echo ""
echo "=== dispatch-materialize-spawn ==="

mat_setup() {
  TMPDIR_TEST=$(mktemp -d)
  STUB_DIR="$TMPDIR_TEST/stub"
  mkdir -p "$STUB_DIR" "$TMPDIR_TEST/bin" "$TMPDIR_TEST/logs"

  for s in dispatch-materialize-spawn dispatch-finalize-selection dispatch-acquire-lock; do
    cp "$SCRIPT_DIR/$s" "$TMPDIR_TEST/$s"
    chmod +x "$TMPDIR_TEST/$s"
  done

  # Real lock under our control; we hold it so finalize-selection / release do a
  # strict self-release.
  export DISPATCH_LOCK_FILE="$STUB_DIR/dispatch.lock"
  export CLAUDE_CODE_SESSION_ID="mat-session"
  printf '%s\n' "mat-session" > "$DISPATCH_LOCK_FILE"
  cat > "$TMPDIR_TEST/fake-claude" <<'FAKE'
#!/usr/bin/env bash
echo '[{"sessionId":"mat-session","pid":1,"status":"busy","name":"x","cwd":""}]'
FAKE
  chmod +x "$TMPDIR_TEST/fake-claude"
  export CLAUDE_AGENTS_CMD="$TMPDIR_TEST/fake-claude"

  # Fake sub-scripts (defaults; per-test overrides via MAT_* env vars).
  cat > "$TMPDIR_TEST/dispatch-find-pr" <<'FAKE'
#!/usr/bin/env bash
[[ -n "${MAT_PR:-}" ]] && echo "$MAT_PR"
exit 0
FAKE
  cat > "$TMPDIR_TEST/dispatch-trace-leaf" <<FAKE
#!/usr/bin/env bash
echo "trace \$*" >> "$TMPDIR_TEST/logs/trace-leaf.log"
echo "\${MAT_LEAF:-\$1}"
FAKE
  cat > "$TMPDIR_TEST/dispatch-check-blockers" <<'FAKE'
#!/usr/bin/env bash
if [[ -n "${MAT_BLOCKED:-}" ]]; then echo "blocked:$MAT_BLOCKED"; exit 2; fi
exit 0
FAKE
  cat > "$TMPDIR_TEST/dispatch-apply-office-hours" <<FAKE
#!/usr/bin/env bash
echo "\$*" >> "$TMPDIR_TEST/logs/apply-office-hours.log"
exit 0
FAKE
  cat > "$TMPDIR_TEST/dispatch-resolve-worktree" <<FAKE
#!/usr/bin/env bash
echo "\${MAT_WT_DECISION:-create \$1-test}"
FAKE
  cat > "$TMPDIR_TEST/dispatch-phase" <<'FAKE'
#!/usr/bin/env bash
echo "${MAT_PHASE:-implement}"
FAKE
  cat > "$TMPDIR_TEST/dispatch-target-workers" <<'FAKE'
#!/usr/bin/env bash
echo "${MAT_TARGET_N:-1}"
FAKE
  cat > "$TMPDIR_TEST/dispatch-schedule-reseed" <<FAKE
#!/usr/bin/env bash
echo called >> "$TMPDIR_TEST/logs/schedule-reseed.log"
exit 0
FAKE
  cat > "$TMPDIR_TEST/dispatch-spawn-worker" <<FAKE
#!/usr/bin/env bash
echo "\$*" >> "$TMPDIR_TEST/logs/spawn-worker.log"
echo spawned
exit \${MAT_SPAWN_RC:-0}
FAKE
  cat > "$TMPDIR_TEST/sync-issue-context" <<FAKE
#!/usr/bin/env bash
echo "cwd=\$PWD argv=\$*" >> "$TMPDIR_TEST/logs/sync-issue-context.log"
FAKE
  # Sourced helper: provides claude_agents_count_by_name_prefix.
  cat > "$TMPDIR_TEST/lib-claude-agents.sh" <<'FAKE'
claude_agents_count_by_name_prefix() {
  [[ -n "${MAT_LIVE_COUNT_FAIL:-}" ]] && return 1
  echo "${MAT_LIVE_COUNT:-0}"
}
FAKE
  chmod +x "$TMPDIR_TEST"/dispatch-find-pr "$TMPDIR_TEST"/dispatch-trace-leaf \
    "$TMPDIR_TEST"/dispatch-check-blockers "$TMPDIR_TEST"/dispatch-apply-office-hours \
    "$TMPDIR_TEST"/dispatch-resolve-worktree "$TMPDIR_TEST"/dispatch-phase \
    "$TMPDIR_TEST"/dispatch-target-workers "$TMPDIR_TEST"/dispatch-schedule-reseed \
    "$TMPDIR_TEST"/dispatch-spawn-worker "$TMPDIR_TEST"/sync-issue-context

  mkdir -p "$TMPDIR_TEST/project/.bare" "$TMPDIR_TEST/project/worktrees"
  cat > "$TMPDIR_TEST/bin/git" <<STUB
#!/usr/bin/env bash
echo "\$*" >> "$TMPDIR_TEST/logs/git.log"
case "\$*" in
  "rev-parse --path-format=absolute --git-common-dir") echo "$TMPDIR_TEST/project/.bare" ;;
  "worktree add -b "*) mkdir -p "\$5" ;;
  *) : ;;
esac
STUB
  cat > "$TMPDIR_TEST/bin/direnv" <<STUB
#!/usr/bin/env bash
echo "\$*" >> "$TMPDIR_TEST/logs/direnv.log"
STUB
  cat > "$TMPDIR_TEST/bin/gh" <<'STUB'
#!/usr/bin/env bash
# Only the explicit closed-check uses gh here.
echo "${MAT_ISSUE_STATE:-OPEN}"
STUB
  chmod +x "$TMPDIR_TEST/bin/git" "$TMPDIR_TEST/bin/direnv" "$TMPDIR_TEST/bin/gh"
  export PATH="$TMPDIR_TEST/bin:$SAVED_PATH"
}

mat_teardown() {
  export PATH="$SAVED_PATH"
  rm -rf "$TMPDIR_TEST"
  TMPDIR_TEST="" ; STUB_DIR=""
  unset DISPATCH_LOCK_FILE CLAUDE_CODE_SESSION_ID CLAUDE_AGENTS_CMD \
    MAT_PR MAT_LEAF MAT_BLOCKED MAT_WT_DECISION MAT_PHASE MAT_TARGET_N \
    MAT_LIVE_COUNT MAT_LIVE_COUNT_FAIL MAT_SPAWN_RC MAT_ISSUE_STATE
}

run_mat() { "$TMPDIR_TEST/dispatch-materialize-spawn" "$@" 2>/dev/null; }

# --- queue happy path → propagate (spawn called, lock released) --------------
echo "Test: materialize-spawn queue happy path → propagate"
mat_setup
out=$(run_mat 839 queue) ; rc=$?
assert_eq "queue happy: exit 0" "0" "$rc"
assert_eq "queue happy: terminal token" "propagate" "$(printf '%s\n' "$out" | tail -n 1)"
assert_eq "queue happy: spawn-worker called with issue + worktree" \
  "839 $TMPDIR_TEST/project/worktrees/839-test" \
  "$(cat "$TMPDIR_TEST/logs/spawn-worker.log")"
assert_eq "queue happy: lock released by finalize" "" "$(cat "$DISPATCH_LOCK_FILE")"
assert_eq "queue happy: marker written into target worktree" "1" \
  "$([ -f "$TMPDIR_TEST/project/worktrees/839-test/tmp/dispatch-worktree" ] && echo 1 || echo 0)"
mat_teardown

# --- queue mode skips guards (CLOSED issue still proceeds) -------------------
echo "Test: materialize-spawn queue mode skips guards (closed state ignored)"
mat_setup
export MAT_ISSUE_STATE=CLOSED
export MAT_BLOCKED="999"
out=$(run_mat 839 queue)
assert_eq "queue skips guards: terminal token" "propagate" \
  "$(printf '%s\n' "$out" | tail -n 1)"
assert_eq "queue skips guards: no office-hours park" "0" \
  "$([ -f "$TMPDIR_TEST/logs/apply-office-hours.log" ] && echo 1 || echo 0)"
mat_teardown

# --- explicit happy path → propagate -----------------------------------------
echo "Test: materialize-spawn explicit happy path → propagate"
mat_setup
out=$(run_mat 839 explicit)
assert_eq "explicit happy: terminal token" "propagate" \
  "$(printf '%s\n' "$out" | tail -n 1)"
mat_teardown

# --- explicit closed target → notify target-blocked --------------------------
echo "Test: materialize-spawn explicit closed target → notify target-blocked"
mat_setup
export MAT_ISSUE_STATE=CLOSED
out=$(run_mat 839 explicit)
assert_eq "explicit closed: terminal token" "notify target-blocked" \
  "$(printf '%s\n' "$out" | tail -n 1)"
assert_eq "explicit closed: office-hours park reason" "839 named target issue is closed" \
  "$(cat "$TMPDIR_TEST/logs/apply-office-hours.log")"
assert_eq "explicit closed: lock released" "" "$(cat "$DISPATCH_LOCK_FILE")"
assert_eq "explicit closed: no spawn" "0" \
  "$([ -f "$TMPDIR_TEST/logs/spawn-worker.log" ] && echo 1 || echo 0)"
mat_teardown

# --- explicit open blocker → notify target-blocked ---------------------------
echo "Test: materialize-spawn explicit open blocker → notify target-blocked"
mat_setup
export MAT_BLOCKED="777,888"
out=$(run_mat 839 explicit)
assert_eq "explicit blocked: detail line" "blocked:777,888" \
  "$(printf '%s\n' "$out" | grep '^blocked:')"
assert_eq "explicit blocked: terminal token" "notify target-blocked" \
  "$(printf '%s\n' "$out" | tail -n 1)"
assert_eq "explicit blocked: office-hours park reason" "839 target has an open blocker" \
  "$(cat "$TMPDIR_TEST/logs/apply-office-hours.log")"
assert_eq "explicit blocked: lock released" "" "$(cat "$DISPATCH_LOCK_FILE")"
mat_teardown

# --- explicit leaf-trace retargets N (no PR) ---------------------------------
echo "Test: materialize-spawn explicit leaf-trace retargets the spawn issue"
mat_setup
export MAT_LEAF=901
out=$(run_mat 839 explicit)
assert_eq "explicit leaf: terminal token" "propagate" \
  "$(printf '%s\n' "$out" | tail -n 1)"
assert_eq "explicit leaf: spawn-worker keyed on the leaf 901" \
  "901 $TMPDIR_TEST/project/worktrees/901-test" \
  "$(cat "$TMPDIR_TEST/logs/spawn-worker.log")"
mat_teardown

# --- explicit PR exists → leaf trace skipped ---------------------------------
echo "Test: materialize-spawn explicit with a PR skips leaf trace"
mat_setup
export MAT_PR=665
export MAT_LEAF=99999   # would retarget if trace ran
out=$(run_mat 839 explicit)
assert_eq "explicit PR: terminal token" "propagate" \
  "$(printf '%s\n' "$out" | tail -n 1)"
assert_eq "explicit PR: leaf trace not consulted" "0" \
  "$([ -f "$TMPDIR_TEST/logs/trace-leaf.log" ] && echo 1 || echo 0)"
assert_eq "explicit PR: spawn keyed on original 839" \
  "839 $TMPDIR_TEST/project/worktrees/839-test" \
  "$(cat "$TMPDIR_TEST/logs/spawn-worker.log")"
mat_teardown

# --- explicit trace-leaf hard failure → exit 2, lock released, no spawn -------
# dispatch-trace-leaf's exit 1 is a hard sibling-gh failure the caller must NOT
# swallow as "no work" (its documented contract). A swallowed failure would
# dispatch the un-traced N; instead the script releases the lock and exits 2.
echo "Test: materialize-spawn explicit trace-leaf hard failure → exit 2 + lock released"
mat_setup
cat > "$TMPDIR_TEST/dispatch-trace-leaf" <<'STUB'
#!/usr/bin/env bash
echo "trace-leaf gh failure" >&2
exit 1
STUB
chmod +x "$TMPDIR_TEST/dispatch-trace-leaf"
out=$(run_mat 839 explicit) && rc=0 || rc=$?
assert_eq "trace-leaf fail: exit 2" "2" "$rc"
assert_eq "trace-leaf fail: lock released" "" "$(cat "$DISPATCH_LOCK_FILE")"
assert_eq "trace-leaf fail: no spawn" "0" \
  "$([ -f "$TMPDIR_TEST/logs/spawn-worker.log" ] && echo 1 || echo 0)"
mat_teardown

# --- resolve-worktree internal failure → exit 2, lock released, no spawn ------
# An internal sub-script failure before dispatch-finalize-selection must release
# the lock so a stuck holder does not wedge the next tick.
echo "Test: materialize-spawn resolve-worktree failure → exit 2 + lock released"
mat_setup
cat > "$TMPDIR_TEST/dispatch-resolve-worktree" <<'STUB'
#!/usr/bin/env bash
echo "resolve-worktree gh failure" >&2
exit 1
STUB
chmod +x "$TMPDIR_TEST/dispatch-resolve-worktree"
out=$(run_mat 839 queue) && rc=0 || rc=$?
assert_eq "resolve-wt fail: exit 2" "2" "$rc"
assert_eq "resolve-wt fail: lock released" "" "$(cat "$DISPATCH_LOCK_FILE")"
assert_eq "resolve-wt fail: no spawn" "0" \
  "$([ -f "$TMPDIR_TEST/logs/spawn-worker.log" ] && echo 1 || echo 0)"
mat_teardown

# --- enter path → sync-issue-context runs in the worktree --------------------
echo "Test: materialize-spawn enter path syncs context + spawns"
mat_setup
EXISTING_WT="$TMPDIR_TEST/existing-wt"
mkdir -p "$EXISTING_WT"
export MAT_WT_DECISION="enter $EXISTING_WT"
out=$(run_mat 839 queue)
assert_eq "enter: terminal token" "propagate" "$(printf '%s\n' "$out" | tail -n 1)"
assert_eq "enter: sync-issue-context ran in the worktree" "cwd=$EXISTING_WT argv=839" \
  "$(cat "$TMPDIR_TEST/logs/sync-issue-context.log")"
assert_eq "enter: marker written into the entered worktree" "1" \
  "$([ -f "$EXISTING_WT/tmp/dispatch-worktree" ] && echo 1 || echo 0)"
mat_teardown

# --- conflict → drain worktree-conflict --------------------------------------
echo "Test: materialize-spawn conflict → drain worktree-conflict"
mat_setup
export MAT_WT_DECISION="conflict $TMPDIR_TEST/some/path"
out=$(run_mat 839 queue)
assert_eq "conflict: path detail line" "path: $TMPDIR_TEST/some/path" \
  "$(printf '%s\n' "$out" | grep '^path:')"
assert_eq "conflict: terminal token" "drain worktree-conflict" \
  "$(printf '%s\n' "$out" | tail -n 1)"
assert_eq "conflict: lock released" "" "$(cat "$DISPATCH_LOCK_FILE")"
assert_eq "conflict: no spawn" "0" \
  "$([ -f "$TMPDIR_TEST/logs/spawn-worker.log" ] && echo 1 || echo 0)"
mat_teardown

# --- waiting CI → drain ci-waiting -------------------------------------------
echo "Test: materialize-spawn waiting CI → drain ci-waiting"
mat_setup
export MAT_PHASE=waiting
out=$(run_mat 839 queue)
assert_eq "ci-waiting: CI line present" "#839: CI in progress; the next router tick will re-evaluate." \
  "$(printf '%s\n' "$out" | grep '^#839:')"
assert_eq "ci-waiting: terminal token" "drain ci-waiting" \
  "$(printf '%s\n' "$out" | tail -n 1)"
assert_eq "ci-waiting: no spawn" "0" \
  "$([ -f "$TMPDIR_TEST/logs/spawn-worker.log" ] && echo 1 || echo 0)"
assert_eq "ci-waiting: lock already released by finalize" "" "$(cat "$DISPATCH_LOCK_FILE")"
mat_teardown

# --- concurrency cap → drain concurrency-cap, schedule-reseed called ---------
echo "Test: materialize-spawn live count >= target → drain concurrency-cap"
mat_setup
export MAT_LIVE_COUNT=2
export MAT_TARGET_N=1
out=$(run_mat 839 queue)
assert_eq "concurrency-cap: terminal token" "drain concurrency-cap" \
  "$(printf '%s\n' "$out" | tail -n 1)"
assert_eq "concurrency-cap: reseed scheduled" "called" \
  "$(cat "$TMPDIR_TEST/logs/schedule-reseed.log")"
assert_eq "concurrency-cap: no spawn" "0" \
  "$([ -f "$TMPDIR_TEST/logs/spawn-worker.log" ] && echo 1 || echo 0)"
mat_teardown

# --- --bypass-cap skips the concurrency gate (spawns even over budget) -------
echo "Test: materialize-spawn --bypass-cap spawns even when live count >= target"
mat_setup
export MAT_LIVE_COUNT=5
export MAT_TARGET_N=1
out=$(run_mat 839 queue --bypass-cap)
assert_eq "bypass-cap: terminal token" "propagate" \
  "$(printf '%s\n' "$out" | tail -n 1)"
assert_eq "bypass-cap: spawn called despite over budget" \
  "839 $TMPDIR_TEST/project/worktrees/839-test" \
  "$(cat "$TMPDIR_TEST/logs/spawn-worker.log")"
assert_eq "bypass-cap: no reseed scheduled" "0" \
  "$([ -f "$TMPDIR_TEST/logs/schedule-reseed.log" ] && echo 1 || echo 0)"
mat_teardown

# --- daemon UNKNOWN → fail open and spawn ------------------------------------
echo "Test: materialize-spawn daemon-query failure fails open and spawns"
mat_setup
export MAT_LIVE_COUNT_FAIL=1
out=$(run_mat 839 queue)
assert_eq "fail-open: terminal token" "propagate" \
  "$(printf '%s\n' "$out" | tail -n 1)"
assert_eq "fail-open: spawn called" "1" \
  "$([ -f "$TMPDIR_TEST/logs/spawn-worker.log" ] && echo 1 || echo 0)"
mat_teardown

# --- spawn failure → notify spawn-failed -------------------------------------
echo "Test: materialize-spawn spawn failure → notify spawn-failed"
mat_setup
export MAT_SPAWN_RC=1
out=$(run_mat 839 queue)
assert_eq "spawn-failed: terminal token" "notify spawn-failed" \
  "$(printf '%s\n' "$out" | tail -n 1)"
# spawn-failed is post-finalize: dispatch-finalize-selection already released
# the lock before the spawn attempt, so the lock must be empty here.
assert_eq "spawn-failed: lock already released by finalize" "" \
  "$(cat "$DISPATCH_LOCK_FILE")"
mat_teardown

# --- unexpected resolve-worktree line → release + exit 2 ---------------------
echo "Test: materialize-spawn unexpected resolve-worktree line → exit 2, lock released"
mat_setup
export MAT_WT_DECISION="bogus unexpected"
err=$("$TMPDIR_TEST/dispatch-materialize-spawn" 839 queue 2>&1 1>/dev/null && echo "EXIT=0" || echo "EXIT=$?")
case "$err" in
  *"emitted unexpected"*"EXIT=2") status="ok" ;;
  *) status="bad: $err" ;;
esac
assert_eq "unexpected resolve-worktree → error + exit 2" "ok" "$status"
assert_eq "unexpected resolve-worktree: lock released" "" "$(cat "$DISPATCH_LOCK_FILE")"
mat_teardown

# --- usage errors → exit 2 ---------------------------------------------------
echo "Test: materialize-spawn bad/missing args → exit 2"
mat_setup
err=$("$TMPDIR_TEST/dispatch-materialize-spawn" 839 bogus 2>&1 1>/dev/null && echo "EXIT=0" || echo "EXIT=$?")
case "$err" in *"usage:"*"EXIT=2") s1=ok ;; *) s1="bad: $err" ;; esac
assert_eq "bad mode → usage error, exit 2" "ok" "$s1"
err=$("$TMPDIR_TEST/dispatch-materialize-spawn" abc queue 2>&1 1>/dev/null && echo "EXIT=0" || echo "EXIT=$?")
case "$err" in *"usage:"*"EXIT=2") s2=ok ;; *) s2="bad: $err" ;; esac
assert_eq "non-numeric issue → usage error, exit 2" "ok" "$s2"
err=$("$TMPDIR_TEST/dispatch-materialize-spawn" 839 queue --nope 2>&1 1>/dev/null && echo "EXIT=0" || echo "EXIT=$?")
case "$err" in *"unexpected argument"*"EXIT=2") s3=ok ;; *) s3="bad: $err" ;; esac
assert_eq "unexpected 3rd arg → usage error, exit 2" "ok" "$s3"
mat_teardown

# --- create-path git worktree add failure → exit 2 + lock released -----------
# git worktree add runs unchecked under `set -uo pipefail` (no -e); a non-zero
# exit must release the lock, else the holder wedges every subsequent tick (the
# lock never frees). Regression for the unchecked-exit lock-leak.
echo "Test: materialize-spawn git worktree add failure → exit 2 + lock released"
mat_setup
cat > "$TMPDIR_TEST/bin/git" <<STUB
#!/usr/bin/env bash
echo "\$*" >> "$TMPDIR_TEST/logs/git.log"
case "\$*" in
  "rev-parse --path-format=absolute --git-common-dir") echo "$TMPDIR_TEST/project/.bare" ;;
  "worktree add -b "*) echo "fatal: branch already checked out" >&2; exit 128 ;;
  *) : ;;
esac
STUB
chmod +x "$TMPDIR_TEST/bin/git"
out=$(run_mat 839 queue) && rc=0 || rc=$?
assert_eq "wt-add fail: exit 2" "2" "$rc"
assert_eq "wt-add fail: lock released" "" "$(cat "$DISPATCH_LOCK_FILE")"
assert_eq "wt-add fail: no spawn" "0" \
  "$([ -f "$TMPDIR_TEST/logs/spawn-worker.log" ] && echo 1 || echo 0)"
mat_teardown

# --- finalize-selection failure (worktree path missing) → exit 2 + lock released
# dispatch-finalize-selection cd's into the target worktree; if that path does
# not exist its cd fails (exit 2). The caller must release the lock rather than
# proceed lock-held into the spawn. Here git worktree add "succeeds" but does NOT
# create the directory, so finalize's cd fails. Regression for the unchecked
# finalize exit.
echo "Test: materialize-spawn finalize-selection failure → exit 2 + lock released"
mat_setup
cat > "$TMPDIR_TEST/bin/git" <<STUB
#!/usr/bin/env bash
echo "\$*" >> "$TMPDIR_TEST/logs/git.log"
case "\$*" in
  "rev-parse --path-format=absolute --git-common-dir") echo "$TMPDIR_TEST/project/.bare" ;;
  "worktree add -b "*) : ;;
  *) : ;;
esac
STUB
chmod +x "$TMPDIR_TEST/bin/git"
out=$(run_mat 839 queue) && rc=0 || rc=$?
assert_eq "finalize fail: exit 2" "2" "$rc"
assert_eq "finalize fail: lock released" "" "$(cat "$DISPATCH_LOCK_FILE")"
assert_eq "finalize fail: no spawn" "0" \
  "$([ -f "$TMPDIR_TEST/logs/spawn-worker.log" ] && echo 1 || echo 0)"
mat_teardown

# --- explicit closed-check gh failure → exit 2 + lock released ---------------
# The closed-target guard must not fail open on a gh error (silently dispatching
# to a possibly-closed issue). A gh failure is a hard error: release + exit 2.
echo "Test: materialize-spawn explicit gh issue view failure → exit 2 + lock released"
mat_setup
cat > "$TMPDIR_TEST/bin/gh" <<'STUB'
#!/usr/bin/env bash
echo "gh: simulated failure" >&2
exit 1
STUB
chmod +x "$TMPDIR_TEST/bin/gh"
out=$(run_mat 839 explicit) && rc=0 || rc=$?
assert_eq "gh fail: exit 2" "2" "$rc"
assert_eq "gh fail: lock released" "" "$(cat "$DISPATCH_LOCK_FILE")"
assert_eq "gh fail: no spawn" "0" \
  "$([ -f "$TMPDIR_TEST/logs/spawn-worker.log" ] && echo 1 || echo 0)"
mat_teardown

# ============================================================================
# summary
# ============================================================================
report_results
