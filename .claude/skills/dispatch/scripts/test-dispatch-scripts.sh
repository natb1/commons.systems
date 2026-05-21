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
  chmod +x "$TMPDIR_TEST/dispatch-phase" \
           "$TMPDIR_TEST/dispatch-find-pr" \
           "$TMPDIR_TEST/dispatch-resolve-arg" \
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
# Step 2), so dispatch-select-target is never invoked on that path.

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

# --- help-wanted leaf reachability (issue #715) -----------------------------
# dispatch-select-target runs dispatch-trace-leaf <N> queue for each help-wanted
# candidate and skips any whose subtree is fully worktree-conflicted (trace
# exits 2), exactly as a direct worktree is skipped. Sub-issue 5500 sits on
# branch 5500-blocked, which does NOT prefix-match 55-, so issue 55 is never
# falsely flagged as directly worktree'd.

# 31. A help-wanted issue with a fully worktree-conflicted subtree is skipped;
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

# 32. Every help-wanted issue is subtree-blocked → falls through to a QA PR.
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

# 33. Every help-wanted issue is subtree-blocked and no QA PR → empty.
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

# 34. A help-wanted issue with a startable open leaf emits the resolved leaf
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

# 35. dispatch-trace-leaf exit 1 (usage error) is a hard failure, never a skip.
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

echo "Test: simplify → dispatch:refactored (apply only, no label create)"
setup
"$TMPDIR_TEST/dispatch-complete-phase" 25 simplify
assert_eq "simplify applies dispatch:refactored" \
  "pr edit 25 --add-label dispatch:refactored" "$(cat "$STUB_DIR/gh-pr-edit.log")"
assert_eq "simplify: no gh label create when label exists" "absent" "$(label_create_state)"
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

# ============================================================================
# dispatch-acquire-lock tests
# ============================================================================
#
# Each test gets a fresh tmp tree:
#   $TMPDIR_TEST/stub/         lock file + per-test output capture files
#   $TMPDIR_TEST/scripts/      a copy of dispatch-acquire-lock
#   $TMPDIR_TEST/proc/         synthetic /proc tree (comm + status files)
#
# DISPATCH_LOCK_FILE and DISPATCH_LOCK_PROC_ROOT are exported so the script
# never touches the real shared lock. Tests 1-6 set DISPATCH_LOCK_SESSION_PID
# to bypass the /proc ancestry walk; Test 7 leaves it unset to exercise the
# walk through a synthetic /proc tree.

lock_setup() {
  TMPDIR_TEST=$(mktemp -d)
  STUB_DIR="$TMPDIR_TEST/stub"
  mkdir -p "$STUB_DIR" "$TMPDIR_TEST/scripts" "$TMPDIR_TEST/proc"

  cp "$SCRIPT_DIR/dispatch-acquire-lock" "$TMPDIR_TEST/scripts/dispatch-acquire-lock"
  chmod +x "$TMPDIR_TEST/scripts/dispatch-acquire-lock"

  export DISPATCH_LOCK_FILE="$STUB_DIR/dispatch.lock"
  export DISPATCH_LOCK_PROC_ROOT="$TMPDIR_TEST/proc"
}

lock_teardown() {
  rm -rf "$TMPDIR_TEST"
  TMPDIR_TEST=""
  STUB_DIR=""
  unset DISPATCH_LOCK_FILE DISPATCH_LOCK_SESSION_PID DISPATCH_LOCK_PROC_ROOT \
    DISPATCH_LOCK_WAIT_INTERVAL DISPATCH_LOCK_WAIT_TIMEOUT
}

# Helper: write a synthetic <proc>/<pid>/comm file with the given comm string.
lock_proc_pid() {
  local pid="$1" comm="$2"
  mkdir -p "$DISPATCH_LOCK_PROC_ROOT/$pid"
  printf '%s\n' "$comm" > "$DISPATCH_LOCK_PROC_ROOT/$pid/comm"
}

