---
name: review-fix
description: Review phase — merge origin/main, run the generic /review, apply the recommended fixes, post a PR comment, and apply the dispatch:reviewed label
---

# Review and Fix

The `review` phase of the issue workflow, dispatched by `/dispatch`. This is the
dispatch-specific wrapper around the generic built-in `/review` skill. `/review`
only produces findings — it applies no fixes, commits nothing, and posts no
summary. This skill wraps it: merge current `main`, run `/review`, implement the
recommended changes, commit and push, post a PR comment, and apply the
`dispatch:reviewed` label.

This skill runs in the **caller's thread** — it has no `context:` key — so it can
fork `/commit-merge-push`, invoke the built-in `/review`, and launch
implementation subagents.

## Steps

1. **Merge `origin/main` first.** Fork `/commit-merge-push` via the Agent tool to
   merge current `main` into the branch. This first invocation runs with no
   pending working-tree changes — `/commit-merge-push` tolerates that: it creates
   no commit and only fetches, merges `origin/main`, and pushes. Reviewing against
   current `main` avoids re-reviewing code `main` has already changed.

2. **Run `/review`.** Invoke the built-in `/review` skill via the Skill tool — the
   generic PR review. It produces findings; it applies no fixes. Any "final
   reply" / "nothing else" wording in `/review`'s prompt scopes only to its
   findings deliverable — once it returns, continue to Step 3.

3. **Implement the recommended changes — without prompting the user.** A
   "recommended change" is a finding `/review` presents as an actionable code
   change. Implement those by launching implementation subagent(s) via the Agent
   tool, constrained to **working-tree edits only — no commits, no pushes**.
   Choose each subagent's model per `/implement-unit`'s model-selection heuristic
   (see that skill — it is the canonical home; do not restate it here).
   Informational notes and nits the skill judges not worth a change are **not**
   implemented — carry them to the Step 7 unfixed-findings report, each with a
   one-line rationale.

4. **Commit and push the fixes.** Fork `/commit-merge-push` via the Agent tool to
   commit the Step 3 fixes and push. If Step 3 produced no code changes (no
   actionable findings), this invocation also runs with no pending changes —
   `/commit-merge-push` tolerates that and creates no commit.

5. **Post a PR comment.** Resolve the PR number from the current branch (use
   `dangerouslyDisableSandbox: true` — `gh` needs network):

   ```bash
   BRANCH=$(git rev-parse --abbrev-ref HEAD)
   gh pr view "$BRANCH" --json number -q .number
   ```

   Write the comment body — a summary of the review findings and which were fixed
   — to a file under the repo's `tmp/` directory. The body file **must** live
   under `tmp/` because `post-pr-comment.sh` restricts paths to that directory.
   Then post it (use `dangerouslyDisableSandbox: true` — the script invokes `gh`):

   ```bash
   .claude/skills/ref-pr-workflow/scripts/post-pr-comment.sh <pr-num> tmp/<file>
   ```

6. **Apply the `dispatch:reviewed` label.** Ensure the label exists idempotently,
   then apply it — follow the `gh label create` pattern from `dispatch/SKILL.md`'s
   "Applying the progress label" section (use `dangerouslyDisableSandbox: true`):

   ```bash
   gh label create "dispatch:reviewed" --color BFD4F2 --description "review phase complete" 2>/dev/null || true
   gh pr edit <pr-num> --add-label "dispatch:reviewed"
   ```

   This skill **owns** its `dispatch:reviewed` label — unlike the generic
   `/review`, which `/dispatch` cannot make dispatch-aware — so `/dispatch` does
   not apply the label after this skill returns.

7. **Print the unfixed-findings report.** Print, in the conversation, every
   finding that was not implemented (informational notes and nits), each with a
   one-line rationale for not fixing it.

8. **Interactive follow-up (attended use only).** If the user requests a fix for a
   remaining finding, implement it (working-tree edits only), fork
   `/commit-merge-push` to commit and push it, and document it on the PR with a
   comment using Step 5's mechanism.

## Autonomous vs. attended

Under `/loop /dispatch` there is no user to drive Step 8 — the skill applies the
`dispatch:reviewed` label (Step 6) and stops; the Step 7 unfixed-findings report
is informational. The label is applied regardless of whether any fixes were made,
so `/dispatch` can always advance to the next phase.
