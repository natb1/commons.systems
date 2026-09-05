# Clean-context review of a draft, {{date}}: `{{id}}`, judged against its neighbourhood

{{bounds}}

{{nav}}

## The scope: one draft

Your object is **one node's recommendation**: `{{id}}`, which stands at `stage: review` because its recommendation has just been recorded or moved in substance. It alone receives a verdict, and your verdict alone forwards it to the author's ruling.

You are given, from the record and never from a set a session named: the node whole, its account included; the chain of nodes above it and the rules that bind everywhere; its siblings under the same parent, which the checkpoint has landed; the nodes it names; and the index of every other question the record asks, with its class, its stage, its standing answer, and the options on its answer fact — so that a draft answering a question the record already asks is caught at the draft. Everything but the node itself is given without its `## Account`: the accounts are the dialogue's history and not its text.

What you do **not** judge here is the frontier's consistency with itself. That is the survey's object, it reads the whole graph in one context, and it runs before the author rules. Do not hunt for drift between other nodes; report what bears on this draft.

{{record}}

Read first, in full: `disposition/disposition-graph/recording.md` (what this review is and what it judges), `frontier-consistency.md` (the validations you run), `clean-context-review.md` (the two readings and what each is given), `viable-options.md` (facts, options, rulings, and the derived class), `authority.md`, `unanswered.md`, `dialogue.md`, `node.md`, and the global-tier rules `evaluation.md`, `materialization.md`, `session-context.md`, `delegation.md`. Then this brief's node, whole, and its neighbourhood, before you write any finding.

## What you judge

**The judging criteria** (`recording`): whether the answer says what the author said and quotes every ruling it rests on; whether it contradicts the record it joins, or a tradition it cites, without recording the divergence; whether the class its authority fact recommends, its boldness, and its persistence are the ones the session means to present; whether every option on its facts is viable and none viable is missing; whether an executor reading it would take a wrong action; and what the strongest argument against the disposition is.

The draft is the text the answer fact recommends — the `## Recommendation` fence's inner node where there is one, otherwise the node as it stands. On it, validations 1 to 6 of `frontier-consistency`:

1. **Question and words.** The draft answers the node's question and nothing else, and the author's words on the node are answered by it: no drift between what the author said and what the draft says.
2. **Doctrine.** The draft contradicts no answered node in its ancestry or among the nodes it cites; what would contradict doctrine is never adopted by a recommendation; it is recorded as an option on the node it conflicts with, a proposal under the authority node when it arose outside alignment, and the review says which.
3. **Facts.** The recommendation's boldness is right and the class its authority fact recommends is the one the session means to present, it names a listed option, its pin names the recommendation as it is, so that a review of text since amended is caught, its persistence follows from the node's shape, and every claim about the record or the implementation is verified: a file named exists, a command cited runs, a date and a quotation are exact.
4. **Readings.** A tradition cited is represented accurately within its recorded support scope, and a divergence from it is recorded as the author's.
5. **Shims.** Each declared shim names an artifact that exists and a liquidation condition, and nothing the draft presumes materialized is unmaterialized without saying so.
6. **Counter-argument.** The strongest case against the draft, with its strength.

And validation 15, asked here of the draft against the index of every question the record asks:

15. **Merge.** Whether each disposition the author has given, each node, and each option pending on one is a new question or a new answer to a question the record already asks, answered or unanswered: a new answer standing as its own node is proposed for the node whose question it answers, as an option with its source, and a new question carried on another node's dialogue is proposed a node of its own.

**The viability judgment** (`recording`, as the author amended it on 2026-09-04, from `viable-options`). For each fact of this node, say **whether every option listed is viable on its facts, and whether a viable option is missing.** Viable means not dominated on the record's criteria — the solution frontier of the `evaluation` node, applied to one decision. An option no longer viable is marked passed over with its reason and stays on the list, and the option that displaced it says why; a viable option missing is the one the author will never get to rule on, so name it and give its prose in the `viability` field. This is the judgment the recording node's first step asks of you before the author sees anything.

