---
question: How is work divided between the main thread and subagents?
stage: maieutic
review:
  verdict: forward
  strength: moderate
  date: 2026-09-05
  of: 023105757713119b012579ed2d09ca667e831101
  commit: dfded1295e4312c3cdfb1ee03b07e1aad87311eb
  against: "The draft asks the author to ratify a global-tier rule two of whose operative sentences are not in the record. The model a reconciliation session's main thread runs on is delegated to a shim skill's text, and that skill grounds its own choice by citing this node, so ratification would pin a pointer whose target is scheduled for liquidation by a clause that itself reads 'every rule this project runs under is a node or a declared shim'. Beside that, the one ruling on the authority fact covers both the capture-shaped bounds, where ratified is plainly right, and the sizing of units, models and effort, which the author's own quoted words hand to the AI twice ('\"appropriate\" is open question'; right-sized models and effort 'when it would result in token efficiency'), so the author cannot delegate the sizing without denying the bounds. And the oldest objection still stands unmet: the contract, the report and the main thread's read of the conclusion are a fixed cost per unit, the lookup exemption is the only floor, and 'anything larger is a unit' still catches every three-line investigation. What answers all of this is that each defect is an amendment away — state the model here, split the class question into a node beneath, and the rule is the one the author's words already describe."
  survey:
    date: 2026-09-05
    of: 268d70f221d1724cc6c6ac292bc9d2dc14fa0c60
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
      - name: reconciliation-passes-an-option-over
        status: passed
        reason: "absorbed when the amendment of 2026-09-05 gave the bound its one home on work-loop: the answer no longer enumerates the acts, so there is nothing here for a third act to lengthen"
        source: commons.systems/disposition-graph/viable-options
        ref: "2026-09-05"
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
    against: "The author's words hand the sizing of units, models, and effort to the AI's judgment: appropriate is an open question, the shim's model is the skill's to recommend, and right-sized models and effort are granted where they yield token efficiency. Delegated is the live rival for that sizing, and which parts must be ratified and which sizing is the AI's is the question of the node beneath this one, delegation-bounds-and-sizing, minted on 2026-09-05; a ruling here is on what remains after that one."
form: rule
tier: global
under:
  - commons.systems/disposition-graph/growth
defines:
  - term: main thread
    gloss: "The thread that holds the session's work, launches its units, and reads what they return."
  - term: unit
    gloss: "One deliverable with a written contract, inputs, outputs, the files it may write, and its error behaviour, with a test or a verifiable output."
  - term: subagent
    gloss: "A session the main thread launches for one unit or one lookup, given its brief and nothing else."
depends:
  - commons.systems/disposition-graph/viable-options#passed-over-options-stay
  - commons.systems/disposition-graph/work-loop
  - commons.systems/disposition-graph/delegation-bounds-and-sizing
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

Every session has a main thread, the thread that holds the session's work, launches its units, and reads what they return; a subagent is a session the main thread launches for one unit or one lookup, given its brief and nothing else. The alignment session's main thread holds the interview and the record: it interviews the author, writes and amends nodes, reviews what subagents return, and lands, and it runs on the most capable model at full effort. A reconciliation session's main thread runs on the larger model until the reconciliation skill's instructions are defined well enough for the smaller one, which is the recommendation the author asked the AI to make and the skill to carry; the recommendation is stated here, and the skill encodes it, so the rule stands when the shim the skill is goes. Everything else is delegated: a lookup needs only its question and its answer, and anything larger is a unit. A unit is one deliverable with a written contract, inputs, outputs, the files it may write, and its error behaviour, with a test or a verifiable output; a unit that needs a second contract is two units. Every investigation whose context is verbose is a unit whatever its size: debugging, driving a browser, reading logs, transcripts, or diagnostic output, and surveys. The subagent reports a conclusion and the exact commands it ran; the main thread reads the conclusion and never the context. The model follows the kind of work: the smaller model for mechanical tooling, tests, format work, and anything whose contract determines the answer; the larger model for design and judgment, such as a layout or a survey that classifies what it reads; the smallest for lookups. The effort is stated in the brief. A subagent never runs state-changing version control, never edits a node or the record's scaffolding, writes only the files its brief names, and works only in the worktree it was given. A reconciliation session is bound toward the record as the work-loop node bounds it, and that node owns the bound; a subagent never edits a node.

## Rationale

