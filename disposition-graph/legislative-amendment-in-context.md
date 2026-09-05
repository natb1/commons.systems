---
question: What does an amendment printed against the text it changes say about naming the ground of an edit, and what does the record take from it?
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
source: The legislative practice of publishing an amendment against the text it would change. The Ramseyer rule of the United States House of Representatives, which requires a committee report on a bill to set out the existing law with the matter proposed to be omitted shown in brackets and the new matter in italic; the Cordon rule, the Senate's counterpart requirement for a reported bill; and the Keeling schedule of United Kingdom practice, a schedule printing an act as it would read once amended. Locus to be checked, the current rule and clause numbers for Ramseyer and Cordon, and the standing of the Keeling schedule in modern drafting guidance.
bears:
  - fact: answer
    option: edit-led-against-a-named-ground
    relation: adopted
---
## Answer

Supports leading with the edit, and adds the part the record was leaving to inference. An amendment read alone is a list of strikings and insertions that says nothing about what the law will be. The practice is therefore to publish it against the text it changes, so that a reader sees the standing law, what is struck from it, and what is put in its place, in one place and at one glance. What makes the device work is that the ground is identified and is authoritative. The reader knows the bracketed text is the law in force, so the italic text is a proposal about something that already binds.

The record takes the form and then has to supply what the tradition gets for free. Wherever an answer stands the projections lead with the edit rather than the whole, which is the practice exactly. But the ground here is not always an enacted text. It is the answer as ratified where the answer fact carries a ruling, and a draft nobody has confirmed where it does not, and those are different acts wearing the same clothes. So the option makes the projections name the ground instead of withholding the edit, which is the tradition's own logic run one step further than the tradition had to run it.

The departure is worth stating plainly, since it is the reason the clause exists. Legislative practice never faces a bill amending a draft; there is always a statute in force. The record's commonest case is the one the tradition has no word for, and the author's own observation of 2026-09-03, that a purpose node read as an edit to a confirmed disposition when nothing was confirmed, is that case doing damage. Naming the ground answers it.

The counter, attached and not resolved. Printing a proposal against an unconfirmed draft borrows the authority of the form itself. Brackets and italic say to a reader, without a word, that the surrounding text is in force, and a reader who skims will take the draft as settled precisely because the record chose the shape the tradition uses for statutes. The record's reply is a sentence saying what the ground is, which is weaker than the typography it sits beside; the tradition would say the remedy is not to use the form at all where there is nothing in force, and the record uses it and says so.

## Rationale

Surfaced by the second evaluation of `commons.systems/disposition-graph/dialogue`'s maieutic movement of 2026-09-04 and named in the fence's rationale among the readings owed under that node: "legislative amendment shown against the text it changes, for naming the ground of an edit". It bears on `edit-led-against-a-named-ground` because that is the clause the tradition informed and the clause the composed option `every-part-in-the-record` adopts; the entry is written on the clause the account names. The related engineering practice, reviewing a change as a diff against what stands, is read separately at `commons.systems/disposition-graph/change-reviewed-as-a-diff` under this node, since it answers a different question, the form the change is presented in rather than the ground it is presented against.

## Facts

### answer

The standing text is the only reading of this practice the pass produced, and
no second account of what the record takes from it is on the table.

### authority

Delegated, as every reading on the record recommends, because the relation
is the AI's from its own knowledge of the sources and the author has not read
them here. The `deferred` option beside it is what the account asks for, the
reading held until the author reads the sources, and it is the author's to
take.

## Account

Minted at reconciliation on 2026-09-04 under the author's bootstrap grant of that day, by a unit of the alignment sitting, from the pass with reference to tradition in `commons.systems/disposition-graph/dialogue`'s maieutic movement, which names this tradition among the readings owed under that node. Validated by the AI from its own knowledge of the sources; deferred until the author reads them, and delegated if the author declines to.

### Frontier finding, 2026-09-05

Kind: contradiction.

