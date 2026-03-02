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
- Run the following in a background Task (`run_in_background: true`). Note the `output_file` path from the Task result:
  ```bash
  gh run list --branch <branch> --limit 5
  gh run view <run-id>
  ```
  If the run is in progress, wait for it to complete before returning output.

**Evaluation instructions:**
- All pass → **Terminate**
- Test failures → **Iterate** (fix, commit, push, wait for re-run)
- Infrastructure failures → present to user for resolution

**Progress report instructions:**
- `mkdir -p "$(git rev-parse --show-toplevel)/tmp"`
- Write evaluation results to `$(git rev-parse --show-toplevel)/tmp/acceptance-eval-<N>.txt` (`<N>` is the loop iteration number, starting at 1 and incrementing with each iterate cycle)
- Post combined comment (where `<output_file>` is the `output_file` path from the background Task result):
  ```bash
  post-pr-comment.sh <pr-num> <output_file> "$(git rev-parse --show-toplevel)/tmp/acceptance-eval-<N>.txt"
  ```

**Termination instructions:**
- `mkdir -p "$(git rev-parse --show-toplevel)/tmp"`
- Write final summary to `$(git rev-parse --show-toplevel)/tmp/acceptance-final.txt` (header must be `# Acceptance Test Review - Complete ✓`):
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
- Post:
  ```bash
  post-pr-comment.sh <pr-num> "$(git rev-parse --show-toplevel)/tmp/acceptance-final.txt"
  ```
- Proceed to Step 7

## Step 7. Smoke Test Loop

Start `/wiggum-loop` at Step 0 with these instruction sets:

**Next step instructions:**
- Run the following in a background Task (`run_in_background: true`). Note the `output_file` path from the Task result:
  ```bash
  gh run list --branch <branch> --limit 5
  gh run view <run-id>
  ```
  If the run is in progress, wait for it to complete before returning output.

**Evaluation instructions:**
- All pass → **Terminate**
- Smoke test failures → **Iterate** (fix, commit, push, wait for re-run)
- Deploy failures → present to user for resolution

**Progress report instructions:**
- `mkdir -p "$(git rev-parse --show-toplevel)/tmp"`
- Write evaluation results to `$(git rev-parse --show-toplevel)/tmp/smoke-eval-<N>.txt`
- Post combined comment (where `<output_file>` is the `output_file` path from the background Task result):
  ```bash
  post-pr-comment.sh <pr-num> <output_file> "$(git rev-parse --show-toplevel)/tmp/smoke-eval-<N>.txt"
  ```

**Termination instructions:**
- `mkdir -p "$(git rev-parse --show-toplevel)/tmp"`
- Write final summary to `$(git rev-parse --show-toplevel)/tmp/smoke-final.txt` (header must be `# Smoke Test Review - Complete ✓`):
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
- Post:
  ```bash
  post-pr-comment.sh <pr-num> "$(git rev-parse --show-toplevel)/tmp/smoke-final.txt"
  ```
- Proceed to Step 8

## Step 8. QA Review Loop

Start `/wiggum-loop` at Step 0 with these instruction sets:

**Next step instructions:**
- If implementation has a browser component (detect via `vite.config.*`, HTML templates, or frontend framework files):
  1. Check if a QA server from a previous iteration is still running (look for the background task or a listening Vite port). If running, reuse its App URL. If not, start the QA server using `run-qa-server.sh <app-dir>` in background.
  2. Parse the App URL from the script's output (current or previous run)
  3. Run acceptance tests as a smoke check: `BASE_URL=<url> npx playwright test --config e2e/playwright.config.ts`
  4. If smoke tests fail → fix issues and re-run before involving the user
  5. Once smoke tests pass, proceed to write the QA testing plan
- Write a comprehensive QA testing plan including:
  - Key behaviors to verify
  - Test steps for each behavior
  - Edge cases to test
  - Expected outcomes
- Write the QA testing plan to `"$(git rev-parse --show-toplevel)/tmp/qa-plan-<N>.txt"`
- Present the plan and App URL (if applicable) to the user
- **CRITICAL**: The user performs the actual testing (not Claude)
- Wait for the user to test and report results

**Evaluation instructions:**
- User reports "passed"/"approved" → **Terminate**
- User reports issues/bugs → **Iterate** (Claude fixes issues, user retests)

