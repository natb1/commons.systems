---
question: What does segregation of duties say about who checks a consequential act, and what does the record take from it?
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
  - commons.systems/disposition-graph/review-model
source: Segregation of duties in accounting and banking internal control, as COSO states it in Internal Control — Integrated Framework (1992, revised 2013) and as the practice under section 404 of the Sarbanes-Oxley Act of 2002 applies it, where a consequential act requires the concurrence of a second party who did not perform the first and whose power over it comes from having no stake in its output; with the two-person concept of United States nuclear surety, under which no one person may act alone on a critical operation, usually cited to the Department of Defense directives and Air Force Instruction 91-104. Locus to be checked, the citation for the two-person concept, and whether the doctrine is as silent on the second party's competence as this reading takes it to be, since audit standards do require a competent reviewer.
bears:
  - fact: answer
    option: fable-for-both-readings
    relation: adopted
  - fact: answer
    option: conditional-by-boldness
    relation: diverged
  - node: commons.systems/disposition-graph/recording
    fact: answer
    option: per-fact-after-two-readings
    relation: adopted
---
## Answer

Supports the flat rule, and on a ground the record did not carry. The control is that a consequential act takes the concurrence of a second party who did not perform the first, and the whole of its power is independence: the second party has no stake in the output it is checking, and no part of its constitution is in the hands of the party under check. The doctrine constitutes that party by role and by independence, and says nothing about it outranking the first. What it supports here is therefore not the reader's strength but where the strength comes from.

The record takes exactly that. Under `fable-for-both-readings` the reader's strength is read from the role and from nothing on the node, the draft, or the drafter, so the party under review sets no part of what checks it; the control is satisfied at the one place the record could lose it, and this is the argument for the author's rule that stands without the author's words.

The divergence is from the rule the record carried. `conditional-by-boldness` computed the reader's strength from `boldness`, a field the drafter writes, so the reviewed party selected the strength of its own reviewer — the failure this control exists to prevent, occurring inside the record's own instrument. The rule's other triggers, the node's tier and whether a ruling on it would settle others, are facts of the record and not the drafter's to set; the divergence is on the one input that is.

What the tradition does not supply is a floor. Four eyes buys independence, and the clean context already buys it: a reading carries nothing of the invoking session and is never a fork, which is this control's requirement stated in the record's own words. So the doctrine lends no support to a reader never smaller than the drafter's, and none to a reader stronger than it; on rank it is neutral between the options and is cited here for the input alone. Its own condition is not fully met either. In an audit the second party is a different person with different incentives, where the two readings here are two contexts of one class of mind, so what the record buys is independence of framing and not the independence of interest the control was built for.

## Rationale

Read in the tradition survey of the review sitting of 2026-09-04 as the first of its readings on which model runs a reading, and named in `review-model`'s account among the six that its pass with reference to tradition owes: "segregation of duties, from internal control and the two-person concept, adopted on `fable-for-both-readings`, for the reviewer's strength read from nothing the drafter sets, and diverged from on `conditional-by-boldness`, which read it off boldness". The survey recorded the same point as its finding before the readings, that the rule the record carried cites no tradition and that this is the strongest single argument for the author's direction; the answer carries the argument in its rationale, and this reading is where the relation lives.

## Facts

### answer

The standing text is the only reading of this control the survey produced,
and no second account of what the record takes from it is on the table. What
is open is not a second reading but the fidelity the source line names,
whether the doctrine is silent on the second party's competence.

### authority

Delegated, as every reading on the record recommends, because the relation
is the AI's from its own knowledge of the sources and the author has not read
them here. The `deferred` option beside it is what the account asks for, the
reading held until the author reads the sources, and it is the author's to
take.

## Account

Minted at the recording of `review-model`'s recommendation on 2026-09-04, under the author's bootstrap grant of that day to progress the adversarial-review dispositions through the maieutic movement and reconcile them immediately, from the tradition survey of the review sitting and the pass with reference to tradition that read it, which names this reading among the six owed under that node. Validated by the AI from its own knowledge of the sources; deferred until the author reads them, and delegated if the author declines to.
### A relation added, 2026-09-04

A `bears` entry on `commons.systems/disposition-graph/recording`'s
`per-fact-after-two-readings`, adopted, added by the readings unit of the
alignment sitting of 2026-09-04 under the author's bootstrap grant of that
day. That node's account asks for "the four-eyes principle of financial
control, for a second reader before a write to the record", and its facts
prose calls it "the second pair of eyes before a write to the record". Four
eyes is the control this reading already holds, from internal control and the
two-person concept, and the answer names it in as many words, so a second node
would read one doctrine twice.
