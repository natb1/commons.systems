---
id: tactic-rsi-graph-review
kind: tactic
statement: Build the RSI-family delegated-review batch function — the charter
  home for graph-digest, reading its check tables as strategy-graph-integrity's
  sensor and batch-reviewing Claude-owned (delegated) graph content
owner: ai
status: raw
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
tooling_goals: []
success_signal: null
attention: null
phase: null
execution: null
validates: []
blocked_by: []
office_hours:
  reason: "Requirement ambiguity blocks authoring this node's plan: the batch
    function's review surface is undefined. 'Claude-owned (delegated) graph
    content' resolves to three incompatible selectors, measured against
    intentions/ this round — `owner: ai` (539 nodes), `status: delegated` (92
    nodes, perfectly disjoint from owner:ai and entirely owner:human), or `kind:
    delegation` (22 records, already read by readDelegationRecords at
    packages/intentionsutil/scripts/read-sensors.ts:948-989). The statement, the
    rationale, and the reuse evidence each point at a different one, and neither
    this node nor strategy-graph-integrity records a ruling. Since the author
    drew the /exetasis (author dispositions) vs RSI-family (delegated
    dispositions) split, which queue this function enumerates is an author
    ruling, not a Claude choice — and the sets are disjoint, so a wrong guess
    builds the reviewer over the wrong graph rather than a merely larger one.
    Awaiting author ratification of the proposed clarification: 'which node set
    does Claude-owned (delegated) graph content denote?' — one selector, or a
    named union. Nothing else blocks: no strategy condition failed, the sensor
    re-homing and the author-accepted no-office-hours-interim signal lapse are
    already recorded on the strategy (2026-08-30 resolution round), and the
    digest reuse surface (packages/intentionsutil/src/digest.ts renderTables, 7
    check tables) is identified and ready to read rather than reimplement.
    Recommend (Claude, from the ratified record): the review surface is
    delegated-STATE content — the 92 status: delegated nodes today, plus
    delegated-stamped dispositions ((decision: delegated, ...)) once the stamp
    schema lands — NOT owner: ai (dispatch work products, the existing
    rsi/rsi-audit territory) and NOT kind: delegation records (mounts, which the
    2026-08-30 mounts ruling excludes from disposition review entirely). Ratify
    one selector or a named union, then re-run /align-tactics
    tactic-rsi-graph-review."
  since: 2026-08-30
  recommendation: null
  session_type: other
pace_exempt: false
rounds: null
attributes: {}
---
# Build the RSI-family delegated-review batch function — the charter home for graph-digest, reading its check tables as strategy-graph-integrity's sensor and batch-reviewing Claude-owned (delegated) graph content

## Parked 2026-08-30 — the review surface is undefined, three disjoint selectors

The charter itself (digest ownership, sensor home, the exetasis/RSI split) is
author-ratified and unchallenged. What blocks planning is the enumeration
scope: which node set is the batch function's review queue. Measured this
round and independently re-verified: owner: ai selects 539 nodes; status:
delegated selects 92 nodes, every one owner: human, intersection with
owner: ai exactly 0; kind: delegation selects the 22 mount records that
readDelegationRecords already reads. The statement pulls toward the owner
reading, the rationale toward the status/stamp reading, the reuse evidence
toward the kind reading — and the sets are disjoint, so a wrong guess builds
the reviewer over the wrong graph.

The office_hours reason carries Claude's recommendation (the
delegated-state reading: status: delegated nodes today plus delegated-stamped
dispositions once the stamp schema lands, with mounts excluded by the
2026-08-30 mounts ruling and owner: ai left to the dispatch-efficiency
skills). The clarifications carry the full measured selector breakdown and a
stale cross-strategy pointer the sensor re-homing left on
tactic-owner-review-reading-pass-a (its office-hours reading list still sends
the author to the retired /align-audit report).
