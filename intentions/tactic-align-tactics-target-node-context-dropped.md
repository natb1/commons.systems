---
id: tactic-align-tactics-target-node-context-dropped
kind: tactic
statement: align-tactics.js's tactic-mode plan phase drops
  target_node.rationale, target_node.body, and target_node.phase entirely —
  buildPlanPrompt only ever sees the bare statement string, so a fresh
  finalize/re-plan round's plan-authoring agent never receives the node's own
  accumulated evidence, and target_node.phase (the documented
  finalize-vs-re-plan discriminator) is never read anywhere in the script
owner: ai
status: codified
parent: null
rationale: "Discovered 2026-07-31 during a tactic-target /align-tactics round on
  tactic-stopped-session-blocks-node, while assembling the Workflow args per
  SKILL.md/references/tactic-target.md's documented shape `target_node: { id,
  statement, rationale, body, phase }`. `grep -n \"target_node\\.\"
  .claude/workflows/align-tactics.js` returns exactly ONE hit, at the
  `targetSummary` line (`... : \"Finalize/re-plan the single tactic
  \\\"${(_a.target_node && _a.target_node.id) || '?'}\\\": ${(_a.target_node &&
  _a.target_node.statement) || ''}\"`). Tracing forward: `planTactics`
  (tactic-mode branch) constructs its one entry from only `t.id` and
  `t.statement`
  (temp_ref/slug_hint/statement/claude_eligible/draft_source_id/existing_id) —
  no rationale, no body. `buildPlanPrompt(strategy, tactic, gather)` embeds that
  object verbatim as the 'Tactic to plan' JSON block, so rationale/body never
  reach the plan agent's prompt, and nothing in the prompt instructs the agent
  to Read the node's own file from the worktree. Separately,
  `references/tactic-target.md` states `target_node.phase` is 'how the
  Workflow's tactic-mode prompts tell finalize from re-plan', and
  `references/write-path.md` repeats the same claim — but no code anywhere in
  align-tactics.js branches on `_a.target_node.phase`; the single grep hit above
  is for `.id`/`.statement` only. The finalize-vs-re-plan distinction the docs
  describe is therefore not implemented in the Workflow at all; whatever
  correctness exists today comes entirely from the SKILL-side apply-result
  writer choosing `phase` per its own documented rule, independent of anything
  the Workflow computed. For the round that discovered this, the gap was
  compensated per-invocation by directing a `reuse_hunts` entry to read the
  target node's own file directly and surface its content as gather-phase
  reuse-candidate notes (which DO reach `buildPlanPrompt` via the `gather`
  argument) — but that is a workaround an args-assembler must remember to add
  every time, not a fix, and a round that omits it silently produces a
  lower-quality plan with no error or park to signal the loss. Filed separately
  per the sole-tracker-recording convention (strategy condition: every defect
  lands as a tactic, never a side channel) rather than folded into the unrelated
  tactic whose round discovered it."
reading: null
gap: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention:
  boost: 20
  override: null
  rationale: "Wave B of the bootstrap three-band interim scale (50/20/10): a real,
    verified pipeline-quality gap in /align-tactics' own tactic-mode plan
    authoring, but not a hard block — an args-assembling session can (and, for
    the discovering round, did) compensate per-invocation via an explicit
    reuse_hunt directing an agent to read the target node's own file, and no
    data is lost or corrupted, only silently thinned unless a caller remembers
    the workaround. Contrast Wave A (tactic-stopped-session-blocks-node): that
    gap silently voids a hard containment invariant with no workaround available
    to the affected session; this one degrades plan quality but is
    self-correctable by any competent caller who reads this node before invoking
    the Workflow. Finalized 2026-07-31 via a tactic-target /align-tactics round:
    status is now codified and phase implement, carrying a full clean-session
    plan (Units 1-2) in the body."
  tier: 1
phase: done
execution:
  branch: tactic-align-tactics-target-node-context-dropped
  pr: 3017
  attempts: {}
  markers:
    - planned
    - qa-done
    - reviewed
  strategy_fingerprint: null
  fix: null
  conflict: null
  completion:
    mergedAt: 2026-08-03T05:46:04Z
    mergeCommitSha: 64ec89dce3e81cfe562c478b16cfcbc569bbd285
    graphCommitSha: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# align-tactics.js's tactic-mode plan phase drops target_node.rationale, target_node.body, and target_node.phase entirely — buildPlanPrompt only ever sees the bare statement string, so a fresh finalize/re-plan round's plan-authoring agent never receives the node's own accumulated evidence, and target_node.phase (the documented finalize-vs-re-plan discriminator) is never read anywhere in the script

## Context

