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

# <<< END MOVED <<<

report_results
