#!/usr/bin/env bash
#
# test-arm-wait.sh — functional harness for `arm-wait`, the LANDING half of the
# tracked-wait primitive (tactic-wait-calendar-release unit 6).
#
# Mirrors test-hold-node.sh's setup exactly: a throwaway bare origin plus a seed
# clone that pushes the fixture nodes, then per-case writer clones with the
# scripts under test copied in at their real repo-relative paths so their
# SCRIPT_DIR/REPO_ROOT resolution points at the scratch clone. The DECISION and
# the WRITES run for real (wait-node-decide.ts, write-node.ts, dump-node.ts and
# the real store/schema under packages/intentionsutil/src) — only `graph-commit`
# is stubbed, by a recorder that logs its argv one arg per line (and can be told
# to fail via GC_EXIT) so the landing call itself is asserted rather than
# performed. `node_modules` is a SYMLINK to this repo's own (read-only, never
# written) so `node --import tsx/esm` resolves tsx and the `yaml` package.
#
# THE LOAD-BEARING INVARIANT — asserted separately for EVERY disposition below
# via assert_source_unparked(): a WAIT is a mechanical retry state and must
# NEVER park the SOURCE node. `office_hours` on the source stays `null` whether
# the wait is born fresh, re-armed, or extended.
#
# Covers:
#   1. Fresh mint (NONE): the wait node is born UNPARKED (office_hours null,
#      phase null) with a single-H1 body carrying WAIT_RELEASE_SENTENCE and the
#      right attributes.*, the source gains the blocked_by edge, and BOTH ids go
#      to ONE graph-commit call.
#   2. --base tokens are emitted only for files that PRE-EXISTED on origin/main:
#      the source yes, a born-fresh wait no.
#   3. REARM (a wait at `phase: done`): wait_attempts increments, phase resets to
#      null, wait_until/wait_reason/wait_recommendation are refreshed, the
#      existing body survives verbatim with a `## Arm` stanza appended, and the
#      source's already-present blocked_by edge is neither duplicated nor
#      re-sent to graph-commit.
#   4. EXTEND (a wait still armed at `phase: null`): wait_attempts does NOT
#      increment, only wait_until changes, and a `## Extend` stanza is appended.
#   5. A wait node carrying a cap-park `office_hours` refuses: non-zero exit,
#      nothing written, a clear error naming the park.
#   6. A failing graph-commit rolls BOTH files back: the source is restored
#      byte-identically and the born-fresh wait file is deleted, leaving no
#      dirty intentions/*.md at all.
#   7. Usage error (missing --until) exits 2 without touching anything.
#   8. An --until beyond WAIT_MAX_HORIZON_DAYS (src/waits.ts) is refused: exit 2,
#      no wait node, no edge, no graph-commit.
#
# Needs bash, git, jq, and a real `node` (the decision and the writers are the
# real TypeScript, not shims). No network.

set -uo pipefail

HARNESS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REAL_REPO_ROOT="$(cd "$HARNESS_DIR/../../.." && pwd)"
for f in arm-wait wait-node-decide.ts write-node.ts dump-node.ts; do
  [[ -f "$HARNESS_DIR/$f" ]] || { echo "error: $f not found at $HARNESS_DIR/$f" >&2; exit 1; }
done
command -v jq >/dev/null || { echo "error: jq not found" >&2; exit 1; }
command -v node >/dev/null || { echo "error: node not found" >&2; exit 1; }

WORK="$(mktemp -d)" || { echo "error: mktemp failed" >&2; exit 1; }
harness_cleanup() { rm -rf "$WORK"; }
trap harness_cleanup EXIT

PASS=0; FAIL=0
ok() { echo "PASS: $1"; PASS=$((PASS + 1)); }
no() { echo "FAIL: $1"; FAIL=$((FAIL + 1)); }

# A RELATIVE instant, not a fixed far-future one: wait-node-decide.ts refuses an
# `--until` more than WAIT_MAX_HORIZON_DAYS (src/waits.ts) past now, because a
# wait armed beyond that horizon never comes due and so never reaches the
# attempt cap. Seven days is comfortably inside it and stays inside it forever,
# unlike a hard-coded date.
UNTIL="$(date -u -d '+7 days' +%Y-%m-%dT%H:%M:%SZ)" \
  || { echo "error: date -u -d '+7 days' failed (GNU date required)" >&2; exit 1; }
