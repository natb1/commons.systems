---
id: tactic-align-audit-skill
kind: tactic
statement: "/align-audit — recurring whole-graph evaluation of the three
  integrity requirements (consistency, closure, parsimony) across all six kinds:
  digest-first reads, mechanical checks, flagged-node content reads, every
  finding dispositioned, one graph-commit per run"
owner: ai
status: raw
parent: null
rationale: "Retained from the 2026-07-09 /align-strategy graph-integrity round
  (the author's point 3). The pipeline was emulated live in that round —
  findings and dispositions recorded on strategy-graph-integrity — so this draft
  carries a once-executed design, not speculation. Landing caveat:
  .claude/skills/** edits are agent-behavior config — dispatch auto mode denies
  the commit; park for interactive landing if hit."
reading: null
gap: null
serves:
  - strategy-graph-integrity
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: null
execution: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# /align-audit — recurring whole-graph evaluation of the three integrity requirements (consistency, closure, parsimony) across all six kinds: digest-first reads, mechanical checks, flagged-node content reads, every finding dispositioned, one graph-commit per run

Retained draft from the 2026-07-09 /align-strategy graph-integrity round —
input to a future /align-tactics pass; not yet a plan. The pipeline below was
emulated end-to-end in that round; its findings are recorded on
strategy-graph-integrity.

## Context

strategy-graph-integrity names three standing requirements on all graph
content — internal consistency; closure (every node closed, justified through
virtue roots, or delegated across recorded delegation/mount boundaries);
parsimony — and its signal is a recurring audit whose every finding is
dispositioned. Write-time gates never re-visit settled content; this skill is
the re-visiting mechanism, kept affordable by digest-first reading.

## Skill draft (SKILL.md outline)

Trigger: on-demand (`/align-audit`) or as a scheduled recurrence; autonomous
by default, with author routing where conditions demand it.

1. **Freshness guard** — fetch and audit at origin/main (emulating
   tactic-align-skills-latest-graph-guard until it lands); claim the session
   worktree by node id (`strategy-graph-integrity` or an audit-round slug).
2. **Digest** — run `graph-digest.ts` (tactic-graph-digest-tooling); read the
   derived tables; do NOT read node bodies yet.
3. **Mechanical checks** — from the tables: validate result, closure
   failures, done-present leaks, dup-serves entries, near-dup shortlist,
   dangling refs by class, stored-default counts.
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
6. **Disposition** — every finding gets exactly one: fixed inline (mechanical,
   non-doctrinal — e.g. a leaked done-node prune); drafted as a tactic;
   already-tracked (dedupe against queued tactics — cite the owning node);
   ratified exception (author); deferred (author; dated held-on-trust
   clarification + review item per the universal deferral rule). Findings
   touching virtue or strategy substance always route to the author
   (strategy-graph-integrity condition) — when the author is present, via the
   interview-type doctrine's conventions (recommendation + boldness in the
   question round, accept-as-deferral option); when absent, parked as a
   report, never auto-applied.
7. **Report + record** — one clarification on strategy-graph-integrity per
   run (counts by requirement, dispositions, repeats vs prior run — the
   signal's threshold reads from this); findings and fixes land in ONE
   graph-commit; a run that changes nothing still records its clean result.

Ratchet rule: any check stable across runs and expressible in code graduates
into validateGraph or the digest tables (strategy-graph-integrity condition:
the skill's prose checks are an incubator).

Landing caveat: .claude/skills/** edits are agent-behavior config — dispatch
auto mode denies the commit; park for interactive landing if hit.

Out of scope: rewriting virtue/strategy substance autonomously; replacing the
record-time gates (tactic-align-strategy-alignment-tests) or the align
interviews — this skill audits the record between interviews, it never
conducts one.
