#!/usr/bin/env bash
#
# test-graph-write-rollback.sh — functional harness for the write-failure
# rollback added to transition-node, dispatch-graph-census, and
# dispatch-graph-main-red-sync (tactic-graph-write-failure-rollback Units
# 2/4/5). Each case forces a downstream `graph-commit` to fail AFTER the
# script's own mutation already landed on disk, then asserts the mutation was
# rolled back — a clean intentions/ tree, never a leaked dirty/deleted file
# that would trip graph-commit's assert_clean_outside_ids guard for every
# other unrelated node.
#
# Mirrors packages/intentionsutil/scripts/test-park-node.sh's harness shape: a
# throwaway bare origin + a real git clone, with the REAL
# packages/intentionsutil/src copied in (plus its package.json for ESM
# resolution) and a node_modules SYMLINK to this repo's own — so the real
# TypeScript mutation primitives (apply-node-transition.ts, compute-freshness.ts,
# dump-node.ts, write-node.ts, graph-census-debt.ts) execute for real, not via a
# shim. Only graph-commit itself and (for the main-red-sync case) repo-health
# are stubbed, standing in for a real land failure / a green main.
#
# Covers:
#   1. transition-node: a graph-commit failure after apply-node-transition.ts's
#      real write rolls intentions/<id>.md back to origin/main (byte-identical
#      `git diff` against the clone's HEAD).
#   2. dispatch-graph-census, born-fresh case: a graph-commit failure after a
#      brand-new census node's write-node.ts write DELETES the file (no prior
#      blob to restore to) rather than leaving it dirty.
#   3. dispatch-graph-main-red-sync: a completion failure (a) emits a non-empty
#      stderr diagnostic naming the node (regression guard for the old
#      `... ) 1>&2 || true` total swallow) and (b) leaves the working tree
#      clean (`git status --porcelain intentions/` empty) afterward.
#   4. dispatch-graph-main-red-sync origin-absent refusal: a node enumerated
#      into OPEN_MAIN_RED whose origin/main:intentions/<id>.md blob cannot be
#      rev-parsed (no landed content to roll back to) is SKIPPED without any
#      mutation — a stderr diagnostic names it, the tree stays clean — while the
#      per-node `while read` loop still processes the other open node.
#   5. transition-node stamps the LANDED body, not the post-reset worktree copy
#      (tactic-transition-node-stamp-landed-body): a `## needs-main residue`
#      section is landed on origin/main out-of-band while the PR branch stays
#      residue-free, a graph-commit stand-in performs the real reset-to-main /
#      land / reset-back dance, and the freshness computation
#      dispatch-graph-scope-sweep runs afterward reports scopeStale=false. This
#      is the ONE case whose graph-commit stub SUCCEEDS.
#   6. reconcile-graph-merged pins exactly one `--base <id>=<blob>` per planned
#      edit id, and pins the ON-DISK blob rather than origin/main's (bug X,
#      tactic-reconcile-park-clobber Unit 1).
#   7. The race itself: an office_hours park landed between the sweep's read and
#      its commit SURVIVES, while the sweep's own phase→done and merge evidence
#      still land. This case runs the REAL graph-commit (only `gh` is stubbed) —
#      its check_base_freshness three-way merge is the machinery under test.
#   8. The graph-commit park path — which Unit 1 makes reachable from this
#      script for the first time — rolls back to HEAD, leaving a clean tree and
#      preserving the park rather than restoring stale park-erased bytes
#      (Unit 2).
#   9. The graph-commit BUSY-MAIN path (rc 11): commit_files() ran, land() did
#      not, so HEAD carries an un-landed content commit. `git checkout --`
#      against that HEAD would restore the MUTATED bytes and report a rollback
#      that never happened, stranding a commit the next graph-commit from this
#      shared checkout would push. The un-landed commit must be discarded (HEAD
#      back where the sweep found it) and the false claim must not be emitted.
#      9a: that discard is scoped to the paths its safety gate proved — an
#      unrelated modified tracked file (flake.lock) elsewhere in the checkout
#      survives it intact, where the old whole-tree `reset --hard` destroyed it.
#      9b: the ZERO-WRITE path — an empty apply plan must DISARM the
#      rollback before its early exit, or the EXIT trap classifies a
#      CONCURRENT writer's unpushed commit as this sweep's stranded write
#      and discards it. The empty plan is routine, not exceptional: a
#      record-time `main-qa` mint is enumerated on every sweep and then
#      refused by isMergeAbsorbable.
#   10. `reconcile-graph-review-stall --node <id>` (tactic-dispatch-ladder-skill
#       Unit 6b): the same selection filter as case 6b, mirrored onto this
#       sweep's sibling. --node narrows to the named node and leaves an
#       otherwise-equally-eligible sibling untouched; an unknown id acts on
#       nothing; the unflagged sweep still acts on every eligible candidate.
#   11. graph-select-target's interrupt gates roll their on-disk write back when
#       the land fails — the writer that ACTUALLY leaked in production
#       (tactic-eval-finding-reconcile-base-revert-blocks-main-graph-writes).
#       11b re-runs the same fixture with the rollback neutered and asserts it
#       DOES leak, so 11 cannot pass vacuously.
#
# Cases 1, 3, 4, 8, 9, 10 and 11 all exercise the ONE shared rollback primitive,
# lib-graph-rollback.sh's graph_rollback_node_writes — extracted from
# reconcile-graph-merged, where it was correct, precisely because its siblings
# had re-derived it and drifted.
#
# Cases 6 and 7 are both verified to go RED when Unit 1's `--base` threading is
# reverted. Case 7 needed care to avoid being vacuous: if the checkout is left
# BEHIND origin/main, graph-commit's push is rejected, it rebases, git reports a
# textual conflict, and layer-2's field-level auto-merge preserves the park all
# on its own — passing with or without the fix. The fixture therefore
# fast-forwards HEAD onto the park commit (see the wrapper in case 7), which is
# the shape production erasures actually took: no conflict to rescue, so --base
# is the only thing that can catch the lost update.
#
# No network needed; requires bash + git + jq + a real node/npx tsx (resolved
# against a read-only node_modules symlink to this repo's own — never written).
set -uo pipefail

HARNESS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REAL_REPO_ROOT="$(cd "$HARNESS_DIR/../../../.." && pwd)"
UTIL_SCRIPTS_SRC="$REAL_REPO_ROOT/packages/intentionsutil/scripts"
INTENTIONSUTIL_SRC="$REAL_REPO_ROOT/packages/intentionsutil/src"

for f in transition-node dispatch-graph-census dispatch-graph-main-red-sync lib.sh lib-graph-rollback.sh lib-graph-base-pin.sh lib-graph-worktree.sh dispatch-config-load; do
  [[ -f "$HARNESS_DIR/$f" ]] || { echo "error: $f not found at $HARNESS_DIR/$f" >&2; exit 1; }
done
command -v jq >/dev/null || { echo "error: jq not found" >&2; exit 1; }

WORK="$(mktemp -d)" || { echo "error: mktemp failed" >&2; exit 1; }
trap 'rm -rf "$WORK"' EXIT

PASS=0; FAIL=0
ok() { echo "PASS: $1"; PASS=$((PASS + 1)); }
no() { echo "FAIL: $1"; FAIL=$((FAIL + 1)); }

# new_origin <name> — a fresh bare origin (one per case: each case seeds an
# independent world-state, so a shared origin would reject the second case's
# push as a non-fast-forward of the first case's unrelated history). Sets the
# global ORIGIN var the helpers below read.
ORIGIN=""
new_origin() {
  ORIGIN="$WORK/$1-origin.git"
  git init -q --bare "$ORIGIN"
  git -C "$ORIGIN" symbolic-ref HEAD refs/heads/main
}

# build_seed_repo <dst-dir> — a bare-bones real-execution repo tree: the real
# packages/intentionsutil/src + package.json (for ESM "type": "module"
# resolution), the graph scripts under test, their sourced/invoked real TS
# primitives, and a node_modules symlink (read-only, never written).
build_seed_repo() {
  local dst="$1"
  mkdir -p "$dst/intentions" \
           "$dst/packages/intentionsutil/scripts" \
           "$dst/packages/intentionsutil/src" \
           "$dst/.claude/skills/dispatch-propagate/scripts"
  cp -r "$INTENTIONSUTIL_SRC/." "$dst/packages/intentionsutil/src/"
  cp "$REAL_REPO_ROOT/packages/intentionsutil/package.json" "$dst/packages/intentionsutil/package.json"
  cp "$UTIL_SCRIPTS_SRC/graph-commit" "$dst/packages/intentionsutil/scripts/graph-commit"
  cp "$UTIL_SCRIPTS_SRC/apply-node-transition.ts" "$dst/packages/intentionsutil/scripts/apply-node-transition.ts"
  cp "$UTIL_SCRIPTS_SRC/compute-freshness.ts" "$dst/packages/intentionsutil/scripts/compute-freshness.ts"
  cp "$UTIL_SCRIPTS_SRC/dump-node.ts" "$dst/packages/intentionsutil/scripts/dump-node.ts"
  cp "$UTIL_SCRIPTS_SRC/write-node.ts" "$dst/packages/intentionsutil/scripts/write-node.ts"
  cp "$UTIL_SCRIPTS_SRC/graph-census-debt.ts" "$dst/packages/intentionsutil/scripts/graph-census-debt.ts"
  cp "$UTIL_SCRIPTS_SRC/restamp-scope-fingerprint.ts" "$dst/packages/intentionsutil/scripts/restamp-scope-fingerprint.ts"
  # reconcile-graph.ts is the real decision+write primitive behind
  # reconcile-graph-merged (cases 6-8); merge-node.ts is the layer-2/3 field
  # merge CLI the REAL graph-commit shells out to via `npx tsx` when a --base
  # pin is stale (case 7's whole point).
  cp "$UTIL_SCRIPTS_SRC/reconcile-graph.ts" "$dst/packages/intentionsutil/scripts/reconcile-graph.ts"
  cp "$UTIL_SCRIPTS_SRC/merge-node.ts" "$dst/packages/intentionsutil/scripts/merge-node.ts"
  # apply-fix-state.ts is the store-mutation primitive behind
  # reconcile-graph-review-stall's `fix` route (cases 10a-10c).
  cp "$UTIL_SCRIPTS_SRC/apply-fix-state.ts" "$dst/packages/intentionsutil/scripts/apply-fix-state.ts"
  chmod +x "$dst/packages/intentionsutil/scripts/graph-commit"
  cp "$HARNESS_DIR/lib.sh" "$dst/.claude/skills/dispatch-propagate/scripts/lib.sh"
  # The shared rollback primitive every graph writer under test sources.
  cp "$HARNESS_DIR/lib-graph-rollback.sh" "$dst/.claude/skills/dispatch-propagate/scripts/lib-graph-rollback.sh"
  # The shared diagnosis-time compare-and-swap pin, likewise sourced by both
  # reconcile sweeps — without this every seeded case that runs one dies at
  # `source`.
  cp "$HARNESS_DIR/lib-graph-base-pin.sh" "$dst/.claude/skills/dispatch-propagate/scripts/lib-graph-base-pin.sh"
  # resolve_main_worktree — sourced by reconcile-graph-review-stall since the
  # CI-pending liveness bound, to resolve the strike sidecar's root. Without it
  # the `source` fails and writes to stderr, which case 10b (which asserts the
  # sweep is completely silent on an unknown --node id) reads as output.
  cp "$HARNESS_DIR/lib-graph-worktree.sh" "$dst/.claude/skills/dispatch-propagate/scripts/lib-graph-worktree.sh"
  cp "$HARNESS_DIR/dispatch-config-load" "$dst/.claude/skills/dispatch-propagate/scripts/dispatch-config-load"
  chmod +x "$dst/.claude/skills/dispatch-propagate/scripts/dispatch-config-load"
}

# init_and_push <dir> — git-init a seeded tree, commit, push to ORIGIN main.
init_and_push() {
  local dir="$1"
  git -C "$dir" init -q -b main
  git -C "$dir" config user.email harness@test
  git -C "$dir" config user.name harness
  git -C "$dir" remote add origin "$ORIGIN"
  git -C "$dir" add -A
  git -C "$dir" commit -qm seed
  git -C "$dir" push -q origin main
}

# clone_with_node_modules <dst> — clone ORIGIN and symlink in a real
# node_modules (read-only, untracked — never committed, so graph-commit's
# assert_clean_outside_ids '??' exemption covers it).
clone_with_node_modules() {
  local dst="$1"
  git clone -q "$ORIGIN" "$dst"
  git -C "$dst" config user.email harness@test
  git -C "$dst" config user.name harness
  ln -s "$REAL_REPO_ROOT/node_modules" "$dst/node_modules"
}

fail_graph_commit() { # <dir> — replace graph-commit with an unconditional failure.
  cat >"$1/packages/intentionsutil/scripts/graph-commit" <<'SH'
#!/usr/bin/env bash
echo "graph-commit wrapper: simulated post-mutation failure" >&2
exit 1
SH
  chmod +x "$1/packages/intentionsutil/scripts/graph-commit"
}

# landing_graph_commit <dir> — a FAITHFUL graph-commit stand-in (the sibling of
# fail_graph_commit above: same install point, opposite outcome — this one
# SUCCEEDS).
#
# The real graph-commit cannot run in this harness: it pushes a scratch branch
# to GitHub and then blocks polling for the CI check stamping that gates its
# land, so it never terminates offline. What this stub reproduces is exactly the
# part transition-node's stamp refresh depends on — the "reset dance" of
# graph-commit's ensure_intentions_only_base() + cleanup() EXIT trap:
#
#   3. git fetch origin main; git reset --hard FETCH_HEAD   (move to main's tip,
#      discarding the PR-branch state — ensure_intentions_only_base)
#   4. restore the edited node file on top, commit, push to main  (the land)
#   5. git reset --hard "$ORIG_HEAD"                        (cleanup()'s restore
#      of the PR-branch tip)
#
# Step 5 deliberately does NOT re-fetch — matching the real cleanup() — so the
# local intentions/<id>.md ends up back at the PRE-land branch copy while
# origin/main carries the landed edit, and the only correct content source for
# the stamp is the (already-updated-by-the-push) origin/main tracking ref.
landing_graph_commit() { # <dir> — replace graph-commit with the reset-dance stand-in.
  cat >"$1/packages/intentionsutil/scripts/graph-commit" <<'SH'
#!/usr/bin/env bash
# Stub: accepts transition-node's `-C <dir> -m <msg> <id>` invocation shape.
set -uo pipefail
dir=""; id=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    -C) dir="${2:-}"; shift 2 ;;
    -m) shift 2 ;;
    *)  id="$1"; shift ;;
  esac
done
[[ -n "$dir" && -n "$id" ]] || { echo "graph-commit stub: expected -C <dir> -m <msg> <id>" >&2; exit 2; }
cd "$dir" || exit 2

ORIG_HEAD="$(git rev-parse HEAD)" || exit 2
staged="$(mktemp)" || exit 2
cp "intentions/$id.md" "$staged" || exit 2

# ensure_intentions_only_base(): rebase the write onto origin/main's tip.
git fetch -q origin main || exit 1
git reset -q --hard FETCH_HEAD || exit 1

# The land: the edited node content actually reaches origin/main.
cp "$staged" "intentions/$id.md" || exit 1
rm -f "$staged"
git add "intentions/$id.md" || exit 1
git commit -qm "graph: stub land $id" || exit 1
git push -q origin HEAD:main || exit 1

# cleanup() EXIT trap: restore the pre-land PR-branch tip (no re-fetch).
git reset -q --hard "$ORIG_HEAD" || exit 1
exit 0
SH
  chmod +x "$1/packages/intentionsutil/scripts/graph-commit"
}

# ===========================================================================
# Case 1: transition-node byte-identical restore-on-failure
# (tactic-graph-write-failure-rollback Unit 2).
# ===========================================================================
T1="$WORK/t1-seed"
build_seed_repo "$T1"
cp "$HARNESS_DIR/transition-node" "$T1/.claude/skills/dispatch-propagate/scripts/transition-node"
chmod +x "$T1/.claude/skills/dispatch-propagate/scripts/transition-node"
cat >"$T1/intentions/t-transition.md" <<'NODE'
---
id: t-transition
kind: tactic
statement: harness node for transition-node rollback test
owner: ai
status: codified
phase: implement
serves: []
execution: null
---
# harness node for transition-node rollback test
NODE
new_origin t1
init_and_push "$T1"

C1="$WORK/t1-clone"
clone_with_node_modules "$C1"
fail_graph_commit "$C1"

out="$(
  cd "$C1" || exit 99
  bash .claude/skills/dispatch-propagate/scripts/transition-node t-transition 2>&1
)"; rc=$?
diff_after="$(git -C "$C1" diff -- intentions/t-transition.md)"
if [[ $rc -ne 0 ]] && [[ -z "$diff_after" ]]; then
  ok "transition-node byte-identical restore: real apply-node-transition.ts mutation is rolled back on graph-commit failure (git diff empty)"
else
  no "transition-node byte-identical restore (rc=$rc)"
  printf '%s\n' "$out"; printf 'diff: %s\n' "$diff_after"
fi

# ===========================================================================
# Case 2: dispatch-graph-census born-fresh delete-on-failure
# (tactic-graph-write-failure-rollback Unit 4).
# ===========================================================================
T2="$WORK/t2-seed"
build_seed_repo "$T2"
cp "$HARNESS_DIR/dispatch-graph-census" "$T2/.claude/skills/dispatch-propagate/scripts/dispatch-graph-census"
chmod +x "$T2/.claude/skills/dispatch-propagate/scripts/dispatch-graph-census"
# A single done-but-present node is enough owed-prune debt to cross a
# threshold of 1 (graph-census-debt.ts: total = |donePresent ∪ orphans ∪
# mergedUnabsorbed|).
cat >"$T2/intentions/t-done.md" <<'NODE'
---
id: t-done
kind: tactic
statement: a done-but-present node contributing owed-prune debt
owner: ai
status: codified
phase: done
serves: []
---
# a done-but-present node contributing owed-prune debt
NODE
new_origin t2
init_and_push "$T2"

C2="$WORK/t2-clone"
clone_with_node_modules "$C2"
fail_graph_commit "$C2"
CENSUS_CFG_DIR="$WORK/t2-config"
mkdir -p "$CENSUS_CFG_DIR"
echo '{"threshold": 1}' >"$CENSUS_CFG_DIR/census.json"

