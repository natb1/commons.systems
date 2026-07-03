# Intention node schema

An intention graph is a single uniform node structure. Every node is the same
type at any altitude: a virtue at a root, a strategy below it, a tactic at a
leaf, a delegation record, or a kind node describing one of those classes —
the same schema describes all of them, linked by `parent` and `serves`.

The graph is self-describing. A node's `kind` names the kind node
(`kind-<kind>`) that defines its semantics: its edge rules, how progress works
for it, and the meaning of its `attributes` entries. The set of valid kinds is
therefore data (the committed kind nodes), not an enum in this schema —
`validateNode` checks only that `kind` is a non-empty string, and
`validateGraph` enforces that every referenced kind node exists. Start reading
the graph at `intentions/kind-kind.md`.

## File format

Each node is one markdown file with a YAML frontmatter block:

```md
---
id: align-root
kind: strategy
parent: null
serves: []
statement: Unify intention tracking into one uniform node structure.
owner: human
status: refining
rationale: Scattered intent across issues, charter, and docs drifts apart.
reading: null
clarifications:
  - question: Does a leaf differ in type from a root?
    answer: No — every node is the same type at any altitude.
tooling_goals:
  - kind: actuator
    statement: intentionsutil
success_signal:
  observable: nodes validated by validateNode
  sensor: vitest
  threshold: all backfilled nodes pass
  is_proxy: false
gap: null
---

Unify intention tracking into one uniform node structure.
```

**All schema fields live in the frontmatter.** The frontmatter is the single
authoritative model; validation is uniform over this structured data. The
markdown body below the frontmatter is a cosmetic render of `statement` for
human reading — it is NOT parsed back into the model and carries no
authoritative data.

## Fields

