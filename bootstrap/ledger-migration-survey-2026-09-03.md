# Ledger migration survey (2026-09-03)

Answers two author questions: can the ledger be migrated to deferred
dispositions and sunset now that `/align` is shimmed; and are there
redundancies between shims, the bootstrap operations document (CLAUDE.md),
session memory, and the ledger. Method: every LEDGER.md entry L01-L40 checked
against the live text of all 34 nodes under `disposition/disposition-graph/`
and `disposition/public/`, against `disposition.yaml`, against CLAUDE.md, and
against the memory pointer file, plus the pre-strip ledger-to-node mapping
recovered by a source-controlled-history search at the disposition ref's last
commit (before today's field removal). Persistence classes are those defined
in `disposition-graph/transience.md`: standing disposition or criterion;
shim (declared in a node's `shims` field); proposal; open question; evidence;
not recorded.

## A. Per ledger entry

**L01 — archē is the root answer form**
- Source: author ruling quoted ("I prefer the greek word archē over 'care'").
- Node: `disposition-graph/node` (table; history search: node.md prose "Ledger L01, L14").
- Delta: node.md's Answer already names archē as a form ("held, never derived"); not carried: the three Aristotle loci grounding the word (Metaphysics V.1, Posterior Analytics I.3, NE I.4) or "nothing ranks above one."
- Home: `amend node` — one line: "archē (Metaphysics V.1's three senses; Posterior Analytics I.3; Nicomachean Ethics I.4) is held, never derived, so nothing ranks above one."

**L02 — the root is agency**
- Source: author ruling quoted ("agency - make reference to authorship in the body").
- Node: `public/agency` (table; history search: agency.md, aristotle-arche-of-action.md, pettit-non-domination.md all `ledger: L02`).
- Delta: none. agency.md's Answer and stub note already carry the ruling, the EE II.6/Politics I.4 grounding, Korsgaard authorship, and the pending-readings list (Sen, Hirschman, Korsgaard) verbatim as the node's own text.
- Home: `nothing`.

**L03 — graphs as packages, import-path ids, mount shim**
- Source: author ruling quoted (the "just like a Go repo..." passage).
- Node: `disposition-graph/namespaces`, `disposition.yaml` (table; history search: namespaces.md `ledger: L03` + prose).
- Delta: none. namespaces.md's Answer covers import-path ids and the mount-shim liquidation; its Rationale already names Go modules and Unix mount namespaces as owed readings; `disposition.yaml` carries module/graphs/target/liquidation.
- Home: `nothing`.

**L04 — persistence: own ref, compare-and-swap landing, no PR**
- Source: author ruling quoted/paraphrased plus an AI evaluation.
- Node: `disposition-graph/persistence` (table; history search: persistence.md `ledger: L04` + prose).
- Delta: none live. Ref/worktree creation is now version-control history; the ratify-command liquidation moved to `authority`; the `yaml`-from-ancestor shim is declared verbatim on `materialization`'s `shims` field.
- Home: `nothing`.

**L05 — implementation sessions read projections, never the graph**
- Source: author ruling quoted.
- Node: `disposition-graph/projection` (table; history search: projection.md `ledger: L05` + prose).
- Delta: none. projection.md's Answer carries the README/description/tags projections, `CLAUDE.local.md` pinned at a graph commit, the narrow write verbs, and the cross-reference to `session-context`.
- Home: `nothing`.

**L06 — traditions on instrumenting first principles**
- Source: author ruling quoted ("These tradition references are good. They must be recorded...").
- Node: `disposition-graph/instruments` (table; history search: capture-traditions.md and instruments.md both `ledger: L06`).
- Delta: instruments.md's Rationale names most of the eleven traditions as owed readings (Jefferson/Madison, NY Constitution, Peirce, Rawls/Goodman/Daniels, Kuhn, the overruling-factors case, IEC 61508, process-safety management) but not Seneca/the Ignatian examen or sunset clauses by name.
- Home: `amend instruments` — one line: "readings also owed for Seneca, De Ira III.36, and the Ignatian examen (periodic review of conduct against principle), and for sunset clauses on delegated and emergency powers."

**L07 — cadence review of archai rejected; expiry stays on delegated authority**
- Source: author ruling quoted (skeptical of cadence review) plus the 2026-09-02 mechanism quote.
- Node: `disposition-graph/instruments` (table; history search: authority.md and instruments.md prose "Ledger L07, L08").
- Delta: none. instruments.md's Answer states re-grasp-on-events-never-calendar, the contradiction trigger, and "Open: whether a delegated stamp itself sunsets" verbatim.
- Home: `nothing`.

**L08 — re-grasp triggers are events**
- Source: author ruling quoted/paraphrased.
- Node: `disposition-graph/instruments` (table; history search: prose "Ledger L06, L07, L08").
- Delta: none. instruments.md's Answer lists all five triggers in the same order.
- Home: `nothing`.

**L09 — tradition readings carry authority; deferred reading recurses**
- Source: author ruling quoted at length, plus a follow-up question on the function of reading nodes.
- Node: `disposition-graph/readings` (table; history search: readings.md `ledger: L09` + prose).
- Delta: none. readings.md's Answer/Rationale carries the ratified/delegated/deferred stamp classes, recursion, and the four-things-it-buys list nearly verbatim.
- Home: `nothing`.

**L10 — the bootstrap grant**
- Source: author ruling quoted.
- Node: table says `disposition-graph/bootstrap`, now pruned (L39); history search confirms bootstrap.md carried `ledger: L10` before pruning.
- Delta: none live. The grant is now declared, verbatim in substance, as a `shims` entry on `authority.md` ("the bootstrap grant, under which the AI stubs nodes... with no ratified ancestor").
- Home: `nothing` — already re-homed as a shim on `authority`; the table's pointer is stale (see Section D).

**L11 — reconciliation runs in both directions**
- Source: author ruling quoted.
- Node: `disposition-graph/work-loop` (table; history search: work-loop.md `ledger: L11` + prose).
- Delta: none. work-loop.md's Answer/Rationale carries both directions, the coverage-prune-by-default proposal, and the legacy-drain subsumption.
- Home: `nothing`.

**L12 — bootstrap is onboarding; purpose first**
- Source: author ruling quoted at length (the full purpose statement, target audience a/b/c, the scope-coverage request).
- Node: `disposition-graph/purpose` and children (table; history search: purpose.md, audience.md, capture.md, knowledge-store.md, software-factories.md, spec-driven-development.md, srs-introduction.md, aristotle-hexis.md all `ledger: L12`; growth.md and projection.md prose-cite it too).
- Delta: fully distributed across the eight children already named. The one loose thread: `bootstrap/sitting-purpose-author-2026-09-02.md`, the author's verbatim probe-one answer behind the redraft, is cited only by CLAUDE.md's round log, not by purpose.md itself.
- Home: `nothing` for the disposition text; the author's-quote file is low-value evidence, fine left in version-control history once the round log goes (see Section D).

**L13 — rank serves onboarding**
- Source: author ruling quoted.
- Node: `disposition-graph/attention` (table; history search: attention.md `ledger: L13` + prose; growth.md and under.md also prose-cite it).
- Delta: none. attention.md's Answer carries rank-as-one-fact-three-readings and the boost-ratification consequence verbatim.
- Home: `nothing`.

**L14 — the schema nodes**
- Source: informational/AI proposal (table source: proposal).
- Node: `disposition-graph/model` and children (table; history search: authority.md, growth.md, model.md, node.md, under.md all `ledger: L14`).
- Delta: the twelve-node list is carried in model.md's Rationale (plus `materialization`, added later). The frontmatter field enumeration ("question, form, ... ledger") is stale: `ledger` is gone and `shims` exists now, superseding the list; the schema's actual authority is `validate.mjs`, not this prose.
- Home: `nothing` — the stale field list is evidence-grade only; the validator is the live source of truth.

**L15 — `/align` is materialized from the ratified schema**
- Source: author ruling quoted at length (critical path to `/align`; adopt incumbent principles for shimming).
- Node: `.claude/skills/align/SKILL.md` shim on `growth` (table; history search: growth.md prose "Ledger L12, L13, L15, L17, L38"; no dedicated frontmatter field since it names an artifact, not a node).
- Delta: growth.md's `shims` field already declares the skill shim verbatim. Not carried anywhere live: the itemized adopted-principles list (fable as default model, landing location never asked, the mechanical floor, one question per node, whole-node amendment, doctrine currency) and the rejected-mechanics list (issue trackers, tactics, phases, the router and gates, born-parked review, placement gates, curriculum, the skill's own text as authority).
- Home: `amend growth` — one line: "kept in force from the incumbent: fable as default model, landing location never asked, the mechanical floor; rejected: issue trackers, tactics, phases, the router and gates, born-parked review, placement gates, curriculum, the skill's own text as authority (evidence: `bootstrap/align-survey.md`)."

**L16 — exit criteria**
- Source: informational/AI proposal.
- Node: table says `disposition-graph/bootstrap` instrument, now pruned.
- Delta: none live. All five criteria are now the liquidation condition of two shims: four ("every rule is a node or shim," "dispatch selects from this graph," "`/align` is the only recording path," "nothing live reads legacy," "every implementation has a completed review") on `session-context.md`'s `shims` field; the fifth ("this ledger is empty and deleted") on `authority.md`'s `shims` field.
- Home: `nothing` — fully migrated; table pointer stale (Section D).

**L17 — legacy nodes are evidence, never imported**
- Source: informational/AI proposal, grounded in an author ruling quoted inside the node.
- Node: `disposition-graph/legacy` (table; history search: legacy.md `ledger: L17` + prose; growth.md and work-loop.md also prose-cite it).
- Delta: none. legacy.md's Answer/Rationale carries the author's two quotes and the evidence-only doctrine verbatim.
- Home: `nothing`.

**L18 — README, description, and tags are projections**
- Source: author ruling quoted.
- Node: `disposition-graph/projection`, "a bite on `main`" (table; status still `open`).
- Delta: projection.md's Answer already states the README/description/tags projections. Not carried: the reason (a code-hosting README cannot embed a live page) and that the README therefore renders the purpose page statically or links the browser's deep link.
- Home: `amend projection` — one line: "a hosted README cannot embed a live page, so the README renders the purpose page statically or links the browser's deep link at the purpose node." The bite itself (editing `main`) is unbuilt work, correctly `not recorded` as a disposition.

**L19 — the revision-2 model page is input, not doctrine**
- Source: stub/informational.
- Node: none; disposed by "deleted with this ledger."
- Delta: the entry only describes an evidence artifact, `bootstrap/model-proposal.html`, which no live node cites.
- Home: `evidence` — `bootstrap/model-proposal.html`; uncited, prune-by-default per `work-loop` once the ledger (its only citer) is gone.

**L20 — delete this ledger**
- Source: author ruling ("When every other entry is ratified or rejected, delete this file").
- Node: none named; the ledger's own self-liquidation instruction.
- Delta: none. `authority.md`'s `shims` field already states this as the LEDGER.md shim's liquidation condition ("every entry is sorted into a node amendment, a criterion, a shim declaration, evidence, or nothing, and the file is deleted").
- Home: `nothing`.

**L21 — definitions of "appropriate" unit, model, and effort for delegation**
- Source: author ruling quoted.
- Node: table says "a node under `growth`" — correctly targeted, but no such node exists yet; status `open`.
- Delta: the entire content (unit/model/effort definitions) lives only in CLAUDE.md's "Token efficiency" section. No node carries it. Duplicates L23 below.
- Home: `amend growth` — one line: "a unit is one deliverable with a written contract and a verifiable output; sonnet for mechanical or format work, opus for design- or judgment-heavy units, haiku for lookups; effort is stated in the brief." (Merge with L23; see Section D.)

**L22 — vocabulary and traditions on the onboarding path**
- Source: author ruling quoted.
- Node: no single id; table says "`defines` field; the browser."
- Delta: the `defines` field is live on nearly every node, and projection.md already states term-linking and setting readings apart. Not settled: whether a dedicated vocabulary-view page survives — the (unruled) playback item 4 proposes removing "the vocabulary page" under the general materialization principle.
- Home: `open question` on `projection` — "whether a dedicated vocabulary-view page is kept, given item 4's materialization principle, or per-term links suffice."

**L23 — token-efficiency rule for bootstrap sessions**
- Source: author ruling quoted (twice: the efficiency rule, and the memory-vs-file question).
- Node: table says `disposition-graph/bootstrap`, now pruned; content in fact still lives only in CLAUDE.md.
- Delta: (a) the unit/model/effort definitions duplicate L21, still no node; (b) the memory-vs-CLAUDE.md tradeoff is already carried by `session-context.md`'s Rationale ("memory is private to one account and one path, so it can carry nothing the record needs").
- Home: `amend growth` — same one-liner as L21 (this is one gap recorded twice, not two).

**L24 — scope node and coverage review**
- Source: author ruling quoted (embedded in L12).
- Node: `disposition-graph/scope` (table; history search: scope.md `ledger: L24`); status `open`.
- Delta: none. scope.md today is exactly what the entry describes: an open question carrying the twelve-function survey as its Proposal, unruled.
- Home: `nothing` — the entry only narrates scope.md's current (still-open) state; nothing is lost by deleting the entry, though the underlying question stays open until the author rules.

**L25 — the disposition ref stores the graphs and only the graphs**
- Source: author ruling quoted.
- Node: `disposition-graph/materialization`, `persistence` (table; history search: materialization.md `ledger: L25`).
- Delta: none. materialization.md's Answer states it verbatim; the described file moves are now completed history.
- Home: `nothing`.

**L26 — graph tooling is justified by disposition like all materialized implementation**
- Source: author ruling quoted.
- Node: `disposition-graph/materialization` (table; no distinct citation at the last commit — folded into L25's node without its own frontmatter tag).
- Delta: none. materialization.md's Answer ("each artifact is the instrument or the projection of the node whose answer it checks or renders") carries this; the ratify-command liquidation is on `authority.md`.
- Home: `nothing`.

**L27 — materialized implementation is organized as a `packages/` monorepo**
- Source: author ruling quoted.
- Node: `disposition-graph/materialization` (table: "a reading owed").
- Delta: none beyond the reading itself, which materialization.md's own Rationale already flags as owed ("a reading is owed") — self-tracked, not lost by deleting the ledger entry.
- Home: `nothing`.

**L28 — shim: greenfield implementation on a third ref, swapped with `main` at exit**
- Source: author ruling quoted.
- Node: `disposition-graph/materialization`; the `greenfield` ref (table).
- Delta: none live. materialization.md's `shims` field declares the greenfield-ref shim with the same liquidation ("swapped with `main`... after whatever on `main` is to survive has been reconciled"). Worktree/orphan-branch mechanics are correctly operational (CLAUDE.md session mechanics).
- Home: `nothing`.

**L29 — shimmed code review for every bootstrap landing; review doctrine before exit**
- Source: author ruling quoted at length, plus two amendments (the legacy session's rules; the author's ratification-gated-review ordering).
- Node: `disposition-graph/review` (table; history search: review.md `ledger: L29`).
- Delta: none of substance. review.md's Answer carries the blocking-severity gate, the two-round cap, frozen scope, defect-class-cut rule, functional-before-non-functional, effort tiers, delta-only review, the subagent fix loop, and the bootstrap review-after-ratification ordering. The exact recipe (flags, exit codes, wall-clock figures) is correctly left to CLAUDE.md pending the review instrument's materialization.
- Home: `nothing` for the disposition; see Section B for the CLAUDE.md recipe residue.

**L30 — evaluation doctrine; shims apply by default**
- Source: author ruling quoted (from the legacy record, given again to this bootstrap).
- Node: `disposition-graph/evaluation`; `.claude/rules/evaluation.md` (table; history search: evaluation.md `ledger: L30` + prose).
- Delta: none. `.claude/rules/evaluation.md` matches evaluation.md's node text closely; no drift found between the two.
- Home: `nothing`.

**L31 — `CLAUDE.md` is justified and materialized by disposition**
- Source: author ruling quoted.
- Node: `disposition-graph/session-context`; `projection` (table; history search: session-context.md `ledger: L31` + prose).
- Delta: none. session-context.md's `shims` field and Rationale already map every CLAUDE.md section to its future home (growth, review's instrument, evidence, version-control history). One correction already landed live: the pre-strip rationale said the round log and decisions list liquidate "into the bootstrap node and version-control history"; the live node now says "into the growth node and version-control history" (bootstrap having been pruned same day). See Section D.
- Home: `nothing`.

**L32 — ratification is the dialectic's outcome; the ratify script is liquidated**
- Source: author ruling quoted.
- Node: `disposition-graph/authority`, `growth` (table; history search: authority.md prose "ledger L32" inline, plus "Ledger L07, L08, L14").
- Delta: none of substance. authority.md's Answer/Rationale carries the rubber-stamp rejection and the command's liquidation verbatim; growth.md's sitting movements carry the dialectic-steps detail (interview type, author's account first, evaluation twice, recommendation with authority/boldness/alternatives).
- Home: `nothing`.

