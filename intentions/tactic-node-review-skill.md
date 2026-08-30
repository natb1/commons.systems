---
id: tactic-node-review-skill
kind: tactic
statement: Build the /node-review skill and the virtual review node — a derived,
  rank-ordered review target over durable-layer nodes un-reviewed since they
  last changed, with a per-node reviewed stamp
owner: ai
status: raw
parent: null
rationale: "Retained from the 2026-08-30 /align interview that added the
  indifference option to the interview round. The graph now records the doctrine
  (strategy-graph-review-curriculum's 2026-08-30 virtual-review-node
  clarification, and the amended conditions and success_signal); this tactic
  carries the encoding. Two-entry serves is the honest cross-cutting case (the
  artifact-owner rule, strategy-graph-native-dispatch clarification 27): the
  sitting skill is a curriculum artifact, but the derived rank-ordered candidate
  is router selection machinery, which strategy-graph-native-dispatch owns. The
  author flagged at the interview that this 'likely requires new mechanisms' —
  the router selects stored nodes today."
reading: null
serves:
  - strategy-graph-review-curriculum
  - strategy-graph-native-dispatch
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
# Build the /node-review skill and the virtual review node — a derived, rank-ordered review target over durable-layer nodes un-reviewed since they last changed, with a per-node reviewed stamp

Retain-not-refine draft from the 2026-08-30 /align interview. Not a plan — an
`/align-tactics` round decomposes this, and should expect to **split it**: the
three artifact pieces below have different owners and different risk.

## What the doctrine asks for

Recorded on `strategy-graph-review-curriculum` (2026-08-30 clarification "How is
the next review sitting selected, and what mints review nodes?"), with the
amended conditions and `success_signal` on the same node:

- **One virtual review node.** It always exists, is *derived* rather than
  stored, always carries the rank of the highest-ranked durable-layer node not
  reviewed since it last changed, and points at that node. No review node is
  created, ranked, or retired per target — this is the whole point: it replaces
  N born-parked nodes with one derived fixture.
- **Rank resolves live at selection time**, so it can never go stale.
- **Ancestry-first.** Reviewing a node reviews its un-reviewed ancestors first,
  root-first, then the node.
- **Change-gate.** A node needs no further review, as leaf or as ancestor,
  unless it changes. An ancestor changing does *not* dirty its descendants;
  consequences propagate by the reviewer amending a descendant, which changes
  it, which re-enrolls it.
- **Fold-in.** When the review runs for a node that also carries pending
  review-later deferral nodes, those fold into the same session.
- **One sitting covers both content classes** — author-owned doctrine and
  delegated/deferred content. Modes A and B survive as names for what the author
  collects beforehand, not as separate enrollment paths.

## Three artifact pieces

1. **The `/node-review` skill** — the sitting itself. Curriculum artifact.
   Sibling of `/reading-review` (which runs reading and dialog chunks); it is
   *not* `/align-review`, which is already claimed by
   `tactic-align-review-skill` for adversarial review of drafts at record time.
   The name `/node-review` is a Claude-owned choice under the 2026-08-30 floor
   (naming sits below it) — revise it freely if a better one appears.
2. **The derived candidate projection** — router selection machinery. The
   router selects *stored* nodes today, which is the new mechanism the author
   flagged. Sittings are human office-hours work, so the intended reading is
   that this node ranks the **office-hours queue**, not the autonomous dispatch
   queue; that too is a Claude-owned choice under the floor, recorded here
   rather than as strategy doctrine. It matters: if it ranked the autonomous
   queue, a freshly-bootstrapped graph where nothing is reviewed would have the
   review target outranking all work.
3. **The per-node reviewed stamp** — what makes "un-reviewed since it last
   changed" decidable. Needs a content-keyed marker, not just a date. The
   `{hash, sha}` shape already used by `execution.strategy_fingerprint` is the
   obvious precedent, with `isFingerprintStale`
   (`packages/intentionsutil/src/transitions.ts`) as the staleness predicate to
   mirror. `coverage.ts`'s `lastReviewedOf` and `readingDate()`
   (`packages/intentionsutil/src/router.ts`) are the existing date-only
   machinery this would supersede or extend.

## Bootstrap consequence to plan for

Every durable-layer node starts un-reviewed, so the backlog begins at full graph
size and the `success_signal`'s "top rank trends down across cycles" threshold
has no useful reading until several cycles have run. A round should decide
whether to seed the stamps from existing review evidence (reading chunks
completed, dated clarifications) or to accept a cold start and say so.

## Stale reference found this round

`.claude/skills/align/SKILL.md` cites `tactic-review-curriculum-coverage-sensor`
twice as the sensor deriving curriculum-frontier linkage by id-matching. That
node no longer exists in `intentions/`. Since the review-debt signal replaces the
coverage table it fed, the fix is part of this work rather than a separate node.
