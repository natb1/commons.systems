---
question: Does the web-routing tradition support addressing every node of the browser?
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
## Answer

Supports. The tradition holds that everything a reader can reach has an address, that moving between things changes the address shown, that an address reopens what it names, and that addresses do not change. The browser adopts all four: a node's address is its id, written into the page's fragment as the reader moves, read back when the reader arrives by it, and stable because ids are import paths. One divergence is imposed by the host and not chosen: a page framed by a viewer can neither show its address in the viewer's own bar nor receive one through it, so until the browser is published from the implementation ref the page keeps the reader's place itself and shows the address of the node in view.

## Rationale

Recorded at the author's direction on 2026-09-03 after the address was seen not to change on navigation in the framed viewer, and tested the same day: the viewer neither passes a fragment in nor reflects one out. Validated by the AI from its own knowledge of the sources; deferred until the author reads them.
