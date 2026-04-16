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
  ".claude/skills/ref-pr-workflow/scripts/run-lint.sh foo"

assert_approves \
  "absolute path script invocation" \
  "Bash" \
  "/Users/n8/natb1/commons.systems/worktrees/322-test/.claude/skills/ref-pr-workflow/scripts/issue-state-read 322"

assert_approves \
  "quoted CLAUDE_PROJECT_DIR prefix" \
  "Bash" \
  '"/Users/n8/project"/.claude/skills/ref-pr-workflow/scripts/post-pr-comment.sh 323 file.txt'

assert_approves \
  "script with no arguments" \
  "Bash" \
  ".claude/skills/ref-pr-workflow/scripts/issue-primary"

assert_approves \
  "script in subshell with absolute path" \
  "Bash" \
  '(/Users/n8/project/.claude/skills/ref-pr-workflow/scripts/run-lint.sh)'

assert_approves \
  "backslash-continuation multi-line args" \
  "Bash" \
  "$(printf '.claude/skills/ref-pr-workflow/scripts/concat-review-output.sh \\\n  tmp/output.txt \\\n  \"review:/tmp/r.txt\"')"

assert_approves \
  "absolute path with backslash-continuation" \
  "Bash" \
  "$(printf '/Users/n8/project/.claude/skills/ref-pr-workflow/scripts/concat-review-output.sh \\\n  tmp/output.txt \\\n  \"label1:file1\" \\\n  \"label2:file2\"')"

assert_approves \
  "single trailing backslash-continuation" \
  "Bash" \
  "$(printf '.claude/skills/ref-pr-workflow/scripts/post-pr-comment.sh \\\n  323 file.txt')"

assert_approves \
  "pipe workflow script to allowed command (head)" \
  "Bash" \
  ".claude/skills/ref-pr-workflow/scripts/load-context 350 2>&1 | head -200"

assert_approves \
  "pipe workflow script to allowed command (tail)" \
  "Bash" \
  ".claude/skills/ref-pr-workflow/scripts/load-context 350 | tail -5"

assert_approves \
  "bare 2>&1 with no pipe" \
  "Bash" \
  ".claude/skills/ref-pr-workflow/scripts/run-qa-cleanup.sh 2>&1"

assert_approves \
  "user-reported: qa-cleanup 2>&1 piped to tail" \
  "Bash" \
  ".claude/skills/ref-pr-workflow/scripts/run-qa-cleanup.sh 2>&1 | tail -5"

assert_approves \
  "2>/dev/null stderr silence piped to tail" \
  "Bash" \
  ".claude/skills/ref-pr-workflow/scripts/run-qa-cleanup.sh 2>/dev/null | tail -5"

assert_approves \
  "pipe allowed command to allowed command" \
  "Bash" \
  "head -20 file.txt | tail -5"

assert_approves \
  "semicolon then pipe" \
  "Bash" \
  ".claude/skills/ref-pr-workflow/scripts/issue-primary 350; .claude/skills/ref-pr-workflow/scripts/load-context 350 | head -20"

assert_approves \
  "&& between two allowed workflow scripts" \
  "Bash" \
  ".claude/skills/ref-pr-workflow/scripts/run-lint.sh && .claude/skills/ref-pr-workflow/scripts/run-unit-tests.sh"

assert_approves \
  "&& between two allowed commands" \
  "Bash" \
  "echo hello && head file.txt"

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
  "echo .claude/skills/ref-pr-workflow/scripts/run-lint.sh"

assert_approves \
  "cat (in allowedTools) reading a script path" \
  "Bash" \
  "cat .claude/skills/ref-pr-workflow/scripts/run-lint.sh"

assert_passthrough \
  "absolute script path as argument to rm" \
  "Bash" \
  "rm -rf / /Users/n8/.claude/skills/ref-pr-workflow/scripts/issue-primary"

assert_passthrough \
  "absolute script path as argument to chmod" \
  "Bash" \
  "chmod 777 /Users/n8/.claude/skills/ref-pr-workflow/scripts/issue-primary"

assert_passthrough \
  "absolute script path as argument to cp" \
  "Bash" \
  "cp /tmp/evil /Users/n8/.claude/skills/ref-pr-workflow/scripts/issue-primary"

