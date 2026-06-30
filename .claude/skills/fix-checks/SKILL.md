---
name: fix-checks
description: Fix-checks phase — single pass that reproduces and fixes one set of failed CI checks on a draft PR
---

# Fix Checks

The `fix-checks` phase of the issue workflow, dispatched by `/dispatch-propagate` only when a
draft PR has **completed-and-failed** CI. This skill is **single-pass — it has no
internal loop**. It fixes one round of failed checks, records the outcome, posts it,
and stops. The `/dispatch-propagate` background-job chain drives iteration: each subsequent
failure is a fresh `/dispatch-propagate` → `/fix-checks` invocation.

This skill runs in the **caller's thread** — it has no `context:` key — so it can
launch subagents and invoke `/implement-unit`.

Cross-iteration memory lives entirely in `tmp/fix-checks-summary.md` (see
[Accumulator](#accumulator) below), not in conversation context.

## Steps

1. **Resolve the draft PR.** Run the context pack (`dangerouslyDisableSandbox:
   true` — calls `gh`):

   ```bash
   .claude/skills/dispatch-propagate/scripts/dispatch-context-pack <issue-N> --pr
   ```

   This single call resolves the PR and captures its labels and body. From the
   `=== PR ===` section: read `PR_NUM` from the `PR #<num>` line (or, if it
   prints `PR: none`, fix-checks was dispatched without a PR — a router state
   error — so call `dispatch-mark-deviation '/fix-checks: dispatched without a PR
   — router state error'` and stop). The **labels** line and **body** captured
   here are reused in later steps — Step 4's Flake sub-path reads the PR body for
   the `Closes #N` parse, and Step 5's attempt-counter computation reads the labels
   line — so they need not be re-fetched from GitHub. The `PR_NUM` resolved here is
   used in Steps 3, 5 (the fix-checks-attempt label edit), and 8 — carry it
   forward.

2. **Read the accumulator.** Read `tmp/fix-checks-summary.md` if it exists — it holds the
   prior iterations' records. On the first fix-checks pass the file does not yet exist;
   that is expected.

3. **Read the failed checks.** Run (use `dangerouslyDisableSandbox: true`):

   ```bash
   .claude/skills/dispatch-propagate/scripts/run-pr-checks-wait.sh <pr-num>
   ```

   The checks have already concluded — `/dispatch-propagate` only routes a PR here once CI is
   complete-and-failed — so this returns immediately with a per-check summary:
   name, conclusion, and a failure-log excerpt for each failing check.

4. **Reproduce locally and classify.** Launch a `sonnet` subagent with the failing
   check name and failure excerpt. The subagent maps the check to a local reproduce
   command and runs it (use `dangerouslyDisableSandbox: true` when network or npm
   cache is needed):

   - Unit test check → `.claude/skills/dispatch-propagate/scripts/run-unit-tests.sh`
   - Lint check → `.claude/skills/dispatch-propagate/scripts/run-lint.sh`
   - Acceptance test check → `.claude/skills/dispatch-propagate/scripts/run-acceptance-tests.sh`
   - Type-check → `npx tsc --noEmit --project <pkg>`
   - Other → best-effort map from the failing workflow name

   Before running a **bare** `npx tsc` / `npm run build` reproduce command (the type-check path or any *Other* path that resolves to a bare workspace build rather than a `run-*.sh` wrapper), `Read .claude/docs/build.md` for the workspace-build conventions: `npm ci` at the workspace root (never `npm install --prefix <pkg>`, which fails E404 on `@commons-systems/*`), and the `This is not the tsc command you are looking for` stub symptom that means deps were not installed. The `run-*.sh` wrapper paths are already `ensure_deps`-protected and need no read.

   The subagent returns `{ reproduced: bool, reproduce_command, failure_excerpt,
   why_not_caught, is_flake: bool, needs_human: bool, required_action: string }`.
   `why_not_caught` is a free-text diagnosis (missing test, disabled rule, skipped
   hook, env drift, flake, etc.) — human-readable context, not a structured branch
   key. `is_flake` and `needs_human` are the **structured branch keys** — never
   string-matched from `why_not_caught`:

   - `is_flake` is set `true` only when the subagent diagnoses the failure as a
     **flake** — a non-deterministic failure unrelated to the PR's own changes (a
     pre-existing flaky test, a CI-infrastructure hiccup, an upstream timing race).
   - `needs_human` is set `true` only when the subagent diagnoses a **real failure
     unfixable in code** — a deploy/infra/permissions error where no code change
     resolves it (secret/IAM/SA; canonical case a deploy-time GCP Secret Manager
     403 on a renamed secret). `required_action` then names what an owner must do
     (provision the secret, grant the deploy SA access, etc.).

   The branch logic reads these structured keys; it never string-matches
   `why_not_caught`.

   **If the failure does NOT reproduce** (`reproduced == false`), there are four
   mutually exclusive outcomes, in this precedence: `needs_human` → `is_flake` →
   **Main already fixed it** → **Generic no-repro**. Never push a speculative fix —
   an unverified fix is still never pushed.

   - **Needs human / infra** — `needs_human == true`: the failure is real but cannot
     be fixed in code (a deploy/infra/permissions blocker — e.g. a GCP Secret Manager
     403 on a renamed secret). This outcome is **terminal here** and **never touches
     the fix-checks-attempt counter** — retrying fix-checks is pointless, so a human must be
     reached on the **first** run. Push nothing. Do these inline and stop:

     1. **Append the accumulator record** with outcome `needs-human` and a **Required
        action** field naming `required_action` (see [Accumulator](#accumulator)).
     2. **Post the accumulator** — the same `post-pr-comment.sh` command as Step 8:

        ```bash
        .claude/skills/dispatch-propagate/scripts/post-pr-comment.sh <pr-num> tmp/fix-checks-summary.md
        ```

     3. **Write `office-hours-reason`** via `dispatch-mark-deviation`. This is a
        deliberate office-hours park: before the call, perform the in-session
        recommend step — see
        `.claude/skills/dispatch-propagate/escalation-recommend.md`.

        ```bash
        .claude/skills/dispatch-propagate/scripts/dispatch-mark-deviation \
          "/fix-checks: <required_action>"
        ```

     4. **Do NOT write the `phase=fix-checks` marker** (do not run Step 9).
     5. **Stop.** With the marker absent and `office-hours-reason` present, the Stop
        hook (`.claude/hooks/dispatch-stop.sh`) takes **Branch A** and parks the issue
        on `dispatch:office-hours` on the **first** fix-checks run — no fix-checks-attempt
        cycling, no re-diagnosis. This is the same skip-marker + `office-hours-reason`
        pattern the other phase skills use for a known human-required outcome.

     Every **other** outcome continues to Step 5.

   - **Generic no-repro** — `is_flake == false`, `needs_human == false`, and the
     failure simply does not reproduce, with no identified cause. Record it in the
     accumulator (Step 7), post the accumulator (Step 8), and stop. Push nothing.
   - **Main already fixed it** — `is_flake == false`, `needs_human == false`, and the
     `why_not_caught` diagnosis is that `origin/main` (merged into this worktree by
     the router before spawning this worker) already resolved the failure. Record it
     in the accumulator (Step 7), post the accumulator (Step 8), and then push that
     merge commit **alone** — no fix — so CI re-runs against the merged state.
     What gets pushed is the already-completed, deterministic merge of `main`,
     not a fix. Without this push the stale failed CI keeps routing
     `/dispatch-propagate` back to the `fix-checks` phase forever. The router's
     pre-spawn `dispatch-merge-main` always produces a clean merge — a conflict
     would have aborted the spawn — so the merge commit already exists locally;
     just push it (`git push` runs sandboxed — see `.claude/rules/sandbox.md`):

     ```bash
     git push origin HEAD
     ```

   - **Flake** — `is_flake == true`: the failure is an upstream flaky test or a
     CI-infrastructure hiccup, unrelated to this PR's own changes. Re-running
     `/fix-checks` would only re-reach this same outcome, so instead file the flake
     as its own tracking issue and block the PR's tracked issue on it. Push
     nothing — there is no fix to this PR. Follow these sub-steps:

     1. **Capture the failing run id.** The Step 3 checks output lists, for each
        check, a GitHub Actions run URL of the form
        `https://github.com/<owner>/<repo>/actions/runs/<id>` (optionally with a
        `/job/<job-id>` suffix). Parse the URL for the **failing** check and read
        the numeric `<id>` segment immediately after `/actions/runs/` into
        `RUN_ID` — that trailing all-digits run id, not any `/job/<job-id>` that
        may follow it. This is the run whose excerpt sub-step 2 fingerprints, and
        the run id the `dispatch-flake-dedup` guard needs for its CLOSED-path
        stale-head comparison (sub-step 3); without it the guard's closed-issue
        path hard-errors.
     2. **Compute a flake fingerprint (rigid precedence — deterministic across
        runs).** The fingerprint is `<failing-check-name> — <stable-id>`, where
        `<stable-id>` is chosen by this **fixed precedence** (use the first the
        failure excerpt provides):
        1. the **test node id** — e.g. `path/to/test.spec.ts:LINE:COL test title`;
        2. else the **file path:line**;
        3. else the **CI workflow name**.
        Read `<stable-id>` from the excerpt strictly by this precedence and
        **never paraphrase or summarize it** — the same flake must yield a
        byte-identical fingerprint string on every run, or dedup silently fails in
        production (no fixture test exercises the live fingerprint computation, so
        nothing catches a divergent string). This exact string is both (a) the
        dedup key passed to `dispatch-flake-dedup` and (b) the verbatim trailing
        token of the canonical tracking-issue title `Flaky CI: <fingerprint>`. Use
        the **same** fingerprint value for both — do not recompute it.
     3. **Find-or-file the flake issue (deterministic guard before
        `/file-issue`).** A same-fingerprint tracking issue may already exist —
        **open or closed**. Run the deterministic, state-spanning guard FIRST and
        only file fresh when it reports no match. This closes the old leak where a
        closed same-fingerprint issue read as "already resolved, so a recurrence is
        new information" and got re-filed as a duplicate. In this thread
        (`dangerouslyDisableSandbox: true` — the script calls `gh`):
        1. Write the recurrence body to `tmp/flake-recurrence.md` (git-ignored
           `tmp/`, like the accumulator): the fingerprint, the reproduce command,
           the failure excerpt, and a `recurred on PR #<pr> / run <url>` line.
        2. Run the guard, passing the fingerprint as the dedup key and the failing
           run's id captured in sub-step 1 (`$RUN_ID`):
           ```bash
           DISP=$(.claude/skills/dispatch-propagate/scripts/dispatch-flake-dedup \
             "<fingerprint>" --body-file tmp/flake-recurrence.md \
             --run-id "$RUN_ID")
           ```
           It prints exactly one line: `NONE`, `EXISTING <N>`, `REOPENED <N>`, or
           `STALE <N>`.
           Parse it into a disposition and (when present) the issue number `<N>`.
        3. Branch on the disposition:
           - **`EXISTING <N>`** — a same-fingerprint issue is already open and the
             guard appended this recurrence as a comment. Do **not** file. Flake
             issue = `#<N>`, disposition `EXISTING`.
           - **`REOPENED <N>`** — a same-fingerprint issue was closed-as-fixed but
             the flake fired again; the guard reopened it and appended this
             recurrence (the "closed-as-fixed but still firing" signal a human
             should see on one issue, not N dups). Do **not** file. Flake issue =
             `#<N>`, disposition `REOPENED`.
           - **`STALE <N>`** — a same-fingerprint issue was closed-as-fixed and
             the guard determined this triggering run's head does **not** contain
             the closing fix commit (ancestry shows `behind`/`diverged`): the PR
             branch is stale and is still emitting the pre-fix
             signature. The guard fired no comment and no reopen — suppressing the
             oscillation is the point. Do **not** file. Do **not** reopen. Flake
             issue = `#<N>`, disposition `STALE`. **Skip sub-step 4 (block the
             PR's tracked issue)** — wiring a `blocked_by` dependency here is
             deferred by design: the STALE disposition stops the reopen oscillation
             only; a stale PR branch that keeps emitting the pre-fix signature is
             the upstream subagent's "main already fixed it" classification job
             (merge main), tracked separately. Record the accumulator note (sub-step
             5) marking this recurrence as suppressed-stale, then fall through
             directly to sub-step 6 (post accumulator, push nothing).
           - **`NONE`** — no same-fingerprint issue exists; file one via
             `/file-issue` as before. Launch a subagent (`subagent_type:
             general-purpose`, `model: sonnet`) that invokes `/file-issue` via the
             Skill tool, building its `$INPUT` with a leading `--follow-up` token
             first, then a title hint `Flaky CI: <fingerprint>` on the next line,
             then a body containing the fingerprint, the reproduce command, and the
             failure excerpt. (The `--follow-up` token is a classification no-op
             here — a flake is a `bug`, which suppresses `enhancement` — but is
             passed for consistency.) `/file-issue` runs the full pipeline:
             duplicate detection, 8-category evaluation, decomposition gate,
             type/topic classification, creation (or match of an existing issue),
             `@me` assignment, `help wanted`, type label, and any matched topic
             label. It ends with a `===FILE-ISSUE-RESULTS===` …
             `===FILE-ISSUE-RESULTS-END===` block; the subagent reads the
             `<disposition> <N>` record (a flake is one topic, so normally one
             record) and returns `<N>` with its disposition. Then:
             - **`CREATED <N>`** — `/file-issue` created a fresh issue, but its
               title-improver (`/file-issue` Step 4) may have reworded the title
               and dropped the verbatim fingerprint — which would break a future
               run's match. **Reassert the canonical title** so the fingerprint is
               the literal trailing token regardless of the rewording
               (`dangerouslyDisableSandbox: true`):
               ```bash
               source .claude/skills/dispatch-propagate/scripts/lib.sh
               gh_issue_edit_rest <N> --title "Flaky CI: <fingerprint>"
               ```
               Flake issue = `#<N>`, disposition `CREATED`.
             - **`EXISTING <M>`** — `/file-issue`'s fuzzy dedup matched a
               pre-existing (possibly human-filed, differently-titled) issue. Do
               **NOT** reassert its title — re-titling an unrelated issue would
               corrupt it. Flake issue = `#<M>`, disposition `EXISTING`.
     4. **Block the PR's tracked issue on the flake issue.** In this thread, use
        the PR body already captured in Step 1's pack output (`=== PR ===` section)
        and parse its `Closes #N` line(s) for the issue(s) this PR implements. For **each** tracked issue, record a
        `blocked_by` dependency **on that tracked issue, targeting each flake issue
        `<N>`** returned — the PR's own work is blocked by the unrelated flake. Note the
        direction: this is the **reverse** of `/review-fix`,
        which records `blocked_by` on the *new* issue; here the new flake issue is
        the *blocker* and the PR's existing tracked issue is the *blocked* one.
        Use the `ref-github-issues` dependencies API (database-ID resolution with
        `gh api`, `--input` JSON; see `ref-github-issues`, do not restate the
        syntax — all `gh` calls use `dangerouslyDisableSandbox: true`). Idempotent:
        first list the tracked issue's current `blocked_by`, and skip the POST if
        the flake issue is already present, so a re-run against the same
        fingerprint does not re-add the dependency or error. This step consumes
        `<N>` uniformly for every disposition (`CREATED`, `EXISTING`, or
        `REOPENED`) — it makes no open-only assumption about the flake issue's
        state. **`STALE` is the one exception: skip this sub-step entirely** —
        deferred by design (see the `STALE` branch above).
     5. **Record a flake iteration in the accumulator** (the skill's top-level
        Step 7) — see [Accumulator](#accumulator); a flake entry is visually
        distinct from a generic no-repro one.
     6. **Post the accumulator (Step 8) and stop (Step 9). Push nothing** — the
        same terminal behavior as the generic no-repro outcome. On the next
        `/dispatch-propagate` run the PR's tracked issue carries a `blocked_by` against the
        flake issue; `/dispatch-propagate`'s queue scan skips blocked issues, so the PR is
        no longer re-routed to the `fix-checks` phase. The flake issue stands on its
        own in the queue for independent triage.

   Of the no-repro outcomes, **needs-human** is the only one that does its
   accumulator-append + post + `office-hours-reason` write **inline and stops before
   Step 5**. The other three (generic, main-fixed, flake) set their own push
   disposition here and then fall through to the shared tail Steps 7→9.

5. **Increment the fix-checks-attempt counter.** From the **labels line already
   captured in Step 1's pack output** (`=== PR ===` section), find the highest
   extant `dispatch:fix-checks-attempt-<n>` label. The preamble labels are valid
   here: between the preamble and Step 5 no `fix-checks-attempt` label is added
   (Step 5 itself adds it), so the preamble's label snapshot is current. Read the
   labels, find the highest `dispatch:fix-checks-attempt-<n>` value (call it `N`; use
   0 if none), then set `NEXT` = N+1 capped at 3 (`N < 3 ? N + 1 : 3`). Substitute
   `N` and `NEXT` as literals in the label-edit commands below.

   This step runs for the `fixed`, `main-fixed`, `flake`, and `generic` outcomes —
   the ones that consume the retry budget. The needs-human outcome already stopped in
   Step 4 and never applies a fix-checks-attempt label.

   The cap at 3 means a fourth entry still leaves the label at `dispatch:fix-checks-attempt-3`.
   `.claude/hooks/dispatch-stop.sh` (Branch C/D) reads this counter: when the re-derived
   phase is still `fix-checks` and the counter is `>= 3`, it escalates to
   `dispatch:office-hours` instead of self-closing.

   Remove the prior label if one exists, then apply the new one. Use the apply-first /
   create-on-"not found" idiom — the label may not exist yet on a fresh repo
   (`dangerouslyDisableSandbox: true` on all `gh` calls):

   ```bash
   # Remove the previous counter label (skip if N=0 — none existed)
   if [[ "$N" -gt 0 ]]; then
     gh pr edit "$PR_NUM" --remove-label "dispatch:fix-checks-attempt-$N"
   fi

   # Apply the new label; create it if missing, then retry
   if ! gh pr edit "$PR_NUM" --add-label "dispatch:fix-checks-attempt-$NEXT" 2>/dev/null; then
     gh label create "dispatch:fix-checks-attempt-$NEXT" \
       --description "dispatch workflow: fix-checks attempt $NEXT of 3"
     gh pr edit "$PR_NUM" --add-label "dispatch:fix-checks-attempt-$NEXT"
   fi
   ```

   Pass no `--color` — same convention as `dispatch:office-hours` (no colour metadata
   here; label colour is owned by the canonical definition, not the writer).

   Note: `dispatch-complete-phase` is not the right vehicle for this label — it handles
   only the two canonical phase-complete labels (`dispatch:qa-done`, `dispatch:reviewed`).
   The fix-checks-attempt label is local to `/fix-checks`.

6. **Apply the outcome's action.** If the failure reproduced, fix it by invoking
   `/implement-unit` via the Skill tool — pass `model` (chosen per
   `/implement-unit`'s heuristic), `scope` (the fix), `context` (the failing check and
   reproduce command), and `commit_intent`. `/implement-unit` builds the fix, commits,
   merges, and pushes it. For the no-repro outcomes that reached this step
   (generic, main-fixed, flake), the push disposition was already set by the Step 4
   classification — generic and flake push nothing, main-fixed pushed the merge
   commit — so there is nothing more to do here.

   `/implement-unit` returning here is mid-pass, not the end of the turn. Continue
   through Steps 7–9; the pass ends only at the Step 9 `dispatch-mark-complete`
   marker (or the Step 4 needs-human stop). Do not emit a closing summary; the next
   message is the next tool call.

7. **Append a record to the accumulator.** Append one `## Iteration <n>` section to
   `tmp/fix-checks-summary.md` (see [Accumulator](#accumulator)).

8. **Post the accumulator as a PR comment** (use `dangerouslyDisableSandbox: true`):

   ```bash
   .claude/skills/dispatch-propagate/scripts/post-pr-comment.sh <pr-num> tmp/fix-checks-summary.md
   ```

9. **Write the phase-completed marker, then stop.** Reached by every outcome
   **except** needs-human (which stopped in Step 4 without a marker). The Stop hook
   (`.claude/hooks/dispatch-stop.sh`) reads this to decide propagate vs park.
   `CLAUDE_JOB_DIR` unset = interactive run; the script no-ops with a clear
   diagnostic.

   ```bash
   .claude/skills/dispatch-propagate/scripts/dispatch-mark-complete \
     --phase fix-checks --pr "$PR_NUM"
   ```

   Then **stop**. The `/dispatch-propagate` background-job chain drives the
   next iteration — the next `/dispatch-propagate` job re-derives the phase
   from CI ground truth and re-invokes `/fix-checks` if checks still fail.

## Accumulator

`tmp/fix-checks-summary.md` is the only cross-iteration memory for the fix-checks phase.

- **First write** — create the file with a header (e.g. `# Fix-checks summary — PR #<n>`).
- **Every invocation** — append a `## Iteration <n>` section containing:
  - **Failed checks** — the check names CI reported failing.
  - **Outcome** — one of `fixed`, `generic-no-repro`, `main-fixed`, `flake`, or
    `needs-human`. This field is what makes a flake iteration visually distinct
    from a generic no-repro one.
  - **Reproduced** — `yes` or `no`.
  - **Reproduce command** — the command the subagent ran.
  - **Failure excerpt** — a short excerpt of the failure log.
  - **Why not caught** — the `why_not_caught` diagnosis.
  - **Fix** — the fix applied and its commit SHA. Include only when **Outcome**
    is `fixed`; omit otherwise.
  - **Flake issue** — *`flake` outcome only* — the canonical tracking issue, written
    as `#<N> (CREATED)`, `#<N> (EXISTING)`, `#<N> (REOPENED)`, or
    `#<N> (STALE-SUPPRESSED)` per the `dispatch-flake-dedup` / `/file-issue`
    disposition. `STALE-SUPPRESSED` marks a recurrence suppressed as a stale-head
    false positive — no reopen was fired. Omit for every other outcome.
  - **Fingerprint** — *`flake` outcome only* — the dedupe key computed in the
    Flake sub-path (the failing check name plus the stable identifier). Omit for
    every other outcome.
  - **Required action** — *`needs-human` outcome only* — the owner/infra action
    the subagent reported (the `required_action` string, e.g. provision the
    secret, grant the deploy SA access). Omit for every other outcome.

`tmp/` is git-ignored, so the accumulator never enters a commit; it persists for the
worktree's life.
