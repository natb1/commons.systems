#!/usr/bin/env bash
# Tests for dispatch-stamp-session -- moved verbatim from test-dispatch-scripts.sh
# (tactic-dispatch-test-monolith-split). Original section: 27867-28271.
set -euo pipefail

FIXTURE_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=dispatch-test-fixture.sh
source "$FIXTURE_DIR/dispatch-test-fixture.sh"

# --- subshell-safe assertion tally ------------------------------------------
# Every case in this suite runs inside its own `( … )` subshell, so the
# fixture's PASS/FAIL/TOTAL increments never reach THIS shell. Measured before
# this shim: 74 assertions printed, `Results: 2/2 passed` reported (only the two
# leak guards, which run in the parent) — a failing assertion printed `FAIL:`
# and the suite still exited 0. That is a vacuous green, so the tally is
# recorded in a file the subshells share and folded back in before
# `report_results` runs. `assert_eq`'s output format is unchanged.
STAMP_TALLY=$(mktemp)
assert_eq() {
  local label="$1" expected="$2" actual="$3"
  if [[ "$expected" == "$actual" ]]; then
    printf 'PASS\n' >> "$STAMP_TALLY"
    echo "  PASS: $label"
  else
    printf 'FAIL\n' >> "$STAMP_TALLY"
    echo "  FAIL: $label"
    echo "    expected: '$expected'"
    echo "    actual:   '$actual'"
  fi
}

# stamp_fold_tally — add every subshell-recorded result to the parent's counters
# so report_results scores (and can fail on) them.
stamp_fold_tally() {
  local r
  while IFS= read -r r; do
    TOTAL=$((TOTAL + 1))
    if [[ "$r" == PASS ]]; then
      PASS=$((PASS + 1))
    else
      FAIL=$((FAIL + 1))
    fi
  done < "$STAMP_TALLY"
  rm -f "$STAMP_TALLY"
}

# >>> MOVED FROM test-dispatch-scripts.sh >>>
# ============================================================================
# dispatch-stamp-session — per-session GitHub-artifact sidecar writer/backfill
# ============================================================================
# These cases call "$SCRIPT_DIR/dispatch-stamp-session" directly: it has no
# sibling-script dependencies (git/jq/find/date only), so no setup() copy is
# needed. Each case is a self-contained subshell over its own fake git repo /
# fake projects root under a mktemp -d, cleaned at block end — env seams
# (DISPATCH_STAMP_PROJECTS_ROOT, CLAUDE_CODE_SESSION_ID) are scoped per-subshell
# so nothing leaks across tests and teardown() is untouched.
echo ""
echo "=== dispatch-stamp-session ==="

STAMP="$SCRIPT_DIR/dispatch-stamp-session"

# 1. Initial write on a worker branch derives repo/issue/branch/base_sha.
(
  d=$(mktemp -d)
  git -C "$d" init -q
  git -C "$d" remote add origin https://github.com/natb1/commons.systems.git
  git -C "$d" checkout -q -b 999-fixture
  git -C "$d" -c user.email=t@t -c user.name=t commit -q --allow-empty -m init
  ( cd "$d" && "$STAMP" --session-id sess1 --transcript-path "$d/sess1.jsonl" )
  sc="$d/sess1.dispatch-stamp.json"
  assert_eq "stamp: sidecar written on worker branch" "yes" \
    "$([ -f "$sc" ] && echo yes || echo no)"
  assert_eq "stamp: .repo parsed from HTTPS origin" "natb1/commons.systems" "$(jq -r .repo "$sc")"
  assert_eq "stamp: .issue is numeric branch prefix" "999" "$(jq -r .issue "$sc")"
  assert_eq "stamp: .branch" "999-fixture" "$(jq -r .branch "$sc")"
  assert_eq "stamp: .pr null on initial write" "null" "$(jq -r .pr "$sc")"
  assert_eq "stamp: .base_sha equals HEAD" "$(git -C "$d" rev-parse HEAD)" "$(jq -r .base_sha "$sc")"
  assert_eq "stamp: .session_id" "sess1" "$(jq -r .session_id "$sc")"
  assert_eq "stamp: .schema is 1" "1" "$(jq -r .schema "$sc")"
  rm -rf "$d"
)

