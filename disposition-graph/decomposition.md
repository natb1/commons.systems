---
question: How is a complex disposition decomposed into units for a sitting, and how are their results integrated?
stage: review
probes:
  - id: bundled-disposition-as-queued-questions
    asks: >-
      Is a bundled disposition read as questions queued under the node it
      refines?
    fact: answer
    why: >-
      The author's opening words hand the sitting two multi-part examples and
      ask for the seams by which such dispositions are decomposed; the record's
      ground for the decomposition, the `node` node's rule that a text answering
      two questions is two nodes, is not cited in the author's words, and the
      account names that rule as the probe the periagogic stage put.
    discharges: >-
      Whether the decomposition's first seam holds, which moves the answer
      fact's recommendation off `seams-and-split-review`.
    source: ai
    raised: 2026-09-04
    status: discharged
    reason: >-
      The author answered on 2026-09-04, in the words quoted last under this
      node's `## Disposition`; the `### Grant of 2026-09-04` records that the
      answer takes the recommendation as presented, its reading of a bundled
      disposition as questions queued under the node it refines included.
facts:
  - name: answer
    options:
      - name: seams-and-split-review
        source: ai
        ref: "2026-09-04"
      - name: pre-review-under-the-batch
        source: ai
        ref: "2026-09-04"
      - name: decomposition-before-minting
        source: review
        ref: "2026-09-05"
      - name: main-thread-performs-the-surveys
        source: ai
        ref: "2cbf3618"
        status: passed
        reason: "the delegation node already rejects it: the size of a survey is unknown until it is read"
      - name: one-unit-per-disposition
        source: ai
        ref: "2cbf3618"
        status: passed
        reason: "it hands a subagent the interview"
      - name: decomposition-by-the-author
        source: ai
        ref: "2cbf3618"
        status: passed
        reason: "the sitting can propose it and the author need only refuse"
      - name: reviewer-on-a-fixed-model
        source: ai
        ref: "2cbf3618"
        status: passed
        reason: the model is the review-model node's question since 2026-09-04, where the author's words decide it for both readings
    recommends: seams-and-split-review
    boldness: moderate
    against: "A per-draft brief carried the index of every standing answer, so a sitting of several questions read several times the tokens of the one batch it replaced, and the author's first-named judge is token efficiency; the design stood on their second, attention, and on timing, and the index was the lever against the cost. The `review-cost` node pulled that lever on 2026-09-05: the index is one line a node and a brief is roughly a third of what it was, so the case against is now the residue, that a sitting still pays a fixed cost of brief and contract per draft where the batch paid it once."
  - name: authority
    options:
      - name: ratified
      - name: delegated
      - name: deferred
    recommends: ratified
    boldness: low
    against: "The author's words on viable-options leave the right-sizing of models and effort to the AI's judgment, which is the review-model node's recorded case for delegated and bears harder here, where the author named no model and asked for right-sized ones."
review:
  verdict: forward
  strength: moderate
  date: 2026-09-05
  of: 3b51e33ce30ea6d89ba0809d2f8227c78ac16847
  against: "The author's own judge for this design is token and context efficiency, and the record's measurements cut against it on tokens. A per-draft review reads a brief whose larger part is the index of every standing answer: 420,361 bytes for one draft at ed725297 and 738,625 bytes for this node today, so a seven-question disposition reviewed draft by draft reads roughly three to five megabytes, plus the survey's 519,400, against the 838,923 bytes of the single batch the design replaces. The design trades a smaller context per reader for several times the tokens per sitting, and the fence states the cost only as \"the fixed cost of a contract per unit\" and says a per-draft review \"reads a draft's neighbourhood\" as if that were the smaller read. The disposition stands regardless because the author's other criterion, attention, and the timing argument (a finding at the point of writing lands while the draft is still open, not after the sitting has integrated around it) favour it, and because the index is the lever the account already names; but the fence should state the token cost it carries as a consequence."
form: rule
under:
  - commons.systems/disposition-graph/delegation
defines:
  - seam
depends:
  - commons.systems/disposition-graph/clean-context-review#per-draft-and-survey
  - commons.systems/disposition-graph/frontier-consistency#split-survey-from-per-draft
---
## Disposition

The author, 2026-09-04, opening the sitting (the two examples were each fenced in the original):

