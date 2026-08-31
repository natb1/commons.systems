---
id: tactic-keystone-decomposition-reorg
kind: tactic
statement: Re-organize the keystone cluster under the decomposition corollary —
  test each keystone node for motivation-coherence (materially different
  motivation profiles decompose; matching profiles may merge) now that
  sustenance has a first-class home
owner: ai
status: codified
parent: null
rationale: "Retained from the 2026-08-30 /align sustenance round (landed
  b51df73f), recorded at the author's direction. That round minted
  virtue-right-livelihood (ratified) and virtue-knowledge-as-gift
  (delegated-pending-review) and re-homed strategy-financial-sustainability's
  serves onto the livelihood root — which means the keystone cluster's
  motivation profiles changed shape after most of its nodes were composed.
  strategy-graph-mounts' decomposition corollary (author-ratified) keys node
  granularity on motivation-coherence: decompose a node when its decisions would
  carry materially different motivation profiles (a different serves set or
  different graft constraints); compose or merge only when profiles match.
  Nothing has yet applied that test to the cluster the corollary now governs.
  Two-entry serves per the artifact-owner rule: the corollary is
  strategy-graph-mounts doctrine, but the keystone record it re-organizes is
  strategy-explicit-intent's substance."
reading: null
serves:
  - strategy-graph-mounts
  - strategy-explicit-intent
recovers: []
clarifications:
  - question: What stale vocabulary does the draft body carry (drift review, 2026-08-30)?
    answer: "(Recorded 2026-08-30 /align-tactics tactic-mode drift review —
      body-vocabulary correction.) The draft body's two references to
      virtue-knowledge-as-gift as \"delegated-pending-review\" (in the rationale
      and in the Constraints paragraph) are pre-resolution-round vocabulary.
      Measured at HEAD 2026-08-30, `grep -n '^status:'
      intentions/virtue-knowledge-as-gift.md` returns `status: deferred` — the
      2026-08-30 resolution round migrated delegated-pending-review to deferred
      (strategy-explicit-intent.md clarification 24, line 747). The constraint's
      substance is unaffected: the node is unratified, and this tactic must not
      ratify, restate, or pre-empt its content. Sibling
      tactic-substantiation-edge-migration (status raw, phase null) already
      names this node at
      intentions/tactic-substantiation-edge-migration.md:25,43 as within its
      legacy-vocabulary sweep, so the finalize should spell the status
      `deferred` rather than leave a second file for that sweep."
  - question: Are the [SECONDARY-SERVES] pointer's clarification indices 18/21/24
      correct (drift review, 2026-08-30)?
    answer: "(Recorded 2026-08-30 /align-tactics tactic-mode drift review — pointer
      verification, refuting a suspected drift.) A gather-phase pass suspected
      the [SECONDARY-SERVES] pointer's citation of strategy-explicit-intent
      clarifications \"18, 21, 24\" was off by one (counted as 19/22/25).
      Re-measured at HEAD by counting `  - question:` entries inside the
      clarifications block only: entry 18 is at line 539 (the three-state
      decision model), entry 21 at line 660 (the substantiation doctrine), entry
      24 at line 747 (the 2026-08-30 resolution-round ledger). The cited indices
      are CORRECT; the suspected off-by-one came from counting question markers
      outside the clarifications array. A planner following those pointers
      should use 18/21/24 as written and not renumber them."
  - question: What existing tooling serves the corollary's serves-set half (drift
      review, 2026-08-30)?
    answer: (Recorded 2026-08-30 /align-tactics tactic-mode drift review — reuse
      roster for whoever plans this node.) The corollary's serves-set half is
      machine-readable today and should not be hand-derived.
      packages/intentionsutil/scripts/node-ancestry.ts:47-53 renders a node's
      serves chain and ancestor virtue roots (AncestorEntry at :99-111) — the
      two things the corollary tests;
      .claude/skills/align-tactics/SKILL.md:96-99 already runs it on the claimed
      node at worktree entry.
      packages/intentionsutil/scripts/align-strategy-census.ts:63-75
      (printUnservedVirtues) checks set-difference over every strategy's serves
      versus the virtue set, catching a virtue left unserved by a decompose or
      merge. packages/intentionsutil/src/digest.ts:202-217 (tableDupServes)
      mechanically detects a node re-declaring a parent-inherited serves entry —
      the merge-candidate half; :251-273 (tableNearDup) shortlists similar
      statements, and its own comment at :247-248 is explicit that this is "a
      shortlist for the audit's human disposition, never a disposition itself",
      matching this node's own "record the pass as an explicit
      motivation-coherence finding rather than silence".
      packages/intentionsutil/src/digest.ts:144-184 (tableClosure) verifies
      every affected node still reaches a kind:virtue root after any
      disposition. Per .claude/rules/sandbox.md, spell these `node --import
      tsx/esm <script>`, not `npx tsx`.
  - question: What is the keystone cluster's membership (finalize interview, 2026-08-31)?
    answer: "(Recorded 2026-08-31 finalize interview.) 'Keystone' is informal
      vocabulary the author used for ancestor nodes whose changes would
      potentially have cascading effects on the graph. There is no fixed roster:
      inclusion is a judgment call that depends on the topography of the graph.
      (decision: author-ratified, 2026-08-31) The plan therefore carries an
      operational criterion - ancestor nodes selected by measured blast radius
      over the parent+serves relations - evaluated at execution time, with the
      four repeatedly-named nodes (virtue-right-livelihood,
      virtue-knowledge-as-gift, strategy-financial-sustainability,
      strategy-open-source-as-gift) the expected core but not a bound."
  - question: Is the deliverable findings-only or restructuring (finalize interview,
      2026-08-31)?
    answer: "(Recorded 2026-08-31 finalize interview; supersedes the findings-only
      reading of this node's Constraints paragraph.) The plan must outline
      restructuring, with execution steps that re-evaluate the structure at
      execution time to account for drift since planning. (decision:
      author-ratified, 2026-08-31) Bounded by the overrule algebra recorded on
      strategy-explicit-intent the same day: restructures that overrule
      delegated or deferred dispositions are executed by AI with every
      superseding disposition stamped deferred (entering the /exetasis queue); a
      restructure that would overrule a RATIFIED disposition still routes
      through interview (/align) - no execution or rsi session may overrule
      ratified content."
  - question: How does the graft half sequence against the unlanded mount schema
      (finalize interview, 2026-08-31)?
    answer: "(Recorded 2026-08-31 finalize interview.) Delegated to Claude as a
      brownfield migration detail, with the author's directive to prioritize
      integrity and efficiency of execution. Claude's exercise: run now on the
      serves half; mount/graft-adjacent findings and restructures carry an
      explicit provisional-pending-mount-structure caveat and are re-checked by
      the execution-time drift re-evaluation step; no blocked_by edge on
      tactic-mount-schema, so the serves-half work is not serialized behind an
      unlanded sibling. (decision: delegated, delegation-anthropic-claude,
      2026-08-31)"
