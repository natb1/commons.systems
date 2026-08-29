#!/usr/bin/env bash
# Test suite for approve-workflow-commands.sh hook.
# Usage: ./test-approve-workflow-commands.sh
# Requires: jq
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd -P)"
HOOK="$SCRIPT_DIR/approve-workflow-commands.sh"

PASS=0
FAIL=0
TOTAL=0

assert_approves() {
  local desc="$1" tool_name="$2" command="$3"
  TOTAL=$((TOTAL + 1))
  local input
  input=$(jq -n --arg tn "$tool_name" --arg cmd "$command" '{tool_name: $tn, tool_input: {command: $cmd}}')
  local output
  output=$(printf '%s\n' "$input" | "$HOOK" 2>/dev/null) || true
  if printf '%s\n' "$output" | jq -e '.hookSpecificOutput.permissionDecision == "allow"' >/dev/null 2>&1; then
    PASS=$((PASS + 1))
  else
    FAIL=$((FAIL + 1))
    echo "FAIL: $desc — expected approve, got: $output"
  fi
}

assert_passthrough() {
  local desc="$1" tool_name="$2" command="$3"
  TOTAL=$((TOTAL + 1))
  local input
  input=$(jq -n --arg tn "$tool_name" --arg cmd "$command" '{tool_name: $tn, tool_input: {command: $cmd}}')
  local output
  output=$(printf '%s\n' "$input" | "$HOOK" 2>/dev/null) || true
  if [ -z "$output" ]; then
    PASS=$((PASS + 1))
  else
    FAIL=$((FAIL + 1))
    echo "FAIL: $desc — expected passthrough (empty output), got: $output"
  fi
}

assert_passthrough_raw() {
  local desc="$1" raw_input="$2"
  TOTAL=$((TOTAL + 1))
  local output
  output=$(printf '%s\n' "$raw_input" | "$HOOK" 2>/dev/null) || true
  if [ -z "$output" ]; then
    PASS=$((PASS + 1))
  else
    FAIL=$((FAIL + 1))
    echo "FAIL: $desc — expected passthrough (empty output), got: $output"
  fi
}

# --- Approval cases ---

assert_approves \
  "relative path script invocation" \
  "Bash" \
  ".claude/skills/dispatch-propagate/scripts/run-lint.sh foo"

assert_approves \
  "absolute path script invocation" \
  "Bash" \
  "/Users/n8/natb1/commons.systems/worktrees/322-test/.claude/skills/dispatch-propagate/scripts/issue-primary 322"

assert_approves \
  "quoted CLAUDE_PROJECT_DIR prefix" \
  "Bash" \
  '"/Users/n8/project"/.claude/skills/dispatch-propagate/scripts/post-pr-comment.sh 323 file.txt'

assert_approves \
  "script with no arguments" \
  "Bash" \
  ".claude/skills/dispatch-propagate/scripts/issue-primary"

assert_approves \
  "script in subshell with absolute path" \
  "Bash" \
  '(/Users/n8/project/.claude/skills/dispatch-propagate/scripts/run-lint.sh)'

assert_approves \
  "backslash-continuation multi-line args" \
  "Bash" \
  "$(printf '.claude/skills/dispatch-propagate/scripts/post-pr-comment.sh \\\n  323 \\\n  \"tmp/output.txt\"')"

assert_approves \
  "absolute path with backslash-continuation" \
  "Bash" \
  "$(printf '/Users/n8/project/.claude/skills/dispatch-propagate/scripts/post-pr-comment.sh \\\n  323 \\\n  \"file1\" \\\n  \"file2\"')"

assert_approves \
  "single trailing backslash-continuation" \
  "Bash" \
  "$(printf '.claude/skills/dispatch-propagate/scripts/post-pr-comment.sh \\\n  323 file.txt')"

assert_approves \
  "pipe workflow script to allowed command (head)" \
  "Bash" \
  ".claude/skills/dispatch-propagate/scripts/issue-primary 350 2>&1 | head -200"

assert_approves \
  "pipe workflow script to allowed command (tail)" \
  "Bash" \
  ".claude/skills/dispatch-propagate/scripts/issue-primary 350 | tail -5"

assert_approves \
  "bare 2>&1 with no pipe" \
  "Bash" \
  ".claude/skills/dispatch-propagate/scripts/run-qa-cleanup.sh 2>&1"

