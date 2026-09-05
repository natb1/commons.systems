---
question: What does appellate review by a heavier bench say about grading the reviewer to the question, and what does the record take from it?
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
  - commons.systems/disposition-graph/review-model
source: How a reviewing body is constituted in appellate practice. In the United States, a panel of three circuit judges reviews one district judge, rehearing en banc by the full court is reserved for a question of exceptional importance under Federal Rule of Appellate Procedure 35, and a Supreme Court of nine sits above the circuits; in the United Kingdom, the Supreme Court sits in panels of five, enlarged to seven or nine for cases of constitutional importance. Locus to be checked, the wording of Rule 35.
bears:
  - fact: answer
    option: conditional-by-boldness
    relation: adopted
  - fact: answer
    option: fable-for-both-readings
    relation: diverged
---
## Answer

Supports grading the bench to the question, which is the rule the record carried and not the one it takes. The practice is that the reviewing body is constituted differently and more heavily than the body reviewed, and that the enlargement is an exception the ordinary panel makes room for: three judges over one, the full court only on a question of exceptional importance, nine above the circuits. The trigger is the importance of the question, and it is not applied to every case, because a bench enlarged by default is not an enlargement.

`conditional-by-boldness` is that practice in its purest form, and the relation is adopted. The most capable model when the node is global-tier or a ruling on it would settle other nodes is the rehearing en banc; the lesser model otherwise is the three-judge panel. The tradition supports the shape of the rule the record carried, though not one of its inputs: a court learns a question's importance from the record and from the parties' petition and never from a field the judgment under review writes, where the rule read it in part off `boldness`, which the drafter sets. The adoption is of the grading and not of that input.

The divergence is on the flat rule. `fable-for-both-readings` seats the heaviest bench on every reading, which is the one thing the practice declines to do; the answer's ground for it is that every ruling in this record is the irreversible step and every node in a bootstrap record clears the exceptional-importance bar, and the tradition does not concede that. It is recorded here as the tradition's standing objection to the answer rather than as an objection the answer has met: if the premise is right the tradition is simply inapplicable, and if it is wrong the record is running en banc on traffic tickets.

One disanalogy cuts at both relations and belongs in the reading. An appellate court reviews for error on a narrower question and does not re-find facts; the reading here re-reads the whole neighbourhood on its own checklist and reaches its own verdict, which is nearer a trial de novo than an appeal. The heavier bench is a warrant for correcting a narrower question, and it is a weaker warrant for reading the whole thing again — so this tradition supports the conditional shape less strongly than its purity suggests, and its objection to the flat rule is correspondingly weaker too.

## Rationale

Read in the tradition survey of the review sitting of 2026-09-04, and named in `review-model`'s account among the six that its pass with reference to tradition owes: "appellate review by a heavier bench, from the en banc rehearing on a question of exceptional importance, adopted on `conditional-by-boldness`, which is that rule in its purest form, and diverged from on `fable-for-both-readings`, since it grades the bench by the question's importance and every ruling here is the irreversible step". This is the one tradition the survey found that grades a reviewer by rank at all, and it grades by the question and not by the author, which is why the adoption lands on an option the record passed over.

## Facts

### answer

The standing text is the only reading of the practice the survey produced,
and no second account of what the record takes from it is on the table. The
disanalogy the answer records is part of the reading and not a rival to it.

### authority

Delegated, as every reading on the record recommends, because the relation
is the AI's from its own knowledge of the sources and the author has not read
them here. The `deferred` option beside it is what the account asks for, the
reading held until the author reads the sources, and it is the author's to
take.

## Account

Minted at the recording of `review-model`'s recommendation on 2026-09-04, under the author's bootstrap grant of that day to progress the adversarial-review dispositions through the maieutic movement and reconcile them immediately, from the tradition survey of the review sitting and the pass with reference to tradition that read it, which names this reading among the six owed under that node. Validated by the AI from its own knowledge of the sources; deferred until the author reads them, and delegated if the author declines to.

### Frontier finding, 2026-09-05

Kind: contradiction.

