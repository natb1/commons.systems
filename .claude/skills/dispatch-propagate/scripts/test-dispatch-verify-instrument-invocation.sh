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

VERIFY_ROOT=""
vi_cleanup() { [ -n "${VERIFY_ROOT:-}" ] && rm -rf "$VERIFY_ROOT"; return 0; }

# CHAIN onto the fixture's own `_dispatch_test_exit_trap` EXIT trap
# (dispatch-test-fixture.sh) rather than replacing it. `trap` installs, it does
# not append: a bare `trap vi_cleanup EXIT` here would silently DISARM that
# handler, which owns the fixture's $TMPDIR_TEST cleanup plus the host-systemd
# and routing-decision-log leak guards. Those guards exist precisely to catch an
# abort partway through a suite, and disarming them turns a leak into a green
# run.
#
# Same idiom as `test-detect-changes.sh`'s `dc_real_exit_trap` — that is the
# in-repo precedent for this shape; follow it there rather than re-deriving it.
#
# $? is preserved across the chain BY HAND. The fixture's trap opens with
# `local rc=$?` and exits with it, so it must see the SUITE's status, not the
# cleanup's — `trap 'vi_cleanup; _dispatch_test_exit_trap' EXIT` would hand it
# `rm`'s 0 and turn a failing suite green. `set +e` guards the `(exit "$rc")`
# that restores the status, which errexit would otherwise treat as a failing
# non-final command and act on.
# Signals get their OWN handlers, and the status is passed in explicitly.
# `trap fn EXIT INT TERM` installs one handler for all three, and at handler
# entry $? is the last COMPLETED command's status -- NOT 128+signo. So a suite
# killed by TERM (a cancelled Actions job, a step timeout) or INT (Ctrl-C) ran
# only part of its assertions and still exits 0: green. CI runs this suite
# unguarded, so that is a vacuous pass of exactly the shape this PR closes.
vi_exit_trap() {
  local rc=${1:-$?}
  vi_cleanup
  set +e
  (exit "$rc")
  _dispatch_test_exit_trap
}
trap vi_exit_trap EXIT
trap 'vi_exit_trap 130' INT
trap 'vi_exit_trap 143' TERM
# Temp projects root. mktemp -d honors $TMPDIR when set and is what every
# sibling suite in this directory uses, so it never lands in a bare /tmp the
# sandbox denies (.claude/rules/sandbox.md).
VERIFY_ROOT="$(mktemp -d)"
export DISPATCH_AUDIT_PROJECTS_ROOT="$VERIFY_ROOT"

CWD_A="/home/tester/wt/node-a"
CWD_B="/home/tester/wt/node-b"
# Derived from the wall clock, not hard-coded: the SUT prunes candidate files to
# those whose mtime is at/after --since, and every fixture file below is written
# NOW. A fixed calendar instant would make the suite pass or fail depending on
# the hour of day it runs at.
SINCE="$(date -u -d '-1 hour' +%Y-%m-%dT%H:%M:%S.000Z)"
T_OK="$(date -u +%Y-%m-%dT%H:%M:%S.000Z)"
T_OLD="$(date -u -d '-3 hours' +%Y-%m-%dT%H:%M:%S.000Z)"

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
# Case 2 — the real rejection: the Skill tool_use the harness refused, plus its
# paired is_error result. Both halves are present in a real transcript, and the
# SUT counts a rejection ONLY through that tool_use_id pairing.
# ============================================================================
reset_fixtures
{
  skill_use_record "$CWD_A" "$T_OK" "toolu_rej1" "code-review"
  err_result_record "$CWD_A" "$T_OK" "toolu_rej1" "$REJECT_TEXT"
} > "$PROJ_DIR/agent-rej.jsonl"

run_sut "$SUT" --instrument code-review --kind skill --skill code-review \
  --since "$SINCE" --cwd "$CWD_A" --wait-secs 0
