---
question: What does Codd's relational model say about one fact stored in two places, and what does the record take from it?
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
  - commons.systems/disposition-graph/prose-and-structure
source: Codd, "A Relational Model of Data for Large Shared Data Banks", Communications of the ACM 13(6) (1970); and "Further Normalization of the Data Base Relational Model" (IBM Research Report RJ909, 1971, printed in Rustin, ed., Data Base Systems, 1972), the normal forms and the insertion, deletion and update anomalies that normalization removes.
bears:
  - node: commons.systems/disposition-graph/prose-and-structure
    fact: answer
    option: prose-argues-structure-records
    relation: adopted
  - node: commons.systems/disposition-graph/alignment-page
    fact: answer
    option: every-fact-every-option
    relation: adopted
  - node: commons.systems/disposition-graph/review-skills
    fact: answer
    option: two-skills-one-package
    relation: adopted
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

Supports, and supplies the name for a failure this record has already suffered. Codd's argument is that a fact recorded in more than one place will eventually be recorded differently in each. Normalization is the discipline that removes the second home: each fact is stored once, in the relation whose key determines it, and everything else that wants it derives it. The anomalies are the symptom rather than the rule, and the update anomaly is the sharpest of them, a change applied in one copy and not in the other, after which the store contradicts itself and no reader can tell which copy is right.

The record adopts the rule and not the tables. What has a shape is recorded in the field that has it and projected from there: a candidate the AI considered is an option on the fact it answers, a tradition is a reading node with its `bears` entries, a claim of class or boldness or persistence is the fact that holds it. Prose carries argument, which has no other home, and never a list a field also carries. That is one home per fact with the projections deriving the rest, which is Codd's rule stated for a record made of documents.

The record has the symptom on file, which is why this reading is worth its place. The enumeration of nodes carrying prose tradition lists was maintained by hand on `stub-traditions` beside the nodes themselves, and when it was checked it was short by three, omitting dialogue, recording and scope, and long by one, naming instruments, which carries no such list. Nothing had gone wrong except that one fact had two homes and only one of them was updated.

The tradition's own conditions are not fully met here and the reading should say so. Codd's argument runs on a schema, where the key that determines a fact is stated and a normal form can be checked mechanically; a record of prose and frontmatter has no such check, so the rule is enforced by a written disposition and by review, not by the shape of the store. That is the weaker form of the same guarantee, and the projector's heading match on "Rejected", which read the prose the rule liquidates, is what the weaker form costs.

## Rationale

Recorded in the tradition pass on the alignment page, 2026-09-04, which found the rule that structure must not be re-encoded in prose to be a rediscovery of the update anomaly and cited the record's own instance of it. It is filed under `prose-and-structure` because that node asks the question the tradition answers, what a node's prose may restate of what the record already carries as data, and its recommended text already names the anomaly in the rationale of its fence, where a tradition can carry no `bears` entry and no pin. This reading is where the tradition now lives, and the fence's sentence naming it is argument rather than a second record of the relation. It bears on `prose-argues-structure-records` because that option is one home per fact with the projections deriving the rest, and on the alignment page's `every-fact-every-option` because the page renders the structure and never reads prose for what the structure holds, which is the same rule seen from the reader's end.

## Facts

### answer

The standing text is the only reading of these two loci this pass produced,
and no second account of what the record takes from them is on the table.

### authority

Delegated, as every reading on the record recommends, because the relation
is the AI's from its own knowledge of the sources and the author has not read
them here. The `deferred` option beside it is what the account asks for, the
reading held until the author reads the sources, and it is the author's to
take.

## Account

Minted at reconciliation on 2026-09-04 under the author's bootstrap grant of that day, from the tradition pass of the alignment-page sitting, which recorded it as one of four rediscoveries: "The rule that structure must not be re-encoded in prose is Codd's update anomaly, and the record has already suffered one: the hand-maintained enumeration on `stub-traditions` was found short by three nodes and long by one." Validated by the AI from its own knowledge of the sources; deferred until the author reads them, and delegated if the author declines to.

### Three relations added, 2026-09-04

