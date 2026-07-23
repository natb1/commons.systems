---
id: tactic-strategy-fingerprint-stamp-shape
kind: tactic
statement: strategy_fingerprint stamps written in the flat {hash,sha} form
  silently disable the scope-freeze gate
owner: ai
status: raw
parent: null
rationale: "Found 2026-07-23 during the wezterm-pin /align-strategy round, while
  classifying open children for the materiality-scoped freeze. schema.ts:349
  documents execution.strategy_fingerprint as a per-strategy map {<strategy-id>:
  {hash, sha}}, and isFingerprintStale (transitions.ts:365-374) returns FALSE
  when the strategy id key is absent from the object. Two open tactics —
  tactic-node-toolchain-single-source and tactic-practitioner-support-boundary,
  both stamped 2026-07-22 — instead carry a flat {hash, sha} object with no
  strategy-id key, so they can never go stale for any strategy and the freeze
  gate is inert on them. Fail-open, and invisible to a grep over the field name.
  Likely source: .claude/skills/align-strategy/SKILL.md's re-stamp instruction,
  whose literal text reads {hash: strategyFingerprint(strategy), sha: <sha>}
  without the enclosing strategy-id key — so following the skill as written
  reproduces the bug. Census at find time: 2 flat, 4 correctly keyed, 31 legacy
  bare strings (which DO compare, per transitions.ts:371), 21 null."
reading: null
gap: null
serves:
  - strategy-graph-self-description
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
# strategy_fingerprint stamps written in the flat {hash,sha} form silently disable the scope-freeze gate
