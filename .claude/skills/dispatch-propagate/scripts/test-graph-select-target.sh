#!/usr/bin/env bash
# Tests for graph-select-target -- moved verbatim from test-dispatch-scripts.sh
# (tactic-dispatch-test-monolith-split). Original section: 29582-29662.
set -euo pipefail

FIXTURE_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=dispatch-test-fixture.sh
source "$FIXTURE_DIR/dispatch-test-fixture.sh"

# >>> MOVED FROM test-dispatch-scripts.sh >>>
# ============================================================================
# Test: graph-select-target — a human-created node-id worktree is a held claim
# (tactic-align-session-claiming Unit 3)
# ============================================================================
# Uniform node-id claiming (strategy clarification 13) must cover worktrees a
# HUMAN-invoked /align-strategy or /align-tactics session created — sessions
# that claim by authoring in <root>/.claude/worktrees/<node-id> and never write
# a router reservation-ledger marker. graph-select-target's claimed-set gate is
# worktree_has_live_session, name-keyed on the worktree basename, so a live
# session named <node-id> claims the node no matter who created the worktree.
# Per the #1474 doctrine, worktree DIRECTORY existence alone is NOT a claim
# (orphan worktrees fail open) — the live session is; the negative control
# below pins that (dir present, no session -> selected). The skip<->select
# delta also rules out a daemon-UNKNOWN fold-to-occupied false pass.
#
# graph-select-target reads the store via `git archive origin/main intentions`
# and derives REPO_ROOT from its own on-disk location, so it needs a real git
# repo with the script physically copied in (a symlink's pwd would resolve back
# out of the fixture). select-targets.ts (the pure candidate computation) is
# stubbed with a fake `npx` on PATH so the fixture exercises ONLY the
# environmental claimed-set gate this unit covers; the snapshot is irrelevant.
echo "Test: graph-select-target — live session in a human-created node-id worktree is skipped (Unit 3)"
GSC_ROOT=$(mktemp -d)
GSC_BARE=$(mktemp -d)
GSC_SCRIPTS="$GSC_ROOT/.claude/skills/dispatch-propagate/scripts"
mkdir -p "$GSC_SCRIPTS" "$GSC_ROOT/bin"
# Copy the script under test + every sourced lib (lib.sh plus the lib-*.sh
# helpers). REPO_ROOT is derived from the script's real location, so the copy
# must be physical.
cp "$SCRIPT_DIR"/graph-select-target "$SCRIPT_DIR"/lib.sh "$SCRIPT_DIR"/lib-*.sh "$GSC_SCRIPTS/"
# Fake npx: intercept `npx tsx …/select-targets.ts …` and emit one selectable
# implement-phase candidate. An implement candidate's sensor_gate returns 0
# without touching gh, so no further environmental dependency is exercised.
cat > "$GSC_ROOT/bin/npx" <<'GSCNPX'
#!/usr/bin/env bash
echo '{"candidates":[{"id":"tactic-fixture","kind":"tactic","phase":"implement","pr":null,"pace_exempt":false}],"events":[]}'
exit 0
GSCNPX
chmod +x "$GSC_ROOT/bin/npx"
# A git repo whose origin/main carries an intentions/ tree, main checked out at
# the fixture root so NATIVE_ROOT resolves there.
git init -q -b main "$GSC_ROOT"
git -C "$GSC_ROOT" config user.email t@t
git -C "$GSC_ROOT" config user.name t
mkdir -p "$GSC_ROOT/intentions"
echo '# placeholder' > "$GSC_ROOT/intentions/placeholder.md"
git -C "$GSC_ROOT" add -A
git -C "$GSC_ROOT" commit -q -m seed
git init -q --bare -b main "$GSC_BARE"
git -C "$GSC_ROOT" remote add origin "$GSC_BARE"
git -C "$GSC_ROOT" push -q origin main
git -C "$GSC_ROOT" fetch -q origin
# The human session's claim: the node-id worktree directory exists.
mkdir -p "$GSC_ROOT/.claude/worktrees/tactic-fixture"
# Fake `claude agents --json`: payload driven by a file the two cases rewrite.
cat > "$GSC_ROOT/bin/claude" <<'GSCCLAUDE'
#!/usr/bin/env bash
_root="$(cd "$(dirname "$0")/.." && pwd)"
cat "$_root/claude-payload.json"
exit 0
GSCCLAUDE
chmod +x "$GSC_ROOT/bin/claude"
GSC_GST="$GSC_SCRIPTS/graph-select-target"
# Case 1 — a live session named after the node id owns the worktree -> skipped.
printf '%s' '[{"sessionId":"s1","pid":1,"status":"busy","name":"tactic-fixture","cwd":""}]' \
  > "$GSC_ROOT/claude-payload.json"
gsc_skip=$(PATH="$GSC_ROOT/bin:$SAVED_PATH" \
  CLAUDE_AGENTS_CMD="$GSC_ROOT/bin/claude" DISPATCH_RESERVATION_DIR="$GSC_ROOT/reservations" \
  DISPATCH_SELECTION_LOG_DIR="$GSC_ROOT/seldir" "$GSC_GST" 2>/dev/null)
assert_eq "graph-select-target: live-session-owned human node-id worktree is skipped" "empty" "$gsc_skip"
# Case 2 (negative control) — same fixture, daemon reports NO sessions ([]).
# The worktree dir still exists, so this pins that existence alone does not
# claim: the node IS selected.
echo "Test: graph-select-target — orphan node-id worktree (no live session) stays selectable (Unit 3 negative control)"
printf '%s' '[]' > "$GSC_ROOT/claude-payload.json"
gsc_sel=$(PATH="$GSC_ROOT/bin:$SAVED_PATH" \
  CLAUDE_AGENTS_CMD="$GSC_ROOT/bin/claude" DISPATCH_RESERVATION_DIR="$GSC_ROOT/reservations" \
  DISPATCH_SELECTION_LOG_DIR="$GSC_ROOT/seldir" "$GSC_GST" 2>/dev/null)
assert_eq "graph-select-target: orphan node-id worktree (no session) is selected" "node tactic-fixture tactic implement" "$gsc_sel"
rm -rf "$GSC_ROOT" "$GSC_BARE"

