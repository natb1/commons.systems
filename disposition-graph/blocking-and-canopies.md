---
question: Do blocking and canopies ground the candidate pairs, and where does the answer depart from them?
form: reading
stage: review
facts:
  - name: answer
    options:
      - name: as-read
        source: ai
        ref: "2026-09-07"
    recommends: as-read
    boldness: moderate
    stands: as-read
  - name: authority
    options:
      - name: ratified
      - name: delegated
      - name: deferred
    recommends: delegated
    boldness: moderate
under:
  - commons.systems/disposition-graph/survey-selection
source: Fellegi and Sunter, A theory for record linkage, JASA 64(328), 1969, on blocking; McCallum, Nigam and Ungar, Efficient clustering of high-dimensional data sets with application to reference matching, KDD 2000, on canopies.
bears:
  - fact: answer
    option: candidate-pairs-with-their-nominating-key
    relation: adopted
  - fact: answer
    option: several-readers-over-a-partition
    relation: diverged
---
## Answer

Supports as nomination and diverges as partition. The tradition holds that when an expensive comparator cannot be run over every pair of a corpus, cheap keys, unioned, propose the pairs it is spent on: a blocking key groups records that agree on a cheap feature, a canopy is the same with an overlapping and approximate grouping, and pairs sharing no key are never compared. The answer adopts the nomination whole, a defined term shared, an entry of the author's words referenced on both, a citation, a shared parent and near-duplicate resemblance being the keys, each pair handed to the reader with the key that nominated it. It diverges on the partition: in record linkage a pair no block or canopy contains is never compared, because the corpus is too large for anything else; here every node stays readable, the pair list orders the reader's attention rather than bounding it, and a finding on a pair no key nominated is the one worth most. The divergence is the reason the several-readers option is not adopted: a partition is what makes a canopy a canopy, and at this size a key's value is telling one reader where to look, not making the problem tractable for several.

## Rationale

Recorded in the maieutic movement on `survey-selection`, 2026-09-07, as the tradition pass that node's evaluation requires, from the tradition survey of that day. Validated by the AI from its own knowledge of the sources; delegated because the relation is the AI's reading of a source the author may check, and the author's ruling on the option it bears on is where the reading has effect.

## Account

### Minted, 2026-09-07

Surfaced by the tradition survey of 2026-09-07, which is not part of the record. The tradition is read for its nomination and the record departs from it on the partition, which is where the two options it bears on divide.
