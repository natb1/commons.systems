---
question: Does MapReduce ground the partition this answer does not take, and what does the answer keep of it?
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
    against: "The emit-keys discipline the answer keeps is not in the paper: a reader emitting terms, quotations, citations and propositions each with a verbatim locus is the AI's transposition of a machine's key-value contract onto a reader, and the descendant strand the source names carries no primary citation at all, so the half doing the most work here has the least behind it."
    stands: as-read
  - name: authority
    options:
      - name: ratified
      - name: delegated
      - name: deferred
    recommends: deferred
    boldness: moderate
    against: "The paper is the most widely read of the nine sources and its cross-shard limit is not contested, so a deferral queues a check that will confirm the reading and leaves the transposition, which is the contestable part, unchecked either way."
under:
  - commons.systems/disposition-graph/survey-selection
source: MapReduce, Dean and Ghemawat, OSDI 2004; the hierarchical and refine reading chains of current practice as its informal descendant, which carry no primary citation.
bears:
  - fact: answer
    option: several-readers-over-a-partition
    relation: adopted
  - fact: answer
    option: candidate-pairs-with-their-nominating-key
    relation: adopted
---
## Answer

Supports the option the answer does not take, and is read for its limit. The tradition splits a corpus larger than any one reader, computes over each shard independently, and combines; its known weakness is the one that decides this node, that a relation holding between two shards is invisible to both of the readers that hold them and exists afterwards only in what they emitted. The discipline that follows is the tradition's real content here: a mapper emits keys — the terms it defined and used, the quotations it claimed, the nodes it cited, the propositions it asserted, each with its verbatim locus — and never prose summaries, because a combination taken over summaries has already lost the loci a finding must quote. Two things follow for this node. First, the option `several-readers-over-a-partition` is this tradition's shape and is written in its terms, each reader emitting structured claims with verbatim loci and a combining reader running the pairwise validations over the emitted keys; the relation to it is adoption, and it is a tradition adopted on an option the answer did not choose, which is what `chosen over` names. Second, what decides against that option is the tradition's own support scope and not an objection to it: the validations whose object is a whole node in relation to another do not shard, coverage's input is an absence and an absence has no shard, and a split buys context capacity and not tokens, each reader paying again for the context they share. The answer keeps the other half of the tradition inside the design it does take. What crosses between one reading and the next here is keys with their loci and never a summary of what a reader thought: each candidate pair reaches the reader with the key that nominated it, the key is recorded with any finding it produced, and the block the survey leaves on a node carries the hashes, the register and the keys. The nomination itself is `blocking-and-canopies`'; what this tradition adds is the form of what is emitted, which is why the answer's accumulated state is a set of keys and a register of findings with their supports rather than a précis of what an earlier reader concluded. The condition on which the partition would be taken is stated on the option and is the tradition's own: where the brief no longer fits one reader the corpus has exceeded the reader, and the split is then the answer — in the emit-keys form, and not as a chain of summaries.

## Rationale

Recorded under `survey-selection` on 2026-09-07, because the draft's rationale leant on this tradition's cross-shard blindness as its reason for not partitioning the survey while carrying no reading of it, which the clean-context reading of that day named as an unrecorded divergence from `evaluation`. The tradition survey of that date, which is not part of the record, cited it at high confidence and the citation is given as it gave it; the AI validated the relation from its own knowledge of the source. Delegated, because the relation is the AI's reading of a source the author may check, and the author's ruling on the options it bears on is where the reading has effect.

## Facts

### answer

`as-read` is the only reading of MapReduce on the record and it is recommended because the tradition is read here for its limit and not for its shape, which is the only way a reading can ground an option the answer did not take: both `bears` entries read adopted, one on `several-readers-over-a-partition`, the tradition's own form, which the answer is chosen over, and one on `candidate-pairs-with-their-nominating-key`, which keeps the emit-keys discipline inside the design the answer does take. Boldness moderate: the tradition survey of 2026-09-07 recorded Dean and Ghemawat at high confidence, cross-shard blindness is the paper's own accounting of what a shuffle exists to fix rather than a gloss on it, and the reason the option is not taken is an argument about this record — that the whole-node validations do not shard, that coverage's input is an absence and an absence has no shard, and that a split buys context capacity and not tokens — which any reader can check against `survey-selection`. The case against is on the fact.

### authority

Deferred, and the thing it queues is not the paper but the transposition. That a relation between two shards is invisible to both readers is the paper's own and is not in dispute; that the discipline following from it, for a reader rather than a machine, is to emit keys with verbatim loci and never prose summaries, is the AI's extension, and this node's `source` says the descendant strand it belongs to carries no primary citation. Delegating would put that extension beyond asking. Boldness moderate: the failing limbs of `class-recommendation`'s test are read off the record, and the judgement that the capture limb does not bite, a paper being openable by the author, is the AI's own. The case against is on the fact.

## Account

### Minted, 2026-09-07

Surfaced by the tradition survey of 2026-09-07, which is not part of the record. The locus is the combiner's blindness and the form of what a mapper emits, not the scheduling, the fault tolerance or the data locality the tradition is usually named for, none of which the record adopts. This is one of two readings under this node that bear adopted on an option the answer does not recommend, the other being `acceptance-sampling-and-all-or-none`; in both, that pairing is what records that the record's ground for declining the design is the tradition's own account of where it stops working, and not a rejection of the tradition.
