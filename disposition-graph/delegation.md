---
question: How is work divided between the main thread and subagents?
stage: ruling
form: rule
authority:
  class: deferred
  by: claude
  date: 2026-09-03
tier: global
under:
  - commons.systems/disposition-graph/growth
defines:
  - main thread
  - unit
  - subagent
---
## Disposition

The author, 2026-09-03:
> new disposition (should affect both alignment and bootstrap/reconciliation shims): debugging activities like those are prime candidates for subagents - driving a browser with max effort fable is very expensive. Debugging context can be verbose and pollute the main thread.

## Answer

The main thread is the session that holds the interview and the record: it interviews the author, writes and amends nodes, reviews what subagents return, and lands. It runs on the most capable model at full effort, so everything else is a unit delegated to a subagent. A unit is one deliverable with a written contract, inputs, outputs, the files it may write, and its error behaviour, with a test or a verifiable output; a unit that needs a second contract is two units. Every investigation whose context is verbose is a unit whatever its size: debugging, driving a browser, reading logs, transcripts, or diagnostic output, and surveys. The subagent reports a conclusion and the exact commands it ran; the main thread reads the conclusion and never the context. The model follows the kind of work: the smaller model for mechanical tooling, tests, format work, and anything whose contract determines the answer; the larger model for design and judgment, such as a layout or a survey that classifies what it reads; the smallest for lookups. The effort is stated in the brief. A subagent never runs state-changing version control, never edits a node or the record's scaffolding, writes only the files its brief names, and works only in the worktree it was given.

## Rationale

The author's rulings of 2026-09-02, that implementation is delegated by unit, model, and effort, and of 2026-09-03: "new disposition (should affect both alignment and bootstrap/reconciliation shims): debugging activities like those are prime candidates for subagents - driving a browser with max effort fable is very expensive. Debugging context can be verbose and pollute the main thread." The rule binds the alignment session and the reconciliation sessions alike; during bootstrap it is projected into the operations document and the alignment skill. Rejected: a fixed model for every task, because the cost is set by the most capable model at full effort and most units do not need it; letting the main thread investigate when a question seems small, because the size of a debugging context is unknown until it has been read.


## Proposal

### Sitting on purpose, 2026-09-03

**The delegation node, as recorded today**

A new node carrying the token-efficiency rule with the author's clause on verbose investigation. Here for the ruling on the whole.

Facts: authority deferred; ratified if the author rules so; boldness low; persistence standing.

Rejected:
- A fixed model for every task. — The cost is set by the most capable model at full effort and most units do not need it.
- Let the main thread investigate when a question seems small. — The size of a debugging context is unknown until it has been read.

Proposed: the node as it stands.

Rulings open: ratify as shown; ratify with edits; defer; overrule.

### Clean-context review, 2026-09-03

Read in clean context by a subagent given the node, its ancestry, and the author's words, and nothing of the sitting. Verdict: forward to the author's ruling.

Findings:

- Answer, sentence 2: 'It runs on the most capable model at full effort, so everything else is a unit delegated to a subagent.' Read literally with the next sentence, a one-line lookup requires a written contract with inputs, outputs, the files it may write and its error behaviour. Suggested edit: 'everything else is delegated; a lookup needs only its question and its answer, not a contract.'
- Rationale, sentence 1, cites 'The author's rulings of 2026-09-02, that implementation is delegated by unit, model, and effort' but quotes nothing of that date; only the 2026-09-03 ruling is quoted. If the author ratifies, the stamp rests partly on an unquoted ruling, which authority calls invalid.
- Frontmatter 'tier: global' with 'under: growth', while the answer says the rule 'binds the alignment session and the reconciliation sessions alike'. Reconciliation sits under work-loop, not growth. If tier is pruned as recommended in this batch and scope comes from citations, nothing cites this node and it would bind nothing. Suggested edit: settle the placement with the tier ruling.
- Answer, last sentence: 'A subagent ... never edits a node or the record's scaffolding.' Work-loop says a reconciliation session writes the graph to record an un-aligned disposition or to remove a met shim declaration. Whether such a session is a subagent is not said, so an executor cannot tell which rule wins. Suggested edit: say that the prohibition is on subagents of a session, not on reconciliation sessions.

On the three facts: 'Authority deferred; ratified if the author rules so; boldness low; persistence standing' is right for the verbose-investigation clause, which is the author's own. Boldness is not low for the unit contract, the model tiers and the subagent prohibitions, which are the AI's; those should be presented as moderate.

Strongest counter-argument (weak): The answer generalises well past the author's words. The author named debugging and browser-driving as prime candidates and gave a cost reason; the answer turns that into a rule that everything but the interview and the record is a contracted unit. The contract, the report and the main thread's read of the conclusion are themselves a fixed cost per unit, so for small investigations the rule can cost more than it saves, and the node's own rejected alternative ('the size of a debugging context is unknown until it has been read') argues only that some small-looking questions are large, not that all are. Worth one line, with the fix being a floor on what counts as a unit.
