---
id: tactic-landing-blogroll-staleness
kind: tactic
statement: Move landing's blogroll off hand-curated StaticStrategy onto the
  build-time feed-fetch fellspiral already uses
owner: ai
status: raw
parent: null
rationale: "Surfaced at the 2026-07-07 /align-strategy code review:
  landing/src/blog-roll/config.ts uses StaticStrategy with hardcoded latest-post
  entries that go stale silently; fellspiral fetches live via the allowlisted
  feed proxy with a build-time snapshot fallback
  (packages/blog/src/blog-roll/vite-plugin-feed-fetch.ts). The strictly-better
  mechanism already exists in the shared package. Retained as a draft for
  /align-tactics."
reading: null
gap: null
serves:
  - strategy-own-audience
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
# Move landing's blogroll off hand-curated StaticStrategy onto the build-time feed-fetch fellspiral already uses
