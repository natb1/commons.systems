#!/usr/bin/env bash
#
# test-mint-mainqa-nodes.sh — functional harness for `mint-mainqa-nodes`, the
# LANDING half of the main-qa destination-node mint (PR5a units 2+3).
#
# Mirrors test-hold-node.sh's setup (itself modeled on test-park-node.sh): a
# throwaway bare origin plus per-case writer clones, with the scripts under test
# copied into each clone at their real repo-relative paths. The DECISION and the
# WRITES run for real (mint-mainqa-nodes-decide.ts, write-node.ts, and the real
# store/schema/mainqaRouting under packages/intentionsutil/src) — only
# `graph-commit` is stubbed. `node_modules` is a SYMLINK to this repo's own
# (read-only, never written) so `node --import tsx/esm` resolves tsx and `yaml`.
#
# `lib-base-pin.sh` is deliberately NOT copied: mint-mainqa-nodes emits no
# `--base` token at all (every id it commits is born fresh — see that script's
# header) and so never sources it. If a future change gives it a pre-existing id
# to land, copy the library in alongside, as test-park-node.sh does.
#
# The graph-commit STUB is a recorder AND, in its default mode, a real lander:
# it logs argv one arg per line, then genuinely stages/commits/pushes the ids it
# was given, in the repo named by `-C`, to the scratch origin. That matters
# because mint-mainqa-nodes' post-land verification re-reads every node off a
# FRESH origin/main — a log-only stub would make every happy path fail. Its
# other modes reproduce the three landing pathologies the script must catch:
#   GC_MODE=fail    — non-zero exit, nothing committed.
#   GC_MODE=noop    — exit 0 with a `pushed=none … context=noop` verdict.
#   GC_MODE=silent  — exit 0 with a success verdict, having pushed NOTHING.
#
# THE LOAD-BEARING INVARIANTS:
#   - A mint NEVER touches the source node. Its file must be byte-identical
#     before and after (case 6) — the blocked_by edge points destination →
#     source, so there is no source-side edit and no CAS on it.
#   - Ruling R1: a WAIT verifiability mark is a hold ON the machine node, never
#     a third lane (case 4).
#
# Covers:
#   1. Mixed items mint exactly TWO nodes in ONE graph-commit, both ids
#      positional in a single invocation, with an explicit `-C <repo root>`.
#   2. All-machine items mint exactly ONE node (no author file at all).
#   3. All-author items mint exactly ONE node, born parked (office_hours set).
#   4. R1: a WAIT item lands on the MACHINE node.
#   5. Idempotent re-run: with both files already on origin/main, nothing is
#      written, graph-commit is never invoked, and the exit is 0.
#   6. The source node file is byte-identical before and after the mint.
#   7. A failing graph-commit leaves a clean tree (no born-fresh residue).
#   8. A land that reports success but pushes nothing is caught by the post-land
#      re-read and reported non-zero.
#   9. Usage errors (missing --pr) exit 2 without touching anything.
#  11. A later pass carrying a NEW item for a lane whose node already exists is
#      REFUSED (non-zero), the landed node is NOT rewritten, and the tree stays
#      clean — the EXISTING skip is idempotency for the items already recorded,
#      never a licence to drop items /qa-fix Step 6 has stopped escalating.
#
# Needs bash, git, jq, and a real `node`. No network.

set -uo pipefail

HARNESS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REAL_REPO_ROOT="$(cd "$HARNESS_DIR/../../.." && pwd)"
for f in mint-mainqa-nodes mint-mainqa-nodes-decide.ts write-node.ts; do
  [[ -f "$HARNESS_DIR/$f" ]] || { echo "error: $f not found at $HARNESS_DIR/$f" >&2; exit 1; }
done
command -v jq >/dev/null || { echo "error: jq not found" >&2; exit 1; }
command -v node >/dev/null || { echo "error: node not found" >&2; exit 1; }
[[ -d "$REAL_REPO_ROOT/node_modules" ]] || {
  echo "error: $REAL_REPO_ROOT/node_modules not found — run npm install at the repo root first" >&2
  exit 1; }

WORK="$(mktemp -d)" || { echo "error: mktemp failed" >&2; exit 1; }
harness_cleanup() { rm -rf "$WORK"; }
trap harness_cleanup EXIT

