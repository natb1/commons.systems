---
id: tactic-align-tactics-drift-dump-office-hours
kind: tactic
statement: the /align-tactics drift agent is instructed to weigh the strategy's
  own office_hours but is never given the field -- pass office_hours into the
  drift payload at all four dump sites so the instruction and the data agree
owner: ai
status: raw
parent: null
rationale: "Found in the 2026-08-05 /align interview.
  .claude/workflows/align-tactics.js buildDriftPrompt's prompt TEXT tells the
  agent to consider 'the strategy's own office_hours' (line 28) and makes
  'office_hours is null' part of the eligibility check (line 45), but the
  serialized payload (lines 101-107) carries statement, rationale,
  success_signal, conditions and clarifications -- and NOT office_hours. The
  same omission repeats at the other three dump sites (801, 904, 980).
  Consequence: on every round, for every strategy, the agent must either
  hallucinate the field or silently treat it as absent -- including in the
  eligibility gate that decides whether the round proceeds at all.
  strategy-graph-native-dispatch was parked from 2026-08-04, so every drift
  round on it reasoned about a park it could not see. Note: strategy.conditions
  at line 106 reads oddly but is CORRECT by contract -- line 37 documents it as
  caller-flattened from attributes.conditions."
reading: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications:
  - question: Does the serving strategy's armed maintenance-burden band still hold
      at the time of this round, and by what method was it measured?
    answer: "(Measured 2026-08-21 /align-tactics per-node round on
      tactic-align-tactics-drift-dump-office-hours, independently of the gather
      agent.) Fourth consecutive independent measurement of the armed
      maintenance-burden band failing on strategy-graph-native-dispatch. Method:
      `intentions/` extracted at origin/main 3313bc46 via `git archive`,
      classified verbatim per packages/intentionsutil/src/census.ts:13-40
      (classifyTactic / strategyBacklogBand). Result: 316 tactics serve this
      strategy — 97 done, 91 draft, 84 open, 44 born-parked — giving backlog
      128/316 = 40.5% against a declared 35% ceiling. Both limbs fail: the
      ceiling is breached by 5.5 points, and the series is increasing rather
      than non-increasing against the strategy's own recorded descent (47.6% →
      38.2% → 31.4% → 24.6%) and against the same-day 39.4% at 481572f1. Prior
      samples: 39.4% (481572f1), 38.5% (fd98fd26, sibling park on
      tactic-graph-commit-park-content-durability), 41.1% (this round's gather
      agent). The canonical census script could not be run directly (`npx tsx`
      fails EPERM binding its IPC pipe under the sandbox — the known tsx
      scratch-dir restriction), so the classification was reimplemented against
      the census.ts source rather than shelled out; four samples agreeing within
      2 points cross-validates it. Separately: the strategy's stored `reading`
      field still records 58/236 = 24.6%, stale by ~16 points and by 80 tactics
      against the live corpus — a round must re-derive the band rather than
      reuse `reading`. CALLER-THREAD CORRECTION (2026-08-21, same round): the
      claim that the canonical census could not be shelled out is true only of
      the Workflow subagents. The caller thread DID run it — `listNodes` +
      `strategyBacklogBand` imported directly from
      packages/intentionsutil/src/census.ts against `intentions/` extracted at
      origin/main 3313bc46 — and reproduces the subagent figure EXACTLY: 97
      done, 91 draft, 84 open, 44 born-parked, band 128/316 = 40.5%, ceiling
      limb FAILS. So the band failure is confirmed by the canonical code path,
      not only by a reimplementation of it."
  - question: Is the office_hours dump-site omission still live at origin/main, and
      does this tactic's motivating example still hold?
    answer: "(Verified 2026-08-21 /align-tactics per-node round on
      tactic-align-tactics-drift-dump-office-hours.) The office_hours dump-site
      omission is CONFIRMED LIVE at origin/main 3313bc46 — `office_hours`
      appears in none of the four strategy-record payloads, while the
      strategy-mode eligibility prose at .claude/workflows/align-tactics.js:743
      still names 'office_hours is null' as one of five criteria the agent must
      apply. But this tactic's motivating example has expired:
      strategy-graph-native-dispatch now carries `office_hours: null`
      (intentions/strategy-graph-native-dispatch.md:6710), so the rationale's
      'parked from 2026-08-04, so every drift round on it reasoned about a park
      it could not see' is history rather than a live symptom. The defect stands
      without that example; a re-plan should not cite it as current evidence."
  - question: What are the correct current anchors for the four dump sites and for
      the caller-side args.strategy blocks, replacing the rationale's stale line
      numbers?
    answer: "(Re-anchored 2026-08-21 /align-tactics per-node round, verified against
      origin/main 3313bc46.) Corrected anchors for
      tactic-align-tactics-drift-dump-office-hours, replacing the rationale's
      stale 'line 28 / line 45 / lines 101-107 / 801, 904, 980': the instruction
      prose is at .claude/workflows/align-tactics.js:726 (tactic-mode block,
      which tells the agent NOT to evaluate office_hours) and :743
      (strategy-mode eligibility, which requires it); the three `asJson({...})`
      strategy dumps are buildDriftPrompt :798-808, buildDecomposePrompt
      :901-908, and buildPlanPrompt's tactic-mode branch :977-986. The FOURTH
      site, buildCorpusPrompt :656-663, is a plain template-string join
      (statement/success_signal/reading/gap only), NOT an asJson object, so it
      takes a different edit shape from the other three — the rationale's 'all
      four dump sites' does not disambiguate this. Beyond the four, three
      further sites are required: the JSDoc args contract at :32-40, and the two
      caller-side args.strategy literals at
      .claude/skills/align-tactics/SKILL.md:252-259 (strategy mode) and
      .claude/skills/align-tactics/references/tactic-target.md:91-98 (tactic
      mode). `office_hours` is a first-class strategy frontmatter field
      (intentions/kind-strategy.md:91), read directly off the node — unlike
      `derived_gap`, which is computed via deriveGap and must never be read off
      frontmatter."
  - question: Is a workflow-side-only fix sufficient, and does the fix buy the same
      thing in strategy mode and tactic mode?
    answer: "(Recorded 2026-08-21 /align-tactics per-node round on
      tactic-align-tactics-drift-dump-office-hours.) The office_hours dump fix
      is INERT without its caller-side half: align-tactics.js can only serialize
      `strategy.office_hours`, and both callers build args.strategy from an
      explicit field list that omits it (SKILL.md:252-259,
      tactic-target.md:91-98). A plan that edits only the four workflow dump
      sites ships a change that forwards `undefined` on every invocation and
      would pass a naive grep-count assertion while fixing nothing. The
      caller-side edits are load-bearing units, not consistency polish. Note
      also the per-mode asymmetry in what the fix buys: in TACTIC mode the
      eligibility block at align-tactics.js:726 explicitly instructs the agent
      NOT to evaluate the strategy's office_hours, so supplying it into the two
      tactic-mode dumps is read-only context only; it is the STRATEGY-mode drift
      dump (:798-808, paired with the :743 criterion) that actually restores a
      declared-but-currently-unenforceable gate. A plan should say which of the
      two outcomes each unit delivers rather than treating all four sites as
      equivalent."
  - question: How must a test covering .claude/workflows/align-tactics.js be wired
      into CI, and does any existing test already cover the strategy-record dump
      payloads?
    answer: "(Verified 2026-08-21 /align-tactics per-node round on
      tactic-align-tactics-drift-dump-office-hours.) CI-wiring trap for any test
      covering .claude/workflows/align-tactics.js: run-unit-tests.sh's
      changed-path auto-detect (lines 84-90) sets RUN_PR_SCRIPTS only for
      `.claude/skills/dispatch-propagate/scripts/*` and lists no
      `.claude/workflows/*` case, so a new test-align-tactics-*.sh for a
      workflow-file change is never selected by the glob fallback and must be
      added as an unconditional step in the hook-tests job of
      .github/workflows/unit-tests.yml — which is why all five existing
      align-tactics shell tests are wired unconditionally there (:271, :273,
      :299, :301, :369). Confirmed additionally: no existing test asserts any
      field of the strategy-record dump payloads, and `grep '^// >>>'` over
      align-tactics.js returns exactly four sentinel pairs (resolveTempRefs,
      computePhaseGates, synthesizeTargetPlanTactic, tacticModeFraming) — none
      around the three buildXPrompt dump functions — so no probe.mjs already
      covers this surface, and a grep-count regression assertion in the style of
      test-align-tactics-gates.sh:31-33 is the lighter-weight fit unless new
      sentinels are added around the dump functions. CALLER-THREAD CORRECTION
      (2026-08-21, same round): the cited style anchor is wrong.
      test-align-tactics-gates.sh:31-33 is a probe-OUTPUT assertion (`assert_eq
      ... \"align-tactics-gates-probe: ALL PASS\"`), not a grep count. The
      grep-count doctrine-ratchet style the observation means is
      test-align-tactics-terminal-marker.sh:85-87 and :101-103 (`n=$(grep -cE
      ... )` then assert present/absent). Every other anchor in these five
      entries was re-verified on the caller thread at origin/main 3313bc46 and
      is correct."
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
# the /align-tactics drift agent is instructed to weigh the strategy's own office_hours but is never given the field -- pass office_hours into the drift payload at all four dump sites so the instruction and the data agree

