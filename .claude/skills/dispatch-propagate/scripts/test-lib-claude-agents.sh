#!/usr/bin/env bash
# Tests for lib-claude-agents -- moved verbatim from test-dispatch-scripts.sh
# (tactic-dispatch-test-monolith-split). Original section: 7893-8522.
set -euo pipefail

FIXTURE_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=dispatch-test-fixture.sh
source "$FIXTURE_DIR/dispatch-test-fixture.sh"

# >>> MOVED FROM test-dispatch-scripts.sh >>>
# ============================================================================
# lib-claude-agents.sh tests
# ============================================================================
echo "=== lib-claude-agents.sh ==="
#
# claude_sessions_under / worktree_has_live_session are sourced directly from
# the helper and exercised against a fake `claude` — a small temp script that
# CLAUDE_AGENTS_CMD points at by absolute path, so no real daemon is needed.
# The helper functions return non-zero on the "unknown" path; the test shell
# runs under `set -e`, so every call is wrapped in an `if` to capture the code.

# shellcheck source=/dev/null
source "$SCRIPT_DIR/lib-claude-agents.sh"

CA_DIR=""
CA_FAKE=""

ca_setup() {
  CA_DIR=$(mktemp -d)
  CA_FAKE="$CA_DIR/fake-claude"
}

ca_teardown() {
  rm -rf "$CA_DIR"
  CA_DIR=""
  CA_FAKE=""
  unset CLAUDE_AGENTS_CMD
}

# write_fake_claude <stdout-payload> <exit-code> — install a fake `claude` that
# prints <stdout-payload> verbatim and exits <exit-code>, ignoring its args,
# and point CLAUDE_AGENTS_CMD at it.
write_fake_claude() {
  local payload="$1" exit_code="$2"
  printf '%s' "$payload" > "$CA_DIR/payload.json"
  cat > "$CA_FAKE" <<FAKE
#!/usr/bin/env bash
cat "$CA_DIR/payload.json"
exit $exit_code
FAKE
  chmod +x "$CA_FAKE"
  CLAUDE_AGENTS_CMD="$CA_FAKE"
}

# --- Test 1: a live session is reported by both helpers ----------------------

echo "Test: a live session is reported by both helpers"
ca_setup
# worktree_has_live_session is now name-keyed: the session name must match
# basename "$CA_DIR" for the predicate to report occupied.
ca_basename=$(basename "$CA_DIR")
write_fake_claude "[{\"sessionId\":\"sess-1\",\"pid\":4242,\"status\":\"busy\",\"name\":\"$ca_basename\"}]" 0
if out=$(claude_sessions_under "$CA_DIR"); then rc=0; else rc=$?; fi
assert_eq "live: claude_sessions_under exits 0" "0" "$rc"
assert_eq "live: claude_sessions_under prints the session TSV line" \
  "$(printf 'sess-1\t4242\tbusy\t%s' "$ca_basename")" "$out"
if worktree_has_live_session "$CA_DIR"; then live=occupied; else live=free; fi
assert_eq "live: worktree_has_live_session reports occupied" "occupied" "$live"
ca_teardown

# --- Test 2: an empty registry means no live session ------------------------

echo "Test: an empty registry means no live session"
ca_setup
write_fake_claude '[]' 0
if worktree_has_live_session "$CA_DIR"; then live=occupied; else live=free; fi
assert_eq "empty: worktree_has_live_session reports free" "free" "$live"
ca_teardown

# --- Test 3: an empty [] is success with no lines, distinct from unknown ----

echo "Test: an empty [] is a successful no-sessions result, not unknown"
ca_setup
write_fake_claude '[]' 0
if out=$(claude_sessions_under "$CA_DIR"); then rc=0; else rc=$?; fi
assert_eq "empty: claude_sessions_under exits 0 (success, not unknown)" "0" "$rc"
assert_eq "empty: claude_sessions_under prints no session lines" "" "$out"
ca_teardown

# --- Test 4: a non-zero claude exit is unknown, folded to occupied ----------

echo "Test: a daemon-query failure is unknown and folds to occupied"
ca_setup
write_fake_claude '' 1
if out=$(claude_sessions_under "$CA_DIR"); then rc=0; else rc=$?; fi
assert_eq "daemon-fail: claude_sessions_under exits non-zero (unknown)" "1" "$rc"
if worktree_has_live_session "$CA_DIR"; then live=occupied; else live=free; fi
assert_eq "daemon-fail: worktree_has_live_session reports occupied" "occupied" "$live"
ca_teardown

# --- Test 5: a missing claude binary is unknown, folded to occupied ---------

echo "Test: a missing claude binary is unknown and folds to occupied"
ca_setup
CLAUDE_AGENTS_CMD="$CA_DIR/no-such-claude"
if out=$(claude_sessions_under "$CA_DIR"); then rc=0; else rc=$?; fi
assert_eq "missing-claude: claude_sessions_under exits non-zero (unknown)" "1" "$rc"
if worktree_has_live_session "$CA_DIR"; then live=occupied; else live=free; fi
assert_eq "missing-claude: worktree_has_live_session reports occupied" "occupied" "$live"
ca_teardown

