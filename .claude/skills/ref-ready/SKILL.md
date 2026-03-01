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
- Otherwise → **description mode**: treat `$INPUT` as the issue body text. Prompt user for a title if not provided.

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

## Step 4. Plan Mode — Propose Improvements

Enter plan mode. Present:

1. **Summary of findings** — one section per category (a–g), each with a bullet list of findings. Omit categories with no findings.
2. **Proposed improved issue body** — a complete rewrite incorporating all improvements: clearer scope, acceptance criteria checklist, compliance fixes, context section, and any structural changes.
3. **Change rationale** — a bulleted list of specific changes made and why.

Wait for user approval before proceeding.

## Step 5. Apply Improvements

Apply the approved improvements:

- **Issue number mode**:
  ```bash
  gh issue edit <N> --body "<improved body>"
  ```

- **Description mode**:
  ```bash
  gh issue create --title "<title>" --body "<improved body>"
  ```
  Record the new issue number as `<N>`.

## Step 6. Post-Processing

Assign the issue to the current GitHub user:

```bash
gh issue edit <N> --add-assignee @me
```
