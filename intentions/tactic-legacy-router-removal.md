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
phase: review
execution:
  branch: tactic-legacy-router-removal
  pr: 2960
  attempts: {}
  markers:
    - planned
    - qa-done
  strategy_fingerprint: null
  fix: null
validates:
  - strategy-graph-native-dispatch
blocked_by:
  - tactic-phase-skill-node-targets
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# drain complete: remove the legacy gh router and dispatch:* label conventions

## Status — Unit 1 SPLIT: live-wired half landed, non-live-wired half delegated (2026-07-23)

**Read this before touching anything below. An earlier revision of this section
(2026-07-22) claimed Unit 1 was "fully complete" and instructed "do **not**
re-attempt any of it." That claim was FALSE and has been removed. Do not
re-derive it.**

### What actually landed

Unit 1's **live-wired** half landed via a separately-recorded tactic,
`tactic-dispatch-legacy-rewire` (PR #2869, `a8c4898d`, merged and pruned as done
2026-07-18). Verified on `origin/main`: `dispatch-select-target`,
`dispatch-phase`, `dispatch-materialize-spawn`, `dispatch-launch-worker`,
`dispatch-trace-leaf`, and `dispatch-route` are all absent from
`.claude/skills/dispatch-propagate/scripts/`. The main-broken/sync-broken latches
now live in a label-free `repo-health` sensor called from `dispatch-select-tick`;
`dispatch-select-tick`'s legacy gh-issue-queue selection path is gone;
`dispatch-tick` has no `run_materialize()` / materialize-spawn call left. That
half is genuinely done.

### What did NOT land

Unit 1's **non-live-wired** half — the legacy office-hours entry surface and the
legacy `<issue-num>-<slug>` worktree lane — **never landed on `main`**.

The 2026-07-22 revision cited commit `ee12fc1b` as evidence it had. That citation
was a misreading. `ee12fc1b` is a merge of `origin/main` **into** the branch
`tactic-legacy-router-removal`, not a merge of the branch into `main`. No PR was
ever opened for that branch and it was never merged. The mechanical check:

```
git merge-base --is-ancestor ee12fc1b origin/main   # returns NON-ZERO
```

Every file that half claimed to delete is still present on `origin/main` as of
2026-07-23: `office-hours-select-target` (595 lines), the `office-hours` shell
entry (333), `.claude/skills/office-hours/SKILL.md` (386, still dual-lane),
`.claude/hooks/dispatch-office-hours-strip.sh` (50), `nix/packages/office-hours.nix`
(35, still pointing at the legacy script), the legacy `<issue-num>-<slug>` lane
inside `.claude/hooks/worktree-create.sh`, and the matching test blocks in
`test-dispatch-scripts.sh`.

The 2026-07-22 revision was also internally inconsistent: it asserted the strip
hook was "gone" while a later paragraph in the same section correctly described
it as "still registered as a UserPromptSubmit hook." The later paragraph was
right. Both statements have been rewritten below so the body no longer
contradicts itself.

Consequence of the false claim, and the reason this correction exists: an
autonomous `/implement` reading "complete, do not re-attempt" silently does
nothing and the node advances with the work undone. Any future session would be
trapped the same way.

### Where the residual work went

Split out on 2026-07-23 by explicit author decision into a sibling tactic:

**`tactic-legacy-office-hours-entry-removal`** — carries the full non-live-wired
scope as a clean-session-executable plan, including the two live-wiring moves
that must land in the same commit as their deletions (`.claude/settings.json`'s
`UserPromptSubmit` registration of the strip hook, and
`nix/packages/office-hours.nix:19`'s `SCRIPT=` pointer, which is the author's
daily terminal `office-hours` command). It also picks up one stale doc pointer
the old branch never fixed (`.claude/skills/dispatch-propagate/reference.md:585`).

**Do not re-plan that scope here, and do not re-attempt it from the branch.**
`origin/tactic-legacy-router-removal` is ~851 commits behind (merge-base
`444bf41a`) and conflicts in three files whose branch sides are not salvageable
— it would revert the landed `resolve_main_worktree` DRY refactor, re-introduce
retired `.bare` prose, and carry 70 references to a script `main` has since
deleted. The remote ref is deliberately retained as a record of the intended
shape; it is not a base to build on. The local branch of the same name was reset
fresh off `main` and holds none of that content.

### Earlier bookkeeping, retained

On 2026-07-22 a follow-up sibling `tactic-legacy-dispatch-rewire-delete` was
split out to re-plan the *live-wired* half, acting on a 10-day-stale office_hours
recommendation without re-checking repo state. That follow-up duplicated
`tactic-dispatch-legacy-rewire`, which had already landed the same scope four
days earlier, so it was pruned rather than re-planned. Its dangling `blocked_by`
edge was dropped from this node's frontmatter at that time. That part of the
2026-07-22 correction stands; only its completion claim for the non-live-wired
half was wrong.

The `dispatch:*` labels still read/written today (`dispatch:office-hours`,
`planned`, `qa-done`, `reviewed`, `review-followup`, `chain-stalled`, and
`sync-broken` as an announcement-only mirror over the now label-free latch) are
not un-rewired legacy debt — they are current design in active service of the
still-live legacy issue-lane skills (`plan-issue`, `qa-fix`, `review-fix`) that
**Unit 2** below retires, or a human-visibility mirror
`tactic-dispatch-legacy-rewire` Unit 1 deliberately kept.

