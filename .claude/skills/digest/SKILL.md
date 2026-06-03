---
name: digest
description: Summarize all dispatch-queue work completed since the previous digest closed, demo every user-facing item with the user present, post the summary as a comment on the digest issue, and close it. Runs as an office-hours session, invoked by dispatch-jit-reminder for the digest jit.
---

# Digest

Runs as an **office-hours session** with the user present — it cannot run
unattended, because its demos are interactive (it drives the live browser apps).

`dispatch-jit-reminder` invokes this skill after it claims the digest jit issue
(sets the project `Status` → `In Progress`). This skill owns the rest of that
session and produces its output for the user.

Takes two arguments: `<repo> <num>` — the digest jit issue this run covers.

Work each section in order. Run every `gh`-calling command with
`dangerouslyDisableSandbox: true` — see `.claude/rules/sandbox.md`.

## 1. Compute the digest window

Find the window-start timestamp — the boundary before which work was already
covered by a prior digest:

```bash
.claude/skills/dispatch-propagate/scripts/dispatch-digest-window <repo> <num>
```

Run this with `dangerouslyDisableSandbox: true` — it calls `gh`.

It prints an ISO-8601 timestamp: the previous closed digest issue's `closedAt`
(steady state), or this issue's own `createdAt` when no prior closed digest
exists (cold start). Capture it as `<window-start>` for the next section.

## 2. Enumerate dispatch-queue work completed in the window

Collect everything merged into `natb1/commons.systems` since the window start.
The workspace repo is hardcoded here on purpose: dispatch-queue work always
merges into `natb1/commons.systems`, whereas the `<repo>` argument names where
the *digest issue itself* lives (the repo configured in
`dispatch.config/jit.json` for the real digest jit) — a different repo. Do not
substitute `<repo>` into this query.

```bash
gh pr list --repo natb1/commons.systems --state merged \
  --search "merged:>=<window-start>" \
  --json number,title,mergedAt,labels,closingIssuesReferences
```

Run this with `dangerouslyDisableSandbox: true` — it calls `gh`.

Each PR's `closingIssuesReferences` lists the issues it closed. Identify which
PRs are dispatch-queue work via two signals — both stamped onto a PR as it
advances through the chain:

- **The `dispatch:*` labels** accumulated on the PR — `dispatch:reviewed`,
  `dispatch:qa-done`. A PR that rode the chain carries one or more of these.
- **Membership on the commons.systems project board** — the dispatch chain
  tracks its work there.

A PR with neither signal is not dispatch-queue work; leave it out of the digest.
The previous digest's own merge may show up in the window — that is fine; it is
just one more completed item.

## 3. Judge each completed item for user-facing functionality

For each merged PR / closed issue, decide whether it delivered **user-facing
functionality** — a change a user would observe — versus internal tooling,
refactors, or dispatch plumbing.

- User-facing: a new budget chart, a fellspiral interaction, a landing-page
  section, a new `/budget` capability the user runs.
- Not user-facing: a dispatch-script refactor, a test-only change, a CI fix, an
  internal type cleanup.

Only user-facing items get demoed in §4. List the rest in the summary as
completed-but-internal so the user still sees the full scope of work.

## 4. Demo every user-facing item with the user present

For each user-facing item, pick the matching case.

### Browser-app feature (apps `budget`, `fellspiral`, `landing`, `print`)

Run an interactive live demo against the production app with the Claude Chrome
extension, per `.claude/rules/chrome-extension.md`:

1. Start the browser context (`tabs_context_mcp`) and confirm Chrome is
   connected. If `list_connected_browsers` returns `[]`, ask the user to start
   Chrome, then retry.
2. Open a tab to the production app, navigate to the feature, drive it, and
   narrate what the user is seeing as you go.

Resolve the production URL from `.firebaserc` rather than trusting a hardcoded
list — read `targets.commons-systems.hosting`, where each app maps to a hosting
site id served at `https://<site-id>.web.app`, except `landing`, which is served
at `https://commons.systems`. As of now the mapping is:

| App | Production URL |
|---|---|
| budget | https://cs-budget-f920.web.app |
| fellspiral | https://cs-fellspiral-4e12.web.app |
| print | https://cs-print-00af.web.app |
| landing | https://commons.systems |

Per the chrome-extension rule, the first call to a gated browser tool for a new
origin is denied before the approval popup surfaces — **retry the failed call
once**, and the retry succeeds. If browser calls keep failing after that one
retry, stop and ask the user rather than looping.

### Non-browser user-facing functionality (a CLI such as `budget-etl`, or a slash-command skill)

Do **not** execute it. Instead add **numbered demo steps** to the summary so the
user can try it themselves — the exact command and what to expect. For example:

1. Run `/budget ~/Downloads/statements/` in Claude Code.
2. The `budget-etl` binary runs locally and writes `budget.json`.
3. Upload it to the budget app to see the new view.

## 5. Post the summary as a comment on the digest issue

Compose the summary:

- the window covered (window start → now);
- per user-facing item: the live-demo outcome, or the numbered demo steps;
- a list of the completed-but-internal items.

Write the body to a temp file under this job's tmp dir — use
`$CLAUDE_JOB_DIR/tmp/digest-body.md` (item titles may carry shell
metacharacters, so do not inline the body) — then post it:

```bash
gh issue comment <num> --repo <repo> --body-file "$CLAUDE_JOB_DIR/tmp/digest-body.md"
```

Run this with `dangerouslyDisableSandbox: true` — it calls `gh`.

This is a GitHub-rendered artifact: per `.claude/rules/issue-references.md`, keep
bare `#N` references and append **no** `References:` list.

## 6. Close the digest issue

```bash
gh issue close <num> --repo <repo>
```

Run this with `dangerouslyDisableSandbox: true` — it calls `gh`.

Closing both records the digest and anchors the next cadence cycle: per the JIT
engine, the next digest issue is created `remindAfterClose` (24h) after this
`closedAt`. Then the session ends — the posted summary and the demos are the
office-hours session's output for the user.
