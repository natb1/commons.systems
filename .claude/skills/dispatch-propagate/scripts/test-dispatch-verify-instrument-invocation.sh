#!/usr/bin/env bash
# Tests for dispatch-verify-instrument-invocation — the independent transcript
# reader that checks whether a named instrument was ACTUALLY invoked, rather
# than trusting the finder agent's own receipt
# (tactic-lane-instrument-substitution-guard, Unit 4).
#
# Every fixture is a hand-authored .jsonl in the real Claude transcript record
# shape: one JSON object per line carrying .type/.cwd/.timestamp/.sessionId and
# a .message.content[] array of tool_use / tool_result blocks.
set -euo pipefail

FIXTURE_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=dispatch-test-fixture.sh
source "$FIXTURE_DIR/dispatch-test-fixture.sh"

SUT="$SCRIPT_DIR/dispatch-verify-instrument-invocation"

echo "Test: dispatch-verify-instrument-invocation"

# Temp projects root. mktemp -d honors $TMPDIR when set and is what every
# sibling suite in this directory uses, so it never lands in a bare /tmp the
# sandbox denies (.claude/rules/sandbox.md).
VERIFY_ROOT="$(mktemp -d)"
# Chain onto the fixture's own EXIT trap (dispatch-test-fixture.sh:1394) rather
# than replacing it — a bare `trap ... EXIT` here would silently disarm the
# host-systemd leak guard and the fixture's own tmp cleanup.
trap 'rm -rf "$VERIFY_ROOT"; _dispatch_test_exit_trap' EXIT
export DISPATCH_AUDIT_PROJECTS_ROOT="$VERIFY_ROOT"

CWD_A="/home/tester/wt/node-a"
CWD_B="/home/tester/wt/node-b"
SINCE="2026-07-31T12:00:00.000Z"
T_OK="2026-07-31T12:05:00.000Z"
T_OLD="2026-07-31T09:00:00.000Z"

# Mimic the nested workflow-subagent layout so the recursive find is exercised
# at its deepest real nesting, not just the flat top level.
PROJ_DIR="$VERIFY_ROOT/-home-tester-wt-node-a/sess-1/subagents/workflows/wf_abc"
mkdir -p "$PROJ_DIR"

