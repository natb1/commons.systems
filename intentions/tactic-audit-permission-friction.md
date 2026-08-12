---
id: tactic-audit-permission-friction
kind: tactic
statement: Measure permission friction (denials, approval round-trips, sandbox
  retries) as an audit lens, and give the attended periodic audit a closing
  /fewer-permission-prompts step
owner: ai
status: raw
parent: null
rationale: "Drafted 2026-08-12 /align round, carrying the attended-only
  execution ruling of the same day. Two halves that must ship together: the lens
  is measurable at both scopes, but the remediation is attended-only because
  .claude/settings.json sits in this repo's sandbox denyWithinAllow list and
  writing it requires an override no unattended job should hold."
reading: null
serves:
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
# Measure permission friction (denials, approval round-trips, sandbox retries) as an audit lens, and give the attended periodic audit a closing /fewer-permission-prompts step

Drafted by the 2026-08-12 `/align` round, carrying the attended-only execution
ruling recorded that day on `strategy-token-economy` ("May a token-audit surface
EXECUTE a remediation").

## Two halves, shipped together

**1. The lens (both scopes).** Permission prompts, denials, sandbox retries, and
approval round-trips per session. This doubles as the harness-documentation gap
signal: a documented rule violated repeatedly is usually a rule written badly,
so recurring adherence failures are ledger entries against the *doc*, not only
against the session.

**2. The remediation (attended only).** `/dispatch-token-audit` — human-invoked
— gains a closing step that runs `/fewer-permission-prompts`. The unattended
per-phase evaluator gets the lens and never the step.

## Why the split is mechanical, not stylistic

`.claude/settings.json` sits in this repo's sandbox `denyWithinAllow` list, so
writing it requires `dangerouslyDisableSandbox` — an attended act by
construction. A detached evaluator could not perform the write without a
standing sandbox override, and granting one to an unattended job is a larger
concession than the step is worth.

## Contract narrowing this depends on

`/dispatch-token-audit`'s step 7 report-only clause narrows to "writes no
**routing policy** and no graph or product files." The no-auto-apply bound on
routing policy (`strategy-token-economy` clarification 10 / its routing
condition) is **unchanged** and must not be loosened by this unit. Update the
SKILL.md prose so the narrowing is explicit rather than implied by a new step
contradicting an old sentence.

## Unverified — check before wiring

`/fewer-permission-prompts` is a built-in and its implementation was **not read**
when this was drafted. Before wiring the step, establish: how it merges into an
existing `.claude/settings.json`; whether it can clobber hand-authored rules;
and whether it can collide with a concurrent worker's commit of the same file.
If any answer is bad, the step becomes an ordinary dispatched change with its
own PR and review rather than an audit step.

## Also unverified

Whether permission **denials** are distinguishable from ordinary tool errors in
transcript data. The audit records `tool_errors` signatures; if denials are not
separable there, the lens needs its own extraction and this unit grows.
