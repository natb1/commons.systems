#!/usr/bin/env bash
# Self-contained unit test for file-issue-usage-snapshot (#2504).
#
# Fixture-driven, no network. Each case uses an isolated project dir under a
# shared mktemp root. Session IDs are unique per case so cases do not bleed.
#
# Usage: bash test-file-issue-usage-snapshot.sh
# Exit 0 = all passed; non-zero = one or more failures.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
HELPER="$SCRIPT_DIR/file-issue-usage-snapshot"

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

assert_match() {
  local label="$1" pattern="$2" actual="$3"
  TOTAL=$((TOTAL + 1))
  if grep -qE "$pattern" <<<"$actual"; then
    PASS=$((PASS + 1))
    echo "  PASS: $label"
  else
    FAIL=$((FAIL + 1))
    echo "  FAIL: $label"
    echo "    pattern: '$pattern'"
    echo "    actual:  '$actual'"
  fi
}

# --- harness ----------------------------------------------------------------

ROOT=$(mktemp -d)

teardown() {
  if [[ -n "$ROOT" && -d "$ROOT" ]]; then
    rm -rf "$ROOT"
  fi
}
trap teardown EXIT

# Write one assistant JSONL record with the given token counts.
assistant_line() {
  local inp="$1" cc="$2" cr="$3" out="$4"
  printf '{"type":"assistant","message":{"usage":{"input_tokens":%d,"cache_creation_input_tokens":%d,"cache_read_input_tokens":%d,"output_tokens":%d}}}\n' \
    "$inp" "$cc" "$cr" "$out"
}

# Invoke the helper with fixture env. Requires SESSION_ID to be set by caller.
# FILE_ISSUE_PROJECTS_ROOT is always ROOT so the helper searches the shared temp.
run_helper() {
  FILE_ISSUE_PROJECTS_ROOT="$ROOT" CLAUDE_CODE_SESSION_ID="$SESSION_ID" \
    bash "$HELPER" "$@"
}

# ============================================================================
echo "Case 1: enter prints owner on first call, nested on second"
# ============================================================================
mkdir -p "$ROOT/proj-c1"
SESSION_ID="sess-c1"
TRANSCRIPT="$ROOT/proj-c1/${SESSION_ID}.jsonl"

# At least one transcript line so the session is locatable (cumulative = 0).
printf '{"type":"user","message":{"content":"start"}}\n' > "$TRANSCRIPT"

got=$(run_helper enter)
assert_eq "C1: first enter = owner" "owner" "$got"

got=$(run_helper enter)
assert_eq "C1: second enter = nested" "nested" "$got"

# ============================================================================
echo ""
echo "Case 2: additive sequential cycles (AC2)"
# ============================================================================
mkdir -p "$ROOT/proj-c2"
SESSION_ID="sess-c2"
TRANSCRIPT="$ROOT/proj-c2/${SESSION_ID}.jsonl"
SIDECAR="$ROOT/proj-c2/${SESSION_ID}.file-issue-attribution.json"

# Cumulative A: input=100 cc=200 cr=300 out=400
assistant_line 100 200 300 400 > "$TRANSCRIPT"

# Non-assistant line (proved to be ignored).
printf '{"type":"user","message":{"content":"ignored"}}\n' >> "$TRANSCRIPT"

# Cycle 1: enter at A, grow to B (+10 +20 +30 +40), finalize.
run_helper enter >/dev/null
assistant_line 10 20 30 40 >> "$TRANSCRIPT"
run_helper finalize
# Sidecar now holds delta(B-A) = 10,20,30,40.

# Between cycles: grow cumulative to C — must NOT count in cycle 2.
assistant_line 40 40 40 40 >> "$TRANSCRIPT"

# Cycle 2: enter at C, grow to D (+10 +20 +30 +40), finalize.
run_helper enter >/dev/null
assistant_line 10 20 30 40 >> "$TRANSCRIPT"
run_helper finalize
# Sidecar now holds (B-A)+(D-C) = 20,40,60,80.

