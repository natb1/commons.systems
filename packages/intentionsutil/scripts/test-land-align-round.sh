#!/usr/bin/env bash
#
# test-land-align-round.sh — functional harness for land-align-round, the
# /align-tactics landing wrapper that bundles the terminal-disposition marker
# write into the SAME process as the land
# (tactic-align-tactics-mark-terminal-skipped, Unit 1).
#
# Sibling-fake shape, mirroring test-park-node.sh's structure but far smaller:
# land-align-round resolves both of its collaborators through its own
# SCRIPT_DIR, so a scratch dir holding a copy of land-align-round next to
# argv-logging `graph-commit` and `mark-node-terminal` stubs exercises the real
# script with fully test-controlled exit codes and stderr. No git, no network,
# no node — the wrapper itself touches none of them.
#
# Covers:
#   1. graph-commit exit 0 -> exactly one mark-node-terminal call, args
#      `<terminal-node> align-round`, wrapper exits 0, and marker exit 0
#      produces NO warning text (the benign interactive/not-my-job skips must
#      stay silent).
#   2. graph-commit exit 1 WITH the concurrent-edit parking message AND its
#      post-push `graph-commit: verdict: parked ...` line -> exactly one
#      mark-node-terminal call with `park`, wrapper exits 1, and graph-commit's
#      stderr is re-emitted to the caller.
#   3. graph-commit exit 1 with the busy-main `... retry later` exhaustion
#      message -> ZERO marker calls (nothing landed, nothing parked, so there
#      is no disposition to declare), exit 1 propagated.
#   3b. graph-commit exit 1 with the parking ANNOUNCEMENT but a FAILED parking
#      push ("could not land the parking write ... office_hours set locally but
#      not pushed to main") -> ZERO marker calls. The announcement is printed
#      before the push is attempted, so it alone does not mean a park reached
#      main; declaring `park` here would let dispatch-self-close reap a job
#      whose content is unlanded while the tick's terminal-without-disposition
#      sweep skips the node.
#   4. graph-commit exit 2 (any other non-zero) -> zero marker calls, exit code
#      propagated verbatim.
#   5. mark-node-terminal itself exits non-zero after a successful land ->
#      wrapper STILL exits 0 (the best-effort guarantee: a marker write must
#      never demote a landed round to a script failure), AND the output
#      contains the non-fatal warning naming the node/disposition/exit code
#      plus the marker stub's own re-emitted stderr.
#   6. Missing --terminal -> exit 2 with a usage error and NO graph-commit call
#      (the target node is never inferred from the positional ids).
#   7. --base, -m, and the positional ids reach graph-commit unchanged,
#      including the multi-id batch form.
#   8. graph-commit exit 1 WITH the parking message AND a failing `park`
#      marker -> wrapper still exits 1, one `park` marker call, the warning is
#      emitted, and BOTH graph-commit's own stderr and the marker's stderr are
#      re-emitted without clobbering each other.

set -uo pipefail

HARNESS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LAR_SCRIPT="$HARNESS_DIR/land-align-round"
[[ -f "$LAR_SCRIPT" ]] || { echo "error: land-align-round not found at $LAR_SCRIPT" >&2; exit 1; }

WORK="$(mktemp -d)" || { echo "error: mktemp failed" >&2; exit 1; }
harness_cleanup() { rm -rf "$WORK"; }
trap harness_cleanup EXIT

PASS=0; FAIL=0
ok() { echo "PASS: $1"; PASS=$((PASS + 1)); }
no() { echo "FAIL: $1"; FAIL=$((FAIL + 1)); }

