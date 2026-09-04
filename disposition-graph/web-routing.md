---
question: Does the web-routing tradition support addressing every node of the browser?
stage: ruling
review:
  verdict: forward
  strength: moderate
  date: 2026-09-03
  of: b2f24269ce14ca0e05593e53ba7d04ca2a21807f
facts:
  - name: answer
    options:
      - name: standing
        source: ai
        ref: "2026-09-03"
      - name: narrow-fielding-citation
        source: review
        ref: "2026-09-03"
      - name: split-the-sources
        source: review
        ref: "2026-09-03"
      - name: divergence-as-shim
        source: review
        ref: "2026-09-03"
    recommends: standing
    boldness: moderate
    stands: standing
  - name: authority
    options:
      - name: ratified
      - name: delegated
    recommends: delegated
    boldness: moderate
form: reading
under:
  - commons.systems/disposition-graph/projection
source: Fielding, Architectural Styles and the Design of Network-based Software Architectures (2000), chapter 5, identification of resources by URI; Berners-Lee, "Cool URIs don't change" (1998); the HTML Living Standard, the History interface (pushState, replaceState, popstate) and fragment navigation; Nielsen, "URL as UI" (1999).
bears:
  - fact: answer
    option: standing
    relation: adopted
---
## Disposition

The author, 2026-09-03:
> Record reference to web app routing tradition for disposition. Edit the browser shim to reconcile the disposition.

## Answer

Supports. The tradition holds that everything a reader can reach has an address, that moving between things changes the address shown, that an address reopens what it names, and that addresses do not change. The browser adopts all four: a node's address is its id, written into the page's fragment as the reader moves, read back when the reader arrives by it, and stable because ids are import paths. One divergence is the record's own: the public graph's ids are rewritten by prefix when it moves to natb1.com, and the namespaces node's shim carries the redirect obligation that principle imposes. One divergence is imposed by the host and not chosen: a page framed by a viewer can neither show its address in the viewer's own bar nor receive one through it, so until the browser is published from the implementation ref the page keeps the reader's place itself and shows the address of the node in view.

## Rationale

Recorded at the author's direction on 2026-09-03 after the address was seen not to change on navigation in the framed viewer, and tested the same day: the viewer neither passes a fragment in nor reflects one out. Validated by the AI from its own knowledge of the sources; deferred until the author reads them.

## Facts

### answer

#### narrow-fielding-citation

The source field is rewritten so that Fielding chapter 5 is cited for the principle of identification by address only, and the fragment mechanism is cited to the HTML Living Standard's History interface and fragment navigation. A fragment is resolved client-side and is never seen by a server, so citing Fielding for a fragment scheme is loose. The session accepted the narrowing twice and the frontmatter still lists Fielding first among four sources unchanged.

#### split-the-sources

The node's four sources under one relation of adopted are split into separate readings, or the answer states that the single relation covers the group. Readings speaks of a reading's source, locus and relation in the singular, so if one of the four were later diverged from, one relation could not say so.

#### divergence-as-shim

The host's divergence, that a framed page can neither show nor receive its address so the page keeps the reader's place itself, leaves this answer and becomes part of projection's browser shim with a liquidation condition. As a clause in an answer it is a stand-in for an unmade materialization that the frontier cannot read, which transience makes a shim.

## Account

### Sitting on purpose, 2026-09-03

**The web-routing reading, as recorded today**

A new reading under projection, adopted, with the divergence the framed viewer imposes. Here for the ruling on the whole.

Facts: authority deferred until the author reads the sources; boldness moderate; persistence standing.

Depends on: `projection`

Proposed: the node as it stands.

Responses open: confirm as shown; confirm with edits; deny with feedback.

### Clean-context review, 2026-09-03

Read in clean context by a subagent given the node, its ancestry, and the author's words, and nothing of the sitting. Verdict: forward to the author's ruling.

Findings:

- Answer, sentence 2: 'and that addresses do not change'. Adopted from Berners-Lee with no divergence, but namespaces in this same batch declares a shim whose liquidation is 'a directory move and a prefix rewrite of ids', which changes every address in the public graph, and the manifest already records that move as planned. Evaluation: 'an unrecorded conflict is a frontier item deferred to neither side.' Suggested edit: record the prefix rewrite as a second divergence, or state the redirect obligation it creates.
- Answer: 'a node's address is its id, written into the page's fragment as the reader moves'. Fielding's chapter 5 concerns identification of resources by URI; a fragment is resolved client-side and is not part of what a server sees, so citing Fielding for a fragment scheme is loose. Suggested edit: cite the History interface and fragment navigation for the mechanism and Fielding only for the principle.
- The node carries four sources and one relation covering all four. Readings' draft speaks of a reading's source, locus and relation in the singular; if one of the four were later diverged from, a single relation could not say so. Suggested edit: split, or state that the relation covers the group.

