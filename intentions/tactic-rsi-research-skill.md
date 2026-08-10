---
id: tactic-rsi-research-skill
kind: tactic
statement: Build the /rsi-research skill and its weekly harness-cron schedule —
  the scheduled /deep-research sensor lane of the rsi strategy
owner: ai
status: raw
parent: null
rationale: Surfaced in the 2026-08-10 /align research-lane round on
  strategy-recursive-self-improvement; the skill is the lane's primary artifact.
reading: null
serves:
  - strategy-recursive-self-improvement
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
# Build the /rsi-research skill and its weekly harness-cron schedule — the scheduled /deep-research sensor lane of the rsi strategy
## Draft context (2026-08-10 /align research-lane round)

Skill spec, from the recorded interview resolutions (the authoritative record
is the 2026-08-10 research-lane clarifications and conditions on
`strategy-recursive-self-improvement`):

- **Trigger:** weekly harness-cron job (CronCreate/routine) invoking
  `/rsi-research`; runs independent of the dispatch pause state (output is
  inert; research continuing while dispatch is paused is the bootstrap case
  rsi exists for).
- **Serialization:** claim the `strategy-recursive-self-improvement` worktree
  at invocation (worktree-as-claim, the router's liveness rule); fail closed
  with a printed error when a live `/rsi` or prior research run holds it.
- **Run:** `/deep-research` over the seed texts recorded on
  `tradition-agentic-engineering` (`attributes.texts` is the author-ratified
  crawl set), targeted at opportunities to optimize the rsi fit function
  (value per token: closure velocity + signal progress, per-workflow
  attribution — strategy fitness-function clarification).
- **Writes — inert output only, one `graph-commit`:**
  1. a dated reading on `strategy-recursive-self-improvement`
     (research-cycle landing; rendered into rsi-plan.md by
     render-rsi-plan.ts);
  2. born-parked candidate curriculum chunks for reading-worthy sources —
     the `grounding-research` step-3 convention (`parent:
     tactic-tradition-reading-program`, `attributes.curriculum` with
     appended priority, passages+questions only, never a summary);
  3. draft tactics (no phase) for concrete fit-function opportunities,
     `serves: [strategy-recursive-self-improvement]`, consumed by `/rsi`'s
     judgment step;
  4. candidate seeds named in the reading as candidates — promoted to the
     tradition's `texts` only by author ratification, never by this skill.
- **Prohibitions:** never writes grounding marks, never edits
  `tradition-agentic-engineering` or any graph doctrine, never executes
  work, never runs `gh`. Endogenous primacy holds: findings are framed as
  hypotheses to test against own telemetry (dispatch-token-audit, readings),
  never directives.
- **Unread-pool guard:** the run reports the count of prior research-produced
  born-parked items still unreviewed; accumulation across cycles without a
  sitting is flagged in the reading as a review trigger (strategy condition).
- **Spend:** lane token spend stays small relative to dispatch under the
  existing per-workflow attribution; approaching dispatch is a review
  trigger.