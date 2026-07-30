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
#   4. park-node byte-identical restore-on-failure (tactic-graph-write-failure-
#      rollback Unit 1): when graph-commit fails AFTER the office_hours write
#      lands on disk, the trap restores intentions/<id>.md from origin/main —
#      asserted via `git diff` against the clone's HEAD being empty (byte
#      identical), not just "file exists".
#   5. demote-node-to-implement byte-identical restore-on-failure (same Unit):
#      identical shape, but demote-node-to-implement's mutation runs through
#      the REAL apply-node-transition.ts (node --import tsx/esm), so this case
#      needs the harness's REAL packages/intentionsutil/src alongside the
#      graph-commit-fails wrapper trick — reaching MUTATED=1 is only possible
#      by actually executing the real store/schema/transitions code, not a
#      shim.
#   6. park --pr <n> records execution.pr and preserves pre-existing content
#      (tactic-office-hours-pr-custody Unit 1 — the non-clobber invariant the
#      census consumer depends on).
#   7. park WITHOUT --pr emits no execution_pr at all (backward compatibility
#      with the Stop hook's existing two/three-arg calls).
#   8. --pr with a non-integer is rejected (exit 2) before any fetch or write.
#   9. resolve-park --ratify calls `gh pr ready <pr>` and clears office_hours
#      (Unit 3).
#  10. resolve-park --reject calls `gh pr close <pr>` and clears office_hours.
#  11. resolve-park refuses a node that is not parked (exit 1), making no gh
#      call and leaving origin/main untouched.
#  12. A matching `--base` pin is transparent to the normal park flow: capture
#      the current origin/main blob sha for t-pinned, pass it back via --base,
#      and the park lands exactly as it would with no --base at all (exit 0,
#      office_hours set).
#  13. A stale `--base` pin (captured before a park that has since advanced
#      origin/main) refuses BEFORE any mutation: exit 3, a `stale-diagnosis`
#      marker on stderr, origin/main byte-unchanged, and no local working-tree
#      diff left behind for the trap to roll back — the pin check in park-node
#      runs before the local file is even overwritten from origin/main.
#  14. The manifest-file form of `--base` selects the line matching this
#      node's id out of a multi-node manifest (dump-node.ts's base-manifest.txt
#      format): a stale entry for t-pinned still refuses with exit 3, and a
#      manifest that omits t-pinned entirely (covers only an unrelated node)
#      is a caller usage error — exit 2, not exit 3 — since the pin can't even
#      be resolved. Neither sub-case touches origin/main.
#  15. Flag-parsing regressions on the new leading-flags-only parse loop:
#      `--base` with no following value, an unrecognized leading flag, and a
#      non-40-hex `--base` value all exit 2 before any network call. A bare
#      positional invocation (no --base at all) whose <reason>/<recommendation>
#      free-text arguments start with `-` and contain embedded spaces still
#      parks successfully (exit 0) — proving the "first non-flag argument ends
#      flag parsing" rule isn't fooled by dash-prefixed positionals.
#  16. clear-park happy path: a parked node is cleared on origin/main
#      (office_hours: null) with no working-tree residue left in the clone.
#  17. clear-park idempotent no-op: re-running on an already-cleared node exits
#      0 with a "nothing to do" note, leaves origin/main byte-unchanged, and
#      restores the node file the origin/main refresh had overwritten (no
#      working-tree diff) — the explicit restore-before-exit-0 path.
#  18. clear-park byte-identical restore-on-failure: with graph-commit swapped
#      for a wrapper that fails AFTER the office_hours clear landed on disk,
#      the trap restores intentions/<id>.md exactly (git diff empty).
#  19. clear-park `--base` diagnosis-time pin, mirroring cases 12-13: a
#      matching pin is transparent (exit 0, cleared on origin); a stale pin
#      refuses BEFORE any mutation (exit 3, `stale-diagnosis` on stderr,
#      origin/main unchanged, no local diff).
#  20. clear-park repo targeting — THE regression guard for
#      tactic-clear-park-repo-targeting-guard. clear-park derives REPO_ROOT
#      from its own script location and writes there, but graph-commit resolves
#      its repo from `-C` if given else from CWD. Invoking clone X's clear-park
#      by absolute path from clone Y's cwd (and again from a non-repo dir) must
#      still land the clear on origin/main and must leave clone Y's intentions/
#      untouched. Without the `-C "$REPO_ROOT"` on clear-park's graph-commit
#      call this fails: graph-commit inspects Y, finds nothing staged for the id
#      and its HEAD blob equal to origin/main, and takes the benign
#      "no new changes" branch — exiting 0 having committed nothing (or, with
#      Unit 1's --expect guard, failing loudly).
#  21. resolve-park repo targeting: the same construction for resolve-park
#      --ratify — invoked from a foreign cwd, `gh pr ready` still fires, the
#      clear lands on origin/main, and the foreign clone stays clean.
#
# No network needed. Cases 1-3 and 6-15 need only bash + git + jq (the gh and
# npx PATH shims stand in for the GitHub API and the tsx writers). Cases 4-5
# need a real `node`/`npx tsx` too (case 5's apply-node-transition.ts is real
# TypeScript, resolved against a node_modules SYMLINK to this repo's own —
# read-only, never written by the test).

