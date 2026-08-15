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
#   2. The failure mode the `--base` token itself introduces: a concurrent
#      origin/main advance landed AFTER demote-node-to-implement resolved
#      FRESH_BLOB drives graph-commit's stale-base park (park_and_exit) rather
#      than a clobber. demote-node-to-implement exits 1, the office_hours park
#      and the concurrent writer's content are on origin/main, and — the part
#      no exit code reveals — the demoting checkout is left CLEAN: its
#      post-failure rollback must not write an uncommitted revert of the park
#      graph-commit just landed and reset the checkout onto.
#   3. A node absent from origin/main is refused before any write (exit 1).
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
seed_node t-concurrent "demotion target raced by a concurrent landing"
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
# conflict-park writer (park_write). Ported verbatim from
# test-transition-node.sh:
#   (c) merge-node.ts (flag argv --base/--ours/--theirs/--out): a REAL (if
#       simplified) three-way merge. It does NOT reimplement the production
#       field merge (mergeIntentionNodes, covered by
#       packages/intentionsutil/test/node-merge.test.ts — the source of truth);
#       it only proves graph-commit invokes merge-node.ts at the right point and
#       branches correctly on its resolved/unresolved verdict. An always-fail
#       stub cannot do that: it misreports case 1's genuinely DISJOINT merge
#       (local `phase` change vs. a landed `blocked_by` addition) as a conflict,
#       which is exactly the far-ahead-rebuild reconciliation this suite guards
#       — graph-commit's ensure_intentions_only_base far-ahead rebuild path
#       needs the real disjoint case to reconcile cleanly (rc=0, both changes
#       surviving), not get parked.
#       These nodes carry real `---`-fenced frontmatter, a markdown body, and
#       (via add_blocked_by) a two-line YAML list —
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
# graph-commit (and transition-node / demote-node-to-implement) now spawn tsx
# exclusively via `node --import tsx/esm` -- see
# tactic-graph-commit-merge-npx-park-storm. The merge-node.ts and park_write
# helper emulation this shim used to carry has moved to the `node` shim's
# *merge-node.ts) and *.mts) arms. npx must never be invoked; a hard failure
# here catches a silent regression back to it.
echo "npx shim: npx must not be invoked (tsx now runs via node --import tsx/esm)" >&2
exit 127

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
  *merge-node.ts)
    # graph-commit's run_merge_node() now spawns merge-node.ts via
    # `node --import tsx/esm` (previously `npx tsx`) -- this used to be the
    # npx shim's job; moved here verbatim (only the leading-arg shift count
    # changed, since this shim already stripped `--import tsx/esm`, not
    # `tsx`). Real three-way frontmatter/body merge -- not an always-conflict
    # stub -- because case 1 needs a genuinely DISJOINT merge (local `phase`
    # change vs. a landed `blocked_by` addition) to reconcile cleanly, and
    # case 2 needs a genuine SAME-FIELD three-way conflict to park.
    shift   # drop the script path
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
    ;;
  *.mts)
    # park_write()'s throwaway store-write helper -- graph-commit mktemp's a
    # `--suffix=.mts` module and invokes it as `node --import tsx/esm <helper>
    # <storeModule> <dir> <since> <reason> <snapDir> <pruneCsv> <id...>`. This
    # used to be the npx shim's catch-all branch (shift 3 for tsx/script/store
    # module); moved here with shift 2, since this shim already stripped
    # `--import tsx/esm` rather than `tsx`. Appends an office_hours line
    # carrying graph-commit's park reason to each id.
    shift 2   # helper script path, store module path
    dir="$1"; since="$2"; reason="$3"
    if [[ $# -eq 5 ]]; then
      ids=("$5")
    else
      shift 5   # dir, since, reason, snapDir, pruneCsv
      ids=("$@")
    fi
    for id in "${ids[@]}"; do
      [[ -f "$dir/$id.md" ]] || { echo "node shim: unreadable node $id" >&2; exit 1; }
      printf 'office_hours: {reason: "%s", since: %s}\n' "$reason" "$since" >>"$dir/$id.md"
      echo "node shim: set office_hours on $id (since=$since)" >&2
    done
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
# Case 2: a concurrent origin/main advance between FRESH_BLOB resolution and
# graph-commit's --base freshness check parks the node — and leaves the
# demoting checkout clean.
# ---------------------------------------------------------------------------
# This is the failure mode the `--base` token introduces, and the one no
# assertion on origin/main alone can catch: park_and_exit() ends with the
# demoting checkout reset onto (and holding) the freshly-landed park commit,
# and demote-node-to-implement's own EXIT-trap rollback then fires on the
# non-zero graph-commit status. A rollback that blindly restores FRESH_BLOB
# there writes an uncommitted REVERT of the just-landed park into the tree —
# which blocks `git merge --ff-only` for every later sync from that checkout,
# trips graph-commit's assert_clean_outside_ids for every later node write, and
# can be staged onto main by the next writer, silently clearing a park a human
# gate is waiting on. So this case asserts the tree state too, not just the
# exit code.
#
# demote-node-to-implement's fetch and graph-commit's check_base_freshness fetch
# happen back-to-back in one synchronous process, so there is no natural
# injection point to land a concurrent change between them. Rather than race,
# swap the graph-commit demote-node-to-implement invokes for a thin wrapper that
# (once) lands a concurrent change on origin/main for the node, then delegates to
# the real graph-commit (graph-commit.real) — the mechanism test-transition-node.sh
# uses for the same purpose. The real graph-commit's check_base_freshness
# re-fetches, sees origin's blob no longer matches the `--base` FRESH_BLOB, and
# its layer-3 auto-merge cannot resolve the divergence (the concurrent write
# moved `phase` — the very field the demotion writes — to a third value: base
# `qa`, ours `implement`, theirs `main-qa`), so it falls through to
# park_and_exit().
C="$WORK/c"
make_clone "$C" writer-c
mv "$C/$UTIL_DIR_REL/graph-commit" "$C/$UTIL_DIR_REL/graph-commit.real"
cat >"$C/$UTIL_DIR_REL/graph-commit" <<'SH'
#!/usr/bin/env bash
set -euo pipefail
SD="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [[ ! -f "$SD/.concurrent-landed" ]]; then
  # Land a concurrent change to the SAME node on origin/main, simulating another
  # writer committing after demote-node-to-implement resolved FRESH_BLOB but
  # before this check.
  D="$(mktemp -d)"
  git clone -q "$GC_ORIGIN" "$D"
  git -C "$D" config user.email other@test
  git -C "$D" config user.name other
  # Collide on the SAME field the demotion itself writes (phase). A disjoint
  # addition would merge cleanly under the real 3-way shim and silently defeat
  # this case; base=qa / ours=implement / theirs=main-qa cannot resolve.
  sed -i 's/^phase: .*/phase: main-qa/' "$D/intentions/$GC_NODE.md"
  git -C "$D" commit -qam 'concurrent edit (bypassing demote-node-to-implement)'
  git -C "$D" push -q origin main
  rm -rf "$D"
  : >"$SD/.concurrent-landed"
fi
exec "$SD/graph-commit.real" "$@"
SH
chmod +x "$C/$UTIL_DIR_REL/graph-commit"
# Commit the wrapper swap so graph-commit.real's assert_clean_outside_ids
# pre-flight guard (refuses to start on any unrelated dirty TRACKED file) doesn't
# trip on the tracked graph-commit path this swap modifies. graph-commit.real is
# untracked and already exempt (the guard skips '??' entries).
git -C "$C" add "$UTIL_DIR_REL/graph-commit"
git -C "$C" commit -qm 'test: install graph-commit wrapper for concurrent-write simulation'

before_sha="$(origin_sha)"
out="$(
  cd "$C" || exit 99
  export PATH="$WORK/bin:$PATH" GC_FIXTURE_DIR="$FIXTURE_DIR"
  export GRAPH_COMMIT_CHECK_POLL_SECONDS=0 GRAPH_COMMIT_CHECK_TIMEOUT_SECONDS=5
  export GRAPH_COMMIT_MAX_ATTEMPTS=5
  export GC_ORIGIN="$ORIGIN" GC_NODE=t-concurrent
  bash packages/intentionsutil/scripts/demote-node-to-implement t-concurrent 2>&1
)"; rc=$?
content="$(origin_show t-concurrent)"
# Tracked-path dirt only: the harness's own untracked scaffolding in this clone
# (graph-commit.real, the wrapper's .concurrent-landed sentinel) is not the
# subject — a leaked REVERT of the landed park is, and that shows up as a
# modified tracked file under intentions/.
dirt="$(git -C "$C" status --porcelain -- intentions/)"
if [[ $rc -eq 1 ]] \
   && grep -q '^phase: main-qa' <<<"$content" \
   && grep -q 'office_hours' <<<"$content" \
   && grep -q 'mechanical-unresolved' <<<"$content" \
   && [[ -z "$dirt" ]]; then
  ok "concurrent origin/main advance parks the node: demote exits 1, concurrent content and park survive on main, demoting checkout left clean"
else
  no "stale-base park (rc=$rc before_sha=$before_sha dirt='$dirt')"
  printf '%s\n' "$out"; printf '%s\n' "$content"
fi

# ---------------------------------------------------------------------------
# Case 3: a node absent from origin/main is refused before any write.
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
