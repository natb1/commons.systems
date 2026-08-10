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
# Path to the "no daemon process visible" probe stub for the case in scope; set
# by ca_install_probe_stubs alongside the default (visible) stub.
CA_PROBE_ABSENT=""

# ca_install_probe_stubs <dir> — install both empty-read corroboration probe
# stubs in <dir> and DEFAULT the seam to "daemon visible".
#
# The library only trusts an exactly-`[]` registry payload when a `claude
# daemon` process corroborates it. Without an override the probe would shell out
# to the HOST's real pgrep, so every `write_fake_claude '[]' 0` case would pass
# or fail depending on whether this machine happens to run a daemon. Defaulting
# to exit 0 preserves the pre-existing meaning of every `[]` fake: a definite
# "no sessions". A case that wants the blocked-read shape points the seam at
# $CA_PROBE_ABSENT.
ca_install_probe_stubs() {
  local dir="$1"
  printf '#!/usr/bin/env bash\nexit 0\n' > "$dir/pgrep-daemon-visible"
  printf '#!/usr/bin/env bash\nexit 1\n' > "$dir/pgrep-daemon-absent"
  chmod +x "$dir/pgrep-daemon-visible" "$dir/pgrep-daemon-absent"
  CA_PROBE_ABSENT="$dir/pgrep-daemon-absent"
  export CLAUDE_AGENTS_PGREP_CMD="$dir/pgrep-daemon-visible"
}

ca_setup() {
  CA_DIR=$(mktemp -d)
  CA_FAKE="$CA_DIR/fake-claude"
  ca_install_probe_stubs "$CA_DIR"
}