## Status — un-parked 2026-08-30, still a draft (no plan authored)

This node is **still a draft**. The 2026-08-21 `/align-tactics` per-node round ran
its two-sided drift review and parked before authoring a plan: Side A found the
serving strategy's **armed maintenance-burden band condition measured false on
both limbs**, and conditions are human-decided. Nothing about *this* node was
defective — its premise was verified live that round, and it can be planned
straight from the record below.

**The park is cleared.** The author ruled the band on 2026-08-28, and that ruling
un-parks every node held *solely* on the maintenance-burden band breach. This node
was held on nothing else — the park's own text says so — so `office_hours` was
cleared on 2026-08-30 as part of the dispatch/RSI serialized PR batch.

Nothing was lost with it. The band measurement the park carried (128/316 = 40.5%,
ceiling limb fails, measured at origin/main `3313bc46`) is clarification 1 on this
node; the four corrected dump-site anchors, the inert-without-caller-side finding,
the per-mode asymmetry, and the CI-wiring trap are clarifications 2-5. Read the
clarifications — `office_hours` is null by disposition, not by loss.

**Next step:** `/align-tactics tactic-align-tactics-drift-dump-office-hours` to
author the plan. That resumes a round rather than starting one: the five
clarifications carry the corrected anchors, and none of it needs re-deriving.

