---
id: tactic-rsi-graph-review
kind: tactic
statement: Build the RSI-family delegated-review batch function — the charter
  home for graph-digest, reading its check tables as strategy-graph-integrity's
  sensor and batch-reviewing Claude-owned (delegated) graph content
owner: ai
status: codified
parent: null
rationale: "Retained from the 2026-08-30 resolution round. The author's review
  split: /exetasis is for AUTHOR review (dispositions); the RSI family is for
  DELEGATED review (Claude-owned content). /align-audit is
  deprecated-and-removed (tactic-align-audit-retirement), which orphans two live
  artifacts this tactic re-homes: (1) strategy-graph-integrity's success_signal
  sensor — now the graph-digest check tables (deterministic, token-bounded,
  committed at packages/intentionsutil/scripts/graph-digest.ts with the pure
  module in src/digest.ts), to be read by this function when built;
  author-accepted: NO office-hours interim, the signal may lapse/regress until
  then; (2) the digest tooling's charter — this node is now the prose that owns
  the tool (maintenance, table extensions). Scope when refined: a batch skill
  that runs the digest, dispositions objective integrity findings (consistency,
  closure, parsimony — fix, draft a tactic, or record an exception), and
  batch-reviews delegated-state dispositions for quality drift; it never reviews
  author dispositions (that is /exetasis's queue). Distinct from the existing
  rsi/rsi-audit skills, which evaluate dispatch efficiency, not graph content."
reading: null
serves:
  - strategy-graph-integrity
  - strategy-recursive-self-improvement
recovers: []
clarifications:
  - question: Which node set does this function enumerate (drift review, 2026-08-30)?
    answer: "(Recorded 2026-08-30 /align-tactics per-node finalize.) Question: which
      node set does tactic-rsi-graph-review's 'Claude-owned (delegated) graph
      content' denote? Answer needed from the author — the node supplies three
      incompatible selectors and the graph records no ruling. Measured against
      the live store this round (python3 frontmatter scan over intentions/*.md):
      `owner: ai` selects 539 nodes; `status: delegated` selects 92; the two are
      perfectly disjoint — 0 of the 92 carry `owner: ai`, and all 92 carry
      `owner: human`; `kind: delegation` selects 22 records, the surface
      readDelegationRecords already reads
      (packages/intentionsutil/scripts/read-sensors.ts:948-989). So
      'Claude-owned (delegated)' is not one set under two names: the owner
      reading gives a 539-node Claude-owned surface, the status reading gives a
      disjoint 92-node surface that is entirely human-owned (the literal
      complement of 'Claude-owned'), and the kind reading gives a 22-record
      delegation portfolio. The three sources inside the node pull three ways —
      the statement toward the owner reading, the rationale toward the status
      reading ('batch-reviews delegated-state dispositions ... it never reviews
      author dispositions (that is /exetasis's queue)'), and the gather-phase
      reuse evidence toward the kind reading. Because the author drew the
      /exetasis (author dispositions) vs RSI-family (delegated dispositions)
      review split, which queue this function owns is an author ruling, not a
      Claude choice; picking wrong builds the batch reviewer over the wrong
      graph. Author to ratify one selector, or a named union of them, before the
      function's enumeration scope can be planned."
  - question: What stale cross-strategy pointer did the sensor re-homing leave?
    answer: "(Recorded 2026-08-30 /align-tactics per-node finalize.) A stale
      cross-strategy pointer survived the sensor reassignment, noted here so the
      repoint is not lost. tactic-owner-review-reading-pass-a (serves
      strategy-graph-drives-dispatch, born-parked, phase null) still names, at
      intentions/tactic-owner-review-reading-pass-a.md:80, item 7 of its
      office-hours reading list as 'strategy-graph-integrity — the /align-audit
      report'. That report's producer is deprecated-and-removed by
      tactic-align-audit-retirement, and strategy-graph-integrity's sensor
      re-homed to the graph-digest check tables read by this node. The human
      reading pass would therefore currently be pointed at a report no process
      produces. This is an observation, not a gate on this node's plan:
      reconciling item 7 belongs to reading-pass-a and its own serving strategy,
      and nothing in building the RSI-family batch function depends on it. If
      this node ever emits a report intended for the author's reading pass, that
      is the natural moment to repoint item 7 at it."
  - question: Which selector defines the review surface (finalize interview, 2026-08-31)?
    answer: "(Recorded 2026-08-31 finalize interview.) The author's ruling:
      brownfield migration concerns are accepted as delegated; in the greenfield
      the author recognizes no function for the node-level owner schema;
      conceptually this node's concerns may be either ratified or
      delegated/deferred dispositions - the implemented node's function may be
      autonomous delegated operations while ratified doctrine is recorded for
      how that is done. Delegated dispositions sit in BOTH review queues: this
      batch function is their primary quality-review home, and /exetasis keeps
      them as its lowest-priority re-confirmation lane per the ratified priority
      ordering. (decision: author-ratified, 2026-08-31) Claude's operational
      encoding: the batch review queue enumerates dispositions in the
      AI-overrulable states - delegated and deferred, per the overrule algebra
      recorded on strategy-explicit-intent (2026-08-31) - with ratified
      dispositions read-only context the review may flag to /exetasis but never
      overrule. Brownfield carriers of the delegated surface: explicit
      (decision: delegated, ...) stamps; the 92 status: delegated nodes as
      whole-node interim carriers; and unstamped content on AI-authored nodes
      treated delegated-by-default as an interim heuristic (not doctrine - owner
      has no ratified greenfield function). Mounts (kind: delegation) remain
      excluded per the 2026-08-30 mounts ruling; owner: ai as a SELECTOR is
      retired - the function is distinguished from rsi/rsi-audit by what it
      evaluates (graph content quality vs dispatch efficiency), not by node set.
      (decision: deferred, delegation-anthropic-claude, 2026-08-31)"
tooling_goals: []
success_signal: null
attention: null
phase: implement
execution: null
validates: []
blocked_by:
  - tactic-node-review-skill
superseded_by: []
supersession_expiry: null
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Build the RSI-family delegated-review batch function — the charter home for graph-digest, reading its check tables as strategy-graph-integrity's sensor and batch-reviewing delegated graph content

## Context

The charter is author-ratified and was never in dispute: /align-audit is
deprecated-and-removed (tactic-align-audit-retirement, phase implement), and
this node re-homes its two orphaned artifacts — strategy-graph-integrity's
success_signal sensor (now the graph-digest check tables,
`packages/intentionsutil/scripts/graph-digest.ts` with the pure module
`packages/intentionsutil/src/digest.ts`) and the digest tooling's charter. The
2026-08-30 park (review surface undefined, three disjoint selectors) was
resolved by the 2026-08-31 finalize interview at the DISPOSITION level, not as
a node-set selector: the batch review queue enumerates dispositions in the
AI-overrulable states — delegated and deferred, per the overrule algebra
recorded on strategy-explicit-intent (2026-08-31 clarification) — with
ratified dispositions read-only context that the review may flag to /exetasis
but never overrule. Delegated dispositions sit in BOTH queues
(author-ratified 2026-08-31): this function is their primary quality-review
home; /exetasis keeps them as its lowest-priority re-confirmation lane.
Brownfield carriers of the delegated surface (delegated to Claude): explicit
`(decision: delegated, ...)` stamps; `status: delegated` nodes as whole-node
interim carriers; unstamped content on AI-authored nodes treated
delegated-by-default as an interim heuristic. Mounts (`kind: delegation`)
are excluded (2026-08-30 mounts ruling). Distinct from the existing
rsi/rsi-audit skills by what it evaluates — graph content quality, not
dispatch efficiency.

This node is blocked_by tactic-node-review-skill: Units 2–3 below consume that
plan's Unit 1–2 artifacts (`reviewFingerprint`, `parseDispositions`), and the
stamp schema those units land is what makes the disposition surface
machine-readable. Unit 1 has no such dependency, but the node ships as one
build.

## Unit 1 — the /rsi-graph-review skill and the digest sensor re-home

**Recommended model:** opus

- New autonomous skill `.claude/skills/rsi-graph-review/SKILL.md` (park-to-
  office_hours contract per
  `.claude/skills/align-tactics/references/autonomy.md`; never
  AskUserQuestion). Its first phase runs the digest
  (`packages/intentionsutil/src/digest.ts` `renderTables`, 7 check tables) as
  strategy-graph-integrity's success_signal sensor reading, and dispositions
  every objective integrity finding (consistency, closure, parsimony): fix
  mechanically, draft a tactic node, or record an exception as a dated
  clarification.
- Charter prose in the skill: this node owns the digest tooling — maintenance
  and table extensions live here.
- Out of scope for this unit: the disposition queue (Units 2–3).

## Unit 2 — the delegated/deferred disposition enumerator

**Recommended model:** opus

Dependencies: tactic-node-review-skill Units 1–2 landed (carried by this
node's blocked_by edge).

- Enumerate the review queue with `parseDispositions` over the full corpus,
  filtered to state delegated or deferred; add the brownfield carriers —
  `status: delegated` nodes as whole-node queue items, and (behind an explicit
  opt-in flag, since it sweeps the entire AI-authored corpus) the
  delegated-by-default heuristic for unstamped content on AI-authored nodes.
- Rank ordering reuses the /exetasis priority function's axes (node rank,
  graph position, timestamp) with the category axis serving this queue's
  purpose: delegated first, deferred after (deferred items are primarily
  /exetasis's; this lane touches them only where execution-grade overrule is
  warranted).
- Mounts are excluded from the queue; mount-hosted decision stamps are
  reported through the same defect channel tactic-node-review-skill's plan
  defines (`mountDispositionDefects`), never ranked.

## Unit 3 — the batch review loop and overrule mechanics

**Recommended model:** opus

Dependencies: Unit 2.

- Per queued disposition: quality review against the digest's integrity lenses
  and the node's ancestry projection
  (`packages/intentionsutil/scripts/node-ancestry.ts`). Outcomes: leave
  (recorded pass), overrule, or flag-to-/exetasis (for findings adjacent to
  ratified content or carrying capture risk).
- Overrule writes follow the overrule algebra recorded on
  strategy-explicit-intent (2026-08-31): ANY AI overrule — of a delegated or a
  deferred disposition — produces a DEFERRED disposition, stamped
  `(decision: deferred, delegation-anthropic-claude, YYYY-MM-DD)`, entering
  the /exetasis queue; the superseded stamp survives in the record
  (clarifications append, never rewrite).
- The batch's findings land as dated clarifications and drafted tactic nodes
  via the write-node.ts → graph-commit path. If the batch emits an
  author-facing report, repoint
  `intentions/tactic-owner-review-reading-pass-a.md:80` item 7 at it (the
  stale /align-audit-report pointer recorded in this node's 2026-08-30
  clarification).

## Reuse

- `packages/intentionsutil/src/digest.ts` (`renderTables`, 7 check tables) and
  `packages/intentionsutil/scripts/graph-digest.ts` — read, never
  reimplement.
- tactic-node-review-skill's landed artifacts: `reviewFingerprint`,
  `parseDispositions`, the priority-function axes, `mountDispositionDefects`.
- `packages/intentionsutil/scripts/node-ancestry.ts` — ancestry projection for
  review context.
- `packages/intentionsutil/scripts/read-sensors.ts` `readDelegationRecords` —
  reused only to confirm mount exclusion and for the defect channel, never as
  the queue.
- `.claude/skills/align-tactics/references/autonomy.md` — the park model the
  skill inherits.

## Verification

```verify
node --import tsx/esm packages/intentionsutil/scripts/validate-graph.ts intentions
```

```verify
npm test --prefix packages/intentionsutil
```

Manual checks: run the skill once over the live store — the queue must contain
no `kind: delegation` records and no ratified-stamped dispositions; an
overrule write must produce a deferred stamp with the superseded stamp still
present; the digest reading must appear in the run report as
strategy-graph-integrity's sensor value.
