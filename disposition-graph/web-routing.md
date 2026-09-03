---
question: Does the web-routing tradition support addressing every node of the browser?
stage: ruling
recommendation:
  class: ratified
  boldness: moderate
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

Supports. The tradition holds that everything a reader can reach has an address, that moving between things changes the address shown, that an address reopens what it names, and that addresses do not change. The browser adopts all four: a node's address is its id, written into the page's fragment as the reader moves, read back when the reader arrives by it, and stable because ids are import paths. One divergence is imposed by the host and not chosen: a page framed by a viewer can neither show its address in the viewer's own bar nor receive one through it, so until the browser is published from the implementation ref the page keeps the reader's place itself and shows the address of the node in view.

## Rationale

Recorded at the author's direction on 2026-09-03 after the address was seen not to change on navigation in the framed viewer, and tested the same day: the viewer neither passes a fragment in nor reflects one out. Validated by the AI from its own knowledge of the sources; deferred until the author reads them.


## Proposal

### Sitting on purpose, 2026-09-03

**The web-routing reading, as recorded today**

A new reading under projection, adopted, with the divergence the framed viewer imposes. Here for the ruling on the whole.

Facts: authority deferred until the author reads the sources; boldness moderate; persistence standing.

Depends on: `projection`

Proposed: the node as it stands.

Rulings open: ratify as shown; ratify with edits; defer; overrule.

### Clean-context review, 2026-09-03

Read in clean context by a subagent given the node, its ancestry, and the author's words, and nothing of the sitting. Verdict: forward to the author's ruling.

Findings:

- Answer, sentence 2: 'and that addresses do not change'. Adopted from Berners-Lee with no divergence, but namespaces in this same batch declares a shim whose liquidation is 'a directory move and a prefix rewrite of ids', which changes every address in the public graph, and the manifest already records that move as planned. Evaluation: 'an unrecorded conflict is a frontier item deferred to neither side.' Suggested edit: record the prefix rewrite as a second divergence, or state the redirect obligation it creates.
- Answer: 'a node's address is its id, written into the page's fragment as the reader moves'. Fielding's chapter 5 concerns identification of resources by URI; a fragment is resolved client-side and is not part of what a server sees, so citing Fielding for a fragment scheme is loose. Suggested edit: cite the History interface and fragment navigation for the mechanism and Fielding only for the principle.
- The node carries four sources and one relation covering all four. Readings' draft speaks of a reading's source, locus and relation in the singular; if one of the four were later diverged from, a single relation could not say so. Suggested edit: split, or state that the relation covers the group.

On the three facts: Deferred until the author reads the sources, moderate boldness, standing, is right. The facts should say that the recorded divergence is the host's and that a second, self-imposed divergence is not recorded.

Strongest counter-argument (strong): The reading adopts 'Cool URIs don't change' while the record has already declared that ids in the public graph will be rewritten by prefix when the graph moves to natb1.com, and namespaces treats that rewrite as the ordinary liquidation of a mount shim. So the record holds both that addresses are stable because ids are import paths and that ids will be rewritten wholesale, and the reading records only the divergence the host imposes, not the one the record imposes on itself. Under evaluation this is a frontier item deferred to neither side, which means the tradition is being adopted more strongly than the record can honour. Naming the second divergence, and whether a moved graph owes redirects from its old ids, is the honest form.

The session's reply: Accepted. The reading's relation records only the host's divergence and owes a second: the move of the public graph to natb1.com rewrites ids by prefix once, after which the reading binds and the old ids owe redirects, a condition the namespaces shim's liquidation should carry. Both amendments are made at the recording, and the citation of Fielding is narrowed to the principle, the fragment mechanism resting on the browser's history interface.
