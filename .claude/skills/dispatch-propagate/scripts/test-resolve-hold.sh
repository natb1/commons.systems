#!/usr/bin/env bash
# test-resolve-hold.sh — functional harness for
# packages/intentionsutil/scripts/resolve-hold, the scripted inverse of
# hold-node.
#
# Harness shape mirrors test-graph-write-rollback.sh: a throwaway bare origin +
# a real git clone, with the REAL packages/intentionsutil/src copied in (plus its
# package.json for ESM resolution) and a node_modules SYMLINK to this repo's own
# — so the real TypeScript primitives (hold-node-decide.ts, dump-node.ts,
# write-node.ts) execute for real. Only `graph-commit` is stubbed: the real one
# needs GitHub check-run stamping, which is unavailable and irrelevant here. The
# stub logs its full argv and, unless told otherwise, actually stages/commits/
# pushes the named node files to the local bare origin — so the script's
# post-land re-reads off origin/main observe real landed truth.
#
# Cases:
#   1. Happy path: TWO graph-commit invocations, in order (hold first, source
#      second), each carrying the right --base compare-and-swap token; the hold
#      lands office_hours: null + phase: done and the source loses the edge;
#      stdout is exactly `resolved <hold-id> (unblocked <source-id>)`.
#   2. Write-B lands "successfully" but the edge survives on origin/main (the
#      layer-2 union dropped-removal shape, src/node-merge.ts:102-112) -> exit 1
#      with a diagnostic, and no leaked dirty node file.
#   3. Missing hold on origin/main -> idempotent exit 0, no graph-commit at all,
#      tree left clean.
#   3b. Hold already resolved AND the source carries no edge -> idempotent
#      exit 0, no graph-commit, tree clean.
#   4. Usage errors (no args, unknown option, non-slug / path-traversal id) ->
#      exit 2.
#   5. A far-behind branch worktree where BOTH node files differ from
#      origin/main at HEAD: both graph-commits still land, because exactly one
#      node file is mutated at a time (the stub enforces the real
#      assert_clean_outside_ids rule under GC_STRICT_CLEAN=1).
#   6. A node read that fails -> non-zero exit, no success line, no commit.
#   7. Write A lands "successfully" but the hold is unchanged on origin/main ->
#      exit 1 before Write B, source left blocked.
#   8. An open hold whose source already lost the edge -> Write A only.
#   9. --kind fix-attempt-cap targets the fix-cap hold id instead.
#  10. --hold-id asserts the derivation: a matching id is a no-change happy
#      path, a mismatching one exits 2 with NO graph-commit and a clean tree,
#      and a malformed/empty value is a usage error.
#
# No network needed; requires bash + git + jq + a real node with tsx resolvable
# through a read-only node_modules symlink to this repo's own.
set -uo pipefail

HARNESS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REAL_REPO_ROOT="$(cd "$HARNESS_DIR/../../../.." && pwd)"
UTIL_SCRIPTS_SRC="$REAL_REPO_ROOT/packages/intentionsutil/scripts"
INTENTIONSUTIL_SRC="$REAL_REPO_ROOT/packages/intentionsutil/src"

source "$HARNESS_DIR/test-helpers.sh"

for f in resolve-hold hold-node-decide.ts dump-node.ts write-node.ts; do
  [[ -f "$UTIL_SCRIPTS_SRC/$f" ]] || { echo "error: $f not found at $UTIL_SCRIPTS_SRC/$f" >&2; exit 1; }
done
command -v jq >/dev/null || { echo "error: jq not found" >&2; exit 1; }

WORK="$(mktemp -d)" || { echo "error: mktemp failed" >&2; exit 1; }
trap 'rm -rf "$WORK"' EXIT

SOURCE_ID="tactic-src"
# The id hold-node-decide.ts derives for kind provision-conflict from tactic-src.
HOLD_ID="tactic-hold-conflict-src"

# --- Fixtures ----------------------------------------------------------------

# new_origin <name> — a fresh bare origin per case (each case seeds an
# independent world-state, so a shared origin would reject the next case's push
# as a non-fast-forward of unrelated history).
ORIGIN=""
new_origin() {
  ORIGIN="$WORK/$1-origin.git"
  git init -q --bare "$ORIGIN"
  git -C "$ORIGIN" symbolic-ref HEAD refs/heads/main
}

