---
name: pr-workflow-progress-report
description: Write evaluation results and post a PR comment for a wiggum-loop iteration
allowed-tools: Bash(.claude/skills/ref-pr-workflow/scripts/*), Bash($CLAUDE_PLUGIN_ROOT/scripts/*)
---

# Progress Report

Args: `FILE_PREFIX=<x> PR_NUM=<n> ITERATION=<n>`

```bash
mkdir -p tmp
```

- Write evaluation results to `tmp/{FILE_PREFIX}-eval-{ITERATION}.txt`
- Post combined comment:
  ```bash
  post-pr-comment.sh {PR_NUM} <output_file> tmp/{FILE_PREFIX}-eval-{ITERATION}.txt
  ```
