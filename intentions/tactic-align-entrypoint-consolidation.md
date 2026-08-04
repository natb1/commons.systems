---
id: tactic-align-entrypoint-consolidation
kind: tactic
statement: "Consolidate the interactive graph entry point as /align: rename
  /align-strategy, fold in and remove /align-init, retire the align jit and
  rung-5 dialectic engine, single-PR atomic rename with full reference sweep"
owner: ai
status: codified
parent: null
rationale: "Finalized 2026-07-18 /align-tactics per-node pass on the strategy's
  2026-07-09 /align consolidation clarification
  (strategy-graph-native-dispatch): /align-strategy is a misnomer for a skill
  that manipulates the whole persistent layer, /align-init's interactive half
  duplicates the onboarding funnel the entry point should carry itself, and the
  /align name is free since PR #2781 deleted the legacy skill. The strategy's
  own clarification (recorded 2026-07-09, cited verbatim in this node's body) is
  the authoritative source for the consolidation's five decision points; this
  node adds the concrete unit breakdown, exact path:line anchors, and a
  sequencing edge discovered during finalization (see blocked_by)."
reading: null
gap: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: main-qa
execution:
  branch: tactic-align-entrypoint-consolidation
  pr: 2983
  attempts: {}
  markers:
    - planned
    - qa-done
    - reviewed
  strategy_fingerprint: null
  fix: null
  completion:
    mergedAt: 2026-08-04T10:24:00Z
    mergeCommitSha: c845d50f88458ea14d6f481f8ae9da43e8ce94fb
    graphCommitSha: null
validates: []
blocked_by:
  - tactic-align-tactics-mechanical-floor
office_hours:
  reason: worker session froze at a permission/classifier denial — claude agents
    reports state=blocked and the transcript has had no activity for 1713s; the
    session cannot make progress and cannot park itself (a blocked session never
    reaches the Stop hook), so the dispatch-tick frozen-session sweep parked
    this node
  since: 2026-08-04
  recommendation: Find the holding job with 'claude agents --all' and attach it
    ('claude attach <job-id>'), then answer the pending prompt. If the denied
    command was gratuitous, cancel it and let the worker continue; if it is
    genuinely needed, run it yourself or add a standing permission rule — do NOT
    rewrite the command to route around the classifier. If the session is
    unrecoverable, stop it ('claude rm <job-id>'), let dispatch-sweep reap the
    worktree, then run clear-park <node-id> to return the node to the lane.
    Until that session is gone, office-hours reports this node as 'all-held'
    rather than launching a review session for it, because the frozen session
    still holds the node-id session name.
  session_type: other
pace_exempt: false
rounds: null
attributes: {}
---
# Consolidate the interactive graph entry point as /align: rename /align-strategy, fold in and remove /align-init, retire the align jit and rung-5 dialectic engine, single-PR atomic rename with full reference sweep

Finalized by a 2026-07-18 `/align-tactics tactic-align-entrypoint-consolidation`
per-node pass. One atomic PR, single branch
`tactic-align-entrypoint-consolidation`.

## Context

`/align-strategy` is the interactive entry point to the graph's persistent
layer but its name says only "strategy" — the layer includes virtues,
traditions, and delegations, all of which the interview may record or amend.
`/align-init`'s interactive half (orientation, deployment validation, handoff
to `/align-strategy`) duplicates the onboarding funnel the entry point should
carry itself. The `/align` name is free: PR #2781 (`tactic-align-init-skill`)
deleted the legacy `/align` skill, and its collision-avoidance rationale was
explicitly migration-scoped.

The authoritative decision record is `intentions/strategy-graph-native-dispatch.md`,
clarification "What is the single interactive entry point to the persistent
layer — and what happens to /align-strategy and /align-init?" (recorded
2026-07-09). Read it in full before implementing — it settles five points this
plan assumes without re-deriving: (1) `/align <prompt>` replaces
`/align-strategy <prompt>` and widens scope to the whole persistent layer, no
separate virtue-review step. (2) `/align-init` folds in: no-prompt `/align`
runs an onboarding funnel (orient, scripted deployment validation, walk to a
prompt, then execute `/align <prompt>` in-session) — a `do-one-thing-name`
split (e.g. a separate `/align-graph`) was considered and rejected. (3) The
scheduled align jit and rung-5 dialectic engine are retired, and
**`/align-strategy`'s existing no-prompt "improvement pass" is retired with
them, not folded into the new onboarding funnel** — both engines' content is
retained verbatim in `tactic-align-audit-legacy-review` (an office-hours
sitting deciding future `/align-audit` inclusion; untouched by this tactic).
(4) `/align` keeps maintaining the review curriculum via the existing
universal-deferral mechanics (`strategy-explicit-intent`) unchanged — no code
change implied, no unit below touches this. (5) Backward compatibility is a
single-PR atomic rename: `/align-strategy` works until merge, `/align` after;
no alias period; the emulated dispatch tick is uninterrupted since no live
`dispatch.config/jit.json` exists (the example config and test fixtures update
in this same PR).

