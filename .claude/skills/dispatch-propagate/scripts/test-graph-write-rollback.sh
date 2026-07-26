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
#   5. transition-node evidence binding (tactic-phase-evidence-fingerprint-bound
#      Unit 2): a node with a MATCHING phase-start scope-fingerprint stamp file
#      transitions cleanly (graph-commit stubbed to succeed) and the landed
#      completion marker carries the bound `{marker, fingerprint, sha}` object
#      form, with the fingerprint equal to the STAMP's value.
#   6. transition-node evidence binding, no-stamp case: with NO stamp file
#      present, the same transition still succeeds but the landed marker stays
#      the legacy bare-string (unbound) form — the no-regression check.
#   7. transition-node broken evidence chain (tactic-phase-evidence-fingerprint-
#      bound Unit 3): a phase:review node carrying a `qa-done` marker BOUND to a
#      fingerprint that no longer matches its body demotes to implement instead
#      of transitioning — the outcome line names the broken chain, graph-commit
#      is never called for a transition, and the tree is left clean.
#
# No network needed; requires bash + git + jq + a real node/npx tsx (resolved
# against a read-only node_modules symlink to this repo's own — never written).
set -uo pipefail

HARNESS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REAL_REPO_ROOT="$(cd "$HARNESS_DIR/../../../.." && pwd)"
UTIL_SCRIPTS_SRC="$REAL_REPO_ROOT/packages/intentionsutil/scripts"
INTENTIONSUTIL_SRC="$REAL_REPO_ROOT/packages/intentionsutil/src"

for f in transition-node dispatch-graph-census dispatch-graph-main-red-sync lib.sh dispatch-config-load; do
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

succeed_graph_commit() { # <dir> — replace graph-commit with a no-op success, so
  # the local mutation apply-node-transition.ts already wrote stays in place
  # (uncommitted) and can be asserted on directly, without a real push.
  cat >"$1/packages/intentionsutil/scripts/graph-commit" <<'SH'
#!/usr/bin/env bash
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
cat >"$T3/intentions/tactic-main-red-abc1234.md" <<'NODE'
---
id: tactic-main-red-abc1234
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
   && grep -q '^tactic-main-red-abc1234$' <<<"$stdout_out" \
   && grep -q 'completion of tactic-main-red-abc1234 failed; write rolled back' <<<"$stderr_out" \
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
cat >"$T4/intentions/tactic-main-red-aaa1111.md" <<'NODE'
---
id: tactic-main-red-aaa1111
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
cat >"$C4/intentions/tactic-main-red-bbb2222.md" <<'NODE'
---
id: tactic-main-red-bbb2222
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
git -C "$C4" add intentions/tactic-main-red-bbb2222.md
git -C "$C4" commit -qm 'local-only latch node absent from origin'

stdout_out="$(
  cd "$C4" || exit 99
  bash .claude/skills/dispatch-propagate/scripts/dispatch-graph-main-red-sync 2>"$WORK/t4-stderr.log"
)"
rc=$?
stderr_out="$(cat "$WORK/t4-stderr.log")"
status_after="$(git -C "$C4" status --porcelain intentions/)"
if [[ "$rc" -eq 0 ]] \
   && grep -q 'intentions/tactic-main-red-bbb2222.md does not exist on origin/main' <<<"$stderr_out" \
   && grep -q 'skipping tactic-main-red-bbb2222' <<<"$stderr_out" \
   && grep -q 'completion of tactic-main-red-aaa1111 failed; write rolled back' <<<"$stderr_out" \
   && [[ -z "$status_after" ]]; then
  ok "dispatch-graph-main-red-sync: a node absent from origin/main is skipped (no mutation, stderr names it) while the loop still processes the present node"
else
  no "dispatch-graph-main-red-sync origin-absent refusal guard (rc=$rc)"
  printf 'stdout: %s\n' "$stdout_out"; printf 'stderr: %s\n' "$stderr_out"
  printf 'status: %s\n' "$status_after"
fi