> /align dispositions provided to the alignment skill may require complex and multi-faceted analysis. Look at the two appended examples. Do not begin dialogue or analysis of those examples, other than to recommend standard seams by which complex dispositions like those can be broken down and distributed to subagents (with right sized models and effort level) then integrated by this main alignment dialogue thread. Analyze from the perpective of token/context efficiency and also management of AI attention. Subagent strategy must include a step after establishing recommendations to pass the more complex recommendations to a fable subagent to review. Help me think through, does this replace the current disposition for adversarial `/align-review` with a disposition that adversarial review happens at any point in the dialogue that a "complex" recommendation is made? Would we retain coverage of "settling"/"untangling" analysis? How would this affect batching disposition of the adversarial review? What solution provides the quality of adversarial review while maintaining token/context efficiency (esp. avoiding redundant analysis - the serialized batching of adversarial review already seems like a bit of a hack)?
>
> Do not act on the following example dispositions, they are provided for reference to analyze how they might be decomposed for token/context efficiency and management of AI attention:
> 1.
> ```
> /align refinement to purpose disposition. 
> - Help me think more thoroughly about how this purpose serves both my personal, public disposition. My personal disposition as recorded does not yet fully support dispositions like those listed below. Does it fully support the purpose disposition as it stands?
> - Help me evaluate how the purpose engages target personas to progress through two journeys a) supporting the project through claude affiliation and services purchase (independent contracting by the author) b) the learning funnel (periagogic) where the target personas are actively engaging in and applying the concepts. As highest ranking node the purpose document in the browser is where personas from a variety of channels land - eg. github.
> - For example, this answer seems to lack a diagnosis of the problem it is solving. Would including the diagnosis here make it more compelling for readers to optimize progression through the sales and learning funnels? What other principles of good writing and good marketing tradition can be applied here?
> - Help me think through disclosure of dispositions. For example, some private information must not be disclosed - like names of real people used as prototypes for personas. Disclosing some dispositions would conflict with other recorded disposition - most enterprises have dispositions that they consider to be proprietary. i.e. disclosing some dispositions would conflict with their business interests. Gated disclosure must not conflict with disposition against gatekeeping knowledge, and disclosure must not be gated reflexively. that would also create conflict with recorded disposition such as feeding the funnels. What traditions can be referenced on this. Help me untangle and settle these surface conflicts in disposition.
> - since there will be at least some non-disclosed disposition, we can no longer delay that disposition. Non-disclosed disposition is persisted to a private git repo and is mounted by the disposition graph in this repo. This is essentially the same as a "delegate to claude" mounted node where the hypothetical disposition of claude is not transparent and so can effectively be reduced to a single mount node. The only difference is that the transparency of the private graph is based on role. The author must have transparency into the private graph and the public graph (and/or disposition-graph) must make addressable references to the private graph. Information must not leak via those references (eg. a node id with the real name of a persona's prototype).
> - disposition to support a sales and learning funnels will involve recording of both personas and channels (disclosed or not). 
> - The sales funnel will need to be supported by CTA in the browser since that is where some channels dump. That could look like (rendered into the top navigation) a "support this project" CTA with links to "ask claude about this document" (to capture anthropic affiliation revenue/tokens) and "ask the author about this document" (to capture independently contracted service revenue).
> ```
> 2.
> ```
> /align before proceeding with the bootstrap I want to start managing the rules and settings in the harness as reconciliations of the graph. That includes CLAUDE.md, .claude/rules, per-worktree CLAUDE.local.md, .claude/settings.json, claude code cli status line configuration and any other configuration in .claude that might be reconciled by disposition. 
> - Note: some bootstrap work has already been done to reconcile essential skill configuration. Recommend improvements if necessary, but be careful not to clobber `/align` and `/align-review` skills which the bootstrap operations rely on. (all other skills/rules/etc. are in play without caveat)
> - One essential motivating disposition is disposition on greenfield recomendations. It states (something like): Whenever asked for a recommendation claude must do a greenfield evaluation and describe brownfield costs. this is especially true for `/align` and `/align-review`.
> - If there is configuration that is not yet relevant to existing disposition, does that suggest areas where disposition needs to be fleshed out. eg. I rely heavily on skill configuration and not agent configuration. Is that a gap? Would layering on reconciled agent configuration buy me something? 
> - reconciled context (rules, skills, etc.) must be kept tight. We must mechanically avoid bloat that is not justified by disposition which is in turn justified by evidence that claude requires steering. Permissions configuration has a similar requirement - the permission frontier must not ratchet without pruning of what's actually required. How do the existing graph principles of reconciliation/liquidation, instrumentation and evidence gathering play into this?
> - CLAUDE.local.md must be provisioned automatically with graph context relevant to work being done in that worktree. This is so all of the relevant decisions in the graph affect decision making for the work unit and mitigate the risk of greedy solutions at a single node level - what rationale justifies this work unit (what is the node for this work unit "under"), what traditions are in play that support this work unit (so that work can lean on references to that tradition), what traditions diverge (so that work doesn't incorporate default tradition that has been rejected), what adjacent work is being performed (to avoid scope overreach or conflicts), etc. Is creating the CLAUDE.local.md an initialization step for "bite" skills? Is there a common subskill or script for provisioning CLAUDE.local.md? Evaluate the applicability of this for `/align` and `/align-review` where the scope of work may change as the dialogue progresses.
> - give me options for what to include on the status line which I can choose from to set disposition
>
> evaluate this tangential disposition in parallel because it may overlap with disposition on CLAUDE.local.md for alignment dialogue: `/align` and `/align-review` must be network concurrency safe. Consider write concurrency and also how to avoid thrashing of disposition when concurrent sessions are "settling"/"untangling" overlapping subgraphs (which can happen during periagoge and adversarial review). Mechanically enforced serialization is acceptable as long as the author can queue disposition in multiple concurrent alignment sessions until persistence in the graph is resolved. As part of this re-consider nested disposition worktree as pattern - is this the ideal greenfield pattern or is there a better way to manage state of the disposition ref. Consider that only the `/align` and `/align-review` skills have authority to mutate the graph. All other work is read only and only if a required part of the graph falls out of the compaction floor for materialized context. Does this affect the design?
>
> Make sure concurrency strategy is air-tight against integrity loss.
>
> Proceed through meiutic, stop before adversarial review. Then request booststrap authority to reconcile the unanswered dispositions along with a list of all things that will be materialized.
> ```

