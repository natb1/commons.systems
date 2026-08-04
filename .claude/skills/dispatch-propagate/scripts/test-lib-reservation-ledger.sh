#!/usr/bin/env bash
# Tests for lib-reservation-ledger -- moved verbatim from test-dispatch-scripts.sh
# (tactic-dispatch-test-monolith-split). Original section: 8523-8934.
set -euo pipefail

FIXTURE_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=dispatch-test-fixture.sh
source "$FIXTURE_DIR/dispatch-test-fixture.sh"

# >>> MOVED FROM test-dispatch-scripts.sh >>>
# ============================================================================
# lib-reservation-ledger.sh tests
# ============================================================================
echo ""
echo "=== lib-reservation-ledger.sh ==="
#
# The ledger primitives (reservation_write / _clear / _count / _sweep) are
# sourced directly from the REAL helper. Sourcing it re-sources the REAL
# lib-claude-agents.sh, so the sweep's liveness query is the real
# claude_agents_list_all reading CLAUDE_AGENTS_CMD — a fake `claude` script.
# DISPATCH_RESERVATION_DIR points the ledger at a scratch dir, and
# DISPATCH_RESERVATION_NOW pins the timestamp for exact-content assertions.
# The test shell runs under `set -e`, so calls whose non-zero return is under
# test are wrapped in an `if`.

# shellcheck source=/dev/null
source "$SCRIPT_DIR/lib-reservation-ledger.sh"

RL_DIR=""
RL_FAKE=""

rl_setup() {
  RL_DIR=$(mktemp -d)
  RL_FAKE="$RL_DIR/fake-claude"
  export DISPATCH_RESERVATION_DIR="$RL_DIR/ledger"
  export DISPATCH_RESERVATION_NOW="2026-01-01T00:00:00Z"
}

rl_teardown() {
  rm -rf "$RL_DIR"
  RL_DIR=""
  RL_FAKE=""
  unset DISPATCH_RESERVATION_DIR CLAUDE_AGENTS_CMD DISPATCH_RESERVATION_NOW \
    DISPATCH_RESERVATION_SWEEP_NOW_EPOCH DISPATCH_RESERVATION_BOOT_GRACE_S \
    DISPATCH_RESERVATION_STANDALONE_TTL_S DISPATCH_RESERVATION_HANDOFF_TTL_S
}

# rl_write_fake_claude <json-array> — install a fake `claude` that prints the
# given JSON array verbatim and exits 0, and point CLAUDE_AGENTS_CMD at it (so
# the real claude_agents_list_all sees it as the live-session registry).
rl_write_fake_claude() {
  local payload="$1"
  printf '%s' "$payload" > "$RL_DIR/payload.json"
  cat > "$RL_FAKE" <<FAKE
#!/usr/bin/env bash
cat "$RL_DIR/payload.json"
exit 0
FAKE
  chmod +x "$RL_FAKE"
  CLAUDE_AGENTS_CMD="$RL_FAKE"
}

# --- Test 1: reservation_write creates a 3-line marker; reservation_count -----

echo "Test: reservation_write writes the session/issue/timestamp marker; reservation_count counts files"
rl_setup
if reservation_write "900-slug" "900" "sess-abc"; then rc=0; else rc=$?; fi
assert_eq "rl-write: exits 0" "0" "$rc"
assert_eq "rl-write: marker file named by basename exists" "1" \
  "$([ -f "$DISPATCH_RESERVATION_DIR/900-slug" ] && echo 1 || echo 0)"
assert_eq "rl-write: marker content is the 3 documented lines" \
  "$(printf 'session=sess-abc\nissue=900\ntimestamp=2026-01-01T00:00:00Z')" \
  "$(cat "$DISPATCH_RESERVATION_DIR/900-slug")"
cnt=$(reservation_count)
assert_eq "rl-write: reservation_count is 1" "1" "$cnt"
reservation_write "901-other" "901" "sess-def"
cnt=$(reservation_count)
assert_eq "rl-write: reservation_count is 2 after a second marker" "2" "$cnt"
rl_teardown

# --- Test 2: reservation_clear removes the marker and is idempotent -----------

echo "Test: reservation_clear removes the marker and is idempotent"
rl_setup
reservation_write "900-slug" "900" "sess-abc"
if reservation_clear "900-slug"; then rc=0; else rc=$?; fi
assert_eq "rl-clear: exits 0" "0" "$rc"
assert_eq "rl-clear: marker file removed" "0" \
  "$([ -f "$DISPATCH_RESERVATION_DIR/900-slug" ] && echo 1 || echo 0)"
cnt=$(reservation_count)
assert_eq "rl-clear: reservation_count drops to 0" "0" "$cnt"
# Idempotent: clearing an already-absent marker still returns 0.
if reservation_clear "900-slug"; then rc=0; else rc=$?; fi
assert_eq "rl-clear: idempotent re-clear exits 0" "0" "$rc"
rl_teardown

# --- Test 3: sweep reclaims a marker whose reserving session is DEAD ----------

