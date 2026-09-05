---
question: What does an option's summary say on a fact whose options are the record's own vocabulary?
stage: periagogic
under:
  - commons.systems/disposition-graph/alignment-page
depends:
  - commons.systems/disposition-graph/what-an-option-row-carries
---
## Disposition

The author, 2026-09-04, on the alignment page, queued from the sitting on author-questions:
> - Authority fact does not require verbose description of each authority level. Just rename section heading "Who may change an answer?" to "Authority" and hyperlink heading to authority node in the browser. Text summary for each authority option is just the name of the authority level.

## Account

What the sitting would amend: `commons.systems/disposition-graph/alignment-page`, its answer fact, and in the recommended text the sentence "A reserved fact's options are vocabulary rather than slugs, and their sentence is what confirming that choice would mean, in the words of the node that defines the fact where the choices are the fact's own vocabulary, and of the node's own prose on the fact where they are written per node, as persistence's are; it is projected from there and never carried by the page for itself", together with the reason given for it in the next sentence, "The authority class is the most repeated decision on the page, and rendered as the two bare words `ratified` and `delegated` it told the author nothing they did not already have to know." The author's last sentence reverses that reason for the authority fact, and the same rule governs `existence`, whose `keep` and `prune` are the other vocabulary fact, so the sitting has to say whether the answer is about `authority` alone or about vocabulary facts as a class. This question rests on `what-an-option-row-carries`, which decides that a row leads with a short text summary at all; this one says what that summary is where the option is a term. In the implementation the change falls on the alignment page's projector in `packages/disposition/project.mjs`, `optionText` and the glossary lookup it uses for a vocabulary fact's options, and on `renderOption`, which prints the returned sentence as the row's lead.

Cascades: `commons.systems/disposition-graph/dialogue`, whose recommended text says that "An option of the two facts whose options are the record's own vocabulary, `authority` and `existence`, has no subsection at all: its name is a term, and its sentence is the gloss on the defining node", and whose rule that no projection carries a sentence of its own for an option is what makes the gloss the only text available; `commons.systems/disposition-graph/authority`, which carries the glosses on ratified, delegated and deferred and whose own answer is what the verbose descriptions quote; `commons.systems/disposition-graph/vocabulary-view`, on how a defined term is presented and linked; and `commons.systems/disposition-graph/progressive-disclosure`, since the gloss the row drops has to be reachable one step down or not at all.

The periagogic object: the published alignment page at https://claude.ai/code/artifact/6b0ef96d-c597-4b3c-9928-be8a4a679678 at the authority fact of `commons.systems/public/agency` and at a node carrying an existence fact, read against the recommended texts of `alignment-page` and `dialogue`, the glosses on `authority`, and `optionText` in the projector, before anything is changed.
