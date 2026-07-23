---
id: tactic-indieweb-syndicate-posts
kind: tactic
statement: Choose syndication targets and syndicate the published posts with
  canonical links back, recording u-syndication URLs
owner: human
status: codified
parent: null
rationale: "Split 2026-07-06 from draft tactic-indieweb-audience by
  /align-tactics round 1: the human act of POSSE. Meets the
  syndication-with-canonical-links leg of the strategy threshold, so it carries
  the validates edge; the owned-side markup support it needs is
  tactic-indieweb-syndication-markup."
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
validates:
  - strategy-own-audience
blocked_by: []
office_hours:
  reason: "Not claude-eligible: needs the author's platform accounts and target
    choice (~30 author-minutes). Decide the syndication targets (recommendation:
    start with one fediverse target, e.g. a Mastodon account — the smallest
    choice consistent with platform-free reading), post each published landing
    and fellspiral article there with a link back to its canonical /post/<id>
    URL, and record each copy's URL in the post's syndication metadata (post
    seed data) so u-syndication links render. Blocked on
    tactic-indieweb-syndication-markup landing the metadata field."
  since: 2026-07-06
  recommendation: null
pace_exempt: false
rounds: null
attributes: {}
---
# Choose syndication targets and syndicate the published posts with canonical links back, recording u-syndication URLs

Born-parked: this is author work, not claude-eligible — it needs the author's
platform accounts and the target choice. See `office_hours.reason` for the
concrete ~30-minute checklist and the recommendation (start with one
fediverse target). It meets the syndication-with-canonical-links leg of
`strategy-own-audience`'s threshold, so it carries the `validates` edge; the
metadata field and `u-syndication` rendering it depends on land first via
`tactic-indieweb-syndication-markup` (`blocked_by`).
