#!/usr/bin/env bash
#
# test-transition-node.sh — functional harness for transition-node's
# fresh-origin/main compare-and-swap guard (tactic-graph-write-recipes-base-cas
# Unit 3, the regression test for Unit 2's fix).
#
# Structural sibling of test-park-node.sh: a throwaway bare origin plus writer
# clones, `gh`/`npx` PATH shims standing in for the GitHub API and the tsx
# writers graph-commit invokes, plus GRAPH_COMMIT_* env overrides shrinking the
# poll windows. transition-node, lib.sh, and graph-commit under test are copied
# into the scratch repo at their real repo-relative paths so their
# REPO_ROOT/SCRIPT_DIR/GRAPH_COMMIT resolution points at the scratch clone.
#
# The guard being tested (transition-node, landed by Unit 2): before any read,
# transition-node fetches origin/main, overwrites the LOCAL node file with
# origin/main's content, resolves FRESH_BLOB (the origin/main blob sha), and
# passes graph-commit a `--base <id>=<FRESH_BLOB>` compare-and-swap token at the
# final land. Without it, a phase-transition write from a far-behind PR-branch
# worktree read/mutated/wrote the STALE local copy, whose whole-file diff then
# applied onto a since-advanced origin/main — silently reverting sibling
# frontmatter fields (e.g. a `blocked_by` another writer landed) that the stale
# local copy never had.
#
# Why a `node` shim (approach differs from real execution): the CI `hook-tests`
# job (where this is wired, next to test-park-node.sh) runs with NO setup-node
# and NO `npm ci` — there is no node_modules, no tsx, no yaml. Real execution of
# transition-node's `node --import tsx/esm` call sites would pass locally (where
# node_modules exists) and FAIL in CI. So — matching test-park-node.sh's "no real
# gh/node needed; requires only bash + git + jq" philosophy — we PATH-shim `node`
# too, emulating transition-node's exactly-four `node --import tsx/esm` call sites
# (read_node_json, refresh_stamp's fingerprint, apply-node-transition.ts,
# compute-freshness.ts) directly against the node's markdown file. This shims
# only the PURE TS decision/store layer (which carries its own vitest unit tests
# — transitions.test, the store round-trip); the REGRESSION this file guards is
# transition-node's BASH-level refresh + `--base` guard and its integration with
# the REAL graph-commit's compare-and-swap, both exercised for real here.
#
# Covers:
#   1. A stale far-ahead PR-branch worktree transition does NOT revert a
#      concurrently-landed sibling `blocked_by` field: the field another writer
#      landed on origin/main survives, and the phase advances (implement -> qa).
#      The pre-fix code would have reverted blocked_by to its absent seed state.
#   2. A concurrent origin/main advance landing between FRESH_BLOB resolution and
#      graph-commit's --base freshness check is REFUSED (not clobbered): reusing
#      test-park-node.sh's wrapper trick, graph-commit is swapped for a wrapper
#      that lands a concurrent change once then delegates to the real
#      graph-commit (graph-commit.real), whose check_base_freshness then sees
#      origin moved past FRESH_BLOB. Its layers-1-3 auto-merge fails on the raw
#      collision (the npx merge shim always fails) and falls through to the
#      documented auto-park fallback: office_hours is set (reason containing
#      "mechanical-unresolved") and pushed to origin/main; transition-node itself
#      exits non-zero (its OWN phase write did not land).
#   3. A node absent from origin/main is refused before any write (exit 1).
#   4. A FORWARD (not strategy-stale) transition seeds the per-strategy stamp:
#      transition-node passes apply-node-transition one
#      `--strategy-fingerprint <sid>=<hash>` per entry of compute-freshness's
#      `strategyFingerprints` map, plus a single `--strategy-sha` carrying the
#      origin/main COMMIT sha (never the node file's blob sha — the fixture
#      asserts against both so a substitution is caught).
#   5. A HELD (strategy-stale) transition passes NEITHER flag: re-stamping a node
#      the freeze just caught would self-clear the freeze before the
#      /align-tactics re-evaluation it exists to trigger ever ran.
#
# No network and no real gh/node needed; requires only bash + git + jq.

set -uo pipefail

