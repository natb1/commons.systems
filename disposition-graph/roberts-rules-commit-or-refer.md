---
question: What does the subsidiary motion to commit or refer say about where a kick-back sits, and what does the record take from it?
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
source: Robert's Rules of Order Newly Revised (12th edition, 2020), the subsidiary motion Commit or Refer and the ranking of subsidiary motions, under which a motion to send the question to a committee for further work is put and decided before the main question and takes the main question out of the assembly's hands while it is pending. Locus to be checked, the section numbers, which differ between editions.
bears:
  - fact: answer
    option: every-fact-every-option
    relation: diverged
---
## Answer

Diverges on placement and wins the marking. In the parliamentary tradition, sending a question back for more work is not one of the answers to it. Commit or Refer is a motion of its own, of its own rank among the subsidiary motions, put and decided before the main question, and while it is pending the main question is not before the assembly at all. The reason is that the two acts are of different kinds: the assembly is either choosing among answers or deciding that the answers are not ready, and putting the second among the first invites a member to treat "send it back" as a mild version of "no".

The record puts the kick-back last in the same group as the options, and does so at the placement the author chose, for which the sitting supplies the affordance reason, that the affordance is where the ruling is made and a control elsewhere is a control not used. That is a departure and the reading records it as one. What the tradition changes about the row is its presentation: it is set apart from the options, and captioned with what it does to the node rather than with a summary of an option it is not, so a reader can see that choosing it is an act of a different kind. The same point arrives from the usability side in the heuristic that an exit must be marked as an exit.

The tradition's own condition is not met here, and that is worth stating beside the divergence. In an assembly the motion has rank because there is an order of precedence and many members who may move it. Here there is one ruler, one node, and no order of precedence to place the motion in, so rank has nothing to attach to and what remains of the tradition's argument is the confusion it was guarding against. The record answers that with separation and a caption rather than with rank.

## Rationale

Recorded in the tradition pass on the alignment page, 2026-09-04, in the finding on where the kick-back sits. It bears on `every-fact-every-option` as a divergence because that option keeps the kick-back as the last row on every fact rather than as a decision taken before the fact is ruled; what the pass took from the tradition, that the row is set apart and captioned with what it does to the node, is in the same option's text.

## Facts

### answer

The standing text is the only reading of this motion the pass produced, and no
second account of what the record takes from it is on the table.

### authority

Delegated, as every reading on the record recommends, because the relation
is the AI's from its own knowledge of the source and the author has not read
it here. The `deferred` option beside it is what the account asks for, the
reading held until the author reads the source, and it is the author's to
take.

## Account

Minted at reconciliation on 2026-09-04 under the author's bootstrap grant of that day, from the tradition pass of the alignment-page sitting: "Robert's Rules makes Commit or Refer a subsidiary motion of its own rank, decided before the main question; Nielsen's third heuristic asks that an exit be marked as an exit ... The author's affordance reason holds and the row stays in the group; what the two traditions win is its marking, separated and captioned with what it does to the node rather than with a summary of an option it is not." Validated by the AI from its own knowledge of the source; deferred until the author reads it, and delegated if the author declines to.

### Frontier finding, 2026-09-05

Kind: contradiction.

Forty-six reading nodes carry, verbatim, as the first sentence of the `### authority` subsection inside `## Facts`, the claim: "Delegated, as every reading on the record recommends, because the relation is the AI's from its own knowledge of the source and the author has not read it here." The claim is false at this commit. Measured on the graph: 59 nodes carry `form: reading`; 57 recommend `delegated` on the authority fact; `commons.systems/disposition-graph/srs-introduction` recommends `deferred` (disposition/disposition-graph/srs-introduction.md, `### authority`); and `commons.systems/disposition-graph/npm-committed-lockfile` carries an authority fact with its three options and no `recommends` at all (disposition/disposition-graph/npm-committed-lockfile.md, `### authority`). `commons.systems/disposition-graph/readings` carries a variant of the same claim in its authority fact's `against`, at lines 47 and 155: "every reading on the record recommends delegated for itself". The defect is not only that the count is wrong today. A standing answer that asserts a census of the record goes stale the moment a reading is minted, which is exactly what `commons.systems/disposition-graph/authority` records as the option `no-census-in-a-standing-answer` and what the `codd-update-anomaly` reading names — and `codd-update-anomaly` is itself one of the forty-six carrying it. Two nodes have already corrected their live text and carry the formula only in their `## Account`: `madr-decision-records` (line 184) and `progressive-disclosure` (lines 135 and 162); `madr-decision-records`'s corrected text refers the general question to this survey by name. Those two are named here as context and are not defects.

