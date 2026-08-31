---
id: tactic-supersession-edge-and-terminal
kind: tactic
statement: Add a first-class superseded_by edge and a `superseded` status
  terminal, so supersession can be represented at all
owner: ai
status: codified
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
clarifications:
  - question: Is the ruling's cost accounting for the status-over-phase choice —
      "one predicate to add", and "status leaves all thirty predicates and
      blockersComplete untouched" — accurate, and which eligibility sites must
      actually consult status?
    answer: "(Recorded 2026-08-21 /align-tactics per-node drift review, measured
      against this worktree's HEAD.) The body's cost paragraph — \"that is one
      predicate to add\" — understates the eligibility surface, and reason 2's
      claim that choosing `status` \"leaves all thirty predicates untouched\"
      does not mean the deadlock is avoided. MEASURED: a status-superseded node
      still sits at a non-done phase, so `blockersComplete`
      (packages/intentionsutil/src/router.ts:240-246 — a blocker present and not
      `phase: done` blocks) deadlocks its dependents EXACTLY as the rejected
      superseded-PHASE design would. \"Untouched\" is the defect there, not its
      absence. The status choice therefore survives on reason 3 alone —
      `validateGraph` rule 10 confines `phase` to `kind: tactic`, so a phase
      cannot mark a superseded strategy — which is independently verified and
      decisive; reasons 1 and 2 are not load-bearing. The eligibility sites that
      must consult `status`, measured: the tactic-candidate loop
      (`isOpenTactic`, router.ts:414-445 — a superseded, unparked, non-done
      tactic is DISPATCHED as live work); the draft/frozen loop (`isDraft`,
      router.ts:459-483 — a superseded node at `phase: null`, which this node's
      own restamp obligation for tactic-align-tactics-per-node-clarifications
      creates, resurfaces as an /align-tactics draft candidate); the
      strategy-candidate loop's `children.some((t) => isOpenTactic(t) &&
      onPath.has(t.id))` (router.ts:508 — a superseded child permanently
      disqualifies its serving strategy from every future align round);
      `blockersComplete`; reconcile-graph.ts's byte-identical `isOpen`
      re-implementation
      (packages/intentionsutil/scripts/reconcile-graph.ts:139-142 and the inline
      re-derivation at 242-250); and `strategiesToStamp`
      (packages/intentionsutil/src/transitions.ts:422-437). The `office_hours`
      park is NOT a substitute for any of them: `clear-park` erases
      `office_hours` when the author drains the recommended close, after which
      every one of these sites reads the node as live again. This corrects the
      COUNT, not the design — the author's ruled rule (\"wherever the ladder
      reads `phase` alone to mean eligible it must also consult `status`\")
      already covers each site."
  - question: Which measurement and liveness surfaces would read a status-superseded
      node as live work, and which of them are in this node's scope to change?
    answer: "(Recorded 2026-08-21 /align-tactics per-node drift review.) Measurement
      surfaces are OUT of this node's scope, and the declared default is that a
      superseded node keeps counting as open work in them until the author rules
      otherwise. MEASURED phase-only measurement reads a superseded node would
      land in: `classifyTactic`/`strategyBacklogBand`
      (packages/intentionsutil/src/census.ts:10-18,34-37) count a non-null
      non-done phase as \"open\", so a superseded tactic inflates the very
      backlog ratio strategy-graph-native-dispatch's ARMED maintenance-burden
      band reads (≤35%, non-increasing); `resolveAttention`'s doneIds and
      `contributionOf` (attention.ts:459-462,588-594) treat only `phase: done`
      as inert, so a superseded node keeps scoring and keeps its authored boosts
      live; `openTacticServesCoverage` and `parkedCensus`
      (scripts/read-sensors.ts:1262-1281,1517-1527); hold-alerts.ts's live top-K
      pool (104-112); `mentionsRef` (schema.ts:1721-1736, where a superseded
      tactic's prose ref still reads as a forward \"planned\" reference rather
      than dangling); and digest's [DONE-PRESENT] table (digest.ts:186-195).
      Changing what an ARMED band measures is a doctrine act, so this node
      changes none of them and says so. SEPARATELY MEASURED and IN scope as a
      vocabulary hazard: five code sites branch on `status` — sensors.ts:321,
      sensors.ts:370, coverage.ts:52, rungs.ts:36, goals.ts:57. Four are
      inclusion-based (`=== \"codified\"` / `=== \"delegated\"`) and naturally
      exclude a new value; `activeFrontier` (goals.ts:57) is EXCLUSION-based
      (`status !== \"codified\"`), so a superseded LEAF stays in the active/goal
      frontier unless the new value joins that exclusion. The ruling's \"no code
      branches on it\" is true of the phase-terminal predicates, not of
      `status`."
tooling_goals: []
success_signal: null
attention: null
phase: implement
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

## Context

Doctrine home: `strategy-graph-native-dispatch`, the clarification "The
supersession doctrine names an edge to record and a close to recommend. Can the
schema and the lifecycle express either?" (ruled 2026-08-14, terminal carrier
corrected 2026-08-15). Cite it; do not restate its rationale.

**The two facts that make this necessary — re-measured 2026-08-21 at
origin/main 53eefa33 and both CONFIRMED.**

1. `IntentionNode` (`packages/intentionsutil/src/schema.ts:220`) carries
   exactly five edge fields — `parent` (:230), `serves` (:231), `recovers`
   (:232), `validates` (:244), `blocked_by` (:245). There is no supersession
   edge. `IntentionNodeInput` (:259) mirrors them at :265-:267, :276, :277.
2. `validateNode` **drops unknown keys**. That sentence lives in the doc
   comment of `writeNodeFromJson` in
   `packages/intentionsutil/scripts/write-node.ts` (around line 34 — locate by
   the symbol, not the line; the older `:31` citation pointed at the `USAGE`
   string). So a `superseded_by` written today is silently discarded — the same
   defect class as the `gap:` field hundreds of nodes carry and nothing reads.

**The terminal is carried on `status`, never on `phase`.** This was ruled
2026-08-14 as a non-pruning `superseded` PHASE and corrected 2026-08-15. An
implementer must not revert to a phase; all three reasons are measured, and
reverting reintroduces a ladder deadlock.

