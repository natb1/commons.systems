---
id: tactic-align-skill-draft-selectability-stale-prose
kind: tactic
statement: correct /align SKILL.md Step 4's claim that the router never selects
  a draft tactic — the router does select drafts, emitting them at the
  align-tactics rung
owner: ai
status: raw
parent: null
rationale: Surfaced as a graph-internal inconsistency during the 2026-08-11
  /align round on graph-ops tooling. The skill prose asserts a router behavior
  the router does not have. The router is correct; the prose is the stale
  artifact. Left unfixed, a future align session authoring a draft tactic
  believes it is writing inert retained context when it is in fact writing a
  selectable candidate.
reading: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications:
  - question: Was this fix applied, and did the recorded scope cover every site of
      the stale claim?
    answer: "(Recorded 2026-08-13. Applied in the /align round that recorded the
      office-hours plan view on strategy-attention-surface; the node's phase
      moves to done in that same commit.) Applied, and the recorded scope was
      INCOMPLETE by one site. Site 1, as recorded: .claude/skills/align/SKILL.md
      Step 4. Claim 1 is replaced with the actual behavior — a draft marks
      undecomposed work whose next step is an /align-tactics session, and the
      router DOES select it at the align-tactics directive rung, subject to the
      three gates this node named (office_hours null, blockers all done, not
      another tactic's parent). Claim 2 survives, restated with the reason the
      router comment gives: a strategy with only draft children still emits its
      own fresh-round candidate and the two compete by rank. Site 2, NOT in the
      recorded scope and found by this round's sweep:
      intentions/tactic-graph-native-dispatch's body carried the same claim in
      its 'Draft phase' bullet. Corrected in the same commit. The recorded scope
      told the implementer to sweep '.claude/skills/align/ and
      .claude/skills/align-tactics/, including references/' — a skill-only
      sweep, which would have missed this. GENERAL LESSON for the same class of
      prose-correction node: sweep the GRAPH as well as the skill surface,
      because doctrine bullets in tactic and kind bodies restate skill prose and
      drift with it. The align-family sweep itself is now clean. CONSEQUENCE
      REALIZED, exactly as this node's own 'consequence if left' section
      predicted: before the fix landed, the 2026-08-13 /align session reasoned
      FROM the stale Step 4 prose, concluded that only 77 of 415 open tactics
      could carry an ETA when the true figure is 223, and recommended a narrower
      default row set for the plan view on that basis. The author caught it and
      directed the correction. The mis-modelling is one-directional and
      non-destructive as recorded, but it did propagate into a design
      recommendation before being caught. CORRECTED SAME DAY (2026-08-13),
      because the entry above overstated what landed. The two sites did NOT land
      together. graph-commit rebuilds its edit on an intentions/-only base, so
      it silently EXCLUDED the .claude/skills/align/SKILL.md change from the
      commit it pushed — 405bdae8 carries site 2 (tactic-graph-native-dispatch)
      and this node's own disposition, but NOT site 1. Site 1 is therefore open
      at PR 3081 and the skill prose on main is still stale. phase is reverted
      to null accordingly: this node is not done until 3081 merges, and leaving
      it done would have left the graph asserting a fix that main does not carry
      — the same class of false record the node itself exists to correct.
      MECHANISM WORTH KNOWING for any future round that pairs a graph edit with
      a non-graph file edit: graph-commit is not a general commit path. It lands
      intentions/ only, reports 'landed' for the ids it was given, and says
      nothing about a non-intentions change sitting in the same worktree — which
      it also resets away on exit. Land the non-graph half on its own branch and
      verify it against origin/main separately; do not infer it from
      graph-commit's verdict."
  - question: Did the fix actually land on origin/main, and was the sweep for the
      same stale claim finally complete?
    answer: "(Recorded 2026-08-14 by the closing round; phase moves to done in this
      same commit.) VERIFIED LANDED. PR 3081 merged 2026-08-13T19:35:58Z as
      merge commit d5bba8b6d2627e01f59d0ec18395a217170a5f2b, confirmed an
      ancestor of origin/main by git merge-base --is-ancestor. Site 1
      (.claude/skills/align/SKILL.md Step 4) is therefore on main, closing the
      gap the entry above recorded when graph-commit silently excluded the
      non-intentions half of the work from 405bdae8. The verdict was checked
      against main's content, not inferred from the PR being marked merged.
      VERIFICATION DISCHARGED as this node's own Verification section specifies:
      the corrected Step 4 prose names three gates — office_hours null, blockers
      complete, and not another tactic's parent — and all three exist in
      router.ts's frozen-tactic candidate loop (the office_hours and
      blockersComplete guards head the loop; the subtreeParentIds guard is the
      first branch inside isDraft). No gate present in the code is omitted from
      the prose, and claim 2 survives intact and correctly attributed. BUT THE
      SWEEP WAS STILL INCOMPLETE, a third time, and in exactly the direction the
      entry above warned about. The 2026-08-13 graph sweep searched for the
      claim's ORIGINAL WORDING and so found only tactic-graph-native-dispatch.
      Grepping the paraphrase 'retained context, not selectable work' across
      intentions/ finds three further nodes asserting the same falsehood about
      themselves: tactic-review-lows-finance and
      tactic-review-lows-attention-surface (each in BOTH rationale and body),
      and tactic-ledger-sweep-on-read (in rationale and body). The first two are
      LIVE align-tactics candidates in select-targets' output at the time of
      writing, while their own text says they are not selectable work. The third
      is genuinely unselectable today, but because its three blockers are open —
      not because it is a draft — so its prose teaches the same false rule while
      happening to state a true conclusion. All five residual sites are
      corrected in this same commit, which is why this node closes with a clean
      sweep rather than a deferred residue. SHARPENED GENERAL LESSON,
      superseding the one above: sweep for the CLAIM, not the SENTENCE. A stale
      doctrinal assertion propagates by paraphrase, and the wording carried by
      the node that owns the correction is not necessarily the most common
      phrasing of it — here the paraphrase outnumbered the original three sites
      to two. Grep the load-bearing predicate ('selectable', 'never selects')
      rather than a remembered sentence, and confirm the result against the
      selector's actual candidate list, which settles selectability as a fact
      instead of an inference."