assert_eq "case 2: rejection exits 1" "1" "$RC"
assert_eq "case 2: not verified" "false" "$(jq -r '.verified' <<<"$OUT")"
assert_eq "case 2: rejections counted" "1" "$(jq -r '.rejections' <<<"$OUT")"
assert_eq "case 2: no success counted" "0" "$(jq -r '.succeeded' <<<"$OUT")"
assert_eq "case 2: failure_text is verbatim" "$REJECT_TEXT" "$(jq -r '.failure_text' <<<"$OUT")"
# A rejection IS evidence, so the fail-closed no-evidence reason must NOT fire.
assert_eq "case 2: reason empty (rejection is evidence)" "" "$(jq -r '.reason' <<<"$OUT")"

# ============================================================================
# Case 3 — cwd scoping: the same rejection, but recorded under a DIFFERENT cwd.
# A rejection in another worktree must not poison this worktree's verdict.
# ============================================================================
reset_fixtures
{
  skill_use_record "$CWD_B" "$T_OK" "toolu_rej1" "code-review"
  err_result_record "$CWD_B" "$T_OK" "toolu_rej1" "$REJECT_TEXT"
} > "$PROJ_DIR/agent-rej.jsonl"

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

# ============================================================================
# Case 7 — rejection-text poisoning. An UNRELATED failed tool call (a Bash that
# exited non-zero after echoing a repo file, say) whose error text happens to
# contain the rejection phrase must NOT count as a rejection: the phrase is
# plain text anyone can commit to the PR under review. Only tool_use_id pairing
# counts, so the genuine invocation below stays verified.
# ============================================================================
reset_fixtures
{
  skill_use_record "$CWD_A" "$T_OK" "toolu_ok2" "code-review"
  ok_result_record "$CWD_A" "$T_OK" "toolu_ok2"
  bash_use_record "$CWD_A" "$T_OK" "toolu_bash1" "cat fixtures/notes.md"
  err_result_record "$CWD_A" "$T_OK" "toolu_bash1" "$REJECT_TEXT"
} > "$PROJ_DIR/agent-poison.jsonl"

run_sut "$SUT" --instrument code-review --kind skill --skill code-review \
  --since "$SINCE" --cwd "$CWD_A" --wait-secs 0
assert_eq "case 7: unpaired reject text does not flip the verdict" "0" "$RC"
assert_eq "case 7: still verified" "true" "$(jq -r '.verified' <<<"$OUT")"
assert_eq "case 7: unpaired reject text not counted" "0" "$(jq -r '.rejections' <<<"$OUT")"
assert_eq "case 7: failure_text stays empty" "" "$(jq -r '.failure_text' <<<"$OUT")"

# The same poisoning attempt with NO genuine invocation must still be no-evidence
# (fail-closed) rather than a counted rejection.
reset_fixtures
{
  bash_use_record "$CWD_A" "$T_OK" "toolu_bash2" "cat fixtures/notes.md"
  err_result_record "$CWD_A" "$T_OK" "toolu_bash2" "$REJECT_TEXT"
} > "$PROJ_DIR/agent-poison.jsonl"

run_sut "$SUT" --instrument code-review --kind skill --skill code-review \
  --since "$SINCE" --cwd "$CWD_A" --wait-secs 0
assert_eq "case 7b: poison-only exits 1" "1" "$RC"
assert_eq "case 7b: poison-only not counted as rejection" "0" "$(jq -r '.rejections' <<<"$OUT")"
assert_eq "case 7b: fail-closed reason" "no invocation record found" "$(jq -r '.reason' <<<"$OUT")"

# ============================================================================
# Case 8 — refused once, then genuinely run. A paired success is direct evidence
# the harness executed the instrument, so it is authoritative over the earlier
# paired rejection.
# ============================================================================
reset_fixtures
{
  skill_use_record "$CWD_A" "$T_OK" "toolu_rej2" "code-review"
  err_result_record "$CWD_A" "$T_OK" "toolu_rej2" "$REJECT_TEXT"
  skill_use_record "$CWD_A" "$T_OK" "toolu_ok3" "code-review"
  ok_result_record "$CWD_A" "$T_OK" "toolu_ok3"
} > "$PROJ_DIR/agent-retry.jsonl"