The author's words of 2026-09-03 on this node, quoted above, name verbose investigation as the case for delegation and give its cost as the reason; that is the clause that is theirs. Their words of 2026-09-03 on the work-loop node, quoted above, say implementation is delegated with "appropriate" recursive subagents and leave "appropriate" open, and ask the reconciliation skill to recommend the model it runs on, ideally the smaller one; their grant of 2026-09-04 on the viable-options node asks for right-sized models and effort levels where they yield token efficiency. The unit contract, the model by kind of work, the effort in the brief, the main thread's model per session, and the subagent's four bounds are the AI's answer to the question those words leave open, grounded in them and in nothing earlier: a ruling of 2026-09-02 that this rationale once cited is quoted nowhere in the record and is cited no longer. The rule binds the alignment session and the reconciliation sessions alike, each through its own main thread; during bootstrap it is projected into the rule file, the alignment skill, and the reconciliation skill. The two implementations that read the model rule had split, the review skills reading the main thread's model as fable and the reconciliation skill running on opus while citing this node; the answer now gives each session's main thread its model, and both stand under it.

Amended 2026-09-04 under the author's bootstrap grant of that day, recorded on the viable-options node, from the author's words there amending their ruling of 2026-09-03, quoted on the work-loop node: "the prior statement that 'reconciliation never edits the graph' is incomplete." The bound on the reconciliation session narrows to the write the work-loop node allows and keeps the subagent's bound whole. The answer as it stood is kept as the option `never-writes-the-graph`. The bound itself is the work-loop node's, and this node cites it rather than restating it, so the rule has one home.

## Facts

### answer

`reconciliation-session-writes-options` is recommended because the author's amendment of 2026-09-04, quoted above, grants exactly this move: a reconciliation session's main thread records viable options and moves recommendations within scope, and the graph-writing bound of 2026-09-03 is by their words incomplete. Boldness moderate: the verbose-investigation clause and the amendment are the author's, while the unit contract, the model by kind of work, the main thread's model per session, and the subagent's four bounds are the AI's. The case against is that the answer generalises past the author's words: the contract, the report, and the main thread's read of the conclusion are a fixed cost per unit, the lookup exemption is the only floor, and anything larger is a unit still catches every three-line investigation.

#### never-writes-the-graph

The answer as it stood from 2026-09-03: the main thread, the unit, the model by kind of work, the subagent's bounds, and a reconciliation session that never writes the graph, which is alignment's alone. Viable if the author prefers the graph written by alignment alone.

#### reconciliation-session-writes-options

The sentence binding a reconciliation session never to write the graph is amended as work-loop's is, and this node cites that bound rather than restating it, so the rule has one home there. What stays here is the subagent's bound: a subagent still never edits a node. Raised on commons.systems/disposition-graph/viable-options, from the author's words of 2026-09-04 recorded there.

#### fixed-model-for-every-task

Every unit runs on one fixed model. It was passed over because the cost is
then set by the most capable model at full effort, and most units do not need
it.

#### main-thread-investigates-small-questions

The main thread investigates itself when a question looks small. It was passed
over because the size of a debugging context is unknown until it has been
read.

#### reconciliation-passes-an-option-over

Passed over on 2026-09-05. It proposed a third act in this node's enumeration of
what a reconciliation session's main thread may do, the passing over of an option
and the lifting of a status the AI wrote, beside recording an option and moving a
recommendation. The amendment of that day struck the enumeration from the answer
and gave the bound its one home on `work-loop`, so there is nothing here for a
third act to lengthen and the option moves nothing. Where it still bears is on
`work-loop`, which owns the bound, and on `viable-options`, whose recommended
answer names this node among those enumerating two acts and is stale as to it.
Raised on commons.systems/disposition-graph/viable-options, from the author's
words of 2026-09-04 recorded there.

### authority

Ratified is recommended because the subagent's bounds and the reconciliation session's bound toward the record are capture-shaped: a subagent that edits a node or runs state-changing version control changes the record outside the dialogue, and the record's rule escalates toward ratified where being wrong is irreversible or capture-shaped. Boldness moderate: the author's words cut the other way on half the answer. "Appropriate" is an open question, the shim's model is the skill's to recommend, and right-sized models and effort are granted where they yield token efficiency, so the sizing of units, models, and effort is already handed to the AI's judgment, and delegated is the live rival. The case against ratification is that a ruling of delegated would say the sizing is the AI's and the author does not want to be asked again about it; a ruling that divides the bounds, ratified, from the sizing, delegated, is the question of the node beneath this one, `delegation-bounds-and-sizing`, minted by the reading of 2026-09-05, and a ruling here does not pre-empt it.

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

