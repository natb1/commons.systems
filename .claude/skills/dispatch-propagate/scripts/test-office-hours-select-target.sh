#!/usr/bin/env bash
# Tests for office-hours-select-target -- moved verbatim from test-dispatch-scripts.sh
# (tactic-dispatch-test-monolith-split). Original section: 2364-3166.
set -euo pipefail

FIXTURE_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=dispatch-test-fixture.sh
source "$FIXTURE_DIR/dispatch-test-fixture.sh"

# >>> MOVED FROM test-dispatch-scripts.sh >>>
# ============================================================================
# office-hours-select-target tests
# ============================================================================
echo ""
echo "=== office-hours-select-target ==="
#
# Selects the oldest open issue carrying dispatch:office-hours whose <N>-*
# worktree has no live session. Output: `office-hours <issue> <worktree-path|->`.
# Reuses the select-target gh/git/claude fakes (oh-issue-list.json seeds the
# office-hours queue; pr-list-full.json drives dispatch-phase/dispatch-find-pr).

# OHST1. Oldest labeled sessionless item wins; no PR, unplanned → phase plan, pr `-`.
echo "Test: oldest labeled item with no PR → plan, dash PR"
setup
printf '[{"number":42,"createdAt":"2024-01-01T00:00:00Z"},{"number":99,"createdAt":"2024-02-01T00:00:00Z"}]\n' \
  > "$STUB_DIR/oh-issue-list.json"
echo '[]' > "$STUB_DIR/pr-list-full.json"
printf 'worktree /repo\nHEAD abc123\n\n' > "$STUB_DIR/worktree-list.txt"
select_target_fake_claude   # orphan world: no live sessions
result=$("$TMPDIR_TEST/office-hours-select-target")
assert_eq "oldest labeled item selected (plan, no PR)" "office-hours 42 -" "$result"
teardown

# OHST2. A qa item — draft PR, CI green, no dispatch:* label → phase qa, PR num.
echo "Test: labeled item with green draft PR → qa, PR number"
setup
printf '[{"number":50,"createdAt":"2024-01-01T00:00:00Z"}]\n' > "$STUB_DIR/oh-issue-list.json"
# PR #7's CI verdict derives from the REST check-runs of headRefOid (#1601).
printf '%s' '{"check_runs":[{"status":"COMPLETED","conclusion":"SUCCESS"}]}' > "$STUB_DIR/check-runs-sha7.json"
printf '[{"number":7,"headRefName":"50-feat","isDraft":true,"headRefOid":"sha7","labels":[]}]\n' \
  > "$STUB_DIR/pr-list-full.json"
printf 'worktree /repo\nHEAD abc123\n\n' > "$STUB_DIR/worktree-list.txt"
select_target_fake_claude
result=$("$TMPDIR_TEST/office-hours-select-target")
assert_eq "qa item selected with its PR number" "office-hours 50 -" "$result"
teardown

# OHST3. The oldest labeled item whose <N>-* worktree has an idle (attachable)
# session is ATTACHED — idle wins over a sessionless newer sibling.
echo "Test: oldest idle-session item is attached (idle wins over fresh sibling)"
setup
printf '[{"number":42,"createdAt":"2024-01-01T00:00:00Z"},{"number":99,"createdAt":"2024-02-01T00:00:00Z"}]\n' \
  > "$STUB_DIR/oh-issue-list.json"
echo '[]' > "$STUB_DIR/pr-list-full.json"
printf 'worktree /repo\nHEAD abc123\nbranch refs/heads/main\n\nworktree /worktrees/42-x\nHEAD def456\nbranch refs/heads/42-x\n\n' \
  > "$STUB_DIR/worktree-list.txt"
# The selector emits `idle` only when the session's cwd is a worktree present on
# disk (#2241). Carry a real, on-disk cwd in the fake-session pair so the
# present-worktree (bucket 1) branch fires.
mkdir -p "$TMPDIR_TEST/wt/42-x"
office_hours_state_fake_claude "42-x:waiting:$TMPDIR_TEST/wt/42-x"   # 42's session is idle; 99 sessionless
result=$("$TMPDIR_TEST/office-hours-select-target")
assert_eq "idle item attached over sessionless sibling 99" "idle s-42-x" "$result"
teardown

# OHST3b. Two labeled items both idle → attach the oldest one's session
# (mirrors OH2 on the entry-point side).
echo "Test: two idle items → oldest attached"
setup
printf '[{"number":42,"createdAt":"2024-01-01T00:00:00Z"},{"number":99,"createdAt":"2024-02-01T00:00:00Z"}]\n' \
  > "$STUB_DIR/oh-issue-list.json"
echo '[]' > "$STUB_DIR/pr-list-full.json"
printf 'worktree /repo\nHEAD abc123\nbranch refs/heads/main\n\nworktree /worktrees/42-x\nHEAD def456\nbranch refs/heads/42-x\n\nworktree /worktrees/99-y\nHEAD aaa111\nbranch refs/heads/99-y\n\n' \
  > "$STUB_DIR/worktree-list.txt"
mkdir -p "$TMPDIR_TEST/wt/42-x" "$TMPDIR_TEST/wt/99-y"
office_hours_state_fake_claude "42-x:waiting:$TMPDIR_TEST/wt/42-x" "99-y:waiting:$TMPDIR_TEST/wt/99-y"   # both idle
result=$("$TMPDIR_TEST/office-hours-select-target")
assert_eq "oldest of two idle items attached" "idle s-42-x" "$result"
teardown

# OHST3c. Older sessionless item + newer idle item → attach the idle one
# (mirrors OH5: idle wins regardless of age order).
echo "Test: older sessionless + newer idle → attach the idle one"
setup
printf '[{"number":42,"createdAt":"2024-01-01T00:00:00Z"},{"number":99,"createdAt":"2024-02-01T00:00:00Z"}]\n' \
  > "$STUB_DIR/oh-issue-list.json"
echo '[]' > "$STUB_DIR/pr-list-full.json"
# 42 (older) has no worktree at all → sessionless; 99 (newer) has an idle worktree.
printf 'worktree /repo\nHEAD abc123\nbranch refs/heads/main\n\nworktree /worktrees/99-y\nHEAD aaa111\nbranch refs/heads/99-y\n\n' \
  > "$STUB_DIR/worktree-list.txt"
mkdir -p "$TMPDIR_TEST/wt/99-y"
office_hours_state_fake_claude "99-y:idle:$TMPDIR_TEST/wt/99-y"   # only 99's worktree is idle (attachable)
result=$("$TMPDIR_TEST/office-hours-select-target")
assert_eq "idle item attached regardless of age order" "idle s-99-y" "$result"
teardown

# OHST3d. Working-skip, sibling chosen: 42 (older) has a `working` session in its
# worktree → SKIPPED (rc 3, not fresh-launched); 99 (newer) is sessionless → it
# wins fresh. Proves a working session is neither attached nor mistaken for fresh.
echo "Test: working-session item skipped → sessionless sibling chosen fresh"
setup
printf '[{"number":42,"createdAt":"2024-01-01T00:00:00Z"},{"number":99,"createdAt":"2024-02-01T00:00:00Z"}]\n' \
  > "$STUB_DIR/oh-issue-list.json"
echo '[]' > "$STUB_DIR/pr-list-full.json"
# 42 has a worktree (its session is working → skipped); 99 has none → sessionless.
printf 'worktree /repo\nHEAD abc123\nbranch refs/heads/main\n\nworktree /worktrees/42-x\nHEAD def456\nbranch refs/heads/42-x\n\n' \
  > "$STUB_DIR/worktree-list.txt"
