# Survey: incumbent doctrine on transient disposition and the tactic pain point

Scope: `/home/n8/natb1/commons.systems/intentions/` on `main` (read-only,
legacy graph, frozen evidence). All quotes verbatim from the cited file:line.
Line numbers are the numbers shown by `sed -n` / `grep -n` against the file as
it stands on `main` at survey time (2026-09-02/03).

---

## (A) The shim principle and shape

**Definition (kind layer).** `kind-kind.md:328-330`, inside the reconciliation
vocabulary's FRONTIER refinement:

> "SHIM - an incumbent-form artifact or contract minted or retained
> post-ratification, declaring its target element and liquidation condition;
> outliving the condition is a frontier item."

**Ratified principle (strategy layer, fuller statement).**
`strategy-graph-native-dispatch.md:7035-7040` ("What is the bootstrap shim
principle, and how do shims work in practice (2026-09-01)?"):

> "PRINCIPLE, ratified: any incumbent-form artifact or contract text minted or
> retained post-ratification declares (i) the target element it bootstraps and
> (ii) its LIQUIDATION CONDITION - which machinery going live retires it; a
> shim outliving its condition is a frontier item. This generalizes the
> carrier exception on the architecture clarification."

Practice — when shims are declared versus produced, `strategy-graph-native-dispatch.md:7040-7046`:

> "PRACTICE: shims are DECLARED at alignment time - a round that records
> target doctrine ahead of implementation reclassifies, in the same round, the
> incumbent artifacts that keep running as shims (the declaration is cheap
> prose and is the work) - and PRODUCED at claim time, when an implementing
> session mints scaffolding the build requires (adapters, caches such as
> stored-phase-beside-derived-position, carrier nodes); either way the
> declaration is written when the shim comes into being, never retrofitted by
> audit."

Why a shim is not just "merging code" — `strategy-graph-native-dispatch.md:7046-7051`:

> "DIFFERENCE FROM MERELY MERGING CODE, recorded because the parsimony is the
> point: it IS merging code, plus exactly three thin guarantees raw merging
> lacks - provenance (every merge is a claim bound to a sanctioned criterion; a
> diff satisfying none is an unmatched-evidence finding), monotonicity (the
> ratchet forbids regression of ever-passed checks), and mechanical
> temporariness (liquidation conditions keep scaffolding visible until
> removed)."

Tradition references cited for the shim principle, same clarification,
`strategy-graph-native-dispatch.md:7051-7056`:

> "TRADITION REFERENCES: expand/migrate/contract parallel change (the contract
> phase is mandatory; skipping it is the named failure); feature-toggle
> lifecycle discipline (toggles carry owners and expiry, toggle debt is the
> named pathology, expired-flag CI failure is the ratchet analog); the
> strangler fig (the half-strangled system living forever is the named
> failure); branch-by-abstraction (the abstraction layer is declared temporary
> at introduction); deprecation-as-process with ratcheted prevention of new
> uses (Software Engineering at Google, deprecation chapter)."

**Schema shape** — `attributes.shims`, `kind-kind.md:580-593`:

> "shims: an incumbent-form stand-in for a target-state surface this
> migration has not yet reached, declared per the shim principle
> (2026-09-01) — each {id, target, liquidation, liquidated_by, declared}.
> target is the target-state element the shim stands in for; liquidation is
> the prose condition under which it is safe to remove, verbatim;
> liquidated_by is a check id or criterion id when that condition is
> genuinely machine-expressible today, else null; declared is the YYYY-MM-DD
> the shim was recorded. A shim whose liquidated_by resolves to a check that
> is gating and passing, or to a satisfied criterion, while still declared,
> is an overdue-shim item on the reconciliation frontier
> (deriveShimFrontier, packages/intentionsutil/src/shims.ts); a null
> liquidated_by is live, never overdue, and still counts toward the
> live-shim count. Valid on any node. Shape enforced by validateGraph rule
> 28"

The deriver's concrete signature, `tactic-migration-frontier-projection.md:543-546`:

> "`deriveShimFrontier(nodes, tiers, criteria): FrontierEntry[]` — one
> `overdue-shim` entry per shim whose `liquidated_by` resolves to a check that
> is gating **and** passing, or to a satisfied criterion, while the shim is
> still declared. A shim whose `liquidated_by` is `null` (condition not
> machine-expressible) is **live, not overdue** — it still counts toward the
> live-shim total."

`tactic-migration-frontier-projection.md:590-591` (the live-shim count as a
cheap machine signal) and `:197-201` (the shim inventory as one of the
frontier's six absorbed sources):

> "6. **The shim inventory.** Live shims with liquidation conditions (shim
> principle, 2026-09-01). A liquidation-overdue shim surfaces as a frontier
> item, and the live-shim count is a cheap machine signal for the observe
> loop."

Discipline on the prose itself, `tactic-migration-frontier-projection.md:573-574`:

> "Do not paraphrase a liquidation condition — the prose is the author's."

**A worked example of the principle applied** — five bootstrap shims declared
in one clarification, `strategy-graph-native-dispatch.md:7340-7345` (id
truncated to the review shim; the same entry runs through QA, main-qa,
implicit-criteria, and finding-ledger shims, each with its own target and
liquidation):

