---
name: ref-issue-workflow
description: Complete workflow documentation for issue implementation lifecycle — resume from any step after context loss
---

# Issue Workflow Reference

## Resume Logic

Determine starting step by checking CLAUDE.local.md for `## PR Context`. If absent, invoke `/pr-context` first.

Decision tree:

- **No `### Current PR` section**:
  - Implementation commits in commit log → Step 6
  - No implementation commits → Step 3
- **PR exists, no QA audit log comment** → Step 7
- **PR exists, QA complete, no code quality log** → Step 8
- **PR exists, QA + code quality complete, no security log** → Step 9
- **All audit logs exist** → Step 10

## Step 1. Prerequisite Check

Verify the working directory is a worktree for the requested issue:

```bash
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
```

If no issue number provided, or `$CURRENT_BRANCH` doesn't start with the issue number followed by `-`: invoke `/worktree` instead. Stop.

## Step 2. Context Sync

Invoke `/pr-context` to sync CLAUDE.local.md with GitHub data.

## Step 3. Planning Phase

Enter plan mode. Scope defined by `## PR Context` in CLAUDE.local.md. Use the question tool to:
- Clarify ambiguous scope
- Suggest better alternatives

## Step 4. Implementation

Implement the approved plan. Create separate commits for each issue (minimum one commit per issue).

## Step 5. Merge and Validate

```bash
git fetch origin && git merge origin/main
```

Re-run validation (tests, linting, build) to confirm correctness after merge.

## Step 6. PR Creation

Create a PR closing all implemented issues from `## PR Context`:

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

## Step 7. QA Review Loop

Start `/wiggum-loop` at Step 0 with these instruction sets:

**Next step instructions:**
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
