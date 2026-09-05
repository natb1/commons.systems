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
      - name: a-stored-stamp-beside-the-rulings
        source: ai
        ref: "2b184f05"
        status: passed
        reason: "it is a copy and drifts"
      - name: a-fourth-response-defer
        source: ai
        ref: "2b184f05"
        status: passed
        reason: "deferred is a choice on the authority fact and the three responses stand"
      - name: a-timestamp-as-the-pin
        source: ai
        ref: "2b184f05"
        status: passed
        reason: "content is what changes, and a clock cannot tell a re-affirmed recommendation from a changed one"
      - name: report-and-wait-on-a-divergence
        source: ai
        ref: "2b184f05"
        status: passed
        reason: "it holds a decision outside the record"
      - name: delegated-node-returned-on-every-move
        source: ai
        ref: "2b184f05"
        status: passed
        reason: "it un-delegates: the author asked not to be asked again"
      - name: re-confirmation-from-the-periagogic
        source: ai
        ref: "2b184f05"
        status: passed
        reason: "the recording node's classification already says where a dialogue resumes, and only the recommendation moved"
      - name: options-folded-into-the-rationale
        source: ai
        ref: "2b184f05"
        status: passed
        reason: "the author found the prose ad hoc and the structure is what regression needs"
      - name: keep-every-option-ever-recorded
        source: ai
        ref: "2b184f05"
        status: passed
        reason: "it is the recommended option with the judgment hidden: the same list, and nothing on a row saying which candidates the AI holds dominated"
      - name: adopted-is-a-status
        source: commons.systems/disposition-graph/frontier-consistency
        ref: "2026-09-05"
      - name: class-rules-cited-not-restated
        source: commons.systems/disposition-graph/authority
        ref: "2026-09-05"

    recommends: passed-over-options-stay
    boldness: high
    against: "The author scoped what persists to options 'categorized as viable by the AI', and this node's own rationale rejected keeping the rest, so the recommendation reverses the author's words on the AI's reading of the regression purpose those same words gave; what it buys is a status on rows the author must now read, a hundred and four of them today across twenty-nine nodes, on a page whose own reading of anchoring says the surface is already multiplied, while the discretion the change was bought to remove survives untouched in which candidates the AI names at all."
    stands: grant-from-a-ruling
  - name: authority
    options:
      - name: ratified
      - name: delegated
      - name: deferred
    recommends: ratified
    boldness: moderate
    against: "Ratified makes the record's most-cited rule the last to acquire authority, since it cannot act until the author has read the hundred and four rows it prices; deferred would let it act and keep the node on the frontier for the same reading, which is closer to where the record actually is."
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

## Facts

### answer

`passed-over-options-stay` is recommended because the reason the author gave
for persisting options at all, regression, is the reason not to drop the
dominated ones: a later session is at least as likely to re-propose a
candidate the AI rejected as one it still holds viable, and version control is
not a projection, so a candidate that leaves the record is met by nobody who
reads the record. What the standing answer has instead, that a dominated
option leaves the list and the option that displaced it says why, puts the
AI's judgment where nothing checks it and where the author cannot rule against
it. The recommendation moves that judgment onto the row it is about and gives
the author the one thing that makes it answerable: the reason, in a clause,
beside a control they can use.

High boldness. The centre of the recommendation is the AI's, against the
author's own scoping words on this node, "any non-chosen option which is
categorized as 'viable' by the AI ... persisted after confirmation", and
against a candidate this node's own fact passed over at `2b184f05`,
`keep-every-option-ever-recorded`;
and what it decides is what stays on the author's screen, which is the AI
deciding how much of its own account the author has to read. High boldness is
low confidence in this record, and the confidence is low for that reason and
not because the argument is weak.

Four decisions the option as raised left open are taken here, on the merits,
and each is set out in the fence.

**Passed over against struck.** Passed over is the AI's judgment about an
option, written on the option, and it changes nothing about the option's
place: it stays on the fact, it is shown to the author, and the author may
rule for it, which clears the status. Struck is removal from the record, and
it is the author's act alone; a struck option lives in version control and
nowhere else, and version control is not a projection. The AI does not strike,
because a list the AI may prune is the AI's shortlist under another name and
the regression these options persist for runs out through the hole. The author
strikes by saying so in the dialogue, which is not a ruling and needs no
field; the session removes the option and its account says where it went.

**Raising a passed-over candidate again.** By the author, by ruling for it: it
is a row on the page like any other, and the recording clears the status,
which is what the reader already holds by refusing a ruling on a passed
option. By the AI, by lifting the status on the option itself and saying in
the fact's prose what changed — evidence the record did not have, a criterion
it has since recorded, or the option that dominated this one having itself
been passed over. The AI may do that on the same authority by which it wrote
the status, the status being the AI's account and not the author's; what it
may not do is mint a second option under a new name for a candidate the list
already holds, because a duplicate is how a list stops being the record of
what was considered. This node performs the second move on its own fact:
`keep-every-option-ever-recorded` keeps its status and takes a different
reason, because the reason it carried was the case against the recommendation
and not a case against that option.

