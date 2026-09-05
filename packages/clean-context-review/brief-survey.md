# Frontier survey, {{date}}: the nodes whose recommendation has moved since the survey last pinned them, judged against the whole graph

{{bounds}}

{{nav}}

## The scope: the frontier, against itself

Your object is **the frontier's consistency with itself**. Drift between nodes is invisible to any reading of one node, so the whole graph is here in one context.

The **judged set** is the {{batch_count}} node(s) at the review or ruling stage whose recommendation has moved since the survey last pinned it, and every such node no survey has yet read. Those are the nodes you write an entry for in `nodes`, and only those; they are listed below in the ruling order, the order the author rules in. The **context** is every other node, answered or unanswered, at every stage: {{context_count}} node(s). The context receives no entry, but a finding may name any node in it, and a finding that does is applied to that node as the kickback flow says.

No `## Account` is carried here, for the judged set or the context: the accounts are the dialogue's history and not its text. Read the files themselves where a finding turns on the exact bytes.

**The graph commit you are reading is `{{commit}}`.** Carry it in your output: a review attests to the text it read. The session that applies your findings compares each node against the recommendation hash this brief pinned (`{{pins}}`), and discards a finding whose subject has moved since — which is what serializes the survey, and why nothing here is locked.

The survey **forwards nothing**. Only the review of a draft gives a verdict; your findings kick back what must change.

{{record}}

Read first, in full: `disposition/disposition-graph/frontier-consistency.md` (the validations you run), `clean-context-review.md` (the two readings and how this one is pinned), `alignment-order.md` (how a tangle and a divergence are recorded), `recording.md`, `viable-options.md`, `authority.md`, `unanswered.md`, `dialogue.md`, `node.md`, and the global-tier rules `evaluation.md`, `materialization.md`, `session-context.md`, `delegation.md`; then the manifest. Then this brief's judged set, whole, all of it before you write any finding, since the survey compares nodes.

## What you judge

Across the graph — each judged node against every other node, answered or unanswered, at whatever stage — validations 7 to 15 of `frontier-consistency`, each producing findings that name the nodes and the sentences:

7. **Contradiction.** Two frontier nodes whose answers, drafts, or author's words touch the same matter and disagree.
8. **Supersession.** The author's words on one node superseded by later words on another while the earlier node still answers the superseded words.
9. **Redundancy.** Two nodes answering the same question, defining the same term, or restating each other; a merge is proposed naming the survivor and what moves.
10. **Decomposition.** A node answering more than one question or carrying what another node owns, or a node that is a fragment of its parent; a split or a fold is proposed.
11. **Vocabulary.** Every term used with one meaning across the frontier, each definition made once, and no term used by a node that has no path to the node defining it.
12. **Cross-reference.** Every prose reference to another node points at a node that still says what is attributed to it; a reference stale since an amendment is the drift this review exists to catch.
13. **Placement and order.** The `under` and `order` fields agree with the answers' dependencies: a draft that presupposes another node's answer is under it or after it, and no node at the ruling stage rests on ground still at the periagogic or maieutic stage without saying so. What the survey finds is recorded as the `alignment-order` node says, a lateral tangle as an option on the earlier-recorded node and a divergence between subtrees on the leaves, and the ruling order is derived from that and never recommended in prose.
14. **Coverage.** Each part of every disposition the author has given in the record is answered by exactly one node: none unanswered, none answered twice; a quotation may be carried on a child as the ground of the part it answers.
15. **Merge.** Whether each disposition the author has given, each node, and each option pending on one is a new question or a new answer to a question the record already asks, answered or unanswered: a new answer standing as its own node is proposed for the node whose question it answers, as an option with its source, and a new question carried on another node's dialogue is proposed a node of its own. The survey asks it across the frontier.

## How you record what you find

**A finding may name any node in the graph, judged or not.** It names every node it concerns and recommends, for each node named *whose text must change*, the earliest stage the finding touches: `periagogic` when the ground or the author's words are in question, `maieutic` when the answer must be redrafted. A node named only as context — named because the finding concerns it, but whose own text needs no change — receives the finding too and keeps its stage: omit it from `stages` rather than guessing one for it. **A node that carries no `stage` at all** (settled doctrine, no dialogue open) must be given one in `stages` if you name it, since a finding recorded on it opens its dialogue; name it only when you mean to reopen it.

**A merge, split, or fold is proposed as an option, never as an edit.** Put it in the finding's `options`: the node it goes on, a slug name unique on that node's answer fact, and the prose that says what it would answer and why it is on the table. The session records it on that node's answer fact with `source: review`, and writes its `#### <name>` subsection under `### answer`; the author rules on it.

**A lateral tangle** — two unruled nodes carrying the same idea, its opposite, or adjacent ideas that would merge — is recorded as an option on the **earlier-recorded** of the two, which stands by that rule alone and by no judgment of yours about which is better, the later one becoming the option with its source and date; report it as a `contradiction` or `redundancy` finding whose `options` puts the later node's answer on the earlier node, and say in the finding which is earlier and how you know. Earlier means the earlier date the node's own record carries, the earliest `ref` on its answer fact or the earliest date in its `## Disposition`, and, when those tie or are absent, the earlier addition to the graph's history (from inside `{{repo}}/disposition`, since the sandbox refuses `git -C`: `git log --diff-filter=A --format=%ad --date=short -- <file> | tail -1`).

