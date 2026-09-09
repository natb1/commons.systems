---
question: Is the rationale the prose of the under edge?
stage: ruling
review:
  verdict: forward
  strength: weak
  date: 2026-09-03
  of: dcef237c051b8b1ca92ca7e6baf8189f0b0983a0
  against: "Option 2, a because clause on each under entry, is cheap and would put the refinement in structure exactly where the two questions do not show it — the case the recommendation leaves to a convention nothing checks. Toulmin separates warrant from backing, but a warrant is still written down; the recommendation writes it down only sometimes and only in prose, so the projector can never show why a node hangs where it does, which is the navigation the author asked for when they asked for cites to be projected. Against it, a clause on every edge will be filled with restatements of the two questions in the common case."
  survey:
    date: 2026-09-09
    of: 23e4fb08cc7ad832c5985f15b8a1b2ba96e50ba0
    commit: 7eb63405f8cb47eeeb97bf86f5a5a87948c0efbb
    text:
      question: "d5910dbb5178b4a8c6ef612fd4deed099345cffc816f04b70d7f9fb579cf6d6e"
      answer: "facf9f1128355c5357de2c80f1843406fcabb5853d56a60b75bff5179c98ca00"
      options: "c2dc20b350f4afe3323f6db0ec56a262a859639ff506c4b05d1c49ce10a44833"
      rivals: "1fa748781ac593095bb8120a966c83470717bfe23f57a402046b027797763aff"
      words: "cf698faadfae578977634eab9216ec9442ec9d3a2172acd12d14b03a74c25e3d"
facts:
  - name: answer
    options:
      - name: rationale-stays-with-node
        source: ai
        ref: "2026-09-03"
      - name: because-clause-on-edge
        source: ai
        ref: "2026-09-03"
      - name: rationale-on-edge
        source: ai
        ref: "2026-09-03"
      - name: drop-convention-clause
        source: review
        ref: "2026-09-03"
      - name: disclose-unanswered-parent
        source: review
        ref: "2026-09-03"
      - name: rationale-as-the-edge-prose
        source: author
        ref: "2026-09-03"
        supports:
          - words/2026-09-03/69
    recommends: rationale-stays-with-node
    boldness: moderate
  - name: authority
    options:
      - name: ratified
      - name: delegated
      - name: deferred
    recommends: ratified
    boldness: moderate
under:
  - commons.systems/disposition-graph/under
---

## Facts

### answer

#### rationale-stays-with-node

The recommended option keeps the rationale as the node's own, why this answer stands, with the under edge carrying no prose; where a refinement is not evident from the two questions side by side, the rationale's first sentence says so. It rests on the separation of the warrant of an inference from the backing of a claim, on the observation that several rationales do not stem from the parent at all, and on the fact that a node with two parents would need two edge rationales but has one answer. It is the only option that is not a schema change.

**AI support.** Two justifications were being run together: the warrant of the refinement and the backing of the claim, which Toulmin's layout keeps apart and which this record keeps apart the same way, the edge holding the first and the rationale the second. The rationale does not always stem from the parent: the node node's rationale is about the decidability of scope and the persistence node's about concurrency, neither about the model node they sit under, so binding it to the edge would misdescribe most of the record. The author, 2026-09-03, asked whether the rationale always stems from the node a node is under and whether it should therefore be the prose property of the under edge: it does not always, and it should not.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: Is the rationale the prose of the under edge?
form: rule
under:
  - commons.systems/disposition-graph/under
---
## Answer

No. The rationale is the node's own: why this answer stands, citing its readings and evidence and weighing the alternatives it rejected. Why the question exists is the other justification, the refinement that the under edge records, and the edge carries it without prose because it is usually evident from the parent's question and the child's read side by side. Where it is not evident, the rationale's first sentence says why the question hangs where it does. A node may refine more than one question but has one answer, so it has one rationale, which no single edge could hold.
```

#### because-clause-on-edge

Give each under entry a because clause and reserve the rationale for the answer, a schema change. The reviews' counter-argument backs it: it puts the refinement in structure exactly where the two questions do not show it, which is the case the recommended option leaves to a convention, so the projector can show why a node hangs where it does.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** Against it, a clause on every edge will be filled with restatements of the two questions in the common case, which is the drift the record resists elsewhere.

**Content.**

```markdown
---
question: Is the rationale the prose of the under edge?
form: rule
under:
  - commons.systems/disposition-graph/under
---
## Answer

