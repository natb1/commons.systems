---
id: tactic-fleet-watch-busy-stall-pace-blind
kind: tactic
statement: "dispatch-fleet-watch's busy-stall predicate cannot distinguish a
  self-imposed pace-curve pause (target_n: 0, exhausted: ok) from a genuine
  stall, so a healthy paced fleet fires the same alarm as a broken one"
owner: ai
status: raw
parent: null
rationale: "Discovered 2026-08-05 during an /align-tactics
  tactic-fleet-alarm-busy-stall tactic-mode session (both by that Workflow
  round's drift-review agent independently and confirmed by this caller
  session). Not auto-created by dispatch-fleet-alarm -- a session-authored
  finding, landed as its own tracked node per this repo's sole-tracker-recording
  convention (real defects land as a tactic, never left in a transcript;
  precedent: tactic-fleet-alarm-node-park-clobber-loop, filed the same way from
  a sibling tactic-fleet-alarm-* session on 2026-08-04). Distinct from
  tactic-fleet-alarm-node-park-clobber-loop: that node tracks the router wrongly
  emitting tactic-fleet-alarm-<kind> nodes as /align-tactics candidates at all,
  and the mint writer clobbering any park landed on one -- a
  routing/selectability defect. This node tracks a different defect in the ALARM
  CONDITION ITSELF: predicate 3 in dispatch-fleet-watch (the 'sustained BUSY=0'
  check, .claude/skills/dispatch-propagate/scripts/dispatch-fleet-watch:411-503)
  fires purely on `claude_agents_count_busy_workers` staying 0 past
  DISPATCH_FLEET_WATCH_IDLE_LIMIT (2700s), with zero awareness of
  dispatch-target-workers -- `grep -c dispatch-target-workers
  .claude/skills/dispatch-propagate/scripts/dispatch-fleet-watch` returns 0.
  dispatch-target-workers computes the worker target from a weekly
  cumulative-pace curve used as a binary gate (whether to spend at all) plus a
  5h ramp; the weekly gate legitimately drives target_n to 0 and pauses spawns
  on purpose whenever usage runs ahead of the curve, discriminated from genuine
  exhaustion via `dispatch-target-workers --exhausted` (ok=pacing, exhausted=out
  of tokens) and `--reopen-at` (epoch the target next returns to >=1). Verified
  live in the triggering session at 2026-08-05 02:25 EDT:
  `dispatch-target-workers` printed 0, `--exhausted` printed `ok`, `--reopen-at`
  printed 1786079040 (2026-08-07 01:04 EDT) -- a textbook pace pause, yet
  dispatch-fleet-watch's busy-stall predicate has no way to see that and will
  fire `finding` once BUSY_SPAN exceeds IDLE_LIMIT regardless. `git log
  --oneline -- intentions/tactic-fleet-alarm-busy-stall.md` shows 4 mint/resolve
  pairs to date (7d326e4e/de52fd8e, 014f7c7b/2bc95970, 8e7ac6d9/a44e628b,
  3c0c3e78/<pending>), every resolve a one-line phase:null->phase:done hand-edit
  with no recorded investigation -- consistent with, though not conclusive proof
  of, repeated pace-pause false positives each requiring a human to manually
  rule out pacing."
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
# dispatch-fleet-watch's busy-stall predicate cannot distinguish a self-imposed pace-curve pause (target_n: 0, exhausted: ok) from a genuine stall, so a healthy paced fleet fires the same alarm as a broken one

## Context

Filed from an `/align-tactics tactic-fleet-alarm-busy-stall` tactic-mode session on 2026-08-05. That session's Workflow round could not finalize or plan the fleet-alarm node itself — `tactic-fleet-alarm-<kind>` nodes are mechanically minted/resolved instrument records (see `tactic-fleet-alarm-node-park-clobber-loop`) whose only legitimate terminal is `dispatch-fleet-alarm --resolve`, so the triggering session declined that node with zero graph writes. While investigating whether the live busy-stall reading was a genuine stall, the session found the predicate that raises this alarm has no pace-awareness at all, confirmed the live reading was in fact a pace pause, and is recording that as its own defect here rather than leaving it in the transcript.

## Reason

`dispatch-fleet-watch`'s predicate 3 (`--- 3. sustained BUSY=0 ---`, lines 411-503) tracks how long `claude_agents_count_busy_workers` has read 0 via the `busy_zero_since` state-file stamp, and fires `finding` once that span exceeds `DISPATCH_FLEET_WATCH_IDLE_LIMIT` (2700s). Nowhere in that predicate — nor anywhere else in the script (`grep -c dispatch-target-workers dispatch-fleet-watch` → 0) — is `dispatch-target-workers` consulted. That script is the fleet's own pace-curve gate: a weekly cumulative-usage curve that legitimately drives the worker target to 0 and pauses new spawns on purpose, independent of `max_concurrent_workers` and independent of genuine token exhaustion. `dispatch-select-tick` (lines 655-674) and `graph-select-target` (line 279) already know how to tell the two apart: `dispatch-target-workers --exhausted` prints `ok` when it's the smoothing curve pacing on purpose and `exhausted` only when tokens are genuinely gone, and `--reopen-at` prints the epoch the target returns to >= 1. `dispatch-fleet-watch` uses none of this, so a fleet that is correctly and intentionally idle under pacing looks identical, to this predicate, to a fleet whose workers are stuck or whose daemon died.