# build_seed_repo <dst> — a bare-bones real-execution repo tree: the real
# intentionsutil src + package.json, the SUT, and the real TS primitives it
# shells out to.
build_seed_repo() {
  local dst="$1"
  mkdir -p "$dst/intentions" "$dst/packages/intentionsutil/scripts" "$dst/packages/intentionsutil/src"
  cp -r "$INTENTIONSUTIL_SRC/." "$dst/packages/intentionsutil/src/"
  cp "$REAL_REPO_ROOT/packages/intentionsutil/package.json" "$dst/packages/intentionsutil/package.json"
  cp "$UTIL_SCRIPTS_SRC/resolve-hold" "$dst/packages/intentionsutil/scripts/resolve-hold"
  cp "$UTIL_SCRIPTS_SRC/hold-node-decide.ts" "$dst/packages/intentionsutil/scripts/hold-node-decide.ts"
  cp "$UTIL_SCRIPTS_SRC/dump-node.ts" "$dst/packages/intentionsutil/scripts/dump-node.ts"
  cp "$UTIL_SCRIPTS_SRC/write-node.ts" "$dst/packages/intentionsutil/scripts/write-node.ts"
  chmod +x "$dst/packages/intentionsutil/scripts/resolve-hold"
}

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

clone_with_node_modules() {
  local dst="$1"
  git clone -q "$ORIGIN" "$dst"
  git -C "$dst" config user.email harness@test
  git -C "$dst" config user.name harness
  ln -s "$REAL_REPO_ROOT/node_modules" "$dst/node_modules"
}

# install_graph_commit_stub <dir> — logs argv to $GC_LOG (one line per
# invocation), then lands the named node ids for real (stage + commit + push to
# the local bare origin) UNLESS the id appears in $GC_NOOP_IDS, in which case it
# reports success and lands NOTHING — standing in for graph-commit's layer-2
# union silently dropping a field REMOVAL while reporting a successful land.
#
# With GC_STRICT_CLEAN=1 the stub additionally reproduces the REAL graph-commit's
# assert_clean_outside_ids pre-flight (graph-commit:1253-1307, invoked at :1413):
# it refuses to start when any dirty TRACKED file sits outside the id set of THIS
# call. That is what makes Case 5 a real regression test for the two-commit split
# — without it the stub would happily land a call whose sibling node file is
# dirty, and the guard interaction would stay unobserved.
install_graph_commit_stub() {
  cat >"$1/packages/intentionsutil/scripts/graph-commit" <<'SH'
#!/usr/bin/env bash
set -uo pipefail
printf '%s\n' "$*" >>"$GC_LOG"
ids=()
while [[ $# -gt 0 ]]; do
  case "$1" in
    -m|--base|-C|--repo) shift 2 ;;
    --prune) shift 2 ;;
    -*) shift ;;
    *) ids+=("$1"); shift ;;
  esac
done
if [[ -n "${GC_STRICT_CLEAN:-}" ]]; then
  offending=""
  while IFS= read -r line; do
    [[ -z "$line" ]] && continue
    [[ "$line" == '??'* ]] && continue
    pth="${line:3}"
    keep=0
    for id in "${ids[@]}"; do
      [[ "$pth" == "intentions/$id.md" ]] && keep=1
    done
    (( keep )) || offending+="$line"$'\n'
  done <<<"$(git status --porcelain)"
  if [[ -n "$offending" ]]; then
    echo "graph-commit stub: refusing to start -- unrelated dirty tracked file(s) outside this call's node set:" >&2
    printf '%s' "$offending" >&2
    exit 1
  fi
fi
for id in "${ids[@]}"; do
  for noop in ${GC_NOOP_IDS:-}; do
    if [[ "$noop" == "$id" ]]; then
      echo "graph-commit stub: reporting success for $id without landing anything" >&2
      exit 0
    fi
  done
done
for id in "${ids[@]}"; do
  git add -- "intentions/$id.md"
done
git commit -q -m "stub land: ${ids[*]}"
git push -q origin HEAD:main
exit 0
SH
  chmod +x "$1/packages/intentionsutil/scripts/graph-commit"
}

write_source_node() { # <file> <blocked_by-yaml-list>
  cat >"$1" <<NODE
---
id: $SOURCE_ID
kind: tactic
statement: harness source node carrying a tracked hold
owner: ai
status: codified
phase: implement
serves: []
execution: null
blocked_by: $2
---
# harness source node carrying a tracked hold
NODE
}