**The sources the migration wrote.** Measured at graph commit 417b8335: a
hundred and four options carry the status passed, on twenty-nine nodes, every
one of them on an answer fact; ninety-six carry `source: ai` and eight
`source: author`. The ninety-six are right. A source says who put the
candidate on the table, and the record drafted these: the prose the migration
read was the AI's own rationale, and a candidate the AI names from the world's
practice — an issue tracker, a status field, a heading convention — is still a
candidate the AI named. The eight are not right as a class, and the test the
encoding already implies catches them: an option sourced to the author carries
as its reference the date of the words in a `## Disposition` that raised it,
so a graph commit in that field means nobody can point at the words. All eight
carry a graph commit and none carries a date. Two survive the test on their
content, `status-field-for-pending-alternatives` on
`commons.systems/disposition-graph/dialogue` and `mark-answered-node-unanswered`
on `commons.systems/disposition-graph/unanswered`, both candidates the author
put up and retracted the same day; each should carry 2026-09-03 rather than a
commit. Three do not: `define-by-its-parts`,
`intent-in-prompts-chat-or-memory` and `issue-trackers-as-the-record-of-intent`
on `commons.systems/disposition-graph/purpose`, all three of which take
`1920badc` as their reference, the commit whose prose put them under a
`### Rejected` heading labelled in as many words, "Drafted by the AI from the
record, for the author to confirm or strike at ratification"; the migration
struck that label with the prose at `3bd99e91` and kept the source. The author
afterwards ratified one of the three reasons and noted two, which is agreement
with a reason the AI gave and not authorship of the candidate. The census on
`commons.systems/disposition-graph/alignment-page` says purpose's four carry
the source author; three do, and the fourth,
`data-structure-the-harness-consumes`, carries `ai`, which is right, the AI
having added it in purpose's own fence. The remaining three,
`proposal-as-any-recorded-candidate` on
`commons.systems/disposition-graph/authority` and two on
`commons.systems/disposition-graph/alignment-order`, are the same shape and
are owed the same check. No correction is made here: the sources are on those
nodes and writing them changes those nodes' facts. What this answer fixes is
the rule, so that the next migration has a test rather than an inference.

**Whether the review's option is dominated.** It is not, and it therefore
keeps no status. `viable-not-chosen-as-it-stands` is worse on the two counts
its own text names, that nothing on a row says the AI holds a candidate
dominated and that a candidate may still leave the list unseen, and better on
one the record weighs: fidelity to the author's own scoping of what persists.
Under `pareto-frontier`, the reading under this node, an option better on a
criterion is not dominated, and dominance is the only comparison that does not
decide for the decider; passing it over would be the AI making the author's
trade for them on the one question where the trade is the author's. That the
recommended option's nearest rival survives its own test is the strongest
thing that can be said for the test.

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
open, and leaves open with it whether a candidate the AI holds dominated is
still one of the "viable options" the words scope.

#### grant-from-a-ruling

The model with the grant traced to the author's ruling. A class follows from a
ruling recorded on the node's facts, on the node itself or on an ancestor whose
scope covers the decision: ratified where the answer fact carries a ruling,
delegated or deferred where the authority fact does, and unanswered where none
does, in which state nothing acts and reconciliation takes an explicit grant.
Deferred is therefore a class the author confers, a third choice on the
authority fact, and the deferred stamps the bootstrap wrote for itself remain
unanswered as the author classified them. It is the answer as it stands, and
it stands whole under the recommendation, which keeps every sentence of it and
changes one clause: where this answer has an option the AI no longer holds
viable leave the list, the recommended option has it stay, passed over with
its reason. What a ruling for this option as written does: the hundred and
four candidates the migration of 2026-09-04 recorded are dominated ones, so
they leave the facts they sit on, the `status` and `reason` keys leave the
reader, and the AI's dominance judgment goes back into whatever prose survives
it — with the pin by content, the delegated node held off the alignment
frontier on a move within its scope, and re-confirmation resuming at the
movement the recording node's classification calls for, all unchanged.

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

