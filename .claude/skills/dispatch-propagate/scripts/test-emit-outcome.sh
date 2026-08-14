#!/usr/bin/env bash
# Tests for dispatch-emit-outcome. All suites share the sourced helpers from
# test-helpers.sh (assert_eq, assert_contains, report_results, PASS/FAIL/TOTAL):
#   1. the terminated_reason cross-validation contract (#1907)
#   2. the integer validators _require_pos_int / _require_nonneg_int (#1902)
#   3. enum validation via the bash-array _in_set (#1903)
#   4. --node-id node-lane parity (tactic-outcome-envelope-node-lane-parity)
#   5. tool_denials / denied_commands
#      (unattended-worker-tool-use-rejected-midflight)
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd -P)"
source "$SCRIPT_DIR/test-helpers.sh"
SUT="$SCRIPT_DIR/dispatch-emit-outcome"

# Hermeticity: the SUT derives tool_denials/denied_commands from the transcript
# of whatever session invokes it, so an un-seamed run of this suite would read
# the live session's own transcript and produce host-dependent counts. Point the
# projects root at an empty scratch dir for the whole file — every suite below
# then sees the "no transcript resolvable" path (0 / []) unless it overrides the
# seam itself. Suite 5 exercises the derivation against its own fixtures.
TEST_TMP="$(mktemp -d)"
trap 'rm -rf "$TEST_TMP"' EXIT
export DISPATCH_OUTCOME_PROJECTS_ROOT="$TEST_TMP/empty-projects"
mkdir -p "$DISPATCH_OUTCOME_PROJECTS_ROOT"

# json_of: extract one field from an envelope block captured in OUT.
json_of() {  # $1 = jq path, $2 = the captured stdout
  printf '%s\n' "$2" | sed -n '/^```json$/,/^```$/p' | sed '1d;$d' | jq -c "$1"
}

# ============================================================================
# Suite 1: terminated_reason cross-validation contract (#1907)
# ============================================================================

COMMON=(--phase review --repo natb1/commons.systems --issue 1907
  --findings-surfaced 0 --findings-actionable 0 --fixes-applied 0
  --followups-filed 0 --subagents-launched 0)

# Run the SUT, capturing stdout+stderr in OUT and exit code in RC.
RC=0
OUT=""
run_sut() {
  set +e
  OUT=$("$SUT" "${COMMON[@]}" "$@" 2>&1)
  RC=$?
  set -e
}

# --- Case 1: the fix — completed + empty reason → exit 2 ---
echo "Case 1: completed + empty reason -> exit 2"
run_sut --disposition completed --terminated-reason ''
assert_eq "AC1: exit code is 2" "2" "$RC"
assert_contains "AC1: message mentions must not be provided" "must not be provided" "$OUT"

# --- Case 2: preserved — escalated + empty reason → exit 2 ---
echo "Case 2: escalated + empty reason -> exit 2"
run_sut --disposition escalated --terminated-reason ''
assert_eq "AC2: exit code is 2" "2" "$RC"
assert_contains "AC2: message mentions is required when" "is required when" "$OUT"

# --- Case 3: no regression — escalated + non-empty reason → exit 0, reason serialized ---
echo "Case 3: escalated + non-empty reason -> exit 0, reason in JSON"
run_sut --disposition escalated --terminated-reason 'some reason'
assert_eq "AC3: exit code is 0" "0" "$RC"
REASON=$(printf '%s\n' "$OUT" | sed -n '/^```json$/,/^```$/p' | sed '1d;$d' | jq -r '.terminated_reason')
assert_eq "AC3: terminated_reason serialized" "some reason" "$REASON"

# --- Case 4: regression — completed, no --terminated-reason → exit 0, null in JSON ---
echo "Case 4: completed + reason omitted -> exit 0, terminated_reason null"
run_sut --disposition completed
assert_eq "REGRESSION: exit code is 0" "0" "$RC"
NULLVAL=$(printf '%s\n' "$OUT" | sed -n '/^```json$/,/^```$/p' | sed '1d;$d' | jq -r '.terminated_reason')
assert_eq "REGRESSION: terminated_reason null" "null" "$NULLVAL"

# ============================================================================
# Suite 2: integer validators _require_pos_int / _require_nonneg_int (#1902)
#
# Verifies that _require_pos_int (regex ^[1-9][0-9]*$) rejects 0 and
# leading-zero forms for --issue and --pr, while _require_nonneg_int still
# accepts 0 for the five count fields (findings-surfaced, findings-actionable,
# fixes-applied, followups-filed, subagents-launched).
# ============================================================================

