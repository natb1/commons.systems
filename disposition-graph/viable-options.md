---
question: Is authority a projection of the state of a node's viable options?
stage: review
facts:
  - name: answer
    options:
      - name: authority-derived
        source: author
        ref: "2026-09-04"
      - name: grant-from-a-ruling
        source: ai
        ref: "2026-09-04"
      - name: grant-from-a-recommendation
        source: ai
        ref: "2026-09-04"
      - name: passed-over-options-stay
        source: commons.systems/disposition-graph/prose-and-structure
        ref: "2026-09-04"
      - name: viable-not-chosen-as-it-stands
        source: review
        ref: "2026-09-04"
    recommends: grant-from-a-ruling
    boldness: moderate
    stands: grant-from-a-ruling
  - name: authority
    options:
      - name: ratified
      - name: delegated
    recommends: ratified
    boldness: moderate
depends:
  - commons.systems/disposition-graph/dialogue#aspects-are-nodes
form: rule
defines:
  - option
  - viable
  - grant
under:
  - commons.systems/disposition-graph/authority
  - commons.systems/disposition-graph/dialogue
---
## Disposition

The author, 2026-09-04:

> Consider this alternative for unanswered node encoding from a greenfield perspective. Is "unanswered" just an authority - as in no authority granted for reconciliation. Or, more precicely, explicit bootstrap authority required for reconciliation - in this way bootstrap authority is not a shim, but a persistent disposition about reconciliation authority. Each fact on a node, regardless of authority, has viable options list (possibly length 1) with a) AI recommendation/why b) support or divergence from tradition for each option and c) (if answered) the confirmed choice and why. This would also collapse "proposals". Proposals are just nodes with ratified authority and a fact with confirmed choice that deviates from AI recommendation. If recommendation timestamp is after confirmation timestamp for a ratified node then (facts don't change but) the node is projected onto the alignment frontier for re-confirmation. For each fact, the confirmed choice, the AI recommendation and support divergence from tradition as well as any non-chosen option which is categorized as "viable" by the AI - these are all is persisted after confirmation to mitigate regression. This gives a clear mechanical encoding for ADR style "alternatives considered" documentation and more obvious presentation in the graph browser - what's the confirmed choice and (on drilling down) why that choice was made, what the AI said and why, what tradition says.
>
> In this model "delegated" and "deferred" authority mean reconciliation authority is granted for AI recommendation without requiring confirmation. Delegated means the node is removed from the alignment frontier and deferred means it remains.
>
> This comes close to re-framing authority as a projection of the state of the viable options list. Evaluate this.
>
> Under this model the prior statement that "reconciliation never edits the graph" is incomplete. Whatever persistent state reconciliation requires for reconciliation operations (if any) is stored outside the graph - true. But, AI has the authority record untracked but viable alternative options and to change its recommendation during either reconciliation or rsi. If the recommendation is on ratified node then that triggers the alignment frontier projection described above. Subject to attenuation/breakout controls - if the change of recommendation is on delegated or deffered node then it changes the shape of the reconciliation frontier.
>
> Progress this dialogue through meiutic and stop before adversarial review.

The author, 2026-09-04, after the maieutic movement, announcing a grant to be given after compaction:

> prepare for compaction. after compaction you will be granted bootstrap authority to reconcile anything materialized from nodes in this sitting. that includes but is not limited to the encoding, migrating all nodes to the new encoding, the alignment/adversarial review skills, the alignment/browser artifacts and graph tooling.

The author, 2026-09-04, after compaction, giving the grant announced above:

> bootstrap authority granted - delegate to subagents with righ-sized models and effort level (opus, sonnet) when it would result in token efficiency

## Answer

Yes. A node's authority is read off the rulings recorded on its facts, and no stamp is written beside them. Every decision on a node is a fact with a list of viable options, possibly one: the answer, whose options are the candidate answers to the node's question, and the reserved three the dialogue node names, authority, existence, and persistence; any other decision the author would rule on separately is a question and a node under this one. An option carries its name, its source and reference, in prose what it would answer, and in full the text where it would stand as the answer and differs from what stands; the readings that bear on it, each saying whether the tradition supports or contradicts it; and, on the one option of each fact the AI recommends, why and with what boldness. A ruling is the author's act on the option they chose, recorded on it: the response, the date, and a pin of the recommendation it answered. Only the author rules, on the alignment page or in prose, and the AI writes no ruling and no class for itself.

The class follows from the rulings. Ratified: the answer fact carries a ruling, and the confirmed choice acts. Delegated: the authority fact carries the ruling delegated, the recommendation acts, the delegation covers the class of decision it names below the node, and the author does not want to be asked again. Deferred: the authority fact carries the ruling deferred, the recommendation acts, and the node stays on the alignment frontier until the author returns to it. Unanswered: no fact carries a ruling, nothing on the node acts, and reconciling anything under it takes an explicit grant from the author for that reconciliation, given in their words and never assumed; that is a standing rule of this record, not a shim, and it does not expire. A ruling on an ancestor grants the decisions its scope covers to the nodes beneath it, and authority only narrows on the way down. A class the AI wrote for itself is not a grant: the deferred stamps the bootstrap wrote are unanswered, as the author classified them on 2026-09-03, until a ruling grants them.

The facts persist after the ruling: the confirmed choice with the author's reason, the recommendation with its reason, the readings on each option, and every option the AI holds viable, so that a later session meets what was considered and why before proposing it again. Viable means not dominated on the record's criteria, in the AI's judgment, which is what the evaluation node's solution frontier means for one decision; an option the AI no longer holds viable leaves the list, and the option that displaced it says why. What dies at the recording is the dialogue: the stage, the review, the dependencies, and the account; the author's words stay as the quotes node decides. A rejected alternative is a viable option not chosen. The projections show a node's confirmed choice first and, beneath it, the recommendation, the other options, and what each tradition says.

The AI may add a viable option to any fact and may move a fact's recommendation, in alignment, in reconciliation, and in the loop on itself, and may not rule, edit a ruling or the author's words, or recommend beyond the scope a delegation confers. What a move does is read from the class. On a ratified node the confirmed choice keeps its full authority and the node returns to the alignment frontier for re-confirmation, at the movement the recording node's classification calls for, the review where only the recommendation moved; that state is what proposal names here: a ratified node whose recommendation has moved from its confirmed choice, wherever the move came from, the origin being the option's source. On a deferred node the recommendation acts, the reconciliation frontier changes with it, and the node was on the alignment frontier already. On a delegated node the recommendation acts within the delegation's scope and the node stays off the alignment frontier, since that is what the author asked for; a move that would leave the scope is not the AI's to recommend, is recorded as an option, and returns the node to the author with its class intact. On an unanswered node nothing acts and the move is dialogue. Moved is a matter of content and not of clock: the ruling pins the recommendation it answered, and the frontier flags the node when the recommended option or its reason has changed since. The frontiers are projections of the same state, and the record stores neither: the alignment frontier is every node with no ruling, every deferred node, and every proposal; the reconciliation frontier is every node whose acting option's instrument fails.

## Rationale

The author's disposition of 2026-09-04, quoted above: "Is 'unanswered' just an authority - as in no authority granted for reconciliation ... explicit bootstrap authority required for reconciliation - in this way bootstrap authority is not a shim, but a persistent disposition about reconciliation authority"; "Each fact on a node, regardless of authority, has viable options list"; "Proposals are just nodes with ratified authority and a fact with confirmed choice that deviates from AI recommendation"; "'delegated' and 'deferred' authority mean reconciliation authority is granted for AI recommendation without requiring confirmation. Delegated means the node is removed from the alignment frontier and deferred means it remains"; "the prior statement that 'reconciliation never edits the graph' is incomplete". The words leave one thing open that the answer decides: who grants. Every authority this record knows comes from the author's ruling, as the authority node says, "Ratification happens only through that dialogue ... no command does", so a class must trace to a ruling, on the node or on an ancestor whose scope covers it; the reading under which a reviewed recommendation acts as deferred by default is rejected because it would leave no node the AI could ever hold unanswered, which is the state the author reclassified the whole record into on 2026-09-03.

Why a projection and not a stamp: the record already stores the ruling on a fact with its response, choice, date, and pin, so a stamp beside it is a copy, and a copy drifts, which is the reason the unanswered node gave for deriving the status; the same reason derives the class. Why the options persist: the author's reason, regression, and the tradition the encoding already adopts, which keeps every considered option beside the decision; what persists is judgment that re-derivation cannot reconstruct, the author's rulings, the AI's recommendations and viability calls, and the readings, while the account, which re-running the review reconstructs, still dies, so the minimal-state principle on the dialogue node is kept by its own test. Why the line on reconciliation falls where it does: the record is the sole carrier, and a divergence found in reconciliation and held on a derived frontier until an alignment session transcribes it is a decision outside the record; as an option it is in the record at once, changes nothing the author confirmed, and returns a ratified node to the author by the same projection that returns any proposal; operational state stays outside the graph, as the author said. Why a delegated node stays off the alignment frontier on a move within scope: delegated means the author does not want to be asked again, and a rule that asks them anyway on every change, as the evaluation node's did, delegates nothing; the bound that rule wanted is the scope, and a move beyond it does return the node. Why the pin is content: a clock cannot tell a recommendation re-affirmed from one changed, and the record pins by hash everywhere else.

Rejected: a stored stamp beside the rulings, since it is a copy and drifts; deferred conferred by the AI on itself, the second reading of the author's words, since it empties unanswered; a fourth response, defer, on the page, since deferred is a choice on the authority fact and the three responses stand; a timestamp as the pin, since content is what changes; the report-and-wait path for a reconciliation divergence, since it holds a decision outside the record; a delegated node returned to the author on every moved recommendation, since it un-delegates; re-confirmation opening at the periagogic movement in every case, since the classification the recording node already makes says where a dialogue resumes and only the recommendation moved; options folded into the rationale as prose at the recording, since the author found the prose ad hoc and the structure is what regression needs; keeping every option ever recorded whether or not viable, since the list would grow without a reason and version control holds what left. Traditions, recorded as readings under this node or owed under the stub-traditions ruling: architecture decision records in the MADR form, adopted for the considered options kept beside the decision, the divergence narrowing to the stage stored and the status derived; IBIS, adopted for positions with the arguments for and against each; event sourcing and the derived view, adopted for the class as a projection of recorded rulings, with the warning that every reader must derive it the same way; the spec and status of level-triggered reconciliation, adopted for the two frontiers as the difference between the AI's recommendation and what stands; attenuation in object-capability systems, adopted for what reconciliation may write; the recorded dissent and the motion to reconsider, adopted for the proposal state, a decision in force with the contrary recommendation on the record; the Pareto frontier, adopted for what viable means; and approval-directed agents, adopted for deferred as action under a review owed.

## Facts

### answer

#### authority-derived

The model as the author's words state it, put on the table by them on
2026-09-04: every fact on a node carries a list of viable options, each with
the AI's recommendation and why, the traditions for and against it, and the
confirmed choice and why where there is one; the class is read off that state
rather than written as a stamp; a proposal is a ratified node whose
recommendation has moved from its confirmed choice; delegated and deferred
both let the recommendation act and differ in whether the node stays on the
alignment frontier; the options persist after confirmation; and reconciliation
and rsi may add options and move recommendations. The words leave open who
grants a class, whether "after" is a matter of clock or content, and what
"attenuation/breakout controls" are. The two alternatives below are the AI's
two readings of the first of those; a ruling for this one as stated leaves it
open.

#### grant-from-a-ruling

The model with the grant traced to the author's ruling. A class follows from a
ruling recorded on the node's facts, on the node itself or on an ancestor whose
scope covers the decision: ratified where the answer fact carries a ruling,
delegated or deferred where the authority fact does, and unanswered where none
does, in which state nothing acts and reconciliation takes an explicit grant.
Deferred is therefore a class the author confers, a third choice on the
authority fact, and the deferred stamps the bootstrap wrote for itself remain
unanswered as the author classified them. Adopted by the recommendation and set
out in the fence, with the pin by content, the delegated node held off the
alignment frontier on a move within its scope, and re-confirmation resuming at
the movement the recording node's classification calls for.

#### grant-from-a-recommendation

The model with the grant read off the recommendation. A reviewed
recommendation acts as deferred by default, the author's review owed on it,
until a ruling ratifies or delegates it; unanswered is the state before a
recommendation has been reviewed. It is the reading under which the record's
forty-six deferred stamps would act, and under which the clean-context
review's repeated counter-argument, that deferred answers act while the
record calls them unanswered, is answered by letting them. Against it: the AI
would then confer authority on itself by writing a recommendation and passing
its own review, and no node the AI had drafted could ever be held unanswered,
which is the state the author reclassified the whole record into on
2026-09-03; the authority node holds that no command confers a class, and a
review that stamps is a command.

#### passed-over-options-stay

Viability is a judgment shown on an option and not the condition of its listing. Every candidate the AI considered and can name stays on the fact it answers with its status, recommended, viable, or passed over, the last carrying the reason it was passed over as `status: passed` with a required `reason`, and none leaves the list silently. The author may rule for a passed-over option, since only the author rules and rules on any option the fact lists, and the recording then clears the status. Against the rationale's rejection of keeping every option whether or not viable, that the list would grow without a reason and version control holds what left: the reason is the regression the author gave for persisting options, which bears at least as much on a candidate the AI rejected as dominated, since a later session is as likely to re-propose it, and version control is not a projection, so a later session meets none of what left; the list grows to the size the rationales already carry in prose. Raised on commons.systems/disposition-graph/prose-and-structure, whose clean-context review of 2026-09-04 found that the membership of an option list is this node's question and not that one's.

#### viable-not-chosen-as-it-stands

The standing rule kept and read as the author used the word: an option is a candidate the AI categorized as worth recording, and the prose rejections migrate as options under `rejected`'s rule that a rejected alternative is a viable option not chosen, with no status minted and no key added; an option the AI no longer holds worth the author's attention still leaves the list, the option that displaced it saying why. It keeps the author's scoping on this node and both nodes' standing text, at the cost the clean-context review of prose-and-structure named: the AI still decides which candidates reach the structure, and nothing on a row says the AI holds it dominated. Raised by that review on 2026-09-04 as the viable option the draft was missing.
### authority

Ratified. The answer redefines what authority is in this record and opens a
write path from reconciliation into the graph, which is the capture-shaped
case the alignment skill escalates toward ratified; a delegation of this
decision would be a delegation of the definition of delegation.

## Account

### Minted from the author's disposition, 2026-09-04

The words above are one model, and the model is a new answer to several
questions the record already asks: `authority` (who may change an answer, and
what the classes mean), `unanswered` (when a disposition is answered, and what
the alignment frontier holds), `dialogue` (what an unanswered node carries),
`recording` (what the recording removes), `rejected` (how rejected alternatives
are recorded), `readings` (how a tradition's support is recorded),
`work-loop` and `delegation` (whether reconciliation writes the graph),
`evaluation` (what an overrule does), and `rsi`. What binds those answers
together is one premise that no node asks: whether a node's authority is a
stamp written on it or a state read off its options. A premise the author
would rule on separately, and whose ruling makes the rest decidable, is a
question, and a question is a node (`dialogue`, `aspects-are-nodes`). It is
placed under `authority`, whose answer it would rewrite, and under `dialogue`,
whose encoding it would replace. The consequences for the other nodes are
recorded on them as alternatives at the maieutic checkpoint, each naming this
node in `depends`, so that one ruling here settles them and the ruling order
counts it.

The periagogic object is those nodes' pages, read at `origin/disposition`
before anything is drafted, and the implementation their criteria point to:
the reader's schema in `packages/disposition/read.mjs` (`FRONTMATTER_KEYS`,
`FACT_NAMES`, `CONFERRABLE_CLASSES`, `deriveStatus`,
`deriveStandingHash`), the projector's frontier and alignment page in
`packages/disposition/project.mjs`, the two skills under `.claude/skills/`,
and the rule projections under `.claude/rules/`.

The author has directed the dialogue to run through the maieutic movement and
stop before the clean-context review. The periagogic probes are therefore put
in this account, each cited to the record by locus, for the author to answer
on the page or in prose; the AI's evaluation is held out of that section and
enters only in the maieutic one that follows it. The named deviation of the
periagogic conduct, the AI's account put before the author's, is the thing to
watch in a sitting run this way, and the separation of the two sections is how
this one watches it.

### The periagogic movement, 2026-09-04

The conduct: the record at `origin/disposition` is the fixed object, and the
author is turned back to it before the AI's account enters. Each probe below
quotes the record by locus and says what the author's new words would do to
it; none carries a verdict. The author directed the dialogue to run through
the maieutic movement, so the probes are put here together rather than one
per turn, for the author to answer on the page or in prose; the AI's
evaluation is held for the next section. Where a probe turns the author back
to their own ruling of an earlier day, it is because the new words would
change it, and the periagogic object of a disposition sitting is exactly the
reasons a thing was recorded, read before it is undone.

**1. What a deferred answer does today, and who writes it.** `authority`,
Answer: "Deferred means the AI decided within the author's rules and owes the
author a review; until the author rules, a deferred answer is unanswered, as
the unanswered node says." `un-aligned-children`, Answer: "What an unanswered
disposition lacks is authority, not standing. It carries none for
reconciliation, and work may not be grounded in it, unless the author grants
bootstrap authority explicitly." The author, 2026-09-03, on `unanswered`:
"Classify all dispositions as unanswered (the actual status)." The reader
implements it: `deriveStatus` in `packages/disposition/derive.mjs` returns
`answered` only for a ratified or delegated stamp, and `CONFERRABLE_CLASSES`
in `read.mjs` excludes deferred with the comment that it "is what the AI
writes without the author and is never what a confirmation confers". The
record today holds forty-six deferred stamps, every one written by the AI
before the dialogue existed, and under these rules not one of them grounds
work. The new words: "'delegated' and 'deferred' authority mean reconciliation
authority is granted for AI recommendation without requiring confirmation."
The probe: who grants it. If the AI writes deferred for itself, as it wrote
those forty-six, then every recommendation acts the moment it is written and
"unanswered" names nothing the AI would ever leave a node in; if the author
grants it, deferred becomes a class the author confers, which today it is not,
and the forty-six stay unanswered as the author classified them. The record
cannot tell from the words which is meant, and the whole of what "unanswered"
means turns on it.

**2. The expiry the author set on the grant.** The author, 2026-09-03, on
`authority`: "also record the concept of bootstrap authority as an alignment
shim - unanswered nodes may be reconciled by alignment with explicit bootstrap
authority, but that authority expires on bootstrap exit." The shim declared
there liquidates "at the swap of the implementation ref with the main branch,
after which the grant expires and an unanswered node is reconciled only
through the dialectic". The new words: "explicit bootstrap authority required
for reconciliation - in this way bootstrap authority is not a shim, but a
persistent disposition about reconciliation authority." The record already
carries the tension the new words resolve, as `bootstrap-authority-as-class`
on `authority` and `two-kinds-of-shim` on `evaluation`: a shim is applied by
default and this one does nothing until invoked. The probe: whether the
expiry goes with the shim. As a persistent disposition the rule reads that an
unanswered node is reconciled only on an explicit grant, at any time; the
earlier words say the grant itself is gone at bootstrap exit, after which an
unanswered node is reconciled only by being answered. Both cannot stand.

**3. The author's own line on reconciliation and the graph.** The author,
2026-09-03, on `work-loop`: "reconsiliation does not edit the graph. That is
alignment only." and "Since reconciliation does not edit the graph it may need
to persist some other metadata to track reconciliation state." The
clean-context review of that day kicked the node back because its answer still
let a reconciliation session write the graph, and the answer was amended to
what it now says: "a reconciliation session writes the implementation ref and
never the graph. A divergence that needs the author is reported by the session
that found it, with its recommendation, and stays on the frontier, derived and
never stored, until the alignment dialogue records it." `delegation` carries
the same rule with the citation: "A reconciliation session is bound the same
way toward the record: it never writes the graph, which is alignment's alone,
as the author ruled on 2026-09-03 on the work-loop node." The reconciliation
skill states it at line 27. The new words: "the prior statement that
'reconciliation never edits the graph' is incomplete." The probe: where the
line now falls. The new words draw it between operational state, which stays
outside the graph, and decision state, an option found viable and a
recommendation moved, which goes in. What the earlier ruling protected was
that a divergence needs the author before it changes the record; under the new
words a divergence changes the record as an option, and what it may not change
is anything the author confirmed. Whether that is the line, and whether the
write belongs to the reconciliation session alone and never to its subagents,
which `delegation` forbids by name, is the author's to say.

**4. The retraction, read against the re-confirmation rule.** The author,
2026-09-03, on `unanswered`: "The flipping of node I suggested from answered
to unanswered pending confirmation feels like a hack." And the same day: "When
an alternative is pending on ANY node with authority ... the previously
confirmed answer keeps its full authority until an alternative is confirmed."
The new words: "If recommendation timestamp is after confirmation timestamp
for a ratified node then (facts don't change but) the node is projected onto
the alignment frontier for re-confirmation." The probe confirms rather than
questions: the parenthesis says the node keeps its class and its confirmed
choice, and what changes is which frontier lists it. Read that way the new
rule is the retraction kept, with the frontier membership that the record
today derives from the stamp derived instead from two states of one node.

**5. The word "proposal".** The author, 2026-09-03, on `authority`: "A
conflicting answer that arises outside of alignment is a proposal. eg. via
some evidence/signal/instrument/criteria or because a conflict is identified
outside of alignment. The term must not be overloaded - it is technical
vocabulary." And on `dialogue`: "A proposal from ouside alignment opens a
dialogue on its node, yes." The answer on `authority` gives the term two
properties: its origin, outside alignment, and what it opens, the node's
dialogue at the periagogic stage. The new words: "This would also collapse
'proposals'. Proposals are just nodes with ratified authority and a fact with
confirmed choice that deviates from AI recommendation." The probe: the new
words define the term by a state of the node and not by where the conflicting
answer came from, so the origin becomes the source recorded on the option, as
it is on an alternative today; and the new words say "re-confirmation" where
the earlier ruling said the dialogue opens at its first movement. Whether the
author means the ruling alone, with the review before it, or the dialogue from
its periagogic movement, is the difference between a proposal the author rules
on and one the author is turned back to the record for.

**6. Alternatives and facts, one structure or two.** `dialogue`'s
recommended answer keeps two: `alternatives`, "the candidate answers to this
node's own question", and `facts`, "the decisions about the answer that are
not questions under it", of which "three names are reserved and no others are
minted without a ruling here". The author, 2026-09-03: "the revised record is
to carry a decision per aspect. each aspect of a disposition may have choices
that require confirmation. each aspect has a recommendation with confidence."
The sitting that answered those words rejected aspects inside the node and
adopted `aspects-are-nodes`: "A textual decision the author wants to rule on
separately is a question, and a question is a node." The new words: "Each fact
on a node, regardless of authority, has viable options list (possibly length
1)." The probe: whether the answer is itself a fact, its options the candidate
answers the record now lists as alternatives, so that the two structures
become one; and whether `aspects-are-nodes` stands with it, so that the facts
remain the answer and the reserved three and a further decision is still a
child node. Nothing in the new words says a fourth fact is minted, and nothing
says it is not.

**7. What the recording removes.** `recording`, recommended answer, third
step: "the dialogue fields are removed, the facts and their rulings among
them, the Disposition section excepted as the quotes ruling decides."
`dialogue`, Answer: "Confirmed dialogue state folds into the node at the
recording, into the answer, into the rationale as a rejected alternative with
the ruling quoted, or into nothing; unconfirmed, it survives only in version
control." The author, 2026-09-03, on `dialogue`: "confirmed dialogue state is
rendered to the questions and otherwise only exists in git history." The new
words: "the confirmed choice, the AI recommendation and support divergence
from tradition as well as any non-chosen option which is categorized as
'viable' by the AI - these are all is persisted after confirmation to mitigate
regression." The probe: which parts persist and which die. The new words name
the options with their recommendation, their tradition, and the confirmed
choice; they do not name the stage, the review's verdict, the account, or the
author's words, which `quotes` holds separately. The reason the earlier words
gave for folding everything was that a stored copy drifts from the answer;
the new words give a reason for keeping the options, regression, and no reason
for keeping the rest. And `rejected`'s question, "How are rejected
alternatives recorded?", whose sitting favoured prose in the rationale once
the projector was found to read a heading, is answered by the new words
without being named: a rejected alternative is a non-chosen viable option, and
the author's own objection there, that prose under the rationale "seems too
ad-hoc", is what the structure answers.

**8. A reading's relation, to the answer or to an option.** `readings`,
Answer: "A reading answers the question what a tradition says about the answer
above it: its source is the primary text and locus, its relation is adopted,
diverged, or chosen over." The author, 2026-09-02: "A disposition in the
greenfield graph may reference tradition as either supporting by or diverging
from disposition. That reference (supporting or diverging) may be ratified ...
delegated ... or deferred." Thirteen readings stand in the record, twelve
adopted, one diverged, none chosen over. The new words: "(b) support or
divergence from tradition for each option." The probe: the reading stays a
node with its own stamp, which the author ruled; its relation today is to the
answer, and under the new words a tradition bears on each option, so that
"chosen over" is a tradition adopted on an option that was not chosen. Whether
the relation moves from the node to the option, with the reading unchanged, is
the question the new words put to `readings`.

**9. What a moved recommendation does on a delegated node.** `evaluation`,
Answer: "Delegated and deferred answers need no interview: the AI may overrule
them on its best judgment, and every such overrule enters the author's review,
a delegated answer overruled becoming deferred and a deferred answer staying
deferred." `authority`, Rationale: "Attenuation: authority only narrows as it
is handed down, never widens, so a breakout would have to be written up the
tree, and nothing writes up." The new words: "Delegated means the node is
removed from the alignment frontier", and "Subject to attenuation/breakout
controls - if the change of recommendation is on delegated or deffered node
then it changes the shape of the reconciliation frontier." The probe: under
`evaluation` a changed recommendation on a delegated node brings it back to
the author as deferred; under the new words it stays off the alignment
frontier and re-shapes the reconciliation frontier instead, within controls
the words name and do not describe. The record's attenuation is that a
delegation covers a class of decision and a change outside that class is not
the AI's to make; whether the controls the author means are that ceiling, so
that a recommendation moves freely inside the delegation and a move that would
leave it returns the node to the author, is what the words leave open.

**10. The pin, by clock or by content.** The author, 2026-09-03, on
`dialogue`: "This probably means we need some sort of pinning of the
recommendation as well (if that's not already recorded)." The record pins by
content: `recommendation.amends` and `review.of` are hashes of the text read,
and a fact's `ruling.of` "the hash of the choice text ruled, so that a later
amendment to the node shows the ruling as given against text that has moved".
The new words: "If recommendation timestamp is after confirmation timestamp".
The probe: whether the timestamp is the pin or a way of saying it. A clock
cannot tell a recommendation re-affirmed after the ruling from one that
changed, and the author delegated the encoding's details on 2026-09-03; the
question is whether "after" means later in time or different in content.

**11. The loop on itself.** `rsi` carries the author's one word and three
alternatives, none recommended, among them `rsi-as-loop-on-itself`, "the work
loop applied to the work loop, its instruments read against itself", and
`bound-by-ratification`, "every change to a node the loop uses to change
itself requires the author's ratification." The new words: "AI has the
authority record untracked but viable alternative options and to change its
recommendation during either reconciliation or rsi." The probe: the words give
rsi the same authority over the record as reconciliation, which reads rsi as
the loop on itself; and under the re-confirmation rule a recommendation moved
on a ratified loop node acts on nothing until the author confirms it, which is
the bound that alternative asks for, while on a delegated loop node it acts.
Whether the author means those loop nodes to be delegated at all is the
question that bound puts.

The classification the `dialogue` node asks a periagogic movement to make,
whether the disposition is a new question or a new answer to one the record
already asks, is given in the minting section above and is not repeated: it
is a new answer to eleven questions bound by one premise no node asks, and the
premise is this node.

### The maieutic movement, 2026-09-04

The conduct: the answer lives in the author, unrecorded, and the AI draws it
out with visible, refusable drafts. What the probes leave is one model whose
core the author's words fix and whose edges they leave open, and the
movement's work is to say which is which and to draft the edges so the author
can refuse them one at a time.

The core, fixed by the words: every decision is a fact with viable options;
the class is read off the state and not stamped; a proposal is a ratified node
whose recommendation has moved; delegated and deferred both let the
recommendation act and differ in frontier membership; the options persist
after confirmation; reconciliation and rsi may add options and move
recommendations, within controls. The edges, open in the words: who grants a
class (probe 1); whether the grant for an unanswered node expires (probe 2);
where the line falls between what reconciliation writes and what it may not
(probe 3); what re-confirmation re-opens (probe 5); whether the answer is a
fact and `aspects-are-nodes` stands (probe 6); which parts of the dialogue
die (probe 7); whether a reading's relation moves to the option (probe 8);
what happens on a delegated node (probe 9); the pin (probe 10); and rsi
(probe 11). Each edge is decided in the fence, and each decision is listed in
the rationale as a rejected line so that the author can strike it without
striking the core.

### The three classes of finding, 2026-09-04

**Contradictions within the graph.** Most of what the model touches is a
contradiction the record already carries and has not resolved.

- The record holds that a deferred answer is unanswered and grounds no work
  (`authority`, `unanswered`, `un-aligned-children`), and every rule under
  `.claude/rules/` is projected from deferred nodes and binds every session.
  The clean-context review raised this as its strongest counter-argument
  three times on `authority` and twice on `unanswered`, and each time the
  session replied that deferred answers act as shims act. The model resolves
  it without the reply: deferred is a class the author confers, unanswered
  is the absence of one, the forty-six stamps are unanswered because no one
  granted them, and the rules bind by the stopgap shims `CLAUDE.md` names
  and not by their stamps.
- `bootstrap-authority-as-class` on `authority` and `two-kinds-of-shim` on
  `evaluation` are the two halves of one question the record says is
  undecided: a permission that does nothing until invoked is not a shim under
  `evaluation`'s rule that a shim is applied by default. The model decides
  it: the explicit grant for an unanswered node is a standing rule and not a
  shim, and the shim on `authority` liquidates by becoming that rule. Against
  the author's own words of 2026-09-03 that the authority "expires on
  bootstrap exit", which is probe 2: the fence drops the expiry, because a
  rule that reconciles an unanswered node only on the author's explicit word
  is the right rule at any time and not a bootstrap expedient, and the
  rejected line says so for the author to strike.
- `work-loop`, `delegation` and the reconciliation skill hold that a
  reconciliation session never writes the graph, by the author's ruling of
  2026-09-03; the model contradicts it, and the author's new words say so.
  The fence draws the line where probe 3 puts it, between operational state
  and decision state, and adds the attenuation: an option and a
  recommendation, within scope, never a ruling, a ruling's text, or the
  author's words, and never by a subagent.
- `evaluation` holds that a delegated answer overruled becomes deferred; the
  author's new words hold that a moved recommendation on a delegated node
  re-shapes the reconciliation frontier and leaves the node off the alignment
  frontier. The fence keeps `evaluation`'s rule for the one case it was for,
  a move that would leave the delegation's scope, and otherwise takes the
  author's words, which is also what `bounded-overrule` on `evaluation` was
  asking for.
- `unanswered` rejects a fourth response, defer, on the ground that leaving a
  node unconfirmed is the deferral. Under the model unconfirmed is
  unanswered and deferred is a grant, so the ground fails; the fence needs no
  fourth response either, since deferred is a third choice on the authority
  fact and the three responses stand.
- `rejected` recommends a structured list while its own reply favours prose,
  the discrepancy that earned its kickback. The model settles it from
  outside: a rejected alternative is a viable option not chosen, structure on
  every fact, and the projector's heading match no longer decides anything.
- `transience` holds that an alternative "dies at the ruling, into the
  answer, into the rationale as a rejected alternative, or into nothing"; the
  model keeps it as an option. `dialogue` owns what a node carries and the
  alternative is recorded there; `transience`'s sentence follows it.
- `madr-decision-records` records one divergence from the tradition it
  reads, that the status is derived where MADR stores it, and the review found
  it half wrong; under the model the considered options are kept as MADR
  keeps them, and the divergence narrows to what is stored.

**Contradictions between the graph and the AI's knowledge.**

- A stamp stored beside the rulings it summarises is a denormalised copy, and
  the record already stores a ruling on a fact with its response, choice,
  date and pin; the stamp `{class, by, date}` is that ruling's projection. The
  unanswered node's own rationale rejects a stored copy of the status because
  it drifts; the argument applies to the class without change.
- "After" by timestamp cannot be trusted in a record written by many
  sessions and rebased on landing, and cannot tell a recommendation
  re-affirmed from one changed; the record pins by content everywhere else,
  and the fence pins by content here.
- "Viable" is not defined in the record and the author's words use it as a
  category the AI applies. `evaluation`'s solution frontier gives it a
  meaning that is already doctrine-in-waiting: an option is viable when
  nothing on the list dominates it on the record's criteria.

**Redundant seams.** Six, and the model closes all six with one structure:
alternatives beside facts, two shapes for one thing, a decision with
choices; proposal beside alternative-with-a-source, when the source already
says where an answer came from; rejected lines in the rationale beside
alternatives, the same options written twice at different times; the stamp
beside the authority fact's ruling; the bootstrap-authority shim beside the
scope rule it stands in for; and the node-level `recommendation` field beside
each fact's adopted choice and boldness. What remains after the model is the
fact, its options, and the rulings on them.

### Evaluated twice, 2026-09-04

**Fresh judgment.** Written from scratch with nothing to preserve: a node is
a question; each decision on it is a list of options; the author's rulings
are recorded on the options they chose; the AI's recommendation is a mark on
an option with its reasons and its boldness; traditions bear on options.
Everything the record needs follows: the class, the status, both frontiers,
what is pending, what was considered. Nothing is stored twice and nothing is
stored that a session would decide again the same way. The one thing the
model needs that the author's words do not supply is where a grant comes
from, and greenfield the answer is not a design choice: the only source of
authority the record admits is the author's ruling, so a class traces to a
ruling or it is not a class. That is `grant-from-a-ruling`, and it is the
whole of the recommendation's departure from the words as stated; the rest
of the fence is the words made precise at the edges the probes found.

**With reference to tradition.** Nine traditions bear, and each is recorded
in the fence's rationale with the resolution it informed: MADR and Nygard's
decision records, IBIS, event sourcing and the derived view, the spec and
status of level-triggered reconciliation, attenuation in object-capability
systems, the recorded dissent and the motion to reconsider, the Pareto
frontier, Chesterton's fence, and approval-directed agents. Four of them are
already traditions the record names on `authority`, `evaluation`, `work-loop`
and `dialogue`; the model does not add a tradition to the record so much as
make the record keep the ones it cites. Each is a reading owed under
`stub-traditions`.

**The steelman, from tradition.** Every tradition of stamped documents, the
RFC and PEP status field, the signed approval, MADR's own status, stores the
mark of authority on the document, because the mark is a speech act by the
authority and not a summary of the document's state, and because a reader
must see it without reconstructing it. On that argument the model does not
remove the stamp at all: a ruling recorded on a fact with response, choice,
date and pin is a stamp, moved from the node to the fact. The reply is that
the steelman is right and the record should say so plainly: authority is a
projection of the rulings, and a ruling is the author's act stored once, so
what the model removes is the second copy and what it adds is the derivation
every reader shares. The gain is not less storage; it is that the class can
never disagree with the rulings, that deferred has a meaning, that the
options outlive the ruling, and that proposal is mechanical. The second
steelman is the record's own: `minimal-dialogue-state` on `dialogue`, twice
found strong, holds that the dialogue should store only what re-derivation
cannot reconstruct, and the model stores more after confirmation, not less.
The reply is in the rationale: what persists is judgment, the author's
rulings, the AI's recommendations and viability calls, and the readings; what
dies is the account, which re-running the review reconstructs; and that is
the minimal principle applied by its own test.

### Tested against the record it joins, 2026-09-04

The `under` chain runs `authority` to `model` to `purpose` to `agency`, and
`dialogue` to `unanswered` to `growth` to `model`; the global-tier nodes are
`authority`, `evaluation`, `delegation`, `materialization` and
`session-context`. Nothing is ratified, so nothing is doctrine and no draft
here is written as an answer over one; each contradiction the model makes
with a standing text is recorded, by the ruling-order rule for a lateral
tangle, as an alternative on the earlier node with this node as its source,
and each such node names this one in `depends`, so that one ruling here
settles them and the order counts it. Eleven nodes are so marked: `authority`
(`authority-derived`), `unanswered` (`unanswered-is-no-ruling`), `dialogue`
(`facts-carry-options`), `recording` (`options-persist-at-the-recording`),
`rejected` (`non-chosen-viable-options`), `readings` (`relation-per-option`),
`work-loop` (`reconciliation-writes-options`), `delegation`
(`reconciliation-session-writes-options`), `evaluation`
(`overrule-by-class`), `rsi` (`loop-writes-options`), and
`madr-decision-records` (`divergence-narrows`). This node in turn depends on
`dialogue#aspects-are-nodes`, since the fence keeps the reserved facts and
puts every other decision in a child, which is that alternative's rule.

Against the traditions the record cites: MADR is adopted more fully than
before and no new divergence is recorded; the readings rule is amended and
the amendment is recorded on `readings`. Against the mechanics the record
runs on: the ruling order's settle count is unchanged, since unanswered is
still derived and a deferred node still carries a stage; the page's list A
becomes the facts themselves, one structure where it read two; the
ruling-stage gate stands; the review reads each fact's recommended option
where it read one recommendation. No unrecorded conflict is left that the
session can find.

### The recommendation and its three facts, 2026-09-04

Adopts `grant-from-a-ruling`. Authority ratified, for the reason the Facts
section gives. Boldness moderate: the model is the author's in their own
words and the departures are the AI's, of which one is substantive, the
grantor, and the rest are edges the words left open; the tradition readings
rest on the AI's knowledge and are owed as readings. Persistence standing,
no shim declared. `depends`: `dialogue#aspects-are-nodes`.

The three exits stay open. Amend: the author strikes any rejected line and
the fence changes with it. Defer: the node stays unanswered at this stage,
which under its own answer is the state in which nothing acts. Claim: the
author may take `authority-derived` as stated and rule the grantor question
themselves, or `grant-from-a-recommendation`, whose case is recorded.

The cost, stated as a consequence and not weighed: the schema folds
`alternatives` and `recommendation` into `facts`, each fact gaining its
options with source, reference, prose, readings, the recommended mark with
its boldness, and a ruling; the `authority` stamp is derived and the
`CONFERRABLE_CLASSES` gain deferred; the reader, the validator, the
frontier, the browser, the alignment page, and both skills change; every node
in the record is re-encoded, its alternatives becoming the answer fact's
options and its forty-six deferred stamps going, which is the reclassification
the author already made; and the reconciliation skill gains a write path to
the disposition ref that lands by the compare-and-swap the persistence node
already prescribes. Under the model's own rule that reconciliation of an
unanswered node takes an explicit grant, none of it is done here: no grant
was given for it, the sitting stops before the review as directed, and the
rules under `.claude/rules/` are unchanged.

### The sitting closed at maieutic, 2026-09-04

The author directed the dialogue to run through the maieutic movement and
stop before the clean-context review. The node stands at the review stage
with the review owed; `/align-review` has not been invoked, and no grant for
reconciliation was given or assumed. The map of the round's decisions to
fields: the author's words, `## Disposition`; the classification as a new
answer to eleven questions bound by one premise, the minting section and
`under`; the probes, the periagogic section; the three alternatives and the
two readings, `alternatives` and `## Alternatives`; the class a confirmation
confers, `facts` and `## Facts`; the recommendation, `recommendation` and the
fence; the consequences for the eleven nodes, their `alternatives` and
`depends`; the traditions, the fence's rationale, each a reading owed. Nothing
of the round is held only in this session.

### State at compaction, 2026-09-04

The author's words above announce a grant and are not one. Bootstrap
authority is explicit, in the author's words, for a named reconciliation,
never assumed and never carried over (`authority`'s shim; the alignment
skill, §0.2), and the words say the grant comes after compaction. Until it is
given in the author's own words, nothing here is reconciled: the node stands
at the review stage with the review owed, the eleven nodes carry their
alternatives unapplied, and the implementation ref is untouched at
`5af58312`. The record is the dialogue's memory (`checkpoint`,
`transience`), so what a session resuming after compaction needs is written
here and nowhere else.

**What the announced grant covers, in the author's words:** "anything
materialized from nodes in this sitting", naming the encoding, the migration
of every node to it, the alignment and adversarial-review skills, the
alignment page and the browser, and the graph tooling. The nodes of this
sitting are this one and the eleven that carry its alternatives.

**What the record's own rules require of that reconciliation.** The grant is
quoted on this node before anything is written. The graph lands before the
implementation, since landing the implementation first inverts the account
(alignment skill, §6): the eleven nodes' recommendations move to the
alternatives this sitting recorded and their standing texts are amended to
them, each staying unanswered with the review owed; this node's
recommendation stands and acts under the grant, which under its own answer
is exactly what an explicit grant on an unanswered node does; then every
node is re-encoded. Then the implementation: the reader and validator, the
derivations, the frontier, the browser, the alignment page, the alignment
skill, the review skill's brief and apply steps, the reconciliation skill's
new write path, and the rules projection, each landing on the implementation
ref in a commit naming the grant and the graph commit it reconciles to. The
clean-context review runs on the batch after, as the author has directed for
this sitting and as the bootstrap paragraph of the skill provides.

**The encoding the fence implies, as delegated detail.** The author delegated
the encoding's details on 2026-09-03 on `dialogue`, and the fence fixes the
shape without the field names; the reconciliation decides these, and this is
the session's account of them so that they are not decided twice.
`alternatives` and `recommendation` fold into `facts`: a fact has a `name`
(`answer`, `authority`, `existence`, `persistence`), `options`, each with a
`name`, `source` (`author`, `ai`, `review`, or the instrument or node that
raised it), `ref`, a `recommends` naming one option, `boldness`, and a
`ruling` (`response`, `choice`, `date`, `of`) once given; `## Facts` carries
a subsection per fact and one per option beneath it, saying what the option
would answer and, on the recommended one, why. The `## Recommendation` fence
stays as the recommended answer's full text where it differs from what
stands. The `authority` stamp is derived from the rulings and the key leaves
the frontmatter; `CONFERRABLE_CLASSES` gains deferred. A reading records what
it bears on, a list of fact, option, and relation, adopted or diverged, on
the reading node, and the option's list of readings is the derived inverse.
The standing hash covers the frontmatter minus the dialogue keys and minus
`facts`, plus the answer and the rationale, so that adding an option does not
stale every pin; a ruling's `of` pins the recommended option and its reason.
`stage`, `review`, `depends`, `## Disposition` and `## Account` remain the
dialogue state and are what the recording removes, the Disposition section
as `quotes` decides.

**The migration, mechanically.** Measured on the graph at this commit:
seventy-four nodes, of which twenty-seven carry no stamp and no answer,
forty-six a deferred stamp with an answer, and one, `purpose`, an answer
with no stamp; two hundred and fifteen alternatives, none of source
`proposal`; facts on fifty-seven nodes, `authority` on fifty-five,
`existence` on six, `persistence` on two, no rulings on any; thirteen
readings, twelve adopted and one diverged, none chosen over. Each node's
alternatives become its answer fact's options, `standing` the text as it
stands, `recommendation.adopts` and `boldness` the fact's `recommends` and
`boldness`; the reserved facts keep their choices as options; the forty-six
deferred stamps go, which is the classification the author made on
2026-09-03 and changes no node's status; each reading's `relation` becomes a
`bears` entry on the answer fact's standing option. Rejected lines in
rationales are not minted into options by the migration, since which of them
are still viable is judgment per node, and they stay owed.

**The implementation loci, verified this sitting.** `packages/disposition/read.mjs`:
`FRONTMATTER_KEYS`, `FACT_NAMES`, `FACT_KEYS`, `RULING_KEYS`,
`CONFERRABLE_CLASSES`, `readFacts`, the `## Facts` subsection check, and
the dialogue-coherence check near line 1035. `packages/disposition/derive.mjs`:
`deriveStatus` (line 214), `stripDialogueFrontmatterLines` (233, the key
list that fixes what the standing hash omits), `deriveStandingHash` (267).
`packages/disposition/project.mjs`: `renderFrontier` and the ruling order,
`renderAsk`, `renderDecisions`, `renderChoice`, `standingState` and the
keep labels, `renderPane`. `packages/disposition/alignment-template.html`
and `browser-template.html`. `.claude/skills/align/SKILL.md`,
`.claude/skills/align-review/` with `brief.mjs` and `apply.mjs`, and
`.claude/skills/reconcile/SKILL.md`, whose line 27 states the rule the
model amends. Tests: `packages/disposition/*.test.mjs` (225) and
`.claude/skills/align-review/*.test.mjs` (45), all passing at `5af58312`.

Nothing else of this sitting is held in the session.

### Reconciled under the grant, 2026-09-04

The author's grant of 2026-09-04, quoted above, was given after compaction,
and this reconciliation ran under it in the order the state-at-compaction
section required. The grant was quoted first (graph commit `1cbc4365`). The
graph landed before the implementation: every node was re-encoded
mechanically (`db23d5b1`), the migration that section described, with three
fix-ups by hand it could not decide: twenty-three AI-sourced options that had
no `ref` took the date of the graph commit that recorded them, read from the
graph's history; the two layout readings under `alignment-page` bear on its
recommended option, since nothing stands there; and the purpose node's
standing text is marked the author's. Then, in the commit that carries this
section, the eleven nodes' recommendations moved to the options this sitting
recorded and their standing texts were amended to them, each staying
unanswered with the review owed: the five that stood at the ruling stage,
`authority`, `readings`, `work-loop`, `delegation` and
`madr-decision-records`, return to the review stage, since their
recommendation changed after its review, and the rest stay at their stage;
the text each displaced stays on its answer fact as a viable option under a
name that says what it answered (`stamped-classes`, `answered-by-stamp`,
`alternatives-beside-facts`, `stamp-written-at-the-recording`,
`relation-on-the-node`, `never-writes-the-graph` on two nodes,
`overrule-to-deferred`, `status-derived-from-stamp`), and on `rejected`,
whose first answer was in its fence, no text was displaced. On `rsi` nothing
stands and no recommendation is made: the option `loop-writes-options` is
recorded, and the recommendation is owed to a sitting on `rsi`. This node's
own recommendation acts under the grant: the fence is applied as its answer,
`grant-from-a-ruling` stands, and the node stays at the review stage with
the review owed, no ruling and no class written for it. The implementation
landed on `greenfield` as `33f9bb39`, naming the two graph commits: the reader, the
derivations and the validator (183 tests), the projector with the frontier,
the browser, the alignment page and the rules (105), the alignment skill, the
clean-context review skill (47) and the reconciliation skill's write path,
and two sentences of `CLAUDE.md`. Delegated as the author directed: the
reader, the projector, the review skill and the skills' text to the larger
model as units with contracts, the migration script to the smaller, a survey
of the code to the smaller; the eleven amendments and this node's were the
main thread's.

Decided in the reconciliation, as the delegated detail the fence left to it,
and each a line the author may strike: the field names, `facts` with
`options`, `recommends`, `boldness` and `stands`, a `ruling` on the option
with `response`, `date` and `of`, and `bears` on readings; the fence present
exactly when the recommended option is not the one that stands, a first
answer included; `ruling.of` pinning the fact's recommendation, the
recommended option with its reason and the answer's text, so that an option
added beside it moves nothing; `review.of` pinning every fact's
recommendation the same way; a denial never stored as a ruling; a reserved
fact's option names free text and the answer's slugs; the class inherited
from the nearest ancestor whose authority fact is ruled, deferred winning at
equal depth; and the gap the author's words leave between two senses of
proposal: a ratified node whose confirmed choice differs from a
recommendation the author overruled at the ruling is shown as diverging and
stays off the alignment frontier, and only a recommendation moved after the
ruling returns the node, since the words tie the return to a recommendation
that comes after the confirmation.

The clean-context review of the batch is owed and runs next, at the author's
direction, on this node, `materialization`, and the five returned to the
review stage. The nine traditions the rationale names stay readings owed
under `stub-traditions`.
