---
id: kind-kind
kind: kind
statement: A kind defines the semantics of a class of nodes
owner: human
status: codified
parent: null
rationale: >-
  Every file in this directory is one node: YAML frontmatter plus a markdown
  body whose function each kind declares (see the body-function clarification).
  A node's `kind` names the kind node (`kind-<kind>`) that defines its semantics
  — which `attributes` it carries, which edges it may have, and how progress
  works for it. This node describes itself (`kind: kind`); the regress is
  finite.


  The graph is self-describing: read this node, then the kind nodes, then
  everything else. The set of valid kinds is the set of committed kind nodes,
  not an enum in code — `validateGraph` (packages/intentionsutil) enforces that
  every referenced kind node exists and that every `parent` and `serves` edge
  resolves.


  Layering, root to leaf: VIRTUES at the roots — dispositions, never complete,
  several roots form a forest (kind-virtue). STRATEGIES below them — the highest
  goals a virtue generates against present conditions; the one phase change in
  the graph (disposition to state) happens at this edge (kind-strategy). TACTICS
  at the bottom — transient, completable units of execution that may form
  subtrees rooted at an epic (kind-tactic). DELEGATIONS are not goals: they are
  attachment records, the surface where capture is detected and recovery kept
  real (kind-delegation). Lifecycle differs by layer: virtues are unconditional
  (exceptionless in application, amendable only by deliberate dialectic —
  kind-virtue), strategies are persistent (they end only by condition-expiry or
  deliberate retirement), tactics are transient (removed from the graph on
  completion).


  Five edge fields carry the graph. `parent` is the within-layer edge:
  constitutive between virtues, means-end between goals. `serves` is the
  cross-layer edge: a strategy serves the virtues it expresses; a tactic serves
  the strategies it advances; a delegation serves the nodes that depend on it.
  `recovers` points a strategy at the delegation records its work unwinds
  (kind-strategy). `blocked_by` gates tactic ordering — no tactic in a blocked
  subtree begins until the blocking tactics complete — and `validates` marks the
  tactics that validate a strategy's signal; both are tactic-layer edges
  resolved by validateGraph like the rest.
