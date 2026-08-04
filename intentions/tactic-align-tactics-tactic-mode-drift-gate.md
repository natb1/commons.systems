---
id: tactic-align-tactics-tactic-mode-drift-gate
kind: tactic
statement: align-tactics.js's tactic-mode plan phase is gated on the strategy's
  round-decomposability verdict (`driftProceed`, which folds in
  `eligibility.decomposable`) instead of on a genuine per-node park — so a
  per-node `/align-tactics <tactic-id>` finalize is wrongly escalated whenever
  the serving strategy's signal path happens to be claimed by an unrelated
  in-flight child
owner: ai
status: codified
parent: null
rationale: "Found and empirically confirmed 2026-07-25 while running
  /align-tactics tactic-transition-node-stamp-landed-body (a per-node
  tactic-target finalize of an off-path bug-fix tactic, validates: []).
  .claude/workflows/align-tactics.js runs the DRIFT phase unconditionally for
  both modes (only the DECOMPOSE phase is skipped in tactic mode, per the mode
  !== 'tactic' guard at the decompose call site). The drift agent's ELIGIBILITY
  SANITY CHECK asks whether the STRATEGY is decomposable THIS ROUND — including
  'it has no non-draft child tactic already on its signal path' — a
  strategy-round concept that is orthogonal to finalizing one already-recorded,
  already strategy-endorsed off-path tactic (tactic-target.md: 'no strategy
  decomposition ... no rounds bump here'; the code's own inline comment on the
  plan-tactics branch says tactic mode should 'always plan it, unless drift
  parked it', contradicting the actual gate used). The unpatched code computed
  `planTactics = []` whenever `!driftProceed` for BOTH modes (driftProceed =
  drift.proceed === true), so a drift verdict of eligibility.decomposable=false
  (with side_a_failed_conditions=[] and parks=[]) silently skipped the plan
  phase in tactic mode too, producing tactics:[{...body_markdown:null}] and
  disposition 'escalated' with NO actual park recorded anywhere (drift.parks was
  empty) -- an unrecoverable dead end with no office_hours reason written to
  explain it, since align-tactics/SKILL.md's Step 2 only writes office_hours
  from result.parks, which was empty. Verified concretely: the exact same
  strategy/target_node args, re-run after patching the tactic-mode branch to
  gate only on `(drift.parks || []).length > 0` (ignoring
  eligibility.decomposable / driftProceed for mode==='tactic'), produced
  disposition 'completed_with_fixes' with a full authored plan body -- proving
  the escalation was a tooling defect, not a genuine
  requirement-ambiguity/scope-deviation/unverifiable-blocker per the autonomy
  contract's three park conditions (references/autonomy.md). (Finalized
  2026-07-27 via a per-node /align-tactics run: the strategy's sole
  validates-terminal, tactic-legacy-router-removal, had by then reached phase
  done (PR #2960), so this run's drift verdict returned proceed=true with no
  park, and the defect did NOT recur on this invocation — confirming the
  escalation is conditional on the signal-path-claimed state, not universal. The
  underlying code defect is still live and uncommitted in
  .claude/workflows/align-tactics.js as of this finalize; the full root-cause
  diagnosis, greenfield fix design (a mode-aware computePhaseGates(mode, drift)
  helper splitting the folded driftProceed boolean into
  decomposeProceed/planProceed, with the drift prompt itself threaded with
  mode), CI vector, and doc-sync units are authored in the body below, ready for
  /implement.)"
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
  branch: tactic-align-tactics-tactic-mode-drift-gate
  pr: 2982
  attempts: {}
  markers:
    - planned
    - qa-done
  strategy_fingerprint: null
  fix: null
  completion: null
validates: []
blocked_by:
  - tactic-hold-conflict-align-tactics-tactic-mode-drift-gate
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---

# align-tactics.js's tactic-mode plan phase is gated on the strategy's round-decomposability verdict (`driftProceed`, which folds in `eligibility.decomposable`) instead of on a genuine per-node park — so a per-node `/align-tactics <tactic-id>` finalize is wrongly escalated whenever the serving strategy's signal path happens to be claimed by an unrelated in-flight child

## Context

`/align-tactics` has two invocation shapes that route through the same Workflow
script `.claude/workflows/align-tactics.js` via `args.mode`:

- `mode: "strategy"` — decompose a whole strategy into a new round of tactics.
- `mode: "tactic"` — finalize (or re-plan) **one** pre-existing frozen tactic
  node. No decomposition, no draft sweep, no `rounds` bump.

The Workflow's `drift` phase produces one Opus verdict object whose `proceed`
boolean folds together two unrelated questions:

1. **Round decomposability** — may this strategy open another decomposition
   round? Criteria (inlined at `.claude/workflows/align-tactics.js:550-558`):
   `office_hours` null, signal unvalidated, the fresh-reading gate,
   **no non-draft child tactic already on its signal path**, and
   `rounds.count < 2`.
2. **Drift blockers** — Side A (a recorded `attributes.conditions` entry
   failed) and Side B (the plans depend on an unrecorded material premise).

Only (2) is meaningful for a per-node tactic finalize. But the plan phase gates
on the folded boolean:

- `.claude/workflows/align-tactics.js:954` — `if (!driftProceed) { planTactics = []; }`
- `.claude/workflows/align-tactics.js:1068` — `const deviation = !driftProceed || parks.length > 0;`

The consequence is a live false escalation: a `/align-tactics <tactic-id>` run
is wrongly parked whenever the **serving strategy's** signal path happens to be
claimed by an unrelated in-flight (or completed-but-unpruned) sibling tactic —
a fact that says nothing about whether this one node may be finalized. This
fires today on `strategy-graph-native-dispatch`, whose signal path is claimed by
a done-but-unpruned terminal, so every per-node finalize against it escalates.

The immediately-adjacent decompose gate at line 912 already has the correct
shape — `if (mode !== 'tactic' && driftProceed)` — so the defect is that the
plan gate and the deviation calculation dropped the mode carve-out that its
sibling gate applies.

Two things are wrong and both need fixing:

- **The prompt.** `buildDriftPrompt(strategy, gather)`
  (`.claude/workflows/align-tactics.js:541`) takes no `mode`, so the drift agent
  is handed the strategy-round eligibility criteria verbatim even during a
  per-node finalize, and dutifully returns `proceed: false`. No code-side gate
  change alone can rescue that verdict.
- **The gate.** `driftProceed` is one boolean serving two gates. Splitting it
  into two purpose-built gate flags follows the sibling precedent already cited
  in this file's own comment (`.claude/workflows/align-tactics.js:908-909`,
  "exactly like qa-fix.js's fix-plan gate" — `.claude/workflows/qa-fix.js:501`,
  whose fix-plan phase is gated on an independent flag rather than on an
  overloaded upstream boolean).

