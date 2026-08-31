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
#      pushed to origin/main. Under Unit 4's coarse `.office_hours != null`
#      verify-landed check (tactic-graph-commit-landing-signal-unreliable),
#      park-node now exits 0 here — the node genuinely ended up parked, even
#      though the specific text that landed is graph-commit's own auto-park
#      fallback reason, not park-node's original one. Reliably triggered —
#      without a literal race — by a test wrapper standing in for graph-commit
#      that lands the concurrent change, then delegates to the real
#      graph-commit whose check_base_freshness sees origin has moved past
#      FRESH_BLOB.
#   3. A node absent from origin/main is refused before any write (exit 1).
#   4. park-node byte-identical restore-on-failure (tactic-graph-write-failure-
#      rollback Unit 1; restore-target corrected by
#      tactic-park-node-rollback-dirty-tree-blocks-tick-sync): when graph-commit
#      fails AFTER the office_hours write lands on disk, the trap restores
#      intentions/<id>.md to its PRE-REFRESH local state (captured before the
#      origin/main overwrite, NOT from FRESH_BLOB itself) — asserted via
#      `git status --porcelain` against the clone's HEAD being empty (byte
#      identical AND untracked-residue-free), not just "file exists". This
#      clone is a FRESH clone taken immediately before the run, so its own HEAD
#      blob and origin/main's blob are identical here; case 22 below is the one
#      that makes them differ.
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
#      residue (git status --porcelain empty) left behind for the trap to roll
#      back — the pin check in park-node runs before the local file is even
#      overwritten from origin/main.
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
#      working-tree residue, git status --porcelain empty) — the explicit
#      restore-before-exit-0 path.
#  18. clear-park byte-identical restore-on-failure: with graph-commit swapped
#      for a wrapper that fails AFTER the office_hours clear landed on disk,
#      the trap restores intentions/<id>.md exactly (git status --porcelain
#      empty).
#  19. clear-park `--base` diagnosis-time pin, mirroring cases 12-13: a
#      matching pin is transparent (exit 0, cleared on origin); a stale pin
#      refuses BEFORE any mutation (exit 3, `stale-diagnosis` on stderr,
#      origin/main unchanged, no local working-tree residue — git status
#      --porcelain empty).
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
#  22. park-node's rollback restores a CLEAN tree even when the local clone's
#      HEAD blob for the target node has fallen behind origin/main (the
#      2026-08-01 outage condition,
#      tactic-park-node-rollback-dirty-tree-blocks-tick-sync): a second writer
#      lands a concurrent advance on origin/main for the same node through the
#      REAL graph-commit while the writer under test is cloned beforehand and
#      never synced, so its local HEAD blob deliberately differs from
#      origin/main's for that path — unlike case 4, whose fresh clone makes the
#      two blobs identical and so cannot distinguish a restore from FRESH_BLOB
#      (buggy) from a restore from the pre-touch local copy (correct). With
#      graph-commit forced to fail after the office_hours write lands, the
#      assertion is `git status --porcelain -- intentions/` being EMPTY
#      afterward — not `git diff`, which cannot see an index-vs-worktree
#      mismatch or a leaked untracked `.rollback` sibling, and is exactly what
#      dispatch-tick's own `git merge --ff-only` and graph-commit's
#      `assert_clean_outside_ids` actually consult. A precondition guard fails
#      the case explicitly (rather than passing vacuously) if the fixture ever
#      fails to make the two blobs differ.
#  23. Unit 4 (tactic-graph-commit-landing-signal-unreliable) Direction B: a
#      graph-commit that REPORTS failure (forced non-zero exit) over a write
#      that actually landed on origin/main must still make park-node exit 0.
#      A wrapper delegates to the REAL graph-commit (so the write genuinely
#      lands, no conflict involved), then unconditionally forces its own exit
#      to 1 regardless of the real result — simulating graph-commit's rc being
#      wrong in the false-failure direction. park-node's own post-call
#      verify-landed check, not graph-commit's rc, must be what decides the
#      outcome here.
#  24. Unit 4: an undeterminable (unknown) verify-landed verdict must NEVER be
#      read as success. verify-landed itself is swapped for a stub that always
#      reports `unknown` (exit 1), regardless of whether the underlying write
#      landed. park-node must exit non-zero with a message that says the
#      landing could not be determined — and must NOT claim a rollback
#      happened, since that would assert knowledge the check couldn't provide.
#  25. clear-park's `-C <repo-root>` is REQUIRED (strategy-graph-native-dispatch
#      clarification 194/242): the script no longer derives its target checkout
#      from its own on-disk location. Omitting -C, passing it with no value,
#      pointing it at a non-directory, pointing it at a directory with no
#      intentions/, and pointing it at a nested directory that HAS an
#      intentions/ but is not the git toplevel must each be a usage error
#      (exit 2) that mutates NOTHING — not a fallback to the script's own tree.
#      The companion positive arm is case 20, which drives script location and
#      -C target apart deliberately.
#
# No network needed. Cases 1-3, 6-15, and 22-24 need only bash + git + jq (the
# gh and npx PATH shims stand in for the GitHub API and the tsx writers).
# Cases 4-5 need a real `node`/`npx tsx` too (case 5's
# apply-node-transition.ts is real TypeScript, resolved against a
# node_modules SYMLINK to this repo's own — read-only, never written by the
# test); cases 23 and 22/1/2/etc. also need real node/tsx transitively via
# verify-landed's own jq-mode readNodeAtRef call.

set -uo pipefail

