---
id: tactic-review-skill-body-decomposition
kind: tactic
statement: Decompose the review-fix skill body — return a compact index instead
  of a 26-63k-char summary, push terminal actions into subagents, and script the
  repeated git/grep probes
owner: ai
status: raw
parent: null
rationale: Surfaced by the 2026-07-31 review-fix token audit interview. The
  parent review worker averaged 184,468 peak context with 14 of 19 sessions over
  150k, while every workflow subagent stayed comfortably under — the fan-out is
  decomposed, the skill body is not. See clarification 16 on
  strategy-token-economy.
reading: null
gap: null
serves:
  - strategy-token-economy
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention:
  boost: 20
  override: null
  rationale: "Author-directed 2026-08-01: prioritize review-phase token/agent-
    cost reduction. Puts this tactic ahead of the undecomposed baseline and on
    par with other tier-2 improvement work, without contending with active
    reliability fixes (top-of-band ~55-61)."
phase: null
execution: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Decompose the review-fix skill body — return a compact index instead of a 26-63k-char summary, push terminal actions into subagents, and script the repeated git/grep probes

## Context

Measured over 18 review-fix runs, 2026-07-27 to 2026-07-31. The workflow's
fan-out is already well decomposed; the SKILL BODY is not.

| stage | avg peak ctx | max | over 150k |
|---|---|---|---|
| **parent review worker (skill body)** | **184,468** | 262,215 | **14 of 19** |
| find:code-review | 122,359 | 170,400 | 3 of 18 |
| residue | 108,120 | 177,314 | 2 of 17 |
| fix | 89,473 | 139,024 | 0 of 14 |
| classify | 83,434 | 130,300 | 0 of 16 |
| verify | 72,583 | 117,943 | **0 of 129** |
| dedup | 46,862 | 54,158 | 0 of 19 |

Every workflow subagent stays comfortably under 150k. Only the parent is
consistently over — 74% of its sessions.

## Unit (a) — the Workflow return payload is not compact

`.claude/skills/review-fix/SKILL.md` states the Workflow "returns a compact
disposition summary; this skill never sees raw findings." Measured, **11 of
19 runs returned 26,074 to 63,531 chars (roughly 6.5k-16k tokens)** of
summary directly into a parent context already near 150k. Largest observed
single payload: 63,531 chars.

Fix: write the full disposition to `tmp/` and return a compact index
(target <= 2k tokens) naming what is where. The filing and PR-comment steps
then read only the slices they need.

## Unit (b) — push terminal actions into subagents

Follow-up filing (Step 5) and the PR comment (Step 6) each need one slice of
the disposition data but run at full accumulated context. Move each into its
own subagent that receives only its slice.

## Unit (c) — script the repeated probes

Across 19 parent sessions the skill body issued 145 `sed -n`, 138 `grep -n`,
81 `git status`, 74 `git show`, 60 `git log`, 53 `git fetch` and 56 `wc -l`
calls, producing **2,910,753 chars of tool_result (roughly 728k tokens,
~38k per session)**.

Replace the recurring ad-hoc probes with a script emitting one structured
result, in the manner of the existing `dispatch-context-pack`. Reduces round
trips and makes the probe set consistent between runs. Reuse
`.claude/skills/dispatch-propagate/scripts/dispatch-context-pack` rather than
writing a parallel helper.

## Interaction to watch

This changes WHERE review work is measured — moving turns out of the parent
session and into subagent transcripts. tactic-token-audit-whole-session-phase-attribution
is fixing attribution for the parent session shape as it exists today.
Sequence the two, or re-baseline the audit after both land, so the
attribution fix is not evaluated against a session shape that changed
underneath it.

## Verification

- Parent review-worker peak context drops below 150k for the majority of runs
  (baseline: 14 of 19 above it).
- The Workflow return payload is under ~2k tokens in every run.
- The `dispatch:reviewed` label, follow-up filing, and PR comment all still
  land exactly once per run.