**L33 — `/align` usage: a disposition to record, or a node id to ratify or review**
- Source: author ruling quoted.
- Node: `disposition-graph/growth`; the shim (table; no distinct citation at the last commit).
- Delta: none. growth.md's Answer states the two usages verbatim ("given a disposition... given a node id...").
- Home: `nothing`.

**L34 — `/align <node id>` is the two-stage review sitting**
- Source: author ruling quoted at length, plus the restarted-sitting correction.
- Node: `disposition-graph/growth` (table; no distinct citation at the last commit).
- Delta: none of substance. growth.md's Answer carries the periagogic/maieutic stages and the exact movement order (reading, comprehension, intention, ruling) in detail exceeding L34's own text. The narrative of the one deviation and its correction is evidence/version-control history, not needed as ongoing doctrine.
- Home: `nothing`.

**L35 — the interview conducts are named: periagogic (type b), maieutic (type a)**
- Source: author ruling quoted.
- Node: `disposition-graph/growth`; readings `plato-periagoge`, `plato-maieutics` (table; history search: both reading nodes `ledger: L35` + prose).
- Delta: none. Both reading nodes carry full loci and adopted/divergence notes; growth.md uses the terms throughout. "The letters are retired from the shim" is a transitional note, safely evidence-only.
- Home: `nothing`.

