#!/usr/bin/env bash
# Tests for dispatch-session-digest — the bounded, untrusted-safe transcript
# view `/dispatch-invalid-state` reads instead of the raw multi-megabyte
# `.jsonl`.
#
# The failure surface being pinned: jq over ADVERSARIAL input. A dead session's
# transcript can be truncated mid-write, can carry shell metacharacters and
# quotes inside a recorded command, and can be arbitrarily large. Each of those
# gets a case here, because each of them would otherwise turn "read the
# artifact" into "crash, or emit something that is not JSON".
#
# Fixtures are one compact JSON object per line, written with printf '%s\n'
# (NOT echo — zsh's echo interprets backslash escapes, per
# `.claude/rules/shell-json.md`) so the JSONL is byte-exact.
set -euo pipefail

FIXTURE_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=dispatch-test-fixture.sh
source "$FIXTURE_DIR/dispatch-test-fixture.sh"

echo ""
echo "=== dispatch-session-digest ==="

DSD="$SCRIPT_DIR/dispatch-session-digest"

# Every run is scoped to a per-test projects root two levels deep, matching the
# real store layout (<projects-root>/<project-slug>/<sid>.jsonl) that the
# script's `find -mindepth 2 -maxdepth 2` requires.
dsd_setup() {
  DSD_ROOT=$(mktemp -d)
  DSD_PROJ="$DSD_ROOT/projects/-home-n8-repo"
  mkdir -p "$DSD_PROJ"
}
dsd_teardown() {
  rm -rf "$DSD_ROOT"
  DSD_ROOT=""
}

# run_dsd <args...> — runs the SUT with the fixture projects root, capturing
# stdout and rc separately. Never lets a non-zero rc abort the suite.
run_dsd() {
  DSD_OUT=""
  DSD_RC=0
  DSD_OUT=$(DISPATCH_AUDIT_PROJECTS_ROOT="$DSD_ROOT/projects" "$DSD" "$@" 2>/dev/null) || DSD_RC=$?
}

USER_TURN='{"type":"user","cwd":"/home/n8/repo/.claude/worktrees/tactic-x","timestamp":"2026-08-05T01:00:00Z","message":{"role":"user","content":"/align-tactics tactic-x"}}'
ASSIST_TURN='{"type":"assistant","timestamp":"2026-08-05T01:00:10Z","message":{"role":"assistant","content":[{"type":"text","text":"finished the round"}]}}'
# The transient server-side death signature dispatch-detect-transient-death
# allowlists. Must be the LAST assistant turn to count.
RL_TURN='{"type":"assistant","isApiErrorMessage":true,"timestamp":"2026-08-05T01:00:20Z","message":{"role":"assistant","content":[{"type":"text","text":"API Error: Server is temporarily limiting requests (not your usage limit) · Rate limited"}]}}'
OVERLOAD_TURN='{"type":"assistant","isApiErrorMessage":true,"timestamp":"2026-08-05T01:00:15Z","message":{"role":"assistant","content":[{"type":"text","text":"API Error: 529 Overloaded"}]}}'
GC_TURN='{"type":"assistant","timestamp":"2026-08-05T01:00:05Z","message":{"role":"assistant","content":[{"type":"tool_use","name":"Bash","input":{"command":"packages/intentionsutil/scripts/graph-commit --base /tmp/m -m \"graph: land it\" tactic-x"}}]}}'
PUSH_TURN='{"type":"assistant","timestamp":"2026-08-05T01:00:06Z","message":{"role":"assistant","content":[{"type":"tool_use","name":"Bash","input":{"command":"git push origin HEAD"}}]}}'
# A Bash call that is NOT a durable-effect primitive — the allowlist must not
# collect ordinary reads.
LS_TURN='{"type":"assistant","timestamp":"2026-08-05T01:00:07Z","message":{"role":"assistant","content":[{"type":"tool_use","name":"Bash","input":{"command":"git status --porcelain"}}]}}'

# --- Test 1: unknown session id → exit 1, no stdout --------------------------
# "No transcript" is the digest-unavailable branch, not a crash — but it must be
# distinguishable, so it exits 1 and prints NOTHING on stdout.
echo "Test: unknown session id → exit 1, no stdout"
dsd_setup
printf '%s\n' "$USER_TURN" > "$DSD_PROJ/1111-2222.jsonl"
run_dsd --session 3333-4444
assert_eq "unknown sid exits 1" "1" "$DSD_RC"
assert_eq "unknown sid emits no stdout" "" "$DSD_OUT"
dsd_teardown

