---
name: pr-workflow-termination-summary
description: Write final summary and post a PR comment when a wiggum-loop terminates
allowed-tools: Bash(.claude/skills/ref-pr-workflow/scripts/*), Bash($CLAUDE_PLUGIN_ROOT/scripts/*)
---

# Termination Summary

Args: `PHASE_NAME=<x> FILE_PREFIX=<x> PR_NUM=<n> NEXT_STEP=<n> NEXT_PHASE=<x> CONCLUSION_TEXT=<text>`
Optional args: `EXTRA_HEADER_FIELDS=<text> EXTRA_SECTIONS=<text>`

```bash
mkdir -p "$(git rev-parse --show-toplevel)/tmp"
```

- Write final summary to `$(git rev-parse --show-toplevel)/tmp/{FILE_PREFIX}-final.txt`:
  ```
  # {PHASE_NAME} Review - Complete

  **Date**: [Current date]
  **Branch**: [branch name]
  {EXTRA_HEADER_FIELDS}

  ## Iterations

  [For each iteration:]
  - Iteration 1: [Failures] -> [Fixes] (commits: [hashes])
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
- Update issue state to step={NEXT_STEP}/phase={NEXT_PHASE} via `issue-state-write`
