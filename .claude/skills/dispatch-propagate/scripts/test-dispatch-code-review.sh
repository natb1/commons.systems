#!/usr/bin/env bash
# Tests for dispatch-code-review — the verified `claude -p '/code-review ...'`
# invocation primitive for the /review-fix Step 1b exclusive pre-stage.
set -euo pipefail

FIXTURE_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=dispatch-test-fixture.sh
source "$FIXTURE_DIR/dispatch-test-fixture.sh"

echo "=== dispatch-code-review ==="

CR_REPO=""

# cr_setup — a throwaway git repo with the script under test staged alongside
# it (SCRIPT_DIR resolution needs no siblings here, but we run the copy in
# place inside the throwaway repo's working directory).
cr_setup() {
  CR_REPO="$TMPDIR_TEST/cr-repo-$RANDOM"
  # The resume cache deliberately lives OUTSIDE the reviewed worktree; point it
  # at this run's tmp sandbox so the suite never writes into the developer's
  # real $XDG_STATE_HOME/$HOME (and so each suite run starts cache-cold).
  export DISPATCH_CODE_REVIEW_CACHE_DIR="$TMPDIR_TEST/cr-cache"
  mkdir -p "$CR_REPO"
  ( cd "$CR_REPO" \
    && git init -q \
    && git config user.email test@example.com \
    && git config user.name "Test" \
    && echo "hello" >README.md \
    && git add README.md \
    && git commit -q -m "init" )
}

# write_fake_code_review_claude — a fake `claude` CLI that only understands
# `-p <prompt> --model <alias> --permission-mode acceptEdits` (stdin already
# redirected to /dev/null by the caller). Behavior is driven by files under
# $STUB_DIR:
#   $STUB_DIR/cr-fake-output      text to print on stdout (default: empty)
#   $STUB_DIR/cr-fake-exit        exit code to return (default: 0)
#   $STUB_DIR/cr-fake-sleep       seconds to sleep before responding (default: 0)
#   $STUB_DIR/cr-fake-edit-file   path (relative to CWD) to write/touch before
#                                 responding, modeling a --fix edit
#   $STUB_DIR/cr-fake-crash       if present, the stub kills its own process
#                                 group (SIGKILL) instead of exiting normally —
#                                 models a crash that writes no exit-code
#                                 marker. Safe here only because the launcher
#                                 always runs this stub under `setsid`
#                                 (dispatch-code-review's detached launch), so
#                                 the stub's process group is disjoint from the
#                                 test harness's own — `kill -9 0` cannot reach
#                                 anything outside the detached run's own tree.
#   $STUB_DIR/cr-fake-calls.log   appended once per invocation (call-count probe)
#   $STUB_DIR/cr-fake-argv.log    the invocation's argv, one element per line
#                                 (proves the shipped effort/model/target)
write_fake_code_review_claude() {
  cat >"$TMPDIR_TEST/fake-claude-code-review" <<'STUB'
#!/usr/bin/env bash
STUB_DIR="$(cd "$(dirname "$0")" && pwd)/stub"
echo "call" >> "$STUB_DIR/cr-fake-calls.log"
printf '%s\n' "$@" >> "$STUB_DIR/cr-fake-argv.log"

if [[ -f "$STUB_DIR/cr-fake-crash" ]]; then
  # `kill -9 0` targets the CALLER's own process group — the whole detached
  # setsid tree this stub is running under, never anything outside it. No
  # exit-code marker gets written: the parent CHILD_SCRIPT wrapper dies with
  # us before it can reach its own `printf ... >"$rcfile.tmp"` line.
  kill -9 0
fi

if [[ -f "$STUB_DIR/cr-fake-sleep" ]]; then
  sleep "$(cat "$STUB_DIR/cr-fake-sleep")"
fi

if [[ -f "$STUB_DIR/cr-fake-edit-file" ]]; then
  edit_target="$(cat "$STUB_DIR/cr-fake-edit-file")"
  mkdir -p "$(dirname "$edit_target")"
  echo "edited by fake code-review" >> "$edit_target"
fi

if [[ -f "$STUB_DIR/cr-fake-output" ]]; then
  cat "$STUB_DIR/cr-fake-output"
fi

exit_code=0
[[ -f "$STUB_DIR/cr-fake-exit" ]] && exit_code="$(cat "$STUB_DIR/cr-fake-exit")"
exit "$exit_code"
STUB
  chmod +x "$TMPDIR_TEST/fake-claude-code-review"
}

cr_reset_stubs() {
  rm -f "$STUB_DIR"/cr-fake-output "$STUB_DIR"/cr-fake-exit \
        "$STUB_DIR"/cr-fake-sleep "$STUB_DIR"/cr-fake-edit-file \
        "$STUB_DIR"/cr-fake-calls.log "$STUB_DIR"/cr-fake-argv.log \
        "$STUB_DIR"/cr-fake-crash
}

# ============================================================================
# Test 1: happy path with edits
# ============================================================================
echo "Test: dispatch-code-review happy path with edits"
setup
# This suite drives dispatch-code-review's real `git` invocations (stash
# create, diff, status) against a throwaway repo, so it must NOT run under the
# shared fixture's fake `git`/`gh` stubs (built for the other scripts' gh/git
# call shapes, not for real repo operations). Undo setup()'s PATH prepend,
# keeping the host-systemd-guard's `systemctl` stub (baked into SAVED_PATH at
# fixture source time, before this suite runs).
export PATH="$SAVED_PATH"
cr_setup
write_fake_code_review_claude
cr_reset_stubs
printf '%s\n' "Finding: tracked.ts:3 — some issue. --fix applied." >"$STUB_DIR/cr-fake-output"
echo "$CR_REPO/tracked.ts" >"$STUB_DIR/cr-fake-edit-file"
( cd "$CR_REPO" && echo "const x = 1;" >tracked.ts && git add tracked.ts && git commit -q -m "add tracked" )

OUT_DIR_1="$CR_REPO/tmp/cr-out-1"
rc=0
out=$(
  cd "$CR_REPO" \
  && DISPATCH_CODE_REVIEW_CLAUDE_CMD="$TMPDIR_TEST/fake-claude-code-review" \
     "$SCRIPT_DIR/dispatch-code-review" --target HEAD~1..HEAD --out-dir "$OUT_DIR_1" 2>"$TMPDIR_TEST/cr-1.err"
) || rc=$?
assert_eq "case1: exit 0" "0" "$rc"
assert_eq "case1: stdout has status=ok" "1" "$(grep -c '^status=ok$' <<<"$out")"
assert_eq "case1: touched_files_count=1" "1" "$(grep -c '^touched_files_count=1$' <<<"$out")"
assert_eq "case1: touched_file present" "1" "$(grep -c '^touched_file=tracked\.ts$' <<<"$out")"
assert_eq "case1: output.txt holds the findings text" "1" "$(grep -c 'Finding: tracked.ts:3' "$OUT_DIR_1/output.txt")"
assert_eq "case1: fix.patch non-empty" "1" "$([[ -s "$OUT_DIR_1/fix.patch" ]] && echo 1 || echo 0)"

# ============================================================================
# Test 2: happy path, no edits
# ============================================================================
echo "Test: dispatch-code-review happy path, no edits"
cr_reset_stubs
printf '%s\n' "No findings — the diff is clean." >"$STUB_DIR/cr-fake-output"

