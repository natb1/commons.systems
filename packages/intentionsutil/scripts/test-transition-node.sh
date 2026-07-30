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
#      origin moved past FRESH_BLOB. The concurrent write collides on the SAME
#      field transition-node writes (phase), so its layers-1-3 auto-merge
#      genuinely cannot resolve and falls through to the
#      documented auto-park fallback: office_hours is set (reason containing
#      "mechanical-unresolved") and pushed to origin/main; transition-node itself
#      exits non-zero (its OWN phase write did not land).
#   3. A node absent from origin/main is refused before any write (exit 1).
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
#   (c) merge-node.ts (flag argv --base/--ours/--theirs/--out): a REAL (if
#       simplified) three-way merge, ported from test-park-node.sh's shim and
#       adapted to this file's real-frontmatter fixtures. It does NOT
#       reimplement the production field merge (mergeIntentionNodes, covered by
#       packages/intentionsutil/test/node-merge.test.ts — the source of truth);
#       it only proves graph-commit invokes merge-node.ts at the right point and
#       branches correctly on its resolved/unresolved verdict. An always-fail
#       stub cannot do that: it misreports case 1's genuinely DISJOINT merge
#       (local `phase` change vs. a landed `blocked_by` addition) as a conflict,
#       which is exactly the far-ahead-rebuild reconciliation this suite guards.
#       Adaptation vs. test-park-node.sh's flat `key: value` fixtures: these
#       nodes carry real `---`-fenced frontmatter, a markdown body, and (via
#       add_blocked_by) a two-line YAML list —
#         blocked_by:
#           - t-blocker
#       — so the parser groups a top-level `key:` line with its following
#       INDENTED continuation lines into one raw multi-line block (reconstructed
#       byte-for-byte on output), treats the fences as structure rather than
#       keys, and three-way merges the body as a single unit.
#   (b) park_write (dir since reason snapDir pruneCsv id...): appends an
#       office_hours line carrying graph-commit's park reason to each node.
cat >"$WORK/bin/npx" <<'SH'
#!/usr/bin/env bash
[[ "$1" == "tsx" ]] || { echo "npx shim: unexpected invocation: $*" >&2; exit 1; }
if [[ "$2" == *merge-node.ts ]]; then
  shift 2
  m_base=""; m_ours=""; m_theirs=""; m_out=""
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --base) m_base="$2"; shift 2 ;;
      --ours) m_ours="$2"; shift 2 ;;
      --theirs) m_theirs="$2"; shift 2 ;;
      --out) m_out="$2"; shift 2 ;;
      *) shift ;;
    esac
  done

  # theirs genuinely absent (the id no longer exists on the landed side): ours is
  # the only content, so ours wins outright (mirrors merge-node.ts's real
  # documented behavior for an empty --theirs).
  if [[ -z "$m_theirs" ]]; then
    [[ -n "$m_out" && -n "$m_ours" ]] && cp -- "$m_ours" "$m_out"
    printf '{"resolved":true,"conflicts":[]}\n'
    exit 0
  fi

  # parse_node <file> — split one node markdown file into
  #   PK    ordered frontmatter keys
  #   PV    key -> RAW block (the `key:` line plus every following indented
  #         continuation line, joined by newlines; emitted verbatim on output)
  #   PBODY everything after the closing `---` fence, verbatim
  # `---` fences and blank frontmatter lines are structure, not keys.
  PK=(); declare -A PV=(); PBODY=""
  parse_node() {
    local f="$1" line cur="" curblock="" state=start
    local -a bodylines=()
    PK=(); PV=(); PBODY=""
    while IFS= read -r line || [[ -n "$line" ]]; do
      case "$state" in
        start)
          if [[ "$line" == "---" ]]; then state=fm; else state=body; bodylines+=("$line"); fi
          ;;
        fm)
          if [[ "$line" == "---" ]]; then
            if [[ -n "$cur" ]]; then PV["$cur"]="$curblock"; cur=""; curblock=""; fi
            state=body
          elif [[ -n "$line" && "$line" == [[:space:]]* && -n "$cur" ]]; then
            curblock+=$'\n'"$line"
          elif [[ "$line" == *:* ]]; then
            if [[ -n "$cur" ]]; then PV["$cur"]="$curblock"; fi
            cur="${line%%:*}"; curblock="$line"
            PK+=("$cur")
          fi
          ;;
        body)
          bodylines+=("$line")
          ;;
      esac
    done <"$f"
    if [[ -n "$cur" ]]; then PV["$cur"]="$curblock"; fi
    if [[ ${#bodylines[@]} -gt 0 ]]; then PBODY="$(printf '%s\n' "${bodylines[@]}")"; fi
  }

  declare -A M_BASE_V=() M_OURS_V=() M_THEIRS_V=()
  declare -a M_ALL_KEYS=()
  m_base_body=""; m_ours_body=""; m_theirs_body=""
  m_have_base=0; m_have_ours=0; m_have_theirs=0
  if [[ -n "$m_base" && -f "$m_base" ]]; then
    m_have_base=1; parse_node "$m_base"
    for k in ${PK[@]+"${PK[@]}"}; do M_BASE_V["$k"]="${PV[$k]}"; done
    m_base_body="$PBODY"
  fi
  if [[ -n "$m_ours" && -f "$m_ours" ]]; then
    m_have_ours=1; parse_node "$m_ours"
    for k in ${PK[@]+"${PK[@]}"}; do
      if [[ -z "${M_OURS_V[$k]+x}" ]]; then M_OURS_V["$k"]="${PV[$k]}"; M_ALL_KEYS+=("$k"); fi
    done
    m_ours_body="$PBODY"
  fi
  if [[ -f "$m_theirs" ]]; then
    m_have_theirs=1; parse_node "$m_theirs"
    for k in ${PK[@]+"${PK[@]}"}; do
      if [[ -z "${M_THEIRS_V[$k]+x}" ]]; then
        M_THEIRS_V["$k"]="${PV[$k]}"
        m_seen=0
        for m_existing in ${M_ALL_KEYS[@]+"${M_ALL_KEYS[@]}"}; do
          [[ "$m_existing" == "$k" ]] && { m_seen=1; break; }
        done
        [[ $m_seen -eq 1 ]] || M_ALL_KEYS+=("$k")
      fi
    done
    m_theirs_body="$PBODY"
  fi

  # Standard three-way scalar rule, applied to whole raw blocks:
  #   ours == theirs                -> take it
  #   ours == base (theirs moved)   -> take theirs
  #   theirs == base (ours moved)   -> take ours
  #   only one side has it          -> take that side
  #   otherwise                     -> conflict
  m_conflicts_json="[]"
  m_resolved=true
  m_merged_blocks=()
  m_resolve3() { # <have_b> <have_o> <have_t> <bv> <ov> <tv> — prints the winner
    local hb="$1" ho="$2" ht="$3" bv="$4" ov="$5" tv="$6"
    if [[ $ho -eq 1 && $ht -eq 1 && "$ov" == "$tv" ]]; then printf '%s' "$ov"; return 0
    elif [[ $hb -eq 1 && $ho -eq 1 && $ht -eq 1 && "$ov" == "$bv" ]]; then printf '%s' "$tv"; return 0
    elif [[ $hb -eq 1 && $ho -eq 1 && $ht -eq 1 && "$tv" == "$bv" ]]; then printf '%s' "$ov"; return 0
    elif [[ $ho -eq 1 && $ht -eq 0 ]]; then printf '%s' "$ov"; return 0
    elif [[ $ht -eq 1 && $ho -eq 0 ]]; then printf '%s' "$tv"; return 0
    fi
    return 1
  }
  for k in ${M_ALL_KEYS[@]+"${M_ALL_KEYS[@]}"}; do
    have_b=0; [[ -n "${M_BASE_V[$k]+x}" ]] && have_b=1
    have_o=0; [[ -n "${M_OURS_V[$k]+x}" ]] && have_o=1
    have_t=0; [[ -n "${M_THEIRS_V[$k]+x}" ]] && have_t=1
    bv="${M_BASE_V[$k]-}"; ov="${M_OURS_V[$k]-}"; tv="${M_THEIRS_V[$k]-}"
    if final="$(m_resolve3 "$have_b" "$have_o" "$have_t" "$bv" "$ov" "$tv")"; then
      m_merged_blocks+=("$final")
    else
      m_resolved=false
      m_conflicts_json="$(jq -c --arg field "$k" --arg ours "$ov" --arg theirs "$tv" \
        '. + [{field:$field, ours:$ours, theirs:$theirs}]' <<<"$m_conflicts_json")"
    fi
  done

  # The markdown body is merged as one unit under the pseudo-field "body".
  m_merged_body=""
  if m_merged_body="$(m_resolve3 "$m_have_base" "$m_have_ours" "$m_have_theirs" \
                                 "$m_base_body" "$m_ours_body" "$m_theirs_body")"; then
    :
  else
    m_resolved=false
    m_conflicts_json="$(jq -c --arg field body --arg ours "$m_ours_body" --arg theirs "$m_theirs_body" \
      '. + [{field:$field, ours:$ours, theirs:$theirs}]' <<<"$m_conflicts_json")"
  fi

  if [[ "$m_resolved" == true ]]; then
    if [[ -n "$m_out" ]]; then
      : >"$m_out"
      if [[ ${#m_merged_blocks[@]} -gt 0 ]]; then
        printf -- '---\n' >>"$m_out"
        printf '%s\n' "${m_merged_blocks[@]}" >>"$m_out"
        printf -- '---\n' >>"$m_out"
      fi
      [[ -n "$m_merged_body" ]] && printf '%s\n' "$m_merged_body" >>"$m_out"
    fi
    printf '{"resolved":true,"conflicts":[]}\n'
  else
    printf '{"resolved":false,"conflicts":%s}\n' "$m_conflicts_json"
  fi
  exit 0
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
    printf '{"scopeStale":false,"strategyStale":false,"stampMissing":%s,"nodeOnMain":true}' "$missing"
    ;;
  *apply-node-transition.ts)
    # Emulate applyNodeTransition + decideTransition (the pure transitions layer):
    # forward the phase one ladder edge (CI-blind), rewrite the phase line in the
    # node file (preserving every sibling field — the blocked_by survival case),
    # and print the decision JSON. --strategy-stale holds; review arms merge.
    shift   # drop the script path
    id=""; strategy_stale=false
    while [[ $# -gt 0 ]]; do
      case "$1" in
        --strategy-stale) strategy_stale=true; shift ;;
        --scope-stale) shift ;;
        --set-pr) shift 2 ;;
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
# fails (the concurrent write moved `phase` — the very field transition-node is
# writing — to a third value, an unresolvable three-way divergence: base
# implement, ours qa, theirs main-qa) — so it falls through to park_and_exit():
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
  # Collide on the SAME field transition-node itself writes (phase). A disjoint
  # addition would now merge cleanly under the real 3-way shim and silently
  # defeat this case; base=implement / ours=qa / theirs=main-qa cannot resolve.
  sed -i 's/^phase: .*/phase: main-qa/' "$D/intentions/$GC_NODE.md"
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
   && grep -q '^phase: main-qa' <<<"$content" \
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

echo
echo "passed: $PASS  failed: $FAIL"
[[ $FAIL -eq 0 ]] || exit 1
exit 0
