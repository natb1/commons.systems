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
# HUMAN-invoked /align or /align-tactics session created — sessions
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
# Empty-read corroboration stub (#lib-claude-agents EMPTY-READ CORROBORATION,
# landed alongside tactic-graph-router-live-worker-read-robust Unit 1): the
# real (physically copied) lib-claude-agents.sh now only trusts an exactly-`[]`
# registry payload as a genuine "no live sessions" when a `claude daemon`
# process corroborates it. Default this probe to "daemon visible" (exit 0) so
# Case 2's `[]` payload below keeps meaning what it always meant — otherwise
# the probe would fall through to the REAL host `pgrep`, making the test
# depend on whether the developer's machine happens to be running a daemon.
cat > "$GSC_ROOT/bin/pgrep-daemon-visible" <<'GSCPGREP'
#!/usr/bin/env bash
exit 0
GSCPGREP
chmod +x "$GSC_ROOT/bin/pgrep-daemon-visible"
GSC_GST="$GSC_SCRIPTS/graph-select-target"
# Case 1 — a live session named after the node id owns the worktree -> skipped.
printf '%s' '[{"sessionId":"s1","pid":1,"status":"busy","name":"tactic-fixture","cwd":""}]' \
  > "$GSC_ROOT/claude-payload.json"
gsc_skip=$(PATH="$GSC_ROOT/bin:$SAVED_PATH" \
  CLAUDE_AGENTS_CMD="$GSC_ROOT/bin/claude" CLAUDE_AGENTS_PGREP_CMD="$GSC_ROOT/bin/pgrep-daemon-visible" \
  DISPATCH_RESERVATION_DIR="$GSC_ROOT/reservations" \
  DISPATCH_SELECTION_LOG_DIR="$GSC_ROOT/seldir" "$GSC_GST" 2>/dev/null)
assert_eq "graph-select-target: live-session-owned human node-id worktree is skipped" "empty" "$gsc_skip"
# Case 2 (negative control) — same fixture, daemon reports NO sessions ([]),
# corroborated as definite by the pgrep stub above.
# The worktree dir still exists, so this pins that existence alone does not
# claim: the node IS selected.
echo "Test: graph-select-target — orphan node-id worktree (no live session) stays selectable (Unit 3 negative control)"
printf '%s' '[]' > "$GSC_ROOT/claude-payload.json"
gsc_sel=$(PATH="$GSC_ROOT/bin:$SAVED_PATH" \
  CLAUDE_AGENTS_CMD="$GSC_ROOT/bin/claude" CLAUDE_AGENTS_PGREP_CMD="$GSC_ROOT/bin/pgrep-daemon-visible" \
  DISPATCH_RESERVATION_DIR="$GSC_ROOT/reservations" \
  DISPATCH_SELECTION_LOG_DIR="$GSC_ROOT/seldir" "$GSC_GST" 2>/dev/null)
assert_eq "graph-select-target: orphan node-id worktree (no session) is selected" "node tactic-fixture tactic implement" "$gsc_sel"

# Case 3 — a TERMINAL session holds the worktree (tactic-invalid-state-lane
# Unit 2). The node is still skipped, exactly as in Case 1 — but the skip is now
# attributable: the decision log must carry `terminal-session`, not
# `live-session`. Folding the two together is what made this invalid state
# invisible at the moment the router noticed it.
echo "Test: graph-select-target — a terminal-session holder is skipped as terminal-session, not live-session"
printf '%s' '[{"sessionId":"s-dead","name":"tactic-fixture","state":"done","cwd":""}]' \
  > "$GSC_ROOT/claude-payload.json"
rm -rf "$GSC_ROOT/seldir"; mkdir -p "$GSC_ROOT/seldir"
gsc_term=$(PATH="$GSC_ROOT/bin:$SAVED_PATH" \
  CLAUDE_AGENTS_CMD="$GSC_ROOT/bin/claude" CLAUDE_AGENTS_PGREP_CMD="$GSC_ROOT/bin/pgrep-daemon-visible" \
  DISPATCH_RESERVATION_DIR="$GSC_ROOT/reservations" \
  DISPATCH_DECISION_LOG_DIR="$GSC_ROOT/seldir" \
  DISPATCH_SELECTION_LOG_DIR="$GSC_ROOT/seldir" "$GSC_GST" 2>/dev/null)