# run_emit: runs dispatch-emit-outcome with a baseline valid argument set and
# any extra flags appended via "$@". Echoes only the exit code; discards
# stdout/stderr. The "; echo $?" idiom captures the exit code without letting
# a non-zero exit abort this script (which runs under set -e).
#
# The baseline seeds every count field with a non-zero value (1) so that a test
# overriding one of them with 0 (via a later "$@" flag, which wins) genuinely
# exercises _require_nonneg_int's acceptance of 0 — rather than the override
# being indistinguishable from the baseline.
run_emit() {  # echoes the exit code; discards stdout/stderr
  "$SCRIPT_DIR/dispatch-emit-outcome" \
    --phase review --repo natb1/commons.systems \
    --findings-surfaced 1 --findings-actionable 1 --fixes-applied 1 \
    --followups-filed 1 --subagents-launched 1 --disposition completed \
    "$@" >/dev/null 2>&1; echo $?
}

echo ""
echo "Testing dispatch-emit-outcome validator (#1902)..."
echo ""
echo "--- _require_pos_int on --issue and --pr ---"

assert_eq "issue 0 rejected"              2 "$(run_emit --issue 0)"
assert_eq "pr 0 rejected"                 2 "$(run_emit --issue 1 --pr 0)"
assert_eq "issue 1 accepted"              0 "$(run_emit --issue 1)"
assert_eq "issue 1 pr 1 accepted"         0 "$(run_emit --issue 1 --pr 1)"
assert_eq "issue 01 (leading zero) rejected" 2 "$(run_emit --issue 01)"
assert_eq "pr 01 (leading zero) rejected" 2 "$(run_emit --issue 1 --pr 01)"

echo ""
echo "--- _require_nonneg_int count fields still accept 0 ---"

# The baseline seeds --findings-surfaced 1; appending --findings-surfaced 0
# overrides it (last flag wins), so a pass here proves _require_nonneg_int
# accepts 0 independently of the baseline value.
assert_eq "count field 0 accepted"        0 "$(run_emit --issue 1 --findings-surfaced 0)"

# ============================================================================
# Suite 3: enum validation — bash-array _in_set (#1903)
#
# Verifies that:
#   a) every current enum value still validates (exit 0)
#   b) unknown values are rejected (exit 2) with the full set listed in stderr
#   c) multi-word elements match correctly via the quoted-"$@" spread form
# ============================================================================

echo ""
echo "Testing dispatch-emit-outcome enum validation (#1903)..."
echo ""
echo "--- every valid phase exits 0 ---"

# run_sut / COMMON / RC / OUT are defined above (Suite 1) and reused here.

run_sut --disposition completed --phase review
assert_eq "phase review exits 0" "0" "$RC"

run_sut --disposition completed --phase qa
assert_eq "phase qa exits 0" "0" "$RC"

run_sut --disposition completed --phase fix-checks
assert_eq "phase fix-checks exits 0" "0" "$RC"
PHASE_VAL=$(printf '%s\n' "$OUT" | sed -n '/^```json$/,/^```$/p' | sed '1d;$d' | jq -r '.phase')
assert_eq "phase fix-checks serialized" "fix-checks" "$PHASE_VAL"

echo ""
echo "--- every valid disposition exits 0 ---"

run_sut --phase review --disposition completed
assert_eq "disposition completed exits 0" "0" "$RC"

run_sut --phase review --disposition completed_with_fixes
assert_eq "disposition completed_with_fixes exits 0" "0" "$RC"

run_sut --phase review --disposition escalated --terminated-reason 'some reason'
assert_eq "disposition escalated exits 0" "0" "$RC"

echo ""
echo "--- unknown phase rejected with full set listed ---"

run_sut --disposition completed --phase bogus
assert_eq "unknown phase exits 2" "2" "$RC"
assert_contains "unknown phase stderr lists review qa fix-checks" "review qa fix-checks" "$OUT"

echo ""
echo "--- unknown disposition rejected with full set listed ---"

run_sut --phase review --disposition bogus
assert_eq "unknown disposition exits 2" "2" "$RC"
assert_contains "unknown disposition stderr lists all values" "completed completed_with_fixes escalated" "$OUT"

echo ""
echo "--- multi-word match guarantee (_in_set mirrors SUT) ---"

# Define a local array with a multi-word element.
_test_arr=("completed with fixes" "escalated")
# Local copy of _in_set identical to the SUT's — mirrors the SUT's idiom.
_in_set_local() {
  local val="$1"; shift
  local item
  for item in "$@"; do
    [[ "$item" == "$val" ]] && return 0
  done
  return 1
}
_in_set_local "completed with fixes" "${_test_arr[@]}" \
  && assert_eq "multi-word element matches" "0" "0" \
  || assert_eq "multi-word element matches" "0" "1"
