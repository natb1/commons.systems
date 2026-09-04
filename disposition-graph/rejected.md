---
question: How are rejected alternatives recorded?
form: rule
stage: review
review:
  verdict: kickback
  strength: moderate
  date: 2026-09-03
  of: 30fbaa7140576becf743ee5c7e094e1b980037d0
  against: "The author's objection was that the rejected section 'seems too ad-hoc' as a projection source, and the projector already reads it, so the schema change buys structure for the projector at the price of a field every node must maintain and that will accumulate entries nobody prunes — the drift the record resists elsewhere. Option 3 answers the author's objection at zero cost provided the browser's heading match is documented as the contract rather than left as an accident of the template, which is what the option's own text now says. The counter to that is thin: a heading convention is exactly what the author called ad hoc, and documenting a convention does not make it checkable."
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
ever saw it — a hundred and four of them in the record today, across
twenty-nine nodes — and every one of those is a rejection the author is
entitled to read. The recommended option is the standing answer with that half
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

A rejected list on the node, each entry one alternative answer and why it lost, projected in the authority section, with the rationale keeping only why the standing answer stands. It is a schema change, and adopting it means rewriting the rejected prose of purpose, authority, node, instruments, readings, namespaces, projection and model before any of them is recorded. The reviews ask it to say what an entry contains, whether an entry is versioned if the alternative is later adopted, and that a rationale may cite its rejected entries. It was passed over because the fact's options are this list generalised to every decision on the node rather than to the answer alone, and because it takes from the rationale the argument by elimination that both reviews of 2026-09-03 asked it to keep. The three refinements those reviews asked for are answered in the recommended option, which says what an entry carries, that an option later chosen becomes the answer with the text it displaced staying beside it, and that a rationale may name an option in the course of its argument. What it would have cost to adopt inside the batch of 2026-09-03 is not part of the reason: cost is struck from the choosing, and in the event the migration of 2026-09-04 rewrote the prose anyway.

#### rejected-nodes

Rejected alternatives become nodes of their own carrying a rejected class. It is the boldest of the three options and was neither recommended nor withdrawn when it was raised. It was passed over because a node is a question and an option is a candidate answer to one, as `commons.systems/disposition-graph/node` says, so an answer that was not taken earns no page; and because a rejected class would be a stamp written on the one thing whose class `commons.systems/disposition-graph/viable-options` derives from rulings, of which a rejected option has none.

#### prose-in-rationale

Rejected alternatives stay prose in the rationale, as now, with the browser's heading match documented as the contract rather than left as an accident of the template. The second review of 2026-09-03 established that the projector already renders a rejected section from a rationale heading, so the projection the author asked for needs no schema change, and this node's reply of that day said the fact "materially favours the third option at zero cost". It is passed over now, and the passing overturns that reply. The fact is still true — `packages/disposition/browser-template.html` matches a rationale heading with `/^rejected\b/i` and renders it as a section — and it no longer decides anything, for two reasons. The author's objection was that the rejected section "seems too ad-hoc", and a heading convention in prose is exactly that: documenting a convention writes it down without making it checkable, which the kickback of 2026-09-03 said in its own words against itself. And what is left on this option's side once that is answered is cost, which `commons.systems/disposition-graph/evaluation` strikes from the choosing by name — what a change costs to migrate, how many files it touches, what reviews it spends, and that the incumbent already does it the other way. With the struck arguments removed nothing remains on which this option is better, which is what dominated means; it stays on the fact and the author may rule for it.

#### authors-rejected-section-question

The author's own proposal of 2026-09-02, carried verbatim on `commons.systems/disposition-graph/node`:

> What is the rejected section a projection of. Should it be associated with the deferred authority somehow? An authority section projected into the documentation (with notes on pending ratification for deferred authority) would make more sense than a "rejected" section which seems ad-hoc.

As a candidate answer it says the rejected section goes and an authority section takes its place, carrying the notes on what is pending. It is adopted into the recommended option and stays viable, because the recommendation grants what it asks and grants it without a section: the facts themselves are that list, the notes on what is pending are each option's status and recommendation and ruling, and the rejected alternatives are the rows carrying the status passed. A ruling for this option as the author stated it takes the section as well. The words are the option, which is why they are quoted here; their home is `commons.systems/disposition-graph/node`, which carries them verbatim and dated in its `## Disposition`, and this node's `## Disposition` is not enlarged to hold a second copy.

#### record-rejected-dispositions

The author's words of 2026-09-03, which this node's own `## Disposition` carries and which were raised here from `commons.systems/disposition-graph/under`: recording rejected dispositions may make sense, and listing them as prose under the rationale is too ad hoc. As a candidate answer it says the rejections are recorded and says nothing about where, which is what the other options answer. It is adopted into the recommended option and stays viable: the recommendation grants both halves, they are recorded, on the fact, each with the reason it was not taken, and the prose goes, which is `commons.systems/disposition-graph/prose-and-structure`'s rule and not this node's. The sentence this subsection carried until 2026-09-04, that the browser's heading match materially favours keeping the prose, is struck from it: that is the case for `prose-in-rationale` and it now sits on that option, with the reason it no longer decides.

#### non-chosen-viable-options