echo "Test: reservation_sweep reclaims a marker whose reserving session is dead and never converted"
rl_setup
reservation_write "910-slug" "910" "dead-sess"
# A live session that is neither the reserving session nor a worker on this
# worktree → the reservation is stranded and must be reclaimed.
rl_write_fake_claude '[{"sessionId":"other","pid":1,"status":"busy","name":"someworker"}]'
err=$(reservation_sweep 2>&1 1>/dev/null)
cnt=$(reservation_count)
assert_eq "rl-sweep-dead: stranded marker reclaimed (count 0)" "0" "$cnt"
TOTAL=$((TOTAL + 1))
if printf '%s' "$err" | grep -q 'dead-session-stranded'; then
  PASS=$((PASS + 1)); echo "  PASS: rl-sweep-dead: note mentions dead-session-stranded"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: rl-sweep-dead: note mentions dead-session-stranded"
fi
# #1454: the dead-session-stranded reclaim now emits an additive diagnostic line
# pointing at the per-target launch log, naming the worktree basename. The benign
# reclaims (live-worker-redundant) must stay silent (asserted in Test 5).
TOTAL=$((TOTAL + 1))
if printf '%s' "$err" | grep -q 'inspect tmp/dispatch-launch' \
   && printf '%s' "$err" | grep -q '910-slug'; then
  PASS=$((PASS + 1)); echo "  PASS: rl-sweep-dead: diagnostic points at tmp/dispatch-launch log for the basename"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: rl-sweep-dead: diagnostic points at tmp/dispatch-launch log for the basename"
  echo "    stderr: $err"
fi
rl_teardown

# --- Test 4: sweep keeps a marker whose reserving session is LIVE -------------

echo "Test: reservation_sweep keeps an in-flight marker whose reserving session is live with no worker yet"
rl_setup
reservation_write "920-slug" "920" "live-sess"
# The reserving session is live; no live worker owns the worktree yet → KEEP.
rl_write_fake_claude '[{"sessionId":"live-sess","pid":1,"status":"busy","name":"someworker"}]'
reservation_sweep 2>/dev/null
cnt=$(reservation_count)
assert_eq "rl-sweep-live: in-flight marker kept (count 1)" "1" "$cnt"
rl_teardown

# --- Test 5: sweep reclaims a marker whose worktree has a LIVE worker ---------

echo "Test: reservation_sweep reclaims a redundant marker whose worktree already has a live worker"
rl_setup
reservation_write "930-slug" "930" "whatever-sess"
# A live session whose NAME equals the worktree basename → the worker already
# registered; the marker is redundant (crash-after-register backstop).
rl_write_fake_claude '[{"sessionId":"x","pid":1,"status":"busy","name":"930-slug"}]'
err=$(reservation_sweep 2>&1 1>/dev/null)
cnt=$(reservation_count)
assert_eq "rl-sweep-redundant: redundant marker reclaimed (count 0)" "0" "$cnt"
TOTAL=$((TOTAL + 1))
if printf '%s' "$err" | grep -q 'live-worker-redundant'; then
  PASS=$((PASS + 1)); echo "  PASS: rl-sweep-redundant: note mentions live-worker-redundant"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: rl-sweep-redundant: note mentions live-worker-redundant"
fi
# #1454: a benign live-worker-redundant reclaim must NOT emit the dead-strand
# launch-log diagnostic — only genuine dead-session-stranded reclaims do.
TOTAL=$((TOTAL + 1))
if printf '%s' "$err" | grep -q 'inspect tmp/dispatch-launch'; then
  FAIL=$((FAIL + 1)); echo "  FAIL: rl-sweep-redundant: benign reclaim stays silent (no launch-log diagnostic)"
  echo "    stderr: $err"
else
  PASS=$((PASS + 1)); echo "  PASS: rl-sweep-redundant: benign reclaim stays silent (no launch-log diagnostic)"
fi
rl_teardown

# --- Test 5b: sweep TTL-reclaims an aged `origin=standalone` marker -----------
# `graph-select-target --standalone` claims have no guaranteed consumer: a caller
# that discards the selection, crashes, or is interrupted before launching leaves
# the marker behind, and while its (long-lived) session stays ALIVE neither the
# live-worker rule (a) nor the dead-session rule (c) ever fires — the marker is
# immortal and a few such calls pin LIVE_COUNT at the ceiling, stalling the fleet.
# Rule (c-ttl) bounds that: past DISPATCH_RESERVATION_STANDALONE_TTL_S with no
# live worker of that name, the marker is reclaimed regardless of session
# liveness. Marker stamped at 2026-01-01T00:00:00Z (epoch 1767225600); sweep
# "now" is 601s later against a 600s TTL.
echo "Test: reservation_sweep TTL-reclaims an aged origin=standalone marker even though its reserving session is still live"
rl_setup
reservation_write "931-slug" "931" "live-sess" "standalone"
rl_write_fake_claude '[{"sessionId":"live-sess","pid":1,"status":"busy","name":"someworker"}]'
export DISPATCH_RESERVATION_STANDALONE_TTL_S=600
export DISPATCH_RESERVATION_SWEEP_NOW_EPOCH=$((1767225600 + 601))
err=$(reservation_sweep 2>&1 1>/dev/null)
cnt=$(reservation_count)
assert_eq "rl-sweep-standalone-ttl: aged standalone marker reclaimed (count 0)" "0" "$cnt"
TOTAL=$((TOTAL + 1))
if printf '%s' "$err" | grep -q 'standalone-ttl-expired'; then
  PASS=$((PASS + 1)); echo "  PASS: rl-sweep-standalone-ttl: note mentions standalone-ttl-expired"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: rl-sweep-standalone-ttl: note mentions standalone-ttl-expired"
  echo "    stderr: $err"
