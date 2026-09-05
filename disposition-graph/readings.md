---
question: How are references to tradition recorded?
stage: review
review:
  verdict: forward
  strength: moderate
  date: 2026-09-05
  of: 61b6d00d141f7ec103a3adf871f595f5ae04df8a
  against: "The per-option relation binds a tradition's verdict to option names, which are the AI's handles and move under it: the AI adds, renames and composes options freely, and the record did so this week, composing five clauses on dialogue into `every-part-in-the-record` while the readings under dialogue stayed adopted on the clauses, so the option the author is asked to confirm shows no tradition beside it and the derived \"what tradition says\" is sparsest exactly where the ruling is taken. The node-level relation survived every re-composition because it bound the reading to the answer, which is the unit the author confirms. The validator checks that a `bears` entry resolves and nothing checks that a recommended option has been read against the traditions its rivals were, so a projection can show a bare recommended option beside a well-read rival and imply the tradition is against it. The reply available is that a reading may carry several entries and the session re-points them, as pareto-frontier gained a second entry; but that duty falls on every move of a recommendation, which the AI may make freely on a delegated node, and the answer states neither the duty nor a check."
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

As readings under the node that refers, and traditions they refer to. A tradition is a mount: a philosophical tradition, a body of research, or another repository, which could be a disposition graph of its own with its own archē and its own readings, and where it lives until it is articulated, carrying the name it defines and its primary references, is the traditions-home node's question; until that is ruled a reading names its tradition in its source alone, and the tradition node is owed. A reading sits under one node it bears on and may bear on the options of any node, naming the node wherever it is not the parent; it names the tradition it reads, its sources and loci, and what it bears on: for each option of a fact that the tradition speaks to, adopted, where the tradition supports the option, or diverged, where the option departs from it and the reading's own answer says why. A move of a recommendation re-points the readings that bear on the option it leaves, and a recommended option that no reading has been read against, beside a rival one has, is a finding of the review. A tradition adopted on an option not chosen is what chosen over names, and it is derived and never stored; the option's readings are the derived inverse of what the readings bear on. A reading has a class like any node, read from the rulings on its own facts: ratified when the author has read the primary source or understands the mounted graph and confirms the relations, delegated when the AI's reading stands and the author declines to review it, deferred when the author accepts it for now and queues the primary reading. Deferred reading is recursive: one source leads to another, and a reading may sit under a reading. A reading whose verdict changes on re-reading is a re-grasp trigger for the node it grounds, not an automatic failure of it. Many questions that read one tradition are many readings naming that tradition, and the tradition's page shows every reading that cites it, as each option shows every reading that bears on it. Prose reaches a tradition through the name it defines, and the rationale of a node never repeats its readings.

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

The same finding proposes that readings' facts say the remedy's enumeration is incomplete, so the author knows the size of what ratifying the rule puts on the frontier; readings' standing answer rests its rule that a rationale never repeats its readings on that enumeration being the remedy. (Raised on commons.systems/disposition-graph/audience.)

#### one-ruling-for-the-reading-class

Passed over on 2026-09-05: the four entries it would strike went in the re-encoding of 2026-09-04, no node carries an option of that name, and the class rule the answer states covers every reading, so it had nothing left to discharge. As raised: readings' answer says that the class rule it states governs every reading node without each carrying its own alternative for it. Verified that all four nodes still carrying a `delegated-not-ratified` alternative — software-factories, spec-driven-development, srs-introduction, web-routing — already recommend delegated, so those four entries stand for a change the record has made and would put a settled question in front of the author four times. On this alternative the four entries are struck as discharged and readings' answer says that a reading's class follows from whether the author has read the source, so no reading needs an alternative to say it; it is on the table because the record currently carries four pending rulings on a rule it has already applied.

#### hold-for-traditions-home

Readings says on the node that its tradition-as-mount rule rests on traditions-home, which is unruled, and is not confirmed before it. Measured on 2026-09-05: readings stands at review and traditions-home at ruling with four options, recommending `one-traditions-graph`, and the manifest carries no traditions graph; the answer now cites traditions-home for where a tradition lives rather than stating it, and names it in `depends`, which is this option's ask. It is on the table because frontier-consistency requires a node not to rest silently on unruled ground and because the placement finding of 2026-09-03 proposed exactly this for readings and recorded an alternative on every other node it named but this one.

#### relation-per-option

A reading stays a node under one node it bears on, with its own class, and its relation attaches to the options of the fact it bears on rather than to the answer: adopted on the options the tradition supports, diverged on those it contradicts, so that "chosen over" becomes a tradition adopted on an option not chosen. The tradition's page still shows every reading that cites it, and the projections show on each option what tradition says. Raised on commons.systems/disposition-graph/viable-options, from the author's words of 2026-09-04 recorded there.

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

After the clean-context reading of 2026-09-05, whose findings the session validated. Each fact opens with its reason and carries its case against. The words of 2026-09-02 are a disposition and the rationale names them so. The answer says a reading sits under one node it bears on and may bear on the options of any node, naming the node wherever it is not the parent, with sources and loci plural, since nineteen readings bear on nodes other than their parent. Where a tradition lives is cited to the traditions-home node, which stands at ruling behind this node and is named in `depends`; until it is ruled a reading names its tradition in its source alone. The option subsections are re-measured at this landing and dated. `one-ruling-for-the-reading-class` is passed over with its reason. The sentence of 2026-09-04 that raised `relation-per-option` is quoted under Disposition with the pointer to the words in full. The answer names the reading's own answer as the home of a divergence's why, and meets the reading's counter-argument, that option names move under the relation, with the duty to re-point on every move and the review's finding where a recommended option stands unread. The srs-introduction fence, which still carried the node-level relation the reader rejects, now carries its `bears` entry and returns to review. Stage review for the re-read.