assert_eq "C2: tokens.input == 20"          "20" "$(jq '.tokens.input'          "$SIDECAR")"
assert_eq "C2: tokens.cache_creation == 40" "40" "$(jq '.tokens.cache_creation' "$SIDECAR")"
assert_eq "C2: tokens.cache_read == 60"     "60" "$(jq '.tokens.cache_read'     "$SIDECAR")"
assert_eq "C2: tokens.output == 80"         "80" "$(jq '.tokens.output'         "$SIDECAR")"

# ============================================================================
echo ""
echo "Case 3: nested topic union"
# ============================================================================
mkdir -p "$ROOT/proj-c3"
SESSION_ID="sess-c3"
TRANSCRIPT="$ROOT/proj-c3/${SESSION_ID}.jsonl"
SIDECAR="$ROOT/proj-c3/${SESSION_ID}.file-issue-attribution.json"

# Initial cumulative: 50,60,70,80
assistant_line 50 60 70 80 > "$TRANSCRIPT"

# Owner enter (baseline captured at 50,60,70,80).
run_helper enter >/dev/null

# Grow by 5,6,7,8 — this is the delta we expect in the final sidecar.
assistant_line 5 6 7 8 >> "$TRANSCRIPT"

# Nested session records its topic (same SESSION_ID — the owner's baseline
# remains in place; nested's enter prints "nested" and touches nothing).
run_helper enter >/dev/null  # prints nested; baseline unchanged
run_helper record-topic "dispatch" "feature"

# Owner also records a topic (last type wins → "bug").
run_helper record-topic "security" "bug"

# Owner finalize.
run_helper finalize

# Topics must be the union ["dispatch","security"], order-insensitive.
got_topics=$(jq -r '.topics | sort | join(",")' "$SIDECAR")
assert_eq "C3: topics union = dispatch,security" "dispatch,security" "$got_topics"

# Tokens must equal the single-cycle delta 5,6,7,8.
assert_eq "C3: tokens.input == 5"          "5" "$(jq '.tokens.input'          "$SIDECAR")"
assert_eq "C3: tokens.cache_creation == 6" "6" "$(jq '.tokens.cache_creation' "$SIDECAR")"
assert_eq "C3: tokens.cache_read == 7"     "7" "$(jq '.tokens.cache_read'     "$SIDECAR")"
assert_eq "C3: tokens.output == 8"         "8" "$(jq '.tokens.output'         "$SIDECAR")"

# ============================================================================
echo ""
echo "Case 4: all four token classes with distinct values"
# ============================================================================
mkdir -p "$ROOT/proj-c4"
SESSION_ID="sess-c4"
TRANSCRIPT="$ROOT/proj-c4/${SESSION_ID}.jsonl"
SIDECAR="$ROOT/proj-c4/${SESSION_ID}.file-issue-attribution.json"

# Non-assistant line only — session is locatable; cumulative starts at 0.
printf '{"type":"user","message":{"content":"start"}}\n' > "$TRANSCRIPT"

run_helper enter >/dev/null

# Use distinct prime-adjacent values per class so a class swap fails the test.
assistant_line 1001 2002 3003 4004 >> "$TRANSCRIPT"

run_helper finalize

assert_eq "C4: tokens.input == 1001"          "1001" "$(jq '.tokens.input'          "$SIDECAR")"
assert_eq "C4: tokens.cache_creation == 2002" "2002" "$(jq '.tokens.cache_creation' "$SIDECAR")"
assert_eq "C4: tokens.cache_read == 3003"     "3003" "$(jq '.tokens.cache_read'     "$SIDECAR")"
assert_eq "C4: tokens.output == 4004"         "4004" "$(jq '.tokens.output'         "$SIDECAR")"