### Clean-context review, 2026-09-05

Read in clean context by a subagent given this draft, its ancestry, its siblings, the nodes it names, and the index of every question the record asks, and nothing of the sitting. Verdict: forward to the author's ruling.

Findings:

- Answer, sentence 3 (validation 1, drift from the author's words). 'A reconciliation session's main thread runs on the model the reconciliation skill recommends for it, which the author asked that skill to name, the smaller model where the skill's instructions are defined well enough to run there.' The author's words quoted under '## Disposition' ask the AI to recommend and then to encode: 'recommend the model this shim must run as ... Encode the shim as a skill with the recommended model so that I can initialize a session'. They asked for a recommendation, recorded, and a skill that carries it; the draft turns that into the skill naming the model. Verified at the locus: .claude/skills/reconcile/SKILL.md:59 reads 'Run the session on `opus`: `claude --model opus`, then `/reconcile`', and the only citation in that paragraph, at lines 63-66, points back at this node ('(`delegation`, whose draft answers on the AI's judgment what makes a subagent, a model, and an effort appropriate; the author's words of 2026-09-03 on `work-loop` leave that question open)'). The node points at the skill for the model and the skill points at the node for the rule, so the model a reconciliation session's main thread actually runs on is stated in no node of the graph and an executor reading .claude/rules/delegation.md cannot learn it from the record. Suggested edit: state the recommendation here — 'a reconciliation session's main thread runs on the larger model until the reconciliation skill's instructions are defined well enough for the smaller one, which is the recommendation the author asked for and the skill carries' — or mint the question as a node under this one and cite it.
- Answer, sentence 3 (validation 5, shims). The artifact this sentence rests on is a declared shim, and the draft does not say so. work-loop's frontmatter declares '`.claude/skills/reconcile/SKILL.md` on the implementation ref, the reconciliation skill hand-written from this node and its siblings', liquidating when 'the orchestrator and the bite skills are materialized from ratified nodes ... and every rule this project runs under is a node or a declared shim'. So a standing global-tier rule is made to depend for its content on an artifact the record has scheduled for deletion, on the strength of the very liquidation clause that says every rule is a node; and the growth node carries the same principle as the passed option `the-skills-own-text-as-authority`, whose prose reads 'every rule a session works under is a node or a declared shim'. Suggested edit: take finding 1's edit, or at minimum add one clause saying the skill's recommendation is a shim's and that the rule reverts to this node when the shim liquidates.
- Facts, answer, '#### reconciliation-passes-an-option-over' (viability). 'The amended sentence carrying three acts rather than two ... This answer takes its enumeration from work-loop's, which the viable-options node's recommended answer of 2026-09-05 would make short by one.' The Answer no longer enumerates the acts at all: the 2026-09-05 amendment replaced the restatement with 'A reconciliation session is bound toward the record as the work-loop node bounds it, and that node owns the bound; a subagent never edits a node.' The option therefore proposes a change to text this node does not carry, and it moves nothing whatever viable-options rules. Suggested edit: pass it over with that reason (absorbed when work-loop took ownership of the bound), or rewrite its prose to bear on the one place the enumeration survives on this node, the recommended option's own sentence. On another node, for the session and not for this node's stage: viable-options' recommended answer says 'passing an option over being a third act where the work-loop, delegation and author-questions nodes today enumerate two', which is now stale as to this node.
- Facts, answer, '#### reconciliation-session-writes-options' (one home, in the text that outlives the dialogue). The option's prose still restates work-loop's bound in full — 'the session's main thread may record a viable option on a fact and move its recommendation, within scope, and never rules, edits a ruling, or edits the author's words' — which is exactly the restatement the amendment struck from the Answer, and the Rationale's reason for striking it ('The bound itself is the work-loop node's, and this node cites it rather than restating it, so the rule has one home'). The facts survive the recording while the account does not, so the second home the amendment removed from the Answer is kept in text that outlives the dialogue and will go stale the same way. Suggested edit: cut the enumeration from the option's sentence and let it read that the bound is work-loop's and this node cites it, with the subagent's bound kept whole.
- Facts, authority, `against` (validation 15, merge: a question carried on the dialogue with no node of its own). 'a ruling dividing the bounds, ratified, from the sizing, delegated, is a question under this node, and the author may ask for it.' The authority fact cannot express that division, its options being the fixed three, so as the record stands the author must ratify the sizing of units, models and effort in order to ratify the subagent's bounds, though their own quoted words hand the sizing to the AI ('"appropriate" is open question'; 'delegate to subagents with righ-sized models and effort level (opus, sonnet) when it would result in token efficiency'). Verified no node asks it: grep of every '^question:' in disposition/disposition-graph/ finds delegation, decomposition, model and review-model on these terms and nothing on the division. Proposed for the session, not done by this reading: a node under this one, 'Which parts of the delegation rule must be ratified, and which sizing is the AI's?', its ground the two quotations already on this node and the class-recommendation node's test, with this node's authority fact then ruled on what remains after it.
- Readings and Account (validation 4, and the evaluation node's second pass). The node records no reading and no tradition pass, yet the amendment's central justification is a tradition the record has already read and adopted elsewhere: `dry-single-source-of-truth` ('What does the rule against duplicating knowledge say about one instruction written in two files') bears on review-skills#two-skills-one-package and prose-and-structure and not here, and `codd-update-anomaly` ('one fact stored in two places') bears on prose-and-structure and alignment-page and not here, while this node's Rationale argues 'so the rule has one home'. `brooks-surgical-team`, the reading on where the strongest mind belongs, bears on review-model's `fable-for-both-readings`, which is the species of this node's genus. The evaluation node requires that 'Every evaluation runs twice, once as fresh best judgment and once with reference to tradition ... and every tradition surfaced is recorded as a reading with the resolution it informed'; four readings of this node have now passed with no such pass recorded. Suggested edit: add a `bears` entry on `dry-single-source-of-truth` for this node's answer fact and its recommended option, relation adopted, and record in the account what the tradition pass found, or that it found nothing further.
- Frontmatter, `defines` (small). The three terms carry no glosses — the frontier prints 'Defines: `main thread` (no gloss yet); `unit` (no gloss yet); `subagent` (no gloss yet)' — while the sibling rule work-loop carries `{term, gloss}` pairs for `frontier`, `bite` and `reconcile`. All three are now defined in the Answer's first two sentences and the definition of a unit in its fifth, so the glosses can be lifted verbatim: main thread, 'the thread that holds the session's work, launches its units, and reads what they return'; subagent, 'a session the main thread launches for one unit or one lookup, given its brief and nothing else'; unit, 'one deliverable with a written contract, inputs, outputs, the files it may write, and its error behaviour, with a test or a verifiable output'.
- Frontmatter, `tier: global` with `under: growth` (carried forward, not new). Unchanged since four readings raised it; verified tier stands at the maieutic stage (disposition/disposition-graph/tier.md:3, 'stage: maieutic'), so the placement question is still open. Verified the rule does bind everywhere today: the node is one of the five carrying `tier: global`, and .claude/rules/delegation.md (2230 bytes) matches the Answer word for word on a whitespace-normalized comparison. This finding only carries the question to the tier ruling.
- Frontmatter, `depends` (small). It names `commons.systems/disposition-graph/viable-options` whole, where the dependency the facts describe is on one option of it: '#### reconciliation-passes-an-option-over' says 'the viable-options node's recommended answer of 2026-09-05 would make short by one ... this one moves only if that one does', which is `passed-over-options-stay`. The encoding allows `<id>#<option>` and the alignment page's ordering reads it. Suggested edit: `commons.systems/disposition-graph/viable-options#passed-over-options-stay`.
- A finding about another node, written here in prose and changing nothing of its stage, for the session to validate and record: `commons.systems/disposition-graph/review-model`. Its Answer reads 'fable, the most capable model the harness offers and the one the delegation node gives the main thread', and its Facts ground the flat rule on 'The party whose blind spots a clean-context reading hunts is the main thread, which runs on the most capable model at full effort'. This draft splits `main thread` per session and gives that model only to the alignment session's, while the recording node holds that 'the author or any session may invoke it on any node at that stage' — so a review invoked by a reconciliation session, whose main thread runs on the model its skill recommends, has no main thread at the model review-model's argument assumes. The option would be named `alignment-main-thread-named` and would carry: 'The same rule, with the party the reading hunts named as the alignment session's main thread, which the delegation node puts on the most capable model at full effort, so that the reader's rank is fixed by the drafter's role and not by whichever session invoked the reading.'

On the facts and what they recommend: The answer fact recommends `reconciliation-session-writes-options`, which is also what `stands`, so the absence of a '## Recommendation' fence is right, and boldness moderate is right: the verbose-investigation clause and the 2026-09-04 amendment are the author's, and the unit contract, the three model tiers, the per-session main-thread model and the four subagent bounds are the AI's, which is what moderate says. The authority fact recommends `ratified` at moderate with a case against naming `delegated`, and the class the fact recommends is the one the session means to present; the reason's use of 'capture-shaped' is accurate against the class-recommendation node's definition ('the party that would set the answer is the party the answer is meant to check'), though the reason grounds ratification in the bounds alone while the ruling it asks for covers the sizing too (finding 5). No persistence fact, correctly, since the amendment declares and liquidates nothing and adds no evidence; the recorded review pin c6dd579b is stale by the projector's own reading ('review: forward (moderate, 2026-09-05), changed since its review'), which is why this re-read runs and what this reading's pin replaces.

On the viability of the options: Answer fact: `reconciliation-session-writes-options` is viable and grounded in the author's amendment quoted on this node and on viable-options; `never-writes-the-graph` stays viable only as the author's reversal of words they have already called 'incomplete', which its sentence says and work-loop keeps the same way; the two passed options keep reasons that still hold, `fixed-model-for-every-task` being untouched by review-model's fixing of one model for one kind of work; `reconciliation-passes-an-option-over` is no longer viable as written, because the text it would amend has left the Answer (finding 3). One viable option is missing, and it is the one the author will never get to rule on as the fact stands — call it `model-named-in-the-record`: 'The same answer, except that the reconciliation session's main thread's model is stated here as the AI's recommendation, the larger model until the reconciliation skill's instructions are defined well enough for the smaller one, with the reconciliation skill carrying that recommendation as its projection rather than being its source, so that the rule an executor runs under is in the record and survives the shim's liquidation.' Authority fact: `ratified`, `delegated` and `deferred` are all viable, `delegated` is the live rival and is now argued under the fact, and the division between them is not an option here but a node (finding 5).

Strongest counter-argument (moderate): The draft asks the author to ratify a global-tier rule two of whose operative sentences are not in the record. The model a reconciliation session's main thread runs on is delegated to a shim skill's text, and that skill grounds its own choice by citing this node, so ratification would pin a pointer whose target is scheduled for liquidation by a clause that itself reads 'every rule this project runs under is a node or a declared shim'. Beside that, the one ruling on the authority fact covers both the capture-shaped bounds, where ratified is plainly right, and the sizing of units, models and effort, which the author's own quoted words hand to the AI twice ('"appropriate" is open question'; right-sized models and effort 'when it would result in token efficiency'), so the author cannot delegate the sizing without denying the bounds. And the oldest objection still stands unmet: the contract, the report and the main thread's read of the conclusion are a fixed cost per unit, the lookup exemption is the only floor, and 'anything larger is a unit' still catches every three-line investigation. What answers all of this is that each defect is an amendment away — state the model here, split the class question into a node beneath, and the rule is the one the author's words already describe.

The session's reply: All ten findings were validated at their loci on the main thread and all ten were accepted. The counter-argument is accepted in both its limbs, and each is answered by an amendment rather than recorded as an option, which is what the reader itself said would answer it.

F1 and F2, the model stated in no node: confirmed, and the circle is exact. `.claude/skills/reconcile/SKILL.md:59` reads "Run the session on `opus`", and the only citation in that paragraph, at lines 63 to 66, points back here; the skill is a shim declared on `work-loop`, liquidating when "every rule this project runs under is a node or a declared shim". So a global-tier rule delegated its content to an artifact scheduled for deletion by the clause that says rules are nodes. The author's words asked for the opposite order, a recommendation made and then encoded: "recommend the model this shim must run as ... Encode the shim as a skill with the recommended model." The answer now states the recommendation and the skill carries it, which is the order the author asked for and which leaves the rule standing when the shim goes.

F5, the fact that cannot express the division: confirmed. The authority fact's options are the fixed three, so ratifying the subagent's bounds ratifies the sizing of units, models and effort with them, and the author's own quoted words hand the sizing to the AI twice. I verified that no node asks the division: no `question:` line in the graph is on those terms. The record's own rule is that a decision the author would rule on separately, and which is not one of the four facts, is a question and a question is a node. So it is minted: `delegation-bounds-and-sizing`, under this node, carrying the two quotations that ground it and the `class-recommendation` test, and this node's authority fact now cites it. The `against` no longer says the author may ask for a node that does not exist.

F3 and F4, the enumeration in two more homes: both confirmed. The amendment of 2026-09-05 struck work-loop's bound from the answer and gave the bound one home; it survived in the recommended option's prose and in a second option that proposes an amendment to text the answer no longer carries. The recommended option's sentence now cites work-loop and keeps only the subagent's bound, which is this node's own. `reconciliation-passes-an-option-over` is passed over with the reason, absorbed when work-loop took ownership of the bound; that the `viable-options` node's recommended answer names this node among those enumerating two acts is now stale, and it is recorded there.

F6, the tradition pass never recorded: confirmed, and four readings have passed without it. `dry-single-source-of-truth` gains a `bears` entry on this node's answer fact and its recommended option, relation adopted, since "so the rule has one home" is that tradition's argument and this node made it without citing it. `codd-update-anomaly` is the relational half and keeps its one home on `prose-and-structure`, as that reading's own rationale says; the account records that the pass found nothing further beyond `brooks-surgical-team`, which bears on `review-model`, the species of this node's genus, and informs no resolution here.

F7, the three terms with no gloss: confirmed against the frontier's own print. All three are lifted verbatim from the answer.

F9, the dependence on a whole node where one option is meant: confirmed. `viable-options#passed-over-options-stay`.

F8, the tier placement: confirmed as carried and not new. `tier` stands at the maieutic stage, the rule does bind everywhere today, and `.claude/rules/delegation.md` matches the answer word for word. Nothing is done here; the question goes to the tier ruling.

F10, the cross-node consequence: confirmed at the locus. `review-model`'s answer grounds fable on "the one the delegation node gives the main thread", and this node now gives that model to the alignment session's main thread alone, so a reading invoked by a reconciliation session has no main thread at the rank that node's argument assumes. It is recorded there as the option `alignment-main-thread-named`, in the reader's words. The review proposes and does not write the other node's answer.

Two amendments follow this reading and no third reading is bought by them: this is the second reading of this answer, and the cap is reached.

### Amended after the second reading, 2026-09-05

All ten findings and both limbs of the counter-argument were validated at their
loci on the main thread and accepted; the amendments are the ones the reader
itself said would answer it, and the reply above says which.

Three of them reach beyond this node. `delegation-bounds-and-sizing` is minted
beneath it, carrying the two author quotations that hand the sizing to the AI and
the `class-recommendation` test that keeps the bounds with the author; this
node's authority fact and its `### authority` prose now cite it instead of
telling the author they may ask for a division the record did not carry.
`dry-single-source-of-truth` gains a `bears` entry on this node's answer fact and
its recommended option, the tradition whose argument "so the rule has one home"
already was. `review-model` gains the option `alignment-main-thread-named`,
because this node's amendment moved the ground its answer stands on, and the
option is written there in the reader's terms and answers nothing on its behalf.
The `viable-options` node's recommended answer names this node among those
enumerating two acts; the enumeration left this node's answer on 2026-09-05, and
that sentence is marked stale there.

The pin this reading recorded, `023105757713119b012579ed2d09ca667e831101`,
names the draft the reader read and not the amended text, and it is not
re-settled: the second reading is the cap this answer buys, and re-settling the
pin silently would say a reader had read text no reader has seen. What that costs
and the three ways out of it are recorded as the option
`pin-names-the-text-the-reader-read` on the `review-cost` node, and none of them
is taken here.

### The dependency its own case against assumed, 2026-09-05

The reading of `delegation-bounds-and-sizing` found this node's authority-fact
`against` saying "a ruling here is on what remains after that one" while nothing
in data held this ruling behind that one, and this node standing at the ruling
stage with a forward pinned. That node is added to `depends`, so the alignment
page will not put this question before the one it rests on. `depends` is a
dialogue key and is stripped from the standing hash, so the recommendation and
its pin are unmoved.

### Frontier survey, 2026-09-05

Read in clean context by a subagent given the whole graph and nothing of the sitting, judging this node's recommendation against every other node. The survey gives no verdict.

Findings:

- `## Facts` carries a `#### reconciliation-session-writes-options` subsection for the option named by `stands` (brief line 2502). See the cross-node `contradiction` finding naming nine nodes.
- This node stands at the ruling stage while `commons.systems/disposition-graph/delegation-bounds-and-sizing`, its child, stands at the ruling stage recommending that clauses be cut out of this node's answer. Ruling the parent first would ratify text the child proposes to remove. Recorded as the `placement` finding.

Strongest counter-argument (strong): The answer generalises past the author's words: they named verbose investigation and gave its cost, and the answer makes everything but the interview and the record a contracted unit, so the fixed cost of a written contract plus a report plus the main thread's read of the conclusion is paid on every three-line investigation, with the lookup exemption as the only floor. And the sizing the answer fixes is the part the author's own words handed to the AI's judgment, which is precisely why `delegation-bounds-and-sizing` exists; a ruling here is a ruling on a text whose child, at the same stage, recommends amputating a third of it.

The session's reply: Taken on the ordering and contested on the generalisation. The order finding is right and is the one that matters: this node must not be ratified before `delegation-bounds-and-sizing` is ruled, or the author ratifies clauses the child proposes to remove and then has to be asked about them twice. On the fixed cost of a contract on a three-line investigation, the answer's own lookup exemption is the floor and the survey does not show it failing; what the survey does show is that the line between a lookup and a unit is applied case by case with nothing recorded, which is the sizing question the child moves out. The standing-option subsection is taken with the other eight.

### Frontier finding, 2026-09-05

Kind: contradiction.

Nine nodes carry, inside `## Facts`, a `#### <option>` subsection for the option their answer fact names in `stands`. The encoding rule is that the standing option omits its subsection because its sentence is the first sentences of `## Answer`, and `commons.systems/disposition-graph/dialogue`'s own recommended answer states it: the option that stands "needs none, since its text is the answer". The nine, each with the standing option whose subsection is stored: `authority` (`authority-derived`), `delegation` (`reconciliation-session-writes-options`), `dialogue` (`facts-carry-options`), `evaluation` (`overrule-by-class`), `readings` (`relation-per-option`), `recording` (`options-persist-at-the-recording`), `rejected` (`non-chosen-viable-options`), `unanswered` (`unanswered-is-no-ruling`), `viable-options` (`grant-from-a-ruling`). `dialogue` is one of the nine, so the node that states the rule breaks it. What is stored is not the answer's first sentences but a description of the change the option made — on `readings` at line 131 it opens "A reading stays a node under one node it bears on, with its own class, and its relation attaches to the options of the fact it bears on rather than to the answer", and elsewhere the prose opens with a raising note of the form "Raised on ... from the author's words of 2026-09-04". Six of the nine render that stored prose in the survey brief in place of the answer's opening (brief lines 559, 846, 1282, 2403, 2502, 3671), so any projection that reads a standing option's subsection shows the author a delta where the answer belongs. The other three (`dialogue`, `evaluation`, `unanswered`) are outside the judged set and their standing rows are not rendered in the brief, so their subsections are dead text nothing reads. The record has the question open and unruled in two places: `dialogue` carries the option `standing-option-carries-a-subsection` (source alignment-page, 2026-09-04) and `alignment-page` carries `standing-sentence-stored`, passed over on 2026-09-04. So nine nodes have implemented an option the author has not ruled, against the rule that stands.

Also named: commons.systems/disposition-graph/authority, commons.systems/disposition-graph/dialogue, commons.systems/disposition-graph/evaluation, commons.systems/disposition-graph/readings, commons.systems/disposition-graph/recording, commons.systems/disposition-graph/rejected, commons.systems/disposition-graph/unanswered, commons.systems/disposition-graph/viable-options, commons.systems/disposition-graph/alignment-page.

Proposed: Rule it once, on `commons.systems/disposition-graph/dialogue`, whose answer states the rule and whose fact already carries the option. If the standing option keeps no subsection, delete the nine subsections — the text is not lost, since `## Answer` carries the answer and the account carries the history of the change. If the standing option is to carry one, the rule in `dialogue`'s answer changes and the nine subsections are rewritten to carry the answer's first sentences rather than a description of a change. Either way the nine conform to one ruling and no node is left implementing the losing side. Until it is ruled, the six whose stored prose the projections render are the urgent half, because those are the ones showing the author the wrong text.