OUT_DIR_2="$CR_REPO/tmp/cr-out-2"
rc=0
out=$(
  cd "$CR_REPO" \
  && DISPATCH_CODE_REVIEW_CLAUDE_CMD="$TMPDIR_TEST/fake-claude-code-review" \
     "$SCRIPT_DIR/dispatch-code-review" --target HEAD~1..HEAD --out-dir "$OUT_DIR_2" 2>"$TMPDIR_TEST/cr-2.err"
) || rc=$?
assert_eq "case2: exit 0" "0" "$rc"
assert_eq "case2: touched_files_count=0" "1" "$(grep -c '^touched_files_count=0$' <<<"$out")"
assert_eq "case2: fix.patch empty" "0" "$(wc -c <"$OUT_DIR_2/fix.patch" | tr -d '[:space:]')"

# ============================================================================
# Test 3: non-zero exit
# ============================================================================
echo "Test: dispatch-code-review non-zero exit"
cr_reset_stubs
printf '%s\n' "internal error: crashed" >"$STUB_DIR/cr-fake-output"
echo "1" >"$STUB_DIR/cr-fake-exit"

OUT_DIR_3="$CR_REPO/tmp/cr-out-3"
rc=0
err=""
out=$(
  cd "$CR_REPO" \
  && DISPATCH_CODE_REVIEW_CLAUDE_CMD="$TMPDIR_TEST/fake-claude-code-review" \
     "$SCRIPT_DIR/dispatch-code-review" --target HEAD~1..HEAD --out-dir "$OUT_DIR_3" 2>"$TMPDIR_TEST/cr-3.err"
) || rc=$?
err="$(cat "$TMPDIR_TEST/cr-3.err")"
assert_eq "case3: exit 1" "1" "$rc"
assert_eq "case3: stderr carries the fake's output" "1" "$(grep -c 'crashed' <<<"$err")"

# ============================================================================
# Test 4: empty output, exit 0
# ============================================================================
echo "Test: dispatch-code-review empty output, exit 0"
cr_reset_stubs
: >"$STUB_DIR/cr-fake-output"

OUT_DIR_4="$CR_REPO/tmp/cr-out-4"
rc=0
out=$(
  cd "$CR_REPO" \
  && DISPATCH_CODE_REVIEW_CLAUDE_CMD="$TMPDIR_TEST/fake-claude-code-review" \
     "$SCRIPT_DIR/dispatch-code-review" --target HEAD~1..HEAD --out-dir "$OUT_DIR_4" 2>"$TMPDIR_TEST/cr-4.err"
) || rc=$?
assert_eq "case4: exit 2" "2" "$rc"

# ============================================================================
# Test 5: rejection string, exit 0 (four-day silent-substitution regression)
# ============================================================================
echo "Test: dispatch-code-review disable-model-invocation rejection"
cr_reset_stubs
printf '%s\n' "Skill code-review cannot be used with Skill tool due to disable-model-invocation" \
  >"$STUB_DIR/cr-fake-output"

OUT_DIR_5="$CR_REPO/tmp/cr-out-5"
rc=0
out=$(
  cd "$CR_REPO" \
  && DISPATCH_CODE_REVIEW_CLAUDE_CMD="$TMPDIR_TEST/fake-claude-code-review" \
     "$SCRIPT_DIR/dispatch-code-review" --target HEAD~1..HEAD --out-dir "$OUT_DIR_5" 2>"$TMPDIR_TEST/cr-5.err"
) || rc=$?
assert_eq "case5: exit 3" "3" "$rc"

# ============================================================================
# Test 6: Unknown command rejection, exit 0
# ============================================================================
echo "Test: dispatch-code-review Unknown command rejection"
cr_reset_stubs
printf '%s\n' "Unknown command: /code-review-nope" >"$STUB_DIR/cr-fake-output"

OUT_DIR_6="$CR_REPO/tmp/cr-out-6"
rc=0
out=$(
  cd "$CR_REPO" \
  && DISPATCH_CODE_REVIEW_CLAUDE_CMD="$TMPDIR_TEST/fake-claude-code-review" \
     "$SCRIPT_DIR/dispatch-code-review" --target HEAD~1..HEAD --out-dir "$OUT_DIR_6" 2>"$TMPDIR_TEST/cr-6.err"
) || rc=$?
assert_eq "case6: exit 3" "3" "$rc"

# ============================================================================
# Test 7: idempotent resume
# ============================================================================
echo "Test: dispatch-code-review idempotent resume"
cr_reset_stubs
printf '%s\n' "Findings: none of note." >"$STUB_DIR/cr-fake-output"

OUT_DIR_7="$CR_REPO/tmp/cr-out-7"
rc1=0
out1=$(
  cd "$CR_REPO" \
  && DISPATCH_CODE_REVIEW_CLAUDE_CMD="$TMPDIR_TEST/fake-claude-code-review" \
     "$SCRIPT_DIR/dispatch-code-review" --target HEAD~1..HEAD --out-dir "$OUT_DIR_7" 2>"$TMPDIR_TEST/cr-7a.err"
) || rc1=$?
rc2=0
out2=$(
  cd "$CR_REPO" \
  && DISPATCH_CODE_REVIEW_CLAUDE_CMD="$TMPDIR_TEST/fake-claude-code-review" \
     "$SCRIPT_DIR/dispatch-code-review" --target HEAD~1..HEAD --out-dir "$OUT_DIR_7" 2>"$TMPDIR_TEST/cr-7b.err"
) || rc2=$?
call_count=$(wc -l <"$STUB_DIR/cr-fake-calls.log" | tr -d '[:space:]')
assert_eq "case7: both runs exit 0" "0 0" "$rc1 $rc2"
assert_eq "case7: fake invoked exactly once" "1" "$call_count"
assert_eq "case7: summary byte-identical across runs" "$out1" "$out2"

# ============================================================================
# Test 8: argument injection via --target
# ============================================================================
echo "Test: dispatch-code-review rejects target argument injection"
cr_reset_stubs
: >"$STUB_DIR/cr-fake-calls.log"

OUT_DIR_8="$CR_REPO/tmp/cr-out-8"
rc=0
out=$(
  cd "$CR_REPO" \
  && DISPATCH_CODE_REVIEW_CLAUDE_CMD="$TMPDIR_TEST/fake-claude-code-review" \
     "$SCRIPT_DIR/dispatch-code-review" --target 'HEAD; rm -rf /' --out-dir "$OUT_DIR_8" 2>"$TMPDIR_TEST/cr-8.err"
) || rc=$?
inj_calls=0
[[ -f "$STUB_DIR/cr-fake-calls.log" ]] && inj_calls=$(wc -l <"$STUB_DIR/cr-fake-calls.log" | tr -d '[:space:]')
assert_eq "case8: exit 2" "2" "$rc"
assert_eq "case8: fake never invoked" "0" "$inj_calls"

# ============================================================================
# Test 9: deadline expiry (replaces the old foreground-timeout case — the
# script no longer has one; the run is detached and every invocation is a
# bounded await, so exceeding the total wall clock is the deadline path now)
# ============================================================================
# Two calls: the first launches a run the stub will never finish naturally
# (sleep 30) and returns exit 5 (still in flight) once its short
# --await-seconds window elapses. The second call resumes the SAME run and,
# because the run is still going once the (short) --deadline-seconds total is
# reached, kills it and returns exit 4. DISPATCH_CODE_REVIEW_POLL_INTERVAL_S
# is set to 1 so the await loop's polling granularity does not itself add
# multiple seconds of slack on top of the deadline.
echo "Test: dispatch-code-review deadline expiry (exit 4)"
cr_reset_stubs
: >"$STUB_DIR/cr-fake-calls.log"
printf '%s\n' "unreachable" >"$STUB_DIR/cr-fake-output"
echo "30" >"$STUB_DIR/cr-fake-sleep"

