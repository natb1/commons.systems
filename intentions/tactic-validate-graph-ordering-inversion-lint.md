---
id: tactic-validate-graph-ordering-inversion-lint
kind: tactic
statement: "validateGraph gains a warn-level ordering-inversion lint: node X's
  body names node Y while Y.blocked_by contains X — surfaced for session
  disposition, never a hard fail"
owner: ai
status: codified
parent: null
rationale: "Retained (retain-not-refine) from the 2026-08-12 /align interview
  that recorded the self-consistency condition on
  strategy-graph-native-dispatch, and finalized to phase implement by a per-node
  /align-tactics round on 2026-08-21. serves names strategy-graph-integrity, not
  the strategy under interview, because the artifact is validateGraph and the
  requirement is that all graph CONTENT be internally consistent — that
  strategy's own statement. It is the mechanical backstop for the doctrine limb
  (tactic-align-round-self-consistency-walk): the lint catches an inversion even
  when the authoring session misses it. Warn-level is deliberate — a node body
  naming a sibling is a common and legitimate cross-reference, so the check
  shortlists rather than disposes, matching the align skills' existing
  grep-shortlists-never-disposes convention. The draft's \"worth running once
  over the whole graph when built (603 nodes at record time)\" instruction has
  been DISCHARGED at planning time rather than deferred: a prototype of the
  exact predicate over the live store at c192d1bb (748 nodes, 168 blocked_by
  edges) found 67 raw pairs, 49 after dropping done-phase ends, 45 after
  excluding derived hold/wait blockers. That measurement, not the stale 603-node
  figure, is what shapes the plan — 45 pre-existing pairs are why the write path
  is grandfathered by a baseline and why the full set is carried in the digest
  for the /align-audit session to disposition."
reading: null
serves:
  - strategy-graph-integrity
