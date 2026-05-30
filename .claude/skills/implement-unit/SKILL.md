---
name: implement-unit
description: Implement one planned unit of work in a subagent, then commit, merge, and push it with error recovery
---

# Implement Unit

Shared procedure for building **one** logical unit of work: launch an
implementation subagent constrained to working-tree edits, then fork
`/commit-merge-push` to land the commit. Handles merge-conflict, pre-commit-hook,
and push-rejection recovery.

This skill runs in the **caller's thread** — it has no `context:` key — so it can
launch subagents via the Agent tool and fork `/commit-merge-push`. Callers (e.g.
`/plan-implement`, `/verify-pr`) invoke it once per unit.

This skill is the **single canonical home** of the model-selection heuristic. Other
skills choosing a model reference this section rather than restating it.

## Parameters

The caller supplies:

| Parameter | Meaning |
|---|---|
| `model` | `opus` or `sonnet` — chosen per the heuristic below. |
| `scope` | What files/behavior this unit changes, and what is explicitly out of scope. |
| `context` | The surrounding plan / issue context the subagent needs to do the work. |
| `commit_intent` | The "why" of the change, so `/commit-merge-push` can write a focused commit message. |

## Model-selection heuristic

- **`sonnet`** for well-specified, mechanical work: small refactors with a clear diff
  shape, rote wiring (adding a script to a hook, renaming across files, boilerplate
  additions), unit-test writing with explicit cases.
- **`opus`** for judgment-heavy work: cross-cutting design changes, tricky concurrency
  / ordering, unfamiliar subsystems, units where the plan itself leaves decisions for
  implementation time.
- If unsure, pick `opus`. The cost delta matters less than a bad implementation.

## Steps

1. **Launch an implementation subagent** via the Agent tool using the caller-supplied
   `model`. The prompt includes `context` and `scope`, plus the explicit constraint:
   *the subagent edits the working tree only — no commits, no pushes.*

2. **Fork `/commit-merge-push`** via the Agent tool to commit, merge `origin/main`,
   and push. Its frontmatter sets `model: sonnet`, so do not pass a model override.
   Pass `commit_intent` so it can write a focused commit message.

3. **On a `/commit-merge-push` error, recover:**
   - **Merge conflict** → launch an `opus` subagent to resolve the conflict in the
     working tree. It ends its reply with exactly one of two verdicts (judgment
     criteria stay informal — the subagent's own call given full context, matching
     `dispatch-propagate/SKILL.md` §2a):
     - **`resolved`** (markers removed, files saved, clean tree) → re-fork
       `/commit-merge-push`.
     - **`ambiguous <reason>`** (the subagent made **no** edits; `<reason>` is a
       one-line explanation) → write `<reason>` to
       `$CLAUDE_JOB_DIR/office-hours-reason` (atomic, under the `CLAUDE_JOB_DIR`
       guard), **skip** the caller's `phase-completed` marker, and **stop**. The
       Stop hook (`dispatch-stop.sh`, Branch A) reads the marker-absence, applies
       `dispatch:office-hours` to the issue, and surfaces `<reason>` in the
       why-comment — so do **not** call `gh` / `dispatch-apply-office-hours` here.

       ```bash
       if [[ -n "${CLAUDE_JOB_DIR:-}" && -d "$CLAUDE_JOB_DIR" ]]; then
         printf '%s\n' "<reason>" > "$CLAUDE_JOB_DIR/office-hours-reason.tmp"
         mv "$CLAUDE_JOB_DIR/office-hours-reason.tmp" "$CLAUDE_JOB_DIR/office-hours-reason"
       fi
       ```
   - **Pre-commit hook failure** → launch a `sonnet` subagent to fix the underlying
     issue with a **new commit — never `--amend`** — then re-fork `/commit-merge-push`.
   - **Push rejection** (non-fast-forward, server hook) → surface to the user. Do
     **not** force-push.

4. **Return** once the unit is committed, merged, and pushed.