OUT_DIR_9="$CR_REPO/tmp/cr-out-9"
rc=0
out=$(
  cd "$CR_REPO" \
  && DISPATCH_CODE_REVIEW_CLAUDE_CMD="$TMPDIR_TEST/fake-claude-code-review" \
     DISPATCH_CODE_REVIEW_POLL_INTERVAL_S=1 \
     "$SCRIPT_DIR/dispatch-code-review" --target HEAD~1..HEAD --out-dir "$OUT_DIR_9" \
       --await-seconds 2 --deadline-seconds 4 2>"$TMPDIR_TEST/cr-9a.err"
) || rc=$?
assert_eq "case9: first call is still in flight, exit 5" "5" "$rc"

run_file=$(find "$DISPATCH_CODE_REVIEW_CACHE_DIR" -maxdepth 1 -name '*.run' | head -1)
child_pid=""
[[ -n "$run_file" ]] && child_pid=$(sed -n 's/^pid=//p' "$run_file" | head -1)
assert_eq "case9: the launched pid is alive before the deadline" "1" \
  "$([[ -n "$child_pid" ]] && kill -0 "$child_pid" 2>/dev/null && echo 1 || echo 0)"

rc=0
out=$(
  cd "$CR_REPO" \
  && DISPATCH_CODE_REVIEW_CLAUDE_CMD="$TMPDIR_TEST/fake-claude-code-review" \
     DISPATCH_CODE_REVIEW_POLL_INTERVAL_S=1 \
     "$SCRIPT_DIR/dispatch-code-review" --target HEAD~1..HEAD --out-dir "$OUT_DIR_9" \
       --await-seconds 2 --deadline-seconds 4 2>"$TMPDIR_TEST/cr-9b.err"
) || rc=$?
assert_eq "case9: second call hits the deadline and exits 4" "4" "$rc"
sleep 0.3
assert_eq "case9: the killed run's pid is no longer alive" "0" \
  "$([[ -n "$child_pid" ]] && kill -0 "$child_pid" 2>/dev/null && echo 1 || echo 0)"
run_left=$(find "$DISPATCH_CODE_REVIEW_CACHE_DIR" -maxdepth 1 -name '*.run' | wc -l | tr -d '[:space:]')
assert_eq "case9: the run record is discarded after the deadline kill" "0" "$run_left"

# ============================================================================
# Test 9b: DISPATCH_CODE_REVIEW_TIMEOUT is retired, not aliased
# ============================================================================
# It named a single foreground `timeout` budget the script no longer has; a
# stale value carried into either new knob would set a meaningless budget.
# Setting it is a hard exit 2 naming the replacements, never a silent no-op.
echo "Test: dispatch-code-review rejects the retired DISPATCH_CODE_REVIEW_TIMEOUT"
cr_reset_stubs
: >"$STUB_DIR/cr-fake-calls.log"
printf '%s\n' "unreachable" >"$STUB_DIR/cr-fake-output"

OUT_DIR_9B="$CR_REPO/tmp/cr-out-9b"
rc=0
out=$(
  cd "$CR_REPO" \
  && DISPATCH_CODE_REVIEW_CLAUDE_CMD="$TMPDIR_TEST/fake-claude-code-review" \
     DISPATCH_CODE_REVIEW_TIMEOUT=1 \
     "$SCRIPT_DIR/dispatch-code-review" --target HEAD~1..HEAD --out-dir "$OUT_DIR_9B" 2>"$TMPDIR_TEST/cr-9c.err"
) || rc=$?
retired_calls=0
[[ -f "$STUB_DIR/cr-fake-calls.log" ]] && retired_calls=$(wc -l <"$STUB_DIR/cr-fake-calls.log" | tr -d '[:space:]')
assert_eq "case9b: exit 2" "2" "$rc"
assert_eq "case9b: the fake was never invoked" "0" "$retired_calls"
assert_eq "case9b: stderr names --await-seconds" "1" \
  "$(grep -c 'await-seconds' "$TMPDIR_TEST/cr-9c.err" || true)"
assert_eq "case9b: stderr names --deadline-seconds" "1" \
  "$(grep -c 'deadline-seconds' "$TMPDIR_TEST/cr-9c.err" || true)"

# ============================================================================
# Test 10: --target must be a rev-range, never a bare commit-ish
# ============================================================================
# A bare SHA makes the built-in review only THAT commit's diff, not the diff
# from it to HEAD — measured live: `/code-review low <bare-sha>` reviewed a
# single 1-file phase-bump commit and found nothing, while
# `/code-review low <sha>..HEAD` reviewed the PR's full 9-file diff and
# returned 3 findings. The script must refuse the wrong form outright rather
# than run a green review over the wrong diff.
echo "Test: dispatch-code-review rejects a non-range --target"
for bad_target in HEAD c06c7295 origin/main HEAD~3 "HEAD.." "..HEAD"; do
  cr_reset_stubs
  : >"$STUB_DIR/cr-fake-calls.log"
  printf '%s\n' "unreachable" >"$STUB_DIR/cr-fake-output"
  OUT_DIR_10="$CR_REPO/tmp/cr-out-10-$RANDOM"
  rc=0
  out=$(
    cd "$CR_REPO" \
    && DISPATCH_CODE_REVIEW_CLAUDE_CMD="$TMPDIR_TEST/fake-claude-code-review" \
       "$SCRIPT_DIR/dispatch-code-review" --target "$bad_target" --out-dir "$OUT_DIR_10" 2>"$TMPDIR_TEST/cr-10.err"
  ) || rc=$?
  bad_calls=0
  [[ -f "$STUB_DIR/cr-fake-calls.log" ]] && bad_calls=$(wc -l <"$STUB_DIR/cr-fake-calls.log" | tr -d '[:space:]')
  assert_eq "case10 ($bad_target): exit 2" "2" "$rc"
  assert_eq "case10 ($bad_target): fake never invoked" "0" "$bad_calls"
  assert_eq "case10 ($bad_target): stderr names the range requirement" "1" \
    "$(grep -c 'rev-range' "$TMPDIR_TEST/cr-10.err" || true)"
done

echo "Test: dispatch-code-review accepts both two-dot and three-dot ranges"
for good_target in "HEAD~1..HEAD" "HEAD~1...HEAD" "origin/main..HEAD"; do
  cr_reset_stubs
  : >"$STUB_DIR/cr-fake-calls.log"
  printf '%s\n' "No findings." >"$STUB_DIR/cr-fake-output"
  OUT_DIR_11="$CR_REPO/tmp/cr-out-11-$RANDOM"
  rc=0
  out=$(
    cd "$CR_REPO" \
    && DISPATCH_CODE_REVIEW_CLAUDE_CMD="$TMPDIR_TEST/fake-claude-code-review" \
       "$SCRIPT_DIR/dispatch-code-review" --target "$good_target" --out-dir "$OUT_DIR_11" 2>"$TMPDIR_TEST/cr-11.err"
  ) || rc=$?
  assert_eq "case11 ($good_target): exit 0" "0" "$rc"
  assert_eq "case11 ($good_target): status=ok" "1" "$(grep -c '^status=ok$' <<<"$out")"
done

# ============================================================================
# Test 12: the SKILL's Step 1b call site passes a range, not a bare $MERGE_BASE
# ============================================================================
# The script-side guard above only fires at runtime; this pins the caller so a
# reverted SKILL edit fails the suite instead of failing a live review phase.
echo "Test: review-fix SKILL.md Step 1b passes a rev-range --target"
RF_SKILL="$(cd "$SCRIPT_DIR/../../.." && pwd)/skills/review-fix/SKILL.md"
assert_eq "SKILL.md: readable" "1" "$([[ -r "$RF_SKILL" ]] && echo 1 || echo 0)"
assert_eq "SKILL.md: Step 1b --target is a range" "1" \
  "$(grep -c -F -- '--target "$MERGE_BASE..HEAD"' "$RF_SKILL" || true)"