# 1b. SSH origin URL normalizes to owner/name (git@github.com:owner/name.git).
(
  d=$(mktemp -d)
  git -C "$d" init -q
  git -C "$d" remote add origin git@github.com:natb1/commons.systems.git
  git -C "$d" checkout -q -b 999-fixture
  git -C "$d" -c user.email=t@t -c user.name=t commit -q --allow-empty -m init
  ( cd "$d" && "$STAMP" --session-id sessSSH --transcript-path "$d/sessSSH.jsonl" )
  sc="$d/sessSSH.dispatch-stamp.json"
  assert_eq "stamp: .repo parsed from SSH origin" "natb1/commons.systems" "$(jq -r .repo "$sc")"
  rm -rf "$d"
)

# 2. No-op on main — no sidecar, exit 0.
(
  d=$(mktemp -d)
  git -C "$d" init -q
  git -C "$d" remote add origin https://github.com/natb1/commons.systems.git
  git -C "$d" checkout -q -b main
  git -C "$d" -c user.email=t@t -c user.name=t commit -q --allow-empty -m init
  rc=0
  ( cd "$d" && "$STAMP" --session-id s --transcript-path "$d/m.jsonl" ) 2>/dev/null || rc=$?
  assert_eq "stamp: main exits 0" "0" "$rc"
  assert_eq "stamp: main writes no sidecar" "no" \
    "$([ -f "$d/m.dispatch-stamp.json" ] && echo yes || echo no)"
  rm -rf "$d"
)

# 3. No-op on office-hours-5 — no sidecar, exit 0.
(
  d=$(mktemp -d)
  git -C "$d" init -q
  git -C "$d" remote add origin https://github.com/natb1/commons.systems.git
  git -C "$d" checkout -q -b office-hours-5
  git -C "$d" -c user.email=t@t -c user.name=t commit -q --allow-empty -m init
  rc=0
  ( cd "$d" && "$STAMP" --session-id s --transcript-path "$d/o.jsonl" ) 2>/dev/null || rc=$?
  assert_eq "stamp: office-hours-5 exits 0" "0" "$rc"
  assert_eq "stamp: office-hours-5 writes no sidecar" "no" \
    "$([ -f "$d/o.dispatch-stamp.json" ] && echo yes || echo no)"
  rm -rf "$d"
)

# 4. Backfill sets .pr and exits 0.
(
  root=$(mktemp -d)
  mkdir -p "$root/somedir"
  sc="$root/somedir/sess2.dispatch-stamp.json"
  printf '%s\n' '{"schema":1,"session_id":"sess2","repo":"natb1/commons.systems","issue":5,"pr":null,"branch":"5-x","base_sha":"abc123","stamped_at":"2026-01-01T00:00:00Z"}' > "$sc"
  rc=0
  CLAUDE_CODE_SESSION_ID=sess2 DISPATCH_STAMP_PROJECTS_ROOT="$root" "$STAMP" --backfill-pr 4242 2>/dev/null || rc=$?
  assert_eq "stamp: backfill exits 0" "0" "$rc"
  assert_eq "stamp: backfill sets .pr" "4242" "$(jq -r .pr "$sc")"
  rm -rf "$root"
)

# 5. Backfill no-ops + exits 0 when the sidecar is missing.
(
  root=$(mktemp -d)
  rc=0
  CLAUDE_CODE_SESSION_ID=nope DISPATCH_STAMP_PROJECTS_ROOT="$root" "$STAMP" --backfill-pr 7 2>/dev/null || rc=$?
  assert_eq "stamp: backfill missing sidecar exits 0" "0" "$rc"
  rm -rf "$root"
)

# 5b. Backfill no-ops + exits 0 when CLAUDE_CODE_SESSION_ID is unset — a backfill
# failure must NEVER fail its caller, so the unset-session case is a clean exit 0
# (not exit 2), with nothing to locate.
(
  root=$(mktemp -d)
  rc=0
  ( unset CLAUDE_CODE_SESSION_ID
    DISPATCH_STAMP_PROJECTS_ROOT="$root" "$STAMP" --backfill-pr 7 ) 2>/dev/null || rc=$?
  assert_eq "stamp: backfill unset session-id exits 0" "0" "$rc"
  rm -rf "$root"
)

