---
name: ref-signal-identification
description: Signal identification reference — the parse-time classifier with categories existing_sensor/instrument/proxy, the sensor economics gate, and the signal.eval.v1 output object the align-signal-assessor (no live agent definition today) and #2372 consume.
---
# Signal Identification Reference

`.claude/docs/signal-identification.md` is the single source of truth for the
signal-identification contract. This skill is the entry point an align-signal-assessor
(#2371 structural role, Unit 4; no live agent definition today) loads before
classifying an intention node. Everything
that defines categories, the economics inequality, field shapes, and invariants lives in
that doc — this skill points at it; it does not restate it.

## When to use

Invoke when deciding what observable says an intention is met and how to read it, and
whether building or wiring a sensor is worth the cost. The align-signal-assessor role
(no live agent definition today) loads this skill before each classification; the
resulting `signal.eval.v1` output is consumed downstream by #2372, which wires the
signal arm into the align loop.

## The contract

Read `.claude/docs/signal-identification.md` before classifying. If the doc cannot be
read, state so explicitly — do not proceed from memory.

Apply the steps in order:

1. Run the [signal-identification classifier](../../docs/signal-identification.md#signal-identification-classifier)
   — test `existing_sensor` first, then `instrument`, else `proxy`. Emit a `category`
   and a mandatory `rationale` naming which test decided it. For `existing_sensor` or
   `proxy`, set `economics_verdict: "n/a"` and `economics_rationale: null`, then skip
   step 2 and proceed to step 3.
2. When `category == instrument`, run the
   [WORTH economics gate](../../docs/signal-identification.md#worth-economics-sensor-roi)
   — evaluate the sensor ROI inequality and emit `economics_verdict` (`instrument` or
   `decline`) plus `economics_rationale`.
3. Emit the [output-contract](../../docs/signal-identification.md#output-contract)
   `signal.eval.v1` object with all required fields. An object missing any always-present
   field is invalid — do not coerce defaults; re-run instead.

## Perspectives

Two perspectives feed the economics estimate, each formerly a deleted `.claude/agents/`
agent definition; the verbatim pre-deletion source is at `origin/main` commit
`44493733` under `.claude/agents/`. The doc defines exactly how each contributes to
the ROI inequality; this skill only names them:

- **FINANCIAL** — formerly the deleted `align-financial` agent definition; estimates
  `build`, `run`, `decision_value`, and `decision_frequency`.
- **TECHNICAL** — formerly the deleted `align-technical` agent definition; estimates
  `maintenance` and holds a "safe to abandon" concern on a sensor that would rot if
  left untouched.
