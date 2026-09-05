---
question: What does the duty of reasoned decision say about an optional reason beside a ruling, and what does the record take from it?
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
source: SEC v Chenery Corp., 318 U.S. 80 (1943), holding that an administrative order can be sustained only on the grounds on which the record shows the agency itself acted, so that a reason supplied afterwards by a reviewing court cannot save it; and the duty to give reasons in the Administrative Procedure Act of 1946, the concise general statement of basis and purpose required with a rule and the findings, conclusions and reasons required in a formal decision. Locus to be checked, the page of the holding and the section numbers of the Act.
bears:
  - fact: answer
    option: every-fact-every-option
    relation: diverged
  - node: commons.systems/disposition-graph/dialogue
    fact: answer
    option: every-part-in-the-record
    relation: adopted
  - node: commons.systems/disposition-graph/recording
    fact: answer
    option: per-fact-after-two-readings
    relation: adopted
---
## Answer

Against the optionality, and the divergence is recorded with its counter attached. The tradition's rule is that a decision stands on the reason its decider gave when deciding, and on no other. A reason discovered later, however good, is somebody else's reason and cannot support what was done; and where the duty is statutory the reason is a condition of the decision's validity rather than a courtesy to the reader. The two loci say it from both ends, the court refusing to supply grounds the agency did not give, and the statute making the giving compulsory.

The record already enforces the first half where it matters most. A ruling is the author's act recorded with their response and their words, and `authority` holds that a ruling whose words are not in the record is invalid, which is the Chenery rule applied to ratification. Where the page diverges is on the reason for the choice: the text control in the option's drill-down is optional, so a ruling may be recorded with the choice and no ground at all, and a later reader meets a decision with no reason beside it.

The record's ground for the divergence, the author having asked only that the input be optional, is that the ruler here is the principal and not an agent under review, and that forced free-text fields produce filler rather than reasons. Both are real, and the second is a genuine finding against the tradition's remedy. The first is only partly true, and the reading says so: the record exists so that agents act on it later, which makes the author accountable to a reader even where they are accountable to no authority, and the reader who meets a bare ruling is the record's own future session. The divergence stands with that counter beside it rather than being resolved either way.

## Rationale

Recorded in the tradition pass on the alignment page, 2026-09-04, in the finding on the rationale field's optionality, which the pass classed as a divergence from every tradition of reasoned decision and recorded with the counter-argument attached. It bears on `every-fact-every-option` as a divergence because that option is where the author's reason lives, one step down on the option's row, and where its optionality is settled.

## Facts

### answer

The standing text is the only reading of these two loci the pass produced. A
second account, that a required reason on a ruling discharges the divergence,
belongs on the alignment page as an option on its answer fact rather than
here, since it would change what the page asks.

### authority

Delegated, as every reading on the record recommends, because the relation
is the AI's from its own knowledge of the sources and the author has not read
them here. The `deferred` option beside it is what the account asks for, the
reading held until the author reads the sources, and it is the author's to
take.

## Account

Minted at reconciliation on 2026-09-04 under the author's bootstrap grant of that day, from the tradition pass of the alignment-page sitting: "The rationale field's optionality is a divergence from every tradition of reasoned decision. `Chenery` holds that an action stands on the reason its decider gave at the time, which is what `authority` already enforces on the author's words, and the APA duty makes the reason a condition of validity. Against it, forced open-ended fields produce filler. The author's ground, that the ruler here is the principal and not an agent under review, partly fails: the record exists so that agents act on it later, so the author is accountable to a reader. Recorded as a divergence with that counter attached." Validated by the AI from its own knowledge of the sources; deferred until the author reads them, and delegated if the author declines to.

### Two relations added, 2026-09-04

The reading was minted under `commons.systems/disposition-graph/alignment-page`,
where the record diverges from it by leaving the reason for a choice optional.
Two sittings of 2026-09-04 adopted it on the point it is strongest: on
`commons.systems/disposition-graph/dialogue`, for giving the author's reason
for a ruling a field of its own on the option they chose, separate from the
words they said to the record; and on
`commons.systems/disposition-graph/recording`, for a ruling that carries the
author's own reason rather than one supplied afterwards. The divergence
recorded under the page stands beside them: a field that may be left empty is
not the tradition's duty, and the record's answer to that is on the page's
fact and not here.

### Frontier finding, 2026-09-05

Kind: contradiction.