assert_eq "SKILL.md: no bare-SHA --target call site" "0" \
  "$(grep -c -E -- '--target "\$MERGE_BASE"' "$RF_SKILL" || true)"

# ============================================================================
# Test 13: a planted summary.txt in --out-dir never short-circuits the review
# ============================================================================
# --out-dir is `tmp/code-review-$N` inside the reviewed worktree: gitignored,
# deterministic, and writable by every earlier phase (and by the PR content
# under review). A resume keyed there let a planted `status=ok` file skip the
# built-in entirely while the caller still labelled the PR reviewed.
echo "Test: dispatch-code-review ignores a planted out-dir summary.txt"
cr_reset_stubs
: >"$STUB_DIR/cr-fake-calls.log"
printf '%s\n' "Real findings from the real built-in." >"$STUB_DIR/cr-fake-output"

OUT_DIR_13="$CR_REPO/tmp/cr-out-13"
mkdir -p "$OUT_DIR_13"
cat >"$OUT_DIR_13/summary.txt" <<PLANT
status=ok
exit_code=0
findings_path=$CR_REPO/attacker-findings.txt
patch_path=$CR_REPO/attacker.patch
touched_files_count=0
PLANT
rc=0
out=$(
  cd "$CR_REPO" \
  && DISPATCH_CODE_REVIEW_CLAUDE_CMD="$TMPDIR_TEST/fake-claude-code-review" \
     "$SCRIPT_DIR/dispatch-code-review" --target HEAD~1..HEAD --out-dir "$OUT_DIR_13" 2>"$TMPDIR_TEST/cr-13.err"
) || rc=$?
plant_calls=$(wc -l <"$STUB_DIR/cr-fake-calls.log" | tr -d '[:space:]')
assert_eq "case13: exit 0" "0" "$rc"
assert_eq "case13: the built-in actually ran" "1" "$plant_calls"
assert_eq "case13: attacker-chosen findings_path not echoed" "0" \
  "$(grep -c 'attacker-findings' <<<"$out" || true)"
assert_eq "case13: findings_path is the out-dir's own output.txt" "1" \
  "$(grep -c -F "findings_path=$OUT_DIR_13/output.txt" <<<"$out" || true)"

# ============================================================================
# Test 14: a new HEAD invalidates the resume cache
# ============================================================================
# The review phase is legitimately re-entered (qa-fix → review, fix-checks
# pushes). Replaying commit A's summary over commit B would label a PR reviewed
# whose newest commits no built-in ever saw.
echo "Test: dispatch-code-review re-runs after HEAD advances"
cr_reset_stubs
: >"$STUB_DIR/cr-fake-calls.log"
printf '%s\n' "No findings." >"$STUB_DIR/cr-fake-output"

OUT_DIR_14="$CR_REPO/tmp/cr-out-14"
rc=0
out=$(
  cd "$CR_REPO" \
  && DISPATCH_CODE_REVIEW_CLAUDE_CMD="$TMPDIR_TEST/fake-claude-code-review" \
     "$SCRIPT_DIR/dispatch-code-review" --target HEAD~1..HEAD --out-dir "$OUT_DIR_14" 2>"$TMPDIR_TEST/cr-14a.err"
) || rc=$?
assert_eq "case14: first run exit 0" "0" "$rc"
( cd "$CR_REPO" && echo "later" >>tracked.ts && git add tracked.ts && git commit -q -m "advance head" )
rc=0
out=$(
  cd "$CR_REPO" \
  && DISPATCH_CODE_REVIEW_CLAUDE_CMD="$TMPDIR_TEST/fake-claude-code-review" \
     "$SCRIPT_DIR/dispatch-code-review" --target HEAD~1..HEAD --out-dir "$OUT_DIR_14" 2>"$TMPDIR_TEST/cr-14b.err"
) || rc=$?
head_calls=$(wc -l <"$STUB_DIR/cr-fake-calls.log" | tr -d '[:space:]')
assert_eq "case14: second run exit 0" "0" "$rc"
assert_eq "case14: built-in ran again on the new HEAD" "2" "$head_calls"

# ============================================================================
# Test 15: a different --effort invalidates the resume cache
# ============================================================================
echo "Test: dispatch-code-review re-runs when --effort changes"
cr_reset_stubs
: >"$STUB_DIR/cr-fake-calls.log"
printf '%s\n' "No findings." >"$STUB_DIR/cr-fake-output"

OUT_DIR_15="$CR_REPO/tmp/cr-out-15"
rc=0
out=$(
  cd "$CR_REPO" \
  && DISPATCH_CODE_REVIEW_CLAUDE_CMD="$TMPDIR_TEST/fake-claude-code-review" \
     "$SCRIPT_DIR/dispatch-code-review" --target HEAD~1..HEAD --out-dir "$OUT_DIR_15" 2>"$TMPDIR_TEST/cr-15a.err"
) || rc=$?
assert_eq "case15: low-effort run exit 0" "0" "$rc"
rc=0
out=$(
  cd "$CR_REPO" \
  && DISPATCH_CODE_REVIEW_CLAUDE_CMD="$TMPDIR_TEST/fake-claude-code-review" \
     "$SCRIPT_DIR/dispatch-code-review" --target HEAD~1..HEAD --effort medium --out-dir "$OUT_DIR_15" 2>"$TMPDIR_TEST/cr-15b.err"
) || rc=$?
effort_calls=$(wc -l <"$STUB_DIR/cr-fake-calls.log" | tr -d '[:space:]')
assert_eq "case15: medium-effort run exit 0" "0" "$rc"
assert_eq "case15: built-in ran again at the new effort" "2" "$effort_calls"
assert_eq "case15: summary records the effort it ran at" "1" \
  "$(grep -c '^effort=medium$' <<<"$out" || true)"

# ============================================================================
# Test 16: a cache dir inside the reviewed worktree is refused
# ============================================================================
echo "Test: dispatch-code-review refuses an in-worktree resume-cache dir"
cr_reset_stubs
: >"$STUB_DIR/cr-fake-calls.log"
printf '%s\n' "unreachable" >"$STUB_DIR/cr-fake-output"

OUT_DIR_16="$CR_REPO/tmp/cr-out-16"
rc=0
out=$(
  cd "$CR_REPO" \
  && DISPATCH_CODE_REVIEW_CACHE_DIR="$CR_REPO/tmp/cache" \
     DISPATCH_CODE_REVIEW_CLAUDE_CMD="$TMPDIR_TEST/fake-claude-code-review" \
     "$SCRIPT_DIR/dispatch-code-review" --target HEAD~1..HEAD --out-dir "$OUT_DIR_16" 2>"$TMPDIR_TEST/cr-16.err"
) || rc=$?
inrepo_calls=0
[[ -f "$STUB_DIR/cr-fake-calls.log" ]] && inrepo_calls=$(wc -l <"$STUB_DIR/cr-fake-calls.log" | tr -d '[:space:]')
assert_eq "case16: exit 2" "2" "$rc"
assert_eq "case16: fake never invoked" "0" "$inrepo_calls"
assert_eq "case16: stderr explains the location requirement" "1" \
  "$(grep -c 'inside the reviewed worktree' "$TMPDIR_TEST/cr-16.err" || true)"

# ============================================================================
# Test 17: a fast (sleep 0) run leaves no .run record behind
# ============================================================================
# The core regression guard for the always-detached rewrite: at the speed the
# stub runs (and at real `low` effort, per the header), the run finishes
# inside the first await window, so nothing resembling an in-flight record
# should survive to be found under CACHE_DIR.
echo "Test: dispatch-code-review leaves no .run record after a fast completion"
cr_reset_stubs
printf '%s\n' "Fast, no findings of note." >"$STUB_DIR/cr-fake-output"

