---
id: tactic-legacy-router-removal
kind: tactic
statement: "drain complete: remove the legacy gh router and dispatch:* label conventions"
owner: ai
status: codified
parent: tactic-graph-native-dispatch
rationale: "The strategy's threshold: legacy gh dispatch router deleted with the
  /file-issue + /plan-issue coverage matrix fully mapped. Gated on an external
  condition — the gh queue draining to zero — checked at plan step 0; parks
  itself if not yet drained (blocked_by cannot express an external condition)."
reading: null
gap: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: implement
execution: null
validates:
  - strategy-graph-native-dispatch
blocked_by:
  - tactic-graph-router-transitions
  - tactic-dispatch-lifecycle-sensor
  - tactic-phase-skill-node-targets
office_hours:
  reason: "implement: tactic-legacy-router-removal Unit 1 could only be partially
    completed - several 'legacy' scripts are still live-wired into the
    graph-native tick and general harness; remaining scope needs a re-plan. See
    office-hours-recommendation for the full checklist."
  since: 2026-07-12
  recommendation: >-
    ## Recommended next steps — `tactic-legacy-router-removal`


    ### Already safely landed (do NOT re-verify)

    Commit `5c753ba7`, merged as `ee12fc1b`, pushed to
    `origin/tactic-legacy-router-removal`. The non-live-wired portion of Unit 1
    is done:

    - **Legacy office-hours entry surface deleted** — `office-hours` shell
    script (attach/resume/provision verbs), `office-hours-select-target`,
    `dispatch-office-hours-strip.sh` UserPromptSubmit hook (deregistered from
    `settings.json`), `office-hours/SKILL.md` rewritten to node-id-only,
    `office-hours.nix` repointed to `office-hours-graph`, dead test sections
    removed. Fully superseded by `office-hours-graph`.

    - **Legacy `<issue-num>-<slug>` worktree lane deleted** —
    `worktree-create.sh` reduced to the graph lane
    (`.claude/worktrees/<node-id>` only); dropped `.bare` anchoring, gh-identity
    stub, `tmp/dispatch-worktree` marker. Superseded by Claude Code native
    worktrees.

    - `npm test --prefix packages/intentionsutil` — 404 passing, clean —
    reconfirmed after the partial Unit 1 change.


    These have no remaining callers. They are done and merged — pick up from the
    coupling checklist below, not from scratch. No PR was opened (the remaining
    scope wasn't buildable this pass — see below); the branch
    `tactic-legacy-router-removal` carries the commit directly.


    ### Blocked — remaining Unit 1 coupling points

    Each legacy script below is still live-wired. The drain gate (empty queue)
    proves no legacy *work* flows; it does **not** mean these are *rewired*.
    Each needs a graph-native target confirmed (or confirmed-not-to-exist-yet)
    before its counterpart can be deleted:


    - [ ] **`dispatch-spawn-job`** — NOT legacy, must stay. Used by
    `dispatch-graph-execute` (graph-native per-node runner) and `dispatch-tick`
    aux jobs (sync-repair, diagnose-main, jit-reminder). Action: remove from
    deletion scope entirely; no rewire.

    - [ ] **`dispatch-select-target`** — owns `--main-broken-sha` (repo-health
    latch, called unconditionally by `dispatch-select-tick`, not lane-gated) and
    `--priority-only` (pace-exempt fallback). Action: extract/relocate
    main-broken detection to a graph-native home, or confirm the graph path
    should own it, before deleting.

    - [ ] **`dispatch-select-tick` legacy-selection path** — behaviorally inert
    today (graph selector runs first, queue empty) but coupled to
    `dispatch-select-target` above and embedded in a ~900-line orchestrator that
    also runs sync, the sync-broken/main-broken latches, auto-merge,
    reconcile-merged for the graph path. Action: reduce to graph+latch-only,
    keeping the still-live latches.

    - [ ] **`dispatch-phase`** — pure read-only sensor; no write/derivation
    split exists to make. Live callers are `statusline.sh`,
    `dispatch-scan-recoverable-deaths`, `dispatch-stop.sh`,
    `restore-dispatch-skill.sh` — NOT a graph transitions layer (graph execute
    uses persisted phase). Action: rewire each sensor caller off
    `dispatch:*`-label derivation, or keep the sensor, before touching it —
    gutting it breaks the status line.

    - [ ] **`dispatch:*` labels** — woven through live paths:
    `dispatch:main-broken`/`sync-broken` (repo-health latches in
    `dispatch-select-tick`); `dispatch:office-hours` (written by
    `dispatch-input-block.sh`, `dispatch-stop.sh`,
    `dispatch-scan-recoverable-deaths`; read by `dispatch-trace-leaf`,
    `dispatch-select-target`); `dispatch:planned`/`qa-done`/`reviewed` (drive
    `dispatch-phase`/`dispatch-route`). Action: retire per-label only after its
    readers/writers are moved to graph-native state.

    - [ ] **`dispatch-materialize-spawn` / `dispatch-launch-worker`** —
    legacy-only, but `dispatch-tick`'s `run_materialize()` still calls
    `dispatch-materialize-spawn` on explicit/pr/issue decisions. Action: reduce
    `dispatch-tick` (shared router carrying both branches) to graph+aux-only
    first.


    Minor prose-only loose ends, non-blocking: stale references in
    `dispatch-propagate/reference.md`, `dispatch-mark-deviation:31`,
    `approve-workflow-commands.sh:64`, and a few `test-dispatch-scripts.sh`
    comments.


    ### Recommended path forward

    1. **Re-scope, don't force.** The remaining Unit 1 work is
    "rewire-then-delete" across the live dispatch system, not "delete
    already-dead code" — materially bigger blast radius than this tactic
    assumed. Split it into its own follow-up tactic (likely a sibling under
    `tactic-graph-native-dispatch`), scoped to: *rewire
    `dispatch-select-tick`/`dispatch-phase`/`dispatch-tick`'s remaining
    `dispatch:*`-label and legacy-script dependencies onto graph-native
    equivalents, then delete `dispatch-select-target`,
    `dispatch-materialize-spawn`, `dispatch-launch-worker`, and the drained
    labels.* It needs its own planning pass. Explicitly carve out
    `dispatch-spawn-job` as keep-forever.

    2. **Alternatively**, rule on individual coupling points above where you're
    confident the graph path should simply own the behavior (e.g. main-broken
    latch) — that lets those specific deletions proceed under the original scope
    without a full re-plan.

    3. **Keep Units 2 and 3 gated appropriately** (see below — this overrides
    the implementer's own suggestion on Unit 3).


    ### Units 2 and 3 status

    - **Unit 2 — not attempted.** Depends on Unit 1 explicitly per the plan.
    Keep blocked on the re-scoped follow-up.

    - **Unit 3 — not attempted. Also gated, despite having no explicit `Depends
    on: Unit 1` line.** Unit 3 prunes nodes whose relevance "expires" at drain
    completion — specifically `tactic-dispatch-gh-api-interim-hardening`, whose
    demotion note ties its deletion to the legacy-gh surface actually being
    removed, and the `tactic-review-lows-automation` sweep of "legacy dispatch
    scripts" items whose subject files this tactic deletes. Since the legacy-gh
    surface (`dispatch-select-target`, `dispatch-phase`'s derivation, the
    `dispatch:*` labels, `dispatch-materialize-spawn`/`dispatch-launch-worker`)
    is NOT actually removed yet, the expiry event Unit 3 keys off has not
    occurred. Pruning `tactic-dispatch-gh-api-interim-hardening` now would drop
    an interim-hardening exception while the surface it hardens is still live —
    premature and potentially unsafe. Hold Unit 3 until the re-scoped Unit 1
    follow-up actually lands the deletions.
pace_exempt: false
rounds: null
attributes: {}
---
# drain complete: remove the legacy gh router and dispatch:* label conventions

## Context

The strategy's threshold: legacy gh dispatch router deleted with the
`/file-issue` + `/plan-issue` coverage matrix fully mapped. The matrix
(`intentions/tactic-graph-native-dispatch.md` §4) is the removal
checklist — every deleted behavior must map to a matrix row landed by a
sibling tactic.

## Step 0 — drain gate (external condition)

Verify the gh queue is empty: no open dispatch-eligible issues (`help
wanted` without open blockers) and no open dispatch-owned PRs. If
non-empty, this tactic parks itself (`office_hours`, reason: awaiting
drain) — `blocked_by` edges cannot express an external condition, so the
gate is a plan step.

## Unit 1 — remove the selector and phase-derivation surface

**Recommended model:** opus

Scope: in `.claude/skills/dispatch-propagate/scripts/` delete or reduce:
`dispatch-select-target`, the legacy path in `dispatch-select-tick`,
`dispatch-phase`'s derivation logic (its read-only sensor side survives in
the transitions layer), the legacy office-hours entry surface — the
`office-hours` shell entry script with its attach/resume/provision verbs,
`office-hours-select-target`, and the `dispatch-office-hours-strip.sh`
UserPromptSubmit hook — superseded by the graph-native always-launch-fresh
entry (strategy clarification 30, `tactic-office-hours-graph-entry`; the
queue view is the `office_hours != null` projection, and the park clears
per clarification 4, not via a strip hook), and every `dispatch:*` label
convention remaining in scripts and skill docs. Also retire the legacy
worktree-layout conventions (strategy clarification 23):
`worktree-create.sh`'s `<issue-num>-<slug>` lane (git-common-dir
anchoring and the gh identity stub) and `dispatch-materialize-spawn`'s
sibling `$PROJECT_ROOT/worktrees/` placement — after removal, no repo
machinery references the `.bare` common dir or the `worktrees/`
container, and Claude Code native worktrees at
`<project-root>/.claude/worktrees/` are the only worktree surface. The
full legacy launch chain (`dispatch-materialize-spawn`,
`dispatch-launch-worker`, `dispatch-spawn-job`) deletes whole — node
targets never extended it: the tick executes graph selections as a
workflow fan-out (strategy clarification 24,
`tactic-graph-router-selector` unit 4). Each
deletion cites its matrix row or its graph-native replacement tactic.