# write_case <file> — reset the fixture tree to just this file's records (read
# from stdin), so cases never leak evidence into each other.
reset_fixtures() {
  rm -f "$PROJ_DIR"/*.jsonl
}

# --- helpers to emit one transcript record ----------------------------------

skill_use_record() {
  # $1 cwd  $2 timestamp  $3 tool_use id  $4 skill arg
  jq -n -c --arg cwd "$1" --arg ts "$2" --arg id "$3" --arg skill "$4" '{
    type: "assistant", cwd: $cwd, timestamp: $ts, sessionId: "sess-1",
    message: { role: "assistant", content: [
      { type: "tool_use", id: $id, name: "Skill", input: { skill: $skill, args: "" } }
    ] }
  }'
}

bash_use_record() {
  # $1 cwd  $2 timestamp  $3 tool_use id  $4 command
  jq -n -c --arg cwd "$1" --arg ts "$2" --arg id "$3" --arg cmd "$4" '{
    type: "assistant", cwd: $cwd, timestamp: $ts, sessionId: "sess-1",
    message: { role: "assistant", content: [
      { type: "tool_use", id: $id, name: "Bash", input: { command: $cmd } }
    ] }
  }'
}

ok_result_record() {
  # $1 cwd  $2 timestamp  $3 tool_use_id
  jq -n -c --arg cwd "$1" --arg ts "$2" --arg id "$3" '{
    type: "user", cwd: $cwd, timestamp: $ts, sessionId: "sess-1",
    message: { role: "user", content: [
      { type: "tool_result", tool_use_id: $id, is_error: false, content: "done" }
    ] }
  }'
}

err_result_record() {
  # $1 cwd  $2 timestamp  $3 tool_use_id  $4 error text
  jq -n -c --arg cwd "$1" --arg ts "$2" --arg id "$3" --arg text "$4" '{
    type: "user", cwd: $cwd, timestamp: $ts, sessionId: "sess-1",
    message: { role: "user", content: [
      { type: "tool_result", tool_use_id: $id, is_error: true, content: $text }
    ] }
  }'
}

# The verbatim rejection the substitution incident produced.
REJECT_TEXT='<tool_use_error>Skill code-review cannot be used with Skill tool due to disable-model-invocation</tool_use_error>'

run_sut() {
  # Runs the SUT, capturing stdout and exit code into OUT / RC.
  set +e
  OUT=$("$@" 2>/dev/null)
  RC=$?
  set -e
}

# ============================================================================
# Case 1 — a real, successful invocation: tool_use + paired non-error result.
# ============================================================================
reset_fixtures
{
  skill_use_record "$CWD_A" "$T_OK" "toolu_ok1" "code-review"
  ok_result_record "$CWD_A" "$T_OK" "toolu_ok1"
} > "$PROJ_DIR/agent-ok.jsonl"

run_sut "$SUT" --instrument code-review --kind skill --skill code-review \
  --since "$SINCE" --cwd "$CWD_A" --wait-secs 0
assert_eq "case 1: successful invocation exits 0" "0" "$RC"
assert_eq "case 1: verified" "true" "$(jq -r '.verified' <<<"$OUT")"
assert_eq "case 1: invocations counted" "1" "$(jq -r '.invocations' <<<"$OUT")"
assert_eq "case 1: succeeded counted" "1" "$(jq -r '.succeeded' <<<"$OUT")"
assert_eq "case 1: no rejections" "0" "$(jq -r '.rejections' <<<"$OUT")"
assert_eq "case 1: reason empty" "" "$(jq -r '.reason' <<<"$OUT")"

# ============================================================================
# Case 2 — the real rejection: is_error result carrying the substitution text.
# ============================================================================
reset_fixtures
err_result_record "$CWD_A" "$T_OK" "toolu_rej1" "$REJECT_TEXT" > "$PROJ_DIR/agent-rej.jsonl"

run_sut "$SUT" --instrument code-review --kind skill --skill code-review \
  --since "$SINCE" --cwd "$CWD_A" --wait-secs 0
assert_eq "case 2: rejection exits 1" "1" "$RC"
assert_eq "case 2: not verified" "false" "$(jq -r '.verified' <<<"$OUT")"
assert_eq "case 2: rejections counted" "1" "$(jq -r '.rejections' <<<"$OUT")"
assert_eq "case 2: failure_text is verbatim" "$REJECT_TEXT" "$(jq -r '.failure_text' <<<"$OUT")"
# A rejection IS evidence, so the fail-closed no-evidence reason must NOT fire.
assert_eq "case 2: reason empty (rejection is evidence)" "" "$(jq -r '.reason' <<<"$OUT")"

# ============================================================================
# Case 3 — cwd scoping: the same rejection, but recorded under a DIFFERENT cwd.
# A rejection in another worktree must not poison this worktree's verdict.
# ============================================================================
reset_fixtures
err_result_record "$CWD_B" "$T_OK" "toolu_rej1" "$REJECT_TEXT" > "$PROJ_DIR/agent-rej.jsonl"

run_sut "$SUT" --instrument code-review --kind skill --skill code-review \
  --since "$SINCE" --cwd "$CWD_A" --wait-secs 0
assert_eq "case 3: foreign-cwd rejection exits 1" "1" "$RC"
assert_eq "case 3: not verified" "false" "$(jq -r '.verified' <<<"$OUT")"
assert_eq "case 3: foreign rejection not counted" "0" "$(jq -r '.rejections' <<<"$OUT")"
assert_eq "case 3: fail-closed reason" "no invocation record found" "$(jq -r '.reason' <<<"$OUT")"

# ============================================================================
# Case 4 — since filtering: a successful invocation that predates --since.
# ============================================================================
reset_fixtures
{
  skill_use_record "$CWD_A" "$T_OLD" "toolu_old1" "code-review"
  ok_result_record "$CWD_A" "$T_OLD" "toolu_old1"
} > "$PROJ_DIR/agent-old.jsonl"

run_sut "$SUT" --instrument code-review --kind skill --skill code-review \
  --since "$SINCE" --cwd "$CWD_A" --wait-secs 0
assert_eq "case 4: pre-since invocation exits 1" "1" "$RC"
assert_eq "case 4: not verified" "false" "$(jq -r '.verified' <<<"$OUT")"
assert_eq "case 4: pre-since invocation not counted" "0" "$(jq -r '.invocations' <<<"$OUT")"
assert_eq "case 4: fail-closed reason" "no invocation record found" "$(jq -r '.reason' <<<"$OUT")"

# ============================================================================
# Case 5 — --kind command: a Bash tool_use matching an ERE, paired with a
# non-error result. Forward-compatibility for a future non-Skill instrument.
# ============================================================================
reset_fixtures
{
  bash_use_record "$CWD_A" "$T_OK" "toolu_cmd1" "npx some-linter --strict ."
  ok_result_record "$CWD_A" "$T_OK" "toolu_cmd1"
} > "$PROJ_DIR/agent-cmd.jsonl"

run_sut "$SUT" --instrument some-linter --kind command \
  --command-pattern '(^|/| )some-linter( |$)' \
  --since "$SINCE" --cwd "$CWD_A" --wait-secs 0
assert_eq "case 5: command-kind invocation exits 0" "0" "$RC"
assert_eq "case 5: verified" "true" "$(jq -r '.verified' <<<"$OUT")"
assert_eq "case 5: invocations counted" "1" "$(jq -r '.invocations' <<<"$OUT")"
assert_eq "case 5: kind echoed" "command" "$(jq -r '.kind' <<<"$OUT")"

# A non-matching command must NOT count.
reset_fixtures
{
  bash_use_record "$CWD_A" "$T_OK" "toolu_cmd2" "npx other-linter ."
  ok_result_record "$CWD_A" "$T_OK" "toolu_cmd2"
} > "$PROJ_DIR/agent-cmd.jsonl"

run_sut "$SUT" --instrument some-linter --kind command \
  --command-pattern '(^|/| )some-linter( |$)' \
  --since "$SINCE" --cwd "$CWD_A" --wait-secs 0
assert_eq "case 5b: non-matching command exits 1" "1" "$RC"
assert_eq "case 5b: non-matching command not counted" "0" "$(jq -r '.invocations' <<<"$OUT")"

# ============================================================================
# Case 6 — usage error: --instrument omitted. Exit 2, NO stdout JSON.
# ============================================================================
run_sut "$SUT" --kind skill --skill code-review --since "$SINCE" --cwd "$CWD_A" --wait-secs 0
assert_eq "case 6: missing --instrument exits 2" "2" "$RC"
assert_eq "case 6: missing --instrument prints no stdout" "" "$OUT"

# Environment error: an absent transcript root is exit 2, never verified:false.
run_sut env DISPATCH_AUDIT_PROJECTS_ROOT="$VERIFY_ROOT/does-not-exist" \
  "$SUT" --instrument code-review --kind skill --skill code-review \
  --since "$SINCE" --cwd "$CWD_A" --wait-secs 0
assert_eq "case 6b: absent transcript root exits 2" "2" "$RC"
assert_eq "case 6b: absent transcript root prints no stdout" "" "$OUT"

# Unparseable --since is likewise an environment error, not a false verdict.
run_sut "$SUT" --instrument code-review --kind skill --skill code-review \
  --since "yesterday" --cwd "$CWD_A" --wait-secs 0
assert_eq "case 6c: unparseable --since exits 2" "2" "$RC"
assert_eq "case 6c: unparseable --since prints no stdout" "" "$OUT"

report_results
