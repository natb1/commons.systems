#!/usr/bin/env bash
# Tests for dispatch-graph-main-red-sync -- moved verbatim from
# test-dispatch-scripts.sh (tactic-dispatch-test-monolith-split). Original
# section: 33124-33320.
#
# Sibling coverage note: test-graph-write-rollback.sh (a pre-existing file with
# its own ok/no harness) covers this same script's write-failure ROLLBACK path
# in its Cases 3/4. This file covers the completion-decision internals.
set -euo pipefail

FIXTURE_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=dispatch-test-fixture.sh
source "$FIXTURE_DIR/dispatch-test-fixture.sh"

# >>> MOVED FROM test-dispatch-scripts.sh >>>
# ============================================================================
# Test: dispatch-graph-main-red-sync — real internal completion logic
# (tactic-main-red-sync-completion-test)
# ============================================================================
# Exercises the REAL script (not the wholesale fake at ~21290): green+null ->
# complete; execution non-null -> skip (never preempt in-flight fix); red ->
# skip; probe-fail(UNKNOWN) -> skip; and stdout purity (only node ids, proving
# the completion subshell's `1>&2` redirect). Fixture is a miniature repo root
# so the script's SCRIPT_DIR/../../../.. math resolves inside it (same style as
# the graph-select-target / assert-worktree-fresh sections above). store.js is a
# fake plain-ESM module driven by env vars; npx (dump-node/write-node) and
# graph-commit are faked and only logged. node_modules is symlinked so
# `node --import tsx/esm` resolves tsx (which passes the plain-JS fake through).
echo "Test: dispatch-graph-main-red-sync — real completion internals"
REAL_REPO_ROOT="$(cd "$SCRIPT_DIR/../../../.." && pwd)"
MRS_ROOT=$(mktemp -d)
MRS_SCRIPTS="$MRS_ROOT/.claude/skills/dispatch-propagate/scripts"
MRS_LOG="$MRS_ROOT/logs"
mkdir -p "$MRS_SCRIPTS" "$MRS_ROOT/bin" "$MRS_LOG" \
         "$MRS_ROOT/packages/intentionsutil/src" \
         "$MRS_ROOT/packages/intentionsutil/scripts" \
         "$MRS_ROOT/intentions"
ln -s "$REAL_REPO_ROOT/node_modules" "$MRS_ROOT/node_modules"
# The real script's completion path shells out to
# `git -C "$REPO_ROOT" rev-parse origin/main:intentions/$node_id.md` to capture
# a pre-mutation blob for rollback (dispatch-graph-main-red-sync ~line 124), so
# the fixture root must itself be a tiny git repo with a `refs/remotes/origin/main`
# ref carrying an intentions/<id>.md blob for the node under test. A local
# `update-ref` is sufficient — no real remote/network is needed, `git rev-parse`
# only resolves the ref.
git -C "$MRS_ROOT" init -q
printf '# fixture node\n' > "$MRS_ROOT/intentions/tactic-main-red-cafebabe.md"
git -C "$MRS_ROOT" add intentions
git -C "$MRS_ROOT" -c user.email=fixture@test -c user.name=fixture commit -q -m init
git -C "$MRS_ROOT" update-ref refs/remotes/origin/main HEAD
# Real script under test — physical copy (REPO_ROOT derives from its location).
cp "$SCRIPT_DIR/dispatch-graph-main-red-sync" "$MRS_SCRIPTS/dispatch-graph-main-red-sync"
chmod +x "$MRS_SCRIPTS/dispatch-graph-main-red-sync"
# type:module so the fake store.js is treated as ESM (else `export` throws).
printf '{"type":"module","name":"fixture-intentionsutil"}\n' \
  > "$MRS_ROOT/packages/intentionsutil/package.json"
