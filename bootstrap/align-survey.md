# Survey: the incumbent `/align` and the recorded greenfield design for it

Read-only survey of the legacy record, 2026-09-02. Every claim is cited
`path:line`; quotes are verbatim (wrapped source lines are joined with a space,
elisions marked `...`). `(author)` marks the author's own words where the record
attributes them. The vocabulary quoted below ("tactic", "strategy", "virtue",
"clarification", "office_hours", "graph-commit", "phase", "/exetasis") is
legacy, cited only as evidence. No recommendations are made here.

Path prefixes: `SK/` = `/home/n8/natb1/commons.systems/.claude/skills/`,
`IN/` = `/home/n8/natb1/commons.systems/intentions/`,
`RU/` = `/home/n8/natb1/commons.systems/.claude/rules/`.

## A. Inventory

| File | What it is | Size | Standing in the record |
|---|---|---|---|
| `SK/align/SKILL.md` | The implemented `/align` interview skill | 823 lines | Operational text, no intent authority (`IN/strategy-explicit-intent.md:993-1001`); a materialized projection of graph doctrine (`:1057-1059`) |
| `SK/align/scripts/validate-deployment.sh` | Three local pre-interview checks for the onboarding funnel | 86 lines | Operational text; the "mechanical floor" split from skill prose (`SK/align/SKILL.md:204-206`) |
| `SK/align-audit/SKILL.md` | Autonomous whole-graph integrity re-audit | 356 lines | Operational text; its **removal** was ratified 2026-08-30 (`IN/strategy-explicit-intent.md:787-790`) and it is still on disk |
| `SK/office-hours/SKILL.md` | Human-review dispatcher: read-only, names dispositions, never takes them | 542 lines | Operational text; the office-hours queue survives the standing-artifact test (`IN/strategy-explicit-intent.md:979-983`) |
| `RU/greenfield-evaluation.md` | Always-loaded rule projecting four ratified dispositions | 73 lines | Self-declared **shim**, liquidation condition "rules-materialization live" (`:3-11`) |
| `IN/strategy-explicit-intent.md` | Doctrine home of `/align`; 34 clarifications | 1126 lines | Live node; mixed ratified / deferred / delegated / legacy-null dispositions |
| `IN/tactic-consolidation-operation.md` | Unbuilt plan: authority-gated restatement + deferred-queue deriver | 941 lines | `status: codified`, `owner: ai` (`:1-8`); a delegated build, not doctrine |
| `IN/delegation-philosophical-articulation.md` | Delegation record: virtue-layer articulation held on trust | 176 lines | `status: codified`; a mount point, never doctrine (`IN/strategy-explicit-intent.md:552-554`) |
| `IN/strategy-graph-review-curriculum.md` | Review-curriculum strategy; `/align`'s enrollment role | 568 lines | Live node; its reading-and-review program is **deprecated** (`IN/strategy-explicit-intent.md:758-761`) |
| `IN/strategy-graph-self-description.md` | Schema-authority strategy (kind bodies are the one schema home) | 179 lines | Live node; 2026-08-31 ratification at `:131-143` |

## B. The incumbent `/align`, principle by principle

**1. The record is the sole carrier.** Everything the interview decides must be in the node when the round ends; the next session gets only the graph. PRINCIPLE. `SK/align/SKILL.md:35-40`
> the graph record is the **sole carrier** from this skill to `/align-tactics` — the target router queues re-evaluation as a fresh session with only the graph, no memory of this interview.

**2. The interview is the audit.** Nothing downstream checks that the requirement was captured. PRINCIPLE. `SK/align/SKILL.md:46-51`
> The interview **is** the audit ... a rushed interview is a permanent gap in the record, not a draft someone else will catch.

**3. Elicitation convention.** Open elicitation is a prose turn; the bounded-choice tool is reserved for gates, recommended option first. MIXED — the split is the principle, `AskUserQuestion` is the mechanic. `SK/align/SKILL.md:63-70`
> Reserve `AskUserQuestion` for bounded choices with a recommended option listed first ... open-ended elicitation is a normal conversational turn, prose reply captured as-is — never `AskUserQuestion`.

**4. Claim-and-isolate; the worktree is the claim.** Never author in the shared checkout: a concurrent dirty file blocks the landing and a stale read races live state. MIXED — isolation-before-write is the principle, the worktree/provisioning script is the mechanic. `SK/align/SKILL.md:73-89`
> Never author strategy edits in the shared `main` checkout ... The worktree **is** the claim.

**5. Verified-fresh checkout, fail-closed.** Any entry not made by the provisioning script must run the freshness assertion before **any graph read**. MECHANICS. `SK/align/SKILL.md:90-104`
> Never treat a failed fetch as license to proceed on unverified state.