assert_approves \
  "user-reported: qa-cleanup 2>&1 piped to tail" \
  "Bash" \
  ".claude/skills/dispatch-propagate/scripts/run-qa-cleanup.sh 2>&1 | tail -5"

assert_approves \
  "2>/dev/null stderr silence piped to tail" \
  "Bash" \
  ".claude/skills/dispatch-propagate/scripts/run-qa-cleanup.sh 2>/dev/null | tail -5"

assert_approves \
  "pipe allowed command to allowed command" \
  "Bash" \
  "head -20 file.txt | tail -5"

assert_approves \
  "semicolon then pipe" \
  "Bash" \
  ".claude/skills/dispatch-propagate/scripts/issue-primary 350; .claude/skills/dispatch-propagate/scripts/issue-primary 350 | head -20"

assert_approves \
  "&& between two allowed workflow scripts" \
  "Bash" \
  ".claude/skills/dispatch-propagate/scripts/run-lint.sh && .claude/skills/dispatch-propagate/scripts/run-unit-tests.sh"

assert_approves \
  "&& between two allowed commands" \
  "Bash" \
  "echo hello && head file.txt"

# --- Graph-commit classifier-bypass regressions ---
# (tactic-graph-commit-invocation-classifier-bypass)
# graph-commit lives under packages/, not .claude/skills/*/scripts/, so
# SCRIPT_RE never matches it — approval here can only come from ALLOWED_CMDS,
# harvested from the settings.json Bash(<path>:*) entries this tactic adds.
# These cases pass only while those entries exist and are spelled without
# spaces; deleting or re-spelling either one turns this section red.

assert_approves \
  "graph-commit canonical relative form (settings entry present)" \
  "Bash" \
  "packages/intentionsutil/scripts/graph-commit -C /tmp/x -m 'graph: land edit' tactic-foo"

assert_approves \
  "land-align-round canonical relative form" \
  "Bash" \
  "packages/intentionsutil/scripts/land-align-round --terminal tactic-foo -m 'graph: land round' tactic-foo"

# cd is not in ALLOWED_CMDS, so validate_segments rejects the first segment
# deterministically — a cd-compound must never be approved (2026-07-21 this
# exact shape was denied by the classifier: "Blocked by classifier").
assert_passthrough \
  "cd-compound graph-commit is not approved (2026-07-21 classifier denial)" \
  "Bash" \
  "cd /tmp/x && packages/intentionsutil/scripts/graph-commit -m 'graph: x' tactic-foo"

# is_allowed_cmd compares basename and exact-token equality against the
# path-form entry, and an absolute path matches neither — this is the
# executable record of Unit 1's "no bare-basename entry" decision; if a
# future change adds Bash(graph-commit:*), this case goes red and forces
# the decision to be re-made deliberately.
assert_passthrough \
  "absolute-path graph-commit is deliberately not the sanctioned spelling" \
  "Bash" \
  "/repo/packages/intentionsutil/scripts/graph-commit -C /repo -m 'graph: x' tactic-foo"

# --- Quote-aware splitting (metacharacters inside quoted strings) ---

assert_approves \
  "pipe inside double-quoted regex alternation" \
  "Bash" \
  ".claude/skills/dispatch-propagate/scripts/run-lint.sh 2>&1 | grep -E \"(foo|bar)\" | head -40"

assert_approves \
  "pipe inside single-quoted regex alternation" \
  "Bash" \
  ".claude/skills/dispatch-propagate/scripts/run-lint.sh | grep -E '(foo|bar)' | tail -5"

assert_approves \
  "multiple greps with alternations" \
  "Bash" \
  "head -20 file.txt | grep -E \"a|b\" | grep -iE \"c|d\" | tail -5"

assert_approves \
  "semicolon inside double quotes" \
  "Bash" \
  "echo \"hello; world\" | head -1"

assert_approves \
  "and-operator inside double quotes" \
  "Bash" \
  "echo \"a && b\" | head -1"

# --- Passthrough cases ---

assert_passthrough \
  "git add (not in hook scope)" \
  "Bash" \
  "git add ."

assert_passthrough \
  "gh pr view (not in hook scope)" \
  "Bash" \
  "gh pr view 323"

assert_approves \
  "different skill path (broadened SCRIPT_RE)" \
  "Bash" \
  ".claude/skills/some-other-skill/scripts/run-lint.sh"

assert_approves \
  "echo is in allowedTools (argument contains no unsafe metacharacters)" \
  "Bash" \
  "echo .claude/skills/dispatch-propagate/scripts/run-lint.sh"