recovers: []
clarifications:
  - question: Do any of strategy-graph-integrity's four recorded conditions fail for
      this node, and does the strategy's own unread signal gate it?
    answer: "(Recorded 2026-08-21 /align-tactics per-node drift review.) Condition
      sweep against repo HEAD c192d1bb, all four strategy-graph-integrity
      conditions measured, none failed for this node. Condition 2 (mechanical
      checks ratchet into validateGraph/CI) is live and is exactly what this
      node executes: validateGraph now enumerates rules 1-19, 21-22 (20 retired)
      with 23/24 in flight, and validate-graph.ts is wired into both
      .github/workflows/graph-fast-path.yml:32 and unit-tests.yml:162. Condition
      3 holds — the warn-level, shortlist-never-disposes shape is the same
      autonomy contract, and the one recorded 2026-07-22 breach (commit 8e23a272
      on tactic-align-audit-legacy-review) was caught and re-resolved
      author-present 2026-07-23, so the guard is enforceable. Condition 1 is
      verifiable only by proxy (no measured session-length figure exists; store
      grew 302 nodes at f65bacc1 to 749 today), but this node does not load it:
      the lint runs in the CI validate-graph pass, not inside an /align-audit
      session, so it consumes no audit reading budget. Condition 4 (the cadence
      actually recurs) reads rounds.count 0 / reading null with no scheduler
      wiring anywhere outside intentions/ — but tactic-align-audit-skill merged
      2026-08-20T18:41:56Z, one day before this review, so zero cycles is not
      yet a lapse; and the condition's own text routes a lapse to
      strategy-explicit-intent's capture mechanism rather than making recurrence
      a precondition for any single mechanical tactic. This node is the CI-time
      backstop that fires on every graph write whether or not the audit cadence
      fires."
  - question: What does "validateGraph gains a warn-level lint" mean mechanically,
      given that validateGraph is a throw-always engine with no severity
      channel?
    answer: "(Recorded 2026-08-21 /align-tactics per-node drift review.) The
      statement's phrase 'validateGraph gains a warn-level lint' is satisfied by
      a sibling function, not by a new entry in validateGraph's rule list — this
      is a mechanical consequence of the existing code, not an open design
      branch. validateGraph (packages/intentionsutil/src/schema.ts:1652-1699)
      threads a single problems: string[] array through every check* helper and
      throws one IntentionSchemaError if non-empty; it has no severity split and
      no warn channel, and every call site expects throw-or-pass. The warn-only
      contract therefore lands as a pure finder function returning a diagnostic
      array and throwing nothing (contract modelled on
      findUnboundRegisteredSensorNames, sensors.ts:155-174, whose docstring
      states 'the caller picks the severity'), a companion format* renderer
      (formatUnboundSensorNames, sensors.ts:180-196), and a non-fatal call site
      in scripts/validate-graph.ts main() copying the sensor-registration warn
      block verbatim in shape (validate-graph.ts:184-198, PR #3095 / the
      2026-08-14 repo-wide-denial incident): compute, then if non-empty
      process.stderr.write a labeled block, never throw, never process.exit. It
      is wired after validateGraphProseRefs (validate-graph.ts:206) because
      nodes, the bodies Map (built at :200-203 via readNodeBody) and blocked_by
      are all already in scope there — no second body read. Body-dependent, so
      it is exported from schema.ts/index.ts but NOT added to graph.ts's
      browser-safe barrel, following validateGraphProseRefs' placement."
  - question: What is the lint's file surface — validate-graph.ts only, or does it
      extend to the digest and the audit skill's table list?
    answer: "(Recorded 2026-08-21 /align-tactics per-node finalize.) Scope
      resolution for the lint, and a correction to the provisional reading this
      round's own drift phase took before the store was measured. The lint's
      core surface is scripts/validate-graph.ts plus its finder in schema.ts — a
      non-throwing findOrderingInversions / formatOrderingInversions pair. But a
      prototype of the exact predicate run over the live store at c192d1bb (748
      nodes, 168 blocked_by edges) yields 67 raw pairs, 49 after excluding
      done-phase ends, 45 after excluding derived hold/wait blockers; 45 pairs
      on stderr at every graph write would be wallpaper and would defeat the one
      thing the lint is for, so the write path is grandfathered by a new
      packages/intentionsutil/ordering-inversion-baseline.json following the
      repo's two existing baselines (prose-ref-baseline.json,
      plan-body-baseline.json; the contract is stated at
      packages/intentionsutil/src/planlint.ts:29-38). A baseline with no reader
      would then bury exactly the pre-existing inversions this node's own
      rationale says are worth surfacing, so the scope extends to an
      [ORDERING-INVERSIONS] digest table carrying the full un-baselined set plus
      the matching .claude/skills/align-audit/SKILL.md table-list entry — the
      audit-path half. The drift phase's earlier reading (\"a digest table is
      out of scope\"), taken from the statement's plain text before the 45-pair
      measurement existed, is superseded by this entry; it was marked material:
      false / plan_depends: false at the time. Unchanged from that reading: the
      whole-graph first run is verification producing a shortlist, not a fix-up
      unit — pre-existing inversions route to session disposition per \"surfaced
      for session disposition, never a hard fail\" and the align family's
      grep-shortlists-never-disposes convention, and none are dispositioned
      inside this node's PR. Detection reuses id-refs.ts verbatim —
      buildIdRefMatchers(prefixes) and extractIdRefs(text, matchers, vocab,
      selfId) — never a hand-rolled regex, since that machinery already solves
      the over-matching trap strategy-graph-integrity's 2026-07-09 clarification
      records. A candidate Y absent from byId is skipped, the same way
      checkBlockedByCycles defers dangling blocked_by targets to rule 13."
  - question: Does any in-flight sibling touch the same files, and what does that
      mean for the plan's code anchors?
    answer: "(Observed 2026-08-21 /align-tactics per-node drift review.)
      File-surface overlap with an in-flight sibling — non-blocking, but it
      governs how this plan cites code. tactic-supersession-edge-and-terminal
      (phase: implement, serving strategy-graph-native-dispatch and
      strategy-recursive-self-improvement, finalized at HEAD c192d1bb) adds two
      new numbered validateGraph rules 23/24, edits mentionsRef in schema.ts,
      and appends tableSupersededPresent to digest.ts's renderTables. Line
      anchors in schema.ts and digest.ts, and the fatal rule numbering, will
      therefore shift under this node's plan. Two consequences, both already
      applied: every path:line anchor in the plan body is paired with a symbol
      name so the symbol is the real address, and the lint claims no fatal rule
      number at all — it is deliberately not one of the numbered rules, so there
      is no contention for the next slot. An implementing session should
      re-check the cited line numbers against the working tree before editing."
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
# validateGraph gains a warn-level ordering-inversion lint: node X's body names node Y while Y.blocked_by contains X — surfaced for session disposition, never a hard fail

## Context