**6. The ancestry projection is read-only context, never the contract.** MIXED — context-is-not-contract is the principle. `SK/align/SKILL.md:105-114`
> the node body remains the sole work contract (a plan that assumes the projection exists is still an incomplete record), and a perceived plan-vs-ancestry conflict parks to `office_hours` with a recommendation

**7. Doctrine-recording rounds pin the pace curve** so the autonomous fleet quiesces while doctrine settles. MECHANICS. `SK/align/SKILL.md:115-121`

**8. Multi-topic separation.** Independent concerns get their own node and their own round. PRINCIPLE. `SK/align/SKILL.md:127-133`
> each would need its own `success_signal` and could be pursued to completion without the other — treat it as N separate strategies ... Do not force unrelated concerns into one node to avoid re-running the interview.

**9. Duplicate/overlap detection, then edit-vs-new.** A strong overlap makes the round an **edit** whose starting point is the matched node read in full; otherwise a new node that must resolve to a virtue root. MIXED — dedupe-before-record is the principle; the census script and `validateGraph` rule 8 are mechanics. `SK/align/SKILL.md:134-147`

**10. A shortlist is never a disposition, and the dialectic is never delegated.** PRINCIPLE. `SK/align/SKILL.md:228-233`
> Keyword grep ... only **shortlists** candidates; it never disposes of one — disposition requires reading each shortlisted node in full ... the interview dialectic itself (step 2 onward) is never delegated.

**11. Onboarding funnel: orient → validate deployment → walk to a prompt → fall through.** MIXED. `SK/align/SKILL.md:148-220`. Orient is a one-screen description of the node kinds (`:154-215`); deployment validation is three local checks each with its own remediation, graph-clean fatal and router heartbeat non-fatal (`SK/align/scripts/validate-deployment.sh:5-36`); the walk converges on a crafted prompt in the practitioner's own terms and continues **in-session** rather than re-invoking the skill (`:212-219`). The old rung-0 virtue-review step was deliberately dropped (`:221-227`).

**12. Mechanical floor.** PRINCIPLE (token economy). `SK/align/SKILL.md:204-206`
> scripts carry what is mechanical, skill prose carries only what needs judgment.

**13. Two interview types, classified and stated before the dialectic.** Type b = the record is authoritative and the author has drifted; type a = the model lives in the author. PRINCIPLE. `SK/align/SKILL.md:238-263`

**14. Periagoge rules bind type b.** PRINCIPLE. `SK/align/SKILL.md:245-252`
> probes cite the record **at `origin/main`** as the fixed object — never the working tree ... the author articulates their own account before Claude's account appears; compulsion is argument only — press until resolved, never impose.

**15. Three exits always open; Claude never blocks and never withholds recording.** PRINCIPLE. `SK/align/SKILL.md:252-257`
> Three exits stay open to the author at all times: amend the record (the dialectic wins), defer ... or claim authority over Claude's account or a referenced tradition (an intentional divergence, recorded). Claude never blocks and never withholds recording.

**16. Visible-refusable draft binds type a**; joint inquiry is type a's elicitation limb, not a third type. PRINCIPLE. `SK/align/SKILL.md:258-263`

**17. Type b runs before type a when required author knowledge is unrecorded**, and type b's object is the topic's *ground*, not the decision surface. PRINCIPLE. `SK/align/SKILL.md:264-270`
> A type b confined to ratifying decision mechanics is the named deviation; explore the ground first, then take the formed decision into type a.

**18. Always surface three classes of finding**, in both types. PRINCIPLE. `SK/align/SKILL.md:271-274`
> always surface graph-internal inconsistencies, inconsistencies between the graph and Claude's internal knowledge (a good the author may not yet have seen), and parsimony findings (redundant seams).

**19. Question mechanics: recommendation + authority-in-option + boldness + genuine alternatives.** PRINCIPLE. `SK/align/SKILL.md:275-293`
> a **recommendation** — your best answer, listed first — carrying **in the same option** the authority under which it is accepted: **ratified**, **delegated**, or **deferred**

Other options must be alternatives with trade-offs, `never authority re-spellings of option 1` (`:289-290`); a different authority is taken through free-text "Other" (`:291-293`).

**20. Rules for proposing the authority, with escalation.** PRINCIPLE. `SK/align/SKILL.md:294-304`
> **ratify** for authority and vocabulary boundaries, charters and principles that bind future judgment, amendments touching ratified content, and transcriptions of the author's stated position; **delegate** for implementation detail under a ratified principle

...and `escalate one level toward ratify when being wrong is expensive, irreversible, or capture-shaped` (`:301-304`). The skill says **nothing** about who may write a ratified stamp, nor about any ratification act separate from the author choosing an option.

