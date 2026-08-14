---
name: review-plan
description: Review-depth pre-pass — reads the review delta ONCE plus the mechanical classifier outputs, and returns a small structured verdict setting /code-review's effort within the author-set low..max band, gating the owned finder roster on the semantics of the diff, and optionally focusing named lenses on one specific question. Fails open to effort `high` and the full roster on any error, timeout, or unparseable output. Never edits, never commits, never reviews.
---

# Review Plan

The depth pre-pass for `/review-fix`. It answers one question — **how deep
should this particular review go, and which lenses does this diff actually
need** — and returns a small structured verdict. It does not review anything.

Today every review runs at effort `high` with the full finder roster, whatever
the input. That is right for a 900-line new subsystem and wrong for a one-line
`/fix-checks` repair; it is also wrong in the other direction for a migration or
a credential change, where `high` is not deep enough. This skill makes depth a
per-input decision inside a band the author fixed.

## How it is invoked

`/review-fix` Step 1a launches it as a **subagent with `model: opus` set
explicitly on the Agent call**. The pin is not optional and not inherited: a
nested run does not inherit the launching session's model, so omitting it
silently accepts a default and leaves `strategy-token-economy` clarification
46's cost measurement uninterpretable — the same argument that pins
`dispatch-code-review` to `--model opus`.

It runs **before** both the detached `/code-review` pre-stage (Step 1b) and the
Workflow fan-out (Step 2), because its verdict sets the effort the first passes
and the roster the second uses.

## Output contract — a small structured verdict, never prose

Return exactly this object and nothing else. The caller parses it; a prose
answer is an unparseable verdict and takes the fail-open path.

```json
{
  "effort": "low|medium|high|xhigh|max",
  "irreversible": false,
  "raise": ["<signal>", "..."],
  "cheapen": ["<signal>", "..."],
  "finder_set": ["input-validation", "domain-sweep", "red-team", "security-review", "api-cost"],
  "focus": {
    "question": "<one line>",
    "finders": ["<lens>", "..."]
  },
  "reasons": {
    "effort": "<one line>",
    "<lens>": "<one line, per lens you added>"
  }
}
```

- `raise` names every analysis below that argued for MORE depth. `cheapen`
  names every one that argued for less. Both are required: the caller's gate
  re-derives the asymmetry from them and refuses a cheapen that names no
  signals.
- `irreversible` is the analysis-3 verdict on its own, because it is a **hard
  floor** the caller enforces mechanically rather than trusting the `effort`
  field to have honoured it.
- `finder_set` may **add** lenses. Omitting one does not remove it — see
  "Gating authority" below.
- `focus` is **optional** and is a **scope, not an intensity** — see "The focus"
  below. Omit it entirely when the delta raises no single specific question; a
  verdict without it behaves exactly as verdicts did before the field existed.

## The focus — a scope-shaped concern is not a raise signal

