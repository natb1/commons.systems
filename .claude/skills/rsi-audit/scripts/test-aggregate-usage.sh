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

# Numeric-tolerance variant of assert_eq for float sums whose jq string
# rendering is not stable across jq versions. Floating-point addition is not
# associative, so summing already-divided terms left-to-right (a test's
# EXPECTED_*) versus map-then-`add` (the aggregator) yields bit-distinct doubles
# that jq renders with different trailing digits on different jq builds. Compare
# the magnitudes within a tolerance instead of their string forms; correctness
# to 1e-9 is preserved, formatting fragility is removed.
assert_close() {
  local label="$1" expected="$2" actual="$3" tol="${4:-1e-9}"
  TOTAL=$((TOTAL + 1))
  local within
  within=$(jq -n --argjson e "$expected" --argjson a "$actual" --argjson t "$tol" \
    '((($e - $a) | if . < 0 then -. else . end) < $t)')
  if [[ "$within" == "true" ]]; then
    PASS=$((PASS + 1))
    echo "  PASS: $label"
  else
    FAIL=$((FAIL + 1))
    echo "  FAIL: $label (not within $tol)"
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

  # line 1: first user line — classifies as worker. Command matches the
  # session's own attributionSkill ("implement", set on every assistant turn
  # below) — a real worker session's launch command always matches its turns'
  # attribution (whole-session phase attribution realism sweep).
  printf '%s\n' '{"type":"user","message":{"content":"<command-name>/implement</command-name>"}}' \
    >> "$worker_jsonl"

  # line 2: assistant — implement, opus, usage input=1000, cc=2000, cr=4000, out=500
  # Tool calls A,B (context-pack, gh issue). Usage/model unchanged; content added.
  # lint-allow: gh-rest-porcelain fixture JSON simulates a transcript tool_use command string, not a real gh invocation
  printf '%s\n' '{"type":"assistant","attributionSkill":"implement","isSidechain":false,"gitBranch":"999-fixture","message":{"model":"claude-opus-4-8","content":[{"type":"tool_use","id":"toolu_001","name":"Bash","input":{"command":".claude/skills/dispatch-propagate/scripts/dispatch-context-pack 999 --pr"}},{"type":"tool_use","id":"toolu_002","name":"Bash","input":{"command":"gh issue view 999 --json labels"}}],"usage":{"input_tokens":1000,"cache_creation_input_tokens":2000,"cache_read_input_tokens":4000,"output_tokens":500}}}' \
    >> "$worker_jsonl"

  # line 3: assistant — same model/skill/branch, usage input=100, cc=200, cr=400, out=50
  # Tool calls A,B again → session document order A,B,A,B. Usage/model unchanged.
  # lint-allow: gh-rest-porcelain fixture JSON simulates a transcript tool_use command string, not a real gh invocation
  printf '%s\n' '{"type":"assistant","attributionSkill":"implement","isSidechain":false,"gitBranch":"999-fixture","message":{"model":"claude-opus-4-8","content":[{"type":"tool_use","id":"toolu_003","name":"Bash","input":{"command":".claude/skills/dispatch-propagate/scripts/dispatch-context-pack 999 --pr"}},{"type":"tool_use","id":"toolu_004","name":"Bash","input":{"command":"gh issue view 999 --json labels"}}],"usage":{"input_tokens":100,"cache_creation_input_tokens":200,"cache_read_input_tokens":400,"output_tokens":50}}}' \
    >> "$worker_jsonl"

  # line 4: assistant — zero-usage fixture line exercising cmd_prefix's env-var
  # stripping (#1588). One Bash tool call whose command begins with an env-var
  # assignment; cmd_prefix must strip it, keying the n-gram as "Bash:npm run".
  # All-zero usage so every totals / price / baseline_context / session-count
  # assertion is untouched; only the worker tool_calls order gains a trailing
  # NPM token (A,B,A,B,NPM).
  printf '%s\n' '{"type":"assistant","attributionSkill":"implement","isSidechain":false,"gitBranch":"999-fixture","message":{"model":"claude-opus-4-8","content":[{"type":"tool_use","id":"toolu_005","name":"Bash","input":{"command":"VITE_GITHUB_BRANCH=foo npm run build"}}],"usage":{"input_tokens":0,"cache_creation_input_tokens":0,"cache_read_input_tokens":0,"output_tokens":0}}}' \
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
  export DISPATCH_AUDIT_PROJECT_PREFIX="-home-x"
}

teardown() {
  if [[ -n "$ROOT" && -d "$ROOT" ]]; then
    rm -rf "$ROOT"
  fi
  if [[ -n "${BINDIR:-}" && -d "${BINDIR:-}" ]]; then
    rm -rf "$BINDIR"
  fi
}

# Global gh stub on PATH (intercepts gh_issue_view_rest → gh api repos/.../issues/<N>
# calls from aggregate-usage.sh). Inherits into all subshell aggregator runs via
# the exported PATH below. Cleaned up by teardown() on exit.
BINDIR=$(mktemp -d)
cat > "$BINDIR/gh" <<'STUB_EOF'
#!/usr/bin/env bash
# Stub for: gh api repos/<repo>/issues/<N>
# Parses N from the trailing /issues/<N> path segment; exits 0 always.
issue_num=""
for arg in "$@"; do
  if [[ "$arg" =~ /issues/([0-9]+) ]]; then
    issue_num="${BASH_REMATCH[1]}"
    break
  fi
done
if [[ "$issue_num" == "999" ]]; then
  # Two topic labels (dispatch, testing infrastructure) + one type label (enhancement)
  # — double-counted by by_topic because total-to-all-labels attribution.
  printf '%s\n' '{"number":999,"state":"open","labels":[{"name":"dispatch"},{"name":"testing infrastructure"},{"name":"enhancement"}]}'
elif [[ -n "$issue_num" ]]; then
  # Any other issue (e.g. 2268 from the sidecar-coverage fixture): no labels.
  printf '{"number":%s,"state":"open","labels":[]}\n' "$issue_num"
else
  # Unexpected call shape (not an issues endpoint): return a benign empty response.
  printf '%s\n' '{"number":0,"state":"open","labels":[]}'
fi
exit 0
STUB_EOF
chmod +x "$BINDIR/gh"
export PATH="$BINDIR:$PATH"

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
# Worker (sess-worker): implement / opus, summed usage
# (input=1100, cache_creation=2200, cache_read=4400, output=550) at opus rates
# (5 / 6.25 / 0.50 / 25 per Mtok).
EXPECTED_WORKER_COST=$(jq -n '(1100*5 + 2200*6.25 + 4400*0.50 + 550*25)/1e6')
assert_eq "sessions[sess-worker].cost_usd" "$EXPECTED_WORKER_COST" \
  "$(jq '[.sessions[]|select(.id=="sess-worker")][0].cost_usd' <<<"$OUT")"
assert_eq 'by_phase["implement"].cost_usd' "$EXPECTED_WORKER_COST" \
  "$(jq '.by_phase["implement"].cost_usd' <<<"$OUT")"
assert_eq 'by_phase_model["implement\tclaude-opus-4-8"].cost_usd' "$EXPECTED_WORKER_COST" \
  "$(jq '.by_phase_model["implement\tclaude-opus-4-8"].cost_usd' <<<"$OUT")"

# --- by_topic / by_type (#2503): issue 999 → dispatch + testing infrastructure + enhancement ---
# All 9 topic keys and all 3 type keys are always present (seeded from zero_bucket).
assert_eq 'by_topic keys == 9 sorted keys' \
  '["audio","budget","dispatch","fellspiral","landing","other","print","security","testing infrastructure"]' \
  "$(jq -c '.by_topic | keys' <<<"$OUT")"
assert_eq 'by_type keys == ["bug","enhancement","none"]' \
  '["bug","enhancement","none"]' \
  "$(jq -c '.by_type | keys' <<<"$OUT")"

# Same field set as by_phase: zero_bucket provides price_proxy_usd, input, cost_usd, turns.
assert_eq 'by_topic.dispatch has price_proxy_usd' 'true' \
  "$(jq '.by_topic.dispatch | has("price_proxy_usd")' <<<"$OUT")"
assert_eq 'by_topic.dispatch has input' 'true' \
  "$(jq '.by_topic.dispatch | has("input")' <<<"$OUT")"
assert_eq 'by_topic.dispatch has cost_usd' 'true' \
  "$(jq '.by_topic.dispatch | has("cost_usd")' <<<"$OUT")"
assert_eq 'by_topic.dispatch has turns' 'true' \
  "$(jq '.by_topic.dispatch | has("turns")' <<<"$OUT")"

# Total-to-all-labels: sess-worker (issue 999) is counted in BOTH the dispatch and
# the "testing infrastructure" buckets, so each bucket carries the full worker cost.
assert_eq 'by_topic.dispatch.cost_usd == EXPECTED_WORKER_COST' "$EXPECTED_WORKER_COST" \
  "$(jq '.by_topic.dispatch.cost_usd' <<<"$OUT")"
assert_eq 'by_topic["testing infrastructure"].cost_usd == EXPECTED_WORKER_COST' "$EXPECTED_WORKER_COST" \
  "$(jq '.by_topic["testing infrastructure"].cost_usd' <<<"$OUT")"

# sum(by_topic.cost_usd) == totals.cost_usd + EXPECTED_WORKER_COST:
# sess-worker is double-counted (dispatch + testing infrastructure); all other sessions
# (subagents, router, recovery) have no artifact and resolve to "other" exactly once.
assert_eq '(by_topic | sum cost_usd) == totals.cost_usd + EXPECTED_WORKER_COST' \
  "$(jq -n --argjson tot "$(jq '.totals.cost_usd' <<<"$OUT")" \
            --argjson w "$EXPECTED_WORKER_COST" '$tot + $w')" \
  "$(jq '(.by_topic | to_entries | map(.value.cost_usd) | add)' <<<"$OUT")"

# by_type: enhancement gets the worker (issue 999 carries enhancement); none gets
# everyone without a type label (all un-stamped sessions: subagents + router + recovery).
assert_eq 'by_type.enhancement.cost_usd == EXPECTED_WORKER_COST' "$EXPECTED_WORKER_COST" \
  "$(jq '.by_type.enhancement.cost_usd' <<<"$OUT")"
assert_eq 'by_type.none.cost_usd == totals.cost_usd - EXPECTED_WORKER_COST' \
  "$(jq -n --argjson tot "$(jq '.totals.cost_usd' <<<"$OUT")" \
            --argjson w "$EXPECTED_WORKER_COST" '$tot - $w')" \
  "$(jq '.by_type.none.cost_usd' <<<"$OUT")"

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
assert_eq "price_model.actual_rates_per_mtok.fable.output" "50" \
  "$(jq '.price_model.actual_rates_per_mtok.fable.output' <<<"$OUT")"

assert_eq "by_session_type.worker.sessions" "1" \
  "$(jq '.by_session_type.worker.sessions' <<<"$OUT")"
assert_eq "by_session_type.subagent.sessions" "2" \
  "$(jq '.by_session_type.subagent.sessions' <<<"$OUT")"
assert_eq 'by_session_type["router-tick"].sessions' "1" \
  "$(jq '.by_session_type["router-tick"].sessions' <<<"$OUT")"
assert_eq "by_session_type.recovery.sessions" "1" \
  "$(jq '.by_session_type.recovery.sessions' <<<"$OUT")"

assert_eq 'by_phase["implement"].output' "550" \
  "$(jq '.by_phase["implement"].output' <<<"$OUT")"

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
# The legacy worker sidecar carries no node_id key → projected as null, and the
# by_node aggregate stays empty (only non-null node_id sessions are folded).
assert_eq "sessions sess-worker artifact.node_id null (legacy sidecar)" "null" \
  "$(jq '.sessions[] | select(.id=="sess-worker") | .artifact.node_id' <<<"$OUT")"
assert_eq "by_node is {} when no sidecar carries node_id" "{}" \
  "$(jq -c '.by_node' <<<"$OUT")"

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
assert_close "lenses.baseline_context.total_proxy_usd" "$EXPECTED_BASELINE_PROXY" \
  "$(jq '.lenses.baseline_context.total_proxy_usd' <<<"$OUT")"

# --- phase_standup lens (strategy-token-economy clarification 12) ----------
# All five phase keys always present regardless of fixture coverage.
assert_eq "lenses.phase_standup keys == 5 phase enum" \
  '["fix","implement","main-qa","qa","review"]' \
  "$(jq -c '.lenses.phase_standup | keys | sort' <<<"$OUT")"
# skill_body_tokens comes from real SKILL.md files on disk (bytes/4 estimate) —
# assert positive rather than an exact byte count, which would be fragile
# against unrelated prose edits to those files.
assert_eq "lenses.phase_standup.*.skill_body_tokens all positive" "true" \
  "$(jq '[.lenses.phase_standup[] | .skill_body_tokens > 0] | all' <<<"$OUT")"
assert_eq "lenses.phase_standup.*.skill_body_lines all positive" "true" \
  "$(jq '[.lenses.phase_standup[] | .skill_body_lines > 0] | all' <<<"$OUT")"
assert_eq "lenses.phase_standup.*.skill_body_bytes all positive" "true" \
  "$(jq '[.lenses.phase_standup[] | .skill_body_bytes > 0] | all' <<<"$OUT")"
# implement (mapped_skill implement): the worker session (sess-worker) is
# the only qualifying session. Its opening bigram is the two dispatch-context-pack
# / gh-issue Bash calls (both scriptable), a 3rd Bash tool_use continues the
# scriptable run before the 4th — so the leading consecutive scriptable run is
# 4 (calls 1-4: A,B,A,B). The 5th call (VITE_GITHUB_BRANCH=... npm run build)
# matches no scriptable substring — env-var prefixing does not change the base
# command — so it is classified judgment, giving 1 judgment call inside the
# first $boot_window; the median over a single qualifying session is that
# session's own values.
assert_eq "phase_standup.implement.boot_preamble.sessions" "1" \
  "$(jq '.lenses.phase_standup.implement.boot_preamble.sessions' <<<"$OUT")"
assert_eq "phase_standup.implement.boot_preamble.scriptable_round_trips" "4" \
  "$(jq '.lenses.phase_standup.implement.boot_preamble.scriptable_round_trips' <<<"$OUT")"
assert_eq "phase_standup.implement.boot_preamble.judgment_calls" "1" \
  "$(jq '.lenses.phase_standup.implement.boot_preamble.judgment_calls' <<<"$OUT")"
assert_eq "phase_standup.implement.boot_preamble.ngrams[0].scriptable has 2 tokens" "2" \
  "$(jq '.lenses.phase_standup.implement.boot_preamble.ngrams[0].scriptable | length' <<<"$OUT")"
# main-qa (mapped_skill qa-main): the fixture has no qa-main-attributed session,
# so this phase must degrade gracefully — zero qualifying sessions, zero-valued
# medians, and an empty ngrams list, never a crash or a fabricated nonzero value.
assert_eq "phase_standup.main-qa.boot_preamble.sessions (no qualifying sessions)" "0" \
  "$(jq '.lenses.phase_standup["main-qa"].boot_preamble.sessions' <<<"$OUT")"
assert_eq "phase_standup.main-qa.boot_preamble.scriptable_round_trips (empty median)" "0" \
  "$(jq '.lenses.phase_standup["main-qa"].boot_preamble.scriptable_round_trips' <<<"$OUT")"
assert_eq "phase_standup.main-qa.boot_preamble.ngrams empty" "[]" \
  "$(jq -c '.lenses.phase_standup["main-qa"].boot_preamble.ngrams' <<<"$OUT")"

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
# pattern from the per-SUT test-*.sh files sharing dispatch-test-fixture.sh.
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
  export DISPATCH_AUDIT_PROJECT_PREFIX="-home-x"
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
  export DISPATCH_AUDIT_PROJECT_PREFIX="-home-x"
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
  export DISPATCH_AUDIT_PROJECT_PREFIX="-home-x"
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
  export DISPATCH_AUDIT_PROJECT_PREFIX="-home-x"
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
  export DISPATCH_AUDIT_PROJECT_PREFIX="-home-x"
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

# line 1: first user line — classifies as worker (mirror line 68). Command
# matches the session's own attributionSkill ("review-fix", set below).
printf '%s\n' '{"type":"user","message":{"content":"<command-name>/review-fix</command-name>"}}' \
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
  export DISPATCH_AUDIT_PROJECT_PREFIX="-home-x"
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
# node_id passthrough (tactic-outcome-envelope-node-lane-parity). A node-lane
# envelope carries "issue": null, "node_id": "<slug>" instead of an issue
# number. $outcome binds the WHOLE parsed envelope object (no hand-picked
# field subset), so node_id should ride through unstripped onto the
# per-session outcome — this is a regression guard that the passthrough is
# never lost, not a new reduce.
#
# Built in its own mktemp root (mirrors the partial-envelope fixture above).
# ---------------------------------------------------------------------------

echo ""
echo "--- node_id passthrough (tactic-outcome-envelope-node-lane-parity) ---"

NODE_ENV_JSON='{"schema":"dispatch.outcome.v1","phase":"review","repo":"natb1/commons.systems","issue":null,"node_id":"tactic-example-node","pr":2100,"base_sha":"nnn222","findings_surfaced":4,"findings_actionable":3,"fixes_applied":2,"followups_filed":1,"subagents_launched":6,"disposition":"completed_with_fixes","terminated_reason":null}'
NODE_BLOCK="$(envelope_block "$NODE_ENV_JSON")"

NODE_ROOT=$(mktemp -d)
trap 'rm -rf "$NODE_ROOT" "$FAKE_WRITER_DIR"; teardown' EXIT INT TERM
node_worktree="$NODE_ROOT/-home-x-worktrees-tactic-example-node"
mkdir -p "$node_worktree"
node_jsonl="$node_worktree/sess-node.jsonl"

# line 1: first user line — classifies as worker (mirror line 68)
printf '%s\n' '{"type":"user","message":{"content":"<command-name>/implement</command-name>"}}' \
  >> "$node_jsonl"
