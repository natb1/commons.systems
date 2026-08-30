#!/usr/bin/env bash
#
# test-hold-node.sh — functional harness for `hold-node`, the LANDING half of
# the mechanical-hold primitive (tactic-mechanical-park-producers unit 2).
#
# Mirrors test-park-node.sh's setup: a throwaway bare origin plus per-case
# writer clones, with the scripts under test copied into each clone at their
# real repo-relative paths so their SCRIPT_DIR/REPO_ROOT resolution points at
# the scratch clone. Unlike test-park-node.sh's npx shims, the DECISION and the
# WRITES here run for real (hold-node-decide.ts, write-node.ts, dump-node.ts,
# and the real store/schema under packages/intentionsutil/src) — only
# `graph-commit` is stubbed, by a recorder that logs its argv one arg per line
# (and can be told to fail) so the landing call itself is asserted rather than
# performed. `node_modules` is a SYMLINK to this repo's own (read-only, never
# written) so `node --import tsx/esm` resolves tsx and the `yaml` package.
#
# THE LOAD-BEARING INVARIANT — asserted separately for EVERY disposition below
# via assert_source_unparked(): a mechanical retry state must NEVER park the
# SOURCE node. `office_hours` on the source stays `null` whether the hold is
# born fresh, re-entered, or reopened. If a future diff makes hold-node write
# the source's office_hours, four separate named cases here go red.
#
# Covers:
#   1. Born-fresh (NONE): the hold node is created born-parked with a single-H1
#      body (no leftover `# <statement>` placeholder), the source gains the
#      blocked_by edge, and BOTH ids go to ONE graph-commit call.
#   2. --base tokens are emitted only for files that PRE-EXISTED on origin/main:
#      the source yes, a born-fresh hold no.
#   3. Idempotent re-entry: with the edge already in blocked_by, it is not
#      duplicated (and the source is not even passed to graph-commit, since
#      nothing about it changed).
#   4. EXISTING: the occurrence stanza is APPENDED — the existing body survives
#      verbatim and no second frontmatter block appears.
#   5. REOPENED: a hold at `phase: done` is reset to `phase: null` and re-parked
#      with a fresh office_hours record, existing body preserved + appended to.
#   6. A failing graph-commit rolls BOTH files back: the source is restored
#      byte-identically and the born-fresh hold file is deleted, leaving no
#      dirty intentions/*.md at all.
#   7. Usage errors (missing --kind) exit 2 without touching anything.
#
# Needs bash, git, jq, and a real `node` (the decision and the writers are the
# real TypeScript, not shims). No network.

set -uo pipefail

HARNESS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REAL_REPO_ROOT="$(cd "$HARNESS_DIR/../../.." && pwd)"
HN_SCRIPT="$HARNESS_DIR/hold-node"
for f in hold-node hold-node-decide.ts write-node.ts dump-node.ts; do
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

TODAY="$(date -u +%Y-%m-%d)"

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
for f in hold-node hold-node-decide.ts write-node.ts dump-node.ts; do
  cp "$HARNESS_DIR/$f" "$SEED/packages/intentionsutil/scripts/$f"
done
chmod +x "$SEED/packages/intentionsutil/scripts/hold-node"
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

seed_hold() { # <id> <phase-yaml: null|done>
  cat >"$SEED/intentions/$1.md" <<NODE
---
id: $1
kind: tactic
statement: 'hold: pre-existing harness hold $1'
owner: ai
status: codified
serves:
  - strategy-harness
phase: $2
office_hours:
  reason: pre-existing hold reason
  since: 2020-01-01
  recommendation: pre-existing hold recommendation
attributes:
  hold_for: harness
  hold_kind: provision-conflict
---
# hold: pre-existing harness hold

ORIGINAL-HOLD-BODY-MARKER
NODE
}

seed_source tactic-src-a
seed_source tactic-src-b '[tactic-hold-conflict-src-b]'
seed_hold tactic-hold-conflict-src-b null
seed_source tactic-src-c
seed_hold tactic-hold-conflict-src-c null
seed_source tactic-src-d
seed_hold tactic-hold-conflict-src-d done
seed_source tactic-src-e
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
printf 'the merge retry hit a moving main three times\n' >"$WORK/reason.txt"
printf 'rebase the branch by hand, then clear this hold\n' >"$WORK/recommendation.txt"

run_hn() { # <clone> <gc-log> <gc-exit> [hold-node args...]
  local clone="$1" gclog="$2" gcexit="$3"; shift 3
  (
    cd "$clone" || exit 99
    export GC_LOG="$gclog" GC_EXIT="$gcexit"
    bash packages/intentionsutil/scripts/hold-node "$@"
  )
}

