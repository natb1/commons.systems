---
question: Who is this repository for?
stage: maieutic
review:
  verdict: forward
  strength: weak
  date: 2026-09-03
  of: 976f4e45cbef5225580dbdc4431b57f47978e215
  against: "Pruning removes the only node whose question is who the repository is for, and purpose answers it in one subordinate clause that purpose-criteria now recommends leaving permanently unguarded. The requirements tradition the record adopts does state the intended audience inside the purpose section, so the prune is well grounded; the residue is that the audience question was where coverage's survey found the most divergence, and after the prune it can be re-asked only at a periagogic sitting the record has not scheduled."
  survey:
    date: 2026-09-05
    of: 976f4e45cbef5225580dbdc4431b57f47978e215
facts:
  - name: answer
    options:
      - name: standing
        source: ai
        ref: "2026-09-02"
    recommends: standing
    boldness: low
    stands: standing
  - name: authority
    options:
      - name: ratified
      - name: delegated
      - name: deferred
    recommends: ratified
    boldness: low
  - name: existence
    options:
      - name: keep
      - name: prune
    recommends: prune
    boldness: low
form: rule
under:
  - commons.systems/disposition-graph/purpose
---
## Disposition

The author, 2026-09-02:
> "Who is this repository for?" to the extent this needs to be recorded right now it is handled by the purpose node already. It can be pruned. We might fold some of this in from the incumbent graph later.

## Answer

Humans who want to manage the alignment of long-horizon AI agent workflows, or software factories, by something like spec-driven development, and who may arrive here by way of an AI tasked with that goal. Everything onboarding-facing is written for them: the README, the graph browser's opening pages, the repository's description and discovery tags.

## Rationale

The author's words, 2026-09-02. Purpose, scope, audience, and definitions are the first four things a requirements specification states, in that order, and the onboarding walk of this graph follows the same order (the reading under the purpose node). That the audience may arrive via an AI is why the onboarding pages must be legible to a model as well as to a person: plain statements, defined vocabulary, and stable ids.

## Facts

### existence

Prune: in the author's own words, the question is handled by the purpose node already and can be pruned. Purpose states its readers, as the requirements tradition states them inside its purpose section; the five-audience finding moves to coverage, which carries the author's words on the audience verbatim; and projection no longer names audience as a source of the description and tags. The coverage finding of 2026-09-03 verified that those words are carried verbatim on both audience and coverage, so one disposition is answered twice while audience still stands at the review stage recommending a ratified answer of its own, and proposes the double answer be resolved in coverage's favour. Its persistence is 'not recorded', naming purpose and coverage as the destinations. Raised on commons.systems/disposition-graph/scope.

## Account

The incumbent record addresses at least five audiences, and this answer names one. For the author to rule on with the scope node: practitioners forking the harness into their own repository (the README's runbook, the fork template, the separability audit); the author alone (the morning brief); prospective consulting clients (the public site's About page); the general public downloading a stand-alone plugin (the budget listing); and an unspecified future collaborator (the brand voice guide). Either the answer above covers them by saying the others are served through the primary audience's tooling, or the excluded ones are named and their surfaces become unsupported implementation at the swap.


### Sitting on purpose, 2026-09-03

**Prune the audience node**

The node is deleted. Purpose states its readers, as the requirements tradition states them inside its purpose section; the five-audience finding moves to coverage, which carries the author's words on the audience verbatim; the projection node no longer names audience as a source of the description and tags.

Facts: authority ratified; boldness low; persistence not recorded, the reader statement moving to purpose and the five-audience finding to coverage; the prune is a change to the record.

Rejected:
- Keep the node as an open question. — It would carry nothing purpose does not until the incumbent's audiences are folded in, and that folding is a scope question.

Proposed: the node is pruned.

Responses open: confirm as shown; confirm with edits; deny with feedback.

### Clean-context review, 2026-09-03

Read in clean context by a subagent given the node, its ancestry, and the author's words, and nothing of the sitting. Verdict: forward to the author's ruling.

Findings:

- Facts: 'persistence standing' for a node being deleted. Nothing standing remains on this node; the reader statement moves to purpose and the five-audience finding to scope. Suggested edit: persistence 'not recorded', naming the two destinations.

On the three facts: Authority ratified is right, since the author asked for the prune in their own words, and boldness low is right. Persistence should be 'not recorded' rather than 'standing'.

