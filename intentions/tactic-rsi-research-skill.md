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
clarifications:
  - question: Is the 'Serialization' bullet in the 2026-08-10 draft context still a
      requirement?
    answer: "(Recorded 2026-08-20 /align-tactics per-node round.) No — it is
      SUPERSEDED and must not be built. The bullet says to claim the
      strategy-recursive-self-improvement worktree at invocation and fail closed
      with a printed error when a live /rsi or prior research run holds it.
      strategy-recursive-self-improvement's research-lane cron condition retired
      that clause in the 2026-08-12 collapse round: it named a serialization
      primitive (rsi-claim) and a competitor (the attended /rsi loop) that the
      same round retired, so neither end of the mutual exclusion still exists.
      Nothing the lane writes is single-writer any more — the inert writes land
      through write-node.ts plus one graph-commit, whose own per-checkout mutex
      is the only serialization required. The flock and worktree-occupancy reuse
      candidates this round's gather pass surfaced
      (dispatch-code-review:1089-1127 for the setsid + `flock -w 1 -E 111`
      launch, lib-claude-agents.sh:1070-1082 for the lock-sidecar path
      derivation, lib-claude-agents.sh:1166-1169 for folding a held lock into
      the live verdict) solve a requirement this strategy no longer has; they
      are recorded here as DECLINED rather than overlooked, so a later pass does
      not re-derive them from the stale bullet."
  - question: What carries the weekly schedule, given the draft context names
      'CronCreate/routine'?
    answer: "(Recorded 2026-08-20 /align-tactics per-node round.) Not CronCreate.
      'weekly harness-cron job (CronCreate/routine)' names a mechanism that
      cannot carry a durable weekly schedule: a CronCreate job lives only in the
      inviting Claude session's memory, dies with that session, and auto-expires
      after 7 days regardless of session lifetime. The durable carrier this repo
      already uses for every recurring dispatch job is a systemd --user timer
      installed by an ensure_*_units() function in
      .claude/skills/dispatch-propagate/scripts/lib.sh. ensure_heartbeat_units()
      (lib.sh:3932-4129) is the closest template because it is the only
      installer using OnCalendar= with Persistent=true — wall-clock scheduling
      that catches up a fire missed while the host was down — rather than the
      monotonic OnBootSec/OnUnitActiveSec the other three use; swapping its
      OnCalendar=*:0/15 for a weekly expression is close to the whole change.
      The installer owes the house idioms its siblings share:
      strip_unit_env_path() (lib.sh:2891) before interpolating PATH, a
      cleanup_stale_unit_pair() wrapper (lib.sh:3033) for a moved checkout,
      unit_manually_disabled() and unit_disable_skip_notice() (lib.sh:3076, 3117
      — the trailing phrase 'skipping enable --now' is load-bearing, an operator
      procedure greps for it) before any enable --now, ensure_recover_unit()
      (lib.sh:2905) so the new unit chains to the shared
      OnFailure=dispatch-tick-recover.service target, wiring into the reseed
      call stack in the fixed idiom at dispatch-schedule-reseed:402-422 with a
      `|| true` suffix, and a test section following the stub-systemctl fixture
      shape in test-lib-systemd-units.sh. This clarification records the
      mechanism substitution only; it does not decide whether the lane is
      built."
  - question: The draft context names rsi-plan.md, render-rsi-plan.ts and
      dispatch-token-audit. Are those live?
    answer: "(Recorded 2026-08-20 /align-tactics per-node round.) No — read all
      three as HISTORICAL, and do not rewrite the dated draft prose that names
      them. PR 3074 (merge c3c229f0de63db09df7dc01ce02177f3d1b56c95) deleted
      rsi-plan.md and render-rsi-plan.ts with tactic-rsi-plan-render-retire, and
      /dispatch-token-audit became /rsi-audit; all three verified absent from
      this worktree on 2026-08-20. Leaving the names in place follows
      strategy-recursive-self-improvement's 2026-08-13 clarification on why
      about 25 node bodies still carry old names: tacticScopeFingerprint hashes
      {statement, body}, so rewriting them churns scope fingerprints and can
      mis-park live sessions through transition-node's scope gate. Live
      successors for what this lane needs to read: the per-workflow spend fold
      comes from .claude/skills/rsi-audit/scripts/aggregate-usage.sh, at node
      scope via --node, which matches the <stem>.dispatch-stamp.json sidecar
      written by the SessionStart hook (.claude/hooks/stamp-dispatch-session.sh
      -> dispatch-stamp-session; note that hook's own header flags it has not
      been proven against a headless non---bg launch, and names an explicit
      dispatch-stamp-session call at the top of the run as the documented
      fallback); the strategy's `reading` field is produced by read-sensors.ts's
      registered rsiSensor. Where the lane's OWN dated reading lands is NOT
      settled by this clarification — see the office-hours park of this date."
  - question: Which of this node's spec corrections are already owned elsewhere, and
      what are the verified anchors for the surfaces a build would touch?
    answer: "(Recorded 2026-08-20 /align-tactics per-node round; anchors measured
      against origin/main 38934c61.) Recorded so a later round does not
      duplicate live sibling work or re-derive these interfaces. OWNED
      ELSEWHERE, out of scope here: correction C5 (session spend attribution) is
      carried by tactic-rsi-lane-token-attribution (status codified, phase
      implement) — 'widen transcript discovery from two directory-name shapes to
      the repo's project-dir prefix, and add the rsi family to the whole-session
      attribution allowlist'; the narrowing it widens is the candidate-dir find
      at aggregate-usage.sh:1458, which matches only names containing
      'worktrees' or ending '--bare'. The dry run's 43%-self-report finding is
      already drafted as tactic-rsi-external-acceptance-gate (status raw), so do
      not mint a second carrier for it. strategy-complete-grounding's
      '/deep-research sourcing stays author-invoked' condition is narrowed by
      tactic-grounding-deep-research-condition-reconcile (status raw) — a
      genuine precondition for scheduling this lane unattended, so a blocked_by
      edge onto it is the right shape rather than restating the reconciliation.
      VERIFIED INTERFACES: the single find-or-recur write surface is
      .claude/skills/dispatch-propagate/scripts/dispatch-eval-finding (`--slug
      <slug> --statement <text> --body-file <path> --sensor <name>
      [--impact-file <path>] [--now <date>] [--serves <strategy-id>]`, node id
      tactic-eval-finding-<slug>, target selected by similarity judgment against
      `--list` which includes retired entries, a retired entry RESUMED with
      recurrence_count incremented rather than re-minted) — the strategy's
      threshold requires 'distinct find-or-recur write surfaces equals 1', so a
      bespoke writer in this lane would falsify the signal outright. The
      born-parked candidate-chunk precedent is
      .claude/skills/context-chunks/SKILL.md (autonomous, Opus-only,
      passages+questions never a summary, never AskUserQuestion), with
      .claude/skills/grounding-research/SKILL.md as the author-invoked sibling
      the draft cites as 'the grounding-research step-3 convention'. The
      headless launcher to reuse is dispatch-code-review, whose launch line
      (dispatch-code-review:1059) already carries the `</dev/null` that
      correction C4 asks for, but runs `--permission-mode acceptEdits`, which is
      NOT narrow enough for the sensor-only condition — C3 still needs
      `--allowedTools` (verified present on this host, alongside
      --disallowedTools, --settings, -n/--name, --add-dir,
      --append-system-prompt). Known defect of that launcher, tracked at
      tactic-eval-finding-detached-code-review-dies-with-launcher (phase
      implement): its detached launch does not survive the launching Bash tool
      call, and the prescribed fix is re-parenting to a `systemd-run --user`
      transient unit — do not re-diagnose it.
      `CLAUDE_CODE_PRINT_BG_WAIT_CEILING_MS` (correction C2) appears nowhere in
      .claude or packages, so that wrapper is genuinely new work.
      tradition-agentic-engineering attributes.texts holds exactly 9 seeds and
      its review_trigger already names 'each /rsi-research cycle's findings'
      (last_assessed 2026-08-10). Do not edit
      intentions/tactic-rsi-plan-skill.md (historical),
      .claude/skills/rsi/SKILL.md or .claude/skills/rsi-audit/SKILL.md (the
      per-phase evaluator and the token-economy instrument; neither is this
      lane)."
