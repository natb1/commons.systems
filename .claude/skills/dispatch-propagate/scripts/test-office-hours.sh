#!/usr/bin/env bash
# Tests for office-hours -- moved verbatim from test-dispatch-scripts.sh
# (tactic-dispatch-test-monolith-split). Original section: 3167-3661.
set -euo pipefail

FIXTURE_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=dispatch-test-fixture.sh
source "$FIXTURE_DIR/dispatch-test-fixture.sh"

# >>> MOVED FROM test-dispatch-scripts.sh >>>
# ============================================================================
# office-hours (entry point) tests
# ============================================================================
echo ""
echo "=== office-hours (entry point) ==="
#
# The single user entry point to the office-hours queue (#759). It is a thin
# dispatcher: it calls office-hours-select-target once and switches on the verb —
# live / parked-router (exec `claude attach <sessionId>`), fresh (spawn a `--bg`
# session named office-hours-<N> that boots the `/office-hours <N>`
# review-and-recommend skill, then attach by name, #2520), or empty (print a
# queue-empty message and exit WITHOUT launching). These are therefore
# entry+selector integration tests: setup copies the real selector into
# TMPDIR_TEST, the selector emits the disposition, and office_hours_fake_claude
# serves the selector's `agents` liveness query and prints `LAUNCH: $*` on
# launch so each case asserts which launch fired (or that none did). The fake's
# sessionId convention is `s-<worktree-basename>`.

# OH1. One labeled item whose <N>-* worktree has an idle (attachable) session →
# attach it. The entry handles the renamed `idle` verb (was `live`).
echo "Test: idle-session labeled item → attach its session"
setup
printf '[{"number":42,"createdAt":"2024-01-01T00:00:00Z"}]\n' > "$STUB_DIR/oh-issue-list.json"
printf 'worktree /repo\nHEAD abc123\nbranch refs/heads/main\n\nworktree /worktrees/42-x\nHEAD def456\nbranch refs/heads/42-x\n\n' \
  > "$STUB_DIR/worktree-list.txt"
mkdir -p "$TMPDIR_TEST/wt/42-x"
office_hours_state_fake_claude "42-x:waiting:$TMPDIR_TEST/wt/42-x"   # 42's worktree has an idle session
result=$("$TMPDIR_TEST/office-hours")
assert_eq "attaches the idle session by its job id" "LAUNCH: attach j-42-x" "$result"
teardown

# OH2. Two labeled items both idle → attach the oldest one's session.
echo "Test: two idle items → attach the oldest"
setup
printf '[{"number":42,"createdAt":"2024-01-01T00:00:00Z"},{"number":99,"createdAt":"2024-02-01T00:00:00Z"}]\n' \
  > "$STUB_DIR/oh-issue-list.json"
printf 'worktree /repo\nHEAD abc123\nbranch refs/heads/main\n\nworktree /worktrees/42-x\nHEAD def456\nbranch refs/heads/42-x\n\nworktree /worktrees/99-y\nHEAD aaa111\nbranch refs/heads/99-y\n\n' \
  > "$STUB_DIR/worktree-list.txt"
mkdir -p "$TMPDIR_TEST/wt/42-x" "$TMPDIR_TEST/wt/99-y"
office_hours_state_fake_claude "42-x:waiting:$TMPDIR_TEST/wt/42-x" "99-y:waiting:$TMPDIR_TEST/wt/99-y"   # both worktrees idle
result=$("$TMPDIR_TEST/office-hours")
assert_eq "attaches the oldest idle item's session by its job id" "LAUNCH: attach j-42-x" "$result"
teardown

# OH3. Labeled items but none with a live session → spawn a --bg session named
# office-hours-<N>, cwd = that worktree, booting the `/office-hours <N>`
# review-and-recommend skill (#2520). The skill reviews the item and stops;
# the human then attaches by name and drives. Fixes the originally-reported
# label leak (#1160): born in the worktree, the session's branch is <N>-...,
# so the strip hook clears the label.
# NOTE: this is the ONLY disposition that boots a skill — the attach dispositions
# (OH1/OH2/OH5b) go straight to `claude attach` and load no skill.
echo "Test: labeled item, none live → /office-hours <N> skill --bg spawn then attach"
setup
mkdir -p "$TMPDIR_TEST/worktrees/42-x"
printf '[{"number":42,"createdAt":"2024-01-01T00:00:00Z"}]\n' > "$STUB_DIR/oh-issue-list.json"
printf 'worktree /repo\nHEAD abc123\nbranch refs/heads/main\n\nworktree %s\nHEAD def456\nbranch refs/heads/42-x\n\n' \
  "$TMPDIR_TEST/worktrees/42-x" > "$STUB_DIR/worktree-list.txt"
