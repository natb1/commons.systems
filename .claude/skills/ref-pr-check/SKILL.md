---
name: ref-pr-check
description: Forked verify loop with CI monitoring — runs Steps 6 and 7 in isolated context
context: fork
allowed-tools: Bash(.claude/skills/ref-pr-workflow/scripts/*), Bash($CLAUDE_PLUGIN_ROOT/scripts/*)
---

# Verify Loop (Forked)

Self-contained wiggum-loop for Steps 6 (acceptance) and 7 (smoke). Runs in isolated context — cannot invoke other skills.

On load, read issue state via `.claude/skills/ref-pr-workflow/scripts/issue-state-read` to determine entry point:
- step=6 → start at Phase 1 (acceptance)
- step=7 → start at Phase 2 (smoke)

## Sandbox

Use `dangerouslyDisableSandbox: true` for git write operations (`git add`, `git commit`, `git merge`, `git push`) and all `gh` CLI calls (`gh run watch`, `.claude/skills/ref-pr-workflow/scripts/issue-state-write`, `.claude/skills/ref-pr-workflow/scripts/post-pr-comment.sh`).

## Phase 1: Acceptance Tests (Step 6)

Iteration counter starts at 1.

### Execute

Run in a background Task (`run_in_background: true`). Use `dangerouslyDisableSandbox: true`. Wait for the initial CI run to start, then monitor it:
```bash
sleep 240 && gh run watch -i 30 --exit-status <run-id>
```

### Evaluate

- All pass → go to Terminate
- Test failures → go to Iterate
- Infrastructure failures → set status to `"needs_user"`, go to Return

### Progress Report

- `mkdir -p tmp`
- Write evaluation to `tmp/acceptance-eval-<N>.txt`
- Post combined comment:
  ```bash
  .claude/skills/ref-pr-workflow/scripts/post-pr-comment.sh <pr-num> <output_file> tmp/acceptance-eval-<N>.txt
  ```
- Write checkpoint:
  ```bash
  echo '{"iteration":<N>,"outcome":"<iterate|terminate>","last_eval_file":"tmp/acceptance-eval-<N>.txt"}' \
    > tmp/acceptance-subagent-state.json
  ```

### Iterate

Fix failures. Commit and push. Increment counter. Return to Execute.
```bash
git add <files> && git commit -m "..." && git push origin HEAD
```

### Terminate

- `mkdir -p tmp`
- Write final summary to `tmp/acceptance-final.txt`:
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

  All acceptance tests passed. Proceeding to smoke tests.
  ```
- Post:
  ```bash
  .claude/skills/ref-pr-workflow/scripts/post-pr-comment.sh <pr-num> tmp/acceptance-final.txt
  ```
- Update issue state to step=7/phase=verify:
  ```bash
  .claude/skills/ref-pr-workflow/scripts/issue-state-write <issue-number> '{"version":1,"step":7,"step_label":"Smoke Test Loop","phase":"verify","active_skills":["ref-memory-management","ref-pr-workflow"]}'
  ```
- Reset iteration counter to 1. Proceed to Phase 2.

## Phase 2: Smoke Tests (Step 7)

### Execute

Same as Phase 1 Execute — run in a background Task with `dangerouslyDisableSandbox: true`:
```bash
sleep 240 && gh run watch -i 30 --exit-status <run-id>
```

### Evaluate

- All pass → go to Terminate
- Smoke test failures → go to Iterate
- Deploy failures → set status to `"needs_user"`, go to Return

### Progress Report

- `mkdir -p tmp`
- Write evaluation to `tmp/smoke-eval-<N>.txt`
- Post combined comment:
  ```bash
  .claude/skills/ref-pr-workflow/scripts/post-pr-comment.sh <pr-num> <output_file> tmp/smoke-eval-<N>.txt
  ```
- Write checkpoint:
  ```bash
  echo '{"iteration":<N>,"outcome":"<iterate|terminate>","last_eval_file":"tmp/smoke-eval-<N>.txt"}' \
    > tmp/smoke-subagent-state.json
  ```

### Iterate

Fix failures. Commit and push. Increment counter. Return to Execute.
```bash
git add <files> && git commit -m "..." && git push origin HEAD
```

### Terminate

- `mkdir -p tmp`
- Write final summary to `tmp/smoke-final.txt`:
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
  .claude/skills/ref-pr-workflow/scripts/post-pr-comment.sh <pr-num> tmp/smoke-final.txt
  ```
- Update issue state to step=8/phase=qa:
  ```bash
  .claude/skills/ref-pr-workflow/scripts/issue-state-write <issue-number> '{"version":1,"step":8,"step_label":"QA Review Loop","phase":"qa","active_skills":["ref-memory-management","ref-pr-workflow","ref-qa"]}'
  ```
- Go to Return with status `"success"`.

## Return Contract

Final output message must be valid JSON:

```json
{
  "status": "success",
  "step_completed": 7,
  "iterations": {"acceptance": 2, "smoke": 1},
  "final_summary_file": "tmp/smoke-final.txt",
  "error": null
}
```

- `"success"`: Both phases completed
- `"failure"`: Unrecoverable error — include details in `error`
- `"needs_user"`: Infrastructure/deploy failure requiring user input