assert_eq "graph-select-target: a terminal-held node is still skipped" "empty" "$gsc_term"
gsc_reason=$(cat "$GSC_ROOT/seldir"/*.jsonl 2>/dev/null \
  | jq -r 'select(.site=="graph-select-target") | .skipped[]? | select(.id=="tactic-fixture") | .reason' \
  2>/dev/null | tail -1)
assert_eq "graph-select-target: the skip reason is attributable as terminal-session" \
  "terminal-session" "$gsc_reason"

# Case 4 — an UNKNOWN daemon read must keep reporting `live-session`. A blocked
# read must never manufacture an invalid state out of a healthy node.
echo "Test: graph-select-target — an UNKNOWN daemon read still reports live-session"
cat > "$GSC_ROOT/bin/claude" <<'GSCCLAUDEFAIL'
#!/usr/bin/env bash
exit 1
GSCCLAUDEFAIL
chmod +x "$GSC_ROOT/bin/claude"
rm -rf "$GSC_ROOT/seldir"; mkdir -p "$GSC_ROOT/seldir"
gsc_unk=$(PATH="$GSC_ROOT/bin:$SAVED_PATH" \
  CLAUDE_AGENTS_CMD="$GSC_ROOT/bin/claude" CLAUDE_AGENTS_PGREP_CMD="$GSC_ROOT/bin/pgrep-daemon-visible" \
  DISPATCH_RESERVATION_DIR="$GSC_ROOT/reservations" \
  DISPATCH_DECISION_LOG_DIR="$GSC_ROOT/seldir" \
  DISPATCH_SELECTION_LOG_DIR="$GSC_ROOT/seldir" "$GSC_GST" 2>/dev/null)
assert_eq "graph-select-target: an unknown read still skips the node" "empty" "$gsc_unk"
gsc_ureason=$(cat "$GSC_ROOT/seldir"/*.jsonl 2>/dev/null \
  | jq -r 'select(.site=="graph-select-target") | .skipped[]? | select(.id=="tactic-fixture") | .reason' \
  2>/dev/null | tail -1)
assert_eq "graph-select-target: an unknown read is NOT reported as terminal-session" \
  "live-session" "$gsc_ureason"
rm -rf "$GSC_ROOT" "$GSC_BARE"

# ============================================================================
# Test: graph-select-target --node — explicit-target dispatch
# (tactic-graph-select-target-node-tests)
# ============================================================================
# --node lets a caller ask for one specific node id rather than the ranked-set
# selection graph-select-target otherwise performs. The candidate-loop jq
# filters the snapshot to `select(.id == $target)`; NODE_PRESENT then drives
# the disposition: absent from candidates -> not-found (stderr explains why,
# exit 0, stdout "empty"); present but gated (reserved / live-session) ->
# gated (stderr names the gate, exit 0, stdout "empty"); present and clear ->
# selected (stdout "node <id> <kind> <phase>", exit 0). --node is also
# mutually exclusive with --top and --pace-exempt-only (exit 2). This fixture
# reuses the Unit-3 real-git-repo + fake-npx + fake-`claude` shape verbatim
# (graph-select-target derives REPO_ROOT from its own on-disk SCRIPT_DIR
# location, so the script + every sourced lib*.sh must be physically copied,
# not symlinked, and select-targets.ts is stubbed with a fake `npx` on PATH),
# including that fixture's empty-read corroboration stub — see the
# pgrep-daemon-visible note below.
GSN_ROOT=$(mktemp -d)
GSN_BARE=$(mktemp -d)
GSN_SCRIPTS="$GSN_ROOT/.claude/skills/dispatch-propagate/scripts"
mkdir -p "$GSN_SCRIPTS" "$GSN_ROOT/bin"
cp "$SCRIPT_DIR"/graph-select-target "$SCRIPT_DIR"/lib.sh "$SCRIPT_DIR"/lib-*.sh "$GSN_SCRIPTS/"
# Fake npx: one selectable implement-phase candidate (same shape as the
# Unit-3 fixture above).
cat > "$GSN_ROOT/bin/npx" <<'GSNNPX'
#!/usr/bin/env bash
echo '{"candidates":[{"id":"tactic-fixture","kind":"tactic","phase":"implement","pr":null,"pace_exempt":false}],"events":[]}'
exit 0
GSNNPX
chmod +x "$GSN_ROOT/bin/npx"
# A git repo whose origin/main carries an intentions/ tree, main checked out at
# the fixture root so NATIVE_ROOT resolves there.
git init -q -b main "$GSN_ROOT"
git -C "$GSN_ROOT" config user.email t@t
git -C "$GSN_ROOT" config user.name t
mkdir -p "$GSN_ROOT/intentions"
echo '# placeholder' > "$GSN_ROOT/intentions/placeholder.md"
git -C "$GSN_ROOT" add -A
git -C "$GSN_ROOT" commit -q -m seed
git init -q --bare -b main "$GSN_BARE"
git -C "$GSN_ROOT" remote add origin "$GSN_BARE"
git -C "$GSN_ROOT" push -q origin main
git -C "$GSN_ROOT" fetch -q origin
# Fake `claude agents --json`: payload driven by a rewritable file.
cat > "$GSN_ROOT/bin/claude" <<'GSNCLAUDE'
#!/usr/bin/env bash
_root="$(cd "$(dirname "$0")/.." && pwd)"
cat "$_root/claude-payload.json"
exit 0
GSNCLAUDE
chmod +x "$GSN_ROOT/bin/claude"
# Empty-read corroboration stub, same as the Unit-3 fixture above: the real
# (physically copied) lib-claude-agents.sh only trusts an exactly-`[]` registry
# payload as a genuine "no live sessions" when a `claude daemon` process
# corroborates it, and folds an UNCORROBORATED `[]` into UNKNOWN, which
# worktree_has_live_session then fails safe to "occupied". Every `[]`-payload
# case below therefore needs this probe defaulted to "daemon visible" (exit 0)
# — otherwise it falls through to the REAL host `pgrep` and Case 1 reports the
# live-session gate instead of selecting, on any host (CI included) not itself
# running a claude daemon.
cat > "$GSN_ROOT/bin/pgrep-daemon-visible" <<'GSNPGREP'
#!/usr/bin/env bash
exit 0
GSNPGREP
chmod +x "$GSN_ROOT/bin/pgrep-daemon-visible"
mkdir -p "$GSN_ROOT/.claude/worktrees/tactic-fixture"
GSN_GST="$GSN_SCRIPTS/graph-select-target"

# Per-case baseline: no live sessions, no reservations. graph-select-target
# checks the reserved gate BEFORE the live-session gate, so without an explicit
# reset the live-session case would only observe its own gate because the
# reserved case happened to clean up after itself — cases would silently change
# meaning if reordered or run in isolation.
gsn_reset() {
  printf '%s' '[]' > "$GSN_ROOT/claude-payload.json"
  rm -rf "$GSN_ROOT/reservations"
  mkdir -p "$GSN_ROOT/reservations"
}

echo "Test: graph-select-target --node explicit dispatch (tactic-graph-select-target-node-tests)"

# --- Case 1: present candidate, no gate -> selected -------------------------
gsn_reset
gsn1_out=$(PATH="$GSN_ROOT/bin:$SAVED_PATH" \
  CLAUDE_AGENTS_CMD="$GSN_ROOT/bin/claude" CLAUDE_AGENTS_PGREP_CMD="$GSN_ROOT/bin/pgrep-daemon-visible" \
  DISPATCH_RESERVATION_DIR="$GSN_ROOT/reservations" \
  DISPATCH_SELECTION_LOG_DIR="$GSN_ROOT/seldir" "$GSN_GST" --node tactic-fixture 2>/dev/null) && gsn1_rc=0 || gsn1_rc=$?
assert_eq "graph-select-target --node: present candidate, no gate selects" "node tactic-fixture tactic implement" "$gsn1_out"
assert_eq "graph-select-target --node: present candidate, no gate exits 0" "0" "$gsn1_rc"

# --- Case 2: node absent from candidates -> not-found -----------------------
gsn_reset
gsn2_out=$(PATH="$GSN_ROOT/bin:$SAVED_PATH" \
  CLAUDE_AGENTS_CMD="$GSN_ROOT/bin/claude" CLAUDE_AGENTS_PGREP_CMD="$GSN_ROOT/bin/pgrep-daemon-visible" \
  DISPATCH_RESERVATION_DIR="$GSN_ROOT/reservations" \
  DISPATCH_SELECTION_LOG_DIR="$GSN_ROOT/seldir" "$GSN_GST" --node tactic-absent 2>"$GSN_ROOT/stderr.txt") && gsn2_rc=0 || gsn2_rc=$?
gsn2_err=$(cat "$GSN_ROOT/stderr.txt")
assert_eq "graph-select-target --node: absent candidate emits empty" "empty" "$gsn2_out"
assert_eq "graph-select-target --node: absent candidate exits 0" "0" "$gsn2_rc"
assert_contains_local "graph-select-target --node: absent candidate explains not-selectable" \
  "graph-select-target: node tactic-absent is not selectable (not found, done, parked, blocked, or already reviewed — inspect intentions/tactic-absent.md directly for the reason)" \
  "$gsn2_err"

# --- Case 3: present candidate, reserved -> gated ---------------------------
gsn_reset
touch "$GSN_ROOT/reservations/tactic-fixture"
gsn3_out=$(PATH="$GSN_ROOT/bin:$SAVED_PATH" \
  CLAUDE_AGENTS_CMD="$GSN_ROOT/bin/claude" CLAUDE_AGENTS_PGREP_CMD="$GSN_ROOT/bin/pgrep-daemon-visible" \
  DISPATCH_RESERVATION_DIR="$GSN_ROOT/reservations" \
  DISPATCH_SELECTION_LOG_DIR="$GSN_ROOT/seldir" "$GSN_GST" --node tactic-fixture 2>"$GSN_ROOT/stderr.txt") && gsn3_rc=0 || gsn3_rc=$?
gsn3_err=$(cat "$GSN_ROOT/stderr.txt")
assert_eq "graph-select-target --node: reserved candidate emits empty" "empty" "$gsn3_out"
assert_eq "graph-select-target --node: reserved candidate exits 0" "0" "$gsn3_rc"
assert_eq "graph-select-target --node: reserved candidate reports reserved" "graph-select-target: reserved" "$gsn3_err"

# --- Case 4: present candidate, live session -> gated -----------------------
gsn_reset
printf '%s' '[{"sessionId":"s1","pid":1,"status":"busy","name":"tactic-fixture","cwd":""}]' \
  > "$GSN_ROOT/claude-payload.json"
gsn4_out=$(PATH="$GSN_ROOT/bin:$SAVED_PATH" \
  CLAUDE_AGENTS_CMD="$GSN_ROOT/bin/claude" CLAUDE_AGENTS_PGREP_CMD="$GSN_ROOT/bin/pgrep-daemon-visible" \
  DISPATCH_RESERVATION_DIR="$GSN_ROOT/reservations" \
  DISPATCH_SELECTION_LOG_DIR="$GSN_ROOT/seldir" "$GSN_GST" --node tactic-fixture 2>"$GSN_ROOT/stderr.txt") && gsn4_rc=0 || gsn4_rc=$?
gsn4_err=$(cat "$GSN_ROOT/stderr.txt")
assert_eq "graph-select-target --node: live-session candidate emits empty" "empty" "$gsn4_out"
assert_eq "graph-select-target --node: live-session candidate exits 0" "0" "$gsn4_rc"
assert_eq "graph-select-target --node: live-session candidate reports live-session" "graph-select-target: live-session" "$gsn4_err"

# --- Case 5: --node + --top -> usage error ----------------------------------
gsn_reset
gsn5_out=$(PATH="$GSN_ROOT/bin:$SAVED_PATH" \
  CLAUDE_AGENTS_CMD="$GSN_ROOT/bin/claude" CLAUDE_AGENTS_PGREP_CMD="$GSN_ROOT/bin/pgrep-daemon-visible" \
  DISPATCH_RESERVATION_DIR="$GSN_ROOT/reservations" \
  DISPATCH_SELECTION_LOG_DIR="$GSN_ROOT/seldir" "$GSN_GST" --node tactic-fixture --top 2 2>"$GSN_ROOT/stderr.txt") && gsn5_rc=0 || gsn5_rc=$?
gsn5_err=$(cat "$GSN_ROOT/stderr.txt")
assert_eq "graph-select-target --node: --node + --top exits 2" "2" "$gsn5_rc"
assert_contains_local "graph-select-target --node: --node + --top reports mutual exclusion" \
  "--node is mutually exclusive with --top and --pace-exempt-only" "$gsn5_err"

# --- Case 6: --node + --pace-exempt-only -> usage error ---------------------
gsn_reset
gsn6_out=$(PATH="$GSN_ROOT/bin:$SAVED_PATH" \
  CLAUDE_AGENTS_CMD="$GSN_ROOT/bin/claude" CLAUDE_AGENTS_PGREP_CMD="$GSN_ROOT/bin/pgrep-daemon-visible" \
  DISPATCH_RESERVATION_DIR="$GSN_ROOT/reservations" \
  DISPATCH_SELECTION_LOG_DIR="$GSN_ROOT/seldir" "$GSN_GST" --node tactic-fixture --pace-exempt-only 2>"$GSN_ROOT/stderr.txt") && gsn6_rc=0 || gsn6_rc=$?
gsn6_err=$(cat "$GSN_ROOT/stderr.txt")
assert_eq "graph-select-target --node: --node + --pace-exempt-only exits 2" "2" "$gsn6_rc"
assert_contains_local "graph-select-target --node: --node + --pace-exempt-only reports mutual exclusion" \
  "--node is mutually exclusive with --top and --pace-exempt-only" "$gsn6_err"

rm -rf "$GSN_ROOT" "$GSN_BARE"

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
  # Empty-read corroboration stub (#lib-claude-agents EMPTY-READ
  # CORROBORATION): default the daemon-visibility probe to "reachable" (exit
  # 0) so the default `[]` registry payload above keeps meaning genuinely "no
  # sessions", as every pre-existing case in this fixture expects. `export`ed
  # (rather than passed inline per-invocation) so it silently covers every
  # case below without touching each command line; a case that wants the
  # uncorroborated-empty shape overrides it locally.
  cat > "$GSCS_ROOT/bin/pgrep-daemon-visible" <<'GSCSPGREP'
#!/usr/bin/env bash
exit 0
GSCSPGREP
  chmod +x "$GSCS_ROOT/bin/pgrep-daemon-visible"
  export CLAUDE_AGENTS_PGREP_CMD="$GSCS_ROOT/bin/pgrep-daemon-visible"
  GSCS_GST="$GSCS_SCRIPTS/graph-select-target"
}

gsc_standalone_teardown() {
  rm -rf "$GSCS_ROOT" "$GSCS_BARE"
  GSCS_ROOT="" ; GSCS_BARE="" ; GSCS_SCRIPTS="" ; GSCS_GST=""
  unset CLAUDE_AGENTS_PGREP_CMD
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

# --- Case 6: busy-read UNKNOWN -> fails CLOSED to concurrency-cap `empty` ----
# (tactic-graph-router-live-worker-read-robust Unit 2 flips this from the
# prior fail-OPEN `(( TOP > 1 )) && TOP=1` clamp.) The `else` branch of the
# --standalone headroom block: when claude_agents_count_busy_workers returns
# non-zero (daemon UNKNOWN — read failed OR an uncorroborated `[]`, per
# lib-claude-agents.sh's EMPTY-READ CORROBORATION), true live occupancy cannot
# be determined, so this is no longer treated as "assume headroom, clamp to
# one" — it degrades to the SAME concurrency-cap-style `empty` disposition as
# HEADROOM==0 (Case 2) or an exhausted window (Case 5). A regression reverting
# to the old TOP=1 clamp would let an unattended --standalone caller select
# and claim a node while blind to whether a live worker already owns the
# worktree — exactly the duplicate-worker race this tactic exists to close.
#
# Why an appended function override instead of a corrupt claude-payload.json:
# claude_agents_count_busy_workers and claude_agents_list_all both read the
# SAME _claude_agents_raw query in lib-claude-agents.sh, and
# worktree_has_live_session folds an UNKNOWN list_all into "occupied" as a
# fail-safe. A corrupt payload therefore makes EVERY candidate skip as
# `live-session` and the run print `empty` for an unrelated reason, so the
# deliberate hard-failure path this case targets would be unobservable.
# Splitting the fake `claude` on its args does not help either — neither call
# passes --cwd. Instead, since the fixture already works on physical COPIES of
# the libs inside $GSCS_SCRIPTS, append a redefinition to the COPY of
# lib-claude-agents.sh AFTER its terminating `fi` (the whole library body sits
# inside a source-once guard whose `fi` is the last line, so an appended
# definition executes on every source and wins over the original). That makes
# only the busy-read UNKNOWN, leaving claude_agents_list_all /
# worktree_has_live_session healthy against the default `[]` registry so
# candidates stay selectable up to the point the busy-read gate itself is
# consulted. Do NOT "simplify" this back into a payload edit.
echo "Test: graph-select-target --standalone with a hard busy-worker read failure fails closed to empty (no selection, no claim)"
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
  "$GSCS_GST" --standalone --top 3 2>"$GSCS_ROOT/gsc6.err")
assert_eq "graph-select-target --standalone: hard busy-read failure prints empty (fail closed)" \
  "empty" "$gsc6_out"
assert_eq "graph-select-target --standalone: hard busy-read failure claims NO candidate" \
  "0" "$([ -f "$GSCS_ROOT/reservations/tactic-standalone-fixture" ] && echo 1 || echo 0)"
assert_eq "graph-select-target --standalone: hard busy-read failure claims NO second candidate either" \
  "0" "$([ -f "$GSCS_ROOT/reservations/tactic-standalone-fixture-2" ] && echo 1 || echo 0)"
assert_eq "graph-select-target --standalone: hard busy-read failure writes a distinguishing stderr diagnostic" \
  "1" "$(grep -q "busy-worker read unverified" "$GSCS_ROOT/gsc6.err" && echo 1 || echo 0)"
gsc6_lock=$(cat "$GSCS_ROOT/dispatch.lock" 2>/dev/null || true)
TOTAL=$((TOTAL + 1))
if [[ -z "$gsc6_lock" ]]; then
  PASS=$((PASS + 1)); echo "  PASS: graph-select-target --standalone (hard busy-read failure) releases the lock (file emptied)"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: graph-select-target --standalone (hard busy-read failure) releases the lock (file emptied)"
  echo "    lock file: '$gsc6_lock'"
fi
gsc_standalone_teardown

# --- Case 6b: uncorroborated-empty `[]` -> same fail-closed disposition -----
# Case 6's sibling on the OTHER shape of daemon-UNKNOWN, and the one that
# actually matches the originating incident (#lib-claude-agents EMPTY-READ
# CORROBORATION): a socket read that is blocked (sandbox, network-namespace
# isolation) still exits 0 and prints `[]` — byte-identical to a genuine "no
# live sessions" — UNLESS corroborated by a `claude daemon` process probe.
# Here the fake `claude` prints the default `[]` (no override needed) but the
# corroboration probe itself is overridden to report the daemon UNREACHABLE
# (exit 1), so claude_agents_count_busy_workers must return 1 (UNKNOWN) via the
# real, un-overridden library code path — proving the fail-closed disposition
# is reached through actual corroboration logic, not just the Case 6 hard
# function stub.
echo "Test: graph-select-target --standalone with an uncorroborated empty [] registry read fails closed to empty, same as a hard failure"
gsc_standalone_setup
cat > "$GSCS_ROOT/bin/pgrep-daemon-unreachable" <<'GSCS6BPGREP'
#!/usr/bin/env bash
exit 1
GSCS6BPGREP
chmod +x "$GSCS_ROOT/bin/pgrep-daemon-unreachable"
cat > "$GSCS_ROOT/bin/npx" <<'GSCS6BNPX'
#!/usr/bin/env bash
echo '{"candidates":[{"id":"tactic-standalone-fixture","kind":"tactic","phase":"implement","pr":null,"pace_exempt":false},{"id":"tactic-standalone-fixture-2","kind":"tactic","phase":"implement","pr":null,"pace_exempt":false}],"events":[]}'
exit 0
GSCS6BNPX
chmod +x "$GSCS_ROOT/bin/npx"
gsc6b_out=$(PATH="$GSCS_ROOT/bin:$SAVED_PATH" \
  CLAUDE_AGENTS_CMD="$GSCS_ROOT/bin/claude" \
  CLAUDE_AGENTS_PGREP_CMD="$GSCS_ROOT/bin/pgrep-daemon-unreachable" \
  DISPATCH_RESERVATION_DIR="$GSCS_ROOT/reservations" \
  DISPATCH_SELECTION_LOG_DIR="$GSCS_ROOT/seldir" DISPATCH_LOCK_FILE="$GSCS_ROOT/dispatch.lock" \
  CLAUDE_CODE_SESSION_ID="gsc-standalone-6b" SEL_MAX_WORKERS=8 \
  "$GSCS_GST" --standalone --top 3 2>"$GSCS_ROOT/gsc6b.err")
assert_eq "graph-select-target --standalone: uncorroborated empty [] prints empty (fail closed)" \
  "empty" "$gsc6b_out"
assert_eq "graph-select-target --standalone: uncorroborated empty [] claims NO candidate" \
  "0" "$([ -f "$GSCS_ROOT/reservations/tactic-standalone-fixture" ] && echo 1 || echo 0)"
assert_eq "graph-select-target --standalone: uncorroborated empty [] claims NO second candidate either" \
  "0" "$([ -f "$GSCS_ROOT/reservations/tactic-standalone-fixture-2" ] && echo 1 || echo 0)"
assert_eq "graph-select-target --standalone: uncorroborated empty [] writes a distinguishing stderr diagnostic" \
  "1" "$(grep -q "busy-worker read unverified" "$GSCS_ROOT/gsc6b.err" && echo 1 || echo 0)"
gsc6b_lock=$(cat "$GSCS_ROOT/dispatch.lock" 2>/dev/null || true)
TOTAL=$((TOTAL + 1))
if [[ -z "$gsc6b_lock" ]]; then
  PASS=$((PASS + 1)); echo "  PASS: graph-select-target --standalone (uncorroborated empty []) releases the lock (file emptied)"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: graph-select-target --standalone (uncorroborated empty []) releases the lock (file emptied)"
  echo "    lock file: '$gsc6b_lock'"
fi
gsc_standalone_teardown

# --- Case 7: control for Case 6 — same two candidates, HEALTHY busy read -----
# Without this control, Case 6/6b would pass even if the fixture could only
# ever return a single node for some unrelated reason. Identical two-candidate
# npx, identical SEL_MAX_WORKERS=8 / --top 3, but NO count_busy_workers
# override: BUSY=0, RESV=0 -> HEADROOM=8, TOP stays 3, so BOTH candidates are
# selected and claimed. That makes the Case 6/6b fail-closed disposition
# provably load-bearing (it degrades from this healthy two-candidate baseline,
# not from an unrelated fixture limitation).
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

# ============================================================================
# Test: graph-select-target — the fix interrupt routes through interruptRoute
# (tactic-conflict-outranks-ci-precedence Unit 2)
# ============================================================================
# _gate_maybe_interrupt no longer decides on `ci == failing` alone: it reads the
# PR's `.mergeable` off the SAME gh_pr_view_rest call and delegates the decision
# to interruptRoute (packages/intentionsutil/src/transitions.ts), where
# CONFLICTING outranks failing CI. A PR that is BOTH conflicted and red must
# therefore make NO graph write and burn NO fix attempt — it is emitted at its
# ladder phase and reaches the conflict lane through provision-node-worktree's
# exit 11 (out of scope here; unchanged).
#
# The cascade's own ordering is unit-tested in TypeScript
# (packages/intentionsutil/test/transitions.test.ts). This fixture pins the
# SHELL seam only: that the selector hands the cascade the right sensors, honors
# whatever route comes back, and never writes on the decline path. `node` is
# therefore a stub that logs its argv and replays a route from a file.
#
# Hermetic: fake `npx` (select-targets.ts AND apply-fix-state.ts), fake `gh`
# (the two REST shapes gh_pr_view_rest and dispatch_ci_verdict_rest fetch),
# fake `claude`, fake `node`, and a no-op graph-commit stub. No network.
#
# NOTE on the `mergeable-unreadable` rc-3 branch in _gate_maybe_interrupt: it is
# unreachable by construction against the current lib.sh projection.
# gh_pr_view_rest's `mergeable:` jq branch (lib.sh:1137-1141) is a total
# if/elif/else over REST's boolean — true -> MERGEABLE, false -> CONFLICTING,
# EVERYTHING else (including null and an absent key) -> UNKNOWN — so no PR REST
# response can yield a fourth value. The branch is kept as an edge guard against
# a future projection change (mirroring reconcile-graph-review-stall's identical
# guard) and is deliberately not covered here rather than covered by stubbing
# gh_pr_view_rest itself, which would test the stub, not the script.
gsc_interrupt_setup() {
  GSCI_ROOT=$(mktemp -d)
  GSCI_BARE=$(mktemp -d)
  GSCI_SCRIPTS="$GSCI_ROOT/.claude/skills/dispatch-propagate/scripts"
  mkdir -p "$GSCI_SCRIPTS" "$GSCI_ROOT/bin" "$GSCI_ROOT/packages/intentionsutil/scripts"
  # Physical copies (not symlinks): graph-select-target derives REPO_ROOT from
  # its own on-disk location, and dispatch-ci-ready resolves lib.sh as a sibling.
  cp "$SCRIPT_DIR"/graph-select-target "$SCRIPT_DIR"/dispatch-ci-ready \
     "$SCRIPT_DIR"/lib.sh "$SCRIPT_DIR"/lib-*.sh "$GSCI_SCRIPTS/"
  chmod +x "$GSCI_SCRIPTS/graph-select-target" "$GSCI_SCRIPTS/dispatch-ci-ready"
  # Empty-read corroboration stub (#lib-claude-agents EMPTY-READ CORROBORATION),
  # same shape and reason as gsc_standalone_setup's. The fixture's fake `claude`
  # returns `[]`, and since 09e22848 graph-select-target DEFERS (emits nothing)
  # on an unverified live-worker read rather than failing open. Without this
  # stub the probe reads the real host: a developer box with a live `claude
  # daemon` corroborates the `[]` and all 13 interrupt cases pass, while a
  # daemon-less CI runner leaves it uncorroborated, the selector defers, and
  # every case fails with `actual: 'empty'` — the cascade never runs, so even
  # `node-calls.log`/`apply-fix-calls.log` are absent. These cases assert
  # INTERRUPT ROUTING, so the liveness input must be pinned, not read off the
  # ambient host.
  cat > "$GSCI_ROOT/bin/pgrep-daemon-visible" <<'GSCIPGREP'
#!/usr/bin/env bash
exit 0
GSCIPGREP
  chmod +x "$GSCI_ROOT/bin/pgrep-daemon-visible"
  export CLAUDE_AGENTS_PGREP_CMD="$GSCI_ROOT/bin/pgrep-daemon-visible"
  # graph-commit stub: _graph_commit_fix runs it from NATIVE_ROOT on the `fix`
  # route, so the control case exercises the clean emission path rather than
  # `fix-write-failed`.
  cat > "$GSCI_ROOT/packages/intentionsutil/scripts/graph-commit" <<'GSCIGC'
#!/usr/bin/env bash
exit 0
GSCIGC
  chmod +x "$GSCI_ROOT/packages/intentionsutil/scripts/graph-commit"
  # park-node stub: _park_conflict_cap runs it from NATIVE_ROOT on the
  # conflict-attempt-cap path. Logs its argv so the cap case can assert the park
  # actually happened (and carried a reason + recommendation).
  cat > "$GSCI_ROOT/packages/intentionsutil/scripts/park-node" <<'GSCIPARK'
#!/usr/bin/env bash
_root="$(cd "$(dirname "$0")/../../.." && pwd)"
printf '%s\n' "$*" >> "$_root/park-node-calls.log"
exit 0
GSCIPARK
  chmod +x "$GSCI_ROOT/packages/intentionsutil/scripts/park-node"
  # Fake npx: serves BOTH tsx entry points the selector shells out to —
  # select-targets.ts (the candidate list, from a per-case file) and
  # apply-fix-state.ts (the interrupt write, whose invocation is logged; the
  # log's presence/absence is the load-bearing assertion below).
  cat > "$GSCI_ROOT/bin/npx" <<'GSCINPX'
#!/usr/bin/env bash
_root="$(cd "$(dirname "$0")/.." && pwd)"
for _a in "$@"; do
  case "$_a" in
    *apply-fix-state*)
      printf '%s\n' "$*" >> "$_root/apply-fix-calls.log"
      echo '{}'
      exit 0 ;;
    *apply-conflict-state*)
      printf '%s\n' "$*" >> "$_root/apply-conflict-calls.log"
      cat "$_root/conflict-result.json"
      exit 0 ;;
  esac
done
cat "$_root/candidates.json"
exit 0
GSCINPX
  chmod +x "$GSCI_ROOT/bin/npx"
  # Fake gh: the two REST calls the sensor path makes, each served from a
  # per-case file. `gh api repos/{owner}/{repo}/pulls/2999` returns the RAW REST
  # PR shape (gh_pr_view_rest applies its own jq projection over it — same
  # byte-compat shape test-lib-gh-rest.sh pins); the check-runs path feeds
  # dispatch_ci_verdict_rest. Anything else fails, keeping the case offline.
  cat > "$GSCI_ROOT/bin/gh" <<'GSCIGH'
#!/usr/bin/env bash
_root="$(cd "$(dirname "$0")/.." && pwd)"
# `gh pr ready --undo <n>` — the conflict backstop's PR re-draft. Logged so the
# case can assert the disarm ran; matched before the REST paths below.
if [[ "$1" == "pr" && "$2" == "ready" ]]; then
  printf '%s\n' "$*" >> "$_root/gh-pr-ready.log"
  exit 0
fi
for _a in "$@"; do
  case "$_a" in
    */pulls/2999) cat "$_root/pr-2999.json"; exit 0 ;;
    */commits/deadbee/check-runs) cat "$_root/check-runs.json"; exit 0 ;;
  esac