tooling_goals: []
success_signal: null
attention: null
phase: done
execution:
  branch: fix-align-draft-selectability-prose
  pr: 3081
  attempts: {}
  markers: []
  strategy_fingerprint: null
  fix: null
  conflict: null
  completion:
    mergedAt: 2026-08-13T19:35:58Z
    mergeCommitSha: d5bba8b6d2627e01f59d0ec18395a217170a5f2b
    graphCommitSha: null
  lane_pass: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# correct /align SKILL.md Step 4's claim that the router never selects a draft tactic — the router does select drafts, emitting them at the align-tactics rung

## The inconsistency

`.claude/skills/align/SKILL.md` Step 4 ("Retain draft tactics"), at
`origin/main` line 497–500, tells the author what omitting `phase` means:

> No `phase` field (equivalently `phase: draft`) marks it as retained
> context, not selectable work — the router never selects a draft tactic and
> it does not count as a child for the strategy's `/align-tactics`
> eligibility.

That sentence makes **two** claims. They do not share a verdict.

**Claim 1 — "the router never selects a draft tactic" — FALSE.**
`packages/intentionsutil/src/router.ts:558-586` runs a dedicated
frozen-tactic candidate loop whose first branch is exactly the draft case:

```
if (isDraft(t)) {
  if (subtreeParentIds.has(t.id)) continue; // permanent container
  candidates.push({ id: t.id, kind: "tactic", phase: "align-tactics", ... });
}
```

`isDraft` (`router.ts:147-149`) is `tactic.phase === null || tactic.phase
=== "draft"` — precisely the state Step 4's recipe produces. The router's
own doc comment (`router.ts:442-447`) states the behavior plainly: draft/raw
tactics "are also first-class selectable candidates that route to
`/align-tactics`", gated on `office_hours === null` and complete blockers,
with the candidate `phase` set to the directive rung `align-tactics` while
the progression ordinal reads the node's real phase (draft, index 0) so a
draft sorts last among rank ties.

**Claim 2 — "it does not count as a child for the strategy's
`/align-tactics` eligibility" — TRUE.** `router.ts:448-449`: "A strategy
with only draft children still emits its own fresh-round align-tactics
candidate; the two compete by rank." A draft child does not suppress its
strategy's own candidate. This half of the sentence is accurate and must
survive the fix.

## Why the router is right

This is not a bug report against `router.ts`. Routing a draft to
`/align-tactics` is the intended consumption path, and the skill's own
following sentence already says so — a draft body "survives untouched until
`/align-tactics` consumes it." Selection at the `align-tactics` rung *is*
that consumption. The behavior was introduced deliberately by
`tactic-graph-frozen-tactic-dispatch` (PR #2883, since completed and
pruned; the router comments retain it as a provenance citation), which made
drafts and soft-frozen tactics first-class candidates so an undecomposed
draft surfaces for its own align session rather than lingering invisibly.

The defect is that Step 4's prose predates that change and still describes
the older world where a draft was inert. Two exclusions the prose also omits
are load-bearing and belong in the corrected text: a draft named as another
tactic's `parent` is a permanent subtree container and is skipped
(`router.ts:573`), and a draft with non-null `office_hours` (the born-parked
review-item state Step 2's deferral mechanics create) is skipped
(`router.ts:570`).

## Consequence if left

An align session following Step 4 believes a draft tactic is inert retained
context. It is instead a selectable candidate that the router will surface
for an `/align-tactics` session once dispatch resumes. The author's mental
model of what a `/align` round puts into flight is wrong by exactly the
number of drafts the round retains — the 2026-08-11 round retained four.
The mis-modelling is one-directional and non-destructive (work gets
scheduled that the author thought was parked, not the reverse), which is why
this is prose-correction scope and not an incident.

## Scope

Correct claim 1 in `.claude/skills/align/SKILL.md` Step 4 while keeping
claim 2. State the actual behavior: no `phase` marks the node as
undecomposed work whose next step is an `/align-tactics` session, not
executable phase work — the router selects it at the `align-tactics`
directive rung, subject to the `office_hours`-null, blockers-complete, and
not-a-subtree-parent gates. Sweep for the same stale claim elsewhere in the
align skill family before editing (`.claude/skills/align/`,
`.claude/skills/align-tactics/`, including `references/`).

Out of scope: any change to `router.ts` or its tests; the router's behavior
is the correct reference. Also out of scope: the born-parked review-item
mechanics in Step 2, which already set `office_hours` and are correctly
described.

## Verification

Read the corrected Step 4 text against `router.ts:558-586` and confirm each
gate named in the prose exists in the code and no gate in the code is
omitted from the prose. `packages/intentionsutil/test/router.test.ts:125`
already asserts the draft-selectability behavior, so no new test is owed
against the router; the deliverable is prose accuracy.

Recorded 2026-08-11.
