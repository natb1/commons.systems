---
id: tactic-lane-instrument-substitution-guard
kind: tactic
statement: Fail a dispatch lane that cannot invoke its named instrument, instead
  of letting the agent substitute itself and report under the instrument's name
owner: ai
status: raw
parent: null
rationale: Surfaced by the 2026-07-31 /code-review investigation. Across 18
  review-fix runs every Skill(code-review) call was rejected with
  disable-model-invocation; the finder agent substituted its own review and the
  workflow reported the result as the built-in's output, undetected for four
  days, and a strategy divergence was recorded on it. This is the generic guard,
  independent of the review rewiring. See the substitution-invariant
  clarification on strategy-graph-native-dispatch and clarification 25 on
  strategy-token-economy.
reading: null
gap: null
serves:
  - strategy-graph-native-dispatch
  - strategy-token-economy
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: null
execution: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---

# Fail a dispatch lane that cannot invoke its named instrument, instead of letting the agent substitute itself and report under the instrument's name

## Context

On 2026-07-31 an investigation found that `/code-review` had **never run** in
the review-fix workflow. Across 18 runs (2026-07-27 to 07-31) every
`Skill(skill: "code-review")` call was rejected:

```
<tool_use_error>Skill code-review cannot be used with Skill tool due to
disable-model-invocation</tool_use_error>
```

40 rejection events across the workflow corpus, 19 of 20 finder transcripts.
The finder agent read the rejection and wrote:

> The built-in `/code-review` skill is not model-invocable in this
> environment. I'll perform the review directly at max effort.

It then ran ~39 tool calls of its own review, and the workflow reported that
output under the built-in's name. Nothing detected it for four days. A
strategy divergence (`strategy-token-economy` clarification 21) was recorded
on the strength of a "$2.31 per applied fix, highest yield of any stage"
figure that in fact measured our own agent.

The agent's substitution was locally reasonable — it was told to review, the
instrument was unavailable, so it reviewed. The defect is that **the pipeline
had no way to tell the difference**, and the substituted output entered a
strategy decision wearing the instrument's name.

## Invariant being encoded

Recorded as a clarification on `strategy-graph-native-dispatch` the same day:

> A lane that cannot invoke its named instrument fails the lane. It never
> substitutes an ad-hoc equivalent, and never reports substituted output under
> that instrument's name.

Scope, per the 2026-07-31 interview: **every named instrument** a lane
delegates to — a vendor skill, one of our own scripts, an external service —
not only vendor instruments. The failure mode is not vendor-specific; an agent
directed to run one of our scripts can hand-roll it just as readily.

Doctrinal ground: `virtue-progressive-detachment` — *"the capability to read,
evaluate, and reason about what the delegatee produces is the floor under
every recovery path."* What failed was not skill atrophy but the absence of any
check that the delegatee produced anything at all. An unexercised delegation is
a hope, not a delegation.

## Scope

Two complementary halves. Unit 1 is the general mechanism; Unit 2 is the
narrow, cheap check that would have caught this specific instance on day one.

### Unit 1 — instrument invocation is verified, not narrated

Where a workflow stage's contract is "invoke instrument X", success must be
established mechanically rather than taken from the agent's account:

- an exit status or a tool result that is not an error, **and**
- an output signature consistent with that instrument.

On failure the stage fails. It does not degrade, retry with a substitute, or
return partial results under the instrument's name. Per
`strategy-graph-native-dispatch`'s standing park-context condition, the park
carries the rejection text as its recorded reason.

### Unit 2 — a finder may not silently replace its own contract

The subagent prompts that name an instrument must state that an unavailable
instrument is a **terminal** condition for that agent, and that performing the
work itself is not an acceptable fallback. Today's `finderPrompt`
(`.claude/workflows/review-fix.js:454`) says only "Invoke the built-in
`/code-review` skill via the Skill tool", which leaves the fallback to the
agent's judgment.

## Out of scope

- Rewiring `/code-review` onto its working entry point — that is
  `tactic-review-code-review-invocation-contract`. **This node should land
  first**: it is what makes a rejected invocation loud, and it holds while the
  rewiring is in flight.
- Ordinary fallbacks that are *designed and recorded* (e.g. a documented
  retry-then-degrade path) stay legitimate. The invariant targets undeclared
  substitution, not every fallback.

## Reuse

- `.claude/workflows/review-fix.js` — `finderPrompt` (line 450) and the
  `phase('finders')` fan-out (line 540) are the first application site.
- The rejection string to detect while any Skill-tool invocation remains:
  `cannot be used with Skill tool due to disable-model-invocation`.

## Verification

- Induce an unavailable instrument (rename the skill or the command) and
  confirm the lane **fails or parks** rather than returning findings.
- Confirm the park reason carries the underlying error text.
- Scan a window of workflow subagent transcripts for the rejection string and
  confirm no occurrence is followed by findings from the same agent. This is a
  judgment check against live transcripts, not a source-tree grep — the string
  appears in tool results, never in committed code, so a repo grep would assert
  nothing.
- A sensor reading for `strategy-token-economy` clarification 25: no yield
  metric is credited to an instrument whose invocation was not verified.
