---
id: tactic-reading-chunk-34-adas-harness-search
kind: tactic
statement: "Reading chunk 34 (candidate): ADAS / Meta Agent Search and the
  context-rot structure result -- automated harness search as a rival to the
  graph's hand-authored improvement loop"
owner: human
status: raw
parent: tactic-tradition-reading-program
rationale: "Born parked 2026-08-11 from the /rsi-research dry run, as the
  disposition condition 13 on strategy-recursive-self-improvement prescribes for
  a finding whose claimed effect cannot be stated in terms this harness's
  sensors observe. Two findings from the dry run are reading-worthy and not
  draftable as tactics. ADAS's Meta Agent Search automatically discovers agent
  designs -- prompts, tool use, workflows -- that beat hand-designed agents and
  transfer across domains; that is a rival conception of what a self-improvement
  loop is for, and the graph's whole improvement mechanism is hand-authored
  intention. There is no metric in this harness that would confirm or refute 'we
  should be searching designs instead', so it is an author question, not a
  hypothesis. The context-rot result rides along because it is equally
  unactionable and equally worth sitting with: across 18 frontier models,
  reliability degrades as context grows with difficulty held constant, and all
  18 performed better on shuffled/incoherent context than on coherent,
  well-structured context -- which cuts against the assumption that carefully
  structured context is what a harness should be optimizing for."
reading: null
serves:
  - strategy-complete-grounding
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: null
execution: null
validates:
  - strategy-complete-grounding
blocked_by: []
office_hours:
  reason: "See tactic-tradition-reading-program, shared chunk office-hours reason
    (candidate-tradition). This chunk: ADAS / Meta Agent Search against the
    hand-authored improvement loop on strategy-recursive-self-improvement, and
    the context-rot structure result against the harness's context-management
    assumptions. Surfaced by the 2026-08-11 research-lane dry run; parked rather
    than drafted because neither claimed effect is statable in terms this
    harness's sensors observe."
  since: 2026-08-11
  recommendation: null
  session_type: curriculum-review
pace_exempt: false
rounds: null
attributes:
  curriculum:
    priority: 34
    candidate: true
---
# Reading chunk 34 (candidate): ADAS / Meta Agent Search and the context-rot structure result -- automated harness search as a rival to the graph's hand-authored improvement loop

## Why this is a chunk and not a tactic

Condition 13 on `strategy-recursive-self-improvement` (2026-08-11) routes a
finding whose claimed effect **cannot be stated in terms this harness's sensors
observe** to a born-parked candidate chunk for an author sitting, rather than
into the execution path. Two findings from the 2026-08-11 research dry run
qualify. Neither is weak — both are high-confidence — and neither is
falsifiable here.

Per the chunk convention this is **passages and questions only, never a
summary**; and it is a *candidate* — promotion to
`tradition-agentic-engineering`'s ratified `texts` is the author's, never the
lane's.

## Source 1 — ADAS / Meta Agent Search

**The claim.** Meta Agent Search automatically discovers agent designs — prompts,
tool use, orchestration code — that beat hand-designed agents and transfer
across domains. Meta-optimizing the harness itself is a working technique
(high confidence on the core claim).

**The adversarial result that constrains it.** The sub-claim that a discovered
design's advantage *transfers when the underlying model is swapped* was tested
separately and **refuted 0-3**. A design good for one model does not reliably
carry its edge to another — treat "harness search generalizes across models"
with more caution than ADAS's own abstract implies.

**Why it is not draftable.** This is a rival conception of what a
self-improvement loop is *for*. The graph's entire improvement mechanism is
hand-authored intention passing through an author dialectic; ADAS proposes
search over designs. No metric in this harness would confirm or refute "we
should be searching designs instead of authoring intentions" — the question is
about what the loop is, not about an effect it produces. That makes it an author
question.

**Questions for the sitting.**
- Is hand-authored intention a commitment this graph makes on principle
  (`virtue-progressive-detachment`, the author dialectic in `/align`), or an
  accident of not having tried search?
- If a searched design outperformed an authored one, what in the graph would
  even record that? Would it be a win?
- The cross-model transfer refutation bites hardest exactly where this harness
  lives — models change under it continuously. Does that make search less
  attractive here than in the paper's setting, or does it just mean re-searching?

## Source 2 — context rot and the structure result

**The claim.** Across 18 frontier models (GPT-4.1, Claude 4, Gemini 2.5, Qwen3),
reliability degrades as context grows **with task difficulty held constant** —
so length alone costs accuracy. And, counterintuitively, all 18 performed
*better* on shuffled/incoherent context than on coherent, well-structured
context. (Anthropic engineering blog + Chroma Research, high confidence.)

**Why it is not draftable.** The first half is already actionable and is drafted
elsewhere — `tactic-dispatch-observation-masking` and
`tactic-dispatch-cache-preserving-context` both act on context volume. The
second half is the problem: it cuts against the assumption that carefully
structured context is what a harness should optimize for, and this graph invests
heavily in structure (rendered plans, skill prose, node bodies, the whole
clean-session-executable plan doctrine). There is no experiment available here
that would tell the author whether that investment is helping or quietly
hurting, and "structure your context worse" is not a change anyone should make
on one result.

**Questions for the sitting.**
- Is the structure this graph invests in aimed at the *model's* reliability, or
  at the *author's* comprehension? If the latter, the finding may not bear on it
  at all — and that distinction is not currently recorded anywhere.
- The clean-session-executable plan doctrine assumes a well-structured plan
  reads better than a pile of context. Does the finding challenge that, or is
  plan-following a different task than the one measured?
- If coherence is not what helps, what is the structure buying?
