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
  cp "$SCRIPT_DIR/dispatch-complete-phase" "$TMPDIR_TEST/dispatch-complete-phase"
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
  chmod +x "$TMPDIR_TEST/dispatch-phase" \
           "$TMPDIR_TEST/dispatch-find-pr" \
           "$TMPDIR_TEST/dispatch-resolve-arg" \
           "$TMPDIR_TEST/dispatch-select-target" \
           "$TMPDIR_TEST/dispatch-trace-leaf" \
           "$TMPDIR_TEST/dispatch-complete-phase" \
           "$TMPDIR_TEST/dispatch-resolve-worktree" \
           "$TMPDIR_TEST/dispatch-config-load" \
           "$TMPDIR_TEST/dispatch-project-status-read"

  # JIT scan config dir. With no jit.json written into it, dispatch-config-load
  # jit returns "no-config", so jit_scan returns immediately — every existing
  # dispatch-select-target test stays green.
  mkdir -p "$TMPDIR_TEST/config"
  export DISPATCH_CONFIG_DIR="$TMPDIR_TEST/config"

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
    if [[ -f "$STUB_DIR/pr-list-full.json" ]]; then
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

# --- --health-only mode (issue #683 AC: gate before sweep) ------------------
# --health-only runs the pre-ladder bypasses and the gate, then exits without
# the queue scan. /dispatch SKILL.md calls it before dispatch-sweep so the
# sweep does not run while main is red.

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

# 27c. --health-only, main red, current branch is <N>-foo with open issue <N>
#      → "ok" (current-worktree bypass preserved).
echo "Test: --health-only + worktree branch bypasses red main"
setup
echo '[]' > "$STUB_DIR/pr-list-union.json"
echo '[]' > "$STUB_DIR/issue-list.json"
printf 'worktree /repo\nHEAD abc123\n\n' > "$STUB_DIR/worktree-list.txt"
printf '42-some-slug' > "$STUB_DIR/current-branch.txt"
printf '{"state":"OPEN"}' > "$STUB_DIR/issue-state-42.json"
printf '{"sha":"mainhead0"}' > "$STUB_DIR/main-commit.json"
printf '{"check_runs":[{"status":"completed","conclusion":"failure"}]}' \
  > "$STUB_DIR/main-check-runs.json"
printf '[]' > "$STUB_DIR/main-run-list.json"
if result=$("$TMPDIR_TEST/dispatch-select-target" --health-only); then rc=0; else rc=$?; fi
assert_eq "--health-only worktree branch bypasses red main → ok" "ok" "$result"
assert_eq "--health-only worktree branch → exit 0" "0" "$rc"
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

# 24. Help-wanted issue with a worktree is skipped; the next-oldest issue is chosen.
echo "Test: issue with worktree skipped; next-oldest issue chosen"
setup
setup_union_pr_list '[]'
# Issue 55 is older, issue 66 is newer. Issue 55 has a 55-* worktree.
printf '[{"number":55,"createdAt":"2024-01-01T00:00:00Z","labels":[{"name":"help wanted"}]},{"number":66,"createdAt":"2024-01-02T00:00:00Z","labels":[{"name":"help wanted"}]}]\n' \
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
printf '[{"number":55,"createdAt":"2024-01-01T00:00:00Z","labels":[{"name":"help wanted"}]}]\n' > "$STUB_DIR/issue-list.json"
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
printf '[{"number":55,"createdAt":"2024-01-01T00:00:00Z","labels":[{"name":"help wanted"}]}]\n' > "$STUB_DIR/issue-list.json"
printf 'worktree /repo\nHEAD abc123\n\nworktree /worktrees/55-some-feature\nHEAD def456\nbranch refs/heads/55-some-feature\n\n' \
  > "$STUB_DIR/worktree-list.txt"
result=$("$TMPDIR_TEST/dispatch-select-target")
assert_eq "worktree'd issue skipped → QA PR returned" "pr 20 20-qa qa" "$result"
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
# A topic category (bug → testing infrastructure → dispatch → other) nests
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