write_open_hold_node() { # <file>
  cat >"$1" <<NODE
---
id: $HOLD_ID
kind: tactic
statement: 'hold: provision-conflict on \`$SOURCE_ID\` — a tracked hold blocking the source'
owner: ai
status: codified
serves: []
office_hours:
  reason: merge conflict retry against a moving main
  since: 2026-07-01
  recommendation: resolve the conflict on the branch, then resolve this hold
---
# hold: provision-conflict on $SOURCE_ID
NODE
}

write_resolved_hold_node() { # <file>
  cat >"$1" <<NODE
---
id: $HOLD_ID
kind: tactic
statement: 'hold: provision-conflict on \`$SOURCE_ID\` — a tracked hold blocking the source'
owner: ai
status: codified
phase: done
serves: []
---
# hold: provision-conflict on $SOURCE_ID
NODE
}

# run_sut <clone-dir> [args...] — run resolve-hold from the clone, capturing
# stdout in OUT, stderr in ERR and the exit code in RC.
OUT=""; ERR=""; RC=0
run_sut() {
  local clone="$1"; shift
  : >"$GC_LOG"
  set +e
  OUT="$(
    cd "$clone" || exit 99
    export GC_LOG GC_NOOP_IDS="${GC_NOOP_IDS:-}" GC_STRICT_CLEAN="${GC_STRICT_CLEAN:-}"
    bash packages/intentionsutil/scripts/resolve-hold "$@" 2>"$WORK/stderr.log"
  )"
  RC=$?
  set -e
  ERR="$(cat "$WORK/stderr.log")"
}

GC_LOG="$WORK/graph-commit.log"

# ============================================================================
# Case 1: happy path — two commits, right order, right --base tokens
# ============================================================================
echo "Case 1: happy path lands two separate graph-commits in order"
T1="$WORK/t1-seed"; build_seed_repo "$T1"
write_source_node "$T1/intentions/$SOURCE_ID.md" "[$HOLD_ID]"
write_open_hold_node "$T1/intentions/$HOLD_ID.md"
new_origin t1; init_and_push "$T1"
C1="$WORK/t1-clone"; clone_with_node_modules "$C1"; install_graph_commit_stub "$C1"

HOLD_BLOB_1="$(git -C "$C1" rev-parse "origin/main:intentions/$HOLD_ID.md")"
SOURCE_BLOB_1="$(git -C "$C1" rev-parse "origin/main:intentions/$SOURCE_ID.md")"

GC_NOOP_IDS="" run_sut "$C1" "$SOURCE_ID"

assert_eq "happy path exit 0" "0" "$RC"
assert_eq "happy path stdout is the single resolved line" \
  "resolved $HOLD_ID (unblocked $SOURCE_ID)" "$OUT"

GC_LINES="$(wc -l <"$GC_LOG" | tr -d ' ')"
assert_eq "exactly two graph-commit invocations (write A and write B, never combined)" "2" "$GC_LINES"

GC_FIRST="$(sed -n 1p "$GC_LOG")"
GC_SECOND="$(sed -n 2p "$GC_LOG")"
assert_contains "first commit is the hold resolution" "$HOLD_ID" "$GC_FIRST"
assert_contains "first commit carries the hold's --base token" \
  "--base $HOLD_ID=$HOLD_BLOB_1" "$GC_FIRST"
assert_contains "second commit is the source unblocking" "$SOURCE_ID" "$GC_SECOND"
assert_contains "second commit carries the source's --base token" \
  "--base $SOURCE_ID=$SOURCE_BLOB_1" "$GC_SECOND"

# The hold's write must never ride in the source's commit and vice versa.
TOTAL=$((TOTAL + 1))
if grep -qF -- "$SOURCE_ID" <<<"$GC_FIRST"; then
  FAIL=$((FAIL + 1)); echo "  FAIL: write A commit is hold-only"; echo "    actual: $GC_FIRST"
else
  PASS=$((PASS + 1)); echo "  PASS: write A commit is hold-only"
fi

# Landed truth on origin/main.
git -C "$C1" fetch -q origin main
LANDED_HOLD="$(git -C "$C1" show "origin/main:intentions/$HOLD_ID.md")"
LANDED_SOURCE="$(git -C "$C1" show "origin/main:intentions/$SOURCE_ID.md")"
assert_contains "landed hold carries phase: done" "phase: done" "$LANDED_HOLD"
TOTAL=$((TOTAL + 1))
if grep -q '^office_hours:' <<<"$LANDED_HOLD" && ! grep -q '^office_hours: null' <<<"$LANDED_HOLD"; then
  FAIL=$((FAIL + 1)); echo "  FAIL: landed hold has office_hours cleared"; printf '%s\n' "$LANDED_HOLD"