# ============================================================================
# Test: graph-select-target --standalone — lock + headroom + claim wrapping
# (tactic-graph-router-live-worker-visibility Unit 2)
# ============================================================================
# --standalone folds the lock-acquire -> headroom-check -> (clamp) -> select ->
# claim -> release cycle dispatch-select-tick otherwise wraps around this
# selector into one self-contained invocation, for manual/emulated callers.
# The fixture extends the Unit-3 graph-select-target harness above: same
# real-git-repo + fake-npx + fake-`claude` shape, plus (a) a real (uncopied-
# stub) `dispatch-acquire-lock` physically copied alongside graph-select-target
# (it sources lib.sh via its own SCRIPT_DIR, same reason the Unit-3 fixture
# copies rather than symlinks), and (b) a `dispatch-target-workers` fake using
# the SEL_MAX_WORKERS/SEL_EXHAUSTED/SEL_TARGET_N idiom from sel_tick_setup
# (test-dispatch-scripts.sh's dispatch-select-tick harness), placed inside the
# fixture's scripts dir since graph-select-target resolves it as a sibling via
# $SCRIPT_DIR.
#
# Each case below gets a fresh fixture (gsc_standalone_setup/_teardown) so a
# failure in one case cannot cascade into the next. Env vars needed only for
# the single invocation under test are passed as a command prefix (not
# `export`ed into the shell), mirroring the Unit-3 fixture's own convention.
gsc_standalone_setup() {
  GSCS_ROOT=$(mktemp -d)
  GSCS_BARE=$(mktemp -d)
  GSCS_SCRIPTS="$GSCS_ROOT/.claude/skills/dispatch-propagate/scripts"
  mkdir -p "$GSCS_SCRIPTS" "$GSCS_ROOT/bin"
  # Physical copies (not symlinks): both graph-select-target and
  # dispatch-acquire-lock derive their own on-disk location via SCRIPT_DIR.
  cp "$SCRIPT_DIR"/graph-select-target "$SCRIPT_DIR"/dispatch-acquire-lock \
     "$SCRIPT_DIR"/lib.sh "$SCRIPT_DIR"/lib-*.sh "$GSCS_SCRIPTS/"
  chmod +x "$GSCS_SCRIPTS/graph-select-target" "$GSCS_SCRIPTS/dispatch-acquire-lock"
  # Fake npx: one selectable implement-phase candidate (same shape as the
  # Unit-3 fixture above) so only the standalone lock/headroom/claim wrapping
  # this unit covers is exercised.
  cat > "$GSCS_ROOT/bin/npx" <<'GSCSNPX'
#!/usr/bin/env bash
echo '{"candidates":[{"id":"tactic-standalone-fixture","kind":"tactic","phase":"implement","pr":null,"pace_exempt":false}],"events":[]}'
exit 0
GSCSNPX
  chmod +x "$GSCS_ROOT/bin/npx"
  # Fake dispatch-target-workers: the SEL_MAX_WORKERS/SEL_EXHAUSTED/SEL_TARGET_N
  # idiom from sel_tick_setup's own fake, reused verbatim.
  cat > "$GSCS_SCRIPTS/dispatch-target-workers" <<'GSCSDTW'
#!/usr/bin/env bash
if [[ "$1" == "--exhausted" ]]; then
  echo "${SEL_EXHAUSTED:-ok}"
  exit 0
fi
if [[ "$1" == "--max" ]]; then
  echo "${SEL_MAX_WORKERS:-8}"
  exit 0
fi
echo "${SEL_TARGET_N:-1}"
GSCSDTW
  chmod +x "$GSCS_SCRIPTS/dispatch-target-workers"
  # A git repo whose origin/main carries an intentions/ tree, main checked out
  # at the fixture root so NATIVE_ROOT resolves there.
  git init -q -b main "$GSCS_ROOT"
  git -C "$GSCS_ROOT" config user.email t@t
  git -C "$GSCS_ROOT" config user.name t
  mkdir -p "$GSCS_ROOT/intentions"
  echo '# placeholder' > "$GSCS_ROOT/intentions/placeholder.md"
  git -C "$GSCS_ROOT" add -A
  git -C "$GSCS_ROOT" commit -q -m seed
  git init -q --bare -b main "$GSCS_BARE"
  git -C "$GSCS_ROOT" remote add origin "$GSCS_BARE"
  git -C "$GSCS_ROOT" push -q origin main
  git -C "$GSCS_ROOT" fetch -q origin
  # Fake `claude agents --json`: payload driven by a rewritable file, default
  # empty registry (no busy workers, no live sessions).
  cat > "$GSCS_ROOT/bin/claude" <<'GSCSCLAUDE'
#!/usr/bin/env bash
_root="$(cd "$(dirname "$0")/.." && pwd)"
cat "$_root/claude-payload.json"
exit 0
GSCSCLAUDE
  chmod +x "$GSCS_ROOT/bin/claude"
  printf '%s' '[]' > "$GSCS_ROOT/claude-payload.json"
  GSCS_GST="$GSCS_SCRIPTS/graph-select-target"
}

gsc_standalone_teardown() {
  rm -rf "$GSCS_ROOT" "$GSCS_BARE"
  GSCS_ROOT="" ; GSCS_BARE="" ; GSCS_SCRIPTS="" ; GSCS_GST=""
}

# --- Case 1: headroom available -> selects, claims, releases the lock --------
echo "Test: graph-select-target --standalone with headroom available selects, claims a reservation, and releases the lock"
gsc_standalone_setup
gsc1_out=$(PATH="$GSCS_ROOT/bin:$SAVED_PATH" \
  CLAUDE_AGENTS_CMD="$GSCS_ROOT/bin/claude" DISPATCH_RESERVATION_DIR="$GSCS_ROOT/reservations" \
  DISPATCH_SELECTION_LOG_DIR="$GSCS_ROOT/seldir" DISPATCH_LOCK_FILE="$GSCS_ROOT/dispatch.lock" \
  CLAUDE_CODE_SESSION_ID="gsc-standalone-1" SEL_MAX_WORKERS=8 \
  "$GSCS_GST" --standalone --top 1 2>/dev/null)
assert_eq "graph-select-target --standalone: headroom available selects the candidate" \
  "node tactic-standalone-fixture tactic implement" "$gsc1_out"
assert_eq "graph-select-target --standalone: selected id gets a reservation-ledger marker" \
  "1" "$([ -f "$GSCS_ROOT/reservations/tactic-standalone-fixture" ] && echo 1 || echo 0)"
# Release convention (mirrors the dispatch-acquire-lock suite's own --release
# test): a strict self-release EMPTIES the lock file's contents (the file
# itself is left in place). A non-empty file here would mean the trap's
# self-release never fired or fired against the wrong session.
gsc1_lock=$(cat "$GSCS_ROOT/dispatch.lock" 2>/dev/null || true)
TOTAL=$((TOTAL + 1))
if [[ -z "$gsc1_lock" ]]; then
  PASS=$((PASS + 1)); echo "  PASS: graph-select-target --standalone releases the lock (file emptied)"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: graph-select-target --standalone releases the lock (file emptied)"
  echo "    lock file: '$gsc1_lock'"
fi
gsc_standalone_teardown

# --- Case 2: HEADROOM == 0 -> degrades to empty, no claim, lock released -----
echo "Test: graph-select-target --standalone with HEADROOM == 0 degrades to empty without claiming or leaking the lock"
gsc_standalone_setup
# One busy worker (name matches claude_agents_count_busy_workers' ^[0-9]+-
# shape) against SEL_MAX_WORKERS=1 -> LIVE_COUNT=1, HEADROOM=1-1=0.
printf '%s' '[{"sessionId":"s1","pid":1,"status":"busy","name":"1-worker","cwd":""}]' \
  > "$GSCS_ROOT/claude-payload.json"
gsc2_out=$(PATH="$GSCS_ROOT/bin:$SAVED_PATH" \
  CLAUDE_AGENTS_CMD="$GSCS_ROOT/bin/claude" DISPATCH_RESERVATION_DIR="$GSCS_ROOT/reservations" \
  DISPATCH_SELECTION_LOG_DIR="$GSCS_ROOT/seldir" DISPATCH_LOCK_FILE="$GSCS_ROOT/dispatch.lock" \
  CLAUDE_CODE_SESSION_ID="gsc-standalone-2" SEL_MAX_WORKERS=1 \
  "$GSCS_GST" --standalone --top 1 2>/dev/null)
assert_eq "graph-select-target --standalone: HEADROOM == 0 prints empty" "empty" "$gsc2_out"
assert_eq "graph-select-target --standalone: HEADROOM == 0 writes no reservation marker" \
  "0" "$([ -f "$GSCS_ROOT/reservations/tactic-standalone-fixture" ] && echo 1 || echo 0)"
gsc2_lock=$(cat "$GSCS_ROOT/dispatch.lock" 2>/dev/null || true)
TOTAL=$((TOTAL + 1))
if [[ -z "$gsc2_lock" ]]; then
  PASS=$((PASS + 1)); echo "  PASS: graph-select-target --standalone (HEADROOM 0) releases the lock (file emptied)"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: graph-select-target --standalone (HEADROOM 0) releases the lock (file emptied)"
  echo "    lock file: '$gsc2_lock'"
