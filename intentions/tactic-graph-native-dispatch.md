---
id: tactic-graph-native-dispatch
kind: tactic
statement: "Build graph-native dispatch — subtree parent: schema, graph-commit,
  align skills, router v2, instrument, legacy removal"
owner: ai
status: refining
parent: null
rationale: "Finalized 2026-07-03 by the trial /align-tactics
  strategy-graph-native-dispatch run, consuming this node's own retained draft
  per the retain-not-refine contract. Now the subtree parent — the graph-native
  epic: the nine children carry the clean-session plans; this body holds the
  shared spec (state model, skill family, router) and the /file-issue +
  /plan-issue coverage matrix that gates legacy removal. Not directly executable
  (no phase); it completes when its last child completes, stamping the
  strategy's round accounting."
reading: null
gap: null
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
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Build graph-native dispatch — subtree parent: schema, graph-commit, align skills, router v2, instrument, legacy removal

**Subtree parent** — finalized 2026-07-03 by the trial `/align-tactics
strategy-graph-native-dispatch` run, which consumed this node's own retained
draft; amended the same day by the second interview round (strategy
clarifications 8–10), whose mid-flight edit rule was executed on this very
subtree as the first re-evaluation. The eleven children carry the
clean-session plans; this body holds the shared spec they reference (§1–3),
the coverage matrix that gates legacy removal (§4), and the subtree map
(§5). The author decisions are binding (dated clarifications on the
strategy node). The legacy GitHub-issue
router (`.claude/skills/dispatch-propagate/scripts/`) remains the live
implementation until its queue drains. This subtree executes step 2 of the
migration direction in `packages/intentionsutil/SCHEMA.md`: *migrate the
dispatch router onto the graph*.

