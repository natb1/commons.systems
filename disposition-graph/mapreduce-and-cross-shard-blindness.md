---
question: Does MapReduce ground the partition `survey-selection` does not take, and what does that answer keep of it?
form: reading
stage: ruling
facts:
  - name: answer
    options:
      - name: as-read
        source: ai
        ref: "2026-09-07"
      - name: diverges-on-the-emit-keys-form
        source: review
        ref: "2026-09-07"
    recommends: as-read
    boldness: high
    against: "The emit-keys discipline the answer keeps is not in the paper: a reader emitting terms, quotations, citations and propositions each with a verbatim locus is the AI's transposition of a machine's key-value contract onto a reader, and the hierarchical and refine reading chains of current practice that would be its descendant carry no primary citation at all, so the half doing the most work here has the least behind it."
  - name: authority
    options:
      - name: ratified
      - name: delegated
      - name: deferred
    recommends: deferred
    boldness: moderate
    against: "The paper is the most widely read of the nine sources and its cross-shard limit is not contested, so a deferral queues a check that will confirm the reading and leaves the transposition, which is the contestable part, unchecked either way."
review:
  verdict: forward
  strength: weak
  date: 2026-09-07
  of: 0f9df9c2d0a061356c7ed88869bc6a8646927a16
  commit: 7f9b25de3b0b74095c1dad1fd76824f5b6b814c5
  against: "All six of the previous reading's findings are answered, most matching the suggested edits verbatim: the rationale/authority class agreement, the question's naming of `survey-selection` in backticks, the `source` field dropping the uncitable descendant strand into the `against` where it already did its work, the second point in `## Answer` reframed to quote the parent's own aggregate-versus-pairwise limb rather than the false whole-node claim, the boldness raised to `high` on the transposition, and the new option recording the divergence the viability assessment flagged as missing. The one item this node's own file cannot close is the sibling half of the second finding — correcting `survey-selection`'s own account text, which still (as far as this reading can see, since it is not given that node) may describe this node as diverged on `several-readers-over-a-partition` — but this node does its own part by recording in its account that the parent's entry was that reader's error and that this node has carried `adopted` on both bearings since it was minted, which is what the suggested edit asked of this node specifically."
  survey:
    date: 2026-09-07
    of: 0f9df9c2d0a061356c7ed88869bc6a8646927a16
    commit: 6611799a1dd6276691cf61f482c8e593f0234200
    text:
      question: "7f1200e3468be0874aa45cf417a84637411bd188bbc08a2b6aff4d5ee56105e4"
      answer: "9a55adefde2bbe2c5bb98de53612d813595f470d4e904334f3a6195d448c6af8"
      options: "b224fd18b14f309f7452a828eac972f496298f10fe651f2e7730da357d44e414"
      rivals: "b61284136d1f72fc45471f135514e98615d75ec17e9b2bbf06a2434cd782dd8c"
      words: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
    findings: []
    pairs:
      - with: "commons.systems/disposition-graph/acceptance-sampling-and-all-or-none"
        keys:
          - "parent:commons.systems/disposition-graph/survey-selection"
      - with: "commons.systems/disposition-graph/authority"
        keys:
          - "term:authority (defines: commons.systems/disposition-graph/authority)"
          - "term:deferred (defines: commons.systems/disposition-graph/authority)"
      - with: "commons.systems/disposition-graph/blocking-and-canopies"
        keys:
          - "parent:commons.systems/disposition-graph/survey-selection"
      - with: "commons.systems/disposition-graph/clean-context-review"
        keys:
          - "term:clean-context review (defines: commons.systems/disposition-graph/clean-context-review)"
      - with: "commons.systems/disposition-graph/delegation"
        keys:
          - "term:subagent (defines: commons.systems/disposition-graph/delegation)"
          - "term:unit (defines: commons.systems/disposition-graph/delegation)"
      - with: "commons.systems/disposition-graph/dialogue"
        keys:
          - "term:account (defines: commons.systems/disposition-graph/dialogue)"
          - "term:answer (defines: commons.systems/disposition-graph/dialogue)"
          - "term:dialogue (defines: commons.systems/disposition-graph/dialogue)"
          - "term:draft (defines: commons.systems/disposition-graph/dialogue)"
          - "term:fact (defines: commons.systems/disposition-graph/dialogue)"
          - "term:keep (defines: commons.systems/disposition-graph/dialogue)"
          - "term:recommendation (defines: commons.systems/disposition-graph/dialogue)"
          - "term:ruling (defines: commons.systems/disposition-graph/dialogue)"
          - "cites"
      - with: "commons.systems/disposition-graph/fagan-entry-criteria"
        keys:
          - "parent:commons.systems/disposition-graph/survey-selection"
      - with: "commons.systems/disposition-graph/growth"
        keys:
          - "term:boldness (defines: commons.systems/disposition-graph/growth)"
      - with: "commons.systems/disposition-graph/instruments"
        keys:
          - "term:assessment (defines: commons.systems/disposition-graph/instruments)"
          - "term:check (defines: commons.systems/disposition-graph/instruments)"
      - with: "commons.systems/disposition-graph/lint-and-the-false-positive-threshold"
        keys:
          - "parent:commons.systems/disposition-graph/survey-selection"
      - with: "commons.systems/disposition-graph/model"
        keys:
          - "term:disposition (defines: commons.systems/disposition-graph/model)"
          - "term:node (defines: commons.systems/disposition-graph/model)"
      - with: "commons.systems/disposition-graph/node"
        keys:
          - "term:answer (defines: commons.systems/disposition-graph/node)"
          - "term:form (defines: commons.systems/disposition-graph/node)"
          - "term:question (defines: commons.systems/disposition-graph/node)"
          - "term:rationale (defines: commons.systems/disposition-graph/node)"
      - with: "commons.systems/disposition-graph/projection"
        keys:
          - "term:projection (defines: commons.systems/disposition-graph/projection)"
      - with: "commons.systems/disposition-graph/readings"
        keys:
          - "term:adopted (defines: commons.systems/disposition-graph/readings)"
          - "term:chosen over (defines: commons.systems/disposition-graph/readings)"
          - "term:diverged (defines: commons.systems/disposition-graph/readings)"
          - "term:reading (defines: commons.systems/disposition-graph/readings)"
          - "term:tradition (defines: commons.systems/disposition-graph/readings)"
      - with: "commons.systems/disposition-graph/regression-test-selection"
        keys:
          - "parent:commons.systems/disposition-graph/survey-selection"
      - with: "commons.systems/disposition-graph/review"
        keys:
          - "term:review (defines: commons.systems/disposition-graph/review)"
      - with: "commons.systems/disposition-graph/survey-selection"
        keys:
          - "term:candidate pair (defines: commons.systems/disposition-graph/survey-selection)"
          - "cites"
      - with: "commons.systems/disposition-graph/tolerated-inconsistency"
        keys:
          - "parent:commons.systems/disposition-graph/survey-selection"
      - with: "commons.systems/disposition-graph/unanswered"
        keys:
          - "term:answered (defines: commons.systems/disposition-graph/unanswered)"
      - with: "commons.systems/disposition-graph/under"
        keys:
          - "term:context (defines: commons.systems/disposition-graph/under)"
          - "term:under (defines: commons.systems/disposition-graph/under)"
      - with: "commons.systems/disposition-graph/verifying-traces-and-early-cutoff"
        keys:
          - "parent:commons.systems/disposition-graph/survey-selection"
      - with: "commons.systems/disposition-graph/viable-options"
        keys:
          - "term:option (defines: commons.systems/disposition-graph/viable-options)"
          - "term:viable (defines: commons.systems/disposition-graph/viable-options)"
      - with: "commons.systems/disposition-graph/work-loop"
        keys:
          - "term:bite (defines: commons.systems/disposition-graph/work-loop)"
      - with: "commons.systems/public/agency"
        keys:
          - "term:capture (defines: commons.systems/public/agency)"