# ============================================================================
# --- JIT scan ---
# dispatch-select-target's JIT scan runs after current-worktree continuation
# and before the main-broken health gate. It is inert with no jit.json.
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
  ".claude/skills/dispatch/scripts/dispatch-complete-phase" \
  "$matches"

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
#   proc/                         synthetic /proc tree (overridden per test)
#   stub/                         per-test JSON + record files (calls, gh out)
#
# Shims:
#   gh   — gh-pr-list-all.json drives `pr list --state all`; each entry carries
#          {state, headRefName, number}, partitioned by the script into
#          MERGED_BY_BRANCH / OPEN_BY_BRANCH.
#   git  — knows worktree list/remove/prune, branch -D, -C <p> status,
#          -C <p> rev-list --count, -C <p> log -1 --format=%ct, and
#          rev-parse --path-format=absolute --git-common-dir.
#          Every mutating call is appended to $STUB_DIR/calls.

sweep_setup() {
  TMPDIR_TEST=$(mktemp -d)
  STUB_DIR="$TMPDIR_TEST/stub"
  mkdir -p "$TMPDIR_TEST/bin" "$STUB_DIR" "$TMPDIR_TEST/scripts" \
           "$TMPDIR_TEST/project/.bare" "$TMPDIR_TEST/project/worktrees" \
           "$TMPDIR_TEST/project/tmp" "$TMPDIR_TEST/proc"

  cp "$SCRIPT_DIR/dispatch-sweep" "$TMPDIR_TEST/scripts/dispatch-sweep"
  cp "$SCRIPT_DIR/lib-worktree-in-sync.sh" "$TMPDIR_TEST/scripts/lib-worktree-in-sync.sh"
  cp "$SCRIPT_DIR/lib.sh" "$TMPDIR_TEST/scripts/lib.sh"
  chmod +x "$TMPDIR_TEST/scripts/dispatch-sweep"

  # Default empty gh output (each test may overwrite).
  echo '[]' > "$STUB_DIR/gh-pr-list-all.json"

  # Default empty worktree list (each test should overwrite with its records).
  : > "$STUB_DIR/worktree-list.txt"

  # gh shim — only the call dispatch-sweep makes.
  cat > "$TMPDIR_TEST/bin/gh" <<'STUB'
#!/usr/bin/env bash
STUB_DIR="$(cd "$(dirname "$0")/.." && pwd)/stub"
args="$*"
case "$args" in
  "pr list --state all --json number,headRefName,state --limit 200")
    cat "$STUB_DIR/gh-pr-list-all.json"
    ;;
  issue\ view\ *\ --json\ state\ -q\ .state)
    num=$(echo "$args" | awk '{print $3}')
    f="$STUB_DIR/issue-state-${num}.txt"
    if [[ -f "$f" ]]; then
      cat "$f"
    else
      echo "OPEN"   # default: not closed (allows adoption)
    fi
    ;;
  api\ */dependencies/blocked_by)
    path=$(echo "$args" | awk '{print $2}')
    num=$(echo "$path" | grep -oE '[0-9]+' | tail -1)
    f="$STUB_DIR/blockers-${num}.json"
    if [[ -f "$f" ]]; then
      cat "$f"
    else
      echo "[]"     # default: no blockers (allows adoption)
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

  # Defaults for dispatch-sweep env overrides.
  export DISPATCH_SWEEP_PROC_ROOT="$TMPDIR_TEST/proc"
  export DISPATCH_SWEEP_LOG_FILE="$STUB_DIR/sweep.log"
  export DISPATCH_SWEEP_NOW="2026-01-01T00:00:00Z"
}

sweep_teardown() {
  rm -rf "$TMPDIR_TEST"
  TMPDIR_TEST=""
  STUB_DIR=""
  export PATH="$SAVED_PATH"
  unset DISPATCH_SWEEP_PROC_ROOT DISPATCH_SWEEP_LOG_FILE DISPATCH_SWEEP_NOW
}

# Helper: register a worktree in the porcelain list AND create its directory.
# Each record is the blank-line-terminated block dispatch-sweep parses.
sweep_register_wt() {
  local wt_path="$1" branch="$2"
  mkdir -p "$wt_path"
  printf 'worktree %s\nHEAD abc123\nbranch refs/heads/%s\n\n' \
    "$wt_path" "$branch" >> "$STUB_DIR/worktree-list.txt"
}

# Helper: prepend a fake main worktree record (the script skips it).
sweep_register_main() {
  printf 'worktree %s\nHEAD mainsha\nbranch refs/heads/main\n\n' \
    "$TMPDIR_TEST/project/worktrees/main" >> "$STUB_DIR/worktree-list.txt"
}

