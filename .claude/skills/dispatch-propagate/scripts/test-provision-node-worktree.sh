#!/usr/bin/env bash
# Script-level test harness for provision-node-worktree — the graph lane's
# one-command worktree provisioning primitive
# (tactic-provision-exit11-worktree-residue, Unit 2).
#
# DELIBERATE DEVIATION: the node's own Verification section and the sibling
# node intentions/tactic-provision-worktree-script-tests.md both name
# test-dispatch-scripts.sh as the target file for this coverage.
# test-dispatch-scripts.sh is a `gh`-stub harness with NO git-worktree
# fixtures, and forcing worktree fixtures into it would be worse for both
# tactics than one purpose-built file. This new file is that purpose-built
# host; it also creates the fixture scaffolding
# tactic-provision-worktree-script-tests can extend for the
# check-node-selection gate-plumbing coverage (arg forwarding, exit 12/13
# pass-through, stamp write) that this file does NOT cover. That sibling
# node's frontmatter `statement` has been updated to name this file instead
# of test-dispatch-scripts.sh, so the two nodes point at the same host.
#
# Covers the three defects fixed in Unit 1 of
# intentions/tactic-provision-exit11-worktree-residue.md:
#   - Defect 1: an unusable worktree (dirty tracked tree, in-progress
#     rebase/merge, detached HEAD) must exit 14, never fall through to the
#     exit-11 conflict lane.
#   - Defect 2: a stale LOCAL branch must not shadow the pushed
#     origin/<node-id> tip.
#   - Defect 3: orphan `.git/worktrees/<name>` registrations must be pruned
#     so a re-provision of a manually-removed worktree succeeds.
#
# Harness (modeled on
# .claude/skills/dispatch-propagate/scripts/test-dispatch-graph-execute.sh:39-119):
# a bare origin repo + a `main` checkout (PROJECT_ROOT), with
# DISPATCH_GRAPH_MAIN_WORKTREE pointing at it so
# lib-graph-worktree.sh's resolve_main_worktree skips `git worktree list`.
# The SUT and lib-graph-worktree.sh are copied into a scratch scripts dir so
# "$SCRIPT_DIR/dispatch-ci-ready" resolves to a stub sibling (the CI gate is
# not under test). PATH shims stand in for `npx` (the SUT's
# check-node-selection.ts gate call — the shim ignores its args and always
# prints a fixed fingerprint) and `direnv` (both subcommands exit 0). Does
# NOT cover the check-node-selection gate plumbing itself (arg forwarding,
# exit 12/13, stamp contents) — that is
# tactic-provision-worktree-script-tests.
#
# Assertion helpers (assert_eq, assert_contains, report_results) come from
# test-helpers.sh.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd -P)"
# shellcheck source=/dev/null
source "$SCRIPT_DIR/test-helpers.sh"

# --- harness ------------------------------------------------------------
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT

ORIGIN="$TMP/origin.git"
MAIN_WT="$TMP/main"
SUT_DIR="$TMP/scripts"
BIN_DIR="$TMP/bin"
STDERR_FILE="$TMP/stderr.log"

mkdir -p "$SUT_DIR" "$BIN_DIR"

git init -q --bare "$ORIGIN"
git clone -q "$ORIGIN" "$MAIN_WT"
git -C "$MAIN_WT" symbolic-ref HEAD refs/heads/main
git -C "$MAIN_WT" config user.email test@example.com
git -C "$MAIN_WT" config user.name "Test User"
echo "seed" >"$MAIN_WT/README.md"
git -C "$MAIN_WT" add README.md
git -C "$MAIN_WT" commit -q -m "seed"
git -C "$MAIN_WT" push -q -u origin main
mkdir -p "$MAIN_WT/.claude/worktrees"

# provision-node-worktree now materializes its OWN intentions/ snapshot via
# `git archive origin/main intentions` (tactic-graph-execute-fresh-main-read
# Unit 2) — origin/main needs a tracked intentions/ tree for that archive to
# succeed, even though the npx shim below never reads its contents.
mkdir -p "$MAIN_WT/intentions"
echo "placeholder" >"$MAIN_WT/intentions/.gitkeep"
git -C "$MAIN_WT" add intentions/.gitkeep
git -C "$MAIN_WT" commit -q -m "seed intentions/"
git -C "$MAIN_WT" push -q origin main