PASS=0; FAIL=0
ok() { echo "PASS: $1"; PASS=$((PASS + 1)); }
no() { echo "FAIL: $1"; FAIL=$((FAIL + 1)); }

NOW=2026-08-29
SRC_PR=4242

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
for f in mint-mainqa-nodes mint-mainqa-nodes-decide.ts write-node.ts; do
  cp "$HARNESS_DIR/$f" "$SEED/packages/intentionsutil/scripts/$f"
done
chmod +x "$SEED/packages/intentionsutil/scripts/mint-mainqa-nodes"
# The real store/schema/mainqaRouting: every file under src/ is a same-package
# relative import (only the npm "yaml" package is external, resolved via the
# node_modules symlink each clone gets), so a blanket copy is simplest.
cp -r "$REAL_REPO_ROOT/packages/intentionsutil/src/." "$SEED/packages/intentionsutil/src/"
# "type": "module" — without it Node defaults .ts/.js resolution to CommonJS and
# tsx's ESM loader breaks.
cp "$REAL_REPO_ROOT/packages/intentionsutil/package.json" "$SEED/packages/intentionsutil/package.json"

cat >"$SEED/packages/intentionsutil/scripts/graph-commit" <<'SH'
#!/usr/bin/env bash
# graph-commit STUB — see this harness's header for the modes.
set -uo pipefail
: >"${GC_LOG:?GC_LOG must be set}"
for a in "$@"; do printf '%s\n' "$a" >>"$GC_LOG"; done

REPO=""; MSG="graph-commit stub"; IDS=()
while [[ $# -gt 0 ]]; do
  case "$1" in
    -C|--repo) REPO="${2:-}"; shift 2 ;;
    -m) MSG="${2:-}"; shift 2 ;;
    --base|--expect|--prune) shift 2 ;;
    -*) shift ;;
    *) IDS+=("$1"); shift ;;
  esac
done
[[ -n "$REPO" ]] || REPO="$PWD"

verdict() { # <status> <pushed> <context>
  printf 'graph-commit: verdict: %s ids=%s pushed=%s main=%s context=%s\n' \
    "$1" "$(IFS=,; echo "${IDS[*]}")" "$2" "$2" "$3" >&2
}

land() { # <id>...
  local paths=() id
  for id in "$@"; do paths+=("intentions/$id.md"); done
  git -C "$REPO" add -- "${paths[@]}" || exit 9
  git -C "$REPO" commit -qm "$MSG" || exit 9
  git -C "$REPO" push -q origin HEAD:main || exit 9
}

case "${GC_MODE:-land}" in
  land)
    land "${IDS[@]}"
    verdict landed "$(git -C "$REPO" rev-parse HEAD)" push-reported-success
    exit 0
    ;;
  partial)
    # Land only the FIRST id: a layer-2-style partial write.
    land "${IDS[0]}"
    verdict landed "$(git -C "$REPO" rev-parse HEAD)" push-reported-success
    exit 0
    ;;
  silent)
    # Reports success, pushes nothing — the Direction-B pathology.
    verdict landed abcdef0 push-reported-success
    exit 0
    ;;
  noop)
    printf 'graph-commit: verdict: landed ids=%s pushed=none main=4666cf8a context=noop\n' \
      "$(IFS=,; echo "${IDS[*]}")" >&2
    exit 0
    ;;
  fail)
    verdict failed none refused
    exit "${GC_EXIT:-1}"
    ;;
  *)
    echo "graph-commit stub: unknown GC_MODE=${GC_MODE:-}" >&2
    exit 9
    ;;
esac
SH
chmod +x "$SEED/packages/intentionsutil/scripts/graph-commit"

seed_source() { # <id>
  cat >"$SEED/intentions/$1.md" <<NODE
---
id: $1
kind: tactic
statement: harness source node $1
owner: ai
status: codified
serves:
  - strategy-harness
phase: main-qa
blocked_by: []
office_hours: null
execution:
  branch: $1
  pr: $SRC_PR
  attempts: {}
  markers: []
  strategy_fingerprint: null
---
# harness source node $1

ORIGINAL-SOURCE-BODY-MARKER
NODE
}