1. *The pruning premise the phase design rested on is retired.* The original
   argument was that `done` launders abandoned work as finished *because the
   node is pruned and absence reads as completion*.
   `packages/intentionsutil/scripts/reconcile-graph.ts:206` says "LEAVE the
   node present. No prune" and `:265` says "Nothing is pruned anymore". Done
   nodes are retained. Only stale comments at
   `packages/intentionsutil/src/router.ts:212-213` and
   `packages/intentionsutil/src/terminus.ts:38` still assert prune-on-done
   (note `router.ts:503` already carries a corrected comment, so router.ts
   holds both readings). The harm is real, but its cause is the **word** `done`,
   not a deletion — which is why a status value fixes it.
2. *A new phase would deadlock the ladder.* `blockersComplete`
   (`packages/intentionsutil/src/router.ts:240`) reads exactly
   `if (blocker !== undefined && blocker.phase !== "done") return false;` — a
   blocker is complete only when ABSENT or at `phase: "done"`. A non-pruning
   `superseded` node is neither, so every tactic `blocked_by` a superseded node
   would block forever, and `classifyTerminus`
   (`packages/intentionsutil/src/terminus.ts:64`, which reads
   `if (!blockersComplete(node, byId)) return "excused-blocked";`) would drain
   its dependents as `excused-blocked`, silently.
3. *A phase cannot mark a superseded strategy.* `validateGraph` rule 10
   confines `phase`, `execution`, `blocked_by` and `validates` to
   `kind: "tactic"` (enforced by `checkKindTypedFields`, `schema.ts:1163`,
   whose code comment groups it as "Rules 9, 10 & 12"). The originating
   requirement said the graph must not implement one **strategy**-or-tactic and
   later attempt the one it supersedes. A phase covers half the requirement; a
   status covers all of it, because status vocabulary is already per-kind and
   already validated.

**`Status` is not a TypeScript union, which materially shrinks the terminal's
cost.** `export type Status = string` (`schema.ts:25`). The vocabulary is DATA:
`attributes.status_vocabulary` on the `kind-*` nodes, enforced by rule 16
(`checkStatusVocabulary`, `schema.ts:1197-1211`, wired at `schema.ts:1681`).
All six kind nodes already declare one. The terminal therefore needs **no new
validation code and no type widening** — only vocabulary entries in the kind
node files.

**DECOY — do not mistake it for a gate.** `export const STATUSES: readonly
string[] = ["raw", "refining", "delegated", "codified"]` (`schema.ts:27`) is
legacy; its own doc comment says so, and nothing validates against it. Its only
consumers are two re-exports (`src/index.ts:1`, `src/graph.ts:14`) and an
`Array.isArray` shape assertion (`test/graph.test.ts:17`). This plan
deliberately does NOT add `superseded` to it — see Unit 1.

**The cost the ruling stated, re-measured and found larger than "one
predicate".** A superseded node still sits at whatever `phase` it reached, so
wherever the ladder reads `phase` alone to mean "eligible" it must also consult
`status`. Measured 2026-08-21: `phase === "done"` / `phase !== "done"` appears
**44 times across 23 files** under `packages/` + `.claude/` (node_modules
excluded) — not the "thirty predicates across fourteen files" the earlier draft
recorded. The ruling is unchanged and strengthened; use the measured figure.
Most of those 44 sites genuinely mean "reached the completed terminal" and stay
untouched. Units 2–4 change only the ones that mean "is this node still live
work", enumerated site by site with a stated reason each.

### What this unblocks

`strategy-recursive-self-improvement`'s supersession observable, which today
reads an edge that cannot exist and is marked NOT YET READABLE on that node
until this lands. After this, the observable is a one-line selector query
rather than a hand-walk over ~700 files.

### Explicitly out of scope — do NOT rule either here

- **Partial supersession semantics** (what `superseded_by` means when A
  obsoletes only part of B) — unruled, enrolled on
  `tactic-review-supersession-derived-subpoints`. The existing `/align-tactics`
  gate already handles the partial case better than the doctrine does, dropping
  individual units and demoting to draft only when a tactic is FULLY
  superseded. This plan therefore writes NO rule pinning a superseded node's
  phase, and NO rule requiring supersession to be whole-node.
- **Whether a `superseded` status on a durable-layer node requires attendance.**
  `status` is a `STATE_FIELDS` member and EDIT-STATE is unrestricted, so on the
  letter of the invariant an autonomous lane could retire a strategy. Retiring a
  strategy is a doctrine act. Recommendation, not a ruling: require attendance
  there. Enrolled on the same review node.

Four sibling nodes are all still drafts (`phase: null`), so nothing is in flight
to work around and equally nothing may be absorbed:

- `tactic-finding-search-all-producers` — `blocked_by: [this node]`. Owns the
  shared find-or-recur write surface.
- `tactic-persist-greenfield-drops` — `blocked_by: [this node,
  tactic-finding-search-all-producers]`. Owns writing `superseded_by` from
  `/align-tactics`' `greenfield_drops` AND the `supersedes(candidate, corpus)`
  pure function (strategy clarification, 2026-08-15 addition (a)). **Do NOT
  build `supersedes()` in this node.**
- `tactic-supersession-retirement-sweep` — `blocked_by: []`. The
  retirement-time sweep.
- `tactic-review-supersession-derived-subpoints` — `blocked_by: []`. Owns both
  out-of-scope questions above.

This node ships the PRIMITIVE only: the field, its validation, the vocabulary
entries, the eligibility gate, and the one owed restamp.

### A node has already been mis-closed for want of this instrument

`tactic-align-tactics-per-node-clarifications` was force-closed 2026-08-15 on
author instruction with `phase: done`, because this node had not shipped. It was
**abandoned, not completed** — its doctrine was overturned and its work moved to
`tactic-align-tactics-immaterial-drift-redirect`. That is precisely the
laundering the ruling ruled against, done knowingly and disclosed in that node's
own body, which now opens with a section saying its `phase` is a lie.

**This node owes that restamp** (Unit 5). Measured 2026-08-21: the node is
`status: raw` (`intentions/tactic-align-tactics-per-node-clarifications.md:11`),
`phase: done` (`:58`), `execution: null` (`:59`) — so there is no PR or
completion record to reconcile. Its supersession target
`tactic-align-tactics-immaterial-drift-redirect` exists at `status: raw,
phase: null`.

The case is worth carrying because it priced both wrong instruments concretely.
`--prune` was rejected: seven references name that node by id, five of them
dated clarifications on `strategy-graph-native-dispatch` that are historical
records and must not be repointed — and `validate-graph` passes a prune anyway,
since prose refs to a pruned node do not break it, so the damage would have been
silent. `phase: done` was chosen only as the lesser harm, because it keeps every
citation resolvable and contradicts itself at the point of reading. Neither is
acceptable as a standing practice, which is the argument for shipping this node
rather than improvising the next one.

