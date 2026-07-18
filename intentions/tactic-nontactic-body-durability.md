---
id: tactic-nontactic-body-durability
kind: tactic
statement: "Resolve the non-tactic node body durability contract: writeNode
  regenerates strategy/kind/delegation/virtue bodies from `statement` (only
  tactic bodies persist), while the kind-strategy body-function rule
  (2026-07-09) and its consumers author durable content into non-tactic bodies —
  pick one contract and enforce it store-side"
owner: ai
status: raw
parent: null
rationale: Surfaced at dispatch tick +6 (2026-07-11) by
  tactic-calibration-event-registry, which could not author its
  calibration-event convention into a strategy body because store.ts writeNode
  regenerates every non-tactic body from statement. The graph carries two
  conflicting recorded doctrines about non-tactic bodies and the store silently
  arbitrates one; reconciling them amends recorded doctrine, so it is an author
  decision parked for office hours.
reading: null
gap: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications:
  - question: Which non-tactic body-durability contract is adopted, and is it
      implemented?
    answer: "Greenfield ratified by the author at office hours (2026-07-18): ALL
      node bodies are durable, authoritative content; statement is the one-line
      frontmatter summary. store.ts drops the kind gate (readExistingTacticBody
      -> readExistingBody, assertNoTacticBodyLoss -> a kind-agnostic
      assertNoBodyLoss) so writeNode preserves every kind body verbatim and
      regenerates the placeholder only for a brand-new file. Shipped on PR #2890
      (phase review). The tactic-graph-native-dispatch cosmetic-render body
      doctrine is amended to durable-for-all-kinds in the same landing. Blocked
      consumers tactic-calibration-event-registry, tactic-mount-schema, and
      tactic-graph-native-dispatch-fold unblock when #2890 merges."
tooling_goals: []
success_signal: null
attention: null
phase: review
execution:
  branch: tactic-nontactic-body-durability
  pr: 2890
  attempts: {}
  markers: []
  strategy_fingerprint: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# tactic-nontactic-body-durability

## Context

`store.ts` `writeNode` regenerates a node's markdown body from its `statement`
on every write for every kind EXCEPT `tactic` (`readExistingTacticBody` gates on
`node.kind === "tactic"`; `assertNoTacticBodyLoss` only catches tactic→non-tactic
kind changes, not same-kind rewrites). Real tooling round-trips non-tactic nodes
through `writeNode`: `reconcile-graph.ts` writes strategy nodes, `read-sensors.ts`
writes any node on a reading/gap update, and `park-node`, `apply-node-transition`,
and `graph-commit`'s office_hours fallback rewrite whatever node they are handed.
So any durable content authored into a strategy / kind / delegation / virtue body
is silently erased on the next reconcile, sensor read, park, or transition.

Surfaced at dispatch tick +6 (2026-07-11): `tactic-calibration-event-registry`
could not author its calibration-event convention into `strategy-external-calibration`'s
body (its element 4 updates the reading via `write-node.ts`, which would erase the
whole `## Calibration events` doctrine) and parked office_hours.

## The conflict to resolve

Two recorded doctrines disagree, and the store silently enforces one:

- **kind-strategy body-function rule (2026-07-09)** — settled design notes / router
  mechanism belong in the strategy node body (durable). Cited at
  `strategy-external-calibration:72`; relied on by `tactic-calibration-event-registry`,
  `tactic-mount-schema` (mount-anchor body sections on `kind: kind` nodes), and
  `tactic-graph-native-dispatch-fold` (folds router mechanism into the strategy body).
- **tactic-graph-native-dispatch doctrine** — "the body remains a cosmetic render for
  virtues, strategies, and delegations, but is authoritative content for tactics." The
  store implements exactly this.

Pick ONE contract and make the store enforce it.

## Greenfield (recommended): all node bodies durable

Ideal design, independent of migration cost: ONE rule — every node body is
authoritative, durable content; `statement` is the required one-line frontmatter
summary and the body is the long form for every kind. This honors the more recent
(2026-07-09) body-function rule and all three consumers with no relocation, and
deletes the kind-conditional special case in the store. Implementation: generalize
`readExistingTacticBody` → `readExistingBody` (drop the `kind === "tactic"` gate),
generalize `assertNoTacticBodyLoss` to guard any non-placeholder body, and amend
the tactic-graph-native-dispatch "cosmetic render" clarification to durable-for-all.
Single callsite per `tactic-fingerprint-recipe-single-callsite`.
Recommended model: opus.

## Alternative (option B): non-tactic bodies stay cosmetic, enforced

Non-tactic bodies remain statement-derived renders (single source of truth, no
body/statement drift). Then: (a) add a store guard that ERRORS when a non-tactic
node being written carries a non-placeholder body (surface the silent loss); (b)
relocate the three consumers' durable content to body-safe homes (structured
frontmatter fields, a dedicated tactic body, or a package doc); (c) retire /
reinterpret the kind-strategy body-function rule. Larger migration; keeps
`statement` as the single source of truth. Recommended model: opus.

## Affected consumers (blocked_by this tactic)

- `tactic-calibration-event-registry` — parked; align re-scope pending this decision.
- `tactic-mount-schema` — demoted qa→implement tick +6; re-implements its
  mount-anchor-content approach against the resolved contract.
- `tactic-graph-native-dispatch-fold` — draft; its strategy-body fold target
  depends on the decision.

## Verification

Greenfield A: `writeNode` round-trips a strategy body without loss (unit test);
`reconcile-graph` / `read-sensors` preserve an edited strategy body.
Option B: `writeNode` errors on a non-placeholder non-tactic body; the three
consumers land their content in body-safe homes; `validate-graph` green.
