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
  threshold: all committed nodes pass
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
| `mount`          | `string \| null`      | no       | `id` of the anchoring record node this node is mounted on; `null` for a native node. A node with `mount` set is a *mounted node* — the author's model of a counterparty intention. See [Mounts](#mounts). Defaults to `null`. |
| `grafts`         | `string[]`            | no       | `id`s of mounted nodes whose motivation this node partly carries across the mount boundary. The only relation permitted to cross the boundary. See [Mounts](#mounts). Defaults to `[]`. |
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
optional fields are filled in. A freshly authored tactic carries empty
dialectic fields (`clarifications`, `tooling_goals`, `success_signal`,
`serves`) until the dialectic populates them. `reading` and `gap` are
sensor-populated after the dialectic runs (`reading` measured by the sensor,
`gap` mechanically derived from it). `validateNode` must therefore accept
nodes without any of these rather than rejecting them as invalid.

## Authority

The graph is the sole store and the authoritative source of truth for all
intention data — every node is authored directly in the graph. This supersedes
the earlier split-authority model, in which GitHub was treated as authoritative
for execution state. Remaining direction: migrate the dispatch router to work
on the graph instead of GitHub; integration with an external tracker (such as
GitHub) is a possible future strategy whose design is TBD. The dispatch
fleet's ability to create new work items (deferred follow-ups) must survive
that migration.

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
one error listing all violations. (Rules 10–15 cover the graph-native dispatch
fields and `blocked_by` cycles; rules 16–18 cover status vocabularies,
clarification provenance and attention dominance; rules 19–21 cover mounts —
see below.)

## Mounts

Mounting makes external graphs — a delegatee's virtues, a tradition's framings,
a person's or institution's obligations — first-class structure *grafted* onto
this graph, rather than the write-only prose the delegation/tradition axis
fields hold today. A mount is the author's *model* of a counterparty intention;
it is audit structure, never work to be dispatched.

- **`mount`** — a node with `mount` set (naming an anchoring record) is a
  *mounted node*. Mounted nodes keep their **native kind**: a mounted virtue is
  `kind: virtue`, a mounted obligation is `kind: duty`, so existing kind
  semantics carry over inside the mount.
- **Anchors** — a mount anchors on a *record*. A kind is a valid anchor when its
  kind node sets `attributes.mount_anchor: true`; `kind-delegation` and
  `kind-tradition` do so today (person/institution records join the family
  later). This is the same kind-attribute gate `goal_layer` uses.
- **`grafts`** — the ids of mounted nodes whose motivation a node partly carries
  across the boundary (canonical: a strategy that grafts a mounted vendor-growth
  virtue). "What do I hold because of a graft" is queryable by relation type; it
  is **never** expressed as `serves`. `grafts` is the ONLY relation permitted to
  cross the mount boundary.
- **`kind: duty`** — a kind (`intentions/kind-duty.md`) for obligation-shaped
  mounted content (social mounts: family, client/employer). Schema readiness
  only this round; not goal-layer, not a mount anchor.
- **Recursion** — an anchor record may itself carry `mount` (a vendor's record
  modeled inside another mount). Allowed by construction; the `mount` edge is
  not judged by the boundary rule.
- **By-reference readiness** — `mount` is a node id resolved within the loaded
  node set. A by-reference mount later loads an external store into the same set
  without changing the field's shape. Not implemented here.
- **Id naming convention** (documented, not validated) — mounted node ids read
  `<kind>-<counterparty>-<slug>`, e.g. `virtue-attention-services-growth`.
- **No attention across the boundary** — mounted nodes are excluded from
  `activeFrontier` and from `resolveAttention` eligibility and flow, and
  `grafts` edges are deliberately not traversed by the attention flow. Mount
  structure is audit structure, not attention routing — consistent with `serves`
  staying native-only.

`validateGraph` enforces three mount rules:

16. Every non-null `mount` resolves to an existing node whose kind node sets
    `attributes.mount_anchor`.
17. Every `grafts` entry resolves to an existing node with `mount` set (a graft
    always lands on a mounted node).
18. `serves` and non-null `parent` never cross a mount boundary — an un-mounted
    node's targets are un-mounted, and a mounted node's targets carry the same
    `mount` anchor. Rules 6–8 still apply inside a mount.

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
authoritative injections each time it is read — `intentions/` stores authored
intent, never derived global state.
