---
id: tactic-align-tactics-immaterial-drift-redirect
kind: tactic
statement: Redirect /align-tactics' immaterial drift observations from a
  strategy clarifications write to a born-parked observation node, so no
  autonomous lane edits durable-layer substance
owner: ai
status: raw
parent: null
rationale: Ruled 2026-08-14 as violation V1 of the autonomous-substance
  invariant. The Side-B immaterial path writes dated clarifications onto a
  strategy with no human, which mutates strategyFingerprint and soft-freezes
  every open child for an observation defined as gating nothing; makes
  /align-tactics a second requirement-entry surface that
  strategy-discovered-requirements reserves to the interview; and collapses
  provenance, since a model-authored dated clarification is indistinguishable
  from an author-ruled one. The redirect preserves non-interruption — a
  born-parked node does not interrupt either — so nothing of the original
  requirement is lost.
reading: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: null
execution: null
validates: []
blocked_by: []
office_hours:
  reason: "SIDE A — a recorded condition on the serving strategy has failed,
    measured, so this node cannot be planned against it.
    strategy-graph-native-dispatch's ARMED maintenance-burden band condition
    fails on BOTH limbs. MEASUREMENT, taken twice independently on 2026-08-21
    and agreeing exactly: the drift agent measured directly over intentions/
    frontmatter using classifyTactic/strategyBacklogBand semantics
    (packages/intentionsutil/src/census.ts:13-40), and the caller thread then
    re-ran strategyBacklogBand itself against the same committed store. 316
    tactics serve strategy-graph-native-dispatch — 83 open (phase set, not
    done), 44 born-parked, 92 draft, 97 done — so backlog = 83 + 44 = 127 of 316
    = 40.19%. The declared band is 'at or below 35% ... and non-increasing
    across consecutive samples derived from intentions/ git history at read
    time'. CEILING LIMB: 40.19% > 35%, FAILED. NON-INCREASING LIMB: the recorded
    descent is 47.6% -> 38.2% -> 31.4% -> 24.6%; the series now reads 24.6% (the
    strategy's own `reading`, stamped 2026-08-10) -> 39.4% (124/315, measured
    twice independently earlier on 2026-08-21 for
    tactic-supersession-retirement-sweep) -> 40.19% (this round), so it is
    rising, and rising within a single day. FAILED. The strategy's stored
    `reading` field is a stale snapshot and must not be read as the condition
    still passing. The condition's own text makes this an author decision rather
    than more work to do: 'A burden growing without bound is this condition
    FAILING (which parks the strategy for an author decision), not merely more
    work to do.' A per-node tactic-target session may not write the serving
    strategy, so the re-measurement and the ruling request are recorded here
    rather than on the strategy — the strategy's record is the incomplete half.
    WHY THIS PARTICULAR NODE CANNOT BE PLANNED THROUGH THE BREACH: this tactic
    mechanizes the minting of born-parked observation carriers, and born-parked
    nodes are scored INTO the backlog numerator that just failed. Measured and
    verified on the caller thread: 19 `tactic-*-drift-observations` carriers
    exist in intentions/, and `git log --diff-filter=A --since=2026-08-07` shows
    all 19 were created inside the last 14 days; 17 serve this strategy and 13
    are currently born-parked = 29.5% of the 44 born-parked nodes in the
    numerator. Automating that mint would write into the very metric this park
    is over, so the band breach is a live design input to this node rather than
    ambient background. SECOND, MATERIAL REQUIREMENT AMBIGUITY awaiting author
    ratification — folded into this one park so the node carries a single
    office_hours block rather than two: the node's own Scope section says 'one
    born-parked tactic-* node per immaterial observation', while all 19 landed
    precedents and the operating practice use ONE carrier per round carrying
    every observation, and a 2026-08-21 carve-out holds that an ESCALATING round
    must mint no carrier at all, folding its observations into the parked target
    instead. Neither the per-round granularity nor the escalation carve-out is
    recorded anywhere in the graph; both live only in a Claude memory note
    (align-tactics-immaterial-drift-mints-observation-node.md) — which is
    exactly the recording-round record gap the strategy's third threshold limb
    tracks. This node cannot be planned until its output granularity is settled,
    because that granularity is what the plan would mechanize. SECONDARY SIDE-A
    FAILURE, not blocking this node's plan but measured and owed a ruling in the
    same sitting: the recorded PR-title condition fails on all three of its
    halves — no CI guard exists (.github/workflows/*.yml carries no title check,
    and .github/scripts/ holds only firestore-query-bounds, graph-fast-path,
    playwright-version-sync, test-integrity and type-safety-escapes; verified on
    the caller thread), dispatch-open-pr takes `--title` as a caller-supplied
    argument (lines 72-87, 136) and passes it verbatim to `gh pr create` (line
    203) with no resolve-against-graph validation, and none of PRs #3083-#3097
    carries a node-id prefix. All of those post-date the condition's 2026-07-25
    binding date, so this is not a retroactive reading. THIS ROUND'S IMMATERIAL
    OBSERVATIONS WERE DELIBERATELY NOT MINTED AS A SEPARATE CARRIER. Per the
    2026-08-21 escalation carve-out, a round that parks its target folds them
    into the target instead: the ones informing the ruling are in this reason
    and the recommendation, and the ones that are reuse facts for the re-plan
    are in the body's '2026-08-21 round record' section. Minting a
    `-drift-observations` carrier here would have written into the same backlog
    numerator this park is over. No clarification was written to the serving
    strategy: clarification 118 is OVERTURNED and the autonomous-substance
    invariant (clarification 245, V1) binds — which is the very defect this node
    exists to mechanize away."
  since: 2026-08-21
  recommendation: "Three items for the sitting, in order. (1) RULE ON THE BAND,
    which is the blocking item. The armed maintenance-burden condition is
    failing on both limbs at 40.19% (127/316) against a 35% ceiling, measured
    twice independently on 2026-08-21. The options are to re-declare the ceiling
    against the current tactic population, to accept the breach with a stated
    recovery plan and a date, or to halt new tactic minting under
    strategy-graph-native-dispatch until the backlog drains. That ruling is a
    write on the strategy, which no per-node session may make. Note that the
    same breach was independently surfaced and parked earlier the same day by
    tactic-supersession-retirement-sweep at 39.4% — this is the second node
    parked on it, so the sitting should rule once rather than per-node. (2)
    RATIFY OR AMEND the proposed clarification this round drafted, since this
    node cannot be planned until it is settled: 'The immaterial-drift redirect
    mints AT MOST ONE born-parked observation carrier per /align-tactics round,
    carrying all of that round's immaterial observations — never one node per
    observation. It mints NONE when the round parks its target (proceed=false):
    in that case the observations fold into the parked target's own
    office_hours.recommendation (those that inform the ruling being requested)
    and its body round-record section (those that are reuse facts for the
    re-plan), and the body says the placement was deliberate. Grounds: the
    target already lands in the office-hours queue a carrier would route to, so
    a carrier adds nothing but backlog; and strategyBacklogBand
    (packages/intentionsutil/src/census.ts:26-40) scores born-parked as backlog,
    so minting one during a band-breach park writes into the numerator the park
    is over. The invariant clarification 245/V1 protects — no autonomous write
    to a strategy's clarifications — is satisfied either way.' Ratifying it also
    discharges the contradiction now flagged inline in this node's Scope
    section. (3) RULE ON THE SECONDARY PR-TITLE FAILURE, which is independent of
    this node and needs its own carrier or an amendment to the condition: all
    three halves of the condition measured false on 2026-08-21 (no CI guard, no
    opener-side construction, no conforming PR in #3083-#3097). Either arm it
    with a real guard or amend the condition to say what actually binds. ONCE
    (1) AND (2) ARE RULED, this node is ready to re-plan from its existing body
    with the round record's corrections applied — in particular the six-site
    call-site census for deleting clarifications_to_add, which is wider than the
    node's Scope section implies. Re-enter with /align-tactics
    tactic-align-tactics-immaterial-drift-redirect. Nothing else blocks it: the
    reuse targets are shipped and verified (DECOMPOSE_SCHEMA.approval_gates as
    the born-parked node shape, the doctrine-ratchet and sentinel-slice test
    patterns), and the autonomous-substance invariant this node implements is
    unchallenged."
  session_type: requirement-discovery
pace_exempt: false
rounds: null
attributes: {}
---
# Redirect /align-tactics' immaterial drift observations from a strategy clarifications write to a born-parked observation node, so no autonomous lane edits durable-layer substance

## Draft context (2026-08-14 /align correction round)

Doctrine home: `strategy-graph-native-dispatch`, the clarification "Which lanes
violate the autonomous-substance invariant today" — this is **V1**.

### Current behaviour, verbatim

The two-sided drift review in `.claude/workflows/align-tactics.js` splits Side B
on `plan_depends`:

- **Material** (`plan_depends=true`) → emit `unrecorded_premises` with a
  `proposed_clarification` **and park for author ratification**, `proceed=false`.
  Correct, and unchanged by this tactic.
- **Immaterial** (`plan_depends=false`) → "Land it as a dated clarification
  (`clarifications_to_add`) WITHOUT interrupting; do not park for it." Applied at
  `.claude/skills/align-tactics/references/write-path.md`, the
  immaterial-observation path, which lands each entry as a dated `clarifications`
  entry on the strategy.

`/align-tactics` is autonomous by its own description — "never `AskUserQuestion`
mid-run".

### The three harms

1. `clarifications` is member two of `strategyFingerprint`'s allowlist
   (`packages/intentionsutil/src/router.ts:102-112`), so the write **soft-freezes
   every open child** of that strategy — a real cost paid for an observation
   defined as gating nothing.
2. It is a **second requirement-entry surface**.
   `strategy-discovered-requirements` reserves requirement entry to the `/align`
   interview; `clarifications` is the same field the interview writes into.
3. **Provenance collapses irreversibly.** A model-authored dated clarification is
   byte-indistinguishable from an author-ruled one. No later reader — including
   the decomposer on its next round — can tell them apart.

### Scope

- Replace `clarifications_to_add` with an observation node: one born-parked
  `tactic-*` node per immaterial observation, `phase: null`,
  `office_hours: {reason, since}` set at creation, `serves` naming the strategy.
  Same recipe `/align` already uses for a deferral review item.
  - **⚠ CONTESTED — do not implement this bullet's granularity as written.** The
    "one node per immaterial observation" reading contradicts every landed
    precedent (all 19 `tactic-*-drift-observations` carriers hold a whole
    round's observations in one node) and it multiplies the backlog cost this
    node's own "Not measured" section worries about. A proposed clarification
    settling it is drafted and awaiting author ratification — see
    "2026-08-21 round record", item R1, and this node's
    `office_hours.recommendation` item (2). This is the reason the node is
    parked rather than planned.
- **Name the strategy id in the node's `statement` or body** — the coverage
  sensor derives frontier linkage by matching that id, so an item that only
  alludes to the strategy is invisible to it.
- `proceed` stays `true`. The round runs on uninterrupted.
- Update the workflow's output schema and the Side-B prompt block together, plus
  the `write-path.md` application step.

### This OVERTURNS a standing author ruling — read it before implementing

**Recorded 2026-08-15, after the pre-commit adversarial review caught that the
2026-08-14 draft reversed a prior ruling without noticing.**

`strategy-graph-native-dispatch` carries a clarification **recorded 2026-07-28
from an author interview** stating the opposite of this tactic: *"Standing
requirement: a per-node tactic-target session MAY append clarifications entries
to the serving strategy, and may touch NOTHING else on it."* It is now amended in
place with an `OVERTURNED 2026-08-15` prefix pointing at V1.

That ruling was **correct on its own premises**, and the premise is what changed.
Its decisive argument was that the doctrine left immaterial observations with
**no legal destination at all** — `write-path.md` said write them to the
strategy, `tactic-target.md` forbade any strategy write, and the autonomy
contract closed the park escape because an immaterial observation is none of its
three park conditions. Forced to choose between dropping the observation and
writing the strategy, it chose writing. **The born-parked observation node is a
legal destination, so the forced choice dissolves.** This redirect therefore
*satisfies* the 2026-07-28 concern rather than overriding it: nothing is dropped,
and the sole-carrier condition still holds.

**Consequence for an existing node.**
`tactic-align-tactics-per-node-clarifications` is the implementation of the
overturned ruling. Its unit A widens the write authority this tactic removes, and
its unit B hardens `DRIFT_SCHEMA.clarifications_to_add`, which this tactic
deletes. It is **parked by the 2026-08-15 round** as doomed-as-written. But its
**second finding survives and is owed by this node**: `DRIFT_SCHEMA` declares
`clarifications_to_add` items as `{answer}` only with
`additionalProperties: false`, while the `Clarification` interface requires
`{question, answer}` — so the instruction was never mechanically executable. The
replacement observation-node schema must not repeat that mismatch.

### Why redirect rather than carve out

An append-only exception — autonomous may append to list-substance
(`clarifications`, `serves`, `tooling_goals`, `attributes.conditions`) but never
rewrite scalar-substance (`statement`, `success_signal`), mirroring
`node-merge.ts`'s `LIST_FIELDS`/`SCALAR_FIELDS` split — was drafted as the
alternative and **declined**. The redirect makes the invariant hold outright,
with no exception to remember. (Note: that carve-out is *materially the same
authority* the 2026-07-28 ruling granted, which is why declining it is the
overturn described above and not merely a fresh design choice.)

The steelman for the current design is "do not interrupt the round", and it is a
good requirement. It is fully preserved: **a born-parked node does not interrupt
either.** Non-interruption was achieved by not parking the *strategy*; it never
required writing *to* it.

### Not measured — SUPERSEDED 2026-08-21, now measured

The original text read: *"Volume. Nobody counted how many `clarifications_to_add`
entries actually land per round, so the office-hours cost of this redirect is
unknown."* That is no longer true, and the answer is load-bearing enough that the
node is parked over it.

**Measured 2026-08-21** (see "2026-08-21 round record", item R2): 19
`tactic-*-drift-observations` carriers exist in `intentions/`, and
`git log --diff-filter=A --since=2026-08-07` shows all 19 were created inside the
preceding 14 days. 17 serve `strategy-graph-native-dispatch`; 13 are currently
born-parked, which is **29.5% of the 44 born-parked nodes** in this strategy's
backlog numerator. So the rate is roughly **one born-parked node per round**, and
the hand-applied form of this redirect is already a measurable share of the very
backlog band the strategy arms at a 35% ceiling — a band now failing at 40.19%.

The original conditional still stands, and now has evidence behind it: *"If the
queue proves noisy, that is evidence the immaterial path should be **deleted**
rather than redirected — the author considered and declined deletion on the
grounds that the decomposer reads the strategy harder than any other reader and
discarding what it notices is a real loss."* The measurement does not decide
between deletion and the one-carrier-per-round containment; that is the author's
call at the sitting.

## 2026-08-21 round record — `/align-tactics` tactic-mode, PARKED (no plan authored)

A per-node `/align-tactics tactic-align-tactics-immaterial-drift-redirect`
finalize round ran on 2026-08-21 and **escalated**: the drift review returned
`proceed: false` with a Side-A condition failure, so the plan phase never ran and
this node stayed a draft (`phase: null`) rather than advancing to
`phase: implement`. The park is in this node's `office_hours`; the diagnosis is in
its `reason` and the sitting's agenda in its `recommendation`. What follows is the
part of the round that is **reuse material for the re-plan**, kept out of the
`office_hours` block so the office-hours reader is not made to wade through it.

**Placement note, deliberate.** This round's six immaterial Side-B observations
were folded into this node — the ruling-relevant ones into `office_hours`, the
plan-relevant ones into this section — rather than minted as a separate
`tactic-*-drift-observations` carrier. That is the 2026-08-21 escalation
carve-out, and it applies with extra force here: the park's own reason is a
backlog-band breach, and `strategyBacklogBand`
(`packages/intentionsutil/src/census.ts:26-40`) scores born-parked nodes into the
backlog numerator, so minting a carrier would have written into the exact metric
the park is over. **No clarification was written to the serving strategy** —
clarification 118 is `OVERTURNED` and the autonomous-substance invariant
(clarification 245, V1) binds. That invariant is the thing this node exists to
mechanize, so violating it to record observations about it would be self-defeating.

### R1 — the granularity contradiction (MATERIAL; this is what blocks the plan)

The node's `### Scope` section says "one born-parked `tactic-*` node **per
immaterial observation**". Every landed precedent does the opposite: all 19
`tactic-*-drift-observations` carriers hold a whole round's observations in a
single node. A further 2026-08-21 carve-out holds that a round which parks its
target mints **no** carrier at all. Neither rule is recorded in the graph; both
live only in a Claude memory note
(`align-tactics-immaterial-drift-mints-observation-node.md`) — which is itself an
instance of the record gap the strategy's third threshold limb tracks.

Proposed clarification, drafted this round, **awaiting author ratification**
(reproduced verbatim in `office_hours.recommendation` item 2):

> The immaterial-drift redirect mints AT MOST ONE born-parked observation carrier
> per `/align-tactics` round, carrying all of that round's immaterial
> observations — never one node per observation. It mints NONE when the round
> parks its target (`proceed=false`): in that case the observations fold into the
> parked target's own `office_hours.recommendation` (those that inform the ruling
> being requested) and its body round-record section (those that are reuse facts
> for the re-plan), and the body says the placement was deliberate. Grounds: the
> target already lands in the office-hours queue a carrier would route to, so a
> carrier adds nothing but backlog; and `strategyBacklogBand`
> (`packages/intentionsutil/src/census.ts:26-40`) scores born-parked as backlog,
> so minting one during a band-breach park writes into the numerator the park is
> over. The invariant clarification 245/V1 protects — no autonomous write to a
> strategy's `clarifications` — is satisfied either way.

The plan cannot be authored before this is settled, because the granularity is
precisely what the plan would mechanize.

### R2 — volume, now measured

19 `tactic-*-drift-observations` carriers exist; `git log --diff-filter=A
--since=2026-08-07` shows all 19 created inside 14 days; 17 serve
`strategy-graph-native-dispatch`; 13 are currently born-parked = 29.5% of the 44
born-parked nodes in this strategy's backlog numerator. Roughly one carrier per
round. This supersedes the node's original "Not measured" section, amended above.

### R3 — the six-site call-site census for deleting `clarifications_to_add`

Wider than this node's `### Scope` section implies ("the workflow's output schema
and the Side-B prompt block together, plus the `write-path.md` application
step" — that is three, and it misses two prompt/schema sites whose omission
breaks the run). All line numbers measured 2026-08-21 against a 1354-line
`.claude/workflows/align-tactics.js`; re-grep by symbol before editing.

1. `align-tactics.js:154` — `'clarifications_to_add',` inside `DRIFT_SCHEMA`'s
   `required` array. **Missing this one makes every drift verdict schema-invalid**:
   the object would still declare the field required while no longer accepting it.
2. `align-tactics.js:183-190` — the property definition. Items are `{answer}`
   only with `additionalProperties: false`, against
   `packages/intentionsutil/src/schema.ts:167-170`'s
   `interface Clarification { question: string; answer: string }`. **This is the
   inherited second finding** from the closed
   `tactic-align-tactics-per-node-clarifications`; the replacement observation
   schema must not repeat the mismatch.
3. `align-tactics.js:787` — the Side-B immaterial-branch instruction sentence
   ("Land it as a dated clarification (`clarifications_to_add`) WITHOUT
   interrupting; do not park for it.").
4. `align-tactics.js:831` — the same prompt's **echo of the return shape**, which
   restates `"clarifications_to_add": [ { "answer" }, ... ]`. A change that
   updates the schema but not this line leaves the model instructed to emit a
   field the schema now rejects.
5. `align-tactics.js:1142` — `clarifications_to_add: [],` in the drift
   agent-death fallback object (lines 1136-1153). A rename that misses this makes
   the fallback stop matching its own schema.
6. `.claude/skills/align-tactics/references/write-path.md:305-306` — the caller's
   application step, inside the "Parks — writing `office_hours`" section.

Also in scope for the doctrine sweep, though not `clarifications_to_add`
call sites: `.claude/skills/align-tactics/SKILL.md:308` (the Step-1 drift bullet
saying an immaterial premise "lands as a dated `clarifications` entry without
interrupting") and SKILL.md's `result`-shape block, which enumerates the returned
fields. `references/tactic-target.md:146` ("There is **no strategy edit** in
either case") needs **no** edit — it is already correct and becomes
unconditionally true; narrowing it was the closed predecessor's declined Unit A.

### R4 — reuse targets, verified shipped

- **The born-parked node shape already exists in this same file**:
  `DECOMPOSE_SCHEMA.approval_gates` (`align-tactics.js:270-284`),
  `{temp_ref, slug_hint, serves, statement, office_hours_reason, blocks}`. Its
  caller-side landing contract is already written in `write-path.md` under
  "Per node (tactic or gate)" — a gate lands `owner: human`, `status: delegated`,
  omits `phase`, sets `office_hours`. The observation carrier is that shape minus
  `blocks`; do not invent a parallel structure.
- **Frontmatter shape to reproduce**, from any of the 19 landed carriers:
  `kind: tactic`, `owner: human`, `status: delegated`, `phase: null`,
  `serves: [<strategy-id>]`,
  `office_hours: {reason, since, recommendation, session_type}`.
  `OfficeHours` is `packages/intentionsutil/src/schema.ts:702-707`
  (`recommendation: string | null`, `session_type: SessionType`); `SessionType`
  is lines 149-154 — `"requirement-discovery" | "curriculum-review" | "other"`.
- **Test patterns**, both already wired:
  `.claude/skills/dispatch-propagate/scripts/test-align-tactics-write-path-freshness.sh`
  is the doctrine-ratchet shape (grep the doctrine files, one assertion per
  requirement) — the natural model for a ratchet that the clarifications-write
  instruction has not come back;
  `test-align-tactics-gates.sh` + `align-tactics-gates-probe.mjs` is the
  sentinel-slice probe shape for a pure function out of `align-tactics.js`.
- **CI wiring is not automatic.** `run-unit-tests.sh` has **no mapping** for
  `.claude/workflows/*`, and its `test-*.sh` glob runs only when `RUN_PR_SCRIPTS`
  is set (auto-detect sets that solely for changed paths under
  `.claude/skills/dispatch-propagate/scripts/`). A PR touching only
  `align-tactics.js` therefore triggers no suite. Any new test **must** be wired
  unconditionally into `.github/workflows/unit-tests.yml`'s hook-tests job
  (existing entries at lines 270-273, 298-301, 368-369). This is stated in
  `test-align-tactics-gates.sh` lines 17-24.

### R5 — `STATE_FIELDS` is doctrine-only, not an importable symbol

Clarification 244 defines EDIT-SUBSTANCE negatively against "schema.ts exports
`STATE_FIELDS`". A repository-wide grep across `packages/` and `.claude/` returns
**zero** hits (verified twice this round). The taxonomy is sound — the three
precedents it cites all exist (`strategyFingerprint`'s allowlist at
`packages/intentionsutil/src/router.ts:102-112`, `tacticScopeFingerprint`'s
statement-plus-body pair at `router.ts:131-133`, `node-merge.ts`'s
`LIST_FIELDS`/`SCALAR_FIELDS` at lines 35-70) — but its stated mechanism is
doctrine ahead of code. This bears on the **V2** fix
(`tactic-dispatch-conflict-substance-allowlist`) far more than on this V1
redirect, which needs no such predicate: a node planned against
`STATE_FIELDS.has(field)` as a callable predicate must land the constant as its
own unit rather than import it.

### R6 — the third threshold limb is trending the wrong way

`strategy-graph-native-dispatch`'s success_signal threshold ends "…and parks
attributable to an upstream recording round's own record gap trend to zero". The
`-drift-observations` carrier family is trending it **away** from zero: every such
node is by construction a park recording a round's own observations rather than a
substantive defect, and 19 landed in 14 days. Any recount against the band that
does not separate record-gap parks from substantive-defect parks will misattribute
that growth. Recorded here as an observation, not a proposal — the disposition is
the author's.

### Predecessor status, re-verified

`tactic-align-tactics-per-node-clarifications` reads `phase: done` with
`office_hours: null`, but its body's first heading is "CLOSED 2026-08-15 —
abandoned, not completed. `phase: done` here is a lie." Its `done` stamp is **not**
evidence that its surviving schema finding was fixed: the `{answer}`-only block is
still live at `align-tactics.js:183-190`. That finding is owed by this node, per
R3 item 2.

### Round provenance

Workflow run `wf_0f263c42-084`, `mode: "tactic"`, 5 subagents, 0 agent deaths, 0
empty results — so unlike some prior rounds on this strategy the Side-A sweep ran
on complete gather evidence. `disposition: "escalated"`, `deviation: true`,
`drift.proceed: false`, 1 park, 0 plans authored, 0 carriers minted. Every
measurement quoted in this record and in the `office_hours` block was
re-verified independently on the caller thread before the park was accepted —
`strategyBacklogBand` re-run against the committed store (127/316, agreeing to
the digit), the 19-carrier creation window re-run through `git log`, the
`STATE_FIELDS` grep re-run, and the absence of a PR-title CI guard confirmed
against `.github/scripts/`.
