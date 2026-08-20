---
id: tactic-node-merge-list-removal-loss
kind: tactic
statement: "graph-commit's layer-2 field-level merge cannot express a REMOVAL:
  the base-free list union silently restores a deleted
  blocked_by/serves/validates entry (and an attributes-key deletion) under
  concurrent-edit contention, and reports the land as a clean auto-resolve"
owner: ai
status: codified
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
  session picking unilaterally. Planned 2026-07-30 by the dispatch-pipeline
  bootstrap through a parallel Workflow fan-out rather than an /align-tactics
  round, so that skill's two-sided drift review and its census were bypassed
  (deliberate: ten concurrent align rounds would mean ten concurrent
  graph-commits, the exact hazard the bootstrap exists to avoid). Each plan was
  authored against the node's own cited code and then independently verified by
  a second agent; all reported citation and substance gaps were applied before
  landing. A later /align-tactics round should treat this body as unreviewed by
  the normal path."
reading: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention:
  boost: 0.05
  override: null
  rationale: >-
    Bootstrap re-scale 2026-07-30: Wave A of a three-band interim scale (50 / 20
    / 10) that puts write-path integrity work above ordinary feature work. This
    band holds the silent graph-write-corruption defects plus the two paths the
    bootstrap arms or depends on. Interim scaffolding only -
    tactic-attention-tier-ranking replaces the whole numeric scheme with
    lexicographic (tier, rank) and max-lifting, and
    tactic-attention-boost-scripts converts these boosts to tier/bug_fix marks.


    NAMESPACING STOPGAP 2026-08-11: magnitude compressed from 50 to 0.05 so this
    boost can no longer lift the node out of its parent strategy's band. The
    bound - a tactic boost is namespaced to its strategy's rank and must never
    cause the tactic to outrank a tactic of a higher-ranked strategy - is
    recorded doctrine on strategy-recursive-self-improvement but is NOT yet
    enforced by the resolver; tactic-attention-namespaced-rank makes it
    structural. Until then the flat additive sum defeats it, so the magnitudes
    are compressed by hand onto a 0.01-per-level ladder that preserves the
    original ordering WITHIN the band. Original magnitude preserved at
    attributes.pre_namespacing_boost for restoration.
  tier: 1
phase: implement
execution: null
validates: []
blocked_by: []
office_hours:
  reason: provision-node-worktree failed for this tactic (exit 2)
  since: 2026-07-31
  recommendation: Inspect the provisioning failure (git fetch/worktree add,
    direnv) in the tick journal, fix the environment, and re-run the phase.
  session_type: other
pace_exempt: false
rounds: null
attributes:
  pre_namespacing_boost: 50
---
# graph-commit's layer-2 field merge cannot express a removal — deleted list entries and attributes keys are silently restored, and the land reports success

## Context

`graph-commit` (`packages/intentionsutil/scripts/graph-commit`) is the single
write primitive that lands intention-node edits on `main`. When two writers
touch the same node concurrently, it runs a five-rung resolution ladder. Rungs 2
and 3 both route through the same pure primitive:

- **Layer 2** — a textual `git pull --rebase` conflict is handed to
  `try_layer2_resolve()` (`packages/intentionsutil/scripts/graph-commit:654-712`),
  which calls `run_merge_node()` (`:441-466`) per conflicted node.
- **Layer 3** — a stale `--base` compare-and-swap is handed to
  `check_base_freshness()` (`:277-327`), which calls the same `run_merge_node()`
  at `:311`.

`run_merge_node()` shells out to `packages/intentionsutil/scripts/merge-node.ts`,
whose only job is fs/argv I/O around the pure function `mergeIntentionNodes` in
`packages/intentionsutil/src/node-merge.ts` (`merge-node.ts:83`).

### The defect

`mergeIntentionNodes` merges the six list fields with a **base-free union**:

- `LIST_FIELDS` is declared at `packages/intentionsutil/src/node-merge.ts:35-42`
  and holds `serves`, `recovers`, `clarifications`, `tooling_goals`,
  `validates`, `blocked_by`.
