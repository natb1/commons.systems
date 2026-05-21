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

1. **Merge `origin/main` first.** Before any CI failure is read or reproduced, merge
   current `main` into the working tree. `git fetch` and `git merge` run sandboxed —
   no `dangerouslyDisableSandbox` (see `.claude/rules/sandbox.md`):

   ```bash
   git fetch origin main
   git merge origin/main
   ```

   This is a **local merge, NOT `/commit-merge-push`**. Pushing a bare merge commit
   here would re-trigger CI and discard the concluded-failure state that routed
   `/dispatch` to the `verify` phase. The merge is pushed only when the fix step
   (Step 5) invokes `/implement-unit`, whose `/commit-merge-push` pushes the fix
   commit together with this merge. Diagnosing and fixing against current `main`
   avoids re-fixing a failure `main` already resolved.

   If the merge **conflicts**, surface the conflict to the user and **halt** —
   `/verify-pr` does not continue past a conflicted merge.

2. **Resolve the PR and read the accumulator.** Resolve the draft PR for the target.
   Read `tmp/verify-summary.md` if it exists — it holds the prior iterations' records.
   On the first verify pass the file does not yet exist; that is expected.

3. **Read the failed checks.** Run (use `dangerouslyDisableSandbox: true`):

   ```bash
   .claude/skills/dispatch/scripts/run-pr-checks-wait.sh <pr-num>
   ```

   The checks have already concluded — `/dispatch` only routes a PR here once CI is
   complete-and-failed — so this returns immediately with a per-check summary:
   name, conclusion, and a failure-log excerpt for each failing check.