Forty-six reading nodes carry, verbatim, as the first sentence of the `### authority` subsection inside `## Facts`, the claim: "Delegated, as every reading on the record recommends, because the relation is the AI's from its own knowledge of the source and the author has not read it here." The claim is false at this commit. Measured on the graph: 59 nodes carry `form: reading`; 57 recommend `delegated` on the authority fact; `commons.systems/disposition-graph/srs-introduction` recommends `deferred` (disposition/disposition-graph/srs-introduction.md, `### authority`); and `commons.systems/disposition-graph/npm-committed-lockfile` carries an authority fact with its three options and no `recommends` at all (disposition/disposition-graph/npm-committed-lockfile.md, `### authority`). `commons.systems/disposition-graph/readings` carries a variant of the same claim in its authority fact's `against`, at lines 47 and 155: "every reading on the record recommends delegated for itself". The defect is not only that the count is wrong today. A standing answer that asserts a census of the record goes stale the moment a reading is minted, which is exactly what `commons.systems/disposition-graph/authority` records as the option `no-census-in-a-standing-answer` and what the `codd-update-anomaly` reading names — and `codd-update-anomaly` is itself one of the forty-six carrying it. Two nodes have already corrected their live text and carry the formula only in their `## Account`: `madr-decision-records` (line 184) and `progressive-disclosure` (lines 135 and 162); `madr-decision-records`'s corrected text refers the general question to this survey by name. Those two are named here as context and are not defects.

Also named: commons.systems/disposition-graph/anchoring-and-adjustment, commons.systems/disposition-graph/appellate-review-en-banc, commons.systems/disposition-graph/approval-directed-agents, commons.systems/disposition-graph/bentham-publicity, commons.systems/disposition-graph/brooks-surgical-team, commons.systems/disposition-graph/change-reviewed-as-a-diff, commons.systems/disposition-graph/chenery-reasoned-decision, commons.systems/disposition-graph/chestertons-fence, commons.systems/disposition-graph/codd-update-anomaly, commons.systems/disposition-graph/deprecation-not-deletion, commons.systems/disposition-graph/dissent-and-reconsideration, commons.systems/disposition-graph/dry-single-source-of-truth, commons.systems/disposition-graph/event-sourcing-derived-view, commons.systems/disposition-graph/fagan-inspection-roles, commons.systems/disposition-graph/file-drawer-and-pre-registration, commons.systems/disposition-graph/hansard-verbatim-record, commons.systems/disposition-graph/ibis-issue-based-information, commons.systems/disposition-graph/information-hiding, commons.systems/disposition-graph/level-triggered-reconciliation, commons.systems/disposition-graph/literate-programming, commons.systems/disposition-graph/montgomery-informed-consent, commons.systems/disposition-graph/multi-call-binary-and-facade, commons.systems/disposition-graph/nielsen-user-control-and-freedom, commons.systems/disposition-graph/none-of-the-above-ballot, commons.systems/disposition-graph/non-liquet, commons.systems/disposition-graph/notarial-minute, commons.systems/disposition-graph/not-proven-third-verdict, commons.systems/disposition-graph/n-version-programming, commons.systems/disposition-graph/ocap-attenuation, commons.systems/disposition-graph/operation-naming-in-telemetry, commons.systems/disposition-graph/pareto-frontier, commons.systems/disposition-graph/peirce-paper-doubt, commons.systems/disposition-graph/promotor-fidei, commons.systems/disposition-graph/review-approval-pinned-to-a-revision, commons.systems/disposition-graph/rfc-pep-status-field, commons.systems/disposition-graph/roberts-rules-commit-or-refer, commons.systems/disposition-graph/scholarly-peer-review, commons.systems/disposition-graph/scholastic-articulus, commons.systems/disposition-graph/segregation-of-duties, commons.systems/disposition-graph/self-contained-specification, commons.systems/disposition-graph/single-subject-rule, commons.systems/disposition-graph/special-verdict-form, commons.systems/disposition-graph/the-wrong-abstraction, commons.systems/disposition-graph/utility-syntax-flag-or-subcommand, commons.systems/disposition-graph/value-of-information, commons.systems/disposition-graph/readings, commons.systems/disposition-graph/srs-introduction, commons.systems/disposition-graph/npm-committed-lockfile, commons.systems/disposition-graph/madr-decision-records, commons.systems/disposition-graph/progressive-disclosure, commons.systems/disposition-graph/authority.

Proposed: Strike the census from all forty-six and from `readings`' `against`, replacing it with the rule rather than the count: the class recommended is delegated because the relation is the AI's from its own knowledge of the source and the author has not read it here — which is the reason, and which stands whatever other readings recommend. `madr-decision-records` and `progressive-disclosure` have already made this correction in their live text and are the model. Where a node wants to say that this is the record's settled practice for readings, it cites `commons.systems/disposition-graph/class-recommendation` rather than counting. `srs-introduction`'s `deferred` and `npm-committed-lockfile`'s absent recommendation are left as they are: they are the two counterexamples, and the point of the fix is that a rule stated as a rule does not need them to disappear.

Recorded as an option on commons.systems/disposition-graph/authority's answer fact: `no-census-anywhere-in-a-node` (source review, 2026-09-05).