Viability is a judgment shown on an option and not the condition of its listing. Every candidate the AI considered and can name stays on the fact it answers with its status, recommended, viable, or passed over, the last carrying the reason it was passed over as `status: passed` with a required `reason`, and none leaves the list silently. The author may rule for a passed-over option, since only the author rules and rules on any option the fact lists, and the recording then clears the status. Against the rationale's rejection of keeping every option whether or not viable, that the list would grow without a reason and version control holds what left: the reason is the regression the author gave for persisting options, which bears at least as much on a candidate the AI rejected as dominated, since a later session is as likely to re-propose it, and version control is not a projection, so a later session meets none of what left; the list grows to the size the rationales already carry in prose. Raised on commons.systems/disposition-graph/prose-and-structure, whose clean-context review of 2026-09-04 found that the membership of an option list is this node's question and not that one's. Three decisions the option as raised left open are taken with it: that an option leaves the list only when the author strikes it, the AI having no power to prune what it cannot then re-show; that a passed-over candidate is raised again by lifting the status on the option itself, with what changed said in the fact's prose, and never by minting a second option under a new name; and that an option's source says who put the candidate on the table, so the author's later agreement with a reason the AI gave is not a source. Adopted by the recommendation and set out in the fence.

#### viable-not-chosen-as-it-stands

The standing rule kept and read as the author used the word: an option is a candidate the AI categorized as worth recording, and the prose rejections migrate as options under `rejected`'s rule that a rejected alternative is a viable option not chosen, with no status minted and no key added; an option the AI no longer holds worth the author's attention still leaves the list, the option that displaced it saying why. It keeps the author's scoping on this node and both nodes' standing text, at the cost the clean-context review of prose-and-structure named: the AI still decides which candidates reach the structure, and nothing on a row says the AI holds it dominated. Raised by that review on 2026-09-04 as the viable option the draft was missing. It is not dominated by the recommendation and carries no status: it is better on fidelity to the author's own scoping of what persists, which is a criterion the record weighs, and under `pareto-frontier` an option better on a criterion is not dominated. What a ruling for it does: the hundred and four candidates the migration recorded stay on their facts as options with no status, the `status` and `reason` keys leave the reader, and the AI's dominance judgment returns to each option's prose subsection, where nothing projects it.

#### a-stored-stamp-beside-the-rulings

The class is stored as a stamp beside the rulings rather than read off them.
It was passed over because a stamp beside the ruling is a copy, and a copy
drifts, which is the reason the unanswered node gave for deriving the status.

#### a-fourth-response-defer

The alignment page offers a fourth response, defer, beside confirm, refine and
kick back. It was passed over because deferred is a choice on the authority
fact and the three responses stand.

#### a-timestamp-as-the-pin

The pin on a recommendation is a timestamp rather than a hash of its content.
It was passed over because content is what changes: a clock cannot tell a
recommendation re-affirmed from one changed, and the record pins by hash
everywhere else.

#### report-and-wait-on-a-divergence

A divergence found in reconciliation is reported and held on a derived
frontier until an alignment session transcribes it. It was passed over because
it holds a decision outside the record, where an option is in the record at
once and changes nothing the author confirmed.

#### delegated-node-returned-on-every-move

A delegated node returns to the alignment frontier on every moved
recommendation, which is what the evaluation node's rule did. It was passed
over because it un-delegates; the bound that rule wanted is the delegation's
scope, and a move beyond it does return the node.

#### re-confirmation-from-the-periagogic

Re-confirmation of a proposal opens at the periagogic movement in every case.
It was passed over because the recording node's classification already says
where a dialogue resumes, and where only the recommendation moved that is the
review stage.

#### options-folded-into-the-rationale

The options are folded into the rationale as prose when the recording removes
the dialogue. It was passed over because the author found the prose ad hoc,
and the structure is what the regression purpose needs.

#### keep-every-option-ever-recorded

Every option ever recorded stays on the fact whether or not the AI holds it
viable, with nothing on a row saying which is which. It is the recommended
option with the judgment hidden, and that is why it is passed over now. It is
not why it was passed over on 2026-09-04: the reason it carried until this
movement, that the list would grow without a reason and version control holds
what left, is the case against the recommendation and not a case against this
option, so leaving it would have the fact pass an option over on the ground on
which it recommends another. The AI wrote that status and the AI lifts and
rewrites it, which is exactly what the recommended answer says the AI may do
with its own judgment; the option itself stays on the list, since only the
author strikes one.

#### adopted-is-a-status

Everything the recommendation says, with a status beside `passed` for an option the recommended text has absorbed, so that an adopted candidate stays on the list as the recommendation requires and the page and the frontier show it as adopted rather than as viable. Today the encoding's only status is passed, and an adopted option is listed with no status and its adoption noted in prose, which the dialogue, alignment-page, and frontier-consistency nodes do; a reader of the page sees it beside the live options. Raised by the reading of frontier-consistency on 2026-09-05, which found three adopted options struck from that node's list.

#### class-rules-cited-not-restated