done
exit 1
GSCIGH
  chmod +x "$GSCI_ROOT/bin/gh"
  # Fake node: records the TRAILING three positional args — phase, ci verdict,
  # mergeable, i.e. exactly the sensors handed to interruptRoute — then replays
  # the route from route.txt (no trailing newline, like the real one-liner's
  # process.stdout.write). `node-fail` makes the eval fail instead.
  cat > "$GSCI_ROOT/bin/node" <<'GSCINODE'
#!/usr/bin/env bash
_root="$(cd "$(dirname "$0")/.." && pwd)"
printf '%s %s %s\n' "${@: -3}" >> "$_root/node-calls.log"
if [[ -e "$_root/node-fail" ]]; then
  echo "fake node: forced failure" >&2
  exit 1
fi
printf '%s' "$(cat "$_root/route.txt")"
exit 0
GSCINODE
  chmod +x "$GSCI_ROOT/bin/node"
  # Fake `claude agents --json`: empty registry (no live session claims the id).
  cat > "$GSCI_ROOT/bin/claude" <<'GSCICLAUDE'
#!/usr/bin/env bash
_root="$(cd "$(dirname "$0")/.." && pwd)"
cat "$_root/claude-payload.json"
exit 0
GSCICLAUDE
  chmod +x "$GSCI_ROOT/bin/claude"
  printf '%s' '[]' > "$GSCI_ROOT/claude-payload.json"
  # Per-case defaults: one implement-phase candidate WITH a pr, a CONFLICTING
  # red PR, and the `conflict` route. Cases rewrite whichever of these they vary
  # (rewriting fixture files per case is this file's existing convention).
  gsci_candidate implement
  gsci_pr false
  gsci_checks '{"check_runs":[{"status":"completed","conclusion":"failure"}]}'
  printf 'conflict' > "$GSCI_ROOT/route.txt"
  # apply-conflict-state's default reply: an UNCAPPED --park-if-capped read (the
  # other modes' JSON is never parsed by the selector).
  printf '%s\n' '{"mode":"park-if-capped","id":"tactic-fixture","wrote":false,"capped":false,"attempt":1}' \
    > "$GSCI_ROOT/conflict-result.json"
  # A git repo whose origin/main carries an intentions/ tree, main checked out
  # at the fixture root so NATIVE_ROOT resolves there.
  git init -q -b main "$GSCI_ROOT"
  git -C "$GSCI_ROOT" config user.email t@t
  git -C "$GSCI_ROOT" config user.name t
  mkdir -p "$GSCI_ROOT/intentions"
  echo '# placeholder' > "$GSCI_ROOT/intentions/placeholder.md"
  git -C "$GSCI_ROOT" add -A
  git -C "$GSCI_ROOT" commit -q -m seed
  git init -q --bare -b main "$GSCI_BARE"
  git -C "$GSCI_ROOT" remote add origin "$GSCI_BARE"
  git -C "$GSCI_ROOT" push -q origin main
  git -C "$GSCI_ROOT" fetch -q origin
  GSCI_GST="$GSCI_SCRIPTS/graph-select-target"
}

