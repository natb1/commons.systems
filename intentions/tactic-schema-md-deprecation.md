---
id: tactic-schema-md-deprecation
kind: tactic
statement: Deprecate SCHEMA.md — move the schema detail into the kind-node
  bodies, delete the file, and repoint its 8 referencing files
owner: ai
status: codified
parent: null
rationale: "Retained from the 2026-07-09 /align-strategy review round: SCHEMA.md
  and the kind nodes are two competing schema authorities and their drift
  produced the round's largest finding cluster. The kind nodes win; this tactic
  executes the move."
reading: null
gap: null
serves:
  - strategy-graph-self-description
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: done
execution:
  branch: tactic-schema-md-deprecation
  pr: 2980
  attempts: {}
  markers:
    - planned
    - qa-done
    - reviewed
  strategy_fingerprint: 15b5ef1dc7ce30e0a267440a124bd558c5506c86bd79f91fa2dc39b909df79b9
  fix: null
  completion:
    mergedAt: 2026-08-04T10:46:06Z
    mergeCommitSha: edc11dc4f3292a1d06b43eb09078e9def80c19cf
    graphCommitSha: null
validates: []
blocked_by:
  - tactic-align-skill-schema-pointers
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# tactic-schema-md-deprecation

## Context

The graph is self-describing (`intentions/kind-kind.md` is the declared entry
point), but `packages/intentionsutil/SCHEMA.md` (222 lines) still claims
authority over the same schema and has drifted: it documents graph rules 1-9
while `validateGraph` enforces 15, and its field table omits the seven
first-class dispatch fields (`phase`, `execution`, `validates`, `blocked_by`,
`office_hours`, `pace_exempt`, `rounds`). Decision
(strategy-graph-self-description, 2026-07-09 interview): kind nodes are the
sole schema authority; SCHEMA.md's still-accurate detail moves into the
kind-node bodies and the file is deleted.

The 2026-07-11 sweep counted 11 referencing files. Three live under
`.claude/skills` (auto-mode blocks agent commits there):
`.claude/skills/align-init/SKILL.md:88`,
`.claude/skills/align-tactics/SKILL.md:242`, and
`.claude/skills/dispatch-propagate/scripts/audit-copy-changes.sh:65`. Those
three are repointed by the author in the born-parked gate
`tactic-align-skill-schema-pointers`, which **blocks this tactic** — by the
time this tactic runs, `grep -rn "SCHEMA.md" .claude/skills` is already empty,
and this tactic must not touch `.claude/skills` at all.

## Units

### Unit 1 — Move SCHEMA.md's still-accurate content into the kind-node bodies

**Scope:**

- `intentions/kind-kind.md` body (currently 112 lines) gains the all-nodes
  material from `packages/intentionsutil/SCHEMA.md`, corrected against the
  code where SCHEMA.md drifted:
  - File format and round-trip guarantee (SCHEMA.md:17-54, 193-205; code:
    `packages/intentionsutil/src/store.ts:40-51` writeNode,
    `validateNode` at `packages/intentionsutil/src/schema.ts:441` onward).
  - The complete common-field list — every key of `IntentionNode`
    (`packages/intentionsutil/src/schema.ts:100-140`), including the seven
    dispatch fields SCHEMA.md omits. Kind-scoped fields are listed on
    kind-kind with a pointer to the owning kind (next bullet).
  - Shared shapes: `SuccessSignal`, `Clarification`, `ToolingGoal`,
    `Attention`, `Execution`, `OfficeHours`, `Rounds` (SCHEMA.md:76-113 plus
    the never-documented ones; code `schema.ts:44-97, 322-348`).
  - Enums: `Owner`, `ToolingKind`, `Phase`/`PHASES` (`schema.ts:33-41`).
    `Status`: until `tactic-status-kind-vocabularies` lands, document the
    current central `STATUSES` (`schema.ts:13`) on kind-kind with a note that
    per-kind vocabularies are landing; if that tactic has already landed,
    document the per-kind-declaration rule instead — whichever lands second
    reconciles.
  - Required-vs-optional and defaults-on-read (SCHEMA.md:140-151).
  - Graph-level validation: the **full** current rule set — enumerate from
    `validateGraph` (`packages/intentionsutil/src/schema.ts:530-720`), not
    from SCHEMA.md:163-192, which stops at rule 9.
  - The authority section (SCHEMA.md:152-162) rewritten: kind nodes are the
    sole schema authority; no second document claims field or lifecycle
    semantics.
  - Derived-attention doctrine (SCHEMA.md:206-222), generalized per the
    strategy: derived values are never stored.