under:
  - commons.systems/disposition-graph/survey-selection
source: MapReduce, Dean and Ghemawat, OSDI 2004.
bears:
  - fact: answer
    option: several-readers-over-a-partition
    relation: adopted
  - fact: answer
    option: candidate-pairs-with-their-nominating-key
    relation: adopted
---

## Facts

### answer

`as-read` is the only reading of MapReduce on the record and it is recommended because the tradition is read here for its limit and not for its shape, which is the only way a reading can ground an option the answer did not take: both `bears` entries read adopted, one on `several-readers-over-a-partition`, the tradition's own form, which the answer is chosen over, and one on `candidate-pairs-with-their-nominating-key`, which keeps the emit-keys discipline inside the design the answer does take. Boldness high, on the transposition: that a relation between two shards is invisible to both readers is the paper's own, and cross-shard blindness is the paper's own accounting of what a shuffle exists to fix rather than a gloss on it, but the discipline of emitting keys with verbatim loci and never prose summaries, for a reader rather than a machine, is the AI's extension with nothing in the record behind it; the reason the option is not taken is an argument about this record — that the aggregate validations do not partition, that coverage's input is an absence and an absence has no shard, and that a split buys context capacity and not tokens — which any reader can check against `survey-selection`. The case against is on the fact.

#### as-read

