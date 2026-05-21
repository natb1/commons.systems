---
name: security-review-fix
description: Security phase — merge origin/main, gather findings from /security-review and the PR's CodeQL code-scanning alerts, apply the fixes, post a PR comment, apply the dispatch:security-reviewed label, and mark the PR ready
---

# Security Review and Fix

The `security` phase of the issue workflow, dispatched by `/dispatch`. This is the
dispatch-specific wrapper around the generic built-in `/security-review` skill.
`/security-review` only produces findings — it applies no fixes, commits nothing,
and posts no summary. This skill wraps it: merge current `main`, run
`/security-review` and gather the PR's CodeQL code-scanning alerts, implement the
recommended fixes, commit and push, post a PR comment, apply the
`dispatch:security-reviewed` label, and mark the PR ready.

This is the workflow's **terminal actionable phase** — it marks the PR ready
itself, so there is no separate `ready` phase after it.

This skill runs in the **caller's thread** — it has no `context:` key — so it can
fork `/commit-merge-push`, invoke the built-in `/security-review`, and launch
implementation subagents.

## Idempotency preamble

Before running any step, resolve the PR number **and its labels** from the current
branch (use `dangerouslyDisableSandbox: true` — `gh` needs network):

```bash
BRANCH=$(git rev-parse --abbrev-ref HEAD)
gh pr view "$BRANCH" --json number,labels
```

This prints the PR number and its labels as JSON. If the PR already carries the
`dispatch:security-reviewed` label — an interrupted prior run — **skip Steps 1–6
entirely** and go straight to Step 7 to ensure the PR is ready. Otherwise run all
steps in order.

## Steps

1. **Merge `origin/main` first.** Fork `/commit-merge-push` via the Agent tool to
   merge current `main` into the branch. This first invocation runs with no
   pending working-tree changes — `/commit-merge-push` tolerates that: it creates
   no commit and only fetches, merges `origin/main`, and pushes. Reviewing against
   current `main` avoids re-reviewing code `main` has already changed.

2. **Gather findings from both sources.** The finding set carried into Step 3
   combines two sources, gathered **independently**:

   **(a) `/security-review`.** Invoke the built-in `/security-review` skill via
   the Skill tool — the generic security review. It produces findings; it applies
   no fixes. Any "final reply" / "nothing else" wording in `/security-review`'s
   prompt scopes only to its findings deliverable — once it returns, continue.

   **(b) CodeQL code-scanning alerts.** Fetch the PR ref's open code-scanning
   alerts from GitHub Advanced Security (use `dangerouslyDisableSandbox: true` —
   `gh` needs network):

   ```bash
   gh api --paginate "repos/{owner}/{repo}/code-scanning/alerts?state=open&ref=refs/pull/<pr-num>/head"
   ```

   `<pr-num>` is the PR number resolved in the idempotency preamble. `--paginate`
   covers repos with many alerts; the `ref` filter scopes to the PR — this
   includes pre-existing alerts in code the PR did not change. Capture per alert:
   the alert `number`, `rule.id`, `rule.severity` (`note`/`warning`/`error` —
   always present), `rule.security_severity_level` (`low`/`medium`/`high`/
   `critical`, null for non-security rules), `most_recent_instance.location`
   (path and lines), and `html_url`. An empty array means no CodeQL findings —
   proceed with the `/security-review` findings alone; it is not an error.

   Combine both sources into one finding set for Step 3.

3. **Apply the recommended changes.** The findings to triage are the **combined**
   set from Step 2 — the `/security-review` findings *and* the open CodeQL alerts.
   Implement fixes for the items, from either source, that are actionable
   vulnerabilities — launch implementation subagent(s) via the Agent tool,
   constrained to **working-tree edits only — no commits, no pushes**. Choose each
   subagent's model per `/implement-unit`'s model-selection heuristic (see that
   skill — it is the canonical home; do not restate it here). Items not changed
   are still carried to the Step 5 PR comment with their disposition.

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

   Write the comment body to a file under the repo's `tmp/` directory. The body
   summarizes **every** finding from **both** Step 2 sources and its disposition —
   fixed (with the fix's commit SHA) or not fixed (with the reason). Identify each
   CodeQL alert by its `rule.id` and alert `number`, linked via its `html_url`.
   The body file **must** live under `tmp/` because `post-pr-comment.sh` restricts
   paths to that directory. Then post it (use `dangerouslyDisableSandbox: true` —
   the script invokes `gh`):

   ```bash
   .claude/skills/dispatch/scripts/post-pr-comment.sh <pr-num> tmp/<file>
   ```

6. **Apply the `dispatch:security-reviewed` label** via `dispatch-complete-phase`
   (use `dangerouslyDisableSandbox: true` — the script calls `gh`):

   ```bash
   .claude/skills/dispatch/scripts/dispatch-complete-phase <pr-num> security
   ```

   This skill **owns** its `dispatch:security-reviewed` label — unlike the generic
   `/security-review`, which `/dispatch` cannot make dispatch-aware — so
   `/dispatch` does not apply the label after this skill returns.

7. **Mark the PR ready.** Flip the draft to ready-for-review (use
   `dangerouslyDisableSandbox: true` — `gh` needs network):

   ```bash
   gh pr ready <pr-num>
   ```

   This is the workflow's terminal action.

## Notes

Marking the PR ready is the workflow's terminal action. After this change the
dispatch workflow has no human checkpoint before a PR goes ready — the per-phase
PR-comment summaries are the audit trail. This is an intentional trade-off for an
autonomous `/loop /dispatch` run.

The skill is idempotent: a re-invocation with `dispatch:security-reviewed` already
on the PR skips Steps 1–6 and only ensures the PR is ready (Step 7).