HARNESS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REAL_REPO_ROOT="$(cd "$HARNESS_DIR/../../.." && pwd)"
PN_SCRIPT="$HARNESS_DIR/park-node"
GC_SCRIPT="$HARNESS_DIR/graph-commit"
RP_SCRIPT="$HARNESS_DIR/resolve-park"
CP_SCRIPT="$HARNESS_DIR/clear-park"
DEMOTE_SCRIPT="$HARNESS_DIR/demote-node-to-implement"
APPLY_TS="$HARNESS_DIR/apply-node-transition.ts"
VL_SCRIPT="$HARNESS_DIR/verify-landed"
LIB_STORE_AT_REF_TS="$HARNESS_DIR/lib-store-at-ref.ts"
LIB_BASE_PIN_SH="$HARNESS_DIR/lib-base-pin.sh"
[[ -f "$PN_SCRIPT" ]] || { echo "error: park-node not found at $PN_SCRIPT" >&2; exit 1; }
[[ -f "$GC_SCRIPT" ]] || { echo "error: graph-commit not found at $GC_SCRIPT" >&2; exit 1; }
[[ -f "$RP_SCRIPT" ]] || { echo "error: resolve-park not found at $RP_SCRIPT" >&2; exit 1; }
[[ -f "$CP_SCRIPT" ]] || { echo "error: clear-park not found at $CP_SCRIPT" >&2; exit 1; }
[[ -f "$DEMOTE_SCRIPT" ]] || { echo "error: demote-node-to-implement not found at $DEMOTE_SCRIPT" >&2; exit 1; }
[[ -f "$VL_SCRIPT" ]] || { echo "error: verify-landed not found at $VL_SCRIPT" >&2; exit 1; }
[[ -f "$LIB_STORE_AT_REF_TS" ]] || { echo "error: lib-store-at-ref.ts not found at $LIB_STORE_AT_REF_TS" >&2; exit 1; }
[[ -f "$LIB_BASE_PIN_SH" ]] || { echo "error: lib-base-pin.sh not found at $LIB_BASE_PIN_SH" >&2; exit 1; }
command -v jq >/dev/null || { echo "error: jq not found (required by the gh shim)" >&2; exit 1; }
[[ -d "$REAL_REPO_ROOT/node_modules" ]] || { echo "error: $REAL_REPO_ROOT/node_modules not found — install dependencies first (npm install at the repo root)" >&2; exit 1; }

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
# park-node and clear-park both source this at their own SCRIPT_DIR for
# --base pin resolution (lib-base-pin.sh); without this copy the clones can't
# find it and every --base-exercising case fails.
cp "$LIB_BASE_PIN_SH" "$SEED/packages/intentionsutil/scripts/lib-base-pin.sh"
cp "$DEMOTE_SCRIPT" "$SEED/packages/intentionsutil/scripts/demote-node-to-implement"
cp "$APPLY_TS" "$SEED/packages/intentionsutil/scripts/apply-node-transition.ts"
# verify-landed + its lib-store-at-ref.ts dependency: park-node/clear-park now
# shell out to verify-landed (at their own SCRIPT_DIR, same convention as
# graph-commit) to derive their landing verdict instead of trusting
# graph-commit's rc (tactic-graph-commit-landing-signal-unreliable, Unit 4).
cp "$VL_SCRIPT" "$SEED/packages/intentionsutil/scripts/verify-landed"
cp "$LIB_STORE_AT_REF_TS" "$SEED/packages/intentionsutil/scripts/lib-store-at-ref.ts"
chmod +x "$SEED/packages/intentionsutil/scripts/park-node" \
         "$SEED/packages/intentionsutil/scripts/graph-commit" \
         "$SEED/packages/intentionsutil/scripts/resolve-park" \
         "$SEED/packages/intentionsutil/scripts/clear-park" \
         "$SEED/packages/intentionsutil/scripts/demote-node-to-implement" \
         "$SEED/packages/intentionsutil/scripts/verify-landed"
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