**L36 — functional validation before non-functional validation**
- Source: author ruling quoted.
- Node: `disposition-graph/validation-order` under `work-loop` (table; history search: validation-order.md `ledger: L36` + prose, and "ledger L29, amendment; L36").
- Delta: none. The criteria-class axis, staged ordering, and traditions (make-it-work-right-fast, waste elimination, the quality-characteristics standard) are all in validation-order.md's Rationale; the readings themselves stay owed, self-flagged on the node.
- Home: `nothing`.

**L37 — transient disposition**
- Source: author ruling quoted at length (bootstrap-node quote; the 2026-09-03 drift instruction; the legacy ruling on transient-disposition classes).
- Node: `disposition-graph/transience` (table; history search: transience.md `ledger: L37`).
- Delta: the five/six-shape doctrine, the rejected alternatives, and the traditions-owed list are fully on transience.md. Not carried: the two large evidence files that grounded the node's scrutiny, `bootstrap/transient-disposition-graph-survey.md` and `bootstrap/transient-disposition-transcript-survey.md`, are cited only by the ledger, not by transience.md itself.
- Home: `amend transience` — one line: "evidence: `bootstrap/transient-disposition-graph-survey.md`, `bootstrap/transient-disposition-transcript-survey.md`." The remaining "owed" item, the frontier projection for shims, is correctly `not recorded` — it is already an honest instrument note on the node ("not yet materialized for shims"), not stored guidance.

