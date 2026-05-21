---
name: review-fix
description: Review phase — merge origin/main, run the generic /review, classify findings into Fixed/Informational/Dismissed/Deferred, implement Fixed, file follow-up issues for Deferred via /file-issue, post a 4-section PR comment, and apply the dispatch:reviewed label
---

# Review and Fix

The `review` phase of the issue workflow, dispatched by `/dispatch`. This is the
dispatch-specific wrapper around the generic built-in `/review` skill. `/review`
only produces findings — it applies no fixes, commits nothing, and posts no
summary. This skill wraps it: merge current `main`, run `/review`, classify the
findings into four buckets, implement the Fixed bucket, file follow-up issues
for the Deferred bucket via `/file-issue`, commit and push, post a 4-section PR
comment, and apply the `dispatch:reviewed` label.

This skill runs in the **caller's thread** — it has no `context:` key — so it can
fork `/commit-merge-push`, invoke the built-in `/review`, and launch
implementation and follow-up-issue subagents.

## Idempotency preamble

Before running any step, resolve the PR number **and its labels** from the current
branch (use `dangerouslyDisableSandbox: true` — `gh` needs network):

```bash
BRANCH=$(git rev-parse --abbrev-ref HEAD)
PR_JSON=$(gh pr view "$BRANCH" --json number,labels)
PR_NUM=$(echo "$PR_JSON" | jq -r .number)
echo "$PR_JSON" | jq -r '.labels[].name'
```

`PR_NUM` is reused in Steps 5, 7, and 8 — do not re-resolve. If the printed labels
include `dispatch:reviewed` — an interrupted prior run — **skip Steps 1–10
entirely** and return; the label is the wrapper's terminal action under
autonomous use and is already applied, so re-entry is a true no-op. Otherwise
run all steps in order.

## Steps

1. **Merge `origin/main` first.** Fork `/commit-merge-push` via the Agent tool to
   merge current `main` into the branch. This first invocation runs with no
   pending working-tree changes — `/commit-merge-push` tolerates that: it creates
   no commit and only fetches, merges `origin/main`, and pushes. Reviewing against
   current `main` avoids re-reviewing code `main` has already changed.

2. **Run `/review`.** Invoke the built-in `/review` skill via the Skill tool —
   the generic PR review. It produces findings; it applies no fixes. `/review`
   is built-in and uneditable: pass it no output contract and consume its
   natural output as-is. Any "final reply" / "nothing else" wording in
   `/review`'s prompt scopes only to its findings deliverable — once it
   returns, continue to Step 3.

3. **Classify findings into four buckets.** Walk every finding from `/review`
   and judge it from the finding's natural text — `/review` supplies no
   structured disposition field. Classify each finding in this thread:

   - **Fixed** — a concrete, in-scope code change applicable to this PR;
     implemented in Step 4.
   - **Informational** — FYIs, notes, observations; no change required.
   - **Dismissed** — nits, incorrect findings, or not applicable; no change,
     each with a one-line rationale.
   - **Deferred** — valid but out of scope for this PR; filed as follow-up
     issues in Step 5.

   When a finding is ambiguous, default to **Informational** rather than
   inventing a code change.

   For each **Deferred** finding, compose — from the finding text — a follow-up
   issue **title** (a short imperative summary) and **body** (the finding
   description, the files the finding names, and a short rationale for why it
   is out of scope for this PR). `/review` supplies no structured title or body
   fields, so the wrapper writes both. Carry each finding, its bucket, and —
   for Deferred findings — the composed title and body forward to the Step 5
   subagents and the report generators in Steps 7 and 9. If `/review` returned
   no findings, all four buckets are empty and the rest of the skill still runs
   end-to-end.

4. **Implement the Fixed bucket — without prompting the user.** For each
   finding in the Fixed bucket, launch an implementation subagent via the Agent
   tool, constrained to **working-tree edits only — no commits, no pushes**.
   Choose each subagent's model per `/implement-unit`'s model-selection
   heuristic (see that skill — it is the canonical home; do not restate it
   here). Findings in the Informational, Dismissed, and Deferred buckets are
   **not** implemented here. If the Fixed bucket is empty, skip this step.