**A probe is a question for the author, raised on the node it bears on** (`author-questions`). A probe is a question the record must have the author answer before a recommendation can be grounded, and whose answer is not itself a disposition. Raise one only where all three limbs hold, and write none where any fails: the record does not answer it and you have looked, and your `why` names the locus you read and what that locus leaves open; the answer would move a recommendation on the node the probe names, and your `discharges` names which; and the answer is not itself a disposition — a question whose answer would stand as an answer to a question of the record is a node, and goes to validation 15's merge finding above and never here. **Finding no probe is a complete answer** and not a step left undone: an empty array is the ordinary result of a survey that can ground what it read, and a probe raised to show diligence is the paper doubt this record refuses.

A probe names any node in the graph, judged or not, for the same reason a finding may: the frontier's findings already reach nodes outside the judged set, and a probe is the sharpest of them. What raising one does is one rule at every node it reaches: **a probe recorded on a node at the review or the ruling stage returns that node to the `maieutic` stage**, whether the survey is judging that node or not, and whatever else this reading says about it; a node already at the periagogic stage stays there, since a movement only ever moves a node back. Do not name a stage for it in `stages` on that account — the applying step derives the stage from the probes.

**The cap is three open probes on one node**, a probe compounding two questions counting as the two it compounds. Check it on every node you judge, counting the probes it already carries together with the ones you raise, and report an excess as a finding naming the node and the probes, so that the movement discharges or withdraws one before it raises another. The cap binds the movement and is checked by this reading; it is not enforced by the parser, so expect no parse failure from it.

**A subtree divergence** — a set of unruled nodes that stands under one option pending on an ancestor, and that a ruling for another option would discard — is recorded on the leaves and never on the ancestor: report it in `subtree_divergences`, naming the ancestor, the option each node stands under, and what diverges. Nothing you record computes an order; the projector does that, and the alignment page shows the author, at the ancestor, what each ruling keeps and what it discards.

## The judged set ({{batch_count}} node(s), in the ruling order)

{{batch_index}}

{{batch}}

## The full graph, as context ({{context_count}} node(s))

{{context_index}}

{{context}}

## Output

Write exactly one file, `{{out}}` (create its directory with mkdir if absent): one JSON object

```json
{
  "scope": "survey",
  "commit": "{{commit}}",
  "date": "{{date}}",
  "nodes": [
    {
      "id": "<a judged node's id, exactly as this brief lists it>",
      "findings": ["<one finding per string, citing the section and quoting the text it concerns>"],
      "counter_argument": "<the strongest argument against this node's recommendation as the frontier reads it, in two to five sentences>" | null,
      "strength": "strong" | "moderate" | "weak" | "none"
    }
  ],
  "frontier": [
    {
      "kind": "contradiction" | "supersession" | "redundancy" | "decomposition" | "vocabulary" | "cross-reference" | "placement" | "coverage" | "merge" | "stale-recommendation",
      "nodes": ["<every node id the finding concerns, judged or not>", "..."],
      "finding": "<the finding, quoting the sentences concerned>",
      "proposal": "<what you propose, naming the survivor and what moves where that applies>",
      "stages": { "<node id whose text must change>": "periagogic" | "maieutic" },
      "options": [
        {
          "node": "<the node whose answer fact the option goes on; must be one of this finding's 'nodes'>",
          "name": "<slug, lowercase, unique on that node's answer fact, never 'standing'>",
          "text": "<the option in prose: what it would answer and why it is on the table>"
        }
      ]
    }
  ],
  "probes": [
    {
      "node": "<the node the probe is raised on; any node in the graph, judged or not>",
      "asks": "<the question in one line, put open and never as a choice between drafted answers>",
      "why": "<why the record cannot answer it, naming the locus you read and what it leaves open>",
      "discharges": "<what an answer would settle and which recommendation on that node it would move>",
      "fact": "answer" | "authority" | "existence" | "persistence" | null
    }
  ],
  "subtree_divergences": [
    {
      "ancestor": "<the unruled node whose pending answer options the subtrees diverge over>",
      "sides": { "<an option name on that ancestor's answer fact>": ["<id of a node that stands under it>", "..."] },
      "finding": "<what diverges, quoting the sentences concerned>"
    }
  ]
}
```

`scope` is exactly `"survey"` and `commit` is the graph commit named above: the apply step reads the reading from the first and records the second. `nodes` carries **each judged node's `id`, written out**, one entry per node you judged and no entry for a node outside the judged set; a node whose recommendation has moved since this brief pinned it receives nothing and is judged again by the next survey, and so is every finding that names it. `options` is optional on a finding and **required on a `merge` finding**; each name must not already be listed on that node's answer fact (this brief shows every option of every node). `frontier` may be empty only if the survey found nothing, and then say so in your report. `probes` is every probe this reading raises, `[]` where you raised none; each `node` must be a node of the graph, judged or not, and `fact` is null where the probe bears on that node's ground rather than on one of its decisions; the entries on one node are ordered by what a `discharges` would move, the most first, and `id`, `source` and `raised` are the applying step's and never yours. In `subtree_divergences` every option name must be one the ancestor's answer fact already carries or one this file's `options` adds to it, every node named must be unruled and must not be the ancestor, and no node may stand under two options of the same ancestor; the apply step refuses the whole run otherwise. Check that the file parses (`node -e` with `JSON.parse` on it) before you finish.

## Report

Under 30 lines: the graph commit you read, the count of judged nodes you wrote entries for, the count of frontier findings by kind, the count of options proposed, the count of probes raised and the nodes they name, the files you read, the commands you ran, and anything you could not read — an unread part is a gap in the reading, not a finding of nothing. Do not restate the findings; they are in the file.