out="$(
  cd "$C2" || exit 99
  export DISPATCH_CONFIG_DIR="$CENSUS_CFG_DIR"
  bash .claude/skills/dispatch-propagate/scripts/dispatch-graph-census 2>&1
)"; rc=$?
CENSUS_ID="tactic-graph-census-$(date -u +%Y-%m-%d)"
status_after="$(git -C "$C2" status --porcelain intentions/)"
if [[ $rc -ne 0 ]] \
   && grep -q "born-node write was rolled back (file deleted)" <<<"$out" \
   && [[ ! -e "$C2/intentions/$CENSUS_ID.md" ]] \
   && [[ -z "$status_after" ]]; then
  ok "dispatch-graph-census born-fresh delete-on-failure: the newly-written census file is deleted, tree clean"
else
  no "dispatch-graph-census born-fresh delete-on-failure (rc=$rc, id=$CENSUS_ID)"
  printf '%s\n' "$out"; printf 'status: %s\n' "$status_after"
fi

# ===========================================================================
# Case 3: dispatch-graph-main-red-sync surfaces the failure + leaves a clean
# tree (tactic-graph-write-failure-rollback Unit 5). repo-health is stubbed to
# report main GREEN (empty stdout) so the recovery-completion loop runs; the
# real dump-node.ts/write-node.ts perform the mutation, then the failing
# graph-commit wrapper forces the rollback path.
# ===========================================================================
T3="$WORK/t3-seed"
build_seed_repo "$T3"
cp "$HARNESS_DIR/dispatch-graph-main-red-sync" "$T3/.claude/skills/dispatch-propagate/scripts/dispatch-graph-main-red-sync"
chmod +x "$T3/.claude/skills/dispatch-propagate/scripts/dispatch-graph-main-red-sync"
cat >"$T3/.claude/skills/dispatch-propagate/scripts/repo-health" <<'SH'
#!/usr/bin/env bash
# Stub: always reports main green (empty stdout), regardless of flags.
exit 0
SH
chmod +x "$T3/.claude/skills/dispatch-propagate/scripts/repo-health"
# Latch-node ids below are EXACTLY 8 lowercase hex chars: dispatch-graph-main-red-sync
# enumerates open latches through an anchored `^tactic-main-red-[0-9a-f]{8}$` filter
# (matching dispatch-diagnose-main's `git rev-parse --short=8`), so a shorter or
# non-hex fixture id is not enumerated at all and every assertion below silently
# degenerates to "nothing happened".
cat >"$T3/intentions/tactic-main-red-abc12345.md" <<'NODE'
---
id: tactic-main-red-abc12345
kind: tactic
statement: harness open main-red latch node
owner: ai
status: codified
phase: implement
serves: []
execution: null
---
# harness open main-red latch node
NODE
new_origin t3
init_and_push "$T3"

C3="$WORK/t3-clone"
clone_with_node_modules "$C3"
fail_graph_commit "$C3"

stdout_out="$(
  cd "$C3" || exit 99
  bash .claude/skills/dispatch-propagate/scripts/dispatch-graph-main-red-sync 2>"$WORK/t3-stderr.log"
)"
rc=$?
stderr_out="$(cat "$WORK/t3-stderr.log")"
status_after="$(git -C "$C3" status --porcelain intentions/)"
if [[ "$rc" -eq 0 ]] \
   && grep -q '^tactic-main-red-abc12345$' <<<"$stdout_out" \
   && grep -q 'completion of tactic-main-red-abc12345 failed; write rolled back' <<<"$stderr_out" \
   && [[ -z "$status_after" ]]; then
  ok "dispatch-graph-main-red-sync: failed completion surfaces a stderr diagnostic naming the node and leaves the tree clean"
else
  no "dispatch-graph-main-red-sync silent-failure guard (rc=$rc)"
  printf 'stdout: %s\n' "$stdout_out"; printf 'stderr: %s\n' "$stderr_out"
  printf 'status: %s\n' "$status_after"
fi

# ===========================================================================
# Case 4: dispatch-graph-main-red-sync refuses to mutate a node absent from
# origin/main (tactic-graph-write-failure-rollback Unit 5 gap fix). A node whose
# origin/main:intentions/<id>.md blob cannot be rev-parsed at the FRESH_BLOB
# capture point has no clean state to roll back to, so mutating it anyway would
# leak exactly the dirty file the rollback exists to prevent (the restore is
# guarded on a non-empty blob). The script must skip ONLY that node (a stderr
# diagnostic naming it, tree left clean) while the per-node `while read` loop
# still processes the other open node. repo-health is stubbed GREEN so the
# recovery-completion loop runs; graph-commit is stubbed to fail so the
# present-on-origin node exercises the rollback path — proving the loop
# continued past the skipped node.
# ===========================================================================
T4="$WORK/t4-seed"
build_seed_repo "$T4"
cp "$HARNESS_DIR/dispatch-graph-main-red-sync" "$T4/.claude/skills/dispatch-propagate/scripts/dispatch-graph-main-red-sync"
chmod +x "$T4/.claude/skills/dispatch-propagate/scripts/dispatch-graph-main-red-sync"
cat >"$T4/.claude/skills/dispatch-propagate/scripts/repo-health" <<'SH'
#!/usr/bin/env bash
# Stub: always reports main green (empty stdout), regardless of flags.
exit 0
SH
chmod +x "$T4/.claude/skills/dispatch-propagate/scripts/repo-health"
# Node A is seeded AND pushed to origin, so its FRESH_BLOB capture succeeds and
# it exercises the (stubbed-failing) graph-commit rollback path.
cat >"$T4/intentions/tactic-main-red-aaa11111.md" <<'NODE'
---
id: tactic-main-red-aaa11111
kind: tactic
statement: harness open main-red latch node present on origin
owner: ai
status: codified
phase: implement
serves: []
execution: null
---
# harness open main-red latch node present on origin
NODE
new_origin t4
init_and_push "$T4"

C4="$WORK/t4-clone"
clone_with_node_modules "$C4"
fail_graph_commit "$C4"
# Node B exists ONLY in the clone (committed locally, never pushed), so
# listNodes enumerates it into OPEN_MAIN_RED while origin/main:intentions/<id>.md
# genuinely does not exist — the FRESH_BLOB capture fails, triggering the refusal.
cat >"$C4/intentions/tactic-main-red-bbb22222.md" <<'NODE'
---
id: tactic-main-red-bbb22222
kind: tactic
statement: harness open main-red latch node absent from origin
owner: ai
status: codified
phase: implement
serves: []
execution: null
---
# harness open main-red latch node absent from origin
NODE
git -C "$C4" add intentions/tactic-main-red-bbb22222.md
git -C "$C4" commit -qm 'local-only latch node absent from origin'

stdout_out="$(
  cd "$C4" || exit 99
  bash .claude/skills/dispatch-propagate/scripts/dispatch-graph-main-red-sync 2>"$WORK/t4-stderr.log"
)"
rc=$?
stderr_out="$(cat "$WORK/t4-stderr.log")"
status_after="$(git -C "$C4" status --porcelain intentions/)"
if [[ "$rc" -eq 0 ]] \
   && grep -q 'intentions/tactic-main-red-bbb22222.md does not exist on origin/main' <<<"$stderr_out" \
   && grep -q 'skipping tactic-main-red-bbb22222' <<<"$stderr_out" \
   && grep -q 'completion of tactic-main-red-aaa11111 failed; write rolled back' <<<"$stderr_out" \
   && [[ -z "$status_after" ]]; then
  ok "dispatch-graph-main-red-sync: a node absent from origin/main is skipped (no mutation, stderr names it) while the loop still processes the present node"
else
  no "dispatch-graph-main-red-sync origin-absent refusal guard (rc=$rc)"
  printf 'stdout: %s\n' "$stdout_out"; printf 'stderr: %s\n' "$stderr_out"
  printf 'status: %s\n' "$status_after"
fi

# ===========================================================================
# Case 5: transition-node stamps what LANDED, not the reverted worktree
# (tactic-transition-node-stamp-landed-body Unit 3).
#
# The regression: refresh_stamp() used to hash REPO_ROOT's on-disk
# intentions/<id>.md, but graph-commit's cleanup() has by then reset the
# worktree back to the PR-branch tip — so whenever the node's body on
# origin/main differs from the PR-branch copy (a `## needs-main residue`
# section landed during the qa phase, an align-round body edit, any machinery
# append), refresh_stamp() stamped the PR-branch fingerprint instead of the
# landed one. The next freshness computation then read the landed body as
# scope drift, and dispatch-graph-scope-sweep demoted the node and wiped
# execution.markers.
#
# Reproducing that divergence is what gives this case teeth: the residue is
# LANDED on origin/main out-of-band (from the seed repo) while the PR branch
# `t-stamp` stays residue-free, so the worktree copy and the origin/main copy
# genuinely differ in `body` — the only input, besides `statement`, that
# tacticScopeFingerprint hashes. Against the OLD worktree-sourced
# refresh_stamp() assertion 3 fails (scopeStale=true); against the new
# --from-rev origin/main one it passes.
#
# NOTE on /qa-fix Step 3.6: its `## needs-main residue` append does NOT ride
# into the land as an uncommitted worktree edit — transition-node's
# `git show origin/main:intentions/<id>.md > intentions/<id>.md` refresh
# clobbers any uncommitted body edit before anything reads it. Landing the
# residue out-of-band here is therefore the accurate reproduction, not a
# convenience.
#
# The case asserts (a) the reset dance really fired (origin/main has the
# residue, the post-run worktree copy does not) and (b) the very computation
# the sweep performs afterward reports scopeStale=false.
# ===========================================================================
T5="$WORK/t5-seed"
build_seed_repo "$T5"
cp "$HARNESS_DIR/transition-node" "$T5/.claude/skills/dispatch-propagate/scripts/transition-node"
chmod +x "$T5/.claude/skills/dispatch-propagate/scripts/transition-node"
cat >"$T5/intentions/t-stamp.md" <<'NODE'
---
id: t-stamp
kind: tactic
statement: harness node for the landed-body stamp test
owner: ai
status: codified
phase: qa
serves: []
execution: null
---
# harness node for the landed-body stamp test
NODE
new_origin t5
init_and_push "$T5"

C5="$WORK/t5-clone"
clone_with_node_modules "$C5"
landing_graph_commit "$C5"

# A real node-lane PR-branch worktree: on its own branch, ahead of origin/main
# with unpushed non-intentions work (so the cleanup() reset-back is observable).
git -C "$C5" checkout -qb t-stamp
echo 'arbitrary product change' >"$C5/src-change.txt"
git -C "$C5" add src-change.txt
git -C "$C5" commit -qm 'local-only product change ahead of origin/main'

# The mid-phase body edit, LANDED on origin/main from outside this worktree
# (the seed repo stands in for whichever writer landed it — /qa-fix's Step 3.6
# residue append via graph-commit, an align round, dispatch-graph-main-red-sync).
# The `t-stamp` branch tip in $C5 never sees it, so the worktree copy and the
# origin/main copy now genuinely differ in `body`.
cat >>"$T5/intentions/t-stamp.md" <<'RESIDUE'

## needs-main residue

- verify the deployed behavior on main after merge
RESIDUE
git -C "$T5" add intentions/t-stamp.md
git -C "$T5" commit -qm 'qa: append needs-main residue to t-stamp'
git -C "$T5" push -q origin main
git -C "$C5" fetch -q origin

# Guard the setup itself: origin/main must carry the residue while the local
# branch tip must not. If this ever stops holding, the case has lost its teeth
# and every later assertion would pass vacuously.
if ! git -C "$C5" show origin/main:intentions/t-stamp.md | grep -q 'needs-main' \
   || grep -q 'needs-main' "$C5/intentions/t-stamp.md"; then
  echo "error: case 5 setup failed to diverge origin/main from the t-stamp branch tip" >&2
  exit 1
fi

# Seed the phase-start stamp the way provision-node-worktree does
# (provision-node-worktree:83-100): `<scope-fingerprint> <origin-main-sha>`,
# computed over the ORIGIN/MAIN copy of the node — which now carries the
# residue, so the PRE-transition scope gate reads clean (scopeStale=false) and
# the transition is allowed to proceed.
STAMP5_FP="$(
  cd "$C5" || exit 99
  node --import tsx/esm -e '
    const { execFileSync } = await import("node:child_process");
    const { tacticScopeFingerprint } = await import("./packages/intentionsutil/src/router.js");
    const { parseNodeRaw } = await import("./packages/intentionsutil/src/store.js");
    const { extractBody } = await import("./packages/intentionsutil/src/frontmatter.js");
    const id = process.argv[1];
    const raw = execFileSync("git", ["show", "origin/main:intentions/" + id + ".md"], { encoding: "utf8" });
    process.stdout.write(tacticScopeFingerprint(parseNodeRaw(raw, id).statement, extractBody(raw, id)));
  ' t-stamp
)" || { echo "error: case 5 stamp fingerprint computation failed" >&2; exit 1; }
mkdir -p "$C5/.claude/worktrees"
STAMP5="$C5/.claude/worktrees/t-stamp.scope-fingerprint"
printf '%s %s\n' "$STAMP5_FP" "$(git -C "$C5" rev-parse origin/main)" >"$STAMP5"

out="$(
  cd "$C5" || exit 99
  bash .claude/skills/dispatch-propagate/scripts/transition-node t-stamp 2>&1
)"; rc=$?

landed_body="$(git -C "$C5" show origin/main:intentions/t-stamp.md)"
worktree_body="$(cat "$C5/intentions/t-stamp.md")"
SNAP5="$WORK/t5-snapshot"
mkdir -p "$SNAP5"
(cd "$C5" && git archive origin/main intentions | tar -x -C "$SNAP5")
fresh5="$(
  cd "$C5" || exit 99
  node --import tsx/esm packages/intentionsutil/scripts/compute-freshness.ts t-stamp \
    --snapshot "$SNAP5/intentions" --stamp "$STAMP5"
)"
scope_stale5="$(jq -r '.scopeStale' <<<"$fresh5")"
stamp_missing5="$(jq -r '.stampMissing' <<<"$fresh5")"
stamp_sha5="$(awk '{print $2}' "$STAMP5")"
origin_sha5="$(git -C "$C5" rev-parse origin/main)"

if [[ $rc -eq 0 ]] \
   && grep -q '^transitioned t-stamp qa -> review$' <<<"$out" \
   && grep -q 'needs-main' <<<"$landed_body" \
   && ! grep -q 'needs-main' <<<"$worktree_body" \
   && [[ "$scope_stale5" == "false" ]] \
   && [[ "$stamp_missing5" == "false" ]] \
   && [[ "$stamp_sha5" == "$origin_sha5" ]]; then
  ok "transition-node stamps the LANDED body: after graph-commit's reset dance reverts the worktree copy, the refreshed stamp matches origin/main (scopeStale=false, sha=origin/main)"
else
  no "transition-node landed-body stamp (rc=$rc, scopeStale=$scope_stale5, stampMissing=$stamp_missing5)"
  printf '%s\n' "$out"
  printf 'stamp: %s\n' "$(cat "$STAMP5")"
  printf 'origin/main sha: %s\n' "$origin_sha5"
  printf 'landed residue lines: %s / worktree residue lines: %s\n' \
    "$(grep -c 'needs-main' <<<"$landed_body" || true)" \
    "$(grep -c 'needs-main' <<<"$worktree_body" || true)"
fi

# ===========================================================================
# Cases 6-8: reconcile-graph-merged's diagnosis-time compare-and-swap
# (tactic-reconcile-park-clobber, bug X).
#
# The defect: reconcile-graph.ts rewrites the WHOLE node from its in-memory
# read, and reconcile-graph-merged used to hand graph-commit ZERO --base flags —
# so check_base_freshness() short-circuited and the sweep silently overwrote any
# edit that landed on origin/main between its read and its commit. Measured
# effect: a live office_hours park erased with `phase` untouched.
#
# Case 6 guards the pin's construction, case 7 the end-to-end race outcome, and
# case 8 the park-path rollback Unit 1 newly makes reachable.
# ===========================================================================

# reconcile_gh_stub <bin-dir> <fixture-dir> — a `gh` standing in for both API
# surfaces this family touches:
#   - `gh api repos/{owner}/{repo}/pulls/<n>` → a REST-shaped MERGED PR (REST
#     reports a merged PR as state "closed" with merged_at set; the
#     merged/closed discriminator is merged_at, never the state string).
#   - `gh api .../check-runs --jq <prog>` → runs graph-commit's REAL --jq
#     program against an all-green fixture, so the filter itself is exercised
#     rather than a hardcoded count string (test-park-node.sh's approach).
# `app.slug` is required, not decorative: graph-commit's required-check gate
# only counts rows authored by the github-actions App.
reconcile_gh_stub() {
  local bindir="$1" fixdir="$2"
  mkdir -p "$bindir" "$fixdir"
  cat >"$fixdir/green.json" <<'JSON'
{"check_runs": [
  {"name": "acceptance", "status": "completed", "conclusion": "success", "id": 1, "app": {"slug": "github-actions"}},
  {"name": "preview-and-smoke", "status": "completed", "conclusion": "success", "id": 2, "app": {"slug": "github-actions"}},
  {"name": "lint", "status": "completed", "conclusion": "success", "id": 3, "app": {"slug": "github-actions"}},
  {"name": "unit-tests", "status": "completed", "conclusion": "success", "id": 4, "app": {"slug": "github-actions"}}
]}
JSON
  cat >"$bindir/gh" <<'SH'
#!/usr/bin/env bash
# Args always arrive as: gh api <path> [--jq <prog>] ...
path=""
jq_program=""
prev=""
for a in "$@"; do
  case "$prev" in
    --jq) jq_program="$a" ;;
  esac
  case "$a" in
    */pulls/*|*/check-runs) path="$a" ;;
  esac
  prev="$a"
done
case "$path" in
  */check-runs)
    jq -r "$jq_program" "$GC_FIXTURE_DIR/green.json" ;;
  */pulls/*)
    num="${path##*/}"
    jq -n --argjson n "$num" '{
      number: $n, title: "harness pr", body: "",
      state: "closed",
      merged_at: "2026-08-01T00:00:00Z",
      merge_commit_sha: "0123456789abcdef0123456789abcdef01234567",
      mergeable: true, mergeable_state: "clean",
      head: {ref: "harness-branch", sha: "89abcdef0123456789abcdef0123456789abcdef"},
      labels: []
    }' ;;
  *)
    echo "gh stub: unhandled invocation: $*" >&2; exit 1 ;;