fi
gsc_standalone_teardown

# --- Case 3: lock already held by a live foreign session -> degrades to empty
echo "Test: graph-select-target --standalone with the lock held by a live foreign session degrades to empty (never double-claims)"
gsc_standalone_setup
# Pre-seed the lock file with a foreign holder (mirrors the dispatch-acquire-
# lock suite's own foreign-live-holder fixtures, e.g. its Test 9 at
# "--wait against a live foreign holder times out"). The fake `claude`
# registry reports that foreign session as live/busy so the liveness check
# does not reclaim it.
printf '%s\n' "gsc-standalone-3-foreign" > "$GSCS_ROOT/dispatch.lock"
printf '%s' '[{"sessionId":"gsc-standalone-3-foreign","pid":1,"status":"busy","name":"x","cwd":""}]' \
  > "$GSCS_ROOT/claude-payload.json"
gsc3_out=$(PATH="$GSCS_ROOT/bin:$SAVED_PATH" \
  CLAUDE_AGENTS_CMD="$GSCS_ROOT/bin/claude" DISPATCH_RESERVATION_DIR="$GSCS_ROOT/reservations" \
  DISPATCH_SELECTION_LOG_DIR="$GSCS_ROOT/seldir" DISPATCH_LOCK_FILE="$GSCS_ROOT/dispatch.lock" \
  CLAUDE_CODE_SESSION_ID="gsc-standalone-3-self" DISPATCH_LOCK_WAIT_TIMEOUT=0 SEL_MAX_WORKERS=8 \
  "$GSCS_GST" --standalone --top 1 2>/dev/null)
assert_eq "graph-select-target --standalone: contended lock degrades to empty" "empty" "$gsc3_out"
assert_eq "graph-select-target --standalone: contended lock writes no reservation marker" \
  "0" "$([ -f "$GSCS_ROOT/reservations/tactic-standalone-fixture" ] && echo 1 || echo 0)"
# The foreign holder's lock must be untouched — this invocation never
# acquired it, so it must never release (empty) or overwrite it either.
assert_eq "graph-select-target --standalone: contended lock leaves the foreign holder untouched" \
  "gsc-standalone-3-foreign" "$(cat "$GSCS_ROOT/dispatch.lock" 2>/dev/null || true)"
gsc_standalone_teardown

# --- Case 4: non-standalone invocation is byte-for-byte unchanged (regression)
echo "Test: graph-select-target without --standalone never touches the lock or the reservation ledger (Unit 1 regression guard)"
gsc_standalone_setup
gsc4_out=$(PATH="$GSCS_ROOT/bin:$SAVED_PATH" \
  CLAUDE_AGENTS_CMD="$GSCS_ROOT/bin/claude" DISPATCH_RESERVATION_DIR="$GSCS_ROOT/reservations" \
  DISPATCH_SELECTION_LOG_DIR="$GSCS_ROOT/seldir" DISPATCH_LOCK_FILE="$GSCS_ROOT/dispatch.lock" \
  "$GSCS_GST" --top 1 2>/dev/null)
assert_eq "graph-select-target (no --standalone): selection proceeds normally" \
  "node tactic-standalone-fixture tactic implement" "$gsc4_out"
assert_eq "graph-select-target (no --standalone): the lock file is never created" \
  "0" "$([ -e "$GSCS_ROOT/dispatch.lock" ] && echo 1 || echo 0)"
assert_eq "graph-select-target (no --standalone): no reservation marker is written" \
  "0" "$([ -f "$GSCS_ROOT/reservations/tactic-standalone-fixture" ] && echo 1 || echo 0)"
gsc_standalone_teardown

# --- Case 5: EXHAUSTED == exhausted -> degrades to empty even with ample -----
# headroom (isolates the rate-limit-window term of the degrade condition from
# the HEADROOM==0 term Case 2 already covers). Default empty `[]` registry ->
# BUSY=0, RESV=0; SEL_MAX_WORKERS=8 -> HEADROOM=8-0=8, a healthy non-zero
# headroom, so only `[[ "$EXHAUSTED" == exhausted ]]` can trigger the degrade.
echo "Test: graph-select-target --standalone with EXHAUSTED == exhausted degrades to empty despite ample headroom"
gsc_standalone_setup
gsc5_out=$(PATH="$GSCS_ROOT/bin:$SAVED_PATH" \
  CLAUDE_AGENTS_CMD="$GSCS_ROOT/bin/claude" DISPATCH_RESERVATION_DIR="$GSCS_ROOT/reservations" \
  DISPATCH_SELECTION_LOG_DIR="$GSCS_ROOT/seldir" DISPATCH_LOCK_FILE="$GSCS_ROOT/dispatch.lock" \
  CLAUDE_CODE_SESSION_ID="gsc-standalone-5" SEL_MAX_WORKERS=8 SEL_EXHAUSTED=exhausted \
  "$GSCS_GST" --standalone --top 1 2>/dev/null)
assert_eq "graph-select-target --standalone: EXHAUSTED == exhausted prints empty" "empty" "$gsc5_out"
assert_eq "graph-select-target --standalone: EXHAUSTED == exhausted writes no reservation marker" \
  "0" "$([ -f "$GSCS_ROOT/reservations/tactic-standalone-fixture" ] && echo 1 || echo 0)"
gsc5_lock=$(cat "$GSCS_ROOT/dispatch.lock" 2>/dev/null || true)
TOTAL=$((TOTAL + 1))
if [[ -z "$gsc5_lock" ]]; then
  PASS=$((PASS + 1)); echo "  PASS: graph-select-target --standalone (EXHAUSTED) releases the lock (file emptied)"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: graph-select-target --standalone (EXHAUSTED) releases the lock (file emptied)"
  echo "    lock file: '$gsc5_lock'"
fi
gsc_standalone_teardown

# --- Case 6: busy-read UNKNOWN -> headroom skipped, TOP clamped to 1 ---------
# The `else` branch of the --standalone headroom block: when
# claude_agents_count_busy_workers returns non-zero (daemon UNKNOWN), the
# headroom computation is skipped entirely and the selector fails OPEN with
# `(( TOP > 1 )) && TOP=1` — the standalone analogue of dispatch-select-tick's
# "GAP stays 1". A regression dropping that clamp would let a manual tick fan
# out unbounded while the live-worker count is unknown, which is exactly the
# double-dispatch race the --standalone wrapping exists to prevent.
#
# Why an appended function override instead of a corrupt claude-payload.json:
# claude_agents_count_busy_workers and claude_agents_list_all both read the
# SAME _claude_agents_raw query in lib-claude-agents.sh, and
# worktree_has_live_session folds an UNKNOWN list_all into "occupied" as a
# fail-safe. A corrupt payload therefore makes EVERY candidate skip as
# `live-session` and the run print `empty`, so the TOP clamp becomes
# unobservable. Splitting the fake `claude` on its args does not help either —
# neither call passes --cwd. Instead, since the fixture already works on
# physical COPIES of the libs inside $GSCS_SCRIPTS, append a redefinition to
# the COPY of lib-claude-agents.sh AFTER its terminating `fi` (the whole
# library body sits inside a source-once guard whose `fi` is the last line, so
# an appended definition executes on every source and wins over the original).
# That makes only the busy-read UNKNOWN, leaving claude_agents_list_all /
# worktree_has_live_session healthy against the default `[]` registry so
# candidates stay selectable. Do NOT "simplify" this back into a payload edit.
#
# Making the clamp observable: the default fake npx emits ONE candidate, so
# TOP=1 and TOP=3 look identical. Case 6 rewrites the fake npx with TWO
# candidates (rewriting fixture files per case is the existing convention —
# Cases 2 and 3 rewrite claude-payload.json) and asks for --top 3 with ample
# SEL_MAX_WORKERS=8. TOP is enforced in the selection loop
# (`(( SELECTED_COUNT >= TOP )) && continue`), so a working clamp yields
# exactly ONE `node ...` line and exactly ONE reservation marker.
echo "Test: graph-select-target --standalone with an UNKNOWN busy-worker read skips the headroom check and clamps TOP to 1"
gsc_standalone_setup
cat >> "$GSCS_SCRIPTS/lib-claude-agents.sh" <<'GSCS6LIB'

