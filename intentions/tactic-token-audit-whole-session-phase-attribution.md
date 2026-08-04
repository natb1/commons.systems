---
id: tactic-token-audit-whole-session-phase-attribution
kind: tactic
statement: Token-audit phase attribution covers a phase worker's whole session,
  not only its skill-framed turns
owner: ai
status: codified
parent: null
rationale: Surfaced by the 2026-07-31 review-fix token audit interview.
  Condition 2 of strategy-token-economy requires every session be attributable
  to a node and phase; measured, 2,241 of 2,992 turns (75%) across 19
  review-worker sessions fell to the <none> bucket, understating review-fix at
  $614 phase-tagged against $754 true. See clarification 23 on
  strategy-token-economy.
reading: null
gap: null
serves:
  - strategy-token-economy
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention:
  boost: 20
  override: null
  rationale: "Author-directed 2026-08-03: prioritize progression of
    token-efficiency work ahead of bug-fix work and ahead of the undecomposed
    baseline. Matches the boost 20 already carried by the review-phase
    token-cost cluster (tactic-review-skill-body-decomposition and its
    siblings). Simulated over the live store before writing: 0 tier changes, 0
    value drift onto non-target nodes, resolves to 20.00."
  tier: 1
phase: done
execution:
  branch: tactic-token-audit-whole-session-phase-attribution
  pr: 3032
  attempts: {}
  markers:
    - planned
    - qa-done
    - reviewed
  strategy_fingerprint: null
  fix: null
  completion:
    mergedAt: 2026-08-04T04:03:29Z
    mergeCommitSha: 371c3b1e0b6d4e09f016512e7468f8a2c87f94e3
    graphCommitSha: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Token-audit phase attribution covers a phase worker's whole session, not only its skill-framed turns

## Context

Condition 2 of `strategy-token-economy`: "the token audit stays runnable and
attributable across the router migration — a session that cannot be attributed
to a node and phase is invisible to every control loop here." Measured
2026-07-31, that condition is breached.

Per-turn phase attribution comes from the harness-supplied `attributionSkill`
field, read at `.claude/skills/dispatch-token-audit/scripts/aggregate-usage.sh:298`:

```
skill:  ((.attributionSkill // "<none>") | gsub("\t"; "_") | .[0:64]),
```

Turns with no `attributionSkill` fall to `<none>`. Across 19 review-worker
sessions in the 2026-07-27 → 07-31 window: **2,241 of 2,992 assistant turns
(75%) carried no value.** The pattern is positional, not random — attribution
covers a session's OPENING turns and then stops. One session measured 26
`review-fix` turns followed by 105 consecutive `<none>` turns; only one short
session (51 turns) was fully tagged.

Consequence: review-fix measured **$614 phase-tagged against $754 true** (the
difference being the untagged skill-body work — the bash preamble, inline
scans, commit-merge-push, follow-up filing, and the PR comment). Pooled across
all phases, `<none>` was the single largest line in the window at $1,319 real
/ $2,214 proxy — larger than any named phase.

The root cause is structural, and it is consumer-side. A dispatch worker
session **is** one phase: it is spawned with exactly one phase slash-command.
The audit already knows this — the session-type classifier at
`aggregate-usage.sh:308-320` types such a session `worker` by matching the
first user message against
`<command-name>/(plan-issue|implement|qa-fix|review-fix|fix-checks|fix-conflicts|dispatch-conflict|qa-main|budget-parse-job|resolve-epic|office-hours|align-strategy|align-tactics|align-init)</command-name>`
(line 319). That signal is reliable and is not the defect. The defect is that
the `by_skill` / `by_skill_model` rollups (`aggregate-usage.sh:328-343`) key
strictly on per-turn `attributionSkill` and never consult the whole-session
classification, so everything downstream of them — `by_phase` (613-636),
`by_phase_model` (632-636), `.sessions[].phases` (804),
`lenses.context_over_120k.by_phase` (818), `lenses.phase_standup` (890-895) —
inherits the 75% hole.

**Intended outcome.** For a session the classifier has already typed as a
single-phase `worker`, attribute the WHOLE session to that phase rather than
only its skill-framed turns, and expose a first-class `attribution_coverage`
block so the residual harness-side gap stays measurable instead of being
papered over.

### Greenfield design (what is being built)