seed_source tactic-src-mixed
seed_source tactic-src-machine
seed_source tactic-src-author
seed_source tactic-src-wait
seed_source tactic-src-rerun
seed_source tactic-src-gcfail
seed_source tactic-src-silent
seed_source tactic-src-usage
seed_source tactic-src-multiline
seed_source tactic-src-newitem

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

# --- Item fixtures ------------------------------------------------------------
cat >"$WORK/items-mixed.json" <<'JSON'
[
  { "id": "V1", "title": "Landing hero renders", "url_path": "/",
    "expected_outcome": "the hero copy reads the new headline",
    "finding": "preview showed the old headline",
    "verifiability": "MACHINE", "check": "curl -s https://example.test/ | grep -q Headline" },
  { "id": "V2", "title": "Print dialog feels right", "url_path": "/print",
    "expected_outcome": "the dialog is legible at 125% zoom",
    "finding": "judgment call, not scriptable",
    "verifiability": "AUTHOR" }
]
JSON

cat >"$WORK/items-machine.json" <<'JSON'
[
  { "id": "V1", "title": "Landing hero renders", "url_path": "/",
    "expected_outcome": "the hero copy reads the new headline",
    "finding": "preview showed the old headline",
    "verifiability": "MACHINE" },
  { "id": "V2", "title": "Sitemap lists the new page", "url_path": "/sitemap.xml",
    "expected_outcome": "the new route appears",
    "finding": "not present on preview",
    "verifiability": "MACHINE" }
]
JSON

# The same two MACHINE items as items-machine.json PLUS a third. Models the
# second /qa-fix pass on the same PR: the plan items are stable, so the earlier
# items recur by id and a newly-discovered one joins them.
cat >"$WORK/items-machine-plus-new.json" <<'JSON'
[
  { "id": "V1", "title": "Landing hero renders", "url_path": "/",
    "expected_outcome": "the hero copy reads the new headline",
    "finding": "preview showed the old headline",
    "verifiability": "MACHINE" },
  { "id": "V2", "title": "Sitemap lists the new page", "url_path": "/sitemap.xml",
    "expected_outcome": "the new route appears",
    "finding": "not present on preview",
    "verifiability": "MACHINE" },
  { "id": "V3", "title": "Feed advertises the new page", "url_path": "/feed.xml",
    "expected_outcome": "the new entry appears in the feed",
    "finding": "found on the SECOND qa pass, after the first mint landed",
    "verifiability": "MACHINE" }
]
JSON

cat >"$WORK/items-author.json" <<'JSON'
[
  { "id": "V1", "title": "Print dialog feels right", "url_path": "/print",
    "expected_outcome": "the dialog is legible at 125% zoom",
    "finding": "judgment call, not scriptable",
    "verifiability": "AUTHOR" }
]
JSON

# One WAIT item and one AUTHOR item: R1 says WAIT is a hold ON the machine node,
# so this must produce a machine node carrying V1 — never a third lane.
cat >"$WORK/items-wait.json" <<'JSON'
[
  { "id": "V1", "title": "CDN cache expiry", "url_path": "/assets/app.css",
    "expected_outcome": "the new stylesheet is served once the CDN TTL lapses",
    "finding": "stale asset still served",
    "verifiability": "WAIT" },
  { "id": "V2", "title": "Print dialog feels right", "url_path": "/print",
    "expected_outcome": "the dialog is legible at 125% zoom",
    "finding": "judgment call",
    "verifiability": "AUTHOR" }
]
JSON

# A finding carrying an embedded newline whose continuation line opens an H2.
# Rendered verbatim this would break the `  - Finding:` sub-line the /qa-main
# node lane parses AND inject a `## needs-main` heading into a destination
# node — the one heading a destination node must never carry.
cat >"$WORK/items-multiline.json" <<'JSON'
[
  { "id": "V1", "title": "Landing hero renders", "url_path": "/",
    "expected_outcome": "the hero copy reads the new headline",
    "finding": "preview showed the old headline\n## needs-main\n- injected",
    "verifiability": "MACHINE" }
]
JSON

