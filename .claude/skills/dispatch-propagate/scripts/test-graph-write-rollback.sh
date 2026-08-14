#!/usr/bin/env bash
#
# test-graph-write-rollback.sh — functional harness for the write-failure
# rollback added to transition-node, dispatch-census-tick, and
# dispatch-graph-main-red-sync (tactic-graph-write-failure-rollback Units
# 2/4/5; tactic-census-scripted-tick). Each case forces a
# downstream `graph-commit` to fail AFTER the script's own mutation already
# landed on disk, then asserts the mutation was rolled back — a clean
# intentions/ tree, never a leaked dirty/deleted file that would trip
# graph-commit's assert_clean_outside_ids guard for every other unrelated
# node.
#
# Mirrors packages/intentionsutil/scripts/test-park-node.sh's harness shape: a
# throwaway bare origin + a real git clone, with the REAL
# packages/intentionsutil/src copied in (plus its package.json for ESM
# resolution) and a node_modules SYMLINK to this repo's own — so the real
# TypeScript mutation primitives (apply-node-transition.ts, compute-freshness.ts,
# dump-node.ts, write-node.ts, census-tick.ts +
# census-decide.ts) execute for real, not via a shim. Only graph-commit itself and (for the main-red-sync case) repo-health
# are stubbed, standing in for a real land failure / a green main.
#
# Covers:
#   1. transition-node: a graph-commit failure after apply-node-transition.ts's
#      real write rolls intentions/<id>.md back to origin/main (byte-identical
#      `git diff` against the clone's HEAD).
#   2. dispatch-census-tick BATCH rollback: census-tick.ts mutates intentions/
#      for real before the wrapper's single batched graph-commit runs — an
#      rmSync per prune, a writeNode per inbound blocked_by edge repair, a
#      writeNode + body splice per minted defect node. A graph-commit failure
#      after all three kinds of write must revert the WHOLE batch (deleted node
#      restored, edited node byte-identical to HEAD, minted defect file gone) and
#      still surface a non-empty stderr diagnostic — dispatch-select-tick's
#      call site swallows the exit code (`|| true`), so the tick log is the only
#      operator-facing signal.
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
#   10. `reconcile-graph-review-stall --node <id>` (tactic-dispatch-ladder-skill
#       Unit 6b): the same selection filter as case 6b, mirrored onto this
#       sweep's sibling. --node narrows to the named node and leaves an
#       otherwise-equally-eligible sibling untouched; an unknown id acts on
#       nothing; the unflagged sweep still acts on every eligible candidate.
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

for f in transition-node dispatch-census-tick dispatch-graph-main-red-sync lib.sh dispatch-config-load; do
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
  cp "$UTIL_SCRIPTS_SRC/census-tick.ts" "$dst/packages/intentionsutil/scripts/census-tick.ts"
  cp "$UTIL_SCRIPTS_SRC/census-decide.ts" "$dst/packages/intentionsutil/scripts/census-decide.ts"
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
# Case 2: dispatch-census-tick batch rollback on graph-commit failure
# (tactic-census-scripted-tick).
#
# The retired dispatch-graph-census had ONE born node to delete on failure; the
# scripted census tick's blast radius is a whole BATCH — census-tick.ts rmSyncs
# every prunable node, rewrites every node whose inbound blocked_by named one,
# and writes+splices a fresh defect node per unverifiable done node, all before
# the wrapper's single graph-commit runs. The seed below makes the plan contain
# one of each:
#
#   t-census-pruned   phase:done, completion mergedAt+mergeCommitSha  -> PRUNE
#   t-census-blocked  open, blocked_by: [t-census-pruned]             -> EDIT
#   t-census-broken   phase:done, execution:null (unverifiable)       -> MINT
#
# graph-commit is stubbed to fail, so the wrapper must revert all three writes.
# ===========================================================================
T2="$WORK/t2-seed"
build_seed_repo "$T2"
cp "$HARNESS_DIR/dispatch-census-tick" "$T2/.claude/skills/dispatch-propagate/scripts/dispatch-census-tick"
chmod +x "$T2/.claude/skills/dispatch-propagate/scripts/dispatch-census-tick"
# (a) verifiably-complete done node -> pruned (file deleted).
cat >"$T2/intentions/t-census-pruned.md" <<'NODE'
---
id: t-census-pruned
kind: tactic
statement: a done node whose completion verifies mechanically
owner: ai
status: codified
phase: done
serves: []
execution:
  branch: t-census-pruned
  pr: 4242
  attempts: {}
  markers: []
  strategy_fingerprint: null
  fix: null
  completion:
    mergedAt: "2026-07-25T18:21:49Z"
    mergeCommitSha: dee357ae4d77018525a3a6a07a0adf0c71fa3cca
    graphCommitSha: null
