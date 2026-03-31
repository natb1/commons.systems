#!/usr/bin/env bash
# Test suite for load-context script.
# Usage: ./test-load-context.sh
# Requires: jq (used by issue-state-read, which Test 4 exercises)
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd -P)"
source "$SCRIPT_DIR/test-helpers.sh"

SAVED_PATH=""
TMPDIR_TEST=""

setup() {
  TMPDIR_TEST=$(mktemp -d)
  mkdir -p "$TMPDIR_TEST/bin" "$TMPDIR_TEST/stub" "$TMPDIR_TEST/repo"

  for script in lib.sh load-context issue-primary issue-blocking issue-sub-issues issue-parent issue-siblings issue-state-read; do
    cp "$SCRIPT_DIR/$script" "$TMPDIR_TEST/$script"
    chmod +x "$TMPDIR_TEST/$script"
  done

  echo "# Test README" > "$TMPDIR_TEST/repo/README.md"

  cat > "$TMPDIR_TEST/bin/git" <<'STUB'
#!/usr/bin/env bash
STUB_DIR="$(cd "$(dirname "$0")/.." && pwd)/stub"
case "$*" in
  "rev-parse --abbrev-ref HEAD")
    if [ -f "$STUB_DIR/branch-name.txt" ]; then
      cat "$STUB_DIR/branch-name.txt"
    else
      echo "main"
    fi
    ;;
  "rev-parse --show-toplevel")
    echo "$(cd "$(dirname "$0")/.." && pwd)/repo"
    ;;
  *)
    echo "git stub: unknown invocation: $*" >&2
    exit 1
    ;;
esac
STUB
  chmod +x "$TMPDIR_TEST/bin/git"

  cat > "$TMPDIR_TEST/bin/gh" <<'STUB'
#!/usr/bin/env bash
STUB_DIR="$(cd "$(dirname "$0")/.." && pwd)/stub"
case "$1" in
  "pr")
    if [ -f "$STUB_DIR/pr-error.txt" ]; then
      cat "$STUB_DIR/pr-error.txt" >&2
      exit 1
    elif [ -f "$STUB_DIR/pr-view.json" ]; then
      cat "$STUB_DIR/pr-view.json"
    else
      echo "no pull requests found" >&2
      exit 1
    fi
    ;;
  "issue")
    shift
    case "$1" in
      "view")
        issue_num="$2"
        shift 2
        json_flag="" jq_flag=""
        while [ $# -gt 0 ]; do
          case "$1" in
            --json) json_flag="$2"; shift 2 ;;
            --jq) jq_flag="$2"; shift 2 ;;
            *) shift ;;
          esac
        done
        if [ "$json_flag" = "body" ] && [ "$jq_flag" = ".body" ]; then
          if [ -f "$STUB_DIR/issue-${issue_num}-body.txt" ]; then
            cat "$STUB_DIR/issue-${issue_num}-body.txt"
          else
            echo ""
          fi
        else
          echo "{\"title\":\"Test issue\",\"body\":\"Test body\",\"comments\":[],\"number\":${issue_num},\"state\":\"OPEN\"}"
        fi
        ;;
    esac
    ;;
  "api")
    path="$2"
    case "$path" in
      */dependencies/blocked_by|*/sub_issues)
        echo "[]"
        ;;
      */parent)
        echo "No parent issue found" >&2
        exit 1
        ;;
    esac
    ;;
esac
STUB
  chmod +x "$TMPDIR_TEST/bin/gh"

  SAVED_PATH="$PATH"
  export PATH="$TMPDIR_TEST/bin:$PATH"
}

teardown() {
  rm -rf "$TMPDIR_TEST"
  TMPDIR_TEST=""
  export PATH="$SAVED_PATH"
}
trap '[ -n "${TMPDIR_TEST:-}" ] && rm -rf "$TMPDIR_TEST"' EXIT

# --- Tests ---

echo "Test 1: error when branch has no issue number and no argument"
setup
echo "main" > "$TMPDIR_TEST/stub/branch-name.txt"
exit_code=0
stderr=$("$TMPDIR_TEST/load-context" 2>&1 >/dev/null) || exit_code=$?
assert_eq "exits 1 on non-issue branch" "1" "$exit_code"
assert_contains "error mentions branch and argument" "no argument" "$stderr"
teardown

echo "Test 2: derives issue number from branch name"
setup
echo "42-my-feature" > "$TMPDIR_TEST/stub/branch-name.txt"
exit_code=0
output=$("$TMPDIR_TEST/load-context" 2>&1) || exit_code=$?
assert_eq "exits 0 on issue branch" "0" "$exit_code"
assert_contains "has PR Status header" "## PR Status" "$output"
assert_contains "has Primary Issue header" "## Primary Issue" "$output"
assert_contains "has Blocking Issues header" "## Blocking Issues" "$output"
assert_contains "has Sub-issues header" "## Sub-issues" "$output"
assert_contains "has Parent Issue header" "## Parent Issue" "$output"
assert_contains "has Sibling Issues header" "## Sibling Issues" "$output"
assert_contains "has Issue State header" "## Issue State" "$output"
assert_contains "has README header" "## README" "$output"
assert_contains "has README content" "# Test README" "$output"
teardown

echo "Test 3: argument override takes precedence"
setup
echo "main" > "$TMPDIR_TEST/stub/branch-name.txt"
exit_code=0
output=$("$TMPDIR_TEST/load-context" 99 2>&1) || exit_code=$?
assert_eq "exits 0 with argument override" "0" "$exit_code"
assert_contains "has PR Status header" "## PR Status" "$output"
assert_contains "has Primary Issue header" "## Primary Issue" "$output"
teardown

echo "Test 4: issue state shown when present"
setup
echo "42-my-feature" > "$TMPDIR_TEST/stub/branch-name.txt"
cat > "$TMPDIR_TEST/stub/issue-42-body.txt" <<'EOF'
Issue body.

<!-- pr-workflow-state -->
```json
{"version":1,"step":3,"phase":"core"}
```
<!-- /pr-workflow-state -->
EOF
exit_code=0
output=$("$TMPDIR_TEST/load-context" 2>&1) || exit_code=$?
assert_eq "exits 0 with state" "0" "$exit_code"
assert_contains "state shows step" '"step":' "$output"
teardown

echo "Test 5: no state gracefully handled"
setup
echo "42-my-feature" > "$TMPDIR_TEST/stub/branch-name.txt"
exit_code=0
output=$("$TMPDIR_TEST/load-context" 2>&1) || exit_code=$?
assert_eq "exits 0 without state" "0" "$exit_code"
assert_contains "shows No state" "No state" "$output"
teardown

echo "Test 6: gh pr view non-'no PR' failure propagates error"
setup
echo "42-my-feature" > "$TMPDIR_TEST/stub/branch-name.txt"
echo "GraphQL: authentication required" > "$TMPDIR_TEST/stub/pr-error.txt"
exit_code=0
stderr=$("$TMPDIR_TEST/load-context" 2>&1 >/dev/null) || exit_code=$?
assert_eq "exits 1 on PR error" "1" "$exit_code"
assert_contains "error mentions PR failure" "failed to fetch PR status" "$stderr"
assert_contains "error includes original message" "authentication required" "$stderr"
teardown

report_results
