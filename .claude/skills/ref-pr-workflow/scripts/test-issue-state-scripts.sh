#!/usr/bin/env bash
# Test suite for issue-state-read and issue-state-write scripts.
# Usage: ./test-issue-state-scripts.sh
# Requires: jq
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd -P)"
source "$SCRIPT_DIR/test-helpers.sh"
READ_SCRIPT="$SCRIPT_DIR/issue-state-read"
WRITE_SCRIPT="$SCRIPT_DIR/issue-state-write"

SAVED_PATH=""

setup() {
  TMPDIR_TEST=$(mktemp -d)
  mkdir -p "$TMPDIR_TEST/bin" "$TMPDIR_TEST/stub"

  # Copy scripts under test into temp dir
  cp "$READ_SCRIPT" "$TMPDIR_TEST/issue-state-read"
  cp "$WRITE_SCRIPT" "$TMPDIR_TEST/issue-state-write"
  chmod +x "$TMPDIR_TEST/issue-state-read" "$TMPDIR_TEST/issue-state-write"

  # Create gh stub
  # The stub stores/serves issue body from $STUB_DIR/issue-body.txt
  cat > "$TMPDIR_TEST/bin/gh" <<'STUB'
#!/usr/bin/env bash
STUB_DIR="$(cd "$(dirname "$0")/.." && pwd)/stub"

case "$1" in
  "issue")
    case "$2" in
      "view")
        issue_num="$3"
        # Validate issue number
        if ! [[ "$issue_num" =~ ^[1-9][0-9]*$ ]]; then
          echo "GraphQL: Could not resolve to an issue" >&2
          exit 1
        fi
        shift 3
        # Parse remaining flags
        json_flag="" jq_flag=""
        while [ $# -gt 0 ]; do
          case "$1" in
            --json) json_flag="$2"; shift 2 ;;
            --jq) jq_flag="$2"; shift 2 ;;
            *) shift ;;
          esac
        done
        if [ "$json_flag" = "body" ] && [ "$jq_flag" = ".body" ]; then
          if [ -f "$STUB_DIR/issue-body.txt" ]; then
            cat "$STUB_DIR/issue-body.txt"
          else
            echo ""
          fi
          exit 0
        fi
        echo '{"number": '"$issue_num"'}'
        exit 0
        ;;
    esac
    ;;
  "repo")
    case "$2" in
      "view")
        echo "owner/repo"
        exit 0
        ;;
    esac
    ;;
  "api")
    shift 2
    method_flag="" file_field=""
    while [ $# -gt 0 ]; do
      case "$1" in
        --method) method_flag="$2"; shift 2 ;;
        --field)
          val="${2#body=@}"
          file_field="$val"
          shift 2
          ;;
        --json|-q|--jq) shift 2 ;;
        *) shift ;;
      esac
    done
    if [ "$method_flag" = "PATCH" ] && [ -n "$file_field" ]; then
      # Save the new body for subsequent reads
      cp "$file_field" "$STUB_DIR/issue-body.txt"
      echo '{"id": 1}'
      exit 0
    fi
    echo '{"id": 1}'
    exit 0
    ;;
esac
echo "stub: unknown invocation: $*" >&2
exit 1
STUB
  chmod +x "$TMPDIR_TEST/bin/gh"

  SAVED_PATH="$PATH"
  export PATH="$TMPDIR_TEST/bin:$PATH"
  READ_T="$TMPDIR_TEST/issue-state-read"
  WRITE_T="$TMPDIR_TEST/issue-state-write"
}

teardown() {
  rm -rf "$TMPDIR_TEST"
  TMPDIR_TEST=""
  export PATH="$SAVED_PATH"
}
trap '[ -n "${TMPDIR_TEST:-}" ] && rm -rf "$TMPDIR_TEST"' EXIT

# --- issue-state-read tests ---

echo "Test 1: read valid state block"
setup
cat > "$TMPDIR_TEST/stub/issue-body.txt" <<'EOF'
Some issue description here.