seed_node() { # <id> — 12 numbered lines so distant edits rebase cleanly, wrapped
              # in REAL frontmatter fences plus the schema's required core
              # fields (id/kind/statement/owner/status) and an explicit
              # `office_hours: null` line. Unit 4's verify-landed jq-mode check
              # (`--node <id> --jq '.office_hours != null'`) parses these nodes
              # for real via readNodeAtRef, not just greps them — unlike the
              # rest of this harness's synthetic content, these fixtures must
              # be valid YAML frontmatter or every jq-mode check comes back
              # `unknown`.
  local i
  {
    echo "---"
    echo "id: $1"
    echo "kind: tactic"
    echo "statement: harness node $1"
    echo "owner: ai"
    echo "status: codified"
    for i in $(seq 1 12); do echo "line$i: base"; done
    echo "office_hours: null"
    echo "---"
    echo "# harness node $1"
  } >"$SEED/intentions/$1.md"
}
for id in t-stale t-concurrent t-pr t-pr-bad-arg t-resolve-ratify t-resolve-reject t-resolve-unparked t-pinned \
          t-clear-happy t-clear-noop t-clear-rollback t-clear-pinned t-clear-cwd t-resolve-cwd t-restore-stale \
          t-park-rollback t-park-unknown t-park-false-fail t-clear-symlink; do
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
#       does not fit (a)/(b)'s shape). This does NOT reimplement the real
#       three-way YAML field merge (that primitive, mergeIntentionNodes, is
#       Unit 1's job and its correctness is covered by
#       packages/intentionsutil/test/node-merge.test.ts — the source of
#       truth); it only proves graph-commit invokes merge-node.ts at the right
#       point and branches correctly on its resolved/unresolved verdict, via a
#       SIMPLIFIED three-way merge over bare `key: value` lines (ported from
#       test-graph-commit.sh's identical shim — works against this file's
#       flat line1..line12 fixtures the same way). For each key appearing in
#       ours and/or theirs: if both sides agree (or only one side touched
#       it), that value wins (a disjoint addition on either side never
#       conflicts — this is exactly why case 1's far-ahead rebuild, which adds
#       office_hours on one side and a disjoint body edit on the other, now
#       resolves cleanly instead of parking); if both sides changed it away
#       from base to DIFFERENT values (or there is no base to compare against
#       and the two sides disagree), it is an unresolved conflict — the
#       layer-3 conflict-park path case 2 verifies, which now forces the
#       concurrent write to collide on the SAME field (office_hours) park-node
#       itself writes, since a disjoint field addition would resolve cleanly
#       under this real merge instead of parking.
# set_office_hours_line <file> <new-office_hours-line> — replace the file's
# existing `office_hours: ...` frontmatter line IN PLACE (every seed_node
# fixture always has exactly one, starting as `office_hours: null`), rather
# than appending a new line at end-of-file the way this shim did before Unit 4.
# In-place replacement is required now that park-node/clear-park's own
# verify-landed jq-mode check real-parses this content via readNodeAtRef: an
# append-after-the-closing-fence would land outside the YAML frontmatter
# entirely and never be seen by that parser. awk (not sed) does the
# replacement so arbitrary characters in <new-office_hours-line> (quotes,
# spaces, dashes from free-text reasons) never need shell/regex escaping — it
# is passed through -v as an opaque value, never interpolated into a pattern.
set_office_hours_line() {
  local file="$1" newline="$2" tmp
  tmp="$file.oh.$$.tmp"
  awk -v repl="$newline" '{ if ($0 ~ /^office_hours:/) print repl; else print }' "$file" >"$tmp" \
    && mv "$tmp" "$file"
}
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

  # theirs genuinely absent (the id no longer exists on the landed side):
  # ours is the only content, so ours wins outright (mirrors merge-node.ts's
  # real documented behavior for an empty --theirs).
  if [[ -z "$m_theirs" ]]; then
    [[ -n "$m_out" && -n "$m_ours" ]] && cp -- "$m_ours" "$m_out"
    printf '{"resolved":true,"conflicts":[]}\n'
    exit 0
  fi

  declare -A M_BASE_V=() M_OURS_V=() M_THEIRS_V=()
  declare -a M_ALL_KEYS=()
  if [[ -n "$m_base" && -f "$m_base" ]]; then
    while IFS= read -r line || [[ -n "$line" ]]; do
      [[ "$line" == *:* ]] || continue
      k="${line%%:*}"; v="${line#*: }"
      [[ -n "${M_BASE_V[$k]+x}" ]] || M_BASE_V["$k"]="$v"
    done <"$m_base"
  fi
  if [[ -n "$m_ours" && -f "$m_ours" ]]; then
    while IFS= read -r line || [[ -n "$line" ]]; do
      [[ "$line" == *:* ]] || continue
      k="${line%%:*}"; v="${line#*: }"
      if [[ -z "${M_OURS_V[$k]+x}" ]]; then M_OURS_V["$k"]="$v"; M_ALL_KEYS+=("$k"); fi
    done <"$m_ours"
  fi
  if [[ -n "$m_theirs" && -f "$m_theirs" ]]; then
    while IFS= read -r line || [[ -n "$line" ]]; do
      [[ "$line" == *:* ]] || continue
      k="${line%%:*}"; v="${line#*: }"
      [[ -n "${M_THEIRS_V[$k]+x}" ]] || M_THEIRS_V["$k"]="$v"
      m_seen=0
      for m_existing in "${M_ALL_KEYS[@]:-}"; do [[ "$m_existing" == "$k" ]] && { m_seen=1; break; }; done
      [[ $m_seen -eq 1 ]] || M_ALL_KEYS+=("$k")
    done <"$m_theirs"
  fi

  m_conflicts_json="[]"
  m_resolved=true
  m_merged_lines=()
  for k in "${M_ALL_KEYS[@]}"; do
    have_b=0; [[ -n "${M_BASE_V[$k]+x}" ]] && have_b=1
    have_o=0; [[ -n "${M_OURS_V[$k]+x}" ]] && have_o=1
    have_t=0; [[ -n "${M_THEIRS_V[$k]+x}" ]] && have_t=1
    bv="${M_BASE_V[$k]-}"; ov="${M_OURS_V[$k]-}"; tv="${M_THEIRS_V[$k]-}"
    final=""
    if [[ $have_o -eq 1 && $have_t -eq 1 && "$ov" == "$tv" ]]; then
      final="$ov"
    elif [[ $have_b -eq 1 && $have_o -eq 1 && "$ov" == "$bv" && $have_t -eq 1 ]]; then
      final="$tv"
    elif [[ $have_b -eq 1 && $have_t -eq 1 && "$tv" == "$bv" && $have_o -eq 1 ]]; then
      final="$ov"
    elif [[ $have_o -eq 1 && $have_t -eq 0 ]]; then
      final="$ov"
    elif [[ $have_t -eq 1 && $have_o -eq 0 ]]; then
      final="$tv"
    else
      m_resolved=false
      m_conflicts_json="$(jq -c --arg field "$k" --arg ours "$ov" --arg theirs "$tv" \
        '. + [{field:$field, ours:$ours, theirs:$theirs}]' <<<"$m_conflicts_json")"
      continue
    fi
    m_merged_lines+=("$k: $final")
  done

  if [[ "$m_resolved" == true ]]; then
    if [[ -n "$m_out" ]]; then
      # Wrap the merged key:value lines in real frontmatter fences (the real
      # merge-node.ts's documented --out contract mirrors store.ts's writeNode
      # serialization) — required since Unit 4 so verify-landed's real
      # readNodeAtRef parse of the post-merge landed content still succeeds.
      { echo "---"; printf '%s\n' "${m_merged_lines[@]}"; echo "---"; echo "# harness merged node"; } >"$m_out"
    fi
    printf '{"resolved":true,"conflicts":[]}\n'
  else
    printf '{"resolved":false,"conflicts":%s}\n' "$m_conflicts_json"
  fi
  exit 0
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
    # Parked-ness is read off the file's single `office_hours:` frontmatter
    # line — set_office_hours_line keeps exactly one, so there is no more
    # "last of several appended lines" ambiguity to resolve.
    last_oh=""
    if grep -q '^office_hours:' "$rp_dir/$rp_id.md"; then
      last_oh="$(grep '^office_hours:' "$rp_dir/$rp_id.md")"
    fi
    if [[ -z "$last_oh" || "$last_oh" == "office_hours: null" ]]; then
      # clear-park's helper: `if (node.office_hours == null) process.exit(3)`.
      echo "clear-park: $rp_id is not parked (office_hours already null)" >&2
      exit 3
    fi
    # Simulate the real writer's office_hours=null by replacing the existing
    # frontmatter line in place (see set_office_hours_line above) — an
    # append-at-EOF would land outside the fences a real YAML parse reads.
    set_office_hours_line "$rp_dir/$rp_id.md" "office_hours: null"
    echo "npx shim: cleared office_hours on $rp_id" >&2
  else
    parked="false"; pr=""
    # A non-null office_hours line means parked. Every seed_node fixture ALWAYS
    # carries a literal `office_hours: null` line, so a bare `grep -q
    # office_hours` (any occurrence) would report every node as parked —
    # anchor on the value, not just the key's presence.
    if grep -q '^office_hours:' "$rp_dir/$rp_id.md" && ! grep -q '^office_hours: null$' "$rp_dir/$rp_id.md"; then
      parked="true"
    fi
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
    set_office_hours_line "$dir/$id.md" "office_hours: {reason: \"$reason\", since: \"$since\", recommendation: null}"
    echo "npx shim: set office_hours on $id (since=$since)" >&2
  done