## Unit 2 — retire the legacy authoring skills

**Recommended model:** sonnet

Depends on: Unit 1.

Scope: retire `/file-issue` and `/plan-issue` skill docs with pointers to
their successors. (The gh↔graph mapping layer — `intention-emit`,
`backfill.ts`/`refresh.ts`, `trackers/`, `rank-map.ts` — was already
removed when the parallel-drain migration superseded the mapping strategy;
nothing of it remains to retire here.)

## Unit 3 — prune the drain-expiry graph nodes

**Recommended model:** sonnet

Scope:
- The greenfield-relevance gate (strategy clarification, 2026-07-06) names
  this tactic as the expiry event for interim-live-risk exceptions on the
  legacy-gh surface. At drain completion, prune the nodes that expire with
  it: `tactic-dispatch-gh-api-interim-hardening` (demoted draft whose
  demotion note says delete here), and sweep
  `tactic-review-lows-automation`'s "legacy dispatch scripts" section —
  drop the items whose subject files this tactic deletes, keep the
  survivors (token-audit, CI wrappers, hooks, lib.sh duplication items
  that outlive the gh lane).
- Land the prunes through `graph-commit --prune`
  (`tactic-graph-commit-prune-support` Unit 1) if it has shipped;
  otherwise the hand-orchestrated `graph/**` fast-path per the prune
  precedent (a54f4ced).

## Dependencies

- `tactic-graph-router-transitions`, `tactic-dispatch-lifecycle-sensor`,
  `tactic-phase-skill-node-targets`, `tactic-main-qa-phase`,
  `tactic-office-hours-graph-entry` — the frontmatter `blocked_by` set:
  the replacement surface must be live end to end (the node-targets
  tactic is what lets the phase skills run on node targets at all; the
  main-qa tactic is what lets the qa-main label machinery be deleted;
  the office-hours entry is what lets the legacy office-hours surface in
  Unit 1's deletion list go). The align-skills pair
  (`tactic-align-strategy-skill`, `tactic-align-tactics-skill`) already
  completed and pruned — both skills are live.

## Verification

```verify
npm test --prefix packages/intentionsutil
```

Manual: repo grep for `dispatch:` label references — zero hits outside git
history; then one tactic completes a full lifecycle graph-natively (the
signal observable) with the legacy scripts gone, and the lifecycle
sensor's next reading reflects it.

## Implementation notes

One subagent per unit, `model` per tag; constrain to working-tree edits.
