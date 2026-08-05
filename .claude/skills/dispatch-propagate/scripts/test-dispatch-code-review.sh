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
# `-p <prompt> --permission-mode acceptEdits` (stdin already redirected to
# /dev/null by the caller). Behavior is driven by files under $STUB_DIR:
#   $STUB_DIR/cr-fake-output      text to print on stdout (default: empty)
#   $STUB_DIR/cr-fake-exit        exit code to return (default: 0)
#   $STUB_DIR/cr-fake-sleep       seconds to sleep before responding (default: 0)
#   $STUB_DIR/cr-fake-edit-file   path (relative to CWD) to write/touch before
#                                 responding, modeling a --fix edit
#   $STUB_DIR/cr-fake-calls.log   appended once per invocation (call-count probe)
write_fake_code_review_claude() {
  cat >"$TMPDIR_TEST/fake-claude-code-review" <<'STUB'
#!/usr/bin/env bash
STUB_DIR="$(cd "$(dirname "$0")" && pwd)/stub"
echo "call" >> "$STUB_DIR/cr-fake-calls.log"

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
        "$STUB_DIR"/cr-fake-calls.log
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
# Test 9: timeout
# ============================================================================
echo "Test: dispatch-code-review timeout"
cr_reset_stubs
printf '%s\n' "unreachable" >"$STUB_DIR/cr-fake-output"
echo "5" >"$STUB_DIR/cr-fake-sleep"

OUT_DIR_9="$CR_REPO/tmp/cr-out-9"
rc=0
out=$(
  cd "$CR_REPO" \
  && DISPATCH_CODE_REVIEW_CLAUDE_CMD="$TMPDIR_TEST/fake-claude-code-review" \
     DISPATCH_CODE_REVIEW_TIMEOUT=1 \
     "$SCRIPT_DIR/dispatch-code-review" --target HEAD~1..HEAD --out-dir "$OUT_DIR_9" 2>"$TMPDIR_TEST/cr-9.err"
) || rc=$?
assert_eq "case9: exit 4" "4" "$rc"

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

teardown

report_results
