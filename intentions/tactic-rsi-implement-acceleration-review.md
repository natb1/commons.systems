---
id: tactic-rsi-implement-acceleration-review
kind: tactic
statement: Give the rsi skill a mechanism for the acceleration review every
  rsi-implement task now owes — a closing step in the execute loop and a fifth
  required report item
owner: ai
status: raw
parent: null
rationale: The 2026-08-11 rsi iteration landed a new condition on
  strategy-recursive-self-improvement requiring every rsi-implement task to end
  with a recorded acceleration review whose findings land in the graph in the
  same session. Conditions bind on landing, but .claude/skills/rsi/SKILL.md is
  the condition's mechanism (the skill says so at its own lines 10-12), and a
  fresh /rsi session reads the skill — the graph node is read for judgment, not
  as a checklist. Step 4b's loop currently ends at 'Stop when rsi-advance
  reports idle or rsi-await reports pruned' with no closing step, and Step 5
  lists four report items with no review among them, so the condition today has
  no carrier and would be satisfied only by accident. Skill text is code and
  reaches main through the normal PR flow, which is why this is a tactic rather
  than part of the same graph write that landed the condition.
reading: null
serves:
  - strategy-recursive-self-improvement
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
# Give the rsi skill a mechanism for the acceleration review every rsi-implement task now owes — a closing step in the execute loop and a fifth required report item

## Context

The 2026-08-11 rsi iteration added condition 14 to
`intentions/strategy-recursive-self-improvement.md` (`attributes.conditions`,
the last entry). It requires every rsi-implement task to end with a recorded
acceleration review — performed after the implementation reaches its terminus,
never interleaved with it — whose findings land in the graph in the same
session, and it names an unrecorded finding a defect.

The condition binds from the moment it lands. Its **mechanism** does not exist
yet. `.claude/skills/rsi/SKILL.md` says of the strategy node that "this file is
their mechanism" (`:10-12`), and a fresh `/rsi` session executes the skill: the
strategy node is read for judgment in Step 2, not walked as a checklist. So a
condition with no corresponding skill step is satisfied only by accident.

Concretely, the two gaps:

- **Step 4b's loop** (`.claude/skills/rsi/SKILL.md:129-148`) ends at item 4,
  "Stop when `rsi-advance` reports `idle` or `rsi-await` reports `pruned`."
  Nothing follows, so the loop's terminus is also the task's terminus.
- **Step 5's report** (`:192-201`) lists exactly four required items. None is
  the review, and a session that reports those four has, by the skill's own
  account, finished.

Write the review into the skill as a step that runs at the loop's exit, not as
advice. The condition's own wording is the specification; do not restate the
condition's rationale in the skill — cite it, the way the skill's other steps
cite their conditions by number.

## Unit 1 — Add the closing review step to Step 4b and the report item to Step 5

**Recommended model: opus.** This is doctrine text in the skill that governs
every future rsi iteration, and it has to land without contradicting the
surrounding rules — particularly the three non-negotiables at `:161-172` and the
"not a second orchestration surface" framing at `:14-19`. Judgment about
wording and placement is the whole task; there is no mechanical part.

### Scope

File: `.claude/skills/rsi/SKILL.md`. Three edits.

1. **Step 4b's loop, after item 4** (`:142-144`). Add an item — before the
   existing item 5's throw handling, so the numbered list still reads as the
   loop's own control flow — stating that on leaving the loop the session
   performs the acceleration review required by strategy condition 14, and that
   its findings land in the graph in this session as tactics or dated
   clarifications. Say explicitly that the review runs **after** the loop exits,
   not between phases: the condition requires it to evaluate observed results,
   and a mid-flight review evaluates predictions. Name the evidence it draws on,
   since a later session has no memory of the run — phase wall-clock against
   `rsi-await`'s 540s window, launches that produced no code change, operator
   interventions that had to be repeated, and CI/fix-lane spend.

   Keep it consistent with the existing rules: the review **records**, it does
   not execute. Drafting a tactic is cost 0 under Step 4a; the review must never
   turn into unbudgeted implementation work, and it must not become a place
   where new orchestration rules are invented (the `:14-19` prohibition).

2. **Step 5's report list** (`:194-199`). Add a fifth item: the acceleration
   review's findings and the nodes they landed as. Four items become five.

3. **The stale count at `:11-12`.** The header reads "the nine conditions and
   twelve clarifications there are authoritative". The node now carries **14**
   conditions and **16** clarifications. Either correct the numbers or, better,
   drop the counts entirely and refer to the conditions and clarifications
   without enumerating them — a hardcoded count is a standing staleness bug that
   every future `/align` round re-breaks. Prefer the latter and say why in the
   commit message.

**Out of scope:** any change to `rsi-advance` / `rsi-await`
(`.claude/skills/rsi/scripts/`). The review is a session act, and the skill is
explicit that eligibility and control rules must not migrate into those scripts
(`:150-159`) — adding review logic there would be exactly the
second-orchestration-surface divergence the record forbids. Also out of scope:
the strategy node itself; condition 14 is already landed and is the
specification, not a thing this unit edits.

### Reuse

- The condition text itself, at the end of `attributes.conditions` in
  `intentions/strategy-recursive-self-improvement.md` — read it at `origin/main`
  and cite it as "strategy condition 14", matching how Step 4b already cites
  condition 6 for the budget and the pause section cites condition 4.
- The existing numbered-loop style of Step 4b `:130-148` and the report style of
  Step 5 `:194-199`. Match them; do not introduce a new heading level or a
  parallel checklist format.

## Verification

There is no test suite over skill prose, so verification is reading and
mechanical checks.

```verify
npx tsx packages/intentionsutil/scripts/validate-graph.ts intentions
```

That confirms this node and the strategy node still validate; it does **not**
check the skill edit, and must not be reported as if it did.

Mechanical checks on the skill file, each a grep the reviewer can run:

- `.claude/skills/rsi/SKILL.md` contains a Step 4b loop item naming the
  acceleration review and placing it after the loop's exit.
- Step 5's required-report list has five items, the fifth being the review's
  findings and the nodes they landed as.
- No occurrence of "nine conditions" or "twelve clarifications" remains.

Manual (judgment — this is the real verification): read Step 4b and Step 5 end
to end as a fresh session would, and confirm the new step reads as part of the
loop's control flow rather than an appended note, and that it does not conflict
with the three non-negotiable rules at `:161-172`. Then confirm the round trip
actually closes: a reader who follows only the skill, with no memory of this
node, performs the review the condition requires and knows to land its findings
in the graph.