# line 2: assistant — opus, minimal usage (mirror the worker assistant shape)
printf '%s\n' '{"type":"assistant","attributionSkill":"implement","isSidechain":false,"gitBranch":"tactic-example-node","message":{"model":"claude-opus-4-8","content":[{"type":"tool_use","id":"toolu_n01","name":"Bash","input":{"command":"echo hi"}}],"usage":{"input_tokens":1,"cache_creation_input_tokens":2,"cache_read_input_tokens":4,"output_tokens":1}}}' \
  >> "$node_jsonl"
# line 3: node-lane outcome-envelope tool_result (mirror lines 799-801)
jq -nc --arg c "$NODE_BLOCK" \
  '{type:"user",message:{content:[{type:"tool_result",tool_use_id:"toolu_n01",content:$c}]}}' \
  >> "$node_jsonl"
jq . "$node_jsonl" >/dev/null
touch "$node_jsonl"

OUT_NODE=$(
  export DISPATCH_AUDIT_PROJECTS_ROOT="$NODE_ROOT"
  export DISPATCH_AUDIT_PROJECT_PREFIX="-home-x"
  bash "$SCRIPT_DIR/aggregate-usage.sh" --days 7
)

assert_eq "node-envelope sessions[sess-node].outcome.node_id" '"tactic-example-node"' \
  "$(jq '[.sessions[]|select(.id=="sess-node")][0].outcome.node_id' <<<"$OUT_NODE")"
assert_eq "node-envelope sessions[sess-node].outcome.issue is null" "null" \
  "$(jq '[.sessions[]|select(.id=="sess-node")][0].outcome.issue' <<<"$OUT_NODE")"

rm -rf "$NODE_ROOT"

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

# line 1: first user line — classifies as worker. Launch command uses /implement
# (this fixture is not under a by_skill/by_phase-shaped assertion, so the exact
# skill match only matters for launch-line realism, not for the rc!=0 assertion
# below, which fires regardless of re-keying).
printf '%s\n' '{"type":"user","message":{"content":"<command-name>/implement</command-name>"}}' \
  >> "$guard_jsonl"
# line 2: assistant — UNPRICEABLE model "gpt-fake-9" with NONZERO usage
printf '%s\n' '{"type":"assistant","attributionSkill":"plan-implement","isSidechain":false,"gitBranch":"2027-guard","message":{"model":"gpt-fake-9","usage":{"input_tokens":1000,"cache_creation_input_tokens":0,"cache_read_input_tokens":0,"output_tokens":0}}}' \
  >> "$guard_jsonl"
jq . "$guard_jsonl" >/dev/null
touch "$guard_jsonl"

if (
  export DISPATCH_AUDIT_PROJECTS_ROOT="$GUARD_ROOT"
  export DISPATCH_AUDIT_PROJECT_PREFIX="-home-x"
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
  export DISPATCH_AUDIT_PROJECT_PREFIX="-home-x"
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
  export DISPATCH_AUDIT_PROJECT_PREFIX="-home-x"
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
# Fable per-model cost (#2737). ISOLATED fixture: a worker session whose
# assistant message carries `claude-fable-5` with distinct nonzero usage in
# ALL FOUR components. This is the ONLY coverage of family()'s
# `startswith("claude-fable")` branch and the ACTUAL_RATES.fable row — before
# that branch existed, any fable session in the window aborted the whole
# aggregation via the unpriceable-model guard. Distinct counts make a rate
# swap between any two fable components visible; the expected value uses the
# full four-term formula at fable rates (10 / 12.50 / 1.00 / 50 per Mtok).
# ---------------------------------------------------------------------------

echo ""
echo "--- fable per-model cost (#2737) ---"

FABLE_ROOT=$(mktemp -d)
trap 'rm -rf "$FABLE_ROOT" "$FAKE_WRITER_DIR"; teardown' EXIT INT TERM
fable_worktree="$FABLE_ROOT/-home-x-worktrees-2737-fable"
mkdir -p "$fable_worktree"
fable_jsonl="$fable_worktree/sess-fable.jsonl"

# line 1: first user line — classifies as worker
printf '%s\n' '{"type":"user","message":{"content":"<command-name>/plan-issue</command-name>"}}' \
  >> "$fable_jsonl"
# line 2: assistant — claude-fable-5, distinct nonzero usage in all four components
printf '%s\n' '{"type":"assistant","attributionSkill":"plan-implement","isSidechain":false,"gitBranch":"2737-fable","message":{"model":"claude-fable-5","usage":{"input_tokens":1000,"cache_creation_input_tokens":2000,"cache_read_input_tokens":4000,"output_tokens":500}}}' \
  >> "$fable_jsonl"
jq . "$fable_jsonl" >/dev/null
touch "$fable_jsonl"

OUT_FABLE=$(
  export DISPATCH_AUDIT_PROJECTS_ROOT="$FABLE_ROOT"
  export DISPATCH_AUDIT_PROJECT_PREFIX="-home-x"
  bash "$SCRIPT_DIR/aggregate-usage.sh" --days 7
)

# Fable rates: input 10 / cache_creation 12.50 / cache_read 1.00 / output 50 per Mtok.
EXPECTED_FABLE_COST=$(jq -n '(1000*10 + 2000*12.50 + 4000*1.00 + 500*50)/1e6')
assert_eq "sessions[sess-fable].cost_usd (fable)" "$EXPECTED_FABLE_COST" \
  "$(jq '[.sessions[]|select(.id=="sess-fable")][0].cost_usd' <<<"$OUT_FABLE")"
assert_eq 'by_model["claude-fable-5"].cost_usd (fable)' "$EXPECTED_FABLE_COST" \
  "$(jq '.by_model["claude-fable-5"].cost_usd' <<<"$OUT_FABLE")"

rm -rf "$FABLE_ROOT"

# ---------------------------------------------------------------------------
# Graph-native node attribution (by_node join + align-family classification).
# ISOLATED fixture mirroring the haiku/fable structure: ONE session spawned
# with the graph-native /align-tactics command whose sidecar carries a
# node_id. Asserts (a) the align-family alternation classifies it as worker
# (not "other"), (b) the sidecar's node_id survives the stage-1 artifact
# projection, and (c) by_node carries exactly one row with the summed
# price_proxy_usd / cost_usd / turns / sessions.
# ---------------------------------------------------------------------------

echo ""
echo "--- graph-native node attribution: by_node + align-family worker ---"

NODE_ROOT=$(mktemp -d)
trap 'rm -rf "$NODE_ROOT" "$FAKE_WRITER_DIR"; teardown' EXIT INT TERM
node_worktree="$NODE_ROOT/-home-x-worktrees-tactic-node-fixture"
mkdir -p "$node_worktree"
node_jsonl="$node_worktree/sess-node.jsonl"

# line 1: first user line — the graph-native align-family command must classify
# as worker via the extended alternation.
printf '%s\n' '{"type":"user","message":{"content":"<command-name>/align-tactics</command-name>"}}' \
  >> "$node_jsonl"
# line 2: assistant — opus, distinct nonzero usage in all four components so a
# by_node component swap would be visible.
printf '%s\n' '{"type":"assistant","attributionSkill":"plan-implement","isSidechain":false,"gitBranch":"tactic-node-fixture","message":{"model":"claude-opus-4-8","usage":{"input_tokens":1000,"cache_creation_input_tokens":2000,"cache_read_input_tokens":4000,"output_tokens":500}}}' \
  >> "$node_jsonl"
jq . "$node_jsonl" >/dev/null
touch "$node_jsonl"

# Sibling sidecar in the graph-native shape: issue null, node_id set.
node_stamp="$node_worktree/sess-node.dispatch-stamp.json"
printf '%s\n' '{"schema":1,"session_id":"sess-node","repo":"natb1/commons.systems","issue":null,"pr":null,"branch":"tactic-node-fixture","base_sha":"beefcafe","node_id":"tactic-node-fixture","stamped_at":"2026-01-01T00:00:00Z"}' \
  > "$node_stamp"
jq . "$node_stamp" >/dev/null

OUT_NODE=$(
  export DISPATCH_AUDIT_PROJECTS_ROOT="$NODE_ROOT"
  export DISPATCH_AUDIT_PROJECT_PREFIX="-home-x"
  bash "$SCRIPT_DIR/aggregate-usage.sh" --days 7
)

assert_eq "node: /align-tactics session classifies as worker" "worker" \
  "$(jq -r '[.sessions[]|select(.id=="sess-node")][0].type' <<<"$OUT_NODE")"
assert_eq "node: sessions[sess-node].artifact.node_id" "tactic-node-fixture" \
  "$(jq -r '[.sessions[]|select(.id=="sess-node")][0].artifact.node_id' <<<"$OUT_NODE")"
assert_eq "node: sessions[sess-node].artifact.issue null" "null" \
  "$(jq '[.sessions[]|select(.id=="sess-node")][0].artifact.issue' <<<"$OUT_NODE")"

# by_node row: proxy at uniform Opus list rates; cost at real opus rates.
EXPECTED_NODE_PROXY=$(jq -n '(1000*15 + 2000*18.75 + 4000*1.5 + 500*75)/1e6')
EXPECTED_NODE_COST=$(jq -n '(1000*5 + 2000*6.25 + 4000*0.50 + 500*25)/1e6')
assert_eq "node: by_node has exactly one key" '["tactic-node-fixture"]' \
  "$(jq -c '.by_node | keys' <<<"$OUT_NODE")"
assert_eq 'node: by_node["tactic-node-fixture"].sessions' "1" \
  "$(jq '.by_node["tactic-node-fixture"].sessions' <<<"$OUT_NODE")"
assert_eq 'node: by_node["tactic-node-fixture"].turns' "1" \
  "$(jq '.by_node["tactic-node-fixture"].turns' <<<"$OUT_NODE")"
assert_eq 'node: by_node["tactic-node-fixture"].price_proxy_usd' "$EXPECTED_NODE_PROXY" \
  "$(jq '.by_node["tactic-node-fixture"].price_proxy_usd' <<<"$OUT_NODE")"
assert_eq 'node: by_node["tactic-node-fixture"].cost_usd' "$EXPECTED_NODE_COST" \
  "$(jq '.by_node["tactic-node-fixture"].cost_usd' <<<"$OUT_NODE")"
# A sidecar-carrying align worker also counts toward sidecar coverage.
assert_eq "node: window.sidecar_eligible == 1" "1" \
  "$(jq '.window.sidecar_eligible' <<<"$OUT_NODE")"
assert_eq "node: window.sidecar_present == 1" "1" \
  "$(jq '.window.sidecar_present' <<<"$OUT_NODE")"
# This run is fleet-scope (no --node flag) despite the fixture's graph-native
# node_id sidecar, so the new drop-accounting fields must read as untouched.
assert_eq "node: window.sidecar_coverage_measurable == true (fleet-scope run)" "true" \
  "$(jq '.window.sidecar_coverage_measurable' <<<"$OUT_NODE")"
assert_eq "node: window.scope_filter_dropped_unstamped == 0 (fleet scope)" "0" \
  "$(jq '.window.scope_filter_dropped_unstamped' <<<"$OUT_NODE")"
assert_eq "node: window.scope_filter_dropped_other_node == 0 (fleet scope)" "0" \
  "$(jq '.window.scope_filter_dropped_other_node' <<<"$OUT_NODE")"

rm -rf "$NODE_ROOT"

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
  export DISPATCH_AUDIT_PROJECT_PREFIX="-home-x"
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
  export DISPATCH_AUDIT_PROJECT_PREFIX="-home-x"
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
  export DISPATCH_AUDIT_PROJECT_PREFIX="-home-x"
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
  export DISPATCH_AUDIT_PROJECT_PREFIX="-home-x"
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
# Alternation coverage (#2351): every launch skill in the classifier's worker
# alternation must classify a first-message <command-name> session as "worker".
# The #2268 cov block above exercises only 3 of them; a typo in any of the
# other names would silently misclassify those sessions as "other".
# ISOLATED fixture: one minimal worker session per skill, each in its own root
# so the shared totals stay untouched. Keep this list in lockstep with
# `worker_skills` in aggregate-usage.sh (10 legacy phase skills, the 4
# graph-native align-family skills, and the 2 rsi-family skills).
# ---------------------------------------------------------------------------

echo ""
echo "--- alternation coverage: all 16 launch skills classify as worker (#2351) ---"

for skill in plan-issue implement qa-fix review-fix fix-checks fix-conflicts \
             qa-main budget-parse-job resolve-epic office-hours \
             align-strategy align-tactics align-init align \
             rsi rsi-audit; do
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
    export DISPATCH_AUDIT_PROJECT_PREFIX="-home-x"
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
  export DISPATCH_AUDIT_PROJECT_PREFIX="-home-x"
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
  export DISPATCH_AUDIT_PROJECT_PREFIX="-home-x"
  bash "$SCRIPT_DIR/aggregate-usage.sh" --days 7
)

assert_eq "freeform: session type is other (not worker)" "other" \
  "$(jq -r '[.sessions[]|select(.id=="sess-freeform")][0].type' <<<"$OUT_FREEFORM")"
assert_eq "freeform: window.sidecar_eligible == 0 (other session excluded)" "0" \
  "$(jq '.window.sidecar_eligible' <<<"$OUT_FREEFORM")"

rm -rf "$FREEFORM_ROOT"

# ---------------------------------------------------------------------------
# (a) --day window respects BOTH bounds (#2505). ISOLATED fixture: three worker
# transcripts whose mtimes straddle a fixed historical target day. The find is
# bounded below by SINCE="<day> 00:00:00" and above by "! -newermt <day+1
# 00:00:00>", so only the within-day file is scanned. Pick a fixed past day so
# the test is deterministic; touch -d sets whole-second (.000) mtimes clear of
# the boundary instants.
# ---------------------------------------------------------------------------

echo ""
echo "--- (a) --day window respects both bounds (#2505) ---"

DAY_ROOT=$(mktemp -d)
trap 'rm -rf "$DAY_ROOT" "$FAKE_WRITER_DIR"; teardown' EXIT INT TERM
day_worktree="$DAY_ROOT/-home-x-worktrees-2505-day"
mkdir -p "$day_worktree"

TARGET_DAY="2025-06-15"
# Three worker sessions; each a minimal worker transcript with nonzero usage so a
# scanned session shows up in totals.
for s in before within after; do
  day_jsonl="$day_worktree/sess-$s.jsonl"
  printf '%s\n' '{"type":"user","message":{"content":"<command-name>/plan-issue</command-name>"}}' \
    >> "$day_jsonl"
  printf '%s\n' '{"type":"assistant","attributionSkill":"plan-implement","isSidechain":false,"gitBranch":"2505-day","message":{"model":"claude-opus-4-8","usage":{"input_tokens":100,"cache_creation_input_tokens":0,"cache_read_input_tokens":0,"output_tokens":0}}}' \
    >> "$day_jsonl"
  jq . "$day_jsonl" >/dev/null
done
# mtimes: before = day-1 noon (excluded), within = day noon (included),
# after = day+1 noon (> UNTIL = day+1 00:00:00, excluded).
touch -d "2025-06-14 12:00:00" "$day_worktree/sess-before.jsonl"
touch -d "2025-06-15 12:00:00" "$day_worktree/sess-within.jsonl"
touch -d "2025-06-16 12:00:00" "$day_worktree/sess-after.jsonl"

OUT_DAY=$(
  export DISPATCH_AUDIT_PROJECTS_ROOT="$DAY_ROOT"
  export DISPATCH_AUDIT_PROJECT_PREFIX="-home-x"
  bash "$SCRIPT_DIR/aggregate-usage.sh" --day "$TARGET_DAY"
)
assert_eq "day: only within-day file scanned (files_scanned==1)" "1" \
  "$(jq '.window.files_scanned' <<<"$OUT_DAY")"
assert_eq "day: only within-day session counted (totals.sessions==1)" "1" \
  "$(jq '.totals.sessions' <<<"$OUT_DAY")"
assert_eq "day: the within session is the one scanned" "sess-within" \
  "$(jq -r '.sessions[0].id' <<<"$OUT_DAY")"
assert_eq "day: window.since lower bound" "2025-06-15 00:00:00" \
  "$(jq -r '.window.since' <<<"$OUT_DAY")"
assert_eq "day: window.until upper bound (day+1)" "2025-06-16 00:00:00" \
  "$(jq -r '.window.until' <<<"$OUT_DAY")"

rm -rf "$DAY_ROOT"

# ---------------------------------------------------------------------------
# UTC-consistent --days window. The find consumer interprets SINCE/UNTIL under
# TZ=UTC, so both bounds must be rendered with `date -u`. Regression: with a
# local-TZ rendering under a west-of-UTC zone (America/New_York, UTC-4/-5),
# UNTIL = local "now+1s" lands hours in the PAST when read as UTC, so a
# transcript with mtime = now is silently dropped from a --days window.
# ISOLATED fixture: one worker transcript touched to now; the aggregator runs
# with TZ=America/New_York and must still scan it.
# ---------------------------------------------------------------------------

echo ""
echo "--- UTC-consistent --days window under a west-of-UTC host TZ ---"

TZ_ROOT=$(mktemp -d)
trap 'rm -rf "$TZ_ROOT" "$FAKE_WRITER_DIR"; teardown' EXIT INT TERM
tz_worktree="$TZ_ROOT/-home-x-worktrees-utc-window"
mkdir -p "$tz_worktree"
tz_jsonl="$tz_worktree/sess-tz.jsonl"

printf '%s\n' '{"type":"user","message":{"content":"<command-name>/plan-issue</command-name>"}}' \
  >> "$tz_jsonl"
printf '%s\n' '{"type":"assistant","attributionSkill":"plan-implement","isSidechain":false,"gitBranch":"1-utc-window","message":{"model":"claude-opus-4-8","usage":{"input_tokens":100,"cache_creation_input_tokens":0,"cache_read_input_tokens":0,"output_tokens":0}}}' \
  >> "$tz_jsonl"
jq . "$tz_jsonl" >/dev/null
touch "$tz_jsonl"

OUT_TZ=$(
  export DISPATCH_AUDIT_PROJECTS_ROOT="$TZ_ROOT"
  export DISPATCH_AUDIT_PROJECT_PREFIX="-home-x"
  export TZ=America/New_York
  bash "$SCRIPT_DIR/aggregate-usage.sh" --days 7
)
assert_eq "utc-window: mtime=now file scanned under TZ=America/New_York" "1" \
  "$(jq '.window.files_scanned' <<<"$OUT_TZ")"