assert_passthrough \
  "non-Bash tool" \
  "Read" \
  ".claude/skills/ref-pr-workflow/scripts/run-lint.sh"

assert_passthrough \
  "empty command" \
  "Bash" \
  ""

assert_passthrough \
  "unrelated command not in allowedTools" \
  "Bash" \
  "definitely-not-a-real-command --flag value"

# --- Security edge cases ---

assert_passthrough \
  "path traversal via .." \
  "Bash" \
  ".claude/skills/ref-pr-workflow/scripts/../../../evil.sh"

assert_passthrough \
  "path traversal after valid script name prefix" \
  "Bash" \
  ".claude/skills/ref-pr-workflow/scripts/legit/../../../evil.sh"

assert_passthrough \
  "path continuation through script name as directory" \
  "Bash" \
  ".claude/skills/ref-pr-workflow/scripts/run-lint.sh/../../evil.sh"

assert_passthrough \
  "command chaining with &&" \
  "Bash" \
  ".claude/skills/ref-pr-workflow/scripts/run-lint.sh && rm -rf /"

assert_passthrough \
  "pipe to unapproved command" \
  "Bash" \
  ".claude/skills/ref-pr-workflow/scripts/run-lint.sh | malicious-command"

assert_passthrough \
  "pipe from allowed to unapproved command" \
  "Bash" \
  "head -20 file.txt | malicious-command"

assert_passthrough \
  "pipe to rm (not in allowedTools)" \
  "Bash" \
  ".claude/skills/ref-pr-workflow/scripts/run-lint.sh | rm -rf /"

assert_passthrough \
  "semicolon chaining" \
  "Bash" \
  ".claude/skills/ref-pr-workflow/scripts/run-lint.sh; evil-command"

assert_passthrough \
  "newline injection (evil first, script second)" \
  "Bash" \
  "$(printf 'rm -rf /\n.claude/skills/ref-pr-workflow/scripts/run-lint.sh')"

assert_passthrough \
  "newline injection (script first, evil second)" \
  "Bash" \
  "$(printf '.claude/skills/ref-pr-workflow/scripts/run-lint.sh\nrm -rf /')"

assert_passthrough \
  "command substitution via \$()" \
  "Bash" \
  '.claude/skills/ref-pr-workflow/scripts/run-lint.sh $(evil-command)'

assert_passthrough \
  "output redirection" \
  "Bash" \
  ".claude/skills/ref-pr-workflow/scripts/run-lint.sh > /tmp/exfil"

assert_passthrough \
  "input redirection" \
  "Bash" \
  ".claude/skills/ref-pr-workflow/scripts/run-lint.sh < /etc/shadow"

assert_passthrough \
  "process substitution" \
  "Bash" \
  ".claude/skills/ref-pr-workflow/scripts/run-lint.sh <(evil-command)"

assert_passthrough \
  "or-chaining with ||" \
  "Bash" \
  ".claude/skills/ref-pr-workflow/scripts/run-lint.sh || evil-command"

assert_approves \
  "or-chaining || between two allowed commands" \
  "Bash" \
  "echo hello || head /etc/passwd"

assert_passthrough \
  "continuation then bare newline with evil command" \
  "Bash" \
  "$(printf '.claude/skills/ref-pr-workflow/scripts/run-lint.sh \\\n  arg1\nrm -rf /')"

assert_passthrough \
  "evil command after fake continuation" \
  "Bash" \
  "$(printf 'rm -rf / \\\n.claude/skills/ref-pr-workflow/scripts/run-lint.sh')"

assert_passthrough \
  "metacharacter in continuation arg" \
  "Bash" \
  "$(printf '.claude/skills/ref-pr-workflow/scripts/run-lint.sh \\\n  arg1 && evil')"

assert_passthrough \
  "backtick substitution" \
  "Bash" \
  '.claude/skills/ref-pr-workflow/scripts/run-lint.sh `evil-command`'

# --- Other edge cases ---

assert_passthrough_raw \
  "malformed JSON input" \
  "not valid json"

assert_passthrough_raw \
  "empty input" \
  ""

# --- JSON output structure validation ---

TOTAL=$((TOTAL + 1))
input=$(jq -n '{tool_name: "Bash", tool_input: {command: ".claude/skills/ref-pr-workflow/scripts/run-lint.sh"}}')
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