else
  recommendation="$4"; id="$5"; pr="${6:-}"
  [[ -f "$dir/$id.md" ]] || { echo "npx shim: unreadable node $id" >&2; exit 1; }
  set_office_hours_line "$dir/$id.md" "office_hours: {reason: \"$reason\", since: \"$since\", recommendation: null}"
  if [[ -n "$pr" ]]; then
    printf 'execution_pr: %s\n' "$pr" >>"$dir/$id.md"
  fi
  echo "npx shim: set office_hours on $id (since=$since) recommendation='$recommendation'" >&2
fi
SH
# node shim. graph-commit no longer spawns the field-level merge tool through
# `npx tsx`; it spawns `node --import tsx/esm <...>/merge-node.ts ...`, because
# the tsx CLI opens an IPC unix socket a sandboxed caller cannot create. The
# three-way-merge emulation still lives in the npx shim above, so translate
# that ONE spawn back into the npx shim's `tsx <script> ...` convention and
# hand it over.
#
# Deliberately narrow: it matches merge-node.ts and nothing else, so
# graph-commit's own office_hours writer and verify-landed's readNodeAtRef --
# which use the same loader form -- keep reaching the REAL node exactly as they
# did before, and this shim's blast radius is only the call the spawn change
# moved. Without it those merge invocations reach real node, which cannot
# resolve tsx from a clone (and, in CI, cannot find merge-node.ts at all, since
# the harness never copies it into the seed), exit 1, and graph-commit rightly
# reads exit 1 as a broken execution environment and dies. Every merge case
# then fails for an environment reason instead of exercising the merge -- and
# before U7 the same breakage was invisible, because the old code treated a
# merge tool that could not start as an ordinary content divergence and parked.
REAL_NODE="$(command -v node)"
cat >"$WORK/bin/node" <<SH
#!/usr/bin/env bash
if [[ "\$1" == "--import" && "\$2" == "tsx/esm" && "\$3" == *merge-node.ts ]]; then
  shift 2
  exec "\$(dirname "\$0")/npx" tsx "\$@"
fi
exec "$REAL_NODE" "\$@"
SH
chmod +x "$WORK/bin/gh" "$WORK/bin/npx" "$WORK/bin/node"

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
    # `-C` is REQUIRED (clarification 194/242): clear-park no longer derives the
    # target checkout from its own script location. Here script and target are
    # the same clone; case 20 is the arm that drives them apart.
    bash packages/intentionsutil/scripts/clear-park -C "$clone" "$@"
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
# park-node resolved, and attempts the layers-1-3 mechanical auto-merge against
# it. The npx merge-node.ts shim now performs a real (if simplified) key:value
# three-way merge (see the shim's own comment above), so a concurrent write
# touching a field DISJOINT from park-node's own edit would resolve cleanly
# instead of parking — that clean-resolve case is exactly what case 1 proves.
# To keep this case a genuine unresolvable conflict, the concurrent writer
# below sets `office_hours` itself — the SAME field park-node's own edit
# writes — to a different value than park-node's, with neither side's value
# equal to base (which has no office_hours at all): a real same-field
# divergence, not a disjoint addition. The auto-merge reports it unresolved,
# so graph-commit falls through to its documented park_and_exit() fallback —
# office_hours is set on the node (reason containing "mechanical-unresolved")
# and that parking write is pushed to origin/main. Under Unit 4's coarse
# `.office_hours != null` landing check, park-node now exits 0 here: the
# node genuinely ended up parked (non-null office_hours) on origin/main by the
# time park-node asks verify-landed, even though the specific reason text that
# landed is graph-commit's own auto-park fallback, not park-node's original
# "provision-failed" reason. That coarseness is the accepted tradeoff of the
# field-level predicate (see park-node's header note) — the alternative,
# pinning to an exact --expect content match, is what graph-commit's own
# blob-based verdict already does one layer down; park-node's jq check answers
# a coarser question ("is this node parked at all") deliberately.
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
  # This must collide with park-node's own edit on the SAME field (office_hours)
  # — a disjoint new field would now resolve cleanly under the real merge-node.ts
  # shim (see case 1) instead of parking, which would defeat this case's purpose.
  D="$(mktemp -d)"
  git clone -q "$GC_ORIGIN" "$D"
  git -C "$D" config user.email other@test
  git -C "$D" config user.name other
  # Replace the seeded `office_hours: null` frontmatter line IN PLACE (not an
  # EOF append after the closing fence) — Unit 4's verify-landed jq-mode check
  # real-parses this content via readNodeAtRef, so an append-after-the-fence
  # would land in the body, outside the YAML this collision needs to hit.
  awk '{ if ($0 ~ /^office_hours:/) print "office_hours: {reason: \"competing office_hours from another writer\", since: \"2026-01-01\", recommendation: null}"; else print }' \
    "$D/intentions/$GC_NODE.md" >"$D/intentions/$GC_NODE.md.tmp" \
    && mv "$D/intentions/$GC_NODE.md.tmp" "$D/intentions/$GC_NODE.md"
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
# contention) refuses to land THIS writer's edit, but the same fail-closed
# sequence lands ITS OWN office_hours park onto the fresh origin/main content
# as the recorded outcome, so `office_hours` IS expected in the post-state (it
# is graph-commit's park, not this writer's). park-node's own verify-landed
# check reads that as "landed" (rc 0) under Unit 4's coarse
# `.office_hours != null` predicate — see the comment above the wrapper.
# NOTE: the concurrent writer's own text ("competing office_hours from
# another writer") is NOT expected to survive in the final landed content —
# under Unit 4's IN-PLACE office_hours field model (set_office_hours_line),
# the field holds exactly one value at a time, and graph-commit's auto-park
# fallback overwrites it with its own "mechanical-unresolved" reason. The
# collision itself is asserted via graph-commit's own stderr message instead
# ('concurrent-edit conflict').
if [[ $rc -eq 0 ]] \
   && grep -q 'concurrent-edit conflict' <<<"$out" \
   && grep -q 'office_hours' <<<"$content" \
   && grep -q 'mechanical-unresolved' <<<"$content"; then
  ok "concurrent origin/main advance triggers auto-park: graph-commit's own auto-park lands, park-node reads it as landed (exit 0) via the coarse office_hours!=null check, concurrent content survives"
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
# (tactic-graph-write-failure-rollback Unit 1; restore-target corrected by
# tactic-park-node-rollback-dirty-tree-blocks-tick-sync).
# ---------------------------------------------------------------------------
# graph-commit is swapped for a wrapper that unconditionally fails AFTER the
# real office_hours write already landed on disk (park-node's own npx-tsx
# write runs for real; only the downstream graph-commit call is faked). The
# trap this guards restores intentions/t-stale.md to its PRE-REFRESH local
# state on any non-zero exit once MUTATED=1 — assert byte-identical restore via
# `git status --porcelain` against the clone's own HEAD (which still holds the
# pre-mutation seed content) being EMPTY, not merely "the file exists". This
# clone (D) is FRESH — cloned immediately before the run — so its HEAD blob and
# origin/main's blob are identical here; case 22 below deliberately makes them
# differ, since that is the only construction that can tell a correct
# pre-refresh-local restore apart from the pre-fix FRESH_BLOB restore.
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