The reading was minted under `commons.systems/disposition-graph/prose-and-structure`
and three sittings of 2026-09-04 named it as the ground of their own answers,
each asking for a `bears` entry rather than a second reading of the same
tradition. On `commons.systems/disposition-graph/review-skills`, adopted for
the drift answer's condition: two projections of one source cannot drift, and
the two hand-written skill files of the interim are the anomaly the option
declares as a shim rather than denies. On
`commons.systems/disposition-graph/dialogue`, adopted for the rule that a
term's sentence lives in the gloss on the node that defines it and no
projection carries one of its own; the projector's table of class sentences was
the second copy. On `commons.systems/disposition-graph/recording`, adopted for
the class read off the rulings and never stored beside them.

### Bears on review-skills, 2026-09-05

The entry on `two-skills-one-package` the review-skills node's account said was owed here is recorded: the drift answer's condition, that a derived copy is no anomaly while it is never edited by hand and says so on its face, and that two hand-written copies are one, is this reading's.

### Frontier finding, 2026-09-05

Kind: contradiction.

Forty-six reading nodes carry, verbatim, as the first sentence of the `### authority` subsection inside `## Facts`, the claim: "Delegated, as every reading on the record recommends, because the relation is the AI's from its own knowledge of the source and the author has not read it here." The claim is false at this commit. Measured on the graph: 59 nodes carry `form: reading`; 57 recommend `delegated` on the authority fact; `commons.systems/disposition-graph/srs-introduction` recommends `deferred` (disposition/disposition-graph/srs-introduction.md, `### authority`); and `commons.systems/disposition-graph/npm-committed-lockfile` carries an authority fact with its three options and no `recommends` at all (disposition/disposition-graph/npm-committed-lockfile.md, `### authority`). `commons.systems/disposition-graph/readings` carries a variant of the same claim in its authority fact's `against`, at lines 47 and 155: "every reading on the record recommends delegated for itself". The defect is not only that the count is wrong today. A standing answer that asserts a census of the record goes stale the moment a reading is minted, which is exactly what `commons.systems/disposition-graph/authority` records as the option `no-census-in-a-standing-answer` and what the `codd-update-anomaly` reading names — and `codd-update-anomaly` is itself one of the forty-six carrying it. Two nodes have already corrected their live text and carry the formula only in their `## Account`: `madr-decision-records` (line 184) and `progressive-disclosure` (lines 135 and 162); `madr-decision-records`'s corrected text refers the general question to this survey by name. Those two are named here as context and are not defects.

Also named: commons.systems/disposition-graph/anchoring-and-adjustment, commons.systems/disposition-graph/appellate-review-en-banc, commons.systems/disposition-graph/approval-directed-agents, commons.systems/disposition-graph/bentham-publicity, commons.systems/disposition-graph/brooks-surgical-team, commons.systems/disposition-graph/change-reviewed-as-a-diff, commons.systems/disposition-graph/chenery-reasoned-decision, commons.systems/disposition-graph/chestertons-fence, commons.systems/disposition-graph/deprecation-not-deletion, commons.systems/disposition-graph/dissent-and-reconsideration, commons.systems/disposition-graph/dry-single-source-of-truth, commons.systems/disposition-graph/event-sourcing-derived-view, commons.systems/disposition-graph/fagan-inspection-roles, commons.systems/disposition-graph/file-drawer-and-pre-registration, commons.systems/disposition-graph/hansard-verbatim-record, commons.systems/disposition-graph/ibis-issue-based-information, commons.systems/disposition-graph/information-hiding, commons.systems/disposition-graph/legislative-amendment-in-context, commons.systems/disposition-graph/level-triggered-reconciliation, commons.systems/disposition-graph/literate-programming, commons.systems/disposition-graph/montgomery-informed-consent, commons.systems/disposition-graph/multi-call-binary-and-facade, commons.systems/disposition-graph/nielsen-user-control-and-freedom, commons.systems/disposition-graph/none-of-the-above-ballot, commons.systems/disposition-graph/non-liquet, commons.systems/disposition-graph/notarial-minute, commons.systems/disposition-graph/not-proven-third-verdict, commons.systems/disposition-graph/n-version-programming, commons.systems/disposition-graph/ocap-attenuation, commons.systems/disposition-graph/operation-naming-in-telemetry, commons.systems/disposition-graph/pareto-frontier, commons.systems/disposition-graph/peirce-paper-doubt, commons.systems/disposition-graph/promotor-fidei, commons.systems/disposition-graph/review-approval-pinned-to-a-revision, commons.systems/disposition-graph/rfc-pep-status-field, commons.systems/disposition-graph/roberts-rules-commit-or-refer, commons.systems/disposition-graph/scholarly-peer-review, commons.systems/disposition-graph/scholastic-articulus, commons.systems/disposition-graph/segregation-of-duties, commons.systems/disposition-graph/self-contained-specification, commons.systems/disposition-graph/single-subject-rule, commons.systems/disposition-graph/special-verdict-form, commons.systems/disposition-graph/the-wrong-abstraction, commons.systems/disposition-graph/utility-syntax-flag-or-subcommand, commons.systems/disposition-graph/value-of-information, commons.systems/disposition-graph/readings, commons.systems/disposition-graph/srs-introduction, commons.systems/disposition-graph/npm-committed-lockfile, commons.systems/disposition-graph/madr-decision-records, commons.systems/disposition-graph/progressive-disclosure, commons.systems/disposition-graph/authority.

