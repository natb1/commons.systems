---
id: tactic-dispatch-conflict-substance-allowlist
kind: tactic
statement: Export STATE_FIELDS from schema.ts and replace /dispatch-conflict's
  prompt-level doctrine guard with a mechanical check that refuses any non-state
  field write to a durable-layer node
owner: ai
status: raw
parent: null
rationale: Ruled 2026-08-14 as violation V2. The reconciliation lane builds an
  unconstrained jq filter from a subagent's output and sets whatever fields
  diverged on any node kind, with virtue/strategy/tradition/delegation doctrine
  fields explicitly in scope. The only guard is a sentence in a prompt; no code
  refuses a substance field on a durable-layer id. Ruled 2026-08-14 as a
  six-field positive allowlist and corrected 2026-08-15 to a negative
  not-in-STATE_FIELDS check, after the pre-commit review showed the positive
  form omits rationale — the field the skill's own ratified doctrine names
  first — along with attributes, owner and parent. Model the
  refuse-before-mutation contract on park-node's --base pin rather than on
  graph-commit's, which auto-merges a stale blob instead of refusing.
reading: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
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
attributes: {}
---
# Replace /dispatch-conflict's prompt-level doctrine guard with a mechanical field allowlist that refuses substance writes to durable-layer nodes

## Draft context (2026-08-14 /align correction round)

Doctrine home: `strategy-graph-native-dispatch`, the clarification "Which lanes
violate the autonomous-substance invariant today" — this is **V2**.

### The gap

`.claude/skills/dispatch-conflict/SKILL.md`'s reconciliation lane instructs: for
each diverged field the subagent resolved, set `.<field>` to its reconciled value
— building an **unconstrained `jq` filter**, then `write-node.ts`, then
`graph-commit`. The same skill explicitly places durable-layer doctrine fields in
scope, naming virtue / strategy / tradition / delegation `statement`, `rationale`
and clarification text, and telling the model to resolve "only mechanical
divergence… never synthesizing new substance".

**That instruction is the entire guard.** No code refuses an allowlist field on a
`strategy-*` id. A prompt is not a gate.

Lane classification is genuinely ambiguous — a human types the command, but no
human reviews the resolution before it lands. Under the ruled definition of
"attended" (a human rules on the **write**, not on the invocation) this is
autonomous.

### Scope

- **Unit A — export `STATE_FIELDS` from `packages/intentionsutil/src/schema.ts`**:
  the router- and sensor-owned set (`phase`, `execution`, `office_hours`,
  `reading`, `attention`, `rounds`, `status`, `blocked_by`). This is the small,
  enumerable half.
- **Unit B — add a mechanical refusal**: when the target id resolves to a
  durable-layer kind (`virtue`, `strategy`, `delegation`, `kind`, `tradition`),
  refuse to set any field for which `!STATE_FIELDS.has(field)` holds, and park
  for a human instead.

  **Do not implement this as a positive allowlist of substance fields.** It was
  ruled that way on 2026-08-14 — the six `strategyFingerprint` fields — and
  **corrected 2026-08-15** because the positive form fails **open**, and the
  measured fallthrough included the field this guard exists for:

  - **`rationale`** is named FIRST in the ratified doctrine this skill
    reconciles against (`.claude/skills/dispatch-conflict/SKILL.md`: "virtue /
    strategy / tradition / delegation `statement`, `rationale`, clarification
    text"), and it is **not** a `strategyFingerprint` field. The six-field
    version left it unprotected.
  - **`attributes`** beyond `conditions` is graph-semantics-bearing —
    `validateGraph` rules key on `attributes.goal_layer`,
    `attributes.status_vocabulary`, `attributes.tier` — and is written onto
    durable nodes today by `/grounding-research`
    (`attributes.grounding`, `attributes.curriculum`).
  - **`owner`** and **`pace_exempt`** are authority fields.
  - Also falling through: `parent`, `recovers`, `validates`, `kind`.

  Under the negative form a field added to the schema tomorrow defaults to
  substance, which is the fail-safe direction, and there is no second list to
  keep in sync.
- **Refuse before mutation, with a dedicated exit code.** Model this on
  `park-node`'s `--base` pin, whose header/resolution/refusal shape is already
  duplicated verbatim in `clear-park`. Do **not** model it on `graph-commit`'s
  `--base`, which auto-merges a stale blob rather than refusing and never exits 3
  despite its own header claiming so.
- Keep the prompt instruction as documentation; it stops being the control.

### Not measured

Whether this has ever fired on a durable node. Git history was **not** searched,
so it is unknown whether any landed doctrine text was model-reconciled without
review. Searching it is cheap and would tell the author whether this is
theoretical or historical — worth doing as the first step of the fix, not as a
blocker on it.
