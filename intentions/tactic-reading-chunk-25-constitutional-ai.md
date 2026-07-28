---
id: tactic-reading-chunk-25-constitutional-ai
kind: tactic
statement: "Reading chunk 25: Constitutional AI sections 1, 3-4 (Bai et al.
  2022) — verify the AI-alignment correspondence on the delegatee-education
  doctrine"
owner: human
status: codified
parent: tactic-tradition-reading-program
rationale: "Authored in the 2026-07-09 /align-strategy second round
  (interview-types ground exploration): the author accepted the AI-alignment
  correspondence — the graph-as-constitution, RLHF/RLAIF as the vendor
  habituation the delegatee-education doctrine grafts onto, adversarial
  bias-cancellation paralleling debate, and the amend/defer/diverge exits as a
  corrigibility design — as a deferral to Claude's internal knowledge of the
  field. Constitutional AI (Bai et al. 2022, arXiv:2212.08073) is the grounding
  text: sections 1.2 and 3 for the constitution steering behavior, section 4 for
  RLAIF; no single ~30-minute text covers all four limbs, so the chunk carries
  two secondary citations — AI safety via debate (Irving, Christiano, Amodei
  2018, arXiv:1805.00899) for the adversarial limb and Corrigibility (Soares,
  Fallenstein, Yudkowsky, Armstrong, AAAI-15 workshop) for the exits.
  Verify-style chunk: reviews the deferral recorded on strategy-explicit-intent
  and delegation-philosophical-articulation; on ratification the sitting decides
  whether the correspondence merits a tradition record; on contradiction the
  reading wins. Not claude-executable — the author is reviewing a correspondence
  Claude itself asserted from field knowledge; delegating the review would
  recreate the capture."
reading: null
gap: null
serves:
  - strategy-philosophical-grounding
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: null
execution: null
validates:
  - strategy-philosophical-grounding
blocked_by: []
office_hours:
  reason: "See tactic-tradition-reading-program → shared chunk office-hours reason
    (verify-record; type-b conduct). This chunk: Constitutional AI (Bai et al.
    2022, arXiv:2212.08073) sections 1, 3-4 against the 2026-07-09 AI-alignment
    correspondence clarification on strategy-explicit-intent and the
    delegated-scope entry on delegation-philosophical-articulation; amend or
    ratify the correspondence clarification; on ratification decide whether the
    correspondence merits a tradition record (the parsimony question deferred at
    record time)."
  since: 2026-07-09
  recommendation: null
  session_type: curriculum-review
pace_exempt: false
rounds: null
attributes:
  curriculum:
    priority: 17
    passages:
      - work: "Bai et al., Constitutional AI: Harmlessness from AI Feedback
          (arXiv:2212.08073)"
        range: sections 1, 3-4
---
# Reading chunk 25: Constitutional AI sections 1, 3-4 (Bai et al. 2022) — verify the AI-alignment correspondence on the delegatee-education doctrine

One curriculum chunk: ~30 author-minutes of independent reading; the review
session may span office-hours sittings (2026-07-08 session-bounds
clarification on `strategy-philosophical-grounding`). Chunk 25 of
`tactic-tradition-reading-program`, curriculum priority 17 — directly after
the deferral-review chunks (dialectic-method 13, sun-line 14, Protagoras 15,
Phaedrus 16), before the candidate batch (shifted to 18-25). Verify-style:
reviews a live deferral recorded 2026-07-09 (second round).

## Text

Primary: Bai et al., *Constitutional AI: Harmlessness from AI Feedback*
(2022, arXiv:2212.08073), sections 1, 3-4 — the constitution as a written
set of natural-language principles steering model behavior (1.2, 3, with
the principle list in the appendices), and RLAIF (4): AI preference labels
derived from the principles, distilled into a preference model the policy
is trained against.

Secondary citations (the limbs no single ~30-minute text covers): Irving,
Christiano, Amodei, *AI safety via debate* (2018, arXiv:1805.00899) — the
adversarial limb; Soares, Fallenstein, Yudkowsky, Armstrong,
*Corrigibility* (AAAI-15 workshop on AI and Ethics) — the exits limb. Read
if the sitting has time; otherwise the review may bound its verdict to the
limbs the primary text grounds and leave the rest held.

## Questions to re-open against the text

This chunk reviews a correspondence Claude asserted from its own field
knowledge — the 2026-07-09 AI-alignment correspondence clarification on
`strategy-explicit-intent`:

- Does the constitution correspondence hold as recorded — is the graph
  injected into sessions doing what the paper's principles do (steering
  behavior by written natural-language principles), or does the analogy
  break somewhere that matters (e.g. the graph is consulted, not trained
  into weights)?
- Does section 4 support reading RLHF/RLAIF as the "vendor habituation" the
  delegatee-education clarification grafts onto — reinforcement as the
  mechanism that bakes dispositions in?
- The adversarial limb (parasite biases pitted against one another ~
  debate) and the exits limb (amend/defer/diverge ~ corrigibility) rest on
  the secondary texts — do they hold, or are they Claude glosses stretched
  over a looser fit?
- The parsimony question deferred at record time: does the correspondence
  merit a `tradition-*` record (reading-verified, with
  adopted/diverged/chosen_over structure), or does the single clarification
  suffice?

## Completion

- This review is the deferral review: amend or ratify the AI-alignment
  correspondence clarification on `intentions/strategy-explicit-intent.md`
  and the delegated-scope entry on
  `intentions/delegation-philosophical-articulation.md` — the reading wins.
- On ratification: decide the tradition-record question above; record the
  decision as a dated clarification either way.
- Record any reading-wins catch as a dated `divergence.contradictions`
  entry on the delegation; stamp `last_exercised`.
- Run the persistence check: durable outcomes on durable nodes; this chunk
  node must be prunable without loss before `phase: done`.
- The completed chunk counts toward strategy-philosophical-grounding's
  signal; land all node edits via `graph-commit`, which also clears this
  node's park.