_in_set_local "completed" "${_test_arr[@]}" \
  && assert_eq "partial word does not match multi-word element" "1" "0" \
  || assert_eq "partial word does not match multi-word element" "1" "1"

# ============================================================================
# Suite 4: --node-id node-lane parity (tactic-outcome-envelope-node-lane-parity)
#
# Verifies the --issue / --node-id exactly-one-of contract: --node-id is the
# graph-native lane's alternative to --issue, mirroring the session sidecar's
# dual issue/node_id nullable shape (dispatch-stamp-session:15-19).
# ============================================================================

echo ""
echo "Testing dispatch-emit-outcome --node-id node-lane parity..."
echo ""

# COMMON_NO_ISSUE mirrors COMMON but omits --issue, so the node-id tests
# below can supply --issue / --node-id themselves.
COMMON_NO_ISSUE=(--phase review --repo natb1/commons.systems
  --findings-surfaced 0 --findings-actionable 0 --fixes-applied 0
  --followups-filed 0 --subagents-launched 0 --disposition completed)

run_sut_no_issue() {
  set +e
  OUT=$("$SUT" "${COMMON_NO_ISSUE[@]}" "$@" 2>&1)
  RC=$?
  set -e
}

echo "--- (a) --node-id tactic-foo, no --issue ---"
run_sut_no_issue --node-id tactic-foo
assert_eq "node-id only: exit 0" "0" "$RC"
ISSUE_VAL=$(printf '%s\n' "$OUT" | sed -n '/^```json$/,/^```$/p' | sed '1d;$d' | jq -r '.issue')
NODE_ID_VAL=$(printf '%s\n' "$OUT" | sed -n '/^```json$/,/^```$/p' | sed '1d;$d' | jq -r '.node_id')
assert_eq "node-id only: issue is null" "null" "$ISSUE_VAL"
assert_eq "node-id only: node_id serialized" "tactic-foo" "$NODE_ID_VAL"

echo "--- (b) --issue 42, no --node-id ---"
run_sut_no_issue --issue 42
assert_eq "issue only: exit 0" "0" "$RC"
ISSUE_VAL=$(printf '%s\n' "$OUT" | sed -n '/^```json$/,/^```$/p' | sed '1d;$d' | jq -r '.issue')
NODE_ID_VAL=$(printf '%s\n' "$OUT" | sed -n '/^```json$/,/^```$/p' | sed '1d;$d' | jq -r '.node_id')
assert_eq "issue only: issue serialized" "42" "$ISSUE_VAL"
assert_eq "issue only: node_id is null" "null" "$NODE_ID_VAL"

echo "--- (c) neither --issue nor --node-id ---"
run_sut_no_issue
assert_eq "neither given: exit 2" "2" "$RC"
assert_contains "neither given: message mentions exactly one" "exactly one of" "$OUT"

echo "--- (d) both --issue and --node-id ---"
run_sut_no_issue --issue 42 --node-id tactic-foo
assert_eq "both given: exit 2" "2" "$RC"
assert_contains "both given: message mentions exactly one" "exactly one of" "$OUT"

echo "--- (e) numeric --node-id rejected (slug reject) ---"
run_sut_no_issue --node-id 42
assert_eq "numeric node-id: exit 2" "2" "$RC"
assert_contains "numeric node-id: message mentions node-id slug" "node-id slug" "$OUT"

# ============================================================================
# Suite 5: tool_denials / denied_commands
# (unattended-worker-tool-use-rejected-midflight)
#
# The fields are ALWAYS present — tool_denials defaults to 0 and
# denied_commands to [] — so a phase that took denials cannot emit a clean
# record. Both are derived from the session transcript's
# `toolDenialKind == "user-rejected"` lines when --tool-denials is omitted;
# explicit flags override; every derivation failure falls back to 0 / [] and
# never fails the emit.
# ============================================================================

echo ""
echo "Testing dispatch-emit-outcome tool_denials / denied_commands..."
echo ""

FIXTURES="$TEST_TMP/fixtures"
mkdir -p "$FIXTURES"

