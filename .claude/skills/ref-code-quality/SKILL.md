---
name: ref-code-quality
description: Code quality review loop — 7 parallel review agents with wiggum-loop
allowed-tools: Bash(.claude/skills/ref-pr-workflow/scripts/*), Bash($CLAUDE_PLUGIN_ROOT/scripts/*)
---

# Code Quality Review Loop

Step 9. Start `/wiggum-loop` at Step 0 with these instruction sets:

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
- Write final summary to `$(git rev-parse --show-toplevel)/tmp/codequality-final.txt` (header must be `# Code Quality Review - Complete`):
  ```
  # Code Quality Review - Complete

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
- Update state to step=10/phase=security via `issue-state-write`
- Proceed to Step 10