# Helper: write a synthetic <proc>/<pid>/status file recording <ppid> as the
# parent — the PPid line is all the ancestry walk reads from it.
lock_proc_status() {
  local pid="$1" ppid="$2"
  mkdir -p "$DISPATCH_LOCK_PROC_ROOT/$pid"
  printf 'Name:\tbash\nPPid:\t%s\n' "$ppid" > "$DISPATCH_LOCK_PROC_ROOT/$pid/status"
}

# Helper: write a synthetic <proc>/<pid>/cmdline file with NUL-separated argv,
# matching the kernel's /proc cmdline format. Used to mark a process as a
# non-session Claude daemon (e.g. argv carrying `--bg-spare`).
lock_proc_cmdline() {
  local pid="$1"; shift
  mkdir -p "$DISPATCH_LOCK_PROC_ROOT/$pid"
  printf '%s\0' "$@" > "$DISPATCH_LOCK_PROC_ROOT/$pid/cmdline"
}

# --- Test 1: first acquisition with an absent lock file ----------------------

echo "Test: first acquisition writes the session PID and prints acquired"
lock_setup
export DISPATCH_LOCK_SESSION_PID=100100
lock_proc_pid 100100 ".claude-unwrapp"
# The lock file does not exist yet.
out=$("$TMPDIR_TEST/scripts/dispatch-acquire-lock" 2>/dev/null); rc=$?
assert_eq "first-acquisition exits 0" "0" "$rc"
assert_eq "first-acquisition prints acquired" "acquired" "$out"
lock_contents=$(cat "$DISPATCH_LOCK_FILE" 2>/dev/null || true)
assert_eq "lock file records the session PID" "100100" "$lock_contents"
lock_teardown

# --- Test 2: two parallel invocations, distinct sessions ---------------------

echo "Test: two parallel invocations yield exactly one acquired, one busy"
lock_setup
# Both sessions are live .claude processes.
lock_proc_pid 200200 ".claude-unwrapp"
lock_proc_pid 200300 ".claude-unwrapp"
# Launch both in the background, each with its own session PID, sharing the
# one lock file + proc root. The blocking flock serializes them.
( export DISPATCH_LOCK_SESSION_PID=200200
  "$TMPDIR_TEST/scripts/dispatch-acquire-lock" ) >"$STUB_DIR/out-a" 2>&1 &
( export DISPATCH_LOCK_SESSION_PID=200300
  "$TMPDIR_TEST/scripts/dispatch-acquire-lock" ) >"$STUB_DIR/out-b" 2>&1 &
wait
out_a=$(cat "$STUB_DIR/out-a" 2>/dev/null || true)
out_b=$(cat "$STUB_DIR/out-b" 2>/dev/null || true)
sorted=$(printf '%s\n%s\n' "$out_a" "$out_b" | sort)
assert_eq "parallel invocations: exactly one acquired, one busy" \
  "$(printf 'acquired\nbusy')" "$sorted"
lock_teardown

# --- Test 3: stale lock — recorded PID is dead -------------------------------

echo "Test: stale lock with a dead recorded PID is reclaimed"
lock_setup
# Pre-write a recorded PID with no /proc entry — a dead process.
printf '%s\n' 300300 > "$DISPATCH_LOCK_FILE"
export DISPATCH_LOCK_SESSION_PID=300400
lock_proc_pid 300400 ".claude-unwrapp"
out=$("$TMPDIR_TEST/scripts/dispatch-acquire-lock" 2>/dev/null); rc=$?
assert_eq "stale-dead-PID exits 0" "0" "$rc"
assert_eq "stale-dead-PID prints acquired" "acquired" "$out"
lock_contents=$(cat "$DISPATCH_LOCK_FILE" 2>/dev/null || true)
assert_eq "stale-dead-PID lock file rewritten to new session PID" \
  "300400" "$lock_contents"
lock_teardown

# --- Test 4: stale lock — recorded PID recycled by a non-.claude process -----

