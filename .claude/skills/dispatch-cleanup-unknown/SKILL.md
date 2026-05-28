---
name: dispatch-cleanup-unknown
description: Handle a `cleanup-unknown` outcome from `dispatch-select-target` — confirms with the user, then re-invokes the selector with `--cleanup-confirm` or `--no-sweep`, and returns its resumed output for caller routing.
---

# Dispatch: Cleanup Unknown Worktree

Invoked by `/dispatch-propagate` Step 3 when `dispatch-select-target` reports
`cleanup-unknown <path>` — the sweep found a worktree with no open PR and
no inferable issue number. **This is the only sweep path that can destroy
potentially-unmerged code.**

Takes `<path>` as its single argument.

This skill does **not** stop the dispatch tick. After it returns, `/dispatch-propagate`
routes on the resumed `dispatch-select-target` output this skill returns. It
must **not** release the dispatch lock — the caller still holds it across
Step 3's remaining sub-steps.

Run `dispatch-select-target` invocations with `dangerouslyDisableSandbox:
true` — see `.claude/rules/sandbox.md`.

## 1. Ask the user

Use `AskUserQuestion` to ask whether to delete `<path>` — its history is
only local.

## 2. On Yes — re-run with `--cleanup-confirm`

Run `dispatch-select-target --cleanup-confirm <path>`. The script performs
the destructive cleanup of `<path>` and resumes selection in the same call,
printing one fresh state-token line:

```bash
.claude/skills/dispatch-propagate/scripts/dispatch-select-target --cleanup-confirm <path>
```

Return the printed line to the caller; `/dispatch-propagate` Step 3 treats it as a
fresh `$SELECTED` and routes on it. If a second unknown orphan exists, the
script halts again with `cleanup-unknown <path2>` — the caller re-invokes
this skill with the new path to confirm.

## 3. On No — re-run with `--no-sweep`

Run `dispatch-select-target --no-sweep`. The flag bypasses the sweep so the
next selection doesn't immediately re-halt on the same unknown orphan:

```bash
.claude/skills/dispatch-propagate/scripts/dispatch-select-target --no-sweep
```

Return the printed line to the caller; `/dispatch-propagate` Step 3 treats it as a
fresh `$SELECTED` and routes on it.