> "(1) REVIEW SHIM: target = criteria-anchored review assessments with scoped
> basis pins; interim = the detached dispatch-code-review instrument exactly
> as measured — detachment, two-phase collect, the worktree flock/node lock,
> and no-kill-on-overrun are instrument facts, not doctrine. ... Liquidation:
> assessment/check machinery live — the cap and the effort tiering liquidate
> when criteria-anchored checks make convergence structural and effort
> derives from criterion class."

And the deferred-queue shim, `strategy-graph-native-dispatch.md:7173-7177`:

> "(1) DEFERRED-QUEUE SHIM, declared per the shim principle: the
> deferred-disposition review queue's target mechanism is a stamp-derived
> queue; no deriver exists yet; the interim surface is mechanical - grep -rn
> \"decision: deferred\" intentions/ - the documented office-hours practice
> until the deriver lands; liquidation condition: deriver live, with deriver
> ownership assigned to tactic-consolidation-operation at its finalization."

Even a hand-authored rule projection declares itself a shim on this principle
— `.claude/rules/greenfield-evaluation.md:3-11` (main checkout, not
`intentions/`, but the doctrine's own materialized instance):

> "This file is a hand-materialized projection of graph doctrine — sources:
> the full-frontier definition, the dual-perspective rule, and the overrule
> algebra on `intentions/strategy-explicit-intent.md` (all author-ratified
> 2026-08-31). The greenfield target is rules materialized from doctrine
> mechanically; until that machinery exists this file is a declared shim
> (liquidation condition: rules-materialization live)."

Confirmed on the node side, `tactic-context-materialization.md:74-76`:

> "The hand-authored `.claude/rules/greenfield-evaluation.md` (PR #3185) is
> the declared interim shim - its own header carries the projection notice
> and liquidation condition (rules-materialization live, owned here)."

**Write-class shims** — a second, narrower shim shape for fields rather than
whole artifacts, `kind-kind.md:734-739`:

> "A third value, `shared`, marks a declared **shim**: a field live writers of
> both classes touch today, recorded with a reason and a liquidation
> condition in `attributes.write_class_shims` rather than forced into a class
> that would break a live path or make the fence fail open."

Same idea, from the schema-surface owner, `tactic-intent-orchestration-layer-schema.md:255-259`:

> "Three fields resist a clean single-class answer today because live
> writers of both classes touch them. They are classified `shared` — an
> explicitly declared **shim** with a liquidation condition, per the shim
> doctrine — rather than forced, because forcing them would either break a
> live path or fail the fence open."

**A migration frontier item, distinguished from a shim** —
`kind-kind.md:780-785`:

> "`attention` is classified `intent`: it is a user-authored injection and no
> orchestration writer assigns it (`grep -rn "\.attention =" packages/intentionsutil
> .claude/skills` finds no assignment — the sole hit is a null comparison in
> `validateNode`). Its membership in `STATE_FIELDS`
> (`packages/intentionsutil/src/schema.ts`) therefore contradicts the
> classification; that contradiction is a migration frontier item, not a
> shim."

This is the doctrine's own boundary case: a shim is a *declared*, temporary
stand-in with a liquidation condition; an undeclared contradiction discovered
after the fact is a different frontier class (migration frontier item /
stale-intent item), not a shim retroactively construed.

---

## (B) Transient constraints and other transient classes the incumbent distinguishes

**TRANSIENT CONSTRAINTS**, examined in the same reconciliation-vocabulary
sitting as the shim definition, `kind-kind.md:373-379`:

> "TRANSIENT CONSTRAINTS, examined same sitting: transience is never stored -
> a standing obligation is a criterion whose activeness is the frontier
> projection, derived while unsatisfied and gone when satisfied; an
> operation-scoped one-shot constraint uses the SHIM shape (declared
> liquidation condition); claim-window state stays in claim records. No
> stored self-liquidating disposition class exists or is needed."

This single passage names three transient classes and assigns each one a home
that is not a hand-authored transient prose node:

1. A *standing obligation* → a criterion, derived-active via the frontier
   projection (never stored as "in force" state).
2. An *operation-scoped one-shot constraint* → the SHIM shape.
3. *Claim-window state* → claim records (see section C).

**ASSUMPTION as a fourth criterion class**, added later the same reconciliation
vocabulary node, `kind-kind.md:357-369` (refinement 7, /align conditions
round):

> "(7) ASSUMPTION joins the criterion class axis - a world-premise that makes
> a strategy's target state apt, the role kind-strategy's attributes.conditions
> carries today (apt at one scale and not another, author availability, an
> architectural premise holding). An assumption-class criterion is evaluated
> by ASSESSMENT (dated, expiring - generalizing conditions' standing-review-
> trigger role and the condition-sweep coverage mode), is never bitten as
> work, and an observed violation derives a re-derive-this-strategy-from-its-
> virtues frontier item, never a work item."

And the two other classes on the same axis, `kind-kind.md:344-347` (refinement
3):

> "CRITERION gains a class axis: FUNCTIONAL (strategy-specific, explicitly
> bitten) vs NON-FUNCTIONAL (standing cross-cutting, sanctioned once,
> implicitly bitten by every claim; the per-strategy effective set is a
> projection derived on read, never a stored copy)."

