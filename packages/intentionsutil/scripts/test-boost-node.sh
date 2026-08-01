#!/usr/bin/env bash
#
# test-boost-node.sh — functional harness for the `boost-node` bash landing
# wrapper (tactic-attention-boost-scripts, unit 3).
#
# Mirrors test-park-node.sh's setup: a throwaway bare origin plus writer clones,
# a `gh` PATH shim standing in for the GitHub API's check-run listing, and
# GRAPH_COMMIT_* env overrides shrinking the poll windows. `boost-node`,
# `boost-node.ts` and `graph-commit` under test are the ones next to this file;
# all three are copied into the scratch repo at their real repo-relative paths
# so their REPO_ROOT/SCRIPT_DIR resolution points at the scratch clone.
#
# Unlike test-park-node.sh there is NO `npx` shim: every mutation here runs
# through the REAL boost-node.ts, and therefore the real src/boost.ts,
# src/router.ts, src/attention.ts, src/schema.ts and src/store.ts. That is the
# point — the wrapper's whole job is to feed those the right store and land what
# they produce, so faking them would test nothing. The harness copies the repo's
# real `packages/intentionsutil/src/` (plus its package.json, whose
# `"type": "module"` is what keeps tsx's ESM loader working outside the real
# tree) into the scratch repo, and symlinks the real `node_modules` into each
# clone so `npx tsx` resolves tsx and the `yaml` package. Only `gh` is shimmed.
#
# The fixture graph, sized so one store can exercise both an ordinary boost and
# an ACK-gated one (the top-candidate bar is a GLOBAL property of the store, so
# the two cases are separated by the main-health EXEMPTION rather than by rank):
#
#   strategy-main-health   attention.boost 25          → rule-18 ceiling = 25
#   tactic-mh-child        serves main-health, boost 4 → rank 29, EXEMPT
#   strategy-cold          (no attention)
#   tactic-incumbent       serves cold, boost 20       → rank 20, contested
#   tactic-boost-*         serves cold, no attention   → the targets
#
# So an ordinary `boost-node <target> <rationale>` must beat rank 20 with a
# boost of 21 — comfortably below the ceiling, no ACK. The same call with
# `--include-exempt` must beat tactic-mh-child's rank 29 instead, needing 30,
# which matches-or-exceeds the ceiling and so is refused without `--ack`.
#
# Covers:
#   1. `--preview` prints a recommended boost and lands NOTHING (origin/main's
#      sha is byte-identical before and after).
#   2. A landing write records attention.boost and the VERBATIM rationale, and
#      the change is present on origin/main afterwards. The wrapper's own
#      post-land verification (exit 0, not 6) is part of the assertion — it
#      re-reads origin/main and asserts the target now tops the contested list.
#   3. No <rationale> and no --preview is NOT a silent preview-by-omission when
#      other write flags are present: `--boost` without a rationale reaches
#      boost-node.ts's mandatory-rationale gate and exits 2 with nothing
#      written. (Bare `<node-id>` alone IS the documented preview form; case 1
#      covers it.)
#   4. A stale `--base` pin refuses with exit 3 BEFORE any mutation: origin/main
#      unchanged and the local node file byte-identical (empty `git diff`).
#   5. A graph-commit failure after the attention write has already landed on
#      disk rolls intentions/<id>.md back byte-identically (empty `git diff`
#      against the clone's HEAD, not merely "the file exists").
#   6. A boost that would match-or-exceed strategy-main-health's dominant boost
#      is refused without `--ack`: exit 4, origin/main unchanged, no local diff.
#
# No network needed: bash + git + jq + a real `node`/`npx tsx` (resolved against
# a node_modules SYMLINK to this repo's own — read-only, never written here).

set -uo pipefail

HARNESS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REAL_REPO_ROOT="$(cd "$HARNESS_DIR/../../.." && pwd)"
BN_SCRIPT="$HARNESS_DIR/boost-node"
BN_TS="$HARNESS_DIR/boost-node.ts"
GC_SCRIPT="$HARNESS_DIR/graph-commit"
[[ -f "$BN_SCRIPT" ]] || { echo "error: boost-node not found at $BN_SCRIPT" >&2; exit 1; }
[[ -f "$BN_TS" ]] || { echo "error: boost-node.ts not found at $BN_TS" >&2; exit 1; }
[[ -f "$GC_SCRIPT" ]] || { echo "error: graph-commit not found at $GC_SCRIPT" >&2; exit 1; }
command -v jq >/dev/null || { echo "error: jq not found (required by boost-node and the gh shim)" >&2; exit 1; }

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
cp "$BN_SCRIPT" "$SEED/packages/intentionsutil/scripts/boost-node"
cp "$BN_TS" "$SEED/packages/intentionsutil/scripts/boost-node.ts"
cp "$GC_SCRIPT" "$SEED/packages/intentionsutil/scripts/graph-commit"
chmod +x "$SEED/packages/intentionsutil/scripts/boost-node" \
         "$SEED/packages/intentionsutil/scripts/graph-commit"