**The defect class.** An `/align` or `/align-tactics` round can author a
`blocked_by` edge that contradicts a scope the same round authors: node Y is
declared blocked on node X (so X executes first), yet X's own plan body names Y
as something it depends on or defers to. The recorded instance is commit
8249f664 (the inverted `blocked_by` across the attention-rank tactic family).
`tactic-align-round-self-consistency-walk` is the doctrine limb — it makes the
authoring session walk its own round's output before landing. This tactic is
the **mechanical backstop** for that limb: the lint catches an inversion even
when the authoring session misses it.

**Why warn-level, never fatal.** A node body naming a sibling is a common and
legitimate cross-reference — "split out to sibling Z", "out of scope, Z owns
it". Measured on the live store (below), roughly a quarter of all
`blocked_by` edges produce such a pair. So the check **shortlists for session
disposition and never disposes**, matching the align skills' existing
grep-shortlists-never-disposes convention
(`.claude/skills/align-audit/SKILL.md`, Step 3). Being fatal here would also
re-arm the 2026-08-14 repo-wide write outage: `validate-graph.ts` is the `guard`
job of `.github/workflows/graph-fast-path.yml`, whose four other required
contexts declare `needs: guard`, so a throw blocks *every* graph writer over
content unrelated to their own write
(`tactic-eval-finding-sensor-validator-red-main-blocks-all-graph-writes`).

**Measurement (this store, commit c192d1bb, 2026-08-21, 748 nodes, 168
`blocked_by` edges).** A prototype of the exact predicate below was run over the
live store during planning — this discharges the draft rationale's "worth
running once over the whole graph when built" instruction, and supersedes its
"603 nodes at record time" figure:

- **67** raw pairs (X's body names Y ∧ Y.blocked_by contains X).
- **49** after dropping pairs where either node is at `phase: done` (the
  ordering constraint is only actionable while both ends are open).
- **45** after excluding derived blocker nodes — hold nodes
  (`holdIdFor(kind, source)`) and WAIT nodes (`waitIdFor(source)`) block their
  own source *by construction* and name it in their body by construction, so
  every such pair is a guaranteed false positive.

Sample legitimate hits: `tactic-mount-schema` naming four downstream nodes it
unblocks; `tactic-attention-namespaced-rank` naming
`tactic-attention-delegation-scoring` in an explicit "split out to sibling"
paragraph; `tactic-hold-residue-bounded-work-in-progress` naming
`tactic-bounded-work-in-progress`.

**Design consequence — the greenfield shape.** 45 pre-existing candidate pairs
printed on stderr at every graph write is wallpaper: it destroys the one thing
this lint is for (telling the *authoring* session it just inverted an edge). So
the ideal design splits the two audiences:

1. **Write path (`validate-graph.ts`)** — reports only pairs **not** in a
   grandfather baseline, so the stderr block is empty on a clean write and
   names exactly the pair a round just introduced. This reuses the repo's
   established rollout convention for a graph-wide prose check verbatim:
   `packages/intentionsutil/prose-ref-baseline.json` and
   `packages/intentionsutil/plan-body-baseline.json` both exist for the same
   reason (`packages/intentionsutil/src/planlint.ts:29-38` states the contract).
2. **Audit path (the digest)** — carries the **full** set as an
   `[ORDERING-INVERSIONS]` table, so the recurring `/align-audit` run
   (`tactic-align-audit-skill`, serving `strategy-graph-integrity`) can
   disposition the pre-existing 45 digest-first, which is that strategy's
   token-bounded condition. Without this half, the grandfathered pairs would be
   frozen in a JSON file no reader ever opens.

There is no brownfield/greenfield split to propose: the surfaces are new, the
baseline *is* the migration path (grandfather at introduction, never grow),
and nothing existing is being replaced.

**What this deliberately is not.** It claims **no `validateGraph` rule number**.
`validateGraph` (`packages/intentionsutil/src/schema.ts:1652-1699`) is a
throw-always engine with a single `problems: string[]` and no severity split;
adding a warn there would either be a lie or a hard fail. Rules run 1-19, 21-24
(20 is retired) — cited only as neighborhood context. The lint lands as a
sibling exported function next to `validateGraphProseRefs`, called separately
from the script's `main()`, exactly as `validateGraphProseRefs` and the sensor
warn already are. A fatal counterpart (the `validateRegisteredSensorNames`
shape at `packages/intentionsutil/src/sensors.ts:211-220`) is **out of scope** —
the tactic fixes warn-only — and is named here only so a future stricter check
reuses that pattern rather than inventing one.

**Scope boundary with parked siblings.** `tactic-validate-graph-empty-store-pass`
and `tactic-sensor-deregistration-gate` are parked on unratified owner rulings
that also touch `validate-graph.ts`. Nothing here assumes any outcome of either:
this plan adds a new pass and touches the existing sensor/empty-store code paths
not at all.

---

## Unit 1 — `findOrderingInversions` / `formatOrderingInversions` in `schema.ts`

**Scope.** Add one exported type and two exported functions at the end of
`packages/intentionsutil/src/schema.ts` (file is 1832 lines; append after
`validateGraphProseRefs`, which ends at :1831), plus unit tests.

Files that change:
- `packages/intentionsutil/src/schema.ts` — append the new block.
- `packages/intentionsutil/test/schema.test.ts` — new `describe` block.

Out of scope: `validateGraph` itself (no new numbered rule, no signature
change); `packages/intentionsutil/src/graph.ts` (the browser-safe barrel at
:10-17 deliberately omits body-dependent checks — `validateGraphProseRefs` is
not there either, and the new function must not be added); the root barrel
`packages/intentionsutil/src/index.ts` (it does not export
`validateGraphProseRefs`; `validate-graph.ts` imports straight from
`../src/schema.js` at :51, and Unit 2 does the same).

**API.**

```ts
export type OrderingInversion = { from: string; to: string };

export function findOrderingInversions(
  nodes: IntentionNode[],
  bodies: Map<string, string>,
): OrderingInversion[];

export function formatOrderingInversions(inversions: OrderingInversion[]): string;
```

`findOrderingInversions` **throws nothing** — it returns a diagnostic and the
caller picks the severity. That contract is copied deliberately from
`findUnboundRegisteredSensorNames`
(`packages/intentionsutil/src/sensors.ts:148-174`, whose docstring states the
same split); the doc comment on the new function should cross-reference that
one rather than restate its reasoning.

**Algorithm, exactly.**

1. `const storeIds = new Set(nodes.map((n) => n.id));`
2. Derive kind prefixes and matchers the same way `validateGraphProseRefs` does
   at `schema.ts:1787-1797` — prefixes from the vocabulary, **never** a
   hardcoded kind list — via `buildIdRefMatchers` (already imported at
   `schema.ts:2`). Vocabulary is `storeIds` **only**: deleted ids and batch ids
   are irrelevant here because the target Y must be a live node to carry a
   `blocked_by` array at all.
3. `const byId = new Map(nodes.map((n) => [n.id, n]));` — same construction as
   `validateGraph` at `schema.ts:1653`.
4. For each node X: `const body = bodies.get(X.id) ?? ""`, then
   `extractIdRefs(body, matchers, storeIds, X.id)`
   (`packages/intentionsutil/src/id-refs.ts:74`). **Do not hand-roll a regex** —
   that primitive already handles the backtick-required rule, the
   vocabulary-gated bare-token rule, family-wildcard exclusion, and
   self-exclusion, and it is the machinery that solved the 2026-07-09
   over-matching trap (prose compounds, family wildcards).
5. For each extracted ref: `const Y = byId.get(ref)`; **skip when undefined** —
   a dangling prose ref is the DANGLING-REFS table's business and a dangling
   `blocked_by` entry is validateGraph rule 13's, the same way
   `checkBlockedByCycles` skips unresolved targets
   (`schema.ts:1507-1546`).
6. Skip unless `Y.blocked_by.includes(X.id)`. (Direction matters: the reported
   pair is `{ from: X.id, to: Y.id }` — the node ordered *first* naming the node
   ordered *after* it. The reverse — Y's body naming X while X is Y's blocker —
   is the correct ordering and must not be flagged.)
7. **Live-ordering filter:** skip when `X.phase === "done"` or
   `Y.phase === "done"`. A done X has already run and a done Y's block is
   discharged, so the pair is history, not an ordering question. This also makes
   the diagnostic self-clearing as work completes.
8. **Derived-blocker exclusion:** skip when X is Y's structurally-derived
   blocker — `X.id === holdIdFor(k, Y.id)` for any `k` of `HOLD_KINDS`
   (`packages/intentionsutil/src/holds.ts:36-42, 76-91`), or
   `X.id === waitIdFor(Y.id)` (`packages/intentionsutil/src/waits.ts:73`). Both
   derivations *throw* when the derived id would not fit the node-id slug shape;
   a throw means "Y cannot have a derived blocker with that id", so catch it and
   treat the pair as not-derived. Document that in a comment so it reads as
   semantics, not a swallowed error (`.claude/rules/code-style.md`). Note
   `holds.ts` has no imports at all and `waits.ts` imports only a *type* from
   `schema.ts`, so neither import creates a cycle (`schema.ts:7` already imports
   `waitIdFor`).
9. Return sorted by `from` then `to`, deterministically (same
   sort-then-return discipline as `findUnboundRegisteredSensorNames`).

`formatOrderingInversions` renders the operator-facing message so both call
sites word it identically — the split modelled on `formatUnboundSensorNames`
(`packages/intentionsutil/src/sensors.ts:180-196`). Message content: one
`  <from> -> <to>` line per pair, under a header naming the condition, closing
with the disposition instruction — that a body naming a sibling is often a
legitimate cross-reference, so each pair is a candidate to confirm by reading
both nodes, not a defect to auto-fix. **Do not** use this formatter for the
digest table (Unit 3): the digest must escape ids through its own `renderId`
(`packages/intentionsutil/src/digest.ts:56-69`) and builds its rows itself.

**Tests** (`packages/intentionsutil/test/schema.test.ts`). Add a
`describe("findOrderingInversions")` block immediately after the
`describe("validateGraphProseRefs")` block (`:2392-2610`). Hoist that block's
`pnode` fixture builder (`:2394-2419`) to module scope and reuse it rather than
adding a third copy of the same 25-line builder — the file already carries two
(`gnode` at `:1253`, `pnode` at `:2394`) and a third is exactly the redundancy
`strategy-graph-integrity` names. Keep a real node in each fixture set so the
`tactic-` kind prefix exists in the derived vocabulary (the existing block's
`realTactic` comment at `:2421-2423` explains why). Cases:

- flags the pair when Y's `blocked_by` contains X and X's body names Y;
- does **not** flag a plain cross-reference (X's body names Y, Y not blocked by X);
- does **not** flag the correct direction (Y's body names X, X in Y's `blocked_by`);
- skips when X is `phase: done`; skips when Y is `phase: done`;
- skips a derived hold blocker — build the fixture id with `holdIdFor` itself,
  never a literal string, so the test cannot drift from the derivation;
- skips a WAIT blocker built with `waitIdFor`;
- skips a family-wildcard mention (inherited from `extractIdRefs`);
- scans the **body only** — a mention in `statement` / `rationale` /
  `clarifications[].answer` produces no finding (that is
  `validateGraphProseRefs`' surface, not this one);
- returns a deterministic, sorted array; returns `[]` on an empty `bodies` map;
- `formatOrderingInversions` names both ends of every pair.

**Recommended model:** sonnet

---

## Unit 2 — warn-level wiring in `validate-graph.ts`, with a grandfather baseline

**Scope.**

Files that change:
- `packages/intentionsutil/scripts/validate-graph.ts` — imports, a baseline
  loader, the warn call site, one stdout summary line, and the header comment.
- `packages/intentionsutil/ordering-inversion-baseline.json` — **new**, the
  grandfather list.
- `packages/intentionsutil/scripts/write-ordering-baseline.ts` — **new**, the
  small regenerator that produces that file.

Out of scope: any change to the sensor warn block (`:149-198`), to
`validateGraphProseRefs`' call (`:206`), or to the empty-store/usage guards
(`:85-131`) — those last are the surface of two separately parked siblings.

**a) Shared pair-baseline loader.** `validate-graph.ts:63-83` already carries
`isProseRefBaselineEntry` + `loadBaseline()`, which parse a JSON array of
two-string-field objects into a `Set` of `"<a>|<b>"` keys. The ordering baseline
needs the identical shape with different field names. Extract one
`loadPairBaseline(path: string, fieldA: string, fieldB: string): Set<string>`
and have both callers use it. Preserve the existing error text verbatim for the
prose case by interpolating the field names:
`` `${path}: expected a JSON array of {${fieldA}, ${fieldB}} objects` `` — for
`("ref", "referencedBy")` that reproduces the current string exactly. Keep the
throw-on-malformed behaviour (no defensive default), per
`.claude/rules/code-style.md`.

**b) Baseline file.** `packages/intentionsutil/ordering-inversion-baseline.json`
— a JSON array of `{ "from": "...", "to": "..." }` objects, sorted by `from`
then `to`, two-space indented, trailing newline, so regeneration produces
minimal diffs. Sibling of the two existing baselines in the same directory. Its
"why" belongs in the `validate-graph.ts` header (JSON has no comments — the same
arrangement `:26-32` uses for the prose baseline): it grandfathers the pairs
that already existed when the lint landed so the new check does not
retroactively spam every writer, it should not grow, and an entry whose pair is
no longer reported is dead and should be dropped at the next regeneration.

**c) Regenerator.** `packages/intentionsutil/scripts/write-ordering-baseline.ts`:

```
node --import tsx/esm packages/intentionsutil/scripts/write-ordering-baseline.ts <intentionsDir> --out <path>
```

Both arguments **required, no defaults** — same reasoning the header at
`validate-graph.ts:35-46` records for `<intentionsDir>` (a cwd-relative default
turned "not a graph" into a vacuous clean pass), and an `--out` argument rather
than a stdout redirect because a worktree-isolated session's Bash tool refuses
redirect-bearing commands. Body: `listNodesStrict` + `readNodeBody` (identical
to `validate-graph.ts:200-203`), then `findOrderingInversions`, then
`writeFileSync` of the sorted JSON. Use it to produce the initial file, so the
baseline's contents are reproducible and reviewable rather than hand-typed.

**d) Warn call site.** Insert immediately after the
`validateGraphProseRefs(...)` call (`validate-graph.ts:206`) — `nodes` and
`bodies` are already in scope there and must be reused; **do not re-read bodies
or build a second map**. Shape copied literally from the sensor warn block
(`:184-198`):

```ts
const orderingBaseline = loadPairBaseline(orderingBaselinePath, "from", "to");
const inversions = findOrderingInversions(nodes, bodies).filter(
  (i) => !orderingBaseline.has(`${i.from}|${i.to}`),
);
if (inversions.length > 0) {
  process.stderr.write(`warning — ordering inversion\n${formatOrderingInversions(inversions)}\n…`);
}
```