**Boosts as a transient class the author flagged as unresolved tension** —
authored priority boosts on tactics, read as "transient sequencing" rather
than standing ownership, `strategy-graph-native-dispatch.md:1420-1430`:

> "Noted tension, NOT resolved by the author this round: the persistent-layer
> ownership gate reserves STANDING boosts for the strategy layer, and live
> practice already diverges from it, since read-robust carries an authored 90
> on a tactic. The reading applied here is that these are transient
> sequencing boosts that expire when the tactics complete and are pruned,
> rather than standing ownership of a signal — flagged explicitly as Claude's
> reading rather than author-ratified doctrine, and left available for the
> review curriculum to revisit."

**No standing structure on a transient kind** — the general rule that
motivates the class distinctions, `strategy-graph-native-dispatch.md:501-509`:

> "No. Tactics are transient by definition; persistent structure lives on
> strategy (or virtue) nodes. This is why the main-health signal home is
> strategy-main-health rather than the auto-created fix tactic or a standing
> tactic: the fix tactic exists only per episode, and a standing tactic would
> put permanent structure on a transient kind."

**Persistent vs. transient by layer**, `kind-kind.md:31-35`:

> "Lifecycle differs by layer: virtues are unconditional (exceptionless in
> application, amendable only by deliberate dialectic — kind-virtue),
> strategies are persistent (they end only by condition-expiry or deliberate
> retirement), tactics are transient (removed from the graph on completion)."

---

## (C) What stays out of the graph: claim records, runtime state, operator configuration

**Claim-window state → claim records**, restated at `kind-kind.md:314-316`
(reconciliation vocabulary, WORK RECORD definition):

> "WORK RECORD - claim-window state (branch, PR, attempts, fix interrupt);
> minted, never edited; dies at merge."

And the operational layer that carries it, as distinct from a second
current-state layer, `strategy-graph-native-dispatch.md:6800-6806` (errata,
author-approved):

> "the strategy-scoped reconciliation architecture's operational layer -
> append-only evidence log plus claim records - is OBSERVED state under this
> same intent/orchestration boundary, not the refused second current-state
> layer. The 2026-08-31 keep refused a hand-maintained duplicate of target
> state; it stands unreversed."

**`orchestration` write-class = operational state**,
`tactic-intent-orchestration-layer-schema.md:206-207`:

> "`orchestration` (operational state — what is observed to be true, appended
> never authored)."

**Operational state is derived, not authored, and is where a run's live
signals live** — `tactic-ladder-reconciliation-observe.md:29-35`:

> "No per-PR criteria are minted: the criterion is standing, the run is
> operational state, the variance is derived."

**Runtime state kept out of the graph via worktree-local sidecars** —
`strategy-token-economy.md:1321-1327`:

> "WHY A SIDECAR: it keeps runtime state out of the graph, which the
> pace-machinery condition requires and which clarification 45 invoked when it
> rejected a graph-layer lock for \"putting runtime machinery in the graph\";
> and it matches two existing precedents on this exact surface —
> `.claude/worktrees/<id>.scope-fingerprint` and the `.code-review-lock`
> sidecar clarification 45 chose."

And the declined alternative, same node, `strategy-token-economy.md:1337-1339`:

> "TWO ALTERNATIVES DECLINED: recording the sha on the node (most durable, but
> puts runtime state in the graph against the condition above), and deriving
> it from the GitHub timeline..."

**Operator configuration is the opposite pole from transient runtime state** —
the pause-flag reclassification, `strategy-graph-native-dispatch.md:1660-1672`:

> "It becomes a dispatch.config/*.json boolean field, and that field is the
> SOLE mechanism — the sentinel is deleted, not retained as a second path or a
> compatibility shim. Default false (not paused), matching today's
> absent-sentinel default. Rationale: uniformity with the other
> operator-facing parameters (max_concurrent_workers, weekly_pace_floor_pct,
> and the worker auto-close toggle), all of which already resolve through
> dispatch-config-load; plus this strategy's own standing-mode condition,
> which makes pause durable operator configuration rather than transient
> runtime state."

Same reclassification, restated on the field's own carrier node,
`tactic-dispatch-pause-config-field.md:68-70`:

> "The move is a deliberate reclassification of pause from runtime state to
> durable operator configuration, justified by that same condition:
> paused-scheduling is a STANDING operating mode, not a degraded or temporary
> one."

Note the doctrinal symmetry: a **standing** mode is durable configuration
(belongs in `dispatch.config/`, not the graph, not a sidecar); a **claim-window**
or **per-run** fact is operational state (claim records / evidence log,
append-only, never hand-maintained); and neither is a node's intent-layer
prose.

---

## (D) Tactics: definition, lifecycle, recorded pain points

**Definition**, `kind-tactic.md:4`: "Tactic — a completable unit of
execution." Rationale, `kind-tactic.md:9-14`:

> "Tactics are the bottom layer: concrete, completable work. A tactic is not
> always a leaf — it may be a subtree. An epic is a tactic whose children are
> tactics, linked by `parent` edges. Tactics are also the delegable layer —
> delegating a tactic is expected and beneficial (it buys attention at the
> strategic level), and doing so creates or extends a delegation record
> (kind-delegation) where the attachment is assessed."

**Transience**, `kind-tactic.md:17-19`:

> "A tactic is transient: when it completes it is removed from the graph, and
> its edges go with it. Completion is marked by the author or by the dispatch
> workflow directly in the graph."

**Authoring test** (tactic vs. strategy), `kind-tactic.md:31-33`:

> "If fully achieving it would make you delete the node, it is a tactic; if
> achieving everything currently under it leaves a standing, condition-
> monitored posture, it is a strategy."

**Body = the execution plan**, `kind-tactic.md:45-48`:

> "The execution plan — clean-session-executable and authoritative
> (writeNode preserves tactic bodies verbatim across frontmatter rewrites),
> per kind-kind's body-function rule."

### Recorded pain points

**Pain point 1 — doctrine settled by a tactic must be relocated before the
prune, or it is lost.** `kind-tactic.md:38-44`:

> "A tactic is pruned on completion — where does doctrine it settled live?
> ... In the persistent layer, before the prune: settled doctrine, standing
> rules, and design decisions land on the strategy or kind node they belong to
> as part of completing the tactic — persistent intentions and beliefs belong
> in persistent layers by definition. Citing a pruned tactic id afterwards is
> legitimate (git history recovers it), but a citation is provenance, never
> the doctrine's home."

This is the drift-resistance mechanism *and* the pain point in one entry: the
graph depends on a discipline of relocating durable content off a tactic
before it disappears, and the failure mode (durable content left stranded on
a body that is about to vanish) is exactly what the reconciliation doctrine
later calls out as measured pain (section E).

**Pain point 2 — misplacement between strategy layer and tactic layer**,
`kind-tactic.md:49-56`, distinguishing standing requirements from completable
changes:

> "By the authoring test, applied to the content: a standing requirement —
> one that must still hold after every tactic currently serving the strategy
> completes and is pruned — lands in the persistent layer (a strategy or kind
> clarification); a completable change — fully achieving it would delete the
> node — lands as a tactic. One outcome often splits: the standing invariant
> is a clarification, its implementing fix a tactic."

The same clarification grounds this in Aristotle (hexis vs. kinesis),
`kind-tactic.md:60-66`:

> "persistent-layer content is hexis-like — held and exercised, complete at
> every moment of its holding, never finished (the ratified
> hexis-in-energeia reading on tradition-aristotle) — while tactic-layer
> content is kinesis-like — a process incomplete while under way and complete
> only at its terminal end (NE X.4 1174a-b; Metaphysics Θ.6 1048b)."

**Pain point 3 — provenance/position conflation is a recurring false-defect
trap**, `kind-tactic.md:71-89` (measured, not merely argued):

> "`status` is authoring provenance: it is written once at mint, and the
> dispatch ladder never advances it. `phase` is dispatch position, and is
> router-owned. So a tactic executed without an author dialectic ... finishes
> as `status: raw` with `phase: done`, and that pair is a true statement about
> it. Measured 2026-08-30 across the 780-node store: 62 nodes carry the pair
> and all 62 are tactics. Rewriting their `status` to `codified` would
> manufacture false provenance ... and rewriting `phase` would reopen finished
> work. Neither is correct, and the cohort would regrow regardless: the
> producers of `status: raw` are live, and nothing in the transition machinery
> ever writes the field. The pair must not be swept."

**Pain point 4 — transient edges rot when the far end disappears**,
`kind-tactic.md:221-223`:

> "Because tactics are transient, a blocking tactic disappears when it
> completes; the blocked tactic's entry must be removed at the same time, or
> rule 13 will report it as unresolved."

**Pain point 5 (named directly as "the measured pain") — blending three
lifecycles in one hand-authored tactic object**,
`strategy-graph-native-dispatch.md:6862-6868`:

> "LIFECYCLE SEPARATION (the cattle rule) - intent (interview-maintained),
> projection (regenerated), and evidence (append-only) have distinct
> lifecycles; no hand-maintained object may carry a projection; work records
> are minted mechanically and never edited - killed and re-minted on drift.
> The measured pain of standing tactic nodes (drift, deduplication, constant
> re-evaluation) is the cost of blending the three lifecycles in one
> hand-authored object."

**Pain point 6 — migration tactics going stale and causing regressions**,
the author's own named pain, quoted in the brownfield migration-path
clarification, `strategy-graph-native-dispatch.md:6807-6809`:

> "brownfield migration paths are DERIVED PROJECTIONS between measured
> current state and recorded target state - never stored step lists, which
> stale the moment either end moves (the author's named pain: migration
> tactics growing stale and causing regressions when finally drained)."

**Pain point 7 — the abandonment errata's own diagnosis** of why the frozen
tactic corpus is not drained through the old ladder,
`strategy-graph-native-dispatch.md:6954-6958`:

> "The incumbent tactic nodes are NOT drained through the old ladder: work is
> frozen in part because of the pain points those very nodes record.
> Completing the implementation scope of the incumbent tactics USING the
> greenfield reconciliation approach is the viability test of that approach."

**Pain point 8 — thrash from open-ended review rounds on tactic-shaped PRs**
(cited as evidence for the shim's two-regeneration cap, not phrased with the
literal words "tactic-shaped" — that exact string does not occur in
`intentions/`), `strategy-graph-native-dispatch.md:7351-7353`:

> "a cap of TWO assessment regenerations per claim window (evidence: the PR
> #3146 sixteen-round thrash measurement)"