ca_teardown() {
  rm -rf "$CA_DIR"
  CA_DIR=""
  CA_FAKE=""
  CA_PROBE_ABSENT=""
  unset CLAUDE_AGENTS_PGREP_CMD
  # DISPATCH_AGENTS_SNAPSHOT_ALL is unset here too so the registered-view
  # snapshot set by a ca_all_* case can never leak into a case using this
  # (older) pair — a stale snapshot would shadow the fake daemon entirely.
  unset CLAUDE_AGENTS_CMD DISPATCH_AGENTS_SNAPSHOT_ALL
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

# --- Test 8b2: a non-numeric basename prefix forms NO office-hours key --------
#
# The office-hours key is `office-hours-<N>` with a NUMERIC <N>. A graph-node
# worktree is named by node id (`tactic-*` / `strategy-*`), so deriving the key
# as "basename up to the first dash" would yield `office-hours-tactic` — a key
# SHARED by every tactic worktree. One session registered under that name would
# then claim all of them at once (and, in the registered view, hold that claim
# with no expiry). The key must only be formed from a real numeric prefix.

echo "Test: a non-numeric basename prefix forms no office-hours key (shared-key claim)"
ca_setup
for wt_base in tactic-foo-bar strategy-foo-bar; do
  wt="$CA_DIR/$wt_base"
  mkdir -p "$wt"
  oh_name="office-hours-${wt_base%%-*}"
  write_fake_claude "[{\"sessionId\":\"oh-x\",\"pid\":98,\"status\":\"busy\",\"name\":\"$oh_name\"}]" 0
  if worktree_has_live_session "$wt"; then live=occupied; else live=free; fi
  assert_eq "shared-key claim: $oh_name does not occupy $wt_base" "free" "$live"
done
# The basename match itself is unaffected.
write_fake_claude '[{"sessionId":"n-1","pid":97,"status":"busy","name":"tactic-foo-bar"}]' 0
if worktree_has_live_session "$CA_DIR/tactic-foo-bar"; then live=occupied; else live=free; fi
assert_eq "shared-key claim: exact node-name match still occupies" "occupied" "$live"
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

# --- REGISTERED view: a stopped-but-not-removed session still holds its node --
# (tactic-stopped-session-blocks-node, Unit 3)
#
# These cases use `office_hours_state_fake_claude` from dispatch-test-fixture.sh
# — NOT the `write_fake_claude` above, which is argv-blind (it `cat`s the same
# payload whatever flags it was called with) and so structurally cannot express
# the ACTIVE/REGISTERED split. The fixture fake is `--all`-faithful; quoting its
# contract comment (dispatch-test-fixture.sh, "--all FAITHFULNESS"):
#
#   "Production hides `done` sessions from the default `claude agents --json`
#    and surfaces them ONLY under `--all`. This fake mirrors that exactly: on
#    `agents`, it scans argv for `--all`; if present it returns the FULL payload
#    (including any `done` rows), and if absent it returns the payload with
#    `done` rows stripped. ... (A naive fake that returned `done` regardless of
#    `--all` would let a `--all`-forgetting path still pass.)"
#
# Its pairs are `name:state[:cwd]`; a row is sessionId `s-<name>`, job id
# `j-<name>`, status JSON "busy" iff state == "working" (else null), name
# `<name>`. It writes $TMPDIR_TEST/bin/claude and $TMPDIR_TEST/claude-payload.json
# and exports both CLAUDE_AGENTS_CMD and OFFICE_HOURS_CLAUDE_CMD — hence the
# dedicated setup/teardown below, which (unlike ca_setup) provides TMPDIR_TEST
# with a `bin/` exactly one level under it, the layout the fake's relative
# payload lookup requires.

ca_all_setup() {
  TMPDIR_TEST=$(mktemp -d)
  mkdir -p "$TMPDIR_TEST/bin"
  # Same empty-read corroboration default as ca_setup — the `--all`-faithful
  # fake serves `[]` on the ACTIVE view whenever every row is `done`, so these
  # cases hit the corroboration path too.
  ca_install_probe_stubs "$TMPDIR_TEST"
}
ca_all_teardown() {
  rm -rf "$TMPDIR_TEST"
  TMPDIR_TEST=""
  CA_PROBE_ABSENT=""
  unset CLAUDE_AGENTS_PGREP_CMD
  unset CLAUDE_AGENTS_CMD OFFICE_HOURS_CLAUDE_CMD DISPATCH_AGENTS_SNAPSHOT_ALL
}

# ca_all_raw_fake <stdout-payload> <exit-code> — install a one-off fake `claude`
# at $TMPDIR_TEST/bin/claude that prints <stdout-payload> and exits <exit-code>,
# ignoring argv. Used ONLY by the UNKNOWN fail-safe cases, where the ACTIVE /
# REGISTERED distinction is irrelevant (the query never returns a usable array).
# Deliberately separate from write_fake_claude, which is keyed on CA_DIR/CA_FAKE
# from the other setup pair.
ca_all_raw_fake() {
  local payload="$1" exit_code="$2"
  printf '%s' "$payload" > "$TMPDIR_TEST/raw-payload.json"
  cat > "$TMPDIR_TEST/bin/claude" <<FAKE
#!/usr/bin/env bash
cat "$TMPDIR_TEST/raw-payload.json"
exit $exit_code
FAKE
  chmod +x "$TMPDIR_TEST/bin/claude"
  export CLAUDE_AGENTS_CMD="$TMPDIR_TEST/bin/claude"
}

# --- Test 43: THE REQUIREMENT — a `done` session still occupies its worktree --
echo "Test: worktree_has_live_session reports occupied for a done-but-not-removed session"
ca_all_setup
mkdir -p "$TMPDIR_TEST/wt/tactic-foo"
office_hours_state_fake_claude "tactic-foo:done"
if worktree_has_live_session "$TMPDIR_TEST/wt/tactic-foo"; then live=occupied; else live=free; fi
assert_eq "registered done: worktree_has_live_session reports occupied" "occupied" "$live"
ca_all_teardown

# --- Test 44: the discriminator that makes Test 43 non-vacuous ---------------
# Same fake, ACTIVE accessor: the `done` row MUST be invisible without `--all`.
# If a future regression drops `--all` from claude_agents_list_registered, the
# registered accessor collapses onto this (empty) view and Test 43 flips red —
# which is exactly what this case proves is possible. Both halves are asserted:
# rc 0 (a definite answer, not UNKNOWN) AND the absence of the name.
echo "Test: the --all-faithful fake hides the done row from the ACTIVE view"
ca_all_setup
office_hours_state_fake_claude "tactic-foo:done"
if out=$(claude_agents_list_all); then rc=0; else rc=$?; fi
assert_eq "active view of a done row: exits 0 (definite, not UNKNOWN)" "0" "$rc"
assert_not_contains_local "active view of a done row: the done session is NOT listed" \
  "tactic-foo" "$out"
ca_all_teardown

# --- Test 45: claude_agents_list_registered 4-column shape -------------------
echo "Test: claude_agents_list_registered emits working AND done rows with the state column"
ca_all_setup
office_hours_state_fake_claude "tactic-a:working" "tactic-b:done"
if out=$(claude_agents_list_registered); then rc=0; else rc=$?; fi
assert_eq "list-registered mixed: exits 0" "0" "$rc"
# Columns 1-3 are byte-identical to claude_agents_list_all's projection
# (sessionId/status/name); .state is appended as column 4. status is JSON null
# for a non-working row, which @tsv renders as an EMPTY field (not defaulted).
assert_eq "list-registered mixed: working row is s-tactic-a/busy/tactic-a/working" \
  "$(printf 's-tactic-a\tbusy\ttactic-a\tworking')" \
  "$(printf '%s\n' "$out" | awk -F'\t' '$3 == "tactic-a"')"
assert_eq "list-registered mixed: done row carries state=done in column 4" \
  "done" "$(printf '%s\n' "$out" | awk -F'\t' '$3 == "tactic-b" { print $4 }')"
ca_all_teardown

# --- Test 46: a held node does NOT consume the fleet's concurrency budget ----
# Unit 1's explicit out-of-scope boundary: the pace/concurrency gate stays on
# the ACTIVE view, so a done session burns no budget.
echo "Test: claude_agents_count_busy_workers counts 0 when the only session is done"
ca_all_setup
office_hours_state_fake_claude "tactic-foo:done"
if out=$(claude_agents_count_busy_workers); then rc=0; else rc=$?; fi
assert_eq "busy-count done-only: exits 0" "0" "$rc"
assert_eq "busy-count done-only: counts 0 (a held node is not a busy worker)" "0" "$out"
ca_all_teardown

# --- Test 47: dead-router reclaim is unaffected (the fleet-stall guard) ------
# reservation_sweep rule (c) reclaims a marker when its reserving session id has
# left the LIVE set. Reserving sessions are routers (`dispatch-<short-id>`) that
# routinely go done — if a done router stayed visible to claude_agents_list_all,
# its marker would become immortal, reservation_count would climb monotonically,
# and LIVE_COUNT would pin at the ceiling, stalling the whole fleet.
echo "Test: claude_agents_list_all still drops a done router row (reservation-reclaim guard)"
ca_all_setup
office_hours_state_fake_claude "dispatch-abc:done"
if out=$(claude_agents_list_all); then rc=0; else rc=$?; fi
assert_eq "active view of a done router: exits 0" "0" "$rc"
assert_eq "active view of a done router: emits no session lines" "" "$out"
ca_all_teardown

# --- Test 48: the registered snapshot short-circuits the daemon query --------
# DISPATCH_AGENTS_SNAPSHOT_ALL names a captured `claude agents --json --all`
# array. CLAUDE_AGENTS_CMD points at a nonexistent binary, so any fallthrough to
# a live query would fail; occupancy must still be answered from the snapshot.
echo "Test: worktree_has_live_session reads DISPATCH_AGENTS_SNAPSHOT_ALL, not the daemon"
ca_all_setup
mkdir -p "$TMPDIR_TEST/wt/tactic-snap"
printf '%s' '[{"sessionId":"s-tactic-snap","id":"j-tactic-snap","pid":1,"state":"done","status":null,"name":"tactic-snap","cwd":""}]' \
  > "$TMPDIR_TEST/snapshot-all.json"
export DISPATCH_AGENTS_SNAPSHOT_ALL="$TMPDIR_TEST/snapshot-all.json"
export CLAUDE_AGENTS_CMD="$TMPDIR_TEST/no-such-claude"
# Asserted first so the occupancy result below cannot be a fail-safe in
# disguise: rc 0 with the row present proves the snapshot was genuinely read.
if out=$(claude_agents_list_registered); then rc=0; else rc=$?; fi
assert_eq "snapshot-all: list-registered exits 0 from the snapshot alone" "0" "$rc"
assert_contains_local "snapshot-all: the snapshot's done row is projected" \
  "tactic-snap" "$out"
if worktree_has_live_session "$TMPDIR_TEST/wt/tactic-snap"; then live=occupied; else live=free; fi
assert_eq "snapshot-all: worktree_has_live_session reports occupied" "occupied" "$live"
ca_all_teardown

# --- Test 49: UNKNOWN fail-safe preserved on the registered accessor ---------
# Three UNKNOWN shapes — missing binary, zero exit with empty output, zero exit
# with non-array output. Each must yield rc 1 + empty stdout from
# claude_agents_list_registered, and OCCUPIED from worktree_has_live_session.
echo "Test: claude_agents_list_registered returns rc 1 (UNKNOWN) and the predicate fails safe"
ca_all_setup
export CLAUDE_AGENTS_CMD="$TMPDIR_TEST/no-such-claude"
if out=$(claude_agents_list_registered); then rc=0; else rc=$?; fi
assert_eq "registered missing-claude: exits 1 (UNKNOWN)" "1" "$rc"
assert_eq "registered missing-claude: prints nothing" "" "$out"
if worktree_has_live_session "$TMPDIR_TEST/wt/tactic-foo"; then live=occupied; else live=free; fi
assert_eq "registered missing-claude: predicate fails safe (occupied)" "occupied" "$live"
ca_all_raw_fake '   ' 0
if out=$(claude_agents_list_registered); then rc=0; else rc=$?; fi
assert_eq "registered empty-output: exits 1 (UNKNOWN)" "1" "$rc"
assert_eq "registered empty-output: prints nothing" "" "$out"
if worktree_has_live_session "$TMPDIR_TEST/wt/tactic-foo"; then live=occupied; else live=free; fi
assert_eq "registered empty-output: predicate fails safe (occupied)" "occupied" "$live"
ca_all_raw_fake '{}' 0
if out=$(claude_agents_list_registered); then rc=0; else rc=$?; fi
assert_eq "registered non-array: exits 1 (UNKNOWN)" "1" "$rc"
assert_eq "registered non-array: prints nothing" "" "$out"
if worktree_has_live_session "$TMPDIR_TEST/wt/tactic-foo"; then live=occupied; else live=free; fi
assert_eq "registered non-array: predicate fails safe (occupied)" "occupied" "$live"
ca_all_teardown

# --- Test 50: exclude_sid still applies on the registered view ---------------
# The self-exclusion seam (a caller spawned with --name=<basename> must not match
# its OWN session) must survive the switch from the active to the registered
# accessor — the match is still keyed on column 1.
echo "Test: exclude_sid excludes the caller's own registered session"
ca_all_setup
mkdir -p "$TMPDIR_TEST/wt/tactic-foo"
office_hours_state_fake_claude "tactic-foo:done"
if worktree_has_live_session "$TMPDIR_TEST/wt/tactic-foo" "s-tactic-foo"; then live=occupied; else live=free; fi
assert_eq "exclude_sid on registered view: own session does not self-block" "free" "$live"
if worktree_has_live_session "$TMPDIR_TEST/wt/tactic-foo"; then live=occupied; else live=free; fi
assert_eq "exclude_sid omitted: the same row still occupies" "occupied" "$live"
ca_all_teardown

# --- Test 51: the operator diagnostic for a done holder ----------------------
# A done holder is the non-obvious case: nothing is running, yet the node stays
# blocked until a human runs `claude rm`. Naming the session and the release act
# on stderr is a contract, not a nicety — without it the block is unexplainable.
echo "Test: a done holder emits a stderr diagnostic naming the session and 'claude rm'"
ca_all_setup
mkdir -p "$TMPDIR_TEST/wt/tactic-foo"
office_hours_state_fake_claude "tactic-foo:done"
if err=$(worktree_has_live_session "$TMPDIR_TEST/wt/tactic-foo" 2>&1 >/dev/null); then :; fi
assert_contains_local "done diagnostic: names the holding session id" "s-tactic-foo" "$err"
assert_contains_local "done diagnostic: names the release act" "claude rm" "$err"
ca_all_teardown

# --- Test 52: a null sessionId does not eat the state column -----------------
# The matched row is split with parameter expansion, not `IFS=$'\t' read`: tab is
# IFS whitespace, so `read` collapses a LEADING empty field. `.sessionId` is not
# defaulted in the projection (by design), so a row without one yields a leading
# empty field — under `read` the state `done` would slide into the sessionId
# variable, the state would read empty, and the diagnostic would vanish.
echo "Test: a registered row with a null sessionId still emits the done diagnostic"
ca_all_setup
mkdir -p "$TMPDIR_TEST/wt/tactic-nullsid"
printf '%s' '[{"sessionId":null,"id":"j-x","pid":1,"state":"done","status":null,"name":"tactic-nullsid","cwd":""}]' \
  > "$TMPDIR_TEST/snapshot-all.json"
export DISPATCH_AGENTS_SNAPSHOT_ALL="$TMPDIR_TEST/snapshot-all.json"
if err=$(worktree_has_live_session "$TMPDIR_TEST/wt/tactic-nullsid" 2>&1 >/dev/null); then :; fi
assert_contains_local "null sessionId: the done diagnostic is still emitted" \
  "done-but-not-removed" "$err"
ca_all_teardown

# --- claude_session_id_is_live (tactic-standdown-winner-liveness) -----------
# The winner-liveness predicate for the duplicate-worker stand-down protocol:
# exact-matches a sessionId against ONE `claude agents --json --all` query,
# folding UNKNOWN to LIVE (return 0) — the same fail-safe inversion as
# worktree_has_live_session, applied to a session id. `--all` is load-bearing:
# a stopped-but-not-removed session is hidden from the default listing, and
# reporting it absent invites a peer to take over the shared worktree its
# uncommitted work still sits in. The granular verdict rides on
# CLAUDE_SESSION_ID_LIVE_STATE (live | stopped | absent | unknown).

# write_fake_claude_all <payload> — install a fake `claude` that is FAITHFUL to
# the daemon's --all semantics: rows whose state is `done` (or `stopped`) are
# returned ONLY when `--all` appears in argv, exactly as production behaves
# (same idiom as office_hours_state_fake_claude in dispatch-test-fixture.sh).
# A naive fake that served terminal rows regardless of --all would let an
# --all-forgetting regression still pass.
write_fake_claude_all() {
  local payload="$1"
  printf '%s' "$payload" > "$CA_DIR/payload.json"
  cat > "$CA_FAKE" <<FAKE
#!/usr/bin/env bash
for arg in "\$@"; do
  [[ "\$arg" == "--all" ]] && { cat "$CA_DIR/payload.json"; exit 0; }
done
jq -c 'map(select(.state != "done" and .state != "stopped"))' "$CA_DIR/payload.json"
exit 0
FAKE
  chmod +x "$CA_FAKE"
  CLAUDE_AGENTS_CMD="$CA_FAKE"
}

# --- Test 36: sid-live-exact — exact match, no substring match --------------
echo "Test: claude_session_id_is_live exact-matches sessionId, no substring match"
ca_setup
write_fake_claude '[{"sessionId":"aaa","pid":1,"status":"busy","name":"tactic-x"},{"sessionId":"aab","pid":2,"status":"busy","name":"tactic-y"}]' 0
if claude_session_id_is_live "aaa"; then rc=0; else rc=$?; fi
assert_eq "sid-live-exact: aaa is live" "0" "$rc"
if claude_session_id_is_live "aab"; then rc=0; else rc=$?; fi
assert_eq "sid-live-exact: aab is live" "0" "$rc"
if claude_session_id_is_live "aa"; then rc=0; else rc=$?; fi
assert_eq "sid-live-exact: aa (substring only) is not live" "1" "$rc"
ca_teardown

# --- Test 37: sid-live-absent — well-formed registry without the sid --------
echo "Test: claude_session_id_is_live returns 1 for a sid absent from a well-formed registry"
ca_setup
write_fake_claude '[{"sessionId":"other","pid":1,"status":"busy","name":"tactic-x"}]' 0
if claude_session_id_is_live "missing-sid"; then rc=0; else rc=$?; fi
assert_eq "sid-live-absent: absent sid is not live" "1" "$rc"
ca_teardown

ca_setup
write_fake_claude '[]' 0
if claude_session_id_is_live "missing-sid"; then rc=0; else rc=$?; fi
assert_eq "sid-live-absent: empty registry, absent sid is not live" "1" "$rc"
ca_teardown

# --- Test 38: sid-live-unknown — daemon failure folds to live (fail safe) ---
echo "Test: claude_session_id_is_live folds daemon UNKNOWN to live"
ca_setup
write_fake_claude '' 1
if claude_session_id_is_live "any-sid"; then rc=0; else rc=$?; fi
assert_eq "sid-live-unknown: non-zero exit folds to live" "0" "$rc"
ca_teardown

ca_setup
write_fake_claude '{}' 0
if claude_session_id_is_live "any-sid"; then rc=0; else rc=$?; fi
assert_eq "sid-live-unknown: non-array output folds to live" "0" "$rc"
ca_teardown

# --- Test 39: sid-live-empty-arg — missing argument fails safe to live ------
echo "Test: claude_session_id_is_live fails safe to live with no argument and warns on stderr"
ca_setup
if out=$(claude_session_id_is_live 2>/dev/null); then rc=0; else rc=$?; fi
assert_eq "sid-live-empty-arg: no argument is live" "0" "$rc"
TOTAL=$((TOTAL + 1))
if err=$(claude_session_id_is_live 2>&1 1>/dev/null) && printf '%s' "$err" | grep -q "requires a <sid> argument"; then
  PASS=$((PASS + 1)); echo "  PASS: sid-live-empty-arg: warns on stderr"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: sid-live-empty-arg: warns on stderr"
fi
# Called directly (NOT in a command substitution) so the state variable the
# function sets is observable in this shell.
CLAUDE_SESSION_ID_LIVE_STATE="sentinel"
claude_session_id_is_live 2>/dev/null || true
assert_eq "sid-live-empty-arg: state is unknown" "unknown" "$CLAUDE_SESSION_ID_LIVE_STATE"
ca_teardown

# --- Test 39a: sid-live-stopped — a stopped-but-present winner is NOT absent -
# The red-team case: a winner that stopped mid-work without being `claude rm`'d
# is hidden from the default listing while its uncommitted fix still sits in the
# SHARED worktree. Reporting it absent makes dispatch-standdown print
# `winner-absent`, whose documented response ("become the worker itself")
# destroys that work. It must read as live (return 0), state `stopped`.
echo "Test: claude_session_id_is_live reports a stopped-but-present session as live"
ca_setup
write_fake_claude_all '[{"sessionId":"win","pid":1,"state":"done","status":null,"name":"tactic-x"}]'
if claude_session_id_is_live "win"; then rc=0; else rc=$?; fi
assert_eq "sid-live-stopped: done-state winner is not absent" "0" "$rc"
assert_eq "sid-live-stopped: state is stopped" "stopped" "$CLAUDE_SESSION_ID_LIVE_STATE"
ca_teardown

ca_setup
write_fake_claude_all '[{"sessionId":"win","pid":1,"state":"stopped","status":null,"name":"tactic-x"}]'
if claude_session_id_is_live "win"; then rc=0; else rc=$?; fi
assert_eq "sid-live-stopped: stopped-state winner is not absent" "0" "$rc"
assert_eq "sid-live-stopped: state is stopped" "stopped" "$CLAUDE_SESSION_ID_LIVE_STATE"
ca_teardown

# --- Test 39b: sid-live-state — the granular verdict for live and absent -----
echo "Test: claude_session_id_is_live publishes live/absent in CLAUDE_SESSION_ID_LIVE_STATE"
ca_setup
write_fake_claude_all '[{"sessionId":"win","pid":1,"state":"working","status":"busy","name":"tactic-x"}]'
if claude_session_id_is_live "win"; then rc=0; else rc=$?; fi
assert_eq "sid-live-state: working session is live" "0" "$rc"
assert_eq "sid-live-state: state is live" "live" "$CLAUDE_SESSION_ID_LIVE_STATE"
if claude_session_id_is_live "gone"; then rc=0; else rc=$?; fi
assert_eq "sid-live-state: unregistered sid is absent" "1" "$rc"
assert_eq "sid-live-state: state is absent" "absent" "$CLAUDE_SESSION_ID_LIVE_STATE"
ca_teardown

ca_setup
write_fake_claude '' 1
if claude_session_id_is_live "any-sid"; then rc=0; else rc=$?; fi
assert_eq "sid-live-state: daemon UNKNOWN is live" "0" "$rc"
assert_eq "sid-live-state: state is unknown" "unknown" "$CLAUDE_SESSION_ID_LIVE_STATE"
ca_teardown

# --- claude_agents_list_duplicate_node_names (tactic-standdown-winner-liveness) --
# The observed-pair detector: groups live graph-node-worker (^tactic-|^strategy-)
# sessions by name and emits one line per name with >= 2 live sessions.

# --- Test 40: dup-names-pair — one duplicated name amid noise ---------------
echo "Test: claude_agents_list_duplicate_node_names emits only the duplicated name"
ca_setup
write_fake_claude '[
  {"sessionId":"s1","pid":1,"status":"busy","name":"tactic-x"},
  {"sessionId":"s2","pid":2,"status":"busy","name":"tactic-x"},
  {"sessionId":"s3","pid":3,"status":"busy","name":"tactic-y"},
  {"sessionId":"s4","pid":4,"status":"busy","name":"dispatch-abc"},
  {"sessionId":"s5","pid":5,"status":"busy","name":"1234-slug"}
]' 0
if out=$(claude_agents_list_duplicate_node_names); then rc=0; else rc=$?; fi
assert_eq "dup-names-pair: exits 0" "0" "$rc"
assert_eq "dup-names-pair: only tactic-x with both sids, in registry order" \
  "$(printf 'tactic-x\ts1,s2')" "$out"
