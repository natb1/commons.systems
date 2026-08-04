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
# dump-node.ts, write-node.ts, graph-census-debt.ts, census-tick.ts +
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
  cp "$UTIL_SCRIPTS_SRC/graph-census-debt.ts" "$dst/packages/intentionsutil/scripts/graph-census-debt.ts"
  cp "$UTIL_SCRIPTS_SRC/census-tick.ts" "$dst/packages/intentionsutil/scripts/census-tick.ts"
  cp "$UTIL_SCRIPTS_SRC/census-decide.ts" "$dst/packages/intentionsutil/scripts/census-decide.ts"
  cp "$UTIL_SCRIPTS_SRC/restamp-scope-fingerprint.ts" "$dst/packages/intentionsutil/scripts/restamp-scope-fingerprint.ts"
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

echo
echo "passed: $PASS  failed: $FAIL"
[[ $FAIL -eq 0 ]] || exit 1
exit 0