echo "Test: stale lock with a recycled non-.claude PID is reclaimed"
lock_setup
printf '%s\n' 400400 > "$DISPATCH_LOCK_FILE"
# The recorded PID is alive but is NOT a .claude process — PID recycled.
lock_proc_pid 400400 "bash"
export DISPATCH_LOCK_SESSION_PID=400500
lock_proc_pid 400500 ".claude-unwrapp"
out=$("$TMPDIR_TEST/scripts/dispatch-acquire-lock" 2>/dev/null); rc=$?
assert_eq "recycled-PID exits 0" "0" "$rc"
assert_eq "recycled-PID prints acquired" "acquired" "$out"
lock_teardown

# --- Test 5: same-session re-entry -------------------------------------------

echo "Test: same-session re-entry proceeds (not busy)"
lock_setup
# The recorded PID is a live .claude process AND is our own session.
printf '%s\n' 500500 > "$DISPATCH_LOCK_FILE"
lock_proc_pid 500500 ".claude-unwrapp"
export DISPATCH_LOCK_SESSION_PID=500500
out=$("$TMPDIR_TEST/scripts/dispatch-acquire-lock" 2>/dev/null); rc=$?
assert_eq "re-entry exits 0" "0" "$rc"
assert_eq "re-entry prints acquired" "acquired" "$out"
lock_teardown

# --- Test 6: misconfiguration — non-git dir, no DISPATCH_LOCK_FILE -----------

echo "Test: non-git dir with no DISPATCH_LOCK_FILE exits 2"
lock_setup
nongit=$(mktemp -d)
# `set -e` is in effect: capture the exit code with an if/else. env -u strips
# the lock-file + proc-root overrides for just this invocation.
if ( cd "$nongit" && env -u DISPATCH_LOCK_FILE -u DISPATCH_LOCK_PROC_ROOT \
       "$TMPDIR_TEST/scripts/dispatch-acquire-lock" ) 2>"$STUB_DIR/err6"; then
  rc=0
else
  rc=$?
fi
assert_eq "misconfiguration exits 2" "2" "$rc"
err6=$(cat "$STUB_DIR/err6" 2>/dev/null || true)
TOTAL=$((TOTAL + 1))
if [[ -n "$err6" ]]; then
  PASS=$((PASS + 1)); echo "  PASS: misconfiguration writes an error to stderr"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: misconfiguration writes an error to stderr"
  echo "    stderr: '$err6'"
fi
rm -rf "$nongit"
lock_teardown

# --- Test 7: /proc ancestry walk resolves the nearest .claude ancestor -------
#
# The only lock test that exercises the /proc walk — DISPATCH_LOCK_SESSION_PID
# is left unset. `( exec ... )` forks a subshell that exec-replaces itself with
# the script, so the script's $PPID is this test process ($$). Synthetic
# ancestry: $$ is a non-.claude shell whose PPid points at a .claude session,
# so the walk must climb one level past $$ to reach the session PID.

echo "Test: /proc ancestry walk resolves the nearest .claude ancestor"
lock_setup
claude_pid=700700
lock_proc_pid "$$" "bash"                  # script's $PPID — not a .claude proc
lock_proc_status "$$" "$claude_pid"        # ... its parent is the .claude session
lock_proc_pid "$claude_pid" ".claude-unwrapp"
rc=0
( exec "$TMPDIR_TEST/scripts/dispatch-acquire-lock" ) \
  >"$STUB_DIR/out7" 2>/dev/null || rc=$?
out=$(cat "$STUB_DIR/out7" 2>/dev/null || true)
assert_eq "proc-walk exits 0" "0" "$rc"
assert_eq "proc-walk prints acquired" "acquired" "$out"
lock_contents=$(cat "$DISPATCH_LOCK_FILE" 2>/dev/null || true)
assert_eq "proc-walk records the .claude ancestor PID, not \$PPID" \
  "$claude_pid" "$lock_contents"
lock_teardown