set -uo pipefail

HARNESS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REAL_REPO_ROOT="$(cd "$HARNESS_DIR/../../.." && pwd)"
PN_SCRIPT="$HARNESS_DIR/park-node"
GC_SCRIPT="$HARNESS_DIR/graph-commit"
RP_SCRIPT="$HARNESS_DIR/resolve-park"
CP_SCRIPT="$HARNESS_DIR/clear-park"
DEMOTE_SCRIPT="$HARNESS_DIR/demote-node-to-implement"
APPLY_TS="$HARNESS_DIR/apply-node-transition.ts"
[[ -f "$PN_SCRIPT" ]] || { echo "error: park-node not found at $PN_SCRIPT" >&2; exit 1; }
[[ -f "$GC_SCRIPT" ]] || { echo "error: graph-commit not found at $GC_SCRIPT" >&2; exit 1; }
[[ -f "$RP_SCRIPT" ]] || { echo "error: resolve-park not found at $RP_SCRIPT" >&2; exit 1; }
[[ -f "$CP_SCRIPT" ]] || { echo "error: clear-park not found at $CP_SCRIPT" >&2; exit 1; }
[[ -f "$DEMOTE_SCRIPT" ]] || { echo "error: demote-node-to-implement not found at $DEMOTE_SCRIPT" >&2; exit 1; }
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
cp "$CP_SCRIPT" "$SEED/packages/intentionsutil/scripts/clear-park"
cp "$DEMOTE_SCRIPT" "$SEED/packages/intentionsutil/scripts/demote-node-to-implement"
cp "$APPLY_TS" "$SEED/packages/intentionsutil/scripts/apply-node-transition.ts"
chmod +x "$SEED/packages/intentionsutil/scripts/park-node" \
         "$SEED/packages/intentionsutil/scripts/graph-commit" \
         "$SEED/packages/intentionsutil/scripts/resolve-park" \
         "$SEED/packages/intentionsutil/scripts/clear-park" \
         "$SEED/packages/intentionsutil/scripts/demote-node-to-implement"
# Cases 1-3 (npx-shimmed) never load a real store module, so a stub `store.js`
# would suffice for them — but case 5 runs the REAL apply-node-transition.ts,
# which imports "./store.js" (tsx resolves the .ts source at that specifier).
# Copy the repo's real `src/` wholesale: every file under it is a same-package
# relative import (verified: no cross-package deps beyond the npm "yaml"
# package, resolved via the node_modules symlink each clone gets below), so a
# blanket copy is simpler and safer than cherry-picking individual files.
cp -r "$REAL_REPO_ROOT/packages/intentionsutil/src/." "$SEED/packages/intentionsutil/src/"
# The real package.json sets "type": "module" — without it, Node finds no
# package.json anywhere above the scratch tree and defaults .ts/.js resolution
# to CommonJS, which breaks tsx's ESM loader (ERR_REQUIRE_CYCLE_MODULE) on
# case 5's real apply-node-transition.ts execution.
cp "$REAL_REPO_ROOT/packages/intentionsutil/package.json" "$SEED/packages/intentionsutil/package.json"

seed_node() { # <id> — 12 numbered lines so distant edits rebase cleanly
  local i
  {
    echo "id: $1"
    for i in $(seq 1 12); do echo "line$i: base"; done
  } >"$SEED/intentions/$1.md"
}
for id in t-stale t-concurrent t-pr t-pr-bad-arg t-resolve-ratify t-resolve-reject t-resolve-unparked t-pinned \
          t-clear-happy t-clear-noop t-clear-rollback t-clear-pinned t-clear-cwd t-resolve-cwd; do
  seed_node "$id"
done
# t-demote: a schema-VALID node (only id/kind/statement/owner/status are
# required — packages/intentionsutil/src/schema.ts — everything else defaults)
# for case 5, which runs the real readNode/writeNode round-trip through
# apply-node-transition.ts's --scope-stale path, not the synthetic
# line-numbered content the npx-shimmed cases use.
cat >"$SEED/intentions/t-demote.md" <<'NODE'
---
id: t-demote
kind: tactic
statement: harness node for demote-node-to-implement rollback test
owner: ai
status: codified
phase: qa
execution:
  branch: t-demote-branch
  pr: null
  attempts: {}
  markers: ["qa-complete"]
  fix: null
  strategy_fingerprint: {}
---
# harness node for demote-node-to-implement rollback test
NODE
git -C "$SEED" add -A
git -C "$SEED" commit -qm seed
git -C "$SEED" push -q origin main