fi
rl_teardown

# --- Test 5c: the TTL is scoped — young standalone / aged tick markers KEPT ---
# Two controls for Test 5b, so the TTL rule cannot over-reclaim: (i) a standalone
# marker still INSIDE the TTL is in-flight and kept; (ii) an ordinary tick claim
# (no `origin=` line) of the SAME age is kept, because dispatch-graph-execute owns
# its lifecycle and its reserving session is live.
echo "Test: reservation_sweep keeps a young standalone marker and an aged tick marker with a live reserving session"
rl_setup
reservation_write "932-slug" "932" "live-sess" "standalone"
reservation_write "933-slug" "933" "live-sess"
rl_write_fake_claude '[{"sessionId":"live-sess","pid":1,"status":"busy","name":"someworker"}]'
export DISPATCH_RESERVATION_STANDALONE_TTL_S=600
# 599s after the stamp: inside the TTL for the standalone marker; the tick marker
# has no TTL at all, so it is kept at ANY age while its session is live.
export DISPATCH_RESERVATION_SWEEP_NOW_EPOCH=$((1767225600 + 599))
reservation_sweep 2>/dev/null
assert_eq "rl-sweep-standalone-ttl-young: young standalone marker kept" "1" \
  "$([ -f "$DISPATCH_RESERVATION_DIR/932-slug" ] && echo 1 || echo 0)"
# Re-sweep well past the TTL: only the standalone marker goes; the tick claim
# stays (its session is live), proving the rule keys on `origin=standalone`.
export DISPATCH_RESERVATION_SWEEP_NOW_EPOCH=$((1767225600 + 5000))
reservation_sweep 2>/dev/null
assert_eq "rl-sweep-standalone-ttl-scope: aged standalone marker reclaimed" "0" \
  "$([ -f "$DISPATCH_RESERVATION_DIR/932-slug" ] && echo 1 || echo 0)"
assert_eq "rl-sweep-standalone-ttl-scope: aged tick marker (no origin) kept" "1" \
  "$([ -f "$DISPATCH_RESERVATION_DIR/933-slug" ] && echo 1 || echo 0)"
rl_teardown

# --- Test 5d: the TTL also covers `origin=explicit` (explicit-node dispatch) ---
# tactic-explicit-node-reservation-sweep-policy: dispatch-select-tick's explicit
# single-node lane (`dispatch <node-id>`) stamps its claim `origin=explicit`. That
# lane is typically run from inside a long-lived INTERACTIVE session, and
# dispatch-graph-execute has deliberate paths that leave the reservation for the
# sweep on a spawn failure — so with a live reserving session and no worker of
# that name, rules (a)/(c) never fire and the marker would be immortal, each
# failed explicit dispatch permanently adding 1 to LIVE_COUNT. Rule (c-ttl) must
# treat `explicit` exactly like `standalone`. Same fixture shape as Test 5b/5c.
echo "Test: reservation_sweep TTL-reclaims an aged origin=explicit marker even though its reserving session is still live"
rl_setup
reservation_write "tactic-explicit-aged" "tactic-explicit-aged" "live-sess" "explicit"
reservation_write "tactic-explicit-young" "tactic-explicit-young" "live-sess" "explicit"
rl_write_fake_claude '[{"sessionId":"live-sess","pid":1,"status":"busy","name":"someworker"}]'
export DISPATCH_RESERVATION_STANDALONE_TTL_S=600
# Inside the TTL first: an explicit claim that has not aged out is in-flight and
# must be KEPT (the rule cannot over-reclaim a just-issued explicit dispatch).
export DISPATCH_RESERVATION_SWEEP_NOW_EPOCH=$((1767225600 + 599))
reservation_sweep 2>/dev/null
assert_eq "rl-sweep-explicit-ttl-young: young explicit marker kept" "1" \
  "$([ -f "$DISPATCH_RESERVATION_DIR/tactic-explicit-young" ] && echo 1 || echo 0)"
# Past the TTL: reclaimed despite the reserving session still being live.
export DISPATCH_RESERVATION_SWEEP_NOW_EPOCH=$((1767225600 + 601))
err=$(reservation_sweep 2>&1 1>/dev/null)
assert_eq "rl-sweep-explicit-ttl: aged explicit marker reclaimed (count 0)" "0" "$(reservation_count)"
TOTAL=$((TOTAL + 1))
if printf '%s' "$err" | grep -q 'explicit-ttl-expired'; then
  PASS=$((PASS + 1)); echo "  PASS: rl-sweep-explicit-ttl: note mentions explicit-ttl-expired"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: rl-sweep-explicit-ttl: note mentions explicit-ttl-expired"
  echo "    stderr: $err"
fi
rl_teardown

# --- Test 6: sweep reclaims NOTHING when the daemon is UNKNOWN ----------------

