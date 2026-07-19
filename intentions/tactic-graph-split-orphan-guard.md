---
id: tactic-graph-split-orphan-guard
kind: tactic
statement: "Prevent an align-skill node split from orphaning its new sibling on
  main: (a) the align-tactics skill must land a split-parent edit and its new
  sibling in one graph-commit call, never parent-first; and (b) validate-graph
  must flag prose-level dangling node-id references (backtick-quoted, id-shaped,
  unresolved) so main cannot go CI-green with an incomplete split"
owner: ai
status: codified
parent: null
rationale: "Byproduct of the 2026-07-18 /align-strategy near-miss review. A
  re-plan split tactic-align-tactics-mechanical-floor's Unit 1 into a new
  born-parked sibling (tactic-align-provenance-lint-doctrine). The parent edit
  landed on main first (single-file commit c037cec7); the separate sibling-add
  graph-commit then lost the push race 5x and deleted its scratch branch
  (nothing landed), leaving main with the parent describing a split to a sibling
  that did not exist. Recovered same-day (032768e5) - no data lost, graph valid.
  Two latent hazards: (a) nothing enforced landing a split-parent + its new
  sibling in ONE graph-commit call; (b) the dangling reference was prose-only
  (rationale/clarifications/body), and validate-graph checked structural edges
  only, so main stayed CI-green with an incomplete split. Finalized 2026-07-18
  /align-tactics per-node pass: hazard (a) fixed as align-tactics/SKILL.md
  discipline edits; hazard (b) fixed as a new validateGraph rule reusing
  digest.ts's existing id-shape/backtick/live-pruned-missing classification,
  gated by a checked-in baseline that grandfathers the corpus's pre-existing
  prose-dangling refs (18 found via a body-only scan on 2026-07-18: 12 already
  exempt as 'planned' - mentioned by another open tactic - 6 not) so the new
  rule does not retroactively break origin/main. Author decision (2026-07-18):
  kept as one node under strategy-graph-native-dispatch rather than re-homing
  hazard (b)'s unit to strategy-graph-integrity."
reading: null
gap: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: review
execution:
  branch: tactic-graph-split-orphan-guard
  pr: 2899
  attempts: {}
  markers:
    - planned
    - qa-done
  strategy_fingerprint: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Prevent an align-skill node split from orphaning its new sibling on main

Finalized 2026-07-18 via `/align-tactics tactic-graph-split-orphan-guard`
(per-node finalize path). Two independent hazards from the same incident;
kept as one node (author decision, 2026-07-18) under the write-path owner
`strategy-graph-native-dispatch` rather than re-homing hazard (b) to
`strategy-graph-integrity`.

## Context

A `/align-tactics` re-plan split `tactic-align-tactics-mechanical-floor`'s
Unit 1 into a new born-parked sibling, `tactic-align-provenance-lint-doctrine`.
The two nodes reached `origin/main` via **separate** `graph-commit` operations
rather than one atomic call:

- the parent edit landed first as a single-file commit `c037cec7`;
- the separate sibling-add `graph-commit` then lost the push race five times
  against a busy `main`, deleted its throwaway `graph/**` scratch branch, and
  exited 1 (nothing landed — the documented "busy main" outcome).

The result: `main` carried the parent describing a split to a sibling node
whose file did not exist. Recovered the same day (`032768e5` added the missing
sibling). No data was lost and the graph stayed valid — but two latent hazards
produced the near-miss and remain:

- **Hazard (a) — split-atomicity is unenforced.** `graph-commit` is atomic
  *within a single call* (bundles every node's file into one commit, stamps
  checks via the scratch branch, fast-forwards that one SHA onto `main` —
  all-or-nothing), so landing a split-parent edit and its new sibling in
  **one** call already closes the race. Nothing in the align skills currently
  says so, or stops a parent-first, sibling-second two-call sequence.
- **Hazard (b) — validate-graph misses prose-level dangling refs.** The
  dangling reference was prose-only: the parent named the sibling in its
  `rationale`/`clarifications`/body, but not in any structural edge
  (`blocked_by`, `parent`, `validates`, `serves`, `recovers`).
  `validate-graph`/`validateGraph` (`packages/intentionsutil/src/schema.ts:606`)
  checks structural referential integrity only, so `c037cec7` passed CI green
  with an incomplete split.

## Unit 1 — align-tactics split-landing discipline (Hazard a)

**Scope.** Edit `.claude/skills/align-tactics/SKILL.md` only — four
insertions, no restructuring:

- `align-tactics/SKILL.md:125-135` (the "Tactic target — per-node finalize or
  re-plan" section's closing sentence, "**Both cases land the single
  pre-existing node** via `graph-commit --base`..."). Insert a new paragraph
  right after this sentence (before "There is **no strategy edit**..." at line
  135) carving out the exception: if a soft-frozen re-plan (or a Step-2 `split`
  disposition at strategy scope) discovers the tactic must split into a new
  born-parked sibling, that sibling is genuinely new work, but it must never
  land via a separate later `graph-commit` call — land the parent edit and the
  new sibling in the **same** `graph-commit --base "$BASE" <tactic-id>
  <new-sibling-id>` call (the `--base` manifest still covers only the
  pre-existing parent id; the new sibling has no `origin/main` blob and is
  simply absent from it). Name the 2026-07-18 near-miss (`c037cec7` /
  `032768e5`) as the concrete incident this closes.
- `align-tactics/SKILL.md:284-291` (Step 2 item 2, "Each draft child ... is
  **finalized, split, merged, or pruned**"). Append a short parenthetical
  cross-reference after "split" pointing at the Step 5 item 3 example below —
  e.g. "(a split lands its parent edit and new sibling atomically in one
  `graph-commit` call, never two — see Step 5 item 3)".
- `align-tactics/SKILL.md:499-511` (Step 5 item 3, "One `graph-commit` per
  tactic, or a small batch (...) in one call"). Extend the parenthetical
  example list to add "a split-parent tactic alongside its new born-parked
  sibling", and add one explicit sentence directly after the code block
  (currently ending line 506, before "Pass `--base`..." at line 508) stating
  plainly that a split's parent and new sibling must never land as two
  separate calls, citing the same 2026-07-18 incident.
- `align-tactics/SKILL.md:579-592` (Re-evaluation mode item 2, "**Amends,
  prunes, or confirms** each open tactic..."). Add "splits" to the
  disposition-verb list ("Amends, prunes, splits, or confirms") with a
  one-clause pointer to the same atomic-landing rule.

**Explicitly out of scope:** do not edit `.claude/skills/align-strategy/SKILL.md`.
`/align-tactics` (not `/align-strategy`) owns tactic splits
(`align-tactics/SKILL.md:102`); align-strategy's existing bundling convention
at `align-strategy/SKILL.md:453-460` ("Bundle any draft tactic nodes authored
in the same pass into the same `graph-commit` call as their serving
strategy...") already covers align-strategy's own draft-tactic-bundling case
and needs no change for this hazard.

**Recommended model:** sonnet — four well-specified prose insertions into an
existing, house-styled document; the wording and anchors are given above, no
open design judgment.

**Dependencies:** none.

## Unit 2 — extract shared id-reference scanning helpers (Hazard b, part 1)

**Scope.** Create `packages/intentionsutil/src/id-refs.ts`, a new **pure**
module (no I/O), by extracting logic currently inlined in
`packages/intentionsutil/src/digest.ts`'s `tableDanglingRefs`
(`digest.ts:306-363`) — move, don't reimplement:

- `escapedPrefixAlt(prefixes: Set<string>): string` — move verbatim from
  `digest.ts:281-285` (currently module-local, unexported).
- `buildIdRefMatchers(prefixes: Set<string>): { idShape: RegExp; backtickRe:
  RegExp; wildcardRe: RegExp; anchoredIdShape: RegExp }` — extract the four
  regex constructions inlined at `digest.ts:311-321` into one function.
- `classifyRef(ref: string, storeIds: Set<string>, deletedIds: Set<string>):
  "live" | "pruned" | "missing"` — move verbatim from the `classify` closure
  at `digest.ts:323-324`.
- `extractIdRefs(text: string, matchers: ReturnType<typeof
  buildIdRefMatchers>, vocab: Set<string>, selfId: string): Set<string>` —
  generalize the per-node scanning loop at `digest.ts:329-362` (today reads
  only `input.bodies.get(node.id)`) into a pure function over arbitrary
  `text`, returning the distinct referenced ids found. Preserve the exact
  matching semantics: a `missing` classification requires a backtick-quoted,
  id-shaped token; a non-backtick token counts only when already in `vocab`;
  wildcard spans (`` `tactic-x-*` ``) are excluded; a self-reference (`ref ===
  selfId`) is excluded.

Refactor `tableDanglingRefs` to call these four extracted functions instead of
its inlined logic. **No behavior change** — the function's rendered output
(missing/pruned/live counts, MISSING/PRUNED/wildcard rows, the `mentionsRef`
"planned" annotation at `digest.ts:365-381`) must be byte-identical to before
the refactor; verify by running the existing digest tests unmodified. Delete
the now-dead inlined regex/classify logic from `digest.ts` once callers route
through `id-refs.ts`. `mentionsRef` itself stays in `digest.ts` (a
digest-specific "is this id mentioned by another open tactic" concept, not a
generic id-ref primitive) — but see Unit 3, which needs a standalone version
of it.

**Recommended model:** sonnet — mechanical extract-function refactor with an
explicit no-behavior-change invariant, verified by an unmodified existing test
suite (`packages/intentionsutil/test/digest.test.ts:283-333+`,
`describe("DANGLING-REFS table", ...)`).

**Dependencies:** none (independent of Unit 1). Unit 3 depends on this unit.

## Unit 3 — new validateGraph prose-dangling-reference rule (Hazard b, part 2)

This is the judgment-heavy unit: the check gates the CI-required `graph/**`
fast path (`.github/workflows/graph-fast-path.yml:52` runs
`validate-graph.ts` on every `graph-commit` push, over the **whole** corpus,
not just the ids in that commit) — a wrong exemption design either reopens
false positives that permanently block every future `graph-commit`, or
silently fails to catch the hazard it exists for.

**Pre-existing-corpus finding (2026-07-18, informs the baseline step below).**
Running `node --import tsx/esm packages/intentionsutil/scripts/graph-digest.ts
--tables-only` today shows the corpus already has 18 `missing`-classified
body-only dangling refs. 12 are already `[planned: open tactic mentions it]`
(auto-exempt below); 6 are `[no open mention]`: `delegation-food-supply`,
`issue-siblings`, `strategy-stoicism-premeditatio-malorum`, `tactic-only`,
`tactic-signal-path-attention`, `virtue-anthropic-claude-growth`. A hard-fail
rule with no grandfathering would immediately and permanently break the
`graph/**` CI fast path for every future `graph-commit` call, unrelated ones
included — a baseline mechanism (below) is mandatory, not optional polish.
Widening the scan to `rationale`/`clarifications[].answer`/`attention.rationale`
(this hazard's actual scope — the real incident's dangling ref lived in
`rationale`/`clarifications`, not the body) will likely surface additional
pairs beyond these 6; do not hand-copy this list — regenerate fresh against
the corpus as it exists at implementation time.

**Scope.**

1. Add an exported function in `packages/intentionsutil/src/schema.ts`, near
   `validateGraph` (`schema.ts:606`) — e.g. `validateGraphProseRefs(nodes:
   IntentionNode[], bodies: Map<string, string>, deletedIds: string[],
   baseline: Set<string>): void`. Keep it **separate** from `validateGraph`
   (which stays a pure function of `IntentionNode[]` alone — do not add a
   `bodies`/`deletedIds` parameter to it); reuse `IntentionSchemaError` and
   `validateGraph`'s "collect every problem, throw one error listing all of
   them" contract (`schema.ts:601-604,808-810`) rather than inventing a
   second error shape.
2. For every node, scan `node.statement`, `node.rationale` (skip if `null`),
   `node.attention?.rationale` (skip if `attention` is `null`), each
   `node.clarifications[i].answer`, and `bodies.get(node.id)` (skip if
   absent) using Unit 2's `buildIdRefMatchers`/`classifyRef`/`extractIdRefs` —
   do not reimplement the regex/classification. Build `vocab`/`prefixes`
   exactly as `tableDanglingRefs` does today (`digest.ts:307-310`, now via the
   shared helpers).
3. For each `"missing"`-classified reference, apply the same "planned"
   exemption `tableDanglingRefs` already computes (`digest.ts:365-381`
   `mentionsRef`: is this id mentioned in the `statement` or body of some
   *other* currently-open, i.e. `phase !== "done"`, tactic?). Export a
   standalone version of `mentionsRef` from `digest.ts` taking `(nodes,
   bodies)` instead of a `DigestInput`, and reuse it — do not duplicate the
   closure.
4. A still-missing, non-planned reference is checked against `baseline` (a
   `Set<string>` of `"<ref>|<referencedBy>"` keys); a pair in `baseline` is
   silently exempted. Every remaining pair is a problem, collected and thrown
   via `IntentionSchemaError`.
5. **Generate the baseline file at implementation time**, against the corpus
   as it exists then (not the 2026-07-18 list above, which will be stale by
   implementation time). Write a one-off script (or a `--dump-baseline` mode
   on the wiring script from step 6) that runs the widened scan (step 2's
   field list, not just the body) across the current corpus and emits every
   `"missing"`, non-`"planned"` pair as `{ref, referencedBy}` JSON. Save to a
   new checked-in file `packages/intentionsutil/prose-ref-baseline.json`
   (JSON array of `{ref, referencedBy}` objects, sorted for a stable diff).
   JSON has no comments — put the explanation ("grandfathers pre-existing
   prose references that predate this check; not meant to grow; fix new
   violations at the source rather than adding here") in the wiring script's
   header comment instead.
6. Wire into `packages/intentionsutil/scripts/validate-graph.ts`
   (`validate-graph.ts:1-23` today, a ~20-line script). After the existing
   `validateGraph(nodes)` call: gather `bodies` (reuse `readNodeBody`
   (`store.ts:112-116`) or mirror `graph-digest.ts:63-74`'s `gatherInput()`
   read-once-and-derive pattern) and `deletedIds`. `deletedNodeIds()`
   (`graph-digest.ts:49-61`) is currently local to `graph-digest.ts`, and both
   scripts now need it — relocate it into a small shared script-layer module
   (e.g. `packages/intentionsutil/scripts/lib-deleted-node-ids.ts`; keep it
   out of `src/`, since it shells out to `git` and `digest.ts`'s own doc
   comment says the module stays pure — "Shelled here (the digest module
   stays pure)", `graph-digest.ts:39`), and import it from both
   `graph-digest.ts` and `validate-graph.ts`. Load
   `prose-ref-baseline.json`, call `validateGraphProseRefs(nodes, bodies,
   deletedIds, baseline)`. Keep the existing `ok — N nodes` stdout line on
   success; append a line reporting how many prose refs were checked/exempted.
   This script is the CI-required check — it must exit non-zero with a clear
   message on a real violation, exit 0 otherwise.
7. Add unit tests in `packages/intentionsutil/test/schema.test.ts` (near the
   end, after the existing rule tests around `schema.test.ts:1201+`, following
   the `toThrow(/message-substring/)` idiom at `schema.test.ts:744` and the
   "one throw lists everything" pattern at `schema.test.ts:900`). Cases: a
   `missing` backtick ref in `rationale` throws; one in
   `clarifications[].answer` throws; one in the body throws; a `live` ref
   (resolves to a real node) passes; a `pruned` ref (in `deletedIds`) passes;
   a `"planned"` ref (mentioned by another open tactic) passes with no
   baseline entry needed; a ref present in `baseline` passes even though
   otherwise missing-and-not-planned; a non-backtick prose compound that
   merely looks id-shaped (e.g. `tactic-only` used as English prose, not
   backtick-quoted) never flags.

**Recommended model:** opus — judgment-heavy: exemption semantics gate the CI
fast path for every future `graph-commit` across the whole corpus; the plan
leaves the exact `mentionsRef` export shape and baseline-generation script
mechanics for implementation time.

**Dependencies:** Unit 2 (reuses `id-refs.ts`'s shared matchers/classifier).

## Reuse

- `digest.ts:281-285,306-363` — id-shape/backtick/classify/`mentionsRef`
  logic (Units 2 & 3): extract and reuse, never re-derive.
- `store.ts:112-116` `readNodeBody`; `graph-digest.ts:63-74` `gatherInput()`'s
  read-once-and-derive-body pattern (Unit 3).
- `graph-digest.ts:49-61` `deletedNodeIds()` (Unit 3 — relocate to a shared
  script-layer module rather than duplicating the git-log call).
- `schema.ts:606-810` `validateGraph`'s "collect all problems, throw one
  `IntentionSchemaError`" contract and the `IntentionSchemaError` type (Unit 3
  — match the existing contract, don't invent a second one).
- `align-strategy/SKILL.md:453-460` bundling-convention phrasing as the
  house-style template for Unit 1's new sentences.

## Verification

```verify
npx vitest run --project packages/intentionsutil --root .
npx tsc --noEmit -p packages/intentionsutil/tsconfig.json
npx tsx packages/intentionsutil/scripts/validate-graph.ts intentions
node --import tsx/esm packages/intentionsutil/scripts/graph-digest.ts --tables-only
```

- The `validate-graph.ts intentions` run above must exit 0 against the real,
  un-modified corpus once the baseline (Unit 3 step 5) is generated and
  checked in. A nonzero exit here after landing Unit 3 means the baseline
  generation missed a pre-existing case — regenerate it correctly; per
  `.claude/rules/test-integrity.md`, do not weaken the new rule's matching to
  make it pass.
- Manually re-read the four SKILL.md edit sites (Unit 1) once landed, end to
  end in context, confirming each reads naturally and doesn't contradict a
  neighboring sentence — prose-spec edits have no automated check.
- Observe in production: after this lands, confirm the next real
  `graph-commit` push from an unrelated future session still passes the
  `graph/**` fast-path CI check (`.github/workflows/graph-fast-path.yml:52`)
  — the real gate only runs inside that workflow, not locally.