Strongest counter-argument (weak): Pruning removes the only node whose question is 'Who is this repository for?', and purpose answers it in one subordinate clause that no criterion guards. The requirements tradition the record adopts does state the intended audience inside the purpose section, so the prune is well grounded; but the audience question is the one the twelve-function survey found the most divergence on, and it will have to be re-asked at the scope sitting. Worth one line.

### Clean-context review, 2026-09-03

Read in clean context by a subagent given the node, its ancestry, and the author's words, and nothing of the sitting. Verdict: forward to the author's ruling.

Findings:

- Facts: 'persistence standing' for a node being deleted. Nothing standing remains on it. Unchanged since the previous review, which asked for 'not recorded' naming the two destinations.
- Proposal: 'the five-audience finding moves to scope'. Verified stale: the finding now sits on coverage, whose own text says 'The paragraph that addressed the audience node now addresses this question', and coverage carries the same author quote verbatim. The author would be confirming a prune whose stated destination is wrong. Suggested edit: name coverage.
- The node's '## Disposition' quote is carried verbatim on coverage as well. If audience is pruned the quote survives on coverage, which is the right outcome and should be said in the Proposal.

On the three facts: Frontmatter ratified/low is right, since the author asked for the prune in their own words. Persistence should be 'not recorded', naming purpose and coverage as the two destinations, rather than 'standing'.

Strongest counter-argument (weak): Pruning removes the only node whose question is 'Who is this repository for?', and purpose answers it in one subordinate clause that no criterion guards — and purpose-criteria now recommends leaving purpose unguarded, so it will stay that way. The requirements tradition the record adopts does state the intended audience inside the purpose section, so the prune is well grounded; but the audience question is the one coverage's survey found the most divergence on, and it will have to be re-asked at the coverage sitting.

The session's reply: Validated. Amended tonight: the destination of the five-audience finding is coverage, which carries the author's words on the audience verbatim, and the persistence is not recorded, naming purpose and coverage. On the counter-argument: the audience question returns at coverage's sitting, where the survey found the divergence, and purpose states the readers as the requirements tradition does. Stage review.

### Frontier finding, 2026-09-03

Kind: cross-reference.

Two prose references point at nodes that no longer say what is attributed to them. Audience's Proposal: 'the five-audience finding moves to scope' — verified stale, the finding is on coverage, whose own '### Sitting on purpose' section says 'The paragraph that addressed the audience node now addresses this question'. And stub-traditions enumerates the rationales carrying prose tradition lists as node, authority, instruments, namespaces, persistence, work-loop, evaluation, review, session-context, materialization, transience and validation-order; verified by grep that fourteen nodes carry such lists and that three of them — dialogue, recording and scope — are missing from the enumeration, while instruments carries its traditions without the marker phrase. Readings' draft rests its rule on that enumeration being the remedy.

Also named: commons.systems/disposition-graph/coverage, commons.systems/disposition-graph/stub-traditions, commons.systems/disposition-graph/readings.

Proposed: Audience's Proposal names coverage instead of scope. Stub-traditions' enumeration is regenerated from the record rather than maintained by hand — the same class of drift the scope node's order field was introduced to prevent — and until it is, dialogue, recording and scope are added. Readings' facts say that the remedy's enumeration is incomplete, so the author knows the size of what ratifying the rule puts on the frontier.

### Frontier finding, 2026-09-03

Kind: coverage.

Four author quotations are carried verbatim on more than one node, verified by exact match. 'Who is this repository for? ... It can be pruned' on audience and coverage. 'purpose -> [scope, self documentation (via the graph browser)] (equal) -> alignment -> harness context management -> reconciliation -> rsi' on scope, self-documentation and rsi. 'Is this correctly encoded as form: assumption vs form: disposition with unvalidated instrumentation? Is assumption a form at all?' on knowledge-store, capture and purpose. 'assumption deserves a target disposition, along with tradition and disposition ...' on node and form-vocabulary. Frontier-consistency's validation 14 says every disposition the author has given is 'answered by exactly one node: none unanswered, none answered twice', and admits no case for a quote carried as context on a child.

