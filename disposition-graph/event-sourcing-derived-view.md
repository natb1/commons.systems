---
question: What does event sourcing say about a status that is derived rather than stored, and what does the record take from it?
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
source: Event sourcing and the derived read model. Fowler, "Event Sourcing" (2005) and "CQRS" (2011); the command-query separation literature that grew around Young's work from about 2010; and the same shape treated as a general principle in Kleppmann, Designing Data-Intensive Applications (2017), the chapter on stream processing, where the log of events is the system of record and every view over it is a materialized projection that can be discarded and rebuilt.
bears:
  - node: commons.systems/disposition-graph/viable-options
    fact: answer
    option: grant-from-a-ruling
    relation: adopted
  - node: commons.systems/disposition-graph/prose-and-structure
    fact: answer
    option: prose-argues-structure-records
    relation: adopted
---
## Answer

Supports the derivation, and carries the warning that comes with it. The pattern's claim is that the durable thing is the sequence of recorded facts, and that any current-state view is a fold over that sequence: the view is convenient, it may be cached, and it is never the source of truth. Two properties follow and both matter here. A view can be thrown away and rebuilt from the log, so a bug in the fold is repaired by re-deriving rather than by migrating; and a view that has drifted from the log is wrong by definition, since the log is what happened.

The record adopts it for the class. A node's authority is a fold over the rulings recorded on its facts, and no stamp is written beside them, so ratified, delegated, deferred and unanswered are read rather than stored. The reason the record gives is the reason the pattern gives, that a stored copy of a derived value drifts and there is then no way to tell which of the two is right. The two frontiers are the same shape, folds over the record's own state that nothing stores.

The warning is the pattern's known cost and the record takes it as stated: with the view derived, every reader must derive it the same way. In a system with one code path that is a design rule; here the readers are the projector, the two skills, a session reading a node by hand, and the author, and a second implementation of the fold is a second truth. What the record does about it is keep the derivation in one place and treat any other derivation of the class as an implementation to be liquidated, which is a rule and not a mechanism.

The scope stops short of the rest of the pattern. Event sourcing normally means an append-only log with events never rewritten, and this record is a git history of node files that alignment edits in place; the fold is over the rulings a node currently carries, not over an immutable stream. What is adopted is derive-the-view-never-store-it, and the immutability that usually accompanies it is version control's, at a coarser grain.

## Rationale

Recorded as one of the eight traditions in `viable-options`' rationale, adopted for the class as a projection of recorded rulings, and moved here under `prose-and-structure`, which holds that a tradition named only in prose carries no `bears` entry and no pin. It bears on the option that stands on `viable-options`' answer fact, which is the one that reads the class off the rulings rather than storing it.

## Facts

### answer

The standing text is the only reading of this pattern the record has produced,
and no second account of what it takes from it is on the table.

### authority

Delegated, as every reading on the record recommends, because the relation
is the AI's from its own knowledge of the sources and the author has not read
them here. The `deferred` option beside it is what the account asks for, the
reading held until the author reads the sources, and it is the author's to
take.

## Account

Minted at reconciliation on 2026-09-04 under the author's bootstrap grant of that day, from the paragraph of `viable-options`' rationale that names eight traditions in prose, which under `prose-and-structure` becomes readings with `bears` entries: "event sourcing and the derived view, adopted for the class as a projection of recorded rulings, with the warning that every reader must derive it the same way". Validated by the AI from its own knowledge of the sources; deferred until the author reads them, and delegated if the author declines to.
### A relation added, 2026-09-04

A `bears` entry on `commons.systems/disposition-graph/prose-and-structure`'s
`prose-argues-structure-records`, adopted, added by the readings unit of the
alignment sitting of 2026-09-04 under the author's bootstrap grant of that
day. That node's account asks for "denormalization and the derived read
model, the tradition that says when a second copy is legitimate, which is
exactly when it is generated and never hand-maintained, and which is what
makes the rules directory, the browser and the alignment page projections
rather than breaches of this rule", and names the overlap with this reading
itself. The overlap is what makes it an entry: the derived view that is a fold
over the record and never the source of truth is already read here, and the
generated-copy half of the same argument is on
`commons.systems/disposition-graph/dry-single-source-of-truth`.

### Frontier finding, 2026-09-05

Kind: contradiction.

