---
id: tactic-audio-position-persist
kind: tactic
statement: "audio player: cancel the position-persist throttle on track
  change/stop, and stop (not restart from 0) when the playing last-in-queue
  track is removed"
owner: ai
status: codified
parent: null
rationale: "Surfaced by the 2026-07-05 review. The timeupdate position-persist
  throttle is never cancelled on track change or stop, so a timer armed while
  track A played fires later and persists A's currentTime against now-current
  track B (next session restores B to A's position); removing the playing
  last-in-queue track wraps to index 0 and force-plays track A from 0:00. Serves
  strategy-recover-attention: the owned audio player must persist and resume
  correctly."
reading: null
gap: null
serves:
  - strategy-recover-attention
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
# audio player: throttle cancellation + safe track removal

## Context

Two verified defects (2026-07-05) in the owned audio player's playback-state
handling.

## Unit 1 — cancel the position-persist throttle on track change/stop

**Recommended model:** sonnet

Scope:
- `audio/src/player.ts:69-75` (with `:107-114`): the `timeupdate`
  position-persist throttle is never cancelled on track change or `stop()`,
  so a timer armed while track A played fires later and persists A's
  `currentTime` against now-current track B; next session restores B to A's
  position. Cancel the pending timer on track change and stop.

## Unit 2 — stop, not restart, when removing the playing last track

**Recommended model:** sonnet

Scope:
- `audio/src/player.ts:264-265`: removing the currently-playing
  last-in-queue track wraps to index 0 and force-plays track A from 0:00
  (`idx < queue.length ? idx : 0`). Stop playback instead.

## Verification

- Switch tracks then close the tab quickly; next session resumes the correct
  track at its own position. Uncheck the playing last track; playback stops
  rather than restarting track A.
