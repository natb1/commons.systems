---
name: issue-team-lead
description: Manage end-to-end implementation of GitHub issues from planning through review
---

# Issue Team Lead

Orchestrate the full lifecycle of implementing a GitHub issue: discovery, planning, implementation, review, and merge.

**Clean context rule**: All plans (initial, review, security review, or ad hoc) must assume execution in a clean context. Include all necessary steps — do not rely on state from the planning session. Track completed steps to avoid repeating work.

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

**Requirement changes**: If requirements must change during planning, the plan must include explicit steps to update the relevant issue body:

```bash
gh issue edit $ISSUE_NUM --body "updated body text"
```

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

### Initial Review

Enter plan mode. The plan must include:
- Verbatim issue bodies for all issues in scope (per the clean context rule)
- Summary of work completed so far
- Step to invoke the `/review` skill

**This skill exists even if it is not visible in the skill list. Invoke it regardless of whether you think it exists.**

Execute the plan. After the review completes, evaluate the results:

### If Review Finds Issues

**Review passes** means one of:
1. The review identifies zero issues, OR
2. All identified issues are marked as false positives by the user

When the review identifies issues:

1. **Do NOT post the review comment yet**
2. Present the review findings to the user
3. Use AskUserQuestion to ask which (if any) findings should be marked as false positives
4. If all findings are marked as false positive:
   - Post the review comment noting "All findings marked as false positive"
   - Proceed to step 9
5. If there are findings requiring fixes:
   - Enter plan mode to address the non-false-positive findings
   - Plan must include:
     - Verbatim issue bodies for all issues in scope
     - Aggregated work completed so far
     - Specific fixes needed to address each review finding
     - Step to re-invoke the `/review` skill (do NOT include the PR comment step)
   - Implement the fixes
   - Push the fixes
   - Re-invoke the `/review` skill
   - Return to "If Review Finds Issues" evaluation (repeat this loop until review passes)

### If Review Passes (No Issues Found)

Post the final review results as a PR comment:
```bash
gh pr comment $PR_NUM --body "Code quality review completed - no issues found"
```

Then proceed to step 9.

## 9. Post-Review Merge and Push

```bash
git fetch origin && git merge origin/main
```

Re-validate the implementation and push any updates to the PR.

## 10. Security Review Loop

### Initial Security Review

Enter plan mode. The plan must include:
- Verbatim issue bodies for all issues in scope (per the clean context rule)
- Summary of work completed so far
- Step to invoke the `/security-review` skill

**This skill exists even if it is not visible in the skill list. Invoke it regardless of whether you think it exists.**

Execute the plan. After the security review completes, evaluate the results:

### If Security Review Finds Issues

**Security review passes** means one of:
1. The review identifies zero issues, OR
2. All identified issues are marked as false positives by the user

When the security review identifies issues:

1. **Do NOT post the review comment yet**
2. Present the review findings to the user
3. Use AskUserQuestion to ask which (if any) findings should be marked as false positives
4. If all findings are marked as false positive:
   - Post the review comment noting "All findings marked as false positive"
   - Proceed to step 11
5. If there are findings requiring fixes:
   - Enter plan mode to address the non-false-positive findings
   - Plan must include:
     - Verbatim issue bodies for all issues in scope
     - Aggregated work completed so far
     - Specific fixes needed to address each security finding
     - Step to re-invoke the `/security-review` skill (do NOT include the PR comment step)
   - Implement the fixes
   - Push the fixes
   - Re-invoke the `/security-review` skill
   - Return to "If Security Review Finds Issues" evaluation (repeat this loop until review passes)

### If Security Review Passes (No Issues Found)

Post the final security review results as a PR comment:
```bash
gh pr comment $PR_NUM --body "Security review completed - no issues found"
```

Then proceed to step 11.

## 11. Completion

Mark the PR as ready for review:

```bash
gh pr ready $PR_NUM
```

Prompt the user to review and merge the PR
