---
question: Does the alignment page take the author's words for a movement it is not running?
stage: periagogic
under:
  - commons.systems/disposition-graph/alignment-page
---
## Disposition

The author, 2026-09-04, on the alignment page, queued from the sitting on author-questions:
> - Do not take text input for the unfinished periagoge - that is for the periagoge session to collect. Whatever response is provided in periagoge it does not need to be played back in the alignment artifact expect as quotes supporting or refuting fact options.

## Account

What the sitting would amend: `commons.systems/disposition-graph/alignment-page`, its answer fact, and in the recommended text the paragraph that opens "The stage is the first thing the column says of the ruling", whose clause "at the periagogic stage the ask is the author's own account of the ground and the free-text control for it leads; at the maieutic stage it is the author's intention" is what puts the control on the page, and with it the clause "Where the stage asks for the author's words and the node carries none, the column says that in as many words rather than rendering an empty space", which exists only to caption that control. The author's words strike the periagogic case by name and leave open whether the maieutic control goes with it, since the same sentence places both and the author named one; that is the first thing the periagoge on this node has to settle. In the implementation the change falls on the alignment page's projector in `packages/disposition/project.mjs`, `renderStageAsk` and the `STAGE_ASK` table it reads, which write the `words-note` textarea and open the author's words beside it, and on `packages/disposition/alignment-template.html`, whose staging script reads `[data-words]` into the response it records to the page's database.

Cascades: `commons.systems/disposition-graph/recording`, which says which movement collects the author's words and how a response given in prose is classified; `commons.systems/disposition-graph/unanswered`, whose three responses are all the ruling stage's, so a control at an earlier stage collects something that is not a response at all; `commons.systems/disposition-graph/transience` and `commons.systems/disposition-graph/ruling-transport`, on whether a page's database may hold the author's words even as a buffer, which is what the control fills; `commons.systems/disposition-graph/author-questions`, whose answer already puts the asking of the maieutic movement in the alignment session and not on the page, "Where they are asked is the maieutic session and not the alignment page", and which the author's words here extend from probes to the movement's own collection; `commons.systems/disposition-graph/growth`, where the periagogic conduct of one probe per turn is written; and this node's own parent again, for the stage chip's two controls, `/align <the node's id>`, which are the route the author's words say the periagoge is collected by.

The periagogic object: the published alignment page at https://claude.ai/code/artifact/6b0ef96d-c597-4b3c-9928-be8a4a679678 at a node standing at the periagogic and at the maieutic stage, read against the recommended text of `alignment-page`, the answers of `recording`, `unanswered` and `author-questions`, and `renderStageAsk` in the projector, before anything is changed.
