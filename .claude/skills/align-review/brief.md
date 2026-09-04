# Clean-context review, {{date}}: the batch at the review stage, judged against the full graph

You start with no context but the record, on purpose: read only this brief and what the record itself points you to. Work only in `{{repo}}` (absolute `cd` per Bash call; the sandbox refuses `git -C`, loops, redirections, and heredocs mentioning git; prefer the Read tool for files). Never run state-changing git. Write only the one output file named below. Never edit anything under `disposition/`, `packages/`, `.claude/`, or `CLAUDE.md`.

{{nav}}

## The scope: a batch, and a context

The **batch** is the {{batch_count}} node(s) carrying `stage: review`. Those are the nodes you give a verdict on, and only those. The **context** is the full graph, every other node, answered or unanswered, at every stage: {{context_count}} node(s). The context is what the batch is judged against; it receives no verdict, but a finding may name a node in it, and a finding that does is applied to that node as the kickback flow says (clean-context-review: "A finding may name a node outside the batch, at any stage, and it is applied to that node as the kickback flow says; only the batch receives verdicts").

Both are carried in this brief, whole for the batch and by class, stage, question, standing text, and facts for the context. Read the files themselves where a finding turns on the exact bytes.

## The record

The disposition graph is at `disposition/` (manifest `disposition/disposition.yaml`; a node `commons.systems/<graph>/<slug>` is the file `disposition/<graph>/<slug>.md`). A node is one question and its standing answer, with frontmatter (`question`, `form`, `under` parents, `defines`, `shims`, `instrument`, `order`, `boost`, `cites`, `source` and `bears` on a reading, and, while a dialogue is open on it, `stage`, `review`, `depends`, whose entries are either a node id or a node id and an option on that node's answer fact written `<id>#<option>`) and sections in this order:

- `## Disposition` — the author's words, verbatim and dated.
- `## Answer` — the text that stands: the confirmed choice on a ruled node, and on any other the draft as it stands.
- `## Rationale` — why, with the reasoning behind what stands.
- `## Facts` — one `### <fact>` subsection per fact, in the frontmatter's order, opening with the reason for what that fact recommends; under `### answer`, one `#### <option>` subsection per option, saying what it would answer and why it is on the table. The option named by `stands` may omit its subsection, because its text is `## Answer`; every other answer option owes one.
- `## Recommendation` — one fenced ```markdown block holding the whole recommended node, present exactly when the answer fact recommends an option other than the one that stands (or nothing stands yet).
- `## Account` — the AI's account in prose: evidence, findings, the reasoning behind the recommendation, the subsections of earlier readings (`### Clean-context review, <date>`, `### Frontier finding, <date>`), replies, and what is open for the author.

**There is no stamp.** Every decision on a node is a **fact** with a list of the **options** the AI holds **viable**, and the node's class is read off the **rulings** recorded on those options, never stored (`viable-options`). Each `facts` entry is `{name, options, recommends, boldness, stands?}`:

- `name` is one of exactly `answer` (its options are the candidate answers to this node's question, and it comes first), `authority` (the class a ruling confers: `ratified`, `delegated`, or `deferred`), `existence` (keep or prune, where a proposal to prune the node lives), and `persistence` (present only where the recommendation would change the node's shape). A decision the author would rule on separately that is none of those is a question, and a question is a node under this one.
- each option is `{name, source, ref, ruling?}`. On the answer fact `source` and `ref` are required: `author` (the author's own stated answer), `ai` (drafted in alignment), `review` (raised by a reading like this one), or the id of the node, or the name of the instrument, that raised it; `ref` is a date, a graph commit, or what raised it. Deleting the node is never an answer option: it is the `existence` fact, because an answer option is a candidate answer to this node's question and deleting the node answers nothing.
- `recommends` names the one option the AI recommends, with its `boldness` (`low`, `moderate`, `high`); boldness runs from the AI's own knowledge against the record, so **high boldness is low confidence**. Every fact carries a `recommends` from the review stage on.
- `stands`, on the answer fact, names the option whose full text `## Answer` holds. A `## Recommendation` fence is present exactly when `recommends` is set and is not `stands` (or nothing stands yet), and absent otherwise.
- `ruling`, on at most one option per fact, is the author's own act: `{response: confirm|edit, date, of}`, where `of` pins the hash of the recommendation the ruling answered. Only the author rules; the AI writes no ruling and no class for itself.

The class follows: **ratified** when the answer fact carries a ruling; **delegated** or **deferred** when the authority fact carries that ruling; conferred by the nearest ancestor whose authority fact carries one where this node has none; **unanswered** when no ruling reaches it, and then nothing on the node acts and reconciling under it takes an explicit grant from the author. This brief prints each node's class and where it comes from. A ratified node whose recommendation has **moved** since its ruling (the pin no longer matches) is a **proposal** and is back on the alignment frontier for re-confirmation.

A **reading** (`form: reading`) records a tradition and says with `bears` which options it bears on: `{node?, fact, option, relation: adopted|diverged}`; "chosen over" is derived, not stored. This brief prints, on each option, the readings that bear on it.

The recording keeps the facts: at the ruling the dialogue dies — `stage`, `review`, `depends`, and the account — and the options stay with their sources, their readings, the recommendation and its reason, and the author's ruling, so that a later session meets what was considered and why (`recording`, `viable-options`).

Every node is unanswered until a ruling reaches it; `stage` names the next movement owed: `periagogic` (the author's account not yet elicited), `maieutic` (the answer not yet drafted), `review` (this reading), `ruling` (the author's confirmation owed).

Read first, in full: `disposition/disposition-graph/recording.md` (what this review is and what it judges), `frontier-consistency.md` (the validations you run), `clean-context-review.md` (the batch and its context), `viable-options.md` (facts, options, rulings, and the derived class), `authority.md`, `unanswered.md`, `dialogue.md`, `node.md`, `transience.md`, and the global-tier rules `evaluation.md`, `materialization.md`, `session-context.md`, `delegation.md`; then the manifest. Then this brief's batch, whole, all of it before you write any finding, since the survey compares nodes. `disposition/disposition-graph/scope.md` carries the high-level order the author recorded.

## What you judge

On each node of the batch, the draft being the text the answer fact recommends — the fence's inner node where there is one, otherwise the node as it stands — validations 1 to 6 of the frontier-consistency node:

1. **Question and words.** The draft answers the node's question and nothing else, and the author's words on the node are answered by it, with no drift between what the author said and what the draft says; it quotes every ruling it rests on.
2. **Doctrine.** The draft contradicts no ruled node in its ancestry or among the nodes it cites, and no tradition it cites, without recording the divergence. What would contradict doctrine is never adopted by a recommendation: it is recorded as an option on the answer fact of the node it conflicts with — with the source that raised it, `review` when this reading raised it — and you say which.
3. **Facts.** Every fact recommends the option to present to the author, with the boldness to present it at: the `authority` fact's class, the `existence` fact where a prune is on the table, and the `persistence` fact where the recommendation would change the node's shape. The answer fact's `stands` names the option `## Answer` actually holds, and the fence is present exactly when the recommended option is not the one that stands. Every claim about the record or the implementation is verified — a file named exists, a command cited runs, a date and a quotation are exact. **A pin that no longer matches is a finding in its own right**: report a node whose `review.of` no longer matches what it recommends (flagged `STALE` on its Earlier review line here) as a `stale-recommendation` frontier finding naming that node, with the stage at which it is redrawn, not as a sentence buried in another finding.
4. **Readings.** A tradition cited is represented accurately within its recorded support scope, and a divergence from it is recorded as the author's; a reading's `bears` names the option it actually bears on.
5. **Shims.** Each declared shim names an artifact that exists and a liquidation condition; nothing the draft presumes materialized is unmaterialized without saying so.
6. **Counter-argument.** The strongest argument against the draft, with your honest assessment of its strength; and whether an executor reading the draft would take a wrong action.

**The sixteenth judgment, per node: viability** (`recording`, as the author amended it on 2026-09-04, from `viable-options`). For each fact of each batch node, say **whether every option listed is viable on its facts, and whether a viable option is missing.** Viable means not dominated on the record's criteria — the solution frontier of the `evaluation` node, applied to one decision. An option no longer viable should leave the list, and the option that displaced it should say why; a viable option missing is the one the author will never get to rule on, so name it and give its prose, as a `merge` finding's `options` if it belongs on another node and in the node entry's `viability` field otherwise. This is the judgment the recording's first step asks of you before the author sees anything.

Across the graph — each node of the batch against every other node, ruled or unruled, at whatever stage — validations 7 to 15, the survey:

7. **Contradiction.** Two nodes whose standing texts, recommended texts, or author's words touch the same matter and disagree. Between two *unruled* nodes this is a lateral tangle, and validation 13 says how it is recorded.
8. **Supersession.** The author's words on one node superseded by later words on another while the earlier node still answers the superseded words.
9. **Redundancy.** Two nodes answering the same question, defining the same term, or restating each other; propose the merge, naming the survivor and what moves. Between two *unruled* nodes the survivor is not yours to choose: it is the earlier-recorded node, by validation 13's rule.
10. **Decomposition.** A node answering more than one question or carrying what another node owns, or a node that is a fragment of its parent; propose the split or the fold.
11. **Vocabulary.** Every term used with one meaning across the graph, each definition made once (`defines`), and no term used by a node that has no path to the node defining it.
12. **Cross-reference.** Every prose reference to another node ("as the X node says") points at a node that still says what is attributed to it.
13. **Placement and tangle.** `under` and `order` agree with the answers' dependencies; a draft that presupposes another node's answer is under it or after it; no node at the ruling stage rests on ground still at the periagogic or maieutic stage without saying so. The order in which the author rules is not yours to recommend: it is the ruling order, which the projector computes from the tangle you record (`alignment-order`). Record the tangle, in two kinds. A **lateral tangle** — two unruled nodes carrying the same idea, its opposite, or adjacent ideas that would merge — is recorded as an option on the earlier-recorded of the two, which stands by that rule alone and by no judgment of yours about which is better, the later one becoming the option with its source and date; report it as a `contradiction` or `redundancy` finding whose `options` puts the later node's answer on the earlier node, and say in the finding which is earlier and how you know. Earlier means the earlier date the node's own record carries, the earliest `ref` on its answer fact or the earliest date in its `## Disposition`, and, when those tie or are absent, the earlier addition to the graph's history (from inside `{{repo}}/disposition`, since the sandbox refuses `git -C`: `git log --diff-filter=A --format=%ad --date=short -- <file> | tail -1`). A **subtree divergence** — a set of unruled nodes that stands under one option pending on an ancestor, and that a ruling for another option would discard — is recorded on the leaves and never on the ancestor: report it in `subtree_divergences`, naming the ancestor, the option each node stands under, and what diverges. Nothing you record here computes an order; the projector does that, and the alignment page shows the author, at the ancestor, what each ruling keeps and what it discards.
14. **Coverage.** Each part of every disposition the author has given in the record (each `## Disposition` quotation, and the rulings quoted in rationales) is answered by exactly one node: none unanswered, none answered twice. A quotation may be carried on a child as the ground of the part it answers; the violation is two nodes answering the same part.
15. **Merge.** For each unruled node, and each option pending on one, ask whether it is a **new question** or a **new answer to a question the record already asks**, ruled or unruled. A new answer standing as its own node belongs on the node whose question it answers, as an option on that node's answer fact with its source; a new question carried on another node's dialogue belongs in a node of its own. Report each as a `merge` finding and give the option you propose: the node it goes on, the name it takes, and its prose. The review proposes; it never merges, splits, or edits a node.

## Verdicts, findings, and what may be named

**Verdict per batch node**: `forward` to the author's ruling, or `kickback` to the periagogic or maieutic stage with findings. Kick back only when the draft cannot be put to the author as it stands: a ruling paraphrased against its sense, a contradiction with an ancestor, an answer that says nothing the author could rule on, or a review whose pin is stale. Findings a session can fix by amendment go with a forward.

**A finding may name any node in the graph, in the batch or outside it.** A finding names every node it concerns and recommends, for each node named *whose text must change*, the earliest stage the finding touches: `periagogic` when the ground or the author's words are in question, `maieutic` when the answer must be redrafted. A node named only as context — named because the finding concerns it, but whose own text needs no change — receives the finding too and keeps its stage: omit it from `stages` rather than guessing one for it. **A node that carries no `stage` at all** (settled doctrine, no dialogue open) must be given one in `stages` if you name it, since a finding recorded on it opens its dialogue; name it only when you mean to reopen it.

**A merge, split, or fold is proposed as an option, never as an edit.** Put it in the finding's `options`: the node it goes on, a slug name unique on that node's answer fact, and the prose that says what it would answer and why it is on the table. The session records it on that node's answer fact with `source: review`, and writes its `#### <name>` subsection under `### answer`; the author rules on it.

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
      "facts_check": "<your assessment of what each fact recommends, its boldness, what stands, and the fence, in one to three sentences>" | null,
      "viability": "<the sixteenth judgment: whether every option on this node's facts is viable and whether a viable one is missing, in one to three sentences>" | null
    }
  ],
  "frontier": [
    {
      "kind": "contradiction" | "supersession" | "redundancy" | "decomposition" | "vocabulary" | "cross-reference" | "placement" | "coverage" | "merge" | "stale-recommendation",
      "nodes": ["<every node id the finding concerns, in the batch or outside it>", "..."],
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
  "subtree_divergences": [
    {
      "ancestor": "<the unruled node whose pending answer options the subtrees diverge over>",
      "sides": { "<an option name on that ancestor's answer fact>": ["<id of a node that stands under it>", "..."] },
      "finding": "<what diverges, quoting the sentences concerned>"
    }
  ]
}
```

`nodes` has one entry for every node at `stage: review`, no more and no fewer; a node at any other stage receives no entry, only findings. `strength` is your assessment of the counter-argument; `none` with `counter_argument` null when you found none worth the author's time. `options` is optional on a finding and **required on a `merge` finding**; each name must not already be listed on that node's answer fact (this brief shows every option of every node). `frontier` may be empty only if the survey found nothing, and then say so in your report. In `subtree_divergences` every option name must be one the ancestor's answer fact already carries or one this file's `options` adds to it, every node named must be unruled and must not be the ancestor, and no node may stand under two options of the same ancestor; the apply step refuses the whole run otherwise. Check that the file parses (`node -e` with `JSON.parse` on it) before you finish.

## Report

Under 30 lines: the count of forwards and kickbacks, the count of frontier findings by kind, the count of options proposed, the files you read, the commands you ran, and anything you could not read. Do not restate the findings; they are in the file.
