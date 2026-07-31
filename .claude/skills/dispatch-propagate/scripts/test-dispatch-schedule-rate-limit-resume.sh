#!/usr/bin/env bash
# Tests for dispatch-schedule-rate-limit-resume -- moved verbatim from test-dispatch-scripts.sh
# (tactic-dispatch-test-monolith-split). Original section: 27424-27776.
set -euo pipefail

FIXTURE_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=dispatch-test-fixture.sh
source "$FIXTURE_DIR/dispatch-test-fixture.sh"

# >>> MOVED FROM test-dispatch-scripts.sh >>>
# ============================================================================
# dispatch-schedule-rate-limit-resume tests (#1733)
# ============================================================================
#
# Exercises the backed-off resume scheduler: reads the highest
# dispatch:rate-limit-retry-<n> label on the ISSUE → CUR; under cap, bumps the
# counter, computes DELAY=min(BASE*2^CUR, MAX), FIRE=NOW+DELAY, and arms a
# transient systemd.user timer whose ExecStart is
# `dispatch-resume-worker <name> <cwd> <sessionId> <model> <effort>`; at cap (CUR>=CAP)
# parks office-hours, prints `escalated`, and arms NO timer.
#
# Mirrors the dispatch-schedule-target-reseed harness exactly:
#   $TMPDIR_TEST/scripts/      copy of the script + lib.sh
#   $TMPDIR_TEST/bin/          systemd-run / fake-gh / fake-oh / systemctl stubs
#   $TMPDIR_TEST/systemd-log   recorded systemd-run argv (one line per call)
#   $TMPDIR_TEST/gh-edit-log   recorded fake-gh issue-edit / label-create argv
#   $TMPDIR_TEST/oh-log        recorded fake dispatch-apply-office-hours argv
#   $TMPDIR_TEST/main/         a synthetic main worktree path
#
# gh stub contract: `issue view ... --jq ...` echoes the test-controlled CUR
# directly ($FAKE_CUR, default 0) — the same numeric-echo contract the
# target-reseed harness uses for `pr view`, bypassing the real --jq so the test
# controls the counter without constructing a labels JSON. `issue edit` /
# `label create` record their argv to gh-edit-log and exit 0.
echo ""
echo "=== dispatch-schedule-rate-limit-resume ==="

srl_setup() {
  TMPDIR_TEST=$(mktemp -d)
  mkdir -p "$TMPDIR_TEST/scripts" "$TMPDIR_TEST/bin" "$TMPDIR_TEST/main"

  cp "$SCRIPT_DIR/dispatch-schedule-rate-limit-resume" \
    "$TMPDIR_TEST/scripts/dispatch-schedule-rate-limit-resume"
  # The script sources lib.sh via its SCRIPT_DIR — so lib.sh must sit alongside.
  cp "$SCRIPT_DIR/lib.sh" "$TMPDIR_TEST/scripts/lib.sh"
  chmod +x "$TMPDIR_TEST/scripts/dispatch-schedule-rate-limit-resume"

  export DISPATCH_RATE_LIMIT_RESUME_MAIN_WORKTREE="$TMPDIR_TEST/main"
  export DISPATCH_RATE_LIMIT_RESUME_NOW=1000000000
  export DISPATCH_RATE_LIMIT_RESUME_BASE=60
  export DISPATCH_RATE_LIMIT_RESUME_MAX=900
  export DISPATCH_RATE_LIMIT_RESUME_CAP=5

  # systemd-run stub: records its argv (one line per call), exits 0.
  cat > "$TMPDIR_TEST/bin/systemd-run" <<STUB
#!/usr/bin/env bash
echo "\$*" >> "$TMPDIR_TEST/systemd-log"
STUB
  chmod +x "$TMPDIR_TEST/bin/systemd-run"
  export DISPATCH_RATE_LIMIT_RESUME_SYSTEMD_RUN_CMD="$TMPDIR_TEST/bin/systemd-run"

  # fake gh: `issue view ... --jq ...` echoes the test-controlled CUR
  # ($FAKE_CUR, default 0 — the script consumes the jq result as the integer
  # counter). `issue edit` / `label create` record their argv to a log + exit 0.
  cat > "$TMPDIR_TEST/bin/fake-gh" <<STUB
#!/usr/bin/env bash
if [[ "\$1" == "issue" && "\$2" == "view" ]]; then
  echo "\${FAKE_CUR:-0}"
  exit 0
fi
echo "\$*" >> "$TMPDIR_TEST/gh-edit-log"
exit 0
STUB
  chmod +x "$TMPDIR_TEST/bin/fake-gh"
  export DISPATCH_RATE_LIMIT_RESUME_GH_CMD="$TMPDIR_TEST/bin/fake-gh"

  # fake dispatch-apply-office-hours: records its argv to a log, exits 0.
  cat > "$TMPDIR_TEST/bin/fake-oh" <<STUB
#!/usr/bin/env bash
echo "\$*" >> "$TMPDIR_TEST/oh-log"
STUB
  chmod +x "$TMPDIR_TEST/bin/fake-oh"
  export DISPATCH_RATE_LIMIT_RESUME_OFFICE_HOURS_CMD="$TMPDIR_TEST/bin/fake-oh"

  # The script calls ensure_recover_unit (lib.sh) before scheduling. Point its
  # unit dir into the tmp tree and its systemctl at a no-op stub so the call
  # never writes outside the test sandbox (same as the target-reseed harness).
  cat > "$TMPDIR_TEST/bin/systemctl" <<'STUB'
#!/usr/bin/env bash
exit 0
STUB
  chmod +x "$TMPDIR_TEST/bin/systemctl"
  export DISPATCH_RECOVER_UNIT_DIR="$TMPDIR_TEST/systemd-user"
  export DISPATCH_RECOVER_SYSTEMCTL_CMD="$TMPDIR_TEST/bin/systemctl"
  export DISPATCH_SWEEP_TIMER_UNIT_DIR="$TMPDIR_TEST/systemd-user"
  export DISPATCH_SWEEP_TIMER_SYSTEMCTL_CMD="$TMPDIR_TEST/bin/systemctl"
  export DISPATCH_HEARTBEAT_UNIT_DIR="$TMPDIR_TEST/systemd-user"
  export DISPATCH_HEARTBEAT_SYSTEMCTL_CMD="$TMPDIR_TEST/bin/systemctl"
}