OUT_DIR_17="$CR_REPO/tmp/cr-out-17"
rc=0
out=$(
  cd "$CR_REPO" \
  && DISPATCH_CODE_REVIEW_CLAUDE_CMD="$TMPDIR_TEST/fake-claude-code-review" \
     "$SCRIPT_DIR/dispatch-code-review" --target HEAD~1..HEAD --out-dir "$OUT_DIR_17" 2>"$TMPDIR_TEST/cr-17.err"
) || rc=$?
assert_eq "case17: exit 0" "0" "$rc"
assert_eq "case17: status=ok" "1" "$(grep -c '^status=ok$' <<<"$out")"
fast_run_left=$(find "$DISPATCH_CODE_REVIEW_CACHE_DIR" -maxdepth 1 -name '*.run' | wc -l | tr -d '[:space:]')
assert_eq "case17: no .run record left behind" "0" "$fast_run_left"

# ============================================================================
# Test 18: default effort is high, model is pinned to opus
# ============================================================================
echo "Test: dispatch-code-review defaults to --effort high with --model opus"
cr_reset_stubs
printf '%s\n' "Default effort/model probe." >"$STUB_DIR/cr-fake-output"

OUT_DIR_18="$CR_REPO/tmp/cr-out-18"
rc=0
out=$(
  cd "$CR_REPO" \
  && DISPATCH_CODE_REVIEW_CLAUDE_CMD="$TMPDIR_TEST/fake-claude-code-review" \
     "$SCRIPT_DIR/dispatch-code-review" --target HEAD~1..HEAD --out-dir "$OUT_DIR_18" 2>"$TMPDIR_TEST/cr-18.err"
) || rc=$?
assert_eq "case18: exit 0" "0" "$rc"
assert_eq "case18: argv carries the high-effort prompt" "1" \
  "$(grep -c -F -- '/code-review high --fix --comment HEAD~1..HEAD' "$STUB_DIR/cr-fake-argv.log" || true)"
assert_eq "case18: argv pins --model opus" "1" \
  "$(grep -A1 -x -- '--model' "$STUB_DIR/cr-fake-argv.log" | tail -1 | grep -c '^opus$' || true)"
assert_eq "case18: summary records effort=high" "1" "$(grep -c '^effort=high$' <<<"$out")"
assert_eq "case18: summary records model=opus" "1" "$(grep -c '^model=opus$' <<<"$out")"

# ============================================================================
# Test 19: --model overrides opus, and a model change re-runs (never replays)
# ============================================================================
echo "Test: --model overrides the opus default, and a model change re-runs rather than replaying"
cr_reset_stubs
: >"$STUB_DIR/cr-fake-calls.log"
printf '%s\n' "Model-override probe." >"$STUB_DIR/cr-fake-output"

OUT_DIR_19="$CR_REPO/tmp/cr-out-19"
rc=0
out=$(
  cd "$CR_REPO" \
  && DISPATCH_CODE_REVIEW_CLAUDE_CMD="$TMPDIR_TEST/fake-claude-code-review" \
     "$SCRIPT_DIR/dispatch-code-review" --target HEAD~1..HEAD --out-dir "$OUT_DIR_19" 2>"$TMPDIR_TEST/cr-19a.err"
) || rc=$?
assert_eq "case19: opus-default run exit 0" "0" "$rc"

rc=0
out=$(
  cd "$CR_REPO" \
  && DISPATCH_CODE_REVIEW_CLAUDE_CMD="$TMPDIR_TEST/fake-claude-code-review" \
     "$SCRIPT_DIR/dispatch-code-review" --target HEAD~1..HEAD --model sonnet --out-dir "$OUT_DIR_19" 2>"$TMPDIR_TEST/cr-19b.err"
) || rc=$?
model_calls=$(wc -l <"$STUB_DIR/cr-fake-calls.log" | tr -d '[:space:]')
assert_eq "case19: sonnet-override run exit 0" "0" "$rc"
assert_eq "case19: built-in ran again for the model change (cache_is_current fails on model=)" \
  "2" "$model_calls"
assert_eq "case19: summary records the model it ran at" "1" "$(grep -c '^model=sonnet$' <<<"$out")"
assert_eq "case19: argv on the second call carries --model sonnet" "1" \
  "$(grep -A1 -x -- '--model' "$STUB_DIR/cr-fake-argv.log" | tail -1 | grep -c '^sonnet$' || true)"

# ============================================================================
# Test 20: await expiry (exit 5) then resume (exit 0) — ONE invocation total
# ============================================================================
# The core test for the detached-run rewrite: the second call must RESUME the
# first call's launched run rather than paying for a second one.
echo "Test: dispatch-code-review await expiry resumes as exactly ONE invocation"
cr_reset_stubs
: >"$STUB_DIR/cr-fake-calls.log"
printf '%s\n' "Findings after a slow run." >"$STUB_DIR/cr-fake-output"
echo "6" >"$STUB_DIR/cr-fake-sleep"

OUT_DIR_20="$CR_REPO/tmp/cr-out-20"
rc=0
out=$(
  cd "$CR_REPO" \
  && DISPATCH_CODE_REVIEW_CLAUDE_CMD="$TMPDIR_TEST/fake-claude-code-review" \
     DISPATCH_CODE_REVIEW_POLL_INTERVAL_S=1 \
     "$SCRIPT_DIR/dispatch-code-review" --target HEAD~1..HEAD --out-dir "$OUT_DIR_20" \
       --await-seconds 1 --deadline-seconds 60 2>"$TMPDIR_TEST/cr-20a.err"
) || rc=$?
assert_eq "case20: first call still in flight, exit 5" "5" "$rc"
first_line=$(head -1 <<<"$out")
assert_eq "case20: stdout's first line is status=running" "status=running" "$first_line"
run_count=$(find "$DISPATCH_CODE_REVIEW_CACHE_DIR" -maxdepth 1 -name '*.run' | wc -l | tr -d '[:space:]')
assert_eq "case20: a .run record exists after the first call" "1" "$run_count"

rc=0
out=$(
  cd "$CR_REPO" \
  && DISPATCH_CODE_REVIEW_CLAUDE_CMD="$TMPDIR_TEST/fake-claude-code-review" \
     DISPATCH_CODE_REVIEW_POLL_INTERVAL_S=1 \
     "$SCRIPT_DIR/dispatch-code-review" --target HEAD~1..HEAD --out-dir "$OUT_DIR_20" \
       --await-seconds 30 --deadline-seconds 60 2>"$TMPDIR_TEST/cr-20b.err"
) || rc=$?
resume_calls=$(wc -l <"$STUB_DIR/cr-fake-calls.log" | tr -d '[:space:]')
assert_eq "case20: second call exits 0" "0" "$rc"
assert_eq "case20: status=ok on resume" "1" "$(grep -c '^status=ok$' <<<"$out")"
assert_eq "case20: the fake was invoked exactly once (resumed, not relaunched)" "1" "$resume_calls"

# ============================================================================
# Test 21: an in-flight .run record does not satisfy the completed-summary cache
# ============================================================================
echo "Test: an in-flight .run record does not satisfy cache_is_current's completed-summary replay"
cr_reset_stubs
: >"$STUB_DIR/cr-fake-calls.log"
printf '%s\n' "Findings, in-flight only." >"$STUB_DIR/cr-fake-output"
echo "3" >"$STUB_DIR/cr-fake-sleep"

