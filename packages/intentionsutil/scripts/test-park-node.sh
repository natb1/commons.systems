#!/usr/bin/env bash
#
# test-park-node.sh — functional harness for park-node's fresh-origin/main
# compare-and-swap guard (tactic-park-node-fresh-main-clobber-fix).
#
# Mirrors test-graph-commit.sh's setup: a throwaway bare origin plus writer
# clones, `gh`/`npx` PATH shims standing in for the GitHub API and the tsx
# office_hours writer, and GRAPH_COMMIT_* env overrides shrinking the poll
# windows. park-node and graph-commit under test are the ones next to this
# file; both are copied into the scratch repo at their real repo-relative paths
# so their REPO_ROOT/SCRIPT_DIR resolution points at the scratch clone.
#
# The bug being guarded: park-node used to read/mutate/write the LOCAL on-disk
# node file in the invoking worktree, which can be stale relative to origin/main
# (e.g. a far-behind PR-branch worktree used by the Stop-hook backstop). Its
# small office_hours-only diff then applied cleanly onto a since-advanced
# origin/main, silently REVERTING the newer landed body/frontmatter. graph-commit
# additionally reset the tree to origin/main and re-materialized the stale
# snapshot on top (ensure_intentions_only_base), turning the stale full-file
# content into the landed content. The fix: park-node fetches origin/main,
# overwrites the local file with origin/main's content BEFORE the read, and
# passes graph-commit a `--base <id>=<blobsha>` compare-and-swap token so a
# concurrent advance is detected and auto-merged onto — or auto-parked when the
# merge is mechanically unresolvable — rather than silently clobbered.
#
# Covers:
#   1. Stale far-ahead worktree park does NOT revert landed content: a
#      concurrent body edit landed on origin survives, and office_hours is set.
#   2. A concurrent origin/main write that lands between park-node resolving
#      FRESH_BLOB and graph-commit's --base freshness check causes graph-commit's
#      layers-1-3 auto-merge to fail on the raw content collision and fall
#      through to its documented auto-park fallback: office_hours is set on the
#      node (reason containing "mechanical-unresolved") and that parking write is
#      pushed to origin/main. park-node itself still exits non-zero — its OWN
#      writer's edit is what didn't land, even though the auto-park write did.
#      Reliably triggered — without a literal race — by a test wrapper standing
#      in for graph-commit that lands the concurrent change, then delegates to
#      the real graph-commit whose check_base_freshness sees origin has moved
#      past FRESH_BLOB.
#   3. A node absent from origin/main is refused before any write (exit 1).
#
# No network and no real gh/node needed; requires only bash + git + jq.

set -uo pipefail

HARNESS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PN_SCRIPT="$HARNESS_DIR/park-node"
GC_SCRIPT="$HARNESS_DIR/graph-commit"
RP_SCRIPT="$HARNESS_DIR/resolve-park"
[[ -f "$PN_SCRIPT" ]] || { echo "error: park-node not found at $PN_SCRIPT" >&2; exit 1; }
[[ -f "$GC_SCRIPT" ]] || { echo "error: graph-commit not found at $GC_SCRIPT" >&2; exit 1; }
[[ -f "$RP_SCRIPT" ]] || { echo "error: resolve-park not found at $RP_SCRIPT" >&2; exit 1; }
command -v jq >/dev/null || { echo "error: jq not found (required by the gh shim)" >&2; exit 1; }

WORK="$(mktemp -d)" || { echo "error: mktemp failed" >&2; exit 1; }
harness_cleanup() { rm -rf "$WORK"; }
trap harness_cleanup EXIT

PASS=0; FAIL=0
ok() { echo "PASS: $1"; PASS=$((PASS + 1)); }
no() { echo "FAIL: $1"; FAIL=$((FAIL + 1)); }

# --- Scratch origin + seed content ------------------------------------------
ORIGIN="$WORK/origin.git"
git init -q --bare "$ORIGIN"
git -C "$ORIGIN" symbolic-ref HEAD refs/heads/main

SEED="$WORK/seed"
mkdir -p "$SEED"
git -C "$SEED" init -q -b main
git -C "$SEED" config user.email harness@test
git -C "$SEED" config user.name harness
git -C "$SEED" remote add origin "$ORIGIN"
mkdir -p "$SEED/intentions" \
         "$SEED/packages/intentionsutil/scripts" \
         "$SEED/packages/intentionsutil/src"