# --- Test 2: bad session-id shape → exit 2 -----------------------------------
# The id feeds a `find -name` glob and must be validated at that edge, the same
# check lib-session-reap.sh:311-317 applies.
echo "Test: bad session-id shape → exit 2"
dsd_setup
run_dsd --session 'evil/../../etc'
assert_eq "path-shaped sid exits 2" "2" "$DSD_RC"
assert_eq "path-shaped sid emits no stdout" "" "$DSD_OUT"
run_dsd --session 'has spaces'
assert_eq "spaced sid exits 2" "2" "$DSD_RC"
dsd_teardown

# --- Test 3: usage errors → exit 2 -------------------------------------------
echo "Test: missing/invalid argv → exit 2"
dsd_setup
run_dsd
assert_eq "no --session exits 2" "2" "$DSD_RC"
run_dsd --session 1111-2222 --tail-turns notanumber
assert_eq "non-numeric --tail-turns exits 2" "2" "$DSD_RC"
run_dsd --session 1111-2222 --bogus x
assert_eq "unknown flag exits 2" "2" "$DSD_RC"
dsd_teardown

# --- Test 4: a normal transcript → valid JSON, turn_count, cwd ---------------
echo "Test: normal transcript → valid JSON with turn_count and cwd"
dsd_setup
printf '%s\n' "$USER_TURN" "$GC_TURN" "$ASSIST_TURN" > "$DSD_PROJ/1111-2222.jsonl"
run_dsd --session 1111-2222
assert_eq "normal transcript exits 0" "0" "$DSD_RC"
assert_eq "output is valid JSON" "yes" \
  "$(printf '%s' "$DSD_OUT" | jq -e . >/dev/null 2>&1 && printf 'yes' || printf 'no')"
assert_eq "turn_count counts user+assistant records" "3" \
  "$(printf '%s' "$DSD_OUT" | jq -r '.turn_count')"
assert_eq "cwd comes from the first record" \
  "/home/n8/repo/.claude/worktrees/tactic-x" \
  "$(printf '%s' "$DSD_OUT" | jq -r '.cwd')"
assert_eq "session_id is echoed back" "1111-2222" \
  "$(printf '%s' "$DSD_OUT" | jq -r '.session_id')"
assert_eq "started_at is the first timestamp" "2026-08-05T01:00:00Z" \
  "$(printf '%s' "$DSD_OUT" | jq -r '.started_at')"
assert_eq "ended_at is the last timestamp" "2026-08-05T01:00:10Z" \
  "$(printf '%s' "$DSD_OUT" | jq -r '.ended_at')"
# The DATA boundary: free text lives under .untrusted, never at top level.
assert_eq "the untrusted sub-object exists" "object" \
  "$(printf '%s' "$DSD_OUT" | jq -r '.untrusted | type')"
assert_eq "last_user_request is under .untrusted" "/align-tactics tactic-x" \
  "$(printf '%s' "$DSD_OUT" | jq -r '.untrusted.last_user_request')"
dsd_teardown

# --- Test 5: last turn is an apiError → ended_on_api_error + text ------------
echo "Test: last turn isApiErrorMessage → ended_on_api_error true, text under .untrusted"
dsd_setup
printf '%s\n' "$USER_TURN" "$ASSIST_TURN" "$RL_TURN" > "$DSD_PROJ/1111-2222.jsonl"
run_dsd --session 1111-2222
assert_eq "ended_on_api_error is true" "true" \
  "$(printf '%s' "$DSD_OUT" | jq -r '.ended_on_api_error')"
assert_eq "api_error_text is under .untrusted" "true" \
  "$(printf '%s' "$DSD_OUT" | jq -r '.untrusted.api_error_text | contains("not your usage limit")' 2>/dev/null || printf 'error')"
# ... and stays null when the last turn is an ordinary one.
printf '%s\n' "$USER_TURN" "$RL_TURN" "$ASSIST_TURN" > "$DSD_PROJ/1111-2222.jsonl"
run_dsd --session 1111-2222
assert_eq "a recovered session reports ended_on_api_error false" "false" \
  "$(printf '%s' "$DSD_OUT" | jq -r '.ended_on_api_error')"
assert_eq "api_error_text is null when the last turn is ordinary" "null" \
  "$(printf '%s' "$DSD_OUT" | jq -r '.untrusted.api_error_text')"
dsd_teardown

