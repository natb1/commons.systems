# Transient disposition: transcript survey

Read-only survey, 2026-09-03. Every quote is verbatim with its transcript
line number. Nothing was written outside this file.

## Sources and a scope correction

The brief named one transcript. It holds part of the material, but not the
part it was named for: the phrase "transient disposition" appears in it only
four times, none of them in an evaluation. The evaluation of options lives in
the sibling sessions of the same lineage. All four are surveyed here and
tagged:

| Tag | File | What it is |
|---|---|---|
| **T1** | `/home/n8/.claude/projects/-home-n8-natb1-commons-systems/de6ae9cb-1bf0-4a91-a04e-c8086377aeff.jsonl` (369 lines) | The transcript the brief named. Custom title `interview deferral options (2)`; ai-title `interview deferral options (2) ⑂ /align confirm that this steering is a shim for greenfield d…`. Branch `align-variance-doctrine-round`, 2026-09-02 13:45–23:41 UTC. This is the **shim / variance-doctrine round**: it evaluates whether a transient operating protocol should be recorded as a shim, and rules that per-PR signals get **no** transient records at all. |
| **T2** | `/home/n8/.claude/projects/-home-n8-natb1-commons-systems--claude-worktrees-greenfield/3dcce675-fae1-4434-a991-53a068f13958.jsonl` (2860 lines) | The fork of the orchestration session: titles run `interview deferral options (2) ⑂ you are now in a fork of the orchestration session…` → `⑂ shim review` → `greenfield disposition graph`. **This is where the options for recording transient disposition are enumerated and evaluated, where directive (d) was issued, and where the class model was formed.** It is also the session that commissioned this survey. |
| **T3** | `/home/n8/.claude/projects/-home-n8-natb1-commons-systems--claude-worktrees-strategy-explicit-intent/767b8dcb-c841-4e1e-a5c1-f725973e3913.jsonl` (3287 lines) | The bootstrap **orchestration** session. It received the author's directives relayed from T2 and landed Steering ledger [9]–[12] on the carrier node. |
| **T4** | `/home/n8/.claude/projects/-home-n8-natb1-commons-systems/022681b6-d42e-45be-adaf-371d3314f082.jsonl` (162 lines) | A short locator session ("transient dispositions shims gaps") whose only job was to find T1. Its conclusion is what put T1's id into the author's message; it is quoted once below for provenance. |

T1's own `continued-in` record (T1:369) points at session
`9d209764-3675-433a-81ea-97a73133c5f5`, which is not on disk.

---

## 1. Options for recording transient disposition — named and evaluated

### 1.1 The frame: the author's two-class hypothesis

The whole evaluation opens from the author's own framing, which names two
options and asks whether they are exhaustive (T2:227, verbatim, the `/fork`
prompt):

> you are now in a fork of the orchestration session - you are no longer orchestrating the bootstrap. Instead, evaluate and help me understand. The graph contains a lot of legacy structure that amounts to transient implementation guidance. Greenfield design deprecates this because there are a lot of issues with this kind of disposition growing stale and the greenfield evolves. Confirm: this type of transient guidance in greenfield is either re-framed as persistent criteria, or recorded as transient shim. Confirm: the bootstrap plan transcribes all transient guidance into one of these two classes. Evaluate existing transient implementation guidance - does it cleanly map to these two classes?

### 1.2 Option A — **persistent criterion** (re-word as a persistent disposition)

Evaluated at T2:240:

> That is the recorded greenfield disposition. Criteria (`attributes.criteria` / `standing_criteria` on `kind-strategy`) are the persistent form: a closed `{id, statement, class, authority, recorded}` shape carrying its own authority stamp, surfacing on the reconciliation frontier until a check binds and passes.

Drift resistance, same passage (T2:240):

> The staleness problem you name is exactly what both forms solve: a criterion can't rot silently because unsatisfied ones surface every derivation, and a shim can't rot silently because overdue ones do.

**Verdict:** kept. Clean mapping for machine-verifiable queue items (T2:240):

> (d) Machine-verifiable queue items → criteria: clean, and the unbound-check state honestly surfaces as frontier debt rather than hiding.

**One measured defect in this option** (T2:240):

> **One mechanical gap worth knowing:** transcribed criteria enter `authority: deferred`, but the deferred-*queue* deriver reads only `(decision: deferred, …)` stamps in prose — it never reads `attributes.criteria`. So the ratification path for the persistent class has no mechanical join to the queue that's supposed to disposition it; this was caught during transcription and recorded as a gap note. Until the deriver grows a criteria arm (or ratification reviews read `criteriaInForce` directly), part of the two-class model's lifecycle is aspirational.

### 1.3 Option B — **shim that self-liquidates**

Evaluated at T2:240:

> Shims (`attributes.shims`) are the transient form: every declared entry carries a liquidation condition, and the shim inventory mechanically surfaces any shim outliving its condition as a frontier item — "self-liquidation is enforced, not narrated," per the 2026-09-01 amendment.

The shim's recorded shape, read live in T1 (T1:159, tool_result quoting
`strategy-graph-native-dispatch` at the branch head):

> ```
>   shims:
>     - id: review
>       target: criteria-anchored review assessments with scoped basis pins; interim =
>         the detached dispatch-code-review instrument exactly as measured —
>         detachment, two-phase collect, the worktree flock/node lock, and
>         no-kill-on-overrun are instrument facts, not doctrine
>       liquidation: assessment/check machinery live — the cap and the effort tiering
>         liquidate when criteria-anchored checks make convergence structural and
>         effort derives from criterion class
>       liquidated_by: null
>       declared: 2026-09-01
> ```

The nine live entries and the per-mechanism granularity precedent (T1:179):

> **The shim vocabulary is itself part of what's landing.** At `origin/main` today there are no declared shims — the registry (`attributes.shims` entries of shape `{id, target, liquidation, liquidated_by, declared}`, overdue-derivation in `shims.ts`) arrives with PR #3187. At the branch head, nine are declared: seven on `strategy-graph-native-dispatch` (`review`, `qa`, `main-qa`, `implicit-criteria`, `finding-ledger`, `refinement-annotation`, `transition-note`), one `bootstrap-carrier` on the carrier, one on the schema tactic. Precedent worth noting: the seven are declared **per interim mechanism**, even where several share one liquidation event (both `transition-note` and `bootstrap-carrier` liquidate at the same terminal sweep).

The liquidation conditions as a set (T1:166, tool_result):

> ```
>     - id: review
>       liquidation: assessment/check machinery live — the cap and the effort tiering
>     - id: qa
>       liquidation: staged assessment production live
>     - id: main-qa
>       liquidation: level-triggered re-verification live
>     - id: implicit-criteria
>       liquidation: transcription into the check/criteria registry done AND the
>     - id: finding-ledger
>       liquidation: evidence log live
>     - id: refinement-annotation
>       liquidation: tactic-consolidation-operation's folding machinery live
>     - id: transition-note
>       liquidation: rides the terminal liquidation sweep (bootstrap completion's
> ```

The self-liquidating **carrier** variant, i.e. the whole node is the transient
record and prunes itself (T1:162, tool_result):

> ```
> 146:  shims:
> 147-    - id: bootstrap-carrier
> 148-      target: the claim record and work record of the reconciliation model (owned by
> 149-        tactic-intent-orchestration-layer-schema's schema surface)
> 150-      liquidation: bootstrap completion - the P4 gate plus the terminal liquidation
> 151-        sweep discharge it, and the carrier prunes
> 152-      liquidated_by: null
> 153-      declared: 2026-09-01
> ```
> `# Execute the bootstrap operation - implement the greenfield graph/reconciliation machinery through the dispatch-resumption gate under the 2026-09-01 frozen-queue authority grant - as the operation carrier with steering ledger, self-liquidating on completion`