export DISPATCH_GRAPH_MAIN_WORKTREE="$MAIN_WT"

# Copy the SUT and its sourced libs so "$SCRIPT_DIR/<name>" inside the copy
# resolves to the stub sibling below.
cp "$SCRIPT_DIR/provision-node-worktree" "$SUT_DIR/provision-node-worktree"
cp "$SCRIPT_DIR/lib-graph-worktree.sh" "$SUT_DIR/lib-graph-worktree.sh"
cp "$SCRIPT_DIR/lib-worktree-residue.sh" "$SUT_DIR/lib-worktree-residue.sh"
cp "$SCRIPT_DIR/lib-main-snapshot.sh" "$SUT_DIR/lib-main-snapshot.sh"
chmod +x "$SUT_DIR/provision-node-worktree"

# dispatch-ci-ready stub: the CI gate is not under test here.
cat >"$SUT_DIR/dispatch-ci-ready" <<'STUB'
#!/usr/bin/env bash
exit 0
STUB
chmod +x "$SUT_DIR/dispatch-ci-ready"

# npx shim: the SUT runs `npx tsx …/check-node-selection.ts …`. It reports a
# fixed passing fingerprint, but it EMULATES the one gate policy this file
# exercises (tactic-graph-execute-fresh-main-read Unit 5): provenance missing
# its `--snapshot-fetched-at` attestation is unknown-freshness, which refuses
# with exit 15 unless `--allow-stale` was forwarded. Everything else about the
# gate stays out of scope here.
cat >"$BIN_DIR/npx" <<'STUB'
#!/usr/bin/env bash
HAS_FETCHED_AT=0
ALLOW_STALE=0
for arg in "$@"; do
  case "$arg" in
    --snapshot-fetched-at) HAS_FETCHED_AT=1 ;;
    --allow-stale) ALLOW_STALE=1 ;;
  esac
done
if [[ "$HAS_FETCHED_AT" -eq 0 && "$ALLOW_STALE" -eq 0 ]]; then
  echo "unknown-freshness: no snapshot provenance was supplied by the caller" >&2
  exit 15
fi
echo "test-fixed-fingerprint"
exit 0
STUB
chmod +x "$BIN_DIR/npx"

# direnv shim: `direnv allow` / `direnv exec … true` both no-op successfully,
# and each invocation is journalled so a test can assert the .envrc gate
# refused BEFORE anything approved or executed the file.
DIRENV_LOG="$TMP/direnv.log"
: >"$DIRENV_LOG"
cat >"$BIN_DIR/direnv" <<STUB
#!/usr/bin/env bash
printf '%s\n' "\$*" >>"$DIRENV_LOG"
exit 0
STUB
chmod +x "$BIN_DIR/direnv"

wt_path() { printf '%s/.claude/worktrees/%s\n' "$MAIN_WT" "$1"; }

# add_commit_on_branch <branch> <file> <content> <msg> — commit onto an
# EXISTING local branch via a throwaway linked worktree (so $MAIN_WT itself
# never leaves `main`).
add_commit_on_branch() {
  local branch="$1" file="$2" content="$3" msg="$4"
  local scratch="$TMP/setup-$branch"
  git -C "$MAIN_WT" worktree add -q "$scratch" "$branch"
  printf '%s\n' "$content" >"$scratch/$file"
  git -C "$scratch" add "$file"
  git -C "$scratch" commit -q -m "$msg"
  git -C "$MAIN_WT" worktree remove --force "$scratch"
}

# create_branch_with_commit <branch> <base> <file> <content> <msg> — create a
# new local branch at <base> and add one commit to it.
create_branch_with_commit() {
  local branch="$1" base="$2" file="$3" content="$4" msg="$5"
  git -C "$MAIN_WT" branch "$branch" "$base"
  add_commit_on_branch "$branch" "$file" "$content" "$msg"
}

make_plain_branch() {  # $1=branch $2=base — no commit, just the ref.
  git -C "$MAIN_WT" branch "$1" "$2"
}

push_local_branch_to_origin() {  # $1=local branch $2=remote branch name
  git -C "$MAIN_WT" push -q origin "refs/heads/$1:refs/heads/$2"
}

