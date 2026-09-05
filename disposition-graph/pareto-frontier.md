---
question: What does the Pareto frontier say about which options stay on a fact, and what does the record take from it?
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
  - commons.systems/disposition-graph/viable-options
source: The Pareto frontier of multi-objective choice. Pareto, Manuale di economia politica (1906), where an arrangement is optimal when no one can be made better off without making another worse off; and the use of the same relation in multi-criteria decision analysis, where one alternative dominates another when it is at least as good on every criterion and better on at least one, and the frontier is the set of alternatives nothing dominates.
bears:
  - node: commons.systems/disposition-graph/viable-options
    fact: answer
    option: grant-from-a-ruling
    relation: adopted
  - node: commons.systems/disposition-graph/evaluation
    fact: answer
    option: overrule-by-class
    relation: adopted
  - node: commons.systems/disposition-graph/viable-options
    fact: answer
    option: passed-over-options-stay
    relation: adopted
---
## Answer

Supports the definition of viable, and defines the one judgment the AI is allowed to make about an option's presence. The relation the tradition supplies is dominance: an alternative is dominated when another is at least as good on every criterion and better on one, and dominance is the only comparison an analyst can make without deciding for the decider. Everything not dominated is on the frontier and stays there, because choosing among the frontier means trading one criterion against another, and the trade is the decider's to make.

The record adopts it exactly. Viable means not dominated on the record's criteria in the AI's judgment, which is the evaluation node's solution frontier applied to one decision, so the AI's judgment about an option is a dominance judgment and never a preference. That is what keeps the option list from being the AI's shortlist: an option the AI likes less than another but which is better on some criterion is not dominated, and removing it would be the AI making the author's trade for them.

Two of the tradition's conditions are not met here, and the reading names them because the record's practice turns on them. The first is that dominance is checked against a stated set of criteria; here the criteria are the record's own prose, so the check is a judgment, it can be wrong, and the author may rule for an option the AI marked passed over. The second is that the frontier is computed and can be recomputed; here it is asserted once, when the option is written, so an option dropped as dominated is dropped on a judgment nobody re-examines. That is the pressure behind the finding the tradition pass ranked first, that the fold survives at the option level, and it is why an option that is passed over is better kept on the fact with its reason than removed from the list.

## Rationale

Recorded as one of the eight traditions in `viable-options`' rationale, adopted for what viable means, and moved here under `prose-and-structure`, which holds that a tradition named only in prose carries no `bears` entry and no pin. It bears on the option that stands on `viable-options`' answer fact, whose third paragraph defines viable as not dominated on the record's criteria. The rationale of `evaluation` names the same tradition for the sense of frontier, so a second `bears` entry on that node's answer fact is owed when its options are settled.

## Facts

### answer

The standing text is the only reading of this relation the record has
produced, and no second account of what it takes from it is on the table.

### authority

Delegated, as every reading on the record recommends, because the relation
is the AI's from its own knowledge of the sources and the author has not read
them here. The `deferred` option beside it is what the account asks for, the
reading held until the author reads the sources, and it is the author's to
take.

## Account

Minted at reconciliation on 2026-09-04 under the author's bootstrap grant of that day, from the paragraph of `viable-options`' rationale that names eight traditions in prose, which under `prose-and-structure` becomes readings with `bears` entries: "the Pareto frontier, adopted for what viable means". Validated by the AI from its own knowledge of the sources; deferred until the author reads them, and delegated if the author declines to.

### One relation added, 2026-09-04

The reading bore on `grant-from-a-ruling`, the option that stands on
`commons.systems/disposition-graph/viable-options`, and its answer argues the
recommended option in as many words: everything not dominated is on the
frontier and stays there. The design unit of 2026-09-04 found the gap, and the
entry is added as adopted on `passed-over-options-stay`. The tradition also
supplies the case against passing an option over on a criterion where it is
better, which is why `viable-not-chosen-as-it-stands` carries no status on
that fact.

### Frontier finding, 2026-09-05

Kind: contradiction.

