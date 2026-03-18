---
name: ref-github-issues
description: GitHub issue relationship API reference — sub-issues and dependencies (blocked_by/blocking)
---

# GitHub Issue Relationships

GitHub issues support explicit relationships via REST API: sub-issues and dependencies (blocked_by/blocking). Use these API features instead of encoding relationships as text in issue bodies.

## Critical: Issue ID Types

GitHub has two ID formats. The REST API for sub-issues and dependencies requires the **integer database ID**, not the GraphQL node ID.

| Source | Returns | Example | Use for REST body params? |
|---|---|---|---|
| `gh issue view 42 --json id --jq '.id'` | GraphQL node ID (string) | `"I_kwDORO1as87rHEqL"` | **No** |
| `gh api "/repos/{owner}/{repo}/issues/42" --jq '.id'` | Database ID (integer) | `4095863645` | **Yes** |

**Always resolve database IDs with `gh api`, not `gh issue view --json id`.**

Use `--input` with inline JSON to send request bodies. This avoids confusion between `-f` (string params) and `-F` (typed params).

`{owner}` and `{repo}` placeholders are auto-populated by `gh api` from the current repository.

## Sub-Issues

**List sub-issues:**
```bash
gh api "/repos/{owner}/{repo}/issues/36/sub_issues" --jq '.[].number'
```

**Get parent issue:**
```bash
gh api "/repos/{owner}/{repo}/issues/42/parent" --jq '.number'
```

**Add sub-issue (#42 becomes a sub-issue of #36):**
```bash
SUB_DB_ID=$(gh api "/repos/{owner}/{repo}/issues/42" --jq '.id')
gh api -X POST "/repos/{owner}/{repo}/issues/36/sub_issues" \
  --input - <<< "{\"sub_issue_id\": $SUB_DB_ID}"
```

**Remove sub-issue (#42 is no longer a sub-issue of #36):**
```bash
SUB_DB_ID=$(gh api "/repos/{owner}/{repo}/issues/42" --jq '.id')
gh api -X DELETE "/repos/{owner}/{repo}/issues/36/sub_issues" \
  --input - <<< "{\"sub_issue_id\": $SUB_DB_ID}"
```

## Dependencies (Blocked By / Blocking)

**List what blocks this issue:**
```bash
gh api "/repos/{owner}/{repo}/issues/36/dependencies/blocked_by" --jq '.[].number'
```

**List what this issue blocks:**
```bash
gh api "/repos/{owner}/{repo}/issues/36/dependencies/blocking" --jq '.[].number'
```

**Add dependency (issue #36 is blocked by #42):**
```bash
BLOCKER_DB_ID=$(gh api "/repos/{owner}/{repo}/issues/42" --jq '.id')
gh api -X POST "/repos/{owner}/{repo}/issues/36/dependencies/blocked_by" \
  --input - <<< "{\"issue_id\": $BLOCKER_DB_ID}"
```

**Remove dependency (issue #36 is no longer blocked by #42):**
```bash
BLOCKER_DB_ID=$(gh api "/repos/{owner}/{repo}/issues/42" --jq '.id')
gh api -X DELETE "/repos/{owner}/{repo}/issues/36/dependencies/blocked_by" \
  --input - <<< "{\"issue_id\": $BLOCKER_DB_ID}"
```
