---
name: align
description: Record or revise one node of the disposition graph by interview with the author. Bootstrap shim, hand-projected from the deferred schema nodes; the graph wins on conflict.
---
# Align

> **Shim notice (2026-09-02, revised 2026-09-03).** Hand-materialized from
> the nodes `growth`, `recording`, `unanswered`, `dialogue`,
> `clean-context-review`, `frontier-consistency`, `checkpoint`,
> `alignment-target`, `authority`, `node`, `under`, `projection`,
> `persistence`, `readings`, `review`, `evaluation`, `attention`,
> `delegation`, and `transience` of `commons.systems/disposition-graph`,
> all stamped deferred and unanswered, and from the author's rulings quoted
> on them. This text has no authority of its own.
> Where it conflicts with the graph at `origin/disposition`, the graph wins
> and the conflict is recorded as an un-aligned disposition on the node it
> conflicts with. It is declared as a shim on `growth`. Liquidation: the
> projector materializes this skill from ratified nodes and this file is
> deleted. The principles adopted from the incumbent `/align` on `main` are
> named on `growth`; none of its mechanics are adopted.

Three usages, each a sitting in two stages. `/align <disposition>`, the
disposition in the author's words, records or revises the node that answers
it; its periagogic object is the nodes the disposition would amend and the
implementation their criteria point to, read before anything is changed.
`/align <node id>` runs the sitting on an existing node, to ratify it or to
review its ratification; its periagogic object is the node's page and the
readings under it. `/align` with nothing takes up the highest-ranked
unanswered node (`alignment-target`, §1). A node is one question and its
standing answer; a round is one node. Every node is unanswered until the
author confirms it through this dialogue (`unanswered`): a deferred or
unstamped answer is a draft, and the node carries the dialogue's state
(`dialogue`). A disposition the author states while a sitting is in hand is
queued (§1, the queue) and the sitting continues. The harness finds this
skill only when the session starts in the checkout that carries it.

## 0. Currency and claim

1. Fetch `origin/disposition` and check that the nested worktree
   `disposition/` is at it with a clean tree. Never read the graph before
   this check; a stale or dirty tree stops the round.
2. Reconcile this text to the graph: read the nodes it projects at their
   current text; where a node differs from this file, follow the node and
   record the difference as an un-aligned disposition on it. Apply every
   shim declared on the nodes (the `shims` field: this file, the
   reconciliation skill, `CLAUDE.md`, the harness settings, the review
   instrument on `review`, the rule projections under `.claude/rules/`,
   the published browser, the alignment page) without being asked; bypass
   one only when prompted to.
3. Sessions divide by ref (`work-loop`): this skill writes the
   `disposition` ref and publishes pages, and never commits to the
   implementation ref; rules and the other projections are the
   reconciliation skill's. The worktree is the claim. Landing location is
   never a question for the author: place the node under the question it
   refines, and leave the author's overrule open.
4. Read the open dialogue before opening a new one:
   `node packages/disposition/project.mjs disposition --frontier -` lists
   every node with its status, stamp, `stage`, recommendation, and review
   state, and the alignment page's responses are read with the Artifact
   tool (`read_db`, collection `responses`; a document's id is the node id
   with each `/` replaced by `:`; a document carries `node`, `stage`,
   `ruling` as `confirm`, `edit`, or `deny`, `text`, and `updated`). Act
   on every response before anything else (§5), then resume each sitting
   at its stage.

## 1. Frame