office_hours_fresh_fake_claude
result=$("$TMPDIR_TEST/office-hours")
# Attaches the human to the just-spawned session, by its resolved job id.
assert_eq "fresh path attaches the spawned session's job id" "LAUNCH: attach job-office-hours-42" "$result"
# The spawn was a --bg job named office-hours-<N> booting the review skill.
mapfile -t oh_argv < "$TMPDIR_TEST/oh-bg-argv"
assert_eq "fresh: --bg" "--bg" "${oh_argv[0]:-}"
assert_eq "fresh: --name" "--name" "${oh_argv[1]:-}"
assert_eq "fresh: name is office-hours-<N>" "office-hours-42" "${oh_argv[2]:-}"
assert_eq "fresh: --permission-mode" "--permission-mode" "${oh_argv[3]:-}"
assert_eq "fresh: permission mode is auto" "auto" "${oh_argv[4]:-}"
# Review-and-recommend skill spawn (#2520): the recorded argv must carry the
# /office-hours <N> positional skill prompt (position-independent substring
# check over the whole argv, mirroring the resume test's "no continue" idiom).
oh_has_prompt=no; [[ "$(cat "$TMPDIR_TEST/oh-bg-argv")" == */office-hours\ 42* ]] && oh_has_prompt=yes
assert_eq "fresh: carries /office-hours <N> review-and-recommend skill prompt" "yes" "$oh_has_prompt"
# The --bg job was born in the worktree (cwd = worktree path).
oh_pwd=$(head -1 "$TMPDIR_TEST/oh-pwd-log" 2>/dev/null || true)
assert_eq "fresh: spawn cwd is the worktree" "$(realpath "$TMPDIR_TEST/worktrees/42-x")" "$(realpath "$oh_pwd" 2>/dev/null)"
teardown

# OH3c. A labeled item whose worktree has an idle session named office-hours-<N>
# (the renamed office-hours session, #1311) → attach it directly. Before the
# two-name fix the selector keyed only on the basename and missed it.
echo "Test: idle office-hours-<N> session → selector attaches it directly"
setup
printf '[{"number":42,"createdAt":"2024-01-01T00:00:00Z"}]\n' > "$STUB_DIR/oh-issue-list.json"
printf 'worktree /repo\nHEAD abc123\nbranch refs/heads/main\n\nworktree /worktrees/42-x\nHEAD def456\nbranch refs/heads/42-x\n\n' \
  > "$STUB_DIR/worktree-list.txt"
mkdir -p "$TMPDIR_TEST/wt/42-x"
office_hours_state_fake_claude "office-hours-42:waiting:$TMPDIR_TEST/wt/42-x"   # idle office-hours-<N> session
result=$("$TMPDIR_TEST/office-hours")
assert_eq "attaches the idle office-hours-<N> session by its job id" "LAUNCH: attach j-office-hours-42" "$result"
teardown

# OH3b. Sessionless item with NO <N>-* worktree on disk (the worktree was swept) →
# the selector emits `-` for the path field, so the entry script exits non-zero with
# a clear diagnostic and launches nothing (clear-errors-over-fallbacks).
echo "Test: sessionless item with no worktree → non-zero exit, no launch"
setup
printf '[{"number":42,"createdAt":"2024-01-01T00:00:00Z"}]\n' > "$STUB_DIR/oh-issue-list.json"
printf 'worktree /repo\nHEAD abc123\n\n' > "$STUB_DIR/worktree-list.txt"   # no 42-* worktree
office_hours_fresh_fake_claude
rc=0; out=$("$TMPDIR_TEST/office-hours" 2>&1) || rc=$?
assert_eq "no worktree → exit 1" "1" "$rc"
assert_eq "no worktree → no spawn recorded" "no" \
  "$([[ -e "$TMPDIR_TEST/oh-bg-argv" ]] && echo yes || echo no)"
teardown