Proposed: Strike the census from all forty-six and from `readings`' `against`, replacing it with the rule rather than the count: the class recommended is delegated because the relation is the AI's from its own knowledge of the source and the author has not read it here — which is the reason, and which stands whatever other readings recommend. `madr-decision-records` and `progressive-disclosure` have already made this correction in their live text and are the model. Where a node wants to say that this is the record's settled practice for readings, it cites `commons.systems/disposition-graph/class-recommendation` rather than counting. `srs-introduction`'s `deferred` and `npm-committed-lockfile`'s absent recommendation are left as they are: they are the two counterexamples, and the point of the fix is that a rule stated as a rule does not need them to disappear.

Recorded as an option on commons.systems/disposition-graph/authority's answer fact: `no-census-anywhere-in-a-node` (source review, 2026-09-05).

### Frontier finding, 2026-09-05

Kind: redundancy.

Two nodes maintain a hand-written census of the same population, and they disagree. `commons.systems/disposition-graph/stub-traditions`' option `one-ruling-for-the-prose-lists` says "Verified that fourteen rationales carry such lists while this node's enumeration names twelve and misses dialogue, recording and scope". `commons.systems/disposition-graph/readings`' option `incomplete-enumeration-in-facts` (disposition/disposition-graph/readings.md line 103) says "Measured on 2026-09-05 ... nine rationales carry a prose tradition list, five more carry one only in an account, and `stub-traditions` stands at the maieutic stage with a hand-maintained enumeration naming twelve, which its own `regenerate-enumeration` option already calls stale." Both are counting the rationales that carry prose tradition lists; one says fourteen and one says nine-plus-five, and both concede the third enumeration on `stub-traditions` is stale. This is exactly the failure the `codd-update-anomaly` reading names and cites `stub-traditions` for, reproduced by the two nodes that name it. Downstream of the same population, the option `traditions-to-readings` is pending unruled on four nodes at once — `evaluation`, `instruments`, `materialization` and `validation-order` — so the migration these censuses measure is itself asked four times.

Also named: commons.systems/disposition-graph/stub-traditions, commons.systems/disposition-graph/readings, commons.systems/disposition-graph/evaluation, commons.systems/disposition-graph/instruments, commons.systems/disposition-graph/materialization, commons.systems/disposition-graph/validation-order.

Proposed: The survivor is `commons.systems/disposition-graph/readings`, which owns how references to tradition are recorded. Its answer already says "the rationale of a node never repeats its readings", which is the rule the censuses are counting violations of, so the count belongs to an instrument and not to an option's prose: derive the list of rationales carrying prose tradition lists rather than writing it down, and have `stub-traditions`' options cite `readings` instead of recounting. Strike the numbers from both option texts. `traditions-to-readings` is settled once, on `readings`, and cited from the four nodes rather than pending on each.
