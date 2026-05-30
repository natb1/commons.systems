---
name: review-fix
description: Review phase — run the generic /review, classify findings into Fixed/Informational/Dismissed/Deferred, implement Fixed, file follow-up issues for Deferred via /file-issue, post a 4-section PR comment, and apply the dispatch:reviewed label
---

# Review and Fix

The `review` phase of the issue workflow, dispatched by `/dispatch-propagate`. This is the
dispatch-specific wrapper around the generic built-in `/review` skill. `/review`
only produces findings — it applies no fixes, commits nothing, and posts no
summary. This skill wraps it: run `/review`, classify the findings into four buckets,
implement the Fixed bucket, file follow-up issues for the Deferred bucket via
`/file-issue`, commit and push, post a 4-section PR comment, and apply the
`dispatch:reviewed` label.

This skill runs in the **caller's thread** — it has no `context:` key — so it can
fork `/commit-merge-push`, fork a subagent that invokes the built-in `/review`,
and launch implementation and follow-up-issue subagents.

## Idempotency preamble

Before running any step, resolve the PR number, its labels, and its body from the
current branch (use `dangerouslyDisableSandbox: true` — `gh` needs network):

```bash
BRANCH=$(git rev-parse --abbrev-ref HEAD)
PR_JSON=$(gh pr view "$BRANCH" --json number,labels,body)
PR_NUM=$(echo "$PR_JSON" | jq -r .number)
echo "$PR_JSON" | jq -r '.labels[].name'
```

`PR_NUM` is reused in Steps 2, 6, 7, and 10 — do not re-resolve. The PR body stays in
`PR_JSON` (`echo "$PR_JSON" | jq -r .body`); Step 4 parses its `Closes #N`
line(s) to resolve the issue(s) this PR implements. If the printed labels include
`dispatch:reviewed` — an interrupted prior run — **skip Steps 1–9 entirely** and
return; the label is the wrapper's terminal action under autonomous use and is
already applied, so re-entry is a true no-op. Otherwise run all steps in order.

## Steps

1. **Run `/review`.** Fork a subagent via the Agent tool
   (`subagent_type: general-purpose`, `model: sonnet`) that invokes the
   built-in `/review` skill via the Skill tool inside the subagent and returns
   its output verbatim — the generic PR review. It produces findings; it
   applies no fixes. The subagent boundary is the control-flow guarantee: the
   parent never sees the inner Skill's prompt template, so it remains on this
   step when the Agent call returns. `/review` is built-in and uneditable: the
   subagent passes the inner skill no output contract and returns its natural
   output as-is. Keep the "once it returns, continue to Step 2" wording inside
   the **subagent's** prompt as defense-in-depth for the inner Skill
   invocation. Any "final reply" / "nothing else" wording in `/review`'s
   prompt scopes only to its findings deliverable.

2. **Classify findings into four buckets.** Walk every finding from `/review`
   and judge it from the finding's natural text — `/review` supplies no
   structured disposition field. Classify each finding in this thread:

   - **Fixed** — a concrete, in-scope code change applicable to this PR;
     implemented in Step 3.
   - **Informational** — FYIs, notes, observations; no change required.
   - **Dismissed** — nits, incorrect findings, or not applicable; no change,
     each with a one-line rationale.
   - **Deferred** — valid but out of scope for this PR; filed as follow-up
     issues in Step 4.

   When a finding is ambiguous, default to **Informational** rather than
   inventing a code change.

   For each **Deferred** finding, compose — from the finding text — a follow-up
   issue **title** (a short imperative summary) and **body** (the finding
   description, the files the finding names, the PR backlink `#<PR_NUM>` reusing
   `PR_NUM` from the idempotency preamble, and a short rationale for why it is
   out of scope for this PR). `/review` supplies no structured title or body
   fields, so the wrapper writes both. Carry each finding, its bucket, and —
   for Deferred findings — the composed title and body forward to the Step 4
   subagents and the report generators in Steps 6 and 8. If `/review` returned
   no findings, all four buckets are empty and the rest of the skill still runs
   end-to-end.

3. **Implement the Fixed bucket — without prompting the user.** For each
   finding in the Fixed bucket, launch an implementation subagent via the Agent
   tool, constrained to **working-tree edits only — no commits, no pushes**.
   Choose each subagent's model per `/implement-unit`'s model-selection
   heuristic (see that skill — it is the canonical home; do not restate it
   here). Findings in the Informational, Dismissed, and Deferred buckets are
   **not** implemented here. If the Fixed bucket is empty, skip this step.