# Helper: write a synthetic /proc/<pid> entry with comm and cwd symlink.
sweep_proc_pid() {
  local pid="$1" comm="$2" cwd="$3"
  local pid_dir="$DISPATCH_SWEEP_PROC_ROOT/$pid"
  mkdir -p "$pid_dir"
  printf '%s\n' "$comm" > "$pid_dir/comm"
  # cwd is a symlink; readlink -f resolves it.
  ln -s "$cwd" "$pid_dir/cwd"
}

# Convenience: convert an absolute path to the status/revlist/headct key
# used by the git -C shim.
sweep_path_key() {
  echo "$1" | tr '/' '_'
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

# --- Test 2: active vs orphaned via synthetic /proc --------------------------

echo "Test: /proc walk distinguishes active vs orphaned worktrees"
sweep_setup
ACTIVE_WT="$TMPDIR_TEST/project/worktrees/50-active"
ORPHAN_WT="$TMPDIR_TEST/project/worktrees/51-orphan"
sweep_register_wt "$ACTIVE_WT" "50-active"
sweep_register_wt "$ORPHAN_WT" "51-orphan"
# Neither branch merged or has an open PR — both are eligible for adoption
# via issue-number inference (^[0-9]+-).
# Orphan needs a HEAD commit time for the adoption tiebreaker.
ORPHAN_KEY=$(sweep_path_key "$ORPHAN_WT")
echo "1700000000" > "$STUB_DIR/headct${ORPHAN_KEY}.txt"

# Synthetic /proc:
#   pid 1001: .claude-unwrapp cwd inside ACTIVE_WT → marks 50-active active.
#   pid 1002: bash (non-claude comm) — proves comm filter is required.
#   pid 1003: .claude with cwd elsewhere — proves cwd check classifies, not comm.
sweep_proc_pid 1001 ".claude-unwrapp" "$ACTIVE_WT"
sweep_proc_pid 1002 "bash" "$ACTIVE_WT"
mkdir -p "$TMPDIR_TEST/elsewhere"
sweep_proc_pid 1003 ".claude" "$TMPDIR_TEST/elsewhere"

out=$("$TMPDIR_TEST/scripts/dispatch-sweep" 2>/dev/null); rc=$?
assert_eq "active/orphan sweep exits 0" "0" "$rc"
assert_eq "only orphan adopted" "worktree 51 51-orphan" "$out"

# Log: ACTIVE for 50, ORPHANED for 51, ADOPT for 51.
TOTAL=$((TOTAL + 1))
if grep -q "ACTIVE: '$ACTIVE_WT' branch=50-active pid=1001" "$DISPATCH_SWEEP_LOG_FILE"; then
  PASS=$((PASS + 1)); echo "  PASS: ACTIVE log line for 50-active with pid 1001"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: ACTIVE log line for 50-active with pid 1001"
  sed 's/^/      /' "$DISPATCH_SWEEP_LOG_FILE"
fi
TOTAL=$((TOTAL + 1))
if grep -q "ORPHANED: '$ORPHAN_WT' branch=51-orphan" "$DISPATCH_SWEEP_LOG_FILE"; then
  PASS=$((PASS + 1)); echo "  PASS: ORPHANED log line for 51-orphan"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: ORPHANED log line for 51-orphan"
fi
TOTAL=$((TOTAL + 1))
if grep -q "ADOPT_ORPHAN: '$ORPHAN_WT' branch=51-orphan issue=51" "$DISPATCH_SWEEP_LOG_FILE"; then
  PASS=$((PASS + 1)); echo "  PASS: ADOPT_ORPHAN log line for 51-orphan"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: ADOPT_ORPHAN log line for 51-orphan"
fi
sweep_teardown

# --- Test 3: oldest-orphan tiebreaker ----------------------------------------

echo "Test: oldest orphan wins by HEAD commit time"
sweep_setup
OLD_WT="$TMPDIR_TEST/project/worktrees/52-old"
NEW_WT="$TMPDIR_TEST/project/worktrees/53-new"
sweep_register_wt "$OLD_WT" "52-old"
sweep_register_wt "$NEW_WT" "53-new"
OLD_KEY=$(sweep_path_key "$OLD_WT")
NEW_KEY=$(sweep_path_key "$NEW_WT")
echo "1000" > "$STUB_DIR/headct${OLD_KEY}.txt"
echo "2000" > "$STUB_DIR/headct${NEW_KEY}.txt"
# Empty /proc → both orphans.

out=$("$TMPDIR_TEST/scripts/dispatch-sweep" 2>/dev/null); rc=$?
assert_eq "oldest-orphan sweep exits 0" "0" "$rc"
assert_eq "older orphan adopted" "worktree 52 52-old" "$out"

TOTAL=$((TOTAL + 1))
if grep -q "ADOPT_ORPHAN: '$OLD_WT' branch=52-old issue=52 ct=1000" "$DISPATCH_SWEEP_LOG_FILE"; then
  PASS=$((PASS + 1)); echo "  PASS: ADOPT_ORPHAN for older worktree (ct=1000)"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: ADOPT_ORPHAN for older worktree (ct=1000)"
  sed 's/^/      /' "$DISPATCH_SWEEP_LOG_FILE"
fi
sweep_teardown

# --- Test 4a: inferable issue number, no PR, not merged → adopt --------------

echo "Test: orphan with inferable issue number is adoptable"
sweep_setup
WT_PATH="$TMPDIR_TEST/project/worktrees/42-foo-bar"
sweep_register_wt "$WT_PATH" "42-foo-bar"
KEY=$(sweep_path_key "$WT_PATH")
echo "1500000000" > "$STUB_DIR/headct${KEY}.txt"

out=$("$TMPDIR_TEST/scripts/dispatch-sweep" 2>/dev/null); rc=$?
assert_eq "inferable-issue sweep exits 0" "0" "$rc"
assert_eq "inferable issue orphan adopted" "worktree 42 42-foo-bar" "$out"
sweep_teardown

# --- Test 4b: non-inferable branch, no PR → halt with cleanup-unknown --------

echo "Test: orphan with no PR and no inferable issue number halts"
sweep_setup
WT_PATH="$TMPDIR_TEST/project/worktrees/feature-foo"
sweep_register_wt "$WT_PATH" "feature-foo"
# No headct file: even if reached, no adoption — but the script halts first.

err_file="$TMPDIR_TEST/stderr.txt"
# `set -e` is in effect: capture exit code with an if/else, not `cmd; rc=$?`.
if out=$("$TMPDIR_TEST/scripts/dispatch-sweep" 2>"$err_file"); then rc=0; else rc=$?; fi
assert_eq "unknown-orphan sweep exits 3" "3" "$rc"
err=$(cat "$err_file")
TOTAL=$((TOTAL + 1))
if [[ "$err" == *"cleanup-unknown:$WT_PATH"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: stderr carries cleanup-unknown directive"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: stderr carries cleanup-unknown directive"
  echo "    stderr: $err"
fi
TOTAL=$((TOTAL + 1))
if grep -q "HALT_UNKNOWN: '$WT_PATH' branch=feature-foo" "$DISPATCH_SWEEP_LOG_FILE"; then
  PASS=$((PASS + 1)); echo "  PASS: HALT_UNKNOWN log line for feature-foo"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: HALT_UNKNOWN log line for feature-foo"
  sed 's/^/      /' "$DISPATCH_SWEEP_LOG_FILE"
fi
sweep_teardown

# --- Test 5: --cleanup-unknown <path> removes a single worktree --------------

echo "Test: --cleanup-unknown removes only the specified worktree"
sweep_setup
TARGET_WT="$TMPDIR_TEST/project/worktrees/feature-foo"
OTHER_WT="$TMPDIR_TEST/project/worktrees/42-other"
sweep_register_wt "$TARGET_WT" "feature-foo"
sweep_register_wt "$OTHER_WT" "42-other"

out=$("$TMPDIR_TEST/scripts/dispatch-sweep" --cleanup-unknown "$TARGET_WT" 2>/dev/null); rc=$?
assert_eq "--cleanup-unknown exits 0" "0" "$rc"

calls=$(cat "$STUB_DIR/calls" 2>/dev/null || true)
TOTAL=$((TOTAL + 1))
if echo "$calls" | grep -qx "worktree-remove-force:$TARGET_WT"; then
  PASS=$((PASS + 1)); echo "  PASS: forced remove call recorded for target"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: forced remove call recorded for target"
  echo "    calls: $calls"
fi
TOTAL=$((TOTAL + 1))
if echo "$calls" | grep -q "$OTHER_WT"; then
  FAIL=$((FAIL + 1)); echo "  FAIL: other worktree untouched (it appears in calls)"
  echo "    calls: $calls"
else
  PASS=$((PASS + 1)); echo "  PASS: other worktree untouched"
fi
TOTAL=$((TOTAL + 1))
if grep -q "CLEANUP_UNKNOWN: '$TARGET_WT'" "$DISPATCH_SWEEP_LOG_FILE"; then
  PASS=$((PASS + 1)); echo "  PASS: CLEANUP_UNKNOWN log line for target"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: CLEANUP_UNKNOWN log line for target"
  sed 's/^/      /' "$DISPATCH_SWEEP_LOG_FILE"
fi
sweep_teardown

# --- Test 6: --cleanup-unknown rejects path outside WORKTREES_ROOT -----------

echo "Test: --cleanup-unknown rejects path outside WORKTREES_ROOT"
sweep_setup
OUTSIDE_PATH="$TMPDIR_TEST/not-a-worktree"
mkdir -p "$OUTSIDE_PATH"
err_file="$TMPDIR_TEST/cleanup-outside-err.txt"
if "$TMPDIR_TEST/scripts/dispatch-sweep" --cleanup-unknown "$OUTSIDE_PATH" 2>"$err_file"; then
  rc=0
else
  rc=$?
fi
assert_eq "--cleanup-unknown outside WORKTREES_ROOT exits 2" "2" "$rc"
err=$(cat "$err_file")
TOTAL=$((TOTAL + 1))
if [[ "$err" == *"not a direct child"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: stderr explains direct-child requirement"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: stderr explains direct-child requirement"
  echo "    stderr: $err"
fi
sweep_teardown

# --- Test 7: --cleanup-unknown refuses to remove main ------------------------

echo "Test: --cleanup-unknown refuses to remove main"
sweep_setup
MAIN_PATH="$TMPDIR_TEST/project/worktrees/main"
mkdir -p "$MAIN_PATH"
err_file="$TMPDIR_TEST/cleanup-main-err.txt"
if "$TMPDIR_TEST/scripts/dispatch-sweep" --cleanup-unknown "$MAIN_PATH" 2>"$err_file"; then
  rc=0
else
  rc=$?
fi
assert_eq "--cleanup-unknown main exits 2" "2" "$rc"
err=$(cat "$err_file")
TOTAL=$((TOTAL + 1))
if [[ "$err" == *"is main"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: stderr identifies main as off-limits"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: stderr identifies main as off-limits"
  echo "    stderr: $err"
fi
sweep_teardown

# --- Test 8: --cleanup-unknown without a path argument fails -----------------

echo "Test: --cleanup-unknown without a path argument fails"
sweep_setup
err_file="$TMPDIR_TEST/cleanup-noarg-err.txt"
if "$TMPDIR_TEST/scripts/dispatch-sweep" --cleanup-unknown 2>"$err_file"; then
  rc=0
else
  rc=$?
fi
assert_eq "--cleanup-unknown without path exits 2" "2" "$rc"
err=$(cat "$err_file")
TOTAL=$((TOTAL + 1))
if [[ "$err" == *"requires a path argument"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: stderr explains missing path argument"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: stderr explains missing path argument"
  echo "    stderr: $err"
fi
sweep_teardown

# --- Test 9: open issue with no blockers → orphan is adopted ------------------

echo "Test: open issue with no blockers is adopted (gates pass)"
sweep_setup
WT_PATH="$TMPDIR_TEST/project/worktrees/60-open-no-blockers"
sweep_register_wt "$WT_PATH" "60-open-no-blockers"
KEY=$(sweep_path_key "$WT_PATH")
echo "1500000001" > "$STUB_DIR/headct${KEY}.txt"
# No per-test fixtures: gh shim defaults to OPEN state + [] blockers.

out=$("$TMPDIR_TEST/scripts/dispatch-sweep" 2>/dev/null); rc=$?
assert_eq "open-no-blockers sweep exits 0" "0" "$rc"
assert_eq "open-no-blockers orphan adopted" "worktree 60 60-open-no-blockers" "$out"

TOTAL=$((TOTAL + 1))
if grep -q "ADOPT_ORPHAN: '$WT_PATH' branch=60-open-no-blockers issue=60" "$DISPATCH_SWEEP_LOG_FILE"; then
  PASS=$((PASS + 1)); echo "  PASS: ADOPT_ORPHAN log line for open-no-blockers"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: ADOPT_ORPHAN log line for open-no-blockers"
  sed 's/^/      /' "$DISPATCH_SWEEP_LOG_FILE"
fi
sweep_teardown

# --- Test 10: open issue with open blocker → orphan is skipped ----------------

echo "Test: open issue with an open blocker is skipped"
sweep_setup
WT_PATH="$TMPDIR_TEST/project/worktrees/61-blocked"
sweep_register_wt "$WT_PATH" "61-blocked"
KEY=$(sweep_path_key "$WT_PATH")
echo "1500000002" > "$STUB_DIR/headct${KEY}.txt"
# Write a blockers fixture with one open-blocker entry.
printf '[{"number":999,"state":"OPEN","title":"Blocking issue"}]\n' \
  > "$STUB_DIR/blockers-61.json"

out=$("$TMPDIR_TEST/scripts/dispatch-sweep" 2>/dev/null); rc=$?
assert_eq "blocked-orphan sweep exits 0" "0" "$rc"
assert_eq "blocked-orphan stdout is empty" "" "$out"

TOTAL=$((TOTAL + 1))
if grep -q "SKIP_ORPHAN_BLOCKED: '$WT_PATH' branch=61-blocked issue=61 blockers=1" "$DISPATCH_SWEEP_LOG_FILE"; then
  PASS=$((PASS + 1)); echo "  PASS: SKIP_ORPHAN_BLOCKED log line for 61-blocked"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: SKIP_ORPHAN_BLOCKED log line for 61-blocked"
  sed 's/^/      /' "$DISPATCH_SWEEP_LOG_FILE"
fi
TOTAL=$((TOTAL + 1))
if grep -q "ADOPT_ORPHAN" "$DISPATCH_SWEEP_LOG_FILE" 2>/dev/null; then
  FAIL=$((FAIL + 1)); echo "  FAIL: ADOPT_ORPHAN must NOT appear when blocked"
else
  PASS=$((PASS + 1)); echo "  PASS: ADOPT_ORPHAN absent for blocked orphan"
fi
sweep_teardown

# --- Test 11: closed issue → orphan is skipped --------------------------------

echo "Test: closed issue orphan is skipped"
sweep_setup
WT_PATH="$TMPDIR_TEST/project/worktrees/62-closed"
sweep_register_wt "$WT_PATH" "62-closed"
KEY=$(sweep_path_key "$WT_PATH")
echo "1500000003" > "$STUB_DIR/headct${KEY}.txt"
# Write the issue-state fixture for issue #62.
printf 'CLOSED\n' > "$STUB_DIR/issue-state-62.txt"
# No blockers fixture needed: closed-issue gate runs first.

out=$("$TMPDIR_TEST/scripts/dispatch-sweep" 2>/dev/null); rc=$?
assert_eq "closed-issue sweep exits 0" "0" "$rc"
assert_eq "closed-issue stdout is empty" "" "$out"

TOTAL=$((TOTAL + 1))
if grep -q "SKIP_ORPHAN_CLOSED_ISSUE: '$WT_PATH' branch=62-closed issue=62" "$DISPATCH_SWEEP_LOG_FILE"; then
  PASS=$((PASS + 1)); echo "  PASS: SKIP_ORPHAN_CLOSED_ISSUE log line for 62-closed"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: SKIP_ORPHAN_CLOSED_ISSUE log line for 62-closed"
  sed 's/^/      /' "$DISPATCH_SWEEP_LOG_FILE"
fi
TOTAL=$((TOTAL + 1))
if grep -q "ADOPT_ORPHAN" "$DISPATCH_SWEEP_LOG_FILE" 2>/dev/null; then
  FAIL=$((FAIL + 1)); echo "  FAIL: ADOPT_ORPHAN must NOT appear when issue is closed"
else
  PASS=$((PASS + 1)); echo "  PASS: ADOPT_ORPHAN absent for closed-issue orphan"
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
lock_fake_claude_sessions() {
  local fake="$TMPDIR_TEST/fake/claude"
  local payload="[" sid first=1
  for sid in "$@"; do
    if (( first )); then first=0; else payload+=","; fi
    payload+="{\"sessionId\":\"$sid\",\"pid\":1,\"status\":\"busy\",\"name\":\"x\"}"
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
write_fake_claude '[{"sessionId":"sess-1","pid":4242,"status":"busy","name":"task-one"}]' 0
if out=$(claude_sessions_under "$CA_DIR"); then rc=0; else rc=$?; fi
assert_eq "live: claude_sessions_under exits 0" "0" "$rc"
assert_eq "live: claude_sessions_under prints the session TSV line" \
  "$(printf 'sess-1\t4242\tbusy\ttask-one')" "$out"
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
# summary
# ============================================================================
report_results