echo "Test: reservation_sweep reclaims nothing (fail safe) when the daemon is UNKNOWN"
rl_setup
reservation_write "940-slug" "940" "dead-sess"
# A missing claude binary → claude_agents_list_all returns 1 (UNKNOWN) → the
# sweep must touch nothing.
CLAUDE_AGENTS_CMD="$RL_DIR/no-such-claude"
if reservation_sweep 2>/dev/null; then rc=0; else rc=$?; fi
cnt=$(reservation_count)
assert_eq "rl-sweep-unknown: returns 0 (fail safe)" "0" "$rc"
assert_eq "rl-sweep-unknown: marker survives (count unchanged)" "1" "$cnt"
rl_teardown

# --- Test 6b: sweep reclaims NOTHING on an uncorroborated empty read ---------
# (tactic-graph-router-live-worker-read-robust) — distinct from Test 6's
# missing-binary UNKNOWN: here `claude agents --json` exits 0 and prints
# exactly `[]`, the payload a blocked/sandboxed read is indistinguishable from
# a genuine empty registry. claude_agents_list_all (lib-claude-agents.sh) only
# trusts that `[]` when a `claude daemon` process corroborates it; with the
# probe unreachable it must fold to UNKNOWN (return 1), and reservation_sweep's
# rule (c) branch must therefore reclaim nothing — the outstanding marker must
# NOT collapse alongside a (falsely) zero busy-worker count.

echo "Test: reservation_sweep reclaims nothing on an uncorroborated empty registry read"
rl_setup
reservation_write "945-slug" "945" "dead-sess"
rl_write_fake_claude '[]'
# rl_setup/rl_write_fake_claude set no default corroboration probe stub in this
# file — point it at an explicit unreachable stub so this ambiguous-`[]` case
# is deterministic rather than depending on whether the HOST happens to be
# running a `claude daemon` process.
printf '#!/usr/bin/env bash\nexit 1\n' > "$RL_DIR/fake-pgrep-unreachable"
chmod +x "$RL_DIR/fake-pgrep-unreachable"
CLAUDE_AGENTS_PGREP_CMD="$RL_DIR/fake-pgrep-unreachable"
err=$(reservation_sweep 2>&1 1>/dev/null)
cnt=$(reservation_count)
unset CLAUDE_AGENTS_PGREP_CMD
assert_eq "rl-sweep-uncorroborated-empty: marker survives (count unchanged)" "1" "$cnt"
TOTAL=$((TOTAL + 1))
if printf '%s' "$err" | grep -q 'daemon unqueryable; reclaiming nothing'; then
  PASS=$((PASS + 1)); echo "  PASS: rl-sweep-uncorroborated-empty: stderr reports the daemon-unqueryable fail-safe path"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: rl-sweep-uncorroborated-empty: stderr reports the daemon-unqueryable fail-safe path"
  echo "    stderr: $err"
fi
rl_teardown

# --- Test 7: sweep is a no-op on an empty/absent ledger ----------------------

echo "Test: reservation_sweep is a no-op on an empty or absent ledger"
rl_setup
rl_write_fake_claude '[]'
# Empty ledger dir (never written): nothing to reclaim.
mkdir -p "$DISPATCH_RESERVATION_DIR"
if reservation_sweep 2>/dev/null; then rc=0; else rc=$?; fi
cnt=$(reservation_count)
assert_eq "rl-sweep-empty: empty ledger → returns 0" "0" "$rc"
assert_eq "rl-sweep-empty: count stays 0" "0" "$cnt"
# Absent ledger dir (DISPATCH_RESERVATION_DIR points at a path that does not
# exist): the sweep still returns 0 with no reclaim.
export DISPATCH_RESERVATION_DIR="$RL_DIR/does-not-exist"
if reservation_sweep 2>/dev/null; then rc=0; else rc=$?; fi
assert_eq "rl-sweep-absent: absent ledger dir → returns 0" "0" "$rc"
rl_teardown

# --- Test 8: reservation_write rejects an empty session-id --------------------

echo "Test: reservation_write rejects an empty session-id and writes no marker"
rl_setup
if reservation_write "950-slug" "950" ""; then rc=0; else rc=$?; fi
assert_eq "rl-write-empty-session: exits 1" "1" "$rc"
assert_eq "rl-write-empty-session: no marker written" "0" \
  "$([ -f "$DISPATCH_RESERVATION_DIR/950-slug" ] && echo 1 || echo 0)"
cnt=$(reservation_count)
assert_eq "rl-write-empty-session: reservation_count stays 0" "0" "$cnt"
rl_teardown

# --- Test 9: reservation_write rejects a path-traversal basename --------------

echo "Test: reservation_write rejects an unsafe basename and writes nothing outside the ledger dir"
rl_setup
# A basename carrying a path component would, unguarded, let the marker escape
# the ledger dir on the mv. The guard must reject it with rc=1.
if reservation_write "../escape" "960" "sess-x"; then rc=0; else rc=$?; fi
assert_eq "rl-write-traversal: exits 1" "1" "$rc"
assert_eq "rl-write-traversal: no escaped marker created" "0" \
  "$([ -e "$RL_DIR/escape" ] && echo 1 || echo 0)"
if reservation_write "a/b" "961" "sess-y"; then rc=0; else rc=$?; fi
assert_eq "rl-write-traversal: slash basename also rejected (exits 1)" "1" "$rc"
cnt=$(reservation_count)
assert_eq "rl-write-traversal: reservation_count stays 0" "0" "$cnt"
rl_teardown

