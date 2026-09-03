---
question: What happens when the standing text moves under a recommendation?
form: rule
authority:
  class: deferred
  by: claude
  date: 2026-09-03
stage: review
recommendation:
  adopts: standing
  class: delegated
  boldness: low
  amends: aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
  at: a1b2c3d4e5f60
---

## Answer

The recommendation goes stale: it amends a text that is no longer the text
the node stands on.

## Rationale

`recommendation.amends` pins the standing hash as it was when the
recommendation was drafted, so any later edit to the frontmatter, the
answer, or this rationale unpins it.
