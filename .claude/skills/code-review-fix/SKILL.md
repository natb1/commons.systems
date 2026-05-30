---
name: code-review-fix
description: Code-review phase — run the generic /code-review, commit and push the fixes, defer out-of-scope findings as tracking issues, post a PR comment, and apply the dispatch:code-reviewed label
---

# Code Review and Fix

The `code-review` phase of the issue workflow, dispatched by `/dispatch-propagate`. This is the
dispatch-specific wrapper around the generic built-in `/code-review` skill.
`/code-review` applies in-scope fixes to the working tree and surfaces findings with the
skill's own (fixed vs skipped) disposition; it
does not commit, push, post a summary, or carry follow-up actions beyond the
current PR. This skill wraps it: run `/code-review`, commit and push the fixes, defer
important out-of-scope findings to tracking issues via `/file-issue` subagents,
post a PR comment, and apply the `dispatch:code-reviewed` label.

This skill runs in the **caller's thread** — it has no `context:` key — so it can
fork `/commit-merge-push`, fork a subagent that invokes the built-in
`/code-review`, and launch `/file-issue` subagents.

## Idempotency preamble

Before running any step, resolve the PR number, its labels, and its body from the
current branch (use `dangerouslyDisableSandbox: true` — `gh` needs network):

```bash
BRANCH=$(git rev-parse --abbrev-ref HEAD)
PR_JSON=$(gh pr view "$BRANCH" --json number,labels,body)
PR_NUM=$(echo "$PR_JSON" | jq -r .number)
echo "$PR_JSON" | jq -r '.labels[].name'
```

`PR_NUM` is carried through to Steps 4, 5, 6, and 7 — do not re-resolve. The PR body
stays in `PR_JSON` (`echo "$PR_JSON" | jq -r .body`); Step 4 parses its
`Closes #N` line(s) to resolve the issue(s) this PR implements. If the PR
already carries the `dispatch:code-reviewed` label — an interrupted prior run —
**skip Steps 1–6 entirely** and return; the label is the wrapper's terminal
action and is already applied, so re-entry is a true no-op. Otherwise run all
steps in order.

## Steps

1. **Run `/code-review max`.** Fork a subagent via the Agent tool
   (`subagent_type: general-purpose`, `model: sonnet`) that invokes the
   built-in `/code-review` skill via the Skill tool with the `max` effort
   argument (the highest thoroughness available) inside the subagent and
   returns its output verbatim. It applies in-scope fixes to the working tree
   and surfaces findings with the skill's own (fixed vs skipped) disposition.
   The subagent boundary is the control-flow guarantee: the parent never sees
   the inner Skill's prompt template, so it remains on this step when the
   Agent call returns. The subagent inherits the parent's worktree
   filesystem — working-tree edits made by `/code-review` inside the subagent
   surface on disk for Step 3's `/commit-merge-push` with no additional
   plumbing. Do **not** set `isolation:` on this subagent: an isolated
   worktree would silently capture `/code-review`'s edits in a discarded
   copy, leaving Step 3 with nothing to commit. The subagent passes the
   inner skill no output contract and returns its natural output as-is. Keep
   the "once it returns, continue to Step 2" wording inside the
   **subagent's** prompt as defense-in-depth for the inner Skill invocation.
   Any "final reply" / "nothing else" wording in `/code-review`'s prompt
   scopes only to its findings deliverable.

2. **Classify every finding into the 4-way disposition.** `/code-review` produces a
   2-way split (fixed vs skipped). The wrapper extends each skipped finding into
   one of three buckets — Informational, Disregarded, or Deferred — using the
   table in **Finding classification** below. The caller of `/code-review-fix`
   makes this call; `/code-review` itself does not.

3. **Commit and push the fixes.** Fork `/commit-merge-push` via the Agent tool to
   commit the Step 1 edits and push. If `/code-review` produced no code changes,
   this invocation runs with no pending changes — `/commit-merge-push` tolerates
   that and creates no commit. Capture the resulting fix commit SHA (or note the
   no-op) for the Step 5 report.

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
   finding: a short imperative title on the first line, then the body — the
   finding text, the files the finding names, the PR backlink `#<PR_NUM>`
   (reuse `PR_NUM` from the idempotency preamble), and a short rationale for
   why the finding is out of scope for this PR. This is the same `$INPUT`
   shape and parse contract as `/review-fix` Step 4. Pass the assessed blocker
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

   Capture each `<N>` and attach it to its source finding so the Step 5 report
   can reference it.

   Run the per-finding subagents in parallel — fan them out in a single
   message with multiple Agent tool calls — since each one files an
   independent issue.

