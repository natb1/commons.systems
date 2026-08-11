---
id: tactic-rsi-plan-render-pause-block
kind: tactic
statement: Render the dispatch pause and its resume criteria into rsi-plan.md
  from attributes.pause, so the pause state is readable where the plan is read
owner: ai
status: raw
parent: null
rationale: "strategy-recursive-self-improvement's pause/resume condition
  requires every pause to record mechanically evaluable resume criteria as
  structured data RENDERED INTO rsi-plan.md, and calls a pause without that a
  defect. The 2026-08-11 rsi iteration landed the structured half —
  attributes.pause on strategy-recursive-self-improvement, five criteria each
  with a check, a status, and a dated measurement — but render-rsi-plan.ts does
  not know the field, so rsi-plan.md still shows the pause only as a phrase
  inside a prose queue summary. Until this lands the condition is
  half-discharged: the criteria exist but not where the author reads the plan."
reading: null
serves:
  - strategy-rsi-plan-surface
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: implement
execution: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Render the dispatch pause and its resume criteria into rsi-plan.md from attributes.pause, so the pause state is readable where the plan is read

## Context

`strategy-recursive-self-improvement`'s pause/resume condition says every pause
"records explicit, mechanically evaluable resume criteria as structured data
rendered into rsi-plan.md — a pause with no recorded resume criterion, or with
prose-only criteria no check can evaluate, is a defect."

Before 2026-08-11 the criteria for the standing pause lived in exactly one
place: an untracked prototype plan file outside the repo
(`~/.claude/plans/task-notification-…-lucky-parasol.md`, §0), which
`rsi-plan.md` §7 already carries as a bootstrap-only external ledger. Nothing in
the graph held them, and the pause sentinel itself is a zero-byte file. So the
strategy's own success threshold — "dispatch runs unpaused with the recorded
resume criteria held" — referred to something the graph did not contain and no
check could evaluate.

The 2026-08-11 rsi iteration landed the structured half:
`attributes.pause` on `strategy-recursive-self-improvement` now carries `state`,
`since`, `mechanism`, `authority`, `reason`, `last_measured`, `decision`, a
`status_values` legend, a `self_blocking` note, and `resume_criteria` — five
entries, each with `id`, `criterion`, `check`, `status`
(`holds` | `fails` | `partial` | `unknown`), and a dated `measured`.

This unit is the other half: make `rsi-plan.md` show it. Until then the author
reads a plan whose only mention of the pause is a phrase inside a prose queue
summary, and the condition stays half-discharged.

## Scope

One unit. **Recommended model: sonnet** — an additive renderer section against a
schema already fixed by the landed data, with an existing test suite.

**Changes:**

- `packages/intentionsutil/src/rsi.ts` — read `attributes.pause` from
  `strategy-recursive-self-improvement` and expose it in the render model.
  Treat every field as optional: a node with no `attributes.pause` is the
  not-paused case and must render cleanly, not throw.
- `packages/intentionsutil/scripts/render-rsi-plan.ts` — emit a pause section.
  Place it **before** the dispatch queue section (§2), because whether dispatch
  is running governs how every number below it should be read. Show `state`,
  `since`, `decision`, and `last_measured` as a header line, then one table row
  per criterion: `id`, `status`, `criterion`, `measured`. Render
  `self_blocking` if present — it is the part a reader most needs and the part
  prose summaries lose.
- `packages/intentionsutil/test/rsi.test.ts` — cases below.

**Out of scope:**

- Deciding, lifting, or applying a pause. This unit renders; `/rsi` decides.
- Measuring the criteria, or any script that evaluates `check` automatically.
  Worth doing later, but a renderer that silently re-measures would make the
  rendered `status` disagree with the recorded one.
- Changing the sentinel mechanism, or the `dispatch.config` boolean that
  `tactic-dispatch-pause-config-field` will introduce. When that lands, `state`
  should be derived rather than recorded — out of scope here.
- Retiring the §7 external-ledger entry. That is a separate judgment: the
  ledger still carries invariant residue beyond the pause criteria.

## Dependencies

None. `attributes.pause` is already on `origin/main` (landed 2026-08-11), so the
data this renders exists today.

## Reuse

- `packages/intentionsutil/src/rsi.ts` — the existing `WORKFLOW_SKILLS` fold and
  queue-summary readers; follow their shape for reading an optional attribute
  off a strategy node.
- `packages/intentionsutil/scripts/render-rsi-plan.ts` — the existing section
  emitters (§2's queue summary, §4's metrics table). Match their table idiom and
  their "derived, never hand-edited" header convention.
- `packages/intentionsutil/test/rsi.test.ts` — existing fixtures and assertion
  style.

## Verification

Cases: a node with a full `attributes.pause` renders every criterion with its
status; a node with no `attributes.pause` renders the not-paused case and does
not throw; a criterion missing an optional field still renders; and
`self_blocking`, when present, appears in the output.

```verify
npx vitest run --project intentionsutil --root .
```

```verify
.claude/skills/dispatch-propagate/scripts/run-lint.sh
```

Manual: re-render and confirm the pause section shows all five criteria of the
standing pause with statuses `fails`, `holds`, `partial`, `unknown`, `unknown`,
and that `render-rsi-plan.ts --check` behaves as before. Note that `--check`
cannot pass immediately after a landing — the header records the `origin/main`
sha it read, and pushing moves it; that is pre-existing and not this unit's to
fix.