# Test override (appended after the source-once guard's terminating `fi`):
# force the busy-worker read to report UNKNOWN while leaving every other
# helper — notably claude_agents_list_all / worktree_has_live_session — intact.
claude_agents_count_busy_workers() { return 1; }
GSCS6LIB
cat > "$GSCS_ROOT/bin/npx" <<'GSCS6NPX'
#!/usr/bin/env bash
echo '{"candidates":[{"id":"tactic-standalone-fixture","kind":"tactic","phase":"implement","pr":null,"pace_exempt":false},{"id":"tactic-standalone-fixture-2","kind":"tactic","phase":"implement","pr":null,"pace_exempt":false}],"events":[]}'
exit 0
GSCS6NPX
chmod +x "$GSCS_ROOT/bin/npx"
gsc6_out=$(PATH="$GSCS_ROOT/bin:$SAVED_PATH" \
  CLAUDE_AGENTS_CMD="$GSCS_ROOT/bin/claude" DISPATCH_RESERVATION_DIR="$GSCS_ROOT/reservations" \
  DISPATCH_SELECTION_LOG_DIR="$GSCS_ROOT/seldir" DISPATCH_LOCK_FILE="$GSCS_ROOT/dispatch.lock" \
  CLAUDE_CODE_SESSION_ID="gsc-standalone-6" SEL_MAX_WORKERS=8 \
  "$GSCS_GST" --standalone --top 3 2>/dev/null)
# Exactly one selection line, and it is the first candidate in the fake npx
# order (candidate order IS selection order — the selector emits pre-ordered
# candidates and only environmental gates remain).
assert_eq "graph-select-target --standalone: UNKNOWN busy read clamps TOP to 1 (one selection line)" \
  "node tactic-standalone-fixture tactic implement" "$gsc6_out"
# The reservation ledger is the load-bearing half of the assertion: a marker
# for the second candidate would mean the clamp did not hold and the stdout
# above was merely truncated.
assert_eq "graph-select-target --standalone: UNKNOWN busy read claims the first candidate" \
  "1" "$([ -f "$GSCS_ROOT/reservations/tactic-standalone-fixture" ] && echo 1 || echo 0)"
assert_eq "graph-select-target --standalone: UNKNOWN busy read claims NO second candidate" \
  "0" "$([ -f "$GSCS_ROOT/reservations/tactic-standalone-fixture-2" ] && echo 1 || echo 0)"
gsc6_lock=$(cat "$GSCS_ROOT/dispatch.lock" 2>/dev/null || true)
TOTAL=$((TOTAL + 1))
if [[ -z "$gsc6_lock" ]]; then
  PASS=$((PASS + 1)); echo "  PASS: graph-select-target --standalone (UNKNOWN busy read) releases the lock (file emptied)"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: graph-select-target --standalone (UNKNOWN busy read) releases the lock (file emptied)"
  echo "    lock file: '$gsc6_lock'"
fi
gsc_standalone_teardown

# --- Case 7: control for Case 6 — same two candidates, HEALTHY busy read -----
# Without this control, Case 6 would pass even if the fixture could only ever
# return a single node for some unrelated reason. Identical two-candidate npx,
# identical SEL_MAX_WORKERS=8 / --top 3, but NO count_busy_workers override:
# BUSY=0, RESV=0 -> HEADROOM=8, TOP stays 3, so BOTH candidates are selected
# and claimed. That makes the Case 6 clamp provably load-bearing.
# SEL_TARGET_N=8 as well: the pace-curve gap (TARGET_N - LIVE_COUNT) is the
# SECOND ceiling --standalone honors, so "ample headroom" now means ample on both
# axes — the fixture's default SEL_TARGET_N=1 would otherwise clamp TOP to 1 for
# the pace reason and mask the ceiling behavior this control isolates.
echo "Test: graph-select-target --standalone with a healthy busy-worker read and ample headroom selects both candidates (Case 6 control)"
gsc_standalone_setup
cat > "$GSCS_ROOT/bin/npx" <<'GSCS7NPX'
#!/usr/bin/env bash
echo '{"candidates":[{"id":"tactic-standalone-fixture","kind":"tactic","phase":"implement","pr":null,"pace_exempt":false},{"id":"tactic-standalone-fixture-2","kind":"tactic","phase":"implement","pr":null,"pace_exempt":false}],"events":[]}'
exit 0
GSCS7NPX
chmod +x "$GSCS_ROOT/bin/npx"
gsc7_out=$(PATH="$GSCS_ROOT/bin:$SAVED_PATH" \
  CLAUDE_AGENTS_CMD="$GSCS_ROOT/bin/claude" DISPATCH_RESERVATION_DIR="$GSCS_ROOT/reservations" \
  DISPATCH_SELECTION_LOG_DIR="$GSCS_ROOT/seldir" DISPATCH_LOCK_FILE="$GSCS_ROOT/dispatch.lock" \
  CLAUDE_CODE_SESSION_ID="gsc-standalone-7" SEL_MAX_WORKERS=8 SEL_TARGET_N=8 \
  "$GSCS_GST" --standalone --top 3 2>/dev/null)
assert_eq "graph-select-target --standalone: healthy busy read leaves TOP unclamped (both selection lines)" \
  "node tactic-standalone-fixture tactic implement
node tactic-standalone-fixture-2 tactic implement" "$gsc7_out"
assert_eq "graph-select-target --standalone: healthy busy read claims the first candidate" \
  "1" "$([ -f "$GSCS_ROOT/reservations/tactic-standalone-fixture" ] && echo 1 || echo 0)"
assert_eq "graph-select-target --standalone: healthy busy read ALSO claims the second candidate" \
  "1" "$([ -f "$GSCS_ROOT/reservations/tactic-standalone-fixture-2" ] && echo 1 || echo 0)"
gsc7_lock=$(cat "$GSCS_ROOT/dispatch.lock" 2>/dev/null || true)
TOTAL=$((TOTAL + 1))
if [[ -z "$gsc7_lock" ]]; then
  PASS=$((PASS + 1)); echo "  PASS: graph-select-target --standalone (healthy busy read) releases the lock (file emptied)"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: graph-select-target --standalone (healthy busy read) releases the lock (file emptied)"
  echo "    lock file: '$gsc7_lock'"
fi
gsc_standalone_teardown

