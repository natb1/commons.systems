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
  reason: "Feature/requirement discovery, not executable work (reclassified
    2026-07-25 by author direction at an office-hours drain sitting): the
    syndication target is an undecided product requirement, so this node belongs
    in a requirement-discovery session rather than an execution lane. CORRECTION
    to the prior park reason, which was stale: the POSSE plumbing has SHIPPED.
    tactic-indieweb-syndication-markup landed and was pruned (ce03274a), so the
    prior sentence 'Blocked on tactic-indieweb-syndication-markup landing the
    metadata field' is false and nothing is gated on engineering. Live today:
    the syndication field on both PostMeta variants
    (packages/blog/src/post-types.ts:4-5, validated at :39-40), u-syndication
    'Also posted at' rendering (packages/blog/src/pages/Home.tsx:77-84), full
    h-entry microformats on the canonical surface, RSS feeds with discovery
    links, and rel=me (landing/src/site-config.ts:46 and
    fellspiral/src/site-config.ts:28, currently GitHub-only). What remains
    genuinely needs the author: choosing the target(s), holding the account, and
    posting. The residual mechanical tail, once a target and URLs exist, is
    about 10 lines across 3 files (append the profile URL to the two REL_ME
    constants; add syndication arrays to fellspiral/seeds/firestore.ts and
    landing/seeds/firestore.ts) and is already covered by existing tests, so it
    needs no tracked tactic of its own. blocked_by stays empty: the former
    blocker resolved, and neither tactic-join-indieweb (different surface,
    serves strategy-join-existing-practice) nor tactic-indieweb-audience gates
    this node."
  since: 2026-07-25
  recommendation: "Take this up in a requirement-discovery session, not an
    execution tick. Four open questions recorded at the 2026-07-25 review, each
    answerable in one sentence: (1) Which target? A single fediverse/Mastodon
    account is the smallest choice consistent with the strategy's
    account-free-reading condition, and its verified profile-links field
    completes rel=me in both directions, which also serves the web-sign-in note
    on tactic-join-indieweb. (2) One account for both surfaces, or split?
    commons.systems addresses tier-2 users and business while fellspiral is
    creative writing, so a merged feed will read as two voices — but splitting
    means two accounts to tend and two rel=me verifications. (3) How many of the
    four published posts to backfill? All four onto a new account reads as a
    spam burst to humans and instance moderators, and the strategy threshold is
    satisfied by syndication-with-canonical-links existing, not by exhaustive
    coverage. (4) Does syndication stay a manual publish-routine step?
    Automating it needs platform API credentials in CI, which reintroduces the
    platform dependency the strategy is shedding, for a saving of roughly two
    minutes per post at the current publishing rate. Backlog is static and not
    growing: four published posts (recovering-autonomy-with-coding-agents on
    landing; disciplinary-review-operations, scenes-from-a-hat, the-surreal on
    fellspiral), nothing published since 2026-04-02, none carrying a syndication
    array. Downstream tactic-own-audience-reading will report the
    syndication-with-canonical-links leg as uncovered until this is decided, so
    the node is load-bearing on strategy-own-audience's first reading rather
    than inert."
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
