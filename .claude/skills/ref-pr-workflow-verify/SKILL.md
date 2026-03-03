---
name: ref-pr-workflow-verify
description: PR workflow verify phase — acceptance test and smoke test loops
allowed-tools: Bash(.claude/skills/ref-pr-workflow/scripts/*), Bash($CLAUDE_PLUGIN_ROOT/scripts/*)
---

# PR Workflow — Verify Phase

Steps 6 and 7. Start at the step indicated by the router.

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
- Update state to step=7/phase=verify via `issue-state-write`
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
- Update state to step=8/phase=review via `issue-state-write`
- Return to router for dispatch to review phase
