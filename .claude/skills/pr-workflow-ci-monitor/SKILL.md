---
name: pr-workflow-ci-monitor
description: Monitor CI runs on a branch until completion
---

# CI Monitor

Args: `BRANCH=<x>`

Run in a background Task (`run_in_background: true`). Note the `output_file` path:
```bash
gh run list --branch {BRANCH} --limit 5
gh run view <run-id>
```
If the run is in progress, wait for it to complete before returning output.