Supports the option the answer does not take, and is read for its limit.

**AI support.** Recorded under `survey-selection` on 2026-09-07, because the draft's rationale leant on this tradition's cross-shard blindness as its reason for not partitioning the survey while carrying no reading of it, which the clean-context reading of that day named as an unrecorded divergence from `evaluation`. The tradition survey of that date, which is not part of the record, cited it at high confidence and the citation is given as it gave it; the AI validated the relation from its own knowledge of the source. Deferred, because what is queued is not the paper but the transposition of a machine's key-value contract onto a reader.

**AI divergence.** The emit-keys discipline the answer keeps is not in the paper: a reader emitting terms, quotations, citations and propositions each with a verbatim locus is the AI's transposition of a machine's key-value contract onto a reader, and the hierarchical and refine reading chains of current practice that would be its descendant carry no primary citation at all, so the half doing the most work here has the least behind it.

**Content.**

```markdown
---
question: Does MapReduce ground the partition `survey-selection` does not take, and what does that answer keep of it?
form: reading
under:
  - commons.systems/disposition-graph/survey-selection
source: MapReduce, Dean and Ghemawat, OSDI 2004.
bears:
  - fact: answer
    option: several-readers-over-a-partition
    relation: adopted
  - fact: answer
    option: candidate-pairs-with-their-nominating-key
    relation: adopted
---

## Answer

Supports the option the answer does not take, and is read for its limit. The tradition splits a corpus larger than any one reader, computes over each shard independently, and combines; its known weakness is the one that decides this node, that a relation holding between two shards is invisible to both of the readers that hold them and exists afterwards only in what they emitted. The discipline that follows is the tradition's real content here: a mapper emits keys — the terms it defined and used, the quotations it claimed, the nodes it cited, the propositions it asserted, each with its verbatim locus — and never prose summaries, because a combination taken over summaries has already lost the loci a finding must quote. Two things follow for this node. First, the option `several-readers-over-a-partition` is this tradition's shape and is written in its terms, each reader emitting structured claims with verbatim loci and a combining reader running the pairwise validations over the emitted keys; the relation to it is adoption, and it is a tradition adopted on an option the answer did not choose, which is what `chosen over` names. Second, what decides against that option is partly the tradition's own support scope and partly the record's economics, and neither is an objection to it: validations thirteen to sixteen are aggregate over the whole corpus and do not partition, as the option says in its own words, coverage's input is an absence and an absence has no shard, and a split buys context capacity and not tokens, each reader paying again for the context they share, which is the record's economics of a context window and has no counterpart in the tradition. The pairwise validations do shard, and the candidate pair is their shard, which is what the option the answer takes makes the unit. The answer keeps the other half of the tradition inside the design it does take. What crosses between one reading and the next here is keys with their loci and never a summary of what a reader thought: each candidate pair reaches the reader with the key that nominated it, the key is recorded with any finding it produced, and the block the survey leaves on a node carries the hashes, the register and the keys. The nomination itself is `blocking-and-canopies`'; what this tradition adds is the form of what is emitted, which is why the answer's accumulated state is a set of keys and a register of findings with their supports rather than a précis of what an earlier reader concluded. The condition on which the partition would be taken is stated on the option and is the tradition's own: where the brief no longer fits one reader the corpus has exceeded the reader, and the split is then the answer — in the emit-keys form, and not as a chain of summaries.
```