assert_approves \
  "cat (in allowedTools) reading a script path" \
  "Bash" \
  "cat .claude/skills/dispatch-propagate/scripts/run-lint.sh"

assert_passthrough \
  "absolute script path as argument to rm" \
  "Bash" \
  "rm -rf / /Users/n8/.claude/skills/dispatch-propagate/scripts/issue-primary"

assert_passthrough \
  "absolute script path as argument to chmod" \
  "Bash" \
  "chmod 777 /Users/n8/.claude/skills/dispatch-propagate/scripts/issue-primary"

assert_passthrough \
  "absolute script path as argument to cp" \
  "Bash" \
  "cp /tmp/evil /Users/n8/.claude/skills/dispatch-propagate/scripts/issue-primary"

assert_passthrough \
  "non-Bash tool" \
  "Read" \
  ".claude/skills/dispatch-propagate/scripts/run-lint.sh"

assert_passthrough \
  "empty command" \
  "Bash" \
  ""

assert_passthrough \
  "unrelated command not in allowedTools" \
  "Bash" \
  "definitely-not-a-real-command --flag value"

assert_passthrough \
  "legacy dispatch/bin/phase-complete is no longer approved (regression guard)" \
  "Bash" \
  "./dispatch/bin/phase-complete 630"

# --- Security edge cases ---

assert_passthrough \
  "path traversal via .." \
  "Bash" \
  ".claude/skills/dispatch-propagate/scripts/../../../evil.sh"

assert_passthrough \
  "path traversal after valid script name prefix" \
  "Bash" \
  ".claude/skills/dispatch-propagate/scripts/legit/../../../evil.sh"

assert_passthrough \
  "path continuation through script name as directory" \
  "Bash" \
  ".claude/skills/dispatch-propagate/scripts/run-lint.sh/../../evil.sh"

assert_passthrough \
  "command chaining with &&" \
  "Bash" \
  ".claude/skills/dispatch-propagate/scripts/run-lint.sh && rm -rf /"

assert_passthrough \
  "pipe to unapproved command" \
  "Bash" \
  ".claude/skills/dispatch-propagate/scripts/run-lint.sh | malicious-command"

assert_passthrough \
  "pipe from allowed to unapproved command" \
  "Bash" \
  "head -20 file.txt | malicious-command"

assert_passthrough \
  "pipe to rm (not in allowedTools)" \
  "Bash" \
  ".claude/skills/dispatch-propagate/scripts/run-lint.sh | rm -rf /"

assert_passthrough \
  "semicolon chaining" \
  "Bash" \
  ".claude/skills/dispatch-propagate/scripts/run-lint.sh; evil-command"

assert_passthrough \
  "newline injection (evil first, script second)" \
  "Bash" \
  "$(printf 'rm -rf /\n.claude/skills/dispatch-propagate/scripts/run-lint.sh')"

assert_passthrough \
  "newline injection (script first, evil second)" \
  "Bash" \
  "$(printf '.claude/skills/dispatch-propagate/scripts/run-lint.sh\nrm -rf /')"

assert_passthrough \
  "command substitution via \$()" \
  "Bash" \
  '.claude/skills/dispatch-propagate/scripts/run-lint.sh $(evil-command)'

assert_passthrough \
  "output redirection" \
  "Bash" \
  ".claude/skills/dispatch-propagate/scripts/run-lint.sh > /tmp/exfil"

assert_passthrough \
  "input redirection" \
  "Bash" \
  ".claude/skills/dispatch-propagate/scripts/run-lint.sh < /etc/shadow"

assert_passthrough \
  "process substitution" \
  "Bash" \
  ".claude/skills/dispatch-propagate/scripts/run-lint.sh <(evil-command)"

assert_passthrough \
  "or-chaining with ||" \
  "Bash" \
  ".claude/skills/dispatch-propagate/scripts/run-lint.sh || evil-command"

assert_approves \
  "or-chaining || between two allowed commands" \
  "Bash" \
  "echo hello || head /etc/passwd"

assert_passthrough \
  "continuation then bare newline with evil command" \
  "Bash" \
  "$(printf '.claude/skills/dispatch-propagate/scripts/run-lint.sh \\\n  arg1\nrm -rf /')"

assert_passthrough \
  "evil command after fake continuation" \
  "Bash" \
  "$(printf 'rm -rf / \\\n.claude/skills/dispatch-propagate/scripts/run-lint.sh')"

