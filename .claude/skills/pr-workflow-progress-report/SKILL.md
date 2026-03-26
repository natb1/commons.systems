---
name: pr-workflow-progress-report
description: Write evaluation results and post a PR comment for a wiggum-loop iteration
---

# Progress Report

Args: `FILE_PREFIX=<x> PR_NUM=<n> ITERATION=<n>`

```bash
mkdir -p tmp
```

- Write evaluation results to `tmp/{FILE_PREFIX}-eval-{ITERATION}.txt`
- Post combined comment:
  ```bash
  .claude/skills/ref-pr-workflow/scripts/post-pr-comment.sh {PR_NUM} <output_file> tmp/{FILE_PREFIX}-eval-{ITERATION}.txt
  ```
