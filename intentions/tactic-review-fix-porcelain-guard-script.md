---
id: tactic-review-fix-porcelain-guard-script
kind: tactic
statement: Promote /review-fix's Step-5 porcelain guard from SKILL.md prose into
  a script the lane actually runs, so its node-write fence is code rather than an
  instruction
owner: ai
status: raw
parent: null
rationale: "Ruled 2026-08-15 as violation V4, added by the pre-commit adversarial
  review correcting this round's own census. The 2026-08-14 draft excused
  /review-fix from the autonomous-substance violator list on the ground that it
  is mechanically fenced by a post-hoc porcelain guard reverting any modification
  to a pre-existing node. It is not: a repository-wide search for the guard's
  step5-baseline and step5-new markers finds only
  .claude/skills/review-fix/SKILL.md — no script, no hook, no workflow. The same
  round condemned violation V2 with the words a prompt is not a gate, then
  suspended that standard here, and the suspension was the only thing keeping
  review-fix off the list. The guard is fully specified as shell already, so
  scripting it is mechanical."
reading: null
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
# Promote /review-fix's Step-5 porcelain guard from SKILL.md prose into a script the lane actually runs

## Draft context (2026-08-15 /align correction round, review disposition)

Doctrine home: `strategy-graph-native-dispatch`, the clarification "Which lanes
violate the autonomous-substance invariant today" — this is **V4**.

### The gap

`.claude/skills/review-fix/SKILL.md` specifies a guard that diffs `git status
--porcelain` against a pre-fork baseline and then requires, of every new entry:

- its porcelain status is exactly `??` (untracked addition) — any `M`, `D`, `R`,
  `A`, or modified code fails;
- its path is exactly `intentions/<id>.md` for an `<id>` the subagent returned —
  any other path, under `.claude/` or a source file or an `intentions/` file
  whose id was not returned, fails;
- and conversely every returned id has a matching `??` entry, so a returned id
  with no new file fails too.

That is a complete, correct fence. **It is also entirely prose.** Nothing runs
it. Whether the lane is confined to *creating* nodes rather than *editing*
pre-existing ones is therefore an unverified property of a prompt, and the
census's claim that review-fix is "mechanically fenced" was false.

### Scope

- Extract the guard into a script under
  `.claude/skills/dispatch-propagate/scripts/` taking the baseline file, the
  after file and the returned node-ids file, exiting non-zero with a diagnostic
  naming the offending path and its status.
- Call it from the Step-5 lane in place of the prose checklist; keep the prose as
  documentation of intent, not as the control.
- Add a test suite alongside it, in the shape the sibling lint scripts use.
- **The guard's own semantics are unchanged.** This is a carrier change, not a
  policy change — do not tighten or loosen what it accepts while moving it.

### Why this and not a broader fix

The invariant this discharges is narrow: an autonomous lane must not
EDIT-SUBSTANCE a durable-layer node. The porcelain guard already expresses
exactly that for this lane, and expresses it better than a field-level check
would, because it also catches stray code edits. The only defect is that it is
not executed. Scripting it is the whole fix.

### Not measured

Whether review-fix has ever actually modified a pre-existing node. Git history
was **not** searched. Worth establishing as the first step — it tells the author
whether this is theoretical or historical — but not a blocker on the fix.
