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

# Outcome-envelope fixture blocks (#1860). Authored as literal bytes so the
# marker `<!-- dispatch:outcome:v1 -->` is byte-exact — the reader anchors on it.
# envelope_block builds the marker + fenced JSON with real newlines; the line is
# embedded into .jsonl via jq so .content is correctly escaped.
#
# Two body shapes are exercised on purpose (#1904 regression guard). The reader's
# match/2 uses the "m" flag, which in jq/Oniguruma means DOTALL ("." matches
# newlines) — NOT PCRE's multiline-anchor meaning. dispatch-emit-outcome runs
# `jq -n` WITHOUT `-c`, so it emits a pretty-printed MULTI-LINE object; the "m"
# flag is what lets the reader capture that whole. So the WORKER envelope is
# authored MULTI-LINE (pretty-printed via envelope_block_pretty) — its rich
# non-zero field assertions below would all fail if the "m"/DOTALL capture
# regressed — while the ROUTER envelope stays compact single-line, keeping both
# shapes covered.
WORKER_ENV_JSON='{"schema":"dispatch.outcome.v1","phase":"review","repo":"natb1/commons.systems","issue":999,"pr":1234,"base_sha":"abc123","findings_surfaced":8,"findings_actionable":5,"fixes_applied":3,"followups_filed":2,"subagents_launched":12,"disposition":"completed_with_fixes","terminated_reason":null}'
ROUTER_ENV_JSON='{"schema":"dispatch.outcome.v1","phase":"qa","repo":"natb1/commons.systems","issue":999,"pr":1234,"base_sha":null,"findings_surfaced":0,"findings_actionable":0,"fixes_applied":0,"followups_filed":0,"subagents_launched":0,"disposition":"completed","terminated_reason":null}'
SUBAGENT_ENV_JSON='{"schema":"dispatch.outcome.v1","phase":"review","repo":"natb1/commons.systems","issue":999,"pr":1234,"base_sha":"def456","findings_surfaced":1000,"findings_actionable":1000,"fixes_applied":1000,"followups_filed":1000,"subagents_launched":1000,"disposition":"escalated","terminated_reason":"subagent excluded"}'
# Compact single-line body. envelope_block_pretty emits the same JSON re-rendered
# multi-line by `jq .` — the shape dispatch-emit-outcome actually produces.
envelope_block() { printf '<!-- dispatch:outcome:v1 -->\n```json\n%s\n```' "$1"; }
envelope_block_pretty() { printf '<!-- dispatch:outcome:v1 -->\n```json\n%s\n```' "$(jq . <<<"$1")"; }
RECOVERY_ENV_JSON='{"schema":"dispatch.outcome.v1","phase":"review","repo":"natb1/commons.systems","issue":998,"pr":5555,"base_sha":"rec111","findings_surfaced":5555,"findings_actionable":4444,"fixes_applied":3333,"followups_filed":2222,"subagents_launched":1111,"disposition":"completed_with_fixes","terminated_reason":null}'
WORKER_BLOCK="$(envelope_block_pretty "$WORKER_ENV_JSON")"
ROUTER_BLOCK="$(envelope_block "$ROUTER_ENV_JSON")"
SUBAGENT_BLOCK="$(envelope_block "$SUBAGENT_ENV_JSON")"
RECOVERY_BLOCK="$(envelope_block "$RECOVERY_ENV_JSON")"
# Fixture self-check: the WORKER body must be genuinely multi-line (more lines
# than the compact ROUTER block), else the DOTALL guard below is silently
# testing nothing (#1904).
if [[ "$(grep -c '' <<<"$WORKER_BLOCK")" -le "$(grep -c '' <<<"$ROUTER_BLOCK")" ]]; then
  echo "FATAL: WORKER_BLOCK is not multi-line; #1904 DOTALL guard is vacuous" >&2
  exit 1
fi

ROOT=""

