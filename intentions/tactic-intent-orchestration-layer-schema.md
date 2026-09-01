---
id: tactic-intent-orchestration-layer-schema
kind: tactic
statement: Classify every node field into the intent or orchestration layer and
  enforce the boundary in tooling — orchestration writers never rewrite intent
  fields, intent writers never rewrite orchestration fields
owner: ai
status: codified
parent: null
rationale: "Delegated by the 2026-08-31 /align doctrine-alignment round under
  the ratified layer-boundary disposition (strategy-explicit-intent,
  2026-08-31). Tradition reference: infrastructure-as-code spec/status
  separation (Kubernetes) — the boundary exists so controllers and humans cannot
  corrupt each other's writes; the measured body-clobber defect family (park
  refresh wiping sibling edits, transition-node dropping uncommitted
  clarifications) is the local symptom the boundary removes."
reading: null
serves:
  - strategy-explicit-intent
  - strategy-graph-self-description
recovers: []
clarifications:
  - question: Drift review [1] - how does the deferred kind-layer reconciliation
      vocabulary bind this tactic's intent/orchestration classification
      (2026-09-01)?
    answer: "(Recorded 2026-09-01 /align-tactics per-node drift review.) VOCABULARY
      BINDING. intentions/kind-kind.md:287-320 carries a DEFERRED,
      Claude-drafted reconciliation vocabulary — TARGET STATE (what the author
      intends to be true) vs OPERATIONAL STATE (what is observed to be true;
      observed and appended, never authored) — with a LEGACY MAP recasting phase
      -> derived position (stored field a migration cache), success_signal ->
      criteria, gap -> frontier, reading -> assessment. It covers the same axis
      this tactic classifies. Under the ratified authority-primacy ordering
      (RATIFIED > DEFERRED/DELEGATED > OPERATIONAL TEXT), the ratified
      intent/orchestration boundary governs, and strategy-explicit-intent's
      2026-09-01 REFINED note on keep (5) already reconciles the two by placing
      the reconciliation architecture's operational layer INSIDE the boundary as
      observed evidence rather than a second hand-maintained layer. The
      classification therefore reuses these two term pairs and mints no third
      pair. Separate naming hazard, not a doctrine conflict: 'layer' already
      carries three incumbent senses in code — validateGraph's kind-typed field
      placement (rules 9/10/12), attributes.goal_layer (kindIsNotGoalLayer in
      schema.ts), and graph-commit's Layer 1/2/3 conflict-resolution stages — so
      the new writer-authority axis needs a non-colliding identifier."
  - question: Drift review [2] - is the enforcement duty a greenfield build or a
      generalization of an existing fence (2026-09-01)?
    answer: "(Recorded 2026-09-01 /align-tactics per-node drift review.) ENFORCEMENT
      IS A GENERALIZATION, NOT A NEW GATE. The write fence already exists in a
      partial form: packages/intentionsutil/src/schema.ts:676-742 defines
      STATE_FIELDS (phase, execution, office_hours, reading, attention, rounds,
      status, blocked_by), DURABLE_LAYER_KINDS (virtue, strategy, delegation,
      kind, tradition — tactic deliberately excluded), isDurableWriteRefused and
      refusedDurableFields;
      packages/intentionsutil/scripts/check-durable-write-fence.ts wraps it as a
      CLI gate (exit 3 = REFUSED) already wired into dispatch-conflict. Its gaps
      are exactly this tactic's scope: it fences only orchestration-writer ->
      intent-field writes, scopes per KIND rather than per FIELD, and leaves
      tactic phase/execution unfenced in both directions. Two properties must
      survive the generalization. (1) The check stays NEGATIVE —
      durable/foreign-layer AND field not in the closed exemption set — so a
      novel field name refuses by default; the permissive form was ruled on
      2026-08-14 and corrected on 2026-08-15 after it failed OPEN on
      `rationale`, the field the fence exists to protect. (2) The diff is
      computed from base vs candidate full-node JSON, never from a
      caller-declared field list, because the writer that composed the candidate
      is the party whose honesty is in question. The compile-time exhaustiveness
      idiom for the field-to-layer map is already established twice —
      FIRST_CLASS_FIELD_PROBE (schema.ts:321) and MERGE_FIELD_COVERAGE_PROBE
      (node-merge.ts:92)."
  - question: Drift review [3] - does a writer declare its layer per-program or
      per-write (2026-09-01)?
    answer: "(Recorded 2026-09-01 /align-tactics per-node drift review.) LAYER
      DECLARATION IS PER-WRITE, NOT PER-PROGRAM. This node's duty 2 reads 'each
      writer declares its layer', which invites a per-program partition that
      does not exist: /align and /align-tactics land intent fields (statement,
      rationale, clarifications, plan bodies) and orchestration fields (phase,
      office_hours parks) through the same writeNode/graph-commit path within a
      single session, and graph-commit lands both. A per-program declaration
      would refuse the graph's own authoring tools. The declaration therefore
      attaches to the write operation, so a dual-layer program makes two
      declared writes rather than being denied a layer. The genuinely
      single-layer writers are the positive-control fixtures the guard must not
      trip: park-node (mutates only office_hours, optionally execution.pr) and
      apply-node-transition (mutates only phase and execution)."
  - question: Drift review [4] - did the serving strategy's recorded conditions hold
      at this finalize (2026-09-01)?
    answer: "(Recorded 2026-09-01 /align-tactics per-node drift review.) CONDITION
      CHECK, no failure. All four of strategy-explicit-intent's recorded
      conditions were checked against repo state during this finalize and none
      was found failed. Condition 2 is measurably live (decision stamps in 18
      node files, author-ratified stamps dated 2026-08-30/31 and 2026-09-01).
      Condition 1 (maintenance stays cheap) is at-risk but not failed — 795
      nodes / 13M under intentions/, with one 8974-line outlier node — and this
      tactic's compile-checked classification reduces rather than adds
      maintenance surface. Two conditions are doctrinal rather than
      instrumented: condition 3 (delegatee-education / injection lapse) has no
      mechanical injection-lapse detector anywhere in the repo, and condition
      4's standing-conditions-sweep leg is unimplemented
      (tactic-condition-review-sweep is still status raw / phase null) with no
      live scheduler, recurrence being session-triggered. Absence of
      instrumentation is not a failed condition — recurrence is directly
      evidenced by the 2026-08-31 and 2026-09-01 doctrine rounds and by this
      round — and neither condition is a premise this tactic's plan rests on:
      the plan rests on the ratified layer-boundary disposition and on
      schema/tooling facts."
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
# Classify every node field into the intent or orchestration layer and enforce the boundary in tooling — orchestration writers never rewrite intent fields, intent writers never rewrite orchestration fields