# Two denials: a Bash call carrying a command, and a non-Bash tool.
cat > "$FIXTURES/two-denials.jsonl" <<'FIXEOF'
{"type":"assistant","message":{"content":[{"type":"tool_use","id":"tu_1","name":"Bash","input":{"command":"bash .github/scripts/check-type-safety-escapes.sh"}}]}}
{"type":"user","toolDenialKind":"user-rejected","message":{"content":[{"type":"tool_result","tool_use_id":"tu_1","is_error":true,"content":"denied"}]}}
{"type":"assistant","message":{"content":[{"type":"tool_use","id":"tu_2","name":"Edit","input":{"file_path":"/x"}}]}}
{"type":"user","toolDenialKind":"user-rejected","message":{"content":[{"type":"tool_result","tool_use_id":"tu_2","is_error":true,"content":"denied"}]}}
{"type":"assistant","message":{"content":[{"type":"text","text":"done"}]}}
FIXEOF

# A session that ran tools but had none rejected.
cat > "$FIXTURES/clean.jsonl" <<'FIXEOF'
{"type":"assistant","message":{"content":[{"type":"tool_use","id":"tu_1","name":"Bash","input":{"command":"ls"}}]}}
{"type":"user","message":{"content":[{"type":"tool_result","tool_use_id":"tu_1","is_error":false,"content":"ok"}]}}
FIXEOF

# A denial whose originating tool_use is not in this transcript (compacted or
# sidechained away) — the count must still be right; the shape degrades.
cat > "$FIXTURES/orphan-denial.jsonl" <<'FIXEOF'
{"type":"user","toolDenialKind":"user-rejected","message":{"content":[{"type":"tool_result","tool_use_id":"tu_gone","is_error":true,"content":"denied"}]}}
FIXEOF

# Not JSON at all — derivation must fall back, not abort the emit.
printf 'this is not json\nneither is this\n' > "$FIXTURES/garbage.jsonl"

# Valid JSON lines that are not objects, and a tool_use with no id — the shape
# join must not blow up the whole derivation and lose the real denial with it.
cat > "$FIXTURES/mixed-junk.jsonl" <<'FIXEOF'
42
"a bare string"
{"type":"assistant","message":{"content":[{"type":"tool_use","name":"Bash","input":{"command":"ls"}}]}}
{"type":"assistant","message":{"content":[{"type":"tool_use","id":"tu_1","name":"Bash","input":{"command":"npm test"}}]}}
{"type":"user","toolDenialKind":"user-rejected","message":{"content":[{"type":"tool_result","tool_use_id":"tu_1","is_error":true,"content":"denied"}]}}
FIXEOF

# run_denials: run the SUT with the baseline valid arg set, a transcript seam,
# and any extra flags. Sets OUT and RC like run_sut.
run_denials() {  # $1 = transcript path (may be empty for "none"), rest = flags
  local transcript="$1"; shift
  set +e
  OUT=$(env DISPATCH_OUTCOME_TRANSCRIPT="$transcript" "$SUT" \
    --phase review --repo natb1/commons.systems --issue 42 \
    --findings-surfaced 0 --findings-actionable 0 --fixes-applied 0 \
    --followups-filed 0 --subagents-launched 0 --disposition completed \
    "$@" 2>&1)
  RC=$?
  set -e
}

echo "--- (a) omitted + no transcript -> 0 / [] (the default case) ---"
run_denials ""
assert_eq "no transcript: exit 0" "0" "$RC"
assert_eq "no transcript: tool_denials 0" "0" "$(json_of '.tool_denials' "$OUT")"
assert_eq "no transcript: denied_commands []" "[]" "$(json_of '.denied_commands' "$OUT")"

echo "--- (b) omitted + transcript with no denials -> 0 / [] ---"
run_denials "$FIXTURES/clean.jsonl"
assert_eq "clean transcript: exit 0" "0" "$RC"
assert_eq "clean transcript: tool_denials 0" "0" "$(json_of '.tool_denials' "$OUT")"
assert_eq "clean transcript: denied_commands []" "[]" "$(json_of '.denied_commands' "$OUT")"

echo "--- (c) omitted + transcript with two denials -> derived count and shapes ---"
run_denials "$FIXTURES/two-denials.jsonl"
assert_eq "two denials: exit 0" "0" "$RC"
assert_eq "two denials: tool_denials 2" "2" "$(json_of '.tool_denials' "$OUT")"
assert_eq "two denials: first shape is the Bash command" \
  '"Bash: bash .github/scripts/check-type-safety-escapes.sh"' \
  "$(json_of '.denied_commands[0]' "$OUT")"
assert_eq "two denials: second shape is the tool name" '"Edit"' \
  "$(json_of '.denied_commands[1]' "$OUT")"