# --- Test 10: reservation_clear rejects a path-traversal basename -------------

echo "Test: reservation_clear rejects an unsafe basename"
rl_setup
# Plant a file outside the ledger dir; an unguarded clear with '../victim' would
# delete it. The guard must reject the call and leave the file untouched.
printf 'keep\n' > "$RL_DIR/victim"
if reservation_clear "../victim"; then rc=0; else rc=$?; fi
assert_eq "rl-clear-traversal: exits 1" "1" "$rc"
assert_eq "rl-clear-traversal: outside file untouched" "1" \
  "$([ -f "$RL_DIR/victim" ] && echo 1 || echo 0)"
rl_teardown

# --- Test 11: reservation_write creates the ledger dir owner-only (0700) ------

echo "Test: reservation_write creates the ledger dir with mode 0700"
rl_setup
reservation_write "970-slug" "970" "sess-z"
assert_eq "rl-write-mode: ledger dir is 0700" "700" \
  "$(stat -c '%a' "$DISPATCH_RESERVATION_DIR")"
rl_teardown

# --- Test 12: sweep keeps a malformed marker with no session= line -----------

echo "Test: reservation_sweep keeps (does not reclaim) a malformed marker missing the session= line"
rl_setup
mkdir -p -m 0700 "$DISPATCH_RESERVATION_DIR"
# A marker with no session= line yields an empty marker_sid; it must NOT be
# treated as dead-session-stranded and reclaimed.
printf 'issue=980\ntimestamp=2026-01-01T00:00:00Z\n' > "$DISPATCH_RESERVATION_DIR/980-slug"
rl_write_fake_claude '[{"sessionId":"other","pid":1,"status":"busy","name":"someworker"}]'
err=$(reservation_sweep 2>&1 1>/dev/null)
cnt=$(reservation_count)
assert_eq "rl-sweep-malformed: malformed marker kept (count 1)" "1" "$cnt"
TOTAL=$((TOTAL + 1))
if printf '%s' "$err" | grep -q 'malformed reservation'; then
  PASS=$((PASS + 1)); echo "  PASS: rl-sweep-malformed: note mentions malformed reservation"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: rl-sweep-malformed: note mentions malformed reservation"
fi
rl_teardown

# --- Test A: sweep keeps a YOUNG marker even when reserving session is dead ----

echo "Test: reservation_sweep keeps a young marker even when the reserving session is dead (boot grace; #1048 regression guard)"
rl_setup
# DISPATCH_RESERVATION_NOW is "2026-01-01T00:00:00Z" (set by rl_setup); its
# epoch is 1767225600 (confirmed via `date -u -d 2026-01-01T00:00:00Z +%s`).
reservation_write "990-slug" "990" "dead-sess"
# Sweep clock 5s after the marker timestamp → within the 30s grace.
export DISPATCH_RESERVATION_SWEEP_NOW_EPOCH=1767225605
# A live session that is NEITHER the reserving session NOR a worker named by the
# basename — without the grace this would be reclaimed as dead-session-stranded.
rl_write_fake_claude '[{"sessionId":"other","pid":1,"status":"busy","name":"someworker"}]'
reservation_sweep 2>/dev/null
cnt=$(reservation_count)
assert_eq "rl-sweep-young: young marker with dead session kept (count 1)" "1" "$cnt"
rl_teardown

# --- Test B: sweep reclaims an AGED marker whose reserving session is dead -----

echo "Test: reservation_sweep reclaims an aged marker whose reserving session is dead (grace boundary)"
rl_setup
reservation_write "991-slug" "991" "dead-sess"
# Sweep clock 31s after the marker timestamp → past the 30s grace.
export DISPATCH_RESERVATION_SWEEP_NOW_EPOCH=1767225631
rl_write_fake_claude '[{"sessionId":"other","pid":1,"status":"busy","name":"someworker"}]'
err=$(reservation_sweep 2>&1 1>/dev/null)
cnt=$(reservation_count)
assert_eq "rl-sweep-aged: aged marker with dead session reclaimed (count 0)" "0" "$cnt"
TOTAL=$((TOTAL + 1))
if printf '%s' "$err" | grep -q 'dead-session-stranded'; then
  PASS=$((PASS + 1)); echo "  PASS: rl-sweep-aged: note mentions dead-session-stranded"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: rl-sweep-aged: note mentions dead-session-stranded"
fi
rl_teardown

# --- Test C: live-worker-redundant reclaim is age-independent (rule (a)) -------

echo "Test: reservation_sweep reclaims a live-worker-redundant marker regardless of age (rule (a) is age-independent)"
rl_setup
reservation_write "992-slug" "992" "whatever-sess"
# YOUNG marker (sweep clock within grace) — but the worktree already has a live
# worker, so rule (a) must reclaim it ahead of the grace check.
export DISPATCH_RESERVATION_SWEEP_NOW_EPOCH=1767225605
rl_write_fake_claude '[{"sessionId":"x","pid":1,"status":"busy","name":"992-slug"}]'
err=$(reservation_sweep 2>&1 1>/dev/null)
cnt=$(reservation_count)
assert_eq "rl-sweep-redundant-young: live-worker-redundant reclaimed despite youth (count 0)" "0" "$cnt"
TOTAL=$((TOTAL + 1))
if printf '%s' "$err" | grep -q 'live-worker-redundant'; then
  PASS=$((PASS + 1)); echo "  PASS: rl-sweep-redundant-young: note mentions live-worker-redundant"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: rl-sweep-redundant-young: note mentions live-worker-redundant"