# --- Test 6: non-array output is unknown, not no-sessions -------------------

echo "Test: non-array output is unknown, not a no-sessions result"
ca_setup
write_fake_claude '{}' 0
if out=$(claude_sessions_under "$CA_DIR"); then rc=0; else rc=$?; fi
assert_eq "non-array: claude_sessions_under exits non-zero (unknown)" "1" "$rc"
ca_teardown

# --- Test 7: a multi-session array yields one TSV line per session ----------

echo "Test: a multi-session array yields one TSV line per session"
ca_setup
write_fake_claude '[{"sessionId":"s-a","pid":11,"status":"busy","name":"alpha"},{"sessionId":"s-b","pid":22,"status":"idle","name":"beta"}]' 0
if out=$(claude_sessions_under "$CA_DIR"); then rc=0; else rc=$?; fi
assert_eq "multi: claude_sessions_under exits 0" "0" "$rc"
assert_eq "multi: claude_sessions_under prints both session TSV lines" \
  "$(printf 's-a\t11\tbusy\talpha\ns-b\t22\tidle\tbeta')" "$out"
ca_teardown

# --- Test 8: a zero exit with empty output is unknown, not no-sessions ------

echo "Test: a zero exit with empty output is unknown, not a no-sessions result"
ca_setup
write_fake_claude '' 0
if out=$(claude_sessions_under "$CA_DIR"); then rc=0; else rc=$?; fi
assert_eq "empty-output: claude_sessions_under exits non-zero (unknown)" "1" "$rc"
if worktree_has_live_session "$CA_DIR"; then live=occupied; else live=free; fi
assert_eq "empty-output: worktree_has_live_session reports occupied" "occupied" "$live"
ca_teardown

# --- Test 8b: an office-hours-<N> session occupies the <N>-slug worktree ------

echo "Test: an office-hours-<N> session marks the <N>-slug worktree occupied (#1311)"
ca_setup
# A worktree basename <N>-slug; the only live session is named office-hours-<N>
# (the renamed office-hours session — distinct from the basename). The guard must
# query both names and report occupied via the office-hours-<N> match.
wt="$CA_DIR/1311-foo"
mkdir -p "$wt"
write_fake_claude '[{"sessionId":"oh-1","pid":99,"status":"busy","name":"office-hours-1311"}]' 0
if worktree_has_live_session "$wt"; then live=occupied; else live=free; fi
assert_eq "office-hours occupancy: worktree_has_live_session reports occupied" "occupied" "$live"
ca_teardown

# --- Test 8c: stopped session still occupies its worktree (#2240 byte-identical router) ---
#
# The selector now attaches stopped/paused sessions (#2240), but the shared
# worktree_has_live_session helper is deliberately NOT changed — it must still
# report a stopped session as OCCUPIED so the dispatch router hot path is
# byte-identical. This test proves that invariant.

echo "Test: stopped session still marks worktree occupied (byte-identical router, #2240)"
ca_setup
ca_basename=$(basename "$CA_DIR")
write_fake_claude "[{\"sessionId\":\"s-stop\",\"pid\":5,\"status\":\"stopped\",\"name\":\"$ca_basename\"}]" 0
if worktree_has_live_session "$CA_DIR"; then live=occupied; else live=free; fi
assert_eq "stopped occupancy: worktree_has_live_session reports occupied" "occupied" "$live"
ca_teardown

# --- Test 8d: paused session still occupies its worktree (#2240 byte-identical router) ---

echo "Test: paused session still marks worktree occupied (byte-identical router, #2240)"
ca_setup
ca_basename=$(basename "$CA_DIR")
write_fake_claude "[{\"sessionId\":\"s-pause\",\"pid\":6,\"status\":\"paused\",\"name\":\"$ca_basename\"}]" 0
if worktree_has_live_session "$CA_DIR"; then live=occupied; else live=free; fi
assert_eq "paused occupancy: worktree_has_live_session reports occupied" "occupied" "$live"
ca_teardown

# --- Test 8e: exclude_sid self-exclusion (tactic-align-tactics-self-claim-collision) ---
#
# A graph-launched /align-tactics orchestrator is spawned with
# `--name "$id"` — the same name as its own worktree basename — so its own
# just-spawned session can otherwise self-match Step 0.2's live-claim check.
# The optional exclude_sid argument lets a caller pass its own session id so
# that self-match is excluded, while a genuinely different live session under
# the same name still counts as a held claim.

echo "Test: worktree_has_live_session with exclude_sid treats a self-named-match session as free"
ca_setup
ca_basename=$(basename "$CA_DIR")
write_fake_claude "[{\"sessionId\":\"self-sess\",\"pid\":1,\"status\":\"busy\",\"name\":\"$ca_basename\"}]" 0
if worktree_has_live_session "$CA_DIR" "self-sess"; then live=occupied; else live=free; fi
assert_eq "self-exclude: only-self session with exclude_sid reports free" "free" "$live"
ca_teardown