## Context

The layer boundary is a ratified disposition (`strategy-explicit-intent`,
2026-08-31): intent fields and orchestration fields are distinct layers with
distinct write authority — orchestration writers never rewrite intent fields,
intent writers never rewrite orchestration fields. Tradition reference:
infrastructure-as-code spec/status separation (Kubernetes), where the boundary
exists so controllers and humans cannot corrupt each other's writes. The local
symptom it removes is the measured body-clobber defect family: a park refresh
wiping a sibling's node edit, a transition write dropping uncommitted
clarifications. Today nothing mechanical stops either direction — `writeNode`
accepts any field the schema validates, and every writer performs a full
`readNode → mutate a few fields → writeNode` round trip, so a stale read
silently reverts whatever landed in between.

Two duties were delegated to this node, the first bounding the second.

1. **Carrier-parsimony classification.** The atomic unit of intent is the
   disposition; intent-side fields (`statement`, `rationale`, `success_signal`,
   `attributes.conditions`, `clarifications`) are role-typed *carriers* of
   dispositions. Each field is tested for a parsimonious greenfield function —
   a role distinction earns its keep only where a consumer reads it
   mechanically. Author directives bound into this evaluation: `clarifications`
   are flagged as prime for consolidation; evaluate whether the greenfield
   design includes `rationale` at all or whether a `serves` edge already carries
   that role; `owner` has no greenfield function (prior ruling,
   `strategy-explicit-intent` 2026-08-31 finalize round); test whether `status`
   follows it, its draft/codified role duplicating phase-absence;
   `reading`/`rounds` are observed state sitting on the intent side — relocate
   them to the orchestration layer. **Any carrier-consolidation proposal
   arrives as a DEFERRED disposition for author review, never executed as
   delegated.** That constraint is binding on unit 2 and on nothing else in
   this plan: units 1 and 3–6 build the classification *mechanism* and the
   fence, which are delegated to build, not consolidation of the carriers
   themselves.
2. **Tooling enforcement.** The write path refuses cross-layer rewrites: each
   writer declares its layer and a boundary check refuses a write that changes
   a field outside the declared layer. Classification lands in the kind nodes
   per the schema-as-data disposition (`strategy-graph-self-description`: kind
   nodes are the sole schema authority).

**Amendment (2026-09-01 ladder-reconciliation round).** The classification
extends to the operational layer's new carriers: evidence-log entries and claim
records. Binding author directives: claim records are one-file-per-claim (no
shared hot file); evidence appends must be commutative and mergeable;
orchestration writers append only — the layer-boundary tooling this node builds
is what enforces the tick's concurrency-safety and shared-state optimization.
The PR authority split (`strategy-graph-native-dispatch`, 2026-09-01) bounds
what the graph side may store: observed evidence and references, never
expectations about PR content.

**Surface ownership (2026-09-01).** Under the strategy-scoped reconciliation
architecture's carrier exception, this node owns the claim-record schema and
the evidence-append classification. `tactic-ladder-reconciliation-observe`
integrates this surface via a `blocked_by` edge and does not rebuild it;
`tactic-consolidation-operation` owns evidence *folding*;
`tactic-migration-frontier-projection` owns the check-tier registry and the
high-water ratchet. This node builds the schema everything downstream writes
against, and is bootstrap critical-path position P1 under the frozen-queue
authority grant.

### Greenfield design (lead)