run_mint() { # <clone> <gc-log> <gc-mode> [args...]
  local clone="$1" gclog="$2" gcmode="$3"; shift 3
  (
    cd "$clone" || exit 99
    export GC_LOG="$gclog" GC_MODE="$gcmode"
    bash packages/intentionsutil/scripts/mint-mainqa-nodes "$@"
  )
}

# Assert the graph-commit log shows ONE invocation carrying all of the given ids
# positionally, plus an explicit `-C <clone>`. The stub truncates $GC_LOG at
# entry, so the log's contents ARE the single last invocation.
assert_one_commit() { # <gclog> <clone> <id>...
  local gclog="$1" clone="$2"; shift 2
  local id
  grep -qx -- '-C' "$gclog" || return 1
  grep -qxF -- "$clone" "$gclog" || return 1
  for id in "$@"; do grep -qxF -- "$id" "$gclog" || return 1; done
  return 0
}

# ---------------------------------------------------------------------------
# Case 1 + 6: mixed items -> TWO nodes in ONE graph-commit (explicit -C), and
# the SOURCE file is byte-identical before and after.
# ---------------------------------------------------------------------------
A="$WORK/a"; make_clone "$A" writer-a
GCLOG_A="$WORK/gclog-a"
SRC_A=tactic-src-mixed
src_before="$(git -C "$A" hash-object -- "intentions/$SRC_A.md")"
out="$(run_mint "$A" "$GCLOG_A" land "$SRC_A" --pr "$SRC_PR" \
        --items "$WORK/items-mixed.json" --now "$NOW" 2>&1)"; rc=$?
MACH_A="tactic-mainqa-src-mixed-machine"
AUTH_A="tactic-mainqa-src-mixed-author"
mach_md="$A/intentions/$MACH_A.md"
auth_md="$A/intentions/$AUTH_A.md"
if [[ $rc -eq 0 ]] \
   && grep -qx "minted $MACH_A (CREATE)" <<<"$out" \
   && grep -qx "minted $AUTH_A (CREATE)" <<<"$out" \
   && [[ -f "$mach_md" && -f "$auth_md" ]] \
   && assert_one_commit "$GCLOG_A" "$A" "$MACH_A" "$AUTH_A" \
   && git -C "$A" cat-file -e "origin/main:intentions/$MACH_A.md" \
   && git -C "$A" cat-file -e "origin/main:intentions/$AUTH_A.md"; then
  ok "mixed items: exactly TWO nodes minted, both ids in ONE graph-commit invocation carrying an explicit -C, both landed on origin/main"
else
  no "mixed items two-nodes-one-commit (rc=$rc)"
  printf '%s\n' "$out"; cat "$GCLOG_A" 2>/dev/null
fi

n_created="$(ls "$A/intentions" | grep -c '^tactic-mainqa-src-mixed-')"
mach_h1="$(grep -c '^# ' "$mach_md" 2>/dev/null)"
if [[ "$n_created" == 2 ]] && [[ "$mach_h1" == 1 ]] \
   && grep -q '^## Verification items' "$mach_md" \
   && grep -qF '**V1 — Landing hero renders**' "$mach_md" \
   && ! grep -qF 'V2 — Print dialog' "$mach_md" \
   && ! grep -qi '^## needs-main' "$mach_md" \
   && grep -qF '**V2 — Print dialog feels right**' "$auth_md"; then
  ok "mixed items: each lane's body carries only its own items, one H1, no needs-main H2 (never mistaken for a residue source)"
else
  no "mixed lane bodies (created=$n_created h1=$mach_h1)"
  sed -n '1,60p' "$mach_md" 2>/dev/null
fi

mach_json="$(cd "$A" && node --import tsx/esm -e '
  const { readNode } = await import("./packages/intentionsutil/src/store.js");
  process.stdout.write(JSON.stringify(readNode("intentions", process.argv[1])));
' "$MACH_A" 2>/dev/null)"
auth_json="$(cd "$A" && node --import tsx/esm -e '
  const { readNode } = await import("./packages/intentionsutil/src/store.js");
  process.stdout.write(JSON.stringify(readNode("intentions", process.argv[1])));