Interim note: the schema fields below do not exist first-class yet, so this
subtree's own nodes carry `phase`, `blocked_by`, `office_hours`,
`validates` (and the strategy's `rounds`) under free-form `attributes`;
`tactic-graph-dispatch-schema` promotes the fields and migrates these nodes.

## 1. State model

### 1.1 Tactic execution state

Schema extensions (all graph-owned; `validateNode` gates them):

```yaml
# on tactic nodes only
phase: draft | align-tactics | implement | fix | qa | review | main-qa | done
validates: [<strategy-id>]     # factual: this tactic produces the signal's
                               # reading / meets its threshold — a terminal of
                               # the calculated-attention signal term
                               # (clarification 11)
execution:
  branch: <node-id>            # worktree/branch anchor
  pr: 2740 | null              # PR number once opened
  attempts: { fix: 0, qa: 0 }  # counters formerly dispatch:*-attempt labels
  markers: []                  # formerly dispatch:planned/qa-done/reviewed
  strategy_fingerprint: <hash> # serving strategy's substance at plan time
                               # (soft-freeze trigger, clarification 10)
```

```yaml
# on any goal-layer node (strategy or tactic)
office_hours: { reason: "<why>", since: 2026-07-03 } | null
pace_exempt: false             # authored pace-gate bypass (clarification 14):
                               # admits one gate-exempt worker past a
                               # paced-to-zero budget — bypasses the gate, not
                               # the count or the order — and never overrides
                               # genuine token exhaustion; the graph home of
                               # the legacy priority label, orthogonal to
                               # attention ordering
```

```yaml
# on strategy nodes — /align-tactics round accounting
rounds:
  count: 0                    # completed tactic rounds
  last_completed: null        # timestamp of last round's final tactic completion
```

- **Draft phase.** `phase: draft` (equivalently: no phase set) marks
  undecomposed tactical context from strategy work. The router **does**
  select a draft tactic, emitting it at the `align-tactics` directive rung
  (gated on `office_hours` null, blockers all `done`, and not being another
  tactic's `parent`); drafts do not count as children for strategy
  eligibility — they are `/align-tactics` input.
- **Phase is persisted, transitions are sensed.** The router never
  re-derives phase from GitHub; it reads the node's `phase`, consults the
  relevant sensor (CI verdict, PR mergeability), and commits the transition
  as a graph write. Out-of-band events (a hand-merged PR) are absorbed by a
  reconciler sweep.
- **`fix` is the CI-failure interrupt, not a linear step** (strategy
  clarification 18). A tactic enters `fix` from ANY of
  `implement`/`qa`/`review` when its PR's CI verdict is failing, and
  returns to where it left off once CI is green — it is not a station
  every tactic passes through between `implement` and `qa`. Legacy parity:
  `dispatch-phase` checks mergeability/CI verdict before any phase-label
  logic, so a PR already past qa or review routes back to the fixer on a
  CI regression. Distinct from the qa and review phases' own internal fix
  loops: `qa-fix`/`review-fix` repair QA- and review-content findings
  locally (their own attempt counters) before anything reaches CI; those
  loops never pass through the `fix` phase. `fix` means exactly "CI is red
  on this tactic's PR".
- **Plan lives in the tactic body.** Doctrine amendment (recorded on the
  strategy): the body remains a cosmetic render for virtues, strategies,
  and delegations, but is authoritative content for tactics — draft context
  before finalization, the full clean-session plan after. Store change
  required: `writeNode` must preserve tactic bodies (until it ships, bodies
  are hand-maintained; no automated writer touches tactic bodies). (Correction, tick +6 2026-07-11: tactic-body preservation HAS shipped (`readExistingTacticBody` in store.ts), but NON-tactic bodies — strategy, kind, delegation, virtue — are REGENERATED from `statement` on every `writeNode`, so they are cosmetic and cannot durably hold content: reconcile-graph, read-sensors, park, and transition writes all clobber them. `writeNode` does NOT unconditionally preserve a node body — only a tactic's. The kind-strategy body-function rule (2026-07-09) and its consumers conflict with this; the contract is under decision at `tactic-nontactic-body-durability`, on which calibration-event-registry, mount-schema, and graph-native-dispatch-fold are blocked.) (Resolution, office hours 2026-07-18: the author RATIFIED the greenfield contract at `tactic-nontactic-body-durability` — ALL node bodies (virtues, strategies, delegations, kinds, tactics) are now durable, authoritative content, NOT a cosmetic render. `store.ts` drops the kind gate (`readExistingTacticBody` → `readExistingBody`, `assertNoTacticBodyLoss` → a kind-agnostic `assertNoBodyLoss`), so `writeNode` preserves every kind's body verbatim on rewrite and regenerates the `# ${statement}` placeholder only for a brand-new file — reconcile-graph, read-sensors, park, and transition writes no longer clobber a non-tactic body. This supersedes the "cosmetic render for virtues, strategies, and delegations" clause above. Shipped on PR #2890 (phase review); the three blocked consumers unblock on merge.)
- **Blocking** stays the tactic-layer subtree mechanism recorded on
  `strategy-graph-drives-dispatch`: `blocked_by: [<tactic-id>...]`; nothing
  in a blocked subtree starts until the blocking subtree completes; the
  router is the single enforcement point.
- **`main-qa` is the post-merge verification phase** (strategy
  clarification 22): the tactic's own lifecycle extends through prod — no
  separate follow-up artifact. The qa phase records needs-main residue in
  a body section of the node instead of filing anything; the reconciler
  routes a merged tactic to `main-qa` when residue exists, else `done`;
  the router maps `main-qa` to the qa-main handler session (uniform
  node-id machinery), gated on the prod deploy landing. Outcomes keep
  legacy qa-main parity: pass → `done` (prune), broken → an
  implement-chain bug tactic written via `graph-commit` then `done`,
  cannot-verify → `office_hours`.
- **Completion prunes.** `phase: done` removes the node and its edges in
  the same commit that lands the transition; the strategy's
  `rounds.last_completed` is stamped when the last child prunes. For a
  tactic with needs-main residue, `done` follows `main-qa` — pruning and
  round accounting sit behind prod verification, so
  `rounds.last_completed` means verified-in-prod (clarification 22).

### 1.2 Write path — direct-push with rebase-retry

All writers (skills, router, workers, reconciler) use one primitive:

```
graph-commit <node-id> [...node-id]:
  1. write node(s) through write-node.ts (the single validation gate)
  2. git add intentions/<id>.md ... && git commit
  3. git pull --rebase origin main   # intentions/-only commits rebase cleanly
  4. git push origin HEAD:main
  5. on push reject → goto 3 (bounded retries, then park the writer's target)
  6. on rebase conflict → same-node concurrent edit: re-read, re-apply, retry;
     if the semantic conflict survives re-application, park to office_hours
```

Commits are restricted to `intentions/` paths — a `graph-commit` that
stages anything else fails loudly. CI treats `intentions/`-only pushes as a
docs-class change (validate the graph, skip app pipelines). A record is
**schedulable once it is on `origin/main`** — the router only reads the
store at `origin/main`, never a branch. The audit a PR checkpoint would
have provided is supplied upstream: `/align` never writes
substance the author did not decide in the interview.

### 1.3 Parking (office-hours)

- **Apply:** any skill or the router sets `office_hours: {reason, since}`
  via `graph-commit`. Parking a strategy parks its subtree implicitly;
  tactics park individually.
- **Clear:** an interactive session's commit touching the node — the graph
  analog of the `UserPromptSubmit` strip hook. The office-hours queue view
  is a projection over `office_hours != null` nodes.
- **Not-claude-eligible work** is authored *born-parked* and decomposed
  into child tactics each sized for ≤30 author-minutes.

## 2. The align skill family

Two skills supersede `/file-issue` and `/plan-issue`: `/align` — the single
interactive entry point to the persistent layer, covering both the
interview and the fork onboarding funnel — and `/align-tactics`. `/align`'s
scope is the whole persistent layer (virtues, strategies, traditions,
delegations), not strategy alone; there is no separate virtue-review phase.
The scheduled `align` jit and its rung-5 dialectic engine are retired
outright, along with the old no-prompt corpus-staleness improvement pass;
their content is retained verbatim in `tactic-align-audit-legacy-review`,
an office-hours sitting deciding a possible future `/align-audit` skill.

### 2.1 `/align` (no prompt) — fork entrypoint and orientation

1. **Orient.** Concise description: a harness for long-horizon autonomous
   workflows built around the intention graph — virtues (permanent
   dispositions, roots), strategies (persistent, condition-bearing,
   signal-carrying goals), tactics (transient, completable, delegable
   work), delegations (attachment records). Graph primitives in one screen.
2. **Validate deployment.** A scripted check (per mechanical-floor
   doctrine — a script, not inline commands): intentionsutil installed and
   tests pass, store readable, `validateGraph` clean, router heartbeat
   wired.
3. **Walk to a prompt.** Socratic, one question at a time, over the
   inherited roots a fork begins with (the upstream repo's virtues and
   strategies are assumed preserved), until the practitioner has a crafted
   requirement prompt worth recording.
4. **Fall through.** Continue in the *same* session into §2.2's "with
   requirement text" branch using that crafted prompt — a direct
   fall-through inside one skill, not a hand-off to a second skill and not
   a re-invocation of the Skill tool on itself. If the session ends with no
   new or updated strategy, tell the user the dispatch router has no work
   until a strategy is recorded.

### 2.2 `/align <optional requirement text>` — record or revise under interview

1. **Frame.** Identify virtues newly defined and lacking strategies;
   evaluate the requirement text as a new node or an edit to an existing
   one (overlap detection against `strategy-*` nodes). A new strategy that
   needs a virtue it can serve records that virtue here — there is no
   separate virtue-review step. Invoked with no prompt, the session first
   runs the §2.1 onboarding funnel, which walks the practitioner to a
   crafted prompt and falls through into this same step.
2. **Interview (dialectic).** Align with the author on: intent;
   justification by virtues or parent strategies (`serves`/`parent`
   placement); benefit; signals (`success_signal`); the author
   circumstances the strategy is contingent on (`attributes.conditions`).
   Present edge cases and consequences; resolutions recorded as dated
   `clarifications`. For UI-design requirements, supplement the
   ask-questions tool with the design system's design canvas: build
   mockup/variant artifacts on `@commons-systems/ds`, sync via DesignSync
   to the claude.ai/design canvas, and put competing interpretations and
   edge cases in front of the author visually. Canvas artifacts are
   interview aids, not deliverables. (Caveat: a freshly synced component is
   absent from the canvas until the project is opened/refreshed.)
3. **Advise on delegation and capture.** Propose `recovers` edges and
   review-trigger updates where the strategy touches a delegation; flag
   capture risk per the delegation kind's divergence/irreversibility axes.
4. **Retain draft tactics.** Tactical context naturally developed during
   the session is dumped into draft tactic nodes (`status: raw`, no
   execution phase, `serves` the strategy) — retain, not refine.
5. **Record.** `graph-commit` the node(s). The interview is the audit — the
   draft review gate is its second reader, not a substitute (2026-08-11
   gate clarification on strategy-graph-native-dispatch); the push makes
   the strategy schedulable. Editing a strategy with open
   non-draft tactics queues a soft freeze and re-evaluation of the open
   subtree — warn the author at record time (clarification 10).

### 2.3 `/align-tactics <strategy-node-id>` — break a strategy into executable tactics

Runs autonomously; parks on office-hours under the same conditions as
`/plan-issue` — never `AskUserQuestion` mid-run.

1. **Scope.** Read the strategy node, clarifications, conditions, signal,
   round history, and any draft child tactics. Drift review is two-sided
   (clarification 8): a failed recorded condition parks the strategy back
   to `/align` territory; AND the session sweeps for unrecorded
   conditions the round's plans newly depend on — a material discovery is
   proposed as a dated clarification and parks for author ratification;
   immaterial observations land as clarifications without interrupting.
2. **Decompose to the signal.** Minimum work to validate the
   `success_signal` this round — including, when `reading` is null, an
   instrument tactic. Consume draft tactics: finalize, split, merge, or
   prune. PR-sized leaves; subtrees via `parent` edges; order with
   `blocked_by`; stamp the factual `validates` edge on the tactics that
   validate the signal. Off-path work worth recording lands as an ordinary
   tactic with no flag — off-path status derives from the absence of a
   chain to a validates-terminal, demoting it via calculated attention —
   never deferred by omission (clarifications 9, 11).
3. **Plan each claude-eligible tactic** into the node body with per-unit
   `Recommended model` (implement-unit heuristic). Lands
   `phase: implement`.
4. **Park non-claude-eligible tactics** born-parked, ≤30 author-minutes.
5. **Record.** One `graph-commit` per tactic (or small batch); stamp the
   strategy's round accounting and each tactic's
   `execution.strategy_fingerprint`. Re-evaluation mode (clarification
   10): invoked on fingerprint mismatch, the session amends, prunes, or
   confirms the open tactics instead of decomposing fresh, then re-stamps.

### 2.4 Execution phases

Once a tactic is on `origin/main` with `phase: implement`, the router walks
it through the same phase skills as today — the `implement → qa → review`
progression, with `fix` as the CI-failure interrupt entered from any of
them (§1.1, strategy clarification 18) — with two changes: phase is read
from and written to the node instead of derived from labels, and
completion markers, attempt counters, and parking are `graph-commit`
writes instead of label edits. Phase-skill internals (worktree isolation,
`/implement-unit` delegation, `/commit-merge-push`, QA/review fan-outs
with their own internal content-fix loops, auto-merge on clean review)
carry over unchanged.

The `qa` phase in particular keeps full legacy `qa-fix` parity (strategy
clarification 20): it is the autonomous half of **user-acceptance QA**,
never a re-run of the automated checks. The phase merges `origin/main`,
authors a genuine QA plan from the live context (triage-classified
items: script-verifiable / needs-browser / needs-human-judgment),
validates the delivered behavior *independently* against the tactic's
stated intent and real data — the live store, deployed surfaces, public
seed data — and classifies residue on the four-class disposition axis
(opus-fixable → the phase's bounded internal fix loop, needs-main →
residue recorded on the node, verified post-merge in its `main-qa` phase
— clarification 22, §1.1; never a filed artifact, needs-human →
`office_hours` park, already-satisfied → pass), recording the summary on
the PR. The plan's ```verify blocks are the floor, not the phase;
reproducing the implementer's own claimed checks is not QA (precedent:
PR #2752's capture-term bug, invisible to the checklist re-run, found
immediately by the independent real-data pass). This binds
bootstrap-emulating sessions (§3.3) equally: the `qa → review`
transition write asserts the validation happened, not that the checklist
re-ran.

The `review` phase binds the same way (strategy clarification 21): it is
the full `/review-fix` fan-out — surface-conditional finders in parallel
→ code dedup → classify → adversarial verify with severity-scaled
skeptics → the Opus fix lane → disposition recorded in the PR review
comment — not a single-agent read-through, and never skippable
(precedent: PRs #2750/#2748/#2742 merged with no review phase at all
under the bootstrap doctrine; the retroactive independent round's
findings became the clarification-19 deferral drafts). The
`review → done` transition write asserts the fan-out ran, not that CI is
green.

One further amendment (strategy clarification 19): the
review fan-out's finding disposition is graph-native. A confirmed finding
that breaks the tactic's own stated contract blocks `review → done` and
is fixed inside the phase's content-fix loop; real but out-of-contract
findings land as draft tactics batched per component (never as gh
follow-up issues — no `dispatch:review-followup` label and no
orphan-retriage analog: drafts are inert, and the finalizing
`/align-tactics` round validates finding provenance against what actually
merged), demoted below round tactics by calculated attention
once a later `/align-tactics` round finalizes them; refuted or
below-threshold findings are recorded only in the PR review comment.

## 3. The router

### 3.1 Eligibility

A **strategy** is eligible for an `/align-tactics` session iff:

- `office_hours` is null, and
- it has no **non-draft child tactics on its signal path** (drafts are
  input, not blockers; off-path tactics — no `blocked_by`/`parent` chain
  to a `validates`-terminal — linger at derived demoted rank by design),
  and
- its signal is not validated: `gap` non-null, or `reading` null, and
- the fresh-reading gate passes: `rounds.count == 0`, or a reading exists
  newer than `rounds.last_completed`, and
- `rounds.count < 2` (at the cap, the router parks it instead).

A **tactic** is eligible for its **phase skill** (e.g. `/implement`,
`/fix-checks`, `/qa-fix`) iff `office_hours` is null, `phase` is neither
`draft` nor `done`, its `blocked_by` set is fully complete, and its
phase's sensor gate is satisfied. A frozen tactic — draft/raw (`phase`
absent), or soft-frozen per the gate below — is ineligible for its phase
skill by this same test, but is separately eligible for an
`/align-tactics` session per the next paragraph.

A **frozen tactic** (draft/raw, `phase` absent; or soft-frozen, per the
soft-freeze gate below) is eligible for its own `/align-tactics` session
iff `office_hours` is null and its `blocked_by` set is fully complete —
parallel to how a strategy is eligible for its own `/align-tactics`
session above. This is the first-class-selectability behavior implemented
by `selectGraphTargets` in `packages/intentionsutil/src/router.ts`.

A strategy with one or more eligible frozen descendants resolves, as the
`/align-tactics` candidate, to its highest-ranked frozen descendant (by
the same resolved-attention rank and ordering used everywhere else) —
not to the strategy node itself; a strategy with no tactic children (a
zero-tactic strategy) resolves to itself. The implementing primitive is
`resolveFrozenDescendant` in `packages/intentionsutil/src/router.ts`.

Within one attention-rank level, candidates now sort by a **progression
ordinal** over the full schema `PHASES` order — `draft < align-tactics <
implement < fix < qa < review < main-qa < done` — more-progressed first.
This generalizes and replaces the old closest-to-done `PHASE_LADDER`
(see §3.2, which also needs the corresponding update). It reorders `fix`
and `qa`: under the progression ordinal, `qa` (further along the
pipeline) now sorts before `fix`, the opposite of the old ladder's `fix`
before `qa`.

**Soft-freeze gate** (clarification 10): before selecting within a
subtree, the router recomputes the serving strategy's substance
fingerprint; any open tactic stamped with a stale
`execution.strategy_fingerprint` freezes the subtree — no new selections,
in-flight phases finish, one re-evaluation `/align-tactics <tactic-id>`
session is queued **per frozen tactic** in the subtree (not a single
strategy-level session) — each frozen tactic re-surfaces individually as
an `align-tactics` candidate at its own node id, per `selectGraphTargets`
— the freeze is logged to the selection log. State writes
(`reading`/`gap`/`rounds`/`office_hours`) never change the fingerprint.

### 3.2 Selection

1. current-worktree continuation → 2. main-health gate → 3. **resolved
attention rank, outermost** (already graph-native via `resolveAttention`;
strategies and tactics compete in one order; calculated attention is a
weighted sum of read-time-derived terms — explicit author attention (an
`override` pins), signal satisfaction (structural reachability to
`validates`-terminals of unvalidated signals), capture resolution (from
`recovers`-edge delegation axes) — with new conditions added as terms,
never bands; clarification 11) → 4. within a rank level, the progression
ordinal over the full schema `PHASES` order (`draft < align-tactics <
implement < fix < qa < review < main-qa < done`) sorts more-progressed
first, i.e. closest-to-done first: `main-qa → review → qa → fix →
implement → align-tactics`. This reorders `fix`/`qa` relative to the old
closest-to-done ladder (which had `fix` before `qa`); `align-tactics` now
covers both a strategy candidate and a frozen-tactic candidate at that
same directive rung. Topic categories retire — topical priority is
authored attention on the owning strategy.

Claimed-set, reservation ledger, concurrency pacing
(`dispatch-target-workers` curve), the selection lock, and the
`dispatch-spawn-tick` heartbeat carry over unchanged — the heartbeat is the
seam: the tick consults **both** selectors during coexistence.

Pacing keeps full legacy parity (clarification 14): the weekly cumulative
curve is the binary spend gate, the 5-hour linear ramp decides the
concurrent worker count, and one pace budget spans both routers and both
node kinds — a strategy's `/align-tactics` session counts as a worker.
Telemetry and tunables stay operational config outside the graph. The
legacy `priority` label's bypass maps to the authored `pace_exempt` flag:
at a paced-to-zero budget the tick probes pace-exempt eligible nodes and
admits one gate-exempt worker — bypassing the gate, not the count or the
order — with `dispatch-target-workers --exhausted` as the hard floor no
flag overrides (main-broken parity).

**The concurrency cap is global** (2026-07-06 interview): the
`max_concurrent_workers` bound (config default 8) caps the TOTAL of
dispatch-managed workers live at any moment across all ticks, workflows,
and lanes. The enforcement point is selection — busy + reserved counted
from the ledger and liveness against the pace target, selecting only the
gap. Per-workflow caps (`dispatch-graph-tick`'s `worker_cap`, an emulated
tick's semaphore) are local backstops, never the enforcement point: two
overlapping workflows each locally capped at 8 would otherwise run 16.
Overlapping ticks are safe via claims, not serialization — a tick's
lifetime ends at spawn; every selected node enters the reservation ledger
at selection under the lock; the node-id-named runner session carries the
claim for the phase's life; the sweep reconciles dead workers; a
concurrent tick re-selects only unclaimed nodes. A single long-lived
multi-node workflow is never the router mode — its subagents are
invisible to node-id liveness, so it cannot carry claims.

**Worker-start re-validation** (2026-07-06 interview): two gates bracket
every worker, with no mid-run polling. At start, the provisioning
prelude re-validates against fresh `origin/main` — node exists, persisted
phase equals the selected phase (passed as an argument), `office_hours`
null, strategy fingerprint unchanged where stamped; mismatch is a
distinct exit and the next tick re-selects (a selected-but-unstarted
worker counts as NOT started and yields to a soft freeze). The same
prelude carries the **scope chain of custody** (chain-of-custody
clarification, 2026-07-06, superseding the same-day scope-fingerprint
entry's stay-at-completed-phase clause): a fix/qa/review worker starts
only if the current **scope fingerprint** (statement + body hash;
frontmatter state fields never included) equals the previous phase's
stamp beside the worktree (`<fingerprint> <origin-main-sha>`); on pass
the gate re-stamps. At write, the transition-time gate compares against
the running phase's own stamp — a stale strategy fingerprint holds the
transition for re-evaluation; a stale scope stamp (either gate) writes
the backward transition `phase := implement` instead of a hold, with the
`<stamped-sha>..origin/main` node-file commit range recorded in the
demotion commit and on the PR as the routing-back provenance. Merge
therefore requires an unbroken implement → qa → review chain all
executed against the merge-time scope; machinery body appends (residue)
never break custody because the transition writer refreshes the stamp to
its post-write fingerprint. Demotion is pre-merge only — post-merge
staleness routes per main-qa parity (§1.1). Author edits to a claimed
tactic's scope still land freely and bind from the next selection; park
the node to interrupt outright. Implementation:
`tactic-worker-start-revalidation` (detect/stamp side) and
`tactic-graph-router-transitions` Unit 1 (verify/demote side, the
`demote-node-to-implement` primitive).

**No session keepalive** (2026-07-06 interview): the graph is the
long-horizon substrate; sessions are disposable executors. Continuity is
durable state on `origin/main` re-entered by the cron heartbeat — dead
ticks, workers, and queues recover by re-selection plus ledger sweep,
never by resuming or keeping alive a session. A phase worker may run
long; the ban is the router-as-session.

### 3.3 Coexistence and drain

The two routers run in parallel over **disjoint state** — no gh↔graph
mapping exists between them. (The prior migration strategy — mapping gh
issues to/from graph tactics via `intention-emit`, `backfill`/`refresh`,
`trackers/`, and the `rank-map.ts` ordering bridge — is superseded and its
machinery removed. Integration with an external tracking system such as
GitHub is a separate strategy; design TBD.)

- One lock, one pace budget, one claimed set spanning both routers.
- The legacy router only **drains**: it advances its existing gh
  issues/PRs, ordered by its own ladder (graph rank no longer reaches it);
  new work enters exclusively via `/align` → `/align-tactics` as
  graph tactics.
- **Removal:** when the gh queue is empty, delete the legacy
  selector/phase-derivation scripts and the `dispatch:*` label
  conventions.
- **Bootstrap transitions (clarification 15):** until
  `tactic-graph-router-transitions` lands, no machinery advances a
  graph-native tactic's phase on `origin/main` — so a completing session
  writes the transition itself as a state-only commit (never on the work
  PR branch; squatted `attributes.*` until the schema tactic merges;
  delivered as a state-only PR until `tactic-intentions-branch-protection`
  lands). Without that write, the next phase worker — fix, qa, review —
  is never scheduled. The write asserts the phase's full semantics ran —
  an emulating session owes the phase skill's substance, not a checklist
  re-run; for `qa` that means the legacy `qa-fix` parity of §2.4
  (clarification 20), and for `review` the full `/review-fix` fan-out of
  §2.4 (clarification 21) — a review phase is never skipped past. An
  emulating session also owes the router's claiming semantics (2026-07-06
  interview): a reservation-ledger claim per selected node before fan-out,
  each cleared with its transition write — so a concurrent tick's budget
  and selection see the emulated workers, keeping the global worker cap
  (§3.2) intact under overlap. And it owes the scope chain of custody
  (§3.2): before each transition write it re-checks that no scope edit
  landed after its phase's fresh read, and when it finds a post-read
  edit — or a scope edit that landed after an earlier phase already
  completed — it writes the demotion to `implement` instead of the
  forward transition.

### 3.4 Worktree anchoring and claiming

The `<issue-num>-<slug>` branch convention is re-keyed to node ids, and
the rule is uniform across node kinds (clarifications 12–13): every
launched worker — a tactic's phase session or a strategy's
`/align-tactics` session — enters the one claimed set / reservation
ledger under its node id and runs in a dedicated worktree keyed by that
id. The strategy claim closes the duplicate-spawn window while an
in-flight `/align-tactics` session's tactics have not yet landed on
`origin/main` (the eligibility gates alone would still pass); the
uniform worktree gives liveness detection (live session ⇔ worktree) one
rule for both kinds. Draining legacy gh work keeps its numeric form, so
both keyspaces coexist.

**Worktree substrate (clarification 23):** `main` is checked out at the
project root (`~/natb1/commons.systems`), and a node-id worktree is a
Claude Code native worktree at the harness default location —
`<project-root>/.claude/worktrees/<node-id>` — entered via the native
worktree tooling (EnterWorktree) in sessions and provisioned by launch
scripts as a plain `git worktree add` into that same path. No
graph-native machinery assumes the legacy `.bare` shared-common-dir +
sibling `worktrees/` layout: those persist only as backward
compatibility for the draining gh lane (which keeps its numeric
worktrees where they are) and their conventions retire with
`tactic-legacy-router-removal`.

**Tick execution is workflow-native (clarifications 24–25):** selection
hands the node-id set to a thin tick workflow script (the Workflow
primitive) that fans out one `agent()` per selected node — never to the
legacy launch scripts, which stay issue-lane-only and retire with the
drain. The directive per node is `/align-tactics <id>` for a strategy or a
frozen tactic (draft/raw, or soft-frozen), the tactic's persisted `phase`
mapped to its phase skill for a non-frozen open tactic;
`dispatch-route`'s label/PR-derived phase derivation does not apply to
node targets (phase is persisted, clarification 1). Mechanics stay owned
and deterministic per the thin-script condition: agents invoke a
`provision-node-worktree` primitive (the deterministic provisioning
prelude, preserving the merged-tree guarantee) and `graph-commit` as
single commands. Ticks are phase-granular — a tick executes only
currently-eligible phases and exits; transition writes schedule the next
phase next tick; a dead tick recovers by the next tick's re-selection
(workflow resume is same-session only). Launch-failure dispositions park
the node via the `office_hours` graph write. Scoped in
`tactic-graph-router-selector` unit 4.

## 4. Coverage matrix

Every legacy behavior maps to a home in the new family; nothing silently
drops.

Behavior inventory anchors: both SKILL.md bodies were replaced by retirement
stubs under `tactic-legacy-router-removal` Unit 2, so the inventories this
matrix was derived from are no longer in the working tree. Read them at the
pre-retirement blobs (`8e693b5d` is an ancestor of `origin/main`):

```
git show 8e693b5d:.claude/skills/file-issue/SKILL.md   # 616 lines
git show 8e693b5d:.claude/skills/plan-issue/SKILL.md   # 691 lines
```

Any future audit of this matrix's completeness must diff against those blobs,
not against the stubs.

### `/file-issue` → `/align` + `/align-tactics`

| Legacy behavior | New home |
|---|---|
| Multi-topic separation into independent issues | `/align` frame step: multi-strategy separation; independent tactic subtrees per strategy |
| Duplicate detection (keyword + corpus scan) | `/align` overlap detection over `strategy-*` nodes; `/align-tactics` over open tactic nodes |
| 8-category quality evaluation | Interview dialectic (compliance/clarity/correctness/recommendations folded into interview probes); relevance + open-alignment = drift review in `/align-tactics` step 1 |
| Decomposition hard gate (leaf = one PR) | `/align-tactics` step 2 — PR-sized leaf invariant, subtrees for larger shapes |
| Epic structuring (sub-issues + epic label) | Tactic subtrees via `parent` edges; `resolve-epic` becomes subtree-completion pruning |
| Type/topic classification | Retired as ordering input (topics were a rank proxy); attention on the owning strategy is the ordering |
| `blocked_by` dependency wiring | `blocked_by` tactic edges (already the recorded blocking design) |
| `--follow-up` provenance, sentinel return block, attribution sidecars | Provenance = `serves` edge + emitting session in the commit; return contract = written node ids |
| Review-phase deferred filings (`/review-fix` follow-up issues) | Draft tactics batched per component, finalized by a later `/align-tactics` round (strategy clarification 19); refuted/below-threshold findings live only in the PR review comment |
| QA needs-main follow-up filing (`qa-fix` Step 3.6 → main-qa issues) | Retired as an artifact — needs-main residue rides the source tactic into its `main-qa` phase; the qa-main handler verifies against prod (strategy clarification 22, §1.1) |
| Finalize (assign, `help wanted`) | Retired — presence on `origin/main` with `phase` set *is* schedulability |
| `fix-checks`'s Flake sub-path (find-or-file a flake-tracking issue, `blocked_by` the PR's tracked issue) — an indirect `/file-issue` caller, missed by the direct-caller rows above; dead on the node lane since GitHub Issues are disabled repo-wide (strategy clarification, 2026-07-16) | Find-or-create a fingerprint-keyed **tactic node** (fingerprint/reproduce-command/diagnosis in the body) and set `blocked_by` on the **source tactic** directly — no office-hours escalation; the router's existing `blocked_by`-completeness gate (`blockersComplete` in `packages/intentionsutil/src/router.ts`) already re-surfaces the source tactic once the flake-fix tactic reaches `phase: done`. Tracked by `tactic-fix-checks-graph-native-flake-tracking` |

### `/plan-issue` → `/align-tactics`

| Legacy behavior | New home |
|---|---|
| Idempotency via plan-comment marker | Plan-in-body presence + `phase` field |
| Relevance/drift review, convention drift, merged-PR overlap | Step 1 drift review (unchanged in substance) |
| Open-blocker re-check | `blocked_by` edge completeness check |
| Sequencing auto-defer on unmerged-PR precondition | `blocked_by` edge on the owning tactic; conservative aggregation → park |
| Explore/Plan subagent fan-out, reuse-first, design proposals | Step 3, unchanged |
| Plan-comment schema (Context/units/Scope/model/Dependencies/Reuse/Verification+```verify) | Tactic node body, same schema |
| Per-unit model tags (`sonnet`/`opus`, implement-unit heuristic) | Same, heuristic home unchanged (`implement-unit/SKILL.md`) |
| Clarification/deviation gate → office-hours, no `AskUserQuestion` | Same conditions → `office_hours` field |
| `dispatch:planned` label, marker-before-label ordering | Single atomic `graph-commit` landing plan + `phase: implement` together — the ordering hazard disappears |
| Trivial-task skip | Unchanged |

## 5. Subtree (round 1, recorded 2026-07-03; re-evaluated same day)

**Current state (2026-07-10, self-consistency sweep):** ten of the fifteen
round-1 children have completed and been pruned from the graph; five remain
open, all `phase: implement` — `tactic-graph-router-transitions`,
`tactic-phase-skill-node-targets`, `tactic-main-qa-phase`,
`tactic-dispatch-lifecycle-sensor` (validates-terminal), and
`tactic-legacy-router-removal` (validates-terminal). The count and diagram
below are the historical round-1 decomposition, kept for the dependency order
they record; pruned nodes they name (the align-skill tactics, the schema,
graph-commit, router-selector, calculated-attention, the two hardening
children, branch-protection) no longer exist as graph files.

Fifteen children: the eleven round-1 nodes below, each a leaf = one PR
unless noted, plus two clarification-19 deferral children finalized
2026-07-04 (`tactic-graph-commit-hardening`,
`tactic-graph-write-validation-hardening` — off-path, outside the
diagram), plus the clarification-20 re-evaluation child
`tactic-phase-skill-node-targets` and the clarification-22 child
`tactic-main-qa-phase` (both on-path, in the diagram). `blocked_by`
(under `attributes` until the schema tactic promotes it) encodes the
order:

```
tactic-graph-dispatch-schema ──────────────┬──► tactic-calculated-attention ─┐
tactic-intentions-branch-protection (park) ┤                                 │
                                           ▼                                 │
                                  tactic-graph-commit                        │
                                     │           │                           │
              tactic-align-strategy-skill   tactic-align-tactics-skill       │
                     │               │           │                           │
  tactic-align-init-skill (off-path) ◄┤   tactic-graph-router-selector ◄── also blocked_by schema
                                     │           │                           │
                                     │   tactic-graph-router-transitions ◄── also blocked_by graph-commit
                                     │           │           │               │
                                     │           │  tactic-phase-skill-node-targets
                                     │           │           │               │
                                     │           │   tactic-main-qa-phase   │
                                     │           │           │               │
                                     │   tactic-dispatch-lifecycle-sensor [validates]
                                     │           │           │               │
                                     └──► tactic-legacy-router-removal [validates] ◄─┘
                                            + drain gate (plan step 0)
```

- **Validates-terminals:** `tactic-dispatch-lifecycle-sensor` (produces
  the strategy's reading — the round-1 instrument, required because
  `reading` is null) and `tactic-legacy-router-removal` (meets the
  threshold). Every node with a `blocked_by`/`parent` chain into them is
  on-path by derivation.
- **Born-parked:** `tactic-intentions-branch-protection` — author-only,
  ≤30 minutes.
- **Off-path:** `tactic-align-init-skill` — no chain to a validates-terminal
  reaches it, so the calculated-attention signal term demotes it at read
  time; no stored flag (clarifications 9/11). Round 1 had deferred it by
  omission.
- **Re-evaluations (2026-07-03):** four same-day mid-flight strategy edits
  (clarifications 8–10, then 11, then 12–14, then 15), each followed by
  the clarification-10 re-evaluation run inline because no router exists
  yet. The first added the attention tactic and recorded the `/align-init`
  deferral; the second replaced the banded backlog mechanism with
  calculated attention: `tactic-signal-path-attention` was pruned and
  replaced by `tactic-calculated-attention` (on-path — it hard-blocks
  legacy removal), the `backlog` flag was removed from the store, and
  `validates` edges were stamped on the two terminals. The third recorded
  worker concurrency/claiming and pace parity: `pace_exempt` added to the
  schema tactic, strategy-id claiming, the pace-exempt probe lane,
  uniform node-id worktree keys, and the node-target launch chain (unit
  4) added to the selector tactic, §1.1/§3.2/§3.4 amended; no tactic was
  pruned and no `blocked_by` changed. The fourth recorded the
  bootstrap-transition doctrine after the first graph-native implement PR
  (#2742, the schema tactic) opened with no path to scheduling its own
  qa/review/merge: §3.3 gained the bootstrap bullet, and the transitions
  tactic's context/unit 1 now state the write-is-scheduling parity rule,
  the by-hand interim, and explicit auto-merge arming; no tactic was
  pruned and no `blocked_by` changed.
- **Re-evaluation (2026-07-04, clarifications 18–19):** run inline (no
  router yet), triggered by the fix-interrupt record (18) and the
  review-finding disposition doctrine (19). 18 was already propagated
  (§1.1, §2.4, the transitions tactic). 19 added the §2.4 disposition
  amendment, the review-deferral row in the §4 coverage matrix, and —
  the doctrine's first application — finalized the two deferral drafts
  from the same-day review of PRs #2750/#2748/#2742 into off-path
  children with clean-session plans:
  `tactic-graph-commit-hardening` (gated in-plan on the in-scope fix PR
  #2751 merging) and `tactic-graph-write-validation-hardening`. All
  `execution.strategy_fingerprint` values remain null — stamping starts
  when the schema/attention machinery for it lands; until then the
  freeze-on-mismatch rule is discharged by running the re-evaluation in
  the same session as the strategy edit, as in every round above. No
  round-1 tactic was pruned and no `blocked_by` changed.
- **Re-evaluation (2026-07-04, clarification 20):** run inline (no router
  yet), triggered by the qa-parity doctrine recorded live from the first
  emulated qa run on `tactic-calculated-attention` (PR #2752): the first
  pass re-ran the implementer's checklist and wrote `qa → review`; the
  author-directed independent pass against the real delegation records
  found a capture-term scoring bug the same day, forcing a revert and a
  genuine re-QA. 20 added the §2.4 qa-parity paragraph. The re-evaluation's
  author-prompted second pass then swept the open plans against the
  doctrine and found the seam gap the parity assumption hid: selector
  unit 4 invokes the four legacy phase skills in node-id worktrees, but
  every skill hard-rejects non-`<N>-…` names at Step 0 and keys context,
  plan source, completion, and escalation to the gh issue keyspace (the
  Stop hook resolves its park target from the `<N>-<slug>` job name), so
  launched phase workers would exit 1 and escalations would park nothing.
  Added the fourteenth child `tactic-phase-skill-node-targets` (on-path;
  blocked_by transitions) and wired it into
  `tactic-legacy-router-removal.blocked_by`. No tactic was pruned; the
  align-skill tactics needed no amendment (their plan schema already
  mandates the Verification content qa consumes).
- **Re-evaluation (2026-07-04, clarifications 21–22):** run inline (no
  router yet), triggered by the author's review-parity question after the
  clarification-20 round. 21 generalizes 20 to review — the full
  `/review-fix` fan-out is owed, never skippable (precedent: PRs
  #2750/#2748/#2742 merged with no review phase); §2.4 gained the
  review-parity paragraph and §3.3 names review in the emulator
  obligation. 22 resolves the qa needs-main output seam with the
  extended-lifecycle design chosen over a separate child tactic, a
  deferral draft, and a gh carve-out (rejected outright): `main-qa`
  joins the phase enum as a phase of the source node (§1.1, §3.2 ladder,
  §4 matrix row). Subtree changes: added `tactic-main-qa-phase`
  (on-path; blocked_by `tactic-phase-skill-node-targets`), added Unit 3
  (deferral/residue output seams) to `tactic-phase-skill-node-targets`,
  amended `tactic-graph-router-transitions` Unit 2 (reconciler routes
  merged-with-residue to `main-qa`) and `tactic-graph-router-selector`
  (ladder + directive mapping), and wired `tactic-main-qa-phase` into
  `tactic-legacy-router-removal.blocked_by`. No tactic was pruned.
- **Re-evaluation (2026-07-05, clarification 23):** run inline (no router
  yet), triggered by the author's repo re-anchoring — `main` checked out
  at the project root with Claude Code managing worktrees natively at the
  default `.claude/worktrees/` location; `.bare` and the sibling
  `worktrees/` container are backward compatibility for the draining gh
  lane only. §3.4 gained the worktree-substrate paragraph;
  `tactic-graph-router-selector` Unit 3 was re-scoped from
  worktree-create.sh node-id naming to native default-location placement
  (Unit 4's worktree path follows it);
  `tactic-phase-skill-node-targets`'s manual verification names the
  native location; and `tactic-legacy-router-removal` Unit 1 now retires
  the legacy worktree-layout conventions with the drain. No tactic was
  pruned and no `blocked_by` changed.
- **Re-evaluation (2026-07-06, clarifications 24–25):** run inline (no
  router yet), triggered by the author's substrate question after the
  first emulated router tick ran as a Workflow-tool script (12 eligible
  tactics fanned out concurrently, 6 draft PRs). 24 records the
  greenfield decision: tick execution is workflow-native — selection,
  transitions, and provisioning mechanics stay owned deterministic code;
  the launch layer becomes a thin workflow fan-out; the legacy spawn
  chain is never extended to node ids and retires with the drain (no
  fallback executor); ticks are phase-granular with dead-tick recovery by
  re-selection. 25 records the guardrails: the thin-script condition
  (added to `attributes.conditions`) and the capture entry on
  `delegation-anthropic-claude` (divergence import + review trigger).
  Propagated: §3.4's launch-chain paragraph rewritten,
  `tactic-graph-router-selector` unit 4 re-scoped from the launch-chain
  extension to the workflow tick harness,
  `tactic-legacy-router-removal` unit 1 now deletes the launch chain
  whole. No tactic was pruned and no `blocked_by` changed.
- This parent is not directly executable (no `phase`); it completes when
  its last child completes, which stamps the strategy's `rounds`.