cp "$PN_SCRIPT" "$SEED/packages/intentionsutil/scripts/park-node"
cp "$GC_SCRIPT" "$SEED/packages/intentionsutil/scripts/graph-commit"
cp "$RP_SCRIPT" "$SEED/packages/intentionsutil/scripts/resolve-park"
chmod +x "$SEED/packages/intentionsutil/scripts/park-node" \
         "$SEED/packages/intentionsutil/scripts/graph-commit" \
         "$SEED/packages/intentionsutil/scripts/resolve-park"
# The path must exist for STORE_MODULE resolution; the npx shim never loads it.
: >"$SEED/packages/intentionsutil/src/store.js"

seed_node() { # <id> — 12 numbered lines so distant edits rebase cleanly
  local i
  {
    echo "id: $1"
    for i in $(seq 1 12); do echo "line$i: base"; done
  } >"$SEED/intentions/$1.md"
}
for id in t-stale t-concurrent t-pr t-pr-bad-arg t-resolve-ratify t-resolve-reject t-resolve-unparked; do
  seed_node "$id"
done
git -C "$SEED" add -A
git -C "$SEED" commit -qm seed
git -C "$SEED" push -q origin main

# --- Independent writer clones -------------------------------------------
make_clone() { # <dst> <identity>
  git clone -q "$ORIGIN" "$1"
  git -C "$1" config user.email "$2@test"
  git -C "$1" config user.name "$2"
}

# --- gh / npx PATH shims ------------------------------------------------------
# gh shim: always reports the four required checks green (park lands cleanly in
# the non-conflict cases). npx shim: emulates park-node's tsx office_hours
# writer (argv: tsx <helper> <store> <dir> <since> <reason> <recommendation>
# <id>) by appending an office_hours line to the file park-node has ALREADY
# refreshed from origin/main — so a correct refresh is what survives.
mkdir -p "$WORK/bin" "$WORK/fixtures"
cat >"$WORK/fixtures/green.json" <<'JSON'
{"check_runs": [
  {"name": "acceptance", "status": "completed", "conclusion": "success"},
  {"name": "preview-and-smoke", "status": "completed", "conclusion": "success"},
  {"name": "lint", "status": "completed", "conclusion": "success"},
  {"name": "unit-tests", "status": "completed", "conclusion": "success"}
]}
JSON

cat >"$WORK/bin/gh" <<'SH'
#!/usr/bin/env bash
# gh shim: records `pr ready`/`pr close` invocations (for resolve-park's
# tests) to GH_LOG, then falls through to running graph-commit's REAL --jq
# program against the green fixture so the filter itself is exercised, not a
# hardcoded count string.
if [[ "$1" == "pr" && ( "$2" == "ready" || "$2" == "close" ) ]]; then
  echo "$2 $3" >>"${GH_LOG:-/dev/null}"
  exit 0