setup() {
  ROOT=$(mktemp -d)

  # 1. Worker session:
  #    $ROOT/-home-x-worktrees-999-fixture/sess-worker.jsonl
  local worktree_dir="$ROOT/-home-x-worktrees-999-fixture"
  mkdir -p "$worktree_dir"

  local worker_jsonl="$worktree_dir/sess-worker.jsonl"

  # line 1: first user line — classifies as worker
  printf '%s\n' '{"type":"user","message":{"content":"<command-name>/plan-issue</command-name>"}}' \
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

  # line 7: outcome-envelope tool_result (#1860). tool_use_id toolu_001 maps to a
  # Bash tool_use, so its bytes land in the Bash payload bucket. Built with jq so
  # the multi-line block is correctly JSON-escaped in .content.
  jq -nc --arg c "$WORKER_BLOCK" \
    '{type:"user",message:{content:[{type:"tool_result",tool_use_id:"toolu_001",content:$c}]}}' \
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

  # outcome-envelope on a SUBAGENT transcript (#1860), distinctive 1000 counts.
  # The reader EXCLUDES subagent envelopes from by_phase_outcome; this proves it
  # does not inflate the review pool. No tool_use_id -> "unknown" payload bucket.
  jq -nc --arg c "$SUBAGENT_BLOCK" \
    '{type:"user",message:{content:[{type:"tool_result",content:$c}]}}' \
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

  # outcome-envelope on the router-tick (non-subagent) session (#1860): a qa
  # clean-pass with zero counts, exercising the null-guard (rates -> null) and a
  # second phase bucket. No tool_use_id -> "unknown" payload bucket.
  jq -nc --arg c "$ROUTER_BLOCK" \
    '{type:"user",message:{content:[{type:"tool_result",content:$c}]}}' \
    >> "$router_jsonl"

  jq . "$router_jsonl" >/dev/null

  # 4. Recovery session (NEGATIVE regression fixture, #1905):
  #    $ROOT/-home-x-worktrees-998-recovery/sess-recovery.jsonl
  #    Classifies as `recovery` (firstuser_str contains /recover-api-error).
  #    Zero usage so token/price/baseline-proxy totals are unchanged.
  #    Carries a RECOVERY_BLOCK envelope with distinctive 5555 counts;
  #    by_phase_outcome MUST NOT include it after the allowlist filter change.
  local recovery_dir="$ROOT/-home-x-worktrees-998-recovery"
  mkdir -p "$recovery_dir"

  local recovery_jsonl="$recovery_dir/sess-recovery.jsonl"

  # line 1: first user line — classifies as recovery
  printf '%s\n' '{"type":"user","message":{"content":"<command-name>/recover-api-error</command-name>"}}' \
    >> "$recovery_jsonl"

  # line 2: assistant — opus, normal gitBranch, ZERO usage so totals stay stable
  printf '%s\n' '{"type":"assistant","gitBranch":"998-recovery","message":{"model":"claude-opus-4-8","usage":{"input_tokens":0,"cache_creation_input_tokens":0,"cache_read_input_tokens":0,"output_tokens":0}}}' \
    >> "$recovery_jsonl"

  # line 3: outcome-envelope tool_result, no tool_use_id -> "unknown" payload bucket
  jq -nc --arg c "$RECOVERY_BLOCK" \
    '{type:"user",message:{content:[{type:"tool_result",content:$c}]}}' \
    >> "$recovery_jsonl"

  jq . "$recovery_jsonl" >/dev/null

  # 5. Touch every .jsonl to now so they fall inside the window
  touch "$worker_jsonl" "$subagent_jsonl" "$router_jsonl" "$subagent_b_jsonl" "$recovery_jsonl"

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

# --- truthful per-model cost_usd (#2027) ------------------------------------
# cost_usd prices each session by its REAL model family (opus/sonnet/haiku),
# unlike the uniform Opus-rate price_proxy_usd. Single-component buckets are one
# /1e6 division (exact); multi-component buckets sum the per-component terms.
#
# Worker (sess-worker): plan-implement / opus, summed usage
# (input=1100, cache_creation=2200, cache_read=4400, output=550) at opus rates
# (5 / 6.25 / 0.50 / 25 per Mtok).
EXPECTED_WORKER_COST=$(jq -n '(1100*5 + 2200*6.25 + 4400*0.50 + 550*25)/1e6')
assert_eq "sessions[sess-worker].cost_usd" "$EXPECTED_WORKER_COST" \
  "$(jq '[.sessions[]|select(.id=="sess-worker")][0].cost_usd' <<<"$OUT")"
assert_eq 'by_phase["plan-implement"].cost_usd' "$EXPECTED_WORKER_COST" \
  "$(jq '.by_phase["plan-implement"].cost_usd' <<<"$OUT")"
assert_eq 'by_phase_model["plan-implement\tclaude-opus-4-8"].cost_usd' "$EXPECTED_WORKER_COST" \
  "$(jq '.by_phase_model["plan-implement\tclaude-opus-4-8"].cost_usd' <<<"$OUT")"

# agent-aaa: sonnet (skill <none>), usage (10,20,40,5) at sonnet rates
# (3 / 3.75 / 0.30 / 15 per Mtok).
EXPECTED_AAA_COST=$(jq -n '(10*3 + 20*3.75 + 40*0.30 + 5*15)/1e6')
assert_eq "sessions[agent-aaa].cost_usd (sonnet)" "$EXPECTED_AAA_COST" \
  "$(jq '[.sessions[]|select(.id=="agent-aaa")][0].cost_usd' <<<"$OUT")"

# by_model["claude-sonnet-4-6"] is CROSS-SESSION (agent-aaa + agent-bbb) → SUM
# the per-component terms: aaa (10,20,40,5) + bbb cache_read=130000.
EXPECTED_SONNET_MODEL_COST=$(jq -n '(10*3 + 20*3.75 + 40*0.30 + 5*15)/1e6 + (130000*0.30)/1e6')
assert_eq 'by_model["claude-sonnet-4-6"].cost_usd' "$EXPECTED_SONNET_MODEL_COST" \
  "$(jq '.by_model["claude-sonnet-4-6"].cost_usd' <<<"$OUT")"

# AC#3: the same token count costs materially less at Sonnet rates than at Opus
# rates. agent-bbb's review-fix usage is pure cache_read=130000; at sonnet's
# 0.30/Mtok it is 0.039, strictly less than opus' 0.50/Mtok (0.065).
SONNET_BBB=$(jq -n '(130000*0.30)/1e6')   # 0.039
OPUS_SAME=$(jq -n '(130000*0.50)/1e6')    # 0.065
assert_eq "AC#3: sonnet review-fix cost < same tokens at opus" "true" \
  "$(jq --argjson s "$SONNET_BBB" --argjson o "$OPUS_SAME" \
     '.by_phase_model["review-fix\tclaude-sonnet-4-6"].cost_usd == $s and $s < $o' <<<"$OUT")"

# price_model: the four uniform proxy keys (writer contract) survive unchanged,
# and the new per-family actual_rates_per_mtok table is present.
assert_eq "price_model.input_per_mtok (proxy unchanged)" "15" \
  "$(jq '.price_model.input_per_mtok' <<<"$OUT")"
assert_eq "price_model.actual_rates_per_mtok.opus.output" "25" \
  "$(jq '.price_model.actual_rates_per_mtok.opus.output' <<<"$OUT")"

assert_eq "by_session_type.worker.sessions" "1" \
  "$(jq '.by_session_type.worker.sessions' <<<"$OUT")"
assert_eq "by_session_type.subagent.sessions" "2" \
  "$(jq '.by_session_type.subagent.sessions' <<<"$OUT")"
assert_eq 'by_session_type["router-tick"].sessions' "1" \
  "$(jq '.by_session_type["router-tick"].sessions' <<<"$OUT")"
assert_eq "by_session_type.recovery.sessions" "1" \
  "$(jq '.by_session_type.recovery.sessions' <<<"$OUT")"

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

# sidecar-coverage metric (#2268): worker sessions are the eligible denominator.
# The shared fixture has exactly ONE worker (sess-worker), which carries a
# sidecar → sidecar_eligible==1, sidecar_present==1, rate==1. The 2 subagents,
# the router-tick, and the recovery session are EXCLUDED from the denominator
# (they legitimately carry artifact:null), proving case (b): a non-worker with no
# sidecar does not inflate sidecar_eligible.
assert_eq "window.sidecar_eligible (1 worker; subagent/router/recovery excluded)" "1" \
  "$(jq '.window.sidecar_eligible' <<<"$OUT")"
assert_eq "window.sidecar_present (worker has sidecar)" "1" \
  "$(jq '.window.sidecar_present' <<<"$OUT")"
assert_eq "window.sidecar_present_rate (1/1)" "1" \
  "$(jq '.window.sidecar_present_rate' <<<"$OUT")"

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

# payload_bytes (#1860 recompute): base is Bash "PAYLOAD_0123456789" (18 bytes) +
# the no-id error "Exit code 1\nsome detail" (23 bytes, \n -> real newline). The
# worker now also carries a Bash-attributed envelope (WORKER_BLOCK), and the
# router + subagent each carry an unknown-attributed envelope. Expected bytes are
# computed from the same block strings so they track the fixture exactly.
PAYLOAD_BASH=$(jq -n --arg e "$WORKER_BLOCK" \
  '("PAYLOAD_0123456789"|utf8bytelength) + ($e|utf8bytelength)')
PAYLOAD_UNKNOWN=$(jq -n --arg r "$ROUTER_BLOCK" --arg s "$SUBAGENT_BLOCK" --arg recovery "$RECOVERY_BLOCK" \
  '("Exit code 1\nsome detail"|utf8bytelength) + ($r|utf8bytelength) + ($s|utf8bytelength) + ($recovery|utf8bytelength)')
PAYLOAD_TOTAL=$(jq -n --arg e "$WORKER_BLOCK" --arg r "$ROUTER_BLOCK" --arg s "$SUBAGENT_BLOCK" --arg recovery "$RECOVERY_BLOCK" \
  '("PAYLOAD_0123456789"|utf8bytelength) + ("Exit code 1\nsome detail"|utf8bytelength) + ($e|utf8bytelength) + ($r|utf8bytelength) + ($s|utf8bytelength) + ($recovery|utf8bytelength)')

assert_eq "payload_bytes.total" "$PAYLOAD_TOTAL" \
  "$(jq '.payload_bytes.total' <<<"$OUT")"
assert_eq "payload_bytes Bash bytes" "$PAYLOAD_BASH" \
  "$(jq '[.payload_bytes.by_tool[] | select(.tool=="Bash")][0].bytes' <<<"$OUT")"
assert_eq "payload_bytes Bash results" "2" \
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
# baseline_context counts ALL sessions (rows). The recovery session (#1905) is a
# 5th in-window transcript, so sessions==5. Its first assistant msg has init
# input=0/cc=0 → boot=0, so it does not change peak_boot_tokens (still 3000)
# nor total_proxy_usd. Boot-token list across the five sessions sorts to
# [0, 0, 3, 30, 3000]; the odd-length (5) median is the middle value = 3.
assert_eq "lenses.baseline_context.sessions" "5" \
  "$(jq '.lenses.baseline_context.sessions' <<<"$OUT")"
assert_eq "lenses.baseline_context.peak_boot_tokens" "3000" \
  "$(jq '.lenses.baseline_context.peak_boot_tokens' <<<"$OUT")"
assert_eq "lenses.baseline_context.median_boot_tokens" "3" \
  "$(jq '.lenses.baseline_context.median_boot_tokens' <<<"$OUT")"
assert_eq "lenses.baseline_context.total_proxy_usd" "$EXPECTED_BASELINE_PROXY" \
  "$(jq '.lenses.baseline_context.total_proxy_usd' <<<"$OUT")"

# --- outcome-envelope assertions (#1860) ------------------------------------
# by_phase_outcome.review pools non-subagent sessions carrying a review envelope
# = the worker only. The agent-bbb SUBAGENT review envelope (counts 1000) is
# EXCLUDED, so the pooled counts equal the worker envelope's.
assert_eq "by_phase_outcome.review.sessions" "1" \
  "$(jq '.by_phase_outcome.review.sessions' <<<"$OUT")"
assert_eq "by_phase_outcome.review.findings_surfaced (subagent 1000 excluded)" "8" \
  "$(jq '.by_phase_outcome.review.findings_surfaced' <<<"$OUT")"
assert_eq "by_phase_outcome.review.findings_actionable" "5" \
  "$(jq '.by_phase_outcome.review.findings_actionable' <<<"$OUT")"
assert_eq "by_phase_outcome.review.fixes_applied" "3" \
  "$(jq '.by_phase_outcome.review.fixes_applied' <<<"$OUT")"
assert_eq "by_phase_outcome.review.followups_filed" "2" \
  "$(jq '.by_phase_outcome.review.followups_filed' <<<"$OUT")"
assert_eq "by_phase_outcome.review.subagents_launched" "12" \
  "$(jq '.by_phase_outcome.review.subagents_launched' <<<"$OUT")"
# pooled rates from summed counts: 3/8=0.375, 5/8=0.625, 3/5=0.6
assert_eq "by_phase_outcome.review.hit_rate" "0.375" \
  "$(jq '.by_phase_outcome.review.hit_rate' <<<"$OUT")"
assert_eq "by_phase_outcome.review.actionability" "0.625" \
  "$(jq '.by_phase_outcome.review.actionability' <<<"$OUT")"
assert_eq "by_phase_outcome.review.fix_rate" "0.6" \
  "$(jq '.by_phase_outcome.review.fix_rate' <<<"$OUT")"
assert_eq "by_phase_outcome.review.disposition_distribution.completed_with_fixes" "1" \
  "$(jq '.by_phase_outcome.review.disposition_distribution.completed_with_fixes' <<<"$OUT")"

# by_phase_outcome.qa: the router-tick zero-count clean-pass. Zero denominators
# -> all three rates null (the null-guard), never a divide-by-zero or a 0.
assert_eq "by_phase_outcome.qa.sessions" "1" \
  "$(jq '.by_phase_outcome.qa.sessions' <<<"$OUT")"
assert_eq "by_phase_outcome.qa.findings_surfaced" "0" \
  "$(jq '.by_phase_outcome.qa.findings_surfaced' <<<"$OUT")"
assert_eq "by_phase_outcome.qa.hit_rate is null (zero denom)" "null" \
  "$(jq '.by_phase_outcome.qa.hit_rate' <<<"$OUT")"
assert_eq "by_phase_outcome.qa.actionability is null (zero denom)" "null" \
  "$(jq '.by_phase_outcome.qa.actionability' <<<"$OUT")"
assert_eq "by_phase_outcome.qa.fix_rate is null (zero denom)" "null" \
  "$(jq '.by_phase_outcome.qa.fix_rate' <<<"$OUT")"
assert_eq "by_phase_outcome.qa.disposition_distribution.completed" "1" \
  "$(jq '.by_phase_outcome.qa.disposition_distribution.completed' <<<"$OUT")"

# Subagent exclusion (defense-in-depth): the review pool must not see the
# subagent's 1000-count envelope.
assert_eq "by_phase_outcome.review excludes subagent (not 1008)" "true" \
  "$(jq '.by_phase_outcome.review.findings_surfaced == 8' <<<"$OUT")"

# Recovery exclusion (#1905 negative regression): the recovery session carries a
# review envelope with findings_surfaced=5555. The allowlist filter admits only
# worker and router-tick, so recovery is excluded. Without the fix the old
# blocklist would admit it and findings_surfaced would be 5563 instead of 8.
assert_eq "by_session_type.recovery.sessions (recovery is ingested)" "1" \
  "$(jq '.by_session_type.recovery.sessions' <<<"$OUT")"
assert_eq "by_phase_outcome.review.findings_surfaced excludes recovery (not 5563)" "8" \
  "$(jq '.by_phase_outcome.review.findings_surfaced' <<<"$OUT")"

# Per-run rates on the worker session entry (#1860 AC: per-run hit-rate).
assert_eq "sessions[sess-worker].outcome.findings_surfaced" "8" \
  "$(jq '[.sessions[]|select(.id=="sess-worker")][0].outcome.findings_surfaced' <<<"$OUT")"
assert_eq "sessions[sess-worker].outcome_rates.hit_rate" "0.375" \
  "$(jq '[.sessions[]|select(.id=="sess-worker")][0].outcome_rates.hit_rate' <<<"$OUT")"
assert_eq "sessions[sess-worker].outcome_rates.actionability" "0.625" \
  "$(jq '[.sessions[]|select(.id=="sess-worker")][0].outcome_rates.actionability' <<<"$OUT")"
assert_eq "sessions[sess-worker].outcome_rates.fix_rate" "0.6" \
  "$(jq '[.sessions[]|select(.id=="sess-worker")][0].outcome_rates.fix_rate' <<<"$OUT")"
# A session with no envelope carries outcome:null and null rates (no crash).
assert_eq "sessions[agent-aaa].outcome is null" "null" \
  "$(jq '[.sessions[]|select(.id=="agent-aaa")][0].outcome' <<<"$OUT")"
assert_eq "sessions[agent-aaa].outcome_rates is null" "null" \
  "$(jq '[.sessions[]|select(.id=="agent-aaa")][0].outcome_rates' <<<"$OUT")"
# A session whose envelope has all-zero counts carries a non-null outcome_rates
# object whose individual rate fields are null (zero-denominator guard).
# Anchor first that the envelope was actually parsed (outcome non-null) and that
# outcome_rates is a non-null object, so the per-field null assertions below
# distinguish the zero-count path from the unparsed-envelope path (outcome:null,
# under which null.outcome_rates.hit_rate would also be null — a false pass).
assert_eq 'sessions[sess-router].outcome.findings_surfaced' '0' \
  "$(jq '[.sessions[]|select(.id=="sess-router")][0].outcome.findings_surfaced' <<<"$OUT")"
assert_eq 'sessions[sess-router].outcome_rates is non-null object' 'true' \
  "$(jq '[.sessions[]|select(.id=="sess-router")][0].outcome_rates != null' <<<"$OUT")"
assert_eq 'sessions[sess-router].outcome_rates.hit_rate is null' 'null' \
  "$(jq '[.sessions[]|select(.id=="sess-router")][0].outcome_rates.hit_rate' <<<"$OUT")"
assert_eq 'sessions[sess-router].outcome_rates.actionability is null' 'null' \
  "$(jq '[.sessions[]|select(.id=="sess-router")][0].outcome_rates.actionability' <<<"$OUT")"
assert_eq 'sessions[sess-router].outcome_rates.fix_rate is null' 'null' \
  "$(jq '[.sessions[]|select(.id=="sess-router")][0].outcome_rates.fix_rate' <<<"$OUT")"

# ---------------------------------------------------------------------------
# Persist-wiring tests (Unit 2).  These use a fake writer stub controlled via
# DISPATCH_AUDIT_AGGREGATES_WRITER, mirroring the DISPATCH_USAGE_SAMPLES_WRITER
# pattern from test-dispatch-scripts.sh.
# ---------------------------------------------------------------------------

echo ""
echo "--- persist-wiring ---"

FAKE_WRITER_DIR=$(mktemp -d)
trap 'rm -rf "$FAKE_WRITER_DIR"; teardown' EXIT

# P1 — gate OFF: writer never invoked.
SENTINEL_P1="$FAKE_WRITER_DIR/invoked-p1"
printf '#!/usr/bin/env bash\n: > %s\ncat >/dev/null\n' "'$SENTINEL_P1'" \
  > "$FAKE_WRITER_DIR/fake-writer-p1"
chmod +x "$FAKE_WRITER_DIR/fake-writer-p1"
if (
  export DISPATCH_AUDIT_PROJECTS_ROOT="$ROOT"
  export DISPATCH_AUDIT_AGGREGATES_WRITER="$FAKE_WRITER_DIR/fake-writer-p1"
  unset DISPATCH_AUDIT_AGGREGATES_ENABLED 2>/dev/null || true
  bash "$SCRIPT_DIR/aggregate-usage.sh" --days 7 >/dev/null
); then rc_p1=0; else rc_p1=$?; fi
assert_eq "P1 gate-off: script succeeded" "0" "$rc_p1"
assert_eq "P1 gate-off: writer not invoked" "1" \
  "$([[ ! -e "$SENTINEL_P1" ]] && echo 1 || echo 0)"

# P2 — gate ON: the assembled JSON is piped to the writer.
CAPTURE_P2="$FAKE_WRITER_DIR/captured-p2.json"
SENTINEL_P2="$FAKE_WRITER_DIR/invoked-p2"
printf '#!/usr/bin/env bash\n: > %s\ncat > %s\n' "'$SENTINEL_P2'" "'$CAPTURE_P2'" \
  > "$FAKE_WRITER_DIR/fake-writer-p2"
chmod +x "$FAKE_WRITER_DIR/fake-writer-p2"
JSON_OUT_P2="$FAKE_WRITER_DIR/report-p2.json"
(
  export DISPATCH_AUDIT_PROJECTS_ROOT="$ROOT"
  export DISPATCH_AUDIT_AGGREGATES_ENABLED="1"
  export DISPATCH_AUDIT_AGGREGATES_WRITER="$FAKE_WRITER_DIR/fake-writer-p2"
  bash "$SCRIPT_DIR/aggregate-usage.sh" --days 7 --json-out "$JSON_OUT_P2"
)
assert_eq "P2 gate-on: writer invoked" "1" \
  "$([[ -e "$SENTINEL_P2" ]] && echo 1 || echo 0)"
# The document received by the writer must match the report file — both are
# the same assembled JSON.
GOT_P2=$(jq -S . "$CAPTURE_P2")
WANT_P2=$(jq -S . "$JSON_OUT_P2")
assert_eq "P2 gate-on: writer received full aggregate JSON" "$WANT_P2" "$GOT_P2"

# P2b — gate ON stdout-mode (no --json-out): the assembled JSON piped to the
# writer matches the script's own stdout (same $DOC, same pipe).
CAPTURE_P2B="$FAKE_WRITER_DIR/captured-p2b.json"
SENTINEL_P2B="$FAKE_WRITER_DIR/invoked-p2b"
printf '#!/usr/bin/env bash\n: > %s\ncat > %s\n' "'$SENTINEL_P2B'" "'$CAPTURE_P2B'" \
  > "$FAKE_WRITER_DIR/fake-writer-p2b"
chmod +x "$FAKE_WRITER_DIR/fake-writer-p2b"
OUT_P2B=$(
  export DISPATCH_AUDIT_PROJECTS_ROOT="$ROOT"
  export DISPATCH_AUDIT_AGGREGATES_ENABLED="1"
  export DISPATCH_AUDIT_AGGREGATES_WRITER="$FAKE_WRITER_DIR/fake-writer-p2b"
  bash "$SCRIPT_DIR/aggregate-usage.sh" --days 7
)
assert_eq "P2b stdout-mode: writer invoked" "1" \
  "$([[ -e "$SENTINEL_P2B" ]] && echo 1 || echo 0)"
# The document received by the writer must match the script's own stdout — both
# are the same assembled JSON.
GOT_P2B=$(jq -S . "$CAPTURE_P2B")
WANT_P2B=$(jq -S . <<<"$OUT_P2B")
assert_eq "P2b stdout-mode: writer received full aggregate JSON" "$WANT_P2B" "$GOT_P2B"

# P3 — writer-fail: aggregate-usage.sh exits non-zero AND the json-out file
# still exists (report written before the failing persist step).
JSON_OUT_P3="$FAKE_WRITER_DIR/report-p3.json"
printf '#!/usr/bin/env bash\ncat >/dev/null\nexit 1\n' \
  > "$FAKE_WRITER_DIR/fake-writer-p3"
chmod +x "$FAKE_WRITER_DIR/fake-writer-p3"
if (
  export DISPATCH_AUDIT_PROJECTS_ROOT="$ROOT"
  export DISPATCH_AUDIT_AGGREGATES_ENABLED="1"
  export DISPATCH_AUDIT_AGGREGATES_WRITER="$FAKE_WRITER_DIR/fake-writer-p3"
  bash "$SCRIPT_DIR/aggregate-usage.sh" --days 7 --json-out "$JSON_OUT_P3" 2>/dev/null
); then rc_p3=0; else rc_p3=$?; fi
assert_eq "P3 writer-fail: exit non-zero" "1" "$([[ "$rc_p3" -ne 0 ]] && echo 1 || echo 0)"
assert_eq "P3 writer-fail: json-out still written" "1" \
  "$([[ -s "$JSON_OUT_P3" ]] && echo 1 || echo 0)"

# P4 — gate ON stdout-mode: writer stdout must NOT leak into the script's
# stdout (the >&2 redirect works).  The stub prints a recognizable token
# to its own stdout; the script's stdout must be clean JSON that does NOT
# contain that token.
printf '#!/usr/bin/env bash\ncat >/dev/null\necho LEAKED-DOCID\n' \
  > "$FAKE_WRITER_DIR/fake-writer-p4"
chmod +x "$FAKE_WRITER_DIR/fake-writer-p4"
OUT_P4=$(
  export DISPATCH_AUDIT_PROJECTS_ROOT="$ROOT"
  export DISPATCH_AUDIT_AGGREGATES_ENABLED="1"
  export DISPATCH_AUDIT_AGGREGATES_WRITER="$FAKE_WRITER_DIR/fake-writer-p4"
  bash "$SCRIPT_DIR/aggregate-usage.sh" --days 7
)
assert_eq "P4 stdout pure JSON (no leak): valid JSON" "object" \
  "$(jq -r 'type' <<<"$OUT_P4")"
assert_eq "P4 stdout pure JSON (no leak): token absent" "0" \
  "$(grep -c 'LEAKED-DOCID' <<<"$OUT_P4" || true)"

# ---------------------------------------------------------------------------
# Partial-envelope null-ification (#1909). ISOLATED fixture: a fresh projects
# root with ONE non-subagent worker session whose envelope OMITS the required
# count key `findings_surfaced` (otherwise well-formed). The reader must treat
# this partial envelope as ABSENT (outcome:null) — never coerce the missing
# count to a zero, which rate()'s `($num // 0)` would otherwise turn into a
# fabricated 0 rate.
#
# Built in its own mktemp root (NOT the shared setup() tree) so the existing
# count assertions are untouched. The session lives under a -worktrees- path,
# NOT a /subagents/ one, so a clean fix (not the unrelated subagent exclusion)
# is what keeps it out of by_phase_outcome.
# ---------------------------------------------------------------------------

echo ""
echo "--- partial-envelope null-ification (#1909) ---"

# Partial envelope: findings_surfaced OMITTED; everything else mirrors the valid
# worker envelope (phase "review", the other two counts present as numbers).
PARTIAL_ENV_JSON='{"schema":"dispatch.outcome.v1","phase":"review","repo":"natb1/commons.systems","issue":1909,"pr":2000,"base_sha":"aaa111","findings_actionable":5,"fixes_applied":3,"followups_filed":2,"subagents_launched":12,"disposition":"completed_with_fixes","terminated_reason":null}'
PARTIAL_BLOCK="$(envelope_block "$PARTIAL_ENV_JSON")"

PARTIAL_ROOT=$(mktemp -d)
trap 'rm -rf "$PARTIAL_ROOT" "$FAKE_WRITER_DIR"; teardown' EXIT INT TERM
partial_worktree="$PARTIAL_ROOT/-home-x-worktrees-1909-partial"
mkdir -p "$partial_worktree"
partial_jsonl="$partial_worktree/sess-partial.jsonl"

# line 1: first user line — classifies as worker (mirror line 68)
printf '%s\n' '{"type":"user","message":{"content":"<command-name>/plan-issue</command-name>"}}' \
  >> "$partial_jsonl"
# line 2: assistant — opus, minimal usage (mirror the worker assistant shape)
printf '%s\n' '{"type":"assistant","attributionSkill":"review-fix","isSidechain":false,"gitBranch":"1909-partial","message":{"model":"claude-opus-4-8","content":[{"type":"tool_use","id":"toolu_p01","name":"Bash","input":{"command":"echo hi"}}],"usage":{"input_tokens":1,"cache_creation_input_tokens":2,"cache_read_input_tokens":4,"output_tokens":1}}}' \
  >> "$partial_jsonl"
# line 3: partial outcome-envelope tool_result (mirror lines 106–108)
jq -nc --arg c "$PARTIAL_BLOCK" \
  '{type:"user",message:{content:[{type:"tool_result",tool_use_id:"toolu_p01",content:$c}]}}' \
  >> "$partial_jsonl"
jq . "$partial_jsonl" >/dev/null
touch "$partial_jsonl"

OUT_PARTIAL=$(
  export DISPATCH_AUDIT_PROJECTS_ROOT="$PARTIAL_ROOT"
  bash "$SCRIPT_DIR/aggregate-usage.sh" --days 7
)

# (a) the session's per-run outcome is null (partial envelope treated as absent)
assert_eq "partial-envelope sessions[sess-partial].outcome is null" "null" \
  "$(jq '[.sessions[]|select(.id=="sess-partial")][0].outcome' <<<"$OUT_PARTIAL")"
# (b) its outcome_rates is null too (no fabricated 0 rate)
assert_eq "partial-envelope sessions[sess-partial].outcome_rates is null" "null" \
  "$(jq '[.sessions[]|select(.id=="sess-partial")][0].outcome_rates' <<<"$OUT_PARTIAL")"
# (c) by_phase_outcome carries NO entry for the envelope's "review" phase — the
# null outcome is filtered at the pool, so the whole object is empty ({}). An
# absent bucket is `null`, not `0`, so we assert the object is {} (not
# .review.sessions == 0, which would itself be null).
assert_eq "partial-envelope by_phase_outcome is empty {} (no fabricated entry)" "{}" \
  "$(jq -c '.by_phase_outcome' <<<"$OUT_PARTIAL")"

rm -rf "$PARTIAL_ROOT"

# ---------------------------------------------------------------------------
# Unpriceable-model cost guard (#2027). ISOLATED fixture: a fresh projects root
# with ONE worker session whose assistant message carries a model in NO known
# family (not opus/sonnet/haiku) and NONZERO usage. cost()'s family==null branch
# raises a stage-2 `error()` (the stage-2 jq call has no 2>/dev/null), which
# aborts the WHOLE script with a non-zero exit. Stage-1 failures are swallowed
# (2>/dev/null + tallied in files_failed) and `jq -s` over empty is [], so the
# stage-2 error() is the SOLE non-zero exit path here — making rc!=0 a reliable
# signal that the unpriceable-model guard fired.
#
# Built in its own mktemp root (a nonzero-unpriceable session anywhere aborts ALL
# of stage-2, so it cannot share any other root). rc is captured with the P1/P3
# subshell idiom, NOT a bare `$(...)` — under `set -e` a failing command
# substitution would abort the whole suite before the assert runs.
# ---------------------------------------------------------------------------

echo ""
echo "--- unpriceable-model cost guard (#2027) ---"

GUARD_ROOT=$(mktemp -d)
trap 'rm -rf "$GUARD_ROOT" "$FAKE_WRITER_DIR"; teardown' EXIT INT TERM
guard_worktree="$GUARD_ROOT/-home-x-worktrees-2027-guard"
mkdir -p "$guard_worktree"
guard_jsonl="$guard_worktree/sess-guard.jsonl"

# line 1: first user line — classifies as worker
printf '%s\n' '{"type":"user","message":{"content":"<command-name>/plan-issue</command-name>"}}' \
  >> "$guard_jsonl"
# line 2: assistant — UNPRICEABLE model "gpt-fake-9" with NONZERO usage
printf '%s\n' '{"type":"assistant","attributionSkill":"plan-implement","isSidechain":false,"gitBranch":"2027-guard","message":{"model":"gpt-fake-9","usage":{"input_tokens":1000,"cache_creation_input_tokens":0,"cache_read_input_tokens":0,"output_tokens":0}}}' \
  >> "$guard_jsonl"
jq . "$guard_jsonl" >/dev/null
touch "$guard_jsonl"

if (
  export DISPATCH_AUDIT_PROJECTS_ROOT="$GUARD_ROOT"
  bash "$SCRIPT_DIR/aggregate-usage.sh" --days 7 >/dev/null 2>&1
); then rc_guard=0; else rc_guard=$?; fi
assert_eq "guard: unpriceable model + nonzero usage aborts (rc!=0)" "1" \
  "$([[ "$rc_guard" -ne 0 ]] && echo 1 || echo 0)"

rm -rf "$GUARD_ROOT"

# ---------------------------------------------------------------------------
# Zero-usage unclassifiable component does NOT abort (#2027). ISOLATED fixture:
# a worker session whose assistant message carries an unclassifiable model
# `<synthetic>` (family==null) but ALL-ZERO usage. cost()'s tok==0 branch returns
# 0 instead of erroring, so the script succeeds (rc==0) and the session's
# cost_usd is exactly 0. Its own root (the abort branch above would poison a
# shared root).
# ---------------------------------------------------------------------------

echo ""
echo "--- zero-usage unclassifiable component does not abort (#2027) ---"

SYNTH_ROOT=$(mktemp -d)
trap 'rm -rf "$SYNTH_ROOT" "$FAKE_WRITER_DIR"; teardown' EXIT INT TERM
synth_worktree="$SYNTH_ROOT/-home-x-worktrees-2027-synth"
mkdir -p "$synth_worktree"
synth_jsonl="$synth_worktree/sess-synth.jsonl"

printf '%s\n' '{"type":"user","message":{"content":"<command-name>/plan-issue</command-name>"}}' \
  >> "$synth_jsonl"
# assistant — unclassifiable "<synthetic>" model, ALL-ZERO usage → cost 0, no abort
printf '%s\n' '{"type":"assistant","attributionSkill":"plan-implement","isSidechain":false,"gitBranch":"2027-synth","message":{"model":"<synthetic>","usage":{"input_tokens":0,"cache_creation_input_tokens":0,"cache_read_input_tokens":0,"output_tokens":0}}}' \
  >> "$synth_jsonl"
jq . "$synth_jsonl" >/dev/null
touch "$synth_jsonl"

if (
  export DISPATCH_AUDIT_PROJECTS_ROOT="$SYNTH_ROOT"
  bash "$SCRIPT_DIR/aggregate-usage.sh" --days 7 >"$SYNTH_ROOT/out.json" 2>/dev/null
); then rc_synth=0; else rc_synth=$?; fi
assert_eq "synth: zero-usage unclassifiable model does not abort (rc==0)" "0" "$rc_synth"
assert_eq "synth: sessions[sess-synth].cost_usd == 0" "0" \
  "$(jq '[.sessions[]|select(.id=="sess-synth")][0].cost_usd' <"$SYNTH_ROOT/out.json")"

rm -rf "$SYNTH_ROOT"

# ---------------------------------------------------------------------------
# Haiku per-model cost (#2027). ISOLATED fixture: a worker session whose
# assistant message carries a real `claude-haiku-*` model with distinct nonzero
# usage in ALL FOUR components. This is the ONLY coverage of family()'s
# `startswith("claude-haiku")` branch and the ACTUAL_RATES.haiku row — without
# it a haiku rate transposition or a startswith match error would pass CI
# silently. Distinct counts (1000/2000/4000/500) make a rate swap between any
# two haiku components visible; the expected value uses the full four-term
# formula at haiku rates (1 / 1.25 / 0.10 / 5 per Mtok). Its own root so the
# shared setup() totals/price/session-count assertions stay untouched.
# ---------------------------------------------------------------------------

echo ""
echo "--- haiku per-model cost (#2027) ---"

HAIKU_ROOT=$(mktemp -d)
trap 'rm -rf "$HAIKU_ROOT" "$FAKE_WRITER_DIR"; teardown' EXIT INT TERM
haiku_worktree="$HAIKU_ROOT/-home-x-worktrees-2027-haiku"
mkdir -p "$haiku_worktree"
haiku_jsonl="$haiku_worktree/sess-haiku.jsonl"

# line 1: first user line — classifies as worker
printf '%s\n' '{"type":"user","message":{"content":"<command-name>/plan-issue</command-name>"}}' \
  >> "$haiku_jsonl"
# line 2: assistant — claude-haiku-4-5, distinct nonzero usage in all four components
printf '%s\n' '{"type":"assistant","attributionSkill":"plan-implement","isSidechain":false,"gitBranch":"2027-haiku","message":{"model":"claude-haiku-4-5","usage":{"input_tokens":1000,"cache_creation_input_tokens":2000,"cache_read_input_tokens":4000,"output_tokens":500}}}' \
  >> "$haiku_jsonl"
jq . "$haiku_jsonl" >/dev/null
touch "$haiku_jsonl"

OUT_HAIKU=$(
  export DISPATCH_AUDIT_PROJECTS_ROOT="$HAIKU_ROOT"
  bash "$SCRIPT_DIR/aggregate-usage.sh" --days 7
)

# Haiku rates: input 1 / cache_creation 1.25 / cache_read 0.10 / output 5 per Mtok.
EXPECTED_HAIKU_COST=$(jq -n '(1000*1 + 2000*1.25 + 4000*0.10 + 500*5)/1e6')
assert_eq "sessions[sess-haiku].cost_usd (haiku)" "$EXPECTED_HAIKU_COST" \
  "$(jq '[.sessions[]|select(.id=="sess-haiku")][0].cost_usd' <<<"$OUT_HAIKU")"
assert_eq 'by_model["claude-haiku-4-5"].cost_usd (haiku)' "$EXPECTED_HAIKU_COST" \
  "$(jq '.by_model["claude-haiku-4-5"].cost_usd' <<<"$OUT_HAIKU")"

rm -rf "$HAIKU_ROOT"

# ---------------------------------------------------------------------------
# Claude 3 classification + generation-aware pricing + no-abort completeness
# (#2102). Three ISOLATED fixtures:
#   1. claude-3-opus-20240229  — rate_class()==opus_3, ACTUAL_RATES.opus_3 prices it;
#      verifies the classification fix and audit does not abort.
#   2. claude-3-haiku-20240307 — rate_class()==haiku_3, ACTUAL_RATES.haiku_3 prices it;
#      verifies the haiku_3 rate row is correct.
#   3. claude-3-5-haiku-20241022 + claude-3-7-sonnet-20250219 — the two IDs the
#      issue's recommended-fix snippet omitted; without the completeness fix the
#      run aborts on nonzero usage from an unrecognised family; verifies rc==0.
# ---------------------------------------------------------------------------

echo ""
echo "--- Claude 3 Opus cost (#2102) ---"

OPUS3_ROOT=$(mktemp -d)
trap 'rm -rf "$OPUS3_ROOT" "$FAKE_WRITER_DIR"; teardown' EXIT INT TERM
opus3_worktree="$OPUS3_ROOT/-home-x-worktrees-2102-opus3"
mkdir -p "$opus3_worktree"
opus3_jsonl="$opus3_worktree/sess-opus3.jsonl"

# line 1: first user line — classifies as worker
printf '%s\n' '{"type":"user","message":{"content":"<command-name>/plan-issue</command-name>"}}' \
  >> "$opus3_jsonl"
# line 2: assistant — claude-3-opus-20240229, distinct nonzero usage in all four components
printf '%s\n' '{"type":"assistant","attributionSkill":"plan-implement","isSidechain":false,"gitBranch":"2102-opus3","message":{"model":"claude-3-opus-20240229","usage":{"input_tokens":1000,"cache_creation_input_tokens":2000,"cache_read_input_tokens":4000,"output_tokens":500}}}' \
  >> "$opus3_jsonl"
jq . "$opus3_jsonl" >/dev/null
touch "$opus3_jsonl"

if (
  export DISPATCH_AUDIT_PROJECTS_ROOT="$OPUS3_ROOT"
  bash "$SCRIPT_DIR/aggregate-usage.sh" --days 7 >"$OPUS3_ROOT/out.json" 2>/dev/null
); then rc_opus3=0; else rc_opus3=$?; fi

# Opus 3 rates: input 15 / cache_creation 18.75 / cache_read 1.50 / output 75 per Mtok.
EXPECTED_OPUS3=$(jq -n '(1000*15 + 2000*18.75 + 4000*1.50 + 500*75)/1e6')
assert_eq "opus3: Claude 3 Opus session does not abort (rc==0)" "0" "$rc_opus3"
assert_eq "sessions[sess-opus3].cost_usd (claude-3-opus)" "$EXPECTED_OPUS3" \
  "$(jq '[.sessions[]|select(.id=="sess-opus3")][0].cost_usd' <"$OPUS3_ROOT/out.json")"
assert_eq 'by_model["claude-3-opus-20240229"].cost_usd' "$EXPECTED_OPUS3" \
  "$(jq '.by_model["claude-3-opus-20240229"].cost_usd' <"$OPUS3_ROOT/out.json")"

rm -rf "$OPUS3_ROOT"

echo ""
echo "--- Claude 3 Haiku cost (#2102) ---"

HAIKU3_ROOT=$(mktemp -d)
trap 'rm -rf "$HAIKU3_ROOT" "$FAKE_WRITER_DIR"; teardown' EXIT INT TERM
haiku3_worktree="$HAIKU3_ROOT/-home-x-worktrees-2102-haiku3"
mkdir -p "$haiku3_worktree"
haiku3_jsonl="$haiku3_worktree/sess-haiku3.jsonl"

# line 1: first user line — classifies as worker
printf '%s\n' '{"type":"user","message":{"content":"<command-name>/plan-issue</command-name>"}}' \
  >> "$haiku3_jsonl"
# line 2: assistant — claude-3-haiku-20240307, distinct nonzero usage in all four components
printf '%s\n' '{"type":"assistant","attributionSkill":"plan-implement","isSidechain":false,"gitBranch":"2102-haiku3","message":{"model":"claude-3-haiku-20240307","usage":{"input_tokens":1000,"cache_creation_input_tokens":2000,"cache_read_input_tokens":4000,"output_tokens":500}}}' \
  >> "$haiku3_jsonl"
jq . "$haiku3_jsonl" >/dev/null
touch "$haiku3_jsonl"

OUT_HAIKU3=$(
  export DISPATCH_AUDIT_PROJECTS_ROOT="$HAIKU3_ROOT"
  bash "$SCRIPT_DIR/aggregate-usage.sh" --days 7
)

# Haiku 3 rates: input 0.25 / cache_creation 0.3125 / cache_read 0.025 / output 1.25 per Mtok.
EXPECTED_HAIKU3=$(jq -n '(1000*0.25 + 2000*0.3125 + 4000*0.025 + 500*1.25)/1e6')
assert_eq "sessions[sess-haiku3].cost_usd (claude-3-haiku)" "$EXPECTED_HAIKU3" \
  "$(jq '[.sessions[]|select(.id=="sess-haiku3")][0].cost_usd' <<<"$OUT_HAIKU3")"
assert_eq 'by_model["claude-3-haiku-20240307"].cost_usd' "$EXPECTED_HAIKU3" \
  "$(jq '.by_model["claude-3-haiku-20240307"].cost_usd' <<<"$OUT_HAIKU3")"

rm -rf "$HAIKU3_ROOT"

echo ""
echo "--- enumeration-completeness no-abort (#2102) ---"

ENUM_ROOT=$(mktemp -d)
trap 'rm -rf "$ENUM_ROOT" "$FAKE_WRITER_DIR"; teardown' EXIT INT TERM
enum_worktree="$ENUM_ROOT/-home-x-worktrees-2102-enum"
mkdir -p "$enum_worktree"
enum_jsonl="$enum_worktree/sess-enum.jsonl"

# line 1: first user line — classifies as worker
printf '%s\n' '{"type":"user","message":{"content":"<command-name>/plan-issue</command-name>"}}' \
  >> "$enum_jsonl"
# line 2: assistant — claude-3-5-haiku-20241022 (omitted in issue's fix snippet)
printf '%s\n' '{"type":"assistant","attributionSkill":"plan-implement","isSidechain":false,"gitBranch":"2102-enum","message":{"model":"claude-3-5-haiku-20241022","usage":{"input_tokens":1000,"cache_creation_input_tokens":2000,"cache_read_input_tokens":4000,"output_tokens":500}}}' \
  >> "$enum_jsonl"
# line 3: assistant — claude-3-7-sonnet-20250219 (omitted in issue's fix snippet)
printf '%s\n' '{"type":"assistant","attributionSkill":"plan-implement","isSidechain":false,"gitBranch":"2102-enum","message":{"model":"claude-3-7-sonnet-20250219","usage":{"input_tokens":1000,"cache_creation_input_tokens":2000,"cache_read_input_tokens":4000,"output_tokens":500}}}' \
  >> "$enum_jsonl"
jq . "$enum_jsonl" >/dev/null
touch "$enum_jsonl"

if (
  export DISPATCH_AUDIT_PROJECTS_ROOT="$ENUM_ROOT"
  bash "$SCRIPT_DIR/aggregate-usage.sh" --days 7 >"$ENUM_ROOT/out.json" 2>/dev/null
); then rc_enum=0; else rc_enum=$?; fi
assert_eq "enum: claude-3-5-haiku + claude-3-7-sonnet session does not abort (rc==0)" "0" "$rc_enum"
# Haiku 3.5 rates: input 0.80 / cache_creation 1.00 / cache_read 0.08 / output 4.00 per Mtok.
EXPECTED_ENUM_HAIKU3_5=$(jq -n '(1000*0.80 + 2000*1.00 + 4000*0.08 + 500*4.00)/1e6')
assert_eq 'enum: by_model[claude-3-5-haiku-20241022].cost_usd (haiku_3_5)' "$EXPECTED_ENUM_HAIKU3_5" \
  "$(jq '.by_model["claude-3-5-haiku-20241022"].cost_usd' <"$ENUM_ROOT/out.json")"
# Sonnet rates: input 3 / cache_creation 3.75 / cache_read 0.30 / output 15 per Mtok.
EXPECTED_ENUM_SONNET=$(jq -n '(1000*3 + 2000*3.75 + 4000*0.30 + 500*15)/1e6')
assert_eq 'enum: by_model[claude-3-7-sonnet-20250219].cost_usd (sonnet)' "$EXPECTED_ENUM_SONNET" \
  "$(jq '.by_model["claude-3-7-sonnet-20250219"].cost_usd' <"$ENUM_ROOT/out.json")"

rm -rf "$ENUM_ROOT"

# ---------------------------------------------------------------------------
# Sidecar-coverage metric, case (a): several worker sessions, some with sidecars
# (#2268). ISOLATED fixture: a fresh projects root with THREE worker sessions,
# TWO carrying a sibling .dispatch-stamp.json. Expected: sidecar_eligible==3,
# sidecar_present==2, sidecar_present_rate == 2/3 (derived via jq, not hardcoded).
# Its own root so the shared setup() one-worker count assertions stay untouched.
# ---------------------------------------------------------------------------

echo ""
echo "--- sidecar-coverage: several workers, some sidecars (#2268) ---"

COV_ROOT=$(mktemp -d)
trap 'rm -rf "$COV_ROOT" "$FAKE_WRITER_DIR"; teardown' EXIT INT TERM
cov_worktree="$COV_ROOT/-home-x-worktrees-2268-coverage"
mkdir -p "$cov_worktree"

# Three worker sessions; sess-cov-a and sess-cov-b carry a sidecar, sess-cov-c
# does not. Each is a minimal worker transcript (first user line classifies as
# worker; one zero-usage assistant line keeps totals/price irrelevant here).
for s in a b c; do
  cov_jsonl="$cov_worktree/sess-cov-$s.jsonl"
  # Use three distinct real phase-skill commands to verify the alternation
  case "$s" in
    a) cov_cmd='<command-name>/plan-issue</command-name>' ;;
    b) cov_cmd='<command-name>/qa-fix</command-name>' ;;
    c) cov_cmd='<command-name>/review-fix</command-name>' ;;
  esac
  printf '%s\n' "{\"type\":\"user\",\"message\":{\"content\":\"$cov_cmd\"}}" \
    >> "$cov_jsonl"
  printf '%s\n' '{"type":"assistant","attributionSkill":"plan-implement","isSidechain":false,"gitBranch":"2268-coverage","message":{"model":"claude-opus-4-8","usage":{"input_tokens":0,"cache_creation_input_tokens":0,"cache_read_input_tokens":0,"output_tokens":0}}}' \
    >> "$cov_jsonl"
  jq . "$cov_jsonl" >/dev/null
  touch "$cov_jsonl"