# run_prov <node-id> [phase] — run the SUT with the shimmed PATH and capture
# stdout in PROV_OUT, stderr in PROV_STDERR, exit code in PROV_RC.
PROV_OUT=""
PROV_STDERR=""
PROV_RC=0
run_prov() {
  local id="$1" phase="${2:-implement}"
  set +e
  PROV_OUT=$(PATH="$BIN_DIR:$PATH" DISPATCH_GRAPH_MAIN_WORKTREE="$MAIN_WT" \
    "$SUT_DIR/provision-node-worktree" "$id" "$phase" 2>"$STDERR_FILE")
  PROV_RC=$?
  set -e
  PROV_STDERR=$(cat "$STDERR_FILE")
}

# run_prov_stale <node-id> [phase] — same, with the operator's --allow-stale
# override in front of the positional args.
run_prov_stale() {
  local id="$1" phase="${2:-implement}"
  set +e
  PROV_OUT=$(PATH="$BIN_DIR:$PATH" DISPATCH_GRAPH_MAIN_WORKTREE="$MAIN_WT" \
    "$SUT_DIR/provision-node-worktree" --allow-stale "$id" "$phase" 2>"$STDERR_FILE")
  PROV_RC=$?
  set -e
  PROV_STDERR=$(cat "$STDERR_FILE")
}

# ==========================================================================
# Case 1: clean tree + conflicting content on the branch -> exit 11, tree
# clean afterwards.
# ==========================================================================
echo "Case 1: clean tree, conflicting content on the branch -> exit 11"
id1="prov-case-conflict-clean"
echo "orig1" >"$MAIN_WT/case1.txt"
git -C "$MAIN_WT" add case1.txt
git -C "$MAIN_WT" commit -q -m "seed case1.txt"
git -C "$MAIN_WT" push -q origin main
BASE1=$(git -C "$MAIN_WT" rev-parse origin/main)
create_branch_with_commit "$id1" "$BASE1" "case1.txt" "branch-edit1" "case1 branch edit"
WT1=$(wt_path "$id1")
git -C "$MAIN_WT" worktree add -q "$WT1" "$id1"
echo "main-edit1" >"$MAIN_WT/case1.txt"
git -C "$MAIN_WT" add case1.txt
git -C "$MAIN_WT" commit -q -m "case1 main edit"
git -C "$MAIN_WT" push -q origin main

run_prov "$id1"
assert_eq "case1 exit 11" "11" "$PROV_RC"
CLEAN1=$(git -C "$WT1" status --porcelain --untracked-files=no)
assert_eq "case1 tree clean after conflict abort" "" "$CLEAN1"

# ==========================================================================
# Case 2: dirty tracked file -> exit 14, content byte-identical afterwards.
# ==========================================================================
echo "Case 2: dirty tracked file -> exit 14, nothing auto-discarded"
id2="prov-case-dirty-tracked"
TIP=$(git -C "$MAIN_WT" rev-parse origin/main)
make_plain_branch "$id2" "$TIP"
WT2=$(wt_path "$id2")
git -C "$MAIN_WT" worktree add -q "$WT2" "$id2"
printf 'dirty-edit\n' >>"$WT2/README.md"
BEFORE2=$(cat "$WT2/README.md")

run_prov "$id2"
assert_eq "case2 exit 14" "14" "$PROV_RC"
AFTER2=$(cat "$WT2/README.md")
assert_eq "case2 file byte-identical after run" "$BEFORE2" "$AFTER2"
assert_contains "case2 stderr names dirty-tracked-tree" "dirty-tracked-tree" "$PROV_STDERR"

# ==========================================================================
# Case 3: rebase-merge state present -> exit 0 after auto-repair, HEAD
# reattached to the branch's pre-rebase tip, merge-tree vs origin/main clean.
# ==========================================================================
echo "Case 3: abandoned rebase -> auto-repaired, exit 0"
id3="prov-case-rebase-repair"
TIP3=$(git -C "$MAIN_WT" rev-parse origin/main)
create_branch_with_commit "$id3" "$TIP3" "case3.txt" "id3-edit" "case3 own commit"
WT3=$(wt_path "$id3")
git -C "$MAIN_WT" worktree add -q "$WT3" "$id3"
PRE_REBASE_HEAD=$(git -C "$WT3" rev-parse HEAD)
create_branch_with_commit "prov-case-rebase-repair-target" "$TIP3" "case3.txt" "target-edit" "case3 conflicting target"
set +e
git -C "$WT3" rebase "prov-case-rebase-repair-target" >/dev/null 2>&1
set -e

