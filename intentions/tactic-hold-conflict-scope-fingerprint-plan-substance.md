---
id: tactic-hold-conflict-scope-fingerprint-plan-substance
kind: tactic
statement: "hold: provision-conflict on
  `tactic-scope-fingerprint-plan-substance` — a tracked hold blocking the source
  until the mechanical retry state is resolved"
owner: ai
status: codified
parent: null
rationale: null
reading: null
gap: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: null
execution: null
validates: []
blocked_by: []
office_hours:
  reason: "/dispatch-conflict Lane 3: origin/main merge conflict on PR #2974
    resolved textually clean across 5 files (transition-node, qa-fix/SKILL.md,
    qa-fix/references/needs-main-followups.md, qa-main/SKILL.md, router.ts) by
    an Opus resolver subagent, but the merged tree fails
    packages/intentionsutil/test/restamp-scope-fingerprint.test.ts's \"matches
    the needs-main-residue production scenario: A and B fingerprints differ\"
    assertion. This is a semantic conflict, not a marker conflict: the test
    appears to assert pre-rescoping (whole-body-hash) behavior that this PR's
    plan-substance scoping deliberately changes, but a /dispatch-conflict
    session may not weaken a test unilaterally per this repo's test-integrity
    rule, so it escalates for a human call on whether the test's expectation
    should flip."
  since: 2026-08-09
  recommendation: |-
    ## Hold recommendation — `tactic-scope-fingerprint-plan-substance` (PR #2974)

    ### The conflict

    `origin/main` landed two things this branch overlaps: the sibling carrier `tactic-transition-node-stamp-landed-body` (`0848a10e`, functional rewrite of `refresh_stamp()` in `transition-node`), and the orthogonal `qa-main: sort needs-main residue by machine-checkability` feature (`df0c436a`+), which adds a `Verifiability:` (`MACHINE`/`AUTHOR`/`WAIT`) sub-line to residue items in the same qa-fix/qa-main doc sections this PR rewrites. `git merge origin/main` conflicts in 5 files.

    ### Resolution shape (all 5 files; re-derive by re-running `git merge origin/main`)

    - `.claude/skills/dispatch-propagate/scripts/transition-node` — **take origin/main whole.** This PR's own change here was comment-only (per its body); upstream's `refresh_stamp()` rewrite (delegating to `restamp-scope-fingerprint.ts`, reading committed content from git) supersedes it.
    - `.claude/skills/qa-fix/SKILL.md`, `.claude/skills/qa-fix/references/needs-main-followups.md`, `.claude/skills/qa-main/SKILL.md` — **combine both sides.** Keep this PR's machinery-sentinel CLI-append mechanism (`append-machinery-section.ts` instead of hand-editing the node body) *and* origin/main's `Verifiability:` triage content.
    - `packages/intentionsutil/src/router.ts` — **combine both sides**, including both new import sets.

    This resolves textually clean (no leftover markers).

    ### The one decision for the human

    The merge brings in `packages/intentionsutil/test/restamp-scope-fingerprint.test.ts` from origin/main (test `matches the needs-main-residue production scenario: A and B fingerprints differ`, assertion at ~line 195 post-merge). It **fails** on the merged tree: it asserts `expect(fingerprintA).not.toBe(fingerprintB)` where `bodyB` = `bodyA` + a `## needs-main residue` section. That test was written on main under the old whole-body-hash semantics. Under this PR, `tacticScopeFingerprint` hashes `planSubstance(body)`, which truncates at a `## needs-main…` heading — so A and B now hash equal *by design*; that equality is the entire point of the PR.

    **Decide:** is this simply a stale fixture assumption, so the fix is flipping line ~195 to `expect(fingerprintA).toBe(fingerprintB)` and renaming the test (it no longer tests that A and B "differ" — something like "…A and B fingerprints match under plan-substance scoping")? Or is there intent behind the original assertion that this session missed, meaning the rescoping is wrong somewhere? A conflict session may not weaken a test unilaterally, which is why this parked.

    ### Mechanical state

    Worktree `/home/n8/natb1/commons.systems/.claude/worktrees/tactic-scope-fingerprint-plan-substance` is clean at `7fee8e0a`, unmerged — the merge commit was `git reset --hard`'d away, so the 5-file resolution is **not** on disk. Nothing staged, nothing pushed. PR #2974 open and unmodified. Node phase `qa`.

    Verify with `npx vitest run --project packages/intentionsutil --root .` plus a typecheck.
  session_type: other
pace_exempt: false
rounds: null
attributes:
  hold_for: tactic-scope-fingerprint-plan-substance
  hold_kind: provision-conflict
