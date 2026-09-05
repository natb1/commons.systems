---
question: How are rejected alternatives recorded?
form: rule
stage: maieutic
review:
  verdict: forward
  strength: moderate
  date: 2026-09-05
  of: 509706a8e5bfddceca2a4ea1ef5b372b709f6e32
  commit: a644c2bb101b7f2e652c9c8d0100dd071c17d3d8
  against: "The recommended answer has little ground left of its own once its restatements are cited away. Its membership rule is viable-options' `passed-over-options-stay` seen from this side, its account of what an option carries is dialogue's, its account of what the projections show is alignment-page's, and its rule about the rationale is prose-and-structure's — and findings 4 and 5 show the fence still carries three of those as text rather than as citations, which is what `membership-cited-not-restated` exists to fix. What is left as this node's own is a liquidation the implementation already performed at 29d285d5 and a `defines` entry carrying a bare term with no gloss, and the third claim it makes for itself, that the record keeps no second home for a rejection, is not yet true of the record: projection's own recommended text still proposes a section carrying \"the alternatives the rationale rejected\". So a ratification here spends a ruling on a decision the author will have made one node earlier, and the answer that stands, `non-chosen-viable-options`, is the author's own words already answering the question they asked. Against that: the author asked this question twice, in 2026-09-02 and 2026-09-03, and it is entitled to an answer somewhere; deferred on the authority fact would let that answer act and keep the pair on the frontier to be ruled together, which is the exit the fact's own `against` names."
  survey:
    date: 2026-09-05
    of: c6c1837e0d4be9a0775419d0c48fd35bcdeee4da
facts:
  - name: answer
    options:
      - name: rejected-list-on-node
        source: ai
        ref: "2026-09-03"
        status: passed
        reason: "the fact's options are this list generalised to every decision, and it takes from the rationale the argument by elimination that both reviews asked it to keep"
      - name: rejected-nodes
        source: ai
        ref: "2026-09-03"
        status: passed
        reason: "an option is a candidate answer and a node is a question, so an answer not taken earns no page"
      - name: prose-in-rationale
        source: ai
        ref: "2026-09-03"
        status: passed
        reason: "a heading convention in prose is the ad-hoc-ness the author objected to, and what is left on its side is cost, which the choosing strikes"
      - name: authors-rejected-section-question
        source: author
        ref: "2026-09-02"
      - name: record-rejected-dispositions
        source: author
        ref: "2026-09-03"
      - name: non-chosen-viable-options
        source: author
        ref: "2026-09-04"
      - name: passed-over-stays-listed
        source: commons.systems/disposition-graph/prose-and-structure
        ref: "2026-09-04"
      - name: membership-cited-not-restated
        source: commons.systems/disposition-graph/viable-options
        ref: "2026-09-05"
    recommends: passed-over-stays-listed
    boldness: moderate
    against: "The answer has no ground of its own if the author rules the other way one node earlier: it is `viable-options`' `passed-over-options-stay` restated for this question, so a confirmation here is a second vote on one decision, and `non-chosen-viable-options`, which stands, already answers the question the author asked while keeping their own scoping of what persists."
    stands: non-chosen-viable-options
  - name: authority
    options:
      - name: ratified
      - name: delegated
      - name: deferred
    recommends: ratified
    boldness: moderate
    against: "Ratifying this separately spends a ruling on a question the author will have settled one node earlier, since the answer follows from whichever option wins on `viable-options`; deferred would let it act and keep it on the frontier for the review it is owed."
under:
  - commons.systems/disposition-graph/node
defines:
  - rejected alternative
depends:
  - commons.systems/disposition-graph/viable-options
---
## Disposition

The author, 2026-09-03:
> The under edge disposition lists 'rejected' as prose under 'rationale' - it may make sense to record rejected dispositions, but this seems too ad-hoc.

## Answer

As viable options not chosen, kept on the fact beside the confirmed choice. Every decision on a node is a fact with a list of viable options, as the dialogue node says, and a rejected alternative is an option the author did not choose, or that the recommendation passed over, which stays on the list with the reason it was not taken and the readings bearing on it for as long as the AI holds it viable; an option no longer viable leaves the list, the option that displaced it says why, and version control holds what left. The projections read the structure: the browser shows the confirmed choice first and, on drilling down, the recommendation, the other options, and what each tradition says of each, so what was considered is shown with what was decided rather than recovered from prose by matching a heading. The rationale keeps why the standing answer stands and may cite the options it argues against, since a rationale that argues by elimination has no argument left without them. An option is not a page: an answer that was not taken has no standing and earns no node of its own. When an option is later chosen it becomes the answer, and what it replaced stays on the list while it is still viable.

## Rationale

Amended 2026-09-04 under the author's bootstrap grant of that day, recorded on the viable-options node, from the author's words there: "any non-chosen option which is categorized as 'viable' by the AI - these are all is persisted after confirmation to mitigate regression. This gives a clear mechanical encoding for ADR style 'alternatives considered' documentation." This is `rejected-list-on-node` generalised to every fact and kept after the ruling, and the objection the author carried above, that prose under the rationale seems too ad hoc, is what the structure answers; the fact the second review established, that the projector already reads a rationale heading, no longer decides anything, since the structure exists for regression and the browser's drill-down and not for the projector alone. The options `rejected-list-on-node` and `prose-in-rationale` stay viable as the narrower answers. The review of this text is owed.

## Facts

### answer

`passed-over-stays-listed` is recommended because the question this node asks
has one honest answer under the encoding the record now runs on: a rejected
alternative is not a section, a list, or a node, it is a row on the fact it
answers, and what distinguishes it from the option that won is a status and a
clause. The standing answer says that of an option the author did not choose
and leaves out the larger half, the candidate the AI rejected before the author
ever saw it — a hundred and two of them at graph commit 417b8335, across
twenty-eight nodes, and a hundred and thirty across thirty-four at 68367776,
counted on the field itself with
`git grep -c -E '^ +status: passed *$' <commit> -- disposition-graph`; the
figures first written here counted the string unanchored and so counted the
prose that discusses the field, which is how they came out at a hundred and
four and a hundred and forty-four — and every one of those is a rejection the
author is entitled to read. The recommended option is the standing answer with that half
included. It is the same decision that
`commons.systems/disposition-graph/viable-options` puts to the author as
`passed-over-options-stay`, seen from this side: that node decides what an
option is and when it is listed, this one decides what a rejected alternative
is and where it lives, and neither restates the other.

Moderate boldness. What is the AI's own here is not the membership rule. That
departure from the author's scoping words is carried at high boldness on
`commons.systems/disposition-graph/viable-options`, where the author rules on
it with the reviewer's alternative beside it, and this node cites it rather
than deciding it, as the clean-context review of
`commons.systems/disposition-graph/prose-and-structure` on 2026-09-04 required
of any node that is not the one whose question it is. What rests on the AI
here is narrower and is named: that the record holds no rejected list, section,
or node anywhere, so the browser's match on a `Rejected` heading in a rationale
is liquidated with the prose it read; and that `rejected alternative`, a term
the record uses throughout and which the kickback of 2026-09-03 found no node
defining, is defined here.

**What the author's question of 2026-09-02 comes to.** They asked, in words
`commons.systems/disposition-graph/node` carries verbatim, "What is the
rejected section a projection of", and proposed "An authority section projected
into the documentation (with notes on pending ratification for deferred
authority)" in its place. Under the recommended answer the first question has a
plain answer and it is the diagnosis: the section was a projection of nothing.
It was a heading in prose that the browser matched, with no data behind it, so
there was nothing it projected and nothing that could be checked — which is
what made it read as ad hoc, and what documenting the convention would not have
cured. The authority section they proposed is granted in substance and without
a section: every fact is listed with every option, each option carrying its
status, the recommendation among them and the ruling where the author has given
one, which is the notes on what is pending; and the rejected alternatives are
the rows in that list carrying the status passed, each with the clause saying
why. Nothing in the record is called a rejected section, a rejected list, or a
rejected node.

**The kickback of 2026-09-03 and the discrepancy it named.** Its findings are
answered one by one in the account below and in the fence. The discrepancy that
earned it, a recommendation naming `rejected-list-on-node` while this node's
own reply of the same day argued for `prose-in-rationale`, is gone twice over:
the recommendation has since moved, and the encoding that carried the
discrepancy — an Options block with a `(recommended)` marker beside a separate
`adopts` field, three readings of one recommendation — no longer exists, so the
class of clerical hazard the finding named is closed by the encoding and not by
hand. Both of the options in that dispute stay on the fact, each now carrying
the reason it was passed over.

#### rejected-list-on-node

A rejected list on the node, each entry one alternative answer and why it lost, projected in the authority section, with the rationale keeping only why the standing answer stands. It is a schema change, and adopting it means rewriting the rejected prose of purpose, authority, node, instruments, readings, namespaces, projection and model before any of them is recorded. The reviews ask it to say what an entry contains, whether an entry is versioned if the alternative is later adopted, and that a rationale may cite its rejected entries. It was passed over because the fact's options are this list generalised to every decision on the node rather than to the answer alone, and because it takes from the rationale the argument by elimination that both reviews of 2026-09-03 asked it to keep. The three refinements those reviews asked for are answered in the recommended option, which says what an entry carries, that an option later chosen becomes the answer with the option it displaced staying beside it, and that a rationale may name an option in the course of its argument. What it would have cost to adopt inside the batch of 2026-09-03 is not part of the reason: cost is struck from the choosing, and in the event the migration of 2026-09-04 rewrote the prose anyway.

