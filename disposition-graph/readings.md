---
question: How are references to tradition recorded?
stage: ruling
review:
  verdict: forward
  strength: moderate
  date: 2026-09-05
  of: 89b9d1cce0f1a08aade9e2b6f49ac4306b07b8bb
  commit: 857ad7fde8e7fa3cac1ef348c12644eddd1d3257
  against: "The per-option relation leaves the record's \"what tradition says\" both sparse and unreliable, and this answer's remedies for that are sentences held by nothing. Measured at this commit, 33 of the record's 542 answer-fact options carry any reading at all, and the readings cluster on a handful of hot options (seventeen on alignment-page#every-fact-every-option), so an empty tradition cell beside the option the author is ruling on is indistinguishable from an option nobody read — the derived reading is sparsest exactly where the ruling is taken. Worse, 38 of the 108 `bears` entries name an option their fact no longer recommends, eight of them still adopted on viable-options#grant-from-a-ruling after that fact moved to `passed-over-options-stay`, and under this answer's own definition each reads as a tradition chosen over, a judgment nobody made; the node-level relation this answer displaces had neither failure, because it bound the reading to the answer, which is the unit the author confirms. The answer's two replies — that a move re-points the readings and that the review finds a recommended option nobody read — are held by no instrument: the validator checks only that a `bears` entry resolves, frontier-consistency's validation 4 carries no such check, and the review brief does not ask for one. What keeps this a moderate objection rather than a fatal one is that the per-option relation is the author's own words of 2026-09-04, so what is really in question is not the design but whether its two guards are made before it is ratified."
facts:
  - name: answer
    options:
      - name: relation-on-the-node
        source: ai
        ref: "2026-09-02"
      - name: traditions-as-mounts
        source: ai
        ref: "2026-09-03"
      - name: incomplete-enumeration-in-facts
        source: review
        ref: "2026-09-03"
      - name: one-ruling-for-the-reading-class
        source: review
        ref: "2026-09-03"
        status: passed
        reason: "the four entries it would strike went in the re-encoding of 2026-09-04, and the class rule the answer states covers every reading"
      - name: hold-for-traditions-home
        source: review
        ref: "2026-09-03"
      - name: relation-per-option
        source: author
        ref: "2026-09-04"
      - name: re-pointing-checked
        source: review
        ref: "2026-09-05"
      - name: relation-per-holding
        source: commons.systems/disposition-graph/progressive-disclosure
        ref: "2026-09-05"
    recommends: relation-per-option
    boldness: moderate
    against: "The per-option relation binds a tradition's verdict to option names, which are the AI's handles and move under it as options are added, renamed, and composed, so the option the author confirms can show no tradition beside it while a rival shows one; and a reading per node multiplies files, whose queue effect is the cost the author will feel."
    stands: relation-per-option
  - name: authority
    options:
      - name: ratified
      - name: delegated
      - name: deferred
    recommends: ratified
    boldness: moderate
    against: "Delegated is live: the relations are the AI's readings, every reading on the record recommends delegated for itself, and the author may hold the rule of how tradition binds the record as loosely."
form: rule
under:
  - commons.systems/disposition-graph/model
defines:
  - reading
  - tradition
  - adopted
  - diverged
  - chosen over
depends:
  - commons.systems/disposition-graph/viable-options
  - commons.systems/disposition-graph/traditions-home
---
## Disposition

The author, 2026-09-02:
> Re-evaluate the naming and function of the form "READING (RDG)" - we have been using the term "tradition" up until now, is this different? My concept of the tradition node is that it is a mount of another project - a philosophical tradition, or a body of research, or another code repo. It is a mount because it could theoretically be represented by its own graph with its own arche and its own reference to traditions. In lieu of a fully articulated disposition graph, a tradition may list primary references/readings. A disposition in the greenfield graph may reference tradition as either supporting by or diverging from disposition. That reference (supporting or diverging) may be ratified (if I have read the primary sources or understand the hypothetic mounted graph and can confirm support or divergence), delegated (if I accept AI judgement on the reference), or deferred (if I accept AI judgement pending review). Given the model of tradition as graph mount, recommend, how should multiple questions that reference the same tradition be encoded?

The author, 2026-09-02:
> references to tradition in the prose of the documentation projection (such as the answer) should hyperlink to the tradition node. I like how target dispositions are hyperlinked, keep that.

The author, 2026-09-02:
> do not replicate tradition references in the rationale section. There is already a tradition section. Confirm the tradition section is projected from the references, not duplicated in the node body.

The author, 2026-09-04, on the viable-options node, the sentence that raised `relation-per-option`; the words in full are on commons.systems/disposition-graph/viable-options:
> Each fact on a node, regardless of authority, has viable options list (possibly length 1) with a) AI recommendation/why b) support or divergence from tradition for each option and c) (if answered) the confirmed choice and why.

## Answer

As readings under the node that refers, and traditions they refer to. A tradition is a mount: a philosophical tradition, a body of research, or another repository, which could be a disposition graph of its own with its own archē and its own readings, and where it lives until it is articulated, carrying the name it defines and its primary references, is the traditions-home node's question; until that is ruled a reading names its tradition in its source alone, and the tradition node is owed, and with it the tradition's page and the defined name by which prose reaches it, both of which two clauses below presume. A reading sits under one node it bears on and may bear on the options of any node, naming the node wherever it is not the parent; it names the tradition it reads, its sources and loci, and what it bears on: for each option of a fact that the tradition speaks to, adopted, where the tradition supports the option, or diverged, where the option departs from it and the reading's own answer says why. A move of a recommendation re-points the readings that bear on the option it leaves, and that a recommended option stands unread beside a rival that does not is a finding the review should make, which the frontier-consistency node's validation 4 does not yet ask for and which is recorded there as an option; until it is ruled the check is owed and no instrument performs it, and the duty to re-point is stated here and unchecked, unmet across the record at this commit as the account measures. A tradition adopted on an option not chosen is what chosen over names, and it is derived and never stored; the option's readings are the derived inverse of what the readings bear on. A reading has a class like any node, read from the rulings on its own facts: ratified when the author has read the primary source or understands the mounted graph and confirms the relations, delegated when the AI's reading stands and the author declines to review it, deferred when the author accepts it for now and queues the primary reading. Deferred reading is recursive: one source leads to another, and a reading may sit under a reading. A reading whose verdict changes on re-reading is a re-grasp trigger for the node it grounds, not an automatic failure of it. Many questions that read one tradition are many readings naming that tradition, and the tradition's page shows every reading that cites it, as each option shows every reading that bears on it. Prose reaches a tradition through the name it defines, and the rationale of a node never repeats its readings.

## Rationale

The author's disposition of 2026-09-02 that tradition references carry authority classes. Making them nodes rather than field entries buys four things: one reading of a shared source is stored once and refined under each node it grounds; readings nest, which is what recursion needs; a reading has its own hash and pin, so a changed reading is distinguishable from a changed answer; and there is one write path, one queue, and one stamp vocabulary. The alternative, stamped entries in a field with a derived reading frontier, is workable and was the author's framing; the difference is parsimony of mechanism against parsimony of files.

Amended 2026-09-04 under the author's bootstrap grant of that day, recorded on the viable-options node, from the author's words there: "Each fact on a node ... has viable options list ... with ... b) support or divergence from tradition for each option". The reading stays a node with its own class, as the author's disposition of 2026-09-02 asks, and its relation moves from the node to the options it bears on, so that a tradition can support one option and contradict another on the same fact, and so that chosen over is derived rather than stored. The answer as it stood is kept as the option `relation-on-the-node`, and `traditions-as-mounts` is that answer with the mount, which this one includes. The review of this text is owed.

