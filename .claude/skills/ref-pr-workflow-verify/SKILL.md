---
name: ref-pr-workflow-verify
description: PR workflow verify phase — acceptance test and smoke test loops
allowed-tools: Bash(.claude/skills/ref-pr-workflow/scripts/*), Bash($CLAUDE_PLUGIN_ROOT/scripts/*)
---

# PR Workflow — Verify Phase

Steps 6 and 7. Start at the step indicated by the router.

Invoke `/ref-pr-workflow-loop` if not already active.

## Step 6. Acceptance Test Loop

Start `/wiggum-loop` at Step 0 with these instruction sets:

**Next step instructions:**
- Use Template C (CI Monitoring) from `/ref-pr-workflow-loop`

**Evaluation instructions:**
- All pass → **Terminate**
- Test failures → **Iterate** (fix, commit, push, wait for re-run)
- Infrastructure failures → present to user for resolution

**Progress report instructions:**
- Use Template A (Progress Report) with: `{FILE_PREFIX}=acceptance`

**Termination instructions:**
- Use Template B (Termination Summary) with:
  - `{PHASE_NAME}=Acceptance Test`
  - `{FILE_PREFIX}=acceptance`
  - `{CONCLUSION_TEXT}=All acceptance tests passed. PR approved for QA review.`
  - `{NEXT_STEP}=7`, `{NEXT_PHASE}=verify`
- Proceed to Step 7

## Step 7. Smoke Test Loop

Start `/wiggum-loop` at Step 0 with these instruction sets:

**Next step instructions:**
- Use Template C (CI Monitoring) from `/ref-pr-workflow-loop`

**Evaluation instructions:**
- All pass → **Terminate**
- Smoke test failures → **Iterate** (fix, commit, push, wait for re-run)
- Deploy failures → present to user for resolution

**Progress report instructions:**
- Use Template A (Progress Report) with: `{FILE_PREFIX}=smoke`

**Termination instructions:**
- Use Template B (Termination Summary) with:
  - `{PHASE_NAME}=Smoke Test`
  - `{FILE_PREFIX}=smoke`
  - `{CONCLUSION_TEXT}=Smoke tests passed. Preview deployment verified.`
  - `{NEXT_STEP}=8`, `{NEXT_PHASE}=review`
- Return to router for dispatch to review phase