office_hours_state_fake_claude "42-x:working"
result=$("$TMPDIR_TEST/office-hours-select-target")
assert_eq "working item skipped; sessionless sibling 99 chosen fresh" "office-hours 99 -" "$result"
teardown

# OHST3e. Working-skip, lone → empty: the only labeled item (42) has a `working`
# session → skipped (rc 3), so it is neither attached nor fresh-launched. With no
# other item and no parked `dispatch-*` router under main, the selector emits
# `empty`. (The fall-through reaches the parked-router block, so point it at a
# controlled main-worktree path where the fake daemon reports no router; the
# working row's name is `42-x`, not `dispatch-*`, so it cannot false-match.)
echo "Test: lone working item → neither attached nor fresh → empty"
setup
printf '[{"number":42,"createdAt":"2024-01-01T00:00:00Z"}]\n' > "$STUB_DIR/oh-issue-list.json"
echo '[]' > "$STUB_DIR/pr-list-full.json"
printf 'worktree /repo\nHEAD abc123\nbranch refs/heads/main\n\nworktree /worktrees/42-x\nHEAD def456\nbranch refs/heads/42-x\n\n' \
  > "$STUB_DIR/worktree-list.txt"
export DISPATCH_OFFICE_HOURS_MAIN_WORKTREE="$TMPDIR_TEST/worktrees/main"
office_hours_state_fake_claude "42-x:working"
result=$("$TMPDIR_TEST/office-hours-select-target")
assert_eq "lone working item → empty" "empty" "$result"
unset DISPATCH_OFFICE_HOURS_MAIN_WORKTREE
teardown

# OHST3f. Done-attach (selector, --all-faithful): the only labeled item (42) has
# a `done` session in its worktree → ATTACH. The selector sees the `done` row
# ONLY because claude_sessions_with_name_all passes `--all`; the faithful fake
# strips `done` rows when `--all` is absent, so a regression that dropped `--all`
# would hide the row and turn this case red. This is the selector-side proof that
# the selector queries with `--all`.
echo "Test: done-session item attached (proves selector passes --all)"
setup
printf '[{"number":42,"createdAt":"2024-01-01T00:00:00Z"}]\n' > "$STUB_DIR/oh-issue-list.json"
echo '[]' > "$STUB_DIR/pr-list-full.json"
printf 'worktree /repo\nHEAD abc123\nbranch refs/heads/main\n\nworktree /worktrees/42-x\nHEAD def456\nbranch refs/heads/42-x\n\n' \
  > "$STUB_DIR/worktree-list.txt"
mkdir -p "$TMPDIR_TEST/wt/42-x"
office_hours_state_fake_claude "42-x:done:$TMPDIR_TEST/wt/42-x"
result=$("$TMPDIR_TEST/office-hours-select-target")
assert_eq "done session is attachable (visible only under --all)" "idle s-42-x" "$result"
teardown

# OHST3g. Stopped-attach (#2240 behavior change BY DESIGN): the only labeled item
# (42) has a `stopped` session → ATTACH. stopped is now attachable so a human
# resuming the queue re-engages the originating session in place rather than
# wedging. Uses the OHST3f (done-attach) shape: on-disk cwd, no
# DISPATCH_OFFICE_HOURS_MAIN_WORKTREE export (exits before parked-router fallback).
echo "Test: lone stopped item → attached (stopped is now attachable, #2240)"
setup
printf '[{"number":42,"createdAt":"2024-01-01T00:00:00Z"}]\n' > "$STUB_DIR/oh-issue-list.json"
echo '[]' > "$STUB_DIR/pr-list-full.json"
printf 'worktree /repo\nHEAD abc123\nbranch refs/heads/main\n\nworktree /worktrees/42-x\nHEAD def456\nbranch refs/heads/42-x\n\n' \
  > "$STUB_DIR/worktree-list.txt"
mkdir -p "$TMPDIR_TEST/wt/42-x"
office_hours_state_fake_claude "42-x:stopped:$TMPDIR_TEST/wt/42-x"
result=$("$TMPDIR_TEST/office-hours-select-target")
assert_eq "lone stopped item → attached" "idle s-42-x" "$result"
teardown

# OHST3g2. Paused-attach (#2240): the only labeled item (42) has a `paused`
# session → ATTACH. Mirrors OHST3g (stopped-attach) for the paused state.
echo "Test: lone paused item → attached (paused is now attachable, #2240)"
setup
printf '[{"number":42,"createdAt":"2024-01-01T00:00:00Z"}]\n' > "$STUB_DIR/oh-issue-list.json"
echo '[]' > "$STUB_DIR/pr-list-full.json"
printf 'worktree /repo\nHEAD abc123\nbranch refs/heads/main\n\nworktree /worktrees/42-x\nHEAD def456\nbranch refs/heads/42-x\n\n' \
  > "$STUB_DIR/worktree-list.txt"
mkdir -p "$TMPDIR_TEST/wt/42-x"
office_hours_state_fake_claude "42-x:paused:$TMPDIR_TEST/wt/42-x"
result=$("$TMPDIR_TEST/office-hours-select-target")
assert_eq "lone paused item → attached" "idle s-42-x" "$result"
teardown

# OHST3g3. Unrecognized-state-exclude (#2240 fail-safe): the only labeled item
# (42) has a session in state `zombie` (unrecognized/malformed) → EXCLUDED from
# attach (fail-safe skip, criterion 3: never attach into an unknown state) and
# not fresh-launched. With no other item and no parked router under main → `empty`.
echo "Test: lone unrecognized-state (zombie) item → excluded from attach, not fresh → empty"
setup
printf '[{"number":42,"createdAt":"2024-01-01T00:00:00Z"}]\n' > "$STUB_DIR/oh-issue-list.json"
echo '[]' > "$STUB_DIR/pr-list-full.json"
printf 'worktree /repo\nHEAD abc123\nbranch refs/heads/main\n\nworktree /worktrees/42-x\nHEAD def456\nbranch refs/heads/42-x\n\n' \
  > "$STUB_DIR/worktree-list.txt"
export DISPATCH_OFFICE_HOURS_MAIN_WORKTREE="$TMPDIR_TEST/worktrees/main"
office_hours_state_fake_claude "42-x:zombie"
result=$("$TMPDIR_TEST/office-hours-select-target")
assert_eq "lone unrecognized-state item → empty (fail-safe skip)" "empty" "$result"
unset DISPATCH_OFFICE_HOURS_MAIN_WORKTREE
teardown

# OHST3h. Two-name skip-then-attach: the only labeled item (42) has TWO sessions
# in its one worktree — the basename name (`42-x`) is `working` (queried first,
# not attachable, skip) and the `office-hours-42` name is `waiting` (attachable).
# The inner two-name loop must keep looking PAST the basename skip and return the
# attachable `office-hours-42` session. A regression that turned `saw_skip=1` into
# an immediate `return 3` would skip the issue and emit `empty` instead — every
# other OHST3* case pairs exactly one name:state per issue, so only this case
# exercises the continue-past-skip branch.
echo "Test: basename working + office-hours-N waiting → attach the waiting one (continue past skip)"
setup
printf '[{"number":42,"createdAt":"2024-01-01T00:00:00Z"}]\n' > "$STUB_DIR/oh-issue-list.json"
echo '[]' > "$STUB_DIR/pr-list-full.json"
printf 'worktree /repo\nHEAD abc123\nbranch refs/heads/main\n\nworktree /worktrees/42-x\nHEAD def456\nbranch refs/heads/42-x\n\n' \
  > "$STUB_DIR/worktree-list.txt"