**L38 — recommendations carry authority, boldness, and persistence class**
- Source: author ruling quoted.
- Node: `growth` (table; history search: prose "Ledger L12, L13, L15, L17, L38").
- Delta: none. growth.md's Answer and the reproduced author quote carry this in full.
- Home: `nothing`.

**L39 — rulings of 2026-09-03 on the purpose playback, items 1 to 6**
- Source: author ruling quoted at length (six numbered rulings).
- Node: `growth`, `authority`, `materialization`, `session-context` (table).
- Delta: every claim in the Content paragraph is independently confirmed live: the four `shims` fields, the pruned `bootstrap` node, the absent `ledger:` field. Not carried anywhere but the review yaml (correctly, since unresolved): items 3 and 6, and questions q10 (quote retention), q11 (this survey), q12 (review-item context), q13 (review-page adoption).
- Home: `nothing` for the resolved portion; q10-q13 are correctly `open question`, evidenced by `bootstrap/review/sitting-purpose-2026-09-03.yaml`.

**L40 — the sitting's review page**
- Source: author ruling quoted (item 3 and the pause, quoted inside L39).
- Node: `growth` shim (table).
- Delta: none. growth.md's `shims` field declares the review-page shim with matching artifact, purpose, and liquidation. "Applies by default" is already standing doctrine on `evaluation`, so it need not repeat here.
- Home: `nothing`.