# OH3d. main-qa fresh-spawn negative path (OHST12): a main-qa-labelled, no-PR item
# whose DISPATCH_OFFICE_HOURS_MAIN_WORKTREE directory does NOT exist → the entry
# script exits 1 and records no spawn (fresh_session's cwd-into-worktree fails).
echo "Test: main-qa item with missing main worktree dir → exit 1, no spawn"
setup
printf '[{"number":42,"createdAt":"2024-01-01T00:00:00Z","labels":[{"name":"main-qa"}]}]\n' \
  > "$STUB_DIR/oh-issue-list.json"
echo '[]' > "$STUB_DIR/pr-list-full.json"
printf 'worktree /repo\nHEAD abc123\n\n' > "$STUB_DIR/worktree-list.txt"
export DISPATCH_OFFICE_HOURS_MAIN_WORKTREE="$TMPDIR_TEST/worktrees/main"
# Do NOT mkdir the main worktree dir — this is the negative path being tested.
office_hours_fresh_fake_claude
rc=0; out=$("$TMPDIR_TEST/office-hours" 2>&1) || rc=$?
assert_eq "main-qa missing main worktree → exit 1" "1" "$rc"
assert_eq "main-qa missing main worktree → no spawn recorded" "no" \
  "$([[ -e "$TMPDIR_TEST/oh-bg-argv" ]] && echo yes || echo no)"
assert_eq "main-qa missing main worktree → spawn-fail diagnostic (not worktree-swept diagnostic)" "yes" \
  "$([[ "$out" == *'failed to launch'* ]] && echo yes || echo no)"
unset DISPATCH_OFFICE_HOURS_MAIN_WORKTREE
teardown

# OH4. Empty office-hours queue → selector emits `empty` → the entry script prints
# the queue-empty message and exits WITHOUT launching Claude.
echo "Test: empty queue → queue-empty message, no launch"
setup
echo '[]' > "$STUB_DIR/oh-issue-list.json"
printf 'worktree /repo\nHEAD abc123\n\n' > "$STUB_DIR/worktree-list.txt"
export DISPATCH_OFFICE_HOURS_MAIN_WORKTREE="$TMPDIR_TEST/worktrees/main"
office_hours_fake_claude   # `[]`: no sessions under main, no parked router
result=$("$TMPDIR_TEST/office-hours")
assert_eq "empty queue → queue-empty message, no launch" "office-hours: queue is empty — nothing to resume or start." "$result"
unset DISPATCH_OFFICE_HOURS_MAIN_WORKTREE
teardown

# OH4b (#2538). Targeted non-member <N> → the selector emits `empty not-in-queue
# <N>` and the entry script prints a PRECISE non-member message — NOT the generic
# queue-empty one — even though the queue has another member (42). This is the
# end-to-end proof of the code-review fix: a non-member targeted <N> (e.g. a typo)
# must not be told the queue is empty when other members exist.
echo "Test: targeted non-member N=777 → not-in-queue message, no launch"
setup
printf '[{"number":42,"createdAt":"2024-01-01T00:00:00Z"}]\n' > "$STUB_DIR/oh-issue-list.json"
printf 'worktree /repo\nHEAD abc123\n\n' > "$STUB_DIR/worktree-list.txt"
office_hours_fake_claude
result=$("$TMPDIR_TEST/office-hours" 777)
assert_eq "targeted non-member N=777 → not-in-queue message, no launch" \
  "office-hours: issue #777 is not in the office-hours queue — nothing to resume or start for it." "$result"
teardown

# OH5. Mixed: an older sessionless item + a newer idle-session item → attach the
# idle one (idle wins over fresh whenever any labeled item is attachable).
echo "Test: older sessionless + newer idle → attach the idle one"
setup
printf '[{"number":42,"createdAt":"2024-01-01T00:00:00Z"},{"number":99,"createdAt":"2024-02-01T00:00:00Z"}]\n' \
  > "$STUB_DIR/oh-issue-list.json"
# 42 (older) has no worktree at all → sessionless; 99 (newer) has an idle worktree.
printf 'worktree /repo\nHEAD abc123\nbranch refs/heads/main\n\nworktree /worktrees/99-y\nHEAD aaa111\nbranch refs/heads/99-y\n\n' \
  > "$STUB_DIR/worktree-list.txt"
mkdir -p "$TMPDIR_TEST/wt/99-y"
office_hours_state_fake_claude "99-y:idle:$TMPDIR_TEST/wt/99-y"   # only 99's worktree is idle
result=$("$TMPDIR_TEST/office-hours")
assert_eq "idle wins over fresh whenever any labeled item is attachable" "LAUNCH: attach j-99-y" "$result"
teardown