Ideal design, independent of migration cost:

- **One axis, one name.** Every carrier of node state has exactly one *write
  class*: `intent` (target state — what the author intends to be true) or
  `orchestration` (operational state — what is observed to be true, appended
  never authored). Nothing carries both. The word *layer* is deliberately
  avoided in code identifiers: it already means three unrelated things here —
  `attributes.goal_layer` (`packages/intentionsutil/src/schema.ts:1251`),
  kind-typed field placement (`schema.ts:1379`), and `graph-commit`'s
  "Layer 1/2/3" conflict-resolution stages. The doctrine's own words are
  *intent* and *orchestration*; the code says `writeClass`.
- **Classification is data, held by the kind nodes.** `kind-kind` declares the
  write class of every field common to all nodes; the owning kind node declares
  it for its kind-scoped fields (`kind-tactic`: `phase`, `execution`,
  `validates`, `blocked_by`; `kind-strategy`: `recovers`, `rounds`) and for its
  own `attributes` keys. Code holds a mirror for the write-time fast path, and
  a graph rule fails the build when mirror and declaration disagree, so the
  kind nodes remain the sole authority without paying a store read per write.
- **Declaration is mandatory.** Every writer declares its class at the write
  call. An undeclared write is refused. There is no permissive default: a write
  fence that fails open is the failure mode already corrected once here on
  2026-08-15 (`schema.ts:713-731`).
- **The fence is bidirectional and diff-derived.** The refusal is computed from
  the prior on-disk node against the candidate, never from a caller-declared
  field list — "the writer that composed the candidate is exactly the party
  whose honesty is in question" (`check-durable-write-fence.ts:17-21`).
- **Operational carriers are files, not fields.** Claim records and evidence
  entries are one file per record, created and never edited. Append is
  *create a new file*, which makes concurrent appends commutative and
  conflict-free by construction — no shared hot file, no merge driver, no
  ordering dependency. Compaction is a separate, serialized folding operation.
- **The kind-scoped durable fence is a special case, not a rival.** The
  existing `isDurableWriteRefused` (durable kind AND field not in
  `STATE_FIELDS`) is the same idea scoped per-kind; greenfield it is one
  refusal function that unions the kind rule and the class rule.

### Brownfield path

The greenfield "declaration is mandatory" cannot land in one step: there are
21 `writeNode` call sites across 11 scripts. The migration follows the ratified
four-step contract (record target schema → open a read-tolerance window → drain
the derived frontier → ratchet), which is exactly what units 3–5 stage:

1. Record the classification as kind-node data plus a compile-checked mirror
   (unit 1, unit 3).
2. `writeNode` accepts an **optional** `writes` declaration and enforces only
   when present (unit 4) — the read-tolerance window.
3. An observe-mode census reports every undeclared call site as a frontier
   entry (unit 5); the drain is declaring them.
4. Ratchet: once the census is empty, the parameter becomes required. **The
   ratchet flip is out of scope for this node** — check-tier registration and
   high-water promotion are `tactic-migration-frontier-projection`'s surface.

Three fields resist a clean single-class answer today because live writers of
both classes touch them. They are classified `shared` — an explicitly declared
**shim** with a liquidation condition, per the shim doctrine — rather than
forced, because forcing them would either break a live path or fail the fence
open. The shim's liquidation is the author's ruling at the deferred review
(unit 2).

## Units of work

### Unit 1 — Record the write-class classification as kind-node data

**Scope.** Declare the field → write-class map as data on the kind nodes, and
reconcile the prose tables that already half-carry it.

Edit `intentions/kind-kind.md`:

- Add `attributes.field_write_class`: a map from every field common to all
  nodes to `intent` | `orchestration` | `shared`. The `attributes:` block
  starts at `intentions/kind-kind.md:370`; add the new key beside the existing
  `fields_defined_for_all_nodes` list.
- Add `attributes.write_class_shims`: for each `shared` field, an entry
  `{field, reason, liquidation}` naming why it is shared today and the
  condition that ends the shim.
- Add a `Write class` column to the "Required core" table
  (`intentions/kind-kind.md:494`) and the "Optional common fields" table
  (`:506`), and to the "Kind-scoped fields" table (`:533`), so the normative
  prose home carries the same classification the attributes declare.
- Fix the stale `gap` row at `intentions/kind-kind.md:517`. It documents `gap`
  as a stored optional common field with a `null` default, but `gap` is not a
  member of `IntentionNode` (`packages/intentionsutil/src/schema.ts:256-305`)
  and nothing writes it —
  `grep -rn "\bgap\b" packages/intentionsutil/src/schema.ts` returns nothing,
  and `grep -n "^gap:" intentions/strategy-explicit-intent.md` returns nothing.
  It is derived on read by `deriveGap`
  (`packages/intentionsutil/src/sensors.ts:241`), which is what the same node
  already says at `:386-388` and `:951-955`. Replace the table row with a
  derived-on-read note; do not add `gap` to the schema.