## Facts

### answer

`relation-per-option` is recommended because it is the author's words of 2026-09-04, quoted above, it is what the reader and the fifty-nine readings on the record already carry, and it is what makes chosen over derivable rather than stored. Boldness moderate: the relation per option is the author's, while the derivation of chosen over, the reading as a node with its own class, and the deferral of the mount to the traditions-home node are the AI's. The case against is twofold. A reading per node multiplies files, and the queue effect of that is the cost the author will feel: every reading is a node with a stage, and the frontier grows by the readings owed. And the per-option relation binds a tradition's verdict to option names, which are the AI's handles and move under it as options are added, renamed, and composed, so that the option the author confirms can show no tradition beside it while a rival shows one; the answer meets that with the duty to re-point on every move and the review's finding where a recommended option stands unread.

#### relation-on-the-node

The answer as it stood from 2026-09-02: a reading is a node under the disposition it bears on, with a source, a locus, and one relation to the answer, adopted, diverged, or chosen over, and a stamp like any node. Viable if the author prefers one relation per reading.

#### traditions-as-mounts

The Draft distinguishes tradition from reading where the standing answer runs them together: a tradition is a mount, one root node in a traditions graph until it has a graph of its own, carrying the name it defines and its primary references, and a reading is a node under the disposition it bears on, naming the tradition it reads with its source, locus and relation. It adds that many questions reading one tradition are many readings naming one tradition, that the tradition's page shows every reading citing it, that prose reaches a tradition through the name it defines, and that a rationale never repeats its readings. Its own reviews record that ratifying it makes fourteen existing rationales non-conforming at once, that the reading nodes name no tradition node and no traditions graph exists in the manifest, and that no migration is named; measured again on 2026-09-05, fifty-nine readings, none naming a tradition node, and no traditions graph in the manifest.

#### incomplete-enumeration-in-facts

The same finding proposes that readings' facts say the remedy's enumeration is incomplete, so the author knows the size of what ratifying the rule puts on the frontier; readings' standing answer rests its rule that a rationale never repeats its readings on that enumeration being the remedy. Measured on 2026-09-05, by the marker phrases the record actually uses and not by one of them: nine rationales carry a prose tradition list, five more carry one only in an account, and `stub-traditions` stands at the maieutic stage with a hand-maintained enumeration naming twelve, which its own `regenerate-enumeration` option already calls stale. That is the size of what the rule puts on the frontier, and it is a hand count of a moving target, which is the option's whole point. (Raised on commons.systems/disposition-graph/audience.)

#### one-ruling-for-the-reading-class

Passed over on 2026-09-05: the four entries it would strike went in the re-encoding of 2026-09-04, no node carries an option of that name, and the class rule the answer states covers every reading, so it had nothing left to discharge. As raised: readings' answer says that the class rule it states governs every reading node without each carrying its own alternative for it. Verified as raised on 2026-09-03, that all four nodes then carrying a `delegated-not-ratified` alternative — software-factories, spec-driven-development, srs-introduction, web-routing — already recommended a class other than ratified, three of them delegated and srs-introduction deferred, so those four entries stood for a change the record had made and would put a settled question in front of the author four times. On this alternative the four entries are struck as discharged and readings' answer says that a reading's class follows from whether the author has read the source, so no reading needs an alternative to say it; it is on the table because the record currently carries four pending rulings on a rule it has already applied.

#### hold-for-traditions-home

Readings says on the node that its tradition-as-mount rule rests on traditions-home, which is unruled, and is not confirmed before it. Measured on 2026-09-05: readings stands at review and traditions-home at ruling with four options, recommending `one-traditions-graph`, and the manifest carries no traditions graph; the answer now cites traditions-home for where a tradition lives rather than stating it, and names it in `depends`, which is this option's ask. It is on the table because frontier-consistency requires a node not to rest silently on unruled ground and because the placement finding of 2026-09-03 proposed exactly this for readings and recorded an alternative on every other node it named but this one.

#### re-pointing-checked

The recommended answer with the duty made checkable: a `bears` entry carries the
pin of the recommendation it was written against, the validator reports an entry
whose fact has moved since, and "chosen over" is derived only from an entry that
is current. It answers the case against this node's own recommendation, which is
that option names move under the relation and the duty to re-point is stated and
unenforced; measured at this commit, the record carries 59 readings with 109
`bears` entries and a large minority of them name an option their fact no longer
recommends, so the duty is already unmet and every one of those entries reads,
under the answer's own definition, as a judgment of "chosen over" that nobody
made. What it costs is a pin on every entry and a validator that fails on drift
the author has not been asked about, which is the reason it is an option and not
the recommendation. Raised by the second clean-context reading of 2026-09-05, in
its viability field.

#### relation-per-option

A reading stays a node under one node it bears on, with its own class, and its relation attaches to the options of the fact it bears on rather than to the answer: adopted on the options the tradition supports, diverged on those it contradicts, so that "chosen over" becomes a tradition adopted on an option not chosen. The tradition's page still shows every reading that cites it, and the projections show on each option what tradition says. Raised on commons.systems/disposition-graph/viable-options, from the author's words of 2026-09-04 recorded there.

#### relation-per-holding

The relation attaches to the holding of the tradition and not to the option
alone, so a reading may be adopted on one part of what a tradition says and
diverged on another without either verdict swallowing the other. Under the rule
as it stands the relation is one value per option, and a reading whose tradition
is adopted in part must pick a net verdict and carry the nuance in prose, where
no projection reaches it; the alternative the record has actually reached for is
two entries on one option with opposite relations, which the second reading of
`commons.systems/disposition-graph/progressive-disclosure` found on that node's
draft, which `readBears` does not forbid, and which would put "supports" and
"departs" on the same row from one reading. What a ruling for it would cost is a
name for each holding, which is a second vocabulary the record does not have and
would have to keep stable across a reading's redrawings. Raised by that reading
on 2026-09-05, as the gap the double entry was reaching for; recorded as an
option and not taken, the double entry being struck for a net `diverged` in the
same landing.

### authority

Ratified is recommended because the rule fixes how tradition binds the record, which is the capture-shaped case the record's escalation rule names: a divergence recorded as the author's decision cannot be overruled by the tradition, and a rule that decides what a divergence is decides that for every reading after it. Boldness moderate: the classes a reading may carry are the author's words of 2026-09-02, the rule that a reading is a node and the per-option relation's consequences are the AI's. The case against is delegated: the relations are the AI's readings, every reading on the record recommends delegated for itself, and the author may hold the rule as loosely as its instances.

## Account

### Sitting on purpose, 2026-09-03

**The readings node, whole; tradition as mount**

Tradition and reading are distinguished. A tradition is a mount, one root node in a traditions graph until it has a graph of its own, carrying the name it defines and its primary references. A reading is one node's reference to a tradition, under the node it bears on, with source, locus, relation, and a stamp. Many questions reading one tradition are many readings naming one tradition, and the tradition's page shows them all. Prose links to a tradition through the name it defines. A rationale never repeats the readings.

Facts: authority ratified if q2 stands; boldness moderate; persistence standing.

Rejected:
- Stamped entries in a field with a derived reading frontier, the author's first framing. — Workable; parsimony of mechanism against parsimony of files, and a reading needs its own hash and pin.
- One node per tradition inside this graph. — A tradition is not a disposition of this project; it is mounted, not held (q2).