srl_teardown() {
  rm -rf "$TMPDIR_TEST"
  TMPDIR_TEST=""
  unset DISPATCH_RATE_LIMIT_RESUME_MAIN_WORKTREE
  unset DISPATCH_RATE_LIMIT_RESUME_NOW
  unset DISPATCH_RATE_LIMIT_RESUME_BASE
  unset DISPATCH_RATE_LIMIT_RESUME_MAX
  unset DISPATCH_RATE_LIMIT_RESUME_CAP
  unset DISPATCH_RATE_LIMIT_RESUME_SYSTEMD_RUN_CMD
  unset DISPATCH_RATE_LIMIT_RESUME_GH_CMD
  unset DISPATCH_RATE_LIMIT_RESUME_OFFICE_HOURS_CMD
  unset FAKE_CUR
  unset DISPATCH_RECOVER_UNIT_DIR DISPATCH_RECOVER_SYSTEMCTL_CMD DISPATCH_SWEEP_TIMER_UNIT_DIR DISPATCH_SWEEP_TIMER_SYSTEMCTL_CMD DISPATCH_HEARTBEAT_UNIT_DIR DISPATCH_HEARTBEAT_SYSTEMCTL_CMD
}

# srl_run <CUR> — run the scheduler with the given CUR and standard positionals,
# capturing stdout into $out and rc into $rc. Positionals are the script's CLI:
#   <N> <sessionId> <cwd> <name> [<model>]
srl_run() {
  export FAKE_CUR="$1"
  if out=$("$TMPDIR_TEST/scripts/dispatch-schedule-rate-limit-resume" \
             1733 sess-abc /work/cwd worker-name claude-opus \
             2>"$TMPDIR_TEST/stderr"); then rc=0; else rc=$?; fi
}

# --- Test 1: CUR=0 → DELAY=BASE (60), FIRE=NOW+60, applies attempt-1 ----------
echo "Test: CUR=0 → FIRE=NOW+60, attempt-1 applied, ExecStart shape correct"
srl_setup
srl_run 0
assert_eq "CUR=0 exits 0" "0" "$rc"
assert_eq "CUR=0 stdout names unit + FIRE (NOW+60)" \
  "reseeded dispatch-rate-limit-resume-1733-1000000060 at 1000000060" "$out"
