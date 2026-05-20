---
name: simplify-fix
description: Simplify phase — merge origin/main, run the generic /simplify, commit and push the fixes, defer out-of-scope findings as tracking issues, post a PR comment, and apply the dispatch:refactored label
---

# Simplify and Fix

The `simplify` phase of the issue workflow, dispatched by `/dispatch`. This is the
dispatch-specific wrapper around the generic built-in `/simplify` skill.
`/simplify` applies in-scope fixes to the working tree and produces findings; it
does not commit, push, post a summary, or carry follow-up actions beyond the
current PR. This skill wraps it: merge current `main`, run `/simplify`, commit
and push the fixes, defer important out-of-scope findings to tracking issues via
`/ready` subagents, post a PR comment, and apply the `dispatch:refactored`
label.

This skill runs in the **caller's thread** — it has no `context:` key — so it can
fork `/commit-merge-push`, invoke the built-in `/simplify`, and launch `/ready`
subagents.

## Idempotency preamble

Before running any step, resolve the PR number **and its labels** from the current
branch (use `dangerouslyDisableSandbox: true` — `gh` needs network):

```bash
BRANCH=$(git rev-parse --abbrev-ref HEAD)
gh pr view "$BRANCH" --json number,labels
```

This prints the PR number and its labels as JSON. Capture the PR number into a
shell variable (`PR_NUM`) and carry it through to Steps 6 and 7 — they reuse it
without re-resolving. If the PR already carries the `dispatch:refactored`
label — an interrupted prior run — **skip Steps 1–7 entirely** and return; the
label is the wrapper's terminal action and is already applied, so re-entry is a
true no-op. Otherwise run all steps in order.

## Steps

1. **Merge `origin/main` first.** Fork `/commit-merge-push` via the Agent tool to
   merge current `main` into the branch. This first invocation runs with no
   pending working-tree changes — `/commit-merge-push` tolerates that: it creates
   no commit and only fetches, merges `origin/main`, and pushes. Simplifying
   against current `main` avoids re-reviewing code `main` has already changed.

2. **Run `/simplify`.** Invoke the built-in `/simplify` skill via the Skill tool.
   It applies in-scope fixes to the working tree and surfaces findings with the
   skill's own (fixed vs skipped) disposition. Any "final reply" / "nothing
   else" wording in `/simplify`'s prompt scopes only to its findings
   deliverable — once it returns, continue to Step 3.

3. **Classify every finding into the 4-way disposition.** `/simplify` produces a
   2-way split (fixed vs skipped). The wrapper extends each skipped finding into
   one of three buckets — Informational, Disregarded, or Deferred — using the
   table in **Finding classification** below. The caller of `/simplify-fix`
   makes this call; `/simplify` itself does not.

4. **Commit and push the fixes.** Fork `/commit-merge-push` via the Agent tool to
   commit the Step 2 edits and push. If `/simplify` produced no code changes,
   this invocation runs with no pending changes — `/commit-merge-push` tolerates
   that and creates no commit. Capture the resulting fix commit SHA (or note the
   no-op) for the Step 6 report.

5. **For each Deferred finding, spawn a `/ready` subagent to create a tracking
   issue.** Launch one Agent tool invocation per finding
   (`subagent_type: general-purpose`; choose the model per `/implement-unit`'s
   model-selection heuristic — see that skill; do not restate it here). The
   subagent prompt **must**:

   - Tell the subagent to use `/ready` in description mode, passing the finding
     text as the issue description.
   - **Forbid `/ref-ready` Step 4 plan-mode approval** — subagents cannot prompt
     the user, so the plan-mode approval gate would block them. Skip it.
   - State that the finding text is the full context — no further codebase
     search is required to flesh out the issue scope.
   - Ask the subagent to return the new issue number so the Step 6 report can
     reference it.

   Run subagents in parallel — fan them out in a single message with multiple
   Agent tool calls — since each one creates an independent issue.

6. **Post a PR comment with the four-section report.** Reuse the `PR_NUM`
   captured in the preamble — do not re-resolve.

   Write the comment body to a file under the repo's `tmp/` directory. The body
   file **must** live under `tmp/` because `post-pr-comment.sh` restricts paths
   to that directory. The report has four sections, in order — **omit any
   section that has no entries**:

   - **Findings that were fixed** — one line per finding plus the fix commit
     SHA from Step 4.
   - **Informational findings** — surfaced for human reference, no action
     recommended (e.g. style nits, pre-existing patterns).
   - **Disregarded findings** — false positives or trivially wrong; each with
     a one-line rationale for rejection.
   - **Deferred findings** — important, actionable, out of scope for this PR;
     each entry references the new issue number created in Step 5.

   If every section is empty (zero findings at all), skip the post entirely.
   Otherwise post it (use `dangerouslyDisableSandbox: true` — the script
   invokes `gh`) and also print the report to chat:

   ```bash
   .claude/skills/ref-pr-workflow/scripts/post-pr-comment.sh "$PR_NUM" tmp/<file>
   ```

7. **Apply the `dispatch:refactored` label.** Ensure the label exists
   idempotently, then apply it (use `dangerouslyDisableSandbox: true` — `gh`
   needs network):

   ```bash
   gh label create "dispatch:refactored" --color BFD4F2 --description "simplify phase complete" 2>/dev/null || true
   gh pr edit "$PR_NUM" --add-label "dispatch:refactored"
   ```

   This skill **owns** its `dispatch:refactored` label — parallel to how
   `/review-fix` owns `dispatch:reviewed` and `/security-review-fix` owns
   `dispatch:security-reviewed` — so `/dispatch` does not apply the label after
   this skill returns.

## Finding classification

Every `/simplify` finding lands in exactly one of four buckets:

| Bucket | Meaning |
|---|---|
| Fixed | Implemented in Step 2 by `/simplify`. |
| Informational | Surfaced for human reference; no action recommended. |
| Disregarded | False positive or trivially wrong; explicitly rejected with a one-line rationale. |
| Deferred | Important and actionable but out of scope for this PR; a `/ready` subagent created a tracking issue in Step 5. |

`/simplify` itself produces only the 2-way split (fixed vs skipped). The caller
of `/simplify-fix` extends the skipped findings into the three non-fixed buckets
in Step 3 — that classification is the wrapper's responsibility, not the
generic skill's.

**A finding is never Disregarded purely because the change is small.** If the
finding is a real improvement and falls within the PR's scope, classify it as
Fixed and implement it — full stop — regardless of how trivial the diff is.
Disregarded is for false positives, trivially wrong findings, or style
preferences that are not actual improvements; smallness alone never qualifies
(out-of-scope items go to Deferred, not Disregarded).
If `/simplify` skipped a small in-scope improvement in Step 2, implement it
yourself before moving on (working-tree edit only; Step 4's
`/commit-merge-push` picks it up).

## Notes

The skill is idempotent: a re-invocation with `dispatch:refactored` already on
the PR skips Steps 1–7 and returns. The label is the wrapper's terminal action
and is already applied, so re-entry is a true no-op.