#### diverges-on-the-emit-keys-form

The relation on `candidate-pairs-with-their-nominating-key` is diverged rather than adopted. What a mapper emits is a key-value pair produced by a deterministic function over a record, and what the record's reader emits is terms, quotations, citations and propositions it judged worth emitting; the paper's guarantee is that every relation expressible as a key survives the shuffle, and that guarantee is void for an emitter that may simply fail to emit a key it should have, which is the failure mode a reader has and a mapper does not. The relation on `several-readers-over-a-partition` stays adopted.

**AI support.** It is the option the clean-context reading of abb15a3e found missing: the fact's own case against says the emit-keys discipline is not in the paper but the AI's transposition of a machine's contract onto a reader, and the option puts that choice on the row the author reads rather than leaving it as a caveat.

**AI divergence.** The recommended reading holds that the form of what is emitted, keys with their loci and never a summary, is the paper's discipline and is what the record keeps, the reader's fallibility being a fact about the emitter and not a departure from the form; the net relation may stay adopted with the departure in the answer, as `fagan-entry-criteria` records the same shape.

**Content.**

```markdown
---
question: Does MapReduce ground the partition `survey-selection` does not take, and what does that answer keep of it?
form: reading
under:
  - commons.systems/disposition-graph/survey-selection
source: MapReduce, Dean and Ghemawat, OSDI 2004.
bears:
  - fact: answer
    option: several-readers-over-a-partition
    relation: adopted
  - fact: answer
    option: candidate-pairs-with-their-nominating-key
    relation: adopted
---

## Answer

The relation on `candidate-pairs-with-their-nominating-key` is diverged rather than adopted. What a mapper emits is a key-value pair produced by a deterministic function over a record, and what the record's reader emits is terms, quotations, citations and propositions it judged worth emitting; the paper's guarantee is that every relation expressible as a key survives the shuffle, and that guarantee is void for an emitter that may simply fail to emit a key it should have, which is the failure mode a reader has and a mapper does not. The relation on `several-readers-over-a-partition` stays adopted.
```

### authority

Deferred, and the thing it queues is not the paper but the transposition. That a relation between two shards is invisible to both readers is the paper's own and is not in dispute; that the discipline following from it, for a reader rather than a machine, is to emit keys with verbatim loci and never prose summaries, is the AI's extension, and this node's `source` says the descendant strand it belongs to carries no primary citation. Delegating would put that extension beyond asking. Boldness moderate: the failing limbs of `class-recommendation`'s test are read off the record, and the judgement that the capture limb does not bite, a paper being openable by the author, is the AI's own. The case against is on the fact.

## Account

### Manifest

- Folded: Minted, 2026-09-07, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Clean-context review, 2026-09-07, of 1c7265a2, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Repaired after the reading of abb15a3e, 2026-09-07, at f0741490d538f17733f64bce56a14d8e122c8d34

### Clean-context re-reading, 2026-09-07, of cbff56cf

Read in clean context by a subagent given the amendment, the diff against the text the last reading pinned, and that reading's own findings, and nothing else of the sitting. Verdict: the amendment stands, forwarded to the author's ruling.