Forty-six reading nodes carry, verbatim, as the first sentence of the `### authority` subsection inside `## Facts`, the claim: "Delegated, as every reading on the record recommends, because the relation is the AI's from its own knowledge of the source and the author has not read it here." The claim is false at this commit. Measured on the graph: 59 nodes carry `form: reading`; 57 recommend `delegated` on the authority fact; `commons.systems/disposition-graph/srs-introduction` recommends `deferred` (disposition/disposition-graph/srs-introduction.md, `### authority`); and `commons.systems/disposition-graph/npm-committed-lockfile` carries an authority fact with its three options and no `recommends` at all (disposition/disposition-graph/npm-committed-lockfile.md, `### authority`). `commons.systems/disposition-graph/readings` carries a variant of the same claim in its authority fact's `against`, at lines 47 and 155: "every reading on the record recommends delegated for itself". The defect is not only that the count is wrong today. A standing answer that asserts a census of the record goes stale the moment a reading is minted, which is exactly what `commons.systems/disposition-graph/authority` records as the option `no-census-in-a-standing-answer` and what the `codd-update-anomaly` reading names — and `codd-update-anomaly` is itself one of the forty-six carrying it. Two nodes have already corrected their live text and carry the formula only in their `## Account`: `madr-decision-records` (line 184) and `progressive-disclosure` (lines 135 and 162); `madr-decision-records`'s corrected text refers the general question to this survey by name. Those two are named here as context and are not defects.

Also named: commons.systems/disposition-graph/anchoring-and-adjustment, commons.systems/disposition-graph/appellate-review-en-banc, commons.systems/disposition-graph/approval-directed-agents, commons.systems/disposition-graph/bentham-publicity, commons.systems/disposition-graph/brooks-surgical-team, commons.systems/disposition-graph/change-reviewed-as-a-diff, commons.systems/disposition-graph/chestertons-fence, commons.systems/disposition-graph/codd-update-anomaly, commons.systems/disposition-graph/deprecation-not-deletion, commons.systems/disposition-graph/dissent-and-reconsideration, commons.systems/disposition-graph/dry-single-source-of-truth, commons.systems/disposition-graph/event-sourcing-derived-view, commons.systems/disposition-graph/fagan-inspection-roles, commons.systems/disposition-graph/file-drawer-and-pre-registration, commons.systems/disposition-graph/hansard-verbatim-record, commons.systems/disposition-graph/ibis-issue-based-information, commons.systems/disposition-graph/information-hiding, commons.systems/disposition-graph/legislative-amendment-in-context, commons.systems/disposition-graph/level-triggered-reconciliation, commons.systems/disposition-graph/literate-programming, commons.systems/disposition-graph/montgomery-informed-consent, commons.systems/disposition-graph/multi-call-binary-and-facade, commons.systems/disposition-graph/nielsen-user-control-and-freedom, commons.systems/disposition-graph/none-of-the-above-ballot, commons.systems/disposition-graph/non-liquet, commons.systems/disposition-graph/notarial-minute, commons.systems/disposition-graph/not-proven-third-verdict, commons.systems/disposition-graph/n-version-programming, commons.systems/disposition-graph/ocap-attenuation, commons.systems/disposition-graph/operation-naming-in-telemetry, commons.systems/disposition-graph/pareto-frontier, commons.systems/disposition-graph/peirce-paper-doubt, commons.systems/disposition-graph/promotor-fidei, commons.systems/disposition-graph/review-approval-pinned-to-a-revision, commons.systems/disposition-graph/rfc-pep-status-field, commons.systems/disposition-graph/roberts-rules-commit-or-refer, commons.systems/disposition-graph/scholarly-peer-review, commons.systems/disposition-graph/scholastic-articulus, commons.systems/disposition-graph/segregation-of-duties, commons.systems/disposition-graph/self-contained-specification, commons.systems/disposition-graph/single-subject-rule, commons.systems/disposition-graph/special-verdict-form, commons.systems/disposition-graph/the-wrong-abstraction, commons.systems/disposition-graph/utility-syntax-flag-or-subcommand, commons.systems/disposition-graph/value-of-information, commons.systems/disposition-graph/readings, commons.systems/disposition-graph/srs-introduction, commons.systems/disposition-graph/npm-committed-lockfile, commons.systems/disposition-graph/madr-decision-records, commons.systems/disposition-graph/progressive-disclosure, commons.systems/disposition-graph/authority.

Proposed: Strike the census from all forty-six and from `readings`' `against`, replacing it with the rule rather than the count: the class recommended is delegated because the relation is the AI's from its own knowledge of the source and the author has not read it here — which is the reason, and which stands whatever other readings recommend. `madr-decision-records` and `progressive-disclosure` have already made this correction in their live text and are the model. Where a node wants to say that this is the record's settled practice for readings, it cites `commons.systems/disposition-graph/class-recommendation` rather than counting. `srs-introduction`'s `deferred` and `npm-committed-lockfile`'s absent recommendation are left as they are: they are the two counterexamples, and the point of the fix is that a rule stated as a rule does not need them to disappear.

Recorded as an option on commons.systems/disposition-graph/authority's answer fact: `no-census-anywhere-in-a-node` (source review, 2026-09-05).