else
  PASS=$((PASS + 1)); echo "  PASS: landed hold has office_hours cleared"
fi
TOTAL=$((TOTAL + 1))
if grep -qF -- "$HOLD_ID" <<<"$LANDED_SOURCE"; then
  FAIL=$((FAIL + 1)); echo "  FAIL: landed source no longer names the hold in blocked_by"
  printf '%s\n' "$LANDED_SOURCE"
else
  PASS=$((PASS + 1)); echo "  PASS: landed source no longer names the hold in blocked_by"
fi

# ============================================================================
# Case 2: Write B reports success but the edge survives on origin/main
# (graph-commit's layer-2 union re-adding a REMOVED blocked_by entry).
# ============================================================================
echo "Case 2: a dropped blocked_by removal is caught by the post-land re-read"
T2="$WORK/t2-seed"; build_seed_repo "$T2"
write_source_node "$T2/intentions/$SOURCE_ID.md" "[$HOLD_ID]"
write_open_hold_node "$T2/intentions/$HOLD_ID.md"
new_origin t2; init_and_push "$T2"
C2="$WORK/t2-clone"; clone_with_node_modules "$C2"; install_graph_commit_stub "$C2"

GC_NOOP_IDS="$SOURCE_ID" run_sut "$C2" "$SOURCE_ID"

assert_eq "dropped-removal exit 1" "1" "$RC"
assert_eq "dropped-removal prints no success line" "" "$OUT"
assert_contains "dropped-removal diagnostic names the surviving edge" \
  "origin/main still carries the blocked_by edge to $HOLD_ID" "$ERR"
assert_eq "dropped-removal still attempted both writes" "2" "$(wc -l <"$GC_LOG" | tr -d ' ')"
# Write A DID land, so the hold's file legitimately differs from the clone's
# stale HEAD; the SOURCE file — whose write never landed — must be back exactly
# as the script found it, leaving no dirty file for assert_clean_outside_ids.
assert_eq "dropped-removal leaves no dirty source node file" "" \
  "$(git -C "$C2" status --porcelain -- "intentions/$SOURCE_ID.md")"

# ============================================================================
# Case 3: no hold on origin/main -> idempotent exit 0
# ============================================================================
echo "Case 3: a missing hold is an idempotent no-op"
T3="$WORK/t3-seed"; build_seed_repo "$T3"
write_source_node "$T3/intentions/$SOURCE_ID.md" "[]"
new_origin t3; init_and_push "$T3"
C3="$WORK/t3-clone"; clone_with_node_modules "$C3"; install_graph_commit_stub "$C3"

GC_NOOP_IDS="" run_sut "$C3" "$SOURCE_ID"

assert_eq "missing hold exit 0" "0" "$RC"
assert_eq "missing hold makes no graph-commit call" "" "$(cat "$GC_LOG")"
assert_contains "missing hold prints an informative note" \
  "no provision-conflict hold ($HOLD_ID) on origin/main" "$ERR"
assert_eq "missing hold leaves the tree clean" "" \
  "$(git -C "$C3" status --porcelain intentions/)"

# ============================================================================
# Case 3b: already-resolved hold + no edge -> idempotent exit 0
# ============================================================================
echo "Case 3b: an already-resolved hold with no surviving edge is an idempotent no-op"
T3B="$WORK/t3b-seed"; build_seed_repo "$T3B"
write_source_node "$T3B/intentions/$SOURCE_ID.md" "[]"
write_resolved_hold_node "$T3B/intentions/$HOLD_ID.md"
new_origin t3b; init_and_push "$T3B"
C3B="$WORK/t3b-clone"; clone_with_node_modules "$C3B"; install_graph_commit_stub "$C3B"

GC_NOOP_IDS="" run_sut "$C3B" "$SOURCE_ID"

assert_eq "already-resolved exit 0" "0" "$RC"
assert_eq "already-resolved makes no graph-commit call" "" "$(cat "$GC_LOG")"
assert_contains "already-resolved prints an informative note" "is already resolved" "$ERR"
assert_eq "already-resolved leaves the tree clean" "" \
  "$(git -C "$C3B" status --porcelain intentions/)"