ca_teardown

# --- Test 41: dup-names-none — one row per name, no duplicates --------------
echo "Test: claude_agents_list_duplicate_node_names returns 0 with no output when nothing duplicates"
ca_setup
write_fake_claude '[
  {"sessionId":"s1","pid":1,"status":"busy","name":"tactic-x"},
  {"sessionId":"s2","pid":2,"status":"busy","name":"strategy-y"}
]' 0
if out=$(claude_agents_list_duplicate_node_names); then rc=0; else rc=$?; fi
assert_eq "dup-names-none: exits 0" "0" "$rc"
assert_eq "dup-names-none: prints nothing" "" "$out"
ca_teardown

# --- Test 42: dup-names-unknown — daemon failure returns 1, empty stdout ----
echo "Test: claude_agents_list_duplicate_node_names returns 1 with empty stdout on daemon UNKNOWN"
ca_setup
write_fake_claude '' 1
if out=$(claude_agents_list_duplicate_node_names); then rc=0; else rc=$?; fi
assert_eq "dup-names-unknown: exits 1" "1" "$rc"
assert_eq "dup-names-unknown: prints nothing" "" "$out"
ca_teardown

# --- claude_agents_count_held_for_debug (tactic-frozen-session-debug-count) --
# Counts worker sessions (^[0-9]+-|^tactic-|^strategy-, excluding dispatch-*
# routers) in a TERMINAL state — sessions a narrowed auto-close default is
# keeping alive instead of reaping.
#
# Payloads below mirror the REAL `claude agents --json --all` row shapes,
# verified against the live daemon:
#   terminal:  {"sessionId":..,"name":..,"state":"done"}   — NO .status key
#   live work: {"sessionId":..,"pid":..,"name":..,"state":"working","status":"busy"|"idle"}
#   live wait: {"sessionId":..,"name":..,"state":"blocked"} — NO .status key
# A hand-written `"status":"done"` row is a shape the daemon never emits; the
# only test that uses one is the coarse-`.status`-fallback case below, which
# exists precisely to exercise the `.state`-missing branch.

