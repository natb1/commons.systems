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
`/file-issue` subagents, post a PR comment, and apply the `dispatch:refactored`
label.

This skill runs in the **caller's thread** — it has no `context:` key — so it can
fork `/commit-merge-push`, invoke the built-in `/simplify`, and launch
`/file-issue` subagents.

## Idempotency preamble

Before running any step, resolve the PR number, its labels, and its body from the
current branch (use `dangerouslyDisableSandbox: true` — `gh` needs network):

```bash
BRANCH=$(git rev-parse --abbrev-ref HEAD)
PR_JSON=$(gh pr view "$BRANCH" --json number,labels,body)
PR_NUM=$(echo "$PR_JSON" | jq -r .number)
echo "$PR_JSON" | jq -r '.labels[].name'
```

`PR_NUM` is carried through to Steps 5, 6, and 7 — do not re-resolve. The PR body
stays in `PR_JSON` (`echo "$PR_JSON" | jq -r .body`); Step 5 parses its
`Closes #N` line(s) to resolve the issue(s) this PR implements. If the PR
already carries the `dispatch:refactored` label — an interrupted prior run —
**skip Steps 1–7 entirely** and return; the label is the wrapper's terminal
action and is already applied, so re-entry is a true no-op. Otherwise run all
steps in order.

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

5. **File follow-up issues for the Deferred bucket — with blocked-by
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
   finding: a short imperative title on the first line, then the body — the
   finding text, the files the finding names, the PR backlink `#<PR_NUM>`
   (reuse `PR_NUM` from the idempotency preamble), and a short rationale for
   why the finding is out of scope for this PR. This is the same `$INPUT`
   shape and parse contract as `/review-fix` Step 5. Pass the assessed blocker
   issue number(s) — or an explicit `independent` marker — into the subagent's
   prompt alongside `$INPUT`. The subagent:

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
   3. Returns `<N>` to this thread.

   Capture each `<N>` and attach it to its source finding so the Step 6 report
   can reference it.

   Run the per-finding subagents in parallel — fan them out in a single
   message with multiple Agent tool calls — since each one files an
   independent issue.

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
   .claude/skills/dispatch/scripts/post-pr-comment.sh "$PR_NUM" tmp/<file>
   ```

7. **Apply the `dispatch:refactored` label** via `dispatch-complete-phase` (use
   `dangerouslyDisableSandbox: true` — the script calls `gh`):

   ```bash
   .claude/skills/dispatch/scripts/dispatch-complete-phase "$PR_NUM" simplify
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
| Deferred | Important and actionable but out of scope for this PR; a `/file-issue` subagent filed a tracking issue in Step 5. |

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
