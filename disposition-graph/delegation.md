---
question: How is work divided between the main thread and subagents?
stage: ruling
recommendation:
  adopts: standing
  boldness: low
  amends: "f502a72fb724801305671c884e3c090573471853"
  at: "6d21d356d65f5fa206cb60bc3e923c462acc920e"
review:
  verdict: forward
  strength: weak
  date: 2026-09-03
  of: f502a72fb724801305671c884e3c090573471853
facts:
  - name: authority
    choices:
      - ratified
      - delegated
    adopts: ratified
    boldness: low
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

The main thread is the session that holds the interview and the record: it interviews the author, writes and amends nodes, reviews what subagents return, and lands. It runs on the most capable model at full effort, so everything else is delegated: a lookup needs only its question and its answer, and anything larger is a unit. A unit is one deliverable with a written contract, inputs, outputs, the files it may write, and its error behaviour, with a test or a verifiable output; a unit that needs a second contract is two units. Every investigation whose context is verbose is a unit whatever its size: debugging, driving a browser, reading logs, transcripts, or diagnostic output, and surveys. The subagent reports a conclusion and the exact commands it ran; the main thread reads the conclusion and never the context. The model follows the kind of work: the smaller model for mechanical tooling, tests, format work, and anything whose contract determines the answer; the larger model for design and judgment, such as a layout or a survey that classifies what it reads; the smallest for lookups. The effort is stated in the brief. A subagent never runs state-changing version control, never edits a node or the record's scaffolding, writes only the files its brief names, and works only in the worktree it was given. A reconciliation session is bound the same way toward the record: it never writes the graph, which is alignment's alone, as the author ruled on 2026-09-03 on the work-loop node.

## Rationale

The author's rulings of 2026-09-02, that implementation is delegated by unit, model, and effort, and of 2026-09-03: "new disposition (should affect both alignment and bootstrap/reconciliation shims): debugging activities like those are prime candidates for subagents - driving a browser with max effort fable is very expensive. Debugging context can be verbose and pollute the main thread." The rule binds the alignment session and the reconciliation sessions alike; during bootstrap it is projected into the operations document and the alignment skill. Rejected: a fixed model for every task, because the cost is set by the most capable model at full effort and most units do not need it; letting the main thread investigate when a question seems small, because the size of a debugging context is unknown until it has been read.

## Account

### Sitting on purpose, 2026-09-03

**The delegation node, as recorded today**

A new node carrying the token-efficiency rule with the author's clause on verbose investigation. Here for the ruling on the whole.

Facts: authority deferred; ratified if the author rules so; boldness low; persistence standing.

Rejected:
- A fixed model for every task. — The cost is set by the most capable model at full effort and most units do not need it.
- Let the main thread investigate when a question seems small. — The size of a debugging context is unknown until it has been read.

Proposed: the node as it stands.

Responses open: confirm as shown; confirm with edits; deny with feedback.

### Clean-context review, 2026-09-03

Read in clean context by a subagent given the node, its ancestry, and the author's words, and nothing of the sitting. Verdict: forward to the author's ruling.

Findings:

- Answer, sentence 2: 'It runs on the most capable model at full effort, so everything else is a unit delegated to a subagent.' Read literally with the next sentence, a one-line lookup requires a written contract with inputs, outputs, the files it may write and its error behaviour. Suggested edit: 'everything else is delegated; a lookup needs only its question and its answer, not a contract.'
- Rationale, sentence 1, cites 'The author's rulings of 2026-09-02, that implementation is delegated by unit, model, and effort' but quotes nothing of that date; only the 2026-09-03 ruling is quoted. If the author ratifies, the stamp rests partly on an unquoted ruling, which authority calls invalid.
- Frontmatter 'tier: global' with 'under: growth', while the answer says the rule 'binds the alignment session and the reconciliation sessions alike'. Reconciliation sits under work-loop, not growth. If tier is pruned as recommended in this batch and scope comes from citations, nothing cites this node and it would bind nothing. Suggested edit: settle the placement with the tier ruling.
- Answer, last sentence: 'A subagent ... never edits a node or the record's scaffolding.' Work-loop says a reconciliation session writes the graph to record an un-aligned disposition or to remove a met shim declaration. Whether such a session is a subagent is not said, so an executor cannot tell which rule wins. Suggested edit: say that the prohibition is on subagents of a session, not on reconciliation sessions.