# --- Case 8: non-numeric --max ceiling -> fail open to TOP=1, not empty ------
# The third environmental read in the --standalone headroom block. Unguarded,
# a word-shaped ceiling makes `$(( MAX_WORKERS - LIVE_COUNT ))` abort the whole
# script under `set -u`; an EMPTY one silently evaluates to a negative headroom
# that the floor clamps to 0, producing the concurrency-cap `empty` disposition
# — "fleet saturated" reported when the truth is "ceiling unreadable". Both must
# instead fail OPEN to the same TOP=1 floor the busy-read UNKNOWN branch uses
# (Case 6), with a distinguishing stderr diagnostic.
#
# Observability mirrors Case 6 exactly: two candidates + `--top 3`, so a
# working clamp yields exactly ONE selection line and ONE reservation marker,
# while a REGRESSION to the old behaviour yields `empty` and zero markers —
# the two failure shapes are distinct, so this case cannot pass vacuously.
echo "Test: graph-select-target --standalone with a non-numeric --max ceiling fails open to TOP 1 instead of reporting concurrency-cap"
gsc_standalone_setup
cat > "$GSCS_ROOT/bin/npx" <<'GSCS8NPX'
#!/usr/bin/env bash
echo '{"candidates":[{"id":"tactic-standalone-fixture","kind":"tactic","phase":"implement","pr":null,"pace_exempt":false},{"id":"tactic-standalone-fixture-2","kind":"tactic","phase":"implement","pr":null,"pace_exempt":false}],"events":[]}'
exit 0
GSCS8NPX
chmod +x "$GSCS_ROOT/bin/npx"
gsc8_out=$(PATH="$GSCS_ROOT/bin:$SAVED_PATH" \
  CLAUDE_AGENTS_CMD="$GSCS_ROOT/bin/claude" DISPATCH_RESERVATION_DIR="$GSCS_ROOT/reservations" \
  DISPATCH_SELECTION_LOG_DIR="$GSCS_ROOT/seldir" DISPATCH_LOCK_FILE="$GSCS_ROOT/dispatch.lock" \
  CLAUDE_CODE_SESSION_ID="gsc-standalone-8" SEL_MAX_WORKERS="notanumber" \
  "$GSCS_GST" --standalone --top 3 2>"$GSCS_ROOT/gsc8.err")
assert_eq "graph-select-target --standalone: non-numeric --max still selects, clamped to TOP 1" \
  "node tactic-standalone-fixture tactic implement" "$gsc8_out"
assert_eq "graph-select-target --standalone: non-numeric --max claims the first candidate" \
  "1" "$([ -f "$GSCS_ROOT/reservations/tactic-standalone-fixture" ] && echo 1 || echo 0)"
assert_eq "graph-select-target --standalone: non-numeric --max claims NO second candidate" \
  "0" "$([ -f "$GSCS_ROOT/reservations/tactic-standalone-fixture-2" ] && echo 1 || echo 0)"
# The operator-facing half: a diagnostic naming the offending value, so an
# unreadable ceiling is never mistaken for a saturated fleet.
assert_eq "graph-select-target --standalone: non-numeric --max writes a distinguishing stderr diagnostic" \
  "1" "$(grep -q "dispatch-target-workers --max returned a non-numeric ceiling ('notanumber')" "$GSCS_ROOT/gsc8.err" && echo 1 || echo 0)"
gsc8_lock=$(cat "$GSCS_ROOT/dispatch.lock" 2>/dev/null || true)
TOTAL=$((TOTAL + 1))
if [[ -z "$gsc8_lock" ]]; then
  PASS=$((PASS + 1)); echo "  PASS: graph-select-target --standalone (non-numeric --max) releases the lock (file emptied)"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: graph-select-target --standalone (non-numeric --max) releases the lock (file emptied)"
  echo "    lock file: '$gsc8_lock'"
fi
gsc_standalone_teardown

# --- Case 9: --max read FAILS outright -> same fail-open ---------------------
# Case 8's sibling on the other failure shape: the ceiling read exits non-zero
# with no output (dispatch-target-workers absent, non-executable, or erroring),
# so MAX_WORKERS is EMPTY rather than word-shaped. The `|| MAX_WORKERS=""`
# capture plus the numeric guard must land it on the identical TOP=1 fail-open.
# Rewriting the fixture's own dispatch-target-workers per case is the existing
# convention (Cases 2/3 rewrite claude-payload.json, 6/7 rewrite the fake npx);
# the no-arg SEL_TARGET_N branch is preserved so nothing else in the run shifts.
echo "Test: graph-select-target --standalone with a failing --max read fails open to TOP 1 instead of reporting concurrency-cap"
gsc_standalone_setup
cat > "$GSCS_SCRIPTS/dispatch-target-workers" <<'GSCS9DTW'
#!/usr/bin/env bash
if [[ "$1" == "--exhausted" ]]; then
  echo "${SEL_EXHAUSTED:-ok}"
  exit 0
fi
if [[ "$1" == "--max" ]]; then
  echo "dispatch-target-workers: config unreadable" >&2
  exit 1
fi
echo "${SEL_TARGET_N:-1}"
GSCS9DTW
chmod +x "$GSCS_SCRIPTS/dispatch-target-workers"
cat > "$GSCS_ROOT/bin/npx" <<'GSCS9NPX'
#!/usr/bin/env bash
echo '{"candidates":[{"id":"tactic-standalone-fixture","kind":"tactic","phase":"implement","pr":null,"pace_exempt":false},{"id":"tactic-standalone-fixture-2","kind":"tactic","phase":"implement","pr":null,"pace_exempt":false}],"events":[]}'
exit 0
GSCS9NPX
chmod +x "$GSCS_ROOT/bin/npx"
gsc9_out=$(PATH="$GSCS_ROOT/bin:$SAVED_PATH" \
  CLAUDE_AGENTS_CMD="$GSCS_ROOT/bin/claude" DISPATCH_RESERVATION_DIR="$GSCS_ROOT/reservations" \
  DISPATCH_SELECTION_LOG_DIR="$GSCS_ROOT/seldir" DISPATCH_LOCK_FILE="$GSCS_ROOT/dispatch.lock" \
  CLAUDE_CODE_SESSION_ID="gsc-standalone-9" \
  "$GSCS_GST" --standalone --top 3 2>"$GSCS_ROOT/gsc9.err")
assert_eq "graph-select-target --standalone: failing --max read still selects, clamped to TOP 1" \
  "node tactic-standalone-fixture tactic implement" "$gsc9_out"
assert_eq "graph-select-target --standalone: failing --max read claims the first candidate" \
  "1" "$([ -f "$GSCS_ROOT/reservations/tactic-standalone-fixture" ] && echo 1 || echo 0)"
assert_eq "graph-select-target --standalone: failing --max read claims NO second candidate" \
  "0" "$([ -f "$GSCS_ROOT/reservations/tactic-standalone-fixture-2" ] && echo 1 || echo 0)"
assert_eq "graph-select-target --standalone: failing --max read writes a distinguishing stderr diagnostic" \
  "1" "$(grep -q "headroom unknown, failing open to --top 1" "$GSCS_ROOT/gsc9.err" && echo 1 || echo 0)"
gsc9_lock=$(cat "$GSCS_ROOT/dispatch.lock" 2>/dev/null || true)
TOTAL=$((TOTAL + 1))
if [[ -z "$gsc9_lock" ]]; then
  PASS=$((PASS + 1)); echo "  PASS: graph-select-target --standalone (failing --max read) releases the lock (file emptied)"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: graph-select-target --standalone (failing --max read) releases the lock (file emptied)"
  echo "    lock file: '$gsc9_lock'"
fi
gsc_standalone_teardown

# --- Case 10: EXHAUSTED still wins while the ceiling is UNKNOWN --------------
# The fail-open above must not swallow the rate-limit term of the degrade
# condition. Same failing --max read as Case 9, but SEL_EXHAUSTED=exhausted:
# genuine token exhaustion is a hard stop regardless of whether the concurrency
# ceiling could be read, so this must still degrade to `empty` with no claim.
echo "Test: graph-select-target --standalone with an UNKNOWN ceiling AND an exhausted window still degrades to empty"
gsc_standalone_setup
cat > "$GSCS_SCRIPTS/dispatch-target-workers" <<'GSCS10DTW'
#!/usr/bin/env bash
if [[ "$1" == "--exhausted" ]]; then
  echo "${SEL_EXHAUSTED:-ok}"
  exit 0
fi
if [[ "$1" == "--max" ]]; then
  exit 1