done

# Sibling sidecars for a and b only (c stays sidecar-less).
for s in a b; do
  cov_stamp="$cov_worktree/sess-cov-$s.dispatch-stamp.json"
  printf '%s\n' '{"schema":1,"session_id":"sess-cov-'"$s"'","repo":"natb1/commons.systems","issue":2268,"pr":3000,"branch":"2268-coverage","base_sha":"cafef00d","stamped_at":"2026-01-01T00:00:00Z"}' \
    >> "$cov_stamp"
  jq . "$cov_stamp" >/dev/null
done

OUT_COV=$(
  export DISPATCH_AUDIT_PROJECTS_ROOT="$COV_ROOT"
  bash "$SCRIPT_DIR/aggregate-usage.sh" --days 7
)

EXPECTED_COV_RATE=$(jq -n '2/3')
assert_eq "coverage: window.sidecar_eligible (3 workers)" "3" \
  "$(jq '.window.sidecar_eligible' <<<"$OUT_COV")"
assert_eq "coverage: window.sidecar_present (2 with sidecars)" "2" \
  "$(jq '.window.sidecar_present' <<<"$OUT_COV")"
assert_eq "coverage: window.sidecar_present_rate (2/3)" "$EXPECTED_COV_RATE" \
  "$(jq '.window.sidecar_present_rate' <<<"$OUT_COV")"