echo "--- (d) denial whose tool_use is missing -> counted, shape degrades ---"
run_denials "$FIXTURES/orphan-denial.jsonl"
assert_eq "orphan denial: exit 0" "0" "$RC"
assert_eq "orphan denial: tool_denials 1" "1" "$(json_of '.tool_denials' "$OUT")"
assert_eq "orphan denial: shape is the unknown placeholder" '"<unknown tool call>"' \
  "$(json_of '.denied_commands[0]' "$OUT")"

echo "--- (e) unparseable transcript -> falls back to 0 / [], still exits 0 ---"
run_denials "$FIXTURES/garbage.jsonl"
assert_eq "garbage transcript: exit 0" "0" "$RC"
assert_eq "garbage transcript: tool_denials 0" "0" "$(json_of '.tool_denials' "$OUT")"
assert_eq "garbage transcript: denied_commands []" "[]" "$(json_of '.denied_commands' "$OUT")"

echo "--- (e2) non-object lines and an id-less tool_use do not lose the real denial ---"
run_denials "$FIXTURES/mixed-junk.jsonl"
assert_eq "mixed junk: exit 0" "0" "$RC"
assert_eq "mixed junk: tool_denials 1" "1" "$(json_of '.tool_denials' "$OUT")"
assert_eq "mixed junk: shape still resolved" '"Bash: npm test"' \
  "$(json_of '.denied_commands[0]' "$OUT")"

echo "--- (f) explicit --tool-denials overrides the derived count ---"
run_denials "$FIXTURES/two-denials.jsonl" --tool-denials 5
assert_eq "explicit count: exit 0" "0" "$RC"
assert_eq "explicit count wins over derived 2" "5" "$(json_of '.tool_denials' "$OUT")"

echo "--- (g) explicit --tool-denials 0 is honored, not treated as absent ---"
run_denials "$FIXTURES/two-denials.jsonl" --tool-denials 0
assert_eq "explicit 0: exit 0" "0" "$RC"
assert_eq "explicit 0 wins over derived 2" "0" "$(json_of '.tool_denials' "$OUT")"

echo "--- (h) explicit --denied-command flags override the derived shapes ---"
run_denials "$FIXTURES/two-denials.jsonl" --denied-command 'Bash: one' --denied-command 'Bash: two'
assert_eq "explicit shapes: exit 0" "0" "$RC"
assert_eq "explicit shapes replace derived" '["Bash: one","Bash: two"]' \
  "$(json_of '.denied_commands' "$OUT")"

echo "--- (i) malformed --tool-denials is a caller bug -> exit 2 ---"
run_denials "" --tool-denials abc
assert_eq "non-integer tool-denials: exit 2" "2" "$RC"
assert_contains "non-integer tool-denials: message names the flag" "--tool-denials" "$OUT"
run_denials "" --tool-denials -1
assert_eq "negative tool-denials: exit 2" "2" "$RC"

echo "--- (j) resolution via projects-root + CLAUDE_CODE_SESSION_ID ---"
SEEDED_ROOT="$TEST_TMP/seeded-projects/-some-project"
mkdir -p "$SEEDED_ROOT"
cp "$FIXTURES/two-denials.jsonl" "$SEEDED_ROOT/sess-abc.jsonl"
set +e
OUT=$(env DISPATCH_OUTCOME_PROJECTS_ROOT="$TEST_TMP/seeded-projects" \
  CLAUDE_CODE_SESSION_ID="sess-abc" "$SUT" \
  --phase review --repo natb1/commons.systems --issue 42 \
  --findings-surfaced 0 --findings-actionable 0 --fixes-applied 0 \
  --followups-filed 0 --subagents-launched 0 --disposition completed 2>&1)
RC=$?
set -e
assert_eq "projects-root lookup: exit 0" "0" "$RC"
assert_eq "projects-root lookup: tool_denials 2" "2" "$(json_of '.tool_denials' "$OUT")"

echo "--- (k) no session id and no transcript -> 0 / [], no crash ---"
set +e
OUT=$(env DISPATCH_OUTCOME_PROJECTS_ROOT="$TEST_TMP/seeded-projects" \
  CLAUDE_CODE_SESSION_ID="" "$SUT" \
  --phase review --repo natb1/commons.systems --issue 42 \
  --findings-surfaced 0 --findings-actionable 0 --fixes-applied 0 \
  --followups-filed 0 --subagents-launched 0 --disposition completed 2>&1)
RC=$?
set -e
assert_eq "empty session id: exit 0" "0" "$RC"
assert_eq "empty session id: tool_denials 0" "0" "$(json_of '.tool_denials' "$OUT")"

report_results
