---
id: tactic-prerender-single-injection-path
kind: tactic
statement: Collapse the blog prerender to the PageShell single-root injection
  path, retiring the legacy regex/string injection
owner: ai
status: raw
parent: null
rationale: "Surfaced at the 2026-07-07 /align-strategy code review:
  packages/blog/src/prerender.ts carries two injection paths — the legacy
  regex/string injection at marked template sites (function-form String.replace,
  the class that produced tactic-blog-prerender-injection) and the opt-in ds
  PageShell single-root path landing uses. Fellspiral remains on the legacy
  path; collapsing to PageShell removes the injection-bug class. Retained as a
  draft for /align-tactics."
reading: null
gap: null
serves:
  - strategy-owned-web-platform
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: null
execution: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Collapse the blog prerender to the PageShell single-root injection path, retiring the legacy regex/string injection