### This node's remaining scope

**Units 2 and 3 only** (below). Unit 1 is retained for provenance and is closed
out here: its live-wired half is done, its non-live-wired half belongs to
`tactic-legacy-office-hours-entry-removal`. Nothing in Unit 1 is this node's work
any more.

No `blocked_by` edge to the new sibling was added, deliberately. Units 2-3 touch
disjoint files from it (Unit 2: the `/file-issue` and `/plan-issue` skill docs;
Unit 3: graph nodes only), and neither node's correctness depends on the other
landing first. Adding a reflexive edge would re-serialize independent work —
which is the failure mode this whole correction is cleaning up. The one place the
sibling matters to this node is Unit 3's sweep of
`tactic-review-lows-automation`'s "legacy dispatch scripts" section: that sweep
must now account for files the *sibling* deletes as well as files this node
deletes, and if the sibling has not landed when Unit 3 runs, leave its items in
place rather than dropping them.

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

> **SPLIT — not this node's work (2026-07-23).** This unit's original scope is
> retained below for provenance only, but it is **closed out on this node** and
> split two ways. Its *live-wired* half landed via the separately-recorded
> `tactic-dispatch-legacy-rewire` (PR #2869, merged 2026-07-18) — that part is
> genuinely done. Its *non-live-wired* half — the legacy office-hours entry
> surface and the legacy `<issue-num>-<slug>` worktree lane — **never landed**
> and is now owned by the sibling tactic
> `tactic-legacy-office-hours-entry-removal`, which carries the executable plan.
> A prior revision of this note claimed both halves were complete and told the
> reader not to re-attempt them; that claim was false (see Status above for the
> mechanical disproof). Do not implement this unit from this node — if the
> non-live-wired deletions are still outstanding, they belong to the sibling.

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

Depends on: nothing further. Unit 1's live-wired half is complete; its
non-live-wired half is not this node's work (split to
`tactic-legacy-office-hours-entry-removal` — see Status above), and Unit 2
does not depend on it. This node's `blocked_by` set does not gate on either.

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
  legacy-gh surface. The expiry event is the surface being **actually
  removed** — **not** merely the queue draining. That removal already
  happened: `tactic-dispatch-legacy-rewire` (PR #2869, merged and pruned
  2026-07-18) landed the live-wired deletions (see Status above), so the
  expiry event has occurred and Unit 3 is unblocked on that count. Prune the
  nodes that expire with it. Re-check each before acting —
  `tactic-dispatch-gh-api-interim-hardening` (the demoted draft whose demotion
  note said delete here) was already pruned from the graph as of 2026-07-23, so
  that item may be a no-op. Then sweep `tactic-review-lows-automation`'s
  "legacy dispatch scripts" section — drop the items whose subject files are
  actually gone from `origin/main`, keep the survivors (token-audit, CI
  wrappers, hooks, lib.sh duplication items that outlive the gh lane).
  **Note the split:** several of those subject files (the `office-hours` entry,
  `office-hours-select-target`, `dispatch-office-hours-strip.sh`) are deleted by
  the sibling `tactic-legacy-office-hours-entry-removal`, not by this node. Test
  each item against `origin/main` rather than against a deletion list; if the
  sibling has not landed yet, leave its items in place.
- Land the prunes through `graph-commit --prune`
  (`tactic-graph-commit-prune-support` Unit 1) if it has shipped;
  otherwise the hand-orchestrated `graph/**` fast-path per the prune
  precedent (a54f4ced).

## Dependencies

Frontmatter `blocked_by` today is a single entry:
`tactic-phase-skill-node-targets`, which is `phase: done` — so this node is
unblocked and may proceed on Units 2 and 3.

Historical dependency notes, kept so the reduction is not re-derived as a
mistake:

- `tactic-legacy-dispatch-rewire-delete` — a 2026-07-22 re-scope follow-up that
  turned out to duplicate already-landed work (`tactic-dispatch-legacy-rewire`,
  PR #2869, merged and pruned 2026-07-18 — see Status above); pruned rather than
  re-planned, and its edge dropped from `blocked_by`.
- `tactic-graph-router-transitions`, `tactic-dispatch-lifecycle-sensor`,
  `tactic-main-qa-phase`, `tactic-office-hours-graph-entry` — formerly in the
  `blocked_by` set. All four have since completed and been pruned from the
  graph, so their edges were removed; a prose paragraph here previously still
  listed them as live frontmatter entries, which no longer matched the
  frontmatter. Their substance: the replacement surface had to be live end to
  end before the legacy one could go, and it now is.
- The align-skills pair (`tactic-align-strategy-skill`,
  `tactic-align-tactics-skill`) also completed and pruned — both skills are live.
- `tactic-legacy-office-hours-entry-removal` — the 2026-07-23 split sibling
  carrying Unit 1's non-live-wired half. **Deliberately not** a `blocked_by`
  edge: it and this node's Units 2-3 touch disjoint files, and neither gates the
  other. See the Status section's "This node's remaining scope" for the one
  interaction (Unit 3's sweep).

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