# ============================================================================
# Case 4: usage errors -> exit 2
# ============================================================================
echo "Case 4: usage errors exit 2"
GC_NOOP_IDS="" run_sut "$C3"
assert_eq "no args -> exit 2" "2" "$RC"
assert_contains "no args prints usage" "usage: resolve-hold" "$ERR"

GC_NOOP_IDS="" run_sut "$C3" "$SOURCE_ID" --bogus
assert_eq "unknown option -> exit 2" "2" "$RC"

GC_NOOP_IDS="" run_sut "$C3" "$SOURCE_ID" extra-positional
assert_eq "extra positional -> exit 2" "2" "$RC"

# A non-slug id must be rejected BEFORE it reaches a filesystem path or a git
# pathspec — it is interpolated into "$INTENTIONS_DIR/$id.md" and restore_node's
# `rm -f`, so `../..`-style traversal must never get that far.
GC_NOOP_IDS="" run_sut "$C3" "../../etc/passwd"
assert_eq "path-traversal id -> exit 2" "2" "$RC"
assert_contains "path-traversal id names the offending value" "invalid node id" "$ERR"

GC_NOOP_IDS="" run_sut "$C3" "Tactic-Src"
assert_eq "non-slug id -> exit 2" "2" "$RC"

# ============================================================================
# Case 5: a far-behind PR-branch worktree — BOTH node files differ from
# origin/main at HEAD, so each origin/main refresh dirties them. The two writes
# land in two SEPARATE graph-commits, and the real graph-commit refuses to start
# when a tracked file outside THAT call's id set is dirty
# (assert_clean_outside_ids). Exactly one node file may be mutated at a time.
# ============================================================================
echo "Case 5: a far-behind branch worktree still lands both graph-commits"
T5="$WORK/t5-seed"; build_seed_repo "$T5"
write_source_node "$T5/intentions/$SOURCE_ID.md" "[$HOLD_ID]"
write_open_hold_node "$T5/intentions/$HOLD_ID.md"
new_origin t5; init_and_push "$T5"
C5="$WORK/t5-clone"; clone_with_node_modules "$C5"; install_graph_commit_stub "$C5"

# Diverge: a node branch whose HEAD copy of BOTH node files differs from
# origin/main (the shape a PR-branch worktree is normally in).
git -C "$C5" checkout -q -b "$SOURCE_ID"
printf '\nbranch-side body line the refresh will overwrite\n' >>"$C5/intentions/$SOURCE_ID.md"
printf '\nbranch-side body line the refresh will overwrite\n' >>"$C5/intentions/$HOLD_ID.md"
git -C "$C5" commit -q -am "branch-side edits to both node files"

GC_NOOP_IDS="" GC_STRICT_CLEAN=1 run_sut "$C5" "$SOURCE_ID"

assert_eq "far-behind branch exit 0" "0" "$RC"
assert_eq "far-behind branch stdout is the single resolved line" \
  "resolved $HOLD_ID (unblocked $SOURCE_ID)" "$OUT"
assert_eq "far-behind branch still makes exactly two graph-commit calls" "2" \
  "$(wc -l <"$GC_LOG" | tr -d ' ')"
assert_eq "far-behind branch leaves no dirty node file behind" "" \
  "$(git -C "$C5" status --porcelain intentions/)"
git -C "$C5" fetch -q origin main
TOTAL=$((TOTAL + 1))
if git -C "$C5" show "origin/main:intentions/$SOURCE_ID.md" | grep -qF -- "$HOLD_ID"; then
  FAIL=$((FAIL + 1)); echo "  FAIL: far-behind branch landed the blocked_by removal"
else
  PASS=$((PASS + 1)); echo "  PASS: far-behind branch landed the blocked_by removal"
fi

# ============================================================================
# Case 6: a node read that fails must NOT reach the success line. read_node_json
# exits on failure, so it must never be called from a command substitution — an
# `exit` inside `$(...)` kills only the substitution subshell, and the caller
# would run on with an empty path, skip BOTH writes, and print `resolved ...`.
# ============================================================================
echo "Case 6: a failing node read exits non-zero instead of falsely succeeding"
T6="$WORK/t6-seed"; build_seed_repo "$T6"
write_source_node "$T6/intentions/$SOURCE_ID.md" "[$HOLD_ID]"
write_open_hold_node "$T6/intentions/$HOLD_ID.md"
new_origin t6; init_and_push "$T6"
C6="$WORK/t6-clone"; clone_with_node_modules "$C6"; install_graph_commit_stub "$C6"
printf 'process.exit(1);\n' >"$C6/packages/intentionsutil/scripts/dump-node.ts"