esac
SH
  chmod +x "$bindir/gh"
}

# reconcile_node <file> <id> <pr> — a tactic at an OPEN phase carrying a PR and
# NO `## needs-main residue` section, so the sweep classifies it merged→done.
reconcile_node() {
  cat >"$1" <<NODE
---
id: $2
kind: tactic
statement: harness node for the reconcile CAS test
owner: ai
status: codified
phase: implement
serves: []
execution:
  branch: $2
  pr: $3
  attempts: {}
  markers: []
  strategy_fingerprint: null
  fix: null
  completion: null
office_hours: null
---
# harness node for the reconcile CAS test
NODE
}

# Fixed clock: GRACE=0 + a pinned NOW keeps every case off real time.
RECON_ENV=(GRAPH_RECONCILE_GRACE=0 GRAPH_RECONCILE_NOW=1800000000)

# ===========================================================================
# Case 6: reconcile-graph-merged pins one --base per planned edit id, and pins
# the ON-DISK blob rather than origin/main's.
#
# t-r2's copy on origin/main is deliberately moved AHEAD of the clone's checkout
# after cloning, so disk and origin/main genuinely differ for that node. The
# pin must follow the disk (what reconcile-graph.ts's readNode actually reads) —
# pinning origin/main would make scalarMerge compute a spurious "ours" delta on
# untouched fields and could revert landed content.
# ===========================================================================
T6="$WORK/t6-seed"
build_seed_repo "$T6"
cp "$HARNESS_DIR/reconcile-graph-merged" "$T6/.claude/skills/dispatch-propagate/scripts/reconcile-graph-merged"
chmod +x "$T6/.claude/skills/dispatch-propagate/scripts/reconcile-graph-merged"
reconcile_node "$T6/intentions/t-r1.md" t-r1 101
reconcile_node "$T6/intentions/t-r2.md" t-r2 102
new_origin t6
init_and_push "$T6"

C6="$WORK/t6-clone"
clone_with_node_modules "$C6"
BIN6="$WORK/t6-bin"; FIX6="$WORK/t6-fixtures"
reconcile_gh_stub "$BIN6" "$FIX6"
# graph-commit stub: record argv, succeed.
cat >"$C6/packages/intentionsutil/scripts/graph-commit" <<SH
#!/usr/bin/env bash
printf '%s\n' "\$@" >"$WORK/t6-argv.txt"
exit 0
SH
chmod +x "$C6/packages/intentionsutil/scripts/graph-commit"

# Move t-r2's copy on origin/main ahead of the clone (the clone never pulls),
# so hash-object(disk) != rev-parse(origin/main:...) for t-r2.
printf '\nlanded on origin after the clone\n' >>"$T6/intentions/t-r2.md"
git -C "$T6" commit -qam 'move t-r2 ahead on origin/main'
git -C "$T6" push -q origin main
git -C "$C6" fetch -q origin

# The pre-apply disk blobs — exactly what the pin must equal.
disk_r1_before="$(git -C "$C6" hash-object -- intentions/t-r1.md)"
disk_r2_before="$(git -C "$C6" hash-object -- intentions/t-r2.md)"
origin_r2="$(git -C "$C6" rev-parse origin/main:intentions/t-r2.md)"

out="$(
  cd "$C6" || exit 99
  export PATH="$BIN6:$PATH" GC_FIXTURE_DIR="$FIX6"
  export "${RECON_ENV[@]}"
  bash .claude/skills/dispatch-propagate/scripts/reconcile-graph-merged 2>&1
)"; rc=$?
argv6="$(cat "$WORK/t6-argv.txt" 2>/dev/null || true)"
base_count="$(grep -c -- '^--base$' <<<"$argv6" || true)"
pin_r1="$(grep -o '^t-r1=[0-9a-f]\{40\}$' <<<"$argv6" || true)"
pin_r2="$(grep -o '^t-r2=[0-9a-f]\{40\}$' <<<"$argv6" || true)"

if [[ $rc -eq 0 ]] \
   && [[ "$base_count" -eq 2 ]] \
   && [[ "$pin_r1" == "t-r1=$disk_r1_before" ]] \
   && [[ "$pin_r2" == "t-r2=$disk_r2_before" ]] \
   && [[ "$disk_r2_before" != "$origin_r2" ]] \
   && [[ "$pin_r2" != "t-r2=$origin_r2" ]]; then
  ok "reconcile-graph-merged --base construction: exactly one pin per planned edit id, each the PRE-apply on-disk blob (t-r2 proves it follows disk, not origin/main)"
else
  no "reconcile-graph-merged --base construction (rc=$rc, --base count=$base_count)"
  printf '%s\n' "$out"
  printf 'argv: %s\n' "$argv6"
  printf 'want t-r1=%s t-r2=%s (origin t-r2=%s)\n' "$disk_r1_before" "$disk_r2_before" "$origin_r2"
fi

# ===========================================================================
# Case 6b: `reconcile-graph-merged --node <id>` narrows the sweep to one node
# (tactic-dispatch-ladder-skill Unit 1).
#
# The /dispatch-ladder driver absorbs its OWN merge and must not sweep the whole
# graph as a side effect — a node-scoped absorb that also reconciled unrelated
# merged work would race the tick's sweep over nodes the driver knows nothing
# about. Both seeded nodes are equally reconcilable, so the ONLY thing that can
# separate them is the filter: exactly one `--base` pin, keyed to the named id,
# and one `reconciled` line.
# ===========================================================================
T6B="$WORK/t6b-seed"
build_seed_repo "$T6B"
cp "$HARNESS_DIR/reconcile-graph-merged" "$T6B/.claude/skills/dispatch-propagate/scripts/reconcile-graph-merged"
chmod +x "$T6B/.claude/skills/dispatch-propagate/scripts/reconcile-graph-merged"
reconcile_node "$T6B/intentions/t-r1.md" t-r1 101
reconcile_node "$T6B/intentions/t-r2.md" t-r2 102
new_origin t6b
init_and_push "$T6B"

C6B="$WORK/t6b-clone"
clone_with_node_modules "$C6B"
BIN6B="$WORK/t6b-bin"; FIX6B="$WORK/t6b-fixtures"
reconcile_gh_stub "$BIN6B" "$FIX6B"
cat >"$C6B/packages/intentionsutil/scripts/graph-commit" <<SH
#!/usr/bin/env bash
printf '%s\n' "\$@" >"$WORK/t6b-argv.txt"
exit 0
SH
chmod +x "$C6B/packages/intentionsutil/scripts/graph-commit"

out="$(
  cd "$C6B" || exit 99
  export PATH="$BIN6B:$PATH" GC_FIXTURE_DIR="$FIX6B"
  export "${RECON_ENV[@]}"
  bash .claude/skills/dispatch-propagate/scripts/reconcile-graph-merged --node t-r1 2>&1
)"; rc=$?
argv6b="$(cat "$WORK/t6b-argv.txt" 2>/dev/null || true)"
base_count_6b="$(grep -c -- '^--base$' <<<"$argv6b" || true)"
pin_r1_6b="$(grep -o '^t-r1=[0-9a-f]\{40\}$' <<<"$argv6b" || true)"
pin_r2_6b="$(grep -o '^t-r2=[0-9a-f]\{40\}$' <<<"$argv6b" || true)"

if [[ $rc -eq 0 ]] \
   && [[ "$base_count_6b" -eq 1 ]] \
   && [[ -n "$pin_r1_6b" ]] \
   && [[ -z "$pin_r2_6b" ]] \
   && grep -q '^reconciled t-r1 ->' <<<"$out" \
   && ! grep -q 't-r2' <<<"$out"; then
  ok "reconcile-graph-merged --node: narrows the sweep to the named node (one --base pin, sibling t-r2 untouched)"
else
  no "reconcile-graph-merged --node (rc=$rc, --base count=$base_count_6b, pin_r2='$pin_r2_6b')"
  printf '%s\n' "$out"
  printf 'argv: %s\n' "$argv6b"
fi

# Usage errors exit 2 rather than silently sweeping everything — a mistyped flag
# from the driver must not become a full-graph reconcile.
rc_usage=0
( cd "$C6B" && bash .claude/skills/dispatch-propagate/scripts/reconcile-graph-merged --node >/dev/null 2>&1 ) || rc_usage=$?
rc_bogus=0
( cd "$C6B" && bash .claude/skills/dispatch-propagate/scripts/reconcile-graph-merged --bogus >/dev/null 2>&1 ) || rc_bogus=$?
if [[ $rc_usage -eq 2 && $rc_bogus -eq 2 ]]; then
  ok "reconcile-graph-merged: --node without an id, and an unknown flag, are usage errors (exit 2)"
else
  no "reconcile-graph-merged usage errors (--node rc=$rc_usage, --bogus rc=$rc_bogus)"
fi

# ===========================================================================
# Case 7: THE RACE — a park landed between the sweep's read and its commit
# survives the reconcile. This is the case that actually reproduces bug X, and
# the one that runs the REAL graph-commit (its check_base_freshness is the
# machinery under test; only `gh` is stubbed).
#
# There is no natural injection point between reconcile-graph-merged's pin and
# graph-commit's fetch — they are back-to-back in one synchronous process — so,
# exactly as test-park-node.sh:486-520 does, graph-commit is moved aside to
# graph-commit.real and a thin wrapper lands the concurrent park ONCE (sentinel
# guarded) before delegating. The real check_base_freshness then re-fetches,
# sees origin's blob no longer matches the pinned base, and three-way merges:
# office_hours is a SCALAR_FIELD the sweep never touches (ours == base) so
# scalarMerge takes THEIRS (the park survives), while `phase` is unchanged on
# origin (theirs == base) so it takes OURS (done).
#
# REVERT UNIT 1's --base threading and this case goes red with
# office_hours: null — the exact erasure this node exists to stop.
# ===========================================================================
T7="$WORK/t7-seed"
build_seed_repo "$T7"
cp "$HARNESS_DIR/reconcile-graph-merged" "$T7/.claude/skills/dispatch-propagate/scripts/reconcile-graph-merged"
chmod +x "$T7/.claude/skills/dispatch-propagate/scripts/reconcile-graph-merged"
reconcile_node "$T7/intentions/t-race.md" t-race 4242

# The concurrent-park wrapper is installed in the SEED and pushed, so the clone
# sits EXACTLY at origin/main. This is load-bearing, not tidiness: installing it
# in the clone instead requires committing it (graph-commit's
# assert_clean_outside_ids refuses to start on a dirty tracked file), and that
# commit makes the worktree "ahead of origin/main with non-intentions changes".
# graph-commit then takes its ensure_intentions_only_base() path, whose
# `git reset --hard FETCH_HEAD` DISCARDS the file check_base_freshness just
# merged and re-materializes the caller's pre-merge edit — so the park is lost
# and this case fails for a reason that has nothing to do with the code under
# test. The production reconciler runs from a main checkout at-or-behind
# origin/main and never takes that path, so seeding the wrapper reproduces the
# real shape. (The far-ahead path's interaction with a CAS merge is a separate
# latent concern, deliberately out of scope for this node.)
mv "$T7/packages/intentionsutil/scripts/graph-commit" \
   "$T7/packages/intentionsutil/scripts/graph-commit.real"
cat >"$T7/packages/intentionsutil/scripts/graph-commit" <<'SH'
#!/usr/bin/env bash
set -uo pipefail
SD="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [[ ! -f "$SD/.concurrent-landed" ]]; then
  # Another writer (a main-qa pass, an office-hours park) lands an office_hours
  # park on the SAME node AFTER the sweep pinned its base but before this land.
  D="$(mktemp -d)"
  git clone -q "$GC_ORIGIN" "$D"
  git -C "$D" config user.email other@test
  git -C "$D" config user.name other
  awk '
    /^office_hours: null$/ {
      print "office_hours:"
      print "  reason: concurrent park landed between the sweep read and its commit"
      print "  since: 2026-08-05"
      print "  recommendation: harness fixture park"
      print "  session_type: other"
      next
    }
    { print }
  ' "$D/intentions/$GC_NODE.md" >"$D/intentions/$GC_NODE.md.new"
  mv "$D/intentions/$GC_NODE.md.new" "$D/intentions/$GC_NODE.md"
  git -C "$D" commit -qam 'concurrent office_hours park (bypassing the sweep)'
  git -C "$D" push -q origin main
  rm -rf "$D"
  # Fast-forward THIS checkout's HEAD onto the park commit while leaving the
  # working-tree node file (the sweep's stale-read edit) untouched. This is what
  # makes the case a real bug-X reproduction rather than a layer-2 test:
  #
  # If HEAD stays behind, graph-commit's push is rejected, it rebases, git
  # reports a textual conflict on the node file, and layer-2's field-level
  # auto-merge rescues the park all by itself — the park survives with or
  # without --base and the case proves nothing. Production erasures had no
  # conflict to rescue: the park commit was ALREADY in the new commit's
  # ancestry, so the sweep's whole-file rewrite from its stale in-memory read
  # fast-forwarded cleanly and silently dropped the park. `reset --mixed` puts
  # the checkout in exactly that state, leaving --base as the ONLY thing that
  # can still catch the lost update.
  git -C "$GC_CLONE" fetch -q origin main
  git -C "$GC_CLONE" reset -q --mixed FETCH_HEAD
  : >"$SD/.concurrent-landed"
fi
exec "$SD/graph-commit.real" "$@"
SH
chmod +x "$T7/packages/intentionsutil/scripts/graph-commit"
chmod +x "$T7/packages/intentionsutil/scripts/graph-commit.real"
new_origin t7
init_and_push "$T7"

C7="$WORK/t7-clone"
clone_with_node_modules "$C7"
BIN7="$WORK/t7-bin"; FIX7="$WORK/t7-fixtures"
reconcile_gh_stub "$BIN7" "$FIX7"

out="$(
  cd "$C7" || exit 99
  export PATH="$BIN7:$PATH" GC_FIXTURE_DIR="$FIX7"
  export GC_ORIGIN="$ORIGIN" GC_NODE=t-race GC_CLONE="$C7"
  export GRAPH_COMMIT_CHECK_POLL_SECONDS=1 GRAPH_COMMIT_CHECK_TIMEOUT_SECONDS=20
  export "${RECON_ENV[@]}"
  bash .claude/skills/dispatch-propagate/scripts/reconcile-graph-merged 2>&1
)"; rc=$?

landed7="$(git -C "$C7" fetch -q origin && git -C "$C7" show origin/main:intentions/t-race.md)"
phase7="$(grep -m1 '^phase:' <<<"$landed7" | awk '{print $2}')"
if [[ $rc -eq 0 ]] \
   && [[ "$phase7" == "done" ]] \
   && grep -q 'concurrent park landed between the sweep read and its commit' <<<"$landed7" \
   && grep -q 'mergedAt: .*2026-08-01' <<<"$landed7" \
   && grep -q '0123456789abcdef0123456789abcdef01234567' <<<"$landed7"; then
  ok "reconcile-graph-merged CAS race: a concurrently landed office_hours park SURVIVES the reconcile while the sweep's own phase→done + merge evidence still land"
else
  no "reconcile-graph-merged CAS race (rc=$rc, phase=$phase7)"
  printf '%s\n' "$out"
  printf 'landed:\n%s\n' "$landed7"
fi

# ===========================================================================
# Case 8: the park-path rollback leaves a CLEAN tree (Unit 2's guard).
#
# Unit 1 makes graph-commit's park_and_exit() path reachable from this script
# for the first time. On that path graph-commit resets to origin/main, lands an
# office_hours park, and exits NON-ZERO — so HEAD has MOVED. The old rollback
# wrote each pinned blob back over its file, which under a moved HEAD leaves the
# tree dirty with stale, PARK-ERASED content: the shared-checkout residue that
# bricks graph-commit's assert_clean_outside_ids guard for every other writer.
# Restoring to HEAD instead is clean-by-construction.
# ===========================================================================
T8="$WORK/t8-seed"
build_seed_repo "$T8"
cp "$HARNESS_DIR/reconcile-graph-merged" "$T8/.claude/skills/dispatch-propagate/scripts/reconcile-graph-merged"
chmod +x "$T8/.claude/skills/dispatch-propagate/scripts/reconcile-graph-merged"
reconcile_node "$T8/intentions/t-parked.md" t-parked 808
new_origin t8
init_and_push "$T8"

C8="$WORK/t8-clone"
clone_with_node_modules "$C8"
BIN8="$WORK/t8-bin"; FIX8="$WORK/t8-fixtures"
reconcile_gh_stub "$BIN8" "$FIX8"
# graph-commit stub standing in for park_and_exit(): land a park commit (moving
# HEAD), then fail — exactly the shape that makes a blob-restore leave residue.
cat >"$C8/packages/intentionsutil/scripts/graph-commit" <<'SH'
#!/usr/bin/env bash
set -uo pipefail
dir=""; ids=()
while [[ $# -gt 0 ]]; do
  case "$1" in
    -C) dir="${2:-}"; shift 2 ;;
    -m|--base) shift 2 ;;
    *) ids+=("$1"); shift ;;
  esac
done
cd "$dir" || exit 2
for id in "${ids[@]}"; do
  awk '
    /^office_hours: null$/ {
      print "office_hours:"
      print "  reason: graph-commit parked this node on an unresolvable divergence"
      print "  since: 2026-08-05"
      print "  recommendation: harness fixture park"
      print "  session_type: other"
      next
    }
    { print }
  ' "intentions/$id.md" >"intentions/$id.md.new"
  mv "intentions/$id.md.new" "intentions/$id.md"
  git add "intentions/$id.md"
done
# park_and_exit()'s real commit subject shape — `graph: park <ids> (...)` — is
# load-bearing, not cosmetic: it is how the reconciler's rollback tells a park
# commit apart from an un-landed content commit (case 9).
git commit -qm "graph: park ${ids[*]} (concurrent-edit conflict)"
echo "graph-commit: parked on unresolvable divergence" >&2
exit 1
SH
chmod +x "$C8/packages/intentionsutil/scripts/graph-commit"