assert_eq "utc-window: mtime=now session counted (totals.sessions==1)" "1" \
  "$(jq '.totals.sessions' <<<"$OUT_TZ")"

rm -rf "$TZ_ROOT"

# ---------------------------------------------------------------------------
# (b) --exclude-sidecar-sessions drops a sidecar session, keeps it when the flag
# is absent (#2505). ISOLATED fixture: two worker sessions, both with NO artifact
# (no .dispatch-stamp.json), so each resolves to topic "other" and type "none".
# sess-drop has a sibling .file-issue-attribution.json; sess-keep does not.
#   WITHOUT the flag: both sessions contribute (input 1000 + 2000 = 3000).
#   WITH    the flag: only sess-keep contributes (input 1000).
# ---------------------------------------------------------------------------

echo ""
echo "--- (b) --exclude-sidecar-sessions drops sidecar session (#2505) ---"

SIDE_ROOT=$(mktemp -d)
trap 'rm -rf "$SIDE_ROOT" "$FAKE_WRITER_DIR"; teardown' EXIT INT TERM
side_worktree="$SIDE_ROOT/-home-x-worktrees-2505-sidecar"
mkdir -p "$side_worktree"

# sess-keep: input 1000 ; sess-drop: input 2000. Both workers, no artifact.
keep_jsonl="$side_worktree/sess-keep.jsonl"
printf '%s\n' '{"type":"user","message":{"content":"<command-name>/file-issue</command-name>"}}' \
  >> "$keep_jsonl"
printf '%s\n' '{"type":"assistant","attributionSkill":"plan-implement","isSidechain":false,"gitBranch":"2505-sidecar","message":{"model":"claude-opus-4-8","usage":{"input_tokens":1000,"cache_creation_input_tokens":0,"cache_read_input_tokens":0,"output_tokens":0}}}' \
  >> "$keep_jsonl"
jq . "$keep_jsonl" >/dev/null

drop_jsonl="$side_worktree/sess-drop.jsonl"
printf '%s\n' '{"type":"user","message":{"content":"<command-name>/file-issue</command-name>"}}' \
  >> "$drop_jsonl"
printf '%s\n' '{"type":"assistant","attributionSkill":"plan-implement","isSidechain":false,"gitBranch":"2505-sidecar","message":{"model":"claude-opus-4-8","usage":{"input_tokens":2000,"cache_creation_input_tokens":0,"cache_read_input_tokens":0,"output_tokens":0}}}' \
  >> "$drop_jsonl"
jq . "$drop_jsonl" >/dev/null

# Sidecar sibling for sess-drop only — the file-issue attribution marker.
printf '%s\n' '{"chosen_topics":["dispatch"],"session_id":"sess-drop"}' \
  > "$side_worktree/sess-drop.file-issue-attribution.json"
jq . "$side_worktree/sess-drop.file-issue-attribution.json" >/dev/null

touch "$keep_jsonl" "$drop_jsonl"

# WITHOUT the flag: both sessions land in by_topic.other / by_type.none.
OUT_SIDE_OFF=$(
  export DISPATCH_AUDIT_PROJECTS_ROOT="$SIDE_ROOT"
  export DISPATCH_AUDIT_PROJECT_PREFIX="-home-x"
  bash "$SCRIPT_DIR/aggregate-usage.sh" --days 7
)
assert_eq "sidecar OFF: both sessions counted (totals.sessions==2)" "2" \
  "$(jq '.totals.sessions' <<<"$OUT_SIDE_OFF")"
assert_eq "sidecar OFF: by_topic.other.input == 1000+2000" "3000" \
  "$(jq '.by_topic.other.input' <<<"$OUT_SIDE_OFF")"
assert_eq "sidecar OFF: by_type.none.input == 1000+2000" "3000" \
  "$(jq '.by_type.none.input' <<<"$OUT_SIDE_OFF")"

# WITH the flag: sess-drop excluded; only sess-keep contributes.
OUT_SIDE_ON=$(
  export DISPATCH_AUDIT_PROJECTS_ROOT="$SIDE_ROOT"
  export DISPATCH_AUDIT_PROJECT_PREFIX="-home-x"
  bash "$SCRIPT_DIR/aggregate-usage.sh" --days 7 --exclude-sidecar-sessions
)
assert_eq "sidecar ON: only sess-keep counted (totals.sessions==1)" "1" \
  "$(jq '.totals.sessions' <<<"$OUT_SIDE_ON")"
assert_eq "sidecar ON: the kept session is sess-keep" "sess-keep" \
  "$(jq -r '.sessions[0].id' <<<"$OUT_SIDE_ON")"
assert_eq "sidecar ON: by_topic.other.input == 1000 (sess-drop dropped)" "1000" \
  "$(jq '.by_topic.other.input' <<<"$OUT_SIDE_ON")"
assert_eq "sidecar ON: by_type.none.input == 1000 (sess-drop dropped)" "1000" \
  "$(jq '.by_type.none.input' <<<"$OUT_SIDE_ON")"

rm -rf "$SIDE_ROOT"

# ---------------------------------------------------------------------------
# (b2) --exclude-sidecar-sessions also drops the excluded session's SUBAGENT
# transcripts (<sid>/subagents/agent-*.jsonl). The file-issue sidecar's totals
# already include subagent usage, so leaving the subagent transcript in the
# scan would count those tokens twice once the priced sidecar is folded back.
# ISOLATED fixture, no artifact stamps (topic "other", type "none"):
#   sess-fi.jsonl (input 2000) + sess-fi.file-issue-attribution.json
#     + sess-fi/subagents/agent-x.jsonl (input 4000)   <- both must drop
#   sess-plain.jsonl (input 1000)
#     + sess-plain/subagents/agent-y.jsonl (input 500) <- both must stay
#   WITHOUT the flag: all 4 transcripts contribute (input 7500).
#   WITH    the flag: only sess-plain + its subagent contribute (input 1500).
# ---------------------------------------------------------------------------

echo ""
echo "--- (b2) --exclude-sidecar-sessions drops the session's subagents too ---"

SUB_ROOT=$(mktemp -d)
trap 'rm -rf "$SUB_ROOT" "$FAKE_WRITER_DIR"; teardown' EXIT INT TERM
sub_worktree="$SUB_ROOT/-home-x-worktrees-subagent-sidecar"
mkdir -p "$sub_worktree/sess-fi/subagents" "$sub_worktree/sess-plain/subagents"

# write_min_session <path> <input-tokens>: minimal 2-line worker transcript.
write_min_session() {
  local f="$1" in="$2"
  printf '%s\n' '{"type":"user","message":{"content":"<command-name>/file-issue</command-name>"}}' \
    > "$f"
  printf '{"type":"assistant","attributionSkill":"plan-implement","isSidechain":false,"gitBranch":"sub-sidecar","message":{"model":"claude-opus-4-8","usage":{"input_tokens":%s,"cache_creation_input_tokens":0,"cache_read_input_tokens":0,"output_tokens":0}}}\n' \
    "$in" >> "$f"
  jq . "$f" >/dev/null
}

write_min_session "$sub_worktree/sess-fi.jsonl" 2000
write_min_session "$sub_worktree/sess-fi/subagents/agent-x.jsonl" 4000
write_min_session "$sub_worktree/sess-plain.jsonl" 1000
write_min_session "$sub_worktree/sess-plain/subagents/agent-y.jsonl" 500
printf '%s\n' '{"chosen_topics":["dispatch"],"session_id":"sess-fi"}' \
  > "$sub_worktree/sess-fi.file-issue-attribution.json"
jq . "$sub_worktree/sess-fi.file-issue-attribution.json" >/dev/null
touch "$sub_worktree/sess-fi.jsonl" "$sub_worktree/sess-fi/subagents/agent-x.jsonl" \
  "$sub_worktree/sess-plain.jsonl" "$sub_worktree/sess-plain/subagents/agent-y.jsonl"

# WITHOUT the flag: all 4 transcripts scanned (control — subagents in scope).
OUT_SUB_OFF=$(
  export DISPATCH_AUDIT_PROJECTS_ROOT="$SUB_ROOT"
  export DISPATCH_AUDIT_PROJECT_PREFIX="-home-x"
  bash "$SCRIPT_DIR/aggregate-usage.sh" --days 7
)
assert_eq "subagent-sidecar OFF: all 4 transcripts scanned" "4" \
  "$(jq '.window.files_scanned' <<<"$OUT_SUB_OFF")"
assert_eq "subagent-sidecar OFF: by_topic.other.input == 7500" "7500" \
  "$(jq '.by_topic.other.input' <<<"$OUT_SUB_OFF")"

# WITH the flag: sess-fi AND its subagent drop; sess-plain and ITS subagent stay
# (a subagent whose parent has no sidecar must not be over-excluded).
OUT_SUB_ON=$(
  export DISPATCH_AUDIT_PROJECTS_ROOT="$SUB_ROOT"
  export DISPATCH_AUDIT_PROJECT_PREFIX="-home-x"
  bash "$SCRIPT_DIR/aggregate-usage.sh" --days 7 --exclude-sidecar-sessions
)
assert_eq "subagent-sidecar ON: only sess-plain + its subagent scanned" "2" \
  "$(jq '.window.files_scanned' <<<"$OUT_SUB_ON")"
assert_eq "subagent-sidecar ON: count-once — by_topic.other.input == 1500" "1500" \
  "$(jq '.by_topic.other.input' <<<"$OUT_SUB_ON")"
assert_eq "subagent-sidecar ON: excluded subagent's 4000 absent from by_type.none" "1500" \
  "$(jq '.by_type.none.input' <<<"$OUT_SUB_ON")"
assert_eq "subagent-sidecar ON: scanned ids are agent-y + sess-plain" \
  '["agent-y","sess-plain"]' \
  "$(jq -c '[.sessions[].id] | sort' <<<"$OUT_SUB_ON")"

rm -rf "$SUB_ROOT"

# ---------------------------------------------------------------------------
# (c) --day / --days mutual exclusivity and bad --day format both exit 2 (#2505).
# rc captured with the subshell idiom (a bare $(...) under set -e would abort the
# suite on the intended non-zero exit).
# ---------------------------------------------------------------------------

echo ""
echo "--- (c) --day/--days mutual exclusion + bad format exit 2 (#2505) ---"

if ( bash "$SCRIPT_DIR/aggregate-usage.sh" --day 2025-06-15 --days 7 >/dev/null 2>&1 ); then
  rc_mx1=0; else rc_mx1=$?; fi
assert_eq "mutual-exclusion: --day then --days exits 2" "2" "$rc_mx1"

if ( bash "$SCRIPT_DIR/aggregate-usage.sh" --days 7 --day 2025-06-15 >/dev/null 2>&1 ); then
  rc_mx2=0; else rc_mx2=$?; fi
assert_eq "mutual-exclusion: --days then --day exits 2 (other order)" "2" "$rc_mx2"

if ( bash "$SCRIPT_DIR/aggregate-usage.sh" --day badformat >/dev/null 2>&1 ); then
  rc_bad=0; else rc_bad=$?; fi
assert_eq "bad-format: --day badformat exits 2" "2" "$rc_bad"

if ( bash "$SCRIPT_DIR/aggregate-usage.sh" --day 2025-13-40 >/dev/null 2>&1 ); then
  rc_cal=0; else rc_cal=$?; fi
assert_eq "bad-format: --day with invalid calendar date exits 2" "2" "$rc_cal"

# ---------------------------------------------------------------------------
# Whole-session phase attribution (tactic-token-audit-whole-session-phase-
# attribution, Units 1-2). ISOLATED fixture (own mktemp root) so the shared
# setup() fixture's hand-computed totals stay completely untouched. Five
# sessions exercise every branch of the whole-session re-keying + the
# multi-phase guard:
#   sess-ws-worker  — single-phase worker; only its FIRST turn carries
#                     attributionSkill (review-fix); the other two turns are
#                     untagged and must be folded onto the launch skill.
#   sess-ws-multi   — worker whose turns carry TWO distinct phase-skill
#                     attributions (implement, qa-fix) plus one untagged turn;
#                     the multi-phase guard must keep per-turn attribution.
#   sess-ws-helper  — worker whose second turn carries a NON-phase helper
#                     skill (commit-merge-push, not in worker_skills); the
#                     guard must NOT trip on a helper skill, so the whole
#                     session still folds onto its one phase skill.
#   agent-ws        — subagent transcript nested under sess-ws-worker; whole-
#                     session re-keying is worker-only, so its untagged turn
#                     must stay in "<none>".
#   sess-ws-other   — freeform session with no <command-name> tag; classifies
#                     "other", proving the override never leaks past workers.
#
# NOTE: sess-ws-worker and sess-ws-helper BOTH launch /review-fix (per their
# own turns' attributionSkill), so the global by_phase["review-fix"] bucket
# legitimately pools BOTH sessions' turns — assertions below hand-sum across
# both rather than assuming sess-ws-worker alone, and per-session isolation is
# instead verified via each session's own `.phases` key set (built from that
# session's own by_skill, never cross-session) — this is the "adjust and note
# why" case the plan anticipated for a shared-root <none>/phase check.
# ---------------------------------------------------------------------------

echo ""
echo "--- whole-session phase attribution (worker/multi-phase/helper/subagent/other) ---"

WS_ROOT=$(mktemp -d)
trap 'rm -rf "$WS_ROOT" "$FAKE_WRITER_DIR"; teardown' EXIT INT TERM
ws_worktree="$WS_ROOT/-home-x-worktrees-ws-fixture"
mkdir -p "$ws_worktree/sess-ws-worker/subagents"

# 1. sess-ws-worker: launch /review-fix; turn1 tagged review-fix, turns 2-3
#    untagged with distinct nonzero usage.
ws_worker_jsonl="$ws_worktree/sess-ws-worker.jsonl"
printf '%s\n' '{"type":"user","message":{"content":"<command-name>/review-fix</command-name>"}}' \
  >> "$ws_worker_jsonl"
printf '%s\n' '{"type":"assistant","attributionSkill":"review-fix","isSidechain":false,"gitBranch":"ws-fixture","message":{"model":"claude-opus-4-8","usage":{"input_tokens":100,"cache_creation_input_tokens":200,"cache_read_input_tokens":400,"output_tokens":50}}}' \
  >> "$ws_worker_jsonl"
printf '%s\n' '{"type":"assistant","isSidechain":false,"gitBranch":"ws-fixture","message":{"model":"claude-opus-4-8","usage":{"input_tokens":10,"cache_creation_input_tokens":20,"cache_read_input_tokens":40,"output_tokens":5}}}' \
  >> "$ws_worker_jsonl"
printf '%s\n' '{"type":"assistant","isSidechain":false,"gitBranch":"ws-fixture","message":{"model":"claude-opus-4-8","usage":{"input_tokens":1,"cache_creation_input_tokens":2,"cache_read_input_tokens":4,"output_tokens":1}}}' \
  >> "$ws_worker_jsonl"
jq . "$ws_worker_jsonl" >/dev/null

# 1b. subagent nested under sess-ws-worker: untagged turn, must stay <none>.
ws_agent_jsonl="$ws_worktree/sess-ws-worker/subagents/agent-ws.jsonl"
printf '%s\n' '{"type":"user","message":{"content":"subagent task"}}' \
  >> "$ws_agent_jsonl"
printf '%s\n' '{"type":"assistant","isSidechain":true,"gitBranch":"ws-fixture","message":{"model":"claude-sonnet-4-6","usage":{"input_tokens":7,"cache_creation_input_tokens":0,"cache_read_input_tokens":0,"output_tokens":0}}}' \
  >> "$ws_agent_jsonl"
jq . "$ws_agent_jsonl" >/dev/null

# 2. sess-ws-multi: launch /implement; turns tagged implement + qa-fix (two
#    DISTINCT phase skills) plus one untagged turn.
ws_multi_jsonl="$ws_worktree/sess-ws-multi.jsonl"
printf '%s\n' '{"type":"user","message":{"content":"<command-name>/implement</command-name>"}}' \
  >> "$ws_multi_jsonl"
printf '%s\n' '{"type":"assistant","attributionSkill":"implement","isSidechain":false,"gitBranch":"ws-fixture","message":{"model":"claude-opus-4-8","usage":{"input_tokens":1000,"cache_creation_input_tokens":0,"cache_read_input_tokens":0,"output_tokens":0}}}' \
  >> "$ws_multi_jsonl"
printf '%s\n' '{"type":"assistant","attributionSkill":"qa-fix","isSidechain":false,"gitBranch":"ws-fixture","message":{"model":"claude-opus-4-8","usage":{"input_tokens":2000,"cache_creation_input_tokens":0,"cache_read_input_tokens":0,"output_tokens":0}}}' \
  >> "$ws_multi_jsonl"
printf '%s\n' '{"type":"assistant","isSidechain":false,"gitBranch":"ws-fixture","message":{"model":"claude-opus-4-8","usage":{"input_tokens":3000,"cache_creation_input_tokens":0,"cache_read_input_tokens":0,"output_tokens":0}}}' \
  >> "$ws_multi_jsonl"
jq . "$ws_multi_jsonl" >/dev/null

# 3. sess-ws-helper: launch /review-fix; turn1 tagged review-fix, turn2
#    tagged commit-merge-push (a NON-phase helper skill — not in
#    worker_skills). The multi-phase guard must NOT trip on this.
ws_helper_jsonl="$ws_worktree/sess-ws-helper.jsonl"
printf '%s\n' '{"type":"user","message":{"content":"<command-name>/review-fix</command-name>"}}' \
  >> "$ws_helper_jsonl"
printf '%s\n' '{"type":"assistant","attributionSkill":"review-fix","isSidechain":false,"gitBranch":"ws-fixture","message":{"model":"claude-opus-4-8","usage":{"input_tokens":500,"cache_creation_input_tokens":0,"cache_read_input_tokens":0,"output_tokens":0}}}' \
  >> "$ws_helper_jsonl"
printf '%s\n' '{"type":"assistant","attributionSkill":"commit-merge-push","isSidechain":false,"gitBranch":"ws-fixture","message":{"model":"claude-opus-4-8","usage":{"input_tokens":300,"cache_creation_input_tokens":0,"cache_read_input_tokens":0,"output_tokens":0}}}' \
  >> "$ws_helper_jsonl"
