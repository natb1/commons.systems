---
name: align
description: Record or revise one node of the disposition graph by interview with the author. Bootstrap shim, hand-projected from the deferred schema nodes; the graph wins on conflict.
---
# Align

> **Shim notice (2026-09-02, ledger L15).** Hand-materialized from the nodes
> `growth`, `authority`, `node`, `under`, `projection`, `persistence`,
> `readings`, `review`, `evaluation`, and `attention` of
> `commons.systems/disposition-graph`, all stamped deferred, and from the
> author's rulings on `LEDGER.md`. This text has no authority of its own.
> Where it conflicts with the graph at `origin/disposition`, the graph wins
> and the conflict is recorded as a proposal on `disposition-graph/bootstrap`.
> Liquidation: the projector materializes this skill from ratified nodes and
> this file is deleted. The principles adopted from the incumbent `/align` on
> `main` are named in `bootstrap/align-survey.md` section B; none of its
> mechanics are adopted.

Two usages (ledger L33). `/align <disposition>`, the disposition in the
author's words, records or revises the node that answers it. `/align
<node id>` runs the same dialectic on an existing node, to ratify it or to
review its ratification. A node is one question and its standing answer; a
round is one node. In the bootstrap
session the loop is run by reading this file; in a session rooted at the
`greenfield` worktree it is the skill.

## 0. Currency and claim

1. Fetch `origin/disposition` and check that the nested worktree
   `disposition/` is at it with a clean tree. Never read the graph before
   this check; a stale or dirty tree stops the round.
2. Reconcile this text to the graph: read the nodes it projects at their
   current text; where a node differs from this file, follow the node and
   record the difference as a proposal on `bootstrap`. Apply every declared
   shim (this file, `CLAUDE.md`, the review instrument named on `review`,
   the rule projections under `.claude/rules/`) without being asked; bypass
   one only when prompted to.
3. The worktree is the claim; during bootstrap there is one writer. Landing
   location is never a question for the author: place the node under the
   question it refines, and leave the author's overrule open.

## 1. Frame

- A node id names a ratification or a review of one: a sitting in two
  separated stages (ledger L34). Comprehension first: the author
  articulates what the node and the readings under it say, before the AI's
  account enters as counterpoint; probes cite the text by locus; no
  verdict, draft wording, or recommendation is in play. Intention second:
  what the author means and intends to bind is elicited and tested, the
  three classes of finding and the tradition evaluation enter, and the
  ruling is taken. Each sitting names the follow-up readings, vocabulary,
  and key concepts it surfaced; they enter the frontier as deferred
  readings. A ratified node under review keeps its stamp until the author
  rules.
- A question or a requirement: search the graph for a node with the same
  question. A keyword search only shortlists; only reading a node disposes of
  it. Same question, same node, and the round is an edit. A requirement that
  bundles independent questions is several rounds, one node each.
- No argument: the onboarding walk. Open the browser at
  `commons.systems/disposition-graph/purpose`, run the validator, and walk
  the author to one question in their own words, in prose, one question at a
  time.
- State the conduct before the dialectic (`growth`, ledger L35).
  Periagogic: the record is authoritative and the author is turned back to
  it; the record at `origin/disposition` is the fixed object, the author
  articulates their account before the AI's appears, and compulsion is
  argument only (Republic VII 518c to d). Maieutic: the answer lives in the
  author, unrecorded; the AI draws it out with visible, refusable drafts
  (Theaetetus 148e to 151d). Run the periagogic conduct first when the
  ground of the question is recorded and not yet the author's own, and take
  the ground, not the decision surface, as its object.

## 2. Interview

- Open matters are prose turns, the reply captured as it is. Bounded
  choices are numbered options with the recommendation first, answered by
  number or "go".
- Every recommendation carries the authority class under which it would be
  accepted (ratified, delegated, deferred), a boldness assessment (how much
  rests on the graph and this session's record against the AI's own
  knowledge), and genuine alternatives, never the first option re-spelled
  under another class. Escalate one class toward ratified when being wrong
  is expensive, irreversible, or capture-shaped. Deliver a question's
  context where the author will read it, the page or the prose turn, never
  the AI's own preamble.
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

- Write the node: question, form, `under`, the answer, the rationale with
  rejected alternatives and the author's steers, a proposal for anything out
  of scope, `defines` for the terms it defines, an instrument where one
  exists, readings as nodes under it. The record is the sole carrier: a
  decision that is not in the node did not happen. Every decision of the
  round maps to a field, and the round's report states the map.
- Stamp `deferred`, `by: claude`, dated, within the AI's scope; never
  `ratified`. An edit reconciles the whole node, not one sentence.
- Every node the round touched or cited has its stamp checked; a node with
  none is an unanswered question or a proposal, never an answer.
- During bootstrap, append the author's doctrine to `LEDGER.md` in their
  words, in the same turn it is given.

## 4. Project

Run `node packages/disposition/validate.mjs disposition`, then
`node packages/disposition/project.mjs disposition --out dist/browser/index.html`,
then publish the page to the address recorded on `projection`. The page at
the node's id is what the author reads; the file is not.

## 5. Ratify or steer

- Ratification is the outcome of the dialectic, never a command. Before
  asking for it, the session has stated the conduct, put the
  author's own account before the AI's, surfaced the three classes of
  finding, evaluated twice, tested the draft against the record it joins,
  and mapped every decision of the round to a field. The recommendation to
  ratify carries its boldness assessment and the alternatives, and the
  three exits stay open.
- When the author rules to ratify, the session writes the stamp
  `ratified`, `by: <the author's name>`, dated, quotes the ruling with its
  date in the node's rationale, validates, and lands. A ratified stamp
  whose ruling is not in the record is invalid (`authority`).
- Steer: amend the node; the steer enters the rationale as a rejected
  alternative or an amendment; project again. A steer that states doctrine
  goes on the ledger.
- The author's choice of the next node is a boost (`attention`).

## 6. Land

From `disposition/`: validate, `git commit`, `git push origin disposition`.
If the push is rejected, fetch, rebase, validate, and push again. No pull
request: a graph landing is reviewed by the interview that produced it
(`review`). Materialized implementation lands on `greenfield` after tests;
the review instrument's assessment is owed once the disposition it
materializes is ratified, and for everything before exit (`review`).

## 7. Self-review and ledger

Before the round closes, review the recorded output adversarially, record
the result in the round log in `CLAUDE.md`, and close the ledger entries the
round disposed of.

## Model and delegation

The interview is not delegable and runs on the main thread; the author's
default model for the alignment skill is fable. Everything mechanical
(validation, projection, publication, surveys, tooling) is a subagent unit
under the token-efficiency rule in `CLAUDE.md`.