The standing answer and the recommended `passed-over-options-stay` both restate the authority node's class rules at length — ratified, delegated, deferred, unanswered, the non-expiring grant, the narrowing of authority on the way down, and a class the AI wrote for itself being no grant — and both carry the definition of a proposal in full. Authority is the node whose `defines` holds `ratified`, `delegated`, `deferred` and `proposal`, so the same rule is answered twice and will drift the moment either is ruled, which is the update anomaly the `codd-update-anomaly` reading names. The second paragraph and the proposal sentence are replaced by a citation of the authority node, so that this answer says what viable options do for authority and does not restate what authority says. Raised on commons.systems/disposition-graph/authority, by its clean-context reading of 2026-09-05.

### authority

Ratified. The answer redefines what authority is in this record and opens a
write path from reconciliation into the graph, which is the capture-shaped
case the alignment skill escalates toward ratified; a delegation of this
decision would be a delegation of the definition of delegation. The
recommendation adds a second capture-shaped decision to the same node: what
the AI may keep off the author's page, and who may remove a candidate from the
record. Delegated would hand the AI the rule that bounds the AI's own account.
Deferred is the honest description of where the record stands today, the
status materialized, a hundred and four options carrying it, and the author
having ruled on none of it; but deferred is a class the author confers and the
AI writes none for itself, so what the record shows meanwhile is a
recommendation acting under a bootstrap grant and named as such. Moderate
boldness: the class follows the record's own escalation rule, and what rests
on the AI is the reading that a membership rule is capture-shaped.

## Recommendation

