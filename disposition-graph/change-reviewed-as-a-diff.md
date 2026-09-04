---
question: What does reviewing a change as a diff against what stands say about how a recommendation is presented, and what does the record take from it?
stage: maieutic
facts:
  - name: answer
    options:
      - name: standing
        source: ai
        ref: "2026-09-04"
    recommends: standing
    boldness: moderate
    stands: standing
  - name: authority
    options:
      - name: ratified
      - name: delegated
      - name: deferred
    recommends: delegated
    boldness: moderate
form: reading
under:
  - commons.systems/disposition-graph/dialogue
source: The practice of reviewing a change rather than a work product. The differential file comparison of Hunt and McIlroy at Bell Laboratories (1976), from which the diff utility comes, and Larry Wall's patch (1985), which made the difference itself the thing that travels; the changeset review of Gerrit and of the pull request, where the reader is shown the difference against a named base revision and never the file alone; and the inspection tradition it displaced, in which a whole work product was read at a meeting. Locus to be checked, the Bell Laboratories computing science technical report number for the Hunt and McIlroy paper, and the first release of patch.
bears:
  - fact: answer
    option: facts-carry-options
    relation: adopted
---
## Answer

Supports showing what a ruling would change rather than what the text would be, and the record adopts it with one deliberate reversal. The practice's claim is about the reader's attention. A reviewer given a whole artifact cannot tell what is being asked of them, so the artifact is presented as a difference against a named base, and the difference is what is discussed, approved and applied. The reason it works is that the base is named and the difference is derived from it, so the two can always be recomposed and neither can describe the other wrongly.

The record takes the presentation and reverses what is stored. `## Recommendation` holds the whole proposed node, frontmatter and sections, and the edit is derived from that and the node, field by field and word by word, and shown beside the whole; a diff is never stored. The reversal is deliberate and the tradition's own logic is the argument for it. What must not be able to lie is the relation between the base and the change, and the way to guarantee it is to hold one text and compute the other, which is what a version control system does under the diff it shows. Storing the diff is what makes a stored diff go stale.

The record also takes the second half of the practice, that the base is named. Wherever an answer stands the projections lead with the edit and say what it is against; where no answer stands there is nothing to diff and the whole is shown. The tradition has no case for that last one, since a change always has a parent revision, and the record's commonest situation, a first answer with nothing behind it, is outside what the practice was built for. Naming the ground is `commons.systems/disposition-graph/legislative-amendment-in-context`'s subject under this node, and this reading stops at the form.

The counter, from the author, and the record's answer to it. A whole-node recommendation goes stale at least as easily as a diff, which is the author's observation of 2026-09-03 in as many words, so choosing the whole over the difference buys nothing on staleness by itself. What the record answers with is the pin and not the form, and the pin is read separately at `commons.systems/disposition-graph/review-approval-pinned-to-a-revision`. The practice would add a second objection the record has not answered, that a reviewer shown the whole will read the whole, so the attention the diff was invented to protect is spent unless the projection that derives the edit is actually in front of the reader.

## Rationale

Named in prose in `commons.systems/disposition-graph/dialogue`'s standing rationale by the sitting of 2026-09-03, "the review of a change as a diff against what stands", and left owed as a reading; the fence of 2026-09-04 carries it among the three that sitting named and left owed, which `commons.systems/disposition-graph/prose-and-structure` holds may not stay in prose. It bears on `facts-carry-options`, the option that stands, whose answer holds the recommendation as a whole fenced node with the edit derived from it and never stored; the composed option `every-part-in-the-record` keeps that clause and adds the ground the edit is named against, which is the subject of a different reading under this node, so no second relation is written here.

## Facts

### answer

The standing text is the only reading of this practice the record has
produced, and no second account of what it takes from it is on the table.

### authority

Delegated, as every reading on the record recommends, because the relation
is the AI's from its own knowledge of the sources and the author has not read
them here. The `deferred` option beside it is what the account asks for, the
reading held until the author reads the sources, and it is the author's to
take.

## Account

Minted at reconciliation on 2026-09-04 under the author's bootstrap grant of that day, by a unit of the alignment sitting, from the prose tradition list in `commons.systems/disposition-graph/dialogue`'s standing rationale, which that node's fence of 2026-09-04 carries forward as one of three readings still owed under it. Validated by the AI from its own knowledge of the sources; deferred until the author reads them, and delegated if the author declines to.