export DISPATCH_OFFICE_HOURS_MAIN_WORKTREE="$TMPDIR_TEST/worktrees/main"
mkdir -p "$TMPDIR_TEST/wt/42-x"
office_hours_state_fake_claude "42-x:working" "office-hours-42:waiting:$TMPDIR_TEST/wt/42-x"
result=$("$TMPDIR_TEST/office-hours-select-target")
assert_eq "skip basename working, attach office-hours-42 waiting" "idle s-office-hours-42" "$result"
unset DISPATCH_OFFICE_HOURS_MAIN_WORKTREE
teardown

# OHST4. An empty office-hours queue with no parked router prints `empty`. The
# fall-through reaches the parked-router block: point it at a controlled
# main-worktree path (the stub git does not implement the rev-parse the real
# resolve_project_root needs) where the fake daemon reports no router.
echo "Test: empty office-hours queue, no parked router → empty"
setup
echo '[]' > "$STUB_DIR/oh-issue-list.json"
echo '[]' > "$STUB_DIR/pr-list-full.json"
printf 'worktree /repo\nHEAD abc123\n\n' > "$STUB_DIR/worktree-list.txt"
export DISPATCH_OFFICE_HOURS_MAIN_WORKTREE="$TMPDIR_TEST/worktrees/main"
select_target_fake_claude   # `[]`: no sessions under main, no parked router
result=$("$TMPDIR_TEST/office-hours-select-target")
assert_eq "empty queue, no parked router prints empty" "empty" "$result"
unset DISPATCH_OFFICE_HOURS_MAIN_WORKTREE
teardown

# OHST5. UNKNOWN daemon → both items (worktree-bearing #42 and worktree-free #99)
# fold to rc2 (UNKNOWN); neither is fresh-launched. This is the broadened
# fail-safe from #2241: removing the [[ -z "$paths" ]] worktree gate means every
# item is now probed against the daemon, so a failed query conservatively blocks
# launch for ALL items (the item may have a live session the broken daemon could
# not report). Criterion-4 (worktree-free → fresh) is now covered by OHST16
# under a WORKING daemon instead. The script falls through to the parked-router
# fallback → resolve_main_worktree → requires DISPATCH_OFFICE_HOURS_MAIN_WORKTREE.
echo "Test: UNKNOWN daemon → neither worktree-bearing nor worktree-free item fresh-launched (#2241 fail-safe); empty"
setup
printf '[{"number":42,"createdAt":"2024-01-01T00:00:00Z"},{"number":99,"createdAt":"2024-02-01T00:00:00Z"}]\n' \
  > "$STUB_DIR/oh-issue-list.json"
echo '[]' > "$STUB_DIR/pr-list-full.json"
# 42 has a worktree; 99 has none. Under an UNKNOWN daemon both fold to rc2.
printf 'worktree /repo\nHEAD abc123\nbranch refs/heads/main\n\nworktree /worktrees/42-x\nHEAD def456\nbranch refs/heads/42-x\n\n' \
  > "$STUB_DIR/worktree-list.txt"
# setup's default CLAUDE_AGENTS_CMD points at a non-existent binary (UNKNOWN).
export DISPATCH_OFFICE_HOURS_MAIN_WORKTREE="$TMPDIR_TEST/worktrees/main"
result=$("$TMPDIR_TEST/office-hours-select-target")
assert_eq "UNKNOWN daemon: neither item fresh-launched (no double-claim); empty" "empty" "$result"
unset DISPATCH_OFFICE_HOURS_MAIN_WORKTREE
teardown

# Install a fake `claude` whose `agents --json` returns a controllable session
# payload (sessionId/pid/status/name per row) so the parked-router fallback can
# be exercised: a `dispatch-*` router rooted under worktrees/main with a chosen
# status. Each argument is a "name:status" pair. The fake ignores --cwd and
# returns the full payload (matching the real daemon path, where the script
# points claude_sessions_under at DISPATCH_OFFICE_HOURS_MAIN_WORKTREE).
parked_router_fake_claude() {
  local payload="[" pair name status first=1
  for pair in "$@"; do
    name="${pair%%:*}"; status="${pair#*:}"
    if (( first )); then first=0; else payload+=","; fi
    payload+="{\"sessionId\":\"s-$name\",\"pid\":1,\"status\":\"$status\",\"name\":\"$name\",\"cwd\":\"\"}"
  done
  payload+="]"
  printf '%s' "$payload" > "$TMPDIR_TEST/claude-payload.json"
  cat > "$TMPDIR_TEST/bin/claude" <<'FAKE'
#!/usr/bin/env bash
# Ignore all args (including --cwd); return the full payload.
cat "$(cd "$(dirname "$0")/.." && pwd)/claude-payload.json"
exit 0
FAKE
  chmod +x "$TMPDIR_TEST/bin/claude"
  export CLAUDE_AGENTS_CMD="$TMPDIR_TEST/bin/claude"
}

# OHST6. No labeled item + an idle/`waiting` dispatch-* router under main →
# parked-router. The continuation invariant kept the router alive; the office
# hours reader surfaces it directly, label-free.
echo "Test: no labeled item + idle dispatch-* router under main → parked-router"
setup
echo '[]' > "$STUB_DIR/oh-issue-list.json"
echo '[]' > "$STUB_DIR/pr-list-full.json"
printf 'worktree /repo\nHEAD abc123\n\n' > "$STUB_DIR/worktree-list.txt"
export DISPATCH_OFFICE_HOURS_MAIN_WORKTREE="$TMPDIR_TEST/worktrees/main"
parked_router_fake_claude "dispatch-abc123:waiting"
result=$("$TMPDIR_TEST/office-hours-select-target")
assert_eq "idle dispatch-* router surfaced as parked-router" "parked-router s-dispatch-abc123 dispatch-abc123" "$result"
unset DISPATCH_OFFICE_HOURS_MAIN_WORKTREE
teardown

# OHST7. No labeled item + a `busy` dispatch-* router under main → empty. A busy
# router is actively ticking and must NOT be surfaced.
echo "Test: no labeled item + busy dispatch-* router under main → empty (not surfaced)"
setup
echo '[]' > "$STUB_DIR/oh-issue-list.json"
echo '[]' > "$STUB_DIR/pr-list-full.json"
printf 'worktree /repo\nHEAD abc123\n\n' > "$STUB_DIR/worktree-list.txt"
export DISPATCH_OFFICE_HOURS_MAIN_WORKTREE="$TMPDIR_TEST/worktrees/main"
parked_router_fake_claude "dispatch-abc123:busy"
result=$("$TMPDIR_TEST/office-hours-select-target")
assert_eq "busy dispatch-* router not surfaced; empty" "empty" "$result"
unset DISPATCH_OFFICE_HOURS_MAIN_WORKTREE
teardown

# OHST8. A sessionless labeled item AND a parked dispatch-* router both present →
# the labeled item wins; the parked-router fallback runs only when no labeled
# item exists.
echo "Test: labeled item present alongside parked router → labeled item wins"
setup
printf '[{"number":42,"createdAt":"2024-01-01T00:00:00Z"}]\n' > "$STUB_DIR/oh-issue-list.json"
echo '[]' > "$STUB_DIR/pr-list-full.json"
printf 'worktree /repo\nHEAD abc123\n\n' > "$STUB_DIR/worktree-list.txt"
export DISPATCH_OFFICE_HOURS_MAIN_WORKTREE="$TMPDIR_TEST/worktrees/main"
# The fake reports no worker session named 42-* (so the labeled item is
# sessionless) plus a parked dispatch-* router under main.
parked_router_fake_claude "dispatch-abc123:waiting"
result=$("$TMPDIR_TEST/office-hours-select-target")
assert_eq "labeled item selected over parked router" "office-hours 42 -" "$result"
unset DISPATCH_OFFICE_HOURS_MAIN_WORKTREE
teardown