The author, 2026-09-04, on the recommendation above, the probe, and the grant asked for at its close:

> go, and bootrap authority granted

## Facts

### answer

The recommendation takes the seams the record already carries, the node node's rule that a text answering two questions is two nodes, the sitting's movements, and the delegation node's rule that the model follows the kind of work, and names them as the seams of a sitting; and it takes the review step the author requires as the half of the clean-context review whose object is one draft, run at the moment the draft's recommendation is recorded, while the half whose object is the frontier keeps its batch shape. It is recommended over the second option because the second pays for validations one to six twice, once in the sitting's pre-review and once in the batch, and because a batch that reads the sitting's children only when all of them are drafted returns its findings to a main thread that has stopped holding the nodes they concern, which is the attention cost the author's words name. Boldness moderate: the seams are the record's own, and the author's words supply a review at the point of writing; what rests on the AI is the assignment of each seam to a model and an order, the escalation of the design unit to the most capable model where the draft amends an ancestor's recommended text or a node whose answer binds every session, and that every draft is reviewed rather than the complex ones, adopted from the clean-context-review node's option `per-draft-and-survey`, where that departure from the author's words is decided; the survey's incremental judgment and its pin are the frontier-consistency and dialogue nodes' decisions, in `depends`, and the reader's model is the review-model node's question, decided there. The case against is on the fact: the tokens a sitting spends multiply with what each per-draft brief carries, which was the index of every standing answer until the `review-cost` node struck it on 2026-09-05 and is now the fixed cost of a brief and a contract per draft.

#### seams-and-split-review

Five seams, the question, the movement, the kind of analysis, the fact, and the dependency, each dividing a sitting's work into units the main thread integrates from their conclusions alone; the order the units run in, the surveys together, the design after them, the review after the design; and the review divided by its object, which is the option `per-draft-and-survey` on the clean-context-review node and the option `split-survey-from-per-draft` on the frontier-consistency node, both in `depends`, so that a confirmation here confers the seams and the order and not the review's shape. The recommended text sets it out.

#### pre-review-under-the-batch

The same five seams, with the review the author requires added inside the sitting as a pre-review whose findings go into the node's account, while the batch review of the clean-context-review node's standing answer stays the only review of record and the only thing that forwards a node to the ruling stage. Viable if the author holds that no node reaches the ruling stage except through one reading of the whole frontier, which is what their words of 2026-09-03 say; its cost is that validations one to six run twice on every draft, and that the batch still returns its findings on a sitting's children after the sitting has moved on from them.

#### decomposition-before-minting

The decomposition is put to the author before the queued nodes are minted: the author's words are checkpointed on the node the disposition refines, the survey's proposal is put at the periagogic stage, and the nodes are minted after the author's response. Raised by the reading of 2026-09-05, which observed that a node once minted is refusable only by a prune the author rules, where a probe is refusable by a word. Viable if the author would rather rule once on a decomposition than rule prunes on nodes they refuse; its cost is that the queue is invisible on the alignment page until the author answers, and that a session lost between the words and the response resumes from the parent alone.

#### main-thread-performs-the-surveys

The main thread performs the surveys itself rather than delegating them. It
was passed over because the delegation node already rejects it: the size of a
survey is unknown until it is read.

#### one-unit-per-disposition

A sitting is decomposed into one unit per disposition. It was passed over
because it hands a subagent the interview, which is the main thread's.

#### decomposition-by-the-author