echo "Test: worktree_has_live_session with no exclude_sid still reports occupied for the same session"
ca_setup
ca_basename=$(basename "$CA_DIR")
write_fake_claude "[{\"sessionId\":\"self-sess\",\"pid\":1,\"status\":\"busy\",\"name\":\"$ca_basename\"}]" 0
if worktree_has_live_session "$CA_DIR"; then live=occupied; else live=free; fi
assert_eq "self-exclude: same session without exclude_sid reports occupied (backward compatible)" "occupied" "$live"
ca_teardown

echo "Test: worktree_has_live_session with exclude_sid still reports occupied for a different live session"
ca_setup
ca_basename=$(basename "$CA_DIR")
write_fake_claude "[{\"sessionId\":\"other-sess\",\"pid\":2,\"status\":\"busy\",\"name\":\"$ca_basename\"}]" 0
if worktree_has_live_session "$CA_DIR" "self-sess"; then live=occupied; else live=free; fi
assert_eq "self-exclude: a different live session with the same name still reports occupied" "occupied" "$live"
ca_teardown

# The exact disambiguation exclude_sid exists to provide: exclude MY session yet
# STILL detect a concurrent OTHER session that shares the worktree name. A future
# refactor to a whole-list filter (e.g. "free if any excluded-sid row is present")
# would pass every case above yet regress here to a dangerous false-negative — two
# live sessions in one worktree reported free, allowing concurrent authoring that
# corrupts the graph-commit rebase. Assert both row orderings lock the behavior in.
echo "Test: worktree_has_live_session with exclude_sid reports occupied when self AND another live session share the name (self-first)"
ca_setup
ca_basename=$(basename "$CA_DIR")
write_fake_claude "[{\"sessionId\":\"self-sess\",\"pid\":1,\"status\":\"busy\",\"name\":\"$ca_basename\"},{\"sessionId\":\"other-sess\",\"pid\":2,\"status\":\"busy\",\"name\":\"$ca_basename\"}]" 0
if worktree_has_live_session "$CA_DIR" "self-sess"; then live=occupied; else live=free; fi
assert_eq "self-exclude: self+other under same name (self-first) reports occupied" "occupied" "$live"
ca_teardown

echo "Test: worktree_has_live_session with exclude_sid reports occupied when self AND another live session share the name (other-first)"
ca_setup
ca_basename=$(basename "$CA_DIR")
write_fake_claude "[{\"sessionId\":\"other-sess\",\"pid\":2,\"status\":\"busy\",\"name\":\"$ca_basename\"},{\"sessionId\":\"self-sess\",\"pid\":1,\"status\":\"busy\",\"name\":\"$ca_basename\"}]" 0
if worktree_has_live_session "$CA_DIR" "self-sess"; then live=occupied; else live=free; fi
assert_eq "self-exclude: self+other under same name (other-first) reports occupied" "occupied" "$live"
ca_teardown

# --- Test 9: claude_sessions_under invokes `claude` with --cwd <path> -------

echo "Test: claude_sessions_under invokes claude with --cwd <path>"
ca_setup
# A fake claude that records its argv to a file, then prints a valid empty
# registry. write_fake_claude ignores argv, so verifying the server-side
# --cwd filter is actually passed through needs a bespoke fake.
cat > "$CA_FAKE" <<FAKE
#!/usr/bin/env bash
printf '%s\n' "\$@" > "$CA_DIR/argv"
echo '[]'
FAKE
chmod +x "$CA_FAKE"
CLAUDE_AGENTS_CMD="$CA_FAKE"
if claude_sessions_under "$CA_DIR" >/dev/null; then rc=0; else rc=$?; fi
assert_eq "cwd-arg: claude_sessions_under exits 0" "0" "$rc"
assert_eq "cwd-arg: claude invoked as 'agents --json --cwd <path>'" \
  "$(printf 'agents\n--json\n--cwd\n%s' "$CA_DIR")" "$(cat "$CA_DIR/argv")"
ca_teardown

# --- Test 10: claude_agents_count_busy_workers counts busy real workers ----

echo "Test: claude_agents_count_busy_workers matches 2 busy real workers"
ca_setup
# Two busy real workers (824-foo, 720-bar → counted), one idle real worker
# (508-bar → NOT counted, busy-only), one busy router (dispatch-abcd → NOT
# counted, wrong name shape), one busy non-worker (some-human-session → NOT
# counted, wrong name shape).
write_fake_claude '[
  {"sessionId":"a","pid":1,"status":"busy","name":"824-foo"},
  {"sessionId":"b","pid":2,"status":"busy","name":"720-bar"},
  {"sessionId":"c","pid":3,"status":"idle","name":"508-bar"},
  {"sessionId":"d","pid":4,"status":"busy","name":"dispatch-abcd"},
  {"sessionId":"e","pid":5,"status":"busy","name":"some-human-session"}
]' 0
if out=$(claude_agents_count_busy_workers); then rc=0; else rc=$?; fi
assert_eq "count: exits 0" "0" "$rc"
assert_eq "count: 2 busy real workers" "2" "$out"
ca_teardown

# --- Test 11: claude_agents_count_busy_workers returns 0 for no matches ----

