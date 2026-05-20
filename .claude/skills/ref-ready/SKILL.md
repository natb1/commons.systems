---
name: ref-ready
description: Issue quality evaluation reference — invoke whenever creating or editing any GitHub issue body
---

# Issue Ready Reference

## Resume Logic

- No plan recorded → Step 1
- Plan exists, improvements not applied → Step 5
- Applied, not assigned → Step 6

## Step 1. Parse Input

Detect input mode from `$INPUT`:

- Matches `^#?[0-9]+$` → **issue number mode**: extract the number (strip `#`), fetch the issue:
  ```bash
  gh issue view <N> --json title,body,labels,assignees,projectItems,state
  ```
  Store title and body for evaluation.

  Then fetch sub-issues:
  ```bash
  gh api "/repos/{owner}/{repo}/issues/<N>/sub_issues" --jq '.[].number'
  ```

  For each sub-issue number returned, fetch its full content:
  ```bash
  gh issue view <sub-N> --json title,body,labels,assignees,projectItems,state
  ```

  Store all fetched issues (primary + sub-issues + parent + siblings) for evaluation.

  Then fetch parent issue (if this is a sub-issue):
  ```bash
  gh api "/repos/{owner}/{repo}/issues/<N>/parent" --jq '.number'
  ```
  If a parent exists, fetch its full content:
  ```bash
  gh issue view <parent-N> --json title,body,labels,assignees,projectItems,state
  ```

  Then fetch sibling issues (other sub-issues of the same parent):
  ```bash
  gh api "/repos/{owner}/{repo}/issues/<parent-N>/sub_issues" --jq '.[] | {number, state}'
  ```
  For each sibling (excluding `<N>`), fetch content based on state:
  - Open siblings: full content (`title,body,labels,assignees,projectItems,state`)
  - Closed siblings: summary only (`title,number,state`)

  > See `ref-memory-management` Issue Context Loading for the authoritative list of content types. This skill extends the base field set with `labels, assignees, projectItems` for evaluation.
  > See `ref-github-issues` for write operations (add/remove sub-issues and dependencies) and the critical distinction between database IDs and GraphQL node IDs.

- Otherwise → **description mode**: treat `$INPUT` as the issue body text. Prompt user for a title if not provided.

## Non-Interactive Mode

When the first line of `$INPUT` is exactly `non-interactive`, the skill runs in non-interactive mode. This applies only to **description mode** (creating a new issue from a free-text description); issue-number mode is always interactive.

**Marker parsing:**

1. Strip the `non-interactive` marker line from `$INPUT`.
2. If the next non-empty line begins with `title: ` (case-sensitive), use the rest of that line as the issue title and strip that line from `$INPUT`. The remaining text is the issue body.
3. Otherwise, derive the title from the first non-empty line of the remaining body (per the existing description-mode convention). The title is **never prompted** in non-interactive mode — callers that want a specific title must supply a `title: ` line.
4. Proceed through Steps 2–3 (branch setup and 7-category evaluation) unchanged.
5. In Step 4: skip plan-mode entry; compute the improved body internally and proceed directly to Step 5.
6. In Step 5: skip the user-approval gate; proceed directly to issue creation via `gh issue create`.
7. Step 6 (post-processing) runs as normal.

**Backward compatibility:** any `$INPUT` not starting with the literal line `non-interactive` runs the existing interactive flow unchanged.

## Step 2. Branch-Conditional Setup

In issue number mode only: check for blocking issues and their branches.

```bash
gh api "/repos/{owner}/{repo}/issues/<N>/dependencies/blocked_by" --jq '.[].number'
```

For each blocker number returned, check if an unmerged branch exists:

```bash
git branch -r | grep "^  origin/<blocker-num>-"
```

If a matching remote branch is found, record it as `$BASELINE_BRANCH`. This branch is used as the comparison baseline in Relevance and Correctness checks (Steps 3d and 3e).

## Step 3. Evaluate — Seven Categories

Analyze all seven categories. Compile findings under each heading.

### a. Duplicates

Search for potential duplicate issues:

```bash
gh search issues --repo {owner}/{repo} "<keywords from title/body>"
```