- A node id names a ratification or a review of one; a disposition names
  the nodes it would amend. Either is a sitting, in these movements.
  1. Reading. Point the author to the page at the node's id and to the
     readings under it. Say nothing else.
  2. Periagogic stage, comprehension. One probe per turn, in prose, from
     the page and not from memory. First the answer alone: what the node
     says the thing is for, what it holds only as hypotheses or
     assumptions, whom it is for, and which sentence, if any, the author
     would not have written. Then each reading under it: what relation it
     records, and on what locus. Then the rationale and the rejected
     alternatives. The AI's own account, findings, drafts, and
     recommendations are held back until the author has committed an
     answer to the probe, and then enter only as counterpoint, cited to
     the text by locus. No verdict is in play.
  3. Maieutic stage, intention. What the author means and intends to bind
     is elicited and tested: the three classes of finding, the evaluation
     twice, the steelman alternative from the traditions, the test against
     the record the node joins; then the recommendation, carrying its
     authority class, its boldness, its persistence class, and the
     alternatives, with the three exits open.
  4. Review (`recording`, `clean-context-review`, `frontier-consistency`).
     Before the author sees the recommendation, `/align-review` reads the
     whole unanswered frontier, the sitting's drafts among the rest, in
     one fresh context (§5) and either forwards each draft, with its
     strongest counter-argument when it found one and the session's
     reply, or kicks it back to stage 2 or 3 with findings; a finding
     across nodes kicks back each node it names.
  5. Ruling. The node is put on the alignment page, which lists every
     unanswered node in rank order, this project's graph before the
     public graph and so the purpose node first, each item carrying the
     node's question, its stage, the author's words it rests on with
     their dates, the node as it stands, the draft and the edit it makes
     when the node carries one, the recommendation's class and boldness,
     the alternatives rejected and why, the review's counter-argument and
     the reply when there is one, and the three responses open on any
     subset at once: confirm, confirm with edits, deny with feedback
     (`unanswered`). The author rules there or in prose.
  6. Recording. The response is classified (§5): a confirmation is
     stamped and landed; a confirmation with edits is applied, reviewed
     again when the edits change substance, and stamped; a denial is
     kicked back to the movement it calls for with the feedback recorded
     as the author's words. The follow-up readings, vocabulary, and key
     concepts the sitting surfaced are named in the rationale and derive
     onto the frontier from there.
  The named deviation is putting the AI's account before the author's; when
  it happens, hold the account back and restart the stage. A ratified node
  under review keeps its stamp until the author rules.
- **The queue.** A disposition the author states during a sitting, or a
  node id they name, is supported usage. Record it at once as an
  un-aligned disposition and land it (§6), then continue the sitting in
  hand: a node under the node the disposition would refine, with
  `question`, `stage: periagogic`, a `## Disposition` section holding the
  author's words verbatim and dated, and a `## Proposal` section naming
  what the sitting would amend and its periagogic object; no `## Answer`,
  no stamp. For a node the author names, set `stage` on that node and add
  the `## Disposition` of their words. `stage` names the next movement
  owed, `periagogic`, `maieutic`, `review`, or `ruling`; advance it as the
  movements complete and remove it, with the rest of the dialogue's
  fields, at the recording. The queue is the set of unanswered nodes, in
  rank order; the author's choice of what comes next is a boost
  (`attention`). Nothing about the queue lives in this session, in
  memory, or in scratch (`transience`).
- **Checkpoint** (`checkpoint`). At every transition of a node's stage,
  periagogic to maieutic, maieutic to review, review to ruling, or back by
  a kickback, write the node with its new stage and everything the stage
  carries, validate, and land (§6) before the next movement begins. The
  author's words are written the turn they are said, before anything is
  drafted from them. The record is the dialogue's memory: a session that
  loses its context resumes every node from its stage, and nothing the
  author said is held only in a context. When the graph cannot validate at
  a transition, write the node to the worktree anyway and report the
  failure; never hold it back in context until it can land.
- **The dialogue's state** (`dialogue`) is on the node and nowhere else:
  `stage`; `## Disposition`; `## Draft`, one fenced markdown block holding
  the whole proposed node when the recommendation differs from the node as
  it stands, and absent when the node is its own draft; `recommendation`,
  the `class` a confirmation confers and the `boldness`, required from the
  review stage on; `review`, the clean-context review's `verdict`,
  `strength`, `date`, and `of`, the hash of the draft text it read, which
  the frontier flags when the draft has changed since; and `## Proposal`,
  the account in prose. A ruling-stage node without a forward verdict is
  invalid; a draft changed after its review is sent through the review
  again when the change is substance.
- No argument (`alignment-target`): take the first unanswered node of the
  frontier in rank order, this project's graph before the public graph, and
  run the sitting from the node's stage, repeating no movement behind it,
  up to the author's confirmation, asked for in the interview when the
  author is present and read from the page otherwise. One node at a time;
  the author's choice of another node is a boost or an argument, and the
  session takes the node the author names.
- A question or a requirement: search the graph for a node with the same
  question. A keyword search only shortlists; only reading a node disposes of
  it. Same question, same node, and the round is an edit. A requirement that
  bundles independent questions is several rounds, one node each.
