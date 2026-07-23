---
id: tactic-test-integrity-proxy-guard-rule
kind: tactic
statement: "Amend .claude/rules/test-integrity.md with a scoped proxy-guard
  section: when a content guard fails because guarded content legitimately
  moved, evaluate re-pointing the guard at its enforcing mechanism before
  restoring the literal"
owner: ai
status: raw
parent: null
rationale: "Byproduct of the 2026-07-21 /align-strategy interview on the
  expedient-over-correct fix pattern (PR #2927 live case). The doctrine is
  recorded as a clarification on strategy-autonomous-execution; this tactic
  carries its enforcement into .claude/rules/test-integrity.md, which loads into
  every session -- covering fix-checks, qa-fix, review-fix, and interactive
  fixes alike (the author considered and declined a fix-checks-only amendment as
  insufficient coverage)."
reading: null
gap: null
serves:
  - strategy-autonomous-execution
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
# Amend .claude/rules/test-integrity.md with a scoped proxy-guard section: when a content guard fails because guarded content legitimately moved, evaluate re-pointing the guard at its enforcing mechanism before restoring the literal

## Interview context (2026-07-21 /align-strategy round)

Add a new section to `.claude/rules/test-integrity.md` (which currently covers
only the weakening direction: "fix the code or escalate — never weaken the
test"). The section is **scoped to proxy guards** — content greps and similar
surface checks standing in for a mechanism enforced elsewhere (e.g.
`test-dispatch-scripts.sh` content guards grepping skill prose for doctrine
literals). It must NOT be a broad license to redesign ordinary failing tests,
which stay wholly under the existing never-weaken doctrine.

Rule substance to encode:

1. When such a guard fails because the guarded content **legitimately moved**
   (refactor, file-thinning, relocation), first ask what invariant the guard
   protects and where that invariant is really enforced — before asking how to
   restore the string.
2. **Autonomous re-pointing safeguard pair**: re-pointing the guard at the
   enforcing mechanism is permitted only when (a) the mechanism is identified,
   and (b) the re-pointed guard is demonstrated load-bearing — mutate the
   mechanism (e.g. `sed` a temp copy), watch the guard fail.
3. **Fallback when uncertain**: restore the guarded content, but record the
   proxy-restore explicitly in the PR comment / fix-checks accumulator so a
   human sees it. Silent restoration is the failure mode, not restoration.

Worked live case for the rule's example text: PR #2927 thinned
`review-fix/SKILL.md`, moving the `model: opus` literal into `references/`;
the guard at `test-dispatch-scripts.sh` (review-fix Opus fix-authoring pin,
#1172) failed; the first fix restored the literal to the thinned body
(expedient); the correct fix re-pointed the guard at
`.claude/workflows/review-fix.js`, the runtime file whose `agent()` calls
actually enforce the pin, verified load-bearing via a mutate-and-watch test.

Doctrine home: strategy-autonomous-execution, clarification dated 2026-07-21
(expedient-over-correct is the dual of test-weakening). The author chose the
rules file over a fix-checks-only amendment because rules load into every
session — fix-checks, qa-fix, review-fix, and interactive fixes alike.

Note for the implementer: `.claude/rules/` and `.claude/skills/` are sandbox
read-only carve-outs and agent-behavior config — the COMMIT of such edits may
require an interactive author grant (see memory: hook/skill edits blocked in
auto mode).
