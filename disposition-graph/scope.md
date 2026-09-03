---
question: What does this repository cover, and in what order?
stage: review
recommendation:
  class: ratified
  boldness: moderate
review:
  verdict: forward
  strength: moderate
  date: 2026-09-03
  of: 708da26c3b97b18e98255c7e6b1cc499049aa303
form: rule
authority:
  class: deferred
  by: claude
  date: 2026-09-03
boost: 9
order:
  - [commons.systems/disposition-graph/scope, commons.systems/disposition-graph/projection]
  - commons.systems/disposition-graph/growth
  - commons.systems/disposition-graph/session-context
  - commons.systems/disposition-graph/work-loop
  - commons.systems/disposition-graph/rsi
under:
  - commons.systems/disposition-graph/purpose
defines:
  - table of contents
  - section
  - order
---
## Disposition

The author, 2026-09-03:
> new disposition (alignment shim): I want a new disposition with the rationale for high level ranking. As onboarding documentation flow/ranking this sits just after the purpose and serves as the scope section following the purpose and also serves as a table of contents onboarding documentation. It records this disposition for high level ranking: purpose -> [scope, self documentation (via the graph browser)] (equal) -> alignment -> harness context management -> reconciliation -> rsi
>
> High level rank (but not all rank) should be materialized from this node to avoid drift. Recommend how to do that using existing primitives (materialized linting? or somthing else?).

## Answer

The purpose and six sections after it, two of them equal and listed together, in one order that is at once the reading order of the record, the order in which its parts are reconciled, and the order of the author's attention. This node is the table of contents of that walk: the browser presents the sections in this order and the frontier bites them in this order, because the rank of every node named here is held to this list.

1. Purpose: what this repository is for. `commons.systems/disposition-graph/purpose`.
2. Scope: this node, what the record covers and in what order. Equal with it, self-documentation: the record is its own documentation, read through the graph browser, the human projection, which renders every node in this order. `commons.systems/disposition-graph/projection`.
3. Alignment: the dialogue by which the author's dispositions enter the record, and the only way they do. `commons.systems/disposition-graph/growth`.
4. Harness context management: what a session loads and where each part of it comes from. `commons.systems/disposition-graph/session-context`.
5. Reconciliation: how the implementation is derived from the record, and the record amended from what the work finds. `commons.systems/disposition-graph/work-loop`.
6. Recursive self-improvement: the loop applied to itself. `commons.systems/disposition-graph/rsi`.

What the repository covers is what these sections cover: the record, its projections, the dialogue that writes it, the context a session loads, the loop that derives the implementation, and the loop's improvement of itself; the two hypotheses under purpose are within scope as hypotheses. What it leaves out is open: the coverage node under purpose names four recorded functions outside the purpose as worded, for the author to bring in or exclude.

High-level rank is materialized from this node. The order above is recorded once, here, as the field `order`; the rank of every node it names is held to it, and a boost that contradicts it is invalid. Every other rank stays with each node's own boost, as the attention node describes.

## Rationale

The author's ruling of 2026-09-03, quoted above: a disposition that carries the rationale for high-level ranking, sits just after purpose, serves as the scope section and as the table of contents of the onboarding walk, records the order purpose, then scope and self-documentation through the browser as equals, then alignment, harness context management, reconciliation, and rsi, and materializes high-level rank so that it cannot drift. The order is the author's; the boost values, the node texts, and the choice of mechanism below are the AI's, deferred.

Why this order. Each section is what the next depends on, for a reader and for the work. Purpose gives the criterion everything else is judged by. Scope and the browser give what there is and how it is read; nothing can be found or reviewed before them. Alignment is the only way the record grows, so it precedes every harness that acts on the record. Harness context management is how a session sees the record, and nothing a session derives can be trusted before what it loads is settled. Reconciliation derives the implementation from all of the above. The loop's improvement of itself presupposes the loop. A dependency order, a reading order, and a priority order therefore coincide, which is what the attention node says rank is.