# gsci_candidate <phase> — rewrite the select-targets.ts candidate list.
gsci_candidate() {
  printf '%s\n' "{\"candidates\":[{\"id\":\"tactic-fixture\",\"kind\":\"tactic\",\"phase\":\"$1\",\"pr\":\"2999\",\"pace_exempt\":false}],\"events\":[]}" \
    > "$GSCI_ROOT/candidates.json"
}

# gsci_pr <mergeable-json> — rewrite the RAW REST PR object. `false` =>
# CONFLICTING, `true` => MERGEABLE, `null` => UNKNOWN (lib.sh's projection).
gsci_pr() {
  local m="$1" state="dirty"
  [[ "$m" == "true" ]] && state="clean"
  printf '%s\n' "{\"number\":2999,\"state\":\"open\",\"merged_at\":null,\"merge_commit_sha\":null,\"mergeable\":$m,\"mergeable_state\":\"$state\",\"title\":\"t\",\"body\":\"\",\"head\":{\"sha\":\"deadbee\",\"ref\":\"tactic-fixture\"},\"labels\":[]}" \
    > "$GSCI_ROOT/pr-2999.json"
}

# gsci_checks <json> — rewrite the single check-runs page.
gsci_checks() { printf '%s\n' "$1" > "$GSCI_ROOT/check-runs.json"; }