# t-park-rollback, not t-stale: t-stale was already parked (non-null
# office_hours) by case 1. Unit 4's `.office_hours != null` verify-landed check
# would then read that PRE-EXISTING park as "landed" regardless of whether
# THIS attempt's write ever reached origin/main — reusing an already-parked
# node would make this case ambiguous. t-park-rollback is fresh and untouched,
# so the only way the predicate reads landed is if the write under test here
# actually reached origin/main.
out="$(run_pn "$D" t-park-rollback 'simulated post-mutation failure' 2>&1)"; rc=$?
porcelain_after="$(git -C "$D" status --porcelain -- intentions/t-park-rollback.md)"
porcelain_after_dir="$(git -C "$D" status --porcelain -- intentions/)"
if [[ $rc -ne 0 ]] && grep -q 'did NOT land on origin/main' <<<"$out" \
   && [[ -z "$porcelain_after" ]] && [[ -z "$porcelain_after_dir" ]]; then
  ok "park-node byte-identical restore: graph-commit failure with nothing landed rolls back the office_hours write (git status --porcelain empty)"
else
  no "park-node byte-identical restore (rc=$rc)"
  printf '%s\n' "$out"; printf 'porcelain: %s\n' "$porcelain_after"; printf 'porcelain-dir: %s\n' "$porcelain_after_dir"
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
porcelain_after="$(git -C "$G" status --porcelain -- intentions/t-demote.md)"
porcelain_after_dir="$(git -C "$G" status --porcelain -- intentions/)"
if [[ $rc -ne 0 ]] && grep -q 'graph-commit failed for' <<<"$out" \
   && [[ -z "$porcelain_after" ]] && [[ -z "$porcelain_after_dir" ]]; then
  ok "demote-node-to-implement byte-identical restore: real apply-node-transition.ts mutation is rolled back on graph-commit failure (git status --porcelain empty)"
else
  no "demote-node-to-implement byte-identical restore (rc=$rc)"
  printf '%s\n' "$out"; printf 'porcelain: %s\n' "$porcelain_after"; printf 'porcelain-dir: %s\n' "$porcelain_after_dir"
fi

# ---------------------------------------------------------------------------
# Case 6: --pr threads through to the write, and pre-existing frontmatter
# (simulating execution.branch/attempts/markers) survives untouched.
# ---------------------------------------------------------------------------
F="$WORK/f"
make_clone "$F" writer-f
out="$(run_pn "$F" --pr 2942 t-pr 'unit-test park with pr' 2>&1)"; rc=$?
content="$(origin_show t-pr)"
# Unit 4: office_hours is now replaced IN PLACE inside the frontmatter (see
# set_office_hours_line in the npx shim), not appended after the whole file —
# required so verify-landed's real YAML parse can see it. That means the
# pre-existing content is no longer a literal string PREFIX of the new
# content, so "preserved" is asserted per-field (the seeded id/kind/lineN
# fields still present, unmodified) rather than by exact prefix match.
if [[ $rc -eq 0 ]] \
   && grep -q 'execution_pr: 2942' <<<"$content" \
   && grep -q 'office_hours: {reason: "unit-test park with pr"' <<<"$content" \
   && grep -q '^id: t-pr$' <<<"$content" \
   && grep -q '^line12: base$' <<<"$content"; then
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
porcelain_after="$(git -C "$H" status --porcelain -- intentions/t-pinned.md)"
if [[ $rc -eq 3 ]] \
   && grep -q 'stale-diagnosis' <<<"$out" \
   && [[ "$(origin_sha)" == "$before_sha" ]] \
   && [[ -z "$porcelain_after" ]]; then
  ok "stale --base pin: refuses before any mutation (exit 3, stale-diagnosis, main unchanged, git status --porcelain empty)"
else
  no "stale --base pin (rc=$rc before_sha=$before_sha)"
  printf '%s\n' "$out"; printf 'porcelain: %s\n' "$porcelain_after"
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
porcelain_after="$(git -C "$M_CLEAR" status --porcelain -- intentions/t-clear-happy.md)"
if [[ $rc -eq 0 ]] \
   && grep -q 'nothing to do' <<<"$out" \
   && [[ "$(origin_sha)" == "$before_sha" ]] \
   && [[ -z "$porcelain_after" ]]; then
  ok "clear-park idempotent no-op: exit 0 with 'nothing to do', main unchanged, refresh overwrite restored (git status --porcelain empty)"
else
  no "clear-park idempotent no-op (rc=$rc)"
  printf '%s\n' "$out"; printf 'porcelain: %s\n' "$porcelain_after"
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
porcelain_after="$(git -C "$N_CLEAR" status --porcelain -- intentions/t-clear-rollback.md)"
porcelain_after_dir="$(git -C "$N_CLEAR" status --porcelain -- intentions/)"
if [[ $rc -eq 1 ]] \
   && grep -q 'did NOT land on origin/main' <<<"$out" \
   && [[ -z "$porcelain_after" ]] && [[ -z "$porcelain_after_dir" ]]; then
  ok "clear-park byte-identical restore: graph-commit failure with nothing landed rolls back the office_hours clear (git status --porcelain empty)"