rm -rf "$COV_ROOT"

# ---------------------------------------------------------------------------
# Alternation coverage (#2351): every phase skill in the classifier's worker
# alternation must classify a first-message <command-name> session as "worker".
# The #2268 cov block above exercises only 3 of the 10; a typo in any of the
# other 7 skill names would silently misclassify those sessions as "other".
# ISOLATED fixture: one minimal worker session per skill, each in its own root
# so the shared totals stay untouched. Keep this list in lockstep with the
# alternation regex in aggregate-usage.sh's classifier.
# ---------------------------------------------------------------------------

echo ""
echo "--- alternation coverage: all 10 phase skills classify as worker (#2351) ---"

for skill in plan-issue implement qa-fix review-fix fix-checks fix-conflicts \
             qa-main budget-parse-job resolve-epic office-hours; do
  ALT_ROOT=$(mktemp -d)
  trap 'rm -rf "$ALT_ROOT"; teardown' EXIT INT TERM
  alt_worktree="$ALT_ROOT/-home-x-worktrees-2351-alternation"
  mkdir -p "$alt_worktree"
  alt_jsonl="$alt_worktree/sess-alt.jsonl"
  printf '%s\n' "{\"type\":\"user\",\"message\":{\"content\":\"<command-name>/$skill</command-name>\"}}" \
    >> "$alt_jsonl"
  printf '%s\n' '{"type":"assistant","attributionSkill":"plan-implement","isSidechain":false,"gitBranch":"2351-alternation","message":{"model":"claude-opus-4-8","usage":{"input_tokens":0,"cache_creation_input_tokens":0,"cache_read_input_tokens":0,"output_tokens":0}}}' \
    >> "$alt_jsonl"
  jq . "$alt_jsonl" >/dev/null
  touch "$alt_jsonl"

  OUT_ALT=$(
    export DISPATCH_AUDIT_PROJECTS_ROOT="$ALT_ROOT"
    bash "$SCRIPT_DIR/aggregate-usage.sh" --days 7
  )
  assert_eq "alternation: /$skill session classifies as worker" "worker" \
    "$(jq -r '[.sessions[]|select(.id=="sess-alt")][0].type' <<<"$OUT_ALT")"

  rm -rf "$ALT_ROOT"