gsc_interrupt_teardown() {
  rm -rf "$GSCI_ROOT" "$GSCI_BARE"
  GSCI_ROOT="" ; GSCI_BARE="" ; GSCI_SCRIPTS="" ; GSCI_GST=""
  unset CLAUDE_AGENTS_PGREP_CMD
}

# gsci_run — invoke the selector with the fixture's env, stderr to gsci.err.
# Env needed only for this one invocation is passed as a command PREFIX (this
# file's convention), with every ledger/log dir pointed inside the fixture.
gsci_run() {
  PATH="$GSCI_ROOT/bin:$SAVED_PATH" \
    CLAUDE_AGENTS_CMD="$GSCI_ROOT/bin/claude" \
    DISPATCH_RESERVATION_DIR="$GSCI_ROOT/reservations" \
    DISPATCH_SELECTION_LOG_DIR="$GSCI_ROOT/seldir" \
    DISPATCH_PR_LIST_FILE="$GSCI_ROOT/pr-list.json" \
    "$GSCI_GST" "$@" 2>"$GSCI_ROOT/gsci.err"
}

# --- Case 1: CONFLICTING + red declines the interrupt (the defect) -----------
echo "Test: graph-select-target — a CONFLICTING red PR declines the fix interrupt and is emitted at its ladder phase"
gsc_interrupt_setup
gsci1_out=$(gsci_run)
assert_eq "graph-select-target interrupt: CONFLICTING + red emits the ladder phase, not fix" \
  "node tactic-fixture tactic implement" "$gsci1_out"
# The load-bearing half: no apply-fix-state call at all, so no execution.fix
# write and no fix attempt consumed against a verdict the conflict invalidates.
assert_eq "graph-select-target interrupt: CONFLICTING + red makes NO apply-fix-state --set-fix call" \
  "0" "$([ -f "$GSCI_ROOT/apply-fix-calls.log" ] && echo 1 || echo 0)"
assert_eq "graph-select-target interrupt: the decline is reported on stderr" \
  "1" "$(grep -q "declining the fix interrupt" "$GSCI_ROOT/gsci.err" && echo 1 || echo 0)"
# Case 3 (first half): the sensors handed to the cascade.
assert_eq "graph-select-target interrupt: the cascade receives phase/ci/mergeable" \
  "implement failing CONFLICTING" "$(tail -n 1 "$GSCI_ROOT/node-calls.log")"
gsc_interrupt_teardown

# --- Case 2: control — red but MERGEABLE still enters the fix interrupt ------
# Without this, Case 1 would pass vacuously if the gate broke entirely.
echo "Test: graph-select-target — a red but MERGEABLE PR still enters the fix interrupt (Case 1 control)"
gsc_interrupt_setup
gsci_pr true
printf 'fix' > "$GSCI_ROOT/route.txt"
gsci2_out=$(gsci_run)
assert_eq "graph-select-target interrupt: red + MERGEABLE emits fix" \
  "node tactic-fixture tactic fix" "$gsci2_out"
assert_eq "graph-select-target interrupt: red + MERGEABLE calls apply-fix-state" \
  "1" "$([ -f "$GSCI_ROOT/apply-fix-calls.log" ] && echo 1 || echo 0)"
assert_eq "graph-select-target interrupt: the apply-fix-state call carries --set-fix" \
  "1" "$(grep -q -- "--set-fix" "$GSCI_ROOT/apply-fix-calls.log" && echo 1 || echo 0)"
assert_eq "graph-select-target interrupt: red + MERGEABLE hands the cascade MERGEABLE" \
  "implement failing MERGEABLE" "$(tail -n 1 "$GSCI_ROOT/node-calls.log")"
gsc_interrupt_teardown

# --- Case 3 (second half): pending CI normalizes to `unknown` ----------------
# dispatch_ci_verdict_rest emits passing|failing|pending; CiVerdict's third
# member is `unknown`. This also pins that a CONFLICTING-but-not-red candidate
# still REACHES the cascade — the cost guard is a superset of interruptRoute's
# non-null conditions, so it must not filter this one out.
echo "Test: graph-select-target — pending CI on a CONFLICTING PR reaches the cascade as 'unknown'"
gsc_interrupt_setup
gsci_checks '{"check_runs":[{"status":"in_progress","conclusion":null}]}'
gsci3_out=$(gsci_run)
assert_eq "graph-select-target interrupt: pending CI is normalized to unknown at the cascade edge" \
  "implement unknown CONFLICTING" "$(tail -n 1 "$GSCI_ROOT/node-calls.log")"
assert_eq "graph-select-target interrupt: pending + CONFLICTING still emits the ladder phase" \
  "node tactic-fixture tactic implement" "$gsci3_out"
assert_eq "graph-select-target interrupt: pending + CONFLICTING makes no apply-fix-state call" \
  "0" "$([ -f "$GSCI_ROOT/apply-fix-calls.log" ] && echo 1 || echo 0)"
gsc_interrupt_teardown

# --- Case 4: the cost guard holds (green + MERGEABLE spawns no subprocess) ---
# interruptRoute is null unless CI is failing or the PR is CONFLICTING, so the
# common case must never pay for the node subprocess at all.
echo "Test: graph-select-target — a green MERGEABLE PR never spawns the interruptRoute subprocess"
gsc_interrupt_setup
gsci_pr true
gsci_checks '{"check_runs":[{"status":"completed","conclusion":"success"}]}'
gsci4_out=$(gsci_run)
assert_eq "graph-select-target interrupt: green + MERGEABLE emits the ladder phase" \
  "node tactic-fixture tactic implement" "$gsci4_out"
assert_eq "graph-select-target interrupt: green + MERGEABLE spawns no node subprocess" \
  "0" "$([ -f "$GSCI_ROOT/node-calls.log" ] && echo 1 || echo 0)"
gsc_interrupt_teardown

# --- Case 5: declining at `qa` routes onward instead of stranding the node ---
# The qa arm's normal gate runs after the declined interrupt: the merged check
# passes (mergedAt null), then dispatch-ci-ready short-circuits READY for a
# CONFLICTING draft even with CI unresolved (dispatch-ci-ready:72-76), so the
# node is emitted at `qa` and provisioning takes it to the conflict lane.
echo "Test: graph-select-target — declining the interrupt at qa still emits qa (no stranding)"
gsc_interrupt_setup
gsci_candidate qa
printf '%s\n' '[{"number":2999,"headRefName":"tactic-fixture","isDraft":true,"headRefOid":"deadbee","labels":[],"mergeable":"CONFLICTING"}]' \
  > "$GSCI_ROOT/pr-list.json"
gsci5_out=$(gsci_run)
assert_eq "graph-select-target interrupt: a declined qa candidate is emitted at qa" \
  "node tactic-fixture tactic qa" "$gsci5_out"
assert_eq "graph-select-target interrupt: a declined qa candidate makes no apply-fix-state call" \
  "0" "$([ -f "$GSCI_ROOT/apply-fix-calls.log" ] && echo 1 || echo 0)"
assert_eq "graph-select-target interrupt: the qa cascade call carries the qa phase" \
  "qa failing CONFLICTING" "$(tail -n 1 "$GSCI_ROOT/node-calls.log")"
gsc_interrupt_teardown

# --- Case 6: an interruptRoute eval failure fails SAFE -----------------------
# rc 3 (`route-eval-failed`) skips the candidate rather than guessing a lane:
# no write, no emission. With one candidate the run prints `empty`.
echo "Test: graph-select-target — an interruptRoute eval failure skips the candidate without writing"
gsc_interrupt_setup
touch "$GSCI_ROOT/node-fail"
gsci6_out=$(gsci_run)
assert_eq "graph-select-target interrupt: a failed cascade eval degrades to empty" "empty" "$gsci6_out"
assert_eq "graph-select-target interrupt: a failed cascade eval makes no apply-fix-state call" \
  "0" "$([ -f "$GSCI_ROOT/apply-fix-calls.log" ] && echo 1 || echo 0)"
assert_eq "graph-select-target interrupt: a failed cascade eval is reported on stderr" \
  "1" "$(grep -q "interruptRoute eval failed" "$GSCI_ROOT/gsci.err" && echo 1 || echo 0)"
gsc_interrupt_teardown

# <<< END MOVED <<<