**Sequencing.** `blocked_by: [tactic-align-tactics-mechanical-floor]`. That
tactic (already `phase: qa`, PR #2896, not yet merged — its
`packages/intentionsutil/scripts/align-strategy-census.ts` does not yet exist
on `origin/main`) has an in-flight Unit 4/5 that edits the exact same
`.claude/skills/align-strategy/SKILL.md` Step 1 improvement-pass branch this
tactic deletes outright. Land this tactic only after PR #2896 merges (or is
abandoned) to avoid a wasted-effort collision on the same file region — check
`intentions/tactic-align-tactics-mechanical-floor.md`'s `phase` at
implementation time; if it reads `done`, the edge is satisfied and
`git merge origin/main` will already carry its changes, which Unit 2 below
then deletes as part of the wholesale Step-1 no-prompt-branch replacement.

**Out of scope:** `/align-tactics` internals; `/align-audit` authoring
(`tactic-align-audit-skill`); the retired engines' `/align-audit` inclusion
decision (`tactic-align-audit-legacy-review`); updating `intentions/tactic-*.md`
node bodies that still name `align-strategy`/`align-init` in their own prose —
those update individually the next time each of those nodes is touched, not in
this PR (the drafts previously listed here — e.g.
`tactic-align-interview-type-doctrine`, `tactic-align-skills-latest-graph-guard`
— have since landed and were pruned from the graph as merged/closed work; their
mentions live only in git history now, nothing to fix).

## Units of work

### Unit 1 — Rename the skill directory and widen prompt-path framing

**Recommended model:** sonnet