# --- Test 43: held-for-debug-mixed — only the terminal worker row counts ----
echo "Test: claude_agents_count_held_for_debug counts only terminal worker rows"
ca_setup
write_fake_claude '[
  {"sessionId":"s1","pid":1,"state":"working","status":"busy","name":"tactic-x"},
  {"sessionId":"s2","pid":2,"state":"working","status":"idle","name":"strategy-y"},
  {"sessionId":"s3","state":"done","name":"1234-slug"},
  {"sessionId":"s4","state":"done","name":"dispatch-abc"}
]' 0
if out=$(claude_agents_count_held_for_debug); then rc=0; else rc=$?; fi
assert_eq "held-for-debug-mixed: exits 0" "0" "$rc"
assert_eq "held-for-debug-mixed: counts only the terminal worker row" "1" "$out"
ca_teardown

# --- Test 43b: held-for-debug-blocked — a blocked worker is LIVE, not held --
# `blocked` (waiting on input/permission) is a live state: the session is
# still there and can resume. claude_session_id_is_live classifies it live,
# and this counter must agree — a complement predicate ("not busy, not idle")
# would wrongly count it, since a blocked row carries no .status at all.
echo "Test: claude_agents_count_held_for_debug does not count blocked (live) workers"
ca_setup
write_fake_claude '[
  {"sessionId":"s1","state":"blocked","name":"tactic-x"},
  {"sessionId":"s2","state":"blocked","name":"1234-slug"},
  {"sessionId":"s3","state":"done","name":"tactic-y"}
]' 0
if out=$(claude_agents_count_held_for_debug); then rc=0; else rc=$?; fi
assert_eq "held-for-debug-blocked: exits 0" "0" "$rc"
assert_eq "held-for-debug-blocked: counts only the done row, not the blocked ones" "1" "$out"
ca_teardown

