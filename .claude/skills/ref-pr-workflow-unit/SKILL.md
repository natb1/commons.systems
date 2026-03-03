---
name: ref-pr-workflow-unit
description: PR workflow unit test phase — automated test and lint loop
allowed-tools: Bash(.claude/skills/ref-pr-workflow/scripts/*), Bash($CLAUDE_PLUGIN_ROOT/scripts/*)
---

# PR Workflow — Unit Test Phase

## Step 4. Unit Test Loop

Start `/wiggum-loop` at Step 0 with these instruction sets:

**Next step instructions:**
- Merge `origin/main`
- Run unit tests and linting

**Evaluation instructions:**
- All pass → **Terminate**
- Failures → **Iterate** (fix, re-run)

**Termination instructions:**
- Update state to step=5/phase=core via `issue-state-write`
- Return to router for dispatch to core phase (Step 5)
