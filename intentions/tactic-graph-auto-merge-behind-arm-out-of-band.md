---
id: tactic-graph-auto-merge-behind-arm-out-of-band
kind: tactic
statement: Decide what graph-auto-merge should do with a compare status of
  behind — a PR head that is already an ancestor of main, i.e. whose commits
  landed out of band — instead of routing it into the sync arm, where the
  update-branch call is an empty-diff no-op the mergeable gate then silently
  declines to merge
owner: ai
status: raw
parent: null
rationale: "Raised by the second /code-review high round on PR #3073 and filed
  2026-08-13 with the reviewer's failure model CORRECTED, so the node does not
  enshrine a wrong one. The reviewer reported that the behind arm makes the
  ladder throw every tick. It does not. tactic-graph-auto-merge-up-to-date-gate
  routes both behind and diverged into the sync arm, and for behind the
  update-branch call has nothing to merge -- main already contains the head.
  What follows is not a throw: the merge is gated earlier by mergeable ==
  MERGEABLE (graph-auto-merge:341-342), which for an out-of-band-landed PR is
  not MERGEABLE, so the candidate is passed over as a SILENT SKIP with no stdout
  line at all. The current behaviour is deliberate rather than accidental: the
  shipped code comments the behind case explicitly, noting the commits already
  landed out of band, that it is rare, that it takes the same sync-and-defer
  path rather than merging, and that reconcile-graph-merged absorbs the
  genuinely-already-merged case on a later tick. It is pinned by test n2 in
  test-graph-auto-merge.sh. So this is low severity on a rare path, and
  reversing a tested behaviour was explicitly out of PR #3073's scope. What
  remains genuinely open, and is this node's subject, is narrower: whether a
  silent skip is the right OBSERVABILITY for a state the router can name
  exactly, given that a silent skip is indistinguishable from ineligibility to
  an operator reading tick output."
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
# Decide what graph-auto-merge should do with a compare status of behind — a PR head that is already an ancestor of main, i.e. whose commits landed out of band — instead of routing it into the sync arm, where the update-branch call is an empty-diff no-op the mergeable gate then silently declines to merge

## Read the corrected mechanism first

This node was raised by a review that got the failure model wrong. The wrong
model is recorded here explicitly, because a node that enshrines it would send
the next implementer hunting for a crash that does not happen.

**What the review reported:** the `behind` arm makes the ladder throw every
tick.

**What actually happens:** it does not throw, and there is no per-tick error at
all.

`tactic-graph-auto-merge-up-to-date-gate` routes both `behind` and `diverged`
into the sync arm. For `behind`, the `update-branch` call has nothing to merge
— `main` already contains the head. What follows is **not** a throw: the merge
is gated earlier, by `mergeable == MERGEABLE`
(`graph-auto-merge:341-342`), and a PR whose commits landed out of band is not
`MERGEABLE`. So the candidate is passed over as a **silent skip**, with no
stdout line at all. `graph-auto-merge`'s stdout protocol emits nothing for a
plain skip by design.

## Why the current behaviour is deliberate

The shipped code comments the `behind` case explicitly: the commits already
landed out of band; the case is rare; it takes the same sync-and-defer path
rather than merging; and `reconcile-graph-merged` absorbs the
genuinely-already-merged case on a later tick. That is a decision, not an
oversight, and it is pinned by test **n2** in
`.claude/skills/dispatch-propagate/scripts/test-graph-auto-merge.sh:569-580`,
which asserts a `behind` branch emits `synced #<pr> (<id>)`, exits 0, and
issues no merge.

Reversing a tested behaviour was explicitly out of PR #3073's scope, and this
node is filed instead of a patch. Severity is **low**: a rare path, no
incorrect merge, no wedge, and the absorbing reconciler already owns the real
recovery.

## What is genuinely open

Narrower than the review claimed, and worth doing on its own terms:
**observability**, not correctness.

The router can name this state *exactly* — it has the compare status in hand —
and then discards that knowledge. A silent skip is indistinguishable, to an
operator reading tick output, from ordinary ineligibility. The one case where
the system knows precisely why it is not merging is the case where it says
least.

Note also that the current path spends a REST `update-branch` call to
accomplish nothing before that silent skip. That is a small cost, not a defect,
but it is the tell that the arm is doing the wrong thing for the right reason:
`behind` is being handled as a *degenerate* case of "not up to date" when it is
really a different condition — *already landed* — with a different owner
(`reconcile-graph-merged`).

## Options, for whoever picks this up

1. **Emit a distinct line and skip.** Give `behind` its own stdout token so a
   tick log names it, and drop the pointless `update-branch` call. Smallest
   change; keeps every routing decision where it is.
2. **Hand it to the absorbing reconciler explicitly**, rather than waiting for
   `reconcile-graph-merged` to notice on a later sweep. Better closure, but it
   moves a routing act into a script whose whole discipline is that it only
   updates the branch and defers — weigh that against the one-gate invariant on
   `strategy-graph-native-dispatch`.
3. **Leave it.** Defensible. Say so on the node and close it, rather than
   leaving it open as an implied defect.

Whichever is chosen, test n2 is the pin to update deliberately — not to relax
(`.claude/rules/test-integrity.md`).