OUT_DIR_21="$CR_REPO/tmp/cr-out-21"
# CACHE_DIR accumulates one *.summary file per out-dir for the whole suite's
# run (that persistence is the resume cache's entire point), so a bare count
# across CACHE_DIR would already be nonzero from every earlier case's
# completed run. Compute THIS out-dir's own cache key exactly as the script
# does (sha256 of the out-dir's canonicalized absolute path) and check only
# that one file.
mkdir -p "$OUT_DIR_21"
OUT_DIR_21_ABS="$(cd "$OUT_DIR_21" && pwd)"
CACHE_KEY_21="$(printf '%s' "$OUT_DIR_21_ABS" | sha256sum | cut -d' ' -f1)"
CACHE_FILE_21="$DISPATCH_CODE_REVIEW_CACHE_DIR/$CACHE_KEY_21.summary"

rc=0
out=$(
  cd "$CR_REPO" \
  && DISPATCH_CODE_REVIEW_CLAUDE_CMD="$TMPDIR_TEST/fake-claude-code-review" \
     DISPATCH_CODE_REVIEW_POLL_INTERVAL_S=1 \
     "$SCRIPT_DIR/dispatch-code-review" --target HEAD~1..HEAD --out-dir "$OUT_DIR_21" \
       --await-seconds 1 --deadline-seconds 60 2>"$TMPDIR_TEST/cr-21a.err"
) || rc=$?
assert_eq "case21: first call exits 5" "5" "$rc"
assert_eq "case21: no completed-summary cache file exists yet for this out-dir" "0" \
  "$([[ -f "$CACHE_FILE_21" ]] && echo 1 || echo 0)"

rc=0
out=$(
  cd "$CR_REPO" \
  && DISPATCH_CODE_REVIEW_CLAUDE_CMD="$TMPDIR_TEST/fake-claude-code-review" \
     DISPATCH_CODE_REVIEW_POLL_INTERVAL_S=1 \
     "$SCRIPT_DIR/dispatch-code-review" --target HEAD~1..HEAD --out-dir "$OUT_DIR_21" \
       --await-seconds 30 --deadline-seconds 60 2>"$TMPDIR_TEST/cr-21b.err"
) || rc=$?
inflight_calls=$(wc -l <"$STUB_DIR/cr-fake-calls.log" | tr -d '[:space:]')
assert_eq "case21: second call completes for real, exit 0" "0" "$rc"
assert_eq "case21: exactly one invocation (resumed, never replayed from a bogus cache)" \
  "1" "$inflight_calls"
assert_eq "case21: a completed-summary cache file now exists for this out-dir" "1" \
  "$([[ -f "$CACHE_FILE_21" ]] && echo 1 || echo 0)"

# ============================================================================
# Test 22: run-state artifacts live under CACHE_DIR, never under --out-dir
# ============================================================================
# `.rc` cannot be caught at rest under CACHE_DIR by a black-box probe: it is
# written only in the instant between the child exiting and this script's own
# discard_run_record cleanup, which is not a window an external poll can land
# in deterministically. What IS checked here, deterministically: `.run` and
# `.output` exist under CACHE_DIR while the run is in flight, and no run-state
# filename pattern EVER appears under --out-dir — mid-flight or after — which
# is the actual security property (an attacker-writable --out-dir must never
# carry the resume/completion markers). `.rc`'s placement at
# $CACHE_DIR/$CACHE_KEY.rc, never $OUT_DIR, is confirmed by direct reading of
# dispatch-code-review's own source (RUN_RC="$CACHE_DIR/$CACHE_KEY.rc").
echo "Test: dispatch-code-review run-state artifacts live under CACHE_DIR, never under --out-dir"
cr_reset_stubs
: >"$STUB_DIR/cr-fake-calls.log"
printf '%s\n' "Findings for placement check." >"$STUB_DIR/cr-fake-output"
echo "3" >"$STUB_DIR/cr-fake-sleep"

OUT_DIR_22="$CR_REPO/tmp/cr-out-22"
rc=0
out=$(
  cd "$CR_REPO" \
  && DISPATCH_CODE_REVIEW_CLAUDE_CMD="$TMPDIR_TEST/fake-claude-code-review" \
     DISPATCH_CODE_REVIEW_POLL_INTERVAL_S=1 \
     "$SCRIPT_DIR/dispatch-code-review" --target HEAD~1..HEAD --out-dir "$OUT_DIR_22" \
       --await-seconds 1 --deadline-seconds 60 2>"$TMPDIR_TEST/cr-22a.err"
) || rc=$?
assert_eq "case22: mid-flight call exits 5" "5" "$rc"

run_hits=$(find "$DISPATCH_CODE_REVIEW_CACHE_DIR" -maxdepth 1 -name '*.run' | wc -l | tr -d '[:space:]')
output_hits=$(find "$DISPATCH_CODE_REVIEW_CACHE_DIR" -maxdepth 1 -name '*.output' | wc -l | tr -d '[:space:]')
assert_eq "case22: .run lands under CACHE_DIR while in flight" "1" "$run_hits"
assert_eq "case22: .output lands under CACHE_DIR while in flight" "1" "$output_hits"
outdir_run_state=$(find "$OUT_DIR_22" \
  \( -name '*.run' -o -name '*.rc' -o -name '*.pid' -o -name '*.lock' -o -name '*.untracked-before' \) \
  2>/dev/null | wc -l | tr -d '[:space:]')
assert_eq "case22: no run-state file under --out-dir while in flight" "0" "$outdir_run_state"

rc=0
out=$(
  cd "$CR_REPO" \
  && DISPATCH_CODE_REVIEW_CLAUDE_CMD="$TMPDIR_TEST/fake-claude-code-review" \
     DISPATCH_CODE_REVIEW_POLL_INTERVAL_S=1 \
     "$SCRIPT_DIR/dispatch-code-review" --target HEAD~1..HEAD --out-dir "$OUT_DIR_22" \
       --await-seconds 30 --deadline-seconds 60 2>"$TMPDIR_TEST/cr-22b.err"
) || rc=$?
assert_eq "case22: resumed call completes" "0" "$rc"
outdir_run_state_after=$(find "$OUT_DIR_22" \
  \( -name '*.run' -o -name '*.rc' -o -name '*.pid' -o -name '*.lock' -o -name '*.untracked-before' \) \
  2>/dev/null | wc -l | tr -d '[:space:]')
assert_eq "case22: still no run-state file under --out-dir after completion" "0" "$outdir_run_state_after"
cache_run_state_after=$(find "$DISPATCH_CODE_REVIEW_CACHE_DIR" -maxdepth 1 \
  \( -name '*.run' -o -name '*.rc' -o -name '*.pid' \) | wc -l | tr -d '[:space:]')
assert_eq "case22: run-state discarded from CACHE_DIR after completion" "0" "$cache_run_state_after"

# ============================================================================
# Test 23: an in-flight run superseded by a new HEAD is discarded and relaunched
# ============================================================================
echo "Test: dispatch-code-review discards a superseded in-flight run when HEAD advances mid-run"
cr_reset_stubs
: >"$STUB_DIR/cr-fake-calls.log"
printf '%s\n' "Findings from the superseded run." >"$STUB_DIR/cr-fake-output"
echo "20" >"$STUB_DIR/cr-fake-sleep"

OUT_DIR_23="$CR_REPO/tmp/cr-out-23"
rc=0
out=$(
  cd "$CR_REPO" \
  && DISPATCH_CODE_REVIEW_CLAUDE_CMD="$TMPDIR_TEST/fake-claude-code-review" \
     DISPATCH_CODE_REVIEW_POLL_INTERVAL_S=1 \
     "$SCRIPT_DIR/dispatch-code-review" --target HEAD~1..HEAD --out-dir "$OUT_DIR_23" \
       --await-seconds 1 --deadline-seconds 60 2>"$TMPDIR_TEST/cr-23a.err"
) || rc=$?
assert_eq "case23: first call still in flight, exit 5" "5" "$rc"

