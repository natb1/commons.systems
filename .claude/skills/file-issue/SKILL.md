---
name: file-issue
description: File a new GitHub issue from a structured title+body — runs duplicate detection, creates the issue, assigns @me, and applies the help wanted label
---

# File Issue

Single-purpose: file one follow-up GitHub issue from a caller-supplied title
and body. Owns duplicate detection, issue creation, `@me` assignment, and the
`help wanted` label — the minimum logic needed to file an issue that
`/dispatch`'s queue scan will pick up.

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

If a candidate matches, skip creation and jump to Step 5 with `<N>` as an
**existing** match.

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
label, so `/dispatch`'s queue scan picks it up:

```bash
gh issue edit <N> --add-assignee @me --add-label "help wanted"
```

## Step 5. Return

Print exactly one of the following lines, on its own line, as the final
result of this skill:

- `CREATED <N>` — Step 3 created a new issue.
- `EXISTING <N>` — Step 2 matched an existing open issue and Step 3 was
  skipped.

Callers parse this line to retrieve the issue number; the
`CREATED`/`EXISTING` discriminator tells them whether the issue is new.