5. **Post a PR comment with the four-section report.** Reuse the `PR_NUM`
   captured in the preamble — do not re-resolve.

   Write the comment body to a file under the repo's `tmp/` directory. The body
   file **must** live under `tmp/` because `post-pr-comment.sh` restricts paths
   to that directory. The report has four sections, in order — **omit any
   section that has no entries**:

   - **Findings that were fixed** — one line per finding plus the fix commit
     SHA from Step 3.
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
   .claude/skills/dispatch-propagate/scripts/post-pr-comment.sh "$PR_NUM" tmp/<file>
   ```

6. **Apply the `dispatch:code-reviewed` label** via `dispatch-complete-phase` (use
   `dangerouslyDisableSandbox: true` — the script calls `gh`):

   ```bash
   .claude/skills/dispatch-propagate/scripts/dispatch-complete-phase "$PR_NUM" code-review
   ```

   The PR number passed here is **expected** to differ from the worktree's
   `<issue>-…` branch issue number — the PR↔issue linkage was established
   earlier in the tick (by `dispatch-resolve-arg`, `dispatch-find-pr`, or
   `dispatch-select-target`), so the dispatching session must **not** pause to
   re-confirm the mismatch.

   This skill **owns** its `dispatch:code-reviewed` label — parallel to how
   `/review-fix` owns `dispatch:reviewed` and `/security-review-fix` owns
   `dispatch:security-reviewed` — so `/dispatch-propagate` does not apply the label after
   this skill returns.

7. **Check for deviation, then write the marker (or reason) and stop.**

   **Deviation criterion:** the Deferred bucket dominated — nearly all findings
   were Deferred and none were Fixed.

   - **Deviation fires** → do NOT write `phase-completed`. Instead write a
     one-line reason so the Stop hook can surface it in the office-hours
     comment. The Stop hook reads marker-absence as Branch A and applies
     `dispatch:office-hours` to the issue, parking it for human review.

     ```bash
     if [[ -n "${CLAUDE_JOB_DIR:-}" && -d "$CLAUDE_JOB_DIR" ]]; then
       printf '%s\n' "/code-review-fix: findings dominated by Deferred (out-of-scope) items; none fixed" \
         > "$CLAUDE_JOB_DIR/office-hours-reason.tmp"
       mv "$CLAUDE_JOB_DIR/office-hours-reason.tmp" \
          "$CLAUDE_JOB_DIR/office-hours-reason"
     fi
     ```

   - **No deviation** → write the `phase-completed` marker as normal.
     Atomic via tempfile + mv. `CLAUDE_JOB_DIR` unset = interactive run; skip.

     ```bash
     if [[ -n "${CLAUDE_JOB_DIR:-}" && -d "$CLAUDE_JOB_DIR" ]]; then
       printf 'phase=code-review\npr=%s\n' "$PR_NUM" \
         > "$CLAUDE_JOB_DIR/phase-completed.tmp"
       mv "$CLAUDE_JOB_DIR/phase-completed.tmp" \
          "$CLAUDE_JOB_DIR/phase-completed"
     fi
     ```

   Then **stop**. The Stop hook reads the marker (or its absence) and either
   advances the chain or parks the issue.

## Finding classification

Every `/code-review` finding lands in exactly one of four buckets:

| Bucket | Meaning |
|---|---|
| Fixed | Implemented by `/code-review` inside the Step 1 subagent. |
| Informational | Surfaced for human reference; no action recommended. |
| Disregarded | False positive or trivially wrong; explicitly rejected with a one-line rationale. |
| Deferred | Important and actionable but out of scope for this PR; a `/file-issue` subagent filed a tracking issue in Step 4. |

`/code-review` itself produces only the 2-way split (fixed vs skipped). The caller
of `/code-review-fix` extends the skipped findings into the three non-fixed buckets
in Step 2 — that classification is the wrapper's responsibility, not the
generic skill's.

**A finding is never Disregarded purely because the change is small.** If the
finding is a real improvement and falls within the PR's scope, classify it as
Fixed and implement it — full stop — regardless of how trivial the diff is.
Disregarded is for false positives, trivially wrong findings, or style
preferences that are not actual improvements; smallness alone never qualifies
(out-of-scope items go to Deferred, not Disregarded).
If `/code-review` skipped a small in-scope improvement in Step 1, implement it
yourself before moving on (working-tree edit only; Step 3's
`/commit-merge-push` picks it up).

## Notes

The skill is idempotent: a re-invocation with `dispatch:code-reviewed` already on
the PR skips Steps 1–6 and returns. The label is the wrapper's terminal action
and is already applied, so re-entry is a true no-op.