assert_passthrough \
  "metacharacter in continuation arg" \
  "Bash" \
  "$(printf '.claude/skills/dispatch-propagate/scripts/run-lint.sh \\\n  arg1 && evil')"

assert_passthrough \
  "backtick substitution" \
  "Bash" \
  '.claude/skills/dispatch-propagate/scripts/run-lint.sh `evil-command`'

assert_passthrough \
  "unbalanced single quote" \
  "Bash" \
  "echo 'unterminated | evil-command"

assert_passthrough \
  "unbalanced double quote" \
  "Bash" \
  "echo \"unterminated | evil-command"

assert_passthrough \
  "pipe to evil command hidden after quoted alternation" \
  "Bash" \
  "head file.txt | grep -E \"a|b\" | evil-command"

# --- Command-separator bypass regressions ---
# (tactic-approve-hook-command-separators)

# Unit 1: a bare & backgrounds the preceding command; the payload after it must
# be classified on its own, not ride inside the approved `echo` segment.
assert_passthrough \
  "bare & backgrounds echo then runs rm payload (Unit 1 regression)" \
  "Bash" \
  "echo hi & rm -rf /x"

assert_approves \
  "bare & between two allowed commands still approves" \
  "Bash" \
  "echo hi & echo bye"

# Unit 2: the multi-line heredoc branch must apply the same separator-splitting
# and per-segment allowlist as the single-line path. Build a worktree-scoped
# git -C path the same way the hook derives NEW_WORKTREES_ROOT (repo root,
# i.e. dirname of --git-common-dir, since .git is a normal directory inside
# the working tree — not $GIT_COMMON_DIR itself, which is <repo>/.git and
# has no .claude/worktrees under it), and create it so is_allowed_git_c's
# realpath() resolves.
_GCD=$(git -C "$SCRIPT_DIR" rev-parse --path-format=absolute --git-common-dir 2>/dev/null)
_DERIVED_WORKTREES_ROOT="$(dirname "$_GCD")/.claude/worktrees"
# is_allowed_git_c resolves the -C path with a plain `realpath` and returns 1
# when that fails, so the path must EXIST for the allow path to be exercised
# at all. Creating it is the normal route, but $_DERIVED_WORKTREES_ROOT is
# READ-ONLY from a worktree-isolated session: nothing mounts
# `.claude/worktrees/` rw (see .claude/rules/sandbox.md). There the mkdir
# fails and, under `set -e`, aborts the whole suite before a single case runs
# — and that is the session this suite is usually invoked from. (Until this
# PR the same mkdir targeted <repo>/.git/.claude/worktrees/, which IS on the
# sandbox write-allowlist, so it silently kept working.)
#
# So fall back to a worktree that already exists under the root. The case
# analysis is complete: the mkdir succeeds wherever the root is writable (CI's
# plain checkout, or a session mounted at the repo root), and where it is not,
# the session is isolated INSIDE a worktree under this very root, so one is
# guaranteed to exist. Either way a real directory is used and the assertion
# is unchanged — it still proves an existing path under NEW_WORKTREES_ROOT is
# approved.
_DUMMY_WT="$_DERIVED_WORKTREES_ROOT/test-approve-hook-dummy"
_DUMMY_WT_CREATED=0
if mkdir -p "$_DUMMY_WT" 2>/dev/null; then
  _DUMMY_WT_CREATED=1
else
  # Buffer before awk: an awk that `exit`s early SIGPIPEs its writer, which
  # under `set -o pipefail` fails the whole command substitution. Match without
  # early exit for the same reason.
  _WT_LIST_FB=$(git -C "$SCRIPT_DIR" worktree list --porcelain 2>/dev/null) || _WT_LIST_FB=""
  _DUMMY_WT=$(printf '%s\n' "$_WT_LIST_FB" \
    | awk -v r="$_DERIVED_WORKTREES_ROOT/" '/^worktree /{ if (!f && index($2, r) == 1) { print $2; f=1 } }')
  if [ -z "$_DUMMY_WT" ] || [ ! -d "$_DUMMY_WT" ]; then
    echo "FAIL: '$_DERIVED_WORKTREES_ROOT' is not writable and holds no registered worktree to test against" >&2
    exit 1
  fi
