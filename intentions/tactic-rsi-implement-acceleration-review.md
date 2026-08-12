---
id: tactic-rsi-implement-acceleration-review
kind: tactic
statement: Give /dispatch-emulate a closing implementation-evaluation step — the
  acceleration review every rsi-implement task owes, inherited by /rsi through
  its Step 4b delegation — plus a report item, and an await window sized to the
  phase
owner: ai
status: raw
parent: null
rationale: "The 2026-08-11 rsi iteration landed a new condition on
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
  than part of the same graph write that landed the condition. (Amended
  2026-08-12 /align round: the present-tense claims above are now history. The
  emulation loop was extracted from /rsi into .claude/skills/dispatch-emulate/
  at 55d07b51 (PR #3069), so Step 4b no longer holds the loop and the scripts
  named above are now dispatch-emulate-advance and dispatch-emulate-await. The
  condition still has no carrier, which is why this node stays open; the carrier
  now belongs in /dispatch-emulate as its final step, inherited by /rsi through
  the Step 4b delegation, per the author ruling recorded the same day. See the
  RE-TARGET section in this node body.)"
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
blocked_by:
  - tactic-dispatch-ladder-skill
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Give /dispatch-emulate a closing implementation-evaluation step — the acceleration review every rsi-implement task owes, inherited by /rsi through its Step 4b delegation — plus a report item, and an await window sized to the phase

## SUPERSEDED 2026-08-12 — folded into tactic-dispatch-ladder-skill

**Do not implement this node.** Later the same day — after the RE-TARGET below
was written — a second /align interview replaced `/dispatch-emulate` outright
with `/dispatch-ladder`, a detached shell driver whose sequencing lives in code
rather than skill prose. Every line anchor in the RE-TARGET's scope now points
at a skill that the replacement **deletes**, which is the second time this node
has been invalidated by a move of its target; the author ruled that it be folded
rather than re-targeted a third time, the record having already named repeated
re-targeting of one node as a defect pattern.

All three scope items are carried forward into `tactic-dispatch-ladder-skill` —
the closing acceleration review as its item 6, the report item with it, and the
await-window sizing as its item 7 — together with the measured-durations table
below, which is copied there verbatim as irreplaceable evidence. This node is
`blocked_by` that one so it is not worked in the interim.

`strategy-recursive-self-improvement` condition 14 is **unchanged and still
binding**; only its carrier moved, and the replacement node carries a `serves`
edge to that strategy precisely so the requirement keeps its distributor.

One substantive re-ruling to be aware of when reading the sections below: the
review's **trigger** changes. Condition 14's after-terminus ordering is
untouched, but a detached run reaches terminus with no session attached, so the
review is performed by the invoking session after it polls the run to terminus —
not as the driver's own final step, which a shell script cannot do.

## Context

The 2026-08-11 rsi iteration added condition 14 to
`intentions/strategy-recursive-self-improvement.md` (`attributes.conditions`).
It requires every rsi-implement task to end with a recorded acceleration review
— performed after the implementation reaches its terminus, never interleaved
with it — whose findings land in the graph in the same session, and it names an
unrecorded finding a defect.

The condition binds from the moment it lands. Its **mechanism** does not exist
yet: a fresh session executes the skill text, and the strategy node is read for
judgment, not walked as a checklist. So a condition with no corresponding skill
step is satisfied only by accident.

## RE-TARGET 2026-08-12 — the unit plans that were here are superseded

This node was planned against `/rsi`'s Step 4b, which no longer contains the
loop. The emulation loop was extracted to its own skill,
`.claude/skills/dispatch-emulate/` (landed 55d07b51, PR #3069); `/rsi` Step 4b
is now a short delegation to it, and the scripts were renamed
`dispatch-emulate-advance` / `dispatch-emulate-await`. **Every line anchor in
the unit plans that followed here pointed at deleted text**, so they were
removed rather than annotated — dead prose left standing because a plan points
at it is the defect this graph already named on the render tactics.

The author ruled 2026-08-12 on where the mechanism now belongs: **the
implementation evaluation is the final step of `/dispatch-emulate`**, and `/rsi`
inherits it through the Step 4b delegation rather than carrying a separate
closing step. That keeps the loop and its closing evaluation in one place, and
it is why condition 14 was amended the same day to move the carrier without
changing the requirement.

**Recommended model:** opus. This is doctrine text in a skill that governs
every future emulated run, and it has to land without contradicting the
surrounding rules — the three non-negotiables and the "not a second
orchestration surface" framing. Judgment about wording and placement is the
whole task; there is no mechanical part.

What a fresh `/align-tactics` pass must produce, stated as scope rather than as
a plan:

1. **A closing step in `/dispatch-emulate`'s loop**, running at the loop's exit
   — after `advance` reports `idle` or `await` reports `pruned` — never between
   phases, because the condition requires it to evaluate observed results and a
   mid-flight review evaluates predictions. It names the evidence a later
   session cannot rediscover: phase wall-clock against the await window,
   launches that produced no code change, repeated operator interventions, and
   CI/fix-lane spend. The review **records**; it never executes, and it is never
   a place to invent orchestration rules.
2. **A report item** in that skill's Report section for the review's findings
   and the nodes they landed as.
3. **Await-window sizing** — see the measured evidence below. This half lands in
   `/dispatch-emulate`, not `/rsi`: the flag belongs to `dispatch-emulate-await`.

`serves` is deliberately left as `strategy-recursive-self-improvement`: the
requirement carried is that strategy's condition 14, even though the artifact
edited is now a skill `strategy-graph-native-dispatch` owns. Adding a second
`serves` edge would be a ranking act with no ordering effect here (band is max
across distributors, and rsi resolves higher), so it was not made.

## Measured evidence for the await window — keep, this is irreplaceable

The first finding of the 2026-08-11 acceleration review. The await script's
default timeout is 540s, and **every** phase of that iteration ran longer:

| phase | duration | await calls needed |
|---|---|---|
| implement | 14m10s | 2 |
| qa | 15m59s | 2 |
| fix | ~50m (11:21:15 to 12:11:55) | 6 |

Exit 20 is the documented call-again path, so none of this was an error — but
each extra call is a round trip that buys nothing, and two were lost outright
when the session compacted and the backgrounded await died with it. The flag
already exists (`--timeout-s`); nothing needs building. ~1800s is the starting
point for implement/qa/fix phases.

The operational half a fresh session cannot rediscover: prefer a foreground
call with a long tool timeout over a backgrounded one, since a backgrounded
await does not survive session teardown or compaction, and its exit status is
then stale rather than absent — the failure mode that actually bit that
iteration.

Do **not** change the 540s default in the script itself: the default serves
other callers, the flag is sufficient, and loop policy must not accumulate in
the scripts.

## Verification

```verify
npx tsx packages/intentionsutil/scripts/validate-graph.ts intentions
```

That confirms this node validates; it does **not** check the skill edit, and
must not be reported as if it did. The real verification is reading the skill's
loop end to end as a fresh session would, confirming the new step reads as part
of the loop's control flow rather than an appended note, and that it does not
conflict with the three non-negotiable rules.