---
# a done node whose completion verifies mechanically
NODE
# (b) open node whose inbound blocked_by names (a) -> edge-repair rewrite.
cat >"$T2/intentions/t-census-blocked.md" <<'NODE'
---
id: t-census-blocked
kind: tactic
statement: an open node blocked by the node census is about to prune
owner: ai
status: codified
phase: implement
serves: []
execution: null
blocked_by:
  - t-census-pruned
---
# an open node blocked by the node census is about to prune
NODE
# (c) done node with no execution -> integrity defect, freshly minted.
cat >"$T2/intentions/t-census-broken.md" <<'NODE'
---
id: t-census-broken
kind: tactic
statement: a done node with no execution record at all
owner: ai
status: codified
phase: done
serves: []
execution: null
---
# a done node with no execution record at all
NODE
new_origin t2
init_and_push "$T2"

C2="$WORK/t2-clone"
clone_with_node_modules "$C2"
fail_graph_commit "$C2"
# census-tick.ts's defectIdFor(): strip a leading `tactic-`/`strategy-`, prefix
# `tactic-census-defect-`. `t-census-broken` carries neither prefix, so the id
# is the whole target id appended.
DEFECT_ID="tactic-census-defect-t-census-broken"

stdout_out="$(
  cd "$C2" || exit 99
  bash .claude/skills/dispatch-propagate/scripts/dispatch-census-tick 2>"$WORK/t2-stderr.log"
)"; rc=$?
stderr_out="$(cat "$WORK/t2-stderr.log")"
status_after="$(git -C "$C2" status --porcelain intentions/)"
# The `prune 1, edge-repair 1, mint 1` match below is the teeth guard: it proves
# the plan really was a three-way batch rather than a degenerate one-op tick
# whose rollback would prove nothing.
if [[ $rc -ne 0 ]] \
   && [[ -n "$stderr_out" ]] \
   && grep -q 'graph-commit failed' <<<"$stderr_out" \
   && grep -q 'rolled back' <<<"$stderr_out" \
   && grep -q 'prune 1, edge-repair 1, mint 1' <<<"$stderr_out" \
   && [[ -z "$status_after" ]] \
   && [[ -f "$C2/intentions/t-census-pruned.md" ]] \
   && [[ ! -e "$C2/intentions/$DEFECT_ID.md" ]]; then
  ok "dispatch-census-tick batch rollback: a graph-commit failure reverts the whole batch (pruned node restored, edge-repair edit reverted, minted defect removed) and names the failure on stderr"
else
  no "dispatch-census-tick batch rollback (rc=$rc)"
  printf 'stdout: %s\n' "$stdout_out"; printf 'stderr: %s\n' "$stderr_out"
  printf 'status: %s\n' "$status_after"
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
   && grep -q 'discarded by resetting to' <<<"$out" \
   && ! grep -q 'rolled the apply run.s node writes back' <<<"$out"; then
  ok "reconcile-graph-merged busy-main rollback: an un-landed commit graph-commit left on HEAD is discarded (HEAD restored, node un-mutated) instead of being reported as a rollback"
else
  no "reconcile-graph-merged busy-main rollback (rc=$rc, head moved: $([[ "$head9_after" == "$head9_before" ]] && echo no || echo yes))"
  printf '%s\n' "$out"
  printf 'status: %s\n' "$status9"
  printf 'node:\n%s\n' "$node9_after"
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

echo
echo "passed: $PASS  failed: $FAIL"
[[ $FAIL -eq 0 ]] || exit 1
exit 0