fi
rl_teardown

# --- Test D: reservation_mark_spawned re-stamps the claim as origin=spawned ----
# The spawn handoff: dispatch-graph-execute calls this INSTEAD of
# reservation_clear on a successful kick, so the claim stays in force until the
# worker registers. The existing session=/issue= values are preserved and the
# timestamp is refreshed to spawn time.
# The two DISPATCH_RESERVATION_NOW values are DISTINCT on purpose: the refresh is
# load-bearing (selection→spawn includes provision-node-worktree's fetch/
# worktree-add and can take minutes, so carrying the selection stamp forward
# could hand back an already-expired handoff). Pinning both writes to one value
# would let a regression that preserved the ORIGINAL stamp pass this assertion.
echo "Test: reservation_mark_spawned re-stamps an existing marker as origin=spawned, preserving session/issue and refreshing the timestamp"
rl_setup
export DISPATCH_RESERVATION_NOW="2025-12-31T23:50:00Z"   # selection time
reservation_write "tactic-x" "tactic-x" "headless:abc"
export DISPATCH_RESERVATION_NOW="2026-01-01T00:00:00Z"   # spawn time, 10min later
if reservation_mark_spawned "tactic-x"; then rc=0; else rc=$?; fi
assert_eq "rl-mark-spawned-content: exits 0" "0" "$rc"
assert_eq "rl-mark-spawned-content: marker is the 4 documented lines with origin=spawned and the SPAWN-time stamp" \
  "$(printf 'session=headless:abc\nissue=tactic-x\norigin=spawned\ntimestamp=2026-01-01T00:00:00Z')" \
  "$(cat "$DISPATCH_RESERVATION_DIR/tactic-x")"
rl_teardown

# --- Test D2: the refreshed stamp is what the sweep's handoff TTL measures -----
# End-to-end guard for the refresh: a marker whose ORIGINAL (selection) stamp is
# older than the handoff TTL, but whose spawn re-stamp is fresh, must SURVIVE the
# sweep. A regression that carried the selection stamp forward would hand back an
# already-expired handoff and the marker would be reclaimed here.
echo "Test: an origin=spawned marker whose ORIGINAL stamp predates the handoff TTL survives the sweep on its refreshed stamp"
rl_setup
export DISPATCH_RESERVATION_NOW="2025-12-31T23:50:00Z"   # 600s before spawn time
reservation_write "tactic-x" "tactic-x" "headless:abc"
export DISPATCH_RESERVATION_NOW="2026-01-01T00:00:00Z"   # spawn time (epoch 1767225600)
reservation_mark_spawned "tactic-x"
# Neither the reserving session nor a worker named tactic-x is live.
rl_write_fake_claude '[{"sessionId":"other","pid":1,"status":"busy","name":"someworker"}]'
# 90s past SPAWN time — well inside the 300s handoff TTL, but 690s past the
# selection stamp, i.e. past it had the refresh not happened.
export DISPATCH_RESERVATION_SWEEP_NOW_EPOCH=$((1767225600 + 90))
reservation_sweep 2>/dev/null
assert_eq "rl-mark-spawned-refresh: handoff measured from the SPAWN stamp, marker kept (count 1)" "1" \
  "$(reservation_count)"
rl_teardown

# --- Test E: reservation_mark_spawned creates a marker when none exists --------
# A caller that reached spawn without a ledger entry must still get covered, and
# the synthesized session= must be NON-EMPTY: reservation_write rejects an empty
# session id, and an empty session= would land the marker on sweep rule (b),
# which KEEPS it forever (an immortal slot).
echo "Test: reservation_mark_spawned creates a covering marker with a non-empty session when none exists"
rl_setup
if reservation_mark_spawned "tactic-y"; then rc=0; else rc=$?; fi
assert_eq "rl-mark-spawned-absent: exits 0" "0" "$rc"
assert_eq "rl-mark-spawned-absent: marker created" "1" \
  "$([ -f "$DISPATCH_RESERVATION_DIR/tactic-y" ] && echo 1 || echo 0)"
assert_eq "rl-mark-spawned-absent: origin=spawned stamped" "1" \
  "$(grep -qx 'origin=spawned' "$DISPATCH_RESERVATION_DIR/tactic-y" && echo 1 || echo 0)"
assert_eq "rl-mark-spawned-absent: session= line is non-empty" "1" \
  "$([ -n "$(sed -n 's/^session=//p' "$DISPATCH_RESERVATION_DIR/tactic-y" | head -n1)" ] && echo 1 || echo 0)"
rl_teardown