# OH5b. Done-attach (entry, end-to-end, --all-faithful): one labeled item (42)
# with a `done` session in its worktree. The selector emits `idle s-42-x` (it
# passed `--all`, so it saw the `done` row), and the entry's attach_session
# resolves s-42-x → j-42-x via `agents --json --all`. With the faithful fake the
# entry can ONLY resolve the `done` row because Unit 3's attach_session passes
# `--all`; a regression dropping it would hide the row and turn this red. This is
# the end-to-end (selector + entry) proof that both ends query with `--all`.
echo "Test: done-session item → end-to-end attach (proves both ends pass --all)"
setup
printf '[{"number":42,"createdAt":"2024-01-01T00:00:00Z"}]\n' > "$STUB_DIR/oh-issue-list.json"
printf 'worktree /repo\nHEAD abc123\nbranch refs/heads/main\n\nworktree /worktrees/42-x\nHEAD def456\nbranch refs/heads/42-x\n\n' \
  > "$STUB_DIR/worktree-list.txt"
mkdir -p "$TMPDIR_TEST/wt/42-x"
office_hours_state_fake_claude "42-x:done:$TMPDIR_TEST/wt/42-x"
result=$("$TMPDIR_TEST/office-hours")
assert_eq "done session attached end-to-end by its job id" "LAUNCH: attach j-42-x" "$result"
teardown

# OH5c. Working-skip (entry): a lone labeled item (42) whose session is `working`
# → the selector skips it (neither attach nor fresh) and, with no parked router,
# emits `empty`; the entry prints the queue-empty message and launches nothing.
echo "Test: lone working item → queue-empty message, no launch"
setup
printf '[{"number":42,"createdAt":"2024-01-01T00:00:00Z"}]\n' > "$STUB_DIR/oh-issue-list.json"
printf 'worktree /repo\nHEAD abc123\nbranch refs/heads/main\n\nworktree /worktrees/42-x\nHEAD def456\nbranch refs/heads/42-x\n\n' \
  > "$STUB_DIR/worktree-list.txt"
export DISPATCH_OFFICE_HOURS_MAIN_WORKTREE="$TMPDIR_TEST/worktrees/main"
office_hours_state_fake_claude "42-x:working"
result=$("$TMPDIR_TEST/office-hours")
assert_eq "lone working item → queue-empty message, no launch" "office-hours: queue is empty — nothing to resume or start." "$result"
unset DISPATCH_OFFICE_HOURS_MAIN_WORKTREE
teardown

# OH6. UNKNOWN daemon (claude unqueryable). Under the single fail-safe convention
# the only labeled item (42) is UNKNOWN → skipped by the selector, and the
# parked-router fallback also reads UNKNOWN → no router, so the selector emits
# `empty`. The entry script prints the queue-empty message and does not launch.
# (The old entry-vs-selector asymmetry — entry treating UNKNOWN as not-resumable
# and falling through to a fresh session — is gone; UNKNOWN is occupied
# everywhere now that the enumeration is no longer duplicated.)
echo "Test: UNKNOWN daemon → selector empty → queue-empty message, no launch"
setup
printf '[{"number":42,"createdAt":"2024-01-01T00:00:00Z"}]\n' > "$STUB_DIR/oh-issue-list.json"
printf 'worktree /repo\nHEAD abc123\nbranch refs/heads/main\n\nworktree /worktrees/42-x\nHEAD def456\nbranch refs/heads/42-x\n\n' \
  > "$STUB_DIR/worktree-list.txt"
export DISPATCH_OFFICE_HOURS_MAIN_WORKTREE="$TMPDIR_TEST/worktrees/main"
office_hours_fake_claude   # sets OFFICE_HOURS_CLAUDE_CMD + CLAUDE_AGENTS_CMD
# Override the claude binary so the `agents` query always exits 1 (UNKNOWN
# daemon), while launch invocations still print "LAUNCH: $*".
cat > "$TMPDIR_TEST/bin/claude" <<'FAKE'
#!/usr/bin/env bash
if [[ "${1:-}" == "agents" ]]; then
  exit 1
fi
echo "LAUNCH: $*"
exit 0
FAKE
chmod +x "$TMPDIR_TEST/bin/claude"
result=$("$TMPDIR_TEST/office-hours")
assert_eq "UNKNOWN daemon → selector empty → queue-empty message, no launch" "office-hours: queue is empty — nothing to resume or start." "$result"
unset DISPATCH_OFFICE_HOURS_MAIN_WORKTREE
teardown