**Where this round's observations live, and why.** The round's five immaterial
Side-B observations were folded into this node's own `clarifications` array and
this section, rather than minted as a separate born-parked observation carrier.
That placement is deliberate, not an oversight. Clarification 245/V1 forbids an
autonomous write to the *strategy's* `clarifications`; it does not forbid a
session writing its own target node. And minting a carrier here would be actively
counterproductive: `strategyBacklogBand`
(`packages/intentionsutil/src/census.ts:26-40`) scores a born-parked tactic as
backlog, so a new carrier would add to the very numerator this park is about.
Since this node is itself now in the office-hours queue, the observations reach
the same sitting a carrier would have routed them to.

## The defect, re-verified at origin/main 3313bc46 (2026-08-21)

Confirmed live. `.claude/workflows/align-tactics.js` serializes the serving
strategy into agent payloads at **four** sites, and `office_hours` appears in
**none** of them — while the strategy-mode eligibility prose at `:743` still names
`office_hours is null` as one of five criteria the drift agent must apply. The
agent must therefore hallucinate the field or silently treat it as absent.

**Corrected anchors** — every line number in the `rationale` above is stale (it
was written 2026-08-05 against a smaller file) and must not be trusted. Locate by
symbol; these were re-checked on the caller thread at 3313bc46:

| Site | Anchor | Shape |
| --- | --- | --- |
| `buildCorpusPrompt` | `:656-663` | template-string join — statement/success_signal/reading/gap only. **Different edit shape from the other three.** |
| `buildDriftPrompt` | `:798-808` | `asJson({...})` full record. **The site the `:743` instruction depends on.** |
| `buildDecomposePrompt` | `:901-908` | `asJson({...})`, full record minus `rounds` |
| `buildPlanPrompt` (tactic branch) | `:977-986` | `asJson({...})` full record |

The instruction prose sits at `:726` (tactic-mode block, which tells the agent
**not** to evaluate `office_hours`) and `:743` (strategy-mode eligibility, which
requires it). `buildReusePrompt` (`:628-632`) and `buildPlanPrompt`'s strategy
branch (`:989-994`) carry only statement + success_signal and are not counted
among the four.

## Three findings a plan must not rediscover

