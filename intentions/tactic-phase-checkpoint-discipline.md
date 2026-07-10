---
id: tactic-phase-checkpoint-discipline
kind: tactic
statement: Encode the mid-phase durable-checkpoint and resume-from-worktree
  discipline into the phase skills and the tick worker prompt
owner: ai
status: codified
parent: null
rationale: "Finalized 2026-07-06 from the worker-recovery re-evaluation draft
  (checkpoint-discipline clarification, condition 9): session recovery is
  rejected as router substrate, so a dead worker's redo cost is bounded by
  flushing findings to durable state at natural boundaries and by re-selected
  workers consuming pre-existing worktree/PR state as resume input. The
  finalization audit found the flush half mostly present (per-unit commits
  canonical in /implement-unit; qa-fix/review-fix idempotency at attempt
  granularity) but PR-comment composition terminal-only in
  qa-fix/review-fix/fix-checks, and no resume language in the
  dispatch-graph-tick.js worker prompt — which exists only on the in-flight
  selector PR branch, hence the blocked_by edge. Off the minimum signal path:
  derived attention demotes it (clarifications 9/11)."
reading: null
gap: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: done
execution:
  branch: tactic-phase-checkpoint-discipline
  pr: 2797
  attempts: {}
  markers:
    - qa-done
    - reviewed
  strategy_fingerprint: 7964be73bb6a26bb77ec516c22d07677de94ee20965f93b02442867fff492731
validates: []
blocked_by:
  - tactic-graph-router-selector
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Encode the mid-phase durable-checkpoint and resume-from-worktree discipline into the phase skills and the tick worker prompt

## Context

The 2026-07-06 worker-recovery re-evaluation on
`strategy-graph-native-dispatch` (checkpoint-discipline clarification,
condition 9) rejected session recovery — workflow resume and transcript
reconstruction — as router substrate. A dead worker (API error, session
limit, system failure) loses only reasoning-in-progress: the node body
plan, the node-id worktree with its commits and uncommitted edits, and the
PR with its phase comments all survive, and the re-selected worker roots
in the same worktree. Two rules bound the redo cost on the durability side:

1. **Flush at natural boundaries.** Phase progress whose only home is the
   session is a defect. Durable state means what already exists — worktree
   commits, PR comments, node body sections. No new machinery: no
   checkpoint files, no transcript readers, no session registry.
2. **Resume from durable state.** A worker starting a phase in a worktree
   that already has commits/edits beyond the branch base, or a PR that
   already carries phase comments, treats them as resume input: diff
   against the branch base, read the prior comments, and continue — never
   redo completed units or re-litigate recorded verdicts, and never treat
   the dirty state as an error.