done

# ---------------------------------------------------------------------------
# Sidecar-coverage metric, case (c): zero-worker edge (#2268). ISOLATED fixture
# with only a router-tick session (no worker). The eligible denominator is 0, so
# sidecar_present_rate must be null (not 0, not a divide-by-zero) and
# sidecar_eligible must be 0. Its own root so the shared totals stay untouched.
# ---------------------------------------------------------------------------

echo ""
echo "--- sidecar-coverage: zero-worker edge → rate null (#2268) ---"

NOWORKER_ROOT=$(mktemp -d)
trap 'rm -rf "$NOWORKER_ROOT" "$FAKE_WRITER_DIR"; teardown' EXIT INT TERM
noworker_bare="$NOWORKER_ROOT/-home-x--bare"
mkdir -p "$noworker_bare"
noworker_jsonl="$noworker_bare/sess-noworker.jsonl"

# first user line (any content); assistant with gitBranch HEAD → router-tick.
printf '%s\n' '{"type":"user","message":{"content":"<command-name>/dispatch</command-name>"}}' \
  >> "$noworker_jsonl"
printf '%s\n' '{"type":"assistant","gitBranch":"HEAD","message":{"model":"claude-opus-4-8","usage":{"input_tokens":1,"cache_creation_input_tokens":2,"cache_read_input_tokens":4,"output_tokens":1}}}' \
  >> "$noworker_jsonl"
