---
name: dispatch-cleanup-unknown
description: Handle an orphaned worktree with no open PR and no inferable issue — asks the user whether to delete it, and on confirmation runs the sweep cleanup loop until the sweep exits 0.
---

# Dispatch: Cleanup Unknown Worktree

Invoked by `/dispatch` Step 3 when `dispatch-sweep` exits non-zero with
stderr `cleanup-unknown:<path>` — the sweep found a worktree with no open PR
and no inferable issue number. **This is the only sweep path that can destroy
potentially-unmerged code.**

Takes `<path>` as its single argument.

This skill does **not** stop the dispatch tick. After it returns, `/dispatch`
falls through to `dispatch-select-target`. It must **not** release the
dispatch lock — the caller still holds it across Step 3's remaining
sub-steps.

Run `dispatch-sweep` invocations with `dangerouslyDisableSandbox: true` —
see `.claude/rules/sandbox.md`.

## 1. Ask the user

Use `AskUserQuestion` to ask whether to delete `<path>` — its history is
only local.

## 2. On Yes — loop the sweep cleanup

Run `dispatch-sweep --cleanup-unknown <path>` then re-run the default
`dispatch-sweep`, looping until the default invocation exits 0:

```bash
.claude/skills/dispatch/scripts/dispatch-sweep --cleanup-unknown <path>
.claude/skills/dispatch/scripts/dispatch-sweep
```

Both invocations need `dangerouslyDisableSandbox: true`.

## 3. On No — return

Take no action and return. `/dispatch` falls through to
`dispatch-select-target`.
