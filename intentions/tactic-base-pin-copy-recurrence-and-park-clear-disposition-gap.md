---
id: tactic-base-pin-copy-recurrence-and-park-clear-disposition-gap
kind: tactic
statement: "Observation carrier from the 2026-08-20 /align-tactics tactic-mode
  round on tactic-park-node-clear-park-base-pin-dedup: a known-duplicated shell
  block was copied a third time while the tactic to de-duplicate it sat in the
  backlog, and clarification 129’s ratified park-clear disposition member was
  never implemented in mark-node-terminal or clear-park"
owner: human
status: delegated
parent: null
rationale: null
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
office_hours:
  reason: 'Observation carrier, not planned work — two immaterial Side-B drift
    observations from the 2026-08-20 /align-tactics tactic-mode round on
    tactic-park-node-clear-park-base-pin-dedup that have no legal autonomous
    destination. (1) COPY RECURRENCE, measured this round: the --base
    pin-resolution block that node was minted to de-duplicate was copied a THIRD
    time into packages/intentionsutil/scripts/release-wait (2026-08-20, commit
    38934c61, tactic-wait-calendar-release) — after the PR #2988 review finding
    that named the duplication and predicted its spread. The finding sat in the
    backlog as a raw node while the defect it described recurred. The
    observation worth a human’s eye is not the third copy (this round’s plan
    absorbs it) but the general shape: a recorded, unstarted dedup-class finding
    does not warn the next author who copies the block, because nothing connects
    the graph node to the source file. (2) UNIMPLEMENTED RATIFIED DESIGN,
    verified this round: clarification 129 ratified option (b) — the
    office-hours drain skill declares terminal via mark-node-terminal with a new
    park-clear disposition member — and it is absent from code.
    mark-node-terminal:74’s enum is
    advance|demote|park|fix-attempt|align-round|no-claim|conflict-resolved|conflict-hold
    with no park-clear member; clear-park contains zero references to
    mark-node-terminal; the literal park-clear appears nowhere in
    packages/intentionsutil/scripts/ and only once in .claude/skills/, as the
    prose phrase "park-clearing actor". No caller is broken today (nothing
    invokes it), so this is an unimplemented ratified design rather than a live
    runtime failure — but under condition 14’s declared-vs-undeclared test the
    drain lane’s declaration path is a gap, not merely an aging enumeration.
    Neither observation gates the target node’s plan. No autonomous lane may
    write these to the serving strategy’s clarifications (clarification 245 /
    V1, which overturned clarification 118), and a tactic-target session never
    touches the serving strategy’s frontmatter at all, so this carrier is their
    destination.'
  since: 2026-08-20
  recommendation: "Read the body, then pick a disposition PER OBSERVATION — they
    are independent and need not share one. For (1) copy recurrence: DROP
    (accept that backlog latency lets a known duplication spread, and rely on
    review to catch it) / CLARIFY-ONLY (record the general shape as a strategy
    clarification: a dedup-class finding recorded as a graph node has no
    back-reference from the source file, so the next author copying the block is
    unwarned) / MECHANIZE (the strongest form — have a dedup-class finding land
    a marker comment at the duplication site naming the node, so the copy-paste
    author sees it; note this is a real design commitment with its own decay
    problem and should not be adopted casually). For (2) park-clear: DROP (rule
    that clarification 129’s option (b) is superseded — the drain now declares
    by other means, or the enumeration was retired by the 2026-07-29
    declared-vs-undeclared reframing, in which case amend 129 to say so) /
    CLARIFY-ONLY (record that the member is intentionally unimplemented pending
    a real drain caller) / BUILD (add the park-clear member to
    mark-node-terminal’s enum and wire the drain skill’s call, as 129 ratified —
    a small, self-contained tactic). Do NOT dispatch this node: it carries no
    plan."
  session_type: requirement-discovery
pace_exempt: false
rounds: null
attributes: {}
---
# Observation carrier from the 2026-08-20 /align-tactics tactic-mode round on tactic-park-node-clear-park-base-pin-dedup: a known-duplicated shell block was copied a third time while the tactic to de-duplicate it sat in the backlog, and clarification 129's ratified park-clear disposition member was never implemented in mark-node-terminal or clear-park

## What this node is

An **observation carrier**, not planned work. It has no `## Units of work`, no
`## Verification`, and no plan of any kind. **Do not dispatch it.** Its only
purpose is to hold two observations from the 2026-08-20 `/align-tactics`
tactic-mode round on `tactic-park-node-clear-park-base-pin-dedup` until a human
dispositions them at office hours.

Both were classified **immaterial** by that round's Side-B drift review:
neither gated the target node's plan, and `proceed` stayed true. Neither may be
written to the serving strategy's `clarifications` by an autonomous lane —
clarification 245 (violation V1) overturned clarification 118 — and a
tactic-target session never touches the serving strategy's frontmatter at all.
This node is their only legal destination.

