---
id: tactic-noncodegen-session-model-defaults
kind: tactic
statement: "draft: Sonnet-by-default initialization for non-codegen sessions —
  aux background jobs plus the qa-main and file-issue lanes"
owner: ai
status: raw
parent: null
rationale: Draft retained from the 2026-07-04 strategy-token-economy interview
  (retain, not refine). Implements the initialization-defaults half of the
  strategy's clarification 4.
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
# draft: Sonnet-by-default initialization for non-codegen sessions — aux background jobs plus the qa-main and file-issue lanes

Notes retained from the interview session:

- Measured 2026-06-26→07-03: the unattributed `<none>`+Opus row was $3,600
  proxy / ~$1,200 real for the week, dominated by sessions that never enter a
  codegen skill.
- Aux background jobs that author no code — `dispatch-diagnose-main`,
  `dispatch-jit-reminder`, `qa-main` verification, digest — can launch with
  `--model sonnet` at session start instead of inheriting Opus.
- Highest-confidence phase demotions from the audit: `qa-main` (browser
  verification against deployed prod) and `file-issue`
  (classification/dedup) — together ~$285/wk real at Opus rates, ~$170/wk at
  Sonnet. On the prepaid plan this is allowance headroom, not a bill cut.
- `file-issue` is being superseded by the align skill family
  (strategy-graph-native-dispatch), so its half of the requirement transfers
  to align-session routing: interview/decomposition on Opus, Explore fan-out
  on Sonnet or Haiku (routing-parity clarification on
  strategy-graph-native-dispatch).
- Existing plumbing to reuse: `dispatch-phase-model` /
  `dispatch-phase-effort` consumption in `dispatch-launch-worker` and
  `dispatch-spawn-job`; the `force-opus.json` global override remains the
  kill-switch.
- Subagent corollary: Fable-priced interactive parents bill at 67% of proxy
  (vs Opus 33%, Sonnet 20%, Haiku 7% in the window) — fan-out from expensive
  parents should pass `model: sonnet` (or `haiku` for pure search); the
  plan-issue+Haiku row proves the plumbing works.