- The list branch is `packages/intentionsutil/src/node-merge.ts:161-166`:
  `mergedRec[field] = unionList(theirsList, oursList)`.
- `unionList` is at `packages/intentionsutil/src/node-merge.ts:104-112`; its
  doc comment (`:102-103`) states "Deterministic; base-free."

Because the union never consults `base`, "this entry is in `theirs` and absent
from `ours` because *ours deleted it*" is indistinguishable from "this entry is
in `theirs` because *theirs just added it*". The union keeps it either way. A
deletion has no representation at all, so **a removal is deterministically
reverted** whenever the merge path runs. No `FieldConflict` is ever pushed for a
list field, so `conflicts` comes back empty and the caller sees a clean resolve.

The `attributes` map has the same shape at
`packages/intentionsutil/src/node-merge.ts:181-218`. A key present on exactly
one side is unconditionally treated as an addition and kept
(`:194-197` ours-only, `:198-201` theirs-only), so deleting an attributes key is
reverted too. `attributes.conditions` gets the same base-free `unionList` at
`:203-206`.

### The observable bad outcome

Because the merge reports zero conflicts, `run_merge_node()` sets
`RESOLVED_VIA_MERGE=1` (`graph-commit:459`; the global is declared at
`graph-commit:189`) and `graph-commit` prints its **success** line with the
`(layer 2/3 auto-resolved a concurrent-edit divergence)` suffix
(`graph-commit:1484-1488`), exit 0. The writer is told the edit landed. Part of
it did not.

Observed in production 2026-07-25 on `tactic-align-tactics-workflow` during an
office-hours drain: one write that set `office_hours: null` **and** removed one
satisfied `blocked_by` edge landed with the null applied and the edge silently
restored, exit 0, "auto-resolved". The drain session only caught it because it
independently re-read `origin/main` on its own verification step; it then had to
rebuild the node and land a second commit.

`--base` compare-and-swap does **not** mitigate this. Layer 3's whole purpose is
that a stale `--base` stops being fatal — the tool re-reads fresh `origin/main`
and re-applies the writer's edit through this same merge
(`graph-commit:311`). Passing `--base` therefore converts a hard stale-base
refusal into a silent restoration. CAS makes the failure *less* likely to be
noticed, not more.

### Intended outcome

`mergeIntentionNodes` becomes base-aware for lists and for attributes-key
presence, so a genuine removal is honored and a genuine addition is still kept.
A drain that removes a satisfied `blocked_by` edge under contention lands the
removal, and `graph-commit`'s "auto-resolved" success line becomes truthful.

### What is deliberately NOT in scope

- **The doctrine sentence.** `intentions/strategy-graph-native-dispatch.md:3703-3704`
  describes layer 2 as "a structure-aware field-level merge (frontmatter list
  **appends** union, distinct-field edits combine)". The word "appends" is the
  root framing error. Amending a strategy node's body is a graph write that
  lands directly on `main` via `graph-commit`, not through a PR branch, so it
  must not be edited from an implementation worktree. Raise it in the next
  `/align-strategy` round on that node instead.
- **`graph-commit` itself.** No shell changes are needed: it already passes
  `base` to `merge-node.ts` on both the layer-2 (`graph-commit:688`, stage `:1:`)
  and layer-3 (`graph-commit:300-304`) paths. The fix is entirely inside the
  pure primitive.
- **The `test-graph-commit.sh` end-to-end harness.** See "Verification" for why
  a case there would test the harness's own shim rather than this fix.

### Citation drift in the node's own rationale

Several `path:line` citations in this node's prose have drifted. The correct
current anchors are the ones listed above. Specifically: `LIST_FIELDS` is at
`:35-42` (cited as `:36-43`); the list branch is at `:161-166` (cited as
`:162-167`); `RESOLVED_VIA_MERGE=1` is at `graph-commit:459` (cited as
`graph-commit:160-161`, which is now the scratch-branch globals); the doctrine
sentence is at `intentions/strategy-graph-native-dispatch.md:3703-3704` (cited
as `:2051-2052`). One more the first pass missed: the body cites
`graph-commit:238` for "that re-apply runs through the same `merge-node.ts`",
but `:238` is inside `--base` argv-pair parsing (`BASE["$id"]="$sha"`) and has
nothing to do with invoking `run_merge_node` — the correct anchor is
`graph-commit:311`, where `check_base_freshness` calls it. The
`merge-node.ts:74-78` delete-vs-edit guard citation and the `graph-commit:57-60`
exit-status doc citation are still accurate. Treat this list as corrected but
**not proven exhaustive**: re-verify every `path:line` you actually rely on
before editing at it.

