#!/usr/bin/env bash
#
# test-demote-node-to-implement.sh — functional harness for
# demote-node-to-implement's fresh-origin/main compare-and-swap guard
# (tactic-graph-commit-rebuild-snapshot-stale-revert, the sibling fix to
# transition-node's and park-node's own CAS guards).
#
# Structural sibling of test-transition-node.sh: a throwaway bare origin plus
# writer clones, `gh`/`npx`/`node` PATH shims standing in for the GitHub API
# and the tsx writers graph-commit/demote-node-to-implement invoke, plus
# GRAPH_COMMIT_* env overrides shrinking the poll windows. demote-node-to-implement
# and the real graph-commit under test are copied into the scratch repo at their
# real repo-relative paths so their REPO_ROOT/SCRIPT_DIR/GRAPH_COMMIT resolution
# points at the scratch clone.
#
# The guard being tested: before any read, demote-node-to-implement fetches
# origin/main, resolves FRESH_BLOB (the origin/main blob sha), refreshes the
# LOCAL node file from that same blob, and passes graph-commit a
# `--base <id>=<FRESH_BLOB>` compare-and-swap token at the final land. Without
# it, a demotion write from a far-behind PR-branch worktree read/mutated/wrote
# the STALE local copy, whose whole-file diff then applied onto a
# since-advanced origin/main — silently reverting sibling frontmatter fields
# (e.g. a `blocked_by` another writer landed) that the stale local copy never
# had.
#
# Why a `node` shim (approach differs from real execution): the CI `hook-tests`
# job (where this is wired, next to test-transition-node.sh) runs with NO
# setup-node and NO `npm ci` — there is no node_modules, no tsx, no yaml. Real
# execution of demote-node-to-implement's `node --import tsx/esm` call sites
# would pass locally (where node_modules exists) and FAIL in CI. So — matching
# test-transition-node.sh's philosophy — we PATH-shim `node` too, emulating
# demote-node-to-implement's two `node --import tsx/esm` call sites
# (apply-node-transition.ts's --scope-stale write, and the PR-number re-read
# `-e` call) directly against the node's markdown file.
#
# Covers:
#   1. A stale far-ahead PR-branch worktree demotion does NOT revert a
#      concurrently-landed sibling `blocked_by` field: the field another
#      writer landed on origin/main survives, and phase becomes `implement`.
#      The pre-fix code would have reverted blocked_by to its absent seed
#      state.
#   2. A node absent from origin/main is refused before any write (exit 1).
#
# No network and no real gh/node needed; requires only bash + git + jq.

set -uo pipefail

HARNESS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT_REAL="$(cd "$HARNESS_DIR/../../.." && pwd)"
DN_SCRIPT="$REPO_ROOT_REAL/packages/intentionsutil/scripts/demote-node-to-implement"
GC_SCRIPT="$HARNESS_DIR/graph-commit"
[[ -f "$DN_SCRIPT" ]] || { echo "error: demote-node-to-implement not found at $DN_SCRIPT" >&2; exit 1; }
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

UTIL_DIR_REL="packages/intentionsutil/scripts"
mkdir -p "$SEED/intentions" \
         "$SEED/$UTIL_DIR_REL" \
         "$SEED/packages/intentionsutil/src"

# demote-node-to-implement under test, plus the real graph-commit it lands
# through.
cp "$DN_SCRIPT" "$SEED/$UTIL_DIR_REL/demote-node-to-implement"
cp "$GC_SCRIPT"  "$SEED/$UTIL_DIR_REL/graph-commit"
chmod +x "$SEED/$UTIL_DIR_REL/demote-node-to-implement" "$SEED/$UTIL_DIR_REL/graph-commit"

# demote-node-to-implement names these paths when invoking `node --import
# tsx/esm`; the node shim matches on the path glob and never reads the files,
# but create empty placeholders so nothing trips on a missing path. Likewise
# the STORE_MODULE path graph-commit resolves (never loaded — the npx shim
# stands in for its tsx use).
: >"$SEED/$UTIL_DIR_REL/apply-node-transition.ts"
: >"$SEED/packages/intentionsutil/src/store.js"

# Seed nodes: valid `kind: tactic` frontmatter (flat one-key-per-line so the
# node shim can read/rewrite `phase:` with sed while preserving every sibling
# field). t-blocker exists so a `blocked_by: [t-blocker]` edge resolves to a
# real tactic.
seed_node() { # <id> <statement>
  cat >"$SEED/intentions/$1.md" <<EOF
---
id: $1
kind: tactic
statement: $2
owner: ai
status: refining
phase: qa
---
# $2
EOF
}
seed_node t-stale "stale demotion target"
seed_node t-blocker "sibling blocker landed concurrently"
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
cat >"$WORK/fixtures/green.json" <<'JSON'
{"check_runs": [
  {"name": "acceptance", "status": "completed", "conclusion": "success"},
  {"name": "preview-and-smoke", "status": "completed", "conclusion": "success"},
  {"name": "lint", "status": "completed", "conclusion": "success"},
  {"name": "unit-tests", "status": "completed", "conclusion": "success"}
]}
JSON