# 6. Idempotent re-write preserves a set .pr (does not clobber to null),
#    preserves session-start .base_sha (not advanced to post-resume HEAD),
#    and advances .stamped_at (re-derived, not preserved).
(
  d=$(mktemp -d)
  git -C "$d" init -q
  git -C "$d" remote add origin https://github.com/natb1/commons.systems.git
  git -C "$d" checkout -q -b 999-fixture
  git -C "$d" -c user.email=t@t -c user.name=t commit -q --allow-empty -m init
  sc="$d/sess6.dispatch-stamp.json"
  # Seed a sidecar that already carries a backfilled pr and a session-start base_sha.
  printf '%s\n' '{"schema":1,"session_id":"sess6","repo":"old/repo","issue":1,"pr":4242,"branch":"old","base_sha":"old","stamped_at":"2026-01-01T00:00:00Z"}' > "$sc"
  ( cd "$d" && "$STAMP" --session-id sess6 --transcript-path "$d/sess6.jsonl" )
  assert_eq "stamp: re-write preserves set .pr" "4242" "$(jq -r .pr "$sc")"
  assert_eq "stamp: re-write re-derives .branch" "999-fixture" "$(jq -r .branch "$sc")"
  assert_eq "stamp: re-write PRESERVES session-start .base_sha" "old" "$(jq -r .base_sha "$sc")"
  assert_eq "stamp: re-write advances .stamped_at (re-derived, not preserved)" "differs" \
    "$([ "$(jq -r .stamped_at "$sc")" != "2026-01-01T00:00:00Z" ] && echo differs || echo same)"
  rm -rf "$d"
)

# 6b. Idempotent re-write with an explicitly-null .base_sha falls through to
#     the HEAD-derived fallback (exercises the jq `// empty` operator that
#     distinguishes JSON null from a real SHA in dispatch-stamp-session).
(
  d=$(mktemp -d)
  git -C "$d" init -q
  git -C "$d" remote add origin https://github.com/natb1/commons.systems.git
  git -C "$d" checkout -q -b 999-fixture
  git -C "$d" -c user.email=t@t -c user.name=t commit -q --allow-empty -m init
  sc="$d/sess6b.dispatch-stamp.json"
  # Seed a sidecar whose base_sha is JSON null (not the string "null", not absent).
  printf '%s\n' '{"schema":1,"session_id":"sess6b","repo":"old/repo","issue":1,"pr":null,"branch":"old","base_sha":null,"stamped_at":"2026-01-01T00:00:00Z"}' > "$sc"
  ( cd "$d" && "$STAMP" --session-id sess6b --transcript-path "$d/sess6b.jsonl" )
  assert_eq "stamp: re-write with null .base_sha falls through to HEAD" "$(git -C "$d" rev-parse HEAD)" "$(jq -r .base_sha "$sc")"
  rm -rf "$d"
)

# 7. Resume after HEAD moves (ff-merge) preserves the session-start .base_sha.
#    This encodes #2270's failure mode: an initial stamp records HEAD=A; a later
#    git merge --ff-only moves HEAD to B; the resume re-stamp must keep base_sha=A.
(
  d=$(mktemp -d)
  git -C "$d" init -q
  git -C "$d" remote add origin https://github.com/natb1/commons.systems.git
  git -C "$d" checkout -q -b 999-fixture
  git -C "$d" -c user.email=t@t -c user.name=t commit -q --allow-empty -m init
  A=$(git -C "$d" rev-parse HEAD)
  # Initial stamp at HEAD=A.
  ( cd "$d" && "$STAMP" --session-id sess7 --transcript-path "$d/sess7.jsonl" )
  sc="$d/sess7.dispatch-stamp.json"
  assert_eq "stamp: initial .base_sha is A" "$A" "$(jq -r .base_sha "$sc")"
  # HEAD moves to B (simulating an ff-merge of origin/main).
  git -C "$d" -c user.email=t@t -c user.name=t commit -q --allow-empty -m advance
  B=$(git -C "$d" rev-parse HEAD)
  assert_eq "stamp: HEAD advanced (B != A)" "no" \
    "$([ "$A" = "$B" ] && echo yes || echo no)"
  # Resume re-stamp must preserve A, not adopt B.
  ( cd "$d" && "$STAMP" --session-id sess7 --transcript-path "$d/sess7.jsonl" )
  assert_eq "stamp: resume preserves session-start .base_sha (A, not B)" "$A" "$(jq -r .base_sha "$sc")"
  rm -rf "$d"
)

