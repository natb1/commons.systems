#!/usr/bin/env bash
# Tests for assert-node-fresh — the per-node, pre-write freshness guard
# (tactic-node-body-stale-in-worker-worktree Unit 1).
set -euo pipefail

FIXTURE_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=dispatch-test-fixture.sh
source "$FIXTURE_DIR/dispatch-test-fixture.sh"

# ============================================================================
# Fixture shape, copied from test-assert-worktree-fresh.sh:15-64.
#
# assert-node-fresh derives its script location via SCRIPT_DIR and sources
# lib.sh from there, so the fixture copies the script under test PHYSICALLY
# (not a symlink) alongside lib.sh. No network is used: `origin` is a local
# bare repo reached by file path, and a moved node is simulated by pushing an
# edit from a SECOND local clone, which advances origin/main without the
# worktree under test ever changing.
# ============================================================================

ANF_ROOT=$(mktemp -d)
ANF_BARE=$(mktemp -d)
ANF_CLONE=$(mktemp -d)
ANF_OFFLINE=$(mktemp -d)
ANF_SCRIPTS="$ANF_ROOT/.claude/skills/dispatch-propagate/scripts"
mkdir -p "$ANF_SCRIPTS"
cp "$SCRIPT_DIR"/assert-node-fresh "$SCRIPT_DIR"/lib.sh "$ANF_SCRIPTS/"
chmod +x "$ANF_SCRIPTS/assert-node-fresh"
ANF_SCRIPT="$ANF_SCRIPTS/assert-node-fresh"

# Bare "origin" remote, reached only via local file path — no network.
git init -q --bare -b main "$ANF_BARE"

# The worktree under test, carrying two intention nodes.
git init -q -b main "$ANF_ROOT"
git -C "$ANF_ROOT" config user.email t@t
git -C "$ANF_ROOT" config user.name t
mkdir -p "$ANF_ROOT/intentions"
printf 'body-alpha\n' > "$ANF_ROOT/intentions/tactic-alpha.md"
printf 'body-beta\n'  > "$ANF_ROOT/intentions/tactic-beta.md"
git -C "$ANF_ROOT" add -A
git -C "$ANF_ROOT" commit -q -m seed
git -C "$ANF_ROOT" remote add origin "$ANF_BARE"
git -C "$ANF_ROOT" push -q origin main
git -C "$ANF_ROOT" fetch -q origin main

# The base manifest, captured at "read" time — <id>=<blobsha>, one per line,
# the same format dump-node.ts writes.
ANF_MANIFEST="$ANF_ROOT/base-manifest.txt"
ALPHA_BASE=$(git -C "$ANF_ROOT" rev-parse HEAD:intentions/tactic-alpha.md)
BETA_BASE=$(git -C "$ANF_ROOT" rev-parse HEAD:intentions/tactic-beta.md)
{
  echo "tactic-alpha=$ALPHA_BASE"
  echo "tactic-beta=$BETA_BASE"
} > "$ANF_MANIFEST"

# --- 1. fresh ---------------------------------------------------------------
echo "Test: assert-node-fresh — recorded base equals origin's blob exits 0"
anf_out=$(cd "$ANF_ROOT" && "$ANF_SCRIPT" --base "$ANF_MANIFEST" tactic-alpha 2>/dev/null) \
  && anf_rc=0 || anf_rc=$?
assert_eq "assert-node-fresh: fresh node exits 0" "0" "$anf_rc"

# --- 3. on-disk edited, origin unmoved --------------------------------------
# The semantics guard for the "never hash the on-disk file" rule: by the time
# this runs in production, write-node.ts has already rewritten the frontmatter,
# so an on-disk hash would refuse every round.
echo "Test: assert-node-fresh — on-disk edit with origin unmoved still exits 0"
printf 'body-alpha REWRITTEN BY write-node.ts\n' > "$ANF_ROOT/intentions/tactic-alpha.md"
anf_disk_out=$(cd "$ANF_ROOT" && "$ANF_SCRIPT" --base "$ANF_MANIFEST" tactic-alpha 2>/dev/null) \
  && anf_disk_rc=0 || anf_disk_rc=$?
assert_eq "assert-node-fresh: on-disk edit does not trip the guard" "0" "$anf_disk_rc"

# --- 4. created this round --------------------------------------------------
echo "Test: assert-node-fresh — node created this round (no manifest entry, absent on origin) exits 0"
anf_new_out=$(cd "$ANF_ROOT" && "$ANF_SCRIPT" --base "$ANF_MANIFEST" tactic-brand-new 2>/dev/null) \
  && anf_new_rc=0 || anf_new_rc=$?
assert_eq "assert-node-fresh: created-this-round node exits 0" "0" "$anf_new_rc"

# --- 5. unguarded pre-existing ----------------------------------------------
echo "Test: assert-node-fresh — pre-existing node absent from the manifest exits 1"
ANF_ONLY_ALPHA="$ANF_ROOT/base-alpha-only.txt"
echo "tactic-alpha=$ALPHA_BASE" > "$ANF_ONLY_ALPHA"
anf_unguarded_out=$(cd "$ANF_ROOT" && "$ANF_SCRIPT" --base "$ANF_ONLY_ALPHA" tactic-beta 2>&1) \
  && anf_unguarded_rc=0 || anf_unguarded_rc=$?
