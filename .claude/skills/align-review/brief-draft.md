# Clean-context review of a draft, {{date}}: `{{id}}`, judged against its neighbourhood

You start with no context but the record, on purpose: read only this brief and what the record itself points you to. Work only in `{{repo}}` (absolute `cd` per Bash call; the sandbox refuses `git -C`, loops, redirections, and heredocs mentioning git; prefer the Read tool for files). Never run state-changing git. Write only the one output file named below. Never edit anything under `disposition/`, `packages/`, `.claude/`, or `CLAUDE.md`.

{{nav}}

## The scope: one draft

Your object is **one node's recommendation**: `{{id}}`, which stands at `stage: review` because its recommendation has just been recorded or moved in substance. It alone receives a verdict, and your verdict alone forwards it to the author's ruling.

You are given, from the record and never from a set a session named: the node whole, its account included; the chain of nodes above it and the rules that bind everywhere; its siblings under the same parent, which the checkpoint has landed; the nodes it names; and the index of every other question the record asks, with its class, its stage, its standing answer, and the options on its answer fact — so that a draft answering a question the record already asks is caught at the draft. Everything but the node itself is given without its `## Account`: the accounts are the dialogue's history and not its text.

What you do **not** judge here is the frontier's consistency with itself. That is the survey's object, it reads the whole graph in one context, and it runs before the author rules. Do not hunt for drift between other nodes; report what bears on this draft.

## The record

The disposition graph is at `disposition/` (manifest `disposition/disposition.yaml`; a node `commons.systems/<graph>/<slug>` is the file `disposition/<graph>/<slug>.md`). A node is one question and its standing answer, with frontmatter (`question`, `form`, `under` parents, `defines`, `shims`, `instrument`, `order`, `boost`, `cites`, `tier`, `source` and `bears` on a reading, and, while a dialogue is open on it, `stage`, `review`, `depends`, whose entries are either a node id or a node id and an option on that node's answer fact written `<id>#<option>`) and sections in this order:

- `## Disposition` — the author's words, verbatim and dated.
- `## Answer` — the text that stands: the confirmed choice on a ruled node, and on any other the draft as it stands.
- `## Rationale` — why, with the reasoning behind what stands.
- `## Facts` — one `### <fact>` subsection per fact, in the frontmatter's order, opening with the reason for what that fact recommends; under `### answer`, one `#### <option>` subsection per option, saying what it would answer and why it is on the table. The option named by `stands` may omit its subsection, because its text is `## Answer`; every other answer option owes one.
- `## Recommendation` — one fenced ```markdown block holding the whole recommended node, present exactly when the answer fact recommends an option other than the one that stands (or nothing stands yet).
- `## Account` — the AI's account in prose: evidence, findings, the reasoning behind the recommendation, the subsections of earlier readings (`### Clean-context review, <date>`, `### Frontier survey, <date>`, `### Frontier finding, <date>`), replies, and what is open for the author.

**There is no stamp.** Every decision on a node is a **fact** with a list of the **options** the AI holds **viable**, and the node's class is read off the **rulings** recorded on those options, never stored (`viable-options`). Each `facts` entry is `{name, options, recommends, boldness, stands?}`:

- `name` is one of exactly `answer` (its options are the candidate answers to this node's question, and it comes first), `authority` (the class a ruling confers: `ratified`, `delegated`, or `deferred`), `existence` (keep or prune, where a proposal to prune the node lives), and `persistence` (present only where the recommendation would change the node's shape). A decision the author would rule on separately that is none of those is a question, and a question is a node under this one.
- each option is `{name, source, ref, ruling?}`. On the answer fact `source` and `ref` are required: `author` (the author's own stated answer), `ai` (drafted in alignment), `review` (raised by a reading like this one), or the id of the node, or the name of the instrument, that raised it; `ref` is a date, a graph commit, or what raised it. Deleting the node is never an answer option: it is the `existence` fact, because an answer option is a candidate answer to this node's question and deleting the node answers nothing.
- `recommends` names the one option the AI recommends, with its `boldness` (`low`, `moderate`, `high`); boldness runs from the AI's own knowledge against the record, so **high boldness is low confidence**. Every fact carries a `recommends` from the review stage on.
- `stands`, on the answer fact, names the option whose full text `## Answer` holds. A `## Recommendation` fence is present exactly when `recommends` is set and is not `stands` (or nothing stands yet), and absent otherwise.
- `ruling`, on at most one option per fact, is the author's own act: `{response: confirm|edit, date, of}`, where `of` pins the hash of the recommendation the ruling answered. Only the author rules; the AI writes no ruling and no class for itself.

The class follows: **ratified** when the answer fact carries a ruling; **delegated** or **deferred** when the authority fact carries that ruling; conferred by the nearest ancestor whose authority fact carries one where this node has none; **unanswered** when no ruling reaches it, and then nothing on the node acts and reconciling under it takes an explicit grant from the author. This brief prints each node's class and where it comes from. A ratified node whose recommendation has **moved** since its ruling (the pin no longer matches) is a **proposal** and is back on the alignment frontier for re-confirmation.

A **reading** (`form: reading`) records a tradition and says with `bears` which options it bears on: `{node?, fact, option, relation: adopted|diverged}`; "chosen over" is derived, not stored. This brief prints, on each option, the readings that bear on it.

`review` is the state of the two readings the clean-context review divides into: `verdict`, `strength`, `date` and `of` are this reading, the review of one draft, and `survey: {date, of}` is the survey of the whole frontier. Each `of` pins the node's recommendation hash, so each goes stale by itself; a node is ready for the author's ruling only when both pin the recommendation as it stands.

Every node is unanswered until a ruling reaches it; `stage` names the next movement owed: `periagogic` (the author's account not yet elicited), `maieutic` (the answer not yet drafted), `review` (this reading), `ruling` (the author's confirmation owed).

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

**The viability judgment** (`recording`, as the author amended it on 2026-09-04, from `viable-options`). For each fact of this node, say **whether every option listed is viable on its facts, and whether a viable option is missing.** Viable means not dominated on the record's criteria — the solution frontier of the `evaluation` node, applied to one decision. An option no longer viable should leave the list, and the option that displaced it should say why; a viable option missing is the one the author will never get to rule on, so name it and give its prose in the `viability` field. This is the judgment the recording node's first step asks of you before the author sees anything.

## Verdict and findings

**The verdict**: `forward` to the author's ruling, or `kickback` to the `periagogic` or `maieutic` stage. Kick back only when the draft cannot be put to the author as it stands: a ruling paraphrased against its sense, a contradiction with an ancestor, an answer that says nothing the author could rule on, or a pin that no longer matches what the node recommends. Findings a session can fix by amendment go with a forward.

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
  "facts_check": "<your assessment of what each fact recommends, its boldness, what stands, and the fence, in one to three sentences>" | null,
  "viability": "<whether every option on this node's facts is viable and whether a viable one is missing, in one to three sentences>" | null,
  "counter_argument": "<the strongest argument against the disposition, in two to five sentences>" | null,
  "strength": "strong" | "moderate" | "weak" | "none"
}
```

`scope` is exactly `"draft"` and `id` is exactly `{{id}}`: the apply step reads the reading from them and refuses a file that names neither. `kickback_stage` is null on a forward and required on a kickback. `strength` is your assessment of the counter-argument; `none` with `counter_argument` null when you found none worth the author's time. Check that the file parses (`node -e` with `JSON.parse` on it) before you finish.

## Report

Under 20 lines: the verdict, the count of findings, the files you read, the commands you ran, and anything you could not read — an unread part is a gap in the reading, not a finding of nothing. Do not restate the findings; they are in the file.
