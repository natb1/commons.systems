---
question: What does literate programming say about one source tangled into several artifacts, and what does the record take from it?
stage: maieutic
facts:
  - name: answer
    options:
      - name: standing
        source: ai
        ref: "2026-09-04"
    recommends: standing
    boldness: moderate
    stands: standing
  - name: authority
    options:
      - name: ratified
      - name: delegated
      - name: deferred
    recommends: delegated
    boldness: moderate
form: reading
under:
  - commons.systems/disposition-graph/review-skills
source: Donald E. Knuth, "Literate Programming", The Computer Journal 27(2) (1984), the WEB system, whose one authored source, ordered for the argument a human reads, is mechanically tangled into the program and woven into the document, so that the artifacts are outputs and never where an author works; Norman Ramsey, "Literate programming simplified", IEEE Software 11(5) (1994), for noweb; and the content reference, `conref`, of OASIS DITA's topic-based authoring, by which one paragraph appears in several documents by reference and never by copy. Locus to be checked, the DITA version at which `conref` is read here, taken as 1.0 (2005).
bears:
  - fact: answer
    option: two-skills-one-package
    relation: adopted
---
## Answer

Supports the shape the record is already in, and names the part of the recommended option that is not yet built. There is one authored source, ordered for the argument rather than for the machine, and the artifacts each consumer needs are tangled out of it mechanically; an author never works in an artifact. DITA adds the documentation case directly: a paragraph belonging in several manuals is transcluded into each by reference, so that the paragraph has one place it is written and many places it appears.

This is the record's own architecture stated by an older name. The node is the woven argument, and every projection of it — the rules directory, the browser, the alignment page, and the skills when the projector writes them — is tangled output. That is why two skills cost less here than they would in a hand-authored repository: the second file is a second output of a source that already exists, and the record's whole discipline is that outputs are not edited.

The adoption on `two-skills-one-package` is for the fragments, which are the content reference standing in where the tangler is not ready: the text the two briefs share is authored once and appears in both by reference rather than by copy, which is what DITA prescribes for a paragraph belonging to several documents. That is `conref` and not WEB, and the reading marks the difference. Knuth's point is the tangler, and a transclusion is the fallback the tradition itself offers when there is no generator yet; the record has that fallback for the briefs and has neither for the skills.

Shelved once by a constraint that has gone. Literate programming lost because maintaining a woven source cost a human author more than it saved when the readers were humans on a deadline and the tools were the author's own to build. When the tangler is a script and the reader is an agent that loads the whole file anyway, both halves of the objection invert, which is why the tradition is read here rather than remembered.

## Rationale

Read in the tradition survey of the review sitting of 2026-09-04, which marked it shelved by a pre-agent constraint, and named in `review-skills`' account among the readings its pass with reference to tradition owes: "Literate programming, Knuth, 1984, with the DITA content reference, adopted for the fragments and shelved until now by a pre-agent constraint, since a tangler that is a script inverts the cost that retired it." The `evaluation` node's rule that the second pass looks for traditions shelved under constraints that no longer hold is what puts it on the record.

## Facts

### answer

The standing text is the only reading of these sources the survey produced,
and no second account of what the record takes from them is on the table.

### authority

Delegated, as every reading on the record recommends, because the relation
is the AI's from its own knowledge of the sources and the author has not read
them here. The `deferred` option beside it is what the account asks for, the
reading held until the author reads the sources, and it is the author's to
take.

## Account

Minted at the recording of `review-skills`' recommendation on 2026-09-04, under the author's bootstrap grant of that day to progress the adversarial-review dispositions through the maieutic movement and reconcile them immediately, from the tradition survey of the review sitting and the pass with reference to tradition that read it, which names this reading among the eight owed under that node. Validated by the AI from its own knowledge of the sources; deferred until the author reads them, and delegated if the author declines to.
