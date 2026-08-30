---
id: tactic-mount-schema
kind: tactic
statement: Mount data structure — anchors on delegation/tradition records,
  mounted-node residence, the distinct graft relation, derived degree,
  recursion, by-reference readiness, validate rules
owner: ai
status: codified
parent: null
rationale: "Finalized 2026-07-11 by /align-tactics round 1 (consumes the
  retained draft of the same id): the schema decisions fixed in the 2026-07-07
  interview — records anchor mounts, distinct graft relation, both degree
  measures, recursion, by-reference-ready shape — become fields, kind
  attributes, and validate-graph rules. Foundational leaf: every other tactic in
  the round builds on these fields. Signal-path instrument: the sensor includes
  validate-graph rules over mount structure."
reading: null
gap: null
serves:
  - strategy-graph-mounts
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: implement
execution:
  branch: tactic-mount-schema
  pr: 2856
  attempts: {}
  markers: []
  strategy_fingerprint: 04aa02adec88a3145460aa90242ca47578f633087667aba014c921593e28d1b3
  fix: null
  completion: null
validates:
  - strategy-graph-mounts
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Mount data structure — anchors on delegation/tradition records, mounted-node residence, the distinct graft relation, derived degree, recursion, by-reference readiness, validate rules

## Context

strategy-graph-mounts makes mounting first-class: external graphs
(delegatees, traditions, institutions, persons) graft onto this graph as
explorable structure. Today the graft content is write-only prose —
`divergence.imported` and `adopted/diverged` are string lists — so nothing
can traverse from strategy-financial-sustainability to the commercial growth
virtue it partly holds, and no sensor can read drift in an imported virtue
that has no node. This tactic lands the data structure and validation.
Siblings land the derived-degree sensor (tactic-mount-derived-degree), the
content migration (tactic-mount-delegation-migration,
tactic-mount-tradition-migration), and the rendering
(tactic-goals-page-mount-views).

Decisions already fixed by the strategy's clarifications — realize them, do
not relitigate: records anchor mounts; mounted content is the author's model
(by-model now, by-reference-ready shape); the graft relation is distinct from
`serves`, which stays native-only; degree of capture is carried twice
(hand-assessed on the record, derived from structure); mounts recurse;
nothing may assume same-repo residence.

Greenfield shape this plan fixes (the implementing session refines detail
within it, not the shape itself):

- **`mount: string | null`** — new first-class `IntentionNode` field naming
  the anchoring record node (`kind: delegation` / `kind: tradition` today;
  person/institution records join the same family later). A node with
  `mount` set is a *mounted node* — the author's model of a counterparty
  intention. Mounted nodes use their **native kinds** (a mounted virtue is
  `kind: virtue`) so existing kind semantics carry over.
- **`kind: duty`** — new kind (new `intentions/kind-duty.md` node) for
  obligation-shaped mounted content (social mounts: family, client/employer).
  Schema readiness only — no duty content lands this round.
- **`grafts: string[]`** — new first-class field: ids of mounted nodes whose
  motivation this node partly carries across the mount boundary (canonical:
  strategy-financial-sustainability grafts the mounted vendor-growth virtue).
  "What do I hold because of a graft" is queryable by relation type; it is
  never expressed as `serves`.
- **Anchor eligibility is declared by the kind node**: `kind-delegation.md`
  and `kind-tradition.md` set `attributes.mount_anchor: true` — the same
  kind-attribute gate mechanism `goal_layer` uses in validateGraph rule 11.
- **Recursion**: an anchor record may itself carry `mount` (a vendor's record
  modeled inside another mount) — allowed by construction, no extra rule.
- **By-reference readiness**: `mount` stays a node id resolved within the
  loaded node set; a by-reference mount later loads an external store into
  the same set. Documented in SCHEMA.md, not implemented here.
- **Id naming convention** (documented, not validated): mounted node ids read
  `<kind>-<counterparty>-<slug>`, e.g. `virtue-attention-services-growth`.
- **No attention flow across the boundary**: `resolveAttention` and
  `activeFrontier` exclude mounted nodes, and `grafts` edges are deliberately
  not traversed by the attention flow. Mount structure is audit structure,
  not attention routing — consistent with serves staying native-only.

## Unit 1 — schema fields and node validation

**Recommended model:** opus

Scope:
- `packages/intentionsutil/src/schema.ts`: add `mount: string | null` and
  `grafts: string[]` to `IntentionNode` (interface at
  packages/intentionsutil/src/schema.ts:102-134, near the dispatch-state
  fields) and `IntentionNodeInput` (:137-167); defaults and validation in
  `validateNode` (~:470-500) — `mount` nullable string, `grafts` via the same
  id-array validation `validates`/`blocked_by` use.