- State the conduct before the dialectic (`growth`).
  Periagogic: the record is authoritative and the author is turned back to
  it; the record at `origin/disposition` is the fixed object, the author
  articulates their account before the AI's appears, and compulsion is
  argument only (Republic VII 518b to d). Maieutic: the answer lives in the
  author, unrecorded; the AI draws it out with visible, refusable drafts
  (Theaetetus 148e to 151d). Run the periagogic conduct first when the
  ground of the question is recorded and not yet the author's own, and take
  the ground, not the decision surface, as its object. The periagogic stage
  is never skipped.

## 2. Interview

- Open matters are prose turns, the reply captured as it is. Bounded
  choices are numbered options with the recommendation first, answered by
  number or "go".
- Every recommendation is presented before anything is recorded, and
  carries the authority class under which it would be accepted (ratified,
  delegated, deferred), a boldness assessment (how much rests on the graph
  and the author's words against the AI's own knowledge), its persistence
  class (standing, shim with its liquidation condition, proposal,
  un-aligned disposition, evidence, or not recorded; a transient
  disposition is a contradiction in terms, see `transience`), and genuine
  alternatives, never the first option re-spelled under another class.
  What the author directs to be recorded is reported with the same three
  facts. Escalate one class toward ratified when being wrong is expensive,
  irreversible, or capture-shaped. Deliver a question's context where the
  author will read it, the alignment page or the prose turn, never the
  AI's own preamble.
- Three exits stay open to the author at all times: amend the record, defer
  (the answer stays deferred, and the deferred stamp is the review queue; a
  deferred reading is a reading node), or claim authority over the AI's
  account or over a tradition, recorded as a divergence. The AI never blocks
  and never withholds recording.
- Evaluate twice (`evaluation`): best judgment, and reference to tradition;
  every tradition surfaced becomes a reading node with source, locus, and
  relation.
- Surface, in both conducts: contradictions within the graph; contradictions
  between the graph and the AI's own knowledge; redundant seams.
- Test the draft against the record it joins, the `under` chain to its
  ceiling and the global-tier nodes, read at `origin/disposition`. A draft
  that contradicts doctrine is not written as an answer; it is a proposal,
  and it opens review of the delegated answer it came from (`authority`).

## 3. Record

- The author's words go into the node in the same turn they are given:
  verbatim and dated in `## Disposition` while the dialogue is open, quoted
  into the rationale at the recording, when `## Disposition` and `stage`
  are removed. The AI's account goes into `## Proposal`: evidence,
  findings, the recommendation with its three facts, the alternatives, the
  review's counter-argument and the reply, and the responses open. A
  `## Proposal` on an answered node is the pending findings of its sitting.
- Write the node: question, form, `under`, the answer, the rationale with
  rejected alternatives and the author's steers, a proposal for anything out
  of scope, `defines` for the terms it defines, an instrument where one
  exists, readings as nodes under it. The record is the sole carrier: a
  decision that is not in the node did not happen. Every decision of the
  round maps to a field, and the round's report states the map.
- Nothing is recorded that was not presented with its authority class,
  boldness, and persistence class, except at the author's direction, and
  then the report states them.
- Stamp `deferred`, `by: claude`, dated, within the AI's scope; `ratified`
  only at a recording (§5). An edit reconciles the whole node, not one
  sentence.
- Every node the round touched or cited has its stamp checked; a node with
  none is an un-aligned disposition or a proposal, never an answer.

## 4. Project

Run `node packages/disposition/validate.mjs disposition`, then
`node packages/disposition/project.mjs disposition --out dist/browser/index.html`,
and publish the page to the address in the shim declared on `projection`.
The page at the node's id is what the author reads; the file is not. Then
`node packages/disposition/project.mjs disposition --alignment dist/alignment/index.html`
and publish it, with the `db` capability, to the address in the shim
declared on `growth`; the author rules on it, and the responses are read
back as in §0. When a global-tier node changed, say so in the report: the
rule projections are regenerated by the next reconciliation run, not here.

## 5. Review, ruling, and recording