fi
echo "${SEL_TARGET_N:-1}"
GSCS10DTW
chmod +x "$GSCS_SCRIPTS/dispatch-target-workers"
gsc10_out=$(PATH="$GSCS_ROOT/bin:$SAVED_PATH" \
  CLAUDE_AGENTS_CMD="$GSCS_ROOT/bin/claude" DISPATCH_RESERVATION_DIR="$GSCS_ROOT/reservations" \
  DISPATCH_SELECTION_LOG_DIR="$GSCS_ROOT/seldir" DISPATCH_LOCK_FILE="$GSCS_ROOT/dispatch.lock" \
  CLAUDE_CODE_SESSION_ID="gsc-standalone-10" SEL_EXHAUSTED=exhausted \
  "$GSCS_GST" --standalone --top 1 2>/dev/null)
assert_eq "graph-select-target --standalone: UNKNOWN ceiling + exhausted window prints empty" \
  "empty" "$gsc10_out"
assert_eq "graph-select-target --standalone: UNKNOWN ceiling + exhausted window writes no reservation marker" \
  "0" "$([ -f "$GSCS_ROOT/reservations/tactic-standalone-fixture" ] && echo 1 || echo 0)"
gsc10_lock=$(cat "$GSCS_ROOT/dispatch.lock" 2>/dev/null || true)
TOTAL=$((TOTAL + 1))
if [[ -z "$gsc10_lock" ]]; then
  PASS=$((PASS + 1)); echo "  PASS: graph-select-target --standalone (UNKNOWN ceiling + exhausted) releases the lock (file emptied)"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: graph-select-target --standalone (UNKNOWN ceiling + exhausted) releases the lock (file emptied)"
  echo "    lock file: '$gsc10_lock'"
fi
gsc_standalone_teardown

# --- Case 11: pace curve pinned to zero -> degrades to empty, no claim -------
# The documented way to pause the queue is to pin the pace curve so TARGET_N
# drops to 0. --standalone is NOT sovereign (same reason it drops the --manual
# floor-of-1), so it must honor that throttle: with ample MAX_WORKERS headroom
# and a healthy window, SEL_TARGET_N=0 alone must degrade to `empty` with no
# reservation marker. A regression here means any cron job / emulated tick can
# spend the token budget the pause exists to protect.
echo "Test: graph-select-target --standalone with the pace curve pinned to 0 degrades to empty despite ample MAX_WORKERS headroom"
gsc_standalone_setup
gsc11_out=$(PATH="$GSCS_ROOT/bin:$SAVED_PATH" \
  CLAUDE_AGENTS_CMD="$GSCS_ROOT/bin/claude" DISPATCH_RESERVATION_DIR="$GSCS_ROOT/reservations" \
  DISPATCH_SELECTION_LOG_DIR="$GSCS_ROOT/seldir" DISPATCH_LOCK_FILE="$GSCS_ROOT/dispatch.lock" \
  CLAUDE_CODE_SESSION_ID="gsc-standalone-11" SEL_MAX_WORKERS=8 SEL_TARGET_N=0 \
  "$GSCS_GST" --standalone --top 1 2>"$GSCS_ROOT/gsc11.err")
assert_eq "graph-select-target --standalone: TARGET_N == 0 prints empty" "empty" "$gsc11_out"
assert_eq "graph-select-target --standalone: TARGET_N == 0 writes no reservation marker" \
  "0" "$([ -f "$GSCS_ROOT/reservations/tactic-standalone-fixture" ] && echo 1 || echo 0)"
assert_eq "graph-select-target --standalone: TARGET_N == 0 writes a pace-budget diagnostic" \
  "1" "$(grep -q "pace-curve budget exhausted" "$GSCS_ROOT/gsc11.err" && echo 1 || echo 0)"
gsc11_lock=$(cat "$GSCS_ROOT/dispatch.lock" 2>/dev/null || true)
TOTAL=$((TOTAL + 1))
if [[ -z "$gsc11_lock" ]]; then
  PASS=$((PASS + 1)); echo "  PASS: graph-select-target --standalone (pace 0) releases the lock (file emptied)"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: graph-select-target --standalone (pace 0) releases the lock (file emptied)"
  echo "    lock file: '$gsc11_lock'"
fi
gsc_standalone_teardown

# --- Case 12: pace gap TIGHTER than the ceiling clamps TOP to the gap --------
# The clamp takes the MINIMUM of the two ceilings. Ample SEL_MAX_WORKERS=8 with
# SEL_TARGET_N=1 and two candidates at --top 3 must yield exactly ONE selection
# and ONE marker (Case 7 is the mirror control: both ceilings ample -> both).
echo "Test: graph-select-target --standalone clamps TOP to the pace-curve gap when it is tighter than the MAX_WORKERS headroom"
gsc_standalone_setup
cat > "$GSCS_ROOT/bin/npx" <<'GSCS12NPX'
#!/usr/bin/env bash
echo '{"candidates":[{"id":"tactic-standalone-fixture","kind":"tactic","phase":"implement","pr":null,"pace_exempt":false},{"id":"tactic-standalone-fixture-2","kind":"tactic","phase":"implement","pr":null,"pace_exempt":false}],"events":[]}'
exit 0
GSCS12NPX
chmod +x "$GSCS_ROOT/bin/npx"
gsc12_out=$(PATH="$GSCS_ROOT/bin:$SAVED_PATH" \
  CLAUDE_AGENTS_CMD="$GSCS_ROOT/bin/claude" DISPATCH_RESERVATION_DIR="$GSCS_ROOT/reservations" \
  DISPATCH_SELECTION_LOG_DIR="$GSCS_ROOT/seldir" DISPATCH_LOCK_FILE="$GSCS_ROOT/dispatch.lock" \
  CLAUDE_CODE_SESSION_ID="gsc-standalone-12" SEL_MAX_WORKERS=8 SEL_TARGET_N=1 \
  "$GSCS_GST" --standalone --top 3 2>/dev/null)
assert_eq "graph-select-target --standalone: pace gap 1 clamps to one selection line" \
  "node tactic-standalone-fixture tactic implement" "$gsc12_out"
assert_eq "graph-select-target --standalone: pace gap 1 claims the first candidate" \
  "1" "$([ -f "$GSCS_ROOT/reservations/tactic-standalone-fixture" ] && echo 1 || echo 0)"
assert_eq "graph-select-target --standalone: pace gap 1 claims NO second candidate" \
  "0" "$([ -f "$GSCS_ROOT/reservations/tactic-standalone-fixture-2" ] && echo 1 || echo 0)"
# The claim must be stamped `origin=standalone` so reservation_sweep's TTL rule
# can reclaim it if this caller never launches the node (the unbounded-claim
# leak: a live session's markers are otherwise immortal).
assert_eq "graph-select-target --standalone: the claim marker is stamped origin=standalone" \
  "1" "$(grep -qx 'origin=standalone' "$GSCS_ROOT/reservations/tactic-standalone-fixture" && echo 1 || echo 0)"
gsc_standalone_teardown