# --- Test 8: --wait with an own-session record acquires immediately ----------
#
# An own-session PID is recorded. --wait must NOT poll — try_acquire claims it
# on iteration 1. WAIT_TIMEOUT=0 proves no wait happened: a real wait would
# have to time out, which 0 cannot survive.

echo "Test: --wait with an own-session record acquires immediately"
lock_setup
printf '%s\n' 800800 > "$DISPATCH_LOCK_FILE"
lock_proc_pid 800800 ".claude-unwrapp"
export DISPATCH_LOCK_SESSION_PID=800800
export DISPATCH_LOCK_WAIT_TIMEOUT=0
out=$("$TMPDIR_TEST/scripts/dispatch-acquire-lock" --wait 2>/dev/null); rc=$?
assert_eq "--wait own-session exits 0" "0" "$rc"
assert_eq "--wait own-session prints acquired" "acquired" "$out"
lock_teardown

# --- Test 9: --wait against a live foreign holder times out → busy -----------
#
# The recorded PID is a live foreign .claude session that never goes away. The
# --wait loop polls until WAIT_TIMEOUT elapses, then prints busy and exits 0.

echo "Test: --wait against a live foreign holder times out and prints busy"
lock_setup
printf '%s\n' 900900 > "$DISPATCH_LOCK_FILE"
lock_proc_pid 900900 ".claude-unwrapp"          # live foreign holder
export DISPATCH_LOCK_SESSION_PID=900901
lock_proc_pid 900901 ".claude-unwrapp"          # our own session
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
# The recorded PID is a live foreign holder when --wait starts. Mid-wait its
# synthetic /proc entry is removed, so the next poll's liveness check fails and
# the waiter reclaims the lock — recording its own session PID.

echo "Test: --wait acquires once a contended holder goes stale"
lock_setup
printf '%s\n' 101010 > "$DISPATCH_LOCK_FILE"
lock_proc_pid 101010 ".claude-unwrapp"          # live foreign holder
export DISPATCH_LOCK_SESSION_PID=101011
lock_proc_pid 101011 ".claude-unwrapp"          # our own session
export DISPATCH_LOCK_WAIT_INTERVAL=0.1
export DISPATCH_LOCK_WAIT_TIMEOUT=10
( "$TMPDIR_TEST/scripts/dispatch-acquire-lock" --wait ) >"$STUB_DIR/out10" 2>&1 &
wait_pid=$!
sleep 0.5
# Holder goes away — next poll's liveness check fails, waiter reclaims.
rm -rf "$DISPATCH_LOCK_PROC_ROOT/101010"
wait "$wait_pid"
out=$(cat "$STUB_DIR/out10" 2>/dev/null || true)
assert_eq "--wait reclaim prints acquired" "acquired" "$out"
lock_contents=$(cat "$DISPATCH_LOCK_FILE" 2>/dev/null || true)
assert_eq "--wait reclaim records our session PID" "101011" "$lock_contents"
lock_teardown

# --- Test 11: --release with an own-session record → released, file emptied --

echo "Test: --release with an own-session record clears the lock file"
lock_setup
printf '%s\n' 111100 > "$DISPATCH_LOCK_FILE"
lock_proc_pid 111100 ".claude-unwrapp"
export DISPATCH_LOCK_SESSION_PID=111100
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

# --- Test 12: --release with a foreign PID recorded → noop, file unchanged ---

echo "Test: --release with a foreign PID recorded is a no-op"
lock_setup
printf '%s\n' 121200 > "$DISPATCH_LOCK_FILE"
lock_proc_pid 121200 ".claude-unwrapp"          # live foreign holder
export DISPATCH_LOCK_SESSION_PID=121201
lock_proc_pid 121201 ".claude-unwrapp"          # our own session
out=$("$TMPDIR_TEST/scripts/dispatch-acquire-lock" --release 2>/dev/null); rc=$?
assert_eq "--release foreign exits 0" "0" "$rc"
assert_eq "--release foreign prints noop" "noop" "$out"
lock_contents=$(cat "$DISPATCH_LOCK_FILE" 2>/dev/null || true)
assert_eq "--release foreign leaves the lock file unchanged" \
  "121200" "$lock_contents"