# OHST9. UNKNOWN daemon query (claude_sessions_under returns non-zero) → empty:
# no parked router is fabricated from a failed query.
echo "Test: no labeled item + UNKNOWN daemon → empty (no fabricated parked router)"
setup
echo '[]' > "$STUB_DIR/oh-issue-list.json"
echo '[]' > "$STUB_DIR/pr-list-full.json"
printf 'worktree /repo\nHEAD abc123\n\n' > "$STUB_DIR/worktree-list.txt"
export DISPATCH_OFFICE_HOURS_MAIN_WORKTREE="$TMPDIR_TEST/worktrees/main"
# setup's default CLAUDE_AGENTS_CMD points at a non-existent binary → claude
# exits non-zero → claude_sessions_under returns 1 (UNKNOWN).
result=$("$TMPDIR_TEST/office-hours-select-target")
assert_eq "UNKNOWN daemon does not fabricate a parked router; empty" "empty" "$result"
unset DISPATCH_OFFICE_HOURS_MAIN_WORKTREE
teardown

# OHST10. A labeled item whose draft PR has CI still in progress (pending rollup)
# → the selector no longer re-derives phase/PR (#2387); it emits the two-field
# fresh disposition `office-hours <N> <wt>`. With no <N>-* worktree on disk the
# path field is `-`. /office-hours attaches a human-driven session, not a phase.
echo "Test: labeled item with draft PR → two-field fresh disposition"
setup
printf '[{"number":50,"createdAt":"2024-01-01T00:00:00Z"}]\n' > "$STUB_DIR/oh-issue-list.json"
printf '[%s]\n' "$(make_pr 7 "50-feat" "true" "$NO_LABELS" "$PENDING_ROLLUP")" \
  > "$STUB_DIR/pr-list-full.json"
printf 'worktree /repo\nHEAD abc123\n\n' > "$STUB_DIR/worktree-list.txt"
select_target_fake_claude
result=$("$TMPDIR_TEST/office-hours-select-target")
assert_eq "draft-PR item → two-field fresh disposition (no phase/PR)" "office-hours 50 -" "$result"
teardown

# OHST11. A sessionless labeled item whose <N>-* worktree exists on disk (an
# orphan: no live session) → the fresh disposition carries that worktree path
# as its 2nd (path) field, so the entry script can launch the fresh session --cwd it.
echo "Test: sessionless item with an orphan worktree → worktree path emitted"
setup
printf '[{"number":42,"createdAt":"2024-01-01T00:00:00Z"}]\n' > "$STUB_DIR/oh-issue-list.json"
echo '[]' > "$STUB_DIR/pr-list-full.json"
printf 'worktree /repo\nHEAD abc123\nbranch refs/heads/main\n\nworktree /worktrees/42-x\nHEAD def456\nbranch refs/heads/42-x\n\n' \
  > "$STUB_DIR/worktree-list.txt"
select_target_fake_claude   # orphan: no live sessions → sessionless, picked fresh
result=$("$TMPDIR_TEST/office-hours-select-target")
assert_eq "fresh disposition carries the worktree path" "office-hours 42 /worktrees/42-x" "$result"
teardown

# OHST12. A fresh item carrying the `main-qa` label (#1648) — a needs-main QA
# follow-up that is brand-new, no-PR, NO-WORKTREE — emits the MAIN worktree as
# the 2nd (path) field (not `-`), so the entry dispatcher's `-` guard never trips
# and fresh_session can cd into the main worktree as the spawn cwd.
echo "Test: fresh main-qa-labelled item → main worktree as cwd"
setup
printf '[{"number":42,"createdAt":"2024-01-01T00:00:00Z","labels":[{"name":"main-qa"}]}]\n' \
  > "$STUB_DIR/oh-issue-list.json"
echo '[]' > "$STUB_DIR/pr-list-full.json"
printf 'worktree /repo\nHEAD abc123\n\n' > "$STUB_DIR/worktree-list.txt"
export DISPATCH_OFFICE_HOURS_MAIN_WORKTREE="$TMPDIR_TEST/worktrees/main"
# The selector itself does not stat this path; this mkdir is a convention match
# documenting the production contract (fresh_session must be able to cd into the
# cwd). A full entry-point integration test for the main-qa fresh-spawn path is
# needed to actually exercise fresh_session's cwd guard.
mkdir -p "$TMPDIR_TEST/worktrees/main"
select_target_fake_claude   # no live sessions → sessionless, picked fresh
result=$("$TMPDIR_TEST/office-hours-select-target")
assert_eq "main-qa override: main worktree as 2nd (path) field" \
  "office-hours 42 $TMPDIR_TEST/worktrees/main" "$result"
unset DISPATCH_OFFICE_HOURS_MAIN_WORKTREE
teardown

# OHST13. Worktree-present attach (#2241 bucket 1, asserted with a cwd-bearing
# fake): a registered <N>-* worktree whose originating session's cwd EXISTS on
# disk → attach in place. This is the unchanged pre-#2241 behavior, now proved
# through the cwd-bearing state fake: the session reports an on-disk cwd, the
# selector's `-d "$IDLE_CWD"` gate passes, and it emits plain `idle`.
echo "Test: registered worktree + on-disk session cwd → idle (attach in place)"
setup
printf '[{"number":42,"createdAt":"2024-01-01T00:00:00Z"}]\n' > "$STUB_DIR/oh-issue-list.json"
echo '[]' > "$STUB_DIR/pr-list-full.json"
printf 'worktree /repo\nHEAD abc123\nbranch refs/heads/main\n\nworktree /worktrees/42-x\nHEAD def456\nbranch refs/heads/42-x\n\n' \
  > "$STUB_DIR/worktree-list.txt"
mkdir -p "$TMPDIR_TEST/wt/42-x"
# Registered worktree basename is 42-x; the session is the renamed office-hours-42
# carrying an on-disk cwd. issue_live_session_id queries 42-x (miss) then
# office-hours-42 (hit) → attachable with a present cwd → bucket 1.
office_hours_state_fake_claude "office-hours-42:idle:$TMPDIR_TEST/wt/42-x"
result=$("$TMPDIR_TEST/office-hours-select-target")
assert_eq "registered worktree + on-disk cwd → idle (attach in place)" "idle s-office-hours-42" "$result"
teardown

# OHST14. Worktree-swept attach-after-provision (#2241 bucket 2): an attachable
# session whose cwd is NOT on disk (the worktree was swept), the <N>-* worktree is
# NOT registered, but `origin/<branch>` still exists → emit `idle-provision`. The
# session is named 42-x (a phase-worker `<N>-slug`), matched via the prefix path
# since no worktree is registered; its swept cwd's basename is the branch to
# re-provision.
echo "Test: swept worktree + remote branch exists → idle-provision"
setup
printf '[{"number":42,"createdAt":"2024-01-01T00:00:00Z"}]\n' > "$STUB_DIR/oh-issue-list.json"
echo '[]' > "$STUB_DIR/pr-list-full.json"
# 42-x NOT registered (only main listed) → prefix-match path, swept-cwd bucket.
printf 'worktree /repo\nHEAD abc123\nbranch refs/heads/main\n\n' > "$STUB_DIR/worktree-list.txt"
printf '%s\n' '42-x' > "$STUB_DIR/remote-branches.txt"   # origin/42-x exists
export DISPATCH_OFFICE_HOURS_MAIN_WORKTREE="$TMPDIR_TEST/worktrees/main"
# cwd /worktrees/42-x is non-empty but does NOT exist on disk → swept.
office_hours_state_fake_claude "42-x:waiting:/worktrees/42-x"
result=$("$TMPDIR_TEST/office-hours-select-target")
assert_eq "swept worktree, remote branch present → idle-provision" "idle-provision s-42-x 42-x" "$result"
unset DISPATCH_OFFICE_HOURS_MAIN_WORKTREE
teardown