run_sut "$SUT" --instrument code-review --kind skill --skill code-review \
  --since "$SINCE" --cwd "$CWD_A" --wait-secs 0
assert_eq "case 8: retry-after-rejection exits 0" "0" "$RC"
assert_eq "case 8: verified" "true" "$(jq -r '.verified' <<<"$OUT")"
assert_eq "case 8: both attempts counted" "2" "$(jq -r '.invocations' <<<"$OUT")"
assert_eq "case 8: rejection still reported" "1" "$(jq -r '.rejections' <<<"$OUT")"

# ============================================================================
# Case 9 — a transcript file whose mtime predates --since is pruned from the
# candidate set before parsing (the scan-scoping guard). Its records would match
# on cwd and timestamp, so only the mtime prefilter can exclude it.
# ============================================================================
reset_fixtures
{
  skill_use_record "$CWD_A" "$T_OK" "toolu_stale1" "code-review"
  ok_result_record "$CWD_A" "$T_OK" "toolu_stale1"
} > "$PROJ_DIR/agent-stale.jsonl"
# Well under the SUT's slack margin below --since (1h ago): 2 days back.
touch -d '2 days ago' "$PROJ_DIR/agent-stale.jsonl"

run_sut "$SUT" --instrument code-review --kind skill --skill code-review \
  --since "$SINCE" --cwd "$CWD_A" --wait-secs 0
assert_eq "case 9: stale-mtime transcript is not parsed" "1" "$RC"
assert_eq "case 9: no invocations from a pruned file" "0" "$(jq -r '.invocations' <<<"$OUT")"

# ---------------------------------------------------------------------------
# REGRESSION: the EXIT trap above must CHAIN, must preserve $?, and the signal
# handlers must be their OWN registrations.
#
# Asserted end-to-end in a CHILD process, not by inspecting the trap string: the
# child sources the real fixture and installs THIS FILE'S ACTUAL function bodies
# (via `declare -f`), so the test tracks the code rather than a copy of it. A
# string match on `trap -p EXIT` tells you nothing about whether $? survives.
#   clean run  -> exit 0,        nothing left in its own private $TMPDIR
#   forged host-systemd leak -> exit NON-ZERO, still nothing left behind
#   failing assertion + report_results -> exit NON-ZERO (the status-preservation
#                                         half; the buggy idiom returns 0 here)
#   TERM mid-run -> exit 143 (the split-handler half; one shared
#                             `trap fn EXIT INT TERM` returns 0 here)
#   INT mid-run  -> exit 130 (the same half, for the INT registration)
# The two signal cases are ONE PER REGISTRATION on purpose: with only one of
# them, the other of `trap 'vi_exit_trap 143' TERM` /
# `trap 'vi_exit_trap 130' INT` could be mis-numbered or deleted and this suite
# would stay green. Measured under the combined
# `trap vi_exit_trap EXIT INT TERM`: TERM exits 0 instead of 143, INT exits 0
# instead of 130. This block is the twin of the one in
# `test-detect-changes.sh`; keep the two in step.
# ---------------------------------------------------------------------------
echo "Regression: the EXIT trap chains onto the fixture's leak guards"
vi_trap_harness() {  # <path> <"clean"|"leak"|"fail"|"sigterm"|"sigint">
  {
    printf '%s\n' '#!/usr/bin/env bash'
    printf '%s\n' 'set -euo pipefail'
    printf 'source %q\n' "$SCRIPT_DIR/dispatch-test-fixture.sh"
    printf '%s\n' 'VERIFY_ROOT=""'
    declare -f vi_cleanup
    declare -f vi_exit_trap
    printf '%s\n' 'trap vi_exit_trap EXIT'
    printf '%s\n' "trap 'vi_exit_trap 130' INT"
    printf '%s\n' "trap 'vi_exit_trap 143' TERM"
    printf '%s\n' 'VERIFY_ROOT=$(mktemp -d)'
    if [ "$2" = "leak" ]; then
      # A recorded call to the real `systemctl` is exactly what
      # dispatch_host_systemd_guard_check trips on.
      printf '%s\n' 'printf "start some.service\n" >> "$DISPATCH_GUARD_SYSTEMCTL_LOG"'
    fi
    if [ "$2" = "fail" ]; then
      printf '%s\n' 'assert_eq "deliberate failure" "expected" "actual"'
      printf '%s\n' 'report_results'
    elif [ "$2" = "sigterm" ] || [ "$2" = "sigint" ]; then
      # Kill the harness with TERM (sigterm) or INT (sigint) mid-run. bash runs
      # the trap between commands, and the chained handler ends inside the
      # fixture's `_dispatch_test_exit_trap`, whose last statement is
      # `exit "$rc"` (dispatch-test-fixture.sh:1466). So the `exit 0` below is
      # not reached by the correct handler OR by the buggy one -- measured, all
      # four combinations of {split, combined} x {INT, TERM}: never reached.
      # The fallthrough is therefore NOT what discriminates. The STATUS is: the
      # split registrations exit 143 / 130, one shared
      # `trap fn EXIT INT TERM` exits 0. The `exit 0` is only a backstop for a
      # harness left with no handler installed at all.
      if [ "$2" = "sigterm" ]; then
        printf '%s\n' 'kill -TERM $$'
      else
        printf '%s\n' 'kill -INT $$'
      fi
      printf '%s\n' 'exit 0'
    else
      printf '%s\n' 'exit 0'
    fi
  } > "$1"
}