echo "Test: claude_agents_count_busy_workers returns 0 for no matches"
ca_setup
write_fake_claude '[{"sessionId":"a","pid":1,"status":"busy","name":"dispatch-abcd"}]' 0
if out=$(claude_agents_count_busy_workers); then rc=0; else rc=$?; fi
assert_eq "no-match: exits 0" "0" "$rc"
assert_eq "no-match: prints 0" "0" "$out"
ca_teardown

# --- Test 11b: priority/main-broken workers are still counted (#1134) -------
# The #1134 priority bypass exempts priority/main-broken work from the worker
# GATE, not the COUNT: a gate-exempt priority worker is named `<N>-slug` like any
# worker, so claude_agents_count_busy_workers must still count it. This guards
# that no priority carve-out leaked into counting — priority workers must keep
# inflating LIVE_COUNT and suppressing non-priority fan-out on later ticks.
echo "Test: claude_agents_count_busy_workers counts a priority/main-broken worker"
ca_setup
write_fake_claude '[
  {"sessionId":"a","pid":1,"status":"busy","name":"1134-priority-fix"},
  {"sessionId":"b","pid":2,"status":"busy","name":"720-bar"}
]' 0
if out=$(claude_agents_count_busy_workers); then rc=0; else rc=$?; fi
assert_eq "priority-count: exits 0" "0" "$rc"
assert_eq "priority-count: priority-named worker counted (2 total)" "2" "$out"
ca_teardown

# --- Test 12: claude_agents_count_busy_workers reports UNKNOWN on failure --

echo "Test: claude_agents_count_busy_workers returns rc 1 on daemon failure"
ca_setup
write_fake_claude '' 1
if out=$(claude_agents_count_busy_workers); then rc=0; else rc=$?; fi
assert_eq "daemon-fail: exits non-zero (UNKNOWN)" "1" "$rc"
assert_eq "daemon-fail: prints nothing" "" "$out"
ca_teardown

# --- Test 13: claude_agents_count_busy_workers rejects non-array output ----

echo "Test: claude_agents_count_busy_workers returns rc 1 on non-array output"
ca_setup
write_fake_claude '{}' 0
if out=$(claude_agents_count_busy_workers); then rc=0; else rc=$?; fi
assert_eq "non-array: exits non-zero (UNKNOWN)" "1" "$rc"
ca_teardown

# --- Test 14: router concurrency gate — skip when live >= target ----------

echo "Test: router gate skips spawn when live_count >= target_N"
ca_setup
# Three busy real workers, target = 2 → skip branch.
write_fake_claude '[
  {"sessionId":"a","pid":1,"status":"busy","name":"824-a"},
  {"sessionId":"b","pid":2,"status":"busy","name":"720-b"},
  {"sessionId":"c","pid":3,"status":"busy","name":"508-c"}
]' 0
TARGET_N=2
ROUTE=""
if LIVE_COUNT=$(claude_agents_count_busy_workers); then
  if (( LIVE_COUNT >= TARGET_N )); then
    ROUTE="skip"
  else
    ROUTE="spawn"
  fi
else
  ROUTE="spawn-failopen"
fi
assert_eq "router-gate: 3 live >= target 2 → skip" "skip" "$ROUTE"
ca_teardown

# --- Test 15: router concurrency gate — spawn when live < target ----------

echo "Test: router gate spawns when live_count < target_N"
ca_setup
write_fake_claude '[{"sessionId":"a","pid":1,"status":"busy","name":"824-a"}]' 0
TARGET_N=2
ROUTE=""
if LIVE_COUNT=$(claude_agents_count_busy_workers); then
  if (( LIVE_COUNT >= TARGET_N )); then
    ROUTE="skip"
  else
    ROUTE="spawn"
  fi
else
  ROUTE="spawn-failopen"
fi
assert_eq "router-gate: 1 live < target 2 → spawn" "spawn" "$ROUTE"
ca_teardown

# --- Test 16: router concurrency gate — fail open when daemon UNKNOWN -----

echo "Test: router gate fails open to spawn when daemon UNKNOWN"
ca_setup
write_fake_claude '' 1
TARGET_N=2
ROUTE=""
if LIVE_COUNT=$(claude_agents_count_busy_workers); then
  if (( LIVE_COUNT >= TARGET_N )); then
    ROUTE="skip"
  else
    ROUTE="spawn"
  fi
else
  ROUTE="spawn-failopen"
fi
assert_eq "router-gate: daemon UNKNOWN → spawn-failopen" "spawn-failopen" "$ROUTE"
ca_teardown

# --- Test 17: claude_sessions_with_name — matched name exits 0 with TSV -----

echo "Test: claude_sessions_with_name exits 0 and emits TSV for matched name"
ca_setup
write_fake_claude '[{"sessionId":"sess-a","pid":111,"status":"busy","name":"my-worktree"}]' 0
if out=$(claude_sessions_with_name "my-worktree"); then rc=0; else rc=$?; fi
assert_eq "name-match: exits 0" "0" "$rc"
assert_eq "name-match: prints the TSV line" \
  "$(printf 'sess-a\t111\tbusy\tmy-worktree')" "$out"