```markdown
---
question: Is authority a projection of the state of a node's viable options?
form: rule
defines:
  - option
  - term: viable
    gloss: "Viable is the status of an option nothing else on its fact dominates on the record's criteria, in the AI's judgment: it is on the table, the AI may recommend it, and the author may rule for it."
  - grant
  - term: passed over
    gloss: "Passed over is the status of an option the AI holds dominated on the record's criteria: it stays on the fact with one clause saying why, is never what the fact recommends and never what stands, and carries no ruling; the author may rule for it all the same, and the recording clears the status."
under:
  - commons.systems/disposition-graph/authority
  - commons.systems/disposition-graph/dialogue
---
## Answer

Yes. A node's authority is read off the rulings recorded on its facts, and no stamp is written beside them. Every decision on a node is a fact with a list of viable options, possibly one: the answer, whose options are the candidate answers to the node's question, and the reserved three the dialogue node names, authority, existence, and persistence; any other decision the author would rule on separately is a question and a node under this one. An option carries its name, its source and reference, in prose what it would answer, and in full the text where it would stand as the answer and differs from what stands; the readings that bear on it, each saying whether the tradition supports or contradicts it; on the one option of each fact the AI recommends, why and with what boldness; and, where the AI holds it dominated, the status passed with the one clause saying why. The source says who put the candidate on the table and the reference points at that: the author, where their own words in the node's Disposition raised it, with the date of those words; the AI, where the record drafted it, with the graph commit that recorded it; the clean-context review; or the node or instrument that raised it outside alignment. The author's later agreement with a reason the AI gave is not a source: it is a ruling where the author gave one and an account where they did not. A ruling is the author's act on the option they chose, recorded on it: the response, the date, and a pin of the recommendation it answered. Only the author rules, on the alignment page or in prose, and the AI writes no ruling and no class for itself.

The class follows from the rulings. Ratified: the answer fact carries a ruling, and the confirmed choice acts. Delegated: the authority fact carries the ruling delegated, the recommendation acts, the delegation covers the class of decision it names below the node, and the author does not want to be asked again. Deferred: the authority fact carries the ruling deferred, the recommendation acts, and the node stays on the alignment frontier until the author returns to it. Unanswered: no fact carries a ruling, nothing on the node acts, and reconciling anything under it takes an explicit grant from the author for that reconciliation, given in their words and never assumed; that is a standing rule of this record, not a shim, and it does not expire. A ruling on an ancestor grants the decisions its scope covers to the nodes beneath it, and authority only narrows on the way down. A class the AI wrote for itself is not a grant: the deferred stamps the bootstrap wrote are unanswered, as the author classified them on 2026-09-03, until a ruling grants them.

The facts persist after the ruling: the confirmed choice with the author's reason, the recommendation with its reason, the readings on each option, and every candidate the AI considered and can name, so that a later session meets what was considered and why before proposing it again. Viable means not dominated on the record's criteria, in the AI's judgment, which is what the evaluation node's solution frontier means for one decision. Viability is a judgment shown on an option and never the condition of its listing. A candidate the AI holds dominated is passed over: it keeps its place on the fact, carries the status passed with the one clause saying why, and acts on nothing, being neither what the fact recommends nor what stands and carrying no ruling; it is shown to the author with the others, and the author may rule for it, which clears the status. The AI passes an option over on its own authority and lifts that status on the same authority, saying in the fact's prose what changed; it raises a passed-over candidate again by lifting the status on the option itself and never by minting a second option under a new name, since a duplicate is how a list stops being the record of what was considered. Struck is the other thing, and it is the author's alone: a struck option leaves the record and version control alone holds it, so the AI does not strike, a list the AI may prune being the AI's shortlist under another name. A projection shows a status as it shows a vocabulary fact's option, by the gloss on the node that defines the term, and carries no sentence of its own for either. What a rejected alternative is and how it is recorded is the rejected node's question. What dies at the recording is the dialogue: the stage, the review, the dependencies, and the account; the author's words stay as the quotes node decides. The projections show a node's confirmed choice first and, beneath it, the recommendation, the other options with their status, and what each tradition says.

The AI may add a viable option to any fact, may pass an option over and lift a status it wrote, and may move a fact's recommendation, in alignment, in reconciliation, and in the loop on itself, and may not rule, edit a ruling or the author's words, strike an option, or recommend beyond the scope a delegation confers. What a move does is read from the class. On a ratified node the confirmed choice keeps its full authority and the node returns to the alignment frontier for re-confirmation, at the movement the recording node's classification calls for, the review where only the recommendation moved; that state is what proposal names here: a ratified node whose recommendation has moved from its confirmed choice, wherever the move came from, the origin being the option's source. On a deferred node the recommendation acts, the reconciliation frontier changes with it, and the node was on the alignment frontier already. On a delegated node the recommendation acts within the delegation's scope and the node stays off the alignment frontier, since that is what the author asked for; a move that would leave the scope is not the AI's to recommend, is recorded as an option, and returns the node to the author with its class intact. On an unanswered node nothing acts and the move is dialogue. Moved is a matter of content and not of clock: the ruling pins the recommendation it answered, and the frontier flags the node when the recommended option or its reason has changed since. The frontiers are projections of the same state, and the record stores neither: the alignment frontier is every node with no ruling, every deferred node, and every proposal; the reconciliation frontier is every node whose acting option's instrument fails.

## Rationale

The author's disposition of 2026-09-04, quoted above: "Is 'unanswered' just an authority - as in no authority granted for reconciliation ... explicit bootstrap authority required for reconciliation - in this way bootstrap authority is not a shim, but a persistent disposition about reconciliation authority"; "Each fact on a node, regardless of authority, has viable options list"; "Proposals are just nodes with ratified authority and a fact with confirmed choice that deviates from AI recommendation"; "'delegated' and 'deferred' authority mean reconciliation authority is granted for AI recommendation without requiring confirmation. Delegated means the node is removed from the alignment frontier and deferred means it remains"; "the prior statement that 'reconciliation never edits the graph' is incomplete". The words leave one thing open that the answer decides: who grants. Every authority this record knows comes from the author's ruling, as the authority node says, "Ratification happens only through that dialogue ... no command does", so a class must trace to a ruling, on the node or on an ancestor whose scope covers it; the reading under which a reviewed recommendation acts as deferred by default is rejected because it would leave no node the AI could ever hold unanswered, which is the state the author reclassified the whole record into on 2026-09-03.

Why a projection and not a stamp: the record already stores the ruling on a fact with its response, choice, date, and pin, so a stamp beside it is a copy, and a copy drifts, which is the reason the unanswered node gave for deriving the status; the same reason derives the class. Why the options persist: the author's reason, regression, and the tradition the encoding already adopts, which keeps every considered option beside the decision; what persists is judgment that re-derivation cannot reconstruct, the author's rulings, the AI's recommendations and viability calls, and the readings, while the account, which re-running the review reconstructs, still dies, so the minimal-state principle on the dialogue node is kept by its own test. Why the line on reconciliation falls where it does: the record is the sole carrier, and a divergence found in reconciliation and held on a derived frontier until an alignment session transcribes it is a decision outside the record; as an option it is in the record at once, changes nothing the author confirmed, and returns a ratified node to the author by the same projection that returns any proposal; operational state stays outside the graph, as the author said. Why a delegated node stays off the alignment frontier on a move within scope: delegated means the author does not want to be asked again, and a rule that asks them anyway on every change, as the evaluation node's did, delegates nothing; the bound that rule wanted is the scope, and a move beyond it does return the node. Why the pin is content: a clock cannot tell a recommendation re-affirmed from one changed, and the record pins by hash everywhere else.

Why a dominated candidate stays on the list, with the status and the clause. The reason the author gave for persisting options is regression, and that reason bears at least as hard on a candidate the AI rejected as dominated as on one it still holds viable, since a later session is at least as likely to re-propose the dominated one; version control is not a projection, so a candidate that leaves the record is met by no one who reads it. The judgment that separates the two is a dominance judgment and never a preference, which is what the reading on the Pareto frontier supplies and what keeps the list from being the AI's shortlist; the same reading names the two conditions the tradition sets that this record cannot meet, criteria that are stated and a frontier that is recomputed, and a status the author can see and rule against is what the record does about them instead. IBIS puts the argument on the position, so a candidate with no row has nowhere for its argument to live; the decision-record tradition keeps the considered options beside the decision, which is the shape the fact already has; the dissent and the motion to reconsider are the same shape for a view held beside a decision in force; and the derived view is why viable is the absence of a stored status rather than a second stored one. Why only the author strikes: the AI's dominance judgment is what the status records, and an actor that may both judge and remove leaves nothing for the judgment to be wrong against. What this costs is that option lists grow to the sizes the rationales already carried in prose, a hundred and four candidates today across twenty-nine nodes, and that the author's page is longer by them; that is a consequence of the design and not a reason for it.
```

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
the maieutic movement, so the probes were put here together rather than one
per turn; the AI's evaluation is held for the next section. Where a probe turns the author back
to their own ruling of an earlier day, it is because the new words would
change it, and the periagogic object of a disposition sitting is exactly the
reasons a thing was recorded, read before it is undone.