# ===========================================================================
# Case 5: transition-node binds a newly-written completion marker to the
# phase-start scope-fingerprint STAMP (tactic-phase-evidence-fingerprint-bound
# Unit 2). A matching stamp file is seeded; graph-commit is stubbed to SUCCEED
# (a no-op) so the real apply-node-transition.ts mutation stays on disk,
# uncommitted, and is asserted on directly.
# ===========================================================================
T5="$WORK/t5-seed"
build_seed_repo "$T5"
cp "$HARNESS_DIR/transition-node" "$T5/.claude/skills/dispatch-propagate/scripts/transition-node"
chmod +x "$T5/.claude/skills/dispatch-propagate/scripts/transition-node"
NODE5_STATEMENT="harness node for evidence-fingerprint binding test"
cat >"$T5/intentions/t-evidence-bound.md" <<NODE
---
id: t-evidence-bound
kind: tactic
statement: $NODE5_STATEMENT
owner: ai
status: codified
phase: implement
serves: []
execution: null
---
# harness node for evidence-fingerprint binding test
NODE
new_origin t5
init_and_push "$T5"

C5="$WORK/t5-clone"
clone_with_node_modules "$C5"
succeed_graph_commit "$C5"

# Compute the REAL tacticScopeFingerprint the gate will compare against, over
# the exact statement + body just committed to origin/main, then seed a
# matching stamp file at the path transition-node reads (MAIN_ROOT resolves to
# $C5 itself here — resolve_project_root's git-common-dir dirname of a plain
# clone).
FP5="$(
  cd "$C5" || exit 99
  node --import tsx/esm -e '
    const { readNode, readNodeBody } = await import("./packages/intentionsutil/src/store.js");
    const { tacticScopeFingerprint } = await import("./packages/intentionsutil/src/router.js");
    const id = process.argv[1];
    process.stdout.write(tacticScopeFingerprint(readNode("./intentions", id).statement, readNodeBody("./intentions", id)));
  ' t-evidence-bound
)"
SHA5="$(git -C "$C5" rev-parse origin/main)"
mkdir -p "$C5/.claude/worktrees"
printf '%s %s\n' "$FP5" "$SHA5" > "$C5/.claude/worktrees/t-evidence-bound.scope-fingerprint"

out="$(
  cd "$C5" || exit 99
  bash .claude/skills/dispatch-propagate/scripts/transition-node t-evidence-bound 2>&1
)"; rc=$?
marker_shape="$(node --import tsx/esm -e '
  const { readNode } = await import("'"$C5"'/packages/intentionsutil/src/store.js");
  const node = readNode("'"$C5"'/intentions", "t-evidence-bound");
  process.stdout.write(JSON.stringify(node.execution?.markers ?? []));
')"
if [[ $rc -eq 0 ]] \
   && grep -q "^transitioned t-evidence-bound implement -> qa$" <<<"$out" \
   && jq -e --arg fp "$FP5" '
        length == 1 and .[0].marker == "planned" and .[0].fingerprint == $fp and (.[0].sha | length > 0)
      ' >/dev/null <<<"$marker_shape"; then
  ok "transition-node evidence binding: the landed marker is bound to the phase-start stamp's fingerprint"
else
  no "transition-node evidence binding (rc=$rc)"
  printf '%s\n' "$out"; printf 'markers: %s\n' "$marker_shape"
fi

# ===========================================================================
# Case 6: transition-node with NO stamp file present still writes the legacy
# bare-string (unbound) marker form — the no-regression check
# (tactic-phase-evidence-fingerprint-bound Unit 2).
# ===========================================================================
T6="$WORK/t6-seed"
build_seed_repo "$T6"
cp "$HARNESS_DIR/transition-node" "$T6/.claude/skills/dispatch-propagate/scripts/transition-node"
chmod +x "$T6/.claude/skills/dispatch-propagate/scripts/transition-node"
cat >"$T6/intentions/t-no-stamp.md" <<'NODE'
---
id: t-no-stamp
kind: tactic
statement: harness node with no phase-start stamp file
owner: ai
status: codified
phase: implement
serves: []
execution: null
---
# harness node with no phase-start stamp file
NODE
new_origin t6
init_and_push "$T6"

C6="$WORK/t6-clone"
clone_with_node_modules "$C6"
succeed_graph_commit "$C6"
# Deliberately no .claude/worktrees/t-no-stamp.scope-fingerprint stamp file.

out="$(
  cd "$C6" || exit 99
  bash .claude/skills/dispatch-propagate/scripts/transition-node t-no-stamp 2>&1
)"; rc=$?
marker_shape="$(node --import tsx/esm -e '
  const { readNode } = await import("'"$C6"'/packages/intentionsutil/src/store.js");
  const node = readNode("'"$C6"'/intentions", "t-no-stamp");
  process.stdout.write(JSON.stringify(node.execution?.markers ?? []));