HARNESS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT_REAL="$(cd "$HARNESS_DIR/../../.." && pwd)"
TN_SCRIPT="$REPO_ROOT_REAL/.claude/skills/dispatch-propagate/scripts/transition-node"
LIB_SCRIPT="$REPO_ROOT_REAL/.claude/skills/dispatch-propagate/scripts/lib.sh"
GC_SCRIPT="$HARNESS_DIR/graph-commit"
[[ -f "$TN_SCRIPT" ]] || { echo "error: transition-node not found at $TN_SCRIPT" >&2; exit 1; }
[[ -f "$LIB_SCRIPT" ]] || { echo "error: lib.sh not found at $LIB_SCRIPT" >&2; exit 1; }
[[ -f "$GC_SCRIPT" ]] || { echo "error: graph-commit not found at $GC_SCRIPT" >&2; exit 1; }
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

TN_DIR_REL=".claude/skills/dispatch-propagate/scripts"
UTIL_DIR_REL="packages/intentionsutil/scripts"
mkdir -p "$SEED/intentions" \
         "$SEED/$UTIL_DIR_REL" \
         "$SEED/packages/intentionsutil/src" \
         "$SEED/$TN_DIR_REL"

# transition-node under test, plus the lib.sh it sources and the real
# graph-commit it lands through.
cp "$TN_SCRIPT"  "$SEED/$TN_DIR_REL/transition-node"
cp "$LIB_SCRIPT" "$SEED/$TN_DIR_REL/lib.sh"
cp "$GC_SCRIPT"  "$SEED/$UTIL_DIR_REL/graph-commit"
chmod +x "$SEED/$TN_DIR_REL/transition-node" "$SEED/$UTIL_DIR_REL/graph-commit"

# transition-node names these paths when invoking `node --import tsx/esm`; the
# node shim matches on the path glob and never reads the files, but create empty
# placeholders so nothing trips on a missing path. Likewise the STORE_MODULE path
# graph-commit resolves (never loaded — the npx shim stands in for its tsx use).
: >"$SEED/$UTIL_DIR_REL/compute-freshness.ts"
: >"$SEED/$UTIL_DIR_REL/apply-node-transition.ts"
: >"$SEED/packages/intentionsutil/src/store.js"

# Stubs for the two scripts transition-node references only on branches this test
# never reaches (demote on scope-stale; dispatch-auto-merge on arm-merge). Present
# so an accidental reach fails loudly rather than on a missing-file error.
cat >"$SEED/$UTIL_DIR_REL/demote-node-to-implement" <<'SH'
#!/usr/bin/env bash
echo "demote-node-to-implement stub: unexpectedly invoked (scope-stale path not under test)" >&2
exit 1
SH
cat >"$SEED/$TN_DIR_REL/dispatch-auto-merge" <<'SH'
#!/usr/bin/env bash
exit 0
SH
chmod +x "$SEED/$UTIL_DIR_REL/demote-node-to-implement" "$SEED/$TN_DIR_REL/dispatch-auto-merge"

# Seed nodes: valid `kind: tactic` frontmatter (flat one-key-per-line so the node
# shim can read/rewrite `phase:` with sed while preserving every sibling field).
# t-blocker exists so a `blocked_by: [t-blocker]` edge resolves to a real tactic.
seed_node() { # <id> <statement>
  cat >"$SEED/intentions/$1.md" <<EOF
---
id: $1
kind: tactic
statement: $2
owner: ai
status: refining
phase: implement
---
# $2
EOF
}
seed_node t-stale "stale transition target"
seed_node t-blocker "sibling blocker landed concurrently"
seed_node t-concurrent "concurrent-advance transition target"
seed_node t-fpseed "forward transition seeding the strategy stamp"
seed_node t-fphold "strategy-stale transition that must not re-stamp"
git -C "$SEED" add -A
git -C "$SEED" commit -qm seed
git -C "$SEED" push -q origin main

# --- Independent writer clones ----------------------------------------------
make_clone() { # <dst> <identity>
  git clone -q "$ORIGIN" "$1"
  git -C "$1" config user.email "$2@test"
  git -C "$1" config user.name "$2"
}

