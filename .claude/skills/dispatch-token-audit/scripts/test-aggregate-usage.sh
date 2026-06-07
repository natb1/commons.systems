#!/usr/bin/env bash
# Self-contained unit test for aggregate-usage.sh (#1177).
#
# Builds a fixture projects tree under a temp dir, points aggregate-usage.sh
# at it via DISPATCH_AUDIT_PROJECTS_ROOT, runs the aggregator, and asserts the
# JSON output matches hand-computed known values.
#
# Usage: bash test-aggregate-usage.sh
# Exit 0 = all passed; non-zero = one or more failures.
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

ROOT=""

setup() {
  ROOT=$(mktemp -d)

  # 1. Worker session:
  #    $ROOT/-home-x-worktrees-999-fixture/sess-worker.jsonl
  local worktree_dir="$ROOT/-home-x-worktrees-999-fixture"
  mkdir -p "$worktree_dir"

  local worker_jsonl="$worktree_dir/sess-worker.jsonl"

  # line 1: first user line — classifies as worker
  printf '%s\n' '{"type":"user","message":{"content":"<command-name>/dispatch-worker</command-name>"}}' \
    >> "$worker_jsonl"

  # line 2: assistant — plan-implement, opus, usage input=1000, cc=2000, cr=4000, out=500
  printf '%s\n' '{"type":"assistant","attributionSkill":"plan-implement","isSidechain":false,"gitBranch":"999-fixture","message":{"model":"claude-opus-4-8","usage":{"input_tokens":1000,"cache_creation_input_tokens":2000,"cache_read_input_tokens":4000,"output_tokens":500}}}' \
    >> "$worker_jsonl"

  # line 3: assistant — same model/skill/branch, usage input=100, cc=200, cr=400, out=50
  printf '%s\n' '{"type":"assistant","attributionSkill":"plan-implement","isSidechain":false,"gitBranch":"999-fixture","message":{"model":"claude-opus-4-8","usage":{"input_tokens":100,"cache_creation_input_tokens":200,"cache_read_input_tokens":400,"output_tokens":50}}}' \
    >> "$worker_jsonl"

  # line 4: tool-error user line — normalizes to "Exit code N"
  # The \n inside the content string is the two-character JSON escape sequence
  # (backslash + n), not a real newline. printf '%s\n' with single-quoted string
  # keeps the backslash literal in the file bytes.
  printf '%s\n' '{"type":"user","message":{"content":[{"type":"tool_result","is_error":true,"content":"Exit code 1\nsome detail"}]}}' \
    >> "$worker_jsonl"

  # Verify fixture line is valid JSON
  jq . "$worker_jsonl" >/dev/null

  # 2. Subagent transcript:
  #    $ROOT/-home-x-worktrees-999-fixture/sess-worker/subagents/agent-aaa.jsonl
  local subagent_dir="$worktree_dir/sess-worker/subagents"
  mkdir -p "$subagent_dir"

  local subagent_jsonl="$subagent_dir/agent-aaa.jsonl"

  # first user line for realism
  printf '%s\n' '{"type":"user","message":{"content":"subagent task"}}' \
    >> "$subagent_jsonl"

  # assistant — sonnet, isSidechain true, no attributionSkill,
  # usage input=10, cc=20, cr=40, out=5
  printf '%s\n' '{"type":"assistant","isSidechain":true,"gitBranch":"999-fixture","message":{"model":"claude-sonnet-4-6","usage":{"input_tokens":10,"cache_creation_input_tokens":20,"cache_read_input_tokens":40,"output_tokens":5}}}' \
    >> "$subagent_jsonl"

  jq . "$subagent_jsonl" >/dev/null

  # 3. Bare router session:
  #    $ROOT/-home-x--bare/sess-router.jsonl
  local bare_dir="$ROOT/-home-x--bare"
  mkdir -p "$bare_dir"

  local router_jsonl="$bare_dir/sess-router.jsonl"

  # line 1: first user line (any content)
  printf '%s\n' '{"type":"user","message":{"content":"<command-name>/dispatch</command-name>"}}' \
    >> "$router_jsonl"

  # line 2: assistant — gitBranch HEAD -> router-tick, opus,
  # usage input=1, cc=2, cr=4, out=1
  printf '%s\n' '{"type":"assistant","gitBranch":"HEAD","message":{"model":"claude-opus-4-8","usage":{"input_tokens":1,"cache_creation_input_tokens":2,"cache_read_input_tokens":4,"output_tokens":1}}}' \
    >> "$router_jsonl"

  jq . "$router_jsonl" >/dev/null

  # 4. Touch every .jsonl to now so they fall inside the window
  touch "$worker_jsonl" "$subagent_jsonl" "$router_jsonl"

  export DISPATCH_AUDIT_PROJECTS_ROOT="$ROOT"
}

teardown() {
  if [[ -n "$ROOT" && -d "$ROOT" ]]; then
    rm -rf "$ROOT"
  fi
}

trap teardown EXIT

# --- run -------------------------------------------------------------------

setup

echo "Running aggregate-usage.sh against fixture..."
OUT=$(bash "$SCRIPT_DIR/aggregate-usage.sh" --days 7)

# Hand-computed expected totals:
#   input = 1000 + 100 + 10 + 1 = 1111
#   cache_creation = 2000 + 200 + 20 + 2 = 2222
#   cache_read = 4000 + 400 + 40 + 4 = 4444
#   output = 500 + 50 + 5 + 1 = 556
#   price = (1111*15 + 2222*18.75 + 4444*1.5 + 556*75) / 1e6
EXPECTED_PRICE=$(jq -n '(1111*15 + 2222*18.75 + 4444*1.5 + 556*75)/1e6')

echo ""
echo "--- assertions ---"

assert_eq "totals.input" "1111" "$(jq '.totals.input' <<<"$OUT")"
assert_eq "totals.cache_creation" "2222" "$(jq '.totals.cache_creation' <<<"$OUT")"
assert_eq "totals.cache_read" "4444" "$(jq '.totals.cache_read' <<<"$OUT")"
assert_eq "totals.output" "556" "$(jq '.totals.output' <<<"$OUT")"
assert_eq "totals.price_proxy_usd" "$EXPECTED_PRICE" "$(jq '.totals.price_proxy_usd' <<<"$OUT")"

assert_eq "by_session_type.worker.sessions" "1" \
  "$(jq '.by_session_type.worker.sessions' <<<"$OUT")"
assert_eq "by_session_type.subagent.sessions" "1" \
  "$(jq '.by_session_type.subagent.sessions' <<<"$OUT")"
assert_eq 'by_session_type["router-tick"].sessions' "1" \
  "$(jq '.by_session_type["router-tick"].sessions' <<<"$OUT")"

assert_eq 'by_phase["plan-implement"].output' "550" \
  "$(jq '.by_phase["plan-implement"].output' <<<"$OUT")"

assert_eq 'tool_errors: "Exit code N" count' "1" \
  "$(jq '[.tool_errors[] | select(.signature=="Exit code N")] | length' <<<"$OUT")"
assert_eq 'tool_errors: "Exit code N" .count field' "1" \
  "$(jq '[.tool_errors[] | select(.signature=="Exit code N")][0].count' <<<"$OUT")"

report_results
exit $FAIL
