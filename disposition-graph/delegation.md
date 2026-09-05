---
question: How is work divided between the main thread and subagents?
stage: review
review:
  verdict: forward
  strength: moderate
  date: 2026-09-05
  of: c6dd579b9bb9594e47c396c8cac4588deb3560b1
  against: "The node asks the author to ratify, on the strength of one quoted sentence about the cost of driving a browser, a whole apparatus that is the AI's: the unit contract, three unnamed model tiers, the main thread at full effort, and four prohibitions. The author's words that actually bear on the apparatus say the opposite of ratify-and-freeze: 'appropriate' is 'open question', the reconciliation shim should ideally run on sonnet with the model the AI's recommendation, and right-sizing models and effort is granted to the AI's judgment for token efficiency. None of those words is on the node. Meanwhile the one sentence the two live implementations both cite, that the main thread runs on the most capable model, is read as fable by the alignment skill and as opus by the reconcile skill, so the rule as written does not decide the case it is already deciding. And the earlier reviews' point still holds: the contract, the report and the main thread's read are a fixed cost per unit, the lookup exemption is the only floor, and 'anything larger is a unit' catches every three-line investigation. A cleaner recommendation would ratify the author's rule (verbose investigation is always a unit, the subagent's four bounds, the reconciliation bound by citation) and recommend delegated for the sizing of units, models and effort, which the author's words already hand to the AI."
facts:
  - name: answer
    options:
      - name: never-writes-the-graph
        source: ai
        ref: "2026-09-03"
      - name: reconciliation-session-writes-options
        source: author
        ref: "2026-09-04"
      - name: fixed-model-for-every-task
        source: ai
        ref: "6e9efb8c"
        status: passed
        reason: "the cost is set by the most capable model at full effort and most units do not need it"
      - name: main-thread-investigates-small-questions
        source: ai
        ref: "6e9efb8c"
        status: passed
        reason: "the size of a debugging context is unknown until it has been read"
    recommends: reconciliation-session-writes-options
    boldness: moderate
    against: "The answer generalises past the author's words: they named verbose investigation and gave its cost, and the answer makes everything but the interview and the record a contracted unit. The contract, the report, and the main thread's read of the conclusion are a fixed cost per unit, the lookup exemption is the only floor, and anything larger is a unit catches every three-line investigation."
    stands: reconciliation-session-writes-options
  - name: authority
    options:
      - name: ratified
      - name: delegated
      - name: deferred
    recommends: ratified
    boldness: moderate
    against: "The author's words hand the sizing of units, models, and effort to the AI's judgment: appropriate is an open question, the shim's model is the skill's to recommend, and right-sized models and effort are granted where they yield token efficiency. Delegated is the live rival for that sizing, and a ruling dividing the bounds from the sizing is a question under this node."
form: rule
tier: global
under:
  - commons.systems/disposition-graph/growth
defines:
  - main thread
  - unit
  - subagent
depends:
  - commons.systems/disposition-graph/viable-options
  - commons.systems/disposition-graph/work-loop
---
## Disposition

The author, 2026-09-03:
> new disposition (should affect both alignment and bootstrap/reconciliation shims): debugging activities like those are prime candidates for subagents - driving a browser with max effort fable is very expensive. Debugging context can be verbose and pollute the main thread.

The author, 2026-09-03, on the work-loop node, on the summary's item that the author owns the graph and subagents work from it:
> "You own the graph" - correct that implementation is delegated, each bite type gets a skill with "appropriate " recursive subagents ("appropriate" is open question) but reconsiliation does not edit the graph. That is alignment only.

The author, 2026-09-03, on the work-loop node, on bootstrap operations:
> I will check out the greenfield ref at repo root and launch a new session to act as the reconciliation shim. Ideally, the reconciliation shim instructions are well defined enough to run with sonnet, but recommend the model this shim must run as. Does any work need to be done to prepare for this - for example to prepare the shim to be run as sonnet. Encode the shim as a skill with the recommended model so that I can initialize a session to act as the reconciliation shim by invoking that skill.