# ============================================================================
echo ""
echo "Case 5: subagent-path transcript location"
# ============================================================================
mkdir -p "$ROOT/proj-c5"
SESSION_ID="sess-c5"
SUBAGENT_DIR="$ROOT/proj-c5/${SESSION_ID}/subagents"
mkdir -p "$SUBAGENT_DIR"
SUBAGENT_JSONL="$SUBAGENT_DIR/agent-c5.jsonl"
# SESSION_DIR resolves to $ROOT/proj-c5 (three dirname levels up from the file).
SIDECAR="$ROOT/proj-c5/${SESSION_ID}.file-issue-attribution.json"

# No top-level transcript. Subagent transcript only.
printf '{"type":"user","message":{"content":"subagent task"}}\n' > "$SUBAGENT_JSONL"
assistant_line 77 88 99 11 >> "$SUBAGENT_JSONL"

# Ignored sibling .meta.json — must not confuse the helper (helper uses *.jsonl only).
printf '{"meta":"data"}\n' > "$SUBAGENT_DIR/agent-c5.meta.json"

# Enter at cumulative 77,88,99,11.
run_helper enter >/dev/null

# Grow by 3,4,5,6.
assistant_line 3 4 5 6 >> "$SUBAGENT_JSONL"

run_helper finalize

assert_eq "C5: tokens.input == 3"          "3" "$(jq '.tokens.input'          "$SIDECAR")"
assert_eq "C5: tokens.cache_creation == 4" "4" "$(jq '.tokens.cache_creation' "$SIDECAR")"
assert_eq "C5: tokens.cache_read == 5"     "5" "$(jq '.tokens.cache_read'     "$SIDECAR")"
assert_eq "C5: tokens.output == 6"         "6" "$(jq '.tokens.output'         "$SIDECAR")"

# ============================================================================
echo ""
echo "Case 6: empty topic / no labels"
# ============================================================================
mkdir -p "$ROOT/proj-c6"
SESSION_ID="sess-c6"
TRANSCRIPT="$ROOT/proj-c6/${SESSION_ID}.jsonl"
SIDECAR="$ROOT/proj-c6/${SESSION_ID}.file-issue-attribution.json"

printf '{"type":"user","message":{"content":"start"}}\n' > "$TRANSCRIPT"

run_helper enter >/dev/null

# record-topic with empty strings must not add anything to topics[].
run_helper record-topic "" ""

run_helper finalize

got_topics=$(jq -c '.topics' "$SIDECAR")
assert_eq "C6: topics == [] with empty record-topic" "[]" "$got_topics"

# ============================================================================
echo ""
echo "Case 7: sidecar field well-formedness"
# ============================================================================
mkdir -p "$ROOT/proj-c7"
SESSION_ID="sess-c7"
TRANSCRIPT="$ROOT/proj-c7/${SESSION_ID}.jsonl"
SIDECAR="$ROOT/proj-c7/${SESSION_ID}.file-issue-attribution.json"

printf '{"type":"user","message":{"content":"start"}}\n' > "$TRANSCRIPT"

run_helper enter >/dev/null
run_helper record-topic "ops" "maintenance"
run_helper finalize

got_schema=$(jq -r '.schema' "$SIDECAR")
assert_eq "C7: schema == file-issue.attribution.v1" "file-issue.attribution.v1" "$got_schema"

got_sid=$(jq -r '.session_id' "$SIDECAR")
assert_eq "C7: session_id matches" "sess-c7" "$got_sid"

got_at=$(jq -r '.measured_at' "$SIDECAR")
assert_match "C7: measured_at is ISO-8601 UTC" \
  '^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}Z$' \
  "$got_at"

# --- summary ----------------------------------------------------------------

echo ""
echo "================================"
echo "Results: $PASS/$TOTAL passed, $FAIL failed"
echo "================================"

if [[ "$FAIL" -gt 0 ]]; then
  exit 1
fi