(Note: a full-text search of `intentions/` for the literal strings
`tactic-shaped`, `catch all`, and `catch-all` found no hits outside the two
`catch all prose` / `catch-all-prose` occurrences quoted in section F below —
there is no separate "tactic-shaped" terminology in the incumbent graph.)

---

## (E) The reconciliation model that superseded tactics

**The doctrine of implementation as incremental reconciliation** (the core
statement), `strategy-graph-native-dispatch.md:6837-6846`:

> "Ladder execution is incremental reconciliation between target state (the
> intent layer) and operational state (the repo at origin/main, PR state,
> evidence). Five sub-principles, each author-ratified: (1) UNIFICATION -
> there is no line in kind between implementation and migration:
> implementation is reconciliation whose diff creates structure; migration is
> reconciliation whose diff transforms or removes it (deprecation =
> migration-to-absence, per the 2026-08-31 projection disposition).
> Traditions: Terraform plan/apply draws no line between first and later
> applies; Kubernetes reconciles create and update identically."

The remaining four sub-principles, same passage,
`strategy-graph-native-dispatch.md:6847-6878`:

> "(2) PLAN-AS-PINNED-PROJECTION and the PERSISTENCE TEST - persist exactly
> what re-derivation cannot reconstruct (author decisions, sanctioned
> criteria, hazards known only from experience); everything reconstructible
> (path:line anchors, step order, reuse pointers, model picks) is projection:
> derived against a pin {base sha, strategy fingerprints}, regenerated on pin
> mismatch, never hand-reconciled. Mission-command vocabulary adopted
> (Auftragstaktik): the record carries commander's intent, end state, and
> constraints - never the scheme of maneuver. Traditions: Terraform
> saved-plan staleness; Auftragstaktik/commander's intent; the 2026
> spec-driven wave's agent-maintained ephemeral .plan.md artifacts (Tessl). (3)
> DERIVED POSITION - ladder position is derived, level-triggered, from
> append-only completion evidence carrying proof; the stored phase field is a
> projection/cache during migration. Position is an estimate and carries
> honest unknowns (the CiVerdict.unknown precedent). Traditions: Kubernetes
> status.conditions and level-triggered controllers; event sourcing;
> estimation theory. (4) LIFECYCLE SEPARATION (the cattle rule) - ... .
> Traditions: pets-vs-cattle (immutable infrastructure); Kubernetes owned
> objects - nobody edits a Pod. (5) RATCHET - an acceptance check is born
> observe-tier (failing means frontier entry, not red CI) and promotes to
> gating by mechanical high-water mark: once it has ever passed on main, a
> later failure is a regression and gates. One-way, no ceremony. ... Traditions:
> Nix/Hydra channel advance on green; CI ratcheting; the drain-then-ratchet
> mechanics of the 2026-08-31 projection disposition, mechanized. (decision:
> author-ratified, 2026-09-01)"

**The greenfield target architecture: strategy-scoped reconciliation, no
standing decomposition into tactics**, `strategy-graph-native-dispatch.md:6882-6890`:

> "STRATEGY-SCOPED RECONCILIATION. The strategy node carries target state
> (statement + criteria prose + registered machine checks) and an operational
> layer (append-only evidence log + live claim records). The author sanctions
> CRITERIA, never slices or step lists. There is no standing decomposition
> into tactics: the backlog is the derived FRONTIER (failing observe-tier
> checks + prose-gap assessments); decomposition into a session-sized bite
> happens at claim time - lot-size-one planning (Toyota one-piece flow, viable
> now that agents rebuild context per session regardless) - and the bite
> exists only for the claim window."

Boundary note in the same clarification — strategy topology itself is *not*
dissolved, `strategy-graph-native-dispatch.md:6891-6894`:

> "AUTHOR NOTE (2026-09-01): only tactic-shelf decomposition dissolves;
> strategy topology and the decomposition/mount rules (keystone reorg, mount
> schema) remain intent structure serving other functions."

The tick and its authority split, `strategy-graph-native-dispatch.md:6894-6901`:

> "TICK: select top-ranked (strategy, frontier) -> claim -> project (per-phase,
> execution-time planning) -> execute -> append evidence -> fold at merge;
> MAPE-K/blackboard shape. THE PR IS THE CLAIM-WINDOW WORK RECORD, with an
> authority split: the graph is authoritative for intent and holds only
> observed, derived evidence about work; the PR is authoritative for
> operational work state; the graph never stores expectations about PR
> content. Diff satisfying no criterion is an unmatched-evidence digest
> finding."

Full tradition-reference list for the architecture, `strategy-graph-native-dispatch.md:6923-6931`:

> "Tradition references recorded for this architecture: Kubernetes/Terraform/
> Nix reconciliation; loop engineering (Osmani 2026); spec-driven development
> and spec-as-source; stigmergy (adopted for backlog signaling, contradicted
> for concurrency control by CodeCRDT); blackboard systems (Hearsay-II); MAPE-K
> autonomic computing; Coase inversion (scrum-shaped process is a firm-shaped
> solution to human transaction costs; the governance layer is what survives);
> one-piece flow; refinement calculus; double-entry bookkeeping; speculative
> execution (cheap redo sanctions disposable parallel drafts); estimation
> theory."