# 8. Mode A guard: --session-id with a `..` path-traversal segment exits 2 and
#    writes no sidecar. The 999-fixture worker branch is load-bearing — the
#    guard fires BEFORE the branch gate, so were it removed the input would flow
#    past the gate and a sidecar WOULD be written, failing the assertion below.
(
  d=$(mktemp -d)
  git -C "$d" init -q
  git -C "$d" remote add origin https://github.com/natb1/commons.systems.git
  git -C "$d" checkout -q -b 999-fixture
  git -C "$d" -c user.email=t@t -c user.name=t commit -q --allow-empty -m init
  rc=0
  ( cd "$d" && "$STAMP" --session-id ../evil --transcript-path "$d/sess.jsonl" ) 2>/dev/null || rc=$?
  assert_eq "stamp: --session-id ../evil exits 2" "2" "$rc"
  assert_eq "stamp: --session-id ../evil writes no sidecar" "no" \
    "$([ -f "$d/sess.dispatch-stamp.json" ] && echo yes || echo no)"
  rm -rf "$d"
)

# 9. Mode A guard: --session-id with a `/` path component exits 2 and writes no
#    sidecar (the session id is a bare stem; a slash is malformed).
(
  d=$(mktemp -d)
  git -C "$d" init -q
  git -C "$d" remote add origin https://github.com/natb1/commons.systems.git
  git -C "$d" checkout -q -b 999-fixture
  git -C "$d" -c user.email=t@t -c user.name=t commit -q --allow-empty -m init
  rc=0
  ( cd "$d" && "$STAMP" --session-id foo/bar --transcript-path "$d/sess.jsonl" ) 2>/dev/null || rc=$?
  assert_eq "stamp: --session-id foo/bar exits 2" "2" "$rc"
  assert_eq "stamp: --session-id foo/bar writes no sidecar" "no" \
    "$([ -f "$d/sess.dispatch-stamp.json" ] && echo yes || echo no)"
  rm -rf "$d"
)

# 10. Mode A guard: --transcript-path with a `..` segment exits 2 and writes no
#     sidecar. The sidecar path is derived ${TRANSCRIPT_PATH%.jsonl}.dispatch-stamp.json,
#     so with cd "$d" and transcript ../evil.jsonl the would-be sidecar lands at
#     $d/../evil.dispatch-stamp.json — OUTSIDE $d. The no-sidecar assertion MUST
#     target that exact escaped path; a `find "$d"` scan would never see it and
#     would green even with the guard removed.
(
  d=$(mktemp -d)
  git -C "$d" init -q
  git -C "$d" remote add origin https://github.com/natb1/commons.systems.git
  git -C "$d" checkout -q -b 999-fixture
  git -C "$d" -c user.email=t@t -c user.name=t commit -q --allow-empty -m init
  rc=0
  ( cd "$d" && "$STAMP" --session-id sessok --transcript-path ../evil.jsonl ) 2>/dev/null || rc=$?
  assert_eq "stamp: --transcript-path ../evil.jsonl exits 2" "2" "$rc"
  assert_eq "stamp: --transcript-path ../evil.jsonl writes no sidecar (escaped path)" "no" \
    "$([ -f "$d/../evil.dispatch-stamp.json" ] && echo yes || echo no)"
  rm -rf "$d"
)

# 11. Positive case: `..` appearing as a SUBSTRING of a filename component is
#     NOT a traversal sequence and must pass the guard. E.g. `sess..x.jsonl`
#     contains `..` inside one segment — the old `*..*` pattern rejected it;
#     the new anchored pattern accepts it. Assert the sidecar is written and
#     the derived .issue field is correct.
(
  d=$(mktemp -d)
  git -C "$d" init -q
  git -C "$d" remote add origin https://github.com/natb1/commons.systems.git
  git -C "$d" checkout -q -b 999-fixture
  git -C "$d" -c user.email=t@t -c user.name=t commit -q --allow-empty -m init
  ( cd "$d" && "$STAMP" --session-id sessok --transcript-path "$d/sess..x.jsonl" )
  sc="$d/sess..x.dispatch-stamp.json"
  assert_eq "stamp: ..-in-filename passes (sidecar written)" "yes" \
    "$([ -f "$sc" ] && echo yes || echo no)"
  assert_eq "stamp: ..-in-filename .issue == 999" "999" "$(jq -r .issue "$sc")"
  rm -rf "$d"
)

