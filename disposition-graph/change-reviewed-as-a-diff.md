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

### Frontier finding, 2026-09-05

Kind: contradiction.

Forty-six reading nodes carry, verbatim, as the first sentence of the `### authority` subsection inside `## Facts`, the claim: "Delegated, as every reading on the record recommends, because the relation is the AI's from its own knowledge of the source and the author has not read it here." The claim is false at this commit. Measured on the graph: 59 nodes carry `form: reading`; 57 recommend `delegated` on the authority fact; `commons.systems/disposition-graph/srs-introduction` recommends `deferred` (disposition/disposition-graph/srs-introduction.md, `### authority`); and `commons.systems/disposition-graph/npm-committed-lockfile` carries an authority fact with its three options and no `recommends` at all (disposition/disposition-graph/npm-committed-lockfile.md, `### authority`). `commons.systems/disposition-graph/readings` carries a variant of the same claim in its authority fact's `against`, at lines 47 and 155: "every reading on the record recommends delegated for itself". The defect is not only that the count is wrong today. A standing answer that asserts a census of the record goes stale the moment a reading is minted, which is exactly what `commons.systems/disposition-graph/authority` records as the option `no-census-in-a-standing-answer` and what the `codd-update-anomaly` reading names — and `codd-update-anomaly` is itself one of the forty-six carrying it. Two nodes have already corrected their live text and carry the formula only in their `## Account`: `madr-decision-records` (line 184) and `progressive-disclosure` (lines 135 and 162); `madr-decision-records`'s corrected text refers the general question to this survey by name. Those two are named here as context and are not defects.

Also named: commons.systems/disposition-graph/anchoring-and-adjustment, commons.systems/disposition-graph/appellate-review-en-banc, commons.systems/disposition-graph/approval-directed-agents, commons.systems/disposition-graph/bentham-publicity, commons.systems/disposition-graph/brooks-surgical-team, commons.systems/disposition-graph/chenery-reasoned-decision, commons.systems/disposition-graph/chestertons-fence, commons.systems/disposition-graph/codd-update-anomaly, commons.systems/disposition-graph/deprecation-not-deletion, commons.systems/disposition-graph/dissent-and-reconsideration, commons.systems/disposition-graph/dry-single-source-of-truth, commons.systems/disposition-graph/event-sourcing-derived-view, commons.systems/disposition-graph/fagan-inspection-roles, commons.systems/disposition-graph/file-drawer-and-pre-registration, commons.systems/disposition-graph/hansard-verbatim-record, commons.systems/disposition-graph/ibis-issue-based-information, commons.systems/disposition-graph/information-hiding, commons.systems/disposition-graph/legislative-amendment-in-context, commons.systems/disposition-graph/level-triggered-reconciliation, commons.systems/disposition-graph/literate-programming, commons.systems/disposition-graph/montgomery-informed-consent, commons.systems/disposition-graph/multi-call-binary-and-facade, commons.systems/disposition-graph/nielsen-user-control-and-freedom, commons.systems/disposition-graph/none-of-the-above-ballot, commons.systems/disposition-graph/non-liquet, commons.systems/disposition-graph/notarial-minute, commons.systems/disposition-graph/not-proven-third-verdict, commons.systems/disposition-graph/n-version-programming, commons.systems/disposition-graph/ocap-attenuation, commons.systems/disposition-graph/operation-naming-in-telemetry, commons.systems/disposition-graph/pareto-frontier, commons.systems/disposition-graph/peirce-paper-doubt, commons.systems/disposition-graph/promotor-fidei, commons.systems/disposition-graph/review-approval-pinned-to-a-revision, commons.systems/disposition-graph/rfc-pep-status-field, commons.systems/disposition-graph/roberts-rules-commit-or-refer, commons.systems/disposition-graph/scholarly-peer-review, commons.systems/disposition-graph/scholastic-articulus, commons.systems/disposition-graph/segregation-of-duties, commons.systems/disposition-graph/self-contained-specification, commons.systems/disposition-graph/single-subject-rule, commons.systems/disposition-graph/special-verdict-form, commons.systems/disposition-graph/the-wrong-abstraction, commons.systems/disposition-graph/utility-syntax-flag-or-subcommand, commons.systems/disposition-graph/value-of-information, commons.systems/disposition-graph/readings, commons.systems/disposition-graph/srs-introduction, commons.systems/disposition-graph/npm-committed-lockfile, commons.systems/disposition-graph/madr-decision-records, commons.systems/disposition-graph/progressive-disclosure, commons.systems/disposition-graph/authority.

Proposed: Strike the census from all forty-six and from `readings`' `against`, replacing it with the rule rather than the count: the class recommended is delegated because the relation is the AI's from its own knowledge of the source and the author has not read it here — which is the reason, and which stands whatever other readings recommend. `madr-decision-records` and `progressive-disclosure` have already made this correction in their live text and are the model. Where a node wants to say that this is the record's settled practice for readings, it cites `commons.systems/disposition-graph/class-recommendation` rather than counting. `srs-introduction`'s `deferred` and `npm-committed-lockfile`'s absent recommendation are left as they are: they are the two counterexamples, and the point of the fix is that a rule stated as a rule does not need them to disappear.

Recorded as an option on commons.systems/disposition-graph/authority's answer fact: `no-census-anywhere-in-a-node` (source review, 2026-09-05).
