---
question: What does the duty of informed consent say about who decides which decisions the decider is shown, and what does the record take from it?
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
  - commons.systems/disposition-graph/alignment-page
source: Montgomery v Lanarkshire Health Board [2015] UKSC 11, the duty to take reasonable care to ensure that the patient is aware of any material risks involved in any recommended treatment and of any reasonable alternative or variant treatments, with materiality tested by whether a reasonable person in the patient's position would be likely to attach significance to the risk or the adviser is or should be aware that this patient would; departing from the professional-custom standard of Bolam v Friern Hospital Management Committee [1957] 1 WLR 582 as applied to disclosure in Sidaway [1985] AC 871. Locus to be checked, the paragraph numbers of the judgment.
bears:
  - fact: answer
    option: three-column-ruling-screen
    relation: diverged
  - fact: answer
    option: every-fact-every-option
    relation: adopted
---
## Answer

Supports the disposition, and names the fault in the option it replaces with unusual precision. The duty has two halves. The first is that the decider is told of the material risks of what is recommended and of the reasonable alternatives to it, so the alternatives are part of the disclosure and not an optional extra. The second is the test of materiality, which is taken from the decider's side: what this decider, or a reasonable person in their position, would be likely to attach significance to. The court set that against the older standard, under which a body of responsible professional opinion decided how much the patient needed to know, and rejected it for decisions of this kind.

The fold rule was the older standard. Boldness is the AI's own measure of how much of a recommendation rests on its own knowledge, and under the fold that measure set the scope of what the author was shown: a decision the AI was surest of was a decision the author never saw. Whatever the measure's merits, it is the recommender's judgment of what the decider needs, which is exactly what the tradition removed. The disposition takes the other side, every fact listed and none folded, and lets boldness stay as information beside the recommendation while it decides nothing about what is shown.

The transposition is by analogy and the reading says where the analogy stops. Montgomery is about a person's decision over their own body under advice from someone with more knowledge, and its content is a legal duty of care with remedies attached. What carries across is the structural point, that the party making the recommendation is the wrong party to decide what the decider finds significant, and that alternatives belong in the disclosure. What does not carry across is the duty itself, its therapeutic exception, and any suggestion that the record owes the author a standard of care.

## Rationale

Recorded in the tradition pass on the alignment page, 2026-09-04, which called informed consent the strongest support the pass found and said it names the fold rule's fault exactly. It bears on `every-fact-every-option` because that option lists every fact and every option under it and lets nothing about the AI's own confidence decide what the author sees, and on `three-column-ruling-screen` as a divergence because that option's fold rule is the professional-custom standard in the AI's hands.

## Facts

### answer

The standing text is the only reading of this judgment the pass produced, and
no second account of what the record takes from it is on the table.

### authority

Delegated, as every reading on the record recommends, because the relation
is the AI's from its own knowledge of the source and the author has not read
it here. The `deferred` option beside it is what the account asks for, the
reading held until the author reads the source, and it is the author's to
take.

## Account

Minted at reconciliation on 2026-09-04 under the author's bootstrap grant of that day, from the tradition pass of the alignment-page sitting: "The duty of disclosure in `Montgomery` is to make the decider aware of the material risks 'and of any reasonable alternative or variant treatments', and its materiality test is what the decider would attach significance to, not what the recommender judges worth raising. That is the express rejection of the professional-custom standard, and the fold rule is that standard: the AI's own measure of its own warrant setting the scope of what the author is shown." Validated by the AI from its own knowledge of the source; deferred until the author reads it, and delegated if the author declines to.

### Frontier finding, 2026-09-05

Kind: contradiction.

Forty-six reading nodes carry, verbatim, as the first sentence of the `### authority` subsection inside `## Facts`, the claim: "Delegated, as every reading on the record recommends, because the relation is the AI's from its own knowledge of the source and the author has not read it here." The claim is false at this commit. Measured on the graph: 59 nodes carry `form: reading`; 57 recommend `delegated` on the authority fact; `commons.systems/disposition-graph/srs-introduction` recommends `deferred` (disposition/disposition-graph/srs-introduction.md, `### authority`); and `commons.systems/disposition-graph/npm-committed-lockfile` carries an authority fact with its three options and no `recommends` at all (disposition/disposition-graph/npm-committed-lockfile.md, `### authority`). `commons.systems/disposition-graph/readings` carries a variant of the same claim in its authority fact's `against`, at lines 47 and 155: "every reading on the record recommends delegated for itself". The defect is not only that the count is wrong today. A standing answer that asserts a census of the record goes stale the moment a reading is minted, which is exactly what `commons.systems/disposition-graph/authority` records as the option `no-census-in-a-standing-answer` and what the `codd-update-anomaly` reading names — and `codd-update-anomaly` is itself one of the forty-six carrying it. Two nodes have already corrected their live text and carry the formula only in their `## Account`: `madr-decision-records` (line 184) and `progressive-disclosure` (lines 135 and 162); `madr-decision-records`'s corrected text refers the general question to this survey by name. Those two are named here as context and are not defects.