VI_TRAP_DIR=$(mktemp -d "$VERIFY_ROOT/traptest.XXXXXX")
for vi_trap_case in clean leak fail sigterm sigint; do
  vi_trap_harness "$VI_TRAP_DIR/$vi_trap_case.sh" "$vi_trap_case"
  VI_TRAP_TMPDIR=$(mktemp -d "$VI_TRAP_DIR/tmp-$vi_trap_case.XXXXXX")
  set +e
  TMPDIR="$VI_TRAP_TMPDIR" bash "$VI_TRAP_DIR/$vi_trap_case.sh" >/dev/null 2>&1
  VI_TRAP_RC=$?
  set -e
  VI_TRAP_LEFT=$(find "$VI_TRAP_TMPDIR" -maxdepth 1 -mindepth 1 | wc -l)
  assert_eq "trap chain ($vi_trap_case): nothing leaks into a fresh TMPDIR" \
    "0" "$VI_TRAP_LEFT"
  if [ "$vi_trap_case" = "clean" ]; then
    assert_eq "trap chain (clean): a clean run still exits 0" "0" "$VI_TRAP_RC"
  elif [ "$vi_trap_case" = "sigterm" ]; then
    # The whole point: with one shared EXIT/INT/TERM handler this is 0, because
    # at handler entry $? is the last COMPLETED command's status and NOT
    # 128+signo. 143 exactly, not merely non-zero -- "non-zero" is what the
    # `fail` case above already asserts, so it would prove nothing about TERM.
    assert_eq "trap chain (sigterm): a TERM-killed suite exits 143, not 0" \
      "143" "$VI_TRAP_RC"
  elif [ "$vi_trap_case" = "sigint" ]; then
    # The INT registration needs its OWN case or it is never exercised: with
    # the TERM case alone, mis-numbering or deleting
    # `trap 'vi_exit_trap 130' INT` leaves this suite green. 130 exactly, for
    # the same reason 143 is exact above.
    assert_eq "trap chain (sigint): an INT-killed suite exits 130, not 0" \
      "130" "$VI_TRAP_RC"
  else
    [ "$VI_TRAP_RC" -ne 0 ] && _v=nonzero || _v=zero
    assert_eq "trap chain ($vi_trap_case): status reaches the fixture trap" \
      "nonzero" "$_v"
  fi
done
rm -rf "$VI_TRAP_DIR"

report_results