4. **Reproduce locally.** Launch a `sonnet` subagent with the failing check name and
   failure excerpt. The subagent maps the check to a local reproduce command and runs
   it (use `dangerouslyDisableSandbox: true` when network or npm cache is needed):

   - Unit test check → `.claude/skills/dispatch/scripts/run-unit-tests.sh`
   - Lint check → `.claude/skills/dispatch/scripts/run-lint.sh`
   - Acceptance test check → `.claude/skills/dispatch/scripts/run-acceptance-tests.sh`
   - Type-check → `npx tsc --noEmit --project <pkg>`
   - Other → best-effort map from the failing workflow name

   The subagent returns `{ reproduced: bool, reproduce_command, failure_excerpt,
   why_not_caught, is_flake: bool }`. `why_not_caught` is a free-text diagnosis
   (missing test, disabled rule, skipped hook, env drift, flake, etc.) —
   human-readable context, not a structured branch key. `is_flake` is the
   **structured branch key**: the subagent sets it
   `true` only when it diagnoses the failure as a **flake** — a non-deterministic
   failure unrelated to the PR's own changes (a pre-existing flaky test, a
   CI-infrastructure hiccup, an upstream timing race). The flake branch below
   reads `is_flake`; it never string-matches `why_not_caught`.

   **If the failure does NOT reproduce** (`reproduced == false`), there are three
   mutually exclusive outcomes. `is_flake` is the discriminator: when
   `is_flake == true` the outcome is **Flake**; when `is_flake == false` it is
   **Main already fixed it** or **Generic no-repro**. Never push a speculative
   fix — an unverified fix is still never pushed.

   - **Generic no-repro** — `is_flake == false` and the failure simply does not
     reproduce, with no identified cause. Record it in the accumulator (Step 6),
     post the accumulator (Step 7), and stop. Push nothing.
   - **Main already fixed it** — `is_flake == false` and the `why_not_caught`
     diagnosis is that current `main` (merged in Step 1) already resolved the
     failure. Record it in the accumulator (Step 6), post the accumulator
     (Step 7), and then push the Step 1 merge **alone** — no fix — so CI re-runs
     against the merged state. What gets pushed is the already-completed,
     deterministic merge of `main`, not a fix. Without this push the stale failed
     CI keeps routing `/dispatch` back to the `verify` phase forever. Step 1's
     `git merge origin/main` is always a clean merge here — a conflict would have
     halted the skill back in Step 1 — and a clean `git merge` auto-creates the
     merge commit, so the merge commit already exists; just push it (`git push`
     runs sandboxed — see `.claude/rules/sandbox.md`):

     ```bash
     git push origin HEAD
     ```

   - **Flake** — `is_flake == true`: the failure is an upstream flaky test or a
     CI-infrastructure hiccup, unrelated to this PR's own changes. Re-running
     `/verify-pr` would only re-reach this same outcome, so instead file the flake
     as its own tracking issue and block the PR's tracked issue on it. Push
     nothing — there is no fix to this PR. Follow these sub-steps:

     1. **Compute a flake fingerprint.** Combine the failing check name with the
        most stable identifier in the failure excerpt — the test name, file path,
        or CI workflow name, whichever is most specific. This string is the dedupe
        key; it must identify the same flake across re-runs.
     2. **File the flake issue.** Launch a subagent (`subagent_type:
        general-purpose`, `model: sonnet`) that invokes `/file-issue` via the
        Skill tool. Build its `$INPUT` as a title hint on line 1 — a short
        imperative summary that encodes the fingerprint, e.g.
        `Flaky CI: <check> — <stable identifier>` — followed by a body containing
        the fingerprint, the reproduce command, and the failure excerpt.
        `/file-issue` runs duplicate detection, creates the issue (or matches an
        existing open one), assigns `@me`, applies `help wanted`, and prints
        `CREATED <N>` or `EXISTING <N>` on its own line. The subagent parses that
        line and returns `<N>` and the `CREATED`/`EXISTING` disposition to this
        thread.
     3. **Block the PR's tracked issue on the flake issue.** In this thread, read
        the PR body (`gh pr view <pr-num> --json body --jq .body`,
        `dangerouslyDisableSandbox: true`) and parse its `Closes #N` line(s) for
        the issue(s) this PR implements. For **each** tracked issue, record a
        `blocked_by` dependency **on that tracked issue, targeting the flake issue
        `<N>`** — the PR's own work is blocked by the unrelated flake. Note the
        direction: this is the **reverse** of `/review-fix` and `/simplify-fix`,
        which record `blocked_by` on the *new* issue; here the new flake issue is
        the *blocker* and the PR's existing tracked issue is the *blocked* one.
        Use the `ref-github-issues` dependencies API (database-ID resolution with
        `gh api`, `--input` JSON; see `ref-github-issues`, do not restate the
        syntax — all `gh` calls use `dangerouslyDisableSandbox: true`). Idempotent:
        first list the tracked issue's current `blocked_by`, and skip the POST if
        the flake issue is already present, so a re-run against the same
        fingerprint does not re-add the dependency or error.
     4. **Record a flake iteration in the accumulator** (the skill's top-level
        Step 6) — see [Accumulator](#accumulator); a flake entry is visually
        distinct from a generic no-repro one.
     5. **Post the accumulator (Step 7) and stop (Step 8). Push nothing** — the
        same terminal behavior as the generic no-repro outcome. On the next
        `/dispatch` run the PR's tracked issue carries a `blocked_by` against the
        flake issue; `/dispatch`'s queue scan skips blocked issues, so the PR is
        no longer re-routed to the `verify` phase. The flake issue stands on its
        own in the queue for independent triage.

5. **Fix the failure.** If reproduced, fix it by invoking `/implement-unit` via the
   Skill tool — pass `model` (chosen per `/implement-unit`'s heuristic), `scope` (the
   fix), `context` (the failing check and reproduce command), and `commit_intent`.
   `/implement-unit` builds the fix, commits, merges, and pushes it.

6. **Append a record to the accumulator.** Append one `## Iteration <n>` section to
   `tmp/verify-summary.md` (see [Accumulator](#accumulator)).

7. **Post the accumulator as a PR comment** (use `dangerouslyDisableSandbox: true`):

   ```bash
   .claude/skills/dispatch/scripts/post-pr-comment.sh <pr-num> tmp/verify-summary.md
   ```

8. **Stop.** `/loop /dispatch` drives the next iteration — the next `/dispatch` run
   re-derives the phase from CI ground truth and re-invokes `/verify-pr` if checks
   still fail.

## Accumulator

`tmp/verify-summary.md` is the only cross-iteration memory for the verify phase.

- **First write** — create the file with a header (e.g. `# Verify summary — PR #<n>`).
- **Every invocation** — append a `## Iteration <n>` section containing:
  - **Failed checks** — the check names CI reported failing.
  - **Outcome** — one of `fixed`, `generic-no-repro`, `main-fixed`, or `flake`.
    This field is what makes a flake iteration visually distinct from a generic
    no-repro one.
  - **Reproduced** — `yes` or `no`.
  - **Reproduce command** — the command the subagent ran.
  - **Failure excerpt** — a short excerpt of the failure log.
  - **Why not caught** — the `why_not_caught` diagnosis.
  - **Fix** — the fix applied and its commit SHA. Include only when **Outcome**
    is `fixed`; omit otherwise.
  - **Flake issue** — *`flake` outcome only* — the tracking issue filed via
    `/file-issue`, written as `#<N> (CREATED)` or `#<N> (EXISTING)`. Omit for
    every other outcome.
  - **Fingerprint** — *`flake` outcome only* — the dedupe key computed in the
    Flake sub-path (the failing check name plus the stable identifier). Omit for
    every other outcome.

`tmp/` is git-ignored, so the accumulator never enters a commit; it persists for the
worktree's life.