A rejected alternative is a viable option the author did not choose, kept on the fact beside the confirmed choice with the reason it was not taken and the traditions bearing on it; the projector reads the structure and the rationale cites it. It is `rejected-list-on-node` generalised to every fact, and the fact the second review established, that the projector already reads a rationale heading, no longer decides the question, since the structure exists for regression and for the browser's drill-down and not for the projector alone. The author's objection carried above, that prose under the rationale seems too ad hoc, is what the structure answers. Raised on commons.systems/disposition-graph/viable-options, from the author's words of 2026-09-04 recorded there. It is the answer as it stands, and the recommendation keeps it whole and adds the half it leaves out, the candidate the AI rejected before the author saw it. What a ruling for it does depends on how "viable" is read, which is `commons.systems/disposition-graph/viable-options`' question and not this one's: read as dominance, the hundred and four candidates the migration of 2026-09-04 recorded are not viable, so they leave their facts and the `status` key leaves the reader with them; read as the author used the word, a candidate the AI categorized as worth recording, which is that node's option `viable-not-chosen-as-it-stands`, they stay as options with no status and the AI's dominance judgment returns to each option's prose. That one sentence has two consequences is why the two nodes are ruled together and why this one's `depends` names that one.

#### passed-over-stays-listed

A rejected alternative is any candidate the AI considered and can name, kept on the fact with its status and the reason it was not taken, whether or not the AI still holds it viable: `status: passed` with its `reason`, as `viable-options`' option `passed-over-options-stay` encodes it. Version control holds nothing the record does not, and the rejected passages of the rationales migrate as options passed over; the rationale argues and does not list. Raised on commons.systems/disposition-graph/prose-and-structure, whose clean-context review of 2026-09-04 found the membership rule to be this node's and `viable-options`'. Two decisions of this node's own go with it: that the record holds no rejected list, no rejected section, and no rejected node anywhere, so the browser's match on a heading beginning `Rejected` in a `## Rationale` is liquidated with the prose it read; and that `rejected alternative` is defined here, which the kickback of 2026-09-03 said was owed and which no node's `defines` carries today. Adopted by the recommendation and set out in the fence.

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

As options on the fact they answer, carrying the status the AI's judgment gives them. There is no rejected list, no rejected section, and no rejected node in this record: what was rejected is on the fact beside what was chosen, in the options the record already holds, and nowhere else. Every candidate the AI considered and can name is an option on the fact it answers, whether or not the AI still holds it viable, so a rejected alternative is one of two things and both are rows on the same list: a candidate the AI holds dominated on the record's criteria, which carries the status passed with the one clause saying why it was passed over; and an option the author did not choose, which keeps its place beside the confirmed choice with no status at all, since the author's ruling is a ruling for the option they took and not against the rest. Neither leaves the list. An option is struck only by the author, and the AI's judgment about an option is written on the option and never worked by removing it, as the viable-options node decides. When an option is later chosen it becomes the answer, and the text it displaced stays on the list.

Each option carries what a later session needs to meet it: its name, its source and reference, in prose what it would answer and why it is on the table, the readings that bear on it with what each tradition says of it, the recommendation where it has one, the ruling where the author has given one, and, where it was passed over, the reason. The projections read that structure and never the prose. The browser and the alignment page show the confirmed choice first and beneath it the recommendation, the other options with their status, and what each tradition says of each, so what was considered is shown with what was decided rather than recovered by matching a heading; the browser's match on a heading beginning "Rejected" in a `## Rationale` is liquidated with the prose it read.

The rationale argues and does not list. It says why the standing answer stands and why the candidates it beat fell, in the argument's own sentences, and it may name an option in the course of that argument, since a rationale that argues by elimination has no argument left without them; it may not restate the option list beside the fact that holds it, which is the prose-and-structure node's rule and not this one's. An option is not a page: an answer that was not taken has no standing and earns no node of its own, a node being a question and an option a candidate answer to one.

What the author asked in 2026-09-02, what the rejected section is a projection of, is answered by the same structure and the answer is the diagnosis: it was a projection of nothing, a heading in prose with no data behind it, which is why it read as ad hoc and why documenting the convention would not have cured it. The authority section proposed in its place, with its notes on what is pending, is the facts as the page now lists them, every fact with every option, each carrying its status, the recommendation among them and the ruling where one has been given; and the rejected alternatives are the rows in that list that carry the status passed.

## Rationale

Recorded on the author's words of 2026-09-03, carried above, that the under edge lists rejected as prose under the rationale, that recording rejected dispositions may make sense, and that this "seems too ad-hoc"; and on their words of 2026-09-02, carried on the node node, asking "What is the rejected section a projection of" and proposing "An authority section projected into the documentation (with notes on pending ratification for deferred authority)" instead. Both objections have one cause and one fix. The cause is that the rejected section was prose with nothing behind it: the projection the author asked after had no source, and the convention that produced it could not be checked, so writing the convention down would have left it exactly as ad hoc as it was. The fix is that the candidates are data on the fact they answer, which is where the decision they lost is, so the section is not replaced but dissolved.

What a rejected alternative is follows from what an option is, which is the viable-options node's question and is cited here rather than restated. What this node adds is that the two kinds of rejection, the AI's and the author's, are one row with a different mark on it, and that the record keeps no second home for either. Amended 2026-09-04 from the answer that said this of the author's rejections alone and left the AI's outside the record: the larger half is the AI's, and the reason the author gave for persisting options at all, regression, bears on that half at least as hard, since a later session is at least as likely to re-propose a candidate that was rejected as dominated.

Traditions, each a reading with its own node: the decision-record form under the dialogue node, whose considered options are kept with the reason each lost beside the decision, which is the shape this answer takes; IBIS under viable-options, which attaches every argument to a position and never to the issue, so a candidate with no row has nowhere for its argument to live; and the Pareto frontier under the same node, which makes the AI's mark a dominance judgment rather than a preference and is why a passed-over option is still one the author may rule for. What this costs is that a fact's option list runs as long as its rationale's prose used to, a hundred and four passed candidates across twenty-nine nodes at the graph commit this was written against; that is the consequence of putting them where they can be read and not a reason against it.
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