ca_teardown

# --- Test 18: claude_sessions_with_name — no match exits 0 with no output ---

echo "Test: claude_sessions_with_name exits 0 and emits nothing when name not found"
ca_setup
write_fake_claude '[{"sessionId":"sess-a","pid":111,"status":"busy","name":"other-worktree"}]' 0
if out=$(claude_sessions_with_name "my-worktree"); then rc=0; else rc=$?; fi
assert_eq "name-no-match: exits 0" "0" "$rc"
assert_eq "name-no-match: prints nothing" "" "$out"
ca_teardown

# --- Test 19: claude_sessions_with_name — multi-session, only matching names -

echo "Test: claude_sessions_with_name emits only the matching sessions from a mixed array"
ca_setup
write_fake_claude '[
  {"sessionId":"s-1","pid":10,"status":"busy","name":"target-wt"},
  {"sessionId":"s-2","pid":20,"status":"idle","name":"other-wt"},
  {"sessionId":"s-3","pid":30,"status":"busy","name":"target-wt"}
]' 0
if out=$(claude_sessions_with_name "target-wt"); then rc=0; else rc=$?; fi
assert_eq "name-multi: exits 0" "0" "$rc"
assert_eq "name-multi: prints only the two matching lines" \
  "$(printf 's-1\t10\tbusy\ttarget-wt\ns-3\t30\tbusy\ttarget-wt')" "$out"
ca_teardown

# --- Test 20: claude_sessions_with_name UNKNOWN cases ------------------------

echo "Test: claude_sessions_with_name returns rc 1 on daemon failure (non-zero exit)"
ca_setup
write_fake_claude '' 1
if out=$(claude_sessions_with_name "my-worktree"); then rc=0; else rc=$?; fi
assert_eq "name-daemon-fail: exits 1 (UNKNOWN)" "1" "$rc"
assert_eq "name-daemon-fail: prints nothing" "" "$out"
ca_teardown

echo "Test: claude_sessions_with_name returns rc 1 when claude binary is missing"
ca_setup
CLAUDE_AGENTS_CMD="$CA_DIR/no-such-claude"
if out=$(claude_sessions_with_name "my-worktree"); then rc=0; else rc=$?; fi
assert_eq "name-missing-claude: exits 1 (UNKNOWN)" "1" "$rc"
ca_teardown

echo "Test: claude_sessions_with_name returns rc 1 on non-array JSON output"
ca_setup
write_fake_claude '{}' 0
if out=$(claude_sessions_with_name "my-worktree"); then rc=0; else rc=$?; fi
assert_eq "name-non-array: exits 1 (UNKNOWN)" "1" "$rc"
ca_teardown

echo "Test: claude_sessions_with_name returns rc 1 on zero exit with empty output"
ca_setup
write_fake_claude '' 0
if out=$(claude_sessions_with_name "my-worktree"); then rc=0; else rc=$?; fi
assert_eq "name-empty-output: exits 1 (UNKNOWN)" "1" "$rc"
ca_teardown

# --- Test 21: claude_sessions_with_name — invoked WITHOUT --cwd arg ----------

echo "Test: claude_sessions_with_name invokes claude without a --cwd argument"
ca_setup
cat > "$CA_FAKE" <<FAKE
#!/usr/bin/env bash
printf '%s\n' "\$@" > "$CA_DIR/argv"
echo '[]'
FAKE
chmod +x "$CA_FAKE"
CLAUDE_AGENTS_CMD="$CA_FAKE"
if claude_sessions_with_name "any-name" >/dev/null; then rc=0; else rc=$?; fi
assert_eq "name-no-cwd: exits 0" "0" "$rc"
assert_eq "name-no-cwd: claude invoked as 'agents --json' (no --cwd)" \
  "$(printf 'agents\n--json')" "$(cat "$CA_DIR/argv")"
ca_teardown

# --- Test 22: claude_sessions_with_name — empty name arg exits 1 -------------

echo "Test: claude_sessions_with_name rejects empty name argument"
ca_setup
write_fake_claude '[]' 0
if out=$(claude_sessions_with_name "" 2>/dev/null); then rc=0; else rc=$?; fi
assert_eq "name-empty-arg: exits 1" "1" "$rc"
ca_teardown

# --- Test 23 (updated worktree_has_live_session): cwd-match but wrong name → FREE

echo "Test: worktree_has_live_session reports free when session cwd matches but name differs from basename"
ca_setup
# The session's cwd could match CA_DIR, but its name does NOT match basename "$CA_DIR".
# Under the old cwd-based semantics this would have reported occupied (via
# claude_sessions_under). Under the new name-based semantics it must report free.
# The fake returns a session whose name is 'wrong-name', not basename "$CA_DIR".
write_fake_claude '[{"sessionId":"s-x","pid":99,"status":"busy","name":"wrong-name"}]' 0
if worktree_has_live_session "$CA_DIR"; then live=occupied; else live=free; fi
assert_eq "regression-guard: cwd-match wrong-name → free" "free" "$live"
ca_teardown

