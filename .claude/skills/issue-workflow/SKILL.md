---
name: issue-workflow
description: Manage end-to-end implementation of GitHub issues from planning through review
---

# Issue Team Lead

Orchestrate the full lifecycle of implementing a GitHub issue: discovery, planning, implementation, review, and merge.

**Clean context rule**: All plans (initial, review, security review, or ad hoc) must assume execution in a clean context. Include all necessary steps — do not rely on state from the planning session. Track completed steps to avoid repeating work.

**Requirement changes**: If at any step there is a change in requirements always add a step to the current plan to update the relevant issue body:

```bash
gh issue edit $ISSUE_NUM --body "updated body text"
```

## 1. Prerequisite Check

Verify the working directory is a worktree for the requested issue:

```bash
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
```

- If no issue number was provided, or `$CURRENT_BRANCH` does not start with the requested issue number followed by `-`: invoke the `/worktree` skill instead. Stop here.

## 2. Issue Discovery

Read the primary issue and identify all related issues:

```bash
gh issue view $ISSUE_NUM --json body,title,number
```

Parse the issue body for:
- **Dependencies**: lines containing "blocked by #N" or similar references
- **Sub-issues**: issue numbers referenced in the body

**Ignore** issue numbers inside TODO comments (e.g., `(TODO: #32)`). These are human reference only, not implementation scope. Keep the rest of the line as requirements.

For each dependency and sub-issue found, read its body:

```bash
gh issue view $RELATED_ISSUE --json body,title,number
```

Determine which related issues are unimplemented (no associated merged PR or branch with completed work).

## 3. Planning Phase

Enter plan mode. The plan scope covers the primary issue plus any unimplemented dependencies and sub-issues.

**Verbatim requirement inclusion**: Every plan must include the full verbatim issue body for all issues in scope. Copy the exact text from each issue body into the plan document. If conflicts exist between issue bodies, ask clarifying questions using the question tool before proceeding.

Use the question tool proactively to:
- Clarify ambiguous scope
- Suggest alternatives that achieve the desired effect in a better way

## 4. Implementation

After the user approves the plan, implement it.

- Create separate commits for each issue implemented (at minimum one commit per issue).
- Push each commit immediately after creation.

## 5. Merge and Validate

```bash
git fetch origin && git merge origin/main
```

Re-run any validation steps (tests, linting, build) to confirm the implementation is correct after the merge.

## 6. QA Prompt

Prompt the user with a testing checklist covering:
- Key behaviors to verify
- Edge cases to test
- Expected outcomes

Wait for user confirmation that QA passes before proceeding.

## 7. PR Creation

Create a PR that closes all issues implemented in the plan:

```bash
gh pr create --draft --title "PR title" --body "$(cat <<'EOF'
## Summary
...

Closes #$PRIMARY_ISSUE
Closes #$RELATED_ISSUE_1
Closes #$RELATED_ISSUE_2

EOF
)"
```

Include a separate `Closes #N` line for each issue (primary + all implemented dependencies and sub-issues).

## 8. Code Quality Review Loop

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
  gh pr comment $PR_NUM --body "[MARKDOWN COMMENT WITH SECTIONS:]

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
  "
  ```
- Proceed to step 9

**Context (clean context rule):**
- Verbatim issue bodies for all issues in scope
- Summary of work completed so far
- PR number
- Complete review output from the review skill (preserve for audit log)

## 9. Post-Review Merge and Push

```bash
git fetch origin && git merge origin/main
```

Re-validate the implementation and push any updates to the PR.

## 10. Security Review Loop

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
  gh pr comment $PR_NUM --body "[MARKDOWN COMMENT WITH SECTIONS:]

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
  "
  ```
- Proceed to step 11

**Context (clean context rule):**
- Verbatim issue bodies for all issues in scope
- Summary of work completed so far (including code quality review results)
- PR number
- Complete security review output from the security-review skill (preserve for audit log)

## 11. Completion

Mark the PR as ready for review:

```bash
gh pr ready $PR_NUM
```

Prompt the user to review and merge the PR