run_prov "$id3"
assert_eq "case3 exit 0 after auto-repair" "0" "$PROV_RC"
POST_HEAD=$(git -C "$WT3" rev-parse HEAD)
assert_eq "case3 HEAD reattached to pre-rebase tip" "$PRE_REBASE_HEAD" "$POST_HEAD"
set +e
git -C "$WT3" merge-tree --write-tree HEAD origin/main >/dev/null 2>&1
MT_RC=$?
set -e
assert_eq "case3 merge-tree clean vs origin/main" "0" "$MT_RC"

# ==========================================================================
# Case 4: detached HEAD with no operation in progress -> exit 14.
# ==========================================================================
echo "Case 4: detached HEAD, no operation in progress -> exit 14"
id4="prov-case-detached-head"
TIP=$(git -C "$MAIN_WT" rev-parse origin/main)
make_plain_branch "$id4" "$TIP"
WT4=$(wt_path "$id4")
git -C "$MAIN_WT" worktree add -q "$WT4" "$id4"
git -C "$WT4" checkout -q --detach HEAD

run_prov "$id4"
assert_eq "case4 exit 14" "14" "$PROV_RC"
assert_contains "case4 stderr names detached-head" "detached-head" "$PROV_STDERR"

# ==========================================================================
# Case 5: untracked-only files -> exit 0 (regression guard on
# --untracked-files=no).
# ==========================================================================
echo "Case 5: untracked-only files -> exit 0"
id5="prov-case-untracked-only"
TIP=$(git -C "$MAIN_WT" rev-parse origin/main)
make_plain_branch "$id5" "$TIP"
WT5=$(wt_path "$id5")
git -C "$MAIN_WT" worktree add -q "$WT5" "$id5"
echo "junk" >"$WT5/untracked.txt"

run_prov "$id5"
assert_eq "case5 exit 0 (untracked files do not trip the guard)" "0" "$PROV_RC"

# ==========================================================================
# Case 6: local branch strictly behind origin/<id> -> provisioned HEAD
# equals the pushed tip, not the stale local ref.
# ==========================================================================
echo "Case 6: local branch behind origin/<id> -> HEAD is the pushed tip"
id6="prov-case-behind-remote"
TIP6=$(git -C "$MAIN_WT" rev-parse origin/main)
make_plain_branch "$id6" "$TIP6"
create_branch_with_commit "$id6-remote-scratch" "$TIP6" "case6.txt" "remote-ahead" "case6 ahead commit"
PUSHED_SHA6=$(git -C "$MAIN_WT" rev-parse "$id6-remote-scratch")
push_local_branch_to_origin "$id6-remote-scratch" "$id6"
git -C "$MAIN_WT" branch -D "$id6-remote-scratch"

run_prov "$id6"
assert_eq "case6 exit 0" "0" "$PROV_RC"
WT6=$(wt_path "$id6")
ACTUAL6=$(git -C "$WT6" rev-parse HEAD)
assert_eq "case6 HEAD is the pushed tip, not the stale local ref" "$PUSHED_SHA6" "$ACTUAL6"

# ==========================================================================
# Case 7: local branch ahead of origin/<id> -> local commits survive
# provisioning (regression guard against `worktree add -B`).
# ==========================================================================
echo "Case 7: local branch ahead of origin/<id> -> local commits survive"
id7="prov-case-ahead-remote"
TIP7=$(git -C "$MAIN_WT" rev-parse origin/main)
make_plain_branch "$id7" "$TIP7"
push_local_branch_to_origin "$id7" "$id7"
add_commit_on_branch "$id7" "case7.txt" "local-ahead" "case7 ahead commit"

run_prov "$id7"
assert_eq "case7 exit 0" "0" "$PROV_RC"
WT7=$(wt_path "$id7")
ACTUAL7=$(cat "$WT7/case7.txt" 2>/dev/null || echo MISSING)
assert_eq "case7 local-only commit survives provisioning" "local-ahead" "$ACTUAL7"