assert_eq "assert-node-fresh: unguarded pre-existing node exits 1" "1" "$anf_unguarded_rc"
case "$anf_unguarded_out" in
  *"no --base entry"*) anf_unguarded_match="yes" ;;
  *) anf_unguarded_match="no" ;;
esac
assert_eq "assert-node-fresh: unguarded message names the missing --base entry" \
  "yes" "$anf_unguarded_match"

# --- 2. moved ---------------------------------------------------------------
echo "Test: assert-node-fresh — node moved on origin/main exits 1 naming the intervening commit"
# A second local clone rewrites the node and pushes, advancing origin/main
# without ANF_ROOT's tree ever changing.
git clone -q "$ANF_BARE" "$ANF_CLONE"
git -C "$ANF_CLONE" config user.email t@t
git -C "$ANF_CLONE" config user.name t
printf 'body-alpha CORRECTED SCOPE\n' > "$ANF_CLONE/intentions/tactic-alpha.md"
git -C "$ANF_CLONE" add -A
git -C "$ANF_CLONE" commit -q -m 'correct alpha scope'
git -C "$ANF_CLONE" push -q origin main
ANF_MOVED_SHA=$(git -C "$ANF_CLONE" rev-parse --short HEAD)

anf_moved_out=$(cd "$ANF_ROOT" && "$ANF_SCRIPT" --base "$ANF_MANIFEST" tactic-alpha 2>&1) \
  && anf_moved_rc=0 || anf_moved_rc=$?
assert_eq "assert-node-fresh: moved node exits 1" "1" "$anf_moved_rc"
case "$anf_moved_out" in
  *"$ANF_MOVED_SHA"*) anf_moved_match="yes" ;;
  *) anf_moved_match="no" ;;
esac
assert_eq "assert-node-fresh: moved message names the intervening commit's short sha" \
  "yes" "$anf_moved_match"

# --- 8. multi-id ------------------------------------------------------------
echo "Test: assert-node-fresh — two ids, one moved and one fresh, exits 1 naming the moved id"
anf_multi_out=$(cd "$ANF_ROOT" && "$ANF_SCRIPT" --base "$ANF_MANIFEST" tactic-alpha tactic-beta 2>&1) \
  && anf_multi_rc=0 || anf_multi_rc=$?
assert_eq "assert-node-fresh: multi-id with one moved exits 1" "1" "$anf_multi_rc"
case "$anf_multi_out" in
  *"'tactic-alpha' MOVED"*) anf_multi_match="yes" ;;
  *) anf_multi_match="no" ;;
esac
assert_eq "assert-node-fresh: multi-id message names the moved id" "yes" "$anf_multi_match"
case "$anf_multi_out" in
  *"tactic-beta"*) anf_multi_clean="named" ;;
  *) anf_multi_clean="not-named" ;;
esac
assert_eq "assert-node-fresh: multi-id message does not flag the fresh id" \
  "not-named" "$anf_multi_clean"

# --- 6. unreachable origin --------------------------------------------------
echo "Test: assert-node-fresh — unreachable origin (fetch fails) exits 1"
git init -q -b main "$ANF_OFFLINE"
git -C "$ANF_OFFLINE" config user.email t@t
git -C "$ANF_OFFLINE" config user.name t
mkdir -p "$ANF_OFFLINE/intentions"
printf 'body-alpha\n' > "$ANF_OFFLINE/intentions/tactic-alpha.md"
git -C "$ANF_OFFLINE" add -A
git -C "$ANF_OFFLINE" commit -q -m seed
git -C "$ANF_OFFLINE" remote add origin /nonexistent/path/that/does/not/exist.git

anf_offline_out=$(cd "$ANF_OFFLINE" && "$ANF_SCRIPT" --base "$ANF_MANIFEST" tactic-alpha 2>/dev/null) \
  && anf_offline_rc=0 || anf_offline_rc=$?
assert_eq "assert-node-fresh: unreachable origin exits 1" "1" "$anf_offline_rc"

# --- 7. usage errors --------------------------------------------------------
echo "Test: assert-node-fresh — usage errors exit 2"
anf_noids_out=$(cd "$ANF_ROOT" && "$ANF_SCRIPT" --base "$ANF_MANIFEST" 2>/dev/null) \
  && anf_noids_rc=0 || anf_noids_rc=$?
assert_eq "assert-node-fresh: no node ids exits 2" "2" "$anf_noids_rc"

anf_flag_out=$(cd "$ANF_ROOT" && "$ANF_SCRIPT" --base "$ANF_MANIFEST" --bogus 2>/dev/null) \
  && anf_flag_rc=0 || anf_flag_rc=$?
assert_eq "assert-node-fresh: flag-shaped positional exits 2" "2" "$anf_flag_rc"

anf_nobase_out=$(cd "$ANF_ROOT" && "$ANF_SCRIPT" tactic-alpha 2>/dev/null) \
  && anf_nobase_rc=0 || anf_nobase_rc=$?
assert_eq "assert-node-fresh: missing --base exits 2" "2" "$anf_nobase_rc"

anf_badpair_out=$(cd "$ANF_ROOT" && "$ANF_SCRIPT" --base 'no-equals-sign' tactic-alpha 2>/dev/null) \
  && anf_badpair_rc=0 || anf_badpair_rc=$?
assert_eq "assert-node-fresh: malformed <id>=<blobsha> pair exits 2" "2" "$anf_badpair_rc"

rm -rf "$ANF_ROOT" "$ANF_BARE" "$ANF_CLONE" "$ANF_OFFLINE"

report_results