log=$(cat "$TMPDIR_TEST/systemd-log" 2>/dev/null || true)
TOTAL=$((TOTAL + 1))
if [[ "$log" == *"--unit=dispatch-rate-limit-resume-1733-1000000060"* \
   && "$log" == *"--on-calendar=@1000000060"* \
   && "$log" == *"--property=OnFailure=dispatch-tick-recover.service"* \
   && "$log" == *"--working-directory=$TMPDIR_TEST/main"* \
   && "$log" == *"--timer-property=Persistent=true"* \
   && "$log" == *"--property=KillMode=process"* \
   && "$log" == *"--setenv=PATH="* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: CUR=0 systemd-run argv (unit + calendar@FIRE + OnFailure + Persistent + KillMode + cwd + setenv)"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: CUR=0 systemd-run argv (unit + calendar@FIRE + OnFailure + Persistent + KillMode + cwd + setenv)"
  echo "    log: $log"
fi
# ExecStart: dispatch-resume-worker with the positionals in OWN order
# <name> <cwd> <sessionId> <model> <effort>. srl_run passes no effort, so the
# trailing effort positional is empty here — substring-match the non-empty head.
TOTAL=$((TOTAL + 1))
if [[ "$log" == *"/dispatch-resume-worker worker-name /work/cwd sess-abc claude-opus"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: CUR=0 ExecStart names dispatch-resume-worker with <name> <cwd> <sessionId> <model>"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: CUR=0 ExecStart names dispatch-resume-worker with <name> <cwd> <sessionId> <model>"
  echo "    log: $log"
fi
edits=$(cat "$TMPDIR_TEST/gh-edit-log" 2>/dev/null || true)
TOTAL=$((TOTAL + 1))
if [[ "$edits" == *"--add-label dispatch:rate-limit-retry-1"* \
   && "$edits" != *"--remove-label"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: CUR=0 applies retry-1 with no remove (CUR was 0)"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: CUR=0 applies retry-1 with no remove (CUR was 0)"
  echo "    edits: $edits"
fi
srl_teardown

# --- Test 2: CUR=1 → FIRE=NOW+120, removes retry-1, applies retry-2 -----------
echo "Test: CUR=1 → FIRE=NOW+120 (BASE*2), counter bumped retry-1→retry-2"
srl_setup
srl_run 1
assert_eq "CUR=1 exits 0" "0" "$rc"
assert_eq "CUR=1 stdout FIRE=NOW+120" \
  "reseeded dispatch-rate-limit-resume-1733-1000000120 at 1000000120" "$out"
edits=$(cat "$TMPDIR_TEST/gh-edit-log" 2>/dev/null || true)
TOTAL=$((TOTAL + 1))
if [[ "$edits" == *"--remove-label dispatch:rate-limit-retry-1"* \
   && "$edits" == *"--add-label dispatch:rate-limit-retry-2"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: CUR=1 removes retry-1 and adds retry-2"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: CUR=1 removes retry-1 and adds retry-2"
  echo "    edits: $edits"
fi
srl_teardown

# --- Test 3: CUR=2 → FIRE=NOW+240 (BASE*4) -----------------------------------
echo "Test: CUR=2 → FIRE=NOW+240 (BASE*4)"
srl_setup
srl_run 2
assert_eq "CUR=2 stdout FIRE=NOW+240" \
  "reseeded dispatch-rate-limit-resume-1733-1000000240 at 1000000240" "$out"
srl_teardown

# --- Test 4: CUR=3 → FIRE=NOW+480 (BASE*8) -----------------------------------
echo "Test: CUR=3 → FIRE=NOW+480 (BASE*8)"
srl_setup
srl_run 3
assert_eq "CUR=3 stdout FIRE=NOW+480" \
  "reseeded dispatch-rate-limit-resume-1733-1000000480 at 1000000480" "$out"
srl_teardown

# --- Test 5: CUR=4 → FIRE=NOW+900 (BASE*16=960 clamped by MAX=900) ------------
echo "Test: CUR=4 → FIRE=NOW+900 (BASE*16=960 clamped by MAX=900)"
srl_setup
srl_run 4
assert_eq "CUR=4 stdout FIRE=NOW+900 (MAX cap)" \
  "reseeded dispatch-rate-limit-resume-1733-1000000900 at 1000000900" "$out"
srl_teardown

# --- Test 6: CUR=CAP (5) → escalate to office-hours, NO timer -----------------
echo "Test: CUR>=CAP (5) escalates to office-hours, prints 'escalated', no timer"
srl_setup
srl_run 5
assert_eq "CUR=CAP exits 0" "0" "$rc"
assert_eq "CUR=CAP stdout is 'escalated'" "escalated" "$out"
oh=$(cat "$TMPDIR_TEST/oh-log" 2>/dev/null || true)
TOTAL=$((TOTAL + 1))
if [[ "$oh" == "1733 "* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: CUR=CAP office-hours stub called with issue 1733 as arg1"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: CUR=CAP office-hours stub called with issue 1733 as arg1"
  echo "    oh-log: $oh"
fi
TOTAL=$((TOTAL + 1))
if [[ ! -s "$TMPDIR_TEST/systemd-log" ]]; then
  PASS=$((PASS + 1)); echo "  PASS: CUR=CAP arms no timer (systemd-log empty)"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: CUR=CAP arms no timer (systemd-log empty)"
  echo "    log: $(cat "$TMPDIR_TEST/systemd-log")"
fi
srl_teardown

# --- Test 7: empty <model> is passed through as the final positional ----------
# The possibly-empty <model> is forwarded UNCONDITIONALLY; dispatch-resume-worker
# treats empty as "omit --model". The ExecStart still has the worker path + 3
# positionals followed by a trailing space (the empty model arg).
echo "Test: empty <model> → ExecStart carries the 3 non-empty positionals"
srl_setup
export FAKE_CUR=0
if out=$("$TMPDIR_TEST/scripts/dispatch-schedule-rate-limit-resume" \
           1733 sess-abc /work/cwd worker-name \
           2>"$TMPDIR_TEST/stderr"); then rc=0; else rc=$?; fi
assert_eq "empty-model exits 0" "0" "$rc"
log=$(cat "$TMPDIR_TEST/systemd-log" 2>/dev/null || true)
TOTAL=$((TOTAL + 1))
if [[ "$log" == *"/dispatch-resume-worker worker-name /work/cwd sess-abc"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: empty-model ExecStart carries <name> <cwd> <sessionId>"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: empty-model ExecStart carries <name> <cwd> <sessionId>"
  echo "    log: $log"
fi
srl_teardown

# --- Test 7b: <effort> forwarded as trailing positional after <model> (#2042) -
# The possibly-empty <effort> is forwarded UNCONDITIONALLY after <model>, so the
# resume-worker receives `<name> <cwd> <sessionId> <model> <effort>` in that
# order. Pass a 6th positional `high` and assert the ExecStart ends with it,
# right after the model positional.
echo "Test: <effort> forwarded into ExecStart as trailing positional after <model>"
srl_setup
export FAKE_CUR=0
if out=$("$TMPDIR_TEST/scripts/dispatch-schedule-rate-limit-resume" \
           1733 sess-abc /work/cwd worker-name claude-opus high \
           2>"$TMPDIR_TEST/stderr"); then rc=0; else rc=$?; fi
assert_eq "effort-fwd exits 0" "0" "$rc"
log=$(cat "$TMPDIR_TEST/systemd-log" 2>/dev/null || true)
TOTAL=$((TOTAL + 1))
if [[ "$log" == *"/dispatch-resume-worker worker-name /work/cwd sess-abc claude-opus high"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: effort-fwd ExecStart ends with <model> <effort> = claude-opus high"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: effort-fwd ExecStart ends with <model> <effort> = claude-opus high"
  echo "    log: $log"
fi
srl_teardown

# --- Test 7c: omitted <effort> (5 args) → empty trailing effort positional ----
# With only 5 positionals, the script's EFFORT="${6:-}" is empty and is forwarded
# unconditionally as the trailing (empty) positional. The ExecStart still carries
# the model positional; the trailing effort is empty. Mirrors Test 7 (empty model).
echo "Test: omitted <effort> (5 args) → ExecStart carries <model>, empty trailing effort"
srl_setup
export FAKE_CUR=0
if out=$("$TMPDIR_TEST/scripts/dispatch-schedule-rate-limit-resume" \
           1733 sess-abc /work/cwd worker-name claude-opus \
           2>"$TMPDIR_TEST/stderr"); then rc=0; else rc=$?; fi
assert_eq "effort-omit exits 0" "0" "$rc"
log=$(cat "$TMPDIR_TEST/systemd-log" 2>/dev/null || true)
TOTAL=$((TOTAL + 1))
# ExecStart head carries the model positional; with effort empty there is no
# trailing effort token, so `claude-opus` is the final non-empty positional and
# `claude-opus high` must NOT appear.
if [[ "$log" == *"/dispatch-resume-worker worker-name /work/cwd sess-abc claude-opus"* \
   && "$log" != *"/dispatch-resume-worker worker-name /work/cwd sess-abc claude-opus high"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: effort-omit ExecStart carries <model>, no non-empty trailing effort"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: effort-omit ExecStart carries <model>, no non-empty trailing effort"
  echo "    log: $log"
fi
srl_teardown

# --- Test 7d: empty <model> + present <effort> → empty MIDDLE positional ------
# THE HEADLINE PATH. plan/implement resume passes <model>="" (Opus default) and
# <effort> non-empty, so the script forwards `... <sessionId> "" <effort>` — an
# EMPTY positional in the MIDDLE, not trailing. The script DOES emit both as
# separate quoted args (model="" then effort=high); the systemd-run stub's
# `echo "$*"` collapses the empty arg to a double space between <sessionId> and
# <effort>, which is the visible signature that the empty model slot did not
# swallow the effort value. (Whether the real systemd-run preserves the empty
# element as a distinct argv slot is a systemd property, not testable through the
# `$*` stub; resume-worker's own two independent conditionals make the consuming
# side correct by construction — see its Test D.)
echo "Test: empty <model> + <effort> high → ExecStart keeps effort after an empty model slot"
srl_setup
export FAKE_CUR=0
if out=$("$TMPDIR_TEST/scripts/dispatch-schedule-rate-limit-resume" \
           1733 sess-abc /work/cwd worker-name "" high \
           2>"$TMPDIR_TEST/stderr"); then rc=0; else rc=$?; fi
assert_eq "empty-model+effort exits 0" "0" "$rc"
log=$(cat "$TMPDIR_TEST/systemd-log" 2>/dev/null || true)
TOTAL=$((TOTAL + 1))
# Double space = the empty model positional; `high` follows as the effort slot.
if [[ "$log" == *"/dispatch-resume-worker worker-name /work/cwd sess-abc  high"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: empty-model+effort ExecStart carries effort after the empty model slot"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: empty-model+effort ExecStart carries effort after the empty model slot"
  echo "    log: $log"
fi
srl_teardown

# --- Test 8: already-exists collision → exit 0, stdout 'reseeded ...' ---------
echo "Test: systemd-run already-exists collision → exit 0 and stdout 'reseeded ...'"
srl_setup
cat > "$TMPDIR_TEST/bin/systemd-run" <<STUB
#!/usr/bin/env bash
echo "Unit dispatch-rate-limit-resume-1733-1000000060.timer already exists." >&2
exit 1
STUB
chmod +x "$TMPDIR_TEST/bin/systemd-run"
srl_run 0
assert_eq "already-exists exits 0" "0" "$rc"
assert_eq "already-exists stdout is the reseeded line" \
  "reseeded dispatch-rate-limit-resume-1733-1000000060 at 1000000060" "$out"
err=$(cat "$TMPDIR_TEST/stderr" 2>/dev/null || true)
TOTAL=$((TOTAL + 1))
if [[ "$err" == *"already scheduled"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: already-exists stderr notes already-scheduled"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: already-exists stderr notes already-scheduled"
  echo "    stderr: $err"
fi
srl_teardown

# --- Test 9: bad <N> (flag-like) → exit 2, no side effects -------------------
echo "Test: flag-like <N> exits 2 with no timer / no label edit / no escalate"
srl_setup
export FAKE_CUR=0
if out=$("$TMPDIR_TEST/scripts/dispatch-schedule-rate-limit-resume" \
           --repo sess /cwd nm 2>"$TMPDIR_TEST/stderr"); then rc=0; else rc=$?; fi
assert_eq "flag-like <N> exits 2" "2" "$rc"
TOTAL=$((TOTAL + 1))
if [[ ! -s "$TMPDIR_TEST/systemd-log" && ! -s "$TMPDIR_TEST/gh-edit-log" && ! -s "$TMPDIR_TEST/oh-log" ]]; then
  PASS=$((PASS + 1)); echo "  PASS: flag-like <N>; no timer / no label edit / no escalate"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: flag-like <N>; no timer / no label edit / no escalate"
fi
srl_teardown

# <<< END MOVED <<<

report_results