1. **A workflow-side-only fix is INERT.** `align-tactics.js` can only serialize
   `strategy.office_hours`, and *both* callers build `args.strategy` from an
   explicit field list that omits it — `.claude/skills/align-tactics/SKILL.md:252-259`
   (strategy mode) and `.claude/skills/align-tactics/references/tactic-target.md:91-98`
   (tactic mode) — plus the JSDoc args contract at `align-tactics.js:32-40`. Editing
   only the four dump sites ships a change that forwards `undefined` on every
   invocation and would pass a naive grep-count assertion while fixing nothing. The
   caller-side edits are load-bearing units, not consistency polish. `office_hours`
   is a first-class strategy frontmatter field (`intentions/kind-strategy.md:91`),
   read directly off the node — unlike `derived_gap`, which is computed via
   `deriveGap` and must never be read off frontmatter. Args normalization
   (`align-tactics.js:1017`) passes `strategy` through whole, so no normalization
   change is needed.

2. **The two modes do not buy the same thing.** In tactic mode the eligibility
   block at `:726` explicitly instructs the agent *not* to evaluate the strategy's
   `office_hours`, so supplying it into the two tactic-mode dumps is read-only
   context only. It is the **strategy-mode drift dump** (`:798-808`, paired with the
   `:743` criterion) that actually restores a declared-but-currently-unenforceable
   gate. A plan should say which outcome each unit delivers rather than treating all
   four sites as equivalent.

3. **CI-wiring trap.** `run-unit-tests.sh`'s changed-path auto-detect
   (`:84-90`) sets `RUN_PR_SCRIPTS` only for `.claude/skills/dispatch-propagate/scripts/*`
   and has no `.claude/workflows/*` case, so a new `test-align-tactics-*.sh` for a
   workflow-file change is never selected by the glob fallback. It must be added as
   an **unconditional** step in the `hook-tests` job of
   `.github/workflows/unit-tests.yml` — which is why all five existing align-tactics
   shell tests are wired there (`:271`, `:273`, `:299`, `:301`, `:369`). No existing
   test asserts any field of the strategy-record dump payloads, and the file's four
   sentinel pairs (`resolveTempRefs`, `computePhaseGates`, `synthesizeTargetPlanTactic`,
   `tacticModeFraming`) surround none of the `buildXPrompt` dump functions — so no
   probe covers this surface. A grep-count doctrine ratchet in the style of
   `test-align-tactics-terminal-marker.sh:85-87` / `:101-103` is the lighter-weight fit
   unless new sentinels are added around the dump functions.

## Two corrections to this node's own record

- **The motivating example has expired.** The `rationale` says
  `strategy-graph-native-dispatch` "was parked from 2026-08-04, so every drift round
  on it reasoned about a park it could not see." The strategy now carries
  `office_hours: null` (`intentions/strategy-graph-native-dispatch.md:6710`), so that
  is history, not a live symptom. The defect stands without it; a re-plan should not
  cite it as current evidence.

- **The blast-radius claim is overstated.** `packages/intentionsutil/src/router.ts:488`
  (`if (s.office_hours !== null) continue;`) keeps a parked strategy out of the
  selector's align-tactics candidate list, and Step 0's mandatory
  `assert-node-selection` defers wholesale to `strategyAlignSelectable`
  (`router.ts:588-592`), which is membership in exactly that list. A strategy-mode
  round therefore cannot *start* on a parked strategy. The residual live exposure is
  narrower: a park landed by a concurrent `/align` between Step 0's gate and the
  Workflow invocation, and an agent instructed to weigh a field absent from its
  payload. Plan the fix on the coherence ground — an instruction and its data must
  agree, and a checked-but-unsupplied field is a prompt defect regardless of
  reachability — not on the "every round was blind" ground.

## Sequencing

`tactic-eval-finding-review-fix-workflow-args-rederived-each-pass` is at phase
`implement` and edits the **same three args-contract anchors**: it adds a
sentinel-bounded `ARGS_CONTRACT` plus a `validateWorkflowArgs()` that throws on an
undeclared field, rewrites both skill-side args blocks into pointers, and adds a CI
guard asserting the two field-name sets match. Worth checking rather than assuming:
`office_hours` is a sub-field of `strategy`, not a top-level args key, so it may
fall outside `ARGS_CONTRACT`'s key set entirely. Either way, sequence the two
explicitly — clarification 152 on the serving strategy records the standing
precedent that overlapping edits to this one file are region-separable and
expressible as a `blocked_by` edge, requiring no author decision.

Out of scope: `.claude/workflows/qa-fix.js` and `.claude/workflows/review-fix.js`
carry the same args-JSDoc shape and are named in that sibling node; they are not
this node's work.