# graph-commit's real emissions, verbatim (including the em-dashes), so a
# drift in its messages surfaces here as a failure rather than as a silently
# unwritten — or, worse, a silently FALSE — park marker in production.
#
# Since tactic-graph-commit-landing-signal-unreliable Unit 5, land-align-round
# keys off graph-commit's own `graph-commit: verdict: <status> ids=... ...`
# line (print_verdict()/_emit_verdict_line() in graph-commit), not off prose or
# rc alone. Every fixture below therefore carries a verdict line matching what
# the real graph-commit would emit for that scenario, in addition to the
# human-readable prose that a real run would also print alongside it.
#
# The parking path prints TWO things, in order: an ANNOUNCEMENT before the
# parking write is pushed, then either a post-push success CONFIRMATION (with a
# `verdict: parked` line) or a failed-push error (with a `verdict: not-landed`
# or `verdict: unknown` line). Both variants exit 1. land-align-round must key
# its `park` marker on the verdict line, never on the announcement, so the two
# are kept as separate fixtures here and both are exercised.
PARK_ANNOUNCE="graph-commit: concurrent-edit conflict on t-node; parking node(s) — this writer's content is NOT landed"
PARK_LANDED="graph-commit: parked t-node and pushed the parking write to main"
PARK_LANDED_VERDICT="graph-commit: verdict: parked ids=t-node pushed=abcd000 main=1234abc context=park — the parking commit abcd000 is on origin/main"
PARK_UNLANDED="error: graph-commit: could not land the parking write for t-node — office_hours set locally but not pushed to main"
PARK_UNLANDED_VERDICT="graph-commit: verdict: not-landed ids=t-node pushed=none main=1234abc context=park — origin/main does not carry this invocation's intended content"
LANDED_VERDICT="graph-commit: verdict: landed ids=t-node pushed=abc1234 main=def5678 context=push-reported-success — abc1234 is an ancestor of origin/main"
# A genuine, durable park: announcement, post-push confirmation, then the
# verdict line that actually drives land-align-round's branch.
PARK_MSG="$PARK_ANNOUNCE
$PARK_LANDED
$PARK_LANDED_VERDICT"
# The announcement fired, but the parking write never reached main: origin/main
# still shows the node unparked, at a working phase, with office_hours null —
# so the verdict line reports `not-landed`, not `parked`.
PARK_FAILED_PUSH_MSG="$PARK_ANNOUNCE
$PARK_UNLANDED
$PARK_UNLANDED_VERDICT"
BUSY_VERDICT="graph-commit: verdict: not-landed ids=t-node pushed=none main=1234abc context=busy-exhausted — origin/main does not carry this invocation's intended content"
BUSY_MSG="error: graph-commit: could not land on main after 5/5 attempts — cause: main busy; retry later
$BUSY_VERDICT"

# --- Scratch script dir with argv-logging stubs ------------------------------
SD="$WORK/scripts"
mkdir -p "$SD"
cp "$LAR_SCRIPT" "$SD/land-align-round"
chmod +x "$SD/land-align-round"

cat >"$SD/graph-commit" <<'SH'
#!/usr/bin/env bash
# argv-logging graph-commit stub. GC_LOG records the full argv (one arg per
# line, delimited by a per-call marker); GC_STDERR is emitted verbatim on
# stderr; GC_RC is the exit code.
{
  echo "--- call"
  for a in "$@"; do echo "$a"; done
} >>"$GC_LOG"
[[ -n "${GC_STDERR:-}" ]] && printf '%s\n' "$GC_STDERR" >&2
exit "${GC_RC:-0}"
SH

cat >"$SD/mark-node-terminal" <<'SH'
#!/usr/bin/env bash
# argv-logging mark-node-terminal stub: one line per call, `<node> <disposition>`.
# On a non-zero MNT_RC, also emit a distinctive stderr line so the
# 'captured marker stderr is re-emitted by land-align-round' assertion is
# meaningful rather than trivially true.
echo "$*" >>"$MNT_LOG"
if [[ "${MNT_RC:-0}" -ne 0 ]]; then
  echo "MOCK-MARK-NODE-TERMINAL-STDERR: simulated marker failure" >&2