# --- Test F: sweep HOLDS an origin=spawned marker with a dead reserving session -
# The core regression guard. The tick's reserving session is the synthetic
# `headless:<INVOCATION_ID>`, which never appears in `claude agents` — so without
# rule (a-handoff) this marker is reclaimed as dead-session-stranded the moment
# the 30s boot grace lapses, reopening the duplicate-worker window while the
# spawned worker is still booting (90s registration latency observed 2026-07-30).
echo "Test: reservation_sweep HOLDS an origin=spawned marker past the boot grace when its reserving session is dead"
rl_setup
reservation_write "tactic-x" "tactic-x" "headless:abc" "spawned"
# Neither the reserving session nor a worker named tactic-x is live.
rl_write_fake_claude '[{"sessionId":"other","pid":1,"status":"busy","name":"someworker"}]'
export DISPATCH_RESERVATION_SWEEP_NOW_EPOCH=$((1767225600 + 90))
reservation_sweep 2>/dev/null
assert_eq "rl-sweep-spawned-held: handoff marker kept at +90s (count 1)" "1" "$(reservation_count)"
rl_teardown

# --- Test G: sweep reclaims an origin=spawned marker past the handoff TTL ------
echo "Test: reservation_sweep reclaims an origin=spawned marker once it ages past the handoff TTL"
rl_setup
reservation_write "tactic-x" "tactic-x" "headless:abc" "spawned"
rl_write_fake_claude '[{"sessionId":"other","pid":1,"status":"busy","name":"someworker"}]'
export DISPATCH_RESERVATION_SWEEP_NOW_EPOCH=$((1767225600 + 301))
err=$(reservation_sweep 2>&1 1>/dev/null)
assert_eq "rl-sweep-spawned-expired: aged handoff marker reclaimed (count 0)" "0" "$(reservation_count)"
TOTAL=$((TOTAL + 1))
if printf '%s' "$err" | grep -q 'spawn-handoff-expired'; then
  PASS=$((PASS + 1)); echo "  PASS: rl-sweep-spawned-expired: note mentions spawn-handoff-expired"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: rl-sweep-spawned-expired: note mentions spawn-handoff-expired"
  echo "    stderr: $err"
fi
rl_teardown

# --- Test H: a registered worker releases the handoff via rule (a) -------------
# The handoff's intended release is an EVENT, not a timeout: the instant a live
# session named by the worktree basename appears, rule (a) reclaims the marker.
echo "Test: reservation_sweep releases an origin=spawned marker as soon as its worker registers (rule (a))"
rl_setup
reservation_write "tactic-x" "tactic-x" "headless:abc" "spawned"
rl_write_fake_claude '[{"sessionId":"x","pid":1,"status":"busy","name":"tactic-x"}]'
export DISPATCH_RESERVATION_SWEEP_NOW_EPOCH=$((1767225600 + 90))
err=$(reservation_sweep 2>&1 1>/dev/null)
assert_eq "rl-sweep-spawned-released: handoff released on registration (count 0)" "0" "$(reservation_count)"
TOTAL=$((TOTAL + 1))
if printf '%s' "$err" | grep -q 'live-worker-redundant'; then
  PASS=$((PASS + 1)); echo "  PASS: rl-sweep-spawned-released: note mentions live-worker-redundant"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: rl-sweep-spawned-released: note mentions live-worker-redundant"
  echo "    stderr: $err"
fi
# A benign release is NOT a dead-strand: the launch-log diagnostic must stay off.
TOTAL=$((TOTAL + 1))
if printf '%s' "$err" | grep -q 'inspect tmp/dispatch-launch'; then
  FAIL=$((FAIL + 1)); echo "  FAIL: rl-sweep-spawned-released: benign release stays silent (no launch-log diagnostic)"
  echo "    stderr: $err"
else
  PASS=$((PASS + 1)); echo "  PASS: rl-sweep-spawned-released: benign release stays silent (no launch-log diagnostic)"
fi
rl_teardown

# --- Test I: the boot grace still short-circuits a young spawned marker --------
# Control for Tests F/G: a handoff marker inside the boot grace is kept by the
# grace branch, which precedes the new rule — the new rule did not disturb it.
echo "Test: reservation_sweep keeps a young origin=spawned marker via the boot grace (unchanged)"
rl_setup
reservation_write "tactic-x" "tactic-x" "headless:abc" "spawned"
rl_write_fake_claude '[{"sessionId":"other","pid":1,"status":"busy","name":"someworker"}]'
export DISPATCH_RESERVATION_SWEEP_NOW_EPOCH=$((1767225600 + 5))
reservation_sweep 2>/dev/null
assert_eq "rl-sweep-spawned-young: young handoff marker kept (count 1)" "1" "$(reservation_count)"
rl_teardown

# --- Test 13: reservation_exists tracks write/clear and guards its arg --------

echo "Test: reservation_exists is true after write, false after clear, and guards its argument"
rl_setup
# Absent ledger (never written) → not reserved.
if reservation_exists "990-slug"; then rc=0; else rc=$?; fi
assert_eq "rl-exists: absent ledger → return 1" "1" "$rc"
reservation_write "990-slug" "990" "sess-e"
if reservation_exists "990-slug"; then rc=0; else rc=$?; fi
assert_eq "rl-exists: true after write (return 0)" "0" "$rc"
# A different basename with no marker → not reserved.
if reservation_exists "991-other"; then rc=0; else rc=$?; fi
assert_eq "rl-exists: unrelated basename → return 1" "1" "$rc"
reservation_clear "990-slug"
if reservation_exists "990-slug"; then rc=0; else rc=$?; fi
assert_eq "rl-exists: false after clear (return 1)" "1" "$rc"
# Empty arg → return 1.
if reservation_exists ""; then rc=0; else rc=$?; fi
assert_eq "rl-exists: empty arg → return 1" "1" "$rc"
# Unsafe basename → return 1 (path-safety guard).
if reservation_exists "../escape"; then rc=0; else rc=$?; fi
assert_eq "rl-exists: unsafe basename → return 1" "1" "$rc"
rl_teardown