Edit `intentions/kind-tactic.md` (`attributes:` at `:111`) and
`intentions/kind-strategy.md`: add `attributes.field_write_class` covering only
that kind's kind-scoped fields and its declared `attributes` keys
(`kind-tactic` today declares `attention`, `measured_impact`, `ledger_entry` at
`intentions/kind-tactic.md:113-123`).

**The classification to record** (this is the decided content, not a research
task):

- `intent` — `id`, `kind`, `statement`, `owner`, `parent`, `serves`,
  `recovers`, `rationale`, `clarifications`, `tooling_goals`,
  `success_signal`, `validates`, `superseded_by`, `supersession_expiry`.
- `orchestration` — `phase`, `execution`, `office_hours`, `pace_exempt`,
  `reading`, `rounds`.
- `shared` (declared shims, each with a liquidation condition):
  - `status` — machine-stamped by the transition writers today and a member of
    `STATE_FIELDS` (`schema.ts:676-685`), yet its draft/codified role is
    provenance on a disposition. Liquidation: the author's ruling on the
    `status`-retirement proposal in unit 2.
  - `blocked_by` — mechanically minted by the hold path, and simultaneously the
    carrier of authored sequencing edges (the bootstrap critical path is
    encoded as `blocked_by` edges on the carrier tactics). Liquidation: the
    author's ruling on whether authored sequencing moves to a distinct
    intent-class carrier.
  - `attention` — kind-kind describes it as a user-authored injection
    (`intentions/kind-kind.md:940-949`) but it sits in `STATE_FIELDS`.
    Liquidation: the ruling in unit 2. Before recording it as `shared`, run
    `grep -rn "\.attention =" packages/intentionsutil .claude/skills` — if no
    orchestration writer assigns it, record it `intent` and note the
    `STATE_FIELDS` membership as the frontier item instead.
- `attributes` — not classified as a whole. Each declared `attributes` key
  carries its own class on the kind node that owns it; an undeclared key is
  `shared` and appears on the unit 5 census. Record `conditions` (on
  `kind-strategy`) as `intent` and `measured_impact` (on `kind-tactic`) as
  `orchestration`.

Also record, in the kind-kind body beside the tables, that
**claim records and evidence-log entries are `orchestration`-class carriers
that are create-only** — never rewritten, never deleted by a writer — so the
classification covers unit 6's surface as data rather than only as code.

**Out of scope.** Any change to `packages/intentionsutil/` (unit 3 owns the
mirror); any carrier *consolidation* — no field is removed, renamed, or
retired here; any edit to a node other than the three kind nodes.

**Landing.** This unit touches `intentions/` only. Land it with
`packages/intentionsutil/scripts/graph-commit -C <repo root> -m '<single-line
message>'`, run with `dangerouslyDisableSandbox: true` on the first attempt and
a single-line `-m` — a sandboxed first attempt reverts the uncommitted node
edit with nothing left to retry on, and a multi-line message needs a command
substitution the worktree guard refuses. Do not open a PR for this unit.

**Recommended model:** opus.

### Unit 2 — Record the carrier-parsimony evaluation as a DEFERRED disposition

**Scope.** Duty 1's output: one clarification appended to
`intentions/kind-kind.md`'s `clarifications:` block, stamped
`(decision: deferred — Claude-drafted, held for author review)` and carrying a
`YYYY-MM-DD` provenance date (graph rule 17 requires the date;
`packages/intentionsutil/src/schema.ts` `checkClarificationDates`). It is
recorded **once**, on `kind-kind` — the schema authority, and the
topologically prominent home for schema-carrier doctrine. Do not duplicate the
stamp onto `strategy-explicit-intent`; one ruling, one stamp.

The clarification must answer: *which intent-side carriers survive a
parsimony test, and which collapse?* Cover, each with a recommendation and its
reasoning, and each explicitly non-executed:

- `owner` — prior ruling: no greenfield function. Recommend retirement;
  note that `validateNode` requires it today so retirement is a migration.
- `status` — test whether it follows `owner`. Its draft/codified role
  duplicates phase-absence for tactics, and for non-tactics it duplicates the
  disposition authority stamp. Note the countervailing consumer: rule 16
  (`checkStatusVocabulary`) reads it mechanically against each kind node's
  `attributes.status_vocabulary`, which is exactly the "a role distinction
  earns its keep where a consumer reads it mechanically" test — so state
  plainly whether that consumer is load-bearing or itself removable.
- `rationale` — evaluate whether the greenfield design includes it at all, or
  whether a `serves` edge already carries "why this node exists". Note that
  `rationale` is scanned for prose refs and is the field the durable-write
  fence was corrected to protect (`schema.ts:713-731`).
- `clarifications` — flagged by the author as prime for consolidation. Say what
  consolidation would mean for the carrier (a list of dated Q&A pairs vs a
  folded restatement) and hand the mechanism to
  `tactic-consolidation-operation` rather than proposing one here.
- `reading` and `rounds` — observed state sitting on the intent side.
  Recommend relocation to the orchestration layer; note that unit 1 already
  classifies them `orchestration`, so the *classification* is done and only the
  carrier's home is the open question.