**Intended outcome.** In `mode: "tactic"` the drift review evaluates Side A and
Side B only, never round decomposability, and targets every park it emits at
the target tactic id. The plan phase proceeds unless that per-node review
actually blocked it. In `mode: "strategy"` behavior is unchanged apart from one
deliberate, belt-and-braces tightening described in Unit 1.

**Greenfield design.** Two independent signals out of the drift phase —
`eligibility.decomposable` (round-level, strategy mode only) and `proceed`
(drift blockers, both modes) — consumed by one pure, sentinel-delimited
`computePhaseGates(mode, drift)` helper that returns `{ decomposeProceed,
planProceed }`, with `mode` threaded into the drift prompt so the agent is
asked the right question in the first place. There is no brownfield migration
path to sequence: the Workflow file is stateless, has no persisted contract to
version, and its `DRIFT_SCHEMA` shape is unchanged by this fix — the greenfield
design lands directly.

---

## Unit 1 — Thread `mode` into the drift prompt and split the folded gate

### Scope

All edits are in **one file**: `.claude/workflows/align-tactics.js` (1096
lines). Every anchor below is a line number in the current `origin/main` copy;
apply edits in the order listed and re-locate by the quoted text, not by line
number, once earlier edits shift the file.

**1a. Add a `parkTarget` const.** Immediately after the `targetSummary` const
(`.claude/workflows/align-tactics.js:792-796`, the `const targetSummary =
mode === 'tactic' ? ... : ...;` ternary), add:

