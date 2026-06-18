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
  # Tool calls A,B (context-pack, gh issue). Usage/model unchanged; content added.
  printf '%s\n' '{"type":"assistant","attributionSkill":"plan-implement","isSidechain":false,"gitBranch":"999-fixture","message":{"model":"claude-opus-4-8","content":[{"type":"tool_use","id":"toolu_001","name":"Bash","input":{"command":".claude/skills/dispatch-propagate/scripts/dispatch-context-pack 999 --pr"}},{"type":"tool_use","id":"toolu_002","name":"Bash","input":{"command":"gh issue view 999 --json labels"}}],"usage":{"input_tokens":1000,"cache_creation_input_tokens":2000,"cache_read_input_tokens":4000,"output_tokens":500}}}' \
    >> "$worker_jsonl"

  # line 3: assistant — same model/skill/branch, usage input=100, cc=200, cr=400, out=50
  # Tool calls A,B again → session document order A,B,A,B. Usage/model unchanged.
  printf '%s\n' '{"type":"assistant","attributionSkill":"plan-implement","isSidechain":false,"gitBranch":"999-fixture","message":{"model":"claude-opus-4-8","content":[{"type":"tool_use","id":"toolu_003","name":"Bash","input":{"command":".claude/skills/dispatch-propagate/scripts/dispatch-context-pack 999 --pr"}},{"type":"tool_use","id":"toolu_004","name":"Bash","input":{"command":"gh issue view 999 --json labels"}}],"usage":{"input_tokens":100,"cache_creation_input_tokens":200,"cache_read_input_tokens":400,"output_tokens":50}}}' \
    >> "$worker_jsonl"

  # line 4: assistant — zero-usage fixture line exercising cmd_prefix's env-var
  # stripping (#1588). One Bash tool call whose command begins with an env-var
  # assignment; cmd_prefix must strip it, keying the n-gram as "Bash:npm run".
  # All-zero usage so every totals / price / baseline_context / session-count
  # assertion is untouched; only the worker tool_calls order gains a trailing
  # NPM token (A,B,A,B,NPM).
  printf '%s\n' '{"type":"assistant","attributionSkill":"plan-implement","isSidechain":false,"gitBranch":"999-fixture","message":{"model":"claude-opus-4-8","content":[{"type":"tool_use","id":"toolu_005","name":"Bash","input":{"command":"VITE_GITHUB_BRANCH=foo npm run build"}}],"usage":{"input_tokens":0,"cache_creation_input_tokens":0,"cache_read_input_tokens":0,"output_tokens":0}}}' \
    >> "$worker_jsonl"

  # line 5: tool-error user line — normalizes to "Exit code N"
  # The \n inside the content string is the two-character JSON escape sequence
  # (backslash + n), not a real newline. printf '%s\n' with single-quoted string
  # keeps the backslash literal in the file bytes.
  printf '%s\n' '{"type":"user","message":{"content":[{"type":"tool_result","is_error":true,"content":"Exit code 1\nsome detail"}]}}' \
    >> "$worker_jsonl"

  # line 6: tool-result user line for the toolu_001 Bash call — known-length
  # ASCII payload "PAYLOAD_0123456789" (18 bytes) attributed to Bash. The error
  # result above has NO tool_use_id → attributed to "unknown" (23 bytes).
  printf '%s\n' '{"type":"user","message":{"content":[{"type":"tool_result","tool_use_id":"toolu_001","content":"PAYLOAD_0123456789"}]}}' \
    >> "$worker_jsonl"

  # Verify fixture line is valid JSON
  jq . "$worker_jsonl" >/dev/null

  # 1b. Per-session sidecar (#1861) next to the worker transcript. Found by
  #     deriving its path from the in-window .jsonl stem, so its own mtime is
  #     irrelevant. The aggregator projects {repo,issue,pr,base_sha,branch}.
  local worker_stamp="$worktree_dir/sess-worker.dispatch-stamp.json"
  printf '%s\n' '{"schema":1,"session_id":"sess-worker","repo":"natb1/commons.systems","issue":999,"pr":1234,"branch":"999-fixture","base_sha":"deadbeef","stamped_at":"2026-01-01T00:00:00Z"}' \
    >> "$worker_stamp"
  jq . "$worker_stamp" >/dev/null

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

  # 2b. Second subagent transcript (over-120k context, review-fix phase):
  #     $ROOT/-home-x-worktrees-999-fixture/sess-worker/subagents/agent-bbb.jsonl
  local subagent_b_jsonl="$subagent_dir/agent-bbb.jsonl"

  printf '%s\n' '{"type":"user","message":{"content":"review-fix subagent task"}}' \
    >> "$subagent_b_jsonl"

  # assistant — review-fix, sonnet, isSidechain true,
  # usage input=0, cc=0, cr=130000, out=0 → peak_context=130000 > 120000
  printf '%s\n' '{"type":"assistant","attributionSkill":"review-fix","isSidechain":true,"gitBranch":"999-fixture","message":{"model":"claude-sonnet-4-6","usage":{"input_tokens":0,"cache_creation_input_tokens":0,"cache_read_input_tokens":130000,"output_tokens":0}}}' \
    >> "$subagent_b_jsonl"

  jq . "$subagent_b_jsonl" >/dev/null

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
  touch "$worker_jsonl" "$subagent_jsonl" "$router_jsonl" "$subagent_b_jsonl"

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
#   cache_read = 4000 + 400 + 40 + 4 + 130000 = 134444  (agent-bbb adds cr=130000)
#   output = 500 + 50 + 5 + 1 = 556
#   price = (1111*15 + 2222*18.75 + 134444*1.5 + 556*75) / 1e6
EXPECTED_PRICE=$(jq -n '(1111*15 + 2222*18.75 + 134444*1.5 + 556*75)/1e6')
# baseline_context boot-proxy sums init (input,cache_creation) over ALL four
# sessions; agent-bbb has init input=0/cc=0 so its term is 0 (kept for clarity).
EXPECTED_BASELINE_PROXY=$(jq -n '(1000*15 + 2000*18.75)/1e6 + (10*15 + 20*18.75)/1e6 + (0*15 + 0*18.75)/1e6 + (1*15 + 2*18.75)/1e6')

