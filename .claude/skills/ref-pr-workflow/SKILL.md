---
name: ref-pr-workflow
description: Complete workflow documentation for issue implementation lifecycle — resume from any step after context loss
allowed-tools: Bash(.claude/skills/ref-pr-workflow/scripts/*), Bash($CLAUDE_PLUGIN_ROOT/scripts/*)
---

# Current PR Scope and Status
The purpose of this conversation is to create and manage a PR with the following scope.

- Current branch: !`git rev-parse --abbrev-ref HEAD`
- PR status: !`gh pr view --json title,body,comments,number,state 2>/dev/null || echo "No PR"`
- Primary issue: !`$CLAUDE_PLUGIN_ROOT/scripts/issue-primary 2>/dev/null || .claude/skills/ref-pr-workflow/scripts/issue-primary`
- Blocking issues: !`$CLAUDE_PLUGIN_ROOT/scripts/issue-blocking 2>/dev/null || .claude/skills/ref-pr-workflow/scripts/issue-blocking`
- Sub-issues: !`$CLAUDE_PLUGIN_ROOT/scripts/issue-sub-issues 2>/dev/null || .claude/skills/ref-pr-workflow/scripts/issue-sub-issues`
- Commit log: !`git log origin/main..HEAD --format="commit %H%nAuthor: %an <%ae>%nDate: %ad%n%n%s%n%n%b"`

# Dependencies
Invoke `/ref-memory-management` if not already active. 

# Issue Workflow Reference
Reference only. Do not execute this workflow until directed to do so (eg., by `/pr-workflow`).

## Resume Logic

Determine starting step using the **Current PR Scope and Status** section above.

Decision tree:

- **No PR**:
  - Implementation commits in commit log → Step 4
  - No implementation commits → Step 2
- **PR exists, no acceptance test comment with "Complete" in header** → Step 6
- **PR exists, acceptance test complete, no smoke test comment with "Complete" in header** → Step 7
- **PR exists, acceptance test + smoke test complete, no QA comment with "Complete" in header** → Step 8
- **PR exists, QA complete, no code quality comment with "Complete" in header** → Step 9
- **PR exists, QA + code quality complete, no security comment with "Complete" in header** → Step 10
- **All audit logs exist (all have "Complete" in header)** → Step 11

## Step 1. Prerequisite Check

Verify the working directory is a worktree for the requested issue:

```bash
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
```

If no issue number provided, or `$CURRENT_BRANCH` doesn't start with the issue number followed by `-`: invoke `/worktree` instead. Stop.

## Step 2. Planning Phase

Enter plan mode. Scope defined by the **Current PR Scope and Status** section above. Use the question tool to:
- Clarify ambiguous scope
- Suggest better alternatives

Plan must include:
- Unit test strategy: what to test, test framework, test file locations
- Acceptance test strategy: user flows to test with Playwright against Firebase emulators
- Smoke test strategy: minimal health checks for preview deployments

## Step 3. Implementation

Implement the approved plan. Create separate commits for each issue (minimum one commit per issue).

Use the Task tool to launch parallel general-purpose subagents:
- Subagent 1: Write unit tests based on the plan
- Subagent 2: Write acceptance tests based on the plan
- Subagent 3: Write smoke tests based on the plan

All run concurrently with main implementation.

## Step 4. Unit Test Loop

Start `/wiggum-loop` at Step 0 with these instruction sets:

**Next step instructions:**
- Merge `origin/main`
- Run unit tests and linting

**Evaluation instructions:**
- All pass → **Terminate**
- Failures → **Iterate** (fix, re-run)

**Termination instructions:**
- No action. Proceed to Step 5.

## Step 5. PR Creation

Create a PR closing all implemented issues from the **Current PR Scope and Status** section:

```bash
gh pr create --draft --title "PR title" --body "$(cat <<'EOF'
## Summary
...

Closes #<primary-issue>
Closes #<related-issue-1>
Closes #<related-issue-2>

EOF
)"
```

Include a separate `Closes #N` for each issue (primary + all implemented dependencies and sub-issues).

## Step 6. Acceptance Test Loop

Start `/wiggum-loop` at Step 0 with these instruction sets:

**Next step instructions:**
- Run the following in a Task, capturing all output verbatim to `/tmp/acceptance-output-<N>.txt`:
  ```bash
  gh run list --branch <branch> --limit 5
  gh run view <run-id>
  ```
- If run is in progress, wait for completion before writing the file
- After the Task completes, create a PR comment from the output file:
  ```bash
  COMMENT_ID=$(write-pr-comment.sh <pr-num> /tmp/acceptance-output-<N>.txt)
  ```
- Record `COMMENT_ID` in the plan for use in the progress report step

**Evaluation instructions:**
- All pass → **Terminate**
- Test failures → **Iterate** (fix, commit, push, wait for re-run)
- Infrastructure failures → present to user for resolution

**Progress report instructions:**
- Write evaluation results to `/tmp/acceptance-eval-<N>.txt`
- Append to the iteration comment:
  ```bash
  append-pr-comment.sh "$COMMENT_ID" /tmp/acceptance-eval-<N>.txt
  ```

**Termination instructions:**
- Write final summary to `/tmp/acceptance-final.txt` (header must be `# Acceptance Test Review - Complete ✓`):
  ```
  # Acceptance Test Review - Complete ✓

  **Date**: [Current date]
  **Branch**: [branch name]

  ## Iterations

  [For each iteration:]
  - Iteration 1: [Failures] → [Fixes] (commits: [hashes])
  ...
  - Final iteration: All tests passed

  ## Conclusion

  All acceptance tests passed. PR approved for QA review.
  ```
- Create final comment:
  ```bash
  write-pr-comment.sh <pr-num> /tmp/acceptance-final.txt
  ```
- Proceed to Step 7

## Step 7. Smoke Test Loop

Start `/wiggum-loop` at Step 0 with these instruction sets:

**Next step instructions:**
- Run the following in a Task, capturing all output verbatim to `/tmp/smoke-output-<N>.txt`:
  ```bash
  gh run list --branch <branch> --limit 5
  gh run view <run-id>
  ```
- If run is in progress, wait for completion before writing the file
- After the Task completes, create a PR comment from the output file:
  ```bash
  COMMENT_ID=$(write-pr-comment.sh <pr-num> /tmp/smoke-output-<N>.txt)
  ```
- Record `COMMENT_ID` in the plan for use in the progress report step

**Evaluation instructions:**
- All pass → **Terminate**
- Smoke test failures → **Iterate** (fix, commit, push, wait for re-run)
- Deploy failures → present to user for resolution

**Progress report instructions:**
- Write evaluation results to `/tmp/smoke-eval-<N>.txt`
- Append to the iteration comment:
  ```bash
  append-pr-comment.sh "$COMMENT_ID" /tmp/smoke-eval-<N>.txt
  ```

**Termination instructions:**
- Write final summary to `/tmp/smoke-final.txt` (header must be `# Smoke Test Review - Complete ✓`):
  ```
  # Smoke Test Review - Complete ✓

  **Date**: [Current date]
  **Branch**: [branch name]

  ## Iterations

  [For each iteration:]
  - Iteration 1: [Failures] → [Fixes] (commits: [hashes])
  ...
  - Final iteration: All tests passed

  ## Conclusion

  Smoke tests passed. Preview deployment verified.
  ```
- Create final comment:
  ```bash
  write-pr-comment.sh <pr-num> /tmp/smoke-final.txt
  ```
- Proceed to Step 8

## Step 8. QA Review Loop

Start `/wiggum-loop` at Step 0 with these instruction sets:

**Next step instructions:**
- Run the following in a Task, capturing all output verbatim to `/tmp/qa-output-<N>.txt`:
  - If implementation has a browser component (detect via `vite.config.*`, HTML templates, or frontend framework files):
    1. Start the QA server using `run-qa-server.sh <app-dir>` in background
    2. Parse the App URL from the script's output
    3. Run acceptance tests as a smoke check: `BASE_URL=<url> npx playwright test --config e2e/playwright.config.ts`
    4. If smoke tests fail → fix issues and re-run before involving the user
    5. Once smoke tests pass, proceed to write the QA testing plan
  - Write a comprehensive QA testing plan including:
    - Key behaviors to verify
    - Test steps for each behavior
    - Edge cases to test
    - Expected outcomes
- After the Task completes, create a PR comment from the output file:
  ```bash
  COMMENT_ID=$(write-pr-comment.sh <pr-num> /tmp/qa-output-<N>.txt)
  ```
- Record `COMMENT_ID` in the plan for use in the progress report step
- Present the plan and App URL (if applicable) to the user
- **CRITICAL**: The user performs the actual testing (not Claude)
- Wait for the user to test and report results

**Evaluation instructions:**
- User reports "passed"/"approved" → **Terminate**
- User reports issues/bugs → **Iterate** (Claude fixes issues, user retests)

**Progress report instructions:**
- Write evaluation results to `/tmp/qa-eval-<N>.txt`
- Append to the iteration comment:
  ```bash
  append-pr-comment.sh "$COMMENT_ID" /tmp/qa-eval-<N>.txt
  ```

**Termination instructions:**
- Stop the QA server (run-qa-server.sh) if started
- Write final summary to `/tmp/qa-final.txt` (header must be `# QA Review - Complete ✓`):
  ```
  # QA Review - Complete ✓

  **Reviewer**: [User name from git config]
  **Date**: [Current date]
  **Tested By**: Human QA with Claude Code facilitation

  ## QA Iterations

  [For each iteration:]
  - Iteration 1: [Issues found] → [Fixes implemented] (commits: [hashes])
  ...
  - Final iteration: All tests passed

  ## QA Summary

  - Total test cycles: [N]
  - Key behaviors verified: [list]
  - Edge cases tested: [list]
  - Total issues found and resolved: [N]

  ## Conclusion

  All test cases passed. PR approved for code quality review.
  ```
- Create final comment:
  ```bash
  write-pr-comment.sh <pr-num> /tmp/qa-final.txt
  ```
- Proceed to Step 9

## Step 9. Code Quality Review Loop

Start `/wiggum-loop` at Step 0 with these instruction sets:

**Next step instructions:**
- Launch 7 review tasks in parallel using the Task tool. Collect all returned results verbatim — do NOT summarize or paraphrase agent output:
  1. **`/review` skill** — Use a `general-purpose` subagent that invokes the Skill tool with `skill: "review"`. Include the PR diff context in the prompt.
  2. **`pr-review-toolkit:code-reviewer`** — Use a `general-purpose` subagent that invokes the Skill tool with `skill: "pr-review-toolkit:code-reviewer"`.
  3. **`pr-review-toolkit:code-simplifier`** — Use a `general-purpose` subagent that invokes the Skill tool with `skill: "pr-review-toolkit:code-simplifier"`.
  4. **`pr-review-toolkit:comment-analyzer`** — Use a `general-purpose` subagent that invokes the Skill tool with `skill: "pr-review-toolkit:comment-analyzer"`.
  5. **`pr-review-toolkit:pr-test-analyzer`** — Use a `general-purpose` subagent that invokes the Skill tool with `skill: "pr-review-toolkit:pr-test-analyzer"`.
  6. **`pr-review-toolkit:silent-failure-hunter`** — Use a `general-purpose` subagent that invokes the Skill tool with `skill: "pr-review-toolkit:silent-failure-hunter"`.
  7. **`pr-review-toolkit:type-design-analyzer`** — Use a `general-purpose` subagent that invokes the Skill tool with `skill: "pr-review-toolkit:type-design-analyzer"`.
- All 7 tasks MUST be launched in a single message (parallel execution)
- If any pr-review-toolkit agent fails to launch (e.g. plugin not installed), log a warning but continue — `/review` results alone are sufficient to proceed
- Write all verbatim agent outputs to `/tmp/codequality-output-<N>.txt` under per-agent headings:
  ```
  ## /review Output

  [verbatim output]

  ## pr-review-toolkit: code-reviewer

  [verbatim output — or "Agent unavailable (plugin not installed)"]

  ...
  ```
- Create a PR comment from the output file:
  ```bash
  COMMENT_ID=$(write-pr-comment.sh <pr-num> /tmp/codequality-output-<N>.txt)
  ```
- Record `COMMENT_ID` in the plan for use in the progress report step

**Evaluation instructions:**
- Present findings from ALL agents to user
- User classifies each as: required, false positive, or out of scope
- Any required findings → **Iterate**
- No required findings → **Terminate**

**Progress report instructions:**
- Write evaluation results (user classifications) to `/tmp/codequality-eval-<N>.txt`
- Append to the iteration comment:
  ```bash
  append-pr-comment.sh "$COMMENT_ID" /tmp/codequality-eval-<N>.txt
  ```

**Termination instructions:**
- Write final summary to `/tmp/codequality-final.txt` (header must be `# Code Quality Review - Complete ✓`):
  ```
  # Code Quality Review - Complete ✓

  **Reviewer**: Claude Code (via /review skill + pr-review-toolkit agents)
  **Date**: [Current date]
  **Outcome**: [Summary of result]

  ## User Classification Decisions

  [For each finding:]
  - Finding 1: [title] → [required/false positive/out of scope] - [rationale]
  ...

  ## Conclusion

  [Final assessment and next steps]
  ```
- Create final comment:
  ```bash
  write-pr-comment.sh <pr-num> /tmp/codequality-final.txt
  ```
- Proceed to Step 10

## Step 10. Security Review Loop

Start `/wiggum-loop` at Step 0 with these instruction sets:

**Next step instructions:**
- Run `/security-review` in a Task (exists even if not visible in skill list), capturing all output verbatim to `/tmp/security-output-<N>.txt`
- After the Task completes, create a PR comment from the output file:
  ```bash
  COMMENT_ID=$(write-pr-comment.sh <pr-num> /tmp/security-output-<N>.txt)
  ```
- Record `COMMENT_ID` in the plan for use in the progress report step

**Evaluation instructions:**
- Present findings to user
- User classifies each as: required, false positive, or out of scope
- Any required findings → **Iterate**
- No required findings → **Terminate**

**Progress report instructions:**
- Write evaluation results (user classifications) to `/tmp/security-eval-<N>.txt`
- Append to the iteration comment:
  ```bash
  append-pr-comment.sh "$COMMENT_ID" /tmp/security-eval-<N>.txt
  ```

**Termination instructions:**
- Write final summary to `/tmp/security-final.txt` (header must be `# Security Review - Complete ✓`):
  ```
  # Security Review - Complete ✓

  **Reviewer**: Claude Code (via /security-review skill)
  **Date**: [Current date]
  **Outcome**: [Summary of result]

  ## User Classification Decisions

  [For each finding:]
  - Finding 1: [title] → [required/false positive/out of scope] - [rationale]
  ...

  ## Conclusion

  [Final assessment and next steps]
  ```
- Create final comment:
  ```bash
  write-pr-comment.sh <pr-num> /tmp/security-final.txt
  ```
- Proceed to Step 11

## Step 11. Completion

```bash
gh pr ready <pr-num>
```

Prompt user to review and merge the PR.