fi
exit "${MNT_RC:-0}"
SH
chmod +x "$SD/graph-commit" "$SD/mark-node-terminal"

GC_LOG="$WORK/gc.log"
MNT_LOG="$WORK/mnt.log"

run_lar() { # <gc-rc> <gc-stderr> <mnt-rc> [land-align-round args...]
  local gc_rc="$1" gc_stderr="$2" mnt_rc="$3"; shift 3
  : >"$GC_LOG"; : >"$MNT_LOG"
  (
    export GC_LOG MNT_LOG
    export GC_RC="$gc_rc" GC_STDERR="$gc_stderr" MNT_RC="$mnt_rc"
    bash "$SD/land-align-round" "$@"
  )
}

# `grep -c` exits 1 on zero matches, so the count is captured first and the
# fallback assigned separately — `grep -c ... || echo 0` would print BOTH the
# grep's own "0" and the fallback's, yielding a two-line non-numeric result.
mnt_calls() { local n; n=$(grep -c . "$MNT_LOG" 2>/dev/null) || n=0; echo "$n"; }
gc_calls() { local n; n=$(grep -c '^--- call$' "$GC_LOG" 2>/dev/null) || n=0; echo "$n"; }

# ---------------------------------------------------------------------------
# Case 1: clean land -> exactly one `align-round` marker, exit 0.
# ---------------------------------------------------------------------------
out="$(run_lar 0 "$LANDED_VERDICT" 0 --terminal t-node -m 'graph: round' t-node 2>&1)"; rc=$?
if [[ $rc -eq 0 ]] && [[ "$(mnt_calls)" -eq 1 ]] \
   && [[ "$(cat "$MNT_LOG")" == "t-node align-round" ]] \
   && ! grep -qF -- "warning: mark-node-terminal" <<<"$out"; then
  ok "clean land: exactly one mark-node-terminal call with '<node> align-round', wrapper exits 0, NO warning on a clean marker exit"
else
  no "clean land (rc=$rc calls=$(mnt_calls) log='$(cat "$MNT_LOG")')"; printf '%s\n' "$out"
fi

# ---------------------------------------------------------------------------
# Case 2: exit 1 with the parking message -> one `park` marker, exit 1, stderr
# re-emitted.
# ---------------------------------------------------------------------------
out="$(run_lar 1 "$PARK_MSG" 0 --terminal t-node -m 'graph: round' t-node 2>&1)"; rc=$?
if [[ $rc -eq 1 ]] && [[ "$(mnt_calls)" -eq 1 ]] \
   && [[ "$(cat "$MNT_LOG")" == "t-node park" ]] \
   && grep -qF -- "parking node(s)" <<<"$out"; then
  ok "parking-message exit 1: exactly one marker call with 'park', exit 1, graph-commit stderr re-emitted"
else
  no "parking-message exit 1 (rc=$rc calls=$(mnt_calls) log='$(cat "$MNT_LOG")')"; printf '%s\n' "$out"
fi

# ---------------------------------------------------------------------------
# Case 3: busy-main exhaustion exit 1 -> zero markers, exit 1.
# ---------------------------------------------------------------------------
# Nothing landed and nothing was parked, so there is no terminal disposition to
# declare: writing one here would make an un-landed round reapable.
out="$(run_lar 1 "$BUSY_MSG" 0 --terminal t-node -m 'graph: round' t-node 2>&1)"; rc=$?
if [[ $rc -eq 1 ]] && [[ "$(mnt_calls)" -eq 0 ]] \
   && grep -qF -- "retry later" <<<"$out"; then
  ok "busy-main exit 1: zero marker calls, exit 1 propagated, stderr re-emitted"
else
  no "busy-main exit 1 (rc=$rc calls=$(mnt_calls) log='$(cat "$MNT_LOG")')"; printf '%s\n' "$out"
fi