# --- Test 24: verify_agent_registered_under skips a stopped row --------------

echo "Test: verify_agent_registered_under does not count a stopped session as registered"
ca_setup
export LIB_CLAUDE_AGENTS_VERIFY_INTERVAL_S=0
# A row whose name matches the target but whose status is "stopped" must not
# satisfy the verify — only a live successor counts (mirrors the dedup guards).
write_fake_claude '[{"sessionId":"s-1","pid":7,"status":"stopped","name":"dispatch-dead"}]' 0
if verify_agent_registered_under "dispatch-dead" "$CA_DIR"; then rc=0; else rc=$?; fi
assert_eq "verify-stopped: stopped row is not registered (rc 1)" "1" "$rc"
# Positive control: a live row with the same name does satisfy the verify.
write_fake_claude '[{"sessionId":"s-1","pid":7,"status":"busy","name":"dispatch-live"}]' 0
if verify_agent_registered_under "dispatch-live" "$CA_DIR"; then rc=0; else rc=$?; fi
assert_eq "verify-live: busy row is registered (rc 0)" "0" "$rc"
unset LIB_CLAUDE_AGENTS_VERIFY_INTERVAL_S
ca_teardown

# --- Test 25: verify_agent_registered_under rejects a non-numeric interval ---

echo "Test: verify_agent_registered_under rejects a non-numeric interval override"
ca_setup
# `inf` is a valid GNU `sleep` argument that would hang the verify forever. The
# guard must reject it, warn on stderr, and fall back to the 0.2 s default so
# the call still returns (here: exhausts to rc 1 against an empty registry).
export LIB_CLAUDE_AGENTS_VERIFY_INTERVAL_S=inf
write_fake_claude '[]' 0
if err=$(verify_agent_registered_under "dispatch-x" "$CA_DIR" 2>&1 1>/dev/null); then rc=0; else rc=$?; fi
assert_eq "verify-bad-interval: exhausts and returns 1" "1" "$rc"
TOTAL=$((TOTAL + 1))
if printf '%s' "$err" | grep -q "is not a non-negative number"; then
  PASS=$((PASS + 1)); echo "  PASS: verify-bad-interval: warns and falls back to default"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: verify-bad-interval: warns and falls back to default"
fi
unset LIB_CLAUDE_AGENTS_VERIFY_INTERVAL_S
ca_teardown

# --- Test 26: claude_agents_list_all UNKNOWN on a missing claude binary -------

echo "Test: claude_agents_list_all returns rc 1 (UNKNOWN) when claude binary is missing"
ca_setup
CLAUDE_AGENTS_CMD="$CA_DIR/no-such-claude"
if out=$(claude_agents_list_all); then rc=0; else rc=$?; fi
assert_eq "list-all missing-claude: exits 1 (UNKNOWN)" "1" "$rc"
assert_eq "list-all missing-claude: prints nothing" "" "$out"
ca_teardown

# --- Test 27: claude_agents_list_all — empty [] is success with no lines ------

echo "Test: claude_agents_list_all returns 0 with empty stdout for an empty registry"
ca_setup
write_fake_claude '[]' 0
if out=$(claude_agents_list_all); then rc=0; else rc=$?; fi
assert_eq "list-all empty: exits 0 (definite zero, not UNKNOWN)" "0" "$rc"
assert_eq "list-all empty: prints no session lines" "" "$out"
ca_teardown

# --- Test 28: claude_agents_list_all — multi-session 3-column TSV (no pid) ----

echo "Test: claude_agents_list_all emits a 3-column sessionId/status/name TSV per session"
ca_setup
write_fake_claude '[{"sessionId":"id1","pid":11,"status":"busy","name":"name1"},{"sessionId":"id2","pid":22,"status":"idle","name":"name2"}]' 0
if out=$(claude_agents_list_all); then rc=0; else rc=$?; fi
assert_eq "list-all multi: exits 0" "0" "$rc"
assert_eq "list-all multi: prints 3-column TSV (sessionId/status/name, no pid)" \
  "$(printf 'id1\tbusy\tname1\nid2\tidle\tname2')" "$out"
ca_teardown

# --- Test 29: claude_agents_list_all — non-array output is UNKNOWN ------------

echo "Test: claude_agents_list_all returns rc 1 (UNKNOWN) on non-array JSON output"
ca_setup
write_fake_claude '{}' 0
if out=$(claude_agents_list_all); then rc=0; else rc=$?; fi
assert_eq "list-all non-array: exits 1 (UNKNOWN)" "1" "$rc"
ca_teardown

# --- live_session_claimed_nums (#1474) ---------------------------------------
# Selection's forward in-flight claimed half: maps each live-session NAME to its
# claimed <N>. A phase-worker name `<N>-slug` and an `office-hours-<N>` name each
# contribute <N>; routers (`dispatch-<short-id>`) and job sessions (diagnose-main,
# jit names) match neither shape and are excluded. `[]` → empty + rc 0;
# whitespace/empty raw output → rc 1 (UNKNOWN). Output is uniqued.