Give each under entry a because clause and reserve the rationale for the answer, a schema change. The reviews' counter-argument backs it: it puts the refinement in structure exactly where the two questions do not show it, which is the case the recommended option leaves to a convention, so the projector can show why a node hangs where it does.
```

#### rationale-on-edge

Move the whole rationale onto the under edge, making it the prose property of the edge as the author's question asks, a schema change of high boldness. It is the strongest reading of the author's words and the one the node's own analysis argues against, since why this question exists and why this answer stands are two justifications and only the first belongs to the edge.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: Is the rationale the prose of the under edge?
form: rule
under:
  - commons.systems/disposition-graph/under
---
## Answer

Move the whole rationale onto the under edge, making it the prose property of the edge as the author's question asks, a schema change of high boldness. It is the strongest reading of the author's words and the one the node's own analysis argues against, since why this question exists and why this answer stands are two justifications and only the first belongs to the edge.
```

#### drop-convention-clause

Both reviews find the recommended option's second clause, that where a refinement is not evident the rationale's first sentence says so, to be a convention with no criterion and nothing to check it, and the finding is recorded as unchanged since the previous review. The candidate is the recommended option with that clause dropped, or with it made a validator rule so that it can fail.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: Is the rationale the prose of the under edge?
form: rule
under:
  - commons.systems/disposition-graph/under
---
## Answer

Both reviews find the recommended option's second clause, that where a refinement is not evident the rationale's first sentence says so, to be a convention with no criterion and nothing to check it, and the finding is recorded as unchanged since the previous review. The candidate is the recommended option with that clause dropped, or with it made a validator rule so that it can fail.
```

#### disclose-unanswered-parent

The placement finding of 2026-09-03: rationale-edge stands at the ruling stage under the `under` node, which is at the maieutic stage with no draft and whose own account says its text is drafted only after tier and two other questions are ruled, one of which was kicked back with its recommendation withdrawn. This alternative adds one clause saying its parent is unanswered, which frontier-consistency requires be said, so that a ruling-stage node does not silently rest on maieutic ground; the finding also asks that rationale-edge be ruled before under is drafted. Raised on commons.systems/disposition-graph/namespaces, commons.systems/disposition-graph/traditions-home, commons.systems/disposition-graph/under.

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: Is the rationale the prose of the under edge?
form: rule
under:
  - commons.systems/disposition-graph/under
---
## Answer

The placement finding of 2026-09-03: rationale-edge stands at the ruling stage under the `under` node, which is at the maieutic stage with no draft and whose own account says its text is drafted only after tier and two other questions are ruled, one of which was kicked back with its recommendation withdrawn. This alternative adds one clause saying its parent is unanswered, which frontier-consistency requires be said, so that a ruling-stage node does not silently rest on maieutic ground; the finding also asks that rationale-edge be ruled before under is drafted. Raised on commons.systems/disposition-graph/namespaces, commons.systems/disposition-graph/traditions-home, commons.systems/disposition-graph/under.
```

#### rationale-as-the-edge-prose

The author's words carried here ask whether the rationale should be the prose property of the under edge, on the ground that under already says a parent is found by asking why the question exists. Rationale-edge carries the same words and offers three options, but its recommendation adopts the opposite, keeping the rationale as the node's own with no prose on the edge; the author's own leaning corresponds to its second and third options. (Raised on commons.systems/disposition-graph/under.)

**AI support.** The record wrote no case for this option; its support is owed.

**AI divergence.** The record wrote no case against this option; its divergence is owed.

**Content.**

```markdown
---
question: Is the rationale the prose of the under edge?
form: rule
under:
  - commons.systems/disposition-graph/under
---
## Answer

The author's words carried here ask whether the rationale should be the prose property of the under edge, on the ground that under already says a parent is found by asking why the question exists. Rationale-edge carries the same words and offers three options, but its recommendation adopts the opposite, keeping the rationale as the node's own with no prose on the edge; the author's own leaning corresponds to its second and third options. (Raised on commons.systems/disposition-graph/under.)
```

## Account

### Manifest

- Folded: Sitting on purpose, 2026-09-03, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Clean-context review, 2026-09-03, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Clean-context review, 2026-09-03, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Frontier finding, 2026-09-03, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Frontier finding, 2026-09-03, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Re-encoding, 2026-09-03, at f0741490d538f17733f64bce56a14d8e122c8d34
- Folded: Alternatives merged, 2026-09-03, at f0741490d538f17733f64bce56a14d8e122c8d34

