---
name: dispatch-implement
description: Dispatcher-driven implementation phase — plan, implement, commit, signal completion
---

# Dispatch: Implementation Phase

Invoked by `./dispatch/bin/dispatch <issue-num>` as the opening message. The dispatcher launched Claude with `claude -w <branch>`, so the WorktreeCreate hook has already placed the session in the correct worktree and written `CLAUDE.local.md` with full issue context (primary + blockers + sub-issues + parent + siblings). `DISPATCH_ISSUE_NUM` and `DISPATCH_STATE_FILE` (relative path `tmp/dispatch-<num>.json`) are exported.

**The main thread never edits files.** It plans, delegates implementation to subagents via the Agent tool, and forks `/commit-merge-push` after each unit. Every code change happens in a subagent.

## Steps

1. **Plan.** Invoke `EnterPlanMode` and produce a plan whose implementation section is an ordered list of **logical units of work**. Each unit specifies:

   1. **Scope.** What files/behavior change, what is explicitly out of scope.
   2. **Implementation model.** `opus` or `sonnet`, chosen per the heuristic below.
   3. **Dependencies.** Any prior units that must complete first (so order is explicit).

   Each unit becomes one commit. User reviews and approves.

   **Model-selection heuristic:**
   - **`sonnet`** for well-specified, mechanical work: small refactors with a clear diff shape, rote wiring (adding a script to a hook, renaming across files, boilerplate additions), unit-test writing with explicit cases.
   - **`opus`** for judgment-heavy work: cross-cutting design changes, tricky concurrency / ordering, unfamiliar subsystems, units where the plan itself leaves decisions for implementation time.
   - If unsure, pick `opus`. The cost delta matters less than a bad implementation.

2. **For each approved unit, in order:**

   a. **Launch an implementation subagent** via the Agent tool using the plan-specified `model` (`opus` or `sonnet`). Prompt includes the full plan context, this unit's scope, and the explicit constraint: *the subagent must edit the working tree only — no commits, no pushes.*

   b. **Invoke `/commit-merge-push`** via the Agent tool (fork subagent; its frontmatter sets `model: sonnet`, so do not pass a model override). If it returns an error:
      - **Conflict** → launch another implementation subagent with the opus model to resolve, then re-invoke `/commit-merge-push`.
      - **Pre-commit hook failure** → launch another implementation subagent with the sonnet model to fix the underlying issue (do not `--amend`; create a new commit), then re-invoke `/commit-merge-push`.
      - **Push rejection** (non-fast-forward, server hook) → surface to user; do not force-push.

3. Run `./dispatch/bin/phase-complete` with `dangerouslyDisableSandbox: true` — the script calls `issue-state-write` which uses tsx and requires network access for Firestore. The dispatcher SIGTERMs this session shortly after.

4. Stop.

## Requirement changes mid-session

If the user revises a requirement during this session, invoke `/new-requirement` — it clarifies, updates remote issues, re-syncs `CLAUDE.local.md`, and revises this plan. Do not handle re-sync inline.