Depends on: `traditions-home`

Proposed text: the draft section of this node.

Responses open: confirm as shown; confirm with edits; deny with feedback.

### Clean-context review, 2026-09-03

Read in clean context by a subagent given the node, its ancestry, and the author's words, and nothing of the sitting. Verdict: forward to the author's ruling.

Findings:

- Draft Answer, last clause: 'the rationale of a node never repeats its readings.' Eleven rationales still carry prose tradition lists (persistence, review, validation-order, authority, session-context, transience, evaluation, work-loop, namespaces, recording, node), and materialization carries an inline one. Two of them, transience and session-context, are forwarded in this same batch as they stand. The remedy, stub-traditions, is at stage maieutic. Ratifying this rule puts twelve nodes on the frontier the moment it lands. Suggested edit: say so in the facts.
- Draft Answer: 'A reading is a node under the disposition it bears on, naming the tradition it reads.' The ten reading nodes today carry source and relation but name no tradition, and no traditions graph exists in the manifest. No migration is named.
- Draft frontmatter 'form: disposition' presumes the forms ruling; 'Depends on' lists only traditions-home.

On the three facts: 'Ratified if q2 stands' is right, boldness moderate is right. The facts should add that ratifying this rule immediately makes twelve existing rationales non-conforming and that the fix is unruled.

Strongest counter-argument (weak): Making every reading a node multiplies files where the author's first framing did not: one tradition read by three nodes becomes one root plus three readings, so the Aristotle material already spans three files and would span four. The node records this trade honestly as 'parsimony of mechanism against parsimony of files', and the four benefits it claims (shared storage, nesting, its own hash and pin, one stamp vocabulary) are real. Worth one line rather than a re-opening.

### Clean-context review, 2026-09-03

Read in clean context by a subagent given the node, its ancestry, and the author's words, and nothing of the sitting. Verdict: forward to the author's ruling.

Findings:

- Draft Answer, last clause: 'the rationale of a node never repeats its readings.' Verified: fourteen nodes carry prose tradition lists today (authority, dialogue, evaluation, materialization, namespaces, node, persistence, recording, review, scope, session-context, transience, validation-order, work-loop), and the remedy, stub-traditions, is at the maieutic stage and enumerates only twelve — it omits dialogue, recording and scope, and names instruments, which uses no marker phrase. Ratifying this rule puts fourteen nodes on the frontier at once with an enumeration that is short by three.
- Draft Answer: 'A reading is a node under the disposition it bears on, naming the tradition it reads.' The ten reading nodes carry source and relation and name no tradition, and no traditions graph exists in the manifest. No migration is named.
- The previous review's finding that 'Draft frontmatter form: disposition presumes the forms ruling' is stale; the draft carries 'form: rule'.
- Draft Answer: 'ratified when the author has read the primary source or understands the mounted graph and confirms the relation.' Verified applied to four readings (the three under public/agency and plato-maieutics, plato-periagoge now recommend delegated) and not to three (software-factories, spec-driven-development, srs-introduction still recommend ratified while their own rationales defer until the author reads).

On the three facts: The frontmatter recommendation (ratified, moderate) is right, contingent on traditions-home. The facts should add that ratifying makes fourteen existing rationales non-conforming, that the remedy is unruled and its enumeration incomplete, and that three reading nodes still present a class this rule forbids.

Strongest counter-argument (moderate): Making every reading a node multiplies files where the author's first framing did not: one tradition read by three nodes becomes one root plus three readings, so the Aristotle material already spans three files and would span four, and stub-traditions proposes about thirty more roots as open questions — every one of which, under transience, joins the author's queue. The node records the trade honestly as 'parsimony of mechanism against parsimony of files', and the four benefits it claims are real; but the queue effect is the cost the author will feel, and neither this node nor traditions-home states it.

The session's reply: Validated: fourteen rationales carry prose tradition lists, and the enumeration on stub-traditions is short by dialogue, recording, and scope, which its sitting adds. Ratifying this rule puts them on the frontier, which the facts now say. The migration of the reading nodes to named traditions comes with traditions-home, ruled first. On the counter-argument, that the queue effect is the cost the author will feel: accepted and stated; stub traditions enter as un-aligned dispositions at the periagogic stage, ruled or pruned in rank order.

### Frontier finding, 2026-09-03

Kind: redundancy.

Form-vocabulary's proposal is 'No new nodes. Each term is defined by the node that owns it, through the defines field ... the term index links every use in prose to that node, and a term no node defines is not linked, which is how drift shows.' That is what readings' draft already says for traditions ('Prose reaches a tradition through the name it defines') and what projection's draft already says for terms ('Every defined term and every tradition's name links to the node that defines it'), and what the browser already implements. Form-vocabulary restates two other nodes' answers and adds one decision — that no node per form is created — which is a rejected alternative rather than a question.

Also named: commons.systems/disposition-graph/form-vocabulary, commons.systems/disposition-graph/projection.

Proposed: Projection is the survivor for the linking rule and readings for the tradition rule. Form-vocabulary is folded into node's rationale as a rejected alternative ('one node per form, rejected because each would restate the definition its owning node already carries') and the node is pruned, which is what its own facts already say ('persistence not recorded'). The author's quote it carries is already carried verbatim on node.

### Frontier finding, 2026-09-03

Kind: cross-reference.

Two prose references point at nodes that no longer say what is attributed to them. Audience's Proposal: 'the five-audience finding moves to scope' — verified stale, the finding is on coverage, whose own '### Sitting on purpose' section says 'The paragraph that addressed the audience node now addresses this question'. And stub-traditions enumerates the rationales carrying prose tradition lists as node, authority, instruments, namespaces, persistence, work-loop, evaluation, review, session-context, materialization, transience and validation-order; verified by grep that fourteen nodes carry such lists and that three of them — dialogue, recording and scope — are missing from the enumeration, while instruments carries its traditions without the marker phrase. Readings' draft rests its rule on that enumeration being the remedy.

Also named: commons.systems/disposition-graph/audience, commons.systems/disposition-graph/coverage, commons.systems/disposition-graph/stub-traditions.

Proposed: Audience's Proposal names coverage instead of scope. Stub-traditions' enumeration is regenerated from the record rather than maintained by hand — the same class of drift the scope node's order field was introduced to prevent — and until it is, dialogue, recording and scope are added. Readings' facts say that the remedy's enumeration is incomplete, so the author knows the size of what ratifying the rule puts on the frontier.

### Frontier finding, 2026-09-03

Kind: placement.

Two ruling-stage nodes rest on maieutic ground without saying so. Rationale-edge is at ruling under under, which is at maieutic with 'Proposed: pending' and no draft, and under's own Proposal says its text is 'Drafted after q14, q15, and q16 are ruled' — one of which, tier, was kicked back and its recommendation withdrawn, so under cannot be drafted as planned. Separately, readings' draft and namespaces' draft both presume a traditions graph that traditions-home would create, and traditions-home is at ruling but is listed as a dependency of both; the manifest edit that would create the graph is shown on none of the three.

Also named: commons.systems/disposition-graph/rationale-edge, commons.systems/disposition-graph/under, commons.systems/disposition-graph/tier, commons.systems/disposition-graph/traditions-home, commons.systems/disposition-graph/namespaces.

Proposed: Rule traditions-home before readings and namespaces, and show the manifest entry on traditions-home so the author sees what they are creating. Rule rationale-edge and re-answer tier before under, and add to rationale-edge one clause saying its parent is unanswered. Under is then drafted from the three outcomes, simplified as the decomposition finding proposes.