On the three facts: Deferred until the author reads the sources, moderate boldness, standing, is right. The facts should say that the recorded divergence is the host's and that a second, self-imposed divergence is not recorded.

Strongest counter-argument (strong): The reading adopts 'Cool URIs don't change' while the record has already declared that ids in the public graph will be rewritten by prefix when the graph moves to natb1.com, and namespaces treats that rewrite as the ordinary liquidation of a mount shim. So the record holds both that addresses are stable because ids are import paths and that ids will be rewritten wholesale, and the reading records only the divergence the host imposes, not the one the record imposes on itself. Under evaluation this is a frontier item deferred to neither side, which means the tradition is being adopted more strongly than the record can honour. Naming the second divergence, and whether a moved graph owes redirects from its old ids, is the honest form.

The session's reply: Accepted. The reading's relation records only the host's divergence and owes a second: the move of the public graph to natb1.com rewrites ids by prefix once, after which the reading binds and the old ids owe redirects, a condition the namespaces shim's liquidation should carry. Both amendments are made at the recording, and the citation of Fielding is narrowed to the principle, the fragment mechanism resting on the browser's history interface.

### Clean-context review, 2026-09-03

Read in clean context by a subagent given the node, its ancestry, and the author's words, and nothing of the sitting. Verdict: forward to the author's ruling.

Findings:

- Answer, sentence 2: 'and that addresses do not change'. The session's reply accepted that a second divergence is owed — the public graph's move to natb1.com rewrites ids by prefix — and says 'Both amendments are made at the recording'. Neither is in the answer, and namespaces' shim liquidation still carries no redirect obligation. Suggested edit: make the amendments now, or say in the Proposal that the answer as it stands is not what is recommended.
- Answer: the citation of Fielding for a fragment scheme. The session's reply says 'the citation of Fielding is narrowed to the principle'; the frontmatter source is unchanged and still lists Fielding chapter 5 first among four.
- The node carries four sources under one 'relation: adopted'. Readings' draft speaks of a reading's source, locus and relation in the singular; if one of the four were diverged from, a single relation could not say so.
- Answer: 'until the browser is published from the implementation ref the page keeps the reader's place itself and shows the address of the node in view'. This is a stand-in for a materialization not yet made, which transience makes a shim with a liquidation condition; here it is a clause in an answer, which the frontier cannot read. The parent projection's browser shim would carry it.

On the three facts: The frontmatter recommendation (ratified, moderate) contradicts the prose Facts line, which says 'authority deferred until the author reads the sources'. For a reading the author has not read, readings requires delegated on confirmation; the frontmatter should say delegated, as the five corrected readings now do.

Strongest counter-argument (strong): The reading adopts 'Cool URIs don't change' while the record has already declared that ids in the public graph will be rewritten by prefix, and namespaces treats that rewrite as the ordinary liquidation of a mount shim. So the record holds both that addresses are stable because ids are import paths and that ids will be rewritten wholesale, and records only the divergence the host imposes, not the one the record imposes on itself. Under evaluation this is a frontier item deferred to neither side, and the session has accepted the point without yet writing it down.

The session's reply: Validated. Amended tonight: the answer records the record's own divergence, the public graph's ids rewritten by prefix when it moves, with the redirect obligation carried on namespaces' shim; the recommendation is delegated until the author reads. The narrowing of the Fielding citation and the four sources under one relation are settled at the sitting. On the counter-argument: recorded now. Stage review.

### Frontier finding, 2026-09-03

Kind: coverage.

Readings' rule is that a reading is 'ratified when the author has read the primary source ... delegated when the AI's reading stands and the author declines to review it'. Five reading nodes now carry 'recommendation: class: delegated' (the two public readings, aristotle-hexis, plato-maieutics, plato-periagoge), applying the previous round's finding. Four do not: software-factories, spec-driven-development, srs-introduction and web-routing all carry 'class: ratified' while each of their own rationales says the reading is deferred until the author reads the sources. All ten readings additionally carry the stale prose Facts line offering 'ratified if the author confirms, or delegated where the author's words delegate it', which states two classes for one stamp.