echo ""
echo "--- assertions ---"

assert_eq "totals.input" "1111" "$(jq '.totals.input' <<<"$OUT")"
assert_eq "totals.cache_creation" "2222" "$(jq '.totals.cache_creation' <<<"$OUT")"
assert_eq "totals.cache_read" "134444" "$(jq '.totals.cache_read' <<<"$OUT")"
assert_eq "totals.output" "556" "$(jq '.totals.output' <<<"$OUT")"
assert_eq "totals.price_proxy_usd" "$EXPECTED_PRICE" "$(jq '.totals.price_proxy_usd' <<<"$OUT")"

assert_eq "by_session_type.worker.sessions" "1" \
  "$(jq '.by_session_type.worker.sessions' <<<"$OUT")"
assert_eq "by_session_type.subagent.sessions" "2" \
  "$(jq '.by_session_type.subagent.sessions' <<<"$OUT")"
assert_eq 'by_session_type["router-tick"].sessions' "1" \
  "$(jq '.by_session_type["router-tick"].sessions' <<<"$OUT")"

assert_eq 'by_phase["plan-implement"].output' "550" \
  "$(jq '.by_phase["plan-implement"].output' <<<"$OUT")"

# artifact join (#1861): the worker session's sidecar surfaces as
# .sessions[].artifact = {repo,issue,pr,base_sha,branch}; sessions with no
# sidecar (the router) carry artifact == null.
assert_eq "sessions sess-worker artifact.pr" "1234" \
  "$(jq '.sessions[] | select(.id=="sess-worker") | .artifact.pr' <<<"$OUT")"
assert_eq "sessions sess-worker artifact.repo" "natb1/commons.systems" \
  "$(jq -r '.sessions[] | select(.id=="sess-worker") | .artifact.repo' <<<"$OUT")"
assert_eq "sessions sess-worker artifact.issue" "999" \
  "$(jq '.sessions[] | select(.id=="sess-worker") | .artifact.issue' <<<"$OUT")"
assert_eq "sessions sess-router artifact null" "null" \
  "$(jq '.sessions[] | select(.id=="sess-router") | .artifact' <<<"$OUT")"

assert_eq 'tool_errors: "Exit code N" count' "1" \
  "$(jq '[.tool_errors[] | select(.signature=="Exit code N")] | length' <<<"$OUT")"
assert_eq 'tool_errors: "Exit code N" .count field' "1" \
  "$(jq '[.tool_errors[] | select(.signature=="Exit code N")][0].count' <<<"$OUT")"

# tool_sequences: worker session calls A,B,A,B,NPM → bigram [A,B] count 2, n 2.
assert_eq 'tool_sequences [context-pack,gh issue] bigram count' "2" \
  "$(jq '[.tool_sequences.top[] | select(.sequence==["Bash:.claude/skills/dispatch-propagate/scripts/dispatch-context-pack","Bash:gh issue"])][0].count' <<<"$OUT")"