reading: null
serves: []
recovers: []
clarifications:
  - question: What is the markdown body below the frontmatter?
    answer: "The kind-defined prose surface: each kind node declares its body's
      function — kind → normative schema detail; tactic → the execution plan;
      strategy → settled design and mechanism notes; virtue → the extended
      articulation of the disposition; tradition → reading notes; delegation →
      the audit narrative. The body is authoritative for its declared function
      and never a shadow copy of frontmatter. Supersedes the 'cosmetic render of
      statement' doctrine, which was already false for tactics — their bodies
      carry the clean-session plans dispatch executes. Recorded 2026-07-09
      interview (strategy-graph-self-description)."
  - question: How does an authored boost compose across the parent/serves chain — as
      a flat global sum, or namespaced by the distributor?
    answer: "(Recorded 2026-08-11.) Namespaced, and asymmetrically by kind — the
      accumulated (source-node, amount) set described in this node's body under
      'Derived values are never stored' is what the order reads FROM, not itself
      the order. A tactic's own authored boost orders it only within the band of
      the strategy distributing to it, at its tier: it can never carry the
      tactic past a tactic of a higher-ranked strategy in the same tier, and a
      tactic with several distributors sits in the band of the highest-ranked
      one (max across distributors, never the sum) — the same max rule the
      effective-tier fixpoint already applies. A strategy's authored boost is
      the complementary case: additive and unscoped, summing with its parent's
      down parent/serves, so a child strategy may be boosted in conjunction with
      its parent to outrank cousin and uncle strategies. Tier dominates both
      lexicographically. (Corrected 2026-08-11, third round: the clause here
      previously called tier the ONLY cross-strategy escape. It is not — see the
      escape-set clarification below.) The derived-state doctrine is unchanged:
      rank stays computed on read and is never stored — this clarifies the ORDER
      the accumulated claims express, not where they live. As implemented,
      resolveAttention sums a tactic's own boost with its strategy-distributed
      value (packages/intentionsutil/src/attention.ts), so the namespacing is
      not yet mechanically enforced; the greenfield target is lexicographic
      ordering by (tier, distributing-strategy rank, within-strategy value),
      with a behavioral-doctrine-plus-lint migration first. Tracked at
      tactic-attention-namespaced-rank; the ownership half of the doctrine (who
      may write which attention) lives on strategy-recursive-self-improvement.
      Amended 2026-08-12: the composition question is settled, and the ASYMMETRY
      BY KIND is retired. There is one relation and one rule for every kind: a
      node's score is its own per-tier boost plus the sum of the boosts of every
      distinct node in its lineage, each counted once. Strategies are banded on
      the same terms as tactics (a strategy's band is the maximum score among
      its own parents), so 'strategies live on a single flat additive scale' no
      longer holds. The namespacing BOUND this entry records is preserved — a
      tactic still cannot outrank a tactic of a higher-ranked strategy — but it
      is now delivered by the band component of a uniform key rather than by a
      kind-specific rule."
  - question: What exactly are the three components of the rank key, and how is each
      derived?
    answer: "(Recorded 2026-08-11, third round, after adversarial review found the
      second-round statement of this key underspecified in all three
      components.) The key is the lexicographic triple (tier, band, residual),
      descending. TIER — unchanged, the existing max-lifted effective tier. BAND
      — the resolved rank of the strategy the node sits under, derived by the
      SAME downward monotone fixpoint the effective tier already uses
      (attention.ts, the effectiveTier loop): band(n) = max(ownBand(n), max over
      distributors d of band(d)), where ownBand is a strategy's own resolved
      rank and 0 for every other kind. Deriving it as a fixpoint rather than as
      a direct max over the node's own distributor set is what makes it total:
      an epic child whose only distributor is another tactic inherits its
      subtree root's band instead of falling to 0; a node with no distributor at
      all gets an honest 0; and because the band is computed OUTSIDE the
      tier-isolation filter, it survives a tier lift, so the namespacing bound
      stays live at tier 2 and tier 3 — where every bug fix and every red-main
      item lives — instead of going inert exactly where it matters most. That
      also answers, in the affirmative, the tier-isolation question absorbed
      into tactic-attention-namespaced-rank: a lower-tier strategy does define
      the band for a tier-lifted tactic. RESIDUAL — the node's value MINUS its
      band, i.e. its own authored boost plus the signal term plus the capture
      term. This is deliberately not 'the node's own boost': defining the third
      component as own-boost-only would drop the signal term (on-path to an
      unvalidated success_signal) and the capture term (recovers severity) out
      of ordering entirely, silently demoting two of the three registered terms;
      and leaving it as the bare value would double-count the distributing
      strategy's rank, once as the band and once inside value, so that order
      within a band would still track strategy rank rather than the node's own
      claim. Taking the residual keeps every registered term live, keeps
      resolveAttention's composition untouched (the band is a subtraction, not a
      rewrite), and preserves the shape the 2026-07-18 tier amendment already
      established for tiers: terms-and-weights govern ordering WITHIN a band.
      (Amended 2026-08-12, office-hours round that cleared
      tactic-attention-namespaced-rank's park.) The RESIDUAL derivation stated
      above is corrected. 'The node's value MINUS its band' does not equal the
      gloss that follows it -- 'its own authored boost plus the signal term plus
      the capture term' -- and the gloss is the intended meaning.
      resolveAttention distributes ancestors' AUTHORED claims only
      (packages/intentionsutil/src/attention.ts, the authored fixpoint at lines
      417-437), while the signal and capture terms are computed per node and
      never flow downward (lines 553-556). So subtracting a band equal to the
      distributing strategy's RESOLVED rank subtracts that strategy's own signal
      and capture weight as well, driving the residual negative by up to that
      amount -- the worked case recorded on strategy-recursive-self-improvement,
      where strategy-rsi-plan-surface's tactics sit in band 9 carrying an
      authored 8 for a residual of MINUS 1 -- and letting the distributing
      strategy's own terms reorder tactics WITHIN a band, the exact artifact the
      residual exists to remove. Corrected: BAND is unchanged, a strategy's own
      RESOLVED rank exactly as stated above. RESIDUAL is the node's value minus
      the authored contribution INHERITED from its distributors, which is
      precisely the gloss above -- its own authored boost plus its own signal
      term plus its own capture term. So defined, the residual is never
      negative, keeps all three registered terms live in ordering, and leaks
      nothing from the band into within-band order. This also preserves the
      flat-additive-strategy-scale property that
      tactic-attention-namespaced-rank's greenfield target asserts (strategies
      live on a single flat additive scale, unchanged from today): a strategy's
      own band is its resolved rank, so strategy-versus-strategy order remains
      exactly today's value order, with the residual acting only as a tiebreak.
      Deriving the band from the authored term instead would have made a
      strategy's own key the lexicographic pair (authored, signal+capture) and
      reordered strategies against each other, which that property forbids -- a
      cost the park reason did not surface. This closes, in favour of the
      resolved value, the ownBand question strategy-recursive-self-improvement
      records as an open decision recorded on tactic-attention-namespaced-rank.
      Author-directed: the author accepted this resolution on trust in the same
      round rather than deriving it, so it is enrolled for re-validation as a
      born-parked office-hours review sitting
      (tactic-review-band-derivation-ratification). Amended 2026-08-12 (/align
      round on strategy-graph-drives-dispatch; the unified ranking model). The
      key is no longer a triple and RESIDUAL IS RETIRED as a distinct component.
      The key is the lexicographic QUADRUPLE (resolved tier, band, score,
      depth), descending. TIER and BAND are unchanged in derivation. SCORE
      replaces residual, and the residual correction recorded above becomes MOOT
      rather than merely superseded — under the unified model every term flows
      down the parent relation (the signal term is retired outright, and capture
      becomes lineage via `recovers`), so a node's lineage necessarily contains
      its band-defining parent and everything above it. Therefore band <= score
      always, the residual can never go negative, and since every node sharing a
      band has that same band value inside its score, subtracting it is
      subtracting a constant: ordering by score within a band is IDENTICAL to
      ordering by residual. The residual existed to stop the band leaking into
      within-band order; making every term flow down removes the leak at its
      source, so the subtraction is no longer needed. DEPTH — the count of
      distinct lineage nodes — is the new final component, and it is what
      guarantees a child always outranks its parent. Consequence for the
      terms-and-weights doctrine: with the signal term retired and capture
      converted to lineage, the term registry is emptied and attention has
      exactly ONE input, the authored per-tier boost. A new attention condition
      must therefore become a tier, a lineage edge, or an authored boost — 'add
      it as a term with a weight' is no longer an available move."
  - question: Is the band derived, or authored and checked?
    answer: "(Author-directed 2026-08-11, third round.) Both, and the second is the
      point. The band is derived as above, but the VALUE chosen inside a band
      also carries an authored namespace stamp, generalizing a mechanism the
      schema already has one axis over: Attention.tier is documented as 'the
      per-tier boost NAMESPACE tag — the tier whose scale the value was chosen
      in', and validateGraph rule 20 requires it to equal the node's own tier,
      precisely so an author must re-select a boost when a node's tier changes,
      since a value meaningful on the tier-1 scale means nothing on the tier-2
      scale. A boost has exactly the same problem across bands: authored under a
      band-3 strategy, it means something different after that strategy is
      reranked to band 9, and today nothing stamps or catches it. Greenfield:
      extend Attention to {boost | override, rationale, scope: {tier,
      strategy}}, where scope.strategy names the distributing strategy in whose
      band the value was chosen, with the rule-20 analogue requiring it to match
      the node's resolved band distributor. Three payoffs: the namespace becomes
      authored and CHECKABLE rather than derived and implicit; the migration
      lint collapses from a global re-derivation diff to a field comparison,
      which is what validateGraph can actually do on the write path; and
      reranking a strategy mechanically surfaces every boost whose meaning it
      just invalidated, instead of silently reinterpreting them. Note the
      interaction to settle when this lands: validateGraph rule 18 (the
      strategy-main-health boost-dominance guard) has a tactic-facing half that
      becomes dead under namespaced rank — the implementing tactic must record
      whether it retires. Amended 2026-08-12: split, and only half is resolved.
      The per-TIER half is adopted and is now structural — a node carries an
      authored boost per tier, and in tier T's ranking every node contributes
      its tier-T boost, which is what makes a node's rank well-defined in a tier
      it does not itself belong to (see strategy-graph-drives-dispatch,
      2026-08-12). The per-BAND scope stamp this entry proposes remains OPEN and
      is not resolved by that round: a boost authored while its node sat in one
      band still means something different after the band-defining parent is
      reranked, and nothing yet stamps or catches that. Recorded explicitly so
      the per-tier adoption is not misread as having closed the per-band
      question. CLOSED 2026-08-12 (author-decided): the per-band scope stamp is
      REJECTED and the question it addresses is DISSOLVED rather than policed.
      An authored boost is drawn from a CLOSED VOCABULARY OF ABSOLUTE LEVELS,
      not chosen as a free magnitude against whatever else currently shares a
      band, so a value means the same thing everywhere and is commensurable
      across bands and tiers by construction. Two findings drove it. First, the
      proposed mechanism is aimed off-target: it keys on the node's resolved
      BAND DISTRIBUTOR, so it fires on distributor-identity change (a
      re-parenting, or a multi-parent node whose max-scoring parent flips) —
      cases that are already explicit authoring acts — and stays SILENT on the
      case that actually goes unnoticed, two previously separate bands
      COLLIDING so nodes calibrated against different neighbour sets suddenly
      compare directly. A pure rerank invalidates nothing: every descendant has
      the reranked node in its lineage, so score and band shift by the same
      amount and within-subtree order is preserved exactly. Second, the live
      graph is already using an informal levels scale — 91 authored values but
      only 17 distinct, with six values (20, 50, 12, 10, 3, 85) covering 88%
      and 20/50 alone covering 64% — so codifying levels formalizes existing
      practice rather than imposing a new discipline. PER-TIER BOOSTS ARE
      RETAINED (author-directed): a node still carries a boost per tier, each
      drawn from the level vocabulary. The per-tier structure exists for
      COVERAGE — making a node's rank well-defined in a tier it does not itself
      belong to — which the absolute scale does not supply and does not
      replace. What the absolute scale removes is the CALIBRATION rationale, and
      with it validateGraph rule 20, whose stated justification is that 'a boost
      value is only meaningful within one tier's scale'; that premise is false
      under a closed level vocabulary, and the rule's single-scalar
      attention.tier shape is obsoleted by the per-tier map independently.
      Migration and the level values are owned by
      tactic-attention-per-tier-boost-migration."
  - question: Which order-changing mechanisms sit outside the rank key, and how do
      they compose with it?
    answer: "(Recorded 2026-08-11, third round.) Two, and the second-round record
      wrongly named tier as the sole one. First, CLASSIFICATION acts: adding a
      recognized bug_fix/security mark lifts tier, and adding a serves edge to a
      higher-ranked strategy lifts band — both are sanctioned model instruments,
      and the ownership doctrine for them lives on
      strategy-recursive-self-improvement. Second, the blocked_by PRECEDENCE
      LIFT, which is already implemented and already recorded doctrine on
      strategy-graph-drives-dispatch: router.ts's effectivePrecedence lifts each
      node to the lexicographic max over its own pair and the precedence of
      every node it blocks, recursively and max-based rather than additive, and
      selectGraphTargets sorts on that LIFTED pair, not on the pair the node
      reports. This matters mechanically, not just descriptively: Precedence is
      a 2-tuple {tier, rank} today, so unless it is extended to the 3-tuple
      (tier, band, residual) with maxPrecedence comparing lexicographically over
      all three, the band never reaches the sort and the whole namespacing
      change is INERT on the selection path. Under the 3-tuple a blocker
      inherits the band of what it blocks, which is the correct reading — the
      blocked work's urgency is exactly what the lift models — and it preserves
      the never-additive, always-max property the 2026-07-13 supersession was
      built on. Amended 2026-08-12: reduced to ONE mechanism. The blocked_by
      PRECEDENCE LIFT described here is deleted, because blocked_by moves inside
      the parent relation — a blocker is a child of what it blocks and therefore
      inherits its tier, its band and its lineage directly, by the ordinary rank
      key. The mechanical concern this entry raises (Precedence must widen to a
      3-tuple or the band never reaches the sort) is resolved by deletion rather
      than by widening: there is no separate Precedence tuple left to keep in
      sync. CLASSIFICATION acts remain outside the key exactly as recorded."
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
attributes:
  fields_defined_for_all_nodes:
    - "id: unique node identifier; also the filename"
    - "kind: names the kind-<kind> node defining this node's semantics"
    - "statement: the intention itself, one sentence"
    - "owner: human | ai | procedure — who is accountable"
    - "status: lifecycle/provenance stage — a non-empty string whose vocabulary
      and meanings each kind node declares in attributes.status_vocabulary;
      validateGraph rule 16 enforces membership"
    - "parent: within-layer edge; null for a root"
    - "serves: cross-layer edge — ids of the nodes this node expresses"
    - "recovers: strategy-only edge — ids of the delegation records this node's
      work unwinds (semantics on kind-strategy)"
    - "rationale: why this node exists"
    - "reading: the current measured value of the success_signal observable;
      sensor-populated"
    - "gap: the shortfall between reading and threshold — mechanically derived
      by deriveGap (greenfield: derived on read and never stored —
      tactic-gap-derive-on-read)"
    - "clarifications: dated Q&A pairs resolved during the dialectic"
    - "tooling_goals: actuator/sensor tooling the node aims to produce"
    - "success_signal: observable, sensor, threshold, is_proxy — the measurable
      sign the intention is met"
    - "attention: authored boost XOR override, plus required rationale; valid
      only on nodes whose kind sets goal_layer: true; resolved rank is derived
      on read and never stored"
    - "phase: tactic-only — persisted dispatch phase the router transitions
      (semantics on kind-tactic)"
    - "execution: tactic-only — dispatch execution state (branch, pr, attempts,
      markers, strategy_fingerprint, fix, completion; semantics on kind-tactic)"
    - "validates: tactic-only edge — the strategies whose signal this tactic
      validates (semantics on kind-tactic)"
    - "blocked_by: tactic-only edge — tactics that must complete first
      (cycle-checked; semantics on kind-tactic)"
    - "office_hours: goal-layer park — reason, since, recommendation; the router
      skips parked subtrees"
    - "pace_exempt: goal-layer — admits one gate-exempt worker past a
      paced-to-zero budget; never changes ordering"
    - "rounds: strategy-only — /align-tactics round accounting (count,
      last_completed, last_aligned; semantics on kind-strategy)"
    - "attributes: kind-specific fields, defined by the kind node — the kind
      nodes own the which-kinds-carry-which-fields statement"
  entry_point: this node is the entry point of the graph
  status_vocabulary:
    codified: the author has personally settled this kind's semantics
    superseded: the intent moved to another node — abandoned, not completed;
      superseded_by names the successor