```js
// The node a park from this run must name. A per-node tactic-target session
// never writes the serving strategy (references/tactic-target.md, "Autonomy
// contract binds unchanged"), so a strategy-targeted park emitted from tactic
// mode would be unwritable by the SKILL caller.
const parkTarget =
  mode === 'tactic'
    ? (_a.target_node && _a.target_node.id) || ''
    : strategy.id || '';
```

**1b. Add the pure gate helper.** Insert immediately after the
`// <<< resolveTempRefs <<<` sentinel line
(`.claude/workflows/align-tactics.js:430`), before the
`// --- shared prompt fragments ---` banner at line 432. Use the same sentinel
convention `resolveTempRefs` uses so the CI probe in Unit 2 can slice it:

```js
// computePhaseGates — the decompose and plan phase gates, split out of the
// single `drift.proceed` boolean they used to share.
//
// The drift phase answers TWO independent questions and this function is the
// only place they are combined:
//   - eligibility.decomposable — "may this STRATEGY open another decomposition
//     round?" (office_hours null, signal unvalidated, fresh-reading gate, no
//     non-draft child already on the signal path, rounds.count < 2). This is a
//     strategy-round question; in tactic mode the drift prompt does not even
//     ask it (it pins the field to true) and nothing here reads it.
//   - proceed — "is this run free of drift blockers?" (Side A failed condition
//     / Side B material unrecorded premise). Meaningful in BOTH modes.
//
// Reading `proceed` alone for the plan gate was the defect: a per-node tactic
// finalize was escalated whenever the serving strategy's signal path happened
// to be claimed by an unrelated in-flight sibling.
//
// Fails CLOSED on a missing/garbled drift object: both gates false.
//
// >>> computePhaseGates: sliced + eval'd by test-dispatch-scripts.sh (align-tactics) >>>
function computePhaseGates(mode, drift) {
  const isTactic = mode === 'tactic';
  const d = drift || {};
  const proceed = d.proceed === true;
  const decomposable = !!(d.eligibility && d.eligibility.decomposable === true);
  return {
    decomposeProceed: !isTactic && proceed && decomposable,
    planProceed: isTactic ? proceed : proceed && decomposable,
  };
}
// <<< computePhaseGates <<<
```

The sentinel comment must appear **exactly once** each in the file (the probe
fails loudly otherwise, mirroring
`.claude/skills/dispatch-propagate/scripts/align-tactics-tempref-probe.mjs:40-56`).

**1c. Make `buildDriftPrompt` mode-aware.** Change the signature at
`.claude/workflows/align-tactics.js:541` from
`function buildDriftPrompt(strategy, gather)` to
`function buildDriftPrompt(strategy, gather, mode, targetNode)`, and inside it:

- Add at the top of the function body:
  ```js
  const isTactic = mode === 'tactic';
  // Side A / Side B park the node this run may actually write.
  const parkNoun = isTactic ? 'the target tactic' : 'the strategy';
  ```