tooling_goals: []
success_signal: null
attention: null
phase: implement
execution: null
validates: []
blocked_by: []
superseded_by: []
supersession_expiry: null
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Re-organize the keystone cluster under the decomposition corollary — test each keystone node for motivation-coherence now that sustenance has a first-class home

## Context

strategy-graph-mounts' DECOMPOSITION COROLLARY (author-ratified) keys node
granularity on motivation-coherence: decompose a node when its decisions would
carry materially different motivation profiles (a different serves set or
different graft constraints); compose or merge only when profiles match. The
2026-08-30 sustenance round (landed b51df73f) changed the cluster's motivation
topology after most of its nodes were composed — sustenance gained a
first-class home (virtue-right-livelihood, ratified), virtue-knowledge-as-gift
entered `status: deferred`, and strategy-financial-sustainability's serves was
re-homed onto the livelihood root — so nodes composed earlier were shaped
without the corollary's test being runnable.

The 2026-08-30 park was resolved by the 2026-08-31 finalize interview (three
clarifications on this node): "keystone" is informal vocabulary for ancestor
nodes whose changes would potentially cascade — no fixed roster, membership is
a topology-dependent judgment call made at execution time; the deliverable is
a restructuring outline whose execution steps re-evaluate the structure at
execution time to account for drift since planning (superseding the
findings-only reading of the Constraints below); and graft-half sequencing is
delegated — run now on the serves half, mount/graft-adjacent work carrying an
explicit provisional-pending-mount-structure caveat, no blocked_by on
tactic-mount-schema.

Constraints that still bind:

- virtue-knowledge-as-gift is `status: deferred` (unratified): this tactic
  must not ratify, restate, or pre-empt its content — structural re-homing
  that depends on its resolution waits for the sitting (candidate 2 below
  records the dependency; it does not discharge it).
- The overrule algebra (strategy-explicit-intent, 2026-08-31 clarification)
  bounds execution: restructures overruling delegated or deferred dispositions
  are executed here, every superseding disposition stamped
  `(decision: deferred, delegation-anthropic-claude, YYYY-MM-DD)`; a
  restructure that would overrule a RATIFIED disposition routes to /align and
  is never executed by this tactic.
- Read the three-state decision model and stamp grammar on
  strategy-explicit-intent at origin/main before touching any stamped content.

## Unit 1 — keystone selection by measured topography

**Recommended model:** opus