# --- Test 6: transient_death is delegated, and keyed on the LAST turn --------
# Delegation matters: the allowlist of self-healing signatures must stay in
# dispatch-detect-transient-death alone, with its "never add re-failing deaths"
# comment. These two cases pin the delegated semantics, not a local copy.
echo "Test: transient_death true when the rate-limit turn is LAST"
dsd_setup
printf '%s\n' "$USER_TURN" "$RL_TURN" > "$DSD_PROJ/1111-2222.jsonl"
run_dsd --session 1111-2222
assert_eq "rate-limit death as last turn → transient_death true" "true" \
  "$(printf '%s' "$DSD_OUT" | jq -r '.transient_death')"
dsd_teardown

echo "Test: transient_death false when a 529 turn is NOT last (session recovered)"
dsd_setup
printf '%s\n' "$USER_TURN" "$OVERLOAD_TURN" "$ASSIST_TURN" > "$DSD_PROJ/1111-2222.jsonl"
run_dsd --session 1111-2222
assert_eq "529 that is not the last turn → transient_death false" "false" \
  "$(printf '%s' "$DSD_OUT" | jq -r '.transient_death')"
dsd_teardown

# --- Test 7: durable_claims collects allowlisted primitives, and only those --
echo "Test: graph-commit and git push land in durable_claims; git status does not"
dsd_setup
printf '%s\n' "$USER_TURN" "$GC_TURN" "$PUSH_TURN" "$LS_TURN" "$ASSIST_TURN" \
  > "$DSD_PROJ/1111-2222.jsonl"
run_dsd --session 1111-2222
assert_eq "two durable claims recorded" "2" \
  "$(printf '%s' "$DSD_OUT" | jq -r '.durable_claims | length')"
assert_eq "graph-commit is named as the matched primitive" "yes" \
  "$(printf '%s' "$DSD_OUT" | jq -r '[.durable_claims[].tool] | index("graph-commit") != null' | grep -q true && printf 'yes' || printf 'no')"
assert_eq "git push is named as the matched primitive" "yes" \
  "$(printf '%s' "$DSD_OUT" | jq -r '[.durable_claims[].tool] | index("git push") != null' | grep -q true && printf 'yes' || printf 'no')"
# The regression that mattered while writing this: `map(select($cmd |
# contains(.)))` re-binds `.` to the COMMAND inside contains(), so every claim
# matched the first allowlist entry. Assert the mapping is per-claim correct.
assert_eq "each claim names ITS OWN primitive, not the first in the list" "git push" \
  "$(printf '%s' "$DSD_OUT" | jq -r '.durable_claims[] | select(.match | startswith("git push")) | .tool')"
assert_eq "a non-durable Bash call is not collected" "0" \
  "$(printf '%s' "$DSD_OUT" | jq -r '[.durable_claims[] | select(.match | contains("git status"))] | length')"
assert_eq "the claim carries its timestamp" "2026-08-05T01:00:05Z" \
  "$(printf '%s' "$DSD_OUT" | jq -r '.durable_claims[] | select(.tool == "graph-commit") | .ts')"
dsd_teardown

# --- Test 8: text bounds — a 4000-char message is truncated with an ellipsis --
echo "Test: an oversized message is truncated at the text cap"
dsd_setup
LONG=$(printf 'x%.0s' $(seq 1 4000))
jq -nc --arg t "$LONG" \
  '{type:"assistant",timestamp:"2026-08-05T01:00:30Z",message:{role:"assistant",content:[{type:"text",text:$t}]}}' \
  > "$DSD_PROJ/1111-2222.jsonl"
run_dsd --session 1111-2222
assert_eq "oversized transcript still exits 0" "0" "$DSD_RC"
assert_eq "text_head is capped at 512 + the ellipsis" "513" \
  "$(printf '%s' "$DSD_OUT" | jq -r '.untrusted.tail[-1].text_head | length')"
assert_eq "the truncation is marked with an ellipsis" "true" \
  "$(printf '%s' "$DSD_OUT" | jq -r '.untrusted.tail[-1].text_head | endswith("…")')"
dsd_teardown

# --- Test 9: malformed lines are skipped, never fatal ------------------------
# The real-world shape: a session killed mid-write leaves a partial last line.
# Plain `jq -c` aborts the whole stream at the first bad line (measured: exit 5),
# which would turn a partially-written transcript into a total read failure.
echo "Test: malformed JSONL lines are skipped, not fatal"
dsd_setup
{
  printf '%s\n' "$USER_TURN"
  printf '%s\n' 'NOT JSON AT ALL {{{'
  printf '%s\n' "$GC_TURN"
  printf '%s\n' '{"type":"assistant","message":{"role":'
  printf '%s\n' "$ASSIST_TURN"
} > "$DSD_PROJ/1111-2222.jsonl"
run_dsd --session 1111-2222
assert_eq "a transcript with two malformed lines still exits 0" "0" "$DSD_RC"
assert_eq "output is still valid JSON" "yes" \
  "$(printf '%s' "$DSD_OUT" | jq -e . >/dev/null 2>&1 && printf 'yes' || printf 'no')"