# OHST15. Remote-branch-missing fallback (#2241 bucket 3): same swept setup as
# OHST14 but `origin/<branch>` is ABSENT (no remote-branches.txt) → the selector
# cannot re-provision, so it falls back to the fresh path for this issue. With no
# registered worktree the wt_path lookup is empty → path field `-`. The consumer's
# `-` guard later prints the swept diagnostic (see OH10).
echo "Test: swept worktree + remote branch missing → fresh fallback (path field -)"
setup
printf '[{"number":42,"createdAt":"2024-01-01T00:00:00Z"}]\n' > "$STUB_DIR/oh-issue-list.json"
echo '[]' > "$STUB_DIR/pr-list-full.json"
printf 'worktree /repo\nHEAD abc123\nbranch refs/heads/main\n\n' > "$STUB_DIR/worktree-list.txt"
# Omit remote-branches.txt → ls-remote stub exits 2 → branch not on origin.
export DISPATCH_OFFICE_HOURS_MAIN_WORKTREE="$TMPDIR_TEST/worktrees/main"
office_hours_state_fake_claude "42-x:waiting:/worktrees/42-x"
result=$("$TMPDIR_TEST/office-hours-select-target")
assert_eq "swept worktree, remote branch missing → fresh fallback with - path field" "office-hours 42 -" "$result"
unset DISPATCH_OFFICE_HOURS_MAIN_WORKTREE
teardown

# OHST15a. Removed-but-recoverable, worktree on disk → `resume` (#2240). Issue 42's
# originating session is ABSENT from the daemon registry (removed), but its <N>-*
# worktree is still on disk and its stamp sidecar + <sessionId>.jsonl transcript
# are recoverable. dispatch-recover-session-id resolves the resumable sessionId +
# branch; the on-disk worktree → resume in place. resume beats the fresh path.
echo "Test: removed session + on-disk worktree + recoverable transcript → resume"
setup
printf '[{"number":42,"createdAt":"2024-01-01T00:00:00Z"}]\n' > "$STUB_DIR/oh-issue-list.json"
echo '[]' > "$STUB_DIR/pr-list-full.json"
mkdir -p "$TMPDIR_TEST/wt/42-x"
printf 'worktree /repo\nHEAD abc123\nbranch refs/heads/main\n\nworktree %s\nHEAD def456\nbranch refs/heads/42-x\n\n' \
  "$TMPDIR_TEST/wt/42-x" > "$STUB_DIR/worktree-list.txt"
# Empty daemon registry → 42's session is removed (sessionless).
office_hours_state_fake_claude
# Recoverable: stamp sidecar for issue 42 + its .jsonl transcript present.
export DISPATCH_STAMP_PROJECTS_ROOT="$TMPDIR_TEST/projects"
mkdir -p "$DISPATCH_STAMP_PROJECTS_ROOT/proj-42"
printf '%s\n' '{"schema":1,"session_id":"rec-sess-42","repo":"natb1/commons.systems","issue":42,"pr":null,"branch":"42-x","base_sha":"deadbeef","stamped_at":"2026-06-01T10:00:00Z"}' \
  > "$DISPATCH_STAMP_PROJECTS_ROOT/proj-42/rec-sess-42.dispatch-stamp.json"
touch "$DISPATCH_STAMP_PROJECTS_ROOT/proj-42/rec-sess-42.jsonl"
result=$("$TMPDIR_TEST/office-hours-select-target")
assert_eq "removed + on-disk worktree + transcript → resume in place" "resume 42 rec-sess-42 $TMPDIR_TEST/wt/42-x" "$result"
unset DISPATCH_STAMP_PROJECTS_ROOT
teardown

# OHST15b. Removed-but-NOT-recoverable (transcript purged) → fresh (#2240). Same
# removed session, but the <sessionId>.jsonl is absent, so dispatch-recover-session-id
# exits 1 (nothing recoverable) and the selector falls through to the fresh path.
echo "Test: removed session + transcript purged → fresh-launch fallback"
setup
printf '[{"number":42,"createdAt":"2024-01-01T00:00:00Z"}]\n' > "$STUB_DIR/oh-issue-list.json"
echo '[]' > "$STUB_DIR/pr-list-full.json"
# No <N>-* worktree registered (only main) → swept/sessionless.
printf 'worktree /repo\nHEAD abc123\nbranch refs/heads/main\n\n' > "$STUB_DIR/worktree-list.txt"
office_hours_state_fake_claude
# Sidecar present but transcript PURGED (.jsonl absent) → not recoverable.
export DISPATCH_STAMP_PROJECTS_ROOT="$TMPDIR_TEST/projects"
mkdir -p "$DISPATCH_STAMP_PROJECTS_ROOT/proj-42"
printf '%s\n' '{"schema":1,"session_id":"rec-sess-42","repo":"natb1/commons.systems","issue":42,"pr":null,"branch":"42-x","base_sha":"deadbeef","stamped_at":"2026-06-01T10:00:00Z"}' \
  > "$DISPATCH_STAMP_PROJECTS_ROOT/proj-42/rec-sess-42.dispatch-stamp.json"
result=$("$TMPDIR_TEST/office-hours-select-target")
assert_eq "removed, transcript purged → fresh-launch fallback" "office-hours 42 -" "$result"
unset DISPATCH_STAMP_PROJECTS_ROOT
teardown

# OHST15c. Idle beats a removed-but-recoverable sibling (#2240 priority). 42 (older)
# is removed-but-recoverable; 99 (newer) has a live idle session. A live idle
# session is strictly safer than resurrecting a removed one, so idle wins and the
# resume pass never runs.
echo "Test: live idle item beats a removed-but-recoverable sibling (priority)"
setup
printf '[{"number":42,"createdAt":"2024-01-01T00:00:00Z"},{"number":99,"createdAt":"2024-02-01T00:00:00Z"}]\n' \
  > "$STUB_DIR/oh-issue-list.json"
echo '[]' > "$STUB_DIR/pr-list-full.json"
mkdir -p "$TMPDIR_TEST/wt/42-x" "$TMPDIR_TEST/wt/99-y"
printf 'worktree /repo\nHEAD abc123\nbranch refs/heads/main\n\nworktree %s\nHEAD def456\nbranch refs/heads/42-x\n\nworktree %s\nHEAD aaa111\nbranch refs/heads/99-y\n\n' \
  "$TMPDIR_TEST/wt/42-x" "$TMPDIR_TEST/wt/99-y" > "$STUB_DIR/worktree-list.txt"
# Only 99 has a live (idle) session; 42 is removed.
office_hours_state_fake_claude "99-y:idle:$TMPDIR_TEST/wt/99-y"
# 42 IS recoverable (sidecar + transcript) — but idle 99 must still win.
export DISPATCH_STAMP_PROJECTS_ROOT="$TMPDIR_TEST/projects"
mkdir -p "$DISPATCH_STAMP_PROJECTS_ROOT/proj-42"
printf '%s\n' '{"schema":1,"session_id":"rec-sess-42","repo":"natb1/commons.systems","issue":42,"pr":null,"branch":"42-x","base_sha":"deadbeef","stamped_at":"2026-06-01T10:00:00Z"}' \
  > "$DISPATCH_STAMP_PROJECTS_ROOT/proj-42/rec-sess-42.dispatch-stamp.json"
