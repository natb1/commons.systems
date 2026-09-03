# Clean-context review, {{date}}: the batch at the review stage, judged against the full graph

You start with no context but the record, on purpose: read only this brief and what the record itself points you to. Work only in `{{repo}}` (absolute `cd` per Bash call; the sandbox refuses `git -C`, loops, redirections, and heredocs mentioning git; prefer the Read tool for files). Never run state-changing git. Write only the one output file named below. Never edit anything under `disposition/`, `packages/`, `.claude/`, or `CLAUDE.md`.

{{nav}}

## The scope: a batch, and a context

The **batch** is the {{batch_count}} node(s) carrying `stage: review`. Those are the nodes you give a verdict on, and only those. The **context** is the full graph, every other node, answered or unanswered, at every stage: {{context_count}} node(s). The context is what the batch is judged against; it receives no verdict, but a finding may name a node in it, and a finding that does is applied to that node as a kickback (clean-context-review: "A finding may name a node outside the batch, at any stage, and it is applied to that node as the kickback flow says; only the batch receives verdicts").

Both are carried in this brief, whole for the batch and by stamp, stage, question, answer, and pending alternatives for the context. Read the files themselves where a finding turns on the exact bytes.

## The record

The disposition graph is at `disposition/` (manifest `disposition/disposition.yaml`; a node `commons.systems/<graph>/<slug>` is the file `disposition/<graph>/<slug>.md`). A node is one question and its standing answer, with frontmatter (`question`, `form`, `authority` stamp, `under` parents, `defines`, `shims`, `instrument`, `order`, `boost`, and, while a dialogue is open on it, `stage`, `alternatives`, `recommendation`, `review`, `depends`) and sections in this order:

- `## Disposition` — the author's words, verbatim and dated.
- `## Answer` — the node as it stands.
- `## Rationale` — why, with the alternatives already ruled out.
- `## Alternatives` — one `### <name>` subsection per entry of the frontmatter `alternatives` list: an answer on the table beside the standing one. Each entry carries a `source`: `author` (the author's own stated answer), `ai` (drafted in alignment), `review` (raised by a reading like this one), `proposal` (a conflict that arose outside alignment, with a `ref` naming what raised it). An entry may carry `prune: true`, meaning the alternative is to delete the node.
- `## Recommendation` — one fenced ```markdown block holding the whole recommended node, present only when the recommendation adopts an alternative that is not a prune.
- `## Account` — the AI's account in prose: evidence, findings, the reasoning behind the recommendation, the subsections of earlier readings (`### Clean-context review, <date>`, `### Frontier finding, <date>`), replies, and what is open for the author.

`recommendation` is `{adopts, class, boldness, amends, at}`: `adopts` is `standing` (the node as it stands) or the name of one listed alternative; `amends` pins the standing text as it was when the recommendation was drafted, and a recommendation whose pin no longer matches is **stale** (`recommendationStale`, flagged in this brief on the node's Recommendation line). `review` is `{verdict, strength, date, of}`, `of` pinning the recommended text that was read.

Every node is unanswered until the author confirms it through the alignment dialogue; `stage` names the next movement owed: `periagogic` (the author's account not yet elicited), `maieutic` (the answer not yet drafted), `review` (this reading), `ruling` (the author's confirmation owed).

Read first, in full: `disposition/disposition-graph/recording.md` (what this review is and what it judges), `frontier-consistency.md` (the validations you run), `clean-context-review.md` (the batch and its context), `authority.md`, `unanswered.md`, `dialogue.md`, `node.md`, `transience.md`, and the global-tier rules `evaluation.md`, `materialization.md`, `session-context.md`, `delegation.md`; then the manifest. Then this brief's batch, whole, all of it before you write any finding, since the survey compares nodes. `disposition/disposition-graph/scope.md` carries the high-level order the author recorded.

## What you judge

On each node of the batch, the draft being the text its recommendation adopts — the node as it stands, or the alternative it names — validations 1 to 6 of the frontier-consistency node:

1. **Question and words.** The draft answers the node's question and nothing else, and the author's words on the node are answered by it, with no drift between what the author said and what the draft says; it quotes every ruling it rests on.
2. **Doctrine.** The draft contradicts no answered node in its ancestry or among the nodes it cites, and no tradition it cites, without recording the divergence. What would contradict doctrine is never adopted by a recommendation: it is recorded as an alternative on the node it conflicts with — a `proposal` alternative when it arose outside alignment — and you say which.
3. **Facts.** The recommendation's `class` and `boldness` are the ones to present to the author; it adopts a listed alternative or the node as it stands; its `amends` pin names the standing text as it is, so that a recommendation drafted against text since amended is caught; its persistence follows from the node's shape; and every claim about the record or the implementation is verified — a file named exists, a command cited runs, a date and a quotation are exact. **A stale recommendation is a finding in its own right**: report it as a `stale-recommendation` frontier finding naming that node, with the stage at which it is redrafted, not as a sentence buried in another finding.
4. **Readings.** A tradition cited is represented accurately within its recorded support scope, and a divergence from it is recorded as the author's.
5. **Shims.** Each declared shim names an artifact that exists and a liquidation condition; nothing the draft presumes materialized is unmaterialized without saying so.
6. **Counter-argument.** The strongest argument against the draft, with your honest assessment of its strength; and whether an executor reading the draft would take a wrong action.

Across the graph — each node of the batch against every other node, answered or unanswered, at whatever stage — validations 7 to 15, the survey:

7. **Contradiction.** Two nodes whose answers, recommended texts, or author's words touch the same matter and disagree.
8. **Supersession.** The author's words on one node superseded by later words on another while the earlier node still answers the superseded words.
9. **Redundancy.** Two nodes answering the same question, defining the same term, or restating each other; propose the merge, naming the survivor and what moves.
10. **Decomposition.** A node answering more than one question or carrying what another node owns, or a node that is a fragment of its parent; propose the split or the fold.
11. **Vocabulary.** Every term used with one meaning across the graph, each definition made once (`defines`), and no term used by a node that has no path to the node defining it.
12. **Cross-reference.** Every prose reference to another node ("as the X node says") points at a node that still says what is attributed to it.
13. **Placement and order.** `under` and `order` agree with the answers' dependencies; a draft that presupposes another node's answer is under it or after it; no node at the ruling stage rests on ground still at the periagogic or maieutic stage without saying so. Recommend the order in which the author should rule.
14. **Coverage.** Each part of every disposition the author has given in the record (each `## Disposition` quotation, and the rulings quoted in rationales) is answered by exactly one node: none unanswered, none answered twice. A quotation may be carried on a child as the ground of the part it answers; the violation is two nodes answering the same part.
15. **Merge.** For each unanswered node, and each alternative pending on one, ask whether it is a **new question** or a **new answer to a question the record already asks**, answered or unanswered. A new answer standing as its own node belongs on the node whose question it answers, as an alternative with its source; a new question carried on another node's dialogue belongs in a node of its own. Report each as a `merge` finding and give the alternative you propose: the node it goes on, the name it takes, and its prose. The review proposes; it never merges, splits, or edits a node.

## Verdicts, findings, and what may be named

**Verdict per batch node**: `forward` to the author's ruling, or `kickback` to the periagogic or maieutic stage with findings. Kick back only when the draft cannot be put to the author as it stands: a ruling paraphrased against its sense, a contradiction with an ancestor, an answer that says nothing the author could rule on, or a recommendation whose pin is stale. Findings a session can fix by amendment go with a forward.

**A finding may name any node in the graph, in the batch or outside it.** A finding names every node it concerns and recommends, for each node named *whose text must change*, the earliest stage the finding touches: `periagogic` when the ground or the author's words are in question, `maieutic` when the answer must be redrafted. A node named only as context — named because the finding concerns it, but whose own text needs no change — receives the finding too and keeps its stage: omit it from `stages` rather than guessing one for it. **A node that carries no `stage` at all** (settled doctrine, no dialogue open) must be given one in `stages` if you name it, since a finding recorded on it opens its dialogue; name it only when you mean to reopen it.

**A merge, split, or fold is proposed as an alternative, never as an edit.** Put it in the finding's `alternatives`: the node it goes on, a slug name unique on that node, and the prose that says what it would answer and why it is on the table. The session records it on that node as a pending alternative with `source: review`; the author rules on it.

## The batch ({{batch_count}} node(s) at `stage: review`)

{{batch_index}}

{{batch}}

## The full graph, as context ({{context_count}} node(s))

{{context_index}}

{{context}}

## Output

Write exactly one file, `{{out}}` (create its directory with mkdir if absent): one JSON object

```json
{
  "date": "{{date}}",
  "read": ["<every id you read whole; must include every node of the batch>"],
  "nodes": [
    {
      "id": "<node id, at stage review>",
      "scope": "node",
      "verdict": "forward" | "kickback",
      "kickback_stage": "periagogic" | "maieutic" | null,
      "findings": ["<one finding per string, citing the section and quoting the text it concerns; a suggested edit where you have one>"],
      "counter_argument": "<the strongest argument against the disposition, in two to five sentences>" | null,
      "strength": "strong" | "moderate" | "weak" | "none",
      "facts_check": "<your assessment of the class, boldness, the amends pin, and persistence as stated, in one to three sentences>" | null
    }
  ],
  "frontier": [
    {
      "kind": "contradiction" | "supersession" | "redundancy" | "decomposition" | "vocabulary" | "cross-reference" | "placement" | "coverage" | "merge" | "stale-recommendation",
      "nodes": ["<every node id the finding concerns, in the batch or outside it>", "..."],
      "finding": "<the finding, quoting the sentences concerned>",
      "proposal": "<what you propose, naming the survivor and what moves where that applies>",
      "stages": { "<node id whose text must change>": "periagogic" | "maieutic" },
      "alternatives": [
        {
          "node": "<the node the alternative goes on; must be one of this finding's 'nodes'>",
          "name": "<slug, lowercase, unique on that node, never 'standing'>",
          "text": "<the alternative in prose: what it would answer and why it is on the table>"
        }
      ]
    }
  ],
  "ruling_order": ["<node ids in the order you recommend the author rule, dependencies first>"]
}
```

`nodes` has one entry for every node at `stage: review`, no more and no fewer; a node at any other stage receives no entry, only findings. `strength` is your assessment of the counter-argument; `none` with `counter_argument` null when you found none worth the author's time. `alternatives` is optional on a finding and **required on a `merge` finding**; each name must not already be listed on that node (this brief shows each node's pending alternatives). `frontier` may be empty only if the survey found nothing, and then say so in your report. Check that the file parses (`node -e` with `JSON.parse` on it) before you finish.

## Report

Under 30 lines: the count of forwards and kickbacks, the count of frontier findings by kind, the count of alternatives proposed, the files you read, the commands you ran, and anything you could not read. Do not restate the findings; they are in the file.