assert_eq "the well-formed records are still counted" "3" \
  "$(printf '%s' "$DSD_OUT" | jq -r '.turn_count')"
assert_eq "the durable claim on a good line survives" "1" \
  "$(printf '%s' "$DSD_OUT" | jq -r '.durable_claims | length')"
dsd_teardown

# --- Test 10: adversarial content cannot break the emitted object ------------
# Every free-text value crosses into jq as a typed ARGUMENT, never by string
# concatenation, so quotes/backslashes/metacharacters in a recorded command stay
# data. If this ever regresses, the output stops being parseable at all.
echo "Test: quotes and shell metacharacters in a command stay data"
dsd_setup
jq -nc '{type:"assistant",timestamp:"2026-08-05T01:00:40Z",message:{role:"assistant",content:[{type:"tool_use",name:"Bash",input:{command:"graph-commit -m \"a\\\"b\"; rm -rf / $(whoami) `id` 'q'"}}]}}' \
  > "$DSD_PROJ/1111-2222.jsonl"
run_dsd --session 1111-2222
assert_eq "adversarial command still yields valid JSON" "yes" \
  "$(printf '%s' "$DSD_OUT" | jq -e . >/dev/null 2>&1 && printf 'yes' || printf 'no')"
assert_eq "the adversarial command is recorded as a claim" "graph-commit" \
  "$(printf '%s' "$DSD_OUT" | jq -r '.durable_claims[0].tool')"
dsd_teardown

# --- Test 11: --transcript bypasses the store lookup -------------------------
echo "Test: --transcript reads the named file directly"
dsd_setup
printf '%s\n' "$USER_TURN" "$ASSIST_TURN" > "$DSD_ROOT/elsewhere.jsonl"
run_dsd --session 1111-2222 --transcript "$DSD_ROOT/elsewhere.jsonl"
assert_eq "explicit transcript exits 0 with no store entry" "0" "$DSD_RC"
assert_eq "explicit transcript is reported back" "$DSD_ROOT/elsewhere.jsonl" \
  "$(printf '%s' "$DSD_OUT" | jq -r '.transcript')"
run_dsd --session 1111-2222 --transcript "$DSD_ROOT/absent.jsonl"
assert_eq "an unreadable explicit transcript exits 1" "1" "$DSD_RC"
dsd_teardown

# --- Test 12: --tail-turns bounds the tail ----------------------------------
echo "Test: --tail-turns bounds the tail array"
dsd_setup
: > "$DSD_PROJ/1111-2222.jsonl"
for _ in $(seq 1 20); do printf '%s\n' "$ASSIST_TURN" >> "$DSD_PROJ/1111-2222.jsonl"; done
run_dsd --session 1111-2222
assert_eq "tail defaults to 12 entries" "12" \
  "$(printf '%s' "$DSD_OUT" | jq -r '.untrusted.tail | length')"
assert_eq "turn_count still counts every turn, not just the tail" "20" \
  "$(printf '%s' "$DSD_OUT" | jq -r '.turn_count')"
run_dsd --session 1111-2222 --tail-turns 3
assert_eq "--tail-turns 3 yields 3 entries" "3" \
  "$(printf '%s' "$DSD_OUT" | jq -r '.untrusted.tail | length')"
dsd_teardown

# --- Test 13: the stdout hard cap ------------------------------------------
# `truncated` means the WHOLE-OBJECT backstop fired — the per-field caps above
# are routine and never set it.
echo "Test: truncated is false on an ordinary digest"
dsd_setup
printf '%s\n' "$USER_TURN" "$ASSIST_TURN" > "$DSD_PROJ/1111-2222.jsonl"
run_dsd --session 1111-2222
assert_eq "an ordinary digest is not marked truncated" "false" \
  "$(printf '%s' "$DSD_OUT" | jq -r '.truncated')"
assert_eq "an ordinary digest is comfortably under the 64 KB cap" "yes" \
  "$( [ "${#DSD_OUT}" -lt 65536 ] && printf 'yes' || printf 'no')"
dsd_teardown

report_results
