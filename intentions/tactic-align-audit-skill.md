---
id: tactic-align-audit-skill
kind: tactic
statement: "/align-audit — recurring whole-graph evaluation of the three
  integrity requirements (consistency, closure, parsimony) across all six kinds:
  digest-first reads, mechanical checks, flagged-node content reads, every
  finding dispositioned, one graph-commit per run"
owner: ai
status: codified
parent: null
rationale: "Retained from the 2026-07-09 /align-strategy graph-integrity round
  (the author's point 3); the pipeline was emulated live in that round —
  findings and dispositions recorded on strategy-graph-integrity — so the plan
  carries a once-executed design, not speculation. Finalized and planned by the
  2026-07-11 /align-tactics round as the round's validates-terminal: its
  verification runs the first real /align-audit end-to-end, producing the
  strategy's first reading. Landing caveat: .claude/skills/** edits are
  agent-behavior config — dispatch auto mode denies the commit; park for
  interactive landing if hit."
reading: null
gap: null
serves:
  - strategy-graph-integrity
recovers: []
clarifications:
  - question: Scope and standing amendments from the 2026-07-23
      tactic-align-audit-legacy-review office-hours sitting.
    answer: "Recorded 2026-07-23, author present. (1) Census line: the audit report
      gains an unserved-virtue census — virtue ids appearing in no strategy's
      serves — as an info-only report line: report-only, never a finding, no
      disposition or park pressure, because deliberately unserved virtues are
      slack, not defects (retained from the retired /align-strategy improvement
      pass; the rest of that pass retires). If PR #2879 is already past
      implement when this lands, apply it as a follow-up unit rather than mid-qa
      scope surgery. (2) Contrarian graft declined: the retired rung-5
      contrarian/consistency passes do NOT fold in — /align-audit stays purely
      mechanical; anti-calcification lives in the office-hours sitting cadence
      (see strategy-explicit-intent). (3) Keep-and-judge: the author questioned
      whether this audit earns its keep, noting it has never run; resolved keep
      on the recorded graph-integrity charter (the transcript-review
      token-efficiency function belongs to /dispatch-token-audit under
      strategy-token-economy, a name-collision surfaced at the sitting) — the
      first real run's report, produced by this tactic's verification, is
      reviewed at an office-hours sitting that decides whether the audit
      continues."
tooling_goals: []
success_signal: null
attention: null
phase: qa
execution:
  branch: tactic-align-audit-skill
  pr: 2879
  attempts: {}
  markers:
    - planned
  strategy_fingerprint: ba2a6baf40da43d7217194977f7ecd4dbba424a343251236340d524b05479917
  fix: null
validates:
  - strategy-graph-integrity
blocked_by:
  - tactic-graph-digest-tooling
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# /align-audit — recurring whole-graph evaluation of the three integrity requirements (consistency, closure, parsimony) across all six kinds: digest-first reads, mechanical checks, flagged-node content reads, every finding dispositioned, one graph-commit per run

One PR (the skill file). The round's validates-terminal for
strategy-graph-integrity: verification runs the first real /align-audit
end-to-end, producing the strategy's first reading. `blocked_by`
tactic-graph-digest-tooling — the skill's step 2 runs `graph-digest.ts`.
Planned 2026-07-11 /align-tactics round.

## Context

strategy-graph-integrity names three standing requirements on all graph
content — internal consistency; closure (every node closed, justified through
virtue roots, or delegated across recorded delegation/mount boundaries);
parsimony — and its signal is a recurring audit whose every finding is
dispositioned. Write-time gates (validateGraph, graph-commit, the record-time
alignment-tests draft) never re-visit settled content; this skill is the
re-visiting mechanism, kept affordable by digest-first reading (the
strategy's token-bounded condition). The pipeline below was emulated
end-to-end on 2026-07-09; its findings are recorded as a clarification on
strategy-graph-integrity — a once-executed design, not speculation.

## Unit 1 — author .claude/skills/align-audit/SKILL.md

**Recommended model:** opus

**Scope:** new file `.claude/skills/align-audit/SKILL.md` — frontmatter
`name: align-audit`, a one-paragraph `description`, `user-invocable: true` —
register and structure matching the sibling align skills
(`.claude/skills/align-strategy/SKILL.md`,
`.claude/skills/align-tactics/SKILL.md`). Trigger: on-demand (`/align-audit`)
or as a scheduled recurrence; autonomous by default, with author routing
where conditions demand it. Never files, edits, or closes anything on GitHub;
never runs `gh`. The skill body encodes this pipeline:

1. **Freshness guard** — fetch and audit at origin/main (emulating
   tactic-align-skills-latest-graph-guard until it lands); claim a session
   worktree by node id (`strategy-graph-integrity` or an audit-round slug).
2. **Digest** — run
   `node --import tsx/esm packages/intentionsutil/scripts/graph-digest.ts`
   (landed by tactic-graph-digest-tooling); read the derived tables; do NOT
   read node bodies yet.
3. **Mechanical checks** — from the tables: VALIDATE result, CLOSURE
   failures, DONE-PRESENT leaks, DUP-SERVES entries, NEAR-DUP shortlist,
   DANGLING-REFS by class, STORED-DEFAULTS counts.
4. **Flagged reads** — open full bodies only for flagged nodes; verify each
   candidate finding against content (the near-dup and dangling-ref tables
   are shortlists, never dispositions — same discipline as /align-strategy's
   step-1 grep rule).
5. **Content-level pass, sampled** — a rotating sample of nodes (full
   mechanical coverage every run; content coverage amortized across runs)
   checked for: clarification entries contradicted by later entries on the
   same or a related node; rationale sentences contradicting a condition;
   doctrine duplicated outside its one home; a node's content no longer
   expressing the virtue its chain terminates in (the justification limb is
   content-level, not just edge resolution).
6. **Disposition** — every finding gets exactly one: fixed inline
   (mechanical, non-doctrinal — e.g. a leaked done-node prune); drafted as a
   tactic; already-tracked (dedupe against queued tactics — cite the owning
   node); ratified exception (author); deferred (author; dated held-on-trust
   clarification + review item per the universal deferral rule). Findings
   touching virtue or strategy substance always route to the author
   (strategy-graph-integrity condition 3) — when the author is present, via
   the interview-type doctrine's conventions (recommendation + boldness in
   the question round, accept-as-deferral option); when absent, parked as a
   report, never auto-applied.
7. **Report + record** — one clarification on strategy-graph-integrity per
   run (counts by requirement, dispositions, repeats vs the prior run — the
   signal's threshold reads from this) and a refreshed `reading` on the
   strategy; findings and fixes land in ONE graph-commit; a run that changes
   nothing still records its clean result.

Ratchet rule (strategy condition 2): any check stable across runs and
expressible in code graduates into validateGraph or the digest tables — the
skill's prose checks are an incubator, never the permanent home.

Skill-level out of scope: rewriting virtue/strategy substance autonomously;
replacing the record-time gates (tactic-align-strategy-alignment-tests) or
the align interviews — the skill audits the record between interviews, it
never conducts one. Pending inclusion decision: the born-parked office-hours
sitting tactic-align-audit-legacy-review will later decide whether components
of the retired rung-5 dialectic and the retired /align-strategy improvement
pass fold into /align-audit — author the skill without them; that sitting
amends.

**Landing caveat:** `.claude/skills/**` is agent-behavior config — dispatch
auto mode denies the commit. If the commit is denied, park this tactic to
`office_hours` for interactive landing (reason naming the denied path);
do not retry the commit autonomously.

## Reuse

- Register, frontmatter, and structure — .claude/skills/align-strategy/SKILL.md,
  .claude/skills/align-tactics/SKILL.md
- Digest CLI and tables — packages/intentionsutil/scripts/graph-digest.ts
  (landed by tactic-graph-digest-tooling)
- Write path for a run's graph writes —
  packages/intentionsutil/scripts/write-node.ts,
  packages/intentionsutil/scripts/dump-node.ts (--base manifest),
  packages/intentionsutil/scripts/graph-commit

## Verification

Prose — the deliverable is a skill file; the real test is a run:

- Read-through against the strategy's four conditions: digest-first
  token-bounding, the ratchet rule, author routing for substance findings,
  and a documented recurrence trigger are all present in the skill body.
- First run (produces the strategy's first reading — the substance of this
  tactic's `validates` edge): from a claimed worktree at origin/main, execute
  /align-audit end-to-end; every finding dispositioned; the run clarification
  plus a refreshed `reading` land on strategy-graph-integrity in one
  graph-commit. The run's writes are state-only `intentions/**` edits landing
  via the graph fast path, independent of this tactic's skill-file PR.
- Cadence wiring (strategy condition 4) is out of this tactic's scope: the
  skill documents its trigger; a cadence lapse is captured by
  strategy-explicit-intent's cadence-lapse mechanism.