### Frontier finding, 2026-09-03

Kind: coverage.

Readings' rule is that a reading is 'ratified when the author has read the primary source ... delegated when the AI's reading stands and the author declines to review it'. Five reading nodes now carry 'recommendation: class: delegated' (the two public readings, aristotle-hexis, plato-maieutics, plato-periagoge), applying the previous round's finding. Four do not: software-factories, spec-driven-development, srs-introduction and web-routing all carry 'class: ratified' while each of their own rationales says the reading is deferred until the author reads the sources. All ten readings additionally carry the stale prose Facts line offering 'ratified if the author confirms, or delegated where the author's words delegate it', which states two classes for one stamp.

Also named: commons.systems/public/aristotle-arche-of-action, commons.systems/public/pettit-non-domination, commons.systems/disposition-graph/aristotle-hexis, commons.systems/disposition-graph/plato-maieutics, commons.systems/disposition-graph/plato-periagoge, commons.systems/disposition-graph/software-factories, commons.systems/disposition-graph/spec-driven-development, commons.systems/disposition-graph/srs-introduction, commons.systems/disposition-graph/web-routing.

Proposed: Readings is the survivor of the rule. The four remaining reading nodes change their recommendation class from ratified to delegated, and every reading's prose Facts line is rewritten to 'delegated on confirmation; ratified after the author's reading', which is what the rule says and what the corrected five already imply. This is a mechanical pass the session can make at the recording, but the author should not be shown four readings offering a class the record's own rule forbids.

### Re-encoding, 2026-09-03

Re-encoded on 2026-09-03 under the author's bootstrap grant on the dialogue node, against graph commit 6d21d356: the account section, formerly named the proposal, and the recommended text, formerly the draft, were renamed, and the dialogue state was written as data.
Alternatives pending, with their sources: `draft` (ai); `incomplete-enumeration-in-facts` (review, 2026-09-03, from commons.systems/disposition-graph/audience).
The recommendation adopts `draft` and is pinned to the standing text as it was at that commit.
Merge analysis of the author's words: 2026-09-02, own-question: Re-evaluate the naming and function of the reading form against tradition, with tradition as a mount of another project that could be its own graph, references to it supporting or diverging and carrying an authority class, and a recommendation for how many questions referencing one tradition are encoded. 2026-09-02, new-answer on commons.systems/disposition-graph/projection: References to tradition in the prose of the documentation projection should hyperlink to the tradition node, keeping the way target dispositions are hyperlinked. 2026-09-02, own-question: Do not replicate tradition references in the rationale section, and confirm the tradition section is projected from the references rather than duplicated in the node body; the first half is this node's rule and the second bears on projection.
Moved to other nodes as alternatives: `hyperlink-traditions-in-prose` on commons.systems/disposition-graph/projection; `fold-into-node-and-prune` on commons.systems/disposition-graph/form-vocabulary.
The census unit's note: At ruling with a Draft, so the recommendation adopts it and the draft is the only pending alternative; the counter-argument about multiplying files is the trade the rationale already records as rejected, so it was not minted. Two findings here are verified resolved and carried nowhere: the four reading nodes the coverage finding names all carry class delegated today, and the cross-reference finding's audience half is applied. What remains of that finding, the incomplete enumeration, is carried on stub-traditions instead. The author's hyperlink words ground projection's linking rule and sit on no other node, so they move there; the form-vocabulary fold is the redundancy this node's own finding proposes.

### Frontier finding, 2026-09-03

Kind: merge.

Four questions are each pending as the same alternative on four to six different nodes, so the author would rule one question up to six times. Verified from the frontier's alternatives lists: (i) `say-instrument-not-criterion` is pending on scope, work-loop, transience and purpose, and each entry says the same thing — that until instruments is ruled the answer says 'instrument', the term instruments actually defines, since 'criterion' is in no node's `defines` and 'criteria' is not in FRONTMATTER_KEYS; instruments owns the question and stands at the maieutic stage with `define-criterion` pending. (ii) `delegated-not-ratified` is pending on software-factories, spec-driven-development, srs-introduction and web-routing, each saying that a reading whose source the author has not read is delegated and not ratified; readings owns the rule and all four recommendations have in fact already been corrected to delegated, so four alternatives now stand for a change already made. (iii) `traditions-to-readings` is pending on materialization, validation-order, instruments and evaluation, each saying the node's prose tradition list goes to readings under the stub-traditions ruling; stub-traditions owns the enumeration and its own `regenerate-enumeration` alternative says the enumeration is incomplete and should be derived rather than maintained by hand. (iv) The same ruling appears as `deferred-rather-than-ratified` on legacy and recording, `deferred-until-ruling-quoted` on validation-order and evaluation, and `deferred-not-ratified` on review and persistence — six nodes, three names, one question: whether a node recommending ratification with no ruling quoted in it should drop to deferred instead; quotes owns that question. Under validation 15 each of these is a new answer to a question the record already asks, standing as its own alternative on a node that does not own the question.

Also named: commons.systems/disposition-graph/instruments, commons.systems/disposition-graph/stub-traditions, commons.systems/disposition-graph/quotes, commons.systems/disposition-graph/scope, commons.systems/disposition-graph/work-loop, commons.systems/disposition-graph/transience, commons.systems/disposition-graph/purpose, commons.systems/disposition-graph/software-factories, commons.systems/disposition-graph/spec-driven-development, commons.systems/disposition-graph/srs-introduction, commons.systems/disposition-graph/web-routing, commons.systems/disposition-graph/materialization, commons.systems/disposition-graph/validation-order, commons.systems/disposition-graph/evaluation, commons.systems/disposition-graph/legacy, commons.systems/disposition-graph/persistence, commons.systems/disposition-graph/review, commons.systems/disposition-graph/recording.

Proposed: Instruments is the survivor of the criterion vocabulary, readings of a reading's class, stub-traditions of the prose tradition lists, and quotes of what an unquoted ratified stamp becomes. Each survivor takes one alternative saying that its ruling settles the question for every node that carries the per-node entry, and each per-node alternative is then a consequence of the survivor's ruling rather than a separate ruling — which is what the record already does for the four readings, whose class was changed once and recorded four times. The four per-node families stay listed so the author can see the blast radius, but the ruling order puts the survivor first and the alignment page should say that confirming the survivor discharges them. Case (ii) is the clearest: all four recommendations already read delegated, so those four alternatives are discharged and should be struck rather than ruled.

Recorded as a pending alternative on commons.systems/disposition-graph/instruments: `one-ruling-for-the-word` (source review, 2026-09-03).

Recorded as a pending alternative on this node: `one-ruling-for-the-reading-class` (source review, 2026-09-03).

Recorded as a pending alternative on commons.systems/disposition-graph/stub-traditions: `one-ruling-for-the-prose-lists` (source review, 2026-09-03).

Recorded as a pending alternative on commons.systems/disposition-graph/quotes: `one-ruling-for-the-unquoted-stamp` (source review, 2026-09-03).

### Frontier finding, 2026-09-03

Kind: placement.