# ==========================================================================
# Case 8: local branch diverged from origin/<id> with a conflicting change
# -> exit 11, tree clean afterwards.
# ==========================================================================
echo "Case 8: local branch diverged from origin/<id> -> exit 11"
id8="prov-case-diverged-remote"
TIP8=$(git -C "$MAIN_WT" rev-parse origin/main)
create_branch_with_commit "$id8" "$TIP8" "case8.txt" "remote-edit" "case8 remote commit"
push_local_branch_to_origin "$id8" "$id8"
git -C "$MAIN_WT" branch -D "$id8"
create_branch_with_commit "$id8" "$TIP8" "case8.txt" "local-edit" "case8 local commit"

run_prov "$id8"
assert_eq "case8 exit 11" "11" "$PROV_RC"
WT8=$(wt_path "$id8")
CLEAN8=$(git -C "$WT8" status --porcelain --untracked-files=no)
assert_eq "case8 tree clean after divergence conflict abort" "" "$CLEAN8"

# ==========================================================================
# Case 9: orphan registration -> `git worktree prune` clears it, so a
# re-provision succeeds.
# ==========================================================================
echo "Case 9: orphan worktree registration -> prune clears it, re-add succeeds"
id9="prov-case-orphan-prune"

run_prov "$id9"
assert_eq "case9 first provision exit 0" "0" "$PROV_RC"
WT9=$(wt_path "$id9")
assert_eq "case9 worktree exists after first provision" "yes" "$([[ -d "$WT9" ]] && echo yes || echo no)"
rm -rf "$WT9"

run_prov "$id9"
assert_eq "case9 re-provision exit 0 after orphan prune" "0" "$PROV_RC"
assert_eq "case9 worktree recreated" "yes" "$([[ -d "$WT9" ]] && echo yes || echo no)"

# ==========================================================================
# Case 10: the OPPOSITE of case 9 — the registration is gone but the
# DIRECTORY survives (`rm <wt>/.git` + prune). The directory then sits inside
# the project root's own working tree with no `.git` file, so every
# `git -C "$WT" …` resolves to the PROJECT ROOT. The identity assertion must
# refuse (exit 2, `orphan-directory`) before running any of them — in
# particular it must NOT abort the main checkout's in-progress rebase, and
# must NOT report the main checkout's dirt as this node's residue (exit 14).
# ==========================================================================
echo "Case 10: orphan directory (registration pruned, files left) -> exit 2, main checkout untouched"
id10="prov-case-orphan-directory"

run_prov "$id10"
assert_eq "case10 first provision exit 0" "0" "$PROV_RC"
WT10=$(wt_path "$id10")
rm -f "$WT10/.git"
git -C "$MAIN_WT" worktree prune
echo "residue-content" >"$WT10/residue.txt"

# Stage an in-progress, conflicted rebase in the MAIN checkout. Pre-fix, the
# guard's `git -C "$WT" rebase --abort` aborted exactly this.
git -C "$MAIN_WT" checkout -q -b case10-topic
echo "topic" >"$MAIN_WT/case10.txt"
git -C "$MAIN_WT" add case10.txt
git -C "$MAIN_WT" commit -q -m "case10 topic edit"
git -C "$MAIN_WT" checkout -q main
echo "mainline" >"$MAIN_WT/case10.txt"
git -C "$MAIN_WT" add case10.txt
git -C "$MAIN_WT" commit -q -m "case10 main edit"
git -C "$MAIN_WT" checkout -q case10-topic
set +e
git -C "$MAIN_WT" rebase main >/dev/null 2>&1
set -e
assert_eq "case10 fixture: main checkout is mid-rebase" "yes" \
  "$([[ -d "$MAIN_WT/.git/rebase-merge" || -d "$MAIN_WT/.git/rebase-apply" ]] && echo yes || echo no)"

run_prov "$id10"
assert_eq "case10 exit 2 (orphan directory is not a worktree)" "2" "$PROV_RC"
assert_contains "case10 stderr names the orphan-directory refusal" \
  "is not the linked worktree for" "$PROV_STDERR"
assert_eq "case10 main checkout's rebase NOT aborted" "yes" \
  "$([[ -d "$MAIN_WT/.git/rebase-merge" || -d "$MAIN_WT/.git/rebase-apply" ]] && echo yes || echo no)"
assert_eq "case10 residue left untouched" "residue-content" "$(cat "$WT10/residue.txt")"