# Beyond the horizon — used by case 8 to assert the refusal.
UNTIL_BEYOND_HORIZON="2099-03-04T05:06:07Z"
# The load-bearing closing sentence every born-fresh WAIT body must end with
# (src/waits.ts's WAIT_RELEASE_SENTENCE — a prefix of it is enough to assert).
RELEASE_SENTENCE_HEAD='the tick sweep releases this node to `phase: done` when `attributes.wait_until`'

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
for f in arm-wait wait-node-decide.ts write-node.ts dump-node.ts; do
  cp "$HARNESS_DIR/$f" "$SEED/packages/intentionsutil/scripts/$f"
done
chmod +x "$SEED/packages/intentionsutil/scripts/arm-wait"
# The real store/schema: every file under src/ is a same-package relative
# import (only the npm "yaml" package is external, resolved via the
# node_modules symlink each clone gets), so a blanket copy is simplest.
cp -r "$REAL_REPO_ROOT/packages/intentionsutil/src/." "$SEED/packages/intentionsutil/src/"
# "type": "module" — without it Node defaults .ts/.js resolution to CommonJS and
# tsx's ESM loader breaks.
cp "$REAL_REPO_ROOT/packages/intentionsutil/package.json" "$SEED/packages/intentionsutil/package.json"

# graph-commit STUB: records argv one arg per line into $GC_LOG and exits
# $GC_EXIT (default 0). It never commits, so each case asserts on the clone's
# working tree plus this log.
cat >"$SEED/packages/intentionsutil/scripts/graph-commit" <<'SH'
#!/usr/bin/env bash
: >"${GC_LOG:?GC_LOG must be set}"
for a in "$@"; do printf '%s\n' "$a" >>"$GC_LOG"; done
exit "${GC_EXIT:-0}"
SH
chmod +x "$SEED/packages/intentionsutil/scripts/graph-commit"

seed_source() { # <id> [blocked_by-yaml-inline]
  cat >"$SEED/intentions/$1.md" <<NODE
---
id: $1
kind: tactic
statement: harness source node $1
owner: ai
status: codified
serves:
  - strategy-harness
phase: implement
blocked_by: ${2:-[]}
office_hours: null
---
# harness source node $1

Original source body line.
NODE
}

seed_wait() { # <id> <wait_for> <phase-yaml: null|done> <wait_attempts> <office_hours-yaml-block-or-null>
  cat >"$SEED/intentions/$1.md" <<NODE
---
id: $1
kind: tactic
statement: 'wait: pre-existing harness wait $1'
owner: ai
status: codified
serves:
  - strategy-harness
phase: $3
office_hours: ${5:-null}
attributes:
  wait_for: $2
  wait_until: 2026-01-02T03:04:05Z
  wait_attempts: $4
  wait_reason: seeded wait reason
  wait_recommendation: seeded wait recommendation
---
# wait: $2

ORIGINAL-WAIT-BODY-MARKER
NODE
}

# a: fresh mint (no wait node)                                       -> NONE
seed_source tactic-src-a
# b: released wait, edge already present                             -> REARM
seed_source tactic-src-b '[tactic-wait-src-b]'
seed_wait tactic-wait-src-b tactic-src-b done 2
# c: still-armed wait, edge already present                          -> EXTEND
seed_source tactic-src-c '[tactic-wait-src-c]'
seed_wait tactic-wait-src-c tactic-src-c null 2
# d: parked (cap-fired) wait                                         -> refusal
seed_source tactic-src-d '[tactic-wait-src-d]'
cat >"$WORK/parked-oh.yaml" <<'OH'

  reason: attempt cap exhausted
  since: 2026-01-01
  recommendation: decide whether the verdict is ever observable
OH
seed_wait tactic-wait-src-d tactic-src-d null 4 "$(cat "$WORK/parked-oh.yaml")"
# e: fresh mint whose graph-commit fails                             -> rollback
seed_source tactic-src-e
# f: usage error
seed_source tactic-src-f

git -C "$SEED" add -A
git -C "$SEED" commit -qm seed
git -C "$SEED" push -q origin main

make_clone() { # <dst> <identity>
  git clone -q "$ORIGIN" "$1"
  git -C "$1" config user.email "$2@test"
  git -C "$1" config user.name "$2"
  # Untracked symlink — exempt from any '??' guard, read-only, never written.
  ln -s "$REAL_REPO_ROOT/node_modules" "$1/node_modules"
}

# --- Reason / recommendation input files -------------------------------------
printf 'the QA verdict is not observable until the batch window closes\n' >"$WORK/reason.txt"
printf 'recheck the deployed run log after the window, then re-plan or release\n' >"$WORK/recommendation.txt"

