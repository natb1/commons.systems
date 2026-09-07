---
question: When is the kick-back's feedback control shown, and what becomes of what is written in it?
stage: periagogic
under:
  - commons.systems/disposition-graph/alignment-page
depends:
  - commons.systems/disposition-graph/where-a-change-request-goes
facts:
  - name: answer
    options:
      - name: the-control-asks-for-the-change-by-name
        source: commons.systems/disposition-graph/where-a-change-request-goes
        ref: "2026-09-06"
  - name: authority
    options:
      - name: ratified
        source: ai
        ref: "2026-09-06"
      - name: delegated
        source: ai
        ref: "2026-09-06"
      - name: deferred
        source: ai
        ref: "2026-09-06"
---
## Disposition

The author, 2026-09-04, on the alignment page, queued from the sitting on author-questions:
> - To avoid confusion, the kickback feedback text input only needs to be displayed when the kickbox option is selected. Otherwise kickback text input is discarded.

## Facts

### answer

No option is recommended yet: this node stands at the periagogic stage and its
own sitting has not been held. One option is recorded, from a sibling's sitting.

#### the-control-asks-for-the-change-by-name

The kick-back's feedback control asks for the change the author wants and not
only for what the options miss. Recorded from
`commons.systems/disposition-graph/where-a-change-request-goes`, whose answer of
2026-09-06 routes every change request to this control and therefore needs it to
say so; that answer names the requirement and does not amend the clause, because
the kick-back's marking and the wording of its control are this node's question.
A ruling here is what would make it. Against it: the control's ask is what tells
the author what the movement is for, and asking for two things in one label is
how a control stops saying either.

### authority

No recommendation yet, for the same reason.

## Account

What the sitting would amend: `commons.systems/disposition-graph/alignment-page`, its answer fact, and in the recommended text the clause of the kick-back paragraph that places the control, "its feedback control opens with it at the first level rather than in a drill-down, since the words are what a kick-back consists of and what the dialogue resumes from, where on an option the words are optional because the ruling's content is the option", together with the same clause as it is stated in the answer fact's own prose and in the option `kick-back-feedback-one-step-down`, which is the alternative already on that fact and which the author's words answer in neither direction: the author asks for a third placement, shown at the first level but only once the kick-back is chosen, where the recommendation shows it always and that option folds it always. The second sentence, that the text is otherwise discarded, is already the behaviour of the artifact and of no sentence of the record: the staging script in `packages/disposition/alignment-template.html` reads `[data-kickback-text]` only when the kick-back radio is the chosen one, so text typed and abandoned never reaches a response, and what the author read was a control offering to collect words the page would drop. This question rests on `where-a-change-request-goes`: if every change request is recorded in this one control, then hiding it until the kick-back is chosen decides where the author's only channel for a change lives, and the two answers have to be given together. In the implementation the change falls on `renderKickback` in `packages/disposition/project.mjs`, which writes the textarea and its label unconditionally, and on the template's script and styles.

Cascades: `commons.systems/disposition-graph/recording`, whose option `denial-typed-to-maieutic` types the kick-back to the movement it returns the node to and whose classification reads the author's words, so a control that is easy to miss is a movement that is easy to miss; `commons.systems/disposition-graph/unanswered`, whose third response is the denial with feedback and whose feedback "is recorded as the author's words, never as a ruling"; `commons.systems/disposition-graph/ruling-transport`, on what the staged response carries back to a session; and `commons.systems/disposition-graph/progressive-disclosure`, whose two levels are what a conditionally shown control is a third case of.

The periagogic object: the published alignment page at https://claude.ai/code/artifact/6b0ef96d-c597-4b3c-9928-be8a4a679678 at a node at the ruling stage, with the kick-back row chosen and unchosen, read against the recommended text of `alignment-page` and its option `kick-back-feedback-one-step-down`, the answers of `recording` and `unanswered`, and `renderKickback` with the template's staging script, before anything is changed.

### What the page does with abandoned kick-back text, 2026-09-05

The account above says of the staging script that it "reads
`[data-kickback-text]` only when the kick-back radio is the chosen one, so text
typed and abandoned never reaches a response". The periagogic survey of
2026-09-05 found that true in one case and false in the other, and the sentence
is corrected by this one.

Where another option on the same fact is chosen, the script reads that option's
own control and the kick-back text is dropped, which is the behaviour the
sentence describes. Where no option is chosen at all, `alReadFacts` in
`packages/disposition/alignment-template.html` takes a different branch: it
collects every non-empty textarea in the fieldset and stages the first of them,
on the reasoning its own comment gives, that a half-finished response should
survive the next keystroke. Kick-back words typed with no radio chosen are
therefore staged as an option of `null` with `kickback` false, and carried into
the launch instruction as "no option chosen" followed by the words, not as a
kick-back at all. So the words are neither discarded nor recorded as what they
are.

Whether that is a defect of the instrument or a case the answer must provide for
is this node's question and is not settled here: the author's words say the text
is discarded, the script's comment says a draft should survive, and the two meet
only in the case neither of them names. Recorded before the periagoge, so that
the author reads the page knowing what it does with what they type.

### An option recorded from a sibling's sitting, 2026-09-06

`where-a-change-request-goes` recommends that every request to change what is
recommended go to this control, on the fact it bears on. Its reading of
2026-09-06 found that its draft had also widened this control's ask inside a
proposed amendment to `alignment-page`, which reaches a clause this node owns and
which that node had itself declined to amend elsewhere in the same draft. The
requirement is recorded here as an option instead, so that a ruling on the
routing does not carry a ruling on this control's wording with it.
