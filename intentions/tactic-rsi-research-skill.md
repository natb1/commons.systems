---
id: tactic-rsi-research-skill
kind: tactic
statement: Build the research lane as an opt-in, token-targeted subskill of
  /rsi-audit — external research fires only in response to an endogenous
  finding, on no schedule, writing through the one shared find-or-recur surface
owner: ai
status: codified
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
      intentions/tactic-rsi-plan-skill.md (historical) or .claude/skills/rsi/SKILL.md
      (the per-phase evaluator; not this lane). AMENDED 2026-08-29 by the
      build-or-retire ruling below: the once-listed prohibition on editing
      .claude/skills/rsi-audit/SKILL.md is REVERSED. That file is now this
      lane's host — the ruling folds the lane into /rsi-audit as an opt-in
      subskill, so the implementer must edit it. Left recorded rather than
      deleted because a reader who remembers the old prohibition needs to see it
      overturned, not silently absent."
  - question: Ruling one of three — BUILD or RETIRE the research lane?
    answer: "(Ruled 2026-08-29 author sitting; this answers the first of the three
      rulings the 2026-08-20 park declared owed, and it gates the other two.)
      BUILD, but NOT as the standalone lane the 2026-08-10 draft specifies. The
      lane is folded into /rsi-audit as an opt-in subskill, and the weekly
      schedule is RETIRED. Three grounds. (1) STATEMENT CONFORMANCE: the serving
      strategy opens 'Harness self-improvement is measurement, not a second
      orchestrator — one shared evaluation core ... every producer records
      findings through that one write surface'. A weekly skill with its own
      schedule and its own outputs is structurally a second lane, which is why
      the doctrine kept needing bespoke clauses to justify it; as a producer on
      the existing write surface it needs none of them. (2) IT STOPS REVERSING A
      DECISION ALREADY MADE: PR 3074 collapsed the rsi skill family into exactly
      two skills, verified on origin/main 2026-08-29 — .claude/skills/rsi/ and
      .claude/skills/rsi-audit/ and nothing else. Building /rsi-research would
      re-expand the family three weeks after it was deliberately contracted. (3)
      ENDOGENOUS PRIMACY BECOMES STRUCTURAL RATHER THAN DOCTRINAL: the external
      pass fires only when an endogenous finding lacks an internal explanation,
      so research can only ever answer a measurement. That ordering was
      previously a rule that a scheduled lane could not enforce. The 2026-08-29
      measurement round is the evidence for insisting on it: a measured 4.3%
      cache-creation ceiling killed an imported 41-80% claim outright, and
      price_proxy_usd was found to invert the real model-cost ranking. Imported
      magnitudes were actively misleading where own telemetry was not. NOT
      user-invocable: the subskill is invoked BY /rsi-audit and is deliberately
      absent from the user-invocable slash-command list, because a /rsi-research
      command would re-create the separate lane this ruling removes."
  - question: Ruling two of three — what carries a research-cycle landing?
    answer: "(Ruled 2026-08-29 author sitting.) The question DISSOLVES rather than
      being answered, and none of the three candidate carriers the park offered
      is adopted. Under the fold there is no separate lane output to home:
      findings land as tactic-eval-finding-<slug> nodes through
      dispatch-eval-finding, the same find-or-recur surface /rsi-audit step 6
      already writes, which already carries recurrence semantics so a finding
      recurring across runs is one node with a rising recurrence_count rather
      than a second node. Three consequences. (a) Condition 3's dated reading on
      the strategy RETIRES; it is not re-homed. (b) No new sensor is registered,
      so the recorded de-registration hazard is never approached — appending
      prose to a success_signal.sensor registry key has de-registered a sensor
      twice on this graph, 47219a1a on 2026-08-10 and 56039748 on 2026-08-12.
      (c) Condition 5's unread-pool review trigger becomes the ledger's own
      backlog, which existing machinery already surfaces, so it too needs no
      bespoke home. REQUIRED, and the reason this is not merely a simplification:
      research-derived entries MUST carry --sensor rsi-research, distinct from
      /rsi-audit's own --sensor rsi-audit, and must name the endogenous finding
      that provoked them. Without that marker a hypothesis and a measurement land
      on one surface indistinguishable from each other, and the strategy's core
      rule — an external finding never outranks a measured internal signal —
      becomes unreadable in the data even though it stays true in the prose.
      dispatch-eval-finding already accepts --sensor, so this is a parameter
      choice and not new code."
  - question: Ruling three of three — condition 6's acceptance vocabulary?
    answer: "(Ruled 2026-08-29 author sitting.) RE-WORDED to name only what the
      graph reads, and the weakening is recorded as a weakening rather than as
      housekeeping. Of the three vocabularies condition 6 requires a lane-drafted
      tactic to state its claimed effect in, only per-workflow token attribution
      is readable today. The supersession observable becomes readable when
      tactic-supersession-edge-and-terminal lands — that is PR19 at position 6 of
      the dispatch/RSI window, ahead of this lane's own position, so it is
      supplied by sequencing rather than by new work here. Closure velocity is
      NOT re-supplied: no closure-velocity sensor exists, one code comment at
      read-sensors.ts:309 notwithstanding, and inventing one to satisfy an
      acceptance clause would be building a sensor to pass a test rather than to
      read a signal. What bounds the weakening is the fold itself: condition 6
      binds tactics the lane drafts WITHOUT author intervention, and an opt-in
      author-invoked pass produces few such tactics, so the clause governs a much
      smaller population than a weekly unattended lane would have. The 2026-08-11
      directive's qa-main validation requirement is UNCHANGED and still applies
      to every tactic the lane drafts."
  - question: How is a run sized to a token target, and what does testing use?
    answer: "(Ruled 2026-08-29 author sitting.) /rsi-audit takes a lane parameter
      that selects a NAMED STRATEGY PRESET sized to a token target — it is not a
      model reasoning-effort knob, though a preset may set one. Cost composes
      multiplicatively across independent axes, which is why a scalar selects a
      bundle rather than scaling one dimension. Research-side axes, which are
      ours to set because correction C1 made the prompt template ours: seed
      breadth (attributes.texts holds 9); WHICH seed, since they are not
      interchangeable and the arXiv bundle is the widest and the one C6 governs;
      C7 pass selection, where frontier expansion is the unbounded half that
      makes source count unpredictable and is the largest single structural cut;
      source-fetch cap (the dry run fetched 25); crawl depth per seed; source
      recency window; claim-extraction cap (the dry run extracted 110);
      adversarial verification ratio (25 of 110 verified, 8 killed); fan-out
      width (108 subagents); and which of the durable writes actually land.
      Audit-side axes, mostly existing flags: lens subset across the twelve
      lenses; scope, noting that --session/--node is COUPLED to lens choice
      because five lenses are tagged fleet-only and a scoped caller must skip
      them rather than compute a degenerate version; window --days/--day, which
      is also a correctness knob since short windows read empty under the
      dispatch freeze; step 6's top-N landings; slice depth; and
      --exclude-sidecar-sessions. SEQUENCING PRINCIPLE — CUT BREADTH BEFORE
      DEPTH: correction C7 measured the ratified seed list as doing little
      steering (all nine named, load-bearing findings still mostly from outside
      the list), while the verification pass killed 8 of 25 claims, a 32% rate
      the node itself records as real work. So breadth bought less than expected
      and depth bought a lot. LANES: low is the test lane — one HTML seed, seed
      crawl only, depth 1, a small source cap, verification off, ZERO durable
      writes, audit scoped to one fixed session id with any-scope lenses only and
      N=0 landings. medium is the interactive DEFAULT — a few seeds, seed crawl
      only, verification ON, landings on; the minimum shape where a real finding
      is plausible. full is the dry-run shape. Tests pin low EXPLICITLY and never
      rely on the default, because a default that drifts silently re-arms the
      cheapness assumption. If a preset does pass claude --effort, the value must
      be validated locally against low|medium|high|xhigh|max: measured
      2026-08-29, the CLI does NOT reject an unknown value — it prints a warning
      to stderr and proceeds at DEFAULT effort, so a typo in the test path yields
      a full-cost run that looks like it worked. Each lane declares a token
      target and the run measures actual against it with aggregate-usage.sh
      --session, recorded beside the existing dry-run baseline so the lanes are
      calibrated rather than guessed."
  - question: Does the fold still need strategy-complete-grounding's reconcile
      precondition, and what does it depend on instead?
    answer: "(Ruled 2026-08-29 author sitting.) NO — and this is a blocker the
      ruling dissolves rather than inherits. The 2026-08-20 round recorded
      tactic-grounding-deep-research-condition-reconcile as a genuine
      precondition because scheduling this lane UNATTENDED would cross
      strategy-complete-grounding's condition that '/deep-research sourcing stays
      author-invoked; the tick never runs it' (verified at that node 2026-08-29).
      The fold retires the schedule and makes every run author-invoked, so the
      condition is SATISFIED rather than narrowed, and no blocked_by edge onto
      that node is needed. What the lane does depend on is
      tactic-rsi-lane-token-attribution (status codified, phase implement,
      verified 2026-08-29), which owns correction C5. That dependency is now
      load-bearing rather than incidental: a lane parameter targeting token usage
      cannot be calibrated while a cycle's real cost lands in nested
      subagents/workflows/wf_*/agent-*.jsonl under an anonymous headless session
      id with no node id, because there is nothing to scope the confirming
      measurement to. A target you cannot measure is not a target. Recorded as a
      blocked_by edge accordingly."