# OH7. The selector emits `parked-router <sessionId> <name>` (a target-less
# parked dispatch router, #1010) → the entry script attaches that session. The
# entry script gains the parked-router handling the selector already had.
echo "Test: parked-router directive → entry attaches the router session"
setup
echo '[]' > "$STUB_DIR/oh-issue-list.json"
printf 'worktree /repo\nHEAD abc123\n\n' > "$STUB_DIR/worktree-list.txt"
export DISPATCH_OFFICE_HOURS_MAIN_WORKTREE="$TMPDIR_TEST/worktrees/main"
office_hours_fake_claude   # sets OFFICE_HOURS_CLAUDE_CMD + CLAUDE_AGENTS_CMD
# A live, idle `dispatch-*` router under main on the `agents` query; launch
# invocations still print "LAUNCH: $*".
cat > "$TMPDIR_TEST/bin/claude" <<'FAKE'
#!/usr/bin/env bash
if [[ "${1:-}" == "agents" ]]; then
  printf '%s' '[{"sessionId":"s-dispatch-abc123","id":"j-dispatch-abc123","pid":1,"status":"waiting","name":"dispatch-abc123","cwd":""}]'
  exit 0
fi
echo "LAUNCH: $*"
exit 0
FAKE
chmod +x "$TMPDIR_TEST/bin/claude"
result=$("$TMPDIR_TEST/office-hours")
assert_eq "parked-router directive attaches the router session by its job id" "LAUNCH: attach j-dispatch-abc123" "$result"
unset DISPATCH_OFFICE_HOURS_MAIN_WORKTREE
teardown

# OH8. idle-provision end-to-end success (#2241): a swept attachable session whose
# `origin/<branch>` exists → the selector emits `idle-provision s-42-x 42-x`; the
# entry's idle-provision arm calls dispatch-provision-from-remote (stubbed here to
# succeed) and then attaches the originating session by its resolved job id. The
# fake claude must still report 42-x so attach_session resolves s-42-x → j-42-x.
echo "Test: idle-provision verb → provision then attach (end-to-end success)"
setup
printf '[{"number":42,"createdAt":"2024-01-01T00:00:00Z"}]\n' > "$STUB_DIR/oh-issue-list.json"
echo '[]' > "$STUB_DIR/pr-list-full.json"
printf 'worktree /repo\nHEAD abc123\nbranch refs/heads/main\n\n' > "$STUB_DIR/worktree-list.txt"   # 42-x NOT registered → swept path
printf '%s\n' '42-x' > "$STUB_DIR/remote-branches.txt"   # origin/42-x exists
export DISPATCH_OFFICE_HOURS_MAIN_WORKTREE="$TMPDIR_TEST/worktrees/main"
office_hours_state_fake_claude "42-x:waiting:/worktrees/42-x"   # swept cwd; reports 42-x for attach resolution
# Stub the provisioning helper to succeed (print a worktree path, exit 0).
cat > "$TMPDIR_TEST/dispatch-provision-from-remote" <<'STUB'
#!/usr/bin/env bash
echo "/worktrees/$1"
exit 0
STUB
chmod +x "$TMPDIR_TEST/dispatch-provision-from-remote"
result=$("$TMPDIR_TEST/office-hours")
assert_eq "idle-provision → provision succeeds, then attach by job id" "LAUNCH: attach j-42-x" "$result"
unset DISPATCH_OFFICE_HOURS_MAIN_WORKTREE
teardown