# 12. Embedded `/../` traversal sequence exits 2 and writes no sidecar.
#     Exercises the `*'/../'*` alternative (different from test #10's leading
#     `../` form). The would-be sidecar is derived from the transcript path, so
#     it would land at $d/sub/../evil.dispatch-stamp.json (== $d/evil.dispatch-stamp.json).
(
  d=$(mktemp -d)
  git -C "$d" init -q
  git -C "$d" remote add origin https://github.com/natb1/commons.systems.git
  git -C "$d" checkout -q -b 999-fixture
  git -C "$d" -c user.email=t@t -c user.name=t commit -q --allow-empty -m init
  rc=0
  mkdir -p "$d/sub"
  ( cd "$d" && "$STAMP" --session-id sessok --transcript-path "$d/sub/../evil.jsonl" ) 2>/dev/null || rc=$?
  assert_eq "stamp: --transcript-path embedded /../ exits 2" "2" "$rc"
  assert_eq "stamp: --transcript-path embedded /../ writes no sidecar" "no" \
    "$([ -f "$d/sub/../evil.dispatch-stamp.json" ] && echo yes || echo no)"
  rm -rf "$d"
)

# 13. Control char in --transcript-path exits 2 and writes no sidecar.
#     Uses a literal tab character (assembled via $'\t' concatenation) inside
#     the path. $'\t' must be a standalone quoting form, not embedded in "…".
(
  d=$(mktemp -d)
  git -C "$d" init -q
  git -C "$d" remote add origin https://github.com/natb1/commons.systems.git
  git -C "$d" checkout -q -b 999-fixture
  git -C "$d" -c user.email=t@t -c user.name=t commit -q --allow-empty -m init
  rc=0
  tpath="$d/sess"$'\t'"evil.jsonl"
  ( cd "$d" && "$STAMP" --session-id sessok --transcript-path "$tpath" ) 2>/dev/null || rc=$?
  assert_eq "stamp: --transcript-path control char exits 2" "2" "$rc"
  assert_eq "stamp: --transcript-path control char writes no sidecar" "no" \
    "$([ -f "${tpath%.jsonl}.dispatch-stamp.json" ] && echo yes || echo no)"
  rm -rf "$d"
)

# 14. Trailing `/..` traversal sequence exits 2 and writes no sidecar.
#     Exercises the `*'/..'` alternative (path ending in foo/..), distinct from
#     test #10's leading `../` and test #12's embedded `/../` forms. With a real
#     $d/sub directory present, a guard bypass would resolve $d/sub/.. to $d and
#     write $d/sub/...dispatch-stamp.json (== $d/.dispatch-stamp.json).
(
  d=$(mktemp -d)
  git -C "$d" init -q
  git -C "$d" remote add origin https://github.com/natb1/commons.systems.git
  git -C "$d" checkout -q -b 999-fixture
  git -C "$d" -c user.email=t@t -c user.name=t commit -q --allow-empty -m init
  rc=0
  mkdir -p "$d/sub"
  ( cd "$d" && "$STAMP" --session-id sessok --transcript-path "$d/sub/.." ) 2>/dev/null || rc=$?
  assert_eq "stamp: --transcript-path trailing /.. exits 2" "2" "$rc"
  assert_eq "stamp: --transcript-path trailing /.. writes no sidecar" "no" \
    "$([ -f "$d/sub/...dispatch-stamp.json" ] && echo yes || echo no)"
  rm -rf "$d"
)

# 15. Graph-native node-id branch (tactic-*): the sidecar is written with
#     node_id == the branch name and issue == null (no numeric prefix to
#     derive). Guards the graph-native arm of the worker-branch gate.
(
  d=$(mktemp -d)
  git -C "$d" init -q
  git -C "$d" remote add origin https://github.com/natb1/commons.systems.git
  git -C "$d" checkout -q -b tactic-node-attribution-fixture
  git -C "$d" -c user.email=t@t -c user.name=t commit -q --allow-empty -m init
  ( cd "$d" && "$STAMP" --session-id sessN --transcript-path "$d/sessN.jsonl" )
  sc="$d/sessN.dispatch-stamp.json"
  assert_eq "stamp: node-id branch writes sidecar" "yes" \
    "$([ -f "$sc" ] && echo yes || echo no)"
  assert_eq "stamp: node-id branch .node_id == branch" "tactic-node-attribution-fixture" \
    "$(jq -r .node_id "$sc")"
  assert_eq "stamp: node-id branch .issue is null" "null" "$(jq -r .issue "$sc")"
  assert_eq "stamp: node-id branch .branch" "tactic-node-attribution-fixture" \
    "$(jq -r .branch "$sc")"
  assert_eq "stamp: node-id branch .base_sha equals HEAD" \
    "$(git -C "$d" rev-parse HEAD)" "$(jq -r .base_sha "$sc")"
  rm -rf "$d"
)

