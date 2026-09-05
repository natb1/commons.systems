---
question: How is a fact's section headed on the alignment page?
stage: periagogic
under:
  - commons.systems/disposition-graph/alignment-page
---
## Disposition

The author, 2026-09-04, on the alignment page, queued from the sitting on author-questions:
> - Authority fact does not require verbose description of each authority level. Just rename section heading "Who may change an answer?" to "Authority" and hyperlink heading to authority node in the browser. Text summary for each authority option is just the name of the authority level.
>
> - The answer prose fact section doesn't need to restarte the question as its title - just give it the name of the fact: "Answer".

## Account

What the sitting would amend: `commons.systems/disposition-graph/alignment-page`, its answer fact, and in the recommended text the sentence "Each is labelled with the question it asks, in the words of the node or of the fact, because under `aspects-are-nodes` every decision is a question and a decision labelled with a category tells the author nothing about what is being asked." The author's two bullets strike both halves of it: the reserved fact is headed by its own name and not by the question of the node that defines it, and the answer fact is headed "Answer" and not by the node's question, which the column has already printed above. The heading gains something the answer does not give it today, a link to the node that defines the fact, and that half of the author's words is not met by any sentence of the recommended text; it also meets a condition that answer states elsewhere, that a metric links "to that node in the browser, which addresses every node by its id where this page has no route to one, and a node the browser does not render, one with no answer yet, is named by its id and not linked", so the sitting has to say what the heading does where the defining node is itself unanswered, as `dialogue` is. In the implementation the change falls on the alignment page's projector in `packages/disposition/project.mjs`, `factLabel`, which returns the node's own question for the answer fact and the gloss or the defining node's question for a reserved one, and `renderFact`, which prints it in `<legend class="factlbl">` with no link, and on the legend's styling in `packages/disposition/alignment-template.html`.

Cascades: `commons.systems/disposition-graph/dialogue`, whose `aspects-are-nodes` is the ground the incumbent sentence rests on and whose `defines` entries and glosses are what a heading would name and link to; `commons.systems/disposition-graph/authority`, the node the authority heading would link to; `commons.systems/disposition-graph/vocabulary-view`, on a defined term being linked to the node that defines it wherever it appears; and `commons.systems/disposition-graph/projection`, which owns the browser's address and whether an unanswered node is rendered there at all, since that is what decides whether such a heading can be a link.

The periagogic object: the published alignment page at https://claude.ai/code/artifact/6b0ef96d-c597-4b3c-9928-be8a4a679678 at the answer and authority facts of `commons.systems/public/agency`, read against the recommended text of `alignment-page`, the `defines` entries of `dialogue` and `authority`, and `factLabel` in the projector, before anything is changed.