' "$AUTH_A" 2>/dev/null)"
if [[ "$(jq -r '.phase' <<<"$mach_json")" == "main-qa" ]] \
   && [[ "$(jq -r '.blocked_by | join(",")' <<<"$mach_json")" == "$SRC_A" ]] \
   && [[ "$(jq -r '.office_hours' <<<"$mach_json")" == "null" ]] \
   && [[ "$(jq -r '.owner' <<<"$mach_json")" == "ai" ]] \
   && [[ "$(jq -r '.execution.pr' <<<"$mach_json")" == "$SRC_PR" ]] \
   && [[ "$(jq -r '.serves | join(",")' <<<"$mach_json")" == "strategy-harness" ]] \
   && [[ "$(jq -r '.owner' <<<"$auth_json")" == "human" ]] \
   && [[ "$(jq -r '.office_hours.since' <<<"$auth_json")" == "$NOW" ]]; then
  ok "mixed items: machine lane is ai/unparked, author lane is human/born-parked, both blocked_by the source, serves copied, PR recorded"
else
  no "lane frontmatter"; printf '%s\n%s\n' "$mach_json" "$auth_json"
fi

src_after="$(git -C "$A" hash-object -- "intentions/$SRC_A.md")"
src_status="$(git -C "$A" status --porcelain -- "intentions/$SRC_A.md")"
if [[ "$src_before" == "$src_after" ]] && [[ -z "$src_status" ]] \
   && grep -q 'ORIGINAL-SOURCE-BODY-MARKER' "$A/intentions/$SRC_A.md"; then
  ok "the SOURCE node file is byte-identical before and after the mint (no source-side edit, no CAS on it)"
else
  no "source byte-identical (before=$src_before after=$src_after status='$src_status')"
fi

if ! grep -q -- '--base' "$GCLOG_A"; then
  ok "no --base token is emitted: every id in the commit set is born fresh"
else
  no "unexpected --base token"; cat "$GCLOG_A"
fi

# ---------------------------------------------------------------------------
# Case 2: all-machine items mint exactly ONE node.
# ---------------------------------------------------------------------------
B="$WORK/b"; make_clone "$B" writer-b
GCLOG_B="$WORK/gclog-b"
SRC_B=tactic-src-machine
out="$(run_mint "$B" "$GCLOG_B" land "$SRC_B" --pr "$SRC_PR" \
        --items "$WORK/items-machine.json" --now "$NOW" 2>&1)"; rc=$?
MACH_B="tactic-mainqa-src-machine-machine"
# Scoped to THIS source: each clone is taken after earlier cases have already
# landed their own destination nodes on the shared scratch origin.
n_created="$(ls "$B/intentions" | grep -c '^tactic-mainqa-src-machine-')"
n_lines="$(grep -c '^minted ' <<<"$out")"
if [[ $rc -eq 0 ]] && [[ "$n_created" == 1 ]] && [[ "$n_lines" == 1 ]] \
   && grep -qx "minted $MACH_B (CREATE)" <<<"$out" \
   && [[ ! -e "$B/intentions/tactic-mainqa-src-machine-author.md" ]] \
   && grep -qF '**V2 — Sitemap lists the new page**' "$B/intentions/$MACH_B.md"; then
  ok "all-machine items: exactly ONE node minted (machine), no author file at all, both items on it"
else
  no "all-machine single node (rc=$rc created=$n_created lines=$n_lines)"; printf '%s\n' "$out"
fi

# ---------------------------------------------------------------------------
# Case 3: all-author items mint exactly ONE node, born parked.
# ---------------------------------------------------------------------------
C="$WORK/c"; make_clone "$C" writer-c
GCLOG_C="$WORK/gclog-c"
SRC_C=tactic-src-author
out="$(run_mint "$C" "$GCLOG_C" land "$SRC_C" --pr "$SRC_PR" \
        --items "$WORK/items-author.json" --now "$NOW" 2>&1)"; rc=$?
AUTH_C="tactic-mainqa-src-author-author"
n_created="$(ls "$C/intentions" | grep -c '^tactic-mainqa-src-author-')"
auth_json="$(cd "$C" && node --import tsx/esm -e '
  const { readNode } = await import("./packages/intentionsutil/src/store.js");
  process.stdout.write(JSON.stringify(readNode("intentions", process.argv[1])));