- The three `shared` shims from unit 1, each with the ruling the author must
  make to liquidate it.
- Vocabulary reconciliation: `kind-kind`'s own deferred reconciliation
  vocabulary (`intentions/kind-kind.md:281-357`) names TARGET STATE and
  OPERATIONAL STATE for the same distinction this node calls intent and
  orchestration. State the mapping (intent = target state, orchestration =
  operational state) and recommend that the ratified pair (intent/orchestration)
  stays the code vocabulary until the deferred vocabulary is itself ratified,
  under the authority-primacy ordering. Do not mint a third pair.

**Out of scope.** Executing any recommendation. No field is added, removed,
renamed, or reclassified by this unit; no code changes. The clarification is a
proposal.

**Dependencies.** Unit 1 (the shim list and the recorded classification are its
inputs).

**Landing.** `intentions/`-only, same `graph-commit` procedure as unit 1.

**Recommended model:** opus.

### Unit 3 — Write-class primitives in `schema.ts` plus the mirror-agreement rule

**Scope.** `packages/intentionsutil/src/schema.ts` and
`packages/intentionsutil/test/schema.test.ts`.

Add, beside the existing field vocabularies:

- `export type WriteClass = "intent" | "orchestration" | "shared";`
- `const FIELD_WRITE_CLASS_PROBE: Record<keyof IntentionNode, WriteClass>` —
  the compile-time exhaustiveness idiom already used at `schema.ts:321`
  (`FIRST_CLASS_FIELD_PROBE`) and at
  `packages/intentionsutil/src/node-merge.ts:92`
  (`MERGE_FIELD_COVERAGE_PROBE`). Adding a field to `IntentionNode` without
  classifying it must be a compile error, not a silent gap. Populate it from
  unit 1's recorded classification, verbatim.
- `export function fieldWriteClass(field: string): WriteClass | null` — `null`
  for a name that is not a first-class field.
- `export function refusedCrossClassFields(writer: WriteClass, changed:
  readonly string[]): string[]` — the fields `changed` contains that a writer
  of class `writer` may not touch. `shared` fields are permitted to both
  classes; a `shared` *writer* is not a legal declaration and must throw.
  Follow `refusedDurableFields` (`schema.ts:740`): one implementation, so no
  caller can spell the loop and invert it.
- `export function refusedFields(writer: WriteClass, kind: string, changed:
  readonly string[]): string[]` — the union of `refusedCrossClassFields` and
  the existing `refusedDurableFields(kind, changed)` (`schema.ts:740`). This is
  the single refusal function; `isDurableWriteRefused` (`:728`) and
  `refusedDurableFields` keep their current signatures and behaviour unchanged
  because `check-durable-write-fence.ts` and
  `.claude/skills/dispatch-conflict/SKILL.md` consume them.

Add **rule 27** to `validateGraph`: the kind-node declarations and the code
mirror agree. Follow `checkKindTypedFields` (`schema.ts:1379`) exactly for
signature and registration convention — a `checkWriteClassDeclaration(node,
byId, problems)` appended to the per-node loop in `validateGraph`
(`schema.ts:2028`, registrations at `:2052-2077`, after the rule 26 line). It
reports a problem when: a field named in `FIELD_WRITE_CLASS_PROBE` has no
declaration on the owning kind node, a declaration names a class the code map
disagrees with, or a declaration names a field that is not a first-class field.
Read the declaration off the kind node the way `kindIsNotGoalLayer`
(`schema.ts:1251`) reads `attributes.goal_layer` — from `byId`, never a
hardcoded kind list. Rule 26 is the current highest rule number; 27 is next.

Tests go in `packages/intentionsutil/test/schema.test.ts`, following the
existing kind-typed-field / goal-layer-only block's structure (positive and
negative cases, `IntentionSchemaError` with a regex-matched message).

**Out of scope.** Any change to `writeNode` (unit 4). Any change to the
existing durable-fence behaviour or its exit codes. Any reclassification of a
field — the map is transcribed from unit 1, and a disagreement between them is
a bug in this unit, not a licence to re-decide.

**Dependencies.** Unit 1.

**Recommended model:** opus.

### Unit 4 — Enforce the boundary at the `writeNode` seam

**Scope.** `packages/intentionsutil/src/store.ts` and the orchestration-class
call sites.

`writeNode` (`packages/intentionsutil/src/store.ts:52`) is the single write
gate — every writer reaches disk through it. Widen it to
`writeNode(dir, node, opts?: { writes?: WriteClass })`. When `opts.writes` is
present and a file already exists at `<dir>/<id>.md`:

1. Read and parse the prior on-disk node. `writeNode` already reads that file
   twice (`readExistingBody`, and `assertNoBodyLoss` at `store.ts:104`) — reuse
   one read rather than adding a third.
2. Diff prior against `validated`, top-level fields only, using
   `packages/intentionsutil/src/node-merge.ts:103`'s `eq` (order-independent
   for object keys, order-dependent for arrays) so a YAML key reordering is not
   read as a change.