- **Opening paragraph** (currently lines 543-546, "You are the two-sided
  drift-review agent for an /align-tactics round. You decide whether the
  strategy is decomposable this round and whether any premise the round would
  rely on drifts…"): make it mode-conditional. Keep the strategy-mode text
  verbatim. Tactic-mode text:

  > You are the two-sided drift-review agent for an /align-tactics **per-node
  > tactic finalize/re-plan**. Exactly ONE pre-existing tactic node is being
  > (re)planned against its serving strategy. You decide ONLY whether a drift
  > blocker prevents authoring that one node's plan. You do NOT decide whether
  > the serving strategy may open a new decomposition round. Reason over the
  > data below and the gather-phase evidence; author no graph writes.

- **ELIGIBILITY SANITY CHECK block** (currently lines 550-558): keep it
  **verbatim** for strategy mode. For tactic mode substitute:

  > TACTIC MODE — NO ROUND-ELIGIBILITY CHECK. This run finalizes or re-plans ONE
  > pre-existing tactic node. It opens no decomposition round, consumes no draft
  > tactics, and bumps no `rounds` counter. The strategy-round eligibility
  > criteria therefore DO NOT APPLY and you must NOT evaluate them: whether a
  > non-draft sibling tactic already sits on the strategy's signal path,
  > `rounds.count`, the fresh-reading gate, the strategy's `gap`/`reading`
  > state, and the strategy's own `office_hours`. A sibling tactic — in-flight
  > or completed-but-unpruned — claiming the signal path is EXPECTED and is NOT
  > a reason to block this node. Whether this node is selectable at all was
  > already decided upstream by the router's `frozenTacticSelectable` gate
  > before this run started; do not re-litigate it. Set
  > `eligibility.decomposable = true` with rationale
  > `"n/a — tactic mode: round decomposability is not evaluated for a per-node
  > finalize"`.
  >
  > Set `proceed=false` ONLY when Side A or Side B below blocks authoring THIS
  > node's plan. Target EVERY park you emit at the target tactic id given below
  > — never at the serving strategy. A per-node session never writes the
  > strategy, so a strategy-targeted park from this run is unwritable; if the
  > strategy's own record is what is incomplete, name that fact inside a park on
  > the target tactic.

- **Side A / Side B text** (currently lines 560-583): keep verbatim except
  replace the two literal occurrences of "park the strategy" with
  `` `park ${parkNoun}` `` so a tactic-mode run is told to park the tactic. Do
  not otherwise change the Side A/Side B doctrine, the categories, or the dated
  provenance-clause requirement (lines 585-589).

- **Closing "nothing blocks" line** (currently lines 591-592, "When nothing
  blocks the round, set proceed=true, side_a_failed_conditions=[], parks=[], and
  eligibility.decomposable=true."): for tactic mode read "When nothing blocks
  this node's plan, set proceed=true, side_a_failed_conditions=[], parks=[], and
  eligibility.decomposable=true (per the tactic-mode block above)."

- **Add the target-node record** to the prompt data in tactic mode only,
  immediately after the existing `'Strategy record:'` + `untrusted(asJson({...}))`
  block (lines 594-608). Insert:

  ```js
  isTactic
    ? [
        '',
        'Target tactic node (the ONE node being finalized/re-planned; park THIS id):',
        untrusted(
          asJson({
            id: (targetNode && targetNode.id) || '',
            statement: (targetNode && targetNode.statement) || '',
            rationale: (targetNode && targetNode.rationale) || '',
            phase: (targetNode && targetNode.phase) || null,
          })
        ),
      ].join('\n')
    : '',
  ```

  Deliberately omit `targetNode.body` — the full node body can be very large and
  the drift review judges premises, not plan substance; the plan phase already
  receives the node via `buildPlanPrompt`.

- The `DRIFT_SCHEMA` object (lines 129-190) is **unchanged**.

**1d. Update the drift call site and agent-death fallback.**

- Line 878: `const driftRes = await agent(buildDriftPrompt(strategy, gather), {`
  → `const driftRes = await agent(buildDriftPrompt(strategy, gather, mode, _a.target_node || {}), {`
- Fallback literal (lines 888-903): change `target: strategy.id || ''` to
  `target: parkTarget`, and make the `reason` mode-aware — tactic mode:
  `'drift-review agent returned null — cannot confirm this tactic is free of drift blockers without a drift verdict.'`;
  strategy mode keeps the existing wording. Leave
  `eligibility: { decomposable: false, rationale: 'drift agent returned null' }`
  and `proceed: false` as-is: `planProceed` is `proceed` in tactic mode, so the
  fallback still fails closed there.

**1e. Rewire the gates.**

- After line 904 (`const driftProceed = drift.proceed === true;`) add
  `const gates = computePhaseGates(mode, drift);`. Keep `driftProceed` — it is
  still the honest label for the drift log line at 905 — and extend that log
  line to include `decomposeProceed=${gates.decomposeProceed}` and
  `planProceed=${gates.planProceed}`.
- Line 912: `if (mode !== 'tactic' && driftProceed) {` → `if (gates.decomposeProceed) {`.
  Update the comment block at 908-910 to say the gate now reads the purpose-built
  `decomposeProceed` flag (still "exactly like qa-fix.js's fix-plan gate").
- Line 943: `log(\`decompose: skipped (mode=${mode}, driftProceed=${driftProceed})\`);`
  → report `decomposeProceed=${gates.decomposeProceed}` instead of `driftProceed`.
- Line 954: `if (!driftProceed) {` → `if (!gates.planProceed) {`. Update the
  adjacent comment at 950-952 so it says tactic mode plans the target node
  unless **this node's own** drift review blocked it.
- Line 1068: `const deviation = !driftProceed || parks.length > 0;`
  → `const deviation = !gates.planProceed || parks.length > 0;`
- Insert a park-synthesis belt immediately after the `const parks = []` chain
  (lines 1048-1051), before the outcome-envelope counts at 1055:

  ```js
  // A closed plan gate with no park recorded would emit disposition
  // "escalated" with no target the SKILL caller can act on. Synthesize one,
  // reusing the drift agent-death fallback's shape.
  if (!gates.planProceed && parks.length === 0) {
    parks.push({
      target: parkTarget,
      reason: `drift review did not clear this run to author plans (mode=${mode}, proceed=${drift.proceed === true}, decomposable=${!!(drift.eligibility && drift.eligibility.decomposable)}) but recorded no park.`,
      category: 'unverifiable-blocker',
    });
  }
  ```

**Deliberate strategy-mode tightening (call it out in the commit message).**
`planProceed` in strategy mode is `proceed && decomposable`, and
`decomposeProceed` gains the same `&& decomposable` conjunction. Today
`eligibility.decomposable` is written by the drift agent and read by **no**
gate; leaving it unread is what invited the fold in the first place. The drift
prompt already instructs the agent to set `proceed=false` whenever it sets
`decomposable=false` (lines 555-558), so this is a no-op on well-formed
verdicts, and the park-synthesis belt above makes the inconsistent-verdict case
produce an actionable park instead of an actionless escalation.

**Out of scope for this unit:**

- `buildCorpusPrompt` (`.claude/workflows/align-tactics.js:484-514`) and the
  `gatherJobs` fan-out (lines 807-844). The corpus scan keeps running
  unconditionally in both modes: its idempotency/overlap hits are genuinely
  useful for a tactic-mode reconciliation, and once the drift prompt no longer
  converts signal-path findings into an eligibility verdict, the scan's
  signal-path framing is inert rather than harmful. Do **not** add a mode branch
  there.
- `DRIFT_SCHEMA`, `DECOMPOSE_SCHEMA`, `PLAN_SCHEMA`, `resolveTempRefs`, and the
  `args` contract. The fix needs no new field: `args.target_node` already
  carries `{ id, statement, rationale, body, phase }`.
- The `/align-tactics` SKILL caller's Step 0 / Step 2 write path — the Workflow
  touches no files, git, or graph state and that must stay true.

### Recommended model

opus

---

## Unit 2 — CI vector for the split gate

### Scope

`.claude/workflows/*` has **no** vitest mapping in
`.claude/skills/dispatch-propagate/scripts/run-unit-tests.sh`, so a PR touching
only `align-tactics.js` triggers no vitest suite. The only test that runs on
every PR is the hook-tests job, which invokes
`.claude/skills/dispatch-propagate/scripts/test-dispatch-scripts.sh` directly
(`.github/workflows/unit-tests.yml:199`). Coverage therefore lands as a
sentinel-slice probe driven from that script — the pattern already established
by `align-tactics-tempref-probe.mjs` and `qa-fix-partition-probe.mjs`.

**New file:** `.claude/skills/dispatch-propagate/scripts/align-tactics-gates-probe.mjs`.

Copy `.claude/skills/dispatch-propagate/scripts/align-tactics-tempref-probe.mjs`
wholesale and change only:

- the header comment (name the function under test),
- `START` / `END` to the Unit-1 sentinels:
  `"// >>> computePhaseGates: sliced + eval'd by test-dispatch-scripts.sh (align-tactics) >>>"`
  and `'// <<< computePhaseGates <<<'`,
- the probe's self-identifying prefix to `align-tactics-gates-probe`, and the
  final success token to `align-tactics-gates-probe: ALL PASS`,
- the vectors.

Keep verbatim: the `countOccurrences` exactly-once sentinel check, the
`.trim()` on the slice (load-bearing — an untrimmed slice triggers automatic
semicolon insertion after `return`, yielding `undefined`), the
`new Function('return ' + fnSource)()` eval, the `ok`/`throws` helpers, and the
exit-code contract (non-zero on any failure).

Vectors to assert (`g = computePhaseGates(mode, drift)`):

1. **The reported bug.** `mode: 'tactic'`, `drift: { proceed: true, eligibility:
   { decomposable: false } }` → `g.planProceed === true` and
   `g.decomposeProceed === false`. Tactic mode ignores round decomposability.
2. **Fails closed on a genuine per-node blocker.** `mode: 'tactic'`,
   `drift: { proceed: false, eligibility: { decomposable: true } }` →
   `g.planProceed === false`, `g.decomposeProceed === false`.
3. **Strategy mode, clear round.** `mode: 'strategy'`, `proceed: true`,
   `decomposable: true` → both gates true.
4. **Strategy mode, ineligible round.** `mode: 'strategy'`, `proceed: true`,
   `decomposable: false` → both gates false (round eligibility still gates
   strategy mode — the Unit-1 tightening).
5. **Strategy mode, drift blocker.** `mode: 'strategy'`, `proceed: false`,
   `decomposable: true` → both gates false.
6. **Defensive.** `computePhaseGates('tactic', null)` and
   `computePhaseGates('strategy', {})` → both gates false in both calls.

**Driver block** in
`.claude/skills/dispatch-propagate/scripts/test-dispatch-scripts.sh`: insert
immediately **after** the existing `=== align-tactics tempref (resolveTempRefs)
===` block (which ends at the `assert_eq "align-tactics tempref: all probe
vectors pass" ...` line, currently line 25040), using the same banner-comment +
`echo` + `assert_eq` shape:

```bash
# ============================================================================
# === align-tactics phase gates (computePhaseGates) ===
# ============================================================================
# Same CI-vector rationale as the tempref probe above: run-unit-tests.sh has no
# mapping for .claude/workflows/*, so this is the only per-PR coverage for the
# tactic-mode plan gate.

echo "Test: align-tactics phase gates (computePhaseGates)"

out_ag=$(node "$SCRIPT_DIR/align-tactics-gates-probe.mjs")

assert_eq "align-tactics gates: all probe vectors pass" "align-tactics-gates-probe: ALL PASS" "$(printf '%s' "$out_ag" | tail -n1)"

# Call-site + regression assertions (mirrors the qa-fix partition call-site
# assertion): the gates must be computed once and no phase gate may read the
# raw folded boolean again.
assert_eq "align-tactics gates: computePhaseGates call site present" "1" "$(grep -c '= computePhaseGates(mode, drift)' "$REPO_ROOT/.claude/workflows/align-tactics.js" || true)"
assert_eq "align-tactics gates: no phase gate reads raw !driftProceed" "0" "$(grep -c '!driftProceed' "$REPO_ROOT/.claude/workflows/align-tactics.js" || true)"
```

`SCRIPT_DIR` and `REPO_ROOT` are already defined in that script
(`test-dispatch-scripts.sh:8`, and `REPO_ROOT` is used by the adjacent qa-fix
call-site assertion). Make the new `.mjs` file executable (`chmod +x`) to match
its sibling probes.

Note for the shell edit: `.claude/rules/shell-json.md` is mechanically linted on
net-new added lines in committed `.sh` files — do not pipe a captured variable
through `echo` into `jq`. The block above uses `printf '%s'`, matching the
existing pattern.

**Out of scope:** adding a vitest suite or a `run-unit-tests.sh` mapping for
`.claude/workflows/*`; changing the tempref probe or the qa-fix probe.

### Recommended model

sonnet

### Dependencies

Unit 1 (the sentinels and the helper must exist before the probe can slice them).

---

## Unit 3 — Sync the docs that restate the eligibility contract

### Scope

The eligibility criteria are stated in three places besides the prompt. A code
fix that scopes the check to strategy mode without moving these leaves the doc
and the prompt to drift apart again.

1. **`.claude/skills/align-tactics/SKILL.md:205-208`** — currently:

   > The eligibility sanity check (`office_hours` null, signal unvalidated, the
   > fresh-reading gate, no non-draft child already on the signal path,
   > `rounds.count < 2`) is the Workflow's drift phase — do **not** re-decide it
   > here; just supply the inputs it judges from.

   Append a sentence: this check is **strategy-mode only**. A per-node
   `/align-tactics <tactic-id>` run does not evaluate it — a sibling tactic
   (in-flight or completed-but-unpruned) sitting on the strategy's signal path
   never blocks a per-node finalize; that run's drift review judges Side A / Side
   B against the one target node and parks the tactic, never the strategy.

2. **`.claude/skills/align-tactics/SKILL.md:237-241`** — the "Two-sided drift
   review (`buildDriftPrompt`)" bullet says Side A/Side B "park the strategy".
   Add a parenthetical that in tactic mode both sides park **the target tactic**.

3. **`.claude/skills/align-tactics/references/tactic-target.md:25-31`** — the
   paragraph beginning "The decompose/plan judgment runs inside the Workflow …
   invoked in `mode: "tactic"`, where the `decompose` phase is skipped
   entirely". Extend it: in `mode: "tactic"` the drift phase also runs with the
   round-eligibility sanity check **disabled** (round decomposability is a
   strategy-round question and this run opens no round), so the plan phase is
   gated only on a genuine per-node drift blocker; every park the run emits
   targets the tactic id, consistent with the "Autonomy contract binds
   unchanged" paragraph later in the same file.

4. **`.claude/workflows/align-tactics.js:20-26`** — the header comment's
   two-mode description currently notes only that tactic mode "SKIPS the
   `decompose` phase entirely". Add that tactic mode also skips the drift
   phase's round-eligibility check, and document in the `return OUT` block
   (lines 40-56) that `drift.eligibility.decomposable` is meaningful in strategy
   mode only and is pinned true in tactic mode.

Keep every edit to the prose that restates the contract. Do **not** restate the
Unit-1 code in the docs, and do not touch the SKILL's Step 0 / Step 2 / write-path
sections.

**Out of scope:** `.claude/skills/align-tactics/references/autonomy.md`,
`idempotency.md`, and `write-path.md` — none of them restate the eligibility
criteria.

### Recommended model

sonnet

### Dependencies

Unit 1 (the docs describe the landed behavior).

---

## Reuse

- **`.claude/workflows/align-tactics.js:911-943`** — the decompose phase gate
  `if (mode !== 'tactic' && driftProceed)`. The already-correct sibling of the
  buggy gate; Unit 1 preserves its meaning rather than inventing a new
  conditional shape.
- **`.claude/workflows/align-tactics.js:779`** — `const mode = _a.mode ===
  'tactic' ? 'tactic' : 'strategy';`, already computed once at the top and
  threaded via plain `mode === 'tactic'` ternaries throughout (e.g. line 1061).
  Reuse this idiom; no new plumbing is needed — `mode` is in scope at every site
  the fix touches.
- **`.claude/workflows/align-tactics.js:885-903`** — the drift agent-death
  fallback object literal (`{ eligibility, parks: [...], proceed: false }`).
  Its shape is reused verbatim by the park-synthesis belt in Unit 1e.
- **`.claude/workflows/align-tactics.js:350-430`** — `resolveTempRefs` and its
  `// >>> … >>>` / `// <<< … <<<` sentinel pair. The exact convention Unit 1b's
  helper adopts so Unit 2's probe can slice it.
- **`.claude/skills/dispatch-propagate/scripts/align-tactics-tempref-probe.mjs`**
  — the complete sentinel-slice probe scaffold (exactly-once sentinel check,
  load-bearing `.trim()`, `new Function('return ' + fnSource)()`, `ok`/`throws`
  helpers, `ALL PASS` token). Unit 2 copies it.
- **`.claude/skills/dispatch-propagate/scripts/qa-fix-partition-probe.mjs`** —
  the second instance of the same pattern, confirming one probe file per pure
  function rather than one shared probe.
- **`.claude/skills/dispatch-propagate/scripts/test-dispatch-scripts.sh:25025-25040`**
  — the tempref probe driver block (banner comment, `echo`, `out_at=$(node …)`,
  `assert_eq` on the `tail -n1` token) plus the adjacent qa-fix call-site
  `grep -c` assertion. Unit 2's driver mirrors both.
- **`.claude/workflows/qa-fix.js:501-580`** — the fix-plan phase gated on the
  independent `plan_fix` flag. The cited precedent for gating a phase on a
  purpose-built flag rather than overloading one upstream boolean.
- **`.claude/skills/align-tactics/references/tactic-target.md:75-87`** — the
  tactic-mode `args` shape, confirming tactic mode never passes
  `existing_children` (so `existingChildren` defaults to `[]` at
  `align-tactics.js:782`) and that the eligibility criterion is structurally
  foreign to tactic mode's own input contract. No args change is needed.

## Verification

Auto-runnable:

```verify
node --check .claude/workflows/align-tactics.js
```

```verify
node .claude/skills/dispatch-propagate/scripts/align-tactics-gates-probe.mjs
```

```verify
.claude/skills/dispatch-propagate/scripts/test-dispatch-scripts.sh
```

```verify
node .claude/skills/dispatch-propagate/scripts/align-tactics-tempref-probe.mjs
```

(The last one is a regression guard: Unit 1b inserts a second sentinel pair into
the same file, and the tempref probe fails loudly if its own sentinels stop
appearing exactly once.)

Manual / judgment checks:

- **Read the rendered drift prompt in both modes.** The Workflow cannot be
  executed outside the Workflow tool, so confirm the branch by inspection: with
  `mode: 'tactic'` the assembled prompt contains the tactic-mode block and
  contains **none** of the round-eligibility phrases ("no non-draft child
  tactic already on its signal path", "rounds.count < 2", "fresh-reading gate");
  with `mode: 'strategy'` those phrases are present verbatim and unchanged from
  `origin/main`. A quick way to check without the Workflow runtime: slice
  `buildDriftPrompt` out of the file the same way the probes do, eval it, call it
  with a stub `strategy`/`gather` in each mode, and diff the strategy-mode output
  against the pre-change output.
- **End-to-end, in production.** The real signal is a per-node run that used to
  escalate now completing: invoke `/align-tactics <tactic-id>` against a frozen
  draft tactic serving a strategy whose signal path is claimed by a non-draft
  sibling (`strategy-graph-native-dispatch` is in exactly that state today —
  its validates-terminal is `phase: done` and still unpruned on `origin/main`).
  Before the fix that run returns `disposition: escalated` with a drift park
  citing round ineligibility; after it, the run must return a planned
  `body_markdown` for the one target node and `disposition:
  completed_with_fixes`. Observe this on the next per-node run rather than
  forcing one.
- **Fail-closed spot check.** Confirm by reading the assembled code path that a
  tactic-mode run whose drift review reports a real Side A failed condition still
  produces `planProceed === false`, a park targeting the **tactic** id, and
  `deviation: true` — the fix must not turn the per-node drift review into a
  rubber stamp.
- **No new escalations in strategy mode.** After landing, the first strategy-mode
  `/align-tactics <strategy-id>` round must behave exactly as before. If it
  escalates with the synthesized "recorded no park" reason from Unit 1e, that is
  the deliberate tightening firing on an inconsistent drift verdict — report it
  rather than loosening the gate.

## needs-main residue

Filed by `/qa-fix` (PR #2982) — planned deferrals only assertable against
merged `main`, not pre-merge. All other QA items passed or were confirmed
already-satisfied by direct code/doc reading; see the PR's `<!-- dispatch:qa-summary -->`
comment for the full triage.

- **id 8 — End-to-end: the next real per-node run against a signal-path-claimed
  strategy completes instead of escalating.**
  - URL path: current
  - Expected outcome: the next natural `/align-tactics <tactic-id>` invocation
    against a frozen draft tactic serving a strategy whose signal path is
    claimed by a non-draft sibling (`strategy-graph-native-dispatch` is in
    exactly that state) returns `disposition: completed_with_fixes` with a
    planned `body_markdown`, where before the fix it returned `disposition:
    escalated`.
  - Finding: cannot be settled pre-merge — the node's own verification section
    directs observing the next natural production run rather than forcing one.

- **id 9 — No new escalations in strategy mode after landing.**
  - URL path: current
  - Expected outcome: the first strategy-mode `/align-tactics <strategy-id>`
    round after this lands behaves exactly as before, unless it hits the
    deliberate park-synthesis-belt tightening (in which case that is reported,
    not patched away).
  - Finding: cannot be settled pre-merge — requires observing the first
    post-merge strategy-mode round in production; no such round exists to
    inspect now.