lock_teardown

# --- Test 13: unknown argument exits 2 ---------------------------------------

echo "Test: an unknown argument exits 2"
lock_setup
# `set -e` is in effect: capture the exit code with an if/else.
if ( "$TMPDIR_TEST/scripts/dispatch-acquire-lock" --bogus ) 2>/dev/null; then
  rc=0
else
  rc=$?
fi
assert_eq "unknown argument exits 2" "2" "$rc"
lock_teardown

# --- Test 14: a recorded --bg-spare daemon PID is reclaimable (non-holder) ---
#
# The recorded PID is alive with comm ".claude-unwrapp" — identical to a real
# session — but its cmdline carries `--bg-spare`, marking a background-spare
# daemon, not a /dispatch session. is_live_claude must reject it, so the
# calling session reclaims the lock. The comm-only predicate would wrongly
# report busy and wedge the lock on the daemon.

echo "Test: a recorded --bg-spare daemon PID is reclaimable, not a holder"
lock_setup
printf '%s\n' 141400 > "$DISPATCH_LOCK_FILE"
lock_proc_pid 141400 ".claude-unwrapp"                   # comm looks like a session
lock_proc_cmdline 141400 ".claude-unwrapped" "--bg-spare"  # ... but cmdline marks a spare daemon
export DISPATCH_LOCK_SESSION_PID=141401
lock_proc_pid 141401 ".claude-unwrapp"                   # our own live session
out=$("$TMPDIR_TEST/scripts/dispatch-acquire-lock" 2>/dev/null); rc=$?
assert_eq "bg-spare-holder exits 0" "0" "$rc"
assert_eq "bg-spare-holder prints acquired" "acquired" "$out"
lock_contents=$(cat "$DISPATCH_LOCK_FILE" 2>/dev/null || true)
assert_eq "bg-spare-holder lock file rewritten to the caller's session PID" \
  "141401" "$lock_contents"
lock_teardown

# --- Test 15: the ancestry walk skips a --bg-spare daemon ancestor -----------
#
# Like Test 7, DISPATCH_LOCK_SESSION_PID is unset so the /proc walk runs. The
# script's $PPID ($$) is a non-.claude shell; its parent is a --bg-spare
# daemon (`.claude` comm, `--bg-spare` cmdline); the grandparent is a real
# .claude session. The walk must skip the spare daemon and record the session.

echo "Test: the ancestry walk skips a --bg-spare daemon ancestor"
lock_setup
spare_pid=151500
session_pid=151501
lock_proc_pid "$$" "bash"                       # script's $PPID — not a .claude proc
lock_proc_status "$$" "$spare_pid"              # ... its parent is the spare daemon
lock_proc_pid "$spare_pid" ".claude-unwrapp"    # spare daemon: comm looks like a session
lock_proc_cmdline "$spare_pid" ".claude-unwrapped" "--bg-spare"  # ... but cmdline marks it
lock_proc_status "$spare_pid" "$session_pid"    # ... its parent is the real session
lock_proc_pid "$session_pid" ".claude-unwrapp"  # real session (no cmdline → comm-only verdict)
rc=0
( exec "$TMPDIR_TEST/scripts/dispatch-acquire-lock" ) \
  >"$STUB_DIR/out15" 2>/dev/null || rc=$?
out=$(cat "$STUB_DIR/out15" 2>/dev/null || true)
assert_eq "spare-ancestor walk exits 0" "0" "$rc"
assert_eq "spare-ancestor walk prints acquired" "acquired" "$out"
lock_contents=$(cat "$DISPATCH_LOCK_FILE" 2>/dev/null || true)
assert_eq "spare-ancestor walk records the session PID, not the spare daemon" \
  "$session_pid" "$lock_contents"
lock_teardown

# ============================================================================
# summary
# ============================================================================
report_results