# OH9. idle-provision provision-failure (#2241): same setup as OH8 but the
# provisioning helper FAILS (exit 1) → the entry prints a diagnostic to stderr and
# exits non-zero WITHOUT attaching (no LAUNCH). clear-errors-over-fallbacks: a
# provisioning failure surfaces, it does not silently fall back to a fresh launch.
echo "Test: idle-provision provision failure → exit non-zero, no attach"
setup
printf '[{"number":42,"createdAt":"2024-01-01T00:00:00Z"}]\n' > "$STUB_DIR/oh-issue-list.json"
echo '[]' > "$STUB_DIR/pr-list-full.json"
printf 'worktree /repo\nHEAD abc123\nbranch refs/heads/main\n\n' > "$STUB_DIR/worktree-list.txt"
printf '%s\n' '42-x' > "$STUB_DIR/remote-branches.txt"
export DISPATCH_OFFICE_HOURS_MAIN_WORKTREE="$TMPDIR_TEST/worktrees/main"
office_hours_state_fake_claude "42-x:waiting:/worktrees/42-x"
# Stub the provisioning helper to FAIL.
cat > "$TMPDIR_TEST/dispatch-provision-from-remote" <<'STUB'
#!/usr/bin/env bash
echo "provision failed" >&2
exit 1
STUB
chmod +x "$TMPDIR_TEST/dispatch-provision-from-remote"
rc=0; result=$("$TMPDIR_TEST/office-hours") || rc=$?
assert_eq "provision failure → non-zero exit" "yes" "$([[ "$rc" -ne 0 ]] && echo yes || echo no)"
assert_eq "provision failure → no LAUNCH (no attach)" "no" \
  "$([[ "$result" == *LAUNCH:* ]] && echo yes || echo no)"
unset DISPATCH_OFFICE_HOURS_MAIN_WORKTREE
teardown

# OH10. Swept-and-unprovisionable diagnostic (#2241 criterion-3, end-to-end): a
# swept attachable session whose `origin/<branch>` is ABSENT → the selector falls
# back to the fresh path with a `-` path field (`office-hours 42 -`); the
# entry's `[[ -z "$d" || "$d" == "-" ]]` guard prints the swept-worktree
# diagnostic and exits non-zero without launching anything.
echo "Test: swept + unprovisionable → swept diagnostic, exit non-zero, no launch"
setup
printf '[{"number":42,"createdAt":"2024-01-01T00:00:00Z"}]\n' > "$STUB_DIR/oh-issue-list.json"
echo '[]' > "$STUB_DIR/pr-list-full.json"
printf 'worktree /repo\nHEAD abc123\nbranch refs/heads/main\n\n' > "$STUB_DIR/worktree-list.txt"
# Omit remote-branches.txt → origin/42-x missing → bucket 3 → fresh `-` path.
export DISPATCH_OFFICE_HOURS_MAIN_WORKTREE="$TMPDIR_TEST/worktrees/main"
office_hours_state_fake_claude "42-x:waiting:/worktrees/42-x"
rc=0; out=$("$TMPDIR_TEST/office-hours" 2>&1) || rc=$?
assert_eq "swept + unprovisionable → non-zero exit" "yes" "$([[ "$rc" -ne 0 ]] && echo yes || echo no)"
assert_eq "swept + unprovisionable → swept-worktree diagnostic on stderr" "yes" \
  "$([[ "$out" == *'no <N>-* worktree resolved for #42 — cannot launch a fresh session'* ]] && echo yes || echo no)"
assert_eq "swept + unprovisionable → no LAUNCH (no spawn)" "no" \
  "$([[ "$out" == *LAUNCH:* ]] && echo yes || echo no)"
unset DISPATCH_OFFICE_HOURS_MAIN_WORKTREE
teardown

# OH11. resume arm end-to-end (#2240): the selector emits `resume <N> <sid> <cwd>`
# for a removed-but-recoverable session whose worktree is on disk. The entry
# resumes it as a --bg job named by the worktree basename (42-x) rooted at <cwd>,
# carrying NO "continue" prompt (it parks for the human), then attaches BY NAME.
# Stub the selector to emit the directive; a fake claude logs the --bg argv,
# serves the post-resume registry (42-x under a FORKED sessionId, so attach must
# resolve by NAME not by the verb's sess-abc), and echoes attach.
echo "Test: resume directive → --bg --resume kick named by worktree basename, no continue, attach by name"
setup
mkdir -p "$TMPDIR_TEST/wt/42-x"
cat > "$TMPDIR_TEST/office-hours-select-target" <<EOF
#!/usr/bin/env bash
echo "resume 42 sess-abc $TMPDIR_TEST/wt/42-x"
EOF
chmod +x "$TMPDIR_TEST/office-hours-select-target"
cat > "$TMPDIR_TEST/bin/claude" <<'FAKE'
#!/usr/bin/env bash
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
case "$1" in
  agents)
    echo '[{"sessionId":"forked-xyz","id":"j-42-x","pid":1,"state":"idle","status":"idle","name":"42-x","cwd":""}]'
    ;;
  attach)
    echo "LAUNCH: attach $2"
    ;;
  *)
    echo "$*" >> "$ROOT/bg-argv-log"
    ;;