`/align-tactics <tactic-id>` (the per-node tactic-target flow) hands the
Workflow script `.claude/workflows/align-tactics.js` an `args.target_node`
object documented at `.claude/workflows/align-tactics.js:34-35` and at
`.claude/skills/align-tactics/references/tactic-target.md:83` as
`{ id, statement, rationale, body, phase }`. The SKILL-side caller assembles
all five fields correctly. The Workflow then throws three of them away.

In the tactic-mode plan branch
(`.claude/workflows/align-tactics.js:956-967`) the script does
`const t = _a.target_node || {};` and synthesizes the one-entry `planTactics`
list from **only** `t.id` and `t.statement`:

```js
planTactics = [
  {
    temp_ref: t.id || 'target',
    slug_hint: t.id || 'target',
    statement: t.statement || '',
    claude_eligible: true,
    draft_source_id: t.id || null,
    existing_id: t.id || null,
  },
];
```

`t.rationale`, `t.body`, and `t.phase` are read nowhere. That object is what
`buildPlanPrompt` serializes verbatim via `untrusted(asJson(tactic))`
(`.claude/workflows/align-tactics.js:760`), so the Opus plan-authoring agent —
the agent that writes the body that will **replace the node's existing body
wholesale** (`.claude/skills/align-tactics/references/write-path.md:104-113`) —
never sees:

- **`rationale`** — the node's own recorded diagnosis and provenance.
- **`body`** — the node's accumulated evidence: root-cause analysis, path:line
  anchors, caveats, instructions retained from the draft. On a finalize this is
  clobbered by whatever the agent writes without ever having read it; on a
  re-plan the agent cannot reconcile a body it was never shown, so it authors a
  fresh plan over in-flight work.