set +e
git -C "$MAIN_WT" rebase --abort >/dev/null 2>&1
git -C "$MAIN_WT" checkout -q main
set -e

# ==========================================================================
# Cases 11-12: the .envrc provenance gate. Provisioning merges
# origin/<node-id> into the worktree and then `direnv allow` / `direnv exec`
# it on the operator's host with the sandbox disabled, so an .envrc that is
# not already on origin/main must never be approved or executed.
# From here on origin/main carries an .envrc.
# ==========================================================================
echo "Cases 11-12: .envrc provenance gate"
printf 'export CASE_ENVRC=1\n' >"$MAIN_WT/.envrc"
git -C "$MAIN_WT" add .envrc
git -C "$MAIN_WT" commit -q -m "add .envrc"
git -C "$MAIN_WT" push -q origin main
ENVRC_TIP=$(git -C "$MAIN_WT" rev-parse origin/main)

# Case 11: .envrc matching origin/main -> exit 0, direnv ran.
id11="prov-case-envrc-match"
make_plain_branch "$id11" "$ENVRC_TIP"
: >"$DIRENV_LOG"
run_prov "$id11"
assert_eq "case11 exit 0 (.envrc identical to origin/main)" "0" "$PROV_RC"
assert_eq "case11 direnv ran" "yes" \
  "$([[ -s "$DIRENV_LOG" ]] && echo yes || echo no)"

# Case 12: the node branch rewrites .envrc -> exit 2, direnv never invoked.
id12="prov-case-envrc-drift"
create_branch_with_commit "$id12" "$ENVRC_TIP" ".envrc" \
  'export CASE_ENVRC=1; echo pwned' "case12 hostile .envrc"
: >"$DIRENV_LOG"
run_prov "$id12"
assert_eq "case12 exit 2 (.envrc differs from origin/main)" "2" "$PROV_RC"
assert_contains "case12 stderr names the .envrc refusal" \
  "refusing to direnv allow/exec" "$PROV_STDERR"
assert_eq "case12 direnv never invoked" "" "$(cat "$DIRENV_LOG")"

# ==========================================================================
# Case 13: the worktree IS this node's registered worktree, but it has some
# OTHER branch checked out. The identity assertion passes (the git dir is
# .git/worktrees/<node-id>), so without the branch check the pushed-tip merge
# would merge origin/<node-id> into the unrelated branch and the phase agent
# would be handed a cwd deriving the wrong BRANCH. Expect exit 14
# (`wrong-branch`), with the foreign branch's own commit untouched.
# ==========================================================================
echo "Case 13: worktree on a foreign branch -> exit 14 (wrong-branch)"
id13="prov-case-wrong-branch"
TIP13=$(git -C "$MAIN_WT" rev-parse origin/main)
make_plain_branch "$id13" "$TIP13"
WT13=$(wt_path "$id13")
git -C "$MAIN_WT" worktree add -q "$WT13" "$id13"
git -C "$WT13" checkout -q -b "$id13-foreign"
echo "foreign-work" >"$WT13/case13.txt"
git -C "$WT13" add case13.txt
git -C "$WT13" commit -q -m "case13 foreign-branch commit"
FOREIGN_HEAD13=$(git -C "$WT13" rev-parse HEAD)

run_prov "$id13"
assert_eq "case13 exit 14" "14" "$PROV_RC"
assert_contains "case13 stderr names wrong-branch" "wrong-branch" "$PROV_STDERR"
assert_eq "case13 foreign branch still checked out, untouched" "$FOREIGN_HEAD13" \
  "$(git -C "$WT13" rev-parse HEAD)"

# ==========================================================================
# Case 14: successful provision writes the snapshot-provenance sidecar
# (tactic-graph-execute-fresh-main-read Unit 2) — <node-id>.snapshot-provenance
# next to the .scope-fingerprint sidecar, valid JSON, .sha matching
# origin/main, .fetchedAt non-null.
# ==========================================================================
echo "Case 14: successful provision writes .snapshot-provenance sidecar"
id14="prov-case-snapshot-sidecar"
TIP14=$(git -C "$MAIN_WT" rev-parse origin/main)
make_plain_branch "$id14" "$TIP14"

