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
#      post-push "parked ... (office_hours set on the origin/main content)"
#      confirmation -> exactly one mark-node-terminal call with `park`, wrapper
#      exits 1, and graph-commit's stderr is re-emitted to the caller.
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
# The parking path prints TWO things, in order: an ANNOUNCEMENT before the
# parking write is pushed, then either a post-push success CONFIRMATION or a
# failed-push error. Both variants exit 1. land-align-round must key its `park`
# marker on the confirmation, never on the announcement, so the two are kept as
# separate fixtures here and both are exercised.
PARK_ANNOUNCE="graph-commit: concurrent-edit conflict on t-node; parking node(s) — this writer's content is NOT landed"
PARK_LANDED="graph-commit: parked t-node (office_hours set on the origin/main content) and pushed the parking write to main"
PARK_UNLANDED="error: graph-commit: could not land the parking write for t-node — office_hours set locally but not pushed to main"
# A genuine, durable park: announcement followed by the post-push confirmation.
PARK_MSG="$PARK_ANNOUNCE
$PARK_LANDED"
# The announcement fired, but the parking write never reached main: origin/main
# still shows the node unparked, at a working phase, with office_hours null.
PARK_FAILED_PUSH_MSG="$PARK_ANNOUNCE
$PARK_UNLANDED"
BUSY_MSG="error: graph-commit: could not land on main after 5/5 attempts — cause: main busy; retry later"

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
out="$(run_lar 0 "" 0 --terminal t-node -m 'graph: round' t-node 2>&1)"; rc=$?
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
out="$(run_lar 0 "" 7 --terminal t-node -m 'graph: round' t-node 2>&1)"; rc=$?
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
out="$(run_lar 0 "" 0 --terminal t-parent --base /tmp/base-manifest.txt \
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
# Case 9: real-source ratchet. Extract the needle land-align-round ACTUALLY
# greps for (from the REAL land-align-round on disk, not the stub) and assert
# it is a literal substring of the REAL graph-commit's EMITTED text, AND that
# the harness's own PARK_MSG fixture also contains it. Without this case, a
# wording change to graph-commit's post-push park confirmation passes CI green
# while land-align-round silently falls through to its no-marker branch on a
# genuine concurrent-edit park in production — the exact defect this test suite
# exists to catch, just relocated one hop upstream.
#
# The ratchet also asserts the needle is ABSENT from PARK_FAILED_PUSH_MSG. That
# is the direction that matters most: a needle satisfied by the pre-push
# ANNOUNCEMENT alone would make land-align-round declare a `park` disposition
# for a park that never reached main. Both halves must hold.
#
# The graph-commit side is matched against EXECUTABLE text only. Each of the
# two `echo` call sites is preceded by a LOAD-BEARING-SUBSTRING comment block
# that repeats the needle verbatim, so a whole-file `grep -qF` would match the
# comments and stay green even if both `echo` lines were reworded away — the
# ratchet would be disarmed exactly where it is claimed to be strongest. So:
# strip comment lines, keep only lines whose first token is `echo`/`printf`,
# and pin the occurrence count so BOTH call sites must be maintained.
# ---------------------------------------------------------------------------
GC_REAL="$HARNESS_DIR/graph-commit"
[[ -f "$GC_REAL" ]] || { echo "error: graph-commit not found at $GC_REAL" >&2; exit 1; }

# Extract the quoted argument of land-align-round's `grep -qF -- "..."` call
# rather than hardcoding a 4th copy of the literal — a copy could drift from
# the real needle without this case ever noticing.
needle="$(grep -oP 'grep -qF -- "\K[^"]*(?=")' "$LAR_SCRIPT")"

if [[ -z "$needle" ]]; then
  no "real-source ratchet: extracted an EMPTY needle from land-align-round's 'grep -qF --' argument — the extraction regex is broken or the grep call was removed/reworded; refusing to vacuously pass"
else
  # Both post-push park CONFIRMATION branches in graph-commit emit the needle:
  # the bystander-prune branch and the plain branch. Both must keep it.
  GC_EMIT_EXPECTED=2
  gc_emit_count="$(grep -v '^[[:space:]]*#' "$GC_REAL" \
    | grep -E '^[[:space:]]*(echo|printf)[[:space:]]' \
    | grep -cF -- "$needle")"
  found_in_gc=0
  [[ "$gc_emit_count" -eq "$GC_EMIT_EXPECTED" ]] && found_in_gc=1
  found_in_park=0; grep -qF -- "$needle" <<<"$PARK_MSG" && found_in_park=1
  found_in_failed=0; grep -qF -- "$needle" <<<"$PARK_FAILED_PUSH_MSG" && found_in_failed=1
  if [[ $found_in_gc -eq 1 ]] && [[ $found_in_park -eq 1 ]] && [[ $found_in_failed -eq 0 ]]; then
    ok "real-source ratchet: the needle land-align-round greps for appears on exactly $GC_EMIT_EXPECTED of the REAL graph-commit's echo/printf lines (comments excluded) and in the landed-park fixture, and is ABSENT from the failed-push fixture"
  else
    no "real-source ratchet: needle '$needle' (extracted from land-align-round) graph-commit echo/printf occurrences=$gc_emit_count (expected $GC_EMIT_EXPECTED, comments excluded) found_in_PARK_MSG=$found_in_park (want 1) found_in_PARK_FAILED_PUSH_MSG=$found_in_failed (want 0) — the real-source coupling has drifted"
  fi
fi

# ---------------------------------------------------------------------------
echo
echo "land-align-round: $PASS passed, $FAIL failed"
[[ $FAIL -eq 0 ]]
