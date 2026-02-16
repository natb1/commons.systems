---
name: issue-workflow
description: Manage end-to-end implementation of GitHub issues from planning through review
---

# Issue Workflow

Orchestrate the full lifecycle of implementing a GitHub issue: discovery, planning, implementation, review, and merge.

## 1. Prerequisite Check

Verify the working directory is a worktree for the requested issue:

```bash
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
```

- If no issue number was provided, or `$CURRENT_BRANCH` does not start with the requested issue number followed by `-`: invoke the `/worktree` skill instead. Stop here.

After verification, invoke the `/memory-management` skill to load commit and context sync guidelines.

## 2. Position Detection

Determine where to resume in the workflow by checking CLAUDE.local.md (automatically loaded into context) for PR and audit log markers.

**Detection logic:**

1. **Check for PR context**: Look for "## PR Context" section with "### Current PR" subsection
2. **If no PR context found**: Invoke `/pr-context` to sync latest state from GitHub
3. **Check for audit log comments** in PR (if PR exists):
   - "# QA Review - Complete ✓"
   - "# Code Quality Review - Complete ✓"
   - "# Security Review - Complete ✓"
4. **Check commit log** in CLAUDE.local.md for implementation commits

**Resume logic:**

- **No "Current PR" section**:
  - If implementation commits exist in commit log → Resume at Step 7 (PR Creation)
  - If no implementation commits → Resume at Step 4 (Planning Phase)
- **PR exists, no QA audit log** → Resume at Step 8 (QA Review Loop)
- **PR exists, QA complete, no code quality log** → Resume at Step 9 (Code Quality Review)
- **PR exists, QA and code quality complete, no security log** → Resume at Step 11 (Security Review)
- **All audit logs exist** → Resume at Step 12 (Completion)

Inform the user where the workflow is resuming and proceed to that step.

## 3. Context Sync

Invoke `/pr-context` to sync CLAUDE.local.md with current PR and issue context (if not already invoked in position detection).

## 4. Planning Phase

Enter plan mode. The plan scope covers the primary issue plus any unimplemented dependencies and sub-issues.

CLAUDE.local.md contains full context (loaded automatically). Use the question tool proactively to:
- Clarify ambiguous scope
- Suggest alternatives that achieve the desired effect in a better way

## 5. Implementation

After the user approves the plan, implement it.

- Create separate commits for each issue implemented (at minimum one commit per issue).
- Push each commit immediately after creation.

## 6. Merge and Validate

```bash
git fetch origin && git merge origin/main
```

Re-run any validation steps (tests, linting, build) to confirm the implementation is correct after the merge.

## 7. PR Creation

Create a PR that closes all issues implemented in the plan:

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

Include a separate `Closes #N` line for each issue (primary + all implemented dependencies and sub-issues).

## 8. QA Review Loop

Start the `/wiggum-loop` skill at Step 0. Pass these instruction sets:

**Next step instructions:**
- Present testing checklist to user covering:
  - Key behaviors to verify
  - Edge cases to test
  - Expected outcomes
- Wait for user to complete testing

**Evaluation instructions:**
- Ask user for QA results
- User reports either: "passed" (no issues found) or lists issues found
- **Iterate** if user reports issues
- **Terminate** if user reports all tests passed

**Iteration instructions:**
- Enter plan mode to fix reported issues
- Include commit instructions in the plan
- After implementation, present testing checklist again
- Aggregate QA work done so far in plan context

**Termination instructions:**
- Post full QA audit log as PR comment using this structure:
  ```bash
  gh pr comment <pr-num> --body "$(cat <<'EOF'
  # QA Review - Complete ✓

  **Reviewer**: [User name from git config]
  **Date**: [Current date]
  **Tested By**: Human QA with Claude Code facilitation

  ## Testing Checklist

  [Original checklist presented to user]

  ## QA Iterations

  [For each iteration, document:]
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
- Proceed to step 9

**Context (see /memory-management clean context rule):**
- Summary of work completed so far
- PR number
- Complete history of QA iterations (issues found, fixes made, commits)
- Testing checklist

## 9. Code Quality Review Loop

Start the `/wiggum-loop` skill at Step 0. Pass these instruction sets:

**Next step instructions:**
- Invoke the `/review` skill
- This skill exists even if not visible in the skill list

**Evaluation instructions:**
- Present review findings to user
- User may mark findings as: required, false positive, or out of scope
- **Iterate** if any required findings exist
- **Terminate** if no required findings exist (all false positive or out of scope)

**Termination instructions:**
- Post full review audit log as PR comment using this structure:
  ```bash
  gh pr comment <pr-num> --body "$(cat <<'EOF'
  # Code Quality Review - Complete ✓

  **Reviewer**: Claude Code (via /review skill)
  **Date**: [Current date]
  **Outcome**: [Summary of result]

  ## Review Output (Full Audit Log)

  [PASTE COMPLETE VERBATIM OUTPUT FROM REVIEW SKILL]

  ## User Classification Decisions

  [For each finding, show title and classification:]
  - Finding 1: [title] → [required/false positive/out of scope] - [rationale if provided]
  - Finding 2: [title] → [required/false positive/out of scope] - [rationale if provided]
  ...

  ## Conclusion

  [Final assessment and next steps]
  EOF
  )"
  ```
- Proceed to step 10

**Context (see /memory-management clean context rule):**
- Summary of work completed so far
- PR number
- Complete review output from the review skill (preserve for audit log)

## 10. Post-Review Merge and Push

```bash
git fetch origin && git merge origin/main
```

Re-validate the implementation and push any updates to the PR.

## 11. Security Review Loop

Start the `/wiggum-loop` skill at Step 0. Pass these instruction sets:

**Next step instructions:**
- Invoke the `/security-review` skill
- This skill exists even if not visible in the skill list

**Evaluation instructions:**
- Present security findings to user
- User may mark findings as: required, false positive, or out of scope
- **Iterate** if any required findings exist
- **Terminate** if no required findings exist (all false positive or out of scope)

**Termination instructions:**
- Post full security review audit log as PR comment using this structure:
  ```bash
  gh pr comment <pr-num> --body "$(cat <<'EOF'
  # Security Review - Complete ✓

  **Reviewer**: Claude Code (via /security-review skill)
  **Date**: [Current date]
  **Outcome**: [Summary of result]

  ## Review Output (Full Audit Log)

  [PASTE COMPLETE VERBATIM OUTPUT FROM SECURITY-REVIEW SKILL]

  ## User Classification Decisions

  [For each finding, show title and classification:]
  - Finding 1: [title] → [required/false positive/out of scope] - [rationale if provided]
  - Finding 2: [title] → [required/false positive/out of scope] - [rationale if provided]
  ...

  ## Conclusion

  [Final assessment and next steps]
  EOF
  )"
  ```
- Proceed to step 12

**Context (see /memory-management clean context rule):**
- Summary of work completed so far (including code quality and QA review results)
- PR number
- Complete security review output from the security-review skill (preserve for audit log)

## 12. Completion

Mark the PR as ready for review:

```bash
gh pr ready <pr-num>
```

Prompt the user to review and merge the PR