#### rejected-nodes

Rejected alternatives become nodes of their own carrying a rejected class. It is the boldest of the three options and was neither recommended nor withdrawn when it was raised. It was passed over because a node is a question and an option is a candidate answer to one, as `commons.systems/disposition-graph/node` says, so an answer that was not taken earns no page; and because a rejected class would be a stamp written on the one thing whose class `commons.systems/disposition-graph/viable-options` derives from rulings, of which a rejected option has none.

#### prose-in-rationale

Rejected alternatives stay prose in the rationale, as now, with the browser's heading match documented as the contract rather than left as an accident of the template. The second review of 2026-09-03 established that the projector already renders a rejected section from a rationale heading, so the projection the author asked for needs no schema change, and this node's reply of that day said the fact "materially favours the third option at zero cost". It is passed over now, and the passing overturns that reply. The fact was true at the kickback and is no longer: the match was liquidated at implementation commit 29d285d5, and the projector's tests now assert that a heading named Rejected renders as prose; and it decided nothing while it held, for two reasons. The author's objection was that the rejected section "seems too ad-hoc", and a heading convention in prose is exactly that: documenting a convention writes it down without making it checkable, which the kickback of 2026-09-03 said in its own words against itself. And what is left on this option's side once that is answered is cost, which `commons.systems/disposition-graph/evaluation` strikes from the choosing by name — what a change costs to migrate, how many files it touches, what reviews it spends, and that the incumbent already does it the other way. With the struck arguments removed nothing remains on which this option is better, which is what dominated means; it stays on the fact and the author may rule for it.

#### authors-rejected-section-question

The author's own proposal of 2026-09-02, carried verbatim on `commons.systems/disposition-graph/node`:

> What is the rejected section a projection of. Should it be associated with the deferred authority somehow? An authority section projected into the documentation (with notes on pending ratification for deferred authority) would make more sense than a "rejected" section which seems ad-hoc.

As a candidate answer it says the rejected section goes and an authority section takes its place, carrying the notes on what is pending. It is adopted into the recommended option and stays viable, because the recommendation grants what it asks and grants it without a section: the facts themselves are that list, the notes on what is pending are each option's status and recommendation and ruling, and the rejected alternatives are the rows carrying the status passed. A ruling for this option as the author stated it takes the section as well. The words are the option, which is why they are quoted here; their home is `commons.systems/disposition-graph/node`, which carries them verbatim and dated in its `## Disposition`, and this node's `## Disposition` is not enlarged to hold a second copy.

#### record-rejected-dispositions

The author's words of 2026-09-03, which this node's own `## Disposition` carries and which were raised here from `commons.systems/disposition-graph/under`: recording rejected dispositions may make sense, and listing them as prose under the rationale is too ad hoc. As a candidate answer it says the rejections are recorded and says nothing about where, which is what the other options answer. It is adopted into the recommended option and stays viable: the recommendation grants both halves, they are recorded, on the fact, each with the reason it was not taken, and the prose goes, which is `commons.systems/disposition-graph/prose-and-structure`'s rule and not this node's. The sentence this subsection carried until 2026-09-04, that the browser's heading match materially favours keeping the prose, is struck from it: that is the case for `prose-in-rationale` and it now sits on that option, with the reason it no longer decides.

#### non-chosen-viable-options

A rejected alternative is a viable option the author did not choose, kept on the fact beside the confirmed choice with the reason it was not taken and the traditions bearing on it; the projector reads the structure and the rationale cites it. It is `rejected-list-on-node` generalised to every fact, and the fact the second review established, that the projector already reads a rationale heading, no longer decides the question, since the structure exists for regression and for the browser's drill-down and not for the projector alone. The author's objection carried above, that prose under the rationale seems too ad hoc, is what the structure answers. Raised on commons.systems/disposition-graph/viable-options, from the author's words of 2026-09-04 recorded there. It is the answer as it stands, and the recommendation keeps it whole and adds the half it leaves out, the candidate the AI rejected before the author saw it. What a ruling for it does depends on how "viable" is read, which is `commons.systems/disposition-graph/viable-options`' question and not this one's: read as dominance, the hundred and two candidates the migration of 2026-09-04 recorded are not viable, so they leave their facts and the `status` key leaves the reader with them; read as the author used the word, a candidate the AI categorized as worth recording, which is that node's option `viable-not-chosen-as-it-stands`, they stay as options with no status and the AI's dominance judgment returns to each option's prose. That one sentence has two consequences is why the two nodes are ruled together and why this one's `depends` names that one.

#### passed-over-stays-listed

A rejected alternative is any candidate the AI considered and can name, kept on the fact with its status and the reason it was not taken, whether or not the AI still holds it viable: `status: passed` with its `reason`, as `viable-options`' option `passed-over-options-stay` encodes it. Version control holds what the record no longer carries, the full text of an answer an option displaced, and the rejected passages of the rationales migrate as options passed over; the rationale argues and does not list. Raised on commons.systems/disposition-graph/prose-and-structure, whose clean-context review of 2026-09-04 found the membership rule to be this node's and `viable-options`'. Two decisions of this node's own go with it: that the record holds no rejected list, no rejected section, and no rejected node anywhere, so the browser's match on a heading beginning `Rejected` in a `## Rationale` is liquidated with the prose it read; and that `rejected alternative` is defined here, which the kickback of 2026-09-03 said was owed and which this node's `defines` now carries. Adopted by the recommendation and set out in the fence.

#### membership-cited-not-restated

The same answer with the membership rule cited and not restated. The
recommended text says that none leaves the list, that an option is struck only
by the author, and that the AI's judgment about an option is written on the
option and never worked by removing it, and then cites the viable-options node
as deciding exactly that; the citation is right and the three clauses before it
are a second copy of a rule this node does not own. Under this option the
sentence names the deciding node and stops, so an amendment there does not
leave a stale copy standing here. The second reading of 2026-09-05 found two
further restatements of the same kind in the recommended text, the enumeration
of what an option carries, which is the dialogue node's, and the account of
what the projections show per option, which is the alignment-page node's and,
at the first level, `what-an-option-row-carries`'; both were cut to citations
in the amendment of that date, so this option now names the practice and not
three clauses of it, and a ruling for it is a ruling on the practice.

### authority

Ratified. What this node decides is where every rejected candidate in the
record lives, and under the recommended answer there is nowhere else: version
control is not a projection, so an answer that is wrong here loses the record's
account of everything it decided against, which is expensive and is not
reversible by reading the record. It is capture-shaped in the small as well,
since the party deciding what a rejected alternative is, is the party whose
rejections most of them are. Delegated would hand the AI the rule that governs
the visibility of the AI's own rejections. Deferred is what the record is doing
under a bootstrap grant already, the status materialized and the author having
ruled on none of it, but a class is the author's to confer and the AI writes
none for itself. Moderate boldness: the escalation is the record's own rule,
and what rests on the AI is the judgment that the loss is not reversible.

## Recommendation

```markdown
---
question: How are rejected alternatives recorded?
form: rule
under:
  - commons.systems/disposition-graph/node
defines:
  - rejected alternative
---
## Answer

As options on the fact they answer, carrying the status the AI's judgment gives them. There is no rejected list, no rejected section, and no rejected node in this record: what was rejected is on the fact beside what was chosen, in the options the record already holds, and nowhere else. Every candidate the AI considered and can name is an option on the fact it answers, whether or not the AI still holds it viable, so a rejected alternative is a row on that list carrying whatever status the viable-options node's answer gives it: passed, with the one clause saying why, where the AI holds it dominated on the record's criteria; none where the author simply did not choose it, since the author's ruling is a ruling for the option they took and not against the rest; and whatever mark that node gives an option adopted into the answer, which stays listed with its adoption noted. None leaves the list. An option is struck only by the author, and the AI's judgment about an option is written on the option and never worked by removing it, as the viable-options node decides. When an option is later chosen it becomes the answer, and the option it displaced stays on the list with its sentence, the full text it carried surviving in version control.

What an option carries is the dialogue node's enumeration and is cited here rather than given again; what this node adds to it is the one field a rejection needs, the reason beside the status. The projections read that structure and never the prose, so what was considered is shown with what was decided rather than recovered by matching a heading, and the browser's match on a heading beginning "Rejected" in a `## Rationale` is liquidated with the prose it read. What the browser and the alignment page show for each option is the alignment-page node's question and, at the row's level, `what-an-option-row-carries`', on which the author's words of 2026-09-04 stand and no answer of this node's is put.

The rationale argues and does not list. It says why the standing answer stands and why the candidates it beat fell, in the argument's own sentences, and it may name an option in the course of that argument, since a rationale that argues by elimination has no argument left without them; it may not restate the option list beside the fact that holds it, which is the prose-and-structure node's rule and not this one's. An option is not a page: an answer that was not taken has no standing and earns no node of its own, a node being a question and an option a candidate answer to one.

What the author asked in 2026-09-02, what the rejected section is a projection of, is answered by the same structure and the answer is the diagnosis: it was a projection of nothing, a heading in prose with no data behind it, which is why it read as ad hoc and why documenting the convention would not have cured it. The authority section proposed in its place, with its notes on what is pending, is the facts as the page now lists them, every fact with every option, each carrying its status, the recommendation among them and the ruling where one has been given; and the rejected alternatives are the rows in that list that carry the status passed.

