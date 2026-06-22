---
id: issue-1461
statement: "style: add --danger and --ok status tokens to default.css"
owner: human
status: raw
parent: issue-1459
rationale: >-
  - Add `--danger` (and `--ok`) to the `:root` token block in
  `style/default.css`,
    using `light-dark()` consistent with the existing tokens.
  - Update at least one app (office-hours) to reference the shared token instead
  of
    a local/hardcoded value.
reading: >-
  - Add `--danger` (and `--ok`) to the `:root` token block in
  `style/default.css`,
    using `light-dark()` consistent with the existing tokens.
  - Update at least one app (office-hours) to reference the shared token instead
  of
    a local/hardcoded value.
gap: null
clarifications: []
tooling_goals: []
success_signal: null
---
# style: add --danger and --ok status tokens to default.css