**21. Context must be delivered where the author will actually read it.** MIXED — unread context is undelivered is the principle; the tool surfaces are the mechanic. `SK/align/SKILL.md:305-313`
> The author reads neither Claude's thinking nor same-turn preamble emitted before the question call, so context living only there has not been provided — a boldness assessment stated only in preamble is undelivered.

**22. Deferral is defer-until-later-review, never a quiet drop; the stamp *is* the enrollment.** The born-parked review-item typology was **retired** 2026-09-01 and its one minted item pruned. PRINCIPLE + MECHANICS. `SK/align/SKILL.md:314-337`
> record-time enrollment mints **nothing** — /align records decision stamps, and the review queue derives from them. The former born-parked review-item typology this section carried is retired

Deferring to Claude's articulation extends the delegation record's scope **in the same round** (`:334-337`).

**23. The dialectic steps.** MIXED throughout. `SK/align/SKILL.md:338-456`. Intent (`:339-342`); placement of `serves`/`parent` (`:343-347`); **doctrinal-consistency gate** (`:348-370`), testing the draft against the model it joins while reading `doctrine **at origin/main, never the working tree**` (`:354-355`); benefit (`:365-370`); **steelman-alternative challenge** (`:371-386`) — PRINCIPLE, a rival framing sourced from the tradition records the `serves` virtues cite, resolved in adopt/diverge shape; signal (`:387-391`) — `A strategy with no plausible sensor is a sign the intent is still too abstract`; conditions (`:392-395`); edge cases with the dated-provenance clarification convention (`:396-412`), where `An amendment adds a new dated clause rather than rewriting the old one, so the history of resolutions stays legible` (`:405-407`); design-canvas support (`:413-431`); **persistent-layer ownership gate** (`:432-442`) — PRINCIPLE, standing structure is never owned by a transient node; **layer-placement gate** (`:443-456`) — MIXED, `a standing requirement — one that must still hold after every tactic currently serving the strategy completes and is pruned — lands as a strategy or kind clarification` (`:446-449`).

**24. Decomposition is deliberately not this skill's job.** PRINCIPLE. `SK/align/SKILL.md:467`
> | Decomposition | Deliberately **not** this skill's job — a strategy is never broken into PR leaves here; that is `/align-tactics` |

**25. Delegation advice surfaces capture risk explicitly.** MIXED. `SK/align/SKILL.md:471-492`
> high divergence or a gated, costly irreversibility means the author should weigh this before committing — state it in the `AskUserQuestion` description, not just in your own head.

**26. Tactical byproducts are retained, never refined and never dropped; the graph is the sole tracker.** PRINCIPLE. `SK/align/SKILL.md:493-547`
> Never write this content to an ad-hoc design doc outside `intentions/` — the graph is the only home for tactical context, however provisional.

Artifact-owner placement (`:500-511`): the owner is the strategy that owns the *artifact*, `never the nearest-fit strategy just because it is the one under interview`.

**27. Amendment completeness: an edit is a whole-node reconciliation.** PRINCIPLE. `SK/align/SKILL.md:576-589`
> one new clarification while a sibling field (an older clarification, a stale condition, an unrevised rationale sentence) still contradicts it is an incomplete amendment, the same defect class as an incomplete record

...and `The author's live presence in this interview reduces but does not remove the risk: the record, not the session, is the carrier.` (`:586-587`).

**28. Write path and landing.** Never hand-edit frontmatter; dump the node for a compare-and-swap base; one landing path; one commit per round per strategy; a parking exit stops the round rather than retrying. MECHANICS. `SK/align/SKILL.md:548-623`
> Then land it — `graph-commit` is the **only** write path, never a hand-rolled `git commit`/`git push`.

**29. Scope-inert re-stamp, fail-closed on doubt.** MECHANICS. `SK/align/SKILL.md:624-672`
> only a confident scope-inert verdict re-stamps; on **any** doubt — including a merely plausible substance change — do nothing further here.

**30. Documentation completeness over commit size.** PRINCIPLE. `SK/align/SKILL.md:673-684`
> or omit it, to keep the commit small or to avoid a re-stamp. Commit size is never a reason to put documentation in the wrong place

**31. Measure with the authoritative predicate, never a grep.** PRINCIPLE, stated through legacy helpers. `SK/align/SKILL.md:685-699`
> A cost estimate that drives a recording or materiality decision must come from the same predicate the router uses, not a text search.

**32. Materiality-scoped freeze; rank is not a proxy for materiality.** MECHANICS. `SK/align/SKILL.md:700-744`
> There is **no rank gate** — rank is not a proxy for materiality.

**33. Curriculum enrollment at record time, minting nothing.** Mode A: the decision stamp is the enrollment. Mode B: being recorded is the enrollment. MIXED. `SK/align/SKILL.md:745-769`
> Never create a per-node review schedule, a standing review item, or a side list for author-owned doctrine.