**The probes** (`author-questions`). A probe is a question you need the author to answer before this draft's recommendation can be grounded, and whose answer is not itself a disposition. Raise one on this node only where all three limbs hold, and write none where any fails: the record does not answer it and you have looked, and your `why` names the locus you read and what that locus leaves open; the answer would move a recommendation on this node, and your `discharges` names which; and the answer is not itself a disposition — a question whose answer would stand as an answer to a question of the record is a node, and goes to validation 15's merge finding above and never here. **Finding no probe is a complete answer** and not a step left undone: an empty array is what a draft you can ground returns, and a probe raised to show diligence is the paper doubt this record refuses.

**The cap is three open probes on one node**, a probe compounding two questions counting as the two it compounds. Check it on the node you read, counting the probes it already carries together with the ones you raise, and report an excess as a finding naming the node and the probes, so that the movement discharges or withdraws one before it raises another. The cap binds the movement and is checked by this reading; it is not enforced by the parser, so expect no parse failure from it.

## Verdict and findings

**The verdict**: `forward` to the author's ruling, or `kickback` to the `periagogic` or `maieutic` stage. Kick back only when the draft cannot be put to the author as it stands: a ruling paraphrased against its sense, a contradiction with an ancestor, an answer that says nothing the author could rule on, or a pin that no longer matches what the node recommends. Findings a session can fix by amendment go with a forward.

**A probe beats the verdict.** A probe recorded on a node at the review or the ruling stage returns that node to the `maieutic` stage whatever verdict was written, and on this reading it beats yours and not merely your choice of stage: a reader that has recorded what it could not ground has said the draft is not ready, and a forward beside it is a contradiction. So if you raise a probe, do not also forward — write `kickback` with `kickback_stage: "maieutic"`, or `"periagogic"` where the ground itself is at issue, and say in a finding which probe sent it back.

**A finding** cites the section and quotes the text it concerns, and gives a suggested edit where you have one. A finding about another node — a duplicate question, an option that belongs elsewhere, a merge or a split — is written here in prose, naming the node it concerns, the name the option would take, and the prose it would carry; the session records it, and the review proposes but never merges, splits, or edits a node. Nothing in this reading changes another node's stage: only the survey's findings do that.

## The node under review

{{node}}

## Its ancestry, and the rules that bind everywhere

{{ancestry}}

## Its siblings, under the same parent

{{siblings}}

## The nodes it names

{{cited}}

## The index of every other question the record asks

{{index}}

## Output

Write exactly one file, `{{out}}` (create its directory with mkdir if absent): one JSON object

```json
{
  "scope": "draft",
  "id": "{{id}}",
  "date": "{{date}}",
  "verdict": "forward" | "kickback",
  "kickback_stage": "periagogic" | "maieutic" | null,
  "findings": ["<one finding per string, citing the section and quoting the text it concerns; a suggested edit where you have one>"],
  "probes": [
    {
      "asks": "<the question in one line, put open and never as a choice between drafted answers>",
      "why": "<why the record cannot answer it, naming the locus you read and what it leaves open>",
      "discharges": "<what an answer would settle and which recommendation on this node it would move>",
      "fact": "answer" | "authority" | "existence" | "persistence" | null
    }
  ],
  "facts_check": "<your assessment of what each fact recommends, its boldness, what stands, and the fence, in one to three sentences>" | null,
  "viability": "<whether every option on this node's facts is viable and whether a viable one is missing, in one to three sentences>" | null,
  "counter_argument": "<the strongest argument against the disposition, in two to five sentences>" | null,
  "strength": "strong" | "moderate" | "weak" | "none"
}
```

`scope` is exactly `"draft"` and `id` is exactly `{{id}}`: the apply step reads the reading from them and refuses a file that names neither. `kickback_stage` is null on a forward and required on a kickback. `probes` is the probes this reading raises on `{{id}}`, `[]` where you found none, which is the ordinary result; `fact` is null where the probe bears on the node's ground rather than on one decision, and the entries are ordered by what a `discharges` would move, the most first. `id`, `source` and `raised` are the applying step's and never yours. A non-empty `probes` and a `forward` verdict cannot both stand: write `kickback`. `strength` is your assessment of the counter-argument; `none` with `counter_argument` null when you found none worth the author's time. Check that the file parses (`node -e` with `JSON.parse` on it) before you finish.

## Report

Under 20 lines: the verdict, the count of findings, the count of probes you raised, the files you read, the commands you ran, and anything you could not read — an unread part is a gap in the reading, not a finding of nothing. Do not restate the findings; they are in the file.
