---
id: tactic-graph-commit
kind: tactic
statement: "graph-commit primitive: validated single-node writes direct-pushed
  to main with rebase-retry, restricted to intentions/; CI fast path for
  intentions/-only pushes"
owner: ai
status: codified
parent: tactic-graph-native-dispatch
rationale: "The strategy's write path (clarification 2): one primitive for every
  graph write — skills, router, reconciler, sensors. The interview is the audit;
  the push makes records schedulable."
reading: null
gap: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: done
execution:
  branch: tactic-graph-commit
  pr: 2750
  attempts: {}
  markers:
    - unit-1-merged:2750
    - unit-2-merged:2748
  strategy_fingerprint: null
validates: []
blocked_by:
  - tactic-graph-dispatch-schema
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# graph-commit primitive: validated single-node writes direct-pushed to main with rebase-retry, restricted to intentions/; CI fast path for intentions/-only pushes

## Context

Clarification 2 on `strategy-graph-native-dispatch`: one write path for
every graph edit — a single-node commit direct-pushed to main with
rebase-retry, restricted to `intentions/` paths. Every later writer
(skills, router, reconciler, sensors) calls this primitive. Recipe:
`intentions/tactic-graph-native-dispatch.md` §1.2.

## Unit 1 — the graph-commit script

**Status:** merged 2026-07-04 via this PR (#2750). Live-verified against the
real repo before merge: the script landed a real commit end to end (commit
→ stamp on a `graph/**` scratch branch → poll checks → fast-forward to
`main`). A first live run surfaced a real idempotency gap — a local commit
that landed but failed to push (an unrelated dirty `package-lock.json`
blocked the rebase step) made a bare re-invocation misdiagnose "already at
the desired state" — fixed so the script is safely re-invocable after a
partial failure.

**Recommended model:** opus

Scope: new `packages/intentionsutil/scripts/graph-commit` (bash):
- Args: one or more node ids whose content was already written via
  `packages/intentionsutil/scripts/write-node.ts` (the single validation
  gate); graph-commit stages only `intentions/<id>.md` for those ids.
- Guard: fail loudly if the commit set would include any path outside
  `intentions/`.
- Loop: commit → `git pull --rebase origin main` → `git push origin
  HEAD:main`; on push reject, retry bounded (5); on rebase conflict —
  same-node concurrent edit — re-read, re-apply once, retry; if the
  semantic conflict survives, park the writer's target node
  (`office_hours: {reason, since}`) and exit non-zero.
- Follow `.claude/rules/shell-json.md`: never `echo "$VAR" | jq`.

Out of scope: converting callers (sibling tactics adopt the primitive).

## Unit 2 — CI fast path for intentions/-only pushes

**Status:** merged 2026-07-04 via this PR (#2748).

**Recommended model:** sonnet

Independent of Unit 1 (parallel-safe) — shipped ahead of it since Unit 1
remains blocked by `tactic-graph-dispatch-schema`.

Scope (per the 2026-07-03 branch-protection decision, strategy
clarification 16):
- New `.github/workflows/graph-fast-path.yml`, `on: push:
  branches: ['graph/**']`: a `guard` job that hard-fails unless `git diff
  --name-only origin/main...HEAD` is non-empty and entirely under
  `intentions/`, then runs graph validation (`listNodes` + `validateGraph`;
  import pattern as in `packages/intentionsutil/scripts/write-node.ts`);
  then four jobs named exactly `acceptance`, `preview-and-smoke`, `lint`,
  `unit-tests`, each `needs: guard`, each a trivial success — they stamp
  the ruleset's required contexts on the SHA so it can be fast-forwarded
  to main.
- `.github/workflows/unit-tests.yml`: add `graph/**` to `branches-ignore`
  (no duplicate contexts, no wasted heavy CI on scratch pushes).
- Push-triggered workflows on main (`prod-deploy.yml` etc.): ensure
  `intentions/**`-only pushes trigger no deploys (`paths-ignore`).
- `pr-checks.yml` untouched — PRs keep full CI.

## Dependencies

- `tactic-graph-dispatch-schema` — parking writes the first-class
  `office_hours` field.
- `tactic-intentions-branch-protection` — resolved 2026-07-03: no settings
  change; main's ruleset (required checks only, no PR requirement) accepts
  a direct push of any SHA carrying the four passing contexts. Unit 2 below
  is the mechanism — the fast path runs on `graph/**` scratch branches and
  stamps the required contexts (`acceptance`, `preview-and-smoke`, `lint`,
  `unit-tests`) on intentions/-only SHAs, which are then fast-forwarded to
  main. See strategy clarification 16.

## Reuse

- `write-node.ts` remains the only content writer; graph-commit never edits
  markdown itself.
- Bounded-retry shape mirrors `gh_retry` in
  `.claude/skills/dispatch-propagate/scripts/lib.sh`.

## Verification

```verify
npm test --prefix packages/intentionsutil
```

Manual: in a scratch clone with a local bare remote, run two concurrent
graph-commits — different nodes (both land) and the same node (second
rebases cleanly or parks). Live: one `intentions/`-only push to origin main
lands and CI runs only the fast path.

## Implementation notes

Implement each unit in a subagent with `model` per the unit tag; supply this
Context and the unit's Scope; constrain to working-tree edits.
