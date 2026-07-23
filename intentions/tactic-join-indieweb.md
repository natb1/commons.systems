---
id: tactic-join-indieweb
kind: tactic
statement: Begin sustained participation in IndieWeb, local-first, and
  self-hosting community venues, log each event, and produce
  strategy-join-existing-practice's first reading
owner: human
status: delegated
parent: null
rationale: "Finalized 2026-07-11 by /align-tactics round 1 from the
  /align-strategy-retained draft of the same id. Participation, not
  audience-building: show up in the existing communities whose virtues already
  align (IndieWeb events, local-first venues, self-hosting forums) and route any
  challenge that lands back through strategy-external-calibration. Born-parked
  per Step 4: showing up is the author's life activity, and venue fit plus the
  participant-not-promoter posture are owner judgment, not claude-executable.
  Its reading-production half runs after tactic-participation-log-instrument
  lands (blocked_by), though attending events and hand-noting them can begin
  immediately. Completing this tactic completes the round: it writes the
  strategy's first reading."
reading: null
gap: null
serves:
  - strategy-join-existing-practice
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: null
execution:
  branch: tactic-join-indieweb
  pr: null
  attempts: {}
  markers: []
  strategy_fingerprint: ad4311f339fb4ca9e66a660b49ffa583735eb4d6c3af4bca3a1302f169a38a3b
validates:
  - strategy-join-existing-practice
blocked_by:
  - tactic-participation-log-instrument
office_hours:
  reason: "Born-parked human tactic: sustained participation in existing
    practitioner communities needs the author in person — venue fit and the
    participant-not-promoter posture are owner judgment, and showing up cannot
    be delegated. The office-hours ask is chunked to ~15-20 minutes per visit:
    first visit picks one venue and calendars its next event; a later visit
    (after tactic-participation-log-instrument lands and at least one event is
    logged) runs the review and stamps the strategy's first reading."
  since: 2026-07-11
  recommendation: "Visit 1 (~15 min): pick one venue and calendar its next event —
    IndieWeb: Homebrew Website Club via events.indieweb.org, chat via
    chat.indieweb.org (web sign-in as commons.systems already works: the landing
    head carries rel=me to the GitHub profile, packages/blog/src/seo.ts:110);
    local-first: the localfirstweb.dev community and its meetups; self-hosting:
    an established platform-free forum. Attend as a participant, not a promoter.
    After each event append {date, venue, activity, challenge} to
    attributes.participation_log on strategy-join-existing-practice
    (dump-node.ts, edit the JSON, write-node.ts, graph-commit). Participation
    can begin before the instrument merges. Visit 2 (~15-20 min, once
    tactic-participation-log-instrument has landed and at least one event is
    logged): run npx tsx
    packages/intentionsutil/scripts/participation-review.ts, stamp the
    strategy's first reading and gap honestly (recurrence not yet demonstrable
    in round 1 is expected), route any received challenge to
    strategy-external-calibration as a dated clarification there, stamp rounds
    {count: 1, last_completed: <date>} on the strategy, and set this tactic's
    phase: done."
pace_exempt: false
rounds: null
attributes: {}
---
# Begin sustained participation in IndieWeb, local-first, and self-hosting community venues, log each event, and produce strategy-join-existing-practice's first reading

Born-parked human tactic (/align-tactics Step 4 shape): no implement-phase
plan — the work is the author's. Finalized 2026-07-11 from the
/align-strategy-retained draft of the same id; the draft's substance
(participation, not audience-building; route challenges back through
strategy-external-calibration) is carried in the rationale and below.

## What to do (each office-hours visit ~15-20 author-minutes)

1. **Visit 1 — pick a venue and calendar the first event.** IndieWeb:
   Homebrew Website Club via events.indieweb.org, text chat via
   chat.indieweb.org — web sign-in as commons.systems already works (the
   landing head carries `rel=me` to the GitHub profile,
   `packages/blog/src/seo.ts:110`). Local-first: the localfirstweb.dev
   community and its meetups. Self-hosting: an established platform-free
   forum. One venue is enough to start; the strategy's condition keeps every
   venue reachable without engagement platforms.
2. **Attend as a participant, not a promoter** — join the conversation the
   community is having; selection-over-conversion applied to oneself is the
   strategy's whole premise. Event attendance happens on the author's
   calendar, outside office-hours.
3. **Log each event.** Append `{date, venue, activity, challenge}` to
   `attributes.participation_log` on
   `intentions/strategy-join-existing-practice.md` (dump via
   `packages/intentionsutil/scripts/dump-node.ts`, edit the JSON, rewrite via
   `packages/intentionsutil/scripts/write-node.ts`, land via
   `packages/intentionsutil/scripts/graph-commit`). `challenge` records any
   calibration challenge a community member raised; null when none arrived.
   Logging can begin before the instrument merges — the convention is already
   recorded on the strategy.
4. **Visit 2 — produce the first reading** (after
   `tactic-participation-log-instrument` lands and at least one event is
   logged): run
   `npx tsx packages/intentionsutil/scripts/participation-review.ts`, stamp
   the strategy's first `reading` and `gap` honestly (recurrence across
   review cycles is not demonstrable in round 1 — say so in the gap), route
   any received challenge to `strategy-external-calibration` as a dated
   clarification there, stamp `rounds: {count: 1, last_completed: <date>}` on
   the strategy (bootstrap: by hand, per tactic-graph-native-dispatch §1.1),
   and set this tactic's `phase: done` — this tactic is the round's final
   tactic.

## Why human

Showing up in a community cannot be delegated: the strategy joins people
whose virtues already align as a co-legislator, not through a proxy — an
agent participating under the author's name would be exactly the
conversion-shaped move the strategy rejects. Venue fit and the
participant-not-promoter posture are owner judgment per event. The
practitioner-directed campaigning half of this surface stays with
tactic-practitioner-channels (parked, gated on tier 3); participation itself
is deliberately ungated under this strategy.
