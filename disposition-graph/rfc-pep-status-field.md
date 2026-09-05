---
question: What does the status field of the RFC and PEP processes say about a document carrying the state it has reached, and what does the record take from it?
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
source: The status of a document in a standards process. RFC 2026, The Internet Standards Process Revision 3 (1996), whose standards-track maturity levels run Proposed Standard, Draft Standard and Internet Standard, with Experimental, Informational and Historic beside the track, and whose later revision reduced the track to two levels; and PEP 1, PEP Purpose and Guidelines (Warsaw, Hylton and Goodger, 2000), whose status runs Draft, Deferred, Accepted, Final, Active, Rejected, Withdrawn and Superseded, moved by the process and its deciders rather than by the document's author. Locus to be checked, the section numbers in RFC 2026, the number and date of the RFC that reduced the maturity levels, and the PEP 1 revision this reading's status list is taken from.
bears:
  - fact: answer
    option: facts-carry-options
    relation: adopted
---
## Answer

Supports one field naming where the document has got to, and supplies the shape the record's `stage` takes. What both processes settled on is a single named state on the document, drawn from a fixed and ordered set, moved by the process rather than by whoever is holding the pen. The value of it is that a reader knows two things at once, what has already happened to the document and what is owed next, and neither has to be reconstructed from the document's history or inferred from how finished the prose looks.

The record takes it whole for the dialogue. `stage` is one field with four values in order, periagogic, maieutic, review, ruling, so it says what is behind the node as well as what the next movement is; a kickback moves it back, which is the same field used the way both processes use theirs when a document returns for work. The alternative the record considered and passed over, a date per movement, is the history that version control already holds, and the tradition's own practice is against it too, since neither process stores a transition log on the face of the document.

Where the record parts from these traditions is not on the stage but on the class, and the divergence belongs to another node. RFC and PEP store the mark of authority on the document itself, because the mark is a speech act by the authority and a reader must see it without reconstructing anything. This record stores no such mark. A node's class is a fold over the rulings on its facts, and a stamp beside them would be the copy that drifts. That case is the strongest one against the derived class, and `commons.systems/disposition-graph/viable-options`' account records it in those terms as the steelman for the stamp; the relation belongs on the option that decides how the class is held, and it is not written here, since the account that owes this reading gives one relation.

One condition the tradition sets and this record does not meet. In both processes the states are moved by a body that is not the document's author, an area director and the IESG in one, the steering council and the PEP delegate in the other, so the status is a claim about the document made from outside it. Here the AI writes the node and writes its stage. The record's answer is the reading that stands between the recommendation and the author, and the author's ruling at the end of it, which is a check at two points and not the standing separation the tradition has.

## Rationale

Named in prose in `commons.systems/disposition-graph/dialogue`'s standing rationale by the sitting of 2026-09-03, "the RFC and PEP processes, a status field on a prose document with a fixed order of states", and left owed as a reading; the fence of 2026-09-04 carries it among the three that sitting named and left owed, which `commons.systems/disposition-graph/prose-and-structure` holds may not stay in prose, since a tradition named in a rationale carries no `bears` entry and no pin. It bears on `facts-carry-options`, the option that stands, because that is the encoding in force whose `stage` clause the tradition informed; the composed option `every-part-in-the-record` keeps the clause unchanged, and no second relation is written there, the account giving one.

## Facts

### answer

The standing text is the only reading of these two processes the record has
produced, and no second account of what it takes from them is on the table.

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

Also named: commons.systems/disposition-graph/anchoring-and-adjustment, commons.systems/disposition-graph/appellate-review-en-banc, commons.systems/disposition-graph/approval-directed-agents, commons.systems/disposition-graph/bentham-publicity, commons.systems/disposition-graph/brooks-surgical-team, commons.systems/disposition-graph/change-reviewed-as-a-diff, commons.systems/disposition-graph/chenery-reasoned-decision, commons.systems/disposition-graph/chestertons-fence, commons.systems/disposition-graph/codd-update-anomaly, commons.systems/disposition-graph/deprecation-not-deletion, commons.systems/disposition-graph/dissent-and-reconsideration, commons.systems/disposition-graph/dry-single-source-of-truth, commons.systems/disposition-graph/event-sourcing-derived-view, commons.systems/disposition-graph/fagan-inspection-roles, commons.systems/disposition-graph/file-drawer-and-pre-registration, commons.systems/disposition-graph/hansard-verbatim-record, commons.systems/disposition-graph/ibis-issue-based-information, commons.systems/disposition-graph/information-hiding, commons.systems/disposition-graph/legislative-amendment-in-context, commons.systems/disposition-graph/level-triggered-reconciliation, commons.systems/disposition-graph/literate-programming, commons.systems/disposition-graph/montgomery-informed-consent, commons.systems/disposition-graph/multi-call-binary-and-facade, commons.systems/disposition-graph/nielsen-user-control-and-freedom, commons.systems/disposition-graph/none-of-the-above-ballot, commons.systems/disposition-graph/non-liquet, commons.systems/disposition-graph/notarial-minute, commons.systems/disposition-graph/not-proven-third-verdict, commons.systems/disposition-graph/n-version-programming, commons.systems/disposition-graph/ocap-attenuation, commons.systems/disposition-graph/operation-naming-in-telemetry, commons.systems/disposition-graph/pareto-frontier, commons.systems/disposition-graph/peirce-paper-doubt, commons.systems/disposition-graph/promotor-fidei, commons.systems/disposition-graph/review-approval-pinned-to-a-revision, commons.systems/disposition-graph/roberts-rules-commit-or-refer, commons.systems/disposition-graph/scholarly-peer-review, commons.systems/disposition-graph/scholastic-articulus, commons.systems/disposition-graph/segregation-of-duties, commons.systems/disposition-graph/self-contained-specification, commons.systems/disposition-graph/single-subject-rule, commons.systems/disposition-graph/special-verdict-form, commons.systems/disposition-graph/the-wrong-abstraction, commons.systems/disposition-graph/utility-syntax-flag-or-subcommand, commons.systems/disposition-graph/value-of-information, commons.systems/disposition-graph/readings, commons.systems/disposition-graph/srs-introduction, commons.systems/disposition-graph/npm-committed-lockfile, commons.systems/disposition-graph/madr-decision-records, commons.systems/disposition-graph/progressive-disclosure, commons.systems/disposition-graph/authority.

Proposed: Strike the census from all forty-six and from `readings`' `against`, replacing it with the rule rather than the count: the class recommended is delegated because the relation is the AI's from its own knowledge of the source and the author has not read it here — which is the reason, and which stands whatever other readings recommend. `madr-decision-records` and `progressive-disclosure` have already made this correction in their live text and are the model. Where a node wants to say that this is the record's settled practice for readings, it cites `commons.systems/disposition-graph/class-recommendation` rather than counting. `srs-introduction`'s `deferred` and `npm-committed-lockfile`'s absent recommendation are left as they are: they are the two counterexamples, and the point of the fix is that a rule stated as a rule does not need them to disappear.

Recorded as an option on commons.systems/disposition-graph/authority's answer fact: `no-census-anywhere-in-a-node` (source review, 2026-09-05).