## B. Per section of CLAUDE.md

**Shim notice (blockquote, top of file)** — Class: shim notice. Persistence: shim. Redundant with: this is itself the projected notice of `session-context.md`'s `shims` field; content matches (orientation-page framing, liquidation trigger). Verdict: correct to keep as the shim's own copy; not new content.

**Intro paragraph (why not session memory)** — Class: rationale restatement. Persistence: not recorded (orientation prose). Redundant with: `session-context.md` Rationale ("memory is private to one account and one path, so it can carry nothing the record needs"); L23. Verdict: trim to one sentence; the reasoning is authoritative on the node now.

**## What this ref is** — Class: operational (filesystem map) plus one evidence paragraph (creation history, job id, abandoned session). Persistence: not recorded / evidence. Redundant with: `materialization.md` (packages/, the `greenfield` shim), `namespaces.md`/`disposition.yaml` (the `disposition/` tree), `review.md` (the review-instrument path). Verdict: the tree map is genuine operational residue (no node states a filesystem layout); keep it. The creation-history paragraph is evidence-grade only, safe to drop once orientation no longer needs it.

**## Token efficiency** — Class: undelivered disposition (a rule with no node yet). Persistence: none of the recognized classes — this is exactly the L21/L23 gap. Redundant with: LEDGER.md L21 and L23 (all three copies of the same missing doctrine); the "Decisions taken so far" bullet 17 below. Verdict: this is the one section whose content must land on a real node (`amend growth`, per L21/L23) before it can leave CLAUDE.md.