4. **File follow-up issues for the Deferred bucket — with blocked-by
   dependencies.** Skip this step only if the Deferred bucket is empty.

   First resolve the PR's **implementing issue(s)**: parse the `Closes #N`
   line(s) from the PR body captured in `PR_JSON` (`echo "$PR_JSON" | jq -r
   .body`). These are the issue(s) this PR's work delivers.

   Then, for **each** Deferred finding, assess — as a required sub-step, never
   skipped — what the new tracking issue is blocked by:

   - Deferred because it depends on or builds on this PR's changes → **blocked
     by the PR's implementing issue(s)**.
   - Blocked by some other identifiable open issue → **blocked by that issue**.
   - Unrelated pre-existing code with no sequencing constraint → **independent**.
   - When unsure, prefer recording the dependency over leaving the issue
     unlinked.

   For each finding, fork a subagent via the Agent tool (`subagent_type:
   general-purpose`, `model: sonnet`). Build the subagent's `$INPUT` from the
   title and body composed for that finding in Step 2: the title on the first
   line, then the body. Pass the assessed blocker issue number(s) — or an
   explicit `independent` marker — into the subagent's prompt alongside
   `$INPUT`. The subagent:

   1. Invokes `/file-issue`, which owns duplicate detection, issue creation,
      `@me` assignment, and the `help wanted` label. `/file-issue` prints
      `CREATED <N>` or `EXISTING <N>` on its own line; the subagent parses it.
   2. For a non-independent finding, records a `blocked_by` dependency **on the
      new issue `<N>`, targeting each blocker issue number** passed in. The
      target is the GitHub **issue** — never the PR number, and the dependency
      is the API relationship, never body text. Use the `ref-github-issues`
      dependencies API (database-ID resolution with `gh api`, `--input` JSON;
      see `ref-github-issues`, do not restate the syntax). On the
      `EXISTING <N>` path, first list `<N>`'s current `blocked_by` (same
      dependencies API — see `ref-github-issues`) and skip the POST for any
      blocker already present, so a duplicate does not error. An `independent`
      finding records no dependency.
   3. Returns `<N>` (along with the `CREATED`/`EXISTING` discriminator) to this
      thread.

   Capture each `<N>` and attach it to its source finding for the report
   generators. The discriminator is internal — Step 6's report formats every
   Deferred entry as `<short description> → #<N>` regardless, since the linked
   issue is the same either way.

   Run the per-finding subagents in parallel (multiple Agent calls in a single
   message) — there are no sequencing constraints between them. Step 4 can
   also be launched in the same message as Step 3's implementation subagents:
   Step 4 touches only GitHub, Step 3 touches only the working tree, so they
   do not conflict.

5. **Commit and push the fixes.** Fork `/commit-merge-push` via the Agent tool
   to commit the Step 3 fixes and push. If the Fixed bucket was empty (Step 3
   was a no-op), this invocation also runs with no pending changes —
   `/commit-merge-push` tolerates that and creates no commit. Capture the
   resulting fix commit SHA(s) — Step 6's Fixed section formats each entry as
   `<short description>: <commit-SHA>`.

6. **Post a PR comment.** Reuse `PR_NUM` from the idempotency preamble — no
   second `gh pr view`.

   Build the comment body as a 4-section markdown report, in this order:

   ```
   ## Fixed
   - <short description>: <commit-SHA>
   - ...

   ## Informational
   - <short description>
   - ...

   ## Dismissed
   - <short description> — <one-line rationale>
   - ...

   ## Deferred
   - <short description> → #<N>
   - ...
   ```

   Any empty section renders its body as `_None._` so the comment is
   well-formed even on a no-findings run (all four sections present, each
   `_None._`). Each Deferred entry includes the `#<N>` reference for the
   follow-up issue created in Step 4.

   Write the body to a file under the repo's `tmp/` directory. The body file
   **must** live under `tmp/` because `post-pr-comment.sh` restricts paths to
   that directory. Then post it (use `dangerouslyDisableSandbox: true` — the
   script invokes `gh`):

   ```bash
   .claude/skills/dispatch-propagate/scripts/post-pr-comment.sh "$PR_NUM" tmp/<file>
   ```