# The REAL planner/store/schema/router — every mutation in this harness runs
# through them. Every file under src/ is a same-package relative import (the
# only external dep is the npm "yaml" package, resolved via the node_modules
# symlink each clone gets below), so a blanket copy is simpler and safer than
# cherry-picking.
cp -r "$REAL_REPO_ROOT/packages/intentionsutil/src/." "$SEED/packages/intentionsutil/src/"
# "type": "module" — without it Node finds no package.json above the scratch
# tree and defaults .ts/.js resolution to CommonJS, breaking tsx's ESM loader.
cp "$REAL_REPO_ROOT/packages/intentionsutil/package.json" "$SEED/packages/intentionsutil/package.json"

# --- Fixture graph -----------------------------------------------------------
kind_node() { # <kind-name> <goal-layer:true|false>
  cat >"$SEED/intentions/kind-$1.md" <<NODE
---
id: kind-$1
kind: kind
statement: harness kind node for $1
owner: human
status: codified
attributes:
  goal_layer: $2
  status_vocabulary:
    codified: the harness treats every fixture node as settled
---
# harness kind node for $1
NODE
}
kind_node kind false
kind_node strategy true
kind_node tactic true

strategy_node() { # <id> [<boost>]
  {
    echo "---"
    echo "id: $1"
    echo "kind: strategy"
    echo "statement: harness strategy $1"
    echo "owner: ai"
    echo "status: codified"
    # A validated reading keeps the strategy out of the selector's candidate
    # list, so the rank arithmetic in this fixture is pure authored flow.
    echo "reading: \"validated (2026-07-01)\""
    if [[ -n "${2:-}" ]]; then
      echo "attention:"
      echo "  boost: $2"
      echo "  override: null"
      echo "  rationale: harness fixture boost"
    fi
    echo "---"
    echo "# harness strategy $1"
  } >"$SEED/intentions/$1.md"
}

tactic_node() { # <id> <serves-strategy> [<boost>]
  {
    echo "---"
    echo "id: $1"
    echo "kind: tactic"
    echo "statement: harness tactic $1"
    echo "owner: ai"
    echo "status: codified"
    echo "phase: implement"
    echo "serves:"
    echo "  - $2"
    if [[ -n "${3:-}" ]]; then
      echo "attention:"
      echo "  boost: $3"
      echo "  override: null"
      echo "  rationale: harness fixture boost"
    fi
    echo "---"
    echo "# harness tactic $1"
  } >"$SEED/intentions/$1.md"
}

strategy_node strategy-main-health 25
strategy_node strategy-cold
tactic_node tactic-mh-child strategy-main-health 4
tactic_node tactic-incumbent strategy-cold 20
for t in tactic-boost-preview tactic-boost-land tactic-boost-usage \
         tactic-boost-stale tactic-boost-rollback tactic-boost-ack; do
  tactic_node "$t" strategy-cold
done

git -C "$SEED" add -A
git -C "$SEED" commit -qm seed
git -C "$SEED" push -q origin main

# --- Independent writer clones ----------------------------------------------
make_clone() { # <dst> <identity>
  git clone -q "$ORIGIN" "$1"
  git -C "$1" config user.email "$2@test"
  git -C "$1" config user.name "$2"
  # node_modules SYMLINK (never copied, never committed — untracked, so
  # graph-commit's assert_clean_outside_ids guard skips it via its '??'
  # exemption). Needed by every `npx tsx` invocation in this harness, which
  # resolves tsx and the "yaml" package by walking up from the clone's own root.
  ln -s "$REAL_REPO_ROOT/node_modules" "$1/node_modules"
}