**Progress report instructions:**
- `mkdir -p "$(git rev-parse --show-toplevel)/tmp"`
- Write evaluation results to `$(git rev-parse --show-toplevel)/tmp/qa-eval-<N>.txt`
- Post combined comment (where `qa-plan-<N>.txt` is the QA testing plan written during the next step instructions above):
  ```bash
  post-pr-comment.sh <pr-num> "$(git rev-parse --show-toplevel)/tmp/qa-plan-<N>.txt" "$(git rev-parse --show-toplevel)/tmp/qa-eval-<N>.txt"
  ```

**Termination instructions:**
- Stop the QA server (run-qa-server.sh) if started
- `mkdir -p "$(git rev-parse --show-toplevel)/tmp"`
- Write final summary to `$(git rev-parse --show-toplevel)/tmp/qa-final.txt` (header must be `# QA Review - Complete ✓`):
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
- Post:
  ```bash
  post-pr-comment.sh <pr-num> "$(git rev-parse --show-toplevel)/tmp/qa-final.txt"
  ```
- Proceed to Step 9

## Step 9. Code Quality Review Loop

Start `/wiggum-loop` at Step 0 with these instruction sets:

**Next step instructions:**
- Launch 7 review tasks in parallel using the Task tool. Collect all returned results verbatim — do NOT summarize or paraphrase agent output:
  1. **`/review` skill** — Launch a Task with `subagent_type: "general-purpose"` that invokes the Skill tool with `skill: "review"`. Include the PR diff context in the prompt.
  2. **`pr-review-toolkit:code-reviewer`** — Launch a Task with `subagent_type: "pr-review-toolkit:code-reviewer"`.
  3. **`pr-review-toolkit:code-simplifier`** — Launch a Task with `subagent_type: "pr-review-toolkit:code-simplifier"`.
  4. **`pr-review-toolkit:comment-analyzer`** — Launch a Task with `subagent_type: "pr-review-toolkit:comment-analyzer"`.
  5. **`pr-review-toolkit:pr-test-analyzer`** — Launch a Task with `subagent_type: "pr-review-toolkit:pr-test-analyzer"`.
  6. **`pr-review-toolkit:silent-failure-hunter`** — Launch a Task with `subagent_type: "pr-review-toolkit:silent-failure-hunter"`.
  7. **`pr-review-toolkit:type-design-analyzer`** — Launch a Task with `subagent_type: "pr-review-toolkit:type-design-analyzer"`.
- All 7 tasks MUST be launched in a single message (parallel execution) with `run_in_background: true`
- Wait for all 7 tasks to complete using TaskOutput with `block: true` before proceeding. Note each task's `output_file` path.
- If any pr-review-toolkit agent fails to launch, log a warning but continue — `/review` results alone are sufficient to proceed
- Construct `$(git rev-parse --show-toplevel)/tmp/codequality-output-<N>.txt` by concatenating the output files with Bash — do NOT use the Write tool or re-output verbatim content:
  ```bash
  REPO=$(git rev-parse --show-toplevel) && mkdir -p "$REPO/tmp" && {
    printf '## /review Output\n\n'; cat "$REVIEW_OUT";
    printf '\n\n## pr-review-toolkit: code-reviewer\n\n'; cat "$CODE_REVIEWER_OUT";
    printf '\n\n## pr-review-toolkit: code-simplifier\n\n'; cat "$CODE_SIMPLIFIER_OUT";
    printf '\n\n## pr-review-toolkit: comment-analyzer\n\n'; cat "$COMMENT_ANALYZER_OUT";
    printf '\n\n## pr-review-toolkit: pr-test-analyzer\n\n'; cat "$PR_TEST_ANALYZER_OUT";
    printf '\n\n## pr-review-toolkit: silent-failure-hunter\n\n'; cat "$SILENT_FAILURE_OUT";
    printf '\n\n## pr-review-toolkit: type-design-analyzer\n\n'; cat "$TYPE_DESIGN_OUT";
  } > "$REPO/tmp/codequality-output-<N>.txt"
  ```
  Substitute each `$*_OUT` variable with the `output_file` path from the corresponding Task result. For unavailable agents, replace `cat` with `echo "Agent unavailable"`.