' "$AUTH_C" 2>/dev/null)"
if [[ $rc -eq 0 ]] && [[ "$n_created" == 1 ]] \
   && grep -qx "minted $AUTH_C (CREATE)" <<<"$out" \
   && [[ ! -e "$C/intentions/tactic-mainqa-src-author-machine.md" ]] \
   && [[ "$(jq -r '.status' <<<"$auth_json")" == "delegated" ]] \
   && [[ -n "$(jq -r '.office_hours.reason' <<<"$auth_json")" ]] \
   && [[ -n "$(jq -r '.office_hours.recommendation' <<<"$auth_json")" ]]; then
  ok "all-author items: exactly ONE node minted (author), born parked with a reason AND a recommendation"
else
  no "all-author single node (rc=$rc created=$n_created)"; printf '%s\n' "$out"; printf '%s\n' "$auth_json"
fi

# ---------------------------------------------------------------------------
# Case 4 (ruling R1): a WAIT item lands on the MACHINE node, never a third lane.
# ---------------------------------------------------------------------------
D="$WORK/d"; make_clone "$D" writer-d
GCLOG_D="$WORK/gclog-d"
SRC_D=tactic-src-wait
out="$(run_mint "$D" "$GCLOG_D" land "$SRC_D" --pr "$SRC_PR" \
        --items "$WORK/items-wait.json" --now "$NOW" 2>&1)"; rc=$?
MACH_D="tactic-mainqa-src-wait-machine"
n_created="$(ls "$D/intentions" | grep -c '^tactic-mainqa-src-wait-')"
if [[ $rc -eq 0 ]] && [[ "$n_created" == 2 ]] \
   && [[ -f "$D/intentions/$MACH_D.md" ]] \
   && grep -qF '**V1 — CDN cache expiry**' "$D/intentions/$MACH_D.md" \
   && grep -qF 'Verifiability: WAIT' "$D/intentions/$MACH_D.md" \
   && ! ls "$D/intentions" | grep -q 'mainqa-src-wait-wait'; then
  ok "R1: a WAIT item lands on the MACHINE node (a hold ON that node), never a third lane"
else
  no "R1 WAIT routing (rc=$rc created=$n_created)"
  printf '%s\n' "$out"; ls "$D/intentions"
fi

# ---------------------------------------------------------------------------
# Case 5: idempotent re-run — with both files already on origin/main, nothing is
# written and graph-commit is never invoked.
# ---------------------------------------------------------------------------
E="$WORK/e"; make_clone "$E" writer-e
GCLOG_E1="$WORK/gclog-e1"; GCLOG_E2="$WORK/gclog-e2"
SRC_E=tactic-src-rerun
out1="$(run_mint "$E" "$GCLOG_E1" land "$SRC_E" --pr "$SRC_PR" \
         --items "$WORK/items-mixed.json" --now "$NOW" 2>&1)"; rc1=$?
MACH_E="tactic-mainqa-src-rerun-machine"
AUTH_E="tactic-mainqa-src-rerun-author"
mach_blob_1="$(git -C "$E" hash-object -- "intentions/$MACH_E.md" 2>/dev/null)"
out2="$(run_mint "$E" "$GCLOG_E2" land "$SRC_E" --pr "$SRC_PR" \
         --items "$WORK/items-mixed.json" --now 2027-01-01 2>&1)"; rc2=$?
mach_blob_2="$(git -C "$E" hash-object -- "intentions/$MACH_E.md" 2>/dev/null)"
status_after="$(git -C "$E" status --porcelain -- intentions/)"
if [[ $rc1 -eq 0 && $rc2 -eq 0 ]] \
   && grep -qx "minted $MACH_E (EXISTING)" <<<"$out2" \
   && grep -qx "minted $AUTH_E (EXISTING)" <<<"$out2" \
   && [[ ! -e "$GCLOG_E2" ]] \
   && [[ "$mach_blob_1" == "$mach_blob_2" ]] \
   && [[ -z "$status_after" ]]; then
  ok "idempotent re-run: both lanes report EXISTING, nothing is rewritten, graph-commit is never invoked, exit 0"