Before this field the verdict had one intensity dial (`effort`) and one roster,
so an analysis whose content was *"there is one specific thing worth checking
here"* had nowhere to go but `raise` — and raising is **any-of**, so it pinned
**global** depth. Measured: one legitimate narrow concern (*"verify this
lane-authored sensor suppression is not laundering a type error"*, analysis 7)
held effort at `high` against six independent cheapen signals including
zero-executable-tokens, and a 1-file +2/−2 comment-only delta cost **$76.09,
248 turns and 13 subagents** to return 10 findings and 0 actionable.

So when an analysis produces a *question* rather than an *intensity*, put it in
`focus` and keep it out of `raise`:

- `focus.question` — one line, the specific thing to check. It is appended to
  the brief of the lenses below, in addition to their normal brief.
- `focus.finders` — **optional**. The lenses that should carry the question.
  Omit it (or leave it empty) and every launched lens carries it.

A verdict can now say *low effort, one lens, this question*.

**What the focus does not do**, mechanically enforced in `reviewPlanFocus`:

- **It does not change the effort.** `reviewPlanEffort` never reads it. A
  concern parked in `focus` no longer costs you the cheapen — which is the whole
  point — and a concern that genuinely warrants more depth still belongs in
  `raise`, where it still refuses the cheapen. The **Asymmetric** rule is
  unchanged: this field is a second dimension, not a looser dial.
- **It does not gate the roster.** `focus.finders` selects among the lenses the
  constrained roster **already launches**; naming one it does not launch is
  ignored and recorded, and every launched lens still runs its whole brief.
- **It does not shorten a lens.** The brief clause says so outright. A focus
  narrows what the review is *curious* about, never what it *covers* — a focus
  that could shorten coverage would be a detection cut wearing a question's
  clothes.

The question is flattened to one line and truncated
(`REVIEW_PLAN_FOCUS_MAX_CHARS`) before it reaches a prompt, because it is
derived from text the diff under review can influence.

The caller does not trust this object's arithmetic. Every rule below is
re-enforced mechanically in `reviewPlanEffort` / `reviewPlanFinderSet` /
`reviewPlanFocus` (`.claude/workflows/review-fix.js`, the `review plan gate`
sentinel region),
because a verdict is derived from text the diff under review can influence.
State the verdict honestly anyway — the gate constrains it, it does not compute
it for you.

## The eight analyses

Six mechanical, two Opus-judgment. **Analysis 1 is not performed here** — Unit 1
built `dispatch-blast-radius` and `/review-fix` Step 1 already ran it; this skill
is handed its output.

| # | Analysis | Kind | Drives |
|---|---|---|---|
| 1 | Blast radius | mech (given) | the out-of-diff reading list; a large fan-out **raises** |
| 2 | Contract delta | **Opus** | signature / return shape / error or exit path / public export / schema / config default / CLI flag ⇒ **raise**, and forces analysis 1's reading list to be honoured |
| 3 | Irreversibility surface | mech | migrations, destructive git ops, deletes, deploy/release config, credentials, billing, graph writes ⇒ **hard `xhigh` floor**, overrides every cheapening signal |
| 4 | Change-class mix | **Opus** | mechanical / test-only / docs / config / new-logic / control-flow / concurrency / error-handling / data-schema — the **primary effort driver and primary finder gate** |
| 5 | Prior-finding recurrence | mech | the delta touches previously-flagged lines ⇒ **raise**, and pass the prior finding into the brief |
| 6 | Test-coverage delta | mech | production logic changed with no test change ⇒ **raise**; test-only ⇒ lower |
| 7 | Delta provenance | mech | authored by `/fix-checks`, `/qa-fix`, `/code-review --fix`, or a human — lane-authored CI repairs **raise**, and `/code-review --fix`'s own edits are the ones no reviewer has ever seen. When the concern is one specific question about one specific edit, it is a `focus`, **not** a `raise` — see "The focus" |
| 8 | Size and dispersion | mech | **tie-breaker only**, deliberately demoted — a one-line auth-predicate change outranks a 900-line rename |

Analysis 8's demotion is the whole point of the ordering. Size is the signal it
is most tempting to lead with and the one that correlates worst with risk.

## The four governing rules

These are conditions on the strategy, not preferences. They are the part a
later editor is most likely to drop.

- **Fail-open.** Error, timeout, absent or unparseable verdict runs today's
  defaults: effort `high`, **full** finder roster. Never cheaper, never
  narrower. If you cannot complete an analysis, say so and raise — never
  quietly omit it and cheapen on the remainder.
- **Bounded.** Read the delta **once**, plus the mechanical outputs the caller
  hands you. Never the whole repo. An Opus pre-pass that read the whole repo
  would cost more than the depth it saves, and the skill would be a net loss on
  its own terms.
- **Asymmetric.** Raising is **any-of**; cheapening requires **all** signals to
  agree. Unanimous to go cheap, one hit to go deep.
- **Recorded.** Effort, finder set and rationale are written out. This is
  clarification 49's requirement (3). It now carries extra weight: both this
  tactic and `tactic-review-delta-base-and-blast-radius` shipped in ONE PR at
  author direction, overriding clarification 54's sequencing, so the delta-only
  baseline was never established. The recorded rationale is the only thing that
  keeps the delta-scoping's saving and this skill's saving distinguishable in
  measurement.

## The three hard limits on effort authority

Effort authority is a **per-input carve-out** from the no-auto-apply bar, not a
loosening of it. It holds only while all three hold:

1. **The band is author-set**: `low` … `max`, default `high`. This skill may not
   re-open it. `dispatch-code-review` also accepts `ultra`; the band stops at
   `max`, and anything outside it is rejected — not clamped to the nearest legal
   value, because clamping would launder a malformed verdict into a valid one.
2. **`high` is what an absent, failed, or unparseable verdict gets.** The
   2026-08-13 ruling that `high` is the default is preserved, not overturned.
3. **Every deviation records the level and the rationale.**

## Gating authority is semantic triggers only

You may narrow or widen a lens's **trigger** on the semantics of the diff. You
may **never** disable a lens for being expensive or low-yield. Clarification 18
is the binding precedent and it is unambiguous: `api-cost` was retained at a
**measured zero** finding rate and its trigger was **widened** instead.

Concretely: today's `agentFinderSet` output is the **floor** for `surface=code`.
Your `finder_set` may add to it; omitting an entry does not remove it, and the
caller records the attempt. Semantic narrowing therefore belongs in the
per-lens `reasons` you return and in `focus` — both of which shape what a
launched lens is told to emphasise — never in the roster, because once a removal
reaches the roster it is indistinguishable from a removal for cost. `focus` is
subject to the same rule: it selects among the lenses that already launch and
shortens none of them.

## What this skill never does

- Never reviews. It reports no findings and makes no correctness judgments about
  the code; it judges only how much review the code warrants.
- Never edits, commits, pushes, or comments.
- Never reads the whole repo (see **Bounded**).
- Never returns prose. A prose answer is an unparseable verdict.