# Fake ESM store: ignores dir; listNodes/readNode driven by env vars.
cat > "$MRS_ROOT/packages/intentionsutil/src/store.js" <<'STORE'
export function listNodes(_dir) {
  return JSON.parse(process.env.FAKE_NODES || "[]");
}
export function readNode(_dir, id) {
  const map = JSON.parse(process.env.FAKE_EXECUTIONS || "{}");
  const execution = Object.prototype.hasOwnProperty.call(map, id) ? map[id] : null;
  return { id, phase: "implement", execution };
}
STORE
# Fake repo-health sibling (resolved via the script's SCRIPT_DIR). Mirrors the
# arg-dispatch stub at test-dispatch-scripts.sh:21281-21291.
cat > "$MRS_SCRIPTS/repo-health" <<'HEALTH'
#!/usr/bin/env bash
case "$1" in
  --main-broken-sha)
    if [[ -n "${FAKE_HEALTH_EXIT:-}" && "${FAKE_HEALTH_EXIT}" != "0" ]]; then
      exit "${FAKE_HEALTH_EXIT}"
    fi
    printf '%s' "${FAKE_MAIN_BROKEN_SHA:-}"
    ;;
esac
exit 0
HEALTH
chmod +x "$MRS_SCRIPTS/repo-health"
# Fake npx: only `npx tsx <path-ending dump-node.ts|write-node.ts> ...`; anything
# else fails loudly so an unexpected real-npx call can't be silently masked.
cat > "$MRS_ROOT/bin/npx" <<'NPX'
#!/usr/bin/env bash
if [[ "$1" != "tsx" ]]; then
  echo "fake npx: unexpected invocation: $*" >&2; exit 3
fi
shift
script="$1"; shift
case "$script" in
  *dump-node.ts)
    # `--dir <intentions-dir>` is a REQUIRED flag on the real dump-node.ts
    # (clarification 194/242); consume it here so its VALUE is not mistaken for
    # the node id by the positional catch-all below.
    outdir=""; id=""
    while [[ $# -gt 0 ]]; do
      case "$1" in
        --out-dir) outdir="$2"; shift 2 ;;
        --dir) shift 2 ;;
        *) id="$1"; shift ;;
      esac
    done
    echo "dump-node $id --out-dir $outdir" >> "$FAKE_LOG_DIR/dump-node.log"
    printf '{"id":"%s","phase":"implement"}\n' "$id" > "$outdir/$id.json"
    printf 'base-manifest-line\n' > "$outdir/base-manifest.txt"
    printf '%s\n' "$outdir/base-manifest.txt"   # stdout -> MANIFEST var
    ;;
  *write-node.ts)
    file=""
    while [[ $# -gt 0 ]]; do
      case "$1" in --file) file="$2"; shift 2 ;; *) shift ;; esac
    done
    echo "write-node --file $file" >> "$FAKE_LOG_DIR/write-node.log"
    printf 'wrote node -> %s\n' "$file"
    ;;
  *) echo "fake npx: unexpected tsx script: $script" >&2; exit 3 ;;
esac
exit 0
NPX
chmod +x "$MRS_ROOT/bin/npx"
# Fake graph-commit — run as a direct relative-path exec from cwd=REPO_ROOT.
cat > "$MRS_ROOT/packages/intentionsutil/scripts/graph-commit" <<'GC'
#!/usr/bin/env bash
base=""; id=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --base) base="$2"; shift 2 ;;
    -m) shift 2 ;;
    *) id="$1"; shift ;;
  esac
done
echo "graph-commit $id --base $base" >> "$FAKE_LOG_DIR/graph-commit.log"
exit 0
GC
chmod +x "$MRS_ROOT/packages/intentionsutil/scripts/graph-commit"