jq . "$ws_helper_jsonl" >/dev/null

# 4. sess-ws-other: freeform text, no <command-name> tag -> classifies "other".
ws_other_jsonl="$ws_worktree/sess-ws-other.jsonl"
printf '%s\n' '{"type":"user","message":{"content":"Just chatting here, no slash command"}}' \
  >> "$ws_other_jsonl"
printf '%s\n' '{"type":"assistant","isSidechain":false,"gitBranch":"ws-fixture","message":{"model":"claude-opus-4-8","usage":{"input_tokens":9,"cache_creation_input_tokens":0,"cache_read_input_tokens":0,"output_tokens":0}}}' \
  >> "$ws_other_jsonl"
jq . "$ws_other_jsonl" >/dev/null

touch "$ws_worker_jsonl" "$ws_agent_jsonl" "$ws_multi_jsonl" "$ws_helper_jsonl" "$ws_other_jsonl"

OUT_WS=$(
  export DISPATCH_AUDIT_PROJECTS_ROOT="$WS_ROOT"
  export DISPATCH_AUDIT_PROJECT_PREFIX="-home-x"
  bash "$SCRIPT_DIR/aggregate-usage.sh" --days 7
)

# --- sess-ws-worker: single-phase whole-session re-keying ---
# by_phase["review-fix"] pools sess-ws-worker (3 turns/111 input) AND
# sess-ws-helper (2 turns/800 input) — both launch /review-fix in this root.
assert_eq "ws: by_phase[review-fix].turns == 5 (worker 3 + helper 2)" "5" \
  "$(jq '.by_phase["review-fix"].turns' <<<"$OUT_WS")"
assert_eq "ws: by_phase[review-fix].input == 911 (worker 111 + helper 800)" "911" \
  "$(jq '.by_phase["review-fix"].input' <<<"$OUT_WS")"

# Invariance check: whole-session re-keying is a pure re-key, so the ROOT's
# total price_proxy_usd equals the hand-summed usage across all 5 sessions'
# turns, independent of any re-keying (input=6927, cc=222, cr=444, out=56 —
# worker 111/222/444/56 + multi 6000/0/0/0 + helper 800/0/0/0 + subagent
# 7/0/0/0 + other 9/0/0/0).
EXPECTED_WS_TOTAL_PROXY=$(jq -n '(6927*15 + 222*18.75 + 444*1.5 + 56*75)/1e6')
assert_close "ws: totals.price_proxy_usd (hand-summed, re-keying invariant)" \
  "$EXPECTED_WS_TOTAL_PROXY" "$(jq '.totals.price_proxy_usd' <<<"$OUT_WS")"

assert_eq "ws: sess-ws-worker phases keys == [review-fix] (no <none> leak)" '["review-fix"]' \
  "$(jq -c '[.sessions[]|select(.id=="sess-ws-worker")][0].phases | keys' <<<"$OUT_WS")"
assert_eq "ws: attribution_coverage.whole_session_attributed_sessions == 2 (worker + helper)" "2" \
  "$(jq '.attribution_coverage.whole_session_attributed_sessions' <<<"$OUT_WS")"

# The RAW per-turn harness slice is projected onto each `.sessions[]` entry as
# `by_attribution_skill` / `attributed_turns_raw` (SKILL.md step 3 documents it
# as the per-session escape hatch for auditing the whole-session override):
# sess-ws-worker's turn1 is tagged review-fix and turns 2-3 are untagged, so the
# raw slice still shows the harness gap the re-keyed `phases` map hides.
assert_eq "ws: sess-ws-worker by_attribution_skill[<none>].turns == 2 (raw gap preserved)" "2" \
  "$(jq '[.sessions[]|select(.id=="sess-ws-worker")][0].by_attribution_skill["<none>"].turns' <<<"$OUT_WS")"
assert_eq "ws: sess-ws-worker by_attribution_skill[review-fix].turns == 1 (raw, un-re-keyed)" "1" \
  "$(jq '[.sessions[]|select(.id=="sess-ws-worker")][0].by_attribution_skill["review-fix"].turns' <<<"$OUT_WS")"
assert_eq "ws: sess-ws-worker attributed_turns_raw == 1" "1" \
  "$(jq '[.sessions[]|select(.id=="sess-ws-worker")][0].attributed_turns_raw' <<<"$OUT_WS")"

# attribution_coverage raw-vs-effective (Unit 2). The window-wide raw/effective
# counters roll the same per-session raw slice up, so hand-derive both from every
# session's RAW per-turn attributionSkill (raw skill != "<none>": worker
# turn1=review-fix, multi turns1-2=implement/qa-fix, helper both turns=
# review-fix/commit-merge-push — helper's commit-merge-push counts as raw-
# attributed even though it is not a worker_skills member) vs the
# AFTER-rekey by_skill["<none>"] turns (worker 0, multi 1, helper 0, subagent
# 1, other 1). turns_total=10 (3+3+2+1+1); turns_attributed_raw=5
# (1+2+2+0+0); turns_attributed_effective=7 (3+2+2+0+0).
assert_eq "ws: attribution_coverage.turns_total == 10" "10" \
  "$(jq '.attribution_coverage.turns_total' <<<"$OUT_WS")"
assert_eq "ws: attribution_coverage.turns_attributed_raw == 5" "5" \
  "$(jq '.attribution_coverage.turns_attributed_raw' <<<"$OUT_WS")"
assert_eq "ws: attribution_coverage.turns_attributed_effective == 7" "7" \
  "$(jq '.attribution_coverage.turns_attributed_effective' <<<"$OUT_WS")"
assert_eq "ws: attribution_coverage.raw_coverage_rate == 0.5" "0.5" \
  "$(jq '.attribution_coverage.raw_coverage_rate' <<<"$OUT_WS")"
assert_eq "ws: attribution_coverage.effective_coverage_rate == 0.7" "0.7" \
  "$(jq '.attribution_coverage.effective_coverage_rate' <<<"$OUT_WS")"

# --- sess-ws-multi: multi-phase guard keeps per-turn attribution ---
assert_eq "ws: attribution_coverage.multi_phase_worker_sessions == 1 (sess-ws-multi only)" "1" \
  "$(jq '.attribution_coverage.multi_phase_worker_sessions' <<<"$OUT_WS")"
assert_eq "ws: sess-ws-multi.whole_session_attributed == false" "false" \
  "$(jq '[.sessions[]|select(.id=="sess-ws-multi")][0].whole_session_attributed' <<<"$OUT_WS")"
# Its untagged 3rd turn stays in <none> (per-turn preserved, NOT re-keyed) —
# by_skill["<none>"] for this session prices exactly its untagged turn's own
# usage (3000 input at the uniform Opus proxy rate), proving no re-keying leak.
EXPECTED_MULTI_NONE_PROXY=$(jq -n '(3000*15)/1e6')
assert_close "ws: sess-ws-multi phases[<none>] == untagged turn's own proxy price" \
  "$EXPECTED_MULTI_NONE_PROXY" \
  "$(jq '[.sessions[]|select(.id=="sess-ws-multi")][0].phases["<none>"]' <<<"$OUT_WS")"

# --- sess-ws-helper: non-phase helper skill does not trip the guard ---
assert_eq "ws: sess-ws-helper.whole_session_attributed == true" "true" \
  "$(jq '[.sessions[]|select(.id=="sess-ws-helper")][0].whole_session_attributed' <<<"$OUT_WS")"
assert_eq "ws: sess-ws-helper phases keys == [review-fix] (both turns folded there)" '["review-fix"]' \
  "$(jq -c '[.sessions[]|select(.id=="sess-ws-helper")][0].phases | keys' <<<"$OUT_WS")"

# --- agent-ws: subagent transcript, unchanged behavior ---
assert_eq "ws: agent-ws classifies as subagent" "subagent" \
  "$(jq -r '[.sessions[]|select(.id=="agent-ws")][0].type' <<<"$OUT_WS")"
assert_eq "ws: agent-ws phases keys == [<none>] (subagent turn never re-keyed)" '["<none>"]' \
  "$(jq -c '[.sessions[]|select(.id=="agent-ws")][0].phases | keys' <<<"$OUT_WS")"

# --- sess-ws-other: non-worker session, override never leaks ---
assert_eq "ws: sess-ws-other classifies as other" "other" \
  "$(jq -r '[.sessions[]|select(.id=="sess-ws-other")][0].type' <<<"$OUT_WS")"
assert_eq "ws: sess-ws-other phases keys == [<none>] (no whole-session override outside worker)" '["<none>"]' \
  "$(jq -c '[.sessions[]|select(.id=="sess-ws-other")][0].phases | keys' <<<"$OUT_WS")"

rm -rf "$WS_ROOT"

# ---------------------------------------------------------------------------
# Audit-instrument scoping (tactic-audit-instrument-scoping): --session and
# --node collapse the fleet-wide audit and a future per-node/per-session
# evaluator onto ONE measurement instrument. Four fixtures below cover:
#   (A) --session ID selects exactly that session.
#   (B) --node ID selects the node's sessions AND their subagent transcripts
#       (which have no sidecar of their own — the whole point of the
#       stem-resolution reuse), while excluding a different node and an
#       unstamped session.
#   (C) the mtime-window decision: --session/--node with no explicit
#       --day/--days is UNBOUNDED (finds a session far outside the --days 7
#       default); an explicit --days still bounds a scoped run.
#   (D) the mutual-exclusion / window.days / no-persist decisions:
#       --session + --node together exits 2; window.days is null on an
#       unbounded scoped run and the integer DAYS value on a bounded one;
#       DISPATCH_AUDIT_AGGREGATES_ENABLED=1 never invokes the writer for a
#       scoped run.
# ---------------------------------------------------------------------------

echo ""
echo "--- (A) --session ID selects exactly that session ---"

SCOPE_SESS_ROOT=$(mktemp -d)
trap 'rm -rf "$SCOPE_SESS_ROOT" "$FAKE_WRITER_DIR"; teardown' EXIT INT TERM
scope_sess_worktree="$SCOPE_SESS_ROOT/-home-x-worktrees-scope-session"
mkdir -p "$scope_sess_worktree"

write_min_session "$scope_sess_worktree/sess-scope-a.jsonl" 1000
write_min_session "$scope_sess_worktree/sess-scope-b.jsonl" 2000
touch "$scope_sess_worktree/sess-scope-a.jsonl" "$scope_sess_worktree/sess-scope-b.jsonl"

OUT_SCOPE_SESS=$(
  export DISPATCH_AUDIT_PROJECTS_ROOT="$SCOPE_SESS_ROOT"
  export DISPATCH_AUDIT_PROJECT_PREFIX="-home-x"
  bash "$SCRIPT_DIR/aggregate-usage.sh" --days 7 --session sess-scope-a
)
assert_eq "session-scope: files_scanned == 1" "1" \
  "$(jq '.window.files_scanned' <<<"$OUT_SCOPE_SESS")"
assert_eq "session-scope: totals.sessions == 1" "1" \
  "$(jq '.totals.sessions' <<<"$OUT_SCOPE_SESS")"
assert_eq "session-scope: the one session is sess-scope-a" '["sess-scope-a"]' \
  "$(jq -c '[.sessions[].id]' <<<"$OUT_SCOPE_SESS")"
assert_eq "session-scope: sess-scope-b excluded (input stays 1000, not 3000)" "1000" \
  "$(jq '.totals.input' <<<"$OUT_SCOPE_SESS")"
assert_eq "session-scope: window.scope.type == session" "session" \
  "$(jq -r '.window.scope.type' <<<"$OUT_SCOPE_SESS")"
assert_eq "session-scope: window.scope.id == sess-scope-a" "sess-scope-a" \
  "$(jq -r '.window.scope.id' <<<"$OUT_SCOPE_SESS")"

rm -rf "$SCOPE_SESS_ROOT"

echo ""
echo "--- (B) --node ID selects the node's sessions AND their subagents ---"

SCOPE_NODE_ROOT=$(mktemp -d)
trap 'rm -rf "$SCOPE_NODE_ROOT" "$FAKE_WRITER_DIR"; teardown' EXIT INT TERM
scope_node_worktree="$SCOPE_NODE_ROOT/-home-x-worktrees-scope-node"
mkdir -p "$scope_node_worktree/sess-scope-x/subagents"

# sess-scope-x: stamped node_id == tactic-scope-x (the target), with ONE
# nested subagent transcript that carries NO sidecar of its own.
write_min_session "$scope_node_worktree/sess-scope-x.jsonl" 1000
printf '%s\n' '{"schema":1,"session_id":"sess-scope-x","repo":"natb1/commons.systems","issue":null,"pr":null,"branch":"scope-x","base_sha":"aaa","node_id":"tactic-scope-x","stamped_at":"2026-01-01T00:00:00Z"}' \
  > "$scope_node_worktree/sess-scope-x.dispatch-stamp.json"
jq . "$scope_node_worktree/sess-scope-x.dispatch-stamp.json" >/dev/null
write_min_session "$scope_node_worktree/sess-scope-x/subagents/agent-x1.jsonl" 500

# sess-scope-y: stamped node_id == tactic-scope-y (a DIFFERENT node) — must
# be excluded from a --node tactic-scope-x run.
write_min_session "$scope_node_worktree/sess-scope-y.jsonl" 2000
printf '%s\n' '{"schema":1,"session_id":"sess-scope-y","repo":"natb1/commons.systems","issue":null,"pr":null,"branch":"scope-y","base_sha":"bbb","node_id":"tactic-scope-y","stamped_at":"2026-01-01T00:00:00Z"}' \
  > "$scope_node_worktree/sess-scope-y.dispatch-stamp.json"
jq . "$scope_node_worktree/sess-scope-y.dispatch-stamp.json" >/dev/null

# sess-scope-z: no sidecar at all — must be excluded.
write_min_session "$scope_node_worktree/sess-scope-z.jsonl" 4000

touch "$scope_node_worktree/sess-scope-x.jsonl" "$scope_node_worktree/sess-scope-x/subagents/agent-x1.jsonl" \
  "$scope_node_worktree/sess-scope-y.jsonl" "$scope_node_worktree/sess-scope-z.jsonl"

OUT_SCOPE_NODE=$(
  export DISPATCH_AUDIT_PROJECTS_ROOT="$SCOPE_NODE_ROOT"
  export DISPATCH_AUDIT_PROJECT_PREFIX="-home-x"
  bash "$SCRIPT_DIR/aggregate-usage.sh" --days 7 --node tactic-scope-x
)
assert_eq "node-scope: files_scanned == 2 (session + its subagent)" "2" \
  "$(jq '.window.files_scanned' <<<"$OUT_SCOPE_NODE")"
assert_eq "node-scope: scanned ids are sess-scope-x + agent-x1" '["agent-x1","sess-scope-x"]' \
  "$(jq -c '[.sessions[].id] | sort' <<<"$OUT_SCOPE_NODE")"
assert_eq "node-scope: totals.input == 1000+500 (other node/unstamped excluded)" "1500" \
  "$(jq '.totals.input' <<<"$OUT_SCOPE_NODE")"
assert_eq "node-scope: window.scope.type == node" "node" \
  "$(jq -r '.window.scope.type' <<<"$OUT_SCOPE_NODE")"
assert_eq "node-scope: window.scope.id == tactic-scope-x" "tactic-scope-x" \
  "$(jq -r '.window.scope.id' <<<"$OUT_SCOPE_NODE")"
assert_eq "node-scope: window.scope_filter_dropped_other_node == 1 (sess-scope-y)" "1" \
  "$(jq '.window.scope_filter_dropped_other_node' <<<"$OUT_SCOPE_NODE")"
# sess-scope-z is built by write_min_session, which stamps /file-issue — not a
# worker_skills command, so it would classify "other" if it ever reached
# $sessions. It never does: the gate drops it for want of a sidecar before
# classification runs. This is exactly why the drop counters are untyped (see
# aggregate-usage.sh BEHAVIOR CONTRACT) — it is still counted as an unstamped
# drop regardless of what it would have classified as.
assert_eq "node-scope: window.scope_filter_dropped_unstamped == 1 (sess-scope-z)" "1" \
  "$(jq '.window.scope_filter_dropped_unstamped' <<<"$OUT_SCOPE_NODE")"

rm -rf "$SCOPE_NODE_ROOT"

echo ""
echo "--- (C) mtime-window decision: scoped default is UNBOUNDED, --days still bounds it ---"

SCOPE_WIN_ROOT=$(mktemp -d)
trap 'rm -rf "$SCOPE_WIN_ROOT" "$FAKE_WRITER_DIR"; teardown' EXIT INT TERM
scope_win_worktree="$SCOPE_WIN_ROOT/-home-x-worktrees-scope-window"
mkdir -p "$scope_win_worktree"

write_min_session "$scope_win_worktree/sess-scope-old.jsonl" 1000
# 40 days old — well outside the --days default of 7.
touch -d "40 days ago" "$scope_win_worktree/sess-scope-old.jsonl"

# (C1) --session with NO --day/--days: unbounded window, the old file IS found.
OUT_SCOPE_UNBOUNDED=$(
  export DISPATCH_AUDIT_PROJECTS_ROOT="$SCOPE_WIN_ROOT"
  export DISPATCH_AUDIT_PROJECT_PREFIX="-home-x"
  bash "$SCRIPT_DIR/aggregate-usage.sh" --session sess-scope-old
)
assert_eq "scoped unbounded: files_scanned == 1 (40-day-old file found)" "1" \
  "$(jq '.window.files_scanned' <<<"$OUT_SCOPE_UNBOUNDED")"
assert_eq "scoped unbounded: window.days is null" "null" \
  "$(jq '.window.days' <<<"$OUT_SCOPE_UNBOUNDED")"
assert_eq "scoped unbounded: window.since is the epoch" "1970-01-01 00:00:00" \
  "$(jq -r '.window.since' <<<"$OUT_SCOPE_UNBOUNDED")"