3. `refusedFields(opts.writes, prior.kind, changed)` — non-empty means throw
   `IntentionSchemaError` naming the node, the declared class, the changed
   fields and the refused subset. Model the message on
   `refusalMessage` (`packages/intentionsutil/scripts/check-durable-write-fence.ts:150`)
   and reuse `node-merge.ts:15`'s `{field, ours, theirs}` `FieldConflict` shape
   for the per-field detail, so `graph-commit`'s existing
   `CONFLICT_FIELDS_JSON` plumbing can consume it later without new diagnostics.

Add `assertWriteClassBoundary(prior, validated, writes)` as an exported
sibling of `assertNoBodyLoss` — same shape: a structural pre-write guard that
refuses a write that would silently clobber content it has no authority over.

When `opts` is absent the behaviour is byte-for-byte what it is today. This is
the read-tolerance window; do not make the parameter required in this unit.

Then declare the class at the orchestration-class call sites, which are the
writers named in the delegation and already narrowly mutate state only:

- `packages/intentionsutil/scripts/apply-node-transition.ts:201` — mutates
  `phase` and `execution` only.
- `packages/intentionsutil/scripts/park-node:366` — mutates `office_hours` and
  optionally `execution.pr` only. The wrapper
  `.claude/skills/dispatch-propagate/scripts/transition-node:1-38` already
  documents a state-only commit doctrine; cite it rather than restating it.
- `packages/intentionsutil/scripts/clear-park:369` and
  `packages/intentionsutil/scripts/resolve-park:163`.
- `packages/intentionsutil/scripts/apply-fix-state.ts:266,292,310,391,409,426`
- `packages/intentionsutil/scripts/apply-conflict-state.ts:336,366,414,444`
- `packages/intentionsutil/scripts/apply-lane-pass.ts:213`
- `packages/intentionsutil/scripts/read-sensors.ts:1803` — writes `reading`.

Leave undeclared, deliberately: `packages/intentionsutil/scripts/write-node.ts:61`
(the general-purpose CLI, whose class is the caller's, not the script's),
`packages/intentionsutil/scripts/graph-commit:3434` (the merge landing path,
which by construction lands both classes), and
`packages/intentionsutil/scripts/reconcile-graph.ts:269,301,324`. These are the
census's initial contents (unit 5); each needs its own ruling, not a guess.

Verify each declared call site does not trip its own guard before committing —
`park-node` and `apply-node-transition` normal operation are the positive
controls, and a red one means the classification or the mutation is wrong, not
that the guard should be loosened.

Tests: extend `packages/intentionsutil/test/store.test.ts` for the guard itself
(undeclared write unchanged; declared orchestration write of `phase` passes;
declared orchestration write of `statement` refuses; declared intent write of
`phase` refuses; a `shared` field passes under both), and
`packages/intentionsutil/test/apply-node-transition.test.ts` plus
`packages/intentionsutil/test/write-node.test.ts` for the writer-side positive
controls.

**Out of scope.** Making the declaration required. Any change to the
`intentions/` store. Any new CLI.

**Dependencies.** Unit 3.

**Recommended model:** opus.

### Unit 5 — CLI fence flag and the observe-mode declaration census

**Scope.**

1. `packages/intentionsutil/scripts/check-durable-write-fence.ts` gains an
   optional `--writer-class <intent|orchestration>` flag. When passed,
   `fenceVerdict` (`:115`) unions `refusedCrossClassFields` into the refusal
   alongside the existing durable-kind union at `:140-143`, and
   `refusalMessage` (`:150`) names which fence refused. Exit codes are
   unchanged: 0 permitted, 1 usage/read error, 3 REFUSED. Without the flag the
   tool behaves exactly as it does today — `.claude/skills/dispatch-conflict/SKILL.md`
   and `intentions/tactic-dispatch-conflict-substance-allowlist` depend on that.
   Extend `packages/intentionsutil/test/durable-write-fence.test.ts` rather
   than adding a file.
2. A new read-only census,
   `packages/intentionsutil/scripts/write-class-census.ts`, that enumerates
   every `writeNode(` call site under `packages/intentionsutil/` and reports
   which declare a class and which do not, plus every first-class field and
   `attributes` key with no kind-node declaration. Prints a summary and exits
   0 always — this is an observe-tier report, never a gate. Header must
   document the usage as
   `node --import tsx/esm packages/intentionsutil/scripts/write-class-census.ts`
   (never `npx tsx`, which dies with `listen EPERM` under the sandbox).

The census is the derived migration frontier for this boundary. Registering it
as a check with a tier, and the high-water ratchet that would flip it to
gating, are `tactic-migration-frontier-projection`'s surface — this unit
produces the reading, not the registry.

**Out of scope.** Any ratchet, any check registry, any CI wiring. Making the
census fail non-zero.

**Dependencies.** Units 3 and 4.

**Recommended model:** sonnet.

### Unit 6 — Claim-record and evidence-entry schema

**Scope.** The operational-layer carriers this node owns. New files:
`packages/intentionsutil/src/operational-records.ts` (pure: types, validators,
deterministic ids, path helpers) and
`packages/intentionsutil/src/operational-store.ts` (fs: create-only append and
read), with tests in
`packages/intentionsutil/test/operational-records.test.ts`.