out="$(
  cd "$C8" || exit 99
  export PATH="$BIN8:$PATH" GC_FIXTURE_DIR="$FIX8"
  export "${RECON_ENV[@]}"
  bash .claude/skills/dispatch-propagate/scripts/reconcile-graph-merged 2>&1
)"; rc=$?
status8="$(git -C "$C8" status --porcelain intentions/)"
node8="$(cat "$C8/intentions/t-parked.md")"
if [[ $rc -ne 0 ]] \
   && [[ -z "$status8" ]] \
   && grep -q 'graph-commit parked this node on an unresolvable divergence' <<<"$node8"; then
  ok "reconcile-graph-merged park-path rollback: restoring to HEAD leaves a clean tree and preserves the park graph-commit just landed"
else
  no "reconcile-graph-merged park-path rollback (rc=$rc)"
  printf '%s\n' "$out"
  printf 'status: %s\n' "$status8"
  printf 'node:\n%s\n' "$node8"
fi

# ===========================================================================
# Case 9: graph-commit's BUSY-MAIN path (rc 11) — it runs commit_files() before
# land(), so on `exit 1` HEAD has moved and carries the sweep's un-landed,
# un-CAS-checked mutation with no reset. A bare `git checkout --` "rollback"
# would restore each node file to that MUTATED HEAD: a no-op reported as a
# rollback, leaving a stranded commit that the NEXT graph-commit from this
# shared checkout would rebase and push to main (graph-commit pushes HEAD, not
# just the node it names) — a write that never passed check_base_freshness.
#
# The stub differs from case 8's in exactly one way that matters: its commit is
# an ordinary content commit, NOT a `graph: park ...` commit, and it is never
# pushed. Assert the commit is discarded (HEAD back where the sweep found it,
# the node file un-mutated, tree clean) and that the false "rolled back" claim
# is replaced by an explicit report.
# ===========================================================================
T9="$WORK/t9-seed"
build_seed_repo "$T9"
cp "$HARNESS_DIR/reconcile-graph-merged" "$T9/.claude/skills/dispatch-propagate/scripts/reconcile-graph-merged"
chmod +x "$T9/.claude/skills/dispatch-propagate/scripts/reconcile-graph-merged"
reconcile_node "$T9/intentions/t-strand.md" t-strand 909
new_origin t9
init_and_push "$T9"

C9="$WORK/t9-clone"
clone_with_node_modules "$C9"
BIN9="$WORK/t9-bin"; FIX9="$WORK/t9-fixtures"
reconcile_gh_stub "$BIN9" "$FIX9"
# graph-commit stub standing in for the rc-11 busy-main exit: commit the caller's
# already-mutated node files (commit_files runs BEFORE land), then fail without
# pushing and without resetting.
cat >"$C9/packages/intentionsutil/scripts/graph-commit" <<'SH'
#!/usr/bin/env bash
set -uo pipefail
dir=""; ids=()
while [[ $# -gt 0 ]]; do
  case "$1" in
    -C) dir="${2:-}"; shift 2 ;;
    -m|--base) shift 2 ;;
    *) ids+=("$1"); shift ;;
  esac
done
cd "$dir" || exit 2
for id in "${ids[@]}"; do
  git add -- "intentions/$id.md"
done
git commit -qm "graph: reconcile terminal tactics (record completion)"
echo "error: graph-commit: could not land ${ids[*]} — main advanced through every push attempt" >&2
exit 1
SH
chmod +x "$C9/packages/intentionsutil/scripts/graph-commit"

head9_before="$(git -C "$C9" rev-parse HEAD)"
node9_before="$(cat "$C9/intentions/t-strand.md")"
out="$(
  cd "$C9" || exit 99
  export PATH="$BIN9:$PATH" GC_FIXTURE_DIR="$FIX9"
  export "${RECON_ENV[@]}"
  bash .claude/skills/dispatch-propagate/scripts/reconcile-graph-merged 2>&1
)"; rc=$?
head9_after="$(git -C "$C9" rev-parse HEAD)"
status9="$(git -C "$C9" status --porcelain intentions/)"
node9_after="$(cat "$C9/intentions/t-strand.md")"
if [[ $rc -ne 0 ]] \
   && [[ "$head9_after" == "$head9_before" ]] \
   && [[ -z "$status9" ]] \
   && [[ "$node9_after" == "$node9_before" ]] \
   && grep -q 'discarded by moving HEAD back to' <<<"$out" \
   && ! grep -q 'rolled the node write' <<<"$out"; then
  ok "reconcile-graph-merged busy-main rollback: an un-landed commit graph-commit left on HEAD is discarded (HEAD restored, node un-mutated) instead of being reported as a rollback"
else
  no "reconcile-graph-merged busy-main rollback (rc=$rc, head moved: $([[ "$head9_after" == "$head9_before" ]] && echo no || echo yes))"
  printf '%s\n' "$out"
  printf 'status: %s\n' "$status9"
  printf 'node:\n%s\n' "$node9_after"
fi

# ===========================================================================
# Case 9a: the discard is scoped to the paths the safety gate proved, not to the
# whole working tree (tactic-eval-finding-ledger Unit A).
#
# Same busy-main shape as case 9, plus the thing production actually had sitting
# in the shared main checkout: an unrelated MODIFIED tracked file (flake.lock).
# The gate at _graph_discard_stranded_commits' top proves the stranded COMMITS
# are intentions/-only and safe to drop — it proves nothing about the rest of the
# checkout, so a whole-tree `git reset --hard` destroyed that edit with no
# warning. The discard must rewind HEAD/index and restore only the intentions/
# paths those commits touched, leaving flake.lock modified exactly as found.
#
# Not vacuous: with `git reset -q --hard "$head_at_arm"` restored in
# lib-graph-rollback.sh this case's flake.lock assertion goes red (the file comes
# back byte-identical to the seed and `git status` reports it clean), while every
# other assertion here still passes.
# ===========================================================================
T9B="$WORK/t9b-seed"
build_seed_repo "$T9B"
cp "$HARNESS_DIR/reconcile-graph-merged" "$T9B/.claude/skills/dispatch-propagate/scripts/reconcile-graph-merged"
chmod +x "$T9B/.claude/skills/dispatch-propagate/scripts/reconcile-graph-merged"
reconcile_node "$T9B/intentions/t-strand.md" t-strand 909
# A tracked non-intentions/ file, so the clone can carry a real `M` against it.
printf '%s\n' 'seeded lockfile — the landed content' >"$T9B/flake.lock"
new_origin t9b
init_and_push "$T9B"

C9B="$WORK/t9b-clone"
clone_with_node_modules "$C9B"
BIN9B="$WORK/t9b-bin"; FIX9B="$WORK/t9b-fixtures"
reconcile_gh_stub "$BIN9B" "$FIX9B"
# The same rc-11 busy-main stub as case 9, written fresh rather than copied out
# of $C9: graph-commit is a TRACKED file in these fixtures, so case 9's stub is
# itself an unrelated dirty tracked file that its own `--hard` discard used to
# destroy — copying from there would make this case's outcome depend on the very
# bug it tests.
cat >"$C9B/packages/intentionsutil/scripts/graph-commit" <<'SH'
#!/usr/bin/env bash
set -uo pipefail
dir=""; ids=()
while [[ $# -gt 0 ]]; do
  case "$1" in
    -C) dir="${2:-}"; shift 2 ;;
    -m|--base) shift 2 ;;
    *) ids+=("$1"); shift ;;
  esac
done
cd "$dir" || exit 2
for id in "${ids[@]}"; do
  git add -- "intentions/$id.md"
done
git commit -qm "graph: reconcile terminal tactics (record completion)"
echo "error: graph-commit: could not land ${ids[*]} — main advanced through every push attempt" >&2
exit 1
SH
chmod +x "$C9B/packages/intentionsutil/scripts/graph-commit"

# The unrelated dirt the discard must preserve.
STRAY9B='locally edited lockfile — unrelated to any graph write'
printf '%s\n' "$STRAY9B" >"$C9B/flake.lock"

head9b_before="$(git -C "$C9B" rev-parse HEAD)"
node9b_before="$(cat "$C9B/intentions/t-strand.md")"
out="$(
  cd "$C9B" || exit 99
  export PATH="$BIN9B:$PATH" GC_FIXTURE_DIR="$FIX9B"
  export "${RECON_ENV[@]}"
  bash .claude/skills/dispatch-propagate/scripts/reconcile-graph-merged 2>&1
)"; rc=$?
head9b_after="$(git -C "$C9B" rev-parse HEAD)"
status9b="$(git -C "$C9B" status --porcelain intentions/)"
node9b_after="$(cat "$C9B/intentions/t-strand.md")"
stray9b_status="$(git -C "$C9B" status --porcelain -- flake.lock)"
stray9b_after="$(cat "$C9B/flake.lock")"
if [[ $rc -ne 0 ]] \
   && [[ "$head9b_after" == "$head9b_before" ]] \
   && [[ -z "$status9b" ]] \
   && [[ "$node9b_after" == "$node9b_before" ]] \
   && grep -q 'discarded by moving HEAD back to' <<<"$out" \
   && [[ "$stray9b_status" == ' M flake.lock' ]] \
   && [[ "$stray9b_after" == "$STRAY9B" ]]; then
  ok "reconcile-graph-merged busy-main rollback: the stranded-commit discard is path-scoped — an unrelated modified flake.lock in the checkout survives intact"
else
  no "reconcile-graph-merged path-scoped discard (rc=$rc, flake.lock status='$stray9b_status')"
  printf '%s\n' "$out"
  printf 'intentions status: %s\n' "$status9b"
  printf 'flake.lock content: %s\n' "$stray9b_after"
fi

# ===========================================================================
# Case 9b: an EMPTY apply plan DISARMS the rollback, so a concurrent writer's
# unpushed commit SURVIVES a sweep that wrote nothing.
#
# The empty-plan early exit (`${#EDIT[@]} -eq 0`) used to `exit` with
# RESTORE_ON_FAILURE still armed, so the EXIT trap ran restore_node_files() over
# a sweep that had written NOTHING. graph_rollback_node_writes() reads a HEAD
# that has moved since HEAD_AT_ARM as "graph-commit landed and stranded a
# commit", so a CONCURRENT graph writer that committed during this sweep's
# planning window was handed straight to _graph_discard_stranded_commits and
# `git reset --mixed`ed away — by a sweep with no write of its own to roll back.
#
# The empty plan is ROUTINE, not exceptional, which is why it needs pinning: a
# record-time mint sitting at `main-qa` with no recorded merge evidence is
# enumerated by the sweep's `unprovenMainQa` arm on EVERY sweep, and
# reconcile-graph.ts's isMergeAbsorbable then refuses it — a merged PR, zero
# writes, an empty `.edit[]`. t-mainqa below is exactly that node.
#
# The concurrent commit is injected through a `node` shim rather than case 7's
# graph-commit wrapper: on this path graph-commit is never reached, and the only
# thing that executes between HEAD_AT_ARM's capture and the early exit is the
# apply run of reconcile-graph.ts. The shim lands the other writer's commit once
# (sentinel guarded), then execs the real node.
#
# Assert the COMMIT's survival, not the exit code. The pre-fix sweep also exited
# 0 — the trap's `exit $rc` preserves the status it inherited — so an
# exit-code-only assertion would pass with the reset still happening. Verified
# RED against a copy of reconcile-graph-merged with the `RESTORE_ON_FAILURE=0`
# disarm line removed: `ahead=0`, the concurrent content gone from disk, and
# `discarded by moving HEAD back to ...` on stderr.
# ===========================================================================
T9C="$WORK/t9c-seed"
build_seed_repo "$T9C"
cp "$HARNESS_DIR/reconcile-graph-merged" "$T9C/.claude/skills/dispatch-propagate/scripts/reconcile-graph-merged"
chmod +x "$T9C/.claude/skills/dispatch-propagate/scripts/reconcile-graph-merged"
# The zero-write enumeration: a record-time mint at `main-qa` carrying a merged
# PR and no recorded merge evidence.
cat >"$T9C/intentions/t-mainqa.md" <<'NODE'
---
id: t-mainqa
kind: tactic
statement: a record-time main-qa mint the sweep enumerates but never writes
owner: ai
status: codified
phase: main-qa
serves: []
execution:
  branch: t-mainqa
  pr: 919
  attempts: {}
  markers: []
  strategy_fingerprint: null
  fix: null
  completion: null
office_hours: null
---
# a record-time main-qa mint the sweep enumerates but never writes

## Verification items

- nothing to verify in the harness
NODE
# The concurrent writer's own node. It carries no execution.pr, so this sweep
# never enumerates it — anything that happens to it is the rollback's doing.
cat >"$T9C/intentions/t-concurrent.md" <<'NODE'
---
id: t-concurrent
kind: tactic
statement: another graph writer's node, committed during the sweep's window
owner: ai
status: codified
phase: implement
serves: []
execution: null
---
# another graph writer's node, committed during the sweep's window
NODE
new_origin t9c
init_and_push "$T9C"

C9C="$WORK/t9c-clone"
clone_with_node_modules "$C9C"
BIN9C="$WORK/t9c-bin"; FIX9C="$WORK/t9c-fixtures"
reconcile_gh_stub "$BIN9C" "$FIX9C"
# graph-commit must never be reached — the empty-plan exit is ahead of the land.
# Record any invocation so a fixture that quietly stopped producing an empty
# plan fails loudly instead of passing for the wrong reason.
cat >"$C9C/packages/intentionsutil/scripts/graph-commit" <<SH
#!/usr/bin/env bash
printf '%s\n' "\$@" >"$WORK/t9c-graph-commit-invoked.txt"
exit 1
SH
chmod +x "$C9C/packages/intentionsutil/scripts/graph-commit"
# The injection point (see the header note): wrap `node`, act only on the apply
# run, and hand every other invocation straight through to the real binary —
# resolved BEFORE the shim is on PATH, or the shim would exec itself.
REAL_NODE9C="$(command -v node)"
cat >"$BIN9C/node" <<'SH'
#!/usr/bin/env bash
set -uo pipefail
saw_script=0; saw_noapply=0
for a in "$@"; do
  case "$a" in
    *reconcile-graph.ts) saw_script=1 ;;
    --no-apply)          saw_noapply=1 ;;
  esac
done
if [[ "$saw_script" -eq 1 && "$saw_noapply" -eq 0 && ! -f "$GC_SENTINEL" ]]; then
  : >"$GC_SENTINEL"
  # Another graph writer commits its own node into the shared checkout while
  # this sweep plans. Unpushed, single-parent, intentions/-only and NOT a
  # `graph: park ...` subject — exactly the shape
  # _graph_discard_stranded_commits classifies as safely discardable.
  printf '%s\n' 'landed by a concurrent graph writer' >>"$GC_CLONE/intentions/t-concurrent.md"
  git -C "$GC_CLONE" add -- intentions/t-concurrent.md
  git -C "$GC_CLONE" commit -qm 'graph: concurrent writer content commit'
fi
exec "$GC_REAL_NODE" "$@"
SH
chmod +x "$BIN9C/node"

out="$(
  cd "$C9C" || exit 99
  export PATH="$BIN9C:$PATH" GC_FIXTURE_DIR="$FIX9C"
  export GC_CLONE="$C9C" GC_REAL_NODE="$REAL_NODE9C" GC_SENTINEL="$WORK/t9c-concurrent-landed"
  export "${RECON_ENV[@]}"
  bash .claude/skills/dispatch-propagate/scripts/reconcile-graph-merged 2>&1
)"; rc=$?
ahead9c="$(git -C "$C9C" rev-list --count origin/main..HEAD)"
subject9c="$(git -C "$C9C" log -1 --format=%s)"
committed9c="$(git -C "$C9C" show HEAD:intentions/t-concurrent.md)"
disk9c="$(cat "$C9C/intentions/t-concurrent.md")"
status9c="$(git -C "$C9C" status --porcelain intentions/)"
if [[ $rc -eq 0 ]] \
   && [[ ! -e "$WORK/t9c-graph-commit-invoked.txt" ]] \
   && [[ -f "$WORK/t9c-concurrent-landed" ]] \
   && [[ "$ahead9c" -eq 1 ]] \
   && [[ "$subject9c" == 'graph: concurrent writer content commit' ]] \
   && grep -q 'landed by a concurrent graph writer' <<<"$committed9c" \
   && grep -q 'landed by a concurrent graph writer' <<<"$disk9c" \
   && [[ -z "$status9c" ]] \
   && ! grep -q 'discarded by moving HEAD back to' <<<"$out" \
   && ! grep -q 'rolled the node write' <<<"$out"; then
  ok "reconcile-graph-merged empty-plan disarm: a concurrent writer's unpushed commit SURVIVES a zero-write sweep (still ahead by 1, content intact on HEAD and on disk, tree clean, no rollback claim)"
else
  no "reconcile-graph-merged empty-plan disarm (rc=$rc, ahead=$ahead9c, subject='$subject9c')"
  printf '%s\n' "$out"
  printf 'status: %s\n' "$status9c"
  printf 'disk:\n%s\n' "$disk9c"
fi

# ===========================================================================
# Case 10: `reconcile-graph-review-stall --node <id>` narrows the sweep to one
# node (tactic-dispatch-ladder-skill Unit 6b) — the same selection filter as
# Unit 1's `reconcile-graph-merged --node` (cases 6b above), added to this
# sweep's sibling.
#
# Both seeded nodes are phase:review + `reviewed` marker + an OPEN, MERGEABLE
# PR with red CI — equally eligible for the `fix` route. The only thing that
# can separate them is the filter: exactly one node's execution.fix gets
# written, exactly one `recovered <id> -> fix` line is printed.
# ===========================================================================

# review_stall_gh_stub <bin-dir> <fixture-dir> — a `gh` standing in for the two
# REST surfaces this sweep polls:
#   - `gh api repos/{owner}/{repo}/pulls/<n>` (gh_pr_view_rest) → an OPEN,
#     MERGEABLE PR (a per-PR fixture file, defaulted inline when absent).
#   - `gh api --paginate repos/{owner}/{repo}/commits/<sha>/check-runs`
#     (dispatch_ci_verdict_rest) → one failing check run, for every sha, so
#     every candidate resolves to a red CI verdict.
review_stall_gh_stub() {
  local bindir="$1" fixdir="$2"
  mkdir -p "$bindir" "$fixdir"
  cat >"$fixdir/checkruns-red.json" <<'JSON'
{"check_runs": [
  {"name": "unit-tests", "status": "completed", "conclusion": "failure", "id": 1, "app": {"slug": "github-actions"}}
]}
JSON
  cat >"$bindir/gh" <<'SH'
#!/usr/bin/env bash
# Args always arrive as: gh api [--paginate] <path>
path=""
for a in "$@"; do
  case "$a" in
    */pulls/*|*/check-runs) path="$a" ;;
  esac