Forty-six reading nodes carry, verbatim, as the first sentence of the `### authority` subsection inside `## Facts`, the claim: "Delegated, as every reading on the record recommends, because the relation is the AI's from its own knowledge of the source and the author has not read it here." The claim is false at this commit. Measured on the graph: 59 nodes carry `form: reading`; 57 recommend `delegated` on the authority fact; `commons.systems/disposition-graph/srs-introduction` recommends `deferred` (disposition/disposition-graph/srs-introduction.md, `### authority`); and `commons.systems/disposition-graph/npm-committed-lockfile` carries an authority fact with its three options and no `recommends` at all (disposition/disposition-graph/npm-committed-lockfile.md, `### authority`). `commons.systems/disposition-graph/readings` carries a variant of the same claim in its authority fact's `against`, at lines 47 and 155: "every reading on the record recommends delegated for itself". The defect is not only that the count is wrong today. A standing answer that asserts a census of the record goes stale the moment a reading is minted, which is exactly what `commons.systems/disposition-graph/authority` records as the option `no-census-in-a-standing-answer` and what the `codd-update-anomaly` reading names — and `codd-update-anomaly` is itself one of the forty-six carrying it. Two nodes have already corrected their live text and carry the formula only in their `## Account`: `madr-decision-records` (line 184) and `progressive-disclosure` (lines 135 and 162); `madr-decision-records`'s corrected text refers the general question to this survey by name. Those two are named here as context and are not defects.

Also named: commons.systems/disposition-graph/anchoring-and-adjustment, commons.systems/disposition-graph/appellate-review-en-banc, commons.systems/disposition-graph/approval-directed-agents, commons.systems/disposition-graph/bentham-publicity, commons.systems/disposition-graph/brooks-surgical-team, commons.systems/disposition-graph/change-reviewed-as-a-diff, commons.systems/disposition-graph/chenery-reasoned-decision, commons.systems/disposition-graph/chestertons-fence, commons.systems/disposition-graph/codd-update-anomaly, commons.systems/disposition-graph/deprecation-not-deletion, commons.systems/disposition-graph/dissent-and-reconsideration, commons.systems/disposition-graph/dry-single-source-of-truth, commons.systems/disposition-graph/fagan-inspection-roles, commons.systems/disposition-graph/file-drawer-and-pre-registration, commons.systems/disposition-graph/hansard-verbatim-record, commons.systems/disposition-graph/ibis-issue-based-information, commons.systems/disposition-graph/information-hiding, commons.systems/disposition-graph/legislative-amendment-in-context, commons.systems/disposition-graph/level-triggered-reconciliation, commons.systems/disposition-graph/literate-programming, commons.systems/disposition-graph/montgomery-informed-consent, commons.systems/disposition-graph/multi-call-binary-and-facade, commons.systems/disposition-graph/nielsen-user-control-and-freedom, commons.systems/disposition-graph/none-of-the-above-ballot, commons.systems/disposition-graph/non-liquet, commons.systems/disposition-graph/notarial-minute, commons.systems/disposition-graph/not-proven-third-verdict, commons.systems/disposition-graph/n-version-programming, commons.systems/disposition-graph/ocap-attenuation, commons.systems/disposition-graph/operation-naming-in-telemetry, commons.systems/disposition-graph/pareto-frontier, commons.systems/disposition-graph/peirce-paper-doubt, commons.systems/disposition-graph/promotor-fidei, commons.systems/disposition-graph/review-approval-pinned-to-a-revision, commons.systems/disposition-graph/rfc-pep-status-field, commons.systems/disposition-graph/roberts-rules-commit-or-refer, commons.systems/disposition-graph/scholarly-peer-review, commons.systems/disposition-graph/scholastic-articulus, commons.systems/disposition-graph/segregation-of-duties, commons.systems/disposition-graph/self-contained-specification, commons.systems/disposition-graph/single-subject-rule, commons.systems/disposition-graph/special-verdict-form, commons.systems/disposition-graph/the-wrong-abstraction, commons.systems/disposition-graph/utility-syntax-flag-or-subcommand, commons.systems/disposition-graph/value-of-information, commons.systems/disposition-graph/readings, commons.systems/disposition-graph/srs-introduction, commons.systems/disposition-graph/npm-committed-lockfile, commons.systems/disposition-graph/madr-decision-records, commons.systems/disposition-graph/progressive-disclosure, commons.systems/disposition-graph/authority.

Proposed: Strike the census from all forty-six and from `readings`' `against`, replacing it with the rule rather than the count: the class recommended is delegated because the relation is the AI's from its own knowledge of the source and the author has not read it here — which is the reason, and which stands whatever other readings recommend. `madr-decision-records` and `progressive-disclosure` have already made this correction in their live text and are the model. Where a node wants to say that this is the record's settled practice for readings, it cites `commons.systems/disposition-graph/class-recommendation` rather than counting. `srs-introduction`'s `deferred` and `npm-committed-lockfile`'s absent recommendation are left as they are: they are the two counterexamples, and the point of the fix is that a rule stated as a rule does not need them to disappear.

Recorded as an option on commons.systems/disposition-graph/authority's answer fact: `no-census-anywhere-in-a-node` (source review, 2026-09-05).