---
# A kind defines the semantics of a class of nodes

This body is the normative schema detail for every node in the graph, per this
kind node's own body-function rule. It is the single authority: the kind nodes
define field and lifecycle semantics, and no other document does. Code
(`packages/intentionsutil/src/schema.ts`) is the enforcement of what is written
here; where prose and code disagree, the code is the bug report and this body is
what must be reconciled. Kind-scoped fields are named here and defined on the
kind node that owns them — the tactic-only dispatch fields on kind-tactic, the
strategy-only fields on kind-strategy.

## File format

Each node is one markdown file, `intentions/<id>.md`, with a YAML frontmatter
block followed by a markdown body:

```md
---
id: align-root
kind: strategy
statement: Unify intention tracking into one uniform node structure.
owner: human
status: refining
parent: null
serves: []
rationale: Scattered intent across issues, charter, and docs drifts apart.
reading: null
gap: null
clarifications:
  - question: Does a leaf differ in type from a root?
    answer: No — every node is the same type at any altitude. Recorded 2026-07-09.
tooling_goals:
  - kind: actuator
    statement: intentionsutil
success_signal:
  observable: nodes validated by validateNode
  sensor: vitest
  threshold: all committed nodes pass
  is_proxy: false
---

Settled design and mechanism notes for this strategy...
```