done
echo "$path" >> "$GC_FIXTURE_DIR/gh-calls.log"
case "$path" in
  */check-runs)
    cat "$GC_FIXTURE_DIR/checkruns-red.json" ;;
  */pulls/*)
    num="${path##*/}"
    if [[ -f "$GC_FIXTURE_DIR/pr-$num.json" ]]; then
      cat "$GC_FIXTURE_DIR/pr-$num.json"
    else
      jq -n --argjson n "$num" '{
        number: $n, title: "harness pr", body: "",
        state: "open",
        merged_at: null,
        merge_commit_sha: null,
        mergeable: true, mergeable_state: "clean",
        head: {ref: "harness-branch", sha: ("deadbeef" + ($n | tostring))},
        labels: []
      }'
    fi ;;
  *)
    echo "gh stub: unhandled invocation: $*" >&2; exit 1 ;;
esac
SH
  chmod +x "$bindir/gh"
}

# review_stall_node <file> <id> <pr> — a tactic at phase:review carrying the
# `reviewed` marker, an OPEN PR, and no active fix interrupt: exactly the
# enumeration's candidate shape.
review_stall_node() {
  cat >"$1" <<NODE
---
id: $2
kind: tactic
statement: harness node for the review-stall recovery sweep
owner: ai
status: codified
phase: review
serves: []
execution:
  branch: $2
  pr: $3
  attempts: {}
  markers: [reviewed]
  strategy_fingerprint: null
  fix: null
  completion: null
office_hours: null
---
# harness node for the review-stall recovery sweep
NODE
}

# ---------------------------------------------------------------------------
# Case 10a: --node narrows the sweep to the named node; the otherwise-equally-
# eligible sibling is passed over entirely (no write, no stdout line).
# ---------------------------------------------------------------------------
T10A="$WORK/t10a-seed"
build_seed_repo "$T10A"
cp "$HARNESS_DIR/reconcile-graph-review-stall" "$T10A/.claude/skills/dispatch-propagate/scripts/reconcile-graph-review-stall"
chmod +x "$T10A/.claude/skills/dispatch-propagate/scripts/reconcile-graph-review-stall"
review_stall_node "$T10A/intentions/t-rs1.md" t-rs1 201
review_stall_node "$T10A/intentions/t-rs2.md" t-rs2 202
new_origin t10a
init_and_push "$T10A"

C10A="$WORK/t10a-clone"
clone_with_node_modules "$C10A"
BIN10A="$WORK/t10a-bin"; FIX10A="$WORK/t10a-fixtures"
review_stall_gh_stub "$BIN10A" "$FIX10A"
cat >"$C10A/packages/intentionsutil/scripts/graph-commit" <<SH
#!/usr/bin/env bash
printf '%s\n' "\$@" >"$WORK/t10a-argv.txt"
exit 0
SH
chmod +x "$C10A/packages/intentionsutil/scripts/graph-commit"

out="$(
  cd "$C10A" || exit 99
  export PATH="$BIN10A:$PATH" GC_FIXTURE_DIR="$FIX10A"
  bash .claude/skills/dispatch-propagate/scripts/reconcile-graph-review-stall --node t-rs1 2>&1
)"; rc=$?
argv10a="$(cat "$WORK/t10a-argv.txt" 2>/dev/null || true)"
# Node bodies are YAML frontmatter, not JSON — a written `execution.fix` shows
# up as a `since:` key under it, so grep is enough to tell written from
# untouched without a YAML parser.
if [[ $rc -eq 0 ]] \
   && grep -qE '^\s*since:' "$C10A/intentions/t-rs1.md" \
   && ! grep -qE '^\s*since:' "$C10A/intentions/t-rs2.md" \
   && grep -q '^recovered t-rs1 -> fix' <<<"$out" \
   && ! grep -q 't-rs2' <<<"$out" \
   && grep -q '^t-rs1$' <<<"$argv10a" \
   && ! grep -q '^t-rs2$' <<<"$argv10a"; then
  ok "reconcile-graph-review-stall --node: narrows the sweep to the named node (fix interrupt written only for it, sibling t-rs2 untouched)"
else
  no "reconcile-graph-review-stall --node narrows the sweep (rc=$rc)"
  printf '%s\n' "$out"
  printf 'argv: %s\n' "$argv10a"
  printf 't-rs1:\n%s\n' "$(cat "$C10A/intentions/t-rs1.md")"
  printf 't-rs2:\n%s\n' "$(cat "$C10A/intentions/t-rs2.md")"
fi

# ---------------------------------------------------------------------------
# Case 10b: an unknown --node id acts on nothing — the enumeration filters
# BOTH real candidates out, the sweep hits its empty-candidates exit before
# ever invoking graph-commit.
# ---------------------------------------------------------------------------
T10B="$WORK/t10b-seed"
build_seed_repo "$T10B"
cp "$HARNESS_DIR/reconcile-graph-review-stall" "$T10B/.claude/skills/dispatch-propagate/scripts/reconcile-graph-review-stall"
chmod +x "$T10B/.claude/skills/dispatch-propagate/scripts/reconcile-graph-review-stall"
review_stall_node "$T10B/intentions/t-rs1.md" t-rs1 201
review_stall_node "$T10B/intentions/t-rs2.md" t-rs2 202
new_origin t10b
init_and_push "$T10B"

C10B="$WORK/t10b-clone"
clone_with_node_modules "$C10B"
BIN10B="$WORK/t10b-bin"; FIX10B="$WORK/t10b-fixtures"
review_stall_gh_stub "$BIN10B" "$FIX10B"
cat >"$C10B/packages/intentionsutil/scripts/graph-commit" <<SH
#!/usr/bin/env bash
printf '%s\n' "\$@" >"$WORK/t10b-argv.txt"
exit 0
SH
chmod +x "$C10B/packages/intentionsutil/scripts/graph-commit"

out="$(
  cd "$C10B" || exit 99
  export PATH="$BIN10B:$PATH" GC_FIXTURE_DIR="$FIX10B"
  bash .claude/skills/dispatch-propagate/scripts/reconcile-graph-review-stall --node t-nonexistent 2>&1
)"; rc=$?

if [[ $rc -eq 0 ]] \
   && [[ -z "$out" ]] \
   && [[ ! -f "$WORK/t10b-argv.txt" ]] \
   && ! grep -qE '^\s*since:' "$C10B/intentions/t-rs1.md" \
   && ! grep -qE '^\s*since:' "$C10B/intentions/t-rs2.md"; then
  ok "reconcile-graph-review-stall --node: an unknown id acts on nothing (empty output, no graph-commit call, no node written)"
else
  no "reconcile-graph-review-stall --node unknown id (rc=$rc)"
  printf '%s\n' "$out"
fi

# ---------------------------------------------------------------------------
# Case 10c: without the flag, existing behavior is unchanged — the plain
# sweep still acts on every eligible candidate (both nodes), batched into one
# graph-commit.
# ---------------------------------------------------------------------------
T10C="$WORK/t10c-seed"
build_seed_repo "$T10C"
cp "$HARNESS_DIR/reconcile-graph-review-stall" "$T10C/.claude/skills/dispatch-propagate/scripts/reconcile-graph-review-stall"
chmod +x "$T10C/.claude/skills/dispatch-propagate/scripts/reconcile-graph-review-stall"
review_stall_node "$T10C/intentions/t-rs1.md" t-rs1 201
review_stall_node "$T10C/intentions/t-rs2.md" t-rs2 202
new_origin t10c
init_and_push "$T10C"

C10C="$WORK/t10c-clone"
clone_with_node_modules "$C10C"
BIN10C="$WORK/t10c-bin"; FIX10C="$WORK/t10c-fixtures"
review_stall_gh_stub "$BIN10C" "$FIX10C"
cat >"$C10C/packages/intentionsutil/scripts/graph-commit" <<SH
#!/usr/bin/env bash
printf '%s\n' "\$@" >"$WORK/t10c-argv.txt"
exit 0
SH
chmod +x "$C10C/packages/intentionsutil/scripts/graph-commit"

out="$(
  cd "$C10C" || exit 99
  export PATH="$BIN10C:$PATH" GC_FIXTURE_DIR="$FIX10C"
  bash .claude/skills/dispatch-propagate/scripts/reconcile-graph-review-stall 2>&1
)"; rc=$?
argv10c="$(cat "$WORK/t10c-argv.txt" 2>/dev/null || true)"

if [[ $rc -eq 0 ]] \
   && grep -qE '^\s*since:' "$C10C/intentions/t-rs1.md" \
   && grep -qE '^\s*since:' "$C10C/intentions/t-rs2.md" \
   && grep -q '^recovered t-rs1 -> fix' <<<"$out" \
   && grep -q '^recovered t-rs2 -> fix' <<<"$out" \
   && grep -q '^t-rs1$' <<<"$argv10c" \
   && grep -q '^t-rs2$' <<<"$argv10c"; then
  ok "reconcile-graph-review-stall: unflagged sweep behavior is unchanged (both eligible nodes recovered, one batched graph-commit)"
else
  no "reconcile-graph-review-stall unflagged sweep (rc=$rc)"
  printf '%s\n' "$out"
  printf 'argv: %s\n' "$argv10c"
fi

# Usage errors exit 2 rather than silently sweeping everything — a mistyped
# flag from the /dispatch-ladder driver must not become a full-graph sweep.
# Reuses the 10a clone: neither error path reaches the enumeration, so the
# already-mutated t-rs1 there has no bearing on this check.
rc_usage=0
( cd "$C10A" && bash .claude/skills/dispatch-propagate/scripts/reconcile-graph-review-stall --node >/dev/null 2>&1 ) || rc_usage=$?
rc_bogus=0
( cd "$C10A" && bash .claude/skills/dispatch-propagate/scripts/reconcile-graph-review-stall --bogus >/dev/null 2>&1 ) || rc_bogus=$?
if [[ $rc_usage -eq 2 && $rc_bogus -eq 2 ]]; then
  ok "reconcile-graph-review-stall: --node without an id, and an unknown flag, are usage errors (exit 2)"
else
  no "reconcile-graph-review-stall usage errors (--node rc=$rc_usage, --bogus rc=$rc_bogus)"
fi

# ---------------------------------------------------------------------------
# Case 10d: a CONFLICTING candidate costs no check-runs fetch, and does not
# consume the sweep's budget.
#
# interruptRoute (the delegate behind reviewStallRoute) returns "conflict"
# BEFORE it consults CI at all, and that `conflict` route is a retired no-op
# (tactic-graph-router-conflict-routing). So the sweep skips a CONFLICTING
# candidate before reading .headRefOid and before the paginated check-runs
# fetch, rather than paying for a verdict it discards.
#
# PR 203 is overridden to the raw-REST CONFLICTING shape (`mergeable: false`,
# which gh_pr_view_rest's jq projection maps to the porcelain "CONFLICTING")
# with its own distinct head sha. PR 204 keeps the stub's inline OPEN/MERGEABLE
# default and its red check-runs, so the untouched path is proved alongside.
# The assertions are order-independent by construction: both `/pulls/` log
# lines are required, so neither conclusion can be an artefact of enumeration
# order or of the cap.
# ---------------------------------------------------------------------------
T10D="$WORK/t10d-seed"
build_seed_repo "$T10D"
cp "$HARNESS_DIR/reconcile-graph-review-stall" "$T10D/.claude/skills/dispatch-propagate/scripts/reconcile-graph-review-stall"
chmod +x "$T10D/.claude/skills/dispatch-propagate/scripts/reconcile-graph-review-stall"
review_stall_node "$T10D/intentions/t-rsa.md" t-rsa 203
review_stall_node "$T10D/intentions/t-rsb.md" t-rsb 204
new_origin t10d
init_and_push "$T10D"

C10D="$WORK/t10d-clone"
clone_with_node_modules "$C10D"
BIN10D="$WORK/t10d-bin"; FIX10D="$WORK/t10d-fixtures"
review_stall_gh_stub "$BIN10D" "$FIX10D"
cat >"$FIX10D/pr-203.json" <<'JSON'
{
  "number": 203,
  "title": "harness pr",
  "body": "",
  "state": "open",
  "merged_at": null,
  "merge_commit_sha": null,
  "mergeable": false,
  "mergeable_state": "dirty",
  "head": {"ref": "harness-branch", "sha": "cccc203cccc203"},
  "labels": []
}
JSON
cat >"$C10D/packages/intentionsutil/scripts/graph-commit" <<SH
#!/usr/bin/env bash
printf '%s\n' "\$@" >"$WORK/t10d-argv.txt"
exit 0
SH
chmod +x "$C10D/packages/intentionsutil/scripts/graph-commit"

out="$(
  cd "$C10D" || exit 99
  export PATH="$BIN10D:$PATH" GC_FIXTURE_DIR="$FIX10D"
  bash .claude/skills/dispatch-propagate/scripts/reconcile-graph-review-stall 2>&1
)"; rc=$?
calls10d="$(cat "$FIX10D/gh-calls.log" 2>/dev/null || true)"
argv10d="$(cat "$WORK/t10d-argv.txt" 2>/dev/null || true)"

if [[ $rc -eq 0 ]] \
   && grep -q '/pulls/203$' <<<"$calls10d" \
   && grep -q '/pulls/204$' <<<"$calls10d" \
   && ! grep -q 'cccc203cccc203/check-runs' <<<"$calls10d" \
   && grep -q 'deadbeef204/check-runs' <<<"$calls10d" \
   && ! grep -q 't-rsa' <<<"$out" \
   && grep -q '^recovered t-rsb -> fix' <<<"$out" \
   && grep -qE '^\s*since:' "$C10D/intentions/t-rsb.md" \
   && ! grep -qE '^\s*since:' "$C10D/intentions/t-rsa.md" \
   && grep -q '^t-rsb$' <<<"$argv10d"; then
  ok "reconcile-graph-review-stall: a CONFLICTING candidate pays NO check-runs fetch and is skipped silently, while the sweep still recovers the red MERGEABLE candidate behind it"
else
  no "reconcile-graph-review-stall CONFLICTING short-circuit (rc=$rc)"
  printf '%s\n' "$out"
  printf 'gh calls:\n%s\n' "$calls10d"
  printf 'argv: %s\n' "$argv10d"
fi

# ---------------------------------------------------------------------------
# Cases 10e-10g: the reviewStallRoute cost guard.
#
# The sweep used to spawn `node --import tsx/esm -e` for EVERY candidate, to
# evaluate a pure two-string boolean of values the shell already held. The guard
# skips that spawn unless CI is failing or the PR is CONFLICTING -- the superset
# interruptRoute's doc comment documents and transitions.test.ts:295 pins.
#
# The counting `node` shim below is modelled on Case 9c's: resolve the real
# interpreter BEFORE the shim is on PATH (or the shim execs itself), pass it
# through an exported variable, and exec it unconditionally at the end, so the
# sweep still runs the REAL reviewStallRoute against the REAL
# packages/intentionsutil/src the fixture builders copy in. It logs only when an
# argument carries the string `reviewStallRoute`, which is what keeps it from
# counting the sweep's other two node invocations -- the enumeration one-liner
# (`listNodesStrictCached`) and apply-fix-state.ts. Neither contains it.
# ---------------------------------------------------------------------------

# ---------------------------------------------------------------------------
# Case 10e: the counter is real. Two red MERGEABLE candidates, so the guard
# lets BOTH through: exactly 2 predicate spawns. This is the anti-vacuity
# control for 10f/10g -- without it, a shim whose match string went stale would
# make those two pass for the wrong reason.
# ---------------------------------------------------------------------------
T10E="$WORK/t10e-seed"
build_seed_repo "$T10E"
cp "$HARNESS_DIR/reconcile-graph-review-stall" "$T10E/.claude/skills/dispatch-propagate/scripts/reconcile-graph-review-stall"
chmod +x "$T10E/.claude/skills/dispatch-propagate/scripts/reconcile-graph-review-stall"
review_stall_node "$T10E/intentions/t-rs1.md" t-rs1 201
review_stall_node "$T10E/intentions/t-rs2.md" t-rs2 202
new_origin t10e
init_and_push "$T10E"

C10E="$WORK/t10e-clone"
clone_with_node_modules "$C10E"
BIN10E="$WORK/t10e-bin"; FIX10E="$WORK/t10e-fixtures"
review_stall_gh_stub "$BIN10E" "$FIX10E"
cat >"$C10E/packages/intentionsutil/scripts/graph-commit" <<SH
#!/usr/bin/env bash
printf '%s\n' "\$@" >"$WORK/t10e-argv.txt"
exit 0
SH
chmod +x "$C10E/packages/intentionsutil/scripts/graph-commit"
REAL_NODE10E="$(command -v node)"
cat >"$BIN10E/node" <<'SH'
#!/usr/bin/env bash
set -uo pipefail
saw_predicate=0
for a in "$@"; do
  case "$a" in
    *reviewStallRoute*) saw_predicate=1 ;;
  esac
done
if [[ "$saw_predicate" -eq 1 ]]; then
  printf '%s\n' spawn >>"$GC_NODE_CALLS"
fi
exec "$GC_REAL_NODE" "$@"
SH
chmod +x "$BIN10E/node"

out="$(
  cd "$C10E" || exit 99
  export PATH="$BIN10E:$PATH" GC_FIXTURE_DIR="$FIX10E"
  export GC_REAL_NODE="$REAL_NODE10E" GC_NODE_CALLS="$WORK/t10e-node-calls.log"
  bash .claude/skills/dispatch-propagate/scripts/reconcile-graph-review-stall 2>&1
)"; rc=$?
spawns10e="$(wc -l <"$WORK/t10e-node-calls.log" 2>/dev/null || echo 0)"

if [[ $rc -eq 0 ]] \
   && [[ "${spawns10e// /}" -eq 2 ]] \
   && grep -q '^recovered t-rs1 -> fix' <<<"$out" \
   && grep -q '^recovered t-rs2 -> fix' <<<"$out" \
   && grep -qE '^\s*since:' "$C10E/intentions/t-rs1.md" \
   && grep -qE '^\s*since:' "$C10E/intentions/t-rs2.md"; then
  ok "reconcile-graph-review-stall: the predicate-spawn counter is real — two red MERGEABLE candidates pass the cost guard and spawn reviewStallRoute exactly twice"