esac
exit 0
FAKE
chmod +x "$TMPDIR_TEST/bin/claude"
export OFFICE_HOURS_CLAUDE_CMD="$TMPDIR_TEST/bin/claude"
export CLAUDE_AGENTS_CMD="$TMPDIR_TEST/bin/claude"   # verify_agent_registered_under queries this
export LIB_CLAUDE_AGENTS_VERIFY_INTERVAL_S=0          # don't sleep between verify polls
result=$("$TMPDIR_TEST/office-hours")
bg=$(cat "$TMPDIR_TEST/bg-argv-log" 2>/dev/null || true)
assert_eq "resume kick argv (single, no fork, no continue)" "--bg --name 42-x --permission-mode auto --resume sess-abc" "$bg"
# The resume must NOT auto-run work: no "continue" prompt token, and the --name
# must equal the worktree basename (42-x), matching the Stop hook's ^[0-9]+- gate.
oh_has_continue=no; [[ "$bg" == *continue* ]] && oh_has_continue=yes
assert_eq "resume kick carries no continue prompt token" "no" "$oh_has_continue"
oh_name=$(printf '%s\n' "$bg" | sed -n 's/.*--name \([^ ]*\).*/\1/p')
assert_eq "resume --name equals worktree basename" "42-x" "$oh_name"
assert_eq "resume attaches by name → j-42-x (not the verb sessionId)" "LAUNCH: attach j-42-x" "$result"
unset OFFICE_HOURS_CLAUDE_CMD CLAUDE_AGENTS_CMD LIB_CLAUDE_AGENTS_VERIFY_INTERVAL_S
teardown

# OH12. resume fork-retry (#2240): the primary --bg --resume kick fails (a dead
# sessionId can collide in the registry), so the entry retries ONCE with
# --fork-session, then attaches BY NAME (the forked id is reachable via the stable
# worktree basename). The fake fails any --bg kick lacking --fork-session.
echo "Test: resume primary kick fails → fork-session retry, then attach by name"
setup
mkdir -p "$TMPDIR_TEST/wt/42-x"
cat > "$TMPDIR_TEST/office-hours-select-target" <<EOF
#!/usr/bin/env bash
echo "resume 42 sess-abc $TMPDIR_TEST/wt/42-x"
EOF
chmod +x "$TMPDIR_TEST/office-hours-select-target"
cat > "$TMPDIR_TEST/bin/claude" <<'FAKE'
#!/usr/bin/env bash
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
case "$1" in
  agents)
    echo '[{"sessionId":"forked-xyz","id":"j-42-x","pid":1,"state":"idle","status":"idle","name":"42-x","cwd":""}]'
    exit 0
    ;;
  attach)
    echo "LAUNCH: attach $2"
    exit 0
    ;;
  *)
    echo "$*" >> "$ROOT/bg-argv-log"
    # Fail the primary kick (no --fork-session); succeed the fork retry.
    [[ "$*" == *"--fork-session"* ]] || exit 1
    exit 0
    ;;
esac
FAKE
chmod +x "$TMPDIR_TEST/bin/claude"
export OFFICE_HOURS_CLAUDE_CMD="$TMPDIR_TEST/bin/claude"
export CLAUDE_AGENTS_CMD="$TMPDIR_TEST/bin/claude"   # verify_agent_registered_under queries this
export LIB_CLAUDE_AGENTS_VERIFY_INTERVAL_S=0          # don't sleep between verify polls
result=$("$TMPDIR_TEST/office-hours")
mapfile -t oh_resume_argv < "$TMPDIR_TEST/bg-argv-log"
assert_eq "primary kick carries no --fork-session (no continue)" "--bg --name 42-x --permission-mode auto --resume sess-abc" "${oh_resume_argv[0]:-}"
assert_eq "fork retry appends --fork-session (no continue)" "--bg --name 42-x --permission-mode auto --resume sess-abc --fork-session" "${oh_resume_argv[1]:-}"
assert_eq "after fork, attach by name → j-42-x" "LAUNCH: attach j-42-x" "$result"
unset OFFICE_HOURS_CLAUDE_CMD CLAUDE_AGENTS_CMD LIB_CLAUDE_AGENTS_VERIFY_INTERVAL_S
teardown

