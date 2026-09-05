---
question: What does the Roman judge's non liquet say about the difference between two refusals, and what does the record take from it?
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
source: The third disposition open to a Roman judge, non liquet, it is not clear. In the standing criminal courts the juror's tablet was marked A for absolvo, C for condemno, or NL for non liquet, which decided nothing and left the case to be heard again; under the formulary procedure a iudex who was not persuaded could swear sibi non liquere and be relieved of judging. Aulus Gellius, Noctes Atticae XIV.2, describes his own service as iudex and the advice he was given. Locus to be checked, the Gellius passage and a modern treatment of the tablets.
bears:
  - fact: answer
    option: every-fact-every-option
    relation: adopted
  - node: commons.systems/disposition-graph/recording
    fact: answer
    option: per-fact-after-two-readings
    relation: adopted
---
## Answer

Supports the record's distinction between two refusals, and marks where the page had run them together. Non liquet is a statement about the decider rather than about the case: not that the accused is innocent, and not that the charge is bad, but that the ground for deciding is not there. The tradition treats it as a third disposition with its own name and its own consequence, which is that the matter is heard again rather than resolved. The author's kick-back is a different act. It says that none of the options offered is acceptable, which is a statement about the options and calls for options to be drafted again.

The record already distinguishes them, and what the tradition wins is that the distinction is said out loud. The kick-back row is typed to the maieutic movement, where options are drafted, which is the destination the author named for it. Feedback whose words show that the ground itself is at issue, that the author cannot yet say what would count as an answer, is classified further back, to the periagogic movement where the author's own account is taken, and `recording` already classifies a denial to the movement its words call for. So no second control is owed, and the disposition says which movement the row is typed to rather than leaving the reader to infer it.

The divergence is that the tradition gave the refusal its own vote and the record gives it one control with a classifier behind it. In the Roman court the juror's third tablet was cast and counted as itself; here both refusals arrive through the same row and are separated by reading the author's words afterwards. That is weaker in one respect, since a classification can be wrong where a tablet cannot, and stronger in another, since the author writes the reason in their own words instead of choosing a category the record made up for them.

## Rationale

Recorded in the tradition pass on the alignment page, 2026-09-04, under the finding that two refusals were being carried by one row. It bears on `every-fact-every-option` because that option is where the kick-back's typing is stated, the last row on every fact, set apart, captioned with what it does to the node and typed to the maieutic movement, which is the clause this reading informed.

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

Minted at reconciliation on 2026-09-04 under the author's bootstrap grant of that day, from the tradition pass of the alignment-page sitting: "*Non liquet*, the third disposition of the Roman judge, is a statement about the decider's own ground: it is not clear to me. The author's kick-back is a statement about the options: none of these is acceptable. The first calls for the periagogic movement, where the author's account is taken; the second for the maieutic, where options are drafted, which is the destination the author named." Validated by the AI from its own knowledge of the sources; deferred until the author reads them, and delegated if the author declines to.

### One relation added, 2026-09-04

Adopted on `commons.systems/disposition-graph/recording`'s recommended option,
whose typing of the kick-back this reading's account is the ground of: a
refusal about the options calls for the maieutic movement and a refusal about
the decider's own ground calls for the periagogic, which is why the row is
typed to the first and free prose is still classified for the second.

### Frontier finding, 2026-09-05

Kind: contradiction.

Forty-six reading nodes carry, verbatim, as the first sentence of the `### authority` subsection inside `## Facts`, the claim: "Delegated, as every reading on the record recommends, because the relation is the AI's from its own knowledge of the source and the author has not read it here." The claim is false at this commit. Measured on the graph: 59 nodes carry `form: reading`; 57 recommend `delegated` on the authority fact; `commons.systems/disposition-graph/srs-introduction` recommends `deferred` (disposition/disposition-graph/srs-introduction.md, `### authority`); and `commons.systems/disposition-graph/npm-committed-lockfile` carries an authority fact with its three options and no `recommends` at all (disposition/disposition-graph/npm-committed-lockfile.md, `### authority`). `commons.systems/disposition-graph/readings` carries a variant of the same claim in its authority fact's `against`, at lines 47 and 155: "every reading on the record recommends delegated for itself". The defect is not only that the count is wrong today. A standing answer that asserts a census of the record goes stale the moment a reading is minted, which is exactly what `commons.systems/disposition-graph/authority` records as the option `no-census-in-a-standing-answer` and what the `codd-update-anomaly` reading names — and `codd-update-anomaly` is itself one of the forty-six carrying it. Two nodes have already corrected their live text and carry the formula only in their `## Account`: `madr-decision-records` (line 184) and `progressive-disclosure` (lines 135 and 162); `madr-decision-records`'s corrected text refers the general question to this survey by name. Those two are named here as context and are not defects.