tooling_goals: []
success_signal: null
attention: null
phase: null
execution: null
validates: []
blocked_by: []
office_hours:
  reason: >-
    Two independent drift blockers, both author decisions, found by the
    2026-08-20 /align-tactics per-node finalize round. No plan was authored and
    no phase was set; the node stays a draft. 


    SIDE A — a recorded condition of the serving strategy no longer holds, and
    it is the condition that legitimates one of this node's four deliverables.
    strategy-recursive-self-improvement's condition 6 (recorded 2026-08-11:
    "tactics the research lane drafts without author intervention always require
    qa-main validation before they count as validating this strategy") requires
    every lane-drafted tactic to state its cited reference's claimed effect "in
    terms the graph's existing sensors already observe (per-workflow token
    attribution, tactic closure velocity, this strategy's own success_signal
    thresholds)", and rules that "a finding whose claimed effect cannot be
    stated observably is not draftable as a tactic at all". Two of those three
    vocabularies are not observed. (1) TACTIC CLOSURE VELOCITY. The 2026-08-12
    collapse clarification on dropping the judgment step states "(d) the fitness
    function keeps its denominator (per-workflow spend) and loses its numerator
    (closure velocity and strategy-signal progress), so it can say what was
    spent and not what it bought", and the 2026-08-13 clarification on the spend
    fold is blunter still: "What does not survive: closure velocity and
    strategy-signal progress. Those were never computed by anything — they were
    prose inside the deleted renderer's metrics section." Verified in this
    worktree 2026-08-20: no closure-velocity sensor exists (one code comment at
    read-sensors.ts:309, no sensor). (2) THIS STRATEGY'S OWN SUCCESS_SIGNAL
    THRESHOLDS are only partly readable — its 2026-08-14 sensor field records
    three evaluation-core instruments as "NOT YET IMPLEMENTED, so the three
    readings stay declared and unproduced until each instrument lands", and the
    supersession observable as "NOT YET READABLE as of 2026-08-14: blocked on
    tactic-supersession-edge-and-terminal". Only per-workflow token attribution
    survives intact. Planning the lane now would therefore either build the
    draft-tactic write (write 3 of the 4 inert writes this node exists to build)
    against a dead acceptance premise, or silently narrow the condition's
    observable vocabulary to token attribution alone. Both are author decisions.
    What is owed: either re-supply an observable closure-velocity signal, or
    re-word condition 6 to name only what the graph reads today — noting that
    the condition is the operational form of the 2026-08-10 endogenous-primacy
    clarification and is this graph's answer to the dry run's own strongest
    finding (across 35 self-improvement runs every run self-reported a passing
    score while 43% actually scored below random baseline), so narrowing it is a
    substantive weakening rather than housekeeping.


    SIDE B — two material premises this node's plan would depend on that the
    serving strategy does not record. Both are record-completeness defects of
    the /align rounds that retired the research lane's machinery while leaving
    its doctrine standing (strategy clarification 31 / condition 7 framing), so
    the fix is an author /align pass, not a guess by an autonomous round.


    FIRST: the lane's dated reading has no durable carrier. Condition 3 requires
    the lane to write "one dated reading on this strategy", the draft body makes
    it write 1 of 4, and condition 5's unread-pool review trigger — recorded as
    living "in the rsi-plan" — has been re-homed into that same reading now that
    rsi-plan.md and render-rsi-plan.ts are deleted (PR 3074, merge c3c229f0;
    verified absent 2026-08-20). But `reading` on
    strategy-recursive-self-improvement is machine-owned: read-sensors.ts
    registers rsiSensor under RSI_SENSOR_NAME (read-sensors.ts:1590-1598), and
    readStoreSensors recomputes every signalled node's reading and
    writeNode-overwrites it on each batch pass (read-sensors.ts:1700-1728). A
    research-cycle landing written to that field is clobbered by the next run.
    The obvious alternative — naming the lane in success_signal.sensor — is a
    recorded live hazard rather than an option: that field is a
    character-for-character registry key matched against RSI_SENSOR_NAME, and
    appending prose to it de-registers the sensor, which has happened twice on
    this graph (47219a1a on 2026-08-10, when this very research-lane clause was
    appended, and 56039748 on 2026-08-12). RULING OWED: name the carrier for a
    research-cycle landing — (a) a separately registered research-cycle sensor,
    landed as one atomic code-plus-prose change so the sensor is never
    de-registered in between; (b) a dated-entries block under `attributes` on
    the strategy, outside the sensor machinery entirely; or (c) the figures
    folded into rsiSensor's own read() — and say where condition 5's unread-pool
    review trigger is recorded now that rsi-plan is gone.


    SECOND: whether the lane is wanted at all is deferred rather than settled,
    and this round is exactly the "future round" the strategy asked to settle
    it. The research-lane cron condition records: "The lane remains UNBUILT: no
    /rsi-research skill exists in .claude/skills/, so these four research-lane
    conditions are specification without a carrier. They are deliberately
    retained rather than retired ... but a future round should decide whether an
    unbuilt lane is still wanted before more doctrine accretes on it." Verified
    2026-08-20: still no .claude/skills/rsi-research. Three /align rounds have
    run since — the 2026-08-12 collapse and two on 2026-08-14 — without making
    that decision, and the 2026-08-14 statement rewrite around "one shared
    evaluation core" enumerates /rsi, the four invalid-state lanes and
    /rsi-audit and does not name the research lane, while the rationale,
    conditions 3-6 and the sensor field still carry it. The commitment is not
    cheap: this node's own measured dry-run baseline is 108 subagents / 1,261
    turns / ~364k output plus ~44.7M cache-read tokens for a single cycle,
    weekly and indefinitely, on a lane whose own C7 correction records that the
    ratified seed list did little steering work. RULING OWED: an explicit
    build-or-retire decision. If BUILD, a statement clause placing the research
    lane inside the evaluation-core framing, so the strategy's headline stops
    omitting a lane it funds weekly. If RETIRE, conditions 3-6 retire together
    and this node closes unbuilt.
  since: 2026-08-20
  recommendation: "Run an author `/align strategy-recursive-self-improvement`
    pass; this is a record-completeness defect of the rounds that retired the
    research lane's machinery while leaving its doctrine standing, not something
    an autonomous round should decide. Three rulings are owed, and the first
    gates the other two. (1) BUILD OR RETIRE the research lane — the 2026-08-12
    collapse condition explicitly asked a future round to decide this before
    more doctrine accretes, and three rounds have passed without deciding. (2)
    If BUILD: name the carrier for a research-cycle landing (a separately
    registered research-cycle sensor landed as ONE atomic code-plus-prose
    change; a dated-entries block under `attributes`; or figures folded into
    rsiSensor's read), and say where condition 5's unread-pool review trigger
    lives now that rsi-plan.md is deleted. (3) If BUILD: reconcile condition 6's
    acceptance vocabulary with what the graph actually observes — either
    re-supply an observable closure-velocity signal or re-word the condition to
    name only per-workflow token attribution, acknowledging that as a
    substantive weakening of the outside-the-loop acceptance signal rather than
    housekeeping. If the ruling is RETIRE, retire conditions 3-6 together and
    close this node unbuilt — but PRESERVE the body's 2026-08-11 dry-run
    corrections C1-C7 and its measured per-cycle baseline as the dated record of
    what was learned; do not prune them. Then re-run `/align-tactics
    tactic-rsi-research-skill`. Do NOT re-derive the mechanical findings: the
    four clarifications landed on this node in this same round already record
    the superseded serialization bullet (with the flock/worktree-occupancy reuse
    candidates explicitly declined), the CronCreate-to-systemd-timer
    substitution with its installer template and house idioms, the
    historical-name-to-live-successor map, and the verified reuse/ownership map
    naming which sibling nodes already own which of this node's spec corrections
    — all with `path:line` anchors measured against origin/main 38934c61 on
    2026-08-20."
  session_type: requirement-discovery
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