# 16. Graph branch (graph-<slug>) whose slug resolves via a prefixed candidate:
#     intentions/tactic-<slug>.md exists, so node_id == "tactic-<slug>";
#     issue == null.
(
  d=$(mktemp -d)
  git -C "$d" init -q
  git -C "$d" remote add origin https://github.com/natb1/commons.systems.git
  git -C "$d" checkout -q -b graph-myslug
  mkdir -p "$d/intentions"
  : > "$d/intentions/tactic-myslug.md"
  git -C "$d" -c user.email=t@t -c user.name=t add intentions
  git -C "$d" -c user.email=t@t -c user.name=t commit -q -m init
  ( cd "$d" && "$STAMP" --session-id sessG --transcript-path "$d/sessG.jsonl" )
  sc="$d/sessG.dispatch-stamp.json"
  assert_eq "stamp: graph branch writes sidecar" "yes" \
    "$([ -f "$sc" ] && echo yes || echo no)"
  assert_eq "stamp: graph branch .node_id resolved via intentions/tactic-<slug>.md" \
    "tactic-myslug" "$(jq -r .node_id "$sc")"
  assert_eq "stamp: graph branch .issue is null" "null" "$(jq -r .issue "$sc")"
  rm -rf "$d"
)

# 16b. Graph branch whose slug IS the node id (graph-tactic-foo with
#      intentions/tactic-foo.md): the slug-direct candidate wins.
(
  d=$(mktemp -d)
  git -C "$d" init -q
  git -C "$d" remote add origin https://github.com/natb1/commons.systems.git
  git -C "$d" checkout -q -b graph-tactic-foo
  mkdir -p "$d/intentions"
  : > "$d/intentions/tactic-foo.md"
  git -C "$d" -c user.email=t@t -c user.name=t add intentions
  git -C "$d" -c user.email=t@t -c user.name=t commit -q -m init
  ( cd "$d" && "$STAMP" --session-id sessG2 --transcript-path "$d/sessG2.jsonl" )
  sc="$d/sessG2.dispatch-stamp.json"
  assert_eq "stamp: graph branch slug-direct .node_id" "tactic-foo" \
    "$(jq -r .node_id "$sc")"
  rm -rf "$d"
)

# 17. Graph branch with NO matching intentions/<id>.md: the sidecar is still
#     written (session stays attributable by branch) with node_id null and
#     issue null.
(
  d=$(mktemp -d)
  git -C "$d" init -q
  git -C "$d" remote add origin https://github.com/natb1/commons.systems.git
  git -C "$d" checkout -q -b graph-unresolved
  git -C "$d" -c user.email=t@t -c user.name=t commit -q --allow-empty -m init
  ( cd "$d" && "$STAMP" --session-id sessU --transcript-path "$d/sessU.jsonl" )
  sc="$d/sessU.dispatch-stamp.json"
  assert_eq "stamp: unresolved graph branch writes sidecar" "yes" \
    "$([ -f "$sc" ] && echo yes || echo no)"
  assert_eq "stamp: unresolved graph branch .node_id is null" "null" \
    "$(jq -r .node_id "$sc")"
  assert_eq "stamp: unresolved graph branch .issue is null" "null" \
    "$(jq -r .issue "$sc")"
  rm -rf "$d"
)

# 18. Numeric worker branch keeps today's behavior AND carries the new
#     node_id key as null (shape extension, no behavior change).
(
  d=$(mktemp -d)
  git -C "$d" init -q
  git -C "$d" remote add origin https://github.com/natb1/commons.systems.git
  git -C "$d" checkout -q -b 999-fixture
  git -C "$d" -c user.email=t@t -c user.name=t commit -q --allow-empty -m init
  ( cd "$d" && "$STAMP" --session-id sessNum --transcript-path "$d/sessNum.jsonl" )
  sc="$d/sessNum.dispatch-stamp.json"
  assert_eq "stamp: numeric branch .issue still numeric" "999" "$(jq -r .issue "$sc")"
  assert_eq "stamp: numeric branch has node_id key" "true" \
    "$(jq 'has("node_id")' "$sc")"
  assert_eq "stamp: numeric branch .node_id is null" "null" "$(jq -r .node_id "$sc")"
  rm -rf "$d"
)

# <<< END MOVED <<<