- Ratification is the outcome of the dialectic, never a command. Before
  asking for it, the session has stated the conduct, put the author's own
  account before the AI's, surfaced the three classes of finding,
  evaluated twice, tested the draft against the record it joins, and
  mapped every decision of the round to a field. The recommendation to
  ratify carries its boldness assessment and the alternatives, and the
  three exits stay open.
- **Review in clean context**, before the author sees a recommendation.
  Set `stage: review` on each recommended disposition of the round, land
  (`checkpoint`), and invoke `/align-review` (`clean-context-review`,
  `frontier-consistency`): one batch over the whole unanswered frontier,
  every node with a stage, the round's drafts among the rest, read by one
  fresh subagent (opus, high effort), never a fork, in one context, whose
  brief carries nothing but the record and the validations the
  frontier-consistency node lists: on each draft, whether it answers the
  question and the author's words, contradicts the record it joins or a
  tradition it cites without recording the divergence, states the facts to
  present, names shims that exist, would lead an executor to a wrong
  action, and what the strongest argument against it is; across the
  frontier, contradiction, supersession, redundancy, decomposition,
  vocabulary, cross-reference, placement and order, and coverage of the
  author's words. The subagent reports, per draft, forward or kick back
  with findings and the stage they name, plus the counter-argument when it
  found one worth the author's time, and the frontier's findings, each
  naming its nodes and recommending their stage with the edit, merge, or
  split it proposes; it writes nothing. One batch runs at a time: wait
  for any review already running. Apply each verdict on its own: a
  kickback sets `stage` and appends the findings to `## Proposal`; a
  forward sets `stage: ruling`, writes `review` with the verdict, the
  strength, the date, and the hash of the draft it read, and puts the
  item on the page with the counter-argument and the session's reply, or
  with the note that the review found no strong counter-argument; a
  frontier finding kicks back each node it names with the finding and the
  proposed edit appended, and a merge or split is put to the author as a
  proposal, never done by the session. A disposition still in review
  never holds one that was forwarded.
- **Classify the response** (`recording`, `unanswered`). `confirm`:
  record, ratified, or delegated where the author's words delegate it.
  `edit`: apply the author's edits to the draft; when they change
  substance, send the draft through the review again and put it back for
  confirmation; otherwise record with the edits, the author's words being
  the ruling. `deny`, or prose that is neither: decide where the dialogue
  resumes and set `stage` to it: `periagogic` when the response shows the
  author has lost hold of the record's ground (asking for what the record
  forbids for a reason they have not engaged, contradicting an ancestor
  they have not cited); `maieutic` when the response is ambiguous while
  the AI's understanding of the ground is complete; `ruling` in the common
  case, the draft refined with the feedback and put back for
  confirmation. Leaving a node unconfirmed is the deferral; an overrule is
  drafted as what the author said stands, reviewed, and put back for
  confirmation. A confirmation on a node whose review has not run is held
  until the review runs and recorded when it forwards.
- **Record.** Write the stamp (`ratified`, `by: <the author's name>`,
  dated, with the ruling quoted and dated in the rationale; a ratified
  stamp whose ruling is not in the record is invalid; or `delegated`),
  copy the draft into the node when it carries one, remove `stage`,
  `recommendation`, `review`, `## Draft`, and `## Disposition`, validate,
  and land.
- Steer: amend the node; the steer enters the rationale as a rejected
  alternative or an amendment; project again.
- The author's choice of the next node is a boost (`attention`).

## 6. Land

From `disposition/`: validate, `git commit`, `git push origin disposition`.
If the push is rejected, fetch, rebase, validate, and push again. No pull
request: a graph landing is reviewed by the clean-context review and by the
interview that produced it (`review`). This skill never commits to the
implementation ref; materialized implementation is the reconciliation
skill's.

## 7. Self-review

Before the round closes, review the recorded output adversarially
(`evaluation`) and report the map of decisions to fields. The state of the
work is the nodes and the git log: there is no ledger and no round log,
and nothing essential is kept in memory, scratch, or this session. After
compaction, run §0.

## Model and delegation

The interview is not delegable and runs on the main thread; the author's
default model for the alignment skill is fable (`claude --model fable`).
Everything mechanical (validation, projection, publication, surveys,
tooling) and every investigation whose context is verbose (debugging,
driving a browser, reading logs or transcripts, reading a page in full
before publishing it) is a subagent unit under `delegation`; the main
thread reads the conclusion, never the context.