else
  no "reconcile-graph-review-stall predicate spawn counter (rc=$rc, spawns=$spawns10e)"
  printf '%s\n' "$out"
fi

# ---------------------------------------------------------------------------
# Case 10f: the guard holds. The same two candidates, but green check-runs, so
# neither is failing and neither is CONFLICTING: reviewStallRoute would return
# null for both, and the sweep must reach that conclusion without paying for a
# single subprocess. Assertion shape mirrors the sibling guard's own pin in
# test-graph-select-target.sh ("green + MERGEABLE spawns no node subprocess").
# ---------------------------------------------------------------------------
T10F="$WORK/t10f-seed"
build_seed_repo "$T10F"
cp "$HARNESS_DIR/reconcile-graph-review-stall" "$T10F/.claude/skills/dispatch-propagate/scripts/reconcile-graph-review-stall"
chmod +x "$T10F/.claude/skills/dispatch-propagate/scripts/reconcile-graph-review-stall"
review_stall_node "$T10F/intentions/t-rs1.md" t-rs1 201
review_stall_node "$T10F/intentions/t-rs2.md" t-rs2 202
new_origin t10f
init_and_push "$T10F"

C10F="$WORK/t10f-clone"
clone_with_node_modules "$C10F"
BIN10F="$WORK/t10f-bin"; FIX10F="$WORK/t10f-fixtures"
review_stall_gh_stub "$BIN10F" "$FIX10F"
# Overwrite the fixture the stub already reads — this file's convention for
# varying stub behavior, rather than a second stub function.
cat >"$FIX10F/checkruns-red.json" <<'JSON'
{"check_runs": [
  {"name": "unit-tests", "status": "completed", "conclusion": "success", "id": 1, "app": {"slug": "github-actions"}}
]}
JSON
cat >"$C10F/packages/intentionsutil/scripts/graph-commit" <<SH
#!/usr/bin/env bash
printf '%s\n' "\$@" >"$WORK/t10f-argv.txt"
exit 0
SH
chmod +x "$C10F/packages/intentionsutil/scripts/graph-commit"
REAL_NODE10F="$(command -v node)"
# The shim install is CHECKED. Under `set -uo pipefail` (no `set -e`) a failed
# `cp` is silent, the shim is simply absent, `node` resolves to the real
# interpreter, GC_NODE_CALLS is never written — and every "no spawn" assertion
# below then passes for the wrong reason. A broken install is an environment
# fault, so abort the harness rather than report a green case.
cp "$BIN10E/node" "$BIN10F/node" \
  || { echo "error: case 10f: cp of the counting node shim $BIN10E/node -> $BIN10F/node failed" >&2; exit 1; }
chmod +x "$BIN10F/node" \
  || { echo "error: case 10f: chmod +x failed for the counting node shim $BIN10F/node" >&2; exit 1; }
[[ -x "$BIN10F/node" ]] \
  || { echo "error: case 10f: the counting node shim is absent or not executable at $BIN10F/node — the case would silently exercise the real interpreter" >&2; exit 1; }

out="$(
  cd "$C10F" || exit 99
  export PATH="$BIN10F:$PATH" GC_FIXTURE_DIR="$FIX10F"
  export GC_REAL_NODE="$REAL_NODE10F" GC_NODE_CALLS="$WORK/t10f-node-calls.log"
  bash .claude/skills/dispatch-propagate/scripts/reconcile-graph-review-stall 2>&1
)"; rc=$?
# ANTI-VACUITY WITNESS. Every other assertion in this case is an absence — no
# shim log, no `recovered` line, no `since:` stamp, no argv file — and an
# enumeration that produced ZERO candidates satisfies all of them. So the case
# could not distinguish "the guard held over two real candidates" from "the
# sweep did nothing at all". The gh stub's own call log is the existing
# observable that separates the two (cases 10d and 10g already assert against
# it), so no production output has to change: exactly FOUR REST calls, one
# `pulls/<n>` and one `check-runs` per seeded candidate. Pinning the count
# exactly, rather than `> 0`, also catches a candidate silently dropped or
# double-polled. And requiring BOTH check-runs fetches is what distinguishes
# this case from 10g, where the CONFLICTING short-circuit skips the fetch.
calls10f="$(cat "$FIX10F/gh-calls.log" 2>/dev/null || true)"
ncalls10f="$(grep -c . <<<"$calls10f" || true)"

# VERDICT WITNESS. The four call-log assertions below prove the two check-runs
# fetches HAPPENED. None of them proves what those fetches RETURNED — and the
# guard this case exists to pin does not distinguish the two answers that
# matter. reconcile-graph-review-stall swallows a failed fetch
# (RAW_VERDICT=$(dispatch_ci_verdict_rest ... 2>/dev/null) || RAW_VERDICT="")
# and normalizes the empty result to `unknown`, which takes the SAME
# `!= failing` branch as `passing`. So a fixture whose check-runs call ERRORS
# still produces rc 0, exactly four logged REST calls, no predicate spawn and
# no writes — every assertion here would hold, and the case would report that
# "the guard held over a GREEN candidate" from a run where CI was never
# successfully read at all.
#
# So read the verdict independently and pin the value. Two constraints on the
# call, both load-bearing:
#   * It MUST run AFTER calls10f/ncalls10f are captured. The call goes through
#     the same gh stub and appends a fifth line to gh-calls.log (measured),
#     which would break the exact-count-of-4 assertion below.
#   * It runs in a SUBSHELL mirroring the `out=$(...)` one above, so sourcing
#     lib.sh — which exports FIREBASE_PROJECT_ID and defines the whole dispatch
#     function set — cannot pollute the harness's own shell. The subshell
#     reproduces the reconciler's environment exactly: cd into the clone, the
#     gh stub first on PATH, GC_FIXTURE_DIR at this case's fixtures, so the
#     call hits the FIXTURE and never the network.
# A failed source or a failed fetch leaves verdict10f empty, which fails the
# conjunct — there is no path on which an error reads as a pass.
verdict10f="$(
  cd "$C10F" || exit 99
  export PATH="$BIN10F:$PATH" GC_FIXTURE_DIR="$FIX10F"
  source .claude/skills/dispatch-propagate/scripts/lib.sh || exit 98
  dispatch_ci_verdict_rest deadbeef201
)"

if [[ $rc -eq 0 ]] \
   && [[ "${ncalls10f// /}" -eq 4 ]] \
   && grep -q '/pulls/201$' <<<"$calls10f" \
   && grep -q '/pulls/202$' <<<"$calls10f" \
   && grep -q 'deadbeef201/check-runs$' <<<"$calls10f" \
   && grep -q 'deadbeef202/check-runs$' <<<"$calls10f" \
   && [[ "$verdict10f" == "passing" ]] \
   && [[ "$([ -f "$WORK/t10f-node-calls.log" ] && echo 1 || echo 0)" -eq 0 ]] \
   && ! grep -q 'recovered' <<<"$out" \
   && ! grep -qE '^\s*since:' "$C10F/intentions/t-rs1.md" \
   && ! grep -qE '^\s*since:' "$C10F/intentions/t-rs2.md" \
   && [[ ! -e "$WORK/t10f-argv.txt" ]]; then
  ok "reconcile-graph-review-stall: the cost guard holds — both seeded candidates are really polled (exactly 4 REST calls: pulls+check-runs for each) and the CI fetch really returns passing, yet a green + MERGEABLE candidate spawns no reviewStallRoute subprocess, and nothing is written or landed"
else
  no "reconcile-graph-review-stall cost guard (rc=$rc, gh calls=$ncalls10f, ci verdict=$verdict10f)"
  printf '%s\n' "$out"
  printf 'gh calls:\n%s\n' "$calls10f"
fi

# ---------------------------------------------------------------------------
# Case 10g: the COMPOSITION of the two fixes. A CONFLICTING candidate is skipped
# by the short-circuit BEFORE the CI fetch, so it reaches neither the check-runs
# call nor the predicate spawn — the guard's CONFLICTING clause is unreachable
# on this path and is retained only against tactic-review-stall-conflict-lane,
# which proposes un-retiring the conflict arm. That retention is pinned by a
# source-text assertion in the PR's verification, not here; what this case pins
# is the ordering. It goes red if the short-circuit is ever moved BELOW the
# guard, because the candidate would then pay the check-runs fetch again.
# ---------------------------------------------------------------------------
T10G="$WORK/t10g-seed"
build_seed_repo "$T10G"
cp "$HARNESS_DIR/reconcile-graph-review-stall" "$T10G/.claude/skills/dispatch-propagate/scripts/reconcile-graph-review-stall"
chmod +x "$T10G/.claude/skills/dispatch-propagate/scripts/reconcile-graph-review-stall"
review_stall_node "$T10G/intentions/t-rs1.md" t-rs1 201
new_origin t10g
init_and_push "$T10G"

C10G="$WORK/t10g-clone"
clone_with_node_modules "$C10G"
BIN10G="$WORK/t10g-bin"; FIX10G="$WORK/t10g-fixtures"
review_stall_gh_stub "$BIN10G" "$FIX10G"
cat >"$FIX10G/checkruns-red.json" <<'JSON'
{"check_runs": [
  {"name": "unit-tests", "status": "completed", "conclusion": "success", "id": 1, "app": {"slug": "github-actions"}}
]}
JSON
cat >"$FIX10G/pr-201.json" <<'JSON'
{
  "number": 201,
  "title": "harness pr",
  "body": "",
  "state": "open",
  "merged_at": null,
  "merge_commit_sha": null,
  "mergeable": false,
  "mergeable_state": "dirty",
  "head": {"ref": "harness-branch", "sha": "cccc201cccc201"},
  "labels": []
}
JSON
cat >"$C10G/packages/intentionsutil/scripts/graph-commit" <<SH
#!/usr/bin/env bash
printf '%s\n' "\$@" >"$WORK/t10g-argv.txt"
exit 0
SH
chmod +x "$C10G/packages/intentionsutil/scripts/graph-commit"
REAL_NODE10G="$(command -v node)"
# Checked for the same reason case 10f's install is — see the comment there.
cp "$BIN10E/node" "$BIN10G/node" \
  || { echo "error: case 10g: cp of the counting node shim $BIN10E/node -> $BIN10G/node failed" >&2; exit 1; }
chmod +x "$BIN10G/node" \
  || { echo "error: case 10g: chmod +x failed for the counting node shim $BIN10G/node" >&2; exit 1; }
[[ -x "$BIN10G/node" ]] \
  || { echo "error: case 10g: the counting node shim is absent or not executable at $BIN10G/node — the case would silently exercise the real interpreter" >&2; exit 1; }

out="$(
  cd "$C10G" || exit 99
  export PATH="$BIN10G:$PATH" GC_FIXTURE_DIR="$FIX10G"
  export GC_REAL_NODE="$REAL_NODE10G" GC_NODE_CALLS="$WORK/t10g-node-calls.log"
  bash .claude/skills/dispatch-propagate/scripts/reconcile-graph-review-stall 2>&1
)"; rc=$?
calls10g="$(cat "$FIX10G/gh-calls.log" 2>/dev/null || true)"

if [[ $rc -eq 0 ]] \
   && [[ "$([ -f "$WORK/t10g-node-calls.log" ] && echo 1 || echo 0)" -eq 0 ]] \
   && grep -q '/pulls/201$' <<<"$calls10g" \
   && ! grep -q 'check-runs' <<<"$calls10g" \
   && ! grep -q 'recovered' <<<"$out" \
   && ! grep -qE '^\s*since:' "$C10G/intentions/t-rs1.md" \
   && [[ ! -e "$WORK/t10g-argv.txt" ]]; then
  ok "reconcile-graph-review-stall: a CONFLICTING candidate is skipped before the CI fetch, so the superset guard's CONFLICTING clause is unreachable on this path and is retained only against tactic-review-stall-conflict-lane (0 check-runs calls, 0 predicate spawns)"
else
  no "reconcile-graph-review-stall CONFLICTING composition (rc=$rc)"
  printf '%s\n' "$out"
  printf 'gh calls:\n%s\n' "$calls10g"
fi

# ---------------------------------------------------------------------------
# Case 10h: the failed-land report does NOT claim "nothing landed".
#
# Once the sweep threads --base, graph-commit's park path became reachable from
# here for the first time: park_and_exit() lands an office_hours park for the
# diverged node AND re-applies every bystander id's fix-interrupt edit onto that
# park commit, pushes it, and exits NON-ZERO. graph-commit says so in its own
# caller contract — "rc 1 does not mean 'nothing landed'"
# (packages/intentionsutil/scripts/graph-commit:269). The sweep's report line
# used to answer that rc with "write rolled back, nothing landed", which is
# false on exactly the path the --base change opened, and the log is what a
# reader sees rather than the source comment that already described the park
# correctly.
#
# The report cannot swing to the opposite assertion either — the other rc-1
# shapes really did land nothing — so what is asserted here is the ABSENCE of
# the false claim plus the presence of the pointer at the two things that do
# know: graph-commit's own stderr, and the rollback classification line.
#
# RECOVERED_MSGS stays suppressed on this path (a `recovered <id> -> fix` line
# for a node that in fact PARKED would be a worse lie than silence), so the
# stdout protocol must carry NO `recovered` line here. That is asserted too,
# because it is the half a future edit is most likely to "fix" by accident.
#
# Fixture is Case 10c's, with one substitution: fail_graph_commit instead of the
# argv-recording exit-0 stub.
# ---------------------------------------------------------------------------
T10H="$WORK/t10h-seed"
build_seed_repo "$T10H"
cp "$HARNESS_DIR/reconcile-graph-review-stall" "$T10H/.claude/skills/dispatch-propagate/scripts/reconcile-graph-review-stall"
chmod +x "$T10H/.claude/skills/dispatch-propagate/scripts/reconcile-graph-review-stall"
review_stall_node "$T10H/intentions/t-rs1.md" t-rs1 201
review_stall_node "$T10H/intentions/t-rs2.md" t-rs2 202
new_origin t10h
init_and_push "$T10H"

C10H="$WORK/t10h-clone"
clone_with_node_modules "$C10H"
fail_graph_commit "$C10H"
BIN10H="$WORK/t10h-bin"; FIX10H="$WORK/t10h-fixtures"
review_stall_gh_stub "$BIN10H" "$FIX10H"

out="$(
  cd "$C10H" || exit 99
  export PATH="$BIN10H:$PATH" GC_FIXTURE_DIR="$FIX10H"
  bash .claude/skills/dispatch-propagate/scripts/reconcile-graph-review-stall 2>&1
)"; rc=$?
status10h="$(git -C "$C10H" status --porcelain intentions/)"

if [[ $rc -eq 0 ]] \
   && grep -q 'graph-commit did not report success for' <<<"$out" \
   && ! grep -q 'nothing landed' <<<"$out" \
   && grep -q 'an office_hours park DID land for the diverged node' <<<"$out" \
   && grep -q 'rolled the node write(s) back to HEAD' <<<"$out" \
   && ! grep -q '^recovered ' <<<"$out" \
   && [[ -z "$status10h" ]]; then
  ok "reconcile-graph-review-stall failed land: the report drops the false 'nothing landed' claim, points at graph-commit's stderr and the rollback line, emits no 'recovered' stdout line, and still leaves intentions/ clean"
else
  no "reconcile-graph-review-stall failed-land report (rc=$rc)"
  printf '%s\n' "$out"
  printf 'status: %s\n' "$status10h"
fi

# ===========================================================================
# Case 11: graph-select-target's interrupt gates roll their write back when the
# land fails (tactic-eval-finding-reconcile-base-revert-blocks-main-graph-writes).
#
# THE production leak this node records. Every interrupt gate in
# graph-select-target mutates intentions/<id>.md through apply-fix-state /
# apply-conflict-state and lands it with a SEPARATE graph-commit; when that
# commit did not land, nothing rolled the mutation back. Measured 2026-08-13
# 18:24:57Z: the `--clear-fix` arm of _gate_fix_active left
# intentions/tactic-attention-namespaced-rank.md dirty (`fix: null` + the
# `reviewed` marker stripped — precisely what --clear-fix writes) because its
# graph-commit had been refused by a pre-existing dirty flake.lock. The residue
# then re-refused every subsequent graph-commit from the main checkout — the
# next tick's gate leaked again on top of it, one leaked write per tick, until a
# human cleared the file.
#
# The fixture reproduces that arm exactly: a `fix`-phase candidate whose CI
# reads green, a REAL apply-fix-state --clear-fix write, and a graph-commit that
# fails. Assert the tree is left CLEAN and the node file is byte-identical to
# HEAD — the `reviewed` marker and the fix block both still there, because
# nothing landed.
#
# Fixture shape follows test-graph-select-target.sh (the script derives
# REPO_ROOT from its own on-disk location, so it and every sourced lib*.sh must
# be physically copied) plus this harness's real node_modules symlink, since
# apply-fix-state.ts must genuinely run.
# ===========================================================================
T11="$WORK/t11-seed"
build_seed_repo "$T11"
cp "$HARNESS_DIR"/graph-select-target "$HARNESS_DIR"/lib-*.sh \
   "$T11/.claude/skills/dispatch-propagate/scripts/"
chmod +x "$T11/.claude/skills/dispatch-propagate/scripts/graph-select-target"
# A tactic carrying an active fix interrupt plus the `reviewed` marker.
# The STORED phase stays at the ladder phase (`review`) — `fix` is a
# router-EMITTED phase, not a member of PHASES (schema.ts:59, DISPATCH_PHASE_NAMES
# at :105), so a node file carrying `phase: fix` fails validateNode and every
# write below would no-op. It is `execution.fix != null` that makes the router
# emit `fix`, which is what the canned selector output below reports.
# --clear-fix's resolution path writes fix: null AND strips the `reviewed`
# marker, so both halves of the production diff are reproduced.
cat >"$T11/intentions/t-gst.md" <<'NODE'
---
id: t-gst
kind: tactic
statement: harness node for the graph-select-target fix-clear rollback test
owner: ai
status: codified
phase: review
serves: []
execution:
  branch: t-gst
  pr: 777
  attempts: {}
  markers:
    - planned
    - reviewed
  strategy_fingerprint: null
  fix:
    since: 2026-08-01
    attempt: 1
    # Hex WITH letters on purpose: an all-digit sha parses as a YAML number and
    # validateFixState rejects it ("Expected string or null for
    # execution.fix.pushed_sha, got number"), which would make every write below
    # a silent no-op and this case vacuous.
    pushed_sha: aaaa1111aaaa1111aaaa1111aaaa1111aaaa1111
  conflict: null
  completion: null