The eleven probes this movement raised stood here as eleven numbered
paragraphs until the migration of 2026-09-04, which tested each against the
admission test the `author-questions` node fixes and admitted none. Each had
by then acquired a candidate answer the AI holds viable, recorded as an option
the author will rule on, which makes it a decision and not a probe: who grants
a class, whether the grant for an unanswered node expires, where the line
falls between what reconciliation writes and what it may not, what
re-confirmation re-opens, whether the answer is itself a fact, which parts of
the dialogue die at the recording, whether a reading's relation moves to the
option, what a moved recommendation does on a delegated node, whether the pin
is by clock or by content, and rsi's authority over the record. Their
candidates live on this node's answer fact and on `authority`, `evaluation`,
`work-loop`, `delegation`, `dialogue`, `recording`, `readings` and `rsi`; the
remaining one of the original eleven, the retraction read against the
re-confirmation rule, was never a question and its own text said so. The
paragraphs are removed because the alignment page renders an account as a
drill-down unconditionally, so they sat in front of the author at the ruling,
which is the one place the author's words of 2026-09-04 exclude them from.
Nothing is lost by their removal: every question they carried is an option the
author rules on, and the movement's conduct and its classification stand above
and below.

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
class; whether the grant for an unanswered node expires; where the line falls
between what reconciliation writes and what it may not; what re-confirmation
re-opens; whether the answer is a fact and `aspects-are-nodes` stands; which
parts of the dialogue die; whether a reading's relation moves to the option;
what happens on a delegated node; the pin; and rsi. Each edge is decided in the fence, and each decision is listed in
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

### The maieutic movement on the membership of an option list, 2026-09-04

The occasion. The clean-context review of
`commons.systems/disposition-graph/prose-and-structure` on 2026-09-04 kicked
that node back and relocated one question here: whether a candidate the AI
holds dominated stays on the fact. That session recorded the option
`passed-over-options-stay` on this node with itself as the source, and the
reviewer's `viable-not-chosen-as-it-stands` beside it, and did not move the
recommendation, saying that the author would rule on it here with both
readings in front of them. This movement moves it, so that the two readings
are put with a recommendation between them rather than as two unmarked rows.
The migration under the grant then materialized the status ahead of the
ruling, which is what makes this movement urgent rather than tidy: the record
runs on the recommended option today and its answer says the opposite.

**Contradictions within the graph.**

- This node's `## Answer` says "an option the AI no longer holds viable leaves
  the list", and a hundred and four options across twenty-nine nodes did not
  leave: they carry `status: passed` with a reason, and
  `packages/disposition/read.mjs` enforces the key, refusing a passed option
  that is recommended, that stands, that carries a ruling, or that gives no
  reason. By `materialization`'s standard that is implementation ahead of the
  disposition that justifies it, and it resolves one of two ways: this ruling,
  or the migration reversed. Both are stated on the two options as what a
  ruling for each does, so the author is choosing between two live states of
  the record and not between a text and a hypothetical.
- The fact carried `keep-every-option-ever-recorded` passed for the reason
  "the list would grow without a reason and version control holds what left",
  which is the case against the recommendation this movement makes. A fact
  cannot pass one option over on the ground on which it recommends another.
  The status stays, since the option is the recommendation with the judgment
  hidden and is dominated by it, and the reason is rewritten to say that.