**34. The clause-coverage walk discharges the completeness contract.** PRINCIPLE. `SK/align/SKILL.md:770-789`
> An unmapped clause never drops silently: either return to the interview for it, or land it in a draft tactic body. State in your final summary to the author which clause mapped where

**35. The `model` field note / token economy.** MECHANICS. `SK/align/SKILL.md:10-21`
> skill stays whole-session Opus because its interview dialectic is non-delegable ... If the harness does not honor this field on the interactive path, the default here is intended-not-guaranteed

**36. Doctrine currency — nothing recorded.** `grep -in "shim|doctrine currency|greenfield|frontier"` over `SK/align/SKILL.md` returns exactly one hit (`:761`, the word "frontier" inside curriculum prose). The skill has no shim-loading step, no self-reconciliation-to-`origin/main` step, and no mention of greenfield evaluation. It reads *graph doctrine* at `origin/main` (items 14, 23) but never its own operative doctrine.

## C. The recorded greenfield design for `/align`

**C1. Three-state disposition model; the human-authorship floor retired.** Ratified 2026-08-30 (author). `IN/strategy-explicit-intent.md:539-587`
> recorded on a native node — virtue, strategy, tactic, kind — is in exactly one of three states: AUTHOR-RATIFIED DOCTRINE, DELEGATED-PENDING-REVIEW (held on trust, a sitting will ratify/amend/decline), or DELEGATED-REVIEW-DECLINED

Mounts (tradition, delegation) `are MOUNT POINTS — never doctrine` (`:552-554`). `any decision may be delegated, but delegation depth is PRICED, not forbidden` (`:556-557`) (author). Standing instruction, author-directed: `Claude exercises every delegated decision by greenfield design merit, never by cheapest-thing-that-works` (`:577-579`). An accepted residual exposure is recorded: the author overruled Claude's insistence on two guards Claude called load-bearing (`:583-587`).

**C2. Canonical state vocabulary; the interview minimum.** Ratified 2026-08-30 (author). `IN/strategy-explicit-intent.md:761-767`
> (2) STATE VOCABULARY — canonical stamp states are ratified / deferred / delegated; the interim names migrate (delegated-pending-review → deferred; delegated-review-declined → delegated)