hold_args=(--kind provision-conflict
           --reason-file "$WORK/reason.txt"
           --recommendation-file "$WORK/recommendation.txt")

# --- THE load-bearing assertion, applied per disposition ---------------------
# hold-node must NEVER park the source. `office_hours: null` must still be the
# source's record after the run, and no office_hours sub-keys may have appeared.
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
# Case 1+2: born-fresh hold + edge landed in ONE commit; --base only for the
# pre-existing source, not for the born-fresh hold.
# ---------------------------------------------------------------------------
A="$WORK/a"; make_clone "$A" writer-a
GCLOG_A="$WORK/gclog-a"
out="$(run_hn "$A" "$GCLOG_A" 0 tactic-src-a "${hold_args[@]}" 2>&1)"; rc=$?
HOLD_A=tactic-hold-conflict-src-a
hold_md="$A/intentions/$HOLD_A.md"
src_json="$(cd "$A" && node --import tsx/esm -e '
  const { readNode } = await import("./packages/intentionsutil/src/store.js");
  process.stdout.write(JSON.stringify(readNode("intentions", process.argv[1])));
' tactic-src-a 2>/dev/null)"
h1_count="$(grep -c '^# ' "$hold_md" 2>/dev/null)"
if [[ $rc -eq 0 ]] \
   && grep -qx "held $HOLD_A (NONE)" <<<"$out" \
   && [[ -f "$hold_md" ]] \
   && [[ "$h1_count" == 1 ]] \
   && grep -q 'reason: the merge retry hit a moving main three times' "$hold_md" \
   && grep -q "since: $TODAY" "$hold_md" \
   && [[ "$(jq -r '.blocked_by | join(",")' <<<"$src_json")" == "$HOLD_A" ]] \
   && grep -qx 'tactic-src-a' "$GCLOG_A" \
   && grep -qx "$HOLD_A" "$GCLOG_A"; then
  ok "born-fresh hold: node born-parked with a single-H1 body, edge added, both ids in ONE graph-commit"
else
  no "born-fresh hold (rc=$rc h1=$h1_count)"
  printf '%s\n' "$out"; printf '%s\n' "$src_json"; cat "$GCLOG_A" 2>/dev/null
fi

if grep -q "^tactic-src-a=" "$GCLOG_A" && ! grep -q "^$HOLD_A=" "$GCLOG_A"; then
  ok "--base tokens: present for the pre-existing source, ABSENT for the born-fresh hold"
else
  no "--base token selection"; cat "$GCLOG_A"
fi

assert_source_unparked "$A" tactic-src-a NONE

# ---------------------------------------------------------------------------
# Case 3: idempotent re-entry — the edge already in blocked_by is not
# duplicated, and the unchanged source is not even sent to graph-commit.
# ---------------------------------------------------------------------------
B="$WORK/b"; make_clone "$B" writer-b
GCLOG_B="$WORK/gclog-b"
out="$(run_hn "$B" "$GCLOG_B" 0 tactic-src-b "${hold_args[@]}" 2>&1)"; rc=$?
HOLD_B=tactic-hold-conflict-src-b
src_json="$(cd "$B" && node --import tsx/esm -e '
  const { readNode } = await import("./packages/intentionsutil/src/store.js");
  process.stdout.write(JSON.stringify(readNode("intentions", process.argv[1])));
' tactic-src-b 2>/dev/null)"
edge_count="$(jq -r --arg h "$HOLD_B" '[.blocked_by[] | select(. == $h)] | length' <<<"$src_json")"
if [[ $rc -eq 0 ]] \
   && grep -qx "held $HOLD_B (EXISTING)" <<<"$out" \
   && [[ "$edge_count" == 1 ]] \
   && ! grep -qx 'tactic-src-b' "$GCLOG_B" \
   && grep -qx "$HOLD_B" "$GCLOG_B" \
   && grep -q "^$HOLD_B=" "$GCLOG_B"; then
  ok "idempotent re-entry: blocked_by edge not duplicated, unchanged source omitted from the commit, pre-existing hold gets a --base token"
else
  no "idempotent re-entry (rc=$rc edge_count=$edge_count)"
  printf '%s\n' "$out"; printf '%s\n' "$src_json"; cat "$GCLOG_B"
fi

assert_source_unparked "$B" tactic-src-b EXISTING-idempotent