# ============================================================================
# --repo-dir / --only-if-absent (tactic-dispatch-worker-sidecar-cwd)
# ============================================================================
# A hook process does not necessarily run in the session's own working tree: a
# detached `claude --bg` worker born in its own worktree ran SessionStart with
# cwd = the MAIN checkout (on `main`), so the worker-branch gate no-opped and
# the sidecar was never written. --repo-dir takes the tree from the caller
# instead of from ambient cwd; --only-if-absent makes the Stop backstop a true
# create-if-missing.
echo ""
echo "=== dispatch-stamp-session --repo-dir / --only-if-absent ==="

# 19. --repo-dir stamps the SUPPLIED tree while cwd is a different checkout on
#     `main`. The paired no-flag assertion is load-bearing: it reproduces the
#     defect (ambient cwd = main checkout -> gate no-ops -> no sidecar), so the
#     positive case cannot pass for the wrong reason.
(
  d=$(mktemp -d)
  git -C "$d" init -q
  git -C "$d" remote add origin https://github.com/natb1/commons.systems.git
  git -C "$d" checkout -q -b 777-worker
  git -C "$d" -c user.email=t@t -c user.name=t commit -q --allow-empty -m init
  # A separate "main checkout" to run FROM — exactly the wrong tree.
  m=$(mktemp -d)
  git -C "$m" init -q
  git -C "$m" remote add origin https://github.com/natb1/other/elsewhere.git
  git -C "$m" checkout -q -b main
  git -C "$m" -c user.email=t@t -c user.name=t commit -q --allow-empty -m init

  # Control: no --repo-dir, cwd = main checkout -> gate no-ops, nothing written.
  rc=0
  ( cd "$m" && "$STAMP" --session-id sessRD0 --transcript-path "$d/sessRD0.jsonl" ) 2>/dev/null || rc=$?
  assert_eq "stamp: no --repo-dir from a main checkout exits 0" "0" "$rc"
  assert_eq "stamp: no --repo-dir from a main checkout writes NO sidecar (the defect)" "no" \
    "$([ -f "$d/sessRD0.dispatch-stamp.json" ] && echo yes || echo no)"

  # With --repo-dir the supplied tree decides every field.
  ( cd "$m" && "$STAMP" --session-id sessRD --transcript-path "$d/sessRD.jsonl" --repo-dir "$d" )
  sc="$d/sessRD.dispatch-stamp.json"
  assert_eq "stamp: --repo-dir writes sidecar from a foreign cwd" "yes" \
    "$([ -f "$sc" ] && echo yes || echo no)"
  assert_eq "stamp: --repo-dir .branch is the SUPPLIED tree's branch" "777-worker" "$(jq -r .branch "$sc")"
  assert_eq "stamp: --repo-dir .issue from the supplied tree" "777" "$(jq -r .issue "$sc")"
  assert_eq "stamp: --repo-dir .base_sha is the supplied tree's HEAD" \
    "$(git -C "$d" rev-parse HEAD)" "$(jq -r .base_sha "$sc")"
  assert_eq "stamp: --repo-dir .repo from the supplied tree's origin" \
    "natb1/commons.systems" "$(jq -r .repo "$sc")"
  rm -rf "$d" "$m"
)

# 20. --repo-dir on a tactic-<x> node-id tree: node_id == the branch, issue null.
(
  d=$(mktemp -d)
  git -C "$d" init -q
  git -C "$d" remote add origin https://github.com/natb1/commons.systems.git
  git -C "$d" checkout -q -b tactic-repo-dir-fixture
  git -C "$d" -c user.email=t@t -c user.name=t commit -q --allow-empty -m init
  m=$(mktemp -d)
  git -C "$m" init -q
  git -C "$m" checkout -q -b main
  git -C "$m" -c user.email=t@t -c user.name=t commit -q --allow-empty -m init
  ( cd "$m" && "$STAMP" --session-id sessRDN --transcript-path "$d/sessRDN.jsonl" --repo-dir "$d" )
  sc="$d/sessRDN.dispatch-stamp.json"
  assert_eq "stamp: --repo-dir node-id branch .node_id" "tactic-repo-dir-fixture" "$(jq -r .node_id "$sc")"
  assert_eq "stamp: --repo-dir node-id branch .issue is null" "null" "$(jq -r .issue "$sc")"
  rm -rf "$d" "$m"
)