else
  no "idempotent re-run (rc1=$rc1 rc2=$rc2 blob1=$mach_blob_1 blob2=$mach_blob_2 status='$status_after')"
  printf '%s\n' "$out2"; [[ -e "$GCLOG_E2" ]] && cat "$GCLOG_E2"
fi

# ---------------------------------------------------------------------------
# Case 7: a failing graph-commit leaves a CLEAN tree.
# ---------------------------------------------------------------------------
F="$WORK/f"; make_clone "$F" writer-f
GCLOG_F="$WORK/gclog-f"
SRC_F=tactic-src-gcfail
out="$(run_mint "$F" "$GCLOG_F" fail "$SRC_F" --pr "$SRC_PR" \
        --items "$WORK/items-mixed.json" --now "$NOW" 2>&1)"; rc=$?
status_after="$(git -C "$F" status --porcelain -- intentions/)"
if [[ $rc -eq 1 ]] \
   && grep -q 'graph-commit failed' <<<"$out" \
   && [[ -z "$status_after" ]] \
   && [[ ! -e "$F/intentions/tactic-mainqa-src-gcfail-machine.md" ]] \
   && [[ ! -e "$F/intentions/tactic-mainqa-src-gcfail-author.md" ]]; then
  ok "graph-commit failure: exit 1 and BOTH born-fresh node files removed — git status clean, no residue to block merge --ff-only"
else
  no "rollback on graph-commit failure (rc=$rc status='$status_after')"; printf '%s\n' "$out"
fi

# ---------------------------------------------------------------------------
# Case 8: a land that REPORTS success but pushes nothing is caught by the
# post-land re-read off a fresh origin/main, and reported non-zero.
# ---------------------------------------------------------------------------
G="$WORK/g"; make_clone "$G" writer-g
GCLOG_G="$WORK/gclog-g"
SRC_G=tactic-src-silent
out="$(run_mint "$G" "$GCLOG_G" silent "$SRC_G" --pr "$SRC_PR" \
        --items "$WORK/items-mixed.json" --now "$NOW" 2>&1)"; rc=$?
if [[ $rc -eq 1 ]] && grep -q 'absent from origin/main after the mint reported success' <<<"$out"; then
  ok "post-land re-read: a reported-success land that pushed NOTHING is caught off a fresh origin/main and reported non-zero"
else
  no "post-land re-read of a silent land (rc=$rc)"; printf '%s\n' "$out"
fi

# A `context=noop` verdict is a FAILURE for a mint, not a success.
H="$WORK/h"; make_clone "$H" writer-h
GCLOG_H="$WORK/gclog-h"
out="$(run_mint "$H" "$GCLOG_H" noop "$SRC_G" --pr "$SRC_PR" \
        --items "$WORK/items-mixed.json" --now "$NOW" 2>&1)"; rc=$?
if [[ $rc -eq 1 ]] && grep -q 'context=noop' <<<"$out" && grep -q 'landed NOTHING' <<<"$out"; then
  ok "graph-commit 'pushed=none context=noop' is treated as a FAILURE, not a success"
else
  no "noop verdict treated as failure (rc=$rc)"; printf '%s\n' "$out"
fi

# A partial land (only one of the two ids reaches origin/main) is caught too.
I="$WORK/i"; make_clone "$I" writer-i
GCLOG_I="$WORK/gclog-i"
out="$(run_mint "$I" "$GCLOG_I" partial "$SRC_G" --pr "$SRC_PR" \
        --items "$WORK/items-mixed.json" --now "$NOW" 2>&1)"; rc=$?
if [[ $rc -eq 1 ]] && grep -q 'the write did not survive' <<<"$out"; then
  ok "post-land re-read: a PARTIAL land (one of two ids missing from origin/main) is reported non-zero"
else
  no "post-land re-read of a partial land (rc=$rc)"; printf '%s\n' "$out"
fi

# ---------------------------------------------------------------------------
# Case 9: usage error (missing --pr) exits 2 and touches nothing.
# ---------------------------------------------------------------------------
J="$WORK/j"; make_clone "$J" writer-j
GCLOG_J="$WORK/gclog-j"
out="$(run_mint "$J" "$GCLOG_J" land tactic-src-usage \
        --items "$WORK/items-mixed.json" 2>&1)"; rc=$?