# --- gh PATH shim -------------------------------------------------------------
# Always reports the four required checks green, so graph-commit's required-check
# gate passes without a network call. `app.slug` is required, not decorative:
# graph-commit's gate only counts rows authored by the github-actions App.
mkdir -p "$WORK/bin" "$WORK/fixtures"
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
# gh shim: runs graph-commit's REAL --jq program against the green fixture, so
# the filter itself is exercised rather than a hardcoded count string.
jq_program=""
while [[ $# -gt 0 ]]; do
  if [[ "$1" == "--jq" ]]; then jq_program="$2"; break; fi
  shift
done
jq -r "$jq_program" "$GC_FIXTURE_DIR/green.json"
SH
chmod +x "$WORK/bin/gh"

FIXTURE_DIR="$WORK/fixtures"
origin_show() { git -C "$ORIGIN" show "main:intentions/$1.md"; }
origin_sha() { git -C "$ORIGIN" rev-parse main; }

run_bn() { # <clone> [boost-node args...]
  local clone="$1"; shift
  (
    cd "$clone" || exit 99
    export PATH="$WORK/bin:$PATH"
    export GC_FIXTURE_DIR="$FIXTURE_DIR"
    export GRAPH_COMMIT_CHECK_POLL_SECONDS=0
    export GRAPH_COMMIT_CHECK_TIMEOUT_SECONDS=5
    export GRAPH_COMMIT_MAX_ATTEMPTS=5
    bash packages/intentionsutil/scripts/boost-node "$@"
  )
}

RATIONALE='top-rank this: the harness needs a verbatim, multi-word rationale'

# ---------------------------------------------------------------------------
# Case 1: --preview reports a recommendation and writes nothing.
# ---------------------------------------------------------------------------
A="$WORK/a"
make_clone "$A" writer-a
before_sha="$(origin_sha)"
out="$(run_bn "$A" --preview tactic-boost-preview 2>&1)"; rc=$?
after_sha="$(origin_sha)"
porcelain="$(git -C "$A" status --porcelain -- intentions/)"
if [[ $rc -eq 0 ]] \
   && grep -q 'recommended boost: 21' <<<"$out" \
   && grep -q 'incumbent: tactic-incumbent' <<<"$out" \
   && [[ "$after_sha" == "$before_sha" ]] \
   && [[ -z "$porcelain" ]]; then
  ok "preview: recommends the boost sized against the incumbent's COMPOSED rank, lands nothing"
else
  no "preview (rc=$rc before_sha=$before_sha after_sha=$after_sha porcelain='$porcelain')"
  printf '%s\n' "$out"
fi

# Bare invocation with no rationale is the same preview path (no --preview flag).
before_sha="$(origin_sha)"
out_bare="$(run_bn "$A" tactic-boost-preview 2>&1)"; rc_bare=$?
if [[ $rc_bare -eq 0 ]] && grep -q 'recommended boost: 21' <<<"$out_bare" \
   && [[ "$(origin_sha)" == "$before_sha" ]]; then
  ok "preview: a bare <node-id> with no rationale previews rather than writing"
else
  no "bare preview (rc=$rc_bare)"; printf '%s\n' "$out_bare"
fi

# ---------------------------------------------------------------------------
# Case 2: a landing write records the boost and the verbatim rationale on main.
# ---------------------------------------------------------------------------
B="$WORK/b"
make_clone "$B" writer-b
out="$(run_bn "$B" tactic-boost-land "$RATIONALE" 2>&1)"; rc=$?
content="$(origin_show tactic-boost-land)"
if [[ $rc -eq 0 ]] \
   && grep -q 'boost: 21' <<<"$content" \
   && grep -qF "$RATIONALE" <<<"$content" \
   && grep -q 'is the top non-exempt candidate' <<<"$out"; then
  ok "landing: attention.boost 21 + verbatim rationale on origin/main, post-land verification passes (exit 0)"
else
  no "landing (rc=$rc)"; printf '%s\n' "$out"; printf '%s\n' "$content"
fi

# ---------------------------------------------------------------------------
# Case 3: a write invocation without a rationale is refused (exit 2).
# ---------------------------------------------------------------------------
# A bare <node-id> is the documented preview form (case 1), so the missing
# rationale has to be reached with a write flag present: `--boost 5` with no
# rationale hits boost-node.ts's mandatory-rationale gate. Exit 2, nothing
# written anywhere.
C="$WORK/c"
make_clone "$C" writer-c
before_sha="$(origin_sha)"
out="$(run_bn "$C" --boost 5 tactic-boost-usage 2>&1)"; rc=$?
porcelain="$(git -C "$C" status --porcelain -- intentions/)"
if [[ $rc -eq 2 ]] \
   && grep -q 'rationale is mandatory' <<<"$out" \
   && [[ "$(origin_sha)" == "$before_sha" ]] \
   && [[ -z "$porcelain" ]]; then
  ok "missing rationale on a write: exit 2, origin/main unchanged, no working-tree residue"
else
  no "missing rationale (rc=$rc porcelain='$porcelain')"; printf '%s\n' "$out"
fi

# ---------------------------------------------------------------------------
# Case 4: a stale --base pin refuses before any mutation (exit 3).
# ---------------------------------------------------------------------------
# Capture the pin, land a boost on the SAME node (advancing origin/main's blob
# for it), then re-use the now-stale pin. The pin check runs before the
# origin/main refresh overwrites the local file, so there is nothing to roll
# back: assert exit 3, origin/main byte-unchanged, and an empty local diff.
D="$WORK/d"
make_clone "$D" writer-d
pin="$(git -C "$ORIGIN" rev-parse main:intentions/tactic-boost-stale.md)"
out_match="$(run_bn "$D" --base "$pin" tactic-boost-stale "$RATIONALE" 2>&1)"; rc_match=$?

before_sha="$(origin_sha)"
out_stale="$(run_bn "$D" --base "$pin" tactic-boost-stale 'second rationale' 2>&1)"; rc_stale=$?
diff_after="$(git -C "$D" diff -- intentions/tactic-boost-stale.md)"
if [[ $rc_match -eq 0 ]] \
   && [[ $rc_stale -eq 3 ]] \
   && grep -q 'stale-diagnosis' <<<"$out_stale" \
   && [[ "$(origin_sha)" == "$before_sha" ]] \
   && [[ -z "$diff_after" ]]; then
  ok "--base pin: a matching pin lands normally (exit 0); a stale pin refuses before any mutation (exit 3, main unchanged, no local diff)"
else
  no "--base pin (rc_match=$rc_match rc_stale=$rc_stale)"
  printf 'match: %s\n' "$out_match"; printf 'stale: %s\n' "$out_stale"
  printf 'diff: %s\n' "$diff_after"
fi

# ---------------------------------------------------------------------------
# Case 5: a graph-commit failure rolls the attention write back byte-identically.
# ---------------------------------------------------------------------------
# graph-commit is swapped for a stub that unconditionally fails — boost-node.ts's
# real write still runs and lands on disk first, so MUTATED=1 is genuinely
# reached. What is under test is boost-node's OWN trap-based rollback, not
# graph-commit's internals (test-graph-commit.sh covers those). Assert
# byte-identical restore via an EMPTY `git diff` against the clone's HEAD, not
# merely "the file exists". graph-commit is untracked-after-overwrite only in
# the sense that the stub replaces a tracked file, but the stub never runs
# graph-commit's assert_clean_outside_ids guard, so no commit is needed.
E="$WORK/e"
make_clone "$E" writer-e
cat >"$E/packages/intentionsutil/scripts/graph-commit" <<'SH'
#!/usr/bin/env bash
echo "graph-commit stub: simulated post-mutation failure" >&2
exit 1
SH
chmod +x "$E/packages/intentionsutil/scripts/graph-commit"
before_sha="$(origin_sha)"
out="$(run_bn "$E" tactic-boost-rollback "$RATIONALE" 2>&1)"; rc=$?
diff_after="$(git -C "$E" diff -- intentions/tactic-boost-rollback.md)"
if [[ $rc -eq 1 ]] \
   && grep -q 'attention write was rolled back' <<<"$out" \
   && [[ -z "$diff_after" ]] \
   && [[ "$(origin_sha)" == "$before_sha" ]]; then
  ok "byte-identical rollback: a graph-commit failure restores intentions/<id>.md exactly (git diff empty), main unchanged"
else
  no "byte-identical rollback (rc=$rc)"
  printf '%s\n' "$out"; printf 'diff: %s\n' "$diff_after"
fi

# ---------------------------------------------------------------------------
# Case 6: a boost needing rule 18's ACK is refused without --ack (exit 4).
# ---------------------------------------------------------------------------
# `--include-exempt` puts tactic-mh-child (rank 29, main-health-derived) back
# into the contest, so topping the list needs a boost of 30 — at or above
# strategy-main-health's dominant boost of 25, which validateGraph rule 18
# refuses without the acknowledgement clause. boost-node.ts exits 4 and this
# wrapper propagates it verbatim, landing nothing.
F="$WORK/f"
make_clone "$F" writer-f
before_sha="$(origin_sha)"
out="$(run_bn "$F" --include-exempt tactic-boost-ack "$RATIONALE" 2>&1)"; rc=$?
diff_after="$(git -C "$F" diff -- intentions/tactic-boost-ack.md)"
if [[ $rc -eq 4 ]] \
   && grep -q 'Pass --ack' <<<"$out" \
   && [[ "$(origin_sha)" == "$before_sha" ]] \
   && [[ -z "$diff_after" ]]; then
  ok "rule-18 ACK gate: a boost matching/exceeding main-health's dominant boost is refused without --ack (exit 4), nothing written"
else
  no "rule-18 ACK gate (rc=$rc)"
  printf '%s\n' "$out"; printf 'diff: %s\n' "$diff_after"
fi

echo
echo "passed: $PASS  failed: $FAIL"
[[ $FAIL -eq 0 ]] || exit 1
exit 0