<!-- pr-workflow-state -->
```json
{
  "version": 1,
  "step": 6,
  "step_label": "Acceptance Test Loop",
  "phase": "verify"
}
```
<!-- /pr-workflow-state -->
EOF
exit_code=0
output=$("$READ_T" 42) || exit_code=$?
assert_eq "exits 0 on valid state" "0" "$exit_code"
step=$(echo "$output" | jq -r '.step')
assert_eq "reads step correctly" "6" "$step"
phase=$(echo "$output" | jq -r '.phase')
assert_eq "reads phase correctly" "verify" "$phase"
teardown

echo "Test 2: read missing markers"
setup
cat > "$TMPDIR_TEST/stub/issue-body.txt" <<'EOF'
Just a plain issue body with no state markers.
EOF
exit_code=0
stderr=$("$READ_T" 42 2>&1 >/dev/null) || exit_code=$?
assert_eq "exits 1 on missing markers" "1" "$exit_code"
assert_contains "error mentions markers" "no pr-workflow-state markers" "$stderr"
teardown

echo "Test 3: read corrupt JSON"
setup
cat > "$TMPDIR_TEST/stub/issue-body.txt" <<'EOF'
<!-- pr-workflow-state -->
```json
{not valid json
```
<!-- /pr-workflow-state -->
EOF
exit_code=0
stderr=$("$READ_T" 42 2>&1 >/dev/null) || exit_code=$?
assert_eq "exits 1 on corrupt JSON" "1" "$exit_code"
assert_contains "error mentions invalid JSON" "invalid JSON" "$stderr"
teardown

echo "Test 4: read empty body"
setup
# Empty file = empty body
: > "$TMPDIR_TEST/stub/issue-body.txt"
exit_code=0
stderr=$("$READ_T" 42 2>&1 >/dev/null) || exit_code=$?
assert_eq "exits 1 on empty body" "1" "$exit_code"
teardown

echo "Test 5: read invalid issue number"
setup
exit_code=0
stderr=$("$READ_T" 0 2>&1 >/dev/null) || exit_code=$?
assert_eq "exits 1 on zero issue number" "1" "$exit_code"
assert_contains "error mentions issue number" "positive integer" "$stderr"
exit_code=0
stderr=$("$READ_T" abc 2>&1 >/dev/null) || exit_code=$?
assert_eq "exits 1 on non-numeric issue number" "1" "$exit_code"
teardown

echo "Test 6: read empty state block (markers present, no content)"
setup
cat > "$TMPDIR_TEST/stub/issue-body.txt" <<'EOF'
<!-- pr-workflow-state -->
```json
```
<!-- /pr-workflow-state -->
EOF
exit_code=0
stderr=$("$READ_T" 42 2>&1 >/dev/null) || exit_code=$?
assert_eq "exits 1 on empty state block" "1" "$exit_code"
teardown

# --- issue-state-write tests ---

echo "Test 7: write appends state to body without markers"
setup
cat > "$TMPDIR_TEST/stub/issue-body.txt" <<'EOF'
Original issue description.
EOF
exit_code=0
"$WRITE_T" 42 '{"version":1,"step":3,"phase":"core","active_skills":["ref-memory-management"]}' 2>&1 || exit_code=$?
assert_eq "exits 0 on append write" "0" "$exit_code"
body=$(cat "$TMPDIR_TEST/stub/issue-body.txt")
assert_contains "body contains original text" "Original issue description." "$body"
assert_contains "body contains state marker" "<!-- pr-workflow-state -->" "$body"
assert_contains "body contains closing marker" "<!-- /pr-workflow-state -->" "$body"
assert_contains "body contains step" '"step": 3' "$body"
teardown

echo "Test 8: write replaces existing state block"
setup
cat > "$TMPDIR_TEST/stub/issue-body.txt" <<'EOF'
Issue description.

<!-- pr-workflow-state -->
```json
{
  "version": 1,
  "step": 3,
  "phase": "core"
}
```
<!-- /pr-workflow-state -->

More text after state.
EOF
exit_code=0
"$WRITE_T" 42 '{"version":1,"step":6,"phase":"verify","active_skills":["ref-memory-management"]}' 2>&1 || exit_code=$?
assert_eq "exits 0 on replace write" "0" "$exit_code"
body=$(cat "$TMPDIR_TEST/stub/issue-body.txt")
assert_contains "body still has description" "Issue description." "$body"
assert_contains "body still has trailing text" "More text after state." "$body"
assert_contains "body has new step" '"step": 6' "$body"
assert_contains "body has new phase" '"phase": "verify"' "$body"
teardown

