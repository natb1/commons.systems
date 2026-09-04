---
question: How are rejected alternatives recorded?
form: rule
stage: maieutic
review:
  verdict: kickback
  strength: moderate
  date: 2026-09-03
  of: 30fbaa7140576becf743ee5c7e094e1b980037d0
facts:
  - name: answer
    options:
      - name: rejected-list-on-node
        source: ai
        ref: "2026-09-03"
      - name: rejected-nodes
        source: ai
        ref: "2026-09-03"
      - name: prose-in-rationale
        source: ai
        ref: "2026-09-03"
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
    recommends: non-chosen-viable-options
    boldness: moderate
    stands: non-chosen-viable-options
  - name: authority
    options:
      - name: ratified
      - name: delegated
      - name: deferred
    recommends: ratified
    boldness: moderate
under:
  - commons.systems/disposition-graph/node
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

#### rejected-list-on-node

A rejected list on the node, each entry one alternative answer and why it lost, projected in the authority section, with the rationale keeping only why the standing answer stands. It is a schema change, and adopting it means rewriting the rejected prose of purpose, authority, node, instruments, readings, namespaces, projection and model before any of them is recorded. The reviews ask it to say what an entry contains, whether an entry is versioned if the alternative is later adopted, and that a rationale may cite its rejected entries, since several rationales argue by elimination.

#### rejected-nodes

Rejected alternatives become nodes of their own carrying a rejected class. It is the boldest of the three options and is neither recommended nor withdrawn.

#### prose-in-rationale

Rejected alternatives stay prose in the rationale, as now, with the browser's heading match documented as the contract rather than left as an accident of the template. The second review established that the projector already renders a rejected section from a rationale heading, so the projection the author asked for needs no schema change, and the session's reply says this materially favours the third option at zero cost.

#### authors-rejected-section-question

The author's words of 2026-09-02 asking what the rejected section is a projection of, and proposing an authority section with notes on pending ratification in its place, are the question rejected answers, and they are carried on node rather than on rejected. Rejected's own Disposition carries different words, those of 2026-09-03 on the under edge listing rejected as prose. It stands at the ruling stage recommending ratified, so the ground of its ruling should be on it. (Raised on commons.systems/disposition-graph/node.)

#### record-rejected-dispositions

The author's words carried here say that listing rejected alternatives as prose under the rationale is too ad hoc and that recording rejected dispositions may make sense. Rejected carries the same words and its recommended option is the structured list, but its second review established that the browser already renders a rejected section from rationale prose, which materially favours keeping the prose. (Raised on commons.systems/disposition-graph/under.)

#### non-chosen-viable-options

A rejected alternative is a viable option the author did not choose, kept on the fact beside the confirmed choice with the reason it was not taken and the traditions bearing on it; the projector reads the structure and the rationale cites it. It is `rejected-list-on-node` generalised to every fact, and the fact the second review established, that the projector already reads a rationale heading, no longer decides the question, since the structure exists for regression and for the browser's drill-down and not for the projector alone. The author's objection carried above, that prose under the rationale seems too ad hoc, is what the structure answers. Raised on commons.systems/disposition-graph/viable-options, from the author's words of 2026-09-04 recorded there.

#### passed-over-stays-listed

A rejected alternative is any candidate the AI considered and can name, kept on the fact with its status and the reason it was not taken, whether or not the AI still holds it viable: `status: passed` with its `reason`, as `viable-options`' option `passed-over-options-stay` encodes it. Version control holds nothing the record does not, and the rejected passages of the rationales migrate as options passed over; the rationale argues and does not list. Raised on commons.systems/disposition-graph/prose-and-structure, whose clean-context review of 2026-09-04 found the membership rule to be this node's and `viable-options`'.
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