**Verdict:** kept, but measured as **rare**. The census found it covers far
less than the frame assumed (T2:545, census result):

> - **→ shim**: only 15 A / 22 D / 10 C / 8 B nodes carry interim-with-end-condition language, and only a handful state a liquidation condition explicitly. Cleanest exemplars: `tactic-consolidation-operation.md:190-195` ("liquidation condition: deriver live"), `tactic-terminal-disposition-sweep-park-without-cas.md:640-651` ("Interim mitigation, until the fix lands"), `tactic-rsi-audit-threshold-table.md:75-77` (hand-set constants until first audit pass).

And in the synthesis (T2:545):

> 2. Shim is real but rare — ~55 nodes corpus-wide touch interim language, and only a handful carry an explicit liquidation condition; the existing `attributes.shims` machinery is already the right home and needs no new tactic class.

In the final greenfield model the shim stops being a *class* and becomes an
ordinary disposition with a liquidation criterion — the greenfield review
document's edge table, written by T2 and still on disk at
`/home/n8/.claude/jobs/3dcce675/tmp/greenfield-disposition-graph.md:188`:

> | `attributes.shims` | 8 strategy, 5 tactic entries | an interim answer with a liquidation criterion as child; overdue = unsatisfied | the shim arm already reads liquidation conditions |

### 1.4 Option C — **gap note** (the unratified third lane)

Surfaced by the evaluation as a class the author's dichotomy does not name
(T2:240):

> The addition: the implemented machinery has a **third carrier — gap notes** (the `prose-gap` frontier arm, `disposed_by: null` until dispositioned). It's structurally shim-like (transient, with a liquidation seam) but a distinct record type, and the live transcription work uses it heavily: author-required guidance that is neither checkable (so not a criterion) nor an interim *mechanism* (so not a shim) goes there. If you want the two-class frame to be literally exhaustive, gap notes have to be read as a subclass of "transient record with a disposition seam" — or ratified as a first-class third lane. Today that reading is an executor interpretation, not recorded doctrine.

And the drift/inconsistency risk it carries (T2:240):

> **Maps with the third-class caveat.** Author-required queue items and out-of-criteria review findings land as gap notes, not shims — the transcription works, but under a class the dichotomy doesn't name, and the machine/author "lane attribute" the doctrine promises has no field yet (it's carried by *form*: criterion vs prose-gap — recorded this session as an executor-derived interpretation awaiting ratification).

**Verdict:** rejected as a class. The author's directive (d) explicitly put it
under review (see §2), and the final model folds it into the unanswered
question (see §3). T1 had already offered "gap note only" as a *declined*
option for the PR-signal gap (T1:180, option 2):

> **Gap note only** — Record it as a prose-gap frontier item via the create-only gap-note store (like the conditions-deprecation note), leaving ownership to a later disposition pass by tactic-consolidation-operation's machinery. Lighter, but leaves P3's scope ambiguous.

### 1.5 Option D — **decline to record at all** ("prone to decay")

The census's paradigm decay class (T2:545):

> - **→ not-recorded**: `## Unit N` scopes, `**Recommended model:**` lines, `## Reuse` pointers, `path:line` anchors. 83 A + 64 D nodes carry model recommendations; these are the paradigm decay class and the corpus itself says so (`tactic-align-strategy-new-steps-drift-observations.md:113-116`, anchors stale by +62..+72 lines after one rename).

Synthesis (T2:545):

> 1. The two-class scheme (criterion / shim) covers well under half the corpus by volume; HOW-plan is the largest single class and is correctly not-recorded.

**Verdict:** kept, and it is the largest class by volume.

### 1.6 Option E — **declare the transient protocol as a shim** (T1's own round)

This is the option T1 was convened to evaluate. The four shapes it put to the
author (T1:180):

> **One protocol shim (Recommended)** — Declare one shim entry on tactic-bootstrap-operation, id ~ manual-orchestration: target = router-dispatched, context-bound skill resolution of frontier entries; liquidation = P4 resumption gate discharge. Covers [1]'s delegation/gating rules and [6]'s PR-debug refinement as one interim mechanism, matching the per-mechanism (not per-directive) precedent of the seven strategy shims.
>
> **Covered by bootstrap-carrier** — Record no new entry — read the existing bootstrap-carrier shim as already covering the orchestration protocol since both liquidate at bootstrap completion. Parsimony-first, but leaves the protocol invisible to the overdue-shim frontier arm as a distinct mechanism.
>
> **Accept as deferral** — Hold the recommendation on trust without endorsing it: the shim entry is declared, plus a dated clarification naming what is held on trust and one born-parked review item enrolling it for later author review.
>
> **Per-directive entries** — Declare separate shim entries per steering directive ([1], [6], future ones). Maximum granularity in the registry; more entries sharing one liquidation event.

The confirmation that the steering *is* a shim (T1:179):

> Steering [6] (and the [1] working rules it refines) institutes a **manual-orchestration protocol**: a standing main thread that gates/merges and delegates diagnose-fix-verify loops to context-bound subagents. In the target model that mechanism does not exist… The standing main thread is the bootstrap-interim stand-in for the router itself. That is exactly the shim shape, and its liquidation condition is the P4 resumption gate. It is not yet in the registry — the `bootstrap-carrier` shim covers the carrier's claim/work record, not the orchestration protocol.

The **sweep that distinguishes shim from non-shim**, i.e. the test applied
(T1:211):