The boosts of 2026-09-03 realize the order: this node 9 under purpose, above model's 8, so that it is the first thing after purpose; projection 5, growth 4, the work loop 3, and rsi 1 under model; session-context 6 under projection, raised from 2, because at 2 its rank fell below the work loop's, harness context management ranking after reconciliation against the author's order of the same day. That is the drift this disposition guards against, present in the record within a day of the boosts being set by hand. The equality of this node and projection cannot be exact, since projection's rank is a share of model's and this node's a share of purpose's; it is realized as each being outranked by nothing but its own ancestors. Whether self-documentation is a node of its own under purpose, equal to this one by construction, is the self-documentation node's open question.

How high-level rank is materialized from this node, the recommendation. The order is recorded on this node as data, the field `order`, an ordered list of steps, each step one node or several that are equal, and the validator refuses a graph whose derived ranks do not realize it: every member of a step outranks every member of every later step, and the members of the first step are outranked by nothing under this node's parent but their own ancestors and descendants. The boosts remain the one mechanism of rank and the frontier and browser keep showing them; the order is recorded once; and since every landing on the graph is validated first, a boost that contradicts the order cannot land, which is what avoiding drift requires. This is the way the record already keeps its other invariants that span nodes, acyclicity and resolved parents. Considered and not recommended: deriving the boosts of the named nodes from the order, which needs a solver that must lift ancestors to lift a descendant, cannot make ranks at different depths equal, and fails in exactly the cases the validation rule reports, while hiding the boosts the projections display; a check instrument on this node, since an instrument measures the implementation against the record and turns a failure into work for the reconciliation loop, whereas an order the ranks contradict is an inconsistency of the record that must not land at all; moving the ordered nodes under this one so that the order becomes sibling order, which would make the tree carry priority, the conflation the attention node rejects; and leaving the boosts as the only record, which is the drift. This node defines the field, and the validator has held the ranks to it since 2026-09-03; the hand-set boosts declared as a shim that day were liquidated the same day.

## Proposal

### Recording of 2026-09-03

The author's ruling of 2026-09-03, quoted under Disposition, is recorded as this node's answer, stamped deferred: the order is the author's, and the boost values, the section texts, the mapping of "self documentation (via the graph browser)" to the projection node, the placement of rsi under model, and the recommended mechanism are the AI's, each owed the author's review. The stage is review: the clean-context review the recording node requires has not yet read this answer, and the author's ruling follows it. The coverage question that this node carried until 2026-09-03 moved to the coverage node under purpose, at the periagogic stage; the question whether self-documentation is a node of its own is the self-documentation node's, at the maieutic stage; what rsi covers is the rsi node's, at the maieutic stage.

Open for the author's ruling on this node: the answer as it stands, and the mechanism recommended in the rationale against the three alternatives it names. Traditions consulted for the mechanism and owed as readings under the stub-traditions ruling: the single-source principle of software engineering, and the lint tradition of checking invariants that span records.

Facts: authority deferred, the order ratified in the author's words; boldness moderate, the section rationale and the mechanism are the AI's; persistence standing.

### Clean-context review, 2026-09-03

Read in clean context by a subagent given the node, its ancestry, and the author's words, and nothing of the sitting. Verdict: forward to the author's ruling.

Findings:

- Answer, end of paragraph 4: 'the two hypotheses under purpose are within scope as hypotheses, with their criteria not yet validated.' This stores the validation state of two child nodes in a third node's answer, which transience forbids in this same batch — 'Transience is never stored; it is projected' — and which was found on purpose's draft at this sitting and accepted for removal there ('the state of the two child criteria leaves the answer'). It survives here. Suggested edit: strike 'with their criteria not yet validated'.
- Answer, opening: 'The purpose and six sections after it' followed by a numbered list of six items whose first item is Purpose. The count is right only if the reader treats scope and self-documentation, merged into item 2, as two sections. Suggested edit: number seven, or say the second entry holds two equals.
- Answer, item 2: 'self documentation (via the graph browser)' in the author's order is mapped to commons.systems/disposition-graph/projection, and the 'order' field materializes that mapping into a validator rule. The Proposal discloses the mapping as the AI's, but the self-documentation node (stage maieutic) still asks whether it is a node of its own under purpose; if it becomes one, the order field must be rewritten before it can land. Suggested edit: say in the answer that the mapping stands until self-documentation is ruled.
- Rationale, last paragraph: 'the validator refuses a graph whose derived ranks do not realize it ... the validator has held the ranks to it since 2026-09-03.' Verified true against packages/disposition/read.mjs, which enforces both the step rule and the first-step rule. This is one of the few instrument claims in the batch that holds today; it is worth saying so explicitly, since three others in this batch do not.
- Proposal: 'Traditions consulted for the mechanism and owed as readings under the stub-traditions ruling: the single-source principle of software engineering, and the lint tradition of checking invariants that span records.' A prose tradition list, which readings' recommended answer forbids, and stub-traditions (stage maieutic) has not ruled.

On the three facts: 'Authority deferred, the order ratified in the author's words; boldness moderate, the section rationale and the mechanism are the AI's; persistence standing' is well formed and among the best in the batch: it states one class and splits what is the author's from what is the AI's. Two additions are owed. It should say that the order field is already enforced, so this ruling changes what can land rather than describing an intention; and it should name the substitution of the projection node for 'self documentation (via the graph browser)' as the one place the AI changed an item in the author's own list.

Strongest counter-argument (moderate): The node fixes the shape of the record before the record knows what it contains. Its own answer says 'What it leaves out is open', and coverage (stage periagogic) names four recorded functions outside the purpose as worded, while materialization's greenfield shim makes bootstrap exit prune whatever no disposition supports. A six-section table of contents, now enforced by the validator through the order field, is a strong commitment that the record has exactly these parts. If the coverage ruling brings in the consumer apps, the public site or the author's host configuration, either a seventh section appears and every boost named here is reset, or those functions live in the record with no section — which is precisely the drift the order field was added to prevent.

### Clean-context review, 2026-09-03

Read in clean context by a subagent given the node, its ancestry, and the author's words, and nothing of the sitting. Verdict: forward to the author's ruling.

Findings:

- Answer, end of paragraph 4: 'the two hypotheses under purpose are within scope as hypotheses, with their criteria not yet validated.' Still stores two child nodes' validation state in a third node's answer, which transience forbids and which the previous review already flagged here and had accepted for removal on purpose. Suggested edit: strike 'with their criteria not yet validated'.
- Answer, opening: 'The purpose and six sections after it' followed by a six-item list whose first item is Purpose. Unchanged since the previous review. Suggested edit: 'the purpose and six sections after it' with a seven-entry list, or say the second entry holds two equals.
- Rationale carries a prose tradition reference in the Proposal ('Traditions consulted for the mechanism and owed as readings ...: the single-source principle of software engineering, and the lint tradition of checking invariants that span records'), which readings' draft forbids; and scope is one of three nodes (with dialogue and recording) that stub-traditions' enumeration of offending rationales does not name.
- Verified and holding: the order field is enforced by packages/disposition/read.mjs, and 'node packages/disposition/validate.mjs disposition' returns 'ok: 62 nodes'. This is one of the few instrument claims in the batch that is true today, and the facts should say so.

On the three facts: 'Authority deferred, the order ratified in the author's words; boldness moderate, the section rationale and the mechanism are the AI's; persistence standing' is among the best-formed in the batch and matches the frontmatter recommendation of ratified/moderate only loosely — the prose says deferred, the data says ratified. It should also name the substitution of the projection node for the author's 'self documentation (via the graph browser)' as the one item the AI changed in the author's own list, and say the order field is already enforced.