On the three facts: 'Authority deferred; ratified if the author rules so; boldness low; persistence standing' is right for the verbose-investigation clause, which is the author's own. Boldness is not low for the unit contract, the model tiers and the subagent prohibitions, which are the AI's; those should be presented as moderate.

Strongest counter-argument (weak): The answer generalises well past the author's words. The author named debugging and browser-driving as prime candidates and gave a cost reason; the answer turns that into a rule that everything but the interview and the record is a contracted unit. The contract, the report and the main thread's read of the conclusion are themselves a fixed cost per unit, so for small investigations the rule can cost more than it saves, and the node's own rejected alternative ('the size of a debugging context is unknown until it has been read') argues only that some small-looking questions are large, not that all are. Worth one line, with the fix being a floor on what counts as a unit.

### Clean-context review, 2026-09-03

Read in clean context by a subagent given the node, its ancestry, and the author's words, and nothing of the sitting. Verdict: forward to the author's ruling.

Findings:

- Answer, last sentence: 'A subagent ... never edits a node or the record's scaffolding.' Work-loop's answer says a reconciliation session writes the graph in two cases, and the author's newest words on work-loop say 'reconsiliation does not edit the graph. That is alignment only.' The author's words settle it in this node's favour, and neither node records that. Suggested edit: say that the prohibition covers reconciliation sessions too, citing the author's ruling on work-loop.
- Answer, sentence 2: 'It runs on the most capable model at full effort, so everything else is a unit delegated to a subagent.' Read with the next sentence, a one-line lookup requires a written contract with inputs, outputs, files and error behaviour. Suggested edit: 'everything else is delegated; a lookup needs only its question and its answer, not a contract.'
- Rationale cites 'The author's rulings of 2026-09-02, that implementation is delegated by unit, model, and effort' but quotes nothing of that date; only the 2026-09-03 ruling is quoted.
- Frontmatter 'tier: global' with 'under: growth', while the answer says the rule binds reconciliation sessions, which sit under work-loop. Tier is at the maieutic stage after a kickback, so the placement question it would settle is open.

On the three facts: The frontmatter recommendation (ratified, low) states one class and one value, and low is right for the verbose-investigation clause, which is the author's own. Boldness is not low for the unit contract, the model tiers and the subagent prohibitions, which are the AI's; the facts should present those as moderate, as the previous review asked and this one repeats.

Strongest counter-argument (weak): The answer generalises well past the author's words. The author named debugging and browser-driving as prime candidates and gave a cost reason; the answer turns that into a rule that everything but the interview and the record is a contracted unit. The contract, the report and the main thread's read of the conclusion are a fixed cost per unit, so for small investigations the rule can cost more than it saves, and the node's own rejected alternative argues only that some small-looking questions are large, not that all are. A floor on what counts as a unit would fix it.

The session's reply: Validated. Amended tonight: a lookup needs only its question and its answer, anything larger is a unit; and a reconciliation session never writes the graph, citing the author's ruling on work-loop, which settles the conflict the earlier review named. The 2026-09-02 rulings are quoted at the sitting. Tier's placement question is open. On the counter-argument: the lookup exemption is the floor a unit needs. Stage review.

### Frontier finding, 2026-09-03

Kind: contradiction.

The author, 2026-09-03, quoted under '## Disposition' on work-loop: 'reconsiliation does not edit the graph. That is alignment only.' Work-loop's Answer still says a reconciliation session 'writes the graph only to record an un-aligned disposition when a divergence needs the author, or to remove a shim declaration whose condition it has met, each in a commit of that file alone.' Delegation's Answer says 'A subagent never edits a node or the record's scaffolding', and its own review recorded that an executor cannot tell which rule wins because neither node says whether a reconciliation session is a subagent. The author's newest words settle it in delegation's favour and neither node records that.