# gh shim: run graph-commit's REAL --jq program against the green fixture (checks
# report passing so graph-commit lands cleanly in the non-conflict cases). The
# PR-comment path is never reached in these cases (PR is always empty, so
# demote-node-to-implement skips the gh pr comment call), but this stays
# present as a harmless no-op stand-in matching test-transition-node.sh.
cat >"$WORK/bin/gh" <<'SH'
#!/usr/bin/env bash
jq_program=""
while [[ $# -gt 0 ]]; do
  if [[ "$1" == "--jq" ]]; then jq_program="$2"; break; fi
  shift
done
if [[ -n "$jq_program" ]]; then
  jq -r "$jq_program" "$GC_FIXTURE_DIR/green.json"
fi
SH

# npx shim: emulates without node the `npx tsx ...` invocations graph-commit
# makes — the layers-1-3 mechanical 3-way merge (merge-node.ts) and the
# conflict-park writer (park_write). Verbatim from test-transition-node.sh:
#   (c) merge-node.ts (flag argv --base/--ours/--theirs/--out): no real merge
#       tool in this no-node harness, so this always fails, which is exactly what
#       makes graph-commit's layers 1-3 fall through to the conflict-park path.
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

# node shim: stands in for demote-node-to-implement's two `node --import
# tsx/esm` call sites — apply-node-transition.ts's --scope-stale write, and
# the `-e` PR-number re-read. Invocation is always `node --import tsx/esm
# <-e CODE ID | SCRIPT.ts ID [flags]>`; we strip the leading `--import
# tsx/esm` and dispatch on what follows.
cat >"$WORK/bin/node" <<'SH'
#!/usr/bin/env bash
# Drop the `--import tsx/esm` prefix demote-node-to-implement always passes.
[[ "${1:-}" == "--import" ]] && shift 2

node_file() { printf 'intentions/%s.md' "$1"; }

case "${1:-}" in
  *apply-node-transition.ts)
    # Emulate apply-node-transition's --scope-stale path: rewrite phase to
    # `implement` in place, preserving every sibling field (the blocked_by
    # survival case), and print the decision JSON.
    shift   # drop the script path
    id=""
    while [[ $# -gt 0 ]]; do
      case "$1" in
        --scope-stale) shift ;;
        --*) shift ;;
        *) [[ -z "$id" ]] && id="$1"; shift ;;
      esac
    done
    sed -i "s/^phase: .*/phase: implement/" "$(node_file "$id")"
    printf '{"phase":"implement","demote":true,"wrote":true}'
    ;;
  -e)
    # The PR-number re-read: demote-node-to-implement only reads
    # execution.pr, which no seeded node carries — print an empty string so
    # the `gh pr comment` block is skipped.
    printf ''
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

run_dn() { # <clone> [demote-node-to-implement args...]
  local clone="$1"; shift
  (
    cd "$clone" || exit 99
    export PATH="$WORK/bin:$PATH"
    export GC_FIXTURE_DIR="$FIXTURE_DIR"
    export GRAPH_COMMIT_CHECK_POLL_SECONDS=0
    export GRAPH_COMMIT_CHECK_TIMEOUT_SECONDS=5
    export GRAPH_COMMIT_MAX_ATTEMPTS=5
    bash packages/intentionsutil/scripts/demote-node-to-implement "$@"
  )
}

# ---------------------------------------------------------------------------
# Case 1: stale far-ahead worktree demotion does NOT revert a concurrently-
# landed sibling blocked_by field.
# ---------------------------------------------------------------------------
# writer-a lands a `blocked_by: [t-blocker]` edge on t-stale on origin. writer-b
# is a far-ahead PR-branch worktree that NEVER synced: its local t-stale.md is
# still the seed (no blocked_by) and its HEAD carries a non-intentions code
# commit (so graph-commit's ensure_intentions_only_base reset+re-materialize path
# — the real revert vector — fires). Demoting t-stale from writer-b must keep
# the landed blocked_by and set phase to implement; the pre-fix code would have
# reverted blocked_by to absent.
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

out="$(run_dn "$B" t-stale 2>&1)"; rc=$?
content="$(origin_show t-stale)"
restored="$(git -C "$B" rev-parse HEAD)"
if [[ $rc -eq 0 ]] \
   && grep -q '^phase: implement' <<<"$content" \
   && grep -q 'blocked_by' <<<"$content" \
   && grep -q 't-blocker' <<<"$content" \
   && [[ "$restored" == "$far_tip" ]]; then
  ok "stale far-ahead demotion: landed blocked_by survives, phase set to implement, HEAD restored"
else
  no "stale far-ahead demotion (rc=$rc restored=$restored far_tip=$far_tip)"
  printf '%s\n' "$out"; printf '%s\n' "$content"
fi

# ---------------------------------------------------------------------------
# Case 2: a node absent from origin/main is refused before any write.
# ---------------------------------------------------------------------------
E="$WORK/e"
make_clone "$E" writer-e
before_sha="$(origin_sha)"
out="$(run_dn "$E" nonexistent-node 2>&1)"; rc=$?
if [[ $rc -eq 1 ]] \
   && grep -q 'does not exist on origin/main' <<<"$out" \
   && [[ "$(origin_sha)" == "$before_sha" ]]; then
  ok "absent node: demote-node-to-implement refuses a node not on origin/main (exit 1), main unchanged"
else
  no "absent node refusal (rc=$rc)"; printf '%s\n' "$out"
fi

echo
echo "passed: $PASS  failed: $FAIL"
[[ $FAIL -eq 0 ]] || exit 1
exit 0