**## The loop** (incl. "Commands, from this worktree") — Class: mixed. The phase list is a compressed restatement of `growth.md`'s Answer (propose/project/ratify-or-steer). The "Commands" list (exact invocations, the published addresses) is operational; the browser address matches `projection.md`'s `shims` field verbatim. Persistence: operational (commands) / redundant prose (phase list). Redundant with: `growth.md`, `projection.md`'s shim. Verdict: cut the phase-list restatement; keep the Commands list — no node states literal command lines, and this is exactly the "operational, no node projects it as prose" residue the shim notice anticipates.

**## Code review (L29)** — Class: the Rules paragraph is a near-verbatim compression of `review.md`'s Answer (blocking severity, two-round cap, frozen scope, defect-class cut, functional-before-non-functional, effort tiers). The Recipe (exact flags, exit codes, wall-clock figures, out-dir tagging) is operational, explicitly marked on `review.md`'s own shim as "not yet materialized" doctrine. Redundant with: `review.md` (Rules paragraph, near 1:1). Verdict: cut the Rules paragraph; keep the Recipe until the review node's instrument is materialized, exactly as the task framing anticipates.

**## Round log** (Round 0; Sitting on purpose; Review log) — Class: evidence (dated narrative). Persistence: evidence. Redundant with: LEDGER.md L37-L40 (the same rulings and encodings, narrated twice), and the memory file's "STATE AT LAST WRITE" section (the same sitting-status facts, a third time). Verdict: the sharpest triple-redundancy found in this survey. Reduce to a one-line pointer at `bootstrap/review/sitting-purpose-2026-09-03.yaml`, which already holds this state in structured, queryable form.

**## Session mechanics** (Worktrees; Skill discovery; Writes; the isolated-session Bash restrictions; Dependencies; Reading legacy evidence; Memory) — Class: environment traps, none of them this project's disposition. Persistence: not recorded, correctly so (facts about the surrounding harness, not about this repository). Redundant with: the "Dependencies" bullet duplicates `materialization.md`'s `yaml`-from-ancestor shim; the "Memory" bullet duplicates the memory file's own self-description. Verdict: keep all of it — this is squarely the residue the shim notice names ("environment traps"); trim only "Dependencies" to a one-line pointer at the shim.

**## Interview conventions** (four bullets) — Bullet 1 (prose turns preferred; one `AskUserQuestion` rejected) has no node; a real but small gap. Bullet 2 (ground in record and tradition; cite by locus) matches `growth.md`'s comprehension-stage doctrine. Bullet 3 (incumbent text is context, never doctrine) is `legacy.md` verbatim, same author quotes. Bullet 4 (adversarial self-review) is `evaluation.md`'s closing sentence verbatim. Redundant with: `growth.md`, `legacy.md`, `evaluation.md` (bullets 2-4, near-total overlap). Verdict: cut bullets 2-4; bullet 1 is a small residual gap, `criterion on growth` ("prefer prose turns for open matters; bounded choices may use numbered options with a recommended default").

**## Decisions taken so far** (20 bullets, each citing "(author)" and usually a ledger id) — this list is structurally a compressed re-statement of the ledger entries it cites, which Section A has already shown are themselves near-total restatements of node text. Per bullet:

