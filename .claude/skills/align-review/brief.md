# Clean-context review of the unanswered frontier, {{date}}

You start with no context but the record, on purpose: read only what this brief names and what the record itself points you to. Work only in `/home/n8/natb1/commons.systems/.claude/worktrees/greenfield` (absolute `cd` per Bash call; the sandbox refuses `git -C`, loops, redirections, and heredocs mentioning git; prefer the Read tool for files). Never run state-changing git. Write only the one output file named below. Never edit anything under `disposition/`, `packages/`, `.claude/`, or `CLAUDE.md`.

## The record

The disposition graph is at `disposition/` (manifest `disposition/disposition.yaml`; a node `commons.systems/<graph>/<slug>` is the file `disposition/<graph>/<slug>.md`). A node is one question and its standing answer, with frontmatter (`question`, `form`, `authority` stamp, `under` parents, `defines`, `shims`, `instrument`, `order`, `boost`, `stage`, `recommendation`, `review`) and sections `## Disposition` (the author's words, verbatim and dated), `## Answer`, `## Rationale`, `## Draft` (the recommended text when it differs from the node as it stands, as one fenced markdown block), `## Proposal` (the AI's account, with the subsections of earlier reviews). Every node is unanswered until the author confirms it through the alignment dialogue; `stage` is the next movement owed: periagogic (the author's account not yet elicited), maieutic (the answer not yet drafted), review (this review), ruling (the author's confirmation owed). A node at the ruling stage has been forwarded by an earlier review and is reviewed again by this one.

The unanswered frontier, every node that carries a stage, in the frontier's order (id, stage, rank, stamp, file):

{{frontier}}

The answered nodes, the doctrine the frontier joins and must not contradict: {{answered}}.

Read first, in full: `disposition/disposition-graph/recording.md` (what this review is and what it judges), `frontier-consistency.md` (the validations you run), `clean-context-review.md`, `authority.md`, `unanswered.md`, `dialogue.md`, `node.md`, `transience.md`, and the global-tier rules `evaluation.md`, `materialization.md`, `session-context.md`, `delegation.md`; then the manifest. Then every node on the frontier, whole, in the frontier's order, all of them before you write any finding, since the survey compares nodes. When a node carries a `## Draft`, the draft is what you review; the node as it stands is what remains if the author denies. `disposition/disposition-graph/scope.md` carries the high-level order the author recorded.

## What you judge

On each node with a draft, at the review or ruling stage, the six validations of the frontier-consistency node:

1. Question and words: the draft answers the node's question and nothing else, and the author's words on the node are answered by it, with no drift between what the author said and what the draft says; it quotes every ruling it rests on.
2. Doctrine: the draft contradicts no answered node in its ancestry or among the nodes it cites, and no tradition it cites, without recording the divergence; what would contradict doctrine is a proposal, never a draft.
3. Facts: the recommendation's `class` and `boldness`, and the persistence the proposal's "Facts:" line states, are the ones to present to the author; every claim about the record or the implementation is verified, a file named exists, a command cited runs, a date and a quotation are exact.
4. Readings: a tradition cited is represented accurately within its recorded support scope.
5. Shims: each declared shim names an artifact that exists and a liquidation condition; nothing the draft presumes materialized is unmaterialized without saying so.
6. Counter-argument: the strongest argument against the disposition, with your honest assessment of its strength; and whether an executor reading the draft would take a wrong action.

Across the frontier, every node with a stage, the periagogic and maieutic included, the eight validations of the survey:

7. Contradiction: two frontier nodes whose answers, drafts, or author's words touch the same matter and disagree.
8. Supersession: the author's words on one node superseded by later words on another while the earlier node still answers the superseded words.
9. Redundancy: two nodes answering the same question, defining the same term, or restating each other; propose the merge, naming the survivor and what moves.
10. Decomposition: a node answering more than one question or carrying what another node owns, or a node that is a fragment of its parent; propose the split or the fold.
11. Vocabulary: every term used with one meaning across the frontier, each definition made once (`defines`), and no term used by a node that has no path to the node defining it.
12. Cross-reference: every prose reference to another node ("as the X node says") points at a node that still says what is attributed to it.
13. Placement and order: `under` and `order` agree with the answers' dependencies; a draft that presupposes another node's answer is under it or after it; no node at the ruling stage rests on ground still at the periagogic or maieutic stage without saying so. Recommend the order in which the author should rule.
14. Coverage: every disposition the author has given in the record (each `## Disposition` quotation, and the rulings quoted in rationales) is answered by exactly one node: none unanswered, none answered twice.

Verdict per draft: `forward` to the author's ruling, or `kickback` to the periagogic or maieutic stage with findings. Kick back only when the draft cannot be put to the author as it stands: a ruling paraphrased against its sense, a contradiction with an ancestor, or an answer that says nothing the author could rule on. Findings a session can fix by amendment go with a forward. A frontier finding names every node it concerns and recommends, for each node named whose text must change, the earliest stage the finding touches: periagogic when the ground or the author's words are in question, maieutic when the answer must be redrafted; give the edit, merge, or split you propose. A node named only as context -- named because the finding concerns it, but whose own text needs no change -- receives the finding too and keeps its stage: omit it from `stages` rather than guessing one for it. The review proposes; it never merges or splits.

## Output

Write exactly one file, `{{out}}` (create its directory with mkdir if absent): one JSON object

```json
{
  "date": "{{date}}",
  "read": ["<every frontier id you read, whole>"],
  "nodes": [
    {
      "id": "<node id>",
      "scope": "node",
      "verdict": "forward" | "kickback",
      "kickback_stage": "periagogic" | "maieutic" | null,
      "findings": ["<one finding per string, citing the section and quoting the text it concerns; a suggested edit where you have one>"],
      "counter_argument": "<the strongest argument against the disposition, in two to five sentences>" | null,
      "strength": "strong" | "moderate" | "weak" | "none",
      "facts_check": "<your assessment of the class, boldness, and persistence as stated, in one to three sentences>" | null
    }
  ],
  "frontier": [
    {
      "kind": "contradiction" | "supersession" | "redundancy" | "decomposition" | "vocabulary" | "cross-reference" | "placement" | "coverage",
      "nodes": ["<node id>", "..."],
      "finding": "<the finding, quoting the sentences concerned>",
      "proposal": "<the edit, merge, split, or fold you propose, naming the survivor and what moves where that applies>",
      "stages": { "<node id whose text must change>": "periagogic" | "maieutic" }
    }
  ],
  "ruling_order": ["<node ids in the order you recommend the author rule, dependencies first>"]
}
```

`nodes` has one entry for every node at the review or ruling stage, no more and no fewer. `strength` is your assessment of the counter-argument; `none` with `counter_argument` null when you found none worth the author's time. `frontier` may be empty only if the survey found nothing, and then say so in your report. Check that the file parses (`node -e` with `JSON.parse` on it) before you finish.

## Report

Under 30 lines: the count of forwards and kickbacks, the count of frontier findings by kind, the files you read, the commands you ran, and anything you could not read. Do not restate the findings; they are in the file.
