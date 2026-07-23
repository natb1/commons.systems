---
id: tactic-office-hours-session-type
kind: tactic
statement: "Add office_hours.session_type (closed enum: requirement-discovery,
  curriculum-review, other) and soft-penalty type-aware ranking plus type
  filtering to the office-hours selector"
owner: ai
status: codified
parent: null
rationale: Surfaced in the 2026-07-23 /align-strategy interview recording the
  office-hours session-type requirement on strategy-attention-surface (see its
  2026-07-23 clarification). strategy-graph-native-dispatch is co-served because
  the office_hours park record schema is its projection doctrine.
reading: null
gap: null
serves:
  - strategy-attention-surface
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: implement
execution: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Add office_hours.session_type (closed enum: requirement-discovery, curriculum-review, other) and soft-penalty type-aware ranking plus type filtering to the office-hours selector

## Context

Add an `office_hours.session_type` closed enum (`requirement-discovery` |
`curriculum-review` | `other`, default `other`) to the parked-node record,
plus soft type-aware ranking (penalize `requirement-discovery` and
`curriculum-review` parks by a shared tunable factor) and a `--type` filter in
the office-hours selector, so the author can pull one session type on demand
while equal-attention `other` parks still rank ahead unless a penalized park
is boosted enough to overtake. Then backfill the 34 currently-parked nodes
that already have a natural type. This is a small additive change to an
established schema; every location and shape is pinned below.

All units land in **one PR**. The model tag on each unit is for the subagent
that implements that unit, not a signal to split PRs. Implement in the order
given (schema → repair typecheck breaks → ranking → CLI → tests → backfill)
because each layer's types/tests depend on the prior layer's field/constant
existing.

## Unit 1 — Schema: `session_type` type, constant, interface field, validator + default

**Recommended model:** sonnet

**Scope:**

- In `packages/intentionsutil/src/schema.ts`, add a `SessionType` union +
  `SESSION_TYPES` const immediately after the `Phase`/`PHASES` block
  (`schema.ts:36-53`), mirroring that exact shape:
  ```ts
  export type SessionType = "requirement-discovery" | "curriculum-review" | "other";
  export const SESSION_TYPES: readonly SessionType[] = [
    "requirement-discovery",
    "curriculum-review",
    "other",
  ];
  ```
- Add a **non-optional** field to the `OfficeHours` interface at
  `schema.ts:393-397`: `session_type: SessionType;` (every validated
  `OfficeHours` carries a concrete value; the optional-ness lives only in the
  raw input, discharged by the default below).
- In `validateOfficeHours` (`schema.ts:525-534`), add a `session_type` line
  using the "absent → concrete default, not null" pattern copied from
  `pace_exempt` at `schema.ts:620-621` (NOT the nullable `phase` shape):
  ```ts
  session_type:
    value.session_type == null
      ? "other"
      : requireOneOf(value.session_type, SESSION_TYPES, `${field}.session_type`),
  ```
  This reuses `requireOneOf` (`schema.ts:198`); an unknown value throws
  `IntentionSchemaError` — a clear error, no fallback.
- **Fix the one runtime test-expectation break this default introduces:** the
  existing test "defaults office_hours.recommendation to null when omitted" at
  `packages/intentionsutil/test/schema.test.ts:426-438` asserts
  `.toEqual({ reason, since, recommendation: null })`. After this change the
  validated object also carries `session_type: "other"`, so add that key to
  the expected object. Grep the file for any other exact
  `toEqual`/`toMatchObject` on a full `office_hours` object and update
  likewise (the `.toEqual` at ~`schema.test.ts:433` is the known one;
  `recommendation?`-property spot-checks like `schema.test.ts:452` do not
  break).

**Out of scope:** No new `validate-graph.ts` rule. `checkGoalLayerOnlyFields`
(`schema.ts:734-755`) only checks `office_hours !== null` and layer — it does
not inspect internal keys, and does not need to. The enum check is fully
discharged by `validateOfficeHours`, which every `readNode`/`writeNode`/
`write-node.ts` path already runs (exactly like `recommendation`'s
string-or-null check needs no graph rule). Do **not** touch the deprecated
legacy nested shape at `test/check-node-selection.test.ts:184`
(`attributes: { office_hours: { reason, since } }` — a 2-key squatter fixture
deliberately testing a fallback path).

## Unit 2 — Repair `OfficeHours` object-literal typecheck breaks across tests

**Recommended model:** sonnet
**Dependencies:** Unit 1