Also named: commons.systems/public/aristotle-arche-of-action, commons.systems/public/pettit-non-domination, commons.systems/disposition-graph/aristotle-hexis, commons.systems/disposition-graph/plato-maieutics, commons.systems/disposition-graph/plato-periagoge, commons.systems/disposition-graph/software-factories, commons.systems/disposition-graph/spec-driven-development, commons.systems/disposition-graph/srs-introduction, commons.systems/disposition-graph/readings.

Proposed: Readings is the survivor of the rule. The four remaining reading nodes change their recommendation class from ratified to delegated, and every reading's prose Facts line is rewritten to 'delegated on confirmation; ratified after the author's reading', which is what the rule says and what the corrected five already imply. This is a mechanical pass the session can make at the recording, but the author should not be shown four readings offering a class the record's own rule forbids.

### Re-encoding, 2026-09-03

Re-encoded on 2026-09-03 under the author's bootstrap grant on the dialogue node, against graph commit 6d21d356: the account section, formerly named the proposal, and the recommended text, formerly the draft, were renamed, and the dialogue state was written as data.
Alternatives pending, with their sources: `narrow-fielding-citation` (review, 2026-09-03); `split-the-sources` (review, 2026-09-03); `divergence-as-shim` (review, 2026-09-03); `delegated-not-ratified` (review, 2026-09-03, from commons.systems/disposition-graph/spec-driven-development).
The recommendation adopts `standing` and is pinned to the standing text as it was at that commit.
Merge analysis of the author's words: 2026-09-03, own-question: Record a reference to the web app routing tradition as disposition, and edit the browser shim to reconcile it.
Moved to other nodes as alternatives: `shim-carries-framed-viewer` on commons.systems/disposition-graph/projection.
The census unit's note: The node has an answer and no draft, so it adopts standing, and its recommendation class is already delegated as the readings rule requires. The record's own divergence, the prefix rewrite of the public graph's ids, was accepted and has been written into the answer, and namespaces' shim liquidation now carries the redirect obligation, so that item is closed rather than pending. The three alternatives are the review findings the session said would be settled at a sitting that has not happened: the Fielding narrowing, the four sources under one relation, and the host divergence that belongs in a shim. The last of those proposes a change to projection's shim, which projection does not carry, so it goes elsewhere. The author's single block is quoted more fully on projection; here it is the words that mint this reading.

### Clean-context review, 2026-09-03

Read in clean context by a subagent given the batch at the review stage and the full graph as its context, and nothing of the sitting. Verdict: forward to the author's ruling.

Findings:

- Verified applied since the last review: the answer now records the record's own divergence — 'the public graph's ids are rewritten by prefix when it moves to natb1.com, and the namespaces node's shim carries the redirect obligation that principle imposes' — and namespaces' shim carries the redirect clause. The unrecorded conflict the counter-argument named is closed on both sides.
- Frontmatter `source` still lists Fielding chapter 5 first among four sources under one `relation: adopted`. A fragment is resolved client-side and is never seen by a server, so citing Fielding for a fragment scheme is loose; the session accepted the narrowing twice and the field is unchanged. The `narrow-fielding-citation` alternative is the vehicle.
- Four sources under one relation: readings speaks of a reading's source, locus and relation in the singular, so if one of the four were later diverged from, one relation could not say so. The `split-the-sources` alternative is the vehicle and the session left it to the sitting.
- Answer, last clause: 'until the browser is published from the implementation ref the page keeps the reader's place itself and shows the address of the node in view'. This is a stand-in for a materialization not yet made, which transience makes a shim with a liquidation condition; here it is a clause in an answer that the frontier cannot read. Verified that projection's browser shim's liquidation names the publication but not this divergence. The `divergence-as-shim` alternative is the vehicle and it changes projection's shim, which projection does not carry.

On the three facts: The frontmatter recommendation (adopts standing, delegated, moderate) states one class and one value and the pin is current; delegated is the class readings' rule requires for a source the author has not read, and this node is one of the four corrected. The prose Facts line still says 'authority deferred until the author reads the sources', which names a third class beside the recommendation's. Persistence standing follows from the node's shape, though the framed-viewer clause is a shim in all but name.