### Design decision — settled here

The node body left two candidate shapes open. **Take shape 1: make the merge
three-way.** Shape 2 ("refuse rather than guess" — emit a mechanical-unresolved
conflict on any detected removal) is rejected: it turns the single most common
mechanical graph operation, satisfied-`blocked_by` cleanup during a drain, into
an office-hours park, pushing in exactly the direction
`tactic-mechanical-park-producers` is trying to reduce. Shape 1 is also the
design one would choose greenfield — it is what git itself does for a three-way
merge — so there is no migration-cost tradeoff to weigh.

Shape 1's precise semantics are specified in Unit 1. It is backwards-compatible:
all four existing list/attributes tests in
`packages/intentionsutil/test/node-merge.test.ts` produce identical output under
it (traced by hand against cases `(a)` `:40-48`, `(b)` `:50-57`, `(c)` `:59-67`).
Nothing existing is weakened or removed.

## Unit 1 — base-aware three-way list and attributes-key merge

**Recommended model**: `opus`

Judgment-heavy: the unit changes concurrency-resolution semantics in a
write-path primitive whose failure mode is silent data loss, and it has to pick
the right behavior for several under-specified corner cases (base absent, object
list entries with no stable identity, delete-vs-modify on an attributes key).

### Scope

All changes in `packages/intentionsutil/src/node-merge.ts` and
`packages/intentionsutil/test/node-merge.test.ts`.

**1. Replace the base-free list union** at
`packages/intentionsutil/src/node-merge.ts:161-166` with a base-aware
three-way list merge. Keep `unionList`
(`packages/intentionsutil/src/node-merge.ts:104-112`) as the `base === null`
fallback — do not delete it — and add a new function alongside it (suggested
name `threeWayList(baseList, oursList, theirsList)`).

The rule, per candidate entry `e`, using the existing structural `eq`
(`packages/intentionsutil/src/node-merge.ts:77-100`) for membership tests:

| in `base` | in `ours` | in `theirs` | outcome |
|---|---|---|---|
| any | yes | yes | keep |
| yes | yes | no  | theirs removed it → **drop** |
| no  | yes | no  | ours added it → keep |
| yes | no  | yes | ours removed it → **drop** |
| no  | no  | yes | theirs added it → keep |
| yes | no  | no  | both removed it → drop (already the case today) |

Output ordering must match today's `unionList` contract so the existing tests
keep passing: iterate `theirs` in order first, then `ours`' entries not already
emitted, deduping by `eq`, and filter out the dropped entries.

When `base === null` there is no way to tell a removal from an addition — fall
back to `unionList(theirsList, oursList)` unchanged. This is not a defensive
fallback masking an error; it is the genuinely correct behavior for an add/add
merge with no common ancestor. `merge-node.ts:80-81` deliberately synthesizes
exactly this case (`theirs` absent + no base → `effectiveBase = null`).

List fields must **not** produce a `FieldConflict`. Entries in `serves`,
`recovers`, `validates`, and `blocked_by` are plain id strings
(`packages/intentionsutil/src/schema.ts:153-154,167-168`), so a per-entry
"modify" is not representable — an edit is a remove plus an add.
`clarifications` and `tooling_goals` hold objects
(`packages/intentionsutil/src/schema.ts:94-103,158-159`) with no stable identity
key, so the same holds. Document this residual in the function's doc comment:
if both sides edit the *same* object entry differently, the base version is
dropped (both sides removed it) and *both* new variants are kept as additions —
a visible duplicate a reader can fix, not a silent restoration.