jq . "$noworker_jsonl" >/dev/null
touch "$noworker_jsonl"

OUT_NOWORKER=$(
  export DISPATCH_AUDIT_PROJECTS_ROOT="$NOWORKER_ROOT"
  bash "$SCRIPT_DIR/aggregate-usage.sh" --days 7
)

assert_eq "zero-worker: window.sidecar_eligible == 0" "0" \
  "$(jq '.window.sidecar_eligible' <<<"$OUT_NOWORKER")"
assert_eq "zero-worker: window.sidecar_present == 0" "0" \
  "$(jq '.window.sidecar_present' <<<"$OUT_NOWORKER")"
assert_eq "zero-worker: window.sidecar_present_rate is null (zero denom)" "null" \
  "$(jq '.window.sidecar_present_rate' <<<"$OUT_NOWORKER")"

rm -rf "$NOWORKER_ROOT"

# ---------------------------------------------------------------------------
# Freeform interactive session discriminator (#2351). ISOLATED fixture: a
# top-level worktree session whose first user message is freeform interactive
# text (no <command-name> tag) must classify as "other" and must NOT be counted
# in sidecar_eligible — proving the new alternation does not widen to match
# arbitrary interactive sessions and inflate sidecar_present_rate.
# ---------------------------------------------------------------------------

