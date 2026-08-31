---
id: tactic-fleet-alarm-noop-comparison-preregion
kind: tactic
statement: dispatch-fleet-alarm's refresh no-op comparison and its splice_body
  disagree about who owns a pre-region alarm-node body — the comparison treats
  the whole body as generated, splice_body treats it as authored — so a
  pre-region node classifies "changed" on every tick and strands one stale
  reading above its live region; align the comparison to splice_body's
  conservative rule
owner: ai
status: raw
parent: null
rationale: >-
  Minted 2026-08-30. This is STEP 2 of the two-step fleet-alarm fix ruled at
  `plans/dispatch-rsi-author-ratification.md:2664` (§5.23, "MIGRATE THE DATA
  FIRST, then align the code. The order is load-bearing."). Step 1 — wrapping
  the alarm-kind node bodies in the generated marker pair — landed 2026-08-29 as
  `61cdca5d` across four nodes. Step 2 was deliberately NOT folded into it and
  is filed here as its own tactic.


  The reason it is a separate node, not a direct edit, is recorded at
  `plans/dispatch-rsi-author-ratification.md:785` (§1.11): step 2 edits
  `dispatch-fleet-alarm`, one of the three code sites named verbatim in the OPEN
  question a live `office_hours` park on
  `tactic-autonomous-body-write-wholesale-replace` exists to hold. That park's
  recommendation opens "Pick one of three…" over exactly those three copies.
  Editing one of them under delegated authority would decide the parked question
  by fait accompli rather than by ruling — implementing inside a settled scope
  is delegated, narrowing the option set of an open parked decision is not.
  Hence the `blocked_by` edge.


  §5.23's own census is refuted in scope and this node does not carry it: that
  entry measured "8 `tactic-fleet-alarm-*` nodes … All 8 predate the region" by
  NAME PREFIX, and four of the eight are session- or author-authored findings
  that share the prefix and nothing else. Only four were migrated. See
  `plans/dispatch-rsi-author-ratification.md:818` (§1.12) for the enum
  measurement. The ordering argument stands; the data set was wrong.
reading: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications:
  - question: Why is this blocked on
      `tactic-autonomous-body-write-wholesale-replace` rather than simply queued
      behind it?
    answer: "Recorded 2026-08-30. That node is `phase: implement` with a LIVE
      `office_hours` park whose reason reads \"The copy-paste this node exists
      to eliminate still sits at three sites (`dispatch-eval-finding`,
      `dispatch-fleet-alarm`, `dispatch-invalid-state-followup`)\" and whose
      recommendation asks the author to pick one of three dispositions for those
      copies. This node's whole change is inside `dispatch-fleet-alarm`'s local
      `splice_body`/comparison pair — the second of those three sites. Shipping
      it first would remove one of the dispositions the parked node offers, so
      the dependency is a real gate on the DECISION, not a queueing preference.
      If the author's ruling retires the local copy in favour of a shared
      primitive, this node's scope changes shape; re-plan it against the ruling
      rather than executing this body verbatim."
  - question: Does the migration this depends on actually cover the nodes the fix
      will meet?
    answer: "Measured 2026-08-30 in the worktree at `origin/main` `546042d4`: the
      four alarm-kind nodes carry the marker pair —
      `intentions/tactic-fleet-alarm-busy-stall.md:65`,
      `intentions/tactic-fleet-alarm-daemon-degraded.md:27`,
      `intentions/tactic-fleet-alarm-unclaimed-hold.md:27`,
      `intentions/tactic-fleet-alarm-watch-unknown.md:27` (opening markers;
      closing markers at `:72`, `:37`, `:33`, `:38`). These are exactly the four
      `61cdca5d` wrapped. The other five kinds in the script's enum
      (`tick-stale`, `automerge-suppressed`, `main-checkout-held`, `heal-fired`,
      `heal-unknown`) have no node in the store yet, so their first mint goes
      through `splice_body`'s create path and is born with the region. The
      pre-region branch this node removes is therefore already unreachable for
      alarm-kind nodes in the store — which is why the fix is safe to make and
      why it is a correctness cleanup rather than a live bug fix."
tooling_goals: []
success_signal: null
attention: null
phase: null
execution: null
validates: []
blocked_by:
  - tactic-autonomous-body-write-wholesale-replace
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# dispatch-fleet-alarm's refresh no-op comparison and its splice_body disagree about who owns a pre-region alarm-node body — the comparison treats the whole body as generated, splice_body treats it as authored — so a pre-region node classifies "changed" on every tick and strands one stale reading above its live region; align the comparison to splice_body's conservative rule

## Context

`.claude/skills/dispatch-propagate/scripts/dispatch-fleet-alarm` holds two
independent readings of the same question — *on a node with no
`<!-- generated:dispatch-fleet-alarm -->` region yet, who owns the existing body?*
Both are in the same script and they answer differently.

- **`splice_body`** (`:460`) treats the prior body as **authored** and keeps it,
  appending a fresh region after it. It discards only `write-node.ts`'s
  single-line `# <statement>` placeholder — the test at `:545-546` is
  `authored=$(grep -v '^[[:space:]]*$' "$prior")` followed by
  `[[ -n "$authored" && ( "$authored" == *$'\n'* || "$authored" != '# '* ) ]]`.
- **the refresh no-op comparison** (`:924-935`) takes the opposite view. Its
  `else` branch carries the comment *"A node written before the region existed:
  the whole body was ours"* and runs `cp "$ONDISK_BODY" "$ONDISK_REGION"`.

The consequence, traced through `:940-942`: on a pre-region node the comparison
diffs the new reading against the **whole old body**, which never matches, so
`cmp -s` never fires and the tick always classifies "changed" and refreshes.
`splice_body` then **preserves** that old body — which was in fact the previous
generated reading — as if a human had written it, and appends the new region
beneath. Each such node permanently strands exactly one stale reading above its
live region, and the strand is sticky, because from the next tick onward the node
has a region and the comparison narrows to it.

The marker constants are at `:439-440`.

## Why the fix goes this direction and not the cheaper one

The cheaper repair is to make `splice_body` match the comparison — treat a
pre-region body as script-owned and overwrite it wholesale. **Rejected in the
ruling.** That reinstates precisely the defect the marker pair was introduced to
fix: it discards a human diagnosis written into a pre-region node, which is the
exact case the marker change exists to protect. A parked alarm node is parked
*because* a human is looking at it, and a pre-region node is the oldest such node
and therefore the most likely to carry one.

## Why STEP 1 had to come first, and did

Aligning the comparison while the alarm nodes still had no region would make it
read their region as **empty**, compare the reading against nothing, classify
"changed" on every tick, and strand the body on the very next refresh — the exact
harm step 2 exists to prevent. The migration is what gives the conservative rule
something correct to compare against.

Step 1 landed 2026-08-29 as `61cdca5d`, "graph: wrap the four alarm-kind node
bodies in the generated marker region" — four files, 8 insertions. The scope was
**four**, not the eight §5.23 measured: `dispatch-fleet-alarm` carries its alarm
kinds as an explicit enum at `:189`
(`KINDS=(tick-stale daemon-degraded busy-stall automerge-suppressed unclaimed-hold main-checkout-held watch-unknown heal-fired heal-unknown)`)
and four of the eight prefix-matching files are not in it at all. Wrapping those
four would have labelled human plans as machine-generated output and armed the
next refresh to overwrite them.

## Scope

One code change, in
`.claude/skills/dispatch-propagate/scripts/dispatch-fleet-alarm`:

1. Replace the `else` branch at `:934-935` — the `cp "$ONDISK_BODY"
   "$ONDISK_REGION"` fallback and its "the whole body was ours" comment — with
   `splice_body`'s conservative reading: on a node with no region, this script
   owns **nothing** on disk yet, so the comparison's owned-region side is empty
   and the reading always counts as changed. State that outcome deliberately in
   the code rather than reaching it by accident, and say in the comment why the
   two sides now agree.
2. Add the regression case to
   `.claude/skills/dispatch-propagate/scripts/test-dispatch-fleet-alarm.sh`: a
   pre-region node whose body equals the incoming reading must NOT be treated as
   an identical-reading `noop`, and after the refresh the prior body must survive
   above the new region rather than being consumed into it.

**Re-derive every anchor above before editing.** They were measured 2026-08-30
against the worktree, another session was editing that directory in the same
window, and the file is long enough that line drift is the norm. Locate
`splice_body`, `ONDISK_REGION` and `BODY_REGION_OPEN` by name.

## Dependencies

`blocked_by: tactic-autonomous-body-write-wholesale-replace`. That node's park
holds an open author question over the three surviving `splice_body` copies, and
`dispatch-fleet-alarm` is one of them. Do not start this before that park is
cleared; when it clears, re-plan this node against the ruling — if the ruling
introduces the shared `node_body_write` primitive, the right shape for this fix
is to adopt the primitive rather than to patch the local copy.

## Reuse

- `splice_body`'s own pre-region rule (`dispatch-fleet-alarm:541-546`) is the
  authority this change aligns to. Do not restate the rule in a second place —
  make the comparison defer to the same reading.
- The marker constants `BODY_REGION_OPEN` / `BODY_REGION_CLOSE` (`:439-440`) are
  already shared by both sides; keep using them rather than re-spelling the
  marker text.
- `.claude/skills/dispatch-propagate/scripts/test-dispatch-fleet-alarm.sh`
  already builds marker-region fixtures (its awk region extractor around
  `:316-330` and `:362`) — extend those rather than writing a new harness.

## Verification

```verify
bash .claude/skills/dispatch-propagate/scripts/test-dispatch-fleet-alarm.sh && bash .claude/skills/dispatch-propagate/scripts/run-lint.sh
```

The two commands are joined with `&&` on one line deliberately: the fence runner
adds no `set -e`, so only the LAST statement's exit status decides the fence.
Split across two lines, a red test run would be masked by a green lint.

Manual, because it is an observe-in-production check: after the change is on
main, watch one full re-detection cycle on an open alarm node and confirm the
tick prints `noop` when the reading is unchanged, and that the node's body gains
no second region and loses nothing above its existing one.

## Out of scope

- The other two `splice_body` copies (`dispatch-eval-finding`,
  `dispatch-invalid-state-followup`) and the shared primitive itself. Those
  belong to `tactic-autonomous-body-write-wholesale-replace`.
- The separate cost finding that predicate 5's clear verdict execs the alarm
  script every pass just to discover there is nothing to resolve — that is
  `tactic-fleet-watch-alarm-noop-overhead`, a different `noop`.
- Wrapping the four non-alarm-kind `tactic-fleet-alarm-*` files. Ruled out at
  `plans/dispatch-rsi-author-ratification.md:818`.