MRS_SCRIPT="$MRS_SCRIPTS/dispatch-graph-main-red-sync"
# 8 lowercase hex chars — must match the real script's anchored
# `^tactic-main-red-[0-9a-f]{8}$` filter (see dispatch-graph-main-red-sync's
# MAIN_RED_ID regex, fixed alongside this test's own genesis: a bare
# startsWith("tactic-main-red-") prefix test previously matched ANY tactic id
# merely beginning with that string — including this very tactic's own id,
# tactic-main-red-sync-completion-test — causing the live script to
# mechanically auto-complete it as though it were a real main-red-episode
# latch. A non-8-hex MRS_ID here (e.g. a 6-char "abc123") would silently fail
# to be recognized as "open" at all and every assertion below would break in
# a confusing way — keep it exactly 8 hex chars.
MRS_ID="tactic-main-red-cafebabe"
count_matches() { # <file> <pattern> -> single count (0 if file missing)
  if [[ -f "$1" ]]; then grep -c -- "$2" "$1" || true; else echo 0; fi
}
run_mrs() { # env vars come from caller (NAME=value words); clears logs first.
  # NOTE: caller-supplied NAME=value words arrive here via "$@" — a bash
  # function's "$@" is a runtime expansion, NOT literal source text, so bash's
  # assignment-prefix parsing (which only recognizes NAME=value written
  # literally before a command) does NOT apply to it; passing "$@" directly
  # before the script name would make those words the SCRIPT'S ARGUMENTS, not
  # environment variables. The external `env` command sidesteps this: env
  # parses its OWN leading NAME=value arguments (real runtime strings, not
  # source-level assignment-prefix parsing) and exports them for the command
  # it execs.
  rm -f "$MRS_LOG"/*.log
  env PATH="$MRS_ROOT/bin:$SAVED_PATH" FAKE_LOG_DIR="$MRS_LOG" \
    FAKE_NODES="[{\"id\":\"$MRS_ID\",\"phase\":\"implement\"}]" \
    "$@" "$MRS_SCRIPT" 2>/dev/null
}

# (a) open + green + execution null -> completion attempted, id still on stdout.
out=$(run_mrs FAKE_MAIN_BROKEN_SHA="" FAKE_EXECUTIONS='{}')
assert_eq "main-red-sync(a): stdout is only the open id" "$MRS_ID" "$out"
assert_eq "main-red-sync(a): dump-node ran for the id" "1" "$(count_matches "$MRS_LOG/dump-node.log" "$MRS_ID")"
assert_eq "main-red-sync(a): write-node ran"           "1" "$(count_matches "$MRS_LOG/write-node.log" "$MRS_ID.patched.json")"
assert_eq "main-red-sync(a): graph-commit ran for the id" "1" "$(count_matches "$MRS_LOG/graph-commit.log" "$MRS_ID")"

# (b) open + green + execution non-null -> completion SKIPPED (no preempt).
out=$(run_mrs FAKE_MAIN_BROKEN_SHA="" FAKE_EXECUTIONS="{\"$MRS_ID\":{\"prNumber\":7}}")
assert_eq "main-red-sync(b): stdout is only the open id" "$MRS_ID" "$out"
assert_eq "main-red-sync(b): dump-node NOT run"    "0" "$(count_matches "$MRS_LOG/dump-node.log" "$MRS_ID")"
assert_eq "main-red-sync(b): write-node NOT run"   "0" "$(count_matches "$MRS_LOG/write-node.log" "$MRS_ID")"
assert_eq "main-red-sync(b): graph-commit NOT run" "0" "$(count_matches "$MRS_LOG/graph-commit.log" "$MRS_ID")"

# (c) open + red (non-empty sha) -> no completion attempted at all.
out=$(run_mrs FAKE_MAIN_BROKEN_SHA="deadbeef" FAKE_EXECUTIONS='{}')
assert_eq "main-red-sync(c): stdout is only the open id" "$MRS_ID" "$out"
assert_eq "main-red-sync(c): dump-node NOT run"    "0" "$(count_matches "$MRS_LOG/dump-node.log" "$MRS_ID")"
assert_eq "main-red-sync(c): graph-commit NOT run" "0" "$(count_matches "$MRS_LOG/graph-commit.log" "$MRS_ID")"

# (d) probe failure (repo-health exit 1) -> MB_SHA=UNKNOWN -> no completion.
out=$(run_mrs FAKE_HEALTH_EXIT=1 FAKE_EXECUTIONS='{}')
assert_eq "main-red-sync(d): stdout is only the open id" "$MRS_ID" "$out"
assert_eq "main-red-sync(d): dump-node NOT run"    "0" "$(count_matches "$MRS_LOG/dump-node.log" "$MRS_ID")"
assert_eq "main-red-sync(d): graph-commit NOT run" "0" "$(count_matches "$MRS_LOG/graph-commit.log" "$MRS_ID")"

# (e) stdout purity is proven by the exact-equality assertion in case (a): the
# completion tools ran yet stdout equals ONLY the id — so the `) 1>&2` redirect
# held. A regression would leak dump-node/graph-commit chatter and fail (a).

# (f) a tactic id that merely STARTS WITH "tactic-main-red-" but is NOT the
# exact <8-hex> shortsha shape must be ignored entirely — it is not an open
# latch node at all, so it must not appear on stdout and must not be
# completed. Regression test for the anchored-regex fix (a bare startsWith
# prefix test previously matched this shape and caused
# tactic-main-red-sync-completion-test itself to be mistakenly auto-completed
# mid-decomposition).
LOOKALIKE_ID="tactic-main-red-sync-completion-test"
out=$(rm -f "$MRS_LOG"/*.log; env PATH="$MRS_ROOT/bin:$SAVED_PATH" FAKE_LOG_DIR="$MRS_LOG" \
  FAKE_NODES="[{\"id\":\"$LOOKALIKE_ID\",\"phase\":\"implement\"}]" \
  FAKE_MAIN_BROKEN_SHA="" FAKE_EXECUTIONS='{}' "$MRS_SCRIPT" 2>/dev/null)
assert_eq "main-red-sync(f): non-shortsha lookalike id produces no stdout" "" "$out"
assert_eq "main-red-sync(f): dump-node NOT run for lookalike" "0" "$(count_matches "$MRS_LOG/dump-node.log" "$LOOKALIKE_ID")"
assert_eq "main-red-sync(f): graph-commit NOT run for lookalike" "0" "$(count_matches "$MRS_LOG/graph-commit.log" "$LOOKALIKE_ID")"

# (g) --read-only: the SAME open+green+execution-null input as case (a), which
# there completed the node. With the flag the recovery-completion loop must not
# run at all — no dump-node, no write-node, no graph-commit — while the stdout
# protocol is unchanged. This is the mode every non-tick caller must use
# (dispatch-fleet-watch, a 5-minute systemd timer): completing these nodes
# re-arms the auto-merge gate, so a watchdog acting on a transient green
# repo-health reading would merge PRs onto a still-red main.
#
# NOTE: run_mrs cannot be reused here — its caller-supplied words land BEFORE
# the script name in an `env` invocation, where they are parsed as further
# NAME=value assignments, so a leading `--flag` would be taken as the command to
# exec. Script ARGUMENTS must be passed explicitly after "$MRS_SCRIPT" (same
# shape as case (f) above).
run_mrs_args() { # <script args...> — same env as run_mrs, args reach the script
  rm -f "$MRS_LOG"/*.log
  env PATH="$MRS_ROOT/bin:$SAVED_PATH" FAKE_LOG_DIR="$MRS_LOG" \
    FAKE_NODES="[{\"id\":\"$MRS_ID\",\"phase\":\"implement\"}]" \
    FAKE_MAIN_BROKEN_SHA="" FAKE_EXECUTIONS='{}' \
    "$MRS_SCRIPT" "$@" 2>/dev/null
}
for RO_FLAG in --read-only --no-complete; do
  out=$(run_mrs_args "$RO_FLAG")
  assert_eq "main-red-sync(g $RO_FLAG): stdout is still only the open id" "$MRS_ID" "$out"
  assert_eq "main-red-sync(g $RO_FLAG): dump-node NOT run"    "0" "$(count_matches "$MRS_LOG/dump-node.log" "$MRS_ID")"
  assert_eq "main-red-sync(g $RO_FLAG): write-node NOT run"   "0" "$(count_matches "$MRS_LOG/write-node.log" "$MRS_ID")"
  assert_eq "main-red-sync(g $RO_FLAG): graph-commit NOT run" "0" "$(count_matches "$MRS_LOG/graph-commit.log" "$MRS_ID")"
done

# (h) an unknown argument fails CLOSED: the script's contract is always exit 0,
# so it cannot signal a caller error through its status without risking a
# `|| true` swallowing it as "no open node / main healthy". It prints UNKNOWN
# instead, which every caller already treats as "do not treat main as healthy".
out=$(run_mrs_args --bogus)
rc=$?
assert_eq "main-red-sync(h): unknown argument prints UNKNOWN" "UNKNOWN" "$out"
assert_eq "main-red-sync(h): unknown argument still exits 0" "0" "$rc"
assert_eq "main-red-sync(h): unknown argument writes nothing" "0" "$(count_matches "$MRS_LOG/graph-commit.log" "$MRS_ID")"

rm -rf "$MRS_ROOT"

# <<< END MOVED <<<

report_results
