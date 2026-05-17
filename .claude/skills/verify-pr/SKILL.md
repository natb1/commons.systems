---
name: verify-pr
description: Verify phase — single pass that reproduces and fixes one set of failed CI checks on a draft PR
---

# Verify PR

The `verify` phase of the issue workflow, dispatched by `/dispatch` only when a
draft PR has **completed-and-failed** CI. This skill is **single-pass — it has no
internal loop**. It fixes one round of failed checks, records the outcome, posts it,
and stops. `/loop /dispatch` drives iteration: each subsequent failure is a fresh
`/dispatch` → `/verify-pr` invocation.

This skill runs in the **caller's thread** — it has no `context:` key — so it can
launch subagents and invoke `/implement-unit`.

Cross-iteration memory lives entirely in `tmp/verify-summary.md` (see
[Accumulator](#accumulator) below), not in conversation context.

## Steps

1. **Resolve the PR and read the accumulator.** Resolve the draft PR for the target.
   Read `tmp/verify-summary.md` if it exists — it holds the prior iterations' records.
   On the first verify pass the file does not yet exist; that is expected.

2. **Read the failed checks.** Run (use `dangerouslyDisableSandbox: true`):

   ```bash
   .claude/skills/ref-pr-workflow/scripts/run-pr-checks-wait.sh <pr-num>
   ```

   The checks have already concluded — `/dispatch` only routes a PR here once CI is
   complete-and-failed — so this returns immediately with a per-check summary:
   name, conclusion, and a failure-log excerpt for each failing check.

3. **Reproduce locally.** Launch a `sonnet` subagent with the failing check name and
   failure excerpt. The subagent maps the check to a local reproduce command and runs
   it (use `dangerouslyDisableSandbox: true` when network or npm cache is needed):

   - Unit test check → `.claude/skills/ref-pr-workflow/scripts/run-unit-tests.sh`
   - Lint check → `.claude/skills/ref-pr-workflow/scripts/run-lint.sh`
   - Acceptance test check → `.claude/skills/ref-pr-workflow/scripts/run-acceptance-tests.sh`
   - Type-check → `npx tsc --noEmit --project <pkg>`
   - Other → best-effort map from the failing workflow name

   The subagent returns `{ reproduced: bool, reproduce_command, failure_excerpt,
   why_not_caught }`. `why_not_caught` is a free-text diagnosis (missing test,
   disabled rule, skipped hook, env drift, flake, etc.).

   **If the failure does NOT reproduce** (`reproduced == false`): record it in the
   accumulator (Step 5), post the accumulator (Step 6), and stop. Do **not** push a
   speculative fix.

4. **Fix the failure.** If reproduced, fix it by invoking `/implement-unit` via the
   Skill tool — pass `model` (chosen per `/implement-unit`'s heuristic), `scope` (the
   fix), `context` (the failing check and reproduce command), and `commit_intent`.
   `/implement-unit` builds the fix, commits, merges, and pushes it.

5. **Append a record to the accumulator.** Append one `## Iteration <n>` section to
   `tmp/verify-summary.md` (see [Accumulator](#accumulator)).

6. **Post the accumulator as a PR comment** (use `dangerouslyDisableSandbox: true`):

   ```bash
   .claude/skills/ref-pr-workflow/scripts/post-pr-comment.sh <pr-num> tmp/verify-summary.md
   ```

7. **Stop.** `/loop /dispatch` drives the next iteration — the next `/dispatch` run
   re-derives the phase from CI ground truth and re-invokes `/verify-pr` if checks
   still fail.

## Accumulator

`tmp/verify-summary.md` is the only cross-iteration memory for the verify phase.

- **First write** — create the file with a header (e.g. `# Verify summary — PR #<n>`).
- **Every invocation** — append a `## Iteration <n>` section containing:
  - **Failed checks** — the check names CI reported failing.
  - **Reproduced** — `yes` or `no`.
  - **Reproduce command** — the command the subagent ran.
  - **Failure excerpt** — a short excerpt of the failure log.
  - **Why not caught** — the `why_not_caught` diagnosis.
  - **Fix** — the fix applied and its commit SHA (omit for a no-repro iteration).

`tmp/` is git-ignored, so the accumulator never enters a commit; it persists for the
worktree's life.
