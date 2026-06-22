---
id: issue-2260
statement: "file-issue: replace gh search issues duplicate detection with REST
  list + local filter"
owner: human
status: raw
parent: issue-2254
rationale: >-
  Extend `.claude/skills/dispatch-propagate/scripts/lint-prose-rules.sh` (run
  via

  `run-lint.sh` in CI) to fail on net-new added lines that call

  `gh issue (view|edit|create|close|comment)` or `gh pr (view|edit|merge)` in

  committed `.sh`/script files, with an inline remediation pointing to the REST

  helpers. Allow documented GraphQL-only exceptions (`closingIssuesReferences`,

  `gh pr ready`) via an explicit allow-comment marker.
reading: >-
  Extend `.claude/skills/dispatch-propagate/scripts/lint-prose-rules.sh` (run
  via

  `run-lint.sh` in CI) to fail on net-new added lines that call

  `gh issue (view|edit|create|close|comment)` or `gh pr (view|edit|merge)` in

  committed `.sh`/script files, with an inline remediation pointing to the REST

  helpers. Allow documented GraphQL-only exceptions (`closingIssuesReferences`,

  `gh pr ready`) via an explicit allow-comment marker.
gap: null
clarifications: []
tooling_goals: []
success_signal: null
---
# file-issue: replace gh search issues duplicate detection with REST list + local filter