The author decides how a complex disposition is decomposed. It was passed over
because the sitting can propose the decomposition and the author need only
refuse it.

#### reviewer-on-a-fixed-model

The reviewer is chosen by a fixed model rather than by the draft's boldness.
It was passed over because the most capable model on every simple draft is the
cost the delegation node's rule exists to avoid, and a smaller one on a bold
draft is a review in name. On 2026-09-04 the author's words put both readings on one
model, and the reader's model became the review-model node's question, where
its recommended option fable-for-both-readings is this option decided there;
it stays passed over on this fact only because the model is not this node's
question.

### authority

Ratified, at low boldness: the rule binds how every sitting spends the author's tokens and attention and how the adversarial review is run, and a wrong answer here is expensive and compounds across sittings, which is the record's own test for escalating toward ratified.

## Recommendation

```markdown
---
question: How is a complex disposition decomposed into units for a sitting, and how are their results integrated?
form: rule
under:
  - commons.systems/disposition-graph/delegation
defines:
  - seam
---
## Answer

Along five seams. A seam is a boundary along which a sitting's work divides into units whose conclusions the main thread integrates without reading their context, so that the main thread holds only the author's words, the node in hand, and what the units concluded.

The question. A disposition that asks or answers more than one question is several nodes, as the node node says, and decomposing it is the first unit of the sitting: a survey that reads the disposition against the record and proposes the questions it asks, where each sits under the record, whether the record already asks it, which of the author's words bear on each, and which questions rest on which. The main thread validates the proposal, records each question as a queued node carrying its words, and puts the decomposition to the author at the periagogic stage as a reading of their own words, refusable like any probe. A refusal is the author's ruling on the existence fact of each queued node it names, recorded from their words in one response, and the questions refused fold back into the parent's `## Disposition`, where their words already are. The decomposition is judgment and runs on the larger model.

The movement. Within each node's sitting the periagogic object, the nodes the disposition would amend and the implementation their criteria point to, is read by a survey unit and never by the main thread; the maieutic stage divides into the units below; the review is the clean-context unit, the reading of the one draft; the survey of the frontier, where settling and untangling are judged, the frontier-consistency node's validations seven to sixteen, is kept as one batch over the whole graph before the author rules, as the clean-context-review node says; the ruling is the author's; the recording is the main thread's, which alone writes a node.

The kind of analysis. The maieutic stage divides into units by what each analyses, each with its own contract and on the model that follows its kind of work, as the delegation node says: the record survey, what the graph says on the question, the chain of nodes above it, the rules that bind everywhere, the nodes that define or use its terms, and the contradictions and redundant seams among them, on the larger model; the tradition survey, the second evaluation, returning readings with source, locus, and what each bears on, traditions shelved by pre-agent constraints among them, on the larger model; the implementation survey, what exists and what a named artifact or command does, on the smaller model; the design, the options on each fact, the recommendation with its boldness, and the draft text, on the larger model, or on the most capable one where the draft amends an ancestor's recommended text or a node whose answer binds every session, which nodes those are being the tier node's question; and the review of the draft in clean context, as the clean-context-review node describes, on the model the review-model node decides. The surveys run together; the design waits on them; the review waits on the design; the main thread's own adversarial reading of the integrated draft, which the evaluation node requires, comes between the two.

The fact. The answer fact is the design's to decide; the authority fact follows the record's rule, escalating toward ratified where being wrong is expensive, irreversible, or capture-shaped; the persistence fact follows the node's shape; the existence fact appears only where a prune is proposed. A design unit's contract names which facts are its.

The dependency. The questions a decomposition yields carry depends among themselves. Their surveys run in parallel regardless; a design waits on the recommendation, not the ruling, of the question it depends on; the main thread integrates the questions in their ruling order; and the review of each draft runs the moment its recommendation is recorded, while the others are still in hand, so that the counter-argument reaches the main thread with the node it concerns and never as a batch of findings on nodes it has stopped seeing.

Every unit returns its conclusion as data with the commands it ran and writes nothing to the record; the main thread writes the conclusion into the node's account at the next checkpoint, so that the record and not the session carries it, and a session that loses its context resumes from the node. This answer is materialized by the alignment skill's list of a sitting's units, under the shim the growth node declares on that skill.

## Rationale