# --- Independent writer clones -------------------------------------------
make_clone() { # <dst> <identity>
  git clone -q "$ORIGIN" "$1"
  git -C "$1" config user.email "$2@test"
  git -C "$1" config user.name "$2"
  # node_modules SYMLINK (never copied, never committed — untracked, so
  # graph-commit's assert_clean_outside_ids guard skips it via its '??' exemption,
  # same as the graph-commit wrapper swap below). Needed only by case 5's real
  # `node --import tsx/esm apply-node-transition.ts`, which resolves the "yaml"
  # package and the tsx loader itself by walking up from the clone's own root —
  # this repo's real node_modules, read-only, is never written by the test.
  ln -s "$REAL_REPO_ROOT/node_modules" "$1/node_modules"
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
#   (a) park-node's own direct write: <dir> <since> <reason> <recommendation> <id> <pr>
#       — exactly 6 args remain after stripping tsx/helper/store (park-node
#       always appends a trailing pr slot, empty or numeric).
#   (b) graph-commit's park_write() concurrent-edit-conflict parking helper:
#       <dir> <since> <reason> <snapDir> <pruneCsv> <id...> — 6+ args remain
#       (snapDir/pruneCsv occupy the recommendation/id slots, and one or more
#       ids follow). Distinguished from (a) by whether arg4 is a real
#       directory (snapDir always is; park-node's free-text recommendation
#       never is).
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
# (dir, id) — plus clear-park's single clear-write helper (dir, id): all
# leave exactly 2 args after stripping tsx/helper/store, distinct from (a)'s 6
# and (b)'s 6+. They are disambiguated from each other by the helper file's own
# content (readable — it is a plain tempfile). The clear-write branch covers
# both resolve-park's and clear-park's writers, whose bodies each emit
# "cleared office_hours on ${id}"; only clear-park's ALSO refuses an
# already-clear node with exit 3, which the branch emulates below (harmless for
# resolve-park, which only reaches its clear-write after its own state-read has
# already confirmed the node is parked).
if [[ $# -eq 5 ]]; then
  rp_dir="$4"; rp_id="$5"
  [[ -f "$rp_dir/$rp_id.md" ]] || { echo "npx shim: unreadable node $rp_id" >&2; exit 1; }
  if grep -q 'cleared office_hours' "$helper"; then
    # Parked-ness is the LAST office_hours line in the file, since this
    # harness's clears/parks append rather than rewrite (same `grep | tail -1`
    # idiom the state-read branch below uses for execution_pr).
    last_oh=""
    if grep -q '^office_hours' "$rp_dir/$rp_id.md"; then
      last_oh="$(grep '^office_hours' "$rp_dir/$rp_id.md" | tail -1)"
    fi
    if [[ -z "$last_oh" || "$last_oh" == "office_hours: null" ]]; then
      # clear-park's helper: `if (node.office_hours == null) process.exit(3)`.
      echo "clear-park: $rp_id is not parked (office_hours already null)" >&2
      exit 3
    fi
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
# id pr — from (b) graph-commit's park_write — dir since reason snapDir
# pruneCsv id... — by whether arg4 is a real directory (snapDir always is;
# park-node's free-text recommendation never is).
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

run_cp() { # <clone> [clear-park args...]
  local clone="$1"; shift
  (
    cd "$clone" || exit 99
    export PATH="$WORK/bin:$PATH"
    export GC_FIXTURE_DIR="$FIXTURE_DIR"
    export GRAPH_COMMIT_CHECK_POLL_SECONDS=0
    export GRAPH_COMMIT_CHECK_TIMEOUT_SECONDS=5
    export GRAPH_COMMIT_MAX_ATTEMPTS=5
    bash packages/intentionsutil/scripts/clear-park "$@"
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
# Commit the wrapper swap so the clone's working tree is clean before park-node
# runs graph-commit: graph-commit's own assert_clean_outside_ids() pre-flight
# guard refuses to start on ANY dirty tracked file outside this call's node
# set, and an uncommitted mv+overwrite of the tracked graph-commit script would
# otherwise trip that guard with an unrelated-dirty-file error, masking the
# concurrent-write refusal this case means to exercise.
git -C "$C" add packages/intentionsutil/scripts/graph-commit \
                packages/intentionsutil/scripts/graph-commit.real
git -C "$C" commit -qm 'test: install concurrent-write wrapper'

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
# Case 4: park-node byte-identical restore-on-failure
# (tactic-graph-write-failure-rollback Unit 1).
# ---------------------------------------------------------------------------
# graph-commit is swapped for a wrapper that unconditionally fails AFTER the
# real office_hours write already landed on disk (park-node's own npx-tsx
# write runs for real; only the downstream graph-commit call is faked). The
# trap this guards restores intentions/t-restore-pn.md from origin/main on any
# non-zero exit once MUTATED=1 — assert byte-identical restore via `git diff`
# against the clone's own HEAD (which still holds the pre-mutation seed
# content) being EMPTY, not merely "the file exists".
D="$WORK/d"
make_clone "$D" writer-d
mv "$D/packages/intentionsutil/scripts/graph-commit" \
   "$D/packages/intentionsutil/scripts/graph-commit.real"
cat >"$D/packages/intentionsutil/scripts/graph-commit" <<'SH'
#!/usr/bin/env bash
echo "graph-commit wrapper: simulated post-mutation failure" >&2
exit 1
SH
chmod +x "$D/packages/intentionsutil/scripts/graph-commit"
# graph-commit is UNTRACKED in this clone's index (never committed) — exempt
# from assert_clean_outside_ids by its '??' skip, so no commit is needed here
# (unlike case 2, which routes through the REAL graph-commit.real and so must
# keep that pre-flight guard happy for the tracked path).

out="$(run_pn "$D" t-stale 'simulated post-mutation failure' 2>&1)"; rc=$?
diff_after="$(git -C "$D" diff -- intentions/t-stale.md)"
if [[ $rc -ne 0 ]] && grep -q 'office_hours write was rolled back' <<<"$out" \
   && [[ -z "$diff_after" ]]; then
  ok "park-node byte-identical restore: graph-commit failure rolls back the office_hours write (git diff empty)"
else
  no "park-node byte-identical restore (rc=$rc)"
  printf '%s\n' "$out"; printf 'diff: %s\n' "$diff_after"
fi

# ---------------------------------------------------------------------------
# Case 5: demote-node-to-implement byte-identical restore-on-failure (same
# Unit). Identical shape to case 4, but the mutation runs through the REAL
# apply-node-transition.ts (node --import tsx/esm) against the schema-valid
# t-demote node, so MUTATED=1 is only reachable by actually executing the real
# store/schema/transitions code — not a shim.
# ---------------------------------------------------------------------------
G="$WORK/g"
make_clone "$G" writer-g
mv "$G/packages/intentionsutil/scripts/graph-commit" \
   "$G/packages/intentionsutil/scripts/graph-commit.real"
cat >"$G/packages/intentionsutil/scripts/graph-commit" <<'SH'
#!/usr/bin/env bash
echo "graph-commit wrapper: simulated post-mutation failure" >&2
exit 1
SH
chmod +x "$G/packages/intentionsutil/scripts/graph-commit"

out="$(
  cd "$G" || exit 99
  bash packages/intentionsutil/scripts/demote-node-to-implement t-demote 2>&1
)"; rc=$?
diff_after="$(git -C "$G" diff -- intentions/t-demote.md)"
if [[ $rc -ne 0 ]] && grep -q 'demotion write was rolled back' <<<"$out" \
   && [[ -z "$diff_after" ]]; then
  ok "demote-node-to-implement byte-identical restore: real apply-node-transition.ts mutation is rolled back on graph-commit failure (git diff empty)"
else
  no "demote-node-to-implement byte-identical restore (rc=$rc)"
  printf '%s\n' "$out"; printf 'diff: %s\n' "$diff_after"
fi

# ---------------------------------------------------------------------------
# Case 6: --pr threads through to the write, and pre-existing frontmatter
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
# Case 7: park without --pr leaves execution untouched (no execution_pr line).
# ---------------------------------------------------------------------------
L="$WORK/l"
make_clone "$L" writer-l
before_sha="$(origin_sha)"
out="$(run_pn "$L" t-concurrent 'unit-test park without pr' 2>&1)"; rc=$?
# t-concurrent was already parked+mutated by case 2; re-park it here just to
# confirm the no-flag path never emits execution_pr regardless.
content="$(origin_show t-concurrent)"
if ! grep -q 'execution_pr:' <<<"$content"; then
  ok "park without --pr: no execution_pr line emitted"
else
  no "park without --pr unexpectedly emitted execution_pr"; printf '%s\n' "$content"
fi

# ---------------------------------------------------------------------------
# Case 8: --pr with a non-integer value is rejected before any fetch/write.
# ---------------------------------------------------------------------------
H_PR="$WORK/h-pr"
make_clone "$H_PR" writer-h-pr
before_sha="$(origin_sha)"
out="$(run_pn "$H_PR" --pr not-a-number t-pr-bad-arg 'should not park' 2>&1)"; rc=$?
if [[ $rc -eq 2 ]] \
   && grep -q 'must be a non-negative integer' <<<"$out" \
   && [[ "$(origin_sha)" == "$before_sha" ]]; then
  ok "park --pr <non-integer>: rejected (exit 2), origin/main untouched"
else
  no "park --pr <non-integer> rejection (rc=$rc)"; printf '%s\n' "$out"
fi

# ---------------------------------------------------------------------------
# Case 9: resolve-park --ratify calls `gh pr ready <pr>` and clears office_hours.
# ---------------------------------------------------------------------------
I_RATIFY="$WORK/i-ratify"
make_clone "$I_RATIFY" writer-i-ratify
run_pn "$I_RATIFY" --pr 3001 t-resolve-ratify 'unit-test resolve ratify setup' >/dev/null 2>&1
sync_clone "$I_RATIFY"
GHLOG_RATIFY="$WORK/ghlog-ratify"
out="$(run_rp "$I_RATIFY" "$GHLOG_RATIFY" t-resolve-ratify --ratify 2>&1)"; rc=$?
content="$(origin_show t-resolve-ratify)"
if [[ $rc -eq 0 ]] \
   && grep -q '^ready 3001$' "$GHLOG_RATIFY" \
   && grep -q 'office_hours: null' <<<"$content"; then
  ok "resolve-park --ratify: gh pr ready called, office_hours cleared"
else
  no "resolve-park --ratify (rc=$rc)"; printf '%s\n' "$out"; printf '%s\n' "$content"
fi

# ---------------------------------------------------------------------------
# Case 10: resolve-park --reject calls `gh pr close <pr>` and clears office_hours.
# ---------------------------------------------------------------------------
J_REJECT="$WORK/j-reject"
make_clone "$J_REJECT" writer-j-reject
run_pn "$J_REJECT" --pr 3002 t-resolve-reject 'unit-test resolve reject setup' >/dev/null 2>&1
sync_clone "$J_REJECT"
GHLOG_REJECT="$WORK/ghlog-reject"
out="$(run_rp "$J_REJECT" "$GHLOG_REJECT" t-resolve-reject --reject 'duplicate of #3000' 2>&1)"; rc=$?
content="$(origin_show t-resolve-reject)"
if [[ $rc -eq 0 ]] \
   && grep -q '^close 3002$' "$GHLOG_REJECT" \
   && grep -q 'office_hours: null' <<<"$content"; then
  ok "resolve-park --reject: gh pr close called, office_hours cleared"
else
  no "resolve-park --reject (rc=$rc)"; printf '%s\n' "$out"; printf '%s\n' "$content"
fi

# ---------------------------------------------------------------------------
# Case 11: resolve-park refuses a node that is not parked.
# ---------------------------------------------------------------------------
K_UNPARKED="$WORK/k-unparked"
make_clone "$K_UNPARKED" writer-k-unparked
before_sha="$(origin_sha)"
GHLOG_UNPARKED="$WORK/ghlog-unparked"
out="$(run_rp "$K_UNPARKED" "$GHLOG_UNPARKED" t-resolve-unparked --ratify 2>&1)"; rc=$?
if [[ $rc -eq 1 ]] \
   && grep -q 'is not parked' <<<"$out" \
   && [[ ! -s "$GHLOG_UNPARKED" ]] \
   && [[ "$(origin_sha)" == "$before_sha" ]]; then
  ok "resolve-park: refuses an unparked node (exit 1), no gh call, main unchanged"
else
  no "resolve-park refuse-unparked (rc=$rc)"; printf '%s\n' "$out"
fi

# ---------------------------------------------------------------------------
# Case 12: a matching --base pin is transparent to the normal park flow.
# ---------------------------------------------------------------------------
# Capture the CURRENT origin/main blob for t-pinned, then pass it straight
# back as --base. Since it matches FRESH_BLOB at execution time, the pin check
# is a no-op and the park proceeds exactly as an unpinned park would.
H="$WORK/h"
make_clone "$H" writer-h
pin="$(git -C "$ORIGIN" rev-parse main:intentions/t-pinned.md)"

out="$(run_pn "$H" --base "$pin" t-pinned 'diagnosed reason' 2>&1)"; rc=$?
content="$(origin_show t-pinned)"
if [[ $rc -eq 0 ]] && grep -q 'office_hours' <<<"$content"; then
  ok "matching --base pin: park proceeds normally (exit 0, office_hours set)"
else
  no "matching --base pin (rc=$rc)"; printf '%s\n' "$out"
fi

# ---------------------------------------------------------------------------
# Case 13: a stale --base pin refuses with exit 3, zero side effects.
# ---------------------------------------------------------------------------
# Reuse clone H: case 12's own park just advanced origin/main for t-pinned, so
# the $pin captured before case 12 is now stale relative to the new FRESH_BLOB.
# The pin check runs before any mutation, so this must refuse cleanly: exit 3,
# a stale-diagnosis marker on stderr, origin/main byte-unchanged, and no local
# working-tree diff left over for the trap to roll back.
before_sha="$(origin_sha)"
out="$(run_pn "$H" --base "$pin" t-pinned 'second reason' 2>&1)"; rc=$?
diff_after="$(git -C "$H" diff -- intentions/t-pinned.md)"
if [[ $rc -eq 3 ]] \
   && grep -q 'stale-diagnosis' <<<"$out" \
   && [[ "$(origin_sha)" == "$before_sha" ]] \
   && [[ -z "$diff_after" ]]; then
  ok "stale --base pin: refuses before any mutation (exit 3, stale-diagnosis, main unchanged, no local diff)"
else
  no "stale --base pin (rc=$rc before_sha=$before_sha)"
  printf '%s\n' "$out"; printf 'diff: %s\n' "$diff_after"
fi

# ---------------------------------------------------------------------------
# Case 14: manifest-file form of --base, plus a manifest that doesn't cover
# the requested node.
# ---------------------------------------------------------------------------
# A manifest holding entries for multiple nodes (dump-node.ts's
# base-manifest.txt format, one `<id>=<sha>` line per node) proves park-node
# selects the line matching THIS invocation's node id: a stale entry for
# t-pinned (the pre-case-12 $pin, now stale) still refuses with exit 3 even
# though an unrelated t-stale line is also present. Then, with the t-pinned
# line removed entirely, the manifest can't even be resolved to a pin for this
# node — that's a caller usage error (exit 2), distinct from staleness (exit
# 3). Neither sub-case touches origin/main.
I="$WORK/i"
make_clone "$I" writer-i
stale_blob_for_tstale="$(git -C "$ORIGIN" rev-parse main:intentions/t-stale.md)"
manifest="$WORK/manifest14.txt"
cat >"$manifest" <<EOF
t-pinned=$pin
t-stale=$stale_blob_for_tstale
EOF

before_sha="$(origin_sha)"
out1="$(run_pn "$I" --base "$manifest" t-pinned 'reason' 2>&1)"; rc1=$?

cat >"$manifest" <<EOF
t-stale=$stale_blob_for_tstale
EOF
out2="$(run_pn "$I" --base "$manifest" t-pinned 'reason' 2>&1)"; rc2=$?
after_sha="$(origin_sha)"

if [[ $rc1 -eq 3 ]] && grep -q 'stale-diagnosis' <<<"$out1" \
   && [[ $rc2 -eq 2 ]] \
   && [[ "$after_sha" == "$before_sha" ]]; then
  ok "manifest --base: stale multi-node manifest refuses (exit 3), manifest missing this node's entry is a usage error (exit 2), main unchanged"
else
  no "manifest --base (rc1=$rc1 rc2=$rc2 before_sha=$before_sha after_sha=$after_sha)"
  printf 'out1: %s\n' "$out1"; printf 'out2: %s\n' "$out2"
fi

# ---------------------------------------------------------------------------
# Case 15: flag-parsing regressions on the new leading-flags-only parse loop.
# ---------------------------------------------------------------------------
# --base with no following value, an unrecognized leading flag, and a
# non-40-hex --base value must all exit 2 before any network call — none of
# these mutate origin/main, so they share one clone. A separate, bare
# positional invocation (no --base at all) with <reason>/<recommendation>
# arguments that start with `-` and contain embedded spaces must still park
# successfully (exit 0), proving the "first non-flag argument ends flag
# parsing, everything after is verbatim positional" rule isn't fooled by
# dash-prefixed free text. That last sub-case actually lands a park, so it
# gets its own dedicated fresh clone.
J="$WORK/j"
make_clone "$J" writer-j

out_missing="$(run_pn "$J" --base 2>&1)"; rc_missing=$?
out_unknown="$(run_pn "$J" --nope t-pinned 'reason' 2>&1)"; rc_unknown=$?
out_badsha="$(run_pn "$J" --base not-a-real-sha t-pinned 'reason' 2>&1)"; rc_badsha=$?

K="$WORK/k"
make_clone "$K" writer-k
out_dash="$(run_pn "$K" t-stale '-weird reason with spaces' '--not-a-flag recommendation' 2>&1)"; rc_dash=$?
content_dash="$(origin_show t-stale)"

if [[ $rc_missing -eq 2 ]] && [[ $rc_unknown -eq 2 ]] && [[ $rc_badsha -eq 2 ]] \
   && [[ $rc_dash -eq 0 ]] && grep -q 'office_hours' <<<"$content_dash"; then
  ok "flag-parsing regressions: missing --base value / unknown flag / non-hex --base all exit 2; dash-prefixed free-text positionals still park (exit 0)"
else
  no "flag-parsing regressions (rc_missing=$rc_missing rc_unknown=$rc_unknown rc_badsha=$rc_badsha rc_dash=$rc_dash)"
  printf 'missing: %s\n' "$out_missing"
  printf 'unknown: %s\n' "$out_unknown"
  printf 'badsha: %s\n' "$out_badsha"
  printf 'dash: %s\n' "$out_dash"
fi

# ---------------------------------------------------------------------------
# Case 16: clear-park happy path.
# ---------------------------------------------------------------------------
M_CLEAR="$WORK/m-clear"
make_clone "$M_CLEAR" writer-m-clear
run_pn "$M_CLEAR" t-clear-happy 'unit-test clear-park setup' >/dev/null 2>&1
sync_clone "$M_CLEAR"
out="$(run_cp "$M_CLEAR" t-clear-happy 'drain disposition' 2>&1)"; rc=$?
content="$(origin_show t-clear-happy)"
porcelain="$(git -C "$M_CLEAR" status --porcelain -- intentions/)"
if [[ $rc -eq 0 ]] \
   && grep -q 'office_hours: null' <<<"$content" \
   && [[ -z "$porcelain" ]]; then
  ok "clear-park happy path: office_hours cleared on origin/main, no working-tree residue"
else
  no "clear-park happy path (rc=$rc)"
  printf '%s\n' "$out"; printf '%s\n' "$content"; printf 'porcelain: %s\n' "$porcelain"
fi

# ---------------------------------------------------------------------------
# Case 17: clear-park idempotent no-op restores the tree.
# ---------------------------------------------------------------------------
# Re-running on the node case 16 just cleared: the helper's not-parked exit 3
# is translated into a deliberate exit-0 no-op. Because clear-park's
# origin/main refresh ALREADY overwrote the local file before that discovery,
# the no-op path must restore it explicitly — assert `git diff` is empty, not
# merely that the command exited 0.
before_sha="$(origin_sha)"
out="$(run_cp "$M_CLEAR" t-clear-happy 'second call' 2>&1)"; rc=$?
diff_after="$(git -C "$M_CLEAR" diff -- intentions/t-clear-happy.md)"
if [[ $rc -eq 0 ]] \
   && grep -q 'nothing to do' <<<"$out" \
   && [[ "$(origin_sha)" == "$before_sha" ]] \
   && [[ -z "$diff_after" ]]; then
  ok "clear-park idempotent no-op: exit 0 with 'nothing to do', main unchanged, refresh overwrite restored (git diff empty)"
else
  no "clear-park idempotent no-op (rc=$rc)"
  printf '%s\n' "$out"; printf 'diff: %s\n' "$diff_after"
fi

# ---------------------------------------------------------------------------
# Case 18: clear-park byte-identical rollback when graph-commit fails.
# ---------------------------------------------------------------------------
# Same shape as case 4: park the node first through a clone with the REAL
# graph-commit, then run clear-park in a SECOND clone whose graph-commit is a
# wrapper that unconditionally fails after the office_hours clear already
# landed on disk. The trap must restore intentions/t-clear-rollback.md exactly.
N_SETUP="$WORK/n-setup"
make_clone "$N_SETUP" writer-n-setup
run_pn "$N_SETUP" t-clear-rollback 'unit-test clear-park rollback setup' >/dev/null 2>&1

N_CLEAR="$WORK/n-clear"
make_clone "$N_CLEAR" writer-n-clear
mv "$N_CLEAR/packages/intentionsutil/scripts/graph-commit" \
   "$N_CLEAR/packages/intentionsutil/scripts/graph-commit.real"
cat >"$N_CLEAR/packages/intentionsutil/scripts/graph-commit" <<'SH'
#!/usr/bin/env bash
echo "graph-commit wrapper: simulated post-mutation failure" >&2
exit 1
SH
chmod +x "$N_CLEAR/packages/intentionsutil/scripts/graph-commit"

out="$(run_cp "$N_CLEAR" t-clear-rollback 'simulated failure' 2>&1)"; rc=$?
diff_after="$(git -C "$N_CLEAR" diff -- intentions/t-clear-rollback.md)"
if [[ $rc -eq 1 ]] \
   && grep -q 'office_hours write was rolled back' <<<"$out" \
   && [[ -z "$diff_after" ]]; then
  ok "clear-park byte-identical restore: graph-commit failure rolls back the office_hours clear (git diff empty)"
else
  no "clear-park byte-identical restore (rc=$rc)"
  printf '%s\n' "$out"; printf 'diff: %s\n' "$diff_after"
fi

# ---------------------------------------------------------------------------
# Case 19: clear-park --base diagnosis-time pin (mirrors cases 12-13).
# ---------------------------------------------------------------------------
# (a) A pin matching origin/main's current blob is transparent — the clear
# lands exactly as an unpinned call would. (b) Reusing that now-stale pin on a
# second call refuses BEFORE any mutation: exit 3, `stale-diagnosis` on stderr,
# origin/main byte-unchanged, and no local diff for the trap to roll back.
P_PIN="$WORK/p-pin"
make_clone "$P_PIN" writer-p-pin
run_pn "$P_PIN" t-clear-pinned 'unit-test clear-park pin setup' >/dev/null 2>&1
sync_clone "$P_PIN"
clear_pin="$(git -C "$ORIGIN" rev-parse main:intentions/t-clear-pinned.md)"

out_match="$(run_cp "$P_PIN" --base "$clear_pin" t-clear-pinned 2>&1)"; rc_match=$?
content="$(origin_show t-clear-pinned)"

before_sha="$(origin_sha)"
out_stale="$(run_cp "$P_PIN" --base "$clear_pin" t-clear-pinned 2>&1)"; rc_stale=$?
diff_after="$(git -C "$P_PIN" diff -- intentions/t-clear-pinned.md)"

if [[ $rc_match -eq 0 ]] && grep -q 'office_hours: null' <<<"$content" \
   && [[ $rc_stale -eq 3 ]] && grep -q 'stale-diagnosis' <<<"$out_stale" \
   && [[ "$(origin_sha)" == "$before_sha" ]] \
   && [[ -z "$diff_after" ]]; then
  ok "clear-park --base: matching pin clears normally (exit 0); stale pin refuses before any mutation (exit 3, stale-diagnosis, main unchanged, no local diff)"
else
  no "clear-park --base pin (rc_match=$rc_match rc_stale=$rc_stale)"
  printf 'match: %s\n' "$out_match"; printf 'stale: %s\n' "$out_stale"
  printf 'diff: %s\n' "$diff_after"
fi

# ---------------------------------------------------------------------------
# Case 20: clear-park repo targeting — cwd is a DIFFERENT checkout.
# ---------------------------------------------------------------------------
# The regression guard this node exists for (mirrors test-graph-commit.sh's
# case 25 construction). clear-park derives REPO_ROOT from its own script
# location and performs every write there; graph-commit resolves its repo from
# `-C` if given, else from CWD. So invoking clone X's clear-park by absolute
# path from clone Y's cwd (and from a plain non-repo directory) must still land
# the clear in X and push it to origin/main, leaving Y's intentions/ untouched.
# Strip the `-C "$REPO_ROOT"` from clear-park's graph-commit call and this goes
# red: graph-commit inspects Y instead, where nothing is staged for the id, and
# either silently commits nothing or trips Unit 1's --expect guard.
X_CWD="$WORK/x-cwd"; make_clone "$X_CWD" writer-x-cwd
Y_CWD="$WORK/y-cwd"; make_clone "$Y_CWD" writer-y-cwd
NOREPO_CWD="$WORK/norepo-cwd"; mkdir -p "$NOREPO_CWD"

run_cp_from() { # <cwd> <script-owning-clone> [clear-park args...]
  local at="$1" owner="$2"; shift 2
  (
    cd "$at" || exit 99
    export PATH="$WORK/bin:$PATH"
    export GC_FIXTURE_DIR="$FIXTURE_DIR"
    export GRAPH_COMMIT_CHECK_POLL_SECONDS=0
    export GRAPH_COMMIT_CHECK_TIMEOUT_SECONDS=5
    export GRAPH_COMMIT_MAX_ATTEMPTS=5
    bash "$owner/packages/intentionsutil/scripts/clear-park" "$@"
  )
}

# (a) cwd = a different clone.
run_pn "$X_CWD" t-clear-cwd 'unit-test foreign-cwd setup' >/dev/null 2>&1
out_a="$(run_cp_from "$Y_CWD" "$X_CWD" t-clear-cwd 'from foreign clone' 2>&1)"; rc_a=$?
content_a="$(origin_show t-clear-cwd)"
porcelain_a="$(git -C "$Y_CWD" status --porcelain -- intentions/)"

# (b) cwd = a directory that is not a git repository at all.
# `office_hours: null` alone is NOT discriminating here: part (a) already
# cleared this same id, and the harness's clear shim APPENDS the sentinel
# rather than rewriting the file, so (a)'s leftover line satisfies the grep
# even if (b) landed nothing at all. Pin origin/main's sha immediately before
# the run and require it to MOVE, so this arm proves a commit actually landed.
run_pn "$X_CWD" t-clear-cwd 'unit-test non-repo-cwd setup' >/dev/null 2>&1
before_sha_b="$(origin_sha)"
out_b="$(run_cp_from "$NOREPO_CWD" "$X_CWD" t-clear-cwd 'from non-repo dir' 2>&1)"; rc_b=$?
content_b="$(origin_show t-clear-cwd)"
porcelain_b="$(git -C "$Y_CWD" status --porcelain -- intentions/)"
after_sha_b="$(origin_sha)"

if [[ $rc_a -eq 0 ]] && grep -q 'office_hours: null' <<<"$content_a" && [[ -z "$porcelain_a" ]] \
   && [[ $rc_b -eq 0 ]] && grep -q 'office_hours: null' <<<"$content_b" && [[ -z "$porcelain_b" ]] \
   && [[ "$after_sha_b" != "$before_sha_b" ]]; then
  ok "clear-park repo targeting: script in clone X invoked from clone Y's cwd and from a non-repo cwd still lands the clear on origin/main; Y's intentions/ never written"
else
  no "clear-park repo targeting (rc_a=$rc_a rc_b=$rc_b porcelain_a='$porcelain_a' porcelain_b='$porcelain_b' before_sha_b=$before_sha_b after_sha_b=$after_sha_b)"
  printf 'a: %s\n' "$out_a"; printf '%s\n' "$content_a"
  printf 'b: %s\n' "$out_b"; printf '%s\n' "$content_b"
fi

# ---------------------------------------------------------------------------
# Case 21: resolve-park repo targeting — same construction.
# ---------------------------------------------------------------------------
X_RP="$WORK/x-rp"; make_clone "$X_RP" writer-x-rp
Y_RP="$WORK/y-rp"; make_clone "$Y_RP" writer-y-rp
run_pn "$X_RP" --pr 3003 t-resolve-cwd 'unit-test resolve foreign-cwd setup' >/dev/null 2>&1
sync_clone "$X_RP"
GHLOG_CWD="$WORK/ghlog-resolve-cwd"
out="$(
  cd "$Y_RP" || exit 99
  export PATH="$WORK/bin:$PATH"
  export GC_FIXTURE_DIR="$FIXTURE_DIR"
  export GH_LOG="$GHLOG_CWD"
  export GRAPH_COMMIT_CHECK_POLL_SECONDS=0
  export GRAPH_COMMIT_CHECK_TIMEOUT_SECONDS=5
  export GRAPH_COMMIT_MAX_ATTEMPTS=5
  bash "$X_RP/packages/intentionsutil/scripts/resolve-park" t-resolve-cwd --ratify 2>&1
)"; rc=$?
content="$(origin_show t-resolve-cwd)"
porcelain="$(git -C "$Y_RP" status --porcelain -- intentions/)"
if [[ $rc -eq 0 ]] \
   && grep -q '^ready 3003$' "$GHLOG_CWD" \
   && grep -q 'office_hours: null' <<<"$content" \
   && [[ -z "$porcelain" ]]; then
  ok "resolve-park repo targeting: script in clone X invoked from clone Y's cwd still readies the PR and lands the clear on origin/main; Y's intentions/ never written"
else
  no "resolve-park repo targeting (rc=$rc porcelain='$porcelain')"
  printf '%s\n' "$out"; printf '%s\n' "$content"
fi

echo
echo "passed: $PASS  failed: $FAIL"
[[ $FAIL -eq 0 ]] || exit 1
exit 0
