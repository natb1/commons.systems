---
id: tactic-eval-finding-type-safety-marker-invisible-at-write-time
kind: tactic
statement: The type-safety-ok suppression marker the type-safety-sensor CI check
  requires is documented in no rule, doc or skill and is run by no local gate,
  so the only agents that learn it are the ones already reading a CI failure —
  both fix attempts on this node were nothing but a missing marker
owner: ai
status: raw
parent: null
rationale: Auto-created by dispatch-eval-finding as an evaluation finding ledger
  entry. Similar findings MERGE into this node — a recurrence updates
  attributes.measured_impact, never mints a second node. See the body for the
  finding.
reading: null
serves:
  - strategy-recursive-self-improvement
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
pace_exempt: true
rounds: null
attributes:
  ledger_entry: true
  first_seen: 2026-08-13
  measured_impact:
    - metric: fix_attempts_caused_by_missing_marker
      value: 2
      unit: of 2 attempts
      window: tactic-attention-namespaced-rank 2026-08-13
      sensor: rsi
      measured: 2026-08-13
    - metric: instruction_sources_documenting_marker
      value: 0
      unit: files
      window: .claude/rules + CLAUDE.md + docs + skills 2026-08-13
      sensor: rsi
      measured: 2026-08-13
    - metric: local_gates_running_the_check
      value: 0
      unit: gates
      window: run-lint.sh + pre-commit hooks 2026-08-13
      sensor: rsi
      measured: 2026-08-13
    - metric: cost_per_occurrence_price_proxy_usd
      value: 31.6646295
      unit: usd
      window: tactic-attention-namespaced-rank fix attempt 2 2026-08-13
      sensor: aggregate-usage.sh
      measured: 2026-08-13
    - metric: recurrence_count
      value: 1
      unit: occurrences
      window: all-time
      sensor: rsi
      measured: 2026-08-13
---
## The `// type-safety-ok:` convention exists only in CI and in already-fixed code

Observed 2026-08-13 on `tactic-attention-namespaced-rank`. **Both** fix attempts
on this node were caused entirely by a missing `type-safety-ok` suppression
marker, and both were discovered only by the `type-safety-sensor` CI job:

- attempt 1, commit `bb734ee1` (2026-08-13T02:09Z) — "a type-safety-sensor
  false-positive on a JSDoc comment, a legitimate non-null assertion in a test
  needing the standard suppression marker"
- attempt 2, commit `4f979ad8` (2026-08-13T18:15Z) — two same-line
  `// type-safety-ok:` comments added to
  `packages/intentionsutil/test/store.test.ts`; the whole commit is those two
  comments

### The convention is undiscoverable at write time

Positive control before recording absence — `grep -rl "type-safety-ok"` over the
repo (excluding `node_modules`/`.git`) **does** return matches, 10+ source files
including `packages/intentionsutil/src/node-merge.ts`,
`packages/firestoreutil/test/bounded-query.test.ts` and
`packages/blog/test/home-region.test.tsx`. The search sees. What it does not
find is any instruction:

- `.claude/rules/` — no match
- `CLAUDE.md` — no match
- `docs/` — no match
- `.claude/skills/*/SKILL.md` — no match (the only skill-tree hits are five
  `review-fix-*-probe.mjs` scripts that carry the marker in their own code)

The enforcing script `.github/scripts/check-type-safety-escapes.sh` is referenced
only from `.github/workflows/pr-checks.yml` and `.github/workflows/unit-tests.yml`.
No local wrapper runs it — `.claude/skills/dispatch-propagate/scripts/run-lint.sh`
does not call it — and there is no pre-commit hook (`.husky/` absent,
`.git/hooks/` empty of non-samples).

So the only agents that learn the convention are the ones reading a CI failure.
An agent writing a deliberately-malformed test fixture — an `/implement-unit`
subagent, a `/review-fix` fix subagent — has no instruction telling it the marker
exists, and cannot find out locally before pushing.

### Cost per occurrence

Each omission costs a full ladder round trip rather than a one-line edit: for
attempt 2 that was ~14 min of ci-wait polling plus review-stall diagnosis, then a
97-turn fix worker at **$31.66 price proxy / $6.33 cost**, 612 s — to add two
comments.

### What would have to change

Make the convention reachable before the push: a `.claude/rules/` entry naming
the marker and its same-line form, and/or wiring
`.github/scripts/check-type-safety-escapes.sh` into the local lint bundle that
implementing agents already run. Which of the two, and whether the check becomes
a commit gate, is the author's call.