The author, 2026-09-04, on the viable-options node, amending their ruling of 2026-09-03 on the work-loop node:
> Under this model the prior statement that "reconciliation never edits the graph" is incomplete. Whatever persistent state reconciliation requires for reconciliation operations (if any) is stored outside the graph - true. But, AI has the authority record untracked but viable alternative options and to change its recommendation during either reconciliation or rsi. If the recommendation is on ratified node then that triggers the alignment frontier projection described above. Subject to attenuation/breakout controls - if the change of recommendation is on delegated or deffered node then it changes the shape of the reconciliation frontier.

The author, 2026-09-04, on the viable-options node, giving the grant announced there:
> bootstrap authority granted - delegate to subagents with righ-sized models and effort level (opus, sonnet) when it would result in token efficiency

## Answer

Every session has a main thread, the thread that holds the session's work, launches its units, and reads what they return; a subagent is a session the main thread launches for one unit or one lookup, given its brief and nothing else. The alignment session's main thread holds the interview and the record: it interviews the author, writes and amends nodes, reviews what subagents return, and lands, and it runs on the most capable model at full effort. A reconciliation session's main thread runs on the model the reconciliation skill recommends for it, which the author asked that skill to name, the smaller model where the skill's instructions are defined well enough to run there. Everything else is delegated: a lookup needs only its question and its answer, and anything larger is a unit. A unit is one deliverable with a written contract, inputs, outputs, the files it may write, and its error behaviour, with a test or a verifiable output; a unit that needs a second contract is two units. Every investigation whose context is verbose is a unit whatever its size: debugging, driving a browser, reading logs, transcripts, or diagnostic output, and surveys. The subagent reports a conclusion and the exact commands it ran; the main thread reads the conclusion and never the context. The model follows the kind of work: the smaller model for mechanical tooling, tests, format work, and anything whose contract determines the answer; the larger model for design and judgment, such as a layout or a survey that classifies what it reads; the smallest for lookups. The effort is stated in the brief. A subagent never runs state-changing version control, never edits a node or the record's scaffolding, writes only the files its brief names, and works only in the worktree it was given. A reconciliation session is bound toward the record as the work-loop node bounds it, and that node owns the bound; a subagent never edits a node.

## Rationale

The author's words of 2026-09-03 on this node, quoted above, name verbose investigation as the case for delegation and give its cost as the reason; that is the clause that is theirs. Their words of 2026-09-03 on the work-loop node, quoted above, say implementation is delegated with "appropriate" recursive subagents and leave "appropriate" open, and ask the reconciliation skill to recommend the model it runs on, ideally the smaller one; their grant of 2026-09-04 on the viable-options node asks for right-sized models and effort levels where they yield token efficiency. The unit contract, the model by kind of work, the effort in the brief, the main thread's model per session, and the subagent's four bounds are the AI's answer to the question those words leave open, grounded in them and in nothing earlier: a ruling of 2026-09-02 that this rationale once cited is quoted nowhere in the record and is cited no longer. The rule binds the alignment session and the reconciliation sessions alike, each through its own main thread; during bootstrap it is projected into the rule file, the alignment skill, and the reconciliation skill. The two implementations that read the model rule had split, the review skills reading the main thread's model as fable and the reconciliation skill running on opus while citing this node; the answer now gives each session's main thread its model, and both stand under it.

Amended 2026-09-04 under the author's bootstrap grant of that day, recorded on the viable-options node, from the author's words there amending their ruling of 2026-09-03, quoted on the work-loop node: "the prior statement that 'reconciliation never edits the graph' is incomplete." The bound on the reconciliation session narrows to the write the work-loop node allows and keeps the subagent's bound whole. The answer as it stood is kept as the option `never-writes-the-graph`. The bound itself is the work-loop node's, and this node cites it rather than restating it, so the rule has one home.

## Facts

### answer

`reconciliation-session-writes-options` is recommended because the author's amendment of 2026-09-04, quoted above, grants exactly this move: a reconciliation session's main thread records viable options and moves recommendations within scope, and the graph-writing bound of 2026-09-03 is by their words incomplete. Boldness moderate: the verbose-investigation clause and the amendment are the author's, while the unit contract, the model by kind of work, the main thread's model per session, and the subagent's four bounds are the AI's. The case against is that the answer generalises past the author's words: the contract, the report, and the main thread's read of the conclusion are a fixed cost per unit, the lookup exemption is the only floor, and anything larger is a unit still catches every three-line investigation.