')"
if [[ $rc -eq 0 ]] \
   && grep -q "^transitioned t-no-stamp implement -> qa$" <<<"$out" \
   && [[ "$marker_shape" == '["planned"]' ]]; then
  ok "transition-node no-stamp: the landed marker stays the legacy bare-string (unbound) form (no regression)"
else
  no "transition-node no-stamp no-regression (rc=$rc)"
  printf '%s\n' "$out"; printf 'markers: %s\n' "$marker_shape"
fi

# ===========================================================================
# Case 7: transition-node refuses to ratify a BROKEN EVIDENCE CHAIN at the
# review seam (tactic-phase-evidence-fingerprint-bound Unit 3). The node sits at
# phase:review carrying a `qa-done` marker bound to a fingerprint that does NOT
# match its current statement+body — the qa evidence certifies a scope the
# tactic has since moved off. transition-node must delegate to
# demote-node-to-implement (stubbed here, recording its argv) BEFORE any
# mutation, print the broken-evidence-chain outcome line, never invoke
# graph-commit for a transition, and leave the tree clean.
# ===========================================================================
T7="$WORK/t7-seed"
build_seed_repo "$T7"
cp "$HARNESS_DIR/transition-node" "$T7/.claude/skills/dispatch-propagate/scripts/transition-node"
chmod +x "$T7/.claude/skills/dispatch-propagate/scripts/transition-node"
cat >"$T7/intentions/t-broken-chain.md" <<'NODE'
---
id: t-broken-chain
kind: tactic
statement: harness node for the broken evidence chain test
owner: ai
status: codified
phase: review
serves: []
execution:
  branch: t-broken-chain
  pr: null
  attempts: {}
  markers:
    - marker: qa-done
      fingerprint: "0000000000000000000000000000000000000000000000000000000000000000"
      sha: cafe1234
  strategy_fingerprint: null
---
# harness node for the broken evidence chain test
NODE
new_origin t7
init_and_push "$T7"

C7="$WORK/t7-clone"
clone_with_node_modules "$C7"
# graph-commit is stubbed to RECORD any invocation: the assertion is that the
# demote path short-circuits before transition-node ever lands a transition.
cat >"$C7/packages/intentionsutil/scripts/graph-commit" <<SH
#!/usr/bin/env bash
printf '%s\n' "\$*" >>"$WORK/t7-graph-commit.log"
exit 0
SH
chmod +x "$C7/packages/intentionsutil/scripts/graph-commit"
# demote-node-to-implement is stubbed (the real one commits and comments on a
# PR); it records the node id it was handed.
cat >"$C7/packages/intentionsutil/scripts/demote-node-to-implement" <<SH
#!/usr/bin/env bash
printf '%s\n' "\$1" >>"$WORK/t7-demote.log"
exit 0
SH
chmod +x "$C7/packages/intentionsutil/scripts/demote-node-to-implement"

out="$(
  cd "$C7" || exit 99
  bash .claude/skills/dispatch-propagate/scripts/transition-node t-broken-chain 2>&1
)"; rc=$?
demote_log="$(cat "$WORK/t7-demote.log" 2>/dev/null)"
commit_log="$(cat "$WORK/t7-graph-commit.log" 2>/dev/null)"
status_after="$(git -C "$C7" status --porcelain intentions/)"
if [[ $rc -eq 0 ]] \
   && grep -q "^demoted t-broken-chain -> implement (broken evidence chain: qa-done)$" <<<"$out" \
   && [[ "$demote_log" == "t-broken-chain" ]] \
   && [[ -z "$commit_log" ]] \
   && [[ -z "$status_after" ]]; then
  ok "transition-node broken evidence chain: a review-phase node whose qa-done marker is bound to a superseded scope demotes to implement without any transition write"
else
  no "transition-node broken evidence chain (rc=$rc)"
  printf '%s\n' "$out"
  printf 'demote-log: %s\n' "$demote_log"
  printf 'graph-commit-log: %s\n' "$commit_log"
  printf 'status: %s\n' "$status_after"
fi

echo
echo "passed: $PASS  failed: $FAIL"
[[ $FAIL -eq 0 ]] || exit 1
exit 0
