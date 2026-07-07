---
id: tactic-copy-approval-planning-rule
kind: tactic
statement: Encode the copy-approval gate into /align-tactics planning — any
  decomposed tactic touching in-scope copy is minted with a born-parked
  author-approval gate and a blocked_by edge
owner: ai
status: codified
parent: null
rationale: "Surfaced in the 2026-07-07 interview that recorded
  strategy-author-approved-copy: standardizing the born-parked gate mechanism
  only guarantees the rule if planning applies it mechanically. Without this,
  each /align-tactics run must remember the rule from the strategy text —
  exactly the per-interview re-derivation the strategy exists to end."
reading: null
gap: null
serves:
  - strategy-author-approved-copy
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: implement
execution: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Encode the copy-approval gate into /align-tactics planning — any decomposed tactic touching in-scope copy is minted with a born-parked author-approval gate and a blocked_by edge

## Context

`strategy-author-approved-copy` standardizes the born-parked approval gate
(`tactic-readme-copy-approval` is the reference instance): any tactic that
produces in-scope copy must be `blocked_by` a human-owned, office_hours-parked
approval tactic, with the draft copy carried in the graph so the author
ratifies or revises it *before* implementation runs. That rule only holds if
planning applies it mechanically. Without this encoding, every `/align-tactics`
run must re-derive the rule from the strategy text — exactly the
per-interview re-derivation the strategy exists to end. This tactic writes the
gate into the `/align-tactics` decomposition procedure so the gate is minted
as a normal part of shaping the subtree.

The design decision this tactic settles: **the gate is applied by planning-time
judgment, not by mechanized scope detection.** The draft raised a validate-graph
advisory (auto-flagging an in-scope-copy tactic with no `blocked_by` gate) as a
candidate. That is deferred/out of scope here: it depends on mechanically
identifying copy-touching work from node text, which the strategy's own
scope clarification and the draft both flag as unreliable
(statement text alone may not identify copy-touching work). Classifying a
decomposed tactic as copy-touching is a judgment the planning agent already
makes with full scope in hand; a checklist step is the right home. If a
mechanized advisory is ever wanted, it is a separate future tactic, not this
one.

Scope note: this tactic edits `.claude/skills/align-tactics/SKILL.md` (agent
behavior config) — **not** in-scope copy — so it is not itself gated by an
approval tactic.

## Unit 1 — add the copy-gate step to `/align-tactics` decomposition

**Recommended model:** opus

**Scope.** Edit `.claude/skills/align-tactics/SKILL.md`, Step 2 ("Decompose to
the signal", the numbered decomposition list beginning at line ~148). Add a new
numbered item (after item 3 "Shape the subtree", before item 5 "Off-path work
gets no flag" — renumbering as needed) titled to the effect of **"Gate
in-scope copy."** The step must instruct the decomposition to, for every
tactic whose scope touches in-scope copy:

1. **Classify** each decomposed tactic as copy-touching or not, by judgment
   against the strategy's scope definition. Name the in-scope set inline so a
   clean session needs no external lookup: landing, about page, app heroes and
   onboarding text, README, and blog posts; explicitly excluded — in-app UI
   strings, practitioner reference docs (SCHEMA.md, package READMEs), and
   GitHub issue/PR prose. State the exemption: mechanical fixes (typos, broken
   links, factual corrections with no reframing and no new claims) are ungated;
   any doubt means gated.
2. **Mint a sibling approval gate tactic** in the born-parked shape
   (cite `tactic-readme-copy-approval` as the reference instance):
   `owner: human`, `status: delegated`, `office_hours: {reason, since}` set at
   creation (this is a Step 4 born-parked tactic — no implement-phase body,
   `phase` omitted), `serves: [<the-serving-strategy>]`. The gate's
   `office_hours.reason` names the specific copy to review and folds in the
   next step (per the born-parked reason convention). Chunk each gate to
   ≤30 author-minutes.
3. **Set `blocked_by: [<gate-id>]`** on the copy-producing tactic, so the
   router cannot select the copy work until the author completes the gate.
4. **Carry the draft copy in the copy tactic's body** (its plan), so the
   author has concrete wording to ratify or revise at office-hours, and the
   implementing session settles remaining wording only within the approved
   copy.

Cross-reference the strategy (`strategy-author-approved-copy`) and the
mechanism's home (this gate pattern) so the step is self-explaining. Keep the
addition consistent with the surrounding Step 2 register and the existing
born-parked treatment in Step 4 ("Park non-claude-eligible tactics") — the gate
tactic *is* a born-parked tactic, so Step 4's shape governs it; the new step
should point at Step 4 rather than restate the born-park mechanics.

Also add a short note to Step 4 (or wherever the born-parked shape is defined)
only if needed to make clear the copy-approval gate is an instance of the
born-parked pattern — avoid duplicating the mechanics.

**Out of scope:** any validate-graph rule or mechanized copy-scope detection
(deferred, see Context); editing `/plan-issue` (the legacy gh planner —
separate lane); changing the strategy node or the gate reference instance.

**Reuse.**
- `.claude/skills/align-tactics/SKILL.md` Step 4 ("Park non-claude-eligible
  tactics") and `intentions/tactic-graph-native-dispatch.md` §1.3 — the
  born-parked shape (office_hours at creation, ≤30 author-minutes, no
  implement body). The new step reuses this, does not reinvent it.
- `intentions/tactic-readme-copy-approval.md` — the canonical born-parked
  copy-approval gate to cite as the reference instance (owner: human,
  status: delegated, office_hours reason naming the copy, the gated copy
  tactic `blocked_by` it).
- `strategy-author-approved-copy` clarifications (scope, approval mechanism,
  timing "before implementation", the mechanical-fix exemption) — the source
  of the in-scope definition and exemption text to inline.

## Verification

Prose (this is a skill-instruction edit — no runtime surface; verify by
reading the amended procedure and dry-running it mentally):

- The added Step 2 item is self-contained: a clean session decomposing a
  strategy that produces landing/README/blog copy would, from the step text
  alone, mint a born-parked gate and set the `blocked_by` edge without needing
  the strategy body.
- The in-scope set, the exclusions, and the mechanical-fix exemption are stated
  inline (not only referenced).
- The gate shape it prescribes matches `tactic-readme-copy-approval`
  (owner: human, status: delegated, office_hours set, serves the strategy) and
  defers to Step 4 for the born-park mechanics rather than duplicating them.
- No validate-graph rule was added and `/plan-issue` was not touched.