run_file=$(find "$DISPATCH_CODE_REVIEW_CACHE_DIR" -maxdepth 1 -name '*.run' | head -1)
old_pid=""
[[ -n "$run_file" ]] && old_pid=$(sed -n 's/^pid=//p' "$run_file" | head -1)
assert_eq "case23: old pid recorded and alive before HEAD moves" "1" \
  "$([[ -n "$old_pid" ]] && kill -0 "$old_pid" 2>/dev/null && echo 1 || echo 0)"

# Advance HEAD — the in-flight run is now reviewing a superseded diff.
( cd "$CR_REPO" && echo "moved" >>tracked.ts && git add tracked.ts && git commit -q -m "advance head mid-run" )
echo "0" >"$STUB_DIR/cr-fake-sleep"

rc=0
out=$(
  cd "$CR_REPO" \
  && DISPATCH_CODE_REVIEW_CLAUDE_CMD="$TMPDIR_TEST/fake-claude-code-review" \
     DISPATCH_CODE_REVIEW_POLL_INTERVAL_S=1 \
     "$SCRIPT_DIR/dispatch-code-review" --target HEAD~1..HEAD --out-dir "$OUT_DIR_23" \
       --await-seconds 30 --deadline-seconds 60 2>"$TMPDIR_TEST/cr-23b.err"
) || rc=$?
assert_eq "case23: second call (new HEAD) exits 0" "0" "$rc"
sleep 0.5
assert_eq "case23: the superseded run's old pid is dead" "0" \
  "$([[ -n "$old_pid" ]] && kill -0 "$old_pid" 2>/dev/null && echo 1 || echo 0)"
idchange_calls=$(wc -l <"$STUB_DIR/cr-fake-calls.log" | tr -d '[:space:]')
assert_eq "case23: exactly two invocations (superseded + relaunch)" "2" "$idchange_calls"

# ============================================================================
# Test 24: a crash that writes no exit-code marker is exit 1, not a hang
# ============================================================================
echo "Test: dispatch-code-review reports exit 1 on a crash that writes no exit-code marker"
cr_reset_stubs
: >"$STUB_DIR/cr-fake-calls.log"
: >"$STUB_DIR/cr-fake-crash"

OUT_DIR_24="$CR_REPO/tmp/cr-out-24"
rc=0
out=$(
  cd "$CR_REPO" \
  && DISPATCH_CODE_REVIEW_CLAUDE_CMD="$TMPDIR_TEST/fake-claude-code-review" \
     DISPATCH_CODE_REVIEW_POLL_INTERVAL_S=1 \
     "$SCRIPT_DIR/dispatch-code-review" --target HEAD~1..HEAD --out-dir "$OUT_DIR_24" \
       --await-seconds 10 --deadline-seconds 60 2>"$TMPDIR_TEST/cr-24.err"
) || rc=$?
assert_eq "case24: exit 1, not a hang" "1" "$rc"
crash_calls=$(wc -l <"$STUB_DIR/cr-fake-calls.log" | tr -d '[:space:]')
assert_eq "case24: the stub was actually invoked" "1" "$crash_calls"
run_left=$(find "$DISPATCH_CODE_REVIEW_CACHE_DIR" -maxdepth 1 -name '*.run' | wc -l | tr -d '[:space:]')
assert_eq "case24: no leftover .run record after the crash is detected" "0" "$run_left"

# ============================================================================
# Test 25: concurrent double-invocation launches once AND both callers exit 0
# ============================================================================
# Two properties, on two different mechanisms:
#
#   1. the launch mutex (Step 2c) dedupes concurrent launches to ONE — the
#      `cr-fake-calls.log` line count;
#   2. BOTH awaiters of that one run report the completed review — both exit 0.
#
# (2) used to fail. The two invocations await the same run, and whichever poll
# saw `.rc` first called collect_output then discard_run_record, deleting
# `.rc`/`.output`/`.run`; the other poll landed in that window, saw a dead pid
# and no `.rc`, and reported the successful run as a crash (exit 1). The launch
# mutex never covered it — it guards the launch decision and is released before
# the await loop starts. The script's await loop now resolves that ambiguity
# with a bounded retry that also accepts a current completed-summary cache
# entry as proof of completion, so the losing awaiter replays it and exits 0.
#
# Determinism: the stub sleeps 5 s and both invocations get --await-seconds 30
# / --deadline-seconds 60, so neither can expire its window before the run
# finishes; and the retry poll's ~29.5 s budget vastly outlasts the winner's
# Steps 5-7 on this throwaway repo (milliseconds). Only a real regression can
# turn either exit code non-zero here.
#
# `rc=0; cmd || rc=$?` (not `cmd && ... ` inside the backgrounded subshell) is
# required so a non-zero exit from either invocation cannot abort the subshell
# under this script's own `set -e` before it records its exit code;
# `wait ... || true` guards the same hazard at the top level.
echo "Test: dispatch-code-review concurrent double-invocation launches once and both callers exit 0"
cr_reset_stubs
: >"$STUB_DIR/cr-fake-calls.log"
printf '%s\n' "Findings from the concurrent race." >"$STUB_DIR/cr-fake-output"
echo "5" >"$STUB_DIR/cr-fake-sleep"

OUT_DIR_25="$CR_REPO/tmp/cr-out-25"
rc1_file="$TMPDIR_TEST/cr-25-rc1"
rc2_file="$TMPDIR_TEST/cr-25-rc2"
(
  cd "$CR_REPO" || exit 1
  rc=0
  DISPATCH_CODE_REVIEW_CLAUDE_CMD="$TMPDIR_TEST/fake-claude-code-review" \
    DISPATCH_CODE_REVIEW_POLL_INTERVAL_S=1 \
    "$SCRIPT_DIR/dispatch-code-review" --target HEAD~1..HEAD --out-dir "$OUT_DIR_25" \
      --await-seconds 30 --deadline-seconds 60 >"$TMPDIR_TEST/cr-25-1.out" 2>"$TMPDIR_TEST/cr-25-1.err" \
    || rc=$?
  echo "$rc" >"$rc1_file"
) &
conc_pid1=$!
(
  cd "$CR_REPO" || exit 1
  rc=0
  DISPATCH_CODE_REVIEW_CLAUDE_CMD="$TMPDIR_TEST/fake-claude-code-review" \
    DISPATCH_CODE_REVIEW_POLL_INTERVAL_S=1 \
    "$SCRIPT_DIR/dispatch-code-review" --target HEAD~1..HEAD --out-dir "$OUT_DIR_25" \
      --await-seconds 30 --deadline-seconds 60 >"$TMPDIR_TEST/cr-25-2.out" 2>"$TMPDIR_TEST/cr-25-2.err" \
    || rc=$?
  echo "$rc" >"$rc2_file"
) &
conc_pid2=$!
wait "$conc_pid1" "$conc_pid2" || true

conc_rc1=$(cat "$rc1_file" 2>/dev/null || echo "?")
conc_rc2=$(cat "$rc2_file" 2>/dev/null || echo "?")
conc_calls=$(wc -l <"$STUB_DIR/cr-fake-calls.log" | tr -d '[:space:]')
assert_eq "case25: the built-in was invoked exactly once" "1" "$conc_calls"
assert_eq "case25: both concurrent awaiters exit 0" "0 0" "$conc_rc1 $conc_rc2"
assert_eq "case25: first invocation reports status=ok" "1" \
  "$(grep -c '^status=ok$' "$TMPDIR_TEST/cr-25-1.out" || true)"
assert_eq "case25: second invocation reports status=ok" "1" \
  "$(grep -c '^status=ok$' "$TMPDIR_TEST/cr-25-2.out" || true)"
assert_eq "case25: both invocations report the same summary" \
  "$(cat "$TMPDIR_TEST/cr-25-1.out")" "$(cat "$TMPDIR_TEST/cr-25-2.out")"