- **`phase`** — the documented finalize-vs-re-plan discriminator.
  `grep -n '\.phase\b' .claude/workflows/align-tactics.js` returns **zero**
  matches: the field is read nowhere in the script, directly contradicting
  `references/tactic-target.md:91-98` ("it is how the Workflow's tactic-mode
  prompts tell finalize from re-plan"). `buildPlanPrompt` has exactly one
  instruction path — "Produce a FULL clean-session plan" — with no
  finalize/re-plan branch and no whole-node-reconciliation bar
  (`.claude/skills/align-tactics/references/tactic-target.md:160-172`,
  clarification 32).

Consequence: every per-node finalize discards the draft's own evidence, and
every per-node re-plan behaves as a fresh authoring that silently overwrites
in-flight plan substance.

**Intended outcome.** The Workflow's tactic-mode plan phase carries the full
`target_node` substance into the plan prompt, and the plan prompt branches on
`phase` into an explicit FINALIZE or RE-PLAN disposition carrying the
already-authored doctrine from `references/tactic-target.md`. This makes the
code match documentation that is already correct — no contract is being
invented, so **no SKILL or reference-doc edit is in scope** (see "Out of scope"
in Unit 1).

**Greenfield vs. brownfield.** The greenfield design *is* the minimal change
here: the input contract, the schemas, and the doctrine prose all already exist
and are already correct. Only the Workflow's consumption of them is broken. No
migration path is needed — the change is purely additive to a prompt input
object that is not schema-validated on the way in (`PLAN_SCHEMA`,
`.claude/workflows/align-tactics.js:311-335`, governs only the agent's
*output*), so no caller, schema, or stored artifact changes shape.

**Concurrency warning — read before editing.** PR #2982
(`tactic-align-tactics-tactic-mode-drift-gate`, currently in review) edits the
**same file** and inserts its own sentinel-sliced helper `computePhaseGates`
immediately after `// <<< resolveTempRefs <<<`
(`.claude/workflows/align-tactics.js:430`), changes `buildDriftPrompt`'s
signature, adds `.claude/skills/dispatch-propagate/scripts/align-tactics-gates-probe.mjs`,
appends a driver block to `test-align-tactics-tempref.sh`, and adds a CI step.
This plan's insertion points are deliberately chosen to sit **elsewhere** in
each file. After `git merge origin/main`, if #2982 has landed:

- `driftProceed` may have become `planProceed` / `decomposeProceed` at the
  tactic-mode plan-gate site — re-locate the branch by the quoted code above,
  not by line number, and leave that gate exactly as you find it.
- Do not touch, rename, or re-home `align-tactics-gates-probe.mjs` or its
  driver block.

Every anchor below is a line number in `origin/main` at `954c662f`; **re-locate
by the quoted text**, since earlier edits in this same unit shift the file.

---

## Unit 1 — Carry `target_node.rationale`/`body`/`phase` into the tactic-mode plan prompt, and branch it on `phase`

### Scope

Single file: `.claude/workflows/align-tactics.js` (1096 lines on
`origin/main`). Apply 1a–1f in order.

**1a. Docblock.** At `.claude/workflows/align-tactics.js:34-35` the `args IN`
block reads:

```
 *     target_node: {              // tactic mode ONLY: the single tactic being (re)planned
 *       id, statement, rationale, body, phase },
```

Extend the comment to state the consumption contract (this is where the
information belongs — the skill-side docs already state the caller side):

```
 *     target_node: {              // tactic mode ONLY: the single tactic being (re)planned
 *       id, statement, rationale, body, phase },
 *       // ALL FIVE fields ride into the plan prompt (synthesizeTargetPlanTactic
 *       // + tacticModeFraming below). `body` must be the node's FULL current
 *       // body text below the frontmatter fence: the plan agent reconciles
 *       // against it and its returned body_markdown REPLACES it wholesale
 *       // (references/write-path.md), so a truncated body silently loses
 *       // content. `phase` is the finalize-vs-re-plan discriminator
 *       // (null/absent/"draft" => finalize; any in-flight phase => re-plan).
```

**1b. Two pure helpers.** Insert immediately **after** the `asJson` const
(`.claude/workflows/align-tactics.js:450`) and **before** the
`// --- prompt builders ---` banner (line 452). Use the sentinel convention
`resolveTempRefs` already uses (`.claude/workflows/align-tactics.js:339-430`)
so Unit 2's probe can slice each function. Each sentinel string must appear
**exactly once** in the file — the probe fails loudly otherwise, mirroring
`.claude/skills/dispatch-propagate/scripts/align-tactics-tempref-probe.mjs:40-56`.

```js
// --- tactic-mode target-node context -----------------------------------------

// synthesizeTargetPlanTactic — build the one-entry `planTactics` record for
// mode: "tactic" from args.target_node.
//
// The defect this fixes: this record used to carry only id/statement, and it is
// the object buildPlanPrompt serializes verbatim (`untrusted(asJson(tactic))`),
// so the plan agent never saw the node's own rationale, its accumulated body
// evidence, or its phase. All three now ride through. PURE (no fs/git) so the
// probe can eval it in isolation.
//
// >>> synthesizeTargetPlanTactic: sliced + eval'd by test-align-tactics-target-context.sh >>>
function synthesizeTargetPlanTactic(targetNode) {
  const t = targetNode || {};
  return {
    temp_ref: t.id || 'target',
    slug_hint: t.id || 'target',
    statement: t.statement || '',
    // The node's own accumulated evidence — the primary input to a finalize or
    // a re-plan, not decoration.
    rationale: t.rationale || '',
    body: t.body || '',
    // null (not undefined) so the discriminator is explicit in the serialized
    // JSON the agent reads.
    phase: t.phase == null ? null : t.phase,
    claude_eligible: true,
    draft_source_id: t.id || null,
    existing_id: t.id || null,
  };
}
// <<< synthesizeTargetPlanTactic <<<

// tacticModeFraming — the finalize-vs-re-plan prose block for buildPlanPrompt.
//
// Returns [] in strategy mode (a decomposed tactic is new work with no prior
// body to reconcile). In tactic mode it branches on the target node's phase.
// The doctrine text is spliced from
// .claude/skills/align-tactics/references/tactic-target.md:40-56 (draft/raw ->
// finalize) and :58-73 + :160-172 (soft-frozen -> re-plan, clarification 32's
// whole-node reconciliation bar) — author-approved wording, not re-derived.
//
// Phase values are the schema enum (packages/intentionsutil/src/schema.ts:36-43):
// draft | align-tactics | implement | qa | review | main-qa | done. A null,
// empty, or "draft" phase means never-decomposed; anything else is in-flight.
// ("fix" is NOT a phase — the CI-fix interrupt lives in execution.fix.)
//
// >>> tacticModeFraming: sliced + eval'd by test-align-tactics-target-context.sh >>>
function tacticModeFraming(mode, tactic) {
  if (mode !== 'tactic') return [];
  const t = tactic || {};
  const phase = t.phase == null ? '' : String(t.phase);
  const isFinalize = phase === '' || phase === 'draft';
  const head = isFinalize
    ? [
        'TACTIC-MODE DISPOSITION — FINALIZE. This node has never been decomposed',
        '(its phase is absent/draft), so this run authors its FIRST full',
        'clean-session plan body.',
      ]
    : [
        `TACTIC-MODE DISPOSITION — RE-PLAN. This node is soft-frozen at phase`,
        `"${phase}": work is already in flight against the body below. This run`,
        'RECONCILES that node, it does not author a plan from zero.',
      ];
  const shared = [
    '',
    'The `rationale` and `body` fields on the tactic below are the node\'s OWN',
    'accumulated evidence — the recorded diagnosis, root cause, path:line',
    'anchors, caveats, and instructions its author put there. Read them as the',
    'PRIMARY input. The gather-phase reuse evidence and the strategy substance',
    'are context around them, never a replacement for them.',
    '',
    'YOUR RETURNED body_markdown REPLACES THE NODE BODY WHOLESALE. Anything in',
    '`body` that is still true and still needed — root-cause analysis, path:line',
    'anchors, explicit caveats, instructions addressed to sibling or child nodes',
    '— must be carried forward into what you author, or it is permanently lost.',
    'Anything in it that your plan contradicts must be rewritten, not left',
    'standing beside it.',
  ];
  const tail = isFinalize
    ? [
        '',
        'WHOLE-NODE RECONCILE (clarification 32): rewrite any stale draft',
        'narrative so nothing in the body contradicts the finalized plan. Do NOT',
        'sweep the serving strategy\'s other draft tactics and do NOT propose a',
        'rounds bump — neither is this run\'s job.',
      ]
    : [
        '',
        'WHOLE-NODE RECONCILIATION BAR (clarification 32): reconcile the node\'s',
        'WHOLE body — the ## Context prose, EVERY unit, ## Reuse, and',
        '## Verification — against the full current strategy substance shown',
        'above, in this one pass. A one-bullet delta that leaves a sibling unit',
        'or a verification step contradicting the amendment is an INCOMPLETE',
        'amendment. Preserve verbatim every unit the current strategy substance',
        'does not invalidate (units already implemented against this body are',
        'cited by landed work); revise only what it actually invalidates, and',
        'say explicitly in ## Context what changed and why. Do NOT relabel or',
        'renumber the phase — the caller preserves the in-flight phase on',
        'landing.',
      ];
  return head.concat(shared, tail, [
    '',
    'Whichever disposition applies, the body_markdown you return must satisfy',
    'the PLAN BODY SCHEMA above in full.',
  ]);
}
// <<< tacticModeFraming <<<
```

**1c. Use the synthesizer at the drop site.** Replace the tactic-mode branch at
`.claude/workflows/align-tactics.js:956-967` — the
`} else if (mode === 'tactic') { const t = _a.target_node || {}; planTactics = [ … ]; }`
block quoted in ## Context — with:

```js
} else if (mode === 'tactic') {
  planTactics = [synthesizeTargetPlanTactic(_a.target_node)];
}
```

Leave the surrounding `if (!driftProceed)` gate and the strategy-mode `else`
branch untouched (that gate is #2982's scope, not this unit's).

**1d. Make `buildPlanPrompt` mode-aware.** At
`.claude/workflows/align-tactics.js:705`, change the signature from
`function buildPlanPrompt(strategy, tactic, gather)` to
`function buildPlanPrompt(strategy, tactic, gather, mode)`. Inside it:

- Replace the "Strategy intent" block (`.claude/workflows/align-tactics.js:750-757`,
  the `Serving strategy id:` line plus the `untrusted([...statement,
  success_signal...].join('\n'))` call) with a mode-conditional block. Strategy
  mode keeps the thin two-field form verbatim (N parallel planners; the
  decompose agent already reasoned over the full substance). Tactic mode gets
  the full substance, because the re-plan reconciliation bar is defined against
  "the full current strategy substance". Reuse the object shape
  `buildDriftPrompt` already assembles at
  `.claude/workflows/align-tactics.js:588-600` rather than inventing a new one:

```js
    `Serving strategy id: ${strategy.id || '?'}`,
    'Strategy intent:',
    mode === 'tactic'
      ? untrusted(
          asJson({
            id: strategy.id,
            statement: strategy.statement,
            rationale: strategy.rationale,
            success_signal: strategy.success_signal,
            reading: strategy.reading,
            gap: strategy.gap,
            conditions: strategy.conditions || [],
            clarifications: strategy.clarifications || [],
            rounds: strategy.rounds || null,
          })
        )
      : untrusted(
          [
            `statement: ${strategy.statement || ''}`,
            `success_signal: ${strategy.success_signal || ''}`,
          ].join('\n')
        ),
```

  (Side benefit: `asJson` renders a structured `success_signal` correctly,
  where the thin form's template interpolation yields `[object Object]`.)

- Splice the framing block in immediately **before** the `'Tactic to plan:'`
  line (`.claude/workflows/align-tactics.js:759`), so the disposition is stated
  before the data it applies to:

```js
    '',
    ...tacticModeFraming(mode, tactic),
    '',
    'Tactic to plan:',
    untrusted(asJson(tactic)),
```

  The surrounding array is `[...].join('\n')`, so an empty spread contributes
  nothing in strategy mode beyond one blank line.

**1e. Pass `mode` at the call site.** At
`.claude/workflows/align-tactics.js:978`, change
`agent(buildPlanPrompt(strategy, t, gather), {` to
`agent(buildPlanPrompt(strategy, t, gather, mode), {`.

**1f. Surface `phase` in `targetSummary`.** At
`.claude/workflows/align-tactics.js:793-796`, the tactic-mode arm of the
`targetSummary` ternary feeds the reuse-hunt prompts
(`buildExplorePrompt`, line 477) and currently states id + statement only.
Append the disposition so the reuse hunt knows whether it is hunting for a
fresh plan or a reconciliation:

```js
const targetSummary =
  mode === 'tactic'
    ? `Finalize/re-plan the single tactic "${(_a.target_node && _a.target_node.id) || '?'}" (phase: ${(_a.target_node && _a.target_node.phase) || 'draft/raw — finalize'}): ${(_a.target_node && _a.target_node.statement) || ''}`
    : `Decompose strategy "${strategy.id || '?'}" into its minimum signal-validating tactic subtree this round.`;
```

If #2982 has landed, its `parkTarget` const sits directly below this ternary —
leave it alone.

### Out of scope

- **The assemble-phase tactic-mode branch**
  (`.claude/workflows/align-tactics.js:1022-1033`), which also emits only
  `id`/`statement`/`body_markdown`. The docblock
  (`.claude/workflows/align-tactics.js:46-48`) promises only the
  `body_markdown` merge on output, and the SKILL-side writer reads phase from
  its own `args.target_node`, so nothing consumes a widened output. Do not
  widen it.
- **`PLAN_SCHEMA`** (`.claude/workflows/align-tactics.js:311-335`) — it
  constrains only the agent's *output*. The `tactic` input object is not
  validated, so these additions are schema-safe by construction.
- **The `driftProceed` plan gate** and `buildDriftPrompt` — PR #2982's scope.
- **All files under `.claude/skills/align-tactics/`.** `tactic-target.md:83`
  and `:91-98` and `write-path.md:104-113` already describe exactly the
  behavior this unit implements; the fix makes the code match correct docs, so
  there is nothing to sync. (Independently: an auto-mode worker cannot edit
  SKILL/reference doctrine prose — such an edit would park the node for no
  gain.)

### Recommended model

opus — prompt-doctrine authoring plus a cross-cutting edit to a 1096-line
script with a known concurrent editor; the judgment about what the finalize and
re-plan framing must say is the substance of the unit.

---

## Unit 2 — CI vector: sentinel-slice probe for both new helpers

### Scope

`run-unit-tests.sh` has no vitest mapping for `.claude/workflows/*`, and its
`test-*.sh` glob over `.claude/skills/dispatch-propagate/scripts/` only runs
when `RUN_PR_SCRIPTS` is set (auto-detect sets it solely for changed paths
under that scripts dir). So a PR touching only `align-tactics.js` runs nothing.
The established vector is a sentinel-slice probe wired unconditionally into the
`hook-tests` job of `.github/workflows/unit-tests.yml`
(`.github/workflows/unit-tests.yml:184-260`; rationale comment at lines
201-208). `align-tactics.js` is a Workflow-tool script (top-level `await`,
injected globals) and cannot be imported by node, hence the slice-and-eval
approach.

**New file 1:**
`.claude/skills/dispatch-propagate/scripts/align-tactics-target-context-probe.mjs`

Copy the scaffold of
`.claude/skills/dispatch-propagate/scripts/align-tactics-tempref-probe.mjs`
verbatim — the `readFileSync` + `fileURLToPath(new URL('../../../workflows/align-tactics.js', import.meta.url))`
path resolution (probe sits three dirs below `.claude/`), the `countOccurrences`
exactly-once sentinel guard (lines 33-58), the `.trim()` on the slice (its
comment at lines 63-67 explains why it is load-bearing: an untrimmed slice
triggers ASI after `return`), the `new Function('return ' + fnSource)()` eval,
and the `ok(...)` / `failures` / final-token reporting (lines 79-100, 137-142).

Changes from the scaffold:

- Self-identifying prefix `align-tactics-target-context-probe`, final success
  token `align-tactics-target-context-probe: ALL PASS`.
- Generalize the single START/END pair into a small `sliceFn(source, start, end,
  label)` helper reusing `countOccurrences`, and slice **two** functions:

```js
const SPECS = {
  synthesizeTargetPlanTactic: {
    start: "// >>> synthesizeTargetPlanTactic: sliced + eval'd by test-align-tactics-target-context.sh >>>",
    end: '// <<< synthesizeTargetPlanTactic <<<',
  },
  tacticModeFraming: {
    start: "// >>> tacticModeFraming: sliced + eval'd by test-align-tactics-target-context.sh >>>",
    end: '// <<< tacticModeFraming <<<',
  },
};
```

  Keep the exactly-once check per sentinel and `process.exit(1)` with a
  descriptive stderr line on violation.

Assertion vectors:

*`synthesizeTargetPlanTactic`*
1. Full node `{ id: 'tactic-x', statement: 's', rationale: 'r', body: 'B', phase: 'qa' }`
   → `rationale === 'r'`, `body === 'B'`, `phase === 'qa'` (the regression this
   tactic exists to prevent), plus `temp_ref === 'tactic-x'`,
   `existing_id === 'tactic-x'`, `draft_source_id === 'tactic-x'`,
   `claude_eligible === true`.
2. Draft node `{ id: 'tactic-y', statement: 's' }` (no rationale/body/phase) →
   `rationale === ''`, `body === ''`, `phase === null` (explicitly `null`, not
   `undefined` — assert with `Object.is(out.phase, null)`).
3. `synthesizeTargetPlanTactic(undefined)` does not throw and yields
   `temp_ref === 'target'`, `phase === null`.
4. Serialization guard — `JSON.stringify(out)` for vector 1 contains
   `"rationale"`, `"body"`, and `"phase"` (this is exactly what the plan prompt
   embeds; the fields must survive `JSON.stringify`, so an `undefined` value
   would silently vanish).

*`tacticModeFraming`*
5. `tacticModeFraming('strategy', {...})` → `[]` (strict `Array.isArray` +
   `length === 0`).
6. `tacticModeFraming('tactic', { phase: null })` → joined text includes
   `'FINALIZE'` and does **not** include `'RE-PLAN'`.
7. `tacticModeFraming('tactic', { phase: 'draft' })` → includes `'FINALIZE'`
   (draft is equivalent to absent).
8. `tacticModeFraming('tactic', { phase: 'implement' })` → includes `'RE-PLAN'`
   and the literal `'"implement"'`, and does **not** include `'FINALIZE'`.
9. `tacticModeFraming('tactic', { phase: 'qa' })` → includes `'RE-PLAN'`.
10. Both tactic-mode branches include `'REPLACES THE NODE BODY WHOLESALE'`
    (the carry-forward instruction must never be dropped from either
    disposition).
11. `tacticModeFraming('tactic', undefined)` does not throw and yields the
    FINALIZE branch.

**New file 2:**
`.claude/skills/dispatch-propagate/scripts/test-align-tactics-target-context.sh`
(mode `0755`).

Mirror `.claude/skills/dispatch-propagate/scripts/test-align-tactics-tempref.sh`
exactly: `#!/usr/bin/env bash`, a header comment carrying the same CI-vector
rationale (run-unit-tests.sh has no `.claude/workflows/*` mapping; this file is
wired unconditionally into the `hook-tests` job; keep it wired), `set -euo
pipefail`, `FIXTURE_DIR="$(cd "$(dirname "$0")" && pwd)"`, `source
"$FIXTURE_DIR/dispatch-test-fixture.sh"` (which provides `SCRIPT_DIR`,
`assert_eq`, `report_results` —
`.claude/skills/dispatch-propagate/scripts/dispatch-test-fixture.sh:18,36,50`),
then:

```bash
echo "Test: align-tactics tactic-mode target-node context"

out_tc=$(node "$SCRIPT_DIR/align-tactics-target-context-probe.mjs")

assert_eq "align-tactics target-context: all probe vectors pass" \
  "align-tactics-target-context-probe: ALL PASS" \
  "$(printf '%s' "$out_tc" | tail -n1)"

report_results
```

Use `printf '%s'`, never `echo`, on captured output (`.claude/rules/shell-json.md`
— mechanically linted for net-new lines in committed `.sh` files).

**Do not** append this block to `test-align-tactics-tempref.sh`: PR #2982
appends its own `align-tactics-gates-probe` block at that exact location.

**Edit:** `.github/workflows/unit-tests.yml`. Add one step to the `hook-tests`
job at the **end** of the step list — immediately after
`- name: Run graph fast-path guard script tests` /
`run: .github/scripts/test-check-graph-fast-path.sh`
(`.github/workflows/unit-tests.yml:257-258`), before the blank line preceding
`test-integrity:` at line 260. Appending at the end (rather than beside the
existing align-tactics step at lines 209-210) keeps this out of #2982's
conflict region:

```yaml
      - name: Run align-tactics tactic-mode target-node context tests
        run: .claude/skills/dispatch-propagate/scripts/test-align-tactics-target-context.sh
```

### Out of scope

- Any change to `align-tactics-tempref-probe.mjs`, `test-align-tactics-tempref.sh`,
  `qa-fix-partition-probe.mjs`, or their CI steps.
- Any vitest suite. `.claude/workflows/*` has no vitest mapping by design; do
  not add one.

### Dependencies

Unit 1 — the sentinels and both helper functions must exist before the probe
can slice them.

### Recommended model

sonnet — mechanical transcription of an established, fully-specified pattern
with the assertion vectors enumerated above.

---

## Reuse

- **`.claude/workflows/align-tactics.js:588-600`** (`buildDriftPrompt`'s
  "Strategy record" object) — the established shape for embedding full strategy
  substance in a prompt. Unit 1d reuses this object literal rather than
  inventing one. `buildDecomposePrompt` does the same at lines 677-688.
- **`.claude/workflows/align-tactics.js:447,450`** (`untrusted`, `asJson`) — the
  existing serialization/wrapping helpers. No new embedding mechanism is needed;
  `buildPlanPrompt` already serializes whatever `tactic` object it is handed.
- **`.claude/workflows/align-tactics.js:339-430`** (`resolveTempRefs` and its
  `// >>> … >>>` / `// <<< … <<<` sentinel pair) — the pure-function +
  sentinel convention Unit 1b adopts so Unit 2 can slice it.
- **`.claude/skills/dispatch-propagate/scripts/align-tactics-tempref-probe.mjs`**
  — the complete probe scaffold Unit 2 copies: path resolution, exactly-once
  sentinel guard (lines 33-58), the load-bearing `.trim()` (lines 63-67),
  `new Function` eval, `ok`/`throws` helpers, `ALL PASS` token.
- **`.claude/skills/dispatch-propagate/scripts/test-align-tactics-tempref.sh`**
  — the driver shape Unit 2 mirrors (fixture sourcing, `out_*=$(node …)`,
  `assert_eq` on the final token, `report_results`).
- **`.claude/skills/dispatch-propagate/scripts/dispatch-test-fixture.sh:18,36,50`**
  — `SCRIPT_DIR`, `assert_eq`, `report_results`. Source it; do not re-implement.
- **`.claude/skills/align-tactics/references/tactic-target.md:40-56, 58-73,
  160-172`** — the author-approved finalize / re-plan / whole-node-reconciliation
  wording Unit 1b splices into `tacticModeFraming`. Do not re-derive new wording.
- **`packages/intentionsutil/src/schema.ts:36-43`** (`Phase`) — the canonical
  enum (`draft | align-tactics | implement | qa | review | main-qa | done`;
  `fix` is deliberately absent, per the comment at lines 30-34). Unit 1b's
  comment cites it rather than restating a different list.
- **`.github/workflows/unit-tests.yml:184-260`** (`hook-tests` job) — the
  unconditional CI vector for SUTs outside the dispatch scripts dir; the
  rationale comment at lines 201-208 explains why the step must be added here.

## Verification

Run from the worktree root.

Syntax of the edited Workflow script (it parses clean today, so a failure here
is this change's):

```verify
node --check .claude/workflows/align-tactics.js
```

Both new helpers slice and behave (Unit 1 + Unit 2; this is the direct
regression guard for the dropped fields):

```verify
node .claude/skills/dispatch-propagate/scripts/align-tactics-target-context-probe.mjs
```

The driver as CI runs it:

```verify
.claude/skills/dispatch-propagate/scripts/test-align-tactics-target-context.sh
```

Regression guard — Unit 1b inserts two new sentinel pairs into the same file,
and the pre-existing tempref probe fails loudly if its own sentinels stop
appearing exactly once:

```verify
.claude/skills/dispatch-propagate/scripts/test-align-tactics-tempref.sh
```

Prose-rule lint (the new `.sh` file's net-new lines must not `echo` a captured
variable into `jq`, per `.claude/rules/shell-json.md`):

```verify
.claude/skills/dispatch-propagate/scripts/lint-prose-rules.sh
```

Manual checks:

- **The field-drop is actually gone.** `grep -n '\.phase\b'
  .claude/workflows/align-tactics.js` returns zero matches on `origin/main`
  today; after Unit 1 it must return the `tacticModeFraming` /
  `synthesizeTargetPlanTactic` / `targetSummary` reads. Confirm no *other*
  `target_node` field is still read as id/statement-only in the plan path.
- **CI step is wired.** Confirm `test-align-tactics-target-context.sh` appears
  exactly once in `.github/workflows/unit-tests.yml` under `hook-tests`, and
  that #2982's `align-tactics-gates-probe` step (if merged) is still present and
  untouched.
- **End-to-end, observe in production.** The real signal is the next per-node
  `/align-tactics <tactic-id>` run. On a **finalize** of a draft that carries
  substantive body evidence, the authored `body_markdown` must visibly carry
  that evidence forward (root-cause analysis, path:line anchors, caveats) rather
  than reading as if written from the statement alone. On a **re-plan** of a
  soft-frozen tactic, the returned body must preserve the still-valid units
  verbatim and say in `## Context` what changed. Neither is machine-checkable
  here — it is a judgment call on the first live run after this lands. If a
  finalize still reads as statement-only, the SKILL-side caller is not
  populating `target_node.body`/`rationale`/`phase` (see the surfaced premise
  about the caller), and that is a separate defect on the caller, not on this
  fix.
- **Known friction.** Unit 2 writes new files under
  `.claude/skills/dispatch-propagate/scripts/`. An autonomous auto-mode worker
  may have edits under `.claude/skills/**` denied by the self-modification
  classifier. Sibling test scripts in that directory do land through the chain
  routinely (and PR #2982 plans the same), so attempt it normally; if the edit
  or the commit is denied, park to office-hours naming the file-edit block
  rather than hunting a workaround. Do not attempt any edit under
  `.claude/skills/align-tactics/` — nothing there needs to change.

## needs-main residue

`/qa-fix` PR #3017, first pass: all 11 script-verifiable QA items PASSed
(`node --check`, the new target-context probe and its driver, the sibling
tempref probe, the prose-rule lint, sentinel-count/wiring/call-site greps —
see the `<!-- dispatch:qa-summary -->` PR comment for the full list). The
remaining 2 QA plan items are the two production-observation checks this
node's own `## Verification` section already named; the disposition Workflow
classified both `needs-main` (no code defect — planned deferral, not
autonomously fixable now).

- **id 12** — A live `/align-tactics <tactic-id>` finalize round produces a
  plan reflecting the node's prior body.
  - Expected outcome: the finalized `body_markdown` visibly carries forward
    the target node's prior `rationale`/`body` evidence (root-cause analysis,
    path:line anchors, caveats) where still valid, rather than reading as if
    authored from the bare `statement` alone.
  - Finding: not machine-checkable — judging whether generated prose
    "visibly carries forward" prior evidence vs. reads as statement-only is a
    subjective quality call on LLM output, not a deterministic pass/fail.
  - Verifiability: AUTHOR — barrier: subjective judgment on LLM-generated
    plan-quality/faithfulness; no deterministic check exists.
- **id 13** — A live `/align-tactics <tactic-id>` re-plan round reconciles
  the whole node without content loss.
  - Expected outcome: every unit the current strategy substance does not
    invalidate is preserved verbatim, `## Context` states explicitly what
    changed and why, no sibling unit or verification step is left
    contradicting the amendment, and the in-flight phase is not
    relabeled/renumbered.
  - Finding: not machine-checkable — judging "whole-node reconciliation" /
    absence of silent content loss against the doctrine bar is a subjective
    completeness call on generated prose, not a deterministic check.
  - Verifiability: AUTHOR — barrier: subjective judgment on LLM-generated
    plan-quality/faithfulness; no deterministic check exists.

Both items are drained at `main-qa` (post-merge, `review → main-qa`), where
`office_hours` review is the correct venue for an AUTHOR-only judgment call —
neither is autonomously verifiable.

## Office-hours sitting 2026-08-09 — id 12 confirmed, id 13 retired

**Disposition: id 12 confirmed on live output; id 13 retired as unanswerable as
scoped.** Author ruling at the 2026-08-09 sitting. `phase: done`, park cleared.
All 11 machine-verifiable QA items on #3017 had already passed; these two prose
judgments were the whole remainder.

### id 12 — carry-forward on a finalize round: CONFIRMED

Judged against a real round rather than in the abstract, per the park's own
instruction. Subject: commit `a58beafc` (2026-08-09), the `/align-tactics`
finalize of `tactic-blocked-session-invisible-to-census`. That node is an
unusually clean test because it was *filed* hours earlier the same day
(`5b12d9ce`) with a dense root-cause record, so there was specific prior
analysis available to either carry forward or lose.

The authored `body_markdown` carries it forward visibly. Every specific from the
prior filing survives into the finalized body — session `f2416fda` (3
mentions), the `ENOTIMP` API error (3), local commit `6886ffa9` (2), the
`sync-repair` job name (23), `HELD_FOR_DEBUG_COUNT` (7), the ~71-hour outage
duration (3), and the absorbing-state caveat about a blocked background session
having no interlocutor (2). It carries **48 `path:line` anchor mentions** across
15+ distinct anchors, and lands the standard structure: `## Context`, four
`## Unit` sections, `## Verification`.

That is the opposite of the failure mode the item was written to catch — a body
authored from the bare `statement` with the prior investigation discarded.

### id 13 — re-plan preservation: RETIRED, not answered

No true re-plan round has occurred since the park was written on 2026-08-03, so
there is nothing live to judge and the item was retired rather than answered on
a hypothetical.

Searched at the sitting across `origin/main`: four nodes were scope-drift
demoted on 2026-08-05 (`tactic-align-tactics-mark-terminal-skipped`,
`tactic-pace-exempt-ceiling-fanout`,
`tactic-invalid-state-transcript-intervention`, `tactic-invalid-state-lane`),
but every one re-entered the implement lane directly without a further
`/align-tactics` pass. The two 2026-08-06 commits whose subjects both read
`finalize tactic-reap-safety-behind-branch-false-positive` are one real finalize
plus a one-character follow-up that de-backticked a prose-ref placeholder id —
not a re-plan.

The doctrine bar for id 13 remains `tactic-target.md` clarification 32. It is
unenforced by this node from here on; if a future re-plan round should be
checked against it, that needs its own node.