---
# hold: provision-conflict on tactic-scope-fingerprint-plan-substance

## Context

`tactic-scope-fingerprint-plan-substance` hit a mechanical retry state (`provision-conflict`) on 2026-08-09. A mechanical retry state is not "no autonomous path exists, human required", so the source is NOT parked. Instead this born-parked hold tactic (`tactic-hold-conflict-scope-fingerprint-plan-substance`) carries the park, and `tactic-scope-fingerprint-plan-substance` gains a `blocked_by` edge naming it. The source's own `office_hours` is never written.

## Reason

/dispatch-conflict Lane 3: origin/main merge conflict on PR #2974 resolved textually clean across 5 files (transition-node, qa-fix/SKILL.md, qa-fix/references/needs-main-followups.md, qa-main/SKILL.md, router.ts) by an Opus resolver subagent, but the merged tree fails packages/intentionsutil/test/restamp-scope-fingerprint.test.ts's "matches the needs-main-residue production scenario: A and B fingerprints differ" assertion. This is a semantic conflict, not a marker conflict: the test appears to assert pre-rescoping (whole-body-hash) behavior that this PR's plan-substance scoping deliberately changes, but a /dispatch-conflict session may not weaken a test unilaterally per this repo's test-integrity rule, so it escalates for a human call on whether the test's expectation should flip.

## How to resolve

## Hold recommendation — `tactic-scope-fingerprint-plan-substance` (PR #2974)

### The conflict

`origin/main` landed two things this branch overlaps: the sibling carrier `tactic-transition-node-stamp-landed-body` (`0848a10e`, functional rewrite of `refresh_stamp()` in `transition-node`), and the orthogonal `qa-main: sort needs-main residue by machine-checkability` feature (`df0c436a`+), which adds a `Verifiability:` (`MACHINE`/`AUTHOR`/`WAIT`) sub-line to residue items in the same qa-fix/qa-main doc sections this PR rewrites. `git merge origin/main` conflicts in 5 files.

### Resolution shape (all 5 files; re-derive by re-running `git merge origin/main`)

- `.claude/skills/dispatch-propagate/scripts/transition-node` — **take origin/main whole.** This PR's own change here was comment-only (per its body); upstream's `refresh_stamp()` rewrite (delegating to `restamp-scope-fingerprint.ts`, reading committed content from git) supersedes it.
- `.claude/skills/qa-fix/SKILL.md`, `.claude/skills/qa-fix/references/needs-main-followups.md`, `.claude/skills/qa-main/SKILL.md` — **combine both sides.** Keep this PR's machinery-sentinel CLI-append mechanism (`append-machinery-section.ts` instead of hand-editing the node body) *and* origin/main's `Verifiability:` triage content.
- `packages/intentionsutil/src/router.ts` — **combine both sides**, including both new import sets.

This resolves textually clean (no leftover markers).

### The one decision for the human

The merge brings in `packages/intentionsutil/test/restamp-scope-fingerprint.test.ts` from origin/main (test `matches the needs-main-residue production scenario: A and B fingerprints differ`, assertion at ~line 195 post-merge). It **fails** on the merged tree: it asserts `expect(fingerprintA).not.toBe(fingerprintB)` where `bodyB` = `bodyA` + a `## needs-main residue` section. That test was written on main under the old whole-body-hash semantics. Under this PR, `tacticScopeFingerprint` hashes `planSubstance(body)`, which truncates at a `## needs-main…` heading — so A and B now hash equal *by design*; that equality is the entire point of the PR.

**Decide:** is this simply a stale fixture assumption, so the fix is flipping line ~195 to `expect(fingerprintA).toBe(fingerprintB)` and renaming the test (it no longer tests that A and B "differ" — something like "…A and B fingerprints match under plan-substance scoping")? Or is there intent behind the original assertion that this session missed, meaning the rescoping is wrong somewhere? A conflict session may not weaken a test unilaterally, which is why this parked.

### Mechanical state

Worktree `/home/n8/natb1/commons.systems/.claude/worktrees/tactic-scope-fingerprint-plan-substance` is clean at `7fee8e0a`, unmerged — the merge commit was `git reset --hard`'d away, so the 5-file resolution is **not** on disk. Nothing staged, nothing pushed. PR #2974 open and unmodified. Node phase `qa`.

Verify with `npx vitest run --project packages/intentionsutil --root .` plus a typecheck.

The `blocked_by` edge on `tactic-scope-fingerprint-plan-substance` clears only when this node leaves the open set: resolve the hold tactic to `phase: done` (then prune) — clearing `office_hours` alone does not unblock the source.