# --- gh / npx / node PATH shims ---------------------------------------------
mkdir -p "$WORK/bin" "$WORK/fixtures"
# `app.slug` is required, not decorative: graph-commit's required-check gate
# only considers rows authored by the github-actions App, so a fixture row
# without it is dropped as a foreign producer and the context reads `absent`.
cat >"$WORK/fixtures/green.json" <<'JSON'
{"check_runs": [
  {"name": "acceptance", "status": "completed", "conclusion": "success", "id": 1, "app": {"slug": "github-actions"}},
  {"name": "preview-and-smoke", "status": "completed", "conclusion": "success", "id": 2, "app": {"slug": "github-actions"}},
  {"name": "lint", "status": "completed", "conclusion": "success", "id": 3, "app": {"slug": "github-actions"}},
  {"name": "unit-tests", "status": "completed", "conclusion": "success", "id": 4, "app": {"slug": "github-actions"}}
]}
JSON

# gh shim: run graph-commit's REAL --jq program against the green fixture (checks
# report passing so graph-commit lands cleanly in the non-conflict cases).
cat >"$WORK/bin/gh" <<'SH'
#!/usr/bin/env bash
jq_program=""
while [[ $# -gt 0 ]]; do
  if [[ "$1" == "--jq" ]]; then jq_program="$2"; break; fi
  shift
done
jq -r "$jq_program" "$GC_FIXTURE_DIR/green.json"
SH

# npx shim: emulates without node the `npx tsx ...` invocations graph-commit
# makes — the layers-1-3 mechanical 3-way merge (merge-node.ts) and the
# conflict-park writer (park_write). Verbatim in spirit from test-park-node.sh:
#   (c) merge-node.ts (flag argv --base/--ours/--theirs/--out): no real merge
#       tool in this no-node harness, so this always fails, which is exactly what
#       makes graph-commit's layers 1-3 fall through to the conflict-park path —
#       the refusal behavior case 2 verifies.
#   (b) park_write (dir since reason snapDir pruneCsv id...): appends an
#       office_hours line carrying graph-commit's park reason to each node.
cat >"$WORK/bin/npx" <<'SH'
#!/usr/bin/env bash
[[ "$1" == "tsx" ]] || { echo "npx shim: unexpected invocation: $*" >&2; exit 1; }
if [[ "$2" == *merge-node.ts ]]; then
  echo "npx shim: no real 3-way merge tool available (test harness stub)" >&2
  exit 1
fi
shift 3   # tsx, helper script path, store module path
dir="$1"; since="$2"; reason="$3"
if [[ $# -eq 5 ]]; then
  ids=("$5")
else
  shift 5   # dir, since, reason, snapDir, pruneCsv
  ids=("$@")
fi
for id in "${ids[@]}"; do
  [[ -f "$dir/$id.md" ]] || { echo "npx shim: unreadable node $id" >&2; exit 1; }
  printf 'office_hours: {reason: "%s", since: %s}\n' "$reason" "$since" >>"$dir/$id.md"
  echo "npx shim: set office_hours on $id (since=$since)" >&2
done
SH

# node shim: stands in for transition-node's exactly-four `node --import tsx/esm`
# call sites, operating directly on the node's markdown frontmatter. Invocation
# is always `node --import tsx/esm <-e CODE ID | SCRIPT.ts ID [flags]>`; we strip
# the leading `--import tsx/esm` and dispatch on what follows.
cat >"$WORK/bin/node" <<'SH'
#!/usr/bin/env bash
# Drop the `--import tsx/esm` prefix transition-node always passes.
[[ "${1:-}" == "--import" ]] && shift 2

# node file phase reader/writer on the CURRENT node file (cwd is REPO_ROOT for
# every transition-node call site, so intentions/<id>.md resolves).
node_file() { printf 'intentions/%s.md' "$1"; }
read_phase() {
  local p
  p="$(sed -n 's/^phase: *//p' "$(node_file "$1")" 2>/dev/null | head -1)"
  [[ -n "$p" ]] && printf '%s' "$p" || printf 'implement'
}
has_residue() { # body carries an H2 heading beginning "needs-main"
  grep -qiE '^##[[:space:]]+needs-main([[:space:]]|$)' "$(node_file "$1")" 2>/dev/null
}

case "${1:-}" in
  -e)
    code="$2"; id="$3"
    if [[ "$code" == *tacticScopeFingerprint* ]]; then
      # refresh_stamp fingerprint: any deterministic non-empty string. Best-effort
      # on transition-node's side; not asserted.
      printf 'fp-%s' "$(git rev-parse HEAD 2>/dev/null || echo none)"
    else
      # read_node_json: transition-node reads .phase and .execution.pr only.
      printf '{"phase":"%s","execution":{"pr":null}}' "$(read_phase "$id")"
    fi
    ;;
  *compute-freshness.ts)
    # Emulate the freshness gate. For a plain forward-transition test we keep
    # scope/strategy NOT stale so the normal ladder path runs; stampMissing is
    # reported honestly from the --stamp file's existence (fail-open when absent).
    id="$2"; stamp=""
    shift 2
    while [[ $# -gt 0 ]]; do
      case "$1" in
        --stamp) stamp="$2"; shift 2 ;;
        --snapshot) shift 2 ;;
        *) shift ;;
      esac
    done
    if [[ -n "$stamp" && -f "$stamp" ]]; then missing=false; else missing=true; fi
    # strategyStale and the strategyFingerprints map are test-controlled: the
    # default ("false" / "{}") reproduces the pre-stamp-write behavior every
    # older case here relies on, while the stamp-write cases set TN_STRATEGY_STALE
    # / TN_FPS_JSON to drive the two branches of transition-node's stamp decision.
    printf '{"scopeStale":false,"strategyStale":%s,"stampMissing":%s,"nodeOnMain":true,"strategyFingerprints":%s}' \
      "${TN_STRATEGY_STALE:-false}" "$missing" "${TN_FPS_JSON:-\{\}}"
    ;;
  *apply-node-transition.ts)
    # Emulate applyNodeTransition + decideTransition (the pure transitions layer):
    # forward the phase one ladder edge (CI-blind), rewrite the phase line in the
    # node file (preserving every sibling field — the blocked_by survival case),
    # and print the decision JSON. --strategy-stale holds; review arms merge.
    shift   # drop the script path
    # Record the received argv (one arg per line) so a case can assert exactly
    # which flags transition-node passed — the stamp-write contract under test.
    [[ -n "${TN_ARGV_LOG:-}" ]] && printf '%s\n' "$@" >"$TN_ARGV_LOG"
    id=""; strategy_stale=false
    while [[ $# -gt 0 ]]; do
      case "$1" in
        --strategy-stale) strategy_stale=true; shift ;;
        --scope-stale) shift ;;
        --set-pr) shift 2 ;;
        --strategy-fingerprint) shift 2 ;;
        --strategy-sha) shift 2 ;;
        --*) shift ;;
        *) [[ -z "$id" ]] && id="$1"; shift ;;
      esac
    done
    prev="$(read_phase "$id")"
    residue=false; has_residue "$id" && residue=true
    arm=false; hold=false; new="$prev"
    if [[ "$strategy_stale" == true ]]; then
      hold=true; new="$prev"
    elif [[ "$prev" == review ]]; then
      arm=true; new="review"
    else
      case "$prev" in
        implement) new="qa" ;;
        qa)        new="review" ;;
        main-qa)   new="done" ;;
        done)      hold=true; new="done" ;;
        *)         hold=true; new="$prev" ;;
      esac
    fi
    # applyNodeTransition writes node.phase whenever the decision neither holds nor
    # demotes (review's arm-merge rewrites phase to the same value — a no-op).
    if [[ "$hold" != true ]]; then
      sed -i "s/^phase: .*/phase: $new/" "$(node_file "$id")"
    fi
    printf '{"phase":"%s","prevPhase":"%s","armMerge":%s,"hold":%s,"demote":false,"hasResidue":%s,"wrote":true}' \
      "$new" "$prev" "$arm" "$hold" "$residue"
    ;;
  *)
    echo "node shim: unexpected invocation: $*" >&2
    exit 1
    ;;
