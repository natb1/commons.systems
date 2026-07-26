---
id: tactic-node-merge-list-removal-loss
kind: tactic
statement: "graph-commit's layer-2 field-level merge cannot express a REMOVAL: the
  base-free list union silently restores a deleted blocked_by/serves/validates
  entry (and an attributes-key deletion) under concurrent-edit contention, and
  reports the land as a clean auto-resolve"
owner: ai
status: raw
parent: null
rationale: "Observed in production 2026-07-25 during the office-hours drain
  sweep, on tactic-align-tactics-workflow (PR #2931). A single write that set
  office_hours: null AND removed one satisfied blocked_by edge landed with the
  null applied but the edge SILENTLY RESTORED, and graph-commit exited 0
  reporting a successful layer-2 auto-resolve. The drain session only caught it
  because it independently re-read origin/main on its own verification step; it
  then had to rebuild the node from fresh origin/main content and land a second
  commit, so what doctrine calls a single atomic graph operation took two. This
  is not a race in the usual sense — the union rule is base-free, so the
  restoration is DETERMINISTIC for any removal that meets a concurrent land, and
  no --base CAS protects against it because layer 3 re-applies through the same
  merge. Filed as a draft awaiting an /align-tactics round; the fix has a design
  decision in it (see the body) that decomposition should settle rather than a
  session picking unilaterally."
reading: null
gap: null
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
# graph-commit's layer-2 field merge cannot express a removal — deleted list entries and attributes keys are silently restored, and the land reports success

## Context

`strategy-graph-native-dispatch`'s five-rung resolution ladder (entry 58,
2026-07-13; vehicle assignment amended by entry 78) makes layer 2 a
"structure-aware field-level merge (frontmatter list appends union, distinct-field
edits combine)" — `strategy-graph-native-dispatch:2051-2052`. The word **appends**
is the whole defect: the design frames list edits as additive, and the
implementation follows it literally, so a *removal* has no representation.

`packages/intentionsutil/src/node-merge.ts`:

- `LIST_FIELDS` (`:36-43`) = `serves`, `recovers`, `clarifications`,
  `tooling_goals`, `validates`, `blocked_by`.
- The list branch (`:162-167`) is `mergedRec[field] = unionList(theirsList, oursList)`
  — and `unionList` (`:102-111`) is documented "Deterministic; **base-free**."
- Because it never consults `base`, "entry present in theirs, absent in ours"
  is indistinguishable from "entry theirs just added". The union keeps it.
- No `FieldConflict` is pushed for list fields at all, so `conflicts` comes back
  `[]` and the caller sees a clean resolve.

The same shape applies to `attributes` (`:181-200`): a key `inTheirs && !inOurs`
is treated as a "theirs-only addition" and kept, so deleting an attributes key
is reverted too.

`graph-commit` then sets `RESOLVED_VIA_MERGE=1` (`graph-commit:160-161`) and
reports the land with the `(layer 2/3 auto-resolved a concurrent-edit divergence)`
suffix (`graph-commit:58-60`) — a **success** message for a write that silently
did not do what it said.

**`--base` CAS does not mitigate this.** Layer 3's whole purpose is that a stale
`--base` "stops being fatal — tooling re-reads fresh origin/main state and
re-applies this writer's field-level edit automatically" (entry 58). That
re-apply runs through the same `merge-node.ts` (`graph-commit:238`), so pinning a
base converts a hard stale-base refusal into a silent restoration. CAS makes this
failure *more* likely to pass unnoticed, not less.

## Why this is not already covered

Three sibling nodes look adjacent and are not:

- `tactic-graph-commit-delete-vs-edit-park-hardening` (phase qa, PR #2936) is
  **node-level** delete-vs-edit — a concurrent writer deleting the whole node
  file. Its guard is `merge-node.ts:74-78` (empty `--theirs` + non-empty
  `--base`). Field-level removal inside a surviving node is a different code
  path and is not guarded.
- `tactic-graph-write-recipes-base-cas` covers `--base` being *omitted* by the
  completion recipes (silent whole-field clobber). Passing `--base` is its fix
  and, per above, does not fix this.
- `tactic-graph-commit-landing-lock` is contention *serialization*, upstream of
  the merge semantics.

Nothing in `intentions/` mentions the union rule outside the strategy's own
doctrine sentence, and `packages/intentionsutil/test/node-merge.test.ts` has
union coverage (`:40` dedup-overlap, `:50` attributes.conditions) but **no
removal case in either direction**.

## The design decision decomposition must settle

A base-free union cannot be made removal-aware without a base, so the fix is not
a one-line change. Two candidate shapes, deliberately not chosen here:

1. **Make the list merge three-way.** With `base` available, classify per entry:
   in-base-and-dropped-by-ours → a genuine removal, honor it; not-in-base and
   in-theirs → an addition, keep it. Contention where one side removes an entry
   the other side edits becomes a `FieldConflict`, which the existing layers 4-5
   already know how to route. Costs: `unionList` stops being base-free, and the
   `base === null` case (add/add) still has to fall back to union.
2. **Refuse rather than guess.** Detect "ours dropped an entry present in
   theirs" and emit a mechanical-unresolved conflict, letting
   `/dispatch-conflict` Lane 2 own it. Cheaper and strictly safe, but turns a
   common, genuinely-mechanical operation (satisfied `blocked_by` cleanup during
   a drain) into a park — pressure in exactly the direction
   `tactic-mechanical-park-producers` is trying to reduce.

The interim operational rule, already in practice: after any graph write that
removes a list entry or attributes key, re-read `git show origin/main:intentions/<id>.md`
and assert the removal actually landed; split combined set+remove writes into two
landings.

## Verification

```verify
npx vitest run --project intentionsutil --root . packages/intentionsutil/test/node-merge.test.ts
```

The above only proves the current suite still passes — it is the regression
baseline, not evidence of a fix. Real verification of whichever shape is chosen:

- A new `node-merge` case: base has `blocked_by: [x, y]`, ours drops `x`, theirs
  is unchanged → merged must be `[y]`, not `[x, y]`.
- The mirror case: base `[x]`, ours drops `x`, theirs also edits an unrelated
  scalar → merged `blocked_by` must be `[]` and the scalar must survive.
- The add/add case (`base === null`) must keep union behavior.
- An end-to-end `test-graph-commit.sh` case that lands a removal against a
  concurrent edit and asserts the entry is gone on the resulting main tree, plus
  that graph-commit does NOT print the auto-resolved-success suffix when it
  could not honor the removal.
- Judgment: confirm the chosen shape does not regress the drain lane into
  parking on ordinary satisfied-edge cleanup.

## Dependencies

None hard. Sequencing note: `tactic-graph-commit-delete-vs-edit-park-hardening`
(PR #2936) touches `merge-node.ts`'s guard region and its test shim; landing this
after it avoids conflicting edits to the same file and lets the new tests reuse
whatever shim fidelity that node restores.
