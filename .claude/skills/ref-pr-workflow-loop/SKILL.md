---
name: ref-pr-workflow-loop
description: Shared loop templates for PR workflow phases — progress reports, termination summaries, CI monitoring
allowed-tools: Bash(.claude/skills/ref-pr-workflow/scripts/*), Bash($CLAUDE_PLUGIN_ROOT/scripts/*)
---

# PR Workflow Loop Templates

Parameterized templates for wiggum-loop phases. Callers substitute `{PARAM}` placeholders with phase-specific values.

Parameters:
- `{PHASE_NAME}`: Human-readable name (e.g., "Acceptance Test", "Smoke Test", "Security")
- `{FILE_PREFIX}`: File naming prefix (e.g., "acceptance", "smoke", "security")
- `{PR_NUM}`: PR number
- `{NEXT_STEP}`: Step number after termination
- `{NEXT_PHASE}`: Phase after termination (e.g., "verify", "review", "core")
- `{CONCLUSION_TEXT}`: Conclusion paragraph for termination summary
- `{EXTRA_HEADER_FIELDS}` (optional): Additional header fields in termination summary
- `{EXTRA_SECTIONS}` (optional): Additional markdown sections before Conclusion

## Template A: Progress Report

```
mkdir -p "$(git rev-parse --show-toplevel)/tmp"
```
- Write evaluation results to `$(git rev-parse --show-toplevel)/tmp/{FILE_PREFIX}-eval-<N>.txt`
- Post combined comment:
  ```bash
  post-pr-comment.sh {PR_NUM} <output_file> "$(git rev-parse --show-toplevel)/tmp/{FILE_PREFIX}-eval-<N>.txt"
  ```

## Template B: Termination Summary

```
mkdir -p "$(git rev-parse --show-toplevel)/tmp"
```
- Write final summary to `$(git rev-parse --show-toplevel)/tmp/{FILE_PREFIX}-final.txt`:
  ```
  # {PHASE_NAME} Review - Complete ✓

  **Date**: [Current date]
  **Branch**: [branch name]
  {EXTRA_HEADER_FIELDS}

  ## Iterations

  [For each iteration:]
  - Iteration 1: [Failures] → [Fixes] (commits: [hashes])
  ...
  - Final iteration: All tests passed

  {EXTRA_SECTIONS}

  ## Conclusion

  {CONCLUSION_TEXT}
  ```
- Post:
  ```bash
  post-pr-comment.sh {PR_NUM} "$(git rev-parse --show-toplevel)/tmp/{FILE_PREFIX}-final.txt"
  ```
- Update state to step={NEXT_STEP}/phase={NEXT_PHASE} via `issue-state-write`

## Template C: CI Monitoring

Run in a background Task (`run_in_background: true`). Note the `output_file` path:
```bash
gh run list --branch <branch> --limit 5
gh run view <run-id>
```
If the run is in progress, wait for it to complete before returning output.
