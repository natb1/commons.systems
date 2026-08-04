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
  real (kind-delegation). Lifecycle differs by layer: virtues are permanent,
  strategies are persistent (they end only by condition-expiry or deliberate
  retirement), tactics are transient (removed from the graph on completion).


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
gap: null
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

A user-authored injection that seeds the derived rank. Exactly one of `boost` /
`override` is set — the authored YAML supplies one key and the other resolves to
`null`. Setting both, or neither, is rejected.

| Name        | Type             | Meaning |
| ----------- | ---------------- | ------- |
| `boost`     | `number \| null` | A RELATIVE claim: adds `(self, boost)` to this node's outgoing source set, surviving upstream re-weighting. Must be finite and `> 0` — a zero boost is meaningless; use `override: 0` to explicitly zero a branch. |
| `override`  | `number \| null` | An ABSOLUTE cap: replaces this node's outgoing set with `{(self, override)}`, capping its own branch only (a descendant's other parents still contribute). Must be finite and `>= 0`. |
| `rationale` | `string`         | Why this node draws (or defers) attention now. Must be non-empty. |

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
`execution: null`, `validates: []`, `blocked_by: []`, `office_hours: null`,
`pace_exempt: false`, `rounds: null`, `attributes: {}`.

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