1. Node = one question and its standing answer — redundant with: `node.md`.
2. Out-of-scope AI answers are inert proposals, never deferred — redundant with: `authority.md`.
3. Ratified stamps are the author's alone (L04) — redundant with: `authority.md` (the citation itself is stale: this fact lives on `authority`/L32, not L04/persistence).
4. The word archē replaces "care" — redundant with: `public/agency.md`, `node.md`.
5. Two graphs, ids as import paths (L03) — redundant with: `namespaces.md`, `disposition.yaml`.
6. No PR for graph landings — redundant with: `persistence.md`.
7. No tactics; not bound by legacy ids — redundant with: `legacy.md`.
8. This is the bootstrap session; the parent is not restarted — redundant with: nothing (pure provenance); evidence/version-control history only.
9. The bootstrap grant (L10) — redundant with: `authority.md`'s shim.
10. Reconciliation in both directions (L11) — redundant with: `work-loop.md`.
11. Bootstrap as onboarding; purpose first; README/description/tags as projections (L12, L18) — redundant with: `purpose.md`, `projection.md`.
12. Rank serves onboarding (L13) — redundant with: `attention.md`.
13. Cadence review rejected (L07) — redundant with: `instruments.md`.
14. Tradition readings carry authority; deferred recurses (L09) — redundant with: `readings.md`.
15. The ledger is disposed of before exit; critical path to `/align` (L15) — redundant with: `authority.md`'s shim (the ledger), `growth.md`'s shim (the skill).
16. Root id agency (L02) — redundant with: `public/agency.md`.
17. Delegate to subagents by unit, model, effort (L21, L23) — redundant with: nothing yet; the same still-missing `growth`-child node as L21/L23 above.
18. The disposition ref holds only the graphs; `packages/` monorepo; the third ref (L25-L28) — redundant with: `materialization.md`.
19. Every bootstrap landing gets shimmed code review (L29) — redundant with: `review.md`.
20. The `/align` shim adopts the incumbent's principles; shims apply by default (L15, L30) — redundant with: `evaluation.md`, `growth.md`'s shim.

Verdict on the list: 19 of 20 bullets are pure restatement of a node or a shim already in force; bullet 8 is provenance (evidence-only); bullet 17 is the one live gap, identical to L21/L23. `session-context.md`'s own Rationale already directs this list "to version-control history" (not to any node), so cutting it outright — once bullet 17's content lands on `growth` — is the disposition's own stated plan, not a new recommendation.