7. **Apply the `dispatch:reviewed` label** via `dispatch-complete-phase` (use
   `dangerouslyDisableSandbox: true` — the script calls `gh`):

   ```bash
   .claude/skills/dispatch-propagate/scripts/dispatch-complete-phase "$PR_NUM" review
   ```

   The PR number passed here is **expected** to differ from the worktree's
   `<issue>-…` branch issue number — the PR↔issue linkage was established
   earlier in the tick (by `dispatch-resolve-arg`, `dispatch-find-pr`, or
   `dispatch-select-target`), so the dispatching session must **not** pause to
   re-confirm the mismatch.

   This skill **owns** its `dispatch:reviewed` label — unlike the generic
   `/review`, which `/dispatch-propagate` cannot make dispatch-aware — so `/dispatch-propagate`
   does not apply the label after this skill returns. The label is applied
   regardless of whether any fixes were made, so a no-findings run still
   advances the workflow.

8. **Print the 4-section final report.** Print, in the conversation, the same
   4-section body that was posted to the PR in Step 6 — reuse the body file
   written under `tmp/` rather than regenerating it. On a no-findings run,
   every section renders `_None._` and the skill still terminates cleanly.

9. **Interactive follow-up (attended use only).** If the user requests a fix
   for a remaining finding (typically from the Informational, Dismissed, or
   Deferred buckets), implement it (working-tree edits only), fork
   `/commit-merge-push` to commit and push it, and document it on the PR with
   a comment using Step 6's mechanism.

10. **Write the phase-completed marker or deviation reason (autonomous path
    only), then stop.** The Stop hook (`.claude/hooks/dispatch-stop.sh`) reads
    this to decide propagate vs park. `CLAUDE_JOB_DIR` unset = interactive run;
    the write is a no-op and the skill simply stops (which is correct —
    interactive Step 9 just ran). On idempotent re-entry (Steps 1–9 were
    skipped), the Step 2 bucket data is not in context — treat the deviation
    criterion as not met and write the phase-completed marker.

    **Deviation criterion:** the Deferred bucket dominated — nearly all findings
    were Deferred and none were Fixed.

    - **Deviation fires** — do NOT write `phase-completed`. Instead write a
      one-line reason to `$CLAUDE_JOB_DIR/office-hours-reason`, atomic via
      tempfile + mv. The Stop hook reads marker-absence as Branch A and applies
      `dispatch:office-hours` to the issue, parking it for human review.

      ```bash
      if [[ -n "${CLAUDE_JOB_DIR:-}" && -d "$CLAUDE_JOB_DIR" ]]; then
        printf '%s\n' "/review-fix: findings dominated by Deferred (out-of-scope) items; none fixed" \
          > "$CLAUDE_JOB_DIR/office-hours-reason.tmp"
        mv "$CLAUDE_JOB_DIR/office-hours-reason.tmp" \
           "$CLAUDE_JOB_DIR/office-hours-reason"
      fi
      ```

    - **No deviation** — write the `phase-completed` marker exactly as before,
      atomic via tempfile + mv.

      ```bash
      if [[ -n "${CLAUDE_JOB_DIR:-}" && -d "$CLAUDE_JOB_DIR" ]]; then
        printf 'phase=review\npr=%s\n' "$PR_NUM" \
          > "$CLAUDE_JOB_DIR/phase-completed.tmp"
        mv "$CLAUDE_JOB_DIR/phase-completed.tmp" \
           "$CLAUDE_JOB_DIR/phase-completed"
      fi
      ```

    Then **stop**. The Stop hook reads the marker (or its absence) and advances
    or parks the chain.

## Autonomous vs. attended

In an autonomous `/dispatch-propagate` background job there is no user to drive
Step 9 — the skill applies the `dispatch:reviewed` label (Step 7), writes the
phase-completed marker (Step 10), and stops; the Step 8 4-section report is
informational. The label is applied regardless of whether any fixes were made,
so `/dispatch-propagate` can always advance to the next phase.

## Notes

The skill is idempotent: a re-invocation with `dispatch:reviewed` already on the
PR skips Steps 1–9 and returns. Step 9 (interactive follow-up) is in the skip
range because attended follow-up edits would be made directly, not by re-running
the wrapper.
