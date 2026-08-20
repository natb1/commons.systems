---
id: tactic-rsi-research-skill
kind: tactic
statement: Build the /rsi-research skill and its weekly harness-cron schedule —
  the scheduled /deep-research sensor lane of the rsi strategy
owner: ai
status: raw
parent: null
rationale: "Surfaced in the 2026-08-10 /align research-lane round on
  strategy-recursive-self-improvement; the skill is the lane's primary artifact.
  (Amended 2026-08-11 dry-run round: a full research cycle was executed on the
  real path before build, finding the 2026-08-10 entry-mechanism spec
  unbuildable in three independently silent ways — see the Spec corrections
  section in the body, which supersedes the bullets it names and records the
  measured per-cycle cost baseline. The same round records the author directive
  that every tactic this lane drafts without author intervention carries a
  mandatory qa-main validation against its cited reference's claimed effect.)"
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
- **Run:** *(entry mechanism superseded — see C1/C2 under "Spec corrections
  (2026-08-11 dry-run round)" below; the targeting described here still
  holds.)* `/deep-research` over the seed texts recorded on
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
     judgment step — each carrying the mandatory qa-main validation
     requirement of the 2026-08-11 author directive below;
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

## Spec corrections (2026-08-11 dry-run round)

A dry run executed one full cycle on the real path before any of this skill
was built. It found the 2026-08-10 spec unbuildable in three independent
ways, **each of which fails silently** — a weekly cron built to the original
spec would exit 0 and produce nothing while looking healthy. These
corrections supersede the bullets they name.

- **C1 — `/deep-research` is not model-invocable.** It is a harness built-in
  marked `disable-model-invocation` (no repo-local definition exists, so the
  gate cannot be relaxed here); invoking it from inside a session is refused
  outright. A skill body therefore **cannot** call it. Verified working
  alternative: a headless session whose *initial user message* is the slash
  command — `claude -p "/deep-research <question>"` — which counts as a user
  invocation. **The lane's shape inverts:** `/rsi-research` is not a skill
  that runs `/deep-research`; it is (a) a cron-composed prompt template that
  builds the research question from `tradition-agentic-engineering`'s
  `attributes.texts` plus the fit-function targeting, and (b) a
  post-processing pass that turns the returned report into the four inert
  writes. Supersedes the "Run" bullet's entry mechanism.
- **C2 — the headless background-wait ceiling silently truncates the run.**
  `/deep-research` does its work in a background workflow, and `claude -p`
  terminates that workflow after 600s by default
  (`Background tasks still running after 600s; terminating.`), exiting 0 with
  no report. Backgrounding the shell command does not help — the kill comes
  from inside the headless session. The cycle needs
  `CLAUDE_CODE_PRINT_BG_WAIT_CEILING_MS=0`, set in a **wrapper script**, not
  as an inline `VAR=value` prefix (`.claude/rules/sandbox.md` — inline
  prefixes break `allowedTools` prefix matching). Cost of learning this: one
  destroyed run, 78 subagents and ~202k output tokens for zero deliverable.
- **C3 — permissions must be pre-granted, and narrowly.** A headless run has
  no approver, so any unapproved tool call hangs indefinitely. The obvious
  fix is a trap: `--dangerously-skip-permissions` would hand the unattended
  weekly run full write access, **violating the sensor-only condition** on
  `strategy-recursive-self-improvement`. Grant an explicit narrow allowlist
  (web fetch/search and read for the research pass; the graph-write tools
  only for the post-processing pass).
- **C4 — redirect stdin** (`< /dev/null`): without it the run stalls 3s
  waiting on stdin it will never get.
- **C5 — the spend condition is unenforceable as recorded.** The cycle's real
  cost lives in nested `subagents/workflows/wf_*/agent-*.jsonl` under an
  anonymous headless session id, with no node id anywhere, while
  `dispatch-token-audit` attributes by node/phase. The lane must stamp its
  session with an attributable marker, or the recorded "spend stays small
  relative to dispatch" condition cannot be read at all.
- **C6 — fetch arXiv at `/abs/` or an HTML mirror, never `/pdf/`.** PDF
  fetches degraded to structural guesses, losing exactly the measured numbers
  the lane exists to collect.
- **C7 — split the single prompt into two bounded passes.** In the dry run
  the ratified seed list did little steering work: naming all nine seeds
  still produced a report whose load-bearing findings came mostly from
  sources outside the list. As specified, one prompt does both seed-crawling
  and frontier expansion, so the design cannot tell whether the recursive
  frontier rule is working or the ratification is decorative. Run a bounded
  **seed crawl** over `attributes.texts`, then a separate **frontier
  expansion** whose output is marked candidate-only.

**Measured baseline for one cycle** (record against the spend condition):
108 subagents / 1,261 turns, all `claude-sonnet-5`; 25 sources fetched, 110
claims extracted, 25 adversarially verified (17 confirmed, 8 killed); ~364k
output + ~44.7M cache-read + ~7.6M cache-write tokens; ~13 minutes wall
clock. The 32% kill rate is itself worth recording each cycle as a quality
sensor — the verification pass is doing real work, not decoration.

## Draft-tactic validation requirement (2026-08-11 author directive)

Every tactic this lane drafts **without author intervention** carries a
mandatory qa-main validation: the change must be checked, on main, for
whether it actually produces the effect its source described. This is not
ordinary post-merge QA — it is the acceptance test of an imported claim.

- **Each lane-drafted tactic must cite its reference** (the specific finding
  and source that motivated it) and **state that reference's claimed effect
  in terms observable in this harness** — a metric the existing sensors
  already read (token spend under `dispatch-token-audit`, closure velocity,
  the strategy's own `success_signal` thresholds).
- **qa-main validates against that stated effect**, not merely that the
  change works. A change that lands cleanly but does not produce the claimed
  effect is a **refuted hypothesis**: the finding is recorded as
  not-reproduced against this harness, and the tactic does not count as
  validating the strategy.
- **A finding whose claimed effect cannot be stated observably is not
  draftable as a tactic at all.** It goes to a born-parked candidate
  curriculum chunk for an author sitting instead. This keeps unfalsifiable
  imports out of the execution path.

**Why this is load-bearing, not ceremony:** the dry run's strongest and
best-corroborated finding was that self-authored verification is unreliable —
across 35 self-improvement runs every run self-reported a passing score while
43% actually scored below random baseline, and the paper's conclusion was
that reliable continual self-improvement requires at least one acceptance
signal outside the agent's own control. A lane that drafts tactics from
external findings and then judges its own output has exactly that failure
shape. qa-main is the outside signal this harness already owns, and routing
lane-drafted tactics through it is the operational form of the endogenous
primacy recorded on the strategy: the external finding enters as a
hypothesis, and this harness's own telemetry is what accepts or refutes it.