- `commons.systems/disposition-graph/rejected` says "an option no longer
  viable leaves the list, the option that displaced it says why, and version
  control holds what left". It falls with this one, and the two are drafted
  together as one decision seen from two sides: this node decides the
  membership, that node decides what a rejected alternative is and where it is
  recorded, and neither restates the other.
- `commons.systems/disposition-graph/prose-and-structure` states the
  membership rule inside its own answer and was kicked back for it. Its
  redraft cites these two options; nothing here restates its rule about prose.
- `commons.systems/disposition-graph/dialogue` carries the same clause as this
  node's answer, "an option the AI no longer holds viable leaves the list";
  the alignment skill already reads the recommended option instead. Under the
  rule that this node owns the term, `dialogue`'s clause follows a ruling here
  and is not amended by this movement.

**Contradictions between the graph and the AI's knowledge.** Dominance is a
relation against a stated set of criteria, and this record's criteria are its
own prose, so the judgment can be wrong; a judgment that can be wrong and that
removes the evidence of itself cannot be corrected, which is the argument for a
status rather than a deletion. And a derived value must be derived in one
place: `viable` is therefore the absence of a stored status and not a second
stored one, which is the same rule the class already follows.

**Redundant seams.** Three, and this pair closes all three. The prose list of
rejected candidates beside the option list, which the migration closed in the
data and this closes in the answer. The browser's `Rejected` heading match,
which reads prose for what the fact holds and which `rejected`'s ruling
liquidates. And the word "viable" doing two jobs at once, membership and
judgment, which the status separates: everything the AI considered is listed,
and what the AI thinks of each is shown.

### Evaluated twice: the membership rule, 2026-09-04

**Fresh judgment.** Written with nothing to preserve: a fact is a question and
a list of candidates. A candidate the AI drops is a candidate no reader of the
record meets, and the record's whole reason for persisting options is that a
later session should meet them. So the list holds every candidate the AI
considered and can name, and the AI's judgment about each is a mark on its
row. A mark is better than a deletion for one reason that is not about
storage: a mark can be argued with by the one party whose judgment outranks
the AI's, and a deletion cannot. Everything else follows, including who may
remove: the party that may be wrong is not the party that may remove the
evidence.

**With reference to tradition.** Five readings already under this node bear
directly and are named in the fence's rationale with the resolution each
informed: `pareto-frontier`, which supplies dominance as the only comparison
that does not decide for the decider and names the two conditions this record
cannot meet; `ibis-issue-based-information`, which puts the argument on the
position, so a candidate with no row has nowhere for its argument to live;
`madr-decision-records`, whose considered options are kept beside the
decision; `dissent-and-reconsideration`, the same shape for a view held beside
a decision in force; and `event-sourcing-derived-view`, which is why viable is
derived rather than stored. `pareto-frontier`'s answer argues this node's
recommended option in as many words — "an option that is passed over is better
kept on the fact with its reason than removed from the list" — while its
`bears` entry names `grant-from-a-ruling`; a second entry on
`passed-over-options-stay` is owed, and so is a re-reading of the other six
readings under this node against the recommended option, both at the review.

Three traditions this movement surfaced that the record does not carry, each a
reading owed under `stub-traditions`: the file-drawer problem and the
pre-registration answer to it, where results that were tried and failed leave
no record and later work re-proposes them, a practice shelved for a century by
the cost of printed pages and revived once the constraint went; deprecation
rather than deletion in standards and interface practice, where a thing on its
way out is marked and kept so that its consumers can see what happened;
and Chesterton's fence, which this node's own account of 2026-09-04 named
among nine traditions and which is the one of the nine that became no reading.

**The steelman, from tradition.** The shortlist. Every practice that puts
options before a decider curates: a board paper offers three options and not
thirty, a selection panel presents a short list, an adviser who declines to
curate has handed the work back to the person who asked for advice. On that
argument the AI should drop what it holds dominated, and a record that keeps
everything has confused an archive with an agenda. The reply is that each of
those practices keeps the long list somewhere the decider can call for — the
panel's file, the tender's unsuccessful bids, the prosecution history of a
granted patent — and this record has no somewhere else, since version control
is not a projection and no reader of the record ever meets it. So the record
keeps the long list and curates by marking, which is the same curation with
the file attached; the cost is a longer page, and it falls on the one reader
who can overrule the curation. The second steelman is the author's own
scoping, "any non-chosen option which is categorized as 'viable' by the AI",
which is narrower than what is recommended; that is answered by recording it
as `viable-not-chosen-as-it-stands`, holding it viable rather than dominated,
and carrying the departure at high boldness on this fact.

### Tested against the record it joins: the membership rule, 2026-09-04

