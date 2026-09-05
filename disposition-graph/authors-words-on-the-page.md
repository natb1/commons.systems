---
question: Where does the alignment page show the author's recorded words?
stage: periagogic
under:
  - commons.systems/disposition-graph/alignment-page
depends:
  - commons.systems/disposition-graph/input-for-an-unfinished-movement
---
## Disposition

The author, 2026-09-04, on the alignment page, queued from the sitting on author-questions:
> - Do not take text input for the unfinished periagoge - that is for the periagoge session to collect. Whatever response is provided in periagoge it does not need to be played back in the alignment artifact expect as quotes supporting or refuting fact options.

## Account

What the sitting would amend: `commons.systems/disposition-graph/alignment-page`, its answer fact, and in the recommended text two places where the author's own words are played back whole. The sentence "Last, as drill-downs, the author's words and the AI's account -- except at the two stages that ask for the author's words, where what they have already said on this node comes up beside the control asking for more, open, rather than staying folded below the question it answers" is the playback the author's second sentence strikes; the clause the same words leave standing is the option drill-down's "the author's words it rests on, where its source is the author, by the reference it carries", which is already a quotation offered for or against one option and is the only form the author allows. So the question is whether the whole `## Disposition` section has any place on the page, and, where it does not, whether the words that bear on no option are reachable from it at all. This rests on `input-for-an-unfinished-movement`: the open playback exists in the recommended text only as the companion of the control that node decides, and what remains to decide here is the folded drill-down and the per-option quotation. In the implementation the change falls on the alignment page's projector in `packages/disposition/project.mjs`: `renderAsk`, which appends the `The author's words` drill-down at every later stage, `renderStageAsk`, which opens the same section at the two earlier ones, and `authorWordsFor` with `authorEntries`, which pick the entries of `## Disposition` an option's `ref` names and fall back to the whole section when the date matches nothing; and on `packages/disposition/alignment-template.html`, which styles both.

Cascades: `commons.systems/disposition-graph/quotes`, whose question is how the author's words are retained and which decides what a projection may show of them; `commons.systems/disposition-graph/dialogue`, whose `## Disposition` is "the author's words, verbatim and dated, accumulating through the dialogue" and whose option carries the `source` and `ref` by which a quotation is attached to an option, the fallback in `authorWordsFor` being the seam where that attachment fails; `commons.systems/disposition-graph/viable-options`, on what each option's record holds; and `commons.systems/disposition-graph/projection`, which decides what the browser renders of the same words.

The periagogic object: the published alignment page at https://claude.ai/code/artifact/6b0ef96d-c597-4b3c-9928-be8a4a679678 on a node with a long `## Disposition` and on an option whose source is the author, read against the recommended text of `alignment-page`, the answers of `quotes` and `dialogue`, and `renderAsk`, `renderStageAsk` and `authorWordsFor` in the projector, before anything is changed.
