---
name: pr-workflow-ci-monitor
description: Monitor CI runs on a branch until completion
---

# CI Monitor

Args: `BRANCH=<x>`

Run in a background Task (`run_in_background: true`). Use `dangerouslyDisableSandbox: true`. Wait for the initial CI run to start, then monitor it:
```bash
.claude/skills/ref-pr-workflow/scripts/run-ci-watch.sh <run-id> --delay 240
```