Making `session_type` a non-optional interface field breaks every direct
`OfficeHours`-typed object literal that does NOT flow through `validateNode`
(TS structurally checks these literals). Add `session_type: "other"` (or a
type-appropriate value if the test's intent is clearer with one) to each.
This list is confirmed exhaustive repo-wide:

- `packages/intentionsutil/test/office-hours.test.ts:57-59` — the
  `parked(recommendation = null): OfficeHours` factory. Add
  `session_type: "other"` to its returned literal; every office_hours literal
  in that file flows through it, so this one edit covers the file. (Unit 5
  adds a type-taking variant for the ranking tests — see there.)
- `packages/intentionsutil/test/coverage.test.ts:6-8` — the
  `parked(reason): OfficeHours` factory; add `session_type: "other"` to its
  literal.
- `packages/intentionsutil/test/router.test.ts` — the `anode()` helper's
  `office_hours` literals at lines 101, 235, 500, 518, 676, 788, 884, 928.
- `packages/intentionsutil/test/scope-sweep.test.ts:113`
- `packages/intentionsutil/test/graph-census-debt.test.ts:57`
- `packages/intentionsutil/test/strategy-fingerprint.test.ts:79`
- `packages/intentionsutil/test/check-node-selection.test.ts` lines 168, 440,
  557 (top-level `OfficeHours` shape). **Do NOT touch line 184** (legacy
  nested squatter shape, per Unit 1 out-of-scope).

**Out of scope / no change needed (rely on the default):**
- `packages/intentionsutil/scripts/graph-census-debt.ts:171` — production
  script building `office_hours: { reason, since, recommendation: null }` as
  JSON input piped to `write-node.ts`; the absent `session_type` defaults to
  `"other"` on the write side. Leave as-is (minimal diff); do not add the key.
- `packages/intentionsutil/scripts/park-node` (embedded tsx heredoc, ~lines
  84-90) sets `node.office_hours = { reason, since, recommendation }`; it is
  generated at runtime and never typechecked, and `writeNode` defaults the
  field. Leave as-is.

**Gate:** after Units 1-2, `npx tsc --noEmit -p packages/intentionsutil/tsconfig.json`
must report no *new* errors (see Verification for the one pre-existing
baseline error to ignore).

## Unit 3 — Ranking: soft session-type penalty in `officeHours.ts`

**Recommended model:** sonnet
**Dependencies:** Unit 1

In `packages/intentionsutil/src/officeHours.ts`:

- Import `SessionType` from `"./schema.js"` (already imports `IntentionNode`
  from there at `officeHours.ts:8`).
- Export the shared tunable constant near the top of the module:
  ```ts
  /** Soft rank multiplier for penalized session types; author-tunable. */
  export const SESSION_TYPE_PENALTY = 0.5;
  ```
  Both `requirement-discovery` and `curriculum-review` share this one
  constant so they rank at the same level relative to each other.
- Add `sessionType: SessionType;` to the `QueueMember` interface
  (`officeHours.ts:12-17`).
- In `officeHoursQueue` (`officeHours.ts:25-41`), for each parked node read
  `n.office_hours.session_type`, compute a penalized effective rank, and
  store BOTH the type and the penalized rank on the member:
  ```ts
  const st = n.office_hours.session_type;
  const penalty =
    st === "requirement-discovery" || st === "curriculum-review" ? SESSION_TYPE_PENALTY : 1;
  const rawRank = attention.get(n.id)?.value ?? 0;
  members.push({ nodeId: n.id, rank: rawRank * penalty, sessionType: st, since: n.office_hours.since });
  ```
  Keep `rank` as the effective (penalized) value: the existing sort at
  `officeHours.ts:38-40` (rank desc, id asc on ties) then orders by penalized
  rank, and `--list` naturally shows penalized rank. This makes the penalty
  **soft** — a sufficiently boosted penalized node still overtakes an `other`
  node; there is no hard tier floor.
- **Add an optional filter param** to support the CLI in Unit 4:
  `officeHoursQueue(nodes: IntentionNode[], sessionType?: SessionType)`. When
  `sessionType` is provided, skip parked nodes whose
  `session_type !== sessionType` (filter before/at the `members.push`).
  Thread the same optional param through `selectOfficeHours`
  (`officeHours.ts:84-99`): pass it to `officeHoursQueue` in the no-`target`
  (queue-head) branch only. The `target` branch (`officeHours.ts:88-94`)
  selects a specific node by id and ignores type (the CLI forbids combining a
  positional target with `--type`).

**Out of scope:** No change to `openBlockers`, `selectOfficeHours`'s target
branch semantics, or `src/index.ts` re-exports beyond what already re-exports
`officeHoursQueue`/`QueueMember` (`index.ts:14-15`); optionally re-export
`SESSION_TYPE_PENALTY` there if the pattern in that file re-exports sibling
consts (match the file's existing style; not required for the CLI, which
imports from `../src/officeHours.js` directly). No `node-merge.ts` change
(`office_hours` stays an opaque `SCALAR_FIELDS` unit at `node-merge.ts:64`).

## Unit 4 — CLI: `--type` filter and `--list` type column in `office-hours-select.ts`

**Recommended model:** sonnet
**Dependencies:** Unit 3

In `packages/intentionsutil/scripts/office-hours-select.ts` (`main()` at
lines 95-126):

- Parse a value-taking `--type <value>` flag using the established idiom
  (`args.indexOf("--type")` then `args[idx+1]`, as in `write-node.ts:47-53`
  (`--file`) / `dump-node.ts:80-85` (`--out-dir`)). Note that `positionals`
  is currently derived as `args.filter(a => !a.startsWith("--"))`
  (`office-hours-select.ts:98`) — that filter would capture the `--type`
  **value** as a spurious positional, so remove the consumed `--type` value
  from the positional set (e.g., compute positionals excluding both `--*`
  tokens and the token at `typeIdx+1`).
- Import `SESSION_TYPES` / `SessionType` from `"../src/schema.js"`. Validate
  the supplied value against `SESSION_TYPES`; on an unknown value write to
  stderr and `process.exit(2)`, matching the existing error+exit-2 style at
  `office-hours-select.ts:100-103` / `115-118`, e.g.
  `office-hours-select: unknown --type "<value>" (expected: requirement-discovery, curriculum-review, other)`.

**Exact CLI combination semantics** (mirror the existing `--list`-vs-positional
mutual-exclusion at `office-hours-select.ts:100-103`):

- `--type <v>` alone → queue-head mode filtered to type `<v>`: pass the
  filter into `selectOfficeHours(nodes, undefined, v)`; emits
  `launch <head-of-type> <cwd>`, or `empty` when no park of that type exists.
- `--type <v>` + `--list` → **valid**: list restricted to type `<v>` (pass
  `v` to `officeHoursQueue`).
- `--type <v>` + a positional `<node-id>` → **invalid**: a positional targets
  a specific node by id irrespective of type. Write
  `office-hours-select: --type is mutually exclusive with a node-id` to
  stderr and `process.exit(2)`.
- (`--list` + positional stays invalid, unchanged, at
  `office-hours-select.ts:100-103`.)
- Order the two mutual-exclusion checks so each bad combination yields
  exactly one clear message.
- **`--list` type column:** change the per-member line at
  `office-hours-select.ts:108-109` to include the session type, e.g.
  `process.stdout.write(\`${m.rank}\t${m.sessionType}\t${m.nodeId}\t${m.since}\n\`)`.
  The `rank` printed is already the penalized rank (Unit 3). Update the
  header/contract comment block (`office-hours-select.ts:10-19`) to document
  the new column and the `--type` flag.

**Out of scope:** the single-line stdout disposition contract for
`launch`/`empty`/`not-parked` (`formatDisposition`,
`office-hours-select.ts:73-91`) is unchanged — `--type` only narrows *which*
node is selected, not the output shape.

## Unit 5 — Verification tests

**Recommended model:** sonnet
**Dependencies:** Units 1, 3, 4

Add tests covering the three required guarantees. Mirror existing shapes
noted below.

- **Schema (`packages/intentionsutil/test/schema.test.ts`)** — mirror the
  `recommendation` blocks at `schema.test.ts:426-465` (inputs to
  `validateNode`, so untyped, no compile break):
  - accepts each of the three enum values on `office_hours.session_type`;
  - defaults an absent `session_type` to `"other"` (assert
    `result.office_hours?.session_type === "other"`);
  - rejects an unknown value (e.g. `session_type: "workshop"`) with
    `.toThrow()`. This is also the auto-check for "validate-graph rejects an
    unknown session_type value" — `validate-graph.ts` runs `validateNode` on
    every node, so the same validator throw is what rejects a bad value
    graph-wide.
- **Ranking (`packages/intentionsutil/test/office-hours.test.ts`)** — the
  existing `parked()` factory (`office-hours.test.ts:57-59`, now returning
  `session_type: "other"` per Unit 2) plus a new variant
  `parkedTyped(sessionType, recommendation = null)` (or an optional 2nd arg
  on `parked`) for penalized-type parks. Use the `boost(amount)` helper
  (`office-hours.test.ts:53-55`) for raw attention. Assert:
  - a `requirement-discovery` (or `curriculum-review`) park orders **below**
    an `other` park of equal raw attention (soft penalty applied);
  - a penalized park with enough boost **overtakes** an `other` park of
    lower boost (soft, not a hard floor);
  - `QueueMember.rank` equals `rawAttention * SESSION_TYPE_PENALTY` for a
    penalized type and equals raw attention for `other` (import
    `SESSION_TYPE_PENALTY` from the module rather than hardcoding `0.5`).
- **CLI (`packages/intentionsutil/test/office-hours.test.ts`, or wherever the
  existing selector-format tests live)** — assert `--list` output includes
  the session_type column and the penalized rank. If the current tests
  exercise `officeHoursQueue`/`formatDisposition` directly rather than
  spawning the CLI, add a case asserting the `sessionType` field is present
  and that `officeHoursQueue(nodes, "requirement-discovery")` returns only
  parks of that type; a full end-to-end `--list` string assertion is
  optional if no precedent for shelling out the script exists in the file.

**Out of scope:** no new test files if existing ones already cover the
surface (they do — extend `schema.test.ts` and `office-hours.test.ts`).

## Unit 6 — Backfill the 34 currently-parked nodes

**Recommended model:** sonnet
**Dependencies:** Unit 1

Label the 34 nodes whose `office_hours:` frontmatter is already non-null with
their natural type. `strategy-recover-attention` → `requirement-discovery`;
the 33 `tactic-reading-chunk-*` / `tactic-dialog-review-*` parks →
`curriculum-review`. Unlabeled parks elsewhere keep the `other` default, so
this is safe and idempotent.

**Mechanism — a scratch one-off, NOT committed** (repo convention avoids
committing throwaway scripts; `park-node` shows the read-mutate-write idiom
but is a permanent tool). Write the script to `$TMPDIR/backfill-session-type.mts`
and run it with `npx tsx` from the repo root (this needs
`dangerouslyDisableSandbox: true` — sandboxed `npx tsx` cannot create its IPC
pipe in this repo's environment). It reuses `readNode`/`writeNode`
(`src/store.ts:39-40, 101-104`), both of which call `validateNode` internally,
so each node is validated on read and on write with no extra plumbing —
exactly the round-trip `park-node` (~lines 84-90) relies on.

Script contents (fresh session may transcribe directly):

```ts
// $TMPDIR/backfill-session-type.mts — scratch, do not commit. Run from repo root:
//   npx tsx "$TMPDIR/backfill-session-type.mts"
const repoRoot = process.cwd();
const intentionsDir = `${repoRoot}/intentions`;
const { readNode, writeNode } = await import(`${repoRoot}/packages/intentionsutil/src/store.ts`);

const curriculum = [
  "tactic-reading-chunk-10-hirschman-exit-voice","tactic-reading-chunk-11-popper-fallibilism",
  "tactic-reading-chunk-12-macintyre-practice","tactic-reading-chunk-13-illich-conviviality",
  "tactic-reading-chunk-14-pettit-nondomination","tactic-reading-chunk-15-ostrom-commons-gift",
  "tactic-reading-chunk-16-buddhism-nonattachment","tactic-reading-chunk-17-confucian-household",
  "tactic-reading-chunk-18-dialectic-method","tactic-reading-chunk-19-augustine-interior-teacher",
  "tactic-reading-chunk-20-augustine-conversio","tactic-reading-chunk-21-augustine-divided-will",
  "tactic-reading-chunk-22-republic-sun-line","tactic-reading-chunk-23-protagoras-virtue-knowledge",
  "tactic-reading-chunk-24-phaedrus-writing","tactic-reading-chunk-25-constitutional-ai",
  "tactic-reading-chunk-26-aristotle-philia-friendship","tactic-reading-chunk-27-aristotle-philia-self-love",
  "tactic-reading-chunk-28-aristotle-schole-leisure","tactic-reading-chunk-29-plato-apology-examined-life",
  "tactic-reading-chunk-30-plato-paradigm-heaven","tactic-reading-chunk-31-kant-autonomy-heteronomy",
  "tactic-reading-chunk-32-bentham-felicific-calculus","tactic-reading-chunk-33-aristotle-energeia-kinesis",
  "tactic-reading-chunk-3-kant-humanity-servility","tactic-reading-chunk-4-sophrosyne-ordered-soul",
  "tactic-reading-chunk-6-precision-externals","tactic-reading-chunk-7-liberality-schole",
  "tactic-reading-chunk-8-stoicism-drills","tactic-reading-chunk-9-mill-justice",
  "tactic-dialog-review-aristotle-hexis","tactic-dialog-review-aristotle-phronesis",
  "tactic-dialog-review-plato-cave",
];
const plan: Array<[string, string]> = [
  ["strategy-recover-attention", "requirement-discovery"],
  ...curriculum.map((id) => [id, "curriculum-review"] as [string, string]),
];

for (const [id, sessionType] of plan) {
  const node = readNode(intentionsDir, id);
  if (node.office_hours === null) { console.error(`SKIP ${id}: not parked`); continue; }
  node.office_hours.session_type = sessionType as any;
  writeNode(intentionsDir, node);
  console.error(`SET ${id} -> ${sessionType}`);
}
```

After running, confirm all 34 printed `SET` (none `SKIP`), then delete the
scratch file. The write touches only the `session_type` subfield; `writeNode`
re-serializes validated frontmatter (the same whole-object round-trip
`park-node` uses). Because this round is the sole editor of these nodes, the
`node-merge.ts:64` whole-object `office_hours` merge granularity is not a
concern.

**Out of scope:** any node not in this list (defaults to `other`); no changes
to `park-node` or `graph-census-debt.ts` (new parks get `other` by default).

## Reuse

- `requireOneOf<T extends string>(value, allowed, field)` —
  `packages/intentionsutil/src/schema.ts:198` (closed-enum validator; see
  `owner` at `schema.ts:582`, `phase` at `schema.ts:611`).
- `Phase`/`PHASES` type+const convention — `schema.ts:36-53` (template for
  `SessionType`/`SESSION_TYPES`).
- `pace_exempt` "absent → concrete default" pattern — `schema.ts:620-621`
  (template for the `session_type` default; NOT the nullable `phase` shape).
- `validateOfficeHours` — `schema.ts:525-534` (the one edit site for the new
  field).
- `resolveAttention(nodes)` → `Map<string, ResolvedAttention>` —
  `packages/intentionsutil/src/attention.ts:285` (already used by
  `officeHoursQueue`).
- `officeHoursQueue` / `QueueMember` / `selectOfficeHours` —
  `packages/intentionsutil/src/officeHours.ts:12-41, 84-99` (penalty + filter
  site; sole consumers are `office-hours-select.ts` and `office-hours.test.ts`).
- Value-taking-flag parse idiom — `packages/intentionsutil/scripts/write-node.ts:47-53`
  (`--file`), `dump-node.ts:80-85` (`--out-dir`). Boolean-flag +
  mutual-exclusion + exit-2 style — `office-hours-select.ts:97-103`.
- `readNode`/`writeNode` (both call `validateNode`) —
  `packages/intentionsutil/src/store.ts:39-40, 101-104`. Read-mutate-write
  precedent — `scripts/park-node` ~lines 84-90.
- Test fixtures to mirror: `recommendation` validate/default/reject blocks —
  `test/schema.test.ts:426-465`; `parked()` factory + `boost()` helper —
  `test/office-hours.test.ts:53-59`; `parked()` factory —
  `test/coverage.test.ts:6-8`.

## Verification

Run from the repo root (worktree root).

```verify
npx vitest run --project packages/intentionsutil --root .
```

```verify
npx tsc --noEmit -p packages/intentionsutil/tsconfig.json
```
Expect the output to contain **only** the pre-existing baseline error
`packages/intentionsutil/test/graph-census-debt.test.ts(108,20): error TS2339: Property 'phase' does not exist …`
(present on `origin/main`, unrelated to this change — confirmed present at
plan time). Any *additional* error means an `OfficeHours` literal was missed
in Unit 2.

```verify
npx tsx packages/intentionsutil/scripts/validate-graph.ts
```
Must pass after Unit 6's backfill (every node, including the 34 relabeled
ones, validates; an unknown `session_type` would throw here — that rejection
path is unit-tested in Unit 5).

Manual / judgment checks:
- After Unit 6, spot-check two or three relabeled nodes' frontmatter (e.g.
  `intentions/strategy-recover-attention.md` shows
  `session_type: requirement-discovery`; a `tactic-reading-chunk-*.md` shows
  `curriculum-review`) and confirm nothing else in those frontmatter blocks
  changed. Confirm the script printed 34 `SET` lines and zero `SKIP`, then
  remove the scratch file from `$TMPDIR`.
- Eyeball `npx tsx packages/intentionsutil/scripts/office-hours-select.ts --list`
  output: each row now carries `rank<TAB>session_type<TAB>node-id<TAB>since`,
  with `curriculum-review`/`requirement-discovery` rows showing the halved
  (penalized) rank. Sanity-check `--type curriculum-review --list` lists only
  curriculum parks, and `--type other --list` excludes them.