else
  no "clear-park byte-identical restore (rc=$rc)"
  printf '%s\n' "$out"; printf 'porcelain: %s\n' "$porcelain_after"; printf 'porcelain-dir: %s\n' "$porcelain_after_dir"
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
porcelain_after="$(git -C "$P_PIN" status --porcelain -- intentions/t-clear-pinned.md)"

if [[ $rc_match -eq 0 ]] && grep -q 'office_hours: null' <<<"$content" \
   && [[ $rc_stale -eq 3 ]] && grep -q 'stale-diagnosis' <<<"$out_stale" \
   && [[ "$(origin_sha)" == "$before_sha" ]] \
   && [[ -z "$porcelain_after" ]]; then
  ok "clear-park --base: matching pin clears normally (exit 0); stale pin refuses before any mutation (exit 3, stale-diagnosis, main unchanged, git status --porcelain empty)"
else
  no "clear-park --base pin (rc_match=$rc_match rc_stale=$rc_stale)"
  printf 'match: %s\n' "$out_match"; printf 'stale: %s\n' "$out_stale"
  printf 'porcelain: %s\n' "$porcelain_after"
fi

# ---------------------------------------------------------------------------
# Case 20: clear-park repo targeting — cwd is a DIFFERENT checkout.
# ---------------------------------------------------------------------------
# The regression guard this node exists for (mirrors test-graph-commit.sh's
# case 25 construction). clear-park takes its target checkout as a REQUIRED
# `-C <repo-root>` (clarification 194/242) and performs every write there;
# graph-commit resolves its repo from `-C` if given, else from CWD. So invoking
# clone X's clear-park by absolute path with `-C X`, from clone Y's cwd (and
# from a plain non-repo directory), must still land the clear in X and push it
# to origin/main, leaving Y's intentions/ untouched. Strip the `-C "$REPO_ROOT"`
# from clear-park's own graph-commit call and this goes red: graph-commit
# inspects Y instead, where nothing is staged for the id, and either silently
# commits nothing or trips Unit 1's --expect guard.
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
    bash "$owner/packages/intentionsutil/scripts/clear-park" -C "$owner" "$@"
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


# ---------------------------------------------------------------------------
# Case 22: park-node's rollback restores a CLEAN tree when the local clone's
# HEAD blob for the target node is STALE relative to origin/main
# (tactic-park-node-rollback-dirty-tree-blocks-tick-sync).
# ---------------------------------------------------------------------------
# Case 4 is structurally blind to this defect: its clone D is a FRESH clone
# taken immediately before the failing run, so FRESH_BLOB (origin/main's blob)
# and D's own HEAD blob for t-stale are IDENTICAL — a restore from FRESH_BLOB
# and a restore from D's pre-touch local bytes are byte-for-byte the same, so
# case 4 cannot tell a correct restore from the buggy one. This case makes
# them differ: clone R is cloned BEFORE a second writer (S) lands a concurrent
# advance on origin/main for the SAME node, and R is never synced afterward —
# mirroring the production condition (park-node's own `git fetch origin main`
# moves R's origin/main ref but never touches R's HEAD or worktree).
R="$WORK/r"
make_clone "$R" writer-r

S="$WORK/s"
make_clone "$S" writer-s
sync_clone "$S"
edit_line "$S" t-restore-stale 1 concurrent-advance
(
  cd "$S" || exit 99
  export PATH="$WORK/bin:$PATH" GC_FIXTURE_DIR="$FIXTURE_DIR"
  export GRAPH_COMMIT_CHECK_POLL_SECONDS=0 GRAPH_COMMIT_CHECK_TIMEOUT_SECONDS=5
  bash packages/intentionsutil/scripts/graph-commit -m 'test: land concurrent advance' t-restore-stale
) >/dev/null 2>&1

# Precondition: R's local HEAD blob for t-restore-stale must now DIFFER from
# origin/main's blob, or this case is vacuous — a future refactor could
# silently re-create case 4's blindness without any test noticing. Guard it
# explicitly rather than trusting the construction above.
r_head_blob="$(git -C "$R" rev-parse "HEAD:intentions/t-restore-stale.md")"
origin_blob_restore_stale="$(git -C "$ORIGIN" rev-parse "main:intentions/t-restore-stale.md")"
degenerate=0
if [[ "$r_head_blob" == "$origin_blob_restore_stale" ]]; then
  no "fixture degenerate — local HEAD blob equals origin/main blob, this case cannot distinguish the two restore targets"
  degenerate=1
fi

if [[ "$degenerate" -eq 0 ]]; then
  mv "$R/packages/intentionsutil/scripts/graph-commit" \
     "$R/packages/intentionsutil/scripts/graph-commit.real"
  cat >"$R/packages/intentionsutil/scripts/graph-commit" <<'SH'
#!/usr/bin/env bash
echo "graph-commit wrapper: simulated post-mutation failure" >&2
exit 1
SH
  chmod +x "$R/packages/intentionsutil/scripts/graph-commit"
  # graph-commit is UNTRACKED in R's index (never committed) — exempt from
  # assert_clean_outside_ids by its '??' skip, same as case 4.

  out="$(run_pn "$R" t-restore-stale 'simulated post-mutation failure with stale local HEAD' 2>&1)"; rc=$?
  porcelain_after="$(git -C "$R" status --porcelain -- intentions/)"
  if [[ $rc -ne 0 ]] && grep -q 'did NOT land on origin/main' <<<"$out" \
     && [[ -z "$porcelain_after" ]]; then
    ok "park-node stale-local-HEAD restore: rollback leaves a CLEAN tree (git status --porcelain empty) even when the local clone's HEAD blob differs from origin/main's"
  else
    no "park-node stale-local-HEAD restore (rc=$rc)"
    printf '%s\n' "$out"; printf 'porcelain: %s\n' "$porcelain_after"
  fi
fi

# ---------------------------------------------------------------------------
# Case 23: Direction B — graph-commit reports failure but the write actually
# IS on origin/main; park-node must exit 0 anyway.
# ---------------------------------------------------------------------------
U="$WORK/u"
make_clone "$U" writer-u
mv "$U/packages/intentionsutil/scripts/graph-commit" \
   "$U/packages/intentionsutil/scripts/graph-commit.real"
