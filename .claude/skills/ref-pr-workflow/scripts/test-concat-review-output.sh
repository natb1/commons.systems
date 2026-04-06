#!/usr/bin/env bash
# Tests for concat-review-output.sh
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/test-helpers.sh"
SCRIPT="$SCRIPT_DIR/concat-review-output.sh"
REPO_ROOT=$(git rev-parse --show-toplevel 2>/dev/null)
TMP_DIR="$REPO_ROOT/tmp/test-concat-review"

cleanup() { rm -rf "$TMP_DIR"; }
trap cleanup EXIT

setup() {
  rm -rf "$TMP_DIR"
  mkdir -p "$TMP_DIR"
}

assert_file_contains() {
  local label="$1" file="$2" pattern="$3"
  TOTAL=$((TOTAL + 1))
  if grep -qF "$pattern" "$file"; then
    echo "  PASS: $label"
    PASS=$((PASS + 1))
  else
    echo "  FAIL: $label — pattern not found: $pattern"
    echo "    file contents:"
    head -10 "$file" | sed 's/^/      /'
    FAIL=$((FAIL + 1))
  fi
}

assert_exit_nonzero() {
  local label="$1"
  shift
  TOTAL=$((TOTAL + 1))
  if "$@" 2>/dev/null; then
    echo "  FAIL: $label — expected non-zero exit"
    FAIL=$((FAIL + 1))
  else
    echo "  PASS: $label"
    PASS=$((PASS + 1))
  fi
}

# --- Tests ---

test_basic_concatenation() {
  setup
  echo "Review content here" > "$TMP_DIR/review.txt"
  echo "Code reviewer content" > "$TMP_DIR/code-reviewer.txt"

  "$SCRIPT" "$TMP_DIR/output.txt" \
    "/review Output:$TMP_DIR/review.txt" \
    "pr-review-toolkit: code-reviewer:$TMP_DIR/code-reviewer.txt"

  assert_file_contains "basic: has first header" "$TMP_DIR/output.txt" "## /review Output"
  assert_file_contains "basic: has first content" "$TMP_DIR/output.txt" "Review content here"
  assert_file_contains "basic: has second header" "$TMP_DIR/output.txt" "## pr-review-toolkit: code-reviewer"
  assert_file_contains "basic: has second content" "$TMP_DIR/output.txt" "Code reviewer content"
}

test_missing_file() {
  setup
  echo "Exists" > "$TMP_DIR/exists.txt"

  "$SCRIPT" "$TMP_DIR/output.txt" \
    "Task A:$TMP_DIR/exists.txt" \
    "Task B:$TMP_DIR/nonexistent.txt"

  assert_file_contains "missing file: has content for existing" "$TMP_DIR/output.txt" "Exists"
  assert_file_contains "missing file: shows unavailable" "$TMP_DIR/output.txt" "Task unavailable"
}

test_empty_path() {
  setup
  echo "Exists" > "$TMP_DIR/exists.txt"

  "$SCRIPT" "$TMP_DIR/output.txt" \
    "Task A:$TMP_DIR/exists.txt" \
    "Task B:"

  assert_file_contains "empty path: has content for existing" "$TMP_DIR/output.txt" "Exists"
  assert_file_contains "empty path: shows unavailable" "$TMP_DIR/output.txt" "Task unavailable"
}

test_output_path_guard() {
  setup
  echo "Content" > "$TMP_DIR/input.txt"

  # Attempt to write outside tmp/ — should fail
  assert_exit_nonzero "path guard: rejects output outside tmp/" \
    "$SCRIPT" "/dev/null" "Label:$TMP_DIR/input.txt"
}

test_no_args() {
  assert_exit_nonzero "no args: exits non-zero" "$SCRIPT"
}

test_only_output_file() {
  assert_exit_nonzero "only output file: exits non-zero" "$SCRIPT" "$TMP_DIR/output.txt"
}

test_first_section_no_leading_newlines() {
  setup
  echo "First content" > "$TMP_DIR/first.txt"

  "$SCRIPT" "$TMP_DIR/output.txt" "First:$TMP_DIR/first.txt"

  # First line should be the header, no leading blank lines
  local first_line
  first_line=$(head -1 "$TMP_DIR/output.txt")
  assert_eq "first section: no leading newlines" "## First" "$first_line"
}

test_all_seven_labels() {
  setup
  for i in 1 2 3 4 5 6 7; do
    echo "Content $i" > "$TMP_DIR/task$i.txt"
  done

  "$SCRIPT" "$TMP_DIR/output.txt" \
    "/review Output:$TMP_DIR/task1.txt" \
    "pr-review-toolkit: code-reviewer:$TMP_DIR/task2.txt" \
    "/simplify Output:$TMP_DIR/task3.txt" \
    "pr-review-toolkit: comment-analyzer:$TMP_DIR/task4.txt" \
    "pr-review-toolkit: pr-test-analyzer:$TMP_DIR/task5.txt" \
    "pr-review-toolkit: silent-failure-hunter:$TMP_DIR/task6.txt" \
    "pr-review-toolkit: type-design-analyzer:$TMP_DIR/task7.txt"

  for i in 1 2 3 4 5 6 7; do
    assert_file_contains "all seven: has content $i" "$TMP_DIR/output.txt" "Content $i"
  done
  assert_file_contains "all seven: has colon-containing label" "$TMP_DIR/output.txt" "## pr-review-toolkit: code-reviewer"
}

test_task_dir_basic() {
  setup
  mkdir -p "$TMP_DIR/tasks"
  echo "Review from task dir" > "$TMP_DIR/tasks/review.txt"
  echo "Code reviewer from task dir" > "$TMP_DIR/tasks/code-reviewer.txt"

  "$SCRIPT" --task-dir "$TMP_DIR/tasks" "$TMP_DIR/output.txt" \
    "/review Output:review.txt" \
    "pr-review-toolkit: code-reviewer:code-reviewer.txt"

  assert_file_contains "task-dir basic: has first content" "$TMP_DIR/output.txt" "Review from task dir"
  assert_file_contains "task-dir basic: has second content" "$TMP_DIR/output.txt" "Code reviewer from task dir"
  assert_file_contains "task-dir basic: has header" "$TMP_DIR/output.txt" "## /review Output"
}

test_task_dir_empty_path() {
  setup
  mkdir -p "$TMP_DIR/tasks"
  echo "Exists" > "$TMP_DIR/tasks/exists.txt"

  "$SCRIPT" --task-dir "$TMP_DIR/tasks" "$TMP_DIR/output.txt" \
    "Task A:exists.txt" \
    "Task B:"

  assert_file_contains "task-dir empty path: has content" "$TMP_DIR/output.txt" "Exists"
  assert_file_contains "task-dir empty path: shows unavailable" "$TMP_DIR/output.txt" "Task unavailable"
}

test_task_dir_missing_file() {
  setup
  mkdir -p "$TMP_DIR/tasks"

  "$SCRIPT" --task-dir "$TMP_DIR/tasks" "$TMP_DIR/output.txt" \
    "Task A:nonexistent.txt"

  assert_file_contains "task-dir missing file: shows unavailable" "$TMP_DIR/output.txt" "Task unavailable"
}

# --- Run ---

test_basic_concatenation
test_missing_file
test_empty_path
test_output_path_guard
test_no_args
test_only_output_file
test_first_section_no_leading_newlines
test_all_seven_labels
test_task_dir_basic
test_task_dir_empty_path
test_task_dir_missing_file

report_results
