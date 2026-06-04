---
name: verify-pr
description: Verify phase — single pass that reproduces and fixes one set of failed CI checks on a draft PR
---

# Verify PR

The `verify` phase of the issue workflow, dispatched by `/dispatch-propagate` only when a
draft PR has **completed-and-failed** CI. This skill is **single-pass — it has no
internal loop**. It fixes one round of failed checks, records the outcome, posts it,
and stops. The `/dispatch-propagate` background-job chain drives iteration: each subsequent
failure is a fresh `/dispatch-propagate` → `/verify-pr` invocation.

This skill runs in the **caller's thread** — it has no `context:` key — so it can
launch subagents and invoke `/implement-unit`.

Cross-iteration memory lives entirely in `tmp/verify-summary.md` (see
[Accumulator](#accumulator) below), not in conversation context.

## Steps

1. **Increment the verify-attempt counter.** Resolve the draft PR for the target.
   Read the PR's labels and find the highest extant `dispatch:verify-attempt-<n>` label
   (`dangerouslyDisableSandbox: true` — `gh`):

   ```bash
   PR_NUM=$(.claude/skills/dispatch-propagate/scripts/dispatch-find-pr <issue-N>)
   N=$(gh pr view "$PR_NUM" --json labels \
     --jq '[.labels[].name | capture("^dispatch:verify-attempt-(?<n>[0-9]+)$").n | tonumber] | max // 0')
   NEXT=$(( N < 3 ? N + 1 : 3 ))
   ```

   The cap at 3 means a fourth entry still leaves the label at `dispatch:verify-attempt-3`.
   Step 4 of `/dispatch-worker` reads this counter: when the re-derived phase is still
   `verify` and the counter is `>= 3`, it escalates to `dispatch:office-hours` instead
   of self-closing.

   Remove the prior label if one exists, then apply the new one. Use the apply-first /
   create-on-"not found" idiom — the label may not exist yet on a fresh repo
   (`dangerouslyDisableSandbox: true` on all `gh` calls):

   ```bash
   # Remove the previous counter label (skip if N=0 — none existed)
   if [[ "$N" -gt 0 ]]; then
     gh pr edit "$PR_NUM" --remove-label "dispatch:verify-attempt-$N"
   fi

   # Apply the new label; create it if missing, then retry
   if ! gh pr edit "$PR_NUM" --add-label "dispatch:verify-attempt-$NEXT" 2>/dev/null; then
     gh label create "dispatch:verify-attempt-$NEXT" \
       --description "dispatch workflow: verify-pr attempt $NEXT of 3"
     gh pr edit "$PR_NUM" --add-label "dispatch:verify-attempt-$NEXT"
   fi
   ```

   Pass no `--color` — same convention as `dispatch:office-hours` (no colour metadata
   here; label colour is owned by the canonical definition, not the writer).

   Note: `dispatch-complete-phase` is not the right vehicle for this label — it handles
   only the two canonical phase-complete labels (`dispatch:qa-done`, `dispatch:reviewed`).
   The verify-attempt label is local to `/verify-pr`.

   The PR number resolved here is also used in Steps 3, 4 (the Flake sub-path's
   `gh pr view <pr-num>` body read), and 7 — carry it forward.

2. **Read the accumulator.** Read `tmp/verify-summary.md` if it exists — it holds the
   prior iterations' records. On the first verify pass the file does not yet exist;
   that is expected.

3. **Read the failed checks.** Run (use `dangerouslyDisableSandbox: true`):

   ```bash
   .claude/skills/dispatch-propagate/scripts/run-pr-checks-wait.sh <pr-num>
   ```

   The checks have already concluded — `/dispatch-propagate` only routes a PR here once CI is
   complete-and-failed — so this returns immediately with a per-check summary:
   name, conclusion, and a failure-log excerpt for each failing check.

4. **Reproduce locally.** Launch a `sonnet` subagent with the failing check name and
   failure excerpt. The subagent maps the check to a local reproduce command and runs
   it (use `dangerouslyDisableSandbox: true` when network or npm cache is needed):

   - Unit test check → `.claude/skills/dispatch-propagate/scripts/run-unit-tests.sh`
   - Lint check → `.claude/skills/dispatch-propagate/scripts/run-lint.sh`
   - Acceptance test check → `.claude/skills/dispatch-propagate/scripts/run-acceptance-tests.sh`
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
     diagnosis is that `origin/main` (merged into this worktree by the router
     before spawning this worker) already resolved the failure. Record it in the
     accumulator (Step 6), post the accumulator (Step 7), and then push that
     merge commit **alone** — no fix — so CI re-runs against the merged state.
     What gets pushed is the already-completed, deterministic merge of `main`,
     not a fix. Without this push the stale failed CI keeps routing
     `/dispatch-propagate` back to the `verify` phase forever. The router's
     pre-spawn `dispatch-merge-main` always produces a clean merge — a conflict
     would have aborted the spawn — so the merge commit already exists locally;
     just push it (`git push` runs sandboxed — see `.claude/rules/sandbox.md`):

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
        direction: this is the **reverse** of `/review-fix`,
        which records `blocked_by` on the *new* issue; here the new flake issue is
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
        `/dispatch-propagate` run the PR's tracked issue carries a `blocked_by` against the
        flake issue; `/dispatch-propagate`'s queue scan skips blocked issues, so the PR is
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
   .claude/skills/dispatch-propagate/scripts/post-pr-comment.sh <pr-num> tmp/verify-summary.md
   ```

8. **Write the phase-completed marker, then stop.** The Stop hook
   (`.claude/hooks/dispatch-stop.sh`) reads this to decide propagate vs park.
   Atomic via tempfile + mv. `CLAUDE_JOB_DIR` unset = interactive run; skip.

   ```bash
   if [[ -n "${CLAUDE_JOB_DIR:-}" && -d "$CLAUDE_JOB_DIR" ]]; then
     printf 'phase=verify\npr=%s\n' "$PR_NUM" \
       > "$CLAUDE_JOB_DIR/phase-completed.tmp"
     mv "$CLAUDE_JOB_DIR/phase-completed.tmp" \
        "$CLAUDE_JOB_DIR/phase-completed"
   fi
   ```

   Then **stop**. The `/dispatch-propagate` background-job chain drives the
   next iteration — the next `/dispatch-propagate` job re-derives the phase
   from CI ground truth and re-invokes `/verify-pr` if checks still fail.

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