- Round-trip: `packages/intentionsutil/src/store.ts` `writeNode`/`readNode`
  pick the fields up from the validated node — verify, no format change
  expected.
- Tests: `packages/intentionsutil/test/schema.test.ts` (defaults, invalid
  shapes rejected), `packages/intentionsutil/test/store.test.ts` (round-trip
  preserves `mount`/`grafts`).

Out of scope: graph-level rules (Unit 2), attention exclusion and docs
(Unit 3).

## Unit 2 — validateGraph mount rules and kind nodes

**Recommended model:** opus

Dependencies: Unit 1.

Scope:
- `packages/intentionsutil/src/schema.ts` `validateGraph` (rule doc block
  ~:505-560, implementation ~:600-700), new rules continuing the numbering
  from 15:
  - **16**: every non-null `mount` resolves to an existing node whose kind
    node sets `attributes.mount_anchor` (pattern: the rule-11 `goal_layer`
    kind-attribute gate).
  - **17**: every `grafts` entry resolves to an existing node with `mount`
    set — a graft edge always lands on a mounted node.
  - **18**: `serves` and non-null `parent` never cross a mount boundary: an
    un-mounted node's targets are un-mounted; a mounted node's targets carry
    the same `mount` anchor (the modeled graph's internal structure). Rules
    6-8 still apply inside a mount.
- `intentions/kind-duty.md` — new kind node defining obligation-shaped
  mounted content; mirror `intentions/kind-virtue.md`'s shape; no
  `goal_layer`, no `mount_anchor`. Drafted here, ratified at
  tactic-mount-owner-review.
- `intentions/kind-delegation.md` and `intentions/kind-tradition.md` — set
  `attributes.mount_anchor: true` and add a short body section: records
  anchor mounts; the prose lists (`divergence.imported`,
  `adopted/diverged/chosen_over`) migrate into mounted structure over time.
  Frontmatter edits go through
  `packages/intentionsutil/scripts/write-node.ts` (never hand-edit YAML);
  body edits are normal file edits.
- Tests: graph-rule cases in `packages/intentionsutil/test/schema.test.ts`
  or `test/graph.test.ts` — unresolved `mount` rejected, `mount` on a
  non-anchor kind rejected, graft to an un-mounted node rejected, `serves`
  across the boundary rejected, same-mount internal structure and nested
  anchors (recursion) accepted.

## Unit 3 — attention/frontier exclusion and docs

**Recommended model:** sonnet

Dependencies: Unit 1.

Scope:
- `packages/intentionsutil/src/goals.ts` `activeFrontier`
  (packages/intentionsutil/src/goals.ts:49-55): mounted nodes are never on
  the frontier.
- `packages/intentionsutil/src/attention.ts` `resolveAttention`
  (packages/intentionsutil/src/attention.ts:285 onward): mounted nodes
  excluded from eligibility and flow; `grafts` deliberately not traversed —
  leave a comment stating the audit-not-routing rationale.
- `packages/intentionsutil/SCHEMA.md`: new "## Mounts" section — `mount`,
  `grafts`, the `mount_anchor` kind attribute, recursion, by-reference
  readiness, the id naming convention, the `duty` kind, attention exclusion.
- Tests: exclusion cases in `packages/intentionsutil/test/goals.test.ts` and
  `test/attention.test.ts`.

## Reuse

- Id-array and nullable-string guards already in
  `packages/intentionsutil/src/schema.ts` (the `validates`/`blocked_by`
  validation path).
- The rule-11 `goal_layer` kind-attribute gate implementation as the
  `mount_anchor` pattern.
- `packages/intentionsutil/src/store.ts` round-trip machinery untouched.

## Verification

```verify
npm test --prefix packages/intentionsutil || exit 1
npx tsx packages/intentionsutil/scripts/validate-graph.ts
```

Manual: none — rendering and mounted content land in the sibling tactics.

## Implementation notes

Three units, one PR; each unit in a subagent with its Recommended model;
supply this Context and the unit's Scope; constrain each subagent to
working-tree edits only.

## Re-scope (dispatch tick +6, 2026-07-11)

Demoted qa→implement and blocked on `tactic-nontactic-body-durability`. Unit 2 authored durable "body
sections" onto `kind: kind` mount-anchor nodes (kind-delegation / kind-tradition /
kind-duty), but `store.ts` `writeNode` regenerates non-tactic bodies from
`statement`, so those sections are not durable under the current store. Re-implement
the mount-anchor-content approach against whichever body-durability contract the
decision tactic settles (durable bodies → keep as-is once the store ships; cosmetic
bodies → move the sections to frontmatter or another body-safe home). PR #2856
branch is resume input; markers cleared.