# (C2) --session WITH explicit --days 7: bounded window, the old file is NOT
# found — proves the scope filter does not silently override an explicit
# window (this run should behave exactly like the fleet-wide default would).
OUT_SCOPE_BOUNDED=$(
  export DISPATCH_AUDIT_PROJECTS_ROOT="$SCOPE_WIN_ROOT"
  export DISPATCH_AUDIT_PROJECT_PREFIX="-home-x"
  bash "$SCRIPT_DIR/aggregate-usage.sh" --session sess-scope-old --days 7
)
assert_eq "scoped + explicit --days 7: files_scanned == 0 (old file excluded)" "0" \
  "$(jq '.window.files_scanned' <<<"$OUT_SCOPE_BOUNDED")"
assert_eq "scoped + explicit --days 7: window.days == 7" "7" \
  "$(jq '.window.days' <<<"$OUT_SCOPE_BOUNDED")"

rm -rf "$SCOPE_WIN_ROOT"

echo ""
echo "--- (D) --session/--node mutual exclusion + no-persist for scoped runs ---"

# (D1) --session and --node together exits 2, both orders.
if ( bash "$SCRIPT_DIR/aggregate-usage.sh" --session sess-a --node tactic-b >/dev/null 2>&1 ); then
  rc_scope1=0; else rc_scope1=$?; fi
assert_eq "mutual-exclusion: --session then --node exits 2" "2" "$rc_scope1"

if ( bash "$SCRIPT_DIR/aggregate-usage.sh" --node tactic-b --session sess-a >/dev/null 2>&1 ); then
  rc_scope2=0; else rc_scope2=$?; fi
assert_eq "mutual-exclusion: --node then --session exits 2 (other order)" "2" "$rc_scope2"

# (D2) DISPATCH_AUDIT_AGGREGATES_ENABLED=1 never invokes the writer for a
# scoped run, even though the gate is on. Reuses the shared fixture ($ROOT)
# and the FAKE_WRITER_DIR sentinel idiom from the persist-wiring block above.
SCOPE_PERSIST_ROOT=$(mktemp -d)
trap 'rm -rf "$SCOPE_PERSIST_ROOT" "$FAKE_WRITER_DIR"; teardown' EXIT INT TERM
scope_persist_worktree="$SCOPE_PERSIST_ROOT/-home-x-worktrees-scope-persist"
mkdir -p "$scope_persist_worktree"
write_min_session "$scope_persist_worktree/sess-scope-persist.jsonl" 1000
touch "$scope_persist_worktree/sess-scope-persist.jsonl"

SENTINEL_SCOPE_PERSIST="$FAKE_WRITER_DIR/invoked-scope-persist"
printf '#!/usr/bin/env bash\n: > %s\ncat >/dev/null\n' "'$SENTINEL_SCOPE_PERSIST'" \
  > "$FAKE_WRITER_DIR/fake-writer-scope-persist"
chmod +x "$FAKE_WRITER_DIR/fake-writer-scope-persist"
if (
  export DISPATCH_AUDIT_PROJECTS_ROOT="$SCOPE_PERSIST_ROOT"
  export DISPATCH_AUDIT_PROJECT_PREFIX="-home-x"
  export DISPATCH_AUDIT_AGGREGATES_ENABLED="1"
  export DISPATCH_AUDIT_AGGREGATES_WRITER="$FAKE_WRITER_DIR/fake-writer-scope-persist"
  bash "$SCRIPT_DIR/aggregate-usage.sh" --session sess-scope-persist >/dev/null
); then rc_scope_persist=0; else rc_scope_persist=$?; fi
assert_eq "scoped + gate ON: script still succeeds" "0" "$rc_scope_persist"
assert_eq "scoped + gate ON: writer NOT invoked (no persist for a scoped run)" "1" \
  "$([[ ! -e "$SENTINEL_SCOPE_PERSIST" ]] && echo 1 || echo 0)"

rm -rf "$SCOPE_PERSIST_ROOT"

# ---------------------------------------------------------------------------
# lenses.cache_efficiency: hit_ratio (tactic-audit-cache-efficiency-lens).
# ISOLATED fixture, own mktemp root:
#   sess-hr-1: launch /implement, ONE turn, usage input=100 cc=300 cr=600
#              (total 1000) -> hit_ratio = 600/1000 = 0.6. Carries a real
#              timestamp so the stage-1 started_at addition is also asserted
#              populated here.
#   sess-hr-2: launch /qa-fix, ONE turn, ALL-ZERO usage -> hit_ratio must be
#              null (divide-by-zero guard), never a fabricated 0.
# sess-hr-2 contributes nothing to any totals, so window-wide hit_ratio equals
# sess-hr-1's own 0.6 exactly.
# ---------------------------------------------------------------------------

echo ""
echo "--- lenses.cache_efficiency.hit_ratio + started_at (tactic-audit-cache-efficiency-lens) ---"

HR_ROOT=$(mktemp -d)
trap 'rm -rf "$HR_ROOT" "$FAKE_WRITER_DIR"; teardown' EXIT INT TERM
hr_worktree="$HR_ROOT/-home-x-worktrees-hit-ratio-fixture"
mkdir -p "$hr_worktree"

hr1_jsonl="$hr_worktree/sess-hr-1.jsonl"
printf '%s\n' '{"type":"user","message":{"content":"<command-name>/implement</command-name>"},"timestamp":"2026-08-01T00:00:00.000Z"}' \
  >> "$hr1_jsonl"
printf '%s\n' '{"type":"assistant","attributionSkill":"implement","isSidechain":false,"gitBranch":"hit-ratio-fixture","message":{"model":"claude-opus-4-8","usage":{"input_tokens":100,"cache_creation_input_tokens":300,"cache_read_input_tokens":600,"output_tokens":10}},"timestamp":"2026-08-01T00:00:05.000Z"}' \
  >> "$hr1_jsonl"
jq . "$hr1_jsonl" >/dev/null

hr2_jsonl="$hr_worktree/sess-hr-2.jsonl"
printf '%s\n' '{"type":"user","message":{"content":"<command-name>/qa-fix</command-name>"}}' \
  >> "$hr2_jsonl"
printf '%s\n' '{"type":"assistant","attributionSkill":"qa-fix","isSidechain":false,"gitBranch":"hit-ratio-fixture","message":{"model":"claude-opus-4-8","usage":{"input_tokens":0,"cache_creation_input_tokens":0,"cache_read_input_tokens":0,"output_tokens":0}}}' \
  >> "$hr2_jsonl"
jq . "$hr2_jsonl" >/dev/null

touch "$hr1_jsonl" "$hr2_jsonl"

OUT_HR=$(
  export DISPATCH_AUDIT_PROJECTS_ROOT="$HR_ROOT"
  export DISPATCH_AUDIT_PROJECT_PREFIX="-home-x"
  bash "$SCRIPT_DIR/aggregate-usage.sh" --days 7
)

assert_eq "hit_ratio: sess-hr-1.started_at populated" "2026-08-01T00:00:00.000Z" \
  "$(jq -r '[.sessions[]|select(.id=="sess-hr-1")][0].started_at' <<<"$OUT_HR")"
assert_eq "hit_ratio: sess-hr-1.hit_ratio == 0.6" "0.6" \
  "$(jq '[.sessions[]|select(.id=="sess-hr-1")][0].hit_ratio' <<<"$OUT_HR")"
assert_eq "hit_ratio: sess-hr-2.hit_ratio is null (divide-by-zero guard)" "null" \
  "$(jq '[.sessions[]|select(.id=="sess-hr-2")][0].hit_ratio' <<<"$OUT_HR")"
assert_eq "hit_ratio: lenses.cache_efficiency.hit_ratio.window == 0.6" "0.6" \
  "$(jq '.lenses.cache_efficiency.hit_ratio.window' <<<"$OUT_HR")"
assert_eq "hit_ratio: lenses.cache_efficiency.hit_ratio.by_phase.implement == 0.6" "0.6" \
  "$(jq '.lenses.cache_efficiency.hit_ratio.by_phase.implement' <<<"$OUT_HR")"
assert_eq 'hit_ratio: lenses.cache_efficiency.hit_ratio.by_phase["qa-fix"] is null (zero-usage phase, divide-by-zero guard)' "null" \
  "$(jq '.lenses.cache_efficiency.hit_ratio.by_phase["qa-fix"]' <<<"$OUT_HR")"

rm -rf "$HR_ROOT"

# ---------------------------------------------------------------------------
# lenses.cache_efficiency.creation_churn (tactic-audit-cache-efficiency-lens).
# ISOLATED fixture, own mktemp root. Three node groups exercise every branch:
#
#   tactic-ce-fixture (3 timestamped siblings, sorted by started_at):
#     sess-ce-a t=:00 usage in=100 cc=1000 cr=0   -> hit_ratio 0        (earliest: baseline, never counted as churned)
#     sess-ce-b t=:05 usage in=100 cc=900  cr=100 -> hit_ratio 100/1100 (staggered, BELOW threshold 0.5 -> churned)
#     sess-ce-c t=:10 usage in=100 cc=100  cr=800 -> hit_ratio 0.8     (staggered, at/above threshold -> NOT churned)
#     -> node_groups_considered +1, staggered_sessions +2 (b,c), churned_sessions +1 (b only)
#
#   tactic-ce-lone (ONE session only, no sibling) -> group length 1, excluded
#     entirely (an unordered singleton proves nothing about cache reuse).
#
#   tactic-ce-notime (two sessions sharing the node, but sess-ce-notime-a
#     carries NO timestamp anywhere in its transcript -> started_at null ->
#     excluded from the candidate list BEFORE grouping, leaving only
#     sess-ce-notime-b -> singleton group -> also excluded).
#
# So across the whole fixture: node_groups_considered == 1, staggered == 2,
# churned == 1, churn_rate == 0.5, churn_price_proxy_usd == sess-ce-b's
# cache_creation (900) priced at RATE_CACHE_CREATION (18.75/Mtok, opus proxy).
# ---------------------------------------------------------------------------

echo ""
echo "--- lenses.cache_efficiency.creation_churn (tactic-audit-cache-efficiency-lens) ---"

CE_ROOT=$(mktemp -d)
trap 'rm -rf "$CE_ROOT" "$FAKE_WRITER_DIR"; teardown' EXIT INT TERM
ce_worktree="$CE_ROOT/-home-x-worktrees-creation-churn-fixture"
mkdir -p "$ce_worktree"

write_ce_session() {
  # write_ce_session <path> <ts-or-empty> <input> <cache_creation> <cache_read>
  local f="$1" ts="$2" in="$3" cc="$4" cr="$5"
  if [[ -n "$ts" ]]; then
    printf '%s\n' "{\"type\":\"user\",\"message\":{\"content\":\"<command-name>/implement</command-name>\"},\"timestamp\":\"$ts\"}" \
      >> "$f"
    printf '%s\n' "{\"type\":\"assistant\",\"attributionSkill\":\"implement\",\"isSidechain\":false,\"gitBranch\":\"creation-churn-fixture\",\"message\":{\"model\":\"claude-opus-4-8\",\"usage\":{\"input_tokens\":$in,\"cache_creation_input_tokens\":$cc,\"cache_read_input_tokens\":$cr,\"output_tokens\":1}},\"timestamp\":\"$ts\"}" \
      >> "$f"
  else
    printf '%s\n' '{"type":"user","message":{"content":"<command-name>/implement</command-name>"}}' \
      >> "$f"
    printf '%s\n' "{\"type\":\"assistant\",\"attributionSkill\":\"implement\",\"isSidechain\":false,\"gitBranch\":\"creation-churn-fixture\",\"message\":{\"model\":\"claude-opus-4-8\",\"usage\":{\"input_tokens\":$in,\"cache_creation_input_tokens\":$cc,\"cache_read_input_tokens\":$cr,\"output_tokens\":1}}}" \
      >> "$f"
  fi
  jq . "$f" >/dev/null
}

write_ce_stamp() {
  # write_ce_stamp <sidecar-path> <session-id> <node-id>
  local f="$1" sid="$2" nid="$3"
  printf '%s\n' "{\"schema\":1,\"session_id\":\"$sid\",\"repo\":\"natb1/commons.systems\",\"issue\":null,\"pr\":null,\"branch\":\"creation-churn-fixture\",\"base_sha\":\"ce\",\"node_id\":\"$nid\",\"stamped_at\":\"2026-08-01T00:00:00Z\"}" \
    > "$f"
  jq . "$f" >/dev/null
}

# tactic-ce-fixture: 3 timestamped siblings.
write_ce_session "$ce_worktree/sess-ce-a.jsonl" "2026-08-01T00:00:00.000Z" 100 1000 0
write_ce_stamp    "$ce_worktree/sess-ce-a.dispatch-stamp.json" sess-ce-a tactic-ce-fixture
write_ce_session "$ce_worktree/sess-ce-b.jsonl" "2026-08-01T00:05:00.000Z" 100 900 100
write_ce_stamp    "$ce_worktree/sess-ce-b.dispatch-stamp.json" sess-ce-b tactic-ce-fixture
write_ce_session "$ce_worktree/sess-ce-c.jsonl" "2026-08-01T00:10:00.000Z" 100 100 800
write_ce_stamp    "$ce_worktree/sess-ce-c.dispatch-stamp.json" sess-ce-c tactic-ce-fixture

# tactic-ce-lone: singleton node, must not contribute.
write_ce_session "$ce_worktree/sess-ce-lone.jsonl" "2026-08-01T00:00:00.000Z" 100 1000 0
write_ce_stamp    "$ce_worktree/sess-ce-lone.dispatch-stamp.json" sess-ce-lone tactic-ce-lone

# tactic-ce-notime: one sibling has NO timestamp at all -> excluded before
# grouping, leaving the other as a singleton -> also excluded.
write_ce_session "$ce_worktree/sess-ce-notime-a.jsonl" "" 100 1000 0
write_ce_stamp    "$ce_worktree/sess-ce-notime-a.dispatch-stamp.json" sess-ce-notime-a tactic-ce-notime
write_ce_session "$ce_worktree/sess-ce-notime-b.jsonl" "2026-08-01T00:00:00.000Z" 100 1000 0
write_ce_stamp    "$ce_worktree/sess-ce-notime-b.dispatch-stamp.json" sess-ce-notime-b tactic-ce-notime

touch "$ce_worktree"/sess-ce-*.jsonl "$ce_worktree"/sess-ce-*.dispatch-stamp.json

OUT_CE=$(
  export DISPATCH_AUDIT_PROJECTS_ROOT="$CE_ROOT"
  export DISPATCH_AUDIT_PROJECT_PREFIX="-home-x"
  bash "$SCRIPT_DIR/aggregate-usage.sh" --days 7
)

EXPECTED_B_HIT=$(jq -n '100/1100')
EXPECTED_CHURN_PRICE=$(jq -n '900 * 18.75 / 1e6')

assert_eq "creation_churn: threshold_hit_ratio == 0.5" "0.5" \
  "$(jq '.lenses.cache_efficiency.creation_churn.threshold_hit_ratio' <<<"$OUT_CE")"
assert_eq "creation_churn: node_groups_considered == 1 (lone + notime nodes excluded)" "1" \
  "$(jq '.lenses.cache_efficiency.creation_churn.node_groups_considered' <<<"$OUT_CE")"
assert_eq "creation_churn: staggered_sessions == 2 (b,c; a is the earliest baseline)" "2" \
  "$(jq '.lenses.cache_efficiency.creation_churn.staggered_sessions' <<<"$OUT_CE")"
assert_eq "creation_churn: churned_sessions == 1 (only b is below threshold)" "1" \
  "$(jq '.lenses.cache_efficiency.creation_churn.churned_sessions' <<<"$OUT_CE")"
assert_eq "creation_churn: churn_rate == 0.5" "0.5" \
  "$(jq '.lenses.cache_efficiency.creation_churn.churn_rate' <<<"$OUT_CE")"
assert_close "creation_churn: churn_price_proxy_usd == sess-ce-b's cache_creation priced" \
  "$EXPECTED_CHURN_PRICE" "$(jq '.lenses.cache_efficiency.creation_churn.churn_price_proxy_usd' <<<"$OUT_CE")"
assert_eq "creation_churn: examples[0].id == sess-ce-b" '"sess-ce-b"' \
  "$(jq '.lenses.cache_efficiency.creation_churn.examples[0].id' <<<"$OUT_CE")"
assert_eq "creation_churn: examples[0].node_id == tactic-ce-fixture" '"tactic-ce-fixture"' \
  "$(jq '.lenses.cache_efficiency.creation_churn.examples[0].node_id' <<<"$OUT_CE")"
assert_close "creation_churn: examples[0].hit_ratio == 100/1100" \
  "$EXPECTED_B_HIT" "$(jq '.lenses.cache_efficiency.creation_churn.examples[0].hit_ratio' <<<"$OUT_CE")"

# --- The SAME fixture at --node scope. -------------------------------------
# Proves the lens CARRIER exists at the scope /rsi reads it from, not only at
# fleet scope: no --day/--days, matching the exact invocation shape /rsi Step 2
# uses (--node <id> only), which also exercises the scoped unbounded window.
#
# The fixture node ids named in these comments are deliberately UN-BACKTICKED:
# they are strings written into this test's own dispatch-stamp files, not graph
# nodes, and a backtick span would read to validate-graph's prose-reference
# check as a dangling node reference.
#
# In-scope: sess-ce-a/b/c under node tactic-ce-fixture, input 100 each with
# (cache_creation, cache_read) of (1000,0), (900,100), (100,800) -> window hit
# ratio 900 / (300 + 2000 + 900). Out of scope and excluded by --node: the
# tactic-ce-lone and tactic-ce-notime groups.
echo ""
echo "--- lenses.cache_efficiency at --node scope (tactic-audit-cache-efficiency-lens) ---"

OUT_CE_NODE=$(
  export DISPATCH_AUDIT_PROJECTS_ROOT="$CE_ROOT"
  export DISPATCH_AUDIT_PROJECT_PREFIX="-home-x"
  bash "$SCRIPT_DIR/aggregate-usage.sh" --node tactic-ce-fixture
)

EXPECTED_CE_NODE_WINDOW=$(jq -n '900/3200')

assert_eq "node scope: lenses.cache_efficiency is present and non-null (tactic-audit-cache-efficiency-lens)" "true" \
  "$(jq '.lenses.cache_efficiency != null' <<<"$OUT_CE_NODE")"