# ============================================================================
# Test: graph-select-target — the merge-conflict interrupt
# (tactic-graph-router-conflict-routing Unit 3)
# ============================================================================
# The router now SURFACES a reviewed awaiting-merge node (as `pending-merge`)
# instead of excluding it, and this selector's two new gates own the orthogonal
# `execution.conflict` interrupt: _gate_pending_merge ENTERS it on CONFLICTING,
# _gate_conflict_active spends an attempt / parks at the cap / self-heals once
# the PR is MERGEABLE again. The cases below reuse the interrupt fixture above
# verbatim (its npx stub also serves apply-conflict-state.ts, and its
# packages/intentionsutil/scripts/ carries graph-commit + park-node stubs) and
# pin the SHELL seam only: which apply-conflict-state mode is called, and which
# phase (if any) is emitted. Neither gate consults interruptRoute, so the fake
# `node` is never exercised on these paths.

# --- Case 7: pending-merge + CONFLICTING enters the interrupt ----------------
echo "Test: graph-select-target — a CONFLICTING pending-merge node enters the conflict interrupt and emits conflict"
gsc_interrupt_setup
gsci_candidate pending-merge
gsci7_out=$(gsci_run)
assert_eq "graph-select-target conflict: CONFLICTING pending-merge emits conflict" \
  "node tactic-fixture tactic conflict" "$gsci7_out"
assert_eq "graph-select-target conflict: the entry call carries --set-conflict" \
  "1" "$(grep -q -- "--set-conflict" "$GSCI_ROOT/apply-conflict-calls.log" && echo 1 || echo 0)"
# The review-binding guard: entry records the head the completed review examined,
# so the self-heal below can tell "main moved" from "the branch was rewritten".
assert_eq "graph-select-target conflict: the entry call records the PR's head sha" \
  "1" "$(grep -q -- "--head-sha deadbee" "$GSCI_ROOT/apply-conflict-calls.log" && echo 1 || echo 0)"
gsc_interrupt_teardown

# --- Case 8: pending-merge + MERGEABLE is left to dispatch-auto-merge --------
echo "Test: graph-select-target — a MERGEABLE pending-merge node is skipped for dispatch-auto-merge"
gsc_interrupt_setup
gsci_candidate pending-merge
gsci_pr true
gsci8_out=$(gsci_run)
assert_eq "graph-select-target conflict: MERGEABLE pending-merge emits nothing" "empty" "$gsci8_out"
assert_eq "graph-select-target conflict: MERGEABLE pending-merge makes no apply-conflict-state call" \
  "0" "$([ -f "$GSCI_ROOT/apply-conflict-calls.log" ] && echo 1 || echo 0)"
gsc_interrupt_teardown

# --- Case 9: pending-merge + UNKNOWN never dispatches ------------------------
# GitHub computes mergeability asynchronously; an UNKNOWN must wait, never route.
echo "Test: graph-select-target — an UNKNOWN-mergeability pending-merge node waits for the next tick"
gsc_interrupt_setup
gsci_candidate pending-merge
gsci_pr null
gsci9_out=$(gsci_run)
assert_eq "graph-select-target conflict: UNKNOWN pending-merge emits nothing" "empty" "$gsci9_out"
assert_eq "graph-select-target conflict: UNKNOWN pending-merge makes no apply-conflict-state call" \
  "0" "$([ -f "$GSCI_ROOT/apply-conflict-calls.log" ] && echo 1 || echo 0)"
gsc_interrupt_teardown

# --- Case 10: an active interrupt, still conflicted, spends one attempt ------
echo "Test: graph-select-target — an active conflict interrupt still CONFLICTING spends an attempt and re-emits conflict"
gsc_interrupt_setup
gsci_candidate conflict
gsci10_out=$(gsci_run)
assert_eq "graph-select-target conflict: an uncapped active interrupt re-emits conflict" \
  "node tactic-fixture tactic conflict" "$gsci10_out"
assert_eq "graph-select-target conflict: the cap is read first via --park-if-capped" \
  "1" "$(grep -q -- "--park-if-capped" "$GSCI_ROOT/apply-conflict-calls.log" && echo 1 || echo 0)"
assert_eq "graph-select-target conflict: an uncapped retry spends an attempt" \
  "1" "$(grep -q -- "--spend-attempt" "$GSCI_ROOT/apply-conflict-calls.log" && echo 1 || echo 0)"
assert_eq "graph-select-target conflict: an uncapped retry never parks the node" \
  "0" "$([ -f "$GSCI_ROOT/park-node-calls.log" ] && echo 1 || echo 0)"
gsc_interrupt_teardown

# --- Case 11: at the cap the node is parked, not re-dispatched ---------------
echo "Test: graph-select-target — an active conflict interrupt at the attempt cap parks the node instead of retrying"
gsc_interrupt_setup
gsci_candidate conflict
printf '%s\n' '{"mode":"park-if-capped","id":"tactic-fixture","wrote":false,"capped":true,"attempt":3}' \
  > "$GSCI_ROOT/conflict-result.json"
gsci11_out=$(gsci_run)
assert_eq "graph-select-target conflict: a capped interrupt emits nothing" "empty" "$gsci11_out"
assert_eq "graph-select-target conflict: a capped interrupt parks the source node" \
  "1" "$([ -f "$GSCI_ROOT/park-node-calls.log" ] && echo 1 || echo 0)"
assert_eq "graph-select-target conflict: the park names the node and its recommendation" \
  "1" "$(grep -q "dispatch-conflict tactic-fixture" "$GSCI_ROOT/park-node-calls.log" && echo 1 || echo 0)"
assert_eq "graph-select-target conflict: a capped interrupt never spends another attempt" \
  "0" "$(grep -q -- "--spend-attempt" "$GSCI_ROOT/apply-conflict-calls.log" && echo 1 || echo 0)"
gsc_interrupt_teardown

# --- Case 12: MERGEABLE again backstop-clears the undeclared interrupt -------
# Reaching this arm means the worker never declared a disposition (a declared
# one nulls execution.conflict, so the router stops emitting `conflict`). The
# backstop therefore must NOT keep the review verdict on its own say-so: it
# clears through a mode that re-reviews unless the tree is provably the reviewed
# one (`--clear-conflict-guarded`, whose default outcome is the intention clear),
# and it re-drafts the PR so no merge lane takes it meanwhile. The one thing it
# may never do is assert `--clear-conflict-mechanical` itself — that verdict
# belongs to `/dispatch-conflict` Lane 3, which saw the resolution.
echo "Test: graph-select-target — an undeclared conflict interrupt on a now-MERGEABLE PR is backstop-cleared for re-review"
gsc_interrupt_setup
gsci_candidate conflict
gsci_pr true
gsci12_out=$(gsci_run)
assert_eq "graph-select-target conflict: a backstop-cleared interrupt emits nothing" "empty" "$gsci12_out"
assert_eq "graph-select-target conflict: the backstop clears through a re-review-defaulting mode" \
  "1" "$(grep -qE -- "--clear-conflict-(guarded|intention)" "$GSCI_ROOT/apply-conflict-calls.log" && echo 1 || echo 0)"
assert_eq "graph-select-target conflict: the backstop never asserts the mechanical verdict itself" \
  "0" "$(grep -q -- "--clear-conflict-mechanical" "$GSCI_ROOT/apply-conflict-calls.log" && echo 1 || echo 0)"
assert_eq "graph-select-target conflict: the backstop re-drafts the PR to disarm the merge lanes" \
  "1" "$(grep -q -- "--undo 2999" "$GSCI_ROOT/gh-pr-ready.log" && echo 1 || echo 0)"
# The guard's INPUT: the clear is decided against the PR's CURRENT head, not
# against the caller's assertion that nothing important changed.
assert_eq "graph-select-target conflict: the backstop clear carries the PR's current head sha" \
  "1" "$(grep -q -- "--head-sha deadbee" "$GSCI_ROOT/apply-conflict-calls.log" && echo 1 || echo 0)"
gsc_interrupt_teardown

# --- Case 13: a head-match guarded clear hands the PR back to auto-merge -----
# The one arm that keeps the `reviewed` marker: the primitive reports
# `reset: false` (the head never moved, so the tree that will merge IS the
# reviewed tree). The selector must then undo its defensive re-draft, or the
# node would sit as a draft forever waiting on an auto-merge that cannot fire.
echo "Test: graph-select-target — a head-match guarded clear re-readies the PR for the armed auto-merge"
gsc_interrupt_setup
gsci_candidate conflict
gsci_pr true
printf '%s\n' '{"mode":"clear","id":"tactic-fixture","wrote":true,"reset":false,"phase":"review","guard":"head-match"}' \
  > "$GSCI_ROOT/conflict-result.json"
gsci13_out=$(gsci_run)
assert_eq "graph-select-target conflict: a head-match clear emits nothing" "empty" "$gsci13_out"
assert_eq "graph-select-target conflict: a head-match clear re-readies the PR" \
  "1" "$(grep -qx "pr ready 2999" "$GSCI_ROOT/gh-pr-ready.log" && echo 1 || echo 0)"
gsc_interrupt_teardown