| Name             | Type                  | Required | Meaning |
| ---------------- | --------------------- | -------- | ------- |
| `id`             | `string`              | yes      | Unique node identifier. |
| `kind`           | `string`              | yes      | Names the `kind-<kind>` node that defines this node's semantics. Validated as a non-empty string per node; existence of the kind node is enforced by `validateGraph`. |
| `statement`      | `string`              | yes      | The intention itself, in one sentence. The markdown body renders this. |
| `owner`          | `Owner` enum          | yes      | Who is accountable for the intention. |
| `status`         | `Status` enum         | yes      | Lifecycle stage of the node. |
| `parent`         | `string \| null`      | no       | `id` of the parent node; `null` for a root. Defaults to `null`. |
| `serves`         | `string[]`            | no       | `id`s of the nodes this node expresses — e.g. a strategy serves one or more virtues. Defaults to `[]`. |
| `recovers`       | `string[]`            | no       | `id`s of delegation records this node's work unwinds — meaningful on strategies. Defaults to `[]`. |
| `rationale`      | `string \| null`      | no       | Why this intention exists. Defaults to `null`. |
| `reading`        | `string \| null`      | no       | The current measured value of the `success_signal` observable; `null` until a sensor populates it. Defaults to `null`. |
| `gap`            | `string \| null`      | no       | The shortfall between `reading` and `success_signal.threshold`, mechanically derived by `deriveGap`; `null` when the reading meets the threshold or no signal exists. Defaults to `null`. |
| `clarifications` | `Clarification[]`     | no       | Q&A pairs resolved during the dialectic. Defaults to `[]`. |
| `tooling_goals`  | `ToolingGoal[]`       | no       | Tooling the node aims to produce or change. Defaults to `[]`. |
| `success_signal` | `SuccessSignal \| null` | no     | A measurable signal the intention is met. Defaults to `null`. |
| `attention`      | `Attention \| null`   | no       | A user-authored attention injection (weight + rationale). Valid only on goal-layer kinds, enforced by `validateGraph`. The resolved flow it seeds is derived on read by `resolveAttention` and never stored. Defaults to `null`. |
| `attributes`     | `Record<string, unknown>` | no   | Kind-specific fields (e.g. a delegation's divergence/irreversibility assessment). Validated as a plain object; the meaning of its entries is defined by the node's kind node. Defaults to `{}`. |

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
| `answer`   | `string` | Its resolved answer. |

### `ToolingGoal`

| Name        | Type           | Meaning |
| ----------- | -------------- | ------- |
| `kind`      | `ToolingKind` enum | What the goal codifies. |
| `statement` | `string`       | The tooling goal, in one sentence. |

### `Attention`

A user-authored injection that seeds the derived attention flow. Valid only on
goal-layer kinds (see Graph-level validation).

| Name             | Type              | Meaning |
| ---------------- | ----------------- | ------- |
| `weight`         | `number`          | The injected weight. Must be finite and `>= 0`; any scale — only ratios matter. |
| `rationale`      | `string`          | Why this node draws (or defers) attention now. Must be non-empty. |
| `subordinate_to` | `string[]`        | `id`s of nodes whose claims outrank this one. While non-empty, the injection is damped. Defaults to `[]`. |
| `review_trigger` | `string \| null`  | The condition that re-opens an explicit deferral. **Required when `weight` is 0** (deferral without a re-open condition is rejected); otherwise `null`. |

## Enums

### `Owner`

| Value       | Meaning |
| ----------- | ------- |
| `human`     | A person is accountable for the intention. |
| `ai`        | An AI agent is accountable for the intention. |
| `procedure` | An automated procedure owns the intention. |

### `Status`

| Value       | Meaning |
| ----------- | ------- |
| `raw`       | Captured but not yet refined. |
| `refining`  | Being clarified through the dialectic. |
| `delegated` | Handed to an owner to act on. |
| `codified`  | Realized in tooling, code, or a procedure. |

### `ToolingKind`

| Value       | Meaning |
| ----------- | ------- |
| `actuator`  | Codifies *doing* — an automated procedure or action. |
| `sensor`    | Codifies *knowing* — an observation or measurement. |

## Required vs. optional

The required core — `id`, `kind`, `statement`, `owner`, `status` — is always
present and strictly validated. The optional fields tolerate being absent or
`null`. This split is load-bearing: read-only backfill has a real source only
for `id`, `kind`, `parent`, `statement`, `rationale`, `owner`, `status`, and
`attributes.source`. The dialectic fields (`clarifications`, `tooling_goals`,
`success_signal`, `serves` on tactics) come from a dialectic that has not run
yet, and `reading` and `gap` are sensor-populated after the dialectic runs
(`reading` measured by the sensor, `gap` mechanically derived from it), so
`validateNode` must accept nodes without them rather than rejecting backfilled
nodes as invalid.

## Graph-level validation

`validateGraph(nodes)` checks referential integrity across a whole node set:
every node's `kind` has its defining `kind-<kind>` node present, and every
non-null `parent` and every `serves` and `recovers` entry resolves to an
existing node id. It also checks the `attention` edges: every
`attention.subordinate_to` entry resolves to an existing node id, and
`attention` appears only on nodes whose kind node sets
`attributes.goal_layer: true`. The eligible layer is data (the kind nodes), not
a kind list in this file — virtues stay unranked because `kind-virtue` carries
no `goal_layer` flag, not because code names it. It
throws one error listing all violations. Backfill runs it over the full store
after regenerating the tactic leaves.

## Round-trip guarantee

`node → file → node` is lossless on the frontmatter model. `validateNode`
returns an object with exactly the `IntentionNode` fields and all defaults
applied (`parent: null`, `serves: []`, `recovers: []`, `rationale: null`, `reading: null`,
`gap: null`, `clarifications: []`, `tooling_goals: []`, `success_signal: null`,
`attention: null`, `attributes: {}`), so constructing a node, writing it to
frontmatter, reading it back, and validating yields a deep-equal node.
`attributes` values must be
YAML-representable data (strings, numbers, booleans, arrays, maps) for the
guarantee to hold. The cosmetic markdown body is excluded from this guarantee
by design — only the frontmatter is authoritative.

## Derived attention is never stored

The `attention` field is a user-authored *injection* — only the weight,
rationale, and edges the author writes. The resolved flow and band that
`resolveAttention` computes from it are derived on read and NEVER enter
frontmatter. This contrasts with `gap`, which `deriveGap` computes from
same-file inputs (`reading` vs `success_signal.threshold`): storing `gap` is
safe because it is a local function of one node's own fields. Attention is a
*global* function of the whole graph — a node's flow depends on every other
node's injections and edges — so storing it would go stale on any edit
elsewhere in the graph. It is recomputed from the authoritative injections each
time it is read, the same intent/derivation discipline as `intentions/`
(authored intent) vs `trackers/` (derived execution state).