fi
# Remove ONLY what this script created — never a real worktree checkout.
trap '[ "$_DUMMY_WT_CREATED" = "1" ] && rm -rf "$_DUMMY_WT" 2>/dev/null || true' EXIT

# Regression test (tactic-fix-sandbox-doc-hook-roots-before-image): assert the
# formula above resolves to the ACTUAL .claude/worktrees directory this repo
# uses, derived independently — via `git worktree list`'s primary (always-
# first, per git's own porcelain contract) entry, which is the repo root in
# this layout, NOT via filesystem parent-traversal from SCRIPT_DIR. The
# SCRIPT_DIR route is unusable here: this test suite itself typically runs
# from inside a worktree checkout (e.g.
# <repo>/.claude/worktrees/<name>/.claude/hooks), so walking up from
# SCRIPT_DIR would recover that worktree's own root instead of the shared
# repo root — exactly the "$HOOK_DIR-relative arithmetic" trap the hook's own
# comment warns against. Before this test existed, the fixture built its own
# root from the SAME wrong formula the hook used
# ($GIT_COMMON_DIR/.claude/worktrees, i.e. <repo>/.git/.claude/worktrees,
# which never exists post-de-baring), so the fixture and the hook always
# agreed with each other while both disagreed with reality — the defect
# never showed up as a test failure. This test would have caught it.
TOTAL=$((TOTAL + 1))
_WT_LIST=$(git -C "$SCRIPT_DIR" worktree list --porcelain 2>/dev/null) || _WT_LIST=""
_MAIN_WT=$(printf '%s\n' "$_WT_LIST" | awk '/^worktree /{print $2; exit}')
_EXPECTED_WORKTREES_ROOT="$_MAIN_WT/.claude/worktrees"
if [ -n "$_MAIN_WT" ] && [ "$_DERIVED_WORKTREES_ROOT" = "$_EXPECTED_WORKTREES_ROOT" ]; then
  PASS=$((PASS + 1))
else
  FAIL=$((FAIL + 1))
  echo "FAIL: derived worktrees root '$_DERIVED_WORKTREES_ROOT' != actual '$_EXPECTED_WORKTREES_ROOT' (main worktree: '$_MAIN_WT')"
fi

assert_approves \
  "heredoc git -C commit to worktree (legit multi-line)" \
  "Bash" \
  "$(printf 'git -C %s commit -F - <<'\''EOF'\''\ncommit body\nEOF' "$_DUMMY_WT")"

assert_approves \
  "heredoc git -C commit && push (legit && chain)" \
  "Bash" \
  "$(printf 'git -C %s commit -F - <<'\''EOF'\'' && git -C %s push\ncommit body\nEOF' "$_DUMMY_WT" "$_DUMMY_WT")"

assert_passthrough \
  "heredoc git commit with trailing ; payload is not approved (Unit 2 regression)" \
  "Bash" \
  "$(printf 'git -C %s commit -F - <<'\''EOF'\'' ; rm -rf /x\ncommit body\nEOF' "$_DUMMY_WT")"

assert_passthrough \
  "heredoc git commit with trailing & payload is not approved (Unit 2 regression)" \
  "Bash" \
  "$(printf 'git -C %s commit -F - <<'\''EOF'\'' & rm -rf /x\ncommit body\nEOF' "$_DUMMY_WT")"

# --- Other edge cases ---

assert_passthrough_raw \
  "malformed JSON input" \
  "not valid json"

assert_passthrough_raw \
  "empty input" \
  ""

# --- JSON output structure validation ---

TOTAL=$((TOTAL + 1))
input=$(jq -n '{tool_name: "Bash", tool_input: {command: ".claude/skills/dispatch-propagate/scripts/run-lint.sh"}}')
output=$(printf '%s\n' "$input" | "$HOOK" 2>/dev/null) || true
if printf '%s\n' "$output" | jq -e '
  .hookSpecificOutput.hookEventName == "PreToolUse" and
  .hookSpecificOutput.permissionDecision == "allow" and
  .hookSpecificOutput.permissionDecisionReason == "auto-approved by workflow hook"
' >/dev/null 2>&1; then
  PASS=$((PASS + 1))
else
  FAIL=$((FAIL + 1))
  echo "FAIL: JSON structure validation — missing or incorrect fields: $output"
fi

# --- Summary ---

echo ""
echo "Results: $PASS passed, $FAIL failed, $TOTAL total"
if [ "$FAIL" -gt 0 ]; then
  exit 1
fi
echo "All tests passed."