GC_NOOP_IDS="" run_sut "$C6" "$SOURCE_ID"

assert_eq "failed node read exits 1" "1" "$RC"
assert_eq "failed node read prints no success line" "" "$OUT"
assert_contains "failed node read names dump-node" "dump-node failed" "$ERR"
assert_eq "failed node read makes no graph-commit call" "" "$(cat "$GC_LOG")"
assert_eq "failed node read leaves the tree clean" "" \
  "$(git -C "$C6" status --porcelain intentions/)"

# ============================================================================
# Case 7: Write A lands "successfully" but the hold is unchanged on origin/main
# -> the post-land verification stops the run BEFORE Write B, so the source keeps
# its edge (never half-unblock a source whose hold did not resolve).
# ============================================================================
echo "Case 7: a dropped hold resolution stops the run before Write B"
T7="$WORK/t7-seed"; build_seed_repo "$T7"
write_source_node "$T7/intentions/$SOURCE_ID.md" "[$HOLD_ID]"
write_open_hold_node "$T7/intentions/$HOLD_ID.md"
new_origin t7; init_and_push "$T7"
C7="$WORK/t7-clone"; clone_with_node_modules "$C7"; install_graph_commit_stub "$C7"

GC_NOOP_IDS="$HOLD_ID" run_sut "$C7" "$SOURCE_ID"

assert_eq "dropped hold resolution exits 1" "1" "$RC"
assert_eq "dropped hold resolution prints no success line" "" "$OUT"
assert_contains "dropped hold resolution names the failed post-land check" \
  "post-land verification failed for $HOLD_ID" "$ERR"
assert_eq "dropped hold resolution never reaches Write B" "1" \
  "$(wc -l <"$GC_LOG" | tr -d ' ')"
assert_eq "dropped hold resolution leaves the tree clean" "" \
  "$(git -C "$C7" status --porcelain intentions/)"
git -C "$C7" fetch -q origin main
TOTAL=$((TOTAL + 1))
if git -C "$C7" show "origin/main:intentions/$SOURCE_ID.md" | grep -qF -- "$HOLD_ID"; then
  PASS=$((PASS + 1)); echo "  PASS: dropped hold resolution leaves the source still blocked"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: dropped hold resolution leaves the source still blocked"
fi

# ============================================================================
# Case 8: an open hold whose source no longer carries the edge -> Write A only.
# ============================================================================
echo "Case 8: an open hold with no surviving edge runs Write A only"
T8="$WORK/t8-seed"; build_seed_repo "$T8"
write_source_node "$T8/intentions/$SOURCE_ID.md" "[]"
write_open_hold_node "$T8/intentions/$HOLD_ID.md"
new_origin t8; init_and_push "$T8"
C8="$WORK/t8-clone"; clone_with_node_modules "$C8"; install_graph_commit_stub "$C8"

GC_NOOP_IDS="" GC_STRICT_CLEAN=1 run_sut "$C8" "$SOURCE_ID"

assert_eq "edge-already-gone exit 0" "0" "$RC"
assert_eq "edge-already-gone stdout is the single resolved line" \
  "resolved $HOLD_ID (unblocked $SOURCE_ID)" "$OUT"
assert_eq "edge-already-gone makes exactly one graph-commit call" "1" \
  "$(wc -l <"$GC_LOG" | tr -d ' ')"
assert_contains "edge-already-gone's single call is the hold resolution" \
  "$HOLD_ID" "$(cat "$GC_LOG")"
assert_eq "edge-already-gone leaves the tree clean" "" \
  "$(git -C "$C8" status --porcelain intentions/)"

# ============================================================================
# Case 9: --kind fix-attempt-cap resolves the OTHER hold id hold-node-decide.ts
# derives for the same source (KIND_SLUGS: fix-attempt-cap -> "fix-cap").
# ============================================================================
echo "Case 9: --kind fix-attempt-cap targets the fix-cap hold id"
FIX_HOLD_ID="tactic-hold-fix-cap-src"
T9="$WORK/t9-seed"; build_seed_repo "$T9"
write_source_node "$T9/intentions/$SOURCE_ID.md" "[$FIX_HOLD_ID]"
HOLD_ID_SAVED="$HOLD_ID"; HOLD_ID="$FIX_HOLD_ID"
write_open_hold_node "$T9/intentions/$FIX_HOLD_ID.md"
HOLD_ID="$HOLD_ID_SAVED"
new_origin t9; init_and_push "$T9"
C9="$WORK/t9-clone"; clone_with_node_modules "$C9"; install_graph_commit_stub "$C9"