Strongest counter-argument (moderate): The node fixes the shape of the record before the record knows what it contains. Its own answer says 'What it leaves out is open', coverage names four recorded functions outside the purpose as worded, and materialization's greenfield shim makes bootstrap exit prune whatever no disposition supports. A six-section table of contents now enforced by the validator is a strong commitment that the record has exactly these parts: if the coverage ruling brings in the consumer apps, the public site or the author's host configuration, either a seventh section appears and every boost named here is reset, or those functions live in the record with no section — the drift the order field was added to prevent.

The session's reply: Validated: the order field is enforced and the graph validates, as the finding says. Amended tonight: the clause storing the two hypotheses' validation state is struck, and the opening says two of the six sections are equal and listed together. The prose tradition references go to readings when that rule is ruled, and scope is added to the stub-traditions enumeration at its sitting. The Facts line's 'deferred' named the stamp as it stands; the recommendation is ratified at moderate boldness, and the one item the AI changed in the author's list, projection standing for self-documentation through the browser, is the author's to confirm. On the counter-argument: the order field reads the author's words and nothing else; a seventh section is a new word from the author, recorded then, and the boosts follow it. Stage review: the answer changed.

### Frontier finding, 2026-09-03

Kind: vocabulary.

'Criterion' and 'criteria' are used in the answers of transience ('A criterion, when the temporary thing is really a standing obligation'), scope, work-loop ('each a reconciliation of the criteria the node carries') and purpose's draft, and in four drafts as a frontmatter key. No node's defines carries the term: the parsed graph's 88 terms include 'instrument', 'check', 'assessment' and 'evidence' from instruments, and 'criterion' only inside instruments' Draft. Verified the key is not in the schema either: FRONTMATTER_KEYS holds 'instrument' and not 'criteria'. A term four ruling-stage answers depend on is defined only inside a draft.

Also named: commons.systems/disposition-graph/instruments, commons.systems/disposition-graph/transience, commons.systems/disposition-graph/work-loop, commons.systems/disposition-graph/purpose.

Proposed: Instruments is the survivor and must be ruled before the nodes that use the word. Until it is, the answers that use 'criterion' say 'instrument', the term instruments actually defines, or the drafts that use it disclose that the term arrives with instruments. At the recording, instruments' defines gains 'criterion' and 'unguarded', the schema gains the 'criteria' key, and the four nodes carrying 'instrument:' are migrated — which instruments' own facts should name, as its reply promises.

### Frontier finding, 2026-09-03

Kind: coverage.

Four author quotations are carried verbatim on more than one node, verified by exact match. 'Who is this repository for? ... It can be pruned' on audience and coverage. 'purpose -> [scope, self documentation (via the graph browser)] (equal) -> alignment -> harness context management -> reconciliation -> rsi' on scope, self-documentation and rsi. 'Is this correctly encoded as form: assumption vs form: disposition with unvalidated instrumentation? Is assumption a form at all?' on knowledge-store, capture and purpose. 'assumption deserves a target disposition, along with tradition and disposition ...' on node and form-vocabulary. Frontier-consistency's validation 14 says every disposition the author has given is 'answered by exactly one node: none unanswered, none answered twice', and admits no case for a quote carried as context on a child.

Also named: commons.systems/disposition-graph/audience, commons.systems/disposition-graph/coverage, commons.systems/disposition-graph/knowledge-store, commons.systems/disposition-graph/capture, commons.systems/disposition-graph/purpose, commons.systems/disposition-graph/node, commons.systems/disposition-graph/form-vocabulary, commons.systems/disposition-graph/self-documentation, commons.systems/disposition-graph/rsi.

Proposed: Most of these are legitimate context on a child that answers a part of the words, and the validation should say so: amend frontier-consistency's validation 14 to read that each part of a disposition is answered by exactly one node, and that a quotation may be carried on a child as the ground of the part it answers. Two are genuine double answers and should be resolved: audience and coverage both answer the audience question, which the audience prune resolves in coverage's favour; knowledge-store, capture and purpose all carry the form question, which forms answers, so all three should cite forms rather than each carry the quote.