**On-disk layout.** Both live under `intentions/operational/`, which
`listNodes` (`packages/intentionsutil/src/store.ts:232`, delegating to
`listNodesResilient`, whose scan at `:194-196` reads only top-level `*.md` in
the store dir) does not see, so these files are invisible to
`validateGraph` and cannot be mistaken for nodes.

- Claim records: `intentions/operational/claims/<claim-id>.json`, one file per
  claim. This is the author directive verbatim: one file per claim, no shared
  hot file.
- Evidence entries: `intentions/operational/evidence/<strategy-id>/<YYYYMMDD>-<hash12>.json`,
  one file per entry, where `hash12` is the first 12 hex chars of the sha256 of
  the canonicalized entry payload. One file per entry is what makes appends
  **commutative and mergeable**: concurrent appends are disjoint file creations,
  which git merges without a conflict and in any order, and an identical entry
  written twice collapses onto the same path, so append is idempotent.

**Evidence entry shape** (`evidence.v1`), matching the ratified finding-ledger
tuple `{finding, criterion-or-gap, disposition, claim/PR, date, recurrence key}`:

- `schema`: `"evidence.v1"`
- `strategy`: the strategy id the entry bears on
- `criterion`: criterion id, or `null` when the entry bears on a prose gap
- `gap`: the gap text when `criterion` is `null`, else `null` (exactly one of
  `criterion`/`gap` is non-null — validated)
- `finding`: the observed fact or finding, prose
- `disposition`: `"fixed" | "frontier-routed" | "refuted" | null`
- `proof`: at least one of `{sha, pr, stamp, check}` — an entry with no proof
  is refused (evidence is an appended observed fact *with proof*)
- `recurrence_key`: a stable slug grouping recurrences of one finding class
- `claim`: the claim id the entry was produced under, or `null`
- `observed_at`: `YYYY-MM-DD`

**Claim record shape** (`claim.v1`):

- `schema`: `"claim.v1"`
- `claim_id`, `strategy`
- `bite`: the frontier-entry / criterion ids reserved by this claim
- `claimed_at`, `expires_at`: ISO-8601 instants — a claim is an *exclusive,
  time-bounded* reservation, so `expires_at` is required and an expired claim
  is not live
- `holder`: `{session, worktree, branch}`
- `pr`: number or `null`

**Behaviour.**

- `appendEvidence(dir, entry)` and `mintClaim(dir, claim)` create a file and
  **refuse to overwrite an existing path with different content** — a differing
  payload at the same path is a hash collision or a rewrite attempt, both of
  which must throw (`.claude/rules/code-style.md`: a clear error, never a
  fallback). Identical content at the same path is a no-op success.
- No update and no delete primitive exists. Correction is a new entry that
  supersedes, never an edit. Folding is
  `tactic-consolidation-operation`'s surface and is not built here.
- `conflictingClaims(claims)` — a pure predicate reporting two live
  (non-expired) claims on the same strategy whose `bite` sets intersect.
  Exclusivity is *asserted* here and *enforced* by the serialized landing lock;
  this function is what the enforcement will call.
- Validators throw `IntentionSchemaError`
  (`packages/intentionsutil/src/errors.ts`) with the offending field named,
  consistent with the rest of the store.
- **PR authority split**: the graph side stores observed evidence and
  references only. `pr` is a number — a reference. Nothing in either shape may
  carry expectations about PR content (no title, no body, no expected diff);
  the validator rejects unknown keys so such a field cannot be smuggled in.