office_hours: null
---
# harness node for the graph-select-target fix-clear rollback test
NODE
new_origin t11
init_and_push "$T11"

C11="$WORK/t11-clone"
clone_with_node_modules "$C11"
fail_graph_commit "$C11"
BIN11="$WORK/t11-bin"; FIX11="$WORK/t11-fixtures"
mkdir -p "$BIN11" "$FIX11"

# The canned selector output. Only `npx tsx …/select-targets.ts` is intercepted;
# every other `npx tsx <script>` runs for real through `node --import tsx/esm`,
# which is how apply-fix-state.ts performs the genuine --clear-fix write.
cat >"$FIX11/selection.json" <<'JSON'
{"candidates":[{"id":"t-gst","kind":"tactic","phase":"fix","pr":777,"pace_exempt":false,
  "fix":{"since":"2026-08-01","pushed_sha":"aaaa1111aaaa1111aaaa1111aaaa1111aaaa1111"}}],
 "events":[]}
JSON
cat >"$BIN11/npx" <<SH
#!/usr/bin/env bash
for a in "\$@"; do
  case "\$a" in
    *select-targets.ts) cat "$FIX11/selection.json"; exit 0 ;;
  esac
done
args=("\$@")
[[ "\${args[0]}" == "tsx" ]] && args=("\${args[@]:1}")
exec node --import tsx/esm "\${args[@]}"
SH
chmod +x "$BIN11/npx"

# gh: an OPEN, MERGEABLE PR. The CI verdict is supplied through
# DISPATCH_CI_VERDICT_CACHE below rather than a check-runs fixture, so this stub
# only has to serve gh_pr_view_rest.
cat >"$BIN11/gh" <<'SH'
#!/usr/bin/env bash
path=""
for a in "$@"; do
  case "$a" in */pulls/*) path="$a" ;; esac
done
case "$path" in
  */pulls/*)
    jq -n '{
      number: 777, title: "harness pr", body: "",
      state: "open", merged_at: null, merge_commit_sha: null,
      mergeable: true, mergeable_state: "clean",
      head: {ref: "t-gst", sha: "2222222222222222222222222222222222222222"},
      labels: []
    }' ;;
  *) echo "gh stub: unhandled invocation: $*" >&2; exit 1 ;;
esac
SH
chmod +x "$BIN11/gh"
# `claude agents --json` reports no live sessions, corroborated as definite by
# the daemon-visible probe (see test-graph-select-target.sh's note) — so the
# claimed-set gate lets the candidate through to sensor_gate.
printf '%s' '[]' >"$FIX11/claude-payload.json"
cat >"$BIN11/claude" <<SH
#!/usr/bin/env bash
cat "$FIX11/claude-payload.json"
SH
chmod +x "$BIN11/claude"
cat >"$BIN11/pgrep-daemon-visible" <<'SH'
#!/usr/bin/env bash
exit 0
SH
chmod +x "$BIN11/pgrep-daemon-visible"
# Green CI for the PR head, without a check-runs round trip.
mkdir -p "$WORK/t11-ci-cache"
printf 'passing\n' >"$WORK/t11-ci-cache/2222222222222222222222222222222222222222"

node11_before="$(cat "$C11/intentions/t-gst.md")"
out="$(
  cd "$C11" || exit 99
  export PATH="$BIN11:$PATH"
  export CLAUDE_AGENTS_CMD="$BIN11/claude" CLAUDE_AGENTS_PGREP_CMD="$BIN11/pgrep-daemon-visible"
  export DISPATCH_RESERVATION_DIR="$WORK/t11-reservations"
  export DISPATCH_SELECTION_LOG_DIR="$WORK/t11-seldir"
  export DISPATCH_DECISION_LOG_DIR="$WORK/t11-seldir"
  export DISPATCH_CI_VERDICT_CACHE="$WORK/t11-ci-cache"
  bash .claude/skills/dispatch-propagate/scripts/graph-select-target 2>&1
)"; rc=$?
status11="$(git -C "$C11" status --porcelain intentions/)"
node11_after="$(cat "$C11/intentions/t-gst.md")"

if [[ $rc -eq 0 ]] \
   && [[ -z "$status11" ]] \
   && [[ "$node11_after" == "$node11_before" ]] \
   && grep -q 'rolled the node write(s) back to HEAD' <<<"$out"; then
  ok "graph-select-target fix-clear rollback: a graph-commit failure after the REAL --clear-fix write leaves a clean tree (node file byte-identical to HEAD: reviewed marker and fix block intact)"
else
  no "graph-select-target fix-clear rollback (rc=$rc)"
  printf '%s\n' "$out"
  printf 'status: %s\n' "$status11"
  printf 'node diff:\n%s\n' "$(diff <(printf '%s' "$node11_before") <(printf '%s' "$node11_after") || true)"
fi

# ---------------------------------------------------------------------------
# Case 11b: the guard has teeth. Neutering the rollback call must make 11 red —
# otherwise the case would pass on a script that never rolls anything back.
# Same fixture, one substitution: _rollback_node_write becomes a no-op.
# ---------------------------------------------------------------------------
C11B="$WORK/t11b-clone"
clone_with_node_modules "$C11B"
fail_graph_commit "$C11B"
GST11B="$C11B/.claude/skills/dispatch-propagate/scripts/graph-select-target"
awk '{ print } /^_rollback_node_write\(\) \{$/ { print "  return 0" }' \
  "$GST11B" >"$GST11B.neutered"
mv "$GST11B.neutered" "$GST11B"
chmod +x "$GST11B"
grep -q '^  return 0$' "$GST11B" \
  || { echo "error: case 11b could not neuter _rollback_node_write (renamed?)" >&2; exit 1; }

out11b="$(
  cd "$C11B" || exit 99
  export PATH="$BIN11:$PATH"
  export CLAUDE_AGENTS_CMD="$BIN11/claude" CLAUDE_AGENTS_PGREP_CMD="$BIN11/pgrep-daemon-visible"
  export DISPATCH_RESERVATION_DIR="$WORK/t11b-reservations"
  export DISPATCH_SELECTION_LOG_DIR="$WORK/t11b-seldir"
  export DISPATCH_DECISION_LOG_DIR="$WORK/t11b-seldir"
  export DISPATCH_CI_VERDICT_CACHE="$WORK/t11-ci-cache"
  bash .claude/skills/dispatch-propagate/scripts/graph-select-target 2>&1
)"
status11b="$(git -C "$C11B" status --porcelain intentions/)"
if [[ -n "$status11b" ]]; then
  ok "graph-select-target fix-clear rollback has teeth: with the rollback neutered the same fixture DOES leak a dirty node file ($status11b)"
else
  no "graph-select-target fix-clear rollback teeth (neutered run left a clean tree — case 11 may be vacuous)"
  printf '%s\n' "$out11b"
fi

# ===========================================================================
# Case 12: DISPATCH_GRAPH_NODE_CACHE — the tick-scoped enumeration memo
# (packages/intentionsutil/src/store-cache.ts) really is consulted by the
# reconcile band, really does invalidate on a store write, really stays
# fail-closed, and really is optional.
#
# The hit is proved by POISONING, not by timing: the cache is warmed by the
# primitive itself, the entry is then rewritten to drop `t-rs2`, and the sweep
# is run unfiltered. Disk still carries an equally eligible t-rs2 (case 10c
# above is the control: the unflagged sweep recovers BOTH). So "only t-rs1 was
# recovered" is only explicable by the sweep having read the cache entry. A
# test that merely ran the sweep twice would pass with the cache ripped out.
# ===========================================================================

T12="$WORK/t12-seed"
build_seed_repo "$T12"
cp "$HARNESS_DIR/reconcile-graph-review-stall" "$T12/.claude/skills/dispatch-propagate/scripts/reconcile-graph-review-stall"
chmod +x "$T12/.claude/skills/dispatch-propagate/scripts/reconcile-graph-review-stall"
review_stall_node "$T12/intentions/t-rs1.md" t-rs1 201
review_stall_node "$T12/intentions/t-rs2.md" t-rs2 202
new_origin t12
init_and_push "$T12"

BIN12="$WORK/t12-bin"; FIX12="$WORK/t12-fixtures"
review_stall_gh_stub "$BIN12" "$FIX12"

# rs_clone <dst> — one independent clone of the case-12 origin with the
# graph-commit landing step stubbed out (each sub-case needs its own store, and
# sub-cases (a)/(b)/(c) mutate theirs).
rs_clone() {
  clone_with_node_modules "$1"
  cat >"$1/packages/intentionsutil/scripts/graph-commit" <<'SH'
#!/usr/bin/env bash
exit 0
SH
  chmod +x "$1/packages/intentionsutil/scripts/graph-commit"
}

# rs_warm <clone> <cache-dir> — populate <cache-dir> with the entry the sweep
# will look up, via the primitive itself, WITHOUT running the sweep. A warming
# sweep would write node files and so move the very fingerprint the entry is
# keyed on, which is exactly the invalidation sub-case (b) tests.
rs_warm() {
  ( cd "$1" || exit 99
    node --import tsx/esm -e '
      const { listNodesStrictCached } = await import("./packages/intentionsutil/src/store-cache.js");
      listNodesStrictCached("./intentions", process.argv[1]);
    ' "$2" )
}

# rs_sweep <clone> <cache-dir-or-empty> [args...] — the unfiltered review-stall
# sweep, stdout+stderr merged. An empty cache-dir argument runs with the
# variable genuinely UNSET (the /dispatch-ladder single-node path).
rs_sweep() {
  local clone="$1" cache="$2"; shift 2
  ( cd "$clone" || exit 99
    export PATH="$BIN12:$PATH" GC_FIXTURE_DIR="$FIX12"
    if [[ -n "$cache" ]]; then
      export DISPATCH_GRAPH_NODE_CACHE="$cache"
    else
      unset DISPATCH_GRAPH_NODE_CACHE
    fi
    bash .claude/skills/dispatch-propagate/scripts/reconcile-graph-review-stall "$@" 2>&1 )
}

# ---------------------------------------------------------------------------
# Case 12a: the entry is a real HIT — a poisoned cache changes the candidate set.
# ---------------------------------------------------------------------------
C12A="$WORK/t12a-clone"; rs_clone "$C12A"
CACHE12A="$WORK/t12a-cache"; mkdir -p "$CACHE12A"
rs_warm "$C12A" "$CACHE12A"
entries12a=("$CACHE12A"/nodes-*.json)
n12a=0; [[ -e "${entries12a[0]}" ]] && n12a=${#entries12a[@]}
poisoned12a=0
if [[ $n12a -eq 1 ]]; then
  jq 'map(select(.id != "t-rs2"))' "${entries12a[0]}" >"$WORK/t12a-poison.json" \
    && mv "$WORK/t12a-poison.json" "${entries12a[0]}" && poisoned12a=1
fi
out12a="$(rs_sweep "$C12A" "$CACHE12A")"; rc12a=$?

if [[ $n12a -eq 1 ]] \
   && [[ $poisoned12a -eq 1 ]] \
   && [[ $rc12a -eq 0 ]] \
   && grep -q '^recovered t-rs1 -> fix' <<<"$out12a" \
   && ! grep -q 't-rs2' <<<"$out12a" \
   && grep -qE '^\s*since:' "$C12A/intentions/t-rs1.md" \
   && ! grep -qE '^\s*since:' "$C12A/intentions/t-rs2.md"; then
  ok "reconcile-graph-review-stall DISPATCH_GRAPH_NODE_CACHE: the sweep SERVES the cache entry (warming wrote exactly one nodes-*.json; a poisoned entry dropping t-rs2 removed it from the candidate set even though disk still qualifies it)"
else
  no "reconcile-graph-review-stall cache hit (entries=$n12a poisoned=$poisoned12a rc=$rc12a)"
  printf '%s\n' "$out12a"
fi

# ---------------------------------------------------------------------------
# Case 12b: a store WRITE invalidates — the key is the store's bytes, so a warm
# entry describing the pre-write state can never be served after it.
# ---------------------------------------------------------------------------
C12B="$WORK/t12b-clone"; rs_clone "$C12B"
CACHE12B="$WORK/t12b-cache"; mkdir -p "$CACHE12B"
rs_warm "$C12B" "$CACHE12B"
# Disqualify t-rs2 on disk AFTER warming: the warm entry still records it at
# phase:review, so serving that entry would recover it.
sed -i 's/^phase: review$/phase: implement/' "$C12B/intentions/t-rs2.md"
out12b="$(rs_sweep "$C12B" "$CACHE12B")"; rc12b=$?
entries12b=("$CACHE12B"/nodes-*.json)
n12b=0; [[ -e "${entries12b[0]}" ]] && n12b=${#entries12b[@]}

if [[ $rc12b -eq 0 ]] \
   && [[ $n12b -eq 2 ]] \
   && grep -q '^recovered t-rs1 -> fix' <<<"$out12b" \
   && ! grep -q 't-rs2' <<<"$out12b" \
   && ! grep -qE '^\s*since:' "$C12B/intentions/t-rs2.md"; then
  ok "reconcile-graph-review-stall DISPATCH_GRAPH_NODE_CACHE: an edit to the store INVALIDATES the warm entry (t-rs2 flipped off phase:review on disk is dropped from the candidate set, and the miss filed a second entry under the new key)"
else
  no "reconcile-graph-review-stall cache invalidation (rc=$rc12b entries=$n12b)"
  printf '%s\n' "$out12b"
fi

# ---------------------------------------------------------------------------
# Case 12c: still FAIL-CLOSED — a corrupt node file under a warm cache aborts
# the sweep rather than being served from the last good entry.
# ---------------------------------------------------------------------------
C12C="$WORK/t12c-clone"; rs_clone "$C12C"
CACHE12C="$WORK/t12c-cache"; mkdir -p "$CACHE12C"
rs_warm "$C12C" "$CACHE12C"
printf -- '---\n' >"$C12C/intentions/t-rs2.md"
out12c="$(rs_sweep "$C12C" "$CACHE12C")"; rc12c=$?

if [[ $rc12c -eq 1 ]] \
   && grep -q 'node enumeration failed' <<<"$out12c" \
   && ! grep -qE '^\s*since:' "$C12C/intentions/t-rs1.md"; then
  ok "reconcile-graph-review-stall DISPATCH_GRAPH_NODE_CACHE: a corrupt node file still aborts the sweep (exit 1, 'node enumeration failed') under a warm cache, and nothing is written"
else
  no "reconcile-graph-review-stall cache fail-closed (rc=$rc12c)"
  printf '%s\n' "$out12c"
fi

# ---------------------------------------------------------------------------
# Case 12d: the /dispatch-ladder path — with the variable UNSET the sweep
# self-enumerates, behaves exactly as case 10c, and writes no cache file.
# ---------------------------------------------------------------------------
C12D="$WORK/t12d-clone"; rs_clone "$C12D"
CACHE12D="$WORK/t12d-cache"; mkdir -p "$CACHE12D"
out12d="$(rs_sweep "$C12D" "")"; rc12d=$?
stray12d="$(find "$CACHE12D" -mindepth 1 | wc -l | tr -d ' ')"

if [[ $rc12d -eq 0 ]] \
   && grep -q '^recovered t-rs1 -> fix' <<<"$out12d" \
   && grep -q '^recovered t-rs2 -> fix' <<<"$out12d" \
   && grep -qE '^\s*since:' "$C12D/intentions/t-rs1.md" \
   && grep -qE '^\s*since:' "$C12D/intentions/t-rs2.md" \
   && [[ "$stray12d" == "0" ]]; then
  ok "reconcile-graph-review-stall DISPATCH_GRAPH_NODE_CACHE unset: the sweep self-enumerates unchanged (both nodes recovered, exactly case 10c) and writes no cache file"
else
  no "reconcile-graph-review-stall uncached path (rc=$rc12d, stray files=$stray12d)"
  printf '%s\n' "$out12d"
fi

# ===========================================================================
# Case 13: DISPATCH_PR_JSON_CACHE — the armed reconciler PAIR shares one
# `pulls/<n>` read across a PROCESS boundary
# (tactic-review-stall-pr-json-duplicate-fetch).
#
# reconcile-graph-review-stall's candidate set is a strict subset of
# reconcile-graph-merged's, and it skips every PR whose state is not OPEN as
# "reconcile-graph-merged's job" — so within one tick it re-reads exactly the
# PR JSON the merged sweep just read. dispatch-select-tick arms the memo across
# those two commands only, via a per-command env prefix that is NEVER exported.
#
# This is the only harness that drives both sweeps as REAL separate processes,
# which is the point: a bash associative array could not cross that boundary,
# so the shared directory is what is actually under test. `review_stall_gh_stub`
# alone is installed — `reconcile_gh_stub` serves a MERGED pr and would drive
# reconcile-graph-merged into its absorb path instead of the OPEN skip this case
# needs. The stub's inline default is OPEN and serves both surfaces, so the
# merged sweep fetches, classifies OPEN, plans nothing and exits 0, and the
# review-stall sweep then routes `fix` off the red check-runs fixture.
#
# Case 13a is the anti-vacuity control: the identical sequence with the variable
# genuinely UNSET must log TWO `/pulls/` reads and take the IDENTICAL route.
# Without it, "1" would be consistent with the sweep simply never fetching.
# ===========================================================================

T13="$WORK/t13-seed"
build_seed_repo "$T13"
for s in reconcile-graph-merged reconcile-graph-review-stall; do
  cp "$HARNESS_DIR/$s" "$T13/.claude/skills/dispatch-propagate/scripts/$s"
  chmod +x "$T13/.claude/skills/dispatch-propagate/scripts/$s"
done
# One node satisfying BOTH enumerations: phase:review is `absorbable` for the
# merged sweep, and the `reviewed` marker + null fix + OPEN pr make it a
# review-stall candidate too.
review_stall_node "$T13/intentions/t-rs1.md" t-rs1 201
new_origin t13
init_and_push "$T13"

BIN13="$WORK/t13-bin"; FIX13="$WORK/t13-fixtures"
review_stall_gh_stub "$BIN13" "$FIX13"

# rs_pair <clone> <cache-dir-or-empty> — run the two reconcilers back to back as
# two separate `bash` invocations against ONE clone, reproducing the tick's
# arming across the process boundary. An empty cache-dir runs both genuinely
# UNSET (case 13a), mirroring rs_sweep's idiom in case 12.
rs_pair() {
  local clone="$1" cache="$2"
  ( cd "$clone" || exit 99
    export PATH="$BIN13:$PATH" GC_FIXTURE_DIR="$FIX13"
    if [[ -n "$cache" ]]; then
      export DISPATCH_PR_JSON_CACHE="$cache"
    else
      unset DISPATCH_PR_JSON_CACHE
    fi
    bash .claude/skills/dispatch-propagate/scripts/reconcile-graph-merged 2>&1
    bash .claude/skills/dispatch-propagate/scripts/reconcile-graph-review-stall 2>&1 )
}

# pair_clone <dst> <argv-file> — a clone whose graph-commit records its argv,
# as case 10c's does.
pair_clone() {
  clone_with_node_modules "$1"
  cat >"$1/packages/intentionsutil/scripts/graph-commit" <<SH
#!/usr/bin/env bash
printf '%s\n' "\$@" >"$2"
exit 0
SH
  chmod +x "$1/packages/intentionsutil/scripts/graph-commit"
}

# ---------------------------------------------------------------------------
# Case 13: armed — one `/pulls/` read serves both sweeps, route unchanged.
# ---------------------------------------------------------------------------
C13="$WORK/t13-clone"; pair_clone "$C13" "$WORK/t13-argv.txt"
CACHE13="$(mktemp -d "$WORK/t13-cache.XXXXXX")"
: > "$FIX13/gh-calls.log"
out13="$(rs_pair "$C13" "$CACHE13")"; rc13=$?
pulls13="$(grep -c '/pulls/' "$FIX13/gh-calls.log" || true)"
argv13="$(cat "$WORK/t13-argv.txt" 2>/dev/null || true)"

if [[ $rc13 -eq 0 ]] \
   && [[ "$pulls13" == "1" ]] \
   && grep -q '^recovered t-rs1 -> fix' <<<"$out13" \
   && grep -qE '^\s*since:' "$C13/intentions/t-rs1.md" \
   && grep -q '^t-rs1$' <<<"$argv13"; then
  ok "DISPATCH_PR_JSON_CACHE armed: the reconciler pair shares ONE pulls/ read across the process boundary, and the cached body drives the identical fix route"
else
  no "armed reconciler pair (rc=$rc13, pulls reads=$pulls13, expected 1)"
  printf '%s\n' "$out13"
  printf 'argv: %s\n' "$argv13"
fi

# ---------------------------------------------------------------------------
# Case 13a: UNARMED mirror — two reads, identical route. Without this control
# case 13's "1" would prove nothing.
# ---------------------------------------------------------------------------
C13A="$WORK/t13a-clone"; pair_clone "$C13A" "$WORK/t13a-argv.txt"
: > "$FIX13/gh-calls.log"
out13a="$(rs_pair "$C13A" "")"; rc13a=$?
pulls13a="$(grep -c '/pulls/' "$FIX13/gh-calls.log" || true)"
argv13a="$(cat "$WORK/t13a-argv.txt" 2>/dev/null || true)"

if [[ $rc13a -eq 0 ]] \
   && [[ "$pulls13a" == "2" ]] \
   && grep -q '^recovered t-rs1 -> fix' <<<"$out13a" \
   && grep -qE '^\s*since:' "$C13A/intentions/t-rs1.md" \
   && grep -q '^t-rs1$' <<<"$argv13a"; then
  ok "DISPATCH_PR_JSON_CACHE unset: each sweep fetches its own pulls/ read (2), route identical to the armed case — the memo is a pure cost optimisation"
else
  no "unarmed reconciler pair (rc=$rc13a, pulls reads=$pulls13a, expected 2)"
  printf '%s\n' "$out13a"
  printf 'argv: %s\n' "$argv13a"
fi

# ---------------------------------------------------------------------------
# Case 14: reconcile-graph-review-stall's pin CONSTRUCTION — one `--base` pair
# per recovered id, each pinning the EXACT diagnosis-time blob, and the blob
# pinned is the one on DISK rather than origin/main's.
#
# Asserting the exact sha is the whole point. `--base` merely being present
# would also hold for a pin taken after the mutation, or for a pin read off
# origin/main — both of which look correct and protect nothing.
# ---------------------------------------------------------------------------
T14="$WORK/t14-seed"
build_seed_repo "$T14"
cp "$HARNESS_DIR/reconcile-graph-review-stall" "$T14/.claude/skills/dispatch-propagate/scripts/reconcile-graph-review-stall"
chmod +x "$T14/.claude/skills/dispatch-propagate/scripts/reconcile-graph-review-stall"
review_stall_node "$T14/intentions/t-rs1.md" t-rs1 401
review_stall_node "$T14/intentions/t-rs2.md" t-rs2 402
new_origin t14
init_and_push "$T14"

C14="$WORK/t14-clone"
clone_with_node_modules "$C14"

# Make the clone's on-disk t-rs2 differ from origin/main's, WITHOUT touching the
# clone: land an unrelated body edit on origin out-of-band, exactly as a
# concurrent writer would. The clone now lags origin on that node, so the
# disk blob and origin/main's blob are different objects and an implementation
# that pinned `origin/main:intentions/t-rs2.md` would produce a visibly
# different sha. (t-rs1 is left synced, so the case also covers the ordinary
# byte-identical path.)
D14="$WORK/t14-oob"
git clone -q "$ORIGIN" "$D14"
git -C "$D14" config user.email other@test
git -C "$D14" config user.name other
printf '\nan out-of-band edit landed on origin after the clone\n' >>"$D14/intentions/t-rs2.md"
git -C "$D14" commit -qam 'out-of-band edit to t-rs2'
git -C "$D14" push -q origin main

# The expected pins: the blobs of the files the sweep will actually READ, taken
# from the clone's working tree before it runs. No `-w` — this only has to
# compute the value the sweep is expected to produce, not publish it.
EXP14_1="$(git -C "$C14" hash-object -- intentions/t-rs1.md)"
EXP14_2="$(git -C "$C14" hash-object -- intentions/t-rs2.md)"
ORIGIN14_2="$(git -C "$C14" fetch -q origin && git -C "$C14" rev-parse origin/main:intentions/t-rs2.md)"

BIN14="$WORK/t14-bin"; FIX14="$WORK/t14-fixtures"
review_stall_gh_stub "$BIN14" "$FIX14"
cat >"$C14/packages/intentionsutil/scripts/graph-commit" <<SH
#!/usr/bin/env bash
printf '%s\n' "\$@" >"$WORK/t14-argv.txt"
exit 0
SH
chmod +x "$C14/packages/intentionsutil/scripts/graph-commit"

out14="$(
  cd "$C14" || exit 99
  export PATH="$BIN14:$PATH" GC_FIXTURE_DIR="$FIX14"
  bash .claude/skills/dispatch-propagate/scripts/reconcile-graph-review-stall 2>&1
)"; rc14=$?
argv14="$(cat "$WORK/t14-argv.txt" 2>/dev/null || true)"
nbase14="$(grep -c -- '^--base$' <<<"$argv14" || true)"

if [[ $rc14 -eq 0 ]] \
   && [[ "$nbase14" == "2" ]] \
   && grep -qx -- "t-rs1=$EXP14_1" <<<"$argv14" \
   && grep -qx -- "t-rs2=$EXP14_2" <<<"$argv14" \
   && [[ "$EXP14_2" != "$ORIGIN14_2" ]] \
   && ! grep -qx -- "t-rs2=$ORIGIN14_2" <<<"$argv14"; then
  ok "reconcile-graph-review-stall pin construction: one --base per recovered id, each pinning the exact diagnosis-time blob of the file on DISK (t-rs2's origin/main blob, which differs, is NOT what was pinned)"
else
  no "reconcile-graph-review-stall pin construction (rc=$rc14, --base count=$nbase14, expected 2)"
  printf '%s\n' "$out14"
  printf 'argv:\n%s\n' "$argv14"
  printf 'expected t-rs1=%s t-rs2=%s (origin t-rs2=%s)\n' "$EXP14_1" "$EXP14_2" "$ORIGIN14_2"
fi

# ===========================================================================
# Case 15: THE RACE for reconcile-graph-review-stall — an office_hours park
# landed between the sweep's read and its commit survives the fix-interrupt
# write. This is the case that reproduces bug X on this sweep, and the one that
# runs the REAL graph-commit (its check_base_freshness is the machinery under
# test; only `gh` is stubbed).
#
# Mechanism ported from Case 7. There is no natural injection point between the
# pin and graph-commit's fetch — they are back-to-back in one synchronous
# process — so graph-commit is moved aside to graph-commit.real and a thin
# sentinel-guarded wrapper lands the concurrent park ONCE before delegating. The
# real check_base_freshness then re-fetches, sees origin's blob no longer matches
# the pinned base, and three-way merges: office_hours is a SCALAR_FIELD this
# sweep never touches (ours == base) so scalarMerge takes THEIRS (the park
# survives), while execution.fix is unchanged on origin (theirs == base) so it
# takes OURS.
#
# REVERT U14's --base threading and this case goes red with office_hours: null
# — the exact erasure this node exists to stop.
#
# Both halves of the assertion matter: a case that only checked the park's
# survival would also pass if the sweep had landed nothing at all.
# ===========================================================================
# review_stall_race_gh_stub <bin-dir> <fixture-dir> — the stub case 15 needs,
# because it is the only review-stall case that runs the REAL graph-commit.
#
# The two consumers want OPPOSITE check-runs verdicts and both are load-bearing:
#   - the SWEEP fetches check-runs for the candidate PR's head sha and must see
#     RED, or reviewStallRoute never returns `fix` and nothing is written;
#   - GRAPH-COMMIT fetches check-runs for its own scratch landing commit and must
#     see GREEN, or its required-check gate die()s and nothing is landed.
# review_stall_gh_stub answers RED to everything, which is why cases 10a-13a
# (all of which stub graph-commit out entirely) can share it and this case
# cannot.
#
# The discriminator is `--jq`, not the sha: graph-commit always passes its
# required-check filter as `--jq <prog>`, and the sweep's dispatch_ci_verdict_rest
# never does (it takes --paginate and applies its own jq downstream). So a call
# carrying --jq is graph-commit's gate and is answered from the all-green fixture
# by running graph-commit's REAL --jq program against it, exactly as
# reconcile_gh_stub does; a call without one is the sweep's CI verdict fetch and
# is answered red. Keying on the sha instead would couple the fixture to
# review_stall_gh_stub's `"deadbeef" + <pr>` head-sha convention for no gain.
review_stall_race_gh_stub() {
  local bindir="$1" fixdir="$2"
  mkdir -p "$bindir" "$fixdir"
  cat >"$fixdir/checkruns-red.json" <<'JSON'
{"check_runs": [
  {"name": "unit-tests", "status": "completed", "conclusion": "failure", "id": 1, "app": {"slug": "github-actions"}}
]}
JSON
  cat >"$fixdir/green.json" <<'JSON'
{"check_runs": [
  {"name": "acceptance", "status": "completed", "conclusion": "success", "id": 1, "app": {"slug": "github-actions"}},
  {"name": "preview-and-smoke", "status": "completed", "conclusion": "success", "id": 2, "app": {"slug": "github-actions"}},
  {"name": "lint", "status": "completed", "conclusion": "success", "id": 3, "app": {"slug": "github-actions"}},
  {"name": "unit-tests", "status": "completed", "conclusion": "success", "id": 4, "app": {"slug": "github-actions"}}
]}
JSON
  cat >"$bindir/gh" <<'SH'
#!/usr/bin/env bash
path=""
jq_program=""
prev=""
for a in "$@"; do
  case "$prev" in
    --jq) jq_program="$a" ;;
  esac
  case "$a" in
    */pulls/*|*/check-runs) path="$a" ;;
  esac
  prev="$a"