Phase attribution is a **session-grained** property for worker sessions,
derived from the launch slash-command; the per-turn `attributionSkill` slice
is retained as a *coverage diagnostic*, not as the attribution mechanism.
Concretely:

- The launch skill captured from the classifier's own regex becomes the
  session's phase key.
- `by_skill` / `by_skill_model` (and therefore every downstream phase rollup,
  whose key names and bucket shapes are unchanged) are populated from that
  key for qualifying worker sessions.
- The raw per-turn rollup survives as a new, separate `by_attribution_skill`
  field plus an `attribution_coverage` block, so the harness's emission gap
  remains visible and future harness-side work can be measured against it.

This is achievable in a single PR — no brownfield migration path is needed.
The published JSON contract keys (`by_phase`, `by_phase_model`,
`.sessions[].phases`, `lenses.*`) keep their names, shapes, and field sets;
only the population rule changes. `audit-aggregate-writer.mjs`'s
`projectBucketMap` (lines 194-220, 310) validates bucket *shape* and is
agnostic to bucket *keys*, so the optional Firestore persist path needs no
change. One consequence must be documented rather than engineered around:
persisted historical windows were computed under the old rule, so the
`byPhase` time series takes a **step discontinuity** at the landing date.
That is a re-baseline, not a regression.

### Carried-forward constraints

- **Preserve existing behavior** for genuinely multi-phase sessions and for
  `subagent` transcripts, which are attributed correctly today.
- **Out of scope: changing the harness's `attributionSkill` emission.** This
  is a consumer-side fix in the audit script.
- **Dependency note (author ruling, 2026-07-31).** This does NOT gate the
  model-routing decisions recorded the same day
  (`tactic-review-domain-lens-consolidation`,
  `tactic-review-verify-per-file-batching`). The per-lens yield metrics that
  grounded those decisions came from workflow SUBAGENT transcripts, which are
  fully attributed; the blind portion is the parent session only.