run_aw() { # <clone> <gc-log> <gc-exit> [arm-wait args...]
  local clone="$1" gclog="$2" gcexit="$3"; shift 3
  (
    cd "$clone" || exit 99
    export GC_LOG="$gclog" GC_EXIT="$gcexit"
    bash packages/intentionsutil/scripts/arm-wait "$@"
  )
}

read_node_json() { # <clone> <id>
  (cd "$1" && node --import tsx/esm -e '
    const { readNode } = await import("./packages/intentionsutil/src/store.js");
    process.stdout.write(JSON.stringify(readNode("intentions", process.argv[1])));
  ' "$2" 2>/dev/null)
}

arm_args=(--until "$UNTIL"
          --reason-file "$WORK/reason.txt"
          --recommendation-file "$WORK/recommendation.txt")

# --- THE load-bearing assertion, applied per disposition ---------------------
assert_source_unparked() { # <clone> <source-id> <disposition-label>
  local f="$1/intentions/$2.md"
  if grep -qx 'office_hours: null' "$f" \
     && ! grep -q '^office_hours:$' "$f"; then
    ok "source office_hours stays null ($3 disposition) — the source is NEVER parked"
  else
    no "source office_hours stays null ($3 disposition) — THE SOURCE WAS PARKED"
    sed -n '1,40p' "$f"
  fi
}

# ---------------------------------------------------------------------------
# Case 1+2: fresh mint (NONE) — born-unparked wait + edge landed in ONE commit;
# --base only for the pre-existing source, not for the born-fresh wait.
# ---------------------------------------------------------------------------
A="$WORK/a"; make_clone "$A" writer-a
GCLOG_A="$WORK/gclog-a"
out="$(run_aw "$A" "$GCLOG_A" 0 tactic-src-a "${arm_args[@]}" 2>&1)"; rc=$?
WAIT_A=tactic-wait-src-a
wait_md="$A/intentions/$WAIT_A.md"
wait_json="$(read_node_json "$A" "$WAIT_A")"
src_json="$(read_node_json "$A" tactic-src-a)"
h1_count="$(grep -c '^# ' "$wait_md" 2>/dev/null)"
if [[ $rc -eq 0 ]] \
   && grep -qx "armed $WAIT_A (NONE)" <<<"$out" \
   && [[ -f "$wait_md" ]] \
   && [[ "$h1_count" == 1 ]] \
   && grep -qF "$RELEASE_SENTENCE_HEAD" "$wait_md" \
   && [[ "$(jq -r '.phase' <<<"$wait_json")" == "null" ]] \
   && [[ "$(jq -r '.office_hours' <<<"$wait_json")" == "null" ]] \
   && [[ "$(jq -r '.attributes.wait_for' <<<"$wait_json")" == "tactic-src-a" ]] \
   && [[ "$(jq -r '.attributes.wait_until' <<<"$wait_json")" == "$UNTIL" ]] \
   && [[ "$(jq -r '.attributes.wait_attempts' <<<"$wait_json")" == "1" ]] \
   && [[ "$(jq -r '.attributes.wait_reason' <<<"$wait_json")" == "the QA verdict is not observable until the batch window closes" ]] \
   && [[ "$(jq -r '.attributes.wait_recommendation' <<<"$wait_json")" == "recheck the deployed run log after the window, then re-plan or release" ]] \
   && [[ "$(jq -r '.blocked_by | join(",")' <<<"$src_json")" == "$WAIT_A" ]] \
   && grep -qx 'tactic-src-a' "$GCLOG_A" \
   && grep -qx "$WAIT_A" "$GCLOG_A"; then
  ok "fresh mint (NONE): wait born unparked with a single-H1 release-sentence body and correct attributes, edge added, both ids in ONE graph-commit"
else
  no "fresh mint (NONE) (rc=$rc h1=$h1_count)"
  printf '%s\n' "$out"; printf '%s\n' "$wait_json"; printf '%s\n' "$src_json"; cat "$GCLOG_A" 2>/dev/null
fi

if grep -q "^tactic-src-a=" "$GCLOG_A" && ! grep -q "^$WAIT_A=" "$GCLOG_A"; then
  ok "--base tokens: present for the pre-existing source, ABSENT for the born-fresh wait"
else
  no "--base token selection"; cat "$GCLOG_A"
fi

assert_source_unparked "$A" tactic-src-a NONE

# ---------------------------------------------------------------------------
# Case 3: REARM — a released (phase: done) wait re-arms in place.
# ---------------------------------------------------------------------------
B="$WORK/b"; make_clone "$B" writer-b
GCLOG_B="$WORK/gclog-b"
out="$(run_aw "$B" "$GCLOG_B" 0 tactic-src-b "${arm_args[@]}" 2>&1)"; rc=$?
WAIT_B=tactic-wait-src-b
wait_md="$B/intentions/$WAIT_B.md"
wait_json="$(read_node_json "$B" "$WAIT_B")"
src_json="$(read_node_json "$B" tactic-src-b)"
edge_count="$(jq -r --arg w "$WAIT_B" '[.blocked_by[] | select(. == $w)] | length' <<<"$src_json")"
fence_count="$(grep -c '^---$' "$wait_md" 2>/dev/null)"
if [[ $rc -eq 0 ]] \
   && grep -qx "armed $WAIT_B (REARM)" <<<"$out" \
   && [[ "$(jq -r '.attributes.wait_attempts' <<<"$wait_json")" == "3" ]] \
   && [[ "$(jq -r '.phase' <<<"$wait_json")" == "null" ]] \
   && [[ "$(jq -r '.attributes.wait_until' <<<"$wait_json")" == "$UNTIL" ]] \
   && [[ "$(jq -r '.attributes.wait_reason' <<<"$wait_json")" == "the QA verdict is not observable until the batch window closes" ]] \
   && [[ "$(jq -r '.attributes.wait_recommendation' <<<"$wait_json")" == "recheck the deployed run log after the window, then re-plan or release" ]] \
   && [[ "$(jq -r '.attributes.wait_for' <<<"$wait_json")" == "tactic-src-b" ]] \
   && grep -q 'ORIGINAL-WAIT-BODY-MARKER' "$wait_md" \
   && grep -q '^## Arm ' "$wait_md" \
   && [[ "$fence_count" == 2 ]] \
   && [[ "$edge_count" == 1 ]] \
   && ! grep -qx 'tactic-src-b' "$GCLOG_B" \
   && grep -qx "$WAIT_B" "$GCLOG_B" \
   && grep -q "^$WAIT_B=" "$GCLOG_B"; then
  ok "REARM: wait_attempts incremented, phase reset to null, attributes refreshed, body preserved + '## Arm' appended, edge untouched, pre-existing wait gets a --base token"
else
  no "REARM (rc=$rc attempts=$(jq -r '.attributes.wait_attempts' <<<"$wait_json") edge_count=$edge_count fences=$fence_count)"
  printf '%s\n' "$out"; printf '%s\n' "$wait_json"; cat "$GCLOG_B" 2>/dev/null
fi

assert_source_unparked "$B" tactic-src-b REARM

# ---------------------------------------------------------------------------
# Case 4: EXTEND — a still-armed wait's wait_until is pushed out. NOT a new
# attempt, so wait_attempts must NOT move.
# ---------------------------------------------------------------------------
C="$WORK/c"; make_clone "$C" writer-c
GCLOG_C="$WORK/gclog-c"
out="$(run_aw "$C" "$GCLOG_C" 0 tactic-src-c "${arm_args[@]}" 2>&1)"; rc=$?
WAIT_C=tactic-wait-src-c
wait_md="$C/intentions/$WAIT_C.md"
wait_json="$(read_node_json "$C" "$WAIT_C")"
if [[ $rc -eq 0 ]] \
   && grep -qx "armed $WAIT_C (EXTEND)" <<<"$out" \
   && [[ "$(jq -r '.attributes.wait_attempts' <<<"$wait_json")" == "2" ]] \
   && [[ "$(jq -r '.attributes.wait_until' <<<"$wait_json")" == "$UNTIL" ]] \
   && [[ "$(jq -r '.attributes.wait_reason' <<<"$wait_json")" == "seeded wait reason" ]] \
   && [[ "$(jq -r '.phase' <<<"$wait_json")" == "null" ]] \
   && grep -q 'ORIGINAL-WAIT-BODY-MARKER' "$wait_md" \
   && grep -q '^## Extend ' "$wait_md" \
   && ! grep -q '^## Arm ' "$wait_md"; then
  ok "EXTEND: only wait_until changed (wait_attempts and wait_reason untouched), '## Extend' stanza appended"
else
  no "EXTEND (rc=$rc)"; printf '%s\n' "$out"; printf '%s\n' "$wait_json"
fi

assert_source_unparked "$C" tactic-src-c EXTEND

# ---------------------------------------------------------------------------
# Case 5: a wait carrying a cap-park office_hours refuses — nothing written.
# ---------------------------------------------------------------------------
D="$WORK/d"; make_clone "$D" writer-d
GCLOG_D="$WORK/gclog-d"
out="$(run_aw "$D" "$GCLOG_D" 0 tactic-src-d "${arm_args[@]}" 2>&1)"; rc=$?
status_after="$(git -C "$D" status --porcelain -- intentions/)"
if [[ $rc -ne 0 ]] \
   && grep -q 'office_hours' <<<"$out" \
   && [[ -z "$status_after" ]] \
   && [[ ! -s "$GCLOG_D" ]]; then
  ok "parked wait: re-arm refused (non-zero exit, clear office_hours error), nothing written, no graph-commit"
else
  no "parked-wait refusal (rc=$rc)"; printf '%s\n' "$out"; printf 'status: %s\n' "$status_after"
fi

# ---------------------------------------------------------------------------
# Case 6: a failing graph-commit rolls BOTH files back — no leftover mutation.
# ---------------------------------------------------------------------------
E="$WORK/e"; make_clone "$E" writer-e
GCLOG_E="$WORK/gclog-e"
out="$(run_aw "$E" "$GCLOG_E" 1 tactic-src-e "${arm_args[@]}" 2>&1)"; rc=$?
status_after="$(git -C "$E" status --porcelain -- intentions/)"
if [[ $rc -eq 1 ]] \
   && grep -q 'rolled back' <<<"$out" \
   && [[ -z "$status_after" ]] \
   && [[ ! -e "$E/intentions/tactic-wait-src-e.md" ]]; then
  ok "graph-commit failure: source restored byte-identically and the born-fresh wait deleted (git status clean)"
else
  no "rollback on graph-commit failure (rc=$rc)"
  printf '%s\n' "$out"; printf 'status: %s\n' "$status_after"
fi

# ---------------------------------------------------------------------------
# Case 7: usage error (missing --until) exits 2 and touches nothing.
# ---------------------------------------------------------------------------
F="$WORK/f"; make_clone "$F" writer-f
GCLOG_F="$WORK/gclog-f"
out="$(run_aw "$F" "$GCLOG_F" 0 tactic-src-f \
        --reason-file "$WORK/reason.txt" \
        --recommendation-file "$WORK/recommendation.txt" 2>&1)"; rc=$?
status_after="$(git -C "$F" status --porcelain -- intentions/)"
if [[ $rc -eq 2 ]] && grep -q 'usage: arm-wait' <<<"$out" && [[ -z "$status_after" ]]; then
  ok "usage error (missing --until): exit 2, nothing written"
else
  no "usage error (rc=$rc)"; printf '%s\n' "$out"; printf 'status: %s\n' "$status_after"
fi

# ---------------------------------------------------------------------------
# Case 8: an --until beyond the wait horizon refuses — exit 2, nothing written.
# This is the denial-of-work bound: without it, one `arm-wait <victim> --until
# 9999-12-31T23:59:59Z` lands a blocked_by edge that never comes due, so the
# attempt cap never fires and the sweep only ever reports it as `observing`.
# ---------------------------------------------------------------------------
G="$WORK/g"; make_clone "$G" writer-g
GCLOG_G="$WORK/gclog-g"
out="$(run_aw "$G" "$GCLOG_G" 0 tactic-src-a \
        --until "$UNTIL_BEYOND_HORIZON" \
        --reason-file "$WORK/reason.txt" \
        --recommendation-file "$WORK/recommendation.txt" 2>&1)"; rc=$?
status_after="$(git -C "$G" status --porcelain -- intentions/)"
if [[ $rc -eq 2 ]] \
   && grep -q 'days after --now' <<<"$out" \
   && [[ -z "$status_after" ]] \
   && [[ ! -e "$G/intentions/tactic-wait-src-a.md" ]] \
   && [[ ! -s "$GCLOG_G" ]]; then
  ok "over-horizon --until: exit 2 with a clear refusal, no wait node, no edge, no graph-commit"
else
  no "over-horizon --until refusal (rc=$rc)"; printf '%s\n' "$out"; printf 'status: %s\n' "$status_after"
fi

echo
echo "passed: $PASS  failed: $FAIL"
[[ $FAIL -eq 0 ]] || exit 1
exit 0
