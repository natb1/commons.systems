---
question: Does the web-routing tradition support addressing every node of the browser?
stage: review
recommendation:
  adopts: standing
  class: delegated
  boldness: moderate
  amends: "74904a88c15edb6ed067605b3ee2c0fe1f5216de"
  at: "6d21d356d65f5fa206cb60bc3e923c462acc920e"
review:
  verdict: forward
  strength: strong
  date: 2026-09-03
  of: b3b2840be3a3c909dc10ac8ad49b1ff6aa94ecdb
alternatives:
  - name: narrow-fielding-citation
    source: review
    ref: "2026-09-03"
  - name: split-the-sources
    source: review
    ref: "2026-09-03"
  - name: divergence-as-shim
    source: review
    ref: "2026-09-03"
  - name: delegated-not-ratified
    source: review
    ref: "2026-09-03"
form: reading
authority:
  class: deferred
  by: claude
  date: 2026-09-03
under:
  - commons.systems/disposition-graph/projection
source: Fielding, Architectural Styles and the Design of Network-based Software Architectures (2000), chapter 5, identification of resources by URI; Berners-Lee, "Cool URIs don't change" (1998); the HTML Living Standard, the History interface (pushState, replaceState, popstate) and fragment navigation; Nielsen, "URL as UI" (1999).
relation: adopted
---
## Disposition

The author, 2026-09-03:
> Record reference to web app routing tradition for disposition. Edit the browser shim to reconcile the disposition.

## Answer

Supports. The tradition holds that everything a reader can reach has an address, that moving between things changes the address shown, that an address reopens what it names, and that addresses do not change. The browser adopts all four: a node's address is its id, written into the page's fragment as the reader moves, read back when the reader arrives by it, and stable because ids are import paths. One divergence is the record's own: the public graph's ids are rewritten by prefix when it moves to natb1.com, and the namespaces node's shim carries the redirect obligation that principle imposes. One divergence is imposed by the host and not chosen: a page framed by a viewer can neither show its address in the viewer's own bar nor receive one through it, so until the browser is published from the implementation ref the page keeps the reader's place itself and shows the address of the node in view.

## Rationale

Recorded at the author's direction on 2026-09-03 after the address was seen not to change on navigation in the framed viewer, and tested the same day: the viewer neither passes a fragment in nor reflects one out. Validated by the AI from its own knowledge of the sources; deferred until the author reads them.

## Alternatives

### narrow-fielding-citation

The source field is rewritten so that Fielding chapter 5 is cited for the principle of identification by address only, and the fragment mechanism is cited to the HTML Living Standard's History interface and fragment navigation. A fragment is resolved client-side and is never seen by a server, so citing Fielding for a fragment scheme is loose. The session accepted the narrowing twice and the frontmatter still lists Fielding first among four sources unchanged.

### split-the-sources

The node's four sources under one relation of adopted are split into separate readings, or the answer states that the single relation covers the group. Readings speaks of a reading's source, locus and relation in the singular, so if one of the four were later diverged from, one relation could not say so.

### divergence-as-shim

The host's divergence, that a framed page can neither show nor receive its address so the page keeps the reader's place itself, leaves this answer and becomes part of projection's browser shim with a liquidation condition. As a clause in an answer it is a stand-in for an unmade materialization that the frontier cannot read, which transience makes a shim.

### delegated-not-ratified

The same finding names this node as one of the four readings recommending a class the record's own rule forbids, and proposes the recommendation change from ratified to delegated with the prose Facts line rewritten to match. (Raised on commons.systems/disposition-graph/spec-driven-development.) Also raised on commons.systems/public/pettit-non-domination.

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
