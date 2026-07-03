# Intention node schema

An intention graph is a single uniform node structure. Every node is the same
type at any altitude: a virtue at a root, a strategy below it, a tactic doing
concrete work, a delegation record, or a kind node describing one of those
classes — the same schema describes all of them, linked by `parent` and
`serves`.

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
| `attention`      | `Attention \| null`   | no       | A user-authored attention injection (a `boost` XOR an `override`, plus a rationale). Valid only on goal-layer kinds, enforced by `validateGraph`. The rank it seeds is derived on read by `resolveAttention` and never stored. Defaults to `null`. |
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

A user-authored injection that seeds the derived rank. Exactly one of `boost` /
`override` is set (the authored YAML supplies one key; the other resolves to
`null`). Valid only on goal-layer kinds (see Graph-level validation).

| Name         | Type              | Meaning |
| ------------ | ----------------- | ------- |
| `boost`      | `number \| null`  | A RELATIVE claim: adds `(self, boost)` to this node's outgoing source set, surviving upstream re-weighting. Must be finite and `> 0` (a zero boost is meaningless — use `override: 0` to explicitly zero a branch). `null` when `override` is set. |
| `override`   | `number \| null`  | An ABSOLUTE cap: replaces this node's outgoing set with `{(self, override)}`, capping its own branch only (a descendant's other parents still contribute). Must be finite and `>= 0`. `null` when `boost` is set. |
| `rationale`  | `string`          | Why this node draws (or defers) attention now. Must be non-empty. |

Setting both `boost` and `override`, or neither, is rejected by
`validateAttention`.

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
`null`. This split is load-bearing: a node may legitimately exist before its
optional fields are filled in. On a gh-backed tactic, backfill derives only the
gh-derived fields — `statement`, `parent`, `rationale`, and `attributes.source`
(see "Authority and the GitHub projection"); everything else is graph-owned. So
a freshly generated tactic carries empty dialectic fields (`clarifications`,
`tooling_goals`, `success_signal`, `serves`) until the dialectic populates them.
Those dialectic fields are graph-owned: once authored on a gh-backed tactic,
backfill preserves them across every reconcile — they no longer only await a
dialectic run, they survive reconciliation. `reading` and `gap` are
sensor-populated after the dialectic runs (`reading` measured by the sensor,
`gap` mechanically derived from it). `validateNode` must therefore accept nodes
without any of these rather than rejecting them as invalid.

## Authority and the GitHub projection

The graph is the authoritative source of truth for all data. GitHub is an
optional, derived projection of it — useful for execution tooling today, but
never the origin of intention. This supersedes the earlier split-authority
model, in which GitHub was treated as authoritative for execution state:
intention and execution state now both live in the graph.

The move to a graph-authoritative model proceeds in three steps:

1. Make the graph a correct source of truth for all data — the current change.
2. Incrementally migrate the dispatch router to work on the graph instead of
   GitHub — future work.
3. Optionally re-establish a full GitHub integration on top of the graph
   (design TBD) — future work.

The dispatch fleet's ability to create new work items (deferred follow-ups)
must survive every step. Today it files GitHub issues, which sync into the
graph as tactics.

### Per-field ownership for gh-backed tactics

A tactic is *gh-backed* when its frontmatter carries
`attributes.source: github:<owner>/<repo>#<N>`. For a gh-backed tactic, backfill
(`npx tsx packages/intentionsutil/scripts/backfill.ts`) is a reconciler, not a
regenerator: it syncs the gh-derived fields from the issue, preserves every
graph-owned field, prunes gh-backed tactics whose issue has closed, and never
touches a hand-authored tactic. Backfill is strictly read-only toward GitHub.

| Field | Ownership | Source when gh-backed |
| ----- | --------- | --------------------- |
| `statement` | gh-derived | issue title |
| `parent` | gh-derived | issue hierarchy (nulled if the parent issue is closed) |
| `rationale` | gh-derived | issue body `## Scope` section |
| `attributes.source` | gh-derived | the `github:<owner>/<repo>#<N>` reference itself |
| `owner`, `status`, `serves`, `recovers`, `attention`, `clarifications`, `tooling_goals`, `success_signal`, `reading`, `gap`, and any other `attributes` keys | graph-owned | authored in the graph; preserved on every reconcile |

A hand-authored tactic — one with no `attributes.source` — is fully
graph-owned: backfill never reads or writes it. It is the primary form a tactic
takes before, or without, a GitHub projection.

## Graph-level validation

`validateGraph(nodes)` checks referential integrity across a whole node set —
the edges between nodes, not per-node shape. It enforces:

1. Every node's `kind` has its defining `kind-<kind>` node present. This is
   what makes the graph self-describing: the set of valid kinds is the set of
   committed kind nodes, not an enum in this file.
2. Every non-null `parent` resolves to an existing node id.
3. Every `serves` entry resolves to an existing node id.
4. Every `recovers` entry resolves to an existing node id.
5. `attention` appears only on nodes whose kind node sets
   `attributes.goal_layer: true`. The eligible layer is data (the kind nodes),
   not a kind list in this file — virtues stay unranked because `kind-virtue`
   carries no `goal_layer` flag, not because code names it.
6. A non-null `parent` resolves to a node of the *same* `kind` — virtue→virtue,
   strategy→strategy, tactic→tactic (uniform across every kind).
7. Every `serves` entry on a `kind: "tactic"` node resolves to a
   `kind: "strategy"` node.
8. Every `serves` entry on a `kind: "strategy"` node resolves to a
   `kind: "virtue"` node.
9. A non-empty `recovers` appears only on `kind: "strategy"` nodes, and every
   entry resolves to a `kind: "delegation"` node.

Rules 6–9 judge only edges whose target already resolves (rules 2–4 report the
dangling case), so a single broken edge is not double-reported. `serves` on
delegation and kind nodes is deliberately unenforced — a delegation serves
whatever depends on it, which is intentionally loose. `validateGraph` throws
one error listing all violations. Backfill runs it over the full store after
reconciling the gh-backed tactics.

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

The `attention` field is a user-authored *injection* — only the `boost` or
`override` and its rationale the author writes. The resolved rank that
`resolveAttention` computes from it is derived on read and NEVER enters
frontmatter. `resolveAttention` accumulates, per node, a set of
`(source-node, amount)` pairs flowing DOWN `parent` + `serves` edges — undecayed
and undiluted, each authored source counted once per node — and a node's rank is
the sum of its own set (a `boost` adds `(self, boost)`; an `override` replaces
the set with `{(self, override)}`, capping its branch). This contrasts with
`gap`, which `deriveGap` computes from same-file inputs (`reading` vs
`success_signal.threshold`): storing `gap` is safe because it is a local function
of one node's own fields. Attention is a *global* function of the whole graph —
a node's rank depends on every ancestor's injections and edges — so storing it
would go stale on any edit elsewhere in the graph. It is recomputed from the
authoritative injections each time it is read, the same intent/derivation
discipline as `intentions/` (authored intent) vs `trackers/` (derived execution
state).
