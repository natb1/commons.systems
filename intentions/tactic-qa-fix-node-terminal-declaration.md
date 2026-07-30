---
id: tactic-qa-fix-node-terminal-declaration
kind: tactic
statement: /qa-fix's fix-finalize path declares no node-terminal marker, so
  every successful qa auto-fix freezes its own node — add the missing
  declaration and a mechanical guard that every phase skill's node-lane terminal
  path declares
owner: ai
status: raw
parent: null
rationale: "Surfaced 2026-07-29 /align-strategy interview from a live freeze
  (job c20b2f8d, node tactic-graph-select-target-node-tests, PR #2985). /qa-fix
  Step 3.7's fix-finalize path is a one-job-one-node terminal disposition of
  exactly the fix-attempt class — it lands and pushes fix commits, finalizes the
  qa-summary PR comment, writes a phase-log entry, emits a completed_with_fixes
  outcome envelope, and then deliberately does NOT transition, because a fixing
  pass must leave phase: qa so CI restarts and the chain re-QAs. It declares no
  marker, so dispatch-self-close holds the job and the node freezes;
  dispatch-sweep's node arm cannot free it either (it needs node-completion
  evidence AND no live session). See the 2026-07-29 declared-vs-undeclared
  clarification on strategy-graph-native-dispatch for the governing doctrine and
  the crash-only adopt/diverge."
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
  rationale: "Bootstrap re-scale 2026-07-30: Waves B-D of a three-band interim
    scale (50 / 20 / 10) - dispatch-containment and evidence-custody work that
    follows the Wave-A write-path fixes. Interim scaffolding only;
    tactic-attention-tier-ranking and tactic-attention-boost-scripts retire this
    numeric scheme."
phase: null
execution: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# /qa-fix's fix-finalize path declares no node-terminal marker

Draft context retained from the 2026-07-29 `/align-strategy` round. Not yet
refined into a plan — `/align-tactics` owns that.

## Unit 1 is DONE — this node is now Unit 2 only

Unit 1 (the missing `mark-node-terminal "$N" fix-attempt` on `/qa-fix`'s
fix-finalize path) landed 2026-07-30 in PR #2986, out of band, as part of the
dispatch-pipeline bootstrap. Both the reference (`auto-fix-lane.md`) and the
condensed `SKILL.md` mirror were edited, with the timing invariant stated in the
inserted prose. **This node's remaining scope is Unit 2 — the mechanical
coverage guard — and nothing else.** Unit 1's text below is retained as the
record of what was fixed and why; do not re-implement it.

The bootstrap also ran the audit Unit 2's fallback contemplates, and it found a
**second** undeclaring lane that the coverage table below gets wrong. See "Audit
finding" under Unit 2.

## The defect, confirmed live

Observed on job `c20b2f8d`, node `tactic-graph-select-target-node-tests`,
PR #2985.

`/qa-fix`'s node-lane seam (`.claude/skills/qa-fix/SKILL.md`, "Node-target lane
(`TARGET_KIND=node`)") covers exactly two terminal paths:

- **Completion (clean pass)** → `transition-node`, which declares internally
  (`transition-node:60`, `mark_terminal`).
- **Escalation** → writes `$CLAUDE_JOB_DIR/office-hours-reason`; the Stop hook's
  backstop calls `park-node`, which declares.

There is a **third** terminal path with no node-lane seam at all: Step 3.7's
**fix-finalize** path (`.claude/skills/qa-fix/references/auto-fix-lane.md`),
taken whenever the disposition Workflow returns at least one `opus-fixable`
item that lands. It calls only `dispatch-mark-complete --phase qa`, which writes
the legacy `phase-completed` marker and never touches `node-terminal`. That path
HARD-STOPS the skill.

It deliberately does not transition — a fixing pass must leave `phase: qa` so
the pushed fix commits restart CI and the chain re-QAs. That is correct. What is
missing is the declaration that the *session's pass* is over, which is a
separate assertion from *the node advanced*.

Consequence: `dispatch-self-close --node <id>` finds no marker and HOLDs. The
job stays alive, `worktree_has_live_session` stays TRUE, and the router will not
re-select the node — so the re-QA the fix path's own design depends on can never
happen. `dispatch-sweep`'s node arm does not recover it either: that arm requires
`node_completion_state` evidence **and** no live session, and neither holds.

This fires on **every** successful qa auto-fix, not intermittently.

## Unit 1 — the missing declaration

Add the node-lane declaration to `/qa-fix`'s fix-finalize path, mirroring the
worked precedent at `.claude/skills/fix-checks/SKILL.md:820`:

```bash
packages/intentionsutil/scripts/mark-node-terminal "$N" fix-attempt
```