tooling_goals: []
success_signal: null
attention: null
phase: null
execution: null
validates: []
blocked_by:
  - tactic-rsi-lane-token-attribution
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Build the research lane as an opt-in, token-targeted subskill of /rsi-audit — external research fires only in response to an endogenous finding, on no schedule, writing through the one shared find-or-recur surface

## Execution plan — ruled 2026-08-29 author sitting

This section is the plan; everything below it is dated record. Where the two
disagree, this section governs. The sections below are **kept, not pruned** —
corrections C1–C7 and the measured per-cycle baseline are the dated record of
what a real cycle cost and how it fails, and a build that has not read them will
re-learn each one at full price.

**Shape.** A subskill of `/rsi-audit`, invoked by it, **absent from the
user-invocable slash-command list**. No `/rsi-research` command, no schedule, no
systemd timer. The weekly-cron clarification recorded on this node describes a
mechanism that is no longer built; it stays as the record of why `CronCreate`
was rejected, not as an instruction.

**Trigger.** The external pass fires **only in response to an endogenous
finding** that own telemetry cannot explain, and only when the caller opts in.
Default is off: a routine `/rsi-audit` run performs no external fetch.

**Unit 1 — the lane parameter.** `/rsi-audit` accepts a lane selecting a named
preset sized to a token target (`low`, `medium`, `full`; `medium` is the
interactive default). The preset bundles the research-side and audit-side axes
enumerated in this node's lane clarification. Validate the value and exit
non-zero on anything unrecognized — never fall back to a default, per
`.claude/rules/code-style.md`.