Readings stands at the ruling stage while the node that creates what its recommended text presumes stands two stages behind it. Readings' recommended text says 'a tradition is a mount, one root node in a traditions graph until it has a graph of its own'; traditions-home, which rules whether that graph exists and in what form, is at the review stage in this batch with `graph-per-tradition` and `nodes-inside-disposition-graph` both pending — two options under which readings' sentence is wrong. Namespaces, also at review, presumes the same graph. Verified that disposition/disposition.yaml carries only `disposition-graph` and `public`, so the graph none of the three can do without does not exist, and the manifest entry that would create it is written on no node. Frontier-consistency's validation 13 requires that no node at the ruling stage rest on periagogic or maieutic ground 'without saying so'; readings rests on review-stage ground and says nothing, and unlike rationale-edge and namespaces it carries no alternative recording the dependency — the placement finding of 2026-09-03 named readings in its proposal and minted an alternative on every other node it named.

Also named: commons.systems/disposition-graph/traditions-home, commons.systems/disposition-graph/namespaces.

Proposed: Traditions-home is the survivor of where a tradition node lives and is ruled before readings and namespaces, which the ruling order below does; the manifest entry it creates is shown on it, since that is what the ruling makes. Readings takes the alternative below, saying on the node that its tradition-as-mount sentence stands only if traditions-home's recommended option is taken — the gap the earlier finding left when it recorded its proposal on every named node but this one.

Recorded as a pending alternative on this node: `hold-for-traditions-home` (source review, 2026-09-03).

### Clean-context review, 2026-09-05

Read in clean context by a subagent given this draft, its ancestry, its siblings, the nodes it names, and the index of every question the record asks, and nothing of the sitting. Verdict: forward to the author's ruling.

Findings:

- ## Facts, `### answer` and `### authority`: neither subsection opens with a reason. dialogue's standing answer requires that "`## Facts` holds one subsection per fact, in the same order, opening with the reason for its recommendation", and its fence names the check the reader owes, "the reason for a recommendation, which is the fact's own `###` subsection, from the same stage"; this node is at the review stage, `### answer` runs straight into `#### relation-on-the-node`, `### authority` is bare, and the frontier shows `against: none` on both facts while the review's recorded case against (the file multiplication and "the queue effect is the cost the author will feel, and neither this node nor traditions-home states it") has had no reply since the amendment of 2026-09-04. The same finding was accepted on authority on 2026-09-05. Suggested edit: open `### answer` with why `relation-per-option` is recommended and what rests on the AI at moderate boldness (the relation per option is the author's words of 2026-09-04; the derivation of chosen over, the reading as a node with its own class, and the mount are the AI's), and write the queue effect as the fact's `against` with the reply; open `### authority` with why ratified (a rule that fixes how tradition binds the record is the capture-shaped case the escalation rule names).
- ## Rationale: "The author's ruling of 2026-09-02 that tradition references carry authority classes" and "as the author ruled on 2026-09-02". No ruling is recorded on any fact of this node (the frontier reads it "unanswered (no ruling)"), and the words of 2026-09-02 are a question that closes "recommend, how should multiple questions that reference the same tradition be encoded?". authority defines a ruling as "the author's act on the option they chose, recorded on it", and the record has already struck one loose use of a technical term ("proposal", on dialogue). Suggested edit: "the author's disposition of 2026-09-02" in both places.
- ## Answer: "A reading is a node under the disposition it bears on", repeated in `#### relation-per-option` as "A reading stays a node under the disposition it bears on". The encoding and the record differ from that sentence: the reader resolves `bears[].node` to any node and defaults it to the parent only when the reading has one parent, and twenty readings bear on nodes other than the one they sit under, among them ibis-issue-based-information, under viable-options, which bears on this node's `relation-per-option` and on alignment-page, and chestertons-fence, under viable-options, with an entry on rejected. The answer says neither that a reading may bear on options of several nodes nor which of them it sits under. Suggested edit: "a reading sits under one node it bears on and may bear on the options of any node, naming the node wherever it is not the parent".
- ## Answer: "until it is articulated is one root node in the traditions graph, carrying the name it defines and its primary references" and "naming the tradition it reads, its source and locus". The manifest carries two graphs, `disposition-graph` and `public`, and no traditions graph; no node carries a tradition form and no reading carries a field naming a tradition, only `source` and `bears`; fifty-nine readings exist and no tradition node does. Where a tradition lives is traditions-home's question, at the ruling stage with four options and recommending `one-traditions-graph`, and it stands after this node in the ruling order, so this answer decides an open node's question inside its own text and presumes a ruling not yet given, against dialogue's "A decision the author is to rule on separately is a question, and a question is a node". `hold-for-traditions-home` is on the fact as viable for exactly this and is not recommended, and `depends` names viable-options only. Suggested edit: have the answer cite traditions-home for where a tradition lives rather than state it, and either add traditions-home to `depends` or say that today a reading names its tradition in `source` alone and the tradition node is owed; and make "source and locus" plural or say a reading may carry several, since web-routing cites four sources in one field.
- ## Facts option subsections are measured against a record that has moved and the page shows them as current. `#### hold-for-traditions-home`: "Verified that readings stands at the ruling stage while traditions-home stands at review with two pending alternatives" is stale both ways, readings being at review and traditions-home at ruling with four options. `#### traditions-as-mounts`: "the ten reading nodes name no tradition" where fifty-nine readings exist. `#### incomplete-enumeration-in-facts`: "readings' draft rests its rule that a rationale never repeats its readings" where this node has no fence and the rule is in the standing answer. Suggested edit: re-measure each subsection at the commit of this landing and date the measurement.
- `#### one-ruling-for-the-reading-class`: "all four nodes still carrying a `delegated-not-ratified` alternative — software-factories, spec-driven-development, srs-introduction, web-routing". No node carries an option of that name today; the string survives only in account prose on twenty files, the four readings recommend delegated on their authority facts, and stub-traditions' own merge finding says those alternatives "are discharged and should be struck rather than ruled". The option has nothing left to discharge and sits as a live row the author would rule on. Under viable-options' recommended `passed-over-options-stay` the AI passes it over with a reason rather than removing it. Suggested edit: `status: passed`, `reason: "the four entries it would strike went in the re-encoding of 2026-09-04, and the class rule the answer states covers every reading"`, and the subsection saying so.
- ## Disposition carries the three quotations of 2026-09-02 only, while `relation-per-option` is `source: author`, `ref: "2026-09-04"`. viable-options' facts prose gives the test: "an option sourced to the author carries as its reference the date of the words in a `## Disposition` that raised it"; here the date points at words on another node, quoted in the rationale with elisions ("Each fact on a node ... has viable options list ... with ... b) support or divergence from tradition for each option"), and authority's rule is that words that are not in the record confer nothing. authority's own review of 2026-09-05 found its 2026-09-04 words absent from `## Disposition` and the session copied them in. Suggested edit: quote the sentence of 2026-09-04 that raised the option under `## Disposition`, dated, with the line dialogue uses for words held elsewhere, "The words in full are on commons.systems/disposition-graph/viable-options".
- ## Answer: "diverged, where the option departs from it and the reading says why". A `bears` entry carries `node`, `fact`, `option` and `relation` and no field for the why; the record's one diverged reading, single-subject-rule, carries its why in its `## Answer`, which the answer should name as the place, since a projection on the option can show the relation alone. Related, on the rationale's claim that "its relation moves from the node to the options": srs-introduction's `## Recommendation` fence, on a reading at the ruling stage, still carries node-level `source:` and `relation: adopted`, the encoding this answer displaced and the reader now rejects ("a reading's 'bears' entries carry the relation now"), so a confirmation there would land a text the reader refuses; that is srs-introduction's defect, named here because the migration this rationale describes missed a fence.

