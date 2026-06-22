---
name: ref-delegability
description: Delegability evaluation reference — the CAN/SHOULD owner-recommendation contract a delegability-assessor applies to an intention node; defines categories a/b/c, the push-down ROI rule, and the output object the dialectic engine consumes.
---
# Delegability Evaluation Reference

`.claude/docs/delegability.md` is the single source of truth for the delegability
contract. This skill is the entry point a delegability-assessor (#2370 structural
role) loads before classifying an intention node. Everything that defines categories,
formulas, field shapes, and invariants lives in that doc — this skill points at it;
it does not restate it.

## When to use

Invoke when deciding who should own an intention node (human / AI / procedure) and
whether to push ownership down the human → AI → procedure continuum. The #2370
delegability-assessor role loads this skill before each classification; the resulting
output object is consumed downstream by the dialectic engine.

## The contract

Read `.claude/docs/delegability.md` before classifying. If the doc cannot be read,
state so explicitly — do not proceed from memory.

Apply the steps in order:

1. Run the [CAN classifier](../../docs/delegability.md#can-classifier-feasibility) —
   test `a` first, then `b`, else `c`. Emit a `can_category` and a mandatory
   `rationale` naming which test decided it.
2. When `can_category` ≠ `c`, run
   [SHOULD economics](../../docs/delegability.md#should-economics-push-down-roi) —
   evaluate the ROI inequality and emit `roi_verdict` (`push_down` or `decline`) plus
   `roi_rationale`.
3. Check the consistency / veto layer. A push-down that survives CAN and SHOULD is
   still declined if the auditor perspective vetoes it.
4. Emit the [output contract](../../docs/delegability.md#output-contract) object with
   all required fields. An object missing any always-present field is invalid — do not
   coerce defaults; re-run instead.

## Perspectives

Three reused agents feed the evaluation. The doc defines exactly how each feeds the
ROI inequality and the consistency check; this skill only names them:

- **FINANCIAL** — `.claude/agents/roadmap-finance.md`; estimates the left-side costs
  (`build`, `run`, `manual_cost`, `frequency`).
- **TECHNICAL** — `.claude/agents/roadmap-engineering.md`; estimates `maintenance`
  and holds a veto if the codified artifact would not be safe to abandon.
- **Auditor** — `.claude/agents/roadmap-auditor.md`; the consistency veto layer that
  checks charter compliance and ratchet risk.