# --- Test 43c: held-for-debug-status-fallback — row with no .state ----------
# The predicate resolves `(.state // .status)`, so a row carrying only the
# coarse `.status` still classifies correctly.
echo "Test: claude_agents_count_held_for_debug falls back to .status when .state is absent"
ca_setup
write_fake_claude '[
  {"sessionId":"s1","pid":1,"status":"busy","name":"tactic-x"},
  {"sessionId":"s2","pid":2,"status":"error","name":"tactic-y"}
]' 0
if out=$(claude_agents_count_held_for_debug); then rc=0; else rc=$?; fi
assert_eq "held-for-debug-status-fallback: exits 0" "0" "$rc"
assert_eq "held-for-debug-status-fallback: counts the status-only terminal row" "1" "$out"
ca_teardown

# --- Test 44: held-for-debug-all-live — only live rows → count 0 ------------
echo "Test: claude_agents_count_held_for_debug returns 0 when all worker rows are live"
ca_setup
write_fake_claude '[
  {"sessionId":"s1","pid":1,"state":"working","status":"busy","name":"tactic-x"},
  {"sessionId":"s2","pid":2,"state":"working","status":"idle","name":"1234-slug"},
  {"sessionId":"s3","state":"blocked","name":"strategy-z"}
]' 0
if out=$(claude_agents_count_held_for_debug); then rc=0; else rc=$?; fi
assert_eq "held-for-debug-all-live: exits 0" "0" "$rc"
assert_eq "held-for-debug-all-live: counts 0" "0" "$out"
ca_teardown

# --- Test 45: held-for-debug-empty — empty registry → count 0, exit 0 -------
echo "Test: claude_agents_count_held_for_debug returns 0 with count 0 for an empty registry"
ca_setup
write_fake_claude '[]' 0
if out=$(claude_agents_count_held_for_debug); then rc=0; else rc=$?; fi
assert_eq "held-for-debug-empty: exits 0" "0" "$rc"
assert_eq "held-for-debug-empty: counts 0" "0" "$out"
ca_teardown

# --- Test 46: held-for-debug-unknown — daemon failure → rc 1, empty stdout --
echo "Test: claude_agents_count_held_for_debug returns 1 with empty stdout on daemon UNKNOWN"
ca_setup
write_fake_claude '' 1
if out=$(claude_agents_count_held_for_debug); then rc=0; else rc=$?; fi
assert_eq "held-for-debug-unknown: exits 1" "1" "$rc"
assert_eq "held-for-debug-unknown: prints nothing" "" "$out"
ca_teardown

# --- Test 47: held-for-debug-all-flag — proves the query passes --all ------
# write_fake_claude_all only reveals a `state: done` row when --all is in
# argv; without --all it filters that row out. A regression to a
# non---all query would silently undercount instead of failing loudly, so
# this test proves the function's own query includes --all.
echo "Test: claude_agents_count_held_for_debug proves its query passes --all"
ca_setup
write_fake_claude_all '[
  {"sessionId":"s1","pid":1,"state":"working","status":"busy","name":"tactic-x"},
  {"sessionId":"s2","state":"done","name":"tactic-y"}
]'
if out=$(claude_agents_count_held_for_debug); then rc=0; else rc=$?; fi
assert_eq "held-for-debug-all-flag: exits 0" "0" "$rc"
assert_eq "held-for-debug-all-flag: counts the --all-only terminal row" "1" "$out"
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

# --- claude_agents_list_terminal_workers --------------------------------------
# The lister sibling of claude_agents_count_held_for_debug: same keyspace
# filter (^[0-9]+-|^tactic-|^strategy-, routers excluded) and same terminal
# state resolution ((.state // .status) // ""), but emits
# sessionId<TAB>id<TAB>name<TAB>cwd rows instead of a count. Always queries
# `--all` directly, bypassing DISPATCH_AGENTS_SNAPSHOT (captured without --all).
# `.id` is its own column because the managed-job dir is named by `.id` while
# the transcript is named by `.sessionId`, and the two diverge on a resumed
# session.

# --- Test 53: a done row is listed -------------------------------------------
echo "Test: claude_agents_list_terminal_workers lists a done tactic worker"
ca_setup
write_fake_claude '[{"sessionId":"sid-1","id":"job-1","pid":1,"status":null,"state":"done","name":"tactic-foo","cwd":"/wt/tactic-foo"}]' 0
if out=$(claude_agents_list_terminal_workers); then rc=0; else rc=$?; fi
assert_eq "terminal-done: exits 0" "0" "$rc"
assert_eq "terminal-done: one TSV line for the done row" \
  "$(printf 'sid-1\tjob-1\ttactic-foo\t/wt/tactic-foo')" "$out"
ca_teardown

# --- Test 53b: `.id` is emitted verbatim, not derived from the sessionId ------
# A RESUMED session keeps its original job id while its sessionId changes, so
# `${sessionId%%-*}` is NOT the job dir. The projection must carry the real id.
echo "Test: claude_agents_list_terminal_workers emits .id verbatim for a resumed session"
ca_setup
write_fake_claude '[{"sessionId":"699ca965-aaaa-bbbb-cccc-dddddddddddd","id":"c20b2f8d","pid":1,"state":"done","name":"tactic-resumed","cwd":"/wt/resumed"}]' 0
if out=$(claude_agents_list_terminal_workers); then rc=0; else rc=$?; fi
assert_eq "terminal-resumed: exits 0" "0" "$rc"
assert_eq "terminal-resumed: the id column is the registry id, not the sessionId prefix" \
  "$(printf '699ca965-aaaa-bbbb-cccc-dddddddddddd\tc20b2f8d\ttactic-resumed\t/wt/resumed')" "$out"
ca_teardown

# --- Test 53c: a row with no `.id` emits an empty id column -------------------
echo "Test: claude_agents_list_terminal_workers emits an empty id column when .id is absent"
ca_setup
write_fake_claude '[{"sessionId":"sid-noid","pid":1,"state":"done","name":"tactic-noid","cwd":"/wt/noid"}]' 0
if out=$(claude_agents_list_terminal_workers); then rc=0; else rc=$?; fi
assert_eq "terminal-noid: exits 0" "0" "$rc"
assert_eq "terminal-noid: the id column is empty" \
  "$(printf 'sid-noid\t\ttactic-noid\t/wt/noid')" "$out"
ca_teardown

# --- Test 54: busy and blocked rows are excluded ------------------------------
echo "Test: claude_agents_list_terminal_workers excludes busy and blocked rows"
ca_setup
write_fake_claude '[
  {"sessionId":"sid-busy","pid":1,"status":"busy","state":"working","name":"tactic-busy","cwd":"/wt/busy"},
  {"sessionId":"sid-blocked","pid":2,"status":"idle","state":"blocked","name":"tactic-blocked","cwd":"/wt/blocked"}
]' 0
if out=$(claude_agents_list_terminal_workers); then rc=0; else rc=$?; fi
assert_eq "terminal-non-terminal: exits 0" "0" "$rc"
assert_eq "terminal-non-terminal: prints nothing" "" "$out"
ca_teardown