Also named: commons.systems/disposition-graph/anchoring-and-adjustment, commons.systems/disposition-graph/appellate-review-en-banc, commons.systems/disposition-graph/approval-directed-agents, commons.systems/disposition-graph/bentham-publicity, commons.systems/disposition-graph/brooks-surgical-team, commons.systems/disposition-graph/change-reviewed-as-a-diff, commons.systems/disposition-graph/chenery-reasoned-decision, commons.systems/disposition-graph/chestertons-fence, commons.systems/disposition-graph/codd-update-anomaly, commons.systems/disposition-graph/deprecation-not-deletion, commons.systems/disposition-graph/dissent-and-reconsideration, commons.systems/disposition-graph/dry-single-source-of-truth, commons.systems/disposition-graph/event-sourcing-derived-view, commons.systems/disposition-graph/fagan-inspection-roles, commons.systems/disposition-graph/file-drawer-and-pre-registration, commons.systems/disposition-graph/hansard-verbatim-record, commons.systems/disposition-graph/ibis-issue-based-information, commons.systems/disposition-graph/information-hiding, commons.systems/disposition-graph/legislative-amendment-in-context, commons.systems/disposition-graph/level-triggered-reconciliation, commons.systems/disposition-graph/literate-programming, commons.systems/disposition-graph/montgomery-informed-consent, commons.systems/disposition-graph/multi-call-binary-and-facade, commons.systems/disposition-graph/nielsen-user-control-and-freedom, commons.systems/disposition-graph/none-of-the-above-ballot, commons.systems/disposition-graph/non-liquet, commons.systems/disposition-graph/notarial-minute, commons.systems/disposition-graph/not-proven-third-verdict, commons.systems/disposition-graph/n-version-programming, commons.systems/disposition-graph/ocap-attenuation, commons.systems/disposition-graph/operation-naming-in-telemetry, commons.systems/disposition-graph/pareto-frontier, commons.systems/disposition-graph/peirce-paper-doubt, commons.systems/disposition-graph/promotor-fidei, commons.systems/disposition-graph/review-approval-pinned-to-a-revision, commons.systems/disposition-graph/rfc-pep-status-field, commons.systems/disposition-graph/scholarly-peer-review, commons.systems/disposition-graph/scholastic-articulus, commons.systems/disposition-graph/segregation-of-duties, commons.systems/disposition-graph/self-contained-specification, commons.systems/disposition-graph/single-subject-rule, commons.systems/disposition-graph/special-verdict-form, commons.systems/disposition-graph/the-wrong-abstraction, commons.systems/disposition-graph/utility-syntax-flag-or-subcommand, commons.systems/disposition-graph/value-of-information, commons.systems/disposition-graph/readings, commons.systems/disposition-graph/srs-introduction, commons.systems/disposition-graph/npm-committed-lockfile, commons.systems/disposition-graph/madr-decision-records, commons.systems/disposition-graph/progressive-disclosure, commons.systems/disposition-graph/authority.

Proposed: Strike the census from all forty-six and from `readings`' `against`, replacing it with the rule rather than the count: the class recommended is delegated because the relation is the AI's from its own knowledge of the source and the author has not read it here — which is the reason, and which stands whatever other readings recommend. `madr-decision-records` and `progressive-disclosure` have already made this correction in their live text and are the model. Where a node wants to say that this is the record's settled practice for readings, it cites `commons.systems/disposition-graph/class-recommendation` rather than counting. `srs-introduction`'s `deferred` and `npm-committed-lockfile`'s absent recommendation are left as they are: they are the two counterexamples, and the point of the fix is that a rule stated as a rule does not need them to disappear.

Recorded as an option on commons.systems/disposition-graph/authority's answer fact: `no-census-anywhere-in-a-node` (source review, 2026-09-05).