# ---------------------------------------------------------------------------
# Case 4: EXISTING — the occurrence stanza is APPENDED, never replacing.
# ---------------------------------------------------------------------------
C="$WORK/c"; make_clone "$C" writer-c
GCLOG_C="$WORK/gclog-c"
out="$(run_hn "$C" "$GCLOG_C" 0 tactic-src-c "${hold_args[@]}" 2>&1)"; rc=$?
HOLD_C=tactic-hold-conflict-src-c
hold_md="$C/intentions/$HOLD_C.md"
fence_count="$(grep -c '^---$' "$hold_md" 2>/dev/null)"
if [[ $rc -eq 0 ]] \
   && grep -qx "held $HOLD_C (EXISTING)" <<<"$out" \
   && grep -q 'ORIGINAL-HOLD-BODY-MARKER' "$hold_md" \
   && grep -q "^## Occurrence $TODAY" "$hold_md" \
   && [[ "$fence_count" == 2 ]] \
   && grep -q 'since: 2020-01-01' "$hold_md"; then
  ok "EXISTING: occurrence stanza appended, original body preserved, office_hours.since NOT refreshed, one frontmatter block"
else
  no "EXISTING body-append (rc=$rc fences=$fence_count)"
  printf '%s\n' "$out"; cat "$hold_md" 2>/dev/null
fi

assert_source_unparked "$C" tactic-src-c EXISTING

# ---------------------------------------------------------------------------
# Case 5: REOPENED — a resolved (phase: done) hold is reset to phase null and
# re-parked with a fresh office_hours record.
# ---------------------------------------------------------------------------
D="$WORK/d"; make_clone "$D" writer-d
GCLOG_D="$WORK/gclog-d"
out="$(run_hn "$D" "$GCLOG_D" 0 tactic-src-d "${hold_args[@]}" 2>&1)"; rc=$?
HOLD_D=tactic-hold-conflict-src-d
hold_md="$D/intentions/$HOLD_D.md"
hold_json="$(cd "$D" && node --import tsx/esm -e '
  const { readNode } = await import("./packages/intentionsutil/src/store.js");
  process.stdout.write(JSON.stringify(readNode("intentions", process.argv[1])));
' "$HOLD_D" 2>/dev/null)"
if [[ $rc -eq 0 ]] \
   && grep -qx "held $HOLD_D (REOPENED)" <<<"$out" \
   && [[ "$(jq -r '.phase' <<<"$hold_json")" == "null" ]] \
   && [[ "$(jq -r '.office_hours.since' <<<"$hold_json")" == "$TODAY" ]] \
   && [[ "$(jq -r '.office_hours.reason' <<<"$hold_json")" == "the merge retry hit a moving main three times" ]] \
   && grep -q 'ORIGINAL-HOLD-BODY-MARKER' "$hold_md" \
   && grep -q 'reopened' "$hold_md"; then
  ok "REOPENED: phase reset to null, fresh office_hours park, body preserved and appended to"
else
  no "REOPENED (rc=$rc)"; printf '%s\n' "$out"; printf '%s\n' "$hold_json"
fi

assert_source_unparked "$D" tactic-src-d REOPENED

# ---------------------------------------------------------------------------
# Case 6: a failing graph-commit rolls BOTH files back — no leftover mutation.
# ---------------------------------------------------------------------------
E="$WORK/e"; make_clone "$E" writer-e
GCLOG_E="$WORK/gclog-e"
out="$(run_hn "$E" "$GCLOG_E" 1 tactic-src-e "${hold_args[@]}" 2>&1)"; rc=$?
status_after="$(git -C "$E" status --porcelain -- intentions/)"
if [[ $rc -eq 1 ]] \
   && grep -q 'rolled back' <<<"$out" \
   && [[ -z "$status_after" ]] \
   && [[ ! -e "$E/intentions/tactic-hold-conflict-src-e.md" ]]; then
  ok "graph-commit failure: source restored byte-identically and the born-fresh hold deleted (git status clean)"
else
  no "rollback on graph-commit failure (rc=$rc)"
  printf '%s\n' "$out"; printf 'status: %s\n' "$status_after"
fi

# ---------------------------------------------------------------------------
# Case 7: usage error (missing --kind) exits 2 and touches nothing.
# ---------------------------------------------------------------------------
F="$WORK/f"; make_clone "$F" writer-f
GCLOG_F="$WORK/gclog-f"
out="$(run_hn "$F" "$GCLOG_F" 0 tactic-src-f \
        --reason-file "$WORK/reason.txt" \
        --recommendation-file "$WORK/recommendation.txt" 2>&1)"; rc=$?
status_after="$(git -C "$F" status --porcelain -- intentions/)"
if [[ $rc -eq 2 ]] && grep -q 'usage: hold-node' <<<"$out" && [[ -z "$status_after" ]]; then
  ok "usage error (missing --kind): exit 2, nothing written"
else
  no "usage error (rc=$rc)"; printf '%s\n' "$out"; printf 'status: %s\n' "$status_after"
fi

echo
echo "passed: $PASS  failed: $FAIL"
[[ $FAIL -eq 0 ]] || exit 1
exit 0
