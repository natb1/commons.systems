---
id: tactic-outcome-envelope-qa-accounting
kind: tactic
statement: "draft: qa fixes_applied accounting — delegated implement-unit fixes
  never land in the outcome envelope, so qa hit_rate reads 0 structurally and
  falsely promotes qa to Opus"
owner: ai
status: raw
parent: null
rationale: Draft retained from the 2026-07-04 strategy-token-economy interview
  (retain, not refine). Grounds the strategy's metric-integrity condition and
  clarification 3.
reading: null
gap: null
serves:
  - strategy-token-economy
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
attributes: {}
---
# draft: qa fixes_applied accounting — delegated implement-unit fixes never land in the outcome envelope, so qa hit_rate reads 0 structurally and falsely promotes qa to Opus

Notes retained from the interview session:

- Mechanism: `fixes_applied > 0` is emitted only on qa-fix's
  `completed_with_fixes` finalize path (`.claude/skills/qa-fix/SKILL.md`
  ~911–925); qa fixes authored through `/implement-unit` subagents are never
  recorded back. Escalation paths (`needs-main`, `needs-human`,
  `fix-pass-landed-nothing`) all record `fixes_applied = 0` by design.
- Measured 2026-06-26→07-03: qa surfaced 108 findings, 93 actionable, filed
  68 follow-ups, recorded 0 in-envelope fixes across 84 sessions → pooled
  `hit_rate = 0`, below the `HIT_RATE_FLOOR = 0.5` in
  `generate-phase-model-policy.sh` → the live
  `dispatch.config/phase-model-policy.json` promotes qa to `claude-opus-4-8`.
  The metric conflates "phase escalates most residue by design" with "cheap
  model underperformed".
- Review's promotion (hit_rate 0.180 over 76 sessions) is also suspect for a
  softer reason: review is an orchestrator that delegates fix-authoring to
  Opus subagents, so whether its own chain needs Opus is unexamined; the 0.5
  floor has no model of delegated fix lanes.
- Options sketched: record subagent-applied fixes into the envelope; or route
  qa on a metric its lane can move (e.g. actionability, follow-up validity);
  or exclude phases with delegated fix lanes from hit_rate routing.
- Related static gap: the generator and consumer both hardcode the
  `{qa, review}` demotable allowlist; fix-checks / fix-conflicts / main-qa
  get the Sonnet default but no measurement can ever move them.
- Field definitions: `.claude/docs/outcome-envelope.md`.
