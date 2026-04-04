---
name: ref-pr-check
description: Forked verify loop with CI monitoring — runs Steps 6, 7, and 11 in isolated context
context: fork
---

# Verify Loop (Forked)

Self-contained wiggum-loop for Steps 6 (acceptance), 7 (smoke), and 11 (final verify). Runs in isolated context — cannot invoke other skills.

On load, read issue state via `.claude/skills/ref-pr-workflow/scripts/issue-state-read` to determine entry point:
- step=6 → start at Phase 1 (acceptance)
- step=7 → start at Phase 2 (smoke)
- step=11 → start at Phase 3 (final verify)

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

## Phase 3: Final Verify (Step 11)

Monitor the latest CI run triggered by code quality/security fixes. No new push — just watch.

Iteration counter starts at 1.

### Execute

Run in a background Task (`run_in_background: true`). Use `dangerouslyDisableSandbox: true`. Find and monitor the latest CI run:
```bash
gh run watch -i 30 --exit-status $(gh run list --branch $(git rev-parse --abbrev-ref HEAD) --limit 1 --json databaseId --jq '.[0].databaseId')
```

### Evaluate

- All pass → go to Terminate
- Test failures → go to Iterate
- Infrastructure failures → set status to `"needs_user"`, go to Return

### Progress Report

- `mkdir -p tmp`
- Write evaluation to `tmp/final-verify-eval-<N>.txt`
- Post combined comment:
  ```bash
  .claude/skills/ref-pr-workflow/scripts/post-pr-comment.sh <pr-num> <output_file> tmp/final-verify-eval-<N>.txt
  ```
- Write checkpoint:
  ```bash
  echo '{"iteration":<N>,"outcome":"<iterate|terminate>","last_eval_file":"tmp/final-verify-eval-<N>.txt"}' \
    > tmp/final-verify-subagent-state.json
  ```

### Iterate

Fix failures. Commit and push. Increment counter. Return to Execute.
```bash
git add <files> && git commit -m "..." && git push origin HEAD
```

### Terminate

- `mkdir -p tmp`
- Write final summary to `tmp/final-verify-final.txt`:
  ```
  # Final PR Check Verification - Complete ✓

  **Date**: [Current date]
  **Branch**: [branch name]

  ## Iterations

  [For each iteration:]
  - Iteration 1: [Failures] → [Fixes] (commits: [hashes])
  ...
  - Final iteration: All checks passed

  ## Conclusion

  All CI checks passed after code quality and security fixes. Proceeding to completion.
  ```
- Post:
  ```bash
  .claude/skills/ref-pr-workflow/scripts/post-pr-comment.sh <pr-num> tmp/final-verify-final.txt
  ```
- Update issue state to step=12/phase=core:
  ```bash
  .claude/skills/ref-pr-workflow/scripts/issue-state-write <issue-number> '{"version":1,"step":12,"step_label":"Completion","phase":"core","active_skills":["ref-memory-management","ref-pr-workflow"]}'
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

- `"success"`: All phases completed (or single phase for step=11)
- `"failure"`: Unrecoverable error — include details in `error`
- `"needs_user"`: Infrastructure/deploy failure requiring user input