echo ""
echo "--- freeform interactive session classifies as other, excluded from sidecar_eligible (#2351) ---"

FREEFORM_ROOT=$(mktemp -d)
trap 'rm -rf "$FREEFORM_ROOT"; teardown' EXIT INT TERM
freeform_worktree="$FREEFORM_ROOT/-home-x-worktrees-2351-freeform"
mkdir -p "$freeform_worktree"
freeform_jsonl="$freeform_worktree/sess-freeform.jsonl"

# line 1: freeform interactive text — no <command-name> tag, must classify as "other"
printf '%s\n' '{"type":"user","message":{"content":"Can you help me debug this function?"}}' \
  >> "$freeform_jsonl"
# line 2: assistant — minimal usage, normal worktree gitBranch
printf '%s\n' '{"type":"assistant","attributionSkill":"plan-implement","isSidechain":false,"gitBranch":"2351-freeform","message":{"model":"claude-opus-4-8","usage":{"input_tokens":1,"cache_creation_input_tokens":0,"cache_read_input_tokens":0,"output_tokens":1}}}' \
  >> "$freeform_jsonl"
jq . "$freeform_jsonl" >/dev/null
touch "$freeform_jsonl"

OUT_FREEFORM=$(
  export DISPATCH_AUDIT_PROJECTS_ROOT="$FREEFORM_ROOT"
  bash "$SCRIPT_DIR/aggregate-usage.sh" --days 7
)

assert_eq "freeform: session type is other (not worker)" "other" \
  "$(jq -r '[.sessions[]|select(.id=="sess-freeform")][0].type' <<<"$OUT_FREEFORM")"
assert_eq "freeform: window.sidecar_eligible == 0 (other session excluded)" "0" \
  "$(jq '.window.sidecar_eligible' <<<"$OUT_FREEFORM")"

rm -rf "$FREEFORM_ROOT"

report_results
exit $FAIL