The `office_hours.recommendation` field carries the per-observation disposition
menu. Read it alongside this body; the two are meant to be read together.

## Observation 1 — a known-duplicated block was copied again while its dedup tactic sat in the backlog

**Measured 2026-08-20 against `origin/main` 8788fd64.**

The `--base` pin-resolution block that `tactic-park-node-clear-park-base-pin-dedup`
was minted to de-duplicate was copied a **third** time, into
`packages/intentionsutil/scripts/release-wait` (2026-08-20, commit `38934c61`,
under `tactic-wait-calendar-release`). The PR #2988 review finding that named
the duplication — and explicitly predicted its spread, guessing `resolve-park`
as the next copy — was already recorded as a graph node when that happened.

Verified this round: the three blocks (`park-node:202-239`,
`clear-park:235-272`, `release-wait:141-179`) are code-identical modulo the
program-name prefix in four error strings and the id variable (`WAIT_ID` vs
`NODE_ID`). `release-wait` even carries the comment "Same three accepted forms
park-node takes" — the author knew they were copying.

**The third copy itself is not the point.** This round's plan absorbs it: the
target node's scope was widened from two call sites to three, and its helper
signature takes the node id and the remediation sentence as parameters
specifically so the third site fits without a later signature change. That
work is planned and needs nothing from a human.

**The generalizable shape is the point.** A dedup-class finding recorded as a
graph node has **no back-reference from the source file it describes**. The
node names the file; the file does not name the node. So while the finding sits
unstarted in the backlog — which is the normal state for a low-rank cleanup —
the next author to touch that code has no signal that the block they are about
to copy is already recorded as duplicated. Backlog latency is not the defect;
the missing back-edge is what turns latency into recurrence.

This is a question about how findings attach to code, not about this particular
block. It is worth a ruling only if the pattern generalizes beyond this
instance — which is exactly the judgment being deferred here rather than made
autonomously.

## Observation 2 — clarification 129's ratified `park-clear` disposition is unimplemented

**Verified 2026-08-20 against `origin/main` 8788fd64.**

Clarification 129 (ratified 2026-07-28, office-hours session on
`tactic-office-hours-self-modification-skill`) chose option (b): the office-hours
drain skill declares its terminal disposition by calling `mark-node-terminal`
itself, "with a new `park-clear` member added to that script's disposition
enum." That member does not exist, and neither does the call.

Measured facts:

- `packages/intentionsutil/scripts/mark-node-terminal:74` validates against
  `advance|demote|park|fix-attempt|align-round|no-claim|conflict-resolved|conflict-hold`.
  There is no `park-clear` member. An invocation with it exits 2.
- `packages/intentionsutil/scripts/clear-park` contains **zero** references to
  `mark-node-terminal`.
- The literal string `park-clear` appears nowhere under
  `packages/intentionsutil/scripts/`. Under `.claude/skills/` it appears exactly
  once, in `.claude/skills/office-hours/SKILL.md:328`, and there only as the
  prose phrase "park-clearing actor" — not as an instruction to call the
  primitive.

**Stated precisely, because the distinction matters for disposition:** nothing
is broken at runtime today. No caller invokes `mark-node-terminal` with
`park-clear`, so no session is currently failing. This is an **unimplemented
ratified design**, not a live failure.

What makes it more than an aging enumeration is condition 14's
declared-vs-undeclared test. Under that condition a pass that ends without
declaring a disposition is *kept* — its job held, its worktree claim held, its
node frozen. Clarification 129's own reasoning is that the drain lane is in the
class where "only the session can know it is done," which is why the skill, not
the primitive, must declare. If the drain lane has no declaration path at all,
then either its successful drains freeze the nodes they just unblocked, or the
lane is declaring by some other means that clarification 129 does not describe.
Which of those is true is not determinable from the code alone, and is part of
what a human needs to decide.

Note also that clarification 129 was itself amended on 2026-07-29 to say
`park-clear` is "no longer 'a third clean terminal state' appended to an
enumeration but one member of an open set the condition no longer enumerates."
One reading of that amendment is that the enum addition became unnecessary.
That reading is available to the dispositioning human and is not asserted here.

## Provenance

- **Round:** `/align-tactics tactic-park-node-clear-park-base-pin-dedup`,
  2026-08-20, tactic-mode finalize (draft/raw → `phase: implement`).
- **Target node:** `tactic-park-node-clear-park-base-pin-dedup`, landed in the
  same `land-align-round` call as this carrier.
- **Base:** `origin/main` 8788fd64. Every measurement above was taken in that
  round's worktree at that commit; re-verify before acting, since both
  observations name line anchors that move.
- **Routing rule that produced this node:** clarification 245 / V1 (ruled
  2026-08-14, extended 2026-08-15), which overturned clarification 118. An
  autonomous per-node round may not write immaterial drift observations to the
  serving strategy's `clarifications`; it mints one born-parked observation
  node serving the strategy instead, and the round proceeds uninterrupted.