On the facts and what they recommend: Two facts, answer and authority, each recommending a listed option at moderate boldness; `stands` names the recommended option, so no fence is required and none is present; neither fact opens with its reason and neither carries a case against; no option carries a status though `one-ruling-for-the-reading-class` is discharged on the record; `depends` names viable-options alone while the answer's mount clause rests on traditions-home, which stands at ruling behind this node in the order.

On the viability of the options: `relation-per-option` is viable and the right recommendation: it is the author's words of 2026-09-04, it is what the reader and fifty-nine readings already carry, and it is what makes chosen over derivable. `relation-on-the-node` and `traditions-as-mounts` stay viable as the author's first framing; `hold-for-traditions-home` is viable and is the honest treatment of the mount clause until traditions-home is ruled; `incomplete-enumeration-in-facts` is viable while stub-traditions is open; `one-ruling-for-the-reading-class` is discharged and should be passed over with its reason rather than left as a live row.

Strongest counter-argument (moderate): The per-option relation binds a tradition's verdict to option names, which are the AI's handles and move under it: the AI adds, renames and composes options freely, and the record did so this week, composing five clauses on dialogue into `every-part-in-the-record` while the readings under dialogue stayed adopted on the clauses, so the option the author is asked to confirm shows no tradition beside it and the derived "what tradition says" is sparsest exactly where the ruling is taken. The node-level relation survived every re-composition because it bound the reading to the answer, which is the unit the author confirms. The validator checks that a `bears` entry resolves and nothing checks that a recommended option has been read against the traditions its rivals were, so a projection can show a bare recommended option beside a well-read rival and imply the tradition is against it. The reply available is that a reading may carry several entries and the session re-points them, as pareto-frontier gained a second entry; but that duty falls on every move of a recommendation, which the AI may make freely on a delegated node, and the answer states neither the duty nor a check.

The session's reply: Validated, all eight. Each fact opens with its reason and carries its case against; the answer fact's is the queue effect and the reading's counter-argument, that option names are the AI's handles and move under a per-option relation, met in the answer by a rule that a move re-points the readings bearing on the option it leaves and that a recommended option unread against a tradition its rival was read against is a finding of the review. The words of 2026-09-02 are a disposition and are named so in the rationale. The answer says a reading sits under one node it bears on and may bear on the options of any node, naming the node wherever it is not the parent, with sources and loci plural. Where a tradition lives is cited to the traditions-home node, named in depends, and until it is ruled a reading names its tradition in its source alone. The option subsections are re-measured at this landing and dated. one-ruling-for-the-reading-class is passed over with its reason, the four entries having gone in the re-encoding of 2026-09-04. The sentence of 2026-09-04 that raised relation-per-option is quoted under Disposition with the pointer to the words in full. The answer names the reading's own answer as the home of a divergence's why, and the srs-introduction fence, which still carried the node-level relation, now carries its bears entry and returns to review. Stage review for the re-read.

### Amended after the reading, 2026-09-05

After the clean-context reading of 2026-09-05, whose findings the session validated. Each fact opens with its reason and carries its case against. The words of 2026-09-02 are a disposition and the rationale names them so. The answer says a reading sits under one node it bears on and may bear on the options of any node, naming the node wherever it is not the parent, with sources and loci plural, since many readings bear on nodes other than their parent. Where a tradition lives is cited to the traditions-home node, which stands at ruling behind this node and is named in `depends`; until it is ruled a reading names its tradition in its source alone. The option subsections are re-measured at this landing and dated. `one-ruling-for-the-reading-class` is passed over with its reason. The sentence of 2026-09-04 that raised `relation-per-option` is quoted under Disposition with the pointer to the words in full. The answer names the reading's own answer as the home of a divergence's why, and meets the reading's counter-argument, that option names move under the relation, with the duty to re-point on every move and the review's finding where a recommended option stands unread. The srs-introduction fence, which still carried the node-level relation the reader rejects, now carries its `bears` entries and was re-read on 2026-09-05 at the ruling stage. Stage review for the re-read.

### Clean-context review, 2026-09-05

Read in clean context by a subagent given this draft, its ancestry, its siblings, the nodes it names, and the index of every question the record asks, and nothing of the sitting. Verdict: forward to the author's ruling.

Findings:

- ## Answer, the clause added at this amendment: "a recommended option that no reading has been read against, beside a rival one has, is a finding of the review." The draft assigns a validation to an instrument another node owns, and nothing carries it. Verified at the locus: frontier-consistency's validation 4 reads, in the standing answer (disposition/disposition-graph/frontier-consistency.md:108) and identically in its `## Recommendation` fence (line 225), "Readings. A tradition cited is represented accurately within its recorded support scope, and a divergence from it is recorded as the author's" — no clause about an unread recommendation; and `grep -rn "unread|read against" packages/clean-context-review/` finds the phrase only in the briefs' report boilerplate, so neither brief-draft.md nor brief-delta.md asks its reader for the check. The brief generated for this reading did not ask me for it either. Suggested edit: record the check where the validations live — an option on commons.systems/disposition-graph/frontier-consistency's answer fact, source review, named `unread-recommended-option`, whose prose is "Validation 4 also asks whether the option a fact recommends has been read against the traditions its rivals were read against: a bare recommended option beside a well-read rival is a finding, since the projection implies the tradition is against it" — and have this answer cite frontier-consistency for it rather than state it; or, until that option is ruled, say here that the check is owed.
- ## Answer: "A move of a recommendation re-points the readings that bear on the option it leaves" and "A tradition adopted on an option not chosen is what chosen over names, and it is derived and never stored." The duty is already unmet across the record it describes, and its breach is indistinguishable from the thing it derives. Measured at this commit by parsing every `bears` block under disposition/disposition-graph/ and disposition/public/: 59 readings carry 108 entries, of which 38 name an option that is not what that fact now recommends — eight adopted on commons.systems/disposition-graph/viable-options#grant-from-a-ruling while that fact recommends `passed-over-options-stay`, six on alignment-page#three-column-ruling-screen while it recommends `every-fact-every-option`, four on dialogue#facts-carry-options while it recommends `every-part-in-the-record`, three on dialogue#alternatives-beside-facts, and so on. Under this answer's own definition each of those thirty-eight now reads as chosen over, a judgment nobody made; the projections show the adopted chip on the unchosen option (packages/disposition/project.mjs:1443, browser-template.html:1029, whose `relBadge` still handles a `chosen-over` relation the reader never emits, RELATIONS being ['adopted','diverged'] at packages/disposition/read.mjs:107). Suggested edit: either say that chosen over is derived only from a relation recorded against that option after the fact's recommendation last moved, or make the duty checkable — see the missing option named in the viability field.
- ### Amended after the reading, 2026-09-05: "with sources and loci plural, since nineteen readings bear on nodes other than their parent." The count is wrong at the locus. Measured at this commit: twenty-three readings carry thirty-five `bears` entries naming a node other than their parent — approval-directed-agents, chenery-reasoned-decision, chestertons-fence, codd-update-anomaly (four entries), deprecation-not-deletion, dry-single-source-of-truth, event-sourcing-derived-view, fagan-inspection-roles, file-drawer-and-pre-registration, ibis-issue-based-information, level-triggered-reconciliation, madr-decision-records (three), non-liquet, notarial-minute, ocap-attenuation, pareto-frontier, peirce-paper-doubt, plato-maieutics, promotor-fidei, scholarly-peer-review, segregation-of-duties, single-subject-rule, public/pettit-non-domination. Suggested edit: "twenty-three readings", or drop the count, which the sentence does not need. (The answer's sentence itself is sound: every one of the 59 readings bears on its own parent and none has two parents, so "A reading sits under one node it bears on" holds.)
- ### Amended after the reading, 2026-09-05: "The srs-introduction fence, which still carried the node-level relation the reader rejects, now carries its `bears` entry and returns to review." Half of that is not true at the locus. disposition/disposition-graph/srs-introduction.md carries `stage: ruling` and `review: {verdict: forward, strength: moderate, date: 2026-09-05, of: 9de579468ecfc1b520b1284b2474951f7085a0f8}`, and the frontier row shows it at the ruling stage with no "changed since its review" flag; its fence (lines 108-132) does now carry two `bears` entries and no node-level `relation`. So the fence was fixed and read at the ruling stage, and the node did not return to review. Suggested edit: "now carries its `bears` entries and was re-read on 2026-09-05 at the ruling stage".
- #### one-ruling-for-the-reading-class contradicts itself within the subsection and carries a false present-tense measurement. It opens "no node carries an option of that name" and then says "Verified that all four nodes still carrying a `delegated-not-ratified` alternative — software-factories, spec-driven-development, srs-introduction, web-routing — already recommend delegated". Verified: `grep -rn "name: delegated-not-ratified" disposition/` returns nothing (the string survives only in account prose, on twenty files), and srs-introduction's authority fact recommends `deferred`, not delegated — software-factories, spec-driven-development and web-routing recommend delegated. Suggested edit: date the second half as the option was raised ("As raised on 2026-09-03: ... verified then that all four ...") and correct the class, or strike the sentence, since the passing-over reason above it already carries the whole ground.
- #### incomplete-enumeration-in-facts is the one option subsection the amendment left unmeasured and undated, while it dated the other two, and the number the 2026-09-03 reply promised is on the node nowhere. That reply reads "Ratifying this rule puts them on the frontier, which the facts now say"; today neither `### answer` nor this subsection states any count, so the author is asked to ratify "the rationale of a node never repeats its readings" without being told the size of what that puts on the frontier. Measured at this commit by the marker phrase "traditions to record as readings": six `## Rationale` sections carry a prose tradition list (node, review, session-context, namespaces, evaluation, persistence), three more carry one only in `## Account` (authority, materialization, work-loop), and stub-traditions still stands at the maieutic stage with its enumeration maintained by hand, naming twelve. Suggested edit: re-measure and date this subsection as `#### traditions-as-mounts` and `#### hold-for-traditions-home` were — "measured on 2026-09-05, six rationales carry a prose tradition list and stub-traditions' hand-maintained enumeration names twelve".
- A finding about another node, proposed and not made. commons.systems/disposition-graph/model, this node's parent, recommends the option `draft`, whose text says "A node's answer is grounded by readings, each a reference to a tradition with a relation of adopted, diverged, or chosen over." This draft makes chosen over derived and never stored, and the reader agrees: `export const RELATIONS = ['adopted', 'diverged']` at packages/disposition/read.mjs:107. readings sits under model, defines the term, and is the survivor. Proposed: an option on model's answer fact, source review, named `chosen-over-derived`, carrying the prose "model's draft names three relations on a reading where readings makes chosen over derived and the reader accepts only two: strike 'or chosen over' from 'a relation of adopted, diverged, or chosen over' and let the readings node's definition stand." Nothing on this node changes.
- A second finding about another node, from the same clause. commons.systems/disposition-graph/spec-driven-development's account hands the author a live choice — "the author rules whether that is adopted or chosen over" — and its review's `against` says "this is nearer to 'chosen over'". Under this draft that choice cannot be recorded as it is worded: chosen over is not a relation a `bears` entry may carry, only a derivation from an adopted entry on an option that was not chosen. Proposed: when readings is ruled, that node's session re-words the choice as an entry on the rival option or as `diverged`, and records an option there saying so; readings itself needs no change, but the author should not be offered a relation the encoding this ruling fixes cannot hold.
- Validation 15, merge. ## Answer's last two clauses, "the tradition's page shows every reading that cites it" and "Prose reaches a tradition through the name it defines", are also answered by commons.systems/disposition-graph/projection, whose recommended `draft` says "Every defined term and every tradition's name links to the node that defines it." This node's own redundancy finding of 2026-09-03 settled the division — "Projection is the survivor for the linking rule and readings for the tradition rule" — but both texts still carry the tradition half, so one question has two standing answers on the frontier. Proposed, as an option and not a merge: on projection, source review, `tradition-linking-cited-to-readings`, "Strike 'and every tradition's name' from the linking clause and cite readings, which owns how a reference to a tradition is reached, as the redundancy finding of 2026-09-03 divided them."
- Validation 5. ## Answer discloses the unmade ground once — "where it lives until it is articulated ... is the traditions-home node's question; until that is ruled a reading names its tradition in its source alone, and the tradition node is owed" — but two later clauses presume the same unmade node and are not reached by the disclosure: "the tradition's page shows every reading that cites it" and "Prose reaches a tradition through the name it defines". Verified: disposition/disposition.yaml carries `disposition-graph` and `public` and no traditions graph; `grep -rl "^form: tradition$" disposition/` returns nothing; all 59 readings name their tradition in the prose of `source`. So there is no tradition page to show anything and no defined name for prose to reach. Suggested edit: extend the disclosure — "and until then the tradition's page and the name prose reaches it by are owed with it".

On the facts and what they recommend: Two facts, answer and authority, each opening with its reason and each carrying its own `against`, which the previous reading asked for and which is now there; `existence` and `persistence` are rightly absent, since neither a prune nor a change of shape is proposed. The answer fact recommends `relation-per-option`, which is also what `stands`, so no `## Recommendation` fence is required and none is present; `one-ruling-for-the-reading-class` carries `status: passed` with its reason, and the other five options stay live and unmarked, which matches the record. The authority fact's `ratified` at moderate boldness is the class the session means to present and its case for delegated is honestly stated; on the answer fact moderate boldness sits at the top of its range rather than the middle, because the two clauses added at this amendment — the duty to re-point on a move and the finding the review is told to make — are wholly the AI's, rest on no words of the author's and on no instrument, and are the answer's only reply to its own strongest objection. The `review` pin (61b6d00d…) is stale, which is what this re-reading exists to replace.

On the viability of the options: Every option listed is viable on its facts and the one passed over is rightly passed over: `relation-per-option` is the author's words of 2026-09-04, now quoted under `## Disposition`, and is what the reader and all 59 readings already carry; `relation-on-the-node` and `traditions-as-mounts` remain the author's first framing; `hold-for-traditions-home` stays viable while traditions-home is at ruling behind this node; `incomplete-enumeration-in-facts` stays viable while stub-traditions is at maieutic with a hand-maintained enumeration; `one-ruling-for-the-reading-class` is genuinely discharged, no node carrying an option of that name. One viable option is missing, and it is the one the two findings above converge on: `re-pointing-checked` — "The per-option relation as recommended, with the duty to re-point made a check rather than a sentence: a `bears` entry records the pin of the fact's recommendation it was written against, the validator flags an entry whose fact has moved since, and chosen over is derived only from a current entry, so a stale pointer is never read as a tradition preferring an option the author did not choose. It is on the table because 38 of the record's 108 `bears` entries today name an option their fact no longer recommends, and under the recommended answer every one of them already derives as chosen over." The author should get to rule on whether the guard is a sentence or a check, and as the facts stand only the sentence is on the table.