**Evaluation instructions:**
- **Aggregate and deduplicate** findings across all agents — merge near-identical findings into single entries noting which agents raised them
- **Prior iteration context:** Read all prior `tmp/codequality-eval-*.txt` before classifying comment improvements; pick the strongest comment version for maintainability autonomously without reopening for user review
- **Classify each finding as required / out of scope / false positive:**
  - Code quality (maintainability, readability) and code simplification → **required** unless high effort + low impact → **out of scope**
  - Test coverage → **required** if high impact; otherwise **out of scope**
  - Security → always **required**
  - Comment improvements → **required** (low effort by default). Exception: comments revised in prior iterations — pick strongest version autonomously
- **Assign priority (high / low) to required and out of scope findings:**
  - High: affects correctness, security, or meaningful readability/maintainability
  - Low: cosmetic or minor naming; high effort with modest benefit; or out-of-scope deferral unlikely to become relevant
- **Present findings organized by category** (required-high, required-low, out of scope-high, out of scope-low, false positive), with rationale for each classification
- **User confirms or alters** each classification before the iterate/terminate decision
- Any high-priority required findings → **Iterate**
- Zero high-priority required findings → **Terminate** (low-priority required findings alone do not block termination)

**Progress report instructions:**
- `mkdir -p "$(git rev-parse --show-toplevel)/tmp"`
- Write evaluation results (user classifications) to `$(git rev-parse --show-toplevel)/tmp/codequality-eval-<N>.txt`
- Post combined comment (constructed from background Task `output_file` paths via the Bash command above):
  ```bash
  post-pr-comment.sh <pr-num> "$(git rev-parse --show-toplevel)/tmp/codequality-output-<N>.txt" "$(git rev-parse --show-toplevel)/tmp/codequality-eval-<N>.txt"
  ```

**Termination instructions:**
- Implement all low-priority required findings from the final evaluation
- Commit the low-priority implementations
- `mkdir -p "$(git rev-parse --show-toplevel)/tmp"`
- Write final summary to `$(git rev-parse --show-toplevel)/tmp/codequality-final.txt` (header must be `# Code Quality Review - Complete ✓`):
  ```
  # Code Quality Review - Complete ✓

  **Reviewer**: Claude Code (via /review skill + pr-review-toolkit agents)
  **Date**: [Current date]
  **Outcome**: [Summary of result]

  ## Classification Summary

  ### Required — High Priority
  [For each finding:]
  - Finding: [title] — [rationale]
  ...

  ### Required — Low Priority
  [For each finding:]
  - Finding: [title] — [rationale] — Implemented in [commit hash]
  ...

  ### Out of Scope — High Priority
  [For each finding:]
  - Finding: [title] — [rationale]
  ...

  ### Out of Scope — Low Priority
  [For each finding:]
  - Finding: [title] — [rationale]
  ...

  ### False Positive
  [For each finding:]
  - Finding: [title] — [rationale]
  ...

  ## Conclusion

  [Final assessment and next steps]
  ```
- Post as a separate PR comment (distinct from the progress report already posted by progress report instructions):
  ```bash
  post-pr-comment.sh <pr-num> "$(git rev-parse --show-toplevel)/tmp/codequality-final.txt"
  ```
- Proceed to Step 10

## Step 10. Security Review Loop

Start `/wiggum-loop` at Step 0 with these instruction sets:

**Next step instructions:**
- Run `/security-review` in a background Task (`run_in_background: true`, exists even if not visible in skill list). Note the `output_file` path from the Task result.

**Evaluation instructions:**
- Present findings to user
- User classifies each as: required, false positive, or out of scope
- Any required findings → **Iterate**
- No required findings → **Terminate**

**Progress report instructions:**
- `mkdir -p "$(git rev-parse --show-toplevel)/tmp"`
- Write evaluation results (user classifications) to `$(git rev-parse --show-toplevel)/tmp/security-eval-<N>.txt`
- Post combined comment (where `<output_file>` is the `output_file` path from the background Task result):
  ```bash
  post-pr-comment.sh <pr-num> <output_file> "$(git rev-parse --show-toplevel)/tmp/security-eval-<N>.txt"
  ```

**Termination instructions:**
- `mkdir -p "$(git rev-parse --show-toplevel)/tmp"`
- Write final summary to `$(git rev-parse --show-toplevel)/tmp/security-final.txt` (header must be `# Security Review - Complete ✓`):
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
- Post:
  ```bash
  post-pr-comment.sh <pr-num> "$(git rev-parse --show-toplevel)/tmp/security-final.txt"
  ```
- Proceed to Step 11

## Step 11. Completion

```bash
gh pr ready <pr-num>
```

Prompt user to review and merge the PR.