#### never-writes-the-graph

The answer as it stood from 2026-09-03: the main thread, the unit, the model by kind of work, the subagent's bounds, and a reconciliation session that never writes the graph, which is alignment's alone. Viable if the author prefers the graph written by alignment alone.

#### reconciliation-session-writes-options

The sentence binding a reconciliation session never to write the graph is amended as work-loop's is: the session's main thread may record a viable option on a fact and move its recommendation, within scope, and never rules, edits a ruling, or edits the author's words. A subagent still never edits a node. Raised on commons.systems/disposition-graph/viable-options, from the author's words of 2026-09-04 recorded there.

#### fixed-model-for-every-task

Every unit runs on one fixed model. It was passed over because the cost is
then set by the most capable model at full effort, and most units do not need
it.

#### main-thread-investigates-small-questions

The main thread investigates itself when a question looks small. It was passed
over because the size of a debugging context is unknown until it has been
read.

### authority

Ratified is recommended because the subagent's bounds and the reconciliation session's bound toward the record are capture-shaped: a subagent that edits a node or runs state-changing version control changes the record outside the dialogue, and the record's rule escalates toward ratified where being wrong is irreversible or capture-shaped. Boldness moderate: the author's words cut the other way on half the answer. "Appropriate" is an open question, the shim's model is the skill's to recommend, and right-sized models and effort are granted where they yield token efficiency, so the sizing of units, models, and effort is already handed to the AI's judgment, and delegated is the live rival. The case against ratification is that a ruling of delegated would say the sizing is the AI's and the author does not want to be asked again about it; a ruling that divides the bounds, ratified, from the sizing, delegated, is a question under this node, and the author may ask for it.

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

### Clean-context review, 2026-09-05

Read in clean context by a subagent given this draft, its ancestry, its siblings, the nodes it names, and the index of every question the record asks, and nothing of the sitting. Verdict: forward to the author's ruling.

Findings:

- Rationale, sentence 1: 'The author's rulings of 2026-09-02, that implementation is delegated by unit, model, and effort' is cited and never quoted, on this node or anywhere in the graph (grep of disposition-graph/ for 2026-09-02 finds no words of the author on units, models or effort; legacy.md records the same paraphrase problem for its own ruling). Three reviews raised this; the session's reply of 2026-09-03 said 'quoted at the sitting', and no sitting has happened. Authority: a ruling whose words are not in the record is invalid, and the ruling the author gives is on the pin of this text, so the ground must be in the pinned text before the sitting, not at it. Suggested edit: quote the 2026-09-02 words under '## Disposition' with their date, or strike the citation and let the unit, model and effort rule stand as the AI's, which is what boldness moderate already admits.
- Disposition: the author's words that this node's model rule actually answers are not on the node. On work-loop, 2026-09-03: 'each bite type gets a skill with "appropriate " recursive subagents ("appropriate" is open question)', and 'Ideally, the reconciliation shim instructions are well defined enough to run with sonnet, but recommend the model this shim must run as'; on viable-options, 2026-09-04: 'delegate to subagents with righ-sized models and effort level (opus, sonnet) when it would result in token efficiency'. The reconcile skill cites the first as the ground of its model choice and work-loop's account says delegation's draft answers that open question. The node quotes only the debugging sentence and cites the viable-options grant only for the graph-writing amendment. Suggested edit: quote all three under '## Disposition' with dates and let the rationale say which parts of the answer each grounds.
- Answer, sentences 1-2 and last: 'main thread' is defined as 'the session that holds the interview and the record' and 'runs on the most capable model at full effort', then the last sentence gives a reconciliation session 'its main thread', which holds neither the interview nor the record. Whether the model rule binds it is undecidable from the text, and the implementation has already split: review-model reads the rule as fable, 'the one the delegation node gives the main thread', while .claude/skills/reconcile/SKILL.md line 59 runs the reconciliation session on opus, citing this node and the author's work-loop words. Suggested edit: say which session the full-effort rule binds (the alignment session, with the reconciliation session's model the AI's recommendation, as the author's words on work-loop ask), or define 'main thread' per session and give each its model.
- Answer, last sentence: restates work-loop's bound in full ('recording a viable option on a fact or moving a fact's recommendation within the node's scope, and never rules, edits a ruling, or edits the author's words') while saying the rule is 'as the work-loop node says'. Work-loop's review of 2026-09-05 made that node the bound's owner with delegation citing it; a rule stated in two homes goes stale in one when it moves. Suggested edit: keep the citation and this node's own clause ('a subagent never edits a node') and drop the restatement.
- Facts: '### answer' opens directly on '#### never-writes-the-graph' with no reason for recommending `reconciliation-session-writes-options`, and there is no '### authority' subsection at all, while dialogue's answer says a recommending fact carries its subsection saying why from the review stage on; neither fact carries an `against`, which dialogue says is owed on every fact that recommends. Suggested edit: open '### answer' with the reason (the author's amendment of 2026-09-04 grants exactly this move) and its case against (the counter-argument below); add '### authority' with the reason for ratified and its case against.
- Facts, authority: recommends ratified at low boldness with no reason, while the author's own words cut the other way as much as this: the bootstrap grant on viable-options delegates right-sizing of models and effort to the AI's judgment, and the work-loop words leave 'appropriate' open. review-model's authority fact records this very argument as its case against ratification. `delegated` is a live option here, not a placeholder, and the choice between them is the author's; the node should say why it recommends ratified and boldness on that fact should read moderate, since it rests on the AI's reading of ambivalent words.
- Frontmatter: `tier: global` with `under: growth`, unchanged since three reviews raised it; tier stands at the maieutic stage after a kickback, so the placement is still open and this finding only carries it forward. `defines` lists `subagent` and the answer never says what one is; `main thread` and `unit` are glossed in the text. Account line 'Facts: authority deferred ... boldness low' is history and may stay, but the projected rule and the alignment page now show moderate, so a reader comparing them should be told the change is the sitting's.

On the facts and what they recommend: Validations 1-6 and 15 run. (1) The answer is one question's answer with one restated rule from work-loop (finding 4); no second question. (2) Options are all listed with source and ref; the two passed options carry reasons in data and in prose. (3) Boldness moderate on the answer fact is right and is the value three reviews asked for; the class recommended, ratified, is a listed option; pin: no Recommendation fence, the standing answer is the recommendation and the prior review's `of` bf56eead is stale against the 2026-09-04 amendment, so this review's pin replaces it; persistence follows the node's shape; the file .claude/rules/delegation.md exists (2024 bytes, projected 2026-09-04) and matches the answer word for word; the date and quotation of 2026-09-03 are exact against the Disposition; the 2026-09-02 ruling has no quotation anywhere in the record (finding 1); the 2026-09-04 quotation fragment in the rationale is exact against work-loop's Disposition. (4) No readings owed by this node; the model rule is the general case of review-model's, which cites it correctly; prose and structure agree except the missing reasons and against fields (finding 5). (5) Cross-node: recording cites this node for 'the classification of the author's words stays on the main thread', which the answer supports only by 'writes and amends nodes' plus 'a subagent never edits a node'; clean-context-review grounds 'never delegated' in the author's ruling of 2026-09-03, not here, so no contradiction. Decomposition's passed option cites this node's rejection of main-thread investigation correctly. (6) Terms: `main thread` is defined and then applied outside its definition (finding 3). (15) The reconcile skill's opus main thread and review-model's fable reading of the same sentence are two implementations of one rule; the text does not settle which is right, and that is the one validation this draft fails outright.

