---
id: tactic-quiet-app-heroes
kind: tactic
statement: Replace production app heroes with the landing hero (no demo cards),
  visible only when viewing public demo data — removing all fork/onboarding
  chips and inline onboarding paths
owner: ai
status: raw
parent: null
rationale: "The immediately-actionable half of the tier gate, from the
  2026-07-06 interview: it implements the quiet state, removing invitations
  rather than adding them, so it is consumable by /align-tactics now — no tier
  declaration required. Stale onboarding paths in production give
  counterproductive signals until then."
reading: null
gap: null
serves:
  - strategy-user-onboarding
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
# Replace production app heroes with the landing hero (no demo cards), visible only when viewing public demo data — removing all fork/onboarding chips and inline onboarding paths

## Scope (2026-07-06 interview decision)

Remove:

- `print/src/pages/Hero.tsx`: both fork chips ("Fork this project" / "Open
  your fork in Claude Desktop" / "Ask Claude ...") and the reference note
  ("This tool is entirely built using Claude. You should try creating your
  own document viewer ...").
- `budget/src/pages/hero.ts`: the entire chip hero, including the Easy
  analyze-locally panel and its inline fork + `/budget-parser` sentence.

Replace: both app heroes render the same hero as landing (headline "Build
with commons.systems. Learn to run without.", subline, CTAs Learn More →
about, Source → repo) without the project demo cards. The hero is visible
only when viewing public demo data — never over a user's own data.

Unchanged: the landing hero and About page (the ungated service-sales
surface), and audio/fellspiral (no onboarding content found 2026-07-06).

Ungated: consumable by /align-tactics immediately — this tactic removes
invitations rather than adding them.