- Compute a per-node blast-radius measurement over the `parent` + `serves`
  relations across the virtue/strategy layers: transitive descendant count and
  serves fan-in (how many nodes' motivation chains pass through this one).
  Emit a ranked shortlist with the measurement recorded.
- Select the review set by judgment over that measurement — the four
  repeatedly-named nodes (virtue-right-livelihood, virtue-knowledge-as-gift,
  strategy-financial-sustainability, strategy-open-source-as-gift) are the
  expected core, but the measurement decides, not the list (2026-08-31 roster
  clarification).
- Record the selected set and the criterion as a dated clarification on this
  node at execution time.
- Reuse: `packages/intentionsutil/scripts/node-ancestry.ts:47-53` (serves
  chain and ancestor roots; `AncestorEntry` at `:99-111`),
  `packages/intentionsutil/src/digest.ts:144-184` (`tableClosure`),
  `packages/intentionsutil/scripts/align-strategy-census.ts:63-75`
  (`printUnservedVirtues`).

## Unit 2 — corollary test and restructuring outline per selected node

**Recommended model:** opus

Dependencies: Unit 1.

- For each selected node, run the motivation-coherence test on the serves
  half: do its decision classes share one motivation profile (one serves set),
  or do materially different profiles hide inside it? Graft-constraint aspects
  carry the provisional-pending-mount-structure caveat (2026-08-31 sequencing
  clarification) — the graft half has no landed structure yet.
- The retained draft's four candidate examinations seed the test (each is a
  test, not a foregone split):
  1. strategy-financial-sustainability's mixed serves — livelihood-driven
     monetization decisions versus alignment-driven attachment management may
     carry materially different profiles; if they do, decompose; if they
     genuinely travel together, record the pass explicitly.
  2. The gift clause's home — the knowledge-should-be-free clause shadows
     strategy-financial-sustainability while virtue-knowledge-as-gift is
     unresolved; test where the constraint belongs once the sitting resolves
     it (record the dependency, do not discharge it).
  3. Pre-livelihood serves sweep over the Unit 1 selected set — nodes whose
     rationale smuggles sustenance motivation inside an instrumental framing
     ("fund the project" phrasing is the marker) now have a first-class virtue
     to cite; re-point or decompose per the corollary.
  4. Merge direction — two selected nodes carrying the same motivation
     profile are merge candidates; keeping them separate needs a reason the
     corollary can see.
- Output per node: a finding, and where the test says decompose / merge /
  re-point, a concrete restructuring step (which edges move, which nodes
  split or merge, which text moves) tagged with its disposition-state check:
  delegated/deferred-overrulable (execute in Unit 3) or ratified-touching
  (route to /align).
- Record every finding — passes included — as dated clarifications on the
  affected nodes ("record the pass rather than silence").
- Reuse: `packages/intentionsutil/src/digest.ts:202-217` (`tableDupServes`,
  the merge-candidate half) and `:251-273` (`tableNearDup`, a shortlist for
  disposition, never a disposition itself — its own comment at `:247-248`).

## Unit 3 — execute the delegated restructures behind the drift re-evaluation gate

**Recommended model:** opus

Dependencies: Unit 2.

- Before executing each step, re-evaluate it against then-current origin/main
  (the author's execution-time re-evaluation ruling): re-run the Unit 1
  measurement for the affected nodes and the Unit 2 test for the step; a step
  whose premise drifted is re-derived or dropped with the drop recorded.
- Execute only steps whose overruled dispositions are delegated or deferred;
  stamp every superseding disposition deferred (overrule algebra). Compile
  ratified-touching steps into an /align hand-off list recorded on this node —
  never executed here.
- All writes via `packages/intentionsutil/scripts/write-node.ts` →
  `graph-commit`; validate-graph green after each landed batch; spell scripts
  `node --import tsx/esm`, never `npx tsx` (.claude/rules/sandbox.md).

## Reuse

- `packages/intentionsutil/scripts/node-ancestry.ts` — ancestry projection
  and serves chains (`:47-53`, `AncestorEntry :99-111`).
- `packages/intentionsutil/scripts/align-strategy-census.ts:63-75` —
  `printUnservedVirtues`, catches a virtue left unserved by a decompose or
  merge.
- `packages/intentionsutil/src/digest.ts` — `tableClosure :144-184` (every
  affected node still reaches a virtue root), `tableDupServes :202-217`,
  `tableNearDup :251-273`.
- `packages/intentionsutil/scripts/write-node.ts` + `graph-commit` — the only
  write path.

## Verification

```verify
node --import tsx/esm packages/intentionsutil/scripts/validate-graph.ts intentions
```

```verify
npm test --prefix packages/intentionsutil
```

Manual checks: after Unit 1, the selected set and criterion are recorded on
this node; after Unit 2, every selected node carries a dated
motivation-coherence clarification (pass or restructure) and each
restructuring step is tagged executable-here or /align-routed; after Unit 3,
every executed step's superseding disposition carries a deferred stamp, the
/align hand-off list exists if any ratified-touching step was found, and the
digest closure table is clean.