# --- Case 14: the lane's per-pass graph-commit budget bounds the write arms --
# Every conflict write arm lands a commit and then returns NOT-SELECTED, so
# `--top` does not bound them. Unbounded, one push to main conflicting with N
# reviewed PRs would serialize N landing-lock waits inside ONE dispatch-lock
# hold and get the tick's lock reclaimed mid-selection (duplicate workers). With
# the budget set to 1, exactly ONE of the two matching candidates may write this
# pass; the other is deferred to the next tick, where it matches again.
echo "Test: graph-select-target — the conflict lane spends at most GRAPH_CONFLICT_COMMIT_BUDGET commits per pass"
gsc_interrupt_setup
printf '%s\n' '{"candidates":[{"id":"tactic-fixture","kind":"tactic","phase":"conflict","pr":"2999","pace_exempt":false},{"id":"tactic-fixture-2","kind":"tactic","phase":"conflict","pr":"2999","pace_exempt":false}],"events":[]}' \
  > "$GSCI_ROOT/candidates.json"
gsci_pr true
export GRAPH_CONFLICT_COMMIT_BUDGET=1
gsci14_out=$(gsci_run)
unset GRAPH_CONFLICT_COMMIT_BUDGET
assert_eq "graph-select-target conflict: a budgeted pass still emits nothing" "empty" "$gsci14_out"
assert_eq "graph-select-target conflict: only ONE candidate's clear runs under a budget of 1" \
  "1" "$(grep -c -- "--clear-conflict-guarded" "$GSCI_ROOT/apply-conflict-calls.log")"
assert_eq "graph-select-target conflict: the deferred candidate is logged as budget-spent" \
  "1" "$(grep -q "conflict-commit-budget-spent" "$GSCI_ROOT/seldir/graph-selection.jsonl" && echo 1 || echo 0)"
gsc_interrupt_teardown

# ============================================================================
# Test: graph-select-target — the tree-sha-keyed origin/main snapshot cache
# (tactic-done-node-retention-scan-cost Unit 2)
# ============================================================================
# Unlike the fixtures above, these cases run the REAL select-targets.ts: the
# whole point is the new --nodes-json / --emit-nodes handling, and a stubbed
# selector would prove nothing about it. The fake `npx` therefore forwards to
# the real script instead of printing canned candidates, and the fixture repo
# carries a real two-node intentions store at origin/main.
GSCC_ROOT=$(mktemp -d)
GSCC_BARE=$(mktemp -d)
GSCC_CACHE=$(mktemp -d)
GSCC_SCRIPTS="$GSCC_ROOT/.claude/skills/dispatch-propagate/scripts"
mkdir -p "$GSCC_SCRIPTS" "$GSCC_ROOT/bin" "$GSCC_ROOT/seldir"
cp "$SCRIPT_DIR"/graph-select-target "$SCRIPT_DIR"/lib.sh "$SCRIPT_DIR"/lib-*.sh "$GSCC_SCRIPTS/"

# The checkout under test, where the real select-targets.ts and node_modules
# live. SCRIPT_DIR is scripts -> dispatch-propagate -> skills -> .claude -> root.
GSCC_REPO="$(cd "$SCRIPT_DIR/../../../.." && pwd)"
GSCC_REAL_GIT="$(command -v git)"
GSCC_REAL_NPX="$(command -v npx)"

# Forward `npx tsx <relative-script> ARGS…` to the real select-targets.ts. The
# `cd` is required: `node --import tsx/esm` resolves the tsx loader from cwd,
# and the caller's cwd is the FIXTURE root, which has no node_modules. The
# node --import spelling rather than `npx tsx` per .claude/rules/sandbox.md.
cat > "$GSCC_ROOT/bin/npx" <<GSCCNPX
#!/usr/bin/env bash
shift 2
cd "$GSCC_REPO" || exit 2
exec node --import tsx/esm packages/intentionsutil/scripts/select-targets.ts "\$@"
GSCCNPX
chmod +x "$GSCC_ROOT/bin/npx"

# Daemon stubs, same shape as the fixtures above: no live sessions, and the
# empty-read corroboration probe reports the daemon visible so `[]` is trusted.
cat > "$GSCC_ROOT/bin/claude" <<'GSCCCLAUDE'
#!/usr/bin/env bash
printf '%s' '[]'
GSCCCLAUDE
chmod +x "$GSCC_ROOT/bin/claude"
cat > "$GSCC_ROOT/bin/pgrep-daemon-visible" <<'GSCCPGREP'
#!/usr/bin/env bash
exit 0
GSCCPGREP
chmod +x "$GSCC_ROOT/bin/pgrep-daemon-visible"

# A real store: one strategy and one tactic at phase implement. An implement
# candidate's sensor_gate returns 0 without touching gh, so no network stub is
# needed and the emitted line is deterministic.
mkdir -p "$GSCC_ROOT/intentions"
cat > "$GSCC_ROOT/intentions/strategy-fixture.md" <<'GSCCSTRAT'
---
id: strategy-fixture
kind: strategy
statement: A fixture strategy for the selector snapshot-cache tests
owner: ai
status: codified
parent: null
phase: null
---

# Fixture strategy
GSCCSTRAT
cat > "$GSCC_ROOT/intentions/tactic-fixture-cache.md" <<'GSCCTAC'
---
id: tactic-fixture-cache
kind: tactic
statement: A fixture tactic the selector emits at phase implement
owner: ai
status: codified
parent: null
serves:
  - strategy-fixture
phase: implement
---

# Fixture tactic
GSCCTAC

git init -q -b main "$GSCC_ROOT"
git -C "$GSCC_ROOT" config user.email t@t
git -C "$GSCC_ROOT" config user.name t
git -C "$GSCC_ROOT" add intentions
git -C "$GSCC_ROOT" commit -q -m seed
git init -q --bare -b main "$GSCC_BARE"
git -C "$GSCC_ROOT" remote add origin "$GSCC_BARE"
git -C "$GSCC_ROOT" push -q origin main
git -C "$GSCC_ROOT" fetch -q origin

# gscc_run [<cache-dir>] — one selection. An empty/absent argument is the
# cache-disabled path (the script reads ${DISPATCH_GRAPH_NODE_CACHE:-}, so an
# empty value and an unset one are the same branch).
gscc_run() {
  PATH="$GSCC_ROOT/bin:$SAVED_PATH" \
    CLAUDE_AGENTS_CMD="$GSCC_ROOT/bin/claude" \
    CLAUDE_AGENTS_PGREP_CMD="$GSCC_ROOT/bin/pgrep-daemon-visible" \
    DISPATCH_RESERVATION_DIR="$GSCC_ROOT/reservations" \
    DISPATCH_SELECTION_LOG_DIR="$GSCC_ROOT/seldir" \
    DISPATCH_GRAPH_NODE_CACHE="${1:-}" \
    "$GSCC_SCRIPTS/graph-select-target" --top 1 2>/dev/null
}

# The number of nodes-tree-*.json entries in the cache directory.
gscc_entries() {
  find "$GSCC_CACHE" -maxdepth 1 -name 'nodes-tree-*.json' | wc -l | tr -d ' '
}

GSCC_EXPECTED="node tactic-fixture-cache tactic implement"

# --- Case 1: the var unset is byte-identical to today's path, and writes none -
echo "Test: graph-select-target — an unset DISPATCH_GRAPH_NODE_CACHE selects on today's path and caches nothing"
gscc_cold_uncached=$(gscc_run)
assert_eq "graph-select-target cache: uncached run selects the fixture tactic" \
  "$GSCC_EXPECTED" "$gscc_cold_uncached"
assert_eq "graph-select-target cache: uncached run writes no entry" "0" "$(gscc_entries)"

# --- Case 2: cold writes exactly one entry; warm returns the same selection ---
echo "Test: graph-select-target — a cold cached run writes one tree-sha entry and a warm run matches it"
gscc_cold=$(gscc_run "$GSCC_CACHE")
assert_eq "graph-select-target cache: cold cached run matches the uncached selection" \
  "$gscc_cold_uncached" "$gscc_cold"
assert_eq "graph-select-target cache: cold run writes exactly one entry" "1" "$(gscc_entries)"
gscc_warm=$(gscc_run "$GSCC_CACHE")
assert_eq "graph-select-target cache: warm run matches the cold selection" "$gscc_cold" "$gscc_warm"
assert_eq "graph-select-target cache: warm run adds no second entry" "1" "$(gscc_entries)"
# The entry is keyed on the tree object the archive would have produced.
gscc_tree=$(git -C "$GSCC_ROOT" rev-parse origin/main:intentions)
assert_eq "graph-select-target cache: the entry is named for the origin/main:intentions tree sha" \
  "1" "$([ -f "$GSCC_CACHE/nodes-tree-$gscc_tree.json" ] && echo 1 || echo 0)"

# --- Case 3: the hit really skips `git archive` -------------------------------
# This is the proof the 75 ms is SAVED rather than merely duplicated. A `git`
# shim on PATH fails loudly on `archive` and forwards everything else (including
# the rev-parse the key needs) to the real binary. With the entry warm the
# selection must still succeed; with it cold the same shim must break the run,
# which is what rules out a vacuous pass where the archive was never reached
# for some unrelated reason.
echo "Test: graph-select-target — a warm entry skips git archive entirely"
cat > "$GSCC_ROOT/bin/git" <<GSCCGIT
#!/usr/bin/env bash
for _a in "\$@"; do
  if [ "\$_a" = "archive" ]; then
    echo "stub git: archive must not run on a cache hit" >&2
    exit 97
  fi
done
exec "$GSCC_REAL_GIT" "\$@"
GSCCGIT
chmod +x "$GSCC_ROOT/bin/git"
# `|| true` so a REGRESSION here reports as a FAIL rather than aborting the
# suite under `set -e`: if the hit path stops being taken, this run exits 2.
gscc_noarchive=$(gscc_run "$GSCC_CACHE") || true
assert_eq "graph-select-target cache: a warm run selects with git archive forbidden" \
  "$GSCC_EXPECTED" "$gscc_noarchive"