Strongest counter-argument (moderate): The reading adopts 'addresses do not change' and the record then declares two exceptions to it: the public graph's prefix rewrite, now recorded, and the framed viewer's inability to show or receive an address, recorded as a clause in the answer. A principle with two live exceptions, one of which the record imposes on itself and one of which is a stand-in with no liquidation condition anything reads, is adopted more strongly than the record can honour. The honest form is a relation of diverged with both exceptions named, which is what the sibling readings' `relation-diverged` alternatives propose for the same shape.

The session's reply: Forward accepted. The Fielding narrowing and the source split stay as pending alternatives; the framed-viewer clause is accepted as a stand-in the frontier cannot read, for the author.

### Frontier finding, 2026-09-03

Kind: merge.

Four questions are each pending as the same alternative on four to six different nodes, so the author would rule one question up to six times. Verified from the frontier's alternatives lists: (i) `say-instrument-not-criterion` is pending on scope, work-loop, transience and purpose, and each entry says the same thing — that until instruments is ruled the answer says 'instrument', the term instruments actually defines, since 'criterion' is in no node's `defines` and 'criteria' is not in FRONTMATTER_KEYS; instruments owns the question and stands at the maieutic stage with `define-criterion` pending. (ii) `delegated-not-ratified` is pending on software-factories, spec-driven-development, srs-introduction and web-routing, each saying that a reading whose source the author has not read is delegated and not ratified; readings owns the rule and all four recommendations have in fact already been corrected to delegated, so four alternatives now stand for a change already made. (iii) `traditions-to-readings` is pending on materialization, validation-order, instruments and evaluation, each saying the node's prose tradition list goes to readings under the stub-traditions ruling; stub-traditions owns the enumeration and its own `regenerate-enumeration` alternative says the enumeration is incomplete and should be derived rather than maintained by hand. (iv) The same ruling appears as `deferred-rather-than-ratified` on legacy and recording, `deferred-until-ruling-quoted` on validation-order and evaluation, and `deferred-not-ratified` on review and persistence — six nodes, three names, one question: whether a node recommending ratification with no ruling quoted in it should drop to deferred instead; quotes owns that question. Under validation 15 each of these is a new answer to a question the record already asks, standing as its own alternative on a node that does not own the question.

Also named: commons.systems/disposition-graph/instruments, commons.systems/disposition-graph/readings, commons.systems/disposition-graph/stub-traditions, commons.systems/disposition-graph/quotes, commons.systems/disposition-graph/scope, commons.systems/disposition-graph/work-loop, commons.systems/disposition-graph/transience, commons.systems/disposition-graph/purpose, commons.systems/disposition-graph/software-factories, commons.systems/disposition-graph/spec-driven-development, commons.systems/disposition-graph/srs-introduction, commons.systems/disposition-graph/materialization, commons.systems/disposition-graph/validation-order, commons.systems/disposition-graph/evaluation, commons.systems/disposition-graph/legacy, commons.systems/disposition-graph/persistence, commons.systems/disposition-graph/review, commons.systems/disposition-graph/recording.

Proposed: Instruments is the survivor of the criterion vocabulary, readings of a reading's class, stub-traditions of the prose tradition lists, and quotes of what an unquoted ratified stamp becomes. Each survivor takes one alternative saying that its ruling settles the question for every node that carries the per-node entry, and each per-node alternative is then a consequence of the survivor's ruling rather than a separate ruling — which is what the record already does for the four readings, whose class was changed once and recorded four times. The four per-node families stay listed so the author can see the blast radius, but the ruling order puts the survivor first and the alignment page should say that confirming the survivor discharges them. Case (ii) is the clearest: all four recommendations already read delegated, so those four alternatives are discharged and should be struck rather than ruled.

Recorded as a pending alternative on commons.systems/disposition-graph/instruments: `one-ruling-for-the-word` (source review, 2026-09-03).

Recorded as a pending alternative on commons.systems/disposition-graph/readings: `one-ruling-for-the-reading-class` (source review, 2026-09-03).

Recorded as a pending alternative on commons.systems/disposition-graph/stub-traditions: `one-ruling-for-the-prose-lists` (source review, 2026-09-03).

Recorded as a pending alternative on commons.systems/disposition-graph/quotes: `one-ruling-for-the-unquoted-stamp` (source review, 2026-09-03).

### Alternatives discharged, 2026-09-03

At the clean-context review of 2026-09-03 the session struck the alternatives the record had already discharged: `delegated-not-ratified` dropped, the recommendation already reads delegated, as readings' rule requires.