# --- Case 13: an abort AFTER a claim rolls the claim back --------------------
# Claims are written per-candidate INSIDE the selection loop, but a later
# candidate can abort the whole run: sensor_gate returns 2 on a dispatch-ci-ready
# environment failure and the script exits 2 with no stdout. The caller launches
# nothing, so nothing ever hands those already-written markers to
# dispatch-graph-execute — without the EXIT trap's rollback they sit in the
# ledger consuming budget until the standalone TTL expires (and are invisible to
# the sweep's dead-session rule while the calling session stays alive).
#
# Fixture: candidate 1 is a plain implement-phase node (claimed), candidate 2 is
# a qa-phase node WITH a pr, whose gate reaches `dispatch-ci-ready` — absent from
# this fixture's scripts dir, so it exits 127 and the gate returns 2. `gh` is
# stubbed to fail so the gate's PR reads stay hermetic and offline.
echo "Test: graph-select-target --standalone rolls back claims written before a mid-loop abort (sensor_gate exit 2)"
gsc_standalone_setup
cat > "$GSCS_ROOT/bin/npx" <<'GSCS13NPX'
#!/usr/bin/env bash
echo '{"candidates":[{"id":"tactic-standalone-fixture","kind":"tactic","phase":"implement","pr":null,"pace_exempt":false},{"id":"tactic-standalone-abort","kind":"tactic","phase":"qa","pr":"777","pace_exempt":false}],"events":[]}'
exit 0
GSCS13NPX
chmod +x "$GSCS_ROOT/bin/npx"
cat > "$GSCS_ROOT/bin/gh" <<'GSCS13GH'
#!/usr/bin/env bash
exit 1
GSCS13GH
chmod +x "$GSCS_ROOT/bin/gh"
gsc13_out=$(PATH="$GSCS_ROOT/bin:$SAVED_PATH" \
  CLAUDE_AGENTS_CMD="$GSCS_ROOT/bin/claude" DISPATCH_RESERVATION_DIR="$GSCS_ROOT/reservations" \
  DISPATCH_SELECTION_LOG_DIR="$GSCS_ROOT/seldir" DISPATCH_LOCK_FILE="$GSCS_ROOT/dispatch.lock" \
  CLAUDE_CODE_SESSION_ID="gsc-standalone-13" SEL_MAX_WORKERS=8 SEL_TARGET_N=8 \
  "$GSCS_GST" --standalone --top 2 2>/dev/null) || gsc13_rc=$?
assert_eq "graph-select-target --standalone: mid-loop abort exits 2" "2" "${gsc13_rc:-0}"
assert_eq "graph-select-target --standalone: mid-loop abort prints no selection" "" "$gsc13_out"
assert_eq "graph-select-target --standalone: the pre-abort claim is rolled back" \
  "0" "$([ -f "$GSCS_ROOT/reservations/tactic-standalone-fixture" ] && echo 1 || echo 0)"
gsc13_lock=$(cat "$GSCS_ROOT/dispatch.lock" 2>/dev/null || true)
TOTAL=$((TOTAL + 1))
if [[ -z "$gsc13_lock" ]]; then
  PASS=$((PASS + 1)); echo "  PASS: graph-select-target --standalone (mid-loop abort) releases the lock (file emptied)"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: graph-select-target --standalone (mid-loop abort) releases the lock (file emptied)"
  echo "    lock file: '$gsc13_lock'"
fi
unset gsc13_rc
gsc_standalone_teardown

# <<< END MOVED <<<

# ============================================================================
# Test: graph-select-target — the CI-pending liveness bound
# (tactic-autonomous-ci-pending-liveness-bound Unit 2)
# ============================================================================
# A draft PR whose CI verdict never resolves used to stall the node forever:
# every tick the qa/review gate skipped it as `ci-pending` with no counter and
# no bound. The gate now counts CONSECUTIVE pending observations of the SAME
# head SHA in a sidecar OUTSIDE every checkout
# (<root>/.claude/worktrees/<id>.ci-pending-strikes, `<sha> <count>`), and at
# DISPATCH_CI_PENDING_STRIKE_CAP (8) lands a `ci-pending-stalled` hold via
# hold-node. Below the cap it makes NO graph write at all.
#
# Fixture shape follows the two harnesses above (real git repo + physically
# copied script/libs — graph-select-target derives REPO_ROOT from its own
# on-disk location, so symlinks break it). What is new:
#   - the fake npx emits a `qa`-phase candidate WITH a pr, so sensor_gate takes
#     the qa|review arm rather than the gh-free implement arm;
#   - a fake `gh` on PATH answers both REST reads that arm makes — the PR
#     object (gh_pr_view_rest) and the commit check-runs list
#     (dispatch_ci_verdict_rest, via _gate_maybe_interrupt). The empty
#     check-runs list classifies as `pending`, so the interrupt never fires and
#     the gate falls through to dispatch-ci-ready;
#   - `dispatch-ci-ready` is stubbed as a sibling in the fixture's scripts dir
#     (graph-select-target resolves it via $SCRIPT_DIR), rc driven by
#     CIP_CI_READY_RC;
#   - `packages/intentionsutil/scripts/hold-node` is stubbed INSIDE the fixture
#     repo (the producer invokes it as a path relative to NATIVE_ROOT) and
#     records its argv to $CIP_ROOT/hold-node-argv, which is what makes
#     "held / not held" observable.
CIP_SHA="1111111111111111111111111111111111111111"
CIP_OTHER_SHA="2222222222222222222222222222222222222222"
CIP_SIDECAR_REL=".claude/worktrees/tactic-cip-fixture.ci-pending-strikes"

cip_setup() {
  CIP_ROOT=$(mktemp -d)
  CIP_BARE=$(mktemp -d)
  CIP_SCRIPTS="$CIP_ROOT/.claude/skills/dispatch-propagate/scripts"
  mkdir -p "$CIP_SCRIPTS" "$CIP_ROOT/bin" "$CIP_ROOT/.claude/worktrees" \
           "$CIP_ROOT/packages/intentionsutil/scripts"
  cp "$SCRIPT_DIR"/graph-select-target "$SCRIPT_DIR"/lib.sh "$SCRIPT_DIR"/lib-*.sh \
     "$CIP_SCRIPTS/"
  chmod +x "$CIP_SCRIPTS/graph-select-target"
  # One qa-phase candidate carrying a PR number.
  cat > "$CIP_ROOT/bin/npx" <<'CIPNPX'
#!/usr/bin/env bash
echo '{"candidates":[{"id":"tactic-cip-fixture","kind":"tactic","phase":"qa","pr":"555","pace_exempt":false}],"events":[]}'
exit 0
CIPNPX
  chmod +x "$CIP_ROOT/bin/npx"
  # Fake gh: check-runs -> empty (classifies `pending`); anything else -> the
  # raw REST pull object gh_pr_view_rest projects. `state` must be non-null
  # (that projection ascii_upcases it). The head sha is driven by CIP_HEAD_SHA
  # so a case can simulate a new push.
  cat > "$CIP_ROOT/bin/gh" <<'CIPGH'
#!/usr/bin/env bash
for _a in "$@"; do
  case "$_a" in
    *check-runs*) echo '{"check_runs":[]}'; exit 0 ;;
  esac
done
printf '{"number":555,"title":"t","body":"","state":"open","merged_at":null,"merge_commit_sha":null,"mergeable":null,"mergeable_state":"unknown","head":{"ref":"tactic-cip-fixture","sha":"%s"},"labels":[]}\n' "${CIP_HEAD_SHA:-unset}"
exit 0
CIPGH
  chmod +x "$CIP_ROOT/bin/gh"
  # dispatch-ci-ready: 1 = verdict pending (the bounded arm), 0 = concluded.
  cat > "$CIP_SCRIPTS/dispatch-ci-ready" <<'CIPCIR'
#!/usr/bin/env bash
exit "${CIP_CI_READY_RC:-1}"
CIPCIR
  chmod +x "$CIP_SCRIPTS/dispatch-ci-ready"
  # hold-node: record argv, succeed.
  cat > "$CIP_ROOT/packages/intentionsutil/scripts/hold-node" <<'CIPHOLD'