Extract 3–5 representative keywords from the issue title and body. Present candidate issues with titles and links. Note any that closely overlap in scope.

### b. Compliance

Verify the issue meets project standards:

- **Type classification**: is this a new feature, enhancement, or bug? Flag if unclear.
- **New features**: must be assigned to a project (`projectItems` field non-empty).
- **Enhancements**: must have the `enhancement` label.
- **Bugs**: must have the `bug` label.
- **Acceptance criteria**: body must include a checklist (`- [ ]` items). Each criterion must be testable with a clear pass/fail outcome. Flag vague criteria.
- **Single-PR scope**: issue must be completable in a single PR. Flag if scope is too broad.
- **Context/motivation**: body must state why the change is needed. Flag if missing.
- **Bug reproduction steps**: for bugs, body must include steps to reproduce, expected behavior, and actual behavior. Flag if missing.
- **Dependencies and sub-issues**: must use the GitHub dependency/sub-issue APIs, not plain text descriptions of relationships. Flag any plain-text dependency references.

### c. Clarity

- Identify ambiguities that require clarifying questions.
- Suggest rewrites that improve precision or readability.
- Flag redundancies that make requirements difficult to reference.

### d. Correctness

Identify errors or inconsistencies in the requirements. If `$BASELINE_BRANCH` is set, compare requirements against that branch's implementation to catch conflicts or outdated assumptions:

```bash
git diff origin/main...$BASELINE_BRANCH -- <relevant files>
```

### e. Relevance

(Issue number mode only.) Assess whether the issue is still relevant or if the codebase has evolved to make it obsolete. If `$BASELINE_BRANCH` is set, compare against that branch:

```bash
git diff origin/main...$BASELINE_BRANCH -- <relevant files>
```

Flag any requirements already addressed by existing code.

### f. Decomposition

Assess whether the issue spans more than one PR-sized chunk of work. If so, recommend a breakdown into sub-issues with distinct testability and review boundaries. Describe what each sub-issue would cover.

### g. Recommendations

Suggest alternative requirements or designs that could improve functionality or architectural maintainability. Focus on substantive improvements, not stylistic preferences.

After completing the 7-category evaluation of the primary issue, repeat the full evaluation for each sub-issue. Compile findings per issue, clearly labeled (e.g., "Primary #83", "Sub-issue #87", "Sub-issue #88").

## Step 4. Plan Mode — Propose Improvements

> **Non-interactive mode:** skip plan-mode entry; compute the improved body internally and proceed directly to Step 5.

**Scope:** This plan covers creating or updating the GitHub issue body — not implementing the code changes described in the issue. Do not modify source code files.

Enter plan mode. Structure the plan across all issues with findings (primary + sub-issues):

1. **Findings summary** — one section per issue (labeled by number), each with per-category bullet lists. Omit issues and categories with no findings.
2. **Proposed improved bodies** — one complete rewrite per issue that has improvements.
3. **Change rationale** — bulleted list of specific changes per issue and why.

Wait for user approval before proceeding.

## Step 5. Apply Improvements

> **Non-interactive mode:** skip the user-approval gate; proceed directly to issue creation.

This step only modifies GitHub issues (via `gh issue edit`, `gh issue create`, and related `gh` commands). Do not modify source code files.

Apply the approved improvements for each issue in sequence:

- **Issue number mode**:
  ```bash
  gh issue edit <N> --body "<improved body>"
  ```

  Repeat for each sub-issue that has improvements:
  ```bash
  gh issue edit <sub-N> --body "<improved body>"
  ```

- **Description mode**:
  ```bash
  gh issue create --title "<title>" --body "<improved body>"
  ```
  Record the new issue number as `<N>`.

When decomposition (Step 3f) creates new issues, establish relationships using the `ref-github-issues` API syntax — do not encode relationships as text in issue bodies. Use sub-issues for scope breakdown and dependencies for sequencing constraints.

## Step 6. Post-Processing

Assign the issue to the current GitHub user and apply the `help wanted` label:

```bash
gh issue edit <N> --add-assignee @me --add-label "help wanted"
```

Apply `help wanted` by default. Drop `--add-label "help wanted"` only when the user explicitly asked not to label the issue or named a different label set.