**Residue: what CLAUDE.md should retain once the ledger sunsets** — the shim notice; a one-sentence orientation intro; "What this ref is" (the tree map, minus the creation-history paragraph); the Commands list under "The loop"; the code-review Recipe only (not its Rules paragraph); all of "Session mechanics" (Dependencies trimmed to a pointer); interview-convention bullet 1 only, if not promoted to a criterion. **What moves out**: the Token-efficiency section (to a `growth`-child node); the Code-review Rules paragraph (already on `review.md`); the Round log (to a pointer at the review yaml); the Decisions-taken-so-far list (to version-control history, per `session-context.md`'s own plan); Interview-conventions bullets 2-4 (already on `growth.md`/`legacy.md`/`evaluation.md`).

## C. The memory pointer file

`greenfield-disposition-graph-review-doc.md` duplicates, almost line for line: the ref/worktree layout and tree contents already in CLAUDE.md's "What this ref is"; the validate/project/tests/review-page commands already in "The loop"; and the sitting's current status (items 1-6 ruled, q10-q13 open) already in CLAUDE.md's Round log and in LEDGER.md L39-L40 — making the same facts a fourth copy, not just a third. The file's own frontmatter description calls it a "pointer," but its body is a restatement, which is exactly the redundancy the author asked about. It correctly holds two things nothing else holds: the reason memory can't carry the record itself (private to one account and path, unversioned, invisible to subagents — itself now also stated on `session-context.md`), and the standing instruction to re-read the live refs after compaction.

Recommended one-line reduction: "Greenfield disposition-graph bootstrap: the persistent record lives on the `greenfield` and `disposition` refs, not here — read `CLAUDE.md` (What this ref is; Round log) and `LEDGER.md`'s last two entries there before resuming; open items are at `bootstrap/review/sitting-purpose-2026-09-03.yaml`."

## D. Verdict

**Can the ledger be sunset now?** Almost, but not in one keystroke. Of the 40 entries, 31 already resolve to `nothing` — their content is fully, sometimes verbatim, carried by live nodes or by already-declared shims, with zero loss from deleting the entry text today. 7 entries need a one-line amendment first (6 distinct amendments, since L21 and L23 are one gap counted twice); 1 is an open question already tracked off-ledger; 1 is an orphaned evidence file. No entry needs a brand-new shim (every shim the ledger describes is already declared on some node's `shims` field) and no entry needs a fresh criterion. So the ledger is not blocking on missing mechanism — `/align`'s shim and the `shims`-field convention already absorbed the hard part (see L39/L40) — it is blocking on a short, enumerable punch list.

**Blockers, by entry id:**
- L21 / L23 (merge to one action): the "appropriate" unit/model/effort doctrine for delegation has no node at all yet, only CLAUDE.md prose. This is the one substantive gap — a real disposition, not a copy-edit — and the only blocker that plausibly needs an interview turn rather than a mechanical amendment.
- L01, L06, L15, L18, L37: five small one-line amendments to already-deferred nodes (`node`, `instruments`, `growth`, `projection`, `transience`) — additive rationale/evidence clauses, no ratification required to add them since the nodes are still deferred.
- L22: one open question to leave exactly where it is (`projection`, vocabulary-view page vs. per-term links) — does not block deletion, just stays open after.
- L19: one evidence file (`bootstrap/model-proposal.html`) to delete or explicitly re-cite; currently cited by nothing but the ledger.

**Migration order recommended:**
1. Author the missing `growth`-child node for L21/L23 (the one real gap) — this is the only step that should go through `/align` rather than a mechanical edit, since it is new standing doctrine.
2. Batch the five one-line amendments (L01, L06, L15, L18, L37) in a single mechanical pass — additive, low-risk, no ratification gate.
3. Delete `bootstrap/model-proposal.html` (L19) and trim CLAUDE.md per Section B's residue (cut the Code-review Rules paragraph, the Decisions-taken-so-far list, and Interview-conventions bullets 2-4; reduce the Round log to a pointer).
4. Reduce the memory file to the one-line pointer in Section C.
5. Record the author's ruling on q11 (this survey) and delete LEDGER.md; `authority.md`'s own shim liquidation condition ("every entry is sorted... and the file is deleted") is then met by construction.

**Counts by recommended home (40 entries):** `nothing` — 31 (L02-L05, L07-L14, L16-L17, L20, L24-L36, L38-L40, i.e. all but the nine below). `amend <node>` — 7 entries / 6 actions (L01 node; L06 instruments; L15 growth; L18 projection; L21+L23 growth, merged; L37 transience). `open question` — 1 (L22, already tracked). `evidence` — 1 (L19). `criterion on` — 0 (none needed beyond the CLAUDE.md interview-conventions bullet noted in Section B). `shim on` — 0 (every shim the ledger names is already declared). `not recorded` — 0 as a primary entry-level home, though several entries note a secondary not-recorded fact already correctly handled in place (L18's unbuilt bite; L37's unmaterialized frontier projection).

**Inconsistencies found (ledger text vs. live node text):**
1. LEDGER.md L31's body ("its token-efficiency rule and loop liquidate into `bootstrap` and the skill") vs. `disposition/disposition-graph/session-context.md` Rationale, which now reads "into the growth node and the skill." The ledger still names the now-pruned `bootstrap` node as the destination; the live node already corrected this to `growth` the same day `bootstrap` was pruned (L39). Not a live contradiction an executor could act on wrongly, since the node is the authority and is current — but a clear instance of exactly the drift `transience.md` describes, sitting inside the artifact whose whole purpose is to be superseded.
2. LEDGER.md's own table, disposed-by column, for L10, L16, and L23: all point at `disposition-graph/bootstrap`, which no longer exists. Content-wise this is harmless for L10 and L16 — their substance is confirmed already migrated to `authority.md`'s and `session-context.md`'s `shims` fields — but the table column itself is stale evidence of the same pattern as (1), not updated when `bootstrap` was pruned; for L23 the stale pointer coincides with a real gap (no node exists yet), which is why L21/L23 is the one blocker in this survey.
No inconsistency was found between the ledger and any node's *Answer* (the operative doctrine); both instances above are stale *destination pointers* in narrative or tabular text, not disagreements about what the standing answer is.