Never `throw`, never `process.exit` — the script still exits 0. The comment
above the block states the non-fatal reason by **cross-referencing** the sensor
block's existing rationale (`:149-183` — the `guard`-job / `needs: guard`
outage), not by restating it, and adds the one reason specific to this check:
the mention itself is usually a legitimate cross-reference, so the finding is a
shortlist entry a session confirms by reading both nodes.

**e) Summary line.** Add a fourth `process.stdout.write` beside the three at
`:208-217`:
`ok — ordering inversions: <N> new (reported on stderr, never fatal), <M> grandfathered`.

**f) Header comment.** The header lists the script's passes as a numbered list
(`:1-19`). Add a fourth entry for the ordering-inversion lint, in the same
voice, noting it is reported and never fatal.

**Dependencies:** Unit 1.

**Recommended model:** opus

---

## Unit 3 — `[ORDERING-INVERSIONS]` digest table and the audit-skill doc entry

**Scope.**

Files that change:
- `packages/intentionsutil/src/digest.ts` — one new table function plus one
  entry in `renderTables`.
- `packages/intentionsutil/test/digest.test.ts` — new `describe` block.
- `.claude/skills/align-audit/SKILL.md` — one bullet in the Step 2 table list
  and the table name added to the Step 3 shortlist sentence.

Out of scope: `packages/intentionsutil/scripts/graph-digest.ts` — it already
assembles `DigestInput` with `nodes` + `bodies` (`digest.ts:39-44`), so the new
table needs no new input plumbing.

**Table.** Add `tableOrderingInversions(input: DigestInput): string` beside
`tableDanglingRefs` (`digest.ts:296-373`), which is the closest model: same
per-node body scan, same sorted rows, same single-line header with counts. It
calls `findOrderingInversions(input.nodes, input.bodies)` — the **whole** set,
with no baseline subtraction; the digest's job is to show the audit everything,
and the baseline is a write-path noise control only. Rows are
`  <renderId(from)> -> <renderId(to)>`; ids **must** go through `renderId`
(`digest.ts:56-69`) — an unescaped id can forge check-table lines in the LLM
auditor's first-read context, which is exactly what that function exists to
prevent. Header: the pair count plus a one-clause statement of the condition;
`[ORDERING-INVERSIONS] none` when empty, matching every sibling table's empty
form (e.g. `digest.ts:215-217`). Cap itemized rows with an
`ORDERING_INVERSION_LIMIT` constant mirroring `NEAR_DUP_LIMIT`
(`digest.ts:236-242`), reporting the full count in the header and
`  ... and N more` below the cap, so Section 2 stays inside the output budget as
the graph grows.

Register it in `renderTables` (`digest.ts:412-425`) between `tableDanglingRefs`
and `tableStoredDefaults`.