run_prov "$id14"
assert_eq "case14 exit 0" "0" "$PROV_RC"
SIDECAR14="$MAIN_WT/.claude/worktrees/$id14.snapshot-provenance"
assert_eq "case14 sidecar file exists" "yes" "$([[ -f "$SIDECAR14" ]] && echo yes || echo no)"
SIDECAR14_JSON=$(cat "$SIDECAR14")
SIDECAR14_VALID=$(jq -e . >/dev/null 2>&1 <<<"$SIDECAR14_JSON" && echo yes || echo no)
assert_eq "case14 sidecar is valid JSON" "yes" "$SIDECAR14_VALID"
SIDECAR14_SHA=$(jq -r '.sha' <<<"$SIDECAR14_JSON")
EXPECTED14_SHA=$(git -C "$MAIN_WT" rev-parse origin/main)
assert_eq "case14 sidecar .sha equals origin/main" "$EXPECTED14_SHA" "$SIDECAR14_SHA"
SIDECAR14_FETCHED_AT=$(jq -r '.fetchedAt' <<<"$SIDECAR14_JSON")
assert_eq "case14 sidecar .fetchedAt is non-null" "yes" \
  "$([[ -n "$SIDECAR14_FETCHED_AT" && "$SIDECAR14_FETCHED_AT" != "null" ]] && echo yes || echo no)"

# ==========================================================================
# Cases 15-17: a FAILED `git fetch origin main`
# (tactic-graph-execute-fresh-main-read Unit 5). Break the remote URL while
# the fixture's LOCAL origin/main ref survives from the earlier pushes. The
# fetch failure is an ENVIRONMENT condition, not a node defect, so it must NOT
# exit 2 (which dispatch-graph-execute's catch-all turns into a park-node
# graph write): the snapshot is materialized from the locally-resolved
# origin/main and passed WITHOUT a fetched-at attestation, which the gate
# refuses as unknown-freshness (15) or — with --allow-stale — proceeds on,
# recording the unverified read in the sidecar as `fetchedAt: null`.
# From here on origin is unreachable; no later case may need it.
# ==========================================================================
echo "Cases 15-17: failed fetch with a locally-resolved origin/main"
STALE_TIP=$(git -C "$MAIN_WT" rev-parse origin/main)
git -C "$MAIN_WT" remote set-url origin "$TMP/nonexistent-origin.git"

# Case 15: no --allow-stale -> exit 15 (refuse), not 2.
id15="prov-case-fetch-failed-refuse"
make_plain_branch "$id15" "$STALE_TIP"
run_prov "$id15"
assert_eq "case15 exit 15 (unattested read refused, NOT the exit-2 park path)" "15" "$PROV_RC"
assert_contains "case15 stderr names the unattested fallback" \
  "falling back to the locally-resolved origin/main" "$PROV_STDERR"

# Case 16: --allow-stale -> exit 0, sidecar records fetchedAt: null.
id16="prov-case-fetch-failed-allow-stale"
make_plain_branch "$id16" "$STALE_TIP"
run_prov_stale "$id16"
assert_eq "case16 exit 0 with --allow-stale" "0" "$PROV_RC"
SIDECAR16="$MAIN_WT/.claude/worktrees/$id16.snapshot-provenance"
assert_eq "case16 sidecar file exists" "yes" "$([[ -f "$SIDECAR16" ]] && echo yes || echo no)"
SIDECAR16_JSON=$(cat "$SIDECAR16")
assert_eq "case16 sidecar .fetchedAt is JSON null" "null" "$(jq -r '.fetchedAt | tojson' <<<"$SIDECAR16_JSON")"
assert_eq "case16 sidecar .sha equals the locally-resolved origin/main" \
  "$(git -C "$MAIN_WT" rev-parse origin/main)" "$(jq -r '.sha' <<<"$SIDECAR16_JSON")"

# Case 17: fetch fails AND origin/main does not resolve locally either — a
# genuinely broken checkout, which keeps the old exit 2. Runs LAST: it deletes
# the fixture's origin/main ref.
id17="prov-case-fetch-failed-no-local-ref"
make_plain_branch "$id17" "$STALE_TIP"
git -C "$MAIN_WT" update-ref -d refs/remotes/origin/main
run_prov "$id17"
assert_eq "case17 exit 2 (origin/main unresolvable — a broken checkout)" "2" "$PROV_RC"
assert_contains "case17 stderr names the unresolvable ref" \
  "does not resolve locally either" "$PROV_STDERR"

report_results