esac
SH
chmod +x "$WORK/bin/gh" "$WORK/bin/npx" "$WORK/bin/node"

FIXTURE_DIR="$WORK/fixtures"
origin_show() { git -C "$ORIGIN" show "main:intentions/$1.md"; }
origin_sha() { git -C "$ORIGIN" rev-parse main; }
sync_clone() { git -C "$1" fetch -q origin main && git -C "$1" reset -q --hard FETCH_HEAD; }
add_blocked_by() { # <clone> <id> <blocker> — insert a blocked_by list into the frontmatter
  local f="$1/intentions/$2.md"
  awk -v b="$3" '{ print } /^phase: /{ print "blocked_by:"; print "  - " b }' "$f" >"$f.tmp"
  mv "$f.tmp" "$f"
}

run_tn() { # <clone> [transition-node args...]
  local clone="$1"; shift
  (
    cd "$clone" || exit 99
    export PATH="$WORK/bin:$PATH"
    export GC_FIXTURE_DIR="$FIXTURE_DIR"
    export GRAPH_COMMIT_CHECK_POLL_SECONDS=0
    export GRAPH_COMMIT_CHECK_TIMEOUT_SECONDS=5
    export GRAPH_COMMIT_MAX_ATTEMPTS=5
    bash .claude/skills/dispatch-propagate/scripts/transition-node "$@"
  )
}

