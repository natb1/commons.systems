#!/usr/bin/env bash
# Tests for assert-worktree-fresh -- moved verbatim from test-dispatch-scripts.sh
# (tactic-dispatch-test-monolith-split). Original section: 29663-29732.
set -euo pipefail

FIXTURE_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=dispatch-test-fixture.sh
source "$FIXTURE_DIR/dispatch-test-fixture.sh"

# >>> MOVED FROM test-dispatch-scripts.sh >>>
# ============================================================================
# Test: assert-worktree-fresh — non-skippable pre-analysis freshness guard
# (tactic-align-skills-latest-graph-guard Unit 2)
# ============================================================================
# assert-worktree-fresh derives its script location via SCRIPT_DIR and sources
# lib.sh from there, so the fixture copies the script under test PHYSICALLY
# (not a symlink) alongside lib.sh, mirroring the graph-select-target fixture
# above. No network is used: `origin` is a local bare repo reached by file
# path, and staleness is simulated by advancing the bare repo's main branch
# from a second local clone.
echo "Test: assert-worktree-fresh — fresh worktree (HEAD == origin/main) exits 0"
AWF_ROOT=$(mktemp -d)
AWF_BARE=$(mktemp -d)
AWF_CLONE=$(mktemp -d)
AWF_SCRIPTS="$AWF_ROOT/.claude/skills/dispatch-propagate/scripts"
mkdir -p "$AWF_SCRIPTS"
cp "$SCRIPT_DIR"/assert-worktree-fresh "$SCRIPT_DIR"/lib.sh "$AWF_SCRIPTS/"
AWF_SCRIPT="$AWF_SCRIPTS/assert-worktree-fresh"

# Bare "origin" remote, reached only via local file path — no network.
git init -q --bare -b main "$AWF_BARE"

# The worktree under test.
git init -q -b main "$AWF_ROOT"
git -C "$AWF_ROOT" config user.email t@t
git -C "$AWF_ROOT" config user.name t
echo 'seed' > "$AWF_ROOT/seed.txt"
git -C "$AWF_ROOT" add -A
git -C "$AWF_ROOT" commit -q -m seed
git -C "$AWF_ROOT" remote add origin "$AWF_BARE"
git -C "$AWF_ROOT" push -q origin main
git -C "$AWF_ROOT" fetch -q origin main

awf_out=$("$AWF_SCRIPT" "$AWF_ROOT" 2>/dev/null) && awf_rc=0 || awf_rc=$?
assert_eq "assert-worktree-fresh: fresh worktree exits 0" "0" "$awf_rc"

echo "Test: assert-worktree-fresh — stale worktree (HEAD behind origin/main) exits 1 with message"
# A second local clone pushes one more commit to the bare origin, advancing
# main ahead of AWF_ROOT's HEAD without AWF_ROOT's tree ever changing.
git clone -q "$AWF_BARE" "$AWF_CLONE"
git -C "$AWF_CLONE" config user.email t@t
git -C "$AWF_CLONE" config user.name t
echo 'advance' > "$AWF_CLONE/advance.txt"
git -C "$AWF_CLONE" add -A
git -C "$AWF_CLONE" commit -q -m advance
git -C "$AWF_CLONE" push -q origin main

awf_stale_out=$("$AWF_SCRIPT" "$AWF_ROOT" 2>&1) && awf_stale_rc=0 || awf_stale_rc=$?
assert_eq "assert-worktree-fresh: stale worktree exits 1" "1" "$awf_stale_rc"
case "$awf_stale_out" in
  *"1 commit(s) behind"*) awf_msg_match="yes" ;;
  *) awf_msg_match="no" ;;
esac
assert_eq "assert-worktree-fresh: stale worktree message names the behind-count" "yes" "$awf_msg_match"

echo "Test: assert-worktree-fresh — unreachable origin (fetch fails) exits 1"
AWF_OFFLINE=$(mktemp -d)
git init -q -b main "$AWF_OFFLINE"
git -C "$AWF_OFFLINE" config user.email t@t
git -C "$AWF_OFFLINE" config user.name t
echo 'seed' > "$AWF_OFFLINE/seed.txt"
git -C "$AWF_OFFLINE" add -A
git -C "$AWF_OFFLINE" commit -q -m seed
git -C "$AWF_OFFLINE" remote add origin /nonexistent/path/that/does/not/exist.git

awf_offline_out=$("$AWF_SCRIPT" "$AWF_OFFLINE" 2>/dev/null) && awf_offline_rc=0 || awf_offline_rc=$?
assert_eq "assert-worktree-fresh: unreachable origin exits 1" "1" "$awf_offline_rc"

rm -rf "$AWF_ROOT" "$AWF_BARE" "$AWF_CLONE" "$AWF_OFFLINE"

# <<< END MOVED <<<

report_results