assert_close "node scope: hit_ratio.window == 900/3200, the three in-scope sessions only (tactic-audit-cache-efficiency-lens)" \
  "$EXPECTED_CE_NODE_WINDOW" "$(jq '.lenses.cache_efficiency.hit_ratio.window' <<<"$OUT_CE_NODE")"
assert_eq "node scope: creation_churn.node_groups_considered == 1 (tactic-audit-cache-efficiency-lens)" "1" \
  "$(jq '.lenses.cache_efficiency.creation_churn.node_groups_considered' <<<"$OUT_CE_NODE")"
assert_eq "node scope: creation_churn.staggered_sessions == 2 (tactic-audit-cache-efficiency-lens)" "2" \
  "$(jq '.lenses.cache_efficiency.creation_churn.staggered_sessions' <<<"$OUT_CE_NODE")"
assert_eq "node scope: creation_churn.churned_sessions == 1 (tactic-audit-cache-efficiency-lens)" "1" \
  "$(jq '.lenses.cache_efficiency.creation_churn.churned_sessions' <<<"$OUT_CE_NODE")"
assert_eq "node scope: no out-of-scope node group survived the scope filter (tactic-audit-cache-efficiency-lens)" "0" \
  "$(jq '[.sessions[] | select(.artifact.node_id != "tactic-ce-fixture")] | length' <<<"$OUT_CE_NODE")"
assert_eq "node scope: every selected row carries its own hit_ratio (tactic-audit-cache-efficiency-lens)" "0" \
  "$(jq '[.sessions[] | select(.hit_ratio == null)] | length' <<<"$OUT_CE_NODE")"

rm -rf "$CE_ROOT"

# ---------------------------------------------------------------------------
# lenses.permission_friction (tactic-audit-permission-friction).
# ISOLATED fixture, own mktemp root. Three sessions cover all four markers,
# both discriminators, the back-to-back retry-charge guard, and the negatives.
#
#   sess-pf-1 (launch /implement) — SIGNATURE discriminator, all four markers:
#     ev1  user rejection ("The user doesn't want to proceed with this tool
#          use...") -> next assistant turn in=100 out=10 charged as retry
#     ev2  auto-mode classifier denial -> next assistant turn in=200 out=20
#     ev3  hook refusal ("This session is isolated in the worktree /a/b/c...")
#     ev4  permission-rule denial ("Permission to use Bash has been denied...")
#          ev3 and ev4 are BACK TO BACK, so the single assistant turn that
#          follows (in=300 out=30, and itself carrying the one
#          dangerouslyDisableSandbox:true tool_use) is charged ONCE, not twice.
#     -> user_rejections 1, automode_denials 1, policy_blocks 2,
#        sandbox_overrides 1, events 4
#
#   sess-pf-2 (launch /qa-fix) — LINE-LEVEL discriminator + negatives:
#     a rejection whose result text is the human's own typed reason (no fixed
#     prefix, so the signature discriminator cannot classify it) but whose line
#     carries toolDenialKind:"user-rejected" -> user_rejections 1. It is the
#     LAST message, so nothing follows it and no retry cost is charged — the
#     armed-but-never-fired branch. Also carries an ORDINARY error
#     ("error: File not found /x/y/z") that must land in tool_errors and NOT in
#     the friction lens.
#     -> user_rejections 1, events 1, retry_price_proxy_usd 0
#
#   sess-pf-3 (launch /review-fix) — clean session, no friction at all:
#     -> every count 0, and NOT in sessions_affected.
#
# Window-wide: events 5, user_rejections 2, automode_denials 1,
# policy_blocks 2, sandbox_overrides 1, sessions_affected 2 (pf-1, pf-2).
# retry_price_proxy_usd = price(in=600, out=60) at the opus proxy rates
# (15/Mtok input, 75/Mtok output).
#
# The isolation-refusal signature also LOCKS err_signature's PATH collapse:
# the fixture's literal worktree path must come back as the token PATH, which
# is what merges per-worktree variants of one refusal into a single key.
# ---------------------------------------------------------------------------

echo ""
echo "--- lenses.permission_friction (tactic-audit-permission-friction) ---"

PF_ROOT=$(mktemp -d)
trap 'rm -rf "$PF_ROOT" "$FAKE_WRITER_DIR"; teardown' EXIT INT TERM
pf_worktree="$PF_ROOT/-home-x-worktrees-permission-friction-fixture"
mkdir -p "$pf_worktree"

pf_asst() {
  # pf_asst <path> <input> <output> [extra-content-block-json]
  local f="$1" in="$2" out="$3" extra="${4:-}"
  local blocks='{"type":"text","text":"ok"}'
  if [[ -n "$extra" ]]; then
    blocks="$blocks,$extra"
  fi
  printf '%s\n' "{\"type\":\"assistant\",\"attributionSkill\":\"<none>\",\"isSidechain\":false,\"gitBranch\":\"permission-friction-fixture\",\"message\":{\"model\":\"claude-opus-4-8\",\"content\":[$blocks],\"usage\":{\"input_tokens\":$in,\"cache_creation_input_tokens\":0,\"cache_read_input_tokens\":0,\"output_tokens\":$out}}}" \
    >> "$f"
}

pf1="$pf_worktree/sess-pf-1.jsonl"
printf '%s\n' '{"type":"user","message":{"content":"<command-name>/implement</command-name>"}}' >> "$pf1"

# ev1 — user rejection, signature discriminator (line field also present).
printf '%s\n' '{"type":"user","toolUseResult":"User rejected tool use","message":{"content":[{"type":"tool_result","tool_use_id":"t1","is_error":true,"content":"The user doesn'"'"'t want to proceed with this tool use. The tool use was rejected."}]}}' >> "$pf1"
pf_asst "$pf1" 100 10

# ev2 — auto-mode classifier denial.
printf '%s\n' '{"type":"user","message":{"content":[{"type":"tool_result","tool_use_id":"t2","is_error":true,"content":"Permission for this action was denied by the Claude Code auto mode classifier. Reason: [Irreversible Local Destruction] nope."}]}}' >> "$pf1"
pf_asst "$pf1" 200 20

# ev3 + ev4 — hook refusal then permission-rule denial, back to back.
printf '%s\n' '{"type":"user","message":{"content":[{"type":"tool_result","tool_use_id":"t3","is_error":true,"content":"This session is isolated in the worktree /home/x/worktrees/permission-friction-fixture, but this command is too complex."}]}}' >> "$pf1"
printf '%s\n' '{"type":"user","message":{"content":[{"type":"tool_result","tool_use_id":"t4","is_error":true,"content":"Permission to use Bash has been denied. IMPORTANT: you may attempt other tools."}]}}' >> "$pf1"
pf_asst "$pf1" 300 30 '{"type":"tool_use","id":"t5","name":"Bash","input":{"command":"git status","dangerouslyDisableSandbox":true}}'
jq . "$pf1" >/dev/null

pf2="$pf_worktree/sess-pf-2.jsonl"
printf '%s\n' '{"type":"user","message":{"content":"<command-name>/qa-fix</command-name>"}}' >> "$pf2"
pf_asst "$pf2" 50 5
# Ordinary error — must reach tool_errors, must NOT reach the friction lens.
printf '%s\n' '{"type":"user","message":{"content":[{"type":"tool_result","tool_use_id":"u1","is_error":true,"content":"error: File not found /x/y/z/thing.txt"}]}}' >> "$pf2"
pf_asst "$pf2" 60 6
# Line-level-only rejection, and it is the LAST message: armed, never charged.
printf '%s\n' '{"type":"user","toolDenialKind":"user-rejected","message":{"content":[{"type":"tool_result","tool_use_id":"u2","is_error":true,"content":"stop doing that please"}]}}' >> "$pf2"
jq . "$pf2" >/dev/null

pf3="$pf_worktree/sess-pf-3.jsonl"
printf '%s\n' '{"type":"user","message":{"content":"<command-name>/review-fix</command-name>"}}' >> "$pf3"
pf_asst "$pf3" 70 7
jq . "$pf3" >/dev/null

touch "$pf_worktree"/sess-pf-*.jsonl

OUT_PF=$(
  export DISPATCH_AUDIT_PROJECTS_ROOT="$PF_ROOT"
  export DISPATCH_AUDIT_PROJECT_PREFIX="-home-x"
  bash "$SCRIPT_DIR/aggregate-usage.sh" --days 7
)

EXPECTED_PF_RETRY=$(jq -n '(600 * 15 + 60 * 75) / 1e6')

assert_eq "permission_friction: events == 5" "5" \
  "$(jq '.lenses.permission_friction.events' <<<"$OUT_PF")"
assert_eq "permission_friction: user_rejections == 2 (signature + line-level fallback)" "2" \
  "$(jq '.lenses.permission_friction.user_rejections' <<<"$OUT_PF")"
assert_eq "permission_friction: automode_denials == 1" "1" \
  "$(jq '.lenses.permission_friction.automode_denials' <<<"$OUT_PF")"
assert_eq "permission_friction: policy_blocks == 2 (hook refusal + permission-rule denial)" "2" \
  "$(jq '.lenses.permission_friction.policy_blocks' <<<"$OUT_PF")"
assert_eq "permission_friction: sandbox_overrides == 1 (dangerouslyDisableSandbox tool_use)" "1" \
  "$(jq '.lenses.permission_friction.sandbox_overrides' <<<"$OUT_PF")"
assert_eq "permission_friction: sessions_affected == 2 (clean sess-pf-3 excluded)" "2" \
  "$(jq '.lenses.permission_friction.sessions_affected' <<<"$OUT_PF")"
assert_close "permission_friction: retry_price_proxy_usd charges the following turn once per run of events" \
  "$EXPECTED_PF_RETRY" "$(jq '.lenses.permission_friction.retry_price_proxy_usd' <<<"$OUT_PF")"

assert_eq "permission_friction: top_signatures[0] is the PATH-collapsed isolation refusal" \
  '"This session is isolated in the worktree PATH, but this command is too complex."' \
  "$(jq -c '[.lenses.permission_friction.top_signatures[]|select(.signature|startswith("This session is isolated"))][0].signature' <<<"$OUT_PF")"
assert_eq "permission_friction: ordinary error is NOT a friction signature" "0" \
  "$(jq '[.lenses.permission_friction.top_signatures[]|select(.signature|startswith("error: File not found"))]|length' <<<"$OUT_PF")"
assert_eq "permission_friction: ordinary error IS still a tool_errors signature" "1" \
  "$(jq '[.tool_errors[]|select(.signature|startswith("error: File not found"))]|length' <<<"$OUT_PF")"

assert_eq "permission_friction: sess-pf-1 per-session policy_blocks == 2" "2" \
  "$(jq '[.sessions[]|select(.id=="sess-pf-1")][0].permission_friction.policy_blocks' <<<"$OUT_PF")"
assert_eq "permission_friction: sess-pf-1 per-session sandbox_overrides == 1" "1" \
  "$(jq '[.sessions[]|select(.id=="sess-pf-1")][0].permission_friction.sandbox_overrides' <<<"$OUT_PF")"
assert_eq "permission_friction: sess-pf-2 retry_price_proxy_usd == 0 (armed on the last message, nothing follows)" "0" \
  "$(jq '[.sessions[]|select(.id=="sess-pf-2")][0].permission_friction.retry_price_proxy_usd' <<<"$OUT_PF")"
assert_eq "permission_friction: sess-pf-2 user_rejections == 1 (line-level toolDenialKind fallback)" "1" \
  "$(jq '[.sessions[]|select(.id=="sess-pf-2")][0].permission_friction.user_rejections' <<<"$OUT_PF")"
assert_eq "permission_friction: sess-pf-3 (clean) events == 0" "0" \
  "$(jq '[.sessions[]|select(.id=="sess-pf-3")][0].permission_friction.events' <<<"$OUT_PF")"

rm -rf "$PF_ROOT"


# ---------------------------------------------------------------------------
# PROJECT-DIR PREFIX DISCOVERY (Unit 1). The superseded predicate matched only
# *worktrees* and *--bare project dirs, so every transcript written by a session
# spawned with `--cwd $PROJECT_ROOT` — the whole /rsi and align-phase population
# — landed in the MAIN-checkout project dir and was never scanned, at any scope,
# in any window. Discovery is now a prefix rule: a project dir is in scope when
# its name is exactly $PROJECT_PREFIX, or begins with "$PROJECT_PREFIX-".
#
# ISOLATED fixture root with four project dirs, two in scope and two out:
#   -home-x                exact prefix                     -> IN  (main checkout)
#   -home-x-main-checkout  prefix + "-", and neither
#                          "worktrees" nor "--bare" in the
#                          name                             -> IN  (this one is
#                                                                   the unit's
#                                                                   regression
#                                                                   guard)
#   -home-y-other-project  a different prefix                -> OUT
#   -home-xzz-neighbour    prefix as a bare substring, with
#                          no "-" separator                  -> OUT
# ---------------------------------------------------------------------------

echo ""
echo "--- project-dir prefix discovery (Unit 1) ---"

PREFIX_ROOT=$(mktemp -d)
trap 'rm -rf "$PREFIX_ROOT" "$FAKE_WRITER_DIR"; teardown' EXIT INT TERM

# $1 = project dir, $2 = session id. One classified worker turn with small
# non-zero usage; these assertions are about presence/absence, not magnitude.
prefix_session() {
  mkdir -p "$1"
  printf '%s\n' '{"type":"user","message":{"content":"<command-name>/implement</command-name>"}}' \
    >> "$1/$2.jsonl"
  printf '%s\n' '{"type":"assistant","attributionSkill":"implement","isSidechain":false,"gitBranch":"prefix-fixture","message":{"model":"claude-opus-4-8","usage":{"input_tokens":10,"cache_creation_input_tokens":20,"cache_read_input_tokens":40,"output_tokens":5}}}' \
    >> "$1/$2.jsonl"
  jq . "$1/$2.jsonl" >/dev/null
  touch "$1/$2.jsonl"
}

prefix_session "$PREFIX_ROOT/-home-x"               "sess-exact"
prefix_session "$PREFIX_ROOT/-home-x-main-checkout" "sess-main"
prefix_session "$PREFIX_ROOT/-home-y-other-project" "sess-other"
prefix_session "$PREFIX_ROOT/-home-xzz-neighbour"   "sess-neighbour"

OUT_PREFIX=$(
  export DISPATCH_AUDIT_PROJECTS_ROOT="$PREFIX_ROOT"
  export DISPATCH_AUDIT_PROJECT_PREFIX="-home-x"
  bash "$SCRIPT_DIR/aggregate-usage.sh" --days 7
)

assert_eq "prefix: main-checkout-shaped dir IS scanned (no 'worktrees', no '--bare')" "1" \
  "$(jq '[.sessions[]|select(.id=="sess-main")]|length' <<<"$OUT_PREFIX")"
assert_eq "prefix: dir named EXACTLY the prefix IS scanned" "1" \
  "$(jq '[.sessions[]|select(.id=="sess-exact")]|length' <<<"$OUT_PREFIX")"
assert_eq "prefix: a different-prefix project is NOT scanned" "0" \
  "$(jq '[.sessions[]|select(.id=="sess-other")]|length' <<<"$OUT_PREFIX")"
assert_eq "prefix: prefix-as-substring with no '-' separator is NOT scanned" "0" \
  "$(jq '[.sessions[]|select(.id=="sess-neighbour")]|length' <<<"$OUT_PREFIX")"
assert_eq "prefix: exactly 2 sessions in scope" "2" \
  "$(jq '.sessions|length' <<<"$OUT_PREFIX")"
assert_eq "prefix: window.files_scanned == 2" "2" \
  "$(jq '.window.files_scanned' <<<"$OUT_PREFIX")"
assert_eq "prefix: window.project_prefix is reported" '"-home-x"' \
  "$(jq '.window.project_prefix' <<<"$OUT_PREFIX")"
assert_eq "prefix: window.project_dirs_scanned == 2" "2" \
  "$(jq '.window.project_dirs_scanned' <<<"$OUT_PREFIX")"

rm -rf "$PREFIX_ROOT"

# ---------------------------------------------------------------------------
# RSI FAMILY WHOLE-SESSION RE-KEY (Unit 2). /rsi and /rsi-audit joined
# `worker_skills`, so an /rsi session now types as "worker" and its turns fold
# onto its launch skill instead of sitting in the "<none>" bucket. Modelled on
# the measured worst case: one real /rsi session, 483 turns, 0 of them carrying
# a per-turn `attributionSkill`.
#
# The fixture lives in a main-checkout-shaped dir, which is where the real ones
# live too — the two units compose, and neither alone would surface these turns.
# ---------------------------------------------------------------------------

echo ""
echo "--- rsi family: whole-session re-key (Unit 2) ---"

# Three opus turns: input 1000/100/10, cache_creation 2000/200/20,
# cache_read 4000/400/40, output 500/50/5.
# Sums: input=1110, cache_creation=2220, cache_read=4440, output=555.
# price_proxy_usd uses the uniform Opus-list proxy rates (15 / 18.75 / 1.5 / 75);
# cost_usd uses the truthful opus rates (5 / 6.25 / 0.50 / 25).
EXPECTED_RSI_PRICE=$(jq -n '(1110*15 + 2220*18.75 + 4440*1.5 + 555*75)/1e6')
EXPECTED_RSI_COST=$(jq -n '(1110*5 + 2220*6.25 + 4440*0.50 + 555*25)/1e6')

# $1 = fixture root, $2 = attributionSkill JSON fragment spliced into each
# assistant turn ("" for absent, '"attributionSkill":"rsi",' for tagged). The
# two variants differ ONLY in that fragment, which is what makes the invariance
# comparison below meaningful.
rsi_fixture() {
  local root="$1" tag="$2" dir jsonl
  dir="$root/-home-x-main-checkout"
  mkdir -p "$dir"
  jsonl="$dir/sess-rsi.jsonl"
  printf '%s\n' '{"type":"user","message":{"content":"<command-name>/rsi</command-name>"}}' \
    >> "$jsonl"
  printf '{"type":"assistant",%s"isSidechain":false,"gitBranch":"main","message":{"model":"claude-opus-4-8","usage":{"input_tokens":1000,"cache_creation_input_tokens":2000,"cache_read_input_tokens":4000,"output_tokens":500}}}\n' \
    "$tag" >> "$jsonl"
  printf '{"type":"assistant",%s"isSidechain":false,"gitBranch":"main","message":{"model":"claude-opus-4-8","usage":{"input_tokens":100,"cache_creation_input_tokens":200,"cache_read_input_tokens":400,"output_tokens":50}}}\n' \
    "$tag" >> "$jsonl"
  printf '{"type":"assistant",%s"isSidechain":false,"gitBranch":"main","message":{"model":"claude-opus-4-8","usage":{"input_tokens":10,"cache_creation_input_tokens":20,"cache_read_input_tokens":40,"output_tokens":5}}}\n' \
    "$tag" >> "$jsonl"
  jq . "$jsonl" >/dev/null
  touch "$jsonl"
}

