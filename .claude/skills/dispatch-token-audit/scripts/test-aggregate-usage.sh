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
WORKER_ENV_JSON='{"schema":"dispatch.outcome.v1","phase":"review","repo":"natb1/commons.systems","issue":999,"pr":1234,"base_sha":"abc123","findings_surfaced":8,"findings_actionable":5,"fixes_applied":3,"followups_filed":2,"subagents_launched":12,"disposition":"completed_with_fixes","terminated_reason":null}'
ROUTER_ENV_JSON='{"schema":"dispatch.outcome.v1","phase":"qa","repo":"natb1/commons.systems","issue":999,"pr":1234,"base_sha":null,"findings_surfaced":0,"findings_actionable":0,"fixes_applied":0,"followups_filed":0,"subagents_launched":0,"disposition":"completed","terminated_reason":null}'
SUBAGENT_ENV_JSON='{"schema":"dispatch.outcome.v1","phase":"review","repo":"natb1/commons.systems","issue":999,"pr":1234,"base_sha":"def456","findings_surfaced":1000,"findings_actionable":1000,"fixes_applied":1000,"followups_filed":1000,"subagents_launched":1000,"disposition":"escalated","terminated_reason":"subagent excluded"}'
envelope_block() { printf '<!-- dispatch:outcome:v1 -->\n```json\n%s\n```' "$1"; }
WORKER_BLOCK="$(envelope_block "$WORKER_ENV_JSON")"
ROUTER_BLOCK="$(envelope_block "$ROUTER_ENV_JSON")"
SUBAGENT_BLOCK="$(envelope_block "$SUBAGENT_ENV_JSON")"

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

  # line 7: outcome-envelope tool_result (#1860). tool_use_id toolu_001 maps to a
  # Bash tool_use, so its bytes land in the Bash payload bucket. Built with jq so
  # the multi-line block is correctly JSON-escaped in .content.
  jq -nc --arg c "$WORKER_BLOCK" \
    '{type:"user",message:{content:[{type:"tool_result",tool_use_id:"toolu_001",content:$c}]}}' \
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
PAYLOAD_UNKNOWN=$(jq -n --arg r "$ROUTER_BLOCK" --arg s "$SUBAGENT_BLOCK" \
  '("Exit code 1\nsome detail"|utf8bytelength) + ($r|utf8bytelength) + ($s|utf8bytelength)')
PAYLOAD_TOTAL=$(jq -n --arg e "$WORKER_BLOCK" --arg r "$ROUTER_BLOCK" --arg s "$SUBAGENT_BLOCK" \
  '("PAYLOAD_0123456789"|utf8bytelength) + ("Exit code 1\nsome detail"|utf8bytelength) + ($e|utf8bytelength) + ($r|utf8bytelength) + ($s|utf8bytelength)')

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
partial_worktree="$PARTIAL_ROOT/-home-x-worktrees-1909-partial"
mkdir -p "$partial_worktree"
partial_jsonl="$partial_worktree/sess-partial.jsonl"

# line 1: first user line — classifies as worker (mirror line 68)
printf '%s\n' '{"type":"user","message":{"content":"<command-name>/dispatch-worker</command-name>"}}' \
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

report_results
exit $FAIL