**All schema fields live in the frontmatter**, and the frontmatter is the whole
validated model — validation is uniform over this structured data. The body is
NOT parsed into the model and carries no schema fields, but it is not cosmetic
either: each kind declares what its body is for (see the body-function
clarification above), and that content is authoritative for its declared
function.

## Round-trip guarantee

`node → file → node` is lossless on the frontmatter model. `writeNode`
(`packages/intentionsutil/src/store.ts`) validates the input first, so the
written frontmatter is complete and deterministic — every optional field is
serialized with its default applied. `readNode` parses only the frontmatter
between the first two `---` fences and re-validates it, so constructing a node,
writing it, reading it back, and validating yields a deep-equal node.
`attributes` values must be YAML-representable data (strings, numbers, booleans,
arrays, maps) for the guarantee to hold.

The body is outside that guarantee but is never lost: `writeNode` reads any
existing file's body and re-emits it verbatim across frontmatter rewrites, for
every kind. Only a brand-new file with nothing on disk gets the generated
`# <statement>` placeholder body. `assertNoBodyLoss` turns a
body-preservation regression into a thrown error rather than a silent discard —
it refuses a write that would replace a hand-authored body with the regenerated
placeholder. (A body that is still exactly the placeholder carries no authored
content and may be regenerated freely.)