cat >"$U/packages/intentionsutil/scripts/graph-commit" <<'SH'
#!/usr/bin/env bash
SD="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
"$SD/graph-commit.real" "$@"
real_rc=$?
echo "graph-commit wrapper: the real graph-commit exited $real_rc; forcing a reported failure regardless (Direction B simulation)" >&2
exit 1
SH
chmod +x "$U/packages/intentionsutil/scripts/graph-commit"
# Commit the wrapper swap (mirrors case 2): graph-commit is TRACKED (seeded),
# so an uncommitted mv+overwrite would trip the REAL graph-commit's own
# assert_clean_outside_ids pre-flight guard before it ever gets to push.
git -C "$U" add packages/intentionsutil/scripts/graph-commit \
                packages/intentionsutil/scripts/graph-commit.real
git -C "$U" commit -qm 'test: install always-reports-failure-after-landing wrapper'

out="$(run_pn "$U" t-park-false-fail 'genuinely lands despite reported failure' 2>&1)"; rc=$?
content="$(origin_show t-park-false-fail)"
if [[ $rc -eq 0 ]] \
   && grep -q 'the real graph-commit exited 0' <<<"$out" \
   && grep -q 'verify-landed: verdict=landed' <<<"$out" \
   && grep -q 'office_hours' <<<"$content" \
   && grep -q 'genuinely lands despite reported failure' <<<"$content"; then
  ok "park-node trusts verify-landed over a graph-commit that reports failure on a write that actually landed (Direction B, exit 0)"
else
  no "park-node Direction B false-failure (rc=$rc)"
  printf '%s\n' "$out"; printf '%s\n' "$content"
fi

# ---------------------------------------------------------------------------
# Case 24: an undeterminable (unknown) verify-landed verdict must NOT cause
# park-node to exit 0 — and must not claim a rollback happened.
# ---------------------------------------------------------------------------
V="$WORK/v"
make_clone "$V" writer-v
mv "$V/packages/intentionsutil/scripts/verify-landed" \
   "$V/packages/intentionsutil/scripts/verify-landed.real"
cat >"$V/packages/intentionsutil/scripts/verify-landed" <<'SH'
#!/usr/bin/env bash
# Always reports unknown, regardless of what actually landed — simulates a
# fetch/git failure inside verify-landed's own origin/main check.
echo "verify-landed: verdict=unknown ids=simulated main=unknown (test stub: forced unknown)" >&2
exit 1
SH
chmod +x "$V/packages/intentionsutil/scripts/verify-landed"
# Commit the swap for the same assert_clean_outside_ids reason as case 23 —
# verify-landed is a tracked file, and the REAL graph-commit still runs here
# (only verify-landed is faked; the write genuinely lands normally).
git -C "$V" add packages/intentionsutil/scripts/verify-landed \
                packages/intentionsutil/scripts/verify-landed.real
git -C "$V" commit -qm 'test: install always-unknown verify-landed stub'

out="$(run_pn "$V" t-park-unknown 'should land but verdict is undeterminable' 2>&1)"; rc=$?
content="$(origin_show t-park-unknown)"
if [[ $rc -ne 0 ]] \
   && grep -q 'could not determine whether the office_hours park' <<<"$out" \
   && grep -q 'verdict=unknown' <<<"$out" \
   && ! grep -qi 'rolled back' <<<"$out" \
   && grep -q 'office_hours' <<<"$content"; then
  ok "park-node: an undeterminable (unknown) verify-landed verdict never exits 0, and never claims a rollback"
else
  no "park-node unknown-verdict (rc=$rc)"
  printf '%s\n' "$out"; printf '%s\n' "$content"
fi

# ---------------------------------------------------------------------------
# Case 25: clear-park refuses to run without an explicit -C <repo-root>.
# ---------------------------------------------------------------------------
# The required-explicit-argument contract (clarification 194, ADOPTED; scoped by
# clarification 242). Before it, clear-park resolved REPO_ROOT from SCRIPT_DIR,
# so an invocation with no -C silently targeted whatever checkout the script
# copy happened to live in — the exact class of defect this case pins shut. All
# four refusals must exit 2 and leave both origin/main and the clone untouched.
R_REQ="$WORK/req-c"; make_clone "$R_REQ" writer-req-c
run_pn "$R_REQ" t-require-c 'unit-test -C requirement setup' >/dev/null 2>&1
before_sha_c="$(origin_sha)"

run_cp_raw() { # [clear-park args...] — NO -C injected, unlike run_cp.
  (
    cd "$R_REQ" || exit 99
    export PATH="$WORK/bin:$PATH"
    export GC_FIXTURE_DIR="$FIXTURE_DIR"
    bash packages/intentionsutil/scripts/clear-park "$@"
  )
}

out_missing="$(run_cp_raw t-require-c 2>&1)"; rc_missing=$?
out_noval="$(run_cp_raw -C 2>&1)"; rc_noval=$?
out_notdir="$(run_cp_raw -C "$R_REQ/intentions/t-require-c.md" t-require-c 2>&1)"; rc_notdir=$?
NOSTORE="$WORK/req-c-nostore"; mkdir -p "$NOSTORE"
out_nostore="$(run_cp_raw -C "$NOSTORE" t-require-c 2>&1)"; rc_nostore=$?
# Fifth arm: a NESTED directory that does hold its own intentions/, so both the
# is-a-directory and has-a-store checks pass, but which is not the git
# toplevel. git resolves `origin/main:intentions/<id>.md` from the toplevel and
# the write/hash from -C, so accepting this would read the OUTER store and
# write the INNER one. Must be the same usage error as the other four.
# Seeded literally rather than copied from the clone: the arm must hold even
# when the clone's own fixture node is absent, or the byte-comparison below
# silently degrades to comparing two empty strings.
NESTED="$R_REQ/nested-store"; mkdir -p "$NESTED/intentions"
printf -- '---\nid: t-require-c\n---\nnested sentinel, must not be rewritten\n' \
  > "$NESTED/intentions/t-require-c.md"
nested_before="$(git hash-object "$NESTED/intentions/t-require-c.md")"
out_nottop="$(run_cp_raw -C "$NESTED" t-require-c 2>&1)"; rc_nottop=$?
nested_after="$(git hash-object "$NESTED/intentions/t-require-c.md")"