5. **File follow-up issues for the Deferred bucket.** For each finding in the
   Deferred bucket, fork a subagent via the Agent tool (`subagent_type:
   general-purpose`, `model: sonnet`) that invokes the `/file-issue` skill.
   Build the subagent's `$INPUT` from the title and body composed for that
   finding in Step 3: the title on the first line, then the body — the finding
   description, the "Relevant files" list, the PR backlink `#<PR_NUM>` (reuse
   `PR_NUM` from the idempotency preamble), and the out-of-scope rationale.
   `/file-issue` owns duplicate detection, issue creation, `@me` assignment,
   and the `help wanted` label — the subagent invokes it and does no
   additional `gh` work.

   `/file-issue` prints `CREATED <N>` or `EXISTING <N>` on its own line. The
   subagent parses that line and returns `<N>` (along with the discriminator)
   to this thread. Capture each `<N>` and attach it to its source finding for
   the report generators. The discriminator is internal — Step 7's report
   formats every Deferred entry as `<short description> → #<N>` regardless,
   since the linked issue is the same either way.

   Run the per-finding subagents in parallel (multiple Agent calls in a single
   message) — there are no sequencing constraints between them. Step 5 can
   also be launched in the same message as Step 4's implementation subagents:
   Step 5 touches only GitHub, Step 4 touches only the working tree, so they
   do not conflict. If the Deferred bucket is empty, skip this step.

6. **Commit and push the fixes.** Fork `/commit-merge-push` via the Agent tool
   to commit the Step 4 fixes and push. If the Fixed bucket was empty (Step 4
   was a no-op), this invocation also runs with no pending changes —
   `/commit-merge-push` tolerates that and creates no commit.

7. **Post a PR comment.** Reuse `PR_NUM` from the idempotency preamble — no
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
   follow-up issue created in Step 5.

   Write the body to a file under the repo's `tmp/` directory. The body file
   **must** live under `tmp/` because `post-pr-comment.sh` restricts paths to
   that directory. Then post it (use `dangerouslyDisableSandbox: true` — the
   script invokes `gh`):

   ```bash
   .claude/skills/dispatch/scripts/post-pr-comment.sh "$PR_NUM" tmp/<file>
   ```

8. **Apply the `dispatch:reviewed` label** via `dispatch-complete-phase` (use
   `dangerouslyDisableSandbox: true` — the script calls `gh`):

   ```bash
   .claude/skills/dispatch/scripts/dispatch-complete-phase "$PR_NUM" review
   ```

   This skill **owns** its `dispatch:reviewed` label — unlike the generic
   `/review`, which `/dispatch` cannot make dispatch-aware — so `/dispatch`
   does not apply the label after this skill returns. The label is applied
   regardless of whether any fixes were made, so a no-findings run still
   advances the workflow.

9. **Print the 4-section final report.** Print, in the conversation, the same
   4-section body that was posted to the PR in Step 7 — reuse the body file
   written under `tmp/` rather than regenerating it. On a no-findings run,
   every section renders `_None._` and the skill still terminates cleanly.

10. **Interactive follow-up (attended use only).** If the user requests a fix
    for a remaining finding (typically from the Informational, Dismissed, or
    Deferred buckets), implement it (working-tree edits only), fork
    `/commit-merge-push` to commit and push it, and document it on the PR with
    a comment using Step 7's mechanism.

## Autonomous vs. attended

Under `/loop /dispatch` there is no user to drive Step 10 — the skill applies
the `dispatch:reviewed` label (Step 8) and stops; the Step 9 4-section report
is informational. The label is applied regardless of whether any fixes were
made, so `/dispatch` can always advance to the next phase.

## Notes

The skill is idempotent: a re-invocation with `dispatch:reviewed` already on the
PR skips Steps 1–10 and returns. Step 10 (interactive follow-up) is in the skip
range because attended follow-up edits would be made directly, not by re-running
the wrapper.