touch "$DISPATCH_STAMP_PROJECTS_ROOT/proj-42/rec-sess-42.jsonl"
result=$("$TMPDIR_TEST/office-hours-select-target")
assert_eq "live idle sibling beats removed-recoverable item" "idle s-99-y" "$result"
unset DISPATCH_STAMP_PROJECTS_ROOT
teardown

# OHST15d. Removed-but-recoverable, worktree SWEPT, origin/<branch> exists →
# `resume-provision` (#2240). Symmetric with idle-provision: the consumer
# re-provisions the worktree from the remote branch, then resumes the session.
echo "Test: removed session, swept worktree, origin/<branch> exists → resume-provision"
setup
printf '[{"number":42,"createdAt":"2024-01-01T00:00:00Z"}]\n' > "$STUB_DIR/oh-issue-list.json"
echo '[]' > "$STUB_DIR/pr-list-full.json"
# 42 NOT registered (only main) → swept.
printf 'worktree /repo\nHEAD abc123\nbranch refs/heads/main\n\n' > "$STUB_DIR/worktree-list.txt"
printf '%s\n' '42-x' > "$STUB_DIR/remote-branches.txt"   # origin/42-x exists
office_hours_state_fake_claude                            # empty registry → removed
export DISPATCH_OFFICE_HOURS_MAIN_WORKTREE="$TMPDIR_TEST/worktrees/main"
export DISPATCH_STAMP_PROJECTS_ROOT="$TMPDIR_TEST/projects"
mkdir -p "$DISPATCH_STAMP_PROJECTS_ROOT/proj-42"
printf '%s\n' '{"schema":1,"session_id":"rec-sess-42","repo":"natb1/commons.systems","issue":42,"pr":null,"branch":"42-x","base_sha":"deadbeef","stamped_at":"2026-06-01T10:00:00Z"}' \
  > "$DISPATCH_STAMP_PROJECTS_ROOT/proj-42/rec-sess-42.dispatch-stamp.json"
touch "$DISPATCH_STAMP_PROJECTS_ROOT/proj-42/rec-sess-42.jsonl"
result=$("$TMPDIR_TEST/office-hours-select-target")
assert_eq "removed swept + remote branch present → resume-provision" "resume-provision 42 rec-sess-42 42-x" "$result"
unset DISPATCH_OFFICE_HOURS_MAIN_WORKTREE DISPATCH_STAMP_PROJECTS_ROOT
teardown

# OHST16. Not-local fresh-launch under a WORKING daemon (#2241 criterion-4,
# relocated from OHST5): a worktree-free item under a daemon that genuinely
# reports no session for it → fresh-launch. office_hours_state_fake_claude with
# NO args installs a fake reporting `[]` (rc 0): the daemon is WORKING and the
# item is genuinely sessionless, so it is picked fresh — distinct from OHST5's
# UNKNOWN daemon, where the item conservatively folds to skip.
echo "Test: worktree-free item under WORKING daemon → fresh-launch"
setup
printf '[{"number":42,"createdAt":"2024-01-01T00:00:00Z"}]\n' > "$STUB_DIR/oh-issue-list.json"
echo '[]' > "$STUB_DIR/pr-list-full.json"
printf 'worktree /repo\nHEAD abc123\nbranch refs/heads/main\n\n' > "$STUB_DIR/worktree-list.txt"   # no 42-* worktree
office_hours_state_fake_claude   # WORKING daemon reporting no sessions ([], rc 0)
result=$("$TMPDIR_TEST/office-hours-select-target")
assert_eq "worktree-free item under WORKING daemon → fresh-launch" "office-hours 42 -" "$result"
teardown

# OHST17. Working-session-no-worktree skip (#2241 criterion-5, latent double-claim
# guard): a `working` session whose cwd is swept and whose <N>-* worktree is NOT
# registered → the prefix probe FINDS the working session (rc 3) and SKIPS it,
# rather than mistaking the item for sessionless and fresh-launching it. The lone
# item is neither attachable nor fresh → parked-router fallback → no router →
# empty. (Pre-#2241 the unregistered working session returned rc 1 and would have
# been double-claimed by a fresh launch.)
echo "Test: working session, no registered worktree → skip (no double-claim), empty"
setup
printf '[{"number":42,"createdAt":"2024-01-01T00:00:00Z"}]\n' > "$STUB_DIR/oh-issue-list.json"
echo '[]' > "$STUB_DIR/pr-list-full.json"
printf 'worktree /repo\nHEAD abc123\nbranch refs/heads/main\n\n' > "$STUB_DIR/worktree-list.txt"   # no 42-* worktree
export DISPATCH_OFFICE_HOURS_MAIN_WORKTREE="$TMPDIR_TEST/worktrees/main"
office_hours_state_fake_claude "42-x:working:/worktrees/42-x"   # working session, prefix-matched
result=$("$TMPDIR_TEST/office-hours-select-target")
assert_eq "working session with no registered worktree → skipped, not fresh-launched; empty" "empty" "$result"
unset DISPATCH_OFFICE_HOURS_MAIN_WORKTREE
teardown

# OHST18. Null-cwd degrade (#2241): an attachable session reporting an EMPTY cwd
# (no 3rd field) with no registered <N>-* worktree → the selector finds it
# attachable but cannot derive a branch (empty cwd fails both the `-d` and the
# non-empty `[[ -n "$IDLE_CWD" ]]` checks) → bucket 3 → fall through to the fresh
# path. No worktree → path field `-`.
echo "Test: attachable session with empty cwd, no worktree → fresh fallback"
setup
printf '[{"number":42,"createdAt":"2024-01-01T00:00:00Z"}]\n' > "$STUB_DIR/oh-issue-list.json"
echo '[]' > "$STUB_DIR/pr-list-full.json"
printf 'worktree /repo\nHEAD abc123\nbranch refs/heads/main\n\n' > "$STUB_DIR/worktree-list.txt"   # no 42-* worktree
export DISPATCH_OFFICE_HOURS_MAIN_WORKTREE="$TMPDIR_TEST/worktrees/main"
# office-hours-42 (exact-match name) with NO cwd field → empty cwd → null-cwd degrade.
office_hours_state_fake_claude "office-hours-42:waiting"
result=$("$TMPDIR_TEST/office-hours-select-target")
assert_eq "attachable session, empty cwd, no worktree → fresh fallback with - path field" "office-hours 42 -" "$result"
unset DISPATCH_OFFICE_HOURS_MAIN_WORKTREE
teardown

# OHST19. Registered-worktree null-cwd degrade (#2281): an attachable session
# reporting an EMPTY cwd whose <N>-* worktree IS registered and on disk → attach
# in place via the known worktree path (IDLE_WT_PATH), not a fresh launch.
# Pre-#2281 the empty cwd failed both -d and -n checks and fell to bucket 3.
echo "Test: registered worktree + null-cwd session → idle (attach via worktree path)"
setup
printf '[{"number":42,"createdAt":"2024-01-01T00:00:00Z"}]\n' > "$STUB_DIR/oh-issue-list.json"
echo '[]' > "$STUB_DIR/pr-list-full.json"
mkdir -p "$TMPDIR_TEST/wt/42-x"
# CRITICAL: the path REGISTERED in worktree-list.txt must be the SAME on-disk
# path that is mkdir'd above, so IDLE_WT_PATH (derived from
# WORKTREE_PATHS_BY_NUM) resolves to a real directory. Do NOT copy OHST13's
# split fake-path/real-path setup: there the registered path is a non-existent
# /worktrees/42-x and the test passes via IDLE_CWD, which would NOT exercise the
# IDLE_WT_PATH check this case is for.
printf 'worktree /repo\nHEAD abc123\nbranch refs/heads/main\n\nworktree %s\nHEAD def456\nbranch refs/heads/42-x\n\n' \
  "$TMPDIR_TEST/wt/42-x" > "$STUB_DIR/worktree-list.txt"