# ---------------------------------------------------------------------------
# Case 3b: the parking ANNOUNCEMENT fired but the parking push FAILED -> zero
# markers, exit 1.
# ---------------------------------------------------------------------------
# graph-commit prints the announcement before it attempts to push the parking
# write; when that push fails it prints "could not land the parking write ...
# office_hours set locally but not pushed to main" and still exits 1. Nothing
# reached origin/main: the node is unparked, at a working phase, office_hours
# null. Writing a `park` marker here would let dispatch-self-close reap the job
# and its worktree — destroying the only copy of this writer's content — while
# the tick's terminal-without-disposition sweep skips the node because a
# disposition was declared. Discriminating: a wrapper that greps the
# announcement instead of the confirmation writes one marker here and fails.
out="$(run_lar 1 "$PARK_FAILED_PUSH_MSG" 0 --terminal t-node -m 'graph: round' t-node 2>&1)"; rc=$?
if [[ $rc -eq 1 ]] && [[ "$(mnt_calls)" -eq 0 ]] \
   && grep -qF -- "office_hours set locally but not pushed to main" <<<"$out"; then
  ok "parking announcement with a FAILED parking push: zero marker calls (no park landed on main), exit 1 propagated, stderr re-emitted"
else
  no "failed parking push (rc=$rc calls=$(mnt_calls) log='$(cat "$MNT_LOG")')"; printf '%s\n' "$out"
fi

# ---------------------------------------------------------------------------
# Case 4: any other non-zero exit -> zero markers, exit code propagated.
# ---------------------------------------------------------------------------
out="$(run_lar 2 "graph-commit: usage error" 0 --terminal t-node -m 'graph: round' t-node 2>&1)"; rc=$?
if [[ $rc -eq 2 ]] && [[ "$(mnt_calls)" -eq 0 ]]; then
  ok "graph-commit exit 2: zero marker calls, exit code propagated verbatim"
else
  no "graph-commit exit 2 (rc=$rc calls=$(mnt_calls))"; printf '%s\n' "$out"
fi

# ---------------------------------------------------------------------------
# Case 5: a failing marker write does NOT demote a landed round, but IS warned
# about, with the marker's own stderr re-emitted.
# ---------------------------------------------------------------------------
out="$(run_lar 0 "$LANDED_VERDICT" 7 --terminal t-node -m 'graph: round' t-node 2>&1)"; rc=$?
if [[ $rc -eq 0 ]] && [[ "$(mnt_calls)" -eq 1 ]] \
   && grep -qF -- "warning: mark-node-terminal t-node align-round failed (exit 7)" <<<"$out" \
   && grep -qF -- "MOCK-MARK-NODE-TERMINAL-STDERR" <<<"$out"; then
  ok "marker write fails after a successful land: wrapper still exits 0 (best-effort), warning + marker stderr surfaced"
else
  no "marker-failure tolerance (rc=$rc calls=$(mnt_calls))"; printf '%s\n' "$out"
fi

# ---------------------------------------------------------------------------
# Case 6: missing --terminal -> exit 2, usage error, no graph-commit call.
# ---------------------------------------------------------------------------
out="$(run_lar 0 "" 0 -m 'graph: round' t-node 2>&1)"; rc=$?
if [[ $rc -eq 2 ]] && [[ "$(gc_calls)" -eq 0 ]] && [[ "$(mnt_calls)" -eq 0 ]] \
   && grep -qF -- "--terminal" <<<"$out"; then
  ok "missing --terminal: exit 2 with a usage error, no graph-commit call, no marker call"
else
  no "missing --terminal (rc=$rc gc_calls=$(gc_calls))"; printf '%s\n' "$out"
fi

# ---------------------------------------------------------------------------
# Case 7: --base, -m and the positional ids pass through unchanged (batch form).
# ---------------------------------------------------------------------------
out="$(run_lar 0 "$LANDED_VERDICT" 0 --terminal t-parent --base /tmp/base-manifest.txt \
        -m 'graph: land round with children' t-parent t-child-a t-child-b 2>&1)"; rc=$?
