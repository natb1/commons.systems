---
id: tactic-subagent-cwd-worktree-guard
kind: tactic
statement: Guarantee phase-skill subagents write to the launching worktree, not
  the primary checkout — pin the implementation-subagent prompt contract to
  absolute worktree paths and add a post-subagent contamination guard
owner: ai
status: raw
parent: null
rationale: "Surfaced 2026-07-19 during a /implement run of
  tactic-otel-sensor-substrate: the Unit 1 implementation subagent (launched via
  the Agent tool from /implement-unit inside the tactic worktree) inherited a
  cwd of the PRIMARY checkout, so its relative-path Write landed in
  ~/natb1/commons.systems instead of the worktree, leaving the worktree with a
  clean git status (silent work loss) and requiring manual detection and
  relocation. The dispatch execution model has the main thread never edit files
  (it delegates every change to a subagent), so this drift silently loses the
  entire unit. The violated invariant is recorded as a 2026-07-19 clarification
  on strategy-graph-native-dispatch; this tactic carries the fix. Distinct from
  tactic-primary-checkout-main-guard (keeps the primary checkout ON main); this
  keeps subagent WRITES OUT of it."
reading: null
gap: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention:
  boost: 90
  override: null
  rationale: "Author-directed 2026-07-23: boost to top ranking. This node carries
    the seed half of the 2026-07-23 manual-dispatch-tick failure. An abandoned
    earlier draft of tactic-main-health-signal-attribution's unit-1 edit to
    .claude/skills/dispatch-propagate/scripts/repo-health was left uncommitted in
    the primary checkout while the unit itself was redone correctly on the tactic
    branch as d5786bdc; that single out-of-node-set file then blocked every graph
    write in the tick via graph-commit's assert_clean_outside_ids. Sized at 90,
    which composes to 95.33 with the boost 5 inherited from
    strategy-graph-native-dispatch, placing it above the live discretionary
    composed max (90.33, tactic-graph-router-live-worker-read-robust) and below
    the strategy-main-health ceiling (100, author-override-guarded), which it
    does not displace. Paired with tactic-graph-write-failure-rollback, which
    carries the amplifier half of the same incident."
phase: null
execution: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Guarantee phase-skill subagents write to the launching worktree, not the primary checkout

## Context

The graph-native dispatch execution model has the **main thread never edit
files** — every code change in a phase skill is delegated to a subagent
(`.claude/skills/implement/SKILL.md`: "The main thread never edits files";
`.claude/skills/implement-unit/SKILL.md` Step 1 launches the implementation
subagent via the Agent tool). That contract carries an implicit, unenforced
invariant: **a subagent operates on the launching worktree, not the primary
checkout.**

The invariant fails silently. The Agent tool pins a spawned subagent's cwd at
launch to the **primary checkout** (`~/natb1/commons.systems`), not the
launching worktree. A subagent that writes via a **relative** path therefore
lands its edits in the primary checkout, while the launching worktree keeps a
**clean git status** — so the entire unit is lost with no error and no diff to
detect it.

Observed live 2026-07-19 in Unit 1 of `tactic-otel-sensor-substrate`: the
implementation subagent wrote `otel-trial-notes.md` into the primary checkout's
`.claude/skills/dispatch-token-audit/` instead of the worktree, discovered only
because the worktree's `git diff --name-only HEAD` came back empty. Recovery was
manual: `find` the stray file, Read it, Write it into the correct worktree path,
`rm` the stray from the primary checkout.

This is **distinct** from `tactic-primary-checkout-main-guard`, which keeps the
primary checkout **on `main`** (drift mechanism: a failed `git worktree add` +
chained `cd`, moving the primary checkout off main). That guards where the
primary checkout's *HEAD* points; this guards that subagent *writes* never land
in the primary checkout at all.

## Greenfield fix (ideal, independent of migration cost)

Two levers we control — the subagent **prompt contract** (prevention) and a
**post-subagent guard** (backstop):

1. **Prompt contract — absolute worktree paths.** Every implementation-subagent
   prompt (`/implement-unit` Step 1, and any other phase skill that delegates
   file edits) passes the **absolute worktree root** and mandates that all file
   paths the subagent Reads/Writes/Edits be **absolute under that root** — never
   relative. A relative path is what makes the cwd drift consequential; removing
   relative paths removes the failure at the source.

2. **Post-subagent contamination guard.** After the subagent returns,
   `/implement-unit` asserts the subagent's writes landed in the worktree. The
   guard detects **contamination** — stray writes appearing under the primary
   checkout that match what the subagent claimed to touch — and **fails loudly**
   (or relocates them into the worktree), rather than asserting "the worktree
   tree is non-empty." The contamination framing matters: some units legitimately
   produce no worktree changes (a verify-only or no-op unit), so an
   assert-nonempty guard would false-fail them; a contamination check does not.

The guard is written so that **if the harness later pins subagent cwd to the
launching worktree**, it degrades to a cheap no-op (no contamination ever found)
rather than needing removal.

## Alternatives considered

- **"Fix it upstream in the harness, don't work around it."** The rival framing:
  the real defect is the Agent tool pinning subagent cwd to the primary checkout;
  patching our skills is a workaround. **Diverged:** the harness cwd behavior is
  not ours to change, and the silent-loss risk is **live now** — every phase
  skill that delegates edits is exposed on every tick. Worth an upstream report
  in parallel, but that does not gate this fix. (The degrade-to-no-op design
  above means a future upstream fix costs us nothing.)

## Reuse / anchors

- `.claude/skills/implement-unit/SKILL.md` Step 1 — the implementation-subagent
  launch prompt (where the absolute-path contract is added).
- `.claude/skills/implement/SKILL.md` — "the main thread never edits files"
  (the delegation contract this invariant underwrites).
- `tactic-primary-checkout-main-guard` — the sibling primary-checkout invariant
  (keeps it on `main`); reuse its "prevent at source, fail loudly" framing.

## Verification (prose)

Reproduce the drift (a subagent Write via a relative path from a worktree
session) and confirm the guard fails loudly instead of silently losing the file;
confirm a legitimately-no-op unit does **not** false-fail; confirm the
absolute-path contract prompt is present in `/implement-unit` Step 1.