- **Interaction to watch.** `tactic-review-skill-body-decomposition` moves
  terminal actions out of the parent session and into subagents, changing
  WHERE this work is measured. As of 2026-08-03 it has **not** landed — it
  sits at `phase:review` with its CI-fix lane capped and parked to
  office-hours (`tactic-hold-fix-cap-review-skill-body-decomposition`, PR
  #3025). So this tactic lands first, against the current session shape;
  whoever lands the sibling must re-baseline the review-phase numbers
  afterward rather than comparing across the two shapes.
- **Not a routing change.** This tactic changes measurement only. It applies
  no model/effort routing change and requires no author routing approval
  (strategy condition 3 / clarification 10).

## Units of work

### Unit 1 — Whole-session phase attribution in stage-1 jq

**Scope.** `.claude/skills/dispatch-token-audit/scripts/aggregate-usage.sh`
only, stage-1 jq program (the `STAGE1` heredoc, roughly lines 260-456).

1. **Single-source the worker-skill enumeration.** The alternation currently
   lives inline at line 319. Lift it to two `def`s near the other stage-1
   helpers (above the `. as $msgs` pipeline at line ~283):

   ```
   def worker_skills: ["plan-issue","implement","qa-fix","review-fix","fix-checks",
     "fix-conflicts","dispatch-conflict","qa-main","budget-parse-job","resolve-epic",
     "office-hours","align-strategy","align-tactics","align-init"];
   def worker_cmd_re: "<command-name>/(?<wskill>" + (worker_skills | join("|")) + ")</command-name>";
   ```

   Rewrite line 319 to `elif ($firstuser_str | test(worker_cmd_re)) then "worker"`.
   Keep the existing comment about updating the list when a new phase skill is
   added, and extend it to say the list is now consumed twice (classification
   and attribution). Do **not** add a fourth independent enumeration:
   `$phase_skill` (line 882-883) and the shell `_phase_map` loop (lines
   108-113) are narrower, different-purpose lists and stay as they are —
   reconciling those three is explicitly out of scope for this unit.

2. **Capture the launch skill.** After `$type` is bound (line 320), add:

   ```
   | ( ($firstuser_str | capture(worker_cmd_re) | .wskill) // null ) as $launch_skill
   ```

   `capture` yields nothing on no-match, and `empty // null` evaluates to
   `null` — no error branch needed.

3. **Multi-phase guard.** Compute, from the existing `$rows` (line 296-301):

   ```
   | ( [ $rows[] | .skill | select(. != "<none>") ] | unique ) as $tagged_skills
   | ( [ $tagged_skills[] | select(. as $s | worker_skills | index($s)) ] ) as $tagged_phase_skills
   | ( ($type == "worker") and ($launch_skill != null)
       and (($tagged_phase_skills | length) <= 1) ) as $whole_session
   ```

   Rationale to record in a comment: a worker session that inlines a
   *non-phase* helper skill (e.g. `commit-merge-push`) is still one phase and
   must fold whole — that is precisely the cost the audit is currently blind
   to. Only a session carrying **two or more distinct phase-skill**
   attributions is genuinely multi-phase, and it keeps today's per-turn
   behavior.

4. **Attributed rows.** Introduce `$arows` and build the two existing
   rollups from it, leaving their reduce bodies otherwise untouched (lines
   328-343):

   ```
   | ( if $whole_session then [ $rows[] | .skill = $launch_skill ] else $rows end ) as $arows
   ```

   `$by_skill` / `$by_skill_model` reduce over `$arows`. This is a pure
   re-keying: the same turns and the same per-turn models are folded, so
   `session_cost($r)` (line 521-523, which reduces over `by_skill_model`
   splitting the model off the composite key) and every totals figure are
   numerically **invariant**. Treat that invariance as a hard requirement.

5. **Retain the raw per-turn slice.** Add one reduce over `$rows` (not
   `$arows`) producing `$by_attribution_skill`, same `{usage, turns}` bucket
   shape as `$by_skill`, reusing `sum_usage`.

6. **Emit new session fields** in the stage-1 output object (lines 438-456),
   alongside `by_skill` / `by_skill_model`:

   ```
   launch_skill: $launch_skill,
   whole_session_attributed: $whole_session,
   multi_phase_worker: (($type == "worker") and (($tagged_phase_skills | length) > 1)),
   by_attribution_skill: $by_attribution_skill,
   attributed_turns_raw: ([ $rows[] | select(.skill != "<none>") ] | length),
   ```

7. **Update the script header contract block** (lines 47-60, "BEHAVIOR
   CONTRACT") with a bullet stating that phase attribution is whole-session
   for classifier-typed single-phase `worker` sessions, that
   `by_attribution_skill` preserves the raw per-turn harness slice, and that
   subagent / recovery / other / multi-phase-worker sessions keep per-turn
   attribution.

**Out of scope for this unit:** stage-2 (`STAGE2` heredoc), `SKILL.md`, the
test suite, `audit-aggregate-writer.mjs`, and any change to how the harness
emits `attributionSkill`.

**Recommended model.** opus

### Unit 2 — `attribution_coverage` rollup, session surfacing, and SKILL.md contract

**Scope.** `.claude/skills/dispatch-token-audit/scripts/aggregate-usage.sh`
(stage-2 jq only) and `.claude/skills/dispatch-token-audit/SKILL.md`.

1. **New top-level `attribution_coverage` block**, placed after `$totals`
   (which ends at line 599) and emitted in the final document object next to
   `totals` (line 956). In stage-2, `. as $rows` (line 587) binds the
   *sessions*, so each `$r` is one stage-1 record:

   ```
   turns_total                       — [ $rows[].turns ] | add // 0
   turns_attributed_raw              — [ $rows[].attributed_turns_raw ] | add // 0
   turns_attributed_effective        — sum over $rows of (.turns - ((.by_skill["<none>"].turns) // 0))
   raw_coverage_rate                 — turns_attributed_raw / turns_total, null when turns_total == 0
   effective_coverage_rate           — turns_attributed_effective / turns_total, null when turns_total == 0
   whole_session_attributed_sessions — [ $rows[] | select(.whole_session_attributed) ] | length
   multi_phase_worker_sessions       — [ $rows[] | select(.multi_phase_worker) ] | length
   unattributed_price_proxy_usd      — ($by_phase["<none>"].price_proxy_usd) // 0
   ```

   Guard both rates on a zero denominator with an explicit `null` (mirroring
   the null-guard discipline of `outcome_rates`) — never a fabricated `0`.

2. **Surface per-session attribution** on the `.sessions[]` summary (lines
   794-807): add `launch_skill` and `whole_session_attributed` beside the
   existing `phases` field. Leave `phases` computed from `.by_skill` exactly
   as it is (line 804) — it now reports whole-session values for free, which
   also sharpens `lenses.context_over_120k.by_phase`'s dominant-phase pick
   (lines 813-818).

3. **Do not change** `by_phase` / `by_phase_model` (613-636), `by_node`
   (644-652), `by_phase_outcome` (757-789), or the `phase_standup` emitter
   guard (`select(.type == "worker" and ((.by_skill // {}) | has($skill)))`,
   line 895). All four keep working and become more accurate for free. Add a
   one-line comment at line 895 noting the guard is now satisfied by
   whole-session attribution.

4. **SKILL.md updates:**
   - In the Step 3 jq-slice list (around lines 49-53, 74), add a slice:
     `jq '.attribution_coverage' tmp/usage-audit.json`.
   - State next to the `by_phase` slices that phase attribution is
     whole-session for single-phase worker sessions, and that
     `by_attribution_skill` on `.sessions[]` carries the raw per-turn harness
     slice for anyone measuring the harness-side gap.
   - Add an explicit **re-baseline caveat**: windows spanning the landing
     date are not comparable to earlier persisted `byPhase` figures; a step
     increase in named-phase spend with a matching drop in `<none>` is the
     expected, correct signature of this change, not a regression. Report
     authors must say so when comparing across the boundary.

**Dependencies.** Unit 1.

**Recommended model.** sonnet

### Unit 3 — Test coverage

**Scope.** `.claude/skills/dispatch-token-audit/scripts/test-aggregate-usage.sh` only.

1. **Fixture-launch-line realism sweep (required for correctness, not a test
   weakening).** The shared fixture's worker session declares
   `<command-name>/plan-issue</command-name>` as its first user line (line
   114) while every one of its assistant turns carries
   `attributionSkill:"implement"` (lines 120-133). Under whole-session
   attribution that session would re-key to `plan-issue` and the existing
   `by_phase["implement"]` (lines 345-348), `by_phase["implement"].output`
   (432-433) and `phase_standup.implement` (lines 546-563) assertions would
   fail — not because the behavior is wrong but because the fixture describes
   a session that cannot exist (`/plan-issue` is a retired skill). Change
   that launch line to `<command-name>/implement</command-name>`. Apply the
   same realism sweep to the other `/plan-issue` fixture launch lines (line
   793 in the partial-envelope sub-suite, whose turn is tagged `review-fix` →
   use `/review-fix`; line 851 in the unpriceable-model guard sub-suite → use
   `/implement`).

   **Hard constraint:** no existing *expected value* may change. Every one of
   the 182 currently-passing assertions must still pass with its current
   expected value after the launch-line sweep. If any expected value would
   have to move, stop and escalate — that is evidence the implementation
   re-keyed or double-counted something, not a fixture problem
   (`.claude/rules/test-integrity.md`).

2. **New ISOLATED sub-suite: "whole-session phase attribution".** Follow the
   established isolated-fixture pattern used by the partial-envelope (lines
   764-838) and unpriceable-model-guard (lines 839-874) sub-suites — its own
   `mktemp -d` root, its own `DISPATCH_AUDIT_PROJECTS_ROOT` export, its own
   `trap` cleanup — so the shared fixture's hand-computed totals stay
   untouched. Build one projects root containing:

   - **`sess-ws-worker`** under a `*-worktrees-*` dir: first user line
     `<command-name>/review-fix</command-name>`; assistant turn 1 with
     `attributionSkill:"review-fix"`; assistant turns 2 and 3 with **no**
     `attributionSkill` and non-zero, distinct usage. Assert:
     - `by_phase["review-fix"].turns == 3` (all three turns attributed).
     - `by_phase | has("<none>") | not` — the `<none>` bucket is gone for
       this root.
     - `by_phase["review-fix"].input` equals the hand-summed input across
       all three turns, and `totals.price_proxy_usd` equals the same
       hand-computed total it would have had before the change — the
       **invariance** assertion.
     - `[.sessions[]|select(.id=="sess-ws-worker")][0].phases | keys ==
       ["review-fix"]` — a single-phase worker session's `phases` map
       contains exactly one key.
     - `attribution_coverage.raw_coverage_rate` is `1/3` and
       `effective_coverage_rate` is `1`, and
       `whole_session_attributed_sessions == 1`.
     - `[.sessions[]|select(.id=="sess-ws-worker")][0].by_attribution_skill["<none>"].turns
       == 2` — the raw harness slice is preserved, so the underlying
       emission gap is still measurable.
   - **`sess-ws-multi`**: first user line `<command-name>/implement</command-name>`,
     with turns tagged `implement` and `qa-fix` (two distinct *phase* skills)
     plus one untagged turn. Assert `multi_phase_worker_sessions == 1`,
     `whole_session_attributed` is `false` for it, and its untagged turn
     still lands in `<none>` — the preserved-behavior guard.
   - **`sess-ws-helper`**: first user line `<command-name>/review-fix</command-name>`
     with one turn tagged `review-fix` and one tagged `commit-merge-push` (a
     non-phase helper skill). Assert it **is** whole-session attributed and
     its `by_phase` contribution lands entirely under `review-fix` — the
     case the multi-phase guard must NOT catch.
   - **A subagent transcript** at
     `<root>/<dir>/sess-ws-worker/subagents/agent-ws.jsonl` with no
     `attributionSkill`. Assert it stays `type=="subagent"` and its turns
     remain in `<none>` — subagent behavior unchanged.
   - **A non-worker session** (first user line that matches no
     `<command-name>` phase skill → `type=="other"`) with an untagged turn.
     Assert its turn remains in `<none>` — the override is worker-only.

   Reuse `assert_eq` / `assert_close` (lines 20-58), the
   `printf '%s\n' '<json line>' >> "$jsonl"` fixture-line idiom, and the
   `jq . "$jsonl" >/dev/null` fixture self-check. Register the new assertions
   with the shared `PASS`/`FAIL`/`TOTAL` counters so `report_results` (lines
   59-64) covers them.

**Dependencies.** Units 1 and 2.

**Recommended model.** sonnet

### Out of scope (deliberate)

- Changing the harness's `attributionSkill` emission — consumer-side fix
  only.
- `audit-aggregate-writer.mjs` and `topic-usage-writer.mjs`: verified
  shape-compatible (`projectBucket` validates the four token counts plus
  `turns` and `price_proxy_usd`, and is key-agnostic —
  `audit-aggregate-writer.mjs:194-220,310`). No edit, no schema bump.
- Reconciling the three phase↔skill enumerations (classifier alternation
  line 319 / `$phase_skill` map lines 882-883 / shell `_phase_map` lines
  108-113). They are different-purpose lists; this tactic single-sources
  only the one it consumes.
- Wiring `test-aggregate-usage.sh` into `.github/workflows/unit-tests.yml`.
  The suite is not in CI today (no `dispatch-token-audit` entry there), and
  adding it is a separate, independently-verifiable change that would put
  unrelated CI risk on this node. Record it as a residual observation in the
  PR body rather than doing it here.
- Backfilling or re-computing already-persisted Firestore aggregates. The
  step discontinuity is documented (Unit 2.4), not rewritten.

## Reuse

- `.claude/skills/dispatch-token-audit/scripts/aggregate-usage.sh:308-320` —
  the `$type` classifier. Already computes the whole-session classification
  and already carries the phase-skill alternation (line 319). Extended in
  place with a named capture group rather than replaced by a new
  session-level classifier.
- `.claude/skills/dispatch-token-audit/scripts/aggregate-usage.sh:296-301` —
  `$rows` (per-turn `{model, skill, branch, u}`). The multi-phase guard and
  `by_attribution_skill` both read it unchanged; only the derived `$arows`
  is re-keyed.
- `.claude/skills/dispatch-token-audit/scripts/aggregate-usage.sh:328-343` —
  the `$by_skill` / `$by_skill_model` reduce bodies and `sum_usage`. Reused
  verbatim; only their input list changes.
- `.claude/skills/dispatch-token-audit/scripts/aggregate-usage.sh:521-542` —
  `session_cost($r)`, `zero_usage`, `add_usage`, `zero_bucket`,
  `add_to_bucket`, `price(u)`. Reuse for any new bucket math; do not
  redefine.
- `.claude/skills/dispatch-token-audit/scripts/aggregate-usage.sh:644-652` —
  the `by_node` reduce. The existing session-grained (not turn-grained)
  accumulation template; `attribution_coverage` follows the same idiom.
- `.claude/skills/dispatch-token-audit/scripts/aggregate-usage.sh:767-789`
  and `:890-895` — the emitter-allowlist guard shape (`select(.type ==
  "worker" ...)`) that avoids double-counting nested subagent emitters.
  Both keep working unchanged; do not re-derive that logic.
- `.claude/skills/dispatch-token-audit/scripts/aggregate-usage.sh:585-599` —
  `$totals`. `attribution_coverage` sits beside it and reuses its
  `[ $rows[].turns ] | add // 0` idiom.
- `.claude/skills/dispatch-token-audit/scripts/test-aggregate-usage.sh:20-64`
  — `assert_eq`, `assert_close`, `report_results`, `PASS`/`FAIL`/`TOTAL`.
  Reuse this harness; do not write a new runner.
- `.claude/skills/dispatch-token-audit/scripts/test-aggregate-usage.sh:764-838,
  839-874` — the isolated-sub-suite pattern (own `mktemp -d` root, own
  `DISPATCH_AUDIT_PROJECTS_ROOT`, own `trap`). Unit 3's new sub-suite
  mirrors it.
- `.claude/skills/dispatch-token-audit/scripts/test-aggregate-usage.sh:180-196`
  — existing fixture mixing tagged and untagged turns in one session; the
  closest scaffolding for the new fixtures.
- `.claude/skills/dispatch-token-audit/SKILL.md:49-53, 74, 83, 101, 105, 115`
  — the documented consumer contract for `by_phase` / `by_phase_model` /
  `lenses.*`. Update in the same pass as the script; do not let the two
  drift.
- `.claude/skills/dispatch-token-audit/otel-trial-notes.md:37-97` — prior
  design-level write-up of this exact defect. Useful background; **its
  file:line citations are stale** (it cites `by_node` at 593-601, actually
  644-652; `by_skill`/`by_phase` at 296-311/562-585, actually
  296-343/613-636). Trust the line numbers in this plan, not that file's.

## Verification

Baseline before starting: the suite is green at **182/182 passed, 0 failed**
on this worktree at HEAD. After the change it must still be green, with the
new sub-suite's assertions added to the count and **no existing expected
value modified**.

```verify
bash .claude/skills/dispatch-token-audit/scripts/test-aggregate-usage.sh
```

```verify
bash .claude/skills/dispatch-token-audit/scripts/test-audit-aggregate-writer.sh
```

```verify
.claude/skills/dispatch-propagate/scripts/run-lint.sh
```

Manual / judgment checks:

- **Live re-run and re-measure.** Run
  `.claude/skills/dispatch-token-audit/scripts/aggregate-usage.sh --days 4
  --json-out /tmp/usage-after.json` against real transcripts, then read `jq
  '.attribution_coverage' /tmp/usage-after.json`. `effective_coverage_rate`
  should be materially above `raw_coverage_rate`; `unattributed_price_proxy_usd`
  should drop sharply against the `<none>` line the 2026-07-31 measurement
  recorded ($1,319 real / $2,214 proxy pooled). Expect
  `by_phase["review-fix"]` to rise toward the $754 true cost measured for
  that window. These are directional expectations, not exact targets — the
  window and workload differ.
- **Invariance spot-check.** Confirm `totals.price_proxy_usd` and
  `totals.cost_usd` on the live re-run are unchanged when the same window is
  re-run against the pre-change script (stash the change, re-run, compare).
  Attribution re-keying must move money between buckets, never create or
  destroy it.
- **Single-key check.** `jq '[.sessions[] | select(.type=="worker" and
  .whole_session_attributed) | .phases | keys | length] | unique'` should
  return `[1]` — a single-phase worker session's `phases` map contains
  exactly one key.
- **Multi-phase preservation.** `jq
  '.attribution_coverage.multi_phase_worker_sessions'` on live data: inspect
  any session it counts and confirm by hand that it genuinely ran two phase
  skills. A high count would mean the guard is mis-firing and folding is
  being skipped where it should apply.
- **Re-baseline announcement (observe in production).** The first
  `/dispatch-token-audit` report generated after this lands must state that
  phase figures are not comparable to earlier windows. If
  `DISPATCH_AUDIT_AGGREGATES_ENABLED=1` on the host, the persisted `byPhase`
  time series will show a step at the landing date; that is expected.
- **Sequencing.** Land this before `tactic-review-skill-body-decomposition`
  (currently `phase:review`, fix lane parked via
  `tactic-hold-fix-cap-review-skill-body-decomposition`, PR #3025). If that
  sibling lands first, re-baseline the review-phase numbers before drawing
  any conclusion from a before/after comparison — it moves terminal actions
  into subagents and changes where the work is measured.