Recommended at this reading: `as-read`.

Findings:


On the facts and what they recommend: The diff leaves `recommends` unchanged on both facts (`as-read` on answer, `deferred` on authority) and `as-read` still `stands`, so no `## Recommendation` fence is warranted; it raises the answer fact's boldness from `moderate` to `high`, naming the emit-keys transposition as the reason, and adds the viable option `diverges-on-the-emit-keys-form` (source review) with the answer fact's `bears` entries left unchanged, both still `adopted`.

On the viability of the options: Every option remains viable: `as-read` is still a defensible reading, and the new option `diverges-on-the-emit-keys-form` is a genuine second reading of the paper's guarantee rather than a duplicate.

Strongest counter-argument (weak): All six of the previous reading's findings are answered, most matching the suggested edits verbatim: the rationale/authority class agreement, the question's naming of `survey-selection` in backticks, the `source` field dropping the uncitable descendant strand into the `against` where it already did its work, the second point in `## Answer` reframed to quote the parent's own aggregate-versus-pairwise limb rather than the false whole-node claim, the boldness raised to `high` on the transposition, and the new option recording the divergence the viability assessment flagged as missing. The one item this node's own file cannot close is the sibling half of the second finding — correcting `survey-selection`'s own account text, which still (as far as this reading can see, since it is not given that node) may describe this node as diverged on `several-readers-over-a-partition` — but this node does its own part by recording in its account that the parent's entry was that reader's error and that this node has carried `adopted` on both bearings since it was minted, which is what the suggested edit asked of this node specifically.

### The session's reply to the re-reading of cbff56cf, 2026-09-07

Recorded in its own entry because the apply that landed the reading carried no reply, the replies file it was given being another wave's. The parent's account entry is left as the record of its day, as this node's account says; the survey judges the pair, and the parent's own entry is on the reconciliation list as a stale claim that needs no amendment.

### Migrated to the content encoding, 2026-09-07

Written by `packages/disposition/migrate.mjs` on 2026-09-07. The legacy text of commons.systems/disposition-graph/mapreduce-and-cross-shard-blindness stands at graph commit `2b696ace1e7c610bb4c205f1356f0cf19f016af6`, and this file is its projection into the content encoding of 2026-09-07 (`commons.systems/disposition-graph/dialogue`, `an-option-carries-its-content-its-words-and-its-case`). The `## Answer` became the content of `as-read`; the `## Rationale` its `**AI support.**`; and `stands` left the answer fact. The record wrote no text of its own for `diverges-on-the-emit-keys-form`, so each carries the node as it stands with its own sentence in the answer's place: a transcription of what the option already said it would answer, and not an argument the migration wrote. Each is owed the text a sitting will give it. The draft review's pin `cbff56cfa25178c111ff32149216b9291a27c75f` is re-computed for the encoding as `006a9bcd8049f03d9f1f2280d8b55e43481b4e9c`; nothing it read changed.

### Frontier survey, 2026-09-07, of 006a9bcd

Read in clean context by a subagent given the whole graph and nothing of the sitting, judging this node's recommendation against every other node. The survey gives no verdict.

Findings:

- Redundancy (9). It carries the six-times-repeated ladder clause, "is a lower rung of the same ladder, `the-delta-survey-with-a-periodic-whole`, contained in that option and not declined, and a relation stored on the rung would project as chosen over, which `readings` derives for a tradition adopted on an option not chosen".
- Coverage (14). No survey has read this node.

Strongest counter-argument (moderate): The answer "Supports the option the answer does not take, and is read for its limit." records the tradition against `several-readers-over-a-partition`, but the limit it names applies equally to the option the answer does take: candidate pairs nominated by a key are a partition of the comparison space by another name, and a contradiction between two nodes that share no key is cross-shard blind whether the shards are readers or pairs. Read that way the tradition diverges from the recommendation rather than illuminating its rejected sibling.