Finalization audit (2026-07-06): the flush half is mostly present —
per-unit commits are canonical in `/implement-unit`
(`.claude/skills/implement-unit/SKILL.md:81`, the commit-merge-push
recipe), stated in implement (`.claude/skills/implement/SKILL.md:168`,
`:178`, `:254`) and qa-fix (`.claude/skills/qa-fix/SKILL.md:1387-1389`).
The gaps: PR-comment composition is terminal-only in review-fix (one
batched comment at Step 6, `.claude/skills/review-fix/SKILL.md:617`),
qa-fix (residue comment refreshed at phase end, `:837`), and fix-checks
(accumulator posted only at Step 8,
`.claude/skills/fix-checks/SKILL.md:341`); and the tick worker prompt
(`nodePrompt` in `.claude/workflows/dispatch-graph-tick.js` — the file
exists only on the in-flight `tactic-graph-router-selector` PR branch,
hence this tactic's `blocked_by`) carries no resume or flush language.

The draft's candidate mechanical floor is confirmed: `nodePrompt` states
both rules once, so bootstrap emulation sessions inherit them without
per-skill edits; per-skill text carries only phase-specific checkpoint
points (Units 1–3).

Landing caveat: `.claude/skills/**` edits are agent-behavior config —
dispatch auto mode denies the commit (not the edit); if the worker hits
that denial, park for an interactive session to land the PR.

## Unit 1 — review-fix: dispositions flushed as they resolve

**Recommended model:** sonnet

Scope (`.claude/skills/review-fix/SKILL.md`):
- Step 6 (`:617`, "Post exactly one PR comment"): keep the one-comment
  contract, but make composition incremental — create the comment at the
  first resolved finder/verify disposition and edit it in place as each
  subsequent disposition resolves, so a dead session leaves the
  resolved-so-far dispositions on the PR; the phase-end pass only
  finalizes. Confirm-don't-duplicate: `:93-98` already short-circuits an
  interrupted run on `dispatch:reviewed`; Step 7 (`:661`) already flushes
  stranded local commits.
- `## Steps` preamble (`:106`): a resume paragraph — a run finding an
  existing review comment with recorded dispositions, or fix commits
  beyond the branch base, treats them as resume input: never re-litigate
  recorded verdicts, never redo committed fixes.
- Out of scope: the single `/commit-merge-push` fix landing (`:348`,
  `:390`) stays — the worktree survives a dead session, so uncommitted
  fix edits are not lost, and the commit boundary is unchanged.

## Unit 2 — qa-fix: triage and verdicts flushed as produced

**Recommended model:** sonnet

Scope (`.claude/skills/qa-fix/SKILL.md`):
- Steps (`:131` region): write the QA triage/plan to the qa-residue PR
  comment when triage completes (before fixing begins), and update
  per-item verdicts as each item resolves — not only in the phase-end
  refresh (`:837`).
- `## Notes` (`:1380`): extend the idempotency narrative with the resume
  contract — items the prior residue comment marks resolved are never
  re-derived (`:263` implies this; state it as a contract), and per-unit
  fix commits are already durable (`:1387-1389` — reference, don't
  restate).

## Unit 3 — fix-checks and implement: resume preambles

**Recommended model:** sonnet

Scope:
- `.claude/skills/fix-checks/SKILL.md` — `## Steps` (`:20`): a resume
  preamble stating the accumulator tmp file (`:362-390`, persists for the
  worktree's life) and the attempt counter (`:281`) are resume input;
  the "main already fixed it" merge-commit reuse (`:127-136`) already
  exists — reference it. The terminal accumulator post (`:341`) stays: a
  single-pass phase whose mid-phase durable home is the worktree-local
  accumulator file — state that explicitly.
- `.claude/skills/implement/SKILL.md` — `### 2. Build each unit`
  (`:154`): one sentence — commits beyond the branch base are completed
  units; a resumed build continues from the first uncommitted unit, never
  re-implementing committed ones. Confirm-don't-duplicate: the re-entry
  branch (`:66-81`), the durable task-list block (`:156-166`), and the
  per-unit commit convention (`:168`, `:178`) are already stated.
- `qa-main` is explicitly out of scope: a read-only verify-and-close
  phase whose idempotency guard (`.claude/skills/qa-main/SKILL.md:63`)
  already covers re-entry; its residue routes to the filed follow-up, not
  PR comments.

## Unit 4 — tick worker prompt states both rules

**Recommended model:** sonnet

**Dependencies:** Units 1–3 (the per-skill conventions the prompt defers
to); `tactic-graph-router-selector` merged (the file exists on `main`) —
the tactic-level `blocked_by`.

Scope (`.claude/workflows/dispatch-graph-tick.js`, `nodePrompt` — spans
`:83-113` on the selector PR branch; take fresh anchors from `main` after
the merge):
- In the worker instructions, before the `INVOKE <skill>` step (`:103` on
  the branch): two sentences — (1) flush findings to durable state at
  natural boundaries (worktree commits, PR comments as produced, node
  body residue sections); phase progress whose only home is the session
  is a defect (condition 9). (2) A worktree with commits/edits beyond the
  branch base or a PR with prior phase comments is resume input: diff
  against the base, read the prior comments, continue — never redo
  completed work, never treat dirty state as an error.
- `nodePrompt` is self-contained (no shared prompt lib) — the text goes
  inline, once; the per-skill edits (Units 1–3) carry only the
  phase-specific checkpoint points.

## Dependencies

- `tactic-graph-router-selector` merged — supplies
  `.claude/workflows/dispatch-graph-tick.js` (Unit 4's target); encoded
  as this tactic's `blocked_by`.
- `tactic-phase-skill-node-targets` (gated behind
  `tactic-graph-router-transitions`) edits the same phase-skill files.
  No semantic overlap — whichever lands second rebases mechanically.

## Reuse

- `/implement-unit` Step 2 (`.claude/skills/implement-unit/SKILL.md:81`)
  — the canonical per-unit commit-merge-push recipe; reference it, never
  restate it.
- review-fix Step 7 (`.claude/skills/review-fix/SKILL.md:661`) — the
  stranded-commit flush backstop.
- qa-fix `## Notes` (`.claude/skills/qa-fix/SKILL.md:1380-1393`) — the
  existing idempotency narrative to extend.
- The marker-comment update pattern the phase skills already use for
  single-comment refreshes (first-line marker anchor, edit in place).

## Verification

```verify
grep -qi 'resume input' .claude/skills/review-fix/SKILL.md && grep -qi 'as produced\|as each item resolves\|as they resolve' .claude/skills/qa-fix/SKILL.md && grep -qi 'resume' .claude/skills/fix-checks/SKILL.md && grep -qi 'resume input\|never redo' .claude/workflows/dispatch-graph-tick.js && echo OK
```

- Manual: interrupt a review-fix run after two dispositions resolve;
  confirm the PR comment already carries them; re-run the phase and
  confirm it continues without re-litigating either. Prose check: a
  clean-session read finds both rules in `nodePrompt` and only
  phase-specific checkpoint points in each skill.
