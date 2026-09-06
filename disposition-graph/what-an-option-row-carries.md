---
question: What does an option's row carry at the first level?
stage: maieutic
under:
  - commons.systems/disposition-graph/alignment-page
---
## Disposition

The author, 2026-09-04, on the alignment page, queued from the sitting on author-questions:
> - most chips and the id-shaped string listed for each option shown in the agency node are not useful in the ui. Is "stands: a draft no one has confirmed" recording anything useful? For each option, list only a short text summary, a simple indicator if it is the recommended choice of the ai and with what boldness, and keep the chips that indicate support or divergence by tradition. Move AI reasoning (such as "passed over") to the details area for each option - not in a chip.

The author, 2026-09-06, answering the probe they raised on 2026-09-04, whether the `stands` chip records anything useful:

> What "stands" could represent is the prior confirmed disposition (if any). There are no confirmed dispositions currently, so we would expect to see no indication of that.

## Account

What the sitting would amend: `commons.systems/disposition-graph/alignment-page`, its answer fact, and in the recommended text the paragraph beginning "Under each fact are its options", at two sentences. "A row leads with what the option would answer, in the sentence the record holds for it, carrying its name beside that as the handle the record files it under" is what prints the id-shaped string. "Beside the sentence the row carries the option's status as the record holds it: where it came from, by its source and reference; that the recommendation adopts it, with its boldness; that it stands; that the AI holds it dominated, marked passed over with the clause saying why, in the words of the viable-options node's gloss, and still open to the author's ruling, which clears the status; that the author has ruled on it, with the response and the date...; and, for each reading that bears on it, whether the tradition supports it or it departs from the tradition" is the list of chips the author cuts to three things: the summary, the recommendation with its boldness, and the tradition. The author's words also reach the next paragraph, "One more thing sits on the recommended option's row and on no other, at the first level and not in its drill-down: the case against it", since that line is the AI's reasoning at the first level and the author sends AI reasoning down; whether "not in a chip" spares it, the case against being a line and not a chip, is the ambiguity the maieutic has to settle, and the option `case-against-in-the-drill-down` already on the answer fact of `alignment-page` is the reading that does not spare it. Whether the `stands` chip survives at all is the author's own question put back to the AI, and it is carried as a probe on `alignment-page` rather than answered here. In the implementation the change falls on the alignment page's projector in `packages/disposition/project.mjs`, `renderOption`, which writes the `choicename mono handle` span and the pills `alt-src`, `alt-adopted`, `alt-stands`, `alt-ruled` and `alt-passed` before `renderReadingChips`, and on the pill styles in `packages/disposition/alignment-template.html`.

Cascades: `commons.systems/disposition-graph/dialogue`, whose recommended text puts `source` and `ref` on every answer option, `status: passed` with its `reason` wherever the AI holds an option dominated, and the `ruling` with its response and date on the option the author chose, all of which the page renders as chips today, and whose `stands` is what the probe questions; `commons.systems/disposition-graph/viable-options`, whose gloss the passed-over chip quotes and whose model has each option carry its recommendation, its tradition relation and its confirmed choice; `commons.systems/disposition-graph/readings`, on the tradition relation the author keeps; `commons.systems/disposition-graph/progressive-disclosure`, whose two levels the split is drawn on; and `commons.systems/disposition-graph/recording`, on a recommendation that goes alone having to say that it does, which is the line the row prints when there is no case against.

The periagogic object: the published alignment page at https://claude.ai/code/artifact/6b0ef96d-c597-4b3c-9928-be8a4a679678 at `commons.systems/public/agency` and at a node carrying a passed option and a ruled one, read against the recommended texts of `alignment-page` and `dialogue`, and `renderOption` in the projector, before anything is changed.

### The parent's clause rendered while this question stands, 2026-09-05

The `choicename mono handle` span this node's account names as the locus was
struck from `renderOption` on 2026-09-05, landed on `greenfield` at `87e4b24e`,
under the author's grant of 2026-09-04. That is the parent's clause and not this
node's: `alignment-page` says the row carries the option's name nowhere, and
this node stands at the periagogic stage, where nothing on it acts. The four
pills the author's words of 2026-09-04 also reach are left as they are, because
whether they belong on the row at the first level is this node's question and
the parent's answer keeps them there until it is ruled.

### The periagoge, 2026-09-06

The periagogic object was read by the survey unit of 2026-09-05, at
`renderOption` and at the published page on `commons.systems/public/agency` and
on a node carrying a passed option and a ruled one. What it found, validated at
the loci on the main thread: the id-shaped string is gone, struck from
`renderOption` on 2026-09-05; the four pills `alt-src`, `alt-stands`,
`alt-ruled` and `alt-passed` are still rendered at the first level; and the case
against is still a first-level line on the recommended row.

It also found a contradiction inside the parent that this node's maieutic must
resolve before it can say what the row carries. `alignment-page`'s recommended
text sends three of those four pills to the option's details — "The rest of the
option's status as the record holds it goes to the option's details, where the
same words send the AI's reasoning: where it came from, by its source and
reference; that the AI holds it dominated, marked passed over with the clause
saying why ...; and that the author has ruled on it, with the response and the
date" — while the account section that node carries of the reconciliation of
2026-09-05 says the opposite, that "this answer keeps them at the first level and
sends the rest to the details". The page implements the account. The false
sentence has been withdrawn on `alignment-page`; the divergence between the page
and the fence stands, deliberately unrepaired, because this node's ruling is what
settles where those pills go.

The probe the author raised on 2026-09-04 is discharged, on this node and on the
parent that carried it. Their answer of 2026-09-06 is that `stands` could
represent the prior confirmed disposition, if any, and that with no confirmed
dispositions in the record no indication of it is expected.

That answer meets an argument the parent's recommended text makes at length, and
the meeting is this node's first maieutic question rather than something the
periagoge settles. The parent's clause reasons that where no ruling stands on the
answer fact the option keeping the standing text "is a draft no one has
confirmed", and that naming it otherwise "claims a standing the text does not
have, and it reads as the safe and ordinary choice when on an AI-drafted node
written in the author's own voice it is the least safe one available". The
author's answer does not deny that; it says the `stands` chip is not what should
carry it. The two are reconcilable and the reconciliation is a design: the chip
means a prior confirmed disposition and appears only where one exists, and the
warning that a confirmation ratifies an AI draft, which is about the node and not
about one option, is carried somewhere that is not an option's status pill.
Where that is, and whether it is on this page at all, is the question the
maieutic has to answer, and it reaches the parent's clause and not only the row.