assert_eq 'tool_sequences that bigram n==2' "2" \
  "$(jq '[.tool_sequences.top[] | select(.sequence==["Bash:.claude/skills/dispatch-propagate/scripts/dispatch-context-pack","Bash:gh issue"])][0].n' <<<"$OUT")"
assert_eq 'tool_sequences.truncated' "0" \
  "$(jq '.tool_sequences.truncated' <<<"$OUT")"
assert_eq 'tool_sequences.kept == distinct' "true" \
  "$(jq '.tool_sequences.kept == .tool_sequences.distinct' <<<"$OUT")"
# cmd_prefix strips a leading env-var assignment: the fixture command
# "VITE_GITHUB_BRANCH=foo npm run build" must key as "Bash:npm run", never
# "Bash:VITE_GITHUB_BRANCH=foo npm". (#1588)
assert_eq 'tool_sequences env-var prefix stripped to "Bash:npm run"' "1" \
  "$(jq '[.tool_sequences.top[] | select(.sequence | index("Bash:npm run"))] | length > 0 | if . then 1 else 0 end' <<<"$OUT")"
assert_eq 'tool_sequences: no n-gram token keeps an env-var assignment' "0" \
  "$(jq '[.tool_sequences.top[].sequence[] | select(test("="))] | length' <<<"$OUT")"

# payload_bytes: Bash payload "PAYLOAD_0123456789" (18 bytes) + the no-id error
# result "Exit code 1\nsome detail" parsed to 23 bytes (the \n becomes a real
# newline) → total 41 bytes.
PAYLOAD_TOTAL=$(jq -n '("PAYLOAD_0123456789"|utf8bytelength) + ("Exit code 1\nsome detail"|utf8bytelength)')
PAYLOAD_BASH=$(jq -n '"PAYLOAD_0123456789"|utf8bytelength')
PAYLOAD_UNKNOWN=$(jq -n '"Exit code 1\nsome detail"|utf8bytelength')

assert_eq "payload_bytes.total" "$PAYLOAD_TOTAL" \
  "$(jq '.payload_bytes.total' <<<"$OUT")"
assert_eq "payload_bytes Bash bytes" "$PAYLOAD_BASH" \
  "$(jq '[.payload_bytes.by_tool[] | select(.tool=="Bash")][0].bytes' <<<"$OUT")"
assert_eq "payload_bytes Bash results" "1" \
  "$(jq '[.payload_bytes.by_tool[] | select(.tool=="Bash")][0].results' <<<"$OUT")"
assert_eq "payload_bytes unknown bytes" "$PAYLOAD_UNKNOWN" \
  "$(jq '[.payload_bytes.by_tool[] | select(.tool=="unknown")][0].bytes' <<<"$OUT")"
assert_eq "payload_bytes worst_sessions[0].id" "sess-worker" \
  "$(jq -r '.payload_bytes.worst_sessions[0].id' <<<"$OUT")"

# context_over_120k lens: only agent-bbb (cr=130000) crosses threshold.
# worker peaks at input+cc+cr of its largest msg = 1000+2000+4000=7000;
# agent-aaa peaks at 10+20+40=70; router peaks at 1+2+4=7.
assert_eq "context_over_120k.sessions" "1" \
  "$(jq '.lenses.context_over_120k.sessions' <<<"$OUT")"
assert_eq 'context_over_120k.by_phase["review-fix"].sessions' "1" \
  "$(jq '.lenses.context_over_120k.by_phase["review-fix"].sessions' <<<"$OUT")"

# --- baseline_context lens ---
# baseline_context counts ALL sessions (rows). Our PR's agent-bbb is a 4th
# in-window transcript, so sessions==4. Its first assistant msg has init
# input=0/cc=0 → boot=0, so it does not change peak_boot_tokens (still 3000)
# nor total_proxy_usd. Boot-token list across the four sessions sorts to
# [0, 3, 30, 3000]; the even-length median is (3+30)/2 = 16.5.
assert_eq "lenses.baseline_context.sessions" "4" \
  "$(jq '.lenses.baseline_context.sessions' <<<"$OUT")"
assert_eq "lenses.baseline_context.peak_boot_tokens" "3000" \
  "$(jq '.lenses.baseline_context.peak_boot_tokens' <<<"$OUT")"
assert_eq "lenses.baseline_context.median_boot_tokens" "16.5" \
  "$(jq '.lenses.baseline_context.median_boot_tokens' <<<"$OUT")"
assert_eq "lenses.baseline_context.total_proxy_usd" "$EXPECTED_BASELINE_PROXY" \
  "$(jq '.lenses.baseline_context.total_proxy_usd' <<<"$OUT")"

report_results
exit $FAIL