**2. Make the `attributes` key-presence branches base-aware** at
`packages/intentionsutil/src/node-merge.ts:194-201`. `allKeys` (`:187-190`) is
already built from ours + theirs only, so keys deleted by both sides are already
correctly absent; only the one-sided branches change:

- `inOurs && !inTheirs`:
  - not in `baseAttrs` → ours added it → keep (today's behavior).
  - in `baseAttrs`, and `eq(baseAttrs[key], oursAttrs[key])` → theirs deleted a
    key ours left untouched → **omit the key**.
  - in `baseAttrs`, and ours *modified* the value → delete-vs-modify → push a
    `FieldConflict` for `attributes.<key>` and keep ours' value in `merged` so
    the node stays landable.
- `inTheirs && !inOurs`: the mirror image — ours deleted it; omit when theirs
  left it untouched, conflict when theirs modified it, keep when it is not in
  base.
- When `base === null` (`hasBase` is false), keep today's pure-addition behavior
  for both branches.

`FieldConflict` (`packages/intentionsutil/src/node-merge.ts:14-19`) types `ours`
and `theirs` as `unknown`; set the deleted side to `undefined`. Note the
downstream rendering caveat in a code comment: `merge-node.ts` JSON-stringifies
the conflict list, `graph-commit`'s `run_merge_node()` reshapes it with
`jq -c '[.conflicts[] | {id: $id, field, ours, theirs}]'`
(`graph-commit:464`), and `build_recommendation()` (`graph-commit:1029-1042`)
renders the missing side as the literal `null`. That is ambiguous with a
genuine null value but is not a correctness problem — the outcome is a park with
both values named, which is the safe direction. Do not expand `FieldConflict`'s
shape to disambiguate; that would require a matching `graph-commit` jq change
and is out of scope.

**3. Give `attributes.conditions` the same treatment.** The special case at
`packages/intentionsutil/src/node-merge.ts:203-206` calls the base-free
`unionList`; route it through the new three-way list function, passing
`baseAttrs["conditions"]` when it is present and an array, and falling back to
`unionList` otherwise.

**4. Update the now-false doc comments.** Every place in the file that asserts
base-freedom or pure-addition must be corrected:
`packages/intentionsutil/src/node-merge.ts:30-34` (the `LIST_FIELDS` doc block,
"no base needed"), `:102-103` (`unionList`'s "base-free"), `:136-145`
(`mergeIntentionNodes`'s doc block, "union-dedup theirs+ours, base-free" and "A
key present on only one side is a pure addition (kept, never a conflict)"), and
the inline comments at `:161`, `:195`, and `:199`.

**5. Add unit tests** to `packages/intentionsutil/test/node-merge.test.ts`.
Reuse the existing `node()` / `pair()` fixture helpers at `:6-37`. Required
cases:

- base `blocked_by: ["x","y"]`, ours `["y"]`, theirs `["x","y"]` (unchanged) →
  merged `blocked_by` is `["y"]`, `conflicts` empty. This is the production
  incident.
- base `blocked_by: ["x"]`, ours `[]`, theirs `["x"]` but with an unrelated
  scalar edited (e.g. `rationale`) → merged `blocked_by` is `[]` **and** the
  scalar edit survives, `conflicts` empty. This is the combined
  set-null-plus-remove write from the incident.
- theirs removes an entry ours kept → also dropped (the mirror direction).
- base `serves: ["strategy-a"]`, ours `["strategy-a","strategy-b"]`, theirs
  `["strategy-a","strategy-c"]` → still `["strategy-a","strategy-c","strategy-b"]`
  (additions on both sides still union; this duplicates existing case `(a)` at
  `:40-48` deliberately as a non-regression assertion — keep case `(a)` too).
- `base === null` with disjoint list entries on each side → union behavior
  preserved, nothing dropped.
- attributes: base `{k: 1}`, ours `{}`, theirs `{k: 1}` → `k` absent from
  `merged.attributes`, `conflicts` empty.
- attributes delete-vs-modify: base `{k: 1}`, ours `{}`, theirs `{k: 2}` →
  exactly one conflict whose `field` is `"attributes.k"`, and `merged` stays
  landable.
- `attributes.conditions`: base `["c1","c2"]`, ours `["c2"]`, theirs
  `["c1","c2"]` → merged is `["c2"]`.

Do not modify or delete any existing test in the file.

### Reuse

- `eq` — `packages/intentionsutil/src/node-merge.ts:77-100`. Structural,
  order-independent for object keys, order-dependent for arrays. Use it for
  every membership test; do not introduce `JSON.stringify` comparison (the
  comment at `:69-76` explains why).
- `unionList` — `packages/intentionsutil/src/node-merge.ts:104-112`. Keep it as
  the `base === null` path for both lists and `attributes.conditions`.
- `scalarMerge` — `packages/intentionsutil/src/node-merge.ts:120-134`. The
  existing three-way scalar rule and its `FieldConflict` construction; mirror
  its conflict shape for the new attributes delete-vs-modify conflict.
- `node()` / `pair()` fixtures — `packages/intentionsutil/test/node-merge.test.ts:6-37`.
- No new file is needed. `mergeIntentionNodes` has exactly one caller in the
  repo, `packages/intentionsutil/scripts/merge-node.ts:83`, so the blast radius
  is contained.

## Unit 2 — direct-import coverage for the merge-node CLI round-trip

**Recommended model**: `sonnet`

Mechanical: a small export refactor following an established house pattern, plus
test cases with explicit expected values.

### Dependencies

Unit 1 must land first — this unit asserts Unit 1's semantics survive the
fs/YAML round-trip.

### Scope

`packages/intentionsutil/scripts/merge-node.ts` today has **zero test
coverage**; its only exercise is through `graph-commit`, which in the
`test-graph-commit.sh` harness runs against a bash shim, not the real script.
The untested question this unit answers: does an emptied list survive
`validateNode` + `stringify` on the way to `--out`
(`packages/intentionsutil/scripts/merge-node.ts:89-90`)?

1. Extract the body of `main()`
   (`packages/intentionsutil/scripts/merge-node.ts:44-98`) into an exported
   function — suggested signature
   `mergeNodeFiles(basePath: string, oursPath: string, theirsPath: string, outPath: string): { resolved: boolean; conflicts: FieldConflict[] }`
   — that performs the reads, the merge, and the `--out` write, and **returns**
   the result instead of calling `process.stdout.write` / `process.exit`.
   `main()` keeps ownership of argv parsing (`requireFlag`, `:36-42`), of
   printing the single JSON stdout line, and of the exit code, so the documented
   output contract at `packages/intentionsutil/scripts/merge-node.ts:11-16` is
   unchanged. The empty-`--theirs` + non-empty-`--base` delete-vs-edit guard at
   `:74-78` moves into the extracted function as an early return of
   `{ resolved: false, conflicts: [{ field: "<node>", ... }] }`.

   This mirrors the existing house pattern: `packages/intentionsutil/scripts/dump-node.ts`
   exports `dumpNodes` and `packages/intentionsutil/scripts/write-node.ts`
   exports `writeNodeFromJson` (`:33-38`), and both are imported directly by
   their tests rather than spawned.

2. Add `packages/intentionsutil/test/merge-node-cli.test.ts`. Build fixture node
   files in a `mkdtempSync` tempdir using `writeNodeFromJson` from
   `packages/intentionsutil/scripts/write-node.js` so the fixtures are real
   validated frontmatter, then call `mergeNodeFiles` on them. Assert at minimum:

   - base `blocked_by: ["x","y"]` / ours `["y"]` / theirs `["x","y"]` →
     `resolved` is true, and re-reading `--out` (parse its frontmatter) shows
     `blocked_by: ["y"]`. This proves the removal survives
     `validateNode` + `stringify`.
   - an attributes-key deletion likewise absent from the written `--out` file.
   - a `resolved: false` outcome does **not** write `--out` (the contract at
     `packages/intentionsutil/scripts/merge-node.ts:95-97`).

   Follow `packages/intentionsutil/test/dump-node.test.ts:14-35` for the
   tempdir-fixture shape. Do not spawn `npx tsx` — no test in
   `packages/intentionsutil/test/` currently spawns a node process, and doing so
   would be slow and novel.

**Out of scope**: changing `merge-node.ts`'s stdout JSON shape, its exit codes,
or `graph-commit`'s parsing of them.

### Reuse

- `writeNodeFromJson` — `packages/intentionsutil/scripts/write-node.ts:33-38`,
  for building valid fixture node files.
- `extractFrontmatter` / `extractBody` — `packages/intentionsutil/src/frontmatter.ts`,
  already imported by `packages/intentionsutil/scripts/merge-node.ts:21`, for
  reading `--out` back.
- `mkdtempSync` tempdir fixture pattern — `packages/intentionsutil/test/dump-node.test.ts:14-35`.

## Verification

Baselines: **measure them yourself before changing anything**, then diff only
your own new tests against that measurement. Do not treat a number quoted here
as ground truth — the suite grows. At the time of writing the
`packages/intentionsutil` project reported 711 vitest tests across 38 files and
`test-graph-commit.sh` reported 43 passing cases, but an earlier draft of this
plan said 705/37 and was already stale when it was written.

```verify
npx vitest run --project packages/intentionsutil --root .
```

```verify
packages/intentionsutil/scripts/test-graph-commit.sh
```

```verify
.claude/skills/dispatch-propagate/scripts/run-lint.sh
```

The `test-graph-commit.sh` run is a **regression baseline only** — it must stay
at 43 passing with no edits to the harness. Do not add a list-removal case to
it, and do not extend its `npx` shim. That shim
(`packages/intentionsutil/scripts/test-graph-commit.sh:289-432`) deliberately
does not reimplement the real merge; its own comment at `:293-303` says so, and
it merges bare `key: value` lines with no concept of a list. Teaching it list
semantics would mean writing a second implementation of the very rule under test
and then asserting the two agree — it would prove nothing about
`node-merge.ts`. Unit 2 covers the real fs round-trip instead.

`npx tsx packages/intentionsutil/scripts/validate-graph.ts` is not needed: this
change touches no file under `intentions/`. (Note for anyone who runs it anyway:
`tsx` fails under the Bash sandbox with an EPERM on its
`/tmp/claude-*/tsx-*/N.pipe` socket and needs `dangerouslyDisableSandbox: true`.)

### Manual and judgment checks

- **Confirm no new parks in the drain lane.** Read the final
  `threeWayList` implementation and confirm it pushes no `FieldConflict` for any
  list field under any input. The whole reason shape 1 was chosen over shape 2
  is that a satisfied-`blocked_by` cleanup meeting a concurrent land must
  auto-resolve, not park. If the implementation ended up emitting a list
  conflict anywhere, that is a design regression, not an acceptable detail.
- **Confirm the success message is now honest.** With the fix, a removal that
  meets a concurrent edit *is* honored, so `graph-commit`'s
  `(layer 2/3 auto-resolved a concurrent-edit divergence)` suffix
  (`graph-commit:1484-1488`) is truthful and must stay. The node's original
  verification bullet asking that the suffix be suppressed applies only to the
  rejected shape 2 — ignore it.
- **Observe in production.** The interim operational rule stays in force until
  a real contended removal has been seen to land: after any graph write that
  removes a list entry or attributes key, re-read
  `git show origin/main:intentions/<id>.md` and assert the removal actually
  landed. Retire that rule only after observing a contended removal land
  correctly on `main`.

## Dependencies

None hard.

Sequencing note: `tactic-graph-commit-delete-vs-edit-park-hardening` (currently
`status: codified`, `phase: qa`, PR #2936) touches the node-level delete-vs-edit
guard at `packages/intentionsutil/scripts/merge-node.ts:74-78` — the same file
Unit 2 refactors. Landing this node after that one avoids conflicting edits to
that region. It is a different code path (a concurrent writer deleting the whole
node file, versus field-level removal inside a surviving node) and does not
change Unit 1's design.

References:
- #2931: https://github.com/natb1/commons.systems/pull/2931
- #2936: https://github.com/natb1/commons.systems/pull/2936