expected=$'--- call\n--base\n/tmp/base-manifest.txt\n-m\ngraph: land round with children\nt-parent\nt-child-a\nt-child-b'
actual="$(cat "$GC_LOG")"
if [[ $rc -eq 0 ]] && [[ "$actual" == "$expected" ]] \
   && [[ "$(cat "$MNT_LOG")" == "t-parent align-round" ]]; then
  ok "pass-through: --base/-m/multi-id batch reach graph-commit unchanged; marker names --terminal's node, not a positional id"
else
  no "pass-through (rc=$rc)"; printf 'argv:\n%s\n' "$actual"; printf '%s\n' "$out"
fi

# ---------------------------------------------------------------------------
# Case 8: parking path (graph-commit exit 1 with the parking message) AND a
# failing `park` marker -> wrapper still exits 1, one `park` marker call, the
# warning is emitted, and BOTH graph-commit's own stderr and the marker's
# stderr are re-emitted without clobbering each other.
# ---------------------------------------------------------------------------
out="$(run_lar 1 "$PARK_MSG" 3 --terminal t-node -m 'graph: round' t-node 2>&1)"; rc=$?
if [[ $rc -eq 1 ]] && [[ "$(mnt_calls)" -eq 1 ]] \
   && [[ "$(cat "$MNT_LOG")" == "t-node park" ]] \
   && grep -qF -- "parking node(s)" <<<"$out" \
   && grep -qF -- "warning: mark-node-terminal t-node park failed (exit 3)" <<<"$out" \
   && grep -qF -- "MOCK-MARK-NODE-TERMINAL-STDERR" <<<"$out"; then
  ok "parking path with a failing park marker: exit 1, one 'park' call, warning + both stderr streams re-emitted intact"
else
  no "parking path with failing marker (rc=$rc calls=$(mnt_calls) log='$(cat "$MNT_LOG")')"; printf '%s\n' "$out"
fi

# ---------------------------------------------------------------------------
# Case 9: real-source ratchet. Extract the TWO regexes land-align-round
# ACTUALLY greps its captured stderr for (from the REAL land-align-round on
# disk, not the stub) — one for the landed branch, one for the parked branch —
# and assert: (a) both are anchored on the literal prefix the REAL
# graph-commit's `_emit_verdict_line()` actually emits before `$status`; (b)
# the real graph-commit source actually invokes `_emit_verdict_line` with the
# literal status words `landed`, `landed-equivalent`, and `parked` somewhere;
# and (c) each regex matches exactly the fixtures it should and none of the
# fixtures it should not. Without this case, a wording change to graph-commit's
# verdict-line prefix or status vocabulary passes CI green while
# land-align-round silently falls through to its no-marker branch on a genuine
# landed/parked round in production — the exact defect this test suite exists
# to catch, just relocated one hop upstream (from prose to the verdict-line
# contract).
# ---------------------------------------------------------------------------
GC_REAL="$HARNESS_DIR/graph-commit"
[[ -f "$GC_REAL" ]] || { echo "error: graph-commit not found at $GC_REAL" >&2; exit 1; }

# Extract, in file order, the two `grep -qE '...'` patterns land-align-round
# actually branches on — landed first, then parked — rather than hardcoding a
# second copy that could drift from the real needles without this case ever
# noticing.
mapfile -t needles < <(grep -oP "grep -qE '\K[^']+(?=')" "$LAR_SCRIPT")
landed_needle="${needles[0]:-}"
parked_needle="${needles[1]:-}"

# The literal prefix the real graph-commit's _emit_verdict_line() emits before
# the `$status` variable — extracted from its own echo format string, not
# hardcoded, so a prefix rewording there is caught too.
gc_prefix="$(grep -oP 'echo "\Kgraph-commit: verdict: (?=\$status)' "$GC_REAL" | head -1)"