RSI_ROOT=$(mktemp -d)
RSI_TAGGED_ROOT=$(mktemp -d)
trap 'rm -rf "$RSI_ROOT" "$RSI_TAGGED_ROOT" "$FAKE_WRITER_DIR"; teardown' EXIT INT TERM

# Variant A — no per-turn tags at all (the measured worst case).
rsi_fixture "$RSI_ROOT" ""
OUT_RSI=$(
  export DISPATCH_AUDIT_PROJECTS_ROOT="$RSI_ROOT"
  export DISPATCH_AUDIT_PROJECT_PREFIX="-home-x"
  bash "$SCRIPT_DIR/aggregate-usage.sh" --days 7
)

assert_eq "rsi: /rsi session classifies as worker" "worker" \
  "$(jq -r '[.sessions[]|select(.id=="sess-rsi")][0].type' <<<"$OUT_RSI")"
assert_eq "rsi: launch_skill == rsi" "rsi" \
  "$(jq -r '[.sessions[]|select(.id=="sess-rsi")][0].launch_skill' <<<"$OUT_RSI")"
assert_eq "rsi: whole_session_attributed == true (0 per-turn tags)" "true" \
  "$(jq '[.sessions[]|select(.id=="sess-rsi")][0].whole_session_attributed' <<<"$OUT_RSI")"
assert_eq 'rsi: by_phase["rsi"].turns == 3' "3" \
  "$(jq '.by_phase["rsi"].turns' <<<"$OUT_RSI")"
assert_eq 'rsi: by_phase["rsi"].cost_usd' "$EXPECTED_RSI_COST" \
  "$(jq '.by_phase["rsi"].cost_usd' <<<"$OUT_RSI")"
assert_close 'rsi: by_phase["rsi"].price_proxy_usd' "$EXPECTED_RSI_PRICE" \
  "$(jq '.by_phase["rsi"].price_proxy_usd' <<<"$OUT_RSI")"
assert_eq 'rsi: by_phase["<none>"] absorbs none of those turns' "0" \
  "$(jq '(.by_phase["<none>"].turns // 0)' <<<"$OUT_RSI")"

# --- invariance: re-keying is a pure relabel, never a second count -----------
# Variant B is byte-identical to A except every assistant turn carries
# "attributionSkill":"rsi". If the grand totals moved between the two, or if the
# rsi bucket grew while "<none>" held steady, the change would be double
# counting rather than attribution — a refutation, not a partial success.
rsi_fixture "$RSI_TAGGED_ROOT" '"attributionSkill":"rsi",'
OUT_RSI_TAGGED=$(
  export DISPATCH_AUDIT_PROJECTS_ROOT="$RSI_TAGGED_ROOT"
  export DISPATCH_AUDIT_PROJECT_PREFIX="-home-x"
  bash "$SCRIPT_DIR/aggregate-usage.sh" --days 7
)

assert_eq "rsi invariance: totals.turns identical with and without per-turn tags" \
  "$(jq '.totals.turns' <<<"$OUT_RSI_TAGGED")" "$(jq '.totals.turns' <<<"$OUT_RSI")"
assert_eq "rsi invariance: totals.price_proxy_usd identical with and without per-turn tags" \
  "$(jq '.totals.price_proxy_usd' <<<"$OUT_RSI_TAGGED")" "$(jq '.totals.price_proxy_usd' <<<"$OUT_RSI")"
assert_eq 'rsi invariance: by_phase["rsi"].turns identical' \
  "$(jq '.by_phase["rsi"].turns' <<<"$OUT_RSI_TAGGED")" "$(jq '.by_phase["rsi"].turns' <<<"$OUT_RSI")"
assert_eq 'rsi invariance: by_phase["rsi"].price_proxy_usd identical' \
  "$(jq '.by_phase["rsi"].price_proxy_usd' <<<"$OUT_RSI_TAGGED")" "$(jq '.by_phase["rsi"].price_proxy_usd' <<<"$OUT_RSI")"
assert_eq 'rsi invariance: everything that left "<none>" arrived in rsi (bucket == totals)' \
  "$(jq '.totals.price_proxy_usd' <<<"$OUT_RSI")" "$(jq '.by_phase["rsi"].price_proxy_usd' <<<"$OUT_RSI")"

rm -rf "$RSI_ROOT" "$RSI_TAGGED_ROOT"

# ---------------------------------------------------------------------------
# MULTI-PHASE GUARD (Unit 2). A session launched by /align that ALSO carries
# per-turn "rsi" attributions exists in the wild (one real session: 248 align
# turns + 101 rsi turns). Adding rsi to worker_skills makes "rsi" count toward
# $tagged_phase_skills, so that session now has TWO distinct phase skills and
# must NOT be folded whole — per-turn attribution has to survive.
# ---------------------------------------------------------------------------

echo ""
echo "--- rsi family: multi-phase guard keeps per-turn attribution (Unit 2) ---"

RSI_MP_ROOT=$(mktemp -d)
trap 'rm -rf "$RSI_MP_ROOT" "$FAKE_WRITER_DIR"; teardown' EXIT INT TERM
rsi_mp_dir="$RSI_MP_ROOT/-home-x-main-checkout"
mkdir -p "$rsi_mp_dir"
rsi_mp_jsonl="$rsi_mp_dir/sess-rsi-mp.jsonl"
printf '%s\n' '{"type":"user","message":{"content":"<command-name>/align</command-name>"}}' \
  >> "$rsi_mp_jsonl"
printf '%s\n' '{"type":"assistant","attributionSkill":"align","isSidechain":false,"gitBranch":"main","message":{"model":"claude-opus-4-8","usage":{"input_tokens":100,"cache_creation_input_tokens":0,"cache_read_input_tokens":0,"output_tokens":0}}}' \
  >> "$rsi_mp_jsonl"
printf '%s\n' '{"type":"assistant","attributionSkill":"rsi","isSidechain":false,"gitBranch":"main","message":{"model":"claude-opus-4-8","usage":{"input_tokens":100,"cache_creation_input_tokens":0,"cache_read_input_tokens":0,"output_tokens":0}}}' \
  >> "$rsi_mp_jsonl"
printf '%s\n' '{"type":"assistant","isSidechain":false,"gitBranch":"main","message":{"model":"claude-opus-4-8","usage":{"input_tokens":100,"cache_creation_input_tokens":0,"cache_read_input_tokens":0,"output_tokens":0}}}' \
  >> "$rsi_mp_jsonl"
jq . "$rsi_mp_jsonl" >/dev/null
touch "$rsi_mp_jsonl"

OUT_RSI_MP=$(
  export DISPATCH_AUDIT_PROJECTS_ROOT="$RSI_MP_ROOT"
  export DISPATCH_AUDIT_PROJECT_PREFIX="-home-x"
  bash "$SCRIPT_DIR/aggregate-usage.sh" --days 7
)

assert_eq "rsi multi-phase: whole_session_attributed == false" "false" \
  "$(jq '[.sessions[]|select(.id=="sess-rsi-mp")][0].whole_session_attributed' <<<"$OUT_RSI_MP")"
# multi_phase_worker is a stage-1 row flag; the document surfaces it as the
# attribution_coverage counter rather than a per-session field.
assert_eq "rsi multi-phase: attribution_coverage.multi_phase_worker_sessions == 1" "1" \
  "$(jq '.attribution_coverage.multi_phase_worker_sessions' <<<"$OUT_RSI_MP")"
assert_eq 'rsi multi-phase: by_phase["align"].turns == 1 (kept per-turn)' "1" \
  "$(jq '.by_phase["align"].turns' <<<"$OUT_RSI_MP")"
assert_eq 'rsi multi-phase: by_phase["rsi"].turns == 1 (kept per-turn)' "1" \
  "$(jq '.by_phase["rsi"].turns' <<<"$OUT_RSI_MP")"
assert_eq 'rsi multi-phase: by_phase["<none>"].turns == 1 (untagged turn NOT folded)' "1" \
  "$(jq '.by_phase["<none>"].turns' <<<"$OUT_RSI_MP")"

rm -rf "$RSI_MP_ROOT"

# ---------------------------------------------------------------------------
# ALTERNATION ORDERING (Unit 2). "rsi" precedes "rsi-audit" in worker_skills, so
# the alternation offers the shorter branch first. The trailing
# "</command-name>" literal is what forces the engine to backtrack and take
# "rsi-audit" — the same reason "align" and "align-tactics" already coexist. If
# that reasoning were wrong, launch_skill here would come back as "rsi".
# ---------------------------------------------------------------------------

echo ""
echo "--- rsi family: /rsi-audit wins the alternation over /rsi (Unit 2) ---"

RSI_AUDIT_ROOT=$(mktemp -d)
trap 'rm -rf "$RSI_AUDIT_ROOT" "$FAKE_WRITER_DIR"; teardown' EXIT INT TERM
rsi_audit_dir="$RSI_AUDIT_ROOT/-home-x-main-checkout"
mkdir -p "$rsi_audit_dir"
rsi_audit_jsonl="$rsi_audit_dir/sess-rsi-audit.jsonl"
printf '%s\n' '{"type":"user","message":{"content":"<command-name>/rsi-audit</command-name>"}}' \
  >> "$rsi_audit_jsonl"
printf '%s\n' '{"type":"assistant","isSidechain":false,"gitBranch":"main","message":{"model":"claude-opus-4-8","usage":{"input_tokens":100,"cache_creation_input_tokens":0,"cache_read_input_tokens":0,"output_tokens":0}}}' \
  >> "$rsi_audit_jsonl"
printf '%s\n' '{"type":"assistant","isSidechain":false,"gitBranch":"main","message":{"model":"claude-opus-4-8","usage":{"input_tokens":100,"cache_creation_input_tokens":0,"cache_read_input_tokens":0,"output_tokens":0}}}' \
  >> "$rsi_audit_jsonl"
jq . "$rsi_audit_jsonl" >/dev/null
touch "$rsi_audit_jsonl"

OUT_RSI_AUDIT=$(
  export DISPATCH_AUDIT_PROJECTS_ROOT="$RSI_AUDIT_ROOT"
  export DISPATCH_AUDIT_PROJECT_PREFIX="-home-x"
  bash "$SCRIPT_DIR/aggregate-usage.sh" --days 7
)

assert_eq "rsi-audit: launch_skill == rsi-audit (not the shorter 'rsi' branch)" "rsi-audit" \
  "$(jq -r '[.sessions[]|select(.id=="sess-rsi-audit")][0].launch_skill' <<<"$OUT_RSI_AUDIT")"
assert_eq 'rsi-audit: by_phase has "rsi-audit" with 2 turns and no "rsi" key' "true" \
  "$(jq '(.by_phase["rsi-audit"].turns == 2) and (.by_phase | has("rsi") | not)' <<<"$OUT_RSI_AUDIT")"

rm -rf "$RSI_AUDIT_ROOT"

# ---------------------------------------------------------------------------
# --node sidecar-coverage accounting (tactic-supersession-edge-and-terminal,
# PR3 Unit 2): three worker sessions in one fixture tree —
# sess-cov-node-a (sidecar node_id==fixture-cov-node, the target),
# sess-cov-node-b (no sidecar at all), sess-cov-node-c (sidecar node_id==
# fixture-cov-other, a DIFFERENT node). Three runs over the SAME tree exercise
# fleet scope (regression guard: Unit 1 must change nothing there), --node
# scope with stamping partly broken (both drop reasons distinguishable), and
# --node scope with total stamping failure (the case this tactic exists to
# make legible — an empty node must not read the same as a node whose
# sessions were dropped for want of a stamp).
#
# Trap: write_min_session stamps /file-issue, which is NOT in worker_skills,
# so every session below is built with an inline printf using a REAL worker
# command instead (/qa-fix) — a sidecar_eligible assertion over a
# write_min_session fixture would read 0 for the wrong reason (type mismatch,
# not the bug under test).
#
# ISOLATED fixture: own mktemp -d root, own trap, own
# DISPATCH_AUDIT_PROJECT_PREFIX="-home-x" (required — only project dirs named
# "-home-x" or "-home-x-*" are scanned).
# ---------------------------------------------------------------------------

echo ""
echo "--- --node sidecar-coverage accounting: drop-reason counters + measurability flag ---"

COVNODE_ROOT=$(mktemp -d)
trap 'rm -rf "$COVNODE_ROOT" "$FAKE_WRITER_DIR"; teardown' EXIT INT TERM
covnode_worktree="$COVNODE_ROOT/-home-x-worktrees-cov-node"
mkdir -p "$covnode_worktree"

# Three real-worker-command transcripts (first line classifies as worker via
# the /qa-fix alternation entry).
for s in a b c; do
  covnode_jsonl="$covnode_worktree/sess-cov-node-$s.jsonl"
  printf '%s\n' '{"type":"user","message":{"content":"<command-name>/qa-fix</command-name>"}}' \
    >> "$covnode_jsonl"
  printf '%s\n' '{"type":"assistant","attributionSkill":"plan-implement","isSidechain":false,"gitBranch":"cov-node","message":{"model":"claude-opus-4-8","usage":{"input_tokens":0,"cache_creation_input_tokens":0,"cache_read_input_tokens":0,"output_tokens":0}}}' \
    >> "$covnode_jsonl"
  jq . "$covnode_jsonl" >/dev/null
  touch "$covnode_jsonl"
done

# sess-cov-node-a: stamped for the target node.
printf '%s\n' '{"schema":1,"session_id":"sess-cov-node-a","repo":"natb1/commons.systems","issue":null,"pr":null,"branch":"cov-node","base_sha":"aaa111","node_id":"fixture-cov-node","stamped_at":"2026-01-01T00:00:00Z"}' \
  > "$covnode_worktree/sess-cov-node-a.dispatch-stamp.json"
jq . "$covnode_worktree/sess-cov-node-a.dispatch-stamp.json" >/dev/null

# sess-cov-node-b: NO sidecar at all — the unstamped drop.

# sess-cov-node-c: stamped, but for a DIFFERENT node — the other-node drop.
printf '%s\n' '{"schema":1,"session_id":"sess-cov-node-c","repo":"natb1/commons.systems","issue":null,"pr":null,"branch":"cov-node","base_sha":"ccc333","node_id":"fixture-cov-other","stamped_at":"2026-01-01T00:00:00Z"}' \
  > "$covnode_worktree/sess-cov-node-c.dispatch-stamp.json"
jq . "$covnode_worktree/sess-cov-node-c.dispatch-stamp.json" >/dev/null

# (1) fleet scope: regression guard that Unit 1 changed nothing at fleet scope.
OUT_COVNODE_FLEET=$(
  export DISPATCH_AUDIT_PROJECTS_ROOT="$COVNODE_ROOT"
  export DISPATCH_AUDIT_PROJECT_PREFIX="-home-x"
  bash "$SCRIPT_DIR/aggregate-usage.sh" --days 7
)
EXPECTED_COVNODE_RATE=$(jq -n '2/3')
assert_eq "covnode fleet: window.sidecar_eligible == 3" "3" \
  "$(jq '.window.sidecar_eligible' <<<"$OUT_COVNODE_FLEET")"
assert_eq "covnode fleet: window.sidecar_present == 2" "2" \
  "$(jq '.window.sidecar_present' <<<"$OUT_COVNODE_FLEET")"
assert_eq "covnode fleet: window.sidecar_present_rate == 2/3" "$EXPECTED_COVNODE_RATE" \
  "$(jq '.window.sidecar_present_rate' <<<"$OUT_COVNODE_FLEET")"
assert_eq "covnode fleet: window.sidecar_coverage_measurable == true" "true" \
  "$(jq '.window.sidecar_coverage_measurable' <<<"$OUT_COVNODE_FLEET")"
assert_eq "covnode fleet: window.scope_filter_dropped_unstamped == 0" "0" \
  "$(jq '.window.scope_filter_dropped_unstamped' <<<"$OUT_COVNODE_FLEET")"
assert_eq "covnode fleet: window.scope_filter_dropped_other_node == 0" "0" \
  "$(jq '.window.scope_filter_dropped_other_node' <<<"$OUT_COVNODE_FLEET")"

# (2) --node fixture-cov-node, stamping partly broken: sess-cov-node-b (no
# sidecar) and sess-cov-node-c (sidecar names a different node) are both
# dropped before $sessions, distinguishably.
OUT_COVNODE_PARTIAL=$(
  export DISPATCH_AUDIT_PROJECTS_ROOT="$COVNODE_ROOT"
  export DISPATCH_AUDIT_PROJECT_PREFIX="-home-x"
  bash "$SCRIPT_DIR/aggregate-usage.sh" --days 7 --node fixture-cov-node
)
assert_eq "covnode partial: files_scanned == 1" "1" \
  "$(jq '.window.files_scanned' <<<"$OUT_COVNODE_PARTIAL")"
assert_eq "covnode partial: window.sidecar_coverage_measurable == false" "false" \
  "$(jq '.window.sidecar_coverage_measurable' <<<"$OUT_COVNODE_PARTIAL")"
assert_eq "covnode partial: window.scope_filter_dropped_unstamped == 1 (sess-cov-node-b)" "1" \
  "$(jq '.window.scope_filter_dropped_unstamped' <<<"$OUT_COVNODE_PARTIAL")"
assert_eq "covnode partial: window.scope_filter_dropped_other_node == 1 (sess-cov-node-c)" "1" \
  "$(jq '.window.scope_filter_dropped_other_node' <<<"$OUT_COVNODE_PARTIAL")"