Strongest counter-argument (moderate): The per-option relation leaves the record's "what tradition says" both sparse and unreliable, and this answer's remedies for that are sentences held by nothing. Measured at this commit, 33 of the record's 542 answer-fact options carry any reading at all, and the readings cluster on a handful of hot options (seventeen on alignment-page#every-fact-every-option), so an empty tradition cell beside the option the author is ruling on is indistinguishable from an option nobody read — the derived reading is sparsest exactly where the ruling is taken. Worse, 38 of the 108 `bears` entries name an option their fact no longer recommends, eight of them still adopted on viable-options#grant-from-a-ruling after that fact moved to `passed-over-options-stay`, and under this answer's own definition each reads as a tradition chosen over, a judgment nobody made; the node-level relation this answer displaces had neither failure, because it bound the reading to the answer, which is the unit the author confirms. The answer's two replies — that a move re-points the readings and that the review finds a recommended option nobody read — are held by no instrument: the validator checks only that a `bears` entry resolves, frontier-consistency's validation 4 carries no such check, and the review brief does not ask for one. What keeps this a moderate objection rather than a fatal one is that the per-option relation is the author's own words of 2026-09-04, so what is really in question is not the design but whether its two guards are made before it is ratified.

The session's reply: All ten findings were validated at their loci on the main thread; nine are accepted and one is accepted with a correction to its own measurement. Four of them are recorded on other nodes and not answered here.

F1, a validation assigned to an instrument that does not carry it: confirmed. `frontier-consistency`'s validation 4 reads the same in the standing answer and in the fence and says nothing about an unread recommended option, and neither brief asks its reader for the check. The clause is not struck, because the check is the right one and this node's own case against is what asks for it, but it no longer reads as though the review already performs it: the answer says the check is owed and cites `frontier-consistency`, and the option `unread-recommended-option` is recorded there, in the reader's words, on the node whose answer owns the validations.

F2, a duty the record does not meet: confirmed and re-measured. The reader counted 38 of 108 `bears` entries naming an option their fact no longer recommends; my own parse at this commit counts 109 entries across 59 readings with the same shape of result, and the exact figure moves with every landing, which is the finding rather than an objection to it. Under this answer's own definition each stale entry now reads as "chosen over", a judgment nobody made, and the projections show it. The answer states the duty and now also states that it is unmet and unchecked at the record's head; the option `re-pointing-checked` is recorded on the answer fact, from this reading's own viability field, so the author can rule for a checkable duty rather than a stated one; and the measurement is in the account with the method that produced it.

F3, a count that is wrong: confirmed, and my own count differs from the reader's again, which is the argument for dropping it. The sentence does not need a number and the number cannot be maintained by hand, so it goes and the correction is disclosed here.

F4, a claim about another node's state: confirmed. `srs-introduction` stands at `stage: ruling` with a forward review of 2026-09-05 and a fence carrying two `bears` entries; it did not return to review. The sentence is corrected at the locus.

F5, a subsection contradicting itself: confirmed. `grep -rn "name: delegated-not-ratified" disposition/` returns nothing, and `srs-introduction`'s authority fact recommends `deferred`, not `delegated`. The present tense is dated to when the option was raised and the class is corrected.

F6, the one option subsection left unmeasured: confirmed, and the promise of 2026-09-03 is unkept. Measured on 2026-09-05 by the marker phrases the record actually uses: nine rationales carry a prose tradition list and five more carry one only in an account, while `stub-traditions` stands at the maieutic stage with a hand-maintained enumeration naming twelve. The subsection is dated and carries that measurement, and the divergence from the reader's narrower count is stated with the method, since the marker phrase varies across the record.

F7, F8 and F9, three findings about other nodes: all confirmed at their loci and all recorded there as options, not made. `model` recommends a draft naming three relations where the reader accepts two, and gains `chosen-over-derived`. `spec-driven-development` offers the author a choice between adopted and chosen over that this encoding cannot record, and gains `chosen-over-is-not-a-choice-the-author-can-be-offered`, which says what the choice becomes. `projection` still carries the tradition half of a linking rule this node's redundancy finding of 2026-09-03 divided the other way, and gains `tradition-linking-cited-to-readings`. Each is written in the reader's terms and answers nothing on its node's behalf.

F10, two clauses presuming an unmade node: confirmed. `disposition.yaml` carries two graphs and no traditions graph, and no node carries `form: tradition`. The disclosure already on the answer is extended to reach both clauses.

Two amendments follow and no third reading is bought: this is the second reading of this answer and the cap is reached. The pin this reading recorded names the draft the reader read and is not re-settled, for the reason `review-cost`'s option `pin-names-the-text-the-reader-read` records.

### Amended after the second reading, 2026-09-05

All ten findings were validated at their loci on the main thread and all ten
were accepted; the reply above says how each was answered.

Three amendments are the answer's own. The clause about a recommended option
that no reading has been read against no longer reads as though the review
performs the check: it says the check is owed, cites `frontier-consistency`,
whose validation 4 does not ask for it, and the option is recorded there. The
disclosure that the traditions-home node is unmade now reaches the two later
clauses that presume it, the tradition's page and the defined name prose reaches
it by. And the duty to re-point a reading when a recommendation moves is stated
with what is true of it: it is unchecked, and unmet across the record at this
commit.

The measurement, with its method, since two counts of it disagree. Parsing the
`bears` blocks of every node under `disposition-graph/` and `public/` at this
commit gives 59 readings carrying 109 entries; the reader, parsing before the
day's landings, gave 108 entries of which 38 named an option their fact no
longer recommends. Both counts find the same thing and neither can be maintained
by hand, which is the argument of the option this reading raised and which is
now on the fact: `re-pointing-checked` would pin each entry to the
recommendation it was written against and let the validator report the drift.
For the same reason the account sentence claiming "nineteen readings bear on
nodes other than their parent" loses its number rather than gaining a corrected
one; my own parse counts twenty-four readings and the reader counted
twenty-three, and the sentence never needed the figure.

Two corrections of fact in the record's own prose. The sentence saying the
`srs-introduction` fence "returns to review" was false at the locus: that node
stands at `stage: ruling` with a forward review of 2026-09-05 and a fence
carrying two `bears` entries, and the sentence now says so. And
`#### one-ruling-for-the-reading-class` contradicted itself, opening with "no
node carries an option of that name" and then verifying four that do in the
present tense: the verification is dated to when the option was raised, and the
class is corrected, since `srs-introduction` recommends deferred and not
delegated.

`#### incomplete-enumeration-in-facts` is measured and dated like its two
neighbours, and the promise of 2026-09-03 that the facts would tell the author
the size of what this rule puts on the frontier is kept: nine rationales carry a
prose tradition list, five more carry one only in an account, and
`stub-traditions`' hand-maintained enumeration names twelve. That count uses the
marker phrases the record actually uses and not the single phrase the reader
searched for, which is why it is larger than the reader's six and three.

Four findings are recorded on the nodes they belong to and answered on none of
them: `unread-recommended-option` on `frontier-consistency`, `chosen-over-derived`
on `model`, `tradition-linking-cited-to-readings` on `projection`, and, on
`spec-driven-development`, the disclosure that the choice its account offers the
author between adopted and chosen over is not one this encoding can record and
will be re-worded when this node is ruled.

The pin this reading recorded, `61b6d00d141f7ec103a3adf871f595f5ae04df8a`, names
the draft the reader read and is not re-settled: this is the second reading of
this answer and the cap is reached. What that costs is on `review-cost` as
`pin-names-the-text-the-reader-read`. The apply run also emitted its two-round
warning, which counts reading sections since the last kickback and not readings
of one answer, and is the instrument defect that node records.