# ============================================================================
# Test 26: an awaiter whose artifacts are collected out from under it replays
# ============================================================================
# The narrowest window of the same concurrent-awaiter race as case 25, one step
# further along. Case 25 covers the loser losing BEFORE it sees `.rc`; this
# covers the loser losing AFTER — both awaiters observe `.rc` in the same
# instant and break out of the await loop together, and the winner's
# `discard_run_record` lands between the loser's `.rc` read and its read of the
# run record's `.output` / `.untracked-before`. The loser used to exit 1 on "the
# untracked-before snapshot is missing", which under review-fix Step 1b
# hard-stops the review phase and discards a completed `high`-effort review.
#
# Case 25 cannot reach this branch deterministically: it needs the two awaiters'
# polls to align within the ~5 ms the winner spends between reading `.rc` and
# deleting it, which no amount of sleep tuning can guarantee. So this case does
# not race at all — it RECONSTRUCTS the loser's exact on-disk state and then
# plays the winner's writes by hand, on the test's clock:
#
#   1. a real run to completion produces an authentic `.run` record (captured
#      mid-flight from the exit-5 call) and an authentic completed summary;
#   2. the record is reinstated pointing at a live `sleep` (so the await loop
#      polls instead of taking the dead-pid branch), with the summary cache
#      removed so the top-of-script replay cannot short-circuit the run;
#   3. `.rc` appears with the artifacts already gone — precisely what the loser
#      sees — and only 2 s LATER does the winner's summary land, which also
#      proves the resolver's retry poll actually retries rather than passing on
#      a first attempt that happened to be lucky.
#
# Nothing here is stubbed or mocked: every file is one a real run wrote.
echo "Test: an awaiter whose run artifacts are collected out from under it replays the winner's summary"
cr_reset_stubs
: >"$STUB_DIR/cr-fake-calls.log"
printf '%s\n' "Findings from the losing awaiter." >"$STUB_DIR/cr-fake-output"
echo "3" >"$STUB_DIR/cr-fake-sleep"

OUT_DIR_26="$CR_REPO/tmp/cr-out-26"
mkdir -p "$OUT_DIR_26"
OUT_DIR_26_ABS="$(cd "$OUT_DIR_26" && pwd)"
CACHE_KEY_26="$(printf '%s' "$OUT_DIR_26_ABS" | sha256sum | cut -d' ' -f1)"
CACHE_FILE_26="$DISPATCH_CODE_REVIEW_CACHE_DIR/$CACHE_KEY_26.summary"
RUN_FILE_26="$DISPATCH_CODE_REVIEW_CACHE_DIR/$CACHE_KEY_26.run"
RUN_RC_26="$DISPATCH_CODE_REVIEW_CACHE_DIR/$CACHE_KEY_26.rc"
RUN_OUTPUT_26="$DISPATCH_CODE_REVIEW_CACHE_DIR/$CACHE_KEY_26.output"
RUN_UNTRACKED_26="$DISPATCH_CODE_REVIEW_CACHE_DIR/$CACHE_KEY_26.untracked-before"

# (1) Kick the run, expire the window, and capture the authentic in-flight record.
rc=0
(
  cd "$CR_REPO" \
  && DISPATCH_CODE_REVIEW_CLAUDE_CMD="$TMPDIR_TEST/fake-claude-code-review" \
     DISPATCH_CODE_REVIEW_POLL_INTERVAL_S=1 \
     "$SCRIPT_DIR/dispatch-code-review" --target HEAD~1..HEAD --out-dir "$OUT_DIR_26" \
       --await-seconds 1 --deadline-seconds 120 >/dev/null 2>"$TMPDIR_TEST/cr-26a.err"
) || rc=$?
assert_eq "case26: setup — the first call leaves the run in flight (exit 5)" "5" "$rc"
cp "$RUN_FILE_26" "$TMPDIR_TEST/cr-26-saved.run"

# Let the same run finish normally. This writes the completed summary the losing
# awaiter must later replay, and leaves the out-dir artifacts cache_is_current
# authenticates against.
rc=0
(
  cd "$CR_REPO" \
  && DISPATCH_CODE_REVIEW_CLAUDE_CMD="$TMPDIR_TEST/fake-claude-code-review" \
     DISPATCH_CODE_REVIEW_POLL_INTERVAL_S=1 \
     "$SCRIPT_DIR/dispatch-code-review" --target HEAD~1..HEAD --out-dir "$OUT_DIR_26" \
       --await-seconds 30 --deadline-seconds 120 >/dev/null 2>"$TMPDIR_TEST/cr-26b.err"
) || rc=$?
assert_eq "case26: setup — the run completes for real (exit 0)" "0" "$rc"
cp "$CACHE_FILE_26" "$TMPDIR_TEST/cr-26-saved.summary"

# (2) Reconstruct the loser's state. The record must point at a LIVE pid or the
# await loop takes the dead-pid branch (case 25's window) instead of polling to
# the `.rc` this case is about. `pid_starttime` is blanked deliberately: the
# script skips the starttime cross-check when the record carries none, which is
# the one field a hand-built record cannot honestly supply for a foreign pid.
sleep 60 &
live_pid_26=$!
sed -e "s/^pid=.*/pid=$live_pid_26/" -e 's/^pid_starttime=.*/pid_starttime=/' \
  "$TMPDIR_TEST/cr-26-saved.run" >"$RUN_FILE_26"
rm -f "$CACHE_FILE_26" "$RUN_RC_26" "$RUN_OUTPUT_26" "$RUN_UNTRACKED_26"

# (3) The awaiter runs while the "winner" plays its writes on the test's clock.
rc26_file="$TMPDIR_TEST/cr-26-rc"
(
  cd "$CR_REPO" || exit 1
  rc=0
  DISPATCH_CODE_REVIEW_CLAUDE_CMD="$TMPDIR_TEST/fake-claude-code-review" \
    DISPATCH_CODE_REVIEW_POLL_INTERVAL_S=1 \
    "$SCRIPT_DIR/dispatch-code-review" --target HEAD~1..HEAD --out-dir "$OUT_DIR_26" \
      --await-seconds 30 --deadline-seconds 600 >"$TMPDIR_TEST/cr-26c.out" 2>"$TMPDIR_TEST/cr-26c.err" \
    || rc=$?
  echo "$rc" >"$rc26_file"
) &
loser_pid_26=$!

sleep 2
# `.rc` with the artifacts ALREADY gone: the loser breaks out of the await loop
# and finds the record collected out from under it.
echo "0" >"$RUN_RC_26"
sleep 2
# Only now does the winner's summary land — the loser must have been retrying.
cp "$TMPDIR_TEST/cr-26-saved.summary" "$CACHE_FILE_26"

wait "$loser_pid_26" || true
kill "$live_pid_26" 2>/dev/null || true

conc26_rc=$(cat "$rc26_file" 2>/dev/null || echo "?")
assert_eq "case26: the losing awaiter exits 0, not 1" "0" "$conc26_rc"
assert_eq "case26: it replays the winner's summary verbatim" \
  "$(cat "$TMPDIR_TEST/cr-26-saved.summary")" "$(cat "$TMPDIR_TEST/cr-26c.out")"
assert_eq "case26: it does not report the artifacts as missing" "0" \
  "$(grep -c 'is missing' "$TMPDIR_TEST/cr-26c.err" || true)"
# The whole point: the loser must not pay for a second review. Two invocations
# across the case's own setup would mean a relaunch, not a replay.
assert_eq "case26: the built-in was never re-invoked" "1" \
  "$(wc -l <"$STUB_DIR/cr-fake-calls.log" | tr -d '[:space:]')"

teardown

report_results