# ---------------------------------------------------------------------------
# Case 1: stale far-ahead worktree transition does NOT revert a concurrently-
# landed sibling blocked_by field.
# ---------------------------------------------------------------------------
# writer-a lands a `blocked_by: [t-blocker]` edge on t-stale on origin. writer-b
# is a far-ahead PR-branch worktree that NEVER synced: its local t-stale.md is
# still the seed (no blocked_by) and its HEAD carries a non-intentions code
# commit (so graph-commit's ensure_intentions_only_base reset+re-materialize path
# — the real revert vector — fires). Transitioning t-stale from writer-b must
# keep the landed blocked_by and advance implement -> qa; the pre-fix code would
# have reverted blocked_by to absent.
A="$WORK/a"; B="$WORK/b"
make_clone "$A" writer-a
make_clone "$B" writer-b

sync_clone "$A"
add_blocked_by "$A" t-stale t-blocker
(
  cd "$A" || exit 99
  export PATH="$WORK/bin:$PATH" GC_FIXTURE_DIR="$FIXTURE_DIR"
  export GRAPH_COMMIT_CHECK_POLL_SECONDS=0 GRAPH_COMMIT_CHECK_TIMEOUT_SECONDS=5
  bash packages/intentionsutil/scripts/graph-commit -m 'test: land blocked_by edge' t-stale
) >/dev/null 2>&1

# writer-b: far-ahead PR branch, stale on the intentions file.
mkdir -p "$B/src"
echo "console.log('pr feature code')" >"$B/src/feature.js"
git -C "$B" add src/feature.js
git -C "$B" commit -qm 'pr: non-intentions code change (simulated PR branch)'
far_tip="$(git -C "$B" rev-parse HEAD)"

out="$(run_tn "$B" t-stale 2>&1)"; rc=$?
content="$(origin_show t-stale)"
restored="$(git -C "$B" rev-parse HEAD)"
if [[ $rc -eq 0 ]] \
   && grep -q '^phase: qa' <<<"$content" \
   && grep -q 'blocked_by' <<<"$content" \
   && grep -q 't-blocker' <<<"$content" \
   && grep -q 'implement -> qa' <<<"$out" \
   && [[ "$restored" == "$far_tip" ]]; then
  ok "stale far-ahead transition: landed blocked_by survives, phase advances implement->qa, HEAD restored"
else
  no "stale far-ahead transition (rc=$rc restored=$restored far_tip=$far_tip)"
  printf '%s\n' "$out"; printf '%s\n' "$content"
fi