Also named: commons.systems/disposition-graph/coverage, commons.systems/disposition-graph/knowledge-store, commons.systems/disposition-graph/capture, commons.systems/disposition-graph/purpose, commons.systems/disposition-graph/node, commons.systems/disposition-graph/form-vocabulary, commons.systems/disposition-graph/scope, commons.systems/disposition-graph/self-documentation, commons.systems/disposition-graph/rsi.

Proposed: Most of these are legitimate context on a child that answers a part of the words, and the validation should say so: amend frontier-consistency's validation 14 to read that each part of a disposition is answered by exactly one node, and that a quotation may be carried on a child as the ground of the part it answers. Two are genuine double answers and should be resolved: audience and coverage both answer the audience question, which the audience prune resolves in coverage's favour; knowledge-store, capture and purpose all carry the form question, which forms answers, so all three should cite forms rather than each carry the quote.

### Re-encoding, 2026-09-03

Re-encoded on 2026-09-03 under the author's bootstrap grant on the dialogue node, against graph commit 6d21d356: the account section, formerly named the proposal, and the recommended text, formerly the draft, were renamed, and the dialogue state was written as data.
Alternatives pending, with their sources: `prune` (author, 2026-09-02); `fold-into-coverage` (review, 2026-09-03, from commons.systems/disposition-graph/scope).
The recommendation adopts `prune` (a prune) and is pinned to the standing text as it was at that commit.
Merge analysis of the author's words: 2026-09-02, own-question: The audience question is already handled by the purpose node and can be pruned, though some of the incumbent graph's material on it might be folded in later.
Moved to other nodes as alternatives: `regenerate-enumeration` on commons.systems/disposition-graph/stub-traditions; `incomplete-enumeration-in-facts` on commons.systems/disposition-graph/readings; `cite-forms` on commons.systems/disposition-graph/knowledge-store; `cite-forms` on commons.systems/disposition-graph/capture; `cite-forms` on commons.systems/disposition-graph/purpose.
The census unit's note: The mechanical rule would make `adopts` 'standing' because the node has an answer and no draft, but that would misreport the recommendation, which is that the node be deleted; I named the prune as an alternative, sourced to the author's own words of 2026-09-02, and made the recommendation adopt it. The keep-as-an-open-question option is recorded as rejected in the sitting and both counter-arguments conclude the prune is well grounded, so I left it out. The cross-reference and duplicate-quotation findings are carried verbatim on both audience and coverage; I recorded their elsewhere entries once, here, to avoid minting the same alternative twice. Their proposal to amend frontier-consistency's validation 14 is excluded: that node's answer already admits a quotation carried on a child.

### Alternatives merged, 2026-09-03

The alternatives raised on this node by more than one census cohort were merged at the re-encoding, and any alternative the standing answer already carries was removed: `prune` absorbs `fold-into-coverage`. The merge unit's note: Both entries are prunes of this node and `prune` is the one the recommendation adopts, so it is the survivor; the merged text keeps the coverage finding's verification and coverage as the second destination.

### Clean-context review, 2026-09-03

Read in clean context by a subagent given the batch at the review stage and the full graph as its context, and nothing of the sitting. Verdict: forward to the author's ruling.

Findings:

- Verified: the prune's destination is now coverage, not scope, and coverage carries the author's words on the audience verbatim, so the '## Disposition' quotation survives the prune. The earlier stale cross-reference is resolved.
- Persistence is 'not recorded', naming purpose and coverage as the destinations — which is right for a node being deleted and is the only node in the batch whose persistence is anything but standing. Nothing else in the record depends on this node: projection's fence now names purpose alone as the source of the README, description and tags.
- The prune leaves the record with no node whose question is 'Who is this repository for?', and coverage — where the question goes — stands at the periagogic stage with two AI-drafted alternatives and no author account. The prune is the author's own word, so this is an ordering note rather than an objection: after the prune the audience question is answerable only through a periagogic sitting on coverage.

On the three facts: The frontmatter recommendation (adopts prune, ratified, low) is right: the author asked for the prune in their own words, quoted on the node with a date, so this is the one node in the batch whose ratified stamp already has its ruling in the record. Persistence 'not recorded' with two named destinations is correct for a deletion and follows from the node's shape.