**Tests** (`packages/intentionsutil/test/digest.test.ts`). Add
`describe("ORDERING-INVERSIONS table")` after the DANGLING-REFS block
(`:282-349`), reusing that file's `anode` fixture builder, its `input()` helper,
and its `section()` block extractor (`:68`). Cases: a flagged pair appears with
both ids; a plain cross-reference does not; `none` on a clean graph; the
existing output-budget test (`:363-387`) and the byte-identical-determinism test
(`:398-401`) still pass unchanged.

**Doc.** `.claude/skills/align-audit/SKILL.md` enumerates every digest table the
audit reads (Step 2, the bulleted list ending with the `[STORED-DEFAULTS]`
bullet). Add an `[ORDERING-INVERSIONS]` bullet after the `[DANGLING-REFS]` one,
saying what it carries and that it is a **shortlist, never a disposition** — a
pair is a real finding only after reading both nodes confirms the earlier node's
scope genuinely depends on the later one; and add the table's name alongside
`[NEAR-DUP-STATEMENTS]` and `[DANGLING-REFS]` in the Step 3 shortlist sentence.
Leaving this list stale would itself be the doctrine inconsistency
`strategy-graph-integrity` exists to prevent.

**Sandbox caveat for the implementer.** `.claude/skills/` is inside the sandbox
write-deny carve-out (`.claude/rules/sandbox.md`). Editing `SKILL.md` fails
read-only under the default sandbox; retry that single edit with
`dangerouslyDisableSandbox: true`. The two `packages/` edits need no override.

**Dependencies:** Unit 1.

**Recommended model:** sonnet

---

## Reuse

- `packages/intentionsutil/src/id-refs.ts:31` `buildIdRefMatchers(prefixes)` and
  `:74` `extractIdRefs(text, matchers, vocab, selfId)` — the tested
  "what ids does this text name" primitive, already shared by
  `validateGraphProseRefs` and the digest's DANGLING-REFS table. Reuse verbatim;
  never re-derive an id regex (it encodes the solved over-matching trap).
- `packages/intentionsutil/src/schema.ts:1780-1831` `validateGraphProseRefs` —
  the vocabulary/prefix/matcher construction (`:1787-1797`) and the
  co-location convention: a body-dependent graph check lives in `schema.ts`
  beside `validateGraph`, is exported separately, and is called separately from
  the script's `main()`.
- `packages/intentionsutil/src/sensors.ts:155-174` `findUnboundRegisteredSensorNames`
  and `:180-196` `formatUnboundSensorNames` — the exact find/format split and
  the returns-a-diagnostic-throws-nothing contract to copy.
- `packages/intentionsutil/scripts/validate-graph.ts:184-198` — the literal
  non-fatal wiring pattern (compute, `stderr.write` when non-empty, keep going,
  exit 0) and the outage rationale to cross-reference.
- `packages/intentionsutil/scripts/validate-graph.ts:200-206` — the `bodies`
  map already built once per run; reuse it, do not re-read node bodies.
- `packages/intentionsutil/scripts/validate-graph.ts:63-83` `loadBaseline` /
  `isProseRefBaselineEntry` — generalize into the shared `loadPairBaseline`.
- `packages/intentionsutil/src/planlint.ts:29-70` — the grandfather-baseline
  contract ("should NOT grow going forward"; remove an entry once its violation
  is fixed) whose wording the new baseline's header note should follow.
- `packages/intentionsutil/src/holds.ts:36-42, 76-91` `HOLD_KINDS` /
  `holdIdFor`, and `packages/intentionsutil/src/waits.ts:73` `waitIdFor` — the
  canonical derived-blocker id derivations; use them for the exclusion and in
  the fixtures, never literal id strings.
- `packages/intentionsutil/src/schema.ts:1507-1546` `checkBlockedByCycles` — the
  placement/style precedent for a `blocked_by`-walking function in `schema.ts`,
  including its "skip an unresolved target, rule 13 owns it" discipline.
- `packages/intentionsutil/src/digest.ts:296-373` `tableDanglingRefs`,
  `:66-79` `renderId`, `:236-242` `NEAR_DUP_LIMIT` — the table shape, the id
  escaping, and the cap pattern.
- `packages/intentionsutil/test/sensors.test.ts:146-236` and
  `packages/intentionsutil/test/digest.test.ts:68, 231-349` — fixture and
  block-extraction style for the new test blocks.
- `packages/intentionsutil/src/store.ts:166-170` `readNodeBody` — the only body
  accessor; the regenerator script uses it via the same
  `listNodesStrict` + `readNodeBody` loop as `validate-graph.ts`.

## Verification

Unit suites for the package (both changed test files, and the whole package
suite to catch a barrel or type regression):