# 21. --repo-dir pointing at a nonexistent path is a caller bug -> exit 2, and
#     nothing is written (no silent fallback to ambient cwd).
(
  d=$(mktemp -d)
  git -C "$d" init -q
  git -C "$d" remote add origin https://github.com/natb1/commons.systems.git
  git -C "$d" checkout -q -b 999-fixture
  git -C "$d" -c user.email=t@t -c user.name=t commit -q --allow-empty -m init
  rc=0
  ( cd "$d" && "$STAMP" --session-id sessRDX --transcript-path "$d/sessRDX.jsonl" \
      --repo-dir "$d/no-such-dir" ) 2>/dev/null || rc=$?
  assert_eq "stamp: --repo-dir nonexistent exits 2" "2" "$rc"
  assert_eq "stamp: --repo-dir nonexistent writes no sidecar" "no" \
    "$([ -f "$d/sessRDX.dispatch-stamp.json" ] && echo yes || echo no)"
  rm -rf "$d"
)

# 22. --only-if-absent over an EXISTING sidecar leaves it byte-identical and
#     exits 0. This is what makes the Stop backstop safe to fire on every turn
#     yield: the birth-time base_sha and a backfilled .pr are untouched, and
#     .stamped_at (which a normal re-stamp DOES advance) stays put too.
(
  d=$(mktemp -d)
  git -C "$d" init -q
  git -C "$d" remote add origin https://github.com/natb1/commons.systems.git
  git -C "$d" checkout -q -b 999-fixture
  git -C "$d" -c user.email=t@t -c user.name=t commit -q --allow-empty -m init
  sc="$d/sessOIA.dispatch-stamp.json"
  printf '%s\n' '{"schema":1,"session_id":"sessOIA","repo":"natb1/commons.systems","issue":999,"pr":4242,"branch":"999-fixture","base_sha":"birthsha","node_id":null,"stamped_at":"2026-01-01T00:00:00Z"}' > "$sc"
  cp "$sc" "$d/expected.json"
  rc=0
  ( cd "$d" && "$STAMP" --session-id sessOIA --transcript-path "$d/sessOIA.jsonl" \
      --repo-dir "$d" --only-if-absent ) 2>/dev/null || rc=$?
  assert_eq "stamp: --only-if-absent over existing sidecar exits 0" "0" "$rc"
  assert_eq "stamp: --only-if-absent leaves the sidecar byte-identical" "same" \
    "$(cmp -s "$sc" "$d/expected.json" && echo same || echo differs)"
  assert_eq "stamp: --only-if-absent preserves backfilled .pr" "4242" "$(jq -r .pr "$sc")"
  assert_eq "stamp: --only-if-absent preserves birth-time .base_sha" "birthsha" "$(jq -r .base_sha "$sc")"
  rm -rf "$d"
)

# 23. --only-if-absent with NO existing sidecar writes one (create-if-missing,
#     not never-write).
(
  d=$(mktemp -d)
  git -C "$d" init -q
  git -C "$d" remote add origin https://github.com/natb1/commons.systems.git
  git -C "$d" checkout -q -b 888-fixture
  git -C "$d" -c user.email=t@t -c user.name=t commit -q --allow-empty -m init
  rc=0
  ( cd "$d" && "$STAMP" --session-id sessOIB --transcript-path "$d/sessOIB.jsonl" \
      --repo-dir "$d" --only-if-absent ) 2>/dev/null || rc=$?
  sc="$d/sessOIB.dispatch-stamp.json"
  assert_eq "stamp: --only-if-absent with no sidecar exits 0" "0" "$rc"
  assert_eq "stamp: --only-if-absent with no sidecar writes one" "yes" \
    "$([ -f "$sc" ] && echo yes || echo no)"
  assert_eq "stamp: --only-if-absent written sidecar .issue" "888" "$(jq -r .issue "$sc")"
  assert_eq "stamp: --only-if-absent written sidecar .base_sha equals HEAD" \
    "$(git -C "$d" rev-parse HEAD)" "$(jq -r .base_sha "$sc")"
  rm -rf "$d"
)

# 24. --only-if-absent combined with --backfill-pr is incoherent -> exit 2
#     (matching the existing mode-mixing guard).
(
  root=$(mktemp -d)
  rc=0
  CLAUDE_CODE_SESSION_ID=sessX DISPATCH_STAMP_PROJECTS_ROOT="$root" \
    "$STAMP" --backfill-pr 5 --only-if-absent 2>/dev/null || rc=$?
  assert_eq "stamp: --only-if-absent + --backfill-pr exits 2" "2" "$rc"
  rm -rf "$root"
)

stamp_fold_tally
report_results