# OH13. resume verify-fails-then-fork (#2240): the primary --bg --resume kick
# returns 0 but NO session registers — the real async-reject mode for a
# dead/colliding sessionId (claude --bg returns before registration; a rejected
# id never registers). The verify gate must catch this (rc 0 is not enough) and
# retry with --fork-session, after which the session registers and attach
# resolves by name. The fake registers the basename session (42-x) ONLY after a
# --fork-session kick.
echo "Test: resume primary kick returns 0 but never registers → verify fails → fork"
setup
mkdir -p "$TMPDIR_TEST/wt/42-x"
cat > "$TMPDIR_TEST/office-hours-select-target" <<EOF
#!/usr/bin/env bash
echo "resume 42 sess-abc $TMPDIR_TEST/wt/42-x"
EOF
chmod +x "$TMPDIR_TEST/office-hours-select-target"
cat > "$TMPDIR_TEST/bin/claude" <<'FAKE'
#!/usr/bin/env bash
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
case "$1" in
  agents)
    # Registered ONLY after a --fork-session kick created the marker.
    if [[ -f "$ROOT/forked" ]]; then
      echo '[{"sessionId":"forked-xyz","id":"j-42-x","pid":1,"state":"idle","status":"idle","name":"42-x","cwd":""}]'
    else
      echo '[]'
    fi
    exit 0
    ;;
  attach)
    echo "LAUNCH: attach $2"
    exit 0
    ;;
  *)
    echo "$*" >> "$ROOT/bg-argv-log"
    # Primary kick returns 0 but does NOT register; the fork kick registers.
    [[ "$*" == *"--fork-session"* ]] && touch "$ROOT/forked"
    exit 0
    ;;
esac
FAKE
chmod +x "$TMPDIR_TEST/bin/claude"
export OFFICE_HOURS_CLAUDE_CMD="$TMPDIR_TEST/bin/claude"
export CLAUDE_AGENTS_CMD="$TMPDIR_TEST/bin/claude"
export LIB_CLAUDE_AGENTS_VERIFY_INTERVAL_S=0
result=$("$TMPDIR_TEST/office-hours")
mapfile -t oh_resume_argv < "$TMPDIR_TEST/bg-argv-log"
assert_eq "primary kick (rc 0, unregistered) carries no --fork-session (no continue)" "--bg --name 42-x --permission-mode auto --resume sess-abc" "${oh_resume_argv[0]:-}"
assert_eq "verify-fail triggers fork retry (rc 0 alone is not enough)" "--bg --name 42-x --permission-mode auto --resume sess-abc --fork-session" "${oh_resume_argv[1]:-}"
assert_eq "after fork registers, attach by name → j-42-x" "LAUNCH: attach j-42-x" "$result"
unset OFFICE_HOURS_CLAUDE_CMD CLAUDE_AGENTS_CMD LIB_CLAUDE_AGENTS_VERIFY_INTERVAL_S
teardown

# OH14 (#2538). Entry-script N passthrough: two labeled items, both idle (42 older,
# 99 newer). Without <N>, no-arg mode would attach j-42-x (oldest idle). Passing
# N=99 causes the entry script to forward 99 to the selector; the selector's
# single-item mode targets 99-y's idle session, and the entry attaches j-99-y.
# Proves criterion #1: the entry script correctly passes <N> to the selector.
echo "Test: entry-script N=99 forwarded to selector; attaches j-99-y not j-42-x"
setup
printf '[{"number":42,"createdAt":"2024-01-01T00:00:00Z"},{"number":99,"createdAt":"2024-02-01T00:00:00Z"}]\n' \
  > "$STUB_DIR/oh-issue-list.json"
echo '[]' > "$STUB_DIR/pr-list-full.json"
mkdir -p "$TMPDIR_TEST/wt/42-x" "$TMPDIR_TEST/wt/99-y"
printf 'worktree /repo\nHEAD abc123\nbranch refs/heads/main\n\nworktree /worktrees/42-x\nHEAD def456\nbranch refs/heads/42-x\n\nworktree /worktrees/99-y\nHEAD aaa111\nbranch refs/heads/99-y\n\n' \
  > "$STUB_DIR/worktree-list.txt"
office_hours_state_fake_claude "42-x:waiting:$TMPDIR_TEST/wt/42-x" "99-y:waiting:$TMPDIR_TEST/wt/99-y"
result=$("$TMPDIR_TEST/office-hours" 99)
assert_eq "entry N=99 forwarded: attaches j-99-y (not j-42-x, the no-arg head)" "LAUNCH: attach j-99-y" "$result"
teardown

# <<< END MOVED <<<

report_results
