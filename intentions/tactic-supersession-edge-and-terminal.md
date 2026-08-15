---
id: tactic-supersession-edge-and-terminal
kind: tactic
statement: Add a first-class superseded_by edge and a `superseded` status
  terminal, so supersession can be represented at all
owner: ai
status: raw
parent: null
rationale: Ruled 2026-08-14 after the adversarial draft review established that
  the supersession doctrine names an edge the schema cannot hold and a close the
  lifecycle cannot express. IntentionNode carries five edge fields and no
  supersession edge, and validateNode drops unknown keys, so a superseded_by
  written today vanishes silently. The only terminal is phase done, so closing a
  superseded node that way would launder abandoned work as finished. The
  terminal's CARRIER was corrected 2026-08-15 from phase to status by the
  pre-commit review — see the body. Blocks the RSI supersession observable,
  which reads this edge.
reading: null
serves:
  - strategy-graph-native-dispatch
  - strategy-recursive-self-improvement
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: null
execution: null
validates:
  - strategy-recursive-self-improvement
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Add a first-class superseded_by edge and a `superseded` status terminal, so supersession can be represented at all

## Draft context (2026-08-14 /align correction round, corrected 2026-08-15)

Doctrine home: `strategy-graph-native-dispatch`, the clarification "The
supersession doctrine names an edge to record and a close to recommend. Can the
schema and the lifecycle express either?" Cite it; do not restate its rationale.

**The two facts that make this necessary.** `IntentionNode`
(`packages/intentionsutil/src/schema.ts`) carries exactly five edge fields —
`parent`, `serves`, `recovers`, `validates`, `blocked_by`. And `validateNode`
**drops unknown keys**, stated verbatim at
`packages/intentionsutil/scripts/write-node.ts:31`. So a `superseded_by` written
today is silently discarded — the same defect class as the `gap:` field that
hundreds of nodes carry and nothing reads.

### Unit A — the edge

- Add `superseded_by: string[]` to `IntentionNode` and `IntentionNodeInput`.
- **Direction is ruled: store it on the SUPERSEDED node.** Derive the reverse by
  scanning, the way inbound `blocked_by` edges are found today. **Do not model
  this on a reverse index — there isn't one.** `inboundBlockers`
  (`packages/intentionsutil/src/transitions.ts`) is a **prune-repair scan**, not
  a maintained index; the 2026-08-14 draft cited it as an index pattern to
  reuse, and that was wrong.
- Validate the target resolves, as `blocked_by` targets are validated
  (`checkRequiredEdgeKinds`). A dangling supersession target is a hard fail.
- Add a cycle check modelled on **`validateGraph` rule 15**, the `blocked_by`
  cycle rule (`packages/intentionsutil/src/schema.ts`) — A supersedes B
  supersedes A is reachable once partial supersession exists. **The 2026-08-14
  draft said "reusing the shape of the `parent` cycle rule"; no such rule
  exists.** Rules 1–19 contain exactly one cycle rule, rule 15; rule 6 is
  parent-*kind*, not parent-cycle.

### Unit B — the terminal, carried on `status`

Add `superseded` to the tactic **status** vocabulary, and to the durable kinds'
status vocabularies, via the per-kind `attributes.status_vocabulary` mechanism
that `validateGraph` rule 16 already enforces. The router never selects a node
whose status is `superseded`.

**This was ruled 2026-08-14 as a non-pruning `superseded` PHASE and corrected
2026-08-15.** The implementer must not revert to a phase — all three reasons are
measured, and reverting reintroduces a ladder deadlock:

1. **The pruning premise the phase design rested on is retired.** The original
   argument was that `done` launders abandoned work as finished *because the
   node is pruned and absence reads as completion*. `reconcile-graph.ts` says
   "LEAVE the node present. No prune" and "Nothing is pruned anymore". Done
   nodes are retained. Only stale comments in `router.ts` and `terminus.ts`
   still assert prune-on-done. The harm is real, but its cause is the **word**
   `done`, not a deletion — which is why a status value fixes it.
2. **A new phase would deadlock the ladder.** Thirty predicates across fourteen
   files spell "terminal" as `phase === "done"`. `blockersComplete`
   (`router.ts`, consumed by `terminus.ts`) counts a blocker complete only when
   it is **absent from the store** or **present at `phase: "done"`**. A
   non-pruning `superseded` node is neither, so **every tactic `blocked_by` a
   superseded node would block forever**, and `classifyTerminus` would drain its
   dependents as `excused-blocked`, silently. Choosing `status` leaves all
   thirty predicates untouched.
3. **A phase cannot mark a superseded strategy.** `validateGraph` rule 10
   confines `phase`, `execution`, `blocked_by` and `validates` to `kind:
   "tactic"`. The originating requirement said the graph must not implement one
   **strategy**-or-tactic then later attempt the one it supersedes. A phase
   covers half the requirement; a status covers all of it, because status
   vocabulary is already per-kind and already validated.

**The one cost, stated so the implementer plans for it:** a superseded node
still sits at whatever `phase` it reached. Wherever the ladder reads `phase`
alone to mean "eligible", it must also consult `status`. That is one predicate
to add — against thirty to migrate under the phase design.

### What this unblocks

`strategy-recursive-self-improvement`'s supersession observable, which currently
reads an edge that cannot exist and is marked NOT YET READABLE on that node until
this lands. After this, the observable is a one-line selector query rather than a
hand-walk over 700 files.

### Explicitly out of scope

- **Partial supersession semantics** (what `superseded_by` means when A
  obsoletes only part of B) — unruled, enrolled on
  `tactic-review-supersession-derived-subpoints`. The existing `/align-tactics`
  gate already handles the partial case better than the doctrine does, dropping
  individual units and demoting to draft only when a tactic is FULLY superseded.
- **Whether a `superseded` status on a durable-layer node requires attendance.**
  `status` is a state field, and the round's own taxonomy leaves EDIT-STATE
  unrestricted — so on the letter of the invariant an autonomous lane could
  retire a strategy. Retiring a strategy is a doctrine act. Recommendation, not a
  ruling: require attendance there. Enrolled on the same review node.

## A node is already waiting on this instrument

`tactic-align-tactics-per-node-clarifications` is parked, its park condition
**discharged**, and closeable on nothing but this node landing — it carries a
`blocked_by` edge here as of 2026-08-15. It is the first concrete case, and it
demonstrates the gap better than the abstract argument does: it cannot be closed
via `phase: done` (that launders abandoned work as completed, the failure R8
ruled against, and would satisfy `blockersComplete` for its dependents), and it
cannot be closed via `graph-commit --prune` (seven references name it by id,
five of them dated clarifications on `strategy-graph-native-dispatch` that are
historical records and must not be repointed). `validate-graph` would pass a
prune, since prose refs to a pruned node do not break it — so the damage would
be silent, which is the strongest argument for shipping the terminal rather than
improvising a close.

Worth carrying into this node's own review: the prune path being *silently*
non-breaking suggests the terminal should also give `validate-graph` something
to check, so a superseded node's inbound citations are visibly redirected rather
than left dangling.
