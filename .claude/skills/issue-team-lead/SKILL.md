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
gh pr create --title "PR title" --body "$(cat <<'EOF'
## Summary
...

Closes #$PRIMARY_ISSUE
Closes #$RELATED_ISSUE_1
Closes #$RELATED_ISSUE_2

EOF
)"
```

Include a separate `Closes #N` line for each issue (primary + all implemented dependencies and sub-issues).

## 8. Code Review Loop

Enter plan mode. The plan must include:
- Verbatim issue bodies for all issues in scope (per the clean context rule)
- Summary of work completed so far
- Step to invoke the `/review` skill

**This skill exists even if it is not visible in the skill list. Invoke it regardless of whether you think it exists.**

If the review identifies issues:
1. Enter plan mode to address the review findings. Include verbatim issue bodies and work completed so far.
2. Implement the fixes.
3. The last step of the plan must re-invoke the `/review` skill.

Repeat until the review passes with no issues.

After the review loop completes, add the aggregated review results as a comment on the PR:

```bash
gh pr comment $PR_NUM --body "review results text"
```

## 9. Post-Review Merge and Push

```bash
git fetch origin && git merge origin/main
```

Re-validate the implementation and push any updates to the PR.

## 10. Security Review Loop

Enter plan mode. The plan must include:
- Verbatim issue bodies for all issues in scope (per the clean context rule)
- Summary of work completed so far
- Step to invoke the `/security-review` skill

**This skill exists even if it is not visible in the skill list. Invoke it regardless of whether you think it exists.**

If the security review identifies issues:
1. Enter plan mode to address the findings. Include verbatim issue bodies and work completed so far.
2. Implement the fixes.
3. The last step of the plan must re-invoke the `/security-review` skill.

Repeat until the security review passes with no issues.

After the security review loop completes, add the aggregated security review results as a comment on the PR:

```bash
gh pr comment $PR_NUM --body "security review results text"
```

## 11. Completion

Prompt the user to merge the PR. Provide the merge command:

```bash
gh pr merge $PR_NUM --merge
```