The author's words of 2026-09-04, quoted on this node: complex dispositions need multi-faceted analysis, to be divided along standard seams among subagents with right-sized models and effort and integrated by the main thread, judged by token and context efficiency and by the management of the AI's attention, with a step after a recommendation is established that passes the complex ones to the most capable model for review. The seams are the record's own and this node only names them as seams: the question seam is the node node's rule that a text answering two questions is two nodes, which the dialogue node applies to a decision the author would rule on separately; the movement seam is the sitting's stages; the analysis seam is the delegation node's rule that a verbose investigation is a unit whatever its size and that the model follows the kind of work; the fact seam is the dialogue node's four reserved facts; the dependency seam is the depends field and the ruling order. What is new is the assignment of each seam to a model and an order; the reader's model is the review-model node's question. The cost of the design is the fixed cost of a contract per unit, of the main thread's integration turn after each, and, per draft reviewed, of a brief that carries the index of every standing answer, so that a sitting of several questions reads several times the tokens of the one batch it replaces, which the index is the lever against; the lookup exemption on delegation is the floor beneath it, and a disposition that asks one question runs one design unit and one review and no decomposition. Measured on the record of 2026-09-04: the graph is 1.7 megabytes, of which seven tenths is account history, and the last batch brief handed one reviewer 839 kilobytes in one context; a per-draft review reads a draft's neighbourhood, and the survey, which alone needs the whole, reads it without the accounts. Readings owed as nodes under this one: incremental compilation and link-time analysis, the unit checked alone and the whole linked, adopted for the two objects of review; optimistic concurrency by version stamp, adopted for the pin at apply; mission command, owed on transience as well, adopted for the brief that carries intent and not the scheme; and pair review at the point of writing, shelved while a second reader's time was scarce and affordable now that the reader is an agent, adopted for the per-draft review's timing.
```

## Account

### Sitting of 2026-09-04

What the sitting would amend: the delegation node, which this node refines, and the clean-context-review node, where the review step the author requires is recorded as the option `per-draft-and-survey` on its answer fact; through that option, the frontier-consistency node's pending option `split-survey-from-per-draft`, which this node stands under, the recording node's sentence that a round's dispositions go to review together as one batch, and the dialogue node's review field, which would carry the survey's pin beside the draft review's. The periagogic object: those nodes, the alignment-order node for what settling and untangling are, the checkpoint node for when the per-draft review would run, and the two skills on the implementation ref that project them.

The author's own account is in their words: what the thing is for, token and context efficiency and the management of the AI's attention; what they hold as hypothesis, that review at the point a complex recommendation is made might replace the batch; and what they would not have written, the serialized batch as it stands. The record's ground they have not cited is the node node's rule that a text answering two questions is two nodes, which is the seam the whole design turns on, and the probe at the periagogic stage is that rule.

Evidence, read on 2026-09-04 at graph commit 629e5bc4: the graph is 1,739,853 bytes across the two graphs, of which 1,219,404 bytes are `## Account` sections; the last batch brief, `tmp/review/frontier.brief.md` of 2026-09-03, is 838,923 bytes; seven nodes stand at the review stage; the skill's own text says the brief may exceed what a reviewer can read and asks the reviewer to report what it could not.

The three classes of finding. Within the graph: the recording node still says the reviews of a round are invoked together and each runs in its own context in one sentence and one batch in one context in another, a supersession the review has already named. Between the graph and the AI's knowledge: the batch reads the whole graph as context on every invocation and judges only the batch, so it is already incremental in what it judges and pays for the reading; a reviewer's context is bounded, and a brief of 839 kilobytes is at or past that bound, which the record acknowledges by asking for a report of what went unread. Redundant seams: validations one to six are run by the sitting to produce a draft and by the batch to check it, which is the four-eyes duplication the recording node wants, and again by any pre-review inside the sitting, which is the duplication the second option pays.

The evaluation twice. Best judgment: the two halves of the review have different objects and different minimal contexts, one draft against its neighbourhood and the frontier against itself, and the standing answer runs both in one reading sized for the second; separating them sizes each to its object, lets the first run at the moment it is useful and in parallel, and leaves the second the batch it needs; the lock is replaced by the pin the review state already carries, since a finding recorded with the commit it read can be discarded when the node has moved since. With reference to tradition: the compiler and the linker, blinded review of the piece and the copy desk's pass over the issue, compare-and-swap in place of the lock, and pair review at the point of writing, each recorded as a reading owed in the recommended rationale. Steelman for the standing answer: a reader of the whole frontier sees a draft in the company of every node it might contradict, and a per-draft reader sees only what the brief points at, which is the second reading's finding on the clean-context-review node; the reply is that the per-draft reader is given the sitting's siblings from the record, since checkpoint lands them, and the index of every question the record asks, and that the survey still reads the whole.

Responses open: confirm the recommended text; confirm with edits; deny with feedback; or rule the second option.

### Grant of 2026-09-04