Strongest counter-argument (weak): Pruning removes the only node whose question is who the repository is for, and purpose answers it in one subordinate clause that purpose-criteria now recommends leaving permanently unguarded. The requirements tradition the record adopts does state the intended audience inside the purpose section, so the prune is well grounded; the residue is that the audience question was where coverage's survey found the most divergence, and after the prune it can be re-asked only at a periagogic sitting the record has not scheduled.

The session's reply: Forward accepted. The prune is the author's own word; the ordering note that the audience question returns at coverage's periagogic sitting is accepted.

### Frontier survey, 2026-09-05

Read in clean context by a subagent given the whole graph and nothing of the sitting, judging this node's recommendation against every other node. The survey gives no verdict.

Findings:

- The answer duplicates `commons.systems/disposition-graph/purpose`'s third sentence: purpose's answer reads "Its intended readers are humans who want that, and who may arrive here by way of an AI tasked with the same goal", and this node's answer restates it. The `existence` fact recommends `prune` and names no survivor for the sentence, so the prune is a fold whose destination is unrecorded and, if taken as written, would delete text that has to survive somewhere. The independence test of `probe-or-node` reaches this node: its single answer option repeats the parent's sentence, and it would be pruned the moment purpose's recommendation moved. Recorded as the `decomposition` finding.
- The answer fact carries exactly one option, `standing`. `commons.systems/disposition-graph/viable-options` says a fact carries "a list of viable options, possibly one", so this is well formed, but a node recommended for prune whose answer fact was never given an alternative is a node no dialectic has touched.

Strongest counter-argument (moderate): The node asks "Who is this repository for?" and answers it with a sentence `purpose` already carries, and its own existence fact recommends prune. The strongest case against the answer standing is therefore that the answer should not be here at all: keeping a node whose whole content is duplicated one level up is the update anomaly the `codd-update-anomaly` reading names, and the record has already had to correct one such duplicate this week. What survives the prune is the enumeration of onboarding surfaces — README, browser opening pages, description, discovery tags — and that belongs to `projection` or `self-documentation`, not to a node about audience.

### Frontier finding, 2026-09-05

Kind: decomposition.

The independence test of `commons.systems/disposition-graph/probe-or-node`, run across the judged set and reported under this kind as `frontier-consistency`'s sixteenth validation prescribes, finds two nodes and no more; readings are exempt by construction. `commons.systems/disposition-graph/hexis` asks "In the purpose answer, is the hexis claim stated first and the knowledge store as its gloss?": its only possible answer is a reading of `purpose`'s, its answer options `hexis-first` and `knowledge-store-first` are the two orderings of one of purpose's sentences, `knowledge-store-first` already stands as an option on purpose's own answer fact sourced to this node, and it would be pruned the moment purpose's recommendation moved. `commons.systems/disposition-graph/audience` asks "Who is this repository for?": purpose's answer already carries "Its intended readers are humans who want that, and who may arrive here by way of an AI tasked with the same goal", this node's answer restates it, its answer fact carries the single option `standing`, and it too would fall with a move on purpose. Both nodes already recommend `prune` on their existence facts, so the test confirms a judgment the record has reached and supplies the reason it was missing. `commons.systems/disposition-graph/rejected`'s answer states the principle: "An option is not a page: an answer that was not taken has no standing and earns no node of its own." A third node was tested and survives: `commons.systems/disposition-graph/second-stop`'s three answer options are all edits to `model`, which has the same shape, but its question — what a newcomer reads after purpose — is not a reading of `model`'s question, and its existence fact recommends `keep`, so it is reported in its own node entry and not here. `commons.systems/disposition-graph/which-facts-are-listed` was tested and survives on its own account, which reaches `dialogue`'s reserved-four rule and not only the parent's rendering.

Also named: commons.systems/disposition-graph/hexis, commons.systems/disposition-graph/purpose, commons.systems/disposition-graph/rejected, commons.systems/disposition-graph/second-stop.

Proposed: Record the independence test as the reason on each existence fact's `prune` option, on `hexis` and on `audience`, and let the author rule the prune at each node's own row, which is what `probe-or-node`'s answer prescribes for a node already standing. Before `audience` is pruned, its surviving content is named: the sentence itself is already in `purpose`, and the enumeration of onboarding surfaces — README, browser opening pages, repository description, discovery tags — belongs to `projection` or `self-documentation` and moves there rather than being deleted with the node. `hexis` needs no survivor: `purpose` already carries its content as the option `knowledge-store-first`.