GC_NOOP_IDS="" GC_STRICT_CLEAN=1 run_sut "$C9" "$SOURCE_ID" --kind fix-attempt-cap

assert_eq "fix-attempt-cap exit 0" "0" "$RC"
assert_eq "fix-attempt-cap resolves the fix-cap hold id" \
  "resolved $FIX_HOLD_ID (unblocked $SOURCE_ID)" "$OUT"
assert_eq "fix-attempt-cap makes two graph-commit calls" "2" \
  "$(wc -l <"$GC_LOG" | tr -d ' ')"
assert_eq "fix-attempt-cap leaves the tree clean" "" \
  "$(git -C "$C9" status --porcelain intentions/)"

# ============================================================================
# Case 10: --hold-id is an ASSERTION, not an override. A caller that enumerated
# a hold by node id (lib-stale-hold-recheck.sh's sweep) hands the id over so the
# derivation from (source, kind) is checked against it. A mismatch means the
# enumerated node is not the canonical hold for that pair — acting on the
# derivation would resolve a DIFFERENT hold than the one the caller inspected —
# so it exits 2 having landed nothing at all.
# ============================================================================
echo "Case 10: --hold-id asserts the derivation and refuses on a mismatch"
T10="$WORK/t10-seed"; build_seed_repo "$T10"
write_source_node "$T10/intentions/$SOURCE_ID.md" "[$HOLD_ID]"
write_open_hold_node "$T10/intentions/$HOLD_ID.md"
new_origin t10; init_and_push "$T10"
C10="$WORK/t10-clone"; clone_with_node_modules "$C10"; install_graph_commit_stub "$C10"

# 10a — a matching assertion changes nothing about the happy path.
GC_NOOP_IDS="" GC_STRICT_CLEAN=1 run_sut "$C10" "$SOURCE_ID" --hold-id "$HOLD_ID"
assert_eq "matching --hold-id exit 0" "0" "$RC"
assert_eq "matching --hold-id resolves the hold" \
  "resolved $HOLD_ID (unblocked $SOURCE_ID)" "$OUT"
assert_eq "matching --hold-id makes two graph-commit calls" "2" \
  "$(wc -l <"$GC_LOG" | tr -d ' ')"

# 10b — a mismatched assertion refuses before any write, and leaves the tree
# clean (the source refresh it already performed is rolled back by the trap).
T10B="$WORK/t10b-seed"; build_seed_repo "$T10B"
write_source_node "$T10B/intentions/$SOURCE_ID.md" "[$HOLD_ID]"
write_open_hold_node "$T10B/intentions/$HOLD_ID.md"
new_origin t10b; init_and_push "$T10B"
C10B="$WORK/t10b-clone"; clone_with_node_modules "$C10B"; install_graph_commit_stub "$C10B"

GC_NOOP_IDS="" run_sut "$C10B" "$SOURCE_ID" --hold-id "tactic-decoy-x"
assert_eq "mismatched --hold-id -> exit 2" "2" "$RC"
assert_contains "mismatched --hold-id names both ids" \
  "does not match the hold id derived from" "$ERR"
assert_eq "mismatched --hold-id makes no graph-commit call" "0" \
  "$(wc -l <"$GC_LOG" | tr -d ' ')"
assert_eq "mismatched --hold-id leaves the tree clean" "" \
  "$(git -C "$C10B" status --porcelain intentions/)"

# 10c — a malformed or missing value is a usage error in its own right.
GC_NOOP_IDS="" run_sut "$C10B" "$SOURCE_ID" --hold-id "../../etc/passwd"
assert_eq "path-traversal --hold-id -> exit 2" "2" "$RC"
assert_contains "path-traversal --hold-id names the offending value" \
  "invalid --hold-id" "$ERR"

GC_NOOP_IDS="" run_sut "$C10B" "$SOURCE_ID" --hold-id ""
assert_eq "empty --hold-id -> exit 2" "2" "$RC"

report_results