## Rationale

Recorded on the author's words of 2026-09-03, carried above, that the under edge lists rejected as prose under the rationale, that recording rejected dispositions may make sense, and that this "seems too ad-hoc"; and on their words of 2026-09-02, carried on the node node, asking "What is the rejected section a projection of" and proposing "An authority section projected into the documentation (with notes on pending ratification for deferred authority)" instead. Both objections have one cause and one fix. The cause is that the rejected section was prose with nothing behind it: the projection the author asked after had no source, and the convention that produced it could not be checked, so writing the convention down would have left it exactly as ad hoc as it was. The fix is that the candidates are data on the fact they answer, which is where the decision they lost is, so the section is not replaced but dissolved.

What a rejected alternative is follows from what an option is, which is the viable-options node's question and is cited here rather than restated. What this node adds is that the two kinds of rejection, the AI's and the author's, are one row with a different mark on it, and that the record keeps no second home for either — which this answer decides and the record does not yet satisfy: `projection`'s recommended text still proposes a documentation section carrying "the alternatives the rationale rejected", and the option `rejected-alternative-is-an-option` is recorded there on 2026-09-05, sourced here, so that node's ruling meets this one. Amended 2026-09-04 from the answer that said this of the author's rejections alone and left the AI's outside the record: the larger half is the AI's, and the reason the author gave for persisting options at all, regression, bears on that half at least as hard, since a later session is at least as likely to re-propose a candidate that was rejected as dominated.

