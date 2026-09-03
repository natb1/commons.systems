# Clean-context review of one disposition: {{id}}

You start with no context but the record, on purpose: read only what this brief names and what the record itself points you to. Work only in `/home/n8/natb1/commons.systems/.claude/worktrees/greenfield` (absolute `cd` per Bash call; the sandbox refuses `git -C`, loops, redirections, and heredocs mentioning git; prefer the Read tool for files). Never run state-changing git. Write only the one output file named below. Never edit anything under `disposition/`, `packages/`, `.claude/`, or `CLAUDE.md`.

## The record

The disposition graph is at `disposition/` (manifest `disposition/disposition.yaml`; a node `commons.systems/<graph>/<slug>` is the file `disposition/<graph>/<slug>.md`). A node is one question and its standing answer, with frontmatter (`question`, `form`, `authority` stamp, `under` parents, `defines`, `shims`, `instrument`, `stage`, `recommendation`, `review`) and sections `## Disposition` (the author's words, verbatim and dated), `## Answer`, `## Rationale`, `## Draft` (the recommended text when it differs from the node as it stands, as one fenced markdown block), `## Proposal` (the AI's account). Every node is unanswered until the author confirms it through the alignment dialogue; `stage` is the next movement owed: periagogic (the author's account not yet elicited), maieutic (the answer not yet drafted), review (this review), ruling (the author's confirmation owed).

Read first, in full: `disposition/disposition-graph/recording.md` (what this review is and what it judges), `authority.md`, `unanswered.md`, `dialogue.md`, `node.md`, `transience.md`, and the global-tier rules `evaluation.md`, `materialization.md`, `session-context.md`, `delegation.md`. Then the node under review, `{{path}}`, whole, and its ancestry in `{{ancestry}}`. Then every node the reviewed text names by slug (for example "the attention node"), and `disposition/disposition-graph/scope.md` for the high-level order the author recorded. When the node carries a `## Draft`, the draft is what you review; the node as it stands is what remains if the author denies.

What you review: {{amendment}}.

## What you judge (from the recording node)

- whether the answer says what the author said, and quotes every ruling it rests on (the author's words are in `## Disposition` on the node and on its ancestors, and quoted in rationales);
- whether it contradicts the record it joins, the ancestry to the root and the global-tier nodes, or a tradition it cites, without recording the divergence;
- whether its stamp, boldness, and persistence class, as the frontmatter's `recommendation` and the proposal's "Facts:" line state them, are the ones to present to the author;
- whether an executor reading it would take a wrong action;
- and what the strongest argument against the disposition is, with your honest assessment of its strength.

Verdict: `forward` to the author's ruling, or `kickback` to the periagogic or maieutic stage with findings. Kick back only when the draft cannot be put to the author as it stands: a ruling paraphrased against its sense, a contradiction with an ancestor, or an answer that says nothing the author could rule on. Findings a session can fix by amendment go with a forward.

## Output

Write exactly one file, `{{out}}` (create its directory with mkdir if absent): one JSON object

```json
{
  "id": "{{id}}",
  "scope": "node" | "amendment",
  "verdict": "forward" | "kickback",
  "kickback_stage": "periagogic" | "maieutic" | null,
  "findings": ["<one finding per string, citing the section and quoting the text it concerns; a suggested edit where you have one>"],
  "counter_argument": "<the strongest argument against the disposition, in two to five sentences>" | null,
  "strength": "strong" | "moderate" | "weak" | "none",
  "facts_check": "<your assessment of the stamp, boldness, and persistence as stated, in one to three sentences>" | null
}
```

`strength` is your assessment of the counter-argument; `none` with `counter_argument` null when you found none worth the author's time. Check that the file parses (`node -e` with `JSON.parse` on it) before you finish.

## Report

Under 20 lines: the verdict and strength, the files you read, the commands you ran, and anything you could not read. Do not restate the findings; they are in the file.