fi
jq_program=""
while [[ $# -gt 0 ]]; do
  if [[ "$1" == "--jq" ]]; then jq_program="$2"; break; fi
  shift
done
jq -r "$jq_program" "$GC_FIXTURE_DIR/green.json"
SH

cat >"$WORK/bin/npx" <<'SH'
#!/usr/bin/env bash
# npx shim: emulates without node the invocations graph-commit/park-node make
# via `npx tsx ...` for the office_hours write, plus a stub for the layers-1-3
# mechanical 3-way merge tool:
#   (a) park-node's own direct write: <dir> <since> <reason> <recommendation> <id>
#       — exactly 5 args remain after stripping tsx/helper/store.
#   (b) graph-commit's park_write() concurrent-edit-conflict parking helper:
#       <dir> <since> <reason> <snapDir> <pruneCsv> <id...> — 6+ args remain
#       (snapDir/pruneCsv occupy the recommendation/id slots, and one or more
#       ids follow). Distinguished from (a) by arg count since pruneCsv is
#       always present (possibly empty) as its own arg.
#   (c) graph-commit's merge-node.ts 3-way text merge (flag-based argv:
#       --base/--ours/--theirs/--out, no store-module positional arg at all —
#       does not fit (a)/(b)'s shape). No real merge tool exists in this
#       no-node harness, so this always reports failure, which is what makes
#       graph-commit's layers 1-3 fall through to the layer-3 conflict-park
#       path — exactly the refusal behavior this file's case 2 verifies.
[[ "$1" == "tsx" ]] || { echo "npx shim: unexpected invocation: $*" >&2; exit 1; }
if [[ "$2" == *merge-node.ts ]]; then
  echo "npx shim: no real 3-way merge tool available (test harness stub)" >&2
  exit 1
fi
helper="$2"
# (d) resolve-park's two helpers — state-read (dir, id) and clear-write
# (dir, id) — both leave exactly 2 args after stripping tsx/helper/store,
# distinct from (a)'s 6 and (b)'s 6+. The two are disambiguated from each
# other by the helper file's own content (readable — it is a plain tempfile).
if [[ $# -eq 5 ]]; then
  rp_dir="$4"; rp_id="$5"
  [[ -f "$rp_dir/$rp_id.md" ]] || { echo "npx shim: unreadable node $rp_id" >&2; exit 1; }
  if grep -q 'cleared office_hours' "$helper"; then
    # Naive simulation of the real writer's office_hours=null: since this
    # harness's seed content isn't real YAML, "clearing" is simulated by
    # appending a sentinel line a test can grep for.
    printf 'office_hours: null\n' >>"$rp_dir/$rp_id.md"
    echo "npx shim: cleared office_hours on $rp_id" >&2
  else
    parked="false"; pr=""
    grep -q 'office_hours' "$rp_dir/$rp_id.md" && parked="true"
    if grep -q '^execution_pr: ' "$rp_dir/$rp_id.md"; then
      pr="$(grep '^execution_pr: ' "$rp_dir/$rp_id.md" | tail -1 | awk '{print $2}')"
    fi
    printf '{"parked": %s, "pr": %s}\n' "$parked" "${pr:-null}"
  fi
  exit 0
fi
shift 3   # tsx, helper script path, store module path
dir="$1"; since="$2"; reason="$3"
# Disambiguate (a) park-node's direct write — dir since reason recommendation
# id [pr] — from (b) graph-commit's park_write — dir since reason snapDir
# pruneCsv id... — by whether arg4 is a real directory (snapDir always is;
# park-node's free-text recommendation never is). Argcount alone no longer
# distinguishes them: park-node now always appends a trailing pr slot (empty
# or numeric), so its direct-write shape is 6 args wide, same as (b)'s
# minimum (snapDir pruneCsv + one id).
if [[ -d "$4" ]]; then
  shift 5   # dir, since, reason, snapDir, pruneCsv
  ids=("$@")
  for id in "${ids[@]}"; do
    [[ -f "$dir/$id.md" ]] || { echo "npx shim: unreadable node $id" >&2; exit 1; }
    printf 'office_hours: {reason: "%s", since: %s}\n' "$reason" "$since" >>"$dir/$id.md"
    echo "npx shim: set office_hours on $id (since=$since)" >&2
  done
else
  recommendation="$4"; id="$5"; pr="${6:-}"
  [[ -f "$dir/$id.md" ]] || { echo "npx shim: unreadable node $id" >&2; exit 1; }
  printf 'office_hours: {reason: "%s", since: %s}\n' "$reason" "$since" >>"$dir/$id.md"
  if [[ -n "$pr" ]]; then
    printf 'execution_pr: %s\n' "$pr" >>"$dir/$id.md"
  fi
  echo "npx shim: set office_hours on $id (since=$since) recommendation='$recommendation'" >&2
fi
SH
chmod +x "$WORK/bin/gh" "$WORK/bin/npx"

FIXTURE_DIR="$WORK/fixtures"
origin_show() { git -C "$ORIGIN" show "main:intentions/$1.md"; }
origin_sha() { git -C "$ORIGIN" rev-parse main; }
sync_clone() { git -C "$1" fetch -q origin main && git -C "$1" reset -q --hard FETCH_HEAD; }
edit_line() { # <clone> <id> <n> <text>
  sed -i "s/^line$3: .*/line$3: $4/" "$1/intentions/$2.md"
}

run_pn() { # <clone> [park-node args...]
  local clone="$1"; shift
  (
    cd "$clone" || exit 99
    export PATH="$WORK/bin:$PATH"
    export GC_FIXTURE_DIR="$FIXTURE_DIR"
    export GRAPH_COMMIT_CHECK_POLL_SECONDS=0
    export GRAPH_COMMIT_CHECK_TIMEOUT_SECONDS=5
    export GRAPH_COMMIT_MAX_ATTEMPTS=5
    bash packages/intentionsutil/scripts/park-node "$@"
  )
}

run_rp() { # <clone> <gh-log-file> [resolve-park args...]
  local clone="$1" ghlog="$2"; shift 2
  (
    cd "$clone" || exit 99
    export PATH="$WORK/bin:$PATH"
    export GC_FIXTURE_DIR="$FIXTURE_DIR"
    export GH_LOG="$ghlog"
    export GRAPH_COMMIT_CHECK_POLL_SECONDS=0
    export GRAPH_COMMIT_CHECK_TIMEOUT_SECONDS=5
    export GRAPH_COMMIT_MAX_ATTEMPTS=5
    bash packages/intentionsutil/scripts/resolve-park "$@"
  )
}

# ---------------------------------------------------------------------------
# Case 1: stale far-ahead worktree park does NOT revert landed content.
# ---------------------------------------------------------------------------
# writer-a lands a body edit (line1) to t-stale on origin. writer-b is a
# far-ahead PR-branch worktree that NEVER synced: its local t-stale.md is still
# the seed (line1: base) and its HEAD carries a non-intentions code commit
# (so graph-commit's ensure_intentions_only_base reset+re-materialize path — the
# real revert vector — fires). Parking t-stale from writer-b must keep line1's
# landed edit and add office_hours; the pre-fix code would revert line1 to base.
A="$WORK/a"; B="$WORK/b"
make_clone "$A" writer-a
make_clone "$B" writer-b

sync_clone "$A"
edit_line "$A" t-stale 1 origin-body-edit
# Land the body edit through the real graph-commit so origin advances.
(
  cd "$A" || exit 99
  export PATH="$WORK/bin:$PATH" GC_FIXTURE_DIR="$FIXTURE_DIR"
  export GRAPH_COMMIT_CHECK_POLL_SECONDS=0 GRAPH_COMMIT_CHECK_TIMEOUT_SECONDS=5
  bash packages/intentionsutil/scripts/graph-commit -m 'test: land body edit' t-stale
) >/dev/null 2>&1

# writer-b: far-ahead PR branch, stale on the intentions file.
mkdir -p "$B/src"
echo "console.log('pr feature code')" >"$B/src/feature.js"
git -C "$B" add src/feature.js
git -C "$B" commit -qm 'pr: non-intentions code change (simulated PR branch)'
far_tip="$(git -C "$B" rev-parse HEAD)"

out="$(run_pn "$B" t-stale 'wrong-worktree deviation' 2>&1)"; rc=$?
content="$(origin_show t-stale)"
restored="$(git -C "$B" rev-parse HEAD)"
if [[ $rc -eq 0 ]] \
   && grep -q 'line1: origin-body-edit' <<<"$content" \
   && grep -q 'office_hours' <<<"$content" \
   && [[ "$restored" == "$far_tip" ]]; then
  ok "stale far-ahead park: landed body edit survives, office_hours set, HEAD restored"
else
  no "stale far-ahead park (rc=$rc restored=$restored far_tip=$far_tip)"
  printf '%s\n' "$out"; printf '%s\n' "$content"
fi

# ---------------------------------------------------------------------------
# Case 2: a concurrent origin/main write between FRESH_BLOB resolution and the
# --base freshness check triggers graph-commit's auto-park fallback, not a
# clobber.
# ---------------------------------------------------------------------------
# park-node's own fetch and graph-commit's check_base_freshness fetch happen
# back-to-back inside one synchronous process, so there is no natural injection
# point to land a concurrent change between them. Rather than race, we swap the
# graph-commit park-node invokes for a thin test wrapper that (once) lands a
# concurrent change on origin/main for the node, then delegates to the real
# graph-commit (graph-commit.real). The real graph-commit's check_base_freshness
# then re-fetches, sees origin's blob no longer matches the FRESH_BLOB token
# park-node resolved; its layers-1-3 auto-merge fails to mechanically resolve
# the raw content collision, so it falls through to its documented
# park_and_exit() fallback — office_hours is set on the node (reason containing
# "mechanical-unresolved") and that parking write is pushed to origin/main.
# park-node still exits non-zero, since its OWN writer's edit is what didn't
# land.
C="$WORK/c"
make_clone "$C" writer-c
# Install the wrapper in park-node's SCRIPT_DIR (the same dir park-node lives in
# within this clone), keeping the real graph-commit as graph-commit.real.
mv "$C/packages/intentionsutil/scripts/graph-commit" \
   "$C/packages/intentionsutil/scripts/graph-commit.real"
cat >"$C/packages/intentionsutil/scripts/graph-commit" <<'SH'
#!/usr/bin/env bash
set -euo pipefail
SD="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [[ ! -f "$SD/.concurrent-landed" ]]; then
  # Land a concurrent change to the SAME node on origin/main, simulating another
  # writer committing after park-node resolved FRESH_BLOB but before this check.
  D="$(mktemp -d)"
  git clone -q "$GC_ORIGIN" "$D"
  git -C "$D" config user.email other@test
  git -C "$D" config user.name other
  printf 'line14: concurrent edit\n' >>"$D/intentions/$GC_NODE.md"
  git -C "$D" commit -qam 'concurrent edit (bypassing park-node)'
  git -C "$D" push -q origin main
  rm -rf "$D"
  : >"$SD/.concurrent-landed"
fi
exec "$SD/graph-commit.real" "$@"
SH
chmod +x "$C/packages/intentionsutil/scripts/graph-commit"
# Commit the wrapper swap locally so graph-commit.real's own
# assert_clean_outside_ids pre-flight guard (which refuses to start on any
# unrelated dirty TRACKED file) doesn't trip on the tracked graph-commit path
# this swap modifies. graph-commit.real is untracked and already exempt (the
# guard skips '??' entries).
git -C "$C" add packages/intentionsutil/scripts/graph-commit
git -C "$C" commit -qm 'test: install graph-commit wrapper for concurrent-write simulation'

before_sha="$(origin_sha)"
out="$(
  cd "$C" || exit 99
  export PATH="$WORK/bin:$PATH" GC_FIXTURE_DIR="$FIXTURE_DIR"
  export GRAPH_COMMIT_CHECK_POLL_SECONDS=0 GRAPH_COMMIT_CHECK_TIMEOUT_SECONDS=5
  export GC_ORIGIN="$ORIGIN" GC_NODE=t-concurrent
  bash packages/intentionsutil/scripts/park-node t-concurrent 'provision-failed' 2>&1
)"; rc=$?
content="$(origin_show t-concurrent)"
# graph-commit's fail-closed design (layers 1-3 auto-serialize mechanical
# contention) refuses to land THIS writer's edit — park-node exits non-zero —
# but the same fail-closed sequence lands ITS OWN office_hours park onto the
# fresh origin/main content as the recorded outcome, so `office_hours` IS
# expected in the post-state (it is graph-commit's park, not this writer's).
if [[ $rc -ne 0 ]] \
   && grep -q 'concurrent-edit conflict' <<<"$out" \
   && grep -q 'line14: concurrent edit' <<<"$content" \
   && grep -q 'office_hours' <<<"$content" \
   && grep -q 'mechanical-unresolved' <<<"$content"; then
  ok "concurrent origin/main advance triggers auto-park: park-node/graph-commit exit non-zero, concurrent content survives, node is auto-parked via office_hours"
else
  no "concurrent-write auto-park (rc=$rc before_sha=$before_sha)"
  printf '%s\n' "$out"; printf '%s\n' "$content"
fi

# ---------------------------------------------------------------------------
# Case 3: a node absent from origin/main is refused before any write.
# ---------------------------------------------------------------------------
E="$WORK/e"
make_clone "$E" writer-e
before_sha="$(origin_sha)"
out="$(run_pn "$E" nonexistent-node 'some reason' 2>&1)"; rc=$?
if [[ $rc -eq 1 ]] \
   && grep -q 'does not exist on origin/main' <<<"$out" \
   && [[ "$(origin_sha)" == "$before_sha" ]]; then
  ok "absent node: park-node refuses a node not on origin/main (exit 1), main unchanged"
else
  no "absent node refusal (rc=$rc)"; printf '%s\n' "$out"
fi

# ---------------------------------------------------------------------------
# Case 4: --pr threads through to the write, and pre-existing frontmatter
# (simulating execution.branch/attempts/markers) survives untouched.
# ---------------------------------------------------------------------------
F="$WORK/f"
make_clone "$F" writer-f
before_content="$(origin_show t-pr)"
out="$(run_pn "$F" --pr 2942 t-pr 'unit-test park with pr' 2>&1)"; rc=$?
content="$(origin_show t-pr)"
if [[ $rc -eq 0 ]] \
   && grep -q 'execution_pr: 2942' <<<"$content" \
   && grep -q 'office_hours' <<<"$content" \
   && [[ "$content" == "$before_content"$'\n'*office_hours* ]]; then
  ok "park --pr <n>: execution.pr recorded, pre-existing content preserved"
else
  no "park --pr <n> (rc=$rc)"; printf '%s\n' "$out"; printf '%s\n' "$content"
fi

# ---------------------------------------------------------------------------
# Case 5: park without --pr leaves execution untouched (no execution_pr line).
# ---------------------------------------------------------------------------
G="$WORK/g"
make_clone "$G" writer-g
before_sha="$(origin_sha)"
out="$(run_pn "$G" t-concurrent 'unit-test park without pr' 2>&1)"; rc=$?
# t-concurrent was already parked+mutated by case 2; re-park it here just to
# confirm the no-flag path never emits execution_pr regardless.
content="$(origin_show t-concurrent)"
if ! grep -q 'execution_pr:' <<<"$content"; then
  ok "park without --pr: no execution_pr line emitted"
else
  no "park without --pr unexpectedly emitted execution_pr"; printf '%s\n' "$content"
fi

# ---------------------------------------------------------------------------
# Case 6: --pr with a non-integer value is rejected before any fetch/write.
# ---------------------------------------------------------------------------
H="$WORK/h"
make_clone "$H" writer-h
before_sha="$(origin_sha)"
out="$(run_pn "$H" --pr not-a-number t-pr-bad-arg 'should not park' 2>&1)"; rc=$?
if [[ $rc -eq 2 ]] \
   && grep -q 'must be a non-negative integer' <<<"$out" \
   && [[ "$(origin_sha)" == "$before_sha" ]]; then
  ok "park --pr <non-integer>: rejected (exit 2), origin/main untouched"
else
  no "park --pr <non-integer> rejection (rc=$rc)"; printf '%s\n' "$out"
fi

# ---------------------------------------------------------------------------
# Case 7: resolve-park --ratify calls `gh pr ready <pr>` and clears office_hours.
# ---------------------------------------------------------------------------
I="$WORK/i"
make_clone "$I" writer-i
run_pn "$I" --pr 3001 t-resolve-ratify 'unit-test resolve ratify setup' >/dev/null 2>&1
sync_clone "$I"
GHLOG_RATIFY="$WORK/ghlog-ratify"
out="$(run_rp "$I" "$GHLOG_RATIFY" t-resolve-ratify --ratify 2>&1)"; rc=$?
content="$(origin_show t-resolve-ratify)"
if [[ $rc -eq 0 ]] \
   && grep -q '^ready 3001$' "$GHLOG_RATIFY" \
   && grep -q 'office_hours: null' <<<"$content"; then
  ok "resolve-park --ratify: gh pr ready called, office_hours cleared"
else
  no "resolve-park --ratify (rc=$rc)"; printf '%s\n' "$out"; printf '%s\n' "$content"
fi

# ---------------------------------------------------------------------------
# Case 8: resolve-park --reject calls `gh pr close <pr>` and clears office_hours.
# ---------------------------------------------------------------------------
J="$WORK/j"
make_clone "$J" writer-j
run_pn "$J" --pr 3002 t-resolve-reject 'unit-test resolve reject setup' >/dev/null 2>&1
sync_clone "$J"
GHLOG_REJECT="$WORK/ghlog-reject"
out="$(run_rp "$J" "$GHLOG_REJECT" t-resolve-reject --reject 'duplicate of #3000' 2>&1)"; rc=$?
content="$(origin_show t-resolve-reject)"
if [[ $rc -eq 0 ]] \
   && grep -q '^close 3002$' "$GHLOG_REJECT" \
   && grep -q 'office_hours: null' <<<"$content"; then
  ok "resolve-park --reject: gh pr close called, office_hours cleared"
else
  no "resolve-park --reject (rc=$rc)"; printf '%s\n' "$out"; printf '%s\n' "$content"
fi

# ---------------------------------------------------------------------------
# Case 9: resolve-park refuses a node that is not parked.
# ---------------------------------------------------------------------------
K="$WORK/k"
make_clone "$K" writer-k
before_sha="$(origin_sha)"
GHLOG_UNPARKED="$WORK/ghlog-unparked"
out="$(run_rp "$K" "$GHLOG_UNPARKED" t-resolve-unparked --ratify 2>&1)"; rc=$?
if [[ $rc -eq 1 ]] \
   && grep -q 'is not parked' <<<"$out" \
   && [[ ! -s "$GHLOG_UNPARKED" ]] \
   && [[ "$(origin_sha)" == "$before_sha" ]]; then
  ok "resolve-park: refuses an unparked node (exit 1), no gh call, main unchanged"
else
  no "resolve-park refuse-unparked (rc=$rc)"; printf '%s\n' "$out"
fi

echo
echo "passed: $PASS  failed: $FAIL"
[[ $FAIL -eq 0 ]] || exit 1
exit 0
