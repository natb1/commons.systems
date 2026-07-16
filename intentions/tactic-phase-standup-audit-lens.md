---
id: tactic-phase-standup-audit-lens
kind: tactic
statement: Per-phase standup-cost audit lens — join SKILL-body tokens and boot
  tool-round-trips into one /dispatch-token-audit measurement, split scriptable
  vs judgment
owner: ai
status: raw
parent: null
rationale: "Measure-first gate for the standup-cost lever
  (strategy-token-economy clarification 12). No existing token-audit lens joins
  the two facets of a phase orchestrator's fixed standup cost: lens 9
  (baseline_context) measures the prose/prompt footprint, and lens 2 (simple
  sequencing) captures the boot tool-round-trips only as generic n-grams. This
  lens isolates, per phase, the SKILL.md-body token contribution plus the
  opening tool-round-trip preamble, and flags which preamble steps are
  mechanically scriptable versus judgment — so any body thinning or boot offload
  is measured before/after rather than guessed."
reading: null
gap: null
serves:
  - strategy-token-economy
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention:
  boost: 15
  override: null
  rationale: "Author-directed 2026-07-16: top-rank the three token-economy
    standup-cost tactics above the working frontier (below the main-health
    sentinel at 100, which the write-path guard reserves).
    strategy-token-economy carries no strategy-level boost, so the tactic
    carries the full weight itself; boost 15 clears the current working max
    (~14.5)."
phase: null
execution: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Per-phase standup-cost audit lens — join SKILL-body tokens and boot tool-round-trips into one /dispatch-token-audit measurement, split scriptable vs judgment

Surfaced in the /align-strategy standup-cost round ([[strategy-token-economy]]
clarification 12, 2026-07-16 interview). This is the **measure-first gate**:
[[tactic-thin-oversized-skill-bodies]] and [[tactic-phase-boot-offload-launcher]]
are gated on this lens's per-phase findings, so it decomposes and lands first.

Extends `.claude/skills/dispatch-token-audit` — join lens 2 (`tool_sequences`,
the boot tool-round-trip preamble, currently only generic n-grams; it cites the
"4–8 gh/git calls per phase" of #1426) with lens 9 (`baseline_context`, the
prose/prompt footprint), reported per phase, and split each opening step
scriptable vs judgment (grounding: qa-fix ~6–7 boot round-trips vs review-fix
~3–4; boot judgment content is near-zero).
