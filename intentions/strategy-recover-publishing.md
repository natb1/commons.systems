---
id: strategy-recover-publishing
kind: strategy
statement: Publish creative work on owned infrastructure, IndieWeb-style
owner: human
status: codified
parent: strategy-recover-author-autonomy
rationale: >-
  Adopt IndieWeb principles for the producer side of the attention economy:
  creative work is published on owned domains — fellspiral, the author's
  tabletop game blog, and the landing blog, both running the shared
  @commons-systems/blog package — never platform-first through
  engagement-optimized services (delegation-social-publishing). The same move
  guards itself: hosted blog platforms would re-import the capture IndieWeb
  principles exist to escape, so self-hosting is what keeps the adoption
  capture-free — that standing, refused alternative is recorded at
  delegation-hosted-publishing.


  Publishing this way also answers to virtue-respect-for-persons: an owned site
  carries no engagement machinery, so it never annexes a reader's attention the
  way it refuses to have the author's annexed. Fellspiral doubles as
  show-not-tell dogfood of the blog package (strategy-show-not-tell) and is the
  venue for strategy-tabletop-storytelling.
reading: null
gap: null
serves:
  - virtue-progressive-detachment
  - virtue-respect-for-persons
recovers:
  - delegation-social-publishing
clarifications:
  - question: Where does published content authoritatively live?
    answer: "In git: post bodies are markdown committed to the repo, and a typed TS
      seed is the single build-time source for prerender, RSS, sitemap, and the
      Firestore metadata mirror — publishing is a git commit, export is git
      clone. Firestore holds only a read-only metadata mirror plus draft-preview
      convenience (runtime draft bodies fetched from raw.githubusercontent.com
      and DOMPurify-sanitized); losing it loses nothing public, and
      drafts-via-branch-previews would remove the runtime database from the blog
      entirely if that convenience ever costs more than it gives. Recorded
      2026-07-07 interview."
  - question: Do readers ever have accounts?
    answer: No — the entire auth surface exists for one flow, the author's /admin
      draft view (admin group membership). Readers connect by feed with zero
      account, zero reader data collection beyond analytics, and zero engagement
      machinery — the respect-for-persons posture stated in the rationale, now
      recorded as a standing product boundary rather than an accident of scope.
      Recorded 2026-07-07 interview.
  - question: What license does the published content carry?
    answer: CC-BY-SA 4.0, footer-marked with attribution to the generator repo —
      share-alike resists enclosure of the content just as copyleft does for
      code. The content license is a distinct decision from the code license
      recorded under strategy-open-source-as-gift. Recorded 2026-07-07
      interview.
  - question: Why does recovers not include delegation-hosted-publishing?
    answer: "A declined delegation is never a recovers target (kind-delegation's
      abstention doctrine, 2026-07-09): hosted publishing was never entered, so
      there is nothing to unwind — the guard relationship this rationale
      describes lives in prose here and on the record itself, and the edge
      recorded until 2026-07-09 overstated it. recovers keeps
      delegation-social-publishing, an entered attachment this strategy's work
      actually unwinds. Recorded 2026-07-09 interview."
tooling_goals: []
success_signal:
  observable: creative output lands on owned domains; platform posts are at most
    syndicated copies
  sensor: owner review at office-hours
  threshold: no piece is platform-first and no piece requires a platform account to read
  is_proxy: false
attention: null
phase: null
execution: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes:
  conditions:
    - self-hosting stays cheap and low-maintenance (static sites, the shared
      blog package)
---
# Publish creative work on owned infrastructure, IndieWeb-style