Traditions bearing on this answer, each a reading filed under the viable-options node and bearing on the option recommended here, each adopted: the file-drawer problem and pre-registration, which say that a candidate tried and failed leaves a record or its absence distorts the record, so the same candidate is tried again; deprecation rather than deletion, which says the mark and not the removal is the act, since the parties who would meet the removal are not in the room; and Chesterton's fence, which puts on the remover the burden of saying why the thing was there, so an option is struck only with its reason stated. Three more bear on it through the nodes whose options this answer cites: the decision-record form on the dialogue node, whose considered options are kept with the reason each lost beside the decision, which is the shape this answer takes; IBIS and the Pareto frontier on the viable-options node, the one attaching every argument to a position so a candidate with no row has nowhere for its argument to live, the other making the AI's mark a dominance judgment rather than a preference, which is why a passed-over option is still one the author may rule for. What this costs is that a fact's option list runs as long as its rationale's prose used to, at the census the viable-options node states and this one cites rather than restates; that is the consequence of putting them where they can be read and not a reason against it.
```

## Account

### Sitting on purpose, 2026-09-03

**Rejected alternatives**

Today they are prose in the rationale, which the author finds ad hoc, and the authority section is to project them. Decision records (Nygard, 2011; MADR) keep the considered options as structure with the reason each lost; IBIS keeps every position with the arguments against it. A list on the node gives the projector the structure and keeps the rationale to why the standing answer stands.

Options:
- (recommended) A rejected list on the node, each entry one alternative answer and why it lost, projected in the authority section; the rationale keeps only why the standing answer stands — authority ratified; boldness moderate; persistence standing; a schema change
- Rejected alternatives as nodes of their own with a rejected class — authority ratified; boldness high; persistence standing
- Prose in the rationale, as now — authority ratified; boldness low; persistence standing

Feeds: `node`, `under`, `projection`, `purpose`, `authority`

Responses open: confirm the recommended option; confirm with edits, naming another option; deny with feedback.

### Clean-context review, 2026-09-03

Read in clean context by a subagent given the node, its ancestry, and the author's words, and nothing of the sitting. Verdict: forward to the author's ruling.

Findings:

- Every draft in this batch writes its rejected alternatives as rationale prose, and node's draft states that pattern: 'The rationale says why, and which alternatives were rejected and for what reason.' Adopting option 1 means rewriting purpose, authority, node, instruments, readings, namespaces, projection and model before they are recorded. The option does not say so. Suggested edit: state the ordering consequence in the facts.
- The option says 'the rationale keeps only why the standing answer stands'. Several rationales argue by elimination, so the reason the answer stands is the reason the alternatives fell; readings' rationale reduces to 'parsimony of mechanism against parsimony of files'. Splitting them can leave the rationale without its argument. Suggested edit: say that a rationale may cite its rejected entries.
- The option does not say what a rejected entry contains: a title and a reason, or the alternative answer's text; nor whether an entry is versioned if the alternative is later adopted. The proposals in this batch already use title, dash and reason, which is structure by convention.

On the three facts: Ratified, moderate boldness, standing, and a schema change, is right. The facts should add that adopting it requires rewriting eight drafts in this same batch before any of them is recorded.

Strongest counter-argument (weak): The author's objection was that the '### Rejected' section 'seems too ad-hoc' as a projection source, and projection's draft already answers it by projecting the alternatives into the authority section. If the projector can read them from the rationale prose, the schema change buys structure for the projector at the price of a field every node must maintain and that will accumulate entries nobody prunes, which is the drift the record resists; if it cannot, the change is required. The proposal does not say which, so the case for option 1 rests on an unstated fact about the projector. Establishing that fact is cheap and would settle the question without a schema change.

### Clean-context review, 2026-09-03

Read in clean context by a subagent given the node, its ancestry, and the author's words, and nothing of the sitting. Verdict: forward to the author's ruling.

Findings:

- The counter-argument says 'the case for option 1 rests on an unstated fact about the projector' and that establishing it is cheap. Established: packages/disposition/browser-template.html line 439 matches a rationale heading with /^rejected\b/i and renders it as a '.rejected' section, so the projector already reads rejected alternatives from rationale prose and no schema change is required for the projection the author asked for. That fact belongs in the node and materially favours option 3.
- Every draft in this batch writes its rejected alternatives as rationale prose, and node's draft states the pattern: 'The rationale says why, and which alternatives were rejected and for what reason.' Adopting option 1 means rewriting purpose, authority, node, instruments, readings, namespaces, projection and model before they are recorded. The option does not say so.
- The option says 'the rationale keeps only why the standing answer stands'. Several rationales argue by elimination, so the reason the answer stands is the reason the alternatives fell; readings' rationale reduces to 'parsimony of mechanism against parsimony of files'. Suggested edit: say a rationale may cite its rejected entries.
- The option does not say what a rejected entry contains, nor whether an entry is versioned if the alternative is later adopted. The Proposals in this batch already use title, dash and reason, which is structure by convention.

On the three facts: The frontmatter recommendation (ratified, moderate) is right for option 1 as stated. Now that the projector fact is established, the facts should say that option 1 is optional rather than required, and that adopting it requires rewriting eight drafts in this batch before any is recorded.

Strongest counter-argument (moderate): The author's objection was that the '### Rejected' section 'seems too ad-hoc' as a projection source, and the projector already reads it, so the schema change buys structure for the projector at the price of a field every node must maintain and that will accumulate entries nobody prunes — the drift the record resists elsewhere. With the projector fact now established, option 3 (prose in the rationale, as now) answers the author's objection at zero cost, provided the browser's heading match is documented as the contract rather than left as an accident of the template.

The session's reply: Validated: the browser renders a rejected section from a rationale heading, so the projection the author asked for needs no schema change, which favours the third option; the first option would rewrite eight drafts before recording, and a rationale may cite its rejected entries. Stage ruling.

### Re-encoding, 2026-09-03

Re-encoded on 2026-09-03 under the author's bootstrap grant on the dialogue node, against graph commit 6d21d356: the account section, formerly named the proposal, and the recommended text, formerly the draft, were renamed, and the dialogue state was written as data.
Alternatives pending, with their sources: `rejected-list-on-node` (ai, 2026-09-03); `rejected-nodes` (ai, 2026-09-03); `prose-in-rationale` (ai, 2026-09-03); `authors-rejected-section-question` (author, 2026-09-02, from commons.systems/disposition-graph/node); `record-rejected-dispositions` (author, 2026-09-03, from commons.systems/disposition-graph/under).
The recommendation adopts `rejected-list-on-node` and is pinned to the standing text as it was at that commit. The recommended text was drafted at the re-encoding from the option the account marks recommended, so that the recommendation adopts an alternative with a text and not only a name; the earlier review read the options and not this text, so it is removed and the node returns to the review stage for the clean-context review of the batch.
Merge analysis of the author's words: 2026-09-03, own-question: The under edge disposition lists rejected as prose under rationale; recording rejected dispositions may make sense but this seems too ad hoc.
The census unit's note: The node has no answer and no draft; its three options are the alternatives and adopts names the one the Options block still marks recommended. I flag a discrepancy the session must resolve: the second review's session reply says the established projector fact favours the third option, yet neither the recommended marker nor the frontmatter recommendation was moved, which is the same clerical hazard quotes' review named and which quotes did fix. If the reply is taken as the recommendation, adopts should be prose-in-rationale instead. I folded the counter-argument's condition, documenting the browser's heading match as a contract, into the third option's text rather than minting a fourth, and left the reviews' three refinements of option one, the entry's contents, versioning, and a rationale citing its entries, inside the first option's text. Nothing goes elsewhere: the eight drafts the first option would rewrite are a consequence of the ruling, not a separate proposal against those nodes.

### Clean-context review, 2026-09-03

Read in clean context by a subagent given the batch at the review stage and the full graph as its context, and nothing of the sitting. Verdict: kicked back to the maieutic stage.

Findings:

- The recommendation adopts `rejected-list-on-node` while the node's own session reply of 2026-09-03 says the opposite: 'Validated: the browser renders a rejected section from a rationale heading, so the projection the author asked for needs no schema change, which favours the third option; the first option would rewrite eight drafts before recording.' The Options block still marks option 1 '(recommended)'. Verified in the file: `recommendation.adopts` is `rejected-list-on-node` and line 89 carries '(recommended) A rejected list on the node'. The ruling this node opens is 'confirm the recommended option', so an author confirming as shown would take the option the record's own reply argued against. This is why the verdict is a kickback: the recommendation cannot be put to the author as it stands. It is the same clerical hazard that forms, quotes and purpose-criteria all fixed by moving the marker, and it is the one instance left unfixed — the re-encoding's own note flags it and defers it to this review.
- The recommended text is drafted from the marker rather than from the reply, so the fence is a full answer for option 1 and no text exists for option 3. If the recommendation moves to `prose-in-rationale`, a recommended text must be drafted for it — which is a maieutic act, not an amendment, and is the second reason for the kickback.
- Recommendation fence, Rationale: 'The browser today finds the rejected alternatives by matching a heading in the rationale, which works and is an accident of the template rather than a contract.' Verified: browser-template.html matches a rationale heading with /^rejected\b/i and renders a '.rejected' section. The fact is stated correctly in the fence and is the fact that decides the question the other way.
- Adopting option 1 requires rewriting the rejected prose of eight recommendation fences in this same batch before any of them is recorded — purpose, authority, node, instruments, readings, namespaces, projection and model. The fence says the cost is 'paid once'; it does not say that it falls inside this batch and would reopen eight texts the author is about to rule on.
- The node's answer would define 'rejected alternative', a term the record uses throughout and no node's `defines` carries today. Whichever option is taken, the defines entry is owed and only option 1's fence carries it.

On the three facts: The frontmatter recommendation (adopts rejected-list-on-node, ratified, moderate) states one class and one value and the `amends` pin matches the standing text, so the recommendation is not stale in the pin's sense. It is stale in the sense that matters: the node's own reply moved the argument to option 3 and neither the marker nor the `adopts` field followed, so the data, the marker and the reply give three readings of one recommendation. Persistence standing follows from the node's shape; the fence correctly names option 1 as a schema change.

Strongest counter-argument (moderate): The author's objection was that the rejected section 'seems too ad-hoc' as a projection source, and the projector already reads it, so the schema change buys structure for the projector at the price of a field every node must maintain and that will accumulate entries nobody prunes — the drift the record resists elsewhere. Option 3 answers the author's objection at zero cost provided the browser's heading match is documented as the contract rather than left as an accident of the template, which is what the option's own text now says. The counter to that is thin: a heading convention is exactly what the author called ad hoc, and documenting a convention does not make it checkable.

The session's reply: Kickback to the maieutic stage accepted: the recommendation names option 1 while the node's own reply argues for option 3, and option 3 has no recommended text, so the redraft is the sitting's. The recorded discrepancy is what this review was asked to rule on.

### Frontier finding, 2026-09-03

Kind: contradiction.

Rejected's recommendation adopts `rejected-list-on-node`, its Options block still marks that option '(recommended)', and its own session reply of the same day says the opposite: 'Validated: the browser renders a rejected section from a rationale heading, so the projection the author asked for needs no schema change, which favours the third option; the first option would rewrite eight drafts before recording, and a rationale may cite its rejected entries.' Verified in the file: `recommendation.adopts` is `rejected-list-on-node`, line 89 carries the '(recommended)' marker on option 1, and the re-encoding note flags the discrepancy and hands it to this review — 'If the reply is taken as the recommendation, adopts should be prose-in-rationale instead.' The dialogue node's reconciliation account records the same thing: 'Rejected's account favours its third option while its marker and its recommendation name the first; the recommended text follows the marker, and the discrepancy stands in its account for the review.' The ruling this node opens is to confirm the recommended option, so an author confirming as shown would ratify a schema change the record's own reply argued against, and one that requires rewriting the rejected prose of eight recommendation fences in this same batch before any of them is recorded. Forms, quotes and purpose-criteria each carried the identical hazard and each was fixed by moving the marker; this is the one instance left.

Names only this node.

Proposed: Rejected is kicked back to the maieutic stage, which is where the recommendation is redrafted: either the marker and `adopts` move to `prose-in-rationale`, in which case a recommended text must be written for it, since the fence that exists is a full answer for option 1 and there is none for option 3; or the account says why option 1 stands against the fact its own reply established. The record should not put a recommendation to the author that the node's own reply argues against, and the fix is not an amendment, because the option the reply favours has no text.

### The maieutic movement, 2026-09-04

The redraft the kickback of 2026-09-03 asked for, run now because the question
this node answers has been decided from outside twice since then and the node
never caught up. On 2026-09-04 the sitting on
`commons.systems/disposition-graph/viable-options` amended this node's answer
under the author's grant, moving the recommendation to
`non-chosen-viable-options` without a fence, since the new recommendation was
what stood. Later that day the clean-context review of
`commons.systems/disposition-graph/prose-and-structure` found that the
membership of an option list belongs to this node and to `viable-options`, and
recorded `passed-over-stays-listed` here as the option that would answer it.
The migration under the grant then wrote a hundred and four passed options into
the record. So the node's standing answer, the record's data, and the option
list have said three different things about the same question, and this
movement makes them say one.

**The kickback's five findings, answered.**

1. *The recommendation names one option while the node's own reply argues for
   another.* Answered by the encoding and by this movement. The Options block
   and its `(recommended)` marker are gone, and with them the three readings of
   one recommendation the finding named; a fact now carries `recommends` and
   nothing else claims to. The recommendation itself has moved twice and now
   names `passed-over-stays-listed`, with the reply's own candidate,
   `prose-in-rationale`, on the fact carrying the reason it was passed over —
   which is the part of the finding that survives, and it is answered on the
   merits in that option's subsection rather than by moving a marker.
2. *No recommended text exists for the option the reply favours; drafting one
   is a maieutic act.* Accepted as the reason this is a maieutic movement and
   not an amendment. A fence is written here for the option that is
   recommended, and it is the first fence this node has carried since the
   one drafted for `rejected-list-on-node` was removed at the re-encoding.
3. *The browser reads a rejected section from a rationale heading, and the
   fact decides the question the other way.* The fact is re-verified at this
   commit: `packages/disposition/browser-template.html` matches a heading in a
   rationale with `/^rejected\b/i` and renders it as a `.rejected` section. It
   no longer decides the question, and the fence says what happens to it: the
   match is liquidated with the prose it read, since a projection renders the
   structure and never reads prose for what the structure holds. The reason it
   no longer decides is not that the fact changed but that the argument it
   supported was a cost argument, and `commons.systems/disposition-graph/evaluation`
   strikes those from the choosing.
4. *Adopting the list would rewrite eight fences inside the batch.* Struck as a
   reason by the same rule, and moot in fact: the migration of 2026-09-04
   rewrote thirty-four nodes and forty-four passages, and the count is on
   `commons.systems/disposition-graph/prose-and-structure`. It is stated on
   `rejected-list-on-node` as a consequence and not as a ground.
5. *The `defines` entry for "rejected alternative" is owed and only one fence
   carried it.* Accepted. The node's `defines` gains the bare term now, since
   the standing answer already defines it, and the fence carries it too. It
   takes no gloss: a gloss is the sentence a projection shows where the record
   shows the term as a label on an option's row, and "rejected alternative" is
   never such a label. The two that are, `viable` and `passed over`, are
   glossed on `commons.systems/disposition-graph/viable-options`, which owns
   them.

**The three classes of finding.** Contradictions within the graph: this node's
standing answer says an option no longer viable leaves the list while a hundred
and four such options sit in the record and the reader enforces the key that
carries them, which is the same contradiction `viable-options` carries and is
resolved on that node; and the answer's own licence, that "the rationale keeps
why the standing answer stands and may cite the options it argues against", was
read by `prose-and-structure`'s draft as licensing the prose lists it wanted to
liquidate, so the fence narrows it to naming an option in an argument and
points at that node for the rest. Between the graph and the AI's knowledge: a
list that is curated by deletion cannot be audited, because what would show the
curation was wrong is what the curation removed; every practice that curates
for a decider keeps the long list somewhere, and this record has no somewhere
else. Redundant seams: two, the `Rejected` heading match beside the fact's
options, and this node's answer restating the membership rule that
`viable-options` owns; the fence closes the first by liquidating the match and
the second by citing rather than restating.

**Evaluated twice.** Fresh: written from scratch, a rejected alternative is not
a kind of thing at all, it is a state of an option, so it needs no container of
its own and every container the record has offered for it — a section, a list,
a node — was an answer to a question the encoding had not yet made unnecessary.
With reference to tradition: the decision-record form under
`commons.systems/disposition-graph/dialogue`, whose considered options with the
reason each lost sit beside the decision, is the form this answer takes; IBIS
under `commons.systems/disposition-graph/viable-options`, whose arguments
attach to positions and not to the issue, is why a candidate needs a row before
it can have a reason; the Pareto frontier under the same node is what makes the
AI's mark a dominance judgment the author may overrule. Each is named in the
fence's rationale and none is restated. No tradition surfaced here that
`viable-options` did not surface first, and the three owed there — the
file-drawer problem and pre-registration, deprecation rather than deletion, and
Chesterton's fence — are owed for the pair.

**Tested against the record it joins.** The `under` chain runs `node` to
`model` to `purpose` to `agency`; nothing above is ratified, so nothing here is
written over doctrine. `depends` names
`commons.systems/disposition-graph/viable-options` by the node id and not by an
option: the `#option` form records that a node stands under one side of a
divergence, and this node's answer changes under whichever option wins there
rather than surviving on one side and falling on the other, so the qualified
form would tell the page something false. `commons.systems/disposition-graph/prose-and-structure`
depends on this node and on that one and cites both for membership.
`commons.systems/disposition-graph/node`, this node's parent, says "The
rationale says why, and which alternatives were rejected"; the option
`rationale-argues-facts-list` is recorded there with `prose-and-structure` as
its source and answers it, so nothing is recorded on `node` from here.
`commons.systems/disposition-graph/rationale-edge`, "weighing the alternatives
it rejected", is argument and needs no change. The two reviews of 2026-09-03
that forwarded this node read a recommendation that no longer exists, and the
kickback's pin is older than everything above it, so the node is flagged as
changed since its review and both readings are owed before the author rules.

