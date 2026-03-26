---
name: ref-code-quality
description: Code quality review loop — 7 parallel review tasks with wiggum-loop
---

# Code Quality Review Loop

Step 9. Invoke `/wiggum-loop` at Step 0 with these instruction sets:

**Next step instructions:**
- Launch 7 review tasks in parallel using the Task tool. Collect all returned results verbatim — do NOT summarize or paraphrase task output:
  1. **`/review` skill** — Launch a Task with `subagent_type: "general-purpose"` that invokes the Skill tool with `skill: "review"`. Include the PR diff context in the prompt.
  2. **`pr-review-toolkit:code-reviewer`** — Launch a Task with `subagent_type: "pr-review-toolkit:code-reviewer"`.
  3. **`/simplify` skill** — Launch a Task with `subagent_type: "general-purpose"` that invokes the Skill tool with `skill: "simplify"`. Include the PR diff context in the prompt.
  4. **`pr-review-toolkit:comment-analyzer`** — Launch a Task with `subagent_type: "pr-review-toolkit:comment-analyzer"`.
  5. **`pr-review-toolkit:pr-test-analyzer`** — Launch a Task with `subagent_type: "pr-review-toolkit:pr-test-analyzer"`.
  6. **`pr-review-toolkit:silent-failure-hunter`** — Launch a Task with `subagent_type: "pr-review-toolkit:silent-failure-hunter"`.
  7. **`pr-review-toolkit:type-design-analyzer`** — Launch a Task with `subagent_type: "pr-review-toolkit:type-design-analyzer"`.
- All 7 tasks MUST be launched in a single message (parallel execution) with `run_in_background: true`
- Wait for all 7 tasks to complete using TaskOutput with `block: true` before proceeding. Note each task's `output_file` path.
- If any task other than `/review` fails to launch, log a warning but continue — `/review` results alone are sufficient to proceed
- Construct `tmp/codequality-output-<N>.txt` by calling the concat script — do NOT use the Write tool or re-output verbatim content:
  ```bash
  .claude/skills/ref-pr-workflow/scripts/concat-review-output.sh \
    tmp/codequality-output-<N>.txt \
    "/review Output:$REVIEW_OUT" \
    "pr-review-toolkit: code-reviewer:$CODE_REVIEWER_OUT" \
    "/simplify Output:$SIMPLIFY_OUT" \
    "pr-review-toolkit: comment-analyzer:$COMMENT_ANALYZER_OUT" \
    "pr-review-toolkit: pr-test-analyzer:$PR_TEST_ANALYZER_OUT" \
    "pr-review-toolkit: silent-failure-hunter:$SILENT_FAILURE_OUT" \
    "pr-review-toolkit: type-design-analyzer:$TYPE_DESIGN_OUT"
  ```
  Substitute each `$*_OUT` variable with the `output_file` path from the corresponding Task result. For unavailable tasks, pass an empty path (e.g., `"label:"`) — the script prints "Task unavailable".

**Evaluation instructions:**
- **Aggregate and deduplicate** findings across all tasks — merge near-identical findings into single entries noting which tasks raised them
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
- **CRITICAL: STOP AND WAIT FOR USER APPROVAL.** Present findings organized by category, then wait for the user to confirm or alter each classification. Do not write the evaluation file, implement fixes, or proceed to the iterate/terminate decision until the user responds.
- **User decision determines outcome:**
  - User confirms zero high-priority required findings → **Terminate**
  - User confirms or adds high-priority required findings → **Iterate**
  - User alters classifications → re-evaluate using same decision rules
- Any high-priority required findings → **Iterate**
- Zero high-priority required findings → **Terminate** (low-priority required findings alone do not block termination)

**Iterate instructions:**
- Implement ONLY required findings (high and low priority). Do NOT implement out-of-scope or false positive findings.
- Do NOT modify files outside the PR's scope. If a finding targets code that was not changed by this PR branch, classify it as out-of-scope.

**Progress report instructions:**
- `mkdir -p tmp`
- Write evaluation results (user classifications) to `tmp/codequality-eval-<N>.txt`
- Post combined comment (constructed from background Task `output_file` paths via the Bash command above):
  ```bash
  .claude/skills/ref-pr-workflow/scripts/post-pr-comment.sh <pr-num> tmp/codequality-output-<N>.txt tmp/codequality-eval-<N>.txt
  ```

**Termination instructions:**
- Implement all low-priority required findings from the final evaluation
- Commit the low-priority implementations
- `mkdir -p tmp`
- Write final summary to `tmp/codequality-final.txt` (header must be `# Code Quality Review - Complete ✓`):
  ```
  # Code Quality Review - Complete ✓

  **Reviewer**: Claude Code (via /review + /simplify skills + pr-review-toolkit agents)
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
  .claude/skills/ref-pr-workflow/scripts/post-pr-comment.sh <pr-num> tmp/codequality-final.txt
  ```
- Update state to step=10/phase=security:
  ```bash
  .claude/skills/ref-pr-workflow/scripts/issue-state-write <issue-number> '{"version":1,"step":10,"step_label":"Security Review Loop","phase":"security","active_skills":["ref-memory-management","ref-pr-workflow","ref-security"]}'
  ```
- Proceed to Step 10
