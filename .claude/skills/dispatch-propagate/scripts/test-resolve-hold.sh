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
#   4. Usage errors (no args, unknown option) -> exit 2.
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
    export GC_LOG GC_NOOP_IDS="${GC_NOOP_IDS:-}"
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

report_results