Node ids double as filenames, so `writeNode` and `readNode` reject ids
containing `/` or `\`, and the exact ids `.` and `..`.

## Fields on every node

### Required core

Strictly validated; `validateNode` throws if any is missing or ill-typed.

| Name        | Type         | Meaning |
| ----------- | ------------ | ------- |
| `id`        | `string`     | Unique node identifier; also the filename. Must be non-empty. |
| `kind`      | `string`     | Names the `kind-<kind>` node that defines this node's semantics. Must be non-empty; existence of the kind node is a graph-level rule, not a per-node one. |
| `statement` | `string`     | The intention itself, in one sentence. |
| `owner`     | `Owner` enum | Who is accountable for the intention. |
| `status`    | `string`     | Lifecycle/provenance stage. Must be non-empty; the *set* of legal values is per-kind data, not a central enum — see Status below. |

### Optional common fields

Absent or `null` is tolerated and the listed default applied; when present and
non-null, the shape is validated strictly.

| Name             | Type                      | Default | Meaning |
| ---------------- | ------------------------- | ------- | ------- |
| `parent`         | `string \| null`          | `null`  | Within-layer edge — id of the parent node; `null` for a root. |
| `serves`         | `string[]`                | `[]`    | Cross-layer edge — ids of the nodes this node expresses. |
| `rationale`      | `string \| null`          | `null`  | Why this intention exists. |
| `reading`        | `string \| null`          | `null`  | Current measured value of the `success_signal` observable; `null` until a sensor populates it. |
| `gap`            | `string \| null`          | `null`  | Shortfall between `reading` and `success_signal.threshold`, mechanically derived by `deriveGap`; `null` when the reading meets the threshold or no signal exists. |
| `clarifications` | `Clarification[]`         | `[]`    | Dated Q&A pairs resolved during the dialectic. |
| `tooling_goals`  | `ToolingGoal[]`           | `[]`    | Tooling the node aims to produce or change. |
| `success_signal` | `SuccessSignal \| null`   | `null`  | A measurable signal the intention is met. |
| `attention`      | `Attention \| null`       | `null`  | A user-authored attention injection. Goal-layer kinds only. |
| `office_hours`   | `OfficeHours \| null`     | `null`  | First-class parking record — why the node needs the author and since when. Goal-layer kinds only; the router skips parked subtrees. |
| `pace_exempt`    | `boolean`                 | `false` | Authored pace-gate bypass: admits one gate-exempt worker past a paced-to-zero budget. Never changes ordering. Goal-layer kinds only. |
| `superseded_by`  | `string[]`                | `[]`    | Ids of the nodes that supersede this one — stored on the SUPERSEDED node, reverse derived by scan. Legal on EVERY kind; see Supersession below. |
| `supersession_expiry` | `string \| null`     | `null`  | The event that expires this node's supersession — normally the in-flight PR's own merge or closure. Required by rule 26 when the node is superseded while in flight. |
| `attributes`     | `Record<string, unknown>` | `{}`    | Kind-specific fields. Validated only as a plain object; the meaning of its entries is defined by the node's kind node. |

"Goal-layer kinds" are those whose kind node sets `attributes.goal_layer: true`
— currently kind-strategy and kind-tactic. The eligible layer is data, not a
kind list in code: virtues stay unranked because kind-virtue carries no
`goal_layer` flag, not because code names them.

### Kind-scoped fields

These exist on the common node structure — every node file carries them, and
`validateNode` applies their defaults uniformly — but `validateGraph` restricts
which kinds may set them to a non-default value. They are defined by the kind
node that owns them:

| Name         | Type                | Default | Owning kind node |
| ------------ | ------------------- | ------- | ---------------- |
| `phase`      | `Phase \| null`     | `null`  | kind-tactic |
| `execution`  | `Execution \| null` | `null`  | kind-tactic |
| `validates`  | `string[]`          | `[]`    | kind-tactic |
| `blocked_by` | `string[]`          | `[]`    | kind-tactic |
| `recovers`   | `string[]`          | `[]`    | kind-strategy |
| `rounds`     | `Rounds \| null`    | `null`  | kind-strategy |

## Shared shapes

### `SuccessSignal`

| Name         | Type      | Meaning |
| ------------ | --------- | ------- |
| `observable` | `string`  | What is observed. |
| `sensor`     | `string`  | How it is observed. |
| `threshold`  | `string`  | The value that counts as success. |
| `is_proxy`   | `boolean` | Whether the observable is a proxy for the real goal. |

### `Clarification`

| Name       | Type     | Meaning |
| ---------- | -------- | ------- |
| `question` | `string` | A question raised during the dialectic. |
| `answer`   | `string` | Its resolved answer. Must carry a `YYYY-MM-DD` provenance date somewhere in the text (graph rule 17). |

### `ToolingGoal`

| Name        | Type               | Meaning |
| ----------- | ------------------ | ------- |
| `kind`      | `ToolingKind` enum | What the goal codifies. |
| `statement` | `string`           | The tooling goal, in one sentence. |

### `Attention`

A user-authored injection that seeds the derived rank: a SPARSE per-tier map of
boost values, plus the rationale for claiming them.

| Name        | Type                      | Meaning |
| ----------- | ------------------------- | ------- |
| `boosts`    | `Record<string, number>`  | A RELATIVE claim per tier: `{"<tier>": <boost>}`, where the key is one of the decimal tier strings `"1"`, `"2"`, `"3"` and the value is the boost chosen ON THAT TIER'S SCALE. Each value must be finite and `> 0`. SPARSE: an absent tier key means "makes no claim in that tier" and must stay distinguishable from an authored lowest value — never write a `0` to stand for an unauthored tier. |
| `rationale` | `string`                  | Why this node draws attention now. Must be non-empty. |

An `attention` block must claim at least one tier: a block whose `boosts` map is
empty says nothing, and is rejected. To claim nothing, drop the `attention`
block entirely (`attention: null`) — there is no "zero this branch" spelling.

The pre-tier fields `boost` (with an optional `tier:` namespace tag) and a
positive `override` are still accepted on read as LEGACY compatibility sugar and
canonicalize into `boosts` — `boost: X` ⇒ `{"1": X}` untagged, `{"<tier>": X}`
when tagged; `override: X` ⇒ `{"<tier>": X}`. They are read-only spellings: every
writer emits the `boosts` map, and `tactic-attention-per-tier-boost-migration`
rewrites the remaining node files, after which both are deleted. The old
absolute-cap semantics of `override` are gone (it is now purely a shape
mapping), and the old `override: 0` "zero this branch" spelling is rejected.

### `Execution`

The live in-flight dispatch record; tactics only. See kind-tactic.

| Name                   | Type                            | Meaning |
| ---------------------- | ------------------------------- | ------- |
| `branch`               | `string`                        | The working branch. |
| `pr`                   | `number \| null`                | PR number; a non-negative integer when set. |
| `attempts`             | `Record<string, number>`        | Per-phase attempt counts; each a non-negative integer. |
| `markers`              | `string[]`                      | Phase-completion markers written during the run. |
| `strategy_fingerprint` | see below                       | Soft-freeze stamp of each serving strategy. |
| `fix`                  | `FixState \| null`              | A CI-fix interrupt in flight, orthogonal to `phase`. |
| `completion`           | `Completion \| null`            | Merge-verification evidence recorded at the done-transition. |

`strategy_fingerprint` is a per-strategy map `{<strategy-id>: <stamp>}` of each
serving strategy's substance-fields hash, stamped at plan/re-evaluation time and
later compared by a router's mid-flight soft-freeze trigger. A serving strategy
absent from the map is never stale (per-strategy null semantics). Each map value
is either a bare hash string or a `{hash, sha}` object, where `sha` is the
`origin/main` commit the hash was taken against — letting a stale child recover
the exact delta via `git diff <sha>..origin/main -- intentions/<strategy-id>.md`
instead of only learning *that* it drifted. A bare string as the whole field
(not as a map value) is a DEPRECATED-LEGACY form predating multi-serves
stamping: it is compared against every serving strategy, so a multi-serves
tactic stamped that way was born permanently stale. Legacy strings are accepted
transiently and convert to map form by natural churn; every writer emits map
form now. No hashing logic lives in the schema — only the typed field.

`FixState`:

| Name         | Type             | Meaning |
| ------------ | ---------------- | ------- |
| `since`      | `string`         | Interrupt date, `YYYY-MM-DD`. |
| `attempt`    | `number`         | Fix-attempt counter (non-negative integer); replaces the `attempts["fix"]` convention. |
| `pushed_sha` | `string \| null` | Last SHA the fix lane pushed — the pending-CI guard; `null` before the first push. |

`Completion` records two independent sufficient proofs that a tactic's content
reached `main`:

| Name             | Type             | Meaning |
| ---------------- | ---------------- | ------- |
| `mergedAt`       | `string \| null` | GitHub's PR `merged_at`, a FULL ISO-8601 timestamp (not the `YYYY-MM-DD` shape other date fields use). GitHub REST never reports a PR state of "MERGED", so a non-null value here is the merge signal. |
| `mergeCommitSha` | `string \| null` | GitHub's `merge_commit_sha` — the sha landed on the base branch. |
| `graphCommitSha` | `string \| null` | An out-of-band landing sha, backfilled manually when content reached `main` via commits rather than the recorded PR. Never derived mechanically. |

A real PR merge sets `mergedAt` and `mergeCommitSha` together; an out-of-band
landing sets `graphCommitSha`. All three null means the node was reconciled to
done with no evidence recorded — a later census step flags that case rather than
silently pruning it.

### `OfficeHours`

| Name             | Type                | Meaning |
| ---------------- | ------------------- | ------- |
| `reason`         | `string`            | Why the node is parked. |
| `since`          | `string`            | Park date, `YYYY-MM-DD`. |
| `recommendation` | `string \| null`    | What the parking session recommends the author do. |
| `session_type`   | `SessionType` enum  | What kind of attention the park needs. Defaults to `other` when absent, which keeps the field additive over the existing store. |

### `Rounds`

`/align-tactics` re-evaluation accounting; strategies only. See kind-strategy.

| Name             | Type             | Meaning |
| ---------------- | ---------------- | ------- |
| `count`          | `number`         | Rounds run (non-negative integer). |
| `last_completed` | `string \| null` | Verified-in-prod completion time; advances only when a non-draft child prunes. |
| `last_aligned`   | `string \| null` | `YYYY-MM-DD` the last round *landed* (align-decompose time), stamped independently of completion. |

## Enums

### `Owner`

| Value       | Meaning |
| ----------- | ------- |
| `human`     | A person is accountable for the intention. |
| `ai`        | An AI agent is accountable for the intention. |
| `procedure` | An automated procedure owns the intention. |

### `ToolingKind`

| Value      | Meaning |
| ---------- | ------- |
| `actuator` | Codifies *doing* — an automated procedure or action. |
| `sensor`   | Codifies *knowing* — an observation or measurement. |

### `Phase`

The persisted dispatch phase a tactic sits in: `draft`, `align-tactics`,
`implement`, `qa`, `review`, `main-qa`, `done`. `fix` is deliberately NOT a
member — the CI-fix interrupt lives entirely in the orthogonal `execution.fix`
field, set and cleared off the live CI verdict independent of `phase`. See
kind-tactic.

### `SessionType`

| Value                    | Meaning |
| ------------------------ | ------- |
| `requirement-discovery`  | The park needs the author to decide or clarify a requirement before work can proceed. |
| `curriculum-review`      | The park is a reading/dialog demonstration sitting the author runs with the text in hand. |
| `other`                  | The default for every park with no natural type, including machine-authored parks such as a retry-budget park. |

The two typed values are soft-penalized in office-hours ranking, so classifying
a park lowers its default rank versus `other`.

### `Status`

There is no central status enum. `status` is validated per node only as a
non-empty string; the legal *set* is declared per kind, as the keys of that kind
node's `attributes.status_vocabulary` map, whose values are the meaning of each
value for that kind. Graph rule 16 enforces that every node's `status` is a key
of its kind node's vocabulary, and that the kind node declares a non-empty
vocabulary at all. Membership cannot be checked per node because `validateNode`
has no graph context.

This is the same self-describing move as `kind` itself: the vocabularies are
data (the committed kind nodes), so a kind may carry lifecycle values that mean
nothing to another kind — kind-tactic's `codified` means the execution plan is
settled and the tactic is ready to dispatch, kind-strategy's means the author
has settled the strategy against present conditions. The historical central list
was `raw | refining | delegated | codified`; kinds that still want those values
declare them.

## Supersession

A node is **superseded** when its intent moved to another node — abandoned, not
completed. Every kind vocabulary declares `superseded`, and `superseded_by`
names the successor.

**The terminal is carried on `status`, never on `phase`.** Three reasons, all
of which a future implementer should read before proposing a `superseded` phase:

1. `phase: done` is the COMPLETION terminal, and closing abandoned work that way
   launders it as finished. The harm is the word `done`, not a deletion —
   marking a node superseded deletes nothing, so the node stays present and
   every inbound prose citation keeps resolving. (Pruning is a separate,
   deliberate act; see rule 24 for the edge repair a prune owes.)
2. A `superseded` PHASE would not survive rule 10 or the ladder's phase
   vocabulary, and it would still deadlock dependents. NOTE — carrying the
   terminal on `status` does NOT by itself avoid that deadlock, and an earlier
   revision of this bullet wrongly claimed it did: `blockersComplete`
   (`packages/intentionsutil/src/router.ts`) counts a blocker complete only when
   it is absent or at `phase: done`, and a superseded node keeps whatever phase
   it reached (below), so a superseded blocker blocks every dependent forever
   and `classifyTerminus` (`terminus.ts`) drains them as `excused-blocked`. The
   fix is the reader half, not the axis: whatever consults `isSuperseded` in
   selection must also treat a superseded blocker as no longer blocking. Until
   that lands, do not supersede a node any live node names in `blocked_by`.
3. A phase cannot mark a superseded STRATEGY. Rule 10 confines `phase` to
   `kind: tactic`, and the originating requirement is that the graph must not
   implement one strategy-or-tactic and later attempt the one it supersedes. A
   status covers the whole requirement, because status vocabulary is already
   per-kind data and already validated by rule 16. Adding the terminal therefore
   needs no new validation code and no type widening — only vocabulary entries
   on the six kind nodes.

**The edge direction is fixed.** `superseded_by` is stored on the SUPERSEDED
node and names the nodes that supersede it. The reverse direction is derived by
scanning, exactly the way inbound `blocked_by` edges are found today. There is
no maintained reverse index and none is to be built.

**A superseded node keeps whatever `phase` it reached.** Nothing pins it, because
partial supersession — what `superseded_by` means when the successor obsoletes
only part of the node — is unruled, and pinning the phase would pre-empt that
question. Readers that mean "is this node still live work" must consult `status`
as well as `phase`; readers that specifically mean "reached the completed
terminal" keep the literal `phase === "done"` test.

**In-flight supersession does not park.** A node with a non-null `execution`
still takes the supersession edge and still gets no park — a similarity judgment
must never halt live work. The price of that exception is `supersession_expiry`:
rule 26 requires the edge to name the event that ends the interim live risk,
normally the in-flight PR's own merge or closure. The expiry is per-node rather
than per-edge, because what is being bounded is that THIS node is in flight.

Rules 24, 25 and 26 enforce all of the above; see Graph-level validation.

**No reader consults the terminal yet.** Landed 2026-08-31: the schema half is
enforced (rules 24-26, the per-kind vocabulary, and the shared `isSuperseded` /
`isRetired` predicates), but every liveness reader still judges on `phase`
alone — the selector, `blockersComplete`/`classifyTerminus`, and the
goals/census/attention passes. So a node marked superseded today keeps being
selected for dispatch, a merged one classifies as a terminus `violation` rather
than a terminal, and — the one case that is worse than a no-op — a superseded
node still blocks every node naming it in `blocked_by`, forever. Units 2 and 3
of `tactic-supersession-edge-and-terminal` wire them; until those land, marking
a node superseded records the intent but stops nothing.

## Required vs. optional

The required core — `id`, `kind`, `statement`, `owner`, `status` — is always
present and strictly validated. Every other field tolerates being absent or
`null` and defaults on read. This split is load-bearing: a node may legitimately
exist before its optional fields are filled in. A freshly authored tactic
carries empty dialectic fields (`clarifications`, `tooling_goals`,
`success_signal`, `serves`) until the dialectic populates them; `reading` and
`gap` are sensor-populated afterwards (`reading` measured by the sensor, `gap`
mechanically derived from it); the dispatch fields stay at their defaults until
a router stamps them. `validateNode` must therefore accept nodes without any of
these rather than rejecting them as invalid.

The defaults applied on read are: `parent: null`, `serves: []`, `recovers: []`,
`rationale: null`, `reading: null`, `gap: null`, `clarifications: []`,
`tooling_goals: []`, `success_signal: null`, `attention: null`, `phase: null`,
`execution: null`, `validates: []`, `blocked_by: []`, `superseded_by: []`,
`supersession_expiry: null`, `office_hours: null`, `pace_exempt: false`,
`rounds: null`, `attributes: {}`.

## Graph-level validation

`validateGraph(nodes)` checks referential integrity across a whole node set —
the edges BETWEEN nodes, not per-node shape. It collects every violation and
throws one error listing all of them, so a single run surfaces the whole
problem set rather than the first entry. It enforces:

 1. Every node's `kind` has its defining `kind-<kind>` node present. This is
    what makes the graph self-describing: the set of valid kinds is the set of
    committed kind nodes, not an enum in code.
 2. Every non-null `parent` resolves to an existing node id.
 3. Every `serves` entry resolves to an existing node id.
 4. Every `recovers` entry resolves to an existing node id.
 5. `attention` appears only on nodes whose kind node sets
    `attributes.goal_layer: true`.
 6. A non-null `parent` resolves to a node of the SAME `kind` — virtue→virtue,
    strategy→strategy, tactic→tactic, uniform across every kind.
 7. Every `serves` entry on a `kind: tactic` node resolves to a
    `kind: strategy` node.
 8. Every `serves` entry on a `kind: strategy` node resolves to a
    `kind: virtue` node.
 9. A non-empty `recovers` appears only on `kind: strategy` nodes, and every
    entry resolves to a `kind: delegation` node.
10. `phase`, `execution`, a non-empty `blocked_by`, and a non-empty `validates`
    appear only on `kind: tactic` nodes.
11. `office_hours` and a true `pace_exempt` appear only on goal-layer kinds —
    the same `attributes.goal_layer` gate as rule 5.
12. `rounds` appears only on `kind: strategy` nodes.
13. Every `blocked_by` entry resolves to an existing `kind: tactic` node.
14. Every `validates` entry resolves to an existing `kind: strategy` node.
15. `blocked_by` edges contain no cycle — a tactic transitively blocked by
    itself is invalid. Dangling edges are reported by rule 13, not traversed.
16. Every node's `status` is a key in its kind node's declared
    `attributes.status_vocabulary`; a missing or empty declaration on the kind
    node is itself an error.
17. Every `clarifications[].answer` carries a dated provenance clause — a
    `YYYY-MM-DD` substring placed anywhere in the string, placement-agnostic and
    uniform across every kind. This is the convention the router's reading-date
    helper and the coverage report's last-reviewed lookup parse to date a
    clarification; a dateless answer silently breaks those consumers.
18. `strategy-main-health` holds a dominant attention: no OTHER node's
    `attention.boost` or `attention.override` may match or exceed
    `strategy-main-health`'s own live `attention.boost`, which keeps red-main
    fix work outranking everything else. The threshold is read live from the
    graph, never hardcoded; if `strategy-main-health` is absent or its
    `attention`/`attention.boost` is null there is no dominance to protect and
    the guard is inert. A node opts out by placing the literal substring
    `ACK: main-health-dominance` in its `attention.rationale`.
19. Tier marks are well-shaped: `attributes.bug_fix` and `attributes.security`,
    when present, are booleans; `attributes.tier`, when present, is the number 2
    or 3. An explicit `attributes.tier: 1` is rejected — 1 is the implicit
    default every unmarked node already carries, so authoring it would give one
    state two spellings.
20. Per-tier boost namespace: a node with non-null `attention` sets
    `attention.tier` equal to its OWN tier — its own marks, not the effective
    tier it inherits down `parent`/`serves`. A boost value is only meaningful
    within one tier's scale, so a node whose tier changes must have its value
    re-selected in the new tier's namespace. The check deliberately uses the own
    tier: an effective-tier check would cascade, invalidating every boosted
    descendant the moment any ancestor gained a mark.
21. `attributes.measured_impact`, when present, is an array of summary
    measurement records `{metric, value, unit, window, sensor, measured}` —
    `metric`/`unit`/`window`/`sensor` non-empty strings, `value` a finite
    number, `measured` a `YYYY-MM-DD` date. `attributes` is otherwise free-form,
    so without this rule a malformed measurement would reach every consumer
    unchallenged; the key is cited evidence for attention and classification
    writes, so it earns a shape rule as tier marks do. The rule checks shape
    only and never reads a value — a measurement is queryable input to a ranking
    act, never an ordering authority of its own. `kind-tactic` carries the
    field's normative detail.
24. Every `superseded_by` entry resolves to an existing node of the SAME `kind`
    as the superseded node. Same-kind is modelled on rule 6: a tactic superseded
    by a strategy is not a supersession, it is a re-parenting. Unlike rules 10
    and 13–14 this rule is NOT kind-confined — `superseded_by` is legal on every
    kind, which is the half of the requirement a tactic-only `phase` terminal
    could not express. A dangling supersession target is a hard fail, and what
    keeps it from firing is the PRUNER, not this rule: completion pruning
    (`graph-commit --prune`) really does delete node files, so a prune must
    strip the pruned id from every inbound `superseded_by` in the SAME commit —
    exactly the repair rule 13 already requires for `blocked_by`. The
    reverse-edge scans that make that possible are `inboundSuperseders` and
    `inboundBlockers` (`packages/intentionsutil/src/transitions.ts`); neither
    has a caller in the prune path today, so the repair is the pruning agent's
    obligation.
25. `superseded_by` edges contain no cycle — a node cannot transitively
    supersede itself, and a node naming its own id is the length-1 case. Shares
    one DFS implementation with rule 15. Dangling edges are reported by rule 24,
    not traversed.
26. A node superseded WHILE IN FLIGHT names its expiry event: when
    `superseded_by` is non-empty and the node is in flight — `execution`
    non-null AND `phase` not yet `done` — `supersession_expiry`
    must be a non-empty string. Both halves are needed because the execution
    record is never cleared on completion, so `execution` alone means "was ever
    dispatched": a completed node could otherwise never take a supersession
    edge, and an expiry whose event has already fired could never be cleared.
    Supersession never parks live work — an in-flight
    node takes the edge and keeps running — and that interim-live-risk exception
    is only permitted when an expiry is named, normally the in-flight PR's own
    merge or closure. The expiry is per-NODE, not per-edge: what is bounded is
    that THIS node is in flight, a property of its own `execution`. Inert when
    the node is not superseded, and when a superseded node is not in flight.

Rule numbering has two gaps this list does not close, both pre-existing:
rule 20 above describes the per-tier boost namespace check, which code RETIRED
(numbers are cross-referenced from node bodies and never reused, so 20 stays
burned rather than being reassigned); and rules 22 (WAIT-node shape) and 23
(no `attributes` key shadows a first-class field name) are enforced in
`schema.ts` but not yet transcribed here.

Rules 6–9 judge only edges whose target already resolves — rules 2–4 report the
dangling case — so a single broken edge is not double-reported. Rules 13–14 own
their own dangling case, since no existence rule covers those edges. `serves` on
delegation and kind nodes is deliberately unenforced: a delegation serves
whatever depends on it, which is intentionally loose.

## Prose reference integrity

`validateGraphProseRefs` is a separate check, kept apart so `validateGraph`
stays a pure function of the node list alone. It scans a node's PROSE — its
`statement`, `rationale`, `attention.rationale`, every `clarifications[].answer`,
and its markdown body — for backtick-quoted, id-shaped references, and requires
each to resolve to a live node, to a node the graph history shows was pruned, or
to planned-but-uncommitted work (some OTHER open tactic's statement or body
mentions the id). A grandfathering baseline covers pre-existing dangling prose
references so the check does not retroactively break `main`; it should not grow.
The practical consequence for authors: do not backtick a node id you have not
confirmed exists.

## Derived values are never stored

`intentions/` stores authored intent, never derived global state. A value that
is a function of the whole graph is recomputed on read and never enters
frontmatter, because any edit elsewhere in the graph would make a stored copy
stale without touching the file that holds it.

The canonical case is attention. The `attention` field is a user-authored
*injection* — only the `boost` or `override` and its rationale the author
writes. The resolved rank `resolveAttention` computes from it is derived on read
and NEVER stored. `resolveAttention` accumulates, per node, a set of
`(source-node, amount)` pairs flowing DOWN `parent` and `serves` edges —
undecayed and undiluted, each authored source counted once per node — and a
node's rank is the sum of its own set: a `boost` adds `(self, boost)`, an
`override` replaces the set with `{(self, override)}` and caps its branch.
Because a node's rank depends on every ancestor's injections and edges, storing
it would go stale on any edit anywhere.

`gap` is the contrasting case, and shows where the line falls: `deriveGap`
computes it from same-file inputs (`reading` against
`success_signal.threshold`), so it is a local function of one node's own fields
and is safe to store.