The recommendation changes one clause of the standing answer and nothing else,
so the `under` chain, the eleven nodes carrying this node's alternatives, and
`depends` are unchanged: `dialogue#aspects-are-nodes` is still the only open
question this ruling waits on, since the membership rule is this node's own
and no other ruling has to come first. `commons.systems/disposition-graph/rejected`
depends on this node, by the node id alone and not by an option: its answer
changes whichever option wins here, so the `#option` form, which records that
a node stands under one side of a divergence, would tell the page something
false. `commons.systems/disposition-graph/prose-and-structure` depends on both
and its redraft cites both.

Against the mechanics: the reader already carries `status`, `reason` and their
five checks, so a ruling for the recommended option materializes nothing new
in the validator; a ruling for either alternative liquidates them. The
alignment page renders a status on an option's row, and the sentence for a
status is the gloss on the node that defines the term, as it is for a
vocabulary fact's option, so the fence's `defines` glosses `viable` and
`passed over` and leaves `option` and `grant` bare, neither being a label a
projection shows. The node's own `defines` is unchanged, because it names the
terms the standing answer defines and the standing answer defines neither
status; a ruling moves the fence's `defines` onto the node with the rest of it.
No unrecorded conflict is left that this movement can find.

### The recommendation and its facts, 2026-09-04

Moves the recommendation from `grant-from-a-ruling` to
`passed-over-options-stay`, which keeps every sentence of the standing answer
and changes one clause. Authority ratified, for the reason the Facts section
gives; boldness high on the answer, moderate on authority; both facts carry
the case against. Persistence unchanged, no shim declared, no existence fact.
`depends` unchanged.

The map of this movement's decisions to fields. The membership rule, the
fence's `## Answer` and the answer fact's `recommends`. What a passed-over
option is, the same, and the gloss on `passed over` in the fence's `defines`.
Passed over against struck, and how a candidate is raised again, the fence's
`## Answer` and the `### answer` prose. The sources the migration wrote, the
fence's `## Answer` for the rule and the `### answer` prose for the
measurement and what is owed. Whether the review's option is dominated, its
own `#### ` subsection and the `### answer` prose, with no status written on
it. The rewritten reason on `keep-every-option-ever-recorded`, its `reason`
field and its subsection. The traditions, the fence's rationale by name, three
of them readings owed. The `bears` entry owed on `pareto-frontier`, this
account. What a ruling for each of the three live options does to the hundred
and four migrated candidates, each option's own subsection. Nothing of this
movement is held only in the session.

The node stands at the review stage with the review owed, no ruling and no
class written for it, and the recommendation acting on nothing.

### Recorded at the review stage, 2026-09-04

The main thread read the draft adversarially before recording it and changed
nothing in it. What it checked rather than took: the standing answer and
rationale are the standing text, and the account before these sections is the
account as it stood, three of its lines rewrapped and no word altered; the
recommendation's high boldness reads in the direction the record uses, where
high is low confidence, so it agrees with the case against it rather than
contradicting it; and the rewritten reason on `keep-every-option-ever-recorded`
is the AI's own mark on its own fact, rewritten because the old reason argued
against the recommendation this draft now makes, which the draft says in the
open.

Two of the unit's three findings are acted on in this landing and one is not.
The mis-attribution it found is corrected: three options on
`commons.systems/disposition-graph/purpose` claimed the author as their source
and are the AI's, which that node's account now records with the test that
found them, and the two sentences repeating the error on
`commons.systems/disposition-graph/alignment-page` are corrected there. Five
further options carrying `source: author` with a graph commit and no date are
named for the survey rather than checked here, because checking them means
reading five sittings. The second `bears` entry owed from
`commons.systems/disposition-graph/pareto-frontier` onto the recommended option
is written in this landing. The three traditions the unit surfaced, Chesterton's
fence, the file-drawer problem with pre-registration, and deprecation rather
than deletion, are owed as readings under this node and are not drafted here.
### The readings this sitting owed, 2026-09-04

Discharged, by the readings unit of the alignment sitting of 2026-09-04 under
the author's bootstrap grant of that day. Three new readings under this node,
each adopted on `passed-over-options-stay` and each carrying a second entry on
`commons.systems/disposition-graph/rejected`'s `passed-over-stays-listed`,
since that node records the three as owed for the pair:
`commons.systems/disposition-graph/file-drawer-and-pre-registration`,
`commons.systems/disposition-graph/deprecation-not-deletion`, and
`commons.systems/disposition-graph/chestertons-fence`. Where this node says in
one section that they are owed under `stub-traditions` and in a later section
of the same day that they are owed as readings under this node, the later
governs, and that is where they are filed. Chesterton's fence carries no entry
on `commons.systems/disposition-graph/evaluation`, whose rationale diverges
from it in part and for a different question; the reading names that relation
as owed when that node's options settle, following `pareto-frontier`'s
precedent.