> (3) INTERVIEW MINIMUM — every interview question offers at least: the recommendation, accept as deferred for review, accept as delegated (don't care).

**C3. Review is disposition-scoped, not node-scoped, and ranked.** Ratified 2026-08-30 (author; the null slot from Claude). `IN/strategy-explicit-intent.md:751-760`
> RATIFIED: (1) DISPOSITION MODEL — /exetasis selects a ranked DISPOSITION, not a node (a node carries many); ranking is a function of node rank, graph position (keystone dispositions prioritized), timestamp, and disposition category

Order `deferred > null > ratified > delegated`, glossed by the author verbatim (author): `deferred 'author explicitly said it requires exetasis' outranks ratified 'are you sure?' outranks delegated 'do you still not care?'` (`:756-759`). Sitting scope is single-disposition with opportunistic may-batch (`:774-776`).

**C4. One review mechanism, superseding the rest.** Ratified 2026-08-30 (author). `IN/strategy-explicit-intent.md:758-761`
> /exetasis supersedes ALL other author-owned graph review processes except telemetry monitoring via the WIP dashboard — including the curriculum reading-and-review program, now deprecated

**C5. `/align` adjacency duty.** Ratified 2026-08-30 (author). `IN/strategy-explicit-intent.md:776-780`
> every legacy-null disposition a round quotes, amends, or touches an edge incident to MUST be dispositioned in that round; silence is a defect of the round.

**C6. `/align-audit` retirement.** Ratified 2026-08-30 (author, verbatim fragment). `IN/strategy-explicit-intent.md:787-790`
> (11) /align-audit retirement — deprecate and REMOVE, no charter fold-in ('just deprecate and remove')

**C7. The overrule algebra, four rules.** Ratified 2026-08-31 (author; rule 4 an author refinement of Claude's proposal). `IN/strategy-explicit-intent.md:797-817`
> (1) A ratified disposition is overruled only in interview - /align or /exetasis - never during execution or rsi. (2) Delegated and deferred dispositions may be overruled by AI during either execution or rsi

Rule 3: an overrule of a deferred disposition inherits the deferred stamp; rule 4: an AI overrule of a delegated one **becomes deferred** and `every AI override enters the author review queue` (`:803-808`). `The superseded stamp survives in the record - clarifications append, never rewrite` (`:808-810`).

**C8. Ownership lives on dispositions, not on nodes.** Ratified 2026-08-31 (author). `IN/strategy-explicit-intent.md:813-817`
> in the greenfield model the author recognizes no function for the node-level owner schema - ownership categories live on dispositions

`status: delegated` and `owner: ai` survive only as brownfield carriers; their migration is delegated to Claude (`:815-817`).

**C9. Full-frontier definition and the dual-perspective rule.** Ratified 2026-08-31 (author). `IN/strategy-explicit-intent.md:843-856`
> every reference to 'greenfield' - especially while exercising /align - evaluates the FULL solution frontier, not 'ideal design given implicit constraints'; the frontier includes review of ratified dispositions where alternative framing would yield a more ideal design.

> 'Ratified' does not mean unchangeable; it means changing it requires an author interview - and /align IS that interview

> greenfield evaluation by AI always includes evaluation from the perspective of AI best judgment AND evaluation with reference to tradition, and every tradition reference surfaced is recorded with the resolution it informed.

**C10. Doctrine vs disposition; the atomic unit of intent.** Ratified 2026-08-31 (author). `IN/strategy-explicit-intent.md:857-872`
> 'doctrine' names a RATIFIED disposition and nothing else - unratified content is a disposition, never doctrine. The atomic unit of intent is the disposition: a decided thing bearing an authority stamp.

Intent fields are role-typed *carriers*, and `a role distinction earns its keep only where a consumer reads it mechanically` (`:863-866`). Whether the greenfield design keeps `rationale` at all is under delegated evaluation, proposals arriving deferred (`:867-872`).

**C11. Intent/orchestration layer boundary; the consolidation operation.** Ratified 2026-08-31 (author); classification and tooling delegated. `IN/strategy-explicit-intent.md:873-898`
> orchestration writers never rewrite intent fields, and intent writers never rewrite orchestration fields.

> for ratified content it happens only in interview; for delegated or deferred content it follows the overrule algebra, an AI consolidation being itself a deferred disposition entering the author queue.

Appends are the cheap default *between* consolidations; git is the deep history (`:890-893`).

**C12. Context materialization; the binding floor; materialize-or-refute.** Ratified 2026-08-31 (author); floor membership **deferred**; tooling **delegated**. `IN/strategy-explicit-intent.md:899-935`
> A minimal ratified BINDING FLOOR always loads in full ... everything else is ordered by the rank triage charter ... and compacted to a target context size, harness-memory style

Refined 2026-09-01, author-ratified: `every .claude/rules doctrine item receives a recorded disposition, materialize or refute; a survivor earns materialization only by surviving an adversarial greenfield evaluation` (`:925-930`); completeness is **standing**, `so nothing is ever grandfathered` (`:930-933`).

**C13. What a from-scratch evaluation deliberately KEPT.** Ratified 2026-08-31 (author). `IN/strategy-explicit-intent.md:936-966`
> monitoring capture) and KEPT on merit, not incumbency: (1) persistence as plain markdown nodes in git, one file per node, id as filename slug

Also kept: serialized landing (`batching, never parallelism, is the sanctioned efficiency lever`, `:949`); rank derived on read; the kind system plus the three-state algebra; the one-layer target-state design; the closed rank vocabulary. `Each keep is a disposition and remains frontier-reviewable in future interviews` (`:959-961`).

**C14. The graph is the governance layer; the record is the only theory.** Ratified 2026-09-01 (author). `IN/strategy-explicit-intent.md:967-990`
> every standing coordination artifact must justify itself as alignment, verification, or irreversibility-guard - never as coordination economy.

> the session's head is rebuilt from the record every time, so THE RECORD IS THE ONLY THEORY THERE IS - the deep rationale for the record-completeness contract and the persistence test.

**C15. Authority primacy; incumbent never constrains greenfield.** Ratified 2026-09-01 (author-issued). `IN/strategy-explicit-intent.md:991-1032`
> The primacy ordering is: RATIFIED dispositions > DEFERRED/DELEGATED dispositions > OPERATIONAL TEXT.

> INCUMBENT IMPLEMENTATION NEVER CONSTRAINS GREENFIELD DISPOSITION — constraint flows one way, from dispositions down to implementation

Also (author-refined): `a disposition is well recorded only when its position in the graph topology ensures it survives the multi-level compaction floors` (`:1011-1015`); relative-importance management is Claude's duty by doctrine, discharged at record time by the placement gates (`:1020-1029`).

**C16. Landing location is not a disposition.** Ratified 2026-09-01 (author). `IN/strategy-explicit-intent.md:1033-1048`
> Interviews must not spend question rounds on landing location - ask about substance (intent, authority, scope); choose placement per the recorded placement rules

The delegation is `class-level, review-declined flavor: no per-instance stamps, no review items` (`:1040-1042`).

**C17. Doctrine currency and the align-greenfield shim.** Ratified 2026-09-02 (author), amended same round (author-directed). `IN/strategy-explicit-intent.md:1049-1071`
> the session itself reconciles the align skill's operative doctrine to the graph at origin/main before the dialectic proper, enumerating and overriding stale skill prose; the enumeration is the session's job, never the author's.

Amendment inverting the default (`:1061-1064`):
> align skill USES every declared alignment shim by default - a session reconciles itself to doctrine at origin/main and applies the declared shims without being prompted; a prompt is required only to BYPASS a shim.

Author verbatim (author): `'the alignment skill must use any alignment shims by default, and only bypass shims if prompted.'` (`:1067-1068`).

**C18. Greenfield/brownfield state doctrine.** Ratified 2026-08-31 (author); **superseded in part** 2026-09-01. `IN/strategy-explicit-intent.md:818-842`
> the graph maintains an always VALID, always ITERABLE, always ALIGNED greenfield state, and a critical brownfield migration path maintained even while implementation lags.

The plans/ stop-gap and the batch-execution priority are `ENDED`; the successor is the bootstrap operation (`:834-842`).

**C19. Deferral doctrine, now fully virtual.** Recorded 2026-07-09, amended twice 2026-08-30, `Author-ratified with the explicit caveat that it supersedes the author's own same-day ruling` (`:340-341`). `IN/strategy-explicit-intent.md:304-341`
> review items are FULLY VIRTUAL. A review-later deferral no longer mints a born-parked node at deferral time — the deferral's delegated-pending-review stamp IS the review record

Content-bearing curriculum nodes remain stored, minted lazily (`:337-341`). Restated on the curriculum node: `record-time enrollment mints NOTHING for any disposition. /align records decision stamps; the queue derives from them` (`IN/strategy-graph-review-curriculum.md:154-157`).

**C20. Standing of deferred vs delegated content.** Recorded 2026-08-30 (author-directed); the asymmetry Claude-drafted, author-adopted. `IN/strategy-explicit-intent.md:473-505`
> Neither deferred nor indifference-delegated content is author doctrine. Both are therefore revisable by Claude for better greenfield design as information accumulates or requirements are added — but asymmetrically.

Delegated content is freely and silently revisable; deferred content is revisable **with carry-forward** — `the revised content re-stamps pending-review, never silently doctrine or declined` (`:501-503`).

**C21. Who may write a ratified stamp — nothing recorded directly.** No surveyed clarification states it. It is implied by C7 rule 1 and by C1's state name `AUTHOR-RATIFIED DOCTRINE`. The stamp schema and its lint are themselves delegated and held pending review: `until it lands, dated prose ownership tags are the interim carrier` (`IN/strategy-explicit-intent.md:574-577`). Interim grammar `(decision: <state>, delegation-anthropic-claude, YYYY-MM-DD)` (`:579-582`); ratified stamps `may stay two-element` (`:764-765`).

**C22. Standing condition on authorship.** A node condition, amended 2026-08-30. `IN/strategy-explicit-intent.md:1098-1104`
> virtue and strategy substance defaults to author authorship, with agent assistance as drafting; delegating substance is legal under the three-state model but carries a decision stamp

**C23. An authority stamp already migrating into structured fields.** `IN/strategy-explicit-intent.md:1116-1124` carries an `attributes.criteria` entry with `class: functional`, `authority: deferred`, `recorded: 2026-09-01` — evidence that stamps had begun moving out of prose before the bootstrap.

**C24. The reconciliation plan: specified, not built.** `IN/tactic-consolidation-operation.md`, a delegated build.
- **One authority gate, consulted by every carrier**, implementing the overrule algebra `with no re-derivation` (`:376-445`, algebra at `:412-435`), behind a `DispositionSource` seam with a tolerant state-normalization table (`:390-411`). Its refusal default is load-bearing: `empty input → permitted: false, reason "no disposition stamps found — authority is unknown, treat as binding"` (`:428-430`).
- **The deferred-disposition queue deriver**, liquidating the `grep -rn "decision: deferred" intentions/` shim (`:446-497`, `:190-198`).
- **One-ruling-one-stamp normalization** (`:605-647`). Measured defect: `4 clarifications carry ≥2 (decision: stamps, but **130** carry ≥2 distinct ALL-CAPS ruling labels under at most one stamp` (`:614-616`), so `A single stamp is silently claiming authority over rulings it was never issued for` (`:616-618`). An unstamped segment becomes `authority: "unknown"`, which `is a refusal, routed to the author queue, not a default` (`:637`).
- **Why**: `A single node is **645 KB**. Reading it whole is roughly 160k tokens` (`:231-232`); consolidation is ratified but `nothing builds it` (`:210`).
- Four planned modules and the operational store were confirmed **absent** on 2026-09-01 (`:334-347`).

**C25. What the delegation record delegates, and its floor.** `IN/delegation-philosophical-articulation.md:65-110` names the delegated scope, including `the graph-wide interview-method doctrine (the periagoge scoping: where turn-don't-implant binds fully versus where the visible-refusable-draft convention holds)` (`:67-70`). Floor (`:159-161`):
> the capacity to notice a recorded articulation contradicting a disposition actually held

Recovery: each tradition record verified against its texts flips delegated → codified; when none remain delegated the delegation unwinds (`:40-46`). Divergence `moderate`, recovery ungated (`:112-148`).

## D. Contradictions and tensions

**D1. No doctrine-currency step in the skill; the ratified design requires one by default.** `SK/align/SKILL.md` has no "shim"/"doctrine currency"/"greenfield" text at all (B36) versus `IN/strategy-explicit-intent.md:1061-1071`, which requires the reprojected skill to load and apply declared alignment shims **at Step 0**. The skill's Step 0 is worktree claiming (`SK/align/SKILL.md:71-114`).

**D2. `/align-audit` exists though its removal is ratified.** `SK/align-audit/SKILL.md:1-30` versus `IN/strategy-explicit-intent.md:787-790`. Under C15 this is a stale-projection frontier item, not two authorities.

**D3. `/align-audit` carries the retired born-parked typology and cites a skill that does not exist.** `SK/align-audit/SKILL.md:105-107` requires `A deferral lands a dated held-on-trust clarification plus one born-parked review item in the same commit`, and `:103` / `:39` / `:217` / `:227-228` cite `.claude/skills/align-strategy/SKILL.md` — a path `ls` confirms is absent (the directory is `align`). Contradicted by `SK/align/SKILL.md:314-322` and `IN/strategy-explicit-intent.md:329-336`.

**D4. Review-mechanism duplication.** The skill still owns curriculum enrollment (`SK/align/SKILL.md:745-751`) and names the curriculum frontier as the recurrence mechanism (`:759-764`), while the record deprecates that program in favour of a single sitting mechanism (`IN/strategy-explicit-intent.md:758-761`).

**D5. Adjacency duty absent from the skill.** The skill's question mechanics use the canonical three states (`SK/align/SKILL.md:281-285`, matching C2), but nothing in it disposes of legacy-null content as `IN/strategy-explicit-intent.md:776-780` requires of every round.

**D6. "The interview is the audit" vs. the record of the rounds.** `SK/align/SKILL.md:46-51` versus `IN/strategy-explicit-intent.md:506-538`, where the round's own adversarial draft-review gate reads `SKIPPED at commit time` (`:511-512`) and the delegation sweep `PARTIAL — the census ran but its Delegations section was not walked entry-by-entry` (`:533-535`); a post-hoc review then returned 12 MATERIAL findings (`:519-521`). The same skip is recorded for two further rounds at `:707-712`.

**D7. The skill treats its own text as operative while treating the graph as evidence.** Items 14 and 23 fix the *graph* at `origin/main` (`SK/align/SKILL.md:245-248`, `:354-355`), yet the skill's 823 lines are followed as written — and `IN/strategy-explicit-intent.md:993-1001` names skill files explicitly as carrying no intent authority at any rank.

**D8. Greenfield-evaluation rule vs. the skill's shape.** `RU/greenfield-evaluation.md:15-19` requires every evaluation to cover the full solution frontier with `Nothing is sacred: no doctrine is implied, especially not by the incumbent implementation.`, while the skill's only adversarial step tests the strategy's *intent* against a rival framing (`SK/align/SKILL.md:371-386`) and it has no step that reviews a ratified disposition.

**D9. The rule file's own liquidation condition is weaker than the doctrine's.** `RU/greenfield-evaluation.md:3-11` liquidates on "rules-materialization live"; `IN/strategy-explicit-intent.md:925-933` requires each rule item to be individually dispositioned materialize-or-refute, standing rather than one-shot.

**D10. Mounts are never doctrine, yet the deferral mechanic writes substance to one.** `IN/strategy-explicit-intent.md:552-554` versus `SK/align/SKILL.md:334-337`, which extends the delegation record's scope in-round; that field is now ~46 lines of accreted, unstamped prose (`IN/delegation-philosophical-articulation.md:65-110`).

**D11. Fields the greenfield model has no function for are still written.** `IN/strategy-explicit-intent.md:813-817` versus `SK/align/SKILL.md:513`, whose draft-tactic JSON writes `"owner":"ai","status":"raw"`.

**D12. Internal: sole-carrier contract vs. the same-session escape.** `SK/align/SKILL.md:41-45` calls an in-session `/align-tactics` pass `a bootstrap safety net, not a substitute for a complete record`, while `:723-729` names that same inline pass as the operative re-evaluation mechanism `as every round recorded on strategy-graph-native-dispatch so far has done by hand`.

**D13. Internal: two elicitation rules in one paragraph.** `SK/align/SKILL.md:63-64` demands the interview not be `AskUserQuestion`-free; `:64-67` reserves the tool for bounded choices only; `:212-216` forbids it in the onboarding walk.

**D14. Internal: landing-location doctrine vs. the placement machinery.** `IN/strategy-explicit-intent.md:1035-1044` makes placement class-level delegated with `no per-instance stamps, no review items`; the skill runs three placement gates (`SK/align/SKILL.md:432-456`, `:500-511`) and records each resolution as a dated clarification (`:441-442`).

## E. What the record says the shim should be

The `align-greenfield` shim's own declaration lives on `IN/tactic-bootstrap-operation.md` (not read, per brief). What follows is from `IN/strategy-explicit-intent.md:1049-1071` unless noted.

- **Scope.** Reconcile the align skill's *operative doctrine* to the graph at `origin/main` before the dialectic proper, `enumerating and overriding stale skill prose` (`:1053-1055`).
- **Where it lives.** `Declared during bootstrap as the carrier's align-greenfield shim` (`:1056-1057`) — on the bootstrap carrier node, not in the skill.
- **What it must not do.** Put the enumeration on the author — `the enumeration is the session's job, never the author's` (`:1055-1056`); or require prompting — `a prompt is required only to BYPASS a shim` (`:1064`).
- **Who invokes it.** The align session itself, every run, unprompted: `a session reconciles itself to doctrine at origin/main and applies the declared shims without being prompted` (`:1062-1064`).
- **Liquidation condition.** `the reprojected skill text must itself instruct a session to load and apply the graph's declared alignment shims at Step 0 by default` (`:1069-1071`).
- **Persistence.** Not bootstrap-only: `the usage pattern persists post-bootstrap whenever alignment doctrine changes - skill prose is a materialized projection, and a prompted /align session must run on current doctrine even when the projection lags` (`:1057-1060`).
- **Two sibling shims, for shape.** `RU/greenfield-evaluation.md:3-11` — a hand-materialized rule projection, liquidation "rules-materialization live", with a conflict rule: `If this file conflicts with the graph at origin/main, the graph wins — treat the conflict as a stale-projection frontier item, not as two authorities.` And the deferred-queue shim: a documented `grep -rn "decision: deferred" intentions/` practice, `liquidation condition: deriver live` (`IN/tactic-consolidation-operation.md:190-195`).

## F. Commands run

1. `wc -l` over all ten input files.
2. `sed -n` over `SK/align/SKILL.md` in four passes: 1-200, 200-420, 420-640, 640-823.
3. `cat -n RU/greenfield-evaluation.md`.
4. `grep -n "2026-08-31|2026-09-01|2026-09-02|greenfield|shim|doctrine currency|doctrine-currency|disposition|ratified|delegated|deferred|overrule|attenuation|full solution frontier|full-solution|dual-perspective|dual perspective" IN/strategy-explicit-intent.md`, head and tail.
5. `sed -n` over `IN/strategy-explicit-intent.md`: 1-60, 180-360, 440-600, 740-800, 797-935, 935-1075, 1075-1126.
6. `grep -rln "align-greenfield"` over `intentions/` and `.claude/`.
7. `grep -n "^#|^## |^### " IN/tactic-consolidation-operation.md`; `sed -n` 1-30, 135-262, 262-380, 376-500, 605-660, 924-941.
8. `cat -n IN/delegation-philosophical-articulation.md`.
9. `grep -n "ratif|defer|amend|overrule|disposition|untrusted|read-only" SK/office-hours/SKILL.md`; `sed -n '440,542p'`.
10. `sed -n '1,40p' SK/align-audit/SKILL.md`; `grep -n "disposition|author|route|ratif"`; `sed -n '92,126p'`; `sed -n '205,236p'`; `sed -n '215,219p'`; `sed -n '227,231p'`.
11. `cat -n SK/align/scripts/validate-deployment.sh | sed -n '1,40p'`.
12. `ls .claude/skills/`; `ls .claude/skills/align-strategy` — confirmed absent.
13. `grep -n "align|ratif|/exetasis|review item|curriculum" IN/strategy-graph-review-curriculum.md`; `sed -n '135,160p'`; `sed -n '154,158p'`.
14. `grep -n "align|ratif|projection|self-descri|stored-default" IN/strategy-graph-self-description.md`; `sed -n '30,50p'`; `sed -n '131,146p'`.
15. `grep -n` anchor pins for every quoted phrase in both primary files.
16. Anchor re-check: `sed -n 'N,Mp'` re-run over every cited range in B, C and E; six loci corrected as a result (`:467`, `:513`, `:586-587`, `:949`, `:428-430`, `:637`, `:231-232`, `:190-195`, `:1098`, `:506-538`).