status_after="$(git -C "$J" status --porcelain -- intentions/)"
if [[ $rc -eq 2 ]] && grep -q 'usage: mint-mainqa-nodes' <<<"$out" \
   && [[ -z "$status_after" ]] && [[ ! -e "$GCLOG_J" ]]; then
  ok "usage error (missing --pr): exit 2, nothing written, graph-commit never invoked"
else
  no "usage error (rc=$rc status='$status_after')"; printf '%s\n' "$out"
fi

# ---------------------------------------------------------------------------
# Case 10: an item field carrying an embedded newline is REFUSED at the payload
# edge (exit 2), nothing written, graph-commit never invoked. Rendered verbatim
# it would break the one-line-per-field bullet structure /qa-main parses back
# out, and here it would also inject a `## needs-main` heading into a
# destination node.
# ---------------------------------------------------------------------------
K="$WORK/k"; make_clone "$K" writer-k
GCLOG_K="$WORK/gclog-k"
out="$(run_mint "$K" "$GCLOG_K" land tactic-src-multiline --pr "$SRC_PR" \
        --items "$WORK/items-multiline.json" --now "$NOW" 2>&1)"; rc=$?
status_after="$(git -C "$K" status --porcelain -- intentions/)"
if [[ $rc -eq 2 ]] && grep -q 'must be a single line' <<<"$out" \
   && [[ -z "$status_after" ]] && [[ ! -e "$GCLOG_K" ]]; then
  ok "multi-line item field: exit 2, nothing written, graph-commit never invoked"
else
  no "multi-line item field (rc=$rc status='$status_after')"; printf '%s\n' "$out"
fi

# ---------------------------------------------------------------------------
# Case 11: a later pass carrying a NEW item for a lane whose node already exists
# is REFUSED, not silently dropped. `/qa-fix` Step 6 excludes needs-main residue
# from its escalation set on the strength of Step 3.6 having recorded it, so a
# skipped item is recorded NOWHERE and the run would exit 0 having lost it.
# The landed node is still not rewritten — appending to a node a human may be
# mid-sitting on stays a human decision.
# ---------------------------------------------------------------------------
L="$WORK/l"; make_clone "$L" writer-l
GCLOG_L1="$WORK/gclog-l1"; GCLOG_L2="$WORK/gclog-l2"
SRC_L=tactic-src-newitem
MACH_L="tactic-mainqa-src-newitem-machine"
out1="$(run_mint "$L" "$GCLOG_L1" land "$SRC_L" --pr "$SRC_PR" \
         --items "$WORK/items-machine.json" --now "$NOW" 2>&1)"; rc1=$?
blob_l1="$(git -C "$L" hash-object -- "intentions/$MACH_L.md" 2>/dev/null)"
out2="$(run_mint "$L" "$GCLOG_L2" land "$SRC_L" --pr "$SRC_PR" \
         --items "$WORK/items-machine-plus-new.json" --now "$NOW" 2>&1)"; rc2=$?
blob_l2="$(git -C "$L" hash-object -- "intentions/$MACH_L.md" 2>/dev/null)"
status_l="$(git -C "$L" status --porcelain -- intentions/)"
if [[ $rc1 -eq 0 && $rc2 -ne 0 ]] \
   && grep -q 'does NOT record verification item' <<<"$out2" \
   && grep -q 'V3' <<<"$out2" \
   && ! grep -q 'V1' <<<"$out2" \
   && [[ ! -e "$GCLOG_L2" ]] \
   && [[ -n "$blob_l1" && "$blob_l1" == "$blob_l2" ]] \
   && [[ -z "$status_l" ]]; then
  ok "a NEW item for an EXISTING lane is refused loudly, naming only the missing item; the landed node is not rewritten and the tree stays clean"
else
  no "new-item-on-existing-lane refusal (rc1=$rc1 rc2=$rc2 blob1=$blob_l1 blob2=$blob_l2 status='$status_l')"
  printf '%s\n' "$out2"; [[ -e "$GCLOG_L2" ]] && cat "$GCLOG_L2"
fi

echo
echo "passed: $PASS  failed: $FAIL"
[[ $FAIL -eq 0 ]] || exit 1
exit 0