Also named: commons.systems/disposition-graph/work-loop.

Proposed: Work-loop's Answer strikes the graph-writing clause and says instead that a divergence a reconciliation session finds is reported and stays on the derived frontier until the alignment dialogue records it, and that a shim whose condition reconciliation has met keeps its declaration until alignment removes it — which is what work-loop's own closing Proposal paragraph already argues. Delegation's Answer adds one clause saying the prohibition covers reconciliation sessions, citing the author's ruling on work-loop. Work-loop is the survivor of the rule; delegation carries the citation.

### Re-encoding, 2026-09-03

Re-encoded on 2026-09-03 under the author's bootstrap grant on the dialogue node, against graph commit 6d21d356: the account section, formerly named the proposal, and the recommended text, formerly the draft, were renamed, and the dialogue state was written as data.
The recommendation adopts `standing` and is pinned to the standing text as it was at that commit.
Merge analysis of the author's words: 2026-09-03, own-question: Debugging activities are prime candidates for subagents, since driving a browser at max effort is expensive and debugging context is verbose and pollutes the main thread; this should affect both the alignment and the bootstrap or reconciliation shims.
The census unit's note: Nothing is pending. Both reviews forwarded with a weak counter-argument, that the rule generalises past the author's words and needs a floor on what counts as a unit, and the session met it with the lookup exemption now in the standing text. The contradiction finding proposing that work-loop strike its graph-writing clause and that delegation cite the author's ruling is verified applied on both sides: work-loop's answer now says a reconciliation session never writes the graph, and delegation's last sentence carries the citation. The reviews' remaining asks are that boldness read moderate for the unit contract and that tier's placement be settled; the first changes a recommendation fact, the second is a question with no candidate answer.

### Clean-context review, 2026-09-03

Read in clean context by a subagent given the batch at the review stage and the full graph as its context, and nothing of the sitting. Verdict: forward to the author's ruling.

Findings:

- Verified applied since the last review: the answer carries the lookup exemption ('a lookup needs only its question and its answer, and anything larger is a unit') and the closing citation ('it never writes the graph, which is alignment's alone, as the author ruled on 2026-09-03 on the work-loop node'). Work-loop's answer carries the matching clause, so the contradiction is closed on both sides and this node's `alternatives` list is correctly empty.
- Rationale cites 'The author's rulings of 2026-09-02, that implementation is delegated by unit, model, and effort' and quotes nothing of that date; only the 2026-09-03 ruling is quoted. Half the ground of a node recommending ratification is paraphrase.
- Frontmatter `tier: global` with `under: growth`, while the answer says the rule binds reconciliation sessions, which sit under work-loop. Verified the node is one of the five global-tier nodes and is projected into .claude/rules/, so it does bind everywhere today. Tier stands at the maieutic stage after a kickback with its recommendation withdrawn, and one of its pending alternatives would prune the flag, under which nothing would carry this rule to a reconciliation session.
- The node has no pending alternatives, so nothing on it carries the two reviews' repeated ask that boldness read moderate for the unit contract, the model tiers and the subagent prohibitions, which are the AI's rather than the author's.

On the three facts: The frontmatter recommendation (adopts standing, ratified, low) states one class and one value and the pin is current. Low is right for the verbose-investigation clause, which is the author's own and is quoted with its date, but it is wrong for the unit contract, the three model tiers and the four subagent prohibitions, which are the AI's; moderate is the honest value and two reviews have now asked for it. Persistence standing follows from the node's shape.

Strongest counter-argument (weak): The answer generalises well past the author's words: the author named debugging and browser-driving as prime candidates and gave a cost reason, and the answer turns that into a rule that everything but the interview and the record is a contracted unit with inputs, outputs, files and error behaviour. The contract, the report and the main thread's read of the conclusion are a fixed cost per unit, so the lookup exemption is the right floor and it is the only one — 'anything larger is a unit' still catches every three-line investigation. The node's own rejected alternative argues only that some small-looking questions are large, not that all are.

The session's reply: Forward accepted. The paraphrased 2026-09-02 rulings and the boldness of the unit contract are accepted as findings for the author.