Scope:
- `git mv .claude/skills/align-strategy .claude/skills/align`.
- In the moved `SKILL.md`: frontmatter `name: align-strategy` → `name: align`
  (line 2); `# Align Strategy` header (line 7) → `# Align`; update the
  `description` frontmatter field to cover both the prompt-driven interview
  and the no-prompt onboarding funnel (Unit 2's replacement), without
  restating rung-5/dialectic-engine language (that's retired, Unit 3).
- Body framing sentences naming `/align-strategy` as the skill's own name
  (distinct from cross-references to *other* skills, which Unit 7 handles) —
  reread the moved file fresh since `git mv` doesn't change line numbers but
  this unit's own edits will; do this unit's text pass in one read-then-edit
  pass over the whole file rather than by stale line number.
- Leave the interview mechanics (current Steps 0, 2 through 8) logically
  unchanged — only the entry-point name and framing change here; Step 1's
  no-prompt branch content is Unit 2's job, not this unit's.

Out of scope: the no-prompt branch content rewrite (Unit 2); any file other
than the moved `SKILL.md` (Unit 7).

Dependencies: none. Must land before Units 2 and 7 (both depend on the file
existing at the new path).

### Unit 2 — Replace the no-prompt branch with the onboarding funnel

**Recommended model:** opus (judgment: designing the new funnel's shape and
script boundary, not a mechanical edit)

Scope — `.claude/skills/align/SKILL.md` (post-Unit-1 path):
- **Trigger and input** section (pre-rename lines 38-49): stop describing the
  no-prompt branch as "the improvement pass"; describe the two branches by
  prompt-presence — with a prompt, the interview (Step 1's "With requirement
  text" branch, unchanged); with no prompt, the onboarding funnel below.
- **Delete outright** Step 1's entire "With no requirement text — improvement
  pass" branch (pre-rename lines 121-148): the condition-vs-repo-state check,
  `reading`/`gap` staleness check, contradicted-clarifications check, the
  greenfield-relevance-gate corpus sweep (strategy clarification 26), and the
  unserved-virtue check. None of this candidate-sweep logic carries into the
  new onboarding funnel — per the strategy clarification cited in Context,
  the improvement pass is retired, not relocated. Its design is retained
  verbatim in `tactic-align-audit-legacy-review` for a future `/align-audit`
  decision; do not duplicate it here.
- **Replace** with the new no-prompt onboarding funnel:
  1. Orient — the one-screen persistent-layer primer, carried from
     `.claude/skills/align-init/SKILL.md` Step 1 "Orient" (pre-delete lines
     64-103, read it from `origin/main` before Unit 3 deletes the file, or
     from git history at commit `44493733` after).
  2. Validate deployment — carried from align-init Step 2 "Validate
     deployment" (pre-delete lines 104-133: workspace-installed check,
     graph-clean check via `validate-graph.ts`, router-heartbeat check), but
     pushed into a new script (mechanical-floor doctrine: rote checks belong
     in scripts, not skill prose) — see Unit 2 Reuse below for the new
     script's shape.
  3. Walk the user Socratically to a crafted prompt (open conversational
     elicitation per this skill's own convention — never `AskUserQuestion`
     for open-ended elicitation, matching the existing "same split as
     align-init's rung-0 intent interview" convention at pre-rename line 49),
     then execute the "With requirement text" branch in the same session
     using that crafted prompt — a direct fall-through, not a re-invocation
     of the Skill tool on itself.
  4. Confirm no accidental carryover of align-init's Step 3 "Review virtues"
     (rung-0 flow, pre-delete lines 134-219) — that flow retires with
     align-init; virtue work now enters only via `/align <prompt>`.
- **Mechanics paragraph** (pre-rename lines 150-159): this paragraph covers
  *two* distinct sweeps — the corpus sweep just deleted above, and Step 3's
  delegation sweep (unrelated, still live). Edit it to drop the "this step's
  corpus sweep" clause and the "strategy-corpus census script... enumeration
  hook for this sweep" sentence (that census-script hook, from
  `tactic-align-tactics-mechanical-floor` Unit 4, targeted the now-deleted
  corpus sweep — if that tactic's PR already merged before this one, its
  census-hook edit to this same paragraph is deleted here too, per the
  `blocked_by` sequencing note in Context), while keeping the "step 3's
  delegation sweep" clause and its `Explore`-fan-out guidance intact — Step 3
  ("Delegation advice") is unaffected by this unit.
- **Out of scope** section (pre-rename lines 574-578): drop the `/align-init`
  sibling-skill line (it's no longer a separate skill, folded in here); keep
  the `/align-tactics` sibling line.

Out of scope: deleting `.claude/skills/align-init/` itself (Unit 3); anything
under Step 2 onward besides the Mechanics-paragraph trim above.

Dependencies: Unit 1 (file must exist at the new path/name). Read align-init's
Orient/Validate content (from this unit or from git history) before Unit 3
deletes the source file.

### Unit 3 — Delete align-init and the rung-5 agent definitions

**Recommended model:** sonnet

Scope:
- `rm -rf .claude/skills/align-init/` — `SKILL.md` plus `scripts/gather-context.sh`,
  `scripts/fetch-analytics.sh`, `scripts/fetch-psi.sh`, `scripts/fetch-forks.sh`.
- `rm .claude/agents/align-decomposer.md .claude/agents/align-consistency.md
  .claude/agents/align-delegability-assessor.md .claude/agents/align-contrarian.md
  .claude/agents/align-financial.md .claude/agents/align-technical.md
  .claude/agents/align-product.md .claude/agents/align-marketing.md
  .claude/agents/align-signal-assessor.md`.

Out of scope: `.claude/skills/ref-delegability/` and
`.claude/skills/ref-signal-identification/` (Unit 5 decides their fate — do
not delete them in this unit).

Dependencies: Unit 2 must have already lifted the Orient/Validate content out
of align-init's `SKILL.md` before this unit deletes it.

### Unit 4 — Retire the align jit; relabel (don't delete) the jit-cadence test fixtures

**Recommended model:** opus (judgment call on the test fixtures)

Scope:
- `.claude/skills/dispatch-propagate/scripts/jit.example.json` — delete the
  whole `align` jit object, lines 26-37 (the `{ "key": "align", ... "skill":
  "align-init" }` block).
- `.claude/skills/dispatch-propagate/scripts/test-dispatch-scripts.sh` — Test
  2d (~line 10412-10441) and the cadence tests "2-align"/"3-align"/"3b-align"/
  "4-align"/"4b-align"/"5-align" (~lines 17506-17916). Verified by reading the
  test bodies: these exercise generic `dispatch-config-load`/
  `dispatch-jit-engine` cadence mechanics (arbitrary key/label/skill-string
  parsing, a 7d/14d cadence pair, and boundary conditions — exact-7d, 7d+1s —
  not covered by the generic `daily-chore` tests). Nothing align-specific is
  actually under test. **Decision: keep all of these tests, relabel the
  fixture** away from `align`/`align-init`/`jit:align`/"Alignment review" to a
  neutral synthetic name (e.g. `weekly-review`/`jit:weekly-review`/
  `weekly-review-engine`) so the suite no longer implies a live align jit
  exists. Update the `# --- Test N-align: ...` banner comments to match the
  new name.
- Pre-rename line 30412 comment ("HUMAN-invoked `/align-strategy` or
  `/align-tactics`...") — reword `/align-strategy` to `/align` (this is the
  same file as the fixtures above; do it in this unit rather than Unit 7,
  since this unit already has the file open).

Out of scope: any other `test-dispatch-scripts.sh` content.

Dependencies: none — independent of Units 1-3, can run in parallel with them.

### Unit 5 — Update the delegability/signal-identification docs' framing; resolve the ref-skill orphan question

**Recommended model:** opus (judgment call on the orphan-skill decision)

Scope:
- `.claude/docs/delegability.md` line 3 ("The delegability evaluation is the
  core of `/align-init`'s per-intention loop...") and line 17 ("Two axes run
  through `/align-init`...") — reword to drop the `/align-init` framing (it no
  longer exists) and point instead at `tactic-align-audit-legacy-review`,
  which retains the rung-5 design for a future `/align-audit` decision. Note
  verbatim source also survives at `origin/main` commit `44493733`
  (`.claude/skills/align-init/SKILL.md`). Do not duplicate content — reference
  only.
- `.claude/docs/signal-identification.md` line 3 ("Signal identification is
  the parse-time half of `/align-init`'s feedback arm...") — same treatment.
- **Decision point, confirm before editing:** grep confirms `ref-delegability`
  and `ref-signal-identification` (`.claude/skills/`) have no live caller
  besides the now-deleted `align-decomposer`/`align-delegability-assessor`/
  `align-signal-assessor` agents (Unit 3) and the two docs above. Recommended
  disposition: **retain both skills and both docs as orphaned reference
  content**, not delete — `tactic-align-audit-legacy-review` is a live plan
  for a future `/align-audit` that will re-consume this exact contract;
  deleting now would force re-authoring later for no benefit. If a live
  caller turns up during implementation that this plan missed, treat that as
  new information and keep the skill/doc live regardless (the "orphan"
  premise was wrong, not the conclusion).

Out of scope: deleting `ref-delegability`/`ref-signal-identification`
themselves under any circumstance in this unit — this unit only updates the
two docs' framing text.

Dependencies: none — independent of other units, can run in parallel.

### Unit 6 — settings.json permission sweep

**Recommended model:** opus (small edit, but the "no replacement needed"
conclusion is a judgment call worth a fresh read, not assumed)

Scope: `.claude/settings.json` — remove line 8 (`"Skill(align-init)"`) and
line 38 (`"Bash(.claude/skills/align-init/scripts/gather-context.sh:*)"`).

**Decision, state explicitly in the commit:** no new `Skill(align)` or
`Bash(.claude/skills/align/scripts/<validate-deployment-script>:*)` entry is
needed. `Skill(align-init)` existed because `dispatch-jit-reminder` invoked it
non-interactively (no human present to approve a permission prompt) for the
scheduled align jit; `/align` (like the old `/align-strategy`/`/align-tactics`,
neither of which ever had a `Skill()` entry) is on-demand/human-invoked only —
no background invocation path remains once Unit 4 retires the jit. Confirm
this by re-checking `.claude/settings.json` for `Skill(align-strategy)` or
`Skill(align-tactics)` entries at implementation time (expected: none) before
relying on the "no entry needed" conclusion. The removed
`gather-context.sh` entry belonged to the external-sensor-fetch path
(`fetch-analytics.sh`/`fetch-psi.sh`/`fetch-forks.sh`), deleted outright by
Unit 3, not carried into Unit 2's new deployment-validation script — so its
allowlist entry is correctly removed with no replacement.

Dependencies: none — independent of other units, land any time.

### Unit 7 — Mechanical reference sweep

**Recommended model:** sonnet

Scope — re-verify each line number by reading the file fresh before editing
(numbers below are current as of this plan's writing and may have drifted if
earlier units already touched the same file):

- `.claude/skills/align-tactics/SKILL.md` — lines 32, 35, 208, 210, 231, 242,
  260, 296, 453: reword `/align-strategy` → `/align` and
  `.claude/skills/align-strategy/SKILL.md` → `.claude/skills/align/SKILL.md`.
  Line 649 additionally drops the `/align-init` sibling-skill mention (folded
  into `/align`, no longer separate). **Line 372 needs a substantively
  different fix, not a mechanical rename**: it currently reads "This is the
  same gate `/align-strategy`'s improvement pass runs across the whole
  corpus". Since Unit 2 retires the improvement pass entirely (not relocates
  it), reword to something like: "This is the greenfield-relevance gate
  (strategy clarification 26 on strategy-graph-native-dispatch) —
  `/align-strategy`'s improvement pass, which ran a whole-corpus application
  of this gate, was retired by `tactic-align-entrypoint-consolidation` (design
  retained in `tactic-align-audit-legacy-review`); `/align-tactics`'s
  per-round application below is now the gate's only live use." Do not word it
  as "moves into the onboarding walk" — the onboarding funnel (Unit 2) does
  not run this gate.
- `.claude/skills/dispatch-token-audit/scripts/aggregate-usage.sh` (~line 287,
  a jq regex alternation `align-strategy|align-tactics|align-init`) and
  `.claude/skills/dispatch-token-audit/scripts/test-aggregate-usage.sh`
  (~line 1181, a bash list `align-strategy align-tactics align-init`): these
  classify **historical** session transcripts by command name, including
  pre-rename ones. **Add** `align` to the alternation/list; **keep**
  `align-strategy`/`align-tactics`/`align-init` (removing them would
  misclassify old transcripts). Update any nearby comment counting the
  align-family skills to reflect the addition.
- `.claude/skills/grounding-research/SKILL.md` (~lines 25, 151) and
  `.claude/skills/reading-review/SKILL.md` (~lines 104, 362) —
  `.claude/skills/align-strategy/SKILL.md` → `.claude/skills/align/SKILL.md`
  wherever cited for the shared "interaction split"/"register" convention.
- `.claude/skills/office-hours/SKILL.md` (~line 369) — `` `/align-strategy` or
  `/align-tactics` `` → `` `/align` or `/align-tactics` ``.
- `.claude/skills/dispatch-propagate/scripts/assert-worktree-fresh` (~lines
  3-4, a comment listing "the interactive align skills (/align-strategy,
  /align-tactics, /align-init, ...)") → "/align, /align-tactics, ...".
- `packages/intentionsutil/SEPARABILITY.md` (~lines 153, 160, 165) —
  `/align-strategy` → `/align`.
- `packages/intentionsutil/scripts/read-sensors.ts` (~line 24) and
  `functions/src/project-signals.ts` (~line 24) — comments pointing at
  `.claude/skills/align-init/scripts/fetch-*.sh`. Those scripts are deleted
  outright by Unit 3, not repathed — reword the comments to note the fetch
  scripts were retired (point at `origin/main` commit `44493733` for
  history), not to a new path.
- `README.md` (~lines 67-73, 231-232) — collapse the three-skill family
  description (`/align-init`, `/align-strategy`, `/align-tactics`) to two
  (`/align`, `/align-tactics`), folding align-init's onboarding description
  into `/align`'s no-prompt-path description.

Out of scope: `intentions/tactic-*.md` node bodies (see Context, "Out of
scope"); `intentions/tactic-graph-native-dispatch.md` (Unit 8, below — the
spec, not a plain reference-sweep hit, needs judgment about surrounding
prose, not just find/replace).

Dependencies: Units 1-3 must land first — this unit's fixes assume the new
path/behavior already exists.

### Unit 8 — Update the spec: `intentions/tactic-graph-native-dispatch.md` §2, §2.1, §2.2

**Recommended model:** opus (judgment: rewriting spec prose to match the
ratified design, not a mechanical rename)

Scope: grep `intentions/tactic-graph-native-dispatch.md` for `align-strategy`
and `align-init` (re-verify current line numbers — the file changes
independently of this tactic). Rewrite §2.1 (currently describing
`/align-init` as "the fork entrypoint... retires legacy `/align`") to instead
describe `/align` folding both the interview and onboarding roles; drop the
"align jit's skill reference updates to align-init" line (the jit is retired,
Unit 4); rewrite §2.2 header/prose `/align-strategy` → `/align`. Cross-check
the rewrite against `intentions/strategy-graph-native-dispatch.md`'s
2026-07-09 consolidation clarification (cited in Context) — align the spec's
language with that clarification's five points rather than re-deriving them
independently. `intentions/strategy-graph-native-dispatch.md` itself is a
strategy node body — read-only reference, not edited by this tactic (no
strategy edit in a per-node tactic-target session, per this skill's own
contract).

Dependencies: Units 1-4 (the spec should describe the landed shape, not the
in-flight one).

## Reuse

- New deployment-validation script (Unit 2): mirror the house style of
  `.claude/skills/dispatch-propagate/scripts/assert-worktree-fresh`
  (single-purpose, clear-errors-rule failure messages, no `gh`/network calls)
  and other `dispatch-propagate/scripts/*` scripts (`set -euo pipefail`,
  printed diagnostics over silent exit codes). Reuse the three existing
  checks' logic from align-init's Step 2 prose directly — this is a mechanical
  port into a script, not a new design (workspace-installed via `npm test`
  equivalent, graph-clean via
  `npx tsx packages/intentionsutil/scripts/validate-graph.ts`, router
  heartbeat via `systemctl --user is-active dispatch-claude-daemon.service`).
- Node-authoring/write paths used by the renamed skill's own Steps 0 and 5
  (claim/worktree, `write-node.ts`/`graph-commit`) are untouched — no new
  tooling needed there.

## Verification

```verify
.claude/skills/dispatch-propagate/scripts/run-unit-tests.sh --pr-scripts
```

```verify
.claude/skills/dispatch-propagate/scripts/run-unit-tests.sh --token-audit-scripts
```

```verify
npx tsx packages/intentionsutil/scripts/validate-graph.ts
```

Manual/prose verification:

- New `validate-deployment.sh` (Unit 2): run it standalone in a shell,
  confirm all three checks execute and that failure-mode messages match the
  intent of align-init's old Step 2 prose (workspace not installed / graph
  broken / daemon inactive).
- Confirm `/align` triggers correctly with and without a prompt argument in an
  interactive session — the no-prompt path should reach the new onboarding
  funnel (orient → validate → walk-to-prompt → fall through to the interview),
  not error or silently no-op.
- Final completeness grep, expect zero hits outside the two intentionally
  historical-classification files:
  ```
  grep -rln 'align-strategy\|align-init\|Skill(align-\|skills/align-' \
    --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=intentions . \
    | grep -v 'dispatch-token-audit/scripts/aggregate-usage.sh' \
    | grep -v 'dispatch-token-audit/scripts/test-aggregate-usage.sh'
  ```
- Confirm `intentions/tactic-align-tactics-mechanical-floor.md`'s `phase` is
  `done` (or its PR #2896 abandoned) before starting Unit 2 — the `blocked_by`
  edge in this node's frontmatter should already gate router selection, but a
  human-invoked implementation session should re-check by hand too.

## needs-main residue

Filed by `/qa-fix` (PR #2983). Drained after `review → main-qa` fires post-merge.

- **id:** 17
- **title:** Residual `align-strategy` / `align-init` prose inside `intentions/*.md` node bodies
- **url_path:** current
- **expected_outcome:** All `align-strategy`/`align-init` hits inside `intentions/` are narrative prose in node bodies scheduled for individual later updates, not executable directives.
- **finding:** Not walked at QA time — the tactic's own scope statement explicitly defers updating `intentions/tactic-*.md` node bodies that name `align-strategy`/`align-init` in their own prose to later per-node work; completeness there is not assertable against this PR (planned deferral).