# --- Test 55: no .state falls back to .status --------------------------------
echo "Test: claude_agents_list_terminal_workers falls back to .status when .state is absent"
ca_setup
write_fake_claude '[{"sessionId":"sid-2","id":"job-2","pid":1,"status":"stopped","name":"tactic-fallback","cwd":"/wt/fallback"}]' 0
if out=$(claude_agents_list_terminal_workers); then rc=0; else rc=$?; fi
assert_eq "terminal-fallback: exits 0" "0" "$rc"
assert_eq "terminal-fallback: status-only stopped row is included" \
  "$(printf 'sid-2\tjob-2\ttactic-fallback\t/wt/fallback')" "$out"
ca_teardown

# --- Test 56: neither .state nor .status is excluded --------------------------
echo "Test: claude_agents_list_terminal_workers excludes a row with neither .state nor .status"
ca_setup
write_fake_claude '[{"sessionId":"sid-3","pid":1,"name":"tactic-neither","cwd":"/wt/neither"}]' 0
if out=$(claude_agents_list_terminal_workers); then rc=0; else rc=$?; fi
assert_eq "terminal-neither: exits 0" "0" "$rc"
assert_eq "terminal-neither: prints nothing" "" "$out"
ca_teardown

# --- Test 57: a done router is excluded ---------------------------------------
echo "Test: claude_agents_list_terminal_workers excludes a done router"
ca_setup
write_fake_claude '[{"sessionId":"sid-4","pid":1,"status":null,"state":"done","name":"dispatch-ab12cd34","cwd":"/wt/router"}]' 0
if out=$(claude_agents_list_terminal_workers); then rc=0; else rc=$?; fi
assert_eq "terminal-router: exits 0" "0" "$rc"
assert_eq "terminal-router: prints nothing" "" "$out"
ca_teardown

# --- Test 58: empty [] registry → rc 0, empty stdout (definite none) ----------
echo "Test: claude_agents_list_terminal_workers returns 0 with empty stdout for an empty registry"
ca_setup
write_fake_claude '[]' 0
if out=$(claude_agents_list_terminal_workers); then rc=0; else rc=$?; fi
assert_eq "terminal-empty: exits 0 (definite zero, not UNKNOWN)" "0" "$rc"
assert_eq "terminal-empty: prints nothing" "" "$out"
ca_teardown

# --- Test 59: non-array output → rc 1 -----------------------------------------
echo "Test: claude_agents_list_terminal_workers returns rc 1 on non-array JSON output"
ca_setup
write_fake_claude '{}' 0
if out=$(claude_agents_list_terminal_workers); then rc=0; else rc=$?; fi
assert_eq "terminal-non-array: exits non-zero (UNKNOWN)" "1" "$rc"
assert_eq "terminal-non-array: prints nothing" "" "$out"
ca_teardown

# --- Test 60: daemon failure (non-zero exit) → rc 1 ---------------------------
echo "Test: claude_agents_list_terminal_workers returns rc 1 on daemon failure"
ca_setup
write_fake_claude '' 1
if out=$(claude_agents_list_terminal_workers); then rc=0; else rc=$?; fi
assert_eq "terminal-daemon-fail: exits non-zero (UNKNOWN)" "1" "$rc"
assert_eq "terminal-daemon-fail: prints nothing" "" "$out"
ca_teardown

# --- Test 61: bypasses DISPATCH_AGENTS_SNAPSHOT — finds a row the snapshot lacks
echo "Test: claude_agents_list_terminal_workers bypasses DISPATCH_AGENTS_SNAPSHOT and queries --all directly"
ca_setup
snapshot_file="$CA_DIR/snapshot.json"
printf '%s' '[]' > "$snapshot_file"
write_fake_claude '[{"sessionId":"sid-5","id":"job-5","pid":1,"status":null,"state":"done","name":"tactic-snapbypass","cwd":"/wt/snapbypass"}]' 0
export DISPATCH_AGENTS_SNAPSHOT="$snapshot_file"
if out=$(claude_agents_list_terminal_workers); then rc=0; else rc=$?; fi
unset DISPATCH_AGENTS_SNAPSHOT
assert_eq "terminal-snapshot-bypass: exits 0" "0" "$rc"
assert_eq "terminal-snapshot-bypass: finds the row absent from the empty snapshot" \
  "$(printf 'sid-5\tjob-5\ttactic-snapbypass\t/wt/snapbypass')" "$out"
ca_teardown

# <<< END MOVED <<<

# --- empty-read corroboration (tactic-graph-router-live-worker-read-robust) ---
# `claude agents --json` reaches the daemon over a Unix socket. A blocked read
# (sandbox / network-namespace isolation) exits 0 and prints `[]` — byte-
# identical to a genuine "no live sessions". The five hardened functions
# corroborate an exactly-`[]` payload with a socket-independent process probe
# (`pgrep -f 'claude daemon'`, seam: CLAUDE_AGENTS_PGREP_CMD) and fold an
# uncorroborated `[]` into their own UNKNOWN. Every case below asserts BOTH
# halves — unreachable probe → UNKNOWN, reachable probe → today's definite
# answer — so a stub that never runs cannot make the pair vacuous.

# --- Test 62: claude_sessions_under ------------------------------------------
echo "Test: claude_sessions_under folds an uncorroborated [] into UNKNOWN"
ca_setup
write_fake_claude '[]' 0
CLAUDE_AGENTS_PGREP_CMD="$CA_PROBE_ABSENT"
if out=$(claude_sessions_under "$CA_DIR" 2>/dev/null); then rc=0; else rc=$?; fi
assert_eq "uncorroborated-empty sessions_under: exits 1 (UNKNOWN)" "1" "$rc"
assert_eq "uncorroborated-empty sessions_under: prints nothing" "" "$out"
if err=$(claude_sessions_under "$CA_DIR" 2>&1 >/dev/null); then :; fi
assert_contains_local "uncorroborated-empty sessions_under: names the remedy on stderr" \
  "dangerouslyDisableSandbox" "$err"
ca_teardown

echo "Test: claude_sessions_under still reports a corroborated [] as a definite no-sessions"
ca_setup
write_fake_claude '[]' 0
if out=$(claude_sessions_under "$CA_DIR"); then rc=0; else rc=$?; fi
assert_eq "corroborated-empty sessions_under: exits 0 (definite)" "0" "$rc"
assert_eq "corroborated-empty sessions_under: prints no session lines" "" "$out"
ca_teardown

# --- Test 63: the --cwd filter legitimately yields zero rows ------------------
# The classifier keys on the RAW payload, never the projection — but for the
# --cwd variant the daemon filters SERVER-side, so an empty result IS `[]`. With
# the probe reachable that stays a definite answer: the corroboration gate must
# not turn an ordinary "nothing under this path" into UNKNOWN.
echo "Test: claude_sessions_under returns a definite empty for a --cwd-filtered result"
ca_setup
cat > "$CA_FAKE" <<'FAKE'
#!/usr/bin/env bash
for arg in "$@"; do
  [[ "$arg" == "--cwd" ]] && { echo '[]'; exit 0; }
done
echo '[{"sessionId":"s-elsewhere","pid":1,"status":"busy","name":"other-wt"}]'
FAKE
chmod +x "$CA_FAKE"
CLAUDE_AGENTS_CMD="$CA_FAKE"
if out=$(claude_sessions_under "$CA_DIR"); then rc=0; else rc=$?; fi
assert_eq "cwd-filtered empty: exits 0 (definite, not UNKNOWN)" "0" "$rc"
assert_eq "cwd-filtered empty: prints no session lines" "" "$out"
ca_teardown