# Registered basename 42-x has no session; office-hours-42 is attachable with a
# 2-field (name:state) fake → EMPTY cwd → null-cwd degrade.
office_hours_state_fake_claude "office-hours-42:waiting"
result=$("$TMPDIR_TEST/office-hours-select-target")
assert_eq "registered worktree + null cwd → idle via worktree path" "idle s-office-hours-42" "$result"
teardown

# OHST20 (#2443). Blocked fresh item is STILL emitted (signal, not a gate) AND
# the open-blocker advisory fires on STDERR. Mirrors OHST1's fresh-disposition
# shape: oldest labeled sessionless no-PR item → `office-hours 42 -`. The
# regression guard: the open blocker must NOT change the stdout disposition (the
# item is surfaced, not skipped); the advisory rides STDERR only.
echo "Test: blocked fresh item still surfaced (unchanged stdout) + signal fires"
setup
printf '[{"number":42,"createdAt":"2024-01-01T00:00:00Z"}]\n' > "$STUB_DIR/oh-issue-list.json"
echo '[]' > "$STUB_DIR/pr-list-full.json"
printf 'worktree /repo\nHEAD abc123\n\n' > "$STUB_DIR/worktree-list.txt"
# 42 has one OPEN blocker (#2387) — count_open_blockers sees 1, the listing names it.
printf '[{"number":2387,"state":"open"}]\n' > "$STUB_DIR/blockers-42.json"
select_target_fake_claude   # orphan world: no live sessions → fresh
result=$("$TMPDIR_TEST/office-hours-select-target" 2>"$TMPDIR_TEST/oh-stderr.txt")
assert_eq "blocked fresh item still surfaced (stdout unchanged)" "office-hours 42 -" "$result"
assert_eq "blocked item: advisory names the blocker #2387" "1" \
  "$(grep -c '#2387' "$TMPDIR_TEST/oh-stderr.txt")"
assert_eq "blocked item: advisory frames it as signal, not a gate" "1" \
  "$(grep -c 'signal, not a gate' "$TMPDIR_TEST/oh-stderr.txt")"
teardown

# OHST21 (#2443). Unblocked item emits NO blocker advisory. Same fresh shape as
# OHST20 but with no blockers-42.json (the fake serves `[]`), so count is 0 and
# emit_blocker_signal stays silent. Stdout disposition is unchanged.
echo "Test: unblocked fresh item → no blocker advisory on stderr"
setup
printf '[{"number":42,"createdAt":"2024-01-01T00:00:00Z"}]\n' > "$STUB_DIR/oh-issue-list.json"
echo '[]' > "$STUB_DIR/pr-list-full.json"
printf 'worktree /repo\nHEAD abc123\n\n' > "$STUB_DIR/worktree-list.txt"
select_target_fake_claude   # no blockers-42.json → fake returns []
result=$("$TMPDIR_TEST/office-hours-select-target" 2>"$TMPDIR_TEST/oh-stderr.txt")
assert_eq "unblocked fresh item: stdout disposition correct" "office-hours 42 -" "$result"
# Harness has no assert_not_contains; assert absence by counting matches.
assert_eq "unblocked item: no blocker advisory emitted" "0" \
  "$(grep -c 'has open blocker(s)' "$TMPDIR_TEST/oh-stderr.txt")"
teardown

# OHST22 (#2443). main-qa BLOCKED item is still surfaced (no #1648 regression):
# a main-qa-labelled, no-PR, no-worktree item takes the main-qa fresh override
# (main worktree as the 2nd field, OHST12) AND, being blocked, fires its
# STDERR signal. Open blockers never gate the main-qa override.
echo "Test: blocked main-qa item still surfaced (main override) + signal fires"
setup
printf '[{"number":42,"createdAt":"2024-01-01T00:00:00Z","labels":[{"name":"main-qa"}]}]\n' \
  > "$STUB_DIR/oh-issue-list.json"
echo '[]' > "$STUB_DIR/pr-list-full.json"
printf 'worktree /repo\nHEAD abc123\n\n' > "$STUB_DIR/worktree-list.txt"
export DISPATCH_OFFICE_HOURS_MAIN_WORKTREE="$TMPDIR_TEST/worktrees/main"
mkdir -p "$TMPDIR_TEST/worktrees/main"
printf '[{"number":2387,"state":"open"}]\n' > "$STUB_DIR/blockers-42.json"
select_target_fake_claude   # no live sessions → fresh, main-qa override
result=$("$TMPDIR_TEST/office-hours-select-target" 2>"$TMPDIR_TEST/oh-stderr.txt")
assert_eq "blocked main-qa item still surfaced (main worktree path)" \
  "office-hours 42 $TMPDIR_TEST/worktrees/main" "$result"
assert_eq "blocked main-qa item: advisory names the blocker #2387" "1" \
  "$(grep -c '#2387' "$TMPDIR_TEST/oh-stderr.txt")"
assert_eq "blocked main-qa item: framed as signal, not a gate" "1" \
  "$(grep -c 'signal, not a gate' "$TMPDIR_TEST/oh-stderr.txt")"
unset DISPATCH_OFFICE_HOURS_MAIN_WORKTREE
teardown

# OHST23 (#2443). Blocker-lookup failure is NON-FATAL: the gh-fail-blocked_by-42
# marker forces the blocked_by API to fail, so count_open_blockers comes back
# empty. The selector still exits 0 with its normal stdout disposition and emits
# the `could not determine` advisory (clear error over silent fallback).
echo "Test: blocker-lookup failure is non-fatal (normal disposition + note)"
setup
printf '[{"number":42,"createdAt":"2024-01-01T00:00:00Z"}]\n' > "$STUB_DIR/oh-issue-list.json"
echo '[]' > "$STUB_DIR/pr-list-full.json"
printf 'worktree /repo\nHEAD abc123\n\n' > "$STUB_DIR/worktree-list.txt"
# Failure injection: blocked_by lookup for #42 errors out.
touch "$STUB_DIR/gh-fail-blocked_by-42"
select_target_fake_claude
rc=0
result=$("$TMPDIR_TEST/office-hours-select-target" 2>"$TMPDIR_TEST/oh-stderr.txt") || rc=$?
assert_eq "lookup failure: selector still exits 0" "0" "$rc"
assert_eq "lookup failure: stdout disposition unchanged" "office-hours 42 -" "$result"
assert_eq "lookup failure: emits could-not-determine note" "1" \
  "$(grep -c 'could not determine open-blocker status for #42' "$TMPDIR_TEST/oh-stderr.txt")"
teardown

# OHST24 (#2538). Targeted fresh: two labeled sessionless items (42, older; 99, newer);
# invoke with N=99 → the selector picks 99, overriding oldest-first order (no-arg
# would pick 42). Criterion-required: proves single-item mode targets the specified
# item rather than the queue head.
echo "Test: targeted fresh N=99 overrides oldest-first; emits office-hours 99 -"
setup
printf '[{"number":42,"createdAt":"2024-01-01T00:00:00Z"},{"number":99,"createdAt":"2024-02-01T00:00:00Z"}]\n' \
  > "$STUB_DIR/oh-issue-list.json"
