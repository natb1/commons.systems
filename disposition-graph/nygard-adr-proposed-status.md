---
question: What does the architecture decision record, which the author's own criterion invokes, settle about a chosen-but-not-final status, and what can it not reach?
stage: maieutic
facts:
  - name: answer
    options:
      - name: standing
        source: ai
        ref: "2026-09-09"
    recommends: standing
    boldness: moderate
  - name: authority
    options:
      - name: ratified
      - name: delegated
      - name: deferred
    recommends: delegated
    boldness: moderate
review:
  survey:
    date: 2026-09-09
    commit: 7eb63405f8cb47eeeb97bf86f5a5a87948c0efbb
    text:
      question: "0daf5368def6471a6add50ae7149e528a418037af3172958b8943b5b9763d10c"
      answer: "89c42d16109d7e2826f53e13780fd4ca00285f43aa5a895105245f028c795ff2"
      options: "85751ac8b5fa63781ddcb01c31f7cda7e023ce76c632f00044d83e8d5cdb99de"
      rivals: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
      words: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
form: reading
under:
  - commons.systems/disposition-graph/what-an-option-row-carries
source: >-
  Michael Nygard, "Documenting Architecture Decisions", 15 November 2011,
  Cognitect blog, the "Status" and "Consequences" sections. The four sentences
  quoted were verified verbatim on 2026-09-09 against
  cognitect.com/blog/2011/11/15/documenting-architecture-decisions.
bears:
  - fact: answer
    option: five-marks-and-the-two-the-author-added
    relation: adopted
  - node: commons.systems/disposition-graph/viable-options
    fact: answer
    option: an-option-carries-a-selection-per-party
    relation: diverged
---

## Facts

### answer

The standing text is the only reading of this tradition the tradition survey of
2026-09-09 produced, and no second account of what the record takes from it is on
the table.

#### standing

The tradition the author's own criterion invokes, which settles that a decision may
stand as chosen and not yet binding, and which cannot reach the question of how
such a standing is shown.

**AI support.** Recorded in the tradition survey of 2026-09-09 on
`what-an-option-row-carries`, which found it the direct precedent for a
chosen-but-not-final status and the source of the survey's sharpest structural
finding about the reach of the author's criterion.

**AI divergence.** The same tradition licenses one status value at a time and not
five simultaneous marks, so it diverges from `viable-options`' selection per party
while it supports the retention this node's recommendation carries. Both relations
are recorded, on the options they each bear on.

**Content.**

```markdown
---
question: What does the architecture decision record, which the author's own criterion invokes, settle about a chosen-but-not-final status, and what can it not reach?
form: reading
under:
  - commons.systems/disposition-graph/what-an-option-row-carries
source: >-
  Michael Nygard, "Documenting Architecture Decisions", 15 November 2011,
  Cognitect blog, the "Status" and "Consequences" sections. The four sentences
  quoted were verified verbatim on 2026-09-09 against
  cognitect.com/blog/2011/11/15/documenting-architecture-decisions.
bears:
  - fact: answer
    option: five-marks-and-the-two-the-author-added
    relation: adopted
  - node: commons.systems/disposition-graph/viable-options
    fact: answer
    option: an-option-carries-a-selection-per-party
    relation: diverged
---

## Answer

One page per decision, in prose, with a status field that states where the decision
stands and from which nothing is derived. "A decision may be 'proposed' if the
project stakeholders haven't agreed with it yet, or 'accepted' once it is agreed."
Reversed decisions are kept rather than deleted: "If a decision is reversed, we will
keep the old one around, but mark it as superseded. (It's still relevant to know
that it was the decision, but is no longer the decision.)" The register the page is
written in is stated too — "We will write each ADR as if it is a conversation with a
future developer" — and the consequences section is required to be complete rather
than favourable: "This section describes the resulting context, after applying the
decision. All consequences should be listed here, not just the 'positive' ones."

Two things the record takes. The first is that `proposed` is exactly a decision made
and not yet binding, distinguished from `accepted` by one word on the face of the
document, so a chosen-but-not-final status is a settled instrument in the tradition
the author's criterion names and not an invention of this sitting. The second is
that the reversed decision is kept, marked, and linked to its replacement, which is
this record's own rule for a passed-over option arrived at independently.

The finding the sitting should not miss is about the reach of the criterion rather
than its content. Nygard's ADR settles retention and says nothing whatever about
presentation, because it has no presentation problem: one decision per page, no
rows, no marks, no per-party attribution at all. The tradition never met the density
question because it never put more than one status on one line. So an ADR criterion
does not merely leave the presentation question open — it cannot reach it, the form
having nothing there to settle. A reading that took the criterion to settle
presentation would be taking an answer from a tradition that was never asked.

And there is a counter drawn from the same tradition the criterion invokes. Nygard's
status field holds exactly one value at a time. Proposed, accepted, deprecated,
superseded: a decision is in one of them, and the field answers where the decision
stands in a word. Marks that are simultaneous and orthogonal make an option
author-confirmed and AI-recommended and tradition-supported and chosen by two named
experts all at once, and nothing in the ADR tradition licenses that. The single
clean thing the tradition achieved, one word that resolves an item's standing, is
exactly what a multi-mark row cannot do. If the criterion is what an ADR would keep,
an ADR keeps the alternatives and does not keep parallel marks.
```

### authority

Delegated. Of `class-recommendation`'s three limbs none is met: the relation this
node records is cheap to restate and cheap to withdraw, so being wrong is neither
expensive nor irreversible; and the party the answer would check is not the party
setting it, since what the node holds is what a source outside the record says.
Delegated is the residual, and it is what the class rule gives where no limb is
found.

Moderate boldness: the residual is reached by finding no limb, and the finding that
no limb is met rests on this reading being a characterisation of a source rather
than a decision about the record.

## Account

Minted on 2026-09-09 from the tradition survey of that day on
`what-an-option-row-carries`, run under the author's bootstrap grant of
2026-09-08. The `### authority` subsection states the class rule rather than the
census forty-six reading nodes carry, for the reason `qoc-design-space-analysis`'s
account gives.

This reading bears in two directions and the record says why rather than letting the
split look like an inconsistency. On `what-an-option-row-carries` it adopts, because
what the tradition settles — retention of the alternative and a status for a
decision made and not yet binding — is what that node's recommendation carries. On
`viable-options`' `an-option-carries-a-selection-per-party` it diverges, because a
selection per party is many simultaneous values where the tradition holds exactly
one, and the divergence is with the tradition the author's own criterion invoked. It
is put on the option it actually bears on rather than folded into the parent, so
that a reader of `viable-options` meets it there.

The reach finding is the one to carry forward and it is not a criticism of the
author's criterion. The criterion asked what an ADR would keep, and the answer is
that an ADR keeps the alternatives; it is only the further inference, that an ADR
therefore settles how the kept alternatives are shown, that the form cannot support.
That distinction is recorded because the criterion will be read again, and a reader
who takes it to have settled presentation will be taking an answer the tradition
never gave.
