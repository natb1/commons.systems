---
question: When is the kick-back's feedback control shown, and what becomes of what is written in it?
stage: periagogic
under:
  - commons.systems/disposition-graph/alignment-page
depends:
  - commons.systems/disposition-graph/where-a-change-request-goes
---
## Disposition

The author, 2026-09-04, on the alignment page, queued from the sitting on author-questions:
> - To avoid confusion, the kickback feedback text input only needs to be displayed when the kickbox option is selected. Otherwise kickback text input is discarded.

## Account

What the sitting would amend: `commons.systems/disposition-graph/alignment-page`, its answer fact, and in the recommended text the clause of the kick-back paragraph that places the control, "its feedback control opens with it at the first level rather than in a drill-down, since the words are what a kick-back consists of and what the dialogue resumes from, where on an option the words are optional because the ruling's content is the option", together with the same clause as it is stated in the answer fact's own prose and in the option `kick-back-feedback-one-step-down`, which is the alternative already on that fact and which the author's words answer in neither direction: the author asks for a third placement, shown at the first level but only once the kick-back is chosen, where the recommendation shows it always and that option folds it always. The second sentence, that the text is otherwise discarded, is already the behaviour of the artifact and of no sentence of the record: the staging script in `packages/disposition/alignment-template.html` reads `[data-kickback-text]` only when the kick-back radio is the chosen one, so text typed and abandoned never reaches a response, and what the author read was a control offering to collect words the page would drop. This question rests on `where-a-change-request-goes`: if every change request is recorded in this one control, then hiding it until the kick-back is chosen decides where the author's only channel for a change lives, and the two answers have to be given together. In the implementation the change falls on `renderKickback` in `packages/disposition/project.mjs`, which writes the textarea and its label unconditionally, and on the template's script and styles.

Cascades: `commons.systems/disposition-graph/recording`, whose option `denial-typed-to-maieutic` types the kick-back to the movement it returns the node to and whose classification reads the author's words, so a control that is easy to miss is a movement that is easy to miss; `commons.systems/disposition-graph/unanswered`, whose third response is the denial with feedback and whose feedback "is recorded as the author's words, never as a ruling"; `commons.systems/disposition-graph/ruling-transport`, on what the staged response carries back to a session; and `commons.systems/disposition-graph/progressive-disclosure`, whose two levels are what a conditionally shown control is a third case of.

The periagogic object: the published alignment page at https://claude.ai/code/artifact/6b0ef96d-c597-4b3c-9928-be8a4a679678 at a node at the ruling stage, with the kick-back row chosen and unchosen, read against the recommended text of `alignment-page` and its option `kick-back-feedback-one-step-down`, the answers of `recording` and `unanswered`, and `renderKickback` with the template's staging script, before anything is changed.
