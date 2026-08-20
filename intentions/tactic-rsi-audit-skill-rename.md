---
id: tactic-rsi-audit-skill-rename
kind: tactic
statement: Rename /dispatch-token-audit to /rsi-audit across its 134 references,
  including settings.json, the session-stamp hook, dispatch-tick and the
  instrument-invocation guard
owner: ai
status: raw
parent: null
rationale: Recorded 2026-08-12 /align round by author instruction. The audit is
  no longer a dispatch-scoped token report — it is the fleet-scoped half of
  harness self-improvement, and after tactic-audit-instrument-scoping it serves
  single-node scope too. The rename has a large blast radius that must be
  executed in one change rather than discovered piecemeal.
reading: null
serves:
  - strategy-recursive-self-improvement
  - strategy-token-economy
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: done
execution:
  branch: strategy-recursive-self-improvement
  pr: 3074
  attempts: {}
  markers: []
  strategy_fingerprint: null
  fix: null
  conflict: null
  completion:
    mergedAt: 2026-08-13T03:26:48Z
    mergeCommitSha: c3c229f0de63db09df7dc01ce02177f3d1b56c95
    graphCommitSha: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Rename /dispatch-token-audit to /rsi-audit across its 134 references, including settings.json, the session-stamp hook, dispatch-tick and the instrument-invocation guard

Recorded by the 2026-08-12 `/align` collapse round.

## Scope

Move `.claude/skills/dispatch-token-audit/` to `.claude/skills/rsi-audit/`
and set `name: rsi-audit`. Measured 2026-08-12: **134 references across 41
files**. The ones that are load-bearing rather than prose:

- `.claude/settings.json` — permission rules matching the script paths. A
  missed rule turns every audit invocation into a permission prompt.
- `.claude/hooks/stamp-dispatch-session.sh`
- `.claude/skills/dispatch-propagate/scripts/dispatch-tick`
- `.claude/skills/dispatch-propagate/scripts/dispatch-verify-instrument-invocation`
  — this one mechanically asserts the instrument was invoked; a stale path here
  fails open or fails closed, and either is worse than the rename.
- `.claude/skills/dispatch-propagate/scripts/run-unit-tests.sh` — the
  `RUN_TOKEN_AUDIT_SCRIPTS` changed-path trigger. If this is not updated the
  audit's own 257-case suite stops running in CI, silently.
- `.claude/skills/dispatch-propagate/scripts/dispatch-review-codeql`
- `.claude/workflows/qa-fix.js`
- `.claude/skills/file-issue/scripts/file-issue-usage-snapshot`
- The scripts' own internal self-references: `aggregate-usage.sh`,
  `audit-aggregate-writer.mjs`.
- Sibling skill bodies: `.claude/skills/rsi/SKILL.md` (post-rename),
  `qa-fix/references/triage-subagent.md`,
  `review-fix/references/code-review-invocation.md`,
  `.claude/docs/outcome-envelope.md`.

## Dependencies

Land after `tactic-rsi-skill-rename` only to keep the two diffs legible; there
is no mechanical dependency.

## Out of scope

Historical `intentions/*.md` references. Do not rewrite dated records.

## Verification

```verify
.claude/skills/rsi-audit/scripts/test-aggregate-usage.sh
```

```verify
.claude/skills/dispatch-propagate/scripts/run-lint.sh
```

Manual and required: run `dispatch-verify-instrument-invocation` and confirm it
still detects both an invocation and a missing one — a path-only rename can leave
it matching nothing and reporting success. Confirm `run-unit-tests.sh` still
selects the audit suite when an `rsi-audit` path changes.