The author's "go" takes the recommendation as presented, its reading of a bundled disposition as questions queued under the node it refines included, which the probe asked about; the author may overrule that reading at the review. It moved the recommendation of the clean-context-review node to `per-draft-and-survey` and that of the frontier-consistency node to `split-survey-from-per-draft`, each with the fence its option now names, and returned both to the review stage; it raised `survey-pin-in-review` on the dialogue node and `review-divided-by-object` on the recording node, since the survey's pin is a field the dialogue node defines and the recording node's batch sentence would otherwise contradict the split. The grant is the author's explicit grant on an unanswered node for this reconciliation, as the authority node requires: the alignment skill and the review skill on the implementation ref, with their briefs, scripts, and tests, and the graph's reader and projector so far as the survey's pin and the readiness of a node for ruling require, reconciled to this node's recommended text and to the two options it stands under. No ruling and no class is written for any of it; this node, clean-context-review, and frontier-consistency stand at the review stage with the clean-context review owed, and the first review of a draft the reconciled skill runs is owed on them. The implementation commit names this grant and the graph commit that carries it.

Evidence, measured on 2026-09-04 at implementation commit ed725297 on the greenfield ref, which is the reconciliation: the review of this node's draft hands its reader 420,361 bytes, the node whole with nine ancestors and global rules without their accounts, two cited nodes, and the index of sixty-three questions with their standing answers; the first survey hands its reader 519,400 bytes, forty judged nodes without their accounts and thirty-five in context, and pins every node's recommendation in a sidecar of 9,676 bytes; the last batch brief, of 2026-09-03, was 838,923 bytes. The first survey judges forty nodes because none carries a pin yet; the next judges only what moved. Those figures are of 2026-09-04 and the design they measure has since changed: the index carried each standing answer whole and was the larger part of the draft's brief, and the question this paragraph left open, whether the index needs the whole answer or less, is the `review-cost` node's and was answered there on 2026-09-05, the index becoming each node's id, question and file on one line. Measured after that reconciliation, three briefs fell by sixty to seventy percent; the byte figures above stand as the record of what the division cost when it was decided, and not as what it costs now.

### Reconciled under the grant of 2026-09-04 for review-model

The author's grant of 2026-09-04 to reconcile the review-model disposition
immediately after its maieutic movement reaches this node's recommended text:
the clause sizing the draft's reviewer to the drafter's model, in the
paragraph on the kind of analysis and in the option seams-and-split-review,
and the rationale sentence that argued it, with the answer fact's claim that
the rule is the AI's, now cite review-model, which decides the model for both
readings. The option reviewer-on-a-fixed-model keeps its status passed with a
new reason, the relocation of the question. The recommended text moved by
these amendments, so the survey is owed on it again.

### Clean-context review, 2026-09-05

Read in clean context by a subagent given this draft, its ancestry, its siblings, the nodes it names, and the index of every question the record asks, and nothing of the sitting. Verdict: forward to the author's ruling.

Findings:

- Answer, 'The question.': "records each question as a queued node carrying its words, and puts the decomposition to the author at the periagogic stage as a reading of their own words, refusable like any probe." Under probe-or-node's recommended text a standing node "can only be demoted by a prune the author must rule on, and while it stands it puts a rulable row on the alignment page", and under author-questions a probe is "put open and never as a choice between drafted answers"; a decomposition minted before the author is asked is therefore not refusable like a probe, since a refusal costs the author a prune ruling per minted node. Suggested edit: either hold the questions on the node the disposition refines, whose words are checkpointed there the turn they are said (all the checkpoint node requires), and mint the queued nodes after the author's response; or say what a refusal does, that the minted nodes' existence facts move to prune with the author's words as the reason and the author rules the prunes. If the sitting keeps minting-first, record decomposition-before-minting as an option on the answer fact.
- Rationale, last sentence: "mission command, already read on transience" is false. No reading node on mission command exists; the phrase occurs only in transience's rationale prose list, in stub-traditions, and here, and transience's own account records that list as what "readings in this batch forbids and the author ruled against on 2026-09-02". Suggested edit: "mission command, owed on transience as well", and give each of the four owed readings its relation (adopted, diverged) and the resolution it informed, as dialogue's and author-questions' rationales do for theirs.
- Facts, both facts: neither carries `against`. Dialogue's recommended text makes `against` a field of every fact, "the strongest case against that recommendation in one line and in the AI's own words", says "the case against is owed on every other fact that recommends", and the alignment page shows it on the recommended row; the frontier prints "against: none" for both facts here while delegation, frontier-consistency, recording and review-model carry theirs. Suggested: on the answer fact, the counter-argument below (the design multiplies the tokens a sitting spends per draft by the index each brief carries); on the authority fact, that the author's words on viable-options leave the right-sizing of models and effort to the AI's judgment, which is review-model's own recorded case for delegated and bears harder here, where the author named no model.
- Facts, '### answer' and option 'seams-and-split-review': the option's sentence bundles decisions this node's ruling cannot confer. "the survey of the frontier kept as a batch over the whole graph before the author rules, serialized by the pin its findings carry rather than by a lock" is frontier-consistency's `split-survey-from-per-draft` and dialogue's `survey-pin-in-review`, and "the review of each draft ... the moment its recommendation is recorded" is clean-context-review's `per-draft-and-survey`; both are in `depends`, yet the boldness prose counts "the survey's incremental judgment, and its pin at apply in place of the lock" among what rests on the AI on this fact. A confirmation here would read as ruling on three nodes. Suggested edit: the option's sentence states the five seams, the unit order, and the integration by the main thread, and says the review half "is the option per-draft-and-survey on clean-context-review, which this node depends on"; the boldness prose names only what this node adds.
- Answer, 'The kind of analysis.': "on the larger model, or on the most capable one where the draft touches a global-tier node or an ancestor" is the AI's rule, not named as the AI's in the facts prose, and its trigger reads `tier`, whose meaning is the tier node's question, at the maieutic stage after a kickback; review-model's account already applies the clause ("drafted the recommendation above on fable, since the draft amends an ancestor's recommended text and bears on a global-tier node, as decomposition's rule for the design unit's model requires"). Suggested: name the escalation as the AI's in the boldness prose, and phrase the trigger in terms the record has settled (a draft that amends an ancestor's recommended text, or a node whose ruling would settle others) or say it waits on tier.
- Disposition and Answer, 'The movement.': the author asked "Would we retain coverage of 'settling'/'untangling' analysis?" and nothing on the node answers it. The account says the periagogic object included "the alignment-order node for what settling and untangling are" and never says what was found; the fence names the survey only in the rationale ("the survey, which alone needs the whole, reads it without the accounts"). Suggested edit to 'The movement.': "the survey of the frontier, where settling and untangling are judged (the frontier's validations 7 to 15), is kept as one batch over the whole graph before the author rules, as clean-context-review's option per-draft-and-survey says", so that the author's three questions (does this replace /align-review, is settling covered, what happens to batching) are answered in the text they rule on and not only in the account.
- Facts, '### answer' boldness prose: "the author's words supply the per-draft step" overstates. The author's words ask that "the more complex recommendations" pass to a fable subagent; the fence has "the review of each draft runs the moment its recommendation is recorded", every draft. The departure is rightly decided on clean-context-review (`complex-drafts-only` is viable there) and need not be an option here, but this fact should say that the author's words supply a review at the point of writing and that every draft rather than the complex ones is the AI's, adopted from clean-context-review.
- Frontmatter, `probes`: the discharged probe's `reason` copies the author's words ("go, and bootrap authority granted") into the field, where author-questions' recommended text says the reason "names their words, which are under ## Disposition verbatim and dated ... and are never copied into the field". Suggested: the reason names the date and the section. Its `asks` is also a yes/no on a drafted reading, which that node calls "a draft in disguise"; moot now it is discharged, noted for the next probe this node raises.
- Rationale and Account, evidence: verified at graph commit 629e5bc4 that the record is 1,739,853 bytes of which 1,219,404 (70.1 percent) is account history and seven nodes stood at the review stage; verified on disk that tmp/review/frontier.brief.md is 838,923 bytes, survey.brief.md 519,400 and survey.pins.json 9,676; verified the review skill's text on reporting what a reader could not read. The Grant's "420,361 bytes" for the draft brief is not in the tree and is corroborated only by review-model's rationale table at ed725297; this node's own draft brief is 738,625 bytes today. Suggested: the account says the figure is at ed725297 and that the brief for this node has since grown to 738,625 bytes, which sharpens the counter-argument and the index lever the account names.
- Answer: the fence names no materialization. The alignment skill carries this rule (SKILL.md, "A sitting's work divides along five seams (decomposition)", the list of a sitting's units and the model per unit) and the Grant account says the skill was reconciled to it; review-model's fence says how its answer is materialized and under which shim, "the alignment skill that invokes them, the shim the growth node declares". Suggested: one sentence saying this answer is materialized by the alignment skill's list of a sitting's units under the shim growth declares, or a shim declared here if growth's "this node and its siblings" does not reach a node under delegation.
- Answer, 'The kind of analysis.' against validation 15 (merge against the index): the per-unit model assignments restate delegation's rule in its words ("the smaller model for mechanical tooling", "the larger model for design and judgment", "the smallest for lookups"), where frontier-consistency's fence refuses to restate another node's rule and review-model has just removed this node's restatement of the reviewer's model for the same reason. Suggested: state only what this node adds, which unit is which kind of work and the escalation in the finding above, and cite delegation for the model that follows the kind.

On the facts and what they recommend: Boldness moderate on the answer fact and low on the authority fact are consistent with their prose, except that two AI additions go unnamed (the design unit's escalation to the most capable model, and every draft rather than the complex ones), and the prose counts the survey's pin, another node's decision, as this node's. Every listed option has its subsection; the pins named on the four passed options resolve (2cbf3618 on the disposition ref); the depends targets exist; no review or survey state is recorded, which matches the review stage and the account's note that the survey is owed again. Of the evidence, all but the 420,361-byte figure verified against the tree or the cited commits, and the claim that mission command is already read on transience is false.

On the viability of the options: The answer fact's list is the viable set for this node's question: pre-review-under-the-batch is the right rival, and the four passed options carry reasons that hold, the reviewer-on-a-fixed-model one because the model is review-model's question. The literal reading of the author's words, review only the complex drafts, lives on clean-context-review as complex-drafts-only and does not need duplicating here. One candidate is missing: decomposition put to the author before the queued nodes are minted (finding 1), which the sitting can take as an edit to the fence or record as an option.

Strongest counter-argument (moderate): The author's own judge for this design is token and context efficiency, and the record's measurements cut against it on tokens. A per-draft review reads a brief whose larger part is the index of every standing answer: 420,361 bytes for one draft at ed725297 and 738,625 bytes for this node today, so a seven-question disposition reviewed draft by draft reads roughly three to five megabytes, plus the survey's 519,400, against the 838,923 bytes of the single batch the design replaces. The design trades a smaller context per reader for several times the tokens per sitting, and the fence states the cost only as "the fixed cost of a contract per unit" and says a per-draft review "reads a draft's neighbourhood" as if that were the smaller read. The disposition stands regardless because the author's other criterion, attention, and the timing argument (a finding at the point of writing lands while the draft is still open, not after the sitting has integrated around it) favour it, and because the index is the lever the account already names; but the fence should state the token cost it carries as a consequence.

The session's reply: All eleven findings verified against the record and taken, and the counter-argument taken into the rationale as a stated cost. The question seam now says what a refusal does, one ruling from the author's words on the existence fact of each queued node the refusal names, and the reading's missing candidate is recorded as the option decomposition-before-minting; mission command is owed on transience, not read there, and the sentence says so with the relation; both facts carry against; the option's sentence confers the seams and the order and cites the review's shape to the two nodes in depends; the escalation of the design unit is named as the AI's and its trigger phrased without tier's vocabulary; the movement seam answers the author's question on settling and untangling; the boldness prose says the author's words supply a review at the point of writing and every draft is the AI's; the probe's reason names the date and the section instead of copying the words; the 420,361-byte figure is placed at ed725297 and the brief's size today recorded; the materialization is named under growth's shim. On the eleventh: the per-unit assignments are what the rationale calls new, the assignment of each seam to a model, and stay; the fence now cites delegation for the rule the assignments apply rather than restating it.

### Amended after the reading, 2026-09-05

The reading forwarded the draft with eleven findings, all verified on this thread and taken, and the recommended text moved, so the node returns to the review stage. What changed: the question seam says what a refusal of a decomposition does, and the reading's missing candidate stands as the option `decomposition-before-minting`; the movement seam answers the author's question on settling and untangling; the design unit's escalation is named as the AI's and its trigger no longer borrows the tier node's vocabulary; the fence cites the delegation node for the rule its model assignments apply and names its materialization under the growth node's shim; both facts carry `against`; the option's sentence confers the seams and the order and cites the review's shape to the two nodes in `depends`; the boldness prose says the author's words supply a review at the point of writing and that every draft, rather than the complex ones, is the AI's; the probe's reason names the date and section of the author's words instead of copying them, and its `asks`, a yes or no on a drafted reading, is the shape the author-questions node calls a draft in disguise, noted for the next probe this node raises. Two corrections of record: the rationale said mission command was already read on transience, and no reading of it exists, it is owed there as here; and the 420,361-byte figure in the grant's evidence is the draft brief's size at implementation commit ed725297, corroborated by the review-model node's table, while this node's own draft brief measured 738,625 bytes on 2026-09-05, which sharpens the case against and the index lever the grant names.

### Amended by the review-cost node, 2026-09-05

The clean-context reading of `review-cost` found this node carrying standing text that its own reconciliation had falsified, and named the four loci. Three are amended here: the case against on the answer fact, which said a per-draft brief carries the index of every standing answer; the fence's closing line on that case; and the fence's evidence paragraph, which left open whether the index needs the whole answer or less and is now answered by `review-cost`. The byte figures of 2026-09-04 are kept and dated rather than restated, because they are the measurement the division was decided on and the record should show what it cost then. The fence changed, so this node's pin moves; it already stands at the review stage with a reading owed, and this changes what that reading reads and not whether one is owed.