**The map of this movement's decisions to fields.** That a rejected alternative
is a status on a row and never a section, list, or node: the fence's
`## Answer` and the answer fact's `recommends`. What the author's question of
2026-09-02 comes to: the fence's `## Answer` and `## Rationale`, and the
subsection on `authors-rejected-section-question`. The liquidation of the
browser's heading match: the fence's `## Answer`. The three options passed over
and why: their `status` and `reason` fields and their subsections. The two
author-sourced options adopted into the recommendation: their subsections, with
no status written on either. The term defined: `defines`, bare, on the node and
in the fence. The boldness and what rests on the AI: the `### answer` prose.
The case against each recommendation: the `against` field on both facts. The
kickback's five findings: this section. Nothing of this movement is held only
in the session.

The node stands at the review stage with both readings owed, no ruling and no
class written for it, and the recommendation acting on nothing.

### Recorded at the review stage, 2026-09-04

The main thread read the draft adversarially before recording it and restored
one field it had dropped. The draft was built without the `against` line on the
`review` block, the counter-argument the 2026-09-03 reading returned, which was
backfilled onto all fifty-four reviewed nodes at graph commit 9cba6f5c while
the unit was working. The line is restored verbatim from the record. Nothing
in the draft depended on its absence, and the validator would not have caught
it: an optional field silently dropped is the failure mode a design unit that
copies a node forward has, and the check for it is a diff against the live node
rather than a validation of the result. The account still carries the same
counter-argument in prose, where the sitting recorded it; the field is what the
frontier and the page read.

Otherwise the draft stands as written. The three newly passed options carry
their reasons, `defines` gains "rejected alternative", and the standing answer
and rationale are unchanged, as is the account before this section. The node
moves to the review stage with its 2026-09-03 kickback still pinned to the
draft it read, so the frontier shows the recommendation as moved since.
### The readings owed for the pair, 2026-09-04

Discharged with `viable-options`', by the readings unit of the alignment
sitting of 2026-09-04 under the author's bootstrap grant of that day. The three
this node records as owed for the pair,
`commons.systems/disposition-graph/file-drawer-and-pre-registration`,
`commons.systems/disposition-graph/deprecation-not-deletion` and
`commons.systems/disposition-graph/chestertons-fence`, are filed under
`viable-options` and each carries a second `bears` entry on
`passed-over-stays-listed` here.

### Clean-context review, 2026-09-05

Read in clean context by a subagent given this draft, its ancestry, its siblings, the nodes it names, and the index of every question the record asks, and nothing of the sitting. Verdict: forward to the author's ruling.

Findings:

- Facts, `#### passed-over-stays-listed`: "that `rejected alternative` is defined here, which the kickback of 2026-09-03 said was owed and which no node's `defines` carries today". Stale: this node's own frontmatter carries `defines: - rejected alternative` (rejected.md lines 55-56) and the fence carries it too. Suggested edit: "which the kickback of 2026-09-03 said was owed and which this node's `defines` now carries".
- Facts, `#### prose-in-rationale`: "The fact is still true — `packages/disposition/browser-template.html` matches a rationale heading with `/^rejected\b/i` and renders it as a section", repeated in the Account ("re-verified at this commit: `packages/disposition/browser-template.html` matches a heading in a rationale with `/^rejected\b/i` and renders it as a `.rejected` section"). False at the implementation as it stands: the template has no match on `rejected` (grep count 0); `git log -S'rejected' -- packages/disposition/browser-template.html` shows it removed at greenfield 29d285d5; and `packages/disposition/project.test.mjs` lines 805 and 1316 assert that a `Rejected` heading renders as ordinary prose. The fence's own sentence, that the match "is liquidated with the prose it read", is the one that holds. Suggested edit: "The fact was true at the kickback and is no longer: the match was liquidated at greenfield 29d285d5, and the projector's tests now assert a heading named Rejected renders as prose", with the same correction in the Account.
- Answer (fence): "When an option is later chosen it becomes the answer, and the text it displaced stays on the list", and Facts, `#### rejected-list-on-node`: "an option later chosen becomes the answer with the text it displaced staying beside it", and `#### passed-over-stays-listed`: "Version control holds nothing the record does not". Under the dialogue node's encoding only the recommended option carries its text in full and "every other option carries its sentence and no text of its own"; the option that stands has its text in `## Answer`. So what stays when a choice is displaced is the option, with its sentence, source, ref and readings, and the displaced answer's full text survives only in version control, which the third quotation denies. Suggested edit: "the option it displaced stays on the list with its sentence", and strike or qualify "Version control holds nothing the record does not".
- Answer (fence, Rationale): "a hundred and four passed candidates across twenty-nine nodes at the graph commit this was written against", and Facts prose: "a hundred and four of them in the record today, across twenty-nine nodes". The fence names no commit, so the count cannot be checked from the text; verified as 104 options on 29 nodes at graph commit 417b8335 (`git grep -c 'status: passed' 417b8335 -- disposition-graph`, excluding this node's own prose mention), the pin viable-options states for the same measurement, and 144 on 36 at the graph's HEAD, so "today" in the Facts prose is already stale. Suggested edit: name 417b8335 in both places, or drop the count from the fence and cite viable-options, which pins it.
- Answer (fence, Rationale): "Traditions, each a reading with its own node: the decision-record form under the dialogue node ...; IBIS under viable-options ...; and the Pareto frontier under the same node". None of madr-decision-records, ibis-issue-based-information or pareto-frontier carries a `bears` entry on this node or on `passed-over-stays-listed`; the three readings that do (file-drawer-and-pre-registration, deprecation-not-deletion, chestertons-fence, each at line 28, and named by this node's own Account as "the three this node records as owed for the pair") are not named in the rationale. The evaluation rule records every tradition surfaced as a reading with the resolution it informed, and the readings rule resolves a bears entry to a fact and option; the fence cites the traditions the record does not connect to this option and omits the ones it does. Suggested edit: name the three bearing readings in the rationale, and either add bears entries on this option to the three cited or say they bear on this answer through viable-options.
- Answer (fence): "a rejected alternative is one of two things and both are rows on the same list: a candidate the AI holds dominated on the record's criteria, which carries the status passed ...; and an option the author did not choose, which keeps its place beside the confirmed choice with no status at all". This enumerates the statuses an option can carry, which the fence's own rationale says "is the viable-options node's question and is cited here rather than restated" and which dialogue's fence likewise leaves to viable-options ("whose terms this answer uses and does not restate"). The record already has a third kind of row the enumeration does not cover: an option adopted into the answer, kept listed with its adoption noted and no status (authority's `escalate-toward-ratified` and materialization's `disclose-that-sessions-run-under-this-rule`, both "Adopted option restored, 2026-09-05"), and this node's own `authors-rejected-section-question` and `record-rejected-dispositions` are author-sourced options with no status that are neither passed nor unchosen by a ruling; and viable-options now carries `adopted-is-a-status` (ref 2026-09-05) pending, so "one of two things" is decided one node earlier and may be decided the other way. Suggested edit: replace the two-way enumeration with "carrying whatever status the viable-options node's answer gives it, passed with its reason where the AI holds it dominated, and none where the author simply did not choose it", so the fence cites rather than restates.
- Account, "Tested against the record it joins": names only `node` ("The rationale says why, and which alternatives were rejected") and `rationale-edge` ("weighing the alternatives it rejected"). Three other standing answers place a rejected alternative in the rationale and conflict with the fence's "There is no rejected list, no rejected section, and no rejected node in this record ... and nowhere else": legacy.md line 53 "appears as a rejected alternative in the new node's rationale", transience "into the rationale as a rejected alternative", growth "a steer enters the node's rationale as a rejected alternative"; dialogue's account (line 1417) also carries "`rejected`, since rejected choices fold into the rationale per aspect". Since this node defines `rejected alternative` as an option on the fact, each of those sentences now says the wrong place. Suggested edit: extend the test to name legacy, transience and growth, and record an option on each with this node as its source (or state in the Account why each needs no change).

On the facts and what they recommend: The author's words of 2026-09-02 quoted in the fence match node.md exactly, and the 2026-09-03 words match this node's Disposition. The fence's "is liquidated" claim about the browser's heading match holds at greenfield HEAD (removed at 29d285d5, asserted by project.test.mjs 805 and 1316), but the option subsection and Account say the match still exists, and the `defines` claim in the same subsection is stale; the passed-candidate count is right at 417b8335 but the fence names no commit and the Facts prose says "today".

On the viability of the options: The seven options each answer this question and none is the same option under two names; the three passed ones carry a reason, and the three author-sourced and one prose-and-structure-sourced options carry source and ref. `non-chosen-viable-options` stands and `passed-over-stays-listed` differs from it by exactly the AI's half, so the recommendation is a genuine move and not a restatement of what stands, though the fact's own `against` rightly says its ground is viable-options' `passed-over-options-stay`.

Strongest counter-argument (moderate): The recommended answer has no ground of its own: it is viable-options' `passed-over-options-stay` restated for the word "rejected", and every sentence of substance in the fence (what a row is, that nothing leaves the list, what an option carries, where the rationale may name one) is either viable-options', dialogue's or prose-and-structure's rule cited back. If the author rules for `viable-not-chosen-as-it-stands` on viable-options, the fence's "whether or not the AI still holds it viable" falls and this node is left saying nothing that its parent and its depends do not. The answer that stands, `non-chosen-viable-options`, is the author's own words and already answers the question they asked while keeping their scoping of what persists, so a ratification here spends a ruling on a decision the author will have made one node earlier; deferred on the authority fact would let the answer act and keep the pair on the frontier to be ruled together. Against this, the two decisions the fence claims as its own, that the record keeps no rejected list, section or node, and that `rejected alternative` is defined here, are not on viable-options, and the migration of the rationales' rejected prose into passed options is a consequence somebody has to state.

The session's reply: All seven findings verified against the record and the implementation and taken. The stale defines claim and the false browser-match claim are corrected, the latter in the option's subsection and in a dated account note rather than by rewriting the account of 2026-09-04; what stays when a choice is displaced is the option with its sentence, and version control is named as holding the text that left; the count is pinned at 417b8335 with the count of 2026-09-05 beside it; the rationale names the three readings that bear on this option and says the decision-record form, IBIS and the Pareto frontier bear on it through the nodes whose options it cites; the two-way enumeration is replaced by a citation of the viable-options node's statuses, with the adopted option named as the third kind of row; and the test against the record is extended to legacy, transience and growth, each of which now carries an option sourced to this node saying where a rejected alternative lives. On the counter-argument: the authority fact's against already states the case for deferred, and the two decisions of this node's own, that the record keeps no second home for a rejection and that the term is defined here, are what a ruling here confers.

### Amended after the reading, 2026-09-05

The reading forwarded the draft with seven findings, all verified on this thread and taken, and the recommended text moved, so the node returns to the review stage. Two claims of this node's are corrected: the subsection on `passed-over-stays-listed` said no node's `defines` carried the term, and this node's has since the re-encoding; and the subsection on `prose-in-rationale`, and the account of 2026-09-04 below it that said the browser's heading match was re-verified, described an implementation that is gone, the match having been liquidated at implementation commit 29d285d5 with the projector's tests asserting that a heading named Rejected renders as prose. The fence now says what stays when a choice is displaced is the option with its sentence, the text that left surviving in version control; pins the count of passed candidates at 417b8335 with the count of 2026-09-05 beside it; names the three readings under this node that bear on the recommended option, file-drawer-and-pre-registration, deprecation-not-deletion and chestertons-fence, and says the decision-record form, IBIS and the Pareto frontier bear on it through the dialogue and viable-options nodes; and cites the viable-options node for the statuses a row may carry, naming the adopted option as a third kind of row, instead of enumerating two. The test against the record it joins is extended: the standing answers of legacy ("it appears as a rejected alternative in the new node's rationale"), transience ("into the rationale as a rejected alternative") and growth ("a steer enters the node's rationale as a rejected alternative") each place a rejected alternative in the rationale, and each now carries an option `rejected-alternative-is-an-option`, sourced to this node, saying the place is the fact's option list; the options act on nothing until the author rules.

### Clean-context review, 2026-09-05

Read in clean context by a subagent given this draft, its ancestry, its siblings, the nodes it names, and the index of every question the record asks, and nothing of the sitting. Verdict: forward to the author's ruling.

Findings:

- Recommendation fence, `## Rationale`, last sentence (validation 3, every claim about the record verified): "a hundred and four passed candidates across twenty-nine nodes at graph commit 417b8335, the pin the viable-options node states for the same measurement, and a hundred and forty-four across thirty-six at 68367776"; the same figures in `## Facts`, `### answer` ("a hundred and four of them at graph commit 417b8335, across twenty-nine nodes, and a hundred and forty-four across thirty-six on 2026-09-05") and in `#### non-chosen-viable-options` ("the hundred and four candidates the migration of 2026-09-04 recorded"). Both figures count prose mentions of the literal string `status: passed` as though they were options. Anchored on the field, `git grep -c -E '^ +status: passed *$' 417b8335 -- disposition-graph` gives 102 options on 28 nodes, and at 68367776 it gives 130 on 34; the unanchored `git grep -c 'status: passed'` gives 105 on 30 and 144 on 36, the difference being 3 prose mentions at 417b8335 (in rejected.md, prose-and-structure.md and viable-options.md, the first two of which carry no real status at all at that commit) and 14 at 68367776 (authority, clean-context-review, dialogue twice, materialization, prose-and-structure twice, readings, rejected, review-model, second-stop, viable-options twice, what-an-option-row-carries). The earlier reading's own verification excluded only this node's prose mention, which is where 104 and 29 come from. Suggested edit: "102 passed candidates across 28 nodes at graph commit 417b8335 ... and 130 across 34 at 68367776", with the same correction in the two Facts loci. Because the fence calls this "the pin the viable-options node states for the same measurement", the same figure on `commons.systems/disposition-graph/viable-options` (its `### answer` prose, "hundred and four options carry the status passed, on twenty-nine nodes", and its account) carries the same error and needs the same correction there, or this node should cite that pin instead of restating it.
- Recommendation fence, `## Rationale`: "Traditions bearing on this answer, each a reading with its own node under this one, each adopted: the file-drawer problem and pre-registration ...; deprecation rather than deletion ...; and Chesterton's fence ...". False on the record: all three are filed under viable-options, not under this node — `disposition/disposition-graph/chestertons-fence.md`, `deprecation-not-deletion.md` and `file-drawer-and-pre-registration.md` each carry `under: commons.systems/disposition-graph/viable-options` at line 22 — and no node in the graph carries `under: commons.systems/disposition-graph/rejected` at all, so this node has no children. What they carry here is a second `bears` entry on `passed-over-stays-listed` (line 28 of each), which is exactly what this node's own Account of 2026-09-04 says: "filed under `viable-options` and each carries a second `bears` entry on `passed-over-stays-listed` here". The fence contradicts the node's own account. Suggested edit: "Traditions bearing on this answer, each a reading filed under the viable-options node and bearing on the recommended option, each adopted: ...".
- Account, "Tested against the record it joins", as extended by "Amended after the reading, 2026-09-05" to legacy, transience and growth: `commons.systems/disposition-graph/projection` is missed, and it is the node the author's question of 2026-09-02 was actually about. Its recommended text (projection.md line 206) says the browser shows "an authority section projected from the stamp, the ruling behind it, the alternatives the rationale rejected, and, for a deferred node, what is pending for the author", which places the rejections in the rationale and gives them a section, against this fence's "There is no rejected list, no rejected section, and no rejected node in this record: what was rejected is on the fact beside what was chosen ... and nowhere else". Unlike node, whose parallel sentence is answered by the option `rationale-argues-facts-list` recorded there, nothing is recorded on projection: `grep -rn 'rejected-alternative-is-an-option' disposition/disposition-graph/` returns transience, growth and legacy only. Suggested: record `rejected-alternative-is-an-option` on projection's answer fact with this node as its source and 2026-09-05 as its ref, in the same words used on the other three, and name projection in the test paragraph. (Projection's "projected from the stamp" is separately stale under the facts encoding, but that is that node's business and not this reading's.)
- Recommendation fence, `## Answer`, second paragraph: "Each option carries what a later session needs to meet it: its name, its source and reference, in prose what it would answer and why it is on the table, the readings that bear on it with what each tradition says of it, the recommendation where it has one, the ruling where the author has given one, and, where it was passed over, the reason." This is the dialogue node's enumeration restated — its recommended text reads "An option carries its `name`; on the answer fact its `source` ... and its `ref` ...; a `status`, which is `passed` and nothing else, with the `reason` ...; and its `ruling` once the author has given one" — on a node that neither cites nor `depends` on dialogue, and it is the second copy this fence's own `## Rationale` disclaims one paragraph later: "What a rejected alternative is follows from what an option is, which is the viable-options node's question and is cited here rather than restated." The option `membership-cited-not-restated` (source viable-options, ref 2026-09-05) names three clauses of the first paragraph as a second copy of a rule this node does not own; this sentence is a fourth and larger one that the option's prose does not reach. Suggested edit: "Each option carries what a later session needs to meet it, as the dialogue and viable-options nodes set out; what this node decides is that on a rejected candidate the row is where the reason it was not taken lives", and extend `membership-cited-not-restated`'s subsection to name this sentence too, so a ruling for that option is a ruling on the whole restatement.
- Recommendation fence, `## Answer`, second paragraph (validation 15, merge): "The browser and the alignment page show the confirmed choice first and beneath it the recommendation, the other options with their status, and what each tradition says of each". This prescribes what the projections show per option, which is `commons.systems/disposition-graph/alignment-page`'s question and, for the first level, `commons.systems/disposition-graph/what-an-option-row-carries`' ("What does an option's row carry at the first level?"), a node standing at the periagogic stage on the author's words of 2026-09-04, which run the other way: "most chips and the id-shaped string listed for each option shown in the agency node are not useful in the ui ... For each option, list only a short text summary, a simple indicator." So the sentence is a new answer to a question the record already asks, given on a node whose question is where a rejected alternative is recorded. Suggested edit: keep only the clause this node owns — that what was considered is read from the structure and never recovered by matching a heading, the heading match being liquidated with the prose it read — and cite alignment-page for what the projections show; or, if the enumeration is meant, record it as an option on `what-an-option-row-carries` with this node as its source, where the author rules on it against their own words.

On the facts and what they recommend: The answer fact recommends `passed-over-stays-listed`, a listed option, at moderate boldness, with `non-chosen-viable-options` standing and a `## Recommendation` fence present as the encoding requires; moderate is right, since what the node adds beyond the membership rule it cites (the liquidation of the heading match, the definition of the term, and that there is no second home for a rejection) is narrow and named, while the membership departure is carried at high boldness on viable-options. The authority fact recommends `ratified` at moderate boldness over the reserved three, with an `against` that states the case for deferred, and the escalation reasoning (an answer wrong here loses the record's account of what it decided against, and the party deciding is the party whose rejections most of them are) is the record's own rule applied honestly; no persistence fact is carried and none is owed, since the recommendation changes no shim, no evidence and no shape. The review pin `of: 361e350dc5679608b18a2a30c00c80ad302c0222` no longer names what the node recommends, which is why this reading was run and is not itself a defect; the fence's quotations of the author (2026-09-02 on node.md line 88, 2026-09-03 in this node's Disposition) are exact, and its corrected claims about the implementation hold — browser-template.html has no `rejected` match (grep count 0), it was removed at 29d285d5, and project.test.mjs lines 805 and 1316 assert that a `Rejected` heading renders as ordinary prose.

On the viability of the options: On the answer fact all eight options are viable as listed and none is the same option twice: the three passed ones (`rejected-list-on-node`, `rejected-nodes`, `prose-in-rationale`) each carry a dominance reason of the right kind and stay rulable, the two author-sourced ones (`authors-rejected-section-question`, `record-rejected-dispositions`) rightly carry no status since they are adopted into the recommendation rather than beaten, `non-chosen-viable-options` stands, and `membership-cited-not-restated` is the genuine trimmed rival to the recommendation, differing by whether the membership clauses are restated or cited — findings 4 and 5 above argue it reaches further than its own prose claims, which strengthens rather than removes it. On the authority fact the three reserved options are complete. I find no viable option missing: an option that kept only the liquidation and the definition here and sent the whole encoding to viable-options is `membership-cited-not-restated` already, and a proposal that the node not exist is the existence fact's and not an answer option, which this node does not carry and which nothing in the draft yet requires — the question "How are rejected alternatives recorded?" is not the question viable-options asks, so it is not a merge at the node level.

Strongest counter-argument (moderate): The recommended answer has little ground left of its own once its restatements are cited away. Its membership rule is viable-options' `passed-over-options-stay` seen from this side, its account of what an option carries is dialogue's, its account of what the projections show is alignment-page's, and its rule about the rationale is prose-and-structure's — and findings 4 and 5 show the fence still carries three of those as text rather than as citations, which is what `membership-cited-not-restated` exists to fix. What is left as this node's own is a liquidation the implementation already performed at 29d285d5 and a `defines` entry carrying a bare term with no gloss, and the third claim it makes for itself, that the record keeps no second home for a rejection, is not yet true of the record: projection's own recommended text still proposes a section carrying "the alternatives the rationale rejected". So a ratification here spends a ruling on a decision the author will have made one node earlier, and the answer that stands, `non-chosen-viable-options`, is the author's own words already answering the question they asked. Against that: the author asked this question twice, in 2026-09-02 and 2026-09-03, and it is entitled to an answer somewhere; deferred on the authority fact would let that answer act and keep the pair on the frontier to be ruled together, which is the exit the fact's own `against` names.

The session's reply: All five findings were validated at their loci on the main thread and all five were accepted. Two of them are answered on other nodes, and the counter-argument is answered on the authority fact rather than by a change to the answer.

F1, a measurement that counted prose: confirmed and re-measured here. `git grep -c -E '^ +status: passed *$' 417b8335 -- disposition-graph` gives 102 options across 28 nodes, and at 68367776 it gives 130 across 34; the unanchored grep the earlier reading used counts the literal string wherever it appears, including in prose that discusses the field, which is where 104 and 144 came from. All three loci here are corrected. The same figures stand on `viable-options`, which the fence calls the pin for the same measurement, and they are corrected there too, with the method written beside them so the next reading can re-run it rather than re-derive it; that correction moves that node's pin, and it is disclosed there and not silently re-settled, as the `review-cost` node's option `pin-names-the-text-the-reader-read` records.

F2, a claim contradicted by the node's own account: confirmed. No node in the graph carries `under: commons.systems/disposition-graph/rejected`, and the three readings are filed under `viable-options`, each carrying a second `bears` entry on `passed-over-stays-listed` here, which is exactly what this node's Account of 2026-09-04 already says. The fence is corrected to the account.

F3, the node the author's question was actually about: confirmed. `projection`'s recommended text still proposes a section carrying "the alternatives the rationale rejected", which is the second home this answer says the record does not keep, and `rejected-alternative-is-an-option` was recorded on `transience`, `growth` and `legacy` and not there. It is recorded on `projection` now, sourced to this node, and `projection` is named in the test paragraph. That its text also says "projected from the stamp" is stale under the facts encoding is that node's business and is not touched here.

F4, a fourth and larger restatement: confirmed. The enumeration of what an option carries is `dialogue`'s, on a node that neither cites nor depends on it, and the fence's own Rationale disclaims the practice one paragraph later. The sentence is replaced by the citation and by what this node actually decides, and `membership-cited-not-restated`'s subsection is extended to name it, so a ruling for that option is a ruling on the whole restatement and not on three clauses of it.

F5, a new answer to a question the record already asks: confirmed. What the projections show per option is `alignment-page`'s question and, at the first level, `what-an-option-row-carries`', which stands at the periagogic stage on the author's words of 2026-09-04 running the other way. The clause is cut to what this node owns, that what was considered is read from the structure and never recovered by matching a heading, and the enumeration is cited to `alignment-page` rather than given here. It is not recorded as an option on `what-an-option-row-carries`, because that node's question is open on the author's own words and an option restating what this fence happened to say would put the AI's sentence where the author's belongs.

The counter-argument, that little ground is left of this node's own once its restatements are cited away: accepted as accurate about the answer and answered on the authority fact. The reader's own exit is the right one and is already on the fact: the author asked this question twice and it is entitled to an answer, and deferred lets that answer act while the pair is ruled together with `viable-options`. The recommendation on the authority fact does not move, because which of ratified and deferred is right depends on whether the author wants this settled beside `viable-options` or after it, and that is theirs; the case is now on the fact where they will see it.

Two amendments and no third reading is bought: this is the second reading of this answer and the cap is reached. The pin this reading recorded names the draft the reader read and is not re-settled, for the same recorded reason.

### Amended after the second reading, 2026-09-05

All five findings were validated at their loci on the alignment thread and all
five were accepted; the review block above records the reading against graph
commit a644c2bb.

The census was re-measured here rather than copied. Anchored on the field,
`git grep -c -E '^ +status: passed *$' 417b8335 -- disposition-graph` gives 102
passed options across 28 nodes, and at 68367776 it gives 130 across 34; parsing
the frontmatter gives the same 102 across 28, all of them on answer facts, 94
sourced to the AI and 8 to the author. The figures this node carried, 104 and
144, came from the unanchored string, which the record's own prose contains
wherever it discusses the field. The two loci here are corrected, the fence's
restatement is replaced by a citation of the viable-options pin, and that node,
which carries the same error in the price it puts to the author, is corrected
there in the same landing.

The claim that each of the three traditions has its own node under this one is
false and was contradicted by this node's own account of 2026-09-04: no node
carries `under: commons.systems/disposition-graph/rejected`, and
chestertons-fence, deprecation-not-deletion and file-drawer-and-pre-registration
are filed under viable-options, each with a second `bears` entry on
`passed-over-stays-listed`. The fence now says so.

The third claim the answer makes for itself, that the record keeps no second
home for a rejection, is a decision and not yet a fact: `projection`'s
recommended text proposes a section carrying "the alternatives the rationale
rejected". The fence now says which, and `rejected-alternative-is-an-option` is
recorded on that node's answer fact, sourced here, so the author meets the
conflict where it lives.

Two restatements were cut to citations, the enumeration of what an option
carries, which is dialogue's, and what the projections show per option, which is
alignment-page's and, at the row's level, `what-an-option-row-carries`'. No
option was recorded on that last node: its question stands at the periagogic
stage on the author's words of 2026-09-04, and an option restating what this
fence happened to say would put the AI's sentence where the author's belongs.

The counter-argument, that little of this node's own ground survives the
citations, is accepted as accurate and is answered on the authority fact, where
the reader's own exit, deferred, already stands as an option beside the
recommended ratified; the recommendation there does not move, because whether
this is settled beside `viable-options` or after it is the author's to say.

The pin the reading recorded, 509706a8, names the draft the reader read, and
these amendments are not re-settled onto it. The frontier will show the
recommendation as moved since its reading, which is what the reader should see;
whether an amendment written in answer to a reading should re-settle the pin is
the open option `pin-names-the-text-the-reader-read` on
`commons.systems/disposition-graph/review-cost`. This is the second reading of
this answer and the cap is reached; no third is bought.

### Frontier survey, 2026-09-05

Read in clean context by a subagent given the whole graph and nothing of the sitting, judging this node's recommendation against every other node. The survey gives no verdict.

Findings:

- `## Facts` carries a `#### non-chosen-viable-options` subsection for the option named by `stands` (brief line 3671). See the cross-node `contradiction` finding naming nine nodes.
- The answer contains the sentence that settles a question pending as an unruled option on four other nodes: "An option is not a page: an answer that was not taken has no standing and earns no node of its own." The option `rejected-alternative-is-an-option` stands unruled on `growth`, `legacy`, `projection` and `transience`. Recorded as the cross-node `redundancy` finding.

Strongest counter-argument (strong): The answer has no ground of its own if the author rules the other way one node earlier: it is `viable-options`' `passed-over-options-stay` restated for this question, so a confirmation here is a second vote on one decision, and both nodes stand at the ruling stage in the same order. `non-chosen-viable-options`, which stands, already answers the question the author asked while keeping the author's own scoping of what persists — so the recommendation's only content over what stands is the part that reverses the author, and it inherits that reversal from a node whose own boldness on it is `high`.

The session's reply: Taken. This node's recommendation has no ground of its own if `viable-options` is ruled the other way one node earlier, both stand at the ruling stage, and the order puts the dependent node in front of the author with nothing recording that it is dependent. The session records the dependency as owed in `depends` and does not move the recommendation. The second finding is taken: this node's answer already settles what a rejected alternative is, and the four unruled copies of that question on `growth`, `legacy`, `projection` and `transience` are struck for a citation here.

### Frontier finding, 2026-09-05

Kind: contradiction.

Nine nodes carry, inside `## Facts`, a `#### <option>` subsection for the option their answer fact names in `stands`. The encoding rule is that the standing option omits its subsection because its sentence is the first sentences of `## Answer`, and `commons.systems/disposition-graph/dialogue`'s own recommended answer states it: the option that stands "needs none, since its text is the answer". The nine, each with the standing option whose subsection is stored: `authority` (`authority-derived`), `delegation` (`reconciliation-session-writes-options`), `dialogue` (`facts-carry-options`), `evaluation` (`overrule-by-class`), `readings` (`relation-per-option`), `recording` (`options-persist-at-the-recording`), `rejected` (`non-chosen-viable-options`), `unanswered` (`unanswered-is-no-ruling`), `viable-options` (`grant-from-a-ruling`). `dialogue` is one of the nine, so the node that states the rule breaks it. What is stored is not the answer's first sentences but a description of the change the option made — on `readings` at line 131 it opens "A reading stays a node under one node it bears on, with its own class, and its relation attaches to the options of the fact it bears on rather than to the answer", and elsewhere the prose opens with a raising note of the form "Raised on ... from the author's words of 2026-09-04". Six of the nine render that stored prose in the survey brief in place of the answer's opening (brief lines 559, 846, 1282, 2403, 2502, 3671), so any projection that reads a standing option's subsection shows the author a delta where the answer belongs. The other three (`dialogue`, `evaluation`, `unanswered`) are outside the judged set and their standing rows are not rendered in the brief, so their subsections are dead text nothing reads. The record has the question open and unruled in two places: `dialogue` carries the option `standing-option-carries-a-subsection` (source alignment-page, 2026-09-04) and `alignment-page` carries `standing-sentence-stored`, passed over on 2026-09-04. So nine nodes have implemented an option the author has not ruled, against the rule that stands.

Also named: commons.systems/disposition-graph/authority, commons.systems/disposition-graph/delegation, commons.systems/disposition-graph/dialogue, commons.systems/disposition-graph/evaluation, commons.systems/disposition-graph/readings, commons.systems/disposition-graph/recording, commons.systems/disposition-graph/unanswered, commons.systems/disposition-graph/viable-options, commons.systems/disposition-graph/alignment-page.

Proposed: Rule it once, on `commons.systems/disposition-graph/dialogue`, whose answer states the rule and whose fact already carries the option. If the standing option keeps no subsection, delete the nine subsections — the text is not lost, since `## Answer` carries the answer and the account carries the history of the change. If the standing option is to carry one, the rule in `dialogue`'s answer changes and the nine subsections are rewritten to carry the answer's first sentences rather than a description of a change. Either way the nine conform to one ruling and no node is left implementing the losing side. Until it is ruled, the six whose stored prose the projections render are the urgent half, because those are the ones showing the author the wrong text.

### Frontier finding, 2026-09-05

Kind: redundancy.

Two vocabulary questions are each pending as an unruled option on four separate nodes, and each is already answered in the standing text of a node in the judged set. `rejected-alternative-is-an-option` stands as an option on `growth`, `legacy`, `projection` and `transience`; `commons.systems/disposition-graph/rejected`'s `## Answer` already says "A rejected alternative is a viable option not chosen" and, in as many words, "An option is not a page: an answer that was not taken has no standing and earns no node of its own." `proposal-as-a-state-of-a-ratified-node` stands as an option on `growth`, `node`, `frontier-consistency` and `transience`; `commons.systems/disposition-graph/authority`'s `## Answer` already says "A proposal is technical vocabulary and is not overloaded: it is the state of a ratified node whose recommendation has moved from its confirmed choice." So eight options on six nodes ask the author to settle two things the record has settled, and they will be ruled one at a time on nodes whose questions are about something else. The reading of 2026-09-05 raised the second of these on `frontier-consistency` alone; what the survey adds is that it pends on three further nodes and that the settling text already stands. The record has a working precedent for the remedy: `commons.systems/disposition-graph/instruments` carries `one-ruling-for-the-word` (disposition/disposition-graph/instruments.md line 113) for the instrument-or-criterion question, and its enumeration is accurate — "the author is otherwise asked the same vocabulary question five times on five pages". Neither of these two families has such an option.

Also named: commons.systems/disposition-graph/growth, commons.systems/disposition-graph/legacy, commons.systems/disposition-graph/projection, commons.systems/disposition-graph/transience, commons.systems/disposition-graph/node, commons.systems/disposition-graph/frontier-consistency, commons.systems/disposition-graph/authority, commons.systems/disposition-graph/instruments.

Proposed: Strike the eight options and replace each with a citation. `commons.systems/disposition-graph/rejected` is the survivor for what a rejected alternative is, and `commons.systems/disposition-graph/authority` is the survivor for what a proposal is; each of the six bearer nodes cites the survivor's sentence where it currently carries the option. Where a bearer node believes its option means something the survivor's answer does not cover, that difference is the option, stated as the difference, and everything the survivor already says comes out. If the author would rather rule the two words once explicitly, mint the settling option on the survivor in the shape `instruments`' `one-ruling-for-the-word` takes, without a count in its prose.

### Frontier finding, 2026-09-05

Kind: decomposition.

The independence test of `commons.systems/disposition-graph/probe-or-node`, run across the judged set and reported under this kind as `frontier-consistency`'s sixteenth validation prescribes, finds two nodes and no more; readings are exempt by construction. `commons.systems/disposition-graph/hexis` asks "In the purpose answer, is the hexis claim stated first and the knowledge store as its gloss?": its only possible answer is a reading of `purpose`'s, its answer options `hexis-first` and `knowledge-store-first` are the two orderings of one of purpose's sentences, `knowledge-store-first` already stands as an option on purpose's own answer fact sourced to this node, and it would be pruned the moment purpose's recommendation moved. `commons.systems/disposition-graph/audience` asks "Who is this repository for?": purpose's answer already carries "Its intended readers are humans who want that, and who may arrive here by way of an AI tasked with the same goal", this node's answer restates it, its answer fact carries the single option `standing`, and it too would fall with a move on purpose. Both nodes already recommend `prune` on their existence facts, so the test confirms a judgment the record has reached and supplies the reason it was missing. `commons.systems/disposition-graph/rejected`'s answer states the principle: "An option is not a page: an answer that was not taken has no standing and earns no node of its own." A third node was tested and survives: `commons.systems/disposition-graph/second-stop`'s three answer options are all edits to `model`, which has the same shape, but its question — what a newcomer reads after purpose — is not a reading of `model`'s question, and its existence fact recommends `keep`, so it is reported in its own node entry and not here. `commons.systems/disposition-graph/which-facts-are-listed` was tested and survives on its own account, which reaches `dialogue`'s reserved-four rule and not only the parent's rendering.

Also named: commons.systems/disposition-graph/hexis, commons.systems/disposition-graph/audience, commons.systems/disposition-graph/purpose, commons.systems/disposition-graph/second-stop.

Proposed: Record the independence test as the reason on each existence fact's `prune` option, on `hexis` and on `audience`, and let the author rule the prune at each node's own row, which is what `probe-or-node`'s answer prescribes for a node already standing. Before `audience` is pruned, its surviving content is named: the sentence itself is already in `purpose`, and the enumeration of onboarding surfaces — README, browser opening pages, repository description, discovery tags — belongs to `projection` or `self-documentation` and moves there rather than being deleted with the node. `hexis` needs no survivor: `purpose` already carries its content as the option `knowledge-store-first`.