done
echo "$path" >> "$GC_FIXTURE_DIR/gh-calls.log"
case "$path" in
  */check-runs)
    if [[ -n "$jq_program" ]]; then
      # graph-commit's required-check gate — its own landing commit is green.
      jq -r "$jq_program" "$GC_FIXTURE_DIR/green.json"
    else
      # the sweep's CI verdict for the candidate PR — red, which is what makes
      # the node route to `fix` in the first place.
      cat "$GC_FIXTURE_DIR/checkruns-red.json"
    fi ;;
  */pulls/*)
    num="${path##*/}"
    jq -n --argjson n "$num" '{
      number: $n, title: "harness pr", body: "",
      state: "open",
      merged_at: null,
      merge_commit_sha: null,
      mergeable: true, mergeable_state: "clean",
      head: {ref: "harness-branch", sha: ("deadbeef" + ($n | tostring))},
      labels: []
    }' ;;
  *)
    echo "gh stub: unhandled invocation: $*" >&2; exit 1 ;;
esac
SH
  chmod +x "$bindir/gh"
}

T15="$WORK/t15-seed"
build_seed_repo "$T15"
cp "$HARNESS_DIR/reconcile-graph-review-stall" "$T15/.claude/skills/dispatch-propagate/scripts/reconcile-graph-review-stall"
chmod +x "$T15/.claude/skills/dispatch-propagate/scripts/reconcile-graph-review-stall"
review_stall_node "$T15/intentions/t-rs-race.md" t-rs-race 415

# The concurrent-park wrapper is installed in the SEED and pushed, so the clone
# sits EXACTLY at origin/main. Load-bearing, not tidiness — see Case 7's note:
# installing it in the clone instead requires committing it (graph-commit's
# assert_clean_outside_ids refuses to start on a dirty tracked file), and that
# commit makes the worktree "ahead of origin/main with non-intentions changes",
# so graph-commit takes its ensure_intentions_only_base() `git reset --hard
# FETCH_HEAD` path and DISCARDS the file check_base_freshness just merged. The
# case would then fail for a reason unrelated to the code under test.
mv "$T15/packages/intentionsutil/scripts/graph-commit" \
   "$T15/packages/intentionsutil/scripts/graph-commit.real"
cat >"$T15/packages/intentionsutil/scripts/graph-commit" <<'SH'
#!/usr/bin/env bash
set -uo pipefail
SD="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [[ ! -f "$SD/.concurrent-landed" ]]; then
  # Another writer (an office-hours park, a main-qa pass) lands an office_hours
  # park on the SAME node AFTER the sweep pinned its base but before this land.
  D="$(mktemp -d)"
  git clone -q "$GC_ORIGIN" "$D"
  git -C "$D" config user.email other@test
  git -C "$D" config user.name other
  awk '
    /^office_hours: null$/ {
      print "office_hours:"
      print "  reason: concurrent park landed between the sweep read and its commit"
      print "  since: 2026-08-05"
      print "  recommendation: harness fixture park"
      print "  session_type: other"
      next
    }
    { print }
  ' "$D/intentions/$GC_NODE.md" >"$D/intentions/$GC_NODE.md.new"
  mv "$D/intentions/$GC_NODE.md.new" "$D/intentions/$GC_NODE.md"
  git -C "$D" commit -qam 'concurrent office_hours park (bypassing the sweep)'
  git -C "$D" push -q origin main
  rm -rf "$D"
  # Fast-forward THIS checkout's HEAD onto the park commit while leaving the
  # working-tree node file (the sweep's --set-fix edit, written from a read that
  # predates the park) untouched. `--mixed`, never `--hard`, is the crux:
  #
  # If HEAD stays behind, graph-commit's push is rejected, it rebases, git
  # reports a textual conflict on the node file, and layer-2's field-level
  # auto-merge rescues the park all by itself — the park survives with or
  # without --base and the case proves nothing. Production erasures had no
  # conflict to rescue: the park commit was ALREADY in the new commit's
  # ancestry, so the sweep's whole-file rewrite from its stale in-memory read
  # fast-forwarded cleanly and silently dropped the park. `reset --mixed` puts
  # the checkout in exactly that state, leaving --base as the ONLY thing that
  # can still catch the lost update.
  git -C "$GC_CLONE" fetch -q origin main
  git -C "$GC_CLONE" reset -q --mixed FETCH_HEAD
  : >"$SD/.concurrent-landed"
fi
exec "$SD/graph-commit.real" "$@"
SH
chmod +x "$T15/packages/intentionsutil/scripts/graph-commit"
chmod +x "$T15/packages/intentionsutil/scripts/graph-commit.real"
new_origin t15
init_and_push "$T15"

C15="$WORK/t15-clone"
clone_with_node_modules "$C15"
BIN15="$WORK/t15-bin"; FIX15="$WORK/t15-fixtures"
review_stall_race_gh_stub "$BIN15" "$FIX15"

# No RECON_ENV here, deliberately: unlike reconcile-graph-merged this sweep has
# no time-based candidate filter. Its only MAX_HOLD_SECONDS references are prose
# about the dispatch lock heartbeat (refresh_lock), which gates lock reclamation
# and never eligibility. Cases 10a-13a export none either, and they pass.
out15="$(
  cd "$C15" || exit 99
  export PATH="$BIN15:$PATH" GC_FIXTURE_DIR="$FIX15"
  export GC_ORIGIN="$ORIGIN" GC_NODE=t-rs-race GC_CLONE="$C15"
  export GRAPH_COMMIT_CHECK_POLL_SECONDS=1 GRAPH_COMMIT_CHECK_TIMEOUT_SECONDS=20
  bash .claude/skills/dispatch-propagate/scripts/reconcile-graph-review-stall 2>&1
)"; rc15=$?

landed15="$(git -C "$C15" fetch -q origin && git -C "$C15" show origin/main:intentions/t-rs-race.md)"
if [[ $rc15 -eq 0 ]] \
   && grep -q 'concurrent park landed between the sweep read and its commit' <<<"$landed15" \
   && grep -qE '^\s*since: 2026-08-05' <<<"$landed15" \
   && grep -q '^recovered t-rs-race -> fix' <<<"$out15" \
   && [[ "$(grep -cE '^\s*since:' <<<"$landed15")" -ge 2 ]]; then
  ok "reconcile-graph-review-stall CAS race: a concurrently landed office_hours park SURVIVES the fix-interrupt sweep while the sweep's own execution.fix write still lands"
else
  no "reconcile-graph-review-stall CAS race (rc=$rc15)"
  printf '%s\n' "$out15"
  printf 'landed:\n%s\n' "$landed15"
fi

echo
echo "passed: $PASS  failed: $FAIL"
[[ $FAIL -eq 0 ]] || exit 1
exit 0