### Clean-context review, 2026-09-03

Read in clean context by a subagent given the batch at the review stage and the full graph as its context, and nothing of the sitting. Verdict: forward to the author's ruling.

Findings:

- The node stands at the review stage under `under`, which is at the maieutic stage with no drafted text and whose own account plans a draft 'after q14, q15, and q16 are ruled' — one of which, tier, was kicked back with its recommendation withdrawn, so under cannot be drafted as planned. Frontier-consistency's validation 13 requires that no node resting on periagogic or maieutic ground do so without saying so; the fence says nothing. The `disclose-unanswered-parent` alternative is the vehicle.
- Recommendation fence, Answer, second clause: 'Where it is not evident, the rationale's first sentence says why the question hangs where it does.' A convention with no criterion and nothing to check it, raised by both readings and unchanged. The `drop-convention-clause` alternative offers both branches — strike it, or make it a validator rule so it can fail.
- Recommendation fence, Rationale: it quotes the author's question with its date, which makes this one of only three fences in the batch carrying `class: ratified` that quotes a ruling at all. That is the shape the other eight should follow.
- The author's own leaning in the quoted words runs toward the options the recommendation rejects: 'does it make sense to make the rationale the prose property of the under edge?' The `rationale-as-the-edge-prose` alternative records that, sourced to the author, and the fence's rationale answers it in one clause ('it does not always, and it should not'). The author is being told their own leaning was considered and rejected, which is right, and the fence should say which of the three options the leaning corresponds to.

On the three facts: The frontmatter recommendation (adopts rationale-stays-with-node, ratified, moderate) states one class and one value and the pin is current, and the option's own facts correctly distinguish the recommended option (no schema change) from the two that are. The facts should add that the parent this ruling feeds is at the maieutic stage and cannot be drafted until tier is re-answered. Persistence standing follows from the node's shape.

Strongest counter-argument (weak): Option 2, a because clause on each under entry, is cheap and would put the refinement in structure exactly where the two questions do not show it — the case the recommendation leaves to a convention nothing checks. Toulmin separates warrant from backing, but a warrant is still written down; the recommendation writes it down only sometimes and only in prose, so the projector can never show why a node hangs where it does, which is the navigation the author asked for when they asked for cites to be projected. Against it, a clause on every edge will be filled with restatements of the two questions in the common case.

The session's reply: Forward accepted. The dependence on under and the author's own leaning toward the edge prose are carried by the pending alternatives.

### Frontier survey, 2026-09-05

Read in clean context by a subagent given the whole graph and nothing of the sitting, judging this node's recommendation against every other node. The survey gives no verdict.

Findings:


Strongest counter-argument (moderate): The recommendation `rationale-stays-with-node` is the incumbent shape, and the node offers no reason for it beyond that the alternative would require an edge that carries prose, which `under` does not. `commons.systems/disposition-graph/evaluation` strikes exactly that argument: what a change would cost to build, and that the incumbent already does it the other way, do not bear on whether a design is right, and "a recommendation resting on one of them has not been made". Judged as if the record were being written from scratch, the rationale is a justification of one edge and belongs to it, which is what the question asks and what the recommendation declines without argument.

### Migrated to the content encoding, 2026-09-07

Written by `packages/disposition/migrate.mjs` on 2026-09-07. The legacy text of commons.systems/disposition-graph/rationale-edge stands at graph commit `2b696ace1e7c610bb4c205f1356f0cf19f016af6`, and this file is its projection into the content encoding of 2026-09-07 (`commons.systems/disposition-graph/dialogue`, `an-option-carries-its-content-its-words-and-its-case`). The `## Recommendation` fence became the content of `rationale-stays-with-node`; 1 `## Disposition` entry became the ledger entry words/2026-09-03/69, referenced by 1 option the entry's own date names. The record wrote no text of its own for `because-clause-on-edge`, `rationale-on-edge`, `drop-convention-clause`, `disclose-unanswered-parent`, `rationale-as-the-edge-prose`, so each carries the node as it stands with its own sentence in the answer's place: a transcription of what the option already said it would answer, and not an argument the migration wrote. Each is owed the text a sitting will give it. The draft review's pin `dcef237c051b8b1ca92ca7e6baf8189f0b0983a0` was already past the recommendation and is left as it stood. The survey's pin `f2af44ceef3d1093687f0f58c40bd99005ac30e5` is re-computed for the encoding as `ba50403d7562e2d0be4e771abc4a75cd08a66720`; nothing it read changed.