**Out of scope.** The tick that writes these records; the landing path
(`graph-commit` stages `intentions/<id>.md` by node id and will need a separate
path for these — that is `tactic-ladder-reconciliation-observe`'s integration);
evidence folding and unmatched-evidence detection
(`tactic-consolidation-operation`); the frontier deriver
(`tactic-migration-frontier-projection`); any change to `IntentionNode`.

**Dependencies.** Unit 1 (records the create-only orchestration classification
these shapes implement).

**Recommended model:** opus.

## Reuse

- `packages/intentionsutil/src/store.ts:52` — `writeNode`, the single write
  gate all ~21 call sites pass through; the enforcement seam for unit 4.
- `packages/intentionsutil/src/store.ts:104` — `assertNoBodyLoss`, the
  established pre-write structural-guard idiom
  `assertWriteClassBoundary` mirrors.
- `packages/intentionsutil/src/store.ts:194-196` — `listNodesResilient`'s
  top-level-only `*.md` scan (shared by `listNodes`, `:232`), which is why unit 6's subdirectory layout is safe.
- `packages/intentionsutil/src/schema.ts:321` and `:352` —
  `FIRST_CLASS_FIELD_PROBE` / `FIRST_CLASS_FIELD_NAMES`, the
  `Record<keyof IntentionNode, …>` compile-time exhaustiveness pattern unit 3
  copies.
- `packages/intentionsutil/src/node-merge.ts:92` —
  `MERGE_FIELD_COVERAGE_PROBE`, the second instance of the same pattern, and
  the closest existing precedent for an exhaustive per-field partition.
- `packages/intentionsutil/src/node-merge.ts:103` — `eq`, order-independent
  structural equality; the correct comparator for unit 4's prior-vs-candidate
  diff (`JSON.stringify` would false-refuse on a YAML key reorder).
- `packages/intentionsutil/src/node-merge.ts:15-26` — `FieldConflict` /
  `MergeResult`, already consumed end-to-end by `graph-commit`'s
  `CONFLICT_FIELDS_JSON`; reuse the shape for refusal diagnostics.
- `packages/intentionsutil/src/schema.ts:676` — `STATE_FIELDS`, the closed
  machine-settable set; the direct precursor and the source of the three
  `shared` shims.
- `packages/intentionsutil/src/schema.ts:728,740` —
  `isDurableWriteRefused` / `refusedDurableFields`; the negative-check
  discipline (unknown field refuses) unit 3's class fence must copy, and the
  reason at `:713-731` for why the positive form was corrected out.
- `packages/intentionsutil/scripts/check-durable-write-fence.ts:77,115,150` —
  `changedFields`, `fenceVerdict`, `refusalMessage`; the working CLI gate unit
  5 extends rather than replaces.
- `packages/intentionsutil/src/schema.ts:1251,1347` — `kindIsNotGoalLayer` /
  `checkGoalLayerOnlyFields`; the "kind node declares an attribute,
  `validateGraph` gates off it" data-driven mechanism unit 3's rule 27 mirrors.
- `packages/intentionsutil/src/schema.ts:1379` — `checkKindTypedFields`; the
  signature and registration convention for a new numbered rule.
- `packages/intentionsutil/src/schema.ts:2028` — `validateGraph`, whose
  per-node loop (`:2052-2077`) is where rule 27 registers.
- `packages/intentionsutil/src/errors.ts` — `IntentionSchemaError`, the
  throw type for every refusal in this plan.
- `intentions/kind-kind.md:492-548` — the "Fields on every node" tables, the
  normative prose home already half-carrying this classification.
- `packages/intentionsutil/test/schema.test.ts` (kind-typed-field /
  goal-layer-only block), `packages/intentionsutil/test/durable-write-fence.test.ts`,
  `packages/intentionsutil/test/store.test.ts`,
  `packages/intentionsutil/test/apply-node-transition.test.ts`,
  `packages/intentionsutil/test/write-node.test.ts` — extend these; add no new
  test file except unit 6's.

## Verification

Run after each code unit and before every commit:

```verify
npx vitest run --project packages/intentionsutil --root .
```

```verify
.claude/skills/dispatch-propagate/scripts/run-typecheck.sh
```

```verify
.claude/skills/dispatch-propagate/scripts/run-lint.sh
```

Graph validation, after units 1, 2 and 3 (rule 27 fails here if the kind-node
declarations and the code mirror disagree):

```verify
node --import tsx/esm packages/intentionsutil/scripts/validate-graph.ts intentions
```

`npx tsx` is not an alternative spelling — it dies with `listen EPERM` before
reaching the script under the sandbox. Use `node --import tsx/esm`.

Manual and judgment checks:

- **Unit 1/2 land as graph commits, not as PR content.** After each, confirm
  the node file on `origin/main` carries the edit and that `graph-commit`
  reported a landed commit — a `graph-commit` that exits 0 having landed
  nothing is the known "landed that landed nothing" failure, which happens when
  `-C <repo root>` is omitted and it commits the wrong checkout.
- **Unit 2's stamp is deferred, and only deferred.** Read the appended
  clarification back and confirm it carries
  `(decision: deferred — Claude-drafted, held for author review)`, a
  `YYYY-MM-DD` date, and no executed change. A carrier-consolidation proposal
  executed as delegated is a doctrine violation, not a scope overrun.
- **Unit 4 positive controls are behavioural, not just unit tests.** Exercise a
  real `park-node` and a real `apply-node-transition` against a scratch store
  fixture and confirm neither trips the new guard. A tripped guard means the
  classification or the mutation is wrong; per `.claude/rules/test-integrity.md`
  it is never grounds for weakening the guard or the test.
- **Unit 4 leaves the undeclared path byte-identical.** Confirm that a
  `writeNode` call with no `opts` produces the same file bytes as before the
  change for at least one node of each kind.
- **Unit 5's census is observe-tier.** Confirm it exits 0 with a non-empty
  undeclared list — a non-zero exit here would gate the boundary before the
  drain, which the ratified migration contract forbids.
- **Unit 6's append is commutative.** Append two different evidence entries in
  both orders into two copies of the same fixture directory and confirm the
  resulting directories are identical; append the same entry twice and confirm
  the second is a no-op success.
- **Downstream consumers are unbroken.** `check-durable-write-fence.ts` without
  `--writer-class` must behave exactly as documented in
  `.claude/skills/dispatch-conflict/SKILL.md`; re-read that skill's invocation
  and confirm the flagless contract and the 0/1/3 exit codes still hold.