# sidecar_present_rate reads 1 here NOT because coverage is healthy, but
# because --node's own gate already required a sidecar to admit
# sess-cov-node-a into $sessions at all — present==eligible by construction.
# This is the structural artefact sidecar_coverage_measurable exists to flag,
# not a genuine 100% coverage reading.
assert_eq "covnode partial: window.sidecar_present_rate == 1 (structural, see comment)" "1" \
  "$(jq '.window.sidecar_present_rate' <<<"$OUT_COVNODE_PARTIAL")"

# (3) --node fixture-cov-node with sess-cov-node-a's own sidecar ALSO deleted:
# total stamping failure. files_scanned drops to 0 — the case this tactic
# exists to distinguish from a genuinely empty/quiet node.
rm -f "$covnode_worktree/sess-cov-node-a.dispatch-stamp.json"
COVNODE_STDERR="$COVNODE_ROOT/stderr-total-failure.log"
OUT_COVNODE_TOTAL=$(
  export DISPATCH_AUDIT_PROJECTS_ROOT="$COVNODE_ROOT"
  export DISPATCH_AUDIT_PROJECT_PREFIX="-home-x"
  bash "$SCRIPT_DIR/aggregate-usage.sh" --days 7 --node fixture-cov-node 2>"$COVNODE_STDERR"
)
assert_eq "covnode total-failure: files_scanned == 0" "0" \
  "$(jq '.window.files_scanned' <<<"$OUT_COVNODE_TOTAL")"
assert_eq "covnode total-failure: window.sidecar_present_rate is null" "null" \
  "$(jq '.window.sidecar_present_rate' <<<"$OUT_COVNODE_TOTAL")"
assert_eq "covnode total-failure: window.sidecar_coverage_measurable == false" "false" \
  "$(jq '.window.sidecar_coverage_measurable' <<<"$OUT_COVNODE_TOTAL")"
assert_eq "covnode total-failure: window.scope_filter_dropped_unstamped == 2 (a and b)" "2" \
  "$(jq '.window.scope_filter_dropped_unstamped' <<<"$OUT_COVNODE_TOTAL")"
# This is the distinguishing assertion: files_scanned==0 alone reads exactly
# like a genuinely empty node. The stderr diagnostic + the drop counter above
# are what tell them apart — the point of the whole tactic.
if grep -q "fixture-cov-node" "$COVNODE_STDERR" 2>/dev/null; then
  covnode_stderr_names_node="true"
else
  covnode_stderr_names_node="false"
fi
assert_eq "covnode total-failure: stderr diagnostic names the node id" "true" \
  "$covnode_stderr_names_node"
if grep -q "2 candidate transcript" "$COVNODE_STDERR" 2>/dev/null; then
  covnode_stderr_names_count="true"
else
  covnode_stderr_names_count="false"
fi
assert_eq "covnode total-failure: stderr diagnostic names the drop count (2)" "true" \
  "$covnode_stderr_names_count"

rm -rf "$COVNODE_ROOT"

# ---------------------------------------------------------------------------
# lenses.review_effort_yield + the .sessions[].review_runs mirror
# (tactic-audit-review-effort-yield-lens).
#
# Five sessions cover the split, the price-proxy attribution rule, and both
# negative guards:
#
#   sess-ry-a — TWO runs at the SAME effort (medium). The single-effort case:
#     its whole price_proxy_usd is attributable to the medium bucket.
#   sess-ry-b — runs at TWO DIFFERENT efforts (low, high). It contributes a run
#     to BOTH buckets but its proxy to NEITHER, and raises sessions_mixed_effort.
#   sess-ry-c — ONE run (low). The per-run field-fidelity case, and the only
#     all-low session, so low's price_proxy_usd_single_effort is exactly its
#     proxy — proving sess-ry-b's proxy was not divided in.
#   sess-ry-d — FALSE-POSITIVE guard: dispatch-code-review's real in-flight poll
#     block. It prints effort= but spells its version key run_version= and has no
#     touched_files_count=, so the three-key shape anchor must reject it.
#   sess-ry-e — STRICT-VALIDATION guard: full three-key shape, non-numeric
#     touched_files_count. The run is DROPPED, never coerced to 0 (a fabricated
#     0-touched run would drag high's median down).
#
# high therefore has runs 1 / sessions 1 but price_proxy_usd_single_effort 0 and
# sessions_single_effort 0 — the mixed session is its only contributor.
#
# A second, EMPTY root proves a window with no review runs reports runs == 0 and
# by_effort {} rather than a fabricated zero bucket.
#
# ISOLATED fixture: own mktemp -d roots, own trap, own
# DISPATCH_AUDIT_PROJECT_PREFIX="-home-x" (required — only project dirs named
# "-home-x" or "-home-x-*" are scanned).
# ---------------------------------------------------------------------------

echo ""
echo "--- lenses.review_effort_yield (tactic-audit-review-effort-yield-lens) ---"

RY_ROOT=$(mktemp -d)
RY_NONE_ROOT=$(mktemp -d)
trap 'rm -rf "$RY_ROOT" "$RY_NONE_ROOT" "$FAKE_WRITER_DIR"; teardown' EXIT INT TERM
ry_worktree="$RY_ROOT/-home-x-worktrees-review-yield"
mkdir -p "$ry_worktree"

ry_summary_block() {
  # ry_summary_block <effort> <model> <wall_clock_s> <touched_files_count>
  # A byte-faithful copy of dispatch-code-review's Step 7 field list — the block
  # it writes to $SUMMARY_FILE and cats to stdout. Field order and spelling are
  # the parsing contract that script's own comment declares.
  printf 'status=ok\nexit_code=0\ncache_version=7\nout_dir=/tmp/cr/out\ntarget=PR 3001\ntarget_base_sha=1111111\ntarget_head_sha=2222222\nhead_sha=2222222\neffort=%s\nmodel=%s\ncomment=--no-comment\nwall_clock_s=%s\nfindings_path=/tmp/cr/out/output.txt\npatch_path=/tmp/cr/out/patch.diff\ntouched_files_count=%s\ntouched_file=a.ts\ntouched_file=b.ts\n' \
    "$1" "$2" "$3" "$4"
}

ry_write_session() {
  # ry_write_session <path> <input_tokens> <output_tokens>
  local f="$1" rin="$2" rout="$3"
  printf '%s\n' '{"type":"user","message":{"content":"<command-name>/review-fix</command-name>"}}' \
    >> "$f"
  printf '%s\n' "{\"type\":\"assistant\",\"attributionSkill\":\"review-fix\",\"isSidechain\":false,\"gitBranch\":\"review-yield\",\"message\":{\"model\":\"claude-opus-4-8\",\"usage\":{\"input_tokens\":$rin,\"cache_creation_input_tokens\":0,\"cache_read_input_tokens\":0,\"output_tokens\":$rout}}}" \
    >> "$f"
}

ry_add_tool_result() {
  # ry_add_tool_result <path> <literal block text> — jq escapes the newlines so
  # the block reaches .content byte-exact, the same idiom the outcome-envelope
  # fixtures use.
  jq -nc --arg c "$2" '{type:"user",message:{content:[{type:"tool_result",content:$c}]}}' \
    >> "$1"
}

ry_a="$ry_worktree/sess-ry-a.jsonl"
ry_write_session "$ry_a" 1000 100
ry_add_tool_result "$ry_a" "$(ry_summary_block medium claude-opus-4-8 300 4)"
ry_add_tool_result "$ry_a" "$(ry_summary_block medium claude-opus-4-8 500 10)"

ry_b="$ry_worktree/sess-ry-b.jsonl"
ry_write_session "$ry_b" 2000 200
ry_add_tool_result "$ry_b" "$(ry_summary_block low claude-sonnet-4-6 100 1)"
ry_add_tool_result "$ry_b" "$(ry_summary_block high claude-opus-4-8 600 9)"

ry_c="$ry_worktree/sess-ry-c.jsonl"
ry_write_session "$ry_c" 3000 300
ry_add_tool_result "$ry_c" "$(ry_summary_block low claude-sonnet-4-6 200 5)"

ry_d="$ry_worktree/sess-ry-d.jsonl"
ry_write_session "$ry_d" 10 1
ry_add_tool_result "$ry_d" "$(printf 'status=running\nrun_version=7\nrun_id=k\npid=99\nelapsed_s=10\ndeadline_s=100\ntarget=PR 3001\neffort=high\n')"

ry_e="$ry_worktree/sess-ry-e.jsonl"
ry_write_session "$ry_e" 10 1
ry_add_tool_result "$ry_e" "$(ry_summary_block high claude-opus-4-8 700 n/a)"

for ry_f in "$ry_worktree"/sess-ry-*.jsonl; do
  jq . "$ry_f" >/dev/null
done
touch "$ry_worktree"/sess-ry-*.jsonl

OUT_RY=$(
  export DISPATCH_AUDIT_PROJECTS_ROOT="$RY_ROOT"
  export DISPATCH_AUDIT_PROJECT_PREFIX="-home-x"
  bash "$SCRIPT_DIR/aggregate-usage.sh" --days 7
)

# Expected magnitudes are DERIVED — the proxy rates come from price-model.json
# (the aggregator's own single source) and the medians from jq -n, never from a
# hardcoded decimal literal.
RY_PRICE_MODEL=$(cat "$SCRIPT_DIR/price-model.json")
EXPECTED_RY_A_PROXY=$(jq -n --argjson p "$RY_PRICE_MODEL" '(1000*$p.input + 100*$p.output)/1e6')
EXPECTED_RY_C_PROXY=$(jq -n --argjson p "$RY_PRICE_MODEL" '(3000*$p.input + 300*$p.output)/1e6')
EXPECTED_RY_MED_TOUCHED=$(jq -n '(4+10)/2')
EXPECTED_RY_MED_WALL=$(jq -n '(300+500)/2')

RY_C_RUNS='[ .sessions[] | select(.id=="sess-ry-c") ][0].review_runs'
RY_LENS='.lenses.review_effort_yield'

assert_eq "review_runs mirror: sess-ry-c carries exactly one run" "1" \
  "$(jq "$RY_C_RUNS | length" <<<"$OUT_RY")"
assert_eq "review_runs mirror: sess-ry-c run effort" '"low"' \
  "$(jq "$RY_C_RUNS[0].effort" <<<"$OUT_RY")"
assert_eq "review_runs mirror: sess-ry-c run model" '"claude-sonnet-4-6"' \
  "$(jq "$RY_C_RUNS[0].model" <<<"$OUT_RY")"
assert_eq "review_runs mirror: sess-ry-c run wall_clock_s" "200" \
  "$(jq "$RY_C_RUNS[0].wall_clock_s" <<<"$OUT_RY")"
assert_eq "review_runs mirror: sess-ry-c run touched_files_count" "5" \
  "$(jq "$RY_C_RUNS[0].touched_files_count" <<<"$OUT_RY")"

assert_eq "review_effort_yield: medium.runs == 2 (sess-ry-a's two same-effort runs)" "2" \
  "$(jq "$RY_LENS.by_effort.medium.runs" <<<"$OUT_RY")"
assert_eq "review_effort_yield: medium.sessions == 1" "1" \
  "$(jq "$RY_LENS.by_effort.medium.sessions" <<<"$OUT_RY")"
assert_eq "review_effort_yield: medium.touched_files_total == 4+10" "14" \
  "$(jq "$RY_LENS.by_effort.medium.touched_files_total" <<<"$OUT_RY")"
assert_eq "review_effort_yield: medium.touched_files_median == median(4,10)" \
  "$EXPECTED_RY_MED_TOUCHED" "$(jq "$RY_LENS.by_effort.medium.touched_files_median" <<<"$OUT_RY")"
assert_eq "review_effort_yield: medium.wall_clock_s_total == 300+500" "800" \
  "$(jq "$RY_LENS.by_effort.medium.wall_clock_s_total" <<<"$OUT_RY")"
assert_eq "review_effort_yield: medium.wall_clock_s_median == median(300,500)" \
  "$EXPECTED_RY_MED_WALL" "$(jq "$RY_LENS.by_effort.medium.wall_clock_s_median" <<<"$OUT_RY")"
assert_eq "review_effort_yield: medium.by_model counts the runs, not the sessions" \
  '{"claude-opus-4-8":2}' "$(jq -c "$RY_LENS.by_effort.medium.by_model" <<<"$OUT_RY")"
# The tolerance compare runs INSIDE jq rather than through assert_close: that
# helper feeds the actual to `jq --argjson a`, and an absent field arrives as
# null, where `$e - null` is a jq ERROR that would abort the whole suite under
# `set -e` instead of reporting a failure. Comparing in jq makes an absent field
# report false — a clean FAIL — and asserts the field is a number at all.
assert_eq "review_effort_yield: medium.price_proxy_usd_single_effort == sess-ry-a's proxy (within 1e-9)" "true" \
  "$(jq --argjson e "$EXPECTED_RY_A_PROXY" \
       '.lenses.review_effort_yield.by_effort.medium.price_proxy_usd_single_effort as $a
        | ($a | type) == "number"
          and ((($e - $a) | if . < 0 then -. else . end) < 1e-9)' <<<"$OUT_RY")"
assert_eq "review_effort_yield: medium.sessions_single_effort == 1" "1" \
  "$(jq "$RY_LENS.by_effort.medium.sessions_single_effort" <<<"$OUT_RY")"

assert_eq "review_effort_yield: low.runs == 2 (sess-ry-b's low run + sess-ry-c)" "2" \
  "$(jq "$RY_LENS.by_effort.low.runs" <<<"$OUT_RY")"
assert_eq "review_effort_yield: low.sessions == 2 (mixed session counted here)" "2" \
  "$(jq "$RY_LENS.by_effort.low.sessions" <<<"$OUT_RY")"
assert_eq "review_effort_yield: low.price_proxy_usd_single_effort == sess-ry-c's proxy ONLY, within 1e-9 (mixed sess-ry-b not divided in)" "true" \
  "$(jq --argjson e "$EXPECTED_RY_C_PROXY" \
       '.lenses.review_effort_yield.by_effort.low.price_proxy_usd_single_effort as $a
        | ($a | type) == "number"
          and ((($e - $a) | if . < 0 then -. else . end) < 1e-9)' <<<"$OUT_RY")"
assert_eq "review_effort_yield: low.sessions_single_effort == 1" "1" \
  "$(jq "$RY_LENS.by_effort.low.sessions_single_effort" <<<"$OUT_RY")"

assert_eq "review_effort_yield: high.runs == 1 (from the mixed session)" "1" \
  "$(jq "$RY_LENS.by_effort.high.runs" <<<"$OUT_RY")"
assert_eq "review_effort_yield: high.sessions == 1" "1" \
  "$(jq "$RY_LENS.by_effort.high.sessions" <<<"$OUT_RY")"
assert_eq "review_effort_yield: high.price_proxy_usd_single_effort == 0 (its only session is mixed)" "0" \
  "$(jq "$RY_LENS.by_effort.high.price_proxy_usd_single_effort" <<<"$OUT_RY")"
assert_eq "review_effort_yield: high.sessions_single_effort == 0" "0" \
  "$(jq "$RY_LENS.by_effort.high.sessions_single_effort" <<<"$OUT_RY")"

assert_eq "review_effort_yield: sessions_mixed_effort == 1 (sess-ry-b)" "1" \
  "$(jq "$RY_LENS.sessions_mixed_effort" <<<"$OUT_RY")"
assert_eq "review_effort_yield: runs == 5 (2+2+1; the two guard sessions add none)" "5" \
  "$(jq "$RY_LENS.runs" <<<"$OUT_RY")"
assert_eq "review_effort_yield: sessions_affected == 3" "3" \
  "$(jq "$RY_LENS.sessions_affected" <<<"$OUT_RY")"

assert_eq "review_effort_yield: false-positive guard — in-flight poll block (effort= only) yields NO run" "0" \
  "$(jq '[ .sessions[] | select(.id=="sess-ry-d") ][0].review_runs | length' <<<"$OUT_RY")"
assert_eq "review_effort_yield: strict-validation guard — non-numeric touched_files_count yields NO run" "0" \
  "$(jq '[ .sessions[] | select(.id=="sess-ry-e") ][0].review_runs | length' <<<"$OUT_RY")"
assert_eq "review_effort_yield: by_effort keys are exactly the three real efforts (no guard bucket)" \
  '["high","low","medium"]' "$(jq -c "$RY_LENS.by_effort | keys" <<<"$OUT_RY")"

assert_eq "review_effort_yield: findings_axis_measurable == false (hardcoded honest constant)" "false" \
  "$(jq "$RY_LENS.findings_axis_measurable" <<<"$OUT_RY")"
assert_eq "review_effort_yield: findings_axis_note is a non-empty string" "true" \
  "$(jq "($RY_LENS.findings_axis_note | type) == \"string\" and ($RY_LENS.findings_axis_note | length) > 0" <<<"$OUT_RY")"

# Empty window: no review runs anywhere.
ry_none_worktree="$RY_NONE_ROOT/-home-x-worktrees-review-yield-none"
mkdir -p "$ry_none_worktree"
ry_none="$ry_none_worktree/sess-ry-none.jsonl"
ry_write_session "$ry_none" 10 1
jq . "$ry_none" >/dev/null
touch "$ry_none"

OUT_RY_NONE=$(
  export DISPATCH_AUDIT_PROJECTS_ROOT="$RY_NONE_ROOT"
  export DISPATCH_AUDIT_PROJECT_PREFIX="-home-x"
  bash "$SCRIPT_DIR/aggregate-usage.sh" --days 7
)

assert_eq "review_effort_yield: window with no review runs -> runs == 0" "0" \
  "$(jq "$RY_LENS.runs" <<<"$OUT_RY_NONE")"
assert_eq "review_effort_yield: window with no review runs -> sessions_affected == 0" "0" \
  "$(jq "$RY_LENS.sessions_affected" <<<"$OUT_RY_NONE")"
assert_eq "review_effort_yield: window with no review runs -> sessions_mixed_effort == 0" "0" \
  "$(jq "$RY_LENS.sessions_mixed_effort" <<<"$OUT_RY_NONE")"
assert_eq "review_effort_yield: window with no review runs -> by_effort == {} (NOT a fabricated zero bucket)" \
  "{}" "$(jq -c "$RY_LENS.by_effort" <<<"$OUT_RY_NONE")"

rm -rf "$RY_ROOT" "$RY_NONE_ROOT"

report_results
exit $FAIL
