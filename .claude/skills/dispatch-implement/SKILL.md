---
name: dispatch-implement
description: Dispatcher-driven implementation phase — plan, implement, commit, signal completion
---

# Dispatch: Implementation Phase

Invoked by `./dispatch/bin/dispatch <issue-num>` as the opening message. The dispatcher launched Claude with `claude -w <branch>`, so the WorktreeCreate hook has already placed the session in the correct worktree and written `CLAUDE.local.md` with full issue context (primary + blockers + sub-issues + parent + siblings). `DISPATCH_ISSUE_NUM` and `DISPATCH_STATE_FILE` (relative path `tmp/dispatch-<num>.json`) are exported.

**The main thread never edits files.** It plans, delegates implementation to subagents via the Agent tool, and forks `/commit-merge-push` after each unit. Every code change happens in a subagent.

## Steps

1. **Plan.** Before entering plan mode, seed the dispatcher state file if it does not yet exist — this is what the `SessionStart:clear` hook (`.claude/hooks/restore-dispatch-skill.sh`) watches for when the user accepts a plan and clears the context:

   ```bash
   [ -f "$DISPATCH_STATE_FILE" ] || { mkdir -p "$(dirname "$DISPATCH_STATE_FILE")" && printf '{}' > "$DISPATCH_STATE_FILE"; }
   ```

   Then invoke `EnterPlanMode` and produce a plan whose implementation section is an ordered list of **logical units of work**. Each unit specifies:

   If an approved plan for this dispatch is already present in context (typical after `showClearContextOnPlanAccept` fires — the user accepted a plan and then cleared the context, causing this skill to be re-invoked), skip this step and proceed to Step 2. The plan file persists on disk across context clears, so the unit list remains visible even though the planning conversation is gone.

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

2.5. **Verify loop.** After all units are committed and pushed, enter the post-implementation verify loop. Each iteration re-checks CI; on failure, reproduce locally and fix before continuing. Exit the loop only when all PR checks pass.

   **2.5.1 — Ensure a draft PR exists.** On the first iteration only, create a draft PR (use `dangerouslyDisableSandbox: true` — `gh` needs network):

   ```
   gh pr create --draft --title "<short summary>" --body "$(cat <<'EOF'
   Closes #<primary-issue>
   Closes #<sub-issue-or-blocker>   # repeat for each implemented issue
   EOF
   )"
   ```

   Body follows the `Closes #N` pattern: one `Closes #N` line per issue (primary + any implemented sub-issues/blockers). Do NOT fork another skill. On subsequent iterations the PR already exists; skip this sub-step.

   **2.5.2 — Monitor PR checks.** Launch a **sonnet** subagent via the Agent tool. The subagent runs:

   ```
   .claude/skills/ref-pr-workflow/scripts/run-pr-checks-wait.sh <pr-num>
   ```

   with `dangerouslyDisableSandbox: true`. It returns a structured summary: per check — name, conclusion (pass/fail/skip), and for any failing check a short excerpt of the failure log.

   **2.5.3 — Dispatch on result.**

   - **All checks pass:**
     - Main thread assembles a summary of every prior-iteration failure and its "why not caught locally" diagnosis from in-session context.
     - Write the summary to `tmp/verify-summary.md`. If no failures occurred (clean first pass), write: `All PR checks passed on the first verify iteration — no failures to diagnose.`
     - Post via (use `dangerouslyDisableSandbox: true`):
       ```
       .claude/skills/ref-pr-workflow/scripts/post-pr-comment.sh <pr-num> tmp/verify-summary.md
       ```
     - Proceed to Step 3 (phase-complete). Exit the verify loop.

   - **One or more checks fail:** continue to 2.5.4.

   **2.5.4 — Reproduce locally.** Launch a **sonnet** subagent with the failing check name and failure excerpt. The subagent:
   - Maps the failing check to a local reproduce command:
     - Unit test check → `.claude/skills/ref-pr-workflow/scripts/run-unit-tests.sh`
     - Lint check → `.claude/skills/ref-pr-workflow/scripts/run-lint.sh`
     - Acceptance test check → `.claude/skills/ref-pr-workflow/scripts/run-acceptance-tests.sh`
     - Type-check → `npx tsc --noEmit --project <pkg>`
     - Other → best-effort map from the failing workflow name
   - Runs the command (use `dangerouslyDisableSandbox: true` when network or npm cache is needed).
   - Returns: `{ reproduced: bool, reproduce_command, failure_excerpt, why_not_caught }`. `why_not_caught` is a free-text diagnosis (missing test, disabled rule, skipped hook, env drift, flake, etc.).

   **No-repro branch:** if `reproduced == false`, main thread surfaces the no-repro result (check name, reproduce command attempted, hypothesis) to the user and **halts the verify loop**. Do NOT push a speculative fix.

   **Reproduced:** continue to 2.5.5.

   **2.5.5 — Fix and verify locally.** Main thread picks the fix-subagent model using the **same heuristic as Step 1**:
   - **`sonnet`** for mechanical fixes: lint errors, clear type errors, obvious test expectation updates.
   - **`opus`** for judgment-heavy fixes: logic bugs, cross-cutting breakage, unfamiliar subsystem.
   - If unsure, pick `opus`.

   Launch the fix subagent with the reproduce command and failure excerpt. The subagent:
   - Edits the working tree to fix the root cause.
   - Re-runs the reproduce command until it passes locally.
   - Must NOT commit or push.
   - Returns only after the local reproduction is green.

   If the subagent returns with a still-failing check, main thread launches another fix subagent.

   **2.5.6 — Commit, merge, push.** Main thread invokes `/commit-merge-push` via the Agent tool (fork subagent; its frontmatter sets `model: sonnet` — do not override). Error recovery mirrors existing Step 2:
   - **Merge conflict** → launch another implementation subagent (opus) to resolve, then re-invoke `/commit-merge-push`.
   - **Pre-commit hook failure** → launch another implementation subagent (sonnet) to fix (new commit — never `--amend`), then re-invoke `/commit-merge-push`.
   - **Push rejection** (non-fast-forward, server hook) → surface to user. Do not force-push.

   **2.5.7 — Loop back.** After a successful push, return to 2.5.2 (monitor checks). Do NOT re-enter the per-unit implementation loop from Step 2.

   > **Iteration history** is retained in the main thread's conversation context — no external file is needed beyond `tmp/verify-summary.md`. Step 2.5.3's all-pass summary reads the per-iteration failure records (check name, reproduce command, failure excerpt, why_not_caught, fix commit) directly from this context.

3. Run `./dispatch/bin/phase-complete` with `dangerouslyDisableSandbox: true` — the script calls `issue-state-write` which uses tsx and requires network access for Firestore. The dispatcher SIGTERMs this session shortly after.

4. Stop.

## Requirement changes mid-session

If the user revises a requirement during this session, invoke `/new-requirement` — it clarifies, updates remote issues, re-syncs `CLAUDE.local.md`, and revises this plan. Do not handle re-sync inline.