Also named: commons.systems/disposition-graph/anchoring-and-adjustment, commons.systems/disposition-graph/appellate-review-en-banc, commons.systems/disposition-graph/approval-directed-agents, commons.systems/disposition-graph/bentham-publicity, commons.systems/disposition-graph/brooks-surgical-team, commons.systems/disposition-graph/change-reviewed-as-a-diff, commons.systems/disposition-graph/chenery-reasoned-decision, commons.systems/disposition-graph/chestertons-fence, commons.systems/disposition-graph/codd-update-anomaly, commons.systems/disposition-graph/deprecation-not-deletion, commons.systems/disposition-graph/dissent-and-reconsideration, commons.systems/disposition-graph/dry-single-source-of-truth, commons.systems/disposition-graph/event-sourcing-derived-view, commons.systems/disposition-graph/fagan-inspection-roles, commons.systems/disposition-graph/file-drawer-and-pre-registration, commons.systems/disposition-graph/hansard-verbatim-record, commons.systems/disposition-graph/ibis-issue-based-information, commons.systems/disposition-graph/information-hiding, commons.systems/disposition-graph/legislative-amendment-in-context, commons.systems/disposition-graph/level-triggered-reconciliation, commons.systems/disposition-graph/literate-programming, commons.systems/disposition-graph/multi-call-binary-and-facade, commons.systems/disposition-graph/nielsen-user-control-and-freedom, commons.systems/disposition-graph/none-of-the-above-ballot, commons.systems/disposition-graph/non-liquet, commons.systems/disposition-graph/notarial-minute, commons.systems/disposition-graph/not-proven-third-verdict, commons.systems/disposition-graph/n-version-programming, commons.systems/disposition-graph/ocap-attenuation, commons.systems/disposition-graph/operation-naming-in-telemetry, commons.systems/disposition-graph/pareto-frontier, commons.systems/disposition-graph/peirce-paper-doubt, commons.systems/disposition-graph/promotor-fidei, commons.systems/disposition-graph/review-approval-pinned-to-a-revision, commons.systems/disposition-graph/rfc-pep-status-field, commons.systems/disposition-graph/roberts-rules-commit-or-refer, commons.systems/disposition-graph/scholarly-peer-review, commons.systems/disposition-graph/scholastic-articulus, commons.systems/disposition-graph/segregation-of-duties, commons.systems/disposition-graph/self-contained-specification, commons.systems/disposition-graph/single-subject-rule, commons.systems/disposition-graph/special-verdict-form, commons.systems/disposition-graph/the-wrong-abstraction, commons.systems/disposition-graph/utility-syntax-flag-or-subcommand, commons.systems/disposition-graph/value-of-information, commons.systems/disposition-graph/readings, commons.systems/disposition-graph/srs-introduction, commons.systems/disposition-graph/npm-committed-lockfile, commons.systems/disposition-graph/madr-decision-records, commons.systems/disposition-graph/progressive-disclosure, commons.systems/disposition-graph/authority.

Proposed: Strike the census from all forty-six and from `readings`' `against`, replacing it with the rule rather than the count: the class recommended is delegated because the relation is the AI's from its own knowledge of the source and the author has not read it here — which is the reason, and which stands whatever other readings recommend. `madr-decision-records` and `progressive-disclosure` have already made this correction in their live text and are the model. Where a node wants to say that this is the record's settled practice for readings, it cites `commons.systems/disposition-graph/class-recommendation` rather than counting. `srs-introduction`'s `deferred` and `npm-committed-lockfile`'s absent recommendation are left as they are: they are the two counterexamples, and the point of the fix is that a rule stated as a rule does not need them to disappear.

Recorded as an option on commons.systems/disposition-graph/authority's answer fact: `no-census-anywhere-in-a-node` (source review, 2026-09-05).