Also named: commons.systems/disposition-graph/anchoring-and-adjustment, commons.systems/disposition-graph/appellate-review-en-banc, commons.systems/disposition-graph/approval-directed-agents, commons.systems/disposition-graph/bentham-publicity, commons.systems/disposition-graph/brooks-surgical-team, commons.systems/disposition-graph/change-reviewed-as-a-diff, commons.systems/disposition-graph/chenery-reasoned-decision, commons.systems/disposition-graph/chestertons-fence, commons.systems/disposition-graph/codd-update-anomaly, commons.systems/disposition-graph/deprecation-not-deletion, commons.systems/disposition-graph/dissent-and-reconsideration, commons.systems/disposition-graph/dry-single-source-of-truth, commons.systems/disposition-graph/event-sourcing-derived-view, commons.systems/disposition-graph/fagan-inspection-roles, commons.systems/disposition-graph/file-drawer-and-pre-registration, commons.systems/disposition-graph/hansard-verbatim-record, commons.systems/disposition-graph/ibis-issue-based-information, commons.systems/disposition-graph/information-hiding, commons.systems/disposition-graph/legislative-amendment-in-context, commons.systems/disposition-graph/level-triggered-reconciliation, commons.systems/disposition-graph/literate-programming, commons.systems/disposition-graph/montgomery-informed-consent, commons.systems/disposition-graph/multi-call-binary-and-facade, commons.systems/disposition-graph/nielsen-user-control-and-freedom, commons.systems/disposition-graph/none-of-the-above-ballot, commons.systems/disposition-graph/notarial-minute, commons.systems/disposition-graph/not-proven-third-verdict, commons.systems/disposition-graph/n-version-programming, commons.systems/disposition-graph/ocap-attenuation, commons.systems/disposition-graph/operation-naming-in-telemetry, commons.systems/disposition-graph/pareto-frontier, commons.systems/disposition-graph/peirce-paper-doubt, commons.systems/disposition-graph/promotor-fidei, commons.systems/disposition-graph/review-approval-pinned-to-a-revision, commons.systems/disposition-graph/rfc-pep-status-field, commons.systems/disposition-graph/roberts-rules-commit-or-refer, commons.systems/disposition-graph/scholarly-peer-review, commons.systems/disposition-graph/scholastic-articulus, commons.systems/disposition-graph/segregation-of-duties, commons.systems/disposition-graph/self-contained-specification, commons.systems/disposition-graph/single-subject-rule, commons.systems/disposition-graph/special-verdict-form, commons.systems/disposition-graph/the-wrong-abstraction, commons.systems/disposition-graph/utility-syntax-flag-or-subcommand, commons.systems/disposition-graph/value-of-information, commons.systems/disposition-graph/readings, commons.systems/disposition-graph/srs-introduction, commons.systems/disposition-graph/npm-committed-lockfile, commons.systems/disposition-graph/madr-decision-records, commons.systems/disposition-graph/progressive-disclosure, commons.systems/disposition-graph/authority.

Proposed: Strike the census from all forty-six and from `readings`' `against`, replacing it with the rule rather than the count: the class recommended is delegated because the relation is the AI's from its own knowledge of the source and the author has not read it here — which is the reason, and which stands whatever other readings recommend. `madr-decision-records` and `progressive-disclosure` have already made this correction in their live text and are the model. Where a node wants to say that this is the record's settled practice for readings, it cites `commons.systems/disposition-graph/class-recommendation` rather than counting. `srs-introduction`'s `deferred` and `npm-committed-lockfile`'s absent recommendation are left as they are: they are the two counterexamples, and the point of the fix is that a rule stated as a rule does not need them to disappear.

Recorded as an option on commons.systems/disposition-graph/authority's answer fact: `no-census-anywhere-in-a-node` (source review, 2026-09-05).