# --- Test 30: live_session_claimed_nums — phase-worker <N>-slug → <N> ---------
echo "Test: live_session_claimed_nums maps a <N>-slug phase worker to <N>"
ca_setup
write_fake_claude '[{"sessionId":"s1","pid":1,"status":"busy","name":"42-add-thing"}]' 0
if out=$(live_session_claimed_nums); then rc=0; else rc=$?; fi
assert_eq "live-claimed phase-worker: exits 0" "0" "$rc"
assert_eq "live-claimed phase-worker: <N>-slug → 42" "42" "$out"
ca_teardown

# --- Test 31: live_session_claimed_nums — office-hours-<N> → <N> --------------
echo "Test: live_session_claimed_nums maps an office-hours-<N> session to <N>"
ca_setup
write_fake_claude '[{"sessionId":"s1","pid":1,"status":"busy","name":"office-hours-77"}]' 0
if out=$(live_session_claimed_nums); then rc=0; else rc=$?; fi
assert_eq "live-claimed office-hours: exits 0" "0" "$rc"
assert_eq "live-claimed office-hours: office-hours-77 → 77" "77" "$out"
ca_teardown

# --- Test 32: live_session_claimed_nums — router/job names are excluded -------
echo "Test: live_session_claimed_nums excludes router and job session names"
ca_setup
# A router (dispatch-<short-id>), a diagnose-main job, and a jit-style name —
# none match `^[0-9]+-` or `^office-hours-[0-9]+$`, so none contribute a claim.
write_fake_claude '[{"sessionId":"s1","pid":1,"status":"busy","name":"dispatch-ab12cd"},{"sessionId":"s2","pid":2,"status":"busy","name":"diagnose-main"},{"sessionId":"s3","pid":3,"status":"busy","name":"digest"}]' 0
if out=$(live_session_claimed_nums); then rc=0; else rc=$?; fi
assert_eq "live-claimed router/job: exits 0" "0" "$rc"
assert_eq "live-claimed router/job: no claims emitted" "" "$out"
ca_teardown

# --- Test 33: live_session_claimed_nums — empty [] registry → rc 0, no output -
echo "Test: live_session_claimed_nums returns 0 with empty output for an empty registry"
ca_setup
write_fake_claude '[]' 0
if out=$(live_session_claimed_nums); then rc=0; else rc=$?; fi
assert_eq "live-claimed empty: exits 0 (definite zero, not UNKNOWN)" "0" "$rc"
assert_eq "live-claimed empty: no claims emitted" "" "$out"
ca_teardown

# --- Test 34: live_session_claimed_nums — UNKNOWN on a missing/empty daemon ---
echo "Test: live_session_claimed_nums returns rc 1 (UNKNOWN) on empty raw output"
ca_setup
# A fake that exits 0 but prints nothing → whitespace/empty raw output is UNKNOWN
# (indistinguishable from a down daemon), so the helper returns 1.
write_fake_claude '' 0
if out=$(live_session_claimed_nums); then rc=0; else rc=$?; fi
assert_eq "live-claimed empty-raw: exits 1 (UNKNOWN)" "1" "$rc"
assert_eq "live-claimed empty-raw: prints nothing" "" "$out"
# And a missing binary is UNKNOWN too.
CLAUDE_AGENTS_CMD="$CA_DIR/no-such-claude"
if out=$(live_session_claimed_nums); then rc=0; else rc=$?; fi
assert_eq "live-claimed missing-claude: exits 1 (UNKNOWN)" "1" "$rc"
ca_teardown

# --- Test 35: live_session_claimed_nums — uniqueness across same-<N> sessions -
echo "Test: live_session_claimed_nums emits each claimed <N> once across sibling sessions"
ca_setup
# Two live sessions on the same <N> (a phase worker and an office-hours session,
# plus a second <N>-slug) → <N>=10 must appear exactly once; 20 once.
write_fake_claude '[{"sessionId":"s1","pid":1,"status":"busy","name":"10-a"},{"sessionId":"s2","pid":2,"status":"busy","name":"10-b"},{"sessionId":"s3","pid":3,"status":"busy","name":"office-hours-10"},{"sessionId":"s4","pid":4,"status":"busy","name":"20-c"}]' 0
if out=$(live_session_claimed_nums); then rc=0; else rc=$?; fi
assert_eq "live-claimed unique: exits 0" "0" "$rc"
# Sort the output so the assertion is independent of jq's unique() ordering.
assert_eq "live-claimed unique: 10 and 20 each once" \
  "$(printf '10\n20')" "$(printf '%s\n' "$out" | sort -n)"
ca_teardown

# --- claude_agents_list_blocked_workers ---------------------------------------
# Emits sessionId<TAB>name<TAB>cwd for live worker sessions with state ==
# "blocked", excluding routers (dispatch-<short-id>). Reads via
# _claude_agents_raw (snapshot-aware), never `--all` directly, since a blocked
# session is already visible in the default listing.

