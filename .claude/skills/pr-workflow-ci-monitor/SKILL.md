---
name: pr-workflow-ci-monitor
description: Monitor CI runs on a branch until completion
---

# CI Monitor

Args: `BRANCH=<x>`

Run in a background Task (`run_in_background: true`). Use `dangerouslyDisableSandbox: true`. Wait for the initial CI run to start, then monitor it:
```bash
sleep 240 && gh run watch -i 30 --exit-status <run-id>
```