On the viability of the options: Answer fact. `reconciliation-session-writes-options` (author, 2026-09-04): recommended and grounded in the author's amendment quoted on work-loop; viable. `never-writes-the-graph` (ai, 2026-09-03): kept viable 'if the author prefers the graph written by alignment alone'; the author's words of 2026-09-04 already say the prior statement 'is incomplete', so this is the option those words passed over, kept open only because the author may reverse; it is viable in that sense and dominated in every other, and work-loop keeps it the same way, so no change is asked. `fixed-model-for-every-task` (passed): the reason stands and is not undercut by review-model fixing fable for one kind of work, since the answer's 'model follows the kind of work' permits a fixed model per kind. `main-thread-investigates-small-questions` (passed): the reason stands; the lookup exemption is its bounded version and the answer says so. No option is missing that the record already argues for. Authority fact. `ratified`, `delegated`, `deferred` all viable; `delegated` is the strongest rival and is argued nowhere on this node (finding 6); `deferred` is viable since the recommendation would act during bootstrap either way.

Strongest counter-argument (moderate): The node asks the author to ratify, on the strength of one quoted sentence about the cost of driving a browser, a whole apparatus that is the AI's: the unit contract, three unnamed model tiers, the main thread at full effort, and four prohibitions. The author's words that actually bear on the apparatus say the opposite of ratify-and-freeze: 'appropriate' is 'open question', the reconciliation shim should ideally run on sonnet with the model the AI's recommendation, and right-sizing models and effort is granted to the AI's judgment for token efficiency. None of those words is on the node. Meanwhile the one sentence the two live implementations both cite, that the main thread runs on the most capable model, is read as fable by the alignment skill and as opus by the reconcile skill, so the rule as written does not decide the case it is already deciding. And the earlier reviews' point still holds: the contract, the report and the main thread's read are a fixed cost per unit, the lookup exemption is the only floor, and 'anything larger is a unit' catches every three-line investigation. A cleaner recommendation would ratify the author's rule (verbose investigation is always a unit, the subagent's four bounds, the reconciliation bound by citation) and recommend delegated for the sizing of units, models and effort, which the author's words already hand to the AI.

The session's reply: Validated, all seven. The ruling of 2026-09-02 is quoted nowhere in the record and is struck from the rationale; the unit contract, the model by kind of work, the effort, and the subagent's bounds stand as the AI's answer to the question the author's words leave open, which boldness moderate already says. The author's words of 2026-09-03 on the work-loop node, on delegated implementation with "appropriate" subagents and on the reconciliation shim's model, and their grant of 2026-09-04 on the viable-options node, are copied verbatim under Disposition with their dates, and the rationale says what each grounds. Main thread is defined per session: the alignment session's holds the interview and the record and runs on the most capable model at full effort; a reconciliation session's runs on the model the reconciliation skill recommends, as the author asked, which closes the split between the review skills' reading and the reconcile skill's. Work-loop's bound is cited and no longer restated. Each fact opens with its reason and carries its case against; the authority fact reads moderate, since the author's words hand the sizing of units, models, and effort to the AI's judgment and delegated is the live rival, argued under the fact. A subagent is defined in the answer. Tier's placement stays open and is carried; the account line reading boldness low is history and the amendment names the change. Depends adds work-loop, whose bound this node cites. Stage review for the re-read.

### Amended after the reading, 2026-09-05

After the clean-context reading of 2026-09-05, whose findings the session validated. The ruling of 2026-09-02 that the rationale cited is quoted nowhere in the record and the citation is struck: the unit contract, the model by kind of work, the effort, and the subagent's bounds stand as the AI's answer to what the author's words leave open. The author's words of 2026-09-03 on the work-loop node, on delegated implementation with "appropriate" subagents and on the reconciliation shim's model, and their words of 2026-09-04 on the viable-options node, the amendment and the grant, are copied verbatim under Disposition with their dates, and the rationale says what each grounds. Main thread is defined per session, and a subagent is defined: the alignment session's main thread runs on the most capable model at full effort, a reconciliation session's on the model the reconciliation skill recommends, which closes the split the reader found between the review skills, reading fable, and the reconciliation skill, running opus. Work-loop's bound is cited and no longer restated. Each fact opens with its reason and carries its case against. The authority fact's boldness reads moderate, where the sitting of 2026-09-03 recorded low; the record above is history and this is the change. Tier's placement question stays open and is carried. Depends adds the work-loop node, whose bound this node cites. Stage review for the re-read.