# --- Test 36: mixed registry — only blocked workers emitted, router excluded --
echo "Test: claude_agents_list_blocked_workers emits only blocked worker rows, router excluded"
ca_setup
write_fake_claude '[
  {"sessionId":"s-busy","pid":1,"status":"busy","state":"working","name":"tactic-foo-bar"},
  {"sessionId":"s-blocked-tactic","pid":2,"status":"idle","state":"blocked","name":"tactic-baz-qux"},
  {"sessionId":"s-blocked-router","pid":3,"status":"idle","state":"blocked","name":"dispatch-abc123","cwd":"/wt/router"},
  {"sessionId":"s-blocked-num","pid":4,"status":"idle","state":"blocked","name":"123-slug","cwd":"/wt/123-slug"}
]' 0
if out=$(claude_agents_list_blocked_workers); then rc=0; else rc=$?; fi
assert_eq "blocked-mixed: exits 0" "0" "$rc"
assert_eq "blocked-mixed: only the two worker rows, router excluded" \
  "$(printf 's-blocked-tactic\ttactic-baz-qux\t\ns-blocked-num\t123-slug\t/wt/123-slug')" "$out"
ca_teardown

# --- Test 37: no blocked rows → rc 0, empty stdout -----------------------------
echo "Test: claude_agents_list_blocked_workers returns 0 with empty stdout when nothing is blocked"
ca_setup
write_fake_claude '[{"sessionId":"a","pid":1,"status":"busy","state":"working","name":"tactic-foo"}]' 0
if out=$(claude_agents_list_blocked_workers); then rc=0; else rc=$?; fi
assert_eq "blocked-none: exits 0" "0" "$rc"
assert_eq "blocked-none: prints nothing" "" "$out"
ca_teardown

# --- Test 38: empty [] registry → rc 0, empty stdout (definite none) ----------
echo "Test: claude_agents_list_blocked_workers returns 0 with empty stdout for an empty registry"
ca_setup
write_fake_claude '[]' 0
if out=$(claude_agents_list_blocked_workers); then rc=0; else rc=$?; fi
assert_eq "blocked-empty: exits 0 (definite zero, not UNKNOWN)" "0" "$rc"
assert_eq "blocked-empty: prints nothing" "" "$out"
ca_teardown

# --- Test 39: daemon failure (non-zero exit) → rc 1, empty stdout -------------
echo "Test: claude_agents_list_blocked_workers returns rc 1 on daemon failure"
ca_setup
write_fake_claude '' 1
if out=$(claude_agents_list_blocked_workers); then rc=0; else rc=$?; fi
assert_eq "blocked-daemon-fail: exits non-zero (UNKNOWN)" "1" "$rc"
assert_eq "blocked-daemon-fail: prints nothing" "" "$out"
ca_teardown

# --- Test 40: non-array output → rc 1 -------------------------------------------
echo "Test: claude_agents_list_blocked_workers returns rc 1 on non-array JSON output"
ca_setup
write_fake_claude '{}' 0
if out=$(claude_agents_list_blocked_workers); then rc=0; else rc=$?; fi
assert_eq "blocked-non-array: exits non-zero (UNKNOWN)" "1" "$rc"
ca_teardown

# --- Test 41: null/absent name does not abort the pass -------------------------
echo "Test: claude_agents_list_blocked_workers tolerates a null/absent name without aborting"
ca_setup
write_fake_claude '[
  {"sessionId":"s-null","pid":1,"status":"idle","state":"blocked","name":null},
  {"sessionId":"s-absent","pid":2,"status":"idle","state":"blocked"},
  {"sessionId":"s-ok","pid":3,"status":"idle","state":"blocked","name":"tactic-good","cwd":"/wt/good"}
]' 0
if out=$(claude_agents_list_blocked_workers); then rc=0; else rc=$?; fi
assert_eq "blocked-null-name: exits 0" "0" "$rc"
assert_eq "blocked-null-name: only the valid-name row is emitted" \
  "$(printf 's-ok\ttactic-good\t/wt/good')" "$out"
ca_teardown

# --- Test 42: snapshot faithfulness — reads DISPATCH_AGENTS_SNAPSHOT, not claude -
echo "Test: claude_agents_list_blocked_workers reads DISPATCH_AGENTS_SNAPSHOT, never invoking a failing claude"
ca_setup
snapshot_file="$CA_DIR/snapshot.json"
printf '%s' '[{"sessionId":"s-snap","pid":1,"status":"idle","state":"blocked","name":"tactic-from-snapshot","cwd":"/wt/snap"}]' > "$snapshot_file"
# Point CLAUDE_AGENTS_CMD at a fake that would fail if invoked, proving the
# snapshot path is used instead of a live daemon query.
write_fake_claude '' 1
export DISPATCH_AGENTS_SNAPSHOT="$snapshot_file"
if out=$(claude_agents_list_blocked_workers); then rc=0; else rc=$?; fi
unset DISPATCH_AGENTS_SNAPSHOT
assert_eq "blocked-snapshot: exits 0 despite a failing claude fake" "0" "$rc"
assert_eq "blocked-snapshot: reads the snapshot content" \
  "$(printf 's-snap\ttactic-from-snapshot\t/wt/snap')" "$out"
ca_teardown

# <<< END MOVED <<<

report_results