```verify
npx vitest run --project packages/intentionsutil --root . packages/intentionsutil/test/schema.test.ts packages/intentionsutil/test/digest.test.ts
```

```verify
npx vitest run --project packages/intentionsutil --root .
```

Typecheck and lint (the lint script also runs the type-safety-escape check over
added lines):

```verify
.claude/skills/dispatch-propagate/scripts/run-typecheck.sh
```

```verify
.claude/skills/dispatch-propagate/scripts/run-lint.sh
```

End-to-end against the live store — this is the load-bearing check: the script
must still **exit 0**, must print the new `ok — ordering inversions:` summary
line, and — once the baseline is generated — must print **no**
`warning — ordering inversion` block:

```verify
node --import tsx/esm packages/intentionsutil/scripts/validate-graph.ts intentions
```

Manual steps and judgment calls:

- **Regenerate, then read, the baseline.** Run the regenerator against
  `intentions`, then read every row of
  `packages/intentionsutil/ordering-inversion-baseline.json` once. At planning
  time (c192d1bb) the predicate yielded 45 pairs; expect a number of that order,
  and treat a wildly different count as a predicate bug, not a graph change.
  This read **is** the draft's "worth running once over the whole graph when
  built" instruction. Do **not** fix any pair found: routing a genuine inversion
  to a fix is the `/align-audit` session's disposition, and a pair touching
  strategy or virtue substance routes to the author
  (`strategy-graph-integrity`'s autonomy condition). Note anything that looks
  like a real inversion in the PR description for the audit to pick up.
- **Prove the warn actually fires.** Temporarily delete one entry from the
  baseline, re-run the script, and confirm exactly that pair prints under
  `warning — ordering inversion` **and the script still exits 0**; then restore
  the entry. A silent lint is the failure mode most worth ruling out.
- **Check the digest table by eye.** Run
  `node --import tsx/esm packages/intentionsutil/scripts/graph-digest.ts --tables-only`
  and confirm `[ORDERING-INVERSIONS]` renders in the fixed table order between
  `[DANGLING-REFS]` and `[STORED-DEFAULTS]`, with the full (un-baselined) count
  and readable rows.
- **Confirm the doc edit landed.** `.claude/skills/align-audit/SKILL.md`'s Step 2
  list names the new table and Step 3 includes it among the shortlists — the
  edit needing the sandbox override is the one most likely to be silently
  dropped.


## Provenance

Finalized 2026-08-21 by a per-node `/align-tactics` round against
`origin/main` c192d1bb, from the draft retained by the 2026-08-12 `/align`
interview. Draft body was the statement line only; everything above is new.
The four dated `clarifications` in this node's frontmatter carry the round's
drift-review findings.

**One reconciliation the caller made, named here so the record is not
self-contradicting.** The round's drift review, run before the plan phase
measured the live store, read the scope narrowly: "the lint surface is
`scripts/validate-graph.ts` plus its finder in `schema.ts`; a digest table is
out of scope." The plan phase then measured 45 pre-existing candidate pairs
and concluded that a grandfather baseline is unavoidable — at which point a
`validate-graph.ts`-only scope would freeze those 45 pairs inside a JSON file
no reader ever opens, defeating this node's own statement ("surfaced for
session disposition"). Unit 3 therefore resolves the scope question the other
way, and clarification 3 records the resolved reading rather than the
provisional one. The caller accepted the extension rather than parking it,
on three grounds: the node's own rationale already says the whole-graph run
"may surface inversions that already exist" and the digest is where a
`/align-audit` session reads them; the drift phase itself marked its scope
premise `material: false` / `plan_depends: false`; and the extension serves
`strategy-graph-integrity`'s digest-first condition rather than deviating from
it. Recorded so a reviewer can overturn it deliberately: dropping Unit 3
requires also re-deciding what surfaces the grandfathered pairs.

**Anchor caveat.** `tactic-supersession-edge-and-terminal` is in flight at
`phase: implement` on the same two files (`schema.ts`, `digest.ts`), adding
numbered `validateGraph` rules and another `renderTables` entry. Line numbers
cited above will shift; every anchor is paired with a symbol name, and this
plan claims no numbered rule, so there is no contention for a rule slot.
Re-check the `path:line` anchors against the working tree before editing.

**Round-record note.** Three immaterial drift observations about
`strategy-graph-integrity`'s own record — not about this node — are carried by
`tactic-ordering-inversion-lint-drift-observations`, minted born-parked in the
same landing. A per-node session may not write clarifications onto a serving
strategy, so that carrier is their only legal home.