# ---------------------------------------------------------------------------
# Case 2: a concurrent origin/main advance between FRESH_BLOB resolution and the
# --base freshness check triggers graph-commit's auto-park fallback, not a
# clobber.
# ---------------------------------------------------------------------------
# transition-node's fetch and graph-commit's check_base_freshness fetch happen
# back-to-back in one synchronous process, so there is no natural injection point
# to land a concurrent change between them. Rather than race, swap the graph-commit
# transition-node invokes for a thin wrapper that (once) lands a concurrent change
# on origin/main for the node, then delegates to the real graph-commit
# (graph-commit.real). The real graph-commit's check_base_freshness re-fetches,
# sees origin's blob no longer matches FRESH_BLOB, and its layers-1-3 auto-merge
# fails (the npx merge shim always fails) — so it falls through to park_and_exit():
# office_hours is set (reason containing "mechanical-unresolved") and pushed to
# origin/main. transition-node exits non-zero (its OWN phase write did not land).
C="$WORK/c"
make_clone "$C" writer-c
mv "$C/$UTIL_DIR_REL/graph-commit" "$C/$UTIL_DIR_REL/graph-commit.real"
cat >"$C/$UTIL_DIR_REL/graph-commit" <<'SH'
#!/usr/bin/env bash
set -euo pipefail
SD="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [[ ! -f "$SD/.concurrent-landed" ]]; then
  # Land a concurrent change to the SAME node on origin/main, simulating another
  # writer committing after transition-node resolved FRESH_BLOB but before this
  # check.
  D="$(mktemp -d)"
  git clone -q "$GC_ORIGIN" "$D"
  git -C "$D" config user.email other@test
  git -C "$D" config user.name other
  printf 'concurrent-line: landed elsewhere\n' >>"$D/intentions/$GC_NODE.md"
  git -C "$D" commit -qam 'concurrent edit (bypassing transition-node)'
  git -C "$D" push -q origin main
  rm -rf "$D"
  : >"$SD/.concurrent-landed"
fi
exec "$SD/graph-commit.real" "$@"
SH
chmod +x "$C/$UTIL_DIR_REL/graph-commit"
# Commit the wrapper swap so graph-commit.real's assert_clean_outside_ids pre-flight
# guard (refuses to start on any unrelated dirty TRACKED file) doesn't trip on the
# tracked graph-commit path this swap modifies. graph-commit.real is untracked and
# already exempt (the guard skips '??' entries).
git -C "$C" add "$UTIL_DIR_REL/graph-commit"
git -C "$C" commit -qm 'test: install graph-commit wrapper for concurrent-write simulation'

before_sha="$(origin_sha)"
out="$(
  cd "$C" || exit 99
  export PATH="$WORK/bin:$PATH" GC_FIXTURE_DIR="$FIXTURE_DIR"
  export GRAPH_COMMIT_CHECK_POLL_SECONDS=0 GRAPH_COMMIT_CHECK_TIMEOUT_SECONDS=5
  export GC_ORIGIN="$ORIGIN" GC_NODE=t-concurrent
  bash .claude/skills/dispatch-propagate/scripts/transition-node t-concurrent 2>&1
)"; rc=$?
content="$(origin_show t-concurrent)"
if [[ $rc -ne 0 ]] \
   && grep -q 'concurrent-line: landed elsewhere' <<<"$content" \
   && grep -q 'office_hours' <<<"$content" \
   && grep -q 'mechanical-unresolved' <<<"$content"; then
  ok "concurrent origin/main advance triggers auto-park: transition-node exits non-zero, concurrent content survives, node auto-parked via office_hours"
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
out="$(run_tn "$E" nonexistent-node 2>&1)"; rc=$?
if [[ $rc -eq 1 ]] \
   && grep -q 'does not exist on origin/main' <<<"$out" \
   && [[ "$(origin_sha)" == "$before_sha" ]]; then
  ok "absent node: transition-node refuses a node not on origin/main (exit 1), main unchanged"
else
  no "absent node refusal (rc=$rc)"; printf '%s\n' "$out"
fi