#!/usr/bin/env bash
_root="$(cd "$(dirname "$0")/../../.." && pwd)"
printf '%s\n' "$@" > "$_root/hold-node-argv"
exit 0
CIPHOLD
  chmod +x "$CIP_ROOT/packages/intentionsutil/scripts/hold-node"
  git init -q -b main "$CIP_ROOT"
  git -C "$CIP_ROOT" config user.email t@t
  git -C "$CIP_ROOT" config user.name t
  mkdir -p "$CIP_ROOT/intentions"
  echo '# placeholder' > "$CIP_ROOT/intentions/placeholder.md"
  git -C "$CIP_ROOT" add -A
  git -C "$CIP_ROOT" commit -q -m seed
  git init -q --bare -b main "$CIP_BARE"
  git -C "$CIP_ROOT" remote add origin "$CIP_BARE"
  git -C "$CIP_ROOT" push -q origin main
  git -C "$CIP_ROOT" fetch -q origin
  cat > "$CIP_ROOT/bin/claude" <<'CIPCLAUDE'
#!/usr/bin/env bash
_root="$(cd "$(dirname "$0")/.." && pwd)"
cat "$_root/claude-payload.json"
exit 0
CIPCLAUDE
  chmod +x "$CIP_ROOT/bin/claude"
  printf '%s' '[]' > "$CIP_ROOT/claude-payload.json"
  CIP_GST="$CIP_SCRIPTS/graph-select-target"
  CIP_SIDECAR="$CIP_ROOT/$CIP_SIDECAR_REL"
}

cip_teardown() {
  rm -rf "$CIP_ROOT" "$CIP_BARE"
  CIP_ROOT="" ; CIP_BARE="" ; CIP_SCRIPTS="" ; CIP_GST="" ; CIP_SIDECAR=""
}

# cip_run <extra args...> — one selector invocation with the fixture env.
cip_run() {
  PATH="$CIP_ROOT/bin:$SAVED_PATH" \
    CLAUDE_AGENTS_CMD="$CIP_ROOT/bin/claude" \
    DISPATCH_RESERVATION_DIR="$CIP_ROOT/reservations" \
    DISPATCH_SELECTION_LOG_DIR="$CIP_ROOT/seldir" \
    CIP_HEAD_SHA="$CIP_SHA" CIP_CI_READY_RC="${CIP_CI_READY_RC:-1}" \
    "$CIP_GST" "$@" 2>/dev/null
}

cip_held() { [ -f "$CIP_ROOT/hold-node-argv" ] && echo 1 || echo 0; }
cip_sidecar() { cat "$CIP_SIDECAR" 2>/dev/null || echo "ABSENT"; }

# --- Case 1: first pending observation -> strike 1, no hold -----------------
echo "Test: graph-select-target — a first pending-CI observation writes strike 1 and never holds"
cip_setup
cip1_out=$(cip_run)
assert_eq "graph-select-target ci-pending: below the cap the node is simply skipped" \
  "empty" "$cip1_out"
assert_eq "graph-select-target ci-pending: the sidecar records <sha> 1" \
  "$CIP_SHA 1" "$(cip_sidecar)"
assert_eq "graph-select-target ci-pending: no hold is landed below the cap" "0" "$(cip_held)"
cip_teardown

# --- Case 2: same head SHA accumulates --------------------------------------
echo "Test: graph-select-target — a pending observation on the SAME head SHA increments the strike count"
cip_setup
printf '%s 3\n' "$CIP_SHA" > "$CIP_SIDECAR"
cip2_out=$(cip_run)
assert_eq "graph-select-target ci-pending: same-SHA observation still skips" "empty" "$cip2_out"
assert_eq "graph-select-target ci-pending: same-SHA observation bumps 3 -> 4" \
  "$CIP_SHA 4" "$(cip_sidecar)"
assert_eq "graph-select-target ci-pending: no hold at strike 4 of 8" "0" "$(cip_held)"
cip_teardown

# --- Case 3: a new head SHA resets the ladder -------------------------------
# The count means "consecutive pending observations of THIS head SHA". A push
# (new SHA) starts a fresh CI run, so the accumulated strikes must not carry
# over — otherwise a healthy node that pushed after a stall would hold on its
# first pending tick.
echo "Test: graph-select-target — a changed head SHA resets the pending-CI strike ladder to 1"
cip_setup
printf '%s 7\n' "$CIP_OTHER_SHA" > "$CIP_SIDECAR"
cip3_out=$(cip_run)
assert_eq "graph-select-target ci-pending: changed-SHA observation still skips" "empty" "$cip3_out"
assert_eq "graph-select-target ci-pending: changed SHA resets the count to 1" \
  "$CIP_SHA 1" "$(cip_sidecar)"
assert_eq "graph-select-target ci-pending: a reset never holds" "0" "$(cip_held)"
cip_teardown

# --- Case 4: at the cap -> tracked hold, sidecar cleared --------------------
echo "Test: graph-select-target — the DISPATCH_CI_PENDING_STRIKE_CAP-th consecutive pending observation lands a ci-pending-stalled hold"
cip_setup
printf '%s 7\n' "$CIP_SHA" > "$CIP_SIDECAR"
cip4_out=$(cip_run)
assert_eq "graph-select-target ci-pending: the capped tick still prints empty" "empty" "$cip4_out"
assert_eq "graph-select-target ci-pending: the cap invokes hold-node" "1" "$(cip_held)"
assert_eq "graph-select-target ci-pending: the hold names the source node id" \
  "1" "$(grep -qx 'tactic-cip-fixture' "$CIP_ROOT/hold-node-argv" && echo 1 || echo 0)"
assert_eq "graph-select-target ci-pending: the hold uses --kind ci-pending-stalled" \
  "1" "$(grep -qx 'ci-pending-stalled' "$CIP_ROOT/hold-node-argv" && echo 1 || echo 0)"
# No --reset-fix-attempt: this hold is unrelated to the fix ladder.
assert_eq "graph-select-target ci-pending: the hold does NOT reset the fix-attempt ladder" \
  "0" "$(grep -qx -- '--reset-fix-attempt' "$CIP_ROOT/hold-node-argv" && echo 1 || echo 0)"
assert_eq "graph-select-target ci-pending: a landed hold clears the sidecar" \
  "ABSENT" "$(cip_sidecar)"
cip_teardown

# --- Case 5: the explicit --node lane is exempt -----------------------------
# `dispatch <node-id>` is the human lane; repeated human invocations must not
# burn the AUTONOMOUS strike budget. The sidecar must be left exactly as found
# and no hold landed, however close to the cap it already is.
echo "Test: graph-select-target — the explicit --node lane neither counts pending-CI strikes nor holds"
cip_setup
printf '%s 7\n' "$CIP_SHA" > "$CIP_SIDECAR"
cip5_out=$(cip_run --node tactic-cip-fixture)
assert_eq "graph-select-target ci-pending: --node still skips on a pending verdict" "empty" "$cip5_out"
assert_eq "graph-select-target ci-pending: --node leaves the sidecar untouched" \
  "$CIP_SHA 7" "$(cip_sidecar)"
assert_eq "graph-select-target ci-pending: --node never lands a hold" "0" "$(cip_held)"
cip_teardown

# --- Case 6: a concluded verdict clears the ladder --------------------------
# The count must mean CONSECUTIVE observations, so a tick whose CI verdict
# concluded has to drop the sidecar — otherwise strikes scattered across weeks
# and separated by healthy runs would accumulate into a false hold.
echo "Test: graph-select-target — a concluded CI verdict selects the node and clears the pending-CI ladder"
cip_setup
printf '%s 4\n' "$CIP_SHA" > "$CIP_SIDECAR"
cip6_out=$(CIP_CI_READY_RC=0 cip_run)
assert_eq "graph-select-target ci-pending: a concluded verdict selects the candidate" \
  "node tactic-cip-fixture tactic qa" "$cip6_out"
assert_eq "graph-select-target ci-pending: a concluded verdict clears the sidecar" \
  "ABSENT" "$(cip_sidecar)"
assert_eq "graph-select-target ci-pending: a concluded verdict never holds" "0" "$(cip_held)"
cip_teardown

report_results
