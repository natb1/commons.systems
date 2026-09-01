---
id: kind-strategy
kind: kind
statement: Strategy — the highest goals a virtue generates against present conditions
owner: human
status: codified
parent: null
rationale: >-
  A strategy is the first goal layer: what a virtue produces when pointed at the
  actual situation. The `serves` edge from a strategy to its virtues is the
  graph's one phase change — disposition becomes state. `parent` links
  strategies into sub-strategies where useful — structural nesting, not roll-up.


  A strategy is persistent. It remains in the graph even when no tactic
  currently serves it; dormancy is normal, not a defect. A strategy never
  completes. It leaves the graph only two ways: a condition in
  `attributes.conditions` fails (then re-derive it from its virtues), or the
  human deliberately retires it.


  A strategy is conditional where a virtue is not. `attributes.conditions` names
  the premises about the world that make the strategy apt; when a condition
  fails, re-derive the strategy from its virtues rather than defending it. This
  is what distinguishes a strategy that expired from a virtue that eroded.
  Example: agentic construction is a strategy with conditions, not a virtue —
  pivotal only while it remains the highest-impact path to recovering software
  autonomy and while its recovery substrate (open-weight models, local
  inference) stays viable.


  `success_signal` on a strategy names the observable that would show the
  strategy working; `reading` is sensor-populated against it, and `gap` is
  derived on read from `reading` vs `success_signal.threshold` via
  `deriveGap` (`packages/intentionsutil/src/sensors.ts`) — never stored.
  `deriveGap` has exactly four outcomes. A null `success_signal` derives
  null: with no threshold there is nothing to fall short of, so at this
  level no signal reads the same as met. A signal with a null `reading`
  derives "no reading yet (threshold: ...)" — an unread signal is a known
  shortfall, not a neutral state. A `reading` equal to the threshold after
  trimming and lowercasing derives null, met; that exact string match is the
  only met condition, and there is no numeric or approximate comparison. Any
  other reading derives "reading ... does not meet threshold ...", naming
  both untrimmed values. That is the mechanical rule and nothing more:
  whether a reading really satisfies the intent is the assessor's judgment,
  not `deriveGap`'s. Do not hand-author a `gap:` key in a node's
  frontmatter — it is a silent no-op. `validateNode`
  (`packages/intentionsutil/src/schema.ts`) builds each node by whitelisting
  the known fields into an explicit returned object, so an unrecognized
  `gap:` key is dropped at parse time: never validated, never surfaced,
  never read, and gone from the file on the next `write-node` rewrite. A
  stored `gap:` value cannot influence anything — the residual `gap: null`
  keys still sitting in node files, including this one, are inert and
  disappear the same way. To change what a reader sees, change `reading`
  (sensor-populated) or `success_signal.threshold`.


  `recovers` is the strategy→delegation edge: the ids of the delegation records
  this strategy's work unwinds, resolved by `validateGraph` like any other edge.
  A DOMAIN STRATEGY is a strategy that recovers one domain of delegated life
  (attention, finance, publishing); it names its artifacts — the apps that do
  the recovering — in prose in `rationale`. Apps are not nodes: the strategy is
  the intention, the app is its current materialization, and naming it in prose
  keeps the graph stable while the artifacts iterate.