Live confirmation, captured during the triggering session at 2026-08-05 02:25 EDT: `dispatch-target-workers` → `0`, `--exhausted` → `ok`, `--reopen-at` → `1786079040` (2026-08-07 01:04 EDT). That is exactly the self-imposed-pause shape, not a stall — yet the predicate had no way to short-circuit on it. `tactic-fleet-alarm-busy-stall`'s git history (4 mint/resolve pairs so far, every resolve a bare `phase: null` → `phase: done` hand-edit with no investigation recorded in the node body) is consistent with this same false-positive recurring silently, though it isn't independently conclusive proof for the earlier occurrences.

## How to resolve

Add the same `EXHAUSTED=$("$SCRIPT_DIR/dispatch-target-workers" --exhausted 2>/dev/null) || EXHAUSTED="ok"` idiom already established at `dispatch-select-tick:655-674` and `graph-select-target:279` to `dispatch-fleet-watch`'s predicate 3, and when `EXHAUSTED=ok` **and** the live `dispatch-target-workers` reading is `0`, take the `quiet` verdict path the predicate already uses for its own pause case (lines 107-121, 427-439) instead of accumulating toward `finding` — keeping the volatile `--reopen-at` epoch out of `B_BUSY`'s alarm text (it changes every tick and would make the alarm body non-deterministic). This is scoped, mechanical work — not a design decision requiring author ratification — so it is filed as a plain raw draft rather than born-parked; a future `/align-tactics tactic-fleet-watch-busy-stall-pace-blind` round can plan and land it directly.

## Verification

- A live pass with `dispatch-target-workers` reading `0` and `--exhausted: ok` reports `quiet` (or the existing pause-style non-alarming verdict), not `finding`, regardless of `busy_zero_since` span.
- A live pass with `dispatch-target-workers --exhausted: exhausted`, or with busy workers genuinely stuck despite a nonzero target, still reports `finding` once past `DISPATCH_FLEET_WATCH_IDLE_LIMIT` — the pace-awareness only suppresses the *paced* case, it does not blind the predicate to a real stall.
- `test-dispatch-fleet-watch.sh` gains a case covering both branches.

## New evidence, 2026-08-09 — this is load-bearing, not cosmetic

The diagnosis above is unchanged and not revisited. What follows is added
severity evidence measured during a ~71-hour fleet outage (2026-08-06 11:08 EDT
through 2026-08-09; commits/day went 168 → 219 → 207 → 20 → 0 → 0 → 0).

**1. The false positive is not merely noisy — it drives a failing write loop.**
Each pass on which busy-stall reads `finding` calls `dispatch-fleet-alarm` to
*mint* `tactic-fleet-alarm-busy-stall`, and each pass that clears calls it to
*resolve*. During the outage the main checkout was left dirty and one commit
ahead (see below), so every one of those writes failed:

```
error: graph-commit: the resolved repo (/home/n8/natb1/commons.systems) holds
intentions/tactic-fleet-alarm-busy-stall.md content differing from origin/main
but has nothing staged to commit ... refusing to emit a false 'landed'
dispatch-fleet-alarm: graph-commit failed after 3 attempt(s)
dispatch-fleet-alarm: minting tactic-fleet-alarm-busy-stall failed; the write was rolled back
```

Three failed `graph-commit` attempts per pass, every ~2 minutes, for three days.
The mint/resolve churn this predicate generates is therefore a continuous write
load against `origin/main`, not a once-per-incident annotation — which is what
turns a cosmetic false positive into a load-bearing one.

**2. Its known-false status is why a real defect went undetected for 71 hours.**
The actual fleet-stalling defect was a background session in `state: blocked`
holding the main checkout dirty (filed as
tactic-blocked-session-invisible-to-census). The only probe that fired during
the entire outage was this one:

```
busy-stall:           finding  0 busy workers for 257700s (limit 2700s)
result: finding (1)
note: at least one dispatch-fleet-alarm graph write FAILED this pass
```

Because `busy-stall: finding` was correctly recognized as this node's known
false positive — the pace curve *was* closed, `target_n: 0`, `--exhausted: ok`
— the whole pass was discounted, and the `note:` line directly beneath it went
unread for three days. A genuine defect hid inside the blind spot of an alarm
already written off as noise.

This is the standing cost of a chronically-firing false positive: it does not
just waste a reader's attention, it trains the reader to skip the surface the
real signal arrives on.

**3. The 2026-08-05 reading reproduced exactly.** Measured 2026-08-09 10:51 EDT:
`dispatch-target-workers` → `0`, `--exhausted` → `ok`, `--reopen-at` →
`1786307400` (2026-08-09 16:30 EDT), with `busy-stall` reporting `finding` at a
257700s span. Same shape as the original capture, four days later — the
predicate has no pace-awareness and the false positive recurs on every pace
pause, as diagnosed.

**Consequence for the "How to resolve" section above: none.** The fix direction
is unchanged and still correct. What changes is the priority argument for
scheduling it, and one addition to the verification list:

- A pass that is suppressed to `quiet` by pace-awareness must make **no**
  `dispatch-fleet-alarm` mint or resolve call at all — suppressing the verdict
  while still churning the graph write would leave the write loop in place.