- Kind-scoped field detail lands on the owning kind's body, not kind-kind:
  `phase`/`execution`/`blocked_by`/`validates` on `intentions/kind-tactic.md`
  (enforcement: `schema.ts:626-641`), `recovers` on
  `intentions/kind-strategy.md` (`schema.ts:608`), `rounds` on kind-strategy
  (`schema.ts:666`).
- Per the body-function doctrine (strategy clarification, 2026-07-09): a kind
  node's body carries normative schema/spec detail — this content is
  authoritative there, while never shadowing frontmatter.
- Out of scope: deleting SCHEMA.md (Unit 2), any `.claude/skills` edit (the
  gate tactic owns those), status-vocabulary declarations
  (tactic-status-kind-vocabularies), the mechanical drift guard
  (tactic-schema-drift-guard).

**Recommended model:** opus

### Unit 2 — Delete SCHEMA.md and repoint the remaining references

**Scope:**

- Delete `packages/intentionsutil/SCHEMA.md`.
- `intentions/README.md:6`: repoint the schema link to
  `intentions/kind-kind.md`.
- `packages/intentionsutil/SEPARABILITY.md` gap 5 (lines 181-227): add a
  dated supersession note — the "extend SCHEMA.md / companion USAGE.md"
  remediation is superseded by this deprecation; `intentions/kind-kind.md` is
  the doc home. Keep the dated audit narrative itself as-is (it is a
  historical record).
- If `packages/intentionsutil` has a package README, keep (or add) a one-line
  pointer to `intentions/kind-kind.md`.
- Historical mentions inside `intentions/*.md` dated clarifications and
  rationales stay as-is (dated records are not repointed).
- Out of scope: `.claude/skills/**` (already handled by
  tactic-align-skill-schema-pointers before this tactic unblocked).

**Recommended model:** sonnet

**Dependencies:** Unit 1.

## Reuse

- `intentions/kind-kind.md` — the landing home; follow its existing body
  structure and register.
- `validateGraph` (`packages/intentionsutil/src/schema.ts:530-720`) — the
  authoritative rule list to document; do not invent rule numbering.
- `intentions/kind-tactic.md`, `intentions/kind-strategy.md` — homes for
  kind-scoped field detail.

## Verification

```verify
test ! -f packages/intentionsutil/SCHEMA.md || { echo "FAIL: packages/intentionsutil/SCHEMA.md still exists"; exit 1; }
for p in intentions/README.md packages/intentionsutil/src packages/intentionsutil/scripts; do
  test -e "$p" || { echo "FAIL: verify path missing: $p"; exit 1; }
done
hits=$(LC_ALL=C git grep -an 'SCHEMA.md' -- intentions/README.md packages/intentionsutil/src packages/intentionsutil/scripts); rc=$?
[ "$rc" -le 1 ] || { echo "FAIL: git grep errored (rc=$rc)"; exit 1; }
[ -z "$hits" ] || { printf '%s\n' "$hits"; echo "FAIL: SCHEMA.md references survive in live code/docs"; exit 1; }
node --import tsx/esm packages/intentionsutil/scripts/validate-graph.ts intentions || exit 1
npx vitest run --project packages/intentionsutil --root . || exit 1
```

Prose checks: `grep -rn "SCHEMA.md" .claude/skills` should already be empty
because the blocking gate landed first — if it is not, stop; the gate ordering
was violated. Remaining `SCHEMA.md` mentions in `intentions/*.md` and
`SEPARABILITY.md` must all be inside dated historical text (clarifications,
rationales, the gap-5 audit narrative), never live instructions. Read
`intentions/kind-kind.md` afterward as a fresh reader and confirm every field,
enum, and rule the code enforces is discoverable from it.
