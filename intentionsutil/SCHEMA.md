# Intention node schema

An intention tree is a single uniform node structure. Every node is the same
type at any altitude: a charter principle is a root node, an issue's scope is a
leaf node, and the same schema describes both. There is no separate "principle"
or "scope" type — only nodes, linked by `parent`.

## File format

Each node is one markdown file with a YAML frontmatter block:

```md
---
id: align-root
parent: null
statement: Unify intention tracking into one uniform node structure.
owner: human
status: refining
rationale: Scattered intent across issues, charter, and docs drifts apart.
reading: charter
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
| `statement`      | `string`              | yes      | The intention itself, in one sentence. The markdown body renders this. |
| `owner`          | `Owner` enum          | yes      | Who is accountable for the intention. |
| `status`         | `Status` enum         | yes      | Lifecycle stage of the node. |
| `parent`         | `string \| null`      | no       | `id` of the parent node; `null` for a root. Defaults to `null`. |
| `rationale`      | `string \| null`      | no       | Why this intention exists. Defaults to `null`. |
| `reading`        | `string \| null`      | no       | Source the node was read from during backfill. Defaults to `null`. |
| `gap`            | `string \| null`      | no       | A known shortfall between intention and current state. Defaults to `null`. |
| `clarifications` | `Clarification[]`     | no       | Q&A pairs resolved during the dialectic. Defaults to `[]`. |
| `tooling_goals`  | `ToolingGoal[]`       | no       | Tooling the node aims to produce or change. Defaults to `[]`. |
| `success_signal` | `SuccessSignal \| null` | no     | A measurable signal the intention is met. Defaults to `null`. |

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

The required core — `id`, `statement`, `owner`, `status` — is always present and
strictly validated. The optional fields tolerate being absent or `null`. This
split is load-bearing: read-only backfill has a real source only for `id`,
`parent`, `statement`, `rationale`, `owner`, `status`, and `reading`. The
dialectic fields (`clarifications`, `tooling_goals`, `success_signal`, `gap`)
come from a dialectic that has not run yet, so `validateNode` must accept nodes
without them rather than rejecting backfilled nodes as invalid.

## Round-trip guarantee

`node → file → node` is lossless on the frontmatter model. `validateNode`
returns an object with exactly the `IntentionNode` fields and all defaults
applied (`parent: null`, `rationale: null`, `reading: null`, `gap: null`,
`clarifications: []`, `tooling_goals: []`, `success_signal: null`), so
constructing a node, writing it to frontmatter, reading it back, and validating
yields a deep-equal node. The cosmetic markdown body is excluded from this
guarantee by design — only the frontmatter is authoritative.