The body's follow-on worry — that the silently non-breaking prune path argues
the terminal should give `validate-graph` something to check — is answered by
this design and recorded here so it is not re-opened: nodes are never pruned, so
a superseded node stays present and every inbound prose citation keeps
resolving; rule 23 (Unit 1) makes the *outbound* supersession edge a hard fail
when it dangles; and Unit 4 adds a `[SUPERSEDED-PRESENT]` digest table so the
population is visible rather than merely non-broken.

## Design

**Greenfield.** Three pieces, all additive:

1. `superseded_by: string[]` on `IntentionNode`, stored on the **superseded**
   node. The reverse direction is derived by scanning, exactly the way inbound
   `blocked_by` edges are found today. **Do not build a maintained reverse
   index — there isn't one.** `inboundBlockers`
   (`packages/intentionsutil/src/transitions.ts:407-409`) is a prune-repair
   scan; the 2026-08-14 draft cited it as an index pattern to reuse and that was
   wrong.
2. `superseded` as a status value in every kind node's
   `attributes.status_vocabulary`. No code, no enum, no type change.
3. Two exported predicates in `schema.ts` — `isSuperseded(node)` and
   `isRetired(node)` (= `phase === "done" || isSuperseded(node)`) — so the
   "is this node still live work" question has ONE implementation that the
   ~15 consuming sites call, instead of fifteen hand-written
   `status === "superseded"` comparisons that drift apart. This is the parsimony
   bar the strategy's one-shared-write-surface ruling applies to prose; the same
   argument applies to a predicate.

**Two design rulings this plan makes (flagged as plan-level, not author-ruled).**

- *Supersession targets must share the superseded node's kind.* The doctrine
  says "strategy-or-tactic" but does not rule cross-kind supersession. A tactic
  superseded by a strategy is not a supersession, it is a re-parenting.
  Same-kind is modelled on rule 6 (`checkParentKind`, `schema.ts:1122`) and
  costs nothing to implement: `checkRequiredEdgeKinds` already takes the
  expected kind as a parameter, so the call passes `node.kind` and no widening
  is needed. Rejected alternative: extend `checkRequiredEdgeKinds` to accept a
  kind SET (`{tactic, strategy}`) — more code, and it would permit
  strategy-supersedes-tactic. Also rejected: the existence-only shape of
  `checkExistenceEdges` (`schema.ts:1098`), which drops the kind check
  entirely and would let a `superseded_by` point at a `kind-*` node. Loosening
  a validation later never invalidates stored data, so same-kind is the safe
  direction to be wrong in.
- *`superseded_by` is NOT kind-confined.* Unlike `blocked_by`/`validates`
  (rule 10), it is legal on any kind, because rule 23's same-kind target rule
  already makes it meaningful everywhere. `checkKindTypedFields` gets a comment
  saying the omission is deliberate, so a future reader does not "fix" it.

**Brownfield migration path: none is required, and that is a finding, not an
omission.** `validateNode` defaults an absent `superseded_by` to `[]`, so all
~700 existing `intentions/*.md` files parse unchanged with no rewrite; the
status value is purely additive to per-kind data; and no consumer branches on a
status it has never seen. The only data change in the whole plan is the single
owed restamp in Unit 5. Because the greenfield design is reachable in one PR and
is backwards-compatible, no separate migration proposal is warranted.

**Everything below lands in ONE PR.** This is load-bearing, not a convenience:
Unit 5 reverts `tactic-align-tactics-per-node-clarifications` to `phase: null`,
which makes `isDraft()` true, which makes the router's draft/frozen loop emit it
as an `/align-tactics` candidate **every tick** — an unbounded dispatch churn
loop — unless Unit 2's gate is already in place. Unit 5 depends on Unit 2 and
must not be split into a follow-up PR.

## Units of work

### Unit 1 — The `superseded_by` edge, the `superseded` vocabulary, and the shared predicates

**Scope.**

`packages/intentionsutil/src/schema.ts`:

- `IntentionNode` (:220): add `superseded_by: string[];` immediately after
  `blocked_by` (:245), with a comment naming the direction ("ids of nodes that
  supersede this one; stored on the SUPERSEDED node, reverse derived by scan")
  and that it is legal on every kind.
- `IntentionNodeInput` (:259): add `superseded_by?: string[];` after
  `blocked_by?` (:277).
- `validateNode`'s returned object — the graph-native dispatch block whose
  `validates` / `blocked_by` lines are at :1016-1019: add
  `superseded_by: value.superseded_by == null ? [] : validateIdArray(value.superseded_by, "superseded_by"),`.
  Reuse `validateIdArray` (:335-340) as-is; write no new validator. Placement in
  the returned object determines YAML key order in `writeNode`, so put it
  directly after `blocked_by` to match the field declaration.
- New exports next to the `Status` block (:16-27), each with a doc comment:
  - `export const SUPERSEDED_STATUS = "superseded";`
  - `export function isSuperseded(node: IntentionNode): boolean` —
    `node.status === SUPERSEDED_STATUS`.
  - `export function isRetired(node: IntentionNode): boolean` —
    `node.phase === "done" || isSuperseded(node)`. Doc comment: "the node is
    finished with, by EITHER terminal — completed (`phase: done`) or abandoned
    (`status: superseded`). Sites that specifically mean *reached the completed
    terminal* must keep the literal `phase === "done"` test."
- `STATUSES` (:27): leave the array unchanged. Add a one-line comment stating
  that `superseded` is deliberately absent because nothing validates against
  this array (its only consumers are `src/index.ts:1`, `src/graph.ts:14`, and
  the `Array.isArray` assertion at `test/graph.test.ts:17`), and adding it would
  imply a central status enum the graph deliberately does not have.
- Rule 23 wiring: in `validateGraph`'s per-node loop, immediately after the
  rules 13-14 calls at :1679-1680, add
  `checkRequiredEdgeKinds(node, node.superseded_by, "superseded_by", node.kind, byId, problems);`.
  `checkRequiredEdgeKinds` (:1075-1095) is reused verbatim — no signature
  change — because it already takes the expected kind as an argument, and
  passing `node.kind` yields the same-kind rule. It also owns the dangling case,
  which is what the ruling requires (a dangling supersession target is a hard
  fail).
- Rule 24 — the cycle check. Do **not** copy `checkBlockedByCycles` (:1503-1546).
  Generalize it: extract its three-color DFS into
  `checkEdgeCycles(nodes, byId, problems, edgeName, edgeOf)` where
  `edgeOf: (n: IntentionNode) => string[]`, keep the existing message text for
  `blocked_by` ("blocked_by forms a cycle — a tactic cannot be transitively
  blocked by itself"), and add a `superseded_by` message ("superseded_by forms a
  cycle — a node cannot transitively supersede itself"). Wire BOTH calls
  **outside** the per-node loop, next to the existing rule 15 call at :1694.
  That structural placement matters: rule 15 is a whole-graph pass, not a
  per-node check. Self-supersession (`A` in its own `superseded_by`) is a
  length-1 cycle the DFS already catches.
- The numbered rule-list doc comment (:1550-1641): append entries 23 and 24
  after 22, in the existing prose style. **Rule 20 is BURNED** — the doc comment
  says in terms "Rule numbers are cross-referenced from node bodies; 20 is
  burned, so the next new rule takes 21", and 21 and 22 are now taken. The next
  new rule is 23, the second is 24. Do not reuse 20.
- `checkKindTypedFields` (:1163-1195): add no restriction. Extend its doc
  comment with one sentence recording that `superseded_by` is deliberately not
  kind-confined, and why (rule 23's same-kind target rule already makes it
  meaningful on every kind).

Kind nodes — add a `superseded:` entry to each `attributes.status_vocabulary`
map, in the terse style of the existing entries (suggested wording: "the intent
moved to another node — abandoned, not completed; `superseded_by` names the
successor"). All six map anchors, verified 2026-08-21:

- `intentions/kind-tactic.md:95`
- `intentions/kind-strategy.md:108`
- `intentions/kind-delegation.md:116`
- `intentions/kind-tradition.md:112`
- `intentions/kind-virtue.md:134`
- `intentions/kind-kind.md:335`

Kind-node prose:

- `intentions/kind-tactic.md`: a new `## superseded_by` section modelled on the
  existing `## blocked_by` / `## validates` field-doc sections (:104-174) —
  what it holds, which `validateGraph` rules enforce it (23 and 24), the
  stored-on-the-superseded-node direction, and that the reverse is derived by
  scan. Plus a short `superseded`-terminal paragraph modelled on the existing
  `done`-terminal prose (:240-258), stating that a superseded node keeps
  whatever `phase` it reached and that the router excludes it on `status`, not
  on `phase`.
- `intentions/kind-strategy.md`: a two-sentence pointer to that section, since
  the field is cross-kind and should not be documented twice.

Tests, `packages/intentionsutil/test/schema.test.ts`:

- `gnode` helper (:1253-1283): add `superseded_by: partial.superseded_by ?? [],`.
- The second `gnode`-shaped fixture around :2412-2413: same addition.
- A `validateNode`-level type-check test modelled on "rejects a validates that
  is not a string array" (:904-943): `superseded_by` non-array rejected;
  absent defaults to `[]`.
- A `validateGraph` block modelled on the existing `blocked_by`/`validates`
  block (:1601-1782), one `it()` per case: dangling target rejected; target of a
  different kind rejected; same-kind target passes; self-supersession rejected;
  two-node cycle rejected; a three-node non-cyclic chain passes; a
  `superseded_by` on a `kind: "strategy"` node passes (proving rule 10 does not
  confine it).
- A rule-16 test: a node at `status: "superseded"` passes when its kind fixture
  declares the value, and fails when it does not.

Fixture churn — **required for typecheck**, since `superseded_by` is a required
member of `IntentionNode`. Measured 2026-08-21: 45 node-literal construction
sites across 32 files carry `pace_exempt:`; each needs one added line
(`superseded_by: partial.superseded_by ?? [],` in a helper, or
`superseded_by: [],` in a bare literal). The files, all under
`packages/intentionsutil/test/`: `schema.test.ts` (8 sites), `store.test.ts`
(5), `router.test.ts` (3), and one site each in `apply-conflict-state.test.ts`,
`apply-fix-state.test.ts`, `apply-lane-pass.test.ts`,
`apply-node-transition.test.ts`, `attention.test.ts`, `census.test.ts`,
`check-node-selection.test.ts`, `coverage.test.ts`,
`delegation-records-sensor.test.ts`, `digest.test.ts`, `goals.test.ts`,
`grounding.test.ts`, `hold-alerts.test.ts`, `hold-sweep.test.ts`,
`intention-store-sensor.test.ts`, `ledger-census.test.ts`,
`list-conflict-nodes.test.ts`, `node-merge.test.ts`, `office-hours.test.ts`,
`reconcile-graph.test.ts`, `rungs.test.ts`, `scope-sweep.test.ts`,
`sensors.test.ts`, `strategy-fingerprint.test.ts`, `terminus.test.ts`,
`terminus-sensor.test.ts`, `transitions.test.ts`, `wait-sweep.test.ts`,
`waits.test.ts`.

**Out of scope for this unit.** No router/terminus/census behavior change; no
`supersedes()` similarity function (owned by `tactic-persist-greenfield-drops`);
no phase-pinning rule for superseded nodes; no data edits under `intentions/`
other than the six kind nodes.

**No changes needed** in `packages/intentionsutil/src/store.ts` (`writeNode`
:50-58 is `stringify(validated)`, fully generic; `parseNodeRaw` :143 and
`readNode` :153 likewise), `packages/intentionsutil/scripts/write-node.ts`
(field-agnostic JSON → `validateNode` → `writeNode` passthrough), or
`packages/intentionsutil/scripts/dump-node.ts` (field-agnostic). Confirm by
grepping each for `blocked_by|validates` and finding nothing.

**Recommended model.** opus.

### Unit 2 — The eligibility gate: router, terminus, and the execute-side selection check

**Scope.**

`packages/intentionsutil/src/router.ts`:

- `isOpenTactic` (:145-147) — change to
  `!isDraft(tactic) && tactic.phase !== "done" && !isSuperseded(tactic)`, keeping
  the `tactic is IntentionNode & { phase: Phase }` type predicate. This one edit
  covers three call sites at once, which is why it is preferred to three
  separate `continue` guards: the executable-tactic loop (:414-443, THE dispatch
  selector), the frozen-tactic re-evaluation branch (:472), and the strategy
  on-path-child check (:508). Update its doc comment: "open = in flight —
  neither draft, nor completed, nor superseded."
  `isDraft` (:139-141) stays a pure phase predicate and is NOT changed.
- The strategy on-path-child check at :507-508 is the site the node body's "one
  predicate" cost estimate missed and the one most likely to be forgotten. It
  reads `children.some((t) => isOpenTactic(t) && onPath.has(t.id))`; a
  superseded child at a live phase would permanently disqualify its serving
  strategy from every future align round — the exact failure the surrounding
  comment already describes for `done`. Fixing `isOpenTactic` fixes it; extend
  that comment to name supersession alongside `done` so the reason is recorded
  at the site.
- Frozen/draft candidate loop (:455-482): add `if (isSuperseded(t)) continue;`
  immediately after the `if (t.office_hours !== null) continue;` guard, covering
  BOTH the `isDraft` branch and the soft-frozen branch. The `isDraft` branch is
  the churn loop Unit 5 would otherwise trip: a superseded node at `phase: null`
  is `isDraft === true` and would be emitted as an `/align-tactics` candidate
  every tick.
- Strategy candidate loop (:486-488): add `if (isSuperseded(s)) continue;`
  immediately after `if (s.office_hours !== null) continue;`. This is the half of
  the requirement a phase carrier structurally could not reach.
- `blockersComplete` (:240-246): change the predicate to
  `if (blocker !== undefined && !isRetired(blocker)) return false;`. Extend the
  doc comment to state that a superseded blocker counts as complete — a dead
  blocker must not hold a live dependent forever. This is the deadlock the
  ruling's reason 2 names. Three callers inherit the fix for free with no
  separate edit: `packages/intentionsutil/src/terminus.ts`,
  `.claude/skills/dispatch-propagate/scripts/reconcile-graph-review-stall:191-202`,
  and `.claude/skills/dispatch-propagate/scripts/graph-auto-merge:263-274`.
- Correct the stale prune-on-done comment at :212-213 (it asserts prune-on-done
  makes absence completion; `reconcile-graph.ts:206,265` says nothing is pruned).
  This is scoped IN deliberately, not smuggled: the same doc-comment block is
  being rewritten for `blockersComplete`, and leaving a contradicted comment
  beside a corrected one is what produced this node's own confusion.
  `router.ts:503` already carries the corrected wording — match it.
- `progressionIndex` (:263-267) reads `phase` for sort ORDER only, never
  eligibility. Leave it unchanged; note in the commit message that it was
  checked.

`packages/intentionsutil/src/terminus.ts`:

- `TerminusClassification` (:16-21): add `| "superseded"`.
- `classifyTerminus` (:57-66): insert `if (isSuperseded(node)) return "superseded";`
  immediately AFTER the `phase === "done"` line and BEFORE the parked check.
  Order is load-bearing: a never-merged superseded node must still read
  `not-merged` (outside the census entirely), while a merged superseded node
  must read `superseded` rather than falling through to `violation`.
- `ladderTerminusCensus` (:107-122): exclude `"superseded"` alongside
  `"not-merged"` and `"done"` from `rows`, so `mergedNotDone`, `excused` and
  `violations` stay trivially derivable from `rows` as the
  `LadderTerminusCensus.rows` doc comment (:76-95) promises. Update that doc
  comment to name the third excluded classification and why (a superseded node
  is terminal and needs no excuse).
- Correct the stale prune-on-done assertion in the `classifyTerminus` doc
  comment at :38, same reason as router.ts:212-213.
- `packages/intentionsutil/src/index.ts:84-86` already re-exports
  `classifyTerminus` and `TerminusClassification`; no change needed there. Add
  `isSuperseded` / `isRetired` / `SUPERSEDED_STATUS` to the schema re-export
  block in that file, following whatever form the existing schema re-export at
  `src/index.ts:1` already uses.

`packages/intentionsutil/scripts/check-node-selection.ts` — the execute-side
selection gate, a SECOND eligibility surface the node body did not name. It
already has the exact precedent to copy: check "3. not parked" (around :310)
reads `if (readParked(node)) return fail(EXIT_STALE_SELECTION, "not-parked", ...)`.
Add a mirroring check "3c. not superseded" immediately after it, returning
`fail(EXIT_STALE_SELECTION, "not-superseded", "<id> was superseded after selection")`.
This catches a directive selected just before the supersession landed, or a
hand-run/explicit dispatch that bypassed the selector. Update the numbered
check list in the file's header comment (:20-30) to include it.

Tests:

- `packages/intentionsutil/test/router.test.ts`: a superseded tactic at
  `phase: "implement"` is not emitted as a candidate; a superseded tactic at
  `phase: null` is not emitted by the draft loop (the Unit 5 churn case,
  asserted directly); a superseded strategy is not emitted as an
  `/align-tactics` candidate; a strategy whose only on-path child is superseded
  IS still emitted; `blockersComplete` returns true for a superseded blocker at
  a live phase; `blockersComplete` still returns false for a live
  non-superseded blocker.
- `packages/intentionsutil/test/terminus.test.ts`: a merged superseded node
  classifies `superseded`, not `violation`; a never-merged superseded node
  classifies `not-merged`; a superseded node is absent from
  `ladderTerminusCensus().rows` and does not move `violations`.
- `packages/intentionsutil/test/check-node-selection.test.ts`: a superseded node
  fails with `EXIT_STALE_SELECTION` and the `not-superseded` reason.

**Out of scope for this unit.** No changes to `isDraft`; no changes to the ~34
remaining `phase === "done"` sites that genuinely mean "reached the completed
terminal"; no census/attention/goals changes (Unit 3); no report or sensor
changes (Unit 4).

**Recommended model.** opus.

**Dependencies.** Unit 1.

### Unit 3 — Liveness readers: census, goals, attention, round-stamping, reconcile

Each site below currently treats a superseded node as live work. All use
`isSuperseded` / `isRetired` from Unit 1.

**Scope.**

- `packages/intentionsutil/src/census.ts:10-18` — add `"superseded"` to
  `TacticClassification` and return it first in `classifyTactic`
  (`if (isSuperseded(node)) return "superseded";` before the phase branches).
  Then in `strategyBacklogBand` (:20-39) filter superseded tactics out of the
  `tactics` population entirely, so they count in NEITHER `backlog` nor `total`.
  Rationale to record in the doc comment: a superseded tactic is neither open
  backlog nor a completed contribution, and leaving it in the denominator would
  let a lane improve the band by mass-superseding. This changes this strategy's
  own published reading (currently 58/236 = 24.6%); expect a small movement and
  do not treat it as a regression.
  `packages/intentionsutil/scripts/align-tactics-census.ts` needs **no** change —
  it prints `classification` as a string (:65-71) and only special-cases
  `born-parked` — but re-read it to confirm before concluding that.
- `packages/intentionsutil/src/goals.ts:53-57` — `activeFrontier`'s predicate is
  EXCLUSION-based (`node.status !== "codified" && !parentIds.has(node.id)`), so
  a superseded leaf would still be reported as work still needing attention. Add
  `&& !isSuperseded(node)` and extend the doc comment. This is the highest-risk
  fall-through of the whole plan, because the failure is silent. Contrast: the
  INCLUSION-based status readers need no change and must not be touched —
  `sensors.ts:321` (`status === "codified"`), `sensors.ts:370`
  (`status === "delegated" || status === "codified"`), `coverage.ts:52`
  (`status === "delegated"`), `rungs.ts:36` (`kind === "virtue" &&
  parent === null && status === "codified"`). A superseded node falls to each
  one's default branch, which is the correct behavior. Confirm each by reading
  and record the confirmation — Verification asks for it.

  **Add `&& node.phase !== "done"` in the same edit** (folded in 2026-08-30).
  This predicate has a second live fall-through, independent of supersession:
  it gates on `status` alone, and `status` is write-once authoring provenance
  that the dispatch ladder never advances, so a finished leaf whose author
  never codified it stays in the frontier permanently. Measured 2026-08-30 on
  the 780-node store: `activeFrontier` returns 380 nodes, of which **65 are
  `phase: done`** — 62 carrying `status: raw` and 3 carrying
  `status: delegated`. Every one of the 65 is a leaf, so the clause removes
  exactly those: **380 → 315**. Write the clause on `phase`; never spell it
  `status !== "raw"` — the 3 `delegated` nodes are the standing proof that
  `status` is the wrong axis for the question. The doc comment at `:35-51`
  needs correcting in the same edit: it rationalizes the predicate as *"every
  tactic leaf is currently `status: "raw"`, so gating on a
  `delegated`/`codified` status would yield an empty frontier"*, a premise that
  no longer describes a graph holding 197 done tactics. The ruling this
  implements is `kind-tactic`'s clarification *"Is `status: raw` together with
  `phase: done` a node defect to sweep?"* (landed 2026-08-30): the nodes are
  correct and the reader is what changes, so this unit must not migrate any
  node's `status` as part of the fix. Expected measured effect, stated up front
  so it is not read as a regression: the frontier drops by those 65; `detectRung`
  is unchanged, `strategyBacklogBand` is phase-based already and unchanged, and
  no sensor reading moves (readings do not scope to the frontier).
- `packages/intentionsutil/src/attention.ts:462` — `doneIds` is the set of nodes
  treated as inert for attention scoring (transparent-parent / severed-blockee
  rules, doc comment :428-441). Rename the local to `inertIds` and build it from
  `isRetired(n)`, updating the doc comment. Without this a superseded node keeps
  contributing score and keeps holding up its blockers' urgency.
- `packages/intentionsutil/src/attention.ts:588-594` — `contributionOf`'s
  `if (n.phase === "done") return 0;` becomes `if (isRetired(n)) return 0;`, so a
  superseded node's authored boosts stop counting.
- `packages/intentionsutil/src/transitions.ts:422-437` — `strategiesToStamp`'s
  "other non-draft children still serving" filter must add `&& !isSuperseded(n)`,
  or a superseded sibling keeps a strategy's round open forever.
- `packages/intentionsutil/scripts/reconcile-graph.ts:139-142` — `isOpen(phase)`
  is a byte-identical reimplementation of the router's non-exported
  `isOpenTactic`. Change its signature to take the node
  (`isOpen(node: IntentionNode)`) and add `&& !isSuperseded(node)`; update the
  single call site at :175 (`!isOpen(node.phase)` → `!isOpen(node)`).
- `packages/intentionsutil/scripts/reconcile-graph.ts:242-250` — Pass 3's inline
  remaining-children scan re-derives "open child" by hand; add
  `&& !isSuperseded(n)` so a superseded child cannot permanently block its
  serving strategy's round stamp.

Tests: extend `census.test.ts`, `goals.test.ts`, `attention.test.ts`,
`transitions.test.ts`, `reconcile-graph.test.ts` with one case each asserting the
superseded node is treated as inert, plus (in `census.test.ts`) that a superseded
tactic is excluded from both halves of `strategyBacklogBand`.

**Out of scope for this unit.** The inclusion-based status readers listed above
(read and confirm, change nothing). The forward-phase ladder
(`transitions.ts:61,80-93,361-367` — `LADDER` / `forwardPhase` /
`reconcileMergedPhase` / `reconcileClosedPhase`): supersession is a terminal
side-branch, not a ladder rung, so a superseded tactic is simply never fed
through `forwardPhase` again. Read them to confirm no change is needed and say so
in the commit message.

**Recommended model.** sonnet.

**Dependencies.** Units 1 and 2.

### Unit 4 — Report and sensor sweep, plus the `[SUPERSEDED-PRESENT]` digest table

These sites are read-only reporting and sensor readings. None gates dispatch, so
none is a correctness bug — but each would report dead work as outstanding, and
each is a one-line change, so they land here rather than accumulating as
follow-ups.

**Scope.**

- `packages/intentionsutil/src/officeHours.ts:136-149` — `openBlockers`'
  `target.phase !== "done"` becomes `!isRetired(target)`, so the office-hours
  report stops showing a dead blocker as outstanding. Advisory only; it never
  gates.
- `packages/intentionsutil/src/schema.ts:1721-1736` — `mentionsRef`'s
  `t.phase !== "done"` becomes `!isRetired(t)`. Today a superseded tactic
  mentioning a missing ref would falsely mark that ref "planned" instead of
  dangling, hiding it from `validateGraphProseRefs` and the digest's
  DANGLING-REFS table.
- `packages/intentionsutil/scripts/read-sensors.ts:1262-1281` —
  `openTacticServesCoverage` skips on `phase === null || phase === "done"`; add
  the superseded skip so the RSI serves-coverage denominator is not inflated.
- `packages/intentionsutil/scripts/read-sensors.ts:1517-1527` — `parkedCensus`'
  `blocked` filter gains `&& !isSuperseded(n)`, so a dead tactic blocked by a
  park stops inflating the parked-critical-path count.
- `packages/intentionsutil/src/hold-alerts.ts:104-112` — the top-K pool's
  `if (node.phase === "done") continue;` becomes `if (isRetired(node)) continue;`,
  so a superseded tactic cannot occupy a top-K slot and raise unclaimed-hold
  alerts about work that is dead.
- `packages/intentionsutil/src/digest.ts` — add `tableSupersededPresent(nodes)`
  modelled line-for-line on `tableDonePresent` (:186-195), emitting
  `[SUPERSEDED-PRESENT]` over `n.kind === "tactic" && isSuperseded(n)`, and wire
  it into the table list immediately after `tableDonePresent(input.nodes)`
  (:419). This is the operator-visible answer to the node body's "give
  validate-graph something to check" worry: a superseded node is present and
  visible rather than pruned and silent.
- `packages/intentionsutil/scripts/graph-census-debt.ts:55,157-198` — exclude
  superseded nodes from `mergedUnabsorbed` and `openCensus`. Today a superseded,
  merged, not-done tactic would be counted as absorption debt, and the census has
  no way to tell "stuck" from "deliberately superseded".

Tests: extend `office-hours.test.ts`, `hold-alerts.test.ts`, `digest.test.ts`,
and the sensor suite covering `read-sensors.ts` (locate by symbol) with one case
each. Add a `mentionsRef` case in `schema.test.ts`.

**Out of scope for this unit.** `hold-sweep.ts:92,128` (HOLD-node terminal,
`attributes.hold_kind`-scoped) and `wait-sweep.ts:70-77,119,125-126` (WAIT-node
terminal, `isWaitNode`-gated at :111). Both are narrow hold/wait concerns whose
sources are structurally not supersession candidates. Read both, confirm no
change is needed, and record that in the commit message rather than editing them.
`.claude/skills/dispatch-propagate/scripts/dispatch-graph-main-red-sync:102` (a
jq `phase === "done"` re-arm latch on main-red tracking) is likewise out of
scope: main-red fix tactics are auto-created and completed, never superseded.

**Recommended model.** sonnet.

**Dependencies.** Units 1 and 2.

### Unit 5 — The owed restamp of `tactic-align-tactics-per-node-clarifications`

**Scope.** Exactly one file:
`intentions/tactic-align-tactics-per-node-clarifications.md`.

Frontmatter changes:

- `status: raw` (:11) → `status: superseded`.
- `phase: done` (:58) → `phase: null`.
- add `superseded_by:` with the single entry
  `tactic-align-tactics-immaterial-drift-redirect`, placed after `blocked_by`
  to match the field order Unit 1 establishes.

Body change: rewrite the opening section, currently headed "CLOSED 2026-08-15 —
abandoned, not completed. `phase: done` here is a lie." It must no longer say the
phase is a lie, because after this change it is not one. Replace it with a short
section recording that the node was abandoned rather than completed, that its
work moved to `tactic-align-tactics-immaterial-drift-redirect`, that the
supersession is now recorded first-class on `superseded_by` and `status`, and
that the 2026-08-15 `phase: done` force-close was reverted by
`tactic-supersession-edge-and-terminal`. Leave the rest of the body intact — it
is the historical record five dated clarifications on
`strategy-graph-native-dispatch` cite by id, and those citations must keep
resolving.

Write it by hand-editing the frontmatter, or via
`packages/intentionsutil/scripts/write-node.ts` (which requires
`--dir <abs intentions path>`); either way re-run the graph validation in
Verification afterwards.

**Two caveats the implementer must honor.**

1. This unit MUST land in the same PR as Unit 2. `phase: null` makes `isDraft()`
   true, and without Unit 2's draft-loop guard the router emits this node as an
   `/align-tactics` candidate every tick — unbounded dispatch churn.
2. Make this the LAST commit on the branch, and immediately before merge re-read
   the file at the branch tip to confirm `phase` is still `null` and `status` is
   still `superseded`. The dispatch machinery writes to `intentions/` out of
   band; a transition landing mid-PR could re-stamp the node.

**Out of scope.** No other `intentions/*.md` node is touched. Do not prune this
node, do not repoint the seven prose references that name it by id, and do not
edit the five dated clarifications on `strategy-graph-native-dispatch` that cite
it — they are historical records.

**Recommended model.** sonnet.

**Dependencies.** Units 1 and 2 (hard: see caveat 1).

## Reuse

- `validateIdArray` — `packages/intentionsutil/src/schema.ts:335-340`. Generic
  id-array validator (throws `IntentionSchemaError`, maps `requireString`).
  Reused verbatim for `superseded_by`; no new validator.
- `checkRequiredEdgeKinds` — `packages/intentionsutil/src/schema.ts:1075-1095`.
  The rules-13/14 existence+kind checker. Reused with NO signature change by
  passing `node.kind` as `expected`, which yields the same-kind rule. Call-site
  pattern at :1679-1680.
- `checkBlockedByCycles` — `packages/intentionsutil/src/schema.ts:1503-1546`.
  The graph's ONLY cycle rule (rule 15); there is no `parent` cycle rule, and
  rule 6 is parent-*kind*, not parent-cycle. Generalized into a shared
  `checkEdgeCycles` and called twice. Wired outside the per-node loop at :1694 —
  match that placement.
- `checkParentKind` — `packages/intentionsutil/src/schema.ts:1122-1134`. The
  precedent for a same-kind edge rule; rule 23's model.
- `checkStatusVocabulary` (rule 16) — `packages/intentionsutil/src/schema.ts:1197-1211`,
  wired at :1681. Already generic over any key added to a kind's vocabulary.
  Reused with zero code change: adding `superseded` to the six kind nodes is the
  whole terminal.
- `intentions/kind-kind.md:624-636` — the rule-16 prose spec, which states the
  vocabulary is self-describing per-kind data and that "the historical central
  list was raw|refining|delegated|codified; kinds that still want those values
  declare them". Confirms adding to the kind nodes is correct and sufficient,
  with no central enum to touch.
- `intentions/kind-tactic.md:104-174` (field-doc sections) and `:240-258` (the
  `done`-terminal prose) — the doc templates for the new `## superseded_by`
  section and the `superseded`-terminal paragraph.
- `IntentionNode.blocked_by` / `.validates` — `schema.ts:244-245`, `:276-277`,
  `:1016-1019`. The exact triple of edit sites (declaration, input type,
  `validateNode` default) to mirror.
- `inboundBlockers` — `packages/intentionsutil/src/transitions.ts:407-409`. The
  scan-not-index pattern for deriving the reverse edge:
  `nodes.filter((n) => n.blocked_by.includes(id)).map((n) => n.id)`. Cited as
  the SHAPE only — it is a prune-repair scan, not a maintained reverse index,
  and no index is to be built.
- `blockersComplete` — `packages/intentionsutil/src/router.ts:240-246`.
  Exported and shared with `terminus.ts`,
  `.claude/skills/dispatch-propagate/scripts/reconcile-graph-review-stall:191-202`,
  and `.claude/skills/dispatch-propagate/scripts/graph-auto-merge:263-274`.
  Fixing it once fixes all four callers.
- `readParked` and the "3. not parked" check —
  `packages/intentionsutil/scripts/check-node-selection.ts` (helper around :139,
  check around :310). The exact precedent for the new "not superseded"
  execute-side gate, including the `EXIT_STALE_SELECTION` (12) exit code and the
  `fail(code, reason, message)` shape.
- `tableDonePresent` — `packages/intentionsutil/src/digest.ts:186-195`, wired at
  :419. Line-for-line template for `[SUPERSEDED-PRESENT]`.
- `modeOf` — `packages/intentionsutil/src/coverage.ts:49-54`. The existing
  precedent for reading `status` (not `phase`) to change node handling.
- `gnode` test helper — `packages/intentionsutil/test/schema.test.ts:1253-1283`,
  and the second gnode-shaped fixture near :2412. Every field is enumerated with
  `partial.X ?? default`, so the new field must be added or every existing test
  silently receives the default instead of exercising it.
- The `blocked_by`/`validates` `validateGraph` test block —
  `packages/intentionsutil/test/schema.test.ts:1601-1782`. The full per-edge
  test shape (wrong kind, dangling, wrong target kind, valid target, cycle,
  self-loop, non-cyclic chain) to replicate for `superseded_by`.
- "rejects a validates that is not a string array" —
  `packages/intentionsutil/test/schema.test.ts:904-943`. Template for the
  `validateNode`-level type test.
- `checkWaitNodeShape` — `packages/intentionsutil/src/schema.ts:1420-1497`. The
  precedent for pinning a special marker to a restricted phase set. Cited so the
  implementer knows the pattern exists and knows this plan deliberately does NOT
  use it: pinning a superseded node's phase would pre-empt the
  partial-supersession question that
  `tactic-review-supersession-derived-subpoints` owns.

## Verification

Run from the worktree root. All three commands were confirmed working there on
2026-08-21.

The package unit suite — `schema.test.ts` alone carries 177 tests and is green
today, so any red here is this work:

```verify
npx vitest run --project packages/intentionsutil --root .
```

Typecheck. This is the check that catches a missed node-literal fixture: with
`superseded_by` required on `IntentionNode`, any of the 45 sites left unedited
fails here rather than at runtime:

```verify
.claude/skills/dispatch-propagate/scripts/run-typecheck.sh --app packages/intentionsutil
```

Whole-store graph validation against the real ~700-node corpus. This is the
end-to-end proof that every existing file still round-trips (`superseded_by`
defaults to `[]`), that the six kind vocabularies accept the new value, and that
Unit 5's restamp satisfies rules 16, 23 and 24. The store directory is a REQUIRED
positional argument — omitting it exits non-zero with a usage error, and a
cwd-relative invocation from the wrong directory can pass vacuously:

```verify
npx tsx packages/intentionsutil/scripts/validate-graph.ts intentions
```

Manual and judgment checks:

- **Selector smoke over the real store.** Run
  `npx tsx packages/intentionsutil/scripts/select-targets.ts --dir intentions`
  (the flag is `--dir`; an unknown argument throws) and confirm
  `tactic-align-tactics-per-node-clarifications` appears nowhere in the emitted
  candidate list. Before Unit 2 it would appear every tick as an
  `/align-tactics` draft candidate. This is the one check that proves the churn
  loop is closed against real data rather than a fixture.
- **Backlog band movement.** Re-run the align-tactics census
  (`packages/intentionsutil/scripts/align-tactics-census.ts`; confirm its
  argument form from its own header) and note the new backlog ratio for
  `strategy-graph-native-dispatch`. Unit 3 removes superseded tactics from both
  halves of `strategyBacklogBand`, so the published 58/236 = 24.6% will move by
  one node. Confirm the movement is exactly the one restamped node and record the
  new figure — do not read it as a regression.
- **Status-consumer confirmation.** Read each of `goals.ts:57`
  (`activeFrontier`), `sensors.ts:321` (codification drift), `sensors.ts:370`
  (`confirmPushDowns`), `coverage.ts:52` (`modeOf`), and `rungs.ts:36`
  (virtue-root check) and confirm in the PR description that a superseded node
  falls to the correct branch in each. Four are INCLUSION-based
  (`status === "codified"` / `"delegated"`) and correctly need no change;
  `activeFrontier` is EXCLUSION-based and is changed in Unit 3. State the
  confirmation explicitly — the point is that the default branch was checked,
  not assumed.
- **`STATUSES` left alone.** Confirm by reading that `schema.ts:27` still lists
  exactly four values, and that `src/index.ts:1`, `src/graph.ts:14` and
  `test/graph.test.ts:17` are unchanged apart from the new predicate re-exports.
  The decision to omit `superseded` there is deliberate and should be visible in
  the diff's absence, not accidental.
- **No second cycle-rule copy.** Confirm by reading that `schema.ts` contains
  ONE three-color DFS implementation (the shared `checkEdgeCycles`) called twice,
  not two near-identical functions. A copy would be the same defect class this
  strategy's one-shared-write-surface ruling condemns.
- **Rule numbering.** Confirm the new rules are numbered 23 and 24 in both the
  doc-comment list and the wiring comments, and that 20 remains marked RETIRED.
  Rule numbers are cross-referenced from node bodies, so a reused number silently
  breaks those citations.
- **Unit 5 pre-merge re-read.** Immediately before merge, re-read
  `intentions/tactic-align-tactics-per-node-clarifications.md` at the branch tip
  and confirm `status: superseded`, `phase: null`, and the `superseded_by` entry
  survived. An out-of-band transition write during the PR's life could re-stamp
  it.