Forty-six reading nodes carry, verbatim, as the first sentence of the `### authority` subsection inside `## Facts`, the claim: "Delegated, as every reading on the record recommends, because the relation is the AI's from its own knowledge of the source and the author has not read it here." The claim is false at this commit. Measured on the graph: 59 nodes carry `form: reading`; 57 recommend `delegated` on the authority fact; `commons.systems/disposition-graph/srs-introduction` recommends `deferred` (disposition/disposition-graph/srs-introduction.md, `### authority`); and `commons.systems/disposition-graph/npm-committed-lockfile` carries an authority fact with its three options and no `recommends` at all (disposition/disposition-graph/npm-committed-lockfile.md, `### authority`). `commons.systems/disposition-graph/readings` carries a variant of the same claim in its authority fact's `against`, at lines 47 and 155: "every reading on the record recommends delegated for itself". The defect is not only that the count is wrong today. A standing answer that asserts a census of the record goes stale the moment a reading is minted, which is exactly what `commons.systems/disposition-graph/authority` records as the option `no-census-in-a-standing-answer` and what the `codd-update-anomaly` reading names — and `codd-update-anomaly` is itself one of the forty-six carrying it. Two nodes have already corrected their live text and carry the formula only in their `## Account`: `madr-decision-records` (line 184) and `progressive-disclosure` (lines 135 and 162); `madr-decision-records`'s corrected text refers the general question to this survey by name. Those two are named here as context and are not defects.

Also named: commons.systems/disposition-graph/anchoring-and-adjustment, commons.systems/disposition-graph/appellate-review-en-banc, commons.systems/disposition-graph/approval-directed-agents, commons.systems/disposition-graph/bentham-publicity, commons.systems/disposition-graph/brooks-surgical-team, commons.systems/disposition-graph/change-reviewed-as-a-diff, commons.systems/disposition-graph/chenery-reasoned-decision, commons.systems/disposition-graph/chestertons-fence, commons.systems/disposition-graph/codd-update-anomaly, commons.systems/disposition-graph/deprecation-not-deletion, commons.systems/disposition-graph/dissent-and-reconsideration, commons.systems/disposition-graph/dry-single-source-of-truth, commons.systems/disposition-graph/event-sourcing-derived-view, commons.systems/disposition-graph/fagan-inspection-roles, commons.systems/disposition-graph/file-drawer-and-pre-registration, commons.systems/disposition-graph/hansard-verbatim-record, commons.systems/disposition-graph/ibis-issue-based-information, commons.systems/disposition-graph/information-hiding, commons.systems/disposition-graph/legislative-amendment-in-context, commons.systems/disposition-graph/level-triggered-reconciliation, commons.systems/disposition-graph/literate-programming, commons.systems/disposition-graph/montgomery-informed-consent, commons.systems/disposition-graph/multi-call-binary-and-facade, commons.systems/disposition-graph/nielsen-user-control-and-freedom, commons.systems/disposition-graph/none-of-the-above-ballot, commons.systems/disposition-graph/non-liquet, commons.systems/disposition-graph/notarial-minute, commons.systems/disposition-graph/not-proven-third-verdict, commons.systems/disposition-graph/n-version-programming, commons.systems/disposition-graph/ocap-attenuation, commons.systems/disposition-graph/operation-naming-in-telemetry, commons.systems/disposition-graph/peirce-paper-doubt, commons.systems/disposition-graph/promotor-fidei, commons.systems/disposition-graph/review-approval-pinned-to-a-revision, commons.systems/disposition-graph/rfc-pep-status-field, commons.systems/disposition-graph/roberts-rules-commit-or-refer, commons.systems/disposition-graph/scholarly-peer-review, commons.systems/disposition-graph/scholastic-articulus, commons.systems/disposition-graph/segregation-of-duties, commons.systems/disposition-graph/self-contained-specification, commons.systems/disposition-graph/single-subject-rule, commons.systems/disposition-graph/special-verdict-form, commons.systems/disposition-graph/the-wrong-abstraction, commons.systems/disposition-graph/utility-syntax-flag-or-subcommand, commons.systems/disposition-graph/value-of-information, commons.systems/disposition-graph/readings, commons.systems/disposition-graph/srs-introduction, commons.systems/disposition-graph/npm-committed-lockfile, commons.systems/disposition-graph/madr-decision-records, commons.systems/disposition-graph/progressive-disclosure, commons.systems/disposition-graph/authority.

Proposed: Strike the census from all forty-six and from `readings`' `against`, replacing it with the rule rather than the count: the class recommended is delegated because the relation is the AI's from its own knowledge of the source and the author has not read it here — which is the reason, and which stands whatever other readings recommend. `madr-decision-records` and `progressive-disclosure` have already made this correction in their live text and are the model. Where a node wants to say that this is the record's settled practice for readings, it cites `commons.systems/disposition-graph/class-recommendation` rather than counting. `srs-introduction`'s `deferred` and `npm-committed-lockfile`'s absent recommendation are left as they are: they are the two counterexamples, and the point of the fix is that a rule stated as a rule does not need them to disappear.

Recorded as an option on commons.systems/disposition-graph/authority's answer fact: `no-census-anywhere-in-a-node` (source review, 2026-09-05).