**Unit 2 — the research invocation.** Preserve the C1 mechanism exactly: a
headless session whose *initial user message* is the slash command,
`claude -p "/deep-research <question>"`, because `/deep-research` is a harness
built-in marked `disable-model-invocation` and **a subskill cannot call it any
more than a skill could**. Carries C2 (`CLAUDE_CODE_PRINT_BG_WAIT_CEILING_MS=0`
in a wrapper script, never an inline `VAR=value` prefix), C3 (a narrow
`--allowedTools` grant, never `--dangerously-skip-permissions`), C4
(`< /dev/null`), C6 (arXiv at `/abs/`), and C7 (two bounded passes).

**Unit 3 — the post-processing.** Turn the returned report into
`tactic-eval-finding-<slug>` entries through `dispatch-eval-finding`, passing
**`--sensor rsi-research`** and naming the endogenous finding that provoked the
run. This is the unit that carries the graph's ordering rule in its data.

**Verification.** Unit 3 is the repo-owned logic and the part that can break:
test it against a **fixture report with zero external calls**, which is cheap,
deterministic, and covers more of what this repo owns than an end-to-end
low-lane run would. Unit 2 gets a rare, deliberate smoke run. Tests pin `low`
explicitly rather than relying on the default.

**Two failure modes measured 2026-08-29, both silent — guard both.** `claude
--effort <bad>` prints a warning and proceeds at *default* effort rather than
failing, so a typo in a test path produces a full-cost run that looks correct.
And effort throttles reasoning depth, **not fan-out** — it does not obviously
reduce the ~108 subagents or 25 source fetches a full cycle performs, so a low
lane must bound *work* (seeds, passes, caps) and not only reasoning. Pair the
test lane with `--max-budget-usd` as a hard ceiling rather than a hint.

**Dependency.** `blocked_by: tactic-rsi-lane-token-attribution` — it owns
correction C5. Until a cycle's spend is attributable, a lane's declared token
target cannot be confirmed against actual, and the calibration loop this plan
depends on does not close.

**Out of scope, owned elsewhere:** the 43%-self-report finding
(`tactic-rsi-external-acceptance-gate`). **No longer required:** a `blocked_by`
edge onto `tactic-grounding-deep-research-condition-reconcile` — see the
clarification of 2026-08-29; the fold satisfies that condition instead of
narrowing it.

## Draft context (2026-08-10 /align research-lane round)

> **Superseded in part, 2026-08-29.** The **Trigger** bullet below (weekly
> harness cron) and the **Serialization** bullet are retired by the ruling
> above; the lane is opt-in and author-invoked. The **Run**, **Writes**,
> **Prohibitions**, **Unread-pool guard** and **Spend** bullets still describe
> what the folded subskill does, with the writes landing through
> `dispatch-eval-finding` rather than as a separate dated reading.


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