# --- Test 64: claude_agents_list_all -----------------------------------------
echo "Test: claude_agents_list_all folds an uncorroborated [] into UNKNOWN"
ca_setup
write_fake_claude '[]' 0
CLAUDE_AGENTS_PGREP_CMD="$CA_PROBE_ABSENT"
if out=$(claude_agents_list_all 2>/dev/null); then rc=0; else rc=$?; fi
assert_eq "uncorroborated-empty list_all: exits 1 (UNKNOWN)" "1" "$rc"
assert_eq "uncorroborated-empty list_all: prints nothing" "" "$out"
ca_teardown

echo "Test: claude_agents_list_all still reports a corroborated [] as a definite empty registry"
ca_setup
write_fake_claude '[]' 0
if out=$(claude_agents_list_all); then rc=0; else rc=$?; fi
assert_eq "corroborated-empty list_all: exits 0 (definite)" "0" "$rc"
assert_eq "corroborated-empty list_all: prints nothing" "" "$out"
ca_teardown

# --- Test 65: claude_agents_list_registered + worktree_has_live_session -------
# The occupancy consequence: an uncorroborated `[]` must report the worktree as
# OCCUPIED, never free — this is the read that let a duplicate /implement worker
# launch into a worktree another session already owned.
echo "Test: claude_agents_list_registered folds an uncorroborated [] into UNKNOWN, and occupancy fails safe"
ca_setup
write_fake_claude '[]' 0
CLAUDE_AGENTS_PGREP_CMD="$CA_PROBE_ABSENT"
if out=$(claude_agents_list_registered 2>/dev/null); then rc=0; else rc=$?; fi
assert_eq "uncorroborated-empty list_registered: exits 1 (UNKNOWN)" "1" "$rc"
assert_eq "uncorroborated-empty list_registered: prints nothing" "" "$out"
if worktree_has_live_session "$CA_DIR" 2>/dev/null; then live=occupied; else live=free; fi
assert_eq "uncorroborated-empty: worktree_has_live_session reports occupied" "occupied" "$live"
ca_teardown

echo "Test: a corroborated [] still reports the worktree free"
ca_setup
write_fake_claude '[]' 0
if out=$(claude_agents_list_registered); then rc=0; else rc=$?; fi
assert_eq "corroborated-empty list_registered: exits 0 (definite)" "0" "$rc"
if worktree_has_live_session "$CA_DIR"; then live=occupied; else live=free; fi
assert_eq "corroborated-empty: worktree_has_live_session reports free" "free" "$live"
ca_teardown

# --- Test 66: claude_agents_count_busy_workers -------------------------------
# The spawn-headroom consequence: an uncorroborated `[]` must NOT report a count
# of 0, which would inflate the router's remaining concurrency budget.
echo "Test: claude_agents_count_busy_workers folds an uncorroborated [] into UNKNOWN"
ca_setup
write_fake_claude '[]' 0
CLAUDE_AGENTS_PGREP_CMD="$CA_PROBE_ABSENT"
if out=$(claude_agents_count_busy_workers 2>/dev/null); then rc=0; else rc=$?; fi
assert_eq "uncorroborated-empty count_busy: exits 1 (UNKNOWN)" "1" "$rc"
assert_eq "uncorroborated-empty count_busy: prints no count" "" "$out"
ca_teardown

echo "Test: claude_agents_count_busy_workers still counts 0 for a corroborated []"
ca_setup
write_fake_claude '[]' 0
if out=$(claude_agents_count_busy_workers); then rc=0; else rc=$?; fi
assert_eq "corroborated-empty count_busy: exits 0 (definite)" "0" "$rc"
assert_eq "corroborated-empty count_busy: counts 0" "0" "$out"
ca_teardown

# --- Test 67: claude_session_id_is_live — the INVERTED fold ------------------
# This function's UNKNOWN folds to LIVE, not to rc 1: returning "absent" would
# tell dispatch-standdown the winner is gone and invite a peer to take over the
# shared worktree its uncommitted work still sits in.
echo "Test: claude_session_id_is_live folds an uncorroborated [] to LIVE with state unknown"
ca_setup
write_fake_claude '[]' 0
CLAUDE_AGENTS_PGREP_CMD="$CA_PROBE_ABSENT"
CLAUDE_SESSION_ID_LIVE_STATE="sentinel"
if claude_session_id_is_live "win" 2>/dev/null; then rc=0; else rc=$?; fi
assert_eq "uncorroborated-empty sid_is_live: returns 0 (folds to live, NOT absent)" "0" "$rc"
assert_eq "uncorroborated-empty sid_is_live: state is unknown" "unknown" "$CLAUDE_SESSION_ID_LIVE_STATE"
ca_teardown

echo "Test: claude_session_id_is_live still reports absent for a corroborated []"
ca_setup
write_fake_claude '[]' 0
CLAUDE_SESSION_ID_LIVE_STATE="sentinel"
if claude_session_id_is_live "win"; then rc=0; else rc=$?; fi
assert_eq "corroborated-empty sid_is_live: returns 1 (absent)" "1" "$rc"
assert_eq "corroborated-empty sid_is_live: state is absent" "absent" "$CLAUDE_SESSION_ID_LIVE_STATE"
ca_teardown

# --- Test 68: a NON-empty array is self-corroborating ------------------------
# The probe must gate ONLY the exactly-`[]` payload. A blocked read cannot
# invent rows, so a populated array stays a definite answer even with the probe
# reporting no daemon — otherwise every healthy read on a host whose daemon
# pattern does not match would flip to UNKNOWN and stall the fleet.
echo "Test: a non-empty array stays definite even when the corroboration probe is unreachable"
ca_setup
ca_basename=$(basename "$CA_DIR")
write_fake_claude "[{\"sessionId\":\"s-1\",\"pid\":1,\"status\":\"busy\",\"name\":\"$ca_basename\"}]" 0
CLAUDE_AGENTS_PGREP_CMD="$CA_PROBE_ABSENT"
if out=$(claude_agents_list_all); then rc=0; else rc=$?; fi
assert_eq "non-empty unreachable-probe: list_all exits 0" "0" "$rc"
assert_eq "non-empty unreachable-probe: list_all projects the row" \
  "$(printf 's-1\tbusy\t%s' "$ca_basename")" "$out"
if out=$(claude_agents_count_busy_workers); then rc=0; else rc=$?; fi
assert_eq "non-empty unreachable-probe: count_busy exits 0" "0" "$rc"
if out=$(claude_sessions_under "$CA_DIR"); then rc=0; else rc=$?; fi
assert_eq "non-empty unreachable-probe: sessions_under exits 0" "0" "$rc"
if worktree_has_live_session "$CA_DIR"; then live=occupied; else live=free; fi
assert_eq "non-empty unreachable-probe: occupancy still answered from the row" "occupied" "$live"
ca_teardown

# --- Test 69: a client-side name filter yielding zero rows stays definite -----
# The classifier keys on the RAW payload, never the projection. A non-empty
# array whose rows simply do not match the requested name must stay a definite
# "no such session" — keying on the projected TSV would flip it to UNKNOWN.
echo "Test: a non-matching name filter over a non-empty array stays definite under an unreachable probe"
ca_setup
write_fake_claude '[{"sessionId":"s-a","pid":111,"status":"busy","name":"other-worktree"}]' 0
CLAUDE_AGENTS_PGREP_CMD="$CA_PROBE_ABSENT"
if out=$(claude_sessions_with_name "my-worktree"); then rc=0; else rc=$?; fi
assert_eq "projection-not-raw: exits 0 (definite no-match)" "0" "$rc"
assert_eq "projection-not-raw: prints nothing" "" "$out"
ca_teardown