# ---------------------------------------------------------------------------
# Case 4: a forward (not strategy-stale) transition seeds the per-strategy stamp.
# ---------------------------------------------------------------------------
# The shimmed compute-freshness reports strategyStale:false plus a two-entry
# strategyFingerprints map. transition-node must forward one
# `--strategy-fingerprint <sid>=<hash>` per entry to apply-node-transition, plus
# ONE `--strategy-sha` carrying the origin/main COMMIT sha. The commit sha and
# the node file's BLOB sha (FRESH_BLOB, used for the --base CAS token) are two
# different 40-hex objects in this scratch repo, so asserting on the commit sha
# AND against the blob sha catches a substitution of one for the other.
FP_A="strategy-alpha=$(printf 'a%.0s' {1..64})"
FP_B="strategy-beta=$(printf 'b%.0s' {1..64})"
F="$WORK/f"
make_clone "$F" writer-f
sync_clone "$F"
ARGV_SEED="$WORK/argv-seed.txt"
: >"$ARGV_SEED"
expected_main_sha="$(origin_sha)"
node_blob="$(git -C "$ORIGIN" rev-parse "main:intentions/t-fpseed.md")"
export TN_ARGV_LOG="$ARGV_SEED"
export TN_STRATEGY_STALE=false
export TN_FPS_JSON="{\"strategy-alpha\":\"${FP_A#*=}\",\"strategy-beta\":\"${FP_B#*=}\"}"
out="$(run_tn "$F" t-fpseed 2>&1)"; rc=$?
unset TN_ARGV_LOG TN_STRATEGY_STALE TN_FPS_JSON
argv="$(cat "$ARGV_SEED" 2>/dev/null)"
if [[ $rc -eq 0 ]] \
   && grep -q 'implement -> qa' <<<"$out" \
   && [[ "$(grep -cFx -- '--strategy-fingerprint' <<<"$argv")" == 2 ]] \
   && grep -qFx -- "$FP_A" <<<"$argv" \
   && grep -qFx -- "$FP_B" <<<"$argv" \
   && [[ "$(grep -cFx -- '--strategy-sha' <<<"$argv")" == 1 ]] \
   && grep -qFx -- "$expected_main_sha" <<<"$argv" \
   && ! grep -qFx -- "$node_blob" <<<"$argv" \
   && [[ "$expected_main_sha" != "$node_blob" ]]; then
  ok "forward transition seeds the stamp: one --strategy-fingerprint per serving strategy plus the origin/main COMMIT sha (not the node blob sha)"
else
  no "forward stamp seeding (rc=$rc main_sha=$expected_main_sha blob=$node_blob)"
  printf '%s\n' "$out"; printf 'argv:\n%s\n' "$argv"
fi

# ---------------------------------------------------------------------------
# Case 5: a strategy-stale transition HOLDS and must NOT re-stamp.
# ---------------------------------------------------------------------------
# Re-stamping on the held path would write the fresh hash the freeze was
# triggered by, so the very next tick would read the node as non-stale — silently
# self-clearing the soft freeze without the /align-tactics re-evaluation. So the
# hold must reach apply-node-transition with --strategy-stale and with NEITHER
# --strategy-fingerprint nor --strategy-sha, even though compute-freshness
# reported a non-empty map.
G="$WORK/g"
make_clone "$G" writer-g
sync_clone "$G"
ARGV_HOLD="$WORK/argv-hold.txt"
: >"$ARGV_HOLD"
export TN_ARGV_LOG="$ARGV_HOLD"
export TN_STRATEGY_STALE=true
export TN_FPS_JSON="{\"strategy-alpha\":\"${FP_A#*=}\",\"strategy-beta\":\"${FP_B#*=}\"}"
out="$(run_tn "$G" t-fphold 2>&1)"; rc=$?
unset TN_ARGV_LOG TN_STRATEGY_STALE TN_FPS_JSON
argv="$(cat "$ARGV_HOLD" 2>/dev/null)"
content="$(origin_show t-fphold)"
if [[ $rc -eq 0 ]] \
   && grep -q 'strategy-fingerprint freeze' <<<"$out" \
   && grep -qFx -- '--strategy-stale' <<<"$argv" \
   && ! grep -qFx -- '--strategy-fingerprint' <<<"$argv" \
   && ! grep -qFx -- '--strategy-sha' <<<"$argv" \
   && grep -q '^phase: implement' <<<"$content"; then
  ok "strategy-stale transition holds and passes NO stamp flags (the freeze is not self-cleared)"
else
  no "strategy-stale no-restamp (rc=$rc)"
  printf '%s\n' "$out"; printf 'argv:\n%s\n' "$argv"; printf '%s\n' "$content"
fi

echo
echo "passed: $PASS  failed: $FAIL"
[[ $FAIL -eq 0 ]] || exit 1
exit 0