# --- Test 14: reserved_claimed_nums — marker basename <N>-slug → <N> ----------
# The durable (reserved) half of selection's forward claimed set (#1474). Each
# marker file is named by the reserved worktree basename; the claimed <N> is the
# basename's numeric prefix. NEVER fails (no daemon dependency): an empty dir
# emits nothing + rc 0; an absent dir emits nothing + rc 0.
echo "Test: reserved_claimed_nums maps marker basenames to their numeric prefix"
rl_setup
reservation_write "44-add-thing" "44" "sess-a"
reservation_write "44-other" "44" "sess-b"
reservation_write "88-feature" "88" "sess-c"
if out=$(reserved_claimed_nums); then rc=0; else rc=$?; fi
assert_eq "rl-claimed: exits 0" "0" "$rc"
# Two markers share <N>=44 → it appears once; sort for order-independence.
assert_eq "rl-claimed: unique <N> from basenames (44, 88)" \
  "$(printf '44\n88')" "$(printf '%s\n' "$out" | sort -n)"
rl_teardown

# --- Test 15: reserved_claimed_nums — empty ledger dir → empty, rc 0 ----------
echo "Test: reserved_claimed_nums returns 0 with empty output for an empty ledger dir"
rl_setup
mkdir -p "$DISPATCH_RESERVATION_DIR"   # dir exists but holds no markers
if out=$(reserved_claimed_nums); then rc=0; else rc=$?; fi
assert_eq "rl-claimed-empty: exits 0" "0" "$rc"
assert_eq "rl-claimed-empty: no claims emitted" "" "$out"
rl_teardown

# --- Test 16: reserved_claimed_nums — absent ledger dir → empty, rc 0 ---------
echo "Test: reserved_claimed_nums returns 0 with empty output when the ledger dir is absent"
rl_setup
# rl_setup points DISPATCH_RESERVATION_DIR at a path that does not yet exist.
if out=$(reserved_claimed_nums); then rc=0; else rc=$?; fi
assert_eq "rl-claimed-absent: exits 0 (never fails)" "0" "$rc"
assert_eq "rl-claimed-absent: no claims emitted" "" "$out"
rl_teardown

# --- Test 17: claimed_issue_nums — deduped union of live + reserved -----------
# Selection's forward-derived claimed set: the deduped union of
# live_session_claimed_nums and reserved_claimed_nums. A number present in BOTH
# halves appears once.
echo "Test: claimed_issue_nums emits the deduped union of live and reserved claims"
rl_setup
# Live sessions claim 10 and 20; reservation markers claim 20 (overlap) and 30.
rl_write_fake_claude '[{"sessionId":"s1","pid":1,"status":"busy","name":"10-a"},{"sessionId":"s2","pid":2,"status":"busy","name":"20-b"}]'
reservation_write "20-b" "20" "sess-x"
reservation_write "30-c" "30" "sess-y"
if out=$(claimed_issue_nums); then rc=0; else rc=$?; fi
assert_eq "rl-union: exits 0" "0" "$rc"
# claimed_issue_nums already sort -u's its output; 20 appears once.
assert_eq "rl-union: deduped union {10,20,30}" "$(printf '10\n20\n30')" "$out"
rl_teardown

# --- Test 18: claimed_issue_nums — FAILS OPEN on live-UNKNOWN -----------------
# When the daemon is unqueryable, live_session_claimed_nums returns 1 (UNKNOWN).
# claimed_issue_nums must NOT abort; it degrades to the reserved-only set, warns
# on stderr, and returns 0. (The per-target fail-closed net at launch is
# dispatch-resolve-worktree.)
echo "Test: claimed_issue_nums fails open to the reserved-only set on live-UNKNOWN"
rl_setup
# A missing claude binary → live_session_claimed_nums returns 1 (UNKNOWN) → the
# union must degrade to the reserved-only set. Only the reservation marker
# contributes.
CLAUDE_AGENTS_CMD="$RL_DIR/no-such-claude"
reservation_write "55-resv" "55" "sess-z"
err=$(claimed_issue_nums 2>&1 1>/dev/null)
out=$(claimed_issue_nums 2>/dev/null) && rc=0 || rc=$?
assert_eq "rl-union-failopen: exits 0 (fail open, never aborts)" "0" "$rc"
assert_eq "rl-union-failopen: reserved-only set {55}" "55" "$out"
TOTAL=$((TOTAL + 1))
if printf '%s' "$err" | grep -q 'fail open'; then
  PASS=$((PASS + 1)); echo "  PASS: rl-union-failopen: stderr diagnostic mentions fail open"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: rl-union-failopen: stderr diagnostic mentions fail open"
fi
rl_teardown

# <<< END MOVED <<<

report_results