# Negative control for the shim itself: remove the entry and the same run must
# now fail, proving the shim is actually in the path the cold run takes.
rm -f "$GSCC_CACHE"/nodes-tree-*.json
# The run exits 2 here (the snapshot pipeline fails), which is the point — so
# capture rather than let `set -e` take the suite down with it.
gscc_noarchive_cold=$(gscc_run "$GSCC_CACHE") || gscc_noarchive_rc=$?
assert_eq "graph-select-target cache: with no entry the archive-forbidding shim breaks the run" \
  "2" "${gscc_noarchive_rc:-0}"
assert_eq "graph-select-target cache: the broken cold run emits no selection" \
  "" "$gscc_noarchive_cold"
rm -f "$GSCC_ROOT/bin/git"
# Re-warm for the cases below.
gscc_run "$GSCC_CACHE" >/dev/null

# --- Case 4: a new origin/main tree is a new key ------------------------------
echo "Test: graph-select-target — advancing origin/main writes a second entry and selects the new tree"
printf '\nAn added body paragraph.\n' >> "$GSCC_ROOT/intentions/tactic-fixture-cache.md"
git -C "$GSCC_ROOT" add intentions
git -C "$GSCC_ROOT" commit -q -m advance
git -C "$GSCC_ROOT" push -q origin main
git -C "$GSCC_ROOT" fetch -q origin
gscc_advanced=$(gscc_run "$GSCC_CACHE")
assert_eq "graph-select-target cache: the advanced tree still selects the fixture tactic" \
  "$GSCC_EXPECTED" "$gscc_advanced"
assert_eq "graph-select-target cache: the advanced tree writes a second entry" "2" "$(gscc_entries)"
GSCC_TREE2=$(git -C "$GSCC_ROOT" rev-parse origin/main:intentions)
assert_eq "graph-select-target cache: the second entry is named for the new tree sha" \
  "1" "$([ -f "$GSCC_CACHE/nodes-tree-$GSCC_TREE2.json" ] && echo 1 || echo 0)"

# --- Case 4b: the archive is pinned to the tree the KEY names -----------------
# `origin/main` is a moving ref. The key comes from `rev-parse
# origin/main:intentions`, and the archive used to re-resolve `origin/main`
# independently — so a sibling worktree's `graph-commit` push+fetch landing
# between the two published tree B's nodes under `nodes-tree-<A>.json`. A later
# selection resolving back to tree A would then be served B's nodes: a wrong
# phase/`blocked_by` view with no strictness violation to catch it.
#
# Racing that window inside a test is not reliable. Asserting that the archive
# never names the moving ref is, and it is exactly the property that closes it.
echo "Test: graph-select-target — the snapshot archives the pinned tree, not origin/main"
cat > "$GSCC_ROOT/bin/git" <<GSCCPIN
#!/usr/bin/env bash
_isarchive=0
for _a in "\$@"; do
  [ "\$_a" = "archive" ] && _isarchive=1
done
if [ "\$_isarchive" = 1 ]; then
  for _a in "\$@"; do
    if [ "\$_a" = "origin/main" ]; then
      echo "stub git: archive re-resolved the moving ref instead of the pinned tree" >&2
      exit 96
    fi
  done
fi
exec "$GSCC_REAL_GIT" "\$@"
GSCCPIN
chmod +x "$GSCC_ROOT/bin/git"
rm -f "$GSCC_CACHE"/nodes-tree-*.json
# `|| true` so a regression FAILs rather than aborting the suite under `set -e`.
gscc_pinned=$(gscc_run "$GSCC_CACHE") || true
assert_eq "graph-select-target cache: a cold keyed run archives the pinned tree, not origin/main" \
  "$GSCC_EXPECTED" "$gscc_pinned"
# Negative control for the shim itself. With NO cache dir there is no key and
# nothing to pin, so the archive legitimately names origin/main and the SAME
# shim must break that run. Without this, the pass above could mean the shim
# simply never fired.
gscc_pinned_nokey=$(gscc_run) || gscc_pinned_rc=$?
assert_eq "graph-select-target cache: the unkeyed path still names origin/main (shim fires)" \
  "2" "${gscc_pinned_rc:-0}"
assert_eq "graph-select-target cache: the broken unkeyed run emits no selection" \
  "" "$gscc_pinned_nokey"
rm -f "$GSCC_ROOT/bin/git"
# Re-warm so the cases below find the entry they rewrite.
gscc_run "$GSCC_CACHE" >/dev/null

# --- Cases 5-7: an unusable entry degrades to a fresh strict enumeration ------
# `[]` is the one that matters most: it is valid JSON and a valid array, so an
# entry truncated to nothing would otherwise read as "no candidates today" and
# stop the fleet silently. select-targets.ts refuses it; the wrapper deletes the
# entry and re-snapshots ONCE.
gscc_expect_degrades() { # <label> <payload>
  printf '%s' "$2" > "$GSCC_CACHE/nodes-tree-$GSCC_TREE2.json"
  local out
  out=$(gscc_run "$GSCC_CACHE")
  assert_eq "graph-select-target cache: $1 degrades to a fresh enumeration" "$GSCC_EXPECTED" "$out"
  assert_eq "graph-select-target cache: $1 leaves a rewritten, usable entry" \
    "$GSCC_EXPECTED" "$(gscc_run "$GSCC_CACHE")"
}
echo "Test: graph-select-target — a truncated cache entry degrades to the archive path"
gscc_expect_degrades "a truncated entry" '[{"id":"tac'
echo "Test: graph-select-target — a valid-JSON invalid-node entry degrades to the archive path"
gscc_expect_degrades "an invalid-node entry" '[{"id":5}]'
echo "Test: graph-select-target — an empty-array entry is refused, not read as 'no candidates'"
gscc_expect_degrades "an empty-array entry" '[]'

# --- Case 8: a SELECTOR failure is not a cache failure ----------------------
# Cases 5-7 cover the three unusable PAYLOADS, all of which exit 3. This is the
# other half of that contract: any other non-zero exit must NOT be read as a
# corrupt entry. Before the exit-code split, `select-targets.ts failed` for any
# reason at all — a selectGraphTargets throw, a missing node_modules, a tsx
# startup failure — deleted a perfectly good entry, re-ran the selector over the
# same nodes, republished the identical array, failed anyway, and left the
# operator a single line blaming the cache.
#
# The shim fails ONLY the --nodes-json invocation, so it targets the hit path
# precisely and leaves the archive path's own selector call alone.
echo "Test: graph-select-target — a selector failure keeps the entry and blames the selector"
# Case 7 left a rewritten, usable entry (it asserts that itself). Case 8
# deliberately does NOT re-warm: a re-warm runs the wrapper, so a wrapper
# regression would destroy the entry before the assertions below could
# observe it, and the failure would surface as a broken precondition
# instead of as the defect it is.
gscc_good_entry="$GSCC_CACHE/nodes-tree-$GSCC_TREE2.json"
assert_eq "graph-select-target cache: the selector-failure case starts from a real entry" "1" \
  "$([ -s "$gscc_good_entry" ] && echo 1 || echo 0)"
gscc_good_bytes=$(cat "$gscc_good_entry")
cat > "$GSCC_ROOT/bin/npx" <<GSCCSEL2
#!/usr/bin/env bash
for _a in "\$@"; do
  if [ "\$_a" = "--nodes-json" ]; then
    echo "stub npx: simulated selector failure (not a payload problem)" >&2
    exit 9
  fi
done
exec "$GSCC_REAL_NPX" "\$@"
GSCCSEL2
chmod +x "$GSCC_ROOT/bin/npx"
gscc_sel_rc=0
PATH="$GSCC_ROOT/bin:$SAVED_PATH" \
  CLAUDE_AGENTS_CMD="$GSCC_ROOT/bin/claude" \
  CLAUDE_AGENTS_PGREP_CMD="$GSCC_ROOT/bin/pgrep-daemon-visible" \
  DISPATCH_RESERVATION_DIR="$GSCC_ROOT/reservations" \
  DISPATCH_SELECTION_LOG_DIR="$GSCC_ROOT/seldir" \
  DISPATCH_GRAPH_NODE_CACHE="$GSCC_CACHE" \
  "$GSCC_SCRIPTS/graph-select-target" --top 1 >/dev/null 2>"$GSCC_ROOT/sel-err.log" || gscc_sel_rc=$?
rm -f "$GSCC_ROOT/bin/npx"
assert_eq "graph-select-target cache: a selector failure exits non-zero" "1" \
  "$([ "$gscc_sel_rc" -ne 0 ] && echo 1 || echo 0)"
# The operative assertion: the entry SURVIVES. Deleting it is the bug.
assert_eq "graph-select-target cache: a selector failure does NOT delete the entry" \
  "$gscc_good_bytes" "$(cat "$gscc_good_entry" 2>/dev/null)"
assert_eq "graph-select-target cache: the message does NOT blame the cache" "no" \
  "$(case "$(cat "$GSCC_ROOT/sel-err.log")" in *unusable*) printf 'yes' ;; *) printf 'no' ;; esac)"
assert_eq "graph-select-target cache: the message names the selector" "yes" \
  "$(case "$(cat "$GSCC_ROOT/sel-err.log")" in *"SELECTOR failure"*) printf 'yes' ;; *) printf 'no' ;; esac)"

rm -rf "$GSCC_ROOT" "$GSCC_BARE" "$GSCC_CACHE"

report_results