> Walking the ledger [1]–[6] protocols against the shim test (interim mechanism standing in for target machinery, with a liquidation event):
>
> | Protocol | Verdict |
> |---|---|
> | Delegate units to subagents; main thread orchestrates/gates/merges ([1]) + PR-debug delegation ([6]) | **Shim — declare** as `manual-orchestration`: target = router-dispatched, context-bound resolution; liquidation = P4 gate |
> | Hand-provisioned worktree claims with Step-0 gate-bypass notes | **Shim — declare** as `manual-claim`: target = claim records + selection gate (schema-tactic surface); liquidation = claim machinery live + P4 |
> | Review-shim protocol, caps, effort tiering ([1]) | Already declared (`review` shim) |
> | Functional-before-non-functional, no mid-window scope expansion | Terms of the `review` shim, not separate mechanisms |
> | Executor-derived criteria enter deferred until ratification | **Not a shim** — that's the target authority model itself, permanent |
> | Frozen queues until P4; P1–P4 ordering; same-turn ledger appends | Ride the existing `bootstrap-carrier` shim — they're the carrier's own operating terms |
>
> Net: two new entries on the carrier, the rest dispositioned as covered or non-shim (negatives recorded in the declaring clarification so the registry's parsimony is auditable).

**Verdict:** the author chose "One protocol shim" and ordered the sweep (see
§2); the sweep landed `manual-orchestration` + `manual-claim`.

### 1.7 Option F — **persistent criterion + transient operational state, variance derived** (the option that won in T1)

This is T1's central result and is exactly "reword as a persistent disposition
with instrumentation for transient operational state" (T1:211):

> **Greenfield design: there is no "intervention" category.** The legacy lanes exist only because legacy dispatch was *edge-triggered* — a GitHub signal fires, a reactive script catches it. Under level-triggered derivation (the tradition the observe node already cites: Kubernetes conditions/controllers, loop engineering) every one of those signals is just a **variance** — a divergence between derived and target state, derived at read time, appearing as a frontier entry.

The decisive sentence on not minting transient records for transient signals
(T1:211):

> Per-PR signals need no per-PR *criteria*: the criterion is standing, the check **run** is operational state scoped to a claim; the variance is derived. The real build item is **claim-scoped run ingestion (CI results, merge-tree state) plus gating semantics in the deriver** — a scope clarification on the P3 observe node, not a new node.

Restated in the closing coverage walk (T1:331):

> | "PR check/merge signals as reconciliation criteria?" | Answered *not yet, by design*: criterion is standing, the check **run** is claim-scoped operational state, the variance is derived — no per-PR criteria minted; the build item (claim-scoped run ingestion + gating semantics in the deriver) is now recorded in-scope on `tactic-ladder-reconciliation-observe` |

Drift argument for one frontier over per-lane mechanisms (T1:211):

> 1. **One frontier, variance-classed.** Failing check run, merge conflict, dead claim, red main, review finding, stale intent — all the same kind of thing, distinguished by class, not by mechanism. No lanes, no labels, no reactive scripts.

Blocking semantics and their tradition grounding (T1:211):

> 2. **Blocking semantics as a first-class property** (your basic-level input, and the jidoka/andon-cord tradition: stop the line at the station, never pass a defect downstream). A variance carries scope (which claim/node it attaches to) and a gating relation: a merge conflict or broken check on a claim **blocks that claim's further reconciliation** — cascading-failure prevention and early debt capture fall out structurally, because the deriver refuses to project progress over an unresolved gating variance.

What dissolves rather than migrating (T1:211):

> **What dissolves naturally** (not migrated 1-for-1): `dispatch-invalid-state` dissolves entirely — claim/release event records make "invalid state" a stale-claim variance readable from data, no transcript forensics (boldness: this one is my strongest claim, resting on the claim-record design rather than measurement). `fix-checks` and `dispatch-conflict` become gating-variance bites. `dispatch-diagnose-main` becomes a repo-scoped gating variance under the main-health criteria U6 already recorded. `qa/main-qa/review` residue handling is already shimmed. Office-hours parks become the deferred-decision queue (consolidation's surface).

### 1.8 Option G — **one dedicated skill per transient/bite class** (context binder + telemetry unit)

Proposed by the author mid-round (T1:216, queued message, verbatim):

> evaluate proposed doctine: each byte "type" (vocabulary?) is initialized with a dedicated skill for the purpose of context management and token usage telemetry

with the follow-on (T1:232, verbatim):

> (this is analogous to each phase of the dispatch ladder getting a skill)

Evaluated at T1:235:

> **Greenfield verdict: sound, and it closes a loop the variance doctrine left open.** The doctrine says resolution is context-isolated bites; it didn't say what *binds* the context. A dedicated skill per bite class is the natural binder…
>
> 1. **Context management.** A skill is Claude Code's unit of front-loaded context: the resolving session loads exactly one class's procedure, environment traps, and bound-context recipe — nothing else. The rejected alternative, one generic resolve-variance skill dispatching on type internally, pays every class's context on every bite and is exactly the bloat the token-efficiency rationale forbids. Notably the legacy lanes already prefigure this grain — `fix-checks`, `dispatch-conflict`, `qa-fix` *are* per-lane skills; the greenfield keeps the grain but re-keys it from lane (edge-triggered mechanism) to variance class (vocabulary term) at liquidation.
> 2. **Token telemetry.** Per-skill attribution makes token usage readable per variance class — the RSI lenses get cost-per-class as a clean dimension, which then feeds ranking/pace decisions (an expensive variance class is itself a finding). One generic skill collapses this to one bucket.
> 3. **A completeness discipline falls out.** "Initialized with" makes skill-minting part of type-minting: a variance class with no skill is a visible registry gap (same census pattern as unregistered checks), not a silent fallthrough to some generic handler.

Risk side, same turn (T1:235):

> **Risks, honestly:** it's a maintenance surface that grows with the vocabulary — mitigated because the vocabulary is small, derived from measured variance classes rather than speculation, and telemetry itself justifies each skill's existence (a class whose skill never fires is prunable evidence). And one boundary to keep: the skill carries the judgment procedure; anything mechanical in the class's resolution still belongs in scripts the skill calls (the recorded mechanical-floor doctrine), so "dedicated skill" must not become "prose reimplementation of tooling."

**Verdict:** adopted (T1:237, author answer `"Adopt (Recommended)"`).

### 1.9 Option H — **the final greenfield answer: no transient class at all**

The T2 model retires the transient/persistent split entirely — every transient
content type lands on one of four permanent constructs (T2:858):

> - **Validation against existing content.** Every one of the census's eight unmapped content types lands on one of four constructs: the unanswered question, the answer's rationale and rejected options, the evidence log, and the answer chain. No catch-all prose class is needed, which answers directive (d). The record's own deprecation list is honored, and the drain under ruling 2 maps bucket by bucket. Conflict B, the two carriers, and the multi-topic dual dissolve.

And the "no node for transient state" rule ratified in the greenfield sitting
(T2:2755, item 5):

> 5. **Transient state is never a node.** A rule on `model`: the record holds standing answers; an operation in progress lives in its own scaffolding and is disposed with it. So the `bootstrap` node is pruned, its content already on the ledger and in the operations file. "During bootstrap" prose leaves each node as it is ratified. The `ledger:` field leaves every node… Ratified.

---

## 2. Author rulings and instructions, verbatim

### 2.1 The framing instruction (T2:227)

> you are now in a fork of the orchestration session - you are no longer orchestrating the bootstrap. Instead, evaluate and help me understand. The graph contains a lot of legacy structure that amounts to transient implementation guidance. Greenfield design deprecates this because there are a lot of issues with this kind of disposition growing stale and the greenfield evolves. Confirm: this type of transient guidance in greenfield is either re-framed as persistent criteria, or recorded as transient shim. Confirm: the bootstrap plan transcribes all transient guidance into one of these two classes. Evaluate existing transient implementation guidance - does it cleanly map to these two classes?

### 2.2 The four directives, including directive (d) on transient-disposition classes (T2:259)

The author's original wording (typos as typed):

> Help coordinate changes to the disposition/bootstrap plan with the parent bootstrap operations session. Load the /align skill, but continue running it as fable.
> - Bootstrap shims must include `/align` shims during bootstrapping so that this kind of alignment session is as close to greenfield as possible. Reconciliation of greenfield alignment is a named top priority for the bootstrap operation. Address this point first so that the rest of the alignment session proceeds using greenfield alignment doctrine.
> - I want all tactic nodes drained during bootstrap execution. A shim for draining deprecated tactic nodes is too much to carry past bootstrap. This also serves as validation for the new reconciliation model. The tactics don't need to be executed, but they must be transcribed to the new model.
> - I want strategy node topology to reflect greenfield decomposition doctrine so that post-bootstrap operations with materialized context have a solid foundation to work from.
> - An additional class(es) of transient disposition is fine, but there must not be a "catch all prose" transient disposition. Evaluate using greenfield-evaluation criteria (nothing is sacred, interview to override doctine, evaluate from the perspective of greenfield judgement and also reference to tradition). Use the existing corpus of transient disposition (tactics) to form the model. What falls out as "prone to decay and therefore no longer recorded at all" vs. "recorded as transient guidance but would be better described as persistent criteria" vs. "shim". Consider what kind of output an `/align` session might produce with doesn't fit any of those categories.

Relayed verbatim to the orchestration session and quoted there (T3:2270, and
identically in the enqueue record T3:2268):

> [d] "An additional class(es) of transient disposition is fine, but there must not be a 'catch all prose' transient disposition. Evaluate using greenfield-evaluation criteria (nothing is sacred, interview to override doctrine, evaluate from the perspective of greenfield judgement and also reference to tradition). Use the existing corpus of transient disposition (tactics) to form the model. What falls out as 'prone to decay and therefore no longer recorded at all' vs. 'recorded as transient guidance but would be better described as persistent criteria' vs. 'shim'. Consider what kind of output an /align session might produce which doesn't fit any of those categories."

Standing effect the relay attached (T3:2270):

> Implications you should hold now: [d] puts PR #3190's gap-note lane under review — a re-transcription of the 12 author-required records may fall out of this interview; don't treat that lane as settled precedent for buckets A/C. [b] confirms your hold: the drain covers ALL tactic nodes and must complete within bootstrap (no drain shim survives it).

### 2.3 Ruling on the shim declaration and the sweep (T1:181)

> "One protocol shim, and evaluate whether other bootstrap orchestration protocols are better recorded as shims."

### 2.4 Ruling on greenfield re-derivation of the legacy transient lanes (T1:181)

> "Evaluate all legacy interventions from a greenfield perspective. Do not migrate 1-for-1. Remember greenfield evaluation rules: nothing is sacred, esp. the incumbent implementation. Ratified doctrine only needs an interview to overrule, other dispositions don't even require that. Consider from the perspective of best greenfield judgement and also reference to tradition. Some legacy interventions may be resolved naturally by the new reconciliation model and other greenfield design such as ranking design, bite design, or rsi design. At a basic level, some variances (like merge conflicts or broken checks) must be resolved before progressing reconciliation a) to prevent cascading failures, or collecting debt that can be caught early b) to isolate the context of these interventions for token efficiency."

### 2.5 Rulings adopting the variance doctrine and the two-shim split (T1:213)

> "Adopt all three (Recommended)"

and

> "Confirm both (Recommended)"

### 2.6 Ruling adopting the bite-type skill doctrine (T1:237)

> "Adopt (Recommended)"

### 2.7 Ruling on shim usage as doctrine (T2:301)

> "Mechanism and landing are delegated. But, usage is doctrine: When invoking the `/align` skill (during this bootstrap, or afterward) I only need to prompt to shim the alignment doctrine to be sure the alignment skill is using greenfield alignment doctrine. This is implied by transient bootstrap context, but the usage pattern persists when making changes to alignment doctrine post bootstrap."

Later inverted by the author into ledger [13] (recorded verbatim in
`intentions/tactic-bootstrap-operation.md:268-279`):

> "revision to alignment shim usage doctrine: the alignment skill must use any alignment shims by default, and only bypass shims if prompted."

### 2.8 Ruling on the drain and on which shims may outlive it (T2:326)

> "Full drain before P4. Shims are permitted to outlive the drain when pragmatic, but reconciliation-native graph structure, dispatch and office-hour operations must be reconciled by the bootstrap (that is what is being "bootstrapped")."

### 2.9 Ruling on self-liquidation of unsupported implementation (ledger [14], recorded at `intentions/tactic-bootstrap-operation.md:279-283`)

> 'Note the greenfield design: implementation not supported by disposition is expected to fall out of the implementation through self-liquidation. stop hook / status line functionality must be ratified, or risk falling out of the implementation.'

### 2.10 The instruction that commissioned this survey — and the standing requirement it sets on `/align` (T2:2759)

> First, several of my points were about how transient dispositions were being written into the graph which were prone to drift. The incumbent graph lists several options for recording transient dispositions so they resist drift (eg. shims that self liquidate, or rewording as persistent dispositions with instrumentation for transient operational state). Session de6ae9cb-1bf0-4a91-a04e-c8086377aeff evaluates some of these options. Do not adopt incumbent disposition without scrutiny, but do evaluate the scope of requirements for recording transient disposition under the constraint of resisting drift and inconsistency. Do not reinvent "tactic nodes" which were a persistent pain point and superceded by the reconciliation model. Record as deferred the recommended disposition for recording transient disposition and avoiding tactic-shaped drift.
>
> Then, update the `/align` shim and disposition (guiding this current dialog) so that recommended disposition are always presented for review before recording and always include the authority, boldness AND if it is a persistent or some transient form of disposition (eg. shim) If this is not the recommended ontology then refine it (is a transient disposition still called a disposition, etc.) This way I know if I am approving some transient stop-gap or something that will persist in the graph.
>
> Then, rewrite each of these "playback" dispositions and "questions" with recommendations in that form.

### 2.11 Author ruling recorded in the graph that constrains all of the above

Not from these transcripts but the standing rule the whole evaluation runs
against, `intentions/strategy-graph-native-dispatch.md:500-509` (author-dictated
2026-07-13):

> "No. Tactics are transient by definition; persistent structure lives on strategy (or virtue) nodes. This is why the main-health signal home is strategy-main-health rather than the auto-created fix tactic or a standing tactic: the fix tactic exists only per episode, and a standing tactic would put permanent structure on a transient kind."

---

## 3. The transient-disposition classes the session arrived at, and the criteria used

### 3.1 The criteria: "greenfield-evaluation criteria"

Named by the author in directive (d) (T2:259):

> Evaluate using greenfield-evaluation criteria (nothing is sacred, interview to override doctine, evaluate from the perspective of greenfield judgement and also reference to tradition).

and again in T1:181:

> Remember greenfield evaluation rules: nothing is sacred, esp. the incumbent implementation. Ratified doctrine only needs an interview to overrule, other dispositions don't even require that. Consider from the perspective of best greenfield judgement and also reference to tradition.

The rule file they point at is `.claude/rules/greenfield-evaluation.md` (landed
as PR #3185 the same day, and itself declared a shim in its own header:
"until that machinery exists this file is a declared shim (liquidation
condition: rules-materialization live)"). Its four operative criteria:

> Every design evaluation, proposal, or review evaluates the **full solution frontier** — never "ideal design given implicit constraints". Nothing is sacred: no doctrine is implied, especially not by the incumbent implementation.

> Ratified doctrine requires only an author interview to change… Delegated and deferred dispositions do not even require an interview — AI may overrule them on best judgment during execution or rsi — but every such override enters the author review queue.

> The primacy ordering is: ratified dispositions > deferred/delegated dispositions > operational text… Corollary: incumbent implementation never constrains greenfield disposition — constraint flows one way, from dispositions down to implementation.

> Every evaluation runs both lenses: fresh-perspective best judgment, and reference to tradition — searching for the relevant software-engineering or other tradition, including pre-agent traditions that were shelved only by human constraints.

### 3.2 The census brief's three candidate classes plus the no-catch-all constraint (T2:423)

> The candidate classes are (i) "prone to decay — should not be recorded at all", (ii) "recorded as transient guidance but is really persistent verification intent — belongs as a criterion {id, statement, class functional|non-functional|assumption, authority, recorded} on a strategy", (iii) "shim — an interim mechanism with an explicit liquidation condition", and possibly further classes — but explicitly NOT a catch-all prose class. The model must be formed from what the existing corpus actually contains.

The brief's tagging vocabulary, which became the class axis (T2:423):

> - WHAT-criterion… - HOW-plan… - WHY-context… - MECHANISM-interim (candidate shim)… - EVIDENCE… - DECISION-pending… - READING/TRADITION… - MOOT: content whose referent no longer exists in the greenfield model

### 3.3 The eight unmapped classes the census produced (T2:545)

> **U1 — DESIGN-RATIONALE: why this mechanism and not the alternatives.** Durable (survives the code), not a verifiable outcome, and the corpus explicitly forbids discarding it.
>
> **U2 — WORK-BOUNDARY / anti-scope: negative constraints and sibling non-absorption routing.** Not an outcome; a constraint on *who does what*, load-bearing against duplicate/conflicting work.
>
> **U3 — IMMATERIAL-OBSERVATION: born-parked drift carriers, explicitly not work and not defects.** 21 nodes with `## Observation N`, 38 born-parked carriers by census. No criterion, no plan, no shim; a durable home for a fact whose disposition a human owes.
>
> **U4 — READING/TRADITION curriculum.** 30 nodes carry `## Text`. Passages + questions + a completion contract; nothing here is an outcome, a plan, or a stopgap.
>
> **U5 — HUMAN-SITTING procedure: a non-delegable owner action with an agenda and a time budget.** 27 human-only + several author-decision nodes. The *completion* is criterion-shaped, but the ordered agenda is not, and dropping it strands the sitting.
>
> **U6 — DECISION-PENDING / open ruling owed.** The park queue's substance: a named question, its owner, and what it blocks. Not a criterion (nothing is asserted), not a shim (no interim mechanism), and manifestly must be recorded.
>
> **U7 — EVIDENCE / dated measurement record.** Distinct from a criterion: it is what was *observed once*, with instrument and date, and it is the only place the number lives.
>
> **U8 — SUPERSESSION / status overlay: a later ruling that partially retires the node's own statement.** Not the node's content and not a criterion; a pointer that the record above it is stale in a named way.

The census's own recommendations on which deserve a class (T2:545):

> 3. The largest genuinely unmapped mass is **DESIGN-RATIONALE (U1)** — dominant in bucket D, present in every large A/B plan. The corpus itself has already ruled (`:163-167`) that it must not be pruned and lives nowhere else. It is the strongest candidate for its own class.
> 4. **WORK-BOUNDARY (U2)** is a distinct negative-constraint class: it prevents duplicate and conflicting work across siblings and cannot be inverted into a criterion without inventing a verification that no one runs.
> 5. **IMMATERIAL-OBSERVATION (U3)** is structurally a class the graph invented to route around a write restriction, not a durable intent — the greenfield model can plausibly collapse it into the deferred-decision queue (U6) rather than give it a class.
> 6. **DECISION-PENDING (U6)** is the park queue's own substance and already has a doctrinal home…; it needs a *representation*, not a tactic class.
> 7. **READING/TRADITION (U4)** and **HUMAN-SITTING (U5)** are two flavors of the same thing: an author-attended session with an agenda. If any class is added beyond criterion/shim, "author-owed sitting with an agenda and a completion contract" earns it — 60+ nodes, entirely unmapped, entirely non-decaying.
> 8. **EVIDENCE (U7)** is the type most at risk of being wrongly deleted: dated one-shot measurements with instrument and store-size context that no criterion re-derives. Consider an `evidence` field on criterion rather than a class.
> 9. **SUPERSESSION (U8)** is metadata, not content — it should be an edge/stamp in the greenfield model, never prose.
> 10. Bucket C's 27 statement-only drafts and B's 12 are the trivial case: promote the statement to a criterion or drop it; no body means no decay risk and no class question.

### 3.4 The final class table — every class and its home

From the greenfield review document T2 wrote (`greenfield-disposition-graph.md:214-236`,
reported to the author at T2:858):

> ### 5.2 Content classes from the census (MEASURED by the census agent, 657 legacy tactics)
>
> | Class | Volume | Home in the model | Persists? |
> |---|---|---|---|
> | criteria (`## Verification`, ```verify```, needs-main residue) | 80 A / 77 D / 31 C / 26 B nodes | child question nodes of the strategy; machine-checkable → bound check | yes, as dispositions (deferred until ratified) |
> | how-plans (`## Unit N`, `Recommended model`, `## Reuse`, anchors) | largest class by volume; 83 A + 64 D carry model recommendations | projection, regenerated at claim time | no |
> | why/context | 134 A / 67 B / 56 C / 138 D | the question's rationale, folded | yes, compacted |
> | interim mechanism with end condition | ~55 nodes, few with explicit liquidation | interim answer + liquidation criterion | yes |
> | evidence (dated measurements, quoted artifacts) | present in every large node | operational evidence log | yes, as evidence, not intent |
> | decision pending (U6) | the park queue's substance | unanswered question node | yes |
> | reading / tradition curriculum (U4) | 30 nodes entirely | unanswered ratification-required question with `grounds` payload | yes |
> | human sitting with agenda (U5) | 27+ nodes | unanswered ratification-required question; agenda is its rationale | yes |
> | design rationale and rejected alternatives (U1) | dominant in bucket D; ruled do-not-prune in the corpus | the answer's rationale and options (QOC's options; IBIS's arguments) | yes |
> | work boundary / anti-scope (U2) | 16 A / 21 D | mostly structural (different questions are different nodes); residual explicit non-goals are delegated answers | partly |
> | immaterial observation (U3) | ~21 nodes entirely | evidence ("checked, no drift" is an assessment) | yes, as evidence |
> | supersession overlays (U8) | scattered | the intra-node answer chain | yes, as history |
> | moot (targets replaced machinery) | ~25 nodes listed by the census | nothing | no |
> | statement-only drafts | 27 C + 12 B | a criterion or dropped | case by case |
>
> Every one of the census's eight unmapped types lands on one of four constructs: the unanswered question, the answer's rationale and options, the evidence log, and the answer chain. No catch-all prose class is needed. That answers directive (d).

The framing that makes this the answer rather than a taxonomy
(`greenfield-disposition-graph.md:208-212`):

> The bootstrap operation's ledger [7] says "do not migrate 1-for-1". The content that motivated all of this was transient implementation guidance that drifted. So the validation question is not "does every field map" but "does every *persisting* content class have a home, and does nothing drifting get a home".

### 3.5 The one remaining declared transient construct: the null-authority shim

`greenfield-disposition-graph.md:148-153`, principle P8:

> P8. **Null-authority shim during the drain.** An unstamped disposition has authority class null and is formalized (class plus recommendation) whenever an adjacent disposition is aligned. Unstamped `under` edges default to delegated so topology edits remain possible. Liquidation: no null-class dispositions remain. (Author-stated this session.)

---

## 4. The tactic corpus: why it was a pain point, and what superseded it

### 4.1 Size and shape of the corpus

Measured (T2:545):

> Bucket recount from the files themselves (block-aware `office_hours`): **A 136** (implement 108, main-qa 21, qa 6, review 1), **B 178**, **C 148**, **D 201**

The four buckets are defined in the census brief (T2:423):

> it defines four buckets over the 657 legacy tactic-*.md nodes (A in-flight: phase set ≠ done and office_hours null; B parked: office_hours non-null; C drafts: phase absent, office_hours null; D done: phase done unparked).

Inventory at 0d859a74 (`greenfield-disposition-graph.md:164`):

> MEASURED inventory at 0d859a74: 770 nodes (virtue 7, kind 6, strategy 58, delegation 22, tradition 13, tactic 664).

### 4.2 Why they were a pain point

**Decay by construction: plan bodies rot with the code.** (T2:545)

> - **→ not-recorded**: `## Unit N` scopes, `**Recommended model:**` lines, `## Reuse` pointers, `path:line` anchors… these are the paradigm decay class and the corpus itself says so (`tactic-align-strategy-new-steps-drift-observations.md:113-116`, anchors stale by +62..+72 lines after one rename).

**Guidance outliving its referent — worked examples.** (T2:240)

> **Does not map cleanly yet — and this is the measured heart of your staleness concern.** The legacy clarification corpus: 132 multi-ruling clarifications (one carries 15 distinct rulings under at most one stamp), a deferred queue reading 10 items with 48 tolerated parse defects because most legacy stamps are free prose the strict grammar refuses, and 11 stop-hook-adjacent dispositions on `strategy-graph-native-dispatch` that are unstamped legacy — meaning their authority is *unknown*, and the overrule algebra therefore treats them as binding (refuse-to-restate) until an author touch. Live examples of the rot you're pointing at: the 2026-07-31 stop-hook clarification whose park-branch mechanism text described code deleted by c06c7295 (hand-amended this week), and `tactic-dispatch-stop-backstop-comment`, parked moot since 2026-08-04 because its target comment died — precisely the guidance-outliving-its-referent failure a liquidation condition would have caught mechanically.

**Durable content trapped in a node that is supposed to be pruned.** The census
found the corpus itself arguing against its own lifecycle
(T2:545, quoting `tactic-code-review-detached-node-lock.md:163-167`):

> "**Do not prune.** Pruning would discard the provenance and the reason the work existed — here, the 'one insertion point, not four' design finding above, **which is written down nowhere else.**"

**A kind invented to route around a write restriction.** (T2:545, quoting
`tactic-align-strategy-new-steps-drift-observations.md:85-90`):

> "**This node is not work. Do not dispatch it.** It carries no plan, no units and no verification, because there is nothing to build. It exists so four immaterial drift observations from one autonomous round have a durable home that is not the serving strategy's `clarifications` array, which an autonomous session may not write"

and the census's judgment on it (T2:545):

> 5. **IMMATERIAL-OBSERVATION (U3)** is structurally a class the graph invented to route around a write restriction, not a durable intent

**Permanent structure smuggled onto a transient kind** — the standing rule that
existed precisely because this kept happening
(`intentions/strategy-graph-native-dispatch.md:500-509`, author-dictated 2026-07-13):

> "No. Tactics are transient by definition; persistent structure lives on strategy (or virtue) nodes… a standing tactic would put permanent structure on a transient kind."

**Only one node in the corpus maps natively.** (T2:240)

> **Maps cleanly.** (a) Tactic plan bodies — transient natively: the node completes and prunes, its record folds to the git archive; no re-framing needed.

### 4.3 What superseded them — the reconciliation model

The retirement list (`greenfield-disposition-graph.md:201-208`):

> ### 5.1 What the record already deprecates (RECORD)
>
> The reconciliation vocabulary on kind-kind (2026-09-01, refined and partly ratified) already retires: the tactic shelf (claim + bite replace standing tactics), `success_signal` → criteria, `attributes.conditions` → assumption criteria, `gap` → frontier, `phase` → derived position, `reading` → assessment, office-hours parks → the deferred queue, every intervention lane → a variance class.

The ratified architecture that replaced the tactic shelf, quoted from the graph
by a T2 research subagent (T2:506, quoting
`strategy-graph-native-dispatch.md:6881-6893`, `(decision: author-ratified, 2026-09-01)`):

> The strategy node carries target state (statement + criteria prose + registered machine checks) and an operational layer (append-only evidence log + live claim records). The author sanctions CRITERIA, never slices or step lists. There is no standing decomposition into tactics: the backlog is the derived FRONTIER …; decomposition into a session-sized bite happens at claim time … and the bite exists only for the claim window. AUTHOR NOTE (2026-09-01): only tactic-shelf decomposition dissolves; strategy topology and the decomposition/mount rules (keystone reorg, mount schema) remain intent structure serving other functions.

The `validates` edge and the shelf, in the greenfield edge table
(`greenfield-disposition-graph.md:170`):

> | `validates` (tactic → strategy signal) | 88 tactics | dissolve | tactic shelf dissolves (RECORD 2026-09-01); criteria are child questions and claims append evidence to them |

The frontier that replaced the standing backlog
(`greenfield-disposition-graph.md:85-90`):

> **Frontier.** A flat scan of disposition state: unsatisfied criteria, unanswered questions (this subsumes gap notes and office-hours parks), stale-intent (a `cites` hash mismatch), overdue shims, and answers stamped deferred (the review queue). A claim is one frontier item; its strategy is derived. Lot-size-one, literally.

The frontier as implemented and read during T1's round (T3:2509, compaction
summary of the orchestration session):

> Frontier: `deriveReconciliationFrontier` (frontier-reconciliation.ts:351), pure, input `{nodes, checkRuns, gapNotes}`; five arms: unsatisfied-criterion (criterion with no bound check or failing check; assumption-class excluded), observe-failure, stale-intent (basis pins), overdue-shim (shims.ts:265), prose-gap (gap note with disposed_by null). Entries derived, never stored; no `lane` field.

The drain of the corpus under the new model
(`greenfield-disposition-graph.md:248-259`):

> ### 5.4 The drain under this model
>
> Bucket A and C tactics transcribe into criteria plus rationale question nodes under their strategy question; bucket B parks transcribe into unanswered questions carrying the park reason as rationale and the required authority (ratified for human-only and author-decision families; the reading chunks carry `grounds`); bucket D is evidence and prunes. This is ruling 2 unchanged.

Qualification on how much of the corpus the bootstrap actually transcribes
(T2:240):

> The plan transcribes all transient guidance *it owns*, and builds the machinery that drains the rest — it does not transcribe the legacy corpus wholesale… But the vast pre-existing clarification corpus is deliberately **not** bootstrap scope. It's measured as debt and drained incrementally: the `[CONSOLIDATION-DEBT]` table reads 7.5MB across 794 candidates (row one: `strategy-graph-native-dispatch`, 81KB body, 268 clarifications), and `[MULTI-RULING]` reads 132 candidates.

Net verdict of the whole mapping evaluation (T2:240):

> Net: the two classes are the right target and everything the bootstrap touches converges on them; the residue is (1) gap notes as an unratified third lane, (2) a large, measured, authority-ambiguous legacy prose corpus whose drain is by design incremental, and (3) one missing join in the criteria-ratification loop.

---

## 5. What was recorded into `intentions/`

### 5.1 T1's landing — three nodes, one `graph-commit`, `5ec769ff` on `origin/main`

The commit (T1:315, tool_use):

> `packages/intentionsutil/scripts/graph-commit -C … --base /tmp/claude-1000/align-round/dump/base-manifest.txt -m "align variance-doctrine round: greenfield intervention-to-variance disposition, intervention-lanes + manual-orchestration + manual-claim shims, bite-type skill doctrine, observe-node scope, Steering ledger [7]" strategy-graph-native-dispatch tactic-bootstrap-operation tactic-ladder-reconciliation-observe`

Result (T1:317, tool_result):

> `graph-commit: landed strategy-graph-native-dispatch tactic-bootstrap-operation tactic-ladder-reconciliation-observe on main`
> `ac09cc50..5ec769ff  5ec769ffa20ba90cf719f9e2b935501e474e5eef -> main`

Validation (T1:313): `ok — 794 nodes`. Diff shape (T1:307): frontmatter-only,
`3 files changed, 129 insertions(+), 1 deletion(-)`.

**(a) `strategy-graph-native-dispatch` — new clarification.** Question title and
answer as written (T1:284, the generating script):

> question: "Greenfield disposition - how do the legacy intervention lanes map to the reconciliation model, and what binds a bite's context (2026-09-02)?"
>
> answer: "(Recorded 2026-09-02 /align variance-doctrine round; author-directed greenfield evaluation - not a 1-for-1 migration, incumbents not sacred.) There is no intervention category in the target model: the legacy lanes exist only because legacy dispatch was edge-triggered - a signal fires, a reactive script catches it. Under level-triggered derivation every such trigger is a VARIANCE - a divergence between derived and target state, derived at read time as a reconciliation frontier entry, distinguished by class, never by mechanism. Doctrine: (1) a variance carries scope (the claim/node it attaches to) and blocking semantics - a gating variance (merge conflict, broken check, red main) halts its claim's further reconciliation; adopted from level-triggered control (Kubernetes conditions/controllers) and TPS jidoka/andon (stop the line, never pass a defect downstream); author-stated rationale 2026-09-02: prevent cascading failures and catch debt early, and isolate the intervention's context for token efficiency. (2) Resolution is ranked, dispatched, context-isolated bites - no standing intervention workers; a gating variance on an active claim outranks through the existing blocked_by attention inversion. (3) Each variance/bite class in the vocabulary is initialized WITH a dedicated resolution skill (author-directed 2026-09-02): the skill is the class's context binder - it front-loads exactly that class's procedure and bound-context recipe - and its telemetry unit, per-skill token attribution giving RSI cost-per-class; minting a type without its skill is a registry gap, the same census discipline as unregistered checks; mechanical parts stay in scripts the skill calls (mechanical-floor doctrine). This is the same principle as the incumbent ladder's one-skill-per-phase (author analogy 2026-09-02): the key generalizes from ladder phase to variance class, and the legacy per-lane skills re-key at liquidation rather than being discarded. (4) Recurring variance classes feed the RSI finding ledger and become criteria or tooling work. Dissolution map: fix-checks -> gating-variance bite (claim-scoped check run bound to a standing criterion); dispatch-conflict -> gating-variance bite (merge-tree variance); dispatch-diagnose-main -> repo-scoped gating variance under strategy-main-health's criteria; dispatch-invalid-state -> dissolves entirely into a stale-claim variance read from claim/release records (design-derived from the unbuilt claim-record surface, falsifiable at the P3 observe integration - flagged as design-derived, not measured); qa/main-qa/review residue handling -> already declared interim by this node's qa/main-qa/review shims; office-hours parks -> the deferred-decision queue (tactic-consolidation-operation's surface); flake-classifier lanes -> recurring-variance RSI findings. Per-PR check/merge signals need no per-PR criteria: the criterion is standing, the check RUN is claim-scoped operational state, and the variance is derived - the build item is claim-scoped run ingestion plus gating semantics in the deriver, recorded in-scope on tactic-ladder-reconciliation-observe the same day."

**(b) `strategy-graph-native-dispatch` — new shim entry** (T1:284):

> ```
> "id": "intervention-lanes",
> "target": "variance-classed reconciliation frontier entries with blocking semantics and ranked, context-bound bite resolution through per-class dedicated skills; interim = the dormant edge-triggered intervention lanes exactly as measured - fix-checks, dispatch-conflict, dispatch-invalid-state, dispatch-diagnose-main, and the flake-classifier lanes",
> "liquidation": "variance derivation and bite resolution proving out through the P3 observe integration and the P4 resumption gate; each lane retires as its variance class proves out, per the 2026-09-02 greenfield-disposition clarification's dissolution map",
> "liquidated_by": None,
> "declared": "2026-09-02",
> ```

**(c) `tactic-bootstrap-operation` — two shim entries** (T1:284):

> ```
> "id": "manual-orchestration",
> "target": "router-dispatched, context-bound skill resolution of reconciliation frontier entries; interim = the standing main-thread orchestration of steering ledger [1]/[6] - implementation delegated to model-tiered subagents while the main thread only orchestrates, gates, merges, and appends the ledger",
> "liquidation": "the P4 resumption gate discharges - a red check or any other variance becomes a frontier entry resolved by dispatched sessions, and no standing main thread remains",
> ```
> ```
> "id": "manual-claim",
> "target": "claim records plus the mechanical selection-validity gate (tactic-intent-orchestration-layer-schema's claim-record surface); interim = hand-provisioned worktree claims with Step-0 gate-bypass notes in round reports",
> "liquidation": "claim-record machinery live plus the P4 resumption gate",
> ```

**(d) `tactic-bootstrap-operation` — Steering ledger [7]** (T1:284). Question
title: `"Steering ledger [7] - what did the author direct on orchestration-protocol shims, the variance doctrine, and bite-type skills (2026-09-02)?"` — its answer quotes the author's three directives verbatim (reproduced in §2.3, §2.4, §2.6 above) and records the sweep negatives:

> Disposition: sweep result - manual-orchestration and manual-claim declared as shims on this node; the review-protocol terms (caps, effort tiering, functional-before-non-functional, no mid-window scope expansion) remain the review shim's own terms; the deferred-until-ratified authority rule is target doctrine, not a shim; the queue freeze, P1-P4 ordering, and same-turn ledger appends ride the bootstrap-carrier shim.

**(e) `tactic-ladder-reconciliation-observe` — scope clarification.** Recorded
text as it landed, shown in the diff (T1:307):

> ```
> +  - question: Scope clarification - are claim-scoped run ingestion and gating
> +      semantics in the observe integration's scope (2026-09-02)?
> +    answer: "(Recorded 2026-09-02 /align variance-doctrine round.) Yes, in scope:
> +      ingestion of claim-scoped operational signals - per-claim CI check results
> +      and merge-tree state - into the check-run state the frontier deriver
> +      reads, and gating semantics in the deriver: a gating variance (broken
> +      check, merge conflict, red main) halts its claim's derived progression
> +      rather than merely reporting it. Grounds: the same day's
> +      greenfield-disposition clarification on strategy-graph-native-dispatch
> +      (interventions are variances; blocking semantics adopted from
> +      level-triggered control and jidoka; rationale - prevent cascading
> +      failures, catch debt early, isolate context for token efficiency). No
> +      per-PR criteria are minted: the criterion is standing, the run is
> +      operational state, the variance is derived. The legacy edge-triggered
> +      lanes this integration eventually replaces are declared as the
> +      intervention-lanes shim on strategy-graph-native-dispatch."
> ```

### 5.2 T3's landing — Steering ledger [9]–[12] on the carrier, commit `2e421e2e`

The generating script (T3:2290) writes four clarifications onto
`tactic-bootstrap-operation`. The one that concerns transient disposition,
verbatim as written and as it now stands at
`intentions/tactic-bootstrap-operation.md:247-267`:

> question: "Steering ledger [12] - what did the author direct on transient-disposition classes (2026-09-02)?"
>
> answer: "(Author-issued 2026-09-02 to the /align amendment fork session, relayed same-hour, appended same-turn. Verbatim: \"An additional class(es) of transient disposition is fine, but there must not be a 'catch all prose' transient disposition. Evaluate using greenfield-evaluation criteria (nothing is sacred, interview to override doctrine, evaluate from the perspective of greenfield judgement and also reference to tradition). Use the existing corpus of transient disposition (tactics) to form the model. What falls out as 'prone to decay and therefore no longer recorded at all' vs. 'recorded as transient guidance but would be better described as persistent criteria' vs. 'shim'. Consider what kind of output an /align session might produce which doesn't fit any of those categories.\") Disposition: the transcription-class model is formed in the fork session's interview from the existing tactic corpus under greenfield-evaluation criteria; no catch-all-prose class is permitted. Standing effect on prior work: PR 3190's gap-note lane for the 12 author-required mainqa records is under review by this interview and is NOT settled precedent for the corpus drain; a re-transcription of those records may fall out. The ledger [10] drain design waits on the resulting class-model ruling. (decision: author-issued 2026-09-02)"

Its companion on the drain, ledger [10] (T3:2290):

> question: "Steering ledger [10] - what did the author direct on draining the tactic corpus (2026-09-02)?"
>
> answer: "(Author-issued 2026-09-02… Verbatim: \"I want all tactic nodes drained during bootstrap execution. A shim for draining deprecated tactic nodes is too much to carry past bootstrap. This also serves as validation for the new reconciliation model. The tactics don't need to be executed, but they must be transcribed to the new model.\") Disposition: extends the P2 transcription duty from the mainqa queue to the ENTIRE tactic corpus - the census buckets A (in-flight, 132), B (parked, 178), C (drafts, 146, previously undisposed), and D (done-residue, 201) all drain by transcription within bootstrap; execution of transcribed scope is not required for the drain; no drain shim survives bootstrap completion. The transcription-class model governing the drain is the subject of ledger [12] and its interview - the drain design waits on that ruling. (decision: author-issued 2026-09-02)"

And ledger [9], the `/align` shim directive (T3:2290):

> answer: "(Author-issued 2026-09-02… Verbatim: \"Bootstrap shims must include /align shims during bootstrapping so that this kind of alignment session is as close to greenfield as possible. Reconciliation of greenfield alignment is a named top priority for the bootstrap operation. Address this point first so that the rest of the alignment session proceeds using greenfield alignment doctrine.\") Disposition: the fork session runs its amendment round under greenfield alignment doctrine first; the resulting /align-shim declarations and rulings land through that round, routed to this carrier for ledger continuity."

### 5.3 Later carrier state on disk (post-survey verification)

`intentions/tactic-bootstrap-operation.md` now carries `attributes.shims`
entries `bootstrap-carrier`, `manual-orchestration`, `manual-claim`,
`align-greenfield`, and ledger clarifications [9]–[14]. Ledger [13]
(`:268-279`) and [14] (`:279-308`) postdate T1 and are quoted in §2.7 and §2.9.
Ledger [14]'s disposition records the newest shim declarations:

> the terminal-disposition marker, the self-close hold and the frozen-session sweep are declared shims with the stale-claim variance as target and claim-record machinery at the P3 observe integration as liquidation, so P3 now carries three more liquidations

### 5.4 Provenance note

T4:158, the locator session's conclusion, is what put T1's id into the author's
message at T2:2759:

> **Session:** `de6ae9cb-1bf0-4a91-a04e-c8086377aeff`… This is the session where you ran `/align` with the prompt "confirm that this steering is a shim for greenfield dispatch — evaluate how the legacy 'intervention' tasks are migrated to the new 'reconciliation' model…" — and it's where the transient-disposition-classes review landed. The results are recorded as **Steering ledger [12]** on `tactic-bootstrap-operation`

That attribution is half right: T1 ran the shim/variance round and its rulings
landed; the transient-disposition **class model** was formed in T2 and its
ledger entries landed from T3.

---

## Summary in ten sentences

1. The author's framing hypothesis was that greenfield records transient
   guidance in exactly two ways — re-framed as a persistent criterion, or
   declared as a self-liquidating shim — and he asked whether the legacy corpus
   maps cleanly onto those two (T2:227).
2. The evaluation confirmed both in substance and gave the drift argument for
   each — "a criterion can't rot silently because unsatisfied ones surface every
   derivation, and a shim can't rot silently because overdue ones do" (T2:240) —
   but reported a third carrier already in live use, gap notes, as "an executor
   interpretation, not recorded doctrine" (T2:240).
3. The author then ruled the class question open but bounded: "An additional
   class(es) of transient disposition is fine, but there must not be a 'catch all
   prose' transient disposition… Use the existing corpus of transient disposition
   (tactics) to form the model" (T2:259), to be evaluated under
   greenfield-evaluation criteria — nothing sacred, interview to override, fresh
   judgment plus tradition.
4. A measured census of the 657-node legacy tactic corpus found the two-class
   scheme covers "well under half the corpus by volume", that HOW-plan content is
   the largest class and is correctly not recorded at all, and that shims are
   "real but rare — ~55 nodes corpus-wide touch interim language, and only a
   handful carry an explicit liquidation condition" (T2:545).
5. The census enumerated eight content types that map to none of
   not-recorded / criterion / shim — design rationale, work boundary, immaterial
   observation, reading curriculum, human sitting, decision pending, evidence,
   supersession — and argued most of them want a representation on an existing
   structure rather than a class of their own (T2:545).
6. The resolution honored the no-catch-all constraint by dissolving the
   transient/persistent split rather than extending it: "Every one of the census's
   eight unmapped content types lands on one of four constructs: the unanswered
   question, the answer's rationale and rejected options, the evidence log, and
   the answer chain. No catch-all prose class is needed, which answers directive
   (d)" (T2:858), with the shim demoted from a class to "an interim answer with a
   liquidation criterion as child".
7. In the session the brief named (T1), the same principle produced the
   sharpest formulation of the "instrument the operational state, keep the
   disposition persistent" option: "Per-PR signals need no per-PR *criteria*: the
   criterion is standing, the check **run** is operational state scoped to a
   claim; the variance is derived" (T1:211), so no transient record is minted for
   a transient signal at all.
8. Where a genuinely interim *mechanism* did exist, T1 applied the shim test
   per mechanism and recorded the negatives too — "Executor-derived criteria enter
   deferred until ratification | **Not a shim** — that's the target authority
   model itself, permanent" (T1:211) — after the author ruled "One protocol shim,
   and evaluate whether other bootstrap orchestration protocols are better
   recorded as shims" (T1:181).
9. The author's greenfield instruction on the legacy lanes was explicit — "Do
   not migrate 1-for-1… nothing is sacred, esp. the incumbent implementation… some
   variances (like merge conflicts or broken checks) must be resolved before
   progressing reconciliation a) to prevent cascading failures, or collecting debt
   that can be caught early b) to isolate the context of these interventions for
   token efficiency" (T1:181) — and he adopted the resulting variance doctrine,
   the two-shim split, and the one-skill-per-bite-class doctrine (T1:213, T1:237).
10. Tactic nodes were the pain point precisely because they were a transient
    kind carrying durable content — `path:line` anchors "stale by +62..+72 lines
    after one rename", nodes whose bodies plead "**Do not prune.** Pruning would
    discard the provenance… **which is written down nowhere else**", and a kind
    "the graph invented to route around a write restriction" (T2:545) — and they
    were superseded by the reconciliation model in which "There is no standing
    decomposition into tactics: the backlog is the derived FRONTIER… the bite
    exists only for the claim window" (T2:506, quoting ratified doctrine), which is
    why the author's standing instruction is "Do not reinvent 'tactic nodes' which
    were a persistent pain point and superceded by the reconciliation model"
    (T2:2759).