`fix-attempt` is the correct existing member — `mark-node-terminal`'s own header
defines it as "retried by design", which is precisely this path's shape. No enum
change is needed. As with every declaration, it must be the **last** durable
action of the pass (see the timing invariant in condition 14): `Stop` fires on
every turn yield, so declaring before the PR comment / phase-log / envelope
writes complete would reap the session out from under them.

`/fix-checks` is the model: same one-job-one-node shape, same non-advancing
terminal, already declares.

## Unit 2 — mechanical guard

A check that every phase skill's node-lane terminal path declares, so the prose
residual stops being unbounded. The record's accepted residual
(`dispatch-self-close:75-78`) priced a dropped declaration as a rare, recoverable
slip; this defect shows the price is a guaranteed deadlock when the dropping lane
is a routine success path.

**Feasibility is unverified** — whether skill-prose coverage is mechanically
checkable at reasonable cost was flagged as a bold recommendation in the
interview and endorsed anyway. Recorded fallback: if a real mechanical check is
not tractable, Unit 2 **shrinks to a documented audit** of the node-lane terminal
paths; it does not grow into a larger refactor.

Current coverage, as surveyed 2026-07-29 (`.claude/skills/*/SKILL.md`):

| skill | node-lane terminal paths | declares? |
|---|---|---|
| `/qa-fix` | clean-pass, escalation, **fix-finalize** | first two only — **the gap** |
| `/fix-checks` | fix-attempt | yes, explicit `mark-node-terminal` |
| `/align-tactics` | align-round, no-claim | yes, explicit |
| `/dispatch-conflict` | Lane 3 conflict-resolved/-hold | yes, explicit |
| `/review-fix` | clean-pass, deviation-park | yes, via `transition-node` / `park-node` |
| `/implement`, `/qa-main` | clean-pass, escalation | yes, via `transition-node` / `park-node` |

### Audit finding 2026-07-30 — the table above is incomplete

The bootstrap ran the full node-lane terminal audit. The `/dispatch-conflict`
row is **wrong**: it surveyed Lane 3 only. **Lane 2's `resolved` path
(`.claude/skills/dispatch-conflict/SKILL.md:530-606`) does not declare** — after
`write-node.ts` + `graph-commit` it calls only `dispatch-mark-complete --phase
fix-conflicts`, which writes the legacy `phase-completed` marker that
`dispatch-self-close --node` never reads. Lane 2's sibling `ambiguous` path
(`:608-664`) does not declare either. The SKILL.md text itself explains why no
other primitive covers it (`:596-605`).

So the claim below — that `/qa-fix` is the *only* phase skill with a
non-declaring terminal — was false, and `dispatch-self-close:79`'s "two of the
terminal lanes declare via SKILL.md prose" residual counts **this** as the
second lane.

Why it was not fixed alongside Unit 1: Lane 2 is phase-agnostic (a
`graph-commit` mechanical-conflict park can occur at any phase) and is **not
reachable by the autonomous fleet** — SKILL.md states twice that no dispatch
tick enters Lane 2 (`:80-81`, `:454-455`), and only Lane 3 is auto-spawned, by
`dispatch-graph-execute:226-276`. It strands nothing today. It deadlocks the
moment a human or a future router runs Lane 2 as a managed `--node` background
job, since `dispatch-stop.sh:56-63` gates purely on the job name matching an
`intentions/<id>.md` id, regardless of which skill ran inside it.

**Accepted risk, recorded rather than fixed.** Unit 2's guard should catch this
lane; if Unit 2 shrinks to a documented audit per its fallback, this finding IS
that audit's first result and the Lane 2 fix should be filed as its own tactic.
Note also that `dispatch-self-close:60-67`'s own caller enumeration omits
`/qa-fix`'s `fix-attempt` caller — independent staleness in the same comment
block.

## Out of scope

- **`park-node:277`'s early-arming hazard** — its unconditional internal
  `mark-node-terminal` call violates the same timing invariant for a batched
  drain that re-parks its own primary node mid-batch. Pre-existing, recorded
  2026-07-28, tracked in `tactic-office-hours-self-modification-skill`'s body.
  Deliberately not pulled into this tactic.
- **Replacing the marker with reconciler-derived reapability** — the crash-only
  steelman. Diverged from in the 2026-07-29 interview; see the
  declared-vs-undeclared clarification for the reasoning.

## Coordination

`tactic-outcome-envelope-node-lane-parity` (serving `strategy-token-economy`,
`phase: implement`) edits the **adjacent lines** of the same `/qa-fix` node-lane
terminal section — it fixes the numeric `--issue` argument on
`dispatch-emit-outcome` / `dispatch-write-phase-log`. The two defects are
disjoint in substance and must not be planned as one unit, but if both are in
flight simultaneously they will conflict textually in this file region.
