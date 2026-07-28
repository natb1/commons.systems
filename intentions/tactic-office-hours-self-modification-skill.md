---
id: tactic-office-hours-self-modification-skill
kind: tactic
statement: "self-modification office-hours skill: a mostly-automated session
  drains agent-behavior-config parks end-to-end, the human's only interaction
  the explicit permission grant; /align-tactics encodes self-modifying tactics
  born-parked with recommendation naming this skill"
owner: ai
status: raw
parent: null
rationale: "Surfaced 2026-07-07 /align-strategy interview (clarification 41 on
  strategy-graph-native-dispatch). Auto-mode workers are denied commits to
  .claude/skills/** and .claude/hooks/** (agent-behavior config), so
  self-modifying tactics currently dead-end. Author decision: (1) /align-tactics
  detects self-modifying scope at decomposition and writes the tactic
  born-parked — office_hours set from birth, recommendation naming this skill —
  never entering the auto-mode lane; (2) anything that slips through is
  attempted by the worker, which stages all non-config work and parks on the
  commit denial; (3) the drain is this documented skill: an office-hours session
  executes the parked recommendation mostly automated, pausing only for the
  human's explicit self-modification permission grant. Empirical driver: the
  tactic-phase-skill-node-targets bootstrap chain is exactly this shape —
  SKILL.md/hooks edits an auto-mode session cannot commit."
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
blocked_by:
  - tactic-align-tactics-tactic-mode-drift-gate
office_hours:
  reason: "Per-node /align-tactics finalize 2026-07-28 parked on one unratified
    design question; the rest of the plan is ready and its groundwork is
    recorded below so a fresh session does not redo it. BLOCKER: the drain
    lane's terminal SESSION disposition on the green-CI path is unrecorded.
    Strategy entry 65 makes the terminal GRAPH disposition mandatory and
    scripted (`clear-park <id> [note]` on green CI, `park-node` on red/blocked
    CI), but clear-park writes no $CLAUDE_JOB_DIR/node-terminal marker while
    park-node does (packages/intentionsutil/scripts/park-node:277 calls
    `mark-node-terminal <id> park`), and .claude/hooks/dispatch-stop.sh now
    passes `--node` so dispatch-self-close HOLDS any node-worker job lacking a
    marker naming its node (commit e93b6cf9, verified live on origin/main).
    office-hours-graph launches the drain as a managed job named after the node,
    so the drain's SUCCESS path would leave the job held and
    worktree_has_live_session TRUE -- freezing the node it just unblocked.
    Condition 15 scopes the accepted freeze-for-debug to the FAILURE path only,
    and mark-node-terminal's enum
    (advance|demote|park|fix-attempt|align-round|no-claim, verified at
    mark-node-terminal:67) has no park-clear member: 'advance' is documented as
    'transition-node landed a forward phase write', which clear-park does not
    do. AUTHOR DECISION NEEDED -- three options with different blast radii: (a)
    clear-park itself calls mark-node-terminal, a shared primitive whose other
    callers (resolve-park, the plain office-hours drain) would inherit the reap;
    (b) the drain skill calls mark-node-terminal itself, needing either
    'advance' against its documented meaning or a new enum member; (c) declare
    the drain a non-managed interactive session (CLAUDE_JOB_DIR unset makes
    dispatch-self-close a no-op), which conflicts with the fallback lane's need
    for the node-id worktree holding the worker's staged branch, since
    office-hours-graph is what provisions that worktree and it launches a
    managed job. RECOMMENDATION: take (b) with a new 'park-clear' disposition
    added to mark-node-terminal, amending condition 15's auto-close enumeration
    to a third trigger -- it leaves the shared primitive's contract intact and
    makes the drain's reap intent explicit. Ratify one option, then re-run
    `/align-tactics tactic-office-hours-self-modification-skill`. GROUNDWORK
    ALREADY VERIFIED THIS ROUND, do not re-derive: no new primitives are needed
    for the rest of the plan. DECOMPOSE_SCHEMA.tactics[].office_hours
    (.claude/workflows/align-tactics.js:239-247) is {reason, since} with
    additionalProperties:false and must gain a 'recommendation' property --
    packages/intentionsutil/src/schema.ts:418-423 already carries it first-class
    and validateOfficeHours (schema.ts:571-580) accepts it, so no node-schema
    and no write-node.ts change is required.
    .claude/skills/align-tactics/references/autonomy.md:41-49 and
    references/write-path.md:153-166 still carry the now-stale 'fold Recommend:
    <next step>. into reason' transitional guidance and must be corrected to
    write the dedicated field. buildDecomposePrompt's copy-classification gate
    (.claude/workflows/align-tactics.js:647-657) is the prompt-doctrine template
    to clone for the self-modifying classifier, and the MODEL/OWNER rule at
    :669-673 is the born-park rule it extends. office-hours SKILL.md's
    graph-native mode Steps 1-4 are the read-and-surface half to reuse verbatim
    (including its untrusted-data fencing), diverging only where its Step 5
    stops at report-where-to-engage. packages/intentionsutil/src/officeHours.ts
    (officeHoursQueue / selectOfficeHours) already selects and ranks these
    nodes, so no new query code is needed. Operationally the drain must: check
    the PR's mergeStateStatus before calling clear-park (a DIRTY/CONFLICTING PR
    loops straight back to a re-park); stage every protected-path edit BEFORE
    requesting the single in-turn grant; make those edits in the main thread,
    never a forked subagent; and phrase the grant request plainly, with no
    meta-commentary about the permission classifier."
  since: 2026-07-28
  recommendation: "Ratify one of the three terminal-session-disposition options
    named in the park reason, then re-run `/align-tactics
    tactic-office-hours-self-modification-skill`. The drift review recommends
    option (b): the drain skill calls `mark-node-terminal` itself with a NEW
    `park-clear` disposition added to that script's enum
    (packages/intentionsutil/scripts/mark-node-terminal:67), which amends
    condition 15's auto-close enumeration to a third trigger. It leaves the
    shared `clear-park` primitive's contract intact (option (a) would make
    resolve-park and the plain office-hours drain inherit the reap) and makes
    the drain's reap intent explicit (option (c) conflicts with the fallback
    lane's need for the office-hours-graph-provisioned node-id worktree holding
    the worker's staged branch). This node is ALSO blocked_by
    tactic-align-tactics-tactic-mode-drift-gate: that fix must land before the
    re-run, or the re-run hits the same tactic-mode drift gate
    (align-tactics.js:955/:1068 lack the mode !== 'tactic' carve-out) that
    forced this round to park instead of planning."
pace_exempt: false
rounds: null
attributes: {}
---
# self-modification office-hours skill: a mostly-automated session drains agent-behavior-config parks end-to-end, the human's only interaction the explicit permission grant; /align-tactics encodes self-modifying tactics born-parked with recommendation naming this skill

## Ratified terminal session disposition (2026-07-28)

The green-CI path's terminal SESSION disposition is settled: **the drain skill
calls `mark-node-terminal` itself**, with a new `park-clear` member added to
that script's enum (`packages/intentionsutil/scripts/mark-node-terminal:67`).
`clear-park` is NOT modified. Strategy condition 15's auto-close enumeration
was amended in the same round to a third clean terminal state; the full
decision and its reasoning are recorded as the 2026-07-28 ratification
clarification on `strategy-graph-native-dispatch`.

The principle that decides it: the `node-terminal` marker asserts *the
session's pass is over*, not that a node was disposed. A scripted primitive may
write it only where one job disposes exactly one node; this drain is **batched**
(`.claude/skills/ref-diagnosis-time-cas/SKILL.md:11-13` — diagnose several
parked nodes, interview the author per disposition, then execute), so only the
session knows it is done. Had `clear-park` written the marker, it would arm the
reap on the drain's own primary node mid-batch, and since `dispatch-self-close`
fires on every turn yield — and an interview yields on every turn — the session
would be reaped out from under the remaining nodes.

## Adjacent latent defect to carry (not yet tracked elsewhere)

`park-node:277` calls `mark-node-terminal <id> park` unconditionally after a
landed park. For a **batched** drain that re-parks its own primary node before
finishing the batch, that arms the reap early — the identical hazard that
disqualified routing the marker through `clear-park`. Pre-existing and out of
scope for the ratification; the planning round should carry it as a unit here
or as a sibling tactic (sole-tracker recording, strategy clarification 28).

## Groundwork verified 2026-07-28 — do not re-derive

No new primitives are needed beyond the `park-clear` enum member above.

- `DECOMPOSE_SCHEMA.tactics[].office_hours`
  (`.claude/workflows/align-tactics.js:239-247`) is `{reason, since}` with
  `additionalProperties: false` and must gain a `recommendation` property.
  `packages/intentionsutil/src/schema.ts:418-423` already carries it
  first-class and `validateOfficeHours` (`schema.ts:571-580`) accepts it — so
  **no** node-schema change and **no** `write-node.ts` change is required.
- `.claude/skills/align-tactics/references/autonomy.md:41-49` and
  `references/write-path.md:153-166` still carry the now-stale "fold
  `Recommend: <next step>.` into `reason`" transitional guidance; both must be
  corrected to write the dedicated field.
- `buildDecomposePrompt`'s copy-classification gate
  (`.claude/workflows/align-tactics.js:647-657`) is the prompt-doctrine
  template to clone for the self-modifying classifier; the MODEL/OWNER rule at
  `:669-673` is the born-park rule it extends.
- `.claude/skills/office-hours/SKILL.md`'s graph-native mode Steps 1-4 are the
  read-and-surface half to reuse verbatim (including its untrusted-data
  fencing), diverging only where its Step 5 stops at report-where-to-engage.
- `packages/intentionsutil/src/officeHours.ts` (`officeHoursQueue` /
  `selectOfficeHours`) already selects and ranks these nodes — no new query
  code.

Operationally the drain must: check the PR's `mergeStateStatus` before calling
`clear-park` (a DIRTY/CONFLICTING PR loops straight back to a re-park); stage
every protected-path edit BEFORE requesting the single in-turn permission
grant; make those edits in the main thread, never a forked subagent; and phrase
the grant request plainly, with no meta-commentary about the permission
classifier.