# --- Test 70: claude_agents_registry_reachable — the probe seam itself -------
echo "Test: claude_agents_registry_reachable keys only on the probe's exit status"
ca_setup
if claude_agents_registry_reachable; then rc=0; else rc=$?; fi
assert_eq "probe: visible stub (exit 0) reports reachable" "0" "$rc"
CLAUDE_AGENTS_PGREP_CMD="$CA_PROBE_ABSENT"
if claude_agents_registry_reachable; then rc=0; else rc=$?; fi
assert_eq "probe: absent stub (exit 1) reports unreachable" "1" "$rc"
CLAUDE_AGENTS_PGREP_CMD="$CA_DIR/no-such-pgrep"
if claude_agents_registry_reachable 2>/dev/null; then rc=0; else rc=$?; fi
assert_eq "probe: a missing pgrep reports unreachable (no corroboration)" "127" "$rc"
ca_teardown

# --- Test 71: worktree_occupancy_state — the four-state occupancy verdict ----
# The granular classifier behind worktree_has_live_session. The TOKEN on stdout
# is the contract; the function ALWAYS returns 0 (same shape as
# dispatch_pause_state). `terminal` is the state the invalid-state lane exists
# to see: nothing is running, yet the claim survives.
echo "Test: worktree_occupancy_state distinguishes free / live / terminal / unknown"
ca_setup
ca_basename=$(basename "$CA_DIR")

# free — the daemon answered and nothing claims this worktree.
write_fake_claude '[]' 0
out=$(worktree_occupancy_state "$CA_DIR"); rc=$?
assert_eq "occupancy: empty registry yields free" "free" "$out"
assert_eq "occupancy: free still returns 0 (token is the contract)" "0" "$rc"
# The evidence globals are observable only on a DIRECT call — a `$( )` call runs
# in a subshell whose assignments cannot escape. Assert them the way a real
# caller must read them.
worktree_occupancy_state "$CA_DIR" >/dev/null
assert_eq "occupancy: free publishes the state global" "free" "$WORKTREE_OCCUPANCY_STATE"
assert_eq "occupancy: free carries no session id" "" "$WORKTREE_OCCUPANCY_SESSION_ID"

# live — a working session is a VALID claim, never an invalid state.
write_fake_claude "[{\"sessionId\":\"sess-live\",\"status\":\"busy\",\"name\":\"$ca_basename\",\"state\":\"working\"}]" 0
out=$(worktree_occupancy_state "$CA_DIR"); rc=$?
assert_eq "occupancy: a working session yields live" "live" "$out"
assert_eq "occupancy: live returns 0" "0" "$rc"

# terminal — at least `done` and `error`, both from the shared enumeration.
write_fake_claude "[{\"sessionId\":\"sess-done\",\"name\":\"$ca_basename\",\"state\":\"done\"}]" 0
out=$(worktree_occupancy_state "$CA_DIR" 2>/dev/null); rc=$?
assert_eq "occupancy: a done session yields terminal" "terminal" "$out"
assert_eq "occupancy: terminal returns 0" "0" "$rc"
worktree_occupancy_state "$CA_DIR" >/dev/null 2>&1
assert_eq "occupancy: terminal publishes the holder's session id" \
  "sess-done" "$WORKTREE_OCCUPANCY_SESSION_ID"

write_fake_claude "[{\"sessionId\":\"sess-err\",\"name\":\"$ca_basename\",\"state\":\"error\"}]" 0
out=$(worktree_occupancy_state "$CA_DIR" 2>/dev/null)
assert_eq "occupancy: an error session yields terminal" "terminal" "$out"

# The operator diagnostic names whichever terminal state matched, not just `done`.
diag=$(worktree_occupancy_state "$CA_DIR" 2>&1 >/dev/null)
case "$diag" in
  *"held by a error-but-not-removed session sess-err"*) diag_ok=yes ;;
  *) diag_ok="no: $diag" ;;
esac
assert_eq "occupancy: the diagnostic names the matched terminal state" "yes" "$diag_ok"

# unknown — a daemon failure and whitespace-only output. Never `terminal`:
# a blocked read must not manufacture an invalid state.
write_fake_claude '' 1
out=$(worktree_occupancy_state "$CA_DIR" 2>/dev/null); rc=$?
assert_eq "occupancy: a daemon-query failure yields unknown" "unknown" "$out"
assert_eq "occupancy: unknown returns 0" "0" "$rc"

write_fake_claude '   ' 0
out=$(worktree_occupancy_state "$CA_DIR" 2>/dev/null)
assert_eq "occupancy: whitespace-only output yields unknown" "unknown" "$out"

# exclude_sid suppresses a self-match, leaving the worktree free.
write_fake_claude "[{\"sessionId\":\"sess-self\",\"status\":\"busy\",\"name\":\"$ca_basename\",\"state\":\"working\"}]" 0
out=$(worktree_occupancy_state "$CA_DIR" "sess-self")
assert_eq "occupancy: exclude_sid suppresses the caller's own claim" "free" "$out"
out=$(worktree_occupancy_state "$CA_DIR" "sess-other")
assert_eq "occupancy: exclude_sid does not suppress another session's claim" "live" "$out"

# A missing path argument is unknown (fail safe), never free.
out=$(worktree_occupancy_state "" 2>/dev/null)
assert_eq "occupancy: an empty path yields unknown, never free" "unknown" "$out"
ca_teardown

# --- Test 72: worktree_has_live_session's boolean contract is unchanged ------
# The wrapper is the regression surface for every existing caller
# (graph-select-target, dispatch-sweep, lib-graph-worktree.sh,
# lib-standdown-recheck.sh, .claude/hooks/worktree-remove.sh): ONLY a definite
# `free` releases the worktree. A terminal holder must still read as occupied —
# promoting it to a first-class verdict must not un-block it.
echo "Test: worktree_has_live_session still folds terminal and unknown to occupied"
ca_setup
ca_basename=$(basename "$CA_DIR")

write_fake_claude "[{\"sessionId\":\"sess-done\",\"name\":\"$ca_basename\",\"state\":\"done\"}]" 0
if worktree_has_live_session "$CA_DIR" 2>/dev/null; then live=occupied; else live=free; fi
assert_eq "wrapper: a terminal row still reports occupied" "occupied" "$live"

write_fake_claude '[]' 0
if worktree_has_live_session "$CA_DIR"; then live=occupied; else live=free; fi
assert_eq "wrapper: a free worktree still reports free" "free" "$live"

write_fake_claude '' 1
if worktree_has_live_session "$CA_DIR" 2>/dev/null; then live=occupied; else live=free; fi
assert_eq "wrapper: an unknown read still folds to occupied" "occupied" "$live"

# The done-holder stderr diagnostic must still reach existing callers through
# the wrapper — the wrapper captures stdout, so stderr has to pass through.
write_fake_claude "[{\"sessionId\":\"sess-done\",\"name\":\"$ca_basename\",\"state\":\"done\"}]" 0
diag=$(worktree_has_live_session "$CA_DIR" 2>&1 >/dev/null || true)
case "$diag" in
  *"claude rm sess-done"*) diag_ok=yes ;;
  *) diag_ok="no: $diag" ;;
esac
assert_eq "wrapper: the operator diagnostic still reaches stderr" "yes" "$diag_ok"
ca_teardown

report_results
