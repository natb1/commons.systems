---
id: tactic-phase-skill-node-targets
kind: tactic
statement: "phase skills accept node targets: target resolution, node-body plan
  source, completion, escalation, and output-filing seams re-keyed for
  graph-native tactics"
owner: ai
status: codified
parent: tactic-graph-native-dispatch
rationale: "Recorded by the clarification-20 /align-tactics re-evaluation
  (2026-07-04): selector unit 4 maps a node's persisted phase to the legacy
  phase skills, but all four skills hard-reject non-numeric worktree names at
  Step 0 and key context, plan source, completion, and escalation to the gh
  issue keyspace — so the router would launch phase workers that exit 1
  immediately. On the signal path: the full graph-native lifecycle (the
  strategy's observable) cannot run without it."
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
validates: []
blocked_by:
  - tactic-graph-router-transitions
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# phase skills accept node targets: target resolution, node-body plan source, completion, escalation, and output-filing seams re-keyed for graph-native tactics

**Recorded 2026-07-04** by the clarification-20 `/align-tactics`
re-evaluation; Unit 3 added the same day by the clarifications-21–22
re-evaluation. On-path (blocks `tactic-legacy-router-removal`, a
validates-terminal). One PR.

## Context

`tactic-graph-router-selector` unit 4 maps a node's persisted `phase` to
the legacy phase skills — implement → `/implement`, fix → `/fix-checks`,
qa → `/qa-fix`, review → `/review-fix` — invoked in a node-id worktree.
But all four skills are hard-coupled to the gh-issue keyspace at four
seams, so a launched phase worker exits 1 before doing anything (and
would file gh artifacts if it got further):

- **Target resolution.** Every skill's Step 0 parses the worktree name as
  `<N>-…` and rejects anything else: `.claude/skills/qa-fix/SKILL.md:151`
  (`case … [0-9]*-*`), `.claude/skills/implement/SKILL.md:38`,
  `.claude/skills/review-fix/SKILL.md:45`,
  `.claude/skills/fix-checks/SKILL.md:26`.
- **Context and plan source.** The idempotency preambles call
  `dispatch-context-pack "$N"` (issue slices); `/implement` reads its plan
  from the issue's `<!-- dispatch:plan -->` comment
  (`.claude/skills/implement/SKILL.md:138`) — a graph-native tactic has no
  issue, and its plan is the node body
  (`tactic-graph-native-dispatch.md` §1.1).
- **Completion and escalation.** Clean passes end in
  `dispatch-complete-phase` label edits (`dispatch:qa-done`,
  `dispatch:reviewed`); escalation writes `office-hours-reason` for the
  Stop hook, which resolves its park target from the `<N>-<slug>` job name
  (`.claude/hooks/dispatch-stop.sh:150`) and applies an issue label — from
  a node-id worktree it parks nothing.
- **Output filings.** `/review-fix` Step 5 files deferred findings as gh
  follow-up issues via `/file-issue` with the `dispatch:review-followup`
  label and orphan-retriage markers; `/qa-fix` Step 3.6 files `needs-main`
  residue as gh main-qa follow-up issues. Both violate strategy
  condition 1 for node targets (no new work enters via gh); their
  graph-native homes are draft tactics (clarification 19/21) and the
  source node's own `main-qa` phase (clarification 22) respectively.

The adaptation changes only these seams. The phase semantics — including
the qa phase's full user-acceptance-QA parity (strategy clarification 20)
and the review phase's full fan-out parity (clarification 21) — carry
over by construction, because the same skills run.

## Unit 1 — node-target resolution, context, and completion seams

**Recommended model:** opus

Scope — the four phase skills' entry/exit seams:
- A shared Step-0 convention across
  `.claude/skills/{implement,fix-checks,qa-fix,review-fix}/SKILL.md`:
  keyspace split on the worktree name — `[0-9]*-*` = legacy issue
  (unchanged); otherwise treat the name as a node id and require
  `intentions/<id>.md` to exist at `origin/main` with `phase` matching the
  skill (else exit 1 with a clear error). `tmp/` filenames key off the
  node id.
- Node-target context: PR number from the node's `execution.pr` (the
  `--pr` slice's `gh pr view` calls take the number directly); plan
  source for `/implement` is the node body; the issue-comment slices are
  skipped. No gh issue is read or written anywhere on the node path.
- Node-target completion: the skills hand the node id to the
  keyspace-aware `dispatch-complete-phase` / `dispatch-finalize-phase`
  (made graph-native by `tactic-graph-router-transitions` unit 1) — the
  skills themselves never write the graph directly; markers
  (`qa-done`, `reviewed`) land in `execution.markers` there.

## Unit 2 — escalation and Stop-hook park parity

**Recommended model:** sonnet

Depends on: Unit 1.

Scope — `.claude/hooks/dispatch-stop.sh` (issue resolution at :150 and the
park branches):
- Recognize node-id job/worktree names (same keyspace split as Unit 1);
  the phase-completed-marker discriminators key off the node id.
- Park path for node targets: set `office_hours`
  `{reason, recommendation, since}` on the node via the `graph-commit`
  primitive, never a gh label. `reason` comes from the existing
  `office-hours-reason` file convention; `recommendation` is the
  escalating session's best-next-steps for the human, written at park
  time — the park write is the recovery artifact (strategy
  clarification 30 / condition 6: session attach/resume is not a
  supported recovery path, so a park whose context lives only in the
  parking session is a defect). Schema: `office_hours.recommendation` is
  an optional string beside `reason`/`since` — add it to
  `packages/intentionsutil` (schema + validator) in this unit if
  `tactic-office-hours-graph-entry` has not already landed it (shared
  schema home; skip if present). The
  office-hours queue view is already the `office_hours != null` projection
  (`tactic-graph-native-dispatch.md` §1.3) — no view work.

## Unit 3 — output-filing seams: review deferrals and qa needs-main residue

**Recommended model:** sonnet

Depends on: Unit 1.

Scope — the two phase-skill steps that file gh artifacts, node-target
lane only (legacy issue lane unchanged):
- `/review-fix` Step 5 (`.claude/skills/review-fix/SKILL.md:440`): for a
  node target, the prepared `result.deferred_filings` and
  `result.security_followup_input` structures are written as **draft
  tactic nodes** (`status: raw`, no phase, `serves` the strategy) batched
  per component, finding provenance (file:line, failure scenario,
  verdict, source PR) in the body — via `write-node.ts` + `graph-commit`
  (strategy clarifications 19/21). Skip the `dispatch:review-followup`
  label and orphan-retriage marker machinery entirely: drafts are inert
  until a later `/align-tactics` round finalizes them, and that round
  validates provenance against what actually merged.
- `/qa-fix` Step 3.6 (`.claude/skills/qa-fix/SKILL.md:640`): for a node
  target, `needs-main` dispositions are **not filed anywhere** — the
  session appends a needs-main residue section to the tactic's own body
  (bodies are authoritative for tactics) and includes it in the
  state-only completion commit; the reconciler then routes the merged
  tactic to its `main-qa` phase (strategy clarification 22;
  `tactic-main-qa-phase` owns the phase value and handler). Only
  machine/browser-verifiable items become residue — verifiability is
  triaged here at record time (the qa triage already classifies every
  item), and a prod observation needing human judgment stays
  `needs-human` → `office_hours`; this is what makes the legacy
  boot-then-reject waste (`tactic-main-qa-triage-before-provision`)
  structurally impossible on the node lane.

## Dependencies

- `tactic-graph-router-transitions` — the keyspace-aware
  complete/finalize scripts Unit 1's completion seam calls.
- `tactic-graph-commit` (done) — the park write primitive.

## Reuse

- `packages/intentionsutil/scripts/graph-commit` — the single write
  primitive for the Unit 2 park.
- `dispatch-context-pack`'s `--pr` slice internals — the PR-slice logic is
  reused with the number sourced from `execution.pr`.
- The four skills' own step bodies — semantics unchanged; only the seams
  listed above are touched.

## Verification

```verify
npm test --prefix packages/intentionsutil
```

Manual: in a node-id worktree at the native default location
(`<project-root>/.claude/worktrees/<node-id>`, strategy clarification 23
— never the legacy `.bare`/`worktrees/` layout) for a synthetic tactic
(with `execution.pr` pointing at a scratch PR), each of the four skills'
Step 0 resolves the node target and reaches its first substantive step;
an induced escalation lands `office_hours` on the node via `graph-commit`
and no gh label is touched; an induced review deferral writes a draft
tactic node with provenance (no gh issue, no `dispatch:review-followup`
label), and an induced qa needs-main disposition appends the residue
section to the node body with no filing.

## Implementation notes

One subagent per unit, `model` per tag; constrain to working-tree edits.
Note: commits touching `SKILL.md` files and `.claude/hooks/**` are denied
to auto-mode dispatch sessions (agent-behavior config); if the commit is
denied, park via `office_hours` for a human grant rather than splitting
the PR.
