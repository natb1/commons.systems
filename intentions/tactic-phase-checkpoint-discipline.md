---
id: tactic-phase-checkpoint-discipline
kind: tactic
statement: Encode the mid-phase durable-checkpoint and resume-from-worktree
  discipline into the phase skills and the tick worker prompt
owner: ai
status: raw
parent: null
rationale: "Retained from the 2026-07-06 /align-strategy worker-recovery
  re-evaluation (checkpoint-discipline clarification, condition 9): session
  recovery is rejected as router substrate, so the redo cost of a dead worker is
  bounded instead by flushing findings to durable state at natural boundaries
  and by re-selected workers consuming pre-existing worktree/PR state as resume
  input. The doctrine is recorded on the strategy; this draft holds the
  skill-side encoding."
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
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Encode the mid-phase durable-checkpoint and resume-from-worktree discipline into the phase skills and the tick worker prompt

Draft context from the 2026-07-06 worker-recovery re-evaluation
(`strategy-graph-native-dispatch`, checkpoint-discipline clarification and
condition 9). Not yet decomposed or planned — `/align-tactics` finalizes.

## Why

A dead worker (API error, session limit, system failure) loses only
reasoning-in-progress: the node body plan, the node-id worktree, and the
PR survive, and the re-selected worker roots in the same worktree.
Session recovery (workflow resume, transcript reconstruction) is rejected
as router substrate — see the clarification for the full argument — so
the redo cost must be bounded on the durability side instead.

## What to encode

Two rules, applied to each phase skill (`implement`, `qa-fix`,
`review-fix`, `fix-checks`, `qa-main`) and to the tick worker prompt
(`.claude/workflows/dispatch-graph-tick.js` `nodePrompt`):

1. **Flush at natural boundaries.** Phase progress whose only home is the
   session is a defect. Implement commits per unit as it goes (already
   convention via /implement-unit — confirm, don't duplicate). QA writes
   its triage/plan and per-item verdicts to the PR comment as produced,
   not only in the phase-end summary. Review writes finder/verify
   dispositions to the PR review comment as they resolve. Residue goes to
   node body sections when the phase's contract says so (needs-main
   residue, park context).
2. **Resume from durable state.** A worker starting a phase in a worktree
   that already has commits/edits beyond the branch base, or a PR that
   already carries phase comments, treats them as resume input: diff
   against the branch base, read the prior comments, and continue —
   never redo completed units or re-litigate recorded verdicts, and never
   treat the dirty state as an error.

Candidate mechanical floor (evaluate at finalization, don't assume): the
worker prompt in `nodePrompt` states both rules once, so bootstrap
emulation sessions inherit them without per-skill edits; per-skill text
carries only phase-specific checkpoint points.

## Bounds

- No new machinery: no checkpoint files, no transcript readers, no
  session registry. Durable state means what already exists — worktree
  commits, PR comments, node body sections.
- Off the minimum signal path (no validates edge expected) — calculated
  attention demotes it by derivation, per clarifications 9/11.
