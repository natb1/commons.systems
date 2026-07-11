---
id: tactic-review-phase-trust-builtin-review
kind: tactic
statement: "review phase trusts /code-review max + /security-review built-in
  fix: drop the findings-only wrapper and the adversarial-verify/opus-fix
  pipeline for those two sources, run both on opus with defaults, opus subagent
  classifies and files only the unfixed residue"
owner: ai
status: raw
parent: null
rationale: Surfaced 2026-07-11 /align-strategy interview
  (strategy-graph-native-dispatch new clarification refining clarification 19).
  The review phase currently double-wraps /code-review as a findings-only sonnet
  finder feeding a separate verify/fix pipeline; the author directs trusting the
  review skills' own built-in review+fix instead.
reading: null
gap: null
serves:
  - strategy-graph-native-dispatch
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
# review phase trusts /code-review max + /security-review built-in fix: drop the findings-only wrapper and the adversarial-verify/opus-fix pipeline for those two sources, run both on opus with defaults, opus subagent classifies and files only the unfixed residue

> Draft context retained by `/align-strategy` on 2026-07-11 — not yet a
> finalized unit plan. `/align-tactics` decomposes this into PR-sized units.

## Context

`strategy-graph-native-dispatch`'s 2026-07-11 clarification (refining
clarification 19) directs the review phase to **trust `/code-review max` and
`/security-review`'s own built-in review-and-fix** rather than re-wrapping them.

Today `review-fix.js` wraps `/code-review` as a **findings-only sonnet finder**
(`.claude/workflows/review-fix.js:322-331`, prompt "You are a findings-only
code-review subagent"; the same for security at `:333-343`), normalizes their
output to a schema, and feeds it through a **separate** dedup → classify →
adversarial-verify (`:660-720`) → opus-fix fan-out (`:800-830`) pipeline. That
double-wraps skills that already review-and-fix on their own.

## Scope (to be decomposed by /align-tactics)

- **Run both skills with their defaults, on opus.** `/code-review max` and
  `/security-review`, letting them apply their own edits ("work with whatever
  they output/edit"). Drop the `findings-only` framing lines
  (`review-fix.js:324,335`).
- **Drop the separate verify/fix pipeline FOR those two sources** — they carry
  their own verification. The adversarial-verify and opus-fix stages no longer
  act on code-review/security-review findings.
- **Classify only the unfixed residue.** An **opus** subagent classifies what
  the skills did not auto-fix and files follow-ups through the **pre-existing**
  classify → defer → file logic (`review-fix.js:548-640`, `:863-` deferred
  filings). Reuse it; do not reinvent it.
- **Explicitly out of scope — do not modify other review steps.** Dedup,
  deferred-filing, the PR-comment audit trail, and any non-code-review/security
  finders stay exactly as they are. This does not change clarification 19's
  three-way disposition doctrine — only the finder/verify mechanics for these
  two sources.

## Open question for /align-tactics

`review-fix.js`'s adversarial-verify/opus-fix stages may also serve non-
code-review sources (domain security finders at `:346-370`). Decomposition must
scope the pipeline removal to the code-review + `/security-review` sources only,
leaving any other finder's path intact.
