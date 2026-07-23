---
id: tactic-voice-channel-review
kind: tactic
statement: Voice-channel inventory at office-hours — record each
  high-cost-of-exit delegation's voice channel on its record and produce
  strategy-exercise-voice's first reading
owner: human
status: delegated
parent: null
rationale: "The human half of the round: which forum, tracker, or standards body
  actually hears this author's individual-scale voice — and whether it has been
  exercised — is owner knowledge, not derivable from the repo. The strategy's
  guard (voice as customer and contributor, never partisan) is an author
  judgment per channel. Runs after tactic-voice-ledger-instrument lands the
  report script; completing this tactic completes the round (it writes the
  strategy's first reading)."
reading: null
gap: null
serves:
  - strategy-exercise-voice
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: null
execution:
  branch: tactic-voice-channel-review
  pr: null
  attempts: {}
  markers: []
  strategy_fingerprint: 2397a8d33f1a2436082a42ba5fab357c27c37b70b5652d944a25aae0a26cc448
validates:
  - strategy-exercise-voice
blocked_by:
  - tactic-voice-ledger-instrument
office_hours:
  reason: "Born-parked human tactic: the voice-channel inventory needs the author.
    Identifying where each high-cost-of-exit delegatee actually hears
    individual-scale voice, and whether this author has exercised it, is owner
    knowledge; the customer/contributor-never-partisan guard is an author
    judgment per channel. Not claude-decidable."
  since: 2026-07-11
  recommendation: "At office-hours, once tactic-voice-ledger-instrument has
    landed: run `npx tsx packages/intentionsutil/scripts/voice-review.ts`; for
    each reported record set attributes.voice {channel, last_exercised} through
    write-node.ts (channel null plus an audit-narrative note where no
    individual-scale channel exists — that is reading content, not a blocker);
    then write strategy-exercise-voice's first reading (coverage found) and gap
    (records missing a live exercised channel), and stamp rounds {count: 1,
    last_completed: <date>} — this tactic is the round's final tactic. ~25-30
    author-minutes for the current 11-record set."
pace_exempt: false
rounds: null
attributes: {}
---
# Voice-channel inventory at office-hours — record each high-cost-of-exit delegation's voice channel on its record and produce strategy-exercise-voice's first reading

Born-parked human tactic (align-tactics Step 4 shape): no implement-phase
plan — the work is the author's, at office-hours, after
tactic-voice-ledger-instrument lands (this tactic is blocked_by it).

## What to do (~25-30 author-minutes)

1. Run `npx tsx packages/intentionsutil/scripts/voice-review.ts`. It lists
   the mechanically-computed high-cost-of-exit delegation set (11 records as
   of 2026-07-11) with each record's voice state.
2. Per qualifying record, set `attributes.voice
   {channel, last_exercised}` through write-node.ts (dump via dump-node.ts,
   edit the JSON, rewrite): `channel` is where individual-scale voice
   actually lands with that delegatee — a feedback tracker, forum, upstream
   repo, standards body. Where none exists, record `channel: null` and note
   it in the record's audit narrative — the strategy's own condition says
   voice is inert where a delegatee only hears organized blocs; record that
   honestly, do not force a channel.
3. Write strategy-exercise-voice's first `reading` (a string: the coverage
   found — how many qualifying records show a live, exercised channel) and
   `gap` (the records missing one; null only if the threshold is fully met).
4. This is the round's final tactic: in the same session stamp the strategy's
   `rounds: {count: 1, last_completed: <date>}` (bootstrap: by hand, per
   tactic-graph-native-dispatch §1.1) and set this tactic's `phase: done`.

## Why human

Which forum actually hears individual-scale voice, and whether this author
has exercised it, is owner knowledge, not derivable from the repo. And the
strategy's guard — voice as customer and contributor, never partisan — is an
author judgment applied per channel; misjudging it inverts the strategy into
the advocacy it exists to avoid.
