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
- **PR exists, no acceptance test summary comment** → Step 6
- **PR exists, acceptance test complete, no QA audit log comment** → Step 7
- **PR exists, QA complete, no code quality log** → Step 8
- **PR exists, QA + code quality complete, no security log** → Step 9
- **All audit logs exist** → Step 10

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

## Step 3. Implementation

Implement the approved plan. Create separate commits for each issue (minimum one commit per issue).

Use the Task tool to launch parallel general-purpose subagents:
- Subagent 1: Write unit tests based on the plan
- Subagent 2: Write acceptance tests based on the plan

Both run concurrently with main implementation.

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
- Check acceptance test GitHub Action results on PR branch:
  ```bash
  gh run list --branch <branch> --limit 5
  gh run view <run-id>
  ```
- If run is in progress, wait for completion

**Evaluation instructions:**
- All pass → **Terminate**
- Test failures → **Iterate** (fix, commit, push, wait for re-run)
- Infrastructure failures → present to user for resolution

**Termination instructions:**
- Post audit log as PR comment:
  ```bash
  gh pr comment <pr-num> --body "$(cat <<'EOF'
  # Acceptance Test Review - Complete ✓

  **Date**: [Current date]
  **Branch**: [branch name]

  ## Test Results

  - Run ID: [run-id]
  - Status: Passed
  - Tests executed: [count]

  ## Iterations

  [For each iteration:]
  - Iteration 1: [Failures] → [Fixes] (commits: [hashes])
  ...
  - Final iteration: All tests passed

  ## Conclusion

  All acceptance tests passed. PR approved for QA review.
  EOF
  )"
  ```
- Proceed to Step 7

## Step 7. QA Review Loop

Start `/wiggum-loop` at Step 0 with these instruction sets:

**Next step instructions:**
- If implementation has a browser component (detect via `vite.config.*`, HTML templates, or frontend framework files): start Vite dev server with hot reload in background, include local URL in QA testing plan
- Create a comprehensive QA testing plan for the user to execute
- Include testing checklist covering:
  - Key behaviors to verify
  - Test steps for each behavior
  - Edge cases to test
  - Expected outcomes
- Present the plan to the user
- **CRITICAL**: The user performs the actual testing (not Claude)
- Wait for the user to test and report results

**Evaluation instructions:**
- User reports "passed"/"approved" → **Terminate**
- User reports issues/bugs → **Iterate** (Claude fixes issues, user retests)

**Termination instructions:**
- Stop the Vite dev server if started
- Post QA audit log as PR comment:
  ```bash
  gh pr comment <pr-num> --body "$(cat <<'EOF'
  # QA Review - Complete ✓

  **Reviewer**: [User name from git config]
  **Date**: [Current date]
  **Tested By**: Human QA with Claude Code facilitation

  ## Testing Checklist

  [Original checklist presented to user]

  ## QA Iterations

  [For each iteration:]
  - Iteration 1: [Issues found] → [Fixes implemented] (commits: [hashes])
  - Iteration 2: [Issues found] → [Fixes implemented] (commits: [hashes])
  ...
  - Final iteration: All tests passed

  ## QA Summary

  - Total test cycles: [N]
  - Key behaviors verified: [list]
  - Edge cases tested: [list]
  - Total issues found and resolved: [N]

  ## Conclusion

  All test cases passed. PR approved for code quality review.
  EOF
  )"
  ```
- Proceed to Step 8

## Step 8. Code Quality Review Loop

Start `/wiggum-loop` at Step 0 with these instruction sets:

**Next step instructions:**
- Invoke `/review` (exists even if not visible in skill list)

**Evaluation instructions:**
- Present findings to user
- User classifies each as: required, false positive, or out of scope
- Any required findings → **Iterate**
- No required findings → **Terminate**

**Termination instructions:**
- Post review audit log as PR comment:
  ```bash
  gh pr comment <pr-num> --body "$(cat <<'EOF'
  # Code Quality Review - Complete ✓

  **Reviewer**: Claude Code (via /review skill)
  **Date**: [Current date]
  **Outcome**: [Summary of result]

  ## Review Output (Full Audit Log)

  [PASTE COMPLETE VERBATIM OUTPUT FROM REVIEW SKILL]

  ## User Classification Decisions

  [For each finding:]
  - Finding 1: [title] → [required/false positive/out of scope] - [rationale]
  - Finding 2: [title] → [required/false positive/out of scope] - [rationale]
  ...

  ## Conclusion

  [Final assessment and next steps]
  EOF
  )"
  ```
- Proceed to Step 9

## Step 9. Security Review Loop

Start `/wiggum-loop` at Step 0 with these instruction sets:

**Next step instructions:**
- Invoke `/security-review` (exists even if not visible in skill list)

**Evaluation instructions:**
- Present findings to user
- User classifies each as: required, false positive, or out of scope
- Any required findings → **Iterate**
- No required findings → **Terminate**

**Termination instructions:**
- Post security audit log as PR comment:
  ```bash
  gh pr comment <pr-num> --body "$(cat <<'EOF'
  # Security Review - Complete ✓

  **Reviewer**: Claude Code (via /security-review skill)
  **Date**: [Current date]
  **Outcome**: [Summary of result]

  ## Review Output (Full Audit Log)

  [PASTE COMPLETE VERBATIM OUTPUT FROM SECURITY-REVIEW SKILL]

  ## User Classification Decisions

  [For each finding:]
  - Finding 1: [title] → [required/false positive/out of scope] - [rationale]
  - Finding 2: [title] → [required/false positive/out of scope] - [rationale]
  ...

  ## Conclusion

  [Final assessment and next steps]
  EOF
  )"
  ```
- Proceed to Step 10

## Step 10. Completion

```bash
gh pr ready <pr-num>
```

Prompt user to review and merge the PR.