echo "Test 9: write is idempotent"
setup
cat > "$TMPDIR_TEST/stub/issue-body.txt" <<'EOF'
Issue description.
EOF
STATE='{"version":1,"step":4,"phase":"unit","active_skills":["ref-memory-management"]}'
"$WRITE_T" 42 "$STATE" 2>/dev/null
body1=$(cat "$TMPDIR_TEST/stub/issue-body.txt")
"$WRITE_T" 42 "$STATE" 2>/dev/null
body2=$(cat "$TMPDIR_TEST/stub/issue-body.txt")
assert_eq "idempotent: same body after two writes" "$body1" "$body2"
teardown

echo "Test 10: write preserves surrounding markdown"
setup
cat > "$TMPDIR_TEST/stub/issue-body.txt" <<'EOF'
# Issue Title

Paragraph one.

<!-- pr-workflow-state -->
```json
{"version": 1, "step": 1}
```
<!-- /pr-workflow-state -->

## Section Two

More content here.
EOF
"$WRITE_T" 42 '{"version":1,"step":9,"phase":"code-quality","active_skills":["ref-memory-management"]}' 2>/dev/null
body=$(cat "$TMPDIR_TEST/stub/issue-body.txt")
assert_contains "preserves title" "# Issue Title" "$body"
assert_contains "preserves paragraph" "Paragraph one." "$body"
assert_contains "preserves section two" "## Section Two" "$body"
assert_contains "preserves trailing content" "More content here." "$body"
assert_contains "has new step" '"step": 9' "$body"
teardown

echo "Test 11: write with special characters in body"
setup
cat > "$TMPDIR_TEST/stub/issue-body.txt" <<'EOF'
Issue with "quotes", $dollars, and `backticks`.
EOF
exit_code=0
"$WRITE_T" 42 '{"version":1,"step":2,"step_label":"Planning Phase","phase":"core","active_skills":["ref-memory-management"]}' 2>&1 || exit_code=$?
assert_eq "exits 0 with special chars" "0" "$exit_code"
body=$(cat "$TMPDIR_TEST/stub/issue-body.txt")
assert_contains "preserves quotes" '"quotes"' "$body"
assert_contains "preserves dollars" '$dollars' "$body"
assert_contains "preserves backticks" '`backticks`' "$body"
teardown

echo "Test 12: write reads from stdin"
setup
cat > "$TMPDIR_TEST/stub/issue-body.txt" <<'EOF'
Original body.
EOF
exit_code=0
echo '{"version":1,"step":5,"phase":"core","active_skills":["ref-memory-management"]}' | "$WRITE_T" 42 2>&1 || exit_code=$?
assert_eq "exits 0 on stdin input" "0" "$exit_code"
body=$(cat "$TMPDIR_TEST/stub/issue-body.txt")
assert_contains "body has step from stdin" '"step": 5' "$body"
teardown

echo "Test 13: write rejects invalid JSON"
setup
cat > "$TMPDIR_TEST/stub/issue-body.txt" <<'EOF'
Body.
EOF
exit_code=0
stderr=$("$WRITE_T" 42 '{not json}' 2>&1 >/dev/null) || exit_code=$?
assert_eq "exits 1 on invalid JSON" "1" "$exit_code"
teardown

# --- round-trip test ---

echo "Test 14: round-trip write then read"
setup
cat > "$TMPDIR_TEST/stub/issue-body.txt" <<'EOF'
Description.
EOF
STATE='{"version":1,"step":7,"step_label":"Smoke Test Loop","phase":"verify","active_skills":["ref-memory-management"],"pr_number":87}'
"$WRITE_T" 42 "$STATE" 2>/dev/null
exit_code=0
output=$("$READ_T" 42) || exit_code=$?
assert_eq "round-trip read succeeds" "0" "$exit_code"
step=$(echo "$output" | jq -r '.step')
assert_eq "round-trip step" "7" "$step"
phase=$(echo "$output" | jq -r '.phase')
assert_eq "round-trip phase" "verify" "$phase"
pr=$(echo "$output" | jq -r '.pr_number')
assert_eq "round-trip pr_number" "87" "$pr"
teardown

report_results
