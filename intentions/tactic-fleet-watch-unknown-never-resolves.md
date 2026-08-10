---
id: tactic-fleet-watch-unknown-never-resolves
kind: tactic
statement: dispatch-fleet-watch's watch-unknown meta-alarm has no resolve path,
  so a node it raises can never clear mechanically even after every input
  becomes readable again
owner: ai
status: raw
parent: null
rationale: "Discovered 2026-08-06 during an /align-tactics
  tactic-fleet-alarm-watch-unknown tactic-mode session (both by that Workflow
  round's drift-review agent independently and confirmed by this caller
  session). Not auto-created by dispatch-fleet-alarm -- a session-authored
  finding, landed as its own tracked node per this repo's sole-tracker-recording
  convention (real defects land as a tactic, never left in a transcript;
  precedent: tactic-fleet-alarm-node-park-clobber-loop, and
  tactic-fleet-watch-busy-stall-pace-blind, filed the same way from sibling
  tactic-fleet-alarm-* sessions on 2026-08-04 and 2026-08-05). Distinct from
  tactic-fleet-alarm-node-park-clobber-loop: that node tracks the router wrongly
  emitting tactic-fleet-alarm-<kind> nodes as /align-tactics candidates at all,
  and the mint writer clobbering any park landed on one -- a
  routing/selectability defect. Distinct from
  tactic-fleet-watch-alarm-noop-overhead: that node tracks the per-pass Node
  cold-start COST of always exec-ing dispatch-fleet-alarm --resolve on an
  already-clear predicate -- a performance concern, not a correctness bug, and
  it covers the five NAMED predicates' resolve calls, not the watch-unknown
  meta-alarm at all. This node tracks a functional gap in the watch-unknown
  meta-alarm itself: dispatch-fleet-watch
  (.claude/skills/dispatch-propagate/scripts/dispatch-fleet-watch:839-851)
  raises watch-unknown inside `if [[ \"$UNKNOWN_COUNT\" -gt 0 ]]` with no else
  branch, so unlike the five named predicates -- each of which pairs
  raise_alarm/resolve_alarm through the dispatch_predicate helper (lines
  764-769) keyed on its own clear/finding verdict -- `dispatch-fleet-alarm
  --resolve --kind watch-unknown` is never called anywhere in the script. A
  fired watch-unknown node therefore stays open on origin/main forever, even
  once every predicate reads cleanly again, until a human or an /align-tactics
  session notices and hand-resolves it. Confirmed live: this session's own
  triggering node, tactic-fleet-alarm-watch-unknown, was minted for a one-off
  tick-stale `.ts`-parse miss (independently root-caused and already fixed
  elsewhere as tactic-decision-log-append-noncompact-corruption) whose
  underlying condition has since self-cleared -- the live
  routing-decisions.jsonl tail parses fine -- yet the node remains open because
  nothing in dispatch-fleet-watch ever calls the resolve. Verified
  dispatch-fleet-alarm --resolve --kind watch-unknown is already a supported,
  safe no-op call: watch-unknown is in the KINDS array
  (dispatch-fleet-alarm:180) and --resolve on a node that is not open logs
  'nothing to do', prints noop, and exits 0 (dispatch-fleet-alarm:554-558) -- so
  adding the call unconditionally, mirroring the five named predicates, is safe
  even when no watch-unknown node is currently open."
reading: null
gap: null
serves:
  - strategy-autonomous-execution
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
# dispatch-fleet-watch's watch-unknown meta-alarm has no resolve path, so a node it raises can never clear mechanically even after every input becomes readable again

## Context

Filed from an `/align-tactics tactic-fleet-alarm-watch-unknown` tactic-mode
session on 2026-08-06. That session's Workflow round could not finalize or
plan the fleet-alarm node itself — `tactic-fleet-alarm-<kind>` nodes are
mechanically minted/resolved instrument records (see
`tactic-fleet-alarm-node-park-clobber-loop`) whose only legitimate terminal is
`dispatch-fleet-alarm --resolve`, so the triggering session declined that node
with zero graph writes. While investigating whether the triggering node's
reading was still live, the session found the alarm class that raises it —
`watch-unknown`, the meta-alarm covering every unreadable input across all
five real predicates — has no mechanism to ever resolve itself, and is
recording that as its own defect here rather than leaving it in the
transcript.

## Reason

`dispatch-fleet-watch`'s five named predicates (tick-stale, daemon-degraded,
busy-stall, automerge-suppressed, unclaimed-hold) each report their verdict
through `dispatch_predicate` (`.claude/skills/dispatch-propagate/scripts/dispatch-fleet-watch:764-769`),
which raises an alarm on `finding` and resolves it on `clear` — so any of
those five self-heals the moment its input reads clean again.

