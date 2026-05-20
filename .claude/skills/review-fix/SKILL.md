---
name: review-fix
description: Review phase — merge origin/main, run the generic /review, classify findings into Fixed/Informational/Dismissed/Deferred, implement Fixed, file follow-up issues for Deferred via /ready, post a 4-section PR comment, and apply the dispatch:reviewed label
---

# Review and Fix

The `review` phase of the issue workflow, dispatched by `/dispatch`. This is the
dispatch-specific wrapper around the generic built-in `/review` skill. `/review`
only produces findings — it applies no fixes, commits nothing, and posts no
summary. This skill wraps it: merge current `main`, run `/review`, classify the
findings into four buckets, implement the Fixed bucket, file follow-up issues
for the Deferred bucket, commit and push, post a 4-section PR comment, and
apply the `dispatch:reviewed` label.

This skill runs in the **caller's thread** — it has no `context:` key — so it can
fork `/commit-merge-push`, invoke the built-in `/review`, and launch
implementation and follow-up-issue subagents.

## Steps

1. **Merge `origin/main` first.** Fork `/commit-merge-push` via the Agent tool to
   merge current `main` into the branch. This first invocation runs with no
   pending working-tree changes — `/commit-merge-push` tolerates that: it creates
   no commit and only fetches, merges `origin/main`, and pushes. Reviewing against
   current `main` avoids re-reviewing code `main` has already changed.

2. **Run `/review`.** Invoke the built-in `/review` skill via the Skill tool —
   the generic PR review. It produces findings; it applies no fixes. Pass `args`
   that state the required per-finding output contract: every finding must
   include

   - `title_hint` — a short title suitable for a follow-up issue
   - `body_context` — enough description to seed a follow-up issue
   - `relevant_files` — paths the finding refers to
   - `scope_disposition ∈ {fix, informational, dismiss, defer}`

   `/review` is built-in; the contract is best-effort — Step 3 classifies
   defensively if `/review` does not honor it. Any "final reply" / "nothing
   else" wording in `/review`'s prompt scopes only to its findings deliverable —
   once it returns, continue to Step 3.

3. **Classify findings into four buckets.** Walk every finding from `/review`.
   Use the `scope_disposition` hint when present; otherwise classify defensively
   in this thread — if the finding describes a concrete code change applicable
   to this PR, default to `fix`; otherwise default to `informational`. The four
   buckets are:

   - **Fixed** ← `fix` — actionable code changes to implement in Step 4.
   - **Informational** ← `informational` — FYIs, notes, observations; no
     change required.
   - **Dismissed** ← `dismiss` — nits, incorrect findings, or not applicable;
     no change, each with a one-line rationale.
   - **Deferred** ← `defer` — valid but out of scope for this PR; filed as
     follow-up issues in Step 5.

   Carry each finding (with its `title_hint`, `body_context`, `relevant_files`,
   and bucket) forward to the report generators in Steps 7 and 9. If `/review`
   returned no findings, all four buckets are empty and the rest of the skill
   still runs end-to-end.

4. **Implement the Fixed bucket — without prompting the user.** For each
   finding in the Fixed bucket, launch an implementation subagent via the Agent
   tool, constrained to **working-tree edits only — no commits, no pushes**.
   Choose each subagent's model per `/implement-unit`'s model-selection
   heuristic (see that skill — it is the canonical home; do not restate it
   here). Findings in the Informational, Dismissed, and Deferred buckets are
   **not** implemented here. If the Fixed bucket is empty, skip this step.

5. **File follow-up issues for the Deferred bucket.** For each finding in the
   Deferred bucket, fork a subagent via the Agent tool (`subagent_type:
   general-purpose`, `model: sonnet`) that invokes the `/ready` skill. The
   subagent constructs `$INPUT` per `ref-ready`'s "Non-Interactive Mode" format
   (canonical there — do not restate it here). The title comes from the
   finding's `title_hint`; the body is its `body_context` extended with a
   "Relevant files" list, the original PR link `#<PR-num>`, and a short
   rationale for why the finding is out of scope for this PR. The
   non-interactive mode instructs `/ready` to skip plan mode and the
   user-approval gate, which is required because subagents cannot collect user
   feedback.

   The subagent extracts the new issue number `<N>` by parsing the
   `https://github.com/.../issues/<N>` URL that `gh issue create` prints when
   it creates the issue. `/ready` Step 6 (post-processing) may run additional
   `gh issue edit <N>` calls against the same `<N>` — the creation URL is the
   authoritative source. The subagent returns `<N>` as its result. Capture each
   `<N>` and attach it to its source finding for the report generators.

   Run the per-finding subagents in parallel (multiple Agent calls in a single
   message) — there are no sequencing constraints between them. Step 5 can
   also be launched in the same message as Step 4's implementation subagents:
   Step 5 touches only GitHub, Step 4 touches only the working tree, so they
   do not conflict. If the Deferred bucket is empty, skip this step.

6. **Commit and push the fixes.** Fork `/commit-merge-push` via the Agent tool
   to commit the Step 4 fixes and push. If the Fixed bucket was empty (Step 4
   was a no-op), this invocation also runs with no pending changes —
   `/commit-merge-push` tolerates that and creates no commit.

7. **Post a PR comment.** Resolve the PR number from the current branch (use
   `dangerouslyDisableSandbox: true` — `gh` needs network):

   ```bash
   BRANCH=$(git rev-parse --abbrev-ref HEAD)
   gh pr view "$BRANCH" --json number -q .number
   ```

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
   .claude/skills/ref-pr-workflow/scripts/post-pr-comment.sh <pr-num> tmp/<file>
   ```

8. **Apply the `dispatch:reviewed` label.** Ensure the label exists
   idempotently, then apply it — follow the `gh label create` pattern from
   `dispatch/SKILL.md`'s "Applying the progress label" section (use
   `dangerouslyDisableSandbox: true`):

   ```bash
   gh label create "dispatch:reviewed" --color BFD4F2 --description "review phase complete" 2>/dev/null || true
   gh pr edit <pr-num> --add-label "dispatch:reviewed"
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