echo '[]' > "$STUB_DIR/pr-list-full.json"
printf 'worktree /repo\nHEAD abc123\n\n' > "$STUB_DIR/worktree-list.txt"
select_target_fake_claude   # orphan world: no live sessions
result=$("$TMPDIR_TEST/office-hours-select-target" 99)
assert_eq "targeted fresh N=99: emits 99 not queue head 42" "office-hours 99 -" "$result"
teardown

# OHST25 (#2538). Non-queue <N> → `empty not-in-queue <N>`: 777 is not a member of
# the office-hours queue (only 42 is). Criterion-required: the queue-membership
# precondition fires before any session query and emits the richer empty verb whose
# first token is still `empty` (so consumer bucket dispatch is unchanged) but whose
# trailing `not-in-queue 777` lets the entry script print a precise non-member
# message instead of the generic queue-empty one.
echo "Test: non-queue N=777 not in oh-issue-list → empty not-in-queue 777"
setup
printf '[{"number":42,"createdAt":"2024-01-01T00:00:00Z"}]\n' > "$STUB_DIR/oh-issue-list.json"
echo '[]' > "$STUB_DIR/pr-list-full.json"
printf 'worktree /repo\nHEAD abc123\n\n' > "$STUB_DIR/worktree-list.txt"
select_target_fake_claude
result=$("$TMPDIR_TEST/office-hours-select-target" 777)
assert_eq "non-queue N=777 → empty not-in-queue 777" "empty not-in-queue 777" "$result"
teardown

# OHST26 (#2538). Targeted idle: 42 has an idle session; invoke with N=42 →
# the single-item branch routes the attachable disposition correctly and emits
# `idle s-42-x`. (No-arg mode would also pick 42 as the oldest idle item; this
# case exercises the idle disposition path through the single-item branch, not
# targeting-override ordering — that is covered by OHST24.)
echo "Test: targeted idle N=42 → idle disposition via single-item branch"
setup
printf '[{"number":42,"createdAt":"2024-01-01T00:00:00Z"},{"number":99,"createdAt":"2024-02-01T00:00:00Z"}]\n' \
  > "$STUB_DIR/oh-issue-list.json"
echo '[]' > "$STUB_DIR/pr-list-full.json"
mkdir -p "$TMPDIR_TEST/wt/42-x"
printf 'worktree /repo\nHEAD abc123\nbranch refs/heads/main\n\nworktree /worktrees/42-x\nHEAD def456\nbranch refs/heads/42-x\n\n' \
  > "$STUB_DIR/worktree-list.txt"
office_hours_state_fake_claude "42-x:waiting:$TMPDIR_TEST/wt/42-x"
result=$("$TMPDIR_TEST/office-hours-select-target" 42)
assert_eq "targeted idle N=42 → idle s-42-x" "idle s-42-x" "$result"
teardown

# OHST27 (#2538). Targeted working item → empty: 42 has a `working` session (rc 3,
# busy). Single-item mode collapses rc-3 to empty and never reaches the parked-router
# block (acceptance criterion #3). DISPATCH_OFFICE_HOURS_MAIN_WORKTREE is set to a
# controlled path so a parked-router false-match cannot fire. (No-arg mode would also
# emit empty here for the lone working item; this exercises the rc-3 collapse through
# the single-item branch.)
echo "Test: targeted working N=42 → empty (rc-3 collapses; parked-router not reached)"
setup
printf '[{"number":42,"createdAt":"2024-01-01T00:00:00Z"}]\n' > "$STUB_DIR/oh-issue-list.json"
echo '[]' > "$STUB_DIR/pr-list-full.json"
printf 'worktree /repo\nHEAD abc123\nbranch refs/heads/main\n\nworktree /worktrees/42-x\nHEAD def456\nbranch refs/heads/42-x\n\n' \
  > "$STUB_DIR/worktree-list.txt"
export DISPATCH_OFFICE_HOURS_MAIN_WORKTREE="$TMPDIR_TEST/worktrees/main"
office_hours_state_fake_claude "42-x:working"
result=$("$TMPDIR_TEST/office-hours-select-target" 42)
assert_eq "targeted working N=42 → empty (single-item mode, no parked-router)" "empty" "$result"
unset DISPATCH_OFFICE_HOURS_MAIN_WORKTREE
teardown

# OHST28 (#2538, optional). Targeted resume: 42 is removed but recoverable (stamp
# sidecar + transcript); its worktree is on disk. Single-item rc-1 → try_emit_resume
# resolves the stamp and emits `resume`. Mirrors OHST15a exactly; worktree-list
# carries the real on-disk path so WORKTREE_PATHS_BY_NUM resolves to a real dir.
echo "Test: targeted resume N=42 — removed + recoverable + on-disk worktree → resume"
setup
printf '[{"number":42,"createdAt":"2024-01-01T00:00:00Z"}]\n' > "$STUB_DIR/oh-issue-list.json"
echo '[]' > "$STUB_DIR/pr-list-full.json"
mkdir -p "$TMPDIR_TEST/wt/42-x"
printf 'worktree /repo\nHEAD abc123\nbranch refs/heads/main\n\nworktree %s\nHEAD def456\nbranch refs/heads/42-x\n\n' \
  "$TMPDIR_TEST/wt/42-x" > "$STUB_DIR/worktree-list.txt"
office_hours_state_fake_claude   # empty registry → removed
export DISPATCH_STAMP_PROJECTS_ROOT="$TMPDIR_TEST/projects"
mkdir -p "$DISPATCH_STAMP_PROJECTS_ROOT/proj-42"
printf '%s\n' '{"schema":1,"session_id":"rec-sess-42","repo":"natb1/commons.systems","issue":42,"pr":null,"branch":"42-x","base_sha":"deadbeef","stamped_at":"2026-06-01T10:00:00Z"}' \
  > "$DISPATCH_STAMP_PROJECTS_ROOT/proj-42/rec-sess-42.dispatch-stamp.json"
touch "$DISPATCH_STAMP_PROJECTS_ROOT/proj-42/rec-sess-42.jsonl"
result=$("$TMPDIR_TEST/office-hours-select-target" 42)
assert_eq "targeted resume N=42: removed + on-disk worktree + transcript → resume in place" "resume 42 rec-sess-42 $TMPDIR_TEST/wt/42-x" "$result"
unset DISPATCH_STAMP_PROJECTS_ROOT
teardown

# OHST29 (#2538, criterion #4). Blocker advisory on targeted fresh item: 42 has an
# open blocker (#2387). Single-item mode still surfaces 42 (stdout unchanged) and
# emits the blocker advisory on stderr. Mirrors OHST20 on the single-item path.
echo "Test: targeted fresh N=42 with open blocker → surfaced (stdout) + advisory (stderr)"
setup
printf '[{"number":42,"createdAt":"2024-01-01T00:00:00Z"}]\n' > "$STUB_DIR/oh-issue-list.json"
echo '[]' > "$STUB_DIR/pr-list-full.json"
printf 'worktree /repo\nHEAD abc123\n\n' > "$STUB_DIR/worktree-list.txt"
printf '[{"number":2387,"state":"open"}]\n' > "$STUB_DIR/blockers-42.json"
select_target_fake_claude
result=$("$TMPDIR_TEST/office-hours-select-target" 42 2>"$TMPDIR_TEST/oh-stderr.txt")
assert_eq "targeted blocked N=42: stdout disposition unchanged" "office-hours 42 -" "$result"
assert_eq "targeted blocked N=42: advisory names #2387" "1" \
  "$(grep -c '#2387' "$TMPDIR_TEST/oh-stderr.txt")"
assert_eq "targeted blocked N=42: advisory frames as signal, not a gate" "1" \
  "$(grep -c 'signal, not a gate' "$TMPDIR_TEST/oh-stderr.txt")"
teardown

# <<< END MOVED <<<

report_results