reading: null
gap: null
serves: []
recovers: []
clarifications:
  - question: Does a sub-strategy re-declare its parent's serves?
    answer: No — sub-strategies inherit. The parent edge already carries the
      parent's claims down (resolveAttention flows rank down parent and serves
      alike), so a child re-declaring the parent's exact virtue set adds no rank
      information while doubling the review surface — and a serves edge is a
      ranking act deserving weight-level care. A child authors serves only for a
      virtue claim beyond its parent's. The seven duplicate sets existing at
      2026-07-09 are stripped by tactic-graph-self-consistency-sweep Unit 4.
      Recorded 2026-07-09 interview.
  - question: What does a strategy node's markdown body carry?
    answer: Settled design and mechanism notes — the fold-target when clarification
      chains outgrow the dialectic record (superseded entries fold; settled
      mechanism moves here or down to tactics/package docs), per kind-kind's
      body-function rule. Recorded 2026-07-09 interview.
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
  goal_layer: true
  fields:
    - "conditions: list of world-premises that make this strategy apt; each is a
      standing review trigger"
    - "attention: valid on this kind (goal_layer: true) — a TOP-LEVEL field, not
      an attributes entry; canonical definition on kind-kind's field list"
    - "traditions: ids of tradition records (kind-tradition) that inform this
      strategy — set only where a philosophical choice is load-bearing for the
      strategy, not as decoration; the alignment detail lives on the tradition
      record"
    - "standing_criteria: the non-functional criteria in force for EVERY
      strategy — each {id, statement, class, authority, recorded}, class always
      non-functional; this kind node is their one home, and every strategy's
      effective set is derived on read (effectiveCriteria) rather than copied
      onto it; shape enforced by validateGraph rule 28"
  standing_criteria:
    - id: nf-security
      statement: No change introduces a security defect — every branch runs the
        standing security review, and each finding is fixed or explicitly
        dispositioned rather than suppressed
      class: non-functional
      authority: deferred
      recorded: 2026-09-01
    - id: nf-type-safety
      statement: No net-new type-safety escape hatch — @ts-ignore,
        @ts-expect-error, eslint-disable, any in type position, an as cast, a
        non-null assertion — rides on an added line without a same-line
        type-safety-ok marker carrying a real reason
      class: non-functional
      authority: deferred
      recorded: 2026-09-01
    - id: nf-test-integrity
      statement: A failing test is fixed in the code or escalated to
        office-hours — never removed, skipped, commented out, or otherwise
        weakened to make CI green
      class: non-functional
      authority: deferred
      recorded: 2026-09-01
    - id: nf-style
      statement: Code exits with a clear descriptive error rather than a
        defensive fallback, and prose uses simple direct language in place of
        corporate jargon
      class: non-functional
      authority: deferred
      recorded: 2026-09-01
    - id: nf-token-economy
      statement: The prepaid token allowance converts into tactic closure —
        spent on closing work rather than on re-measuring what was already
        measured, re-reading what was already read, or review rounds that add
        no signal
      class: non-functional
      authority: deferred
      recorded: 2026-09-01
  edges:
    - "recovers: ids of the delegation records this strategy's work unwinds
      (top-level field, resolved by validateGraph)"
  field_write_class:
    recovers: intent
    rounds: orchestration
    attention: intent
    attributes.conditions: intent
    attributes.traditions: intent
    attributes.standing_criteria: intent
  status_vocabulary:
    raw: not yet dialectically examined
    refining: under active dialectic
    codified: the author has personally settled this strategy against present conditions
    superseded: the intent moved to another node — abandoned, not completed;
      superseded_by names the successor
---
# Strategy — the highest goals a virtue generates against present conditions

A strategy node's body carries settled design and mechanism notes. This section
is the normative detail for the two fields only strategy nodes may carry. The
all-nodes field list, the shared shapes, and the full graph rule set live on
kind-kind, which is the schema authority; nothing here restates it.

Every node file carries both fields and `validateNode` defaults them uniformly
(`recovers: []`, `rounds: null`). What makes them strategy-scoped is
`validateGraph`: rule 9 rejects a non-empty `recovers` on any node whose `kind`
is not `strategy`, and rule 12 rejects a non-null `rounds` the same way.

## `recovers`

Ids of the delegation records this strategy's work unwinds — the
strategy→delegation edge described in this node's rationale. Rule 4 requires
every entry to resolve to an existing node, and rule 9 additionally requires
each resolved target to be a `kind: delegation` node. The two split cleanly: an
id naming nothing is rule 4's report, an id naming a node of the wrong kind is
rule 9's, so one broken entry is never reported twice.

The edge is what keeps recovery real rather than aspirational: a delegation
record is the surface where an attachment is detected, and a strategy that
claims to recover it says so structurally instead of in prose.

## `rounds`

`/align-tactics` re-evaluation accounting for this strategy — how many
decomposition rounds have run against it and when.

| Name             | Type             | Meaning |
| ---------------- | ---------------- | ------- |
| `count`          | `number`         | Rounds run; a non-negative integer. |
| `last_completed` | `string \| null` | Verified-in-prod completion time. Advances only when a non-draft child prunes — so it tracks work actually landing, not rounds being run. |
| `last_aligned`   | `string \| null` | The `YYYY-MM-DD` date the last round *landed* (align-decompose time), stamped independently of completion. |

The two dates are deliberately independent. A round that decomposes a strategy
into fresh tactics advances `last_aligned` immediately; `last_completed` stays
put until one of those tactics actually completes and prunes. A strategy with a
recent `last_aligned` and a stale `last_completed` is one that keeps being
planned but not delivered — a signal only the split makes visible.

`last_aligned` is shape-validated as a `YYYY-MM-DD` date string when non-null;
`last_completed` is validated as a plain nullable string, so it can hold a
fuller timestamp.

## Supersession

A strategy is retired by `status: superseded` with `superseded_by` naming the
successor, never by any phase — `phase` is tactic-only (rule 10), and a strategy
being retirable at all is the half of the requirement that decided the terminal
onto `status`. The field is cross-kind, so its normative detail lives on
kind-kind under Supersession and is not restated here.