`watch-unknown` is different: it is not one of the five, but a meta-alarm
computed from `UNKNOWN_COUNT` (how many of the five, plus the pause state,
came back `unknown` this pass). Its only call site is:

```
if [[ "$UNKNOWN_COUNT" -gt 0 ]]; then
  raise_alarm watch-unknown \
    "dispatch-fleet-watch could not read $UNKNOWN_COUNT of its inputs this pass" \
    ...
fi
```

(`dispatch-fleet-watch:839-851`). There is no `else` branch, and `grep -c
'resolve_alarm watch-unknown' dispatch-fleet-watch` returns 0 — nothing in the
script ever calls `dispatch-fleet-alarm --resolve --kind watch-unknown`. Once
any single pass has any unreadable input, the resulting
`tactic-fleet-alarm-watch-unknown` node stays open on `origin/main`
indefinitely, even after every predicate reads clean on every later pass,
until a human — or an `/align-tactics` session like the one that filed this
node — notices and hand-resolves it. That is exactly backwards from the
watcher's own stated purpose (never manufacture a false all-clear) turned
inside out: a watcher that cannot un-alarm on a genuine all-clear trains
whoever reads its output to discount the alarm, and burns human/session
attention on every transient blip in perpetuity — the opposite of the
"engage only at escalation points" goal `strategy-autonomous-execution`
exists to deliver.

Live confirmation: this defect's own triggering node,
`tactic-fleet-alarm-watch-unknown`, was minted for a one-off tick-stale
`.ts`-parse miss (independently root-caused and already fixed elsewhere as
`tactic-decision-log-append-noncompact-corruption` — pretty-printed
multi-line JSON breaking the JSONL invariant). That underlying condition has
since self-cleared — the live `routing-decisions.jsonl` tail parses fine as
of this writing — yet the node remains open purely because nothing calls the
resolve.

The fix is safe to make unconditionally: `watch-unknown` is a supported
`--resolve --kind` value (in the `KINDS` array,
`.claude/skills/dispatch-propagate/scripts/dispatch-fleet-alarm:180`), and
`--resolve` on a kind with no open node logs "nothing to do", prints `noop`,
and exits 0 (`dispatch-fleet-alarm:554-558`) — exactly the same no-op safety
the five named predicates already rely on when they resolve on every clear
pass regardless of whether anything was previously open.

## How to resolve

In `dispatch-fleet-watch`, change the raise-only block at (current) lines
839-851 to a raise/resolve pair, symmetric with how the five named predicates
already work:

```bash
if [[ "$UNKNOWN_COUNT" -gt 0 ]]; then
  raise_alarm watch-unknown \
    "dispatch-fleet-watch could not read $UNKNOWN_COUNT of its inputs this pass" \
    "..."
else
  resolve_alarm watch-unknown
fi
```

This is scoped, mechanical work — not a design decision requiring author
ratification — so it is filed as a plain raw draft rather than born-parked; a
future `/align-tactics tactic-fleet-watch-unknown-never-resolves` round can
plan and land it directly.

`test-dispatch-fleet-watch.sh` will need two changes to stay accurate against
the new behavior:

- Case 1 ("all five clear -> exit 0, five --resolve calls, zero finding
  calls", currently at lines 219-226) asserts `grep -c -- '--resolve'` equals
  exactly 5 on an all-clear pass. Once the fix lands, an all-clear pass also
  resolves `watch-unknown` (nothing was open, so it is a safe no-op call) —
  the count becomes 6, and the case should gain an explicit
  `assert_eq ... 1 "$(grep -c -- '--resolve --kind watch-unknown' <<<"$ALARMS")"`
  alongside the updated total.
- A new two-pass case, modeled on case 6/6b (busy-stall raise then clear,
  lines 306-320) and the `--resolve --kind unclaimed-hold` assertion idiom
  from case 19 (line 534): pass 1 with an unreadable input (e.g. the decision
  log missing, as in case 10) to raise `watch-unknown`, then pass 2 with every
  input readable to assert exactly one
  `--resolve --kind watch-unknown` call and no further `--kind watch-unknown
  --statement` (raise) call.

## Verification

```verify
bash .claude/skills/dispatch-propagate/scripts/test-dispatch-fleet-watch.sh
```

- Case 1 (all-clear pass) shows `watch-unknown` resolved alongside the five
  named predicates.
- The new two-pass case shows `watch-unknown` raised on pass 1 (an unreadable
  input present) and resolved — not raised again — on pass 2 (every input
  readable), with zero `--kind watch-unknown --statement` (raise) calls on
  pass 2.
- Every existing case in the suite still passes unmodified, in particular the
  cases that assert `watch-unknown` fires while some other input stays
  unreadable (cases 4, 5, 7, 10, 11, 13, 15, 21, 24) — the fix only adds a
  resolve on the `UNKNOWN_COUNT == 0` branch, it never changes the raise
  branch.
