---
id: tactic-graph-digest-quality-followups
kind: tactic
statement: "graph-digest.ts quality follow-ups deferred from the
  tactic-graph-digest-tooling review (PR #2865), finalized as five PR-sized
  units: validate DigestInput bodies/rawTexts 1:1 with nodes and drop the silent
  fallbacks, factor the repeated table header/rows/truncation shape, give the
  cycle-safe reachability discipline one home shared by computeSignalPath and
  CLOSURE, bound NEAR-DUP with a stop-word filter plus an exact inverted-token
  index, and derive STORED-DEFAULTS from the schema's own per-field defaults"
owner: ai
status: codified
parent: null
rationale: "Deferred residue from the /review-fix review of
  tactic-graph-digest-tooling (PR #2865; in-PR review fixes landed at commit
  3dbaf24f). These are non-blocking quality improvements to
  packages/intentionsutil/src/digest.ts scoped out of the review's applied
  fixes, which covered the correctness plus the cheap
  reuse/efficiency/conventions items. Recorded as a draft by /review-fix on
  2026-07-12 and finalized by /align-tactics on 2026-08-20 against origin/main
  a0bfd20d, where every one of the six findings was re-confirmed live — only two
  commits have ever touched the file, 4f12acac (which introduced it) and
  5ccfeb59 (PR #2899, which extracted the DANGLING-REFS matchers into
  id-refs.ts), and neither addressed any finding. The draft's scale claim is
  superseded: it said the graph was ~371 nodes so none of these bite, but the
  store measures 740 nodes today and NEAR-DUP's pairwise loop performs 273,430
  Jaccard evaluations per digest run. That is still not a user-visible problem,
  so the work remains efficiency/maintainability hardening rather than a defect
  fix — but the digest is the reading surface the recurring /align-audit cycle
  depends on, so bounding its cost is what keeps the serving strategy's
  token-bounded condition true as the graph grows. Findings 1 and 3 were merged
  into one unit because measurement showed the inverted index alone recovers
  only ~11%; the stop-word filter is what makes it bite."
reading: null
serves:
  - strategy-graph-integrity
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

## Context

`packages/intentionsutil/src/digest.ts` is the read-only, token-bounded
whole-graph digest that `/align-audit` reads first (Section 1 per-node lines,
Section 2 derived check tables). It landed in PR #2865
(`tactic-graph-digest-tooling`, commit `4f12acac`). The `/review-fix` review of
that PR applied the correctness plus cheap reuse/efficiency/conventions fixes
in-PR (commit `3dbaf24f`) and deferred six non-blocking quality findings. This
node is that residue, now decomposed.

**Re-validated against merged code (2026-08-20, HEAD of `main`).** Only two
commits have ever touched `digest.ts` — `4f12acac` (introduced it) and
`5ccfeb59` (PR #2899, which only extracted the DANGLING-REFS matchers into
`packages/intentionsutil/src/id-refs.ts`). All six findings are still live and
unaddressed. Line anchors below are against the current 430-line file.

**Scale correction.** The node's original rationale said "~371 nodes, so none of
these bite at current scale". Measured today the store holds **740 nodes** —
`tableNearDup`'s double loop performs **273,430** Jaccard evaluations per digest
run, and the digest is invoked once per `/align-audit` cycle plus ad-hoc. The
work is still not a user-visible problem, but the "doesn't bite" framing is
already understated and the growth is the reason the strategy's
token-bounded/affordable condition is at stake.

**Three measured facts that shape the plan** (probes run against the live store
at HEAD; reproduce with the commands in `## Verification`):

1. An inverted token index *alone* barely helps — it cuts candidate pairs only
   ~11% (244,181 of 273,430), because function words (`the` df=614, `and` df=452,
   `a` df=385) connect nearly every statement to every other. **Finding 1 only
   works once finding 3 lands**, so they are planned as one unit: with
   stop-words + a minimum token length of 2, candidates fall to 87,995, and an
   exact length filter takes actual comparisons to **49,272** (an 82% cut) with
   zero loss of results.
2. The stop-word filter is **purely subtractive** on the live store: near-dup
   pairs go 69 → 43 and **no new pair appears**. The 26 that drop are all
   0.60–0.67 template-scaffolding matches inside the `tactic-hold-*` and
   `tactic-flake-*` families — precisely the "unrelated statements sharing only
   scaffolding" the finding predicted, and precisely the parallel-family pattern
   the audit already documents as benign.
3. `gap` is a top-level frontmatter key on **452** node files that is **not** an
   `IntentionNode` schema field at all (it is derived — `deriveGap` in
   `packages/intentionsutil/src/sensors.ts:241`, called from `goals.ts:173`). Today's structural
   `isDefaultValue` heuristic counts `gap: null` as a "schema default". Tying
   STORED-DEFAULTS to real schema defaults moves 9929 → **9488** counted keys
   and surfaces a new, strictly better parsimony signal: 452 stored keys that
   the schema does not define at all.

Intended outcome: the digest's cost stops scaling as raw n², its two silent
fallbacks become clear errors per `.claude/rules/code-style.md`, its
"schema default" claim becomes literally true, and the five hand-rolled table
tails become one helper — without changing any table's wording, since the tests
assert output strings.

**Explicitly not in scope.** Three items from the same review were judged
informational/by-design and were deliberately NOT deferred: the wildcard
self-count, the fully-pruned-wildcard `(0 members)` rendering, and the
backtick-span-with-prose extraction case. Do not "fix" them here. The
DANGLING-REFS table's multi-section shape (`digest.ts:296-354`) is also out of
scope for the shared renderer — the finding names five tables, and DANGLING-REFS
is not one of them.

---

## Unit 1 — Validate `DigestInput` at the render boundary; remove the silent fallbacks

**Scope.**

`packages/intentionsutil/src/digest.ts`:

- Add a module-private `assertDigestInput(input: DigestInput): void` immediately
  after the `DigestInput` interface (`digest.ts:39-44`). It throws
  `IntentionSchemaError` (already imported at `digest.ts:20`, already used by
  `tableValidate` at `digest.ts:123-133`) on any of:
  - a duplicate id in `input.nodes`;
  - a node id absent from `input.bodies`;
  - a node id absent from `input.rawTexts`;
  - a key in `bodies` or `rawTexts` that is not a node id.
  Each message names the offending ids (sorted, at most the first 10 plus an
  `... and N more` tail) so the error is deterministic and actionable — a
  missing-bodies error reads "DigestInput.bodies is missing 3 node id(s):"
  followed by the sorted ids. Do NOT write example node ids into this node body
  inside a code span: the graph prose-reference validator reads any
  backtick-quoted id-shaped token as a real node reference and fails the write.
  The invariant it enforces is the one the interface docstring already documents
  at `digest.ts:25-38`.
- Call it at the top of both exported entry points: `renderPerNode`
  (`digest.ts:110`) and `renderTables` (`digest.ts:412`). `renderDigest`
  (`digest.ts:428-430`) calls both, so it inherits the check — do not add a
  third call. The check is O(n) and idempotent; running it twice per
  `renderDigest` is fine and is cheaper than restructuring the exports.
- Replace `input.bodies.get(n.id) ?? ""` at `digest.ts:112` and
  `input.bodies.get(node.id) ?? ""` at `digest.ts:307` with a
  non-fallback read (a small `requireBody(input, id)` helper, or a
  non-null read justified by the boundary assert with a comment naming
  `assertDigestInput` as the guarantor — do NOT use a `!` non-null assertion,
  which `.github/scripts/check-type-safety-escapes.sh` flags per
  `.claude/rules/type-safety-suppression-marker.md`).
- Delete the `if (raw === undefined) continue;` skip at `digest.ts:386` in
  `tableStoredDefaults` for the same reason. Keep the `parsed === null ||
  typeof parsed !== "object"` guard at `digest.ts:390` — that one is about YAML
  content, not about a missing key.

`packages/intentionsutil/scripts/graph-digest.ts`:

- In `gatherInput` (`graph-digest.ts:40-52`), call `assertPathSafeId(node.id)`
  explicitly before the `join(intentionsDir, \`${node.id}.md\`)` at
  `graph-digest.ts:47`. `assertPathSafeId` is already exported from
  `packages/intentionsutil/src/store.ts:39-50` for exactly this
  "every consumer that turns an id into a path component" case. Today the second
  `readFileSync` is safe only by evaluation order (`listNodes` threw first);
  make the guarantee local and explicit rather than positional.

Tests — `packages/intentionsutil/test/digest.test.ts`:

- Do NOT change the `input()` helper at `test/digest.test.ts:44-56`; it builds a
  1:1 `DigestInput` and must keep passing unchanged. Add a new
  `describe("DigestInput validation")` block that hand-builds deliberately
  mismatched inputs (missing `bodies` key, missing `rawTexts` key, an extra map
  key, a duplicate node id) and asserts each throws `IntentionSchemaError` with
  a message naming the offending id, for both `renderPerNode` and
  `renderTables`.

Out of scope: any change to `listNodes`/`listNodesResilient` behavior, any
change to `DigestInput`'s shape, and any new export from
`packages/intentionsutil/src/index.ts` (`assertDigestInput` stays module-private
— knip flags unused exports).

**Recommended model:** sonnet

---

## Unit 2 — Factor the repeated table header/rows/truncation shape into one helper

**Scope.**

`packages/intentionsutil/src/digest.ts` only. Add one module-private helper in
the "Section 2 tables" region beside `sortedIds` (`digest.ts:118-120`), and
adopt it in five tables. Keep it inline in `digest.ts` rather than a new module:
it is ~15 lines with exactly one consumer, and a separate module would trade one
duplication for one indirection.

```ts
/**
 * `[LABEL] <header>` plus two-space-indented rows, optionally capped with a
 * `... and N <moreNoun>` trailer. Rows arrive WITHOUT their indent and already
 * id-escaped by `renderId` — the helper never re-escapes (double-escaping
 * regression) and never re-sorts (each caller owns its sort order).
 * `header` is a function of (shown, total) because STORED-DEFAULTS' header
 * reports the shown count.
 */
function renderCappedTable(
  label: string,
  rows: readonly string[],
  header: (shown: number, total: number) => string,
  opts: { cap?: number; moreNoun?: string } = {},
): string
```

Behavior: `shown = opts.cap === undefined ? rows : rows.slice(0, opts.cap)`;
`lines = shown.map((r) => \`  ${r}\`)`; when `rows.length > shown.length` push
`  ... and ${rows.length - shown.length} ${opts.moreNoun}`; return
`[${label}] ${header(shown.length, rows.length)}` followed by `"\n" +
lines.join("\n")` **only when `lines` is non-empty**.

Adopt in exactly these five, preserving byte-identical output:

| Table | anchor | header fn | cap / moreNoun |
|---|---|---|---|
| `tableClosure` | `digest.ts:177-183` | `` (_, t) => `${t} unclosed` `` | none |
| `tableDonePresent` | `digest.ts:187-195` | `` (_, t) => `${t} done tactics still in store` `` | none |
| `tableDupServes` | `digest.ts:202-217` | `` (_, t) => `${t} nodes re-declare a parent serve` `` | none |
| `tableNearDup` | `digest.ts:266-272` | `` (_, t) => `${t} pairs >= ${threshold}` `` | `NEAR_DUP_LIMIT` / `` `more pairs >= ${threshold}` `` |
| `tableStoredDefaults` | `digest.ts:400-406` | `` (s, t) => `${total} default-valued keys across ${t} nodes (top ${s} shown)` `` | `STORED_DEFAULTS_LIMIT` / `"more nodes with default-valued keys"` |

Row-string adjustments so the helper's own `  ` indent reproduces today's bytes:

- `tableDupServes` rows drop their literal `  ` prefix (`digest.ts:211`) →
  `` `${renderId(node.id)}: ${redundant.map(renderId).join(",")}` ``. Note its
  `rows.sort()` at `digest.ts:214` now sorts un-indented strings — the leading
  two spaces were constant, so the order is unchanged; keep the sort where it is.
- `tableStoredDefaults` rows drop their literal `  ` prefix (`digest.ts:402`) →
  `` `${String(r.count).padStart(2)} ${renderId(r.id)}` `` (the `padStart(2)`
  stays, so a count of 3 still renders as `   3 <id>` after the helper's indent).
- `tableClosure` / `tableDonePresent` rows become bare `renderId(id)`.

Each table keeps its own empty-case early return verbatim, because the wordings
genuinely differ and are asserted by tests:
`"[CLOSURE] pass — every strategy/tactic reaches a virtue root"` (`digest.ts:182`),
`"[DONE-PRESENT] none"` (`digest.ts:191`),
`"[DUP-SERVES] none"` (`digest.ts:215`),
`` `[NEAR-DUP-STATEMENTS] none above ${threshold}` `` (`digest.ts:266`).

**One deliberate byte change, and only one.** `tableStoredDefaults` has no empty
early return; today at zero rows it returns `header + "\n" + ""`, leaving a
stray trailing newline that `renderTables`' `join("\n\n")` (`digest.ts:424`)
turns into a three-newline gap. The helper emits no trailing newline in that
case. Fix it, and pin it with a new test asserting a zero-row store renders
`[STORED-DEFAULTS] 0 default-valued keys across 0 nodes (top 0 shown)` with no
trailing blank line. Every other table's output must be byte-for-byte identical.

Do not touch `tableValidate` (`digest.ts:123-133`) or `tableDanglingRefs`
(`digest.ts:296-354`) — neither has the shape.

Follow the extraction discipline `packages/intentionsutil/src/id-refs.ts:1-7`
already states for this file: one home for the repeated logic, **no behavior
change while extracting**.

**Recommended model:** sonnet

**Dependencies:** Unit 1 (both edit `tableStoredDefaults`' body; sequencing
avoids a conflict and lets this unit assume `rawTexts` is total).

---

## Unit 3 — One cycle-safe reachability util; adopt it in `computeSignalPath` and `tableClosure`

**Scope.**

The finding: `tableClosure`'s cache-write guard `if (result || stack.size === 0)`
(`digest.ts:173`) caches a `false` only at the outermost frame, so a deep
unclosed chain is re-derived once per fresh root. The output is **correct** — do
not "fix" a wrong answer, there isn't one. The docstring at
`digest.ts:139-142` claims it "mirrors `computeSignalPath`'s pattern", but
`computeSignalPath` threads an explicit `provisional` flag
(`packages/intentionsutil/src/attention.ts:276-323`) and `tableClosure` does
not — a weaker discipline than the comment claims. Take the finding's second,
better option: give the subtle discipline exactly one home.

Create `packages/intentionsutil/src/reachability.ts` — a new module with **no
imports at all** (ids and callbacks only, so it can never form an import cycle
with `schema.ts` / `attention.ts` / `digest.ts`):

```ts
/**
 * Cycle-safe memoized reachability: the set of ids that reach a terminal by
 * following `edgesOf`. A `true` is always final and always memoized; a `false`
 * reached by short-circuiting on a node still on the DFS stack is PROVISIONAL —
 * it saw only the truncated cycle view — so it is not memoized and is
 * recomputed when the node is later entered as a fresh root. Every id is
 * entered as a root in sorted order, so the result never depends on input
 * order. Returns ids in sorted order.
 */
export function reachableSet(
  ids: readonly string[],
  edgesOf: (id: string) => Iterable<string>,
  isTerminal: (id: string) => boolean,
): Set<string>
```

Implementation is `resolveOnPath`'s exact shape from
`packages/intentionsutil/src/attention.ts:289-323`, generalized: an
`onPathMemo`/`onPathStack` pair, a `{ result, provisional }` return, the
`if (result || !provisional) { memo.set(...) }` cache condition, and the
`for (const id of [...ids].sort())` root loop from `attention.ts:326-332`
inserting into the returned set (so its iteration order stays sorted, as
`computeSignalPath` currently guarantees).

Adopt in both call sites:

- `packages/intentionsutil/src/attention.ts:256-334` — keep the terminal
  computation (`attention.ts:259-272`) and `buildReverseBlockedBy`
  (`attention.ts:274`) exactly as they are. Replace the inner `resolveOnPath`
  closure and the root loop with a single `reachableSet` call:
  `isTerminal = (id) => terminalIds.has(id)`;
  `edgesOf = (id) => [ ...(parent present in byId ? [parent] : []),
  ...(reverseBlockers.get(id) ?? []) ]`. Move the long provisional-flag comment
  (`attention.ts:279-288`) into `reachability.ts` — it is the single canonical
  explanation and must not be duplicated. Leave `computeSignalPath`'s own
  docstring (`attention.ts:239-255`) and its export from
  `packages/intentionsutil/src/index.ts:14` untouched: the router's
  strategy-eligibility gate consumes it and its contract is unchanged.
- `packages/intentionsutil/src/digest.ts:144-184` — replace `reachesVirtue`'s
  hand-rolled DFS with `reachableSet(nodes.map((n) => n.id), edgesOf,
  isTerminal)` where `isTerminal = (id) => byId.get(id)?.kind === "virtue"` and
  `edgesOf = (id) => { const n = byId.get(id); return n === undefined ? [] :
  [...n.serves, ...(n.parent !== null ? [n.parent] : [])].filter((t) =>
  byId.has(t)); }`. `unclosed` becomes the strategies/tactics **not** in the
  returned set, still routed through `sortedIds` (`digest.ts:118-120`) and Unit
  2's `renderCappedTable`. Rewrite the `digest.ts:139-142` docstring to point at
  `reachability.ts` instead of claiming to mirror `computeSignalPath`.

Behavior must be identical. Semantics that must survive, each already covered by
a test at `test/digest.test.ts:168-213`: a chain of `serves` reaching a virtue is
closed; an empty-`serves` sub-strategy whose `parent` chain reaches a virtue is
closed (`test/digest.test.ts:189-200`); a `serves`/`parent` cycle with no virtue
terminates and reports its members as unclosed (`test/digest.test.ts:202-212`);
a `serves` entry pointing at a missing id contributes nothing.

Tests — add `packages/intentionsutil/test/reachability.test.ts` covering
`reachableSet` directly: a linear chain, a diamond, a pure cycle (no terminal),
a **cycle whose only escape to a terminal runs back through an ancestor** (the
case the provisional flag exists for — assert it resolves `true`), and an
order-independence case asserting the same result for a shuffled `ids` array.
`packages/intentionsutil/test/attention.test.ts` and the CLOSURE tests must pass
**unmodified** — if either needs editing, the refactor changed behavior and is
wrong (`.claude/rules/test-integrity.md`).

Out of scope: changing which edges either caller walks, the router's rank
computation, or anything in `packages/intentionsutil/src/router.ts`.

**Recommended model:** opus

**Dependencies:** Unit 2 (`tableClosure`'s render tail moves in Unit 2; do the
traversal swap on top of it).

---

## Unit 4 — Bound NEAR-DUP with a stop-word filter plus an exact inverted-token index

**Scope.** `packages/intentionsutil/src/digest.ts:219-273` (plus the
`.claude/skills/align-audit/SKILL.md` line noted at the end). Findings 1 and 3
land together because, as measured in `## Context`, the index without the filter
recovers only ~11%.

**(a) Stop-word filter — `statementTokens` (`digest.ts:219-227`).** Add a
module-level `const STATEMENT_STOP_WORDS = new Set([...])` immediately above it,
with a comment stating the tuning rule: *the table is a human shortlist, so tune
conservatively — a stop word must be pure scaffolding that carries no topic.*
Add two filters to the existing pipeline: drop tokens of length < 2 (kills the
stray `s`/`t` that possessive-splitting produces — `s` alone had df=260, the
single highest non-stop token), and drop stop-list members. This exact list was
measured (see `## Verification`) to take live-store near-dup pairs 69 → 43 with
**zero** newly-introduced pairs:

```
a an the and or but of to for in on at by with from as is are be been being
it its this that these those not no than then so such into over under across
per via each any all every some other others one two three new add adds added
use uses using make makes made do does done when where which who whom what how
why if while during after before between about against also more most only own
same too very can will just should now node nodes graph
```

`node`/`nodes`/`graph` are on the list deliberately: in this store they are
scaffolding present in most statements (df 191 and 164), not topic. If a future
tuning pass changes the list, re-run the probe in `## Verification` and confirm
the change stays subtractive. Leave `jaccard` (`digest.ts:229-235`) untouched —
it is generic and correct.

**(b) Exact candidate generation — `tableNearDup` (`digest.ts:251-273`).**
Replace the `i, j` double loop (`digest.ts:254-264`) with, in order:

1. Build `postings: Map<string, number[]>` from token → entry indices, in entry
   order (so each posting list is ascending).
2. For each entry `i` in order, collect candidate `j` as the union of
   `postings.get(t)` for `t` in `entries[i].tokens`, keeping only `j > i`,
   deduped via a per-`i` `Set<number>` and then iterated in ascending order.
   Streaming per-`i` rather than materializing a global pair set keeps peak
   memory O(n) and makes the visit order deterministic without a sort.
3. **Exact length prune** before computing Jaccard: with
   `mn = min(|ti|,|tj|)`, `mx = max(|ti|,|tj|)`, skip when `mx === 0 || mn / mx
   < threshold`. This is lossless — `jaccard ≤ mn / mx` always — and measured to
   remove a further 44% of candidates (87,995 → 49,272).
4. Compute Jaccard only on survivors; the pair-building, ordering
   (`digest.ts:265`) and `NEAR_DUP_LIMIT` cap (`digest.ts:242`, now via Unit 2's
   `renderCappedTable`) are unchanged.

Both prunes are **exact**: Jaccard ≥ 0.6 > 0 requires at least one shared token,
so nothing that would have been reported is dropped. Do **not** add a
document-frequency cap — it is lossy, and the finding is explicit that anything
dropped must be logged rather than silently capped.

**(c) Log the bound.** Add
`const NEAR_DUP_COMPARISON_BUDGET = 5_000_000;` (≈100× today's measured 49,272,
and still ~18× the full n² pair count at n=740, so it can only fire on a
far larger graph). Count actual Jaccard evaluations; if the budget is reached,
stop generating candidates at the current `i` boundary and record how many
entries were left unvisited. Emit, as the **last line of the table in every
case including the `none` case**, one of:

```
  compared <C> of <P> possible pairs via token index
  WARNING: comparison budget 5000000 exhausted after <C> pairs; <U> of <P> entries not compared
```

where `P = n*(n-1)/2`. The header lines themselves stay byte-identical, so the
existing assertions (`test/digest.test.ts:258-279`) and any downstream
header-keyed reading keep working.

**(d) Docs.** Update the `[NEAR-DUP-STATEMENTS]` bullet at
`.claude/skills/align-audit/SKILL.md:163-165` to say the tokens are stop-word
filtered and that the table's trailing line reports the comparison count. Record
in the same bullet that this change is a **one-time discontinuity** in the
series the audit tracks across cycles: on the store as of this change, 69 → 43
pairs, all 26 dropped being `tactic-hold-*` / `tactic-flake-*` template
scaffolding at 0.60–0.67, none newly added. Without that note the next
`/align-audit` cycle reads the drop as a graph change rather than a tool change.

Tests — `packages/intentionsutil/test/digest.test.ts`:

- Keep both existing NEAR-DUP cases (`test/digest.test.ts:258-279`) passing
  unmodified — the `tactic-review-lows-finance` / `tactic-review-lows-publishing`
  pair is a genuine topical near-dup and must survive stop-word filtering.
- Add: two statements sharing **only** stop words plus differing topic words
  report no pair (the finding's motivating case).
- Add: the trailing `compared <C> of <P>` line is present, and on the 400×2
  synthetic store at `test/digest.test.ts:363-388` assert `C` is under a third
  of `P` — the regression guard that the index stays wired in. Keep the existing
  250,000-byte output-budget assertion as-is.
- Add: an inverted-index-vs-brute-force equivalence test — on a ~60-node
  synthetic set, the reported pair set equals the set a straightforward `O(n^2)`
  loop over the same (filtered) tokens produces.

**Recommended model:** opus

**Dependencies:** Unit 2 (`tableNearDup`'s render tail).

---

## Unit 5 — Derive STORED-DEFAULTS from the schema instead of a shape heuristic

**Scope.**

`packages/intentionsutil/src/schema.ts` — the defaults live inline in
`validateNode`'s return object (`schema.ts:962-1030`), which is today the only
source of truth. Export a table beside it and pin the two together:

```ts
/**
 * Per-field defaults for every OPTIONAL IntentionNode field — the same values
 * `validateNode` applies when a field is absent/null. Sole machine-readable
 * home; `test/schema.test.ts` asserts it agrees with `validateNode` key-for-key,
 * so a new optional field cannot be added without registering its default here.
 */
export const NODE_FIELD_DEFAULTS: Readonly<Record<string, unknown>> = {
  parent: null, rationale: null, reading: null,
  serves: [], recovers: [], clarifications: [], tooling_goals: [],
  success_signal: null, attention: null,
  phase: null, execution: null, validates: [], blocked_by: [],
  office_hours: null, pace_exempt: false, rounds: null,
  attributes: {},
};

/** The required core: no default, never counted as a stored default. */
export const REQUIRED_NODE_FIELDS: readonly string[] =
  ["id", "kind", "statement", "owner", "status"];

/** True when a serialized value equals `key`'s schema default. */
export function equalsFieldDefault(key: string, value: unknown): boolean
```

`equalsFieldDefault` returns `false` for an unknown key, and otherwise compares
against `NODE_FIELD_DEFAULTS[key]` by default *shape*: `null` → `value === null`;
a boolean → strict equality (so a field ever defaulting to `true` is handled —
the exact drift the finding names); an array → `Array.isArray(value) &&
value.length === 0`; a plain object → `isPlainObject(value) &&
Object.keys(value).length === 0` (reuse the already-exported
`isPlainObject` at `schema.ts:319-321`). Do **not** rewrite `validateNode` to be
generated from the map — its per-field ternaries also invoke per-field
validators, and the mechanical tie below gets the same guarantee at a fraction
of the risk. Do not export either symbol from
`packages/intentionsutil/src/index.ts` unless a consumer outside the package
needs it (knip flags unused exports).

`packages/intentionsutil/src/digest.ts`:

- Delete `isDefaultValue` (`digest.ts:358-365`) and its docstring.
- In `tableStoredDefaults` (`digest.ts:381-407`), classify each parsed
  frontmatter key into three buckets: **required** (in `REQUIRED_NODE_FIELDS`) →
  ignored; **known optional** → counted when `equalsFieldDefault(key, value)`;
  **non-schema** (not in either set) → tallied by key name in a
  `Map<string, number>`.
- Leave the header line unchanged in shape
  (`${total} default-valued keys across ${rows.length} nodes (top ${shown} shown)`)
  so `.claude/skills/align-audit/SKILL.md` and the existing assertion at
  `test/digest.test.ts:351-361` keep working. When the non-schema map is
  non-empty, append exactly one trailing line after the rows (and after Unit 2's
  `... and N more` trailer, when present):
  `  non-schema keys: gap(452)` — entries sorted count-desc then name-asc,
  joined by a single space. Emit nothing when the map is empty.
- Update the `digest.ts:374-380` docstring: the table now counts keys equal to
  the schema's own declared defaults, and separately reports keys the schema does
  not define. Keep the existing pointer that remediation is owned elsewhere
  (`tactic-omit-default-serialization` / `strategy-graph-self-description`) —
  this table is a signal, never a fix site.

`.claude/skills/align-audit/SKILL.md:171-174` — extend the `[STORED-DEFAULTS]`
bullet: the count is now schema-derived, and the new `non-schema keys:` line
names top-level frontmatter keys the schema does not define. Record the
one-time discontinuity for the same reason as Unit 4: on the store as of this
change 9929 → 9488 counted keys, with `gap` (452 nodes) moving into the
non-schema bucket. Note that `gap` is derived at read time
(`packages/intentionsutil/src/sensors.ts:241`) and never a schema field, so its
452 stored occurrences are a **stronger** structure-parsimony signal than the
default-valued keys the table already reports — a finding for the audit to
disposition, not something this unit fixes.

Tests:

- `packages/intentionsutil/test/schema.test.ts` — the mechanical tie: call
  `validateNode` on a minimal required-fields-only input, then assert that the
  result's key set equals `REQUIRED_NODE_FIELDS ∪ keys(NODE_FIELD_DEFAULTS)`
  with no key in either direction unaccounted for, and that every optional key's
  produced value satisfies `equalsFieldDefault(key, value)`. This is the test
  that fails the day someone adds an optional field defaulting to `true` without
  registering it.
- `packages/intentionsutil/test/digest.test.ts` — keep the existing
  STORED-DEFAULTS case passing; add one whose `rawTexts` fixture carries an
  extra top-level key (`gap: null`) and assert it lands on the
  `non-schema keys: gap(1)` line and is **not** in the default-valued count; add
  one asserting a required field is never counted even when its serialized value
  is an empty string.

**Recommended model:** sonnet

**Dependencies:** Unit 1 (the `rawTexts` skip at `digest.ts:386` is removed
there) and Unit 2 (the render tail).

---

## Unit 6 — Repair the nine stale citations of the pruned predecessor

`tactic-graph-digest-tooling` was pruned; this node is its live successor. Nine
citations of the pruned id survive under `intentions/` and read as live
references to a node that no longer exists. They are recorded here because this
node is the successor carrier — recorded 2026-08-30, after three review rounds
on `plans/dispatch-rsi-sequence.md` found the repair scheduled by no position
and carried by no node. Plan prose is not an owner; this section is.

The nine sites, all repaired to **past tense** naming this node as successor:

- `strategy-graph-review-curriculum.md:158`
- `strategy-graph-integrity.md:23`, `:138`
- `tactic-align-audit-skill.md:76`, `:110`, `:172`
- `tactic-serves-inheritance-full-strip.md:21`, `:53`, `:112`

**Two of the nine need a different instrument from the rest, and getting this
wrong silently destroys data.** On `tactic-serves-inheritance-full-strip`, `:53`
is ordinary body prose — an `.md` text edit. But `:21` sits **inside the
frontmatter** (delimiters `:1` and `:47`), in `rationale:` (`:11`), so it must go
through `dump-node.ts` → edit → `write-node.ts` → `graph-commit`. Never
hand-build a partial payload for it: `validateNode` defaults every omitted
field, so a minimal payload writes `phase: null`, `execution: null` and
`serves: []` over that node's live `phase: implement` (`:33`), its `execution`
block including `strategy_fingerprint` (`:34-40`) and its one `serves` entry
(`:26-27`) — at exit 0, with no error.

`:21` and `:53` are also **prose `blocked_by` references** — `:21` reads *"the
digest's DUP-SERVES table (blocked_by tactic-graph-digest-tooling)"* and `:53`
repeats it. There is no frontmatter edge, so the router never traverses it, but
a human reader takes it for a live blocker; that node's real `blocked_by` is
`[]` (`:42`). Repair the phrasing, not just the id.

Both are machine-read: `validateGraphProseRefs`
(`packages/intentionsutil/src/schema.ts:1973`) scans `statement`, `rationale`,
`attention.rationale`, every `clarifications[].answer` and the body — so it
reads `:21` (inside `rationale`) and `:53` (body) alike.

**One site outside `intentions/` needs deletion, not repair.**
`packages/intentionsutil/prose-ref-baseline.json:24` carries the pruned id as a
`referencedBy` entry — a stale grandfather naming a node that no longer exists,
not a citation of it.

**Explicitly out of scope:** the four mentions on this node's own `## Provenance`
section (`:5`, `:15`, `:57`, `:682`) are correct as history and need nothing.
Do not "repair" them.

**Recommended model:** sonnet

**Dependencies:** none.

---

## Reuse

- `renderId` — `packages/intentionsutil/src/digest.ts:56-68`. The single
  id-escaping boundary. Unit 2's helper takes rows **already escaped**; never
  re-escape inside it.
- `sortedIds` — `packages/intentionsutil/src/digest.ts:118-120`. Existing shared
  id sort; keep it, and keep calling it from `tableClosure` / `tableDonePresent`.
- `IntentionSchemaError` — `packages/intentionsutil/src/errors.ts:1-6`, already
  imported at `digest.ts:20` and used by `tableValidate` (`digest.ts:123-133`).
  Unit 1's boundary check throws this, not a bare `Error`.
- `assertPathSafeId` — `packages/intentionsutil/src/store.ts:39-50`. Exported
  precisely so non-`readNode` consumers that build a path from an id can apply
  the same check; Unit 1 calls it in `gatherInput`.
- `computeSignalPath`'s provisional-false discipline —
  `packages/intentionsutil/src/attention.ts:276-323`. The canonical cycle-safe
  memoized DFS in this package. Unit 3 lifts this shape into
  `reachability.ts`; do not invent a new memoization scheme.
- `isPlainObject` — `packages/intentionsutil/src/schema.ts:319-321`. Already
  exported; Unit 5's comparator uses it for the empty-object case.
- `validateNode`'s inline defaults — `packages/intentionsutil/src/schema.ts:993-1028`.
  The only existing source of per-field defaults; Unit 5 mirrors it into
  `NODE_FIELD_DEFAULTS` and pins the two with a test.
- `extractFrontmatter` / `parse` — already wired at `digest.ts:389`. Unit 5
  changes only the classification of parsed keys, never the parsing.
- `id-refs.ts` module header — `packages/intentionsutil/src/id-refs.ts:1-7`. The
  in-file precedent for "extract a repeated shape out of `digest.ts`, no
  behavior change"; Units 2 and 3 follow it.
- `gatherInput` — `packages/intentionsutil/scripts/graph-digest.ts:40-52`. The
  only real `DigestInput` producer; it already builds `bodies`/`rawTexts` 1:1 in
  one loop and must pass Unit 1's new check unchanged.
- `input()` test helper — `packages/intentionsutil/test/digest.test.ts:44-56`.
  Reuse for every existing-behavior test; Unit 1's mismatch cases hand-build
  their inputs instead of changing it.
- The 400×2 output-budget test — `packages/intentionsutil/test/digest.test.ts:363-388`.
  The existing scale guard; extend it rather than writing a new synthetic store.
- CI's vitest invocation shape —
  `.claude/skills/dispatch-propagate/scripts/run-unit-tests.sh:137`
  (`npx vitest run --project <dir> --root "$REPO_ROOT"`). The project name is the
  workspace **directory** (`packages/intentionsutil`), per
  `vitest.config.ts:14-18`.

## Verification

Run from the worktree root. Baseline at HEAD before any edit: `digest.test.ts` +
`attention.test.ts` = 69 tests, green.

```verify
npx vitest run --project packages/intentionsutil --root .
```

```verify
.claude/skills/dispatch-propagate/scripts/run-typecheck.sh --app packages/intentionsutil
.claude/skills/dispatch-propagate/scripts/run-lint.sh --app packages/intentionsutil
```

End-to-end against the real store — the digest still renders and still validates
clean:

```verify
node --import tsx/esm packages/intentionsutil/scripts/graph-digest.ts --tables-only | grep -q '^\[VALIDATE\] pass'
node --import tsx/esm packages/intentionsutil/scripts/graph-digest.ts --tables-only | grep -q '^\[CLOSURE\] pass'
```

Determinism is a documented property of this module (`digest.ts:13-15`); two
runs on the same store must be byte-identical:

```verify
node --import tsx/esm packages/intentionsutil/scripts/graph-digest.ts > "${TMPDIR:-/tmp}/digest-a.txt"
node --import tsx/esm packages/intentionsutil/scripts/graph-digest.ts > "${TMPDIR:-/tmp}/digest-b.txt"
cmp "${TMPDIR:-/tmp}/digest-a.txt" "${TMPDIR:-/tmp}/digest-b.txt"
```

Per-unit structural checks (each passes only after its unit lands):

```verify
grep -q 'assertDigestInput' packages/intentionsutil/src/digest.ts
grep -q 'assertPathSafeId' packages/intentionsutil/scripts/graph-digest.ts
grep -q 'renderCappedTable' packages/intentionsutil/src/digest.ts
grep -q 'reachableSet' packages/intentionsutil/src/digest.ts
grep -q 'reachableSet' packages/intentionsutil/src/attention.ts
grep -q 'STATEMENT_STOP_WORDS' packages/intentionsutil/src/digest.ts
grep -q 'NEAR_DUP_COMPARISON_BUDGET' packages/intentionsutil/src/digest.ts
grep -q 'NODE_FIELD_DEFAULTS' packages/intentionsutil/src/schema.ts
grep -q 'equalsFieldDefault' packages/intentionsutil/src/digest.ts
```

Manual / judgment steps:

- **Byte-preservation (Units 2 and 3).** Before starting Unit 2, capture
  `node --import tsx/esm packages/intentionsutil/scripts/graph-digest.ts` to a
  file outside the tree. After Unit 3, diff against a fresh run. The only
  expected differences are the ones this plan names: nothing at all from Units 2
  and 3 (the zero-row STORED-DEFAULTS newline does not arise on the real store,
  which has 740 rows). Any other diff means the extraction changed behavior.
- **Unit 4 measurement.** Re-run the near-dup probe before finalizing the
  stop-word list: tokenize every node statement with and without the list,
  brute-force all pairs at threshold 0.6, and diff the two pair sets. Accept the
  list only if the change is **subtractive** (no pair appears that was not there
  before) and every dropped pair, read by eye, is template scaffolding rather
  than genuine topical overlap. The measurement at plan time on the live store:
  69 → 43 pairs, 26 dropped (all `tactic-hold-*` / `tactic-flake-*` at
  0.60–0.67), 0 added; candidate pairs 273,430 → 87,995 → 49,272 after the
  length prune.
- **Unit 5 measurement.** Confirm on the live store that the counted total moves
  9929 → 9488 and the non-schema line reads `gap(452)`. A different `gap` count
  is fine (the store moves); a *second* non-schema key family appearing is a new
  finding to record for `/align-audit`, not a bug in this unit.
- **Audit-facing docs.** Confirm `.claude/skills/align-audit/SKILL.md`'s
  `[NEAR-DUP-STATEMENTS]` and `[STORED-DEFAULTS]` bullets describe the shipped
  output, including the one-time discontinuity note. The audit compares counts
  across cycles; an unannounced tool-driven shift reads as a graph change.
- **Sandbox note.** If `npx vitest` fails with `EROFS` on
  `node_modules/.vite-temp/...`, that is the sandbox, not the change — retry with
  `dangerouslyDisableSandbox: true` per `.claude/rules/sandbox.md`. Ad-hoc `tsx`
  probe scripts must live inside the repo tree or carry an `.mts` extension; a
  `.ts` scratch file under `$TMPDIR` fails with `ERR_REQUIRE_CYCLE_MODULE`.

## Provenance

Source review: `/review-fix tactic-graph-digest-tooling`, PR #2865 (in-PR fixes
at commit `3dbaf24f`), recorded as a draft 2026-07-12. Re-validated against
merged code and decomposed into the five units above on 2026-08-20; every
finding was confirmed still present at that HEAD, and the scale figures in
`## Context` were measured against the live 740-node store rather than carried
forward from the draft.


**Caller re-verification (2026-08-20, origin/main `a0bfd20d`).** Every
`path:line` anchor and every measured figure in this body was independently
re-checked on the finalizing session's own thread before the body landed, and
the following slips in the plan-agent's draft were corrected in place, so the
numbers below are the ones a fresh implementer will reproduce:

- `deriveGap` is defined at `packages/intentionsutil/src/sensors.ts:241`;
  `goals.ts:173` is a call site, not the definition.
- `attention.ts`'s provisional-flag comment spans `279-288` (not `278-288`) and
  its root loop spans `326-332` (not `325-331`).
- Store size is **740** nodes by `listNodes` (741 files in `intentions/`), not
  742; full pairwise comparisons are **273,430**, not 274,911.
- Token document frequencies: `the` 614, `and` 452, `a` 385, `s` 260,
  `node` 191, `graph` 164.
- Candidate counts: index alone **244,181**; index + stop-words **87,995**;
  after the exact length prune **49,272**.
- STORED-DEFAULTS: the live header reads
  `[STORED-DEFAULTS] 9929 default-valued keys across 740 nodes (top 60 shown)`;
  schema-derived it becomes **9488**, with `gap` on **452** nodes moving to the
  non-schema bucket.

Two claims re-measured and confirmed **exactly** as the plan states them: the
stop-word list takes near-dup pairs **69 → 43** with **0** newly-introduced
pairs, and all **26** dropped pairs sit at similarity 0.60–0.67 inside the
`tactic-hold-*` (25) and `tactic-flake-*` (1) families. One fact worth carrying
into Unit 5 that the draft did not note: **11 of the 452 stored `gap` values are
non-null**, so they are stale derived data on disk, not merely a redundant
`gap: null` — which makes the non-schema signal stronger than the draft claims,
not weaker.

Every ` ```verify ` fence in this body was executed at `a0bfd20d` before the
body landed: the vitest, typecheck, and lint fences pass (1130 tests across 53
files; `digest.test.ts` + `attention.test.ts` = 69, matching the stated
baseline), and the `--tables-only` grep and determinism fences exit 0. The
per-unit structural greps correctly fail today — each passes only once its unit
lands. `$TMPDIR` in the determinism fence was changed to `${TMPDIR:-/tmp}`
because `$TMPDIR` is unset when Claude's sandbox is disabled.

**Drift review, 2026-08-20 per-node finalize.** No Side-A condition of
`strategy-graph-integrity` failed and no material Side-B premise was found;
`proceed: true`, no park. Two immaterial observations were raised and are
recorded on the born-parked carrier
`tactic-graph-digest-quality-followups-drift-observations`, not as
clarifications on the serving strategy. The Workflow's clause-coverage evidence
agent died mid-run (`StructuredOutput` retry cap), so the Side-A review ran
without per-condition repo evidence; the finalize was landed anyway on the
judgment that this target is a single-package, read-only-tooling change whose
effect on all four recorded conditions is either neutral or favourable — the
token-bounded condition is the one it touches, and it strengthens it.
