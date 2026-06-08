---
name: file-issue
description: File a new GitHub issue from a structured title+body — runs duplicate detection, creates the issue, assigns @me, applies the help wanted label, and classifies and applies a type + optional topic label via ref-issue-labels
---

# File Issue

Single-purpose: file one follow-up GitHub issue from a caller-supplied title
and body. Owns duplicate detection, issue creation, `@me` assignment, the
`help wanted` label, and type + optional topic classification via the shared
`ref-issue-labels` classifier — the minimum logic needed to file an issue that
`/dispatch-propagate`'s queue scan will pick up, correctly typed and topiced.

Callers (e.g. `/review-fix` Step 5 for deferred findings, `/ready`
description-mode Step 5) supply fully formed title and body text. This skill
runs no plan-mode gate, prompts for nothing, and applies no 7-category
evaluation — the caller is responsible for the content of the issue.

All `gh` calls run with `dangerouslyDisableSandbox: true` per
`.claude/rules/sandbox.md` (the sandbox blocks `gh`'s TLS validation).

## Step 1. Parse `$INPUT`

`$INPUT` carries the issue text with no markers:

- The first non-empty line is the **title**.
- Everything after that (preserving internal blank lines) is the **body**.

## Step 2. Duplicate detection

Extract 3–5 representative keywords from the title and run a single search
that returns each candidate's number, title, and body inline — no
per-candidate follow-up call is needed:

```bash
gh search issues --repo {owner}/{repo} --state open --json number,title,body "<keywords>"
```

Judge whether the candidate describes the same actionable change as the new
title + body. Be conservative — prefer creating a near-duplicate (false
negative) over silently merging two distinct findings into one issue (false
positive). A candidate matches only when its scope and required change line
up with the new issue's, not merely because keywords overlap.

If a candidate matches, skip creation and jump to Step 6 (Return) with `<N>`
as an **existing** match — an existing issue was already classified when first
filed, so the classify step (Step 5) is skipped on the EXISTING path.

## Step 3. Create the issue

```bash
gh issue create --title "<title>" --body "<body>"
```

`gh issue create` prints the new issue URL — e.g.
`https://github.com/{owner}/{repo}/issues/<N>`. Extract `<N>` from the
trailing path segment. The URL is the authoritative source for the issue
number; do not rely on stdout positioning beyond the URL itself.

## Step 4. Post-processing

Assign the issue to the current GitHub user and apply the `help wanted`
label, so `/dispatch-propagate`'s queue scan picks it up:

```bash
gh issue edit <N> --add-assignee @me --add-label "help wanted"
```

## Step 5. Classify and label

Runs on the **CREATED path only** — an EXISTING match (Step 2) skips straight
to Step 6 (Return), because it was already classified when first filed.

This step applies one type label (`bug`/`enhancement`) and any matched topic
label, classified per `ref-issue-labels`. It is separate from Step 4 (Step 4
owns `@me` + `help wanted`; this step owns type + topic).

Invoke `ref-issue-labels` via the Skill tool to classify `<type>` and an
optional `<topic>` from the issue title + body. Then apply to `<N>` in one
`gh issue edit` call (with `dangerouslyDisableSandbox: true`, per the sandbox
note above):

```bash
gh issue edit <N> --add-label "<type>" --add-label "<topic>"
# drop the trailing --add-label "<topic>" when no topic matched; add
# --remove-label "<other-type>" only when the opposite type label is already present.
```

Immediately after creation the opposite-type label is normally absent, so the
`--remove-label` arm is rarely exercised here — it is documented as the safety
net for callers that layer an explicit type afterward (e.g. `/review-fix`
Step 6b).

Do not restate the `bug`-vs-`enhancement` criterion or topic keyword signals
here — `ref-issue-labels` owns the classification rules.

## Step 6. Return

Print exactly one of the following lines, on its own line, as the final
result of this skill:

- `CREATED <N>` — Step 3 created a new issue.
- `EXISTING <N>` — Step 2 matched an existing open issue and Step 3 was
  skipped.

Callers parse this line to retrieve the issue number; the
`CREATED`/`EXISTING` discriminator tells them whether the issue is new.
