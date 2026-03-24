---
name: ref-unit-test
description: Forked unit test loop — runs Step 4 in isolated context
context: fork
---

# Unit Test Loop (Forked)

Self-contained wiggum-loop for Step 4. Runs in isolated context — cannot invoke other skills.

## Sandbox

Use `dangerouslyDisableSandbox: true` for git write operations (`git add`, `git commit`, `git merge`, `git push`) and all `gh` CLI calls (`.claude/skills/ref-pr-workflow/scripts/issue-state-write`, `.claude/skills/ref-pr-workflow/scripts/post-pr-comment.sh`).

## Running Tests

Use the pre-approved script from the repo root (do not use `$()` substitution — it breaks permission matching):

```bash
.claude/skills/ref-pr-workflow/scripts/run-unit-tests.sh            # auto-detect changed apps
.claude/skills/ref-pr-workflow/scripts/run-unit-tests.sh --app router --app budget  # explicit apps
```

Requires `dangerouslyDisableSandbox: true` (runs `npm ci` + `npx`).

## Loop Mechanics

Iteration counter starts at 1. Each cycle:

### Execute

- Merge `origin/main`:
  ```bash
  git fetch origin main && git merge origin/main
  ```
- Run unit tests and linting

### Evaluate

- All pass → go to Terminate
- Failures → go to Iterate

### Progress Report

- `mkdir -p tmp`
- Write evaluation to `tmp/unit-eval-<N>.txt`
- Write checkpoint:
  ```bash
  echo '{"iteration":<N>,"outcome":"<iterate|terminate>","last_eval_file":"tmp/unit-eval-<N>.txt"}' \
    > tmp/unit-subagent-state.json
  ```

### Iterate

Fix failures. Commit fixes (dangerouslyDisableSandbox). Increment iteration counter. Return to Execute.

### Terminate

- Update issue state to step=5/phase=core:
  ```bash
  .claude/skills/ref-pr-workflow/scripts/issue-state-write <issue-number> '{"version":1,"step":5,"step_label":"PR Creation","phase":"core","active_skills":["ref-memory-management","ref-pr-workflow","ref-create-pr"]}'
  ```
- Write final checkpoint:
  ```bash
  echo '{"iteration":<N>,"outcome":"terminate","last_eval_file":"tmp/unit-eval-<N>.txt"}' \
    > tmp/unit-subagent-state.json
  ```

## Return Contract

Final output message must be valid JSON:

```json
{
  "status": "success",
  "step_completed": 4,
  "iterations": 3,
  "final_summary_file": null,
  "error": null
}
```

- `"success"`: Loop completed, all tests pass
- `"failure"`: Unrecoverable error — include details in `error`
- `"needs_user"`: Unexpected situation requiring user input