**Carrier exception** — the only sanctioned survivors of incumbent-form
tactic nodes, `strategy-graph-native-dispatch.md:6933-6944`:

> "(CARRIER EXCEPTION, recorded 2026-09-01 finding-6 fix, author-approved:
> incumbent-form tactic nodes may be minted or retained post-ratification only
> as bootstrap carriers for machinery the target architecture itself needs,
> each named explicitly here. The current carriers:
> tactic-ladder-reconciliation-observe ..., owning-surface siblings
> tactic-intent-orchestration-layer-schema ..., tactic-consolidation-operation
> ..., and tactic-migration-frontier-projection .... Sequencing is carried by
> blocked_by edges from the integrator to the three owners. Any other new
> standing tactic remains unsanctioned.)"

**Terraform/IaC named explicitly as the migration-frontier tradition**,
`strategy-graph-native-dispatch.md:6811-6820`:

> "Where the target is machine-checkable, the migration frontier is fully
> derived: target rules run in observe mode, the frontier they report IS the
> remaining migration recomputed on every read, drain means the frontier
> empties, and the ratchet then flips observe to enforce - the four-step
> migration contract mechanized (record target schema; open read-tolerance
> window; drain the derived frontier; ratchet). ... DEPRECATION is a migration
> whose target is absence ... Tradition references: Terraform plan / the IaC
> reconciliation loop (the bridge between current and desired state is derived
> at execution time, never stored)."

**The abandonment of the old drain path and its replacement**,
`strategy-graph-native-dispatch.md:6954-6961`:

> "The plans/dispatch-rsi-*.md corpus and the batch session operating on it
> are ABANDONED - the stop-gap-mirror role ends; those files stop being
> maintained and carry no authority. A new bootstrapping operation replaces
> batch resumption, bootstrapping through the session priorities in order: (1)
> greenfield graph implementation (the strategy-scoped reconciliation
> architecture), then (2) long-horizon dispatch with rsi and token efficiency,
> without regressions in integrity, quality, or token efficiency."

One entry from the migrated reconciliation-decisions list (D1),
`strategy-graph-native-dispatch.md:6970-6990` region (D-list begins
immediately after the executor-decisions migration question):

> "(D1) the PR4/PR19 cycle was resolved by splitting PR19 along the
> schema-unit seam. (D2) batchIds was retired - option 3, delete the unwired
> affordance rather than build a channel that cannot be made honest."

---

## (F) The author's rulings on transient disposition, quoted verbatim

**Steering ledger [12] — the governing ruling** (the exact charge this survey
was commissioned to trace), `tactic-bootstrap-operation.md:247-267`:

> "Steering ledger [12] - what did the author direct on transient-disposition
> classes (2026-09-02)? ... (Author-issued 2026-09-02 to the /align amendment
> fork session, relayed same-hour, appended same-turn. Verbatim: \"An
> additional class(es) of transient disposition is fine, but there must not be
> a 'catch all prose' transient disposition. Evaluate using
> greenfield-evaluation criteria (nothing is sacred, interview to override
> doctrine, evaluate from the perspective of greenfield judgement and also
> reference to tradition). Use the existing corpus of transient disposition
> (tactics) to form the model. What falls out as 'prone to decay and therefore
> no longer recorded at all' vs. 'recorded as transient guidance but would be
> better described as persistent criteria' vs. 'shim'. Consider what kind of
> output an /align session might produce which doesn't fit any of those
> categories.\") Disposition: the transcription-class model is formed in the
> fork session's interview from the existing tactic corpus under
> greenfield-evaluation criteria; no catch-all-prose class is permitted."

That entry also records a live consequence for prior work, same locus:

> "Standing effect on prior work: PR 3190's gap-note lane for the 12
> author-required mainqa records is under review by this interview and is NOT
> settled precedent for the corpus drain; a re-transcription of those records
> may fall out. The ledger [10] drain design waits on the resulting
> class-model ruling."

**Steering ledger [10] — drain the entire tactic corpus by transcription,
no drain shim survives bootstrap**, `tactic-bootstrap-operation.md:204-218`:

> "Steering ledger [10] ... Verbatim: \"I want all tactic nodes drained during
> bootstrap execution. A shim for draining deprecated tactic nodes is too much
> to carry past bootstrap. This also serves as validation for the new
> reconciliation model. The tactics don't need to be executed, but they must
> be transcribed to the new model.\" Disposition: extends the P2 transcription
> duty from the mainqa queue to the ENTIRE tactic corpus - the census buckets A
> (in-flight, 132), B (parked, 178), C (drafts, 146, previously undisposed),
> and D (done-residue, 201) all drain by transcription within bootstrap -
> execution of transcribed scope is not required for the drain; no drain shim
> survives bootstrap completion."

Amendment on the same ledger entry — the pragmatic-survivorship boundary,
`tactic-bootstrap-operation.md:219-234`:

> "(AMENDED 2026-09-02, amendment-round ruling 2, author-ratified: resolution
> - the full drain completes BEFORE the P4 resumption gate as part of its
> 'transcribed queues validate' criterion, not as a separate later phase; at
> queue-unfreeze zero legacy tactic nodes remain, only the self-liquidating
> bootstrap carriers. ... Author refinement, verbatim: \"Shims are permitted to
> outlive the drain when pragmatic, but reconciliation-native graph structure,
> dispatch and office-hour operations must be reconciled by the bootstrap
> (that is what is being 'bootstrapped').\" Read as: the completion-criterion
> survivor clause (a shim re-owned by interview) stays available on pragmatic
> grounds, but no pragmatic survivorship extends to graph structure, dispatch
> operations, or office-hours operations - those reconcile fully within
> bootstrap."

**Steering ledger [14] — self-liquidation as the expected fate of
disposition-unsupported implementation**, `tactic-bootstrap-operation.md:279-286`:

> "Verbatim: 'Note the greenfield design: implementation not supported by
> disposition is expected to fall out of the implementation through
> self-liquidation. stop hook / status line functionality must be ratified, or
> risk falling out of the implementation.'"

**Self-liquidation ratified as a completion criterion, not merely narrated**
(the mechanism-level ruling that operationalizes ledger [12]/[14]),
`strategy-graph-native-dispatch.md:7425-7433`:

> "SELF-LIQUIDATION IS A COMPLETION CRITERION. All bootstrap-scoped doctrine
> self-liquidates on bootstrap completion, by construction and by sweep: (a)
> every declared shim carries a liquidation condition, and the shim inventory
> (tactic-migration-frontier-projection's surface) mechanically surfaces any
> shim outliving its condition as a reconciliation-frontier item -
> self-liquidation is enforced, not narrated; (b) the authority grant in this
> clarification expires by its own scope terms when the queues unfreeze; (c)
> the operation carrier and its steering ledger are transient tactics - they
> complete and prune, their record folding to the git archive; (d) bootstrap
> completion itself includes a terminal LIQUIDATION SWEEP as a completion
> criterion."

**The carrier node's own frame**, statement line, `tactic-bootstrap-operation.md:4-7`:

> "Execute the bootstrap operation - implement the greenfield
> graph/reconciliation machinery through the dispatch-resumption gate under the
> 2026-09-01 frozen-queue authority grant - as the operation carrier with
> steering ledger, self-liquidating on completion"

And its three completion criteria, `tactic-bootstrap-operation.md:414-425`:

> "1. **P4 dispatch-resumption gate**: ... 2. **Terminal liquidation sweep**:
> the shim inventory is drained (or each survivor explicitly re-owned by a
> standing strategy through interview); bootstrap-scoped clarifications on
> standing strategies are marked historical or folded by the consolidation
> operation; the frozen-queue authority grant is recorded expired. 3.
> **Carrier self-liquidation**: this node completes and prunes; its record
> folds to the git archive. Temporary bootstrap considerations do not survive
> bootstrap completion."

---

## (G) Greenfield evaluation criteria named for this topic

Ledger [12] explicitly invokes "greenfield-evaluation criteria" as the
evaluation method for the transient-disposition class question. The criteria
it points to are ratified on `strategy-explicit-intent.md` and materialized as
`.claude/rules/greenfield-evaluation.md`.

**Full-frontier definition**, `strategy-explicit-intent.md:845-852`:

> "FULL-FRONTIER DEFINITION, ratified: every reference to 'greenfield' -
> especially while exercising /align - evaluates the FULL solution frontier,
> not 'ideal design given implicit constraints'; the frontier includes review
> of ratified dispositions where alternative framing would yield a more ideal
> design. 'Ratified' does not mean unchangeable; it means changing it requires
> an author interview - and /align IS that interview, per the overrule algebra
> (2026-08-31 clarification on this node)."

**Dual-perspective rule**, `strategy-explicit-intent.md:852-856`:

> "DUAL-PERSPECTIVE RULE, ratified: greenfield evaluation by AI always
> includes evaluation from the perspective of AI best judgment AND evaluation
> with reference to tradition, and every tradition reference surfaced is
> recorded with the resolution it informed."

**Authority primacy and the incumbent-never-constrains-greenfield corollary**,
`strategy-explicit-intent.md:993-1006`:

> "The primacy ordering is: RATIFIED dispositions > DEFERRED/DELEGATED
> dispositions > OPERATIONAL TEXT. Operational text — anything written to the
> repo: code, scripts, skill and rule files, config, plans/, incumbent
> implementations — carries NO intent authority at any rank: it is evidence of
> past decisions and instrument facts .... COROLLARY (author-issued, same
> sitting): INCUMBENT IMPLEMENTATION NEVER CONSTRAINS GREENFIELD DISPOSITION —
> constraint flows one way, from dispositions down to implementation; a
> greenfield evaluation that imports a constraint from incumbent operational
> text has violated the full-solution-frontier rule."

**The materialized rule text** (not `intentions/`, but the direct projection
of the above, and the text a bootstrap `/align` session actually loads),
`.claude/rules/greenfield-evaluation.md:13-19` and `:33-43`:

> "Every design evaluation, proposal, or review evaluates the **full solution
> frontier** — never \"ideal design given implicit constraints\". Nothing is
> sacred: no doctrine is implied, especially not by the incumbent
> implementation. Existing code and artifacts are evidence of past decisions,
> not authority over future ones."

> "The primacy ordering is: ratified dispositions > deferred/delegated
> dispositions > operational text. ... A conflict between a disposition and
> operational text is a stale-projection frontier item, never a contest
> between two authorities. Corollary: incumbent implementation never
> constrains greenfield disposition — constraint flows one way, from
> dispositions down to implementation."

Ledger [7]'s own paraphrase of these criteria, applied directly to legacy
intervention lanes (the same evaluative move requested for transient
disposition), `tactic-bootstrap-operation.md:140-146`:

> "Evaluate all legacy interventions from a greenfield perspective. Do not
> migrate 1-for-1. Remember greenfield evaluation rules: nothing is sacred,
> esp. the incumbent implementation. Ratified doctrine only needs an interview
> to overrule, other dispositions don't even require that. Consider from the
> perspective of best greenfield judgement and also reference to tradition."

---

## Summary in ten sentences

The incumbent graph treats "transient" as a property that must never be
stored as a fact about the present — a standing obligation is a criterion
derived active by the frontier projection, an operation-scoped one-shot
constraint takes the SHIM shape, and claim-window state lives only in
minted, never-edited claim records, so "No stored self-liquidating
disposition class exists or is needed" (`kind-kind.md:378-379`). A shim is
the one sanctioned exception: an incumbent-form artifact or contract that
declares, at the moment it is minted, both its target-state element and a
verbatim liquidation condition, and a shim that outlives that condition
becomes a machine-derived `overdue-shim` frontier entry rather than a
silently permanent fixture (`kind-kind.md:580-593`, `strategy-graph-native-
dispatch.md:7035-7040`). Runtime/operational facts (CI results, branch
state, merge evidence) and durable operator configuration (pause, worker
limits) are two more things the graph itself never carries directly — the
former lives in append-only evidence/claim records or worktree-local
sidecars, the latter in `dispatch.config/*.json` — because either one
hand-authored into a node would be exactly the kind of "state" the
transience doctrine forbids storing (`strategy-token-economy.md:1321-1327`,
`strategy-graph-native-dispatch.md:1660-1672`). Tactics were the incumbent's
only transient kind, defined as completable units removed from the graph on
completion, and the graph repeatedly records the practical cost of that
design: doctrine has to be manually relocated off a tactic before it prunes
or it is lost past a bare git-history citation, blocked_by edges rot as
their targets vanish, and provenance (`status`) and position (`phase`)
routinely conflate into false-defect signals (`kind-tactic.md:38-44,
221-223, 71-89`). The reconciliation doctrine names the deeper pain
directly: "the measured pain of standing tactic nodes (drift,
deduplication, constant re-evaluation) is the cost of blending
[intent, projection, and evidence] lifecycles in one hand-authored object,"
and separately, the author's own named pain that "migration tactics
[grow] stale and [cause] regressions when finally drained"
(`strategy-graph-native-dispatch.md:6862-6868, 6807-6809`). The successor
architecture eliminates standing decomposition into tactics altogether:
a strategy carries target-state criteria and an operational layer, the
backlog is a derived frontier of failing checks and prose-gap assessments,
and decomposition into a session-sized bite happens only at claim time and
exists only for the claim window — grounded explicitly in Kubernetes/
Terraform/Nix reconciliation, Toyota one-piece flow, MAPE-K, and the
pets-vs-cattle immutable-infrastructure tradition (`strategy-graph-native-
dispatch.md:6882-6890, 6923-6931`). Incumbent-form tactic nodes survive this
transition only as an explicitly enumerated carrier exception for
machinery the new architecture itself needs to bootstrap; "any other new
standing tactic remains unsanctioned" (`strategy-graph-native-
dispatch.md:6933-6944`). On 2026-09-02 the author extended this to a
concrete bootstrap instruction — drain the entire legacy tactic corpus by
transcription, with no drain shim surviving bootstrap, while still
permitting pragmatic shim survivorship elsewhere ("Shims are permitted to
outlive the drain when pragmatic, but reconciliation-native graph
structure, dispatch and office-hour operations must be reconciled by the
bootstrap") (`tactic-bootstrap-operation.md:204-234`). The load-bearing
ruling for this survey is Steering ledger [12]: additional transient-
disposition classes are permitted, but never a "catch all prose" class, and
the model must be built from the existing tactic corpus under greenfield-
evaluation criteria, sorted into "prone to decay and therefore no longer
recorded at all" vs. "recorded as transient guidance but would be better
described as persistent criteria" vs. "shim," with an open fourth bucket
for whatever doesn't fit (`tactic-bootstrap-operation.md:247-262`). The
named evaluation method for making that sort is itself doctrine: evaluate
the full solution frontier rather than the incumbent's implicit design,
treat ratified status as changeable-by-interview only, apply both
best-judgment and tradition lenses, and never let incumbent operational
text constrain a greenfield disposition (`strategy-explicit-intent.md:845-
856, 993-1006`; `.claude/rules/greenfield-evaluation.md:13-43`). Finally, the
architecture ratifies self-liquidation as a mechanically enforced
completion criterion rather than a narrated intention — every shim's
liquidation condition is checked by the frontier deriver, the bootstrap
authority grant expires by its own terms, and the operation carrier itself
is a transient tactic that completes and prunes, so "temporary bootstrap
considerations do not survive bootstrap completion"
(`strategy-graph-native-dispatch.md:7425-7433`; `tactic-bootstrap-
operation.md:422-425`).