Forty-six reading nodes carry, verbatim, as the first sentence of the `### authority` subsection inside `## Facts`, the claim: "Delegated, as every reading on the record recommends, because the relation is the AI's from its own knowledge of the source and the author has not read it here." The claim is false at this commit. Measured on the graph: 59 nodes carry `form: reading`; 57 recommend `delegated` on the authority fact; `commons.systems/disposition-graph/srs-introduction` recommends `deferred` (disposition/disposition-graph/srs-introduction.md, `### authority`); and `commons.systems/disposition-graph/npm-committed-lockfile` carries an authority fact with its three options and no `recommends` at all (disposition/disposition-graph/npm-committed-lockfile.md, `### authority`). `commons.systems/disposition-graph/readings` carries a variant of the same claim in its authority fact's `against`, at lines 47 and 155: "every reading on the record recommends delegated for itself". The defect is not only that the count is wrong today. A standing answer that asserts a census of the record goes stale the moment a reading is minted, which is exactly what `commons.systems/disposition-graph/authority` records as the option `no-census-in-a-standing-answer` and what the `codd-update-anomaly` reading names — and `codd-update-anomaly` is itself one of the forty-six carrying it. Two nodes have already corrected their live text and carry the formula only in their `## Account`: `madr-decision-records` (line 184) and `progressive-disclosure` (lines 135 and 162); `madr-decision-records`'s corrected text refers the general question to this survey by name. Those two are named here as context and are not defects.

Also named: commons.systems/disposition-graph/anchoring-and-adjustment, commons.systems/disposition-graph/approval-directed-agents, commons.systems/disposition-graph/bentham-publicity, commons.systems/disposition-graph/brooks-surgical-team, commons.systems/disposition-graph/change-reviewed-as-a-diff, commons.systems/disposition-graph/chenery-reasoned-decision, commons.systems/disposition-graph/chestertons-fence, commons.systems/disposition-graph/codd-update-anomaly, commons.systems/disposition-graph/deprecation-not-deletion, commons.systems/disposition-graph/dissent-and-reconsideration, commons.systems/disposition-graph/dry-single-source-of-truth, commons.systems/disposition-graph/event-sourcing-derived-view, commons.systems/disposition-graph/fagan-inspection-roles, commons.systems/disposition-graph/file-drawer-and-pre-registration, commons.systems/disposition-graph/hansard-verbatim-record, commons.systems/disposition-graph/ibis-issue-based-information, commons.systems/disposition-graph/information-hiding, commons.systems/disposition-graph/legislative-amendment-in-context, commons.systems/disposition-graph/level-triggered-reconciliation, commons.systems/disposition-graph/literate-programming, commons.systems/disposition-graph/montgomery-informed-consent, commons.systems/disposition-graph/multi-call-binary-and-facade, commons.systems/disposition-graph/nielsen-user-control-and-freedom, commons.systems/disposition-graph/none-of-the-above-ballot, commons.systems/disposition-graph/non-liquet, commons.systems/disposition-graph/notarial-minute, commons.systems/disposition-graph/not-proven-third-verdict, commons.systems/disposition-graph/n-version-programming, commons.systems/disposition-graph/ocap-attenuation, commons.systems/disposition-graph/operation-naming-in-telemetry, commons.systems/disposition-graph/pareto-frontier, commons.systems/disposition-graph/peirce-paper-doubt, commons.systems/disposition-graph/promotor-fidei, commons.systems/disposition-graph/review-approval-pinned-to-a-revision, commons.systems/disposition-graph/rfc-pep-status-field, commons.systems/disposition-graph/roberts-rules-commit-or-refer, commons.systems/disposition-graph/scholarly-peer-review, commons.systems/disposition-graph/scholastic-articulus, commons.systems/disposition-graph/segregation-of-duties, commons.systems/disposition-graph/self-contained-specification, commons.systems/disposition-graph/single-subject-rule, commons.systems/disposition-graph/special-verdict-form, commons.systems/disposition-graph/the-wrong-abstraction, commons.systems/disposition-graph/utility-syntax-flag-or-subcommand, commons.systems/disposition-graph/value-of-information, commons.systems/disposition-graph/readings, commons.systems/disposition-graph/srs-introduction, commons.systems/disposition-graph/npm-committed-lockfile, commons.systems/disposition-graph/madr-decision-records, commons.systems/disposition-graph/progressive-disclosure, commons.systems/disposition-graph/authority.

Proposed: Strike the census from all forty-six and from `readings`' `against`, replacing it with the rule rather than the count: the class recommended is delegated because the relation is the AI's from its own knowledge of the source and the author has not read it here — which is the reason, and which stands whatever other readings recommend. `madr-decision-records` and `progressive-disclosure` have already made this correction in their live text and are the model. Where a node wants to say that this is the record's settled practice for readings, it cites `commons.systems/disposition-graph/class-recommendation` rather than counting. `srs-introduction`'s `deferred` and `npm-committed-lockfile`'s absent recommendation are left as they are: they are the two counterexamples, and the point of the fix is that a rule stated as a rule does not need them to disappear.

Recorded as an option on commons.systems/disposition-graph/authority's answer fact: `no-census-anywhere-in-a-node` (source review, 2026-09-05).