if [[ -z "$landed_needle" || -z "$parked_needle" ]]; then
  no "real-source ratchet: could not extract both 'grep -qE' patterns from land-align-round — extraction regex is broken or a grep call was removed/reworded; refusing to vacuously pass"
elif [[ -z "$gc_prefix" ]]; then
  no "real-source ratchet: could not extract graph-commit's verdict-line prefix from _emit_verdict_line()'s echo — refusing to vacuously pass"
else
  prefix_ok=0
  [[ "${landed_needle#^}" == "${gc_prefix}"* && "${parked_needle#^}" == "${gc_prefix}"* ]] && prefix_ok=1

  # The status words land-align-round's regexes name must actually be literals
  # graph-commit produces as a verdict status: `landed` and `parked` are
  # passed straight to _emit_verdict_line as literal first arguments;
  # `landed-equivalent` is instead assigned to the local `verdict` var (the
  # content-equivalence branch) and passed through indirectly, so it is
  # checked as a bare status-word literal rather than requiring it immediately
  # after `_emit_verdict_line`.
  words_ok=0
  if grep -qE '_emit_verdict_line[[:space:]]+landed[[:space:]]' "$GC_REAL" \
     && grep -qF 'verdict="landed-equivalent"' "$GC_REAL" \
     && grep -qE '_emit_verdict_line[[:space:]]+parked[[:space:]]' "$GC_REAL"; then
    words_ok=1
  fi

  # Each regex must match exactly the fixtures that represent its own verdict,
  # and NEITHER the pre-push announcement alone nor an unsatisfied verdict for
  # the same context.
  landed_match_ok=0
  [[ "$LANDED_VERDICT" =~ $landed_needle ]] \
    && ! [[ "$PARK_LANDED_VERDICT" =~ $landed_needle ]] \
    && ! [[ "$PARK_UNLANDED_VERDICT" =~ $landed_needle ]] \
    && ! [[ "$BUSY_VERDICT" =~ $landed_needle ]] \
    && landed_match_ok=1

  parked_match_ok=0
  [[ "$PARK_LANDED_VERDICT" =~ $parked_needle ]] \
    && ! [[ "$PARK_UNLANDED_VERDICT" =~ $parked_needle ]] \
    && ! [[ "$BUSY_VERDICT" =~ $parked_needle ]] \
    && ! [[ "$LANDED_VERDICT" =~ $parked_needle ]] \
    && parked_match_ok=1

  # And the two full multi-line fixtures land-align-round actually receives as
  # stderr must resolve the way the branches above require: PARK_MSG contains
  # the parked verdict line (park marker fires), PARK_FAILED_PUSH_MSG does not
  # (no marker fires).
  fixtures_ok=0
  grep -qE -- "$parked_needle" <<<"$PARK_MSG" \
    && ! grep -qE -- "$parked_needle" <<<"$PARK_FAILED_PUSH_MSG" \
    && ! grep -qE -- "$parked_needle" <<<"$BUSY_MSG" \
    && fixtures_ok=1

  if [[ $prefix_ok -eq 1 && $words_ok -eq 1 && $landed_match_ok -eq 1 \
        && $parked_match_ok -eq 1 && $fixtures_ok -eq 1 ]]; then
    ok "real-source ratchet: land-align-round's landed/parked verdict-line regexes are anchored on graph-commit's real verdict-line prefix, graph-commit really emits the landed/landed-equivalent/parked status words, and each regex matches only the fixtures it should"
  else
    no "real-source ratchet: landed_needle='$landed_needle' parked_needle='$parked_needle' gc_prefix='$gc_prefix' prefix_ok=$prefix_ok words_ok=$words_ok landed_match_ok=$landed_match_ok parked_match_ok=$parked_match_ok fixtures_ok=$fixtures_ok — the real-source coupling has drifted"
  fi
fi

# ---------------------------------------------------------------------------
echo
echo "land-align-round: $PASS passed, $FAIL failed"
[[ $FAIL -eq 0 ]]