after_sha_c="$(origin_sha)"
porcelain_c="$(git -C "$R_REQ" status --porcelain -- intentions/)"

if [[ $rc_missing -eq 2 && $rc_noval -eq 2 && $rc_notdir -eq 2 && $rc_nostore -eq 2 && $rc_nottop -eq 2 ]] \
   && grep -q -- '-C <repo-root> is required' <<<"$out_missing" \
   && grep -q 'no intentions/ directory' <<<"$out_nostore" \
   && grep -q 'is not the git toplevel' <<<"$out_nottop" \
   && [[ "$nested_after" == "$nested_before" ]] \
   && [[ "$after_sha_c" == "$before_sha_c" ]] && [[ -z "$porcelain_c" ]]; then
  ok "clear-park requires -C: omitted / valueless / non-directory / storeless / not-a-toplevel all exit 2 with nothing written"
else
  no "clear-park -C requirement (rc_missing=$rc_missing rc_noval=$rc_noval rc_notdir=$rc_notdir rc_nostore=$rc_nostore rc_nottop=$rc_nottop porcelain='$porcelain_c' before=$before_sha_c after=$after_sha_c nested_before=$nested_before nested_after=$nested_after)"
  printf 'missing: %s\n' "$out_missing"
  printf 'nostore: %s\n' "$out_nostore"
  printf 'nottop: %s\n' "$out_nottop"
fi

# ---------------------------------------------------------------------------
# Case 26: a checkout reached through a SYMLINK is a legitimate -C.
# ---------------------------------------------------------------------------
# The toplevel gate case 25 pins used to decide by STRING-COMPARING two
# normalizations of the same directory: `cd "$REPO_ARG" && pwd`, which is
# LOGICAL and keeps the symlink in the path, against `rev-parse
# --show-toplevel`, which is SYMLINK-RESOLVED. Through a symlinked checkout
# those two can never match, so a caller standing in the one and only tree it
# meant was rejected outright with "is not the git toplevel" -- a gate built to
# catch a NESTED -C firing on a perfectly legitimate state instead.
# `rev-parse --show-prefix` answers the question the gate is actually asking
# (empty IFF this directory IS the toplevel) and has no second normalization to
# disagree with.
#
# Both arms are load-bearing. (a) is the false rejection. (b) is the gate
# keeping its teeth through the very same symlink -- without it the repair
# could have traded a false reject for a false accept, which is the strictly
# worse failure (case 25's comment explains what a nested -C does).
SYM_REAL="$WORK/sym-real"; make_clone "$SYM_REAL" writer-sym
SYM_LINK="$WORK/sym-alias"
ln -s "$SYM_REAL" "$SYM_LINK"

run_cp_at() { # <-C value> [clear-park args...] — cwd is always the REAL path,
              # so the -C spelling is the only variable between the two arms.
  local at="$1"; shift
  (
    cd "$SYM_REAL" || exit 99
    export PATH="$WORK/bin:$PATH"
    export GC_FIXTURE_DIR="$FIXTURE_DIR"
    export GRAPH_COMMIT_CHECK_POLL_SECONDS=0
    export GRAPH_COMMIT_CHECK_TIMEOUT_SECONDS=5
    export GRAPH_COMMIT_MAX_ATTEMPTS=5
    bash packages/intentionsutil/scripts/clear-park -C "$at" "$@"
  )
}

# (a) the legitimate invocation: -C names the checkout through its symlink.
run_pn "$SYM_REAL" t-clear-symlink 'unit-test symlinked -C setup' >/dev/null 2>&1
sync_clone "$SYM_REAL"
parked_sym="$(origin_show t-clear-symlink)"
before_sha_sym="$(origin_sha)"
out_sym="$(run_cp_at "$SYM_LINK" t-clear-symlink 'through a symlinked checkout' 2>&1)"; rc_sym=$?
content_sym="$(origin_show t-clear-symlink)"
after_sha_sym="$(origin_sha)"
porcelain_sym="$(git -C "$SYM_REAL" status --porcelain -- intentions/)"

# (b) a NESTED store below the same symlink is still not the toplevel.
SYM_NESTED="$SYM_REAL/nested-store"; mkdir -p "$SYM_NESTED/intentions"
printf -- '---\nid: t-clear-symlink\n---\nnested sentinel, must not be rewritten\n' \
  > "$SYM_NESTED/intentions/t-clear-symlink.md"
sym_nested_before="$(git hash-object "$SYM_NESTED/intentions/t-clear-symlink.md")"
out_symnest="$(run_cp_at "$SYM_LINK/nested-store" t-clear-symlink 'nested below the alias' 2>&1)"; rc_symnest=$?
sym_nested_after="$(git hash-object "$SYM_NESTED/intentions/t-clear-symlink.md")"

# The setup must genuinely have parked the node, or "office_hours: null" after
# the clear is satisfied by the seed fixture's own starting value and the arm
# proves nothing.
if ! grep -q 'office_hours: null' <<<"$parked_sym" \
   && [[ $rc_sym -eq 0 ]] \
   && grep -q 'office_hours: null' <<<"$content_sym" \
   && [[ "$after_sha_sym" != "$before_sha_sym" ]] \
   && [[ -z "$porcelain_sym" ]] \
   && [[ $rc_symnest -eq 2 ]] \
   && grep -q 'is not the git toplevel' <<<"$out_symnest" \
   && [[ "$sym_nested_after" == "$sym_nested_before" ]]; then
  ok "clear-park -C through a symlinked checkout lands the clear (was a false 'not the git toplevel' reject), while a nested store below the same symlink is still refused"
else
  no "clear-park symlinked -C (rc_sym=$rc_sym rc_symnest=$rc_symnest porcelain='$porcelain_sym' before=$before_sha_sym after=$after_sha_sym nested_before=$sym_nested_before nested_after=$sym_nested_after)"
  printf 'parked: %s\n' "$parked_sym"
  printf 'sym: %s\n' "$out_sym"; printf '%s\n' "$content_sym"
  printf 'nested: %s\n' "$out_symnest"
fi

echo
echo "passed: $PASS  failed: $FAIL"
[[ $FAIL -eq 0 ]] || exit 1
exit 0
